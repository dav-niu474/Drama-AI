'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Plus,
  FolderOpen,
  Users,
  Film,
  Video,
  Sparkles,
  Wand2,
  UserCircle,
  MapPin,
  Mic,
  ArrowRight,
  Clock,
  MoreHorizontal,
  Trash2,
  Pencil,
  CalendarDays,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDramaStore, type DramaProject, type WorkflowStep } from '@/store/drama-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ─── Genre config ───────────────────────────────────────────
const genreOptions = [
  { value: '都市', color: 'bg-slate-500/20 text-slate-300' },
  { value: '古风', color: 'bg-amber-500/20 text-amber-300' },
  { value: '玄幻', color: 'bg-violet-500/20 text-violet-300' },
  { value: '悬疑', color: 'bg-rose-500/20 text-rose-300' },
  { value: '爱情', color: 'bg-pink-500/20 text-pink-300' },
  { value: '喜剧', color: 'bg-emerald-500/20 text-emerald-300' },
  { value: '科幻', color: 'bg-cyan-500/20 text-cyan-300' },
  { value: '恐怖', color: 'bg-red-500/20 text-red-300' },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-slate-500/20 text-slate-400' },
  writing: { label: '创作中', color: 'bg-sky-500/20 text-sky-400' },
  designing: { label: '设计中', color: 'bg-purple-500/20 text-purple-400' },
  producing: { label: '制作中', color: 'bg-amber-500/20 text-amber-400' },
  completed: { label: '已完成', color: 'bg-emerald-500/20 text-emerald-400' },
}

function getGenreColor(genre: string) {
  return genreOptions.find(g => g.value === genre)?.color || 'bg-slate-500/20 text-slate-300'
}

// ─── Stat Card ──────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: number
  gradient: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="relative overflow-hidden border-0 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
            </div>
            <div className={cn('flex size-11 items-center justify-center rounded-xl', gradient)}>
              <Icon className="size-5 text-white" />
            </div>
          </div>
        </CardContent>
        {/* Decorative gradient blob */}
        <div className={cn(
          'absolute -right-4 -bottom-4 size-24 rounded-full opacity-10 blur-2xl',
          gradient,
        )} />
      </Card>
    </motion.div>
  )
}

