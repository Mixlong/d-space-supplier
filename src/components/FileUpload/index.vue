<template>
  <div
    class="upload-file"
    @dragenter.prevent="handleNativeDragEnter"
    @dragover.prevent="handleNativeDragOver"
    @dragleave.prevent="handleNativeDragLeave"
    @drop.prevent="handleNativeDrop"
  >
    <!-- 媒体模式：统一图片/视频卡片，并可通过 dragGroup 跨组件移动 -->
    <template v-if="mediaMode">
      <div
        class="media-upload-shell"
        :class="{ 'is-native-dragging': nativeDragging, 'is-disabled': disabled }"
      >
        <draggable
          v-model="fileList"
          class="media-file-list"
          item-key="uid"
          :group="mediaDragGroup"
          :animation="160"
          :move="checkMediaMove"
          :data-file-types="normalizedFileTypes.join(',')"
          :data-limit="limit"
          draggable=".media-file-card"
          ghost-class="file-upload-darg"
          :disabled="disabled"
          @change="handleMediaDragChange"
        >
          <template #item="{ element, index }">
            <div class="media-file-card">
              <el-image
                v-if="isImageFile(element.name) || isImageFile(element.url)"
                :src="getFileUrl(element)"
                :preview-src-list="mediaImagePreviewList"
                :initial-index="getImageIndex(element)"
                fit="cover"
                class="media-file-preview"
                preview-teleported
              >
              
                <template #error><div class="media-file-placeholder">图片加载失败</div></template>
              </el-image>
              <video
                v-else-if="isVideoFile(element.name) || isVideoFile(element.url)"
                :src="getFileUrl(element)"
                class="media-file-preview"
                muted
                preload="metadata"
                @click.stop="handlePreview(element)"
              />
              <button v-else type="button" class="media-file-placeholder" @click.stop="handlePreview(element)">
                <div class="media-file-icon" v-html="getFileTypeIconSvg(element.name || element.url)" />
                <span class="media-file-ext-text">{{ getFileExt(element.name || element.url) || 'FILE' }}</span>
              </button>
              <span class="media-file-type">{{ getMediaTypeLabel(element.name || element.url) }}</span>
              <el-tooltip :content="getFileName(element.name || element.url)" placement="top" :show-after="400">
                <span class="media-file-name">{{ getFileName(element.name || element.url) }}</span>
              </el-tooltip>
              <el-button
                v-if="!disabled"
                class="media-file-delete"
                link
                type="danger"
                :icon="Close"
                aria-label="删除文件"
                @click.stop="handleDelete(index)"
              />
            </div>
          </template>
          <template #footer>
            <button v-if="!disabled" type="button" class="media-upload-placeholder" @click="triggerUpload">
              <el-icon><Plus /></el-icon>
              <span>{{ fileList.length ? '拖到这里或继续上传' : '拖到这里或点击上传' }}</span>
            </button>
          </template>
        </draggable>
      </div>
      <el-upload
        ref="uploadRef"
        :action="uploadFileUrl"
        :data="data"
        :limit="limit"
        :multiple="true"
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :on-exceed="handleExceed"
        :disabled="disabled"
        :accept="acceptStr"
        class="hidden-upload"
      >
        <template #trigger><span ref="triggerRef"></span></template>
      </el-upload>
    </template>

    <!-- 紧凑模式：标题 + 按钮在一行，下面文件列表可滚动 -->
    <template v-else-if="compact">
      <div v-if="!hideHeader" class="compact-header">
        <span class="compact-title">{{ title }}</span>
        <el-button v-if="!disabled" type="primary" link class="add-btn" @click="triggerUpload">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
      <div v-if="hideHeader && !disabled && showUploadButton" style="margin-bottom: 20px;">
         <el-button type="primary" icon="Plus" @click="triggerUpload">点击上传</el-button>
      </div>
      <div class="compact-file-list" :class="{ 'layout-row': layout === 'row', 'layout-column': layout === 'column' }" :style="{ maxHeight: listHeight }">
        <div v-if="fileList.length > 0" ref="compactFileListRef" class="file-items">
          <div
            v-for="(file, index) in fileList"
            :key="file.uid"
            class="file-item-preview"
          >
            <!-- 图片类型直接显示缩略图 -->
            <template v-if="isImageFile(file.name)">
              <el-image
                :src="getFileUrl(file)"
                :preview-src-list="imagePreviewList"
                :initial-index="getImageIndex(file)"
                fit="cover"
                class="file-thumbnail"
                preview-teleported
              />
            </template>
            <!-- 其他文件显示图标 -->
            <template v-else>
              <div class="file-icon-box" @click="handlePreview(file)">
                <el-icon class="file-type-icon"><Document /></el-icon>
                <span class="file-ext">{{ getFileExt(file.name) }}</span>
              </div>
            </template>
            <el-tooltip :content="getFileName(file.name)" placement="top" :show-after="500">
              <span class="file-name-text">{{ getFileName(file.name) }}</span>
            </el-tooltip>
          <!-- column 模式下的操作按钮 -->
            <div v-if="layout === 'column'" class="action-btns">
              <el-icon class="preview-btn" @click.stop="handlePreview(file)"><View /></el-icon>
              <el-icon v-if="!disabled" class="delete-btn" @click.stop="handleDelete(index)"><Close /></el-icon>
            </div>
            <!-- row 模式下的删除按钮 -->
            <el-icon v-else-if="!disabled" class="delete-btn" @click.stop="handleDelete(index)"><Close /></el-icon>
          </div>
        </div>
        <div v-else-if="emptyText" class="empty-tip">{{ emptyText }}</div>
      </div>
      <!-- 隐藏的上传组件 -->
      <el-upload
        ref="uploadRef"
        :action="uploadFileUrl"
        :data="data"
        :limit="limit"
        :multiple="true"
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :on-exceed="handleExceed"
        :disabled="disabled"
        :accept="acceptStr"
        class="hidden-upload"
      >
        <template #trigger>
          <span ref="triggerRef"></span>
        </template>
      </el-upload>
    </template>

    <!-- 默认模式 -->
    <template v-else>
      <el-upload
        multiple
        :action="uploadFileUrl"
        ref="fileUpload"
        :before-upload="handleBeforeUpload"
        v-if="!disabled"
        :file-list="fileList"
        :data="data"
        :limit="limit"
        :on-error="handleUploadError"
        :on-exceed="handleExceed"
        :on-success="handleUploadSuccess"
        :show-file-list="false"
        class="upload-file-uploader"
      >
        <el-button type="primary">选取文件</el-button>
      </el-upload>
      <div v-if="showTip && !disabled" class="el-upload__tip">
        请上传
        <template v-if="fileSize">
          大小不超过 <b style="color: #f56c6c">{{ fileSize }}MB</b>
        </template>
        <template v-if="fileType && fileType.length">
          格式为 <b style="color: #f56c6c">{{ fileType.join('/') }}</b>
        </template>
        的文件
      </div>
      <transition-group
        ref="uploadFileList"
        class="upload-file-list el-upload-list el-upload-list--text"
        name="el-fade-in-linear"
        tag="ul"
      >
        <li
          v-for="(file, index) in fileList"
          :key="file.uid"
          class="el-upload-list__item ele-upload-list__item-content"
        >
          <el-link :href="getFileUrl(file)" underline="never" target="_blank">
            <span class="el-icon-document"> {{ getFileName(file.name) }} </span>
          </el-link>
          <div class="ele-upload-list__item-content-action">
            <el-link v-if="!disabled" underline="never" type="danger" @click="handleDelete(index)">&nbsp;删除</el-link>
          </div>
        </li>
      </transition-group>
    </template>

    <!-- 文件预览弹窗 -->
    <FilePreview
      v-model="previewVisible"
      :url="previewUrl"
      :name="previewName"
      :download-handler="downloadHandler"
    />
  </div>
