# vxe 控制台警告修复（缺少 vxe-tooltip / vxe-loading 组件）

> 日期：2026-09-21 ｜ 状态：**已实施，待重启 dev server 验证**
> spec：`docs/superpowers/specs/2026-09-21-vxe控制台警告修复-design.md`

## 用户反馈

用户贴出控制台 4 条警告并要求解决：

```
[table] 不支持的参数 "show-overflow=tooltip"，可能为 "show-overflow=false,title,ellipsis"
[table] 缺少 "vxe-tooltip" 组件，请检查是否正确安装。
[table] 缺少 "vxe-loading" 组件，请检查是否正确安装。
[table] 不支持的参数 "loading=true"，可能为 "loading=false | <template #loading>...</template>"
```

## 根因（已核 vxe 源码 + 实测）

vxe-table 4.21.2 在 `es/table/src/table.js` 的 `setup()` 内取用子组件：

```js
const VxeUILoadingComponent = VxeUI.getComponent('VxeLoading');
const VxeUITooltipComponent = VxeUI.getComponent('VxeTooltip');
```

**取不到组件时**才会报上述 4 条 —— `show-overflow='tooltip'` 与 `loading=true` **本身是合法用法**，那两条"不支持的参数"只是「组件缺失时的替代建议」（建议改用 `false/title/ellipsis` 或 `#loading` slot）。

实测确认根因是**双 VxeUI 实例**：

```text
VxeUI.component = function
VxeTooltip.install = function
before reg VxeTooltip = true        # 组件本身存在
same VxeUI instance = false         # ← vxe-pc-ui 与 vxe-table 的 VxeUI 不是同一个单例
```

pnpm 依赖树里两个包各自依赖了不同版本的 `vxe-core` ⇒ 装了**两份 `VxeUI`**；而 `src/plugins/vxe-table.ts` 的 `app.use(VxePcUi)` 注册到的是 vxe-pc-ui 那份，vxe-table 校验用的是**它自己那份** ⇒ 永远取不到。

> 本地版本：`vxe-table@4.21.2` / `vxe-pc-ui@4.17.19`；npm 最新 4.22.0 / 4.18.16 —— 两包版本号本就不同步，因此**不是"版本不匹配"**。

## 修复

`src/plugins/vxe-table.ts`：把两个子组件显式注册到 **vxe-table 所用的 VxeUI**

```ts
import VxePcUi, { VxeLoading, VxeTooltip } from 'vxe-pc-ui';
...
app.use(VxePcUi);
app.use(VxeTable);

// 注册到 vxe-table 那份 VxeUI（组件定义无状态，可跨实例使用；时机早于任何表格实例化）
VxeUI.component(VxeTooltip);
VxeUI.component(VxeLoading);
```

**未改动**：`show-overflow` / `loading` 的用法（功能零降级）、依赖版本、`Table` 组件、业务页面、后端。

## 验证

- `pnpm typecheck`：0 错误（全项目仅 `handsontable` 未安装的 18 处既有错误）；
- `npx oxlint --fix`：**0 warnings 0 errors**；`npx oxfmt` + `--check`：通过；
- `npx eslint`：该 `.ts` 报 `File ignored because no matching configuration was supplied`（仓库 eslint include 未覆盖 `.ts`，既有现象）。

## 待用户验证（**需重启 dev server**）

1. 重启 `pnpm dev` 后打开任意表格页（列表页 / 附加费抽屉 / 同步到渠道抽屉）→ **4 条警告应全部消失**；
2. 列内容超长（如备注列）→ 仍显示省略号 + vxe 悬浮 tooltip；
3. 表格加载中 → loading 正常显示。

> 插件改动不走热更新，必须重启 dev server 才生效。
