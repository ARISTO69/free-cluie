// ipcHandlers.ts

import { ipcMain, app } from "electron"
import fs from "fs"
import path from "path"
import { AppState } from "./main"
import { LlmSettings } from "./SettingsHelper"

export function initializeIpcHandlers(appState: AppState): void {
  const saveLlmSettings = (settings: LlmSettings) => {
    appState.getSettingsHelper().saveLlmSettings(settings)
  }
  const buildLlmSettings = (
    existing: LlmSettings | null,
    currentProvider: LlmSettings["provider"],
    overrides: Partial<LlmSettings>
  ): LlmSettings => ({
    provider: overrides.provider ?? existing?.provider ?? currentProvider,
    geminiApiKey: overrides.geminiApiKey ?? existing?.geminiApiKey,
    geminiModel: overrides.geminiModel ?? existing?.geminiModel,
    openAiApiKey: overrides.openAiApiKey ?? existing?.openAiApiKey,
    openAiModel: overrides.openAiModel ?? existing?.openAiModel,
    openRouterApiKey: overrides.openRouterApiKey ?? existing?.openRouterApiKey,
    openRouterModel: overrides.openRouterModel ?? existing?.openRouterModel,
    mistralApiKey: overrides.mistralApiKey ?? existing?.mistralApiKey,
    mistralModel: overrides.mistralModel ?? existing?.mistralModel,
    ollamaModel: overrides.ollamaModel ?? existing?.ollamaModel,
    ollamaUrl: overrides.ollamaUrl ?? existing?.ollamaUrl,
    systemPrompt: overrides.systemPrompt ?? existing?.systemPrompt,
    chatSystemPrompt: overrides.chatSystemPrompt ?? existing?.chatSystemPrompt,
    practicalSystemPrompt: overrides.practicalSystemPrompt ?? existing?.practicalSystemPrompt,
    systemPromptsEnabled: overrides.systemPromptsEnabled ?? existing?.systemPromptsEnabled,
    deepgramApiKey: overrides.deepgramApiKey ?? existing?.deepgramApiKey
  })
  const getChatSystemPrompt = (settings: LlmSettings | null) =>
    settings?.chatSystemPrompt ?? settings?.systemPrompt ?? ""
  const getPracticalSystemPrompt = (settings: LlmSettings | null) =>
    settings?.practicalSystemPrompt ?? settings?.systemPrompt ?? ""
  const getSystemPromptsEnabled = (settings: LlmSettings | null) =>
    settings?.systemPromptsEnabled ?? true
  const practicalMemoryPath = path.join(process.cwd(), "practical-memory.md")

  const readPracticalMemory = async () => {
    try {
      return await fs.promises.readFile(practicalMemoryPath, "utf8")
    } catch (error: any) {
      if (error.code === "ENOENT") return ""
      throw error
    }
  }

  const appendPracticalMemory = async (message: string, response: string) => {
    const entry = [
      `## ${new Date().toISOString()}`,
      "",
      "User:",
      message.trim(),
      "",
      "Assistant:",
      response.trim(),
      ""
    ].join("\n")

    await fs.promises.appendFile(practicalMemoryPath, `${entry}\n`, "utf8")
  }

  ipcMain.handle(
    "update-content-dimensions",
    async (event, { width, height }: { width: number; height: number }) => {
      if (width && height) {
        appState.setWindowDimensions(width, height)
      }
    }
  )

  ipcMain.handle("delete-screenshot", async (event, path: string) => {
    return appState.deleteScreenshot(path)
  })

  ipcMain.handle("take-screenshot", async () => {
    try {
      const screenshotPath = await appState.takeScreenshot()
      const preview = await appState.getImagePreview(screenshotPath)
      const mainWindow = appState.getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("screenshot-taken", {
          path: screenshotPath,
          preview
        })
      }
      return { path: screenshotPath, preview }
    } catch (error) {
      console.error("Error taking screenshot:", error)
      throw error
    }
  })

  ipcMain.handle("take-area-screenshot", async () => {
    try {
      const screenshotPath = await appState.takeAreaScreenshot()
      const preview = await appState.getImagePreview(screenshotPath)
      const mainWindow = appState.getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("screenshot-taken", {
          path: screenshotPath,
          preview
        })
      }
      return { path: screenshotPath, preview }
    } catch (error) {
      console.error("Error taking area screenshot:", error)
      throw error
    }
  })

  ipcMain.handle("get-screenshots", async () => {
    console.log({ view: appState.getView() })
    try {
      let previews = []
      if (appState.getView() === "queue") {
        previews = await Promise.all(
          appState.getScreenshotQueue().map(async (path) => ({
            path,
            preview: await appState.getImagePreview(path)
          }))
        )
      } else {
        previews = await Promise.all(
          appState.getExtraScreenshotQueue().map(async (path) => ({
            path,
            preview: await appState.getImagePreview(path)
          }))
        )
      }
      previews.forEach((preview: any) => console.log(preview.path))
      return previews
    } catch (error) {
      console.error("Error getting screenshots:", error)
      throw error
    }
  })

  ipcMain.handle("toggle-window", async () => {
    appState.toggleMainWindow()
  })

  ipcMain.handle("save-system-prompt", async (_, systemPrompt: string) => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper()
      const existing = appState.getSettingsHelper().getLlmSettings()
      saveLlmSettings(buildLlmSettings(existing, llmHelper.getCurrentProvider(), {
        systemPrompt,
        chatSystemPrompt: systemPrompt,
        practicalSystemPrompt: existing?.practicalSystemPrompt ?? existing?.systemPrompt,
        systemPromptsEnabled: existing?.systemPromptsEnabled ?? true,
        deepgramApiKey: existing?.deepgramApiKey
      }))
      llmHelper.setSystemPromptsEnabled(getSystemPromptsEnabled(existing))
      llmHelper.setChatSystemPrompt(systemPrompt)
      llmHelper.setPracticalSystemPrompt(getPracticalSystemPrompt(existing))
      return { success: true }
    } catch (error: any) {
      console.error("Error saving system prompt:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("save-system-prompts", async (_, prompts: { chatSystemPrompt: string; practicalSystemPrompt: string; enabled: boolean }) => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper()
      const existing = appState.getSettingsHelper().getLlmSettings()
      saveLlmSettings(buildLlmSettings(existing, llmHelper.getCurrentProvider(), {
        systemPrompt: prompts.chatSystemPrompt,
        chatSystemPrompt: prompts.chatSystemPrompt,
        practicalSystemPrompt: prompts.practicalSystemPrompt,
        systemPromptsEnabled: prompts.enabled,
        deepgramApiKey: existing?.deepgramApiKey
      }))
      llmHelper.setSystemPromptsEnabled(prompts.enabled)
      llmHelper.setChatSystemPrompt(prompts.chatSystemPrompt)
      llmHelper.setPracticalSystemPrompt(prompts.practicalSystemPrompt)
      return { success: true }
    } catch (error: any) {
      console.error("Error saving system prompt:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("save-deepgram-api-key", async (_, deepgramApiKey: string) => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper()
      const existing = appState.getSettingsHelper().getLlmSettings()
      saveLlmSettings(buildLlmSettings(existing, llmHelper.getCurrentProvider(), {
        systemPrompt: existing?.systemPrompt,
        chatSystemPrompt: existing?.chatSystemPrompt,
        practicalSystemPrompt: existing?.practicalSystemPrompt,
        systemPromptsEnabled: existing?.systemPromptsEnabled,
        deepgramApiKey
      }))
      llmHelper.setDeepgramApiKey(deepgramApiKey)
      return { success: true }
    } catch (error: any) {
      console.error("Error saving Deepgram API key:", error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle("reset-queues", async () => {
    try {
      appState.clearQueues()
      console.log("Screenshot queues have been cleared.")
      return { success: true }
    } catch (error: any) {
      console.error("Error resetting queues:", error)
      return { success: false, error: error.message }
    }
  })

  // IPC handler for analyzing audio from base64 data
  ipcMain.handle("analyze-audio-base64", async (event, data: string, mimeType: string) => {
    try {
      const result = await appState.processingHelper.processAudioBase64(data, mimeType)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-base64 handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing audio from file path
  ipcMain.handle("analyze-audio-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.processAudioFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-audio-file handler:", error)
      throw error
    }
  })

  // IPC handler for analyzing image from file path
  ipcMain.handle("analyze-image-file", async (event, path: string) => {
    try {
      const result = await appState.processingHelper.getLLMHelper().analyzeImageFile(path)
      return result
    } catch (error: any) {
      console.error("Error in analyze-image-file handler:", error)
      throw error
    }
  })

  ipcMain.handle("gemini-chat", async (event, message: string) => {
    try {
      const result = await appState.processingHelper.getLLMHelper().chatWithGemini(message);
      return result;
    } catch (error: any) {
      console.error("Error in gemini-chat handler:", error);
      throw error;
    }
  });

  ipcMain.handle("practical-chat", async (event, message: string) => {
    try {
      const memory = await readPracticalMemory()
      const result = await appState.processingHelper.getLLMHelper().practicalChat(message, memory)
      await appendPracticalMemory(message, result)
      return result
    } catch (error: any) {
      console.error("Error in practical-chat handler:", error)
      throw error
    }
  })

  ipcMain.handle("quit-app", () => {
    app.quit()
  })

  // Window movement handlers
  ipcMain.handle("move-window-left", async () => {
    appState.moveWindowLeft()
  })

  ipcMain.handle("move-window-right", async () => {
    appState.moveWindowRight()
  })

  ipcMain.handle("move-window-up", async () => {
    appState.moveWindowUp()
  })

  ipcMain.handle("move-window-down", async () => {
    appState.moveWindowDown()
  })

  ipcMain.handle("center-and-show-window", async () => {
    appState.centerAndShowWindow()
  })

  // LLM Model Management Handlers
  ipcMain.handle("get-current-llm-config", async () => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      return {
        provider: llmHelper.getCurrentProvider(),
        model: llmHelper.getCurrentModel(),
        isOllama: llmHelper.isUsingOllama()
      };
    } catch (error: any) {
      console.error("Error getting current LLM config:", error);
      throw error;
    }
  });

  ipcMain.handle("get-saved-llm-settings", async () => {
    try {
      return appState.getSettingsHelper().getLlmSettings();
    } catch (error: any) {
      console.error("Error getting saved LLM settings:", error);
      throw error;
    }
  });

  ipcMain.handle("get-window-settings", async () => {
    try {
      return appState.getSettingsHelper().getWindowSettings();
    } catch (error: any) {
      console.error("Error getting window settings:", error);
      throw error;
    }
  });

  ipcMain.handle("set-always-on-top", async (_, alwaysOnTop: boolean) => {
    try {
      appState.setAlwaysOnTop(alwaysOnTop);
      return { success: true };
    } catch (error: any) {
      console.error("Error setting always-on-top:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("get-available-ollama-models", async () => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      const models = await llmHelper.getOllamaModels();
      return models;
    } catch (error: any) {
      console.error("Error getting Ollama models:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "get-available-provider-models",
    async (
      _,
      provider: "ollama" | "gemini" | "openai" | "openrouter" | "mistral",
      options?: { apiKey?: string; ollamaUrl?: string }
    ) => {
      try {
        const llmHelper = appState.processingHelper.getLLMHelper();
        return llmHelper.getAvailableModels(provider, options || {});
      } catch (error: any) {
        console.error("Error getting provider models:", error);
        throw error;
      }
    }
  );

  ipcMain.handle("switch-to-ollama", async (_, model?: string, url?: string) => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      await llmHelper.switchToOllama(model, url);
      const existing = appState.getSettingsHelper().getLlmSettings();
      saveLlmSettings(buildLlmSettings(existing, llmHelper.getCurrentProvider(), {
        provider: "ollama",
        ollamaModel: model || llmHelper.getCurrentModel(),
        ollamaUrl: url || existing?.ollamaUrl || "http://localhost:11434",
      }));
      llmHelper.setSystemPromptsEnabled(getSystemPromptsEnabled(existing))
      llmHelper.setChatSystemPrompt(getChatSystemPrompt(existing))
      llmHelper.setPracticalSystemPrompt(getPracticalSystemPrompt(existing))
      return { success: true };
    } catch (error: any) {
      console.error("Error switching to Ollama:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("switch-to-gemini", async (_, apiKey?: string, model?: string) => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      const existing = appState.getSettingsHelper().getLlmSettings();
      const geminiApiKey = apiKey || existing?.geminiApiKey;
      await llmHelper.switchToGemini(geminiApiKey, model || existing?.geminiModel);
      saveLlmSettings(buildLlmSettings(existing, llmHelper.getCurrentProvider(), {
        provider: "gemini",
        geminiApiKey,
        geminiModel: model || existing?.geminiModel || llmHelper.getCurrentModel(),
      }));
      llmHelper.setSystemPromptsEnabled(getSystemPromptsEnabled(existing))
      llmHelper.setChatSystemPrompt(getChatSystemPrompt(existing))
      llmHelper.setPracticalSystemPrompt(getPracticalSystemPrompt(existing))
      return { success: true };
    } catch (error: any) {
      console.error("Error switching to Gemini:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("switch-to-openai", async (_, apiKey: string, model?: string) => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      const existing = appState.getSettingsHelper().getLlmSettings();
      const openAiApiKey = apiKey || existing?.openAiApiKey;
      const openAiModel = model || existing?.openAiModel;
      await llmHelper.switchToOpenAI(openAiApiKey, openAiModel);
      saveLlmSettings(buildLlmSettings(existing, llmHelper.getCurrentProvider(), {
        provider: "openai",
        openAiApiKey,
        openAiModel: openAiModel || llmHelper.getCurrentModel(),
      }));
      llmHelper.setSystemPromptsEnabled(getSystemPromptsEnabled(existing))
      llmHelper.setChatSystemPrompt(getChatSystemPrompt(existing))
      llmHelper.setPracticalSystemPrompt(getPracticalSystemPrompt(existing))
      return { success: true };
    } catch (error: any) {
      console.error("Error switching to OpenAI:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("switch-to-openrouter", async (_, apiKey: string, model?: string) => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      const existing = appState.getSettingsHelper().getLlmSettings();
      const openRouterApiKey = apiKey || existing?.openRouterApiKey;
      const openRouterModel = model || existing?.openRouterModel;
      await llmHelper.switchToOpenRouter(openRouterApiKey, openRouterModel);
      saveLlmSettings(buildLlmSettings(existing, llmHelper.getCurrentProvider(), {
        provider: "openrouter",
        openRouterApiKey,
        openRouterModel: openRouterModel || llmHelper.getCurrentModel(),
      }));
      llmHelper.setSystemPromptsEnabled(getSystemPromptsEnabled(existing))
      llmHelper.setChatSystemPrompt(getChatSystemPrompt(existing))
      llmHelper.setPracticalSystemPrompt(getPracticalSystemPrompt(existing))
      return { success: true };
    } catch (error: any) {
      console.error("Error switching to OpenRouter:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("switch-to-mistral", async (_, apiKey: string, model?: string) => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      const existing = appState.getSettingsHelper().getLlmSettings();
      const mistralApiKey = apiKey || existing?.mistralApiKey;
      const mistralModel = model || existing?.mistralModel;
      await llmHelper.switchToMistral(mistralApiKey, mistralModel);
      saveLlmSettings(buildLlmSettings(existing, llmHelper.getCurrentProvider(), {
        provider: "mistral",
        mistralApiKey,
        mistralModel: mistralModel || llmHelper.getCurrentModel(),
      }));
      llmHelper.setSystemPromptsEnabled(getSystemPromptsEnabled(existing))
      llmHelper.setChatSystemPrompt(getChatSystemPrompt(existing))
      llmHelper.setPracticalSystemPrompt(getPracticalSystemPrompt(existing))
      return { success: true };
    } catch (error: any) {
      console.error("Error switching to Mistral:", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("test-llm-connection", async () => {
    try {
      const llmHelper = appState.processingHelper.getLLMHelper();
      const result = await llmHelper.testConnection();
      return result;
    } catch (error: any) {
      console.error("Error testing LLM connection:", error);
      return { success: false, error: error.message };
    }
  });
}