</template>

<script setup>
import { Close, Document, Plus, View } from '@element-plus/icons-vue'
import { ElLoading, ElMessage } from 'element-plus'
import Sortable from 'sortablejs'
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import draggable from 'vuedraggable/dist/vuedraggable.common'

import request from '@/utils/request'
import FilePreview from './FilePreview.vue'

const DEFAULT_UPLOAD_BASE_URL = 'http://config-admin-api.riding-evolved.com'

const props = defineProps({
  modelValue: [ String, Object, Array ],
  action: { type: String, default: '/oss/batch-upload' },
  // 上传服务独立于当前前端环境 API，默认使用配置中心上传域名；其他应用可显式覆盖
  baseUrl: { type: String, default: DEFAULT_UPLOAD_BASE_URL },
  data: { type: Object },
  limit: { type: Number, default: 5 },
  fileSize: { type: Number, default: 50 },
  // 公共上传组件默认不限制文件类型，业务页面按需显式传入后缀白名单
  fileType: { type: Array, default: () => [] },
  isShowTip: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  drag: { type: Boolean, default: true },
  // 紧凑模式相关
  compact: { type: Boolean, default: false },
  title: { type: String, default: '' },
  listHeight: { type: String, default: '120px' },
  emptyText: { type: String, default: '暂无文件' },
  hideHeader: { type: Boolean, default: false },
  // 布局模式：row(行模式，横向排列) / column(列模式，纵向排列)
  layout: { type: String, default: 'row' },
  // 是否需要转换PDF为图片
  convertPdf: { type: Boolean, default: false },
  // 是否显示“点击上传”按钮（仅在 compact & hideHeader 模式有效）
  showUploadButton: { type: Boolean, default: true },
  // 兼容旧文件列表的 legacy，media 用于图片/视频卡片和跨组件拖拽
  viewMode: { type: String, default: 'legacy' },
  // 是否允许从桌面直接拖入文件（仍复用 el-upload 的 input 上传链路）
  dropUpload: { type: Boolean, default: false },
  // media 模式下 vuedraggable 的共享分组
  dragGroup: { type: [ String, Object ], default: null },
  // 默认输出逗号分隔字符串；array 输出文件对象数组；preserve 跟随输入形态
  valueFormat: { type: String, default: 'string' },
  // 可按应用注入 PDF 转换和下载逻辑；未注入时 PDF 转换复用组件库的全局 request
  pdfConverter: { type: Function, default: null },
  downloadHandler: { type: Function, default: null }
})

