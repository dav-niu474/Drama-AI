'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Send,
  Copy,
  Save,
  Trash2,
  ArrowRight,
  Lightbulb,
  FileText,
  Scissors,
  Wand2,
  MessageCircle,
  Loader2,
  ChevronDown,
  FileInput,
  Check,
  AlertCircle,
  BookOpen,
  Film,
  Users,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useDramaStore, type WorkflowStep } from '@/store/drama-store'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────
type ScriptMode = 'brainstorm' | 'fullscript' | 'scenes' | 'refine' | 'chat'

interface ModeConfig {
  key: ScriptMode
  label: string
  icon: React.ElementType
  description: string
}

interface BrainstormResult {
  title?: string
  logline?: string
  genre?: string
  themes?: string[]
  characterCount?: number
  episodeCount?: number
  plotOutline?: string
  twistPoints?: string[]
  targetAudience?: string
  tone?: string
}

interface SceneItem {
  title?: string
  description?: string
  dialogue?: string
  cameraAngle?: string
  timeOfDay?: string
  mood?: string
  location?: string
  duration?: number
}

// ── Constants ──────────────────────────────────────────────────────────────
const MODES: ModeConfig[] = [
  { key: 'brainstorm', label: '创意构思', icon: Lightbulb, description: '构思创意大纲' },
  { key: 'fullscript', label: '剧本生成', icon: FileText, description: '生成完整剧本' },
  { key: 'scenes', label: '场景拆分', icon: Scissors, description: '拆分为场景' },
  { key: 'refine', label: '优化润色', icon: Wand2, description: '优化剧本内容' },
  { key: 'chat', label: '自由对话', icon: MessageCircle, description: '自由讨论创意' },
]

const GENRES = [
  { value: '都市', label: '都市' },
  { value: '古装', label: '古装' },
  { value: '悬疑', label: '悬疑' },
  { value: '喜剧', label: '喜剧' },
  { value: '爱情', label: '爱情' },
  { value: '科幻', label: '科幻' },
  { value: '玄幻', label: '玄幻' },
  { value: '职场', label: '职场' },
]

const STYLES = [
  { value: '现代都市', label: '现代都市' },
  { value: '古典诗意', label: '古典诗意' },
  { value: '悬疑烧脑', label: '悬疑烧脑' },
  { value: '轻松幽默', label: '轻松幽默' },
  { value: '浪漫唯美', label: '浪漫唯美' },
  { value: '热血激昂', label: '热血激昂' },
  { value: '暗黑现实', label: '暗黑现实' },
]

// ── Utility functions ──────────────────────────────────────────────────────
function countScenes(text: string): number {
  const scenePatterns = /第[一二三四五六七八九十百千\d]+[场幕集节]|场景\s*\d+|Scene\s*\d+/gi
  const matches = text.match(scenePatterns)
  return matches ? matches.length : 0
}

function tryParseJSON<T>(str: string): T | null {
  try {
    // Try direct parse
    const parsed = JSON.parse(str)
    if (typeof parsed === 'object' && parsed !== null) return parsed as T
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = str.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim())
        if (typeof parsed === 'object' && parsed !== null) return parsed as T
      } catch {
        // ignore
      }
    }
    // Try to find first { or [ and parse from there
    const startBrace = str.indexOf('{')
    const startBracket = str.indexOf('[')
    let start = -1
    if (startBrace !== -1 && startBracket !== -1) {
      start = Math.min(startBrace, startBracket)
    } else if (startBrace !== -1) {
      start = startBrace
    } else if (startBracket !== -1) {
      start = startBracket
    }
    if (start !== -1) {
      try {
        const jsonStr = str.slice(start)
        let depth = 0
        let end = -1
        const openChar = jsonStr[0]
        const closeChar = openChar === '{' ? '}' : ']'
        for (let i = 0; i < jsonStr.length; i++) {
          if (jsonStr[i] === openChar) depth++
          else if (jsonStr[i] === closeChar) depth--
          if (depth === 0) { end = i + 1; break }
        }
        if (end !== -1) {
          const parsed = JSON.parse(jsonStr.slice(0, end))
          if (typeof parsed === 'object' && parsed !== null) return parsed as T
        }
      } catch {
        // ignore
      }
    }
  }
  return null
}

function formatMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeContent: string[] = []
  let codeLang = ''

  lines.forEach((line, idx) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${idx}`} className="my-2 rounded-lg bg-black/40 p-3 text-sm font-mono text-green-300/90 overflow-x-auto">
            <code>{codeContent.join('\n')}</code>
          </pre>
        )
        codeContent = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
        codeLang = line.slice(3).trim()
      }
      return
    }
    if (inCodeBlock) {
      codeContent.push(line)
      return
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h4 key={idx} className="mt-3 mb-1 text-sm font-bold text-foreground">{line.slice(4)}</h4>)
      return
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={idx} className="mt-4 mb-2 text-base font-bold text-foreground">{line.slice(3)}</h3>)
      return
    }
    if (line.startsWith('# ')) {
      elements.push(<h2 key={idx} className="mt-4 mb-2 text-lg font-bold text-foreground">{line.slice(2)}</h2>)
      return
    }

    // Bold text
    const boldProcessed = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')

    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<div key={idx} className="h-2" />)
      return
    }

    // List items
    if (line.match(/^[-*]\s/) || line.match(/^\d+\.\s/)) {
      elements.push(
        <div key={idx} className="flex gap-2 text-sm leading-relaxed text-muted-foreground py-0.5">
          <span className="text-violet-400 shrink-0">{line.match(/^\d+\./) ? '•' : '•'}</span>
          <span dangerouslySetInnerHTML={{ __html: boldProcessed.replace(/^[-*]\s+|^\d+\.\s+/, '') }} />
        </div>
      )
      return
    }

    // Regular paragraph
    elements.push(
      <p key={idx} className="text-sm leading-relaxed text-muted-foreground py-0.5" dangerouslySetInnerHTML={{ __html: boldProcessed }} />
    )
  })

  return elements
}

// ── Sub-components ─────────────────────────────────────────────────────────

/** Loading dots animation */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-violet-400"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

/** Brainstorm result rendered as structured cards */
function BrainstormCard({ data }: { data: BrainstormResult }) {
  return (
    <div className="space-y-3">
      {data.title && (
        <div className="rounded-lg bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 p-3">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="size-4 text-violet-400" />
            <span className="text-xs text-violet-300 font-medium">短剧标题</span>
          </div>
          <h3 className="text-base font-bold text-foreground">{data.title}</h3>
        </div>
      )}

      {data.logline && (
        <div className="rounded-lg bg-muted/50 border border-border/50 p-3">
          <span className="text-xs text-muted-foreground font-medium">一句话梗概</span>
          <p className="mt-1 text-sm text-foreground/90 italic">{data.logline}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {data.genre && (
          <div className="rounded-lg bg-muted/30 border border-border/30 p-2.5">
            <span className="text-xs text-muted-foreground">题材</span>
            <p className="text-sm font-medium text-foreground">{data.genre}</p>
          </div>
        )}
        {data.tone && (
          <div className="rounded-lg bg-muted/30 border border-border/30 p-2.5">
            <span className="text-xs text-muted-foreground">基调</span>
            <p className="text-sm font-medium text-foreground">{data.tone}</p>
          </div>
        )}
        {data.characterCount && (
          <div className="rounded-lg bg-muted/30 border border-border/30 p-2.5">
            <span className="text-xs text-muted-foreground">角色数</span>
            <p className="text-sm font-medium text-foreground">{data.characterCount}人</p>
          </div>
        )}
        {data.episodeCount && (
          <div className="rounded-lg bg-muted/30 border border-border/30 p-2.5">
            <span className="text-xs text-muted-foreground">建议集数</span>
            <p className="text-sm font-medium text-foreground">{data.episodeCount}集</p>
          </div>
        )}
        {data.targetAudience && (
          <div className="rounded-lg bg-muted/30 border border-border/30 p-2.5 col-span-2">
            <span className="text-xs text-muted-foreground">目标受众</span>
            <p className="text-sm font-medium text-foreground">{data.targetAudience}</p>
          </div>
        )}
      </div>

      {data.themes && data.themes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.themes.map((theme, i) => (
            <Badge key={i} variant="secondary" className="bg-violet-500/15 text-violet-300 border-violet-500/30">
              {theme}
            </Badge>
          ))}
        </div>
      )}

      {data.plotOutline && (
        <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
          <span className="text-xs text-muted-foreground font-medium">详细剧情大纲</span>
          <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{data.plotOutline}</p>
        </div>
      )}

      {data.twistPoints && data.twistPoints.length > 0 && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="size-3.5 text-amber-400" />
            <span className="text-xs text-amber-300 font-medium">剧情反转点</span>
          </div>
          <ul className="space-y-1">
            {data.twistPoints.map((twist, i) => (
              <li key={i} className="text-sm text-foreground/80 flex gap-2">
                <span className="text-amber-400 shrink-0">•</span>
                {twist}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** Scene breakdown rendered as scene cards */
function SceneCard({ scenes }: { scenes: SceneItem[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Film className="size-4 text-violet-400" />
        <span className="text-sm font-medium text-foreground">场景拆分结果</span>
        <Badge variant="secondary" className="text-xs">{scenes.length} 个场景</Badge>
      </div>
      {scenes.map((scene, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="rounded-lg bg-muted/40 border border-border/40 p-3 space-y-2"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Badge variant="outline" className="text-violet-400 border-violet-500/40 text-xs">
                场景 {idx + 1}
              </Badge>
              {scene.title && <span>{scene.title}</span>}
            </h4>
            <div className="flex gap-1.5">
              {scene.mood && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{scene.mood}</span>
              )}
              {scene.timeOfDay && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{scene.timeOfDay}</span>
              )}
            </div>
          </div>
          {scene.cameraAngle && (
            <p className="text-xs text-violet-300/70">景别：{scene.cameraAngle}</p>
          )}
          {scene.location && (
            <p className="text-xs text-muted-foreground">地点：{scene.location}</p>
          )}
          {scene.description && (
            <p className="text-xs text-foreground/70 leading-relaxed bg-black/20 rounded p-2 font-mono">
              {scene.description}
            </p>
          )}
          {scene.dialogue && (
            <div className="text-xs text-foreground/60 whitespace-pre-wrap border-t border-border/30 pt-2">
              {scene.dialogue}
            </div>
          )}
          {scene.duration && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" /> {scene.duration}秒
            </p>
          )}
        </motion.div>
      ))}
    </div>
  )
}

/** No project selected message */
function NoProjectMessage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <div className="rounded-2xl bg-muted/50 border border-border p-8 flex flex-col items-center gap-4">
          <div className="rounded-full bg-violet-500/10 p-4">
            <FileText className="size-10 text-violet-400" />
          </div>
          <h3 className="text-lg font-medium text-foreground">请先选择或创建一个项目</h3>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            在剧本工作室开始创作之前，请先在控制台中选择一个项目或创建新项目
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ScriptStudio() {
  const {
    currentProject,
    scriptMessages,
    addScriptMessage,
    clearScriptMessages,
    isGenerating,
    setIsGenerating,
    generatingStep,
    setGeneratingStep,
    setCurrentStep,
    characters,
  } = useDramaStore()

  const [activeMode, setActiveMode] = useState<ScriptMode>('brainstorm')
  const [scriptContent, setScriptContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  // Mode-specific form state
  const [brainstormGenre, setBrainstormGenre] = useState('')
  const [brainstormStyle, setBrainstormStyle] = useState('')
  const [brainstormIdea, setBrainstormIdea] = useState('')
  const [scriptPrompt, setScriptPrompt] = useState('')
  const [refineText, setRefineText] = useState('')
  const [chatInput, setChatInput] = useState('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [scriptMessages, isGenerating])

  // Pre-fill editor with last AI response for relevant modes
  useEffect(() => {
    const lastAiMsg = [...scriptMessages].reverse().find(m => m.role === 'assistant')
    if (lastAiMsg && activeMode === 'scenes') {
      setScriptPrompt(lastAiMsg.content)
    } else if (lastAiMsg && activeMode === 'refine') {
      setRefineText(lastAiMsg.content)
    }
  }, [activeMode, scriptMessages])

  // Get mode config
  const currentModeConfig = MODES.find(m => m.key === activeMode)!

  // Word and scene counts
  const wordCount = scriptContent.length
  const sceneCount = countScenes(scriptContent)

  // Generate handler
  const handleGenerate = useCallback(async () => {
    if (isGenerating) return

    let userPrompt = ''
    let apiBody: Record<string, string> = { mode: activeMode }

    switch (activeMode) {
      case 'brainstorm':
        if (!brainstormIdea.trim()) return
        userPrompt = brainstormIdea
        apiBody = {
          mode: 'brainstorm',
          prompt: brainstormIdea,
          genre: brainstormGenre,
          style: brainstormStyle,
        }
        break
      case 'fullscript':
        if (!scriptPrompt.trim()) return
        userPrompt = scriptPrompt
        apiBody = {
          mode: 'fullscript',
          prompt: scriptPrompt,
          characters: characters.map(c => `${c.name}(${c.role})`).join('、'),
          existingScript: scriptContent || undefined,
        }
        break
      case 'scenes':
        if (!scriptPrompt.trim() && !scriptContent.trim()) return
        userPrompt = scriptPrompt || scriptContent
        apiBody = {
          mode: 'scenes',
          prompt: userPrompt,
        }
        break
      case 'refine':
        if (!refineText.trim()) return
        userPrompt = refineText
        apiBody = {
          mode: 'refine',
          prompt: refineText,
          existingScript: refineText,
        }
        break
      case 'chat':
        if (!chatInput.trim()) return
        userPrompt = chatInput
        apiBody = {
          mode: 'chat',
          prompt: chatInput,
        }
        break
    }

    addScriptMessage({ role: 'user', content: userPrompt })
    setIsGenerating(true)
    setGeneratingStep(`${currentModeConfig.label}生成中...`)

    // Clear input
    if (activeMode === 'chat') setChatInput('')
    if (activeMode === 'brainstorm') setBrainstormIdea('')

    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody),
      })

      const data = await res.json()

      if (data.success && data.content) {
        addScriptMessage({ role: 'assistant', content: data.content, mode: data.mode })

        // Auto-fill editor for certain modes
        if (data.mode === 'fullscript' || data.mode === 'refine') {
          setScriptContent(data.content)
        }
      } else {
        addScriptMessage({
          role: 'assistant',
          content: `生成失败：${data.error || '未知错误'}，请重试。`,
        })
      }
    } catch (err) {
      addScriptMessage({
        role: 'assistant',
        content: `网络请求失败，请检查网络连接后重试。`,
      })
    } finally {
      setIsGenerating(false)
      setGeneratingStep('')
    }
  }, [
    activeMode,
    isGenerating,
    brainstormIdea,
    brainstormGenre,
    brainstormStyle,
    scriptPrompt,
    refineText,
    chatInput,
    scriptContent,
    characters,
    currentModeConfig,
    addScriptMessage,
    setIsGenerating,
    setGeneratingStep,
  ])

  // Copy script
  const handleCopy = async () => {
    if (!scriptContent) return
    await navigator.clipboard.writeText(scriptContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Save script (local state)
  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Clear editor
  const handleClear = () => {
    setScriptContent('')
  }

  // Navigate to storyboard
  const handleImportScenes = () => {
    setCurrentStep('storyboard')
  }

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleGenerate()
    }
  }

  // Render mode input fields
  const renderModeInput = () => {
    switch (activeMode) {
      case 'brainstorm':
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">题材类型</label>
                <Select value={brainstormGenre} onValueChange={setBrainstormGenre}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="选择题材" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => (
                      <SelectItem key={g.value} value={g.value} className="text-xs">
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">风格偏好</label>
                <Select value={brainstormStyle} onValueChange={setBrainstormStyle}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="选择风格" />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="text-xs">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">创意描述</label>
              <Textarea
                value={brainstormIdea}
                onChange={(e) => setBrainstormIdea(e.target.value)}
                placeholder="描述你的短剧创意、核心冲突、想要表达的主题..."
                className="min-h-[100px] text-sm resize-none bg-background/50 border-border/50"
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        )
      case 'fullscript':
        return (
          <div className="space-y-3">
            {characters.length > 0 && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">已有角色</label>
                <div className="flex flex-wrap gap-1.5">
                  {characters.map((c) => (
                    <Badge key={c.id} variant="secondary" className="text-xs">
                      {c.name} <span className="text-muted-foreground ml-1">({c.role})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                剧本大纲或创意描述
                {scriptContent && (
                  <span className="text-violet-400 ml-1">（编辑器已有内容可补充）</span>
                )}
              </label>
              <Textarea
                value={scriptPrompt}
                onChange={(e) => setScriptPrompt(e.target.value)}
                placeholder="输入故事大纲、前序内容或创意描述..."
                className="min-h-[120px] text-sm resize-none bg-background/50 border-border/50"
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        )
      case 'scenes':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                待拆分剧本
                {scriptContent && (
                  <span className="text-violet-400 ml-1">（已使用编辑器内容）</span>
                )}
              </label>
              <Textarea
                value={scriptPrompt}
                onChange={(e) => setScriptPrompt(e.target.value)}
                placeholder="粘贴或输入要拆分的剧本内容..."
                className="min-h-[120px] text-sm resize-none bg-background/50 border-border/50"
                onKeyDown={handleKeyDown}
              />
            </div>
            {scriptContent && !scriptPrompt && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs text-violet-400 border-violet-500/30 hover:bg-violet-500/10"
                onClick={() => setScriptPrompt(scriptContent)}
              >
                <FileInput className="size-3.5 mr-1" />
                从编辑器导入
              </Button>
            )}
          </div>
        )
      case 'refine':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                待优化的剧本
              </label>
              <Textarea
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                placeholder="粘贴需要优化的剧本内容..."
                className="min-h-[100px] text-sm resize-none bg-background/50 border-border/50"
                onKeyDown={handleKeyDown}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">优化建议（可选）</label>
              <Textarea
                placeholder="例如：增强戏剧冲突、优化对白、加快节奏..."
                className="min-h-[60px] text-sm resize-none bg-background/50 border-border/50"
                id="refine-suggestion"
              />
            </div>
          </div>
        )
      case 'chat':
        return (
          <div>
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="自由提问，探讨剧本创意..."
              className="min-h-[80px] text-sm resize-none bg-background/50 border-border/50"
              onKeyDown={handleKeyDown}
            />
          </div>
        )
      default:
        return null
    }
  }

  // Check if can generate
  const canGenerate =
    !isGenerating &&
    ((activeMode === 'brainstorm' && brainstormIdea.trim()) ||
      (activeMode === 'fullscript' && scriptPrompt.trim()) ||
      (activeMode === 'scenes' && (scriptPrompt.trim() || scriptContent.trim())) ||
      (activeMode === 'refine' && refineText.trim()) ||
      (activeMode === 'chat' && chatInput.trim()))

  // Parse AI response based on mode
  const renderAIResponse = (content: string, mode?: string) => {
    if (mode === 'brainstorm') {
      const parsed = tryParseJSON<BrainstormResult>(content)
      if (parsed) return <BrainstormCard data={parsed} />
    }
    if (mode === 'scenes') {
      const parsed = tryParseJSON<SceneItem[]>(content)
      if (parsed && Array.isArray(parsed)) return <SceneCard scenes={parsed} />
    }
    // Fallback: render as formatted text
    return <div className="space-y-1">{formatMarkdown(content)}</div>
  }

  // ── No project guard ────────────────────────────────────────────────────
  if (!currentProject) {
    return <NoProjectMessage />
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-full w-full flex flex-col bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-500/10 p-1.5">
              <Sparkles className="size-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">剧本工作室</h2>
              <p className="text-xs text-muted-foreground">
                {currentProject.name} · {currentProject.genre || '未分类'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {scriptMessages.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={clearScriptMessages}
                  >
                    <Trash2 className="size-3.5 mr-1" />
                    清空对话
                  </Button>
                </TooltipTrigger>
                <TooltipContent>清空所有对话记录</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Main content: Resizable split panels */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* ── Left Panel: Chat / Input ─────────────────────────────────── */}
          <ResizablePanel defaultSize={40} minSize={30} maxSize={50}>
            <div className="flex flex-col h-full border-r border-border/50">
              {/* Mode Tabs */}
              <div className="shrink-0 border-b border-border/50 bg-muted/20 px-2 pt-2">
                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
                  {MODES.map((mode) => {
                    const Icon = mode.icon
                    const isActive = activeMode === mode.key
                    return (
                      <button
                        key={mode.key}
                        onClick={() => setActiveMode(mode.key)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all shrink-0',
                          isActive
                            ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                        )}
                      >
                        <Icon className="size-3.5" />
                        {mode.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Mode description */}
              <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border/30 shrink-0">
                {currentModeConfig.description}
                <span className="text-muted-foreground/50 ml-2">⌘+Enter 发送</span>
              </div>

              {/* Input Area */}
              <div className="px-3 py-3 border-b border-border/30 shrink-0">
                {renderModeInput()}
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className={cn(
                    'w-full mt-3 h-9 text-sm font-medium transition-all',
                    canGenerate
                      ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span className="ml-2">{generatingStep || '生成中...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      <span className="ml-1.5">
                        {activeMode === 'brainstorm' && '开始构思'}
                        {activeMode === 'fullscript' && '生成剧本'}
                        {activeMode === 'scenes' && '拆分场景'}
                        {activeMode === 'refine' && '开始优化'}
                        {activeMode === 'chat' && '发送'}
                      </span>
                    </>
                  )}
                </Button>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full" ref={scrollRef}>
                  <div className="px-3 py-3 space-y-4" ref={scrollRef}>
                    {scriptMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
                        <MessageCircle className="size-8 mb-3" />
                        <p className="text-sm">选择模式开始创作</p>
                        <p className="text-xs mt-1">AI 将帮助你构思和编写剧本</p>
                      </div>
                    )}

                    {scriptMessages.map((msg, idx) => {
                      const isUser = msg.role === 'user'
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          className={cn(
                            'flex gap-2',
                            isUser ? 'flex-row-reverse' : 'flex-row'
                          )}
                        >
                          {/* Avatar */}
                          <div
                            className={cn(
                              'shrink-0 rounded-full w-7 h-7 flex items-center justify-center text-xs font-medium mt-0.5',
                              isUser
                                ? 'bg-primary/20 text-primary'
                                : 'bg-violet-500/20 text-violet-400'
                            )}
                          >
                            {isUser ? (
                              <Users className="size-3.5" />
                            ) : (
                              <Sparkles className="size-3.5" />
                            )}
                          </div>

                          {/* Message bubble */}
                          <div
                            className={cn(
                              'rounded-xl px-3 py-2.5 max-w-[85%]',
                              isUser
                                ? 'bg-primary/10 border border-primary/20'
                                : 'bg-muted/40 border border-border/40'
                            )}
                          >
                            {isUser ? (
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            ) : (
                              <AnimatePresence mode="wait">
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {renderAIResponse(msg.content, (msg as { mode?: string }).mode)}
                                </motion.div>
                              </AnimatePresence>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* Typing indicator */}
                    {isGenerating && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                      >
                        <div className="shrink-0 rounded-full w-7 h-7 flex items-center justify-center bg-violet-500/20 mt-0.5">
                          <Sparkles className="size-3.5 text-violet-400" />
                        </div>
                        <div className="rounded-xl bg-muted/40 border border-border/40 px-2 py-1">
                          <TypingIndicator />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </ResizablePanel>

          {/* Resizer */}
          <ResizableHandle withHandle />

          {/* ── Right Panel: Script Editor ───────────────────────────────── */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="flex flex-col h-full">
              {/* Editor header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">剧本编辑器</h3>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={handleCopy}
                        disabled={!scriptContent}
                      >
                        {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>复制内容</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={handleSave}
                        disabled={!scriptContent}
                      >
                        {saved ? <Check className="size-4 text-green-500" /> : <Save className="size-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>保存剧本</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={handleClear}
                        disabled={!scriptContent}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>清空内容</TooltipContent>
                  </Tooltip>
                  <Separator orientation="vertical" className="h-5 mx-1" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-violet-400 border-violet-500/30 hover:bg-violet-500/10 h-8"
                        onClick={handleImportScenes}
                        disabled={!scriptContent}
                      >
                        导入到场景
                        <ArrowRight className="size-3.5 ml-1" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>将剧本内容导入到分镜场景</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Editor area */}
              <div className="flex-1 overflow-hidden relative">
                <Textarea
                  ref={editorRef}
                  value={scriptContent}
                  onChange={(e) => setScriptContent(e.target.value)}
                  placeholder="在这里编辑你的剧本...&#10;&#10;AI 生成的剧本将自动填充到这里，你也可以直接编辑。&#10;&#10;支持格式：&#10;  第一幕  场景标题&#10;  （场景描述）&#10;  角色名：台词内容"
                  className="w-full h-full text-sm leading-relaxed resize-none rounded-none border-0 bg-[#1a1a2e] text-gray-200 placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 p-5 font-mono"
                />
                {!scriptContent && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                    <FileText className="size-16 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Editor footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 bg-muted/20 shrink-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="size-3" />
                    {wordCount.toLocaleString()} 字
                  </span>
                  <span className="flex items-center gap-1">
                    <Film className="size-3" />
                    {sceneCount} 个场景
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {saved && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-green-500 flex items-center gap-1"
                    >
                      <Check className="size-3" />
                      已保存
                    </motion.span>
                  )}
                  {copied && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-green-500 flex items-center gap-1"
                    >
                      <Check className="size-3" />
                      已复制
                    </motion.span>
                  )}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  )
}
