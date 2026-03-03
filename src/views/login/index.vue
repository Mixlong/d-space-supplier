<template>
  <div class="login-page" :style="{ backgroundImage: `url(${loginBg})` }">
    <div class="panel-wrap">
      <section class="login-panel">
        <div class="brand">
          <img :src="logoMark" alt="logo" class="brand-logo" />
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
            <label>验证码</label>
            <div class="captcha-row">
              <el-input v-model="loginForm.code" placeholder="请输入验证码" />
              <img :src="captchaUrl" alt="captcha" class="captcha-img" @click="refreshCaptcha" @error="handleCaptchaError" />
            </div>
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
import { getCaptcha } from '@/api/login'
import logoMark from '@/assets/images/logo/logo.png'
import loginBg from '@/assets/images/login/bg11.png'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const loginRef = ref()
const captchaUrl = ref('')
const captchaLoading = ref(false)
const captchaErrorRetryCount = ref(0)

const loginForm = reactive({
  username: '',
  password: '',
  code: '',
  uuid: '',
})

const loginRules = {
  username: [{ required: true, trigger: 'blur', message: '请输入账号' }],
  password: [{ required: true, trigger: 'blur', message: '请输入密码' }],
  code: [{ required: true, trigger: 'blur', message: '请输入验证码' }],
}

async function refreshCaptcha() {
  if (captchaLoading.value) return
  captchaLoading.value = true
  try {
    const res = await getCaptcha()
    const payload = (res && typeof res.data === 'object') ? res.data : res
    const rawImg = String(payload?.img || payload?.image || '')
      .replace(/\s+/g, '')
    const rawUuid = String(payload?.uuid || '')

    const isBase64Like = /^[A-Za-z0-9+/=]+$/.test(rawImg) && rawImg.length > 64

    if (rawImg.startsWith('data:image/')) {
      captchaUrl.value = rawImg
    } else if (isBase64Like) {
      let mime = 'image/png'
      if (rawImg.startsWith('/9j/')) mime = 'image/jpeg'
      else if (rawImg.startsWith('R0lGOD')) mime = 'image/gif'
      else if (rawImg.startsWith('UklGR')) mime = 'image/webp'
      captchaUrl.value = `data:${mime};base64,${rawImg}`
    } else if (/^(https?:)?\/\//i.test(rawImg) || rawImg.startsWith('/')) {
      captchaUrl.value = rawImg
    } else {
      captchaUrl.value = ''
    }

    loginForm.uuid = rawUuid
    captchaErrorRetryCount.value = 0
  } catch (error) {
    captchaUrl.value = ''
    loginForm.uuid = ''
  } finally {
    captchaLoading.value = false
  }
}

function handleLogin() {
  if (!loginRef.value) return
  loginRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      await userStore.login(loginForm)
      const redirect = route.query.redirect || '/supplier/delivery/my-purchase-orders'
      router.push(redirect)
    } catch (error) {
      ElMessage.error(error?.message || error?.response?.data?.msg || '登录失败，请检查账号密码')
      refreshCaptcha()
      loginForm.code = ''
    } finally {
      loading.value = false
    }
  })
}

onMounted(() => {
  refreshCaptcha()
})

function handleCaptchaError() {
  if (captchaLoading.value) return
  if (captchaErrorRetryCount.value >= 1) return
  captchaErrorRetryCount.value += 1
  refreshCaptcha()
}
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
  width: 410px;
  max-width: calc(100vw - 36px);
  padding: 30px 80px 26px;
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(171, 214, 255, 0.24), rgba(103, 173, 255, 0.14));
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 18px 50px rgba(1, 26, 71, 0.35);
  backdrop-filter: blur(16px);
}

.brand {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
     margin-bottom: 20px;
}

.brand-logo {
  width: 114px;
  object-fit: contain;
  filter: drop-shadow(0 8px 20px rgba(40, 156, 255, 0.35));
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
  grid-template-columns: 160px 80px;
  gap: 10px;
}

.captcha-img {
  width: 80px;
  height: var(--field-height);
  border-radius: 7px;
  object-fit: cover;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.92);
}

.submit-btn {
  width: var(--field-width);
  height: 40px;
  border: none;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  margin-top:20px;
  background: linear-gradient(90deg, #0f4f9c 0%, #053f88 100%);
}

@media (max-width: 768px) {
  .panel-wrap {
    justify-content: center;
    padding: 0;
  }

  .login-panel {
    width: calc(100vw - 30px);
    padding: 24px 20px 20px;
    --field-width: min(250px, calc(100vw - 70px));
  }

  .brand-logo {
    width: 64px;
    height: 64px;
  
  }

  .title {
    font-size: 30px;
  }

  .captcha-row {
    grid-template-columns: minmax(0, 1fr) 80px;
  }
}
</style>
