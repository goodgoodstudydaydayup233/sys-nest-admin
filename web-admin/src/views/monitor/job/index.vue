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
        <el-form-item label="任务状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择任务状态"
            clearable
            class="status-select"
          >
            <el-option label="正常" value="0" />
            <el-option label="暂停" value="1" />
          </el-select>
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
          type="primary"
          plain
          :icon="Plus"
          v-permissions="'system:user:add'"
          @click="handleCreate"
          >新增</el-button
        >
        <el-button type="primary" plain :icon="Edit" :disabled="single" @click="handleBatchEdit"
          >修 改</el-button
        >
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="!selectedRows.length"
          @click="handleBatchDelete"
          >删除</el-button
        >
        <el-button type="info" plain :icon="Document" @click="handleJobLog">日志</el-button>
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
      <el-table-column prop="jobId" label="任务编号" width="100" align="center" />
      <el-table-column prop="jobName" label="任务名称" min-width="140" show-overflow-tooltip />
      <el-table-column prop="jobGroup" label="任务组名" width="120" align="center">
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
      <el-table-column
        prop="cronExpression"
        label="cron表达式"
        min-width="140"
        show-overflow-tooltip
      />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            active-value="0"
            inactive-value="1"
            inline-prompt
            active-text="启"
            inactive-text="停"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-tooltip content="修改" placement="top">
            <el-button link type="primary" :icon="Edit" @click="handleEdit(row)" />
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)" />
          </el-tooltip>
          <el-tooltip content="执行一次" placement="top">
            <el-button link type="success" :icon="VideoPlay" @click="handleRun(row)" />
          </el-tooltip>
          <el-tooltip content="详细" placement="top">
            <el-button link type="info" :icon="View" @click="handleView(row)" />
          </el-tooltip>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增定时任务' : '修改定时任务'"
      width="720px"
      :close-on-click-modal="false"
      draggable
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务名称" prop="jobName">
              <el-input v-model="formData.jobName" placeholder="请输入任务名称" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务分组" prop="jobGroup">
              <el-select v-model="formData.jobGroup" placeholder="请选择" style="width: 100%">
                <el-option label="默认" value="DEFAULT" />
                <el-option label="系统" value="SYSTEM" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item prop="invokeTarget">
              <template #label>
                <span
                  >调用方法
                  <el-tooltip
                    content="调用目标格式：Bean名称.方法名(参数)，参数支持字符串、数字、布尔值。示例：ryTask.ryParams('ry')"
                    placement="top"
                  >
                    <el-icon style="vertical-align: middle; cursor: help"
                      ><QuestionFilled
                    /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-input
                v-model="formData.invokeTarget"
                placeholder="Bean调用示例：ryTask.ryParams('ry')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="cron表达式" prop="cronExpression">
              <el-input v-model="formData.cronExpression" placeholder="请输入cron执行表达式">
                <template #append>
                  <el-button type="primary" @click="showCron = true">生成表达式</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="dialogType === 'edit'">
            <el-form-item label="状态">
              <el-radio-group v-model="formData.status">
                <el-radio value="0">正常</el-radio>
                <el-radio value="1">暂停</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="misfirePolicy">
              <template #label>
                <span
                  >执行策略
                  <el-tooltip
                    content="调度触发与预期时间偏差时的处理策略：立即执行-启动后补执行一次；执行一次-触发一次后停止调度；放弃执行-按 cron 正常调度，忽略偏差"
                    placement="top"
                  >
                    <el-icon style="vertical-align: middle; cursor: help"
                      ><QuestionFilled
                    /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-radio-group v-model="formData.misfirePolicy">
                <el-radio-button value="1">立即执行</el-radio-button>
                <el-radio-button value="2">执行一次</el-radio-button>
                <el-radio-button value="3">放弃执行</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="concurrent">
              <template #label>
                <span
                  >是否并发
                  <el-tooltip
                    content="控制同一任务上一次执行未结束时，下一次 cron 触发是否允许再次启动。禁止-跳过本次触发；允许-启动新执行，可能多实例并行。手动执行不受此限制"
                    placement="top"
                  >
                    <el-icon style="vertical-align: middle; cursor: help"
                      ><QuestionFilled
                    /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-radio-group v-model="formData.concurrent">
                <el-radio-button value="0">允许</el-radio-button>
                <el-radio-button value="1">禁止</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确 定</el-button>
        <el-button @click="dialogVisible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 任务详细弹窗 -->
    <el-dialog v-model="viewVisible" title="任务详细" width="640px" draggable append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务编号">{{ viewData.jobId }}</el-descriptions-item>
        <el-descriptions-item label="任务名称">{{ viewData.jobName }}</el-descriptions-item>
        <el-descriptions-item label="任务分组">{{ viewData.jobGroup }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewData.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="cron表达式">{{
          viewData.cronExpression
        }}</el-descriptions-item>
        <el-descriptions-item label="下次执行时间">{{
          viewData.nextValidTime || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="调用目标方法" :span="2">{{
          viewData.invokeTarget
        }}</el-descriptions-item>
        <el-descriptions-item label="任务状态">{{
          viewData.status === '0' ? '正常' : '暂停'
        }}</el-descriptions-item>
        <el-descriptions-item label="是否并发">{{
          viewData.concurrent === '0' ? '允许' : '禁止'
        }}</el-descriptions-item>
        <el-descriptions-item label="执行策略" :span="2">
          {{ misfirePolicyMap[viewData.misfirePolicy] || '-' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewVisible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- Cron表达式生成器 -->
    <el-dialog
      v-model="showCron"
      title="Cron表达式生成器"
      width="760px"
      destroy-on-close
      draggable
      append-to-body
    >
      <CronGenerator
        :model-value="formData.cronExpression"
        @update:model-value="cronTempValue = $event"
      />
      <template #footer>
        <el-button type="primary" @click="handleCronConfirm(cronTempValue)">确 定</el-button>
        <el-button @click="showCron = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * JobManage - 定时任务管理页面
 * @description 定时任务的增删改查、状态切换、立即执行、查看详细等操作
 *
 * @接口说明（后续接入）
 * - GET    /job               获取任务列表（分页）
 * - GET    /job/{id}          获取任务详情
 * - POST   /job               创建任务
 * - PUT    /job/{id}          更新任务
 * - DELETE /job/{id}          删除任务
 * - PUT    /job/changeStatus  修改任务状态
 * - PUT    /job/run           立即执行一次
 *
 * @布局说明
 * 上方 → 筛选区（任务名称/组名/状态）
 * 中间 → 操作栏 + 树形表格
 * 下方 → 分页
 * 弹窗 → 新增/编辑（el-dialog + el-form 双列布局）+ 任务详细
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  Refresh,
  Delete,
  Edit,
  Plus,
  View,
  Document,
  VideoPlay,
  QuestionFilled,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import CronGenerator from './components/CronGenerator.vue'
import { jobApi } from '@/api/system/job'

const router = useRouter()

const misfirePolicyMap: Record<string, string> = {
  '0': '默认策略',
  '1': '立即执行',
  '2': '执行一次',
  '3': '放弃执行',
}

// ========== 列表相关 ==========
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
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
    const res = await jobApi.getJobList({ ...queryParams })
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
  queryParams.page = 1
  queryParams.pageSize = 10
  fetchList()
}

// ========== 多选相关 ==========
const selectedRows = ref<any[]>([])
const single = computed(() => selectedRows.value.length !== 1)

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条记录？`, '删除', {
    type: 'warning',
  })
  await jobApi.batchRemoveJob({ ids: selectedRows.value.map((r) => r.jobId) })
  ElMessage.success('删除成功')
  fetchList()
}

async function handleBatchEdit() {
  if (!selectedRows.value[0]) return
  handleEdit(selectedRows.value[0])
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确认删除该定时任务？', '提示', { type: 'warning' })
  await jobApi.removeJob(row.jobId)
  ElMessage.success('删除成功')
  fetchList()
}

// ========== 详细弹窗 ==========
function handleStatusChange(row: any) {
  const text = row.status === '0' ? '启用' : '停用'
  ElMessageBox.confirm(`确认要"${text}"任务"${row.jobName}"吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await jobApi.changeJobStatus({ jobId: row.jobId, status: row.status })
      ElMessage.success(`${text}成功`)
    })
    .catch(() => {
      row.status = row.status === '0' ? '1' : '0'
    })
}

function handleRun(row: any) {
  ElMessageBox.confirm(`确认要立即执行一次"${row.jobName}"任务吗？`, '提示', {
    type: 'warning',
  })
    .then(async () => {
      await jobApi.runJob(row.jobId)
      ElMessage.success('执行成功')
    })
    .catch(() => {})
}

function handleJobLog() {
  router.push('/monitor/job-log')
}

function handleView(row: any) {
  Object.assign(viewData, row)
  viewVisible.value = true
}

// ========== 弹窗/表单相关 ==========
const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive<{
  jobId?: number
  jobName: string
  jobGroup: string
  invokeTarget: string
  cronExpression: string
  misfirePolicy: string
  concurrent: string
  status: string
}>({
  jobId: undefined,
  jobName: '',
  jobGroup: '',
  invokeTarget: '',
  cronExpression: '',
  misfirePolicy: '1',
  concurrent: '1',
  status: '0',
})

const formRules: FormRules = {
  jobName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  invokeTarget: [{ required: true, message: '请输入调用目标字符串', trigger: 'blur' }],
  cronExpression: [{ required: true, message: '请输入cron执行表达式', trigger: 'change' }],
}

function handleCreate() {
  dialogType.value = 'create'
  Object.assign(formData, {
    jobId: undefined,
    jobName: '',
    jobGroup: '',
    invokeTarget: '',
    cronExpression: '',
    misfirePolicy: '1',
    concurrent: '1',
    status: '0',
  })
  dialogVisible.value = true
}

function handleEdit(row: any) {
  dialogType.value = 'edit'
  Object.assign(formData, {
    jobId: row.jobId,
    jobName: row.jobName ?? '',
    jobGroup: row.jobGroup ?? '',
    invokeTarget: row.invokeTarget ?? '',
    cronExpression: row.cronExpression ?? '',
    misfirePolicy: row.misfirePolicy ?? '1',
    concurrent: row.concurrent ?? '1',
    status: row.status ?? '0',
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try {
    if (dialogType.value === 'create') {
      await jobApi.createJob({ ...formData })
    } else {
      await jobApi.updateJob(formData.jobId!, { ...formData })
    }
    ElMessage.success(dialogType.value === 'create' ? '创建成功' : '修改成功')
    dialogVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

// ========== 详细弹窗 ==========
const viewVisible = ref(false)
const viewData = reactive<Record<string, any>>({})

// ========== Cron生成器 ==========
const showCron = ref(false)
const cronTempValue = ref('')

function handleCronConfirm(cron: string) {
  formData.cronExpression = cron
  showCron.value = false
}

onMounted(fetchList)
</script>

<style lang="css" scoped>
.page-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-select {
  width: 120px;
}
</style>
