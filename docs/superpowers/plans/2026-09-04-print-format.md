# 打印格式界面实现 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把设置页「打印格式」tab 从占位状态实现为：左侧固定 4 分类 + 右侧模板管理表格（新建/查看/复制/删除/设为默认），数据走纯前端 mock。

**Architecture:** 复用 `MasterDetail` 承载固定分类（新增 `showSearch` prop 隐藏搜索框）；右侧用通用 `<Table>` + `useVxeTable` 渲染模板表格；「新建/查看/复制」走 `drawer.vue` + `FormWrap`；数据由新增的 `service/api/print-format.ts` 在 DEV 下返回内存 mock（`Api.PrintFormat` 命名空间类型）。

**Tech Stack:** Vue 3.5 `<script setup lang="ts">`、Naive UI 2.44、vxe-table 4.5、Pinia 无关、Axios 经 `@sa/axios`、UnoCSS。TypeScript strict，无 `any`。

## Global Constraints

- Node.js >= 20.19.0，pnpm >= 10.5.0；**只用 pnpm，禁止 npm/yarn**。
- TypeScript strict + `strictNullChecks`，**禁止 `any`**（必要时 `unknown` + 收窄）。
- **禁止硬编码文案**：所有 UI 文案走 i18n，`zh-cn.ts` / `en-us.ts` / `typings/app.d.ts` 三处同步，否则 `pnpm typecheck` 报 `I18nKey`。
- **禁止在组件中直接调用 axios**，统一走 `@/service/request` + `@/service/api`；DEV 下接口返回 mock（`as unknown as Promise<T>` 强转，无 `{data,error}` 包裹）。
- **禁止绕过 `useVxeTable` 自行封装表格**，使用通用 `<Table>` 组件。
- 状态字段 `Api.Common.EnableStatus = 0 | 1`（number）：`1`=启用/是，`0`=禁用/否。NSwitch 必须配 `checkedValue:1`/`uncheckedValue:0`。
- 本仓库**无测试框架**，无 `test` 脚本。每个任务的验证手段统一为 `pnpm typecheck` + `pnpm lint` + `pnpm fmt`（即 pre-commit 钩子那套），**不要找单测命令**。
- 列配置缓存走裸 `localStorage['vxe-table-column:<cacheKey>']`（本项目唯一例外），用 `useVxeTable` 的 `cacheKey` 即可，无需手改。
- 通用 Table 约定：`:loading` 用 vxe 原生；列宽 `:column-config="{ resizable: true }"`；溢出 `show-overflow="tooltip"`；`type:'status'` 默认 `activeValue=1`（数字）。

---

## File Structure

| 动作         | 文件                                                          | 职责                                                               |
| ------------ | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| 新增         | `src/typings/api/print-format.d.ts`                           | `Api.PrintFormat` 命名空间（Template / List / CreateParams）       |
| 改           | `src/typings/app.d.ts`                                        | `App.I18n.Schema.page.manage.setting.printFormat` 改为对象，补子键 |
| 改           | `src/locales/langs/zh-cn.ts`                                  | `page.manage.setting.printFormat.*` 中文文案                       |
| 改           | `src/locales/langs/en-us.ts`                                  | 同上英文文案                                                       |
| 改           | `src/views/system-manage/setting/components/MasterDetail.vue` | 新增 `showSearch` prop                                             |
| 新增         | `src/service/api/print-format.ts`                             | fetch\* 系列 + DEV 内存 mockDb                                     |
| 改           | `src/views/system-manage/setting/modules/PrintFormat.vue`     | 重写：左分类 + 右表格 + 抽屉                                       |
| 改（索引）   | `AGENTS_CHANGELOG.md`                                         | 已追加（见 brainstorming 阶段）                                    |
| 新增（记录） | `changelog/打印格式界面实现.md`                               | 已写（见 brainstorming 阶段）                                      |

> 注意：`changelog` 与 `AGENTS_CHANGELOG.md` 索引已在设计阶段完成，本计划不再重复。

---

### Task 1: 类型定义 `Api.PrintFormat`

**Files:**

