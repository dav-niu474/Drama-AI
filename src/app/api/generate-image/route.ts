import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { prompt, size, type, seed } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: '请提供图片描述' }, { status: 400 })
    }

    const zai = await ZAI.create()

    // 选择合适尺寸
    let imageSize = size || '1024x1024'
    if (!imageSize) {
      if (type === 'character') imageSize = '768x1344' // 竖版人像
      else if (type === 'scene') imageSize = '1344x768' // 横版场景
      else if (type === 'storyboard') imageSize = '1152x864' // 分镜
      else imageSize = '1024x1024'
    }

    // 生成图片
    const response = await zai.images.generations.create({
      prompt: prompt,
      size: imageSize
    })

    const imageBase64 = response.data[0].base64
    
    // 保存图片到本地
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const hash = crypto.createHash('md5').update(`${prompt}-${Date.now()}`).digest('hex')
    const filename = `${hash}.png`
    const filepath = path.join(uploadsDir, filename)
    
    const buffer = Buffer.from(imageBase64, 'base64')
    fs.writeFileSync(filepath, buffer)

    return NextResponse.json({
      success: true,
      imageUrl: `/uploads/${filename}`,
      size: imageSize,
      fileSize: buffer.length,
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
