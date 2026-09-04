# 设置页整理实施计划（字段映射结构改造 + 占位页清空）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 两件事——(1) 把 `FieldMapping` 的 `fields` 从 `string[]` 改为 `{ key, label, span }` 对象数组，让字段拥有稳定标识与可配置的 24 栅格宽度，已选配置存 key 而非文案；(2) 除录单格式外，其余 5 个设置页的右侧占位内容全部清空，改为「敬请期待」空状态。

**Architecture:** 类型本体放进同目录 `field-mapping-config.ts`（对齐 `components/Form/form-config.ts` 的既有模式），`FieldMapping.vue` 用 `export type` 重导出，页面导入路径不变。组件内部 `NGrid` 由 `cols=3` 改为 `cols=24`，`span` 直接透传 `NGridItem`；列间距从 `x-gap` 改由 `NGridItem` 内容的 `pr-12px` 提供。5 个占位页的右侧整体删除，复用现有 `LookForward` 组件作空状态。

**Tech Stack:** Vue 3.5 `<script setup lang="ts">`、Naive UI 2.44（NGrid / NGridItem / NCheckbox）、TypeScript strict、oxfmt。

**执行顺序说明：** 先清空 5 个占位页（Task 2），再改 `FieldMapping` 组件（Task 3）。这样 Task 3 之后只剩 `InputFormat.vue` 1 处类型报错，而不是 6 处，验证信号更干净。

## Global Constraints

- span 语义为 **24 栅格**（同 `FormItemConfig.span`），缺省 **8**。
- `modelValue` 存 **key**，不存 label；类型仍是 `Record<string, string[]>`。
- label **继续硬编码中文**，本轮不引入 i18n。
- `navGroups` 各页自行保留（清空后仅 `InputFormat.vue` 一份）。
- 空状态**复用现有 `LookForward` 组件**，不新增 i18n key、不新增组件。
- 5 个占位页的列表三按钮**全部隐藏**（`:show-actions="false"`），`MasterDetail` 本体**不改动**。
- TypeScript strict，**禁止 `any`**。
- 格式化用 `pnpm fmt`（oxfmt），**不要手动调格式**；提交用 `pnpm commit:zh`，**不要直接 `git commit`**。
- 只用 pnpm，禁止 npm / yarn。
- 不动 `fill` / `NScrollbar` / 分组标题 `w-180px` 等已定稿的布局行为。
- 不动 `WaybillRule.vue`（Table 页面，无主从结构）。
- `PrintFormat.vue` 的 6 个既有 `@typescript-eslint/no-unused-vars` 误报，本次清理后应自然消失。

## 文件清单

| 文件                                                                 | 动作                      |
| -------------------------------------------------------------------- | ------------------------- |
| `src/views/system-manage/setting/components/field-mapping-config.ts` | 新建（类型定义）          |
| `src/views/system-manage/setting/components/FieldMapping.vue`        | 修改（重导出 + 栅格改造） |
| `src/views/system-manage/setting/modules/InputFormat.vue`            | 修改（迁移为新结构）      |
| `src/views/system-manage/setting/modules/PrintFormat.vue`            | 修改（清空）              |
| `src/views/system-manage/setting/modules/ExportFormat.vue`           | 修改（清空）              |
| `src/views/system-manage/setting/modules/NotificationConfig.vue`     | 修改（清空）              |
| `src/views/system-manage/setting/modules/InitData.vue`               | 修改（清空）              |
| `src/views/system-manage/setting/modules/StationScan.vue`            | 修改（清空）              |
| `changelog/设置页整理字段映射结构与占位清理.md`                      | 新建                      |
| `AGENTS_CHANGELOG.md`                                                | 修改（追加索引）          |

---

### Task 1: 新增类型定义文件

**Files:**

- Create: `src/views/system-manage/setting/components/field-mapping-config.ts`

**Interfaces:**

- Consumes: 无（本任务是后续任务的类型来源）
- Produces: `FieldMappingField { key: string; label: string; span?: number }`、`FieldMappingGroup { key: string; title: string; fields: FieldMappingField[] }`

