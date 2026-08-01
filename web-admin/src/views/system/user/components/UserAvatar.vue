<template>
  <div class="user-avatar-wrapper" @click="openCropper">
    <el-avatar :size="120" :src="props.avatar" class="avatar-img">
      <span class="avatar-fallback">{{ userInitial }}</span>
    </el-avatar>
    <div class="avatar-hover-mask">
      <el-icon :size="24"><Camera /></el-icon>
      <span>更换头像</span>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="修改头像"
      width="800px"
      append-to-body
      destroy-on-close
      draggable
      @opened="onDialogOpened"
    >
      <el-row :gutter="12">
        <el-col :xs="24" :md="12">
          <div class="cropper-container">
            <VueCropper
              v-if="cropperReady"
              ref="cropperRef"
              :img="cropperImg"
              :auto-crop="true"
              :auto-crop-width="200"
              :auto-crop-height="200"
              :fixed-box="true"
              :output-type="'png'"
              :info="true"
              :can-move="true"
              :can-move-box="false"
              @real-time="onRealTime"
            />
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="preview-container">
            <div class="preview-title">预览</div>
            <div class="preview-avatar" :style="previews.div">
              <img v-if="previews.url" :src="previews.url" :style="previews.img" />
            </div>
          </div>
        </el-col>
      </el-row>

      <template #footer>
        <div class="dialog-footer">
          <div class="footer-left">
            <el-upload
              action="#"
              :show-file-list="false"
              :before-upload="beforeUpload"
              :http-request="() => {}"
            >
              <el-button :icon="UploadFilled">选择图片</el-button>
            </el-upload>
            <el-button-group class="scale-btns">
              <el-button :icon="ZoomIn" @click="changeScale(1)" />
              <el-button :icon="ZoomOut" @click="changeScale(-1)" />
              <el-button :icon="RefreshLeft" @click="rotateLeft" />
              <el-button :icon="RefreshRight" @click="rotateRight" />
            </el-button-group>
          </div>
          <div class="footer-right">
            <el-button @click="dialogVisible = false">取 消</el-button>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">
              提 交
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * UserAvatar - 头像裁剪组件
 * @description 支持图片上传、裁剪、旋转、缩放预览，裁剪后直接调用 PUT /user/avatar 接口上传
 *
 * @example
 * ```vue
 * <UserAvatar
 *   :avatar="userStore.avatar"
 *   :nickname="userStore.nickname"
 *   @success="onAvatarUpdated"
 * />
 * ```
 */
import { ref, reactive, nextTick, computed } from 'vue'
import {
  Camera,
  UploadFilled,
  ZoomIn,
  ZoomOut,
  RefreshLeft,
  RefreshRight,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'
import { userApi } from '@/api/system'

const props = defineProps<{
  /** 当前头像 URL */
  avatar?: string
  /** 用户昵称（用于无头像时显示首字） */
  nickname?: string
}>()

const emit = defineEmits<{
  /** 头像上传成功后触发，父组件应刷新用户信息 */
  success: []
}>()

/** 用户名首字（fallback） */
const userInitial = computed(() => (props.nickname || 'U').charAt(0).toUpperCase())

const dialogVisible = ref(false)
const cropperReady = ref(false)
const submitting = ref(false)
const cropperRef = ref<InstanceType<typeof VueCropper>>()

/** 裁剪图片源 */
const cropperImg = ref('')

/** 实时预览数据 */
const previews = reactive<{
  url: string
  img: Record<string, string>
  div: Record<string, string>
}>({
  url: '',
  img: {},
  div: {},
})

/** 打开裁剪弹窗 */
function openCropper() {
  cropperImg.value = props.avatar || ''
  dialogVisible.value = true
}

/** 弹窗打开后初始化 cropper */
function onDialogOpened() {
  nextTick(() => {
    cropperReady.value = true
  })
}

/** 实时预览回调 */
function onRealTime(data: {
  url: string
  img: Record<string, string>
  div: Record<string, string>
}) {
  previews.url = data.url
  previews.img = data.img
  previews.div = data.div
}

/** 上传前校验 */
function beforeUpload(file: File): boolean {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('请选择图片文件（JPG、PNG 等）')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    cropperImg.value = reader.result as string
  }
  return false
}

/** 放大 / 缩小 */
function changeScale(num: number) {
  cropperRef.value?.changeScale(num)
}

/** 向左旋转 */
function rotateLeft() {
  cropperRef.value?.rotateLeft()
}

/** 向右旋转 */
function rotateRight() {
  cropperRef.value?.rotateRight()
}

/** 提交裁剪结果 → 调用 PUT /user/avatar 上传 */
function handleSubmit() {
  submitting.value = true
  cropperRef.value?.getCropBlob(async (blob: Blob) => {
    const file = new File([blob], 'avatar.png', { type: 'image/png' })
    try {
      await userApi.updateAvatar(file)
      ElMessage.success('头像更新成功')
      emit('success')
      dialogVisible.value = false
    } catch {
      // 错误已由请求拦截器统一提示
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.user-avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;

  .avatar-img {
    display: block;
    border: 2px solid var(--el-border-color-lighter);
  }

  .avatar-fallback {
    font-size: 40px;
    color: #fff;
  }

  .avatar-hover-mask {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: #fff;
    background: rgba(0, 0, 0, 0.45);
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.25s;
    font-size: 12px;

    &:hover {
      opacity: 1;
    }
  }
}

.cropper-container {
  width: 100%;
  height: 350px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
  gap: 16px;

  .preview-title {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .preview-avatar {
    border-radius: 50%;
    border: 2px solid var(--el-border-color-lighter);
    overflow: hidden;
  }
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .footer-left {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .scale-btns {
    margin-left: 8px;
  }
}
</style>
