# AGENTS_CHANGELOG

> 本文件维护所有 Agent 讨论/修复记录的索引，**按日期分组（最新日期在上）**。详细文档见 `changelog/` 目录。

## 2026-09-14

- [打印格式「设计」跳自研标签设计器 + 隐藏菜单入口（用户："打印格式点设计-跳转到新增手写的标签设计界面，把菜单隐藏"；追问确认「把菜单隐藏」= **隐藏菜单里的「标签设计」入口**（不是进入设计器时收起侧边栏）；补充要求"进入标签设计，也要保留「系统设置」高亮"；方案=① `PrintFormat.vue` `openDesign` 路由 key 改 `system-manage_label-designer`、query 收敛 `{id,name}`（categoryId/paperSize 不传，纸张取详情单一来源）；② `label-designer/index.vue` 读 `route.query.id` 直接 `loadTemplate(id)`（无 id 保留「分类首个模板」兜底）、工具栏标题 computed → `currentName` ref（详情回填 name）；③ `build/plugins/router.ts` `hideInMenuRoutes` 加该键 + 新增 `menuActiveKeys` 写 `meta.activeMenu='system-manage_setting'`（**菜单选中 = hideInMenu ? activeMenu : name，故必须二者同时给**）；④ `pnpm dev` 触发路由重新生成（`gen-route` 仍是交互式"新建路由"向导、`customRoutes` 经源码核对只生成类型声明不做 meta 合并 → 均不可用）；⚠️ **生成前把 `routeOrders` 的 role/user 对齐为 2/1**，否则会冲掉工作区 `routes.ts` 里未提交的「用户在前」顺序；⚠️ 生成器会保留配置中已删的 meta 旧值（icon/order），故两者保留在配置中保持「配置=生成结果」；验证：typecheck 0 / 3 文件 oxfmt+oxlint 0 / eslint 0 error / 临时 dev(9113) 已关）**追加（同日，用户："点返回要自动跳转到打印格式的 tab"）**：设计器「返回」由 `router.back()` 改 `routerPushByKey('system-manage_setting', { query: { tab: 'print-format' } })`（用户选方案 A；根因＝设置页 `syncTabFromQuery()` 早已支持 `?tab=` 但返回从未带上该 query、且该路由无 keepAlive → 返回后重挂载落回默认分页「录单格式」；备选 B「切分页写 URL」未采用；设置页零改动）；验证 typecheck 0 / 单文件 oxfmt+oxlint+eslint 0）](./changelog/打印格式设计跳转标签设计器.md)
- [字段示例内容兜底（用户截图红框圈出「日期 date」："我把这个改成空内容，拖出来也是空的"；现状=`onDrop` 的 `payload.sample ?? payload.field` 兜不住**空字符串** → sample 清空后拖出空白；方案=`core/constant.ts` 新增 `fieldSampleOf()` 统一兜底——文本/长文本/二维码回退 `title||label||key`（中文名优先）、**条码回退 `key`**（Code128 不支持中文），`field-panel.vue` 预览构建 + dragstart payload 两处共用（预览与落纸同源）；tsx 实测 date→「日期」/ orderNoCode→「orderNoCode」/ qty→「100」；单文件 lint 0 / typecheck 0；**⚠️ 同日已按用户要求撤销**（用户报告「点击元素直接卡死」后要求撤销该批改动：`constant.ts` 删 `fieldSampleOf`、`field-panel.vue` 两处恢复 `f.sample`、`design-canvas.vue` 恢复 `??`；保留基础元素示例））](./changelog/字段示例内容兜底.md)
- [基础元素补默认示例值（用户截图圈出「文本/长文本/图片」："这三个能不能加个示例，拖出来都是空的，或者如果是空内容，能不能按之前那样显示呢？"；现状=三者 `sample: ''` 拖出即空白，条码/二维码本就有示例；方案=与条码/二维码对齐补 `sample`：文本「文本示例」/ 长文本「长文本示例，可输入多行内容」/ 图片用内嵌 SVG 占位图常量 `IMAGE_PLACEHOLDER_SRC`（`data:image/svg+xml` 纯 ASCII、`#`→`%23`）；**不采用 placeholder 占位方案**（与真实内容无视觉区分、打印端需隔离、且导出格式 placeholder 有独立语义）；tsx 实测五类基础元素 `resolveDisplayText` 全非空；单文件 lint 0 / typecheck 0）](./changelog/基础元素默认示例值.md)
- [左侧条目加拖拽把手图标（用户附参考截图："每个元素前面能不能像这个一样加个拖拽的图标？"；`panels/field-panel.vue` 两组条目（业务字段/基础元素）文字前加 `icon-mdi-drag`（沿用 `table-column-config.vue` 既有先例，六点把手 + `cursor-move` 语义）；容器改 `flex items-center`、图标 `mr-6px shrink-0 text-14px text-#c0c4cc dark:text-#555`；**整条仍可拖**（图标仅视觉提示）；单文件 oxfmt+oxlint+eslint 0 / typecheck 0；**二次调整（用户：图标看不清楚 + hover 加 border 类似截图）**：图标 `text-#c0c4cc` → `text-#8c8c8c dark:text-#999`，容器加 `group` + `hover:border-primary dark:hover:border-primary`（暗黑单独写保证特异性胜出）+ 条目名 `group-hover:text-primary` + `transition-colors`；**三次修正（用户对比截图："跟前面的效果不一样"— hover 文字未变蓝）**：`group-hover:text-primary` 与 `text-#999`/`dark:text-#777` 叠加未能稳定生效（项目内无 group-hover 先例、UnoCSS 变体优先级/源顺序不可控）→ 改用 scoped CSS `.field-entry:hover .entry-title { color: rgb(var(--primary-color, 32 128 240)) }`（特异性 (0,4,0) 稳定胜出、与 `text-primary` 同源口径））](./changelog/左侧条目加拖拽把手图标.md)
- [选中态 z-index 拦截重叠点击（用户："矩形置于最底层，然后选中了矩形，再点中间的元素还是无法选中"；根因=`design-canvas.vue` `.is-selected { z-index: 10 }` 把选中元素提升到所有元素之上——矩形透明背景（`bgColor:'transparent'`）视觉可见但 hit-test 优先命中它 → 反复选中矩形、文本永远选不中；修复=删除该 z-index（附防复发注释），命中恢复 DOM 堆叠顺序；`.resize-handle { z-index:5 }` 为定位子元素（父不创建堆叠上下文）不受影响仍可拖；**教训=选中态不能提升 z-index**；验证：单文件 oxfmt+oxlint+eslint 0 + typecheck 0；浏览器端到端因无后端（登录接口 500）不可达，临时 dev(9112)/`.playwright-cli` 产物已清理、src/router 零 diff）](./changelog/选中态z-index拦截重叠点击.md)
- [左侧拖元素光标改十字箭头（用户："左侧拖元素能不能使用十字剪头？不要使用手"；`panels/field-panel.vue` 两组条目 `cursor-grab`（张开手）+ `active:cursor-grabbing`（握拳）→ `cursor-move`（四向箭头），删按压态变体；画布平移的 `grab`/`grabbing` 保持不动（不同语义）；单文件 oxfmt+oxlint+eslint 0 / typecheck 0）](./changelog/左侧拖拽光标改十字箭头.md)
- [标签设计器字段类型可修改（用户截图圈出属性面板「字段类型」："这个类型需要能修改"；现状=该项 `disabled` 只读展示、store 无切换能力；设计确认：① 保留共有 + 内容互迁（共有配置保留、`text` ↔ `value` 自动互迁、新类型独有键补默认）；② 尺寸重置为新类型默认（位置 x/y 不变）；③ 限 5 种数据类（矩形/线条不参与）；实现=store 新增 `updateElementType`（`SWITCH_CONTENT_KEY` 内容互迁表 + `EXTRA_OPTION_KEYS` 兜底 `placeholder`，合并顺序 migrated > kept > defaults，入撤销栈）+ 面板 `fieldTypeDisplay` → `fieldTypeSelect`（UI-only、存 ElementType 值、5 选项复用既有 i18n 键），`watch(model)` 拦截类型变化后 `buildModel()` 重建受控值；关键约束=迁移后只能有一个内容键（`resolveDisplayText` 按键优先级取，残留空 text 会遮蔽 value）；**追加修正（用户截图：切换到文本类型高度还是有问题）**：切到 `text` 时高度按内容自适应——新增 `canvas/measure-element.ts` 离屏实测（`createApp` 挂 `ElementRenderer`、与 drag-preview 同口径：宽=元素宽 / height auto / 单行下限），异步实测后只写回 height（不额外入撤销栈，undo 一步回退；longText 与拖入行为一致不实测））](./changelog/标签设计器字段类型可修改.md)
- [文本类型落纸尺寸：宽 50mm + 高度按内容自适应（用户："文本类型高度按内容自适应宽度定为50mm"；方案=① `defaultSize('text')` 宽 40→50mm、8mm 高度降为兜底/最小；② 预览容器文本类型 `height:auto` + `minHeight=默认高度`（空内容不塌 0、实测天然带底线），drag-ghost 在 nextTick 后实测 `offsetHeight/PX_PER_PT` 存会话并导出 `getPreviewHeight()`；③ `addElement(desc, at, size?)` 新增可选尺寸覆盖（不传行为不变）；④ `onDrop` 经 `textDropSize()` 给文本落纸传 `{width:50mm, height:实测}`，拿不到回退默认；typecheck 0 / 4 文件 0 error 0 warning；**同日修正**（用户："这不没什么变化吗"）：文本预览 `minHeight` 由「类型默认高度 8mm」改为「单行高度 `fontSize × lineHeight`（≈3.4mm，缺省 8pt/1.2）」—— 原下限比单行内容还高、把元素撑到 8mm 掩盖了自适应；空内容仍不塌 0）](./changelog/文本类型高度自适应宽度50mm.md)
- [按住即显示真实渲染预览（用户："还有这个能不能做，鼠标按住就直接显示？"；设计确认：按下即显示 / 真实渲染（条码图+编码值、文本「标题: 值」）/ 点击不拖立即消失 / 不加装饰；架构=`drag-ghost.ts` 重写为**会话模型**（pointerdown 建立 → dragstart 接管 → pointerup/dragend 收尾）+ 新增 `drag-preview.vue`（Teleport body，复用画布 `ElementRenderer` 1:1 真实渲染，位置直写 DOM）+ store 导出 `defaultOptionsFor`/`defaultSize` 保证预览与落纸元素同源；关键坑=HTML5 拖拽期间 pointerup 不触发，dragstart 必须摘掉点击判定监听否则残留误触发（pointercancel 兜底）；typecheck 0 / 4 文件 oxfmt+oxlint+eslint 0）](./changelog/按住即显示真实渲染预览.md)
- [拖入元素按预览位置创建（用户："能不能拖进来是在什么位就显示在什么位置，不要以鼠标为起始点画"；根因=`onDrop` 把鼠标落点当元素左上角、而预览是「跟手偏移」定位，两者差一个抓取偏移导致松手瞬间元素跳位；方案=`drag-ghost` 新增导出 `getDragOffset()`（drop 早于 dragend，state 仍在），`onDrop` 按「预览左上角 = 指针 − 抓取偏移」换算坐标并 `Math.max(0,…)` 钳纸张左上边界；落点有效性判定不变；注意元素与预览尺寸不同、是左上角对齐非完全重合；typecheck 0 / oxfmt+oxlint+eslint 0）](./changelog/拖入元素按预览位置创建.md)
- [标签设计拖拽预览看不清（用户："从左侧拖出来，为什么看不清"；定位=浏览器 drag image 默认用源条目快照（白底+浅灰字 #999/#bbb+浅灰边框）再叠半透明，落灰底画布上对比度极低；已与用户确认排除误诊——浅色框是拖动中的预览（松手即消失）、拖到纸张内元素能正常创建；方案（用户选 A）=`dataTransfer.setDragImage()` 自定义预览卡片：Teleport 到 body 的离屏常驻 div（避免 transform 祖先使 fixed 退化）、白底深字+主色描边+阴影、dragstart 同步写 textContent（setDragImage 只在 dragstart 内生效，Vue 响应式来不及）+ 强读 offsetWidth 触发重排、光标居中；drag-ghost.ts 注释同步；typecheck 0 / 2 文件 oxfmt+oxlint+eslint 0；备注=本轮临时起的 dev 实例(9112)与 Playwright 脚本已清理，无后端故未做端到端验证；**同日回退**（用户："不要自定义了，左侧还是改成透明背景吧"）——撤销自定义预览恢复原生 drag image + 左侧面板移除 `bg-container` 改回透明（右侧保持白底）；**同日三改（用户对比截图："为什么鼠标松开就是正常的，鼠标按住是这样的"）**：根因=原生影子被浏览器强制半透明 vs 松手后幻影不透明、两套机制观感不一 → 重构 `drag-ghost.ts` 统一为「跟手预览」：1×1 透明图顶掉原生影子 + dragstart 克隆源项做跟手预览（初始位置与源项重合零跳变）+ dragover 更新 left/top + dragend 同一元素原地转场（淡出/回位），`createGhost` 删除；样式与面板条目天然一致，非自定义卡片）](./changelog/标签设计拖拽预览看不清.md)
- [标签设计器左右两侧面板背景改白（用户："左右两侧的背景能不能做成白色的"；现状=左 260px 字段面板/右 300px 属性面板容器无背景、透出页面 layout 底色 rgb(247,250,252) 发灰；方案=用主题 token 类 `bg-container`（浅色=纯白 rgb(255,255,255)、暗黑自动 rgb(28,28,28)，无需 dark: 变体，项目先例 dark-mode-container.vue）给两个侧栏容器加背景；分隔线/中间画布不动；typecheck 0 / 单文件 oxfmt+oxlint+eslint 0）](./changelog/标签设计器左右两侧背景改白.md)
- [标签设计器水平垂直对齐并排一行（用户截图："水平对齐和垂直对齐放在同一行"；根因=样式卡两个对齐是 span12 标准项，「关联标题」开启多出 3 个标题样式项使前序累计 84≡12(mod24)，水平对齐落行尾、垂直对齐被挤下一行；`titleStyleItems` 为奇数项导致 title 开/关奇偶翻转，纯排序无法两全（差 36≡12 mod24）；方案=把两个对齐合并为一个 span24 的 custom item（`alignGroup`），slot 内嵌套两个 NFormItem（各带 label、样式天然一致）+ NSelect，外层 `label:''`（naive `!labelText` 不渲染 label 且挂 --no-label，已核对源码），选项抽 alignOptions/valignOptions，「行高」移到对齐组后使 title 开启时整卡满行；已知取舍=title 关闭时「字重」半行留空；typecheck 0 / 单文件 oxfmt+oxlint+eslint 0；**追加修正（用户：为什么上下间距没有统一）**：对齐组上下间距偏大 → 根因是 naive `mergedShowLabel`/`mergedShowFeedback` 默认 true（空 label 仍留一行 label 高度、嵌套 NFormItem feedback 占位叠加双倍），修法=FormWrap 新增 `showLabel?: boolean` 透传 `:show-label` + alignGroup 显式 `showLabel:false` + 内层 `:show-feedback="false"`）](./changelog/水平对齐和垂直对齐放同一行.md)
- [标签对齐拆分与字重中文化（用户截图：属性面板「对齐」拆为水平/垂直两个下拉 + 对齐/字重选项中文；**已实施**：① `types.ts` 新增 `TextOptions.verticalAlign?: 'top'|'middle'|'bottom'`（缺省 top，取值对齐导出格式 `style.verticalAlign` 的 CSS 语义、直传不映射）；② 渲染两端（`canvas/element-renderer.vue` + `render/render-element-html.ts`）文本分支改「外层 flex column 定纵向（justify-content）+ 内层 100% 宽 div 保持标题行内前缀与内容同一文本流」，`vAlignToJustify()` 映射收敛在 `render/render-utils.ts`，缺省 `?? top`；③ `export-format.ts` 导出真实值（原写死 'top'）+ 回读新增 `pickVAlign`，旧数据/缺字段兜底 top；④ 属性面板样式项重排（字号|颜色、字重|行高、水平对齐|垂直对齐、显示边框），字重/对齐选项中文走 i18n（新增 `propAlignH`/`propAlignV`/`weightNormal`/`weightBold`/`alignLeft|alignCenter|alignRight`/`valignTop|valignMiddle|valignBottom`，删旧 `propAlign`，zh/en/typings 三处同步），buildModel 按类型兜底受控 `verticalAlign`；⑤ 范围仅文本/长文本，条码/二维码/图片/矩形线条不动；验证：typecheck 通过、`propAlign` 0 残留、tsx 实测打印三分支输出 `justify-content:flex-start/center/flex-end` 且标题内容同文本流、导出→纯 style 回读 `bottom` 往返一致 + 缺字段兜底 top）](./changelog/标签对齐拆分与字重中文化.md)
- [录单格式字段映射必填配置（用户："不只是配置是否显示也要配置是否必填"；设计已确认：① 数据结构 `Record<string, string[]>` → `Record<string, { show, required }>`，两数组独立不自动联动；② UI 每字段两个复选框（显示 / 必填），必填框在未勾显示时置灰禁用、已勾状态保留可见（"必填但不显示"只可能来自历史数据）；③ 分组一键全选按钮完全不变、仍只操作 show 数组；④ 地址/公司 span 4→8 容纳双框；i18n 新增 `fieldMappingRequired` 三处同步；**二次调整（用户截图反馈双复选框太丑）**：改「复选框 + 必填星标」——未勾显示不渲染星标（数据保留）、★主题红/☆灰点击切换 + NTooltip、星标固定宽防抖动、默认 span 8→6 一行 4 个；**三次调整（用户：星号太小不好点 + 勾显示要默认必填）**：星标放大 16px + 24×24 固定热区（hover 浅灰底/变红）、`toggleField` 勾选显示时自动并入 required（取消显示不清除）；**四次微调**：显示复选框补 `NTooltip`（复用 `common.show`，与星标「必填」tooltip 对称）；**五次修正**：分组一键全选同步默认设为必填（`toggleGroup` 合并 required，取消全选不清除））](./changelog/录单格式字段映射必填配置.md)
- [标签设计器目录整理（modules 下 16 个文件平铺混放 → 按职责拆分 core/render/canvas/panels 四组；方案 A + 只移动不重命名，零逻辑改动、29 条相对 import 改写；**已完成**：`git mv` 全 R 状态保留历史、typecheck 通过、路由零 diff 双重确认（源码级 `pagePatterns` 只匹配 index.vue/[param].vue + 实测启动 dev 后 router/typings 无 diff）；附带产出模块中文 `README.md`（使用方法/目录结构/关键约定/扩展指南/可维护性）；备注=property-panel.vue 用户先前未提交的 3 处 propTestData 文案改动原样保留）](./changelog/标签设计器目录整理.md)

## 2026-09-13

- [标签设计画布平移缺少抓手光标（用户报「标签拖动的时候鼠标没有显示拖动的样式」，澄清后=**拖整块画布平移**时无抓手手势；根因：`design-canvas.vue` 的 `.label-designer-canvas`（即 `viewportRef`）样式块只有 `touch-action:none`、**完全没有 `cursor` 规则**，平移链路只管坐标不动光标；对照组=姊妹页 `print-design/index.vue` 同款平移有 `cursor: grab` + `.panning{cursor:grabbing}`，label-designer 漏了；**已实施（用户确认方案 1-4 全做）**：① 容器 `cursor: grab`；② `.label-designer-canvas.panning, .label-designer-canvas.panning * { cursor: grabbing !important }`——`cursor` 是每元素独立生效、继承值一律输给元素自身声明，平移途中指针会滑到纸张/元素/手柄上，不带 `*` + !important 会出现「握拳↔箭头↔缩放」来回闪；③ `panning` 类命令式 `viewportRef.value.classList.add/remove`（`onViewportPointerDown`/`onPanUp`，类名抽 `PANNING_CLASS` 常量），与现有「平移高频帧只直写 DOM」写法一致、不为光标触发画布响应式重渲染，并补 `pointercancel` 监听 + `onBeforeUnmount` 兜底摘类；④ 语义错位顺带修：容器变手掌后元素会继承手掌、但拖元素是「移动」，故 `.element-item { cursor: move }`（`.resize-handle` 自带缩放光标不受影响）；验证：typecheck 通过、改动文件 oxlint+eslint 0/0、`pnpm fmt` 后 `git diff --stat` 仅 design-canvas.vue 24 行新增）](./changelog/标签设计画布平移缺少抓手光标.md)
- [提交被precommit与commitmsg钩子拦截修复（用户报「提交不了」：① `pnpm typecheck` 报 TS7016 缺 rimraf 类型——手工铺的 hoisted node_modules 里 rimraf 实际是 2.7.1，而 `packages/scripts` 声明 6.1.3（v6 才自带类型、且 `cleanup.ts` 用的是具名导出），`npm pack rimraf@6.1.3` 解包拷入 `packages/scripts/node_modules/rimraf` 且**不动根目录 v2**（避免影响其他按 v2 API 使用的依赖），d.ts 内对 glob 的引用由 `--skipLibCheck` 兜住；② commit-msg 的 `pnpm sa` 报 ERR_UNKNOWN_FILE_EXTENSION——`bin.ts` shebang 是 `#!/usr/bin/env tsx`，但 `.bin` 下 `sa`/`sa.cmd`/`sa.ps1` 三个 shim 都被生成成 node 直跑 `.ts`，改为经 `node ../tsx/dist/cli.mjs` 启动；③ 中文提交信息改用 `git commit -F .git/COMMIT_MSG_TMP.txt` 传入以规避 Windows 终端编码；最终 `cbafcd6` 完整通过 typecheck→lint→fmt→git diff→commit-msg 全链；**追记｜彻底修复**：改 `.bin` shim 只是治标——shim 被依赖工具重新生成后又复发（`sa.cmd` 变回 `node bin.ts`），故把 `packages/scripts` 的 `bin.sa` 由 `./bin.ts`（`#!/usr/bin/env tsx` shebang）改为新增的 `./bin.mjs`（纯 JS：`require.resolve('tsx/cli')` + `spawnSync` 委托执行 `src/index.ts`，规避 tsx 以 CJS 模式加载 TS 时的 `Cannot find module './commands'`），删除 `bin.ts`、同步拷入**真实拷贝形态**的 `node_modules/@sa/scripts`、三个 shim 改为指向 `bin.mjs`——此后无论 shim 怎么生成都正确；rimraf 侧因落在真实目录 `packages/scripts/node_modules/rimraf` 亦不会被重装清掉）](./changelog/提交被precommit与commitmsg钩子拦截修复.md)
- [标签设计左侧面板改用组件库滚动条（用户："不要使用系统滚动条，使用组件库的滚动条"——上一步基础元素改单列后面板变高露出系统滚动条；先核查范围：同页右侧 property-panel 早已用 NScrollbar、画布视口 overflow-hidden、预览弹窗刻意隐藏滚动条、姊妹页 print-design 左侧面板也是 NScrollbar，**全页仅左侧 field-panel 一处系统滚动条**；改动=根节点 `div.h-full.overflow-auto.p-12px` → `<NScrollbar class="h-full">` + 内层 `div.p-12px`（padding 放内层让滚动条贴右缘，与右侧面板同款），其余内容零改动；naive 内部容器仍原生滚动、仅 CSS 隐藏系统滚动条，故滚轮/触控/HTML5 拖拽边缘自动滚动行为不变；Playwright 实测：全页 .n-scrollbar=1 且父级为左侧面板容器、container `overflow-y:scroll` + `scrollbar-width:none`、799/843 可滚、hover 后 rail opacity=1 且 rail.right=475≈面板右缘 480、滑块 height=761；左下角小三角经 elementFromPoint 确认是 Vue DevTools 悬浮按钮与本次无关；另备注 index.vue 左侧面板宽度已被用户自行改为 w-260px）](./changelog/标签设计左侧面板改用组件库滚动条.md)
- [标签设计基础元素改单列并下移（用户截图要求左侧面板「基础元素」从两列网格+居中改为与「业务字段」同款（单列整行、左对齐圆角描边条目），并把整个基础元素区块移到最下面；**已实施（用户确认文案样式取 A：左对齐+灰色 text-#999）**：`field-panel.vue` 仅模板改动——两个 NCollapseItem 顺序对调（fields 在前）+ `default-expanded-names` 同步 `['fields','basic']` + 容器 `grid grid-cols-2` → `flex flex-col gap-8px` + 条目去 `text-center`、类名与字段条目逐字对齐、文案包 `text-#999 dark:text-#777`；未动 draggable/onDragStart/startDragGhost/i18n/清单；`scripts/panel-shot.cjs` 截图+DOM dump 核对：分组顺序为业务字段→基础元素，条目 `textAlign=start`，两组均单列整行灰字同款描边，与需求截图一致）](./changelog/标签设计基础元素改单列并下移.md)
- [标签设计面板拖拽未落纸回到原位动画（**需求澄清/认错**：用户截图确认「需要回到原位的动画」指的是**从左侧面板拖出来、没落进纸张的那一项**要回到它在面板里的原位，此前实现的 `replayBack` 是画布内已有元素出界回弹，认错了需求；根因=原生 HTML5 影子由浏览器绘制销毁、JS 无法动画，且画布 `onDrop` 对灰底所有落点都 `preventDefault()` → 浏览器判定拖放已接受、松手直接抹掉影子不播放回位；**已实施方案 A**：新增 `modules/drag-ghost.ts`——`dragstart` 记源项与抓取偏移，拖拽期间以 capture 阶段临时接管 document 级 dragover/drop（仅对 `application/x-label` preventDefault，令任何落点都算「已接受」，浏览器就不会自己再播一次回位动画），`dragend` 时 `cloneNode` 出幻影摆到松手位置 → 未创建元素则 rAF 补间（首帧 rAF 时间戳为 0 点）平移回源项 rect、已创建则 120ms 淡出；画布 `onDrop` 两个成功分支调 `markDragCreated()`；曲线/时长抽到 `constant.ts`（`BACK_MS=260` + `backRemain` cubic ease-in-out）；**探针踩坑**：`backRemain` 返回「剩余比例」而幻影要「已走完比例」，首版直接用导致幻影第二帧跳到原位再倒着飘回落点，改 `1 - backRemain(t)` 才对；**同时按用户 Q2 恢复画布 move 纸界钳制**：恢复 `clampInPaper`、删除 `outAmount`/`replayBack`/`stopBack`/`backRaf`/`backDom` 与临时屏显徽标 `debugInfo`，保留 `DragState.lastGeo` 作为结算权威；Playwright 帧级实测：幻影 79 帧内从 `(1172,399)` 平移回源项 `(232,200)` 且终点重合、无残留节点、落纸外不创建元素；画布元素拖向纸外时右边缘精确停在纸张右边缘、松手不跳变）](./changelog/标签设计面板拖拽未落纸回到原位动画.md)

- [标签设计单位规范（用户口径：纸张尺寸必须 mm、元素「位置与尺寸」用 pt，其余项暂不动；核对后当前实现已完全合规——纸张侧 PAPER_SIZES/parsePaper/PX_PER_MM/预览/导出 paper 全 mm，元素几何存储+画布+面板(已带 (pt) 后缀)+打印导出全 pt，无 mm/pt 混用；**零业务代码变更**）；追记：`DragState.paperW/paperH` 的「纸张尺寸（pt…）」注释易误读为纸张改单位，实为 `paperPt()` 经 mmToPt 得到的**换算值**（仅与 pt 元素几何同单位比较钳纸界），注释已改写澄清）](./changelog/标签设计单位规范.md)
- [标签设计元素拖拽越界回到原位动画（**⚠️ 方向已认错更正**：用户截图澄清「回到原位的动画」指的是左侧面板被拖项，本文 `replayBack`/`outAmount` 链路已整段删除、画布 move 恢复纸界钳制，仅保留「CSS transition 无效 / rAF 补间时间轴基线」两个结论；用户否掉「每帧硬钳制」手感：move 去掉实时钳制自由出界，松手越界则本次移动作废+动画回到拖动前位置（不落库/不记撤销），`transition: transform 180ms` + 强制 reflow 起步 + transitionend 清理 + begin 清残留 transition；删 clampInPaper 改 outAmount 越界量判定（元素超纸的轴不计、按「比拖动前更差才算越界」以允许把溢出元素往里拖）；resize 仍保留纸界钳制不在本次范围）；追代：手测「松手瞬间跳回、看不到动画」——内联 transition + 强制 reflow 写法在本项目不产生动画（根因未定性：elementStyle 不含 transform、Vue style patch 不碰 transform、全局无 transition:none !important），按用户方案改 rAF 手动补间（同步钉起始位移 → 每帧 translate(dx\*(1-t)³)、220ms、backRaf/backDom + stopBack 生命周期，replayBack/begin 两处取消），彻底不依赖 transition 与 reflow；追代 2：手感仍报「松手直接消失、无回位动画」——根因是动画时钟 0 点取错（`performance.now()` 墙钟 − rAF 首帧时间戳），pointerup 任务里的属性面板重渲染把首帧推迟，首帧 t 已跨过 20%~100%，低帧率下直接 t>=1 当场收尾（CSS transition 版同理：计时 0 点是 `void offsetWidth` 提交样式的时刻），改为以「首个 rAF 帧时间戳」为基线 + `t` 夹 [0,1] + `k` 上限锁 1，动画必播满 BACK_MS 且位移只向原位单调收缩；追代 3：仍报「每次都一样」，改用 Playwright 帧级实测（`scripts/drag-probe.cjs`，系统 Chrome + 本机后端 LINFLY/123）证明补间每帧都在写 DOM（78 帧 / 260ms、transform 逐帧插值到原位），根因是机器上留了 4 个 dev server 僵尸实例 + `FSWatcher` 崩溃后 Vite 模块缓存永不失效，浏览器一直在跑旧模块——已清掉只留一个干净实例；同时把结算/回弹起点改为「最后一帧真正写进 DOM 的几何」`lastGeo`（不再依赖 pointerup 坐标），回弹曲线由 ease-out 改 cubic ease-in-out、220→260ms（ease-out 前 3 帧就走完 61% 距离，观感等同瞬移））](./changelog/标签设计元素拖拽越界回到原位动画.md)
- [标签设计元素拖拽越出右下边界（move 只钳下界 + resizeGeometry 无纸界约束 → 拖拽/8向缩放可越出右/下、w/n 手柄还能把 x/y 推负；新增 clampInPaper 位置贴边钳制、resize 上限取 max(原尺寸,纸界余量) 不强制缩小、rAF 预览与落库同源；onDrop 落点不在纸张内则不创建）](./changelog/标签设计元素拖拽越出右下边界.md)
- [安装依赖报错→IDE内无法启动（终案：CodeBuddy 文件过滤层禁止一切 junction/symlink 穿透读取，pnpm 链接模型在 IDE 内不可用；解法=.npmrc 加 node-linker=hoisted + 手动删悬空 junction + @sa 包真实拷入 node_modules + 补齐 rolldown/oxc binding 的 package.json；IDE 内 vite 启动验证通过。装依赖起服务仍建议 IDE 外）](./changelog/安装依赖报错.md)

## 2026-09-12

- [标签预览突出显示（iframe 白纸贴白卡无对比；**最终定稿：弹窗宽高零约束完全随纸张；naive 遮罩层默认 fixed+overflow:visible 不可滚（超高直接溢出视口），覆盖 wrapper overflow-y:auto+隐藏滚动条视觉、padding 40px 放 .n-modal-scroll-content**——超高时整个弹窗滚轮上滚，滚到底 footer 下留 40px 空白，bootstrap/hiprint 模式；教训：naive 类名横/双下混用必须查源码、`flex:1 1 0` 在自适应高度容器压扁内容](./changelog/标签预览突出显示.md)
- [标签设计拖出元素尺寸过小（非代码 bug：Vite HMR 半新半旧——.vue 组件热替换生效、store 模块未重载，裸 50×15 被 pt 渲染；整页刷新即恢复；教训：store+组件同批改动后先刷新再排查）](./changelog/标签设计拖出元素尺寸过小.md)
- [标签设计拖放落点跳到上方（pt 迁移漏改：onDrop 落点按 mm 算出被当 pt 存，坐标缩小 2.83 倍；同类修复 moveSelected 钳制 mm/pt 混减、duplicate/paste 偏移 mmToPt(4)；教训——单位迁移须按 parsePaper 数据流核对而非字面量搜索）](./changelog/标签设计拖放落点跳到上方.md)
- [标签设计元素几何单位mm改pt（x/y/width/height 全链路 pt，纸张保留 mm；designJson 加 unit 字段旧数据自动 ×2.8346 迁移，默认尺寸/最小边/方向键步长按物理尺寸等比换算手感不变）](./changelog/标签设计元素几何单位mm改pt.md)
- [标签设计designJson目标格式改造（B方案：存储整体换 unit:pt+paper+key/label/style 目标格式，原生字段以独立 options 子对象全保留；export-format.ts 序列化边界转换，loadFromJson 三输入兼容（目标/旧原生 mm 迁移/非法），几何 pt 直传适配并行 pt 化；保存成功行为改 window.open Blob URL 新标签预览 JSON；typecheck+oxlint 过）](./changelog/标签设计保存导出JSON.md)
- [标签设计默认字体大小改为8（store 新建默认 text 12→8、barcode 10→8、titleFontSize 10→8；画布/打印两端缺省回退 ??10/||10 同步 8，旧模板显式字号不受影响）](./changelog/标签设计默认字体大小改为8.md)
- [标签条码标题与编码值同行（alttext 中文乱码实证废弃→DOM 文本行方案：条码 PNG 只画条形，「标题:编码值」DOM 行居中条形下方、统一用「字号」；画布/打印两端同步，displayValue 关且无标题时不渲染行）](./changelog/标签条码标题与编码值同行.md)
- [标签设计默认不显示网格（store showGrid 初始值 true→false，纯内存无持久化改默认即生效；打印设计页独立状态不受影响）](./changelog/标签设计默认不显示网格.md)
- [标签设计缩放连体与移除垂直对齐（缩放三独立控件收敛为 NButtonGroup 连体 [-|100%|+]，点击百分比仍重置；删「垂直对齐」按钮并清理 store.verticalCenterAll 与 i18n 键三处死代码；追代：quaternary 连体不可见，改 default 带边框共享边线）](./changelog/标签设计缩放连体与移除垂直对齐.md)
- [标签设计快捷键（Ctrl+S/Z/Y/Shift+Z、X/C/V 剪切复制粘贴、Delete 删除、方向键 1/10/0.1mm 移动带长按会话与纸界钳制；工具栏加快捷键按钮 + Popover Windows/Mac 两列对照弹窗，输入框聚焦不拦截）](./changelog/标签设计快捷键.md)
- [标签设计工具栏模板下拉改纯文本（去 NSelect 选择器，props 收敛为 templateName，页面内不再提供模板切换入口，默认仍加载列表第一个模板）](./changelog/标签设计工具栏模板下拉改纯文本.md)
- [标签条码编码值间距样式（BarcodeOptions.textGap 透传 bwip-js textyoffset，新拖入默认 2pt、旧数据紧贴零影响，样式卡「字号」旁可调，画布/打印单点生效）](./changelog/标签条码编码值间距样式.md)
- [标签设计工具栏按截图改造（新增返回上一页/垂直对齐=全元素整体垂直居中/清空带 dialog 确认；缩放改独立 — 100% + 三元素，网格文案改「显示网格」，预览改白底描边；撤销/重做保留）](./changelog/标签设计工具栏按截图改造.md)
- [标签设计工具栏两行合一（去「标签设计」标题文字，模板选择+保存经 props/events 并入 tool-bar.vue 单行：模板选择|撤销重做|纸张|网格|缩放……预览 保存）](./changelog/标签设计工具栏两行合一.md)
- [标签设计 Shift 等比缩放（Shift+角手柄锁定拖拽起始宽高比、以宽驱动高，dragState 记 shiftKey 实时切换，边手柄不参与；预览与落库同源 resizeGeometry）](./changelog/标签设计Shift等比缩放.md)
- [标签条码编码值文本不显示（旧 designJson 缺 displayValue 字段 loadFromJson 原样还原 → includetext undefined；渲染层 displayValue!==false 兜底 + buildModel 补默认，node 实测 PNG 对比定位）](./changelog/标签条码编码值文本不显示.md)
- [标签设计元素 hover 虚线与选中实线（hover 未选中显示 1px 虚线提示可交互、选中改 2px 实线，纯 CSS :hover 零 JS 状态；追代：缩放手柄 8px 蓝底方块改 6px 白底蓝边圆点并修正与描边线错位）](./changelog/标签设计元素hover虚线与选中实线.md)
- [标签业务字段标题显示规则（拖入不再回退 label 当标题；FieldDef/ElementSeed 全链路增 showTitle，showTitle && title 同时为真才开关联标题，缺省全部不显示）](./changelog/标签业务字段标题显示规则.md)
- [标签设计右侧紧凑化+字段类型自定义（FormWrap 增 size prop 透传 NForm，属性面板 small+label 12px；FieldDef 增 elementType 按字段定义创建元素，废除拖入一律 longText 硬编码）](./changelog/标签设计右侧紧凑化与字段类型自定义.md)
- [标签选中/hover框横竖外扩不一致（outline 外扩本身均匀，扁宽元素占比差+scale 非整数缩放亚像素舍入造成观感差；offset 归零贴元素边界彻底消除）](./changelog/标签选中框横竖外扩不一致.md)
- [标签设计器缩放控件优化（四元素松散混排改 NButtonGroup 紧凑组合 [-|80%|+]，点击百分比重置 100% 带 title 提示，删独立重置按钮）](./changelog/标签设计器缩放控件优化.md)
- [标签设计器移除刻度（删 .ruler 元素与样式、工具栏切换按钮、store showRuler、i18n ruler 键，打印设计页不受影响）](./changelog/标签设计器移除刻度.md)
- [标签样式移除标题对齐+新增显示边框（titleAlign 在行内流下无意义全链路删除；BorderExtras 给 text/longText/barcode/qrcode 加开关+宽度+颜色边框，默认关，画布/打印两端同步）](./changelog/标签移除标题对齐与新增显示边框.md)
- [标签设计切换元素后输入框残留旧值（根因：新元素 title/field 为 undefined → naive NInput 走非受控分支回落实例内部值，组件实例跨元素复用残留上一元素输入；已实施方案 A：buildModel 预置受控空串）](./changelog/标签设计切换元素后输入框残留旧值.md)
- [标签设计器左右面板折叠样式统一（右侧属性面板三区块合并为单个裸 NCollapse 与左侧同款，header flex-1 箭头贴右、去加粗；二次迭代：各折叠内容区包 NCard size=small 白底描边卡）](./changelog/标签设计器左右面板折叠样式统一.md)
- [标签标题与内容垂直错位→行内连续排版（分栏布局被否定：baseline 对齐后用户明确要标题+内容填进同一文本流不分块；文本改行内前缀 span 排版，折行行首顶格，基线天然对齐，画布与打印两处同步）](./changelog/标签标题与内容垂直错位.md)
- [标签设计左侧面板折叠（field-panel 两组改为 NCollapse + arrow-placement right，默认全展开，组内结构与拖拽零改动）](./changelog/标签设计左侧面板折叠.md)
- [标签设计点击后高度被压缩（按下时 will-change:transform 提升合成层导致非整数 px 高度被栅格化舍入，视觉矮 1~2px 松手恢复；删除 will-change 两行，拖动性能不受影响）](./changelog/标签设计点击后高度被压缩.md)
- [标签设计点击元素跑到左上角（拖动优化回归：pointerup 无条件清空内联样式后纯点击不写 store、Vue 不重渲染无人恢复；改为清空后按 store 权威值恢复定位样式）](./changelog/标签设计点击元素跑到左上角.md)
- [标签设计数据预览栏（删「内容与绑定」卡并入数据预览：标题名称/字段类型/关联标题开关/占位文本/绑定信息条，标题渲染画布与打印同步，placeholder 回退链）](./changelog/标签设计数据预览栏.md)
- [标签设计表单超出NCard（FormWrap 的 NGrid cols=24 产生 23×16=368px 列间隙开销压塌窄面板轨道，属性面板 grid-x-gap 调小为 8）](./changelog/标签设计表单超出NCard.md)

## 2026-09-12

- [标签设计器拖动卡顿优化（根因：pointermove 无 rAF 合帧全链路响应式重渲染；方案 A 设计已确认：拖动期直写 DOM transform/几何、pointerup 一次写回 store，点击不拖不产生撤销点，待实施）](./changelog/标签设计器拖动卡顿优化.md)

## 2026-09-11

- [标签设计器新建独立组件（不修改现有 print-design：新建 label-designer 目录 + 路由，纯数据驱动 Vue 组件树 + bwip-js，与 hiprint 版并存）](./changelog/标签设计器新建独立组件.md)
- [标签设计器自研方案（完全替代 vue-plugin-hiprint：纯数据驱动 Vue 组件树 + 手写 pointer 交互 + bwip-js 条码，修复暗黑/撤销重做，v1 砍 table）](./changelog/%E6%A0%87%E7%AD%BE%E8%AE%BE%E8%AE%A1%E5%99%A8%E8%87%AA%E7%A0%94%E6%96%B9%E6%A1%88.md)
- [重写打印设计右侧属性面板（修正选中事件名 + 混合：简单字段 Naive 控件 + 复杂字段 hiprint 原生控件兜底，字段零遗漏）](./changelog/%E9%87%8D%E5%86%99%E6%89%93%E5%8D%B0%E8%AE%BE%E8%AE%A1%E5%8F%B3%E4%BE%A7%E5%B1%9E%E6%80%A7%E9%9D%A2%E6%9D%BF.md)
- [标签设计工作区无限画布改造（中间区改造成无限工作台+浮层纸张，拖动平移/滚轮缩放、刻度显隐按钮，缩放围绕纸张中心、范围0.2–4.0）](./changelog/%E6%A0%87%E7%AD%BE%E8%AE%BE%E8%AE%A1%E5%B7%A5%E4%BD%9C%E5%8C%BA%E6%97%A0%E9%99%90%E7%94%BB%E5%B8%83%E6%94%B9%E9%80%A0.md)
- [禁用标签设计框选（hiprint 在 .hiprint-printPaper 冒泡监听 mousedown 置 rectDraging 并创建 mouseRect 选框；改为捕获阶段拦截纸张空白 mousedown）](./changelog/%E7%A6%81%E7%94%A8%E6%A0%87%E7%AD%BE%E8%AE%BE%E8%AE%A1%E6%A1%86%E9%80%89.md)

## 2026-09-09

- [去掉标签设计界面最外层 padding（base-layout 按路由关掉 content 的 p-16px，仅打印设计页占满可视区）](./changelog/%E5%8E%BB%E6%8E%89%E6%A0%87%E7%AD%BE%E8%AE%BE%E8%AE%A1%E7%95%8C%E9%9D%A2%E6%9C%80%E5%A4%96%E5%B1%82padding.md)
- [预览弹窗宽度贴合标签纸（容器去 min-w-400px 改 w-fit + NModal 透传 content-style 去 NCard 左右内边距）](./changelog/%E9%A2%84%E8%A7%88%E5%BC%B9%E7%AA%97%E5%AE%BD%E5%BA%A6%E8%B4%B4%E5%90%88%E6%A0%87%E7%AD%BE%E7%BA%B8.md)
- [预览弹窗左右留白边（content-style 左右 padding 从 0 改回 16px，让纸张两侧各留一点白边）](./changelog/%E9%A2%84%E8%A7%88%E5%BC%B9%E7%AA%97%E5%B7%A6%E5%8F%B3%E7%95%99%E7%99%BD%E8%BE%B9.md)
- [标签预览弹窗不限制宽度（移除 w-800px 固定宽度，改为自适应 + maxWidth 95vw）](./changelog/%E6%A0%87%E7%AD%BE%E9%A2%84%E8%A7%88%E5%BC%B9%E7%AA%97%E4%B8%8D%E9%99%90%E5%88%B6%E5%AE%BD%E5%BA%A6.md)
- [打印预览测试数据不更新（getHtml 用固定 sample 覆盖 testData，改为读取设计器当前 testData）](./changelog/%E6%89%93%E5%8D%B0%E9%A2%84%E8%A7%88%E6%B5%8B%E8%AF%95%E6%95%B0%E6%8D%AE%E4%B8%8D%E6%9B%B4%E6%96%B0.md)
- [打印设计标尺不显示（设计画布未加载 hiprint 全局 CSS，显式补充 .hiprint_rul_wrapper 样式）](./changelog/%E6%89%93%E5%8D%B0%E8%AE%BE%E8%AE%A1%E6%A0%87%E5%B0%BA%E4%B8%8D%E6%98%BE%E7%A4%BA.md)

## 2026-09-08

- [通用 Table 新增 headerCellConfig prop（模板已引用但 Props 未声明，补齐声明与默认值）](./changelog/%E6%96%B0%E5%A2%9EheaderCellConfig.md)

## 2026-09-07

- [标签打印模板设计器实现（vue-plugin-hiprint：三栏设计器 + 字段 provider + 预览打印，已实现待手测）](./changelog/%E6%A0%87%E7%AD%BE%E6%89%93%E5%8D%B0%E6%A8%A1%E6%9D%BF%E8%AE%BE%E8%AE%A1%E5%99%A8%E5%AE%9E%E7%8E%B0.md)
- [标签打印模板设计器设计方案（vue-plugin-hiprint：独立路由页 + 自定义字段 provider + 浏览器预览打印）](./changelog/%E6%A0%87%E7%AD%BE%E6%89%93%E5%8D%B0%E6%A8%A1%E6%9D%BF%E8%AE%BE%E8%AE%A1%E5%99%A8%E8%AE%BE%E8%AE%A1%E6%96%B9%E6%A1%88.md)
- [字段映射卡片头部加各模块「一键全选」按钮（每个模块一个，点击切换全选/清空，新增 disabled prop）](./changelog/%E5%AD%97%E6%AE%B5%E6%98%A0%E5%B0%84%E5%8D%A1%E7%89%87%E5%A4%B4%E9%83%A8%E5%8A%A0%E5%90%84%E6%A8%A1%E5%9D%97%E4%B8%80%E9%94%AE%E5%85%A8%E9%80%89%E6%8C%89%E9%92%AE.md)
- [阿里巴巴普惠体字体子集化（自动提取项目文字生成 woff2，6.53MB→116KB）](./changelog/%E9%98%BF%E9%87%8C%E5%B7%B4%E5%B7%B4%E6%99%AE%E6%83%A0%E4%BD%93%E5%AD%97%E4%BD%93%E5%AD%90%E9%9B%86%E5%8C%96.md)
- [表格 detail 列复制图标改为「行 hover 显示」且移出 Link 组件（图标常占位 + rowid 关联固定列）](./changelog/%E8%A1%A8%E6%A0%BCdetail%E5%88%97%E5%A4%8D%E5%88%B6%E5%9B%BE%E6%A0%87%E6%94%B9%E4%B8%BA%E8%A1%8Chover%E6%98%BE%E7%A4%BA.md)

## 2026-09-05

- [分配权限界面改为表格模式（抽屉内 vxe 树形表格 + 双接口拼接列数据，已实现待手测）](./changelog/%E5%88%86%E9%85%8D%E6%9D%83%E9%99%90%E7%95%8C%E9%9D%A2%E6%94%B9%E4%B8%BA%E8%A1%A8%E6%A0%BC%E6%A8%A1%E5%BC%8F.md)
- [导出组件增加「数据范围」选项（全部 / 当前页 / 勾选数据），仅作用于 exceljs 字段选择弹窗（已实现，待手测）](./changelog/%E5%AF%BC%E5%87%BA%E8%8C%83%E5%9B%B4%E9%80%89%E9%A1%B9%E8%AE%BE%E8%AE%A1.md)
- [导出字段弹窗升级为「可新增字段」的编辑表格（可编辑列名 + 拖拽排序 + 自定义字段取数据/固定值）](./changelog/%E5%AF%BC%E5%87%BA%E5%AD%97%E6%AE%B5%E5%BC%B9%E7%AA%97%E5%8D%87%E7%BA%A7%E4%B8%BA%E5%8F%AF%E6%96%B0%E5%A2%9E%E5%AD%97%E6%AE%B5%E7%9A%84%E7%BC%96%E8%BE%91%E8%A1%A8%E6%A0%BC.md)
- [Table action-export 改为打开 vxe-table 原生高级导出弹窗](./changelog/Table%20action-export%20%E6%89%93%E5%BC%80%20vxe%20%E9%AB%98%E7%BA%A7%E5%AF%BC%E5%87%BA%E5%BC%B9%E7%AA%97.md)
- [共用导出 v3：Table 右上 action-export 回归 vxe 原生一键导出 + exceljs 字段选择导出放表格左侧操作栏（两套并存）](./changelog/共用导出组件设计.md)

## 2026-09-04

- [导出格式界面实现（左侧 13 项固定分类 + 右侧模板表格 + 新建/编辑含上传文件/删除，下载为占位）](./changelog/导出格式界面实现.md)
- [打印格式界面实现（左侧固定分类 + 右侧模板表格 + 新建/查看/复制/删除/设为默认）](./changelog/打印格式界面实现.md)
- [菜单「状态」选了仍报必填（FormWrap 必填规则带 trigger 导致数字值被判空）](./changelog/菜单状态必填校验失败.md)
- [录单格式「字段映射」高度自适应占满（MasterDetail slot 容器撑满 + FieldMapping fill）](./changelog/录单格式字段映射高度自适应占满.md)
- [录单格式列表启用/禁用不明显（MasterDetail 状态改实心彩色徽标）](./changelog/录单格式列表启用禁用不明显.md)
- [设置页整理：字段映射项改为 key/label/span 结构 + 清空其余 5 页占位内容（LookForward 空状态）](./changelog/设置页整理字段映射结构与占位清理.md)

## 2026-09-03

- [设置页 MasterDetail：启用/禁用与操作栏改为可选（showStatus/showActions）](./changelog/设置页MasterDetail状态与操作栏改为可选.md)
- [设置页操作按钮样式统一（工具栏 ghost 一致）](./changelog/设置页操作按钮样式统一.md)
- [系统设置点开卡死：路由重定向死循环修复（子页移出自动路由目录）](./changelog/系统设置点开卡死-路由重定向死循环修复.md)
- [录单格式列表 hover 样式修正（hover 与选中态区分）](./changelog/录单格式列表hover样式修正.md)
- [系统设置 tab 栏不够突出：NCard 包裹增强视觉层次](./changelog/系统设置tab栏不够突出.md)
- [系统设置右侧内容区补充背景卡片（MasterDetail 右侧 NCard 包裹）](./changelog/系统设置右侧内容区补充背景卡片.md)
- [系统设置：顶层 tab 固定显示「系统设置」+ 页内 tab 切子模块](./changelog/系统设置顶层tab显示系统设置.md)
- [系统设置：单一菜单项 + tab 切换（hiddenRoutes 配置 + 默认进入录单格式）](./changelog/系统设置单一菜单项与tab切换.md)
- [录单格式列表 hover 与选中高亮失效修复（改用 useThemeVars）](./changelog/录单格式列表hover与选中高亮修复.md)
- [pnpm release 提交被 pre-commit 钩子拦截（git diff --exit-code 失败）](./changelog/pnpm-release 提交被 pre-commit 拦截.md)
- [侧边栏菜单顺序 vs elegant-router 自动重排路由文件](./changelog/路由菜单顺序与elegant路由生成.md)
- [资料管理子档案按需懒加载（KeepAlive 缓存）](./changelog/资料管理子档案按需懒加载.md)
- [搜索栏独立封装为 SearchBar 组件（通用 Table 配置委托、各界面独立配置）](./changelog/搜索栏内置通用Table组件.md)

## 2026-09-01

- [菜单管理样式对齐](./changelog/菜单管理样式对齐.md)
- [菜单管理多级测试数据](./changelog/菜单管理多级测试数据.md)（已撤销）
- [菜单管理树形子级不显示](./changelog/菜单管理树形子级不显示.md)
- [图标选择器封装](./changelog/图标选择器封装.md)
- [图标选择器接入 xicons（@vicons）](./changelog/图标选择器接入xicons.md)
- [菜单排序必填校验不通过（number 字段缺 type）](./changelog/菜单排序必填校验不通过.md)
- [菜单管理操作列「增加子菜单」](./changelog/增加子菜单.md)
- [资料管理模块设计](./changelog/资料管理模块设计.md)（基础/财务/业务资料，方案 A 通用配置驱动组件）
- [pnpm release 命令报错诊断](./changelog/pnpm-release命令报错诊断.md)
- [资料管理子档案左侧子导航（不作为路由/菜单）](./changelog/资料管理子档案左侧子导航.md)

## 2026-08-31

- [重写 AGENTS 文档结构](./changelog/重写AGENTS文档结构.md)
- [菜单管理模块设计](./changelog/菜单管理模块设计.md)
- [角色管理搜索区改用 FormWrap](./changelog/角色管理搜索区改用FormWrap.md)
- [FormWrap 展开/收起 + 右侧独立按钮区 设计与实现](./changelog/FormWrap展开收起设计.md)
