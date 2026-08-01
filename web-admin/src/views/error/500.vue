<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-animation">
        <div class="server-error-wrapper">
          <svg viewBox="0 0 200 160" class="server-icon">
            <!-- 服务器机架 -->
            <rect x="30" y="20" width="140" height="120" rx="8" fill="#F56C6C" opacity="0.1" stroke="#F56C6C" stroke-width="3"/>
            
            <!-- 服务器单元1 -->
            <rect x="45" y="35" width="110" height="28" rx="4" fill="#FFF" stroke="#DCDFE6" stroke-width="2"/>
            <circle cx="60" cy="49" r="5" fill="#67C23A">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="78" cy="49" r="5" fill="#67C23A">
              <animate attributeName="opacity" values="1;0.3;1" dur="2s" begin="0.3s" repeatCount="indefinite"/>
            </circle>
            <line x1="95" y1="42" x2="145" y2="42" stroke="#E4E7ED" stroke-width="3" stroke-linecap="round"/>
            <line x1="95" y1="49" x2="135" y2="49" stroke="#E4E7ED" stroke-width="3" stroke-linecap="round"/>
            <line x1="95" y1="56" x2="140" y2="56" stroke="#E4E7ED" stroke-width="3" stroke-linecap="round"/>

            <!-- 服务器单元2 - 错误状态 -->
            <rect x="45" y="70" width="110" height="28" rx="4" fill="#FEF0F0" stroke="#F56C6C" stroke-width="2"/>
            <text x="100" y="89" font-size="24" font-weight="bold" text-anchor="middle" fill="#F56C6C">✕</text>
            
            <!-- 服务器单元3 -->
            <rect x="45" y="105" width="110" height="25" rx="4" fill="#FFF" stroke="#DCDFE6" stroke-width="2"/>
            <circle cx="60" cy="117.5" r="4" fill="#909399"/>
            <line x1="75" y1="112" x2="140" y2="112" stroke="#E4E7ED" stroke-width="2" stroke-linecap="round"/>
            <line x1="75" y1="118" x2="130" y2="118" stroke="#E4E7ED" stroke-width="2" stroke-linecap="round"/>
          </svg>
          
          <!-- 警告图标 -->
          <div class="error-badge">500</div>
        </div>
      </div>

      <h1 class="error-title">服务器内部错误</h1>
      <p class="error-code-text">错误代码：500 Internal Server Error</p>
      <p class="error-description">
        抱歉，服务器遇到了问题，无法完成您的请求
      </p>
      <p class="error-subtitle">
        这可能是由于服务器过载、程序异常或数据库连接失败导致
      </p>

      <div class="error-actions">
        <el-button type="primary" size="large" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新重试
        </el-button>
        <el-button size="large" @click="$router.push('/')">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button size="large" @click="$router.go(-1)">
          <el-icon><Back /></el-icon>
          返回上页
        </el-button>
      </div>

      <div class="error-details">
        <el-collapse>
          <el-collapse-item title="查看详细信息（技术支持）" name="1">
            <div class="detail-content">
              <p><strong>请求时间：</strong>{{ requestTime }}</p>
              <p><strong>请求路径：</strong>{{ currentPath }}</p>
              <p><strong>用户标识：</strong>{{ userId }}</p>
              <p><strong>错误ID：</strong>{{ errorId }}</p>
              <p class="contact-tip">
                如问题持续存在，请联系技术支持并提供上述信息
              </p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ServerError - 500 服务器内部错误
 * @description 当服务器发生未处理的异常时显示此页面
 */
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Refresh, HomeFilled, Back } from '@element-plus/icons-vue'

const route = useRoute()

const requestTime = new Date().toLocaleString('zh-CN')
const currentPath = route.fullPath
const userId = 'USER_' + Date.now().toString(36).toUpperCase()
const errorId = 'ERR_' + Date.now().toString(36).toUpperCase()

function handleRefresh() {
  window.location.reload()
}
</script>

<style lang="css" scoped>
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  padding: 20px;
}

.error-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 50px 70px;
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
  margin-bottom: 28px;
}

.server-error-wrapper {
  position: relative;
  display: inline-block;
  width: 180px;
  height: 150px;
}

.server-icon {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 12px rgba(245, 108, 108, 0.2));
}

.error-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: linear-gradient(135deg, #F56C6C 0%, #f78989 100%);
  color: white;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 18px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.error-title {
  font-size: 26px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px 0;
}

.error-code-text {
  font-size: 13px;
  color: #F56C6C;
  font-family: 'Courier New', monospace;
  margin: 0 0 14px 0;
  font-weight: 600;
}

.error-description {
  font-size: 15px;
  color: #606266;
  margin: 0 0 8px 0;
}

.error-subtitle {
  font-size: 13px;
  color: #909399;
  margin: 0 0 28px 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 24px;

  .el-button {
    min-width: 130px;
    height: 42px;
    font-size: 14px;
  }
}

.error-details {
  max-width: 520px;
  margin: 0 auto;

  .detail-content {
    text-align: left;
    font-size: 13px;
    line-height: 1.8;
    color: #606266;

    p {
      margin: 4px 0;
    }

    .contact-tip {
      margin-top: 12px;
      padding: 12px;
      background-color: #fef0f0;
      border-radius: 6px;
      color: #F56C6C;
      font-weight: 500;
    }
  }

  :deep(.el-collapse-item__header) {
    font-size: 13px;
    color: #909399;
  }
}
</style>
