# MEMORY

> 跨会话长期记忆（2026-09-17 第五次精简，过程细节见同目录日报与 `changelog/`）。

## 铁律

- 中文输出（设计/记录/注释/commit），库 API 与变量名英文。
- 新功能/Bug 修复必须先 `brainstorming` 出设计并等用户确认；确认前不写代码、不建/移/删文件；每次讨论写 `changelog/<取自提示词>.md` 并追加 `AGENTS_CHANGELOG.md`（索引按日期最新在上）。
- 只改明确要求的代码；不擅动业务文件；不手改 `src/router/elegant/**`、`typings/components.d.ts` 等生成文件。
- 「截图 A vs B 要 B」先列差异清单点认；「跟 X 没关系」= 否定该维度重新定位；新增按钮文案统一「新增」。

## 布局与菜单

- header 下线；侧栏固定展开，用户区侧栏底部 56px；深色侧栏 hover 覆盖 5 条 naive 变量（内联须 `!important`）；tab 栏 50px/页签 48px，右侧 LangSwitch → ThemeSchemaSwitch → ThemeButton → ReloadButton。
- 菜单一级：首页/渠道报价/资料管理/系统管理/权限管理/客户管理；系统管理二级：用户/角色/分组/站点/系统设置/系统日志（隐藏 label-designer、print-design）。
- 贴边页：`base-layout/index.vue` 的 `contentShowPadding` 排除 `system-manage_print-design`、`system-manage_setting`、`personal-center`、`data-manage_{basic,business,finance,no-rule}`；新页加数组，勿页面内 important；固定底栏贴底 `-mb-16px`。
- elegant-router：配置改 `build/plugins/router.ts`（routeIcons/routeOrders/hideInMenuRoutes）→ 删旧条目+`Move-Item`+dev 重生成；meta 合并「旧值优先」；只扫 `src/views` 下 `**/index.vue`、`**/[*].vue`（排除 components/）⇒ 私有组件勿叫 index.vue、纯分组目录不放 index.vue。

## 通用组件

- **RelationModal**（`components/common/relation-modal.vue`）：通用「关联列表查看」弹窗=NModal(preset card 默认 720px)+通用 Table+useVxeTable；Props `show`(v-model)/`title`/`fetcher({page,size})=>{list,total}`/`columns`/`width`/`bodyHeight`(480)；不感知过滤条件（siteId 等由调用方闭包绑定）；immediate:false、每次打开回第一页重取、defaultPageSize 20、不传 cacheKey；**columns 仅 setup 求值一次 ⇒ 不同列结构要挂多个实例**；首个落地=站点管理关联用户/客户。
- **VerticalTabLayout**：`v-model:value` + `tabs:{value,label}[]` + `title?`；左标题+贴边竖 NTabs（外包 div 挡 `.n-tabs` width:100%，`:deep(.n-tabs-nav){width:100%}`）；右侧插槽自带 `min-w-0 flex-1 overflow-hidden p-16px`；显式 import；切 tab 不自动取数。
- **Upload**：`v-model:value`(max=1 string / >1 string[]) + `dest` + `list-type`(image-card|file|dragger) + max/accept/max-size/directory-dnd/disabled；pending/failed 不写 v-model；max=1 替换=先删后传；删除仅前端解绑；NUploadDragger 须默认插槽首子节点；image-card 不传默认插槽；max>1 须 `:multiple`；`fetchUpload(file,dest,onProgress?)`。
- **FormWrap**：`slot` 字段=操作区按钮（不入网格/不校验）；自定义单元格只能 `type:'custom'`（插槽名=key）；禁搜索显式 `filterable:false`；自定义 rules 覆盖自动 required。
- **Table**：`search-action` 插槽最顶部默认包 NCard（父容器无 16px 内边距传 `searchActionFlush=false`）；默认分页 50、page-sizes [50…5000]；列配置存裸 `localStorage['vxe-table-column:<cacheKey>']`，默认列增删必须升 cacheKey；columns 支持 `headerSlot`。
- **vxe 行状态**：expandRowKeys/checkbox reserve 必须配 `row-config.keyField`；`components/Table` 的 rowConfig prop 默认 undefined，业务传 `{keyField:'id'}`；勿再手动 setTreeExpand。
- **Drawer**：show/title/width(420)/footer/loading/confirmText/cancelText/closeOnMask + @submit。
- 禁忌：页面内不套 KeepAlive（vuejs/core#11775）；`views/**/index.vue` 模板顶层禁止 HTML 注释（多根 Fragment 卡死 Transition，注释写根节点内部）。
- naive：`.n-card`/`.n-tabs` 自带 width:100% 作 flex item 挤兄弟为 0（外包 div）；naive 特异性 0,3,0 > `:deep` 0,2,0，覆盖须 `!important`；NTooltip 包 disabled 按钮悬停无反应（disabled button 不派发鼠标事件）⇒ trigger 套一层 `<span>`。
- 列表页范式：Table + useVxeTable + Drawer + NFormWrap；DEV mock/request 分支 `as unknown as Promise<T>`。

