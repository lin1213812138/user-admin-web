# 乱码文件从 git HEAD 还原（已实施）

## 背景

`src/views/data-manage/**`、`src/views/system-manage/setting/modules/{print,export}-format/**` 等 11 个 `.vue` 文件在工作区出现中文乱码（U+FFFD `�` 替换字符、注释行与代码行合并、模板 `:class` 多余引号），导致 vue-tsc 解析报大量 TS1005/TS1136 错误。

早期排查走了弯路：试图用字符特征搜索定位（搜 `閫`、`锟` 等 GBK mojibake 字符返回 0 命中，因为实际损坏字符是 U+FFFD 替换符而非 GBK 乱码），并考虑过"GBK 编码 + UTF-8 解码"逆向还原方案。

## 用户纠正

用户指出：VSCode 源代码管理的 diff 左侧（HEAD 版本）就是完好的中文，**直接从 git 历史还原即可，不需要猜**。

## 定位与实施

1. `search_content` 搜 `\x{FFFD}` 精确找到 9 个含替换符的文件：
   - `data-manage/bl/modules/{bl-address/BlAddress, bl-port/BlPort}.vue`
   - `data-manage/no-rule/modules/{no-rule/NoRule, no-pool/NoPool, long-no-rule/LongNoRule, item-no-rule/ItemNoRule}.vue`
   - `data-manage/ship/modules/provider/Provider.vue`
   - `system-manage/setting/modules/{print-format/PrintFormat, export-format/ExportFormat}.vue`
2. 用 `git show HEAD:<file>` 逐个校验 HEAD 版本字节不含 `EF BF BD`（9/9 干净）。
3. `git restore -- <9 个文件>` 还原。
4. typecheck 复跑后暴露 2 个**不含 U+FFFD 但同样损坏**的文件（引号损坏/注释行合并）：
   - `layouts/modules/global-menu/components/first-level-menu.vue`（`:class="{"` / `}""` 多余引号）
   - `ExportFormat.vue`（注释乱码且 `// 注释` 与 `api: async (...) => {` 合并成一行导致语法错误）
   - `git diff` 确认两者差异全是损坏，同样 `git restore`。

## 结果

- `pnpm typecheck` 退出码 0，全部通过。
- 工作区 `\x{FFFD}` 搜索 0 命中。

## 教训

- 排查编码损坏先确认**实际损坏字节形态**（本例是 U+FFFD 替换符，不是 GBK mojibake），避免搜错特征白费功夫。
- 文件损坏且 git HEAD 干净时，`git restore` 是零风险首选方案，无需逆向还原编码。
- U+FFFD 搜索清零后仍需复跑 typecheck，因为损坏可能不止一种形态（引号、行合并不含 U+FFFD）。
