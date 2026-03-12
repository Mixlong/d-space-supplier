<template>
  <div class="app-container forecast-page">
    <search-bar :model="queryParams" @search="handleQuery" @reset="resetQuery">
      <el-form-item label="预测年份">
        <el-date-picker
          v-model="queryParams.forecastYear"
          type="year"
          value-format="YYYY"
          placeholder="请选择预测年份"
          style="width: 160px"
          clearable
        />
      </el-form-item>
      <el-form-item label="存货编码">
        <el-input
          v-model="queryParams.inventoryCode"
          placeholder="请输入存货编码"
          clearable
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item label="存货名称">
        <el-input
          v-model="queryParams.inventoryName"
          placeholder="请输入存货名称"
          clearable
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item label="用于机型">
        <el-input
          v-model="queryParams.machineModel"
          placeholder="请输入用于机型"
          clearable
          style="width: 180px"
        />
      </el-form-item>
    </search-bar>

    <page-table
      class="forecast-page-table"
      style="flex: 1; min-height: 0"
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
        :header-cell-style="getHeaderCellStyle"
      >
        <template v-for="column in forecastHeaderConfig" :key="column.key">
          <el-table-column
            v-if="column.children"
            :label="column.label"
            :fixed="column.fixed"
            :label-class-name="column.labelClassName"
            align="center"
            header-align="center"
          >
            <el-table-column
              v-for="child in column.children"
              :key="child.key"
              :prop="child.prop"
              :label="child.label"
              :min-width="child.minWidth"
              :align="child.align || 'center'"
              :show-overflow-tooltip="child.showOverflowTooltip"
              :label-class-name="child.labelClassName"
            >
              <template #default="{ row }">
                <span v-if="child.type === 'total'" class="forecast-total">
                  {{ formatQty(row[child.prop]) }}
                </span>
                <span
                  v-else-if="child.type === 'month'"
                  :class="monthCellClass(row[child.prop])"
                >
                  {{ formatQty(row[child.prop]) }}
                </span>
                <span v-else>{{ formatText(row[child.prop]) }}</span>
              </template>
            </el-table-column>
          </el-table-column>
          <el-table-column
            v-else
            :prop="column.prop"
            :label="column.label"
            :min-width="column.minWidth"
            :fixed="column.fixed"
            :show-overflow-tooltip="column.showOverflowTooltip"
            :label-class-name="column.labelClassName"
            align="center"
            header-align="center"
          >
            <template #default="{ row }">
              <span>{{ formatText(row[column.prop]) }}</span>
            </template>
          </el-table-column>
        </template>
      </el-table>
    </page-table>
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import forecastHeaderConfig from "@/assets/mock/vendor_forecast_header.json";
import { getMyForecastList } from "@/api/vendor-delivery";

const currentYear = String(new Date().getFullYear());

const defaultQuery = {
  forecastYear: currentYear,
  inventoryCode: "",
  inventoryName: "",
  machineModel: "",
  p: 1,
  l: 10,
};

const loading = ref(false);
const total = ref(0);
const tableData = ref([]);
const queryParams = reactive({ ...defaultQuery });

function buildQuery() {
  const params = { ...queryParams };
  if (params.forecastYear) {
    params.forecastYear = Number(params.forecastYear);
  } else {
    delete params.forecastYear;
  }

  ["inventoryCode", "inventoryName", "machineModel"].forEach((key) => {
    const value = String(params[key] || "").trim();
    if (value) {
      params[key] = value;
    } else {
      delete params[key];
    }
  });

  return params;
}

function formatQty(value) {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : value;
}

function formatText(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

function monthCellClass(value) {
  return Number(value || 0) > 0 ? "forecast-month is-active" : "forecast-month";
}

function getHeaderCellStyle({ column }) {
  const label = column?.label;

  if (label === "供应商") {
    return {
      background: "#2f80c1",
      color: "#ffffff",
      fontWeight: 700,
    };
  }

  if (label === "物料信息") {
    return {
      background: "#27ae60",
      color: "#ffffff",
      fontWeight: 700,
    };
  }

  if (
    [
      "存货编码",
      "存货名称",
      "物料描述",
      "规格尺寸",
      "用于机型",
      "原材料品牌",
      "备注说明",
    ].includes(label)
  ) {
    return {
      background: "#27ae60",
      color: "#ffffff",
      fontWeight: 600,
    };
  }

  if (label === "预测计划需求") {
    return {
      background: "#d67f1f",
      color: "#ffffff",
      fontWeight: 700,
    };
  }

  if (label === "预测总需求") {
    return {
      background: "#d67f1f",
      color: "#ffffff",
      fontWeight: 700,
    };
  }

  if (/^\d+月$/.test(String(label || ""))) {
    return {
      background: "#d67f1f",
      color: "#ffffff",
      fontWeight: 600,
    };
  }

  return {
    background: "#f8f9fb",
    color: "#303133",
  };
}

function getList() {
  loading.value = true;
  getMyForecastList(buildQuery())
    .then((res) => {
      const data = res?.data || {};
      tableData.value = data.records || data.list || [];
      total.value = Number(data.total || 0);
    })
    .catch((error) => {
      tableData.value = [];
      total.value = 0;
      ElMessage.error(
        error?.message === "Network Error"
          ? "网络连接失败，请检查后端服务是否可用"
          : "获取预测订单失败，请稍后重试"
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
  getList();
}

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
.forecast-page {
  height: calc(100vh - 90px);
  max-height: calc(100vh - 90px);
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.forecast-page-table {
  flex: 1;
  min-height: 0;
  display: flex;
}

.forecast-page-table:deep(.page-table) {
  flex: 1;
  min-height: 0;
}

.forecast-total {
  color: #e67e22;
  font-weight: 700;
}

.forecast-month {
  color: #909399;
  font-weight: 500;
}

.forecast-month.is-active {
  color: #409eff;
  font-weight: 600;
}
</style>
