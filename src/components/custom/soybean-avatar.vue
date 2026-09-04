<script setup lang="ts">
/**
 * 圆形头像组件
 *
 * 作用：展示内置的 soybean 头像图片，常用于登录页、关于页等品牌展示场景。
 *
 * 使用方式：
 * ```vue
 * <SoybeanAvatar />
 * ```
 *
 * 组件固定渲染为 72px 圆形头像（图片见 src/assets/imgs/soybean.jpg）。
 */
defineOptions({
  name: 'SoybeanAvatar'
});
</script>

<template>
  <div class="size-72px overflow-hidden rd-1/2">
    <img src="@/assets/imgs/soybean.jpg" class="size-full" />
  </div>
</template>

<style scoped></style>
