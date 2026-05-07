import fs from "fs"

// ─── Provider types ───────────────────────────────────────────────────────────
type Provider = "gemini" | "ollama" | "openrouter" | "mistral"

export interface ProviderModel {
  id: string
  name?: string
}

const DEFAULT_GEMINI_MODELS: ProviderModel[] = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" }
]

const DEFAULT_OPENROUTER_MODELS: ProviderModel[] = [
  { id: "openai/gpt-4.1", name: "OpenAI GPT-4.1" },
  { id: "openai/gpt-4.1-mini", name: "OpenAI GPT-4.1 Mini" },
  { id: "anthropic/claude-sonnet-4", name: "Anthropic Claude Sonnet 4" },
  { id: "google/gemini-2.5-pro", name: "Google Gemini 2.5 Pro" },
  { id: "google/gemini-2.5-flash", name: "Google Gemini 2.5 Flash" },
  { id: "mistralai/mistral-large", name: "Mistral Large" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Meta Llama 3.3 70B Instruct" }
]

const DEFAULT_MISTRAL_MODELS: ProviderModel[] = [
  { id: "mistral-large-latest", name: "Mistral Large" },
  { id: "mistral-small-latest", name: "Mistral Small" },
  { id: "codestral-latest", name: "Codestral" },
  { id: "pixtral-large-latest", name: "Pixtral Large" },
  { id: "open-mistral-nemo", name: "Open Mistral Nemo" }
]

interface OllamaResponse {
  response: string
  done: boolean
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant"
  content: string | OpenAIContentPart[]
}

interface OpenAIContentPart {
  type: "text" | "image_url"
  text?: string
  image_url?: { url: string }
}

// ─── LLMHelper ────────────────────────────────────────────────────────────────
export class LLMHelper {
  private provider: Provider = "gemini"
  private readonly defaultSystemPrompt = `You are Wingman AI, a helpful, proactive assistant for any kind of problem or situation (not just coding). For any user input, analyze the situation, provide a clear problem statement, relevant context, and suggest several possible responses or actions the user could take next. Always explain your reasoning. Present your suggestions as a list of options or next steps.`
  private chatSystemPrompt: string = ""
  private practicalSystemPrompt: string = ""
  private systemPromptsEnabled: boolean = true

  // Gemini
  private geminiModel: any = null
  private geminiModelName: string = "gemini-2.0-flash"

  // Ollama
  private ollamaModel: string = "llama3.2"
  private ollamaUrl: string = "http://localhost:11434"

  // OpenRouter / Mistral (OpenAI-compatible)
  private openaiApiKey: string = ""
  private openaiModel: string = ""
  private openaiBaseUrl: string = ""
  private deepgramApiKey: string = ""

  constructor(
    apiKey?: string,
    useOllama: boolean = false,
    ollamaModel?: string,
    ollamaUrl?: string,
    useOpenRouter: boolean = false,
    openRouterModel?: string,
    useMistral: boolean = false,
    mistralModel?: string,
    systemPrompt?: string,
    geminiModel?: string,
    deepgramApiKey?: string,
    practicalSystemPrompt?: string,
    systemPromptsEnabled: boolean = true
  ) {
    this.setSystemPromptsEnabled(systemPromptsEnabled)
    this.setChatSystemPrompt(systemPrompt || "")
    this.setPracticalSystemPrompt(practicalSystemPrompt || systemPrompt || "")
    this.geminiModelName = geminiModel || this.geminiModelName
    this.deepgramApiKey = deepgramApiKey || ""

    if (useOllama) {
      this.provider = "ollama"
      this.ollamaUrl = ollamaUrl || "http://localhost:11434"
      this.ollamaModel = ollamaModel || "llama3.2"
      console.log(`[LLMHelper] Using Ollama with model: ${this.ollamaModel}`)
      this.initializeOllamaModel()

    } else if (useOpenRouter && apiKey) {
      this.provider = "openrouter"
      this.openaiApiKey = apiKey
      this.openaiModel = openRouterModel || "mistralai/mistral-large"
      this.openaiBaseUrl = "https://openrouter.ai/api/v1"
      console.log(`[LLMHelper] Using OpenRouter with model: ${this.openaiModel}`)

    } else if (useMistral && apiKey) {
      this.provider = "mistral"
      this.openaiApiKey = apiKey
      this.openaiModel = mistralModel || "mistral-large-latest"
      this.openaiBaseUrl = "https://api.mistral.ai/v1"
      console.log(`[LLMHelper] Using Mistral with model: ${this.openaiModel}`)

    } else if (apiKey) {
      this.provider = "gemini"
      const { GoogleGenerativeAI } = require("@google/generative-ai")
      const genAI = new GoogleGenerativeAI(apiKey)
      this.geminiModel = genAI.getGenerativeModel({ model: this.geminiModelName })
      console.log(`[LLMHelper] Using Google Gemini with model: ${this.geminiModelName}`)

    } else {
      throw new Error("No valid provider configured. Set OPENROUTER_API_KEY, MISTRAL_API_KEY, GEMINI_API_KEY, or USE_OLLAMA=true")
    }
  }

  // ─── Utilities ──────────────────────────────────────────────────────────────

  private cleanJsonResponse(text: string): string {
    text = text.replace(/^```(?:json)?\n/, "").replace(/\n```$/, "")
    return text.trim()
  }

  private getSystemPrompt(customPrompt = this.chatSystemPrompt): string {
    if (!this.systemPromptsEnabled) return this.defaultSystemPrompt
    const custom = customPrompt.trim()
    if (!custom) return this.defaultSystemPrompt
    return `${this.defaultSystemPrompt}\n\nAdditional user instructions:\n${custom}`
  }

  public setSystemPrompt(prompt: string): void {
    this.setChatSystemPrompt(prompt)
  }

  public setChatSystemPrompt(prompt: string): void {
    this.chatSystemPrompt = prompt.trim()
  }

  public setPracticalSystemPrompt(prompt: string): void {
    this.practicalSystemPrompt = prompt.trim()
  }

  public setSystemPromptsEnabled(enabled: boolean): void {
    this.systemPromptsEnabled = enabled
  }

  public getCustomSystemPrompt(): string {
    return this.chatSystemPrompt
  }

  public setDeepgramApiKey(apiKey: string): void {
    this.deepgramApiKey = apiKey.trim()
  }

  private async imagePathToBase64DataUrl(imagePath: string): Promise<string> {
    const data = await fs.promises.readFile(imagePath)
    return `data:image/png;base64,${data.toString("base64")}`
  }

  // ─── OpenAI-compatible call (OpenRouter + Mistral) ──────────────────────────

  private async callOpenAICompatible(messages: OpenAIMessage[]): Promise<string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.openaiApiKey}`,
    }

    // OpenRouter requires these extra headers
    if (this.provider === "openrouter") {
      headers["HTTP-Referer"] = "https://github.com/Prat011/free-cluely"
      headers["X-Title"] = "free-cluely"
    }

    const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.openaiModel,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`${this.provider} API error ${response.status}: ${errText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content ?? ""
  }

  // ─── Ollama call ────────────────────────────────────────────────────────────

  private async callOllama(prompt: string): Promise<string> {
    const response = await fetch(`${this.ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.ollamaModel,
        prompt,
        stream: false,
        options: { temperature: 0.7, top_p: 0.9 },
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
    }

    const data: OllamaResponse = await response.json()
    return data.response
  }

  private async checkOllamaAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }

  public async getOllamaModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.ollamaUrl}/api/tags`)
      if (!response.ok) throw new Error("Failed to fetch models")
      const data = await response.json()
      return data.models?.map((m: any) => m.name) || []
    } catch (error) {
      console.error("[LLMHelper] Error fetching Ollama models:", error)
      return []
    }
  }

  public async getAvailableModels(
    provider: Provider,
    options: { apiKey?: string; ollamaUrl?: string } = {}
  ): Promise<ProviderModel[]> {
    if (provider === "ollama") {
      const previousUrl = this.ollamaUrl
      if (options.ollamaUrl) this.ollamaUrl = options.ollamaUrl
      const models = await this.getOllamaModels()
      this.ollamaUrl = previousUrl
      return models.map((id) => ({ id }))
    }

    if (provider === "gemini") {
      return this.getGeminiModels(options.apiKey)
    }

    if (provider === "mistral") {
      return this.getMistralModels(options.apiKey)
    }

    return this.getOpenRouterModels()
  }

  private async getGeminiModels(apiKey?: string): Promise<ProviderModel[]> {
    if (!apiKey) return DEFAULT_GEMINI_MODELS

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(apiKey)}`
      )
      if (!response.ok) throw new Error(`Gemini models API error ${response.status}`)
      const data = await response.json()
      const models = (data.models || [])
        .filter((model: any) => model.supportedGenerationMethods?.includes("generateContent"))
        .map((model: any) => ({
          id: String(model.name || "").replace(/^models\//, ""),
          name: model.displayName
        }))
        .filter((model: ProviderModel) => model.id)
      return models.length > 0 ? models : DEFAULT_GEMINI_MODELS
    } catch (error) {
      console.error("[LLMHelper] Error fetching Gemini models:", error)
      return DEFAULT_GEMINI_MODELS
    }
  }

  private async getOpenRouterModels(): Promise<ProviderModel[]> {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models")
      if (!response.ok) throw new Error(`OpenRouter models API error ${response.status}`)
      const data = await response.json()
      const models = (data.data || [])
        .map((model: any) => ({
          id: String(model.id || ""),
          name: model.name
        }))
        .filter((model: ProviderModel) => model.id)
      return models.length > 0 ? models : DEFAULT_OPENROUTER_MODELS
    } catch (error) {
      console.error("[LLMHelper] Error fetching OpenRouter models:", error)
      return DEFAULT_OPENROUTER_MODELS
    }
  }

  private async getMistralModels(apiKey?: string): Promise<ProviderModel[]> {
    if (!apiKey) return DEFAULT_MISTRAL_MODELS

    try {
      const response = await fetch("https://api.mistral.ai/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` }
      })
      if (!response.ok) throw new Error(`Mistral models API error ${response.status}`)
      const data = await response.json()
      const models = (data.data || [])
        .filter((model: any) => model.capabilities?.completion_chat !== false && !model.archived)
        .map((model: any) => ({
          id: String(model.id || ""),
          name: model.name || model.root
        }))
        .filter((model: ProviderModel) => model.id)
      return models.length > 0 ? models : DEFAULT_MISTRAL_MODELS
    } catch (error) {
      console.error("[LLMHelper] Error fetching Mistral models:", error)
      return DEFAULT_MISTRAL_MODELS
    }
  }

  private async initializeOllamaModel(): Promise<void> {
    try {
      const models = await this.getOllamaModels()
      if (models.length === 0) {
        console.warn("[LLMHelper] No Ollama models found")
        return
      }
      if (!models.includes(this.ollamaModel)) {
        this.ollamaModel = models[0]
        console.log(`[LLMHelper] Auto-selected model: ${this.ollamaModel}`)
      }
      await this.callOllama("Hello")
      console.log(`[LLMHelper] Ollama ready with model: ${this.ollamaModel}`)
    } catch (error: any) {
      console.error(`[LLMHelper] Ollama init failed: ${error.message}`)
    }
  }

  // ─── Gemini helpers ─────────────────────────────────────────────────────────

  private async fileToGeminiPart(imagePath: string) {
    const data = await fs.promises.readFile(imagePath)
    return { inlineData: { data: data.toString("base64"), mimeType: "image/png" } }
  }

  // ─── Core text chat ─────────────────────────────────────────────────────────

  public async chat(message: string): Promise<string> {
    return this.chatWithGemini(message)
  }

  public async chatWithGemini(message: string): Promise<string> {
    try {
      if (this.provider === "ollama") {
        return await this.callOllama(`${this.getSystemPrompt()}\n\nUser message:\n${message}`)
      } else if (this.provider === "openrouter" || this.provider === "mistral") {
        return await this.callOpenAICompatible([
          { role: "system", content: this.getSystemPrompt() },
          { role: "user", content: message },
        ])
      } else {
        const result = await this.geminiModel.generateContent(`${this.getSystemPrompt()}\n\nUser message:\n${message}`)
        return result.response.text()
      }
    } catch (error: any) {
      console.error("[LLMHelper] Error in chat:", error)
      throw error
    }
  }

  public async practicalChat(message: string, memory: string): Promise<string> {
    const prompt = `${this.getSystemPrompt(this.practicalSystemPrompt)}

You are in Practical Exam mode. Guide the user step by step so they can complete their experiment in a practical exam. Be specific, sequential, and focused on the user's immediate requirement. If prior output exists in memory, use it as the source of continuity and avoid restarting unless the user asks.

Practical memory from previous outputs:
${memory.trim() || "No previous practical output saved yet."}

User's current requirement:
${message}`

    try {
      if (this.provider === "ollama") {
        return await this.callOllama(prompt)
      } else if (this.provider === "openrouter" || this.provider === "mistral") {
        return await this.callOpenAICompatible([
          { role: "system", content: this.getSystemPrompt(this.practicalSystemPrompt) },
          { role: "user", content: prompt },
        ])
      } else {
        const result = await this.geminiModel.generateContent(prompt)
        return result.response.text()
      }
    } catch (error: any) {
      console.error("[LLMHelper] Error in practical chat:", error)
      throw error
    }
  }

  // ─── Image extraction ────────────────────────────────────────────────────────

  public async extractProblemFromImages(imagePaths: string[]) {
    const jsonPrompt = `${this.getSystemPrompt()}\n\nAnalyze these images and extract the following information in JSON format:\n{\n  "problem_statement": "A clear statement of the problem or situation.",\n  "context": "Relevant background or context from the images.",\n  "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],\n  "reasoning": "Explanation of why these suggestions are appropriate."\n}\nImportant: Return ONLY the JSON object, without any markdown formatting or code blocks.`

    try {
      if (this.provider === "openrouter" || this.provider === "mistral") {
        const contentParts: OpenAIContentPart[] = [{ type: "text", text: jsonPrompt }]
        for (const p of imagePaths) {
          contentParts.push({ type: "image_url", image_url: { url: await this.imagePathToBase64DataUrl(p) } })
        }
        const text = this.cleanJsonResponse(
          await this.callOpenAICompatible([{ role: "user", content: contentParts }])
        )
        return JSON.parse(text)

      } else if (this.provider === "ollama") {
        // Ollama text-only fallback
        const text = this.cleanJsonResponse(await this.callOllama(jsonPrompt))
        return JSON.parse(text)

      } else {
        const imageParts = await Promise.all(imagePaths.map(p => this.fileToGeminiPart(p)))
        const result = await this.geminiModel.generateContent([jsonPrompt, ...imageParts])
        const text = this.cleanJsonResponse(result.response.text())
        return JSON.parse(text)
      }
    } catch (error) {
      console.error("Error extracting problem from images:", error)
      throw error
    }
  }

  // ─── Generate solution ───────────────────────────────────────────────────────

  public async generateSolution(problemInfo: any) {
    const prompt = `${this.getSystemPrompt()}\n\nGiven this problem or situation:\n${JSON.stringify(problemInfo, null, 2)}\n\nProvide your response in this JSON format:\n{\n  "solution": {\n    "code": "The code or main answer here.",\n    "problem_statement": "Restate the problem or situation.",\n    "context": "Relevant background/context.",\n    "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],\n    "reasoning": "Explanation of why these suggestions are appropriate."\n  }\n}\nImportant: Return ONLY the JSON object, without any markdown formatting or code blocks.`

    console.log(`[LLMHelper] Calling ${this.provider} for solution...`)
    try {
      let text: string
      if (this.provider === "openrouter" || this.provider === "mistral") {
        text = await this.callOpenAICompatible([
          { role: "system", content: this.getSystemPrompt() },
          { role: "user", content: prompt },
        ])
      } else if (this.provider === "ollama") {
        text = await this.callOllama(prompt)
      } else {
        const result = await this.geminiModel.generateContent(prompt)
        text = result.response.text()
      }
      const parsed = JSON.parse(this.cleanJsonResponse(text))
      console.log("[LLMHelper] Parsed solution response:", parsed)
      return parsed
    } catch (error: any) {
      console.error("[LLMHelper] Error in generateSolution:", error)
      throw error
    }
  }

  // ─── Debug solution with images ──────────────────────────────────────────────

  public async debugSolutionWithImages(problemInfo: any, currentCode: string, debugImagePaths: string[]) {
    const prompt = `${this.getSystemPrompt()}\n\nGiven:\n1. Original problem: ${JSON.stringify(problemInfo, null, 2)}\n2. Current response: ${currentCode}\n3. Debug images provided\n\nAnalyze and provide feedback in this JSON format:\n{\n  "solution": {\n    "code": "The code or main answer here.",\n    "problem_statement": "Restate the problem.",\n    "context": "Relevant background/context.",\n    "suggested_responses": ["First possible answer", "Second possible answer", "..."],\n    "reasoning": "Explanation of suggestions."\n  }\n}\nReturn ONLY the JSON object.`

    try {
      if (this.provider === "openrouter" || this.provider === "mistral") {
        const contentParts: OpenAIContentPart[] = [{ type: "text", text: prompt }]
        for (const p of debugImagePaths) {
          contentParts.push({ type: "image_url", image_url: { url: await this.imagePathToBase64DataUrl(p) } })
        }
        const text = this.cleanJsonResponse(
          await this.callOpenAICompatible([{ role: "user", content: contentParts }])
        )
        return JSON.parse(text)

      } else if (this.provider === "ollama") {
        const text = this.cleanJsonResponse(await this.callOllama(prompt))
        return JSON.parse(text)

      } else {
        const imageParts = await Promise.all(debugImagePaths.map(p => this.fileToGeminiPart(p)))
        const result = await this.geminiModel.generateContent([prompt, ...imageParts])
        const text = this.cleanJsonResponse(result.response.text())
        return JSON.parse(text)
      }
    } catch (error) {
      console.error("Error debugging solution with images:", error)
      throw error
    }
  }

  // ─── Analyze image file ──────────────────────────────────────────────────────

  public async analyzeImageFile(imagePath: string) {
    const prompt = `${this.getSystemPrompt()}\n\nDescribe the content of this image concisely. Suggest several possible actions or responses the user could take. Answer naturally and briefly.`

    try {
      let text: string
      if (this.provider === "openrouter" || this.provider === "mistral") {
        const dataUrl = await this.imagePathToBase64DataUrl(imagePath)
        text = await this.callOpenAICompatible([{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        }])

      } else if (this.provider === "ollama") {
        text = await this.callOllama(prompt)

      } else {
        const imagePart = await this.fileToGeminiPart(imagePath)
        const result = await this.geminiModel.generateContent([prompt, imagePart])
        text = result.response.text()
      }
      return { text, timestamp: Date.now() }
    } catch (error) {
      console.error("Error analyzing image file:", error)
      throw error
    }
  }

  // ─── Audio (Gemini only — OpenRouter/Mistral not supported) ──────────────────

  public async analyzeAudioFile(audioPath: string) {
    if (this.provider === "openrouter" || this.provider === "mistral") {
      return {
        text: "Audio analysis is not supported with OpenRouter/Mistral. Please take a screenshot instead and use Ctrl+H.",
        timestamp: Date.now(),
      }
    }

    if (this.provider === "ollama") {
      return {
        text: "Audio analysis is not supported with Ollama. Please take a screenshot instead and use Ctrl+H.",
        timestamp: Date.now(),
      }
    }

    try {
      const audioData = await fs.promises.readFile(audioPath)
      const audioPart = { inlineData: { data: audioData.toString("base64"), mimeType: "audio/mp3" } }
      const prompt = `${this.getSystemPrompt()}\n\nDescribe this audio clip concisely. Suggest possible actions or responses. Answer naturally.`
      const result = await this.geminiModel.generateContent([prompt, audioPart])
      return { text: result.response.text(), timestamp: Date.now() }
    } catch (error) {
      console.error("Error analyzing audio file:", error)
      throw error
    }
  }

  public async analyzeAudioFromBase64(data: string, mimeType: string) {
    if (this.provider !== "gemini") {
      if (!this.deepgramApiKey) {
        return {
          text: "Audio input with " + this.provider + " requires a Deepgram API key. Add it in Settings, then try the microphone again.",
          timestamp: Date.now(),
        }
      }

      const transcript = await this.transcribeWithDeepgram(data, mimeType)
      if (!transcript.trim()) {
        return {
          text: "Deepgram did not return any speech transcript.",
          timestamp: Date.now(),
        }
      }

      const text = await this.chatWithGemini(transcript)
      return { text, timestamp: Date.now() }
    }

    try {
      const audioPart = { inlineData: { data, mimeType } }
      const prompt = `${this.getSystemPrompt()}\n\nDescribe this audio clip concisely. Suggest possible next actions. Be brief.`
      const result = await this.geminiModel.generateContent([prompt, audioPart])
      return { text: result.response.text(), timestamp: Date.now() }
    } catch (error) {
      console.error("Error analyzing audio from base64:", error)
      throw error
    }
  }

  private async transcribeWithDeepgram(data: string, mimeType: string): Promise<string> {
    const audio = Buffer.from(data, "base64")
    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true", {
      method: "POST",
      headers: {
        Authorization: `Token ${this.deepgramApiKey}`,
        "Content-Type": mimeType || "audio/webm"
      },
      body: audio
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Deepgram API error ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    return result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ""
  }

  // ─── Provider info & switching ───────────────────────────────────────────────

  public getCurrentProvider(): Provider {
    return this.provider
  }

  public getCurrentModel(): string {
    if (this.provider === "ollama") return this.ollamaModel
    if (this.provider === "openrouter" || this.provider === "mistral") return this.openaiModel
    return this.geminiModelName
  }

  public isUsingOllama(): boolean {
    return this.provider === "ollama"
  }

  public async switchToOllama(model?: string, url?: string): Promise<void> {
    this.provider = "ollama"
    if (url) this.ollamaUrl = url
    if (model) this.ollamaModel = model
    else await this.initializeOllamaModel()
    console.log(`[LLMHelper] Switched to Ollama: ${this.ollamaModel}`)
  }

  public async switchToGemini(apiKey?: string, model?: string): Promise<void> {
    if (model) this.geminiModelName = model
    if (apiKey) {
      const { GoogleGenerativeAI } = require("@google/generative-ai")
      const genAI = new GoogleGenerativeAI(apiKey)
      this.geminiModel = genAI.getGenerativeModel({ model: this.geminiModelName })
    }
    if (!this.geminiModel) throw new Error("No Gemini API key provided")
    this.provider = "gemini"
    console.log(`[LLMHelper] Switched to Gemini: ${this.geminiModelName}`)
  }

  public async switchToOpenRouter(apiKey: string, model?: string): Promise<void> {
    this.provider = "openrouter"
    this.openaiApiKey = apiKey
    this.openaiModel = model || "mistralai/mistral-large"
    this.openaiBaseUrl = "https://openrouter.ai/api/v1"
    console.log(`[LLMHelper] Switched to OpenRouter: ${this.openaiModel}`)
  }

  public async switchToMistral(apiKey: string, model?: string): Promise<void> {
    this.provider = "mistral"
    this.openaiApiKey = apiKey
    this.openaiModel = model || "mistral-large-latest"
    this.openaiBaseUrl = "https://api.mistral.ai/v1"
    console.log(`[LLMHelper] Switched to Mistral: ${this.openaiModel}`)
  }

  public async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.provider === "ollama") {
        const available = await this.checkOllamaAvailable()
        if (!available) return { success: false, error: `Ollama not available at ${this.ollamaUrl}` }
        await this.callOllama("Hello")
      } else if (this.provider === "openrouter" || this.provider === "mistral") {
        await this.callOpenAICompatible([{ role: "user", content: "Hello" }])
      } else {
        const result = await this.geminiModel.generateContent("Hello")
        if (!result.response.text()) return { success: false, error: "Empty response from Gemini" }
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
