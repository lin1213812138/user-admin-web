# 追踪网络「轨迹信息改造」Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「追踪网络」列表每行增加「轨迹信息改造」入口，弹出弹窗按网络配置轨迹字符串替换规则（原始字符串 → 替换字符串），保存一次性提交到后端 `/track-replace/batch/save`。

**Architecture:** 前端新增 `service/api/track-replace` 真实请求（后端已就绪，无 DEV mock），新增 `TrackReplaceModal.vue`（`NModal` + naive `NDataTable` 内联可编辑规则表），在 `TrackNetworkTable.vue` 操作列平铺三按钮接入口。i18n 与类型三处同步。后端零改动。

**Tech Stack:** Vue 3.5 `<script setup lang="ts">`、Naive UI 2.44（`NModal`/`NDataTable`/`NInput`）、`@sa/axios` `createFlatRequest`（解包 `{ data, error }`）、TypeScript 6 strict。

## Global Constraints

- 项目无测试框架，**不要臆造单测**；每个任务验证手段为 `pnpm typecheck` + `pnpm lint` + `pnpm fmt` + `pnpm build`。
- 包管理只能用 pnpm；禁止 `npm`/`yarn`。Node.js >= 20.19.0，pnpm >= 10.5.0。
- 提交用 `pnpm commit`（Conventional Commits），**禁止直接 `git commit`**（`commit-msg` 钩子校验）。
- i18n 改动必须在 `src/locales/langs/zh-cn.ts`、`src/locales/langs/en-us.ts`、`src/typings/app.d.ts` **三处同步**，否则 `vue-tsc` 报 TS2353/TS2345。
- 新增组件文件**禁止命名为 `index.vue`**（elegant-router 会误扫成路由）；不改路由/菜单/elegant 生成物。
- 后端接口真实存在（tms-user `/track-replace/*`），前端**无 DEV mock**。
- `track-replace` 模型字段：`configId / oriStr / replaceStr / creatorId / creator / createDate / updateDate`；`batch/save` 入参 `{ configId, list:[{_id?, oriStr, replaceStr}] }`，按 `_id` 差集增删改。

---

### Task 1: 类型声明

**Files:**

- Modify: `src/typings/api/system-manage.d.ts`（在 `TraceConfigUpdateParams` 之后，约 908 行）

**Interfaces:**

- Produces: `Api.SystemManage.TraceReplaceItem`、`Api.SystemManage.TraceReplaceList`、`Api.SystemManage.TraceReplaceBatchSaveParams`（后续 service 与组件依赖）。

- [ ] **Step 1: 在 `TraceConfigUpdateParams` 后追加类型**

```ts
/** 轨迹信息改造规则（track-replace 模型，按 configId 归属某个追踪网络；oriStr/replaceStr 均可空，保存时过滤空行） */
interface TraceReplaceItem {
  /** 已有规则有；新增空行无 */
  _id?: string;
  /** 原始字符串 */
  oriStr?: string;
  /** 替换字符串（可空=删除原串） */
  replaceStr?: string;
  /** 创建人（来自后端，只读展示） */
  creator?: string;
}

/** 改造规则查询返回（/track-replace/query 全量返回，size 拉满） */
type TraceReplaceList = { list: Api.SystemManage.TraceReplaceItem[] };

/** 批量保存入参（与后端 /track-replace/batch/save 对齐） */
type TraceReplaceBatchSaveParams = {
  /** 所属追踪网络 _id */
  configId: string;
  /** 规则列表（无 _id=新增，带 _id=更新；本地删除即从数组移除，后端按 _id 差集删除） */
  list: Api.SystemManage.TraceReplaceItem[];
};
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck`
Expected: 0 错误（仅新增类型，无引用报错）。

- [ ] **Step 3: 提交**

```bash
pnpm commit
```

Message: `feat(setting): add TraceReplace types for track-network transform rules`

---

### Task 2: 接口层 `service/api/track-replace`

**Files:**

- Create: `src/service/api/track-replace/index.ts`

**Interfaces:**

