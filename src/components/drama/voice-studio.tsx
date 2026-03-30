'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  Play,
  Square,
  Volume2,
  VolumeX,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Filter,
  Sparkles,
  ListMusic,
  User,
  Gauge,
  Headphones,
  Waves,
  FileAudio,
  Zap,
  RefreshCw,
  X,
  ChevronRight,
} from 'lucide-react'
import { useDramaStore, type DramaScene, type Character } from '@/store/drama-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ── Constants ──────────────────────────────────────────────

const VOICE_OPTIONS = [
  { value: 'tongtong', label: 'tongtong', desc: '温暖亲切', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'chuichui', label: 'chuichui', desc: '活泼可爱', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'xiaochen', label: 'xiaochen', desc: '沉稳专业', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'jam', label: 'jam', desc: '英音绅士', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'kazi', label: 'kazi', desc: '清晰标准', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { value: 'douji', label: 'douji', desc: '自然流畅', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'luodo', label: 'luodo', desc: '富有感染力', color: 'bg-violet-100 text-violet-700 border-violet-200' },
] as const

type VoiceType = (typeof VOICE_OPTIONS)[number]['value']

interface SceneCharacterMap {
  [sceneId: string]: string // characterId
}

type BatchStatus = 'pending' | 'generating' | 'done' | 'failed'

interface BatchSceneStatus {
  [sceneId: string]: BatchStatus
}

// ── Helper functions ───────────────────────────────────────

function getVoiceInfo(voiceType: string) {
  return VOICE_OPTIONS.find((v) => v.value === voiceType) ?? VOICE_OPTIONS[0]
}

function truncateText(text: string, maxLen: number) {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

// ── Soundwave Animation Component ─────────────────────────

function SoundwaveAnimation({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px]">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            'w-[3px] rounded-full',
            active ? 'bg-teal-500' : 'bg-teal-300/40',
          )}
          animate={
            active
              ? {
                  height: [8, 20, 12, 24, 8],
                }
              : {
                  height: 8,
                }
          }
          transition={
            active
              ? {
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  delay: i * 0.12,
                  ease: 'easeInOut',
                }
              : {
                  duration: 0.3,
                }
          }
        />
      ))}
    </div>
  )
}

// ── Audio Waveform Visualizer (placeholder) ───────────────

function WaveformVisualizer({ isPlaying, audioUrl }: { isPlaying: boolean; audioUrl: string }) {
  return (
    <div className="relative mt-3 flex h-16 items-center justify-center overflow-hidden rounded-lg border border-teal-100 bg-gradient-to-r from-teal-50/50 via-emerald-50/50 to-teal-50/50">
      {audioUrl ? (
        <div className="flex items-center gap-[2px] px-4">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                'w-[2px] rounded-full',
                isPlaying
                  ? 'bg-gradient-to-t from-teal-400 to-emerald-500'
                  : 'bg-teal-200/60',
              )}
              animate={
                isPlaying
                  ? {
                      height: [4, Math.random() * 28 + 6, 4],
                    }
                  : {
                      height: [Math.random() * 16 + 4],
                    }
              }
              transition={
                isPlaying
                  ? {
                      duration: 0.6 + Math.random() * 0.4,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      delay: i * 0.03,
                      ease: 'easeInOut',
                    }
                  : {
                      duration: 0.3,
                  }
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <Waves className="h-6 w-6 opacity-30" />
          <span className="text-xs opacity-40">等待音频生成</span>
        </div>
      )}
    </div>
  )
}

// ── Scene Dialogue Card ────────────────────────────────────

interface SceneCardProps {
  scene: DramaScene
  index: number
  character: Character | undefined
  characters: Character[]
  isGenerating: boolean
  isPlaying: boolean
  selectedSceneId: string | null
  onSceneClick: (scene: DramaScene) => void
  onCharacterChange: (sceneId: string, characterId: string) => void
  onGenerate: (scene: DramaScene) => void
  onPlayToggle: (scene: DramaScene) => void
}

