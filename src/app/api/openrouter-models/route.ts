import { NextResponse } from 'next/server'
import { PROVIDERS } from '@/lib/providers'
import type { ModelOption } from '@/lib/providers'

// GET /api/openrouter-models — Fetch available models from OpenRouter API
export async function GET() {
  try {
    const apiKey = process.env[PROVIDERS['openrouter'].envKey]
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: '未配置 OpenRouter API Key' },
        { status: 400 },
      )
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `OpenRouter API 错误: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Filter for chat models only (text generation)
    const models: ModelOption[] = (data.data || [])
      .filter((model: Record<string, unknown>) => {
        // Filter for chat models
        const architecture = model.architecture as Record<string, unknown> | undefined
        return architecture?.modality === 'text->text' ||
               (model.id as string).includes('llama') ||
               (model.id as string).includes('qwen') ||
               (model.id as string).includes('deepseek') ||
               (model.id as string).includes('claude') ||
               (model.id as string).includes('gpt') ||
               (model.id as string).includes('gemini') ||
               (model.id as string).includes('mistral')
      })
      .map((model: Record<string, unknown>) => {
        const pricing = model.pricing as Record<string, string> | undefined
        const isFree = pricing ? parseFloat(pricing.prompt || '1') === 0 : false
        const contextLength = model.context_length as number | undefined

        return {
          id: model.id as string,
          name: (model.name as string) || (model.id as string),
          free: isFree,
          contextLength,
        }
      })
      // Sort: free models first, then by name
      .sort((a: ModelOption, b: ModelOption) => {
        if (a.free && !b.free) return -1
        if (!a.free && b.free) return 1
        return a.name.localeCompare(b.name)
      })

    return NextResponse.json({ success: true, models })
  } catch (error) {
    console.error('OpenRouter models fetch error:', error)
    return NextResponse.json(
      { success: false, error: '获取 OpenRouter 模型列表失败' },
      { status: 500 },
    )
  }
}
