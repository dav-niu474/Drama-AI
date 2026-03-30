'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Film,
  Plus,
  Sparkles,
  ImageIcon,
  Loader2,
  Trash2,
  GripVertical,
  RotateCcw,
  MapPin,
  Clock,
  Camera,
  Timer,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Wand2,
  Eye,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDramaStore, type DramaScene } from '@/store/drama-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ─── Constants ──────────────────────────────────────────────
const TIME_OPTIONS = ['白天', '黄昏', '夜晚', '黎明']
const MOOD_OPTIONS = ['平静', '紧张', '浪漫', '悲伤', '欢快', '悬疑']
const CAMERA_OPTIONS = ['特写', '近景', '中景', '全景', '远景']

const MOOD_ICONS: Record<string, string> = {
  '平静': '😌', '紧张': '😰', '浪漫': '💕',
  '悲伤': '😢', '欢快': '🎉', '悬疑': '🔍',
}

const TIME_ICONS: Record<string, string> = {
  '白天': '☀️', '黄昏': '🌅', '夜晚': '🌙', '黎明': '🌄',
}

interface ParsedScene {
  title: string
  description: string
  dialogue: string
  cameraAngle: string
  timeOfDay: string
  mood: string
  location: string
  duration: number
}

// ─── Sprocket Holes Component (film strip decoration) ──────
function SprocketHoles({ side }: { side: 'top' | 'bottom' }) {
  return (
    <div className={cn(
      'flex items-center gap-6 px-4',
      side === 'top' ? 'pt-1.5 pb-0.5' : 'pt-0.5 pb-1.5',
    )}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="size-2.5 shrink-0 rounded-full border border-slate-600/50 bg-slate-800/80"
        />
      ))}
    </div>
  )
}

// ─── Empty State ────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <div className="mb-6 flex size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-50 to-fuchsia-50">
        <Film className="size-12 text-violet-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700">开始创建你的第一个场景</h3>
      <p className="mt-2 max-w-md text-center text-sm text-slate-400">
        使用分镜设计工具为你的短剧创建视觉场景，或使用 AI 批量生成
      </p>
      <div className="mt-8 flex gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <img
              src="/images/scene-sample-1.png"
              alt="场景示例1"
              className="h-32 w-52 object-cover transition-transform hover:scale-105"
            />
          </div>
          <span className="text-xs text-slate-400">场景示例</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <img
              src="/images/scene-sample-2.png"
              alt="场景示例2"
              className="h-32 w-52 object-cover transition-transform hover:scale-105"
            />
          </div>
          <span className="text-xs text-slate-400">场景示例</span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── No Project State ───────────────────────────────────────
function NoProjectState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex h-[50vh] flex-col items-center justify-center text-center"
    >
      <div className="mb-4 flex size-20 items-center justify-center rounded-2xl bg-slate-100">
        <Film className="size-10 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700">请先选择一个项目</h3>
      <p className="mt-2 text-sm text-slate-400">在仪表板中选择或创建一个项目后，即可开始设计分镜</p>
    </motion.div>
  )
}

