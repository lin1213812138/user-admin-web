<script setup lang="ts">
import { ref } from 'vue';
import MasterDetail from '../components/MasterDetail.vue';

interface Item {
  id: number;
  name: string;
  status: Api.Common.EnableStatus;
}

const items = ref<Item[]>([
  { id: 1, name: '默认打印格式', status: 1 },
  { id: 2, name: '客户打印格式', status: 1 }
]);

const selectedId = ref<number | null>(items.value[0]?.id ?? null);
</script>

<template>
  <MasterDetail
    list-title="打印格式列表"
    search-placeholder="搜索列表"
    :items="items"
    :show-status="true"
    :show-actions="false"
    :selected-id="selectedId"
    @update:selected-id="id => (selectedId = id)"
  >
    <LookForward />
  </MasterDetail>
</template>
