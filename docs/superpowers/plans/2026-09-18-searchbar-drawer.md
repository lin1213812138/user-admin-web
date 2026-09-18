# 表格封装搜索栏改为侧滑抽屉 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `Table` 组件里由 `searchItems` 驱动的内联可折叠搜索栏，改造成右侧滑出的 `NDrawer` 抽屉，释放表格上方纵向空间。

**Architecture:** 将 `SearchBar` 组件内部从 `NCard` 折叠卡片重写为 `NDrawer` + `NDrawerContent` 包裹 `NFormWrap`，受控 `v-model:show`；`Table` 移除内联折叠逻辑，改为用一个 ref 控制抽屉开关，并复用现有 `searchItems`/`searchModel`/`@search`/`@reset` 契约，从而 23 个调用页面零改动。

**Tech Stack:** Vue 3.5 `<script setup lang="ts">`、Naive UI（`NDrawer`/`NDrawerContent`，经 `unplugin-vue-components` 的 NaiveUiResolver 自动注册）、`NFormWrap`（`@/components/Form`）、UnoCSS。

## Global Constraints

- 包管理只能用 `pnpm`，禁止 `npm`/`yarn`。（来源：AGENTS.md 技术栈/常用命令）
- 验证手段为 `pnpm typecheck` + `pnpm lint` + `pnpm build`，本仓库**没有测试框架、没有 test 脚本**，不要臆造单测入口。（来源：AGENTS.md pre-commit 说明）
- `src/router/elegant/*` 为自动生成，**禁止手改**；本次不涉及路由。（来源：AGENTS.md）
- Naive UI 组件（含 `NDrawer`/`NDrawerContent`）在本项目通过 `unplugin-vue-components` 自动按需注册，**无需**在 `<script setup>` 中显式 `import`。（来源：SoybeanAdmin 模板约定，且 `table.vue` 中 `NCard`/`NButton`/`NPagination` 等均未显式 import）
- 任何实现动作前设计必须经 brainstorming 确认（已完成，spec 已批准）。（来源：AGENTS.md 规则 2）

---

## File Structure

- Modify: `src/components/SearchBar/search-bar.vue`
  - 责任：渲染侧滑抽屉，内部 `NFormWrap` 展示搜索表单项，footer 放「重置/搜索」按钮；对外暴露 `v-model:show` 及 `search`/`reset`/`update:show` 事件。
- Modify: `src/components/Table/table.vue`
  - 责任：移除内联折叠搜索栏，新增 `searchDrawerVisible` ref 控制抽屉；operation-right 搜索按钮改为打开抽屉；删除 `searchDefaultCollapsed` 属性与 `searchCollapsed` ref。

> 以上两个文件各自独立可改，互不依赖；`Table` 仅消费 `SearchBar` 的新 props/events，契约在 Task 1 锁定。

---

## Task 1: 重写 SearchBar 为侧滑抽屉

**Files:**

- Modify: `src/components/SearchBar/search-bar.vue`（整文件重写）

**Interfaces:**

- Consumes: `NFormWrap`（`@/components/Form`，props `model`/`items`/`grid-x-gap`/`grid-responsive`/`label-placement`/`label-width`）、`FormItemConfig` 类型、vue-i18n `$t`（key：`common.search`/`common.reset`/`common.filter`）。
- Produces: 组件对外接口 —— props `{ show: boolean; items: FormItemConfig[]; model: Record<string, unknown>; width?: number|string; placement?: 'right'|'left'|'top'|'bottom'; labelPlacement?: 'left'|'top'; labelWidth?: number|string; gridXGap?: number }`，emits `{ search: []; reset: []; 'update:show': [value: boolean] }`。`Table` 在 Task 2 按此接口消费。

- [ ] **Step 1: 整文件重写为抽屉形态**

将 `src/components/SearchBar/search-bar.vue` 内容替换为以下代码（保留原中文注释风格）：

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';
import NFormWrap from '@/components/Form/index.vue';
import type { FormItemConfig } from '@/components/Form/index.vue';

type Model = Record<string, unknown>;

