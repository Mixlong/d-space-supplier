<template>
  <el-dialog
    v-model="visible"
    :title="name"
    width="50%"
    top="10vh"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div class="preview-container">
      <el-image v-if="isImage" :src="url" fit="contain" style="width: 100%; height: 100%;" />
      <iframe v-else-if="isPDF" :src="url" class="preview-iframe" frameborder="0" />
      <div v-else class="unsupported-preview">
        <el-icon class="file-icon"><Document /></el-icon>
        <p>该文件类型暂不支持在线预览</p>
        <el-button type="primary" @click="handleDownload">
          <el-icon><Download /></el-icon> 下载文件
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Document, Download } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  url: { type: String, default: '' },
  name: { type: String, default: '文件预览' }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const fileExtension = computed(() => {
  if (!props.url) return ''
  const url = props.url.split('?')[0]
  const parts = url.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
})

const isImage = computed(() => {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']
  return imageExts.includes(fileExtension.value)
})

const isPDF = computed(() => fileExtension.value === 'pdf')

function handleDownload() {
  const link = document.createElement('a')
  link.href = props.url
  link.download = props.name || ''
  link.target = '_blank'
  link.click()
}
</script>

<style scoped lang="scss">
.preview-container {
  height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.unsupported-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;

  .file-icon {
    font-size: 64px;
    margin-bottom: 20px;
  }

  p {
    font-size: 14px;
    margin-bottom: 20px;
  }
}
</style>
