const { spawn, spawnSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const electronPackageDir = path.join(__dirname, "..", "node_modules", "electron")
const electronInstallScript = path.join(electronPackageDir, "install.js")

function runElectronInstallIfNeeded() {
  const distDir = path.join(electronPackageDir, "dist")
  const electronBinary = process.platform === "win32"
    ? path.join(distDir, "electron.exe")
    : path.join(distDir, "electron")

  if (fs.existsSync(electronBinary)) {
    return
  }

  if (!fs.existsSync(electronInstallScript)) {
    return
  }

  const result = spawnSync(process.execPath, [electronInstallScript], {
    stdio: "inherit",
    env: process.env
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(
      `Electron install script failed with exit code ${result.status}.`
    )
  }
}

function resolveElectronBinary() {
  runElectronInstallIfNeeded()

  const distDir = path.join(electronPackageDir, "dist")
  const candidates = process.platform === "win32"
    ? [path.join(distDir, "electron.exe"), path.join(distDir, "electron")]
    : [path.join(distDir, "electron")]

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
