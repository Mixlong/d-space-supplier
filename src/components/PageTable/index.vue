<template>
  <div class="page-table">
    <div class="page-table__header" v-if="title">
      <div class="page-table__title">{{ title }}</div>
      <div class="page-table__toolbar" v-if="$slots.toolbar">
        <slot name="toolbar" />
      </div>
    </div>
    <div class="page-table__toolbar-float" v-else-if="$slots.toolbar">
      <slot name="toolbar" />
    </div>
    <div class="page-table__body">
      <slot />
    </div>
    <div class="page-table__footer" v-if="total > 0">
      <el-pagination
        v-model:current-page="innerPage"
        v-model:page-size="innerSize"
        :total="total"
        :page-sizes="pageSizes"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  total: {
    type: Number,
    default: 0
  },
  page: {
    type: Number,
    default: 1
  },
  size: {
    type: Number,
    default: 10
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  }
})

const emit = defineEmits(['update:page', 'update:size', 'pagination'])

const innerPage = computed({
  get: () => props.page,
  set: (val) => emit('update:page', val)
})

const innerSize = computed({
  get: () => props.size,
  set: (val) => emit('update:size', val)
})

function handleSizeChange() {
  emit('update:page', 1)
  nextTick(() => emit('pagination'))
}

function handlePageChange() {
  emit('pagination')
}
</script>

<style lang="scss" scoped>
.page-table {
  background: transparent;
  border: none;
  overflow: visible;
  display: flex;
  flex-direction: column;
  min-height: 0;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f2f5;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }

  &__body {
    flex: 1;
    min-height: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    :deep(.el-table) {
      flex: 1;
      height: 100%;
      min-height: 0;
      --el-table-border-color: #ebeef5;
      --el-table-header-bg-color: #f8f9fb;
      --el-table-header-text-color: #303133;
      --el-table-row-hover-bg-color: #f5f7fa;

      border-radius: 4px;
      overflow: hidden;

      th.el-table__cell {
        font-weight: 600;
        font-size: 13px;
      }

      td.el-table__cell {
        font-size: 13px;
      }

      th.el-table__cell,
      td.el-table__cell,
      th.el-table__cell .cell,
      td.el-table__cell .cell {
        text-align: center;
      }

      .el-table__inner-wrapper,
      .el-scrollbar,
      .el-scrollbar__wrap,
      .el-table__body-wrapper {
        min-height: 0;
      }

      .el-table__body-wrapper,
      .el-scrollbar__wrap {
        overflow-y: auto;
      }
    }
  }

  &__toolbar-float {
    display: flex;
    justify-content: flex-end;
    padding: 0 0 8px;
    flex-shrink: 0;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 0 0;
    flex-shrink: 0;
  }
}
</style>
