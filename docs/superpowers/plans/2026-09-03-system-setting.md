# 系统设置（System Settings）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「系统管理」下新增「系统设置」单页，内部 7 个 Tab：除「运单号规则」为整页表格外，其余 6 个均为左右布局（左列列表 + 右列基础信息表单 + 字段映射区），其中「录单格式」填真实字段、其余 5 个用示例字段占位。

**Architecture:** 单页 `setting/index.vue` 用 `NTabs` + `<router-view>` 切换 7 个隐藏子路由（每个 Tab 一个 `setting/<name>/index.vue` 目录，elegant-router 自动注册，customRoutes 标记 `hideInMenu`）。左右布局抽两个私有共享组件 `MasterDetail.vue`（左右骨架）与 `FieldMapping.vue`（字段映射区），各 Tab 复用。运单号规则用本仓库通用 `Table` + `useVxeTable` 做整页表格。所有数据 mock 在内存，不调接口。

**Tech Stack:** Vue 3.5 + `<script setup lang="ts">`、Naive UI 2.44、vxe-table（`useVxeTable`）、elegant-router（自动路由）、vue-i18n、UnoCSS、pnpm。

## Global Constraints

- 路由由 `src/views/` 目录结构自动生成，**禁止手改 `src/router/elegant/**`**；路由 meta 调整只写在 `src/router/routes/index.ts`的`customRoutes`。
- 新增 i18n 文案必须 **zh-cn.ts / en-us.ts / `App.I18n.Schema` 三处同步**（route 是 `Record<I18nRouteKey, string>` 索引类型，缺 key 会 typecheck 报错）。
- 禁止 `any`；用 `unknown` + 类型收窄。
- 样式优先 UnoCSS 原子类；注释用中文简洁说明。
- 只能用 **pnpm**（禁用 npm / yarn）。
- 组件文件 kebab-case，组件名 PascalCase，组合式函数 `useXxx`，接口函数 `fetchXxx`。
- 表格统一走通用 `Table` + `useVxeTable`，禁止自行封装表格。
- 验证手段：`pnpm typecheck` / `pnpm lint` / `pnpm build`（本项目无测试框架，不写单测）。
- 共享组件放 `setting/components/*.vue`（**非 `index.vue`**，避免被路由扫描）。

---

## 文件结构（最终）

```
src/views/system-manage/setting/
├── index.vue                       # 父页：NTabs + router-view
├── components/
│   ├── MasterDetail.vue            # 左右骨架（左列列表 + 右列容器 + 操作行）
│   └── FieldMapping.vue           # 字段映射区（导航菜单 + 已选字段复选框）
├── input-format/index.vue          # 录单格式（左右，真实字段）
├── print-format/index.vue          # 打印格式（左右，示例字段）
├── export-format/index.vue         # 导出格式（左右，示例字段）
├── waybill-rule/index.vue          # 运单号规则（整页表格）
├── notification-config/index.vue   # 通知配置（左右，示例字段）
├── init-data/index.vue             # 初始化数据（左右，示例字段）
└── station-scan/index.vue          # 站点扫描配置（左右，示例字段）
```

---

## Task 1: 路由骨架 + 父页 + i18n 基础键

**Files:**

- Create: `src/views/system-manage/setting/index.vue`
- Create: `src/views/system-manage/setting/input-format/index.vue`（先放 NEmpty 占位壳）
- Create: `src/views/system-manage/setting/print-format/index.vue`（占位壳）
- Create: `src/views/system-manage/setting/export-format/index.vue`（占位壳）
- Create: `src/views/system-manage/setting/waybill-rule/index.vue`（占位壳）
- Create: `src/views/system-manage/setting/notification-config/index.vue`（占位壳）
- Create: `src/views/system-manage/setting/init-data/index.vue`（占位壳）
- Create: `src/views/system-manage/setting/station-scan/index.vue`（占位壳）
- Modify: `src/router/routes/index.ts`（customRoutes）
- Modify: `src/locales/langs/zh-cn.ts`（route + common + page.manage）
- Modify: `src/locales/langs/en-us.ts`（route + common + page.manage）

**Interfaces:** 本任务产出 7 条隐藏子路由 + 父页 `NTabs` 容器，后续 Task 2-6 只填充各 `index.vue` 内容。

