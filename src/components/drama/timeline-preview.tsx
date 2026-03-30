'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Download,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Video,
  Volume2,
  Check,
  X,
  Plus,
  FileJson,
  BarChart3,
  Eye,
  AlertCircle,
  FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDramaStore, type DramaScene } from '@/store/drama-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// ─── Helpers ─────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function getSceneCompletion(scene: DramaScene): number {
  let count = 0
  if (scene.imageUrl) count++
  if (scene.audioUrl) count++
  if (scene.videoUrl) count++
  return Math.round((count / 3) * 100)
}

function getProjectCompletion(scenes: DramaScene[]): number {
  if (scenes.length === 0) return 0
  const total = scenes.reduce((sum, s) => sum + getSceneCompletion(s), 0)
  return Math.round(total / scenes.length)
}

// ─── Empty State: No Project ─────────────────────────────────

function NoProjectState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-[60vh] flex-col items-center justify-center text-center"
    >
      <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
        <FolderOpen className="size-10 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">请先选择一个项目</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        在项目仪表板中选择或创建一个项目，即可开始使用时间线与预览功能
      </p>
    </motion.div>
  )
}

// ─── Empty State: No Scenes ──────────────────────────────────

function NoScenesState() {
  const { setCurrentStep } = useDramaStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-[60vh] flex-col items-center justify-center text-center"
    >
      <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
        <AlertCircle className="size-10 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">还没有场景</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        请在分镜设计中创建场景，场景将自动出现在时间线中
      </p>
      <Button
        onClick={() => setCurrentStep('storyboard')}
        className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
      >
        前往分镜设计
      </Button>
    </motion.div>
  )
}

// ─── Scene Timeline Card ─────────────────────────────────────