- [ ] **Step 1: 创建类型文件**

```ts
/** 字段映射中的单个可勾选项 */
export interface FieldMappingField {
  /** 字段标识，作为 modelValue 中存储与比对的值，组内唯一 */
  key: string;
  /** 展示文案 */
  label: string;
  /** 24 栅格宽度（1..24），同 FormItemConfig.span；缺省 8 */
  span?: number;
}

/** 字段映射分组 */
export interface FieldMappingGroup {
  /** 分组标识，同时作为 modelValue 的键 */
  key: string;
  /** 分组标题 */
  title: string;
  fields: FieldMappingField[];
}
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck`
Expected: PASS（新文件未被引用，不影响既有代码）

---

### Task 2: 清空 5 个占位页的右侧内容

**Files:**

- Modify: `src/views/system-manage/setting/modules/PrintFormat.vue`
- Modify: `src/views/system-manage/setting/modules/ExportFormat.vue`
- Modify: `src/views/system-manage/setting/modules/NotificationConfig.vue`
- Modify: `src/views/system-manage/setting/modules/InitData.vue`
- Modify: `src/views/system-manage/setting/modules/StationScan.vue`

**Interfaces:**

- Consumes: `MasterDetail`（`../components/MasterDetail.vue`，不改动）、`LookForward`（自动按需引入）
- Produces: 无

**背景：** 这 5 个页面的右侧「基本信息表单 + 字段映射卡片」是从同一模板复制的假数据。
必须一并隐藏列表三按钮，否则点「新建/编辑」会置 `isEditing = true`，
使 `MasterDetail` 的 `:editable` 变 false 而锁死列表，且右侧清空后没有「保存/取消」可退出。

每个文件执行下面 4 步。

- [ ] **Step 1: 精简 script 段**

删除这些导入：`NFormWrap`、`type FormItemConfig`、`FieldMapping`、`computed`、`$t`（清理后若不再使用）。
删除这些声明：`navGroups`、`formModel`、`fieldModel`、`formItems`、`isEditing`、`current`、
`loadCurrent`、`handleCreate`、`handleEdit`、`handleDelete`、`handleSave`、`handleCancel`；
`StationScan.vue` 的 `handleSelect` 也删除。
`Item` 接口只留 `id` / `name` / `status`，`items` 各条目只留这三个字段。

`ExportFormat.vue` / `NotificationConfig.vue` / `InitData.vue` / `PrintFormat.vue` 改写后的完整 script：

```ts
import { ref } from 'vue';
import MasterDetail from '../components/MasterDetail.vue';

interface Item {
  id: number;
  name: string;
  status: Api.Common.EnableStatus;
}

const items = ref<Item[]>([
  { id: 1, name: '默认导出格式', status: 1 },
  { id: 2, name: '客户导出格式', status: 1 }
]);

const selectedId = ref<number | null>(items.value[0]?.id ?? null);
```

各文件 `items` 的 `name` 依次为：

各文件 `items` 的两条 `name` / `status` 依次为：

| 文件                     | id 1                     | id 2                     |
| ------------------------ | ------------------------ | ------------------------ |
| `PrintFormat.vue`        | `'默认打印格式'` / `1`   | `'客户打印格式'` / `1`   |
| `ExportFormat.vue`       | `'默认导出格式'` / `1`   | `'客户导出格式'` / `1`   |
| `NotificationConfig.vue` | `'系统通知'` / `1`       | `'短信通知'` / `1`       |
| `InitData.vue`           | `'基础数据初始化'` / `1` | `'业务数据初始化'` / `1` |
| `StationScan.vue`        | `'默认扫描配置'` / `1`   | `'高速扫描配置'` / `1`   |

五个文件的 `items` 结构完全一致，仅上表的 `name` 不同，均改写为 Task 2 Step 1 的形态。

- [ ] **Step 2: 替换 template 段**

`ExportFormat.vue` 的完整目标形态（其余文件仅 `list-title` 与 `items` 不同）：

