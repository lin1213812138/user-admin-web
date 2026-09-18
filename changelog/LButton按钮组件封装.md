# LButton 按钮组件封装（默认档高度 32px）

日期：2026-09-18

## 需求

「封装一个按钮组件按照组件库的按钮封装要支持组件库的按钮都各种样式，默认大小的按钮的高度固定设置为 32px，然后先应用到客户列表的操作栏上面的按钮」。

## 澄清三问（均采纳推荐项）

1. **32px 作用范围** → 只改默认档（未显式传 `size`），`tiny/small/medium/large` 沿用组件库高度；**不做**全站 `themeOverrides` 覆盖（会影响既有 95+ 处 `NButton`）。
2. **客户列表改动范围** → 仅上方工具栏（新增 / 批量删除 / 列设置 / 刷新），行内操作列（编辑 / 删除）不动。
3. **tooltip** → 内置。传 `tooltip` 自动包 `NTooltip`，`disabled` 时自动垫 `<span>` 保证提示生效（naive 的 disabled 按钮不响应鼠标事件）。

命名经用户两次修正：先由 `AppButton` 改为 `LButton`，再明确是**字母 L** 不是数字 1，故文件名直接取 `LButton.vue`；目录由 `components/custom` 改到 `components/basic`（该目录当时为空）。

## 实施

### 新增 `src/components/basic/LButton.vue`

- `Props extends ButtonProps`（naive-ui 导出类型），保留全部按钮样式能力（type / text / ghost / round / circle / secondary / tertiary / quaternary / strong / dashed / loading / disabled / block …）。
- 自有 props：`tooltip` / `tooltipPlacement`（默认 `bottom`）/ `tooltipZIndex`（默认 98，与 `ButtonIcon` 一致）；另显式声明 `size` / `text` / `circle` / `disabled`（见坑 2、坑 3）。
- 高度固定：`fixedHeightStyle` 在未传 `size` 且非 `text` 时注入 `--n-height: 32px`（`circle` 时补 `--n-width: 32px`）。naive 按钮高度即 `height: var(--n-height)`，该变量由 NButton 内联注入，fallthrough 的 style 在 `mergeProps` 中后合并同键覆盖 ⇒ 稳定生效；**不用 `h-32px` class**（与 `.n-button` 同为单类选择器，胜负取决于样式注入顺序，不可靠）。`text` 按钮跳过覆盖（naive 刻意设 `--n-height: initial`）。
- 插槽透传：`v-for="name in Object.keys($slots)" #[name]`（与 `MasterDataArchive` 既有写法一致）；属性透传 `v-bind="{ ...attrs, ...buttonProps }"`，`inheritAttrs: false`。
- tooltip 分支用 `createReusableTemplate`（`@vueuse/core` 14.3.0 已在依赖中）避免把 NButton 那段模板抄三遍。

### 客户列表 `views/customer-manage/customer/index.vue`

四个工具栏按钮改 `<LButton>`：新增去掉 `size="medium"`、批量删除去掉手写 `NTooltip + span` 包裹改 `:tooltip`、列设置去掉 `size="small"`、刷新改 `circle` 并补 `:tooltip="$t('common.refresh')"`（32×32 与带文字按钮对齐）。行内操作列未动。

## 追加：Table 组件内的按钮也改用 LButton

用户补充"table组件里面的也要使用这个按钮组件"。改动三处：

| 文件                                       | 位置               | 改动                                                                                            |
| ------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------- |
| `components/Table/table.vue`               | 工具栏右侧导出按钮 | 去 `size="small"` → `circle` + `:tooltip="$t('common.export')"`（顺带删掉注释掉的 export 文案） |
| `components/Table/table.vue`               | 工具栏右侧搜索按钮 | 去 `size="small"`/`type="default"`/`title` → `circle` + `:tooltip="$t('common.search')"`        |
| `components/Table/table-column-config.vue` | 列设置弹窗 footer  | 重置 / 确认 改 `<LButton>`（34px → 32px）                                                       |
| `components/SearchBar/search-bar.vue`      | 搜索抽屉 footer    | 重置 / 搜索 改 `<LButton>`（34px → 32px；SearchBar 只被 Table 引用）                            |

两个图标按钮改成 `circle` 是为了与页面 `operation-right` 的刷新按钮一致（32×32 正方形），否则图标按钮宽度会被内容撑成矩形。

**影响面**：所有使用 Table 的页面，工具栏右侧导出/搜索按钮由 28px 变 32px 圆形；列设置弹窗与搜索抽屉的确认类按钮 34px 变 32px。这是"统一按钮高度"的本意，但属于全站生效，需 `pnpm dev` 目视确认。

## 坑

1. **`pnpm build` 失败：`[@vue/compiler-sfc] Failed to resolve extends base type`** —— `ButtonProps` 是派生类型，`vue-tsc` 能过但 SFC 编译器解析不了。修：`interface Props extends /* @vue-ignore */ ButtonProps`，未显式声明的 NButton 属性运行期走 `$attrs` 透传，编译期类型提示不变。
2. **`vue/no-undef-properties` 警告**（`props.size` 等"未定义"）—— 插件解析不了继承来的成员。修：把用到的 `size`/`text`/`circle`/`disabled` 在接口里显式声明（附带注释说明行为）。
3. `size` 显式声明后触发 `vue/require-default-prop` —— 在 `withDefaults` 里补 `size: undefined`（不设默认尺寸，让 NButton 走默认档再由 `fixedHeightStyle` 定高）。boolean 类（text/circle/disabled）规则默认豁免。
4. 早期草稿在模板里直接调 `useAttrs()` —— 必须在 setup 期间调用，已改为脚本内 `const attrs = useAttrs()`。

## 验证

- `pnpm typecheck` 0
- `pnpm lint` 0 error（仅 `link.vue` 2 个既有 warning）
- `pnpm fmt` 通过
- `pnpm build` 构建成功（同时重新生成 `src/typings/components.d.ts`，新增 `LButton` 声明，需随改动提交）
- 手动冒烟待用户 `pnpm dev`：客户列表上方工具栏四个按钮应同为 32px 高，批量删除 disabled 悬浮提示正常

## 不做

不动 `themeOverrides`、不替换行内操作列、不新增 i18n key（`common.refresh`/`common.export`/`common.search` 均已存在）。

追加轮次后已改动的既有 `NButton`：仅 `components/Table/table.vue`（导出/搜索）、`components/Table/table-column-config.vue`（重置/确认）、`components/SearchBar/search-bar.vue`（重置/搜索）共 6 处，其余页面 `NButton` 仍未动。