interface Props {
  /** 抽屉可见性（由父级用 v-model:show 控制） */
  show?: boolean;
  /** 搜索表单项（沿用 Table 的 searchItems 结构） */
  items: FormItemConfig[];
  /** 搜索表单数据对象（按引用传入，父级持有并在取数时读取） */
  model: Model;
  /** 抽屉宽度（px），默认 420 */
  width?: number | string;
  /** 滑出方向，默认右侧 */
  placement?: 'right' | 'left' | 'top' | 'bottom';
  /** 标签位置：抽屉较窄，默认 top 纵向堆叠可读性更好 */
  labelPlacement?: 'left' | 'top';
  /** 标签宽度 */
  labelWidth?: number | string;
  /** 24 栅格系统的列间距（px） */
  gridXGap?: number;
  /** 栅格响应式断点模式 */
  gridResponsive?: 'self' | 'screen';
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  width: 420,
  placement: 'right',
  labelPlacement: 'top',
  labelWidth: 80,
  gridXGap: 16,
  gridResponsive: 'self'
});

const emit = defineEmits<{
  search: [];
  reset: [];
  'update:show': [value: boolean];
}>();

/**
 * 抽屉内表单强制单列：派生一份把每个 item 的 span 收敛为 24 的配置，
 * 不修改调用方原始 searchItems；窄抽屉下多列会挤压，单列可读性最佳。
 */
const drawerItems = computed<FormItemConfig[]>(() => props.items.map(item => ({ ...item, span: 24 })));
</script>

<template>
  <NDrawer :show="show" :width="width" :placement="placement" @update:show="emit('update:show', $event)">
    <NDrawerContent :title="$t('common.search')" :native-scrollbar="false">
      <NFormWrap
        :model="model"
        :items="drawerItems"
        :grid-x-gap="gridXGap"
        :grid-responsive="gridResponsive"
        :label-placement="labelPlacement"
        :label-width="labelWidth"
      />
      <template #footer>
        <div class="flex items-center justify-end gap-8px">
          <NButton @click="emit('reset')">
            <template #icon><icon-ic-round-refresh class="text-icon" /></template>
            {{ $t('common.reset') }}
          </NButton>
          <NButton type="primary" @click="emit('search')">
            <template #icon><icon-ic-round-search class="text-icon" /></template>
            {{ $t('common.search') }}
          </NButton>
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
```

> 说明：`NDrawer`/`NDrawerContent`/`NButton`/`NFormWrap` 均经 `unplugin-vue-components` 自动注册，无需显式 import。抽屉自带 teleport，模板位置不影响布局。

- [ ] **Step 2: 类型检查确认 SearchBar 无错误**

Run: `pnpm typecheck`
Expected: 无 `SearchBar` 相关 TS 报错（可能仍有其它文件未改导致的报红不在此任务范围；本文件应无 `search-bar.vue` 错误）。

- [ ] **Step 3: 暂存并提交 SearchBar 改动**

```bash
git add src/components/SearchBar/search-bar.vue
git commit -m "refactor(search-bar): 内联折叠卡片改为右侧滑出抽屉 NDrawer"
```

---

## Task 2: Table 接入抽屉并移除内联折叠逻辑

**Files:**

- Modify: `src/components/Table/table.vue`（script 属性/状态 + template 三处）

**Interfaces:**

- Consumes: Task 1 锁定的 `SearchBar` 接口（`v-model:show` + `search`/`reset` 事件 + `items`/`model` props）。
- Produces: `Table` 对外行为 —— 有 `searchItems` 时 operation-right 出现搜索图标按钮，点击打开抽屉；抽屉内「搜索」触发父级 `@search` 并关闭，「重置」触发父级 `@reset` 并保持打开。`searchItems`/`searchModel`/`@search`/`@reset` 契约不变，23 个调用页零改动。

- [ ] **Step 1: 删除 `searchDefaultCollapsed` 属性声明**

在 `Props` 接口中，删除以下两行（位于 `searchModel` 与 `actionExport` 注释之间）：

```ts
  /** 搜索栏是否默认收起 */
  searchDefaultCollapsed?: boolean;
```

- [ ] **Step 2: 删除 withDefaults 中的对应默认值**

删除 `withDefaults(defineProps<Props>(), { ... })` 中的该行：

```ts
  searchDefaultCollapsed: true,
```

- [ ] **Step 3: 删除 `searchCollapsed` ref 及其注释**

删除以下行：

```ts
/** 搜索栏是否收起（默认收起，让表格更清爽） */
const searchCollapsed = ref(props.searchDefaultCollapsed);
```

并在其后新增抽屉开关状态（放在 `const tableRef = ref<...>(null);` 附近即可）：

```ts
/** 搜索抽屉可见性：替代原内联折叠，点击搜索图标打开右侧抽屉 */
const searchDrawerVisible = ref(false);

/** 抽屉内点「搜索」：触发父级筛选并关闭抽屉 */
function handleSearch() {
  emit('search');
  searchDrawerVisible.value = false;
}

