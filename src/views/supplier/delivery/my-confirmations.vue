<template>
  <div class="app-container delivery-page">
    <search-bar :model="queryParams" @search="handleQuery" @reset="resetQuery">
      <el-form-item label="采购订单号">
        <el-input
          v-model="queryParams.poCode"
          placeholder="请输入采购订单号"
          clearable
          @keyup.enter="handleQuery"
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="开始日期">
        <el-date-picker
          v-model="queryParams.beginTime"
          type="date"
          placeholder="请选择开始日期"
          value-format="YYYY-MM-DD"
          style="width: 160px"
        />
      </el-form-item>
      <el-form-item label="结束日期">
        <el-date-picker
          v-model="queryParams.endTime"
          type="date"
          placeholder="请选择结束日期"
          value-format="YYYY-MM-DD"
          style="width: 160px"
        />
      </el-form-item>
      <template #extra-actions>
        <div class="delivery-metric">
          <el-tooltip content="订单准交率(%)" placement="top">
            <div class="delivery-metric__item">
              <el-icon
                :size="16"
                :color="isBelowThreshold(onTimeDeliveryRate) ? '#f56c6c' : '#409eff'"
              >
                <TrendCharts />
              </el-icon>
              <span>{{ onTimeDeliveryRate }}</span>
            </div>
          </el-tooltip>
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
        <el-table-column label="序号" width="65" align="center" label-class-name="hdr-order">
          <template #default="{ $index }">
            {{ (queryParams.p - 1) * queryParams.l + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column
          prop="poCode"
          min-width="180"
          class-name="nowrap-cell"
          label-class-name="hdr-order"
        >
          <template #header>
            <el-popover
              v-model:visible="columnFilterVisible.poCode"
              placement="bottom"
              :width="280"
              trigger="click"
            >
              <template #reference>
                <div class="column-filter-trigger" :class="{ 'is-active': !!queryParams.poCode }">
                  <span>采购订单号</span>
                  <el-icon
                    class="column-filter-trigger__icon"
                    :class="{ 'is-active': !!queryParams.poCode }"
                  >
                    <Filter />
                  </el-icon>
                </div>
              </template>
              <div class="column-filter-popover">
                <el-input
                  v-model="queryParams.poCode"
                  placeholder="请输入采购订单号"
                  clearable
                  @keyup.enter="applyColumnFilter('poCode')"
                />
                <div class="column-filter-popover__footer">
                  <el-button type="primary" text @click="applyColumnFilter('poCode')">筛选</el-button>
                  <el-button text @click="resetColumnFilter('poCode')">重置</el-button>
                </div>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column
          prop="invCode"
          min-width="150"
          class-name="nowrap-cell"
          label-class-name="hdr-order"
        >
          <template #header>
            <el-popover
              v-model:visible="columnFilterVisible.invCode"
              placement="bottom"
              :width="280"
              trigger="click"
            >
              <template #reference>
                <div class="column-filter-trigger" :class="{ 'is-active': !!queryParams.invCode }">
                  <span>物料编码</span>
                  <el-icon
                    class="column-filter-trigger__icon"
                    :class="{ 'is-active': !!queryParams.invCode }"
                  >
                    <Filter />
                  </el-icon>
                </div>
              </template>
              <div class="column-filter-popover">
                <el-input
                  v-model="queryParams.invCode"
                  placeholder="请输入物料编码"
                  clearable
                  @keyup.enter="applyColumnFilter('invCode')"
                />
                <div class="column-filter-popover__footer">
                  <el-button type="primary" text @click="applyColumnFilter('invCode')">筛选</el-button>
                  <el-button text @click="resetColumnFilter('invCode')">重置</el-button>
                </div>
              </div>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column
          prop="quantity"
          label="采购数量"
          min-width="100"
          align="center"
          label-class-name="hdr-order"
        />
        <el-table-column
          prop="deliveredQty"
          label="供应商已送数量"
          min-width="110"
          align="center"
          label-class-name="hdr-delivery"
        />
        <el-table-column
          prop="planArriveDate"
          label="PMC计划到货日期"
          min-width="220"
          align="center"
          label-class-name="hdr-demand"
          class-name="top-align-cell"
        >
          <template #default="{ row }">
            <span v-if="!row.planArriveDate && parsePmcPlans(row).length === 0" class="no-date">-</span>
            <div
              v-else-if="parsePmcPlans(row).length > 0"
              class="pmc-plan-inline"
            >
              <div
                v-for="(plan, index) in parsePmcPlans(row)"
                :key="`pmc-${row.id}-${index}`"
                class="pmc-plan-inline-item"
              >
                <span class="pmc-plan-date">日期：<span class="stat-num">{{ formatReplyPlanDate(plan.planDate) }}</span></span>
                <span class="pmc-plan-qty">数量：<span class="stat-num">{{ plan.deliveryQty }}</span></span>
              </div>
            </div>
            <span v-else-if="row.planArriveDate" class="pmc-plan-single">日期：<span class="stat-num">{{ row.planArriveDate }}</span></span>
          </template>
        </el-table-column>
        <el-table-column
          prop="vendorReplyDate"
          label="供应商回复日期"
          min-width="220"
          align="center"
          label-class-name="hdr-demand"
          class-name="top-align-cell"
        >
          <template #default="{ row }">
            <span v-if="!row.vendorReplyDate && parseReplyPlans(row).length === 0" class="no-date">-</span>
            <div
              v-else-if="parseReplyPlans(row).length > 0"
              class="pmc-plan-inline"
            >
              <div
                v-for="(plan, index) in parseReplyPlans(row)"
                :key="`reply-${row.id}-${index}`"
                class="pmc-plan-inline-item"
              >
                <span class="pmc-plan-date">日期：<span class="stat-num">{{ formatReplyPlanDate(plan.replyDate) }}</span></span>
                <span class="pmc-plan-qty">数量：<span class="stat-num">{{ plan.deliveryQty }}</span></span>
              </div>
            </div>
            <span v-else class="pmc-plan-single">日期：<span class="stat-num">{{ row.vendorReplyDate }}</span></span>
          </template>
        </el-table-column>
        <el-table-column
          prop="remainingQty"
          label="待交付数量"
          min-width="110"
          align="center"
          label-class-name="hdr-delivery"
        >
          <template #default="{ row }">
            <span class="pending-qty">{{ row.remainingQty }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="ireceivedqty"
          label="迪太已入库数量"
          min-width="110"
          align="center"
          label-class-name="hdr-delivery"
        >
          <template #default="{ row }">
            <span>{{ row.ireceivedqty ?? row.storageQty ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="overdueDays"
          label="超期天数"
          width="100"
          align="center"
          label-class-name="hdr-reply"
        >
          <template #default="{ row }">
            <span
              class="overdue-days"
              :class="{ 'is-overdue': Number(row.overdueDays || 0) > 0 }"
            >
              {{ row.overdueDays ?? 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="deliveryStatus"
          label="交付状态"
          min-width="100"
          align="center"
          label-class-name="hdr-status"
        >
          <template #default="{ row }">
            <el-tag :type="statusType(row.deliveryStatus)" size="small">
              {{ row.deliveryStatus || "未交付" }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </page-table>
  </div>
</template>

<script setup>
import { Filter, TrendCharts } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  DELIVERY_COMPLETED_FILTER,
  getMyConfirmations,
  getMyMetrics,
} from "@/api/vendor-delivery";

const defaultQuery = {
  poCode: "",
  invCode: "",
  isCompleted: DELIVERY_COMPLETED_FILTER.COMPLETED,
  beginTime: "",
  endTime: "",
  p: 1,
  l: 100,
};

const loading = ref(false);
const total = ref(0);
const tableData = ref([]);
const queryParams = reactive({ ...defaultQuery });
const columnFilterVisible = reactive({
  poCode: false,
  invCode: false,
});
const onTimeDeliveryRate = ref("--");

function formatReplyPlanDate(value) {
  if (!value) return "-";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) return String(value);
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseReplyPlans(row) {
  if (!row?.vendorReplyPlan) return [];
  try {
    const plans = JSON.parse(row.vendorReplyPlan);
    return Array.isArray(plans) ? plans : [];
  } catch {
    return [];
  }
}

function parsePmcPlans(row) {
  if (!row?.pmcPlanJson) return [];
  try {
    const plans = JSON.parse(row.pmcPlanJson);
    return Array.isArray(plans) ? plans : [];
  } catch {
    return [];
  }
}

function statusType(status) {
  if (status === "已完成") return "success";
  if (status === "部分交付") return "warning";
  return "info";
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
      onTimeDeliveryRate.value = formatPercent(data.onTimeDeliveryRate);
    })
    .catch(() => {
      onTimeDeliveryRate.value = "--";
    });
}

function buildQuery() {
  return { ...queryParams };
}

function getList(refreshMetrics = false) {
  if (refreshMetrics === true) {
    getMetrics();
  }
  loading.value = true;
  getMyConfirmations(buildQuery())
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
          : "获取已交订单失败，请稍后重试"
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

function applyColumnFilter(key) {
  columnFilterVisible[key] = false;
  handleQuery();
}

function resetColumnFilter(key) {
  queryParams[key] = "";
  columnFilterVisible[key] = false;
  handleQuery();
}

function resetQuery() {
  Object.assign(queryParams, defaultQuery);
  getList(true);
}

onMounted(() => {
  getList(true);
});
</script>

<style lang="scss" scoped>
.delivery-metric {
  display: flex;
  align-items: center;
  margin-left: 12px;
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

.pending-qty {
  color: #f56c6c;
  font-weight: 700;
}

.no-date {
  color: #e6a23c;
  font-style: italic;
}

:deep(.pmc-plan-inline) {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}
:deep(.pmc-plan-inline-item) {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 180px;
  font-size: 13px;
  line-height: 1.4;
}
:deep(.pmc-plan-date) {
  color: #303133;
  width: 115px;
  text-align: left;
}
:deep(.pmc-plan-qty) {
  color: #303133;
  font-weight: 500;
  flex: 1;
  text-align: left;
}
:deep(.pmc-plan-single) {
  display: inline-block;
  width: 180px;
  text-align: left;
  color: #303133;
  font-size: 13px;
  line-height: 1.4;
}
:deep(.stat-num) {
    color: #ccc;
}

.overdue-days {
  color: #67c23a;
  font-weight: 600;
}

.overdue-days.is-overdue {
  color: #f56c6c;
}

.column-filter-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 8px;
  white-space: nowrap;
  flex-wrap: nowrap;
}

.column-filter-trigger > span {
  color: #ffffff;
  line-height: 1;
  white-space: nowrap;
}

.column-filter-trigger__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  min-height: 26px;
  padding: 4px;
  border-radius: 7px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.96);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.24);
  transition: color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.column-filter-trigger__icon :deep(svg) {
  width: 1em;
  height: 1em;
}

.column-filter-trigger__icon:hover {
  background: rgba(255, 255, 255, 0.28);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.34);
  transform: translateY(-1px);
}

.column-filter-trigger__icon.is-active {
  color: #ffd166;
  background: rgba(255, 209, 102, 0.22);
  box-shadow: inset 0 0 0 1px rgba(255, 209, 102, 0.42);
}

.column-filter-popover {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.column-filter-popover__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

:deep(.nowrap-cell .cell) {
  white-space: nowrap;
  word-break: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.top-align-cell) {
    vertical-align: top !important;
}

/* ====== 表头分区背景色 ====== */
:deep(.hdr-order) {
    background-color: #2980b9 !important;
    color: #fff !important;
}
:deep(.hdr-delivery) {
    background-color: #27ae60 !important;
    color: #fff !important;
}
:deep(.hdr-demand) {
    background-color: #e67e22 !important;
    color: #fff !important;
}
:deep(.hdr-reply) {
    background-color: #8e44ad !important;
    color: #fff !important;
}
:deep(.hdr-status) {
    background-color: #2c3e50 !important;
    color: #fff !important;
}
</style>
