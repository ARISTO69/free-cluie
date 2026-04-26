// ScreenshotHelper.ts

import path from "node:path"
import fs from "node:fs"
import { app, BrowserWindow, ipcMain, screen } from "electron"
import { v4 as uuidv4 } from "uuid"
import screenshot from "screenshot-desktop"
import sharp from "sharp"

type SelectionBounds = {
  x: number
  y: number
  width: number
  height: number
}

export class ScreenshotHelper {
  private screenshotQueue: string[] = []
  private extraScreenshotQueue: string[] = []
  private readonly MAX_SCREENSHOTS = 5

  private readonly screenshotDir: string
  private readonly extraScreenshotDir: string

  private view: "queue" | "solutions" = "queue"

  constructor(view: "queue" | "solutions" = "queue") {
    this.view = view

    // Initialize directories
    this.screenshotDir = path.join(app.getPath("userData"), "screenshots")
    this.extraScreenshotDir = path.join(
      app.getPath("userData"),
      "extra_screenshots"
    )

    // Create directories if they don't exist
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir)
    }
    if (!fs.existsSync(this.extraScreenshotDir)) {
      fs.mkdirSync(this.extraScreenshotDir)
    }
  }

  public getView(): "queue" | "solutions" {
    return this.view
  }

  public setView(view: "queue" | "solutions"): void {
    this.view = view
  }

  public getScreenshotQueue(): string[] {
    return this.screenshotQueue
  }

  public getExtraScreenshotQueue(): string[] {
    return this.extraScreenshotQueue
  }

  public clearQueues(): void {
    // Clear screenshotQueue
    this.screenshotQueue.forEach((screenshotPath) => {
      fs.unlink(screenshotPath, (err) => {
        if (err)
          console.error(`Error deleting screenshot at ${screenshotPath}:`, err)
      })
    })
    this.screenshotQueue = []

    // Clear extraScreenshotQueue
    this.extraScreenshotQueue.forEach((screenshotPath) => {
      fs.unlink(screenshotPath, (err) => {
        if (err)
          console.error(
            `Error deleting extra screenshot at ${screenshotPath}:`,
            err
          )
      })
    })
    this.extraScreenshotQueue = []
  }

  public async takeScreenshot(
    hideMainWindow: () => void,
    showMainWindow: () => void
  ): Promise<string> {
    try {
      hideMainWindow()
      
      // Add a small delay to ensure window is hidden
      await new Promise(resolve => setTimeout(resolve, 100))
      
      let screenshotPath = ""

      if (this.view === "queue") {
        screenshotPath = path.join(this.screenshotDir, `${uuidv4()}.png`)
        await screenshot({ filename: screenshotPath })

        this.screenshotQueue.push(screenshotPath)
        if (this.screenshotQueue.length > this.MAX_SCREENSHOTS) {
          const removedPath = this.screenshotQueue.shift()
          if (removedPath) {
            try {
              await fs.promises.unlink(removedPath)
            } catch (error) {
              console.error("Error removing old screenshot:", error)
            }
          }
        }
      } else {
        screenshotPath = path.join(this.extraScreenshotDir, `${uuidv4()}.png`)
        await screenshot({ filename: screenshotPath })

        this.extraScreenshotQueue.push(screenshotPath)
        if (this.extraScreenshotQueue.length > this.MAX_SCREENSHOTS) {
          const removedPath = this.extraScreenshotQueue.shift()
          if (removedPath) {
            try {
              await fs.promises.unlink(removedPath)
            } catch (error) {
              console.error("Error removing old screenshot:", error)
            }
          }
        }
      }

      return screenshotPath
    } catch (error) {
      console.error("Error taking screenshot:", error)
      throw new Error(`Failed to take screenshot: ${error.message}`)
    } finally {
      // Ensure window is always shown again
      showMainWindow()
    }
  }

  public async takeAreaScreenshot(
    hideMainWindow: () => void,
    showMainWindow: () => void
  ): Promise<string> {
    try {
      hideMainWindow()
      await new Promise((resolve) => setTimeout(resolve, 100))

      const display = screen.getPrimaryDisplay()
      const selection = await this.selectScreenshotArea(display.bounds)
      const screenshotPath = this.getNextScreenshotPath()
      const fullScreenshotPath = path.join(
        path.dirname(screenshotPath),
        `${uuidv4()}-full.png`
      )

      await screenshot({ filename: fullScreenshotPath })

      const scaleFactor = display.scaleFactor || 1
      await sharp(fullScreenshotPath)
        .extract({
          left: Math.max(0, Math.round(selection.x * scaleFactor)),
          top: Math.max(0, Math.round(selection.y * scaleFactor)),
          width: Math.max(1, Math.round(selection.width * scaleFactor)),
          height: Math.max(1, Math.round(selection.height * scaleFactor))
        })
        .png()
        .toFile(screenshotPath)

      await fs.promises
        .unlink(fullScreenshotPath)
        .catch((): undefined => undefined)
      await this.addScreenshotToQueue(screenshotPath)

      return screenshotPath
    } catch (error) {
      console.error("Error taking area screenshot:", error)
      throw new Error(`Failed to take area screenshot: ${error.message}`)
    } finally {
      showMainWindow()
    }
  }

  private getNextScreenshotPath(): string {
    const targetDir =
      this.view === "queue" ? this.screenshotDir : this.extraScreenshotDir
    return path.join(targetDir, `${uuidv4()}.png`)
  }

  private async addScreenshotToQueue(screenshotPath: string): Promise<void> {
    const queue =
      this.view === "queue" ? this.screenshotQueue : this.extraScreenshotQueue

    queue.push(screenshotPath)
    if (queue.length > this.MAX_SCREENSHOTS) {
      const removedPath = queue.shift()
      if (removedPath) {
        try {
          await fs.promises.unlink(removedPath)
        } catch (error) {
          console.error("Error removing old screenshot:", error)
        }
      }
    }
  }

  private selectScreenshotArea(
    bounds: Electron.Rectangle
  ): Promise<SelectionBounds> {
    return new Promise((resolve, reject) => {
      const overlayWindow = new BrowserWindow({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        frame: false,
        transparent: true,
        resizable: false,
        movable: false,
        fullscreenable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      })

      const cleanup = (): void => {
        ipcMain.removeListener("area-screenshot-selected", handleSelected)
        ipcMain.removeListener("area-screenshot-cancelled", handleCancelled)
        if (!overlayWindow.isDestroyed()) {
          overlayWindow.close()
        }
      }

      const handleSelected = (
        _event: Electron.IpcMainEvent,
        rect: SelectionBounds
      ): void => {
        cleanup()
        if (rect.width < 2 || rect.height < 2) {
          reject(new Error("Selected area is too small"))
          return
        }
        resolve(rect)
      }

      const handleCancelled = (): void => {
        cleanup()
        reject(new Error("Area screenshot cancelled"))
      }

      ipcMain.once("area-screenshot-selected", handleSelected)
      ipcMain.once("area-screenshot-cancelled", handleCancelled)

      overlayWindow.setAlwaysOnTop(true, "screen-saver")
      overlayWindow.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(this.getSelectionOverlayHtml())}`
      )
      overlayWindow.once("ready-to-show", (): void => {
        overlayWindow.show()
        overlayWindow.focus()
      })
    })
  }

  private getSelectionOverlayHtml(): string {
    return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        cursor: crosshair;
        user-select: none;
        background: rgba(0, 0, 0, 0.18);
        font-family: Inter, Arial, sans-serif;
      }
      #hint {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        padding: 8px 12px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.72);
        color: white;
        font-size: 12px;
        border: 1px solid rgba(255, 255, 255, 0.18);
      }
      #selection {
        position: fixed;
        display: none;
        border: 2px solid #ffffff;
        background: rgba(255, 255, 255, 0.16);
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.38);
      }
    </style>
  </head>
  <body>
    <div id="hint">Drag to select an area. Press Esc to cancel.</div>
    <div id="selection"></div>
    <script>
      const { ipcRenderer } = require("electron");
      const selection = document.getElementById("selection");
      let startX = 0;
      let startY = 0;
      let currentRect = null;
      let isDragging = false;

      const updateSelection = (event) => {
        const x = Math.min(startX, event.clientX);
        const y = Math.min(startY, event.clientY);
        const width = Math.abs(event.clientX - startX);
        const height = Math.abs(event.clientY - startY);
        currentRect = { x, y, width, height };
        selection.style.display = "block";
        selection.style.left = x + "px";
        selection.style.top = y + "px";
        selection.style.width = width + "px";
        selection.style.height = height + "px";
      };

      window.addEventListener("mousedown", (event) => {
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        updateSelection(event);
      });

      window.addEventListener("mousemove", (event) => {
        if (isDragging) updateSelection(event);
      });

      window.addEventListener("mouseup", () => {
        if (!isDragging || !currentRect) return;
        isDragging = false;
        ipcRenderer.send("area-screenshot-selected", currentRect);
      });

      window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          ipcRenderer.send("area-screenshot-cancelled");
        }
      });
    </script>
  </body>
</html>`
  }

  public async getImagePreview(filepath: string): Promise<string> {
    try {
      const data = await fs.promises.readFile(filepath)
      return `data:image/png;base64,${data.toString("base64")}`
    } catch (error) {
      console.error("Error reading image:", error)
      throw error
    }
  }

  public async deleteScreenshot(
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await fs.promises.unlink(path)
      if (this.view === "queue") {
        this.screenshotQueue = this.screenshotQueue.filter(
          (filePath) => filePath !== path
        )
      } else {
        this.extraScreenshotQueue = this.extraScreenshotQueue.filter(
          (filePath) => filePath !== path
        )
      }
      return { success: true }
    } catch (error) {
      console.error("Error deleting file:", error)
      return { success: false, error: error.message }
    }
  }
}