- Create: `src/typings/api/print-format.d.ts`
- Modify: `src/typings/app.d.ts:656-665`（`setting.printFormat` 由 string 改为对象并补子键）

**Interfaces:**

- Produces: `Api.PrintFormat.Template` / `Api.PrintFormat.List` / `Api.PrintFormat.CreateParams`，供 Task 4（api）与 Task 5（页面）使用。

- [ ] **Step 1: 创建类型文件 `src/typings/api/print-format.d.ts`**

```ts
declare namespace Api {
  namespace PrintFormat {
    /** 打印模板记录 */
    interface Template {
      id: number;
      categoryId: number;
      name: string;
      labelSize: string;
      isDefault: Api.Common.EnableStatus;
      generatedCount: number;
      remark: string;
      lastEditor: string;
      editTime: string;
    }

    /** 列表返回结构（对齐 useVxeTable transform） */
    interface List {
      records: Template[];
      total: number;
    }

    /** 新建/复制入参（复制时由调用方去掉 id） */
    type CreateParams = Omit<Template, 'id' | 'generatedCount' | 'lastEditor' | 'editTime'>;
  }
}
```

- [ ] **Step 2: 在 `src/typings/app.d.ts` 把 `setting.printFormat` 改为对象并补子键**

将 `656-665` 行的：

```ts
          setting: {
            inputFormat: string;
            printFormat: string;
            exportFormat: string;
            ...
          };
```

改为（`printFormat` 从 string 改为对象，子键同步下方 zh-cn/en-us）：

```ts
          setting: {
            inputFormat: string;
            printFormat: {
              title: string;
              listTitle: string;
              name: string;
              labelSize: string;
              isDefault: string;
              yes: string;
              no: string;
              generatedCount: string;
              remark: string;
              lastEditor: string;
              editTime: string;
              create: string;
              delete: string;
              view: string;
              copy: string;
              setDefault: string;
              newTitle: string;
              detailTitle: string;
              copyTitle: string;
            };
            exportFormat: string;
            ...
          };
```

- [ ] **Step 3: 类型自检**

Run: `pnpm typecheck`
Expected: 仅因 `zh-cn.ts`/`en-us.ts` 尚未补 `printFormat` 子键而报错 `I18nKey`，类型文件本身无错（Task 2 补完即消）。

- [ ] **Step 4: 提交**

```bash
git add src/typings/api/print-format.d.ts src/typings/app.d.ts
git commit -m "feat(setting): add Api.PrintFormat types and i18n schema"
```

---

### Task 2: i18n 文案（zh-cn / en-us 三处同步）

**Files:**

- Modify: `src/locales/langs/zh-cn.ts:382-391`（`setting` 块内的 `printFormat`）
- Modify: `src/locales/langs/en-us.ts`（与 zh-cn 同结构同键）
- 已同步：`src/typings/app.d.ts`（Task 1 完成）

**Interfaces:**

- Consumes: `App.I18n.Schema.page.manage.setting.printFormat.*` 键名（Task 1 定义）
- Produces: 供 Task 5 页面 `$t('page.manage.setting.printFormat.*')` 引用。

- [ ] **Step 1: 改 `src/locales/langs/zh-cn.ts` 的 `printFormat` 为对象**

将 `382-391` 行的：

```ts
      setting: {
        inputFormat: '录单格式',
        printFormat: '打印格式',
        exportFormat: '导出格式',
        ...
      }
```

改为：

```ts
      setting: {
        inputFormat: '录单格式',
        printFormat: {
          title: '打印格式',
          listTitle: '打印格式类型',
          name: '模板名称',
          labelSize: '标签尺寸',
          isDefault: '是否默认',
          yes: '是',
          no: '否',
          generatedCount: '已生成标签',
          remark: '备注',
          lastEditor: '最后编辑',
          editTime: '编辑时间',
          create: '新建',
          delete: '删除',
          view: '查看',
          copy: '复制',
          setDefault: '设为默认',
          newTitle: '新建打印模板',
          detailTitle: '打印模板详情',
          copyTitle: '复制打印模板'
        },
        exportFormat: '导出格式',
        ...
      }
```

