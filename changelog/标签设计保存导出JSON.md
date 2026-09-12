# 标签设计 designJson 目标存储格式改造（B 方案 + options 兼容层，已实施）

## 需求演进

1. 用户问「点保存能不能导出整个标签的 json 数据」→ 先实施保存成功后自动下载 JSON 文件（`downloadTemplateJson`，Blob + a[download]，文件名=模板名.json）。
2. 用户随后给出目标格式样例（顶层 `unit: 'pt'` + `paper: { width, height, unit: 'mm' }` + 元素 `key/label/style`），要求 **designJson 存储整体换成该格式（B 方案），且当前已有字段全部兼容保留**。
3. 兼容层位置经用户确认：**独立 options 子对象**（元素 = 目标字段 + style + options，两套字段不混淆）。

## 目标格式要点（用户样例逆向）

- 元素坐标单位 pt（样例验证 4mm=11.34pt、18mm=51.02pt，即 ×72/25.4）；fontSize 本就是 pt。
- `key ← options.field`、`label ← options.title`、`hideLabel ← !showTitle`、`style.placeholder ← text/value`（示例内容）。
- 目标有而原生没有的：fontFamily（填 Microsoft YaHei）、fontStyle/textDecoration/letterSpacing/verticalAlign/wordWrap/rotation/opacity、barcode 的 barcodeType/showBarcodeText、vline lineStyle 等 → 导出按样例默认值补齐。
- 原生有而目标没有的：titleFontSize/titleColor/titleFontWeight、textGap、ecc、testData、longText 类型 → 全部在 options 兼容层保留，零丢失。

## 关键前提变化（并行改动）

实施期间用户并行把**内部模板几何迁移为 pt 存储**（store `migrateGeometryToPt`、types `LabelTemplate.unit?: 'mm' | 'pt'` 缺省视为 mm 旧数据）。因此转换模块最终为**几何 pt 直传不换算**，mm→pt 迁移逻辑吸收进解析入口 `parseTemplateJson`。

## 实施

- 新建 `src/views/system-manage/label-designer/modules/export-format.ts`：
  - `toExportTemplate()`：内部模板 → 目标格式（paperSize 经 parsePaper 拆 paper 对象；key/label/style 映射 + 默认值补齐；options 原样保留）。
  - `parseTemplateJson()`：designJson 解析统一入口，兼容三种输入——①目标格式（顶层有 paper）：options 优先无损还原，无 options（外部系统数据）按类型从 key/label/style 反推（wordWrap:true 的 text 判 longText）；②旧原生格式：原样加载，unit 缺省/mm 时几何 mm→pt 迁移；③空串/非法 JSON 回退空模板。
- `store/modules/label-design/index.ts`：`toJson()` = `JSON.stringify(toExportTemplate(template.value))`；`loadFromJson()` = `parseTemplateJson(json)`；删除 store 内 `migrateGeometryToPt`（移入转换模块）与 unused `parsePaper` import。
- 画布内部状态（pt 几何、options 结构、撤销栈、属性面板、渲染）零改动；`handleSave` / `downloadTemplateJson` / `loadTemplate` 三处调用点零改动。

## 验证

`pnpm typecheck` 通过；oxlint 两文件 0 warnings 0 errors。

## 后续迭代：保存行为改为新标签预览（2026-09-12）

- 用户要求「保存改成打开新标签预览json文件」：`downloadTemplateJson()` 替换为 `previewTemplateJson()`——`store.toJson()` → Blob(application/json) → `window.open(url, '_blank')`，浏览器原生 JSON 查看器渲染；`URL.revokeObjectURL` 延迟 60s 释放（立即 revoke 会让新标签页空白）。保存失败仍不产生任何输出；下载 .json 文件能力随之移除（如需文件可直接在新标签页 Ctrl+S）。

## 手测清单

1. 打开标签设计页（旧 designJson 原生格式）→ 画布正常还原（mm 迁移 pt）→ 保存 → 后端 designJson 变目标格式。
2. 重新进页面加载新格式 → 画布还原与保存前一致（options 优先路径）。
3. 点保存/Ctrl+S → 新标签页打开 JSON 预览，内容形如目标样例（paper 对象 + key/label/style + options）。
4. 用纯目标格式样例数据（无 options）替换 designJson → 画布按 style 反推渲染。
