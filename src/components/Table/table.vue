<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Link from '@/components/common/link.vue';
import IconRenderer from '@/components/custom/icon-renderer.vue';
import type { FormItemConfig } from '@/components/Form/index.vue';
import SearchBar from '@/components/SearchBar/search-bar.vue';
import { copyText } from '@/utils/common';
import type { VxeColumnRenderColumn, VxePagination } from './use-vxe-table';
import type { VxeTablePropTypes } from 'vxe-table';
import { createDefaultExportName } from '@/components/Export';

defineOptions({
  name: 'Table'
});

/** 支持原生导出与勾选操作的 vxe-table 实例最小形状（方法由 @vxe-ui/plugin-export-xlsx 运行时挂载） */
interface VxeExportableTable {
  /** 打开 vxe-table 高级导出弹窗 */
  openExport?: (options?: VxeTablePropTypes.ExportConfig) => void;
  exportData?: (options?: VxeTablePropTypes.ExportConfig) => Promise<unknown>;
  /** 获取已勾选的行（树模式下父子联动后会包含父节点） */
  getCheckboxRecords?: () => Record<string, unknown>[];
  /** 获取半选（indeterminate）行，树模式下父节点部分子节点勾选时为半选 */
  getCheckboxIndeterminateRecords?: () => Record<string, unknown>[];
  /** 勾选 / 取消勾选全部行 */
  setAllCheckboxRow?: (checked: boolean) => Promise<unknown>;
}

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
  /** vxe-table tree-config, enable tree mode when provided */
  treeConfig?: VxeTablePropTypes.TreeConfig;
  /** vxe-table checkbox-config, e.g. { checkStrictly: false, checkField: 'checked' } for cascaded tree checkbox */
  checkboxConfig?: VxeTablePropTypes.CheckboxConfig;
  /** vxe-table row-config, default { isHover: true, height: 40 } */
  rowConfig?: VxeTablePropTypes.RowConfig;
  /** 搜索栏配置项，传入即启用内嵌可折叠搜索栏（由所有使用本表格的页面各自配置） */
  searchItems?: FormItemConfig[];
  /** 搜索表单数据对象（按引用传递，由父页面持有并在取数时读取） */
  searchModel?: Record<string, unknown>;
  /** 搜索栏是否默认收起 */
  searchDefaultCollapsed?: boolean;
  /** 是否在右侧操作栏内置「导出」按钮：点击打开 vxe-table 原生高级导出弹窗 */
  actionExport?: boolean;
  /** actionExport 导出文件名（不含扩展名），缺省「导出_时间戳」 */
  exportFilename?: string;
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
  height: '100%',
  treeConfig: undefined,
  checkboxConfig: undefined,
  rowConfig: undefined,
  searchItems: undefined,
  searchModel: undefined,
  searchDefaultCollapsed: true,
  actionExport: false,
  exportFilename: undefined
});

/** vxe-table 实例（原生导出按钮要用它的 openExport/exportData） */
const tableRef = ref<VxeExportableTable | null>(null);

/** 高级导出默认配置 */
const exportConfig = computed<VxeTablePropTypes.ExportConfig>(() => ({
  type: 'xlsx',
  filename: props.exportFilename || createDefaultExportName(),
  sheetName: 'Sheet1'
}));

/** action-export：打开 vxe-table 原生高级导出弹窗 */
function handleNativeExport() {
  const instance = tableRef.value;
  if (!instance?.openExport) {
    window.$message?.error($t('common.exportFailed'));
    return;
  }
  try {
    instance.openExport(exportConfig.value);
  } catch (error) {
    console.error('vxe openExport failed', error);
    window.$message?.error($t('common.exportFailed'));
  }
}

/** 搜索栏是否收起（默认收起，让表格更清爽） */
const searchCollapsed = ref(props.searchDefaultCollapsed);

const actionJustify = computed(() => {
  if (props.actionAlign === 'center') return 'justify-center';
  if (props.actionAlign === 'right') return 'justify-end';
  return 'justify-start';
});

const finalRowConfig = computed<VxeTablePropTypes.RowConfig>(() => ({
  isHover: true,
  height: 40,
  ...props.rowConfig
}));

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'pageChange', pagination: { current: number; size: number }): void;
  (e: 'selectionChange', records: any[], indeterminates: any[]): void;
  (e: 'afterRender'): void;
  (e: 'detail', row: any): void;
  (e: 'search'): void;
  (e: 'reset'): void;
  (e: 'toggleTreeExpand', payload: { row: any; expanded: boolean }): void;
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