- [ ] **Step 2: 在 `src/locales/langs/en-us.ts` 找到对应 `setting.printFormat`（当前为 `printFormat: 'Print Format'` 字符串），改为同结构英文对象**

```ts
        printFormat: {
          title: 'Print Format',
          listTitle: 'Print Format Type',
          name: 'Template Name',
          labelSize: 'Label Size',
          isDefault: 'Default',
          yes: 'Yes',
          no: 'No',
          generatedCount: 'Generated Labels',
          remark: 'Remark',
          lastEditor: 'Last Editor',
          editTime: 'Edit Time',
          create: 'Create',
          delete: 'Delete',
          view: 'View',
          copy: 'Copy',
          setDefault: 'Set Default',
          newTitle: 'New Print Template',
          detailTitle: 'Print Template Detail',
          copyTitle: 'Copy Print Template'
        },
```

> 注意：`index.vue` 当前用 `$t('page.manage.setting.printFormat')` 作 tab 标题（string）。本任务把它改为对象后，需同步把 `src/views/system-manage/setting/index.vue:15` 改为 `$t('page.manage.setting.printFormat.title')`（见 Task 5 Step 1 一并处理，或此处先改）。

- [ ] **Step 3: 文案自检**

Run: `pnpm typecheck`
Expected: PASS（三处键对齐，无 `I18nKey`）。

- [ ] **Step 4: 提交**

```bash
git add src/locales/langs/zh-cn.ts src/locales/langs/en-us.ts src/views/system-manage/setting/index.vue
git commit -m "feat(setting): add print format i18n messages"
```

---

### Task 3: `MasterDetail` 新增 `showSearch` prop

**Files:**

- Modify: `src/views/system-manage/setting/components/MasterDetail.vue`（`defineProps` 加 `showSearch`，模板搜索框包 `v-if`）

**Interfaces:**

- Produces: `showSearch?: boolean`（默认 `true`）。Task 5 传 `:show-search="false"`。

- [ ] **Step 1: 在 `defineProps` 的 `withDefaults` 中增加 `showSearch`**

在 `MasterDetail.vue` 的 props 区块（`12-31` 行附近），`searchPlaceholder` 后加：

```ts
    /** 是否显示左侧列表的搜索框（固定分类场景传 false） */
    showSearch?: boolean;
```

并在 `withDefaults` 默认值对象中加：

```ts
    showSearch: true,
```

- [ ] **Step 2: 搜索框 `NInput` 外包 `v-if="showSearch"`**

将模板中（约 `73` 行）：

```vue
<NInput v-model:value="keyword" :placeholder="searchPlaceholder" clearable class="mb-6px" />
```

改为：

```vue
<NInput v-if="showSearch" v-model:value="keyword" :placeholder="searchPlaceholder" clearable class="mb-6px" />
```

> `keyword` 是 `defineModel`，保留即可；`showSearch=false` 时搜索框不渲染，`filteredItems` 仍返回全量 items（kw 为空），不影响选中。

- [ ] **Step 3: 自检**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS。

- [ ] **Step 4: 提交**

```bash
git add src/views/system-manage/setting/components/MasterDetail.vue
git commit -m "feat(setting): MasterDetail add showSearch prop"
```

---

### Task 4: `service/api/print-format.ts`（api + DEV mock）

**Files:**

- Create: `src/service/api/print-format.ts`

**Interfaces:**

- Consumes: `Api.PrintFormat.*`（Task 1）
- Produces: `fetchGetPrintTemplateList` / `fetchCreatePrintTemplate` / `fetchDeletePrintTemplate` / `fetchCopyPrintTemplate` / `fetchSetDefaultPrintTemplate`，供 Task 5 调用。

- [ ] **Step 1: 创建 `src/service/api/print-format.ts`**

