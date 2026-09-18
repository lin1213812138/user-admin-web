# 资料管理 business / finance 接口拆分对接（方案 2，设计待确认）

> 关联：2026-09-18「资料管理各模块列表与表单拆文件」设计（business 8 + finance 4 当时明确「走公共 MasterDataArchive 已拆不动」）。
> 现用户确认采用**方案 2**：把 business(8) + finance(4) 像 basic/bl/ship/no-rule 那样拆成独立真实接口文件，并让后端补对应实体路由，替代原通用 `/data-manage/:archive` 接口。

## 一、问题定位

### 1. 前端现状

- business / finance 各有一份 `components/MasterDataArchive.vue`（两份几乎完全相同），硬编码调用 `src/service/api/data-manage/index.ts` 的通用 `fetchXxxDataManage(archive, params)`。
- 该通用接口：`import.meta.env.DEV` 返回 `mock.ts` 假数据（用 `id` 字段、`{records,total}` 结构）；PROD 下请求 `/data-manage/${archive}/{list,create,update,delete}`。
- **后端无 `/data-manage` 路由**（全局搜索命中 0）⇒ 生产环境（dev:prod / build:test / build）必 404。
- basic 模块也有一份相同的 `basic/components/MasterDataArchive.vue` 仍引用通用接口，疑似漏改（basic 子模块 CountryRegion/FbaWarehouse 已用独立 `data-manage-basic` 真实接口）。

### 2. 后端现状（api-v1-web 已存在路由，按实体名挂载，非 `/data-manage/:archive`）

business/finance 共 12 个 archive 对应的实体路由覆盖情况：

| archive         | 前端 kebab 路径（建议） | 后端是否已存在                                        |
| --------------- | ----------------------- | ----------------------------------------------------- |
| salesTerms      | /sales-terms            | ✅ 已存在                                             |
| customsType     | /customs-type           | ✅ 已存在                                             |
| exportReason    | /export-reason          | ✅ 已存在                                             |
| currency        | /currency               | ✅ 已存在                                             |
| account         | /account                | ❌ 缺失（相近：trade-account）                        |
| settlement      | /settlement             | ❌ 缺失                                               |
| address         | /address                | ❌ 缺失（相近：ship-to / bl-address，但无通用地址簿） |
| declaredGoods   | /declared-goods         | ❌ 缺失                                               |
| problemCategory | /problem-category       | ❌ 缺失（相近：problem-group）                        |
| goodsCategory   | /goods-category         | ❌ 缺失（相近：product-group）                        |
| clearanceMethod | /clearance-method       | ❌ 缺失                                               |
| expense-type    | /expense-type           | ❌ 缺失（相近：fee-type）                             |

### 3. 前后端契约差异（关键坑，必须先决策）

- 后端 `queryCommon`（`lib/common/services/common.js:158/169`）返回 `{ list, total }`，list 项为 mongo 原始文档，主键 `_id`（字符串），**无 `id` 字段**。
- 后端 delete 收 `{ ids: [_id 字符串] }`（`batchDeleteCommon` 用 `body.ids`，$in 数组；路由 validate `ids: requireStrArr`）。
- 但前端 `MasterDataArchive` 用 `transform: r => ({ records: r.records, total: r.total })`，且删除/编辑用 `row.id`、`MasterDataRow.id: number`。
- **结论**：即便后端已存在的 4 个路由，当前前端也跑不通（records≠list、id≠_id），当前能显示全靠 DEV mock。

## 二、方案设计（方案 2）

### 前端

1. 新增 `src/service/api/data-manage-business/index.ts` + `src/service/api/data-manage-finance/index.ts`（或合并为 `data-manage-archive/index.ts`），为 12 个档案各导出 `fetchGetXxxList / fetchCreateXxx / fetchUpdateXxx / fetchDeleteXxx`，**真实接口、无 DEV mock**（对齐 basic/bl/ship/no-rule 写法，调用方解包 `{ data, error }`）。
2. 改造 `MasterDataArchive.vue`：组件内维护「archive → fetch 函数组」映射表（指向新 api 文件），子模块视图（SalesTerms.vue 等 12 个）零改动；`transform` 改为 `{ records: r.list ?? r.records, total: r.total }`；删除/编辑改 `row._id`；`MasterDataRow.id: number` 改为 `_id: string`。
3. business / finance 两份 `MasterDataArchive.vue` 合并为一份共享组件（当前两份几乎完全相同，删重只维护一处）。
4. 删除通用 `src/service/api/data-manage/index.ts` + `mock.ts`（不再被引用后）；清理疑似死代码 `basic/components/MasterDataArchive.vue`（需先确认 basic 子模块是否已全切到独立接口）。

