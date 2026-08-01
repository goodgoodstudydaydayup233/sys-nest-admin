<template>
  <div class="page-container">
    <!-- 筛选区 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline @keyup.enter="handleSearch">
        <el-form-item label="用户名">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户名"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="登录 IP">
          <el-input
            v-model="queryParams.ipaddr"
            placeholder="请输入登录 IP"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区 -->
    <!-- 操作栏 -->
    <div class="action-bar">
      <span class="table-title">在线用户列表</span>
      <el-button :icon="Refresh" circle @click="fetchList" />
    </div>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="tableData" style="width: 100%">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
      <el-table-column prop="nickname" label="昵称" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.nickname || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="ipaddr" label="登录 IP" min-width="130" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.ipaddr || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="browser" label="浏览器" width="120" align="center">
        <template #default="{ row }">
          {{ row.browser || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="os" label="操作系统" width="130" align="center">
        <template #default="{ row }">
          {{ row.os || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="loginTime" label="登录时间" width="180" align="center">
        <template #default="{ row }">
          {{ formatTime(row.loginTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            link
            type="danger"
            :icon="Delete"
            v-permissions="['monitor:online:forceLogout']"
            @click="handleForceLogout(row)"
          >
            强退
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
/**
 * 在线用户页面
 * @description 展示当前登录中的用户并支持强退
 *
 * @功能
 * 1. 查询在线用户列表（支持用户名、IP 筛选）
 * 2. 强退用户（使指定 token 立即失效）
 *
 * @数据来源
 * 后端在用户登录时按 token 维度写入 Redis（online:token:{token}），
 * 此页面通过 GET /monitor/online/list 读取所有在线记录。
 */
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onlineApi, type OnlineUserVo } from '@/api/monitor/online'

// ==================== 响应式状态 ====================

const loading = ref(false)
const tableData = ref<OnlineUserVo[]>([])

const queryParams = reactive({
  username: '',
  ipaddr: '',
})

// ==================== 数据加载 ====================

async function fetchList() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (queryParams.username) params.username = queryParams.username
    if (queryParams.ipaddr) params.ipaddr = queryParams.ipaddr
    tableData.value = await onlineApi.getOnlineList(params)
  } catch (e: any) {
    ElMessage.error(e?.message || '获取在线用户列表失败')
    tableData.value = []
  } finally {
    loading.value = false
  }
}

// ==================== 交互处理 ====================

function handleSearch() {
  fetchList()
}

function handleReset() {
  queryParams.username = ''
  queryParams.ipaddr = ''
  fetchList()
}

async function handleForceLogout(row: OnlineUserVo) {
  await ElMessageBox.confirm(`确认要强退用户「${row.username}」吗？该用户将立即下线。`, '提示', {
    type: 'warning',
  })
  await onlineApi.forceLogout(row.tokenId)
  ElMessage.success('强退成功')
  fetchList()
}

/** 格式化时间显示 */
function formatTime(time: string): string {
  if (!time) return '-'
  const d = new Date(time)
  if (isNaN(d.getTime())) return time
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// ==================== 初始化 ====================

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-title {
  font-weight: 600;
  font-size: 15px;
}
</style>
