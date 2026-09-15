# 轨迹抓取配置页重构（合并「操作轨迹」）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将「操作轨迹」从顶层 tab 合并进「轨迹抓取配置」作为第 5 个子 tab，并用通用表格（`useVxeTable` + `Table` + `NFormWrap` 抽屉）替换当前占位实现。

**Architecture:** `TraceCapture.vue` 作为「子 tab 壳」管理 `active` 子 tab，渲染 `TraceConfigTable`（前 4 个同构 tab 复用）或 `OperationTraceTable`；表格与抽屉沿用 `init-data` / `print-format` 既有模式；数据走 DEV mock（与 `fetchGetInitDataList` 同模式，按 `import.meta.env.DEV` 分支）。

**Tech Stack:** Vue 3 `<script setup>` + TypeScript、`naive-ui`、`@/components/Table`（`useVxeTable` + `Table` + `TableColumnConfig`）、`@/components/Form`（`NFormWrap`）、`@/components/common/drawer.vue`（`SiteDrawer`）、`@/service/api/mock.ts` 本地 mock。

## 验证方式说明（无单测）

本仓库未配置单元测试框架。每个任务的验证 gate 为：

- `npm run typecheck`（`vue-tsc --noEmit --skipLibCheck`）通过
- `npm run lint`（`oxlint --fix && eslint --fix .`）通过
- 全部任务完成后用 `npm run dev`（dev 模式即 `vite --mode test`，DEV 分支 mock 生效）手动验证 5 个子 tab 的表格/抽屉/列设置。

## Global Constraints

- 数据仅 DEV mock，**不接真实后端**；mock 函数写在 `@/service/api/mock.ts`，导出函数写在 `@/service/api/system-manage.ts` 并按 `if (import.meta.env.DEV)` 分支调用（逐字对齐 spec A1）。
- **不实现「删除」功能**，操作列仅「编辑」（逐字对齐 spec A2）。
- 前 4 个 tab 的「名称」列标题随当前子 tab 名动态显示（逐字对齐 spec A3）。
- i18n 中英文同步；`src/typings/app.d.ts` 中的 `LocaleMessage` 类型需与 `zh-cn.ts` 实际结构保持一致（该文件为手动 i18n 类型声明，漏改会致 typecheck 失败）。
- 列表类型统一用 `Api.Common.PaginatingQueryRecord<T>`；搜索参数用 `Api.Common.CommonSearchParams & {...}`。

---

### Task 1: 新增类型定义

**Files:**

- Modify: `src/typings/api/system-manage.d.ts`（在 `Api.SystemManage` 命名空间内、`InitData` 类型块之后追加）

**Interfaces:**

- Produces: `Api.SystemManage.TraceCaptureCategory`、`TraceConfigItem`、`TraceConfigList`、`TraceConfigSearchParams`、`TraceConfigCreateParams`、`TraceConfigUpdateParams`、`OperationTraceItem`、`OperationTraceList`、`OperationTraceSearchParams`、`OperationTraceCreateParams`、`OperationTraceUpdateParams`（后续任务 import 这些类型）

- [ ] **Step 1: 在命名空间内追加类型**

在 `InitDataUpdateParams`（`type InitDataUpdateParams = InitDataCreateParams & { id: number };`）之后追加：

```ts
/** 轨迹抓取 - 前 4 个同构子 tab 分类 */
type TraceCaptureCategory = 'track-network' | 'track-transform' | 'track-keyword' | 'capture-time';

interface TraceConfigItem {
  id: number;
  category: Api.SystemManage.TraceCaptureCategory;
  name: string;
  serverAddress: string;
  systemType: string;
  lastEditor: string;
  editTime: string;
}

type TraceConfigList = Api.Common.PaginatingQueryRecord<TraceConfigItem>;

type TraceConfigSearchParams = Api.Common.CommonSearchParams & {
  category: Api.SystemManage.TraceCaptureCategory;
};

type TraceConfigCreateParams = {
  category: Api.SystemManage.TraceCaptureCategory;
  name: string;
  serverAddress: string;
  systemType: string;
};

type TraceConfigUpdateParams = TraceConfigCreateParams & { id: number };

interface OperationTraceItem {
  id: number;
  node: string;
  timeFormat: string;
  location: string;
  description: string;
  published: Api.Common.EnableStatus;
}

type OperationTraceList = Api.Common.PaginatingQueryRecord<OperationTraceItem>;

type OperationTraceSearchParams = Api.Common.CommonSearchParams;

type OperationTraceCreateParams = Omit<Api.SystemManage.OperationTraceItem, 'id'>;

type OperationTraceUpdateParams = Api.SystemManage.OperationTraceItem;
```

