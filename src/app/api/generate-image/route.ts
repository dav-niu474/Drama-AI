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

export async function POST(req: NextRequest) {
  try {
    const { prompt, size, type } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: '请提供图片描述' }, { status: 400 })
    }

    // 读取图像生成配置
    const imageConfig = await getModelConfig('image')

    const zai = await ZAI.create()

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

    // 生成图片
    const response = await zai.images.generations.create({
      prompt: finalPrompt,
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
