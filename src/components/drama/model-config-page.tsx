'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  ImageIcon,
  Mic,
  Video,
  Settings2,
  RotateCcw,
  Save,
  Check,
  Sparkles,
  Zap,
  Shield,
  Info,
  Thermometer,
  MessageSquare,
  SlidersHorizontal,
  Wand2,
  Volume2,
  Film,
  MonitorPlay,
  Timer,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Key,
  Server,
  Cpu,
  PlugZap,
  CircleCheck,
  CircleX,
  CircleDot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { VOICE_OPTIONS, getVoiceLabel } from '@/lib/constants'

// ─── Types ─────────────────────────────────────────────────
interface ModelConfigRecord {
  id: string
  category: string
  provider: string
  modelId: string
  apiKey: string
  hasEnvKey: boolean
  config: Record<string, unknown>
  enabled: boolean
}

interface AllConfigs {
  llm: ModelConfigRecord
  image: ModelConfigRecord
  tts: ModelConfigRecord
  video: ModelConfigRecord
}

interface ProviderInfo {
  id: string
  name: string
  categories: string[]
  envKey: string
  website: string
  hasEnvKey: boolean
  models: Record<string, ModelOption[]>
}

interface ModelOption {
  id: string
  name: string
  free?: boolean
  contextLength?: number
}

// ─── Constants ──────────────────────────────────────────────
const CATEGORIES = [
  {
    key: 'llm',
    label: '大语言模型',
    icon: Brain,
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600',
    desc: '剧本创作与AI对话',
  },
  {
    key: 'image',
    label: '图像生成',
    icon: ImageIcon,
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    desc: '角色与场景图片',
  },
  {
    key: 'tts',
    label: '语音合成',
    icon: Mic,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    desc: '智能配音生成',
  },
  {
    key: 'video',
    label: '视频生成',
    icon: Video,
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-600',
    desc: '视频合成与输出',
  },
] as const

const IMAGE_SIZES = [
  { value: '864x1152', label: '864×1152 (竖版/角色)' },
  { value: '1152x864', label: '1152×864 (横版/场景)' },
  { value: '1024x1024', label: '1024×1024 (方形)' },
  { value: '768x1344', label: '768×1344 (长竖版)' },
  { value: '1344x768', label: '1344×768 (长横版)' },
]

const VIDEO_SIZES = [
  { value: '1920x1080', label: '1920×1080 (全高清)' },
  { value: '1280x720', label: '1280×720 (高清)' },
  { value: '1080x1920', label: '1080×1920 (竖屏)' },
  { value: '1080x1080', label: '1080×1080 (方形)' },
]

