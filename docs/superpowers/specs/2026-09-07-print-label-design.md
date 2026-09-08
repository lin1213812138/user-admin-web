# 标签打印模板设计器（vue-plugin-hiprint）设计方案

> 状态：设计已确认，待实现。实现记录另见 `changelog/标签打印模板设计器设计方案.md`。

## 1. 目标与范围

在「系统设置 → 打印格式」的模板列表基础上，新增**标签设计器**：从列表行「设计」按钮进入独立全屏页面，基于 `vue-plugin-hiprint`（hiprint 2.5.4，npm 包 `vue-plugin-hiprint@0.0.60`）实现拖拽式标签设计。

界面形态（对齐需求截图）：顶部工具栏（返回上一页 / 纸张尺寸 / 缩放 / 清空 / 保存 / 预览）+ 左侧可拖拽面板（业务字段分组 + 基础元素）+ 中间画布 + 右侧属性面板。

**本期实现**

- 独立路由页，从模板列表「设计」按钮带参进入，支持「返回上一页」。
- 自定义 provider：业务字段拖入画布即生成已绑定 `field` 的元素。
- 右侧直接挂载 hiprint 自带属性面板（不做自研 Naive UI 面板）。
- 纸张尺寸切换、画布缩放、清空、保存（模板 JSON 落库）。
- 浏览器预览 + `window.print()` 打印（不依赖 electron-hiprint 客户端）。

**本期不做**

- 多面板（`paginationContainer`）、撤销重做 UI（仅开启 `history: true` 支持快捷键）。
- 客户端静默打印（`print2`）、socket 连接（`disAutoConnect()` 关闭）。
- 模板版本管理、字段字典后端化。

## 2. 依赖与集成

| 事项        | 方案                                                                                                                                                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 安装        | `pnpm add vue-plugin-hiprint jquery`、`pnpm add -D @types/jquery`。注意本机 `node-safe-delete-shim` 会拦 `pnpm add`，需用 PowerShell 执行 `$env:NODE_OPTIONS=""; pnpm add ...`                                                                                                              |
| jQuery 全局 | hiprint 内部依赖全局 `$`。**禁止静态 import**，封装 `use-hiprint.ts` 在 `onMounted` 内**按顺序动态 import**：先 `await import('jquery')` 并挂 `window.$ / window.jQuery`（用 `Object.assign(window, {...})`，不用 `any`），再 `await import('vue-plugin-hiprint')`，随后 `disAutoConnect()` |
| Vite 预构建 | `vite.config.ts` 增加 `optimizeDeps: { include: ['vue-plugin-hiprint', 'jquery'] }`（UMD/CJS 产物需预构建）                                                                                                                                                                                 |
| 类型        | 新增 `src/typings/hiprint.d.ts`：`declare module 'vue-plugin-hiprint'`，手写最小声明（`hiprint`、`defaultElementTypeProvider`、`disAutoConnect`、`PrintTemplate` 的 `design / getJson / setPaper / zoom / getHtml / clear`），禁止 `any`                                                    |
| 打印样式    | 仅在设计器页 `import 'vue-plugin-hiprint/dist/print-lock.css'`，不进全局，避免污染其它页面                                                                                                                                                                                                  |
| 包体积      | 依赖全部**动态 import**，不进主包（hiprint 传递依赖 jquery / jspdf / bwip-js / html2canvas / socket.io-client 等）                                                                                                                                                                          |

## 3. 页面与路由

- 页面文件：`src/views/system-manage/print-design/index.vue`（路由 `/system-manage/print-design`，自动 name `system-manage_print-design`）。
- ⚠️ **不能放在 `src/views/system-manage/setting/` 下**：elegant-router 会生成子路由并给父路由自动加 redirect，与路由守卫叠加曾导致重定向死循环卡死（历史踩坑）。
- `src/router/routes/index.ts` 的 `customRoutes` 补 `hideInMenu: true`（菜单不显示，只从列表进入）。
- 进入：`router.push({ name: 'system-manage_print-design', query: { id, categoryId, name } })`；「返回上一页」→ `router.back()`，无历史时回退到设置页。
- 私有子组件（同级 `modules/`，elegant-router 忽略）：`tool-bar.vue`、`field-panel.vue`、`design-canvas.vue`、`preview-modal.vue`；抽取 `use-hiprint.ts`、`print-fields.ts`。
- 布局沿用仓库约定：根容器 `flex` + `min-h-0` + `overflow-hidden`，画布区 `overflow-auto` 自己滚动（参考 MasterDetail 的踩坑）。

## 4. 界面结构

```
┌──────────────────────── 顶部工具栏 ────────────────────────┐
│ 返回上一页 | 模板名 | 纸张尺寸▾ | - 100% + | 清空 保存 预览 │
├───────────┬──────────────────────────┬────────────────────┤
│ 左侧 240  │  中间画布                 │ 右侧 ~300          │
│ 字段/元素 │  #hiprint-printTemplate   │ #PrintElementOption│
│ 折叠分组  │  (标尺 + 纸张白底)        │ Setting（hiprint   │
│ .ep-drag  │                           │ 自带属性面板）      │
└───────────┴──────────────────────────┴────────────────────┘
```

