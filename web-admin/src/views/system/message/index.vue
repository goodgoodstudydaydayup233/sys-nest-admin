<template>
  <div class="page-container">
    <!-- 筛选区 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item label="消息类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option label="系统通知" value="1" />
            <el-option label="业务提醒" value="2" />
            <el-option label="任务结果" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option label="未读" value="0" />
            <el-option label="已读" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.keyword"
            placeholder="标题/内容关键字"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="发送时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px"
          />
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
          :icon="Promotion"
          v-permissions="'system:message:send'"
          @click="handleSend"
          >发送站内信</el-button
        >
        <el-button
          type="warning"
          plain
          :icon="Check"
          :disabled="messageStore.unreadCount === 0"
          @click="handleMarkAllRead"
          >全部已读</el-button
        >
      </div>
      <el-button :icon="Refresh" circle @click="fetchList" />
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
      <el-table-column label="消息标题" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          <div class="title-cell">
            <span v-if="row.status === '0'" class="unread-dot" />
            <span :class="{ 'title-unread': row.status === '0' }">{{ row.title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="消息类型" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="typeTagType(row.type)" size="small">{{ typeLabel(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'danger' : 'info'" size="small">
            {{ row.status === '0' ? '未读' : '已读' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="senderName" label="发送者" width="120" align="center">
        <template #default="{ row }">{{ row.senderName || '系统' }}</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="发送时间" width="170" align="center" />
      <el-table-column label="操作" width="180" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link :icon="View" @click="handleDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === '0'"
            type="success"
            link
            :icon="Check"
            @click="handleRead(row)"
            >已读</el-button
          >
          <el-popconfirm
            title="确定删除该消息吗？"
            confirm-button-text="确定"
            cancel-button-text="取消"
            @confirm="handleDelete(row)"
          >
            <template #reference>
              <el-button type="danger" link :icon="Delete" v-permissions="'system:message:remove'"
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
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <!-- 发送弹窗 -->
    <el-dialog
      v-model="sendVisible"
      title="发送站内信"
      width="600px"
      :close-on-click-modal="false"
      draggable
      @close="handleSendClose"
    >
      <el-form ref="sendFormRef" :model="sendForm" :rules="sendRules" label-width="90px">
        <el-form-item label="消息标题" prop="title">
          <el-input
            v-model="sendForm.title"
            placeholder="请输入消息标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="消息类型" prop="type">
          <el-radio-group v-model="sendForm.type">
            <el-radio value="1">系统通知</el-radio>
            <el-radio value="2">业务提醒</el-radio>
            <el-radio value="3">任务结果</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="接收人" prop="receiverIds">
          <el-select
            v-model="sendForm.receiverIds"
            multiple
            filterable
            remote
            clearable
            :remote-method="loadUsers"
            :loading="userLoading"
            placeholder="搜索选择接收人，留空则发送给全部启用用户"
            style="width: 100%"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="userLabel(user)"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="消息内容" prop="content">
          <el-input
            v-model="sendForm.content"
            type="textarea"
            :rows="6"
            maxlength="2000"
            show-word-limit
            placeholder="请输入消息内容（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit"> 确定 </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="消息详情" width="640px" draggable append-to-body>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="消息标题">{{ detailData.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="消息类型">
          <el-tag :type="typeTagType(detailData.type)" size="small">
            {{ typeLabel(detailData.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === '0' ? 'danger' : 'info'" size="small">
            {{ detailData.status === '0' ? '未读' : '已读' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发送者">{{
          detailData.senderName || '系统'
        }}</el-descriptions-item>
        <el-descriptions-item label="发送时间">{{
          detailData.createdAt || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="消息内容">
          <div class="message-content">{{ detailData.content || '-' }}</div>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 站内信收件箱页面
 * @description 提供「本人」站内信的查看与发送能力
 *
 * @功能
 * - 收件箱分页 + 筛选（类型 / 状态 / 关键字 / 发送时间范围）
 * - 发送站内信（定向多选接收人，留空则发送给全部启用用户）
 * - 单条/全部标记已读、删除本人消息
 * - 详情弹窗：打开未读消息时自动标记已读
 *
 * @UI 布局
 * - 筛选区：类型、状态、关键字、发送时间
 * - 操作区：发送站内信、全部已读、刷新
 * - 表格：标题（未读加粗 + 红点）、类型、状态、发送者、发送时间、操作（详情/已读/删除）
 * - 弹窗：发送表单 + 详情
 *
 * @字段说明
 * - type: 1-系统通知 2-业务提醒 3-任务结果
 * - status: 0-未读 1-已读
 */
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Delete, Check, View, Promotion } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { messageApi, userApi } from '@/api/system'
import type { MessageVo, MessageType, QueryMessageParams, SendMessageParams } from '@/api/system'
import type { UserVo } from '@/api/system'
import { useMessageStore } from '@/stores/modules/message'

const messageStore = useMessageStore()

// ==================== 列表相关 ====================

const loading = ref(false)
const tableData = ref<MessageVo[]>([])
const total = ref(0)

/** 发送时间范围（发送前映射为 beginTime / endTime） */
const dateRange = ref<[string, string] | null>(null)

const queryParams = reactive<QueryMessageParams>({
  page: 1,
  pageSize: 10,
  type: undefined,
  status: undefined,
  keyword: undefined,
  beginTime: undefined,
  endTime: undefined,
})

/** 获取收件箱列表 */
async function fetchList() {
  loading.value = true
  try {
    queryParams.beginTime = dateRange.value?.[0] ?? undefined
    queryParams.endTime = dateRange.value?.[1] ?? undefined
    const { list, total: totalCount } = await messageApi.getInbox(queryParams)
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
  fetchList()
}

function handleReset() {
  queryParams.type = undefined
  queryParams.status = undefined
  queryParams.keyword = undefined
  queryParams.beginTime = undefined
  queryParams.endTime = undefined
  dateRange.value = null
  queryParams.page = 1
  queryParams.pageSize = 10
  fetchList()
}

/** 单条标记已读 */
async function handleRead(row: MessageVo) {
  try {
    await messageApi.markRead(row.id)
    row.status = '1'
    messageStore.setUnreadCount(Math.max(0, messageStore.unreadCount - 1))
    ElMessage.success('已标记为已读')
  } catch {
    // 错误已由请求拦截器统一提示
  }
}

/** 全部标记已读 */
async function handleMarkAllRead() {
  try {
    await messageApi.markAllRead()
    messageStore.setUnreadCount(0)
    ElMessage.success('已全部标记为已读')
    fetchList()
  } catch {
    // 错误已由请求拦截器统一提示
  }
}

/** 删除本人消息 */
async function handleDelete(row: MessageVo) {
  try {
    await messageApi.deleteMessage(row.id)
    if (row.status === '0') {
      messageStore.setUnreadCount(Math.max(0, messageStore.unreadCount - 1))
    }
    ElMessage.success('删除成功')
    fetchList()
  } catch {
    // 错误已由请求拦截器统一提示
  }
}

// ==================== 类型/标签映射 ====================

/** 消息类型中文名 */
function typeLabel(type: MessageType | undefined): string {
  const map: Record<MessageType, string> = {
    '1': '系统通知',
    '2': '业务提醒',
    '3': '任务结果',
  }
  return type ? (map[type] ?? '-') : '-'
}

/** 消息类型对应的 el-tag 类型 */
function typeTagType(type: MessageType | undefined): 'info' | 'warning' | 'success' {
  const map: Record<MessageType, 'info' | 'warning' | 'success'> = {
    '1': 'info',
    '2': 'warning',
    '3': 'success',
  }
  return type ? (map[type] ?? 'info') : 'info'
}

// ==================== 发送弹窗 ====================

const sendVisible = ref(false)
const submitLoading = ref(false)
const sendFormRef = ref<FormInstance>()

const sendForm = reactive<SendMessageParams>({
  title: '',
  type: '1',
  content: undefined,
  receiverIds: [],
})

const sendRules: FormRules = {
  title: [
    { required: true, message: '请输入消息标题', trigger: 'blur' },
    { max: 100, message: '消息标题长度不能超过 100 个字符', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择消息类型', trigger: 'change' }],
}

/** 接收人候选列表 */
const userOptions = ref<UserVo[]>([])
const userLoading = ref(false)

/** 用户显示名：昵称(用户名) */
function userLabel(user: UserVo): string {
  return user.nickname ? `${user.nickname}(${user.username})` : user.username
}

/** 远程加载用户列表（按用户名关键字搜索） */
async function loadUsers(keyword?: string) {
  userLoading.value = true
  try {
    const { list } = await userApi.getUserList({
      page: 1,
      pageSize: 50,
      username: keyword || undefined,
      status: '1',
    })
    userOptions.value = list
  } catch {
    userOptions.value = []
  } finally {
    userLoading.value = false
  }
}

function handleSend() {
  sendForm.title = ''
  sendForm.type = '1'
  sendForm.content = undefined
  sendForm.receiverIds = []
  loadUsers()
  sendVisible.value = true
}

function handleSendClose() {
  sendFormRef.value?.clearValidate()
}

async function handleSubmit() {
  if (!sendFormRef.value) return
  await sendFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const count = await messageApi.sendMessage({
        title: sendForm.title,
        type: sendForm.type,
        content: sendForm.content || undefined,
        receiverIds:
          sendForm.receiverIds && sendForm.receiverIds.length > 0
            ? sendForm.receiverIds
            : undefined,
      })
      ElMessage.success(`发送成功，共 ${count} 条`)
      sendVisible.value = false
    } catch {
      // 错误已由请求拦截器统一提示
    } finally {
      submitLoading.value = false
    }
  })
}

// ==================== 详情弹窗 ====================

const detailVisible = ref(false)
const detailData = ref<MessageVo>({} as MessageVo)

/** 打开详情：未读消息自动标记已读 */
async function handleDetail(row: MessageVo) {
  try {
    const detail = await messageApi.getMessageDetail(row.id)
    detailData.value = detail
    if (detail.status === '0' && detail.id) {
      await messageApi.markRead(detail.id)
      detail.status = '1'
      if (row.status === '0') {
        row.status = '1'
        messageStore.setUnreadCount(Math.max(0, messageStore.unreadCount - 1))
      }
    }
  } catch {
    detailData.value = row
  }
  detailVisible.value = true
}

// ==================== 初始化 ====================

onMounted(() => {
  fetchList()
  // 与导航栏铃铛同步未读数
  messageStore.fetchUnreadCount()
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

.title-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-start;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-danger, #f56c6c);
  flex-shrink: 0;
}

.title-unread {
  font-weight: 600;
}

.message-content {
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  text-align: left;
}
</style>
