'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  LayoutDashboard,
  FileText,
  Users,
  Film,
  Mic,
  Video,
  Clock,
  BookOpen,
  Lightbulb,
  Sparkles,
  ImageIcon,
  Volume2,
  Clapperboard,
  ArrowRight,
  Cpu,
  Palette,
  Wand2,
  Zap,
  MessageCircle,
  HelpCircle,
  Brain,
  Globe,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ──────────────────────────────────────────────────
interface UsageGuideProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

// ─── Data ───────────────────────────────────────────────────
const workflowSteps = [
  {
    number: 1,
    name: '项目仪表板',
    icon: LayoutDashboard,
    description: '创建和管理短剧项目',
    color: 'slate',
    borderClass: 'border-l-slate-400',
    bgClass: 'bg-gradient-to-br from-slate-400 to-slate-500',
    numberBg: 'bg-gradient-to-br from-slate-400 to-slate-500',
  },
  {
    number: 2,
    name: '剧本工作室',
    icon: FileText,
    description: 'AI辅助剧本创作与编辑',
    color: 'violet',
    borderClass: 'border-l-violet-500',
    bgClass: 'bg-gradient-to-br from-violet-500 to-purple-600',
    numberBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
  },
  {
    number: 3,
    name: '角色工坊',
    icon: Users,
    description: '创建角色并生成AI头像',
    color: 'fuchsia',
    borderClass: 'border-l-fuchsia-500',
    bgClass: 'bg-gradient-to-br from-fuchsia-500 to-pink-600',
    numberBg: 'bg-gradient-to-br from-fuchsia-500 to-pink-600',
  },
  {
    number: 4,
    name: '分镜设计',
    icon: Film,
    description: '设计场景并生成AI画面',
    color: 'amber',
    borderClass: 'border-l-amber-500',
    bgClass: 'bg-gradient-to-br from-amber-500 to-orange-500',
    numberBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
  },
  {
    number: 5,
    name: '配音工作室',
    icon: Mic,
    description: '智能语音合成与配音',
    color: 'teal',
    borderClass: 'border-l-teal-500',
    bgClass: 'bg-gradient-to-br from-teal-500 to-emerald-500',
    numberBg: 'bg-gradient-to-br from-teal-500 to-emerald-500',
  },
  {
    number: 6,
    name: '视频工厂',
    icon: Video,
    description: 'AI视频生成与批量制作',
    color: 'orange',
    borderClass: 'border-l-orange-500',
    bgClass: 'bg-gradient-to-br from-orange-500 to-red-500',
    numberBg: 'bg-gradient-to-br from-orange-500 to-red-500',
  },
  {
    number: 7,
    name: '时间线',
    icon: Clock,
    description: '预览播放与数据导出',
    color: 'rose',
    borderClass: 'border-l-rose-500',
    bgClass: 'bg-gradient-to-br from-rose-500 to-pink-500',
    numberBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
  },
]

