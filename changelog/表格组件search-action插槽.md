# 表格组件 search-action 插槽

> 日期：2026-09-16
> 来源：用户「表格组件帮我加一个slot：search-action，配置部分快速搜索条件」

## 需求

给通用 `Table` 组件（`src/components/Table/table.vue`）加一个名为 `search-action` 的具名插槽，作为**独立的快速搜索栏区域**，由业务页面完全自定义内容（输入框 / 下拉 / 搜索按钮等），用于配置快速搜索条件。

## 需求澄清（关键）

- 初版误解为「在 `SearchBar` 的搜索/重置按钮区加插槽」，被用户纠正：**跟 `search-bar.vue` 没关系，是配置在表格组件里面的一个单独快速搜索栏**。
- 与既有 `searchItems` / `SearchBar`（可折叠完整搜索表单）机制**互不依赖**：可并存（插槽在上、完整搜索栏在下），也可二选一。
- 顺带回应上一条（已取消）的问题「主动隐藏搜索/重置操作按钮」：页面想用自己的搜索栏时**不传 `searchItems`** 即可，SearchBar 及其内置按钮完全不会出现。

## 设计（用户已确认）

仅改 `src/components/Table/table.vue`，`SearchBar` 组件不动：

1. 模板最顶部（`SearchBar` 区块之前）新增插槽区块：

```vue
<div v-if="$slots['search-action']" class="mb-12px">
  <slot name="search-action" :refresh="refresh" />
</div>
```

2. 行为约定：
   - 未提供插槽时零渲染，现有 `searchItems` / `SearchBar` 机制完全不受影响。
   - 插槽内容与容器样式全部由业务页面自己写，`Table` 不加默认卡片、不生成任何默认按钮。
   - 插槽位置放最顶部：快速搜索是高频操作离用户最近，且折叠完整搜索栏时该区域位置稳定。
   - slot props 暴露 `refresh`（与 `operation-left` 插槽惯例一致，触发 `@refresh`）；页面取数也可以直接调 `useVxeTable` 的 `getData`，不强依赖。

## 用法示例

```vue
<Table ...>
  <template #search-action>
    <div class="mb-12px flex-y-center gap-8px">
      <NInput v-model:value="searchParams.keyword" placeholder="..." clearable />
      <NButton type="primary" @click="handleSearch">搜索</NButton>
      <NButton @click="handleReset">重置</NButton>
    </div>
  </template>
</Table>
```

## 改动清单

- `src/components/Table/table.vue`：模板顶部新增 `search-action` 插槽区块（`v-if="$slots['search-action']"` 判空 + `mb-12px` 间距 + slot props `refresh`），其余零改动。

## 验证

- `read_lints` 无诊断、`pnpm typecheck` 通过（结果见 `AGENTS_CHANGELOG.md` 索引条目）。