- [ ] **Step 2: 类型检查**

Run: `npm run typecheck`
Expected: PASS（仅新增类型，无引用，不应报错）

- [ ] **Step 3: Commit**

```bash
git add src/typings/api/system-manage.d.ts
git commit -m "feat(setting): add trace-capture & operation-trace types"
```

---

### Task 2: 新增 DEV mock 与 service 导出函数

**Files:**

- Modify: `src/service/api/mock.ts`（在 init-data mock 数组/函数之后追加）
- Modify: `src/service/api/system-manage.ts`（顶部 mock import 块 + 新增 6 个导出函数）

**Interfaces:**

- Consumes: Task 1 的类型；复用 `mock.ts` 已有的 `CURRENT_OPERATOR` 与 `todayStr()` 辅助函数
- Produces: `mockGetTraceConfigList` / `mockCreateTraceConfig` / `mockUpdateTraceConfig` / `mockGetOperationTraceList` / `mockCreateOperationTrace` / `mockUpdateOperationTrace`（在 `system-manage.ts` 导出）

- [ ] **Step 1: 在 mock.ts 追加内存数组与 mock 函数**

在 `mockDeleteInitData` 函数（文件末尾附近）之后追加：

```ts
// ---------- 轨迹抓取配置（前 4 个同构子 tab） ----------
const traceConfigItems: Api.SystemManage.TraceConfigItem[] = [
  {
    id: 1,
    category: 'track-network',
    name: '主追踪网络',
    serverAddress: '10.0.0.1:8080',
    systemType: 'WMS',
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr()
  },
  {
    id: 2,
    category: 'track-network',
    name: '备用追踪网络',
    serverAddress: '10.0.0.2:8080',
    systemType: 'OMS',
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr()
  },
  {
    id: 3,
    category: 'track-transform',
    name: '轨迹转换A',
    serverAddress: '10.0.1.1:9000',
    systemType: 'WMS',
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr()
  },
  {
    id: 4,
    category: 'track-keyword',
    name: '关键词匹配',
    serverAddress: '10.0.2.1:7000',
    systemType: 'RULE',
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr()
  },
  {
    id: 5,
    category: 'capture-time',
    name: '定时抓取',
    serverAddress: '10.0.3.1:6000',
    systemType: 'CRON',
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr()
  }
];

export function mockGetTraceConfigList(
  params: Api.SystemManage.TraceConfigSearchParams
): Api.SystemManage.TraceConfigList {
  const { current = 1, size = 20, category } = params;
  const filtered = traceConfigItems.filter(item => item.category === category);
  const start = (current - 1) * size;
  return {
    records: filtered.slice(start, start + size),
    current,
    size,
    total: filtered.length
  };
}

export function mockCreateTraceConfig(
  params: Api.SystemManage.TraceConfigCreateParams
): Api.SystemManage.TraceConfigItem {
  const id = traceConfigItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const item: Api.SystemManage.TraceConfigItem = {
    id,
    lastEditor: CURRENT_OPERATOR,
    editTime: todayStr(),
    ...params
  };
  traceConfigItems.unshift(item);
  return item;
}

export function mockUpdateTraceConfig(
  params: Api.SystemManage.TraceConfigUpdateParams
): Api.SystemManage.TraceConfigItem {
  const index = traceConfigItems.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.TraceConfigItem = {
    ...traceConfigItems[index],
    ...params,
    editTime: todayStr()
  };
  traceConfigItems.splice(index, 1, updated);
  return updated;
}

// ---------- 操作轨迹 ----------
const operationTraceItems: Api.SystemManage.OperationTraceItem[] = [
  { id: 1, node: '揽收', timeFormat: 'YYYY-MM-DD HH:mm', location: '深圳', description: '包裹揽收入库', published: 1 },
  {
    id: 2,
    node: '分拣',
    timeFormat: 'YYYY-MM-DD HH:mm',
    location: '广州',
    description: '按目的地进行分拣',
    published: 1
  },
  { id: 3, node: '出库', timeFormat: 'YYYY-MM-DD', location: '上海', description: '装车出库', published: 0 }
];

export function mockGetOperationTraceList(
  params: Api.SystemManage.OperationTraceSearchParams
): Api.SystemManage.OperationTraceList {
  const { current = 1, size = 20 } = params;
  const start = (current - 1) * size;
  return {
    records: operationTraceItems.slice(start, start + size),
    current,
    size,
    total: operationTraceItems.length
  };
}

export function mockCreateOperationTrace(
  params: Api.SystemManage.OperationTraceCreateParams
): Api.SystemManage.OperationTraceItem {
  const id = operationTraceItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const item: Api.SystemManage.OperationTraceItem = { id, ...params };
  operationTraceItems.unshift(item);
  return item;
}

export function mockUpdateOperationTrace(
  params: Api.SystemManage.OperationTraceUpdateParams
): Api.SystemManage.OperationTraceItem {
  const index = operationTraceItems.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.OperationTraceItem = { ...operationTraceItems[index], ...params };
  operationTraceItems.splice(index, 1, updated);
  return updated;
}
```

