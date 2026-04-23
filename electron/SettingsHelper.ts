import { app } from "electron"
import fs from "fs"
import path from "node:path"

export type Provider = "ollama" | "gemini" | "openrouter" | "mistral"

export interface LlmSettings {
  provider: Provider
  geminiApiKey?: string
  openRouterApiKey?: string
  openRouterModel?: string
  mistralApiKey?: string
  mistralModel?: string
  ollamaUrl?: string
  ollamaModel?: string
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
