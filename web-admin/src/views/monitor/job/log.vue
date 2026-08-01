<template>
  <div class="page-container">
    <!-- 筛选区 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline @keyup.enter="handleSearch">
        <el-form-item label="任务名称">
          <el-input
            v-model="queryParams.jobName"
            placeholder="请输入任务名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="任务组名">
          <el-select
            v-model="queryParams.jobGroup"
            placeholder="请选择任务组名"
            clearable
            style="width: 200px"
          >
            <el-option label="默认" value="DEFAULT" />
            <el-option label="系统" value="SYSTEM" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择执行状态"
            clearable
            class="status-select"
          >
            <el-option label="成功" value="0" />
            <el-option label="失败" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜 索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重 置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <div class="table-action-bar">
      <div>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="!selectedRows.length"
          @click="handleBatchDelete"
          >删 除</el-button
        >
        <el-button type="danger" plain :icon="Delete" @click="handleClean">清 空</el-button>
        <el-button type="info" plain :icon="Close" @click="handleClose">关 闭</el-button>
      </div>
      <el-button circle :icon="Refresh" @click="fetchList" />
    </div>

    <!-- 表格区 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="jobLogId" label="日志编号" width="90" align="center" />
      <el-table-column prop="jobName" label="任务名称" min-width="130" show-overflow-tooltip />
      <el-table-column prop="jobGroup" label="任务组名" width="110" align="center">
        <template #default="{ row }">
          <el-tag size="small">{{
            row.jobGroup === 'DEFAULT' ? '默认' : row.jobGroup === 'SYSTEM' ? '系统' : row.jobGroup
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="invokeTarget"
        label="调用目标字符串"
        min-width="200"
        show-overflow-tooltip
      />
      <el-table-column prop="jobMessage" label="日志信息" min-width="180" show-overflow-tooltip />
      <el-table-column label="执行状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">{{
            row.status === '0' ? '成功' : '失败'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="执行时间" width="170" align="center" />
      <el-table-column label="操作" width="80" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" :icon="View" @click="handleView(row)">详细</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页区 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <!-- 日志详细弹窗 -->
    <el-dialog v-model="viewVisible" title="调度日志详细" width="640px" draggable append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="日志序号">{{ viewData.jobLogId }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ viewData.jobName }}</el-descriptions-item>
        <el-descriptions-item label="任务分组">{{ viewData.jobGroup }}</el-descriptions-item>
        <el-descriptions-item label="执行时间">{{ viewData.createTime }}</el-descriptions-item>
        <el-descriptions-item label="调用方法" :span="2">{{
          viewData.invokeTarget
        }}</el-descriptions-item>
        <el-descriptions-item label="日志信息" :span="2">{{
          viewData.jobMessage || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="执行状态">
          <el-tag :type="viewData.status === '0' ? 'success' : 'danger'" size="small">
            {{ viewData.status === '0' ? '正常' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="viewData.status === '1'" label="异常信息" :span="2">
          <div class="exception-info">{{ viewData.exceptionInfo || '-' }}</div>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * JobLog - 调度日志页面
 * @description 定时任务执行日志的查询、查看详情、删除、清空等操作
 *
 * @接口说明（后续接入）
 * - GET    /job-log           获取日志列表（分页）
 * - GET    /job-log/{id}      获取日志详情
 * - DELETE /job-log/{ids}     删除日志（支持批量）
 * - DELETE /job-log/clean     清空所有日志
 *
 * @布局说明
 * 上方 → 筛选区（任务名称/组名/状态/日期范围）
 * 中间 → 操作栏 + 表格
 * 下方 → 分页
 * 弹窗 → 日志详细（el-descriptions 只读展示）
 */
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Refresh, Delete, View, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { jobLogApi } from '@/api/system/job'

const route = useRoute()
const router = useRouter()

// ========== 列表相关 ==========
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const dateRange = ref<string[] | null>(null)
const queryParams = reactive<{
  page: number
  pageSize: number
  jobName?: string
  jobGroup?: string
  status?: string
}>({
  page: 1,
  pageSize: 10,
})

async function fetchList() {
  loading.value = true
  try {
    const params: any = { ...queryParams }
    if (dateRange.value && dateRange.value.length === 2) {
      params.beginTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const res = await jobLogApi.getJobLogList(params)
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.page = 1
  fetchList()
}

function handleReset() {
  queryParams.jobName = undefined
  queryParams.jobGroup = undefined
  queryParams.status = undefined
  dateRange.value = null
  queryParams.page = 1
  queryParams.pageSize = 10
  fetchList()
}

// ========== 多选相关 ==========
const selectedRows = ref<any[]>([])

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条日志？`, '删除', {
    type: 'warning',
  })
  await jobLogApi.batchRemoveJobLog({ ids: selectedRows.value.map((r) => r.jobLogId) })
  ElMessage.success('删除成功')
  fetchList()
}

async function handleClean() {
  await ElMessageBox.confirm('确认要清空所有调度日志数据？此操作不可恢复！', '危险操作', {
    type: 'error',
    confirmButtonText: '确认清空',
    cancelButtonText: '取消',
  })
  await jobLogApi.cleanJobLog()
  ElMessage.success('清空成功')
  fetchList()
}

function handleClose() {
  router.push('/monitor/job')
}

// ========== 详细弹窗 ==========
const viewVisible = ref(false)
const viewData = reactive<Record<string, any>>({})

function handleView(row: any) {
  Object.assign(viewData, row)
  viewVisible.value = true
}

// ========== 初始化：从路由参数回填筛选条件 ==========
onMounted(() => {
  const jobId = route.query.jobId as string | undefined
  const jobName = route.query.jobName as string | undefined
  if (jobName) {
    queryParams.jobName = decodeURIComponent(jobName)
    console.log('[调度日志] 根据任务跳转', { jobId, jobName })
  }
  fetchList()
})
</script>

<style lang="css" scoped>
.page-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card :deep(.el-card__body) {
  padding-bottom: 2px;
}

.table-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-select {
  width: 120px;
}

.exception-info {
  max-height: 150px;
  overflow-y: auto;
  font-family: Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--el-color-danger);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
