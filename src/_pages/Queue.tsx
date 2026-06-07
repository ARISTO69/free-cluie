import React, { useState, useEffect, useRef } from "react"
import { useQuery } from "react-query"
import ScreenshotQueue from "../components/Queue/ScreenshotQueue"
import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastVariant,
  ToastMessage
} from "../components/ui/toast"
import QueueCommands from "../components/Queue/QueueCommands"
import ModelSelector from "../components/ui/ModelSelector"
import { UITheme } from "../types/theme"
import { Mic } from "lucide-react"

type Provider = "ollama" | "gemini" | "openai" | "openrouter" | "mistral" | "custom"

interface QueueProps {
  setView: React.Dispatch<React.SetStateAction<"queue" | "solutions" | "debug">>
  uiTheme: UITheme
  onThemeChange: (theme: UITheme) => void
}

const Queue: React.FC<QueueProps> = ({ setView, uiTheme, onThemeChange }) => {
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<ToastMessage>({
    title: "",
    description: "",
    variant: "neutral"
  })

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "gemini"; text: string }[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const [practicalInput, setPracticalInput] = useState("")
  const [practicalMessages, setPracticalMessages] = useState<{ role: "user" | "gemini"; text: string }[]>([])
  const [practicalLoading, setPracticalLoading] = useState(false)
  const [isPracticalOpen, setIsPracticalOpen] = useState(false)
  const practicalInputRef = useRef<HTMLInputElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentModel, setCurrentModel] = useState<{ provider: string; model: string }>({
    provider: "gemini",
    model: "gemini-2.0-flash"
  })

  const barRef = useRef<HTMLDivElement>(null)

  const { data: screenshots = [], refetch } = useQuery<Array<{ path: string; preview: string }>, Error>(
    ["screenshots"],
    async () => {
      try {
        const existing = await window.electronAPI.getScreenshots()
        return existing
      } catch (error) {
        console.error("Error loading screenshots:", error)
        showToast("Error", "Failed to load existing screenshots", "error")
        return []
      }
    },
    {
      staleTime: Infinity,
      cacheTime: Infinity,
      refetchOnWindowFocus: true,
      refetchOnMount: true
    }
  )

  const showToast = (
    title: string,
    description: string,
    variant: ToastVariant
  ) => {
    setToastMessage({ title, description, variant })
    setToastOpen(true)
  }

  const getProviderLabel = (provider: Provider | string) => {
    switch (provider) {
      case "ollama":
        return "Ollama"
      case "openai":
        return "OpenAI"
      case "openrouter":
        return "OpenRouter"
      case "mistral":
        return "Mistral"
      case "custom":
        return "Custom"
      default:
        return "Gemini"
    }
  }

  const handleDeleteScreenshot = async (index: number) => {
    const screenshotToDelete = screenshots[index]

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path
      )

      if (response.success) {
        refetch()
      } else {
        console.error("Failed to delete screenshot:", response.error)
        showToast("Error", "Failed to delete the screenshot file", "error")
      }
    } catch (error) {
      console.error("Error deleting screenshot:", error)
    }
  }

  const handleChatSend = async () => {
    if (!chatInput.trim()) return
    setChatMessages((msgs) => [...msgs, { role: "user", text: chatInput }])
    setChatLoading(true)
    setChatInput("")
    try {
      const response = await window.electronAPI.invoke("gemini-chat", chatInput)
      setChatMessages((msgs) => [...msgs, { role: "gemini", text: response }])
    } catch (err) {
      setChatMessages((msgs) => [...msgs, { role: "gemini", text: "Error: " + String(err) }])
    } finally {
      setChatLoading(false)
      chatInputRef.current?.focus()
    }
  }

  const handlePracticalSend = async () => {
    if (!practicalInput.trim()) return
    const message = practicalInput
    setPracticalMessages((msgs) => [...msgs, { role: "user", text: message }])
    setPracticalLoading(true)
    setPracticalInput("")
    try {
      const response = await window.electronAPI.invoke("practical-chat", message)
      setPracticalMessages((msgs) => [...msgs, { role: "gemini", text: response }])
    } catch (err) {
      setPracticalMessages((msgs) => [...msgs, { role: "gemini", text: "Error: " + String(err) }])
    } finally {
      setPracticalLoading(false)
      practicalInputRef.current?.focus()
    }
  }

  const handleRecordClick = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        audioChunks.current = []
        recorder.ondataavailable = (event) => audioChunks.current.push(event.data)
        recorder.onstop = async () => {
          const blob = new Blob(audioChunks.current, {
            type: audioChunks.current[0]?.type || "audio/webm"
          })
          audioChunks.current = []
          stream.getTracks().forEach((track) => track.stop())
          setChatLoading(true)
          try {
            const reader = new FileReader()
            const base64Data = await new Promise<string>((resolve, reject) => {
              reader.onerror = () => reject(reader.error)
              reader.onloadend = () => resolve((reader.result as string).split(",")[1])
              reader.readAsDataURL(blob)
            })
            const result = await window.electronAPI.analyzeAudioFromBase64(
              base64Data,
              blob.type
            )
            setChatMessages((msgs) => [...msgs, { role: "gemini", text: result.text }])
          } catch (error) {
            setChatMessages((msgs) => [...msgs, { role: "gemini", text: "Audio analysis failed: " + String(error) }])
          } finally {
            setChatLoading(false)
            chatInputRef.current?.focus()
          }
        }
        setMediaRecorder(recorder)
        recorder.start()
        setIsRecording(true)
      } catch (error) {
        setChatMessages((msgs) => [...msgs, { role: "gemini", text: "Could not start microphone recording: " + String(error) }])
      }
    } else {
      mediaRecorder?.stop()
      setIsRecording(false)
      setMediaRecorder(null)
    }
  }

  useEffect(() => {
    const loadCurrentModel = async () => {
      try {
        const config = await window.electronAPI.getCurrentLlmConfig()
        setCurrentModel({ provider: config.provider, model: config.model })
      } catch (error) {
        console.error("Error loading current model config:", error)
      }
    }
    loadCurrentModel()
  }, [])

  useEffect(() => {
    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        if (isTooltipVisible) {
          contentHeight += tooltipHeight
        }
        window.electronAPI.updateContentDimensions({
          width: contentWidth,
          height: contentHeight
        })
      }
    }

    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(() => refetch()),
      window.electronAPI.onResetView(() => refetch()),
      window.electronAPI.onSolutionError((error: string) => {
        showToast(
          "Processing Failed",
          "There was an error processing your screenshots.",
          "error"
        )
        setView("queue")
        console.error("Processing error:", error)
      }),
      window.electronAPI.onProcessingNoScreenshots(() => {
        showToast(
          "No Screenshots",
          "There are no screenshots to process.",
          "neutral"
        )
      })
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [isTooltipVisible, tooltipHeight, refetch, setView])

  useEffect(() => {
    const unsubscribe = window.electronAPI.onScreenshotTaken(async (data) => {
      await refetch()
      setChatLoading(true)
      try {
        const latest = data?.path || (Array.isArray(data) && data.length > 0 && data[data.length - 1]?.path)
        if (latest) {
          const response = await window.electronAPI.invoke("analyze-image-file", latest)
          setChatMessages((msgs) => [...msgs, { role: "gemini", text: response.text }])
        }
      } catch (err) {
        setChatMessages((msgs) => [...msgs, { role: "gemini", text: "Error: " + String(err) }])
      } finally {
        setChatLoading(false)
      }
    })
    return () => {
      unsubscribe && unsubscribe()
    }
  }, [refetch])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible)
    setTooltipHeight(height)
  }

  const handleChatToggle = () => {
    setIsChatOpen((open) => !open)
    setIsPracticalOpen(false)
  }

  const handlePracticalToggle = () => {
    setIsPracticalOpen((open) => !open)
    setIsChatOpen(false)
  }

  const handleSettingsToggle = () => {
    setIsSettingsOpen(!isSettingsOpen)
  }

  const handleModelChange = (provider: Provider, model: string) => {
    setCurrentModel({ provider, model })
    setChatMessages((msgs) => [...msgs, {
      role: "gemini",
      text: `Switched to ${getProviderLabel(provider)} ${model}. Ready for your questions!`
    }])
  }

  return (
    <div
      ref={barRef}
      style={{
        position: "relative",
        width: "100%",
        pointerEvents: "auto"
      }}
      className="select-none"
    >
      <div className="bg-transparent w-full">
        <div className="px-2 py-1">
          <Toast
            open={toastOpen}
            onOpenChange={setToastOpen}
            variant={toastMessage.variant}
            duration={3000}
          >
            <ToastTitle>{toastMessage.title}</ToastTitle>
            <ToastDescription>{toastMessage.description}</ToastDescription>
          </Toast>
          <div className="w-fit">
            <QueueCommands
              onTooltipVisibilityChange={handleTooltipVisibilityChange}
              onPracticalToggle={handlePracticalToggle}
              onChatToggle={handleChatToggle}
              onSettingsToggle={handleSettingsToggle}
              uiTheme={uiTheme}
              onThemeChange={onThemeChange}
            />
          </div>
          {isSettingsOpen && (
            <div className="mt-4 w-full mx-auto">
              <ModelSelector
                onModelChange={handleModelChange}
                onChatOpen={() => setIsChatOpen(true)}
                uiTheme={uiTheme}
                onThemeChange={onThemeChange}
              />
            </div>
          )}

          {isPracticalOpen && (
            <div className="mt-4 w-full mx-auto liquid-glass chat-container p-4 flex flex-col select-text">
              <div className="flex-1 overflow-y-auto mb-3 p-3 rounded-lg bg-white/10 backdrop-blur-md max-h-64 min-h-[120px] glass-content border border-white/20 shadow-lg select-text">
                {practicalMessages.length === 0 ? (
                  <div className="text-sm text-gray-600 text-center mt-8">
                    Practical with {getProviderLabel(currentModel.provider)} {currentModel.model}
                    <br />
                    <span className="text-xs text-gray-500">Ask for step-by-step help to complete your experiment</span>
                    <br />
                    <span className="text-xs text-gray-500">Previous practical outputs are saved to practical-memory.md</span>
                  </div>
                ) : (
                  practicalMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`w-full flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-3`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs shadow-md backdrop-blur-sm border ${
                          msg.role === "user"
                            ? "bg-gray-700/80 text-gray-100 ml-12 border-gray-600/40"
                            : "bg-white/85 text-gray-700 mr-12 border-gray-200/50"
                        } ai-response-text select-text`}
                        style={{ lineHeight: "1.4" }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {practicalLoading && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-white/85 text-gray-600 px-3 py-1.5 rounded-xl text-xs backdrop-blur-sm border border-gray-200/50 shadow-md mr-12 select-text">
                      <span className="inline-flex items-center">
                        <span className="animate-pulse text-gray-400">.</span>
                        <span className="animate-pulse animation-delay-200 text-gray-400">.</span>
                        <span className="animate-pulse animation-delay-400 text-gray-400">.</span>
                        <span className="ml-2">{currentModel.model} is preparing steps...</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <form
                className="flex gap-2 items-center glass-content"
                onSubmit={e => {
                  e.preventDefault()
                  handlePracticalSend()
                }}
              >
                <input
                  ref={practicalInputRef}
                  className="flex-1 rounded-lg px-3 py-2 bg-white/25 backdrop-blur-md text-gray-800 placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400/60 border border-white/40 shadow-lg transition-all duration-200 select-text"
                  placeholder="Ask for practical exam steps..."
                  value={practicalInput}
                  onChange={e => setPracticalInput(e.target.value)}
                  disabled={practicalLoading}
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-gray-600/80 hover:bg-gray-700/80 border border-gray-500/60 flex items-center justify-center transition-all duration-200 backdrop-blur-sm shadow-lg disabled:opacity-50"
                  disabled={practicalLoading || !practicalInput.trim()}
                  tabIndex={-1}
                  aria-label="Send practical message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-7.5-15-7.5v6l10 1.5-10 1.5v6z" />
                  </svg>
                </button>
              </form>
            </div>
          )}

          {isChatOpen && (
            <div className="mt-4 w-full mx-auto liquid-glass chat-container p-4 flex flex-col select-text">
              <div className="flex-1 overflow-y-auto mb-3 p-3 rounded-lg bg-white/10 backdrop-blur-md max-h-64 min-h-[120px] glass-content border border-white/20 shadow-lg select-text">
                {chatMessages.length === 0 ? (
                  <div className="text-sm text-gray-600 text-center mt-8">
                    Chat with {getProviderLabel(currentModel.provider)} {currentModel.model}
                    <br />
                    <span className="text-xs text-gray-500">Take a screenshot (Cmd+H) for automatic analysis</span>
                    <br />
                    <span className="text-xs text-gray-500">Click Models to switch AI providers</span>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`w-full flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-3`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs shadow-md backdrop-blur-sm border ${
                          msg.role === "user"
                            ? "bg-gray-700/80 text-gray-100 ml-12 border-gray-600/40"
                            : "bg-white/85 text-gray-700 mr-12 border-gray-200/50"
                        } ai-response-text select-text`}
                        style={{ lineHeight: "1.4" }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-white/85 text-gray-600 px-3 py-1.5 rounded-xl text-xs backdrop-blur-sm border border-gray-200/50 shadow-md mr-12 select-text">
                      <span className="inline-flex items-center">
                        <span className="animate-pulse text-gray-400">.</span>
                        <span className="animate-pulse animation-delay-200 text-gray-400">.</span>
                        <span className="animate-pulse animation-delay-400 text-gray-400">.</span>
                        <span className="ml-2">{currentModel.model} is replying...</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <form
                className="flex gap-2 items-center glass-content"
                onSubmit={e => {
                  e.preventDefault()
                  handleChatSend()
                }}
              >
                <input
                  ref={chatInputRef}
                  className="flex-1 rounded-lg px-3 py-2 bg-white/25 backdrop-blur-md text-gray-800 placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400/60 border border-white/40 shadow-lg transition-all duration-200 select-text"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  disabled={chatLoading}
                />
                <button
                  type="button"
                  className={`p-2 rounded-lg border flex items-center justify-center transition-all duration-200 backdrop-blur-sm shadow-lg disabled:opacity-50 ${
                    isRecording
                      ? "bg-red-500/80 hover:bg-red-600/80 border-red-400/60 animate-pulse"
                      : "bg-gray-600/80 hover:bg-gray-700/80 border-gray-500/60"
                  }`}
                  onClick={handleRecordClick}
                  disabled={chatLoading}
                  tabIndex={-1}
                  title={isRecording ? "Microphone is recording" : "Record microphone"}
                  aria-label={isRecording ? "Microphone is recording" : "Record microphone"}
                  aria-pressed={isRecording}
                >
                  <Mic className="w-4 h-4 text-white" />
                </button>
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-gray-600/80 hover:bg-gray-700/80 border border-gray-500/60 flex items-center justify-center transition-all duration-200 backdrop-blur-sm shadow-lg disabled:opacity-50"
                  disabled={chatLoading || !chatInput.trim()}
                  tabIndex={-1}
                  aria-label="Send"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-7.5-15-7.5v6l10 1.5-10 1.5v6z" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Queue