// ─── Component ──────────────────────────────────────────────
export function ModelConfigPage() {
  const [configs, setConfigs] = useState<AllConfigs | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('llm')

  // Provider info for each category
  const [providerMap, setProviderMap] = useState<Record<string, ProviderInfo[]>>({})

  // 临时编辑状态
  const [editConfigs, setEditConfigs] = useState<Record<string, Record<string, unknown>>>({})
  // Provider/modelId/apiKey 编辑状态
  const [editProviders, setEditProviders] = useState<Record<string, string>>({})
  const [editModelIds, setEditModelIds] = useState<Record<string, string>>({})
  const [editApiKeys, setEditApiKeys] = useState<Record<string, string>>({})

  // 连接测试状态
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({})
  const [testMessage, setTestMessage] = useState<Record<string, string>>({})

  // 加载配置
  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/model-config')
      const data = await res.json()
      if (data.success && data.configs) {
        setConfigs(data.configs)
        const edits: Record<string, Record<string, unknown>> = {}
        const provEdits: Record<string, string> = {}
        const modelEdits: Record<string, string> = {}
        const keyEdits: Record<string, string> = {}

        for (const [key, val] of Object.entries(data.configs)) {
          const record = val as ModelConfigRecord
          edits[key] = record.config
          provEdits[key] = record.provider || 'z-ai'
          modelEdits[key] = record.modelId || 'default'
          keyEdits[key] = record.apiKey ? '••••••••' : ''
        }
        setEditConfigs(edits)
        setEditProviders(provEdits)
        setEditModelIds(modelEdits)
        setEditApiKeys(keyEdits)
      }
    } catch (error) {
      console.error('Failed to load configs:', error)
      toast.error('加载配置失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 加载供应商列表
  const fetchProviders = useCallback(async (category: string) => {
    try {
      const res = await fetch(`/api/model-config?providers=1&category=${category}`)
      const data = await res.json()
      if (data.success && data.providers) {
        setProviderMap(prev => ({ ...prev, [category]: data.providers }))
      }
    } catch (error) {
      console.error('Failed to load providers:', error)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  useEffect(() => {
    fetchProviders(activeTab)
  }, [activeTab, fetchProviders])

  // 获取当前供应商的模型列表
  const getCurrentModels = useCallback((category: string): ModelOption[] => {
    const providers = providerMap[category] || []
    const providerId = editProviders[category] || 'z-ai'
    const provider = providers.find(p => p.id === providerId)
    if (!provider) return []
    const categoryModels = provider.models[category] || []
    return [...categoryModels].sort((a, b) => {
      if (a.free && !b.free) return -1
      if (!a.free && b.free) return 1
      return a.name.localeCompare(b.name)
    })
  }, [providerMap, editProviders])

  // 保存单个配置
  const saveConfig = async (category: string) => {
    setSaving(category)
    try {
      const config = editConfigs[category]
      const enabled = configs?.[category]?.enabled ?? true
      const provider = editProviders[category]
      const modelId = editModelIds[category]
      const apiKeyInput = editApiKeys[category]
      const apiKeyToSend = apiKeyInput === '••••••••' ? undefined : apiKeyInput

      const res = await fetch('/api/model-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          config,
          enabled,
          provider,
          modelId,
          ...(apiKeyToSend !== undefined && { apiKey: apiKeyToSend }),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${CATEGORIES.find(c => c.key === category)?.label}配置已保存`)
        fetchConfigs()
      } else {
        toast.error(data.error || '保存失败')
      }
    } catch {
      toast.error('保存配置失败')
    } finally {
      setSaving(null)
    }
  }

  // 切换启用/禁用
  const toggleEnabled = async (category: string, enabled: boolean) => {
    try {
      const config = editConfigs[category]
      const provider = editProviders[category]
      const modelId = editModelIds[category]

      const res = await fetch('/api/model-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, config, enabled, provider, modelId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(enabled ? '已启用' : '已禁用')
        fetchConfigs()
      }
    } catch {
      toast.error('操作失败')
    }
  }

  // 重置为默认
  const resetConfig = async (category: string) => {
    try {
      const res = await fetch('/api/model-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('已重置为默认配置')
        fetchConfigs()
      }
    } catch {
      toast.error('重置失败')
    }
  }

  // 测试连接
  const testConnection = async (category: string) => {
    setTestStatus(prev => ({ ...prev, [category]: 'testing' }))
    setTestMessage(prev => ({ ...prev, [category]: '' }))
    try {
      const provider = editProviders[category]
      const modelId = editModelIds[category]
      const apiKeyInput = editApiKeys[category]
      const apiKeyToSend = apiKeyInput === '••••••••' ? undefined : apiKeyInput

      const res = await fetch('/api/model-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, modelId, apiKey: apiKeyToSend || undefined, category }),
      })
      const data = await res.json()
      if (data.success) {
        setTestStatus(prev => ({ ...prev, [category]: 'success' }))
        toast.success(data.message)
      } else {
        setTestStatus(prev => ({ ...prev, [category]: 'error' }))
        toast.error(data.message)
      }
      setTestMessage(prev => ({ ...prev, [category]: data.message }))
    } catch {
      setTestStatus(prev => ({ ...prev, [category]: 'error' }))
      setTestMessage(prev => ({ ...prev, [category]: '网络请求失败' }))
      toast.error('连接测试失败')
    }
  }

  // 更新编辑值
  const updateEdit = (category: string, key: string, value: unknown) => {
    setEditConfigs(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
  }

  // 更新供应商
  const updateProvider = (category: string, providerId: string) => {
    setEditProviders(prev => ({ ...prev, [category]: providerId }))
    const providers = providerMap[category] || []
    const provider = providers.find(p => p.id === providerId)
    const categoryModels = provider?.models[category] || []
    if (provider && categoryModels.length > 0) {
      const firstModel = categoryModels.find(m => m.free) || categoryModels[0]
      setEditModelIds(prev => ({ ...prev, [category]: firstModel.id }))
    } else {
      setEditModelIds(prev => ({ ...prev, [category]: 'default' }))
    }
    setEditApiKeys(prev => ({ ...prev, [category]: '' }))
    // Reset test status
    setTestStatus(prev => ({ ...prev, [category]: 'idle' }))
    setTestMessage(prev => ({ ...prev, [category]: '' }))
  }

  // 检查是否有未保存的更改
  const hasChanges = (category: string) => {
    if (!configs?.[category]) return true
    const original = configs[category] as ModelConfigRecord
    const configChanged = JSON.stringify(editConfigs[category]) !== JSON.stringify(original.config)
    const providerChanged = (editProviders[category] || 'z-ai') !== (original.provider || 'z-ai')
    const modelChanged = (editModelIds[category] || 'default') !== (original.modelId || 'default')
    const keyInput = editApiKeys[category]
    const keyChanged = keyInput !== '••••••••' && keyInput !== '' && keyInput !== original.apiKey
    return configChanged || providerChanged || modelChanged || keyChanged
  }

  // 获取供应商的环境变量名
  const getEnvKey = (category: string): string => {
    const providers = providerMap[category] || []
    const providerId = editProviders[category] || 'z-ai'
    const provider = providers.find(p => p.id === providerId)
    return provider?.envKey || ''
  }

  // 获取供应商是否已配置环境变量
  const getHasEnvKey = (category: string): boolean => {
    const providers = providerMap[category] || []
    const providerId = editProviders[category] || 'z-ai'
    const provider = providers.find(p => p.id === providerId)
    return provider?.hasEnvKey || false
  }

  // 刷新模型列表（从 OpenRouter API 动态获取）
  const refreshModels = async (category: string) => {
    const providerId = editProviders[category]
    if (providerId === 'openrouter') {
      try {
        const res = await fetch('/api/openrouter-models')
        const data = await res.json()
        if (data.success && data.models) {
          // Update the provider map with live models
          setProviderMap(prev => {
            const updated = { ...prev }
            const categoryProviders = [...(updated[category] || [])]
            const idx = categoryProviders.findIndex(p => p.id === 'openrouter')
            if (idx >= 0) {
              categoryProviders[idx] = {
                ...categoryProviders[idx],
                models: {
                  ...categoryProviders[idx].models,
                  llm: data.models,
                },
              }
            }
            updated[category] = categoryProviders
            return updated
          })
          toast.success(`已获取 ${data.models.length} 个 OpenRouter 模型`)
        } else {
          toast.error(data.error || '获取模型列表失败')
        }
      } catch {
        toast.error('获取模型列表失败')
      }
    } else {
      // For other providers, just re-fetch the provider list
      await fetchProviders(category)
      toast.success('模型列表已刷新')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="size-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
            <Sparkles className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-violet-600" />
          </div>
          <p className="text-sm text-slate-500">加载模型配置...</p>
        </div>
      </div>
    )
  }

  if (!configs) return null

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
            <Settings2 className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">模型配置</h1>
            <p className="text-sm text-slate-500">自定义AI供应商与模型参数，优化创作体验</p>
          </div>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const isEnabled = configs[cat.key]?.enabled ?? true
          const Icon = cat.icon
          const provider = editProviders[cat.key] || 'z-ai'
          const providerList = providerMap[cat.key] || []
          const providerName = providerList.find(p => p.id === provider)?.name || provider
          const providerHasEnvKey = providerList.find(p => p.id === provider)?.hasEnvKey || false
          const currentTestStatus = testStatus[cat.key] || 'idle'
          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: CATEGORIES.indexOf(cat) * 0.05 }}
            >
              <button
                onClick={() => setActiveTab(cat.key)}
                className={cn(
                  'group relative w-full overflow-hidden rounded-xl border-2 p-4 text-left transition-all duration-300',
                  activeTab === cat.key
                    ? 'border-violet-300 bg-white shadow-lg shadow-violet-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md',
                  !isEnabled && 'opacity-60',
                )}
              >
                <div className="flex items-start justify-between">
                  <div className={cn('flex size-10 items-center justify-center rounded-lg', cat.bgColor)}>
                    <Icon className={cn('size-5', cat.textColor)} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={isEnabled ? 'default' : 'secondary'}
                      className={cn(
                        'text-[10px]',
                        isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {isEnabled ? '已启用' : '已禁用'}
                    </Badge>
                    {currentTestStatus === 'success' && (
                      <CircleCheck className="size-3.5 text-emerald-500" />
                    )}
                    {currentTestStatus === 'error' && (
                      <CircleX className="size-3.5 text-red-400" />
                    )}
                    {currentTestStatus === 'testing' && (
                      <div className="size-3.5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-semibold text-slate-900">{cat.label}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{providerName}</p>
                  <div className="mt-1 flex items-center gap-1">
                    {providerHasEnvKey || configs[cat.key]?.apiKey ? (
                      <Badge variant="outline" className="text-[9px] border-emerald-300 bg-emerald-50 text-emerald-600">
                        <Key className="mr-0.5 size-2.5" /> Key 已配置
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] border-amber-300 bg-amber-50 text-amber-600">
                        <Key className="mr-0.5 size-2.5" /> 未配置 Key
                      </Badge>
                    )}
                  </div>
                </div>
                {hasChanges(cat.key) && (
                  <div className="absolute right-2 top-2">
                    <div className="size-2 rounded-full bg-amber-400" />
                  </div>
                )}
                {activeTab === cat.key && (
                  <motion.div
                    layoutId="active-tab-card"
                    className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  />
                )}
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Main Configuration Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const cat = CATEGORIES.find(c => c.key === activeTab)
                    const Icon = cat?.icon || Settings2
                    return (
                      <>
                        <Icon className={cn('size-4', cat?.textColor)} />
                        <span className="text-sm font-semibold text-slate-900">{cat?.label}配置</span>
                        {hasChanges(activeTab) && (
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-600">
                            未保存
                          </Badge>
                        )}
                      </>
                    )
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  {/* Test Connection Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-7 gap-1.5 text-xs',
                      testStatus[activeTab] === 'success' && 'border-emerald-300 text-emerald-600 hover:text-emerald-700',
                      testStatus[activeTab] === 'error' && 'border-red-300 text-red-500 hover:text-red-600',
                      testStatus[activeTab] !== 'success' && testStatus[activeTab] !== 'error' && 'text-slate-500 hover:text-violet-600',
                    )}
                    onClick={() => testConnection(activeTab)}
                    disabled={testStatus[activeTab] === 'testing'}
                  >
                    {testStatus[activeTab] === 'testing' ? (
                      <div className="size-3 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600" />
                    ) : testStatus[activeTab] === 'success' ? (
                      <CircleCheck className="size-3" />
                    ) : testStatus[activeTab] === 'error' ? (
                      <CircleX className="size-3" />
                    ) : (
                      <PlugZap className="size-3" />
                    )}
                    {testStatus[activeTab] === 'testing' ? '测试中...' : '测试连接'}
                  </Button>
                  <Switch
                    checked={configs[activeTab]?.enabled ?? true}
                    onCheckedChange={(checked) => toggleEnabled(activeTab, checked)}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-slate-500 hover:text-slate-700">
                        <RotateCcw className="size-3" />
                        重置
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>重置配置</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要将{CATEGORIES.find(c => c.key === activeTab)?.label}的配置重置为默认值吗？此操作不可撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => resetConfig(activeTab)}>
                          确定重置
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    size="sm"
                    className="h-7 gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-xs text-white shadow-sm hover:shadow-md"
                    onClick={() => saveConfig(activeTab)}
                    disabled={saving === activeTab}
                  >
                    {saving === activeTab ? (
                      <div className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <Save className="size-3" />
                    )}
                    保存
                  </Button>
                </div>
              </div>
              {/* Test result message */}
              {testMessage[activeTab] && (
                <div className={cn(
                  'mt-2 rounded-lg px-3 py-2 text-xs',
                  testStatus[activeTab] === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200',
                )}>
                  {testMessage[activeTab]}
                </div>
              )}
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Provider & Model Selection */}
                  <ProviderModelSelector
                    category={activeTab}
                    providerId={editProviders[activeTab] || 'z-ai'}
                    modelId={editModelIds[activeTab] || 'default'}
                    apiKey={editApiKeys[activeTab] || ''}
                    hasEnvKey={getHasEnvKey(activeTab)}
                    providers={providerMap[activeTab] || []}
                    onProviderChange={(id) => updateProvider(activeTab, id)}
                    onModelChange={(id) => setEditModelIds(prev => ({ ...prev, [activeTab]: id }))}
                    onApiKeyChange={(key) => setEditApiKeys(prev => ({ ...prev, [activeTab]: key }))}
                    onRefreshModels={() => refreshModels(activeTab)}
                  />

                  <Separator className="my-6" />

                  {/* Category-specific parameters */}
                  {activeTab === 'llm' && (
                    <LLMConfig
                      config={editConfigs.llm || {}}
                      onChange={(key, value) => updateEdit('llm', key, value)}
                    />
                  )}
                  {activeTab === 'image' && (
                    <ImageConfig
                      config={editConfigs.image || {}}
                      onChange={(key, value) => updateEdit('image', key, value)}
                    />
                  )}
                  {activeTab === 'tts' && (
                    <TTSConfig
                      config={editConfigs.tts || {}}
                      onChange={(key, value) => updateEdit('tts', key, value)}
                    />
                  )}
                  {activeTab === 'video' && (
                    <VideoConfig
                      config={editConfigs.video || {}}
                      onChange={(key, value) => updateEdit('video', key, value)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-slate-200 bg-gradient-to-r from-violet-50/50 to-fuchsia-50/50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 size-4 shrink-0 text-violet-500" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700">配置说明</p>
                <ul className="space-y-0.5 text-xs text-slate-500">
                  <li>• 选择供应商和模型后点击「保存」按钮使其生效</li>
                  <li>• 保存后点击「测试连接」验证配置是否正常工作</li>
                  <li>• API Key 留空则使用环境变量中的配置，<Badge variant="outline" className="mx-0.5 text-[9px] border-emerald-300 bg-emerald-50 text-emerald-600">Key 已配置</Badge> 表示环境变量已设置</li>
                  <li>• 免费模型标记为 <Badge variant="outline" className="mx-0.5 text-[9px] border-emerald-300 bg-emerald-50 text-emerald-600">免费</Badge> 无需付费即可使用</li>
                  <li>• 点击「刷新模型」可从供应商获取最新可用模型列表</li>
                  <li>• 温度值越高，AI生成内容越有创造性；越低则越稳定可控</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// ─── Provider & Model Selector ─────────────────────────────
function ProviderModelSelector({
  category,
  providerId,
  modelId,
  apiKey,
  hasEnvKey,
  providers,
  onProviderChange,
  onModelChange,
  onApiKeyChange,
  onRefreshModels,
}: {
  category: string
  providerId: string
  modelId: string
  apiKey: string
  hasEnvKey: boolean
  providers: ProviderInfo[]
  onProviderChange: (id: string) => void
  onModelChange: (id: string) => void
  onApiKeyChange: (key: string) => void
  onRefreshModels: () => void
}) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const currentProvider = providers.find(p => p.id === providerId)
  const models = currentProvider?.models[category] || []
  const sortedModels = [...models].sort((a, b) => {
    if (a.free && !b.free) return -1
    if (!a.free && b.free) return 1
    return a.name.localeCompare(b.name)
  })

  const envKey = currentProvider?.envKey || ''

  const handleRefreshModels = async () => {
    setRefreshing(true)
    try {
      await onRefreshModels()
    } finally {
      setRefreshing(false)
    }
  }

  const iconColorMap: Record<string, string> = {
    llm: 'text-violet-500',
    image: 'text-emerald-500',
    tts: 'text-amber-500',
    video: 'text-rose-500',
  }
  const iconColor = iconColorMap[category] || 'text-violet-500'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Server className={cn('size-4', iconColor)} />
        <h3 className="text-sm font-semibold text-slate-900">供应商与模型</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Provider Select */}
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Server className={cn('size-4', iconColor)} />
            <Label className="text-sm font-medium text-slate-900">供应商</Label>
          </div>
          <p className="text-xs text-slate-500">选择AI服务供应商，不同供应商支持的功能和模型不同。</p>
          <Select value={providerId} onValueChange={onProviderChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="选择供应商" />
            </SelectTrigger>
            <SelectContent>
              {providers.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span>{p.name}</span>
                    {p.id === 'z-ai' && (
                      <Badge variant="outline" className="text-[9px] border-emerald-300 bg-emerald-50 text-emerald-600">内置</Badge>
                    )}
                    {p.hasEnvKey && p.id !== 'z-ai' && (
                      <Badge variant="outline" className="text-[9px] border-emerald-300 bg-emerald-50 text-emerald-600">Key 已配置</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentProvider && (
            <div className="flex items-center justify-between">
              <a
                href={currentProvider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-violet-500 transition-colors"
              >
                <ExternalLink className="size-3" />
                {currentProvider.website}
              </a>
            </div>
          )}
        </div>

        {/* API Key Input */}
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Key className={cn('size-4', iconColor)} />
            <Label className="text-sm font-medium text-slate-900">API Key</Label>
            {(apiKey && apiKey !== '' && apiKey !== '••••••••') ? (
              <Badge variant="outline" className="text-[9px] border-emerald-300 bg-emerald-50 text-emerald-600">自定义</Badge>
            ) : hasEnvKey ? (
              <Badge variant="outline" className="text-[9px] border-emerald-300 bg-emerald-50 text-emerald-600">环境变量</Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] border-amber-300 bg-amber-50 text-amber-600">未配置</Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
            留空则使用环境变量 {envKey && <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono text-slate-600">{envKey}</code>}
            {hasEnvKey && <span className="ml-1 text-emerald-500">(已配置)</span>}
          </p>
          <div className="relative">
            <Input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder={hasEnvKey ? `留空使用环境变量 ${envKey}` : '输入 API Key'}
              className="pr-10 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Model Select */}
      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className={cn('size-4', iconColor)} />
            <Label className="text-sm font-medium text-slate-900">模型选择</Label>
            <Badge variant="outline" className="text-[9px] text-slate-500">{sortedModels.length} 个模型</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-slate-500 hover:text-violet-600"
            onClick={handleRefreshModels}
            disabled={refreshing}
          >
            <RefreshCw className={cn('size-3', refreshing && 'animate-spin')} />
            刷新模型
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          选择该供应商下的具体模型。<Badge variant="outline" className="mx-0.5 text-[9px] border-emerald-300 bg-emerald-50 text-emerald-600">免费</Badge> 标记的模型无需付费。
        </p>
        {sortedModels.length > 0 ? (
          <Select value={modelId} onValueChange={onModelChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="选择模型" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {sortedModels.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex items-center gap-2">
                    <span>{m.name}</span>
                    {m.free && (
                      <Badge variant="outline" className="text-[9px] border-emerald-300 bg-emerald-50 text-emerald-600">免费</Badge>
                    )}
                    {m.contextLength && (
                      <span className="text-[10px] text-slate-400">
                        {(m.contextLength / 1024).toFixed(0)}K ctx
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
            <Cpu className="mx-auto size-6 text-slate-300" />
            <p className="mt-2 text-xs text-slate-400">该供应商在此分类下暂无可用模型</p>
            <p className="mt-1 text-[10px] text-slate-400">点击「刷新模型」获取最新列表</p>
          </div>
        )}

        {/* Model info display */}
        {modelId && modelId !== 'default' && (() => {
          const selectedModel = sortedModels.find(m => m.id === modelId)
          if (!selectedModel) return null
          return (
            <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-700">{selectedModel.name}</span>
                {selectedModel.free && (
                  <Badge variant="outline" className="text-[9px] border-emerald-300 bg-emerald-50 text-emerald-600">免费</Badge>
                )}
              </div>
              <div className="flex gap-4">
                <span>模型ID: <code className="rounded bg-white px-1 py-0.5 font-mono text-[10px]">{selectedModel.id}</code></span>
                {selectedModel.contextLength && (
                  <span>上下文: {(selectedModel.contextLength / 1024).toFixed(0)}K tokens</span>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ─── LLM Configuration Panel ────────────────────────────────
function LLMConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  const temperature = (config.temperature as number) ?? 0.7
  const topP = (config.topP as number) ?? 1.0
  const maxTokens = (config.maxTokens as number) ?? 4096

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-violet-500" />
        <h3 className="text-sm font-semibold text-slate-900">模型参数</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Prompt */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-violet-500" />
            <Label className="text-sm font-medium text-slate-900">系统提示词模板</Label>
          </div>
          <p className="text-xs text-slate-500">定义AI在剧本创作中扮演的角色和行为准则</p>
          <Textarea
            value={(config.systemPrompt as string) || ''}
            onChange={(e) => onChange('systemPrompt', e.target.value)}
            placeholder="你是一位资深的短剧编剧和创意顾问..."
            className="min-h-[120px] resize-y font-mono text-sm"
          />
        </div>

        {/* Temperature */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className="size-4 text-violet-500" />
              <Label className="text-sm font-medium text-slate-900">温度 (Temperature)</Label>
            </div>
            <Badge variant="outline" className="font-mono text-xs">{temperature.toFixed(2)}</Badge>
          </div>
          <p className="text-xs text-slate-500">控制输出的随机性。值越高，创作内容越有创意；值越低，输出越稳定一致。</p>
          <Slider
            value={[temperature]}
            onValueChange={([val]) => onChange('temperature', val)}
            min={0}
            max={2}
            step={0.05}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>精确 (0)</span>
            <span>平衡 (1)</span>
            <span>创意 (2)</span>
          </div>
          <div className="flex gap-2 pt-2">
            {[
              { label: '精确', value: 0.2 },
              { label: '平衡', value: 0.7 },
              { label: '创意', value: 1.2 },
              { label: '自由', value: 1.8 },
            ].map(preset => (
              <Button
                key={preset.label}
                variant={temperature === preset.value ? 'default' : 'outline'}
                size="sm"
                className="h-7 flex-1 text-[11px]"
                onClick={() => onChange('temperature', preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Top P */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-violet-500" />
              <Label className="text-sm font-medium text-slate-900">Top P (核采样)</Label>
            </div>
            <Badge variant="outline" className="font-mono text-xs">{topP.toFixed(2)}</Badge>
          </div>
          <p className="text-xs text-slate-500">控制候选词范围。较低的值限制输出更集中于高概率词。</p>
          <Slider
            value={[topP]}
            onValueChange={([val]) => onChange('topP', val)}
            min={0}
            max={1}
            step={0.05}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>严格 (0)</span>
            <span>广泛 (1)</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-violet-500" />
            <Label className="text-sm font-medium text-slate-900">最大生成长度 (Max Tokens)</Label>
          </div>
          <p className="text-xs text-slate-500">限制AI单次生成的最大文本长度。较长的值允许更完整的输出。</p>
          <Input
            type="number"
            value={maxTokens}
            onChange={(e) => onChange('maxTokens', parseInt(e.target.value) || 4096)}
            min={256}
            max={32768}
            step={256}
            className="font-mono text-sm"
          />
          <div className="flex gap-2">
            {[
              { label: '简洁', value: 1024 },
              { label: '标准', value: 4096 },
              { label: '详细', value: 8192 },
              { label: '超长', value: 16384 },
            ].map(preset => (
              <Button
                key={preset.label}
                variant={maxTokens === preset.value ? 'default' : 'outline'}
                size="sm"
                className="h-7 flex-1 text-[11px]"
                onClick={() => onChange('maxTokens', preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Advanced Info */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50/50 to-purple-50/50 p-4">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-violet-500" />
            <h4 className="text-sm font-medium text-slate-900">模型信息</h4>
          </div>
          <div className="space-y-2 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>响应格式</span>
              <span className="font-medium text-slate-700">Chat Completions</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between">
              <span>支持模式</span>
              <span className="font-medium text-slate-700">多轮对话</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between">
              <span>语言</span>
              <span className="font-medium text-slate-700">中文/英文</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Image Generation Configuration ─────────────────────────
function ImageConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-slate-900">图像参数</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Character Image Size */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Wand2 className="size-4 text-emerald-500" />
            <Label className="text-sm font-medium text-slate-900">角色图片默认尺寸</Label>
          </div>
          <p className="text-xs text-slate-500">角色头像/立绘的生成尺寸，竖版更适合人物展示。</p>
          <Select
            value={(config.charSize as string) || '864x1152'}
            onValueChange={(val) => onChange('charSize', val)}
          >
            <SelectTrigger className="font-mono text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_SIZES.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Scene Image Size */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Film className="size-4 text-emerald-500" />
            <Label className="text-sm font-medium text-slate-900">场景图片默认尺寸</Label>
          </div>
          <p className="text-xs text-slate-500">场景/分镜图的生成尺寸，横版更适合展示场景。</p>
          <Select
            value={(config.sceneSize as string) || '1152x864'}
            onValueChange={(val) => onChange('sceneSize', val)}
          >
            <SelectTrigger className="font-mono text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_SIZES.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quality */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-500" />
            <Label className="text-sm font-medium text-slate-900">图像质量</Label>
          </div>
          <p className="text-xs text-slate-500">更高质量需要更长生成时间。</p>
          <div className="flex gap-2">
            {[
              { label: '标准', value: 'standard', desc: '快速生成' },
              { label: '高清', value: 'hd', desc: '精细画质' },
            ].map(q => (
              <Button
                key={q.value}
                variant={(config.quality as string) === q.value ? 'default' : 'outline'}
                size="sm"
                className="h-auto flex-1 flex-col gap-0.5 py-2"
                onClick={() => onChange('quality', q.value)}
              >
                <span className="text-xs font-medium">{q.label}</span>
                <span className="text-[10px] opacity-70">{q.desc}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-emerald-500" />
            <Label className="text-sm font-medium text-slate-900">图像风格</Label>
          </div>
          <p className="text-xs text-slate-500">影响生成图像的整体风格和色彩表现。</p>
          <div className="flex gap-2">
            {[
              { label: '生动', value: 'vivid', desc: '色彩鲜明' },
              { label: '自然', value: 'natural', desc: '写实风格' },
            ].map(s => (
              <Button
                key={s.value}
                variant={(config.style as string) === s.value ? 'default' : 'outline'}
                size="sm"
                className="h-auto flex-1 flex-col gap-0.5 py-2"
                onClick={() => onChange('style', s.value)}
              >
                <span className="text-xs font-medium">{s.label}</span>
                <span className="text-[10px] opacity-70">{s.desc}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Enhance Prompt */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="size-4 text-emerald-500" />
              <Label className="text-sm font-medium text-slate-900">自动优化提示词</Label>
            </div>
            <Switch
              checked={(config.enhancePrompt as boolean) ?? true}
              onCheckedChange={(checked) => onChange('enhancePrompt', checked)}
            />
          </div>
          <p className="text-xs text-slate-500">
            开启后，系统会自动优化您的图片描述提示词，提升生成质量。
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-4">
          <div className="flex items-center gap-2">
            <MonitorPlay className="size-4 text-emerald-500" />
            <h4 className="text-sm font-medium text-slate-900">图像生成信息</h4>
          </div>
          <div className="space-y-2 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>输出格式</span>
              <span className="font-medium text-slate-700">PNG (Base64)</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between">
              <span>支持用途</span>
              <span className="font-medium text-slate-700">角色/场景/分镜</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between">
              <span>平均耗时</span>
              <span className="font-medium text-slate-700">10-30秒</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── TTS Configuration ──────────────────────────────────────
function TTSConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  const speed = (config.defaultSpeed as number) ?? 1.0
  const maxChars = (config.maxChars as number) ?? 1024

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-slate-900">语音参数</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Default Voice */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Volume2 className="size-4 text-amber-500" />
            <Label className="text-sm font-medium text-slate-900">默认语音</Label>
          </div>
          <p className="text-xs text-slate-500">配音工作室的默认声音类型，可在角色设置中单独指定。</p>
          <Select
            value={(config.defaultVoice as string) || 'tongtong'}
            onValueChange={(val) => onChange('defaultVoice', val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICE_OPTIONS.map(v => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label} - {v.desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Speed */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="size-4 text-amber-500" />
              <Label className="text-sm font-medium text-slate-900">默认语速</Label>
            </div>
            <Badge variant="outline" className="font-mono text-xs">{speed.toFixed(1)}x</Badge>
          </div>
          <p className="text-xs text-slate-500">控制语音播放速度。1.0为正常语速。</p>
          <Slider
            value={[speed]}
            onValueChange={([val]) => onChange('defaultSpeed', val)}
            min={0.5}
            max={2.0}
            step={0.1}
            className="mt-2"
          />
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>0.5x (慢速)</span>
            <span>1.0x (正常)</span>
            <span>2.0x (快速)</span>
          </div>
        </div>

        {/* Audio Format */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Mic className="size-4 text-amber-500" />
            <Label className="text-sm font-medium text-slate-900">输出格式</Label>
          </div>
          <p className="text-xs text-slate-500">语音合成输出的音频格式。</p>
          <div className="flex gap-2">
            {['wav', 'mp3', 'opus'].map(fmt => (
              <Button
                key={fmt}
                variant={(config.format as string) === fmt ? 'default' : 'outline'}
                size="sm"
                className="h-8 flex-1 text-xs"
                onClick={() => onChange('format', fmt)}
              >
                {fmt.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Max Characters */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-amber-500" />
            <Label className="text-sm font-medium text-slate-900">最大文本长度</Label>
          </div>
          <p className="text-xs text-slate-500">单次语音合成的最大字符数限制。</p>
          <Input
            type="number"
            value={maxChars}
            onChange={(e) => onChange('maxChars', parseInt(e.target.value) || 1024)}
            min={100}
            max={4096}
            step={128}
            className="font-mono text-sm"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Video Generation Configuration ─────────────────────────
function VideoConfig({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-rose-500" />
        <h3 className="text-sm font-semibold text-slate-900">视频参数</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quality */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-rose-500" />
            <Label className="text-sm font-medium text-slate-900">默认画质</Label>
          </div>
          <p className="text-xs text-slate-500">视频生成画质，更高质量需要更长等待时间。</p>
          <div className="flex gap-2">
            {[
              { label: '极速', value: 'speed', desc: '优先速度' },
              { label: '标准', value: 'standard', desc: '平衡选择' },
              { label: '高清', value: 'hd', desc: '最佳画质' },
            ].map(q => (
              <Button
                key={q.value}
                variant={(config.defaultQuality as string) === q.value ? 'default' : 'outline'}
                size="sm"
                className="h-auto flex-1 flex-col gap-0.5 py-2"
                onClick={() => onChange('defaultQuality', q.value)}
              >
                <span className="text-xs font-medium">{q.label}</span>
                <span className="text-[10px] opacity-70">{q.desc}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Timer className="size-4 text-rose-500" />
            <Label className="text-sm font-medium text-slate-900">默认时长 (秒)</Label>
          </div>
          <p className="text-xs text-slate-500">单个视频片段的默认时长。</p>
          <div className="flex gap-2">
            {[
              { label: '3秒', value: 3 },
              { label: '5秒', value: 5 },
              { label: '8秒', value: 8 },
              { label: '10秒', value: 10 },
            ].map(d => (
              <Button
                key={d.label}
                variant={(config.defaultDuration as number) === d.value ? 'default' : 'outline'}
                size="sm"
                className="h-auto flex-1 flex-col gap-0.5 py-2"
                onClick={() => onChange('defaultDuration', d.value)}
              >
                <span className="text-xs font-medium">{d.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* FPS */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <MonitorPlay className="size-4 text-rose-500" />
            <Label className="text-sm font-medium text-slate-900">帧率 (FPS)</Label>
          </div>
          <p className="text-xs text-slate-500">视频的帧率。更高的帧率让画面更流畅。</p>
          <div className="flex gap-2">
            {[
              { label: '24fps', value: 24, desc: '电影标准' },
              { label: '30fps', value: 30, desc: '流畅' },
              { label: '60fps', value: 60, desc: '丝滑' },
            ].map(f => (
              <Button
                key={f.value}
                variant={(config.defaultFps as number) === f.value ? 'default' : 'outline'}
                size="sm"
                className="h-auto flex-1 flex-col gap-0.5 py-2"
                onClick={() => onChange('defaultFps', f.value)}
              >
                <span className="text-xs font-medium">{f.label}</span>
                <span className="text-[10px] opacity-70">{f.desc}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Film className="size-4 text-rose-500" />
            <Label className="text-sm font-medium text-slate-900">分辨率</Label>
          </div>
          <p className="text-xs text-slate-500">视频输出的分辨率。</p>
          <Select
            value={(config.defaultSize as string) || '1920x1080'}
            onValueChange={(val) => onChange('defaultSize', val)}
          >
            <SelectTrigger className="font-mono text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_SIZES.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* With Audio */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="size-4 text-rose-500" />
              <Label className="text-sm font-medium text-slate-900">自动生成音频</Label>
            </div>
            <Switch
              checked={(config.withAudio as boolean) ?? false}
              onCheckedChange={(checked) => onChange('withAudio', checked)}
            />
          </div>
          <p className="text-xs text-slate-500">
            开启后，视频生成时会自动包含音频轨道。注意：可能会增加生成时间和成本。
          </p>
        </div>

        {/* Auto Poll */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-rose-500" />
              <Label className="text-sm font-medium text-slate-900">自动轮询状态</Label>
            </div>
            <Switch
              checked={(config.autoPoll as boolean) ?? true}
              onCheckedChange={(checked) => onChange('autoPoll', checked)}
            />
          </div>
          <p className="text-xs text-slate-500">
            开启后，提交视频生成任务后会自动轮询状态直到完成。
          </p>
        </div>
      </div>
    </div>
  )
}