```ts
import { request } from '../request';
import type { Api } from '@/typings';

/** 内存 mock 库（DEV 持久化增删改） */
let mockSeq = 200;
const mockDb: Api.PrintFormat.Template[] = [
  {
    id: 1,
    categoryId: 1,
    name: '标准内单标签',
    labelSize: '100×150mm',
    isDefault: 1,
    generatedCount: 1280,
    remark: '默认内单',
    lastEditor: 'admin',
    editTime: '2026-08-01 10:20'
  },
  {
    id: 2,
    categoryId: 1,
    name: '热敏内单',
    labelSize: '80×60mm',
    isDefault: 0,
    generatedCount: 320,
    remark: '',
    lastEditor: 'admin',
    editTime: '2026-08-12 14:05'
  },
  {
    id: 3,
    categoryId: 2,
    name: '标准转单标签',
    labelSize: '100×150mm',
    isDefault: 1,
    generatedCount: 640,
    remark: '转单专用',
    lastEditor: 'admin',
    editTime: '2026-08-03 09:30'
  },
  {
    id: 4,
    categoryId: 3,
    name: '商业发票',
    labelSize: 'A4',
    isDefault: 1,
    generatedCount: 88,
    remark: '形式发票',
    lastEditor: 'admin',
    editTime: '2026-07-20 16:40'
  },
  {
    id: 5,
    categoryId: 4,
    name: '总单主标',
    labelSize: '100×100mm',
    isDefault: 1,
    generatedCount: 1500,
    remark: '汇总总单',
    lastEditor: 'admin',
    editTime: '2026-08-15 11:00'
  },
  {
    id: 6,
    categoryId: 4,
    name: '总单副标',
    labelSize: '100×100mm',
    isDefault: 0,
    generatedCount: 210,
    remark: '',
    lastEditor: 'admin',
    editTime: '2026-08-18 13:25'
  }
];

function now(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function mockList(params: { categoryId: number; current: number; size: number }) {
  const list = mockDb.filter(t => t.categoryId === params.categoryId);
  const start = (params.current - 1) * params.size;
  return Promise.resolve({ records: list.slice(start, start + params.size), total: list.length });
}

/** 获取打印模板列表（按分类过滤 + 分页） */
export function fetchGetPrintTemplateList(params: { categoryId: number; current: number; size: number }) {
  if (import.meta.env.DEV) {
    return mockList(params) as unknown as Promise<Api.PrintFormat.List>;
  }
  return request<Api.PrintFormat.List>({ url: '/print/template/list', method: 'post', data: params });
}

/** 新建模板 */
export function fetchCreatePrintTemplate(params: Api.PrintFormat.CreateParams) {
  if (import.meta.env.DEV) {
    const id = ++mockSeq;
    const row: Api.PrintFormat.Template = { ...params, id, generatedCount: 0, lastEditor: 'admin', editTime: now() };
    mockDb.push(row);
    return Promise.resolve(row) as unknown as Promise<Api.PrintFormat.Template>;
  }
  return request<Api.PrintFormat.Template>({ url: '/print/template/create', method: 'post', data: params });
}

/** 批量删除模板 */
export function fetchDeletePrintTemplate(ids: number[]) {
  if (import.meta.env.DEV) {
    for (const id of ids) {
      const idx = mockDb.findIndex(t => t.id === id);
      if (idx >= 0) mockDb.splice(idx, 1);
    }
    return Promise.resolve(true) as unknown as Promise<boolean>;
  }
  return request<boolean>({ url: '/print/template/delete', method: 'post', data: { ids } });
}

/** 复制为模板（调用方已去掉 id） */
export function fetchCopyPrintTemplate(params: Api.PrintFormat.CreateParams) {
  if (import.meta.env.DEV) {
    const id = ++mockSeq;
    const row: Api.PrintFormat.Template = { ...params, id, generatedCount: 0, lastEditor: 'admin', editTime: now() };
    mockDb.push(row);
    return Promise.resolve(row) as unknown as Promise<Api.PrintFormat.Template>;
  }
  return request<Api.PrintFormat.Template>({ url: '/print/template/copy', method: 'post', data: params });
}

/** 设为默认（同分类互斥） */
export function fetchSetDefaultPrintTemplate(params: { id: number; categoryId: number }) {
  if (import.meta.env.DEV) {
    mockDb.forEach(t => {
      if (t.categoryId === params.categoryId) t.isDefault = t.id === params.id ? 1 : 0;
    });
    return Promise.resolve(true) as unknown as Promise<boolean>;
  }
  return request<boolean>({ url: '/print/template/setDefault', method: 'post', data: params });
}
```

