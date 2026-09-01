<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import CommonDrawer from '@/components/common/drawer.vue';
import NFormWrap from '@/components/Form/index.vue';
import type { FormItemConfig } from '@/components/Form/form-config';
import { fetchCreateMenu, fetchUpdateMenu } from '@/service/api/system-manage';

type MenuItem = Api.SystemManage.Menu;
type MenuType = Api.SystemManage.MenuType;

interface Props {
  /** drawer visibility */
  visible: boolean;
  /** operate type */
  operateType: 'add' | 'edit';
  /** editing row id */
  rowData: number | null;
  /** full menu tree data, used to build parent options */
  treeData: MenuItem[];
  /** preselected parent id when adding a sub menu (null = top level) */
  parentId?: number | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [boolean];
  submitted: [];
}>();

const title = computed(() =>
  props.operateType === 'edit' ? $t('page.manage.menu.editMenu') : $t('page.manage.menu.addMenu')
);

const model = ref<Api.SystemManage.MenuCreateParams>(createDefaultModel());

function createDefaultModel(): Api.SystemManage.MenuCreateParams {
  return {
    parentId: 0,
    menuName: '',
    menuType: 'catalog',
    icon: '',
    routePath: '',
    componentPath: '',
    permission: '',
    sort: 1,
    status: '1',
    visible: 1,
    keepAlive: 1,
    isExternal: 2,
    redirect: ''
  };
}

/** flatten tree to options for parent select, excluding the editing node and its descendants */
function buildParentOptions(
  list: MenuItem[],
  excludeId: number | null
): { label: string; value: number; depth: number }[] {
  const result: { label: string; value: number; depth: number }[] = [];
  const excluded = new Set<number>();

  if (excludeId != null) {
    const collect = (nodes: MenuItem[]) => {
      for (const node of nodes) {
        excluded.add(node.id);
        if (node.children?.length) collect(node.children);
      }
    };
    const findAndCollect = (nodes: MenuItem[]) => {
      for (const node of nodes) {
        if (node.id === excludeId) {
          collect([node]);
          return;
        }
        if (node.children?.length) findAndCollect(node.children);
      }
    };
    findAndCollect(list);
  }

  const walk = (nodes: MenuItem[], depth: number) => {
    for (const node of nodes) {
      if (excluded.has(node.id)) continue;
      result.push({ label: `${'　'.repeat(depth)}${node.menuName}`, value: node.id, depth });
      if (node.children?.length) walk(node.children, depth + 1);
    }
  };
  walk(list, 0);

  return result;
}

const parentOptions = computed(() => [
  { label: $t('page.manage.menu.topMenu'), value: 0 },
  ...buildParentOptions(props.treeData, props.operateType === 'edit' ? props.rowData : null)
]);

const typeOptions = computed(() => [
  { label: $t('page.manage.menu.catalog'), value: 'catalog' as MenuType },
  { label: $t('page.manage.menu.menu'), value: 'menu' as MenuType }
]);

const statusOptions = computed(() => [
  { label: $t('common.enable'), value: '1' },
  { label: $t('common.disable'), value: '2' }
]);