function SceneCard({
  scene,
  index,
  character,
  isGenerating,
  isPlaying,
  selectedSceneId,
  onSceneClick,
  onCharacterChange,
  onGenerate,
  onPlayToggle,
}: SceneCardProps) {
  const isSelected = selectedSceneId === scene.id
  const hasAudio = !!scene.audioUrl
  const voiceInfo = character ? getVoiceInfo(character.voiceType) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      onClick={() => onSceneClick(scene)}
      className={cn(
        'group relative cursor-pointer rounded-xl border p-4 transition-all duration-200',
        isSelected
          ? 'border-teal-300 bg-teal-50/60 shadow-sm ring-1 ring-teal-200'
          : 'border-transparent bg-card hover:border-teal-100 hover:shadow-sm',
      )}
    >
      {/* Scene number and status */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-600">
            {index + 1}
          </span>
          <h3 className="text-sm font-semibold text-foreground truncate max-w-[160px]">
            {scene.title || `场景 ${index + 1}`}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {hasAudio && (
            <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-600 text-[10px] px-1.5 py-0">
              <CheckCircle2 className="h-3 w-3" />
              已配音
            </Badge>
          )}
          {voiceInfo && (
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 gap-1', voiceInfo.color)}>
              <Volume2 className="h-3 w-3" />
              {voiceInfo.desc}
            </Badge>
          )}
        </div>
      </div>

      {/* Dialogue text */}
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
        {scene.dialogue || '暂无对话内容'}
      </p>

      {/* Character selector */}
      <div className="mb-3">
        <Select
          value={character?.id || ''}
          onValueChange={(val) => onCharacterChange(scene.id, val)}
          onClick={(e) => e.stopPropagation()}
        >
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue placeholder="选择配音角色" />
          </SelectTrigger>
          <SelectContent>
            {characters.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <div className="flex items-center gap-1.5">
                  <span>{c.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    · {getVoiceInfo(c.voiceType).desc}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {hasAudio && (
          <Button
            size="sm"
            variant="outline"
            className={cn(
              'h-7 gap-1 text-xs',
              isPlaying && 'border-teal-300 bg-teal-50 text-teal-700',
            )}
            onClick={(e) => {
              e.stopPropagation()
              onPlayToggle(scene)
            }}
          >
            {isPlaying ? (
              <>
                <Square className="h-3 w-3" />
                停止
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                播放
              </>
            )}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className={cn(
            'h-7 flex-1 gap-1 text-xs',
            'border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800',
            isGenerating && 'pointer-events-none opacity-70',
          )}
          onClick={(e) => {
            e.stopPropagation()
            onGenerate(scene)
          }}
          disabled={isGenerating || !scene.dialogue}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Volume2 className="h-3 w-3" />
              {hasAudio ? '重新生成' : '生成配音'}
            </>
          )}
        </Button>
      </div>

      {/* Generating soundwave indicator */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center gap-2"
          >
            <SoundwaveAnimation active />
            <span className="text-[10px] text-teal-600">AI 正在合成语音...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Empty State Components ─────────────────────────────────

function NoProjectState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50">
        <Mic className="h-10 w-10 text-teal-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">请先选择一个项目</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        选择一个项目后，即可开始配音工作
      </p>
    </div>
  )
}

function NoCharactersState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50">
        <User className="h-10 w-10 text-teal-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">请先在角色工坊中添加角色</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        需要先创建角色并设置音色，才能进行配音工作
      </p>
    </div>
  )
}

function NoDialogueState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50">
        <FileAudio className="h-10 w-10 text-teal-400" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">还没有场景对话</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        请在分镜设计中为场景添加对话内容
      </p>
    </div>
  )
}

// ── Batch Generate Dialog ──────────────────────────────────

interface BatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenes: DramaScene[]
  sceneCharacterMap: SceneCharacterMap
  characters: Character[]
  batchStatus: BatchSceneStatus
  progress: number
  isRunning: boolean
  onStart: () => void
}

