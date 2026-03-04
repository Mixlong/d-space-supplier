import { ElMessage, ElMessageBox } from "element-plus"
import { check } from "@tauri-apps/plugin-updater"

function isTauriDesktop() {
  return typeof window !== "undefined" && /Tauri/i.test(window.navigator?.userAgent || "")
}

export async function checkForAppUpdateWithPrompt() {
  if (!isTauriDesktop()) return

  try {
    const update = await check()
    if (!update) return

    await ElMessageBox.confirm(
      `检测到新版本 ${update.version}，是否立即下载并安装？`,
      "发现新版本",
      {
        confirmButtonText: "立即更新",
        cancelButtonText: "稍后",
        type: "info",
        closeOnClickModal: false,
      }
    )

    await update.downloadAndInstall()
    ElMessage.success("更新已下载完成，请重启应用生效")
  } catch (error) {
    if (error === "cancel") return
    console.error("[updater] check/update failed:", error)
  }
}
