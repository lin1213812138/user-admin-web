<script setup lang="ts">
import { $t } from '@/locales';

const activeType = defineModel<string>('activeType', { default: 'BY' });
const keyword = defineModel<string>('keyword', { default: '' });
const props = defineProps<{ addressTypeOptions: { label: string; value: string }[] }>();
const emit = defineEmits<{
  search: [];
  reset: [];
}>();
</script>

<template>
  <div class="flex flex-col gap-12px">
    <NRadioGroup v-model:value="activeType" type="button">
      <NRadioButton v-for="opt in props.addressTypeOptions" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </NRadioButton>
    </NRadioGroup>
    <div class="flex flex-wrap items-center gap-12px">
      <NInput
        v-model:value="keyword"
        class="w-200px!"
        clearable
        placeholder="请输入姓名/公司"
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
  </div>
</template>
