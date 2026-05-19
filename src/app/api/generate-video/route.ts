import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getModelConfig, resolveApiKey } from '@/lib/model-config'

// 清理过期任务（超过1小时的processing任务视为失败）
async function cleanStaleTasks() {
  try {
    const { db } = await import('@/lib/db')
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
    const modelConf = await getModelConfig('video')
    const provider = modelConf?.provider || 'z-ai'
    const modelId = modelConf?.modelId || 'default'
    const videoConfig = modelConf?.config || {}

    // 处理图片URL：如果是 base64 data URL，尝试先上传或转换
    let finalImageUrl = image_url
    let finalPrompt = prompt || ''

    if (image_url && image_url.startsWith('data:')) {
      finalImageUrl = undefined
      if (!finalPrompt) {
        if (sceneId) {
          try {
            const { db } = await import('@/lib/db')
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

    // Route to appropriate provider
    if (provider === 'siliconflow') {
      return await callSiliconFlowVideo(
        modelId, finalPrompt, finalImageUrl,
        quality || (videoConfig.defaultQuality as string) || 'speed',
        duration || (videoConfig.defaultDuration as number) || 5,
        size || (videoConfig.defaultSize as string) || '1920x1080',
        modelConf?.apiKey,
      )
    } else if (provider === 'replicate') {
      return await callReplicateVideo(
        modelId, finalPrompt, finalImageUrl,
        duration || (videoConfig.defaultDuration as number) || 5,
        modelConf?.apiKey,
      )
    } else {
      // Default: z-ai
      return await callZaiVideo(
        finalPrompt, finalImageUrl,
        quality || (videoConfig.defaultQuality as string) || 'speed',
        duration || (videoConfig.defaultDuration as number) || 5,
        fps || (videoConfig.defaultFps as number) || 30,
        size || (videoConfig.defaultSize as string) || '1920x1080',
        with_audio !== undefined ? with_audio : ((videoConfig.withAudio as boolean) || false),
      )
    }
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建视频任务失败' },
      { status: 500 },
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

    const { db } = await import('@/lib/db')
    const taskInfo = await db.videoTask.findUnique({ where: { taskId } })

    if (!taskInfo) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    // 如果还在处理中，查询实际状态
    if (taskInfo.status === 'processing') {
      // Try z-ai polling for backwards compatibility
      try {
        const zai = await ZAI.create()
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
            videoUrl,
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
            error: '视频生成失败',
          })
        }
      } catch {
        // Continue waiting - might be a non-zai task
      }
    }

    return NextResponse.json({
      taskId,
      status: taskInfo.status,
      videoUrl: taskInfo.videoUrl,
      error: taskInfo.error,
    })
  } catch (error) {
    console.error('Query video status error:', error)
    return NextResponse.json(
      { success: false, error: '查询任务状态失败' },
      { status: 500 },
    )
  }
}

// ── Provider-specific call functions ────────────────────────

async function callZaiVideo(
  prompt: string,
  imageUrl: string | undefined,
  quality: string,
  duration: number,
  fps: number,
  size: string,
  withAudio: boolean,
): Promise<NextResponse> {
  const { db } = await import('@/lib/db')
  const zai = await ZAI.create()

  const createParams: Record<string, unknown> = {
    prompt: prompt || 'Animate this scene with natural motion',
    quality,
    duration,
    fps,
    size,
    with_audio: withAudio,
  }

  if (imageUrl && !imageUrl.startsWith('data:')) {
    createParams.image_url = imageUrl
  }

  const task = await zai.video.generations.create(createParams)

  await db.videoTask.create({
    data: {
      taskId: task.id,
      status: 'processing',
      prompt,
    },
  })

  pollTask(task.id, zai)

  return NextResponse.json({
    success: true,
    taskId: task.id,
    status: 'processing',
  })
}

async function callSiliconFlowVideo(
  modelId: string,
  prompt: string,
  imageUrl: string | undefined,
  quality: string,
  duration: number,
  size: string,
  userApiKey?: string,
): Promise<NextResponse> {
  const apiKey = resolveApiKey('siliconflow', userApiKey)
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'SiliconFlow API Key 未配置' },
      { status: 400 },
    )
  }

  const { db } = await import('@/lib/db')

  // Parse size
  const [widthStr, heightStr] = size.split('x')
  const width = parseInt(widthStr) || 1920
  const height = parseInt(heightStr) || 1080

  const response = await fetch('https://api.siliconflow.cn/v1/video/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      prompt: prompt || 'Animate this scene',
      image_url: imageUrl || undefined,
      width,
      height,
      duration,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    return NextResponse.json(
      { success: false, error: `SiliconFlow API 错误 (${response.status}): ${errorBody}` },
      { status: response.status },
    )
  }

  const data = await response.json()
  const taskId = data.requestId || data.id || data.task_id

  if (!taskId) {
    return NextResponse.json(
      { success: false, error: 'SiliconFlow 未返回任务ID' },
      { status: 500 },
    )
  }

  await db.videoTask.create({
    data: {
      taskId,
      status: 'processing',
      prompt,
    },
  })

  return NextResponse.json({
    success: true,
    taskId,
    status: 'processing',
  })
}

async function callReplicateVideo(
  modelId: string,
  prompt: string,
  imageUrl: string | undefined,
  duration: number,
  userApiKey?: string,
): Promise<NextResponse> {
  const apiKey = resolveApiKey('replicate', userApiKey)
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'Replicate API Key 未配置' },
      { status: 400 },
    )
  }

  const { db } = await import('@/lib/db')

  const input: Record<string, unknown> = {
    prompt: prompt || 'Animate this scene',
    duration,
  }
  if (imageUrl && !imageUrl.startsWith('data:')) {
    input.image_url = imageUrl
  }

  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: modelId,
      input,
    }),
  })

  if (!createResponse.ok) {
    const errorBody = await createResponse.text()
    return NextResponse.json(
      { success: false, error: `Replicate API 错误 (${createResponse.status}): ${errorBody}` },
      { status: createResponse.status },
    )
  }

  const prediction = await createResponse.json()
  const taskId = prediction.id

  await db.videoTask.create({
    data: {
      taskId,
      status: 'processing',
      prompt,
    },
  })

  return NextResponse.json({
    success: true,
    taskId,
    status: 'processing',
  })
}

async function pollTask(taskId: string, zai: unknown) {
  const maxPolls = 60
  const pollInterval = 8000

  for (let i = 0; i < maxPolls; i++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval))

    try {
      const zaiClient = zai as { async: { result: { query: (id: string) => Promise<Record<string, unknown>> } } }
      const result = await zaiClient.async.result.query(taskId)

      if (result.task_status === 'SUCCESS') {
        const { db } = await import('@/lib/db')
        const videoUrl = (result.video_result as Array<{ url: string }>)?.[0]?.url ||
                        (result.video_url as string) ||
                        (result.url as string) ||
                        (result.video as string)

        await db.videoTask.update({
          where: { taskId },
          data: {
            status: 'success',
            videoUrl: videoUrl || '',
          },
        })
        break
      } else if (result.task_status === 'FAIL') {
        const { db } = await import('@/lib/db')
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
