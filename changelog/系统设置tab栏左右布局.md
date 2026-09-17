# 系统设置 tab 栏左右布局（竖向）

> 2026-09-17 · 用户：「系统设置帮我把ttab栏和内容改成左右布局tab栏改成竖向的」

## 现状

`src/views/system-manage/setting/index.vue` 原为「顶部 NCard 包水平 NTabs + 下方内容区」：

- script：`tabs` 六项、`activeKey`、`syncTabFromQuery()`（`?tab=` 路由参数，标签设计页「返回上一页」用）、`componentMap` + KeepAlive 动态渲染。
- 模板：外层 `flex-col`，`NCard.mb-16px` 内 `NTabs` + 空壳 `NTabPane`（仅当 tab 头），下方 `min-h-0 flex-1` 渲染 `activeComponent`。

## 方案选择（用户选定 B）

| 方案                 | 说明                                                                                                               | 结论           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------- |
| A 自定义菜单卡片     | 左卡片块状菜单项（hover 高亮、激活主题色背景），复用 `MasterDetail` 视觉                                           | 未选           |
| B 原生竖向 NTabs     | `NTabs placement="left" type="line"`，文字竖排 + 左侧主题色竖线，改动最小                                          | **用户选定**   |
| C 单张大卡片内部分栏 | 整页一张大卡片内部左右分栏；但各子模块（InitData/TraceCapture 等）本身是全高卡片，会卡片套卡片，需连带改子模块样式 | 否决（改动大） |

## 实施（仅改 setting/index.vue 模板，script 零改动）

```html
<div class="h-full w-full flex gap-8px overflow-hidden p-16px">
  <!-- 左：竖向 tab 栏 -->
  <NCard class="h-full" :content-style="{ padding: '8px' }">
    <NTabs placement="left" type="line" :value="activeKey" @update:value="handleTabChange">
      <NTab v-for="t in tabs" :key="t.key" :name="t.key">{{ t.label }}</NTab>
    </NTabs>
  </NCard>
  <!-- 右：内容区（KeepAlive + componentMap 动态渲染） -->
  <div class="min-w-0 min-h-0 flex-1">
    <KeepAlive>
      <component :is="activeComponent" />
    </KeepAlive>
  </div>
</div>
```

关键决策：

1. **`NTab` 替代空壳 `NTabPane`**：NTab 是纯 tab 头，不产生右侧 pane 内容区容器，内容渲染完全由 `componentMap` + KeepAlive 控制，无冗余 DOM。
2. **左侧包一张 NCard**：与右侧各子模块本身的全高卡片视觉统一；`gap-8px` 间距与项目内 `MasterDetail` 左右布局一致。
3. **保留用户手动加的 `p-16px`**：实施时首次编辑失配，重读发现用户已把外层 `p-0` 改为 `p-16px`，重读后保留其改动再编辑。
4. `?tab=` 同步、KeepAlive、i18n、6 个子模块组件均不动。

## 验证

- `read_lints`：0 错误。
- `pnpm typecheck`：通过（exit 0）。
- 视觉效果待用户复核。

## 排查与修复：右侧内容区空白（同日追加）

用户反馈改完后右侧空白。用 playwright 连上 dev（实际监听端口 9111，非 9527）实测定位。

**根因**：naive-ui `.n-card` 根元素自带 `width: 100%`。NCard 直接作为 flex item 时 `flex-basis: auto` 解析为容器全宽——实测 NCard 宽 1020px、右侧内容区宽 0px（DOM 已渲染，只是被挤成 0 宽）；而右侧 `flex-1`（`flex: 1 1 0%`）basis 为 0、收缩权重 0，被完全挤没。项目内 `MasterDetail` 未踩坑，是因为它用「div 包裹 + NCard」的范式。

**修复**：左侧 NCard 外包一层 `<div class="h-full w-fit">` 控制宽度（实测 NCard 133px、右侧恢复 886px），跟随 MasterDetail 范式。

**连带修复**：右侧变窄后，`FieldMapping.vue`（录单格式页「字段映射」卡片）标题被 header-extra 的 5 个分组按钮挤成 0 宽竖排——naive `.n-card-header__main` 为 `flex: 1 1 0`（可被压到 0），extra 内容（按钮组）占满 header 内容宽。修复 = `FieldMapping.vue` 加 scoped 样式 `:deep(.n-card-header__main) { flex: none !important; }`：

