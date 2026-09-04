# 设置页占位内容清理设计（只保留录单格式）

日期：2026-09-04
范围：`src/views/system-manage/setting/modules/` 下 5 个页面

## 背景

系统设置页共 7 个 tab，其中 5 个用 `MasterDetail`（左列表 + 右内容）：

| tab key             | 组件                     | 右侧内容                          |
| ------------------- | ------------------------ | --------------------------------- |
| input-format        | `InputFormat.vue`        | **真实**字段映射（5 组 21 项）    |
| print-format        | `PrintFormat.vue`        | 已整块注释                        |
| export-format       | `ExportFormat.vue`       | 模板复制的占位数据                |
| notification-config | `NotificationConfig.vue` | 模板复制的占位数据                |
| init-data           | `InitData.vue`           | 模板复制的占位数据                |
| station-scan        | `StationScan.vue`        | 模板复制的占位数据                |
| waybill-rule        | `WaybillRule.vue`        | 无（Table 页面，非 MasterDetail） |

除 `InputFormat.vue` 外，其余 5 个页面的右侧「基本信息表单 + 字段映射卡片」全部是从同一模板复制的假数据
（字段映射都是 `waybill` 4 项 + `goods` 3 项的同一套占位值）。继续展示会让人误以为功能已完成。

本次清理目标：**除录单格式外，其余 5 个页面的右侧内容清空，改为明确的「敬请期待」空状态。**

## 已确认决策

| 决策点         | 结论                                                   |
| -------------- | ------------------------------------------------------ |
| 清空范围       | 右侧**表单 + 字段映射全删**，改放空状态组件            |
| 空状态展示     | 复用现有 `LookForward` 组件（不新增文案 / 不新增组件） |
| 左侧列表       | **保留**，可看、可搜索、可点击切换选中                 |
| 列表三按钮     | **全部隐藏**（`:show-actions="false"`）                |
| `MasterDetail` | **不改动**                                             |

## 为什么列表三按钮必须隐藏

这是本次改动唯一的联动死结，不处理会直接产生 bug。

`MasterDetail` 的顶部操作栏由 `showActions` 决定渲染，栏内三个按钮又都挂在 `v-if="editable"` 上：

```97:126:src/views/system-manage/setting/components/MasterDetail.vue
        <div v-if="showActions" class="flex items-center justify-between px-16px py-12px border-b-1 border-[#ebeef5]">
          <slot name="header">
            <NSpace>
              <NButton v-if="editable" type="primary" ghost size="small" @click="emit('create')">
```

而各页面传的是 `:editable="!isEditing"`。链路如下：

```
点「新建/编辑」→ isEditing = true → editable = false → 三按钮隐藏 + 列表不可点选
                                                    ↓
                                   出口是 #operation-extra 里的「保存 / 取消」
```

右侧清空后「保存 / 取消」随之删除，**点一次新建就会把列表永久锁死**（既不能取消，也不能再选其它项）。

因此三按钮一并隐藏，而不是保留按钮改行为。后续这些页面正式开发时，把 `:show-actions` 改回 `true` 即可。

## 空状态组件

直接复用 `src/components/custom/look-forward.vue`：

```vue
<div class="size-full min-h-520px flex-col-center gap-24px overflow-hidden">
  <div class="flex text-400px text-primary"><SvgIcon local-icon="expectation" /></div>
  <slot><h3 class="text-28px text-primary font-500">{{ $t('common.lookForward') }}</h3></slot>
</div>
```

三点便利，因此**零新增代码**即可用：

1. 已在 `src/typings/components.d.ts` 注册，自动按需引入，模板里直接写 `<LookForward />`。
2. i18n 三处齐全：`zh-cn.ts` `'敬请期待'` / `en-us.ts` `'Coming soon'` / `app.d.ts` 的 `common.lookForward`。
3. 自带 `size-full min-h-520px flex-col-center`，垂直水平居中，放进 `MasterDetail` 的 slot 无需额外布局处理。

## 逐文件清理清单

5 个页面（`PrintFormat.vue` / `ExportFormat.vue` / `NotificationConfig.vue` / `InitData.vue` / `StationScan.vue`）
执行同一套增删。

### 删除

script 段：

- 导入：`NFormWrap`、`type FormItemConfig`、`FieldMapping`（及 `FieldMappingGroup`）、
  `computed`（`current` 删除后不再需要）、`$t`（若清理后本文件不再使用）
- 类型与常量：`navGroups`、`Item` 接口中的 `scope` / `remark` / `fields` 字段
- 状态：`formModel`、`fieldModel`、`formItems`、`isEditing`、`prevSelectedId`（仅 `InputFormat` 有，不涉及）
- 计算与函数：`current`、`loadCurrent`、`handleCreate`、`handleEdit`、`handleDelete`、
  `handleSave`、`handleCancel`；`StationScan.vue` 的 `handleSelect` 一并删除
