import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(req: NextRequest) {
  try {
    const { text, voice, speed } = await req.json()

    if (!text) {
      return NextResponse.json({ error: '请提供文本内容' }, { status: 400 })
    }

    // 文本长度限制：1024字符
    const maxLen = 1024
    const finalText = text.length > maxLen ? text.substring(0, maxLen) : text

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

    // 直接返回 base64 Data URL（兼容 Vercel 无文件系统）
    const dataUrl = `data:audio/wav;base64,${buffer.toString('base64')}`

    return NextResponse.json({
      success: true,
      audioUrl: dataUrl,
      size: buffer.length,
      duration: Math.ceil(finalText.length / 4)
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '语音合成失败' },
      { status: 500 }
    )
  }
}
