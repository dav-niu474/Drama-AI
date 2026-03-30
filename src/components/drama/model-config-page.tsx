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
  AlertCircle,
  ChevronRight,
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

// ─── Types ─────────────────────────────────────────────────
interface ModelConfig {
  id: string
  category: string
  config: Record<string, unknown>
  enabled: boolean
}

interface AllConfigs {
  llm: ModelConfig
  image: ModelConfig
  tts: ModelConfig
  video: ModelConfig
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

const VOICE_OPTIONS = [
  { value: 'tongtong', label: '童童 (甜美女声)' },
  { value: 'zhiyan', label: '知燕 (温柔女声)' },
  { value: 'sicheng', label: '思诚 (知性男声)' },
  { value: 'zhida', label: '知达 (沉稳男声)' },
  { value: 'zhiyu', label: '知语 (标准女声)' },
  { value: 'zhiwen', label: '知文 (新闻男声)' },
  { value: 'zhimiao', label: '知淼 (儿童声音)' },
]

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

  // 临时编辑状态
  const [editConfigs, setEditConfigs] = useState<Record<string, Record<string, unknown>>>({})

  // 加载配置
  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/model-config')
      const data = await res.json()
      if (data.success && data.configs) {
        setConfigs(data.configs)
        // 初始化编辑状态
        const edits: Record<string, Record<string, unknown>> = {}
        for (const [key, val] of Object.entries(data.configs)) {
          edits[key] = (val as ModelConfig).config
        }
        setEditConfigs(edits)
      }
    } catch (error) {
      console.error('Failed to load configs:', error)
      toast.error('加载配置失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  // 保存单个配置
  const saveConfig = async (category: string) => {
    setSaving(category)
    try {
      const config = editConfigs[category]
      const enabled = configs?.[category]?.enabled ?? true

      const res = await fetch('/api/model-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, config, enabled }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${CATEGORIES.find(c => c.key === category)?.label}配置已保存`)
        fetchConfigs()
      } else {
        toast.error('保存失败')
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
      const res = await fetch('/api/model-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, config, enabled }),
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

  // 检查是否有未保存的更改
  const hasChanges = (category: string) => {
    if (!configs?.[category]) return false
    return JSON.stringify(editConfigs[category]) !== JSON.stringify(configs[category].config)
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
            <p className="text-sm text-slate-500">自定义AI模型参数，优化创作体验</p>
          </div>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const isEnabled = configs[cat.key]?.enabled ?? true
          const Icon = cat.icon
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
                  <Badge
                    variant={isEnabled ? 'default' : 'secondary'}
                    className={cn(
                      'text-[10px]',
                      isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {isEnabled ? '已启用' : '已禁用'}
                  </Badge>
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-semibold text-slate-900">{cat.label}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{cat.desc}</p>
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
                    disabled={!hasChanges(activeTab) || saving === activeTab}
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
                  <li>• 修改参数后点击"保存"按钮使其生效</li>
                  <li>• 禁用某个模型类型后，对应功能模块将使用默认配置</li>
                  <li>• 重置操作将恢复该分类的所有参数为系统默认值</li>
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* System Prompt */}
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-slate-900">系统提示词模板</h3>
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
        {/* Quick presets */}
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
            <span>引擎</span>
            <span className="font-medium text-slate-700">z-ai-web-dev-sdk</span>
          </div>
          <Separator className="my-1" />
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
            <span>引擎</span>
            <span className="font-medium text-slate-700">z-ai-web-dev-sdk</span>
          </div>
          <Separator className="my-1" />
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
                {v.label}
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
        <div className="flex gap-2 pt-1">
          {[
            { label: '慢速', value: 0.7 },
            { label: '正常', value: 1.0 },
            { label: '快速', value: 1.4 },
          ].map(preset => (
            <Button
              key={preset.label}
              variant={speed === preset.value ? 'default' : 'outline'}
              size="sm"
              className="h-7 flex-1 text-[11px]"
              onClick={() => onChange('defaultSpeed', preset.value)}
            >
              {preset.label}
            </Button>
          ))}
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
        <div className="flex gap-2">
          {[
            { label: '256字', value: 256 },
            { label: '512字', value: 512 },
            { label: '1024字', value: 1024 },
            { label: '2048字', value: 2048 },
          ].map(preset => (
            <Button
              key={preset.label}
              variant={maxChars === preset.value ? 'default' : 'outline'}
              size="sm"
              className="h-7 flex-1 text-[11px]"
              onClick={() => onChange('maxChars', preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Voice Preview */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-amber-500" />
          <h4 className="text-sm font-medium text-slate-900">可用声音一览</h4>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {VOICE_OPTIONS.map(v => (
            <div
              key={v.value}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-all',
                (config.defaultVoice as string) === v.value
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <div className={cn(
                'flex size-8 items-center justify-center rounded-full',
                (config.defaultVoice as string) === v.value
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-400',
              )}>
                <Mic className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-900">{v.value}</p>
                <p className="truncate text-[10px] text-slate-500">{v.label}</p>
              </div>
              {(config.defaultVoice as string) === v.value && (
                <Check className="size-3.5 text-amber-500" />
              )}
            </div>
          ))}
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

      {/* Video Info */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-gradient-to-br from-rose-50/50 to-pink-50/50 p-4 lg:col-span-2">
        <div className="flex items-center gap-2">
          <Info className="size-4 text-rose-500" />
          <h4 className="text-sm font-medium text-slate-900">视频生成信息</h4>
        </div>
        <div className="grid grid-cols-1 gap-3 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-slate-400">引擎</p>
            <p className="mt-1 font-medium text-slate-700">z-ai-web-dev-sdk</p>
          </div>
          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-slate-400">输出格式</p>
            <p className="mt-1 font-medium text-slate-700">MP4 (URL)</p>
          </div>
          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-slate-400">支持输入</p>
            <p className="mt-1 font-medium text-slate-700">文本/图片</p>
          </div>
          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-slate-400">平均耗时</p>
            <p className="mt-1 font-medium text-slate-700">1-5分钟</p>
          </div>
        </div>
      </div>
    </div>
  )
}