const moduleDetails = [
  {
    name: '项目仪表板',
    icon: LayoutDashboard,
    borderClass: 'border-l-slate-400',
    iconBg: 'bg-slate-100 text-slate-600',
    description: '管理所有短剧项目的核心入口。你可以在此创建新项目、查看项目列表、搜索已有项目，或删除不需要的项目。',
    steps: [
      '点击右上角「创建新项目」按钮',
      '填写项目名称、选择题材类型、添加简介',
      '点击项目卡片即可进入项目并开始创作',
      '使用搜索栏快速找到已有项目',
    ],
  },
  {
    name: '剧本工作室',
    icon: FileText,
    borderClass: 'border-l-violet-500',
    iconBg: 'bg-violet-100 text-violet-600',
    description: 'AI辅助剧本创作工具，提供5种智能创作模式。从创意构思到完整剧本，从场景拆分到优化润色，AI全程辅助你的创作过程。',
    steps: [
      '选择创作模式（创意构思/剧本生成/场景拆分/优化润色/自由写作）',
      '在左侧输入创作需求和描述',
      'AI生成内容后，可在右侧编辑区自由修改',
      '满意后内容会自动保存',
    ],
  },
  {
    name: '角色工坊',
    icon: Users,
    borderClass: 'border-l-fuchsia-500',
    iconBg: 'bg-fuchsia-100 text-fuchsia-600',
    description: '创建和管理短剧角色，并为角色生成AI头像。支持设置角色外貌描述、选择配音音色，为后续的分镜和配音做好准备。',
    steps: [
      '点击「添加角色」填写角色信息',
      '输入角色外貌描述（年龄、发型、穿着等）',
      '点击「AI生成头像」自动生成角色形象',
      '选择该角色的默认配音音色',
    ],
  },
  {
    name: '分镜设计',
    icon: Film,
    borderClass: 'border-l-amber-500',
    iconBg: 'bg-amber-100 text-amber-600',
    description: '专业的分镜设计工作台。可从剧本自动导入场景，或手动添加。为每个场景生成AI画面，通过胶片条快速切换浏览。',
    steps: [
      '选择「从剧本导入」自动拆分场景，或手动添加',
      '编辑场景描述（地点、氛围、人物动作等）',
      '点击「生成画面」AI自动生成分镜图',
      '使用底部胶片条切换不同场景',
    ],
  },
  {
    name: '配音工作室',
    icon: Mic,
    borderClass: 'border-l-teal-500',
    iconBg: 'bg-teal-100 text-teal-600',
    description: '为有对话的场景分配角色和音色，生成专业配音。支持7种中文音色，可单独试听或批量生成所有场景配音。',
    steps: [
      '在场景列表中找到有对话的场景',
      '为每句对话分配对应的角色和音色',
      '点击「试听」预览单个场景配音效果',
      '使用「批量生成」一键完成所有场景配音',
    ],
  },
  {
    name: '视频工厂',
    icon: Video,
    borderClass: 'border-l-orange-500',
    iconBg: 'bg-orange-100 text-orange-600',
    description: 'AI视频生成中心。选择场景并生成对应的AI视频，支持文本转视频和图片转视频两种模式，可快速批量生成。',
    steps: [
      '选择要生成视频的场景',
      '选择模式（文本转视频/图片转视频）',
      '设置视频时长和质量模式',
      '点击「生成视频」等待AI制作完成',
    ],
  },
  {
    name: '时间线',
    icon: Clock,
    borderClass: 'border-l-rose-500',
    iconBg: 'bg-rose-100 text-rose-600',
    description: '项目最终呈现和预览的模块。汇总所有素材（剧本、角色、场景图片、配音、视频），提供完整的播放预览和数据导出功能。',
    steps: [
      '在时间轴上查看所有场景和素材',
      '点击「播放」预览完整短剧',
      '切换「自动播放」模式查看连续效果',
      '点击「导出项目」下载完整数据文件',
    ],
  },
]

const aiCapabilities = [
  {
    icon: Brain,
    emoji: '📝',
    title: 'AI 剧本创作',
    description: '基于大语言模型，提供创意构思、剧本生成、场景拆分、优化润色等全流程AI辅助创作能力，深度理解剧情结构与人物关系。',
    tech: '大语言模型',
    techColor: 'bg-violet-100 text-violet-700',
  },
  {
    icon: Palette,
    emoji: '🎭',
    title: 'AI 角色生成',
    description: '输入外貌描述即可自动生成高质量角色肖像。支持多种艺术风格，为你的短剧角色打造独特的视觉形象。',
    tech: '图像生成',
    techColor: 'bg-fuchsia-100 text-fuchsia-700',
  },
  {
    icon: Layers,
    emoji: '🎬',
    title: 'AI 场景生成',
    description: '根据场景描述生成16:9比例的分镜画面。支持时间段、氛围、景别等精细控制，让每一帧都符合你的创作构想。',
    tech: '图像生成',
    techColor: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Volume2,
    emoji: '🎙️',
    title: 'AI 配音合成',
    description: '提供7种优质中文音色，支持语速调节(0.5x-2.0x)。可批量生成所有场景配音，让角色真正「说话」。',
    tech: '语音合成',
    techColor: 'bg-teal-100 text-teal-700',
  },
  {
    icon: Clapperboard,
    emoji: '🎥',
    title: 'AI 视频合成',
    description: '支持文本直接转视频或图片转视频两种模式。提供快速和高质量两种生成模式，5秒/10秒时长可选，满足不同制作需求。',
    tech: '视频生成',
    techColor: 'bg-orange-100 text-orange-700',
  },
]

