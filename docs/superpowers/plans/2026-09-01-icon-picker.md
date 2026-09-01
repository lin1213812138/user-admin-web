# Icon Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 封装一个可搜索、可预览的图标选择器 `IconPicker`，接入声明式表单 `FormWrap` 作为 `icon-picker` 控件类型，并替换菜单管理抽屉的 `icon` 纯文本输入。

**Architecture:** 图标数据用一份精选的 iconify 图标名常量（`src/constants/icons.ts`）；`IconPicker` 是一个受控组件（`v-model`），内部用 `NPopover` + 搜索框 + 网格渲染 `<Icon>`；通过扩展 `FormItemConfig.type` 与 `FormWrap` 渲染分支，使其能像 `input`/`select` 一样声明式使用。

**Tech Stack:** Vue 3 `<script setup lang="ts">`、Naive UI（`NPopover`/`NInput`/`NButton`）、`@iconify/vue`（`Icon`）、vue-i18n（`$t`），UnoCSS 原子类。

## Global Constraints

- TypeScript strict + strictNullChecks，**禁止 `any`**（必要时 `unknown` + 收窄）。
- 禁止硬编码文案，一律走 i18n，**zh-cn / en-us 必须同步**。
- 禁止手动编辑 `src/router/elegant/**`、`src/typings/elegant-router.d.ts`、`src/typings/components.d.ts`。
- 业务改动落在 `src/`，不要动 `packages/` 内部包。
- 图标名与现有 `<SvgIcon :icon>` 兼容，存库为字符串（如 `mdi:home`）。
- 验证手段：`pnpm typecheck` + `pnpm lint` + `pnpm build`（本仓库无单测框架，不写单测）。
- 本仓库没有测试框架，验证用 `pnpm typecheck` / `pnpm lint` / `pnpm build`，不要找单测入口。

---

### Task 1: 新增图标选择器 i18n 文案

**Files:**

- Modify: `src/locales/langs/zh-cn.ts`（`common:` 区块，约第 9-26 行）
- Modify: `src/locales/langs/en-us.ts`（`common:` 区块，约第 9-26 行）

**Interfaces:**

- Consumes: 无
- Produces: i18n key `common.iconPicker.placeholder` / `common.iconPicker.clear` / `common.iconPicker.search` / `common.iconPicker.empty`（Task 3、Task 5 使用）

- [ ] **Step 1: 在 `zh-cn.ts` 的 `common:` 区块新增 `iconPicker` 子对象**

在 `common: {` 区块内（与 `columnSetting` / `confirm` 同级）追加：

```ts
    iconPicker: {
      placeholder: '请选择图标',
      clear: '清空',
      search: '搜索图标',
      empty: '无匹配图标'
    },
```

- [ ] **Step 2: 在 `en-us.ts` 的 `common:` 区块同步新增 `iconPicker` 子对象**

```ts
    iconPicker: {
      placeholder: 'Select an icon',
      clear: 'Clear',
      search: 'Search icons',
      empty: 'No matching icons'
    },
```

- [ ] **Step 3: 类型检查确认新增 key 合法**

Run: `pnpm typecheck`
Expected: PASS（无类型错误；`$t('common.iconPicker.placeholder')` 等新 key 被 vue-i18n 类型识别）

---

### Task 2: 新增图标数据源常量

**Files:**

- Create: `src/constants/icons.ts`

**Interfaces:**

- Consumes: 无
- Produces: `iconifyIcons: string[]`（Task 3 网格渲染使用）

- [ ] **Step 1: 创建 `src/constants/icons.ts`，导出精选图标名数组**