function adaptProtocol(url) {
  if (!url || typeof url !== 'string') return url
  const isHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:'
  if (url.startsWith('//')) {
    const protocol = (typeof window !== 'undefined' && window.location?.protocol) ? window.location.protocol : 'https:'
    return `${protocol}${url}`
  }
  if (isHttps && /^http:\/\//i.test(url)) {
    return url.replace(/^http:\/\//i, 'https://')
  }
  return url
}

const { proxy } = getCurrentInstance()
const emit = defineEmits([ 'update:modelValue', 'change', 'upload-success', 'upload-error' ])
const number = ref(0)
const uploadList = ref([])
const baseUrl = computed(() => {
  const url = props.baseUrl || import.meta.env.VITE_APP_BASE_API || DEFAULT_UPLOAD_BASE_URL
  return adaptProtocol(url)
})
const uploadFileUrl = computed(() => {
  if (/^https?:\/\//i.test(props.action) || props.action.startsWith('//')) {
    return adaptProtocol(props.action)
  }
  return adaptProtocol(`${baseUrl.value}${props.action}`)
})
const fileList = ref([])
const showTip = computed(() => props.isShowTip && (props.fileType?.length || props.fileSize))

// 预览相关
const previewVisible = ref(false)
const previewUrl = ref('')
const previewName = ref('')
const nativeDragDepth = ref(0)
const preserveShape = ref('string')
let mediaUidSeed = 0

// 上传组件 ref
const uploadRef = ref(null)
const triggerRef = ref(null)
const compactFileListRef = ref(null)
let fileSortable = null
let loadingInstance = null

const modal = proxy?.$modal || {
  msgError: message => ElMessage.error(message),
  msgSuccess: message => ElMessage.success(message),
  msgWarning: message => ElMessage.warning(message),
  loading: message => {
    loadingInstance?.close?.()
    loadingInstance = ElLoading.service({ lock: true, text: message, background: 'rgba(0, 0, 0, 0.7)' })
  },
  closeLoading: () => {
    loadingInstance?.close?.()
    loadingInstance = null
  }
}

// 计算 accept 字符串
const acceptStr = computed(() => {
  if (!props.fileType || !props.fileType.length) return ''
  return props.fileType.map(t => `.${t}`).join(',')
})
const mediaMode = computed(() => props.viewMode === 'media')
const mediaDragGroup = computed(() => props.dragGroup)
const nativeDragging = computed(() => nativeDragDepth.value > 0)
const normalizedFileTypes = computed(() => (props.fileType || []).map(type => String(type).replace(/^\./, '').toLowerCase()))

// 图片预览列表（只包含图片文件）
const imagePreviewList = computed(() => {
  return fileList.value
    .filter(f => isImageFile(f.name))
    .map(f => getFileUrl(f))
})

const mediaImagePreviewList = computed(() => fileList.value
  .filter(file => isImageFile(file.name) || isImageFile(file.url))
  .map(file => getFileUrl(file)))

function isImageFile(name) {
  if (!name) return false
  const ext = String(name).split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || ''
  return [ 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg' ].includes(ext)
}

function isVideoFile(name) {
  if (!name) return false
  const ext = String(name).split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || ''
  return [ 'mp4', 'webm', 'ogg', 'mov', 'm4v', 'avi' ].includes(ext)
}

function isAudioFile(name) {
  if (!name) return false
  const ext = String(name).split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || ''
  return [ 'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a' ].includes(ext)
}

function getMediaTypeLabel(nameOrUrl) {
  if (!nameOrUrl) return '文件'
  const name = String(nameOrUrl)
  if (isImageFile(name)) return '图片'
  if (isVideoFile(name)) return '视频'
  if (isAudioFile(name)) return '音频'
  const ext = getFileExt(name).toUpperCase()
  if ([ 'PDF' ].includes(ext)) return 'PDF'
  if ([ 'XLS', 'XLSX', 'CSV' ].includes(ext)) return 'Excel'
  if ([ 'DOC', 'DOCX' ].includes(ext)) return 'Word'
  if ([ 'PPT', 'PPTX' ].includes(ext)) return 'PPT'
  if ([ 'ZIP', 'RAR', '7Z', 'TAR', 'GZ' ].includes(ext)) return '压缩包'
  if ([ 'CAD', 'DWG', 'DXF' ].includes(ext)) return 'CAD'
  if ([ 'TXT', 'JSON', 'MD', 'XML' ].includes(ext)) return '文档'
  return ext || '文件'
}

function getFileTypeIconSvg(nameOrUrl) {
  const ext = getFileExt(nameOrUrl).toUpperCase()
  if (ext === 'PDF') {
    return '<svg viewBox="0 0 48 48" width="34" height="34" fill="none"><path d="M30 4H10A4 4 0 0 0 6 8v32a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V16L30 4z" fill="#E53935"/><path d="M30 4v12h12L30 4z" fill="#FF8A80"/><path d="M14 26h6a3 3 0 0 1 0 6h-4v4h-2V26zm2 4h4a1 1 0 0 0 0-2h-4v2zm9-4h5a4 4 0 0 1 0 8h-3v2h-2V26zm2 4h3a2 2 0 0 0 0-4h-3v4zm10-4h6v2h-4v2h4v2h-4v4h-2V26z" fill="#FFF"/></svg>'
  }
  if ([ 'DOC', 'DOCX' ].includes(ext)) {
    return '<svg viewBox="0 0 48 48" width="34" height="34" fill="none"><path d="M30 4H10A4 4 0 0 0 6 8v32a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V16L30 4z" fill="#1E88E5"/><path d="M30 4v12h12L30 4z" fill="#90CAF9"/><path d="M14.5 26L17.5 36H19.8L22.5 29L25.2 36H27.5L30.5 26H28.2L26.3 33.2L23.6 26H21.4L18.7 33.2L16.8 26H14.5z" fill="#FFF"/></svg>'
  }
  if ([ 'XLS', 'XLSX', 'CSV' ].includes(ext)) {
    return '<svg viewBox="0 0 48 48" width="34" height="34" fill="none"><path d="M30 4H10A4 4 0 0 0 6 8v32a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V16L30 4z" fill="#43A047"/><path d="M30 4v12h12L30 4z" fill="#A5D6A7"/><path d="M16 26L21 31L16 36H19L22.5 32.5L26 36H29L24 31L29 26H26L22.5 29.5L19 26H16z" fill="#FFF"/></svg>'
  }
  if ([ 'PPT', 'PPTX' ].includes(ext)) {
    return '<svg viewBox="0 0 48 48" width="34" height="34" fill="none"><path d="M30 4H10A4 4 0 0 0 6 8v32a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V16L30 4z" fill="#FB8C00"/><path d="M30 4v12h12L30 4z" fill="#FFCC80"/><path d="M16 26H23A4.5 4.5 0 0 1 23 35H18V36H16V26ZM18 28V33H23A2.5 2.5 0 0 0 23 28H18Z" fill="#FFF"/></svg>'
  }
  if ([ 'ZIP', 'RAR', '7Z', 'TAR', 'GZ' ].includes(ext)) {
    return '<svg viewBox="0 0 48 48" width="34" height="34" fill="none"><path d="M30 4H10A4 4 0 0 0 6 8v32a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V16L30 4z" fill="#8E24AA"/><path d="M30 4v12h12L30 4z" fill="#CE93D8"/><path d="M20 12h4v3h-4v-3zm0 5h4v3h-4v-3zm0 5h4v3h-4v-3zm0 5h4v3h-4v-3zm-1 5h6v7h-6v-7z" fill="#FFF"/><circle cx="22" cy="35" r="1.5" fill="#8E24AA"/></svg>'
  }
  if ([ 'MD', 'MARKDOWN' ].includes(ext)) {
    return '<svg viewBox="0 0 48 48" width="34" height="34" fill="none"><path d="M30 4H10A4 4 0 0 0 6 8v32a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V16L30 4z" fill="#00897B"/><path d="M30 4v12h12L30 4z" fill="#80CBC4"/><path d="M13 34V26H15.5L18 29.5L20.5 26H23V34H21V29.5L18.5 33H17.5L15 29.5V34H13ZM31 34L26.5 29.5H29.5V26H32.5V29.5H35.5L31 34Z" fill="#FFF"/></svg>'
  }
  if ([ 'CAD', 'DWG', 'DXF' ].includes(ext)) {
    return '<svg viewBox="0 0 48 48" width="34" height="34" fill="none"><path d="M30 4H10A4 4 0 0 0 6 8v32a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V16L30 4z" fill="#00ACC1"/><path d="M30 4v12h12L30 4z" fill="#80DEEA"/><path d="M14 27a3 3 0 0 1 3-3h3v2h-3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h3v2h-3a3 3 0 0 1-3-3v-2zm9-3h2.5l2.5 8h-2.1l-.5-1.8h-2.8l-.5 1.8h-2.1l2.5-8zm1.2 1.8l-1 3.4h2l-1-3.4zm7.8-1.8h4a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4h-4v-8zm2 2v4h2a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2h-2z" fill="#FFF"/></svg>'
  }
  if ([ 'TXT', 'JSON', 'XML', 'LOG', 'JS', 'TS', 'CSS', 'HTML' ].includes(ext)) {
    return '<svg viewBox="0 0 48 48" width="34" height="34" fill="none"><path d="M30 4H10A4 4 0 0 0 6 8v32a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V16L30 4z" fill="#546E7A"/><path d="M30 4v12h12L30 4z" fill="#B0BEC5"/><path d="M14 26h20v2H14v-2zm0 5h20v2H14v-2zm0 5h13v2H14v-2z" fill="#FFF"/></svg>'
  }
  return '<svg viewBox="0 0 48 48" width="34" height="34" fill="none"><path d="M30 4H10A4 4 0 0 0 6 8v32a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V16L30 4z" fill="#78909C"/><path d="M30 4v12h12L30 4z" fill="#CFD8DC"/><path d="M14 26h20v2H14v-2zm0 5h20v2H14v-2zm0 5h14v2H14v-2z" fill="#FFF"/></svg>'
}

function getFileUrlValue(item) {
  if (typeof item === 'string') return item
  return item?.url || item?.fileUrl || item?.path || item?.value || ''
}

function createFileUid() {
  mediaUidSeed += 1
  return `file-upload-${Date.now().toString(36)}-${mediaUidSeed}-${Math.random().toString(36).slice(2, 8)}`
}

function getFileListInput(value) {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return [ value ]
  const text = String(value || '').trim()
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === 'object') return [ parsed ]
  } catch {
    // 非 JSON 字符串按原有逗号分隔格式处理
  }
  return text.split(',').map(item => item.trim()).filter(Boolean)
}

