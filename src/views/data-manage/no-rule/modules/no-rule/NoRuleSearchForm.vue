<script setup lang="ts">
import { $t } from '@/locales';
import type { SelectOption } from 'naive-ui';

const filterSysType = defineModel<number | null>('filterSysType', { default: null });
const props = defineProps<{ options: SelectOption[] }>();
const emit = defineEmits<{
  search: [];
  reset: [];
}>();
</script>

<template>
  <div class="flex flex-wrap items-center gap-12px">
    <NSelect
      v-model:value="filterSysType"
      class="w-180px!"
      clearable
      :options="props.options"
      :placeholder="$t('page.dataManage.noRule.sysTypeAll')"
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
