# vxe-table 通用 Table 组件封装 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `src/components/Table/` 下封装一套基于 vxe-table v4 的通用表格组件（表格 + 列配置弹窗 + 配套 hook），作为现有 Naive UI 表格的并存补充方案。

**Architecture:** 新增 `vxe-table`/`vxe-pc-ui`/`xe-utils` 依赖并在入口注册；`table.vue` 封装 `<vxe-table>` 提供数据与列渲染、loading、空状态；`table-column-config.vue` 提供复刻需求截图的列配置弹窗（拖拽排序/显隐/宽度/最小宽度/固定/排序 + 重置/确认）；`use-vxe-table.ts` 管理数据、加载态与列配置状态，并将列配置计算为实际渲染列。组件经 `unplugin-vue-components` 自动扫描 `src/components` 全局可用，但 vxe-table 第三方库需在 `main.ts` 手动注册。

**Tech Stack:** Vue 3.5、`vite` 8、`vxe-table@4` + `vxe-pc-ui` + `xe-utils`、TypeScript、`vue-draggable-plus`（已安装）、`naive-ui`（抽屉/弹窗/输入控件）、`@sa/locales`（`$t`）。

## Global Constraints

- 依赖版本：vue `3.5.34`；新增 `vxe-table@^4.5.9`、`vxe-pc-ui`（与 vxe-table 同版本）、`xe-utils@^4`。
- i18n key 必须使用项目已有 key：`common.columnSetting`、`common.batchDelete`、`common.noData`、`datatable.itemCount` 等，禁止新增无意义 key（除非确有必要）。
- 组件命名风格沿用项目：`defineOptions({ name: 'XxxYyy' })`（PascalCase）。
- 列配置类型 `VxeColumnConfig` 定义在 `use-vxe-table.ts` 并 export，供 `table.vue` 与 `table-column-config.vue` 复用。
- 不修改任何现有 Naive UI 表格相关文件，保持并存。
- 计划末尾的临时 demo 页面验证后需删除，保持仓库整洁。

---

### Task 1: 安装并注册 vxe-table v4

**Files:**
- Modify: `package.json`（dependencies 区块，约 49-73 行）
- Create: `src/plugins/vxe-table.ts`
- Modify: `src/main.ts:4`（引入 setup 函数）
- Modify: `src/main.ts:11-33`（在 `setupApp` 内调用）

**Interfaces:**
- Produces: `setupVxeTable(app)` —— 注册 `VxePcUi` 与 `VxeTable` 插件及样式。

- [ ] **Step 1: 添加依赖到 package.json**

在 `dependencies` 中 `naive-ui` 之后新增：
```json
    "naive-ui": "2.44.1",
    "vxe-pc-ui": "^4.5.9",
    "vxe-table": "^4.5.9",
    "xe-utils": "^4.1.0",
```

- [ ] **Step 2: 创建 `src/plugins/vxe-table.ts`**

```ts
import VxePcUi from 'vxe-pc-ui';
import VxeTable from 'vxe-table';
import 'vxe-pc-ui/lib/style.css';
import 'vxe-table/lib/style.css';
import type { App } from 'vue';

export function setupVxeTable(app: App) {
  app.use(VxePcUi);
  app.use(VxeTable);
}
```

- [ ] **Step 3: 在 `src/main.ts` 注册**

第 4 行 import 增加 `setupVxeTable`：
```ts
import { setupVueRootValidator } from 'vite-plugin-vue-transition-root-validator/client';
import { setupAppVersionNotification, setupDayjs, setupIconifyOffline, setupLoading, setupNProgress, setupVxeTable } from './plugins';
```
在 `src/plugins/index.ts` 导出：
```ts
export * from './vxe-table';
```
在 `setupApp` 中 `setupStore(app)` 之后调用：
```ts
  setupStore(app);

  setupVxeTable(app);
```

- [ ] **Step 4: 安装依赖**

Run: `cd d:/LINFLY/CWMS/user-admin-web && pnpm install`
Expected: 安装成功，无 peer 冲突报错。

- [ ] **Step 5: 类型检查验证注册可用**

Run: `pnpm typecheck`
Expected: 通过（vxe-table 类型可被识别；若有样式类型报错，确认 `style.css` 路径正确）。

---

### Task 2: 列配置类型与配套 hook `use-vxe-table.ts`

**Files:**
- Create: `src/components/Table/use-vxe-table.ts`

