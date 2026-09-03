# 可折叠搜索栏内置于 Table 组件

- 日期：2026-09-03
- 状态：已落地（implemented）

## 目标

把列表页搜索栏做成共享 `Table` 组件（`src/components/Table/table.vue`）的**可选内置能力**，
让所有表格都能复用。搜索面板可折叠：**默认收起**，表格操作栏最右侧放一个搜索图标按钮，
点击切换搜索面板的显隐。展开/收起通过点击该图标完成。

此举把现有两处内联搜索栏实现（MasterData 档案页、`system-manage/role`）收敛为一个可复用组件，
并让未来其它列表页也能直接使用该模式。

## 范围

- 涉及文件：
  - `src/components/SearchBar/search-bar.vue`（**新增独立、可复用**的搜索栏组件，无 MasterData 依赖）
  - `src/components/Table/table.vue`（新增可选搜索栏能力，内部委托渲染 `SearchBar`）
  - `src/components/MasterData/master-data-archive.vue`（改用新能力）
  - `src/views/system-manage/role/index.vue`（改用新能力）
  - `src/components/MasterData/shared.ts`（删除共享 `baseSearch()`，仅保留
    `useArchiveStatusOptions()` 这一真正共用的启用/禁用选项）
  - 12 个档案页 `src/components/MasterData/archives/*/index.vue`（各自声明独立的 `searchItems`）
- 不受影响：`user` / `menu` / `dept` 列表页（当前无行内搜索栏）、`NFormWrap`。

## 非目标

- 不持久化折叠/展开状态（用户选择默认收起）。
- 不新增 i18n 键（复用 `common.search` / `common.reset`）。
- 不改没有搜索栏的页面。
- 不把搜索项抽成跨界面共享函数（每个界面必须各自配置 `searchItems`）。

## 设计

### `Table` 组件改动

新增可选的搜索栏特性，仅当传入 `searchItems` 时激活。

**新增 Props**

| Prop                     | 类型                      | 默认值      | 说明                                                                                           |
| ------------------------ | ------------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `searchItems`            | `FormItemConfig[]`        | `undefined` | 搜索表单项。传入即启用该特性。                                                                 |
| `searchModel`            | `Record<string, unknown>` | `undefined` | 搜索参数对象（按引用传递），由 `SearchBar` 内的 `NFormWrap` 原地双向绑定，父页面在取数时读取。 |
| `searchDefaultCollapsed` | `boolean`                 | `true`      | 面板是否默认收起。                                                                             |

**新增 Emits**

- `search` —— 点击「搜索」时触发。
- `reset` —— 点击「重置」时触发。

**布局**

在现有根 `flex flex-col` 容器内，operation 栏与表格容器之间插入搜索面板：

```
<div class="h-full w-full flex flex-col min-h-0">
  <div class="mb-12px flex-y-center justify-between gap-12px">
    <div class="flex-y-center gap-8px flex-wrap"><slot name="operation-left" :refresh="refresh" /></div>
    <div class="flex-y-center gap-8px flex-wrap justify-end">
      <slot name="operation-right" :refresh="refresh" />
      <NButton v-if="searchItems?.length" size="small" :type="searchCollapsed ? 'default' : 'primary'"
               @click="searchCollapsed = !searchCollapsed">
        <template #icon><icon-ic-round-search class="text-icon" /></template>
      </NButton>
    </div>
  </div>

  <!-- 搜索面板委托给独立组件 src/components/SearchBar/search-bar.vue 渲染 -->
  <div v-if="searchItems?.length" class="mb-12px">
    <SearchBar :items="searchItems" :model="searchModel ?? {}" :collapsed="searchCollapsed"
               @search="emit('search')" @reset="emit('reset')" />
  </div>

  <div class="relative w-full min-h-0 bg-white" ...> ... vxe-table ... </div>
  <div v-if="pagination" ...> ... NPagination ... </div>
</div>
```

**说明**

- 搜索图标按钮渲染在 `operation-right` 槽位内容**之后**，即最右侧（与参考截图一致）；
  仅当 `searchItems` 非空时渲染。
- 搜索面板的 UI（折叠卡片 + `NFormWrap` + 搜索/重置按钮）与折叠过渡（仅动画
  `opacity + transform`，GPU 合成、不触发重排）封装在独立组件
  `src/components/SearchBar/search-bar.vue`，`Table` 仅负责显隐开关与事件透传。
- `NFormWrap` 的 `#actions` 槽位由各页面 `searchItems` 里的 `actions` 槽位项驱动
  （如各档案页 `searchItems` 包含 `{ key: 'actions', label: ' ', slot: 'actions', span: 8 }`）。
  `SearchBar` 在该槽位填入「搜索/重置」按钮。
- `searchModel` 按引用传递（响应式对象），由 `SearchBar` 内的 `NFormWrap` 原地修改，与当前内联用法一致。
  父页面仍持有该对象所有权，并在 `getData` 的接口调用中读取它。

### `master-data-archive.vue` 迁移

- 删除内联的 `<NCard><NFormWrap>…</NFormWrap></NCard>` 搜索块。
- 给 `<Table>` 传：
  - `:search-items="config.searchItems"`
  - `:search-model="searchParams"`
  - `@search="handleSearch"`
  - `@reset="handleReset"`
- `handleSearch` / `handleReset` 及 `searchParams` 初始化保持不变。

### `system-manage/role/index.vue` 迁移

- 删除内联的 `<NCard><NFormWrap>…</NFormWrap></NCard>` 搜索块。
- 给 `<Table>` 传：
  - `:search-items="searchItems"`
  - `:search-model="searchParams"`
  - `@search="handleSearch"`
  - `@reset="handleReset"`
- `handleSearch` / `handleReset` 保持不变。

## 验证

- `pnpm typecheck` 通过（不使用 `any`；从 `@/components/Form` 引入 `FormItemConfig`）。
- `pnpm lint` 通过。
- `pnpm build` 通过。
- 手动：MasterData 全部 12 个档案页 + `role` 页默认搜索面板收起；点击操作栏最右的搜索图标展开；
  「搜索/重置」以当前参数触发重新取数；收起后面板隐藏、表格占满释放出的空间。