- [ ] **Step 2: 在 system-manage.ts 顶部 mock import 块追加导入**

找到现有 mock import 块（含 `mockGetInitDataList, mockCreateInitData, mockUpdateInitData, mockDeleteInitData`），在其后追加：

```ts
(mockGetTraceConfigList,
  mockCreateTraceConfig,
  mockUpdateTraceConfig,
  mockGetOperationTraceList,
  mockCreateOperationTrace,
  mockUpdateOperationTrace);
```

- [ ] **Step 3: 在 system-manage.ts 末尾追加导出函数（DEV 分支）**

```ts
/** get trace config list (前 4 个同构子 tab) */
export function fetchGetTraceConfigList(params: Api.SystemManage.TraceConfigSearchParams) {
  if (import.meta.env.DEV) {
    return mockGetTraceConfigList(params) as unknown as Promise<Api.SystemManage.TraceConfigList>;
  }
  return request<Api.SystemManage.TraceConfigList>({
    url: '/system/trace-config/list',
    method: 'post',
    data: params
  });
}

/** create trace config */
export function fetchCreateTraceConfig(params: Api.SystemManage.TraceConfigCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateTraceConfig(params) as unknown as Promise<Api.SystemManage.TraceConfigItem>;
  }
  return request<Api.SystemManage.TraceConfigItem>({
    url: '/system/trace-config/create',
    method: 'post',
    data: params
  });
}

/** update trace config */
export function fetchUpdateTraceConfig(params: Api.SystemManage.TraceConfigUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateTraceConfig(params) as unknown as Promise<Api.SystemManage.TraceConfigItem>;
  }
  return request<Api.SystemManage.TraceConfigItem>({
    url: '/system/trace-config/update',
    method: 'post',
    data: params
  });
}

/** get operation trace list */
export function fetchGetOperationTraceList(params: Api.SystemManage.OperationTraceSearchParams) {
  if (import.meta.env.DEV) {
    return mockGetOperationTraceList(params) as unknown as Promise<Api.SystemManage.OperationTraceList>;
  }
  return request<Api.SystemManage.OperationTraceList>({
    url: '/system/operation-trace/list',
    method: 'post',
    data: params
  });
}

/** create operation trace */
export function fetchCreateOperationTrace(params: Api.SystemManage.OperationTraceCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateOperationTrace(params) as unknown as Promise<Api.SystemManage.OperationTraceItem>;
  }
  return request<Api.SystemManage.OperationTraceItem>({
    url: '/system/operation-trace/create',
    method: 'post',
    data: params
  });
}

/** update operation trace */
export function fetchUpdateOperationTrace(params: Api.SystemManage.OperationTraceUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateOperationTrace(params) as unknown as Promise<Api.SystemManage.OperationTraceItem>;
  }
  return request<Api.SystemManage.OperationTraceItem>({
    url: '/system/operation-trace/update',
    method: 'post',
    data: params
  });
}
```

- [ ] **Step 4: 类型检查**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/service/api/mock.ts src/service/api/system-manage.ts
git commit -m "feat(setting): add trace-capture & operation-trace mock + service"
```

---

### Task 3: i18n 扩展（zh-cn / en-us / app.d.ts）

**Files:**

- Modify: `src/locales/langs/zh-cn.ts`（行 ~572，将 `traceCapture: '轨迹抓取配置'` 改为对象；删除 `operationTrace: 'Operation Trace Config'` 顶层 key）
- Modify: `src/locales/langs/en-us.ts`（行 ~576，将 `traceCapture: 'Trace Capture Config'` 改为对象；删除 `operationTrace` 顶层 key）
- Modify: `src/typings/app.d.ts`（行 ~837，将 `traceCapture: string;` 改为嵌套对象；删除行 ~866 `operationTrace: string;`）

**Interfaces:**

- Produces: i18n key `page.manage.setting.traceCapture.{title,subTab.*,col.*,form.*,createTitle,editTitle}`（Task 4/5/6 引用）

- [ ] **Step 1: 修改 zh-cn.ts**

将：

```ts
        traceCapture: '轨迹抓取配置',
