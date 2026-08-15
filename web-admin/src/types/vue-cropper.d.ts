/**
 * vue-cropper 类型声明补充
 * @description vue-cropper@1.1.4 包自带的类型链（lib/typings/index.d.ts）会拖入其源码
 * lib/index.ts / lib/vue-cropper.vue，而这些源码缺失 .vue 模块声明，导致 TS7016 错误。
 * 本项目通过 tsconfig 的 paths 映射将 `vue-cropper` 强制指向本声明文件，绕过损坏的类型链。
 *
 * 通过「构造函数签名 + 组件形状（props/emits/render）」声明组件：
 * - 构造函数签名提供实例类型，使 `InstanceType<typeof VueCropper>`（UserAvatar 中使用）可解析出实例方法；
 * - props 使用索引签名、emits 使用字符串数组，对模板 props / 事件保持宽松但合法的类型。
 */
import type { VNode } from 'vue'

/** 实时裁剪事件负载（@real-time 事件） */
export interface RealTimeEvent {
  /** 裁剪框定位样式 */
  div: Record<string, string>
  /** 裁剪图片缩放/定位样式 */
  img: Record<string, string>
  /** 预览图片地址（base64） */
  url: string
}

/** 裁剪组件实例方法（补充本项目使用到的方法） */
export interface VueCropperInstance {
  /** 缩放，num 为缩放步长（正放大 / 负缩小） */
  changeScale(num: number): void
  /** 向左旋转 90° */
  rotateLeft(): void
  /** 向右旋转 90° */
  rotateRight(): void
  /** 获取裁剪后的图片 Blob */
  getCropBlob(callback: (blob: Blob) => void): void
}

/**
 * 图片裁剪组件
 * @description 组件形状声明（props 宽松索引、emits 任意字符串事件），
 * 构造函数签名用于推导实例类型。
 */
export const VueCropper: {
  new (): VueCropperInstance
  /** 组件 props（宽松校验，避免模板 props 类型错误） */
  props: Record<string, unknown>
  /** 组件事件（任意事件名均可触发） */
  emits: string[]
  /** 渲染函数（组件必需形状之一） */
  render: () => VNode
  /** 插件安装函数（默认导出使用） */
  install: (app: unknown) => void
}

/** 全局安装对象（默认导出） */
declare const globalCropper: {
  version: string
  install: (app: unknown) => void
  VueCropper: typeof VueCropper
}
export default globalCropper
