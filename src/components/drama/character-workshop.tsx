'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Sparkles,
  Pencil,
  Trash2,
  User,
  Loader2,
  ImagePlus,
  Users,
  Clock,
  Mic,
  Heart,
  X,
} from 'lucide-react'
import { useDramaStore, type Character } from '@/store/drama-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

// ── Constants ──────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: '主角', label: '主角', color: 'bg-amber-500/15 text-amber-700 border-amber-200' },
  { value: '配角', label: '配角', color: 'bg-sky-500/15 text-sky-700 border-sky-200' },
  { value: '群演', label: '群演', color: 'bg-gray-500/15 text-gray-600 border-gray-200' },
]

const GENDER_OPTIONS = [
  { value: '男', label: '男' },
  { value: '女', label: '女' },
]

const VOICE_OPTIONS = [
  { value: 'tongtong', label: 'tongtong - 温暖亲切' },
  { value: 'chuichui', label: 'chuichui - 活泼可爱' },
  { value: 'xiaochen', label: 'xiaochen - 沉稳专业' },
  { value: 'jam', label: 'jam - 英音绅士' },
  { value: 'kazi', label: 'kazi - 清晰标准' },
  { value: 'douji', label: 'douji - 自然流畅' },
  { value: 'luodo', label: 'luodo - 富有感染力' },
]

const SAMPLE_CHARACTERS = [
  {
    name: '示例：都市女主',
    role: '主角',
    gender: '女',
    age: '26',
    appearance: '都市白领风格，长发飘飘，穿着时尚职业装',
    personality: '独立、聪慧、温柔',
    avatarUrl: '/images/char-sample-1.png',
    voiceType: 'tongtong',
  },
  {
    name: '示例：阳光男主',
    role: '主角',
    gender: '男',
    age: '28',
    appearance: '阳光帅气，短发，穿着休闲衬衫',
    personality: '开朗、幽默、有担当',
    avatarUrl: '/images/char-sample-2.png',
    voiceType: 'xiaochen',
  },
]

interface FormData {
  name: string
  role: string
  gender: string
  age: string
  appearance: string
  personality: string
  voiceType: string
  avatarUrl: string
}

const INITIAL_FORM: FormData = {
  name: '',
  role: '主角',
  gender: '女',
  age: '',
  appearance: '',
  personality: '',
  voiceType: 'tongtong',
  avatarUrl: '',
}

// ── Helper: Role badge styling ─────────────────────────────

function getRoleBadgeClass(role: string): string {
  const found = ROLE_OPTIONS.find((o) => o.value === role)
  return found?.color ?? 'bg-gray-500/15 text-gray-600 border-gray-200'
}

// ── Sub-components ─────────────────────────────────────────