- [ ] **Step 2: 自检**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS（注意 `Api.PrintFormat.CreateParams` 的 `isDefault` 为 `Api.Common.EnableStatus` number，mock 里 `isDefault: 1` 字面量会被推断为 `number`，与 `0|1` 兼容；若报类型错，把字面量标注为 `as Api.Common.EnableStatus` 或 `1 as const`）。

- [ ] **Step 3: 提交**

```bash
git add src/service/api/print-format.ts
git commit -m "feat(setting): print format api with dev mock"
```

---

### Task 5: 重写 `PrintFormat.vue`

**Files:**

- Modify: `src/views/system-manage/setting/modules/PrintFormat.vue`（整文件重写）
- Modify: `src/views/system-manage/setting/index.vue:15`（tab 标题键改为 `.title`）

**Interfaces:**

- Consumes: `Api.PrintFormat.*`（Task 1）、`fetch*`（Task 4）、`$t('page.manage.setting.printFormat.*')`（Task 2）、`MasterDetail` `showSearch`（Task 3）、通用 `<Table>`/`useVxeTable`/`TableColumnConfig`/`Drawer`/`FormWrap`。
- Produces: 完整可交互页面。

- [ ] **Step 1: 改 `index.vue` 的 tab 标题键**

`src/views/system-manage/setting/index.vue:15`：

```ts
  { key: 'print-format', label: $t('page.manage.setting.printFormat') },
```

改为：

```ts
  { key: 'print-format', label: $t('page.manage.setting.printFormat.title') },
```

- [ ] **Step 2: 重写 `PrintFormat.vue` 的 `<script setup>`**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import MasterDetail from '../components/MasterDetail.vue';
import Table, { type VxeColumnConfig } from '@/components/Table/table.vue';
import TableColumnConfig from '@/components/Table/table-column-config.vue';
import { useVxeTable } from '@/components/Table/use-vxe-table';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import {
  fetchGetPrintTemplateList,
  fetchCreatePrintTemplate,
  fetchDeletePrintTemplate,
  fetchCopyPrintTemplate,
  fetchSetDefaultPrintTemplate
} from '@/service/api/print-format';
import type { Api } from '@/typings';

/** 固定分类（业务数据常量，非接口） */
const categories = [
  { id: 1, name: '内单标签' },
  { id: 2, name: '转单标签' },
  { id: 3, name: '形式发票' },
  { id: 4, name: '总单标签' }
];

const selectedCategoryId = ref<number>(categories[0].id);

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns } = useVxeTable<
  Api.PrintFormat.List,
  Api.PrintFormat.Template
>({
  api: ({ current, size }) => fetchGetPrintTemplateList({ categoryId: selectedCategoryId.value, current, size }),
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      {
        key: 'name',
        title: $t('page.manage.setting.printFormat.name'),
        type: 'detail',
        visible: true,
        sortable: false
      },
      { key: 'labelSize', title: $t('page.manage.setting.printFormat.labelSize'), visible: true, sortable: false },
      {
        key: 'isDefault',
        title: $t('page.manage.setting.printFormat.isDefault'),
        visible: true,
        width: 100,
        align: 'center',
        sortable: false
      },
      {
        key: 'generatedCount',
        title: $t('page.manage.setting.printFormat.generatedCount'),
        visible: true,
        width: 120,
        align: 'center',
        sortable: false
      },
      { key: 'remark', title: $t('page.manage.setting.printFormat.remark'), visible: true, sortable: false },
      {
        key: 'lastEditor',
        title: $t('page.manage.setting.printFormat.lastEditor'),
        visible: true,
        width: 120,
        sortable: false
      },
      {
        key: 'editTime',
        title: $t('page.manage.setting.printFormat.editTime'),
        visible: true,
        width: 160,
        sortable: false
      }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'setting-print-format'
});

