<template>
  <div class="page-container">
    <!-- 筛选区 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item label="通知标题">
          <el-input
            v-model="queryParams.noticeTitle"
            placeholder="请输入通知标题"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="创建者">
          <el-input
            v-model="queryParams.createBy"
            placeholder="请输入创建者"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="通知类型">
          <el-select
            v-model="queryParams.noticeType"
            placeholder="请选择通知类型"
            clearable
            style="width: 160px"
          >
            <el-option label="通知" value="1" />
            <el-option label="公告" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格外部操作区 -->
    <div class="table-action-bar">
      <el-button
        type="primary"
        plain
        :icon="Plus"
        v-permissions="'system:notice:add'"
        @click="handleCreate"
        >新增</el-button
      >
      <el-button :icon="Refresh" circle @click="fetchNoticeList" />
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
      <el-table-column prop="noticeTitle" label="通知标题" min-width="200" show-overflow-tooltip />
      <el-table-column label="通知类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.noticeType === '1' ? 'info' : 'success'" size="small">
            {{ row.noticeType === '1' ? '通知' : '公告' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'danger'" size="small">
            {{ row.status === '0' ? '正常' : '关闭' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createBy" label="创建者" width="120" align="center">
        <template #default="{ row }">
          {{ row.createBy || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="170" align="center" />
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            :icon="View"
            v-permissions="'system:notice:query'"
            @click="handleView(row)"
            >详情</el-button
          >
          <el-button
            type="primary"
            link
            :icon="Edit"
            v-permissions="'system:notice:edit'"
            @click="handleEdit(row)"
            >编辑</el-button
          >
          <el-popconfirm
            title="确定删除该通知吗？"
            confirm-button-text="确定"
            cancel-button-text="取消"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button type="danger" link :icon="Delete" v-permissions="'system:notice:remove'"
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
        @size-change="fetchNoticeList"
        @current-change="fetchNoticeList"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增通知' : '编辑通知'"
      width="640px"
      :close-on-click-modal="false"
      draggable
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
        <el-form-item label="通知标题" prop="noticeTitle">
          <el-input v-model="formData.noticeTitle" placeholder="请输入通知标题" />
        </el-form-item>
        <el-form-item label="通知类型" prop="noticeType">
          <el-radio-group v-model="formData.noticeType">
            <el-radio value="1">通知</el-radio>
            <el-radio value="2">公告</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio value="0">正常</el-radio>
            <el-radio value="1">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="通知内容" prop="noticeContent">
          <el-input
            v-model="formData.noticeContent"
            type="textarea"
            :rows="8"
            placeholder="请输入通知内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit"> 确定 </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="viewVisible" title="通知详情" width="640px" draggable append-to-body>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="通知标题">{{ viewData.noticeTitle }}</el-descriptions-item>
        <el-descriptions-item label="通知类型">
          <el-tag :type="viewData.noticeType === '1' ? 'info' : 'success'" size="small">
            {{ viewData.noticeType === '1' ? '通知' : '公告' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewData.status === '0' ? 'success' : 'danger'" size="small">
            {{ viewData.status === '0' ? '正常' : '关闭' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建者">{{ viewData.createBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{
          viewData.createdAt || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="通知内容">
          <div class="notice-content" v-html="viewData.noticeContent || '-'"></div>
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
 * 通知公告页面
 * @description 对标若依 system/notice（sys_notice），提供通知公告的增删改查
 *
 * @UI 布局
 * - 筛选区：通知标题、创建者、通知类型
 * - 操作区：新增
 * - 表格：ID、通知标题、通知类型、状态、创建者、创建时间、操作（详情/编辑/删除）
 * - 弹窗：新增/编辑表单 + 详情弹窗
 *
 * @字段说明
 * - noticeType: 1-通知 2-公告
 * - status:     0-正常 1-关闭
 */
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Delete, Edit, Plus, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { noticeApi } from '@/api/system'
import type { NoticeVo, QueryNoticeParams, CreateNoticeParams } from '@/api/system'

// ==================== 列表相关 ====================

const loading = ref(false)
const tableData = ref<NoticeVo[]>([])
const total = ref(0)

const queryParams = reactive<QueryNoticeParams>({
  page: 1,
  pageSize: 10,
  noticeTitle: undefined,
  createBy: undefined,
  noticeType: undefined,
})

/** 获取通知公告列表 */
async function fetchNoticeList() {
  loading.value = true
  try {
    const { list, total: totalCount } = await noticeApi.getNoticeList(queryParams)
    tableData.value = list
    total.value = totalCount
  } catch {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.page = 1
  fetchNoticeList()
}

function handleReset() {
  queryParams.noticeTitle = undefined
  queryParams.createBy = undefined
  queryParams.noticeType = undefined
  queryParams.page = 1
  queryParams.pageSize = 10
  fetchNoticeList()
}

async function handleDelete(row: NoticeVo) {
  try {
    await noticeApi.deleteNotice(row.id)
    ElMessage.success('删除成功')
    fetchNoticeList()
  } catch {
    // 错误已由请求拦截器统一提示
  }
}

// ==================== 新增/编辑弹窗 ====================

const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive<CreateNoticeParams & { id?: number }>({
  id: undefined,
  noticeTitle: '',
  noticeType: '1',
  noticeContent: '',
  status: '0',
})

const formRules: FormRules = {
  noticeTitle: [
    { required: true, message: '请输入通知标题', trigger: 'blur' },
    { max: 50, message: '通知标题长度不能超过 50 个字符', trigger: 'blur' },
  ],
  noticeType: [{ required: true, message: '请选择通知类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function handleCreate() {
  dialogType.value = 'create'
  resetForm()
  dialogVisible.value = true
}

async function handleEdit(row: NoticeVo) {
  dialogType.value = 'edit'
  resetForm()
  try {
    const detail = await noticeApi.getNoticeDetail(row.id)
    Object.assign(formData, {
      id: detail.id,
      noticeTitle: detail.noticeTitle,
      noticeType: detail.noticeType,
      noticeContent: detail.noticeContent,
      status: detail.status,
    })
  } catch {
    return
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      if (dialogType.value === 'create') {
        await noticeApi.createNotice({
          noticeTitle: formData.noticeTitle,
          noticeType: formData.noticeType,
          noticeContent: formData.noticeContent,
          status: formData.status,
        })
        ElMessage.success('新增成功')
      } else {
        await noticeApi.updateNotice(formData.id!, {
          noticeTitle: formData.noticeTitle,
          noticeType: formData.noticeType,
          noticeContent: formData.noticeContent,
          status: formData.status,
        })
        ElMessage.success('修改成功')
      }
      dialogVisible.value = false
      fetchNoticeList()
    } catch {
      // 错误已由请求拦截器统一提示
    } finally {
      submitLoading.value = false
    }
  })
}

function resetForm() {
  formData.id = undefined
  formData.noticeTitle = ''
  formData.noticeType = '1'
  formData.noticeContent = ''
  formData.status = '0'
  formRef.value?.clearValidate()
}

function handleDialogClose() {
  formRef.value?.clearValidate()
}

// ==================== 详情弹窗 ====================

const viewVisible = ref(false)
const viewData = ref<NoticeVo>({} as NoticeVo)

async function handleView(row: NoticeVo) {
  try {
    const detail = await noticeApi.getNoticeDetail(row.id)
    viewData.value = detail
  } catch {
    viewData.value = row
  }
  viewVisible.value = true
}

// ==================== 初始化 ====================

onMounted(() => {
  fetchNoticeList()
})
</script>

<style scoped>
.page-container {
  padding: 16px;
}

.table-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.notice-content {
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}
</style>
