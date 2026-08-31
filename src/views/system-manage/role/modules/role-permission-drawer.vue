<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { TreeOption } from 'naive-ui';
import { $t } from '@/locales';
import { fetchAssignRoleMenu, fetchGetRoleMenuTree } from '@/service/api/system-manage';
import CommonDrawer from '@/components/common/drawer.vue';

interface Props {
  /** drawer visibility, use v-model:show */
  show?: boolean;
  /** role to assign menus */
  row?: Api.SystemManage.Role | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  row: null
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  submitted: [];
}>();

const drawerVisible = computed({
  get: () => props.show,
  set: val => emit('update:show', val)
});

const title = computed(() =>
  props.row ? `${$t('page.manage.role.permission')} - ${props.row.roleName}` : $t('page.manage.role.permission')
);

const submitting = ref(false);
const treeLoading = ref(false);
const menuTree = ref<Api.SystemManage.RoleMenuNode[]>([]);
const checkedKeys = ref<number[]>([]);
const indeterminateKeys = ref<number[]>([]);

const treeOptions = computed<TreeOption[]>(() => convertTree(menuTree.value));

const allMenuKeys = computed(() => collectKeys(menuTree.value));

const isAllChecked = computed(
  () => allMenuKeys.value.length > 0 && allMenuKeys.value.every(key => checkedKeys.value.includes(key))
);

function convertTree(nodes: Api.SystemManage.RoleMenuNode[]): TreeOption[] {
  return nodes.map(node => ({
    key: node.id,
    label: node.title,
    children: node.children?.length ? convertTree(node.children) : undefined
  }));
}

function collectKeys(nodes: Api.SystemManage.RoleMenuNode[]): number[] {
  const keys: number[] = [];

  function walk(list: Api.SystemManage.RoleMenuNode[]) {
    list.forEach(node => {
      keys.push(node.id);
      if (node.children?.length) {
        walk(node.children);
      }
    });
  }

  walk(nodes);

  return keys;
}

async function loadMenuTree() {
  if (!props.row) return;
  treeLoading.value = true;
  try {
    const { menus, checkedMenuIds } = (await fetchGetRoleMenuTree(props.row.id)) as Api.SystemManage.RoleMenuTree;
    menuTree.value = menus;
    checkedKeys.value = [...checkedMenuIds];
    indeterminateKeys.value = [];
  } finally {
    treeLoading.value = false;
  }
}

function toggleCheckAll() {
  checkedKeys.value = isAllChecked.value ? [] : [...allMenuKeys.value];
  indeterminateKeys.value = [];
}

async function handleSubmit() {
  if (!props.row) return;
  submitting.value = true;
  try {
    await fetchAssignRoleMenu({ roleId: props.row.id, menuIds: checkedKeys.value });
    window.$message?.success($t('common.updateSuccess'));
    drawerVisible.value = false;
    emit('submitted');
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.show,
  val => {
    if (val) {
      loadMenuTree();
    }
  }
);
</script>

<template>
  <CommonDrawer v-model:show="drawerVisible" :title="title" :width="480" :loading="submitting" @submit="handleSubmit">
    <NSpace vertical :size="12" class="w-full">
      <NSpace justify="space-between" align="center">
        <span class="text-14px">{{ $t('page.manage.role.permissionTip') }}</span>
        <NButton size="small" tertiary :disabled="allMenuKeys.length === 0" @click="toggleCheckAll">
          {{ isAllChecked ? $t('common.unselectAll') : $t('common.selectAll') }}
        </NButton>
      </NSpace>
      <NSpin :show="treeLoading" class="w-full">
        <NTree
          v-model:checked-keys="checkedKeys"
          v-model:indeterminate-keys="indeterminateKeys"
          :data="treeOptions"
          checkable
          cascade
          check-strategy="all"
          block-line
          default-expand-all
          :selectable="false"
          class="max-h-520px"
        />
      </NSpin>
    </NSpace>
  </CommonDrawer>
</template>
