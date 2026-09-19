# typings/api 按菜单栏分组 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `src/typings/api/` 下 18 个平铺 `.d.ts` 按侧栏菜单树两级分组到文件夹，便于按菜单找类型文件。

**Architecture:** 纯文件移动（git mv / PowerShell Move-Item），所有 `declare namespace Api.*` 内容原样保留；类型靠全局 `Api.*` 命名空间可用，全项目零 import 引用，因此移动后无需改任何业务代码。`tsconfig.json` 的 `include: ["./**/*.ts"]` 覆盖任意嵌套目录。

**Tech Stack:** TypeScript 6 / Vue 3.5（ambient declaration `.d.ts`）；包管理 pnpm（但本计划只用文件系统移动，不装包）。

## Global Constraints

- 只移动文件、改目录结构，**所有 `namespace` 名称原样保留**（含 `Api.DataManageBl`），不得修改业务代码。
- `Api.DataManage` 跨 index/basic/business/finance 4 处靠 ambient 声明全局合并，移动目录后必须仍可合并。
- 不新建空目录（无 typings 的菜单不建空文件夹；`系统设置` 只放实际存在的 4 个文件）。
- Windows 下 `git mv` 可能报 ENOENT，必要时改用 PowerShell `Move-Item`。
- 验证手段：`pnpm typecheck` + `read_lints` + 全项目搜原文件名（本仓库无单测框架，不要找测试命令）。
- 按 git 安全规则，**不要自动 `git commit`**，由用户统一提交。

---

## 文件结构（目标）

```
src/typings/api/
├── common/                      # 全局/公共（非菜单）
│   ├── common.d.ts              # Api.Common      (原 common.d.ts)
│   ├── upload.d.ts              # Api.Upload       (原 upload.d.ts)
│   ├── auth.d.ts                # Api.Auth         (原 auth.d.ts)
│   └── route.d.ts               # Api.Route        (原 route.d.ts)
├── channel-quote/               # 渠道报价
│   └── index.d.ts               # Api.ChannelQuote  (原 channel-quote.d.ts)
├── data-manage/                 # 资料管理
│   ├── index.d.ts               # Api.DataManage 公共   (原 data-manage.d.ts)
│   ├── ship.d.ts                # Api.DataManageShip    (原 data-manage-ship.d.ts)
│   ├── basic.d.ts               # Api.DataManage.Basic  (原 data-manage-basic.d.ts)
│   ├── business.d.ts            # Api.DataManage.Business(原 data-manage-business.d.ts)
│   ├── finance.d.ts             # Api.DataManage.Finance(原 data-manage-finance.d.ts)
│   ├── bl.d.ts                  # Api.DataManageBl      (原 data-manage-bl.d.ts)
│   ├── no-rule.d.ts             # Api.NoRule            (原 no-rule.d.ts)
│   └── declared-goods.d.ts      # Api.DeclaredGoods     (原 declared-goods.d.ts)
└── system-manage/               # 系统管理
    ├── index.d.ts               # Api.SystemManage      (原 system-manage.d.ts)
    └── system-setting/          # 系统设置（二级菜单）
        ├── company.d.ts         # Api.Company           (原 company.d.ts)
        ├── input-format.d.ts    # Api.InputFormat       (原 input-format.d.ts)
        ├── print-format.d.ts     # Api.PrintFormat       (原 print-format.d.ts)
        └── export-format.d.ts    # Api.ExportFormat      (原 export-format.d.ts)
```

> 注：`data-manage.d.ts → data-manage/index.d.ts`、`channel-quote.d.ts → channel-quote/index.d.ts`、`system-manage.d.ts → system-manage/index.d.ts` 三个聚合/公共命名空间用 `index.d.ts`；`data-manage-*` 进入 `data-manage/` 后去掉冗余前缀。

---

### Task 1: 建 common/ 目录并移动 4 个全局文件

**Files:**

