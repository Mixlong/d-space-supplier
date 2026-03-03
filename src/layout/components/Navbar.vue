<template>
  <div class="navbar" data-tauri-drag-region>
    <hamburger
      id="hamburger-container"
      :is-active="appStore.sidebar.opened"
      class="hamburger-container no-drag"
      @toggleClick="toggleSideBar"
    />

    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" />

    <div class="right-menu no-drag">
      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <el-icon><UserFilled /></el-icon>
          <span class="user-name">{{ displayName }}</span>
          <el-icon class="caret"><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="logout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Breadcrumb from './Breadcrumb.vue'
import Hamburger from './Hamburger.vue'
import useAppStore from '@/store/modules/app'
import useUserStore from '@/store/modules/user'

const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()

const displayName = computed(() => userStore.nickName || userStore.name || '用户')

function toggleSideBar() {
  appStore.toggleSideBar()
}

function logout() {
  ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await userStore.logOut()
    router.push('/login')
    ElMessage.success('已退出登录')
  }).catch((error) => {
    // 用户点击取消时不提示；其他异常给出反馈
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('退出失败，请稍后重试')
    }
  })
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  user-select: none;

  .hamburger-container {
    display: flex;
    align-items: center;
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .right-menu {
    margin-left: auto;
    display: flex;
    align-items: center;
    height: 100%;
    line-height: 50px;
    padding-right: 15px;

    .right-menu-item {
      display: flex;
      align-items: center;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;

      &.hover-effect {
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
        }
      }
    }

    .avatar-container {
      display: flex;
      align-items: center;

      .avatar-wrapper {
        display: flex;
        align-items: center;
        gap: 6px;
        height: 100%;
        cursor: pointer;

        .user-name {
          font-size: 14px;
          color: #333;
        }

        .caret {
          font-size: 12px;
        }
      }
    }
  }
}

.no-drag {
  -webkit-app-region: no-drag;
}
</style>
