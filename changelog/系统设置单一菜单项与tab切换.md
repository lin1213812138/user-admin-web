# 系统设置：单一菜单项 + tab 切换

## 现状确认

「系统设置」在左侧菜单里是**单一菜单项（非目录）**，点击进入后在一个页面内用 tab 切换各子模块（录单格式 / 打印格式 / 导出格式 / 运单号规则 / 通知配置 / 初始化数据 / 站点扫描配置）。

实现要点：

- 各子模块是独立路由（`system-manage_setting_*`），但 `build/plugins/router.ts` 的 `onRouteMetaGen` 中 `hiddenRoutes` 数组统一声明了 `hideInMenu: true`，由 elegant 插件在 dev/build 时生成到 `src/router/elegant/routes.ts`（持久、不会被覆盖）。
- 菜单渲染 `getGlobalMenusByAuthRoutes`（`src/store/modules/route/shared.ts`）过滤掉所有 `hideInMenu` 子项后，父路由无可见子项 → 渲染为单项。
- `src/views/system-manage/setting/index.vue` 是 tab 容器：`NTabs` 切换 + `<router-view>`（keep-alive）渲染对应子路由。

## 本次调整

新增路由守卫（`src/router/guard/route.ts`）：点击「系统设置」（路由名 `system-manage_setting`）时重定向到第一个 tab「录单格式」(`system-manage_setting_input-format`)，与 tab 列表顺序一致。

原因：elegant 的 `transform.ts` 在父路由无显式 `redirect` 时会自动跳到 `children[0]`（按目录字母序为「导出格式」），导致默认进入的不是 tab 列表第一个。通过守卫修正默认落地 tab。
