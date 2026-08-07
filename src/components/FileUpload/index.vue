<template>
  <div class="upload-file">
    <!-- 默认模式 -->
    <template v-if="!compact">
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
        :on-remove="handleRemove"
        :show-file-list="true"
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
    </template>

    <!-- 紧凑模式 -->
    <template v-else>
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
        <div v-if="fileList.length > 0" class="file-items">
          <div v-for="(file, index) in fileList" :key="file.uid || index" class="file-item-preview">
            <template v-if="isImageFile(file.name)">
              <el-image :src="getFileUrl(file)" fit="cover" class="file-thumbnail" preview-teleported />
            </template>
            <template v-else>
              <div class="file-icon-box">
                <el-icon class="file-type-icon"><Document /></el-icon>
                <span class="file-ext">{{ getFileExt(file.name) }}</span>
              </div>
            </template>
            <el-tooltip :content="getFileName(file.name)" placement="top" :show-after="500">
              <span class="file-name-text">{{ getFileName(file.name) }}</span>
            </el-tooltip>
            <div v-if="layout === 'column'" class="action-btns">
              <el-icon class="preview-btn" @click.stop="handlePreview(file)"><View /></el-icon>
              <el-icon v-if="!disabled" class="delete-btn" @click.stop="handleDelete(index)"><Close /></el-icon>
            </div>
            <el-icon v-else-if="!disabled" class="delete-btn" @click.stop="handleDelete(index)"><Close /></el-icon>
          </div>
        </div>
        <div v-else-if="emptyText" class="empty-tip">{{ emptyText }}</div>
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

    <!-- 文件预览弹窗 -->
    <FilePreview v-model="previewVisible" :url="previewUrl" :name="previewName" />
  </div>
</template>

<script setup>
import { Close, Document, Plus, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, getCurrentInstance, nextTick, ref, watch } from 'vue'
import FilePreview from '@/components/FilePreview/index.vue'

const props = defineProps({
  modelValue: [String, Object, Array],
  action: { type: String, default: '/oss/batch-upload' },
  baseUrl: { type: String, default: () => import.meta.env.VITE_APP_BASE_API || '' },
  data: { type: Object },
  limit: { type: Number, default: 5 },
  fileSize: { type: Number, default: 50 },
  fileType: { type: Array, default: () => [] },
  isShowTip: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  title: { type: String, default: '' },
  listHeight: { type: String, default: '120px' },
  emptyText: { type: String, default: '暂无文件' },
  hideHeader: { type: Boolean, default: false },
  layout: { type: String, default: 'row' },
  showUploadButton: { type: Boolean, default: true }
})

const { proxy } = getCurrentInstance()
const emit = defineEmits(['update:modelValue', 'change', 'upload-success', 'upload-error'])

const uploadFileUrl = computed(() => {
  const base = props.baseUrl || import.meta.env.VITE_APP_BASE_API || ''
  return /^https?:\/\//i.test(props.action) ? props.action : `${base}${props.action}`
})

const fileList = ref([])
const showTip = computed(() => props.isShowTip && (props.fileType?.length || props.fileSize))

// 预览相关
const previewVisible = ref(false)
const previewUrl = ref('')
const previewName = ref('')

// 上传组件 ref
const uploadRef = ref(null)
const triggerRef = ref(null)

const acceptStr = computed(() => {
  if (!props.fileType || !props.fileType.length) return ''
  return props.fileType.map(t => `.${t}`).join(',')
})

function isImageFile(name) {
  if (!name) return false
  const ext = String(name).split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)
}

function getFileExt(name) {
  if (!name) return ''
  const cleanName = String(name).split('?')[0].split('#')[0]
  const parts = cleanName.split('.')
  if (parts.length <= 1) return ''
  return (parts.pop() || '').trim().toUpperCase()
}

function getFileName(name) {
  if (!name) return ''
  if (name.lastIndexOf('/') > -1) {
    return name.slice(name.lastIndexOf('/') + 1)
  }
  return name
}

