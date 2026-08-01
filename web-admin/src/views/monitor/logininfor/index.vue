<template>
  <div class="page-container">
    <!-- 筛选区 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline @keyup.enter="handleSearch">
        <el-form-item label="登录账号">
          <el-input
            v-model="queryParams.userName"
            placeholder="请输入登录账号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="登录地址">
          <el-input
            v-model="queryParams.ipaddr"
            placeholder="请输入登录地址"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="登录状态"
            clearable
            style="width: 140px"
          >
            <el-option label="成功" value="0" />
            <el-option label="失败" value="1" />
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
          v-permissions="['monitor:logininfor:remove']"
          @click="handleBatchDelete"
        >
          删除
        </el-button>
        <el-button
          type="warning"
          plain
          :icon="Close"
          v-permissions="['monitor:logininfor:remove']"
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
      <el-table-column prop="userName" label="登录账号" min-width="120" show-overflow-tooltip />
      <el-table-column prop="ipaddr" label="登录地址" min-width="130" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.ipaddr || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="loginLocation" label="登录地点" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.loginLocation || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="browser" label="浏览器" width="110" align="center">
        <template #default="{ row }">
          {{ row.browser || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="os" label="操作系统" width="120" align="center">
        <template #default="{ row }">
          {{ row.os || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="登录状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">
            {{ row.status === '0' ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="msg" label="提示消息" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.msg || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="loginTime" label="登录时间" width="170" align="center" />
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
    <el-dialog v-model="viewVisible" title="登录日志详细" width="640px" draggable append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="日志序号">{{ viewData.id }}</el-descriptions-item>
        <el-descriptions-item label="登录账号">{{ viewData.userName }}</el-descriptions-item>
        <el-descriptions-item label="登录状态">
          <el-tag :type="viewData.status === '0' ? 'success' : 'danger'" size="small">
            {{ viewData.status === '0' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="登录时间">{{ viewData.loginTime }}</el-descriptions-item>
        <el-descriptions-item label="登录地址">{{ viewData.ipaddr || '-' }}</el-descriptions-item>
        <el-descriptions-item label="登录地点">{{
          viewData.loginLocation || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ viewData.browser || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ viewData.os || '-' }}</el-descriptions-item>
        <el-descriptions-item label="提示消息" :span="2">{{
          viewData.msg || '-'
        }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录日志页面
 * @description 对标若依 logininfor，提供登录日志的查询、详情、删除、清空
 *
 * @接口说明
 * - GET    /logininfor           获取日志列表（分页）
 * - GET    /logininfor/{id}      获取日志详情
 * - DELETE /logininfor           批量删除日志
 * - DELETE /logininfor/clean     清空所有日志
 */
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Delete, View, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { loginLogApi, type LoginLogVo, type QueryLoginLogParams } from '@/api/system/loginLog'

// ==================== 响应式状态 ====================

const loading = ref(false)
const tableData = ref<LoginLogVo[]>([])
const total = ref(0)
const selectionIds = ref<(number | string)[]>([])
const dateRange = ref<string[]>([])

const queryParams = reactive<QueryLoginLogParams>({
  page: 1,
  pageSize: 10,
  userName: '',
  ipaddr: '',
  status: '',
})

// ==================== 详细弹窗 ====================

const viewVisible = ref(false)
const viewData = ref<LoginLogVo>({} as LoginLogVo)

// ==================== 数据加载 ====================

async function fetchList() {
  loading.value = true
  try {
    const params: QueryLoginLogParams = { ...queryParams }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const res = await loginLogApi.getLoginLogList(params)
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
  queryParams.userName = ''
  queryParams.ipaddr = ''
  queryParams.status = ''
  dateRange.value = []
  handleSearch()
}

function handleSelectionChange(rows: LoginLogVo[]) {
  selectionIds.value = rows.map((r) => r.id)
}

async function handleView(row: LoginLogVo) {
  try {
    const data = await loginLogApi.getLoginLogDetail(row.id)
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
    `确认要删除选中的 ${selectionIds.value.length} 条登录日志吗？`,
    '提示',
    {
      type: 'warning',
    },
  )
  await loginLogApi.batchRemoveLoginLog({ ids: selectionIds.value })
  ElMessage.success('删除成功')
  fetchList()
}

async function handleClean() {
  await ElMessageBox.confirm('确认要清空所有登录日志数据？此操作不可恢复！', '危险操作', {
    type: 'error',
    confirmButtonText: '确认清空',
    cancelButtonText: '取消',
  })
  await loginLogApi.cleanLoginLog()
  ElMessage.success('清空成功')
  fetchList()
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
</style>