**Interfaces:**
- Produces:
  - `interface VxeColumnConfig { key: string; title: string; visible: boolean; width?: number | null; minWidth?: number | null; fixed?: '' | 'left' | 'right'; sortable: boolean; }`
  - `function useVxeTable<ApiData>(options: { api: () => Promise<ResponseData>; transform: (r: ResponseData) => ApiData[]; columns: () => VxeColumnConfig[]; immediate?: boolean; }): { data: Ref<ApiData[]>; loading: Ref<boolean>; columnConfigs: Ref<VxeColumnConfig[]>; columns: ComputedRef<VxeColumnRenderColumn[]>; getData: () => Promise<void>; resetColumns: () => void; }`
  - `type VxeColumnRenderColumn` —— 传给 `<vxe-table>` 的 `:columns`，含 `field`/`title`/`width`/`minWidth`/`fixed`/`sortable`。

- [ ] **Step 1: 定义类型与 hook 骨架**

```ts
import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import useBoolean from '@sa/hooks/use-boolean';
import useLoading from '@sa/hooks/use-loading';

export interface VxeColumnConfig {
  key: string;
  title: string;
  visible: boolean;
  width?: number | null;
  minWidth?: number | null;
  fixed?: '' | 'left' | 'right';
  sortable: boolean;
}

export type VxeColumnRenderColumn = {
  field: string;
  title: string;
  width?: number;
  minWidth?: number;
  fixed?: '' | 'left' | 'right';
  sortable?: boolean;
};
```

（注：`@sa/hooks/use-boolean`、`@sa/hooks/use-loading` 路径请参照 `packages/hooks/src/use-table.ts` 现有 import 方式，用 `import { useBoolean, useLoading } from '@sa/hooks'`。）

- [ ] **Step 2: 实现 `useVxeTable`**

```ts
interface UseVxeTableOptions<ResponseData, ApiData> {
  api: () => Promise<ResponseData>;
  transform: (response: ResponseData) => ApiData[];
  columns: () => VxeColumnConfig[];
  immediate?: boolean;
}

export function useVxeTable<ResponseData, ApiData>(options: UseVxeTableOptions<ResponseData, ApiData>) {
  const { loading, startLoading, endLoading } = useLoading();
  const { bool: empty, setBool: setEmpty } = useBoolean();

  const data = ref([]) as Ref<ApiData[]>;
  const initialConfigs = options.columns();
  const columnConfigs = ref(jsonClone(initialConfigs)) as Ref<VxeColumnConfig[]>;

  const columns = computed<VxeColumnRenderColumn[]>(() =>
    columnConfigs.value
      .filter(col => col.visible)
      .map(col => ({
        field: col.key,
        title: col.title,
        width: col.width ?? undefined,
        minWidth: col.minWidth ?? undefined,
        fixed: col.fixed || undefined,
        sortable: col.sortable
      }))
  );

  async function getData() {
    try {
      startLoading();
      const response = await options.api();
      data.value = options.transform(response);
      setEmpty(data.value.length === 0);
    } finally {
      endLoading();
    }
  }

  function resetColumns() {
    columnConfigs.value = jsonClone(initialConfigs);
  }

  if (options.immediate ?? true) {
    getData();
  }

  return { data, loading, empty, columnConfigs, columns, getData, resetColumns };
}
```

（注：`jsonClone` 从 `@sa/utils` 导入，参见 `src/hooks/common/table.ts` 的用法。）

- [ ] **Step 3: 类型检查**

Run: `pnpm typecheck`
Expected: 通过，无类型错误。

---

### Task 3: 通用表格组件 `table.vue`

**Files:**
- Create: `src/components/Table/table.vue`

**Interfaces:**
- Consumes: `useVxeTable` 返回的 `columns`（`VxeColumnRenderColumn[]`）、`data`、`loading`；通过 props 接收。
- Produces: 组件 `Table`，props：`columns: VxeColumnRenderColumn[]`、`data: any[]`、`loading: boolean`、`height?: number | string`、`maxHeight?: number | string`、`rowConfig?: object`、`border?: boolean`、`stripe?: boolean`；`v-model:columns` 可选；默认 slot `operation` 用于表头操作区。

- [ ] **Step 1: 编写 `table.vue` 模板与脚本**

