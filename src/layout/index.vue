<template>
  <div class="layout" :class="{ hideSidebar: !appStore.sidebar.opened, openSidebar: appStore.sidebar.opened }">
    <aside class="sidebar-container">
      <Sidebar />
    </aside>
    <div class="main-container">
      <Navbar />
      <div class="app-main">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from '@/layout/components/Sidebar/index.vue'
import Navbar from '@/layout/components/Navbar.vue'
import useAppStore from '@/store/modules/app'

const appStore = useAppStore()
</script>

<style lang="scss" scoped>
.layout {
  width: 100%;
  height: 100%;
}

.main-container {
  height: 100%;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.hideSidebar .main-container {
  margin-left: 54px;
}

.app-main {
  flex: 1;
  overflow: auto;
  background: #f5f7fa;
  padding: 20px;
  min-height: 0;
}
</style>
