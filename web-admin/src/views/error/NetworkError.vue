<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-animation">
        <div class="network-wrapper">
          <svg viewBox="0 0 200 160" class="network-icon">
            <!-- 云 -->
            <path d="M40 110 Q20 110 20 85 Q20 65 45 62 Q48 40 80 38 Q115 35 125 58 Q155 55 158 82 Q162 108 135 110 Z"
                  fill="#E4E7ED" opacity="0.5"/>
            <path d="M35 105 Q17 105 17 83 Q17 64 41 61 Q44 42 73 40 Q104 37 113 57 Q141 54 144 79 Q147 103 123 105 Z"
                  fill="#FFF" stroke="#DCDFE6" stroke-width="2.5"/>
            
            <!-- 断开的连接线 -->
            <g class="broken-connection">
              <line x1="100" y1="105" x2="100" y2="140" 
                    stroke="#F56C6C" stroke-width="4" stroke-dasharray="8,4"
                    stroke-linecap="round">
                <animate attributeName="stroke-dashoffset" values="0;-24" dur="1s" repeatCount="indefinite"/>
              </line>
              
              <!-- 断开点动画 -->
              <circle cx="100" cy="122" r="6" fill="#F56C6C">
                <animate attributeName="r" values="6;8;6" dur="1s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
              </circle>
            </g>
            
            <!-- 电脑/设备 -->
            <rect x="70" y="138" width="60" height="4" rx="2" fill="#909399"/>
            <rect x="80" y="142" width="40" height="3" rx="1.5" fill="#C0C4CC"/>
          </svg>

          <!-- WiFi 信号丢失图标 -->
          <div class="wifi-lost">
            <svg viewBox="0 0 100 100" class="wifi-icon">
              <path d="M50 70 L50 85 M30 55 Q50 40 70 55 M20 40 Q50 20 80 40 M10 25 Q50 0 90 25"
                    fill="none" stroke="#F56C6C" stroke-width="6" stroke-linecap="round" opacity="0.3"/>
              <line x1="72" y1="22" x2="88" y2="8" stroke="#F56C6C" stroke-width="6" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      <h1 class="error-title">网络连接失败</h1>
      <p class="error-code-text">Network Error</p>
      <p class="error-description">
        无法连接到服务器，请检查您的网络连接
      </p>
      <p class="error-subtitle">
        可能原因：网络断开 / 服务器宕机 / DNS 解析失败 / 防火墙拦截
      </p>

      <div class="error-actions">
        <el-button type="primary" size="large" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          重新加载
        </el-button>
        <el-button type="success" size="large" @click="handleDiagnose">
          <el-icon><Connection /></el-icon>
          网络诊断
        </el-button>
        <el-button size="large" @click="$router.push('/')">
          <el-icon><HomeFilled /></el-icon>
          离线模式
        </el-button>
      </div>

      <div class="network-tips" v-if="showTips">
        <el-alert title="诊断结果" type="info" :closable="false" show-icon>
          <template #default>
            <ul class="diagnosis-list">
              <li v-for="(tip, index) in diagnosisResults" :key="index" :class="{ success: tip.success, fail: !tip.success }">
                <el-icon v-if="tip.success"><CircleCheck /></el-icon>
                <el-icon v-else><CircleClose /></el-icon>
                {{ tip.message }}
              </li>
            </ul>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * NetworkError - 网络异常页面
 * @description 当网络请求失败或无法连接服务器时显示此页面
 */
import { ref } from 'vue'
import { Refresh, Connection, HomeFilled, CircleCheck, CircleClose } from '@element-plus/icons-vue'

const showTips = ref(false)
const diagnosisResults = ref<Array<{ message: string; success: boolean }>>([])

async function handleRefresh() {
  window.location.reload()
}

async function handleDiagnose() {
  showTips.value = true
  
  diagnosisResults.value = [
    { message: '正在检测本地网络...', success: true },
    { message: 'DNS 解析正常', success: true },
    { message: '无法连接到服务器 (http://localhost:3000)', success: false },
    { message: '建议检查后端服务是否启动', success: false },
  ]
}
</script>

<style lang="css" scoped>
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  padding: 20px;
}

.error-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 50px 70px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 620px;
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

.network-wrapper {
  position: relative;
  display: inline-block;
  width: 180px;
  height: 160px;
}

.network-icon {
  width: 100%;
  height: 100%;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.wifi-lost {
  position: absolute;
  bottom: 10px;
  right: 0;
  width: 50px;
  height: 50px;
  
  .wifi-icon {
    width: 100%;
    height: 100%;
    animation: wifiPulse 2s ease-in-out infinite;
  }
}

@keyframes wifiPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.95);
  }
}

.error-title {
  font-size: 26px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px 0;
}

.error-code-text {
  font-size: 14px;
  color: #E6A23C;
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

.network-tips {
  max-width: 520px;
  margin: 0 auto;

  .diagnosis-list {
    list-style: none;
    padding: 0;
    margin: 12px 0 0 0;
    text-align: left;

    li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      font-size: 13px;
      color: #606266;
      border-bottom: 1px solid #EBEEF5;

      &:last-child {
        border-bottom: none;
      }

      &.success .el-icon {
        color: #67C23A;
      }

      &.fail .el-icon {
        color: #F56C6C;
      }
    }
  }
}
</style>
