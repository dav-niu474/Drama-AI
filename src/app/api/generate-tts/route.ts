import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const { text, voice, speed } = await req.json()

    if (!text) {
      return NextResponse.json({ error: '请提供文本内容' }, { status: 400 })
    }

    // 文本长度限制：1024字符
    const maxLen = 1024
    let finalText = text
    if (text.length > maxLen) {
      finalText = text.substring(0, maxLen)
    }

    const zai = await ZAI.create()

    const response = await zai.audio.tts.create({
      input: finalText,
      voice: voice || 'tongtong',
      speed: speed || 1.0,
      response_format: 'wav',
      stream: false
    })

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(new Uint8Array(arrayBuffer))

    // 保存音频文件
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    const filename = `tts_${Date.now()}.wav`
    const filepath = path.join(uploadsDir, filename)
    fs.writeFileSync(filepath, buffer)

    return NextResponse.json({
      success: true,
      audioUrl: `/uploads/${filename}`,
      size: buffer.length,
      duration: Math.ceil(finalText.length / 4) // 估算时长
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '语音合成失败' },
      { status: 500 }
    )
  }
}