```

替换为：

```ts
        traceCapture: {
          title: '轨迹抓取配置',
          subTab: {
            trackNetwork: '追踪网络',
            trackTransform: '轨迹改造',
            trackKeyword: '轨迹关键词',
            captureTime: '抓取时间',
            operationTrace: '操作轨迹'
          },
          col: {
            name: '名称',
            serverAddress: '服务器地址',
            systemType: '系统类型',
            lastEditor: '最后编辑',
            editTime: '编辑时间',
            node: '操作节点',
            timeFormat: '时间格式',
            location: '服务地点',
            description: '详细描述',
            published: '是否发布'
          },
          form: {
            name: '名称',
            namePlaceholder: '请输入名称',
            serverAddress: '服务器地址',
            serverAddressPlaceholder: '请输入服务器地址',
            systemType: '系统类型',
            systemTypePlaceholder: '请输入系统类型',
            node: '操作节点',
            nodePlaceholder: '请输入操作节点',
            timeFormat: '时间格式',
            timeFormatPlaceholder: '如 YYYY-MM-DD HH:mm',
            location: '服务地点',
            locationPlaceholder: '请输入服务地点',
            description: '详细描述',
            descriptionPlaceholder: '请输入详细描述',
            published: '是否发布'
          },
          createTitle: '新增',
          editTitle: '编辑'
        },
```

并删除 zh-cn.ts 中的 `operationTrace: 'Operation Trace Config',`（保持缩进与相邻 `fieldMapping` 同级）。

- [ ] **Step 2: 修改 en-us.ts**

将：

```ts
        traceCapture: 'Trace Capture Config',
```

替换为：

```ts
        traceCapture: {
          title: 'Trace Capture Config',
          subTab: {
            trackNetwork: 'Track Network',
            trackTransform: 'Track Transform',
            trackKeyword: 'Track Keyword',
            captureTime: 'Capture Time',
            operationTrace: 'Operation Trace'
          },
          col: {
            name: 'Name',
            serverAddress: 'Server Address',
            systemType: 'System Type',
            lastEditor: 'Last Editor',
            editTime: 'Edit Time',
            node: 'Node',
            timeFormat: 'Time Format',
            location: 'Location',
            description: 'Description',
            published: 'Published'
          },
          form: {
            name: 'Name',
            namePlaceholder: 'Please enter name',
            serverAddress: 'Server Address',
            serverAddressPlaceholder: 'Please enter server address',
            systemType: 'System Type',
            systemTypePlaceholder: 'Please enter system type',
            node: 'Node',
            nodePlaceholder: 'Please enter node',
            timeFormat: 'Time Format',
            timeFormatPlaceholder: 'e.g. YYYY-MM-DD HH:mm',
            location: 'Location',
            locationPlaceholder: 'Please enter location',
            description: 'Description',
            descriptionPlaceholder: 'Please enter description',
            published: 'Published'
          },
          createTitle: 'Create',
          editTitle: 'Edit'
        },
```

并删除 en-us.ts 中的 `operationTrace: 'Operation Trace Config',`。

- [ ] **Step 3: 修改 app.d.ts 的 LocaleMessage 类型**

将行 ~837：

```ts
traceCapture: string;
```

替换为：

```ts
traceCapture: {
  title: string;
  subTab: {
    trackNetwork: string;
    trackTransform: string;
    trackKeyword: string;
    captureTime: string;
    operationTrace: string;
  }
  col: {
    name: string;
    serverAddress: string;
    systemType: string;
    lastEditor: string;
    editTime: string;
    node: string;
    timeFormat: string;
    location: string;
    description: string;
    published: string;
  }
  form: {
    name: string;
    namePlaceholder: string;
    serverAddress: string;
    serverAddressPlaceholder: string;
    systemType: string;
    systemTypePlaceholder: string;
    node: string;
    nodePlaceholder: string;
    timeFormat: string;
    timeFormatPlaceholder: string;
    location: string;
    locationPlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    published: string;
  }
  createTitle: string;
  editTitle: string;
}
```

并删除行 ~866：

```ts
operationTrace: string;
```

- [ ] **Step 4: 类型检查（验证 i18n key 与 app.d.ts 一致）**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/locales/langs/zh-cn.ts src/locales/langs/en-us.ts src/typings/app.d.ts
git commit -m "feat(setting): extend traceCapture i18n, drop operationTrace top-level key"
```