- Consumes: `request` from `@/service/request`（与 `src/service/api/track-config/index.ts` 同款，flat request 解包 `{ data, error }`）。
- Produces: `fetchGetTrackReplaceList(params)`、`fetchBatchSaveTrackReplace(params)`（Task 4 弹窗调用）。

- [ ] **Step 1: 新建 `track-replace/index.ts`**

```ts
import { request } from '../../request';

/**
 * 轨迹信息改造规则接口（系统设置 → 轨迹抓取 → 追踪网络 → 轨迹信息改造），对应 tms-user /track-replace/*（模型：track-replace）。
 * tms-user 真实接口，无 DEV mock。flat request，调用方需解包 { data, error }。
 */

/** 按 configId 拉取该追踪网络全部改造规则（单网络规则量小，size 拉满） */
export function fetchGetTrackReplaceList(params: { where: { configId: string }; page?: number; size?: number }) {
  return request<Api.SystemManage.TraceReplaceList>({
    url: '/track-replace/query',
    method: 'post',
    data: params
  });
}

/** 批量保存（增/删/改一步到位，后端按 _id 差集处理） */
export function fetchBatchSaveTrackReplace(params: Api.SystemManage.TraceReplaceBatchSaveParams) {
  return request<boolean>({ url: '/track-replace/batch/save', method: 'post', data: params });
}
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck`
Expected: 0 错误。

- [ ] **Step 3: 提交**

```bash
pnpm commit
```

Message: `feat(setting): add track-replace service (query + batch save)`

---

### Task 3: i18n 三处同步

**Files:**

- Modify: `src/locales/langs/zh-cn.ts`（`traceCapture` 段，约 782 行起）
- Modify: `src/locales/langs/en-us.ts`（`traceCapture` 段，约 786 行起）
- Modify: `src/typings/app.d.ts`（`traceCapture` 段，约 1043 行起）

**Interfaces:**

- Produces: i18n key：`page.manage.setting.traceCapture.traceInfoTransform`、`transformRules`、`col.oriStr`、`col.replaceStr`、`addRuleRow`（Task 4 弹窗与 Task 5 入口按钮使用）。
- 复用既有 `common.save` / `common.cancel` / `common.saveSuccess` / `common.delete`（SoybeanAdmin 默认存在，不新增）。

- [ ] **Step 1: zh-cn.ts —— `traceCapture` 段 `subTab` 同级追加键**

在 `traceCapture: {` 内、`subTab: {` 之后插入（与 `title` 平级）：

```ts
          traceInfoTransform: '轨迹信息改造',
          transformRules: '改造规则',
          addRuleRow: '添加一行',
```

在 `col: {` 块内（如 `waybillStatus: '运单状态'` 之后）追加：

```ts
            oriStr: '原始字符串',
            replaceStr: '替换字符串',
```

- [ ] **Step 2: en-us.ts —— 同样位置追加**

`traceCapture` 段（与 `title` 平级）：

```ts
          traceInfoTransform: 'Trace Info Transform',
          transformRules: 'Transform Rules',
          addRuleRow: 'Add Row',
```

`col: {` 块内追加：

```ts
            oriStr: 'Original String',
            replaceStr: 'Replace String',
```

- [ ] **Step 3: app.d.ts —— `traceCapture` Schema 同步**

`traceCapture: {` 内（与 `title: string;` 平级）追加：

```ts
traceInfoTransform: string;
transformRules: string;
addRuleRow: string;
```

`col: {` 块内（如 `waybillStatus: string;` 之后）追加：

```ts
oriStr: string;
replaceStr: string;
```

- [ ] **Step 4: 类型检查（三处不一致会在此暴露）**

Run: `pnpm typecheck`
Expected: 0 错误。

- [ ] **Step 5: 提交**

```bash
pnpm commit
```

Message: `feat(setting): i18n for track-network trace info transform`

---

### Task 4: 弹窗组件 `TrackReplaceModal.vue`

**Files:**

- Create: `src/views/system-manage/setting/modules/trace-capture/track-network/TrackReplaceModal.vue`

**Interfaces:**