- [ ] **Step 1: 创建父页 `setting/index.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { $t } from '@/locales';

const router = useRouter();
const route = useRoute();

const tabs = [
  { key: 'input-format', label: $t('page.manage.setting.inputFormat') },
  { key: 'print-format', label: $t('page.manage.setting.printFormat') },
  { key: 'export-format', label: $t('page.manage.setting.exportFormat') },
  { key: 'waybill-rule', label: $t('page.manage.setting.waybillRule') },
  { key: 'notification-config', label: $t('page.manage.setting.notificationConfig') },
  { key: 'init-data', label: $t('page.manage.setting.initData') },
  { key: 'station-scan', label: $t('page.manage.setting.stationScan') }
];

const activeTab = computed(() => {
  const seg = route.name?.toString().replace('system-manage_setting_', '');
  return seg && tabs.some(t => t.key === seg) ? seg : tabs[0].key;
});

function handleTabChange(key: string) {
  router.push({ name: `system-manage_setting_${key}` as never });
}
</script>

<template>
  <div class="h-full w-full flex-col p-16px">
    <NTabs :value="activeTab" type="line" @update:value="handleTabChange">
      <NTabPane v-for="t in tabs" :key="t.key" :name="t.key" :tab="t.label" />
    </NTabs>
    <div class="min-h-0 flex-1">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 创建 7 个 tab 占位壳（统一内容，仅 title 不同）**

每个 `setting/<name>/index.vue` 内容如下（`<name-label>` 替换为对应 `$t('page.manage.setting.xxx')`）：

```vue
<script setup lang="ts">
import { $t } from '@/locales';
</script>

<template>
  <div class="h-full w-full flex items-center justify-center">
    <NEmpty :description="$t('page.manage.setting.inputFormat')" />
  </div>
</template>
```

> 7 个文件分别把 `inputFormat` 换成 `printFormat` / `exportFormat` / `waybillRule` / `notificationConfig` / `initData` / `stationScan`。本任务先占位，后续 Task 覆盖真实内容。

- [ ] **Step 3: 运行 `pnpm gen-route` 生成路由**

Run: `pnpm gen-route`
Expected: `src/router/elegant/routes.ts` 出现 `system-manage_setting` 及 `system-manage_setting_input-format` 等 7 条子路由；`src/typings/elegant-router.d.ts` 的 `RouteKey` 包含这些 key。

- [ ] **Step 4: 修改 `src/router/routes/index.ts` 的 `customRoutes`**

在 `const customRoutes: CustomRoute[] = [];` 内追加：

```ts
const customRoutes: CustomRoute[] = [
  {
    name: 'system-manage_setting',
    meta: {
      icon: 'ic:baseline-settings-applications',
      order: 3,
      redirect: 'system-manage_setting_input-format'
    }
  },
  { name: 'system-manage_setting_input-format', meta: { hideInMenu: true } },
  { name: 'system-manage_setting_print-format', meta: { hideInMenu: true } },
  { name: 'system-manage_setting_export-format', meta: { hideInMenu: true } },
  { name: 'system-manage_setting_waybill-rule', meta: { hideInMenu: true } },
  { name: 'system-manage_setting_notification-config', meta: { hideInMenu: true } },
  { name: 'system-manage_setting_init-data', meta: { hideInMenu: true } },
  { name: 'system-manage_setting_station-scan', meta: { hideInMenu: true } }
];
```

- [ ] **Step 5: zh-cn.ts 补 route 命名空间（7 条）**

在 `route:` 块末尾（`'data-manage_business': '业务'` 之后、`page:` 之前）追加：

```ts
    'system-manage_setting': '系统设置',
    'system-manage_setting_input-format': '录单格式',
    'system-manage_setting_print-format': '打印格式',
    'system-manage_setting_export-format': '导出格式',
    'system-manage_setting_waybill-rule': '运单号规则',
    'system-manage_setting_notification-config': '通知配置',
    'system-manage_setting_init-data': '初始化数据',
    'system-manage_setting_station-scan': '站点扫描配置',
