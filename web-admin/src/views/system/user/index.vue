<template>
  <div class="page-container">
    <!-- 筛选区 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input
            v-model="queryParams.nickname"
            placeholder="请输入昵称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="queryParams.phone"
            placeholder="请输入手机号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            class="status-select"
            placeholder="请选择状态"
            clearable
          >
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
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
      <div>
        <el-button
          type="primary"
          plain
          :icon="Plus"
          v-permissions="'system:user:add'"
          @click="handleCreate"
          >新增</el-button
        >
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="!selectedRows.length"
          v-permissions="'system:user:delList'"
          @click="handleBatchDelete"
        >
          删除
        </el-button>
      </div>
      <el-button :icon="Refresh" circle @click="fetchUserList" />
    </div>

    <!-- 表格区 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      stripe
      :header-cell-style="{ textAlign: 'center' }"
      :cell-style="{ textAlign: 'center' }"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="50" align="center" :selectable="checkSelectable" />
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
      <el-table-column prop="nickname" label="昵称" min-width="120" show-overflow-tooltip />
      <el-table-column prop="phone" label="手机号" min-width="130" show-overflow-tooltip />
      <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '1' ? 'success' : 'danger'" effect="light">
            {{ row.status === '1' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="性别" width="80" align="center">
        <template #default="{ row }">
          <DictTag :options="sexDictData" :value="row.sex" />
        </template>
      </el-table-column>
      <el-table-column label="角色" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">
          <template v-if="row.roles?.length">
            <el-tag v-for="role in row.roles" :key="role.id" size="small" class="role-tag">
              {{ role.name }}
            </el-tag>
          </template>
          <span v-else class="text-placeholder">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
      <el-table-column label="操作" width="220" align="center" fixed="right">
        <template #default="{ row }">
          <template v-if="isAdmin(row)">
            <el-tag type="danger" effect="dark" size="small">超级管理员</el-tag>
          </template>
          <template v-else>
            <el-button
              type="primary"
              link
              :icon="Edit"
              v-permissions="'system:user:edit'"
              @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-button
              type="warning"
              link
              :icon="Refresh"
              v-permissions="'system:user:resetPassword'"
              @click="handleResetPassword(row)"
              >重置密码</el-button
            >
            <el-popconfirm
              title="确定删除该用户吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row)"
            >
              <template #reference>
                <el-button type="danger" link :icon="Delete" v-permissions="'system:user:delete'"
                  >删除</el-button
                >
              </template>
            </el-popconfirm>
          </template>
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
        @size-change="fetchUserList"
        @current-change="fetchUserList"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增用户' : '编辑用户'"
      width="560px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
      draggable
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :auto-upload="false"
            accept="image/*"
            :on-change="handleAvatarChange"
          >
            <el-image v-if="avatarUrl" :src="avatarUrl" fit="cover" class="avatar-preview" />
            <el-icon v-else class="avatar-placeholder"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="dialogType === 'create'" label="密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码（至少 6 位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="formData.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio value="1">启用</el-radio>
            <el-radio value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <el-radio-group v-model="formData.sex">
            <el-radio v-for="item in sexDictData" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色" prop="roleIds">
          <el-select
            v-model="formData.roleIds"
            multiple
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit"> 确定 </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog
      v-model="resetPwdDialogVisible"
      title="重置密码"
      width="420px"
      :close-on-click-modal="false"
      @close="handleResetPwdDialogClose"
      draggable
    >
      <el-form
        ref="resetPwdFormRef"
        :model="resetPwdForm"
        :rules="resetPwdRules"
        label-width="80px"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPwdForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少 6 位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPwdForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetPwdLoading" @click="handleSubmitResetPwd">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * UserManage - 用户管理页面
 * @description 用户列表查询（筛选 + 表格 + 分页）、新增、编辑、重置密码、删除
 *
 * @接口说明
 * - POST   /user                   创建用户（multipart/form-data）
 * - GET    /user                   获取用户列表（分页 + 筛选）
 * - GET    /user/{id}              获取用户详情
 * - PUT    /user/{id}              修改用户信息
 * - PUT    /user/{id}/resetPassword 重置密码
 * - DELETE /user/{id}              删除用户
 *
 * @布局说明
 * 上方 → 筛选区（el-card + el-form inline + 新增按钮）
 * 中间 → 表格区（el-table + 操作列）
 * 下方 → 分页区（el-pagination）
 * 弹窗 → 新增/编辑用户（el-dialog + el-form + 头像上传）
 */

import { ref, reactive, onMounted, nextTick } from 'vue'
import { Search, Refresh, Delete, Edit, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { userApi, roleApi } from '@/api/system'
import type {
  UserVo,
  QueryUserParams,
  CreateUserParams,
  UpdateUserParams,
  RoleDetailVo,
} from '@/api/system'
import { useDict } from '@/hooks/useDict'
import DictTag from '@/components/DictTag/index.vue'

/** 性别字典（来自字典管理 sys_user_sex） */
const { dictData: sexDictData } = useDict('sys_user_sex')

/** 超级管理员用户名（与后端 config.app.admin 保持一致） */
const SUPER_ADMIN_USERNAME = 'admin'

/**
 * 判断是否为超级管理员
 * @description 超级管理员不可删除、不可禁用、不可修改关键信息（用户名/状态/角色）
 * @param row 用户行数据
 * @returns true-是超级管理员
 */
function isAdmin(row: UserVo): boolean {
  return row.username === SUPER_ADMIN_USERNAME
}

/**
 * 表格行是否可勾选
 * @description 超级管理员行禁用勾选，避免误删
 * @param row 用户行数据
 * @returns true-可勾选 false-禁用勾选
 */
function checkSelectable(row: UserVo): boolean {
  return !isAdmin(row)
}

// ==================== 列表相关 ====================

/** 表格加载状态 */
const loading = ref(false)

/** 表格数据 */
const tableData = ref<UserVo[]>([])

/** 总记录数 */
const total = ref(0)

/** 查询参数（筛选条件 + 分页） */
const queryParams = reactive<QueryUserParams>({
  page: 1,
  pageSize: 10,
  username: undefined,
  nickname: undefined,
  phone: undefined,
  status: undefined,
})

/**
 * 获取用户列表
 * @description 调用 GET /user 接口，后端自动解包 data 中的 { list, total }
 */
async function fetchUserList() {
  loading.value = true
  try {
    const { list, total: totalCount } = await userApi.getUserList(queryParams)
    tableData.value = list
    total.value = totalCount
    selectedRows.value = []
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
  fetchUserList()
}

/**
 * 重置筛选条件
 * @description 清空所有筛选字段，页码回到第一页，重新查询
 */
function handleReset() {
  queryParams.username = undefined
  queryParams.nickname = undefined
  queryParams.phone = undefined
  queryParams.status = undefined
  queryParams.page = 1
  queryParams.pageSize = 10
  fetchUserList()
}

/**
 * 删除用户
 * @description 调用 DELETE /user/{id}，后端返回 code: 200 则成功
 * @param row 当前行用户数据
 */
async function handleDelete(row: UserVo) {
  try {
    await userApi.deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchUserList()
  } catch {
    // 错误已由请求拦截器统一提示
  }
}

// ==================== 多选相关 ====================

/** 已勾选的行数据 */
const selectedRows = ref<UserVo[]>([])

/**
 * 表格勾选变更回调
 * @description el-table @selection-change 事件触发
 * @param rows 当前已勾选的行数组
 */
function handleSelectionChange(rows: UserVo[]) {
  selectedRows.value = rows
}

/**
 * 删除用户
 * @description 调用 DELETE /user/batch，后端返回 code: 200 则成功
 */
async function handleBatchDelete() {
  const ids = selectedRows.value.map((row) => row.id)
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个用户吗？`, '删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await userApi.batchDeleteUsers(ids)
    ElMessage.success('删除成功')
    selectedRows.value = []
    fetchUserList()
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

/** 角色选项列表（用于角色下拉选择） */
const roleOptions = ref<RoleDetailVo[]>([])

/** 弹窗表单数据 */
const formData = reactive<CreateUserParams & UpdateUserParams & { id?: number }>({
  id: undefined,
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  status: '1',
  sex: '3',
  remark: '',
  roleIds: [],
  avatarFile: undefined,
})

/** 头像预览 URL（当前头像或本地预览） */
const avatarUrl = ref('')

/** 表单校验规则 */
const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 32, message: '用户名长度为 2 ~ 32 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 位', trigger: 'blur' },
  ],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
}

/**
 * 加载角色选项
 * @description 获取全部角色供下拉选择
 */
async function loadRoleOptions() {
  try {
    roleOptions.value = await roleApi.getAllRoles()
  } catch {
    roleOptions.value = []
  }
}

/**
 * 头像文件变更回调
 * @description 本地预览并暂存 File 对象，提交时一起上传
 * @param uploadFile el-upload 回调的文件对象
 */
function handleAvatarChange(uploadFile: UploadFile) {
  if (uploadFile.raw) {
    formData.avatarFile = uploadFile.raw
    avatarUrl.value = URL.createObjectURL(uploadFile.raw)
  }
}

/**
 * 打开编辑弹窗
 * @description 先请求用户详情回填表单，再打开弹窗
 * @param row 当前行用户数据
 */
async function handleEdit(row: UserVo) {
  try {
    const [detail] = await Promise.all([userApi.getUserDetail(row.id), loadRoleOptions()])
    dialogType.value = 'edit'
    Object.assign(formData, {
      id: detail.id,
      username: detail.username,
      password: '',
      nickname: detail.nickname ?? '',
      email: detail.email ?? '',
      phone: detail.phone ?? '',
      status: detail.status,
      sex: detail.sex ?? '3',
      remark: detail.remark ?? '',
      roleIds: detail.roles?.map((r) => Number(r.id)) ?? [],
      avatarFile: undefined,
    })
    avatarUrl.value = detail.avatar ?? ''
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  } catch {
    // 错误已由请求拦截器统一提示
  }
}

/**
 * 打开新增用户弹窗
 * @description 重置表单为初始值后打开弹窗
 */
async function handleCreate() {
  dialogType.value = 'create'
  Object.assign(formData, {
    id: undefined,
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
    status: '1',
    sex: '3',
    remark: '',
    roleIds: [],
    avatarFile: undefined,
  })
  avatarUrl.value = ''
  await loadRoleOptions()
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

/**
 * 提交表单（新增/编辑）
 * @description 校验通过后根据弹窗类型调用对应接口，成功后刷新列表
 */
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    if (dialogType.value === 'create') {
      await userApi.createUser(formData as CreateUserParams)
      ElMessage.success('创建成功')
    } else {
      const { id, ...updateData } = formData
      if (!id) return
      await userApi.updateUser(id, updateData)
      ElMessage.success('修改成功')
    }
    dialogVisible.value = false
    fetchUserList()
  } catch {
    // 错误已由请求拦截器统一提示
  } finally {
    submitLoading.value = false
  }
}

// ==================== 重置密码相关 ====================

/** 重置密码弹窗可见状态 */
const resetPwdDialogVisible = ref(false)

/** 重置密码提交 loading */
const resetPwdLoading = ref(false)

/** 重置密码表单实例引用 */
const resetPwdFormRef = ref<FormInstance>()

/** 当前正在重置密码的用户 ID */
const resetPwdUserId = ref<number>()

/** 重置密码表单数据 */
const resetPwdForm = reactive({
  newPassword: '',
  confirmPassword: '',
})

/** 确认密码校验器 */
function validateConfirmPassword(_rule: unknown, value: string, callback: (error?: Error) => void) {
  if (value !== resetPwdForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

/** 重置密码表单校验规则 */
const resetPwdRules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

/**
 * 打开重置密码弹窗
 * @description 记录用户 ID 并打开弹窗
 * @param row 当前行用户数据
 */
function handleResetPassword(row: UserVo) {
  resetPwdUserId.value = row.id
  resetPwdForm.newPassword = ''
  resetPwdForm.confirmPassword = ''
  resetPwdDialogVisible.value = true
  nextTick(() => resetPwdFormRef.value?.clearValidate())
}

/**
 * 提交重置密码
 * @description 校验通过后调用重置密码接口
 */
async function handleSubmitResetPwd() {
  const valid = await resetPwdFormRef.value?.validate().catch(() => false)
  if (!valid) return

  if (!resetPwdUserId.value) return
  resetPwdLoading.value = true
  try {
    await userApi.resetPassword(resetPwdUserId.value, resetPwdForm.newPassword)
    ElMessage.success('密码重置成功')
    resetPwdDialogVisible.value = false
  } catch {
    // 错误已由请求拦截器统一提示
  } finally {
    resetPwdLoading.value = false
  }
}

/**
 * 重置密码弹窗关闭回调
 */
function handleResetPwdDialogClose() {
  resetPwdFormRef.value?.resetFields()
  resetPwdUserId.value = undefined
}

/**
 * 弹窗关闭回调
 * @description 重置表单数据和校验状态
 */
function handleDialogClose() {
  formRef.value?.resetFields()
  Object.assign(formData, {
    id: undefined,
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
    status: '1',
    sex: '3',
    remark: '',
    roleIds: [],
    avatarFile: undefined,
  })
  avatarUrl.value = ''
}

/** 页面挂载后自动加载列表 */
onMounted(() => {
  fetchUserList()
})
</script>

<style lang="css" scoped>
.page-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-bar {
  padding-bottom: 0;
}

.status-select {
  width: 180px;
}

.table-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.role-tag + .role-tag {
  margin-left: 4px;
}

.text-placeholder {
  color: var(--el-text-color-placeholder);
}

.avatar-uploader :deep(.el-upload) {
  width: 80px;
  height: 80px;
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: var(--el-color-primary);
}

.avatar-preview {
  width: 80px;
  height: 80px;
}

.avatar-placeholder {
  font-size: 24px;
  color: var(--el-text-color-placeholder);
}
</style>
