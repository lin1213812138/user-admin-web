# API配置去掉保存按钮改为即改即存

## 需求

用户贴客户详情「API配置」tab 截图（红框圈两张卡片的「保存」按钮）："去掉，修改字段保存的" —— 去掉「保存」按钮，修改「开启状态」时直接保存。

## 实施

改动 `customer-detail/api-tab.vue`（网站下单 / API下单 两卡片对称）：

1. 删除两个「保存」`NButton`。
2. `NSelect`（webStatus/apiStatus）加 `@update:value="handleSave('webStatus'|'apiStatus')"`——v-model 先写回 model 再触发 handler，语义与原点击保存一致。
3. 原 `webSaving`/`apiSaving` loading 转为下拉的 `:disabled`（保存中防重复触发）。

顺带清理：`customer.detail.save` i18n key 仅这两个按钮使用 ⇒ 从 zh-cn.ts / en-us.ts / `typings/app.d.ts` Schema 三处同步删除（第四次复现"i18n 必须同步 app.d.ts"约定）。

## 验证

- read_lints 4 文件 0 诊断；`pnpm typecheck` 0 错误。
- 预期 = 切换开通状态下拉即触发 `/customer/update` 局部保存，成功提示 + emit refresh 重拉详情；保存期间下拉禁用。