function normalizeFileList(value) {
  return getFileListInput(value)
    .map(item => {
      const url = String(getFileUrlValue(item) || '').trim()
      if (!url) return null
      const clone = typeof item === 'object' && item !== null ? { ...item } : { url }
      clone.url = url
      clone.name = clone.name || getFileName(url)
      clone.uid = clone.uid || createFileUid()
      return clone
    })
    .filter(Boolean)
}

function getValueShape(value) {
  if (Array.isArray(value)) return 'array'
  if (value && typeof value === 'object') return 'object'
  return 'string'
}

// 获取文件扩展名
function getFileExt(name) {
  if (!name) return ''
  const cleanName = String(name).split('?')[0].split('#')[0]
  const parts = cleanName.split('.')
  if (parts.length <= 1) return ''
  return (parts.pop() || '').trim().toUpperCase()
}

// 获取图片在预览列表中的索引
function getImageIndex(file) {
  const imageFiles = fileList.value.filter(f => isImageFile(f.name))
  return imageFiles.findIndex(f => f.uid === file.uid)
}

// 获取文件完整URL
function getFileUrl(file) {
  const url = file.url
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('//')) return adaptProtocol(url)
  return adaptProtocol(baseUrl.value + url)
}

watch(
  () => props.modelValue,
  val => {
    preserveShape.value = getValueShape(val)
    fileList.value = normalizeFileList(val)
    if (!fileList.value.length) {
      // 外部清空（如关闭 Dialog 重置表单）时，同步清理 el-upload 内部累积的 uploadFiles，
      // 否则其内部计数会跨次保留，导致 limit 校验错误提示“超过数量”。
      nextTick(clearFiles)
    }
  },
  { deep: true, immediate: true }
)

