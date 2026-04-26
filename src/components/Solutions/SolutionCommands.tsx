import React, { useState, useEffect, useRef } from "react"
import { IoLogOutOutline } from "react-icons/io5"

interface SolutionCommandsProps {
  onTooltipVisibilityChange?: (visible: boolean, height: number) => void
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

const SolutionCommands: React.FC<SolutionCommandsProps> = ({
  onTooltipVisibilityChange
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (onTooltipVisibilityChange) {
      let tooltipHeight = 0
      if (tooltipRef.current && isTooltipVisible) {
        tooltipHeight = tooltipRef.current.offsetHeight + 10
      }
      onTooltipVisibilityChange(isTooltipVisible, tooltipHeight)
    }
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

  return (
    <div>
      <div className="pt-2 w-fit">
        <div className="theme-command-bar text-xs text-white/90 backdrop-blur-md bg-black/60 rounded-lg py-2 px-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 whitespace-nowrap">
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
                  style={{ zIndex: 100 }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium whitespace-nowrap">
                        Keyboard Shortcuts
                      </h3>
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

          <div className="flex items-center gap-2 whitespace-nowrap">
            <button
              className="bg-white/10 hover:bg-white/20 transition-colors rounded-md px-2 py-1 text-[11px] leading-none text-white/70"
              onClick={handleScreenshot}
              type="button"
            >
              Screenshot
            </button>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            <button
              className="bg-white/10 hover:bg-white/20 transition-colors rounded-md px-2 py-1 text-[11px] leading-none text-white/70"
              onClick={handleAreaScreenshot}
              type="button"
            >
              Area SS
            </button>
          </div>

          <button
            className="text-red-500/70 hover:text-red-500/90 transition-colors hover:cursor-pointer"
            title="Sign Out"
            onClick={() => window.electronAPI.quitApp()}
          >
            <IoLogOutOutline className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SolutionCommands
