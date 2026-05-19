'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video,
  Play,
  Pause,
  RotateCcw,
  Settings2,
  Sparkles,
  Clock,
  Film,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Zap,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Layers,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDramaStore, type DramaScene } from '@/store/drama-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'

// ─── Types ──────────────────────────────────────────────────
interface VideoTask {
  sceneId: string
  taskId: string | null
  status: 'idle' | 'submitting' | 'processing' | 'success' | 'failed'
  progress: number
  videoUrl?: string
  error?: string
}

interface VideoSettings {
  quality: 'speed' | 'quality'
  duration: 5 | 10
  fps: 30 | 60
  withAudio: boolean
  prompt: string
}

const DEFAULT_SETTINGS: VideoSettings = {
  quality: 'speed',
  duration: 5,
  fps: 30,
  withAudio: false,
  prompt: '',
}

// ─── Spinner ────────────────────────────────────────────────
function SpinningLoader({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      className={className}
    >
      <Loader2 size={size} />
    </motion.div>
  )
}

// ─── Scene Status Badge ─────────────────────────────────────
function SceneStatusBadge({ task }: { task: VideoTask }) {
  switch (task.status) {
    case 'idle':
      return (
        <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200 gap-1.5">
          <Clock className="size-3" />
          未生成
        </Badge>
      )
    case 'submitting':
    case 'processing':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1.5">
          <SpinningLoader size={12} />
          生成中...
        </Badge>
      )
    case 'success':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1.5">
          <CheckCircle2 className="size-3" />
          已完成
        </Badge>
      )
    case 'failed':
      return (
        <Badge variant="destructive" className="gap-1.5">
          <AlertCircle className="size-3" />
          失败
        </Badge>
      )
    default:
      return null
  }
}

// ─── Video Preview Overlay ──────────────────────────────────
function VideoPreviewOverlay({
  videoUrl,
  thumbnailUrl,
  onPlay,
}: {
  videoUrl: string
  thumbnailUrl: string
  onPlay: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlay}
    >
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Play button */}
      <motion.div
        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        className="relative z-10 flex size-14 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm"
      >
        <Play className="size-6 text-slate-900 ml-0.5" fill="currentColor" />
      </motion.div>

      {/* Video badge */}
      <div className="absolute bottom-2 left-2 z-10">
        <Badge className="bg-emerald-500 text-white border-0 gap-1 text-[10px]">
          <Film className="size-2.5" />
          视频已生成
        </Badge>
      </div>
    </motion.div>
  )
}

