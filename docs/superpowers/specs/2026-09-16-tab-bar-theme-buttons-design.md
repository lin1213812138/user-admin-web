# 标签栏右侧新增主题模式切换与主题配置入口 — 设计

- **日期**：2026-09-16
- **状态**：已确认（用户对方案 A 回复「可以」）

## 背景

本仓库 header 栏已整体下线（`base-layout/index.vue` `header-visible="false"`，`GlobalHeader` / `ThemeDrawer` 被注释），主题相关入口随之消失。用户要求把「主题设置与主题配置」放到标签栏右侧操作区（刷新 / 全屏按钮旁）。

经澄清确认：放置**两个按钮**——

1. 主题模式切换（浅色 / 深色 / 跟随系统三态循环，即原 header 上的太阳/月亮图标）；
2. 主题配置抽屉入口（打开完整主题抽屉：外观 / 布局 / 通用 / 预设）。

## 现状

| 组件                | 位置                                                            | 注册方式                                        |
| ------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| `ThemeSchemaSwitch` | `src/components/common/theme-schema-switch.vue`                 | components 自动注册，直接用标签                 |
| `ThemeButton`       | `src/layouts/modules/global-header/components/theme-button.vue` | layout 局部组件，需显式 import                  |
| `ThemeDrawer`       | `src/layouts/modules/theme-drawer/index.vue`                    | 完好未渲染，`appStore.openThemeDrawer` 状态仍在 |
| 右侧操作区          | `global-tab/index.vue` 末尾 `ReloadButton` + `FullScreen`       | 同为全局自动注册                                |

## 方案对比

- **A（采纳）**：global-tab 右侧直接追加两个按钮，`ThemeButton` 跨目录 import 复用；恢复 `ThemeDrawer`。零新文件。
- B：theme-button.vue 移入 `src/components/common/` 转全局注册——需移动文件，收益仅一行 import，否决。
- C：global-tab 内联重写 ButtonIcon——与 theme-button.vue 逻辑重复，将来恢复 header 时两处维护，否决。

## 改动清单（2 个文件）

1. `src/layouts/modules/global-tab/index.vue`
   - script 增 `import ThemeButton from '../global-header/components/theme-button.vue';`
   - 模板右侧操作区变为：刷新 → 全屏 → `ThemeSchemaSwitch`（`:theme-schema` + `@switch="themeStore.toggleThemeScheme"`）→ `ThemeButton`（工具类在左、主题类在右）。
2. `src/layouts/base-layout/index.vue`
   - 取消 `ThemeDrawer` import 与 `<ThemeDrawer />` 两处注释，注释文案同步更新（入口已移至标签栏右侧）。

## 不改项

- 刷新 / 全屏按钮保留原样；header 相关注释代码块不动（`GlobalHeader` 仍下线）。
- 不新增 i18n（tooltip 复用 `icon.themeSchema`「主题模式」/ `icon.themeConfig`「主题配置」）。
- 不动 theme-drawer 内部 4 个 tab 与 ConfigOperation。

## 交互细节

- 两按钮均为 `ButtonIcon`，与刷新/全屏同尺寸同 hover；tooltip 朝下（`fixedHeaderAndTab` 开启，tab 栏固定顶部）。
- `ThemeSchemaSwitch` 点击循环 `light → dark → auto`；`ThemeButton` 点击 `appStore.openThemeDrawer`。

## 验证

- `pnpm typecheck` 0 错误；read_lints 无诊断。
- 浏览器效果（按钮渲染、抽屉打开、模式切换）待用户复核。
