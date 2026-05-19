/**
 * DramaAI - Multi-Provider Registry
 * Comprehensive registry of AI providers and their available models
 */

// ── Types ──────────────────────────────────────────────────
export type ProviderCategory = 'llm' | 'image' | 'tts' | 'video'

export interface ModelOption {
  id: string            // model ID to pass to API
  name: string          // display name
  free?: boolean        // is this a free model?
  contextLength?: number // for LLM models
}

export interface ProviderInfo {
  id: string
  name: string
  categories: ProviderCategory[]
  envKey: string        // environment variable name for API key
  website: string
  models: Record<ProviderCategory, ModelOption[]>
}

// ── Provider Registry ──────────────────────────────────────
export const PROVIDERS: Record<string, ProviderInfo> = {
  'z-ai': {
    id: 'z-ai',
    name: 'Z-AI (内置)',
    categories: ['llm', 'image', 'tts', 'video'],
    envKey: 'ZAI_API_KEY',
    website: 'https://z.ai',
    models: {
      llm: [{ id: 'default', name: '默认模型', free: true }],
      image: [{ id: 'default', name: '默认模型', free: true }],
      tts: [{ id: 'default', name: '默认模型', free: true }],
      video: [{ id: 'default', name: '默认模型', free: true }],
    },
  },
  'openrouter': {
    id: 'openrouter',
    name: 'OpenRouter',
    categories: ['llm'],
    envKey: 'OpenRouter_API_KEY',
    website: 'https://openrouter.ai',
    models: {
      llm: [
        // Free models FIRST (verified available on OpenRouter)
        { id: 'deepseek/deepseek-v4-flash:free', name: 'DeepSeek V4 Flash (Free)', free: true, contextLength: 131072 },
        { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', free: true, contextLength: 131072 },
        { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder 480B (Free)', free: true, contextLength: 131072 },
        { id: 'qwen/qwen3-next-80b-a3b-instruct:free', name: 'Qwen3 Next 80B (Free)', free: true, contextLength: 131072 },
        { id: 'minimax/minimax-m2.5:free', name: 'MiniMax M2.5 (Free)', free: true, contextLength: 131072 },
        { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B (Free)', free: true, contextLength: 131072 },
        { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'Nemotron 3 Super (Free)', free: true, contextLength: 131072 },
        { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B (Free)', free: true, contextLength: 131072 },
        // Paid models
        { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', contextLength: 200000 },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', contextLength: 200000 },
        { id: 'openai/gpt-4o', name: 'GPT-4o', contextLength: 128000 },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', contextLength: 128000 },
        { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', contextLength: 1048576 },
        { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', contextLength: 1048576 },
        { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', contextLength: 163840 },
        { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', contextLength: 163840 },
      ],
      image: [],
      tts: [],
      video: [],
    },
  },
  'siliconflow': {
    id: 'siliconflow',
    name: 'SiliconFlow (硅基流动)',
    categories: ['llm', 'image', 'video'],
    envKey: 'SILICONFLOW_API_KEY',
    website: 'https://siliconflow.cn',
    models: {
      llm: [
        { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', free: false, contextLength: 65536 },
        { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', free: false, contextLength: 65536 },
        { id: 'Qwen/Qwen3-235B-A22B', name: 'Qwen3 235B', free: false, contextLength: 32768 },
        { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5 72B', free: true, contextLength: 32768 },
      ],
      image: [
        { id: 'black-forest-labs/FLUX.1-schnell', name: 'FLUX.1 Schnell', free: true },
        { id: 'stabilityai/stable-diffusion-3-5-large', name: 'SD 3.5 Large', free: false },
        { id: 'stabilityai/stable-diffusion-3-5-large-turbo', name: 'SD 3.5 Turbo', free: false },
      ],
      video: [
        { id: 'Wan-AI/Wan2.1-T2V-14B', name: 'Wan2.1 T2V 14B', free: false },
      ],
      tts: [],
    },
  },
  'replicate': {
    id: 'replicate',
    name: 'Replicate',
    categories: ['image', 'video'],
    envKey: 'REPLICATE_API_KEY',
    website: 'https://replicate.com',
    models: {
      llm: [],
      image: [
        { id: 'black-forest-labs/flux-schnell', name: 'FLUX Schnell', free: false },
        { id: 'black-forest-labs/flux-dev', name: 'FLUX Dev', free: false },
        { id: 'stability-ai/sdxl', name: 'SDXL', free: false },
      ],
      video: [
        { id: 'minimax/video-01-live', name: 'MiniMax Video-01-Live', free: false },
        { id: 'tencent/hunyuan-video', name: 'Hunyuan Video', free: false },
      ],
      tts: [],
    },
  },
}

// ── Helper Functions ────────────────────────────────────────

/** Get all providers that support a given category */
export function getProvidersForCategory(category: ProviderCategory): ProviderInfo[] {
  return Object.values(PROVIDERS).filter(p => p.categories.includes(category))
}

/** Get a specific provider by ID */
export function getProvider(providerId: string): ProviderInfo | undefined {
  return PROVIDERS[providerId]
}

/** Get models for a specific provider and category */
export function getModelsForProvider(providerId: string, category: ProviderCategory): ModelOption[] {
  const provider = PROVIDERS[providerId]
  if (!provider) return []
  return provider.models[category] || []
}

/** Resolve API key: user-provided key takes priority, then env var */
export function getApiKey(providerId: string, userKey?: string): string | undefined {
  if (userKey) return userKey
  const provider = PROVIDERS[providerId]
  if (!provider) return undefined
  return process.env[provider.envKey]
}

/** Get the base URL for OpenAI-compatible API calls */
export function getProviderBaseUrl(providerId: string): string {
  switch (providerId) {
    case 'openrouter':
      return 'https://openrouter.ai/api/v1'
    case 'siliconflow':
      return 'https://api.siliconflow.cn/v1'
    default:
      return ''
  }
}
