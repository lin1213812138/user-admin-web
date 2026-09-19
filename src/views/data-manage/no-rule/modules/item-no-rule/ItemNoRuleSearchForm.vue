<script setup lang="ts">
import { $t } from '@/locales';
import type { SelectOption } from 'naive-ui';

const keyword = defineModel<string>('keyword', { default: '' });
const statusFilter = defineModel<0 | 1 | null>('statusFilter', { default: null });
const props = defineProps<{ statusOptions: SelectOption[] }>();
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
      placeholder="请输入规则名称"
      @keyup.enter="emit('search')"
    />
    <NSelect
      v-model:value="statusFilter"
      class="w-140px!"
      clearable
      :options="props.statusOptions"
      :placeholder="$t('common.status')"
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
