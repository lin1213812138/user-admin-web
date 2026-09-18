<script setup lang="ts">
import { $t } from '@/locales';

const keyword = defineModel<string>('keyword', { default: '' });
const statusFilter = defineModel<0 | 1 | null>('statusFilter', { default: null });
const providerType = defineModel<0 | 1 | 2 | 3>('providerType', { default: 0 });
const props = defineProps<{
  providerTypeOptions: { label: string; value: number }[];
  statusOptions: { label: string; value: number }[];
}>();
const emit = defineEmits<{
  search: [];
  reset: [];
}>();
</script>

<template>
  <div class="flex flex-wrap items-center gap-12px">
    <NRadioGroup v-model:value="providerType" @update:value="emit('search')">
      <NRadioButton v-for="opt in providerTypeOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </NRadioButton>
    </NRadioGroup>
    <NInput
      v-model:value="keyword"
      class="w-200px!"
      clearable
      placeholder="请输入服务商名称"
      @keyup.enter="emit('search')"
    />
    <NSelect
      v-model:value="statusFilter"
      class="w-140px!"
      clearable
      :options="props.statusOptions"
      placeholder="状态"
    />
    <NButton size="small" type="primary" @click="emit('search')">
      <template #icon><icon-ic-round-search class="text-icon" /></template>
      {{ $t('common.search') }}
    </NButton>
    <NButton size="small" @click="emit('reset')">
      <template #icon><icon-ic-round-refresh class="text-icon" /></template>
      {{ $t('common.reset') }}
    </NButton>
  </div>
</template>
