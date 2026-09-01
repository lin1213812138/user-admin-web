# MEMORY

## vxe-table v4 tree 模式（项目踩坑）

`tree-config` 必须显式带 **`rowField`**，否则 vxe-table 不进入 tree 模式，只渲染顶层数组、忽略 `children` 嵌套（菜单管理页曾因此树形子级不显示）。

光有 `rowField` 也只解决"能不能遍历到嵌套节点"。**真正决定渲染缩进 + ▷ 箭头的是列自身的 `treeNode` 属性**（vxe-column 上是 `tree-node` prop；ColumnInfo 直接读 `colConfs.treeNode`，整个 vxe-table 源码里没有任何"自动选树节点列"或"按 field 反查"的代码——所以 `tree-config.treeNodeColumn` / `tree-config` 上任何"指定列"的字段在本版本（v4.5.9）都不生效，纯属臆造）。要在哪一列渲染树 UI，就在那一列配置上写 `treeNode: true`。

两种写法在本项目都可用（都需要对应列配 `treeNode: true`）：

1. **parentId 模式** —— 数据扁平 + `parentId`：

   ```ts
   treeConfig: { rowField: 'id', parentField: 'parentId', transform: true, expandAll: true }
   ```

   vxe-table 用 `XEUtils.toArrayTree` 自动组树。前提：数据的 `parentField` 值能在 `rowField` 里找到，根节点用 0 / null 等不存在的值。

2. **children 模式** —— 数据已是嵌套树：
   ```ts
   treeConfig: { rowField: 'id', childrenField: 'children', expandAll: true }
   ```
   自己用 `parentId` 在前端把扁平数据组好（项目里有 `buildMenuTree` 工具函数），再交给 vxe-table 渲染。

项目封装 `src/components/Table/table.vue`：已把 `:tree-node="col.treeNode"` 透传给 `<vxe-column>`；`src/components/Table/use-vxe-table.ts` 的 `VxeColumnConfig` / `VxeColumnRenderColumn` 都已带 `treeNode?: boolean` 字段（持久化也覆盖）。业务侧只需在列配置写 `treeNode: true` 即可启用该列的树节点列渲染。

⚠️ **树节点列不可被用户隐藏**：列设置弹窗（`table-column-config.vue`）对 `treeNode` 列禁用了"显示"开关（防用户关掉后整棵树退化成平铺）；同时 `useVxeTable` 的 `columns` computed 用 `.filter(col => col.visible || col.treeNode)` 兜底，即使 localStorage 缓存里 `visible:false` 也强制保留树节点列。新增树表时务必给树节点列加 `treeNode:true`，且不要动这两条保护。

新增 i18n 键务必「zh-cn / en-us / `src/typings/app.d.ts` 的 `App.I18n.Schema`」三处同步，否则 `pnpm typecheck` 报 `I18nKey` 错误（`$t` 的键是静态类型推导的）。

未来如果升级 vxe-table 并发现 `tree-config.treeNodeColumn` 真的生效了，可以再加回该字段做兼容；当前版本不要写。

## 菜单管理页数据约定

- DEV mock（`src/service/api/mock.ts` 的 `mockMenuList`）返回**扁平**数组，每行带 `parentId`、无 `children`。
- 生产 `/system/menu/list` 返回的是带 `children` 的嵌套树、无 `parentId` 字段（按用户实测确认）。
- 当前菜单页采用 children 模式：扁平数据 → `buildMenuTree(data.value)` 组树 → 表格和抽屉共用 `menuTree`。`buildMenuTree` 是从 `parentId` 推导的，符合"用 parentId 渲染"。
