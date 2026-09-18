# 追踪网络「轨迹信息改造」设计

**日期**：2026-09-18
**关联记录**：[changelog/追踪网络轨迹信息改造.md](../../../changelog/追踪网络轨迹信息改造.md)

## 背景与需求

用户附两张原型截图：

1. `系统设置 → 轨迹抓取配置 → 追踪网络` 列表操作列，从现在的「编辑 / 删除」变为平铺三个按钮 **编辑 / 轨迹信息改造 / 删除**。
2. 点击「轨迹信息改造」弹出**弹窗**（非抽屉），标题「追踪网络」，顶部只读展示当前网络名称，下方「改造规则」表格（**原始字符串 / 替换字符串**），带「+ 添加一行」与行内「删除」，底部「取消 / 保存」。

需求：按追踪网络配置轨迹字符串替换规则（原始字符串 → 替换字符串），落库到后端 `track-replace` 模型。

**后端已就绪（零改动）**：`tms-user`

- `lib/api-v1-web/track-replace/`：`/track-replace/batch/save`（入参 `{ configId, list: [{ _id?, oriStr, replaceStr }] }`，控制器对每个 item 补 `creatorId/creator` 后走 `batchSaveCommon` 按 `_id` 差集做增删改）、`/track-replace/query`、`/track-replace/get`。
- 模型 `lib/common/models/track-replace.js`：`configId / oriStr / replaceStr / creatorId / creator / createDate / updateDate`。
- `batchSaveCommon` 语义：传 `refValue=configId` 时，取该 `configId` 全量记录与入参 `list` 求 `_id` 差集 → 删除差集中的、新增无 `_id` 的、更新带 `_id` 的。因此**保存时整表提交、本地删除即从数组移除**即可。
- `query` 走 `queryCommon`，入参 `{ where: { configId }, page, size, sort }`（`getCtxQueryParams` 把 `ctx.request.body` 透传为 `where`）。

## 澄清确认（4 问结论）

1. **入口**：平铺三个按钮（编辑 / 轨迹信息改造 / 删除），不用下拉，操作列变宽；
2. **规则编辑**：行内单元格始终可输入，「添加一行」直接追加一条可编辑空行，最后统一保存；
3. **保存时机**：弹窗内增删改仅本地生效，点「保存」一次性提交 `/track-replace/batch/save`；
4. **校验**：原始字符串 / 替换字符串都可空，保存时过滤两者皆空的行（最宽松）。

## 方案

### 1. 类型（`src/typings/api/system-manage.d.ts` 新增，不动 `TraceConfig*`）

```ts
/** 轨迹信息改造规则（track-replace 模型，按 configId 归属某个追踪网络） */
interface TraceReplaceItem {
  _id?: string; // 已有规则有；新增空行无
  oriStr?: string; // 原始字符串
  replaceStr?: string; // 替换字符串（可空=删除原串）
  creator?: string; // 展示用（只读，来自后端）
}

/** 改造规则查询返回（queryAllCommon 全量，忽略分页；用 size 拉满） */
type TraceReplaceList = { list: Api.SystemManage.TraceReplaceItem[] };

/** 批量保存入参（与后端 /track-replace/batch/save 对齐） */
type TraceReplaceBatchSaveParams = {
  configId: string;
  list: Api.SystemManage.TraceReplaceItem[];
};
```

### 2. 接口（`src/service/api/track-replace/index.ts` 新增，仿 `track-config`，真实请求、无 DEV mock）

```ts
/** 按 configId 拉取该网络的全部改造规则 */
fetchGetTrackReplaceList(params: { where: { configId: string }; page?: number; size?: number })
  → request<Api.SystemManage.TraceReplaceList>({ url: '/track-replace/query', method: 'post', data: params });

/** 批量保存（增/删/改一步到位） */
fetchBatchSaveTrackReplace(params: Api.SystemManage.TraceReplaceBatchSaveParams)
  → request<boolean>({ url: '/track-replace/batch/save', method: 'post', data: params });
```

- 走 `@sa/axios` `createFlatRequest`，调用方解包 `{ data, error }`（与 `track-config` 一致）。
- 列表查询用 `size: 999` 拉满（单网络规则量小）。

### 3. 入口改造（改 `trace-capture/track-network/TrackNetworkTable.vue`）

操作列 `#action` 由「编辑 + NPopconfirm 删除」改为三个平铺按钮：

