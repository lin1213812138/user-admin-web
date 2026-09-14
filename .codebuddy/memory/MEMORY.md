# MEMORY

> 跨会话长期记忆，按主题分组。详细过程见同目录日报 `YYYY-MM-DD.md`。

## 语言与流程（最高优先级）

- 所有输出一律中文（设计文档、讨论记录、代码注释、commit 说明），覆盖 AGENTS.md「注释用英文 JSDoc」；库 API / 变量名 / 技术名词保留英文。
- 任何代码改动前先 `brainstorming` 出设计并经用户确认（AGENTS.md 规则 2），**确认前不写代码、不建文件**；讨论记录写 `changelog/<取自用户提示词>.md` 并追加条目到 `AGENTS_CHANGELOG.md`（规则 1）。
- 只改用户明确要求的代码；不擅自回退用户已认可方案；不手改自动生成文件（elegant-router、components.d.ts、elegant-router.d.ts）除非是删除源组件导致的悬空引用、且下次 `pnpm dev` 会覆盖。

## 数据管理归档组件范式

- 资料管理（`data-manage`）下 basic / finance / business 三个页均为「单页 + 左侧 `ArchiveSwitch` 页内切换子模块」，**子模块不是路由**。
- 每个子模块 = `MasterDataArchive` 组件 + `ArchiveConfig<T>` 配置（archive key 对应 mock / 后端实体；cacheKey 给 useVxeTable 持久化列）。
- 新增归档：建 `components/MasterData/archives/<group>/<key>/index.vue` → 在 `views/.../<group>/index.vue` 的 `items` 增一项 → 补 `DataManageArchiveKey` 联合类型 + 实体接口（`typings/api/data-manage.d.ts`）→ `mock-data-manage.ts` 工厂 → zh-cn/en-us + `typings/app.d.ts` i18n 类型 → 若组件在 components 目录被自动注册，删/改名后同步 `typings/components.d.ts`（下次 dev 重生成）。

## 财务资料子模块（2026-09-14 调整）

- 4 个子模块按序：**费用类型 `expense-type`**（code+name+状态+备注）/ **结算方式 `settlement`**（name+period）/ **银行账户 `account`**（code+name+accountType+bank+balance）/ **结算币种及汇率 `currency`**（code+name+rate+symbol）。
- 由旧的「税率 tax」替换为「费用类型 expense-type」；account 标题由「结算账户」改「银行账户」、currency 标题由「币种」改「结算币种及汇率」。
- 按钮权限 `dataFinance`（`routePath: /data-manage/finance`）整页共用，不按子模块拆分。

## 工具链 / 环境

- 只用 pnpm；WebStorm `node-safe-delete-shim` 拦截 vite rm / pnpm install → PowerShell 先 `$env:NODE_OPTIONS=""`。
- **本仓库 `git mv` 在 Windows/PowerShell 下报 `ENOENT`（源文件明明存在却说找不到）**：移动目录改用 `Move-Item` + `git add -A`，git 会识别为 `R`（重命名）并保留历史；`New-Item -ItemType Directory` 先建目标父目录。
- 同一文件多处编辑必须串行，不同文件可并行。
- `pnpm gen-route` 不可用（交互式新建路由向导）；重新生成用 `pnpm dev`（先删 `node_modules/.vite-temp`）。
- elegant-router 生成路由的坑：`zh-cn/en-us` 的 `route` 段新增 key 须在路由生成后补（否则 `route: Record<I18nRouteKey,string>` 字面量 excess property 报错，生成后即合法）；`pnpm dev` 后台生成若在 elegant 写 `routes.ts` 途中 `Stop-Process`，文件末尾会被截断（残留 `nMenuRoute(route));`）。`build`/`dev` 重新生成前会先用 babel/recast 解析旧 `routes.ts`，**若旧文件残缺则解析失败、生成直接中止**（报 `Missing semicolon (266:17)` 等），此时须先手修残缺行使语法合法，再 `pnpm build` 让 elegant 重新生成完整文件覆盖（修复后会被覆盖，属损坏修复例外）。
