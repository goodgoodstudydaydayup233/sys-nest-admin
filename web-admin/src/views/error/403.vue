<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-animation">
        <div class="lock-wrapper">
          <svg viewBox="0 0 200 200" class="lock-icon">
            <!-- 锁体 -->
            <rect x="50" y="90" width="100" height="80" rx="8" fill="#E6A23C" />
            <!-- 锁环 -->
            <path d="M70 90 V60 A30 30 0 0 1 130 60 V90"
                  fill="none" stroke="#E6A23C" stroke-width="14" stroke-linecap="round" />
            <!-- 钥匙孔 -->
            <circle cx="100" cy="125" r="12" fill="#FFF" />
            <line x1="100" y1="137" x2="100" y2="155" stroke="#FFF" stroke-width="6" stroke-linecap="round" />
          </svg>
          <div class="warning-circle">!</div>
        </div>
      </div>

      <h1 class="error-title">无权访问</h1>
      <p class="error-code-text">错误代码：403 Forbidden</p>
      <p class="error-description">
        抱歉，您没有权限访问此页面
      </p>
      <p class="error-subtitle">
        可能原因：账号权限不足 / 页面需要更高级别权限 / 会话已过期
      </p>

      <div class="error-actions">
        <el-button type="primary" size="large" @click="$router.push('/')">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button type="warning" size="large" @click="handleReLogin">
          <el-icon><RefreshRight /></el-icon>
          重新登录
        </el-button>
        <el-button size="large" @click="$router.go(-1)">
          <el-icon><Back /></el-icon>
          返回上页
        </el-button>
      </div>

      <div class="permission-info">
        <el-alert title="如需访问此资源，请联系管理员分配相应权限" type="warning" :closable="false" show-icon />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Forbidden - 403 无权限访问
 * @description 当用户尝试访问没有权限的资源时显示此页面
 */
import { useRouter } from 'vue-router'
import { HomeFilled, RefreshRight, Back } from '@element-plus/icons-vue'
import { clearTokens } from '@/utils/auth'

const router = useRouter()

function handleReLogin() {
  clearTokens()
  router.push('/login?redirect=' + router.currentRoute.value.fullPath)
}
</script>

<style lang="css" scoped>
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  padding: 20px;
}

.error-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 60px 80px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  max-width: 650px;
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-animation {
  margin-bottom: 30px;
}

.lock-wrapper {
  position: relative;
  display: inline-block;
  width: 160px;
  height: 160px;
}

.lock-icon {
  width: 100%;
  height: 100%;
  animation: lockShake 2s ease-in-out infinite;
}

@keyframes lockShake {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

.warning-circle {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 48px;
  height: 48px;
  background: #F56C6C;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  font-weight: bold;
  animation: pulse 1.5s ease-in-out infinite;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.error-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.error-code-text {
  font-size: 14px;
  color: #E6A23C;
  font-family: monospace;
  margin: 0 0 16px 0;
  font-weight: 500;
}

.error-description {
  font-size: 16px;
  color: #606266;
  margin: 0 0 8px 0;
}

.error-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 28px;

  .el-button {
    min-width: 130px;
    height: 42px;
    font-size: 14px;
  }
}

.permission-info {
  max-width: 480px;
  margin: 0 auto;
}
</style>
