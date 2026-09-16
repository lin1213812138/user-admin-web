# MEMORY

> 跨会话长期记忆，按主题分组。详细过程见同目录日报 `YYYY-MM-DD.md`。

## 语言与流程（最高优先级）

- 所有输出一律中文（设计文档、讨论记录、代码注释、commit 说明），覆盖 AGENTS.md「注释用英文 JSDoc」；库 API / 变量名 / 技术名词保留英文。
- 任何代码改动前先 `brainstorming` 出设计并经用户确认（AGENTS.md 规则 2），**确认前不写代码、不建文件**；讨论记录写 `changelog/<取自用户提示词>.md` 并追加条目到 `AGENTS_CHANGELOG.md`（规则 1）。
- 只改用户明确要求的代码；不擅自回退用户已认可方案；不手改自动生成文件（elegant-router、components.d.ts、elegant-router.d.ts）除非是删除源组件导致的悬空引用、且下次 `pnpm dev` 会覆盖。
- 用户发「截图 A vs 截图 B，要 B 这种效果」时：先逐元素列出差异清单让用户点认，再出设计；本次两轮误判在工具栏（按钮/勾选列/删除），实际用户指的是布局层（tab 与表格分属两张卡片）。用户说"跟 X 没关系"= 否定我归纳的差异维度，须回头重新定位元素，不要继续在 X 上加码。
- UI 文案偏好：新增类按钮统一叫「新增」，不要用原型里的「添加一行」（2026-09-15 定）；`common.add` = 新增 / Add，可直接复用。

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
- elegant-router 合并 meta 行为：**对已存在的 `meta` 字段采用「旧值优先」**（旧 `routes.ts` 的值被保留，改 `routeIcons`/`routeOrders` 不会覆盖已有条目），只有**新增路由缺失**的字段才按配置补上。实证：把 `routeOrders.data-manage` 改成 2，重生成后它仍保留旧 `order: 1`。故要改**已有**路由的 icon/order，不能只改配置 —— 必须先把 `routes.ts` 对应条目删掉 + 清 `.vite-temp` + 重生成，否则旧值保留、配置不生效。
- naive `NUpload` 在 `default-upload=false` 时**不给文件生成 url**（选择后是 `{status:'pending', url:null, thumbnailUrl:null}`，源码 `Upload.mjs:442-453`），而 image-card 缩略图与预览按钮要求 `status==='finished'` 且 `mergedThumbnailUrl` 非空（`UploadFile.mjs:117-129/282`）→ 本地选择要预览必须自行 `URL.createObjectURL(file.file)`。`FormWrap`（`components/Form/index.vue`）已在 `handleUploadChange` 处理（blob 记入 `uploadPreview`、换图 revoke、卸载兜底回收），所有 image/file 字段天然可用。

## vxe 表格滚动条机制（2026-09-16）

- 横向滚动条「不需要滚动也显示」的真因：handle 恒有 16px 伪溢出 —— vxe JS 内联轨道宽 `el.clientWidth − osbWidth` 扣掉 8px 纵向滚动条宽（本项目纵向滚动条已浮动不占布局、主区是容器满宽）+ handle 自身 `scrollbar-width: thin` 占位 8px，而填充 `--scroll-x-space` 宽 = `scrollXWidth` = 容器满宽 → 可视内容区恒少 16px（滑块长度≈98%）。
- 修复：`plugins/vxe-table.ts` 的 `measureScrollbarSize()`（离屏探针实测 thin 占位 → `:root --x-scrollbar-size`）；`styles/css/scrollbar.css` 三条覆盖：`.vxe-table--scroll-x-virtual` / `--scroll-x-wrapper` 补 `width:100%!important`、`--scroll-x-handle` 用 `width: calc(100% + var(--x-scrollbar-size, 8px))!important`。
- vxe `calcScrollbar()` 的 `x.visible` 只识别 `'visible'/'hidden'/false`，**布尔 `true` = 自动判定**（浮出与否仍由 `overflowX = scrollXWidth > 主区 clientWidth` 决定）；`scrollbarConfig.width: 0` 是 falsy，vxe 会回退实测 handle 厚度（≈8px）而非 0。
- 浮动化后 `.vxe-table--scroll-x-virtual`（absolute 无 width、子元素又全是 absolute）宽度会塌成 0，任何依赖 `width: 100%` 的子级都必须先补这一层宽度。
- vxe 给两条 handle 设的是 `overflow-x/y: scroll`（强制渲染滚动条），**没有滑块时浏览器仍会画出轨道端点**（hover 时表现为滚动条层两端的小色块）→ 已覆盖为 `overflow: auto`（溢出才渲染）。`--scroll-x-space` 的内联宽度 = `scrollXWidth`，可直接用它判断「表格是否真的横向溢出」（等于表格实际宽度即无溢出）。

