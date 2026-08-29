<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import Link from '@/components/common/link.vue';
import SvgIcon from '@/components/custom/svg-icon.vue';
import { copyText } from '@/utils/common';
import type { VxeColumnRenderColumn, VxePagination } from './use-vxe-table';

defineOptions({
  name: 'Table'
});

interface Props {
  columns: VxeColumnRenderColumn[];
  data: any[];
  loading?: boolean;
  pagination?: VxePagination | null;
  border?: boolean;
  stripe?: boolean;
  showSeq?: boolean;
  showCheckbox?: boolean;
  showAction?: boolean;
  actionTitle?: string;
  actionWidth?: number;
  actionAlign?: 'left' | 'center' | 'right';
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pagination: null,
  border: true,
  stripe: true,
  showSeq: false,
  showCheckbox: false,
  showAction: false,
  actionTitle: '操作',
  actionWidth: 140,
  actionAlign: 'left',
  height: '100%'
});

const actionJustify = computed(() => {
  if (props.actionAlign === 'center') return 'justify-center';
  if (props.actionAlign === 'right') return 'justify-end';
  return 'justify-start';
});

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'pageChange', pagination: { current: number; size: number }): void;
  (e: 'selectionChange', records: any[]): void;
  (e: 'afterRender'): void;
  (e: 'detail', row: any): void;
}>();

function refresh() {
  emit('refresh');
}

async function handleCopy(text: string) {
  const ok = await copyText(text);
  if (ok) {
    window.$message?.success($t('common.copySuccess'));
  } else {
    window.$message?.error($t('common.copyFailed'));
  }
}

function handlePageChange(current: number) {
  emit('pageChange', { current, size: props.pagination?.size ?? 20 });
}

function handlePageSizeChange(size: number) {
  emit('pageChange', { current: props.pagination?.current ?? 1, size });
}

const seqStartIndex = computed(() => {
  const { current, size } = props.pagination ?? { current: 1, size: 20 };
  return (current - 1) * size;
});

function handleSelectionChange({ records }: { records: any[] }) {
  emit('selectionChange', records);
}
</script>

<template>
  <div class="h-full w-full flex flex-col min-h-0">
    <div class="mb-12px flex-y-center justify-between gap-12px">
      <div class="flex-y-center gap-8px flex-wrap">
        <slot name="operation-left" :refresh="refresh" />
      </div>
      <div class="flex-y-center gap-8px flex-wrap justify-end">
        <slot name="operation-right" :refresh="refresh" />
      </div>
    </div>
    <div class="w-full min-h-0 bg-white" :class="height === '100%' ? 'flex-1' : ''">
      <!-- :checkbox-config="{ trigger: 'checkbox' }" -->
      <vxe-table
        :data="data"
        :loading="loading"
        :border="border"
        :stripe="stripe"
        :row-config="{ isHover: true, height: 40 }"
        :seq-config="{ startIndex: seqStartIndex }"
        :height="height"
        class="w-full table-draggable"
        @checkbox-change="handleSelectionChange"
        @checkbox-all="handleSelectionChange"
        @after-render="$emit('afterRender')"
      >
        <vxe-column v-if="showSeq" type="seq" title="#" :width="50" fixed="left" align="center" />
        <vxe-column v-if="showCheckbox" type="checkbox" :width="50" fixed="left" align="center" />
        <vxe-column
          v-for="(col, index) in columns"
          :key="`${col.key}-${index}`"
          :field="col.key"
          :title="col.title"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :align="col.align"
          :header-align="col.align"
          :sortable="col.sortable"
        >
          <template v-if="$slots[col.key]" #default="scope">
            <slot :name="col.key" v-bind="scope" />
          </template>
          <template v-else-if="col.type === 'status'" #default="{ row }">
            <NTag size="small" :type="row[col.key] === (col.activeValue ?? '1') ? 'success' : 'error'">
              {{ row[col.key] === (col.activeValue ?? '1') ? $t('common.enable') : $t('common.disable') }}
            </NTag>
          </template>
          <template v-else-if="col.type === 'detail'" #default="{ row }">
            <Link type="primary" icon-position="right" @click="emit('detail', row)">
              {{ row[col.key] }}
              <template #icon>
                <NTooltip trigger="hover">
                  <template #trigger>
                    <span class="vxe-link-icon" @click.stop="handleCopy(row[col.key])">
                      <SvgIcon icon="mdi:content-copy" />
                    </span>
                  </template>
                  <span>{{ $t('common.copy') }}</span>
                </NTooltip>
              </template>
            </Link>
          </template>
        </vxe-column>
        <vxe-column
          v-if="showAction"
          field="_action"
          :title="actionTitle"
          :width="actionWidth"
          :align="actionAlign"
          fixed="right"
        >
          <template #default="scope">
            <div class="flex items-center gap-8px" :class="actionJustify">
              <slot name="action" :row="scope.row" />
            </div>
          </template>
        </vxe-column>
        <template #empty>
          <span class="text-14px text-#909399">{{ $t('common.noData') }}</span>
        </template>
      </vxe-table>
    </div>

    <div v-if="pagination" class="mt-12px flex justify-end">
      <NPagination
        :page="pagination.current"
        :page-size="pagination.size"
        :item-count="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        :show-size-picker="true"
        show-quick-jumper
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.vxe-link-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
}
</style>
