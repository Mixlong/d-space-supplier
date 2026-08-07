import axios from 'axios'
import { ElLoading, ElMessage } from 'element-plus'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

function normalizeDownloadUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl

  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:'
  let targetUrl = rawUrl.trim()

  if (isHttpsPage) {
    if (targetUrl.startsWith('http://')) {
      targetUrl = targetUrl.replace(/^http:\/\//i, 'https://')
    } else if (targetUrl.startsWith('//')) {
      targetUrl = `https:${targetUrl}`
    }
  }

  return targetUrl
}

function getFileNameFromUrl(url) {
  if (!url) return '下载文件'
  const cleanUrl = String(url).split('?')[0]
  const name = cleanUrl.slice(cleanUrl.lastIndexOf('/') + 1) || '下载文件'

  try {
    return decodeURIComponent(name)
  } catch {
    return name
  }
}

function createDownloadLoading() {
  return ElLoading.service({
    lock: true,
    text: '正在下载，请稍候',
    background: 'rgba(0, 0, 0, 0.7)',
  })
}

export async function urlDownload(url) {
  const targetUrl = normalizeDownloadUrl(url)
  if (!targetUrl) throw new Error('下载文件地址为空')

  const response = await axios({
    url: targetUrl,
    method: 'get',
    responseType: 'arraybuffer',
  })
  const blob = new Blob([response.data], { type: response.headers['content-type'] })
  saveAs(blob, getFileNameFromUrl(targetUrl))
}

async function getFile(url) {
  const targetUrl = normalizeDownloadUrl(url)
  const response = await axios({
    method: 'get',
    url: targetUrl,
    responseType: 'arraybuffer',
  })
  return response.data
}

export async function zipFile(value, fileName) {
  const fileUrls = String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  if (!fileUrls.length) {
    ElMessage.error('下载文件地址为空')
    return
  }

  const loading = createDownloadLoading()
  try {
    if (fileUrls.length === 1) {
      await urlDownload(fileUrls[0])
      return
    }

    const zip = new JSZip()
    await Promise.all(fileUrls.map(async url => {
      zip.file(getFileNameFromUrl(url), await getFile(url), { binary: true })
    }))
    saveAs(await zip.generateAsync({ type: 'blob' }), `${fileName || '蓝牙固件'}.zip`)
  } catch (error) {
    console.error(error)
    ElMessage.error('下载文件失败，请稍后重试')
  } finally {
    loading.close()
  }
}
