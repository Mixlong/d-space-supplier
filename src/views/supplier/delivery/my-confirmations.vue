<template>
  <div class="app-container delivery-page">
    <search-bar :model="queryParams" @search="handleQuery" @reset="resetQuery">
      <el-form-item label="采购订单号">
        <el-input
          v-model="queryParams.poCode"
          placeholder="请输入采购订单号"
          clearable
          style="width: 200px"
        />
      </el-form-item>
      <el-form-item label="时间范围">
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
        <div class="quality-stats">
          <el-tooltip content="订单准交率(%)" placement="top">
            <div class="quality-stats__item">
              <el-icon :size="16" color="#409eff"><Timer /></el-icon>
              <span>{{ qualitySummary.onTimeDeliveryRate }}</span>
            </div>
          </el-tooltip>
          <el-tooltip content="批次合格率" placement="top">
            <div class="quality-stats__item">
              <el-icon :size="16" color="#67c23a"><CircleCheck /></el-icon>
              <span>{{ qualitySummary.batchQualificationRate }}</span>
            </div>
          </el-tooltip>
          <el-tooltip content="总特采批次数" placement="top">
            <div class="quality-stats__item">
              <el-icon :size="16" color="#e6a23c"><Star /></el-icon>
              <span>{{ qualitySummary.totalSpecialProcurementBatchCount }}</span>
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
        <el-table-column prop="poCode" label="采购订单号" min-width="160" />
        <el-table-column
          prop="poRowNo"
          label="订单行号"
          width="90"
          align="center"
        />
        <el-table-column prop="invCode" label="存货编码" min-width="130" />
        <el-table-column
          prop="deliveryQty"
          label="本次交付数量"
          min-width="120"
          align="center"
        />
        <el-table-column
          prop="actualDeliveryDate"
          label="实际交付日期"
          min-width="130"
          align="center"
        />
        <el-table-column
          prop="defectiveRate"
          label="不良率"
          min-width="90"
          align="center"
        />
        <el-table-column
          prop="isSpecialProcurement"
          label="是否特采"
          min-width="90"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.isSpecialProcurement == 1 ? 'danger' : 'info'"
              size="small"
              >{{ row.isSpecialProcurement == 1 ? "是" : "否" }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column
          prop="overdueDays"
          label="超期天数"
          width="90"
          align="center"
        >
          <template #default="{ row }">
            <span
              :style="{ color: row.overdueDays > 0 ? '#f56c6c' : '#67c23a' }"
              >{{ row.overdueDays }}</span
            >
          </template>
        </el-table-column>
        <el-table-column
          prop="remark"
          label="备注"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          prop="createTime"
          label="创建时间"
          min-width="170"
          align="center"
        />
      </el-table>
    </page-table>

  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { getMyConfirmations, getMyMetrics } from "@/api/vendor-delivery";
import { CircleCheck, Star, Timer } from '@element-plus/icons-vue';

const defaultQuery = { poCode: "", beginTime: "", endTime: "", p: 1, l: 10 };

const loading = ref(false);
const total = ref(0);
const tableData = ref([]);
const dateRange = ref([]);
const queryParams = reactive({ ...defaultQuery });
const qualitySummary = reactive({
  onTimeDeliveryRate: "--",
  batchQualificationRate: "--",
  totalSpecialProcurementBatchCount: "--",
});

function resetMetrics() {
  qualitySummary.onTimeDeliveryRate = "--";
  qualitySummary.batchQualificationRate = "--";
  qualitySummary.totalSpecialProcurementBatchCount = "--";
}

function formatPercent(val) {
  if (val === null || val === undefined || val === "") return "--";
  const num = Number(val);
  if (Number.isNaN(num)) return "--";
  return `${num}%`;
}

function getMetrics() {
  getMyMetrics()
    .then((res) => {
      const data = res?.data || {};
      qualitySummary.onTimeDeliveryRate = formatPercent(data.onTimeDeliveryRate);
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
    params.beginTime = dateRange.value[0];
    params.endTime = dateRange.value[1];
  } else {
    params.beginTime = "";
    params.endTime = "";
  }
  return params;
}

function getList() {
  loading.value = true;
  getMyConfirmations(buildQuery())
    .then((res) => {
      const data = res.data || {};
      const list = data.list || [];
      tableData.value = list;
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
  getList();
}

function resetQuery() {
  Object.assign(queryParams, defaultQuery);
  dateRange.value = [];
  getList();
}


onMounted(() => {
  getList();
  getMetrics();
});
</script>

<style lang="scss" scoped>
.quality-stats {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  padding-left: 24px;
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
