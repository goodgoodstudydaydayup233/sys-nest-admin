<template>
  <div class="maintenance-container">
    <div class="maintenance-content">
      <div class="maintenance-animation">
        <!-- 工具图标 -->
        <div class="tools-wrapper">
          <svg viewBox="0 0 200 200" class="tools-icon">
            <!-- 扳手 -->
            <g class="wrench" transform="rotate(-45, 100, 100)">
              <path d="M80 100 L120 60 L130 70 L90 110 Z" fill="#409EFF" />
              <circle cx="75" cy="105" r="15" fill="none" stroke="#409EFF" stroke-width="8" />
              <circle cx="135" cy="65" r="12" fill="none" stroke="#409EFF" stroke-width="6" />
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-45,100,100; -30,100,100; -45,100,100"
                dur="3s"
                repeatCount="indefinite"
              />
            </g>

            <!-- 齿轮 -->
            <g class="gear" transform="translate(140, 50)">
              <path
                d="M0,-25 L5,-22 L7,-28 L13,-27 L16,-32 L21,-29 L26,-32 L29,-27 L35,-28 L37,-22 L42,-25
                       L42,-18 L48,-17 L47,-11 L53,-8 L49,-3 L54,2 L48,6 L51,12 L44,14 L44,20
                       L37,19 L34,25 L28,22 L23,27 L19,23 L14,27 L10,23 L5,27 L1,23 L-4,27
                       L-8,23 L-13,27 L-17,23 L-22,27 L-25,22 L-31,25 L-34,19 L-41,20
                       L-41,14 L-48,12 L-44,6 L-50,2 L-45,-3 L-49,-8 L-43,-11 L-42,-17
                       L-35,-18 Z"
                fill="#E6A23C"
                opacity="0.8"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values="0;360"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </path>
              <circle cx="0" cy="0" r="12" fill="#FFF" />
            </g>
          </svg>
        </div>

        <!-- 进度条 -->
        <div class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <p class="progress-text">{{ progress }}% 完成</p>
        </div>
      </div>

      <h1 class="maintenance-title">系统维护中</h1>
      <p class="maintenance-description">我们正在进行系统升级和优化，以提供更好的服务体验</p>
      <p class="maintenance-time">
        <el-icon><Clock /></el-icon>
        预计完成时间：{{ estimatedTime }}
      </p>

      <div class="maintenance-info">
        <div class="info-card">
          <h3>🔧 维护内容</h3>
          <ul>
            <li>系统性能优化</li>
            <li>数据库升级</li>
            <li>安全补丁更新</li>
            <li>新功能部署</li>
          </ul>
        </div>

        <div class="info-card">
          <h3>📞 联系方式</h3>
          <p class="contact-item">
            <el-icon><Phone /></el-icon>
            技术支持热线：400-XXX-XXXX
          </p>
          <p class="contact-item">
            <el-icon><Message /></el-icon>
            邮箱：support@example.com
          </p>
          <p class="contact-item">
            <el-icon><ChatDotRound /></el-icon>
            在线客服：工作日 9:00-18:00
          </p>
        </div>
      </div>

      <div class="maintenance-actions">
        <el-button type="primary" size="large" @click="handleNotifyMe">
          <el-icon><Bell /></el-icon>
          完成后通知我
        </el-button>
      </div>

      <p class="maintenance-footer">感谢您的耐心等待与理解 ❤️</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Maintenance - 系统维护中页面
 * @description 当系统进行维护或升级时显示此页面
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { Clock, Phone, Message, ChatDotRound, Bell } from '@element-plus/icons-vue'

const progress = ref(0)
const estimatedTime = ref('今天 18:00')
let timer: number | null = null

onMounted(() => {
  // 模拟进度动画
  timer = window.setInterval(() => {
    if (progress.value < 85) {
      progress.value += Math.random() * 2
    }
  }, 800)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

function handleNotifyMe() {
  alert('我们会在系统恢复后第一时间通知您！')
}
</script>

<style lang="css" scoped>
.maintenance-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  padding: 20px;
}

.maintenance-content {
  text-align: center;
  background: rgba(255, 255, 255, 0.98);
  padding: 50px 70px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 700px;
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

.maintenance-animation {
  margin-bottom: 32px;
}

.tools-wrapper {
  width: 180px;
  height: 160px;
  margin: 0 auto 24px;

  .tools-icon {
    width: 100%;
    height: 100%;
  }
}

.progress-section {
  max-width: 400px;
  margin: 0 auto;

  .progress-bar {
    width: 100%;
    height: 12px;
    background-color: #ebeef5;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
      border-radius: 6px;
      transition: width 0.5s ease-out;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.4) 50%,
          transparent 100%
        );
        animation: shimmer 2s infinite;
      }
    }
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .progress-text {
    margin: 12px 0 0 0;
    font-size: 14px;
    color: #67c23a;
    font-weight: 600;
  }
}

.maintenance-title {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 16px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.maintenance-description {
  font-size: 16px;
  color: #606266;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.maintenance-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  color: #e6a23c;
  font-weight: 500;
  margin: 0 0 32px 0;
}

.maintenance-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 28px;
  text-align: left;

  .info-card {
    background-color: #f5f7fa;
    padding: 20px;
    border-radius: 10px;

    h3 {
      margin: 0 0 14px 0;
      font-size: 15px;
      color: #303133;
      font-weight: 600;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        position: relative;
        padding-left: 16px;
        margin-bottom: 8px;
        font-size: 13px;
        color: #606266;

        &:last-child {
          margin-bottom: 0;
        }

        &::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: #67c23a;
          font-weight: bold;
        }
      }
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      font-size: 13px;
      color: #606266;

      &:last-child {
        margin-bottom: 0;
      }

      .el-icon {
        color: #409eff;
        font-size: 16px;
      }
    }
  }
}

.maintenance-actions {
  margin-bottom: 24px;

  .el-button {
    min-width: 200px;
    height: 46px;
    font-size: 15px;
  }
}

.maintenance-footer {
  font-size: 14px;
  color: #909399;
  margin: 0;
}
</style>
