# 可折叠搜索栏内置于 Table 组件 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: 使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务执行。步骤用 checkbox（`- [ ]`）跟踪。

**目标：** 把列表页搜索栏做成 `Table` 组件的可选内置能力（默认收起、右上角搜索图标切换显隐），并迁移 MasterData 档案页与 `system-manage/role` 两处内联搜索栏。

**架构：** 在 `src/components/Table/table.vue` 新增 `searchItems` / `searchModel` / `searchDefaultCollapsed` 三个 prop 与 `search` / `reset` 两个 emit；搜索面板用 `NFormWrap` 渲染，折叠状态由 `searchCollapsed` 控制。页面只负责提供 `searchItems` 与 `searchModel`（响应式对象，按引用双向绑定），并监听 `search` / `reset` 触发取数。

**技术栈：** Vue 3 `<script setup lang="ts">`、Naive UI（NCard / NButton 经 unplugin 自动引入）、本地 `NFormWrap` 组件、vxe-table、`UnoCSS`、`$t` i18n。

## 全局约束（来自 spec，逐任务隐含遵循）

- 代码注释、文档、commit 说明一律中文（覆盖 AGENTS.md 的英文 JSDoc 约定，见 MEMORY.md）。
- 禁止 `any`，必要时用 `unknown` + 类型收窄。
- 禁止手写路由表、禁止改 `src/router/elegant/**`。
- 新增 i18n 键须 zh-cn / en-us 同步；本任务复用 `common.search` / `common.reset`，不新增键。
- **本项目无测试框架**：验证统一用 `pnpm typecheck` + `pnpm lint` + `pnpm build`；不要去找单测命令。
- 业务代码禁止直接调 axios，统一走 `@/service/request` + `@/service/api`（本任务不涉及接口改动）。

---

### Task 1：Table 组件新增可折叠搜索栏能力

**文件：**

- 修改：`src/components/Table/table.vue`

**接口（本任务产出，后续任务依赖）：**

- 新增 Prop：`searchItems?: FormItemConfig[]`、`searchModel?: Record<string, unknown>`、`searchDefaultCollapsed?: boolean`（默认 `true`）
- 新增 Emit：`search`、`reset`
- 内部状态：`searchCollapsed: Ref<boolean>`（初始取 `searchDefaultCollapsed`）、`showSearch: ComputedRef<boolean>`（= `!!searchItems?.length && !!searchModel`）

- [ ] **步骤 1：补充 `NFormWrap` 与 `FormItemConfig` 导入**

在 `src/components/Table/table.vue` 顶部 import 区，把 `import { computed } from 'vue';` 改为同时引入 `ref`，并新增 `NFormWrap` 导入：

```ts
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Link from '@/components/common/link.vue';
import IconRenderer from '@/components/custom/icon-renderer.vue';
import { copyText } from '@/utils/common';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import type { VxeColumnRenderColumn, VxePagination } from './use-vxe-table';
import type { VxeTablePropTypes } from 'vxe-table';
```

- [ ] **步骤 2：Props 接口新增三项**

在 `Props` 接口内（`treeConfig` 项之后）追加：

```ts
  /** vxe-table tree-config, enable tree mode when provided */
  treeConfig?: VxeTablePropTypes.TreeConfig;
  /** 搜索表单项，传入即启用搜索栏 */
  searchItems?: FormItemConfig[];
  /** 搜索参数对象（按引用直接双向绑定） */
  searchModel?: Record<string, unknown>;
  /** 搜索面板是否默认收起 */
  searchDefaultCollapsed?: boolean;
```

并在 `withDefaults` 中补充默认值（`treeConfig: undefined` 之后）：

```ts
  treeConfig: undefined,
  searchItems: undefined,
  searchModel: undefined,
  searchDefaultCollapsed: true
```

- [ ] **步骤 3：emits 新增 `search` / `reset`，并新增折叠状态**

在 `defineEmits` 块内追加：

```ts
  (e: 'detail', row: any): void;
  (e: 'search'): void;
  (e: 'reset'): void;
```

在 `emit` 定义之后（脚本中部）新增：

```ts
const searchCollapsed = ref(props.searchDefaultCollapsed);
const showSearch = computed(() => !!props.searchItems?.length && !!props.searchModel);
```

- [ ] **步骤 4：操作栏右侧追加搜索图标按钮**

把模板里 operation-right 的 `<div>` 改为：

