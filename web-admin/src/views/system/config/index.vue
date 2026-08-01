<template>
  <div class="page-container">
    <!-- 筛选区 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="参数名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入参数名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="参数分组">
          <el-input
            v-model="queryParams.group"
            placeholder="请输入参数分组"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格外部操作区 -->
    <div class="table-action-bar">
      <div>
        <el-button
          type="primary"
          plain
          :icon="Plus"
          v-permissions="'system:config:add'"
          @click="handleCreate"
          >新增</el-button
        >
        <el-button
          type="warning"
          plain
          :icon="RefreshRight"
          v-permissions="'system:config:remove'"
          @click="handleRefreshCache"
          >刷新缓存</el-button
        >
      </div>
      <el-button :icon="Refresh" circle @click="fetchConfigList" />
    </div>

    <!-- 表格区 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      stripe
      :header-cell-style="{ textAlign: 'center' }"
      :cell-style="{ textAlign: 'center' }"
    >
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="参数名称" min-width="140" show-overflow-tooltip />
      <el-table-column prop="configKey" label="参数键名" min-width="180" show-overflow-tooltip />
      <el-table-column prop="configValue" label="参数键值" min-width="180" show-overflow-tooltip />
      <el-table-column prop="group" label="分组" width="100" align="center" />
      <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="创建时间" width="170" align="center" />
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            :icon="Edit"
            v-permissions="'system:config:edit'"
            @click="handleEdit(row)"
            >编辑</el-button
          >
          <el-popconfirm
            title="确定删除该参数吗？"
            confirm-button-text="确定"
            cancel-button-text="取消"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button type="danger" link :icon="Delete" v-permissions="'system:config:delete'"
                >删除</el-button
              >
            </template>
          </el-popconfirm>
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
        @size-change="fetchConfigList"
        @current-change="fetchConfigList"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增参数' : '编辑参数'"
      width="560px"
      :close-on-click-modal="false"
      draggable
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
        <el-form-item label="参数名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入参数名称" />
        </el-form-item>
        <el-form-item label="参数键名" prop="configKey">
          <el-input
            v-model="formData.configKey"
            placeholder="请输入参数键名"
            :disabled="dialogType === 'edit'"
          />
        </el-form-item>
        <el-form-item label="参数键值" prop="configValue">
          <el-input
            v-model="formData.configValue"
            type="textarea"
            :rows="3"
            placeholder="请输入参数键值"
          />
        </el-form-item>
        <el-form-item label="参数分组" prop="group">
          <el-input v-model="formData.group" placeholder="请输入参数分组" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit"> 确定 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 参数设置页面
 * @description 提供系统参数的增删改查与缓存刷新
 *
 * @UI 布局
 * - 筛选区：参数名称、参数分组
 * - 操作区：新增、刷新缓存
 * - 表格：ID、参数名称、参数键名、参数键值、分组、备注、创建时间、操作（编辑/删除）
 * - 弹窗：新增/编辑表单
 *
 * @交互流程
 * 1. 进入页面加载列表
 * 2. 筛选/重置/分页 → 重新查询
 * 3. 新增/编辑 → 弹窗提交 → 刷新列表
 * 4. 删除 → popconfirm 确认 → 单删
 * 5. 刷新缓存 → 调用后端 refreshCache 接口
 */
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, RefreshRight, Delete, Edit, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { configApi } from '@/api/system'
import type { ConfigVo, QueryConfigParams, CreateConfigParams } from '@/api/system'

// ==================== 列表相关 ====================

/** 表格加载状态 */
const loading = ref(false)

/** 表格数据 */
const tableData = ref<ConfigVo[]>([])

/** 总记录数 */
const total = ref(0)

/** 查询参数（筛选条件 + 分页） */
const queryParams = reactive<QueryConfigParams>({
  page: 1,
  pageSize: 10,
  name: undefined,
  group: undefined,
})

/**
 * 获取参数配置列表
 * @description 调用 GET /config 接口，后端自动解包 data 中的 { list, total }
 */
