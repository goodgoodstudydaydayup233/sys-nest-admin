<template>
  <div class="page-container">
    <!-- 筛选区 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline @keyup.enter="handleSearch">
        <el-form-item label="系统模块">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入系统模块"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="操作人员">
          <el-input
            v-model="queryParams.operName"
            placeholder="请输入操作人员"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="queryParams.businessType"
            placeholder="操作类型"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="(label, value) in businessTypeMap"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="操作状态"
            clearable
            style="width: 140px"
          >
            <el-option label="正常" value="0" />
            <el-option label="异常" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区 -->
    <!-- 操作栏 -->
    <div class="action-bar">
      <div>
        <el-button
          type="danger"
          plain
          :icon="Delete"
          :disabled="selectionIds.length === 0"
          v-permissions="['monitor:operlog:remove']"
          @click="handleBatchDelete"
        >
          删除
        </el-button>
        <el-button
          type="warning"
          plain
          :icon="Close"
          v-permissions="['monitor:operlog:remove']"
          @click="handleClean"
        >
          清空
        </el-button>
      </div>
      <el-button :icon="Refresh" circle @click="fetchList" />
    </div>

    <!-- 表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      border
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" align="center" />
      <el-table-column prop="id" label="日志序号" width="90" align="center" />
      <el-table-column prop="title" label="系统模块" min-width="120" show-overflow-tooltip />
      <el-table-column label="操作类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="businessTypeTagType[row.businessType] || 'info'" size="small">
            {{ businessTypeMap[row.businessType] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="requestMethod" label="请求方式" width="90" align="center" />
      <el-table-column prop="operName" label="操作人员" min-width="110" show-overflow-tooltip />
      <el-table-column prop="operIp" label="主机地址" min-width="130" show-overflow-tooltip />
      <el-table-column prop="operLocation" label="操作地点" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.operLocation || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">
            {{ row.status === '0' ? '正常' : '异常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="消耗时间" width="100" align="center">
        <template #default="{ row }">
          {{ row.costTime != null ? row.costTime + 'ms' : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="操作时间" width="170" align="center" />
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

    <!-- 详细弹窗 -->
    <el-dialog v-model="viewVisible" title="操作日志详细" width="720px" draggable append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="日志序号">{{ viewData.id }}</el-descriptions-item>
        <el-descriptions-item label="系统模块">{{ viewData.title }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="businessTypeTagType[viewData.businessType] || 'info'" size="small">
            {{ businessTypeMap[viewData.businessType] || '未知' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="请求方式">{{ viewData.requestMethod }}</el-descriptions-item>
        <el-descriptions-item label="操作人员">{{ viewData.operName }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ viewData.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="主机地址">{{ viewData.operIp || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作地点">{{
          viewData.operLocation || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="请求URL" :span="2">{{
          viewData.operUrl
        }}</el-descriptions-item>
        <el-descriptions-item label="方法名称" :span="2">{{
          viewData.method
        }}</el-descriptions-item>
        <el-descriptions-item label="操作状态">
          <el-tag :type="viewData.status === '0' ? 'success' : 'danger'" size="small">
            {{ viewData.status === '0' ? '正常' : '异常' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="消耗时间">
          {{ viewData.costTime != null ? viewData.costTime + 'ms' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="json-block">{{ formatJson(viewData.operParam) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item v-if="viewData.status === '0'" label="返回参数" :span="2">
          <pre class="json-block">{{ formatJson(viewData.jsonResult) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item v-if="viewData.status === '1'" label="异常信息" :span="2">
          <div class="exception-info">{{ viewData.errorMsg || '-' }}</div>
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
 * 操作日志页面
 * @description 对标若依 operlog，提供操作日志的查询、详情、删除、清空
 *
 * @接口说明
 * - GET    /oper-log           获取日志列表（分页）
 * - GET    /oper-log/{id}      获取日志详情
 * - DELETE /oper-log           批量删除日志
 * - DELETE /oper-log/clean     清空所有日志
 */
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Delete, View, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  operLogApi,
  businessTypeMap,
  businessTypeTagType,
  type OperLogVo,
  type QueryOperLogParams,
} from '@/api/system/operLog'

// ==================== 响应式状态 ====================

const loading = ref(false)
const tableData = ref<OperLogVo[]>([])
const total = ref(0)
const selectionIds = ref<(number | string)[]>([])
const dateRange = ref<string[]>([])

const queryParams = reactive<QueryOperLogParams>({
  page: 1,
  pageSize: 10,
  title: '',
  operName: '',
  businessType: '',
  status: '',
})

// ==================== 详细弹窗 ====================

const viewVisible = ref(false)
const viewData = ref<OperLogVo>({} as OperLogVo)

// ==================== 数据加载 ====================

async function fetchList() {
  loading.value = true
  try {
    const params: QueryOperLogParams = { ...queryParams }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const res = await operLogApi.getOperLogList(params)
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// ==================== 交互处理 ====================

function handleSearch() {
  queryParams.page = 1
  fetchList()
}

function handleReset() {
  queryParams.title = ''
  queryParams.operName = ''
  queryParams.businessType = ''
  queryParams.status = ''
  dateRange.value = []
  handleSearch()
}

function handleSelectionChange(rows: OperLogVo[]) {
  selectionIds.value = rows.map((r) => r.id)
}

async function handleView(row: OperLogVo) {
  try {
    const data = await operLogApi.getOperLogDetail(row.id)
    viewData.value = data
    viewVisible.value = true
  } catch {
    // 接口失败时直接展示列表行数据
    viewData.value = row
    viewVisible.value = true
  }
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(
    `确认要删除选中的 ${selectionIds.value.length} 条操作日志吗？`,
    '提示',
    {
      type: 'warning',
    },
  )
  await operLogApi.batchRemoveOperLog({ ids: selectionIds.value })
  ElMessage.success('删除成功')
  fetchList()
}

async function handleClean() {
  await ElMessageBox.confirm('确认要清空所有操作日志数据？此操作不可恢复！', '危险操作', {
    type: 'error',
    confirmButtonText: '确认清空',
    cancelButtonText: '取消',
  })
  await operLogApi.cleanOperLog()
  ElMessage.success('清空成功')
  fetchList()
}

/** 格式化 JSON 字符串便于阅读 */
function formatJson(str?: string): string {
  if (!str) return '-'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
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

.action-bar > div {
  display: flex;
  gap: 8px;
}

.json-block {
  margin: 0;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #606266;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
}

.exception-info {
  white-space: pre-wrap;
  word-break: break-all;
  color: #f56c6c;
  max-height: 200px;
  overflow: auto;
}
</style>
