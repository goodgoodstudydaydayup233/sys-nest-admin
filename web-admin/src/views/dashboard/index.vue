<template>
  <div class="dashboard-container">
    <!-- 欢迎卡片 -->
    <el-card shadow="never" class="welcome-card">
      <div class="welcome-content">
        <div class="welcome-text">
          <h1 class="welcome-title">👋 欢迎使用 {{ appTitle }}</h1>
          <p class="welcome-desc">基于 Vue 3 + Vite + Element Plus 的后台管理系统</p>
          <div class="welcome-meta">
            <el-tag effect="dark" round>v{{ appVersion }}</el-tag>
            <el-tag effect="plain" round type="success">前后端分离</el-tag>
            <el-tag effect="plain" round type="warning">TypeScript</el-tag>
          </div>
        </div>
        <div class="welcome-decoration">
          <el-icon :size="120" color="var(--el-color-primary-light-5)">
            <Monitor />
          </el-icon>
        </div>
      </div>
    </el-card>

    <!-- GitHub 仓库卡片 -->
    <el-card shadow="never" class="repo-card">
      <div class="repo-content">
        <div class="repo-info">
          <svg class="github-icon" viewBox="0 0 16 16" width="28" height="28" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
            />
          </svg>
          <div class="repo-text">
            <div class="repo-title">GitHub 仓库地址</div>
            <div class="repo-desc">欢迎 Star ⭐ 支持，获取最新更新与完整源码</div>
          </div>
        </div>
        <el-button type="primary" round @click="openRepo">
          <el-icon style="margin-right: 4px"><Link /></el-icon>
          前往仓库
        </el-button>
      </div>
      <div class="repo-url">{{ repoUrl }}</div>
    </el-card>

    <!-- 技术栈卡片 -->
    <el-card shadow="never" class="tech-card">
      <template #header>
        <div class="card-header">
          <el-icon><Cpu /></el-icon>
          <span>技术栈说明</span>
        </div>
      </template>
      <el-row :gutter="20">
        <!-- 后端技术栈 -->
        <el-col :xs="24" :md="12">
          <div class="tech-section">
            <div class="tech-section-title">
              <span class="tech-badge backend">后端</span>
              <span class="tech-subtitle">NestJS 11</span>
            </div>
            <ul class="tech-list">
              <li><span class="tech-name">框架</span><span class="tech-value">NestJS 11</span></li>
              <li>
                <span class="tech-name">语言</span><span class="tech-value">TypeScript 5.7</span>
              </li>
              <li><span class="tech-name">ORM</span><span class="tech-value">TypeORM 0.3</span></li>
              <li><span class="tech-name">数据库</span><span class="tech-value">MySQL 8+</span></li>
              <li>
                <span class="tech-name">缓存</span><span class="tech-value">Redis（ioredis）</span>
              </li>
              <li>
                <span class="tech-name">认证</span
                ><span class="tech-value">Passport + JWT（双 Token）</span>
              </li>
              <li>
                <span class="tech-name">接口文档</span><span class="tech-value">Swagger</span>
              </li>
              <li>
                <span class="tech-name">校验</span><span class="tech-value">class-validator</span>
              </li>
              <li>
                <span class="tech-name">定时任务</span
                ><span class="tech-value">@nestjs/schedule + cron</span>
              </li>
              <li>
                <span class="tech-name">服务监控</span
                ><span class="tech-value">systeminformation</span>
              </li>
              <li><span class="tech-name">密码加密</span><span class="tech-value">bcrypt</span></li>
            </ul>
          </div>
        </el-col>
        <!-- 前端技术栈 -->
        <el-col :xs="24" :md="12">
          <div class="tech-section">
            <div class="tech-section-title">
              <span class="tech-badge frontend">前端</span>
              <span class="tech-subtitle">Vue 3.5</span>
            </div>
            <ul class="tech-list">
              <li>
                <span class="tech-name">框架</span
                ><span class="tech-value">Vue 3.5（Composition API）</span>
              </li>
              <li>
                <span class="tech-name">语言</span><span class="tech-value">TypeScript 6.0</span>
              </li>
              <li><span class="tech-name">构建工具</span><span class="tech-value">Vite 8</span></li>
              <li>
                <span class="tech-name">UI 组件库</span
                ><span class="tech-value">Element Plus 2.13+</span>
              </li>
              <li><span class="tech-name">状态管理</span><span class="tech-value">Pinia</span></li>
              <li>
                <span class="tech-name">路由</span><span class="tech-value">Vue Router 5</span>
              </li>
              <li><span class="tech-name">HTTP</span><span class="tech-value">Axios</span></li>
              <li><span class="tech-name">图表</span><span class="tech-value">ECharts 6</span></li>
              <li>
                <span class="tech-name">图标</span
                ><span class="tech-value">@element-plus/icons-vue</span>
              </li>
              <li><span class="tech-name">包管理</span><span class="tech-value">pnpm</span></li>
            </ul>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * Dashboard - 首页仪表盘组件
 * @description 展示系统欢迎信息、GitHub 仓库地址与技术栈说明
 */
import { Monitor, Link, Cpu } from '@element-plus/icons-vue'
import config from '@/config'

const appTitle = config.appTitle
const appVersion = config.appVersion

/** GitHub 仓库地址 */
const repoUrl = 'https://github.com/goodgoodstudydaydayup233/sys-nest-admin'

/** 在新标签页打开 GitHub 仓库 */
const openRepo = () => {
  window.open(repoUrl, '_blank', 'noopener,noreferrer')
}
</script>

<style lang="css" scoped>
.dashboard-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ==================== 欢迎卡片 ==================== */
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

.welcome-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.welcome-decoration {
  opacity: 0.6;
}

/* ==================== GitHub 仓库卡片 ==================== */
.repo-card :deep(.el-card__body) {
  padding: 20px;
}

.repo-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.repo-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.github-icon {
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}

.repo-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.repo-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.repo-url {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color);
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-family: 'Consolas', 'Monaco', monospace;
  word-break: break-all;
}

/* ==================== 技术栈卡片 ==================== */
.tech-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.tech-section {
  height: 100%;
}

.tech-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.tech-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.tech-badge.backend {
  background-color: var(--el-color-success);
}

.tech-badge.frontend {
  background-color: var(--el-color-primary);
}

.tech-subtitle {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.tech-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tech-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.tech-list li:last-child {
  border-bottom: none;
}

.tech-name {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.tech-value {
  color: var(--el-text-color-primary);
  text-align: right;
  font-weight: 500;
}

/* ==================== 响应式 ==================== */
@media (max-width: 768px) {
  .repo-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .welcome-decoration {
    display: none;
  }
}
</style>
