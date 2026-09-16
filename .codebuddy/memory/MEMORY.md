# MEMORY

> 跨会话长期记忆，按主题分组。详细过程见同目录日报 `YYYY-MM-DD.md`。

## 语言与流程（最高优先级）

- 所有输出一律中文（设计文档、讨论记录、代码注释、commit 说明），覆盖 AGENTS.md「注释用英文 JSDoc」；库 API / 变量名 / 技术名词保留英文。
- 任何代码改动前先 `brainstorming` 出设计并经用户确认（AGENTS.md 规则 2），**确认前不写代码、不建文件**；讨论记录写 `changelog/<取自用户提示词>.md` 并追加条目到 `AGENTS_CHANGELOG.md`（规则 1）。
- 只改用户明确要求的代码；不擅自回退用户已认可方案；不手改自动生成文件（elegant-router、components.d.ts、elegant-router.d.ts）除非是删除源组件导致的悬空引用、且下次 `pnpm dev` 会覆盖。
- 「截图 A vs B 要 B」类需求：先逐元素列差异清单让用户点认再出设计；用户说"跟 X 没关系"= 否定该差异维度，须重新定位元素。
- UI 文案：新增类按钮统一叫「新增」（`common.add` = 新增 / Add）。

## 布局结构（2026-09-16 起）

- **顶部 header 已下线**：`base-layout/index.vue` 给 AdminLayout 传 `:header-visible="false"`，GlobalHeader/ThemeDrawer 导入、`#header` 插槽、headerProps 均**注释保留**（用户要求不删文件）；`global-header/`、`global-search/`、`global-breadcrumb/`、`theme-drawer/` 文件全在（前两者成死代码）。恢复=取消 base-layout 注释 + 删掉 header-visible。
- **用户区在侧栏底部**：`global-sider/index.vue` 菜单挂载点下 56px 用户区，跨目录复用 `global-header/components/user-avatar.vue`（未迁移）；下拉 placement=top、用户名随 siderCollapse 隐藏。
- 侧栏固定展开（折叠按钮已下线），tab 栏顶格；**占位栏高 50px**（`src/theme/settings.ts` `tab.height`，2026-09-16 由 44 调高）、**chrome 页签本体高 48px**（`global-tab/index.vue` `<PageTab class="h-48px">` fallthrough 到 chrome-tab 根 div；页签默认仅约 36px=内容+py-6px 撑开，不随占位栏变高；背景 SVG h-full 任意高度拉伸不变形；改页签高度就在 PageTab 透传 class，勿动 packages）。**主题入口在 tab 栏右侧**（2026-09-16 恢复）：`global-tab` 右侧操作区=刷新→全屏→`ThemeSchemaSwitch`（自动注册）→`ThemeButton`（跨目录 import），`base-layout` 已恢复渲染 `ThemeDrawer`。

## 侧栏菜单结构（2026-09-16 起最终态）

- 一级：首页 0 / 渠道报价 1 / 资料管理 1 / **系统管理 2 / 权限管理 3 / 客户管理 4**（router.ts 一级 order 与生成文件历史生效值对齐，修复了两者不一致的历史遗留）。
- 系统管理二级：用户 1 / 角色 2 / 分组 3 / 站点 4 / 系统设置 5 / 系统日志 6（+隐藏 label-designer、print-design）；权限管理只剩菜单管理（1）；客户管理=一级 catalog，页面 `views/customer-manage/customer/` 文案「客户列表」（1）。用户/角色已从权限管理移回系统管理（2026-09-14 那次迁到 permission-manage 被本次迁回）。
- **elegant 重生成实操（dev 常驻时）**：改 `build/plugins/router.ts`（routeIcons/routeOrders 集中维护）→ Move-Item 目录（dev watcher 自动重生成；新条目 meta 直接取 router.ts 值）→ 已有条目的旧值须手动删 routes.ts 条目，等下一次 views 变化触发重生成时按 router.ts 重建；New-Item+Move-Item 的新一级目录可能不被 watcher 接住，touch 该目录下文件即可补齐；i18n route 段必须等路由生成后补（I18nRouteKey 派生顺序）。
- 系统日志页 `views/system-manage/log/`：接真实 `POST /op-log/query`（tms-user queryCommon：page/size/startDate/endDate/keyword/where，keyword 只匹配 refNames，默认近 12 个月，ret:{list,total}）；OpLog 字段 client(0-TMS 1-PC 2-PDA 3-OMS)/opType(0-登录 1-修改 2-删除 3-退出)/logs 变更明细/毫秒 createDate；where 仅 opType/client 非空时传；**搜索区走 Table #search-action 自定义卡片**（SearchBar 不透传自定义 slot、dateRange 非原生控件）；无 mock 分支；cacheKey `system-manage-log`。

