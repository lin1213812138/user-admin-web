# 业务资料子模块改造 — 设计文档

- 日期：2026-09-14
- 状态：已与用户确认（沿用「基础资料」模式）

## 背景

「业务资料」当前为 `data-manage_business` 单路由 + 页面内左侧 `ArchiveSwitch` 子导航，挂 4 个子档案：仓库 / 库位 / 承运商 / 门店。架构由 `ArchiveConfig` 配置驱动 `MasterDataArchive` 通用组件，`fetchGetDataManageList/create/update/delete(archive,...)` 通用 fetch，DEV 走 `mock-data-manage.ts`。

用户要求替换为 9 个新子模块：单号资料管理 / 地址簿管理 / 申报物品 / 问题类别 / 物品类别 / 报关类型 / 出口原因 / 清关方式 / 销售条款。

## 设计决策（用户确认）

1. 展示形式：沿用「基础资料」——单路由 + 页内 `ArchiveSwitch` 子导航，子档案不生成路由/菜单。
2. 旧 4 子模块删除，完全替换。
3. 字段先按通用字段（编码 + 名称 + 状态 + 备注），后续逐个补充。
4. 数据源继续 DEV mock。

## 改造清单

1. 删除 `archives/business/{warehouse,location,carrier,store}/`。
2. 新增 9 个 `archives/business/<dir>/index.vue`（通用字段，结构同 `basic/country-region`）。
3. `data-manage/business/index.vue` 的 `items` 替换为 9 个。
4. `data-manage.d.ts`：删 4 接口 + 改 `DataManageArchiveKey` 联合体 + 加 9 接口。
5. `mock-data-manage.ts`：`factories` 删 4 加 9。
6. i18n 三处：`business` 段抽通用键 `code`/`name`/`form.*`，9 模块各加 `.title`，删旧 4 模块子键。
7. 路由无关，不跑 gen-route。

## 验证

`pnpm typecheck` 0 + 单文件 lint 0。
