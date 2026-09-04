# 导出格式界面设计（2026-09-04）

> 在现有 `ExportFormat.vue` 占位页上实现，照搬 `PrintFormat.vue` 已验证的 MasterDetail + useVxeTable + Drawer 模式。

## 目标

实现「系统设置 → 导出格式」页：左侧 13 项固定导出格式类型，右侧按分类展示模板表格，支持新建/编辑（含上传文件）与删除，下载类操作为 DEV 占位。

## 左侧固定分类（13 项，业务常量内联于 .vue，沿用 PrintFormat 写法不进 i18n）

1. 业务清单导出
2. 收货交接单导出
3. 发运交接单导出
4. 应收账单（按费用）导出
5. 应收账单（按票）导出
6. 应付账单（按费用）导出
7. 应付账单（按票）导出
8. AWB 总单清单导出
9. 单票运单导入
10. 报关资料导出
11. 出货清单导出
12. 配合订单详情导出
13. 清关资料导出

左侧列表标题：`导出格式类型`。

## 右侧表格列

模板名称（`detail` 可点击）、使用范围、备注、最后编辑、编辑时间、操作列。

## 操作

- 顶部按钮：新建 / 删除（批量，依赖勾选）/ 字段模板下载（占位 `$message`）。
- 行内操作：编辑 / 下载模板（占位 `$message`）。
- 顶部右侧保留灰色提示：「该模板在 [业务操作-业务管理-导出] 时调用！」
- 删除走 `window.$dialog` 二次确认。

## 数据模型

`src/typings/api/export-format.d.ts`：

- `Template`: `id, categoryId, name, scope（使用范围）, fileName（上传文件名）, remark, lastEditor, editTime`
- `List`: `{ records, total }`
- `CreateParams = Omit<Template, 'id' | 'lastEditor' | 'editTime'>`

接口函数（DEV 走内存 mock，PROD 走 `/export/template/*`）：
`fetchGetExportTemplateList / fetchCreateExportTemplate / fetchDeleteExportTemplate`。

## 新建/编辑抽屉表单

模板名称（必填 input）、使用范围（select：内部系统/客户/全部）、上传文件（NUpload，DEV 仅记录文件名）、备注（textarea）。查看态禁用。

## i18n

`page.manage.setting.exportFormat` 由字符串升级为对象，三处同步（zh-cn / en-us / `typings/app.d.ts`）。`setting/index.vue` 的 tab 标签改用 `exportFormat.title`。

## 文件改动

- 改 `src/views/system-manage/setting/modules/ExportFormat.vue`（主体）
- 新增 `src/service/api/export-format.ts`（mock 预置 13 分类各若干模板，含截图 BOL 示例）
- 新增 `src/typings/api/export-format.d.ts`
- 改 `src/locales/langs/zh-cn.ts` / `en-us.ts` / `typings/app.d.ts`（exportFormat 升级为对象）
- 改 `src/views/system-manage/setting/index.vue`（tab 标签 key）
