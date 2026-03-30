import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(req: NextRequest) {
  try {
    const { prompt, size, type } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: '请提供图片描述' }, { status: 400 })
    }

    const zai = await ZAI.create()

    // 选择合适尺寸
    let imageSize = size || '1024x1024'
    if (!size) {
      if (type === 'character') imageSize = '864x1152'
      else if (type === 'scene') imageSize = '1152x864'
      else if (type === 'storyboard') imageSize = '1152x864'
      else imageSize = '1024x1024'
    }

    // 生成图片
    const response = await zai.images.generations.create({
      prompt: prompt,
      size: imageSize
    })

    const imageBase64 = response.data[0].base64

    // 直接返回 base64 Data URL（兼容 Vercel 无文件系统）
    const dataUrl = `data:image/png;base64,${imageBase64}`

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
      size: imageSize,
      prompt: prompt
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '生成图片失败' },
      { status: 500 }
    )
  }
}