## 页面模块

- 页面范式（系统设置/资料管理）= index.vue 壳（VerticalTabLayout + defineAsyncComponent/componentMap + `:key` 重建，无 KeepAlive）+ `modules/<tab>/<Tab>.vue` + `components/`；系统设置另有 `?tab=` query 同步（onActivated 也同步）。
- 系统设置 6 tab：basic-config/input-format/print-format/export-format/trace-capture/operation-trace；print-format 共用 `service/api/print-format/size-map.ts`；input-format 字段 `modules/input-format/fields-config.ts` 5 组 116 项（order52/shipTo16/shipper15/item13/product20 → fieldType 0..4，项存在=显示、required=1 必填）+ field-list-mapper.ts；cacheKey `setting-{print,input,export}-format-v3`；export-format 真实接口 `/export-template/*`；trace-capture 四 tab 全真实接口。
- 追踪网络 `/track-config/*`（模型轨迹抓取配置 1027）：queryCommon 分页 `{page,size,keyword}`→`{list,total}`（keyword 搜 name）；name 唯一（102701）；delete 仅单 `_id`；字段 name/trackType/url/account/password/key/web/channel/accountNo；cacheKey `trace-config-track-network-v2`；trackType 码与对接字段映射 `TRACK_TYPE_CONFIGS`（17 码含 sckj 顺仓/feia17/qy 秦远，以后端适配器为准）在 `constants/track-config.ts`；Drawer 表单=固定 name/trackType/url/web + 按类型动态必填字段（钮门/ups/fedex/zgyz/qy 无对接字段）。
- 资料管理 5 路由页 `data-manage/{basic,business,finance,no-rule,ship}`：前 4 页 modules/<item>/ 私有子档案（basic5/business8/finance4/no-rule1），basic/business/finance/components/MasterDataArchive.vue 各一份副本（不再公共）；跨页共享 `data-manage/components/{shared.ts,types.ts}`；18 档案 cacheKey `data-manage-*`。
- 发货资料 ship 4 tab（服务商/渠道类别/计泡规则/承运网络）独立实现，直连 tms-user `/provider|channel-group|weight-rule|carrier`；服务商 NRadioGroup 切 providerType 4 类全管（0-发货1-派送2-提单3-杂支）；计泡规则 calcMode(0-公斤1-方)+carryList 动态编辑区（Drawer 内自绘）；承运网络挂载拉计泡/追踪网络全量映射；cacheKey `data-manage-ship-*`；`/channel-group/query` 全量忽略 keyword/分页。
- 个人中心 hideInMenu（基本信息/修改密码）；保存后 authStore.getUserInfo() 刷侧栏；改密码后端不支持（置灰）。
- 用户编辑抽屉 `user/modules/user-edit-drawer.vue`（width 70%，列表 handleEdit 开抽屉；新增/详情仍走 user-operate-drawer）：基本信息 `edit/BasicInfo.vue` 可编辑表单（account/name/siteId 必填、roleIds/groupIds 多选 custom、status；创建/最后更新只读 custom 格）+ NTabs 档案/配置权限/账号配置（后两个 NEmpty 占位——后端 UserSchema 无截图那批字段，仅 openId）；抽屉底部统一保存：子表单 expose validate/collect → collect 判空 → Promise.all 校验 → fetchUpdateUser 全量提交（UserUpdateParams 必填 account/name/siteId，后端全量覆盖语义）；**坑**：v-for 内 template ref 变数组（显式写 pane）、档案 tab 须 display-directive="show"（切走保留实例否则提交静默失败）、`...ref?.collect()` 先判空再展开；**RouteKey 生成在 `src/typings/elegant-router.d.ts` 单文件**。
- `/customer/query` 支持 `userId` 参数（salesmanId/serviceId/cashierId + 组别数据权限 or 过滤），可查用户关联客户。
- 角色管理 role-permission-drawer.vue 三列 vxe 树表（constants/menu-permissions.ts）；提交 fetchUpdateRoleAuths 直连 POST /role/auths/update（扁平 auths=菜单 id+`system:*` 码）；回显遍历禁 Array.some（短路丢勾选，用 forEach+anyMatched）；**roleType=5（管理员）即超管角色：操作列「权限」按钮禁用+NTooltip 提示（`page.manage.role.permissionDisabledTip`），仅前端拦截、后端不拦**。
- 运单域公共组件 components/order/pack-type-select.vue（0-包裹/1-袋子/2-文件）。