```ts
/** curated iconify icon names for the menu icon picker.
 *  offline-friendly, extends by appending more `collection:name` strings. */
export const iconifyIcons: string[] = [
  'mdi:home',
  'mdi:menu',
  'mdi:view-dashboard',
  'mdi:view-dashboard-outline',
  'mdi:cog',
  'mdi:cog-outline',
  'mdi:settings',
  'mdi:gear',
  'ic:round-menu',
  'ic:round-settings',
  'ic:baseline-settings',
  'ic:round-dashboard',
  'ic:round-home',
  'ic:round-apps',
  'mdi:account',
  'mdi:account-circle',
  'mdi:account-group',
  'mdi:account-multiple',
  'mdi:account-key',
  'mdi:lock',
  'mdi:lock-outline',
  'mdi:key',
  'mdi:key-outline',
  'mdi:shield',
  'mdi:shield-account',
  'mdi:shield-key',
  'mdi:file-document',
  'mdi:file-cog',
  'mdi:folder',
  'mdi:folder-outline',
  'mdi:folder-network',
  'mdi:clipboard-list',
  'mdi:clipboard-text',
  'mdi:format-list-bulleted',
  'mdi:format-list-checkbox',
  'mdi:view-list',
  'mdi:table',
  'mdi:chart-bar',
  'mdi:chart-line',
  'mdi:chart-pie',
  'mdi:chart-box',
  'mdi:bell',
  'mdi:bell-outline',
  'mdi:email',
  'mdi:email-outline',
  'mdi:message',
  'mdi:message-text',
  'mdi:cart',
  'mdi:cart-outline',
  'mdi:store',
  'mdi:storefront',
  'mdi:package',
  'mdi:package-variant',
  'mdi:tag',
  'mdi:tag-outline',
  'mdi:truck',
  'mdi:truck-delivery',
  'mdi:warehouse',
  'mdi:box',
  'mdi:box-outline',
  'mdi:archive',
  'mdi:book',
  'mdi:book-open',
  'mdi:bookshelf',
  'mdi:database',
  'mdi:server',
  'mdi:server-network',
  'mdi:cloud',
  'mdi:api',
  'mdi:code',
  'mdi:code-tags',
  'mdi:console',
  'mdi:monitor',
  'mdi:monitor-dashboard',
  'mdi:cellphone',
  'mdi:devices',
  'mdi:web',
  'mdi:link',
  'mdi:plus',
  'mdi:plus-circle',
  'mdi:pencil',
  'mdi:pencil-outline',
  'mdi:delete',
  'mdi:delete-outline',
  'mdi:content-save',
  'mdi:check',
  'mdi:check-circle',
  'mdi:close',
  'mdi:close-circle',
  'mdi:star',
  'mdi:star-outline',
  'mdi:heart',
  'mdi:flag',
  'mdi:map-marker',
  'mdi:earth',
  'mdi:gift',
  'mdi:currency-cny',
  'mdi:cash',
  'mdi:cash-multiple',
  'mdi:chart-areaspline',
  'mdi:calendar',
  'mdi:calendar-clock',
  'mdi:clock',
  'mdi:history',
  'mdi:information',
  'mdi:help-circle',
  'mdi:alert',
  'mdi:alert-circle',
  'mdi:bug',
  'mdi:tools',
  'mdi:wrench',
  'mdi:hammer-wrench',
  'mdi:logout',
  'mdi:login',
  'mdi:exit-to-app',
  'mdi:refresh',
  'mdi:sync',
  'mdi:download',
  'mdi:upload',
  'mdi:eye',
  'mdi:eye-off',
  'mdi:filter',
  'mdi:sort',
  'mdi:magnify',
  'mdi:dots-vertical',
  'mdi:dots-horizontal',
  'mdi:grid',
  'mdi:grid-large',
  'mdi:layers',
  'mdi:shape',
  'mdi:image',
  'mdi:image-outline',
  'mdi:music',
  'mdi:video',
  'mdi:microphone',
  'mdi:phone',
  'mdi:contacts',
  'mdi:badge-account',
  'mdi:certificate',
  'mdi:award',
  'mdi:thumb-up',
  'mdi:thumb-down'
];
```

- [ ] **Step 2: 类型检查确认文件可被导入**