```vue
<template #action="{ row }">
  <NButton size="small" type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</NButton>
  <NButton size="small" type="primary" text @click="openReplace(row)">
    {{ $t('page.manage.setting.traceCapture.traceInfoTransform') }}
  </NButton>
  <NPopconfirm @positive-click="handleDelete(row)">
    <template #trigger>
      <NButton size="small" type="error" text>{{ $t('common.delete') }}</NButton>
    </template>
    {{ $t('common.confirmDelete') }}
  </NPopconfirm>
</template>
```

新增 `replaceVisible` ref 与 `replaceRow` ref，`openReplace(row)` 打开弹窗并传 `row._id` / `row.name`。模板挂 `<TrackReplaceModal v-model:show="replaceVisible" :config-id="replaceRow?._id" :network-name="replaceRow?.name" />`。

### 4. 新增弹窗组件（`trace-capture/track-network/TrackReplaceModal.vue`）

- `NModal`（`:show="show"` `v-model:show`，`preset="card"` 或自定义头部，标题 `${$t('page.manage.setting.traceCapture.subTab.trackNetwork')}` = 「追踪网络」，右上关闭 X）。
- 顶部只读网络名：label「追踪网络」+ `:disabled` 的 `NInput` `:value="networkName"`（仅展示，不可编辑）。
- 中部「改造规则」区块（label 走 `transformRules`）：用 naive `NDataTable`（`:columns` / `:data="list"` / `:bordered` / `:single-line` / 无分页）：
  - 列 `oriStr`：`title` = `col.oriStr`，`render` 内 `NInput` `v-model:value="row.oriStr"`（始终可编辑）；
  - 列 `replaceStr`：`title` = `col.replaceStr`，`render` 内 `NInput` `v-model:value="row.replaceStr"`；
  - 列 `action`（`width:80`）：行内「删除」`NButton text type="error"`，`@click` 从 `list` splice 移除该行。
  - 区块右上「+ 添加一行」`NButton`（size small）→ `list.push({ oriStr: '', replaceStr: '' })`。
- 底部：`取消`（`show=false` 放弃本地改动）/ `保存`（`handleSave`）。
- 本地状态：`list = ref<TraceReplaceItem[]>([])`（含 `_id` 的来自接口，空行无 `_id`）。
- `watch(show)`：打开时 `fetchGetTrackReplaceList({ where:{configId}, page:1, size:999 })`，回填 `list`（含 `_id`）；关闭即丢弃（不保存）。
- `handleSave`：过滤 `oriStr` 与 `replaceStr` 均为空的行（宽松规则）→ `fetchBatchSaveTrackReplace({ configId, list })`；成功 `window.$message.success($t('common.saveSuccess'))`、`show=false`；失败（error）不关弹窗。

> 说明：弹窗内小表格用 naive `NDataTable`（而非 `Table`/`useVxeTable`），因为无分页、无列设置、需单元格始终可编辑——`Table` 的列 `type` 体系与内联 `NInput` 插槽不契合，朴素 `NDataTable` 更轻更可控。

### 5. i18n（zh-cn / en-us / `typings/app.d.ts` 三处同步）

`page.manage.setting.traceCapture` 段新增：

```ts
traceInfoTransform: '轨迹信息改造' / 'Trace Info Transform';
transformRules: '改造规则' / 'Transform Rules';
col.oriStr: '原始字符串' / 'Original String';
col.replaceStr: '替换字符串' / 'Replace String';
addRuleRow: '添加一行' / 'Add Row';
save: '保存' / 'Save';   // 若 common.save 已存在则复用，不新增
```

检查：现有 `common.save` 是否已存在；存在则复用。

## 不改动

- 「轨迹改造」tab（异常状态定义表，与本次重名但无关）、轨迹关键词、抓取时间、操作轨迹 4 个 tab；
- `track-config` 现有 CRUD、`TraceConfig*` 类型；
- 后端 `tms-user` 任何代码；
- 路由 / 菜单 / elegant 生成物。

## 验证

- `pnpm typecheck` 0 错误；
- `pnpm lint`（oxlint + eslint）0 error，`pnpm fmt` 已格式化（`git diff --exit-code` 通过）；
- `pnpm build` 通过；
- 本地无后端会话，最终视觉效果由用户确认（如有后端可 playwright 登录实测弹窗增删改保存）。