```vue
<template>
  <MasterDetail
    list-title="导出格式列表"
    search-placeholder="搜索列表"
    :items="items"
    :show-status="true"
    :show-actions="false"
    :selected-id="selectedId"
    @update:selected-id="id => (selectedId = id)"
  >
    <LookForward />
  </MasterDetail>
</template>
```

各文件的 `list-title`：**打印格式列表**（PrintFormat）/ **导出格式列表**（ExportFormat）/
**通知配置列表**（NotificationConfig）/ **初始化数据列表**（InitData）/ **站点扫描配置列表**（StationScan）。
`search-placeholder` 五页统一为 `搜索列表`，`:show-status="true"` 五页一致。

`PrintFormat.vue` 额外注意：其 `<NFormWrap>` / `<FieldMapping>` 是**被注释掉**的整块（原第 133-145 行），
连同注释一并删除，不要留下注释残留。

- [ ] **Step 3: 逐文件自检**

确认每个文件已无以下内容残留：`navGroups`、`formModel`、`fieldModel`、`formItems`、`isEditing`、
`loadCurrent`、`handleSave`、`handleCancel`、`:editable`、`@create`、`@edit`、`@delete`、
`#operation-extra`、`NFormWrap`、`FieldMapping`。

- [ ] **Step 4: 类型检查**

Run: `pnpm typecheck`
Expected: PASS，0 error（纯删除 + `LookForward` 已在 `src/typings/components.d.ts` 注册，无需导入）

- [ ] **Step 5: lint 确认既有误报变化**

Run: `pnpm lint`
Expected: `PrintFormat.vue` 的 6 个 `@typescript-eslint/no-unused-vars` 应已消失（未使用变量被删除）。
若仍存在或出现新报错，记录并继续，由 Task 5 统一核对基线。

---

### Task 3: 改造 FieldMapping 组件

**Files:**

- Modify: `src/views/system-manage/setting/components/FieldMapping.vue:1-64`

**Interfaces:**

- Consumes: Task 1 的 `FieldMappingField` / `FieldMappingGroup`
- Produces: props 形态不变（`navGroups` / `modelValue` / `fill`），仅元素类型收紧

- [ ] **Step 1: 替换 script 段的类型定义与导入**

把文件顶部的 `interface NavGroup`（第 6-10 行）整块删除，改为导入 + 重导出（对齐 `src/components/Form/index.vue:5,8` 的写法）：

```ts
import { computed } from 'vue';
import type { CSSProperties } from 'vue';
import { $t } from '@/locales';
import type { FieldMappingGroup } from './field-mapping-config';

export type { FieldMappingField, FieldMappingGroup } from './field-mapping-config';

const props = withDefaults(
  defineProps<{
    navGroups: FieldMappingGroup[];
    modelValue: Record<string, string[]>;
    /** 占满父容器剩余高度，内容溢出时只在卡片内部滚动（右侧内容各页独有，按需开启） */
    fill?: boolean;
  }>(),
  { fill: false }
);
```

- [ ] **Step 2: 改造模板区的栅格渲染**

```vue
<NScrollbar class="min-h-0" :class="{ 'flex-1': fill }">
      <div v-for="g in navGroups" :key="g.key" class="flex items-baseline gap-16px mb-12px last:mb-0">
        <div class="w-180px py-8px font-medium">
          {{ g.title }}
        </div>
        <div class="min-w-0 flex-1">
          <NGrid :cols="24" :x-gap="0" :y-gap="8">
            <NGridItem v-for="f in g.fields" :key="f.key" :span="f.span ?? 8">
              <NCheckbox
                class="w-full pr-12px"
                :checked="(modelValue[g.key] ?? []).includes(f.key)"
                @update:checked="checked => toggleField(g.key, f.key, checked)"
              >
                {{ f.label }}
              </NCheckbox>
            </NGridItem>
          </NGrid>
        </div>
      </div>
    </NScrollbar>
```

为什么这么改（三点，缺一不可）：

