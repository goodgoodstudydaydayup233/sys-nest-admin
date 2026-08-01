<template>
  <div class="dashboard-container">
    <el-card shadow="never" class="welcome-card">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">👋 欢迎使用 {{ appTitle }}</h1>
          <p class="welcome-desc">基于 Vue 3 + Vite + Element Plus 的后台管理系统</p>
          <el-tag effect="dark" round>v{{ appVersion }}</el-tag>
        </div>
        <div class="welcome-decoration">
          <el-icon :size="120" color="var(--el-color-primary-light-5)">
            <Monitor />
          </el-icon>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * Dashboard - 首页仪表盘组件
 * @description 展示系统欢迎信息
 */

import { Monitor } from '@element-plus/icons-vue'
import config from '@/config'

const appTitle = config.appTitle
const appVersion = config.appVersion
</script>

<style lang="css" scoped>
.dashboard-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-card {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-7) 100%
  );
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;
}

.welcome-desc {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin: 0 0 12px 0;
}

.welcome-decoration {
  opacity: 0.6;
}
</style>
