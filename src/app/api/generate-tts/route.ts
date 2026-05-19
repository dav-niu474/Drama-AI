import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { getModelConfig } from '@/lib/model-config'

export async function POST(req: NextRequest) {
  try {
    const { text, voice, speed } = await req.json()

    if (!text) {
      return NextResponse.json({ error: '请提供文本内容' }, { status: 400 })
    }

    // 读取TTS配置
    const modelConf = await getModelConfig('tts')
    const provider = modelConf?.provider || 'z-ai'
    const ttsConfig = modelConf?.config || {}

    // Currently only z-ai supports TTS
    if (provider !== 'z-ai') {
      return NextResponse.json(
        { success: false, error: `TTS 不支持供应商 ${provider}，仅支持 Z-AI` },
        { status: 400 },
      )
    }

    const maxLen = (ttsConfig.maxChars as number) || 1024
    const finalVoice = voice || (ttsConfig.defaultVoice as string) || 'tongtong'
    const finalSpeed = speed || (ttsConfig.defaultSpeed as number) || 1.0
    const format = (ttsConfig.format as string) || 'wav'

    const finalText = text.length > maxLen ? text.substring(0, maxLen) : text

    const zai = await ZAI.create()

    const response = await zai.audio.tts.create({
      input: finalText,
      voice: finalVoice,
      speed: finalSpeed,
      response_format: format,
      stream: false,
    })

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(new Uint8Array(arrayBuffer))

    const mimeMap: Record<string, string> = { wav: 'audio/wav', mp3: 'audio/mpeg', opus: 'audio/opus' }
    const mime = mimeMap[format] || 'audio/wav'
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`

    return NextResponse.json({
      success: true,
      audioUrl: dataUrl,
      size: buffer.length,
      duration: Math.ceil(finalText.length / 4),
    })
  } catch (error) {
    console.error('TTS error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '语音合成失败' },
      { status: 500 },
    )
  }
}
