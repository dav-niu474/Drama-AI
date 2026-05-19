import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

// 从数据库读取模型配置
async function getModelConfig(category: string): Promise<Record<string, unknown>> {
  try {
    const record = await db.modelConfig.findUnique({ where: { category } })
    if (record) return JSON.parse(record.config)
  } catch { /* fallback to defaults */ }
  return {}
}

// 清理过期任务（超过1小时的processing任务视为失败）
async function cleanStaleTasks() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    await db.videoTask.updateMany({
      where: {
        status: 'processing',
        createdAt: { lt: oneHourAgo },
      },
      data: {
        status: 'failed',
        error: '任务超时',
      },
    })
  } catch {
    // Best effort cleanup
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, image_url, quality, duration, with_audio, size, fps, sceneId } = await req.json()

    if (!prompt && !image_url) {
      return NextResponse.json({ error: '请提供视频描述或图片' }, { status: 400 })
    }

    // 清理过期任务
    await cleanStaleTasks()

    // 读取视频生成配置
    const videoConfig = await getModelConfig('video')

    // 处理图片URL：如果是 base64 data URL，尝试先上传或转换
    // 由于视频API通常不支持 base64 data URL，当只有图片没有文字描述时，补充一个默认prompt
    let finalImageUrl = image_url
    let finalPrompt = prompt || ''

    if (image_url && image_url.startsWith('data:')) {
      // 视频API不支持base64 data URL，需要回退
      // 策略：移除base64图片，使用文字描述代替
      finalImageUrl = undefined
      if (!finalPrompt) {
        // 尝试从场景描述中获取prompt
        if (sceneId) {
          try {
            const scene = await db.dramaScene.findUnique({ where: { id: sceneId } })
            if (scene?.description) {
              finalPrompt = `${scene.description}, cinematic, high quality, animate with natural motion`
            }
          } catch {
            // fallback
          }
        }
        if (!finalPrompt) {
          finalPrompt = 'Animate this scene with natural motion, cinematic quality'
        }
      }
    }

    const zai = await ZAI.create()

    // 创建视频生成任务
    const createParams: Record<string, unknown> = {
      prompt: finalPrompt || 'Animate this scene with natural motion',
      quality: quality || (videoConfig.defaultQuality as string) || 'speed',
      duration: duration || (videoConfig.defaultDuration as number) || 5,
      fps: fps || (videoConfig.defaultFps as number) || 30,
      size: size || (videoConfig.defaultSize as string) || '1920x1080',
      with_audio: with_audio !== undefined ? with_audio : ((videoConfig.withAudio as boolean) || false),
    }

    // 只有当图片URL是真实URL时才传入
    if (finalImageUrl && !finalImageUrl.startsWith('data:')) {
      createParams.image_url = finalImageUrl
    }

    const task = await zai.video.generations.create(createParams)

    // 保存任务状态到数据库
    await db.videoTask.create({
      data: {
        taskId: task.id,
        status: 'processing',
        prompt: finalPrompt,
      },
    })

    // 启动轮询（后台）
    pollTask(task.id, zai)

    return NextResponse.json({
      success: true,
      taskId: task.id,
      status: 'processing'
    })
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建视频任务失败' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: '请提供任务ID' }, { status: 400 })
    }

    // 从数据库获取任务信息
    const taskInfo = await db.videoTask.findUnique({ where: { taskId } })

    if (!taskInfo) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    // 如果还在处理中，查询实际状态
    if (taskInfo.status === 'processing') {
      const zai = await ZAI.create()
      try {
        const result = await zai.async.result.query(taskId)

        if (result.task_status === 'SUCCESS') {
          const videoUrl = result.video_result?.[0]?.url ||
                          result.video_url ||
                          result.url ||
                          result.video

          await db.videoTask.update({
            where: { taskId },
            data: {
              status: 'success',
              videoUrl: videoUrl || '',
            },
          })

          return NextResponse.json({
            taskId,
            status: 'success',
            videoUrl
          })
        } else if (result.task_status === 'FAIL') {
          await db.videoTask.update({
            where: { taskId },
            data: {
              status: 'failed',
              error: '视频生成失败',
            },
          })

          return NextResponse.json({
            taskId,
            status: 'failed',
            error: '视频生成失败'
          })
        }
      } catch {
        // 继续等待
      }
    }

    return NextResponse.json({
      taskId,
      status: taskInfo.status,
      videoUrl: taskInfo.videoUrl,
      error: taskInfo.error
    })
  } catch (error) {
    console.error('Query video status error:', error)
    return NextResponse.json(
      { success: false, error: '查询任务状态失败' },
      { status: 500 }
    )
  }
}

async function pollTask(taskId: string, zai: any) {
  const maxPolls = 60
  const pollInterval = 8000

  for (let i = 0; i < maxPolls; i++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval))

    try {
      const result = await zai.async.result.query(taskId)

      if (result.task_status === 'SUCCESS') {
        const videoUrl = result.video_result?.[0]?.url ||
                        result.video_url ||
                        result.url ||
                        result.video

        await db.videoTask.update({
          where: { taskId },
          data: {
            status: 'success',
            videoUrl: videoUrl || '',
          },
        })
        break
      } else if (result.task_status === 'FAIL') {
        await db.videoTask.update({
          where: { taskId },
          data: {
            status: 'failed',
            error: '视频生成失败',
          },
        })
        break
      }
    } catch (error) {
      console.error(`Poll error for task ${taskId}:`, error)
    }
  }
}
