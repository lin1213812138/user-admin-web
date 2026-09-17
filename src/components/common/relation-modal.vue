<script setup lang="ts">
import { computed, watch } from 'vue';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';

defineOptions({
  name: 'RelationModal'
});

interface Props {
  /** 弹窗显隐，v-model:show */
  show?: boolean;
  /** 弹窗标题 */
  title?: string;
  /** 分页取数函数，过滤条件（如站点 id）由调用方闭包绑定 */
  fetcher: (params: { page: number; size: number }) => Promise<{ list: any[]; total: number }>;
  /** 列定义，type: 'status' 自动渲染启用/禁用标签 */
  columns: VxeColumnConfig[];
  /** 弹窗宽度（px） */
  width?: number;
  /** 表格内容区高度（px） */
  bodyHeight?: number;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  title: '',
  width: 900,
  bodyHeight: 480
});

const emit = defineEmits<{
  'update:show': [value: boolean];
}>();

const modalVisible = computed({
  get: () => props.show,
  set: val => emit('update:show', val)
});

const { data, loading, columns, pagination, getData } = useVxeTable<{ list: any[]; total: number }, any>({
  api: ({ current, size }) => props.fetcher({ page: current, size }),
  transform: r => ({ records: r.list, total: r.total }),
  columns: () => props.columns,
  // 打开弹窗时才取数
  immediate: false,
  defaultPageSize: 20
});

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

watch(
  () => props.show,
  val => {
    if (!val) return;

    // 每次打开回到第一页重新取数，保证看到最新关联数据
    pagination.current = 1;
    getData();
  }
);
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" :style="{ width: `${width}px` }">
    <div :style="{ height: `${bodyHeight}px` }">
      <Table :columns="columns" :data="data" :loading="loading" :show-seq="true" @page-change="handlePageChange" />
    </div>
  </NModal>
</template>

<style scoped></style>