const faqItems = [
  {
    question: '如何创建第一个短剧项目？',
    answer: '在项目仪表板页面，点击右上角的「创建新项目」按钮，填写项目名称、选择题材类型并添加简介，然后点击创建即可。创建成功后，点击项目卡片即可进入项目开始创作。',
  },
  {
    question: 'AI生成的剧本可以修改吗？',
    answer: '当然可以！剧本工作室的右侧是可编辑区域，你可以自由修改AI生成的任何内容。无论是调整台词、修改场景描述还是重新组织剧情结构，都可以手动编辑。',
  },
  {
    question: '如何给角色配音？',
    answer: '首先在「角色工坊」中创建角色并选择默认音色，然后进入「配音工作室」。在场景列表中，为每句对话分配对应的角色和音色，点击「试听」预览效果，满意后可「批量生成」所有场景的配音。',
  },
  {
    question: '视频生成需要多长时间？',
    answer: '快速模式约需1-3分钟，高质量模式约需3-5分钟。生成过程中可在视频工厂页面查看实时进度。建议先使用快速模式预览效果，满意后再选择高质量模式生成最终版本。',
  },
  {
    question: '可以修改已生成的场景图片吗？',
    answer: '可以。在分镜设计中选中需要修改的场景，修改场景描述后点击「重新生成」即可。你也可以微调描述文字来引导AI生成不同风格的画面，直到满意为止。',
  },
  {
    question: '如何导出项目数据？',
    answer: '进入「时间线」模块，点击页面上的「导出项目」按钮，系统会自动打包所有项目数据（包括剧本、角色、场景、配音、视频等）为JSON文件并下载到本地。',
  },
]

