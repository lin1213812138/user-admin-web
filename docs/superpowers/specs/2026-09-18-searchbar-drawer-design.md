# 表格封装搜索栏改为侧滑抽屉 — 设计文档

- 日期：2026-09-18
- 作者：Agent（brainstorming 流程）
- 关联项目：`user-admin-web`（CWMS Admin，Vue3 + Naive UI + vxe-table）

## 1. 背景与目标

`Table` 组件（`src/components/Table/table.vue`）目前通过 `searchItems` / `searchModel` 两个属性，在表格上方渲染一个**内联可折叠**的 `SearchBar`（`src/components/SearchBar/search-bar.vue`，内部是 `NCard` + `NFormWrap`，用 CSS grid 行高 `1fr ↔ 0fr` 做收展动画）。

需求：把这个「封装的搜索栏」从内联折叠卡片，改为**侧滑抽屉（side drawer）**，以释放表格上方纵向空间、提升多条件筛选体验。

本次采用以下默认决策（已在 brainstorming 澄清环节确认方向）：

- 滑出方向：**右侧**（`NDrawer` `placement="right"`）
- 点击抽屉内「搜索」后：**自动关闭**抽屉
- 抽屉内表单排布：**纵向堆叠**（`label-placement="top"`，每项占满整行）

## 2. 范围与不变项

**改动范围（最小集合）**

- `src/components/SearchBar/search-bar.vue`：内部渲染改为 `NDrawer`。
- `src/components/Table/table.vue`：移除内联折叠逻辑，改为控制抽屉开关。

**明确不变**

- `Table` 的 `search-action` 自定义快捷搜索插槽：保持内联卡片，与本改动无关。
- 23 个调用页面（`views/**` 中传 `:search-items` / `:search-model` / `@search` / `@reset` 的页面）：**全部无需改动**，因为对外契约不变。
- `useVxeTable`、`Form/index.vue`（`NFormWrap`）核心逻辑：本次不改动（详见 §4 关于抽屉内单列的取舍说明）。

## 3. 新 API 设计

### 3.1 SearchBar（`src/components/SearchBar/search-bar.vue`）

Props：

| 名称             | 类型                                     | 默认值    | 说明                                        |
| ---------------- | ---------------------------------------- | --------- | ------------------------------------------- |
| `show`           | `boolean`                                | `false`   | 抽屉可见性，使用 `v-model:show` 双向绑定    |
| `items`          | `FormItemConfig[]`                       | 必填      | 搜索表单项（沿用原 `searchItems` 结构）     |
| `model`          | `Record<string, unknown>`                | 必填      | 搜索表单数据对象（按引用传入，父级持有）    |
| `width`          | `number \| string`                       | `420`     | 抽屉宽度（px）                              |
| `placement`      | `'right' \| 'left' \| 'top' \| 'bottom'` | `'right'` | 滑出方向                                    |
| `labelPlacement` | `'left' \| 'top'`                        | `'top'`   | 抽屉内标签位置（窄抽屉下用 top 可读性更好） |
| `labelWidth`     | `number \| string`                       | `80`      | 标签宽度（top 模式下影响较小，保留可配）    |
| `gridXGap`       | `number`                                 | `16`      | 栅格列间距                                  |

Emits：

- `search: []` — 点击「搜索」
- `reset: []` — 点击「重置」
- `update:show: [value: boolean]` — 抽屉关闭（点遮罩 / 关闭按钮 / ESC）时回传 `false`

> 抽屉内的「搜索 / 重置」按钮固定在 `NDrawerContent` 的 `#footer` 插槽，不再依赖 `NFormWrap` 内部的 `#actions` 行。

### 3.2 Table（`src/components/Table/table.vue`）

属性变更：

- **移除** `searchDefaultCollapsed`（已确认无任何调用方传此属性，删除无回归风险）。
- 移除内部 `searchCollapsed` ref 及其相关模板逻辑。
- 新增内部状态 `searchDrawerVisible = ref(false)`。

保留不变：

- `searchItems`、`searchModel`、`@search`、`@reset` 完全保持原契约。

## 4. 实现要点

### 4.1 SearchBar 重写

- 根节点由 `<div class="search-collapse">` 改为 `NDrawer`：
  - `:show="show"`、`@update:show="emit('update:show', $event)"`、`placement`、`width`。
  - 内部 `NDrawerContent`：`:title="$t('common.search')"`、`:native-scrollbar="false"`，内容区放 `NFormWrap`。
