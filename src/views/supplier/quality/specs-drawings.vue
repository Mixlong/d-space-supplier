<template>
  <div class="app-container delivery-page">
    <search-bar :model="queryParams" @search="handleQuery" @reset="resetQuery">
      <el-form-item label="物料编码">
        <el-input
          v-model="queryParams.invCode"
          placeholder="请输入物料编码"
          clearable
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item label="物料名称">
        <el-input
          v-model="queryParams.invName"
          placeholder="请输入物料名称"
          clearable
          style="width: 180px"
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
        <el-table-column prop="invCode" label="物料编码" min-width="150" />
        <el-table-column prop="invName" label="物料描述" min-width="200" />
        <el-table-column
          prop="specFile"
          label="规格书"
          min-width="140"
          align="center"
        >
          <template #default="{ row }">
            <el-button
              v-if="row.specFileUrl"
              type="primary"
              link
              @click="handlePreview(row.specFileUrl)"
            >
              查看
            </el-button>
            <span v-else style="color: #c0c4cc">暂无</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="drawingFile"
          label="图纸"
          min-width="140"
          align="center"
        >
          <template #default="{ row }">
            <el-button
              v-if="row.drawingFileUrl"
              type="primary"
              link
              @click="handlePreview(row.drawingFileUrl)"
            >
              查看
            </el-button>
            <span v-else style="color: #c0c4cc">暂无</span>
          </template>
        </el-table-column>
      </el-table>
    </page-table>
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";

const defaultQuery = {
  invCode: "",
  invName: "",
  p: 1,
  l: 100,
};

const loading = ref(false);
const total = ref(0);
const tableData = ref([]);
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
  getList();
}

function handlePreview(url) {
  if (url) {
    window.open(url, "_blank");
  }
}

onMounted(() => {
  getList();
});
</script>