## Table 组件插槽与搜索栏（2026-09-16 起）

- `Table` 新增 `search-action` 具名插槽（2026-09-16，用户需求）：渲染在模板**最顶部、SearchBar 区块之前**，`v-if="$slots['search-action']"` 判空、slot props 暴露 `refresh`；内容由业务完全自定义（输入框/下拉/按钮/容器样式），Table 不加默认卡片、不生成默认按钮。
- 与 `searchItems`/`SearchBar`（可折叠完整搜索）互不依赖、可并存（插槽在上）；**页面想用自己的快速搜索栏：不传 `searchItems` 即彻底不出现默认搜索/重置按钮**（这是隐藏默认搜索按钮的既定做法）。
- search-action 区域默认包 `NCard :bordered="false" class="shadow-sm"` + `content-style: 12px 16px`（2026-09-16 用户确认）：阴影 shadow-sm；**故意不用 `card-wrapper`**——其 shortcut `rd-8px` 会写死圆角、覆盖主题圆角。全局圆角链路：`themeRadius`（settings.ts）→ `theme/shared.ts` naive `common.borderRadius` → NCard `var(--n-border-radius)`。card-wrapper 全项目均未跟随主题圆角（统一改 shortcut 未做）。
- **默认分页 50**（2026-09-16 用户确认）：`useVxeTable` 全局兜底 `?? 50` 是唯一控制点（17 处页面显式 `defaultPageSize: 20` 已删，页面想覆盖再显式传）；Table 分页条 `page-sizes=[50,100,200,500,1000,2000,5000]` 与兜底首项对齐；分页 size 不持久化（列配置才缓存）。

## 数据管理归档范式

- `data-manage` 下 basic/finance/business 三页 =「单页 + 左侧 `ArchiveSwitch` 页内切换子模块」（子模块非路由）；每个子模块 = `MasterDataArchive` 组件 + `ArchiveConfig<T>` 配置。
- 新增归档 SOP：建 `components/MasterData/archives/<group>/<key>/index.vue` → `views/.../<group>/index.vue` 的 `items` 增项 → 补 `DataManageArchiveKey` + 实体接口（`typings/api/data-manage.d.ts`）→ mock 工厂 → i18n 三处（zh-cn/en-us/`app.d.ts`）。
- 财务子模块 4 个（2026-09-14 定）：费用类型 `expense-type` / 结算方式 `settlement` / 银行账户 `account` / 结算币种及汇率 `currency`；按钮权限 `dataFinance` 整页共用。

## 系统设置（setting）模块

- 壳 `views/system-manage/setting/index.vue`：顶层 segment tabs，子模块在 `setting/modules/<kebab>/`，支持 `?tab=` 切换；左右布局组件 `setting/components/MasterDetail.vue`。
- 轨迹抓取配置 `trace-capture/TraceCapture.vue`：单卡片 + 全高 NTabs；「轨迹改造」「轨迹关键词」已独立成 `TraceTransformTable`/`TraceKeywordTable` + Drawer，追踪网络/抓取时间共用 `TraceConfigTable`，操作轨迹用 `OperationTraceTable`；全高 CSS 三件套照搬 `InitData.vue`。
- 「抓取时间」子 tab 2026-09-15 起临时隐藏（`configTabs` 该行被注释），类型/i18n/mock 全保留，恢复=取消注释。

## 真实接口接入范式（站点管理为首个范例）

