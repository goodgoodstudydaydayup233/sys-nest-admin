<template>
  <div class="dict-data-panel">
    <!-- 上部：选中类型信息 -->
    <div class="type-info-section">
      <div class="info-header">
        <div class="info-main">
          <span class="info-name">{{ typeInfo.name }}</span>
          <el-tag :type="typeInfo.status === '1' ? 'success' : 'danger'" size="small" effect="dark">
            {{ typeInfo.status === '1' ? '启用' : '禁用' }}
          </el-tag>
        </div>
        <div class="info-meta">
          <div class="meta-item">
            <span class="meta-label">类型编码</span>
            <el-tag type="info" size="small">{{ typeInfo.type }}</el-tag>
          </div>
          <div class="meta-item">
            <span class="meta-label">所属分组</span>
            <span>{{ typeInfo.groupName || '未分组' }}</span>
          </div>
          <div v-if="typeInfo.remark" class="meta-item meta-remark">
            <span class="meta-label">备注</span>
            <span>{{ typeInfo.remark }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 下部：一般标准页结构（筛选 + 操作栏 + 表格 + 分页） -->
    <!-- 筛选区 -->
    <div class="search-section">
      <el-form :model="queryParams" inline @keyup.enter="handleSearch">
        <el-form-item label="字典标签">
          <el-input
            v-model="queryParams.label"
            placeholder="请输入字典标签"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部"
            clearable
            class="status-select"
          >
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜 索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重 置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="table-action-bar">
      <div class="action-left">
        <el-button
          type="success"
          :icon="Plus"
          v-permissions="'system:dictData:add'"
          @click="handleCreate"
          >新 增</el-button
        >
        <el-button
          type="danger"
          :icon="Delete"
          v-permissions="'system:dictData:delete'"
          :disabled="!selectedRows.length"
          @click="handleBatchDelete"
          >删除</el-button
        >
      </div>
      <el-button circle :icon="Refresh" @click="fetchList" />
    </div>

    <!-- 表格区 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="label" label="字典标签" min-width="130" show-overflow-tooltip />
        <el-table-column prop="value" label="字典值" min-width="120" show-overflow-tooltip />
        <el-table-column prop="listClass" label="标签样式" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.listClass" :type="tagTypeMap[row.listClass] || ''" size="small">{{
              row.label
            }}</el-tag>
            <span v-else class="text-placeholder">默认</span>
          </template>
        </el-table-column>
        <el-table-column prop="cssClass" label="CSS类名" width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.cssClass || '-' }}</template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '1' ? 'success' : 'danger'" size="small">{{
              row.status === '1' ? '启用' : '禁用'
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :icon="Edit"
              v-permissions="'system:dictData:edit'"
              @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-popconfirm title="确认删除该数据？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button
                  link
                  type="danger"
                  :icon="Delete"
                  v-permissions="'system:dictData:delete'"
                  >删除</el-button
                >
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </div>

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
      :title="dialogType === 'create' ? '新增字典数据' : '编辑字典数据'"
      width="560px"
      :close-on-click-modal="false"
      draggable
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
        <el-form-item label="字典标签" prop="label">
          <el-input
            v-model="formData.label"
            placeholder="请输入字典标签"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="字典值" prop="value">
          <el-input v-model="formData.value" placeholder="请输入字典值" maxlength="50" />
        </el-form-item>
        <el-form-item label="回显样式" prop="cssClass">
          <el-input v-model="formData.cssClass" placeholder="CSS 类名（可选）" maxlength="100" />
        </el-form-item>
        <el-form-item label="标签样式" prop="listClass">
          <el-select
            v-model="formData.listId"
            placeholder="请选择标签样式"
            clearable
            style="width: 100%"
          >
            <el-option label="Default（默认）" value="" />
            <el-option label="Primary（主要）" value="primary" />
            <el-option label="Success（成功）" value="success" />
            <el-option label="Warning（警告）" value="warning" />
            <el-option label="Danger（危险）" value="danger" />
            <el-option label="Info（信息）" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            :max="9999"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio value="1">启用</el-radio>
            <el-radio value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * DictDataPanel - 字典数据面板
 * @description 上部展示当前选中的字典类型信息卡片，下部为一般标准页结构管理该类型下的数据条目
 *
 * @props typeId - 当前选中的字典类型 ID
 * @props typeInfo - 当前选中的字典类型完整信息
 */
