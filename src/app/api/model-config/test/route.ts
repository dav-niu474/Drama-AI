import { NextRequest, NextResponse } from 'next/server'
import { getApiKey, getProviderBaseUrl, PROVIDERS } from '@/lib/providers'
import type { ProviderCategory } from '@/lib/providers'

const TIMEOUT_MS = 10_000

/** Helper: fetch with timeout */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timer)
  }
}

interface TestRequestBody {
  provider: string
  modelId: string
  apiKey?: string
  category: ProviderCategory
}

// POST /api/model-config/test — Test connection for a provider/model combination
export async function POST(req: NextRequest) {
  try {
    const body: TestRequestBody = await req.json()
    const { provider, modelId, apiKey: userKey, category } = body

    // Validate inputs
    if (!provider || !category) {
      return NextResponse.json(
        { success: false, message: '连接失败: 缺少 provider 或 category 参数' },
        { status: 400 },
      )
    }

    const validCategories: ProviderCategory[] = ['llm', 'image', 'tts', 'video']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, message: '连接失败: 无效的 category 参数' },
        { status: 400 },
      )
    }

    const providerInfo = PROVIDERS[provider]
    if (!providerInfo) {
      return NextResponse.json(
        { success: false, message: `连接失败: 未知的供应商 "${provider}"` },
        { status: 400 },
      )
    }

    if (!providerInfo.categories.includes(category)) {
      return NextResponse.json(
        { success: false, message: `连接失败: 供应商 "${providerInfo.name}" 不支持 ${category} 类别` },
        { status: 400 },
      )
    }

    // Resolve API key: user-provided > env var
    const resolvedKey = getApiKey(provider, userKey)

    // ── z-ai provider ──────────────────────────────────────────
    if (provider === 'z-ai') {
      // For TTS and video, just check if the env key exists
      if (category === 'tts' || category === 'video') {
        const envKey = process.env.ZAI_API_KEY
        if (!envKey) {
          return NextResponse.json({
            success: false,
            message: '连接失败: 未设置 ZAI_API_KEY 环境变量',
          })
        }
        return NextResponse.json({
          success: true,
          message: `连接成功! Z-AI ${category === 'tts' ? 'TTS' : '视频'} 服务密钥已配置`,
          latency: 0,
        })
      }

      // For LLM and image, use the z-ai-web-dev-sdk
      const start = Date.now()
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default
        const zai = await ZAI.create()

        if (category === 'llm') {
          const response = await zai.chat.completions.create({
            messages: [{ role: 'user', content: 'Hi, reply with just OK' }],
            model: modelId || 'default',
            max_tokens: 10,
          })
          const latency = Date.now() - start
          if (response && response.choices) {
            return NextResponse.json({
              success: true,
              message: `连接成功! Z-AI LLM (${modelId || 'default'}) 响应正常`,
              latency,
            })
          } else {
            return NextResponse.json({
              success: false,
              message: '连接失败: Z-AI LLM 返回了无效的响应格式',
            })
          }
        }

        if (category === 'image') {
          const response = await zai.images.generations.create({
            prompt: 'a cute cat',
            size: '1024x1024',
          })
          const latency = Date.now() - start
          if (response && response.data) {
            return NextResponse.json({
              success: true,
              message: `连接成功! Z-AI 图像生成 (${modelId || 'default'}) 响应正常`,
              latency,
            })
          } else {
            return NextResponse.json({
              success: false,
              message: '连接失败: Z-AI 图像生成返回了无效的响应格式',
            })
          }
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        return NextResponse.json({
          success: false,
          message: `连接失败: ${message}`,
        })
      }
    }

    // ── openrouter provider (llm only) ────────────────────────
    if (provider === 'openrouter') {
      if (!resolvedKey) {
        return NextResponse.json({
          success: false,
          message: '连接失败: 未提供 API 密钥且未设置 OpenRouter_API_KEY 环境变量',
        })
      }

      const start = Date.now()
      try {
        const baseUrl = getProviderBaseUrl('openrouter')
        const response = await fetchWithTimeout(
          `${baseUrl}/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resolvedKey}`,
            },
            body: JSON.stringify({
              model: modelId || 'openai/gpt-4o-mini',
              messages: [{ role: 'user', content: 'Hi, reply with just OK' }],
              max_tokens: 5,
            }),
          },
        )

        const latency = Date.now() - start

        if (!response.ok) {
          const errorText = await response.text()
          return NextResponse.json({
            success: false,
            message: `连接失败: OpenRouter 返回 ${response.status} - ${errorText.slice(0, 200)}`,
          })
        }

        const data = await response.json()
        if (data.choices) {
          return NextResponse.json({
            success: true,
            message: `连接成功! OpenRouter (${modelId || 'openai/gpt-4o-mini'}) 响应正常`,
            latency,
          })
        } else {
          return NextResponse.json({
            success: false,
            message: '连接失败: OpenRouter 返回了无效的响应格式',
          })
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        return NextResponse.json({
          success: false,
          message: `连接失败: ${message}`,
        })
      }
    }

    // ── siliconflow provider (llm/image/video) ────────────────
    if (provider === 'siliconflow') {
      if (!resolvedKey) {
        return NextResponse.json({
          success: false,
          message: '连接失败: 未提供 API 密钥且未设置 SILICONFLOW_API_KEY 环境变量',
        })
      }

      const baseUrl = getProviderBaseUrl('siliconflow')
      const start = Date.now()

      try {
        if (category === 'llm') {
          const response = await fetchWithTimeout(
            `${baseUrl}/chat/completions`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resolvedKey}`,
              },
              body: JSON.stringify({
                model: modelId || 'Qwen/Qwen2.5-72B-Instruct',
                messages: [{ role: 'user', content: 'Hi, reply with just OK' }],
                max_tokens: 5,
              }),
            },
          )

          const latency = Date.now() - start

          if (!response.ok) {
            const errorText = await response.text()
            return NextResponse.json({
              success: false,
              message: `连接失败: SiliconFlow 返回 ${response.status} - ${errorText.slice(0, 200)}`,
            })
          }

          const data = await response.json()
          if (data.choices) {
            return NextResponse.json({
              success: true,
              message: `连接成功! SiliconFlow LLM (${modelId || 'Qwen/Qwen2.5-72B-Instruct'}) 响应正常`,
              latency,
            })
          } else {
            return NextResponse.json({
              success: false,
              message: '连接失败: SiliconFlow LLM 返回了无效的响应格式',
            })
          }
        }

        if (category === 'image') {
          const response = await fetchWithTimeout(
            `${baseUrl}/images/generations`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resolvedKey}`,
              },
              body: JSON.stringify({
                model: modelId || 'black-forest-labs/FLUX.1-schnell',
                prompt: 'a cute cat',
                image_size: '1024x1024',
              }),
            },
          )

          const latency = Date.now() - start

          if (!response.ok) {
            const errorText = await response.text()
            return NextResponse.json({
              success: false,
              message: `连接失败: SiliconFlow 返回 ${response.status} - ${errorText.slice(0, 200)}`,
            })
          }

          const data = await response.json()
          if (data.images || data.data) {
            return NextResponse.json({
              success: true,
              message: `连接成功! SiliconFlow 图像生成 (${modelId || 'black-forest-labs/FLUX.1-schnell'}) 响应正常`,
              latency,
            })
          } else {
            return NextResponse.json({
              success: false,
              message: '连接失败: SiliconFlow 图像生成返回了无效的响应格式',
            })
          }
        }

        if (category === 'video') {
          // For video, just check API key validity with a lightweight call
          const response = await fetchWithTimeout(
            `${baseUrl}/models`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${resolvedKey}`,
              },
            },
          )

          const latency = Date.now() - start

          if (!response.ok) {
            const errorText = await response.text()
            return NextResponse.json({
              success: false,
              message: `连接失败: SiliconFlow 返回 ${response.status} - ${errorText.slice(0, 200)}`,
            })
          }

          return NextResponse.json({
            success: true,
            message: '连接成功! SiliconFlow 视频服务密钥有效',
            latency,
          })
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        return NextResponse.json({
          success: false,
          message: `连接失败: ${message}`,
        })
      }
    }

    // ── replicate provider (image/video) ───────────────────────
    if (provider === 'replicate') {
      if (!resolvedKey) {
        return NextResponse.json({
          success: false,
          message: '连接失败: 未提供 API 密钥且未设置 REPLICATE_API_KEY 环境变量',
        })
      }

      const start = Date.now()
      try {
        // Check API key validity by listing models
        const response = await fetchWithTimeout(
          'https://api.replicate.com/v1/models',
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${resolvedKey}`,
            },
          },
        )

        const latency = Date.now() - start

        if (!response.ok) {
          const errorText = await response.text()
          return NextResponse.json({
            success: false,
            message: `连接失败: Replicate 返回 ${response.status} - ${errorText.slice(0, 200)}`,
          })
        }

        const categoryLabel = category === 'image' ? '图像生成' : '视频生成'
        return NextResponse.json({
          success: true,
          message: `连接成功! Replicate ${categoryLabel} 密钥有效`,
          latency,
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        return NextResponse.json({
          success: false,
          message: `连接失败: ${message}`,
        })
      }
    }

    // Fallback for unhandled providers
    return NextResponse.json({
      success: false,
      message: `连接失败: 不支持测试供应商 "${provider}" 的连接`,
    })
  } catch (error: unknown) {
    console.error('Model config test error:', error)
    const message = error instanceof Error ? error.message : '服务器内部错误'
    return NextResponse.json(
      { success: false, message: `连接失败: ${message}` },
      { status: 500 },
    )
  }
}
