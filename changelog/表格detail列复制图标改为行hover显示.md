# 表格 detail 列复制图标改为「行 hover 显示」

日期：2026-09-07
涉及文件：`src/components/Table/table.vue`

## 需求

- 表格 `type: 'detail'` 列（渲染成 `Link` 的那一列）的复制图标，改为**鼠标悬停整行时**显示，而不是 hover 链接本身才显示。
- 复制图标要放在 `Link` 组件**外面**，不再通过 `Link` 的 `#icon` 插槽塞进组件内部（避免继承 Link 的颜色、下划线、`icon-hover` 等样式行为）。

## 现状（改之前）

```vue
<Link type="primary" icon-position="right" icon-hover @click="emit('detail', row)">
  {{ row[col.key] }}
  <template #icon>
    <NTooltip trigger="hover"> ... <span class="vxe-link-icon" @click.stop="handleCopy(...)"> ... </template>
</Link>
```

- 图标是 `Link` 的子节点，靠 `icon-hover`（`.link--icon-hover:hover .link__icon`）控制显隐 → 只有 hover 到链接文字上才出现。
- 点击图标需要 `@click.stop` 阻止冒泡到 Link 的详情点击。

## 改动

1. **图标外移**：`Link` 只保留文本与详情点击；复制图标（包 `NTooltip`）作为单元格内的兄弟节点，不再走 Link 插槽，也去掉了 `@click.stop`（不存在冒泡关系）。
2. **行 hover 显形**：`.vxe-cell-copy` 默认 `opacity: 0; pointer-events: none`，**常占位**（避免 hover 时行内元素跳动），行 hover 时 `opacity: 1; pointer-events: auto`。
3. **hover 行判定**：
   - CSS `.vxe-body--row:hover .vxe-cell-copy` 兜底（scoped 编译后只给末尾选择器加属性，祖先 `tr` 无需 scope 属性，可正常匹配）。
   - 另加 JS 事件委托：表格容器 `@mouseover` 读 `tr[rowid]` 维护 `hoverRowId`，单元格按 `hoverRowId === rowid` 加 `is-hover` 类。
   - 原因：vxe-table 会把**固定列拆成独立的 `<tr>`**，鼠标在主区行上时固定列那一行并不会被 CSS `:hover` 命中；vxe 内部也只有 `hoverRow` 状态、不落 class，所以只能自己按 `rowid` 关联。slot 参数本身带 `rowid`（见 `vxe-table/es/table/src/body.js` 的 `cellParams`），无需额外传参。

## 补充：图标用主题色（同日）

- 图标默认继承单元格文字色，改为跟随主题色：`useThemeVars()` 取 `primaryColor` / `primaryColorHover`，以 CSS 变量 `--vxe-copy-color` / `--vxe-copy-hover-color` 挂在图标上，`.vxe-cell-copy:hover` 切到 hover 色。主题切换自动跟随，无需额外配置。

## 验证

- `pnpm typecheck` 通过；`pnpm fmt` 仅格式化本文件。
- 待手测：hover 行任意列图标出现 → 点击复制成功且不触发详情；移出表格图标消失；固定列（菜单管理树形列）场景跨区 hover 也生效。

## 遗留

`Link` 组件的 `iconPosition` / `iconHover` / `#icon` 插槽目前**已无调用方**（全库只有 Table 用它）。本次保留未删，如确认不再需要可后续清理。