1. 直接 `:deep(.n-card-header__main)` 编译为 `[data-v] .n-card-header__main`（特异性 0,2,0），低于 naive 原生 `.n-card > .n-card-header .n-card-header__main`（0,3,0），不生效；
2. 改 `:deep(.n-card > .n-card-header .n-card-header__main)` 又因 `.n-card` 自身才是带 `data-v` 的组件根（不是 `[data-v]` 的后代）不匹配；
3. 故用 `!important` 覆盖（与侧栏底部用户区覆盖 naive 的既有先例一致）。

**复测**：6 个 tab 全部 rightW=886、无零宽标题；`read_lints` 0 / `pnpm typecheck` 0。排查用截图等临时文件已清理。

## 迭代：左侧改「侧栏式」竖向 tab 栏（同日追加）

用户：「左侧如果不使用 card 呢？能不能自适应屏幕高度」→ 澄清后选定「带背景/分割线的侧栏」（无卡片外框、整列撑满屏幕、浅背景 + 右侧 1px 分割线、tab 项紧凑排顶部）。

### 改动 1：setting/index.vue —— 去掉 NCard，左侧改贴边侧栏

```html
<div class="h-full w-full flex overflow-hidden">
  <!-- 左：侧栏式竖向 tab 栏（贴边、整列撑满屏幕高、浅背景 + 右侧分割线；外包 div 同时挡住 naive .n-tabs 的 width:100%） -->
  <div class="h-full w-fit shrink-0 border-r border-#e5e7eb bg-container px-8px py-8px dark:border-#2a2a2a">
    <NTabs placement="left" type="line" :value="activeKey" @update:value="handleTabChange">
      <NTab v-for="t in tabs" :key="t.key" :name="t.key">{{ t.label }}</NTab>
    </NTabs>
  </div>
  <!-- 右：内容区（KeepAlive + componentMap 动态渲染） -->
  <div class="min-w-0 min-h-0 flex-1 overflow-hidden p-16px">
    <KeepAlive>
      <component :is="activeComponent" />
    </KeepAlive>
  </div>
</div>
```

- 侧栏视觉照搬项目 `label-designer` 侧栏范式：`bg-container` + `border-#e5e7eb` / `dark:border-#2a2a2a`，深色主题自动适配。
- 包裹 div 仍然必要：`.n-tabs` 自带 `width:100%`，直接当 flex item 会重现"占满整行"问题。
- 宽度 `w-fit` 随 tab 文字自适应（实测 133px），高度由 `h-full` 链撑满内容区。

### 改动 2：base-layout/index.vue —— 关闭设置页的框架 16px 留白

排查中发现页面根元素的 `p-16px` 不在本页模板里，而是 `GlobalContent` 注入的（`:class="{ 'p-16px': showPadding }"`，`showPadding` 默认 true）；`base-layout` 已有 `contentShowPadding` 按路由名关闭的既有机制（打印设计页在用）。按该机制扩展：

```ts
// 打印设计页是整屏设计器、系统设置页左侧为贴边侧栏，去掉 content 区域默认的 16px 外边距让其占满可视区
const route = useRoute();
const contentShowPadding = computed(
  () => !['system-manage_print-design', 'system-manage_setting'].includes(route.name as string)
);
```

### 实测（playwright）

- 侧栏 680px 撑满内容区、贴顶（y=40）/贴左（x=220）/贴底（y=720）；右侧内容区 927px 带 16px 内边距；
- 6 个 tab 全部正常（侧栏 680/右侧 927/无零宽标题）；
- 回归：user 页 padding 16px、print-design 页 0px 均不变；
- `read_lints` 0 / `pnpm typecheck` 0。

## 微调：右侧内容区贴住分割线（同日追加）

用户截图红框标出「侧栏分割线右侧的 16px 留白条」并要求："这里直接贴边"。

- 实测定位：侧栏右边缘 x=353、右侧内容区第一个卡片左边缘 x=369（gap=16px，来自右侧 div 的 `p-16px` 左内边距）。
- 改动：右侧 div `p-16px` → `py-16px pr-16px`（去掉左内边距；上/右/下 16px 保留）。
- 复测：卡片左边缘 = 353（gap=0）；6 个 tab 全部贴边、右侧 927px；`read_lints` 0。
