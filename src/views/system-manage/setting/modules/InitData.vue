<script setup lang="ts">
import { ref } from 'vue';
import MasterDetail from '../components/MasterDetail.vue';

interface Item {
  id: number;
  name: string;
  status: Api.Common.EnableStatus;
}

const items = ref<Item[]>([
  { id: 1, name: '基础数据初始化', status: 1 },
  { id: 2, name: '业务数据初始化', status: 1 }
]);

const selectedId = ref<number | null>(items.value[0]?.id ?? null);
</script>

<template>
  <MasterDetail
    list-title="初始化数据列表"
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
