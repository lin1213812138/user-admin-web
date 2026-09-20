# 资料管理 tab 记忆（本轮实际实施）

> 关联 spec：`docs/superpowers/specs/2026-09-20-资料管理tab记忆-design.md`（已确认）
> 机制来源：`changelog/tab切换同步URL.md`（系统设置 ?tab=xxx 双向同步）

## 更正说明（重要）

本文件早前版本记录「已实施」，但**代码实际未生效**：2026-09-20 复核时，6 个 `index.vue` 均未写入 `{ urlSync: true }`，`git status` 中这些文件也无改动（疑为早前写入被硬闸门 hooks 拦截后产生的误报，`AGENTS_CHANGELOG.md` 索引已同步更正）。本轮按硬闸门流程重新确认并实际落盘。

## 背景 / 诉求

用户要求资料管理像系统设置 `http://localhost:9111/tms/system-manage/setting?tab=input-format` 一样，记住当前激活的 tab（刷新 / 前进后退 / 外部跳转 / 顶部页签切回后仍停留）。

## 定位（现成机制）

系统设置页之所以能记忆 tab，是因为调用 `useArchiveTabs(items, { urlSync: true })`。该 `urlSync` 选项已实现于 `src/views/data-manage/components/useArchiveTabs.ts`，负责把「当前激活 tab ↔ URL `?tab=xxx`」做双向同步：

- 切 tab 时用 `router.replace` 写回地址栏（不新增浏览器历史）；
- URL 变化（刷新 / 前进后退 / 外部跳转）反向定位到对应 tab；
- 无效或无权限的 tab 值自动忽略；
- 写 URL 时同步顶部页签 `fullPath`（`tabStore.setTabFullPath`），点页签切回恢复最后分页。

资料管理下 6 个页面（basic / bl / business / finance / no-rule / ship）**用的正是同一个** `useArchiveTabs` hook，只是都漏传了第二参 `{ urlSync: true }`。

## 方案（本轮实施）

给 6 个 `index.vue` 的 `useArchiveTabs([...])` 补第二参 `{ urlSync: true }`，与系统设置完全一致：

- 每处仅新增参数；`oxfmt` 会把调用展开为「数组独占一行 + 第二参独立一行」（数组内容整体缩进 +2），属格式化成本；
- 零新增逻辑，纯复刻先例；
- 不动 hook / 布局 / 权限 / 路由 / i18n / 子模块组件。

## 实施文件

| 文件                                       | 改动                                             |
| ------------------------------------------ | ------------------------------------------------ |
| `src/views/data-manage/basic/index.vue`    | `useArchiveTabs([...])` → 补 `{ urlSync: true }` |
| `src/views/data-manage/bl/index.vue`       | 同上                                             |
| `src/views/data-manage/business/index.vue` | 同上                                             |
| `src/views/data-manage/finance/index.vue`  | 同上                                             |
| `src/views/data-manage/no-rule/index.vue`  | 同上                                             |
| `src/views/data-manage/ship/index.vue`     | 同上                                             |

## 验证

- `pnpm typecheck`：exit 0，0 errors；
- `oxlint --fix` + `eslint --fix`（6 个文件）：0 warning / 0 error；
- `oxfmt`（6 个文件）：通过，输出即系统设置同款展开格式；
- `git diff --ignore-all-space`：6 个文件语义变化仅「新增 `{ urlSync: true }` 参数 + 调用换行」，无其它改动；
- 浏览器手测清单（待用户）：
  1. 进入「资料管理 → 发货资料」，切到「渠道分组」→ 地址栏出现 `?tab=channelGroup`；
  2. 刷新浏览器 → 仍停留在「渠道分组」；
  3. 切到其它菜单再点回该页签 → 仍停留在「渠道分组」；
  4. 手动把 URL 改成 `?tab=xxx` 回车 → 保持第一个分页、不报错；
  5. 其余 5 个资料管理页面同样成立。

## 边界与已知现象（继承系统设置，见 `tab切换同步URL.md`）

- 无效 / 无权限 `?tab=`：忽略，保持默认第一分页，不纠正 URL；
- 直接进入裸地址不主动补 `?tab=`（仅用户切 tab 时写）；
- `replace` 触发一次同路由导航（NProgress 可能一闪）；缓存 key 不含 query，页面不重挂载；
- `VerticalTabLayout` 的 `contentDelay`（~200ms）令 URL 更新滞后于点击动作。
