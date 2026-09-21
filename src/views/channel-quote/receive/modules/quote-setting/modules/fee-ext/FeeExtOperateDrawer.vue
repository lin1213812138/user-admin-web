<script setup lang="ts">
/**
 * 渠道加收 · 新增加收抽屉
 *
 * 字段对齐老系统「新增加收」弹窗 + 后端 ChannelFeeExt 模型：
 * 加收名称 / 加收类型 / 加收目的地 / 加收费用 / 加收条件 / 状态 / 备注。
 *
 * 契约要点（已核 tms-user `lib/common/models/channel-fee-ext.js`）：
 * - `name` 为普通字符串（无外键），同渠道内唯一（uniqField:'name' + uniqFilter:{refId}）；
 * - `expr` 仅作展示与「无条件加收」标记，后端计费只读 `varType` + `start`/`end`；
 * - 加收类型决定计费口径：0 按重量(重量×单价) 1 按票 2 按件 3 按重量超出部分((重量−start)×单价)。
 *
 * 交互优化（相对老系统）：条件不再靠「按钮拼接 + 填充 + 清空公式」，改为
 * 「变量下拉 + 区间组（[>|≥] 值 ～ [<|≤] 值）+ 实时生成表达式」，两端可只填一端；
 * 表达式里的数值随变量类型带单位（重量 KG / 长度 CM / 体积 CBM），与输入框后缀同源。
 */