- Consumes: `Api.SystemManage.TraceReplaceItem` / `TraceReplaceList`（Task 1）；`fetchGetTrackReplaceList` / `fetchBatchSaveTrackReplace`（Task 2）；i18n key（Task 3）。
- Produces: `<TrackReplaceModal v-model:show :config-id :network-name />`（Task 5 挂载），通过 `update:show` 关闭。

- [ ] **Step 1: 新建弹窗组件**

```vue
<script setup lang="ts">
import { computed, h, ref, watch } from 'vue';
import { $t } from '@/locales';
import { NButton, NDataTable, NInput } from 'naive-ui';
import { fetchBatchSaveTrackReplace, fetchGetTrackReplaceList } from '@/service/api/track-replace';

const props = withDefaults(defineProps<{ show?: boolean; configId?: string; networkName?: string }>(), {
  show: false,
  configId: '',
  networkName: ''
});

const emit = defineEmits<{ 'update:show': [value: boolean] }>();

const visible = computed({ get: () => props.show, set: val => emit('update:show', val) });
const list = ref<Api.SystemManage.TraceReplaceItem[]>([]);
const saving = ref(false);

const columns = [
  {
    title: $t('page.manage.setting.traceCapture.col.oriStr'),
    key: 'oriStr',
    render: (row: Api.SystemManage.TraceReplaceItem) =>
      h(NInput, {
        value: row.oriStr ?? '',
        'onUpdate:value': (v: string) => {
          row.oriStr = v;
        }
      })
  },
  {
    title: $t('page.manage.setting.traceCapture.col.replaceStr'),
    key: 'replaceStr',
    render: (row: Api.SystemManage.TraceReplaceItem) =>
      h(NInput, {
        value: row.replaceStr ?? '',
        'onUpdate:value': (v: string) => {
          row.replaceStr = v;
        }
      })
  },
  {
    title: $t('common.delete'),
    key: 'action',
    width: 80,
    align: 'center',
    render: (row: Api.SystemManage.TraceReplaceItem) =>
      h(
        NButton,
        {
          text: true,
          type: 'error',
          onClick: () => {
            const idx = list.value.indexOf(row);
            if (idx > -1) list.value.splice(idx, 1);
          }
        },
        { default: () => $t('common.delete') }
      )
  }
];

watch(
  () => props.show,
  async val => {
    if (!val || !props.configId) return;
    const { data, error } = await fetchGetTrackReplaceList({
      where: { configId: props.configId },
      page: 1,
      size: 999
    });
    if (error || !data) {
      list.value = [];
      return;
    }
    list.value = data.list.map(item => ({ ...item }));
  }
);

function addRow() {
  list.value.push({ oriStr: '', replaceStr: '' });
}

async function handleSave() {
  if (!props.configId) return;
  const payload = list.value.filter(r => (r.oriStr ?? '').trim() || (r.replaceStr ?? '').trim());
  saving.value = true;
  try {
    const { error } = await fetchBatchSaveTrackReplace({ configId: props.configId, list: payload });
    if (error) return;
    window.$message?.success($t('common.saveSuccess'));
    visible.value = false;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    :title="$t('page.manage.setting.traceCapture.subTab.trackNetwork')"
    style="width: 640px"
  >
    <div class="mb-12px flex items-center gap-12px">
      <span class="shrink-0 text-14px">{{ $t('page.manage.setting.traceCapture.subTab.trackNetwork') }}：</span>
      <NInput :value="networkName" disabled />
    </div>
    <div class="mb-12px flex items-center justify-between">
      <span class="font-medium">{{ $t('page.manage.setting.traceCapture.transformRules') }}</span>
      <NButton size="small" type="primary" @click="addRow">
        {{ $t('page.manage.setting.traceCapture.addRuleRow') }}
      </NButton>
    </div>
    <NDataTable :columns="columns" :data="list" :bordered="false" />

    <template #footer>
      <div class="flex justify-end gap-12px">
        <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="saving" @click="handleSave">{{ $t('common.save') }}</NButton>
      </div>
    </template>
  </NModal>
</template>
```

- [ ] **Step 2: 类型检查与 lint**

