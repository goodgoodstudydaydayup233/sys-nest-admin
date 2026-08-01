<template>
  <div class="page-container">
    <!-- 筛选区 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item label="角色名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入角色名称"
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
          v-permissions="'system:role:add'"
          @click="handleCreate"
          >新增</el-button
        >
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="!selectedRows.length"
          v-permissions="'system:role:delList'"
          @click="handleBatchDelete"
        >
          删除
        </el-button>
      </div>
      <el-button :icon="Refresh" circle @click="fetchRoleList" />
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
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="角色名称" min-width="120" show-overflow-tooltip />
      <el-table-column prop="code" label="角色编码" min-width="120" show-overflow-tooltip />
      <el-table-column prop="permission" label="权限标识" min-width="140" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '1' ? 'success' : 'danger'" effect="light">
            {{ row.status === '1' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="80" align="center" />

      <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            :icon="Edit"
            v-permissions="'system:role:edit'"
            @click="handleEdit(row)"
            >编辑</el-button
          >
          <el-popconfirm
            title="确定删除该角色吗？"
            confirm-button-text="确定"
            cancel-button-text="取消"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button type="danger" link :icon="Delete" v-permissions="'system:role:delete'"
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
        @size-change="fetchRoleList"
        @current-change="fetchRoleList"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增角色' : '编辑角色'"
      width="560px"
      :close-on-click-modal="false"
      draggable
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="权限标识" prop="permission">
          <el-input v-model="formData.permission" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio value="1">启用</el-radio>
            <el-radio value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="菜单权限">
          <div class="menu-tree-actions">
            <el-checkbox v-model="menuExpand" @change="handleMenuExpand">展开/折叠</el-checkbox>
            <el-checkbox v-model="menuNodeAll" @change="handleMenuCheckAll"
              >全选/全不选</el-checkbox
            >
          </div>
          <el-tree
            ref="menuTreeRef"
            class="menu-tree"
            :data="menuTreeData"
            show-checkbox
            node-key="id"
            :default-expand-all="menuExpand"
            :props="{ label: 'menuName', children: 'children' }"
            empty-text="加载中，请稍候"
          />
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
  </div>
</template>

<script setup lang="ts">
/**
 * RoleManage - 角色管理页面
 * @description 角色列表查询（筛选 + 表格 + 分页）、新增、编辑、删除、删除
 *
 * @接口说明
 * - GET    /role              获取角色列表（分页 + 筛选）
 * - GET    /role/{id}         获取角色详情
 * - POST   /role              创建角色
 * - PUT    /role/{id}         更新角色
 * - DELETE /role/{id}         删除角色
 * - DELETE /role/batch        删除角色
 *
 * @布局说明
 * 上方 → 筛选区（el-card + el-form inline）
 * 中间 → 表格区（el-table + 操作列）
 * 下方 → 分页区（el-pagination）
 * 弹窗 → 新增/编辑角色（el-dialog + el-form）
 */

import { ref, reactive, onMounted, nextTick } from 'vue'
import { Search, Refresh, Delete, Edit, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type ElTree from 'element-plus/es/components/tree'
import { roleApi, menuApi } from '@/api/system'
import type {
  RoleVo,
  QueryRoleParams,
  CreateRoleParams,
  UpdateRoleParams,
  MenuTreeVo,
} from '@/api/system'

// ==================== 列表相关 ====================

/** 表格加载状态 */
const loading = ref(false)

/** 表格数据 */
const tableData = ref<RoleVo[]>([])

/** 总记录数 */
const total = ref(0)

/** 查询参数（筛选条件 + 分页） */
const queryParams = reactive<QueryRoleParams>({
  page: 1,
  pageSize: 10,
  name: undefined,
  status: undefined,
})

/**
 * 获取角色列表
 * @description 调用 GET /role 接口，后端自动解包 data 中的 { list, total }
 */
async function fetchRoleList() {
  loading.value = true
  try {
    const { list, total: totalCount } = await roleApi.getRoleList(queryParams)
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
  fetchRoleList()
}

/**
 * 重置筛选条件
 * @description 清空所有筛选字段，页码回到第一页，重新查询
 */
function handleReset() {
  queryParams.name = undefined
  queryParams.status = undefined
  queryParams.page = 1
  queryParams.pageSize = 10
  fetchRoleList()
}

/**
 * 删除角色
 * @description 调用 DELETE /role/{id}，后端返回 code: 200 则成功
 * @param row 当前行角色数据
 */
async function handleDelete(row: RoleVo) {
  try {
    await roleApi.deleteRole(row.id)
    ElMessage.success('删除成功')
    fetchRoleList()
  } catch {
    // 错误已由请求拦截器统一提示
  }
}

// ==================== 多选相关 ====================

/** 已勾选的行数据 */
const selectedRows = ref<RoleVo[]>([])

/**
 * 表格勾选变更回调
 * @description el-table @selection-change 事件触发
 * @param rows 当前已勾选的行数组
 */
function handleSelectionChange(rows: RoleVo[]) {
  selectedRows.value = rows
}

/**
 * 删除角色
 * @description 调用 DELETE /role/batch，后端返回 code: 200 则成功
 */
async function handleBatchDelete() {
  const ids = selectedRows.value.map((row) => Number(row.id))
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个角色吗？`, '删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  try {
    await roleApi.batchDeleteRoles(ids)
    ElMessage.success('删除成功')
    selectedRows.value = []
    fetchRoleList()
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

/** 菜单树选择器实例引用 */
const menuTreeRef = ref<InstanceType<typeof ElTree>>()

/** 菜单树数据（弹窗内使用） */
const menuTreeData = ref<MenuTreeVo[]>([])

/** 菜单树是否展开所有节点 */
const menuExpand = ref(false)

/** 菜单树是否全选 */
const menuNodeAll = ref(false)

/** 弹窗表单数据 */
const formData = reactive<CreateRoleParams & UpdateRoleParams & { id?: number }>({
  id: undefined,
  name: '',
  code: '',
  permission: '',
  status: '1',
  sort: 0,
  remark: '',
  menuIds: [],
})

/** 表单校验规则 */
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度为 2 ~ 50 个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { min: 2, max: 50, message: '角色编码长度为 2 ~ 50 个字符', trigger: 'blur' },
  ],
}

// ==================== 菜单树操作 ====================

/**
 * 获取菜单树
 * @description 弹窗打开时加载完整菜单树（新增场景）
 */
async function loadMenuTree() {
  try {
    menuTreeData.value = await menuApi.getMenuTree()
  } catch {
    menuTreeData.value = []
  }
}

/**
 * 获取角色菜单树（含已勾选状态）
 * @description 弹窗打开时加载菜单树并回显当前角色的勾选状态（编辑场景）
 */
async function loadRoleMenuTree(roleId: number) {
  try {
    const { menus, checkedKeys } = await menuApi.getRoleMenuTreeselect(roleId)
    menuTreeData.value = menus
    nextTick(() => {
      if (!menuTreeRef.value) return
      menuTreeRef.value!.setCheckedKeys([], false)
      checkedKeys.forEach((id) => {
        menuTreeRef.value!.setChecked(id, true, false)
      })
    })
  } catch {
    menuTreeData.value = []
  }
}

/**
 * 获取菜单树所有已勾选的 key（含半选父节点）
 * @returns 去重后的菜单 ID 数组
 */
function getMenuAllCheckedKeys(): number[] {
  if (!menuTreeRef.value) return []
  const checkedKeys = menuTreeRef.value!.getCheckedKeys(false) as number[]
  const halfCheckedKeys = menuTreeRef.value!.getHalfCheckedKeys() as number[]
  return [...new Set([...halfCheckedKeys, ...checkedKeys])]
}

/**
 * 展开/折叠菜单树
 * @param expand 是否展开
 */
function handleMenuExpand(expand: boolean) {
  if (!menuTreeRef.value) return
  const treeStore = menuTreeRef.value!.store
  for (const key in treeStore.nodesMap) {
    const node = treeStore.nodesMap[key]
    if (node) node.expanded = expand
  }
}

/**
 * 全选/全不选菜单树
 * @param checked 是否全选
 */
function handleMenuCheckAll(checked: boolean) {
  if (!menuTreeRef.value) return
  const keys = checked ? menuTreeData.value.map((node) => node.id) : []
  menuTreeRef.value!.setCheckedKeys(keys)
}

/**
 * 打开新增角色弹窗
 * @description 重置表单为初始值后加载菜单树并打开弹窗
 */
async function handleCreate() {
  dialogType.value = 'create'
  Object.assign(formData, {
    id: undefined,
    name: '',
    code: '',
    permission: '',
    status: '1',
    sort: 0,
    remark: '',
    menuIds: [],
  })
  menuExpand.value = false
  menuNodeAll.value = false
  menuTreeData.value = []
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
  await loadMenuTree()
}

/**
 * 打开编辑弹窗
 * @description 先请求角色详情回填表单，再加载菜单树并回显勾选状态，最后打开弹窗
 * @param row 当前行角色数据
 */
async function handleEdit(row: RoleVo) {
  try {
    const detail = await roleApi.getRoleDetail(row.id)
    dialogType.value = 'edit'
    Object.assign(formData, {
      id: detail.id,
      name: detail.name,
      code: detail.code,
      permission: detail.permission ?? '',
      status: detail.status,
      sort: detail.sort ?? 0,
      remark: detail.remark ?? '',
      menuIds: detail.menus?.map((m) => m.id) ?? [],
    })
    menuExpand.value = false
    menuNodeAll.value = false
    menuTreeData.value = []
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
    await loadRoleMenuTree(detail.id)
  } catch {
    // 错误已由请求拦截器统一提示
  }
}

/**
 * 提交表单（新增/编辑）
 * @description 校验通过后收集菜单树勾选数据，根据弹窗类型调用对应接口，成功后刷新列表
 */
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  formData.menuIds = getMenuAllCheckedKeys()
  submitLoading.value = true
  try {
    if (dialogType.value === 'create') {
      await roleApi.createRole(formData as CreateRoleParams)
      ElMessage.success('创建成功')
    } else {
      const { id, ...updateData } = formData
      if (!id) return
      await roleApi.updateRole(id, updateData)
      ElMessage.success('修改成功')
    }
    dialogVisible.value = false
    fetchRoleList()
  } catch {
    // 错误已由请求拦截器统一提示
  } finally {
    submitLoading.value = false
  }
}

/**
 * 弹窗关闭回调
 * @description 重置表单数据、校验状态、菜单树状态
 */
function handleDialogClose() {
  formRef.value?.resetFields()
  Object.assign(formData, {
    id: undefined,
    name: '',
    code: '',
    permission: '',
    status: '1',
    sort: 0,
    remark: '',
    menuIds: [],
  })
  menuExpand.value = false
  menuNodeAll.value = false
  menuTreeData.value = []
}

/** 页面挂载后自动加载列表 */
onMounted(() => {
  fetchRoleList()
})
</script>

<style lang="css" scoped>
.page-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-select {
  width: 180px;
}

.table-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-tag + .menu-tag {
  margin-left: 4px;
}

.text-placeholder {
  color: var(--el-text-color-placeholder);
}

.menu-tree-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.menu-tree {
  width: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 8px;
  min-height: 180px;
  max-height: 320px;
  overflow-y: auto;
}
</style>