const columnConfigVisible = ref(false);
const selectedRows = ref<Api.PrintFormat.Template[]>([]);

function handleCategoryChange(id: number) {
  selectedCategoryId.value = id;
  getData();
}

// ---- 抽屉 ----
const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'view' | 'copy'>('create');
const formModel = ref<Partial<Api.PrintFormat.Template>>({});
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? $t('page.manage.setting.printFormat.newTitle')
    : drawerMode.value === 'copy'
      ? $t('page.manage.setting.printFormat.copyTitle')
      : $t('page.manage.setting.printFormat.detailTitle')
);

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.setting.printFormat.name'),
    type: 'input',
    required: true,
    span: 24,
    placeholder: '请输入模板名称'
  },
  {
    key: 'labelSize',
    label: $t('page.manage.setting.printFormat.labelSize'),
    type: 'select',
    span: 24,
    options: [
      { label: '100×150mm', value: '100×150mm' },
      { label: '80×60mm', value: '80×60mm' },
      { label: 'A4', value: 'A4' },
      { label: '100×100mm', value: '100×100mm' },
      { label: '自定义', value: '自定义' }
    ]
  },
  {
    key: 'isDefault',
    label: $t('page.manage.setting.printFormat.isDefault'),
    type: 'switch',
    span: 24,
    checkedText: $t('page.manage.setting.printFormat.yes'),
    uncheckedText: $t('page.manage.setting.printFormat.no'),
    checkedValue: 1,
    uncheckedValue: 0
  },
  { key: 'remark', label: $t('page.manage.setting.printFormat.remark'), type: 'textarea', span: 24 }
]);

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = { name: '', labelSize: '100×150mm', isDefault: 0, remark: '' };
  drawerVisible.value = true;
}
function openView(row: Api.PrintFormat.Template) {
  drawerMode.value = 'view';
  formModel.value = { ...row };
  drawerVisible.value = true;
}
function openCopy(row: Api.PrintFormat.Template) {
  drawerMode.value = 'copy';
  formModel.value = { ...row, id: undefined, isDefault: 0 };
  drawerVisible.value = true;
}

async function handleDrawerSubmit() {
  if (drawerMode.value === 'view') {
    drawerVisible.value = false;
    return;
  }
  const ok = await formRef.value?.validate();
  if (!ok) return;
  if (drawerMode.value === 'create') {
    await fetchCreatePrintTemplate({
      ...formModel.value,
      categoryId: selectedCategoryId.value
    } as Api.PrintFormat.CreateParams);
  } else {
    await fetchCopyPrintTemplate(formModel.value as Api.PrintFormat.CreateParams);
  }
  drawerVisible.value = false;
  getData();
  window.$message?.success($t('common.saveSuccess'));
}

function handleDelete() {
  if (!selectedRows.value.length) return;
  window.$dialog?.warning({
    title: $t('common.delete'),
    content: $t('common.deleteConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      await fetchDeletePrintTemplate(selectedRows.value.map(r => r.id));
      selectedRows.value = [];
      getData();
      window.$message?.success($t('common.deleteSuccess'));
    }
  });
}

