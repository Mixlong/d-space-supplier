<template>
  <div :class="{ 'is-collapse': collapse }" class="sidebar-wrapper has-logo">
    <!-- Logo区域 -->
    <div class="logo-section">
      <router-link class="logo-container" to="/">
        <template v-if="!collapse">
          <img :src="logoImage" alt="logo" class="logo-image" />
          <div class="system-name">供应商管理后台</div>
        </template>
        <div v-else class="logo-text">D</div>
      </router-link>
    </div>

    <!-- 菜单区域 -->
    <div class="menu-section">
      <el-scrollbar wrap-class="scrollbar-wrapper">
        <el-menu
          :default-active="activeMenu"
          :collapse="collapse"
          :background-color="variables.menuBackground"
          :text-color="variables.menuColor"
          :active-text-color="variables.menuColorActive"
          :unique-opened="true"
          :collapse-transition="false"
          mode="vertical"
        >
          <sidebar-item
            v-for="(route, index) in sidebarRoutes"
            :key="route.path + index"
            :item="route"
            :base-path="route.path"
          />
        </el-menu>
      </el-scrollbar>
    </div>

    <div class="version-section" :title="appVersion">
      <span class="version-text">{{ appVersion }}</span>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import SidebarItem from './SidebarItem.vue'
import variables from '@/assets/styles/variables.module.scss'
import useAppStore from '@/store/modules/app'
import { constantRoutes } from '@/router'
import logoImage from '@/assets/images/logo/logo.png'

const route = useRoute()
const appVersion = ref(`v${import.meta.env.VITE_APP_VERSION || '1.0.0'}`)

const sidebarRoutes = computed(() => {
  return constantRoutes.filter(r => !r.hidden)
})

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

const collapse = computed(() => !useAppStore().sidebar.opened)

onMounted(async () => {
  try {
    if (typeof window === 'undefined' || !window.__TAURI_INTERNALS__) return
    const { getVersion } = await import('@tauri-apps/api/app')
    const version = await getVersion()
    if (version) {
      appVersion.value = `v${version}`
    }
  } catch {
    // ignore and keep fallback version
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.module.scss' as vars;

$menu-background: #1b294e;

.sidebar-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $menu-background;
  transition: width 0.28s;
  overflow: hidden;
  
  // 折叠状态
  &.is-collapse {
    width: 54px;
    
    .logo-section {
      padding: 0;
      
      .logo-container {
        padding-left: 0;
        
        .logo-text {
          font-size: 24px;
        }
      }
    }

    .version-section {
      padding: 10px 4px;

      .version-text {
        display: block;
        transform: scale(0.85);
        transform-origin: center;
      }
    }
  }
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 130px;
  padding: 0 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .logo-container {
    display: flex;
    justify-content: center;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding-left: 8px;
    text-decoration: none;

    .logo-image {
      max-width: 104px;
      max-height: 40px;
      width: auto;
      height: auto;
      object-fit: contain;
      margin-bottom: 4px;
    }

    .system-name {
      font-size: 25px;
      font-weight: 700;
      color: rgb(64, 158, 255);
      line-height: 1.2;
      white-space: nowrap;
    }

    .logo-text {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      text-align: center;
      line-height: 84px;
      user-select: none;
    }
  }
}

.menu-section {
  flex: 1;
  overflow: hidden;
  margin-top: 40px;
  background: $menu-background;

  :deep(.el-scrollbar) {
    height: 100%;
    border-radius: 6px;
  }

  :deep(.el-menu) {
    border: none;
    width: 100% !important;
  }
}

.version-section {
  height: 48px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
  line-height: 1;
  user-select: text;
}

.version-text {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