// ─── Quick Action Card ──────────────────────────────────────
function QuickActionCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay,
  onClick,
}: {
  icon: React.ElementType
  title: string
  description: string
  gradient: string
  delay: number
  onClick: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card
        className="group cursor-pointer border-0 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
        onClick={onClick}
      >
        <CardContent className="p-5">
          <div className={cn('mb-3 flex size-10 items-center justify-center rounded-lg', gradient)}>
            <Icon className="size-5 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-violet-600 opacity-0 transition-opacity group-hover:opacity-100">
            <span>开始使用</span>
            <ArrowRight className="size-3" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Project Card ───────────────────────────────────────────
function ProjectCard({
  project,
  characterCount,
  sceneCount,
  onOpen,
  onDelete,
  delay,
}: {
  project: DramaProject & { _count?: { characters: number; scenes: number; episodes: number } }
  characterCount?: number
  sceneCount?: number
  onOpen: () => void
  onDelete: () => void
  delay: number
}) {
  const status = statusConfig[project.status] || statusConfig.draft

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="group overflow-hidden border-0 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
        {/* Cover Image */}
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={project.coverImage || '/images/hero.png'}
            alt={project.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Status & Menu */}
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm', status.color)}>
              {status.label}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="size-4" />
                  删除项目
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Genre badge */}
          <div className="absolute bottom-3 left-3">
            <span className={cn('rounded-md px-2 py-1 text-[10px] font-semibold backdrop-blur-sm', getGenreColor(project.genre))}>
              {project.genre}
            </span>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3 className="truncate text-sm font-semibold text-slate-900">{project.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {project.description || '暂无描述'}
          </p>
        </CardContent>

        {/* Footer */}
        <CardFooter className="border-t border-slate-100 px-4 py-3">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {project._count?.characters || characterCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Film className="size-3" />
                {project._count?.scenes || sceneCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <Button size="sm" variant="ghost" onClick={onOpen} className="h-7 gap-1 text-xs text-violet-600 hover:text-violet-700">
              打开
              <ArrowRight className="size-3" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// ─── Empty State ────────────────────────────────────────────
function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-16"
    >
      <div className="mb-4 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100">
        <Film className="size-10 text-violet-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900">还没有项目</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-slate-500">
        开始你的第一个AI短剧创作之旅，让AI帮助你从创意到成片的完整流程
      </p>
      <Button
        onClick={onCreateNew}
        className="mt-6 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700"
      >
        <Plus className="size-4" />
        创建第一个项目
      </Button>
    </motion.div>
  )
}

// ─── Create Project Dialog ──────────────────────────────────
function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState('')
  const [genre, setGenre] = useState('都市')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const { setProjects, projects } = useDramaStore()

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          genre,
          description: description.trim(),
        }),
      })

      const data = await res.json()
      if (data.success) {
        setProjects([data.project, ...projects])
        setName('')
        setGenre('都市')
        setDescription('')
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Create project failed:', error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-violet-500" />
            创建新项目
          </DialogTitle>
          <DialogDescription>填写项目信息，开始你的AI短剧创作</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="project-name">项目名称</Label>
            <Input
              id="project-name"
              placeholder="例如：霸道总裁爱上我"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-genre">题材类型</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger id="project-genre" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {genreOptions.map(g => (
                  <SelectItem key={g.value} value={g.value}>
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', g.color.split(' ')[0].replace('/20', ''))} />
                      {g.value}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-desc">项目简介</Label>
            <Textarea
              id="project-desc"
              placeholder="简要描述你的短剧内容..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
          >
            {creating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="size-4 rounded-full border-2 border-white/30 border-t-white"
                />
                创建中...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                创建项目
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────
export function Dashboard() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    projects,
    setProjects,
    setCurrentProject,
    currentStep,
    setCurrentStep,
  } = useDramaStore()

  // Fetch projects on mount
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/projects')
      const data = await res.json()
      if (data.success) {
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Fetch projects failed:', error)
    } finally {
      setLoading(false)
    }
  }, [setProjects])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleOpenProject = (project: DramaProject) => {
    setCurrentProject(project)
    setCurrentStep('script')
  }

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setProjects(projects.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error('Delete project failed:', error)
    }
  }

  const handleQuickAction = (step: WorkflowStep) => {
    if (projects.length === 0) {
      setCreateDialogOpen(true)
      return
    }
    setCurrentProject(projects[0])
    setCurrentStep(step)
  }

  // Stats
  const totalProjects = projects.length
  const totalCharacters = projects.reduce((acc, p) => acc + ((p as any)._count?.characters || 0), 0)
  const totalScenes = projects.reduce((acc, p) => acc + ((p as any)._count?.scenes || 0), 0)
  const totalVideos = projects.reduce((acc, p) => acc + ((p as any)._count?.episodes || 0), 0)

  // Filter projects
  const filteredProjects = searchQuery
    ? projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.genre.includes(searchQuery) ||
        p.description.includes(searchQuery)
      )
    : projects

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            欢迎回来 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
            {' · '}开始你的创作之旅
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700"
        >
          <Plus className="size-4" />
          创建新项目
        </Button>
      </motion.div>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="relative aspect-[2.5/1] w-full overflow-hidden sm:aspect-[3/1]">
          <Image
            src="/images/hero.png"
            alt="DramaAI Hero"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="max-w-lg"
          >
            <Badge className="mb-3 border-violet-400/30 bg-violet-500/20 text-violet-200 backdrop-blur-sm">
              <Sparkles className="size-3" />
              AI驱动创作
            </Badge>
            <h2 className="text-xl font-bold text-white sm:text-2xl lg:text-3xl">
              AI短剧全流程<br className="hidden sm:block" />创作平台
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-300 sm:text-base">
              从创意构思到成片输出，AI助你实现专业级短剧制作。剧本创作、角色生成、分镜设计、智能配音、视频合成一站式完成。
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-white text-slate-900 shadow-lg hover:bg-slate-100"
                size="sm"
              >
                立即开始
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 text-white backdrop-blur-sm hover:bg-white/10">
                了解更多
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={FolderOpen} label="总项目" value={totalProjects} gradient="bg-gradient-to-br from-violet-500 to-violet-600" delay={0.15} />
        <StatCard icon={Users} label="总角色" value={totalCharacters} gradient="bg-gradient-to-br from-fuchsia-500 to-fuchsia-600" delay={0.2} />
        <StatCard icon={Film} label="总场景" value={totalScenes} gradient="bg-gradient-to-br from-amber-500 to-orange-500" delay={0.25} />
        <StatCard icon={Video} label="总视频" value={totalVideos} gradient="bg-gradient-to-br from-emerald-500 to-teal-500" delay={0.3} />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="mb-3 text-base font-semibold text-slate-900">快捷入口</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
          <QuickActionCard
            icon={Wand2}
            title="AI创意构思"
            description="AI帮你生成剧本创意和故事大纲"
            gradient="bg-gradient-to-br from-violet-500 to-purple-600"
            delay={0.35}
            onClick={() => handleQuickAction('script')}
          />
          <QuickActionCard
            icon={UserCircle}
            title="角色生成"
            description="一键生成角色形象和人物设定"
            gradient="bg-gradient-to-br from-fuchsia-500 to-pink-600"
            delay={0.4}
            onClick={() => handleQuickAction('characters')}
          />
          <QuickActionCard
            icon={MapPin}
            title="场景设计"
            description="AI生成场景画面和分镜图"
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            delay={0.45}
            onClick={() => handleQuickAction('storyboard')}
          />
          <QuickActionCard
            icon={Mic}
            title="一键配音"
            description="智能语音合成，多种音色可选"
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            delay={0.5}
            onClick={() => handleQuickAction('voice')}
          />
        </div>
      </motion.div>

      {/* Recent Projects */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">最近项目</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 pl-8 text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="overflow-hidden border-0 shadow-sm">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4">
                  <Skeleton className="mb-2 h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredProjects.map((project, idx) => (
                <ProjectCard
                  key={project.id}
                  project={project as any}
                  onOpen={() => handleOpenProject(project)}
                  onDelete={() => handleDeleteProject(project.id)}
                  delay={0.45 + idx * 0.05}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          searchQuery ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Search className="mb-3 size-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">没有找到匹配的项目</p>
              <p className="mt-1 text-xs text-slate-400">尝试使用其他关键词搜索</p>
            </div>
          ) : (
            <EmptyState onCreateNew={() => setCreateDialogOpen(true)} />
          )
        )}
      </motion.div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}
