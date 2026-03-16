import { ElLoading, ElMessage, ElMessageBox } from "element-plus"
import { invoke } from "@tauri-apps/api/core"
import { openUrl } from "@tauri-apps/plugin-opener"
import { check } from "@tauri-apps/plugin-updater"

function isTauriDesktop() {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__)
}

function buildUpdateErrorMessage(error) {
  const raw = String(error?.message || error || "未知错误")
  if (/Cross-device link|os error 18/i.test(raw)) {
    return "安装失败：应用当前不在可替换位置运行。请将 D-Space.app 拖到 /Applications 后从应用程序目录启动，再重试更新。"
  }
  return `检查更新失败：${raw}`
}

function isInstallLocationError(error) {
  const raw = String(error?.message || error || "")
  return /Cross-device link|os error 18/i.test(raw)
}

function resolveManualDownloadUrl(updateUrl) {
  const fallback = "https://bikewise.oss-cn-shenzhen.aliyuncs.com/d-space/supplier-desktop/darwin/D-Space.tar.gz"
  if (!updateUrl) return fallback
  try {
    const parsed = new URL(updateUrl)
    parsed.search = ""
    parsed.hash = ""
    return parsed.toString()
  } catch {
    return fallback
  }
}

async function restartApp() {
  try {
    await invoke("restart_app")
  } catch (error) {
    console.error("[updater] auto restart failed:", error)
    ElMessage.warning("已安装更新，请手动重启应用生效")
  }
}

export async function checkForAppUpdateWithPrompt() {
  if (!isTauriDesktop()) return

  let loading = null
  let manualDownloadUrl = ""
  try {
    const update = await check()
    if (!update) return
    manualDownloadUrl = resolveManualDownloadUrl(String(update.rawJson?.url || ""))

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

    let totalBytes = 0
    let downloadedBytes = 0
    loading = ElLoading.service({
      lock: true,
      text: "正在下载更新 0%",
      background: "rgba(0, 0, 0, 0.45)",
    })

    await update.download((progress) => {
      if (progress.event === "Started") {
        totalBytes = Number(progress.data?.contentLength || 0)
        downloadedBytes = 0
        loading?.setText("正在下载更新 0%")
        return
      }
      if (progress.event === "Progress") {
        downloadedBytes += Number(progress.data?.chunkLength || 0)
        if (totalBytes > 0) {
          const percent = Math.min(100, Math.floor((downloadedBytes / totalBytes) * 100))
          loading?.setText(`正在下载更新 ${percent}%`)
        } else {
          const mb = (downloadedBytes / 1024 / 1024).toFixed(2)
          loading?.setText(`正在下载更新 ${mb} MB`)
        }
        return
      }
      loading?.setText("下载完成，正在安装...")
    })

    await update.install()
    ElMessage.success("更新已安装，正在自动重启...")
    await restartApp()
  } catch (error) {
    if (error === "cancel" || error === "close") return
    console.error("[updater] check/update failed:", error)
    const message = buildUpdateErrorMessage(error)
    if (isInstallLocationError(error)) {
      await ElMessageBox.confirm(
        `${message}\n\n是否立即手动下载安装包？\n\nmacOS 下载的是压缩包，解压后请将 D-Space.app 拖到 /Applications 再打开。`,
        "更新失败",
        {
          confirmButtonText: "手动下载",
          cancelButtonText: "取消",
          type: "error",
          closeOnClickModal: false,
        }
      )
      await openUrl(manualDownloadUrl)
      ElMessage.success("已打开下载链接，浏览器会保存到默认下载目录")
    } else {
      ElMessage.error(message)
    }
  } finally {
    loading?.close()
  }
}
