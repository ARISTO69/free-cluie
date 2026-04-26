// ProcessingHelper.ts

import { AppState } from "./main"
import { LLMHelper } from "./LLMHelper"
import { LlmSettings } from "./SettingsHelper"
import dotenv from "dotenv"

dotenv.config()

const isDev = process.env.NODE_ENV === "development"
const isDevTest = process.env.IS_DEV_TEST === "true"
const MOCK_API_WAIT_TIME = Number(process.env.MOCK_API_WAIT_TIME) || 500

export class ProcessingHelper {
  private appState: AppState
  private llmHelper: LLMHelper
  private currentProcessingAbortController: AbortController | null = null
  private currentExtraProcessingAbortController: AbortController | null = null

  constructor(appState: AppState) {
    this.appState = appState

    const savedSettings = this.appState.getSettingsHelper().getLlmSettings()
    const savedSystemPrompt = savedSettings?.systemPrompt
    const useOllama = process.env.USE_OLLAMA === "true"
    const openRouterKey = process.env.OPENROUTER_API_KEY
    const mistralKey = process.env.MISTRAL_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY
    const deepgramKey = process.env.DEEPGRAM_API_KEY || savedSettings?.deepgramApiKey

    if (useOllama) {
      const ollamaModel = process.env.OLLAMA_MODEL
      const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434"
      console.log("[ProcessingHelper] Initializing with Ollama")
      this.llmHelper = new LLMHelper(
        undefined,
        true,
        ollamaModel,
        ollamaUrl,
        false,
        undefined,
        false,
        undefined,
        savedSystemPrompt,
        undefined,
        deepgramKey
      )

    } else if (openRouterKey) {
      const model = process.env.OPENROUTER_MODEL || "mistralai/mistral-large"
      console.log(`[ProcessingHelper] Initializing with OpenRouter (${model})`)
      this.llmHelper = new LLMHelper(
        openRouterKey,
        false,
        undefined,
        undefined,
        true,
        model,
        false,
        undefined,
        savedSystemPrompt,
        undefined,
        deepgramKey
      )

    } else if (mistralKey) {
      const model = process.env.MISTRAL_MODEL || "mistral-large-latest"
      console.log(`[ProcessingHelper] Initializing with Mistral (${model})`)
      this.llmHelper = new LLMHelper(
        mistralKey,
        false,
        undefined,
        undefined,
        false,
        undefined,
        true,
        model,
        savedSystemPrompt,
        undefined,
        deepgramKey
      )

    } else if (geminiKey) {
      const model = process.env.GEMINI_MODEL || savedSettings?.geminiModel
      console.log(`[ProcessingHelper] Initializing with Gemini${model ? ` (${model})` : ""}`)
      this.llmHelper = new LLMHelper(
        geminiKey,
        false,
        undefined,
        undefined,
        false,
        undefined,
        false,
        undefined,
        savedSystemPrompt,
        model,
        deepgramKey
      )

    } else if (savedSettings) {
      console.log(`[ProcessingHelper] Initializing from saved ${savedSettings.provider} settings`)
      this.llmHelper = this.createLlmHelperFromSavedSettings(savedSettings)

    } else {
      throw new Error(
        "No AI provider configured. Add one of these to your .env:\n" +
        "  OPENROUTER_API_KEY=...\n" +
        "  MISTRAL_API_KEY=...\n" +
        "  GEMINI_API_KEY=...\n" +
        "  USE_OLLAMA=true"
      )
    }
  }

  private createLlmHelperFromSavedSettings(settings: LlmSettings): LLMHelper {
    if (settings.provider === "ollama") {
      return new LLMHelper(
        undefined,
        true,
        settings.ollamaModel,
        settings.ollamaUrl,
        false,
        undefined,
        false,
        undefined,
        settings.systemPrompt,
        undefined,
        settings.deepgramApiKey
      )
    }

    if (settings.provider === "openrouter") {
      if (!settings.openRouterApiKey) {
        throw new Error("Saved OpenRouter settings are missing the API key")
      }
      return new LLMHelper(
        settings.openRouterApiKey,
        false,
        undefined,
        undefined,
        true,
        settings.openRouterModel,
        false,
        undefined,
        settings.systemPrompt,
        undefined,
        settings.deepgramApiKey
      )
    }

    if (settings.provider === "mistral") {
      if (!settings.mistralApiKey) {
        throw new Error("Saved Mistral settings are missing the API key")
      }
      return new LLMHelper(
        settings.mistralApiKey,
        false,
        undefined,
        undefined,
        false,
        undefined,
        true,
        settings.mistralModel,
        settings.systemPrompt,
        undefined,
        settings.deepgramApiKey
      )
    }

    if (!settings.geminiApiKey) {
      throw new Error("Saved Gemini settings are missing the API key")
    }

    return new LLMHelper(
      settings.geminiApiKey,
      false,
      undefined,
      undefined,
      false,
      undefined,
      false,
      undefined,
      settings.systemPrompt,
      settings.geminiModel,
      settings.deepgramApiKey
    )
  }

