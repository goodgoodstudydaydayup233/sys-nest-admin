<template>
  <div class="page-container">
    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" :icon="Refresh" :loading="loading" @click="fetchServerInfo">
        刷新
      </el-button>
    </div>

    <el-row :gutter="16" v-loading="loading">
      <!-- CPU 信息 -->
      <el-col :xs="24" :sm="24" :md="12" class="card-col">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Cpu /></el-icon>
              <span>CPU</span>
              <el-tag size="small" type="info" class="header-tag">
                {{ serverInfo.cpu?.cpuNum || 0 }} 核
              </el-tag>
            </div>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="CPU 使用率">
              <el-progress
                :percentage="serverInfo.cpu?.used || 0"
                :color="usageColor(serverInfo.cpu?.used)"
                :stroke-width="14"
                text-inside
              />
            </el-descriptions-item>
            <el-descriptions-item label="系统使用率">
              {{ serverInfo.cpu?.sys ?? '-' }} %
            </el-descriptions-item>
            <el-descriptions-item label="用户使用率">
              {{ serverInfo.cpu?.user ?? '-' }} %
            </el-descriptions-item>
            <el-descriptions-item label="CPU 型号">
              {{ serverInfo.cpu?.model || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="主频">
              {{ serverInfo.cpu?.speed ?? '-' }} GHz
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 内存信息 -->
      <el-col :xs="24" :sm="24" :md="12" class="card-col">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Coin /></el-icon>
              <span>内存</span>
              <el-tag size="small" type="success" class="header-tag">
                {{ serverInfo.mem?.total ?? 0 }} GB
              </el-tag>
            </div>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="内存使用率">
              <el-progress
                :percentage="serverInfo.mem?.usage || 0"
                :color="usageColor(serverInfo.mem?.usage)"
                :stroke-width="14"
                text-inside
              />
            </el-descriptions-item>
            <el-descriptions-item label="总内存">
              {{ serverInfo.mem?.total ?? '-' }} GB
            </el-descriptions-item>
            <el-descriptions-item label="已用内存">
              {{ serverInfo.mem?.used ?? '-' }} GB
            </el-descriptions-item>
            <el-descriptions-item label="空闲内存">
              {{ serverInfo.mem?.free ?? '-' }} GB
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 系统信息 -->
      <el-col :xs="24" :sm="24" :md="12" class="card-col">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Monitor /></el-icon>
              <span>服务器信息</span>
            </div>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="服务器名称">
              {{ serverInfo.sys?.computerName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="服务器 IP">
              {{ serverInfo.sys?.computerIp || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="操作系统">
              {{ serverInfo.sys?.osName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="系统架构">
              {{ serverInfo.sys?.osArch || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="项目路径">
              <span class="path-text">{{ serverInfo.sys?.userDir || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="运行时长">
              {{ formatUptime(serverInfo.sys?.uptime) }}
            </el-descriptions-item>
            <el-descriptions-item label="服务器时间">
              {{ serverInfo.sys?.sysTime || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- Node.js 运行时 -->
      <el-col :xs="24" :sm="24" :md="12" class="card-col">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Platform /></el-icon>
              <span>Node.js 运行时</span>
            </div>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="Node.js 版本">
              {{ serverInfo.node?.nodeVersion || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="NestJS 版本">
              {{ serverInfo.node?.nestVersion || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="进程运行时长">
              {{ formatUptime(serverInfo.node?.runTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="安装路径">
              <span class="path-text">{{ serverInfo.node?.home || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="进程内存使用率">
              <el-progress
                :percentage="nodeMemUsage"
                :color="usageColor(nodeMemUsage)"
                :stroke-width="14"
                text-inside
              />
            </el-descriptions-item>
            <el-descriptions-item label="已用内存">
              {{ serverInfo.node?.usedMemory ?? '-' }} GB
            </el-descriptions-item>
            <el-descriptions-item label="空闲内存">
              {{ serverInfo.node?.freeMemory ?? '-' }} GB
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- 磁盘信息 -->
    <el-card shadow="never" class="disk-card">
      <template #header>
        <div class="card-header">
          <el-icon><Files /></el-icon>
          <span>磁盘状态</span>
        </div>
      </template>
      <el-table :data="serverInfo.sysFiles || []" stripe>
        <el-table-column prop="dirName" label="盘符" min-width="120" show-overflow-tooltip />
        <el-table-column
          prop="sysTypeName"
          label="文件系统"
          min-width="120"
          show-overflow-tooltip
        />
        <el-table-column prop="typeName" label="类型" width="100" align="center" />
        <el-table-column prop="total" label="总量 (GB)" width="110" align="center" />
        <el-table-column prop="used" label="已用 (GB)" width="110" align="center" />
        <el-table-column prop="free" label="空闲 (GB)" width="110" align="center" />
        <el-table-column label="使用率" min-width="180" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.usage || 0"
              :color="usageColor(row.usage)"
              :stroke-width="14"
              text-inside
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 服务监控页面
 * @description 对标若依 monitor/server，展示服务器 CPU/内存/系统/Node.js 运行时/磁盘状态
 *
 * @数据来源
 * - GET /monitor/server 获取聚合监控信息
 *
 * @刷新策略
 * 进入页面加载一次，支持手动刷新
 */
import { ref, computed, onMounted } from 'vue'
import { Refresh, Cpu, Coin, Monitor, Platform, Files } from '@element-plus/icons-vue'
import { serverApi } from '@/api/monitor/server'
import type { ServerVo } from '@/api/monitor/server'

const loading = ref(false)
const serverInfo = ref<ServerVo>({} as ServerVo)

/** 进程内存使用率（基于已用/总量） */
const nodeMemUsage = computed(() => {
  const used = serverInfo.value.node?.usedMemory
  const total = serverInfo.value.node?.totalMemory
  if (!used || !total || total === 0) return 0
  return Number(((used / total) * 100).toFixed(2))
})

/** 获取服务监控信息 */
async function fetchServerInfo() {
  loading.value = true
  try {
    serverInfo.value = await serverApi.getServerInfo()
  } catch {
    // 错误已由请求拦截器统一提示
  } finally {
    loading.value = false
  }
}

/**
 * 使用率颜色：绿/橙/红
 * @param val 使用率 (0-100)
 */
function usageColor(val?: number): string {
  if (!val) return '#409eff'
  if (val >= 90) return '#f56c6c'
  if (val >= 70) return '#e6a23c'
  return '#67c23a'
}

/**
 * 格式化运行时长（秒 → 天时分）
 * @param seconds 秒数
 */
function formatUptime(seconds?: number): string {
  if (!seconds || seconds <= 0) return '-'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d} 天`)
  if (h > 0) parts.push(`${h} 小时`)
  if (m > 0) parts.push(`${m} 分钟`)
  return parts.join(' ') || `${Math.floor(seconds)} 秒`
}

onMounted(() => {
  fetchServerInfo()
})
</script>

<style scoped>
.page-container {
  padding: 16px;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.card-col {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.header-tag {
  margin-left: auto;
}

.disk-card {
  margin-top: 4px;
}

.path-text {
  word-break: break-all;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

:deep(.el-descriptions__label) {
  width: 120px;
  font-weight: 600;
}
</style>