1. `:cols="24"` —— 与 `span` 同基准，`f.span` 可原样透传，避免 `span / 24 * cols` 的非整除换算。
2. `:x-gap="0"` —— `NGrid` 的 `x-gap` 落在 CSS `column-gap`，24 列会产生 **23 个** 列间距
   （12px × 23 ≈ 276px），内容区会被挤没。列间距改由 `NGridItem` 内容的 `pr-12px` 提供，与列数无关。
3. `:span="f.span ?? 8"` —— 缺省 8 等价于改造前的一行 3 个。

`contentStyle` 计算属性、`toggleField` 函数、`NCard` 的 `fill` 相关绑定**全部保持原样不动**。

- [ ] **Step 3: 类型检查（预期 1 处失败）**

Run: `pnpm typecheck`
Expected: FAIL，仅 `InputFormat.vue` 1 处
`Type 'string[]' is not assignable to type 'FieldMappingField[]'`。
（Task 2 已清掉另外 5 个使用方；若此处报错多于 1 个，说明 Task 2 有残留，先回去补。）
该报错由 Task 4 清零。

---

### Task 4: 迁移 InputFormat.vue

**Files:**

- Modify: `src/views/system-manage/setting/modules/InputFormat.vue:6`（导入）、`:17-23`（navGroups）、`:72-219`（items 的 fields）

**Interfaces:**

- Consumes: Task 1 的 `FieldMappingGroup`
- Produces: 无（叶子页面，也是 `FieldMapping` 改造后唯一的使用方）

- [ ] **Step 1: 导入分组类型**

```ts
import FieldMapping, { type FieldMappingGroup } from '../components/FieldMapping.vue';
```

（替换现有的 `import FieldMapping from '../components/FieldMapping.vue';`）

- [ ] **Step 2: 替换 navGroups（第 17-23 行）**

```ts
const navGroups: FieldMappingGroup[] = [
  {
    key: 'waybill',
    title: '运单信息',
    fields: [
      { key: 'bizRemark', label: '业务备注' },
      { key: 'innerRemark', label: '内部备注' },
      { key: 'subtotal', label: '小计金额' },
      { key: 'netWeight', label: '净重' },
      { key: 'goodsCount', label: '货物件数' },
      { key: 'length', label: '长' },
      { key: 'width', label: '宽' }
    ]
  },
  {
    key: 'receiver',
    title: '收件人信息',
    fields: [
      { key: 'receiverName', label: '收件人姓名' },
      { key: 'receiverPhone', label: '电话' },
      { key: 'receiverAddress', label: '地址', span: 12 },
      { key: 'receiverCompany', label: '公司' }
    ]
  },
  {
    key: 'sender',
    title: '发件人信息',
    fields: [
      { key: 'senderName', label: '发件人姓名' },
      { key: 'senderPhone', label: '电话' },
      { key: 'senderAddress', label: '地址', span: 12 }
    ]
  },
  {
    key: 'goods',
    title: '物品信息',
    fields: [
      { key: 'goodsName', label: '品名' },
      { key: 'quantity', label: '数量' },
      { key: 'weight', label: '重量' },
      { key: 'volume', label: '体积' }
    ]
  },
  {
    key: 'subItem',
    title: '子件信息',
    fields: [
      { key: 'singleVolume', label: '单件材积' },
      { key: 'chargeWeight', label: '计费重' },
      { key: 'singleWeight', label: '单件重量' }
    ]
  }
];
```

两处 `span: 12` 用于验证半行效果，其余走缺省 8。

- [ ] **Step 3: 替换 items 的 fields（第 72-219 行）**

`id: 1` 到 `id: 3` 改写后的完整结果：

```ts
    fields: {
      waybill: ['bizRemark', 'innerRemark'],
      receiver: [],
      sender: [],
      goods: ['subtotal', 'netWeight', 'goodsCount', 'length', 'width'],
      subItem: ['singleVolume', 'chargeWeight']
    }
```