async function fetchConfigList() {
  loading.value = true
  try {
    const { list, total: totalCount } = await configApi.getConfigList(queryParams)
    tableData.value = list
    total.value = totalCount
  } catch {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/**
 * 搜索
 * @description 重置页码到第一页后重新查询
 */
function handleSearch() {
  queryParams.page = 1
  fetchConfigList()
}

/**
 * 重置筛选条件
 * @description 清空所有筛选字段，页码回到第一页，重新查询
 */
function handleReset() {
  queryParams.name = undefined
  queryParams.group = undefined
  queryParams.page = 1
  queryParams.pageSize = 10
  fetchConfigList()
}

/**
 * 删除参数配置
 * @description 调用 DELETE /config/{id}
 * @param row 当前行数据
 */
async function handleDelete(row: ConfigVo) {
  try {
    await configApi.deleteConfig(row.id)
    ElMessage.success('删除成功')
    fetchConfigList()
  } catch {
    // 错误已由请求拦截器统一提示
  }
}

/**
 * 刷新参数缓存
 * @description 调用 DELETE /config/refreshCache，清空并重新预热缓存
 */
async function handleRefreshCache() {
  try {
    const { count } = await configApi.refreshCache()
    ElMessage.success(`刷新缓存成功，共预热 ${count} 条参数`)
  } catch {
    // 错误已由请求拦截器统一提示
  }
}

// ==================== 弹窗相关 ====================

/** 弹窗可见状态 */
const dialogVisible = ref(false)

/** 弹窗类型：create-新增 edit-编辑 */
const dialogType = ref<'create' | 'edit'>('create')

/** 表单提交 loading */
const submitLoading = ref(false)

/** 表单实例引用 */
const formRef = ref<FormInstance>()

/** 弹窗表单数据 */
const formData = reactive<CreateConfigParams & { id?: number }>({
  id: undefined,
  name: '',
  configKey: '',
  configValue: '',
  group: 'system',
  remark: '',
})

/** 表单校验规则 */
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入参数名称', trigger: 'blur' },
    { max: 100, message: '参数名称长度不能超过 100 个字符', trigger: 'blur' },
  ],
  configKey: [
    { required: true, message: '请输入参数键名', trigger: 'blur' },
    { max: 100, message: '参数键名长度不能超过 100 个字符', trigger: 'blur' },
  ],
  configValue: [
    { required: true, message: '请输入参数键值', trigger: 'blur' },
    { max: 500, message: '参数键值长度不能超过 500 个字符', trigger: 'blur' },
  ],
}

/**
 * 打开新增弹窗
 */
function handleCreate() {
  dialogType.value = 'create'
  resetForm()
  dialogVisible.value = true
}

/**
 * 打开编辑弹窗
 * @description 先拉取详情回显，再打开弹窗
 * @param row 当前行数据
 */
async function handleEdit(row: ConfigVo) {
  dialogType.value = 'edit'
  resetForm()
  try {
    const detail = await configApi.getConfigDetail(row.id)
    Object.assign(formData, {
      id: detail.id,
      name: detail.name,
      configKey: detail.configKey,
      configValue: detail.configValue,
      group: detail.group,
      remark: detail.remark,
    })
  } catch {
    return
  }
  dialogVisible.value = true
}

/**
 * 提交表单
 * @description 新增调用 POST /config，编辑调用 PUT /config/{id}
 */
async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (dialogType.value === 'create') {
        await configApi.createConfig({
          name: formData.name,
          configKey: formData.configKey,
          configValue: formData.configValue,
          group: formData.group,
          remark: formData.remark,
        })
        ElMessage.success('新增成功')
      } else {
        await configApi.updateConfig(formData.id!, {
          name: formData.name,
          configValue: formData.configValue,
          group: formData.group,
          remark: formData.remark,
        })
        ElMessage.success('修改成功')
      }
      dialogVisible.value = false
      fetchConfigList()
    } catch {
      // 错误已由请求拦截器统一提示
    } finally {
      submitLoading.value = false
    }
  })
}

/**
 * 重置表单数据到初始状态
 */
function resetForm() {
  formData.id = undefined
  formData.name = ''
  formData.configKey = ''
  formData.configValue = ''
  formData.group = 'system'
  formData.remark = ''
  formRef.value?.clearValidate()
}

/**
 * 弹窗关闭回调
 * @description 清空表单校验状态
 */
function handleDialogClose() {
  formRef.value?.clearValidate()
}

// ==================== 初始化 ====================

onMounted(() => {
  fetchConfigList()
})
</script>

<style scoped>
.page-container {
  padding: 16px;
}

.search-card {
  margin-bottom: 12px;
}

.search-card :deep(.el-card__body) {
  padding: 18px 18px 0 18px;
}

.table-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
</style>