- Move: `src/typings/api/common.d.ts` → `src/typings/api/common/common.d.ts`
- Move: `src/typings/api/upload.d.ts` → `src/typings/api/common/upload.d.ts`
- Move: `src/typings/api/auth.d.ts` → `src/typings/api/common/auth.d.ts`
- Move: `src/typings/api/route.d.ts` → `src/typings/api/common/route.d.ts`

**Interfaces:** 无（纯移动）。

- [ ] **Step 1: 新建 common/ 目录并移动文件（PowerShell）**

```powershell
$base = "d:/LINFLY/CWMS/user-admin-web/src/typings/api"
New-Item -ItemType Directory -Force -Path "$base/common" | Out-Null
Move-Item "$base/common.d.ts"   "$base/common/common.d.ts"
Move-Item "$base/upload.d.ts"   "$base/common/upload.d.ts"
Move-Item "$base/auth.d.ts"     "$base/common/auth.d.ts"
Move-Item "$base/route.d.ts"    "$base/common/route.d.ts"
```

- [ ] **Step 2: 确认移动结果**

Run: 列出 `src/typings/api/common/` 应含 `common.d.ts`、`upload.d.ts`、`auth.d.ts`、`route.d.ts` 四个文件；根目录不再有这 4 个文件。

---

### Task 2: 移动 channel-quote 与 data-manage 系列

**Files:**

- Move: `src/typings/api/channel-quote.d.ts` → `src/typings/api/channel-quote/index.d.ts`
- Move: `src/typings/api/data-manage.d.ts` → `src/typings/api/data-manage/index.d.ts`
- Move: `src/typings/api/data-manage-ship.d.ts` → `src/typings/api/data-manage/ship.d.ts`
- Move: `src/typings/api/data-manage-basic.d.ts` → `src/typings/api/data-manage/basic.d.ts`
- Move: `src/typings/api/data-manage-business.d.ts` → `src/typings/api/data-manage/business.d.ts`
- Move: `src/typings/api/data-manage-finance.d.ts` → `src/typings/api/data-manage/finance.d.ts`
- Move: `src/typings/api/data-manage-bl.d.ts` → `src/typings/api/data-manage/bl.d.ts`
- Move: `src/typings/api/no-rule.d.ts` → `src/typings/api/data-manage/no-rule.d.ts`
- Move: `src/typings/api/declared-goods.d.ts` → `src/typings/api/data-manage/declared-goods.d.ts`

**Interfaces:** `Api.DataManage`（index/basic/business/finance 4 处合并）移动后仍需可全局合并——ambient namespace 跨文件合并不依赖路径，无需额外操作。

- [ ] **Step 1: 新建目录并移动文件（PowerShell）**

```powershell
$base = "d:/LINFLY/CWMS/user-admin-web/src/typings/api"
New-Item -ItemType Directory -Force -Path "$base/channel-quote" | Out-Null
New-Item -ItemType Directory -Force -Path "$base/data-manage"    | Out-Null
Move-Item "$base/channel-quote.d.ts"    "$base/channel-quote/index.d.ts"
Move-Item "$base/data-manage.d.ts"      "$base/data-manage/index.d.ts"
Move-Item "$base/data-manage-ship.d.ts" "$base/data-manage/ship.d.ts"
Move-Item "$base/data-manage-basic.d.ts" "$base/data-manage/basic.d.ts"
Move-Item "$base/data-manage-business.d.ts" "$base/data-manage/business.d.ts"
Move-Item "$base/data-manage-finance.d.ts" "$base/data-manage/finance.d.ts"
Move-Item "$base/data-manage-bl.d.ts"   "$base/data-manage/bl.d.ts"
Move-Item "$base/no-rule.d.ts"          "$base/data-manage/no-rule.d.ts"
Move-Item "$base/declared-goods.d.ts"   "$base/data-manage/declared-goods.d.ts"
```

- [ ] **Step 2: 确认移动结果**

