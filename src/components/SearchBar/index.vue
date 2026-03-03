<template>
  <div class="search-bar">
    <el-form :model="model" inline class="search-bar__form">
      <slot />
      <el-form-item class="search-bar__actions">
        <el-button type="primary" :icon="Search" @click="$emit('search')">查询</el-button>
        <el-button :icon="Refresh" @click="$emit('reset')">重置</el-button>
        <slot name="extra-actions" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { Search, Refresh } from '@element-plus/icons-vue'

defineProps({
  model: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['search', 'reset'])
</script>

<style lang="scss" scoped>
.search-bar {
  background: #fff;
  padding: 18px 20px;
  border-radius: 4px;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;

  &__form {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;

    :deep(.el-form-item) {
      margin-right: 16px;
      margin-bottom: 0;
    }


    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #606266;
    }

    :deep(.el-input),
    :deep(.el-select),
    :deep(.el-date-editor) {
      width: 220px;
    }
  }

  &__actions {
    margin-left: 0;

    .el-button {
      font-weight: 500;
    }
  }
}
</style>
