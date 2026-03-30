'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, LayoutDashboard, FileText, Users, Film, Mic, Video, Clock, Moon, Sparkles, Sun, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDramaStore, type WorkflowStep } from '@/store/drama-store'
import { Sidebar } from '@/components/drama/sidebar'
import { Dashboard } from '@/components/drama/dashboard'
import ScriptStudio from '@/components/drama/script-studio'
import CharacterWorkshop from '@/components/drama/character-workshop'
import { VideoFactory } from '@/components/drama/video-factory'
import VoiceStudio from '@/components/drama/voice-studio'
import { TimelinePreview } from '@/components/drama/timeline-preview'
import { StoryboardDesigner } from '@/components/drama/storyboard-designer'
import { ModelConfigPage } from '@/components/drama/model-config-page'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ─── Step title mapping ─────────────────────────────────────
const stepTitles: Record<WorkflowStep, string> = {
  dashboard: '项目仪表板',
  script: '剧本工作室',
  characters: '角色工坊',
  storyboard: '分镜设计',
  voice: '配音工作室',
  video: '视频工厂',
  timeline: '时间线',
  config: '模型配置',
}

const stepIcons: Record<WorkflowStep, React.ElementType> = {
  dashboard: LayoutDashboard,
  script: FileText,
  characters: Users,
  storyboard: Film,
  voice: Mic,
  video: Video,
  timeline: Clock,
  config: Settings2,
}

// ─── Page Transitions ───────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}
// ─── Main Page ──────────────────────────────────────────────
export default function Home() {
  const { currentStep, currentProject, backToDashboard } = useDramaStore()
  const [isDark, setIsDark] = useState(false)
  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const StepIcon = stepIcons[currentStep]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900">
            Drama<span className="text-violet-500">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8" onClick={toggleTheme}>
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4 text-slate-600" />}
          </Button>
          <Button variant="ghost" size="icon" className="relative size-8">
            <Bell className="size-4 text-slate-600" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-violet-500" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="transition-all duration-300 md:pl-60">
        {/* Desktop top bar */}
        <header className="sticky top-0 z-30 hidden h-14 items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-xl md:flex">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex size-8 items-center justify-center rounded-lg',
              currentStep === 'dashboard'
                ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
                : 'bg-slate-100',
            )}>
              <StepIcon className={cn(
                'size-4',
                currentStep === 'dashboard' ? 'text-white' : 'text-slate-500',
              )} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{stepTitles[currentStep]}</h2>
              {currentProject && (
                <p className="text-[11px] text-slate-400">{currentProject.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentProject && currentStep !== 'dashboard' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => backToDashboard()}
                className="text-xs text-slate-500"
              >
                ← 返回仪表板
              </Button>
            )}
            <Separator orientation="vertical" className="mx-1 h-5" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" onClick={toggleTheme}>
                  {isDark ? <Sun className="size-4" /> : <Moon className="size-4 text-slate-500" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isDark ? '切换到亮色模式' : '切换到暗色模式'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative size-8">
                  <Bell className="size-4 text-slate-500" />
                  <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-violet-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>通知</TooltipContent>
            </Tooltip>
            <div className="ml-1 flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-bold text-white">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {currentStep === 'dashboard' && <Dashboard />}
              {currentStep === 'script' && <ScriptStudio />}
              {currentStep === 'characters' && <CharacterWorkshop />}
              {currentStep === 'storyboard' && <StoryboardDesigner />}
              {currentStep === 'voice' && <VoiceStudio />}
              {currentStep === 'video' && <VideoFactory />}
              {currentStep === 'timeline' && <TimelinePreview />}
              {currentStep === 'config' && <ModelConfigPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
