import '@/lib/db-env'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// 默认配置
const DEFAULT_CONFIGS: Record<string, Record<string, unknown>> = {
  llm: {
    model: 'default',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1.0,
    systemPrompt: '你是一位资深的短剧编剧和创意顾问。',
  },
  image: {
    defaultSize: '1024x1024',
    charSize: '864x1152',
    sceneSize: '1152x864',
    quality: 'standard',
    style: 'vivid',
    enhancePrompt: true,
  },
  tts: {
    defaultVoice: 'tongtong',
    defaultSpeed: 1.0,
    format: 'wav',
    autoGenerate: false,
    maxChars: 1024,
  },
  video: {
    defaultQuality: 'speed',
    defaultDuration: 5,
    defaultFps: 30,
    defaultSize: '1920x1080',
    withAudio: false,
    autoPoll: true,
  },
}

// GET /api/model-config — 获取所有配置（如果不存在则自动创建）
export async function GET() {
  try {
    const categories = ['llm', 'image', 'tts', 'video']

    const configs: Record<string, { id: string; category: string; config: Record<string, unknown>; enabled: boolean }> = {}

    for (const cat of categories) {
      const record = await db.modelConfig.findUnique({ where: { category: cat } })
      if (record) {
        configs[cat] = {
          id: record.id,
          category: record.category,
          config: JSON.parse(record.config),
          enabled: record.enabled,
        }
      } else {
        // 自动创建默认配置
        const created = await db.modelConfig.create({
          data: {
            category: cat,
            config: JSON.stringify(DEFAULT_CONFIGS[cat] || {}),
            enabled: true,
          },
        })
        configs[cat] = {
          id: created.id,
          category: created.category,
          config: DEFAULT_CONFIGS[cat] || {},
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
    const { category, config, enabled } = await req.json()

    if (!category || !['llm', 'image', 'tts', 'video'].includes(category)) {
      return NextResponse.json(
        { success: false, error: '无效的配置类别' },
        { status: 400 },
      )
    }

    const existing = await db.modelConfig.findUnique({ where: { category } })

    if (!existing) {
      // 不存在则创建
      const created = await db.modelConfig.create({
        data: {
          category,
          config: JSON.stringify(config || DEFAULT_CONFIGS[category] || {}),
          enabled: enabled !== undefined ? enabled : true,
        },
      })
      return NextResponse.json({ success: true, config: created })
    }

    // 存在则更新
    const updateData: Record<string, unknown> = {}
    if (config !== undefined) updateData.config = JSON.stringify(config)
    if (enabled !== undefined) updateData.enabled = enabled

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

    const updated = await db.modelConfig.upsert({
      where: { category },
      create: {
        category,
        config: JSON.stringify(defaultConfig),
        enabled: true,
      },
      update: {
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