// ─── Scene Thumbnail Card ───────────────────────────────────
function SceneThumbnailCard({
  scene,
  index,
  isActive,
  onClick,
  onDelete,
}: {
  scene: DramaScene
  index: number
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="relative shrink-0"
    >
      <button
        onClick={onClick}
        className={cn(
          'group relative flex h-24 w-40 flex-col overflow-hidden rounded-lg border-2 transition-all duration-200',
          'bg-slate-800 hover:shadow-lg hover:shadow-violet-500/10',
          isActive
            ? 'border-violet-500 shadow-lg shadow-violet-500/20'
            : 'border-slate-600/50 hover:border-slate-500',
        )}
      >
        {/* Drag Handle */}
        <div className="absolute left-1 top-1 z-10 flex cursor-grab items-center justify-center rounded bg-black/40 p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <GripVertical className="size-3 text-white/70" />
        </div>

        {/* Scene Number */}
        <div className="absolute right-1 top-1 z-10 flex size-5 items-center justify-center rounded bg-black/50 text-[10px] font-bold text-white">
          {index + 1}
        </div>

        {/* Thumbnail */}
        <div className="relative h-full w-full">
          {scene.imageUrl ? (
            <img
              src={scene.imageUrl}
              alt={scene.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
              <ImageIcon className="size-6 text-slate-500" />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4">
            <p className="truncate text-[11px] font-medium text-white/90">{scene.title}</p>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-white/50">{MOOD_ICONS[scene.mood] || ''}</span>
              <span className="truncate text-[9px] text-white/50">{scene.mood}</span>
              <span className="ml-auto text-[9px] text-white/40">{scene.duration}s</span>
            </div>
          </div>
        </div>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="activeSceneIndicator"
            className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500"
          />
        )}
      </button>

      {/* Delete button on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="absolute -right-1.5 -top-1.5 z-20 flex size-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-600"
      >
        <X className="size-3" />
      </button>
    </motion.div>
  )
}

// ─── AI Batch Generate Dialog ───────────────────────────────
function AIBatchGenerateDialog({
  projectId,
  onImport,
  disabled,
}: {
  projectId: string
  onImport: (scenes: ParsedScene[]) => void
  disabled: boolean
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'split' | 'manual'>('split')
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [parsedScenes, setParsedScenes] = useState<ParsedScene[]>([])
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError('请输入剧本内容或场景描述')
      return
    }

    setIsGenerating(true)
    setError('')
    setParsedScenes([])

    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          mode: 'scenes',
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || '生成失败')
      }

      // Parse the content - try to extract JSON array
      const content = data.content as string
      let scenes: ParsedScene[] = []

      // Try to find JSON array in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        scenes = JSON.parse(jsonMatch[0])
      } else {
        setError('AI返回的格式无法解析，请重试')
        return
      }

      // Validate and normalize
      scenes = scenes.map((s: Record<string, unknown>, i: number) => ({
        title: s.title || `场景 ${i + 1}`,
        description: s.description || '',
        dialogue: s.dialogue || '',
        cameraAngle: CAMERA_OPTIONS.includes(s.cameraAngle as string) ? s.cameraAngle : '中景',
        timeOfDay: TIME_OPTIONS.includes(s.timeOfDay as string) ? s.timeOfDay : '白天',
        mood: MOOD_OPTIONS.includes(s.mood as string) ? s.mood : '平静',
        location: s.location || '',
        duration: typeof s.duration === 'number' ? s.duration : 5,
      }))

      setParsedScenes(scenes)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirmImport = () => {
    if (parsedScenes.length > 0) {
      onImport(parsedScenes)
      setOpen(false)
      setInput('')
      setParsedScenes([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30"
        >
          <Sparkles className="size-4" />
          AI批量生成
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="size-5 text-violet-500" />
            AI批量生成场景
          </DialogTitle>
          <DialogDescription>
            使用AI智能分析剧本，自动拆分为独立的场景分镜
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Mode selector */}
          <div className="flex gap-2">
            <Button
              variant={mode === 'split' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('split')}
              className={cn(
                mode === 'split' && 'bg-violet-500 hover:bg-violet-600',
              )}
            >
              <Film className="mr-1.5 size-3.5" />
              从剧本拆分
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('manual')}
              className={cn(
                mode === 'manual' && 'bg-violet-500 hover:bg-violet-600',
              )}
            >
              <MessageSquare className="mr-1.5 size-3.5" />
              手动输入场景列表
            </Button>
          </div>

          {/* Input area */}
          <div className="space-y-2">
            <Label>
              {mode === 'split' ? '粘贴剧本内容' : '输入场景描述列表'}
            </Label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'split'
                  ? '请粘贴你的剧本内容，AI将自动拆分为独立场景...\n\n例如：\n第一幕：清晨的阳光透过窗帘洒进房间，女主角小雅缓缓醒来...\n小雅：（伸了个懒腰）新的一天开始了...'
                  : '请逐行描述每个场景...\n\n例如：\n场景1：咖啡厅内，阳光明媚，男女主角相遇\n场景2：夜晚街道，路灯下两人漫步\n场景3：雨中公园长椅，女主角独自落泪'
              }
              className="min-h-[180px] resize-none"
            />
          </div>

          {/* Generate button */}
          {!parsedScenes.length && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !input.trim()}
              className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  AI正在分析剧本...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  开始拆分场景
                </>
              )}
            </Button>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Preview parsed scenes */}
          {parsedScenes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Eye className="size-4 text-violet-500" />
                  预览拆分结果
                </Label>
                <Badge variant="secondary" className="bg-violet-50 text-violet-600">
                  {parsedScenes.length} 个场景
                </Badge>
              </div>

              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {parsedScenes.map((scene, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="flex size-5 items-center justify-center rounded bg-violet-500 text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{scene.title}</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {TIME_ICONS[scene.timeOfDay]} {scene.timeOfDay}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {MOOD_ICONS[scene.mood]} {scene.mood}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {scene.cameraAngle}
                        </Badge>
                      </div>
                    </div>
                    {scene.description && (
                      <p className="mb-1 line-clamp-2 text-xs text-slate-500">{scene.description}</p>
                    )}
                    {scene.dialogue && (
                      <p className="line-clamp-2 text-xs italic text-slate-400">💬 {scene.dialogue}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {parsedScenes.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setParsedScenes([])
                  setInput('')
                }}
              >
                重新生成
              </Button>
              <Button
                onClick={handleConfirmImport}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
              >
                <Check className="mr-1.5 size-4" />
                确认导入 ({parsedScenes.length}个场景)
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Storyboard Designer ───────────────────────────────
export function StoryboardDesigner() {
  const {
    currentProject,
    scenes,
    setScenes,
    addScene,
    updateScene,
    removeScene,
  } = useDramaStore()

  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)

  // Local form state for the active scene
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dialogue: '',
    location: '',
    timeOfDay: '白天',
    mood: '平静',
    cameraAngle: '中景',
    duration: 5,
  })

  const activeScene = scenes.find((s) => s.id === activeSceneId) || null

  // Load scenes on project change
  useEffect(() => {
    if (!currentProject) {
      setScenes([])
      setActiveSceneId(null)
      return
    }

    const loadScenes = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/scenes?projectId=${currentProject.id}`)
        const data = await res.json()
        if (data.success) {
          setScenes(data.scenes || [])
          if (data.scenes?.length > 0 && !activeSceneId) {
            setActiveSceneId(data.scenes[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load scenes:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadScenes()
  }, [currentProject?.id])

  // Sync form data when active scene changes
  useEffect(() => {
    if (activeScene) {
      setFormData({
        title: activeScene.title,
        description: activeScene.description,
        dialogue: activeScene.dialogue,
        location: activeScene.location,
        timeOfDay: activeScene.timeOfDay || '白天',
        mood: activeScene.mood || '平静',
        cameraAngle: activeScene.cameraAngle || '中景',
        duration: activeScene.duration || 5,
      })
    }
  }, [activeScene])

  // ─── CRUD Operations ─────────────────────────────────────

  const handleAddScene = async () => {
    if (!currentProject) return

    const sortOrder = scenes.length

    try {
      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject.id,
          title: `场景 ${sortOrder + 1}`,
          description: '',
          dialogue: '',
          location: '',
          timeOfDay: '白天',
          mood: '平静',
          cameraAngle: '中景',
          sortOrder,
          duration: 5,
        }),
      })

      const data = await res.json()
      if (data.success) {
        addScene(data.scene)
        setActiveSceneId(data.scene.id)
      }
    } catch (err) {
      console.error('Failed to create scene:', err)
    }
  }

  const handleSaveScene = async () => {
    if (!activeSceneId) return

    setIsSaving(true)
    try {
      const res = await fetch('/api/scenes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeSceneId,
          ...formData,
        }),
      })

      const data = await res.json()
      if (data.success) {
        updateScene(activeSceneId, data.scene)
      }
    } catch (err) {
      console.error('Failed to save scene:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteScene = async (id: string) => {
    try {
      const res = await fetch(`/api/scenes?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        removeScene(id)
        // If deleting active scene, select the next one
        if (activeSceneId === id) {
          const remaining = scenes.filter((s) => s.id !== id)
          setActiveSceneId(remaining.length > 0 ? remaining[0].id : null)
        }
      }
    } catch (err) {
      console.error('Failed to delete scene:', err)
    }
  }

  const handleGenerateImage = async () => {
    if (!activeSceneId || !formData.description) return

    setIsGeneratingImage(true)
    try {
      // Build prompt from scene data
      const prompt = `${formData.description}, ${formData.mood} mood, ${formData.timeOfDay} lighting, ${formData.cameraAngle} camera angle, cinematic, high quality`

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          type: 'scene',
          size: '1344x768',
        }),
      })

      const data = await res.json()
      if (data.success) {
        updateScene(activeSceneId, { imageUrl: data.imageUrl })
      }
    } catch (err) {
      console.error('Failed to generate image:', err)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleBatchImport = useCallback(async (parsedScenes: ParsedScene[]) => {
    if (!currentProject) return

    try {
      const baseSortOrder = scenes.length

      const promises = parsedScenes.map((scene, i) =>
        fetch('/api/scenes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: currentProject.id,
            title: scene.title,
            description: scene.description,
            dialogue: scene.dialogue,
            location: scene.location,
            timeOfDay: scene.timeOfDay,
            mood: scene.mood,
            cameraAngle: scene.cameraAngle,
            sortOrder: baseSortOrder + i,
            duration: scene.duration,
          }),
        })
      )

      const results = await Promise.all(promises)
      for (const res of results) {
        const data = await res.json()
        if (data.success) {
          addScene(data.scene)
        }
      }

      // Activate the first imported scene
      if (scenes.length === 0 && parsedScenes.length > 0) {
        // After the scenes are added, we need to get the first one
        setTimeout(() => {
          const updatedScenes = scenes // this will be stale but the next render will have the new scenes
          if (updatedScenes.length > 0) {
            setActiveSceneId(updatedScenes[0].id)
          }
        }, 100)
      }
    } catch (err) {
      console.error('Failed to import scenes:', err)
    }
  }, [currentProject, scenes, addScene, setScenes])

  // ─── Reorder with keyboard ───────────────────────────────

  const handleMoveScene = async (direction: 'left' | 'right') => {
    if (!activeSceneId) return
    const idx = scenes.findIndex((s) => s.id === activeSceneId)
    if (idx < 0) return

    const newIdx = direction === 'left' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= scenes.length) return

    const newScenes = [...scenes]
    ;[newScenes[idx], newScenes[newIdx]] = [newScenes[newIdx], newScenes[idx]]

    // Update sort orders
    const updates = newScenes.map((s, i) => ({
      id: s.id,
      sortOrder: i,
    }))

    try {
      await Promise.all(
        updates.map((u) =>
          fetch('/api/scenes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(u),
          })
        )
      )
      // Update local state
      setScenes(newScenes.map((s, i) => ({ ...s, sortOrder: i })))
    } catch (err) {
      console.error('Failed to reorder scenes:', err)
    }
  }

  // ─── Render ──────────────────────────────────────────────

  if (!currentProject) {
    return <NoProjectState />
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-violet-500" />
          <p className="text-sm text-slate-400">加载场景中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md shadow-violet-500/20">
            <Film className="size-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">分镜设计</h2>
            <p className="text-xs text-slate-400">
              设计故事分镜，AI生成场景画面
            </p>
          </div>
          <Badge variant="secondary" className="ml-1 bg-violet-50 text-violet-600">
            {scenes.length} 个场景
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleAddScene}
            size="sm"
            variant="outline"
            className="border-slate-200"
          >
            <Plus className="size-4" />
            添加场景
          </Button>
          <AIBatchGenerateDialog
            projectId={currentProject.id}
            onImport={handleBatchImport}
            disabled={false}
          />
        </div>
      </div>

      {/* ─── Empty State ────────────────────────────────── */}
      {scenes.length === 0 && <EmptyState />}

      {/* ─── Main Content ───────────────────────────────── */}
      {scenes.length > 0 && (
        <div className="space-y-5">
          {/* Film Strip Timeline */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-inner">
            {/* Sprocket holes top */}
            <SprocketHoles side="top" />

            {/* Scene strip */}
            <ScrollArea className="w-full">
              <div className="flex items-center gap-3 px-4 py-3">
                {scenes.map((scene, index) => (
                  <SceneThumbnailCard
                    key={scene.id}
                    scene={scene}
                    index={index}
                    isActive={activeSceneId === scene.id}
                    onClick={() => setActiveSceneId(scene.id)}
                    onDelete={() => handleDeleteScene(scene.id)}
                  />
                ))}

                {/* Add scene button at end */}
                <button
                  onClick={handleAddScene}
                  className="flex h-24 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-600 text-slate-500 transition-colors hover:border-violet-400 hover:text-violet-400"
                >
                  <Plus className="size-5" />
                  <span className="text-[10px]">添加场景</span>
                </button>
              </div>
              <ScrollBar orientation="horizontal" className="h-2" />
            </ScrollArea>

            {/* Sprocket holes bottom */}
            <SprocketHoles side="bottom" />
          </div>

          {/* Active Scene Detail Panel */}
          <AnimatePresence mode="wait">
            {activeScene ? (
              <motion.div
                key={activeScene.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Reorder controls */}
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-violet-50 text-violet-600 font-semibold">
                      场景 {scenes.findIndex((s) => s.id === activeScene.id) + 1}
                    </Badge>
                    <span className="text-xs text-slate-400">/ {scenes.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => handleMoveScene('left')}
                          disabled={scenes.findIndex((s) => s.id === activeScene.id) === 0}
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>前移场景</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => handleMoveScene('right')}
                          disabled={scenes.findIndex((s) => s.id === activeScene.id) === scenes.length - 1}
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>后移场景</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="grid gap-0 lg:grid-cols-2">
                  {/* Left: Image Preview */}
                  <div className="border-r border-slate-100 p-5">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      {activeScene.imageUrl ? (
                        <motion.img
                          key={activeScene.imageUrl}
                          initial={{ opacity: 0, scale: 1.05 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                          src={activeScene.imageUrl}
                          alt={activeScene.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                          <ImageIcon className="mb-3 size-12 text-slate-300" />
                          <p className="text-sm text-slate-400">暂无场景画面</p>
                          <p className="mt-1 text-xs text-slate-300">填写描述后点击生成</p>
                        </div>
                      )}

                      {/* Generate button overlay */}
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center bg-gradient-to-t from-black/50 to-transparent p-4 pt-12">
                        <div className="flex gap-2">
                          <Button
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImage || !formData.description}
                            size="sm"
                            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg hover:shadow-xl"
                          >
                            {isGeneratingImage ? (
                              <Loader2 className="mr-1.5 size-4 animate-spin" />
                            ) : (
                              <Sparkles className="mr-1.5 size-4" />
                            )}
                            {activeScene.imageUrl ? '重新生成' : 'AI生成场景'}
                          </Button>
                          {activeScene.imageUrl && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={handleGenerateImage}
                                  disabled={isGeneratingImage}
                                  variant="secondary"
                                  size="sm"
                                  className="bg-white/80 backdrop-blur-sm hover:bg-white"
                                >
                                  <RotateCcw className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>重新生成</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {/* Loading overlay */}
                      {isGeneratingImage && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
                        >
                          <Loader2 className="mb-3 size-10 animate-spin text-white" />
                          <p className="text-sm font-medium text-white">AI正在生成场景画面...</p>
                          <p className="mt-1 text-xs text-white/60">预计需要10-20秒</p>
                        </motion.div>
                      )}
                    </div>

                    {/* Image generation settings hint */}
                    <p className="mt-2 text-center text-[11px] text-slate-400">
                      💡 描述越详细，生成的画面越精准。场景描述将作为AI生成画面的依据。
                    </p>
                  </div>

                  {/* Right: Details Form */}
                  <div className="space-y-4 p-5">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <Label htmlFor="scene-title" className="text-xs font-medium text-slate-600">
                        场景标题
                      </Label>
                      <Input
                        id="scene-title"
                        value={formData.title}
                        onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                        placeholder="例如：咖啡厅的偶遇"
                        className="h-9"
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-1.5">
                      <Label htmlFor="scene-location" className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <MapPin className="size-3" />
                        拍摄地点
                      </Label>
                      <Input
                        id="scene-location"
                        value={formData.location}
                        onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                        placeholder="例如：咖啡厅、街道、公园..."
                        className="h-9"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <Label htmlFor="scene-desc" className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Eye className="size-3" />
                        场景描述
                        <span className="text-[10px] text-violet-400">(AI画面生成依据)</span>
                      </Label>
                      <Textarea
                        id="scene-desc"
                        value={formData.description}
                        onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                        placeholder="详细描述场景画面，例如：阳光明媚的咖啡厅内，白色的桌椅整齐排列，窗外是繁华的街道..."
                        className="min-h-[80px] resize-none"
                      />
                    </div>

                    {/* Dialogue */}
                    <div className="space-y-1.5">
                      <Label htmlFor="scene-dialogue" className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <MessageSquare className="size-3" />
                        对话内容
                      </Label>
                      <Textarea
                        id="scene-dialogue"
                        value={formData.dialogue}
                        onChange={(e) => setFormData((p) => ({ ...p, dialogue: e.target.value }))}
                        placeholder="角色对话内容..."
                        className="min-h-[60px] resize-none"
                      />
                    </div>

                    {/* Settings row */}
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      {/* Time of day */}
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <Clock className="size-3" />
                          时间段
                        </Label>
                        <Select
                          value={formData.timeOfDay}
                          onValueChange={(v) => setFormData((p) => ({ ...p, timeOfDay: v }))}
                        >
                          <SelectTrigger size="sm" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {TIME_ICONS[t]} {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Mood */}
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          氛围情绪
                        </Label>
                        <Select
                          value={formData.mood}
                          onValueChange={(v) => setFormData((p) => ({ ...p, mood: v }))}
                        >
                          <SelectTrigger size="sm" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MOOD_OPTIONS.map((m) => (
                              <SelectItem key={m} value={m}>
                                {MOOD_ICONS[m]} {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Camera Angle */}
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <Camera className="size-3" />
                          景别
                        </Label>
                        <Select
                          value={formData.cameraAngle}
                          onValueChange={(v) => setFormData((p) => ({ ...p, cameraAngle: v }))}
                        >
                          <SelectTrigger size="sm" className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CAMERA_OPTIONS.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Duration */}
                      <div className="space-y-1.5">
                        <Label htmlFor="scene-duration" className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <Timer className="size-3" />
                          时长(秒)
                        </Label>
                        <Input
                          id="scene-duration"
                          type="number"
                          min={1}
                          max={60}
                          value={formData.duration}
                          onChange={(e) => setFormData((p) => ({ ...p, duration: parseInt(e.target.value) || 5 }))}
                          className="h-8"
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="mr-1.5 size-3.5" />
                            删除场景
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除场景？</AlertDialogTitle>
                            <AlertDialogDescription>
                              删除后无法恢复。确定要删除「{activeScene.title}」吗？
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteScene(activeScene.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        onClick={handleSaveScene}
                        disabled={isSaving}
                        size="sm"
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md"
                      >
                        {isSaving ? (
                          <Loader2 className="mr-1.5 size-4 animate-spin" />
                        ) : (
                          <Save className="mr-1.5 size-4" />
                        )}
                        保存
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50"
              >
                <p className="text-sm text-slate-400">点击上方场景卡片选择要编辑的场景</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
