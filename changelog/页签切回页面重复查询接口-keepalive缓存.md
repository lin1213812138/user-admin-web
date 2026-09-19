# 页签切回页面重复查询接口（keep-alive 缓存）

## 现象

用户反馈「菜单栏没有缓存，每次切换路由都会重新查询」。澄清后确认为：**顶部标签页切走再切回，页面重新挂载、列表/详情接口重新请求**。附带现象：查询进行中切换路由像被「卡住」。

## 根因定位

- `src/layouts/modules/global-content/index.vue` 用 `<KeepAlive :include="routeStore.cacheRoutes">`，`cacheRoutes` 只在初始化时由 `handleConstantAndAuthRoutes()` 经 `getCacheRouteNames()` 收集 `meta.keepAlive === true` 的叶子路由。
- 原 `src/router/elegant/routes.ts` **仅 `iframe-page` 设了 `keepAlive: true`**，业务路由全部未开 → 不在缓存 → 切回时组件重新 `onMounted` → `useVxeTable` 重新 `getData()`，列表/详情接口重复请求。
- 「查询中切不走」**无硬拦截**：路由守卫无 `next(false)`/`onBeforeRouteLeave`（全局搜索 0 命中）；表格 `useLoading` 只盖 vxe-table 自身区域、非全屏遮罩；`App.vue` 无全局 loading。体感卡顿来自：目标页重新挂载后展示 spinner + `out-in` 离场过渡叠加。

## 决策（用户拍板）

- 全部**非 constant** 业务路由都开 `keepAlive`（登录/错误页本就不进业务流，天然排除）。
- 不改 `global-content` 的 `out-in` 过渡、不碰请求层（YAGNI）。

## 实施

- 单一数据源：`build/plugins/router.ts` 的 `onRouteMetaGen` 内，对 `!constantRoutes.includes(key)` 的路由 `meta.keepAlive = true`（`constantRoutes = ['login','403','404','500']`）。保留后续按 `noKeepAliveRoutes` 集合排除的扩展位（本次为空）。
- 删 `node_modules/.vite-temp` 后 `pnpm build` 触发优雅路由重生成：`routes.ts` 的 **7 个一级 + 17 个叶子业务路由**全部写入 `keepAlive: true`；`iframe-page` 维持原常量 + `keepAlive` 不变；`login/403/404/500` 正确排除。
- `routeStore.cacheRoutes` 自动收集；`global-content` 的 KeepAlive 自动纳入；页签各自 `:key="tabStore.getTabIdByRoute(route)"`，独立缓存。

## 数据新鲜度

- 列表/详情的编辑、新增抽屉 `submit` 回调本就调 `getData()` 刷新列表，不受 keep-alive 影响。
- 页签「刷新」按钮 → `appStore.reloadPage` → `routeStore.resetRouteCache()`，强制重挂载重查（已确认该函数存在）。
- 切走再切回看到的是上次数据（keep-alive 预期行为），需强刷新点刷新按钮。

## 验证

- `pnpm typecheck` 0 错误；`pnpm lint` 0 error（`src/components/common/link.vue` 2 个既有 warning，与本次无关）；`pnpm build` 通过。
- 手动：用户管理列表 → 切角色管理 → 切回用户管理，确认不转圈、筛选/滚动保留，切回瞬间网络面板无新列表请求。

## 注意

- 优雅路由生成器依赖 `onRouteMetaGen`；若再次改 `build/plugins/router.ts` 的 meta，须删 `node_modules/.vite-temp` 再跑 `pnpm dev`/`build` 才会写入新 `routes.ts`。