function handleSelectionChange() {
  const instance = tableRef.value;
  const records = instance?.getCheckboxRecords?.() ?? [];
  const indeterminates = instance?.getCheckboxIndeterminateRecords?.() ?? [];
  // 半选父节点（部分子节点勾选）也要纳入勾选集合，否则提交 menuIds 会丢失父菜单
  emit('selectionChange', records, indeterminates);
}

function handleToggleTreeExpand(params: any) {
  emit('toggleTreeExpand', { row: params.row, expanded: params.treeExpanded ?? params.expanded ?? false });
}

/** 获取当前勾选行，供调用方（如权限勾选抽屉）读取最终勾选结果 */
function getCheckboxRecords(): Record<string, unknown>[] {
  return tableRef.value?.getCheckboxRecords?.() ?? [];
}

/** 勾选 / 取消勾选全部行 */
async function setAllCheckboxRow(checked: boolean) {
  await tableRef.value?.setAllCheckboxRow?.(checked);
}

function setTreeExpand(rows: any[], expanded: boolean) {
  (tableRef.value as any)?.setTreeExpand?.(rows, expanded);
}

defineExpose({ getCheckboxRecords, setAllCheckboxRow, setTreeExpand });
</script>

<template>
  <div class="h-full w-full flex flex-col min-h-0">
    <div v-if="searchItems?.length" :class="{ 'mb-12px': !searchCollapsed }">
      <SearchBar
        :items="searchItems"
        :model="searchModel ?? {}"
        :collapsed="searchCollapsed"
        @search="emit('search')"
        @reset="emit('reset')"
      />
    </div>

    <div class="mb-12px flex-y-center justify-between gap-12px">
      <div class="flex-y-center gap-8px flex-wrap">
        <slot name="operation-left" :refresh="refresh" />
      </div>
      <div class="flex-y-center gap-8px flex-wrap justify-end">
        <NButton v-if="actionExport" size="small" @click="handleNativeExport">
          <!--          {{ $t('common.export') }}-->
          <template #icon>
            <icon-mdi-download class="text-icon" />
          </template>
        </NButton>
        <slot name="operation-right" :refresh="refresh" />
        <NButton
          v-if="searchItems?.length"
          size="small"
          :type="searchCollapsed ? 'default' : 'primary'"
          :title="$t('common.search')"
          @click="searchCollapsed = !searchCollapsed"
        >
          <template #icon><icon-ic-round-search class="text-icon" /></template>
        </NButton>
      </div>
    </div>

    <div class="w-full min-h-0 bg-white" :class="height === '100%' ? 'flex-1' : ''">
      <vxe-table
        ref="tableRef"
        :data="data"
        :border="border"
        :stripe="stripe"
        :row-config="finalRowConfig"
        :column-config="{ resizable: true }"
        :seq-config="{ startIndex: seqStartIndex }"
        :height="height"
        :loading="loading"
        show-overflow="tooltip"
        :export-config="exportConfig"
        :tree-config="treeConfig"
        :checkbox-config="checkboxConfig"
        class="w-full table-draggable"
        @checkbox-change="handleSelectionChange"
        @checkbox-all="handleSelectionChange"
        @after-render="$emit('afterRender')"
        @toggle-tree-expand="handleToggleTreeExpand"
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
          :tree-node="col.treeNode"
        >
          <template v-if="$slots[col.key]" #default="scope">
            <slot :name="col.key" v-bind="scope" />
          </template>
          <template v-else-if="col.type === 'status'" #default="{ row }">
            <NTag size="small" :type="row[col.key] === (col.activeValue ?? 1) ? 'success' : 'error'">
              {{ row[col.key] === (col.activeValue ?? 1) ? $t('common.enable') : $t('common.disable') }}
            </NTag>
          </template>
          <template v-else-if="col.type === 'detail'" #default="{ row }">
            <Link type="primary" icon-position="right" icon-hover @click="emit('detail', row)">
              {{ row[col.key] }}
              <template #icon>
                <NTooltip trigger="hover">
                  <template #trigger>
                    <span class="vxe-link-icon" @click.stop="handleCopy(row[col.key])">
                      <IconRenderer icon="vicons:ionicons5:Copy" :size="14" />
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
      >
        <template #prefix>
          <span class="mr-8px">{{ $t('datatable.itemCount', { total: pagination.total }) }}</span>
        </template>
      </NPagination>
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
