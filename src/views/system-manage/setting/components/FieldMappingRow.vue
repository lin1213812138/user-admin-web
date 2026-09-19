<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CSSProperties } from 'vue';
import { $t } from '@/locales';
import type { FieldMappingField, FieldMappingGroup, FieldMappingValue } from './field-mapping-config';

export type { FieldMappingField, FieldMappingGroup, FieldMappingValue } from './field-mapping-config';

const props = withDefaults(
  defineProps<{
    navGroups: FieldMappingGroup[];
    modelValue: Record<string, FieldMappingValue>;
    /** 占满父容器剩余高度，内容溢出时只在卡片内部滚动（右侧内容各页独有，按需开启） */
    fill?: boolean;
    /** 只读，禁用字段勾选与分组全选按钮 */
    disabled?: boolean;
  }>(),
  { fill: false, disabled: false }
);

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, FieldMappingValue>];
}>();

const cardClass = computed(() => (props.fill ? 'mt-16px flex flex-1 min-h-0 flex-col' : 'mt-16px'));
const cardContentStyle = computed<CSSProperties | undefined>(() =>
  // fill: 卡片占满父容器剩余高度（basis 0 干净占满），内部 NScrollbar 滚动字段映射内容，外层不滚
  // 头部与内容区各自管自己的内边距（见 scoped 样式），故内容 padding 恒为 0
  props.fill ? { display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, padding: '0' } : { padding: '0' }
);

/** 取某分组的映射值，缺省视为全空，避免各调用点重复判空 */
function groupValueOf(groupKey: string): FieldMappingValue {
  return props.modelValue[groupKey] ?? { show: [], required: [] };
}

/** 字段是否已勾选「显示」 */
function isShown(groupKey: string, field: string) {
  return groupValueOf(groupKey).show.includes(field);
}

/** 字段是否已勾选「必填」 */
function isRequired(groupKey: string, field: string) {
  return groupValueOf(groupKey).required.includes(field);
}

function toggleField(groupKey: string, field: string, checked: boolean) {
  const current = groupValueOf(groupKey);
  // 先判重再追加，避免数据里存在重复 key 时同名字段被写入两次
  const next = checked
    ? current.show.includes(field)
      ? current.show
      : [...current.show, field]
    : current.show.filter(f => f !== field);
  // 勾选显示时默认同时设为必填；取消显示不清除已设必填
  const required = checked && !current.required.includes(field) ? [...current.required, field] : current.required;
  emit('update:modelValue', { ...props.modelValue, [groupKey]: { ...current, show: next, required } });
}

/** 勾选 / 取消「必填」：与「显示」独立存储，不联动修改对方 */
function toggleRequired(groupKey: string, field: string, checked: boolean) {
  const current = groupValueOf(groupKey);
  const next = checked
    ? current.required.includes(field)
      ? current.required
      : [...current.required, field]
    : current.required.filter(f => f !== field);
  emit('update:modelValue', { ...props.modelValue, [groupKey]: { ...current, required: next } });
}

/** 分组计数：总字段数 / 已显示数 / 已显示且必填数（恒按全量字段算，不受筛选影响） */
function countsOf(group: FieldMappingGroup) {
  const value = groupValueOf(group.key);
  let shown = 0;
  let required = 0;
  group.fields.forEach(f => {
    if (!value.show.includes(f.key)) return;
    shown += 1;
    if (value.required.includes(f.key)) required += 1;
  });
  return { total: group.fields.length, shown, required };
}

/** 卡片汇总：全部字段 / 已显示 / 已显示且必填（历史数据里「必填但不显示」的字段不计入必填） */
const stats = computed(() =>
  props.navGroups.reduce(
    (acc, group) => {
      const { total, shown, required } = countsOf(group);
      return { total: acc.total + total, shown: acc.shown + shown, required: acc.required + required };
    },
    { total: 0, shown: 0, required: 0 }
  )
);

/** 搜索关键词（纯前端过滤，不进数据） */
const keyword = ref('');
/** 仅看已选（纯前端过滤） */
const onlyShown = ref(false);

/** 当前渲染的分组：{ 原始分组, 过滤后的字段 }，空分组不渲染；计数仍走原始分组的全量字段 */
const visibleGroups = computed(() =>
  props.navGroups
    .map(group => {
      const kw = keyword.value.trim().toLowerCase();
      const fields = group.fields.filter(f => {
        if (onlyShown.value && !isShown(group.key, f.key)) return false;
        if (!kw) return true;
        return f.label.toLowerCase().includes(kw) || f.key.toLowerCase().includes(kw);
      });
      return { group, fields };
    })
    .filter(item => item.fields.length > 0)
);

/** 分组全选：显示 + 默认必填（与字段级勾选行为一致） */
function selectAllGroup(fields: FieldMappingField[], groupKey: string) {
  const current = groupValueOf(groupKey);
  const keys = fields.map(f => f.key);
  emit('update:modelValue', {
    ...props.modelValue,
    [groupKey]: {
      ...current,
      show: [...current.show, ...keys.filter(k => !current.show.includes(k))],
      required: [...current.required, ...keys.filter(k => !current.required.includes(k))]
    }
  });
}