```vue
<script setup lang="ts">
import type { VxeColumnRenderColumn } from './use-vxe-table';

defineOptions({
  name: 'Table'
});

interface Props {
  columns: VxeColumnRenderColumn[];
  data: any[];
  loading?: boolean;
  height?: number | string;
  maxHeight?: number | string;
  border?: boolean;
  stripe?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  border: true,
  stripe: true
});

const emit = defineEmits<{ (e: 'refresh'): void }>();

function refresh() {
  emit('refresh');
}
</script>

<template>
  <div class="w-full">
    <div class="mb-12px flex-y-center justify-between">
      <slot name="operation" :refresh="refresh" />
    </div>
    <vxe-table
      :data="data"
      :columns="columns"
      :loading="loading"
      :height="height"
      :max-height="maxHeight"
      :border="border"
      :stripe="stripe"
      :row-config="{ isHover: true }"
      class="w-full"
    >
      <template #empty>
        <span class="text-14px text-#909399">{{ $t('common.noData') }}</span>
      </template>
    </vxe-table>
  </div>
</template>

<style scoped></style>
```

- [ ] **Step 2: 类型检查与全局注册确认**

Run: `pnpm typecheck`
Expected: 通过；`<vxe-table>` 已被 Task 1 的 `app.use(VxeTable)` 注册为全局组件，无需额外声明。

---

### Task 4: 列配置弹窗 `table-column-config.vue`

**Files:**
- Create: `src/components/Table/table-column-config.vue`

**Interfaces:**
- Consumes: `VxeColumnConfig` 类型（来自 `./use-vxe-table`）。
- Produces: 组件 `TableColumnConfig`，props：`visible: boolean`、`columns: VxeColumnConfig[]`；emits：`update:visible`、`update:columns`、`confirm`、`reset`。交互：拖拽排序（vue-draggable-plus）、显隐 Switch、宽度/最小宽度数字输入（`NInputNumber`）、固定下拉（`NSelect`）、排序 Switch；底部「重置」「确认」。

- [ ] **Step 1: 编写 `table-column-config.vue`**

```vue
<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { $t } from '@/locales';
import type { VxeColumnConfig } from './use-vxe-table';

defineOptions({
  name: 'TableColumnConfig'
});

interface Props {
  visible: boolean;
  columns: VxeColumnConfig[];
}

const props = defineProps<Props>();

interface Emits {
  (e: 'update:visible', visible: boolean): void;
  (e: 'update:columns', columns: VxeColumnConfig[]): void;
  (e: 'confirm'): void;
  (e: 'reset'): void;
}

const emit = defineEmits<Emits>();

const innerVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val)
});

const innerColumns = computed<VxeColumnConfig[]>({
  get: () => props.columns,
  set: val => emit('update:columns', val)
});

const fixedOptions = [
  { label: $t('common.unFixed'), value: '' },
  { label: $t('common.fixedLeft'), value: 'left' },
  { label: $t('common.fixedRight'), value: 'right' }
];

function handleConfirm() {
  emit('confirm');
  innerVisible.value = false;
}

function handleReset() {
  emit('reset');
}
</script>

<template>
  <NModal v-model:show="innerVisible" :title="$t('common.columnSetting')" preset="card" style="width: 640px">
    <VueDraggable v-model="innerColumns" :animation="150" class="flex flex-col gap-8px">
      <div
        v-for="col in innerColumns"
        :key="col.key"
        class="flex-y-center gap-12px rounded-4px border border-#eee px-12px py-8px dark:border-#333"
      >
        <icon-mdi-drag class="cursor-move text-icon" />
        <NSwitch v-model:value="col.visible" />
        <span class="w-120px truncate">{{ col.title }}</span>
        <NInputNumber v-model:value="col.width" :placeholder="$t('common.width')" size="small" class="w-110px" :min="0" />
        <NInputNumber v-model:value="col.minWidth" :placeholder="$t('common.minWidth')" size="small" class="w-110px" :min="0" />
        <NSelect v-model:value="col.fixed" :options="fixedOptions" size="small" class="w-110px" />
        <NSwitch v-model:value="col.sortable" />
        <span class="text-12px text-#999">{{ $t('common.sortable') }}</span>
      </div>
    </VueDraggable>
    <template #footer>
      <div class="flex justify-end gap-12px">
        <NButton @click="handleReset">{{ $t('common.reset') }}</NButton>
        <NButton type="primary" @click="handleConfirm">{{ $t('common.confirm') }}</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped></style>
```

- [ ] **Step 2: 补全缺失的 i18n key**

