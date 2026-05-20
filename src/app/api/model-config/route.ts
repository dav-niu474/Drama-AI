import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PROVIDERS, getProvidersForCategory } from '@/lib/providers'
import type { ProviderCategory } from '@/lib/providers'

// 默认配置
const DEFAULT_CONFIGS: Record<string, Record<string, unknown>> = {
  llm: {
    provider: 'openrouter',
    modelId: 'deepseek/deepseek-v4-flash:free',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1.0,
    systemPrompt: '你是一位资深的短剧编剧和创意顾问。',
  },
  image: {
    provider: 'z-ai',
    modelId: 'default',
    defaultSize: '1024x1024',
    charSize: '864x1152',
    sceneSize: '1152x864',
    quality: 'standard',
    style: 'vivid',
    enhancePrompt: true,
  },
  tts: {
    provider: 'z-ai',
    modelId: 'default',
    defaultVoice: 'tongtong',
    defaultSpeed: 1.0,
    format: 'wav',
    autoGenerate: false,
    maxChars: 1024,
  },
  video: {
    provider: 'z-ai',
    modelId: 'default',
    defaultQuality: 'speed',
    defaultDuration: 5,
    defaultFps: 30,
    defaultSize: '1920x1080',
    withAudio: false,
    autoPoll: true,
  },
}

// GET /api/model-config — 获取所有配置（如果不存在则自动创建）
// GET /api/model-config?providers=1&category=llm — 获取某分类的可用供应商和模型
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const providersQuery = searchParams.get('providers')
    const categoryQuery = searchParams.get('category')

    // Provider list endpoint
    if (providersQuery && categoryQuery) {
      const validCategories: ProviderCategory[] = ['llm', 'image', 'tts', 'video']
      if (!validCategories.includes(categoryQuery as ProviderCategory)) {
        return NextResponse.json(
          { success: false, error: '无效的配置类别' },
          { status: 400 },
        )
      }
      const providers = getProvidersForCategory(categoryQuery as ProviderCategory).map(p => ({
        ...p,
        hasEnvKey: !!process.env[p.envKey],
      }))
      return NextResponse.json({ success: true, providers })
    }

    // Default: return all configs
    const categories = ['llm', 'image', 'tts', 'video']

    const configs: Record<string, {
      id: string
      category: string
      provider: string
      modelId: string
      apiKey: string
      hasEnvKey: boolean
      config: Record<string, unknown>
      enabled: boolean
    }> = {}

    for (const cat of categories) {
      const record = await db.modelConfig.findUnique({ where: { category: cat } })
      if (record) {
        const providerInfo = PROVIDERS[record.provider]
        configs[cat] = {
          id: record.id,
          category: record.category,
          provider: record.provider,
          modelId: record.modelId,
          apiKey: record.apiKey,
          hasEnvKey: providerInfo ? !!process.env[providerInfo.envKey] : false,
          config: JSON.parse(record.config),
          enabled: record.enabled,
        }
      } else {
        // 自动创建默认配置
        const defaultConf = DEFAULT_CONFIGS[cat] || {}
        const created = await db.modelConfig.create({
          data: {
            category: cat,
            provider: (defaultConf.provider as string) || 'z-ai',
            modelId: (defaultConf.modelId as string) || 'default',
            apiKey: '',
            config: JSON.stringify(defaultConf),
            enabled: true,
          },
        })
        const providerInfo = PROVIDERS[created.provider]
        configs[cat] = {
          id: created.id,
          category: created.category,
          provider: created.provider,
          modelId: created.modelId,
          apiKey: created.apiKey,
          hasEnvKey: providerInfo ? !!process.env[providerInfo.envKey] : false,
          config: defaultConf,
          enabled: true,
        }
      }
    }

    return NextResponse.json({ success: true, configs })
  } catch (error) {
    console.error('Get model config error:', error)
    return NextResponse.json(
      { success: false, error: '获取模型配置失败' },
      { status: 500 },
    )
  }
}

// PUT /api/model-config — 更新配置
export async function PUT(req: NextRequest) {
  try {
    const { category, config, enabled, provider, modelId, apiKey } = await req.json()

    if (!category || !['llm', 'image', 'tts', 'video'].includes(category)) {
      return NextResponse.json(
        { success: false, error: '无效的配置类别' },
        { status: 400 },
      )
    }

    const existing = await db.modelConfig.findUnique({ where: { category } })

    if (!existing) {
      // 不存在则创建
      const defaultConf = DEFAULT_CONFIGS[category] || {}
      const created = await db.modelConfig.create({
        data: {
          category,
          provider: provider || (defaultConf.provider as string) || 'z-ai',
          modelId: modelId || (defaultConf.modelId as string) || 'default',
          apiKey: apiKey || '',
          config: JSON.stringify(config || defaultConf),
          enabled: enabled !== undefined ? enabled : true,
        },
      })
      return NextResponse.json({ success: true, config: created })
    }

    // 存在则更新
    const updateData: Record<string, unknown> = {}
    if (config !== undefined) updateData.config = JSON.stringify(config)
    if (enabled !== undefined) updateData.enabled = enabled
    if (provider !== undefined) updateData.provider = provider
    if (modelId !== undefined) updateData.modelId = modelId
    if (apiKey !== undefined) updateData.apiKey = apiKey

    const updated = await db.modelConfig.update({
      where: { category },
      data: updateData,
    })

    return NextResponse.json({ success: true, config: updated })
  } catch (error) {
    console.error('Update model config error:', error)
    return NextResponse.json(
      { success: false, error: '更新模型配置失败' },
      { status: 500 },
    )
  }
}

// POST /api/model-config — 重置为默认配置
export async function POST(req: NextRequest) {
  try {
    const { category } = await req.json()

    if (!category || !['llm', 'image', 'tts', 'video'].includes(category)) {
      return NextResponse.json(
        { success: false, error: '无效的配置类别' },
        { status: 400 },
      )
    }

    const defaultConfig = DEFAULT_CONFIGS[category] || {}
    const defaultProvider = (defaultConfig.provider as string) || 'z-ai'
    const defaultModelId = (defaultConfig.modelId as string) || 'default'

    const updated = await db.modelConfig.upsert({
      where: { category },
      create: {
        category,
        provider: defaultProvider,
        modelId: defaultModelId,
        apiKey: '',
        config: JSON.stringify(defaultConfig),
        enabled: true,
      },
      update: {
        provider: defaultProvider,
        modelId: defaultModelId,
        apiKey: '',
        config: JSON.stringify(defaultConfig),
        enabled: true,
      },
    })

    return NextResponse.json({
      success: true,
      config: updated,
      defaults: defaultConfig,
    })
  } catch (error) {
    console.error('Reset model config error:', error)
    return NextResponse.json(
      { success: false, error: '重置配置失败' },
      { status: 500 },
    )
  }
}
