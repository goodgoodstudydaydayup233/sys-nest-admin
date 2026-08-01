<template>
  <div class="page-container profile-page">
    <el-row :gutter="20">
      <!-- 左侧：个人信息卡片 -->
      <el-col :xs="24" :sm="8" :md="7" :lg="6">
        <el-card shadow="never" class="info-card">
          <div class="info-card__avatar">
            <UserAvatar
              :avatar="userStore.avatar"
              :nickname="userStore.nickname"
              @success="refreshUser"
            />
          </div>
          <div class="info-card__username">{{ userStore.nickname }}</div>
          <el-divider />
          <ul class="info-card__list">
            <li>
              <el-icon><User /></el-icon>
              <span class="label">账号</span>
              <span class="value">{{ userStore.username }}</span>
            </li>
            <li>
              <el-icon><Iphone /></el-icon>
              <span class="label">手机</span>
              <span class="value">{{ userStore.userInfo?.phone || '-' }}</span>
            </li>
            <li>
              <el-icon><Message /></el-icon>
              <span class="label">邮箱</span>
              <span class="value">{{ userStore.userInfo?.email || '-' }}</span>
            </li>
            <li>
              <el-icon><UserFilled /></el-icon>
              <span class="label">角色</span>
              <span class="value">{{ userStore.roles.join('、') || '-' }}</span>
            </li>
          </ul>
        </el-card>
      </el-col>

      <!-- 右侧：Tab 表单 -->
      <el-col :xs="24" :sm="16" :md="17" :lg="18">
        <el-card shadow="never" class="form-card">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本资料" name="info">
              <UserInfoForm :user="userInfo" @success="refreshUser" />
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="pwd">
              <ResetPwdForm />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
/**
 * Personal - 个人中心页面
 * @description 当前登录用户查看/修改个人信息、修改密码、更换头像
 *
 * @layout DefaultLayout
 * @route /account/personal
 *
 * 功能：
 * - 左侧卡片展示头像、账号、手机、邮箱、角色等基础信息
 * - 右侧 Tab 切换「基本资料」表单和「修改密码」表单
 * - 头像支持裁剪上传（vue-cropper）
 * - 所有修改操作均调用 userApi 的 updateProfile / changeOwnPassword 接口
 */
import { ref, computed } from 'vue'
import { User, Iphone, Message, UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/modules/user'
import UserAvatar from './components/UserAvatar.vue'
import UserInfoForm from './components/UserInfoForm.vue'
import ResetPwdForm from './components/ResetPwdForm.vue'

const userStore = useUserStore()

const activeTab = ref('info')

/** 当前用户信息（响应式，从 store 取） */
const userInfo = computed(() => userStore.userInfo!)

/**
 * 刷新用户信息
 * @description 保存基本资料成功后，重新获取最新用户信息并同步到 store
 */
async function refreshUser() {
  await userStore.getUserInfo()
}
</script>

<style lang="scss" scoped>
.profile-page {
  .info-card {
    text-align: center;

    .info-card__avatar {
      display: flex;
      justify-content: center;
      padding-top: 8px;
    }

    .info-card__username {
      margin-top: 12px;
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .info-card__list {
      list-style: none;
      padding: 0;
      margin: 0;
      text-align: left;

      li {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
        font-size: 14px;
        color: var(--el-text-color-regular);

        &:last-child {
          border-bottom: none;
        }

        .el-icon {
          color: var(--el-text-color-secondary);
          font-size: 16px;
        }

        .label {
          flex-shrink: 0;
          width: 36px;
          color: var(--el-text-color-secondary);
        }

        .value {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: right;
        }
      }
    }
  }

  .form-card {
    min-height: 400px;
  }
}
</style>
