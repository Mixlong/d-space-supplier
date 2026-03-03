<template>
  <div class="hamburger" @click="$emit('toggleClick')">
    <el-icon :size="20"><Menu /></el-icon>
  </div>
</template>

<script setup>
defineProps({ isActive: Boolean })
defineEmits(['toggleClick'])
</script>

<style scoped>
.hamburger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
}
</style>
