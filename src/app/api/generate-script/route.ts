import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

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
    const { prompt, genre, style, characters, existingScript, mode } = await req.json()

    // 读取LLM配置
    const llmConfig = await getModelConfig('llm')
    const temperature = (llmConfig.temperature as number) ?? undefined
    const maxTokens = (llmConfig.maxTokens as number) ?? undefined
    const topP = (llmConfig.topP as number) ?? undefined
    const systemPromptTemplate = (llmConfig.systemPrompt as string) || ''

    const zai = await ZAI.create()

    let systemPrompt = ''
    let userMessage = ''

    if (mode === 'brainstorm') {
      // 创意构思模式
      systemPrompt = `你是一位资深的短剧编剧和创意总监。你擅长创作引人入胜的短剧剧情大纲。
请用中文回复，使用以下JSON格式输出（不要使用markdown代码块）：
{
  "title": "短剧标题",
  "logline": "一句话故事梗概",
  "genre": "题材类型",
  "themes": ["主题1", "主题2", "主题3"],
  "characterCount": 角色数量,
  "episodeCount": 建议集数,
  "plotOutline": "详细剧情大纲（200-300字）",
  "twistPoints": ["反转点1", "反转点2"],
  "targetAudience": "目标受众",
  "tone": "整体基调"
}`
      userMessage = `请为以下创意构思一个短剧大纲：${prompt || '一个都市情感短剧'}\n题材偏好：${genre || '不限'}\n风格偏好：${style || '现代都市'}`
    } else if (mode === 'fullscript') {
      // 完整剧本模式
      systemPrompt = `你是一位专业的短剧编剧。请根据提供的大纲创作完整的短剧剧本。
剧本格式要求：
- 第一集，分为8-12个场景
- 每个场景包含：场景标题、场景描述、角色对话
- 对话格式：角色名：台词
- 场景间用空行分隔
- 请确保剧情紧凑、对话自然、有悬念和反转
请用中文回复。`
      userMessage = `请根据以下大纲创作完整的第一集剧本：\n\n大纲：${existingScript || prompt}\n\n已知角色：${characters || '无'}`
    } else if (mode === 'refine') {
      // 优化润色模式
      systemPrompt = `你是一位经验丰富的短剧编剧。请对用户提供的剧本进行优化润色，使其更具戏剧张力。
保持原有故事结构，优化对话使其更自然流畅，增强场景描写。
请用中文回复。`
      userMessage = `请优化以下剧本：\n\n${existingScript || prompt}\n\n优化建议：${prompt || '增强戏剧冲突，优化台词'}`
    } else if (mode === 'scenes') {
      // 场景拆分模式
      systemPrompt = `你是一位专业的分镜师。请将剧本拆分为独立的场景，每个场景需要包含：
- 场景编号和标题
- 场景描述（用于AI生成场景画面）
- 景别建议（特写/近景/中景/全景/远景）
- 时间段（白天/黄昏/夜晚/黎明）
- 氛围情绪（平静/紧张/浪漫/悲伤/欢快/悬疑）
- 对话内容

请用以下JSON格式输出（不要使用markdown代码块）：
[
  {
    "title": "场景标题",
    "description": "场景画面描述（英文，用于AI图片生成）",
    "dialogue": "该场景的对话内容",
    "cameraAngle": "景别",
    "timeOfDay": "时间段",
    "mood": "氛围",
    "location": "拍摄地点",
    "duration": 5
  }
]`
      userMessage = `请将以下剧本拆分为场景：\n\n${prompt || existingScript}`
    } else {
      // 普通对话模式
      systemPrompt = `你是一位资深的短剧编剧和创意顾问。你擅长帮助用户构思、开发和优化短剧剧本。
你可以帮助用户：
1. 构思创意和故事大纲
2. 创作角色设定
3. 编写对话和场景
4. 优化剧本结构
5. 添加戏剧冲突和反转

请用中文回复，保持专业且富有创意。`
      userMessage = prompt || '你好，我想创作一部短剧，请帮我开始构思。'
    }

    const messages = [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]

    const completion = await zai.chat.completions.create({
      messages: messages,
      thinking: { type: 'disabled' },
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { max_tokens: maxTokens }),
      ...(topP !== undefined && { top_p: topP }),
    })

    const response = completion.choices[0]?.message?.content || ''

    return NextResponse.json({
      success: true,
      content: response,
      mode: mode || 'chat'
    })
  } catch (error) {
    console.error('Script generation error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '生成剧本失败' },
      { status: 500 }
    )
  }
}
