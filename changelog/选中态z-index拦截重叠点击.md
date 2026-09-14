# 标签设计器：选中态 z-index 拦截重叠元素点击

> 用户反馈（截图）：「矩形置于最底层，然后选中了矩形，再点中间的元素还是无法选中」

## 复现

1. 画布上放一个矩形（透明背景 + 边框）+ 一个文本元素（在矩形区域内）；
2. 右键矩形 → 「置于底层」（`sendToBack` → 矩形移到 `elements[0]`，视觉最底层 ✓ 操作正确）；
3. 选中矩形（保持选中态）；
4. 点击中间的文本 → **选不中**，反复命中矩形。

## 根因（代码级证据链）

- 元素渲染：`absolute` + 无 z-index → 堆叠顺序 = DOM 顺序（`v-for` 顺序）→ `sendToBack` 后矩形在底层 ✓ 数据层正确；
- 同文件 CSS `.is-selected { ... z-index: 10; }` → **选中元素被提升到所有元素之上**（根因）；
- 矩形是**透明背景**（`RectOptions.bgColor` 默认 `'transparent'`）→ 视觉上中间文本仍可见（与截图吻合），但 **hit-test 按 z-index 优先** → 点击中间命中的是上层（选中）的矩形；
- `@pointerdown="begin($event, el.id, 'move')"` 内 `store.selectElement(id)` → 每次点击都把矩形重新选中 → 文本永远无法选中。

## 修复

删除 `.is-selected` 的 `z-index: 10`（附防复发注释），命中恢复遵循真实堆叠顺序。

- **手柄不受影响**：`.resize-handle` 自带 `z-index: 5`，且 `.element-item` 不创建堆叠上下文（无 z-index / transform / opacity）→ 手柄作为定位子元素仍绘制在所有元素之上，可正常拖动缩放；
- **唯一折中**：选中被上层元素遮挡的元素时，描边可能被上层遮挡（手柄仍可见），可接受；
- 修复后行为：点重叠处选中**最上层**元素（与通用设计工具一致）。

## 验证

- `npx oxfmt` / `npx oxlint --fix` / `npx eslint --fix` 单文件：0 error；`pnpm typecheck`：0 error。
- 浏览器实测尝试：临时 dev 实例（`pnpm dev --port 9112 --strictPort`，test 模式）+ playwright 打开 `/system-manage/label-designer` → 被路由守卫重定向登录 → 一键登录接口 500（`/proxy-default/api/v1/user/login`，无可用后端）→ **端到端不可达**；临时 dev 实例与浏览器产物（`.playwright-cli/`、快照文件）已全部清理，`src/router` 零 diff。
- 结论：以代码级证据链 + 标准 CSS 语义确认（z-index 提升优先命中 / 移除后按 DOM 顺序）。
- 手动冒烟建议：矩形置底 → 选中矩形 → 点中间文本 → 应选中文本；再确认矩形手柄仍可拖拽缩放。
