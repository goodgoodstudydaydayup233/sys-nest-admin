<template>
  <div class="app-container">
    <el-row :gutter="10">
      <!-- 左栏：缓存名称列表 -->
      <el-col :span="8">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <el-icon><Collection /></el-icon>
              <span>缓存列表</span>
              <el-button
                class="header-btn"
                link
                type="primary"
                :icon="Refresh"
                @click="refreshCacheNames"
              />
            </div>
          </template>
          <el-table
            v-loading="loading"
            :data="cacheNames"
            :height="tableHeight"
            highlight-current-row
            @row-click="handleCacheNameClick"
            style="width: 100%"
          >
            <el-table-column label="序号" width="60" type="index" />
            <el-table-column
              label="缓存名称"
              align="center"
              prop="cacheName"
              :show-overflow-tooltip="true"
            />
            <el-table-column
              label="备注"
              align="center"
              prop="remark"
              :show-overflow-tooltip="true"
            />
            <el-table-column label="操作" width="60" align="center">
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  :icon="Delete"
                  v-permissions="['monitor:cache:remove']"
                  @click.stop="handleClearCacheName(scope.row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 中栏：键名列表 -->
      <el-col :span="8">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <el-icon><Key /></el-icon>
              <span>键名列表</span>
              <el-button
                class="header-btn"
                link
                type="primary"
                :icon="Refresh"
                @click="refreshCacheKeys"
              />
            </div>
          </template>
          <el-table
            v-loading="subLoading"
            :data="cacheKeys"
            :height="tableHeight"
            highlight-current-row
            @row-click="handleCacheKeyClick"
            style="width: 100%"
          >
            <el-table-column label="序号" width="60" type="index" />
            <el-table-column label="缓存键名" align="center" :show-overflow-tooltip="true">
              <template #default="scope">
                {{ formatKey(scope.row) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60" align="center">
              <template #default="scope">
                <el-button
                  link
                  type="primary"
                  :icon="Delete"
                  v-permissions="['monitor:cache:remove']"
                  @click.stop="handleClearCacheKey(scope.row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 右栏：缓存内容 -->
      <el-col :span="8">
        <el-card class="panel-card">
          <template #header>
            <div class="panel-header">
              <el-icon><Document /></el-icon>
              <span>缓存内容</span>
              <el-button
                class="header-btn"
                link
                type="primary"
                @click="handleClearCacheAll"
                v-permissions="['monitor:cache:remove']"
              >
                清理全部
              </el-button>
            </div>
          </template>
          <el-form :model="cacheForm">
            <el-row :gutter="32">
              <el-col :offset="1" :span="22">
                <el-form-item label="缓存名称:" prop="cacheName">
                  <el-input v-model="cacheForm.cacheName" readonly />
                </el-form-item>
              </el-col>
              <el-col :offset="1" :span="22">
                <el-form-item label="缓存键名:" prop="cacheKey">
                  <el-input v-model="cacheForm.cacheKey" readonly />
                </el-form-item>
              </el-col>
              <el-col :offset="1" :span="22">
                <el-form-item label="缓存内容:" prop="cacheValue">
                  <el-input v-model="cacheForm.cacheValue" type="textarea" :rows="8" readonly />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
/**
 * 缓存列表页面
 * @description 按业务前缀分组的三栏布局
 *
 * @UI 布局
 * - 左栏(8)：缓存名称列表（sys_config/sys_dict 等业务前缀分组），点击切换，可清理整组
 * - 中栏(8)：键名列表（选中分组下的 key），点击查看，可清理单个
 * - 右栏(8)：缓存内容表单（只读）+ 清理全部按钮
 *
 * @交互流程
 * 1. 进入页面加载左栏缓存名称列表
 * 2. 点击左栏某行 → 加载中栏该分组下的 key 列表
 * 3. 点击中栏某行 → 加载右栏该 key 的缓存内容
 * 4. 删除操作：左栏清理整组、中栏清理单个、右栏清理全部
 */
import { ref, onMounted } from 'vue'
import { Collection, Key, Document, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cacheApi, type CacheNameVo, type CacheContentVo } from '@/api/monitor/cache'

// ==================== 响应式状态 ====================

const cacheNames = ref<CacheNameVo[]>([])
const cacheKeys = ref<string[]>([])
const cacheForm = ref<Partial<CacheContentVo>>({})
const loading = ref(false)
const subLoading = ref(false)
/** 当前选中的缓存名称 */
const nowCacheName = ref('')
const tableHeight = ref(window.innerHeight - 200)

// ==================== 左栏：缓存名称 ====================

/** 查询缓存名称列表 */
async function getCacheNames() {
  loading.value = true
  try {
    cacheNames.value = await cacheApi.getCacheNames()
  } catch (e: any) {
    ElMessage.error(e?.message || '获取缓存名称列表失败')
    cacheNames.value = []
  } finally {
    loading.value = false
  }
}

/** 刷新缓存名称列表 */
function refreshCacheNames() {
  getCacheNames()
  ElMessage.success('刷新缓存列表成功')
}

/** 点击缓存名称 → 加载键名列表 */
function handleCacheNameClick(row: CacheNameVo) {
  getCacheKeys(row.cacheName)
}

/** 清理指定名称缓存 */
async function handleClearCacheName(row: CacheNameVo) {
  await ElMessageBox.confirm(`确认清理「${row.cacheName}」下所有缓存？`, '提示', {
    type: 'warning',
  })
  await cacheApi.clearCacheName(row.cacheName)
  ElMessage.success(`清理缓存名称[${row.cacheName}]成功`)
  // 重新加载键名列表
  if (nowCacheName.value) {
    getCacheKeys(nowCacheName.value)
  }
}

// ==================== 中栏：键名列表 ====================

/** 查询指定缓存名称下的键名列表 */
async function getCacheKeys(cacheName: string) {
  if (!cacheName) return
  subLoading.value = true
  try {
    cacheKeys.value = await cacheApi.getCacheKeys(cacheName)
    nowCacheName.value = cacheName
    // 清空右栏内容
    cacheForm.value = {}
  } catch (e: any) {
    ElMessage.error(e?.message || '获取键名列表失败')
    cacheKeys.value = []
  } finally {
    subLoading.value = false
  }
}

/** 刷新键名列表 */
function refreshCacheKeys() {
  if (!nowCacheName.value) {
    ElMessage.warning('请先选择缓存名称')
    return
  }
  getCacheKeys(nowCacheName.value)
  ElMessage.success('刷新键名列表成功')
}

/** 点击键名 → 加载缓存内容 */
function handleCacheKeyClick(cacheKey: string) {
  getCacheValue(nowCacheName.value, cacheKey)
}

/** 清理指定键名缓存 */
async function handleClearCacheKey(cacheKey: string) {
  await ElMessageBox.confirm(`确认清理缓存键名「${cacheKey}」？`, '提示', {
    type: 'warning',
  })
  await cacheApi.clearCacheKey(nowCacheName.value, cacheKey)
  ElMessage.success(`清理缓存键名成功`)
  getCacheKeys(nowCacheName.value)
}

/** 键名展示：去除前缀（keyFormatter） */
function formatKey(cacheKey: string): string {
  // 去除当前缓存名称对应的前缀，只显示业务部分
  return cacheKey
}

// ==================== 右栏：缓存内容 ====================

/** 查询缓存内容 */
async function getCacheValue(cacheName: string, cacheKey: string) {
  try {
    cacheForm.value = await cacheApi.getCacheValue(cacheName, cacheKey)
  } catch (e: any) {
    ElMessage.error(e?.message || '获取缓存内容失败')
    cacheForm.value = {}
  }
}

/** 清理全部缓存 */
async function handleClearCacheAll() {
  await ElMessageBox.confirm('确认清理所有业务缓存？此操作不可逆', '提示', {
    type: 'warning',
  })
  await cacheApi.clearCacheAll()
  ElMessage.success('清理全部缓存成功')
  // 刷新当前选中的键名列表
  if (nowCacheName.value) {
    getCacheKeys(nowCacheName.value)
  }
  cacheForm.value = {}
}

// ==================== 初始化 ====================

onMounted(() => {
  getCacheNames()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.panel-card {
  height: calc(100vh - 125px);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.header-btn {
  margin-left: auto;
  padding: 3px 0;
}
</style>