import { computed, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import type { SelectOption } from 'naive-ui';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap from '@/components/Form/index.vue';
import type { FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateChannelFeeExt, fetchUpdateChannelFeeExt } from '@/service/api/channel-fee-ext';
import { fetchGetFeeTypeList } from '@/service/api/fee-type';
import { fetchGetCountryList } from '@/service/api/data-manage-basic';

type FeeExtStrategy = Api.ChannelQuote.FeeExtStrategy;
type FeeExtVarType = Api.ChannelQuote.FeeExtVarType;

/** 条件变量下拉的「无条件」占位值（NSelect 选项值不支持 null） */
const VAR_TYPE_NONE = -1;

/**
 * 「无条件」的 expr 魔法值：后端 `channel-fee-ext.js` 以 `expr === '无条件加收'` 判定费用恒生效。
 * 这是提交给后端的契约值，不随 i18n 展示文案（varTypeOption.none =「无条件」）变化。
 */
const EXPR_UNCONDITIONAL = '无条件加收';

const props = defineProps<{
  /** 所属渠道（报价设置页带入） */
  channelId: string;
}>();

const emit = defineEmits<{ submitted: [] }>();

const visible = ref(false);
const submitting = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

/** 抽屉模式：新增 / 编辑（编辑时提交走 /update 并带上 _id） */
const mode = ref<'create' | 'edit'>('create');
/** 编辑中的加收 _id */
const editingId = ref('');

const title = computed(() =>
  mode.value === 'create'
    ? $t('page.channelQuote.quoteSetting.feeExt.addTitle')
    : $t('page.channelQuote.quoteSetting.feeExt.editTitle')
);

/** 表单模型：空值统一 null / 空数组，不写空字符串 */
interface FeeExtForm {
  name: string | null;
  strategy: FeeExtStrategy;
  countryIds: string[];
  price: number | null;
  /** 条件变量：null = 无条件加收 */
  varType: FeeExtVarType | null;
  /** 区间开始运算符 0-大于 1-大于等于 */
  startOp: 0 | 1;
  startValue: number | null;
  /** 区间结束运算符 2-小于 3-小于等于 */
  endOp: 2 | 3;
  endValue: number | null;
  /** 条件表达式（custom 项的校验字段，同时是提交字段） */
  expr: string;
  status: 0 | 1;
  note: string;
}

const form = reactive<FeeExtForm>(emptyForm());

function emptyForm(): FeeExtForm {
  return {
    name: null,
    strategy: 0,
    countryIds: [],
    price: null,
    varType: null,
    startOp: 0,
    startValue: null,
    endOp: 2,
    endValue: null,
    expr: EXPR_UNCONDITIONAL,
    status: 1,
    note: ''
  };
}

// ---- 选项数据源（首次打开时并行拉取，失败静默保留空列表） ----
const nameOptions = ref<SelectOption[]>([]);
const countryOptions = ref<SelectOption[]>([]);
const optionsLoaded = ref(false);

async function loadOptions() {
  if (optionsLoaded.value) return;

  const [feeType, country] = await Promise.all([
    // 费用类型：下拉建议（存的是名称字符串，故 value 用 name；只保留启用中的）
    fetchGetFeeTypeList({ current: 1, size: 500 }),
    fetchGetCountryList({ page: 1, size: 1000 })
  ]);

  if (feeType.data) {
    nameOptions.value = feeType.data.list
      .filter(item => item.status === 1)
      .map(item => ({ label: item.name, value: item.name }));
  }
  if (country.data) {
    countryOptions.value = country.data.list.map(item => ({ label: item.nameCn || item.code, value: item._id }));
  }

  optionsLoaded.value = true;
}

// ---- 加收类型 / 条件文案 ----
const strategyOptions = computed<SelectOption[]>(() => [
  { label: $t('page.channelQuote.quoteSetting.feeExt.form.strategyOption.byWeight'), value: 0 },
  { label: $t('page.channelQuote.quoteSetting.feeExt.form.strategyOption.byTicket'), value: 1 },
  { label: $t('page.channelQuote.quoteSetting.feeExt.form.strategyOption.byItem'), value: 2 },
  { label: $t('page.channelQuote.quoteSetting.feeExt.form.strategyOption.byWeightOver'), value: 3 }
]);

const varTypeOptions = computed<SelectOption[]>(() => [
  { label: $t('page.channelQuote.quoteSetting.feeExt.form.varTypeOption.none'), value: VAR_TYPE_NONE },
  { label: $t('page.channelQuote.quoteSetting.feeExt.form.varTypeOption.weight'), value: 0 },
  { label: $t('page.channelQuote.quoteSetting.feeExt.form.varTypeOption.length'), value: 1 },
  { label: $t('page.channelQuote.quoteSetting.feeExt.form.varTypeOption.volume'), value: 2 }
]);

const startOpOptions = computed<SelectOption[]>(() => [
  { label: $t('page.channelQuote.quoteSetting.feeExt.form.opOption.gt'), value: 0 },
  { label: $t('page.channelQuote.quoteSetting.feeExt.form.opOption.gte'), value: 1 }
]);

const endOpOptions = computed<SelectOption[]>(() => [
  { label: $t('page.channelQuote.quoteSetting.feeExt.form.opOption.lt'), value: 2 },
  { label: $t('page.channelQuote.quoteSetting.feeExt.form.opOption.lte'), value: 3 }
]);

/** 条件变量下拉的双向绑定（把 VAR_TYPE_NONE 映射回 null） */
const varTypeValue = computed<number>({
  get: () => (form.varType === null ? VAR_TYPE_NONE : form.varType),
  set: value => {
    form.varType = value === VAR_TYPE_NONE ? null : (value as FeeExtVarType);
  }
});

/** 变量展示名 */
function varTypeLabel(varType: FeeExtVarType) {
  if (varType === 0) return $t('page.channelQuote.quoteSetting.feeExt.form.varTypeOption.weight');
  if (varType === 1) return $t('page.channelQuote.quoteSetting.feeExt.form.varTypeOption.length');
  return $t('page.channelQuote.quoteSetting.feeExt.form.varTypeOption.volume');
}

/** 运算符符号（与后端 op 值对齐：0 > / 1 ≥ / 2 < / 3 ≤） */
const OP_SYMBOL: Record<0 | 1 | 2 | 3, string> = { 0: '>', 1: '≥', 2: '<', 3: '≤' };

/**
 * 区间左侧（数值在前）的镜像运算符：数值换到左边必须反向，否则语义翻反
 * （`重量>0.5` ⇔ `0.5<重量`；`重量≥0.5` ⇔ `0.5≤重量`）。
 */
const LEFT_OP_MIRROR: Record<0 | 1, 2 | 3> = { 0: 2, 1: 3 };

/**
 * 条件数值的单位（随变量类型：重量 KG / 长度 CM / 体积 CBM）。
 * 必须定义在 conditionExpr 之前：后者被 immediate watch 求值，晚定义会踩 TDZ。
 */
const valueUnit = computed(() => {
  if (form.varType === 1) return $t('page.channelQuote.quoteSetting.feeExt.form.unitOption.length');
  if (form.varType === 2) return $t('page.channelQuote.quoteSetting.feeExt.form.unitOption.volume');

  return $t('page.channelQuote.quoteSetting.feeExt.form.unitOption.weight');
});

/**
 * 条件表达式（实时生成，数值随变量类型带单位）：
 * - 无条件加收 → 「无条件加收」（后端魔法值，勿改）；
 * - 变量已选但两端都没填数值 → 空串（触发必填校验，提示至少填一端）。
 * 例：`重量>4KG`、`0.5KG<重量≤20KG`（双端时左值用镜像运算符）、`体积≤3CBM`。
 */
const conditionExpr = computed(() => {
  if (form.varType === null) return EXPR_UNCONDITIONAL;

  const label = varTypeLabel(form.varType);
  const unit = valueUnit.value;
  const hasStart = typeof form.startValue === 'number';
  const hasEnd = typeof form.endValue === 'number';

  if (!hasStart && !hasEnd) return '';
  if (hasStart && hasEnd) {
    const leftOp = OP_SYMBOL[LEFT_OP_MIRROR[form.startOp]];

    return `${form.startValue}${unit}${leftOp}${label}${OP_SYMBOL[form.endOp]}${form.endValue}${unit}`;
  }
  if (hasStart) return `${label}${OP_SYMBOL[form.startOp]}${form.startValue}${unit}`;

  return `${label}${OP_SYMBOL[form.endOp]}${form.endValue}${unit}`;
});

// 表达式实时回填 form.expr：custom 项的必填校验与最终提交都用它
watch(
  conditionExpr,
  value => {
    form.expr = value;
  },
  { immediate: true }
);

// ---- 表单项 ----
const formItems = computed<FormItemConfig[]>(() => [
  {
    key: 'name',
    label: $t('page.channelQuote.quoteSetting.feeExt.name'),
    type: 'custom',
    span: 12,
    required: true
  },
  {
    key: 'strategy',
    label: $t('page.channelQuote.quoteSetting.feeExt.type'),
    type: 'select',
    span: 12,
    required: true,
    options: strategyOptions.value,
    filterable: false,
    labelTooltip: $t('page.channelQuote.quoteSetting.feeExt.form.strategyTip')
  },
  {
    key: 'countryIds',
    label: $t('page.channelQuote.quoteSetting.feeExt.country'),
    type: 'select',
    span: 12,
    required: true,
    multiple: true,
    options: countryOptions.value,
    placeholder: $t('page.channelQuote.quoteSetting.feeExt.form.countryPlaceholder')
  },
  {
    key: 'price',
    label: $t('page.channelQuote.quoteSetting.feeExt.fee'),
    type: 'number',
    span: 12,
    required: true,
    placeholder: $t('page.channelQuote.quoteSetting.feeExt.form.pricePlaceholder')
  },
  {
    key: 'status',
    label: $t('common.status'),
    type: 'select',
    span: 12,
    optionsKey: 'status',
    filterable: false
  },
  {
    key: 'note',
    label: $t('common.remark'),
    type: 'textarea',
    span: 12,
    placeholder: $t('page.channelQuote.quoteSetting.feeExt.form.notePlaceholder')
  },
  {
    key: 'expr',
    label: $t('page.channelQuote.quoteSetting.feeExt.condition'),
    type: 'custom',
    span: 24,
    required: true,
    requiredMsg: $t('page.channelQuote.quoteSetting.feeExt.form.conditionNeedValue')
  }
]);

// ---- 打开 / 提交 ----
function open() {
  mode.value = 'create';
  editingId.value = '';
  Object.assign(form, emptyForm());
  formRef.value?.restoreValidation();
  visible.value = true;
  loadOptions();
}

/** 编辑：回填全部字段（条件拆回区间控件；expr 由既有实时生成逻辑按本页统一格式重建） */
function openEdit(row: Api.ChannelQuote.ChannelFeeExt) {
  mode.value = 'edit';
  editingId.value = row._id;
  Object.assign(form, emptyForm(), {
    name: row.name ?? null,
    strategy: (row.strategy ?? 0) as FeeExtStrategy,
    countryIds: [...(row.countryIds ?? [])],
    price: typeof row.price === 'number' ? row.price : null,
    varType: row.varType ?? null,
    startOp: row.start?.op === 1 ? 1 : 0,
    startValue: typeof row.start?.value === 'number' ? row.start.value : null,
    endOp: row.end?.op === 3 ? 3 : 2,
    endValue: typeof row.end?.value === 'number' ? row.end.value : null,
    status: (row.status ?? 1) as 0 | 1,
    note: row.note ?? ''
  });
  formRef.value?.restoreValidation();
  visible.value = true;
  loadOptions();
}

/** 清空条件区间（保留变量选择），对齐老系统「清空公式」的心智 */
function clearCondition() {
  form.startValue = null;
  form.endValue = null;
}

async function handleSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  submitting.value = true;
  try {
    const payload: Api.ChannelQuote.ChannelFeeExtSaveParams = {
      refId: props.channelId,
      name: String(form.name ?? '').trim(),
      strategy: form.strategy,
      price: form.price ?? undefined,
      countryIds: [...form.countryIds],
      expr: form.expr,
      status: form.status,
      note: form.note.trim() || undefined
    };

    // 「无条件加收」不提交条件字段；有值的一端才提交端点
    if (form.varType !== null) {
      payload.varType = form.varType;
      if (typeof form.startValue === 'number') payload.start = { value: form.startValue, op: form.startOp };
      if (typeof form.endValue === 'number') payload.end = { value: form.endValue, op: form.endOp };
    }

    const isEdit = mode.value === 'edit' && !!editingId.value;
    const { error } = isEdit
      ? await fetchUpdateChannelFeeExt({ ...payload, _id: editingId.value })
      : await fetchCreateChannelFeeExt(payload);
    if (error) return;

    window.$message?.success($t(isEdit ? 'common.updateSuccess' : 'common.createSuccess'));
    visible.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

defineExpose({ open, openEdit });
</script>

<template>
  <Drawer
    v-model:show="visible"
    :title="title"
    :loading="submitting"
    :confirm-text="$t('common.save')"
    :width="760"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="form" :items="formItems" label-placement="top" :grid-x-gap="16">
      <!-- 加收名称：下拉建议（费用类型名称）+ 允许直接输入（后端 name 为普通字符串） -->
      <template #name>
        <NSelect
          v-model:value="form.name"
          class="w-full"
          filterable
          tag
          clearable
          :options="nameOptions"
          :placeholder="$t('page.channelQuote.quoteSetting.feeExt.form.namePlaceholder')"
        />
      </template>

      <!--
        加收条件：变量下拉 + 区间（[>|≥] 值 ～ [<|≤] 值，两端可只填一端）；
        生成结果以浅色小字即时回显在下方，与「清空」同行（清空靠右）。
      -->
      <template #expr>
        <!-- NFormItem 内容区是 flex：外层必须占满整行，内部再纵向分「条件行 / 表达式提示行」 -->
        <div class="w-full flex flex-col">
          <div class="flex flex-wrap items-center gap-8px">
            <NSelect v-model:value="varTypeValue" class="w-120px! shrink-0" :options="varTypeOptions" />

            <template v-if="form.varType !== null">
              <NSelect v-model:value="form.startOp" class="w-104px! shrink-0" :options="startOpOptions" />
              <NInputNumber
                v-model:value="form.startValue"
                class="min-w-72px! flex-1"
                :show-button="false"
                :placeholder="$t('page.channelQuote.quoteSetting.feeExt.form.valuePlaceholder')"
              >
                <template #suffix>{{ valueUnit }}</template>
              </NInputNumber>
              <span class="shrink-0 text-#bbb">～</span>
              <NSelect v-model:value="form.endOp" class="w-104px! shrink-0" :options="endOpOptions" />
              <NInputNumber
                v-model:value="form.endValue"
                class="min-w-72px! flex-1"
                :show-button="false"
                :placeholder="$t('page.channelQuote.quoteSetting.feeExt.form.valuePlaceholder')"
              >
                <template #suffix>{{ valueUnit }}</template>
              </NInputNumber>
            </template>
          </div>

          <div v-if="form.varType !== null" class="mt-6px flex items-center gap-12px text-13px">
            <span class="text-#999">
              {{ $t('page.channelQuote.quoteSetting.feeExt.form.exprLabel') }}：
              <span class="text-#666 dark:text-#bbb">
                {{ conditionExpr || $t('page.channelQuote.quoteSetting.feeExt.form.exprPlaceholder') }}
              </span>
            </span>
            <LButton size="small" class="ml-auto shrink-0" @click="clearCondition">
              {{ $t('page.channelQuote.quoteSetting.feeExt.form.conditionClear') }}
            </LButton>
          </div>
        </div>
      </template>
    </NFormWrap>
  </Drawer>
</template>

<style scoped></style>