```

- [ ] **Step 6: en-us.ts 补 route 命名空间（7 条）**

在对应 `route:` 块末尾（`'data-manage_business': 'Business'` 之后）追加：

```ts
    'system-manage_setting': 'System Settings',
    'system-manage_setting_input-format': 'Input Format',
    'system-manage_setting_print-format': 'Print Format',
    'system-manage_setting_export-format': 'Export Format',
    'system-manage_setting_waybill-rule': 'Waybill Rule',
    'system-manage_setting_notification-config': 'Notification Config',
    'system-manage_setting_init-data': 'Init Data',
    'system-manage_setting_station-scan': 'Station Scan Config',
```

- [ ] **Step 7: zh-cn.ts 补 `common.devInProgress` 与 `page.manage.setting`**

`common` 命名空间内（在 `tip: '提示',` 之后）追加：

```ts
    devInProgress: '待开发',
```

`page.manage` 命名空间内，在 `menu: { ... }` 块结束后、`dataManage:` 之前追加：

```ts
      setting: {
        inputFormat: '录单格式',
        printFormat: '打印格式',
        exportFormat: '导出格式',
        waybillRule: '运单号规则',
        notificationConfig: '通知配置',
        initData: '初始化数据',
        stationScan: '站点扫描配置',
        fieldMapping: '字段映射'
      },
```

- [ ] **Step 8: en-us.ts 同步补 `common.devInProgress` 与 `page.manage.setting`**

`common` 内（`tip: 'Tip',` 之后）追加：`devInProgress: 'In Progress',`
`page.manage` 内 `menu` 块后追加：

```ts
      setting: {
        inputFormat: 'Input Format',
        printFormat: 'Print Format',
        exportFormat: 'Export Format',
        waybillRule: 'Waybill Rule',
        notificationConfig: 'Notification Config',
        initData: 'Init Data',
        stationScan: 'Station Scan Config',
        fieldMapping: 'Field Mapping'
      },
```

- [ ] **Step 9: 验证**

Run: `pnpm typecheck`
Expected: PASS（无 `I18nKey` / 路由类型报错）。

---

## Task 2: 共享组件 `MasterDetail.vue`

**Files:**

- Create: `src/views/system-manage/setting/components/MasterDetail.vue`

**Interfaces:**

- Props: `listTitle: string`、`searchPlaceholder: string`、`items: {id:number; name:string; status:Api.Common.EnableStatus}[]`、`selectedId: number | null`、`editable?: boolean`（默认 true）。
- Emits: `update:selectedId`、`create`、`edit`、`delete`。
- 各左右布局 Tab（Task 4-5）消费此组件。

- [ ] **Step 1: 创建 `setting/components/MasterDetail.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';

interface ListItem {
  id: number;
  name: string;
  status: Api.Common.EnableStatus;
}

const props = withDefaults(
  defineProps<{
    listTitle?: string;
    searchPlaceholder?: string;
    items: ListItem[];
    selectedId: number | null;
    editable?: boolean;
  }>(),
  {
    listTitle: '',
    searchPlaceholder: '',
    editable: true
  }
);

const emit = defineEmits<{
  'update:selectedId': [id: number | null];
  create: [];
  edit: [];
  delete: [];
}>();

const keyword = defineModel<string>('keyword', { default: '' });

const filteredItems = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return props.items;
  return props.items.filter(item => item.name.toLowerCase().includes(kw));
});

function handleSelect(id: number) {
  emit('update:selectedId', id);
}
</script>

