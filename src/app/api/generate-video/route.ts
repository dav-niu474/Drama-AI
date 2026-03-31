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

// 内存中的任务状态管理
const taskStore = new Map<string, {
  status: 'processing' | 'success' | 'failed'
  videoUrl?: string
  error?: string
  createdAt: number
  prompt?: string
}>()

export async function POST(req: NextRequest) {
  try {
    const { prompt, image_url, quality, duration, with_audio, size, fps } = await req.json()

    if (!prompt && !image_url) {
      return NextResponse.json({ error: '请提供视频描述或图片' }, { status: 400 })
    }

    // 读取视频生成配置
    const videoConfig = await getModelConfig('video')

    const zai = await ZAI.create()

    // 创建视频生成任务
    const task = await zai.video.generations.create({
      prompt: prompt || 'Animate this scene with natural motion',
      image_url: image_url,
      quality: quality || (videoConfig.defaultQuality as string) || 'speed',
      duration: duration || (videoConfig.defaultDuration as number) || 5,
      fps: fps || (videoConfig.defaultFps as number) || 30,
      size: size || (videoConfig.defaultSize as string) || '1920x1080',
      with_audio: with_audio !== undefined ? with_audio : ((videoConfig.withAudio as boolean) || false),
    })

    // 保存任务状态
    taskStore.set(task.id, {
      status: 'processing',
      createdAt: Date.now(),
      prompt: prompt
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

    const taskInfo = taskStore.get(taskId)

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
          
          taskStore.set(taskId, {
            ...taskInfo,
            status: 'success',
            videoUrl: videoUrl
          })
          
          return NextResponse.json({
            taskId,
            status: 'success',
            videoUrl
          })
        } else if (result.task_status === 'FAIL') {
          taskStore.set(taskId, {
            ...taskInfo,
            status: 'failed',
            error: '视频生成失败'
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
        
        const taskInfo = taskStore.get(taskId)
        if (taskInfo) {
          taskStore.set(taskId, {
            ...taskInfo,
            status: 'success',
            videoUrl
          })
        }
        break
      } else if (result.task_status === 'FAIL') {
        const taskInfo = taskStore.get(taskId)
        if (taskInfo) {
          taskStore.set(taskId, {
            ...taskInfo,
            status: 'failed',
            error: '视频生成失败'
          })
        }
        break
      }
    } catch (error) {
      console.error(`Poll error for task ${taskId}:`, error)
    }
  }
}
