# 标签设计器保存不再打开 JSON 预览（改为纯保存）

- 日期：2026-09-17
- 范围：`src/views/system-manage/label-designer/index.vue`

## 需求

用户："标签设计界面的报存调用修改接口" → 澄清确认：**保存不要开 JSON 预览，只保存**（保留保存成功提示）。

## 现状核查（澄清事实）

- 标签设计器（自研 `label-designer`，由「系统设置 → 打印格式 → 设计」进入）的「保存」**本就调用修改接口**：`handleSave()` → `fetchSavePrintTemplateDesign()` → `POST /print-template/update`（`service/api/print-format/index.ts`），并回带 `_id / templateType / templateMode / sizeType` 与顶层 mm 宽高的 design。
- 与需求不符的是保存成功后的附加行为：`previewTemplateJson()` 用 Blob URL `window.open` 另开新标签页预览 designJson（2026-09-12「保存导出 JSON」迭代产物），容易与「保存成功」混淆。

## 改动

`label-designer/index.vue` 一个替换块内两处：

1. `handleSave()` 成功分支去掉 `previewTemplateJson()` 调用，只保留 `window.$message?.success(saveSuccess)`（失败分支 `saveFailed` 不变）。
2. 删除 `previewTemplateJson()` 函数定义（唯一引用点即上述调用）。

工具栏「预览」按钮（`PreviewModal` 渲染设计效果）与 `store.toJson()` 的保存序列化不受影响。

## 验证

- `pnpm typecheck` exit 0。
- 单文件 `oxlint` 0 warnings / 0 errors；`eslint` 0 error；read_lints 0。

## 未做

- 打印格式列表其它行为与 `/print-template/update` 契约未动。
