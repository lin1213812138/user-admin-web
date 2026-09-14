# Form 组件下拉框支持搜索

## 需求

用户："form 组件里面的下拉框需要可以搜索"。

## 设计（已确认）

- **默认策略：默认开启、可单独关闭**——所有 `FormWrap` 的 `select` 项立即支持输入搜索，个别不需要搜索框的下拉写 `filterable: false` 关闭；
- **实现**：`FormItemConfig` 新增 `filterable?: boolean`，`NSelect` 绑定 `:filterable="item.filterable ?? true"`；
- **搜索行为**：Naive UI 默认按选项 label 模糊匹配；
- **生效范围**：所有用 `FormWrap` 的表单（用户/角色/站点/组别抽屉、系统设置页等）与表格页顶部搜索栏（`SearchBar` 内部复用 `FormWrap`，天然一起生效）；
- 其它控件（input / number / switch / color / checkbox / icon-picker）不动。

## 改动文件

- `src/components/Form/form-config.ts`（`FormItemConfig` 新增 `filterable`）
- `src/components/Form/index.vue`（`NSelect` 绑定 `filterable`，默认 true）

## 验证

- `pnpm typecheck` 通过（0 错误）；
- oxlint（`src/components/Form`）0 warnings / 0 errors；eslint（.vue）0 报错；
- `pnpm fmt` 已执行，无预期外文件改动；
- 浏览器端到端不可达（本地无后端），未做界面实测；预期表现 = 所有 `FormWrap` 下拉面板顶部出现搜索输入框、输入按选项 label 模糊过滤，`filterable: false` 的下拉保持原样。