// ─── Scene Card ─────────────────────────────────────────────
function SceneCard({
  scene,
  task,
  index,
  onSelect,
  onGenerate,
}: {
  scene: DramaScene
  task: VideoTask
  index: number
  onSelect: () => void
  onGenerate: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlayPreview = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
        setIsPlaying(false)
      } else {
        videoRef.current.play()
        setIsPlaying(true)
      }
    }
  }, [isPlaying])

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card
        className={cn(
          'group overflow-hidden py-0 gap-0 transition-all duration-200 hover:shadow-md cursor-pointer border-slate-200/80',
          task.status === 'processing' && 'ring-2 ring-amber-200',
          task.status === 'success' && 'ring-2 ring-emerald-200',
          task.status === 'failed' && 'ring-2 ring-red-200',
        )}
        onClick={onSelect}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-slate-900 overflow-hidden">
          {scene.imageUrl ? (
            <motion.img
              src={scene.imageUrl}
              alt={scene.title}
              animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageIcon className="size-8 text-slate-600" />
            </div>
          )}

          {/* Scene number overlay */}
          <div className="absolute top-2 left-2 z-10">
            <div className="flex size-7 items-center justify-center rounded-lg bg-black/60 text-xs font-bold text-white backdrop-blur-sm">
              {index + 1}
            </div>
          </div>

          {/* Duration badge */}
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-black/60 text-white border-0 text-[10px] backdrop-blur-sm gap-1">
              <Clock className="size-2.5" />
              {scene.duration || 5}秒
            </Badge>
          </div>

          {/* Processing overlay */}
          {task.status === 'processing' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <SpinningLoader size={32} className="text-amber-400" />
              <p className="mt-2 text-xs font-medium text-amber-300">视频生成中...</p>
              <div className="mt-2 w-32">
                <Progress value={task.progress} className="h-1.5 bg-white/20 [&>div]:bg-amber-400" />
              </div>
            </div>
          )}

          {/* Video preview overlay */}
          {task.status === 'success' && task.videoUrl && (
            <VideoPreviewOverlay
              videoUrl={task.videoUrl}
              thumbnailUrl={scene.imageUrl}
              onPlay={handlePlayPreview}
            />
          )}

          {/* Failed overlay */}
          {task.status === 'failed' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-500/10 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-1">
                <AlertCircle className="size-6 text-red-400" />
                <span className="text-[10px] font-medium text-red-300">生成失败</span>
              </div>
            </div>
          )}

          {/* Hidden video player */}
          {task.videoUrl && (
            <video
              ref={videoRef}
              src={task.videoUrl}
              className="absolute inset-0 size-full object-cover"
              onEnded={handleVideoEnd}
              playsInline
              preload="metadata"
            />
          )}
        </div>

        {/* Card body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                {scene.title}
              </h3>
              {scene.description && (
                <p className="mt-1 text-xs text-slate-400 line-clamp-1">
                  {scene.description}
                </p>
              )}
            </div>
            <SceneStatusBadge task={task} />
          </div>

          <div className="mt-3 flex items-center gap-2">
            {task.status === 'idle' && (
              <Button
                size="sm"
                className="h-8 gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onGenerate()
                }}
              >
                <Sparkles className="size-3.5" />
                生成视频
              </Button>
            )}
            {task.status === 'failed' && (
              <Button
                size="sm"
                variant="destructive"
                className="h-8 gap-1.5"
                onClick={(e) => {
                  e.stopPropagation()
                  onGenerate()
                }}
              >
                <RotateCcw className="size-3.5" />
                重新生成
              </Button>
            )}
            {task.status === 'success' && task.videoUrl && (
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlayPreview()
                  }}
                >
                  {isPlaying ? (
                    <><Pause className="size-3.5" /> 暂停</>
                  ) : (
                    <><Play className="size-3.5" /> 预览</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect()
                  }}
                >
                  <Settings2 className="size-3.5" />
                  设置
                </Button>
              </div>
            )}
            {(task.status === 'processing' || task.status === 'submitting') && (
              <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled>
                <SpinningLoader size={14} />
                {task.status === 'submitting' ? '提交中...' : '处理中...'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// ─── Video Settings Sheet ───────────────────────────────────
function VideoSettingsSheet({
  open,
  onOpenChange,
  scene,
  settings,
  onSettingsChange,
  onGenerate,
  task,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  scene: DramaScene | null
  settings: VideoSettings
  onSettingsChange: (s: VideoSettings) => void
  onGenerate: () => void
  task: VideoTask | null
}) {
  if (!scene) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 overflow-hidden">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <Settings2 className="size-4 text-white" />
            </div>
            视频生成设置
          </SheetTitle>
          <SheetDescription>
            为「{scene.title}」配置视频生成参数
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <ScrollArea className="flex-1 h-[calc(100vh-220px)]">
          <div className="p-6 space-y-6">
            {/* Image source */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                参考图片
              </Label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900">
                {scene.imageUrl ? (
                  <img
                    src={scene.imageUrl}
                    alt={scene.title}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-2">
                    <ImageIcon className="size-8 text-slate-600" />
                    <p className="text-xs text-slate-500">暂无参考图片</p>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                使用分镜设计中的场景图片作为视频参考
              </p>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                视频描述
              </Label>
              <Textarea
                value={settings.prompt || scene.description}
                onChange={(e) => onSettingsChange({ ...settings, prompt: e.target.value })}
                placeholder="描述你想要生成的视频内容..."
                className="min-h-24 resize-none text-sm"
              />
              <p className="text-[11px] text-slate-400">
                已自动填充场景描述，你可以根据需要调整
              </p>
            </div>

            <Separator />

            {/* Quality */}
            <div className="space-y-3">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                生成质量
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSettingsChange({ ...settings, quality: 'speed' })}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border-2 p-4 transition-all',
                    settings.quality === 'speed'
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                  )}
                >
                  <Zap className="size-5" />
                  <span className="text-sm font-medium">快速</span>
                  <span className="text-[10px] opacity-70">约 2 分钟</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSettingsChange({ ...settings, quality: 'quality' })}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border-2 p-4 transition-all',
                    settings.quality === 'quality'
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                  )}
                >
                  <Sparkles className="size-5" />
                  <span className="text-sm font-medium">高质量</span>
                  <span className="text-[10px] opacity-70">约 5 分钟</span>
                </motion.button>
              </div>
            </div>

            <Separator />

            {/* Duration */}
            <div className="space-y-3">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                视频时长
              </Label>
              <RadioGroup
                value={String(settings.duration)}
                onValueChange={(v) => onSettingsChange({ ...settings, duration: Number(v) as 5 | 10 })}
                className="flex gap-3"
              >
                <Label
                  htmlFor="duration-5"
                  className={cn(
                    'flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all',
                    settings.duration === 5
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <RadioGroupItem value="5" id="duration-5" className="sr-only" />
                  <Clock className="size-4" />
                  <span className="text-sm font-medium">5 秒</span>
                  <span className="text-[10px] text-slate-400">短片段</span>
                </Label>
                <Label
                  htmlFor="duration-10"
                  className={cn(
                    'flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all',
                    settings.duration === 10
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <RadioGroupItem value="10" id="duration-10" className="sr-only" />
                  <Film className="size-4" />
                  <span className="text-sm font-medium">10 秒</span>
                  <span className="text-[10px] text-slate-400">长片段</span>
                </Label>
              </RadioGroup>
            </div>

            {/* FPS */}
            <div className="space-y-3">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                帧率 (FPS)
              </Label>
              <RadioGroup
                value={String(settings.fps)}
                onValueChange={(v) => onSettingsChange({ ...settings, fps: Number(v) as 30 | 60 })}
                className="flex gap-3"
              >
                <Label
                  htmlFor="fps-30"
                  className={cn(
                    'flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all',
                    settings.fps === 30
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <RadioGroupItem value="30" id="fps-30" className="sr-only" />
                  <span className="text-sm font-medium">30 FPS</span>
                  <span className="text-[10px] text-slate-400">标准</span>
                </Label>
                <Label
                  htmlFor="fps-60"
                  className={cn(
                    'flex flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all',
                    settings.fps === 60
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <RadioGroupItem value="60" id="fps-60" className="sr-only" />
                  <span className="text-sm font-medium">60 FPS</span>
                  <span className="text-[10px] text-slate-400">流畅</span>
                </Label>
              </RadioGroup>
            </div>

            {/* Audio toggle */}
            <div className="space-y-3">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                AI 音频
              </Label>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  {settings.withAudio ? (
                    <Volume2 className="size-5 text-amber-500" />
                  ) : (
                    <VolumeX className="size-5 text-slate-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900">生成音频</p>
                    <p className="text-xs text-slate-400">AI自动生成匹配音效</p>
                  </div>
                </div>
                <Switch
                  checked={settings.withAudio}
                  onCheckedChange={(checked) => onSettingsChange({ ...settings, withAudio: checked })}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </div>

            {/* Progress indicator */}
            {task && (task.status === 'submitting' || task.status === 'processing') && (
              <div className="space-y-2 rounded-lg bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-center gap-2">
                  <SpinningLoader size={16} className="text-amber-500" />
                  <span className="text-sm font-medium text-amber-700">
                    {task.status === 'submitting' ? '正在提交任务...' : '视频生成中...'}
                  </span>
                </div>
                <Progress value={task.progress} className="h-2 bg-amber-100 [&>div]:bg-amber-500" />
                <p className="text-[11px] text-amber-600">
                  预计还需要 {settings.quality === 'speed' ? '1-2' : '3-5'} 分钟，请耐心等待
                </p>
              </div>
            )}

            {/* Success state */}
            {task && task.status === 'success' && (
              <div className="space-y-2 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">视频生成完成！</span>
                </div>
                {task.videoUrl && (
                  <video
                    src={task.videoUrl}
                    controls
                    className="w-full rounded-lg aspect-video bg-black"
                  />
                )}
              </div>
            )}

            {/* Failed state */}
            {task && task.status === 'failed' && (
              <div className="space-y-2 rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">生成失败</span>
                </div>
                <p className="text-xs text-red-600">{task.error || '请重试或调整参数'}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <SheetFooter className="p-4 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            onClick={onGenerate}
            disabled={task?.status === 'processing' || task?.status === 'submitting'}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 gap-1.5 shadow-sm"
          >
            {task?.status === 'processing' || task?.status === 'submitting' ? (
              <><SpinningLoader size={14} /> 生成中...</>
            ) : task?.status === 'success' ? (
              <><RefreshCw className="size-4" /> 重新生成</>
            ) : (
              <><Sparkles className="size-4" /> 开始生成</>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Batch Generation Dialog ────────────────────────────────
function BatchGenerationDialog({
  open,
  onOpenChange,
  scenes,
  tasks,
  settings,
  onSettingsChange,
  selectedIds,
  onSelectedIdsChange,
  onBatchGenerate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  scenes: DramaScene[]
  tasks: Record<string, VideoTask>
  settings: VideoSettings
  onSettingsChange: (s: VideoSettings) => void
  selectedIds: Set<string>
  onSelectedIdsChange: (ids: Set<string>) => void
  onBatchGenerate: () => void
}) {
  const eligibleScenes = scenes.filter((s) => s.imageUrl)
  const isAllSelected = eligibleScenes.length > 0 && eligibleScenes.every((s) => selectedIds.has(s.id))
  const hasProcessing = Object.values(tasks).some(
    (t) => t.status === 'processing' || t.status === 'submitting',
  )

  const toggleAll = () => {
    if (isAllSelected) {
      onSelectedIdsChange(new Set())
    } else {
      onSelectedIdsChange(new Set(eligibleScenes.map((s) => s.id)))
    }
  }

  const toggleScene = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectedIdsChange(next)
  }

  const estimatedTime = selectedIds.size * (settings.quality === 'speed' ? 2 : 5)
  const completedCount = scenes.filter(
    (s) => tasks[s.id]?.status === 'success',
  ).length
  const processingCount = Object.values(tasks).filter(
    (t) => t.status === 'processing' || t.status === 'submitting',
  ).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <Layers className="size-4 text-white" />
            </div>
            批量生成视频
          </DialogTitle>
          <DialogDescription>
            选择需要生成视频的场景，统一配置参数后批量生成
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Global settings */}
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            全局设置
          </p>
          <div className="flex flex-wrap gap-4">
            {/* Quality */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400">质量</Label>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => onSettingsChange({ ...settings, quality: 'speed' })}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    settings.quality === 'speed'
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50',
                  )}
                >
                  快速
                </button>
                <button
                  onClick={() => onSettingsChange({ ...settings, quality: 'quality' })}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors border-l border-slate-200',
                    settings.quality === 'quality'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-slate-500 hover:bg-slate-50',
                  )}
                >
                  高质量
                </button>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-400">时长</Label>
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => onSettingsChange({ ...settings, duration: 5 })}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    settings.duration === 5
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-50',
                  )}
                >
                  5 秒
                </button>
                <button
                  onClick={() => onSettingsChange({ ...settings, duration: 10 })}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors border-l border-slate-200',
                    settings.duration === 10
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-slate-500 hover:bg-slate-50',
                  )}
                >
                  10 秒
                </button>
              </div>
            </div>

            {/* Audio toggle */}
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.withAudio}
                onCheckedChange={(checked) => onSettingsChange({ ...settings, withAudio: checked })}
                className="data-[state=checked]:bg-amber-500"
              />
              <Label className="text-xs">AI音频</Label>
            </div>
          </div>
        </div>

        {/* Scene list */}
        <ScrollArea className="flex-1 max-h-72">
          <div className="p-4 space-y-2">
            {/* Select all */}
            <button
              onClick={toggleAll}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Checkbox checked={isAllSelected} />
                {isAllSelected ? '取消全选' : '全部选择'}
              </span>
              <span className="text-slate-400">
                {selectedIds.size} / {eligibleScenes.length} 个场景
              </span>
            </button>

            {eligibleScenes.map((scene) => {
              const task = tasks[scene.id]
              const isSelected = selectedIds.has(scene.id)
              return (
                <motion.div
                  key={scene.id}
                  layout
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3 transition-all',
                    isSelected
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-slate-200 hover:border-slate-300',
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleScene(scene.id)}
                  />
                  {/* Thumbnail */}
                  <div className="relative size-12 shrink-0 rounded-md overflow-hidden bg-slate-900">
                    {scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={scene.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <ImageIcon className="size-4 text-slate-600" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {scene.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400">{scene.duration || 5}秒</span>
                      {task && (
                        <SceneStatusBadge task={task} />
                      )}
                    </div>
                    {/* Progress bar for this scene */}
                    {task && (task.status === 'processing' || task.status === 'submitting') && (
                      <Progress
                        value={task.progress}
                        className="mt-1.5 h-1 bg-white/50 [&>div]:bg-amber-500"
                      />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="p-4">
          {/* Estimated time & stats */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-500" />
                已完成 {completedCount}
              </span>
              {processingCount > 0 && (
                <span className="flex items-center gap-1">
                  <SpinningLoader size={12} />
                  生成中 {processingCount}
                </span>
              )}
            </div>
            {selectedIds.size > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                预计 {estimatedTime} 分钟
              </span>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={onBatchGenerate}
              disabled={selectedIds.size === 0 || hasProcessing}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 gap-1.5 shadow-sm"
            >
              {hasProcessing ? (
                <><SpinningLoader size={14} /> 批量生成中...</>
              ) : (
                <><Sparkles className="size-4" /> 开始批量生成 ({selectedIds.size})</>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Video Factory Component ───────────────────────────
export function VideoFactory() {
  const { scenes, currentProject, updateScene } = useDramaStore()

  // State
  const [tasks, setTasks] = useState<Record<string, VideoTask>>({})
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [settings, setSettings] = useState<VideoSettings>(DEFAULT_SETTINGS)
  const [batchSelectedIds, setBatchSelectedIds] = useState<Set<string>>(new Set())

  // Refs
  const pollingIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({})

  // Derived
  const selectedScene = scenes.find((s) => s.id === selectedSceneId) || null
  const completedCount = scenes.filter(
    (s) => tasks[s.id]?.status === 'success' || s.videoUrl,
  ).length

  // Fetch scenes when project changes
  useEffect(() => {
    if (currentProject) {
      fetch('/api/scenes?projectId=' + currentProject.id)
        .then(res => res.json())
        .then(data => {
          if (data.success) useDramaStore.getState().setScenes(data.scenes || [])
        })
        .catch(() => {})
    } else {
      useDramaStore.getState().setScenes([])
    }
  }, [currentProject?.id])

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingIntervals.current).forEach(clearInterval)
    }
  }, [])

  // Poll video task status
  const startPolling = useCallback(
    (sceneId: string, taskId: string) => {
      // Clear existing interval
      if (pollingIntervals.current[sceneId]) {
        clearInterval(pollingIntervals.current[sceneId])
      }

      let progressValue = 10
      pollingIntervals.current[sceneId] = setInterval(async () => {
        try {
          const res = await fetch(`/api/generate-video?taskId=${taskId}`)
          const data = await res.json()

          if (data.status === 'success') {
            // Done!
            clearInterval(pollingIntervals.current[sceneId])
            delete pollingIntervals.current[sceneId]
            setTasks((prev) => ({
              ...prev,
              [sceneId]: {
                ...prev[sceneId],
                status: 'success',
                progress: 100,
                videoUrl: data.videoUrl,
              },
            }))
            // Update scene in store
            if (data.videoUrl) {
              updateScene(sceneId, { videoUrl: data.videoUrl })
            }
          } else if (data.status === 'failed') {
            clearInterval(pollingIntervals.current[sceneId])
            delete pollingIntervals.current[sceneId]
            setTasks((prev) => ({
              ...prev,
              [sceneId]: {
                ...prev[sceneId],
                status: 'failed',
                error: data.error || '视频生成失败',
              },
            }))
          } else {
            // Still processing, simulate progress
            progressValue = Math.min(progressValue + Math.random() * 5, 90)
            setTasks((prev) => ({
              ...prev,
              [sceneId]: {
                ...prev[sceneId],
                status: 'processing',
                progress: progressValue,
              },
            }))
          }
        } catch {
          // Continue polling
        }
      }, 5000)
    },
    [updateScene],
  )

  // Generate video for a single scene
  const generateVideo = useCallback(
    async (sceneId: string) => {
      const scene = scenes.find((s) => s.id === sceneId)
      if (!scene) return

      const taskSettings = sceneId === selectedSceneId ? settings : DEFAULT_SETTINGS

      // Set submitting state
      setTasks((prev) => ({
        ...prev,
        [sceneId]: {
          sceneId,
          taskId: null,
          status: 'submitting',
          progress: 5,
        },
      }))

      try {
        const res = await fetch('/api/generate-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: taskSettings.prompt || scene.description || '',
            image_url: scene.imageUrl,
            quality: taskSettings.quality,
            duration: taskSettings.duration,
            with_audio: taskSettings.withAudio,
            size: '1920x1080',
            fps: taskSettings.fps,
          }),
        })

        const data = await res.json()

        if (data.success && data.taskId) {
          setTasks((prev) => ({
            ...prev,
            [sceneId]: {
              ...prev[sceneId],
              taskId: data.taskId,
              status: 'processing',
              progress: 10,
            },
          }))
          startPolling(sceneId, data.taskId)
        } else {
          setTasks((prev) => ({
            ...prev,
            [sceneId]: {
              ...prev[sceneId],
              status: 'failed',
              error: data.error || '创建任务失败',
            },
          }))
        }
      } catch {
        setTasks((prev) => ({
          ...prev,
          [sceneId]: {
            ...prev[sceneId],
            status: 'failed',
            error: '网络错误，请重试',
          },
        }))
      }
    },
    [scenes, selectedSceneId, settings, startPolling],
  )

  // Handle select scene (open settings panel)
  const handleSelectScene = useCallback(
    (sceneId: string) => {
      setSelectedSceneId(sceneId)
      const scene = scenes.find((s) => s.id === sceneId)
      if (scene) {
        setSettings({
          ...DEFAULT_SETTINGS,
          prompt: scene.description || '',
        })
      }
      setSettingsOpen(true)
    },
    [scenes],
  )

  // Handle single generate from card
  const handleGenerateFromCard = useCallback(
    (sceneId: string) => {
      setSelectedSceneId(sceneId)
      const scene = scenes.find((s) => s.id === sceneId)
      if (scene) {
        setSettings({
          ...DEFAULT_SETTINGS,
          prompt: scene.description || '',
        })
      }
      setSettingsOpen(true)
      generateVideo(sceneId)
    },
    [scenes, generateVideo],
  )

  // Handle generate from settings panel
  const handleGenerateFromSettings = useCallback(() => {
    if (selectedSceneId) {
      generateVideo(selectedSceneId)
    }
  }, [selectedSceneId, generateVideo])

  // Batch generate
  const handleBatchGenerate = useCallback(() => {
    batchSelectedIds.forEach((id) => {
      generateVideo(id)
    })
    setBatchOpen(false)
  }, [batchSelectedIds, generateVideo])

  // Compute effective tasks by merging tasks state with scene-based defaults
  const effectiveTasks = useMemo(() => {
    const merged = { ...tasks }
    scenes.forEach((scene) => {
      if (!merged[scene.id]) {
        merged[scene.id] = {
          sceneId: scene.id,
          taskId: null,
          status: scene.videoUrl ? 'success' as const : 'idle' as const,
          progress: scene.videoUrl ? 100 : 0,
          videoUrl: scene.videoUrl || undefined,
        }
      }
    })
    return merged
  }, [scenes, tasks])

  // ─── Render ──────────────────────────────────────────────

  // No project state
  if (!currentProject) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex h-[60vh] flex-col items-center justify-center text-center"
      >
        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
          <Video className="size-10 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">视频工厂</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          请先选择一个项目
        </p>
      </motion.div>
    )
  }

  // No scenes state
  if (scenes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex h-[60vh] flex-col items-center justify-center text-center"
      >
        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
          <Film className="size-10 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">视频工厂</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          还没有场景，请在分镜设计中添加
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-200">
            <Video className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">视频工厂</h1>
            <p className="text-xs text-slate-400">
              AI 驱动的视频生成，从分镜到成片
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-slate-600">
              {completedCount}/{scenes.length}
            </span>
            <span className="text-xs text-slate-400">已完成</span>
          </div>

          {/* Batch generate button */}
          <Button
            onClick={() => setBatchOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 gap-1.5 shadow-sm"
          >
            <Layers className="size-4" />
            批量生成
          </Button>
        </div>
      </motion.div>

      {/* Scene cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {scenes.map((scene, index) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              task={effectiveTasks[scene.id] || {
                sceneId: scene.id,
                taskId: null,
                status: scene.videoUrl ? 'success' : 'idle',
                progress: scene.videoUrl ? 100 : 0,
                videoUrl: scene.videoUrl,
              }}
              index={index}
              onSelect={() => handleSelectScene(scene.id)}
              onGenerate={() => handleGenerateFromCard(scene.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Video settings sheet */}
      <VideoSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        scene={selectedScene}
        settings={settings}
        onSettingsChange={setSettings}
        onGenerate={handleGenerateFromSettings}
        task={selectedSceneId ? tasks[selectedSceneId] || null : null}
      />

      {/* Batch generation dialog */}
      <BatchGenerationDialog
        open={batchOpen}
        onOpenChange={setBatchOpen}
        scenes={scenes}
        tasks={effectiveTasks}
        settings={settings}
        onSettingsChange={setSettings}
        selectedIds={batchSelectedIds}
        onSelectedIdsChange={setBatchSelectedIds}
        onBatchGenerate={handleBatchGenerate}
      />
    </div>
  )
}
