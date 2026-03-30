'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Users,
  Film,
  Mic,
  Video,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'
import { UsageGuide } from '@/components/drama/usage-guide'
import { cn } from '@/lib/utils'
import { useDramaStore, type WorkflowStep } from '@/store/drama-store'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavItem {
  step: WorkflowStep
  label: string
  icon: React.ElementType
  description: string
}

const navItems: NavItem[] = [
  { step: 'dashboard', label: '项目仪表板', icon: LayoutDashboard, description: '管理你的短剧项目' },
  { step: 'script', label: '剧本工作室', icon: FileText, description: 'AI辅助剧本创作' },
  { step: 'characters', label: '角色工坊', icon: Users, description: '创建和管理角色' },
  { step: 'storyboard', label: '分镜设计', icon: Film, description: '设计故事分镜' },
  { step: 'voice', label: '配音工作室', icon: Mic, description: 'AI智能配音' },
  { step: 'video', label: '视频工厂', icon: Video, description: '生成短剧视频' },
  { step: 'timeline', label: '时间线', icon: Clock, description: '项目时间线管理' },
]

const workflowSteps = ['script', 'characters', 'storyboard', 'voice', 'video', 'timeline'] as const

function getStepProgress(step: WorkflowStep): number {
  const idx = workflowSteps.indexOf(step as typeof workflowSteps[number])
  return idx >= 0 ? Math.round(((idx + 1) / workflowSteps.length) * 100) : 0
}

// ─── Desktop Sidebar ────────────────────────────────────────
function SidebarNav({ collapsed, onNavigate, onGuideClick }: { collapsed: boolean; onNavigate?: () => void; onGuideClick?: () => void }) {
  const { currentStep, setCurrentStep, currentProject } = useDramaStore()

  const progress = currentProject ? getStepProgress(currentStep) : 0

  const handleNavClick = (step: WorkflowStep) => {
    setCurrentStep(step)
    onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
          <Sparkles className="size-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-lg font-bold tracking-tight text-white">
                Drama<span className="text-violet-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400">AI短剧创作平台</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Progress */}
      {currentProject && (
        <div className={cn('px-4 pt-4 pb-2', collapsed && 'px-2')}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1">
                  <div className="relative flex size-8 items-center justify-center">
                    <svg className="size-8 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#grad)" strokeWidth="2.5" strokeDasharray={`${progress} ${100 - progress}`} strokeLinecap="round" />
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#d946ef" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute text-[9px] font-bold text-white">{progress}%</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>项目进度: {progress}%</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">项目进度</span>
                <span className="text-xs font-bold text-violet-400">{progress}%</span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-700/50">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = currentStep === item.step
            const Icon = item.icon
            const isCompleted = currentProject && workflowSteps.includes(item.step as typeof workflowSteps[number])
              ? workflowSteps.indexOf(item.step as typeof workflowSteps[number]) < workflowSteps.indexOf(currentStep as typeof workflowSteps[number])
              : false

            const navButton = (
              <button
                key={item.step}
                onClick={() => handleNavClick(item.step)}
                className={cn(
                  'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200',
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-500 to-fuchsia-500"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <div className="relative flex size-7 shrink-0 items-center justify-center">
                  <Icon
                    className={cn(
                      'size-[18px] transition-colors',
                      isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300',
                    )}
                  />
                  {isCompleted && (
                    <CheckCircle2 className="absolute -right-1 -top-1 size-3.5 text-emerald-400" />
                  )}
                </div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      <span className={cn(isActive && 'text-white')}>{item.label}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.step}>
                  <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                    <p className="text-xs opacity-70">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return navButton
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-slate-700/50" />

      {/* Usage Guide Button */}
      <div className="px-3 py-2">
        <button
          onClick={onGuideClick}
          className={cn(
            'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-slate-800/60 hover:text-slate-200',
            collapsed && 'justify-center px-2'
          )}
        >
          <BookOpen className="size-[18px]" />
          {!collapsed && <span>使用指南</span>}
        </button>
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Current Project */}
      <div className={cn('p-3', collapsed && 'flex justify-center')}>
        {currentProject ? (
          collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex size-9 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-violet-400">
                  {currentProject.name.charAt(0)}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{currentProject.name}</p>
                <p className="text-xs opacity-70">{currentProject.genre}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-slate-800/50 p-3"
            >
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">当前项目</p>
              <p className="mt-1 truncate text-sm font-semibold text-white">{currentProject.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                  {currentProject.genre}
                </span>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium',
                  currentProject.status === 'completed' && 'bg-emerald-500/20 text-emerald-400',
                  currentProject.status === 'producing' && 'bg-amber-500/20 text-amber-400',
                  currentProject.status === 'draft' && 'bg-slate-500/20 text-slate-400',
                  currentProject.status === 'writing' && 'bg-sky-500/20 text-sky-400',
                  currentProject.status === 'designing' && 'bg-purple-500/20 text-purple-400',
                )}>
                  {currentProject.status === 'draft' ? '草稿' :
                   currentProject.status === 'writing' ? '创作中' :
                   currentProject.status === 'designing' ? '设计中' :
                   currentProject.status === 'producing' ? '制作中' : '已完成'}
                </span>
              </div>
            </motion.div>
          )
        ) : (
          !collapsed && (
            <p className="text-center text-xs text-slate-500">未选择项目</p>
          )
        )}
      </div>
    </div>
  )
}

// ─── Mobile Sidebar (Sheet) ─────────────────────────────────
function MobileSidebar() {
  const { currentStep, setCurrentStep, currentProject } = useDramaStore()
  const [open, setOpen] = useState(false)

  const progress = currentProject ? getStepProgress(currentStep) : 0

  const handleNavigate = (step: WorkflowStep) => {
    setCurrentStep(step)
    setOpen(false) // 关闭移动端抽屉
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-50 rounded-lg bg-white/80 shadow-sm backdrop-blur-sm md:hidden"
        >
          <LayoutDashboard className="size-5 text-slate-700" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-slate-900 p-0">
        <SheetTitle className="sr-only">导航菜单</SheetTitle>
        <SidebarNav collapsed={false} onNavigate={() => setOpen(false)} onGuideClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Sidebar Export ─────────────────────────────────────
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  return (
    <>
      {/* Mobile */}
      <MobileSidebar />

      {/* Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-slate-700/50 bg-slate-900 md:flex"
      >
        <SidebarNav collapsed={collapsed} onGuideClick={() => setGuideOpen(true)} />

        {/* Collapse toggle */}
        <div className="absolute -right-3 top-20 z-50 hidden md:block">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="size-6 rounded-full border-slate-600 bg-slate-800 text-slate-400 shadow-md hover:bg-slate-700 hover:text-white"
          >
            {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
          </Button>
        </div>
      </motion.aside>

      {/* Usage Guide Dialog */}
      <UsageGuide open={guideOpen} onOpenChange={setGuideOpen} />
    </>
  )
}
