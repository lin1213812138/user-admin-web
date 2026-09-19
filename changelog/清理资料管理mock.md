# 清理资料管理死代码 mock

## 背景

用户问「资料管理的 mock 数据删了吗」。本会话此前仅对 `data-manage`（资料管理）模块做只读排查，未改动文件。

## 定位

- 唯一 mock 位于 `src/service/api/data-manage-archive/index.ts` 的 `declaredGoods` 本地兜底：
  `mockList` / `mockCreate` / `mockUpdate` / `mockDelete` + `factories` / `datasets` / `idSeq` / `delay` / `LIST_DELAY_MS` / `MUTATE_DELAY_MS`，并在 `archiveApiMap['declaredGoods']` 引用。
- 经确认是**死代码**：没有任何 `.vue` `import MasterDataArchive`（`MasterDataArchive.vue` 通用组件未被实例化）；真实的申报物品界面（`business/modules/declared-goods/*`）走独立的 `@/service/api/declared-goods`（真实 `request`），并非该 mock 分支。

## 实施

1. 删除整个「本地 mock 兜底」实现段（约 75 行）。
2. 从 `archiveApiMap` 移除 `declaredGoods` 入口。
3. 顶部文件注释删去「后端暂未实现的 1 个（declared-goods）暂走本地 mock 兜底……」两条说明；`account` 早已改走真实 `/trade-account/*`（注释已体现）。

## 验证

- `pnpm typecheck` 0。
- 全仓搜索 `declaredGoods` / `mockList` 等：其余 `declaredGoods` 均为真实 i18n 键、路由、typings、独立 `declared-goods` service；`mock*` 仅在无关 `service/api/mock.ts`（operation-trace）出现，无悬空引用。
