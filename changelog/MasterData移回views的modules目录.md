# MasterData 移回 views 的 modules 目录

> 日期：2026-09-17
> 来源：用户「@/components/MasterData 把文件从这里移回 views 里面不需要再其他地方配置」→「你直接改名放在 modules 里面不要叫 index.vue 不就行了」

## 需求与约束

- 把 `src/components/MasterData/**` 整体移到 `src/views/data-manage/modules/`（业务页面私有代码不再放通用组件目录）。
- **不需要任何额外配置**：菜单、路由、i18n、service 均零改动。
- 关键风险：elegant-router 扫描 `src/views`，`index.vue` 会被当作页面生成路由（历史上有过误生成 `setting_modules` 路由的教训）。解决方式 = 移入 `modules` 目录 + `index.vue` 改名（非 `index.vue` / 非 `[param].vue` 不生成路由，与 `views/system-manage/setting/modules/**` 现状一致）。

## 改动清单

1. 18 个档案页 `archives/<组>/<key>/index.vue` → 按目录名改名为 PascalCase（如 `country-region/index.vue` → `country-region/CountryRegion.vue`），**先改名再移动**，保证 views 下从未出现过 `index.vue`。
2. 目录整体移动：`src/components/MasterData` → `src/views/data-manage/modules`（含 `master-data-archive.vue`、`archive-switch.vue`（死代码）、`types.ts`、`shared.ts`、`archives/**`，共 22 个文件）。
3. 引用更新（23 个文件，脚本批量）：
   - `@/components/MasterData` → `@/views/data-manage/modules`（3 个页面 + 18 个档案页 + `service/api/data-manage/index.ts`、`mock.ts`）；
   - archives 引用补 PascalCase 文件名。
4. `src/typings/components.d.ts`（自动生成）在删除组件目录后未自动刷新（残留指向旧路径的悬空声明，因文件头 `@ts-nocheck` 不报错）→ 用临时探针文件触发 unplugin-vue-components 全量重生成，随后删除探针，声明已清空（`MasterData` 0 命中）。
5. `src/components/common/link.vue` 被 `eslint --fix` 顺手改了一处缩进（eslint 与 oxfmt 对该写法格式分歧：eslint 要 10 空格、oxfmt 要 12 空格，提交前 fmt 会冲突）→ 已手动恢复原状，保持本次 diff 干净。

## 验证

- `pnpm typecheck` exit 0、`pnpm lint` 0 error。
- `src/router/elegant/routes.ts` 无新增条目（data-manage 下仍是 basic/business/finance 三条），菜单/路由零变化。
- 全项目搜索 `@/components/MasterData` 与 `archives/*/index.vue` 均 0 命中。
- playwright 实测（dev 9111）：基础资料 / 业务资料 / 财务资料三页正常渲染（5 / 9 / 4 个 tab、表格数据正常），SPA 跳转返回正常，console 0 errors。