<template>
  <div class="h-full w-full flex overflow-hidden">
    <div class="w-240px h-full flex-col border-r-1 border-[#ebeef5]">
      <NCard :title="listTitle" class="h-full">
        <template #default>
          <NInput v-model:value="keyword" :placeholder="searchPlaceholder" clearable class="mb-12px" />
          <div class="h-[calc(100%-44px)] overflow-auto">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="menu-item"
              :class="{ 'menu-item--active': item.id === selectedId }"
              @click="handleSelect(item.id)"
            >
              <span class="truncate">{{ item.name }}</span>
              <span class="menu-item__status">
                {{ item.status === '1' ? $t('common.enable') : $t('common.disable') }}
              </span>
            </div>
          </div>
        </template>
      </NCard>
    </div>
    <div class="min-w-0 flex-1 flex-col p-16px">
      <div class="flex items-center justify-between pb-12px">
        <NSpace>
          <NButton v-if="editable" type="primary" ghost size="small" @click="emit('create')">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            {{ $t('common.add') }}
          </NButton>
          <NButton
            v-if="editable"
            type="primary"
            text
            size="small"
            :disabled="selectedId === null"
            @click="emit('edit')"
          >
            {{ $t('common.edit') }}
          </NButton>
          <NButton
            v-if="editable"
            type="error"
            text
            size="small"
            :disabled="selectedId === null"
            @click="emit('delete')"
          >
            {{ $t('common.delete') }}
          </NButton>
        </NSpace>
        <slot name="operation-extra" />
      </div>
      <div class="min-h-0 flex-1 overflow-auto">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 32px;
  padding: 4px 10px;
  margin: 6px 0;
  border-radius: 5px;
  cursor: pointer;
}
.menu-item:hover {
  background-color: var(--primary-color-hover);
}
.menu-item--active {
  color: #fff;
  background-color: var(--primary-color);
}
.menu-item__status {
  font-size: 12px;
  opacity: 0.85;
}
</style>
```

- [ ] **Step 2: 验证**

Run: `pnpm typecheck`
Expected: PASS（无 `Api.Common` 或 `icon-ic-round-plus` 解析报错）。

---

## Task 3: 共享组件 `FieldMapping.vue`

**Files:**

- Create: `src/views/system-manage/setting/components/FieldMapping.vue`

**Interfaces:**

- Props: `navGroups: {key:string; title:string; fields:string[]}[]`、`modelValue: Record<string, string[]>`（v-model）。
- Emit: `update:modelValue`。
- 各左右布局 Tab（Task 4-5）在右列插槽内使用。

- [ ] **Step 1: 创建 `setting/components/FieldMapping.vue`**

```vue
<script setup lang="ts">
interface NavGroup {
  key: string;
  title: string;
  fields: string[];
}

const props = defineProps<{
  navGroups: NavGroup[];
  modelValue: Record<string, string[]>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string[]>];
}>();

function toggleField(groupKey: string, field: string, checked: boolean) {
  const current = props.modelValue[groupKey] ?? [];
  const next = checked ? [...current, field] : current.filter(f => f !== field);
  emit('update:modelValue', { ...props.modelValue, [groupKey]: next });
}
</script>

<template>
  <NCard :title="$t('page.manage.setting.fieldMapping')" class="mt-16px">
    <div class="flex gap-16px">
      <div class="w-180px">
        <div v-for="g in navGroups" :key="g.key" class="py-8px font-medium">
          {{ g.title }}
        </div>
      </div>
      <div class="min-w-0 flex-1">
        <div v-for="g in navGroups" :key="g.key" class="mb-12px">
          <NGrid :cols="3" :x-gap="12" :y-gap="8">
            <NGridItem v-for="f in g.fields" :key="f">
              <NCheckbox
                :checked="(modelValue[g.key] ?? []).includes(f)"
                @update:checked="checked => toggleField(g.key, f, checked)"
              >
                {{ f }}
              </NCheckbox>
            </NGridItem>
          </NGrid>
        </div>
      </div>
    </div>
  </NCard>
