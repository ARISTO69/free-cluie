const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

function resolveElectronBinary() {
  const distDir = path.join(__dirname, "..", "node_modules", "electron", "dist")
  const candidates = process.platform === "win32"
    ? [
        path.join(distDir, "electron.exe"),
        path.join(distDir, "electron")
      ]
    : [
        path.join(distDir, "electron")
      ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  throw new Error(
    `Unable to find the Electron binary in ${distDir}. Reinstall node_modules and try again.`
  )
}

const electronBinary = resolveElectronBinary()
const child = spawn(electronBinary, process.argv.slice(2), {
  stdio: "inherit",
  windowsHide: false
})

child.on("close", (code, signal) => {
  if (code === null) {
    console.error(electronBinary, "exited with signal", signal)
    process.exit(1)
  }

  process.exit(code)
})
