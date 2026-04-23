import fs from "fs"

// ─── Provider types ───────────────────────────────────────────────────────────
type Provider = "gemini" | "ollama" | "openrouter" | "mistral"

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
  private readonly systemPrompt = `You are Wingman AI, a helpful, proactive assistant for any kind of problem or situation (not just coding). For any user input, analyze the situation, provide a clear problem statement, relevant context, and suggest several possible responses or actions the user could take next. Always explain your reasoning. Present your suggestions as a list of options or next steps.`

  // Gemini
  private geminiModel: any = null

  // Ollama
  private ollamaModel: string = "llama3.2"
  private ollamaUrl: string = "http://localhost:11434"

  // OpenRouter / Mistral (OpenAI-compatible)
  private openaiApiKey: string = ""
  private openaiModel: string = ""
  private openaiBaseUrl: string = ""

  constructor(
    apiKey?: string,
    useOllama: boolean = false,
    ollamaModel?: string,
    ollamaUrl?: string,
    useOpenRouter: boolean = false,
    openRouterModel?: string,
    useMistral: boolean = false,
    mistralModel?: string
  ) {
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
      this.geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
      console.log("[LLMHelper] Using Google Gemini")

    } else {
      throw new Error("No valid provider configured. Set OPENROUTER_API_KEY, MISTRAL_API_KEY, GEMINI_API_KEY, or USE_OLLAMA=true")
    }
  }

  // ─── Utilities ──────────────────────────────────────────────────────────────

  private cleanJsonResponse(text: string): string {
    text = text.replace(/^```(?:json)?\n/, "").replace(/\n```$/, "")
    return text.trim()
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
        return await this.callOllama(message)
      } else if (this.provider === "openrouter" || this.provider === "mistral") {
        return await this.callOpenAICompatible([
          { role: "system", content: this.systemPrompt },
          { role: "user", content: message },
        ])
      } else {
        const result = await this.geminiModel.generateContent(message)
        return result.response.text()
      }
    } catch (error: any) {
      console.error("[LLMHelper] Error in chat:", error)
      throw error
    }
  }

  // ─── Image extraction ────────────────────────────────────────────────────────

  public async extractProblemFromImages(imagePaths: string[]) {
    const jsonPrompt = `${this.systemPrompt}\n\nAnalyze these images and extract the following information in JSON format:\n{\n  "problem_statement": "A clear statement of the problem or situation.",\n  "context": "Relevant background or context from the images.",\n  "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],\n  "reasoning": "Explanation of why these suggestions are appropriate."\n}\nImportant: Return ONLY the JSON object, without any markdown formatting or code blocks.`

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
    const prompt = `${this.systemPrompt}\n\nGiven this problem or situation:\n${JSON.stringify(problemInfo, null, 2)}\n\nProvide your response in this JSON format:\n{\n  "solution": {\n    "code": "The code or main answer here.",\n    "problem_statement": "Restate the problem or situation.",\n    "context": "Relevant background/context.",\n    "suggested_responses": ["First possible answer or action", "Second possible answer or action", "..."],\n    "reasoning": "Explanation of why these suggestions are appropriate."\n  }\n}\nImportant: Return ONLY the JSON object, without any markdown formatting or code blocks.`

    console.log(`[LLMHelper] Calling ${this.provider} for solution...`)
    try {
      let text: string
      if (this.provider === "openrouter" || this.provider === "mistral") {
        text = await this.callOpenAICompatible([
          { role: "system", content: this.systemPrompt },
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
    const prompt = `${this.systemPrompt}\n\nGiven:\n1. Original problem: ${JSON.stringify(problemInfo, null, 2)}\n2. Current response: ${currentCode}\n3. Debug images provided\n\nAnalyze and provide feedback in this JSON format:\n{\n  "solution": {\n    "code": "The code or main answer here.",\n    "problem_statement": "Restate the problem.",\n    "context": "Relevant background/context.",\n    "suggested_responses": ["First possible answer", "Second possible answer", "..."],\n    "reasoning": "Explanation of suggestions."\n  }\n}\nReturn ONLY the JSON object.`

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
    const prompt = `${this.systemPrompt}\n\nDescribe the content of this image concisely. Suggest several possible actions or responses the user could take. Answer naturally and briefly.`

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
      const prompt = `${this.systemPrompt}\n\nDescribe this audio clip concisely. Suggest possible actions or responses. Answer naturally.`
      const result = await this.geminiModel.generateContent([prompt, audioPart])
      return { text: result.response.text(), timestamp: Date.now() }
    } catch (error) {
      console.error("Error analyzing audio file:", error)
      throw error
    }
  }

  public async analyzeAudioFromBase64(data: string, mimeType: string) {
    if (this.provider !== "gemini") {
      return {
        text: "Audio analysis requires Gemini. Currently using " + this.provider + ". Please take a screenshot instead.",
        timestamp: Date.now(),
      }
    }

    try {
      const audioPart = { inlineData: { data, mimeType } }
      const prompt = `${this.systemPrompt}\n\nDescribe this audio clip concisely. Suggest possible next actions. Be brief.`
      const result = await this.geminiModel.generateContent([prompt, audioPart])
      return { text: result.response.text(), timestamp: Date.now() }
    } catch (error) {
      console.error("Error analyzing audio from base64:", error)
      throw error
    }
  }

  // ─── Provider info & switching ───────────────────────────────────────────────

  public getCurrentProvider(): Provider {
    return this.provider
  }

  public getCurrentModel(): string {
    if (this.provider === "ollama") return this.ollamaModel
    if (this.provider === "openrouter" || this.provider === "mistral") return this.openaiModel
    return "gemini-2.0-flash"
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

  public async switchToGemini(apiKey?: string): Promise<void> {
    if (apiKey) {
      const { GoogleGenerativeAI } = require("@google/generative-ai")
      const genAI = new GoogleGenerativeAI(apiKey)
      this.geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    }
    if (!this.geminiModel) throw new Error("No Gemini API key provided")
    this.provider = "gemini"
    console.log("[LLMHelper] Switched to Gemini")
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
