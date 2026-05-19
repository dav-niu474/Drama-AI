/**
 * DramaAI - 共享常量定义
 * 避免在多个组件中重复定义相同的常量，确保数据一致性
 */

// ── 语音类型选项 ──────────────────────────────────────────
export const VOICE_OPTIONS = [
  { value: 'tongtong', label: 'tongtong', desc: '温暖亲切', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'chuichui', label: 'chuichui', desc: '活泼可爱', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'xiaochen', label: 'xiaochen', desc: '沉稳专业', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'jam', label: 'jam', desc: '英音绅士', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'kazi', label: 'kazi', desc: '清晰标准', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { value: 'douji', label: 'douji', desc: '自然流畅', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'luodo', label: 'luodo', desc: '富有感染力', color: 'bg-violet-100 text-violet-700 border-violet-200' },
] as const

export type VoiceType = (typeof VOICE_OPTIONS)[number]['value']

/** 获取语音信息，找不到时返回第一个（tongtong） */
export function getVoiceInfo(voiceType: string) {
  return VOICE_OPTIONS.find((v) => v.value === voiceType) ?? VOICE_OPTIONS[0]
}

/** 获取语音显示标签，格式: "name - 描述" */
export function getVoiceLabel(voiceType: string) {
  const info = getVoiceInfo(voiceType)
  return `${info.label} - ${info.desc}`
}
