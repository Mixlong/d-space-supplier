const fs = require("fs")
const path = require("path")

const projectRoot = process.cwd()
const packageJsonPath = path.join(projectRoot, "package.json")
const tauriConfigPath = path.join(projectRoot, "src-tauri", "tauri.conf.json")

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

const pkg = readJson(packageJsonPath)
const tauriConfig = readJson(tauriConfigPath)

if (!pkg.version || typeof pkg.version !== "string") {
  throw new Error("package.json version is missing or invalid")
}

const packageVersion = pkg.version.trim()
if (!packageVersion) {
  throw new Error("package.json version is empty")
}

if (tauriConfig.version === packageVersion) {
  console.log(`[sync-tauri-version] already synced: ${packageVersion}`)
  process.exit(0)
}

tauriConfig.version = packageVersion
writeJson(tauriConfigPath, tauriConfig)
console.log(`[sync-tauri-version] synced tauri version -> ${packageVersion}`)
