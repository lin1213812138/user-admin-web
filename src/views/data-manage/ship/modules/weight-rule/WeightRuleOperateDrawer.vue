<script setup lang="ts">
import { computed, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';
import { fetchCreateWeightRule, fetchUpdateWeightRule } from '@/service/api/data-manage-ship';

type WeightRule = Api.DataManageShip.WeightRule;

/** 计费单位（后端字段 unit：0-公斤 1-方） */
const unitOptions = computed(() => [
  { label: $t('page.dataManage.ship.weightRule.calcModeOption.byKg'), value: 0 },
  { label: $t('page.dataManage.ship.weightRule.calcModeOption.byCubic'), value: 1 }
]);

/** 计泡类型（后端固定枚举 mode 0-3） */
const modeOptions = computed(() => [
  { label: $t('page.dataManage.ship.weightRule.modeOption.m0'), value: 0 },
  { label: $t('page.dataManage.ship.weightRule.modeOption.m1'), value: 1 },
  { label: $t('page.dataManage.ship.weightRule.modeOption.m2'), value: 2 },
  { label: $t('page.dataManage.ship.weightRule.modeOption.m3'), value: 3 }
]);

/** 进位规则类型（carry 0-3） */
const carryOptions = computed(() => [
  { label: $t('page.dataManage.ship.weightRule.carryOption.c0'), value: 0 },
  { label: $t('page.dataManage.ship.weightRule.carryOption.c1'), value: 1 },
  { label: $t('page.dataManage.ship.weightRule.carryOption.c2'), value: 2 },
  { label: $t('page.dataManage.ship.weightRule.carryOption.c3'), value: 3 }
]);

const emit = defineEmits<{
  submitted: [];
}>();

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const formModel = ref<Partial<WeightRule>>(emptyForm());
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

function emptyForm(): Partial<WeightRule> {
  return {
    name: '',
    unit: 0,
    mode: 0,
    weightOff: undefined,
    cubicNum: undefined,
    order: 0,
    note: '',
    carryList: []
  };
}

const drawerTitle = computed(() =>
  drawerMode.value === 'create'
    ? `${$t('common.add')}${$t('page.dataManage.ship.weightRule.title')}`
    : `${$t('common.edit')}${$t('page.dataManage.ship.weightRule.title')}`
);

const formItems = computed<FormItemConfig[]>(() => [
  { key: '__sectionBasic', type: 'section', label: $t('page.dataManage.ship.weightRule.basicInfo'), span: 24 },
  {
    key: 'name',
    label: $t('page.dataManage.ship.weightRule.title'),
    type: 'input',
    required: true,
    span: 12,
    placeholder: '请输入规则名称'
  },
  {
    key: 'unit',
    label: $t('page.dataManage.ship.weightRule.billUnit'),
    type: 'select',
    required: true,
    span: 12,
    options: unitOptions.value,
    filterable: false
  },
  {
    key: 'mode',
    label: $t('page.dataManage.ship.weightRule.mode'),
    type: 'select',
    span: 12,
    options: modeOptions.value,
    filterable: false
  },
  {
    key: 'weightToVolume',
    label: $t('page.dataManage.ship.weightRule.weightToVolume'),
    type: 'number',
    span: 12,
    required: formModel.value.unit === 1 && [0, 1, 2].includes(formModel.value.mode ?? 0),
    placeholder: '计费单位为方、计泡类型 0/1/2 时必填'
  },
  { key: 'weightOff', label: $t('page.dataManage.ship.weightRule.weightOff'), type: 'number', span: 12 },
  { key: 'cubicNum', label: $t('page.dataManage.ship.weightRule.cubicNum'), type: 'number', span: 12 },
  { key: 'order', label: $t('page.dataManage.ship.weightRule.order'), type: 'number', span: 12 },
  { key: 'note', label: $t('common.remark'), type: 'textarea', span: 12 },
  { key: '__sectionCarry', type: 'section', label: $t('page.dataManage.ship.weightRule.carry'), span: 24 }
]);

// ---- 进位规则组动态编辑（嵌套结构，不走 FormWrap） ----
function addCarryGroup() {
  if (!formModel.value.carryList) formModel.value.carryList = [];
  formModel.value.carryList.push({ carry: 0, ruleList: [] });
}

function removeCarryGroup(index: number) {
  formModel.value.carryList?.splice(index, 1);
}

function addRule(carryIndex: number) {
  const group = formModel.value.carryList?.[carryIndex];
  if (!group) return;
  if (!group.ruleList) group.ruleList = [];
  group.ruleList.push({ start: undefined, end: undefined, unit: undefined });
}

function removeRule(carryIndex: number, ruleIndex: number) {
  formModel.value.carryList?.[carryIndex]?.ruleList?.splice(ruleIndex, 1);
}

function openCreate() {
  drawerMode.value = 'create';
  formModel.value = emptyForm();
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

function openEdit(row: WeightRule) {
  drawerMode.value = 'edit';
  formModel.value = {
    _id: row._id,
    name: row.name,
    unit: row.unit ?? 0,
    mode: row.mode ?? 0,
    weightOff: row.weightOff,
    cubicNum: row.cubicNum,
    weightToVolume: row.weightToVolume,
    order: row.order ?? 0,
    note: row.note ?? '',
    carryList: (row.carryList ?? []).map(group => ({
      carry: group.carry,
      ruleList: (group.ruleList ?? []).map(rule => ({ start: rule.start, end: rule.end, unit: rule.unit }))
    }))
  };
  formRef.value?.restoreValidation();
  drawerVisible.value = true;
}

async function handleDrawerSubmit() {
  const ok = await formRef.value?.validate();
  if (!ok) return;

  submitting.value = true;
  try {
    const { error } =
      drawerMode.value === 'create'
        ? await fetchCreateWeightRule(formModel.value)
        : await fetchUpdateWeightRule(formModel.value);

    if (error) return;

    drawerVisible.value = false;
    emit('submitted');
    window.$message?.success($t(drawerMode.value === 'create' ? 'common.createSuccess' : 'common.saveSuccess'));
  } finally {
    submitting.value = false;
  }
}

defineExpose({ openCreate, openEdit });
</script>

<template>
  <Drawer
    v-model:show="drawerVisible"
    :title="drawerTitle"
    :width="700"
    :loading="submitting"
    :confirm-text="$t('common.save')"
    @submit="handleDrawerSubmit"
  >
    <NFormWrap ref="formRef" :model="formModel" :items="formItems" />

    <!-- 进位规则组（动态嵌套结构，手写模板以匹配 FormWrap 设计语言） -->
    <div class="mt-4px">
      <NEmpty
        v-if="!(formModel.carryList && formModel.carryList.length)"
        class="py-16px"
        :description="$t('page.dataManage.ship.weightRule.carryEmpty')"
      >
        <template #extra>
          <LButton dashed type="primary" @click="addCarryGroup">
            {{ $t('page.dataManage.ship.weightRule.addCarryGroup') }}
          </LButton>
        </template>
      </NEmpty>

      <div
        v-for="(carry, ci) in formModel.carryList"
        :key="ci"
        class="mb-12px border border-[var(--n-border-color)] rd-6px p-12px"
      >
        <div class="mb-10px flex items-start justify-between gap-12px">
          <div class="flex-1">
            <div class="mb-4px text-13px text-[var(--n-text-color-3)]">
              {{ $t('page.dataManage.ship.weightRule.carryType') }}
            </div>
            <NSelect v-model:value="carry.carry" :options="carryOptions" class="w-full" />
          </div>
          <LButton quaternary type="error" class="mt-22px" @click="removeCarryGroup(ci)">
            {{ $t('page.dataManage.ship.weightRule.removeCarryGroup') }}
          </LButton>
        </div>

        <div class="border border-[var(--n-border-color)] rd-4px bg-[var(--n-fill-color)] p-10px">
          <div
            class="mb-6px grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-8px px-2px text-12px text-[var(--n-text-color-3)]"
          >
            <span>{{ $t('page.dataManage.ship.weightRule.start') }}</span>
            <span>{{ $t('page.dataManage.ship.weightRule.end') }}</span>
            <span>{{ $t('page.dataManage.ship.weightRule.unit') }}</span>
            <span />
          </div>
          <div
            v-for="(rule, ri) in carry.ruleList"
            :key="ri"
            class="mb-8px grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-8px"
          >
            <NInputNumber
              v-model:value="rule.start"
              :min="0"
              class="w-full"
              :placeholder="$t('page.dataManage.ship.weightRule.start')"
            />
            <NInputNumber
              v-model:value="rule.end"
              :min="0"
              class="w-full"
              :placeholder="$t('page.dataManage.ship.weightRule.end')"
            />
            <NInputNumber
              v-model:value="rule.unit"
              :min="0"
              class="w-full"
              :placeholder="$t('page.dataManage.ship.weightRule.unit')"
            />
            <LButton quaternary type="error" @click="removeRule(ci, ri)">
              {{ $t('page.dataManage.ship.weightRule.removeRule') }}
            </LButton>
          </div>
          <div
            v-if="!(carry.ruleList && carry.ruleList.length)"
            class="py-8px text-center text-13px text-[var(--n-text-color-3)]"
          >
            {{ $t('page.dataManage.ship.weightRule.ruleEmpty') }}
          </div>
          <LButton dashed block class="mt-4px" @click="addRule(ci)">
            {{ $t('page.dataManage.ship.weightRule.addRule') }}
          </LButton>
        </div>
      </div>

      <LButton
        v-if="formModel.carryList && formModel.carryList.length"
        dashed
        block
        class="mt-4px"
        @click="addCarryGroup"
      >
        {{ $t('page.dataManage.ship.weightRule.addCarryGroup') }}
      </LButton>
    </div>
  </Drawer>
</template>
