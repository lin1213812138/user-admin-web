# tab 切换同步 URL（系统设置 ?tab=xxx 双向同步）

- 日期：2026-09-19
- 范围：`src/views/system-manage/setting/index.vue`、`src/views/data-manage/components/useArchiveTabs.ts`、`src/views/data-manage/components/types.ts`、`src/store/modules/tab/index.ts`
- 设计文档：`docs/superpowers/specs/2026-09-19-setting-tab-url-sync-design.md`

## 需求

用户贴系统设置页截图（红箭头指向地址栏 `?tab=print-format`）问「tab 切换这个能不能更新？」。

现状是**单向**同步：`setting/index.vue` 的 `syncTabFromQuery()`（setup + `onActivated`）只做 URL → tab，服务于标签设计器「返回」定位（见 `changelog/打印格式设计跳转标签设计器.md`，当时的备选 B「切分页写 URL」被搁置）；**点击左侧 tab 不会写回 URL**。要求：切 tab 时把 `?tab=xxx` 更新到地址栏，刷新/分享可定位当前分页。

## 决策（brainstorming，用户确认）

- **范围**：仅「系统设置」页开启；能力做成 `useArchiveTabs` 可选参数，资料管理 6 页行为不变（将来一行开启）。
- **历史策略**：`router.replace`（不新增浏览器历史，后退直接离开本页，而非退回上一个 tab）。
- 否决：方案 B（只在设置页写 watch，无法复用）；方案 C（`history.replaceState` 绕过 router，`route.query` 与路由状态脱节）。

## 实施

1. `types.ts` 新增 `ArchiveTabsOptions { urlSync?: boolean }`（默认 false）。
2. `useArchiveTabs.ts`：`urlSync` 开启时——
   - `syncFromQuery()`（URL → activeKey）：初始调用 + `watch(() => route.query.tab)`；带 `route.path !== selfPath` 守卫（keep-alive 缓存期间其他页面的 query 变化不误伤本页）；无效/无权限的 tab 值忽略。
   - `watch(activeKey)` → `syncToQuery()`：`router.replace({ path, query: { ...route.query, tab } })`；写 URL 前用 `router.resolve` 算出 fullPath 并 `tabStore.setTabFullPath(getTabIdByRoute(route), fullPath)`。
   - 两个 watch 均以「值相等即 return」防循环（replace 后反向 watch 触发时值已一致）。
3. `tab/index.ts` 新增 action `setTabFullPath(tabId, fullPath)`：必须改源数组 `tabs.value` —— 对外暴露的 `tabs` 是 `allTabs` computed，`updateTabsLabel` 每次浅拷贝，改 computed 结果不生效。
4. `setting/index.vue`：`useArchiveTabs([...], { urlSync: true })`；删除 `useRoute` / `onActivated` / `syncTabFromQuery`（三条路径由 hook 覆盖：首次挂载 setup 调用、导航变化 watch、keep-alive 激活由全局 `route` watch 覆盖，watcher 在 deactivated 时仍生效）。

## 为什么必须同步全局页签 fullPath（配套必要项）

`addTab` 只在页签不存在时 push，已有页签的 `fullPath` 不随 query 更新（该路由未开 `multiTab`，`getTabIdByRoute` 返回 id = path）。不同步则：从设计器返回（页签 fullPath 带 `?tab=print-format`）→ 页内切到「基础配置」→ 去别的页签 → 点回「系统设置」→ `switchRouteByTab(tab.fullPath)` 跳旧 query → 被 `syncFromQuery` 强制切回打印格式，丢失最后所在分页。同步后点页签回来 = 恢复到最后所在分页。

## 边界与已知现象

- 无效/无权限 `?tab=`：忽略，保持默认分页，不纠正 URL。
- 直接进入裸地址不主动补 `?tab=basic-config`（仅用户切 tab 时写）。
- `replace` 触发一次同路由导航：守卫链路轻量；NProgress 可能一闪；全局页签 `watch(route.fullPath)` 会调 `addTab`，因 id 不含 query 不会新增页签。
- 布局层缓存 key 是 `tabStore.getTabIdByRoute(route)`（非 multiTab 即 path，不含 query）→ replace 不会重挂载页面、不丢状态。
- `VerticalTabLayout` 的 `contentDelay`（~200ms）令 URL 更新滞后于点击动作。

## 验证

- `pnpm typecheck` exit 0。
- 4 个改动文件 `oxfmt` + `oxlint --fix`（0 warnings / 0 errors）+ `eslint --fix`（0 error；3 个 `.ts` 报 “File ignored because no matching configuration” 属 eslint 配置既有现象）。
- 浏览器手测（切 tab URL 跟随 / 刷新停留当前分页 / 设计器返回定位 / 顶部页签切回定位）待用户复核。
