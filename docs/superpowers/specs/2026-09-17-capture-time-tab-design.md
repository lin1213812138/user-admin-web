# 轨迹抓取配置「抓取时间」子 tab 设计

**日期**：2026-09-17
**关联记录**：[changelog/轨迹抓取配置新增抓取时间.md](../../../changelog/轨迹抓取配置新增抓取时间.md)

## 背景与问题

「系统设置 → 轨迹抓取配置」（`TraceCapture.vue`）现为 3 个子 tab：追踪网络 / 轨迹改造 / 轨迹关键词。
「抓取时间」子 tab 此前因「字段待定」被注释隐藏（见 `changelog/抓取时间模块先注释.md`），该分类下的旧 mock 数据（"定时抓取"，同构 7 列结构）保留未删。

用户本次提供两张产品截图，确定「抓取时间」的字段与交互：

1. **主表格（5 列）**：操作日志 / 操作系统 / 操作类型 / 操作人 / 操作时间 —— 展示抓取执行记录；
2. **表格工具栏左侧按钮** → 弹出「抓取时间设置」弹窗：说明文字「系统每天将在以下时间自动抓取轨迹」+ 时间行（可删除）+「添加时间」+「保存配置」。

经提问确认：① 位置 = 恢复为「轨迹抓取配置」第 4 个子 tab；② 截图的 5 列即该 tab 主表格列，展示抓取执行记录；③ 数据先走前端 DEV mock（后端 tms-user 暂无抓取时间接口）。

## 目标

- 「轨迹抓取配置」子 tab 恢复为 4 个：追踪网络 / 轨迹改造 / 轨迹关键词 / **抓取时间**。
- 「抓取时间」tab = 只读表格（5 列）+ 工具栏左侧「抓取时间设置」按钮 → 弹窗配置每日自动抓取时间点（HH:mm，可多个）。
- 数据走 DEV mock（对齐同页其它表）；非 DEV 代码路径留真实 `request` 占位。

## 方案

### 1. 子 tab 恢复（TraceCapture.vue）

- `configTabs` 取消 `capture-time` 一项的注释（恢复为 4 项）；
- 模板分支：`track-transform` → `TraceTransformTable`、`track-keyword` → `TraceKeywordTable`、`capture-time` → **`CaptureTimeTable`（新增）**、其余 → `TraceConfigTable`。

### 2. 主表格 CaptureTimeTable.vue（只读，按截图）

- `useVxeTable` 5 列，无序号列 / 无操作列：

  | key      | 标题     | 渲染                         | 宽度         |
  | -------- | -------- | ---------------------------- | ------------ |
  | log      | 操作日志 | 文本                         | minWidth 260 |
  | system   | 操作系统 | 文本                         | 130          |
  | opType   | 操作类型 | 文本                         | 130          |
  | operator | 操作人   | 文本                         | 110          |
  | opTime   | 操作时间 | 毫秒 → `YYYY-MM-DD HH:mm:ss` | 170          |

- 保留：刷新、列设置（`TableColumnConfig`）、分页；`cacheKey: 'trace-capture-time'`。
- 工具栏左侧（`operation-left` 插槽）单个按钮「抓取时间设置」→ 打开配置弹窗。

### 3. 配置弹窗 CaptureTimeModal.vue

- `NModal preset="card"`，宽 420；
- 结构：

  ```
  抓取时间设置                                    ✕
  ────────────────────────────────────────────
  系统每天将在以下时间自动抓取轨迹

  [ 🕐 03:00 ]   [删除]

  [添加时间]  [保存配置]
  ```

- 交互：
  - 打开时读取 mock 配置渲染时间行（无配置默认 1 行空值）；
  - 「添加时间」追加一行（空值）；「删除」移除该行，仅剩 1 行时禁用；
  - 「保存配置」校验：时间不能为空、不能重复 → 保存 → 成功提示 + 关闭；
  - 时间格式 `HH:mm`（每天定时执行，不含日期）。

### 4. 数据与接口（DEV mock）

类型（`typings/api/system-manage.d.ts`）：

```ts
/** 抓取时间 - 抓取执行记录 */
interface CaptureTimeRecord {
  id: number;
  log: string; // 操作日志
  system: string; // 操作系统
  opType: string; // 操作类型
  operator: string; // 操作人
  opTime: number; // 操作时间（毫秒）
}

type CaptureTimeRecordList = Api.Common.PaginatingQueryRecord<CaptureTimeRecord>;
type CaptureTimeSearchParams = Api.Common.CommonSearchParams;

/** 抓取时间 - 每日自动抓取时间点（HH:mm） */
type CaptureTimeConfig = string[];
type CaptureTimeConfigSaveParams = { times: Api.SystemManage.CaptureTimeConfig };
```

service 新目录 `service/api/capture-time/index.ts`（barrel 追加）：

- `fetchGetCaptureTimeRecordList` → `/system/capture-time/list`
- `fetchGetCaptureTimeConfig` → `/system/capture-time/config/get`
- `fetchSaveCaptureTimeConfig` → `/system/capture-time/config/save`

DEV 分支 → `mock.ts` 内存 mock：

- 抓取记录 6 条（操作日志/操作系统/操作类型/操作人/操作时间）；
- 配置默认 `['03:00']`，保存后内存生效；
- 顺带删除旧 `capture-time` 同构分类 mock 数据（"定时抓取 / 10.0.3.1:6000"，已无页面使用）。

### 5. i18n（zh-cn / en-us / typings/app.d.ts 三处同步）

`page.manage.setting.traceCapture` 下新增：

```ts
captureTime: {
  entry: '抓取时间设置',
  title: '抓取时间设置',
  desc: '系统每天将在以下时间自动抓取轨迹',
  addTime: '添加时间',
  saveConfig: '保存配置',
  timePlaceholder: '请选择时间',
  duplicateTime: '存在重复的抓取时间',
  emptyTime: '请先选择抓取时间',
  col: { log: '操作日志', system: '操作系统', opType: '操作类型', operator: '操作人', opTime: '操作时间' }
}
```

英文同步（Capture Time Settings / The system will automatically capture tracks at the following times every day 等）。

## 不改动

- 追踪网络 / 轨迹改造 / 轨迹关键词三个子 tab 及其 service / mock / i18n；
- `TraceCaptureCategory` 类型成员、`TraceConfigTable.categoryTabKey` 映射（保留 capture-time 成员）；
- 路由 / 菜单 / elegant 生成物；`setting/index.vue` 顶层 tabs。

## 验收

- 「轨迹抓取配置」4 个子 tab，第 4 个「抓取时间」可切换渲染；
- 表格 5 列、只读、分页 / 列设置 / 刷新可用；
- 弹窗可增 / 删时间行、保存后 mock 生效（重新打开可见）、单行时删除禁用、重复/空值有校验提示；
- `pnpm typecheck` / `pnpm lint` 0 错误；视觉与交互由用户复核。
