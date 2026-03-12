<template>
  <div class="app-container delivery-page">
    <search-bar :model="queryParams" @search="handleQuery" @reset="resetQuery">
      <el-form-item label="采购单号">
        <el-input
          v-model="queryParams.purchaseOrderCode"
          placeholder="请输入采购单号"
          clearable
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="物料编码">
        <el-input
          v-model="queryParams.invCode"
          placeholder="请输入物料编码"
          clearable
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item label="检验结果">
        <el-select
          v-model="queryParams.testResult"
          clearable
          placeholder="全部"
          style="width: 140px"
        >
          <el-option label="PASS" value="PASS" />
          <el-option label="NG" value="NG" />
        </el-select>
      </el-form-item>
      <el-form-item label="检验时间">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 320px"
        />
      </el-form-item>
    </search-bar>

    <page-table
      class="delivery-page-table"
      :total="total"
      v-model:page="queryParams.p"
      v-model:size="queryParams.l"
      @pagination="getList"
    >
      <el-table
        v-loading="loading"
        :data="tableData"
        height="100%"
        border
        stripe
        align="center"
        header-align="center"
      >
        <el-table-column prop="purchaseOrderCode" label="采购单号" min-width="160" />
        <el-table-column prop="invCode" label="物料编码" min-width="130" />
        <el-table-column prop="invName" label="物料名称" min-width="140" />
        <el-table-column prop="batchNo" label="批次号" min-width="120" />
        <el-table-column
          prop="processName"
          label="制程工序"
          min-width="120"
          align="center"
        />
        <el-table-column
          prop="inspectionQuantity"
          label="检验数量"
          min-width="100"
          align="center"
        />
        <el-table-column
          prop="defectiveQuantity"
          label="不良数量"
          min-width="100"
          align="center"
        />
        <el-table-column
          prop="defectiveRate"
          label="不良率"
          min-width="90"
          align="center"
        />
        <el-table-column
          prop="testResult"
          label="检验结果"
          min-width="90"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.testResult === 'NG' ? 'danger' : 'success'" size="small">
              {{ row.testResult || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="defectDescription"
          label="不良描述"
          min-width="180"
        />
        <el-table-column
          prop="createTime"
          label="检验时间"
          min-width="170"
          align="center"
        />
      </el-table>
    </page-table>
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";

const defaultQuery = {
  purchaseOrderCode: "",
  invCode: "",
  testResult: "",
  startDate: "",
  endDate: "",
  p: 1,
  l: 100,
};

const loading = ref(false);
const total = ref(0);
const tableData = ref([]);
const dateRange = ref([]);
const queryParams = reactive({ ...defaultQuery });

function getList() {
  loading.value = true;
  // TODO: 替换为真实 API 调用
  setTimeout(() => {
    tableData.value = [];
    total.value = 0;
    loading.value = false;
  }, 300);
}

function handleQuery() {
  queryParams.p = 1;
  getList();
}

function resetQuery() {
  Object.assign(queryParams, defaultQuery);
  dateRange.value = [];
  getList();
}

onMounted(() => {
  getList();
});
</script>
