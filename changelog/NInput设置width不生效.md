# NInput 设置 width 不生效

> 日期：2026-09-16
> 来源：用户「`<NInput v-model="searchParams.keyword" class="w-100px" placeholder="关键词搜索"></NInput>` 这个设置 width 怎么不生效」

## 根因（必然复现，非偶发）

- Naive UI 的 `NInput` 根元素 `.n-input` 自带 `width: 100%`（设计上宽度由外层决定）。
- UnoCSS 的 `.w-100px { width: 100px }` 与它同为单类选择器（特异性 0,1,0），胜负只看样式表先后顺序。
- 本项目注入顺序固定：`uno.css` 在 `src/plugins/assets.ts` 应用启动早期静态 import，而 naive-ui 样式是组件挂载时按需动态插入 `<head>`（永远更晚）→ `.n-input { width: 100% }` 恒覆盖 `w-100px`。

## 解法（按推荐排序）

1. **内联样式**（最直观、必定生效）：`:style="{ width: '100px' }"`
2. **UnoCSS important 后缀**：`class="w-100px!"`（UnoCSS 66 trailing `!` 语法）
3. **外包一层 div 控宽**：`<div class="w-100px"><NInput /></div>`

## 补充注意

- 搜索栏容器是 flex（`flex-y-center gap-*`）时，输入框设了固定宽度后空间不足会被 `flex-shrink: 1` 压缩，必要时加 `shrink-0`。
- 结论适用面：所有 naive 组件根元素自带 `width: 100%` 类样式（NInput/NSelect/NDatePicker 等），用 UnoCSS 宽度类覆盖都会遇到同样问题，解法通用。