```ts
    fields: {
      waybill: ['bizRemark'],
      receiver: ['receiverName'],
      sender: [],
      goods: ['netWeight', 'goodsCount'],
      subItem: []
    }
```

```ts
    fields: {
      waybill: ['bizRemark', 'innerRemark', 'subtotal', 'netWeight', 'goodsCount', 'length', 'width'],
      receiver: ['receiverName', 'receiverPhone', 'receiverAddress', 'receiverCompany'],
      sender: ['senderName', 'senderPhone', 'senderAddress'],
      goods: ['goodsName', 'quantity', 'weight', 'volume'],
      subItem: ['singleVolume', 'chargeWeight', 'singleWeight']
    }
```

`id: 4` 到 `id: 10` 改写后的完整结果：

```ts
    // id: 4 同城速递录单
    fields: {
      waybill: ['bizRemark'],
      receiver: ['receiverName', 'receiverPhone', 'receiverAddress'],
      sender: ['senderName', 'senderPhone'],
      goods: ['goodsName', 'quantity'],
      subItem: []
    }
```

```ts
    // id: 5 冷链专线录单
    fields: {
      waybill: ['bizRemark', 'innerRemark', 'netWeight', 'goodsCount'],
      receiver: ['receiverName', 'receiverPhone', 'receiverAddress'],
      sender: ['senderName', 'senderPhone'],
      goods: ['goodsName', 'quantity', 'weight', 'volume'],
      subItem: ['singleVolume', 'singleWeight']
    }
```

```ts
    // id: 6 到付录单
    fields: {
      waybill: ['bizRemark', 'subtotal'],
      receiver: ['receiverName', 'receiverPhone', 'receiverAddress'],
      sender: ['senderName'],
      goods: ['goodsName', 'quantity', 'weight'],
      subItem: []
    }
```

```ts
    // id: 7 临时录单
    fields: {
      waybill: ['bizRemark'],
      receiver: ['receiverName'],
      sender: [],
      goods: ['goodsName'],
      subItem: []
    }
```

```ts
    // id: 8 大件物流录单
    fields: {
      waybill: ['bizRemark', 'innerRemark', 'subtotal', 'netWeight', 'goodsCount', 'length', 'width'],
      receiver: ['receiverName', 'receiverPhone', 'receiverAddress'],
      sender: ['senderName', 'senderPhone', 'senderAddress'],
      goods: ['goodsName', 'quantity', 'weight', 'volume'],
      subItem: ['singleVolume', 'chargeWeight']
    }
```

```ts
    // id: 9 电商专用录单
    fields: {
      waybill: ['bizRemark'],
      receiver: ['receiverName', 'receiverPhone', 'receiverAddress', 'receiverCompany'],
      sender: [],
      goods: ['goodsName', 'quantity', 'weight'],
      subItem: []
    }
```

```ts
    // id: 10 测试模板
    fields: {
      waybill: ['bizRemark', 'innerRemark', 'subtotal'],
      receiver: [],
      sender: [],
      goods: [],
      subItem: []
    }
```

注意 `sender` 组内的「电话」「地址」映射到 `senderPhone` / `senderAddress`，**不要**写成 `receiver*`。

第 206-219 行由 `Array.from({ length: 30 }, ...)` 生成的 30 条同样替换：

```ts
    fields: {
      waybill: ['bizRemark', 'innerRemark'],
      receiver: i % 2 === 0 ? ['receiverName', 'receiverPhone', 'receiverAddress'] : [],
      sender: i % 2 === 0 ? ['senderName', 'senderPhone', 'senderAddress'] : [],
      goods: ['goodsName', 'quantity', 'weight', 'volume'],
      subItem: i % 3 === 0 ? ['singleVolume', 'chargeWeight'] : []
    }
```

- [ ] **Step 4: 类型检查**

Run: `pnpm typecheck`
Expected: PASS，0 error（Task 3 的 1 处报错清零）

---

### Task 5: 全量验证

**Files:**

- 无新增改动，仅验证

- [ ] **Step 1: 类型检查**