---

### Task 4: 前 4 个同构子 tab —— TraceConfigTable + TraceConfigDrawer

**Files:**

- Create: `src/views/system-manage/setting/modules/trace-capture/TraceConfigTable.vue`
- Create: `src/views/system-manage/setting/modules/trace-capture/TraceConfigDrawer.vue`

**Interfaces:**

- Consumes: Task 1/2/3 类型、service 函数、i18n key
- Produces: `TraceConfigTable`（props: `category: TraceCaptureCategory`）、`TraceConfigDrawer`（被 TraceConfigTable 引用）

- [ ] **Step 1: 创建 TraceConfigTable.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { NButton } from 'naive-ui';
import { fetchGetTraceConfigList, type Api } from '@/service/api/system-manage';
import TraceConfigDrawer from './TraceConfigDrawer.vue';

const props = defineProps<{ category: Api.SystemManage.TraceCaptureCategory }>();

const categoryTabKey: Record<
  Api.SystemManage.TraceCaptureCategory,
  'trackNetwork' | 'trackTransform' | 'trackKeyword' | 'captureTime'
> = {
  'track-network': 'trackNetwork',
  'track-transform': 'trackTransform',
  'track-keyword': 'trackKeyword',
  'capture-time': 'captureTime'
};

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.TraceConfigList,
  Api.SystemManage.TraceConfigItem
>({
  api: ({ current, size }) =>
    fetchGetTraceConfigList({ category: props.category, current, size }) as Promise<Api.SystemManage.TraceConfigList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t(`page.manage.setting.traceCapture.subTab.${categoryTabKey[props.category]}`),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'serverAddress',
        title: $t('page.manage.setting.traceCapture.col.serverAddress'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'systemType',
        title: $t('page.manage.setting.traceCapture.col.systemType'),
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'lastEditor',
        title: $t('page.manage.setting.traceCapture.col.lastEditor'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'editTime',
        title: $t('page.manage.setting.traceCapture.col.editTime'),
        visible: true,
        width: 160,
        sortable: false
      }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: `trace-config-${props.category}`
});

const configVisible = ref(false);
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const drawerRow = ref<Api.SystemManage.TraceConfigItem | null>(null);

function openCreate() {
  drawerMode.value = 'create';
  drawerRow.value = null;
  drawerVisible.value = true;
}
function openEdit(row: Api.SystemManage.TraceConfigItem) {
  drawerMode.value = 'edit';
  drawerRow.value = row;
  drawerVisible.value = true;
}
function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="min-h-0 flex-1">
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-action="true"
        :action-width="120"
        @refresh="getData"
        @page-change="handlePageChange"
      >
        <template #operation-left>
          <NButton size="small" type="primary" ghost @click="openCreate">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            {{ $t('common.add') }}
          </NButton>
        </template>
        <template #operation-right>
          <NButton size="small" @click="configVisible = true">
            <template #icon><icon-mdi-cog class="text-icon" /></template>
            {{ $t('common.columnSetting') }}
          </NButton>
        </template>
        <template #action="{ row }">
          <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
        </template>
      </Table>
    </div>
    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />
    <TraceConfigDrawer
      v-model:show="drawerVisible"
      :mode="drawerMode"
      :category="props.category"
      :row="drawerRow"
      @submitted="getData"
    />
  </div>
</template>
```

- [ ] **Step 2: 创建 TraceConfigDrawer.vue**

```vue
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateTraceConfig, fetchUpdateTraceConfig, type Api } from '@/service/api/system-manage';
import SiteDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    mode?: DrawerMode;
    category?: Api.SystemManage.TraceCaptureCategory;
    row?: Api.SystemManage.TraceConfigItem | null;
  }>(),
  { show: false, mode: 'create', category: 'track-network', row: null }
);

const emit = defineEmits<{ 'update:show': [value: boolean]; submitted: [] }>();

const drawerVisible = computed({ get: () => props.show, set: val => emit('update:show', val) });
const isCreate = computed(() => props.mode === 'create');
const title = computed(() =>
  isCreate.value ? $t('page.manage.setting.traceCapture.createTitle') : $t('page.manage.setting.traceCapture.editTitle')
);
const submitting = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap>>();

