<script setup lang="ts">
import { $t } from '@/locales';

// 配置权限留空占位：权限树挂在角色上（见角色管理分配权限抽屉），用户实体仅有 roleIds/groupIds，待后端支持后再实现
</script>

<template>
  <div class="flex-center min-h-240px">
    <NEmpty :description="$t('common.lookForward')" />
  </div>
</template>

<style scoped></style>
