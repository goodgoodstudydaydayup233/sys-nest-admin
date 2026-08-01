<template>
  <div class="app-container">
    <el-row>
      <!-- 基本信息 -->
      <el-col :span="24" class="card-box">
        <el-card>
          <template #header>
            <el-icon><Monitor /></el-icon>
            <span>基本信息</span>
          </template>
          <div class="el-table el-table--enable-row-hover el-table--medium">
            <table cellspacing="0" style="width: 100%">
              <tbody>
                <tr>
                  <td class="el-table__cell is-leaf"><div class="cell">Redis版本</div></td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ info.redis_version || '-' }}</div>
                  </td>
                  <td class="el-table__cell is-leaf"><div class="cell">运行模式</div></td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ redisModeText }}</div>
                  </td>
                  <td class="el-table__cell is-leaf"><div class="cell">端口</div></td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ info.tcp_port || '-' }}</div>
                  </td>
                  <td class="el-table__cell is-leaf"><div class="cell">客户端数</div></td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ info.connected_clients || '-' }}</div>
                  </td>
                </tr>
                <tr>
                  <td class="el-table__cell is-leaf"><div class="cell">运行时间(天)</div></td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ info.uptime_in_days || '-' }}</div>
                  </td>
                  <td class="el-table__cell is-leaf"><div class="cell">使用内存</div></td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ info.used_memory_human || '-' }}</div>
                  </td>
                  <td class="el-table__cell is-leaf"><div class="cell">使用CPU</div></td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ formatCpu(info.used_cpu_user_children) }}</div>
                  </td>
                  <td class="el-table__cell is-leaf"><div class="cell">内存配置</div></td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ info.maxmemory_human || '-' }}</div>
                  </td>
                </tr>
                <tr>
                  <td class="el-table__cell is-leaf"><div class="cell">AOF是否开启</div></td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ info.aof_enabled === '1' ? '是' : '否' }}</div>
                  </td>
                  <td class="el-table__cell is-leaf"><div class="cell">RDB是否成功</div></td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ info.rdb_last_bgsave_status || '-' }}</div>
                  </td>
                  <td class="el-table__cell is-leaf"><div class="cell">Key数量</div></td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ monitorData?.dbSize ?? '-' }}</div>
                  </td>
                  <td class="el-table__cell is-leaf"><div class="cell">网络入口/出口</div></td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">
                      {{ info.instantaneous_input_kbps || '0' }}kps/{{
                        info.instantaneous_output_kbps || '0'
                      }}kps
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-card>
      </el-col>

      <!-- 命令统计（玫瑰图） -->
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header>
            <el-icon><PieChart /></el-icon>
            <span>命令统计</span>
          </template>
          <div ref="commandChartRef" style="height: 420px"></div>
        </el-card>
      </el-col>

      <!-- 内存信息（仪表盘） -->
      <el-col :span="12" class="card-box">
        <el-card>
          <template #header>
            <el-icon><Odometer /></el-icon>
            <span>内存信息</span>
          </template>
          <div ref="memoryChartRef" style="height: 420px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
/**
 * 缓存监控页面
 * @description 对标若依 monitor/cache，展示 Redis 基本信息、命令统计玫瑰图、内存仪表盘
 *
 * @UI 对标（nest-admin/admin-vue3/src/views/monitor/cache/index.vue）
 * - 基本信息：原生 table + el-table 样式（4列×3行）
 * - 命令统计：echarts 玫瑰图（roseType: radius）
 * - 内存信息：echarts 仪表盘（gauge）展示 used_memory_human
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Monitor, PieChart, Odometer } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts/core'
import { PieChart as EChartsPie, GaugeChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cacheApi, type CacheMonitorVo } from '@/api/monitor/cache'

echarts.use([TooltipComponent, LegendComponent, EChartsPie, GaugeChart, CanvasRenderer])

// ==================== 响应式状态 ====================

const loading = ref(false)
const monitorData = ref<CacheMonitorVo | null>(null)
const commandChartRef = ref<HTMLElement>()
const memoryChartRef = ref<HTMLElement>()
let commandChart: echarts.ECharts | null = null
let memoryChart: echarts.ECharts | null = null

// ==================== 计算属性 ====================

/** Redis INFO 直接平铺取值（若依取 Server 与 Memory 混合字段，这里统一从平铺结构取） */
const info = computed<Record<string, string>>(() => {
  // 后端 info 是分组结构，合并所有分组方便取值
  const grouped = monitorData.value?.info || {}
  const flat: Record<string, string> = {}
  Object.values(grouped).forEach((g) => Object.assign(flat, g))
  return flat
})

