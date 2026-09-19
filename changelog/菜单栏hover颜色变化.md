# 菜单栏 hover 颜色变化

## 问题现象

浅色主题 + 深色侧栏（`sider.inverted`）下，侧边栏菜单项鼠标 hover 时几乎没有颜色反馈（用户贴侧栏截图问「菜单栏 hover 能不能加个颜色变化」）。

## 根因

已从 naive-ui 2.44.1 源码确认（`node_modules/naive-ui/es/menu/styles/light.mjs` → `createPartialInvertedVars`）：

```
itemColorHoverInverted: '#0000'    ← hover 背景完全透明，无任何背景变化
itemTextColorHoverInverted: '#FFF' ← 文字仅从 #BBB 变纯白
itemIconColorHoverInverted: '#FFF'
arrowColorHoverInverted: '#FFF'
```

即 inverted（深色侧栏）菜单的 hover 被 naive 设计成「仅文字从浅灰转纯白」，在深蓝底 `rgb(0,20,40)` 上几乎不可见；`menuLight` 的普通（非 inverted）`itemColorHover` 是 `hoverColor` 有背景，inverted 下则被 `#0000` 覆盖。

## 决策（用户确认）

- hover 形态：**背景微亮 + 文字/图标/箭头变主题蓝**（「半透明白底加强」「主题蓝半透明底」两案未采纳）。
- 落点：**naive 主题变量覆盖（方案 A）**——在 `getNaiveTheme()` 里给 `Menu` 补 inverted hover 变量。未采纳：B 全局 CSS 覆盖（变量为内联注入需 `!important`，且 naive 2.44.1 inverted 不加 `n-menu--inverted` 类名、选择器脆弱）；C 组件内深度选择器（只覆盖 vertical 一种布局）。

## 修复

只改 `src/store/modules/theme/shared.ts` 的 `getNaiveTheme()`：

```ts
// 深色侧栏（inverted）菜单 hover 反馈：naive 默认背景无变化、文字仅 #BBB→#FFF。
const menuHoverColor = getPaletteColorByNumber(colors.primary, 400, settings.recommendColor);

const theme: GlobalThemeOverrides = {
  // ... common / LoadingBar / Tag 不变
  Menu: {
    itemColorHoverInverted: 'rgba(255, 255, 255, 0.12)',
    itemTextColorHoverInverted: menuHoverColor,
    itemIconColorHoverInverted: menuHoverColor,
    arrowColorHoverInverted: menuHoverColor
  }
};
```

- 文字/图标/箭头取主题色 **400 号亮色阶**（默认主题色 `#3b82f6` → `#66a6ff`），在深蓝底上对比度更高；用 `colors.primary` 计算，主题色改动自动跟随。
- **刻意不动选中态变量**（`itemTextColorActiveHoverInverted` 等）：选中项为蓝底白字，变蓝会不可读。
- **刻意不动 `itemTextColorChildActiveInverted`**：它在 `Menu.mjs`（L305）同时被赋给 `--n-item-text-color-child-active`（展开父项常态色）和 `--n-item-text-color-child-active-hover`，改了会让展开父项常态变蓝；因此展开父项 hover 文字保持白色，仅背景微亮（见「边界」）。

## 影响范围与边界

- 生效：所有 **inverted 菜单**（浅色主题 + `sider.inverted=true`）的垂直菜单——普通项、折叠态图标、子菜单项的 hover 均生效（变量作用于 `.n-menu` 根，不区分布局模式）。
- 不生效：暗色模式（`inverted=false`）行为不变；顶部横向菜单不涉及（其 hover 用 `-horizontal-inverted` 系列变量，未改）。
- 边界（实测确认）：展开中的父项（child-active）hover 时**背景微亮 + 文字保持 naive 原有白色**（其文字 hover 变量与常态共用，见上），图标/箭头同受此限制未单独处理；若后续要求完全一致，需另加一条 CSS 覆盖 `--n-item-text-color-child-active-hover`（内联变量需 `!important`）。

## 验证

- `pnpm typecheck` 0 error；`oxlint` 该文件 0 warning/0 error；`oxfmt --check` 格式正确。
- 浏览器实测（playwright-core + 本机 Chrome，dev server 9111 真实渲染 inverted `NMenu`，themeOverrides 取自项目 `getNaiveTheme()`）：
  - 变量：`--n-item-color-hover = rgba(255,255,255,0.12)`、`--n-item-text-color-hover = --n-item-icon-color-hover = --n-arrow-color-hover = #66a6ff`；选中态 `--n-item-color-active-hover = #3b82f6`、`--n-item-text-color-active-hover = #FFF` 保持原样。
  - 普通项「首页」：常态 背景透明 / 文字 `rgb(187,187,187)` → hover 背景 `rgba(255,255,255,0.12)` / 文字 `rgb(102,166,255)`。
  - 展开父项「系统管理」：hover 背景 `rgba(255,255,255,0.12)`、文字保持 `rgb(255,255,255)`。
  - 选中项「组别管理」：hover 前后均为蓝底 `rgb(59,130,246)` + 白字，未被破坏。
