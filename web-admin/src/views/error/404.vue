<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-animation">
        <div class="error-code-wrapper">
          <span class="error-number error-number-4">4</span>
          <span class="error-icon">
            <svg viewBox="0 0 100 100" class="icon-search">
              <circle cx="45" cy="45" r="35" fill="none" stroke="#409EFF" stroke-width="6" />
              <line
                x1="68"
                y1="68"
                x2="90"
                y2="90"
                stroke="#409EFF"
                stroke-width="8"
                stroke-linecap="round"
              />
              <circle cx="30" cy="50" r="5" fill="#409EFF" />
            </svg>
          </span>
          <span class="error-number error-number-4">4</span>
        </div>
      </div>

      <h1 class="error-title">页面走丢了</h1>
      <p class="error-description">抱歉，您访问的页面不存在或已被移除</p>
      <p class="error-subtitle">请检查网址是否正确，或者返回首页重新开始</p>

      <div class="error-actions">
        <el-button type="primary" size="large" @click="$router.push('/')">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button size="large" @click="$router.go(-1)">
          <el-icon><Back /></el-icon>
          返回上页
        </el-button>
      </div>

      <div class="error-tips">
        <p>💡 您可以尝试：</p>
        <ul>
          <li>检查输入的网址是否正确</li>
          <li>点击上方按钮返回首页</li>
          <li>联系管理员获取帮助</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * NotFound - 404 页面未找到
 * @description 当用户访问不存在的路由时显示此页面
 */
import { HomeFilled, Back } from '@element-plus/icons-vue'
</script>

<style lang="css" scoped>
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.error-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 60px 80px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  max-width: 600px;
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

.error-code-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.error-number {
  font-size: 120px;
  font-weight: 700;
  color: #409eff;
  line-height: 1;
  animation: bounceIn 1s ease-out;
}

.error-number-4:nth-child(1) {
  animation-delay: 0s;
}

.error-number-4:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes bounceIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.error-icon {
  width: 120px;
  height: 120px;
  animation: rotateIn 1s ease-out 0.1s both;
}

.icon-search {
  width: 100%;
  height: 100%;
  animation: searchMove 2s ease-in-out infinite;
}

@keyframes rotateIn {
  from {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  to {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes searchMove {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(10px);
  }
}

.error-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
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
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;

  .el-button {
    min-width: 140px;
    height: 44px;
    font-size: 15px;
  }
}

.error-tips {
  background-color: #f5f7fa;
  padding: 20px 24px;
  border-radius: 8px;
  text-align: left;

  p {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #606266;
    font-weight: 500;
  }

  ul {
    margin: 0;
    padding-left: 24px;
    list-style: none;

    li {
      position: relative;
      padding-left: 12px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #909399;

      &::before {
        content: '•';
        position: absolute;
        left: 0;
        color: #409eff;
        font-weight: bold;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
