import { app } from "electron"
import fs from "fs"
import path from "node:path"

export type Provider = "ollama" | "gemini" | "openai" | "openrouter" | "mistral" | "custom"

export interface LlmSettings {
  provider: Provider
  geminiApiKey?: string
  geminiModel?: string
  openAiApiKey?: string
  openAiModel?: string
  openRouterApiKey?: string
  openRouterModel?: string
  mistralApiKey?: string
  mistralModel?: string
  customProviderName?: string
  customBaseUrl?: string
  customApiKey?: string
  customModel?: string
  ollamaUrl?: string
  ollamaModel?: string
  systemPrompt?: string
  chatSystemPrompt?: string
  practicalSystemPrompt?: string
  systemPromptsEnabled?: boolean
  deepgramApiKey?: string
}

export interface WindowSettings {
  alwaysOnTop: boolean
}

const DEFAULT_WINDOW_SETTINGS: WindowSettings = {
  alwaysOnTop: true
}

export class SettingsHelper {
  private readonly settingsPath: string

  constructor() {
    this.settingsPath = path.join(app.getPath("userData"), "settings.json")
  }

  public getLlmSettings(): LlmSettings | null {
    try {
      if (!fs.existsSync(this.settingsPath)) {
        return null
      }

      const raw = fs.readFileSync(this.settingsPath, "utf8")
      const data = JSON.parse(raw) as { llmSettings?: LlmSettings }
      return data.llmSettings ?? null
    } catch (error) {
      console.error("[SettingsHelper] Failed to load settings:", error)
      return null
    }
  }

  public saveLlmSettings(settings: LlmSettings): void {
    try {
      const existing = this.readSettingsFile()
      const next = { ...existing, llmSettings: settings }
      fs.mkdirSync(path.dirname(this.settingsPath), { recursive: true })
      fs.writeFileSync(this.settingsPath, JSON.stringify(next, null, 2), "utf8")
    } catch (error) {
      console.error("[SettingsHelper] Failed to save settings:", error)
      throw error
    }
  }

  public getWindowSettings(): WindowSettings {
    try {
      if (!fs.existsSync(this.settingsPath)) {
        return DEFAULT_WINDOW_SETTINGS
      }

      const raw = fs.readFileSync(this.settingsPath, "utf8")
      const data = JSON.parse(raw) as { windowSettings?: Partial<WindowSettings> }
      return {
        ...DEFAULT_WINDOW_SETTINGS,
        ...data.windowSettings
      }
    } catch (error) {
      console.error("[SettingsHelper] Failed to load window settings:", error)
      return DEFAULT_WINDOW_SETTINGS
    }
  }

  public saveWindowSettings(settings: WindowSettings): void {
    try {
      const existing = this.readSettingsFile()
      const next = { ...existing, windowSettings: settings }
      fs.mkdirSync(path.dirname(this.settingsPath), { recursive: true })
      fs.writeFileSync(this.settingsPath, JSON.stringify(next, null, 2), "utf8")
    } catch (error) {
      console.error("[SettingsHelper] Failed to save window settings:", error)
      throw error
    }
  }

  private readSettingsFile(): Record<string, unknown> {
    try {
      if (!fs.existsSync(this.settingsPath)) {
        return {}
      }

      const raw = fs.readFileSync(this.settingsPath, "utf8")
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  }
}
