<template>
  <div class="login-page" :style="{ backgroundImage: `url(${loginBg})` }">
    <div class="login-drag-region" data-tauri-drag-region />
    <div class="panel-wrap">
      <section class="login-panel">
        <div class="brand">
          <img :src="logoMark" alt="logo" class="brand-logo" />
          <div class="brand-subtitle">供应商管理平台</div>
        </div>

        <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form" @keyup.enter="handleLogin">
          <el-form-item prop="username" class="field">
            <label>账号</label>
            <el-input v-model="loginForm.username" placeholder="请输入账号" />
          </el-form-item>

          <el-form-item prop="password" class="field">
            <label>密码</label>
            <el-input v-model="loginForm.password" type="password" show-password placeholder="请输入密码" />
          </el-form-item>

          <el-form-item prop="code" class="field field-captcha">
            <label>短信验证码</label>
            <div class="captcha-row">
              <el-input v-model="loginForm.code" placeholder="请输入短信验证码" />
              <el-button
                class="send-code-btn"
                :loading="smsSending"
                :disabled="smsSending || countdown > 0 || !loginForm.username.trim()"
                @click="handleSendCode"
              >
                {{ countdown > 0 ? `${countdown}s后重发` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>

          <el-form-item class="remember-field">
            <el-checkbox v-model="rememberAccount">记住账号</el-checkbox>
          </el-form-item>

          <el-button type="primary" class="submit-btn" :loading="loading" @click="handleLogin">登录</el-button>
        </el-form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import useUserStore from '@/store/modules/user'
import { sendSmsCode } from '@/api/login'
import { constantRoutes } from '@/router'
import { getDefaultAccessiblePath } from '@/utils/permission'
import logoMark from '@/assets/images/logo/logo.png'
import loginBg from '@/assets/images/login/bg11.png'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const smsSending = ref(false)
const loginRef = ref()
const countdown = ref(0)
const rememberAccount = ref(true)
const LOGIN_CACHE_KEY = 'supplier-admin-login-cache'
let countdownTimer = null

const loginForm = reactive({
  username: '',
  password: '',
  code: '',
})

const loginRules = {
  username: [{ required: true, trigger: 'blur', message: '请输入账号' }],
  password: [{ required: true, trigger: 'blur', message: '请输入密码' }],
  code: [{ required: true, trigger: 'blur', message: '请输入短信验证码' }],
}

function clearCountdown() {
  if (!countdownTimer) return
  clearInterval(countdownTimer)
  countdownTimer = null
}

function startCountdown(seconds = 60) {
  clearCountdown()
  countdown.value = seconds
  countdownTimer = window.setInterval(() => {
    if (countdown.value <= 1) {
      clearCountdown()
      countdown.value = 0
      return
    }
    countdown.value -= 1
  }, 1000)
}

async function handleSendCode() {
  const username = loginForm.username.trim()
  if (!username) {
    ElMessage.warning('请先输入账号')
    return
  }
  if (smsSending.value || countdown.value > 0) return

  smsSending.value = true
  try {
    const res = await sendSmsCode(username)
    if (!res || Number(res.code) !== 200) {
      throw new Error(res?.msg || '发送验证码失败')
    }

    startCountdown()
    const maskedPhone = String(res.phone || res.data?.phone || '').trim()
    ElMessage.success(maskedPhone ? `验证码已发送至 ${maskedPhone}` : '验证码已发送')
  } catch (error) {
    ElMessage.error(error?.message || error?.response?.data?.msg || '发送验证码失败')
  } finally {
    smsSending.value = false
  }
}

function loadLoginCache() {
  try {
    const raw = localStorage.getItem(LOGIN_CACHE_KEY)
    if (!raw) return
    const cached = JSON.parse(raw)
    loginForm.username = String(cached?.username || '')
    loginForm.password = String(cached?.password || '')
    rememberAccount.value = Boolean(cached?.remember)
  } catch (error) {
    localStorage.removeItem(LOGIN_CACHE_KEY)
  }
}

function persistLoginCache() {
  if (rememberAccount.value) {
    localStorage.setItem(LOGIN_CACHE_KEY, JSON.stringify({
      username: loginForm.username,
      password: loginForm.password,
      remember: true,
    }))
  } else {
    localStorage.removeItem(LOGIN_CACHE_KEY)
  }
}

function handleLogin() {
  if (!loginRef.value) return
  loginRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.login(loginForm)
      await userStore.getInfo()
      persistLoginCache()
      const redirect = route.query.redirect || getDefaultAccessiblePath(constantRoutes, userStore) || '/401'
      router.push(redirect)
    } catch (error) {
      ElMessage.error(error?.message || error?.response?.data?.msg || '登录失败，请检查账号密码')
      loginForm.code = ''
    } finally {
      loading.value = false
    }
  })
}

onMounted(() => {
  loadLoginCache()
})

onBeforeUnmount(() => {
  clearCountdown()
})
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}

.login-drag-region {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  z-index: 5;
  -webkit-app-region: drag;
}

.panel-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  z-index: 2;
}

.login-panel {
  --field-height: 32px;
  --field-width: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
  width: 410px;
  height: 457.66px;
  padding: 30px 80px 26px;
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(171, 214, 255, 0.24), rgba(103, 173, 255, 0.14));
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 18px 50px rgba(1, 26, 71, 0.35);
  backdrop-filter: blur(16px);
}

.brand {
  margin: 0 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.brand-logo {
  width: 114px;
  object-fit: contain;
  filter: drop-shadow(0 8px 20px rgba(40, 156, 255, 0.35));
}

.brand-subtitle {
  margin-top: 8px;
  color: #d8ecff;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(1, 26, 71, 0.24);
}

.title {
  margin: 16px 0 14px;
  color: #ffffff;
  font-size: 34px;
  line-height: 1;
  font-weight: 700;
}

.login-form {
  width: var(--field-width);
  margin: 0 auto;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.field label {
  display: inline-block;
  margin-bottom: 6px;
  color: #d8ecff;
  font-size: 12px;
}

.field :deep(.el-input__wrapper) {
  width: var(--field-width);
  height: var(--field-height);
  border-radius: 7px;
  box-shadow: none;
  background: rgba(255, 255, 255, 0.92);
}

.captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  gap: 10px;
}

.send-code-btn {
  width: 96px;
  height: var(--field-height);
  border-radius: 7px;
  padding: 0;
  font-size: 12px;
  color: #ffffff;
  border: none;
  background: linear-gradient(90deg, #0f4f9c 0%, #053f88 100%);
}

.send-code-btn :deep(span) {
  color: #ffffff;
}

.send-code-btn:disabled {
  background: rgba(255, 255, 255, 0.35);
  color: rgba(255, 255, 255, 0.78);
}

.send-code-btn:disabled :deep(span) {
  color: rgba(255, 255, 255, 0.78);
}

.submit-btn {
  width: var(--field-width);
  height: 40px;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  margin-top:15px;
  background: linear-gradient(90deg, #0f4f9c 0%, #053f88 100%);
}

.remember-field {
  margin-top: -4px;
}

.remember-field :deep(.el-checkbox__label) {
  color: #d8ecff;
  font-size: 12px;
}

@media (max-width: 560px) {
  .panel-wrap {
    justify-content: center;
    padding: 0;
  }
  .title {
    font-size: 30px;
  }

  .captcha-row {
    grid-template-columns: minmax(0, 1fr) 96px;
  }
}
</style>