function handleBeforeUpload(file) {
  // 基于当前真实 fileList + 本轮已进入上传队列的数量做校验，
  // 避免依赖 el-upload 内部的 uploadFiles 累积计数（跨次打开 Dialog 会误判超限）。
  if (props.limit) {
    const currentCount = fileList.value.filter(f => f.url !== undefined).length + number.value
    if (currentCount >= props.limit) {
      modal.msgError(`上传文件数量不能超过 ${props.limit} 个!`)
      return false
    }
  }
  if (props.fileType?.length) {
    const fileName = file.name.split('.')
    const fileExt = (fileName[fileName.length - 1] || '').toLowerCase()
    const allowTypes = normalizedFileTypes.value
    const isTypeOk = allowTypes.includes(fileExt)
    if (!isTypeOk) {
      modal.msgError(`文件格式不正确，请上传${props.fileType.join('/')}格式文件!`)
      return false
    }
  }
  const lastDotIndex = file.name.lastIndexOf('.')
  const nameWithoutExt = lastDotIndex > -1 ? file.name.slice(0, lastDotIndex) : file.name
  if (nameWithoutExt.includes('+')) {
    modal.msgError('文件名不能包含 + 号!')
    return false
  }
  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize
    if (!isLt) {
      modal.msgError(`上传文件大小不能超过 ${props.fileSize} MB!`)
      return false
    }
  }

  // PDF 转换逻辑
  if (props.convertPdf && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
    handlePdfConvert(file)
    return false // 阻止默认上传
  }

  modal.loading('正在上传文件，请稍候...')
  number.value++
  return true
}

// 处理 PDF 转换
async function handlePdfConvert(file) {
  try {
    modal.loading('正在将 PDF 转换为图片，请稍候...')
    
    const formData = new globalThis.FormData()
    formData.append('file', file)
    
    const converter = props.pdfConverter || (data => {
      if (!request) throw new Error('PDF 转换需要先配置全局 request 或传入 pdfConverter')
      return request({
        url: '/file/converterToOss',
        method: 'post',
        baseURL: baseUrl.value,
        data,
        headers: { 'Content-Type': 'multipart/form-data', isToken: false }
      })
    })
    const res = await converter(formData)
    
    if (res.code === 200 && res.data && Array.isArray(res.data)) {
      // 将转换后的图片添加到文件列表
      const newFiles = res.data.map((item, index) => ({
        name: `${file.name.replace('.pdf', '')}_${index + 1}.${item.suffix}`,
        url: item.url,
        uid: new Date().getTime() + index
      }))
      
      // 添加到现有文件列表
      fileList.value = [ ...fileList.value, ...newFiles ]
      
      // 触发更新
      emitValue()
      
      modal.closeLoading()
      modal.msgSuccess(`PDF 转换成功，共 ${res.data.length} 张图片`)
    } else {
      throw new Error(res.msg || 'PDF 转换失败')
    }
  } catch (error) {
    console.error('PDF 转换失败:', error)
    modal.closeLoading()
    modal.msgError(error.message || 'PDF 转换失败')
  }
}

