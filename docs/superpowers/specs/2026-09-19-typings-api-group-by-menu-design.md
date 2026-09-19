# typings/api 按菜单栏分组

> 日期：2026-09-19
> 状态：已确认设计（待写实施计划）

## 背景

`src/typings/api/` 下 18 个 `.d.ts` 平铺，全部是环境声明（`declare namespace Api { namespace X { ... } }`），
全项目对它们 **零 import 引用**（类型靠全局 `Api.*` 命名空间自动可用）。`tsconfig.json` 的
`include: ["./**/*.ts"]` 覆盖任意嵌套目录，因此纯移动/分组不需要改任何业务代码。

侧栏菜单树（`src/constants/menu-permissions.ts`）为：首页 / 客户管理 / 渠道报价 / **资料管理**
（发货资料·单号资料·运单资料·财务资料·提单资料·通用资料）/ 系统管理（用户·角色·组别·站点·系统设置·日志）。

现状问题：文件命名（如 `data-manage-basic.d.ts`、`no-rule.d.ts`、`declared-goods.d.ts`）完全看不出归属哪个菜单；
`Api.DataManage` 跨 4 文件合并，而 `data-manage-bl.d.ts` 却声明为 `Api.DataManageBl`，命名风格跳脱。

## 设计目标

把 `src/typings/api/*.d.ts` 按侧栏菜单树两级分组，目录结构与菜单树一一对应，便于按菜单找类型文件。

## 决策（用户已确认）

1. **分组粒度**：按菜单树两级 —— 一级菜单建目录，资料管理/系统管理下再按二级菜单建子目录。
2. **全局文件归位**：`common` / `upload` / `auth` / `route` 这 4 个不属于菜单的全局文件，统一进新建的 `common/` 顶层目录。
3. **命名空间归一**：只移动文件、改目录，**所有 `namespace` 名称原样保留**（含 `Api.DataManageBl`），零业务代码改动、风险最低。

## 目标目录结构

```
src/typings/api/
├── common/                      # 全局/公共（不属于任何菜单）
│   ├── common.d.ts              # Api.Common
│   ├── upload.d.ts              # Api.Upload
│   ├── auth.d.ts                # Api.Auth
│   └── route.d.ts               # Api.Route
├── channel-quote/               # 渠道报价（一级，无二级细分）
│   └── index.d.ts               # Api.ChannelQuote
├── data-manage/                 # 资料管理
│   ├── index.d.ts               # Api.DataManage（公共，原 data-manage.d.ts）
│   ├── ship.d.ts                # Api.DataManageShip
│   ├── basic.d.ts               # Api.DataManage.Basic
│   ├── business.d.ts            # Api.DataManage.Business
│   ├── finance.d.ts             # Api.DataManage.Finance
│   ├── bl.d.ts                  # Api.DataManageBl（名称保留）
│   ├── no-rule.d.ts             # Api.NoRule（单号资料）
│   └── declared-goods.d.ts      # Api.DeclaredGoods（运单资料/申报物品）
└── system-manage/               # 系统管理
    ├── index.d.ts               # Api.SystemManage
    └── system-setting/          # 系统设置（二级菜单）
        ├── company.d.ts         # Api.Company（基础配置）
        ├── input-format.d.ts    # Api.InputFormat
        ├── print-format.d.ts    # Api.PrintFormat
        └── export-format.d.ts   # Api.ExportFormat
```

## 文件迁移映射（18 个文件 → 9 个目录）

| 原文件                    | 目标文件                                        | 命名空间                |
| ------------------------- | ----------------------------------------------- | ----------------------- |
| common.d.ts               | common/common.d.ts                              | Api.Common              |
| upload.d.ts               | common/upload.d.ts                              | Api.Upload              |
| auth.d.ts                 | common/auth.d.ts                                | Api.Auth                |
| route.d.ts                | common/route.d.ts                               | Api.Route               |
| channel-quote.d.ts        | channel-quote/index.d.ts                        | Api.ChannelQuote        |
| data-manage.d.ts          | data-manage/index.d.ts                          | Api.DataManage          |
| data-manage-ship.d.ts     | data-manage/ship.d.ts                           | Api.DataManageShip      |
| data-manage-basic.d.ts    | data-manage/basic.d.ts                          | Api.DataManage.Basic    |
| data-manage-business.d.ts | data-manage/business.d.ts                       | Api.DataManage.Business |
| data-manage-finance.d.ts  | data-manage/finance.d.ts                        | Api.DataManage.Finance  |
| data-manage-bl.d.ts       | data-manage/bl.d.ts                             | Api.DataManageBl        |
| no-rule.d.ts              | data-manage/no-rule.d.ts                        | Api.NoRule              |
| declared-goods.d.ts       | data-manage/declared-goods.d.ts                 | Api.DeclaredGoods       |
| system-manage.d.ts        | system-manage/index.d.ts                        | Api.SystemManage        |
| company.d.ts              | system-manage/system-setting/company.d.ts       | Api.Company             |
| input-format.d.ts         | system-manage/system-setting/input-format.d.ts  | Api.InputFormat         |
| print-format.d.ts         | system-manage/system-setting/print-format.d.ts  | Api.PrintFormat         |
| export-format.d.ts        | system-manage/system-setting/export-format.d.ts | Api.ExportFormat        |

## 关键说明

- **进入 `data-manage/` 后去掉冗余的 `data-manage-` 前缀**（如 `data-manage-basic.d.ts → basic.d.ts`）；公共/聚合命名空间用 `index.d.ts`。
- **命名空间不变**：`Api.DataManage` 在 index/basic/business/finance 4 处通过 ambient 声明全局合并，移动目录不影响合并。
- **不新建空目录**：`客户管理` 等菜单无对应 typings 文件，不创建空文件夹；`系统设置` 下只放实际存在的 4 个文件（轨迹抓取/操作轨迹无 typings，不建空目录）。
- **零业务代码改动**：全项目对 typings/api 零 import，仅移动文件即可。

## 验证

- `pnpm typecheck` 通过；
- `read_lints` 对 `src/typings/api` 目录 0 诊断；
- 全项目搜原文件名（如 `data-manage-basic`，注意仅作文件名核对，内容引用的是 `Api.*` 命名空间不会受影响）0 残留。

## 执行注意（来自历史坑）

- Windows 下 `git mv` 可能报 ENOENT，必要时用 PowerShell `Move-Item`。
- 同一文件的多处改动必须串行执行（避免并行 `replace_in_file` 互相覆盖）；本次纯移动不涉及同文件多次改，但如后续有补充编辑请串行。

## 附带产出（项目规则 AGENTS.md 规则 1）

- `changelog/typings按菜单栏分组.md`：记录本次讨论定位、决策。
- `AGENTS_CHANGELOG.md`：追加索引条目。
