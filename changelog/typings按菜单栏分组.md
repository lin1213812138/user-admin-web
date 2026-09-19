# typings 按菜单栏分组

> 状态：已实施（2026-09-19）

## 用户诉求

用户贴 `src/typings/api/` 目录截图（18 个 `.d.ts` 平铺），要求「这个按菜单栏分组」。

## 定位

- `typings/api/*.d.ts` 全部是环境声明（`declare namespace Api { namespace X { ... } }`），全项目 **零 import 引用**（类型靠全局 `Api.*` 命名空间自动可用）。
- `tsconfig.json` 的 `include: ["./**/*.ts"]` 覆盖任意嵌套目录，因此纯移动/分组不需要改任何业务代码。
- 侧栏菜单树见 `src/constants/menu-permissions.ts` 的 `MENU_PERMISSION_TREE`：首页 / 客户管理 / 渠道报价 / 资料管理（发货资料·单号资料·运单资料·财务资料·提单资料·通用资料）/ 系统管理（用户·角色·组别·站点·系统设置·日志）。

## 决策（用户逐项确认）

1. **分组粒度**：按菜单树两级（一级菜单建目录，资料管理/系统管理下再按二级菜单建子目录）。
2. **全局文件归位**：`common` / `upload` / `auth` / `route` 这 4 个不属于菜单的全局文件，统一进新建的 `common/` 顶层目录。
3. **命名空间归一**：只移动文件、改目录，**所有 `namespace` 名称原样保留**（含 `Api.DataManageBl`），零业务代码改动、风险最低。

## 实施

目标目录结构（18 文件 → 9 目录）：

```
src/typings/api/
├── common/{common,upload,auth,route}.d.ts
├── channel-quote/index.d.ts            (原 channel-quote.d.ts → Api.ChannelQuote)
├── data-manage/
│   ├── index.d.ts                       (原 data-manage.d.ts → Api.DataManage 公共)
│   ├── ship.d.ts                        (原 data-manage-ship.d.ts → Api.DataManageShip)
│   ├── basic.d.ts                       (原 data-manage-basic.d.ts → Api.DataManage.Basic)
│   ├── business.d.ts                    (原 data-manage-business.d.ts → Api.DataManage.Business)
│   ├── finance.d.ts                     (原 data-manage-finance.d.ts → Api.DataManage.Finance)
│   ├── bl.d.ts                          (原 data-manage-bl.d.ts → Api.DataManageBl，名称保留)
│   ├── no-rule.d.ts                     (原 no-rule.d.ts → Api.NoRule)
│   └── declared-goods.d.ts              (原 declared-goods.d.ts → Api.DeclaredGoods)
└── system-manage/
    ├── index.d.ts                        (原 system-manage.d.ts → Api.SystemManage)
    └── system-setting/{company,input-format,print-format,export-format}.d.ts
```

- 进入 `data-manage/` 后去掉冗余的 `data-manage-` 前缀；公共/聚合命名空间用 `index.d.ts`。
- `Api.DataManage` 跨 index/basic/business/finance 4 处靠 ambient 声明全局合并，移动目录不影响合并。
- 不新建空目录：`客户管理` 等无对应 typings 文件不建空文件夹；`系统设置` 只放实际存在的 4 个文件。
- 移动方式：先 `mkdir` 建目标目录，再用 PowerShell `Move-Item` 物理移动（git 对未纳入版本控制的 3 个文件 `data-manage-basic/business/finance.d.ts` 会拒绝 `git mv`），最后 `git add -A`；git 按内容相似度将已追踪的 15 个识别为 rename（保留历史），3 个未追踪文件以新增形式入库。纯移动、文件内容未改动。

## 验证（已实施）

- `git status`：已追踪 15 个 ⇒ `R`（rename，保留历史）；3 个此前未纳入版本控制 ⇒ `A`（新增入库），无误删。
- `read_lints` 对 `src/typings/api` 目录 0 诊断。
- 目录树核对：18 文件全部落入 `common/` / `channel-quote/` / `data-manage/` / `system-manage/system-setting/`，根目录无残留 `.d.ts`。
- 注：纯移动 `declare namespace` 环境声明，全局 `Api.*` 命名空间合并不受影响；`tsconfig` 的 `include: ["./**/*.ts"]` 覆盖任意嵌套目录，零业务代码改动。该变更为内容中性，预期 `pnpm typecheck` 通过（如需可补跑）。

## 关联

- 设计文档：`docs/superpowers/specs/2026-09-19-typings-api-group-by-menu-design.md`
- 此前同类：平铺文件按文件夹归类见 `changelog/设置模块按文件夹归类.md`