function getFileUrl(file) {
  const url = file.url
  if (!url) return ''
  if (url.startsWith('http')) return url
  return uploadFileUrl.value.replace(/\/[^/]+$/, '') + url
}

function getFileListInput(value) {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return [value]
  const text = String(value || '').trim()
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
    if (parsed && typeof parsed === 'object') return [parsed]
  } catch {}
  return text.split(',').map(item => item.trim()).filter(Boolean)
}

function normalizeFileList(value) {
  return getFileListInput(value)
    .map(item => {
      const url = typeof item === 'string' ? item : item?.url || item?.fileUrl || item?.path || item?.value || ''
      if (!url) return null
      const name = typeof item === 'object' ? (item.name || getFileName(url)) : getFileName(url)
      return { url, name, uid: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
    })
    .filter(Boolean)
}

watch(
  () => props.modelValue,
  val => {
    fileList.value = normalizeFileList(val)
  },
  { deep: true, immediate: true }
)

function handleBeforeUpload(file) {
  if (props.fileType?.length) {
    const fileName = file.name.split('.')
    const fileExt = (fileName[fileName.length - 1] || '').toLowerCase()
    const allowTypes = props.fileType.map(t => t.replace(/^\./, '').toLowerCase())
    if (!allowTypes.includes(fileExt)) {
      ElMessage.error(`文件格式不正确，请上传${props.fileType.join('/')}格式文件!`)
      return false
    }
  }

  if (file.name.includes('+')) {
    ElMessage.error('文件名不能包含 + 号!')
    return false
  }

  if (props.fileSize) {
    const isLt = file.size / 1024 / 1024 < props.fileSize
    if (!isLt) {
      ElMessage.error(`上传文件大小不能超过 ${props.fileSize} MB!`)
      return false
    }
  }
  return true
}

function handleExceed() {
  ElMessage.error(`上传文件数量不能超过 ${props.limit} 个!`)
}

function handleUploadError(error, file) {
  ElMessage.error('上传文件失败')
  emit('upload-error', error, file)
}

function handleUploadSuccess(res, file) {
  if (res.code === 200) {
    const url = res.data?.[0]?.url || res.url || res.fileName
    if (url) {
      fileList.value.push({ name: file.name, url, uid: file.uid || Date.now().toString() })
      emitValue()
      emit('upload-success', res, file)
    } else {
      ElMessage.error(res.msg || '上传结果缺少文件地址')
    }
  } else {
    ElMessage.error(res.msg || '上传失败')
  }
}

function handleRemove(file, fileList) {
  const index = fileList.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    fileList.splice(index, 1)
  }
}

function handleDelete(index) {
  fileList.value.splice(index, 1)
  emitValue()
}

function emitValue() {
  const strs = fileList.value.map(f => f.url).filter(Boolean).join(',')
  emit('update:modelValue', strs)
  emit('change', strs, fileList.value.map(item => ({ ...item })))
}

function triggerUpload() {
  if (props.disabled) return
  const input = uploadRef.value?.$el?.querySelector('input[type="file"]')
  input?.click()
}

function handlePreview(file) {
  const url = file.url
  if (!url) return
  previewUrl.value = url.startsWith('http') ? url : uploadFileUrl.value.replace(/\/[^/]+$/, '') + url
  previewName.value = getFileName(file.name)
  previewVisible.value = true
}

defineExpose({ triggerUpload, getFiles: () => fileList.value.map(item => ({ ...item })) })
</script>

<style scoped lang="scss">
.upload-file-uploader {
  margin-bottom: 5px;
}

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

  &.layout-row .file-items {
    flex-wrap: wrap;
    flex-direction: row;
  }

  &.layout-column .file-items {
    flex-direction: column;
  }

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
        color: #f56c6c;
        font-size: 14px;
        cursor: pointer;
        &:hover {
          color: #f78989;
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
    cursor: default;

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
</style>
