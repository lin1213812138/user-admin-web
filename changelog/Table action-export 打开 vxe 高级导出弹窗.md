# Table action-export 打开 vxe 高级导出弹窗

## 问题

用户期望点击通用 `Table` 右上角「导出」按钮后，弹出 vxe-table 原生的「导出数据」高级面板（可选择文件名、保存类型、字段、表头/列标题等），而不是直接下载。

## 结论

将 `src/components/Table/table.vue` 中 `action-export` 的处理从 `exportData` 改为 `openExport`：

- 实例最小接口 `VxeExportableTable` 增加 `openExport?: (options?: VxeTablePropTypes.ExportConfig) => void`。
- `handleNativeExport` 调用 `instance.openExport(exportConfig.value)` 打开高级导出弹窗。
- `<vxe-table>` 增加 `:export-config="exportConfig"`，启用导出能力并作为默认参数来源。
- 移除按钮的 `:loading="exporting"`，因为弹窗是同步打开，无需等待。

右侧 `action-export` 仍为 vxe-table 原生高级导出；左侧操作栏的 `TableExportAction` 继续负责 exceljs 字段选择/全量导出，两套并存。

## 影响范围

- `src/components/Table/table.vue`
- 用户管理页等启用了 `action-export` 的页面会自动切换为高级导出弹窗