</template>
```

- [ ] **Step 2: 验证**

Run: `pnpm typecheck`
Expected: PASS。

---

## Task 4: 「录单格式」Tab（左右布局，真实字段）

**Files:**

- Modify: `src/views/system-manage/setting/input-format/index.vue`（覆盖 Task 1 占位壳）

**Interfaces:** 消费 `MasterDetail` + `FieldMapping`。数据 `formats` 为内存 `ref`，结构供后续 Task 5 复制为示例。

- [ ] **Step 1: 编写 `input-format/index.vue`**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import { FormWrap } from '@/components/Form';
import type { FormItemConfig } from '@/components/Form';
import MasterDetail from '../components/MasterDetail.vue';
import FieldMapping from '../components/FieldMapping.vue';

interface InputFormatItem {
  id: number;
  name: string;
  status: Api.Common.EnableStatus;
  scope: ('internal' | 'customer' | 'wechat')[];
  remark: string;
  fields: Record<string, string[]>;
}

const navGroups = [
  { key: 'waybill', title: '运单信息', fields: ['业务备注', '内部备注', '小计金额', '净重', '货物件数', '长', '宽'] },
  { key: 'receiver', title: '收件人信息', fields: ['收件人姓名', '电话', '地址', '公司'] },
  { key: 'sender', title: '发件人信息', fields: ['发件人姓名', '电话', '地址'] },
  { key: 'goods', title: '物品信息', fields: ['品名', '数量', '重量', '体积'] },
  { key: 'subItem', title: '子件信息', fields: ['单件材积', '计费重', '单件重量'] }
];

const formats = ref<InputFormatItem[]>([
  {
    id: 1,
    name: '代发录单',
    status: '1',
    scope: ['internal', 'customer', 'wechat'],
    remark: '',
    fields: {
      waybill: ['业务备注', '内部备注'],
      receiver: [],
      sender: [],
      goods: ['小计金额', '净重', '货物件数', '长', '宽'],
      subItem: ['单件材积', '计费重']
    }
  },
  {
    id: 2,
    name: '专线录单',
    status: '1',
    scope: ['internal', 'customer'],
    remark: '',
    fields: {
      waybill: ['业务备注'],
      receiver: ['收件人姓名'],
      sender: [],
      goods: ['净重', '货物件数'],
      subItem: []
    }
  }
]);

const selectedId = ref<number | null>(formats.value[0]?.id ?? null);
const keyword = ref('');
const isEditing = ref(false);

const current = computed(() => formats.value.find(f => f.id === selectedId.value) ?? null);

const formModel = ref<{
  name: string;
  status: Api.Common.EnableStatus;
  scope: ('internal' | 'customer' | 'wechat')[];
  remark: string;
}>({ name: '', status: '1', scope: [], remark: '' });

const fieldModel = ref<Record<string, string[]>>({});

function loadCurrent() {
  const c = current.value;
  if (!c) return;
  formModel.value = { name: c.name, status: c.status, scope: [...c.scope], remark: c.remark };
  fieldModel.value = JSON.parse(JSON.stringify(c.fields));
}
loadCurrent();

const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.manage.setting.inputFormat') + '名称',
    type: 'input',
    required: true,
    span: 24,
    placeholder: '请输入格式名称'
  },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'switch',
    span: 24,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable')
  },
  {
    key: 'scope',
    label: '适用范围',
    type: 'checkbox',
    span: 24,
    options: [
      { label: '内部系统', value: 'internal' },
      { label: '客户下单', value: 'customer' },
      { label: '微信下单', value: 'wechat' }
    ]
  },
  { key: 'remark', label: $t('common.remark'), type: 'input', span: 24, placeholder: '请输入备注' }
]);

function handleCreate() {
  selectedId.value = null;
  isEditing.value = true;
  formModel.value = { name: '', status: '1', scope: [], remark: '' };
  fieldModel.value = {};
}
function handleEdit() {
  if (!current.value) return;
  isEditing.value = true;
}
function handleDelete() {
  if (selectedId.value === null) return;
  formats.value = formats.value.filter(f => f.id !== selectedId.value);
  selectedId.value = formats.value[0]?.id ?? null;
  loadCurrent();
}
function handleSave() {
  if (selectedId.value === null) {
    const id = Math.max(0, ...formats.value.map(f => f.id)) + 1;
    formats.value.push({
      id,
      name: formModel.value.name,
      status: formModel.value.status,
      scope: formModel.value.scope,
      remark: formModel.value.remark,
      fields: fieldModel.value
    });
    selectedId.value = id;
  } else {
    const idx = formats.value.findIndex(f => f.id === selectedId.value);
    if (idx >= 0) formats.value[idx] = { ...formats.value[idx], ...formModel.value, fields: fieldModel.value };
  }
  isEditing.value = false;
}
function handleCancel() {
  isEditing.value = false;
  loadCurrent();
}
</script>

<template>
  <MasterDetail
    list-title="录单格式列表"
    search-placeholder="搜索列表"
    :items="formats"
    :selected-id="selectedId"
    :editable="!isEditing"
    @update:selected-id="
      id => {
        selectedId = id;
        loadCurrent();
      }
    "
    @create="handleCreate"
    @edit="handleEdit"
    @delete="handleDelete"
  >
    <template #operation-extra>
      <NSpace v-if="isEditing">
        <NButton type="primary" size="small" @click="handleSave">保存</NButton>
        <NButton size="small" @click="handleCancel">取消</NButton>
      </NSpace>
    </template>
    <FormWrap v-if="current || isEditing" :model="formModel" :items="formItems" :disabled="!isEditing" />
    <FieldMapping
      v-if="current || isEditing"
      :nav-groups="navGroups"
      :model-value="fieldModel"
      @update:model-value="fieldModel = $event"
    />
  </MasterDetail>
</template>
```