### 后端（缺 8 个实体）

为每个缺失实体补：`api-v1-web/<kebab>/index.js` + `<kebab>.js`(ctrl，复制 sales-terms 模板) + `services/<kebab>.js`（`commonService('<Model>')` 模板) + `models/<kebab>.js`(mongo model)，路由挂 `create / update(需 _id) / delete(ids) / query`。

- 已存在的 4 个（currency/sales-terms/export-reason/customs-type）前端直接对接，后端零改动。
- 是否复用相近路由（fee-type / trade-account / problem-group / product-group）需逐一定义字段差异后决策。

## 三、待确认决策点（见 AGENTS_CHANGELOG 索引）

1. id 字段对齐：前端统一改 `_id`（推荐，与全仓其它模块及后端 mongo 一致）还是要求后端 query 补 `id`？
2. 缺失 8 实体：全部新建独立路由 / 复用语义相近已有路由（expense-type↔fee-type、account↔trade-account、problem-category↔problem-group、goods-category↔product-group）/ 混合（你来指定哪些）。
3. `MasterDataArchive.vue` 合并为一份共享组件 vs 保持两份。
4. 后端 8 实体是否由我一并实现（改 tms-user）还是只做前端、后端另行补。
5. `basic/components/MasterDataArchive.vue` 是否也是漏改、一并规范化。

## 四、实施（2026-09-19 已完成，按用户决策）

**用户决策**：id 统一改 `_id`；缺失的 8 个后端实体**先不接**（前端 mock 兜底）；business/finance 两份 `MasterDataArchive` **合并为一份**；**只做前端**（后端路由另行补）。

### 改动清单

- **新建** `src/service/api/data-manage-archive/index.ts`：12 个档案各自的 fetch（list/create/update/remove）；
  - 后端已存在路由的 4 个（currency / sales-terms / export-reason / customs-type）走真实 `request`（解包 `{ data, error }`，路径 `/currency` 等，与 basic/bl/ship/no-rule 一致）；
  - 后端暂未实现的 8 个（account / settlement / address / declared-goods / problem-category / goods-category / clearance-method / expense-type）走**本地 mock 兜底**，返回结构与真实接口一致（`{ list, total }` + `_id`），将来补后端只需把对应函数体由 mock 改为 request，零成本切换；
  - 导出 `archiveApiMap`（archive → fetch 函数组），供共享组件按 `config.archive` 分流。
- **合并** business/finance 两份 `MasterDataArchive.vue` 为共享 `src/views/data-manage/components/MasterDataArchive.vue`：
  - 组件内 `archiveApiMap[config.archive]` 取对应 fetch 组；api 回调解包 `{ data, error }`（`if (error || !res) return { list: [], total: 0 }`）；`transform` 改 `r.list`；
  - 删除/编辑改 `row._id`（编辑时 `currentId` 保存 `_id`，提交时回填）；
  - **透传父组件传入的列自定义插槽**（如 expense-type 的 `#scope`）到内部 `<Table>`。
- **类型** `typings/api/data-manage.d.ts`：`MasterDataRow.id: number` → `_id: string`；`ArchiveList.records` → `list`；补 `createDate?: number` / `createTime?: string`（组件 `transform` 把后端 `createDate` 时间戳格式化为 `createTime` 展示）。
- **删除**：`business/components/MasterDataArchive.vue`、`finance/components/MasterDataArchive.vue`、`basic/components/MasterDataArchive.vue`（死代码，0 引用）、`service/api/data-manage/index.ts`、`service/api/data-manage/mock.ts`。
- **12 个子模块视图** import 切到共享组件路径。
- `service/api/index.ts` 入口 `./data-manage` → `./data-manage-archive`。
- `finance/modules/expense-type/ExpenseType.vue` 的 `#scope` 插槽 `row.scope` 加类型转换 `(row as { scope?: number }).scope`。

### 验证

- `pnpm typecheck`：0 error
- `pnpm lint`：0 error（仅 `link.vue` 2 个既有 warning，与本次无关）
- `pnpm build:test`：Build successful

### 范围边界

- 缺失的 8 个后端实体本次仅前端 mock 兜底，**后端路由未实现**，待后续补；这 8 个在后端就绪前联调会走本地 mock。
- basic 模块不受影响（其 CountryRegion/FbaWarehouse 子模块早已用 `data-manage-basic` 真实接口，本次只删了 basic 的死代码副本）。
