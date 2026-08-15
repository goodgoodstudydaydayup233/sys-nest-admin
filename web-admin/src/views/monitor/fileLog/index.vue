<template>
  <div class="page-container">
    <!-- 筛选区 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline @keyup.enter="handleSearch">
        <el-form-item label="日志分类">
          <el-select
            v-model="queryParams.category"
            placeholder="日志分类"
            style="width: 150px"
            @change="handleCategoryChange"
          >
            <el-option label="访问日志" value="access" />
            <el-option label="应用日志" value="app" />
            <el-option label="错误日志" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别">
          <el-select
            v-model="queryParams.level"
            placeholder="日志级别"
            clearable
            style="width: 130px"
          >
            <el-option v-for="lv in levelOptions" :key="lv" :label="lv" :value="lv" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.keyword"
            placeholder="内容/路径/IP/操作人"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <div>
        <el-button
          type="primary"
          plain
          :icon="FolderOpened"
          v-permissions="['monitor:fileLog:list']"
          @click="openFileDrawer"
        >
          文件管理
        </el-button>
        <el-tag v-if="currentFileName" closable type="warning" @close="clearFileFilter">
          当前文件：{{ currentFileName }}
        </el-tag>
      </div>
      <el-button :icon="Refresh" circle @click="fetchEntries" />
    </div>

    <!-- 截断提示 -->
    <el-alert
      v-if="entriesTruncated"
      title="筛选结果因扫描行数过多已被截断，请缩小时间范围或使用关键字/文件筛选后重试"
      type="warning"
      show-icon
      :closable="false"
    />

    <!-- 日志明细表格 -->
    <el-table v-loading="loading" :data="tableData" border>
      <el-table-column prop="ts" label="日志时间" width="190" align="center" />
      <el-table-column label="级别" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="levelTagType(row.level)" size="small">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
      <!-- 访问日志专属列 -->
      <template v-if="queryParams.category === 'access'">
        <el-table-column prop="method" label="请求方式" width="90" align="center" />
        <el-table-column label="状态码" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ row.status ?? '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="客户端IP" width="140" show-overflow-tooltip />
        <el-table-column prop="user" label="操作人" width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.user || '-' }}</template>
        </el-table-column>
        <el-table-column label="耗时" width="100" align="center">
          <template #default="{ row }">{{ row.cost != null ? row.cost + 'ms' : '-' }}</template>
        </el-table-column>
        <el-table-column prop="url" label="请求路径" min-width="200" show-overflow-tooltip />
      </template>
      <!-- 应用/错误日志专属列 -->
      <template v-else>
        <el-table-column prop="context" label="上下文" width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.context || '-' }}</template>
        </el-table-column>
      </template>
      <el-table-column prop="message" label="日志内容" min-width="220" show-overflow-tooltip />
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
        @size-change="fetchEntries"
        @current-change="fetchEntries"
      />
    </div>

    <!-- 日志详情弹窗 -->
    <el-dialog v-model="viewVisible" title="日志详细" width="720px" draggable append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="日志时间">{{ viewData.ts }}</el-descriptions-item>
        <el-descriptions-item label="级别">
          <el-tag :type="levelTagType(viewData.level)" size="small">{{ viewData.level }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="分类">
          {{ categoryMap[viewData.category] || viewData.category }}
        </el-descriptions-item>
        <template v-if="viewData.category === 'access'">
          <el-descriptions-item label="请求方式">{{ viewData.method || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态码">
            <el-tag :type="statusTagType(viewData.status)" size="small">
              {{ viewData.status ?? '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="客户端IP">{{ viewData.ip || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ viewData.user || '-' }}</el-descriptions-item>
          <el-descriptions-item label="耗时">
            {{ viewData.cost != null ? viewData.cost + 'ms' : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="请求路径" :span="2">{{
            viewData.url || '-'
          }}</el-descriptions-item>
          <el-descriptions-item label="User-Agent" :span="2">
            <div class="text-block">{{ viewData.ua || '-' }}</div>
          </el-descriptions-item>
        </template>
        <template v-else>
          <el-descriptions-item label="上下文">{{ viewData.context || '-' }}</el-descriptions-item>
        </template>
        <el-descriptions-item label="日志内容" :span="2">
          <div class="text-block">{{ viewData.message || '-' }}</div>
        </el-descriptions-item>
        <el-descriptions-item v-if="viewData.stack" label="异常堆栈" :span="2">
          <pre class="stack-block">{{ viewData.stack }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewVisible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- 文件管理抽屉 -->
    <el-drawer
      v-model="fileDrawerVisible"
      :title="`文件管理（${categoryMap[queryParams.category]}）`"
      size="560px"
    >
      <div class="drawer-summary">
        <el-tag type="info">共 {{ filesSummary.totalFiles }} 个文件</el-tag>
        <el-tag type="warning">总大小 {{ filesSummary.totalSizeText }}</el-tag>
      </div>
      <el-table v-loading="fileLoading" :data="fileList" border>
        <el-table-column prop="name" label="文件名" min-width="190" show-overflow-tooltip />
        <el-table-column prop="sizeText" label="大小" width="90" align="center" />
        <el-table-column prop="mtime" label="修改时间" width="150" align="center" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              v-permissions="['monitor:fileLog:query']"
              @click="openPreview(row)"
            >
              预览
            </el-button>
            <el-button link type="success" @click="viewFile(row)">查看</el-button>
            <el-button
              link
              type="danger"
              v-permissions="['monitor:fileLog:download']"
              @click="downloadFile(row)"
            >
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="fileParams.page"
          v-model:page-size="fileParams.pageSize"
          :total="filesSummary.totalFiles"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="fetchFiles"
          @current-change="fetchFiles"
        />
      </div>
    </el-drawer>

    <!-- 文件内容在线预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      :title="`预览日志文件：${previewFileName}`"
      width="1000px"
      top="6vh"
      draggable
      append-to-body
      destroy-on-close
      @closed="handlePreviewClosed"
    >
      <!-- 预览工具栏 -->
      <div class="preview-toolbar">
        <div class="preview-file-info">
          <el-tag type="info">{{ categoryMap[previewCategory] }}</el-tag>
          <el-tag type="warning">共 {{ previewTotal }} 行</el-tag>
          <el-tag v-if="previewFileInfo">{{ previewFileInfo.sizeText }}</el-tag>
          <el-tag v-if="previewFileInfo">{{ previewFileInfo.mtime }}</el-tag>
        </div>
        <el-button :icon="Refresh" circle @click="fetchPreview" />
      </div>

      <!-- 截断提示 -->
      <el-alert
        v-if="previewTruncated"
        title="文件过大，仅读取前 500000 行（按文件顺序截断），如需完整内容请下载查看"
        type="warning"
        show-icon
        :closable="false"
        class="preview-alert"
      />

      <!-- 原始内容文本（带行号） -->
      <div class="preview-content" v-loading="previewLoading">
        <pre class="raw-block">{{ previewText }}</pre>
      </div>

      <!-- 预览分页区 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="previewParams.page"
          v-model:page-size="previewParams.pageSize"
          :total="previewTotal"
          :page-sizes="[200, 500, 1000]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchPreview"
          @current-change="fetchPreview"
        />
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 文件日志页面
 * @description 查看后端文件日志（访问/应用/错误三类），支持：
 * - 分类 / 级别 / 时间范围 / 关键字 多维度筛选
 * - 日志明细分页查看、单条日志详情
 * - 文件管理：文件列表、文件内容在线预览（原始文本按行分页）、按文件查看、下载、删除
 *
 * @接口说明
 * - GET    /file-log/files      获取日志文件列表
 * - GET    /file-log/raw        预览日志文件原始内容（按行分页）
 * - GET    /file-log/entries    查询日志内容（按文件查看复用该接口）
 * - GET    /file-log/download   下载日志文件
 * - DELETE /file-log/file       删除日志文件
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Refresh, View, FolderOpened } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fileLogApi,
  type FileLogFileVo,
  type FileLogEntryVo,
  type LogCategory,
  type LogLevel,
  type QueryFileLogEntriesParams,
  type QueryFileLogFilesParams,
} from '@/api/monitor/fileLog'

// ==================== 常量 ====================

/** 日志级别选项 */
const levelOptions: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'VERBOSE']

/** 分类名称映射 */
const categoryMap: Record<LogCategory, string> = {
  access: '访问日志',
  app: '应用日志',
  error: '错误日志',
}

// ==================== 日志明细状态 ====================

const loading = ref(false)
const tableData = ref<FileLogEntryVo[]>([])
const total = ref(0)
const entriesTruncated = ref(false)
const dateRange = ref<string[]>([])

const queryParams = reactive<QueryFileLogEntriesParams>({
  page: 1,
  pageSize: 20,
  category: 'access',
  level: undefined,
  keyword: '',
})

/** 当前选中的日志文件（来自文件管理"查看"） */
const currentFileName = ref('')

// ==================== 详情弹窗 ====================

const viewVisible = ref(false)
const viewData = ref<FileLogEntryVo>({} as FileLogEntryVo)

// ==================== 文件管理状态 ====================

const fileDrawerVisible = ref(false)
const fileLoading = ref(false)
const fileList = ref<FileLogFileVo[]>([])
const fileParams = reactive<QueryFileLogFilesParams>({
  page: 1,
  pageSize: 10,
  category: 'access',
})
const filesSummary = reactive({
  totalFiles: 0,
  totalSizeText: '',
})

// ==================== 文件内容在线预览状态 ====================

const previewVisible = ref(false)
const previewLoading = ref(false)
/** 当前页原始文本行 */
const previewRaw = ref<string[]>([])
/** 文件总行数 */
const previewTotal = ref(0)
const previewTruncated = ref(false)
/** 当前预览的文件分类 */
const previewCategory = ref<LogCategory>('access')
/** 当前预览的文件名 */
const previewFileName = ref('')
/** 当前预览的文件元信息（大小/修改时间） */
const previewFileInfo = ref<FileLogFileVo>()

/** 预览查询参数：按行分页读取原始内容 */
const previewParams = reactive({
  page: 1,
  pageSize: 500,
})

/** 带行号的原始内容文本 */
const previewText = computed(() => {
  const startLine = (previewParams.page - 1) * previewParams.pageSize + 1
  return previewRaw.value
    .map((line, i) => `${String(startLine + i).padStart(6, ' ')}  ${line}`)
    .join('\n')
})

// ==================== 数据加载 ====================

/** 查询日志明细 */
async function fetchEntries() {
  loading.value = true
  try {
    const params: QueryFileLogEntriesParams = { ...queryParams }
    // el-select 清空后值为 ''，转换为 undefined 后由请求层过滤
    params.level = queryParams.level || undefined
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    if (currentFileName.value) {
      params.fileName = currentFileName.value
    }
    const res = await fileLogApi.getEntries(params)
    tableData.value = res.list
    total.value = res.total
    entriesTruncated.value = !!res.truncated
  } finally {
    loading.value = false
  }
}

/** 查询文件列表 */
async function fetchFiles() {
  fileLoading.value = true
  try {
    const res = await fileLogApi.getFiles({ ...fileParams })
    fileList.value = res.list
    filesSummary.totalFiles = res.totalFiles
    filesSummary.totalSizeText = res.totalSizeText
  } finally {
    fileLoading.value = false
  }
}

// ==================== 交互处理 ====================

function handleSearch() {
  queryParams.page = 1
  fetchEntries()
}

function handleReset() {
  queryParams.level = undefined
  queryParams.keyword = ''
  dateRange.value = []
  currentFileName.value = ''
  handleSearch()
}

/** 切换分类时清空级别与当前文件筛选 */
function handleCategoryChange() {
  queryParams.level = undefined
  queryParams.page = 1
  currentFileName.value = ''
  fetchEntries()
}

function clearFileFilter() {
  currentFileName.value = ''
  queryParams.page = 1
  fetchEntries()
}

function handleView(row: FileLogEntryVo) {
  viewData.value = row
  viewVisible.value = true
}

/** 打开文件管理抽屉并加载文件列表 */
function openFileDrawer() {
  fileParams.category = queryParams.category
  fileParams.page = 1
  fileDrawerVisible.value = true
  fetchFiles()
}

/** 查看指定文件（关闭抽屉并加载该文件日志） */
function viewFile(row: FileLogFileVo) {
  currentFileName.value = row.name
  queryParams.page = 1
  fileDrawerVisible.value = false
  fetchEntries()
}

/** 打开文件内容在线预览 */
function openPreview(row: FileLogFileVo) {
  previewFileName.value = row.name
  previewFileInfo.value = row
  previewCategory.value = row.category
  previewParams.page = 1
  previewVisible.value = true
  fetchPreview()
}

/** 加载预览内容（按行分页读取原始文件内容） */
async function fetchPreview() {
  previewLoading.value = true
  try {
    const res = await fileLogApi.getRaw({
      fileName: previewFileName.value,
      page: previewParams.page,
      pageSize: previewParams.pageSize,
    })
    previewRaw.value = res.content
    previewTotal.value = res.total
    previewTruncated.value = !!res.truncated
  } finally {
    previewLoading.value = false
  }
}

/** 预览弹窗关闭后重置状态 */
function handlePreviewClosed() {
  previewRaw.value = []
  previewTotal.value = 0
  previewTruncated.value = false
  previewFileName.value = ''
  previewFileInfo.value = undefined
}

async function downloadFile(row: FileLogFileVo) {
  await fileLogApi.downloadFile(row.name)
  ElMessage.success('下载成功')
}

async function removeFile(row: FileLogFileVo) {
  await ElMessageBox.confirm(`确认删除日志文件 ${row.name}？此操作不可恢复！`, '危险操作', {
    type: 'error',
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
  })
  await fileLogApi.removeFile({ name: row.name })
  ElMessage.success('删除成功')
  fetchFiles()
  // 若删除的正是当前查看的文件，清除文件筛选
  if (currentFileName.value === row.name) {
    clearFileFilter()
  }
}

// ==================== 展示辅助 ====================

/** 级别对应的 tag 类型 */
function levelTagType(level?: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    DEBUG: 'info',
    INFO: 'success',
    WARN: 'warning',
    ERROR: 'danger',
    VERBOSE: 'info',
  }
  return (level ? map[level] : 'info') || 'info'
}

/** HTTP 状态码对应的 tag 类型 */
function statusTagType(status?: number): '' | 'success' | 'warning' | 'info' | 'danger' {
  if (status == null) return 'info'
  if (status < 400) return 'success'
  if (status < 500) return 'warning'
  return 'danger'
}

// ==================== 初始化 ====================

onMounted(() => {
  fetchEntries()
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
}

.action-bar > div {
  display: flex;
  gap: 8px;
  align-items: center;
}

.drawer-summary {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-toolbar > div {
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-alert {
  margin-bottom: 12px;
}

.preview-content {
  height: 60vh;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: #f8f8f8;
}

.raw-block {
  margin: 0;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre;
  color: #303133;
}

.text-block {
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  overflow: auto;
  color: #606266;
}

.stack-block {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 240px;
  overflow: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #f56c6c;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
}
</style>