/** 抽屉内点「重置」：触发父级重置，抽屉保持打开 */
function handleReset() {
  emit('reset');
}
```

- [ ] **Step 4: 删除 template 中的内联 SearchBar 块**

删除以下整段（原 `v-if="searchItems?.length"` 的内联卡片）：

```vue
<div v-if="searchItems?.length">
      <SearchBar
        :items="searchItems"
        :model="searchModel ?? {}"
        :collapsed="searchCollapsed"
        @search="emit('search')"
        @reset="emit('reset')"
      />
    </div>
```

- [ ] **Step 5: operation-right 搜索按钮改为打开抽屉**

将原来的按钮：

```vue
<NButton
  v-if="searchItems?.length"
  size="small"
  :type="searchCollapsed ? 'default' : 'primary'"
  :title="$t('common.search')"
  @click="searchCollapsed = !searchCollapsed"
>
          <template #icon><icon-ic-round-search class="text-icon" /></template>
        </NButton>
```

替换为：

```vue
<NButton
  v-if="searchItems?.length"
  size="small"
  type="default"
  :title="$t('common.search')"
  @click="searchDrawerVisible = true"
>
          <template #icon><icon-ic-round-search class="text-icon" /></template>
        </NButton>
```

- [ ] **Step 6: 在模板中渲染抽屉（放在分页块之后、根容器闭合前）**

在分页 `<div v-if="pagination" ...>` 块之后、`</div>`（根 flex 容器）闭合之前，新增：

```vue
<SearchBar
  v-if="searchItems?.length"
  v-model:show="searchDrawerVisible"
  :items="searchItems"
  :model="searchModel ?? {}"
  @search="handleSearch"
  @reset="handleReset"
/>
```

- [ ] **Step 7: 类型检查**

Run: `pnpm typecheck`
Expected: 通过，无 `table.vue` 报错；确认 `searchCollapsed`/`searchDefaultCollapsed` 已无残留引用。

- [ ] **Step 8: Lint**

Run: `pnpm lint`
Expected: 通过（oxlint + eslint 无 error/warning）。

- [ ] **Step 9: 构建**

Run: `pnpm build:test`
Expected: 构建成功，无类型/打包错误。

- [ ] **Step 10: 提交**

```bash
git add src/components/Table/table.vue
git commit -m "refactor(table): 内联搜索栏改为侧滑抽屉，复用 searchItems 契约"
```

---

## Task 3: 回归与冒烟验证

**Files:**

- 验证范围：`src/views/system-manage/user/index.vue` 等 23 个调用页（只读确认，不需要改动）

**Interfaces:**

- Consumes: 已完成 Task 1/2 的 `Table` + `SearchBar`。
- Produces: 无代码产出，仅验证结论。

- [ ] **Step 1: 静态确认调用方契约未变**

Run: `pnpm typecheck`（已由 Task 2 跑过，确认通过即可）。重点确认 23 个页面中 `:search-items` / `:search-model` / `@search` / `@reset` 的使用未因属性删除而产生类型错误（`searchDefaultCollapsed` 已确认无任何调用方使用）。

- [ ] **Step 2: 手动冒烟（开发服务器）**

Run: `pnpm dev`（或 `pnpm dev:prod`）并在浏览器打开任一含搜索栏的页面（如 `system-manage/user`）。确认：

- 表格上方**不再**有内联搜索卡片；
- operation-right 出现搜索图标按钮（有 `searchItems` 时）；
- 点搜索图标 → 右侧抽屉滑出，表单按当前 `searchModel` 回填；
- 点「搜索」→ 触发父级取数（列表刷新）且抽屉关闭；
- 点「重置」→ 触发父级重置取数，抽屉保持打开；
- `search-action` 自定义快捷搜索插槽仍正常内联显示（如有页面使用）。

- [ ] **Step 3: 记录 changelog（遵循 AGENTS.md 规则 1）**

在 `changelog/` 下新建 `changelog/表格搜索栏改侧滑抽屉.md`，简述问题定位、决策（右侧滑出 / 搜索后自动关闭 / 纵向堆叠）、改动文件与回归结果；并在 `AGENTS_CHANGELOG.md` 索引按日期分组追加本条链接。

> 注：若 Step 2 手动验证发现个别页面 `searchItems` 含 `slot` 类型 action 项导致抽屉内出现重复按钮，单独评估是否需在 `SearchBar` 中过滤 `slot` 项，不在本计划默认范围内。