```vue
<div class="flex-y-center gap-8px flex-wrap justify-end">
        <slot name="operation-right" :refresh="refresh" />
        <NButton
          v-if="showSearch"
          size="small"
          :type="searchCollapsed ? 'default' : 'primary'"
          @click="searchCollapsed = !searchCollapsed"
        >
          <template #icon>
            <icon-ic-round-search class="text-icon" />
          </template>
        </NButton>
      </div>
```

- [ ] **步骤 5：操作栏与表格容器之间插入搜索面板**

在 operation 栏的 `</div>` 之后、表格容器 `<div class="relative w-full min-h-0 bg-white" ...>` 之前，插入：

```vue
<Transition name="fade">
      <NCard v-if="showSearch && !searchCollapsed" :bordered="false" class="card-wrapper shrink-0 mb-12px">
        <NFormWrap
          :model="searchModel!"
          :items="searchItems"
          :grid-x-gap="16"
          label-placement="left"
          :label-width="80"
          grid-responsive="self"
        >
          <template #actions>
            <div class="flex items-center gap-8px">
              <NButton type="primary" ghost @click="emit('search')">
                <template #icon>
                  <icon-ic-round-search class="text-icon" />
                </template>
                {{ $t('common.search') }}
              </NButton>
              <NButton @click="emit('reset')">
                <template #icon>
                  <icon-ic-round-refresh class="text-icon" />
                </template>
                {{ $t('common.reset') }}
              </NButton>
            </div>
          </template>
        </NFormWrap>
      </NCard>
    </Transition>
```

- [ ] **步骤 6：类型检查**

运行：`pnpm typecheck`
预期：PASS（无 `any`、无未定义引用）。

- [ ] **步骤 7：提交**

```bash
git add src/components/Table/table.vue
git commit -m "feat: Table 内置可折叠搜索栏能力"
```

---

### Task 2：迁移 master-data-archive.vue 使用新搜索栏

**文件：**

- 修改：`src/components/MasterData/master-data-archive.vue`

**接口（依赖 Task 1 产出的 Table props/emits）：**

- 向 `<Table>` 传 `:search-items="config.searchItems"`、`:search-model="searchParams"`、`@search="handleSearch"`、`@reset="handleReset"`
- 删除原内联 `<NCard><NFormWrap>…</NFormWrap></NCard>` 搜索块

- [ ] **步骤 1：删除内联搜索块**

删除模板中（`<div class="h-full w-full flex flex-col gap-12px py-8px px-16px">` 之下、`<div class="flex-1 min-h-0">` 之前）的整段：

```vue
<NCard :bordered="false" class="card-wrapper shrink-0">
      <NFormWrap
        :model="searchParams"
        :items="config.searchItems"
        :grid-x-gap="16"
        label-placement="left"
        :label-width="80"
        grid-responsive="self"
      >
        <template #actions>
          <div class="flex items-center gap-8px">
            <NButton type="primary" ghost @click="handleSearch">
              <template #icon><icon-ic-round-search class="text-icon" /></template>
              {{ $t('common.search') }}
            </NButton>
            <NButton @click="handleReset">
              <template #icon><icon-ic-round-refresh class="text-icon" /></template>
              {{ $t('common.reset') }}
            </NButton>
          </div>
        </template>
      </NFormWrap>
    </NCard>
```

- [ ] **步骤 2：给 `<Table>` 增加搜索栏相关属性**

把：

```vue
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-checkbox="true"
        :show-action="true"
        :action-width="180"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
      >
```

改为：

```vue
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-checkbox="true"
        :show-action="true"
        :action-width="180"
        :search-items="config.searchItems"
        :search-model="searchParams"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
      >
```

注意：`searchParams`（脚本中已是 `reactive<Record<string, unknown>>`）、`handleSearch`、`handleReset` 均保持不变；`NFormWrap` 导入仍被抽屉表单使用，保留。

- [ ] **步骤 3：类型检查 + lint**

运行：`pnpm typecheck && pnpm lint`
预期：PASS。

- [ ] **步骤 4：提交**

```bash
git add src/components/MasterData/master-data-archive.vue
git commit -m "refactor: 档案页搜索栏改用 Table 内置能力"
```

---

### Task 3：迁移 system-manage/role/index.vue 使用新搜索栏

**文件：**

- 修改：`src/views/system-manage/role/index.vue`

**接口（依赖 Task 1 产出的 Table props/emits）：**

- 向 `<Table>` 传 `:search-items="searchItems"`、`:search-model="searchParams"`、`@search="handleSearch"`、`@reset="handleReset"`
- 删除原内联搜索块
- 因 `searchModel` prop 为 `Record<string, unknown>`，需让 `searchParams` 可被赋值到该类型（接口类型缺索引签名，不可直接赋值；用交叉类型补上索引签名，保持原有字段类型）