  // ── Everything below is UNCHANGED from original ──────────────────────────────

  public async processScreenshots(): Promise<void> {
    const mainWindow = this.appState.getMainWindow()
    if (!mainWindow) return

    const view = this.appState.getView()

    if (view === "queue") {
      const screenshotQueue = this.appState.getScreenshotHelper().getScreenshotQueue()
      if (screenshotQueue.length === 0) {
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.NO_SCREENSHOTS)
        return
      }

      const allPaths = this.appState.getScreenshotHelper().getScreenshotQueue()
      const lastPath = allPaths[allPaths.length - 1]
      if (lastPath.endsWith(".mp3") || lastPath.endsWith(".wav")) {
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.INITIAL_START)
        this.appState.setView("solutions")
        try {
          const audioResult = await this.llmHelper.analyzeAudioFile(lastPath)
          mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.PROBLEM_EXTRACTED, audioResult)
          this.appState.setProblemInfo({ problem_statement: audioResult.text, input_format: {}, output_format: {}, constraints: [], test_cases: [] })
          return
        } catch (err: any) {
          console.error("Audio processing error:", err)
          mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, err.message)
          return
        }
      }

      mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.INITIAL_START)
      this.appState.setView("solutions")
      this.currentProcessingAbortController = new AbortController()
      try {
        const imageResult = await this.llmHelper.analyzeImageFile(lastPath)
        const problemInfo = {
          problem_statement: imageResult.text,
          input_format: { description: "Generated from screenshot", parameters: [] as any[] },
          output_format: { description: "Generated from screenshot", type: "string", subtype: "text" },
          complexity: { time: "N/A", space: "N/A" },
          test_cases: [] as any[],
          validation_type: "manual",
          difficulty: "custom",
        }
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.PROBLEM_EXTRACTED, problemInfo)
        this.appState.setProblemInfo(problemInfo)
      } catch (error: any) {
        console.error("Image processing error:", error)
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, error.message)
      } finally {
        this.currentProcessingAbortController = null
      }
      return

    } else {
      const extraScreenshotQueue = this.appState.getScreenshotHelper().getExtraScreenshotQueue()
      if (extraScreenshotQueue.length === 0) {
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.NO_SCREENSHOTS)
        return
      }

      mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.DEBUG_START)
      this.currentExtraProcessingAbortController = new AbortController()

      try {
        const problemInfo = this.appState.getProblemInfo()
        if (!problemInfo) throw new Error("No problem info available")

        const currentSolution = await this.llmHelper.generateSolution(problemInfo)
        const currentCode = currentSolution.solution.code

        const debugResult = await this.llmHelper.debugSolutionWithImages(
          problemInfo,
          currentCode,
          extraScreenshotQueue
        )

        this.appState.setHasDebugged(true)
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.DEBUG_SUCCESS, debugResult)
      } catch (error: any) {
        console.error("Debug processing error:", error)
        mainWindow.webContents.send(this.appState.PROCESSING_EVENTS.DEBUG_ERROR, error.message)
      } finally {
        this.currentExtraProcessingAbortController = null
      }
    }
  }

  public cancelOngoingRequests(): void {
    if (this.currentProcessingAbortController) {
      this.currentProcessingAbortController.abort()
      this.currentProcessingAbortController = null
    }
    if (this.currentExtraProcessingAbortController) {
      this.currentExtraProcessingAbortController.abort()
      this.currentExtraProcessingAbortController = null
    }
    this.appState.setHasDebugged(false)
  }

  public async processAudioBase64(data: string, mimeType: string) {
    return this.llmHelper.analyzeAudioFromBase64(data, mimeType)
  }

  public async processAudioFile(filePath: string) {
    return this.llmHelper.analyzeAudioFile(filePath)
  }

  public getLLMHelper() {
    return this.llmHelper
  }
}
