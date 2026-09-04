<script setup lang="ts">
/**
 * 敬请期待占位组件
 *
 * 作用：用于尚未开发的页面/模块占位，展示大号期望图标与「敬请期待」文案。
 *
 * 使用方式：
 * ```vue
 * <LookForward />
 * ```
 *
 * 可通过默认插槽自定义内部文案或内容。
 */
import { $t } from '@/locales';

defineOptions({
  name: 'LookForward'
});
</script>

<template>
  <div class="size-full min-h-520px flex-col-center gap-24px overflow-hidden">
    <div class="flex text-400px text-primary">
      <SvgIcon local-icon="expectation" />
    </div>
    <slot>
      <h3 class="text-28px text-primary font-500">{{ $t('common.lookForward') }}</h3>
    </slot>
  </div>
</template>

<style scoped></style>