## 系统设置（setting）模块结构

- 页面壳 `views/system-manage/setting/index.vue`：顶层 segment tabs（录单格式/打印格式/导出格式/运单规则/轨迹抓取配置/初始化数据），各子模块放 `setting/modules/<kebab>/`，支持 `?tab=` query 切子页。
- 通用左右布局组件 `setting/components/MasterDetail.vue`：左列表 NCard + 右内容 NCard（content padding 0 + flex column）→ 内层 `px-16px py-16px` 容器；初始化数据 `init-data/InitData.vue` 用它。
- 初始化数据「基本信息」`BasicInfoForm.vue`（NFormWrap、DEV 无接口、保存仅本地提示）：公司 LOGO 用 FormWrap `type: 'image'` 上传控件（本地选择即 blob 预览、`model` 存文件名，后端就绪后统一接真实上传，与用户管理微信二维码同款）；滚动区用 `NScrollbar` + 内容 `pr-16px`。
- 轨迹抓取配置 `trace-capture/TraceCapture.vue`：**单卡片 + 全高 NTabs**，tab 栏与表格同处一张卡片、无灰缝；`configTabs`（key 类型即 `TraceCaptureCategory`）循环内按 key 分支——**「轨迹改造」「轨迹关键词」已各自独立**（`TraceTransformTable` / `TraceKeywordTable` + 各自 Drawer），其余 2 页（追踪网络 / 抓取时间）共用 `TraceConfigTable`，操作轨迹独立 pane 用 `OperationTraceTable`；全高 CSS 三件套（flex column / pane-wrapper flex:1 / n-tab-pane height:100%）照搬 `InitData.vue`。
- 「轨迹改造」字段（2026-09-15 定稿，从同构组拆出）：状态名称（必填）/ 时间格式（下拉枚举 `'ymd' | 'ymd-hm' | 'ymd-hms'`，**存枚举 key、i18n `timeFormatOption` 展示**）/ 服务地点（空值显示 `--`）/ 详细描述 / 抓取轨迹关键词判断定义（自由文本、中文逗号分隔）；「排序」= `show-seq` 自动序号（不落库、不可编辑）；交互=工具栏「添加一行」+ 抽屉表单 + 行内编辑/删除（`NPopconfirm`，无勾选列/批量删除）；类型 `TraceTransformTimeFormat/TraceTransformItem...`、mock `traceTransformItems` 8 条异常状态、service 4 个 `fetch*TraceTransform`（PROD `/system/trace-transform/*`）。
- 「轨迹关键词」字段（2026-09-15 定稿）：规则名称（必填）/ 使用范围（枚举 `'global' | 'site' | 'customer'`，i18n `scopeOption`）/ 关键词组（必填自由文本、中文逗号分隔）/ 运单状态（枚举 `'in-transit' | 'delivered' | 'exception' | 'returned'`，i18n `waybillStatusOption`）/ 启用状态（`EnableStatus` 1·0：表格 NTag、表单 switch 默认 1）/ 最后编辑 + 编辑时间（审计字段，mock create/update 自动填）；组件 `TraceKeywordTable/Drawer`、类型 `TraceKeyword*`、mock `traceKeywordItems` 2 条、service `fetch*TraceKeyword`（PROD `/system/trace-keyword/*`）；操作列=编辑+删除（NPopconfirm）。
- 「抓取时间」子 tab（`capture-time`）**2026-09-15 起临时隐藏**（字段待定，用户："抓取时间模块先注释一下"）：`TraceCapture.vue` 的 `configTabs` 中该项被注释；类型 `TraceCaptureCategory`/`SubTabKey`、i18n 文案、mock 数据全部保留，恢复=取消该行注释。

## 独立列表页范式（不套 MasterDataArchive）

- 当页面是「普通 CRUD 列表页」且用户要求不套 `MasterDataArchive` 通用归档组件时，每个 `views/<模块>/<页面>/index.vue` 自包含实现：直接用 `Table` + `useVxeTable` + `Drawer` + `NFormWrap`，逻辑各自独立（不抽共享 composable）。
- service 函数 `request` 分支必须 `as unknown as Promise<T>` 强转（匹配 `useVxeTable` 的 api 返回类型，避免与 FlatResponseData 联合冲突）；DEV mock 分支同样 `as unknown as`。
- 视图内 `searchItems`/`formItems` 用 `computed<FormItemConfig[]>` 注解（否则 `type:'input'` 推宽为 `string` 导致 FormItemConfig 不兼容）；`statusOptions` 显式 `SelectOption[]`。
- 模板 `#action` 插槽里的 `row` 是 `any`，直接 `openDrawer('edit', row)` / `row.id`，避免 `row as Api.X` 触发 eslint `vue/no-undef-properties` 误报 Api 未定义。
