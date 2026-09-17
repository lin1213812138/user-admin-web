<script setup lang="ts">
import { $t } from '@/locales';

// 账号配置留空占位：参考稿的登录控制/通知配置字段后端 UserSchema 暂未提供（mongoose strict 会丢弃未声明字段），待后端支持后再实现
</script>

<template>
  <div class="flex-center min-h-240px">
    <NEmpty :description="$t('common.lookForward')" />
  </div>
</template>

<style scoped></style>