Run: `src/typings/api/data-manage/` 应含 `index.d.ts`、`ship.d.ts`、`basic.d.ts`、`business.d.ts`、`finance.d.ts`、`bl.d.ts`、`no-rule.d.ts`、`declared-goods.d.ts`；`channel-quote/index.d.ts` 存在。

---

### Task 3: 移动 system-manage 系列（含 system-setting 子目录）

**Files:**

- Move: `src/typings/api/system-manage.d.ts` → `src/typings/api/system-manage/index.d.ts`
- Move: `src/typings/api/company.d.ts` → `src/typings/api/system-manage/system-setting/company.d.ts`
- Move: `src/typings/api/input-format.d.ts` → `src/typings/api/system-manage/system-setting/input-format.d.ts`
- Move: `src/typings/api/print-format.d.ts` → `src/typings/api/system-manage/system-setting/print-format.d.ts`
- Move: `src/typings/api/export-format.d.ts` → `src/typings/api/system-manage/system-setting/export-format.d.ts`

**Interfaces:** 无（纯移动）。

- [ ] **Step 1: 新建目录并移动文件（PowerShell）**

```powershell
$base = "d:/LINFLY/CWMS/user-admin-web/src/typings/api"
New-Item -ItemType Directory -Force -Path "$base/system-manage/system-setting" | Out-Null
Move-Item "$base/system-manage.d.ts"    "$base/system-manage/index.d.ts"
Move-Item "$base/company.d.ts"          "$base/system-manage/system-setting/company.d.ts"
Move-Item "$base/input-format.d.ts"     "$base/system-manage/system-setting/input-format.d.ts"
Move-Item "$base/print-format.d.ts"     "$base/system-manage/system-setting/print-format.d.ts"
Move-Item "$base/export-format.d.ts"    "$base/system-manage/system-setting/export-format.d.ts"
```

- [ ] **Step 2: 确认移动结果**

Run: `src/typings/api/system-manage/` 含 `index.d.ts`；`system-manage/system-setting/` 含 `company.d.ts`、`input-format.d.ts`、`print-format.d.ts`、`export-format.d.ts`。

---

### Task 4: 全量验证

**Files:** 无新增/修改（仅核对）。

- [ ] **Step 1: 类型检查**

Run: `pnpm typecheck`
Expected: 退出码 0，无 `Api.*` 相关报错。

- [ ] **Step 2: Lint 诊断**

Run: 对 `src/typings/api` 目录执行 read_lints，Expected: 0 诊断。

- [ ] **Step 3: 确认无残留旧文件名引用**

Run: 在 `src` 全项目搜索旧文件名（`data-manage-basic`、`data-manage-ship`、`data-manage-business`、`data-manage-finance`、`data-manage-bl`、`channel-quote.d.ts`、`system-manage.d.ts`、`no-rule.d.ts`、`declared-goods.d.ts`、`input-format.d.ts`、`print-format.d.ts`、`export-format.d.ts`、`company.d.ts`、`common.d.ts`、`upload.d.ts`、`auth.d.ts`、`route.d.ts`），Expected: 0 命中（这些文件名未被 import，引用的是 `Api.*` 命名空间，不受影响）。

- [ ] **Step 4: 核对最终目录结构**

Run: 列出 `src/typings/api/` 完整树，应与「文件结构（目标）」一致：根下仅 `common/`、`channel-quote/`、`data-manage/`、`system-manage/` 四个目录，无遗留平铺 `.d.ts`。

---

## Self-Review 笔记

- **Spec 覆盖**：18 个文件全部映射到 Task 1–3；验证对应 Task 4；命名空间保留、不建空目录、Windows 移动方式均在 Global Constraints/Task 中体现。
- **Placeholder 扫描**：无 TBD/TODO；每个 Step 均含实际 PowerShell 命令或核对命令。
- **类型一致性**：`index.d.ts` 命名与 `Api.DataManage`/`Api.ChannelQuote`/`Api.SystemManage` 兼容；`bl.d.ts` 保留 `Api.DataManageBl` 与全局约束一致。
