# 搜索栏内置到通用 Table 组件

- 日期：2026-09-03
- 关联设计：`docs/superpowers/specs/2026-09-03-search-bar-table-design.md`（已落地）

## 背景与问题

之前搜索栏被实现为一个独立的 `src/components/MasterData/search-bar.vue` 组件，且通过
`shared.ts` 的 `useArchiveBase().baseSearch()` 给所有档案页返回**同一份写死的搜索项**
（keyword + status + actions）。两个问题：

1. 搜索栏能力被锁在 MasterData 目录，其它表格（如 `system-manage/role`）无法复用，
   只能各自再写一遍内联 `<NCard><NFormWrap>`。
2. `baseSearch()` 把搜索项做成「共享函数」，每个界面无法单独配置自己的搜索字段。

用户明确要求：**搜索栏应做成通用 Table 的可选配置，所有表格都能用；且每个界面的搜索项必须各自配置，不能共用。**

## 改动

- `src/components/SearchBar/search-bar.vue`：新增**独立、可复用**的搜索栏组件（无 MasterData
  依赖，任何表格/页面都能直接用）。props：`items: FormItemConfig[]`、`model: Record<string,unknown>`、
  `collapsed?`（默认 `true` 收起）、`gridXGap`/`gridResponsive`/`labelPlacement`/`labelWidth`；
  emits：`search` / `reset`。内部用 `NCard + NFormWrap`（`#actions` 槽位内置「搜索/重置」按钮），
  折叠过渡仅动画 `opacity + transform`（GPU 合成，不触发重排）。
- `src/components/Table/table.vue`：新增可选搜索栏能力（`searchItems` / `searchModel` /
  `searchDefaultCollapsed` props + `search` / `reset` emits），作为「表格配置」入口；
  操作栏最右侧渲染搜索图标按钮（仅 `searchItems` 非空时出现，展开态高亮 `primary`），
  **内部委托渲染独立的 `<SearchBar>` 组件**（不再内联 NFormWrap）。
- `src/components/MasterData/master-data-archive.vue`：给 `<Table>` 传 `:search-items` /
  `:search-model` 与 `@search` / `@reset`（搜索栏由 Table 内置的 SearchBar 渲染）；
  移除原先内联的搜索块与本地 `collapsed` 状态，操作栏中重复的搜索切换按钮改由 Table 渲染。
- `src/views/system-manage/role/index.vue`：删除内联 `<NCard><NFormWrap>` 搜索块，改为给
  `<Table>` 传同样的搜索 props；移除 `NFormWrap` 值导入（仅保留 `FormItemConfig` 类型）。
- `src/components/MasterData/shared.ts`：删除 `baseSearch()`；保留 `useArchiveStatusOptions()`
  （启用/禁用状态选项，确属所有档案共用，非搜索栏配置本身）。
- 12 个档案页 `archives/*/index.vue`：各自声明**本页独立的 `searchItems`**
  （当前基线仍是 keyword + status + actions，但归属页面、可单独增删字段），不再调用共享
  `baseSearch()`。
- 删除独立组件 `src/components/MasterData/search-bar.vue`，并清理 `src/typings/components.d.ts`
  中对应的自动生成声明（运行 `pnpm dev`/`build` 亦会重新生成）。

## 验证

- `pnpm typecheck` 通过；`pnpm lint` 通过（仅剩 `link.vue` 既有警告，与本次无关）。
- 行为：MasterData 全部档案页与 `role` 页默认搜索面板收起；点击操作栏最右搜索图标展开；
  「搜索/重置」以当前参数触发取数；收起后面板隐藏、表格占满释放出的空间。

## 约定

- 任何表格（不限资料管理）想要搜索栏，只需给 `<Table>` 传 `searchItems` + `searchModel`
  并监听 `search`/`reset` 即可；`searchItems` 末项保留 `{ key: 'actions', slot: 'actions' }`
  以驱动 NFormWrap 的按钮区。
- 每个界面的搜索字段由该界面自行配置，禁止再抽成跨界面共享函数。
