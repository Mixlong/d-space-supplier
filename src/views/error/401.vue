<template>
  <div class="errPage-container">
    <el-empty description="暂无访问权限，请联系管理员开通" :image-size="200" />
  </div>
</template>

<style scoped>
.errPage-container {
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  margin: 20px;
  border-radius: 8px;
}
</style>
