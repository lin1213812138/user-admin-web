# 系统设置：顶层 tab 固定显示「系统设置」+ 页内 tab 切子模块

## 问题

点击左侧菜单「系统设置」后，顶部全局 tab（多标签栏）显示的是某个子模块名（如「录单格式」），而非「系统设置」。

根因：此前 `src/router/guard/route.ts` 把 `system-manage_setting` 重定向到第一个子路由 `system-manage_setting_input-format`，当前激活路由变成子路由，tab 标题即取子模块名。

## 用户诉求

「系统设置」应是一个菜单项，点开：

1. 顶部 tab 显示「系统设置」；
2. 页面内用 tab 切换各个子模块（录单格式 / 打印格式 / 导出格式 / 运单规则 / 通知配置 / 初始化数据 / 站点扫描）。

用户明确：子模块**不需要独立 URL**（不需要直达、刷新回到默认 tab 即可），这样实现最干净、也最贴合目标体验。

## 方案与决策

- 父路由 `system-manage_setting` 停留不跳转；`setting/index.vue` 由「`router-view` 渲染子路由」改为「本地 `activeKey` + `import` 子组件 + `<component :is>` 渲染」，`<keep-alive>` 保留子模块状态。
- `guard/route.ts` 删除「进入系统设置重定向到子路由」逻辑；新增防御：直接访问 `system-manage_setting_*` 子路由时 `replace` 回父路由（判断用 `startsWith('system-manage_setting_')`，父路由名不含末尾下划线不会误匹配）。
- 7 个子组件原样复用（已确认均无 `useRoute/useRouter` 依赖，纯本地状态驱动），路由表 / 菜单 / i18n 不变。

## 改动文件

- `src/views/system-manage/setting/index.vue`
- `src/router/guard/route.ts`

## 验证

- `pnpm typecheck` / `pnpm lint` / `pnpm fmt` 通过（lint 中 `Form/index.vue`、`link.vue` 的报错为历史遗留，与本次无关）。
- `pnpm build:test` 通过（首次失败是 WebStorm coding-copilot 插件的 safe-delete shim 干扰 vite 清空 dist 目录，清空 `$env:NODE_OPTIONS` 后通过）。

## 相关资料

- 设计文档：`docs/superpowers/specs/2026-09-03-system-setting-tab-design.md`
- 实现计划：`docs/superpowers/plans/2026-09-03-system-setting-tab.md`
