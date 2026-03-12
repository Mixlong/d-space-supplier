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
      <el-form-item label="来料时间">
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
      <template #extra-actions>
        <div class="incoming-quality-actions">
          <el-popover
            v-model:visible="filterVisible"
            placement="bottom-end"
            :width="360"
            trigger="click"
          >
            <template #reference>
              <el-button :icon="Filter" :type="advancedFilterCount > 0 ? 'primary' : 'default'" plain>
                筛选{{ advancedFilterCount > 0 ? `(${advancedFilterCount})` : "" }}
              </el-button>
            </template>
            <div class="incoming-quality-filter">
              <div class="incoming-quality-filter__grid">
                <el-form-item label="物料名称">
                  <el-input
                    v-model="queryParams.invName"
                    placeholder="请输入物料名称"
                    clearable
                  />
                </el-form-item>
                <el-form-item label="是否不良">
                  <el-select
                    v-model="queryParams.isDefective"
                    clearable
                    placeholder="全部"
                    :teleported="false"
                  >
                    <el-option label="仅不良" :value="1" />
                  </el-select>
                </el-form-item>
                <el-form-item label="是否特采">
                  <el-select
                    v-model="queryParams.isSpecialProcurement"
                    clearable
                    placeholder="全部"
                    :teleported="false"
                  >
                    <el-option label="否" :value="0" />
                    <el-option label="是" :value="1" />
                  </el-select>
                </el-form-item>
              </div>
              <div class="incoming-quality-filter__footer">
                <el-button @click="clearAdvancedFilters">清空</el-button>
                <el-button type="primary" @click="applyAdvancedFilters">确认</el-button>
              </div>
            </div>
          </el-popover>

          <div class="quality-stats">
            <el-tooltip content="批次合格率" placement="top">
              <div class="quality-stats__item">
                <el-icon
                  :size="16"
                  :color="isBelowThreshold(qualitySummary.batchQualificationRate) ? '#f56c6c' : '#67c23a'"
                >
                  <CircleCheckFilled />
                </el-icon>
                <span>{{ qualitySummary.batchQualificationRate }}</span>
              </div>
            </el-tooltip>
            <el-tooltip content="总特采批次数" placement="top">
              <div class="quality-stats__item">
                <el-icon
                  :size="16"
                  :color="isBelowThreshold(qualitySummary.totalSpecialProcurementBatchCount) ? '#f56c6c' : '#e6a23c'"
                >
                  <WarningFilled />
                </el-icon>
                <span>{{ qualitySummary.totalSpecialProcurementBatchCount }}</span>
              </div>
            </el-tooltip>
          </div>
        </div>
      </template>
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
          prop="arrivalQuantity"
          label="来料数量"
          min-width="100"
          align="center"
        />
        <el-table-column
          prop="samplingQuantity"
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
          prop="isSpecialProcurement"
          label="是否特采"
          min-width="90"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="Number(row.isSpecialProcurement) === 1 ? 'danger' : 'info'"
              size="small"
            >
              {{ Number(row.isSpecialProcurement) === 1 ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="来料时间"
          min-width="170"
          align="center"
        />
      </el-table>
    </page-table>
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import {
  CircleCheckFilled,
  Filter,
  WarningFilled,
} from "@element-plus/icons-vue";
import { getMyIncomingQuality, getMyMetrics } from "@/api/vendor-delivery";

const defaultQuery = {
  purchaseOrderCode: "",
  invCode: "",
  invName: "",
  isDefective: undefined,
  testResult: "",
  inventoryStartDate: "",
  inventoryEndDate: "",
  isSpecialProcurement: undefined,
  p: 1,
  l: 100,
};

const loading = ref(false);
const total = ref(0);
const tableData = ref([]);
const dateRange = ref([]);
const filterVisible = ref(false);
const queryParams = reactive({ ...defaultQuery });
const qualitySummary = reactive({
  batchQualificationRate: "--",
  totalSpecialProcurementBatchCount: "--",
});
const advancedFilterCount = computed(() => {
  let count = 0;
  if (queryParams.invName) count += 1;
  if (queryParams.isDefective !== undefined && queryParams.isDefective !== null && queryParams.isDefective !== "") {
    count += 1;
  }
  if (
    queryParams.isSpecialProcurement !== undefined &&
    queryParams.isSpecialProcurement !== null &&
    queryParams.isSpecialProcurement !== ""
  ) {
    count += 1;
  }
  return count;
});

function resetMetrics() {
  qualitySummary.batchQualificationRate = "--";
  qualitySummary.totalSpecialProcurementBatchCount = "--";
}

function formatPercent(val) {
  if (val === null || val === undefined || val === "") return "--";
  const num = Number(val);
  if (Number.isNaN(num)) return "--";
  return `${num}%`;
}

function parseMetricNumber(val) {
  if (val === null || val === undefined || val === "") return Number.NaN;
  const normalized = String(val).replace("%", "").trim();
  const num = Number(normalized);
  return Number.isFinite(num) ? num : Number.NaN;
}

function isBelowThreshold(val, threshold = 50) {
  const num = parseMetricNumber(val);
  return Number.isFinite(num) && num < threshold;
}

function getMetrics() {
  getMyMetrics()
    .then((res) => {
      const data = res?.data || {};
      qualitySummary.batchQualificationRate = formatPercent(data.batchQualificationRate);
      const specialCount = data.totalSpecialProcurementBatchCount;
      qualitySummary.totalSpecialProcurementBatchCount =
        specialCount === null || specialCount === undefined || specialCount === ""
          ? "--"
          : String(specialCount);
    })
    .catch(() => {
      resetMetrics();
    });
}

function buildQuery() {
  const params = { ...queryParams };
  if (dateRange.value?.length === 2) {
    params.inventoryStartDate = dateRange.value[0];
    params.inventoryEndDate = dateRange.value[1];
  } else {
    params.inventoryStartDate = "";
    params.inventoryEndDate = "";
  }
  return params;
}

function getList(refreshMetrics = false) {
  if (refreshMetrics === true) {
    getMetrics();
  }
  loading.value = true;
  getMyIncomingQuality(buildQuery())
    .then((res) => {
      const data = res.data || {};
      tableData.value = data.list || [];
      total.value = Number(data.total || 0);
    })
    .catch((error) => {
      tableData.value = [];
      total.value = 0;
      ElMessage.error(
        error?.message === "Network Error"
          ? "网络连接失败，请检查后端服务是否可用"
          : "获取来料质量数据失败，请稍后重试"
      );
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleQuery() {
  queryParams.p = 1;
  getList(true);
}

function clearAdvancedFilters() {
  queryParams.invName = "";
  queryParams.isDefective = undefined;
  queryParams.isSpecialProcurement = undefined;
}

function applyAdvancedFilters() {
  filterVisible.value = false;
  handleQuery();
}

function resetQuery() {
  Object.assign(queryParams, defaultQuery);
  dateRange.value = [];
  filterVisible.value = false;
  getList(true);
}

onMounted(() => {
  getList(true);
});
</script>

<style lang="scss" scoped>
.incoming-quality-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 12px;
}

.incoming-quality-filter {
  &__grid {
    display: grid;
    grid-template-columns: 1fr;
  }

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 6px;
  }
}

.quality-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-left: 16px;
  border-left: 1px solid #dcdfe6;

  &__item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #606266;
    font-weight: 500;

    span {
      color: #409eff;
      font-weight: 600;
    }
  }
}
</style>
