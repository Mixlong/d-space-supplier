<template>
  <div class="app-container delivery-page">
    <search-bar :model="query" @search="loadList" @reset="resetQuery">
      <el-form-item label="申请类型">
        <el-select v-model="query.applyType" clearable placeholder="全部" style="width: 140px">
          <el-option v-for="item in applyTypes" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="流程状态">
        <el-select v-model="query.processState" clearable placeholder="全部" style="width: 160px">
          <el-option v-for="item in searchProcessStates" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="版本信息">
        <el-input v-model="query.versionNumber" clearable placeholder="请输入版本信息" @keyup.enter="loadList" />
      </el-form-item>
      <template #extra-actions>
        <el-button type="primary" @click="openAddVersionDialog()">新增版本</el-button>
        <el-button v-if="false" type="primary" @click="openSelectFirmwareDialog()">新增固件</el-button>
      </template>
    </search-bar>
    <page-table class="delivery-page-table" :total="total" v-model:page="query.p" v-model:size="query.l" @pagination="loadList">
      <el-table v-loading="loading" :data="list" height="100%" border stripe :header-cell-style="getHeaderCellStyle">
        <el-table-column label="序号" width="65" align="center">
          <template #default="{ $index }">
            {{ (query.p - 1) * query.l + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="applyType" label="申请类型" width="120" align="center">
          <template #default="{ row }">
            <span class="type-badge" :class="Number(row.applyType) === 1 ? 'is-version' : 'is-firmware'">
              {{ applyTypeLabel(row.applyType) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="130" align="center" show-overflow-tooltip />
        <el-table-column prop="versionNumber" label="版本信息" width="150" align="center" show-overflow-tooltip />
        <el-table-column prop="chipPlatform" label="模块型号" width="130" align="center" show-overflow-tooltip />
        <el-table-column prop="versionDescription" label="版本描述" min-width="200" align="center" show-overflow-tooltip />
        <el-table-column prop="processState" label="流程状态" width="130" align="center">
          <template #default="{ row }">
            <div class="status-badge-tag" :class="getStatusBadgeClass(row.processState)">
              <span class="status-dot"></span>
              <span class="status-text">{{ stateLabel(row.processState) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="220" align="left">
          <template #default="{ row }">
            <div v-if="auditRemarks[idOf(row)]?.length" class="audit-remark">
              <div v-for="item in auditRemarks[idOf(row)]" :key="item.node" class="audit-remark__item" :class="item.type">
                <span class="audit-remark__node">{{ item.node }}：</span>
                <span>{{ item.remark }}</span>
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="155" align="center" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="canEditDuringAudit(row)" link type="primary" @click="openPublishDialog(row, true)">编辑</el-button>
            <el-button v-else-if="canPublish(row)" link type="primary" @click="openPublishDialog(row)">提交审核</el-button>
            <el-button v-if="Number(row.processState) !== 50" link type="danger" @click="removeApply(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty :image-size="72" description="暂无审核记录" />
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
            @change="handleFileUploadChange"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="applyDialogVisible = false">取消</el-button>
          <el-button v-if="!isRepublish" type="primary" :loading="submitLoading" @click="submitApply">提交审核</el-button>
          <el-button v-else type="primary" :loading="submitLoading" @click="submitApply">{{ isAuditEditing ? '保存修改' : '重新发布' }}</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="firmwareSelectVisible" class="firmware-select-dialog custom-dialog" title="选择正式版本" width="920px" destroy-on-close align-center>
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
            max-height="420"
            stripe
            highlight-current-row
            class="pretty-table"
            :row-key="firmwareRowKey"
            :tree-props="{ children: 'children' }"
            default-expand-all
            @row-click="handleFirmwareRowClick"
          >
            <el-table-column label="序号" width="65" align="center">
              <template #default="{ $index }">
                {{ (firmwareQuery.p - 1) * firmwareQuery.l + $index + 1 }}
              </template>
            </el-table-column>
            <el-table-column prop="materialCode" label="物料编码" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column prop="versionNumber" label="版本信息" min-width="150" align="center" show-overflow-tooltip />
            <el-table-column prop="chipPlatform" label="模块型号" min-width="130" align="center" show-overflow-tooltip />
            <el-table-column prop="publishTime" label="发布时间" min-width="170" align="center" />
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

    <el-dialog v-model="detailVisible" class="custom-dialog" title="申请详情" width="780px" destroy-on-close align-center>
      <div v-loading="detailLoading" class="detail-body">
        <el-descriptions :column="2" border class="version-descriptions" v-if="detail">
          <el-descriptions-item label="申请类型">{{ applyTypeLabel(detail.applyType) }}</el-descriptions-item>
          <el-descriptions-item label="流程状态"><el-tag :type="stateType(detail.processState)">{{ stateLabel(detail.processState) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="物料编码">{{ detail.materialCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="版本信息">{{ detail.versionNumber || '-' }}</el-descriptions-item>
          <el-descriptions-item label="模块型号">{{ detail.chipPlatform || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detail.createTime || detail.createdAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detail.updateTime || detail.updatedAt || '-' }}</el-descriptions-item>
          <el-descriptions-item label="固件文件" :span="2"><el-link v-if="detail.fileUrl" type="primary" :underline="false" @click="downloadFile(detail.fileUrl, detail.fileName)">下载固件</el-link><span v-else>-</span></el-descriptions-item>
          <el-descriptions-item label="版本描述" :span="2">{{ detail.versionDescription || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div class="log-title">审核记录</div>
        <el-timeline v-if="logs.length" :hollow="true">
          <el-timeline-item
            v-for="(log, index) in logs"
            :key="log.id || index"
            :timestamp="log.createTime || ''"
            :type="getLogType(log)"
          >
            <div class="log-item-content">
              <div class="log-item-header">
                <strong class="log-action">{{ getLogNodeName(log) }}</strong>
                <span>：{{ getLogActionText(log) }}</span>
                <span v-if="getLogOperator(log)" class="log-handler">
                  （处理人：{{ getLogOperator(log) }}）
                </span>
              </div>
              <div v-if="log.remark" class="log-remark">{{ log.remark }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else :image-size="60" description="暂无审核记录" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'

import {
  createBluetoothFirmwareApply,
  createBluetoothVersionApply,
  deleteBluetoothApply,
  getBluetoothApplyDetail,
  getBluetoothApplyList,
  getBluetoothApplyLogs,
  getBluetoothFirmwareList,
  republishBluetoothApply,
} from '@/api/vendor-bluetooth'
import { zipFile } from '@/utils/fileDownload'

const applyTypes = [{ value: 1, label: '新增版本' }, { value: 2, label: '新增固件' }]
const processStates = [
  { value: 0, label: '草稿' },
  { value: 10, label: '待测试审核' },
  { value: 20, label: '测试驳回' },
  { value: 30, label: '待终审' },
  { value: 40, label: '终审驳回' },
  { value: 50, label: '已发布' },
  { value: 60, label: '已撤回' },
]

const searchProcessStates = [
  { value: 10, label: '待测试审核' },
  { value: 20, label: '测试驳回' },
  { value: 30, label: '待终审' },
  { value: 40, label: '终审驳回' },
  { value: 50, label: '已发布' },
]

const query = reactive({ p: 1, l: 50, applyType: '', processState: '', versionNumber: '' })
const list = ref([])
const total = ref(0)
const loading = ref(false)
const auditRemarks = ref({})

const applyDialogVisible = ref(false)
const submitLoading = ref(false)
const applyFormRef = ref()
const isRepublish = ref(false)
const isAuditEditing = ref(false)
const currentApplyId = ref('')

const firmwareSelectVisible = ref(false)
const firmwareLoading = ref(false)
const firmwareList = ref([])
const firmwareTotal = ref(0)
const firmwareQuery = reactive({ p: 1, l: 50, materialCode: '', versionNumber: '' })

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)
const logs = ref([])

const emptyForm = () => ({ applyType: 1, targetFirmwareId: '', targetVersionNumber: '', targetChipPlatform: '', materialCode: '', chipPlatform: '', versionNumber: '', versionDescription: '', fileUrl: '', fileName: '', version: undefined })
const applyForm = reactive(emptyForm())
const currentFileName = ref('')

const dialogTitle = computed(() => isAuditEditing.value ? '编辑申请' : isRepublish.value ? '重新发布申请' : applyForm.applyType === 1 ? '新增蓝牙版本申请' : '新增固件申请')
const applyRules = computed(() => ({
  versionNumber: [{ required: true, message: '请输入版本信息', trigger: 'blur' }],
  fileUrl: [{ required: true, message: '请上传固件文件', trigger: 'change' }],
}))

function unwrap(res) { return res?.data ?? res ?? {} }
function listData(res) { const data = unwrap(res); return { list: data.list || data.records || [], total: Number(data.total || 0) } }
function applyTypeLabel(value) { return applyTypes.find(item => Number(item.value) === Number(value))?.label || '-' }
function stateLabel(value) { return processStates.find(item => Number(item.value) === Number(value))?.label || '未知状态' }
function stateType(value) { return ({ 20: 'danger', 40: 'danger', 50: 'success', 60: 'info', 10: 'warning', 30: 'warning' })[Number(value)] || 'info' }
function getStatusBadgeClass(state) {
  const num = Number(state)
  if (num === 50) return 'is-success'
  if ([10, 30].includes(num)) return 'is-warning'
  if ([20, 40].includes(num)) return 'is-danger'
  return 'is-info'
}
function canPublish(row) { return [20, 40].includes(Number(row.processState)) }
function canEditDuringAudit(row) { return [10, 30].includes(Number(row.processState)) }
function idOf(row) { return row.id ?? row.applyId }
function firmwareIdOf(row) { return row.id ?? row.firmwareId ?? row.bluetoothFirmwareId }
function errorMessage(error, fallback) {
  return error?.response?.data?.msg || error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback
}

function getHeaderCellStyle({ column }) {
  const label = column?.label

  if (['序号', '申请类型', '操作'].includes(label)) {
    return { background: '#2f80c1', color: '#ffffff', fontWeight: 600 }
  }

  if (['物料编码'].includes(label)) {
    return { background: '#0891b2', color: '#ffffff', fontWeight: 600 }
  }

  if (['版本信息', '模块型号', '版本描述'].includes(label)) {
    return { background: '#27ae60', color: '#ffffff', fontWeight: 600 }
  }

  if (['流程状态', '审核备注'].includes(label)) {
    return { background: '#7c3aed', color: '#ffffff', fontWeight: 600 }
  }

  if (['创建时间'].includes(label)) {
    return { background: '#d67f1f', color: '#ffffff', fontWeight: 600 }
  }

  return { background: '#f5f7fa', color: '#303133', fontWeight: 600 }
}

function loadFirmwareList() {
  firmwareLoading.value = true
  getBluetoothFirmwareList({ ...firmwareQuery })
    .then(res => {
      const data = listData(res)
      firmwareList.value = normalizeFirmwareTree(data.list)
      firmwareTotal.value = data.total
    })
    .catch(() => ElMessage.error('获取正式版本列表失败'))
    .finally(() => { firmwareLoading.value = false })
}

function normalizeFirmwareTree(rows = []) {
  return rows.map(row => ({
    ...row,
    children: normalizeFirmwareTree(row.children || row.firmwareList || []),
  }))
}

function firmwareRowKey(row) {
  return firmwareIdOf(row) || `${row.materialCode || ''}-${row.versionNumber || ''}-${row.publishTime || ''}`
}

function openAddVersionDialog() {
  Object.assign(applyForm, emptyForm(), { applyType: 1 })
  currentFileName.value = ''
  isRepublish.value = false
  isAuditEditing.value = false
  applyDialogVisible.value = true
}

function openSelectFirmwareDialog() {
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
  isRepublish.value = false
  isAuditEditing.value = false
  firmwareSelectVisible.value = false
  applyDialogVisible.value = true
}

const nodeTypeMap = {
  CREATE: '申请创建',
  SUBMIT: '提交审核',
  TEST: '测试审核',
  FINAL: '终审',
  PUBLISH: '版本发布',
}
const actionTypeMap = {
  CREATE: '创建申请',
  SUBMIT: '提交审核',
  PASS: '审核通过',
  REJECT: '审核驳回',
  PUBLISH: '正式发布',
}

function getLogType(log) {
  const action = String(log.actionType || '').toUpperCase()
  if (['PASS', 'PUBLISH'].includes(action)) return 'success'
  if (action === 'REJECT') return 'danger'
  return 'primary'
}

function getLogNodeName(log) {
  const type = String(log.nodeType || '').toUpperCase()
  return nodeTypeMap[type] || '审核记录'
}

function getLogActionText(log) {
  const action = String(log.actionType || '').toUpperCase()
  const node = String(log.nodeType || '').toUpperCase()

  if (action === 'PASS') {
    if (node === 'TEST') return '测试通过'
    if (node === 'FINAL') return '终审通过'
  }
  if (action === 'REJECT') {
    if (node === 'TEST') return '测试驳回'
    if (node === 'FINAL') return '终审驳回'
  }
  return actionTypeMap[action] || '已处理'
}

function getLogOperator(log) {
  return log.operatorName || log.handlerName || log.operator || log.userName || ''
}

function normalizeLogs(value) {
  return [...value].sort((a, b) => {
    const timeA = new Date(a.createTime || a.createdAt || 0).getTime()
    const timeB = new Date(b.createTime || b.createdAt || 0).getTime()
    return timeB - timeA
  })
}

function getLogList(res) {
  const data = unwrap(res)
  return data.list || data.records || (Array.isArray(data) ? data : [])
}

function getLatestAuditLog(logs, nodeType) {
  return normalizeLogs(logs).find(log => String(log.nodeType || '').toUpperCase() === nodeType && ['PASS', 'REJECT'].includes(String(log.actionType || '').toUpperCase()))
}

function formatAuditRemarks(logs) {
  return [
    { node: '测试审核', log: getLatestAuditLog(logs, 'TEST') },
    { node: '终审', log: getLatestAuditLog(logs, 'FINAL') },
  ].filter(item => item.log).map(({ node, log }) => {
    const passed = String(log.actionType || '').toUpperCase() === 'PASS'
    return {
      node,
      remark: String(log.remark || '').trim(),
      type: passed ? 'is-pass' : 'is-reject',
    }
  }).filter(item => item.remark)
}

function loadAuditRemarks(rows) {
  const remarksMap = {}
  rows.forEach(row => {
    const id = idOf(row)
    if (id && Array.isArray(row.logs)) {
      remarksMap[id] = formatAuditRemarks(row.logs)
    }
  })
  auditRemarks.value = remarksMap
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
  if (isRepublish.value && applyForm.version !== undefined) data.version = applyForm.version
  if (String(applyForm.chipPlatform || '').trim()) data.chipPlatform = String(applyForm.chipPlatform).trim()

  if (applyForm.applyType === 1) {
    data.materialCode = applyForm.materialCode
  } else {
    data.targetFirmwareId = applyForm.targetFirmwareId
  }

  return data
}

function loadList() {
  loading.value = true
  getBluetoothApplyList({ ...query })
    .then(res => {
      const data = listData(res)
      list.value = data.list
      total.value = data.total
      auditRemarks.value = {}
      loadAuditRemarks(data.list)
    })
    .catch(() => ElMessage.error('获取申请列表失败'))
    .finally(() => { loading.value = false })
}

function resetQuery() {
  Object.assign(query, { p: 1, l: 50, applyType: '', processState: '', versionNumber: '' })
  loadList()
}

async function openPublishDialog(row, editingDuringAudit = false) {
  Object.assign(applyForm, emptyForm(), { ...row, applyType: Number(row.applyType), version: row.version })
  currentFileName.value = row.fileName || ''
  isRepublish.value = true
  isAuditEditing.value = editingDuringAudit
  currentApplyId.value = idOf(row)
  if (Number(applyForm.applyType) === 2 && currentApplyId.value) {
    try {
      const applyDetail = unwrap(await getBluetoothApplyDetail(currentApplyId.value))
      const targetFirmware = applyDetail.targetFirmware || {}
      Object.assign(applyForm, {
        targetFirmwareId: applyDetail.targetFirmwareId || firmwareIdOf(targetFirmware) || applyForm.targetFirmwareId,
        targetVersionNumber: targetFirmware.versionNumber || applyDetail.targetVersionNumber || applyForm.targetVersionNumber,
        materialCode: targetFirmware.materialCode || applyDetail.materialCode || applyForm.materialCode,
        targetChipPlatform: targetFirmware.chipPlatform || applyForm.targetChipPlatform,
        chipPlatform: applyDetail.chipPlatform || targetFirmware.chipPlatform || applyForm.chipPlatform,
      })
    } catch {
      ElMessage.warning('原版本信息获取失败，请确认后重新发布')
    }
  }
  applyDialogVisible.value = true
}

async function submitApply() {
  if (!(await applyFormRef.value?.validate().catch(() => false))) return
  submitLoading.value = true
  try {
    if (isRepublish.value) {
      await republishBluetoothApply(currentApplyId.value, buildSubmitData())
      ElMessage.success(isAuditEditing.value ? '修改成功' : '重新发布成功，请等待审核')
    } else {
      if (Number(applyForm.applyType) === 1) {
        await createBluetoothVersionApply(buildSubmitData())
      } else {
        if (!applyForm.targetFirmwareId) throw new Error('请选择需要更新的正式版本')
        await createBluetoothFirmwareApply(buildSubmitData())
      }
      ElMessage.success('提交成功，请等待审核')
    }
    applyDialogVisible.value = false
    loadList()
  } catch (error) {
    ElMessage.error(errorMessage(error, '提交失败'))
  } finally {
    submitLoading.value = false
  }
}

async function removeApply(row) {
  try {
    await ElMessageBox.confirm('删除后申请将撤回，审核待办也会失效，是否继续？', '确认删除', { type: 'warning' })
    await deleteBluetoothApply(idOf(row))
    ElMessage.success('申请已删除')
    loadList()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(errorMessage(error, '删除失败'))
  }
}

async function openDetail(row) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  logs.value = []
  try {
    const id = idOf(row)
    const [detailRes, logsRes] = await Promise.all([getBluetoothApplyDetail(id), getBluetoothApplyLogs(id)])
    detail.value = unwrap(detailRes)
    logs.value = normalizeLogs(getLogList(logsRes))
  } catch {
    ElMessage.error('获取申请详情失败')
  } finally {
    detailLoading.value = false
  }
}

function downloadFile(url, name) {
  return zipFile(url, name || '蓝牙固件')
}

onMounted(loadList)
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

/* 申请类型专属高亮 Badge */
.type-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;

  &.is-version {
    background: #e0f2fe;
    color: #0284c7;
    border: 1px solid #bae6fd;
  }

  &.is-firmware {
    background: #f3e8ff;
    color: #7c3aed;
    border: 1px solid #e9d5ff;
  }
}

.audit-remark {
  display: flex;
  flex-direction: column;
  gap: 3px;
  line-height: 18px;
  font-size: 12px;

  &__item {
    display: flex;
    min-width: 0;
    gap: 4px;
    color: #606266;

    &.is-pass .audit-remark__node {
      color: #16a34a;
    }

    &.is-reject .audit-remark__node {
      color: #dc2626;
    }
  }

  &__node {
    flex: 0 0 64px;
    font-weight: 600;
    text-align: justify;
    text-align-last: justify;
  }
}

/* 流程状态 Status Badge 效果 */
.status-badge-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  border: 1px solid transparent;

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &.is-success {
    background: #ecfdf5;
    color: #047857;
    border-color: #a7f3d0;
    .status-dot {
      background: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
  }

  &.is-warning {
    background: #fffbeb;
    color: #b45309;
    border-color: #fde68a;
    .status-dot {
      background: #f59e0b;
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
    }
  }

  &.is-danger {
    background: #fef2f2;
    color: #b91c1c;
    border-color: #fecaca;
    .status-dot {
      background: #ef4444;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
    }
  }

  &.is-info {
    background: #f8fafc;
    color: #475569;
    border-color: #e2e8f0;
    .status-dot {
      background: #94a3b8;
    }
  }
}



/* 关联固件搜索弹窗 */
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
    width: 100%;
    overflow: hidden;
  }

  .pretty-table {
    width: 100%;
    --el-table-header-bg-color: #f5f7fa;
    --el-table-header-text-color: #303133;
    --el-table-row-hover-bg-color: #eef6ff;

    :deep(th.el-table__cell) {
      height: 38px;
      background: #f5f7fa !important;
      color: #475569 !important;
      font-weight: 600;
      border-bottom: 1px solid #e5eaf0;
    }

    :deep(td.el-table__cell) {
      height: 40px;
      background: #fff;
      color: #475569;
      border-bottom: 1px solid #edf1f5;
    }

    :deep(th.el-table__cell:not(:last-child)),
    :deep(td.el-table__cell:not(:last-child)) {
      border-right: 1px solid #edf1f5;
    }

    :deep(.el-table__inner-wrapper::before) {
      display: none;
    }

    :deep(.el-table__body tr:last-child > td.el-table__cell) {
      border-bottom: 0;
    }

    :deep(tr.el-table__row) {
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover > td {
        background-color: #eef6ff !important;
      }
    }

    .select-btn {
      font-weight: 600;
    }

  }

  .pagination-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
    padding-top: 0;
    background: #fff;
  }
}

.apply-dialog {
  .dialog-form {
    padding-top: 6px;
  }

  /* 原版本信息轻量卡片美化 */
  .version-info-card {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 32px;
    padding: 10px 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;

    .info-item {
      display: flex;
      align-items: center;
      font-size: 13px;
    }

    .info-label {
      color: #64748b;
      font-weight: 500;
    }

    .info-value {
      color: #0f172a;
      font-weight: 600;
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

.detail-body {
  padding: 4px 0;
  min-height: 400px;

  :deep(.el-descriptions),
  :deep(.el-descriptions__header),
  :deep(.el-descriptions__body),
  :deep(.el-descriptions__table),
  :deep(.el-descriptions__cell) {
    border-radius: 0 !important;
  }

  :deep(.el-descriptions) {
    overflow: hidden;

    .el-descriptions__table {
      border-color: #e2e8f0 !important;
    }

    .el-descriptions__cell {
      padding: 12px 16px !important;
      border-color: #e2e8f0 !important;
    }

    .el-descriptions__label.is-bordered-label {
      background-color: #f8fafc !important;
      color: #475569 !important;
      font-weight: 600 !important;
      width: 110px;
    }

    .el-descriptions__content.is-bordered-content {
      background-color: #ffffff !important;
      color: #0f172a !important;
    }
  }
}

.log-title {
  margin: 24px 0 16px;
  color: #1e293b;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;

  &::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 14px;
    margin-right: 8px;
    background: #3b82f6;
    border-radius: 2px;
  }
}

.detail-body :deep(.el-timeline) {
  padding-left: 8px;

  .el-timeline-item {
    padding-bottom: 20px;
  }

  .el-timeline-item__timestamp {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 4px;
  }

  .log-item-content {
    font-size: 13px;
    color: #1e293b;
  }

  .log-item-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }

  .log-action {
    font-weight: 600;
  }

  .log-remark {
    margin-top: 6px;
    color: #64748b;
    line-height: 1.6;
    white-space: pre-wrap;
  }

}
</style>
<style>
/* ===== 统一弹窗全局美化（el-dialog teleport 到 body）===== */
.custom-dialog {
  padding: 0 !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04) !important;
}

.custom-dialog .el-dialog__header {
  margin: 0 !important;
  padding: 16px 24px !important;
  border-bottom: 1px solid #f1f5f9;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.custom-dialog .el-dialog__title {
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #0f172a !important;
  line-height: 1.5 !important;
}

.custom-dialog .el-dialog__headerbtn {
  position: relative !important;
  top: auto !important;
  right: auto !important;
  width: 24px !important;
  height: 24px !important;
  margin-top: 0 !important;
}

.custom-dialog .el-dialog__body {
  padding: 24px !important;
}

.custom-dialog .el-dialog__footer {
  padding: 14px 24px !important;
  border-top: 1px solid #f1f5f9;
  background: #fafafa;
}

/* 新增固件申请：统一表单节奏和信息区层级 */
.apply-dialog .el-dialog__body {
  padding: 22px 28px 10px !important;
}

.apply-dialog .dialog-form {
  padding: 0 4px;
}

.apply-dialog .dialog-form .el-form-item {
  align-items: flex-start;
  margin-bottom: 18px !important;
}

.apply-dialog .dialog-form .el-form-item__label {
  padding-right: 18px;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  line-height: 32px;
}

.apply-dialog .dialog-form .el-form-item__content {
  min-width: 0;
}

.apply-dialog .dialog-form .el-input__wrapper {
  min-height: 34px;
  border-radius: 5px;
  box-shadow: 0 0 0 1px #cbd5e1 inset;
  transition: box-shadow 0.2s ease;
}

.apply-dialog .dialog-form .el-input__wrapper:hover,
.apply-dialog .dialog-form .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px #409eff inset;
}

.apply-dialog .dialog-form .el-textarea__inner {
  min-height: 86px !important;
  padding: 9px 11px;
  border-radius: 5px;
  box-shadow: 0 0 0 1px #cbd5e1 inset;
  resize: vertical;
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

.apply-dialog .source-version-section {
  margin: 0 0 22px;
}

.apply-dialog .source-version-title {
  display: flex;
  align-items: center;
  margin: 0 0 10px;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.apply-dialog .source-version-title::before {
  width: 3px;
  height: 14px;
  margin-right: 8px;
  border-radius: 2px;
  background: #409eff;
  content: '';
}

.apply-dialog .version-info-card {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
  width: 100%;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #dbe4ee;
  border-left: 3px solid #409eff;
  border-radius: 6px;
}

.apply-dialog .version-info-card .info-item {
  display: flex;
  align-items: center;
  min-width: 0;
  font-size: 13px;
  line-height: 20px;
}

.apply-dialog .version-info-card .info-label {
  flex-shrink: 0;
  color: #64748b;
}

.apply-dialog .version-info-card .info-value {
  min-width: 0;
  margin-left: 4px;
  overflow: hidden;
  color: #1e293b;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.apply-dialog .upload-file-uploader {
  margin-bottom: 4px;
}

.apply-dialog .el-upload__tip {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 18px;
}

.apply-dialog .el-upload__tip b {
  color: #ef4444 !important;
}

.apply-dialog .dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.apply-dialog .dialog-footer .el-button {
  min-width: 84px;
}

@media (max-width: 640px) {
  .apply-dialog .version-info-card {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .apply-dialog .el-dialog__body {
    padding: 18px 16px 6px !important;
  }
}

/* 固件列表弹窗：单独调优 body padding，防止搜索栏上方间距过宽 */
.firmware-select-dialog {
  width: min(920px, calc(100vw - 32px)) !important;
  background: #fff !important;
}

.firmware-select-dialog .el-dialog__header,
.firmware-select-dialog .el-dialog__body,
.firmware-select-dialog .el-dialog__footer {
  background: #fff !important;
}

.firmware-select-dialog .el-dialog__body {
  padding-top: 12px !important;
  padding-bottom: 20px !important;
}

/* 固件列表弹窗：空状态最小高度 */
.firmware-select-dialog .el-table__empty-block {
  min-height: 220px;
}
</style>
