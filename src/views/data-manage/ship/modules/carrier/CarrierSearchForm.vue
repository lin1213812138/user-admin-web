<script setup lang="ts">
import { $t } from '@/locales';

const keyword = defineModel<string>('keyword', { default: '' });
const emit = defineEmits<{
  search: [];
  reset: [];
}>();
</script>

<template>
  <div class="flex flex-wrap items-center gap-12px">
    <NInput
      v-model:value="keyword"
      class="w-200px!"
      clearable
      placeholder="请输入网络名称"
      @keyup.enter="emit('search')"
    />
    <LButton type="primary" @click="emit('search')">
      <template #icon><icon-ic-round-search class="text-icon" /></template>
      {{ $t('common.search') }}
    </LButton>
    <LButton @click="emit('reset')">
      <template #icon><icon-ic-round-refresh class="text-icon" /></template>
      {{ $t('common.reset') }}
    </LButton>
  </div>
</template>