// ─── Tab 1: Quick Start ─────────────────────────────────────
function QuickStartTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900">创作流程一览</h3>
        <p className="mt-1 text-sm text-slate-500">从创意到成片，只需7步</p>
      </div>

      {/* Workflow Steps Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {workflowSteps.map((step, idx) => {
          const Icon = step.icon
          return (
            <div
              key={step.number}
              className={cn(
                'relative flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm',
                'border-l-4',
                step.borderClass,
              )}
            >
              {/* Step Number */}
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm',
                  step.numberBg,
                )}
              >
                {step.number}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-slate-500" />
                  <h4 className="text-sm font-bold text-slate-900">{step.name}</h4>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
              </div>

              {/* Arrow between steps (visible on non-last items) */}
              {idx < workflowSteps.length - 1 && idx % 2 === 0 && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden sm:block">
                  <ArrowRight className="size-4 text-slate-300" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Tips Section */}
      <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100">
            <Lightbulb className="size-4 text-amber-600" />
          </div>
          <h4 className="text-sm font-bold text-amber-900">💡 小提示</h4>
        </div>
        <ul className="space-y-2.5">
          {[
            '点击项目卡片任意位置即可进入项目，无需额外操作',
            '左侧导航栏可在各模块间自由切换，支持收起/展开',
            '所有AI生成的内容都可以重新生成，直到满意为止',
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-amber-800">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-200/60 text-[10px] font-bold text-amber-700">
                {i + 1}
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Tab 2: Module Details ──────────────────────────────────
function ModuleDetailsTab() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900">模块功能详解</h3>
        <p className="mt-1 text-sm text-slate-500">了解每个模块的核心功能与操作方式</p>
      </div>

      <div className="space-y-3">
        {moduleDetails.map((module, idx) => {
          const Icon = module.icon
          return (
            <div key={idx}>
              <div className={cn(
                'rounded-xl border border-slate-100 bg-white p-5 shadow-sm border-l-4',
                module.borderClass,
              )}>
                {/* Module Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('flex size-9 items-center justify-center rounded-lg', module.iconBg)}>
                    <Icon className="size-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{module.name}</h4>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">功能说明</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{module.description}</p>
                </div>

                <Separator className="my-3 bg-slate-100" />

                {/* Steps */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">操作指南</p>
                  <ol className="space-y-1.5">
                    {module.steps.map((step, stepIdx) => (
                      <li key={stepIdx} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 mt-0.5">
                          {stepIdx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab 3: AI Capabilities ─────────────────────────────────
function AICapabilitiesTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900">AI 核心能力</h3>
        <p className="mt-1 text-sm text-slate-500">强大的AI技术为你的创作赋能</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {aiCapabilities.map((cap, idx) => {
          const Icon = cap.icon
          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              {/* Emoji + Icon */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{cap.emoji}</span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100">
                  <Icon className="size-4 text-violet-600" />
                </div>
              </div>

              {/* Title */}
              <h4 className="text-sm font-bold text-slate-900 mb-2">{cap.title}</h4>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{cap.description}</p>

              {/* Tech Badge */}
              <div className="flex items-center gap-2">
                <Cpu className="size-3 text-slate-400" />
                <Badge variant="secondary" className={cn('text-[10px] font-medium px-2 py-0.5', cap.techColor)}>
                  {cap.tech}
                </Badge>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200/60 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="size-4 text-violet-600" />
          <h4 className="text-sm font-bold text-violet-900">全流程AI赋能</h4>
        </div>
        <p className="text-xs text-violet-700 leading-relaxed">
          DramaAI 整合了先进的大语言模型、图像生成、语音合成和视频生成技术，覆盖短剧创作的每一个环节。从创意到成片，AI全程为你保驾护航，让专业级短剧制作触手可及。
        </p>
      </div>
    </div>
  )
}

// ─── Tab 4: FAQ ─────────────────────────────────────────────
function FAQTab() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-900">常见问题</h3>
        <p className="mt-1 text-sm text-slate-500">快速找到你需要的答案</p>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqItems.map((item, idx) => (
          <AccordionItem
            key={idx}
            value={`faq-${idx}`}
            className="rounded-xl border border-slate-100 bg-white px-4 shadow-sm data-[state=open]:shadow-md transition-shadow"
          >
            <AccordionTrigger className="text-sm font-bold text-slate-900 hover:text-violet-600 hover:no-underline py-4">
              <div className="flex items-center gap-2 text-left">
                <HelpCircle className="size-4 shrink-0 text-violet-400" />
                <span>{item.question}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600 leading-relaxed pb-4 pl-6">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Contact Section */}
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
        <MessageCircle className="mx-auto size-6 text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-600">没有找到答案？</p>
        <p className="mt-1 text-xs text-slate-400">
          请查看各模块内的提示信息，或参考界面上的引导说明
        </p>
      </div>
    </div>
  )
}

// ─── Main UsageGuide Component ──────────────────────────────
export function UsageGuide({ open, onOpenChange }: UsageGuideProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 max-h-[85vh] overflow-hidden">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <BookOpen className="size-4 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg">使用指南</DialogTitle>
              <DialogDescription className="text-xs">
                了解 DramaAI 平台的功能和使用方法
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="quick-start" className="mt-4">
          <div className="border-b border-slate-100 px-6">
            <TabsList className="h-auto w-full justify-start rounded-none bg-transparent p-0">
              <TabsTrigger
                value="quick-start"
                className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 data-[state=active]:shadow-none"
              >
                <Zap className="mr-1.5 size-3.5" />
                快速入门
              </TabsTrigger>
              <TabsTrigger
                value="modules"
                className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 data-[state=active]:shadow-none"
              >
                <Layers className="mr-1.5 size-3.5" />
                模块详解
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 data-[state=active]:shadow-none"
              >
                <Sparkles className="mr-1.5 size-3.5" />
                AI 能力
              </TabsTrigger>
              <TabsTrigger
                value="faq"
                className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 data-[state=active]:border-violet-500 data-[state=active]:text-violet-600 data-[state=active]:shadow-none"
              >
                <HelpCircle className="mr-1.5 size-3.5" />
                常见问题
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="h-[calc(85vh-140px)]">
            <div className="px-6 py-5">
              <TabsContent value="quick-start" className="mt-0">
                <QuickStartTab />
              </TabsContent>
              <TabsContent value="modules" className="mt-0">
                <ModuleDetailsTab />
              </TabsContent>
              <TabsContent value="ai" className="mt-0">
                <AICapabilitiesTab />
              </TabsContent>
              <TabsContent value="faq" className="mt-0">
                <FAQTab />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