- [ ] **Step 2: 验证**

Run: `pnpm typecheck`
Expected: PASS。

---

## Task 5: 其余 5 个左右布局 Tab（示例字段）

**Files:**

- Modify: `src/views/system-manage/setting/print-format/index.vue`
- Modify: `src/views/system-manage/setting/export-format/index.vue`
- Modify: `src/views/system-manage/setting/notification-config/index.vue`
- Modify: `src/views/system-manage/setting/init-data/index.vue`
- Modify: `src/views/system-manage/setting/station-scan/index.vue`

**Interfaces:** 复用 Task 2-3 组件。每个 Tab 用各自列表项 + 相同示例字段表单（格式名称 / 状态 / 适用范围 / 备注）+ 字段映射区，交互逻辑同 Task 4（新建/编辑/删除/保存/取消，内存态）。后续迭代时替换示例字段为真实业务字段。

- [ ] **Step 1: 编写 `print-format/index.vue`（示例字段骨架）**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import { FormWrap } from '@/components/Form';
import type { FormItemConfig } from '@/components/Form';
import MasterDetail from '../components/MasterDetail.vue';
import FieldMapping from '../components/FieldMapping.vue';

interface Item {
  id: number;
  name: string;
  status: Api.Common.EnableStatus;
  scope: string[];
  remark: string;
  fields: Record<string, string[]>;
}

const navGroups = [
  { key: 'waybill', title: '运单信息', fields: ['业务备注', '内部备注', '小计金额', '净重'] },
  { key: 'goods', title: '物品信息', fields: ['品名', '数量', '重量'] }
];

const items = ref<Item[]>([
  {
    id: 1,
    name: '默认打印格式',
    status: '1',
    scope: ['internal'],
    remark: '',
    fields: { waybill: ['业务备注'], goods: ['品名'] }
  },
  { id: 2, name: '客户打印格式', status: '1', scope: ['customer'], remark: '', fields: { waybill: [], goods: [] } }
]);

const selectedId = ref<number | null>(items.value[0]?.id ?? null);
const isEditing = ref(false);
const current = computed(() => items.value.find(i => i.id === selectedId.value) ?? null);

const formModel = ref({ name: '', status: '1' as Api.Common.EnableStatus, scope: [] as string[], remark: '' });
const fieldModel = ref<Record<string, string[]>>({});

function loadCurrent() {
  const c = current.value;
  if (!c) return;
  formModel.value = { name: c.name, status: c.status, scope: [...c.scope], remark: c.remark };
  fieldModel.value = JSON.parse(JSON.stringify(c.fields));
}
loadCurrent();

const formItems = computed<FormItemConfig[]>(() => [
  { key: 'name', label: '格式名称', type: 'input', required: true, span: 24, placeholder: '请输入格式名称' },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'switch',
    span: 24,
    checkedText: $t('common.enable'),
    uncheckedText: $t('common.disable')
  },
  {
    key: 'scope',
    label: '适用范围',
    type: 'checkbox',
    span: 24,
    options: [
      { label: '内部系统', value: 'internal' },
      { label: '客户下单', value: 'customer' },
      { label: '微信下单', value: 'wechat' }
    ]
  },
  { key: 'remark', label: $t('common.remark'), type: 'input', span: 24, placeholder: '请输入备注' }
]);