在 `src/locales/langs/zh-cn.ts` 与 `src/locales/langs/en-us.ts` 的 `common` 命名空间补充（如已有则跳过）：`unFixed`、`fixedLeft`、`fixedRight`、`width`、`minWidth`、`sortable`、`reset`、`confirm`。参照现有 `common` 结构：
```ts
// zh-cn
unFixed: '不固定',
fixedLeft: '左固定',
fixedRight: '右固定',
width: '宽度',
minWidth: '最小宽度',
sortable: '可排序',
reset: '重置',
confirm: '确认',
// en-us
unFixed: 'Unfixed',
fixedLeft: 'Fixed Left',
fixedRight: 'Fixed Right',
width: 'Width',
minWidth: 'Min Width',
sortable: 'Sortable',
reset: 'Reset',
confirm: 'Confirm',
```

- [ ] **Step 3: 类型检查**

Run: `pnpm typecheck`
Expected: 通过，新增 i18n key 在 `App.I18n.I18nKey` 类型内（若项目对 i18n key 强类型校验，需同步在 `src/typings` 或 locales 类型定义处登记；如 `src/locales` 使用运行时对象则无需）。

---

### Task 5: 导出与临时 demo 验证

**Files:**
- Create: `src/components/Table/index.ts`
- Create: 临时 demo 页面 `src/views/_demo-vxe-table/index.vue`（验证后删除）
- Modify: 临时路由（验证后删除）

**Interfaces:**
- Produces: `src/components/Table/index.ts` 导出 `Table`、`TableColumnConfig`、`useVxeTable`、`VxeColumnConfig`。

- [ ] **Step 1: 编写 `index.ts`**

```ts
export { default as Table } from './table.vue';
export { default as TableColumnConfig } from './table-column-config.vue';
export { useVxeTable } from './use-vxe-table';
export type { VxeColumnConfig, VxeColumnRenderColumn } from './use-vxe-table';
```

- [ ] **Step 2: 编写临时 demo 页面验证渲染与列配置联动**

```vue
<script setup lang="ts">
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';

const { data, loading, columnConfigs, columns, getData, resetColumns } = useVxeTable<{ list: { id: number; name: string; age: number }[] }, { id: number; name: string; age: number }>({
  api: async () => ({ list: [{ id: 1, name: 'A', age: 18 }, { id: 2, name: 'B', age: 20 }] }),
  transform: r => r.list,
  columns: () => [
    { key: 'id', title: 'ID', visible: true, sortable: false },
    { key: 'name', title: 'Name', visible: true, sortable: true },
    { key: 'age', title: 'Age', visible: true, width: 100, fixed: 'right', sortable: false }
  ] as VxeColumnConfig[]
});

const configVisible = ref(false);
</script>

<template>
  <div class="p-24px">
    <Table :columns="columns" :data="data" :loading="loading" @refresh="getData">
      <template #operation>
        <NButton size="small" @click="configVisible = true">{{ $t('common.columnSetting') }}</NButton>
      </template>
    </Table>
    <TableColumnConfig v-model:visible="configVisible" v-model:columns="columnConfigs" @reset="resetColumns" />
  </div>
</template>
```

- [ ] **Step 3: 启动 dev server 验证**

Run: `pnpm dev`（后台），浏览器打开对应 demo 路由
Expected: 表格渲染 2 行；点击「列设置」弹出配置面板；切换显隐/拖拽/改宽度/固定/排序后表格列实时联动；「重置」恢复初始。

- [ ] **Step 4: 清理临时 demo**

删除 `src/views/_demo-vxe-table/` 及临时路由条目。

- [ ] **Step 5: 最终类型检查与 lint**

Run: `pnpm typecheck && pnpm lint`
Expected: 通过。

---

## Self-Review

1. **Spec coverage:** Task 1 满足依赖与注册；Task 2 满足 hook 与列配置类型；Task 3 满足基础展示+loading+空状态；Task 4 满足列配置弹窗（拖拽/显隐/宽/最小宽/固定/排序/重置/确认）；Task 5 满足导出与验证。均覆盖。
2. **Placeholder scan:** 无 TBD/TODO；`@sa/hooks` import 路径提示已给出具体参照。
3. **Type consistency:** `VxeColumnConfig` 在 Task 2 定义并在 Task 3/4/5 复用；`columns` 计算结果为 `VxeColumnRenderColumn[]`，Task 3 props 与之匹配；`useVxeTable` 返回签名在 Task 5 demo 中一致使用。
4. **Scope:** 单计划可独立完成，无跨子系统拆分需求。
