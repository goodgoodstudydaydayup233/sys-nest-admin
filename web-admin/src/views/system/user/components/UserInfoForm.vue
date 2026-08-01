<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" class="profile-form">
    <el-form-item label="昵称" prop="nickname">
      <el-input v-model="form.nickname" placeholder="请输入昵称" maxlength="30" show-word-limit />
    </el-form-item>
    <el-form-item label="手机号" prop="phone">
      <el-input v-model="form.phone" placeholder="请输入手机号" maxlength="11" />
    </el-form-item>
    <el-form-item label="邮箱" prop="email">
      <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
    </el-form-item>
    <el-form-item label="性别" prop="sex">
      <el-radio-group v-model="form.sex">
        <el-radio value="0">男</el-radio>
        <el-radio value="1">女</el-radio>
        <el-radio value="3">未知</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保 存</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
/**
 * UserInfoForm - 基本资料表单组件
 * @description 修改当前登录用户的个人信息，调用 PUT /user/profile 接口
 *
 * @example
 * ```vue
 * <UserInfoForm :user="userInfo" @success="onUpdated" />
 * ```
 */
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { userApi } from '@/api/system'
import type { UpdateProfileParams } from '@/api/system'
import type { UserInfo } from '@/api/system'

const props = defineProps<{
  /** 当前用户信息（从 authApi.getUserInfo 获取） */
  user: UserInfo
}>()

const emit = defineEmits<{
  /** 保存成功后触发，父组件应刷新用户信息 */
  success: []
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive<UpdateProfileParams>({
  nickname: '',
  phone: '',
  email: '',
  sex: '3',
})

/** 组件挂载时同步一次 props 到表单，后续不再响应 props 变化（避免刷新覆盖用户未保存的输入） */
onMounted(() => {
  if (props.user) {
    form.nickname = props.user.nickname ?? ''
    form.phone = props.user.phone ?? ''
    form.email = props.user.email ?? ''
    form.sex = props.user.sex ?? '3'
  }
})

const rules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 30, message: '昵称长度为 2 ~ 30 个字符', trigger: 'blur' },
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }],
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await userApi.updateProfile(form)
    ElMessage.success('修改成功')
    emit('success')
  } catch {
    // 错误已由请求拦截器统一提示
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.profile-form {
  max-width: 480px;
}
</style>