function handleCreate() {
  selectedId.value = null;
  isEditing.value = true;
  formModel.value = { name: '', status: '1', scope: [], remark: '' };
  fieldModel.value = {};
}
function handleEdit() {
  if (current.value) isEditing.value = true;
}
function handleDelete() {
  if (selectedId.value === null) return;
  items.value = items.value.filter(i => i.id !== selectedId.value);
  selectedId.value = items.value[0]?.id ?? null;
  loadCurrent();
}
function handleSave() {
  if (selectedId.value === null) {
    const id = Math.max(0, ...items.value.map(i => i.id)) + 1;
    items.value.push({
      id,
      name: formModel.value.name,
      status: formModel.value.status,
      scope: formModel.value.scope,
      remark: formModel.value.remark,
      fields: fieldModel.value
    });
    selectedId.value = id;
  } else {
    const idx = items.value.findIndex(i => i.id === selectedId.value);
    if (idx >= 0) items.value[idx] = { ...items.value[idx], ...formModel.value, fields: fieldModel.value };
  }
  isEditing.value = false;
}
function handleCancel() {
  isEditing.value = false;
  loadCurrent();
}
</script>

<template>
  <MasterDetail
    list-title="打印格式列表"
    search-placeholder="搜索列表"
    :items="items"
    :selected-id="selectedId"
    :editable="!isEditing"
    @update:selected-id="
      id => {
        selectedId = id;
        loadCurrent();
      }
    "
    @create="handleCreate"
    @edit="handleEdit"
    @delete="handleDelete"
  >
    <template #operation-extra>
      <NSpace v-if="isEditing">
        <NButton type="primary" size="small" @click="handleSave">保存</NButton>
        <NButton size="small" @click="handleCancel">取消</NButton>
      </NSpace>
    </template>
    <FormWrap v-if="current || isEditing" :model="formModel" :items="formItems" :disabled="!isEditing" />
    <FieldMapping
      v-if="current || isEditing"
      :nav-groups="navGroups"
      :model-value="fieldModel"
      @update:model-value="fieldModel = $event"
    />
  </MasterDetail>
</template>
```

- [ ] **Step 2: 编写 `export-format/index.vue`**

复制 Step 1 文件，仅改 `list-title="导出格式列表"`、列表项 `name` 示例为「默认导出格式 / 客户导出格式」、`navGroups` 标题可保留示例。

- [ ] **Step 3: 编写 `notification-config/index.vue`**

复制 Step 1 文件，改 `list-title="通知配置列表"`、列表项 `name` 示例为「系统通知 / 短信通知」。

- [ ] **Step 4: 编写 `init-data/index.vue`**

复制 Step 1 文件，改 `list-title="初始化数据列表"`、列表项 `name` 示例为「基础数据初始化 / 业务数据初始化」。

- [ ] **Step 5: 编写 `station-scan/index.vue`**

复制 Step 1 文件，改 `list-title="站点扫描配置列表"`、列表项 `name` 示例为「默认扫描配置 / 高速扫描配置」。

- [ ] **Step 6: 验证**

Run: `pnpm typecheck`
Expected: PASS（5 个文件均无类型错误）。

---

## Task 6: 「运单号规则」Tab（整页表格）

**Files:**

- Modify: `src/views/system-manage/setting/waybill-rule/index.vue`（覆盖 Task 1 占位壳）

**Interfaces:** 使用通用 `Table` + `useVxeTable`（`src/components/Table`），mock 列表数据（内存），不调接口。列配置 `cacheKey: 'system-manage-setting-waybill-rule'`。

- [ ] **Step 1: 编写 `waybill-rule/index.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';

interface WaybillRule {
  id: number;
  name: string;
  prefix: string;
  startValue: number;
  step: number;
  currentNo: number;
  status: Api.Common.EnableStatus;
  createTime: string;
}

const mockRules: WaybillRule[] = [
  {
    id: 1,
    name: '默认运单号规则',
    prefix: 'YD',
    startValue: 1000,
    step: 1,
    currentNo: 1025,
    status: '1',
    createTime: '2026-01-01 10:00'
  },
  {
    id: 2,
    name: '专线运单号规则',
    prefix: 'ZX',
    startValue: 5000,
    step: 1,
    currentNo: 5033,
    status: '1',
    createTime: '2026-02-15 14:30'
  },
  {
    id: 3,
    name: '测试运单号规则',
    prefix: 'CS',
    startValue: 1,
    step: 1,
    currentNo: 8,
    status: '0',
    createTime: '2026-03-20 09:12'
  }
];

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns } = useVxeTable<
  { records: WaybillRule[]; total: number },
  WaybillRule
