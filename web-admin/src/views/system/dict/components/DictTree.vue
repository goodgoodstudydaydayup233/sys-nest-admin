<template>
  <div class="dict-tree">
    <!-- 头部操作栏 -->
    <div class="tree-header">
      <span class="tree-title">字典导航</span>
      <div class="header-actions">
        <el-tooltip content="刷新字典缓存" placement="bottom">
          <el-button
            v-permissions="'system:dictType:edit'"
            :icon="Refresh"
            size="small"
            circle
            :loading="refreshLoading"
            @click="handleRefreshCache"
          />
        </el-tooltip>
        <el-dropdown trigger="click" @command="handleCommand">
          <el-button :icon="Plus" size="small" circle />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="addGroup" v-permissions="'system:fieldGroup:add'"
                >新增分组</el-dropdown-item
              >
              <el-dropdown-item command="addType" v-permissions="'system:dictType:add'"
                >新增类型</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 分组折叠面板 -->
    <div class="group-list">
      <!-- 未分组的类型（与分组同级，平铺在顶部，按 sort 排序） -->
      <div
        v-for="type in ungroupedTypes"
        :key="`type-${type.id}`"
        class="type-item top-level"
        :class="{ active: selectedTypeId === Number(type.id) }"
        @click="handleTypeClick(type)"
      >
        <Document class="type-icon" />
        <span class="type-label">{{ type.name }}</span>
        <span class="type-code">{{ type.type }}</span>
        <el-dropdown
          trigger="click"
          @command="(cmd: string) => handleTypeCommand(cmd, type)"
          @click.stop
        >
          <span class="action-btn"><MoreFilled /></span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit" v-permissions="'system:dictType:edit'"
                >编辑</el-dropdown-item
              >
              <el-dropdown-item command="delete" v-permissions="'system:dictType:delete'"
                >删除</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div v-for="group in groupList" :key="group.id" class="group-item">
        <div
          class="group-header"
          :class="{ expanded: expandedGroups.includes(String(group.id)) }"
          @click="toggleGroup(group.id)"
        >
          <ArrowRight class="arrow-icon" />
          <FolderOpened class="group-icon" />
          <span class="group-name">{{ group.name }}</span>
          <span class="group-count">{{ getTypeCountByGroup(group.id) }}</span>
          <el-dropdown
            trigger="click"
            @command="(cmd: string) => handleGroupCommand(cmd, group)"
            @click.stop
          >
            <span class="action-btn"><MoreFilled /></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit" v-permissions="'system:fieldGroup:edit'"
                  >编辑</el-dropdown-item
                >
                <el-dropdown-item command="delete" v-permissions="'system:fieldGroup:delete'"
                  >删除</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <transition name="slide">
          <div v-show="expandedGroups.includes(String(group.id))" class="type-list">
            <div
              v-for="type in getTypesByGroup(group.id)"
              :key="type.id"
              class="type-item"
              :class="{ active: selectedTypeId === Number(type.id) }"
              @click="handleTypeClick(type)"
            >
              <Document class="type-icon" />
              <span class="type-label">{{ type.name }}</span>
              <span class="type-code">{{ type.type }}</span>
              <el-dropdown
                trigger="click"
                @command="(cmd: string) => handleTypeCommand(cmd, type)"
                @click.stop
              >
                <span class="action-btn"><MoreFilled /></span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit" v-permissions="'system:dictType:edit'"
                      >编辑</el-dropdown-item
                    >
                    <el-dropdown-item command="delete" v-permissions="'system:dictType:delete'"
                      >删除</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 新增/编辑分组弹窗 -->
    <el-dialog
      v-model="groupDialogVisible"
      :title="groupDialogType === 'create' ? '新增字段分组' : '编辑字段分组'"
      width="480px"
      :close-on-click-modal="false"
      append-to-body
      draggable
      @close="resetGroupForm"
    >
      <el-form ref="groupFormRef" :model="groupForm" :rules="groupRules" label-width="80px">
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称" maxlength="30" />
        </el-form-item>
        <el-form-item label="分组编码" prop="code">
          <el-input
            v-model="groupForm.code"
            placeholder="请输入分组编码（如 base）"
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="groupForm.sort"
            :min="0"
            :max="9999"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="groupForm.status">
            <el-radio value="1">启用</el-radio>
            <el-radio value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="groupForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
            maxlength="200"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="groupDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="groupSubmitLoading" @click="submitGroupForm"
          >确 定</el-button
        >
      </template>
    </el-dialog>

    <!-- 新增/编辑类型弹窗 -->
    <el-dialog
      v-model="typeDialogVisible"
      :title="typeDialogType === 'create' ? '新增字典类型' : '编辑字典类型'"
      width="520px"
      :close-on-click-modal="false"
      append-to-body
      draggable
      @close="resetTypeForm"
    >
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="90px">
        <el-form-item label="字典名称" prop="name">
          <el-input v-model="typeForm.name" placeholder="请输入字典名称" maxlength="30" />
        </el-form-item>
        <el-form-item label="字典类型" prop="type">
          <el-input
            v-model="typeForm.type"
            placeholder="请输入字典类型标识（如 sex）"
            maxlength="50"
          />
        </el-form-item>
        <el-form-item label="所属分组" prop="groupId">
          <el-select
            v-model="typeForm.groupId"
            placeholder="请选择所属分组"
            clearable
            style="width: 100%"
          >
            <el-option v-for="g in groupList" :key="g.id" :label="g.name" :value="Number(g.id)" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="typeForm.sort"
            :min="0"
            :max="9999"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="typeForm.status">
            <el-radio value="1">启用</el-radio>
            <el-radio value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="typeForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
            maxlength="200"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="typeSubmitLoading" @click="submitTypeForm"
          >确 定</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * DictTree - 字典左侧导航树组件
 * @description 折叠式分组面板，每个分组下展示所属字典类型列表，点击类型触发选中事件
 *
 * @example
 * ```vue
 * <DictTree @select="(typeInfo) => { ... }" />
 * ```
 */
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Plus,
  FolderOpened,
  Document,
  MoreFilled,
  ArrowRight,
  Refresh,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { dictTypeApi, fieldGroupApi } from '@/api/system'
