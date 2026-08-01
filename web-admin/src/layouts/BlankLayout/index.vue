<template>
  <div class="blank-layout">
    <router-view />
  </div>
</template>

<script setup lang="ts">
/**
 * BlankLayout - 空白布局组件
 * @description 用于登录页、错误页等不需要侧边栏和顶栏的页面
 */
</script>

<style lang="css" scoped>
.blank-layout {
  width: 100%;
  min-height: 100vh;
}
</style>