/** 分组清空：只清「显示」，锁定字段保留（mappingToFieldList 对锁定项强制保留，清掉会造成「界面没选、保存却带上」） */
function clearGroup(fields: FieldMappingField[], groupKey: string) {
  const current = groupValueOf(groupKey);
  const keySet = new Set(fields.map(f => f.key));
  const lockedKeys = new Set(fields.filter(f => f.disabled).map(f => f.key));
  const show = current.show.filter(key => !keySet.has(key) || lockedKeys.has(key));
  emit('update:modelValue', { ...props.modelValue, [groupKey]: { ...current, show } });
}
</script>

<template>
  <NCard :class="cardClass" :content-style="cardContentStyle">
    <div class="fm-head">
      <span class="fm-title">{{ $t('page.manage.setting.fieldMapping') }}</span>
      <I18nT keypath="page.manage.setting.fieldMappingSummary" tag="span" class="fm-sum">
        <template #shown>
          <b>{{ stats.shown }}</b>
        </template>
        <template #total>{{ stats.total }}</template>
        <template #required>
          <b>{{ stats.required }}</b>
        </template>
      </I18nT>
      <div class="fm-tools">
        <NInput
          v-model:value="keyword"
          class="w-160px! shrink-0"
          size="small"
          clearable
          :placeholder="$t('page.manage.setting.fieldMappingSearchPlaceholder')"
        >
          <template #prefix>
            <icon-uil-search class="text-15px text-#c2c2c2" />
          </template>
        </NInput>
        <div class="flex shrink-0 select-none items-center gap-6px">
          <span class="whitespace-nowrap text-12px text-#5c6470">
            {{ $t('page.manage.setting.fieldMappingOnlyShown') }}
          </span>
          <NSwitch v-model:value="onlyShown" size="small" />
        </div>
      </div>
    </div>
    <NScrollbar class="min-h-0 flex-1" content-class="min-h-full">
      <div class="min-w-full px-16px pb-14px pt-8px">
        <div v-for="item in visibleGroups" :key="item.group.key" class="pb-10px last:pb-0">
          <div class="fm-ghead">
            <i class="h-14px w-3px shrink-0 rounded-2px bg-primary" />
            <span class="text-13px font-medium">{{ item.group.title }}</span>
            <span class="text-11px text-#9aa1ac">
              {{ $t('page.manage.setting.fieldMappingCounts', countsOf(item.group)) }}
            </span>
            <div class="fm-gactions">
              <button
                type="button"
                class="cursor-pointer bg-transparent text-primary transition-colors hover:bg-primary-50 hover:text-primary-400 disabled:cursor-not-allowed disabled:text-#c2c7cf"
                :disabled="disabled"
                @click="selectAllGroup(item.fields, item.group.key)"
              >
                {{ $t('page.manage.setting.fieldMappingGroupAll') }}
              </button>
              <button
                type="button"
                class="cursor-pointer bg-transparent text-#9aa1ac transition-colors hover:bg-#f3f4f6 hover:text-primary disabled:cursor-not-allowed disabled:text-#dfe2e6 dark:hover:bg-#ffffff14"
                :disabled="disabled || countsOf(item.group).shown === 0"
                @click="clearGroup(item.fields, item.group.key)"
              >
                {{ $t('common.clear') }}
              </button>
            </div>
          </div>
          <div class="mapping-grid">
            <div
              v-for="f in item.fields"
              :key="f.key"
              class="flex h-36px min-w-0 items-center gap-8px px-6px rd-6px transition-colors hover:bg-#f6f8fb dark:hover:bg-#ffffff14"
            >
              <span
                class="min-w-0 flex-1 truncate text-13px transition-colors"
                :class="isShown(item.group.key, f.key) ? '' : 'text-#c2c7cf dark:text-#5f6672'"
              >
                {{ f.label }}
              </span>
              <button
                type="button"
                class="h-26px shrink-0 inline-flex items-center rounded-full border-0 px-12px text-12px transition-all duration-150 ease-out"
                :class="[
                  isShown(item.group.key, f.key)
                    ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                    : 'bg-#f4f5f7 text-#a3abb6 hover:bg-#e9ecf1 dark:bg-#ffffff14 dark:text-#8b9199 dark:hover:bg-#ffffff24',
                  disabled || f.disabled
                    ? 'cursor-not-allowed opacity-45'
                    : 'cursor-pointer hover:translate-y-[-1px] hover:shadow-[0_2px_6px_rgba(16,24,40,0.12)] active:translate-y-0 active:shadow-none'
                ]"
                :disabled="disabled || f.disabled"
                :title="f.disabled ? $t('page.manage.setting.fieldMappingLockedTip') : undefined"
                @click="toggleField(item.group.key, f.key, !isShown(item.group.key, f.key))"
              >
                {{ $t('common.show') }}
              </button>
              <button
                type="button"
                class="h-26px shrink-0 inline-flex items-center rounded-full border-0 px-12px text-12px transition-all duration-150 ease-out"
                :class="[
                  isRequired(item.group.key, f.key)
                    ? 'bg-error-50 text-error-600 hover:bg-error-100'
                    : 'bg-#f4f5f7 text-#a3abb6 hover:bg-#e9ecf1 dark:bg-#ffffff14 dark:text-#8b9199 dark:hover:bg-#ffffff24',
                  !isShown(item.group.key, f.key) || disabled
                    ? 'cursor-not-allowed opacity-45'
                    : 'cursor-pointer hover:translate-y-[-1px] hover:shadow-[0_2px_6px_rgba(16,24,40,0.12)] active:translate-y-0 active:shadow-none'
                ]"
                :disabled="!isShown(item.group.key, f.key) || disabled"
                @click="toggleRequired(item.group.key, f.key, !isRequired(item.group.key, f.key))"
              >
                {{ $t('page.manage.setting.fieldMappingRequired') }}
              </button>
            </div>
          </div>
        </div>
        <div v-if="visibleGroups.length === 0" class="py-24px text-center text-13px text-#9aa1ac">
          {{ $t('page.manage.setting.fieldMappingNoMatch') }}
        </div>
      </div>
    </NScrollbar>
  </NCard>