function BatchGenerateDialog({
  open,
  onOpenChange,
  scenes,
  sceneCharacterMap,
  characters,
  batchStatus,
  progress,
  isRunning,
  onStart,
}: BatchDialogProps) {
  const getCharacter = (sceneId: string) => {
    const charId = sceneCharacterMap[sceneId]
    return characters.find((c) => c.id === charId)
  }

  const getStatusBadge = (status: BatchStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="text-[10px] bg-slate-50 text-slate-500">等待中</Badge>
      case 'generating':
        return <Badge variant="secondary" className="text-[10px] bg-teal-50 text-teal-600 gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          生成中
        </Badge>
      case 'done':
        return <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          完成
        </Badge>
      case 'failed':
        return <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-600 gap-1">
          <AlertCircle className="h-3 w-3" />
          失败
        </Badge>
    }
  }

  const doneCount = Object.values(batchStatus).filter((s) => s === 'done').length
  const failedCount = Object.values(batchStatus).filter((s) => s === 'failed').length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-teal-500" />
            批量生成配音
          </DialogTitle>
          <DialogDescription>
            为所有有对话的场景自动生成配音，将使用各场景分配的角色和对应音色
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {/* Stats */}
          <div className="mb-4 flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              共 <span className="font-semibold text-foreground">{scenes.length}</span> 个场景
            </span>
            {doneCount > 0 && (
              <span className="text-emerald-600">
                <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
                {doneCount} 完成
              </span>
            )}
            {failedCount > 0 && (
              <span className="text-red-500">
                <AlertCircle className="inline h-3.5 w-3.5 mr-1" />
                {failedCount} 失败
              </span>
            )}
          </div>

          {/* Progress bar */}
          {(isRunning || doneCount > 0) && (
            <div className="mb-4">
              <Progress value={progress} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-teal-500 [&>div]:to-emerald-500" />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {progress < 100 ? `正在处理... ${Math.round(progress)}%` : '批量生成完成'}
              </p>
            </div>
          )}

          {/* Scene list */}
          <ScrollArea className="h-[280px] pr-3">
            <div className="flex flex-col gap-2">
              {scenes.map((scene, idx) => {
                const char = getCharacter(scene.id)
                const voiceInfo = char ? getVoiceInfo(char.voiceType) : null
                const status = batchStatus[scene.id] || 'pending'

                return (
                  <div
                    key={scene.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                      status === 'generating' && 'border-teal-200 bg-teal-50/50',
                      status === 'done' && 'border-emerald-100 bg-emerald-50/30',
                      status === 'failed' && 'border-red-100 bg-red-50/30',
                      status === 'pending' && 'border-transparent bg-card',
                    )}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {scene.title || `场景 ${idx + 1}`}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {char ? (
                          <span className="text-[10px] text-muted-foreground">
                            {char.name}
                            {voiceInfo && (
                              <span className="ml-1 text-teal-500">· {voiceInfo.desc}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-500">未分配角色</span>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRunning}
          >
            取消
          </Button>
          <Button
            onClick={onStart}
            disabled={isRunning || scenes.length === 0}
            className="gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                全部生成
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Voice Type Selector ────────────────────────────────────

function VoiceTypeDisplay({ voiceType }: { voiceType: string }) {
  const info = getVoiceInfo(voiceType)
  return (
    <div className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm', info.color)}>
      <Headphones className="h-4 w-4" />
      <span className="font-medium">{info.label}</span>
      <Separator orientation="vertical" className="h-4" />
      <span className="text-xs opacity-80">{info.desc}</span>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────

export default function VoiceStudio() {
  const {
    currentProject,
    characters,
    scenes,
    setScenes,
    updateScene,
  } = useDramaStore()

  // State
  const [sceneCharacterMap, setSceneCharacterMap] = useState<SceneCharacterMap>({})
  const [filterDialogueOnly, setFilterDialogueOnly] = useState(true)
  const [selectedScene, setSelectedScene] = useState<DramaScene | null>(null)
  const [editDialogue, setEditDialogue] = useState('')
  const [selectedCharacterId, setSelectedCharacterId] = useState('')
  const [speed, setSpeed] = useState(1.0)
  const [isGenerating, setIsGenerating] = useState<string | null>(null) // sceneId
  const [isPlaying, setIsPlaying] = useState<string | null>(null) // sceneId
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null)
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)

  // Batch state
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchStatus, setBatchStatus] = useState<BatchSceneStatus>({})
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchRunning, setBatchRunning] = useState(false)

  // Audio refs
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const sceneAudioRef = useRef<HTMLAudioElement | null>(null)

  // ── Data fetching ──

  useEffect(() => {
    if (currentProject) {
      fetchScenes()
    } else {
      setScenes([])
    }
  }, [currentProject?.id])

  const fetchScenes = async () => {
    if (!currentProject) return
    try {
      const res = await fetch(`/api/scenes?projectId=${currentProject.id}`)
      const data = await res.json()
      if (data.success) {
        setScenes(data.scenes)
      }
    } catch {
      // Silent fail
    }
  }

  // ── Computed ──

  const scenesWithDialogue = scenes.filter((s) => s.dialogue && s.dialogue.trim())
  const displayScenes = filterDialogueOnly ? scenesWithDialogue : scenes

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId)
  const voiceType: VoiceType = (selectedCharacter?.voiceType || 'tongtong') as VoiceType

  // ── Handlers ──

  const handleSceneClick = (scene: DramaScene) => {
    setSelectedScene(scene)
    setEditDialogue(scene.dialogue || '')
    setSelectedCharacterId(sceneCharacterMap[scene.id] || '')
  }

  const handleCharacterChange = (sceneId: string, characterId: string) => {
    setSceneCharacterMap((prev) => ({ ...prev, [sceneId]: characterId }))
    if (selectedScene?.id === sceneId) {
      setSelectedCharacterId(characterId)
    }
  }

  const stopAllAudio = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current.currentTime = 0
    }
    if (sceneAudioRef.current) {
      sceneAudioRef.current.pause()
      sceneAudioRef.current.currentTime = 0
    }
    setIsPreviewPlaying(false)
    setIsPlaying(null)
  }

  // ── Generate TTS for a scene ──

  const generateTTS = async (
    text: string,
    voice: VoiceType,
    spd: number
  ): Promise<{ audioUrl: string; duration: number; size: number } | null> => {
    const res = await fetch('/api/generate-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, speed: spd }),
    })
    const data = await res.json()
    if (data.success) {
      return { audioUrl: data.audioUrl, duration: data.duration, size: data.size }
    } else {
      throw new Error(data.error || '生成失败')
    }
  }

  const handleGenerateForScene = async (scene: DramaScene) => {
    if (!scene.dialogue) return
    const charId = sceneCharacterMap[scene.id] || selectedCharacterId
    const char = characters.find((c) => c.id === charId)
    const vType = (char?.voiceType || 'tongtong') as VoiceType

    setIsGenerating(scene.id)
    stopAllAudio()

    try {
      const result = await generateTTS(scene.dialogue, vType, speed)
      if (result) {
        updateScene(scene.id, { audioUrl: result.audioUrl })
        // Also persist to server
        try {
          await fetch('/api/scenes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: scene.id, audioUrl: result.audioUrl }),
          })
        } catch {
          // Best effort
        }
        toast.success(`「${scene.title || '场景'}」配音生成成功`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '生成失败'
      toast.error(msg)
    } finally {
      setIsGenerating(null)
    }
  }

  // ── Play/Stop scene audio ──

  const handlePlayToggle = (scene: DramaScene) => {
    if (!scene.audioUrl) return

    if (isPlaying === scene.id) {
      stopAllAudio()
      return
    }

    stopAllAudio()
    const audio = new Audio(scene.audioUrl)
    sceneAudioRef.current = audio
    audio.onended = () => setIsPlaying(null)
    audio.onerror = () => {
      setIsPlaying(null)
      toast.error('音频播放失败')
    }
    audio.play()
    setIsPlaying(scene.id)
  }

  // ── Preview TTS ──

  const handlePreview = async () => {
    if (!editDialogue.trim()) {
      toast.error('请输入对话文本')
      return
    }
    if (!selectedCharacterId) {
      toast.error('请先选择一个角色')
      return
    }

    setIsPreviewGenerating(true)
    stopAllAudio()

    try {
      const result = await generateTTS(editDialogue, voiceType, speed)
      if (result) {
        setPreviewAudioUrl(result.audioUrl)
        // Auto play
        const audio = new Audio(result.audioUrl)
        previewAudioRef.current = audio
        audio.onended = () => setIsPreviewPlaying(false)
        audio.onerror = () => {
          setIsPreviewPlaying(false)
          toast.error('音频播放失败')
        }
        audio.play()
        setIsPreviewPlaying(true)
        toast.success('试听音频已生成')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '生成失败'
      toast.error(msg)
    } finally {
      setIsPreviewGenerating(false)
    }
  }

  // ── Apply to scene ──

  const handleApplyToScene = async () => {
    if (!selectedScene) {
      toast.error('请先选择一个场景')
      return
    }
    if (!previewAudioUrl) {
      toast.error('请先生成试听音频')
      return
    }

    updateScene(selectedScene.id, {
      audioUrl: previewAudioUrl,
      dialogue: editDialogue,
    })

    // Persist to server
    try {
      await fetch('/api/scenes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedScene.id,
          audioUrl: previewAudioUrl,
          dialogue: editDialogue,
        }),
      })
    } catch {
      // Best effort
    }

    // Update local selectedScene reference
    setSelectedScene({ ...selectedScene, audioUrl: previewAudioUrl, dialogue: editDialogue })
    toast.success('配音已应用到场景')
  }

  // ── Batch generate ──

  const handleBatchGenerate = async () => {
    const targetScenes = scenesWithDialogue.filter((s) => sceneCharacterMap[s.id])
    if (targetScenes.length === 0) {
      toast.error('没有分配角色的场景，请先为场景分配角色')
      return
    }

    setBatchRunning(true)
    setBatchProgress(0)

    // Initialize status
    const initialStatus: BatchSceneStatus = {}
    targetScenes.forEach((s) => {
      initialStatus[s.id] = 'pending'
    })
    setBatchStatus(initialStatus)

    let completed = 0

    for (const scene of targetScenes) {
      setBatchStatus((prev) => ({ ...prev, [scene.id]: 'generating' }))

      const charId = sceneCharacterMap[scene.id]
      const char = characters.find((c) => c.id === charId)
      const vType = (char?.voiceType || 'tongtong') as VoiceType

      try {
        const result = await generateTTS(scene.dialogue, vType, 1.0)
        if (result) {
          updateScene(scene.id, { audioUrl: result.audioUrl })
          try {
            await fetch('/api/scenes', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: scene.id, audioUrl: result.audioUrl }),
            })
          } catch {
            // Best effort
          }
          setBatchStatus((prev) => ({ ...prev, [scene.id]: 'done' }))
        }
      } catch {
        setBatchStatus((prev) => ({ ...prev, [scene.id]: 'failed' }))
      }

      completed++
      setBatchProgress((completed / targetScenes.length) * 100)
    }

    setBatchRunning(false)
    toast.success(`批量生成完成：${completed} 个场景`)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio()
    }
  }, [])

  // ── Render guards ──

  if (!currentProject) {
    return <NoProjectState />
  }

  if (characters.length === 0) {
    return <NoCharactersState />
  }

  if (scenesWithDialogue.length === 0) {
    return <NoDialogueState />
  }

  // ── Main render ──

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b bg-card px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-sm">
              <Mic className="h-5 w-5 text-white" />
            </div>
            配音工作室
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            为场景对话智能生成配音，支持多种音色和语速调节
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50"
            onClick={() => setBatchOpen(true)}
          >
            <Zap className="h-4 w-4" />
            批量生成配音
          </Button>
        </div>
      </div>

      {/* Main Content: Two panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Scene List */}
        <div className="flex w-full flex-col border-r lg:w-[420px]">
          {/* Filter toggle */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ListMusic className="h-4 w-4 text-teal-500" />
              场景对话列表
              <Badge variant="secondary" className="bg-teal-50 text-teal-600 text-[10px] px-1.5">
                {scenesWithDialogue.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-dialogue" className="text-xs text-muted-foreground cursor-pointer">
                仅显示有对话
              </Label>
              <Switch
                id="filter-dialogue"
                checked={filterDialogueOnly}
                onCheckedChange={setFilterDialogueOnly}
                className="data-[state=checked]:bg-teal-500"
              />
            </div>
          </div>

          {/* Scene cards list */}
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-2 p-3">
              <AnimatePresence mode="popLayout">
                {displayScenes.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    {filterDialogueOnly ? '没有包含对话的场景' : '暂无场景'}
                  </div>
                ) : (
                  displayScenes.map((scene, idx) => (
                    <SceneCard
                      key={scene.id}
                      scene={scene}
                      index={idx}
                      character={characters.find((c) => c.id === sceneCharacterMap[scene.id])}
                      characters={characters}
                      isGenerating={isGenerating === scene.id}
                      isPlaying={isPlaying === scene.id}
                      selectedSceneId={selectedScene?.id || null}
                      onSceneClick={handleSceneClick}
                      onCharacterChange={handleCharacterChange}
                      onGenerate={handleGenerateForScene}
                      onPlayToggle={handlePlayToggle}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Voice Settings & Preview */}
        <div className="hidden flex-1 flex-col lg:flex">
          {selectedScene ? (
            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* Selected scene header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-teal-50 text-teal-600 border-teal-200 text-xs">
                      场景 {scenes.indexOf(selectedScene) + 1}
                    </Badge>
                    {selectedScene.audioUrl && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        已有配音
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedScene.title || '未命名场景'}
                  </h2>
                </div>

                {/* Dialogue textarea */}
                <div className="mb-5 space-y-2">
                  <Label className="text-sm font-medium">对话内容</Label>
                  <Textarea
                    value={editDialogue}
                    onChange={(e) => setEditDialogue(e.target.value)}
                    placeholder="输入场景对话内容..."
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground">
                      {editDialogue.length}/1024 字符
                    </p>
                    {editDialogue.length > 1024 && (
                      <p className="text-[10px] text-red-500">超过最大长度，将截断</p>
                    )}
                  </div>
                </div>

                <Separator className="my-5" />

                {/* Character selector */}
                <div className="mb-5 space-y-2">
                  <Label className="text-sm font-medium">配音角色</Label>
                  <Select
                    value={selectedCharacterId}
                    onValueChange={setSelectedCharacterId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择配音角色" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((char) => (
                        <SelectItem key={char.id} value={char.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{char.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({getVoiceInfo(char.voiceType).desc})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice type display */}
                {selectedCharacter && (
                  <div className="mb-5 space-y-2">
                    <Label className="text-sm font-medium">音色类型</Label>
                    <VoiceTypeDisplay voiceType={selectedCharacter.voiceType} />
                  </div>
                )}

                {/* Speed slider */}
                <div className="mb-5 space-y-3">
                  <Label className="text-sm font-medium">语速调节</Label>
                  <div className="flex items-center gap-4">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      value={[speed]}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      onValueChange={(v) => setSpeed(v[0])}
                      className="flex-1 [&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-teal-500 [&_[data-slot=slider-range]]:to-emerald-500"
                    />
                    <span className="w-12 text-center text-sm font-semibold text-teal-600">
                      {speed.toFixed(1)}x
                    </span>
                  </div>
                  <div className="flex justify-between px-8 text-[10px] text-muted-foreground">
                    <span>慢速 0.5x</span>
                    <span>正常 1.0x</span>
                    <span>快速 2.0x</span>
                  </div>
                </div>

                <Separator className="my-5" />

                {/* Preview section */}
                <div className="mb-5 space-y-3">
                  <Label className="text-sm font-medium">试听预览</Label>
                  <p className="text-xs text-muted-foreground">
                    点击试听按钮，使用当前设置的音色和语速生成预览音频
                  </p>

                  {/* Preview text area */}
                  <div className="rounded-lg border bg-slate-50/50 p-3">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <FileAudio className="h-3 w-3" />
                      待合成文本
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 line-clamp-3">
                      {editDialogue || '暂无对话内容'}
                    </p>
                  </div>

                  {/* Preview controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handlePreview}
                      disabled={isPreviewGenerating || !editDialogue.trim() || !selectedCharacterId}
                      className="flex-1 gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
                    >
                      {isPreviewGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Headphones className="h-4 w-4" />
                          试听
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        if (previewAudioRef.current) {
                          if (isPreviewPlaying) {
                            stopAllAudio()
                          } else {
                            previewAudioRef.current.play()
                            setIsPreviewPlaying(true)
                          }
                        }
                      }}
                      disabled={!previewAudioUrl}
                      variant="outline"
                      className="gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50"
                    >
                      {isPreviewPlaying ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Generating animation */}
                  <AnimatePresence>
                    {isPreviewGenerating && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 rounded-lg border border-teal-100 bg-teal-50/50 p-3"
                      >
                        <SoundwaveAnimation active />
                        <div>
                          <p className="text-sm font-medium text-teal-700">正在合成语音...</p>
                          <p className="text-[10px] text-teal-500">AI 正在生成音频，请稍候</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Waveform / Audio Player */}
                  <WaveformVisualizer
                    isPlaying={isPreviewPlaying}
                    audioUrl={previewAudioUrl || selectedScene.audioUrl || ''}
                  />

                  {/* Apply button */}
                  {previewAudioUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Button
                        onClick={handleApplyToScene}
                        variant="outline"
                        className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        应用到「{selectedScene.title || '当前场景'}」
                      </Button>
                    </motion.div>
                  )}
                </div>

                <Separator className="my-5" />

                {/* Scene audio player (if exists) */}
                {selectedScene.audioUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">场景配音</Label>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-700">配音已生成</span>
                      </div>
                      <audio
                        controls
                        src={selectedScene.audioUrl}
                        className="h-10 w-full rounded-md"
                        preload="metadata"
                      />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : (
            /* No scene selected placeholder */
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
                <Waves className="h-8 w-8 text-teal-300" />
              </div>
              <h3 className="mb-1 text-base font-semibold text-foreground">选择一个场景</h3>
              <p className="max-w-xs text-sm text-muted-foreground">
                从左侧列表中选择一个场景，即可进行配音设置和预览
              </p>
              <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <ChevronRight className="h-4 w-4 animate-pulse" />
                <span>点击左侧场景卡片开始</span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile: show selected scene info below (no right panel) */}
        <div className="flex flex-1 flex-col lg:hidden">
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
              <Waves className="h-8 w-8 text-teal-300" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-foreground">
              {selectedScene ? selectedScene.title : '选择一个场景'}
            </h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              请使用桌面端获得完整的配音编辑体验
            </p>
            {selectedScene && (
              <div className="mt-4 w-full rounded-lg border bg-card p-4 text-left">
                <p className="text-sm text-foreground mb-2">{selectedScene.dialogue}</p>
                {selectedScene.audioUrl && (
                  <audio controls src={selectedScene.audioUrl} className="h-10 w-full" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Batch Generate Dialog */}
      <BatchGenerateDialog
        open={batchOpen}
        onOpenChange={setBatchOpen}
        scenes={scenesWithDialogue}
        sceneCharacterMap={sceneCharacterMap}
        characters={characters}
        batchStatus={batchStatus}
        progress={batchProgress}
        isRunning={batchRunning}
        onStart={handleBatchGenerate}
      />
    </div>
  )
}
