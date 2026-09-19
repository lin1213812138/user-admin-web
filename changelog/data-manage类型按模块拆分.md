# data-manage 类型按模块拆分文件

## 背景

`src/typings/api/data-manage.d.ts` 内 `Api.DataManage` 命名空间把基础资料 / 财务资料 / 业务资料 三大类共 14 个接口 + 搜索态类型堆在一起，单文件过长、不好维护。

## 方案

利用 TypeScript `declare namespace` 的**声明合并**特性，把内容按模块拆到多个文件，命名空间保持 `Api.DataManage` 不变，因此所有 `Api.DataManage.*` 引用（共 25 处 service/view）无需改动。

| 文件                           | 内容                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `data-manage.d.ts`（保留公共） | `MasterDataRow`、`DataManageArchiveKey`、`ArchiveList<T>`、`ArchiveSearchParams` |
| `data-manage-basic.d.ts`       | `BasicCountryRegion`、`BasicFbaWarehouse`                                        |
| `data-manage-finance.d.ts`     | `FinanceAccount`、`FinanceCurrency`、`FinanceExpenseType`、`FinanceSettlement`   |
| `data-manage-business.d.ts`    | 8 个 `Business*` 接口 + `ProblemGroupSearchParams`                               |

每个文件均以 `declare namespace Api { namespace DataManage { ... } }` 包裹，与已有 `data-manage-bl.d.ts` / `data-manage-ship.d.ts`（独立命名空间 `Api.DataManageBl` / `Api.DataManageShip`）并列。

## 验证

- `read_lints` 对 4 个类型文件 + ProblemCategory/CountryRegion/Settlement 三个消费文件：0 error / 0 warning。
- 全仓 `pnpm typecheck` 仍被 `src/typings/components.d.ts(160)` 既有非法标识符 `LButton.bak` 阻塞，与本次拆分无关。

## 备注

若希望像 bl/ship 那样彻底改成独立命名空间（`Api.DataManageBasic` / `Api.DataManageFinance` / `Api.DataManageBusiness`），需同步改 25 处引用（service 的 `ArchiveApiGroup` 与各页面 `type Row`），改动面更大；本次采用纯文件拆分、不改命名空间，风险最低。
