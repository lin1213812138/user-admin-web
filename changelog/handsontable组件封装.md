# Handsontable 通用可编辑电子表格组件封装

## 2026-09-20 已实施（浏览器冒烟待人工验收）

### 用户原话

> 能不能帮我封装一个 handsontable 组件，放这里，要功能全面 `src/components/common/handsontable`

随后用户以「开始吧」命中硬闸门宽泛口令（消息含「开始」二字）＝确认 spec。

### 流程（硬闸门 G0–G6）

| 阶段         | 结果                                                                                                                                                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G0 技能判定  | `using-agent-skills`（已加载）→ `brainstorming`（澄清「功能全面」边界）→ `spec-driven-development` → 确认后 `planning-and-task-breakdown` → `incremental-implementation` → `code-review-and-quality`（lint/typecheck/build 三闸） |
| G1 SPECIFY   | `docs/superpowers/specs/2026-09-20-handsontable-component-design.md`，状态行 `> 🔴 状态：待确认（禁止实现）`                                                                                                                      |
| G2 用户确认  | 4 项选择题（范围/版本/交付形态/定位）→ 用户「开始吧」＝确认                                                                                                                                                                       |
| G3 落章      | 状态行改 `> ✅ 状态：已确认（用户确认：「开始吧」，2026-09-20）`，之后才写代码                                                                                                                                                    |
| G4 PLAN      | 7 项任务清单（准备 / 类型与 composable / 组件本体 / i18n / 示例页 / 验证 / 记录）                                                                                                                                                 |
| G5 IMPLEMENT | 依赖 → types → 汇总条 → composable → 组件 → i18n → 示例页与路由；每步 `pnpm typecheck`                                                                                                                                            |
| G6 记录      | 本文档 + `AGENTS_CHANGELOG.md` 索引                                                                                                                                                                                               |

### 已确认范围（用户选择题结论）

- **功能范围**：① 基础+编辑+校验 ② 交互增强 ③ 主题与国际化 ④ 行级增强；**不含**内置工具栏、**不含** Excel 导入导出（页面自拼工具条，导出可复用 `components/Export/export-xlsx.ts`）。
- **依赖版本**：`handsontable@18.1.1`（最新，官方 Theme API；不用 15 的 legacy CSS）。
- **交付形态**：目录多文件 + 仅开发环境可访问的示例页（不接业务菜单）。
- **组件定位**：通用可编辑电子表格（批量录入 / 粘贴导入 / 编辑校验），与 vxe-table 列表页并存。

### 交付物

```
src/components/common/handsontable/
├── handson-table.vue      # 组件本体（容器 + 汇总条 + defineExpose）
├── types.ts               # HotProps / HotColumn / HotColumnRule / HotError / HotSummary / HotCheckedState ...
├── use-handsontable.ts    # 实例生命周期、settings 组装、数据同步、校验、行勾选、行/列操作、对外 API
├── use-hot-summary.ts     # 汇总条：汇总计算 + 列宽读取 + 横向滚动/尺寸同步
├── index.ts               # 出口（组件 + 两个 hook + 全部类型）
└── handson-table-demo.vue # 仅开发环境示例页（/handsontable-demo）
```

配套改动：

- `package.json` / `pnpm-lock.yaml`：新增 `handsontable@18.1.1`（`pnpm add -E`）。
- `src/locales/langs/{zh-cn,en-us}.ts` + `src/typings/app.d.ts`：新增 `handsontable` 命名空间（5 个键）。
- `src/router/index.ts`：`import.meta.env.DEV` 守卫的裸路由 `/handsontable-demo`。
- `src/typings/components.d.ts`：由 unplugin 自动重生成（新增 `Handsontable`… 见下方偏差 4，重命名后为 `HandsonTable` / `HandsonTableDemo`）。

### 组件能力（对应验收项）