function handleExceed() {
  modal.msgError(`上传文件数量不能超过 ${props.limit} 个!`)
}

function handleUploadError(error, file) {
  number.value = Math.max(0, number.value - 1)
  modal.msgError('上传文件失败')
  emit('upload-error', error, file)
  uploadedSuccessfully()
  if (!number.value) finishUploadQueue()
}

function handleUploadSuccess(res, file) {
  if (res.code === 200) {
    // 兼容 /oss/batch-upload 和 /common/upload 两种返回格式
    const url = res.data?.[0]?.url || res.url || res.fileName
    if (url) {
      uploadList.value.push({ name: file.name, url, uid: file.uid || createFileUid() })
    } else {
      number.value = Math.max(0, number.value - 1)
      modal.msgError(res.msg || '上传结果缺少文件地址')
      emit('upload-error', res, file)
      uploadedSuccessfully()
      if (!number.value) finishUploadQueue()
      return
    }
    emit('upload-success', res, file)
    uploadedSuccessfully()
  } else {
    number.value = Math.max(0, number.value - 1)
    modal.msgError(res.msg)
    uploadRef.value?.handleRemove?.(file)
    proxy.$refs.fileUpload?.handleRemove?.(file)
    emit('upload-error', res, file)
    uploadedSuccessfully()
    if (!number.value) finishUploadQueue()
  }
}

function handleDelete(index) {
  fileList.value.splice(index, 1)
  emitValue()
}

function uploadedSuccessfully() {
  if (number.value > 0 && uploadList.value.length === number.value) {
    fileList.value = fileList.value.filter(f => f.url !== undefined).concat(uploadList.value)
    uploadList.value = []
    number.value = 0
    emitValue()
    finishUploadQueue()
  }
}

function finishUploadQueue() {
  modal.closeLoading()
  nextTick(() => {
    uploadRef.value?.clearFiles?.()
    proxy?.$refs?.fileUpload?.clearFiles?.()
  })
}

function getFileName(name) {
  if (!name) return ''
  if (name.lastIndexOf('/') > -1) {
    return name.slice(name.lastIndexOf('/') + 1)
  } else {
    return name
  }
}

function listToString(list, separator) {
  let strs = ''
  separator = separator || ','
  for (const i in list) {
    if (list[i].url) {
      strs += list[i].url + separator
    }
  }
  return strs != '' ? strs.substr(0, strs.length - 1) : ''
}

function formatModelValue(list) {
  const clonedList = list.map(item => {
    const clonedItem = { ...item }
    delete clonedItem.uid
    return clonedItem
  })
  if (props.valueFormat === 'array') return clonedList
  if (props.valueFormat === 'preserve') {
    if (preserveShape.value === 'array') return clonedList
    if (preserveShape.value === 'object') return clonedList[0] || null
  }
  return listToString(list)
}

function emitValue() {
  const value = formatModelValue(fileList.value)
  emit('update:modelValue', value)
  emit('change', value, fileList.value.map(item => ({ ...item })))
}

// 触发上传（紧凑模式使用）
function triggerUpload() {
  if (props.disabled) return
  const component = uploadRef.value || proxy?.$refs?.fileUpload
  const input = component?.$el?.querySelector('input[type="file"]')
  input?.click()
}

function uploadFiles(files) {
  if (props.disabled) return false
  const input = (uploadRef.value || proxy?.$refs?.fileUpload)?.$el?.querySelector('input[type="file"]')
  const fileArray = files && typeof files !== 'string' && typeof files[Symbol.iterator] === 'function'
    ? Array.from(files)
    : [ files ]
  if (!input || !fileArray.length || typeof globalThis.DataTransfer !== 'function') return false
  const transfer = new globalThis.DataTransfer()
  fileArray.filter(Boolean).forEach(file => transfer.items.add(file))
  input.files = transfer.files
  input.dispatchEvent(new globalThis.Event('change', { bubbles: true }))
  return true
}

function clearFiles() {
  uploadRef.value?.clearFiles?.()
  proxy?.$refs?.fileUpload?.clearFiles?.()
  uploadList.value = []
  number.value = 0
}

function handleMediaDragChange() {
  emitValue()
}

function getFileExtension(file) {
  const name = typeof file === 'string' ? file : file?.name
  const url = typeof file === 'string' ? file : file?.url
  const candidate = String(name || '').includes('.') ? name : url
  return String(candidate || '').split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || ''
}

