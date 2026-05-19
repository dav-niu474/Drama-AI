import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getModelConfig, resolveApiKey } from '@/lib/model-config'

export async function POST(req: NextRequest) {
  try {
    const { prompt, size, type } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: '请提供图片描述' }, { status: 400 })
    }

    // 读取图像生成配置
    const modelConf = await getModelConfig('image')
    const provider = modelConf?.provider || 'z-ai'
    const modelId = modelConf?.modelId || 'default'
    const imageConfig = modelConf?.config || {}

    // 选择合适尺寸（优先使用配置值）
    let imageSize = size || (imageConfig.defaultSize as string) || '1024x1024'
    if (!size) {
      if (type === 'character') imageSize = (imageConfig.charSize as string) || '864x1152'
      else if (type === 'scene' || type === 'storyboard') imageSize = (imageConfig.sceneSize as string) || '1152x864'
    }

    // 如果开启了自动优化提示词，添加增强前缀
    let finalPrompt = prompt
    if (imageConfig.enhancePrompt) {
      const style = (imageConfig.style as string) || 'vivid'
      const styleHint = style === 'vivid' ? ', vivid colors, cinematic lighting, high quality' : ', natural lighting, realistic style'
      if (!finalPrompt.includes(styleHint)) {
        finalPrompt += styleHint
      }
    }

    // Route to appropriate provider
    if (provider === 'siliconflow') {
      return await callSiliconFlowImage(modelId, finalPrompt, imageSize, modelConf?.apiKey)
    } else if (provider === 'replicate') {
      return await callReplicateImage(modelId, finalPrompt, imageSize, modelConf?.apiKey)
    } else {
      // Default: z-ai
      return await callZaiImage(modelId, finalPrompt, imageSize)
    }
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '生成图片失败' },
      { status: 500 },
    )
  }
}

// ── Provider-specific call functions ────────────────────────

async function callZaiImage(
  modelId: string,
  prompt: string,
  size: string,
): Promise<NextResponse> {
  const zai = await ZAI.create()

  const response = await zai.images.generations.create({
    prompt,
    size: size as '1024x1024' | '864x1152' | '1152x864' | '768x1344' | '1344x768' | '1440x720' | '720x1440',
    ...(modelId && modelId !== 'default' && { model: modelId }),
  })
  const imageBase64 = response.data[0].base64
  const dataUrl = `data:image/png;base64,${imageBase64}`

  return NextResponse.json({
    success: true,
    imageUrl: dataUrl,
    size,
    prompt,
  })
}

async function callSiliconFlowImage(
  modelId: string,
  prompt: string,
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

  const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      prompt,
      image_size: size,
      num_inference_steps: 20,
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

  // SiliconFlow returns URL or base64
  const imageUrl = data.images?.[0]?.url || data.data?.[0]?.url || ''
  const imageBase64 = data.images?.[0]?.image || data.data?.[0]?.b64_json || ''

  let finalUrl: string
  if (imageUrl) {
    finalUrl = imageUrl
  } else if (imageBase64) {
    finalUrl = `data:image/png;base64,${imageBase64}`
  } else {
    return NextResponse.json(
      { success: false, error: 'SiliconFlow 未返回图片数据' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    imageUrl: finalUrl,
    size,
    prompt,
  })
}

async function callReplicateImage(
  modelId: string,
  prompt: string,
  size: string,
  userApiKey?: string,
): Promise<NextResponse> {
  const apiKey = resolveApiKey('replicate', userApiKey)
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'Replicate API Key 未配置' },
      { status: 400 },
    )
  }

  // Parse size for width/height
  const [widthStr, heightStr] = size.split('x')
  const width = parseInt(widthStr) || 1024
  const height = parseInt(heightStr) || 1024

  // Create prediction
  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: modelId,
      input: {
        prompt,
        width,
        height,
        num_inference_steps: 20,
      },
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
  const predictionId = prediction.id

  // Poll for result
  const maxPolls = 60
  const pollInterval = 2000

  for (let i = 0; i < maxPolls; i++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval))

    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!statusResponse.ok) continue

    const statusData = await statusResponse.json()

    if (statusData.status === 'succeeded') {
      const outputUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output
      return NextResponse.json({
        success: true,
        imageUrl: outputUrl,
        size,
        prompt,
      })
    } else if (statusData.status === 'failed') {
      return NextResponse.json(
        { success: false, error: 'Replicate 图片生成失败' },
        { status: 500 },
      )
    }
  }

  return NextResponse.json(
    { success: false, error: 'Replicate 图片生成超时' },
    { status: 504 },
  )
}
