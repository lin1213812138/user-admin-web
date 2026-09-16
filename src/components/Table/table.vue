<script setup lang="ts">
import { computed, ref } from 'vue';
import { useThemeVars } from 'naive-ui';
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
  // rowConfig?: VxeTablePropTypes.RowConfig;
  cellConfig?: VxeTablePropTypes.CellConfig;
  /** vxe-table header-cell-config, e.g. { height: 35 } to align fixed columns' header */
  headerCellConfig?: VxeTablePropTypes.HeaderCellConfig;
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
  /** vxe-table scroll-y 阈值：仅当数据行数超过该值时才启用虚拟滚动（默认 200） */
  virtualScrollRowThreshold?: number;
  /** vxe-table show-overflow，默认 'tooltip'；树表行高自适应场景需传 false 以允许 vxe 实测内容高度 */
  showOverflow?: VxeTablePropTypes.ShowOverflow;
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
  cellConfig: undefined,
  headerCellConfig: undefined,
  searchItems: undefined,
  searchModel: undefined,
  searchDefaultCollapsed: true,
  actionExport: false,
  exportFilename: undefined,
  virtualScrollRowThreshold: 200,
  showOverflow: 'tooltip'
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

const finalCellConfig = computed<VxeTablePropTypes.CellConfig>(() => ({
  isHover: true,
  height: 40,
  ...props.cellConfig
}));

/** 表头单元格默认高度 40（与行高一致），业务可传入 headerCellConfig 覆盖 height / padding */
const finalHeaderCellConfig = computed<VxeTablePropTypes.HeaderCellConfig | undefined>(() => ({
  height: 40,
  ...props.headerCellConfig
}));

/** 虚拟滚动门控：仅当数据行数超过阈值时才启用虚拟渲染，否则走普通渲染（避免小数据量下虚拟滚动的额外开销） */
const scrollYConfig = computed<VxeTablePropTypes.ScrollY>(() => ({
  enabled: true,
  gt: props.virtualScrollRowThreshold
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

const themeVars = useThemeVars();

/** 复制图标跟随主题色（含 hover 态），随主题切换自动更新 */
const copyIconStyle = computed(() => ({
  '--vxe-copy-color': themeVars.value.primaryColor,
  '--vxe-copy-hover-color': themeVars.value.primaryColorHover
}));

/**
 * 当前鼠标所在行的 rowid。vxe-table 会把固定列拆成独立的 <tr>，纯 CSS :hover 无法跨
 * 主区/固定列关联同一行，因此用事件委托读 tr[rowid] 自行维护 hover 行。
 */
const hoverRowId = ref<string | null>(null);

function handleRowMouseOver(evt: MouseEvent) {
  const tr = (evt.target as HTMLElement | null)?.closest?.('tr[rowid]');
  const rowid = tr?.getAttribute('rowid') ?? null;
  if (rowid !== hoverRowId.value) {
    hoverRowId.value = rowid;
  }
}

function handleTableMouseLeave() {
  hoverRowId.value = null;
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
    <div v-if="searchItems?.length">
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

    <!-- overflow-hidden：高度动画期间 vxe 表格内部高度仍是旧值，不裁剪会溢出顶出整体滚动条 -->
    <div
      class="w-full min-h-0 overflow-hidden bg-white"
      :class="height === '100%' ? 'flex-1 h-full' : ''"
      @mouseover="handleRowMouseOver"
      @mouseleave="handleTableMouseLeave"
    >
      <vxe-table
        ref="tableRef"
        :data="data"
        :border="border"
        :stripe="stripe"
        :cell-config="finalCellConfig"
        :column-config="{ resizable: true }"
        :sort-config="{ trigger: 'cell' }"
        :seq-config="{ startIndex: seqStartIndex }"
        :height="height"
        :loading="loading"
        :scroll-y="scrollYConfig"
        :export-config="exportConfig"
        :tree-config="treeConfig"
        :checkbox-config="checkboxConfig"
        :show-overflow="showOverflow"
        :header-cell-config="finalHeaderCellConfig"
        :scrollbar-config="{ width: 0, height: 0.0001, x: { visible: true }, y: { visible: true } }"
        class="w-full table-draggable"
        :class="height === '100%' ? 'h-full' : ''"
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
          <template v-else-if="col.type === 'detail'" #default="{ row, rowid }">
            <Link type="primary" @click="emit('detail', row)">{{ row[col.key] }}</Link>
            <NTooltip trigger="hover">
              <template #trigger>
                <span
                  class="vxe-cell-copy"
                  :class="{ 'is-hover': hoverRowId === rowid }"
                  :style="copyIconStyle"
                  @click="handleCopy(row[col.key])"
                >
                  <IconRenderer icon="vicons:ionicons5:Copy" :size="14" />
                </span>
              </template>
              <span>{{ $t('common.copy') }}</span>
            </NTooltip>
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
          <NEmpty description="无数据" />
          <!-- <span class="text-14px text-#909399">{{ $t('common.noData') }}</span> -->
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
/** copy 图标常占位（避免 hover 时行内元素跳动），仅在鼠标悬停整行时显形 */
.vxe-cell-copy {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 4px;
  vertical-align: middle;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  color: var(--vxe-copy-color, currentColor);
  transition:
    opacity 0.2s,
    color 0.2s;
}

.vxe-body--row:hover .vxe-cell-copy,
.vxe-cell-copy.is-hover {
  opacity: 1;
  pointer-events: auto;
}

.vxe-cell-copy:hover {
  color: var(--vxe-copy-hover-color, var(--vxe-copy-color, currentColor));
}
</style>