const model = reactive<Api.SystemManage.TraceConfigCreateParams>({
  category: 'track-network',
  name: '',
  serverAddress: '',
  systemType: ''
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.setting.traceCapture.form.name'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.namePlaceholder')
  },
  {
    key: 'serverAddress',
    label: $t('page.manage.setting.traceCapture.form.serverAddress'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.serverAddressPlaceholder')
  },
  {
    key: 'systemType',
    label: $t('page.manage.setting.traceCapture.form.systemType'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.systemTypePlaceholder')
  }
]);

function resetForm() {
  model.category = props.category ?? 'track-network';
  model.name = '';
  model.serverAddress = '';
  model.systemType = '';
}
function fillFormByRow() {
  if (!props.row) return;
  model.category = props.row.category;
  model.name = props.row.name;
  model.serverAddress = props.row.serverAddress;
  model.systemType = props.row.systemType;
}
async function handleSubmit() {
  if (!(await formRef.value?.validate())) return;
  submitting.value = true;
  try {
    if (isCreate.value) {
      await fetchCreateTraceConfig({ ...model, category: props.category ?? 'track-network' });
      window.$message?.success($t('common.addSuccess'));
    } else {
      await fetchUpdateTraceConfig({ id: props.row!.id, ...model });
      window.$message?.success($t('common.updateSuccess'));
    }
    drawerVisible.value = false;
    emit('submitted');
  } catch (error) {
    window.$message?.error(error instanceof Error ? error.message : String(error));
  } finally {
    submitting.value = false;
  }
}
watch(
  () => props.show,
  val => {
    if (!val) return;
    if (isCreate.value) resetForm();
    else fillFormByRow();
  }
);
</script>

<template>
  <SiteDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="submitting"
    :footer="true"
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" mode="edit" />
  </SiteDrawer>
</template>
```

- [ ] **Step 3: 类型检查**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/views/system-manage/setting/modules/trace-capture/TraceConfigTable.vue src/views/system-manage/setting/modules/trace-capture/TraceConfigDrawer.vue
git commit -m "feat(setting): add trace config table & drawer (first 4 sub-tabs)"
```

---

### Task 5: 操作轨迹子 tab —— OperationTraceTable + OperationTraceDrawer

**Files:**

- Create: `src/views/system-manage/setting/modules/trace-capture/OperationTraceTable.vue`
- Create: `src/views/system-manage/setting/modules/trace-capture/OperationTraceDrawer.vue`

**Interfaces:**

- Consumes: Task 1/2/3 类型、service 函数、i18n key
- Produces: `OperationTraceTable`、`OperationTraceDrawer`（被 TraceCapture 壳引用）

- [ ] **Step 1: 创建 OperationTraceTable.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { NButton, NTag } from 'naive-ui';
import { fetchGetOperationTraceList, type Api } from '@/service/api/system-manage';
import OperationTraceDrawer from './OperationTraceDrawer.vue';

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.OperationTraceList,
  Api.SystemManage.OperationTraceItem