Run: `pnpm typecheck`
Expected: PASS

---

### Task 3: 创建 `IconPicker` 组件

**Files:**

- Create: `src/components/custom/icon-picker.vue`
- Modify: `src/components/custom/svg-icon.vue`（不修改，仅作为同目录参照，复用 `<Icon>` 渲染方式）

**Interfaces:**

- Consumes: `iconifyIcons`（`src/constants/icons.ts`，Task 2）；`$t('common.iconPicker.*')`（Task 1）
- Produces: 组件 `IconPicker`，Props `modelValue: string` / `disabled?: boolean` / `placeholder?: string` / `clearable?: boolean`；Emits `update:modelValue: [string]`（Task 4、Task 5 使用）

- [ ] **Step 1: 创建 `src/components/custom/icon-picker.vue`**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { $t } from '@/locales';
import { iconifyIcons } from '@/constants/icons';

defineOptions({ name: 'IconPicker' });

interface Props {
  /** selected iconify icon name, e.g. "mdi:home" */
  modelValue?: string;
  /** disable the picker */
  disabled?: boolean;
  /** placeholder when no icon selected */
  placeholder?: string;
  /** show clear button, default true */
  clearable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  placeholder: '',
  clearable: true
});

const emit = defineEmits<{
  'update:modelValue': [string];
}>();

const visible = ref(false);
const keyword = ref('');

const filteredIcons = computed<string[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return iconifyIcons;
  return iconifyIcons.filter(name => name.toLowerCase().includes(kw));
});

function handleSelect(name: string) {
  emit('update:modelValue', name);
  visible.value = false;
}

function handleClear() {
  emit('update:modelValue', '');
  visible.value = false;
}
</script>

<template>
  <NPopover v-model:show="visible" trigger="click" placement="bottom-start" :disabled="props.disabled" raw :width="320">
    <template #trigger>
      <NInput
        :value="props.modelValue"
        :placeholder="props.placeholder || $t('common.iconPicker.placeholder')"
        readonly
        :disabled="props.disabled"
      >
        <template #prefix>
          <Icon v-if="props.modelValue" :icon="props.modelValue" class="text-icon" />
          <span v-else class="text-16px text-gray-400">#</span>
        </template>
      </NInput>
    </template>

    <div class="w-320px flex flex-col gap-8px p-12px">
      <NInput v-model:value="keyword" :placeholder="$t('common.iconPicker.search')" clearable>
        <template #prefix>
          <Icon icon="mdi:magnify" class="text-icon" />
        </template>
      </NInput>

      <div class="h-240px overflow-y-auto">
        <div v-if="filteredIcons.length" class="grid grid-cols-8 gap-4px">
          <button
            v-for="name in filteredIcons"
            :key="name"
            type="button"
            class="flex h-32px w-32px items-center justify-center rounded-4px border border-solid border-transparent text-18px hover:border-primary hover:bg-primary-10%"
            :class="{ 'border-primary bg-primary-10%': name === props.modelValue }"
            :title="name"
            @click="handleSelect(name)"
          >
            <Icon :icon="name" />
          </button>
        </div>
        <div v-else class="flex h-full items-center justify-center text-gray-400">
          {{ $t('common.iconPicker.empty') }}
        </div>
      </div>

      <NButton v-if="props.clearable" block secondary size="small" @click="handleClear">
        {{ $t('common.iconPicker.clear') }}
      </NButton>
    </div>
  </NPopover>
