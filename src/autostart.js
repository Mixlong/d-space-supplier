import { enable, isEnabled } from "@tauri-apps/plugin-autostart"

function isTauriDesktop() {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__)
}

export async function ensureAutoStartEnabled() {
  if (!isTauriDesktop()) return

  try {
    const enabled = await isEnabled()
    if (enabled) return
    await enable()
  } catch (error) {
    console.error("[autostart] enable failed:", error)
  }
}
