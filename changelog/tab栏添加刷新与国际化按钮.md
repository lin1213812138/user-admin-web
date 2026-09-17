# tab 栏添加刷新与国际化按钮

> 2026-09-17 · 用户：截图红框标 tab 栏右侧按钮区「这里把刷新和国际化都加上」

## 现状

`src/layouts/modules/global-tab/index.vue`（tab 栏）右侧操作区此前只有 `ThemeSchemaSwitch`（深浅色）与 `ThemeButton`（主题配置）两个按钮——「刷新 / 全屏」在上一次改动中被整体注释下线（见 `changelog/刷新全屏按钮先注释.md`）。

## 需求确认（用户点认）

| 问题     | 用户选择                                            |
| -------- | --------------------------------------------------- |
| 按钮清单 | **只加刷新 + 国际化**（全屏按钮保持注释下线）       |
| 排列顺序 | **国际化 → 主题样式 → 主题配置 → 刷新**（用户补充） |

## 实施（仅改 global-tab/index.vue）

1. **script 解锁**：取消 `useAppStore` import 与 `const appStore` 的注释；`refresh()` 函数取消注释（`appStore.reloadPage(500)`），恢复刷新按钮依赖。
2. **模板**：
   - 原「刷新/全屏」合并注释块收窄为只保留全屏：`<!-- 全屏按钮继续下线，恢复时取消注释 -->`；
   - `ThemeSchemaSwitch` 前插入 `<LangSwitch>`（`:lang` / `:lang-options` / `@change-lang` 三绑定，取自原 global-header 用法）；
   - `ThemeButton` 后追加 `<ReloadButton :loading="!appStore.reloadFlag" @click="refresh" />`。
3. **组件来源**：`LangSwitch`（`components/common/lang-switch.vue`）、`ReloadButton`（`components/common/reload-button.vue`）均在自动注册目录，按同文件 `ThemeSchemaSwitch` 惯例不写 import。
4. 不加 `v-if="themeStore.header.multilingual.visible"`：header 已下线、该可见性开关无 UI 入口，按钮常显。
5. i18n 零改动：tooltip 复用 `icon.lang`（切换语言 / Switch Language）、`icon.reload`（刷新页面 / Reload Page）。

最终排列（页签区向右）：`LangSwitch` → `ThemeSchemaSwitch` → `ThemeButton` → `ReloadButton`。

## 验证

- `pnpm typecheck` exit 0；`read_lints` 0；
- 单文件 `npx oxfmt` 无额外改动（与手写格式一致）；
- playwright 连 dev（9111）实测：
  - 4 个按钮渲染与顺序正确，语言按钮 tooltip「切换语言」；
  - 语言下拉 [中文 / English] 切换后菜单、页签、文档标题联动（Home / Customer Management / …）；切回中文同样生效；
  - 点击刷新：MutationObserver 捕获内容区卸载（removed）→ 重挂载（readded），期间刷新图标 `animate-spin`，URL / 页签不变，控制台 0 errors。
