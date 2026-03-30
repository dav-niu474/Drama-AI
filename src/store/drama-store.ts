import { create } from 'zustand'

// 工作流步骤定义
export type WorkflowStep = 
  | 'dashboard'
  | 'script'
  | 'characters'
  | 'storyboard'
  | 'voice'
  | 'video'
  | 'timeline'

export interface DramaProject {
  id: string
  name: string
  genre: string
  description: string
  coverImage: string
  status: string
  createdAt: string
  updatedAt: string
  _count?: { characters: number; scenes: number; episodes: number }
}

export interface Character {
  id: string
  projectId: string
  name: string
  role: string
  gender: string
  age: string
  appearance: string
  personality: string
  avatarUrl: string
  voiceType: string
}

export interface DramaScene {
  id: string
  projectId: string
  episodeId: string | null
  title: string
  description: string
  dialogue: string
  location: string
  timeOfDay: string
  mood: string
  cameraAngle: string
  imageUrl: string
  videoUrl: string
  audioUrl: string
  sortOrder: number
  duration: number
}

export interface Episode {
  id: string
  projectId: string
  title: string
  episodeNo: number
  synopsis: string
  script: string
}

interface DramaStore {
  // 工作流
  currentStep: WorkflowStep
  setCurrentStep: (step: WorkflowStep) => void
  
  // 项目
  projects: DramaProject[]
  currentProject: DramaProject | null
  setProjects: (projects: DramaProject[]) => void
  setCurrentProject: (project: DramaProject | null) => void
  removeProject: (id: string) => void
  
  // 角色
  characters: Character[]
  setCharacters: (characters: Character[]) => void
  addCharacter: (character: Character) => void
  updateCharacter: (id: string, data: Partial<Character>) => void
  removeCharacter: (id: string) => void
  
  // 场景
  scenes: DramaScene[]
  setScenes: (scenes: DramaScene[]) => void
  addScene: (scene: DramaScene) => void
  updateScene: (id: string, data: Partial<DramaScene>) => void
  removeScene: (id: string) => void
  reorderScenes: (scenes: DramaScene[]) => void
  
  // 剧集
  episodes: Episode[]
  setEpisodes: (episodes: Episode[]) => void
  
  // 生成状态
  isGenerating: boolean
  generatingStep: string
  setIsGenerating: (val: boolean) => void
  setGeneratingStep: (step: string) => void
  
  // 对话状态
  scriptMessages: Array<{role: string; content: string}>
  addScriptMessage: (message: {role: string; content: string}) => void
  clearScriptMessages: () => void
  
  // 切换项目（自动清除旧数据）
  openProject: (project: DramaProject, step?: WorkflowStep) => void
  
  // 返回仪表板（保留项目上下文）
  backToDashboard: () => void
  
  // 重置
  resetProjectData: () => void
}

export const useDramaStore = create<DramaStore>((set, get) => ({
  // 工作流
  currentStep: 'dashboard',
  setCurrentStep: (step) => set({ currentStep: step }),
  
  // 项目
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id),
    currentProject: state.currentProject?.id === id ? null : state.currentProject,
  })),
  
  // 角色
  characters: [],
  setCharacters: (characters) => set({ characters }),
  addCharacter: (character) => set((state) => ({ characters: [...state.characters, character] })),
  updateCharacter: (id, data) => set((state) => ({
    characters: state.characters.map(c => c.id === id ? { ...c, ...data } : c)
  })),
  removeCharacter: (id) => set((state) => ({
    characters: state.characters.filter(c => c.id !== id)
  })),
  
  // 场景
  scenes: [],
  setScenes: (scenes) => set({ scenes }),
  addScene: (scene) => set((state) => ({ scenes: [...state.scenes, scene] })),
  updateScene: (id, data) => set((state) => ({
    scenes: state.scenes.map(s => s.id === id ? { ...s, ...data } : s)
  })),
  removeScene: (id) => set((state) => ({
    scenes: state.scenes.filter(s => s.id !== id)
  })),
  reorderScenes: (scenes) => set({ scenes }),
  
  // 剧集
  episodes: [],
  setEpisodes: (episodes) => set({ episodes }),
  
  // 生成状态
  isGenerating: false,
  generatingStep: '',
  setIsGenerating: (val) => set({ isGenerating: val }),
  setGeneratingStep: (step) => set({ generatingStep: step }),
  
  // 对话
  scriptMessages: [],
  addScriptMessage: (message) => set((state) => ({
    scriptMessages: [...state.scriptMessages, message]
  })),
  clearScriptMessages: () => set({ scriptMessages: [] }),
  
  // 打开项目 —— 清除旧数据，设置新项目，跳转
  openProject: (project, step = 'script') => set({
    currentProject: project,
    currentStep: step,
    characters: [],
    scenes: [],
    episodes: [],
    scriptMessages: [],
  }),
  
  // 返回仪表板 —— 保留项目，不清除数据
  backToDashboard: () => set({ currentStep: 'dashboard' }),
  
  // 完全重置
  resetProjectData: () => set({
    characters: [],
    scenes: [],
    episodes: [],
    scriptMessages: [],
    currentProject: null,
    currentStep: 'dashboard'
  })
}))