const redisModeText = computed(() => {
  const mode = info.value.redis_mode
  if (mode === 'standalone') return '单机'
  if (mode === 'sentinel') return '哨兵'
  if (mode === 'cluster') return '集群'
  return mode || '-'
})

// ==================== 图表渲染 ====================

/** 渲染命令统计玫瑰图 */
function renderCommandChart() {
  if (!commandChartRef.value) return
  if (!commandChart) {
    commandChart = echarts.init(commandChartRef.value)
  }

  const stats = monitorData.value?.commandStats || []
  const data = stats.map((item) => ({
    name: item.name,
    value: Number(item.value),
  }))

  commandChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)',
    },
    series: [
      {
        name: '命令',
        type: 'pie',
        roseType: 'radius',
        radius: [15, 95],
        center: ['50%', '38%'],
        data,
        animationEasing: 'cubicInOut',
        animationDuration: 1000,
      },
    ],
  })
}

/** 渲染内存仪表盘 */
function renderMemoryChart() {
  if (!memoryChartRef.value) return
  if (!memoryChart) {
    memoryChart = echarts.init(memoryChartRef.value)
  }

  const usedHuman = info.value.used_memory_human || '0'
  // 提取数值部分用于仪表盘（若依原样取 parseFloat）
  const usedValue = parseFloat(usedHuman) || 0

  memoryChart.setOption({
    tooltip: {
      formatter: '{b} <br/>{a} : ' + usedHuman,
    },
    series: [
      {
        name: '峰值',
        type: 'gauge',
        min: 0,
        max: 1000,
        detail: {
          formatter: usedHuman,
        },
        data: [
          {
            value: usedValue,
            name: '内存消耗',
          },
        ],
      },
    ],
  })
}

/** 窗口大小变化时重绘图表 */
function handleResize() {
  commandChart?.resize()
  memoryChart?.resize()
}

// ==================== 工具方法 ====================

/** 格式化 CPU 使用率（保留两位小数） */
function formatCpu(val?: string): string {
  if (!val) return '-'
  const n = parseFloat(val)
  return isNaN(n) ? '-' : n.toFixed(2)
}

// ==================== 数据加载 ====================

async function fetchMonitor() {
  loading.value = true
  try {
    monitorData.value = await cacheApi.getCacheMonitor()
    await nextTick()
    renderCommandChart()
    renderMemoryChart()
  } catch (e: any) {
    ElMessage.error(e?.message || '获取 Redis 监控信息失败')
  } finally {
    loading.value = false
  }
}

watch(monitorData, () => {
  nextTick(() => {
    renderCommandChart()
    renderMemoryChart()
  })
})

// ==================== 生命周期 ====================

onMounted(() => {
  fetchMonitor()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  commandChart?.dispose()
  memoryChart?.dispose()
  commandChart = null
  memoryChart = null
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.card-box {
  margin-bottom: 16px;
}

.card-box :deep(.el-card__header) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

/* el-table 样式表（对标若依原生 table 布局） */
.el-table {
  border: 1px solid #ebeef5;
  border-bottom: none;
}

.el-table__cell {
  padding: 8px 0;
  text-align: center;
  border-bottom: 1px solid #ebeef5;
  border-right: 1px solid #ebeef5;
}

.el-table__cell.is-leaf {
  font-size: 13px;
}

.cell {
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-break: break-all;
  line-height: 23px;
  padding: 0 12px;
}

/* 隔行换色 */
tbody tr:nth-child(odd) .el-table__cell {
  background: #fafafa;
}

tbody tr:hover .el-table__cell {
  background: #f5f7fa;
}
</style>