- **`request` 是 `createFlatRequest`**，返回 `{ data, error, response }` 扁平结构。接真实接口：api 闭包内解包 `{ data, error }`，`error || !data` 返回空列表，成功返回 data；`transform` 按后端 ret 实际字段写。
- 接入 SOP：类型五件套对齐后端字段 → service 去 DEV mock 分支 → mock.ts 只删本模块（被依赖数据源降级为最小 fixture）→ 页面重写（`useVxeTable` 分页 `current/size` vs 后端 `page/size` 在 api 闭包映射；字段大改时 cacheKey 加版本后缀；时间戳 dayjs 格式化）→ 所有外部调用点连带适配 → i18n 三处 → oxlint `no-underscore-dangle` allow `["_id"]`（已加）。
- wms-user 站点接口：`POST /site/query`（body `{page,size,keyword,...}` 返回 `ret:{list,total}`）、`/site/create|update|get|delete`；实体 `_id:string` 主键、siteType 0-分公司 1-总公司、毫秒时间戳、无 status。
- 站点业务规则：新增固定 `siteType:0`；总公司禁止编辑/删除（按钮 disabled，批量删除经 `deletableRows` 过滤）。
- 过渡期失配：组别/用户仍 mock，`siteId:number` vs 站点 `_id:string`，待接入时统一。

## 独立列表页范式（不套 MasterDataArchive）

- `views/<模块>/<页面>/index.vue` 自包含：`Table` + `useVxeTable` + `Drawer` + `NFormWrap`，逻辑各自独立不抽 composable。
- service 的 `request`/mock 分支都要 `as unknown as Promise<T>` 强转。
- `searchItems`/`formItems` 用 `computed<FormItemConfig[]>` 注解；`statusOptions` 显式 `SelectOption[]`；`#action` 插槽 `row` 是 `any`，直接 `row.id` 不要强转。

## 工具链 / 环境

- 只用 pnpm；WebStorm `node-safe-delete-shim` 拦截 → PowerShell 先 `$env:NODE_OPTIONS=""`。
- **本仓库 `git mv` 在 Windows/PowerShell 报 `ENOENT`**：用 `Move-Item` + `git add -A`（git 识别为 R 保留历史）。
- 同一文件多处编辑串行，不同文件可并行。
- `pnpm gen-route` 是交互式向导不可用；重新生成路由用 `pnpm dev`（先删 `node_modules/.vite-temp`）。
- elegant-router 坑：① i18n `route` 段新 key 须在路由生成后补（否则 excess property 报错）；② dev 途中 Stop-Process 会截断 `routes.ts` 末尾，残缺文件导致下次 build/dev 解析失败（`Missing semicolon`），须先手修语法再重生成；③ **meta 合并「旧值优先」**，改已有路由的 icon/order 必须删 `routes.ts` 对应条目 + 清 `.vite-temp` + 重生成。
- naive `NUpload` `default-upload=false` 不生成 url，本地预览须自行 `URL.createObjectURL`；`FormWrap` 已处理（blob 预览、revoke、卸载回收），image/file 字段天然可用。
- **dev 启动自动同步 IP**（2026-09-16）：`pnpm dev` 前先跑 `scripts/update-env-ip.mjs`——把 `.env.test` `VITE_SERVICE_BASE_URL` 主机段换成本机局域网 IPv4（排除 WSL/VMware 等虚拟网卡，私网段优先 192.168>10>172.16-31；只替换主机段保留端口路径；IP 未变不写文件；失败只警告不阻断）。只挂 dev，不挂 build:test/dev:prod；后端 IP 固定部署后此机制可退役。
- execute_command 陷阱：分号串联多条 node 命令只执行首条（isWatchCommand 误判提前收包），多命令须用 `&&` 串联。

## vxe 表格横向滚动条（2026-09-16）

- 「不需要滚动也显示」真因：handle 恒有 16px 伪溢出（JS 内联轨道宽扣 8px 纵向滚动条 + handle `scrollbar-width: thin` 占位 8px）。
- 修复：`plugins/vxe-table.ts` `measureScrollbarSize()` 实测写入 `:root --x-scrollbar-size`；`styles/css/scrollbar.css` 三条覆盖（`--scroll-x-virtual`/`--scroll-x-wrapper` 补 `width:100%!important`、`--scroll-x-handle` 用 `calc(100% + var(--x-scrollbar-size,8px))!important`、handle `overflow: auto`）。
- vxe `x.visible` 布尔 `true` = 自动判定；`width:0` falsy 回退实测厚度。浮动化后 absolute 容器宽度塌 0，依赖 `width:100%` 的子级须先补宽。`--scroll-x-space` 内联宽 = `scrollXWidth`，可判断是否真横向溢出。
