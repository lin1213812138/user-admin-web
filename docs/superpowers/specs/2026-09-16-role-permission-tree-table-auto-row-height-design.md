# 角色权限抽屉：树表行高自适应设计

**日期**：2026-09-16
**涉及文件**：

- `src/views/permission-manage/role/modules/role-permission-drawer.vue`
- `src/components/Table/table.vue`（仅新增 `showOverflow` prop，默认行为不变）

## 背景与问题

角色权限抽屉的树形表格中，「操作权限」列用 `NCheckboxGroup` 渲染按钮权限，按钮较多的菜单换行后被裁切（固定行高 40px）。此前尝试：

```ts
const autoRowConfig = { height: 'auto' } as any; // 传给 :cell-config
```

未生效。经查 vxe-table 4.17 源码，原因有三层：

1. **`cell-config.height` 只接受 number**：`computeCellOpts` 里 `if (cellOpts.height) { cellOpts.height = toNumber(cellOpts.height) }`，`'auto'` 被转为 `NaN`/无效值后忽略。
2. **vxe 默认不做行高实测**：`calcCellHeight` 的执行条件是 `!isAllOverflow && (scrollYLoad || scrollXLoad || (treeConfig && treeOpts.showLine))`（`packages/table/src/table.ts:2181` 附近）——**必须开 `tree-config.showLine` 才会逐行实测内容高度**，写入 `rowRest.height`。
3. **最隐蔽的一层：`isAllOverflow = !!showOverflow`**（`table.ts:1754/1791`）。`Table.vue` 原写死 `show-overflow="tooltip"`，导致 `isAllOverflow=true`，`calcCellHeight` 直接跳过；同时 `body.ts:174` 的 `hasEllipsis = isAllOverflow || ...` 为 true，单元格被强制设为 `height = defaultRowHeight`，行高永远自适应不了。

行高取值链（`getCellRestHeight`）：`cellOpts.height → rowOpts.height → rowRest.height(实测) → defaultRowHeight`。要落到实测值，`cell-config.height` 必须为 `0`（falsy），同时 `row-config.height` 不设。

## 方案

### 1. `Table.vue` 增加 `showOverflow` prop

默认保持 `'tooltip'`，与现有所有页面行为一致：

```ts
// Props
/** vxe-table show-overflow，默认 'tooltip'；树表行高自适应场景需传 false 以允许 vxe 实测内容高度 */
showOverflow?: VxeTablePropTypes.ShowOverflow;

// withDefaults
showOverflow: 'tooltip';
```

模板中把写死的 `show-overflow="tooltip"` 改为 `:show-overflow="showOverflow"`。

### 2. `role-permission-drawer.vue`：关闭全局 showOverflow

```vue
<Table
  ...
  :cell-config="autoRowConfig"
  :show-overflow="false"
>
```

传 `false` 后 `isAllOverflow=false`，配合 `treeConfig.showLine=true`，vxe 才会执行 `calcCellHeight`。

### 3. `autoRowConfig` 改为合法值

```ts
/** 行高自适应：height=0 让 cellOpts.height 为空，vxe 改用实测内容高度（rowRest.height） */
const autoRowConfig: VxeTablePropTypes.CellConfig = { height: 0 };
```

去掉 `as any`。`Table.vue` 的 `finalCellConfig` 以 `...props.cellConfig` 展开覆盖默认 `height: 40`，最终为 `{ isHover: true, height: 0 }`。

### 4. `treeConfig` 开启 `showLine`

```ts
const treeConfig = computed<VxeTablePropTypes.TreeConfig>(() => ({
  rowField: 'id',
  childrenField: 'children',
  expandRowKeys: expandedKeys.value,
  expandAll: false,
  showLine: true
}));
```

`showLine: true` 是触发 vxe 行高实测的必要条件。**不为视觉目的**——连接线随后用 CSS 隐藏。

### 5. 新增 scoped 样式隐藏连接线

文件末尾新增（此前无 `<style>` 块）：

```vue
<style scoped>
/* 仅借 showLine 触发 vxe 行高实测，视觉上隐藏树形引导线（测量对象是 .vxe-cell--wrapper，不受影响） */
:deep(.vxe-tree--line-wrapper) {
  display: none;
}
</style>
```

`.vxe-tree--line-wrapper` 是单元格内绝对定位的装饰元素，`display: none` 不影响行高测量（测量对象是 `.vxe-cell--wrapper` 内容容器）。

## 为什么不需要手动触发重算

- 数据更新（搜索过滤 `applyView` → `viewRows` → `data` prop）：vxe 内部走 `handleRecalculateStyle(false, true, true)`，`reHeight=true` 会重新 `calcCellHeight`；
- 树展开/收起：`handleTreeExpand` 内部自动 `$xeTable.recalculate()`；
- 勾选按钮只改 `rowButtonChecks`，不改行数据结构，行内容高度不变。

因此不暴露 `recalculate`。

## 不改动

- `Table.vue` 除新增 `showOverflow` prop 外，其余行为不变；其他使用方不传入时默认仍是 `'tooltip'`。
- 列配置、勾选逻辑、提交逻辑：零改动。

## 风险与限制

1. **showOverflow=false 后单元格不再有 tooltip**：权限抽屉的两列内容（菜单名称、操作权限复选框）均不会超长，关闭无影响。若将来某列文本可能超长，可在该列单独配置 `showOverflow`（列级配置不影响 `isAllOverflow`）。
2. **数据量上限**：菜单行数一旦超过 200（`virtualScrollRowThreshold` 默认值），虚拟滚动启用 → `isAllOverflow=true` → 实测停止，行高退回默认值。权限树是菜单级数据，正常远小于 200；将来超出时调大该 prop 即可。
3. **单行内容视觉不变**：内容不足一行的行，行高取 `Math.max(defaultRowHeight, 实测值)`，仍是默认高度，不会变矮。
4. 表头高度仍由 `headerCellConfig` 默认 40 控制，不受影响。

## 验证

- `pnpm typecheck` 0 错误；oxfmt / oxlint / eslint 0 问题。
- 浏览器手测：按钮多的菜单行完整显示；搜索过滤后新出现的行同样自适应；展开/收起正常；树形缩进处无连接线（与改动前视觉一致）。