function rejectMediaMove(message) {
  const now = Date.now()
  if (!rejectMediaMove.lastAt || now - rejectMediaMove.lastAt > 1200) modal.msgWarning(message)
  rejectMediaMove.lastAt = now
  return false
}

function checkMediaMove(event) {
  const target = event?.to
  if (!target || target === event?.from) return true
  const dragged = event?.draggedContext?.element
  const allowedTypes = String(target.dataset?.fileTypes || '').split(',').filter(Boolean)
  if (allowedTypes.length && !allowedTypes.includes(getFileExtension(dragged))) {
    return rejectMediaMove(`仅支持${allowedTypes.join('/')}格式文件`)
  }
  const targetLimit = Number(target.dataset?.limit || 0)
  const targetCount = Number(event?.relatedContext?.list?.length || 0)
  if (targetLimit && targetCount >= targetLimit) return rejectMediaMove(`最多只能放置 ${targetLimit} 个文件`)
  return true
}

function isNativeFileDrag(event) {
  return props.dropUpload && Array.from(event?.dataTransfer?.types || []).includes('Files')
}

function handleNativeDragEnter(event) {
  if (!isNativeFileDrag(event)) return
  nativeDragDepth.value += 1
}

function handleNativeDragOver(event) {
  if (!isNativeFileDrag(event)) return
  event.dataTransfer.dropEffect = 'copy'
}

function handleNativeDragLeave(event) {
  if (!isNativeFileDrag(event)) return
  nativeDragDepth.value = Math.max(0, nativeDragDepth.value - 1)
}

function handleNativeDrop(event) {
  if (!props.dropUpload) return
  nativeDragDepth.value = 0
  const files = Array.from(event?.dataTransfer?.files || [])
  if (!files.length) return
  const remaining = props.limit ? Math.max(0, props.limit - fileList.value.length) : files.length
  if (!remaining) {
    modal.msgWarning(`最多只能上传 ${props.limit} 个文件`)
    return
  }
  if (files.length > remaining) modal.msgWarning(`本次最多还能上传 ${remaining} 个文件`)
  uploadFiles(files.slice(0, remaining))
}

// 预览文件
function handlePreview(file) {
  const url = file.url
  if (!url) return
  const fullUrl = (url.startsWith('http') || url.startsWith('//')) ? url : baseUrl.value + url
  previewUrl.value = adaptProtocol(fullUrl)
  previewName.value = getFileName(file.name)
  previewVisible.value = true
}

function initFileSortable() {
  fileSortable?.destroy()
  fileSortable = null
  if (mediaMode.value || !props.drag || props.disabled || fileList.value.length < 2) return

  const element = props.compact
    ? compactFileListRef.value
    : proxy.$refs.uploadFileList?.$el || proxy.$refs.uploadFileList
  if (!element) return

  fileSortable = Sortable.create(element, {
    animation: 160,
    draggable: props.compact ? '.file-item-preview' : '.el-upload-list__item',
    ghostClass: 'file-upload-darg',
    onEnd: evt => {
      if (evt.oldIndex === evt.newIndex || evt.oldIndex == null || evt.newIndex == null) return
      const movedItem = fileList.value.splice(evt.oldIndex, 1)[0]
      fileList.value.splice(evt.newIndex, 0, movedItem)
      emitValue()
    }
  })
}

watch(
  () => [ mediaMode.value, props.drag, props.disabled, props.compact, fileList.value.length ],
  () => nextTick(initFileSortable),
  { immediate: true }
)

onBeforeUnmount(() => {
  fileSortable?.destroy()
  loadingInstance?.close?.()
})

defineExpose({ triggerUpload, getFiles: () => fileList.value.map(item => ({ ...item })), uploadFiles, clearFiles })
</script>

<style scoped lang="scss">
.file-upload-darg {
  opacity: 0.5;
  background: #c8ebfb;
}
.upload-file-uploader {
  margin-bottom: 5px;
}
.upload-file-list .el-upload-list__item {
  border: 1px solid #e4e7ed;
  line-height: 2;
  margin-bottom: 10px;
  position: relative;
  transition: none !important;
}
.upload-file-list .ele-upload-list__item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: inherit;
}
.ele-upload-list__item-content-action .el-link {
  margin-right: 10px;
}

/* 紧凑模式样式 */
.compact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: #e8f5e9;
  border-bottom: 1px solid #c8e6c9;
  
  .compact-title {
    font-size: 13px;
    font-weight: 600;
    color: #2e7d32;
  }
  
  .add-btn {
    font-size: 18px;
    padding: 0;
    
    &:hover {
      color: #1b5e20;
    }
  }
}

