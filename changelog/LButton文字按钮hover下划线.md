# LButton 文字按钮 hover 下划线

日期：2026-09-20
相关 spec：`docs/superpowers/specs/2026-09-20-lbutton-text-hover-underline-design.md`

## 背景

用户贴收货渠道列表操作列截图（编辑 / 禁用 / 绑定录单格式 / 删除）并问：「LButton 组件，如果加了 text，能不能 hover 的时候显示下划线」。

## 定位（为什么 naive-ui 做不到，只能在封装层做）

1. `src/components/basic/LButton.vue` 是 `NButton` 的纯封装：`text` 在 `Props` 中显式声明后随 `buttonProps` 的 rest 原样透传，组件自身 `<style scoped>` 原本为空。
2. naive-ui 的 `NButton` 根元素类名只有 `n-button--{type}-type` / `n-button--{size}-type` / `n-button--disabled` 等（`naive-ui/es/button/src/Button.mjs:456`），**`text` 模式不产生任何专属类名**，也没有对应 `--n-*` 变量 ⇒ 无法用纯 CSS 只命中 text 按钮。
3. 按钮根元素自带 `text-decoration: none`（`naive-ui/es/button/src/styles/index.cssr.mjs:64`），文字内容节点为 `.n-button__content`（`Button.mjs:452`）⇒ 下划线只能加在该节点上。

## 决策（用户确认）

用户两轮表态「可以」「可以开始」⇒ 采纳 spec 方案 A：**默认对 `text` 生效**（不新增开关 prop，全站 LButton 文字按钮统一）。影响面：41 个 `.vue` 文件、约 70+ 处文字按钮。

## 实施（仅改 `LButton.vue` 一个文件）

1. 新增 `textUnderlineClass` computed：`props.text` 为真时输出 `l-button--text-underline`。
2. `buttonBind` 显式合并调用点自定义 class 并追加标记类：`class: [attrsClass, textUnderlineClass.value]`（原实现是 class 直接随 attrs 透传，改为合并后行为等价且不覆盖调用点 class）。
3. 新增 scoped 样式：

```css
.l-button--text-underline:not(.n-button--disabled):hover :deep(.n-button__content) {
  text-decoration: underline;
}
```

- 只作用于文字内容节点 `.n-button__content`，图标不参与、flex 布局与尺寸不变；
- 排除 `disabled`（`.n-button--disabled`），灰态不出现可点击暗示；
- popconfirm / tooltip / 普通三个渲染分支共用 `buttonBind`，一处生效。

4. 同步组件顶部用法注释（新增「传 `text` 时 hover 自动显示下划线」一条）。

## 边界

- 不改 `themeOverrides`、不改全局 CSS、不动既有 `NButton` 调用、不新增 prop（无单按钮逃生口）。
- 非 `text` 按钮（默认 / ghost / circle 图标按钮等）外观零变化。

## 验证

- `pnpm typecheck`：0 错误。
- `pnpm lint`：0 error（`src/components/common/link.vue` 2 条既有 warning 与本次无关）。
- 页面冒烟待用户：收货渠道列表操作列 hover 出现下划线；`disabled` 文字按钮 hover 无线；circle 图标按钮与主按钮无变化。