import { ref, reactive, watch, onMounted } from 'vue'
import { Search, Refresh, Delete, Edit, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { dictDataApi } from '@/api/system'
import type { DictDataVo, CreateDictDataParams, DictTypeVo } from '@/api/system'

const props = defineProps<{
  /** 当前选中的字典类型 ID */
  typeId: number | string
  /** 当前选中的字典类型完整信息 */
  typeInfo: DictTypeVo
}>()

/** el-tag type 映射 */
const tagTypeMap: Record<string, string> = {
  primary: '',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
}

// ========== 列表相关 ==========
const loading = ref(false)
const tableData = ref<DictDataVo[]>([])
const total = ref(0)
const queryParams = reactive<{
  page: number
  pageSize: number
  label?: string
  status?: string
  dictType?: string
}>({
  page: 1,
  pageSize: 10,
  label: undefined,
  status: undefined,
})

async function fetchList() {
  if (!props.typeId) return
  loading.value = true
  try {
    const res = await dictDataApi.getDictDataList({
      ...queryParams,
      typeId: Number(props.typeId),
    })
    tableData.value = res.list
    total.value = res.total
    selectedRows.value = []
  } catch {
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.page = 1
  fetchList()
}

function handleReset() {
  queryParams.label = undefined
  queryParams.status = undefined
  queryParams.page = 1
  queryParams.pageSize = 10
  fetchList()
}

// ========== 多选相关 ==========
const selectedRows = ref<DictDataVo[]>([])

function handleSelectionChange(rows: DictDataVo[]) {
  selectedRows.value = rows
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条数据？`, '删除', {
    type: 'warning',
  })
  await dictDataApi.batchRemoveDictData({ ids: selectedRows.value.map((r) => r.id) })
  ElMessage.success('删除成功')
  fetchList()
}

async function handleDelete(row: DictDataVo) {
  await dictDataApi.removeDictData(row.id)
  ElMessage.success('删除成功')
  fetchList()
}

// ========== 弹窗/表单相关 ==========
const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive<CreateDictDataParams & { id?: number | string; listId?: string }>({
  label: '',
  value: '',
  typeId: 0,
  cssClass: '',
  listClass: '',
  sort: 0,
  status: '1',
  remark: '',
})

const formRules: FormRules = {
  label: [{ required: true, message: '请输入字典标签', trigger: 'blur' }],
  value: [{ required: true, message: '请输入字典值', trigger: 'blur' }],
}

function handleCreate() {
  dialogType.value = 'create'
  Object.assign(formData, {
    id: undefined,
    label: '',
    value: '',
    cssClass: '',
    listClass: '',
    listId: '',
    sort: 0,
    status: '1',
    remark: '',
  })
  dialogVisible.value = true
}

async function handleEdit(row: DictDataVo) {
  dialogType.value = 'edit'
  const detail = await dictDataApi.getDictDataDetail(row.id)
  Object.assign(formData, {
    id: detail.id,
    label: detail.label ?? '',
    value: detail.value ?? '',
    cssClass: detail.cssClass ?? '',
    listClass: detail.listClass ?? '',
    listId: detail.listClass ?? '',
    sort: detail.sort ?? 0,
    status: detail.status ?? '1',
    remark: detail.remark ?? '',
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    const submitData = { ...formData }
    submitData.listClass = formData.listId || ''
    delete submitData.listId
    submitData.typeId = Number(props.typeId)
    if (dialogType.value === 'create') {
      await dictDataApi.createDictData(submitData)
    } else {
      await dictDataApi.updateDictData(formData.id!, submitData)
    }
    ElMessage.success(dialogType.value === 'create' ? '创建成功' : '修改成功')
    dialogVisible.value = false
    fetchList()
  } catch {
  } finally {
    submitLoading.value = false
  }
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

// ========== 监听类型切换自动刷新 ==========
watch(
  () => props.typeId,
  () => {
    queryParams.page = 1
    fetchList()
  },
)

onMounted(fetchList)
</script>

<style lang="css" scoped>
.dict-data-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow-y: auto;
}

/* ========== 类型信息区 ========== */
.type-info-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.info-header {
  padding: 0;
}

.info-main {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.info-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.info-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.meta-label {
  color: var(--el-text-color-secondary);
}

.meta-remark {
  max-width: 300px;
}

.meta-remark span:last-child {
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 一般标准页结构 ========== */
.search-section {
  padding: 16px 20px;
}

.table-section {
  padding: 0 20px;
}

.table-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
}

.status-select {
  width: 120px;
}

.text-placeholder {
  color: var(--el-text-color-placeholder);
}
</style>