>({
  api: ({ current, size }) =>
    fetchGetOperationTraceList({ current, size }) as Promise<Api.SystemManage.OperationTraceList>,
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'node',
        title: $t('page.manage.setting.traceCapture.col.node'),
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'timeFormat',
        title: $t('page.manage.setting.traceCapture.col.timeFormat'),
        visible: true,
        minWidth: 160,
        sortable: false
      },
      {
        key: 'location',
        title: $t('page.manage.setting.traceCapture.col.location'),
        visible: true,
        minWidth: 120,
        sortable: false
      },
      {
        key: 'description',
        title: $t('page.manage.setting.traceCapture.col.description'),
        visible: true,
        minWidth: 200,
        sortable: false
      },
      {
        key: 'published',
        title: $t('page.manage.setting.traceCapture.col.published'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'operation-trace'
});

const configVisible = ref(false);
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const drawerRow = ref<Api.SystemManage.OperationTraceItem | null>(null);

function openCreate() {
  drawerMode.value = 'create';
  drawerRow.value = null;
  drawerVisible.value = true;
}
function openEdit(row: Api.SystemManage.OperationTraceItem) {
  drawerMode.value = 'edit';
  drawerRow.value = row;
  drawerVisible.value = true;
}
function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="min-h-0 flex-1">
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-action="true"
        :action-width="120"
        @refresh="getData"
        @page-change="handlePageChange"
      >
        <template #operation-left>
          <NButton size="small" type="primary" ghost @click="openCreate">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            {{ $t('common.add') }}
          </NButton>
        </template>
        <template #operation-right>
          <NButton size="small" @click="configVisible = true">
            <template #icon><icon-mdi-cog class="text-icon" /></template>
            {{ $t('common.columnSetting') }}
          </NButton>
        </template>
        <template #published="{ row }">
          <NTag v-if="row.published === 1" size="small" type="success">{{ $t('common.yes') }}</NTag>
          <NTag v-else size="small" type="default">{{ $t('common.no') }}</NTag>
        </template>
        <template #action="{ row }">
          <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
        </template>
      </Table>
    </div>
    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />
    <OperationTraceDrawer v-model:show="drawerVisible" :mode="drawerMode" :row="drawerRow" @submitted="getData" />
  </div>
</template>
```

注意：`#published` slot 的 key 必须与列 `key: 'published'` 一致才能命中；若 `common.yes/no` 不存在，改用 `page.manage.setting.traceCapture.col.published` 的「是/否」文案（见 Task 3 已含 `published`，仅用于列标题，发布状态展示文案可直接用 `$t('common.yes')`/`$t('common.no')`，SOY 框架自带）。

- [ ] **Step 2: 创建 OperationTraceDrawer.vue**

```vue
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateOperationTrace, fetchUpdateOperationTrace, type Api } from '@/service/api/system-manage';
import SiteDrawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    mode?: DrawerMode;
    row?: Api.SystemManage.OperationTraceItem | null;
  }>(),
  { show: false, mode: 'create', row: null }
);

const emit = defineEmits<{ 'update:show': [value: boolean]; submitted: [] }>();

const drawerVisible = computed({ get: () => props.show, set: val => emit('update:show', val) });
const isCreate = computed(() => props.mode === 'create');
const title = computed(() =>
  isCreate.value ? $t('page.manage.setting.traceCapture.createTitle') : $t('page.manage.setting.traceCapture.editTitle')
);
const submitting = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap>>();

const model = reactive<Api.SystemManage.OperationTraceCreateParams>({
  node: '',
  timeFormat: '',
  location: '',
  description: '',
  published: 0
});

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'node',
    label: $t('page.manage.setting.traceCapture.form.node'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.nodePlaceholder')
  },
  {
    key: 'timeFormat',
    label: $t('page.manage.setting.traceCapture.form.timeFormat'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.timeFormatPlaceholder')
  },
  {
    key: 'location',
    label: $t('page.manage.setting.traceCapture.form.location'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.locationPlaceholder')
  },
  {
    key: 'description',
    label: $t('page.manage.setting.traceCapture.form.description'),
    type: 'textarea',
    span: 24,
    placeholder: $t('page.manage.setting.traceCapture.form.descriptionPlaceholder')
  },
  {
    key: 'published',
    label: $t('page.manage.setting.traceCapture.form.published'),
    type: 'switch',
    span: 24,
    checkedValue: 1,
    uncheckedValue: 0
  }
]);

function resetForm() {
  model.node = '';
  model.timeFormat = '';
  model.location = '';
  model.description = '';
  model.published = 0;
}
function fillFormByRow() {
  if (!props.row) return;
  model.node = props.row.node;
  model.timeFormat = props.row.timeFormat;
  model.location = props.row.location;
  model.description = props.row.description;
  model.published = props.row.published;
}
async function handleSubmit() {
  if (!(await formRef.value?.validate())) return;
  submitting.value = true;
  try {
    if (isCreate.value) {
      await fetchCreateOperationTrace({ ...model });
      window.$message?.success($t('common.addSuccess'));
    } else {
      await fetchUpdateOperationTrace({ id: props.row!.id, ...model });
      window.$message?.success($t('common.updateSuccess'));
    }
    drawerVisible.value = false;
    emit('submitted');
  } catch (error) {
    window.$message?.error(error instanceof Error ? error.message : String(error));
  } finally {
    submitting.value = false;
  }
}
watch(
  () => props.show,
  val => {
    if (!val) return;
    if (isCreate.value) resetForm();
    else fillFormByRow();
  }
);
</script>

<template>
  <SiteDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="submitting"
    :footer="true"
    width="520"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" mode="edit" />
  </SiteDrawer>
</template>
```

- [ ] **Step 3: 类型检查**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/views/system-manage/setting/modules/trace-capture/OperationTraceTable.vue src/views/system-manage/setting/modules/trace-capture/OperationTraceDrawer.vue
git commit -m "feat(setting): add operation trace table & drawer"
```

---

### Task 6: 重构 TraceCapture.vue 为子 tab 壳

**Files:**

- Modify: `src/views/system-manage/setting/modules/trace-capture/TraceCapture.vue`（整体重写）

**Interfaces:**

- Consumes: Task 4/5 的 `TraceConfigTable` / `OperationTraceTable`

- [ ] **Step 1: 重写 TraceCapture.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { NCard, NTabPane, NTabs } from 'naive-ui';
import TraceConfigTable from './TraceConfigTable.vue';
import OperationTraceTable from './OperationTraceTable.vue';

const subTabs = [
  { key: 'track-network', label: $t('page.manage.setting.traceCapture.subTab.trackNetwork') },
  { key: 'track-transform', label: $t('page.manage.setting.traceCapture.subTab.trackTransform') },
  { key: 'track-keyword', label: $t('page.manage.setting.traceCapture.subTab.trackKeyword') },
  { key: 'capture-time', label: $t('page.manage.setting.traceCapture.subTab.captureTime') },
  { key: 'operation-trace', label: $t('page.manage.setting.traceCapture.subTab.operationTrace') }
];

const active = ref('track-network');
</script>

<template>
  <div class="h-full w-full flex flex-col">
    <NCard class="mb-16px" :content-style="{ padding: '8px' }">
      <NTabs :value="active" type="segment" @update:value="active = $event">
        <NTabPane v-for="t in subTabs" :key="t.key" :name="t.key" :tab="t.label" />
      </NTabs>
    </NCard>
    <div class="min-h-0 flex-1">
      <TraceConfigTable v-if="active !== 'operation-trace'" :category="active" />
      <OperationTraceTable v-else />
    </div>
  </div>
</template>
```

- [ ] **Step 2: 类型检查**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/views/system-manage/setting/modules/trace-capture/TraceCapture.vue
git commit -m "refactor(setting): make trace-capture a sub-tab shell with 5 tabs"
```

---

### Task 7: 清理 operation-trace 目录 + 更新 setting/index.vue

**Files:**

- Delete: `src/views/system-manage/setting/modules/operation-trace/`（整个目录）
- Modify: `src/views/system-manage/setting/index.vue`（移除 `OperationTrace` import、`operation-trace` tab、`componentMap` 项）

**Interfaces:**

- Consumes: Task 6 已无对 `operation-trace` 的引用

- [ ] **Step 1: 删除 operation-trace 目录**

```bash
git rm -r src/views/system-manage/setting/modules/operation-trace
```

- [ ] **Step 2: 修改 index.vue**

移除第 12 行 `import OperationTrace from './modules/operation-trace/OperationTrace.vue';`
在 `tabs` 数组中移除：

```ts
  { key: 'operation-trace', label: $t('page.manage.setting.operationTrace') },
```

在 `componentMap` 中移除：

```ts
  'operation-trace': OperationTrace
```

- [ ] **Step 3: 类型检查 + 残留引用检查**

Run: `npm run typecheck`
Expected: PASS
Run: `grep -rn "operation-trace\|OperationTrace\|operationTrace" src --include=*.vue --include=*.ts | grep -v "node_modules"`
Expected: 仅剩 i18n 中 `traceCapture.subTab.operationTrace`（这是新结构内的子 tab 名，正常），不应再有引用已删除组件或顶层 `operationTrace` key 的地方。

- [ ] **Step 4: Commit**

```bash
git add src/views/system-manage/setting/index.vue
git commit -m "refactor(setting): drop operation-trace top-level tab, merge into trace-capture"
```

---

### Task 8: 最终验证

**Files:** 无新增，整体校验

- [ ] **Step 1: 类型检查**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: 无新增 error/warning

- [ ] **Step 3: 手动验证（dev 模式）**

Run: `npm run dev`
手动检查：

1. 系统设置页现在只有 6 个顶层 tab（input-format / print-format / export-format / waybill-rule / trace-capture / init-data）。
2. 进入「轨迹抓取配置」，顶部 5 个子 tab：追踪网络 / 轨迹改造 / 轨迹关键词 / 抓取时间 / 操作轨迹。
3. 前 4 个子 tab 表格首列标题随 tab 名变化（追踪网络/轨迹改造/轨迹关键词/抓取时间）；操作轨迹表格含「是否发布」列。
4. 点「新增」/ 行内「编辑」抽屉可保存并刷新当前 tab 数据。
5. 列设置（齿轮）可隐藏/排序列并缓存（切换子 tab 不串缓存）。
6. 控制台无报错。

- [ ] **Step 4: Commit（若有 lint 自动修复产生的改动）**

```bash
git add -A
git commit -m "chore(setting): final lint/typecheck fixes for trace-capture refactor" || echo "nothing to commit"
```