- **缩放**：`hiprintTemplate.zoom(scale)`，范围 0.5–2.0，步进 0.1，工具栏显示百分比。
- **纸张**：`hiprintTemplate.setPaper(width, height)`（mm），选项 A4(210×297)、100×100、100×150、80×60、自定义，与列表 `labelSize` 取值对齐；切换只改纸张尺寸，不删元素。
- **清空**：优先 `hiprintTemplate.clear()`；若当前版本无此方法，则销毁实例并 `new PrintTemplate({ template: { ...paper } })` 重新 `design()`。
- **保存**：`JSON.stringify(hiprintTemplate.getJson())` → 调保存接口。

## 5. 数据模型与接口

- `src/typings/api/print-format.d.ts` 的 `Api.PrintFormat.Template` 增加：
  - `designJson: string`（hiprint 模板 JSON 字符串，缺省 `''`）
  - `paperSize: string`（如 `'100×150mm'`）
  - `CreateParams` 由 `Omit` 自动继承。
- `src/service/api/print-format.ts` 新增（DEV 走现有内存 mock，生产走真实接口）：
  - `fetchGetPrintTemplateDetail(id)` → `/print/template/detail`
  - `fetchSavePrintTemplateDesign({ id, designJson, paperSize })` → `/print/template/saveDesign`
- 列表页 `setting/modules/PrintFormat.vue` 操作列新增「设计」按钮；i18n 新增 `page.manage.setting.printFormat.design`（zh-cn / en-us 同步，`typings/app.d.ts` 的 `App.I18n.Schema` 同步）。

## 6. 业务字段 Provider

- `modules/print-fields.ts` 声明常量（前端维护，后端暂无字段字典）：

```ts
export interface PrintField {
  key: string; // 绑定字段名，如 waybillNo
  label: string; // 左侧展示名，如 运单号
  type: 'text' | 'longText' | 'barcode' | 'qrcode' | 'table';
  sample: string; // 预览示例值
}
export interface PrintFieldGroup {
  key: string; // 分组标识，如 waybill
  label: string; // 运单信息
  fields: PrintField[];
}
```

分组：运单信息、收件人信息、发件人信息、物品信息、费用信息、系统信息。

- 初始化：`hiprint.init({ providers: [new defaultElementTypeProvider(), printFieldProvider] })`。
  `printFieldProvider.addElementTypes(context)` 遍历分组执行
  `context.addPrintElementTypes(groupKey, fields.map(f => new hiprint.PrintElementType({ tid: `${groupKey}.${f.key}`, title: f.label, type: f.type, options: { field: f.key, testData: f.sample } })))`。
  落地时以 `node_modules/vue-plugin-hiprint` 内实际 API 为准核对字段名。
- 左侧面板：每项渲染为 `<div class="ep-draggable-item" :tid="...">`，`nextTick` 后执行 `hiprint.PrintElementTypeManager.buildByHtml($('.ep-draggable-item'))`（jQuery 选择全局元素）。
- 基础元素分组复用 `defaultElementTypeProvider` 的 tid（文本 / 长文本 / 条码 / 二维码 / 图片 / 线条 / 矩形 / 表格）。

## 7. 预览与打印

「预览」打开 `NModal`：

1. 取当前 `getJson()`，`new hiprint.PrintTemplate({ template: json })`。
2. `getHtml(sampleData)` 生成 HTML 注入 `iframe`（`sampleData` 由 `print-fields.ts` 的 `sample` 拼成示例运单数据，预览看到的是真实效果而非字段名）。
3. 点「打印」调 `iframe.contentWindow.print()`。

## 8. 风险与取舍

- **暗黑模式**：hiprint 自带面板为浅色 HTML，先用 scoped `:deep` 覆盖，标注为已知限制，不追求完美。
- **jQuery 全局污染**：仅在动态加载时挂 `window.$`，且只影响设计器页；项目其余代码不使用 jQuery。
- **协议**：hiprint 2.5.4 为 LGPL（npm 包自身 MIT），仅作库引用、不修改源码；后续如需改源码需先确认法务。
- **`print-lock.css` 为 `media="print"`**：预览 iframe 内需保证样式注入，必要时用 `styleHandler` 补 `<link>`。
- **后端未实现**：`designJson` 相关接口后端暂无，DEV mock 先行，生产接口字段已在设计中约定。

## 9. 验收标准

- `pnpm typecheck`、`pnpm lint`、`pnpm build` 全部通过。
- DEV 下：拖字段入画布 → 改属性 → 切纸张 → 缩放 → 预览 → 保存 → 重进回显一致。
- 设计器依赖不进入主包（构建产物中主 chunk 不含 hiprint）。