- **数据**：`v-model` 双向绑定；`getData()`（净化行数据）/`getSourceData()`/`setData()`/`addRow()`/`removeRow()`/`removeRows()`/`duplicateRow()`/`clear()`。
- **编辑**：文本/数字/日期/时间/下拉/自动完成/复选 7 类单元格；`required` + `rules[{pattern, validator, message, trigger}]`；`validate()` 返回国际化错误列表 + HOT 原生高亮 + 自动定位第一处；`clearValidation()`/`errorsToText()`。
- **交互**：右键菜单（默认 14 项，可 `false` 或自定义数组）、撤销重做（行操作走 `alter`，保留撤销栈）、Excel 双向粘贴、列排序、筛选（含表头筛选面板）、搜索 `search()`/`clearSearch()`、列宽/行高拖拽、行/列拖拽（默认关）、冻结行列、合并单元格（`mergeSelection()`/`unmergeSelection()`）、嵌套表头。
- **行级**：行勾选列（含表头全选 + 半选态，勾选框注入 `afterGetColHeader`，捕获阶段阻止冒泡避免误触排序）、`getCheckedRows()`/`getCheckedIndexes()`/`setAllChecked()`/`removeCheckedRows()`、footer 汇总条（`sum/count/average/min/max/custom` + `formatter`）。
- **主题与国际化**：跟随 `useThemeStore().darkMode`（`updateSettings({ colorScheme })`）、中英文跟随项目 i18n（HOT 语言字典 `zh-CN`/`en-US`）、密度 `default/compact/comfortable`、三套主题 `main/horizon/classic`；必填未填即时高亮（`hot-cell-required`，用 `--ht-cell-error-background-color`）。

### 关键实现决策（含被否方案）

1. **自管实例**：直接 `new Handsontable(el, settings)` + `onBeforeUnmount` destroy，自行按需 `updateSettings`，不使用 `@handsontable/vue3`（声明式 settings 变化易整表重建、丢光标与撤销栈，且多一个依赖）。
2. **汇总条自绘**：官方 `columnSummary` 插件不会自动加行、必须占用真实数据行并把结果写回单元格，启用排序/筛选时会被移动甚至覆盖数据；改为表格下方自绘条（不写数据、随列宽与横向滚动同步），已知限制＝启用冻结列时汇总条不平移冻结列。
3. **校验双通道同源**：一套规则函数既生成 HOT `validator`（负责原生高亮，行信息经 `this`（cellProperties）取 `visualRow → toPhysicalRow`），又由 `validate()` 自行遍历产出国际化错误列表。**「整行皆空」的行跳过校验**（`minSpareRows` / 手动留白不报必填错）。
4. **数据同步**：HOT 对象数据模式就地修改传入数组 ⇒ `v-model` 同引用天然同步；`update:modelValue` 用同引用 emit，父层不换数组就不会重载（不丢光标/撤销栈）；父层换数组或长度变化才 `loadData`。
5. **DEV 示例页路由**：示例页放组件目录（被 `pageExcludePatterns: ['**/components/**']` 排除，不进路由扫描），在 `src/router/index.ts` 用 `import.meta.env.DEV` 守卫 `router.addRoute()` 裸路由挂载——生产构建死代码消除，不污染 `RouteKey`/菜单/权限。
6. **样式引入**：组件内静态引入 `handsontable/styles/handsontable.min.css` + 三套主题 CSS，并在 settings 传 `injectCoreCss: false` 关闭核心自动注入（避免重复）；`theme` 传 `ThemeBuilder` 实例（`getTheme(name)`）以保证 `colorScheme`/`density` 生效（HOT 仅在主题引擎激活时支持这两项，传字符串类名会被忽略并告警）。

### 与 spec 的偏差（如实记录）