## 接口契约（tms-user 统一 {errcode,errmsg,ret}）

- request 返回 {data,error,response}；SOP：类型对齐后端→service 去 DEV mock→页面→外部调用点→i18n 三处（typings/app.d.ts I18n Schema 同步）→oxlint allow ["_id"]。
- 登录 POST /user/login `{account, password: md5(md5(明文)+明文)}`（utils/crypto.ts）；会话 httpOnly cookie。
- `/company/{get,save}`：get 无参返整份；save 必填 name/sysName/address/web/logoUrl，剔除 status/expireDate/sysVersion/authModules/authApis。
- `/order-template/*`：`{scene,page,size,where?}`→`{list,total}` 管理端必传 scene:1；list 不含 fieldList（回显走 /get）；name 唯一、isDefault=1 互斥；fieldList 项存在=显示。
- `/print-template/*`：query 默认 omit design/infoList；create/update 必填 name/templateType/templateMode/sizeType；name 全局唯一、isDefault 同 templateType 互斥；delete 单 `_id`；sizeType 0-50×30…4-210×297、5-自定义。
- `/site/*`：`{page,size,keyword}`→`{list,total}`；siteType 0-分公司/1-总公司；毫秒时间戳；新增固定 siteType:0；总公司禁改删。
- POST /op-log/query（page/size/startDate/endDate/keyword/where 默认近 12 月）；client 0-TMS/1-PC/2-PDA/3-OMS；opType 0-登录/1-改/2-删/3-退/4-追踪；抓取时间 tab 的执行记录列表即调它（where.opType=4，列 name/client/opType/creator/createDate，cacheKey `trace-capture-time-v2`，旧 mock 链路已删）。
- 轨迹抓取三接口：异常轨迹 /track-err-config/_（timeType 0-年月日1-时分2-时分秒，query 全量 {list} 无 total）；轨迹关键词 /track-status-config/_（common 0-1、configIds[]、detectEvents[]、orderStatus 50-转运中60-已送达70-异常件80-已退件，分页）；抓取时间配置 /track-schedule/{save,get} upsert exeTimes(0-23 number[])；delete 均单 `_id`。
- 上传 POST /upload?dest=1..10（field=file）→{name,size,url}；dest 1-用户 2-公司 3-打印 4-导出 5-服务商 6-工单 7-运单 8-交易 9-问题件 10-临时；多文件 /files→{list}；拒 php/js/html/exe。
- tms-user `lib/ext-api/api/` 适配器字段映射（trackType=文件名）：kdzs 账号(account)+密码(password)；sd速递管家 appToken=account+appKey=key；hl 账号+密码；k5 Clientid=account+Token=key；kjv5 appKey=account+appSecret=key；nm icID=account+key(MD5)；ry plantId=account+plantKey=key+bankerId=accountNo；ydd 账号+密码；xzh token=key；t6/sckj顺仓 code=account+token=key；track17 17token=key；feia17 apiName=account+apiToken=key；qy 秦远无字段；ups/fedex 无适配器。

## 工具链 / 环境

- 只用 pnpm；同一文件多处编辑串行；PowerShell `&&` 串联；`git mv` Windows ENOENT→`Move-Item`+`git add -A`；WebStorm safe-delete 拦截→先 `$env:NODE_OPTIONS=""`。
- `pnpm gen-route` 交互式不可用→`pnpm dev` 重生成（先删 node_modules/.vite-temp）；dev 中途 Stop-Process 会截断 routes.ts；`scripts/update-env-ip.mjs` 把 .env.test baseURL 主机段换本机 IPv4。
- 生成文件（components.d.ts/elegant）dev 中不总刷新→放临时探针 .vue 触发后删。
- NUpload default-upload=false 不生成 url，预览用 URL.createObjectURL；image-card 缩略图要 status=finished 且 url 非空。
- vxe 横向滚动条：plugins/vxe-table.ts measureScrollbarSize() + styles/css/scrollbar.css。
- playwright-cli：dev 端口常被占（9111/9112，base `/tms/`），admin/admin@12345；eval 外层双引号+JS 内单引号，JS 内禁 `>`/`|`/`$`；NDropdown 项须真实 mousemove+mousedown+mouseup。
- **改 `packages/@sa/*` 没生效先查软链**：`node_modules/@sa/xxx` 可能退化为旧的真实目录（Junction 丢失），应用跑的是旧拷贝（2026-09-18 页签 hover 事故根因）；判别=Get-Item 看 LinkType + 比对两份 package.json version；修复=杀 dev server → `pnpm i` → 重启；信号=DOM 里同名 CSS module 出现两个不同 hash。验证"下发内容"必须用应用实际解析的 node_modules 路径，别抓 packages 源码路径。
