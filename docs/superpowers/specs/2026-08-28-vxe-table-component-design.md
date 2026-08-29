# 基于 vxe-table 的通用 Table 组件封装设计

日期：2026-08-28

## 1. 背景与目标

当前项目（`soybean-admin` 衍生）使用 Naive UI 的 `NDataTable` 作为表格方案，并已有
`src/components/advanced/table-header-operation.vue`、`table-column-setting.vue` 等增强组件，
以及 `src/hooks/common/table.ts` 中的 `useNaiveTable` / `useNaivePaginatedTable` / `useTableOperate` 等 hook。

本设计的目标是**并存补充**地引入 vxe-table，封装一套通用表格组件，放在 `src/components/Table/` 下，
用于需要 vxe-table 特有能力（虚拟滚动、大数据量、可编辑单元格、树形表格等）的页面。
它与现有 Naive UI 表格互不干扰，仅作为补充方案。

`src/components/Table/` 目录当前为空，正是为本次封装预留的位置。

## 2. 范围

### 纳入本期

- 基础展示：列定义、数据渲染、加载态遮罩、空状态文案（复用现有 i18n key）。
- 列配置弹窗：复刻需求截图的交互——拖拽排序、显示开关、宽度输入、最小宽度输入、
  固定方式下拉（不固定/左固定/右固定）、排序开关，底部「重置」「确认」。
- 配套 hook：管理数据、loading、列配置状态，并由列配置计算实际渲染列。

### 不纳入本期（结构上预留，后续按需扩展）

- 复杂分页（服务端/客户端）
- 单元格/行编辑
- 虚拟滚动
- 树形表格

## 3. 文件结构

```
src/components/Table/
  ├── index.ts                       # 统一导出
  ├── table.vue                      # 通用表格组件（封装 VxeTable）
  ├── table-column-config.vue        # 列配置弹窗/抽屉
  └── use-vxe-table.ts               # 配套 hook（数据/loading/列配置状态）
```

## 4. 组件设计

### 4.1 `table.vue`（通用表格）

Props：

- `columns: VxeColumnConfig[]` —— 由 hook 计算后的实际列配置（v-model 联动）。
- `data: any[]` —— 表格数据。
- `loading: boolean` —— 加载态。
- `height` / `max-height` —— 高度控制（透传 vxe-table）。
- 其余常用 `row-config`、`border`、`stripe` 等按需透传。

行为：

- 内置 loading 遮罩与 empty 空状态（复用 `$t('common.empty')` 之类现有 i18n key）。
- 通过 `v-model:columns` 支持列配置实时联动（显隐/排序/宽度/固定/排序开关）。
- 默认 slot 用于表头操作区（可放入现有 `table-header-operation` 与「列配置」按钮）。

### 4.2 `table-column-config.vue`（列配置弹窗）

交互（对齐需求截图）：

- 弹窗/抽屉内列表，每行包含：
  - `#` 拖拽手柄（使用项目已装的 `vue-draggable-plus` 实现排序）。
  - 是否显示开关（Switch）。
  - 宽度（数字输入 + 减/加按钮）。
  - 最小宽度（数字输入 + 减/加按钮）。
  - 固定方式下拉（不固定 / 左固定 / 右固定）。
  - 排序开关（Switch）。
- 底部按钮：「重置」「确认」。

配置项类型定义：

```ts
interface VxeColumnConfig {
  key: string;
  title: string;
  visible: boolean;
  width?: number | null;
  minWidth?: number | null;
  fixed?: '' | 'left' | 'right';
  sortable: boolean;
}
```

通过 `v-model:visible` 控制弹窗显隐，`v-model:columns` 双向绑定列配置。

### 4.3 `use-vxe-table.ts`（配套 hook）

参考现有 `packages/hooks/src/use-table.ts` 的模式，管理：

- `data: Ref<any[]>`
- `loading: Ref<boolean>`
- `columnConfigs: Ref<VxeColumnConfig[]>`
- `getData(): Promise<void>` —— 拉取数据（由调用方传入 api + transform）。
- `resetColumns()` —— 重置列配置到初始状态。
- 由 `columnConfigs` 计算实际传给 `VxeTable` 的 `columns`（过滤隐藏列、套用宽度/最小宽度/固定/排序）。

## 5. 依赖

- 新增 `vxe-table`（兼容 vue 3.5 的版本，如 `^4.x`）到 `package.json` 的 `dependencies`。
- 在入口（`src/main.ts` 或 `src/plugins`）注册 `VxeTable` 全局组件及必要样式；
  若项目偏好按需引入，则在组件内直接 import。

## 6. 使用示例（未来页面）

```vue
<Table v-model:columns="columnConfigs" :data="data" :loading="loading">
  <template #operation>
    <TableHeaderOperation @refresh="getData" />
    <NButton size="small" @click="configVisible = true">{{ $t('common.columnSetting') }}</NButton>
  </template>
</Table>

<TableColumnConfig v-model:visible="configVisible" v-model:columns="columnConfigs" />
```

脚本侧通过 `useVxeTable({ api, transform, columns })` 取得 `data` / `loading` / `columnConfigs` / `getData`。

## 7. 验证

- `pnpm typecheck`（`vue-tsc --noEmit`）通过。
- `pnpm lint` 通过。
- 新建一个临时 demo 页面验证：表格渲染、加载态、列配置弹窗的显隐/宽度/固定/排序联动均正常。
- 验证完成后移除临时 demo 页面（保持仓库整洁，除非用户要求保留）。