</template>
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck`
Expected: PASS

---

### Task 4: 扩展 `FormWrap` 支持 `icon-picker`

**Files:**

- Modify: `src/components/Form/form-config.ts`（第 3 行 `FormItemType`）
- Modify: `src/components/Form/index.vue`（第 180-186 行 `NSelect` 分支之后新增渲染分支；顶部新增 import）

**Interfaces:**

- Consumes: `IconPicker` 组件（Task 3）
- Produces: `FormItemConfig.type` 新增 `'icon-picker'`，`FormWrap` 可声明式渲染图标选择器（Task 5 使用）

- [ ] **Step 1: 在 `form-config.ts` 扩展 `FormItemType`**

```ts
/** 表单支持的控件类型 */
export type FormItemType = 'input' | 'textarea' | 'number' | 'switch' | 'select' | 'icon-picker';
```

- [ ] **Step 2: 在 `src/components/Form/index.vue` 顶部新增 import**

在现有 `import { type FormItemConfig } from './form-config';` 附近追加：

```ts
import IconPicker from '@/components/custom/icon-picker.vue';
```

- [ ] **Step 3: 在 `index.vue` 模板 `NSelect` 分支后新增 `icon-picker` 渲染分支**

在第 186 行 `</NSelect>` 之后、`</NFormItem>` 之前插入：

```vue
<IconPicker
  v-else-if="item.type === 'icon-picker'"
  v-model:value="model[item.key] as string"
  :placeholder="item.placeholder"
  :disabled="item.disabled"
/>
```

- [ ] **Step 4: 类型检查**

Run: `pnpm typecheck`
Expected: PASS

---

### Task 5: 菜单抽屉接入图标选择器

**Files:**

- Modify: `src/views/system-manage/menu/modules/menu-operate-drawer.vue`（约第 133-139 行 `icon` 表单项）

**Interfaces:**

- Consumes: `FormItemConfig.type` 的 `'icon-picker'`（Task 4）；`$t('common.iconPicker.placeholder')`（Task 1）
- Produces: 菜单抽屉 `icon` 字段使用图标选择器；表格 `#icon` 插槽（已存在，不改动）

- [ ] **Step 1: 把 `icon` 表单项从 `input` 改为 `icon-picker`**

将：

```ts
    {
      key: 'icon',
      label: $t('page.manage.menu.icon'),
      type: 'input',
      span: 24,
      placeholder: $t('page.manage.menu.form.iconPlaceholder')
    }
```

改为：

```ts
    {
      key: 'icon',
      label: $t('page.manage.menu.icon'),
      type: 'icon-picker',
      span: 24,
      placeholder: $t('common.iconPicker.placeholder')
    }
```

（保留 `page.manage.menu.form.iconPlaceholder` 旧 key 不影响，也可不动。）

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck`
Expected: PASS

---

### Task 6: 全量验证

**Files:** 无新增，仅验证

- [ ] **Step 1: 运行 typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 2: 运行 lint**

Run: `pnpm lint`
Expected: 无 error / 无未使用 import

- [ ] **Step 3: 运行 build**

Run: `pnpm build`
Expected: 构建成功

- [ ] **Step 4（手动验收，开发服务器）:** 启动 `pnpm dev:prod` 或 `pnpm dev`，打开菜单管理 → 新增/编辑 → `icon` 字段点击弹出选择器，输入关键词过滤、点击图标选中、点「清空」清除；保存后表格图标列正确显示所选图标。

---

## 自审检查

- **Spec 覆盖：** Task 1（i18n）、Task 2（数据源）、Task 3（组件）、Task 4（FormWrap 接入）、Task 5（菜单抽屉接入）、Task 6（验证）一一对应设计文档各节。
- **占位符扫描：** 全文无 TBD / TODO / "类似 Task N"，每个代码步骤均给出实际内容。
- **类型一致性：** `IconPicker` 的 Props（`modelValue` / `disabled` / `placeholder` / `clearable`）与 Emits（`update:modelValue`）在 Task 3 定义，Task 4 以 `v-model:value` + `:placeholder` + `:disabled` 调用；`iconifyIcons` 在 Task 2 定义、Task 3 使用；`common.iconPicker.*` 在 Task 1 定义、Task 3/5 使用。命名一致。
- **无单测：** 已按仓库约束用 typecheck/lint/build 替代单测。