- `items` 中各条目的 `scope` / `remark` / `fields` 字段

template 段：

- `MasterDetail` 上的 `:editable` / `@create` / `@edit` / `@delete` 绑定
- `#operation-extra` 插槽（保存 / 取消按钮）
- `<NFormWrap>` 与 `<FieldMapping>` 两处使用；`PrintFormat.vue` 中对应的一整块**注释**也一并删除

### 新增

- `MasterDetail` 上：`:show-actions="false"`
- slot 内容：`<LookForward />`
- `@update:selected-id` 改为内联赋值（原内联写法里的 `loadCurrent()` 调用一并去掉）

### 保留

- `MasterDetail` 的 `list-title` / `search-placeholder` / `:items` / `:show-status="true"` / `:selected-id`
- `items` mock 数据（仅精简字段）
- `selectedId` 与选中切换（保持列表高亮可用）

## 各页差异

| 文件                     | `list-title`       | `show-actions` 现值 | `@update:selected-id` 写法 |
| ------------------------ | ------------------ | ------------------- | -------------------------- |
| `PrintFormat.vue`        | `打印格式列表`     | `false`（已是）     | 内联 + `loadCurrent()`     |
| `ExportFormat.vue`       | `导出格式列表`     | `true`              | 内联 + `loadCurrent()`     |
| `NotificationConfig.vue` | `通知配置列表`     | `true`              | 内联 + `loadCurrent()`     |
| `InitData.vue`           | `初始化数据列表`   | `true`              | 内联 + `loadCurrent()`     |
| `StationScan.vue`        | `站点扫描配置列表` | `true`              | 具名函数 `handleSelect`    |

`search-placeholder` 五页统一为 `搜索列表`，`show-status` 统一为 `true`，均保持原样。

## 目标形态

以 `ExportFormat.vue` 为例，清理后整个文件压到约 25 行：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import MasterDetail from '../components/MasterDetail.vue';

interface Item {
  id: number;
  name: string;
  status: Api.Common.EnableStatus;
}

const items = ref<Item[]>([
  { id: 1, name: '默认导出格式', status: 1 },
  { id: 2, name: '客户导出格式', status: 1 }
]);

const selectedId = ref<number | null>(items.value[0]?.id ?? null);
</script>

<template>
  <MasterDetail
    list-title="导出格式列表"
    search-placeholder="搜索列表"
    :items="items"
    :show-status="true"
    :show-actions="false"
    :selected-id="selectedId"
    @update:selected-id="id => (selectedId = id)"
  >
    <LookForward />
  </MasterDetail>
</template>
```

其余 4 页同构，仅 `list-title` 与 `items` 的 `name` 不同。

## 影响面

- **`FieldMapping` 的使用方由 6 个降为 1 个**（仅 `InputFormat.vue`）。
  因此另一份 spec（`2026-09-04-field-mapping-item-structure-design.md`）里的
  「迁移其余 4 个占位页面」「迁移 PrintFormat.vue 常量」两个任务**随之作废** ——
  这 5 个页面的 `navGroups` 被整体删除，不再需要迁移成 `{ key, label, span }` 结构。
- `PrintFormat.vue` 现存的 6 个 `@typescript-eslint/no-unused-vars` 误报，
  在本次清理后其未使用变量会被删除，**误报可能自然消失**（需在验证阶段确认）。
- `WaybillRule.vue` 是 Table 页面，没有主从结构，不在本次范围。

## 不做的事

- 不改 `MasterDetail.vue`（不新增 prop、不加分支）。
- 不动 `WaybillRule.vue`。
- 不动 `InputFormat.vue`（唯一有真实内容的页面，其字段映射结构改造由另一份 spec 覆盖）。
- 不新增 i18n key（复用 `common.lookForward`）。
- 不新增空状态组件（复用 `LookForward`）。

## 验证

1. `pnpm typecheck` — 0 error。
2. `pnpm lint` — 确认 `PrintFormat.vue` 的 6 个既有误报消失或保持不变，且无新报错。
3. `pnpm build`。
4. 浏览器冒烟（系统设置页逐个 tab 切换）：
   - 录单格式：右侧仍是「表单 + 字段映射」，功能不变；
   - 其余 5 个 tab：右侧显示「敬请期待」，顶部无新建/编辑/删除按钮；
   - 左侧列表可点击切换高亮、搜索框可用；
   - **反复点列表项与切换 tab，确认不会出现列表被锁死（无法点选）的情况**；
   - 切回录单格式，确认 `KeepAlive` 下状态未串（`settings/index.vue` 用了 `<KeepAlive>`）。
