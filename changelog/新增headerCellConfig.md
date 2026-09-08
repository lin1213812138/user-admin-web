# 通用 Table 新增 headerCellConfig

## 问题

`src/components/Table/table.vue` 的 `<vxe-table>` 已绑定 `:header-cell-config="headerCellConfig"`，但 `<script setup>` 的 `Props` 未声明该变量，导致模板编译期报 TS2339（Property 'headerCellConfig' does not exist）。

## 结论

为通用 `Table` 补齐 `headerCellConfig` prop，仅作透传，默认 `undefined`（不改变 vxe-table 默认表头行为）：

- Props 新增：`headerCellConfig?: VxeTablePropTypes.HeaderCellConfig`（vxe-pc-ui 提供，含 `height?: number | 'unset'`、`padding?`）。
- `withDefaults` 补充默认值 `undefined`。

后续某页面需要统一指定表头单元格高度 / 间距时，可向 `<Table>` 传 `:header-cell-config="{ height: ... }"`。

## 影响范围

- `src/components/Table/table.vue`

验证：`pnpm typecheck` 通过。
