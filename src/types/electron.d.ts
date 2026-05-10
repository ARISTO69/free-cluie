export interface ElectronAPI {
  updateContentDimensions: (dimensions: {
    width: number
    height: number
  }) => Promise<void>
  getScreenshots: () => Promise<Array<{ path: string; preview: string }>>
  deleteScreenshot: (path: string) => Promise<{ success: boolean; error?: string }>
  onScreenshotTaken: (callback: (data: { path: string; preview: string }) => void) => () => void
  onSolutionsReady: (callback: (solutions: string) => void) => () => void
  onResetView: (callback: () => void) => () => void
  onSolutionStart: (callback: () => void) => () => void
  onDebugStart: (callback: () => void) => () => void
  onDebugSuccess: (callback: (data: any) => void) => () => void
  onSolutionError: (callback: (error: string) => void) => () => void
  onProcessingNoScreenshots: (callback: () => void) => () => void
  onProblemExtracted: (callback: (data: any) => void) => () => void
  onSolutionSuccess: (callback: (data: any) => void) => () => void
  onUnauthorized: (callback: () => void) => () => void
  onDebugError: (callback: (error: string) => void) => () => void
  takeScreenshot: () => Promise<void>
  takeAreaScreenshot: () => Promise<{ path: string; preview: string }>
  toggleWindow: () => Promise<void>
  moveWindowLeft: () => Promise<void>
  moveWindowRight: () => Promise<void>
  moveWindowUp: () => Promise<void>
  moveWindowDown: () => Promise<void>
  analyzeAudioFromBase64: (data: string, mimeType: string) => Promise<{ text: string; timestamp: number }>
  analyzeAudioFile: (path: string) => Promise<{ text: string; timestamp: number }>
  saveSystemPrompt: (systemPrompt: string) => Promise<{ success: boolean; error?: string }>
  saveSystemPrompts: (prompts: { chatSystemPrompt: string; practicalSystemPrompt: string; enabled: boolean }) => Promise<{ success: boolean; error?: string }>
  saveDeepgramApiKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>
  getWindowSettings: () => Promise<{ alwaysOnTop: boolean }>
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<{ success: boolean; error?: string }>
  getAvailableProviderModels: (
    provider: "ollama" | "gemini" | "openai" | "openrouter" | "mistral",
    options?: { apiKey?: string; ollamaUrl?: string }
  ) => Promise<Array<{ id: string; name?: string }>>
  switchToOpenAI: (apiKey: string, model?: string) => Promise<{ success: boolean; error?: string }>
  quitApp: () => Promise<void>
  invoke: (channel: string, ...args: any[]) => Promise<any>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
} 