import type {
  DictTypeVo,
  FieldGroupVo,
  CreateDictTypeParams,
  CreateFieldGroupParams,
} from '@/api/system'
import { clearDictCache } from '@/hooks/useDict'

const emit = defineEmits<{
  /** 选中某个字典类型，传出完整类型信息 */
  select: [typeInfo: DictTypeVo]
}>()

// ========== 数据加载 ==========
const groupList = ref<FieldGroupVo[]>([])
const allTypes = ref<DictTypeVo[]>([])
const selectedTypeId = ref<number | string>()
const expandedGroups = ref<string[]>([])

/** 未分组的类型 */
const ungroupedTypes = computed(() => allTypes.value.filter((t) => !t.groupId))

/** 根据分组 ID 获取该分组下类型 */
function getTypesByGroup(groupId: number | string): DictTypeVo[] {
  return allTypes.value.filter((t) => t.groupId === groupId)
}

/** 获取某分组下类型数量 */
function getTypeCountByGroup(groupId: number | string): number {
  return getTypesByGroup(groupId).length
}

// ========== 分组折叠 ==========
function toggleGroup(groupId: number | string) {
  const key = String(groupId)
  const idx = expandedGroups.value.indexOf(key)
  if (idx > -1) {
    expandedGroups.value.splice(idx, 1)
  } else {
    expandedGroups.value.push(key)
  }
}

// ========== 点击事件 ==========
function handleTypeClick(type: DictTypeVo) {
  selectedTypeId.value = Number(type.id)
  emit('select', type)
}

// ========== 头部下拉命令 ==========
function handleCommand(command: string) {
  if (command === 'addGroup') openGroupDialog('create')
  if (command === 'addType') openTypeDialog('create')
}

// ========== 刷新缓存 ==========
const refreshLoading = ref(false)

