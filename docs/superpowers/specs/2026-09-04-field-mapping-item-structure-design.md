# 字段映射项结构改造设计（key / label / span）

日期：2026-09-04
范围：`src/views/system-manage/setting/components/FieldMapping.vue` + 6 个 `setting/modules/*.vue`

## 背景

`FieldMapping`（字段映射卡片）目前把「可勾选的字段」表达为裸字符串数组：

```ts
interface NavGroup {
  key: string;
  title: string;
  fields: string[]; // ['业务备注', '内部备注', ...]
}
```

由此带来三个问题：

1. **一行显示几个字段被写死**：`NGrid :cols="3"`，每个字段固定占 1/3，无法让某个字段占半行或独占一行。
2. **显示文案与存储值混用**：`modelValue` 里存的是 label 文案本身（`{ waybill: ['业务备注'] }`），改一个字的文案，已保存的配置就全部失配。
3. **字段没有稳定标识**：不同分组存在同名文案（收件人「电话」与发件人「电话」），只能靠分组隔离，无法跨组引用。

本次改造把 `fields` 改为 `{ key, label, span }` 对象数组，一次解决以上三点。

## 已确认决策

| 决策点     | 结论                                                                           |
| ---------- | ------------------------------------------------------------------------------ |
| span 基准  | **24 栅格**，与 `FormItemConfig.span` 语义一致（8 = 1/3，12 = 1/2，24 = 整行） |
| modelValue | **存 key**，不存 label                                                         |
| label 文案 | 本轮**继续硬编码中文**，不引入 i18n                                            |
| navGroups  | **6 个页面各自保留**自己的常量，不抽取共享文件                                 |

## 数据契约