function NoProjectSelected() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
        <Users className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-foreground">请先选择一个项目</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        选择一个项目后，即可开始创建和管理角色
      </p>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-12 text-center">
      <div className="mb-6 flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
          <Users className="h-8 w-8 text-violet-500" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          还没有角色，点击添加开始设计
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">
          为你的短剧创建独特的角色，使用AI生成精美头像
        </p>
        <Button onClick={onAdd} className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4" />
          添加角色
        </Button>
      </div>

      {/* Sample inspiration cards */}
      <div className="mt-8">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          灵感参考
        </p>
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {SAMPLE_CHARACTERS.map((sample, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30"
            >
              <div className="aspect-[3/4] w-full overflow-hidden">
                <img
                  src={sample.avatarUrl}
                  alt={sample.name}
                  className="h-full w-full object-cover opacity-60"
                />
              </div>
              <div className="p-3 text-left">
                <p className="text-sm font-medium text-muted-foreground">{sample.name}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">{sample.appearance}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface CharacterCardProps {
  character: Character
  onEdit: (c: Character) => void
  onDelete: (c: Character) => void
  onGenerateAvatar: (c: Character) => void
  isGeneratingAvatar: boolean
}

function CharacterCard({
  character,
  onEdit,
  onDelete,
  onGenerateAvatar,
  isGeneratingAvatar,
}: CharacterCardProps) {
  const isFemale = character.gender === '女'
  const genderAccent = isFemale ? 'from-pink-50 to-rose-50' : 'from-teal-50 to-cyan-50'
  const genderBorder = isFemale
    ? 'hover:border-pink-200'
    : 'hover:border-teal-200'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-colors duration-200 ${genderBorder}`}
    >
      {/* Avatar */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-b ${genderAccent}">
        {character.avatarUrl ? (
          <img
            src={character.avatarUrl}
            alt={character.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-b ${genderAccent}`}>
            <User className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Loading overlay for AI generation */}
        <AnimatePresence>
          {isGeneratingAvatar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-violet-400" />
              <span className="text-sm font-medium text-white">AI 生成中...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Role badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeClass(character.role)}`}
          >
            {character.role}
          </span>
        </div>

        {/* Gender badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
              isFemale
                ? 'border-pink-200 bg-pink-50/90 text-pink-600'
                : 'border-teal-200 bg-teal-50/90 text-teal-600'
            }`}
          >
            {character.gender}
          </span>
        </div>
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{character.name}</h3>
          {character.age && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {character.age}岁
            </span>
          )}
        </div>

        {/* Voice type */}
        {character.voiceType && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mic className="h-3 w-3" />
            <span>{VOICE_OPTIONS.find((v) => v.value === character.voiceType)?.label ?? character.voiceType}</span>
          </div>
        )}

        {/* Personality tags */}
        {character.personality && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {character.personality
              .split(/[、,，\n]/)
              .map((t) => t.trim())
              .filter(Boolean)
              .slice(0, 4)
              .map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className={`text-xs ${
                    isFemale
                      ? 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                      : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
                  }`}
                >
                  {tag}
                </Badge>
              ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 text-xs text-violet-600 hover:bg-violet-50 hover:text-violet-700"
            onClick={() => onGenerateAvatar(character)}
            disabled={isGeneratingAvatar}
          >
            {isGeneratingAvatar ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            AI生成头像
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => onEdit(character)}
          >
            <Pencil className="h-3 w-3" />
            编辑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(character)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Character Form Dialog ───────────────────────────────────

interface CharacterFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCharacter: Character | null
  isGeneratingAvatar: boolean
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  onSave: () => void
  onGenerateAvatar: () => void
  isSaving: boolean
}

function CharacterFormDialog({
  open,
  onOpenChange,
  editingCharacter,
  isGeneratingAvatar,
  formData,
  setFormData,
  onSave,
  onGenerateAvatar,
  isSaving,
}: CharacterFormDialogProps) {
  const isFemale = formData.gender === '女'
  const avatarGradient = isFemale
    ? 'from-pink-50 to-rose-50'
    : 'from-teal-50 to-cyan-50'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {editingCharacter ? (
              <>
                <Pencil className="h-5 w-5 text-violet-500" />
                编辑角色
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-violet-500" />
                添加角色
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {editingCharacter
              ? '修改角色的详细信息'
              : '创建一个新的短剧角色，可使用AI生成精美头像'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 py-4 md:grid-cols-[200px_1fr]">
          {/* Left: Avatar area */}
          <div className="flex flex-col items-center gap-3">
            <div
              className={`relative aspect-[3/4] w-full overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/20 bg-gradient-to-b ${avatarGradient}`}
            >
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt="角色头像"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <User className="h-10 w-10 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground/50">无头像</span>
                </div>
              )}

              {/* Loading overlay */}
              <AnimatePresence>
                {isGeneratingAvatar && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
                  >
                    <Loader2 className="mb-2 h-8 w-8 animate-spin text-violet-400" />
                    <span className="text-xs font-medium text-white">AI 生成中...</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-xs text-violet-600 hover:bg-violet-50 hover:text-violet-700"
              onClick={onGenerateAvatar}
              disabled={isGeneratingAvatar || !formData.appearance.trim()}
            >
              {isGeneratingAvatar ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI生成头像
            </Button>
            {!formData.appearance.trim() && (
              <p className="text-center text-[10px] text-muted-foreground">
                请先填写外貌描述
              </p>
            )}
          </div>

          {/* Right: Form fields */}
          <div className="flex flex-col gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="char-name" className="text-sm font-medium">
                角色名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="char-name"
                placeholder="例如：林晓薇"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Row: role + gender */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">角色类型</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, role: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">性别</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, gender: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Age */}
            <div className="space-y-1.5">
              <Label htmlFor="char-age" className="text-sm font-medium">
                年龄
              </Label>
              <Input
                id="char-age"
                placeholder="例如：26"
                type="text"
                value={formData.age}
                onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
              />
            </div>

            {/* Appearance */}
            <div className="space-y-1.5">
              <Label htmlFor="char-appearance" className="text-sm font-medium">
                外貌描述 <span className="text-[10px] text-muted-foreground">(也将用于AI头像生成)</span>
              </Label>
              <Textarea
                id="char-appearance"
                placeholder="描述角色的外貌特征，如：长发飘飘，眼神清澈，穿着白色连衣裙..."
                rows={3}
                value={formData.appearance}
                onChange={(e) => setFormData((prev) => ({ ...prev, appearance: e.target.value }))}
              />
            </div>

            {/* Personality */}
            <div className="space-y-1.5">
              <Label htmlFor="char-personality" className="text-sm font-medium">
                性格特点
              </Label>
              <Textarea
                id="char-personality"
                placeholder="描述角色的性格特点，可用顿号分隔，如：独立、聪慧、温柔"
                rows={2}
                value={formData.personality}
                onChange={(e) => setFormData((prev) => ({ ...prev, personality: e.target.value }))}
              />
            </div>

            {/* Voice type */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">配音音色</Label>
              <Select
                value={formData.voiceType}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, voiceType: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving || isGeneratingAvatar}
          >
            取消
          </Button>
          <Button
            onClick={onSave}
            disabled={
              isSaving ||
              isGeneratingAvatar ||
              !formData.name.trim()
            }
            className="gap-1.5 bg-violet-600 hover:bg-violet-700"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            {editingCharacter ? '保存修改' : '创建角色'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ──────────────────────────────────────────

export default function CharacterWorkshop() {
  const {
    currentProject,
    characters,
    setCharacters,
    addCharacter,
    updateCharacter,
    removeCharacter,
  } = useDramaStore()

  // UI state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [deletingCharacter, setDeletingCharacter] = useState<Character | null>(null)
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM })
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false)
  const [generatingForCardId, setGeneratingForCardId] = useState<string | null>(null)

  // Fetch characters when project changes
  useEffect(() => {
    if (currentProject) {
      fetchCharacters()
    }
  }, [currentProject])

  const fetchCharacters = async () => {
    if (!currentProject) return
    try {
      const res = await fetch(`/api/characters?projectId=${currentProject.id}`)
      const data = await res.json()
      if (data.success) {
        setCharacters(data.characters)
      }
    } catch {
      toast.error('获取角色列表失败')
    }
  }

  // ── Dialog handlers ──

  const openAddDialog = () => {
    setEditingCharacter(null)
    setFormData({ ...INITIAL_FORM })
    setDialogOpen(true)
  }

  const openEditDialog = (character: Character) => {
    setEditingCharacter(character)
    setFormData({
      name: character.name,
      role: character.role,
      gender: character.gender,
      age: character.age,
      appearance: character.appearance,
      personality: character.personality,
      voiceType: character.voiceType,
      avatarUrl: character.avatarUrl,
    })
    setDialogOpen(true)
  }

  // ── Save character ──

  const handleSave = async () => {
    if (!currentProject || !formData.name.trim()) return

    setIsSaving(true)
    try {
      if (editingCharacter) {
        // Update
        const res = await fetch('/api/characters', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCharacter.id,
            ...formData,
          }),
        })
        const data = await res.json()
        if (data.success) {
          updateCharacter(editingCharacter.id, data.character)
          toast.success('角色已更新')
        } else {
          toast.error(data.error || '更新失败')
        }
      } else {
        // Create
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: currentProject.id,
            ...formData,
          }),
        })
        const data = await res.json()
        if (data.success) {
          addCharacter(data.character)
          toast.success('角色已创建')
        } else {
          toast.error(data.error || '创建失败')
        }
      }
      setDialogOpen(false)
    } catch {
      toast.error('操作失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Delete character ──

  const handleDelete = async () => {
    if (!deletingCharacter) return
    try {
      const res = await fetch(`/api/characters?id=${deletingCharacter.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        removeCharacter(deletingCharacter.id)
        toast.success('角色已删除')
      } else {
        toast.error(data.error || '删除失败')
      }
    } catch {
      toast.error('删除失败，请重试')
    } finally {
      setDeletingCharacter(null)
    }
  }

  // ── Generate avatar ──

  const generateAvatar = async (prompt: string, targetId?: string) => {
    if (!prompt.trim()) {
      toast.error('请先填写外貌描述')
      return null
    }

    setIsGeneratingAvatar(true)
    if (targetId) setGeneratingForCardId(targetId)

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'character' }),
      })
      const data = await res.json()
      if (data.success) {
        return data.imageUrl
      } else {
        toast.error(data.error || '生成失败')
        return null
      }
    } catch {
      toast.error('AI头像生成失败')
      return null
    } finally {
      setIsGeneratingAvatar(false)
      setGeneratingForCardId(null)
    }
  }

  // Generate from dialog
  const handleGenerateAvatarInDialog = async () => {
    const imageUrl = await generateAvatar(formData.appearance)
    if (imageUrl) {
      setFormData((prev) => ({ ...prev, avatarUrl }))
      toast.success('头像已生成')
    }
  }

  // Generate from card
  const handleGenerateAvatarForCard = async (character: Character) => {
    const imageUrl = await generateAvatar(character.appearance, character.id)
    if (imageUrl) {
      updateCharacter(character.id, { avatarUrl: imageUrl })
      // Also persist to server
      try {
        await fetch('/api/characters', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: character.id, avatarUrl: imageUrl }),
        })
      } catch {
        // Best effort persist
      }
      toast.success('头像已生成')
    }
  }

  // ── Render ──

  if (!currentProject) {
    return <NoProjectSelected />
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b bg-card px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Users className="h-6 w-6 text-violet-500" />
            角色工坊
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            设计你的短剧角色，AI帮你生成精美头像和配音
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          添加角色
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {characters.length === 0 ? (
          <EmptyState onAdd={openAddDialog} />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onEdit={openEditDialog}
                  onDelete={setDeletingCharacter}
                  onGenerateAvatar={handleGenerateAvatarForCard}
                  isGeneratingAvatar={generatingForCardId === character.id}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <CharacterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCharacter={editingCharacter}
        isGeneratingAvatar={isGeneratingAvatar}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        onGenerateAvatar={handleGenerateAvatarInDialog}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCharacter}
        onOpenChange={(open) => {
          if (!open) setDeletingCharacter(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除角色</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除角色「{deletingCharacter?.name}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