Run: `pnpm typecheck && pnpm lint`
Expected: 0 错误（`NDataTable`/`NInput`/`NModal` 由 naive-ui 解析器自动引入）。

- [ ] **Step 3: 提交**

```bash
pnpm commit
```

Message: `feat(setting): add TrackReplaceModal for trace info transform rules`

---

### Task 5: 入口接入 `TrackNetworkTable.vue`

**Files:**

- Modify: `src/views/system-manage/setting/modules/trace-capture/track-network/TrackNetworkTable.vue`

**Interfaces:**

- Consumes: `TrackReplaceModal`（Task 4，props `show`/`configId`/`networkName`，emit `update:show`）。
- Produces: 操作列三按钮（编辑 / 轨迹信息改造 / 删除）平铺；弹窗本地状态。

- [ ] **Step 1: 引入弹窗并加本地状态**

在 `<script setup>` 顶部 import 区追加：

```ts
import TrackReplaceModal from './TrackReplaceModal.vue';
```

在 `drawerVisible` 等本地状态附近追加：

```ts
const replaceVisible = ref(false);
const replaceRow = ref<Api.SystemManage.TraceConfigItem | null>(null);

function openReplace(row: Api.SystemManage.TraceConfigItem) {
  replaceRow.value = row;
  replaceVisible.value = true;
}
```

- [ ] **Step 2: 操作列改三按钮**

将现有 `#action` 插槽替换为（保留 `openEdit` / `handleDelete` 不变）：

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

- [ ] **Step 3: 模板挂载弹窗**

在 `<TrackNetworkDrawer ... />` 之后追加：

```vue
<TrackReplaceModal
  v-model:show="replaceVisible"
  :config-id="replaceRow?._id ?? ''"
  :network-name="replaceRow?.name ?? ''"
/>
```

- [ ] **Step 4: 类型检查 / lint / fmt / build**

Run: `pnpm typecheck && pnpm lint && pnpm fmt && pnpm build`
Expected: 全部 0 错误 / Build successful。

- [ ] **Step 5: 提交**

```bash
pnpm commit
```

Message: `feat(setting): wire trace info transform entry into track-network table`

---

### Task 6: 全量验证

**Files:** 无新增，回归全仓库。

- [ ] **Step 1: typecheck + lint + build 全绿**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: 0 错误，Build successful。

- [ ] **Step 2: fmt 已执行且 diff 干净**

Run: `pnpm fmt`
Expected: 无格式改动（或仅本次文件），`git diff --exit-code` 通过 pre-commit 要求。

- [ ] **Step 3: 提交（若前序任务未逐任务提交，则此处统一提交）**

```bash
pnpm commit
```

Message: `chore(setting): finalize track-network trace info transform`

---

## Self-Review

1. **Spec coverage:**
   - 入口三按钮平铺 → Task 5 ✓
   - 弹窗（NModal + 只读网络名 + 改造规则 NDataTable + 添加一行 + 行内删除 + 取消/保存）→ Task 4 ✓
   - 单元格始终可编辑、末尾统一保存 → Task 4 `columns.render` + `handleSave` ✓
   - 仅本地增删改、保存整表提交 → Task 4 `watch(show)` 拉取、`handleSave` 整表提交 ✓
   - 两字段可空、保存过滤空行 → Task 4 `payload = list.filter(...)` ✓
   - 后端零改动、无 DEV mock、flat 解包 → Task 2 ✓
   - 类型 / service / i18n 三处同步 → Task 1 / 2 / 3 ✓
   - 不改其余 4 tab / 路由 / 菜单 → 全计划未涉及 ✓
2. **Placeholder scan:** 无 TBD/TODO/"implement later"；各代码步均给出完整片段。
3. **Type consistency:** `TraceReplaceItem`/`TraceReplaceList`/`TraceReplaceBatchSaveParams` 在 Task1 定义，Task2/4 引用一致；`fetchGetTrackReplaceList`/`fetchBatchSaveTrackReplace` 签名 Task2 定义、Task4 使用一致；i18n key 在 Task3 定义、Task4/5 使用一致。无命名漂移。
