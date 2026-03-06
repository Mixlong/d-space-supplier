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
      <el-form-item label="是否超期">
        <el-select
          v-model="queryParams.isOverdue"
          clearable
          style="width: 140px"
        >
          <el-option label="是" :value="true" />
          <el-option label="否" :value="false" />
        </el-select>
      </el-form-item>
      <el-form-item label="是否完成">
        <el-select
          v-model="queryParams.isCompleted"
          clearable
          style="width: 140px"
        >
          <el-option label="是" :value="true" />
          <el-option label="否" :value="false" />
        </el-select>
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
        <el-table-column prop="poCode" label="采购订单号" min-width="150" />
        <el-table-column prop="invCode" label="存货编码" min-width="120" />
        <el-table-column prop="orderedQty" label="采购数量" min-width="90" />
        <el-table-column
          prop="totalDeliveredQty"
          label="累计交付数量"
          min-width="110"
        />
        <el-table-column
          prop="completionRate"
          label="完成率(%)"
          min-width="90"
        />
        <el-table-column
          prop="planArriveDate"
          label="计划到货日期"
          min-width="130"
        />
        <el-table-column
          prop="lastDeliveryDate"
          label="最后交付日期"
          min-width="130"
        />
        <el-table-column prop="planVsActualDays" label="偏差天数" width="90" />
        <el-table-column label="超期" width="70">
          <template #default="scope">{{
            scope.row.isOverdue ? "是" : "否"
          }}</template>
        </el-table-column>
        <el-table-column label="完成" width="70">
          <template #default="scope">{{
            scope.row.isCompleted ? "是" : "否"
          }}</template>
        </el-table-column>
      </el-table>
    </page-table>
  </div>
</template>

<script setup>
import { getMyTimeliness } from "@/api/vendor-delivery";
import { ElMessage } from "element-plus";

const defaultQuery = {
  poCode: "",
  isOverdue: undefined,
  isCompleted: undefined,
  beginTime: "",
  endTime: "",
  p: 1,
  l: 100,
};

const loading = ref(false);
const total = ref(0);
const tableData = ref([]);
const dateRange = ref([]);
const queryParams = reactive({ ...defaultQuery });

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
  getMyTimeliness(buildQuery())
    .then((res) => {
      const data = res.data || {};
      tableData.value = data.list || [];
      total.value = Number(data.total || 0);
    })
    .catch((error) => {
      tableData.value = [];
      total.value = 0;
      if (error?.message === "Network Error") {
        ElMessage.error("网络连接失败，请检查后端服务是否可用");
      } else {
        ElMessage.error("获取数据失败，请稍后重试");
      }
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
});
</script>
