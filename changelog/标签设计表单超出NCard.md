# 标签设计表单超出NCard

> 日期：2026-09-12
> 模块：`src/views/system-manage/label-designer/modules/property-panel.vue`
> 关联：`src/components/Form/index.vue`（FormWrap，本次未改动）

## 问题

标签设计器右侧属性面板中，「位置与尺寸」等卡片的表单输入框（X/Y/宽/高）明显超出 `NCard` 边界，Y 列输入框伸到卡片外。

## 根因定位

`FormWrap` 内部渲染 `NGrid :cols="24" :x-gap="16"`。naive-ui 的 `NGrid` 是真 CSS Grid（源码 `Grid.mjs`）：

```js
style: {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: `repeat(${responsiveColsRef.value}, minmax(0, 1fr))`,
  columnGap: pxfy(responsiveXGapRef.value),
  ...
}
```

关键机制：

1. `cols=24` 会**真建 24 条网格轨道**，`x-gap=16` 落在轨道**之间**，产生 **23 个间隙 = 368px 固定开销**。该开销与表单项占几列（span）无关——即使每个字段独占一行也一样。
2. 属性面板宽 300px，`NCard` 内容区约 250px < 368px → 24 条轨道全部被压成 0 宽（`minmax(0, 1fr)` 的下限是 0）。
3. 轨道为 0 宽后，每个 `span=12` 的 `NGi` 仍要跨越 12 条轨道之间的 **11 个间隙 ≈ 176px**，于是按 176px 一格画出卡片，输入框随之溢出。

这解释了截图中的细节：number 输入框（NInputNumber 带 − + 按钮，固有宽度大）所在卡片溢出更明显；控件本身均已 `w-full` / `min-width: 0`，任何控件级 `max-width` 都无效，因为溢出的是 grid 盒子自身的间隙开销，不是某个控件太宽。

### 排除项

- 全局无针对 `.n-grid` / `.n-input-number` / `.n-card` 的样式覆盖（仅 `property-panel.vue` 自己的 scoped 样式）。
- 外层 flex 布局（`index.vue` 的 `w-300px` 面板）工作正常，问题不出在面板宽度分配。
- `property-panel.vue` scoped 样式中的 `:deep(.n-grid-item)` 是无效死代码——naive 的 `GridItem` 渲染出的 div **没有 class**，如需选中应写 `:deep(.n-grid > div)`（本次未动）。

### 实证方式

用纯 CSS 复现页（等价 naive 的 DOM 与内联样式）做了对照：同一 300px 面板下，`column-gap: 16px` 溢出、`8px` 正常，其余完全一致，现象与线上一致。

## 方案讨论

| 方案                                             | 结论                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| A. 局部 gutter 化（网格负 margin + NGi padding） | 视觉不变但属于布局结构改动，用户明确不要改布局                               |
| B. 全局改 FormWrap 的 gap 机制                   | 影响所有表单页面，回归成本高，放弃                                           |
| C. 面板加宽到 ~430px 以上                        | 治标不治本，挤压画布，放弃                                                   |
| D. **调小 `grid-x-gap`（16 → 8）**               | **采纳**：纯 prop 传参，不动 DOM/CSS/结构，两列布局与外观不变，仅列间距 16→8 |

## 最终修复

`property-panel.vue` 三个 `NFormWrap` 各加 `:grid-x-gap="8"`，并附一行原因注释：

```vue
<NFormWrap :model="model" :items="geoItems" label-placement="top" grid-responsive="self" :grid-x-gap="8" />
```

数学验证：23 × 8 = 184px 开销 < 250px 内容区，轨道宽 (250−184)/24 ≈ 2.75px，`span=12` 格子 = 12×2.75 + 11×8 ≈ 121px，两列正常显示。

## 影响面

仅标签设计器属性面板。`FormWrap` 与其他页面表单未动。