const formItems = computed<FormItemConfig[]>(() => {
  const base: FormItemConfig[] = [
    {
      key: 'menuType',
      label: $t('page.manage.menu.type'),
      type: 'select',
      required: true,
      span: 12,
      options: typeOptions.value
    },
    {
      key: 'parentId',
      label: $t('page.manage.menu.parentMenu'),
      type: 'select',
      span: 12,
      options: parentOptions.value
    },
    {
      key: 'menuName',
      label: $t('page.manage.menu.menuName'),
      type: 'input',
      required: true,
      span: 24,
      placeholder: $t('page.manage.menu.form.menuNamePlaceholder')
    },
    {
      key: 'icon',
      label: $t('page.manage.menu.icon'),
      type: 'icon-picker',
      span: 24,
      placeholder: $t('common.iconPicker.placeholder')
    }
  ];

  // route/component fields only for menu type
  if (model.value.menuType === 'menu') {
    base.push(
      {
        key: 'routePath',
        label: $t('page.manage.menu.routePath'),
        type: 'input',
        required: true,
        span: 24,
        placeholder: $t('page.manage.menu.form.routePlaceholder')
      },
      {
        key: 'componentPath',
        label: $t('page.manage.menu.componentPath'),
        type: 'input',
        span: 24,
        placeholder: $t('page.manage.menu.form.componentPlaceholder')
      },
      {
        key: 'permission',
        label: $t('page.manage.menu.permission'),
        type: 'input',
        span: 24,
        placeholder: $t('page.manage.menu.form.permissionPlaceholder')
      }
    );
  } else {
    base.push(
      {
        key: 'routePath',
        label: $t('page.manage.menu.routePath'),
        type: 'input',
        span: 24,
        placeholder: $t('page.manage.menu.form.routePlaceholder')
      },
      {
        key: 'redirect',
        label: $t('page.manage.menu.redirect'),
        type: 'input',
        span: 24,
        placeholder: $t('page.manage.menu.form.redirectPlaceholder')
      }
    );
  }

  base.push(
    {
      key: 'sort',
      label: $t('page.manage.menu.sort'),
      type: 'number',
      span: 12,
      required: true
    },
    {
      key: 'status',
      label: $t('page.manage.menu.status'),
      type: 'select',
      span: 12,
      required: true,
      options: statusOptions.value
    },
    {
      key: 'visible',
      label: $t('page.manage.menu.visible'),
      type: 'switch',
      span: 12,
      checkedText: $t('common.yesOrNo.yes'),
      uncheckedText: $t('common.yesOrNo.no')
    },
    {
      key: 'keepAlive',
      label: $t('page.manage.menu.keepAlive'),
      type: 'switch',
      span: 12,
      checkedText: $t('common.yesOrNo.yes'),
      uncheckedText: $t('common.yesOrNo.no')
    },
    {
      key: 'isExternal',
      label: $t('page.manage.menu.isExternal'),
      type: 'switch',
      span: 12,
      checkedText: $t('common.yesOrNo.yes'),
      uncheckedText: $t('common.yesOrNo.no')
    }
  );

  return base;
});

const loading = ref(false);
const formRef = ref<InstanceType<typeof NFormWrap> | null>(null);

watch(
  () => props.visible,
  async visible => {
    if (visible) {
      model.value = createDefaultModel();
      if (props.operateType === 'edit' && props.rowData != null) {
        await loadDetail(props.rowData);
      } else if (props.operateType === 'add' && props.parentId != null) {
        model.value.parentId = props.parentId;
      }
    }
  }
);

async function loadDetail(id: number) {
  // find node in tree (flatten)
  const flat = flatten(props.treeData);
  const row = flat.find(item => item.id === id);
  if (row) {
    model.value = {
      parentId: row.parentId,
      menuName: row.menuName,
      menuType: row.menuType,
      icon: row.icon,
      routePath: row.routePath,
      componentPath: row.componentPath,
      permission: row.permission,
      sort: row.sort ?? 1,
      status: row.status,
      visible: row.visible,
      keepAlive: row.keepAlive,
      isExternal: row.isExternal,
      redirect: row.redirect
    };
  }
}

function flatten(list: MenuItem[]): MenuItem[] {
  const res: MenuItem[] = [];
  const walk = (nodes: MenuItem[]) => {
    for (const node of nodes) {
      res.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(list);
  return res;
}

async function handleSubmit() {
  console.log(model.value, 'model.value');
  if (!(await formRef.value?.validate())) return;

  loading.value = true;
  try {
    if (props.operateType === 'edit' && props.rowData != null) {
      await fetchUpdateMenu({ ...model.value, id: props.rowData });
      window.$message?.success($t('common.updateSuccess'));
    } else {
      await fetchCreateMenu(model.value);
      window.$message?.success($t('common.createSuccess'));
    }
    emit('update:visible', false);
    emit('submitted');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <CommonDrawer
    :show="visible"
    :title="title"
    :loading="loading"
    width="500"
    @update:show="value => emit('update:visible', value)"
    @submit="handleSubmit"
  >
    <NFormWrap ref="formRef" :model="model" :items="formItems" :grid-x-gap="16" />
  </CommonDrawer>
</template>
