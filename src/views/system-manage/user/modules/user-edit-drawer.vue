<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchGetUser, fetchUpdateUser } from '@/service/api/user';
import { fetchGetRoleQueryList } from '@/service/api/role';
import { fetchGetSiteList } from '@/service/api/site';
import { fetchGetGroupList } from '@/service/api/group';
import UserDrawer from '@/components/common/drawer.vue';
import BasicInfo from './edit/BasicInfo.vue';
import Profile from './edit/Profile.vue';
import Perm from './edit/Perm.vue';
import Account from './edit/Account.vue';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 编辑行（列表行数据，抽屉内再 /user/get 取全量回填） */
  row?: Api.SystemManage.User | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  row: null
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  /** 保存成功，父级刷新列表 */
  submitted: [];
}>();

const drawerVisible = computed({
  get: () => props.show,
  set: val => emit('update:show', val)
});

const title = computed(() => $t('common.edit'));

const user = ref<Api.SystemManage.User | null>(null);
const loading = ref(false);
/** /user/get 失败时的兜底空态 */
const failed = ref(false);
const submitting = ref(false);
const activeTab = ref('profile');

const basicRef = ref<InstanceType<typeof BasicInfo>>();
const profileRef = ref<InstanceType<typeof Profile>>();

/** 下拉选项：用户角色（真实 /role/query）/ 所属站点 / 所属组别，主键均为字符串 _id */
const roleOptions = ref<CommonType.Option<string>[]>([]);
const siteOptions = ref<CommonType.Option<string>[]>([]);
const groupOptions = ref<CommonType.Option<string>[]>([]);

async function loadOptions() {
  const [roleRes, siteRes, groupRes] = await Promise.all([
    fetchGetRoleQueryList(),
    fetchGetSiteList({ page: 1, size: 100 }),
    fetchGetGroupList()
  ]);

  roleOptions.value = (roleRes.data?.list ?? []).map(item => ({ label: item.name, value: item._id }));
  siteOptions.value = (siteRes.data?.list ?? []).map(item => ({ label: item.name, value: item._id }));
  groupOptions.value = (groupRes.data?.list ?? []).map(item => ({ label: item.name, value: item._id }));
}

onMounted(() => {
  loadOptions();
});

/** /user/get 取全量数据（列表行不含 fullName 等档案字段） */
async function loadUser() {
  if (!props.row) return;

  loading.value = true;

  try {
    const { data, error } = await fetchGetUser(props.row._id);

    if (error || !data) {
      failed.value = true;
      return;
    }

    user.value = data;
    failed.value = false;
  } finally {
    loading.value = false;
  }
}

/** 统一保存：基本信息 + 个人档案一次提交（/user/update 为全量覆盖语义） */
async function handleSubmit() {
  if (!user.value) return;

  const basic = basicRef.value?.collect();
  const profile = profileRef.value?.collect();

  const [basicValid, profileValid] = await Promise.all([basicRef.value?.validate(), profileRef.value?.validate()]);
  if (!basicValid || !profileValid || !basic || !profile) return;

  submitting.value = true;

  try {
    const { error } = await fetchUpdateUser({
      _id: user.value._id,
      ...basic,
      ...profile
    });

    // 真实接口错误已由 request 拦截器统一提示
    if (error) return;

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
    if (!val) return;

    // 每次打开重置到个人档案 tab、刷新下拉选项并重新拉取全量数据
    activeTab.value = 'profile';
    user.value = null;
    failed.value = false;
    loadOptions();
    loadUser();
  }
);
</script>

<template>
  <UserDrawer v-model:show="drawerVisible" :title="title" :loading="submitting" width="70%" @submit="handleSubmit">
    <NSpin :show="loading" class="min-h-240px">
      <template v-if="failed || !user">
        <NEmpty class="py-48px" :description="$t('common.noData')" />
      </template>

      <template v-else>
        <NCard :title="$t('page.manage.user.basicInfo')" size="small" class="mb-12px">
          <BasicInfo
            ref="basicRef"
            :user="user"
            :role-options="roleOptions"
            :site-options="siteOptions"
            :group-options="groupOptions"
          />
        </NCard>

        <NTabs v-model:value="activeTab" type="line">
          <NTabPane name="profile" :tab="$t('page.manage.user.profileInfo')" display-directive="show">
            <Profile ref="profileRef" :user="user" />
          </NTabPane>
          <NTabPane name="perm" :tab="$t('page.manage.user.editPage.tabPerm')">
            <Perm />
          </NTabPane>
          <NTabPane name="account" :tab="$t('page.manage.user.editPage.tabAccount')">
            <Account />
          </NTabPane>
        </NTabs>
      </template>
    </NSpin>
  </UserDrawer>
</template>

<style scoped></style>