.compact-file-list {
  overflow-y: auto;
  padding: 8px;
  background: #fff;
  min-height: 60px;
  
  .file-items {
    display: flex;
    gap: 8px;
  }
  
  // 行模式：横向排列，换行
  &.layout-row .file-items {
    flex-wrap: wrap;
    flex-direction: row;
  }
  
  // 列模式：纵向排列
  &.layout-column .file-items {
    flex-direction: column;
  }
  
  // 列模式下的文件项样式
  &.layout-column .file-item-preview {
    flex-direction: row;
    width: 100%;
    padding: 6px 8px;
    background: #f5f7fa;
    border-radius: 4px;
    
    .file-thumbnail {
      width: 36px;
      height: 36px;
      flex-shrink: 0;
    }
    
    .file-icon-box {
      width: 36px;
      height: 36px;
      flex-shrink: 0;
      
      .file-type-icon {
        font-size: 16px;
      }
      
      .file-ext {
        font-size: 8px;
      }
    }
    
    .file-name-text {
      flex: 1;
      margin-top: 0;
      margin-left: 8px;
      text-align: left;
      max-width: none;
      font-size: 12px;
    }
    
    .action-btns {
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s;
      
      .preview-btn {
        color: #409eff;
        font-size: 14px;
        cursor: pointer;
        
        &:hover {
          color: #66b1ff;
        }
      }
      
      .delete-btn {
        position: static;
        width: auto;
        height: auto;
        background: transparent;
        color: #f56c6c;
        font-size: 14px;
        
        &:hover {
          color: #f78989;
          background: transparent;
        }
      }
    }
    
    &:hover {
      background: #e8f4ff;
      
      .action-btns {
        opacity: 1;
      }
    }
  }
  
  .file-item-preview {
    position: relative;
    width: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
    
    .file-thumbnail {
      width: 50px;
      height: 50px;
      border-radius: 4px;
      border: 1px solid #e4e7ed;
      cursor: pointer;
    }
    
    .file-icon-box {
      width: 50px;
      height: 50px;
      border-radius: 4px;
      border: 1px solid #e4e7ed;
      background: #f5f7fa;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        border-color: #409eff;
        background: #ecf5ff;
      }
      
      .file-type-icon {
        font-size: 20px;
        color: #409eff;
        margin-top: 6px;
      }
      
      .file-ext {
        font-size: 10px;
        color: #909399;
        margin-top: 2px;
      }
    }
    
    .file-name-text {
      font-size: 10px;
      color: #606266;
      margin-top: 4px;
      max-width: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
      cursor: default;
    }
    
    .delete-btn {
      position: absolute;
      top: -6px;
      right: 0;
      width: 16px;
      height: 16px;
      background: #f56c6c;
      border-radius: 50%;
      color: #fff;
      font-size: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
      
      &:hover {
        background: #f78989;
      }
    }
    
    &:hover .delete-btn {
      opacity: 1;
    }
  }
  
  .empty-tip {
    text-align: center;
    color: #c0c4cc;
    font-size: 12px;
    padding: 20px 0;
  }
}

.hidden-upload {
  display: none;
}

/* 媒体模式样式 */
.media-upload-shell {
  min-height: 112px;
  padding: 10px;
  border: 1px dashed #d9e2ef;
  border-radius: 8px;
  background: #fbfcfe;
  transition: border-color 0.2s, background 0.2s;

  &.is-native-dragging {
    border-color: #409eff;
    background: #ecf5ff;
  }

  &.is-disabled {
    background: #f5f7fa;
  }
}

.media-file-list {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 12px;
  min-height: 90px;
}

.media-file-card,
.media-upload-placeholder {
  position: relative;
  width: 132px;
  min-height: 112px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
}

.media-file-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 6px;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.media-file-preview,
.media-file-placeholder {
  width: 100%;
  height: 76px;
  border-radius: 4px;
  object-fit: cover;
}

.media-file-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 0;
  color: #606266;
  background: #f8fafc;
  font-size: 11px;
  cursor: pointer;

  .media-file-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  .media-file-ext-text {
    font-weight: 600;
    font-size: 10px;
    color: #909399;
    letter-spacing: 0.5px;
  }

  &:hover .media-file-icon {
    transform: translateY(-1px) scale(1.05);
  }
}

.media-file-type {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 4px;
  color: #ffffff;
  background: rgb(48 65 86 / 75%);
  font-weight: 500;
  font-size: 10px;
  line-height: 20px;
  box-sizing: border-box;
}

.media-file-name {
  display: block;
  margin-top: 5px;
  overflow: hidden;
  color: #606266;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-file-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 5;
  width: 20px;
  height: 20px;
  min-height: 20px;
  padding: 0;
  border-radius: 50%;
  color: #ff4d4f;
  background: #ffffff;
  box-shadow: 0 1px 4px rgb(0 0 0 / 15%);
  transition: all 0.2s ease;

  &:hover,
  &:focus {
    color: #ffffff !important;
    background: #ff4d4f !important;
    transform: scale(1.1);
  }

  :deep(.el-icon),
  .el-icon {
    font-size: 12px;
    color: inherit;
  }
}

.media-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-style: dashed;
  color: #909399;
  font-size: 12px;
  cursor: pointer;

  .el-icon {
    font-size: 24px;
  }

  &:hover {
    border-color: #409eff;
    color: #409eff;
    background: #f5faff;
  }
}

:global(.el-image-viewer__wrapper) {
  z-index: 100001 !important;
}
</style>