async function handleRefreshCache() {
  refreshLoading.value = true
  try {
    const res = await dictTypeApi.refreshCache()
    // 同步清除前端内存缓存
    clearDictCache()
    ElMessage.success(`已刷新 ${res.count} 个字典类型缓存`)
  } catch {
  } finally {
    refreshLoading.value = false
  }
}

// ========== 分组操作 ==========
function handleGroupCommand(command: string, group: FieldGroupVo) {
  if (command === 'edit') openGroupDialog('edit', group)
  if (command === 'delete') deleteGroup(group)
}

async function deleteGroup(group: FieldGroupVo) {
  const count = getTypeCountByGroup(group.id)
  await ElMessageBox.confirm(
    count > 0 ? `该分组下有 ${count} 个字典类型，确认删除？` : '确认删除该分组？',
    '删除分组',
    { type: 'warning' },
  )
  await fieldGroupApi.removeFieldGroup(group.id)
  ElMessage.success('删除成功')
  fetchAll()
}

// ========== 类型操作 ==========
function handleTypeCommand(command: string, type: DictTypeVo) {
  if (command === 'edit') openTypeDialog('edit', type)
  if (command === 'delete') deleteType(type)
}

async function deleteType(type: DictTypeVo) {
  await ElMessageBox.confirm('确认删除该字典类型及其所有数据？', '删除类型', { type: 'warning' })
  await dictTypeApi.removeDictType(type.id)
  ElMessage.success('删除成功')
  if (selectedTypeId.value === type.id) {
    selectedTypeId.value = undefined
  }
  fetchAll()
}

// ========== 分组表单 ==========
const groupDialogVisible = ref(false)
const groupDialogType = ref<'create' | 'edit'>('create')
const groupSubmitLoading = ref(false)
const groupFormRef = ref<FormInstance>()
const groupForm = reactive<CreateFieldGroupParams & { id?: number | string }>({
  name: '',
  code: '',
  sort: 0,
  status: '1',
  remark: '',
})
const groupRules: FormRules = {
  name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分组编码', trigger: 'blur' }],
}

function openGroupDialog(type: 'create' | 'edit', group?: FieldGroupVo) {
  groupDialogType.value = type
  if (type === 'edit' && group) {
    Object.assign(groupForm, {
      id: group.id,
      name: group.name ?? '',
      code: group.code ?? '',
      sort: group.sort ?? 0,
      status: group.status ?? '1',
      remark: group.remark ?? '',
    })
  } else {
    Object.assign(groupForm, {
      name: '',
      code: '',
      sort: 0,
      status: '1',
      remark: '',
      id: undefined,
    })
  }
  groupDialogVisible.value = true
}

function resetGroupForm() {
  groupFormRef.value?.resetFields()
}

async function submitGroupForm() {
  const valid = await groupFormRef.value?.validate().catch(() => false)
  if (!valid) return
  groupSubmitLoading.value = true
  try {
    if (groupDialogType.value === 'create') {
      await fieldGroupApi.createFieldGroup(groupForm)
    } else {
      await fieldGroupApi.updateFieldGroup(groupForm.id!, groupForm)
    }
    ElMessage.success(groupDialogType.value === 'create' ? '创建成功' : '修改成功')
    groupDialogVisible.value = false
    fetchAll()
  } catch {
  } finally {
    groupSubmitLoading.value = false
  }
}

// ========== 类型表单 ==========
const typeDialogVisible = ref(false)
const typeDialogType = ref<'create' | 'edit'>('create')
const typeSubmitLoading = ref(false)
const typeFormRef = ref<FormInstance>()
const typeForm = reactive<CreateDictTypeParams & { id?: number | string }>({
  name: '',
  type: '',
  groupId: undefined,
  sort: 0,
  status: '1',
  remark: '',
})
const typeRules: FormRules = {
  name: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  type: [{ required: true, message: '请输入字典类型标识', trigger: 'blur' }],
}

