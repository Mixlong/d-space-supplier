<template>
  <div class="app-container delivery-page">
    <search-bar :model="query" @search="loadList" @reset="resetQuery">
      <el-form-item label="物料编码"><el-input v-model="query.materialCode" clearable placeholder="请输入物料编码" /></el-form-item>
      <el-form-item label="版本信息"><el-input v-model="query.versionNumber" clearable placeholder="请输入版本信息" /></el-form-item>
    </search-bar>
    <page-table class="delivery-page-table" :total="total" v-model:page="query.p" v-model:size="query.l" @pagination="loadList">
      <el-table v-loading="loading" :data="list" height="100%" border stripe :header-cell-style="getHeaderCellStyle" :row-class-name="getFirmwareRowClass">
        <el-table-column type="expand" width="50" align="center">
          <template #default="{ row }">
            <div class="expand-table-card" v-if="row.firmwareList && row.firmwareList.length">
              <div class="expand-table-meta">关联固件（{{ row.firmwareList.length }}）</div>
              <el-table :data="row.firmwareList" stripe size="small" class="sub-firmware-table" :header-cell-style="getSubHeaderCellStyle" style="width: 100%">
                <el-table-column label="序号" width="65" align="center">
                  <template #default="{ $index }">
                    <span class="sub-index-badge">{{ $index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="versionNumber" label="版本信息" width="140" align="center" show-overflow-tooltip />
                <el-table-column prop="materialCode" label="物料编码" width="130" align="center" show-overflow-tooltip />
                <el-table-column prop="chipPlatform" label="模块型号" width="130" align="center" show-overflow-tooltip />
                <el-table-column prop="versionDescription" label="版本描述" min-width="200" align="center" show-overflow-tooltip />
                <el-table-column label="状态" width="90" align="center">
                  <template #default="{ row: subRow }">
                    <el-tag size="small" :type="isFirmwareDisabled(subRow) ? 'danger' : 'success'">
                      {{ isFirmwareDisabled(subRow) ? '禁用' : '启用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="createTime" label="创建时间" width="165" align="center" />
                <el-table-column prop="publishTime" label="发布时间" width="165" align="center" />
                <el-table-column label="操作" width="180" fixed="right" align="center">
                  <template #default="{ row: subRow }">
                    <el-button v-if="!isFirmwareDisabled(subRow) && subRow.fileUrl" link type="primary" size="small" class="download-link-btn" @click="downloadFile(subRow.fileUrl, subRow.fileName)">
                      <el-icon style="margin-right: 4px"><Download /></el-icon>下载固件
                    </el-button>
                    <el-button v-if="false" link type="primary" size="small" @click="openSelectFirmwareDialog(subRow)">新增固件</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else class="expand-empty-card">
              <el-empty :image-size="48" description="暂无关联固件历史数据" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="序号" width="65" align="center">
          <template #default="{ $index }">
            {{ (query.p - 1) * query.l + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="130" align="center" show-overflow-tooltip />
        <el-table-column prop="versionNumber" label="版本信息" width="150" align="center" show-overflow-tooltip />
        <el-table-column prop="chipPlatform" label="模块型号" width="130" align="center" show-overflow-tooltip />
        <el-table-column prop="versionDescription" label="版本描述" min-width="200" align="center" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="isFirmwareDisabled(row) ? 'danger' : 'success'">
              {{ isFirmwareDisabled(row) ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center" />
        <el-table-column prop="publishTime" label="发布时间" width="170" align="center" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button v-if="!isFirmwareDisabled(row) && row.fileUrl" link type="primary" @click="downloadFile(row.fileUrl, row.fileName)">下载固件</el-button>
            <el-button v-if="false" link type="primary" @click="openSelectFirmwareDialog(row)">新增固件</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :image-size="72" description="暂无正式蓝牙版本" />
        </template>
      </el-table>
    </page-table>

    <el-dialog v-model="applyDialogVisible" class="apply-dialog custom-dialog" :title="dialogTitle" width="720px" destroy-on-close align-center>
      <el-form ref="applyFormRef" :model="applyForm" :rules="applyRules" label-width="110px" class="dialog-form">
        <div v-if="applyForm.applyType === 2" class="source-info-bar">
          <div class="bar-title">原版本信息</div>
          <div class="bar-content">
            <span class="bar-item"><span class="label">版本信息：</span><span class="val font-mono">{{ applyForm.targetVersionNumber || '-' }}</span></span>
            <span class="bar-item"><span class="label">物料编码：</span><span class="val font-mono">{{ applyForm.materialCode || '-' }}</span></span>
            <span class="bar-item"><span class="label">原模块型号：</span><span class="val font-mono">{{ applyForm.targetChipPlatform || '-' }}</span></span>
          </div>
        </div>
        <template v-if="applyForm.applyType === 1">
          <el-form-item label="物料编码" prop="materialCode"><el-input v-model="applyForm.materialCode" placeholder="请输入物料编码" clearable /></el-form-item>
        </template>
        <el-form-item v-if="applyForm.applyType === 1" label="模块型号" prop="chipPlatform"><el-input v-model="applyForm.chipPlatform" placeholder="请输入模块型号" clearable /></el-form-item>
        <el-form-item label="版本信息" prop="versionNumber"><el-input v-model="applyForm.versionNumber" placeholder="请输入版本信息" clearable /></el-form-item>
        <el-form-item label="版本描述" prop="versionDescription"><el-input v-model="applyForm.versionDescription" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请输入版本描述" /></el-form-item>
        <el-form-item label="固件文件" prop="fileUrl">
          <FileUpload
            v-model="applyForm.fileUrl"
            :limit="1"
            :file-size="100"
            :is-show-tip="true"
            @change="handleFileUploadChange"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="applyDialogVisible = false">取消</el-button>
          <el-button v-if="!isRepublish" type="primary" :loading="submitLoading" @click="submitNewApply">提交审核</el-button>
          <el-button v-else type="primary" :loading="submitLoading" @click="submitRepublish">重新发布</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="firmwareSelectVisible" class="firmware-select-dialog custom-dialog" title="选择正式版本" width="960px" destroy-on-close align-center>
      <div class="firmware-select-header">
        <el-form inline class="firmware-query-form">
          <el-form-item label="物料编码"><el-input v-model="firmwareQuery.materialCode" clearable placeholder="请输入物料编码" @keyup.enter="loadFirmwareList" /></el-form-item>
          <el-form-item label="版本信息"><el-input v-model="firmwareQuery.versionNumber" clearable placeholder="请输入版本信息" @keyup.enter="loadFirmwareList" /></el-form-item>
          <el-form-item class="form-actions">
            <el-button type="primary" :icon="Search" @click="loadFirmwareList">搜索</el-button>
            <el-button :icon="Refresh" @click="Object.assign(firmwareQuery, { p: 1, l: 50, materialCode: '', versionNumber: '' }); loadFirmwareList()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div class="firmware-select-body">
        <div class="table-wrapper">
          <el-table
            v-loading="firmwareLoading"
            :data="firmwareList"
            height="560"
            border
            stripe
            highlight-current-row
            class="pretty-table"
            :header-cell-style="getFirmwareDialogHeaderStyle"
            @row-click="handleFirmwareRowClick"
          >
            <el-table-column label="序号" width="65" align="center">
              <template #default="{ $index }">
                {{ (firmwareQuery.p - 1) * firmwareQuery.l + $index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="materialCode" label="物料编码" min-width="150" align="center" show-overflow-tooltip />
            <el-table-column prop="versionNumber" label="版本信息" min-width="170" align="center" show-overflow-tooltip />
            <el-table-column prop="chipPlatform" label="模块型号" min-width="130" align="center" show-overflow-tooltip />
            <el-table-column prop="publishTime" label="发布时间" min-width="160" align="center" />
            <el-table-column label="操作" width="90" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link class="select-btn" @click.stop="confirmFirmwareSelect(row)">选择</el-button>
              </template>
            </el-table-column>
            <template #empty>
              <el-empty :image-size="60" description="暂无可选固件版本" />
            </template>
          </el-table>
        </div>
        <div class="pagination-footer">
          <el-pagination
            v-model:current-page="firmwareQuery.p"
            v-model:page-size="firmwareQuery.l"
            :total="firmwareTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
            size="small"
            @size-change="loadFirmwareList"
            @current-change="loadFirmwareList"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { Download, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { createBluetoothFirmwareApply, getBluetoothFirmwareList, republishBluetoothApply } from '@/api/vendor-bluetooth'
import { zipFile } from '@/utils/fileDownload'

const router = useRouter()
const query = reactive({ p: 1, l: 50, materialCode: '', versionNumber: '' })
const list = ref([])
const total = ref(0)
const loading = ref(false)

const applyDialogVisible = ref(false)
const submitLoading = ref(false)
const applyFormRef = ref()
const isRepublish = ref(false)
const currentApplyId = ref('')

const firmwareSelectVisible = ref(false)
const firmwareLoading = ref(false)
const firmwareList = ref([])
const firmwareTotal = ref(0)
const firmwareQuery = reactive({ p: 1, l: 50, materialCode: '', versionNumber: '' })

const emptyForm = () => ({ applyType: 1, targetFirmwareId: '', targetVersionNumber: '', targetChipPlatform: '', materialCode: '', chipPlatform: '', versionNumber: '', versionDescription: '', fileUrl: '', fileName: '', version: undefined })
const applyForm = reactive(emptyForm())
const currentFileName = ref('')

const dialogTitle = computed(() => applyForm.applyType === 1 ? '新增蓝牙版本申请' : '新增固件申请')
const applyRules = computed(() => ({
  versionNumber: [{ required: true, message: '请输入版本信息', trigger: 'blur' }],
  fileUrl: [{ required: true, message: '请上传固件文件', trigger: 'change' }],
}))

function unwrap(res) { return res?.data ?? res ?? {} }
function listData(res) { const data = unwrap(res); return { list: data.list || data.records || [], total: Number(data.total || 0) } }
function firmwareIdOf(row) { return row.id ?? row.firmwareId ?? row.bluetoothFirmwareId }
function isFirmwareDisabled(row) { return Number(row?.status) === 1 }
function getFirmwareRowClass({ row }) {
  return Array.isArray(row?.firmwareList) && row.firmwareList.length > 1 ? '' : 'no-firmware-history'
}
function errorMessage(error, fallback) {
  return error?.response?.data?.msg || error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
}

function downloadFile(url, name) {
  return zipFile(url, name || '蓝牙固件')
}

function getHeaderCellStyle({ column, columnIndex }) {
  const label = column?.label

  if (columnIndex === 0 || ['序号', '操作'].includes(label)) {
    return { background: '#2f80c1', color: '#ffffff', fontWeight: 600 }
  }

  if (['物料编码'].includes(label)) {
    return { background: '#0891b2', color: '#ffffff', fontWeight: 600 }
  }

  if (['版本信息', '模块型号', '版本描述'].includes(label)) {
    return { background: '#27ae60', color: '#ffffff', fontWeight: 600 }
  }

  if (['状态'].includes(label)) {
    return { background: '#8e44ad', color: '#ffffff', fontWeight: 600 }
  }

  if (['创建时间', '发布时间'].includes(label)) {
    return { background: '#d67f1f', color: '#ffffff', fontWeight: 600 }
  }

  return { background: '#f5f7fa', color: '#303133', fontWeight: 600 }
}

function getSubHeaderCellStyle({ column }) {
  const label = column?.label
  return {
    background: label === '操作' ? '#eaf3ff' : '#f5f7fa',
    color: '#475569',
    fontWeight: 600,
  }
}

function getFirmwareDialogHeaderStyle({ column }) {
  const label = column?.label
  if (['版本信息'].includes(label)) {
    return { background: '#27ae60', color: '#ffffff', fontWeight: 600 }
  }
  if (['发布时间'].includes(label)) {
    return { background: '#d67f1f', color: '#ffffff', fontWeight: 600 }
  }
  if (['物料编码'].includes(label)) {
    return { background: '#2f80c1', color: '#ffffff', fontWeight: 600 }
  }
  return { background: '#f8fafc', color: '#475569', fontWeight: 600 }
}

function handleFileUploadChange(value, fileList) {
  if (Array.isArray(fileList) && fileList.length > 0) {
    const lastFile = fileList[fileList.length - 1]
    currentFileName.value = lastFile?.name || ''
    applyForm.fileName = currentFileName.value
  } else if (!value) {
    currentFileName.value = ''
    applyForm.fileName = ''
  }
}

function buildSubmitData() {
  const data = {
    versionNumber: applyForm.versionNumber,
    versionDescription: applyForm.versionDescription,
    fileUrl: applyForm.fileUrl,
  }
  if (currentFileName.value) data.fileName = currentFileName.value
  if (applyForm.version !== undefined) data.version = applyForm.version
  if (String(applyForm.chipPlatform || '').trim()) data.chipPlatform = String(applyForm.chipPlatform).trim()

  if (applyForm.applyType === 1) {
    data.materialCode = applyForm.materialCode
  } else {
    data.targetFirmwareId = applyForm.targetFirmwareId
  }

  return data
}

function loadFirmwareList() {
  firmwareLoading.value = true
  getBluetoothFirmwareList({ ...firmwareQuery })
    .then(res => {
      const data = listData(res)
      firmwareList.value = data.list
      firmwareTotal.value = data.total
    })
    .catch(() => ElMessage.error('获取正式版本列表失败'))
    .finally(() => { firmwareLoading.value = false })
}

function openSelectFirmwareDialog(row = {}) {
  isRepublish.value = false
  currentApplyId.value = ''
  if (firmwareIdOf(row)) {
    confirmFirmwareSelect(row)
    return
  }
  Object.assign(firmwareQuery, { p: 1, l: 50, materialCode: '', versionNumber: '' })
  loadFirmwareList()
  firmwareSelectVisible.value = true
}

function handleFirmwareRowClick(row) {
  confirmFirmwareSelect(row)
}

function confirmFirmwareSelect(row) {
  const targetFirmwareId = firmwareIdOf(row)
  if (!targetFirmwareId) {
    ElMessage.error('当前正式版本缺少版本 ID，无法发起新增固件申请')
    return
  }
  Object.assign(applyForm, emptyForm(), {
    applyType: 2,
    targetFirmwareId,
    targetVersionNumber: row.versionNumber,
    materialCode: row.materialCode,
    targetChipPlatform: row.chipPlatform,
    chipPlatform: row.chipPlatform,
  })
  currentFileName.value = ''
  firmwareSelectVisible.value = false
  applyDialogVisible.value = true
}

async function submitNewApply() {
  if (!(await applyFormRef.value?.validate().catch(() => false))) return
  submitLoading.value = true
  try {
    const res = await createBluetoothFirmwareApply(buildSubmitData())
    ElMessage.success('提交成功，请等待审核')
    applyDialogVisible.value = false
    await router.push('/bluetooth/records')
  } catch (error) {
    ElMessage.error(errorMessage(error, '提交失败'))
  } finally {
    submitLoading.value = false
  }
}

async function submitRepublish() {
  if (!(await applyFormRef.value?.validate().catch(() => false))) return
  submitLoading.value = true
  try {
    await republishBluetoothApply(currentApplyId.value, buildSubmitData())
    ElMessage.success('重新发布成功，请等待审核')
    applyDialogVisible.value = false
    await router.push('/bluetooth/records')
  } catch (error) {
    ElMessage.error(errorMessage(error, '重新发布失败'))
  } finally {
    submitLoading.value = false
  }
}

onMounted(loadList)

function loadList() {
  loading.value = true
  getBluetoothFirmwareList({ ...query })
    .then(res => {
      const data = listData(res)
      list.value = data.list
      total.value = data.total
    })
    .catch(() => ElMessage.error('获取正式版本失败'))
    .finally(() => { loading.value = false })
}

function resetQuery() {
  Object.assign(query, { p: 1, l: 50, materialCode: '', versionNumber: '' })
  loadList()
}
</script>

<style lang="scss" scoped>
.delivery-page {
  height: calc(100vh - 90px);
  max-height: calc(100vh - 90px);
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.delivery-page-table {
  flex: 1;
  min-height: 0;
}

:deep(.el-table__empty-block) {
  min-height: 420px;
}

.firmware-select-header {
  padding: 4px 0 12px;

  .firmware-query-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;

    .el-form-item {
      margin-bottom: 0;
      margin-right: 0;
    }

    .el-input {
      width: 190px !important;
    }

    .form-actions {
      margin-left: auto;
    }
  }
}

.firmware-select-body {
  padding: 0;

  .table-wrapper {
    border: 1px solid #e2e8f0;
  }

  .pretty-table {
    :deep(tr.el-table__row) {
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover > td {
        background-color: #f1f5f9 !important;
      }
    }

    .select-btn {
      font-weight: 600;
    }
  }

  .pagination-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 14px;
  }
}

.apply-dialog {
  .dialog-form {
    padding-top: 6px;
  }

  .source-info-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 4px 0 22px;
    padding: 10px 16px;
    background: #f0f7ff;
    border: 1px solid #d0e1fd;
    border-radius: 6px;

    .bar-title {
      font-size: 13px;
      font-weight: 600;
      color: #1e40af;
      flex-shrink: 0;
    }

    .bar-content {
      display: flex;
      align-items: center;
      gap: 28px;
      font-size: 13px;
    }

    .bar-item {
      display: flex;
      align-items: center;

      .label {
        color: #64748b;
      }

      .val {
        color: #0f172a;
        font-weight: 700;
        font-size: 14px;
      }
    }
  }

  .font-mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-weight: 600;
    color: #1e293b;
    font-size: 13px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
  }
}

:deep(.el-table__expanded-cell) {
  padding: 8px 20px 10px !important;
  background-color: #ffffff !important;
}

:deep(.no-firmware-history .el-table__expand-icon) {
  visibility: hidden;
  pointer-events: none;
}

.expand-table-card {
  text-align: left;

  .expand-table-meta {
    margin: 0 0 4px;
    color: #475569;
    font-size: 12px;
    font-weight: 600;
    line-height: 20px;
  }

  .sub-firmware-table {
    :deep(.el-table__inner-wrapper::before) {
      display: none;
    }

    :deep(th.el-table__cell:not(:last-child)),
    :deep(td.el-table__cell:not(:last-child)) {
      border-right: 1px solid #edf1f5;
    }

    :deep(th.el-table__cell) {
      border-bottom: 1px solid #e5eaf0;
    }

    :deep(td.el-table__cell) {
      border-bottom: 1px solid #edf1f5;
      color: #475569;
    }

    :deep(.el-table__body tr:last-child > td.el-table__cell) {
      border-bottom: 0;
    }

    :deep(.el-table__header-wrapper th.el-table__cell) {
      height: 32px;
    }

    :deep(.el-table__header-wrapper .cell) {
      color: #475569;
      font-size: 12px;
    }

    :deep(.el-table__body-wrapper td.el-table__cell) {
      height: 34px;
    }

    .sub-index-badge {
      color: #64748b;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }

    .download-link-btn {
      font-weight: 500;
    }
  }
}

.expand-empty-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
</style>