>({
  api: () => Promise.resolve({ records: mockRules, total: mockRules.length }),
  transform: r => ({ records: r.records, total: r.total }),
  columns: () =>
    [
      { key: 'name', title: '规则名称', type: 'detail', visible: true, sortable: false },
      { key: 'prefix', title: '前缀', visible: true, sortable: false },
      { key: 'startValue', title: '起始值', visible: true, sortable: false },
      { key: 'step', title: '步长', visible: true, sortable: false },
      { key: 'currentNo', title: '当前序号', visible: true, sortable: false },
      {
        key: 'status',
        title: $t('common.status'),
        type: 'status',
        visible: true,
        width: 100,
        fixed: 'right',
        align: 'center',
        sortable: false
      },
      { key: 'createTime', title: '创建时间', visible: true, width: 180, sortable: true }
    ] as VxeColumnConfig[],
  defaultPageSize: 20,
  cacheKey: 'system-manage-setting-waybill-rule'
});

const configVisible = ref(false);

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}
function handleDelete(row: WaybillRule) {
  data.value = data.value.filter(item => item.id !== row.id);
  pagination.total = Math.max(0, pagination.total - 1);
}
</script>

<template>
  <div class="h-full w-full p-16px">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :show-seq="true"
      :show-action="true"
      @refresh="getData"
      @page-change="handlePageChange"
    >
      <template #operation-left>
        <NSpace justify="start" wrap>
          <NButton size="small" type="primary" ghost @click="getData">
            <template #icon><icon-ic-round-plus class="text-icon" /></template>
            {{ $t('common.add') }}
          </NButton>
        </NSpace>
      </template>
      <template #operation-right>
        <NSpace justify="end" wrap>
          <NButton size="small" @click="configVisible = true">
            <template #icon><icon-mdi-cog class="text-icon" /></template>
            {{ $t('common.columnSetting') }}
          </NButton>
          <NButton size="small" @click="getData">
            <template #icon><icon-mdi-refresh class="text-icon" /></template>
          </NButton>
        </NSpace>
      </template>
      <template #action="{ row }">
        <NSpace justify="center">
          <NButton size="small" type="primary" text>{{ $t('common.edit') }}</NButton>
          <NPopconfirm @positive-click="handleDelete(row)">
            <template #trigger>
              <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
            </template>
            {{ $t('common.confirmDelete') }}
          </NPopconfirm>
        </NSpace>
      </template>
    </Table>

    <TableColumnConfig v-model:visible="configVisible" v-model:columns="columnConfigs" @confirm="persistColumns" />
  </div>
</template>
```

- [ ] **Step 2: 验证**

Run: `pnpm typecheck`
Expected: PASS。

---

## Task 7: 整体验证与格式化

**Files:** 无新增，仅全量校验。

- [ ] **Step 1: 类型检查**

Run: `pnpm typecheck`
Expected: PASS。

- [ ] **Step 2: Lint**

Run: `pnpm lint`
Expected: 无 error / warning。

- [ ] **Step 3: 格式化**

Run: `pnpm fmt`
Expected: 文件已按 oxfmt 规则格式化，无未格式化改动残留。

- [ ] **Step 4: 构建验证（可选但推荐）**

Run: `pnpm build:test`
Expected: 构建成功。

> 本任务不提交（用户要求暂不提交）。如需提交，使用 `pnpm commit` 按 Conventional Commits 生成提交信息。

---

## 自检

- **Spec 覆盖**：§2 范围（6 左右 + 1 表格）→ Task 2-6 实现；§3 路由 hideInMenu → Task 1 Step 4；§4 目录 → 全部 Task 的 Files；§5 customRoutes → Task 1 Step 4；§6 父页 → Task 1 Step 1；§7 共享组件 → Task 2-3；§8 录单格式 → Task 4；§9 示例 Tab → Task 5；§10 运单号表格 → Task 6；§11 i18n → Task 1 Step 5-8。
- **占位扫描**：无 TBD/TODO，所有 step 含实际代码或明确命令。
- **类型一致性**：`MasterDetail` props（`items/selectedId/editable`）、`FieldMapping` props（`navGroups/modelValue`）、`useVxeTable` 签名均前后一致；`Api.Common.EnableStatus` 在 Task 2-6 统一使用。
- **无提交步骤**：Task 7 明确标注暂不提交，遵循用户「不需要提交，继续」的指令。
