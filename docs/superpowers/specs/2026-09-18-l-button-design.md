# LButton 按钮组件设计

日期：2026-09-18
状态：待实现

## 背景

项目里 `NButton` 被直接使用 95+ 处，各处手写 `size="medium"` / `size="small"` 导致同一行工具栏按钮高度不一致（medium 34px、small 28px）。需要一个统一入口的按钮组件，在保留 naive-ui 全部按钮样式能力的前提下，把**默认档高度固定为 32px**，并内置 tooltip（含 disabled 态提示）以减少重复包裹代码。

首个落地页面：`src/views/customer-manage/customer/index.vue` 的**上方工具栏**（新增 / 批量删除 / 列设置 / 刷新）。行内操作列本次不动。

## 决策记录

| 议题                 | 决策                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------- |
| 高度作用范围         | 仅默认档（未显式传 `size`）固定 32px；`tiny/small/medium/large` 显式传入时使用组件库原生高度 |
| 是否全局覆盖 NButton | 否。只在新组件内生效，不动 `themeOverrides`，避免影响既有 95+ 处 `NButton`                   |
| tooltip              | 内置。传 `tooltip` 自动包 `NTooltip`；`disabled` 时自动垫 `<span>` 保证 hover 提示生效       |
| 组件命名             | `LButton`（文件 `src/components/basic/l-button.vue`）                                        |
| 落地范围             | 仅客户列表上方工具栏四个按钮                                                                 |

## 组件契约

**文件**：`src/components/basic/LButton.vue`，`defineOptions({ name: 'LButton' })`。
由 `unplugin-vue-components` 自动全局注册（扫描 `src/components`），无需手动 import。

### Props

继承 `naive-ui` 的 `ButtonProps`（`type` / `size` / `text` / `ghost` / `round` / `circle` / `secondary` / `tertiary` / `quaternary` / `strong` / `dashed` / `loading` / `disabled` / `block` / `renderIcon` / `focusable` / `attrType` / `tag` / `color` 等），保证组件库所有按钮样式可用。

> 实现注意：`ButtonProps` 是派生类型，`@vue/compiler-sfc` 无法解析其成员（`vue-tsc` 能过、`vite build` 会报 `Failed to resolve extends base type`），必须写成
> `interface Props extends /* @vue-ignore */ ButtonProps`。被 `@vue-ignore` 跳过的属性运行期走 `$attrs` 透传，编译期类型提示不变。
> 组件内部读取到的 `size` / `text` / `circle` / `disabled` 需在接口中显式声明，否则运行期取不到（`@vue-ignore` 的基类成员不进 props）。

新增自有 props：

| 属性               | 类型               | 默认值     | 说明                                  |
| ------------------ | ------------------ | ---------- | ------------------------------------- |
| `tooltip`          | `string`           | `''`       | 悬浮提示文案，为空则不渲染 `NTooltip` |
| `tooltipPlacement` | `PopoverPlacement` | `'bottom'` | 提示方向                              |
| `tooltipZIndex`    | `number`           | `98`       | 提示层级（与 `ButtonIcon` 保持一致）  |

### 插槽与事件

`#default`、`#icon` 全量透传给 `NButton`；`@click` 等原生事件透传。

### 用法

```vue
<LButton type="primary" @click="openDrawer('create')">
  <template #icon><icon-ic-round-plus class="text-icon" /></template>
  {{ $t('common.add') }}
</LButton>

<LButton type="error" disabled :tooltip="$t('page.manage.customer.deleteDisabledTip')">
  {{ $t('common.batchDelete') }}
</LButton>
```

## 32px 实现机制

naive-ui 按钮的高度来自内联 CSS 变量：`height: var(--n-height)`，`--n-height` 由 `NButton` 自身通过 `style` 注入（`circle` 时另有 `--n-width`）。

- 判断条件：未显式传 `size`（`useAttrs()` 中不含 `size`）**且**未开启 `text` → 追加 inline style `--n-height: 32px`（`circle` 时同时 `--n-width: 32px`）。
- 生效原理：`inheritAttrs: false` + `v-bind="$attrs"` 时，fallthrough 的 `style` 在 Vue `mergeProps` 中后合并、同键覆盖，因此能稳定压过组件自身注入的 `--n-height`；且 inline style 优先级高于 stylesheet，不受 `inlineThemeDisabled`（`themeClass` 模式）影响。
- 不采用 `h-32px` 这类 class 方案：与 `.n-button` 同为单类选择器，胜负取决于样式注入顺序，不可靠。
- `size` 不声明为自有 prop（走 `useAttrs()` 判断），避免把 NButton 属性从 `$attrs` 里"吃掉"，保证零损耗透传。
- `text` 型按钮跳过覆盖：naive 对 text 按钮刻意 `--n-height: initial`，强行设 32px 会改变行内文字按钮排版。

## 客户列表改造点

文件：`src/views/customer-manage/customer/index.vue`

| 按钮     | 现在                                                                      | 改造后                                          |
| -------- | ------------------------------------------------------------------------- | ----------------------------------------------- |
| 新增     | `NButton size="medium" type="primary"` + `#icon`                          | `<LButton type="primary">` + `#icon`            |
| 批量删除 | `NTooltip :disabled="false"` + `<span>` + `NButton type="error" disabled` | `<LButton type="error" disabled tooltip="...">` |
| 列设置   | `NButton size="small"` + `#icon`                                          | `<LButton>` + `#icon`                           |
| 刷新     | `NButton size="small"` + `#icon`（图标按钮）                              | `<LButton circle>` + `#icon`，宽高同为 32px     |

改造后工具栏四个按钮全部落在默认档，高度统一 32px；批量删除处手写的 `NTooltip + span` 包裹代码删除。

行内操作列（编辑 / 删除，`#action` 插槽）本次保持不变。

## 风险与边界

- `src/typings/components.d.ts` 由 `unplugin-vue-components` 在 dev/build 时重新生成，会新增 `LButton` 声明，需随改动一起提交。
- 仅新增文件 + 改一个页面，不触碰 `themeOverrides` 与既有 `NButton`，回归面局限于客户列表页。
- 组件目录 `src/components/basic` 当前为空，本次为首个基础组件。

## 验证

1. `pnpm typecheck`（`vue-tsc --noEmit --skipLibCheck`）
2. `pnpm lint`（`oxlint --fix && eslint --fix .`）
3. `pnpm fmt`（oxfmt，pre-commit 会校验 `git diff --exit-code`）
4. `pnpm dev` 起服务，检查客户列表上方工具栏按钮高度为 32px、批量删除 disabled 悬浮提示正常出现
