<template>
  <div class="app-container delivery-page">
    <search-bar :model="queryParams" @search="handleQuery" @reset="resetQuery">
      <el-form-item label="采购订单号">
        <el-input
          v-model="queryParams.poCode"
          placeholder="请输入采购订单号"
          clearable
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
          <el-tooltip content="批次合格率" placement="top">
            <div class="quality-stats__item">
              <el-icon :size="16" color="#67c23a"><CircleCheck /></el-icon>
              <span>{{ qualitySummary.batchPassRate }}</span>
            </div>
          </el-tooltip>
          <el-tooltip content="特采率" placement="top">
            <div class="quality-stats__item">
              <el-icon :size="16" color="#e6a23c"><Star /></el-icon>
              <span>{{ qualitySummary.specialRate }}</span>
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
import { getMyConfirmations } from "@/api/vendor-delivery";
import { CircleCheck, Star } from '@element-plus/icons-vue';

const defaultQuery = { poCode: "", beginTime: "", endTime: "", p: 1, l: 10 };

const loading = ref(false);
const total = ref(0);
const tableData = ref([]);
const dateRange = ref([]);
const queryParams = reactive({ ...defaultQuery });
const qualitySummary = reactive({
  batchPassRate: "--",
  specialRate: "--",
});


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
  // 模拟数据
  const mockData = [
    {
      id: 1,
      poCode: 'PO20260201001',
      poRowNo: 1,
      invCode: 'INV-001',
      deliveryQty: 400,
      actualDeliveryDate: '2026-03-10',
      overdueDays: 0,
      remark: '首批交付，已完成IQC检验',
      createTime: '2026-03-10 14:30:00',
      iqcResult: '合格',
      iqcPassed: true,
      specialAdopt: false
    },
    {
      id: 2,
      poCode: 'PO20260201001',
      poRowNo: 2,
      invCode: 'INV-002',
      deliveryQty: 500,
      actualDeliveryDate: '2026-03-08',
      overdueDays: -2,
      remark: '提前交付',
      createTime: '2026-03-08 09:15:00',
      iqcResult: '合格',
      iqcPassed: true,
      specialAdopt: false
    },
    {
      id: 3,
      poCode: 'PO20260201002',
      poRowNo: 1,
      invCode: 'INV-003',
      deliveryQty: 1000,
      actualDeliveryDate: '2026-03-15',
      overdueDays: 5,
      remark: '超期交付，已申请特采',
      createTime: '2026-03-15 16:20:00',
      iqcResult: '不合格',
      iqcPassed: false,
      specialAdopt: true
    },
    {
      id: 4,
      poCode: 'PO20260201003',
      poRowNo: 1,
      invCode: 'INV-004',
      deliveryQty: 300,
      actualDeliveryDate: '2026-03-12',
      overdueDays: 0,
      remark: '正常交付',
      createTime: '2026-03-12 11:00:00',
      iqcResult: '合格',
      iqcPassed: true,
      specialAdopt: false
    },
    {
      id: 5,
      poCode: 'PO20260201003',
      poRowNo: 2,
      invCode: 'INV-005',
      deliveryQty: 800,
      actualDeliveryDate: '2026-03-18',
      overdueDays: 3,
      remark: '部分超期',
      createTime: '2026-03-18 13:45:00',
      iqcResult: '合格',
      iqcPassed: true,
      specialAdopt: false
    },
    {
      id: 6,
      poCode: 'PO20260201004',
      poRowNo: 1,
      invCode: 'INV-006',
      deliveryQty: 200,
      actualDeliveryDate: '2026-03-05',
      overdueDays: -5,
      remark: '紧急订单，提前交付',
      createTime: '2026-03-05 10:30:00',
      iqcResult: '合格',
      iqcPassed: true,
      specialAdopt: false
    },
    {
      id: 7,
      poCode: 'PO20260201005',
      poRowNo: 1,
      invCode: 'INV-007',
      deliveryQty: 600,
      actualDeliveryDate: '2026-03-20',
      overdueDays: 7,
      remark: '严重超期，特采处理中',
      createTime: '2026-03-20 15:00:00',
      iqcResult: '不合格',
      iqcPassed: false,
      specialAdopt: true
    }
  ];
  
  // 计算质量汇总
  const list = mockData;
  const passedCount = list.filter(
    (item) => item.iqcResult === '合格' || item.iqcPassed === true
  ).length;
  const specialCount = list.filter(
    (item) => item.specialAdopt === true || item.specialAdopt === '是'
  ).length;
  qualitySummary.batchPassRate = `${((passedCount / list.length) * 100).toFixed(1)}%`;
  qualitySummary.specialRate = `${((specialCount / list.length) * 100).toFixed(1)}%`;
  
  tableData.value = mockData;
  total.value = mockData.length;
  loading.value = false;
  
  // 实际API调用 (注释掉)
  // loading.value = true;
  // getMyConfirmations(buildQuery())
  //   .then((res) => {
  //     const data = res.data || {};
  //     tableData.value = data.list || [];
  //     total.value = Number(data.total || 0);
  //     // ... 原有计算逻辑
  //   })
  //   .finally(() => {
  //     loading.value = false;
  //   });
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