function SceneTimelineCard({
  scene,
  index,
  isSelected,
  isAutoPlaying,
  totalScenes,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  scene: DramaScene
  index: number
  isSelected: boolean
  isAutoPlaying: boolean
  totalScenes: number
  onSelect: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const firstLine = scene.dialogue ? scene.dialogue.split('\n')[0] : ''
  const completion = getSceneCompletion(scene)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative flex gap-3"
    >
      {/* Timeline Rail Node */}
      <div className="relative flex flex-col items-center">
        <button
          onClick={onSelect}
          className={cn(
            'z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-200',
            isSelected
              ? 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110'
              : isAutoPlaying
                ? 'border-amber-400 bg-amber-100 text-amber-600'
                : 'border-slate-300 bg-white text-slate-500 hover:border-amber-400 hover:bg-amber-50',
          )}
        >
          {index + 1}
        </button>
        {/* Connector line */}
        {index < totalScenes - 1 && (
          <div
            className={cn(
              'w-0.5 flex-1 min-h-[20px]',
              isSelected ? 'bg-amber-300' : 'bg-slate-200',
            )}
          />
        )}
      </div>

      {/* Scene Card */}
      <div
        className={cn(
          'group mb-4 flex-1 rounded-xl border p-3 transition-all duration-200 cursor-pointer',
          isSelected
            ? 'border-amber-300 bg-amber-50/80 shadow-md shadow-amber-500/10'
            : 'border-slate-200 bg-white hover:border-amber-200 hover:shadow-sm',
        )}
        onClick={onSelect}
      >
        <div className="flex gap-3">
          {/* Thumbnail */}
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
            {scene.imageUrl ? (
              <img
                src={scene.imageUrl}
                alt={scene.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="size-5 text-slate-300" />
              </div>
            )}
            {/* Completion badge */}
            {completion === 100 && (
              <div className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-emerald-500">
                <Check className="size-3 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h4 className="truncate text-sm font-semibold text-slate-800">
                  {scene.title || `场景 ${index + 1}`}
                </h4>
                <span className="shrink-0 text-xs text-slate-400 font-mono">
                  {formatDuration(scene.duration)}
                </span>
              </div>

              {/* Asset Indicators */}
              <div className="mt-1 flex items-center gap-1.5">
                <span title="场景图片" className="flex items-center">
                  {scene.imageUrl ? (
                    <ImageIcon className="size-3.5 text-blue-500" />
                  ) : (
                    <ImageIcon className="size-3.5 text-slate-300" />
                  )}
                </span>
                <span title="视频" className="flex items-center">
                  {scene.videoUrl ? (
                    <Video className="size-3.5 text-emerald-500" />
                  ) : (
                    <Video className="size-3.5 text-slate-300" />
                  )}
                </span>
                <span title="配音" className="flex items-center">
                  {scene.audioUrl ? (
                    <Volume2 className="size-3.5 text-purple-500" />
                  ) : (
                    <Volume2 className="size-3.5 text-slate-300" />
                  )}
                </span>
              </div>

              {/* Dialogue Preview */}
              {firstLine && (
                <p className="mt-1 truncate text-xs text-slate-400">
                  &ldquo;{firstLine}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp() }}
              disabled={index === 0}
              className="p-0.5 text-slate-400 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed"
              title="上移"
            >
              <ChevronLeft className="size-3.5 rotate-90" />
            </button>
            <GripVertical className="size-3.5 text-slate-300 cursor-grab" />
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown() }}
              disabled={index === totalScenes - 1}
              className="p-0.5 text-slate-400 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed"
              title="下移"
            >
              <ChevronLeft className="size-3.5 -rotate-90" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"
              title="删除"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Preview Panel ───────────────────────────────────────────

function PreviewPanel({
  scene,
  scenes,
  selectedIndex,
  isAutoPlaying,
  autoPlayProgress,
  onPrev,
  onNext,
  onToggleAutoPlay,
}: {
  scene: DramaScene | null
  scenes: DramaScene[]
  selectedIndex: number
  isAutoPlaying: boolean
  autoPlayProgress: number
  onPrev: () => void
  onNext: () => void
  onToggleAutoPlay: () => void
}) {
  const completion = scene ? getSceneCompletion(scene) : 0

  return (
    <div className="flex h-full flex-col">
      {/* Preview Area */}
      <div className="relative flex-1 min-h-[300px] overflow-hidden rounded-xl bg-slate-900">
        {scene ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex h-full w-full items-center justify-center"
            >
              {scene.videoUrl ? (
                <video
                  src={scene.videoUrl}
                  controls
                  className="max-h-full max-w-full object-contain"
                />
              ) : scene.imageUrl ? (
                <img
                  src={scene.imageUrl}
                  alt={scene.title}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Eye className="size-12" />
                  <span className="text-sm">暂无预览</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <Eye className="mb-3 size-12" />
            <span className="text-sm">选择一个场景进行预览</span>
          </div>
        )}

        {/* Auto-play progress bar */}
        {isAutoPlaying && scene && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400"
              initial={{ width: '0%' }}
              animate={{ width: `${autoPlayProgress}%` }}
              transition={{ duration: 0.1, ease: 'linear' }}
            />
          </div>
        )}

        {/* Scene indicator */}
        {scene && (
          <div className="absolute left-3 top-3">
            <Badge variant="secondary" className="bg-black/60 text-white text-xs backdrop-blur-sm">
              {selectedIndex + 1} / {scenes.length}
            </Badge>
          </div>
        )}
      </div>

      {/* Scene Info */}
      {scene && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-3"
        >
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              {scene.title || `场景 ${selectedIndex + 1}`}
            </h3>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatDuration(scene.duration)}
              </span>
              {scene.location && (
                <span className="flex items-center gap-1">
                  <span>📍</span>
                  {scene.location}
                </span>
              )}
              {scene.mood && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {scene.mood}
                </Badge>
              )}
            </div>
          </div>

          {/* Dialogue */}
          {scene.dialogue && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500 mb-1">对话</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap max-h-24 overflow-y-auto leading-relaxed">
                {scene.dialogue}
              </p>
            </div>
          )}

          {/* Playback Controls */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrev}
              disabled={selectedIndex === 0}
              className="text-xs"
            >
              <ChevronLeft className="size-4 mr-1" />
              上一场景
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">自动播放</span>
              <Switch
                checked={isAutoPlaying}
                onCheckedChange={onToggleAutoPlay}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={selectedIndex === scenes.length - 1}
              className="text-xs"
            >
              下一场景
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>

          {/* Asset Status */}
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-medium text-slate-500 mb-2">资源状态</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-600">
                  <ImageIcon className="size-3.5" />
                  场景图片
                </span>
                {scene.imageUrl ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <X className="size-4 text-slate-300" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-600">
                  <Volume2 className="size-3.5" />
                  配音
                </span>
                {scene.audioUrl ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <X className="size-4 text-slate-300" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs text-slate-600">
                  <Video className="size-3.5" />
                  视频
                </span>
                {scene.videoUrl ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <X className="size-4 text-slate-300" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-400">完成度</span>
                <span className={cn(
                  'text-[10px] font-medium',
                  completion === 100 ? 'text-emerald-500' : 'text-amber-500',
                )}>
                  {completion}%
                </span>
              </div>
              <Progress
                value={completion}
                className="h-1.5"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Export Dialog ───────────────────────────────────────────

function ExportDialog({
  project,
  scenes,
  characters,
}: {
  project: { id: string; name: string; genre: string; description: string }
  scenes: DramaScene[]
  characters: { id: string; name: string; role: string; avatarUrl: string }[]
}) {
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0)
  const completion = getProjectCompletion(scenes)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)
    const exportData = {
      project: {
        name: project.name,
        genre: project.genre,
        description: project.description,
        exportedAt: new Date().toISOString(),
      },
      stats: {
        totalScenes: scenes.length,
        totalDuration,
        totalDurationFormatted: formatDuration(totalDuration),
        completion: `${completion}%`,
      },
      characters: characters.map(c => ({ name: c.name, role: c.role })),
      scenes: scenes.map((s, i) => ({
        order: i + 1,
        title: s.title,
        duration: s.duration,
        location: s.location,
        timeOfDay: s.timeOfDay,
        mood: s.mood,
        cameraAngle: s.cameraAngle,
        dialogue: s.dialogue,
        assets: {
          image: !!s.imageUrl,
          audio: !!s.audioUrl,
          video: !!s.videoUrl,
        },
        completion: `${getSceneCompletion(s)}%`,
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name}-时间线导出.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setIsExporting(false)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Download className="size-5 text-amber-500" />
          导出项目
        </DialogTitle>
        <DialogDescription>
          导出项目数据为JSON格式，包含所有场景和资源配置信息
        </DialogDescription>
      </DialogHeader>

      {/* Project Summary */}
      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-sm font-medium text-slate-700">项目概览</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400">项目名称</p>
            <p className="text-xs font-medium text-slate-700 truncate">{project.name}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400">类型</p>
            <p className="text-xs font-medium text-slate-700">{project.genre}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400">场景数量</p>
            <p className="text-xs font-medium text-slate-700">{scenes.length} 个场景</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] text-slate-400">总时长</p>
            <p className="text-xs font-medium text-slate-700">{formatDuration(totalDuration)}</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400">资源完成度</p>
            <p className={cn(
              'text-xs font-medium',
              completion === 100 ? 'text-emerald-500' : 'text-amber-500',
            )}>
              {completion}%
            </p>
          </div>
          <Progress value={completion} className="h-2" />
        </div>
      </div>

      {/* Export Format */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">导出格式</h4>
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500">
            <FileJson className="size-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">项目数据 JSON</p>
            <p className="text-[10px] text-slate-500">包含场景、角色、资源配置等完整数据</p>
          </div>
          <Check className="size-4 text-amber-500" />
        </div>
      </div>

      <DialogFooter>
        <Button
          onClick={handleExport}
          disabled={isExporting || scenes.length === 0}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
        >
          {isExporting ? (
            <>导出中...</>
          ) : (
            <>
              <Download className="size-4 mr-2" />
              导出
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function TimelinePreview() {
  const {
    currentProject,
    scenes,
    characters,
    removeScene,
    reorderScenes,
    addScene,
  } = useDramaStore()

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [autoPlayProgress, setAutoPlayProgress] = useState(0)
  const [exportOpen, setExportOpen] = useState(false)

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressStartRef = useRef<number>(0)

  const sortedScenes = [...scenes].sort((a, b) => a.sortOrder - b.sortOrder)
  const totalDuration = sortedScenes.reduce((sum, s) => sum + s.duration, 0)
  const projectCompletion = getProjectCompletion(sortedScenes)

  // Fetch scenes when project changes
  const prevProjectIdRef = useRef(currentProject?.id)
  useEffect(() => {
    if (currentProject?.id !== prevProjectIdRef.current) {
      prevProjectIdRef.current = currentProject?.id
      // Reset selection via ref to avoid synchronous setState in effect
      setTimeout(() => setSelectedIndex(0), 0)
    }
    if (currentProject) {
      fetch('/api/scenes?projectId=' + currentProject.id)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            useDramaStore.getState().setScenes(data.scenes || [])
            // Fetch characters too
            fetch('/api/characters?projectId=' + currentProject.id)
              .then(r => r.json())
              .then(cd => { if (cd.success) useDramaStore.getState().setCharacters(cd.characters || []) })
              .catch(() => {})
          }
        })
        .catch(() => {})
    }
  }, [currentProject])

  // Clamp selected index when scenes change (computed, no effect needed)
  const clampedIndex = sortedScenes.length > 0
    ? Math.min(selectedIndex, sortedScenes.length - 1)
    : 0
  const selectedScene = sortedScenes[clampedIndex] || null

  // Auto-play logic - external timer subscription
  useEffect(() => {
    if (!isAutoPlaying || sortedScenes.length === 0) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current)
      return
    }

    const currentScene = sortedScenes[clampedIndex]
    const duration = currentScene ? currentScene.duration * 1000 : 3000
    progressStartRef.current = Date.now()

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartRef.current
      setAutoPlayProgress(Math.min((elapsed / duration) * 100, 100))
    }, 50)

    autoPlayTimerRef.current = setTimeout(() => {
      if (clampedIndex < sortedScenes.length - 1) {
        setSelectedIndex((prev) => prev + 1)
      } else {
        setIsAutoPlaying(false)
      }
    }, duration)

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [isAutoPlaying, clampedIndex, sortedScenes])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    }
  }, [])

  function handleSelectScene(index: number) {
    setSelectedIndex(index)
    if (isAutoPlaying) {
      setIsAutoPlaying(false)
    }
  }

  function handleDeleteScene(sceneId: string) {
    removeScene(sceneId)
    if (isAutoPlaying) setIsAutoPlaying(false)
  }

  function handleMoveScene(fromIndex: number, direction: 'up' | 'down') {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= sortedScenes.length) return

    const newScenes = [...sortedScenes]
    const temp = newScenes[fromIndex]
    newScenes[fromIndex] = newScenes[toIndex]
    newScenes[toIndex] = temp

    // Update sortOrder values
    const reordered = newScenes.map((s, i) => ({ ...s, sortOrder: i }))
    reorderScenes(reordered)

    if (clampedIndex === fromIndex) {
      setSelectedIndex(toIndex)
    } else if (clampedIndex === toIndex) {
      setSelectedIndex(fromIndex)
    }
  }

  function handleAddScene() {
    const newScene: DramaScene = {
      id: `scene-${Date.now()}`,
      projectId: currentProject!.id,
      episodeId: null,
      title: `场景 ${sortedScenes.length + 1}`,
      description: '',
      dialogue: '',
      location: '',
      timeOfDay: '',
      mood: '',
      cameraAngle: '',
      imageUrl: '',
      videoUrl: '',
      audioUrl: '',
      sortOrder: sortedScenes.length,
      duration: 5,
    }
    addScene(newScene)
    setSelectedIndex(sortedScenes.length)
  }

  // ─── Empty States ──────────────────────────────────────────
  if (!currentProject) {
    return <NoProjectState />
  }

  if (sortedScenes.length === 0) {
    return <NoScenesState />
  }

  // ─── Main Render ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
            <Clock className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">时间线与预览</h1>
            <p className="text-xs text-slate-400">
              场景排序、预览播放与项目导出
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Total Duration */}
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
            <Clock className="size-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">
              总时长 {formatDuration(totalDuration)}
            </span>
          </div>

          {/* Export Button */}
          <Dialog open={exportOpen} onOpenChange={setExportOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
              >
                <Download className="size-4 mr-2" />
                导出项目
              </Button>
            </DialogTrigger>
            <ExportDialog
              project={currentProject}
              scenes={sortedScenes}
              characters={characters}
            />
          </Dialog>
        </div>
      </motion.div>

      {/* Project Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-amber-100 bg-gradient-to-r from-amber-50/50 to-orange-50/50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                <BarChart3 className="size-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">项目概览</p>
                <p className="text-xs text-slate-500">
                  {sortedScenes.length} 个场景 · {characters.length} 个角色 · {formatDuration(totalDuration)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-400">完成度</p>
                <p className={cn(
                  'text-lg font-bold',
                  projectCompletion === 100 ? 'text-emerald-500' : 'text-amber-500',
                )}>
                  {projectCompletion}%
                </p>
              </div>
              <div className="w-24">
                <Progress value={projectCompletion} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Layout: Two Panels */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Panel - Timeline */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:w-[60%] min-w-0"
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex size-2 rounded-full bg-amber-500" />
                  场景时间线
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {sortedScenes.length} 个场景
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[520px] pr-2">
                <div className="relative pl-1">
                  {sortedScenes.map((scene, index) => (
                    <SceneTimelineCard
                      key={scene.id}
                      scene={scene}
                      index={index}
                      isSelected={index === clampedIndex}
                      isAutoPlaying={isAutoPlaying && index === clampedIndex}
                      totalScenes={sortedScenes.length}
                      onSelect={() => handleSelectScene(index)}
                      onDelete={() => handleDeleteScene(scene.id)}
                      onMoveUp={() => handleMoveScene(index, 'up')}
                      onMoveDown={() => handleMoveScene(index, 'down')}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Add Scene Button */}
              <div className="mt-4 flex items-center gap-3">
                <div className="relative flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-slate-200" />
                  <button
                    onClick={handleAddScene}
                    className="z-10 flex size-8 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-500"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-400">添加新场景</span>
              </div>

              {/* Total Duration Footer */}
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>场景列表结束</span>
                <span className="flex items-center gap-1 font-medium text-amber-600">
                  <Clock className="size-3" />
                  总计 {formatDuration(totalDuration)}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Panel - Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:w-[40%] min-w-0"
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="flex size-2 rounded-full bg-amber-500" />
                  场景预览
                </CardTitle>
                {isAutoPlaying && (
                  <Badge className="bg-amber-500 text-white text-xs animate-pulse">
                    <Play className="size-3 mr-1" />
                    播放中
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <PreviewPanel
                scene={selectedScene}
                scenes={sortedScenes}
                selectedIndex={clampedIndex}
                isAutoPlaying={isAutoPlaying}
                autoPlayProgress={autoPlayProgress}
                onPrev={() => setSelectedIndex((i) => Math.max(0, i - 1))}
                onNext={() => setSelectedIndex((i) => Math.min(sortedScenes.length - 1, i + 1))}
                onToggleAutoPlay={() => {
                  setIsAutoPlaying((prev) => !prev)
                }}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
