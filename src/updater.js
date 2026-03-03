import { check } from "@tauri-apps/plugin-updater"

export async function checkForAppUpdate() {
  const update = await check()
  if (!update) return { updated: false, version: null }

  await update.downloadAndInstall()
  return { updated: true, version: update.version }
}