Run: `pnpm typecheck`
Expected: PASS，0 error。

- [ ] **Step 2: lint**

Run: `pnpm lint`
Expected: PASS，0 error —— `PrintFormat.vue` 的 6 个既有误报应已在 Task 2 后消失。
若仍失败，用 `git stash` 跑一次基线对比：报错集合不应比基线更多；超出部分必须修复后重跑。

- [ ] **Step 3: 格式化**

Run: `pnpm fmt`
Expected: 若 oxfmt 调整了格式会改动文件；此时需再次执行 Step 1 确认仍 PASS。
**不要手动调格式**，一律交给 oxfmt。

- [ ] **Step 4: 生产构建**

Run: `pnpm build`
Expected: BUILD SUCCESS。

- [ ] **Step 5: 浏览器冒烟（系统设置页）**

启动 `pnpm dev`，按 A / B 两组逐项确认。

**A. 录单格式（内容未变）**

1. 字段映射卡片中默认字段仍为**一行 3 个**（验证缺省 span=8 正确）。
2. 收件人 / 发件人的「地址」占**半行**（验证 `span: 12` 生效）。
3. 列间距视觉与改造前**基本一致**（验证 `x-gap=0` + `pr-12px` 生效，未出现 24 列把内容挤没）。
4. 勾选若干字段 → 保存 → 切换左侧其它格式 → 切回，**勾选状态正确回填**（验证存 key 的链路完整）。

**B. 其余 5 个 tab（已清空）**

5. 打印格式 / 导出格式 / 通知配置 / 初始化数据 / 站点扫描：右侧均显示**「敬请期待」**。
6. 这 5 个 tab 的右侧顶部**没有**新建 / 编辑 / 删除按钮。
7. 左侧列表**可点击切换高亮**，搜索框可用。
8. **反复点击列表项、来回切换 tab，确认列表不会被锁死**（验证 Task 2 的死结已解开）。
9. 切回录单格式，确认 `KeepAlive`（`setting/index.vue:50`）下勾选状态与选中项未串。

---

### Task 6: 记录到 changelog

**Files:**

- Create: `changelog/设置页整理字段映射结构与占位清理.md`
- Modify: `AGENTS_CHANGELOG.md`（按日期分组追加索引，日期最新在上）

依据仓库约定（AGENTS.md 规则 1），本轮讨论必须沉淀为独立文档并链接进索引。

- [ ] **Step 1: 写 changelog 文档**

需覆盖两件事：

1. **字段映射结构改造**：问题背景（一行几个写死、label 与存储值混用）、三项决策
   （24 栅格 / 存 key / 不 i18n）、组件改造要点（cols=24、`x-gap` 的 23 个间距坑、span 缺省 8）、
   迁移清单（仅 `InputFormat.vue` 的 21 字段与 40 条 mock）。
2. **占位页清空**：5 个页面清单、复用 `LookForward` 而非新增组件、
   **列表三按钮必须隐藏的原因**（`isEditing` → `editable` → 出口依赖保存/取消 → 清空后锁死列表）。

设计文档链接：
`../docs/superpowers/specs/2026-09-04-field-mapping-item-structure-design.md`、
`../docs/superpowers/specs/2026-09-04-setting-placeholder-clear-design.md`；
实施计划链接：`../docs/superpowers/plans/2026-09-04-field-mapping-item-structure.md`。

- [ ] **Step 2: 追加索引到 AGENTS_CHANGELOG.md**

先读文件确认现有分组格式，再按同样格式在**最新日期分组**下追加一条指向
`changelog/设置页整理字段映射结构与占位清理.md` 的链接。

- [ ] **Step 3: 提交（仅在用户要求时执行）**

Run: `pnpm commit:zh`
说明：**不要直接 `git commit`**，仓库 `commit-msg` 钩子由 `sa git-commit-verify` 校验 Conventional Commits。
建议分两次提交：`refactor(setting): 清空 5 个占位页右侧内容` 与
`refactor(setting): 字段映射项改为 key/label/span 结构`。