function openTypeDialog(type: 'create' | 'edit', dictType?: DictTypeVo) {
  typeDialogType.value = type
  if (type === 'edit' && dictType) {
    Object.assign(typeForm, {
      id: dictType.id,
      name: dictType.name ?? '',
      type: dictType.type ?? '',
      groupId: dictType.groupId ?? undefined,
      sort: dictType.sort ?? 0,
      status: dictType.status ?? '1',
      remark: dictType.remark ?? '',
    })
  } else {
    Object.assign(typeForm, {
      name: '',
      type: '',
      groupId: undefined,
      sort: 0,
      status: '1',
      remark: '',
      id: undefined,
    })
  }
  typeDialogVisible.value = true
}

function resetTypeForm() {
  typeFormRef.value?.resetFields()
}

async function submitTypeForm() {
  const valid = await typeFormRef.value?.validate().catch(() => false)
  if (!valid) return
  typeSubmitLoading.value = true
  try {
    if (typeDialogType.value === 'create') {
      await dictTypeApi.createDictType(typeForm)
    } else {
      await dictTypeApi.updateDictType(typeForm.id!, typeForm)
    }
    ElMessage.success(typeDialogType.value === 'create' ? '创建成功' : '修改成功')
    typeDialogVisible.value = false
    fetchAll()
  } catch {
  } finally {
    typeSubmitLoading.value = false
  }
}

// ========== 初始化 ==========
async function fetchAll() {
  try {
    const [groupsRes, typesRes] = await Promise.all([
      fieldGroupApi.getFieldGroupAll(),
      dictTypeApi.getDictTypeList({ page: 1, pageSize: 999 }),
    ])
    groupList.value = groupsRes
    allTypes.value = typesRes.list
    expandedGroups.value = groupsRes.map((g) => String(g.id))
  } catch {}
}

onMounted(fetchAll)
</script>

<style lang="css" scoped>
.dict-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ========== 头部 ========== */
.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.tree-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ========== 分组列表（自定义折叠） ========== */
.group-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

/* ---------- 分组行 ---------- */
.group-item {
  margin-bottom: 2px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 9px 12px;
  cursor: pointer;
  user-select: none;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.group-header:hover {
  background: var(--el-fill-color-light);
}

.arrow-icon {
  font-size: 12px;
  width: 14px;
  height: 14px;
  color: var(--el-text-color-placeholder);
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.arrow-icon :deep(svg) {
  width: 14px;
  height: 14px;
}

.group-header.expanded .arrow-icon {
  transform: rotate(90deg);
}

.group-icon {
  font-size: 15px;
  width: 16px;
  height: 16px;
  color: var(--el-color-warning);
  flex-shrink: 0;
}

.group-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.group-name {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-count {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color);
  padding: 0 7px;
  border-radius: 10px;
  line-height: 18px;
  flex-shrink: 0;
}

.action-btn {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.2s,
    background 0.2s;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  flex-shrink: 0;
}

.action-btn :deep(svg) {
  width: 14px;
  height: 14px;
}

.group-header:hover .action-btn,
.type-item:hover .action-btn {
  opacity: 1;
}

.action-btn:hover {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

/* ---------- 类型列表 ---------- */
.type-list {
  padding-left: 22px;
  overflow: hidden;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin: 1px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

/* 顶层未分组类型：与分组同级，无缩进，与 group-header 视觉对齐 */
.type-item.top-level {
  padding: 9px 12px;
  margin: 2px 0;
}

.type-item:hover {
  background: var(--el-fill-color-lighter);
}

.type-item.active {
  background: var(--el-color-primary-light-9);
}

.type-item.active .type-label {
  color: var(--el-color-primary);
  font-weight: 500;
}

.type-icon {
  font-size: 14px;
  width: 15px;
  height: 15px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}

.type-icon :deep(svg) {
  width: 15px;
  height: 15px;
}

.type-item.active .type-icon {
  color: var(--el-color-primary);
}

.type-label {
  font-size: 13px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-regular);
}

.type-code {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-family: Menlo, Consolas, monospace;
  flex-shrink: 0;
  opacity: 0.75;
}

/* ========== 折叠动画 ========== */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