- `NFormWrap` 入参：`model` / `items` / `grid-x-gap` / `grid-responsive`（沿用 `'self'`）/ `label-placement`（默认 `top`）/ `label-width`。
- 关于「纵向堆叠」：抽屉较窄（默认 420px），为保证每项占满整行，`SearchBar` 在把 `items` 传给 `NFormWrap` 前，将每个 item 的 `span` 收敛为 `24`（用 `computed` 派生一份 `drawerItems`，不修改调用方原始配置），使 `NFormWrap` 的 24 栅格自然退化为单列。**不改动 `NFormWrap` 组件本身**。
- footer 按钮区：
  - 「重置」：`type="default"`，`@click="emit('reset')"`
  - 「搜索」：`type="primary"`，`@click="emit('search')"`，带搜索图标

### 4.2 Table 重写

script：

- 删除：
  - `searchDefaultCollapsed?: boolean;` 属性声明与其 `withDefaults` 默认值
  - `const searchCollapsed = ref(props.searchDefaultCollapsed);`
- 新增：
  - `const searchDrawerVisible = ref(false);`
  - `function handleSearch() { emit('search'); searchDrawerVisible.value = false; }`
  - `function handleReset() { emit('reset'); }`（抽屉保持打开）

template（三处改动）：

1. 删除原内联块：
   ```vue
   <div v-if="searchItems?.length">
     <SearchBar :items="searchItems" :model="searchModel ?? {}" :collapsed="searchCollapsed"
       @search="emit('search')" @reset="emit('reset')" />
   </div>
   ```
2. operation-right 搜索按钮由「切换折叠」改为「打开抽屉」：
   ```vue
   <NButton
     v-if="searchItems?.length"
     size="small"
     type="default"
     :title="$t('common.filter')"
     @click="searchDrawerVisible = true"
   >
     <template #icon><icon-ic-round-search class="text-icon" /></template>
   </NButton>
   ```
3. 在模板任意位置（建议放在分页之后，`NDrawer` 自带 teleport）渲染抽屉：
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

### 4.3 行为总览

- 初始：表格上方无搜索卡片，operation-right 仅保留一个搜索图标按钮（有 `searchItems` 时出现）。
- 点击搜索按钮 → `searchDrawerVisible = true` → `NDrawer` 从右侧滑出，表单按当前 `searchModel` 回填。
- 点「搜索」→ emit `search`（父级 `getData()` 重新取数）+ 关闭抽屉。
- 点「重置」→ emit `reset`（父级重置 `searchModel` 并取数），抽屉保持打开。
- 点遮罩 / 关闭按钮 / ESC → `update:show=false`，仅关闭，不触发取数。

## 5. 兼容性 / 回归

- 23 个调用页面：`searchItems` / `searchModel` / `@search` / `@reset` 契约不变 → 零改动。
- `search-action` 插槽与 `searchActionFlush` 属性：保持原样。
- `SearchBar` 旧 props（`collapsed` / `gridResponsive` 等）随内联形态一并废弃；因旧 `SearchBar` 仅被 `Table` 使用，无外部直接引用风险（已通过全仓搜索确认 `SearchBar` 仅在 `table.vue` 引入）。

## 6. 验证

无单测框架，按项目约定用：

1. `pnpm typecheck` — 类型检查通过（重点确认 `v-model:show`、`FormItemConfig` 传递无类型错误）。
2. `pnpm lint` — `oxlint && eslint` 通过。
3. `pnpm build`（或 `pnpm build:test`）— 构建通过。
4. 手动抽查：打开任一含搜索栏的页面（如 `system-manage/user`），确认：
   - 表格上方不再有内联搜索卡片；
   - 点搜索图标 → 右侧抽屉滑出且回填当前条件；
   - 「搜索」触发筛选并关闭、「重置」触发重置且保持打开；
   - `search-action` 自定义快捷搜索仍正常内联显示。

## 7. 风险与备注

- 抽屉宽度 420px 在极小屏可能偏宽：如需响应式，后续可将 `width` 默认改为 `'90vw'` 或加媒体断点，本次先固定 420 保持简洁。
- 若个别调用方 `searchItems` 含 `slot` 类型的 action 项，`NFormWrap` 会在抽屉内容区底部额外渲染该插槽（与 footer 按钮并存）；当前搜索场景未见此类用法，若发现再单独处理。
