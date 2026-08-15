<template>
  <div class="login-container">
    <div class="login-header-actions">
      <ThemeSwitch />
    </div>

    <div class="login-card">
      <div class="login-header">
        <img class="login-logo" src="/logo.jpg" alt="logo" />
        <h1 class="login-title">{{ appTitle }}</h1>
        <p class="login-subtitle">后台管理系统</p>
      </div>

      <el-form ref="formRef" :model="loginForm" :rules="rules" class="login-form" size="large">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item v-if="showCaptcha" prop="captcha">
          <div class="captcha-wrapper">
            <el-input
              v-model="loginForm.captcha"
              placeholder="请输入验证码"
              :prefix-icon="Key"
              @keyup.enter="handleLogin"
            />
            <div
              class="captcha-img"
              @click="refreshCaptcha"
              v-html="captchaSvg || ''"
              v-if="captchaSvg"
            ></div>
            <div class="captcha-img" @click="refreshCaptcha" v-else>
              <img :src="captchaUrl" alt="验证码" v-if="captchaUrl" />
              <span v-else class="captcha-placeholder">验证码</span>
            </div>
          </div>
        </el-form-item>

        <div class="login-options">
          <el-checkbox v-model="rememberPassword">记住密码</el-checkbox>
        </div>

        <el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" @click="handleLogin">
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Login - 登录页面组件
 * @description 企业级登录页面，支持用户名/密码登录、验证码、记住密码、主题切换等功能
 */
import { ElMessage } from 'element-plus'
import { User, Lock, Key } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import config from '@/config'
import ThemeSwitch from '@/components/ThemeSwitch/index.vue'
import {
  saveRememberedAccount,
  loadRememberedAccount,
  clearRememberedAccount,
} from '@/utils/remember'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const rememberPassword = ref(false)
const showCaptcha = ref(false)
const captchaUrl = ref('')
const captchaSvg = ref('')

const appTitle = config.appTitle

const loginForm = reactive({
  username: '',
  password: '',
  captcha: '',
  captchaKey: '',
})

const rules = computed<FormRules>(() => {
  const base: FormRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      // { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
    ],
  }
  if (showCaptcha.value) {
    base.captcha = [{ required: true, message: '请输入验证码', trigger: 'blur' }]
  }
  return base
})

onMounted(() => {
  restoreRememberedAccount()
  refreshCaptcha()
})

function restoreRememberedAccount() {
  const saved = loadRememberedAccount()
  if (saved) {
    loginForm.username = saved.username
    loginForm.password = saved.password
    rememberPassword.value = true
  }
}

async function refreshCaptcha() {
  try {
    const result = await userStore.getCaptcha()

    if (!result) {
      showCaptcha.value = false
      captchaSvg.value = ''
      captchaUrl.value = ''
      loginForm.captcha = ''
      loginForm.captchaKey = ''
      return
    }

    showCaptcha.value = true
    const { image, key } = result
    loginForm.captchaKey = key

    if (image.startsWith('<svg') || image.startsWith('<?xml')) {
      captchaSvg.value = image
      captchaUrl.value = ''
    } else if (image.startsWith('data:')) {
      captchaSvg.value = ''
      captchaUrl.value = image
    } else {
      captchaSvg.value = ''
      captchaUrl.value = `data:image/png;base64,${image}`
    }
  } catch (error) {
    console.warn('获取验证码失败:', error)
    showCaptcha.value = false
    loginForm.captchaKey = ''
    captchaSvg.value = ''
    captchaUrl.value = ''
  }
}

async function handleLogin() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await userStore.login({
        username: loginForm.username,
        password: loginForm.password,
        captcha: loginForm.captcha,
        captchaKey: loginForm.captchaKey,
      })

      if (rememberPassword.value) {
        saveRememberedAccount(loginForm.username, loginForm.password)
      } else {
        clearRememberedAccount()
      }

      ElMessage.success('登录成功，正在跳转...')

      const redirect = router.currentRoute.value.query.redirect as string
      setTimeout(() => {
        router.push(redirect || '/dashboard')
      }, 500)
    } catch {
      refreshCaptcha()
      loginForm.captcha = ''
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="css" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg-color-page, #f0f2f5);
  position: relative;
}

.login-header-actions {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
}

.login-card {
  width: 420px;
  padding: 40px;
  background: var(--bg-color-base, #ffffff);
  border-radius: 12px;
  box-shadow: var(--shadow-dark, 0 8px 32px rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color-lighter, transparent);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

  .login-logo {
    width: 56px;
    height: 56px;
    object-fit: contain;
    margin-bottom: 12px;
  }
}

.login-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-color-primary, #303133);
  margin: 0 0 8px 0;
}

.login-subtitle {
  font-size: 14px;
  color: var(--text-color-secondary, #909399);
  margin: 0;
}

.login-form {
  .el-form-item {
    margin-bottom: 22px;
  }
}

.captcha-wrapper {
  display: flex;
  gap: 10px;
  width: 100%;

  .el-input {
    flex: 1;
  }

  .captcha-img {
    width: 120px;
    height: 40px;
    cursor: pointer;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--border-color-base, #dcdfe6);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-color-page, #f5f7fa);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    :deep(svg) {
      width: 100%;
      height: 100%;
    }

    .captcha-placeholder {
      font-size: 12px;
      color: var(--text-color-placeholder, #c0c4cc);
    }
  }
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  letter-spacing: 4px;
}
</style>