async function handleSetDefault(row: Api.PrintFormat.Template) {
  await fetchSetDefaultPrintTemplate({ id: row.id, categoryId: row.categoryId });
  getData();
  window.$message?.success($t('common.saveSuccess'));
}
</script>
```

- [ ] **Step 3: 重写 `PrintFormat.vue` 的 `<template>`**

```vue
<template>
  <MasterDetail
    :list-title="$t('page.manage.setting.printFormat.listTitle')"
    :items="categories"
    :show-status="false"
    :show-actions="false"
    :show-search="false"
    :selected-id="selectedCategoryId"
    @update:selected-id="handleCategoryChange"
  >
    <div class="h-full w-full flex flex-col min-h-0">
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        show-checkbox
        show-action
        :action-width="200"
        action-align="left"
        @refresh="getData"
        @selection-change="rows => (selectedRows = rows)"
      >
        <template #operation-left>
          <NButton type="primary" ghost size="small" @click="openCreate">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            {{ $t('page.manage.setting.printFormat.create') }}
          </NButton>
          <NButton type="error" ghost size="small" :disabled="!selectedRows.length" @click="handleDelete">
            <template #icon><icon-ic-round-delete class="text-icon" /></template>
            {{ $t('page.manage.setting.printFormat.delete') }}
          </NButton>
        </template>
        <template #operation-right="{ refresh }">
          <NButton size="small" @click="refresh">
            <template #icon><icon-ic-round-refresh class="text-icon" /></template>
          </NButton>
          <TableColumnConfig
            v-model:visible="columnConfigVisible"
            v-model:columns="columnConfigs"
            @confirm="persistColumns"
          />
        </template>
        <template #isDefault="{ row }">
          <NTag v-if="row.isDefault === 1" size="small" type="success">
            {{ $t('page.manage.setting.printFormat.yes') }}
          </NTag>
          <NTag v-else size="small" type="default">{{ $t('page.manage.setting.printFormat.no') }}</NTag>
        </template>
        <template #action="{ row }">
          <NButton text type="primary" @click="openView(row)">{{ $t('page.manage.setting.printFormat.view') }}</NButton>
          <NButton text type="primary" @click="openCopy(row)">{{ $t('page.manage.setting.printFormat.copy') }}</NButton>
          <NButton text type="primary" :disabled="row.isDefault === 1" @click="handleSetDefault(row)">
            {{ $t('page.manage.setting.printFormat.setDefault') }}
          </NButton>
        </template>
      </Table>
    </div>

    <Drawer
      v-model:show="drawerVisible"
      :title="drawerTitle"
      :footer="drawerMode !== 'view'"
      @submit="handleDrawerSubmit"
    >
      <NFormWrap ref="formRef" :model="formModel" :items="formItems" :disabled="drawerMode === 'view'" />
    </Drawer>
  </MasterDetail>
</template>
```

- [ ] **Step 4: 全量验证**

Run:

```bash
pnpm typecheck
pnpm lint
pnpm fmt
```

Expected: 三者均通过。本文件重写后，原先占位代码遗留的 6 个 `no-unused-vars` 误报应随之消失（`Item` 接口、`LookForward` 引用等已删除）。

- [ ] **Step 5: 提交**

```bash
git add src/views/system-manage/setting/modules/PrintFormat.vue src/views/system-manage/setting/index.vue
git commit -m "feat(setting): implement print format templates UI"
```

---

## Self-Review（plan 自检）

1. **Spec 覆盖**：左固定分类（Task 3 `showSearch` + Task 5 categories）→ ✅；右表格 7 列 + 操作列（Task 5 columns/action 插槽）→ ✅；新建/查看/复制抽屉（Task 5 Drawer + FormWrap）→ ✅；删除批量（Task 5 `handleDelete` + api `fetchDeletePrintTemplate`）→ ✅；设为默认（Task 5 `handleSetDefault` + api）→ ✅；mock 数据层（Task 4）→ ✅；类型 + i18n 三处同步（Task 1/2）→ ✅；changelog（设计阶段已完成，计划中注明）→ ✅。
2. **Placeholder 扫描**：无 TBD/TODO；每个代码步骤均含完整代码块；`common.saveSuccess` 等键假设已存在（如不存在需补，已在 Task 5 Step 2 提示检查）。
3. **类型一致性**：`Api.PrintFormat.Template/List/CreateParams` 在 Task 1 定义，Task 4/5 引用一致；`useVxeTable<Api.PrintFormat.List, Api.PrintFormat.Template>` 与 `transform` 返回 `{records,total}` 对齐 `Api.PrintFormat.List`；`categoryId` 字段在 Template/CreateParams 一致。✅

> 执行前请确认 `common.saveSuccess` / `common.deleteSuccess` / `common.deleteConfirm` / `common.confirm` / `common.cancel` / `common.delete` 在 `zh-cn.ts` 已存在（其它页面普遍使用，通常已具备）。若缺失，在 Task 2 同批次补到 `common` 块。