1. 汇总项的 `numericFormat?: { pattern, culture }` 改为 `formatter?: (value: number) => string`——自绘条不引入 numbro 模式解析，展示格式化交给页面（更可控、无需臆造精度）。
2. i18n 键由 spec 的 3 个增至 5 个：新增 `invalidWithMessage`（自定义提示拼接，避免中文冒号硬编码破坏英文语序）与 `summaryLead`（汇总条行头「合计」）。
3. 组件文件由 `handsontable.vue` 改名为 `handson-table.vue`（示例页同理）——unplugin 按文件名生成注册名，原名会生成 `Handsontable`；改名后与 `defineOptions({ name: 'HandsonTable' })`、出口导出名一致。
4. 汇总条行头占位宽度取「首个数据单元格 `offsetLeft`」而非写死值（行头宽度随主题/密度变化），并在 `ResizeObserver` + `afterColumnResize/afterColumnMove` 时重算；`refresh()` 的 `getColWidth` 按可视列序读取，配合 `toPhysicalColumn` 还原字段。
5. `getData()` 返回**浅拷贝行对象**并剔除内部勾选字段（`rowCheckboxKey`），避免把 `__checked` 带进提交 payload；需要原样数据用 `getSourceData()`。
6. `alter('remove_row', [...])` 未使用数组索引（官方类型仅接受 `number[][]`），改为 `batch` 内「自下而上逐个删除」，保证索引有效。

### 验证

| 项                   | 结果                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm typecheck`     | ✅ 0 error                                                                                |
| `pnpm lint`          | ✅ 0 error（`components/common/link.vue` 2 条既有 warning，与本次无关）                   |
| `pnpm fmt`           | ✅ 执行通过；`git diff` 复核「无任何文件是纯空白差异」⇒ 未波及其他文件                    |
| `pnpm build`（prod） | ✅ Build successful                                                                       |
| 生产产物不含示例页   | ✅ `dist/` 全量检索 `handsontable-demo` / `HandsonTableDemo` 命中 0（DEV 守卫路由被 DCE） |
| 浏览器冒烟           | ⏳ **待人工验收**（自动化步骤被用户取消；`pnpm dev` 后访问 `/handsontable-demo`）         |

冒烟清单（逐项对应 spec §8）：编辑单元格↔JSON 实时同步 / 父层换数组刷新且不丢撤销栈 / 7 类单元格类型 / 必填+正则+行级即时校验（高亮、定位、`clearValidation`）/ 行勾选（单行、全选、半选、批量删行、`getData` 无内部字段）/ 右键菜单与撤销重做 / Excel 双向粘贴 / 排序筛选搜索 / 列宽行高拖拽 / 冻结行列 / 合并与取消合并 / 嵌套表头 / 汇总条数值与对齐 / 切暗色跟随 / 切语言跟随（右键菜单与筛选面板）/ 密度切换。

### 边界（本次不做）

- 不做内置工具栏 UI、不做 Excel 导入导出（xlsx 解析）。
- 不改后端（`tms-user` 未涉及）、不改任何业务页面/菜单/权限码/接口。
- 不动 `Table`/`Form`/`Drawer`/`useVxeTable` 等既有公共组件。
- 不做大数据量只读展示优化（不追求替代 vxe-table 列表）。

### 风险与提醒

1. **许可（需知情）**：`licenseKey: 'non-commercial-and-evaluation'` 仅限非商用/评估，与 `wms-user-web` 现状一致；若 CWMS 商用交付需采购 Handsontable 商业许可或替换方案。
2. **体积**：`handsontable` 解包约 34.6 MB，`registerAllModules()` 全量注册；因只有用到该组件的页面会 import，落在对应页面 chunk（当前仅示例页），不进首屏主包。
3. **`modelValue` 引用约束**：父层每次传入新数组会触发 `loadData` 并丢光标/撤销栈——请用 `ref` 数组（或 `setData`/`addRow` 等命令式 API）驱动。
4. **冻结列 + 汇总条**：汇总条不平移冻结列（spec §6.7 已标注）。
5. **汇总口径**：汇总基于**全部数据行**，不受筛选影响。

### 相关文件

- spec：`docs/superpowers/specs/2026-09-20-handsontable-component-design.md`
- 代码：`src/components/common/handsontable/`
- 示例页：`/handsontable-demo`（仅 DEV）
