<template>
  <div class="login">
    <div class="login-brand">
      <div class="brand-decor brand-decor--wave"></div>
      <div class="brand-decor brand-decor--glow-1"></div>
      <div class="brand-decor brand-decor--glow-2"></div>
      <div class="brand-decor brand-decor--grid"></div>
      <div class="brand-decor brand-decor--circle-1"></div>
      <div class="brand-decor brand-decor--circle-2"></div>
      <div class="brand-decor brand-decor--dot-grid"></div>
      <div class="brand-content">
        <img :src="logoImage" alt="logo" class="brand-logo" />
        <h1 class="brand-title">供应商管理后台</h1>
        <p class="brand-subtitle">高效 · 安全 · 智能</p>
        <div class="brand-divider"></div>
        <div class="brand-features">
          <div class="brand-feature-item">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <span class="feature-label">供应商协同</span>
              <span class="feature-desc">全流程供应链管理</span>
            </div>
          </div>
          <div class="brand-feature-item">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
              </svg>
            </div>
            <div>
              <span class="feature-label">数据洞察</span>
              <span class="feature-desc">实时数据分析报表</span>
            </div>
          </div>
          <div class="brand-feature-item">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
            <div>
              <span class="feature-label">安全可靠</span>
              <span class="feature-desc">企业级安全保障</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="login-panel">
      <div class="login-form-wrapper">
        <div class="form-header">
          <h3 class="title">欢迎回来</h3>
          <p class="title-sub">登录您的账号以继续</p>
        </div>
        <el-form @submit.prevent class="login-form">
          <el-form-item>
            <el-input v-model="username" placeholder="请输入账号" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="password" type="password" show-password placeholder="请输入密码" />
          </el-form-item>
          <el-form-item style="margin-top: -6px">
            <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
          </el-form-item>
          <el-button type="primary" class="login-btn" @click="goHome">登 录</el-button>
        </el-form>
      </div>
      <div class="login-footer">DigiWise © {{ year }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import logoImage from "@/assets/icons/logo.png"

const username = ref("")
const password = ref("")
const rememberMe = ref(true)
const year = new Date().getFullYear()
const router = useRouter()

function goHome() {
  router.push("/supplier/delivery/my-purchase-orders")
}
</script>

<style scoped>
.login {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}
.login-brand {
  position: relative;
  flex: 0 0 48%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #0c4a6e, #0369a1, #0284c7);
  color: #fff;
  padding: 24px;
  overflow: hidden;
}
.brand-content {
  position: relative;
  z-index: 2;
  max-width: 560px;
  width: 100%;
  text-align: center;
  transform: translateY(-3%);
}
.brand-logo {
  height: 48px;
  margin-bottom: 20px;
}
.brand-title {
  margin: 0 0 24px;
  font-size: clamp(34px, 2.8vw, 48px);
  line-height: 1.18;
  letter-spacing: 1px;
}
.brand-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.72);
  letter-spacing: 3px;
}
.brand-divider {
  width: 52px;
  height: 2px;
  margin: 24px auto;
  border-radius: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.08));
}
.brand-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.brand-feature-item {
  display: flex;
  align-items: center;
  gap: 13px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  text-align: left;
  padding: 10px 16px 10px 12px;
}
.feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.feature-icon svg {
  width: 16px;
  height: 16px;
  color: rgba(255, 255, 255, 0.9);
}
.feature-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
}
.feature-desc {
  display: block;
  font-size: 13px;
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.68);
}
.login-panel {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(180deg, #f8fbff, #f1f5f9);
}
.login-panel::before {
  content: "";
  position: absolute;
  width: 440px;
  height: 440px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%);
  filter: blur(40px);
  z-index: 0;
}
.login-form-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 460px;
  padding: 0 48px;
}
.form-header {
  margin-bottom: 28px;
}
.title {
  margin: 0 0 6px;
  font-size: 22px;
  color: #0f172a;
}
.title-sub {
  margin: 0;
  color: #64748b;
  font-size: 13px;
}
.login-form :deep(.el-input) {
  height: 46px;
}
.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #d6dde7;
}
.login-form :deep(.el-form-item) {
  margin-bottom: 22px;
}
.login-btn {
  width: 100%;
  height: 46px;
  border-radius: 8px;
  font-size: 15px;
  letter-spacing: 3px;
  font-weight: 600;
}
.login-footer {
  position: absolute;
  bottom: 24px;
  left: 0;
  right: 0;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
}
.brand-decor {
  position: absolute;
  pointer-events: none;
}
.brand-decor--wave {
  left: -12%;
  bottom: -130px;
  width: 130%;
  height: 260px;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.2), transparent 72%);
  filter: blur(16px);
}
.brand-decor--glow-1 {
  width: 320px;
  height: 320px;
  top: -80px;
  right: -50px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 65%);
  filter: blur(40px);
}
.brand-decor--glow-2 {
  width: 260px;
  height: 260px;
  bottom: 60px;
  left: -40px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.16) 0%, transparent 65%);
  filter: blur(30px);
}
.brand-decor--grid {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.04;
  background-image: linear-gradient(rgb(255, 255, 255) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255, 255, 255) 1px, transparent 1px);
  background-size: 64px 64px;
}
.brand-decor--circle-1 {
  width: 360px;
  height: 360px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  top: -100px;
  right: -80px;
}
.brand-decor--circle-2 {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.06);
  bottom: 15%;
  right: 10%;
}
.brand-decor--dot-grid {
  width: 140px;
  height: 140px;
  top: 12%;
  right: 8%;
  opacity: 0.15;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.5) 1.2px, transparent 1.2px);
  background-size: 16px 16px;
}
@media (max-width: 900px) {
  .login-brand {
    display: none;
  }
  .login-form-wrapper {
    max-width: 100%;
    padding: 34px 24px 24px;
  }
}
</style>
