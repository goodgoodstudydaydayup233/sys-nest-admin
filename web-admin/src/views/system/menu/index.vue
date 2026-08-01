<template>
  <div class="page-container">
    <!-- 筛选区 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item label="菜单名称">
          <el-input
            v-model="queryParams.menuName"
            placeholder="请输入菜单名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="显示状态">
          <el-select
            v-model="queryParams.visible"
            placeholder="请选择显示状态"
            clearable
            style="width: 200px"
          >
            <el-option label="显示" value="0" />
            <el-option label="隐藏" value="1" />
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
          v-permissions="'system:menu:add'"
          @click="handleCreate(0)"
          >新增</el-button
        >
        <el-button type="info" plain :icon="Sort" @click="toggleExpandAll">展开/折叠</el-button>
      </div>
      <el-button :icon="Refresh" circle @click="fetchMenuList" />
    </div>

    <!-- 表格区 -->
    <el-table
      ref="tableRef"
      v-if="refreshTable"
      v-loading="loading"
      :data="tableData"
      row-key="id"
      :tree-props="{ children: 'children' }"
      :default-expand-all="isExpandAll"
      :header-cell-style="{ textAlign: 'left' }"
    >
      <el-table-column prop="menuName" label="菜单名称" min-width="160" />
      <el-table-column label="图标" width="80" align="center">
        <template #default="{ row }">
          <el-icon v-if="row.icon && ElementPlusIcons[row.icon as keyof typeof ElementPlusIcons]">
            <component :is="ElementPlusIcons[row.icon as keyof typeof ElementPlusIcons]" />
          </el-icon>
          <span v-else class="text-placeholder">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="orderNum" label="排序" width="80" align="center" />
      <el-table-column prop="perms" label="权限标识" min-width="180" show-overflow-tooltip />
      <el-table-column prop="component" label="组件路径" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.visible === '0' ? 'success' : 'danger'" effect="light">
            {{ row.visible === '0' ? '显示' : '隐藏' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160" align="center">
        <template #default="{ row }">
          <span>{{ row.createdAt || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            :icon="Edit"
            v-permissions="'system:menu:edit'"
            @click="handleEdit(row)"
            >修改</el-button
          >
          <el-button
            v-if="row.menuType !== 'F'"
            type="primary"
            link
            :icon="Plus"
            v-permissions="'system:menu:add'"
            @click="handleCreate(row.id)"
          >
            新增
          </el-button>
          <el-popconfirm
            title="确定删除该菜单吗？"
            confirm-button-text="确定"
            cancel-button-text="取消"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button type="danger" link :icon="Delete" v-permissions="'system:menu:delete'"
                >删除</el-button
              >
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增菜单' : '编辑菜单'"
      width="680px"
      :close-on-click-modal="false"
      draggable
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-row :gutter="0">
          <el-col :span="24">
            <el-form-item label="上级菜单">
              <el-tree-select
                v-model="formData.parentId"
                :data="menuTreeOptions"
                :props="{ label: 'menuName', value: 'id', children: 'children' }"
                placeholder="选择上级菜单"
                check-strictly
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="菜单类型" prop="menuType">
              <el-radio-group v-model="formData.menuType">
                <el-radio value="M">目录</el-radio>
                <el-radio value="C">菜单</el-radio>
                <el-radio value="F">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="formData.menuType !== 'F'">
            <el-form-item label="菜单图标" prop="icon">
              <el-popover
                v-model:visible="iconPopoverVisible"
                placement="bottom-start"
                :width="540"
                trigger="click"
              >
                <template #reference>
                  <el-input v-model="formData.icon" placeholder="点击选择图标" readonly>
                    <template #prefix>
                      <el-icon
                        v-if="
                          formData.icon &&
                          ElementPlusIcons[formData.icon as keyof typeof ElementPlusIcons]
                        "
                        class="el-input__icon"
                      >
                        <component
                          :is="ElementPlusIcons[formData.icon as keyof typeof ElementPlusIcons]"
                        />
                      </el-icon>
                      <el-icon v-else class="el-input__icon"><Search /></el-icon>
                    </template>
                  </el-input>
                </template>
                <div class="icon-selector">
                  <el-input
                    v-model="iconSearchKey"
                    placeholder="搜索图标"
                    clearable
                    class="icon-search"
                  />
                  <el-scrollbar height="220px">
                    <div class="icon-list">
                      <div
                        v-for="name in filteredIconNames"
                        :key="name"
                        class="icon-item"
                        :class="{ 'is-active': formData.icon === name }"
                        @click="handleSelectIcon(name)"
                      >
                        <el-icon :size="18">
                          <component
                            :is="ElementPlusIcons[name as keyof typeof ElementPlusIcons]"
                          />
                        </el-icon>
                        <span class="icon-name">{{ name }}</span>
                      </div>
                      <el-empty
                        v-if="!filteredIconNames.length"
                        :image-size="48"
                        description="无匹配图标"
                      />
                    </div>
                  </el-scrollbar>
                </div>
              </el-popover>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="menuName">
              <el-input v-model="formData.menuName" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum">
              <el-input-number
                v-model="formData.orderNum"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.menuType !== 'F'">
            <el-form-item>
              <template #label>
                <span>
                  <el-tooltip content="选择是外链则路由地址需要以`http(s)://`开头" placement="top">
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                  是否外链
                </span>
              </template>
              <el-radio-group v-model="formData.isFrame">
                <el-radio value="0">是</el-radio>
                <el-radio value="1">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.menuType !== 'F'">
            <el-form-item prop="path">
              <template #label>
                <span>
                  <el-tooltip
                    content="访问的路由地址，如：`user`，如外网地址需内链访问则以`http(s)://`开头"
                    placement="top"
                  >
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                  路由地址
                </span>
              </template>
              <el-input v-model="formData.path" placeholder="请输入路由地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.menuType === 'C' && formData.isFrame !== '0'">
            <el-form-item prop="component">
              <template #label>
                <span>
                  <el-tooltip
                    content="访问的组件路径，如：`system/user/index`，默认在`views`目录下"
                    placement="top"
                  >
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                  组件路径
                </span>
              </template>
              <el-input v-model="formData.component" placeholder="请输入组件路径" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.menuType !== 'M'">
            <el-form-item prop="perms">
              <template #label>
                <span>
                  <el-tooltip
                    content="控制器中定义的权限字符，如：`system:user:list`"
                    placement="top"
                  >
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                  权限标识
                </span>
              </template>
              <el-input v-model="formData.perms" placeholder="请输入权限标识" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.menuType === 'C'">
            <el-form-item prop="query">
              <template #label>
                <span>
                  <el-tooltip
                    content='访问路由的默认传递参数，如：`{"id": 1, "name": "ry"}`'
                    placement="top"
                  >
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                  路由参数
                </span>
              </template>
              <el-input v-model="formData.query" placeholder="请输入路由参数" maxlength="255" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.menuType === 'C'">
            <el-form-item>
              <template #label>
                <span>
                  <el-tooltip
                    content="选择是则会被`keep-alive`缓存，需要匹配组件的`name`和地址保持一致"
                    placement="top"
                  >
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                  是否缓存
                </span>
              </template>
              <el-radio-group v-model="formData.isCache">
                <el-radio value="0">缓存</el-radio>
                <el-radio value="1">不缓存</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.menuType !== 'F'">
            <el-form-item>
              <template #label>
                <span>
                  <el-tooltip
                    content="选择隐藏则路由将不会出现在侧边栏，但仍然可以访问"
                    placement="top"
                  >
                    <el-icon><QuestionFilled /></el-icon>
                  </el-tooltip>
                  显示状态
                </span>
              </template>
              <el-radio-group v-model="formData.visible">
                <el-radio value="0">显示</el-radio>
                <el-radio value="1">隐藏</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确 定</el-button>
          <el-button @click="dialogVisible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * MenuManage - 菜单管理页面
 * @description 菜单树形列表查询（筛选 + 树形表格）、新增、编辑、删除
 *
 * @接口说明
 * - GET    /menu              获取菜单列表（平铺，不分页）
 * - GET    /menu/tree         获取菜单树
 * - GET    /menu/{id}         获取菜单详情
 * - POST   /menu              创建菜单
 * - PUT    /menu/{id}         更新菜单
 * - DELETE /menu/{id}         删除菜单
 *
 * @布局说明
 * 上方 → 筛选区（el-card + el-form inline）
 * 中间 → 表格区（el-table 树形表格 + 操作列）
 * 弹窗 → 新增/编辑菜单（el-dialog + el-form 双列布局 + tooltip 提示）
 */

import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { Search, Refresh, Delete, Edit, Plus, Sort, QuestionFilled } from '@element-plus/icons-vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { menuApi } from '@/api/system'
import type {
  MenuVo,
  MenuTreeVo,
  QueryMenuParams,
  CreateMenuParams,
  UpdateMenuParams,
} from '@/api/system'

// ==================== 列表相关 ====================

/** 表格加载状态 */
const loading = ref(false)

/** 表格数据（树形结构） */
const tableData = ref<MenuTreeVo[]>([])

/** 是否默认展开所有行（默认 false，仅展开一级节点以显示二级） */
const isExpandAll = ref(false)

/** 表格显隐控制（展开/折叠时通过此变量强制重新渲染表格） */
const refreshTable = ref(true)

/** 表格实例引用 */
const tableRef = ref()

/** 查询参数（筛选条件，无分页） */
const queryParams = reactive<QueryMenuParams>({
  menuName: undefined,
  visible: undefined,
})

/**
 * 获取菜单列表
 * @description 调用 GET /menu/tree 接口获取树形结构数据。
 * 加载完成后默认展开一级节点（parentId=0），使二级菜单可见，三级及以上保持折叠。
 */
async function fetchMenuList() {
  loading.value = true
  try {
    const tree = await menuApi.getMenuTree()
    tableData.value = tree
    // 默认仅展开一级节点：下一帧逐个调用 toggleRowExpansion 展开每个顶层节点
    nextTick(() => {
      tree.forEach((node) => {
        tableRef.value?.toggleRowExpansion?.(node, true)
      })
    })
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 搜索
 * @description 根据筛选条件过滤菜单树
 */
function handleSearch() {
  fetchMenuList()
}

/**
 * 重置筛选条件
 * @description 清空所有筛选字段，重新查询
 */
function handleReset() {
  queryParams.menuName = undefined
  queryParams.visible = undefined
  fetchMenuList()
}

/**
 * 展开/折叠所有行
 * @description 通过卸载再挂载 el-table 强制刷新树形展开状态。
 * - 切换为展开：使用 default-expand-all 展开全部层级
 * - 切换为折叠：重新渲染表格，不触发默认展开一级的逻辑（保持完全折叠）
 */
function toggleExpandAll() {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => {
    refreshTable.value = true
    // 折叠状态下不自动展开一级；展开状态下 default-expand-all 已生效
    if (!isExpandAll.value) {
      return
    }
  })
}

/**
 * 删除菜单
 * @description 调用 DELETE /menu/{id}，后端返回 code: 200 则成功
 * @param row 当前行菜单数据
 */
async function handleDelete(row: MenuVo) {
  try {
    await menuApi.deleteMenu(row.id)
    ElMessage.success('删除成功')
    fetchMenuList()
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

/** 菜单树选择器数据（用于上级菜单选择） */
const menuTreeOptions = ref<MenuTreeVo[]>([])

/** 弹窗表单数据 */
const formData = reactive<CreateMenuParams & UpdateMenuParams & { id?: number }>({
  id: undefined,
  menuName: '',
  parentId: 0,
  orderNum: 0,
  path: '',
  component: '',
  query: '',
  isFrame: '1',
  isCache: '0',
  visible: '0',
  menuType: 'M',
  perms: '',
  icon: '',
})

/** 表单校验规则 */
const formRules: FormRules = {
  menuName: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 1, max: 50, message: '菜单名称长度为 1 ~ 50 个字符', trigger: 'blur' },
  ],
  menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
  orderNum: [{ required: true, message: '请输入显示排序', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路由地址', trigger: 'blur' }],
}

// ==================== 图标选择器相关 ====================

/** 图标选择弹出层可见状态 */
const iconPopoverVisible = ref(false)

/** 图标搜索关键词 */
const iconSearchKey = ref('')

/** 全部图标名称列表（按字母排序） */
const allIconNames = Object.keys(ElementPlusIcons).sort()

/** 过滤后的图标列表 */
const filteredIconNames = computed(() => {
  const keyword = iconSearchKey.value.trim().toLowerCase()
  if (!keyword) return allIconNames
  return allIconNames.filter((name) => name.toLowerCase().includes(keyword))
})

/**
 * 选择图标
 * @description 将选中的图标名称写入表单并关闭弹出层
 * @param iconName 图标名称
 */
function handleSelectIcon(iconName: string) {
  formData.icon = iconName
  iconPopoverVisible.value = false
  iconSearchKey.value = ''
}

/**
 * 打开新增菜单弹窗
 * @description 重置表单为初始值，设置 parentId，打开弹窗
 * @param parentId 父菜单 ID，0 表示顶级目录
 */
async function handleCreate(parentId: number) {
  dialogType.value = 'create'
  Object.assign(formData, {
    id: undefined,
    menuName: '',
    parentId,
    orderNum: 0,
    path: '',
    component: '',
    query: '',
    isFrame: '1',
    isCache: '0',
    visible: '0',
    menuType: parentId === 0 ? 'M' : 'C',
    perms: '',
    icon: '',
  })
  await loadMenuTreeOptions()
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

/**
 * 打开编辑弹窗
 * @description 先请求菜单详情回填表单，再打开弹窗
 * @param row 当前行菜单数据
 */
async function handleEdit(row: MenuVo) {
  try {
    const detail = await menuApi.getMenuDetail(row.id)
    dialogType.value = 'edit'
    Object.assign(formData, {
      id: detail.id,
      menuName: detail.menuName,
      parentId: detail.parentId,
      orderNum: detail.orderNum,
      path: detail.path ?? '',
      component: detail.component ?? '',
      query: detail.query ?? '',
      isFrame: detail.isFrame,
      isCache: detail.isCache,
      visible: detail.visible,
      menuType: detail.menuType,
      perms: detail.perms ?? '',
      icon: detail.icon ?? '',
    })
    await loadMenuTreeOptions(detail.id)
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  } catch {
    // 错误已由请求拦截器统一提示
  }
}

/**
 * 递归排除指定节点及其所有子节点
 * @description 从树中过滤掉 excludeId 对应的节点及其全部后代
 * @param tree 菜单树
 * @param excludeId 需要排除的节点 ID
 * @returns 过滤后的新树
 */
function excludeTreeNodes(tree: MenuTreeVo[], excludeId: number): MenuTreeVo[] {
  return tree
    .filter((node) => node.id !== excludeId)
    .map((node) => ({
      ...node,
      children: node.children ? excludeTreeNodes(node.children, excludeId) : undefined,
    }))
}

/**
 * 加载菜单树选择器数据
 * @description 获取菜单树用于上级菜单选择，编辑时排除当前节点及其子节点
 * @param excludeId 编辑时需排除的节点 ID（避免将自身设为自己的子菜单）
 */
async function loadMenuTreeOptions(excludeId?: number) {
  try {
    const tree = await menuApi.getMenuTree()
    const filtered = excludeId ? excludeTreeNodes(tree, excludeId) : tree
    const rootOption: MenuTreeVo = {
      id: 0,
      menuName: '顶级菜单',
      parentId: 0,
      orderNum: 0,
      isFrame: '1',
      isCache: '0',
      visible: '0',
      menuType: 'M',
      createdAt: '',
      updatedAt: '',
      children: filtered,
    }
    menuTreeOptions.value = [rootOption]
  } catch {
    menuTreeOptions.value = []
  }
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
      await menuApi.createMenu(formData as CreateMenuParams)
      ElMessage.success('创建成功')
    } else {
      const { id, ...updateData } = formData
      if (!id) return
      await menuApi.updateMenu(id, updateData)
      ElMessage.success('修改成功')
    }
    dialogVisible.value = false
    fetchMenuList()
  } catch {
    // 错误已由请求拦截器统一提示
  } finally {
    submitLoading.value = false
  }
}

/**
 * 弹窗关闭回调
 * @description 重置表单数据和校验状态
 */
function handleDialogClose() {
  formRef.value?.resetFields()
  Object.assign(formData, {
    id: undefined,
    menuName: '',
    parentId: 0,
    orderNum: 0,
    path: '',
    component: '',
    query: '',
    isFrame: '1',
    isCache: '0',
    visible: '0',
    menuType: 'M',
    perms: '',
    icon: '',
  })
  iconPopoverVisible.value = false
  iconSearchKey.value = ''
}

/** 页面挂载后自动加载列表 */
onMounted(() => {
  fetchMenuList()
})
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

.text-placeholder {
  color: var(--el-text-color-placeholder);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.icon-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-search {
  width: 100%;
}

.icon-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.icon-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 0;
}

.icon-item:hover {
  background-color: var(--el-fill-color-light);
}

.icon-item.is-active {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.icon-name {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
</style>