</template>

<style scoped>
/* naive 卡片头部靠 `__main: flex 1`（basis 0）撑满剩余宽度，把 `__header-extra` 按钮组顶到卡片最右；
   设置页右侧变窄后标题（flex: 1 1 0 + min-width: 0）会被按钮组挤成 0 宽竖排，故：
   - 保留撑满能力但 basis 改 auto（标题按内容宽参与分配，宽容器仍能把按钮组推到最右 = 左右布局）
   - min-width 改 max-content（窄容器下标题最多压到自身内容宽，不竖排；按钮组靠 NSpace wrap 换行）
   naive 原生规则 `.n-card > .n-card-header .n-card-header__main`（特异性 0,3,0）
   高于 :deep 编译出的 `[data-v] .n-card-header__main`（0,2,0），故用 !important 覆盖 */
/* 卡片自带头部（不再用 NCard 的 title / header-extra）：
   标题与汇总同排居左、工具区居右，与设计稿分区一致；窄容器允许折行，避免把文字压成竖排 */
.fm-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  padding: 11px 16px;
  border-bottom: 1px solid var(--n-border-color, #eef0f3);
}

.fm-title {
  font-size: 14px;
  font-weight: 600;
}

.fm-sum {
  padding-left: 12px;
  border-left: 1px solid var(--n-border-color, #eef0f3);
  font-size: 12px;
  color: #9aa1ac;
  font-variant-numeric: tabular-nums;
}

.fm-sum b {
  font-weight: 600;
  color: #5c6470;
}

.fm-tools {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

/* 分组标题行：蓝色竖条 + 组名 · 计数 ——「全部 / 清空」。
   左内边距 6px 与字段行的 px-6px 对齐，竖条与字段名同一竖线起排 */
.fm-ghead {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0 8px 6px;
}

.fm-gactions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  font-size: 14px;
}

/* 组头动作按钮：放大字号同时给足点击热区（内边距；悬停底色走 uno 主题色类） */
.fm-gactions button {
  padding: 2px 8px;
  border-radius: 5px;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}
/* 行栅格：固定一行四个（用户指定）。
   列宽 minmax(0,1fr) 保证等分且可被压缩，字段名超出走 truncate 省略，不会横向溢出。
   上方虚线为分组标题与字段区的分隔 */
.mapping-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 28px;
  row-gap: 4px;
  padding-top: 1px;
  border-top: 1px dashed var(--n-border-color, #eef0f3);
}

/* 列之间的竖向虚线：画在格子左侧（列间距 28px 的正中，故左移 14px），
   前 3 列之后各一条（4 列定宽，用 4n+1 定位首列）；整组贯通，行间距处仅有 4px 断点 */
.mapping-grid > div {
  position: relative;
}

.mapping-grid > div:not(:nth-child(4n + 1))::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -14px;
  border-left: 1px dashed var(--n-border-color, #eef0f3);
}

/* 行之间的横向虚线：画在行间距（4px）的正中，左右各外扩 14px 让同一行相邻格子首尾相接，
   并在列间距正中与竖向虚线交叉；首列不左溢、末列不右溢 */
.mapping-grid > div::after {
  content: '';
  position: absolute;
  right: -14px;
  bottom: -2px;
  left: -14px;
  border-bottom: 1px dashed var(--n-border-color, #eef0f3);
}

.mapping-grid > div:nth-child(4n + 1)::after {
  left: 0;
}

.mapping-grid > div:nth-child(4n)::after {
  right: 0;
}
</style>
