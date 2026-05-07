import React, { useState, useEffect, useRef } from "react"
import { IoLogOutOutline } from "react-icons/io5"
import { Pin, Settings } from "lucide-react"

interface QueueCommandsProps {
  onTooltipVisibilityChange: (visible: boolean, height: number) => void
  onPracticalToggle: () => void
  onChatToggle: () => void
  onSettingsToggle: () => void
}

const shortcuts = [
  { label: "Show or hide window", keys: ["Ctrl/Cmd", "B"] },
  { label: "Center and show window", keys: ["Ctrl/Cmd", "Shift", "Space"] },
  { label: "Take screenshot", keys: ["Ctrl/Cmd", "H"] },
  { label: "Take area screenshot", keys: ["Ctrl/Cmd", "Shift", "H"] },
  { label: "Solve or debug", keys: ["Ctrl/Cmd", "Enter"] },
  { label: "Start over", keys: ["Ctrl/Cmd", "R"] },
  { label: "Move window", keys: ["Ctrl/Cmd", "Arrow Keys"] },
  { label: "Quit app", keys: ["Ctrl/Cmd", "Q"] }
]

const QueueCommands: React.FC<QueueCommandsProps> = ({
  onTooltipVisibilityChange,
  onPracticalToggle,
  onChatToggle,
  onSettingsToggle
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [alwaysOnTop, setAlwaysOnTop] = useState(true)
  const [isPinSaving, setIsPinSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    window.electronAPI
      .getWindowSettings()
      .then((settings) => {
        if (isMounted) {
          setAlwaysOnTop(settings.alwaysOnTop)
        }
      })
      .catch((error) => {
        console.error("Failed to load window settings:", error)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let tooltipHeight = 0
    if (tooltipRef.current && isTooltipVisible) {
      tooltipHeight = tooltipRef.current.offsetHeight + 10
    }
    onTooltipVisibilityChange(isTooltipVisible, tooltipHeight)
  }, [isTooltipVisible, onTooltipVisibilityChange])

  const handleToggleWindow = () => {
    window.electronAPI.toggleWindow()
  }

  const handleAreaScreenshot = async () => {
    try {
      await window.electronAPI.takeAreaScreenshot()
    } catch (error) {
      console.error("Area screenshot failed:", error)
    }
  }

  const handleScreenshot = async () => {
    try {
      await window.electronAPI.takeScreenshot()
    } catch (error) {
      console.error("Screenshot failed:", error)
    }
  }

  const handlePinToggle = async () => {
    if (isPinSaving) return

    const nextAlwaysOnTop = !alwaysOnTop
    setAlwaysOnTop(nextAlwaysOnTop)
    setIsPinSaving(true)

    try {
      const result = await window.electronAPI.setAlwaysOnTop(nextAlwaysOnTop)
      if (!result.success) {
        setAlwaysOnTop(!nextAlwaysOnTop)
        console.error("Failed to update pin setting:", result.error)
      }
    } catch (error) {
      setAlwaysOnTop(!nextAlwaysOnTop)
      console.error("Failed to update pin setting:", error)
    } finally {
      setIsPinSaving(false)
    }
  }

  return (
    <div className="w-fit">
      <div className="text-xs text-white/90 liquid-glass-bar py-1 px-4 flex items-center justify-center gap-4 draggable-area">
        <div className="flex items-center gap-2">
          <button
            className="interactive text-[11px] leading-none text-white/90 hover:text-white transition-colors cursor-pointer"
            onClick={handleToggleWindow}
            type="button"
          >
            Show/Hide
          </button>
          <div className="relative inline-block interactive">
            <button
              className="theme-help-button bg-white/10 hover:bg-white/20 transition-colors rounded-md px-2 py-1 text-[11px] leading-none text-white/70"
              onClick={() => setIsTooltipVisible((visible) => !visible)}
              type="button"
              aria-expanded={isTooltipVisible}
            >
              Help
            </button>

            {isTooltipVisible && (
              <div
                ref={tooltipRef}
                className="theme-help-popup absolute top-full left-0 mt-2 w-80 interactive rounded-lg p-3 text-xs text-white/90 shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium truncate">Keyboard Shortcuts</h3>
                    <button
                      className="theme-help-button rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70 hover:bg-white/20"
                      onClick={() => setIsTooltipVisible(false)}
                      type="button"
                    >
                      Close
                    </button>
                  </div>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut) => (
                      <div
                        className="flex items-center justify-between gap-3"
                        key={shortcut.label}
                      >
                        <span className="text-[11px] leading-none text-white/80">
                          {shortcut.label}
                        </span>
                        <div className="flex gap-1 flex-shrink-0">
                          {shortcut.keys.map((key) => (
                            <span
                              className="theme-help-key bg-white/10 px-1.5 py-0.5 rounded text-[10px] leading-none"
                              key={key}
                            >
                              {key}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="bg-white/10 hover:bg-white/20 transition-colors rounded-md px-2 py-1 text-[11px] leading-none text-white/70"
            onClick={handleScreenshot}
            type="button"
          >
            Screenshot
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="bg-white/10 hover:bg-white/20 transition-colors rounded-md px-2 py-1 text-[11px] leading-none text-white/70"
            onClick={handleAreaScreenshot}
            type="button"
          >
            Area Screenshot
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="bg-white/10 hover:bg-white/20 transition-colors rounded-md px-2 py-1 text-[11px] leading-none text-white/70 flex items-center gap-1"
            onClick={onPracticalToggle}
            type="button"
          >
            Practical
          </button>
          <button
            className="bg-white/10 hover:bg-white/20 transition-colors rounded-md px-2 py-1 text-[11px] leading-none text-white/70 flex items-center gap-1"
            onClick={onChatToggle}
            type="button"
          >
            Chat
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="bg-white/10 hover:bg-white/20 transition-colors rounded-md p-1.5 text-white/70 flex items-center justify-center"
            onClick={onSettingsToggle}
            type="button"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            className={`bg-white/10 hover:bg-white/20 transition-colors rounded-md p-1.5 text-white/70 flex items-center justify-center border ${
              alwaysOnTop ? "border-white/70 bg-white/20 text-white" : "border-transparent"
            }`}
            onClick={handlePinToggle}
            type="button"
            title={alwaysOnTop ? "Unpin window" : "Pin window above other apps"}
            aria-label={alwaysOnTop ? "Unpin window" : "Pin window above other apps"}
            aria-pressed={alwaysOnTop}
            disabled={isPinSaving}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mx-2 h-4 w-px bg-white/20" />

        <button
          className="text-red-500/70 hover:text-red-500/90 transition-colors hover:cursor-pointer"
          title="Sign Out"
          onClick={() => window.electronAPI.quitApp()}
        >
          <IoLogOutOutline className="w-4 h-4" />
        </button>
      </div>

    </div>
  )
}

export default QueueCommands