新增 `src/views/system-manage/setting/components/field-mapping-config.ts`（模式对齐 `src/components/Form/form-config.ts`）：

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
  key: string;
  title: string;
  fields: FieldMappingField[];
}
```

`FieldMapping.vue` 内用 `export type { FieldMappingField, FieldMappingGroup } from './field-mapping-config';`
重导出（与 `Form/index.vue` 第 8 行 `export type { FormItemConfig } from './form-config';` 同款写法，
`<script setup>` 中 `export type` 允许，编译期被剥离），页面侧仍可从 `.vue` 导入类型，无需改导入路径。

组件 props / emits 形态不变，仅元素类型收紧：

```ts
navGroups: FieldMappingGroup[];
modelValue: Record<string, string[]>; // 值语义变为 key 数组
```

## 组件改造

`FieldMapping.vue` 模板区变更：

```vue
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
```

四处变化，逐条说明：

1. **`:cols="3"` → `:cols="24"`**：栅格基数与 `span` 对齐，`f.span` 可直接透传给 `NGridItem`，
   不需要做 `span / 24 * cols` 的换算（换算在非整除时会丢精度，是该方案的固有缺陷，用 cols=24 直接绕开）。
2. **`:x-gap="12"` → `:x-gap="0"`（关键坑）**：`NGrid` 的 `x-gap` 落在 CSS `column-gap` 上，
   24 列会产生 **23 个** 列间距，12px × 23 ≈ 276px 横向被吃掉，内容区基本被挤没。
   因此列间距改为由 `NGridItem` 内容的 `pr-12px` 提供，视觉间距不变且与列数无关。
3. **`y-gap` 保持 8**：行间距数量等于行数，不随列数膨胀，无需调整。
4. **`toggleField` 传 `f.key`、`includes(f.key)`、显示 `f.label`**：存 key、显 label，解耦完成。

行为不变部分：`fill` prop、`contentStyle` 计算、`NScrollbar` 包裹、分组标题 `w-180px` 布局一律不动。

## 页面与 mock 数据迁移

6 个页面全部改为对象数组；`items` 里的 `fields` 由中文 label 改为 key。

### InputFormat.vue（唯一有真实字段映射的页面）

5 组 21 个字段（waybill 7 / receiver 4 / sender 3 / goods 4 / subItem 3），key 命名与建议 span：

| 分组 key | 字段 key        | label      | span |
| -------- | --------------- | ---------- | ---- |
| waybill  | bizRemark       | 业务备注   | 8    |
| waybill  | innerRemark     | 内部备注   | 8    |
| waybill  | subtotal        | 小计金额   | 8    |
| waybill  | netWeight       | 净重       | 8    |
| waybill  | goodsCount      | 货物件数   | 8    |
| waybill  | length          | 长         | 8    |
| waybill  | width           | 宽         | 8    |
| receiver | receiverName    | 收件人姓名 | 8    |
| receiver | receiverPhone   | 电话       | 8    |
| receiver | receiverAddress | 地址       | 12   |
| receiver | receiverCompany | 公司       | 8    |
| sender   | senderName      | 发件人姓名 | 8    |
| sender   | senderPhone     | 电话       | 8    |
| sender   | senderAddress   | 地址       | 12   |
| goods    | goodsName       | 品名       | 8    |
| goods    | quantity        | 数量       | 8    |
| goods    | weight          | 重量       | 8    |
| goods    | volume          | 体积       | 8    |
| subItem  | singleVolume    | 单件材积   | 8    |
| subItem  | chargeWeight    | 计费重     | 8    |
| subItem  | singleWeight    | 单件重量   | 8    |

「地址」给 12 是为了同时验证 span 生效（半行）与默认 8（1/3 行）的混排效果。

`items` 中 10 条 mock 的 `fields` 同步替换，例：

```ts
// before
fields: { waybill: ['业务备注', '内部备注'], goods: ['小计金额', '净重'] }
// after
fields: { waybill: ['bizRemark', 'innerRemark'], goods: ['subtotal', 'netWeight'] }
```

文件名 `extraFormatNames` 生成的 30 条 mock（第 206-219 行）同样处理。

### ExportFormat / StationScan / InitData / NotificationConfig

4 个页面的 `navGroups` 内容完全相同（均为占位数据），按各自文件改成：

```ts
const navGroups: FieldMappingGroup[] = [
  {
    key: 'waybill',
    title: '运单信息',
    fields: [
      { key: 'bizRemark', label: '业务备注' },
      { key: 'innerRemark', label: '内部备注' },
      { key: 'subtotal', label: '小计金额' },
      { key: 'netWeight', label: '净重' }
    ]
  },
  {
    key: 'goods',
    title: '物品信息',
    fields: [
      { key: 'goodsName', label: '品名' },
      { key: 'quantity', label: '数量' },
      { key: 'weight', label: '重量' }
    ]
  }
];
```

这 4 页 `items` 中的 `fields: { waybill: ['业务备注'], goods: ['品名'] }` → `{ waybill: ['bizRemark'], goods: ['goodsName'] }`。

`span` 全部省略走默认 8，视觉上与现在的 3 列完全一致。

### PrintFormat.vue

其 `<FieldMapping>` 整块已被注释（第 140-145 行），但 `navGroups` 常量仍在。
**同步改成对象数组**，避免后续解注释时类型不匹配。该页面现存的 6 个
`@typescript-eslint/no-unused-vars` 误报（模板中确有使用）属既有问题，**本轮不处理**。

## 不做的事

- 不引入 i18n（label 保持硬编码中文，等接真实接口时统一处理）。
- 不抽 `navGroups` 到共享文件（遵循「右侧内容各页独有」的既有约定）。
- 不改 `fill` / `NScrollbar` / 分组标题宽度等布局行为（上一轮刚定稿）。
- 不新增响应式断点（不做 `span: '8 m:12'` 这类字符串形式，`FormItemConfig` 支持但本轮不需要）。
- 不动 `PrintFormat.vue` 的 lint 误报。

## 验证

1. `pnpm typecheck` — 无 `any`，`navGroups` 字面量需能匹配 `FieldMappingGroup[]`。
2. `pnpm lint` — 注意 `PrintFormat.vue` 的 6 个既有误报仍在，属预期。
3. `pnpm build`。
4. 冒烟：系统设置 → 录单格式 → 字段映射卡片，确认
   - 默认 8 的字段仍是一行 3 个；
   - 「地址」占半行；
   - 勾选 / 保存 / 切换左侧格式后回填正确（验证存 key 后回填链路正常）；
   - 列间距视觉与改造前一致（验证 `x-gap=0` + `pr-12px` 生效）。
