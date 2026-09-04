# 录单格式「字段映射」高度自适应占满 — 设计

日期：2026-09-04

## 1. 背景与现状

渲染链路：

```
views/system-manage/setting/index.vue（NTabs + component）
  └─ modules/InputFormat.vue
       └─ components/MasterDetail.vue（左侧列表 + 右侧卡片，右侧内容走 default slot）
            └─ components/FieldMapping.vue
```

`MasterDetail.vue` 右侧结构（现状）：

```
NCard（content: flex column, min-height:0）
  ├─ 操作栏（可选）
  └─ NScrollbar（class="min-h-0 flex-1"）
       └─ div（class="min-w-full px-16px py-16px"）
            └─ <slot />   ← NFormWrap + FieldMapping
```

- `NScrollbar` 的 content 没有 `min-height`，slot 内元素只能按自然高度排布，剩余空间表现为**底部留白**。
- 字段多时是**整页滚动**（外层 NScrollbar 滚），而不是字段映射卡片自己滚。
- `FieldMapping` 目前是普通 `NCard`（`class="mt-16px"`），高度完全由内容决定。

## 2. 目标

在**录单格式**页（`InputFormat.vue`）：

1. 基础信息表单（`NFormWrap`）保持自然高度；
2. 字段映射卡片吃掉右侧剩余高度，字段少时也不留底部空白；
3. 字段多 / 窗口变矮时，**只在字段映射卡片内部滚动**，整页不滚动；
4. 其它页面行为与视觉**零变化**。

## 3. 方案对比

| 方案          | 做法                                                                                                                                                                                                                                 | 取舍                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **A（选定）** | `MasterDetail` 仅让 slot 容器"高度不足时撑满、超出时仍整页滚"（`NScrollbar` 的 content 加 `min-h-full flex-col`，内部 div 加 `flex-1 flex-col`），**不新增 prop**；"谁去占满"交给页面自己的卡片：`FieldMapping` 新增可选 `fill` prop | 壳里无 `v-if` 分支、无开关；非 `fill` 页面的子元素仍是自然高度，视觉零变化；将来任何页面想占满只需给自己的卡片加 `fill` |
| B             | `MasterDetail` 新增 `contentFill` prop，`true` 时移除外层 `NScrollbar`，slot 直接 `h-full flex-col`                                                                                                                                  | 语义明确，但通用壳多一个开关 + 一条分支，且 `fill` 页面内容超高时要自己兜滚动                                           |
| C             | `InputFormat` 不用 `MasterDetail` 的右侧 slot，自己复制一套右侧布局                                                                                                                                                                  | 破坏复用，不采用                                                                                                        |

## 4. 选定方案 A 的改动点

### 4.1 `src/views/system-manage/setting/components/MasterDetail.vue`

右侧内容区：

```vue
<NScrollbar class="min-h-0 flex-1" content-class="min-h-full flex-col">
  <div class="min-w-full flex-1 flex-col px-16px py-16px">
    <slot />
  </div>
</NScrollbar>
```

- `min-h-full`：`min-height: 100%`，内容不足时撑满容器，超出时自然增高（滚动仍由 `NScrollbar` 的 container 负责，不会截断）。
- 内部 div 用 `flex-1` 被拉伸吃掉这份高度，并作为 flex column 容器，让 slot 里的卡片能 `flex:1`。
- 不加任何 prop、不加 `v-if`；其它页面（打印/导出格式、通知配置、初始数据、站点扫描、WaybillRule）的子元素没有 `flex-1`，自然高度 + 顶部排列，与现状一致。

### 4.2 `src/views/system-manage/setting/components/FieldMapping.vue`

新增可选 prop `fill?: boolean`（默认 `false`）：

- `fill === true` 时：
  - `NCard` 追加 class `flex-1 min-h-0 flex-col`；
  - `content-style` 改为 `{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }`，让卡片内容区吃掉除标题外的剩余高度；
  - 分组勾选区包一层 `NScrollbar`（`class="min-h-0 flex-1"`），溢出时在卡片内部滚动。
- `fill` 为 `false`（其它页面）时：不追加 class、不覆盖 `content-style`，渲染结果与现在完全一致。
- 分组行布局（`w-180px` 标题列 + `NGrid :cols="3"`）不变。

### 4.3 `src/views/system-manage/setting/modules/InputFormat.vue`

- `<FieldMapping ... fill />` 开启占满；
- `<NFormWrap ... class="shrink-0" />`，避免空间不足时表单被压缩；
- 其余逻辑不动。

### 4.4 不改的部分

- 其它 5 个页面（`PrintFormat` / `ExportFormat` / `NotificationConfig` / `InitData` / `StationScan`）的 `FieldMapping` 保持现状，不传 `fill`（右侧内容各页独有，本轮只处理录单格式）。
- 左侧列表、搜索、操作栏、编辑/保存逻辑均不动。
- i18n 无新增文案。

## 5. 验收

- `pnpm typecheck`、`pnpm lint`、`pnpm build` 通过。
- 手动冒烟（录单格式页）：
  1. 选中任意格式 → 字段映射卡片底部撑到右侧卡片底部，无留白；
  2. 把浏览器高度压到很矮 → 只有字段映射卡片内部出现滚动条，整页不滚；
  3. 切换全选/取消勾选、切换左侧列表项 → 布局不跳；
  4. 切到其它 6 个 tab → 与改动前视觉一致。

## 6. 风险与兜底

- `NCard` 根元素是否本身已是 flex column 不确定：显式追加 `flex-col` 兜底，不依赖库内部默认样式。
- 百分比 `min-height` 需要父级有确定高度：`NScrollbar` 的 container 由外层 `flex-1 + min-h-0` 的父容器确定高度，成立。
- `NGrid` 在 flex item 中宽度自适应不变；窄屏仍保持 3 列（与现状一致，不在本轮调整响应式）。
