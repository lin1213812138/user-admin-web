# 设置页 MasterDetail：启用/禁用与操作栏改为可选

## 问题现象

系统设置 7 个 tab 布局并不统一：

- 6 个 tab（录单/打印/导出/通知/初始化/站点扫描）走 `MasterDetail.vue`，带左侧列表 + 左侧「启用/禁用」徽标 + 右侧顶部「新增/编辑/删除」操作栏；
- 「运单规则」完全不使用 `MasterDetail`，它用通用 `Table + useVxeTable`（整页表格、无左侧状态列、操作在行内 `action` 列）。

而 `MasterDetail.vue` 把「左侧启用/禁用徽标」和「右侧顶部操作栏」**写死在共享组件内**：

- 列表项模板无条件读取 `item.status` 渲染徽标；
- 操作栏用 `v-if="editable"` 硬渲染 新增/编辑/删除。

导致：任何一个不需要这两项能力的 tab 也得接受它们；且 `ListItem` 强制要求 `status` 字段，将来某 tab 数据无 `status` 时会显示错乱。

## 根因

共享组件承担了本应"由页面决定"的 UI 责任，违反"组件只提供骨架、具体能力由使用者选择"的封装原则。

## 修复

把两项能力从硬编码改为**显式 opt-in**（默认关闭），页面自行决定是否启用：

`src/views/system-manage/setting/components/MasterDetail.vue`：

```ts
interface ListItem {
  id: number;
  name: string;
  status?: Api.Common.EnableStatus; // 改为可选
}

const props = withDefaults(
  defineProps<{
    // ...
    showStatus?: boolean; // 是否显示列表项启用/禁用徽标，默认 false
    showActions?: boolean; // 是否渲染默认顶部操作栏，默认 false
    editable?: boolean;
  }>(),
  {
    // ...
    showStatus: false,
    showActions: false,
    editable: true
  }
);
```

- 左侧徽标：`v-if="showStatus && item.status !== undefined"` 才渲染；
- 右侧操作栏：包进 `<slot name="header">`，默认回退内容 `v-if="showActions"` 渲染 新增/编辑/删除（仍受 `editable` 控制显隐）；页面也可用 `#header` 插槽完全自定义或留空。

6 个使用 `MasterDetail` 的页面（`InputFormat` / `PrintFormat` / `ExportFormat` / `NotificationConfig` / `StationScan` / `InitData`）在 `<MasterDetail>` 上显式加 `:show-status="true" :show-actions="true"`，外观与重构前完全一致。

## 影响范围

- `MasterDetail.vue` 不再强制状态徽标与操作栏，成为纯「左列表 + 右内容」外壳；
- 「运单规则」本就不使用该组件，不受影响；
- 将来某 tab 不要状态或不要操作栏，直接不传对应 prop 即可，无需改组件。

## 验证

- `read_lints` 仅剩 `--menu-*` 动态 CSS 变量解析提示（IDE 噪声，非本次引入）；
- 6 个页面显式开启后视觉表现与重构前一致。建议本地 `pnpm typecheck && pnpm dev` 复核。