- [ ] **步骤 1：调整 `searchParams` 类型以兼容 `searchModel`**

把：

```ts
const searchParams = reactive<Omit<Api.SystemManage.RoleSearchParams, 'current' | 'size'>>({
  roleName: '',
  roleCode: '',
  status: null
});
```

改为（交叉 `Record<string, unknown>`，保留原有字段类型，同时可赋值给 `searchModel`）：

```ts
const searchParams = reactive<Omit<Api.SystemManage.RoleSearchParams, 'current' | 'size'> & Record<string, unknown>>({
  roleName: '',
  roleCode: '',
  status: null
});
```

- [ ] **步骤 2：删除不再使用的 `NFormWrap` 导入，保留 `FormItemConfig`**

把：

```ts
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
```

改为（内联搜索块删除后，本文件不再渲染 `NFormWrap`，但 `searchItems` computed 仍用 `FormItemConfig`）：

```ts
import type { FormItemConfig } from '@/components/Form/index.vue';
```

- [ ] **步骤 3：删除内联搜索块**

删除模板中（根 `<div class="h-full w-full flex flex-col gap-12px p-16px">` 之下、`<div class="flex-1 min-h-0">` 之前）的整段：

```vue
<NCard :bordered="false" class="card-wrapper shrink-0">
      <NFormWrap
        :model="searchParams"
        :items="searchItems"
        :grid-x-gap="16"
        label-placement="left"
        :label-width="70"
        grid-responsive="self"
      >
        <template #actions>
          <div class="flex items-center gap-8px">
            <NButton type="primary" ghost @click="handleSearch">
              <template #icon>
                <icon-ic-round-search class="text-icon" />
              </template>
              {{ $t('common.search') }}
            </NButton>
            <NButton @click="handleReset">
              <template #icon>
                <icon-ic-round-refresh class="text-icon" />
              </template>
              {{ $t('common.reset') }}
            </NButton>
          </div>
        </template>
      </NFormWrap>
    </NCard>
```

- [ ] **步骤 4：给 `<Table>` 增加搜索栏相关属性**

把：

```vue
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-checkbox="true"
        :show-action="true"
        :action-width="180"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
        @detail="handleDetail"
      >
```

改为：

```vue
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :show-seq="true"
        :show-checkbox="true"
        :show-action="true"
        :action-width="180"
        :search-items="searchItems"
        :search-model="searchParams"
        @search="handleSearch"
        @reset="handleReset"
        @refresh="getData"
        @page-change="handlePageChange"
        @selection-change="handleSelectionChange"
        @detail="handleDetail"
      >
```

`handleSearch` / `handleReset` 保持不变（仍重置 `searchParams` 并触发 `getData`）。

- [ ] **步骤 5：类型检查 + lint**

运行：`pnpm typecheck && pnpm lint`
预期：PASS（`searchParams` 交叉类型可赋值给 `searchModel`；`searchItems` 类型 `FormItemConfig[]` 与 Table prop 一致）。

- [ ] **步骤 6：提交**

```bash
git add src/views/system-manage/role/index.vue
git commit -m "refactor: 角色页搜索栏改用 Table 内置能力"
```

---

### Task 4：整体验证（typecheck / lint / build）

**文件：** 无新增，仅验证。
**依赖：** Task 1–3 全部完成。

- [ ] **步骤 1：类型检查**

运行：`pnpm typecheck`
预期：PASS，无 `any`、无类型错误。

- [ ] **步骤 2：lint**

运行：`pnpm lint`
预期：PASS（oxlint + eslint 无报错）。

- [ ] **步骤 3：生产构建**

运行：`pnpm build`
预期：构建成功。

- [ ] **步骤 4：手动核对（可选但建议）**

在 dev 环境（`pnpm dev`）打开任一 MasterData 档案页与「角色管理」页，确认：

- 进入页面时搜索面板默认收起；
- 点击操作栏最右侧搜索图标，面板展开；再次点击收起；
- 展开后「搜索 / 重置」按钮触发重新取数（参数生效）；
- 收起后面板隐藏、表格占满释放空间；
- 列设置、刷新等原有操作不受影响。

- [ ] **步骤 5：提交 spec 与 plan（若尚未提交）**

```bash
git add docs/superpowers/specs/2026-09-03-search-bar-table-design.md docs/superpowers/plans/2026-09-03-search-bar-table.md
git commit -m "docs: 补充可折叠搜索栏设计与实现计划"
```
