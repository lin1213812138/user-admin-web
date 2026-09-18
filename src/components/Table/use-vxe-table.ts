import { computed, onMounted, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { useBoolean, useLoading } from '@sa/hooks';
import { jsonClone } from '@sa/utils';

export interface VxeColumnConfig {
  key: string;
  title: string;
  type?: 'status' | 'detail';
  activeValue?: string | number;
  visible: boolean;
  width?: number | null;
  minWidth?: number | null;
  fixed?: '' | 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  sortable: boolean;
  /** mark as vxe-table tree-node column (renders indent + ▷ arrow) */
  treeNode?: boolean;
  /** 自定义表头插槽名（如列全选复选框），插槽由业务页面提供 */
  headerSlot?: string;
}

export type VxeColumnRenderColumn = {
  key: string;
  title: string;
  /** 内置列类型：status 自动渲染启用/禁用标签，detail 自动渲染可点击复制的文本，无需业务写 slot */
  type?: 'status' | 'detail';
  /** status 类型生效的启用值，默认 '1' */
  activeValue?: string | number;
  visible?: boolean;
  width?: number;
  minWidth?: number;
  fixed?: '' | 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  /** mark as vxe-table tree-node column (renders indent + ▷ arrow) */
  treeNode?: boolean;
  /** 自定义表头插槽名（如列全选复选框），插槽由业务页面提供 */
  headerSlot?: string;
};

export interface VxePagination {
  current: number;
  size: number;
  total: number;
}

interface UseVxeTableOptions<ResponseData, ApiData> {
  api: (params: { current: number; size: number }) => Promise<ResponseData>;
  transform: (response: ResponseData) => { records: ApiData[]; total: number };
  columns: () => VxeColumnConfig[];
  immediate?: boolean;
  defaultPageSize?: number;
  /** 列配置缓存 key，按组件/页面名缓存到 localStorage，不传则不缓存 */
  cacheKey?: string;
  /** 延迟取数（默认开启）：挂载后推迟到下一帧（或 lazyDelay 毫秒）再首次取数，避免与 tab 切换 / 页面进入的过渡动画抢帧；keep-alive 切回不会重复取数。设为 false 则走即时取数（immediate） */
  lazy?: boolean;
  /** lazy 为 true 时，首次取数前的等待毫秒数；传 0（默认）则推迟到下一帧 requestAnimationFrame */
  lazyDelay?: number;
}

const COLUMN_CACHE_PREFIX = 'vxe-table-column:';

function loadColumnCache(cacheKey: string): VxeColumnConfig[] | null {
  try {
    const raw = localStorage.getItem(COLUMN_CACHE_PREFIX + cacheKey);
    return raw ? (JSON.parse(raw) as VxeColumnConfig[]) : null;
  } catch {
    return null;
  }
}

function saveColumnCache(cacheKey: string, configs: VxeColumnConfig[]) {
  try {
    localStorage.setItem(COLUMN_CACHE_PREFIX + cacheKey, JSON.stringify(configs));
  } catch {
    // ignore quota / serialization errors
  }
}

export function useVxeTable<ResponseData, ApiData>(options: UseVxeTableOptions<ResponseData, ApiData>) {
  const { loading, startLoading, endLoading } = useLoading();
  const { bool: empty, setBool: setEmpty } = useBoolean();

  const data = ref([]) as Ref<ApiData[]>;
  const initialConfigs = options.columns();
  const columnConfigs = ref(jsonClone(initialConfigs)) as Ref<VxeColumnConfig[]>;

  // 应用本地缓存：按缓存的顺序排列，并用缓存的字段覆盖默认值
  if (options.cacheKey) {
    const cached = loadColumnCache(options.cacheKey);
    if (cached?.length) {
      const map = new Map(initialConfigs.map(c => [c.key, c]));
      columnConfigs.value = cached.map(saved => {
        const def = map.get(saved.key);
        return def ? { ...def, ...saved } : saved;
      });
    }
  }

  const pagination = reactive<VxePagination>({
    current: 1,
    // 全局默认每页条数（页面可通过 defaultPageSize 覆盖）；与 Table 分页条选项首项 50 对齐
    size: options.defaultPageSize ?? 50,
    total: 0
  });

  const columns = computed<VxeColumnRenderColumn[]>(() =>
    columnConfigs.value
      // a tree-node column must always render; otherwise the table loses its
      // indent + ▷ arrow and the tree collapses to a flat list.
      .filter(col => col.visible || col.treeNode)
      .map(col => ({
        key: col.key,
        title: col.title,
        type: col.type,
        activeValue: col.activeValue,
        visible: col.visible,
        width: col.width ?? undefined,
        minWidth: col.minWidth ?? undefined,
        fixed: col.fixed || undefined,
        align: col.align,
        sortable: col.sortable,
        treeNode: col.treeNode,
        headerSlot: col.headerSlot
      }))
  );

  async function getData() {
    try {
      startLoading();
      const response = await options.api({ current: pagination.current, size: pagination.size });
      const { records, total } = options.transform(response);
      data.value = records;
      pagination.total = total;
      setEmpty(data.value.length === 0);
    } finally {
      endLoading();
    }
  }

  function resetColumns() {
    columnConfigs.value = jsonClone(initialConfigs);
    if (options.cacheKey) {
      localStorage.removeItem(COLUMN_CACHE_PREFIX + options.cacheKey);
    }
  }

  /** 确认保存列配置：写入 localStorage 缓存 */
  function persistColumns() {
    if (options.cacheKey) {
      saveColumnCache(options.cacheKey, columnConfigs.value);
    }
  }

  // lazy 默认开启：挂载后推迟到下一帧（或 lazyDelay 毫秒）再首次取数，避免抢帧卡顿。
  // 仅首次挂载取一次，keep-alive 切回不重复取；非 keep-alive 表格也会正常取数（onMounted 总会触发）。
  if (options.lazy ?? true) {
    let fetched = false;
    onMounted(() => {
      if (fetched) return;
      fetched = true;
      const delay = options.lazyDelay ?? 0;
      if (delay > 0) {
        setTimeout(() => getData(), delay);
      } else {
        requestAnimationFrame(() => getData());
      }
    });
  } else if (options.immediate ?? true) {
    getData();
  }

  return {
    data,
    loading,
    empty,
    columnConfigs,
    columns,
    pagination,
    getData,
    resetColumns,
    persistColumns
  };
}
