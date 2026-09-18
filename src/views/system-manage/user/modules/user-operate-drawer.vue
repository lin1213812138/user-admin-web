<script setup lang="ts">
import dayjs from 'dayjs';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { fetchCreateUser, fetchGetUser, fetchUpdateUser } from '@/service/api/user';
import { md5 } from '@/utils/crypto';
import { fetchGetRoleQueryList } from '@/service/api/role';
import { fetchGetSiteList } from '@/service/api/site';
import { fetchGetGroupList } from '@/service/api/group';
import UserDrawer from '@/components/common/drawer.vue';
import InputUpload from '@/components/Upload/input-upload.vue';
import { NCard } from 'naive-ui';
import NFormWrap, { type FormItemConfig } from '@/components/Form/index.vue';

type DrawerMode = 'create' | 'edit' | 'detail';

interface Props {
  /** 抽屉显隐，v-model:show */
  show?: boolean;
  /** 抽屉模式：新增 / 编辑 / 详情 */
  mode?: DrawerMode;
  /** 编辑 / 详情行数据 */
  row?: Api.SystemManage.User | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  mode: 'create',
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

const isDetail = computed(() => props.mode === 'detail');
const isCreate = computed(() => props.mode === 'create');

const title = computed(() => {
  if (props.mode === 'edit') return $t('common.edit');
  if (props.mode === 'detail') return $t('common.detail');
  return $t('common.add');
});

const submitting = ref(false);

const basicFormRef = ref<InstanceType<typeof NFormWrap>>();
const profileFormRef = ref<InstanceType<typeof NFormWrap>>();

/** 下拉选项：用户角色（真实 /role/query）/ 所属站点 / 所属组别，主键均为字符串 _id */
const roleOptions = ref<CommonType.Option<string>[]>([]);
const siteOptions = ref<CommonType.Option<string>[]>([]);
/** 组别全量数据：组别选项按所选站点联动过滤（Group 自带 siteId，无需按站点重复请求） */
const allGroups = ref<Api.SystemManage.Group[]>([]);

async function loadOptions() {
  const [roleRes, siteRes, groupRes] = await Promise.all([
    fetchGetRoleQueryList(),
    fetchGetSiteList({ page: 1, size: 100 }),
    fetchGetGroupList()
  ]);

  roleOptions.value = (roleRes.data?.list ?? []).map(item => ({ label: item.name, value: item._id }));
  siteOptions.value = (siteRes.data?.list ?? []).map(item => ({ label: item.name, value: item._id }));
  allGroups.value = groupRes.data?.list ?? [];
}

onMounted(() => {
  loadOptions();
});

const sexOptions = computed<CommonType.Option<Api.SystemManage.UserSex>[]>(() => [
  { label: $t('page.manage.user.unknown'), value: 0 },
  { label: $t('page.manage.user.male'), value: 1 },
  { label: $t('page.manage.user.female'), value: 2 }
]);

/** 状态不在表单中编辑（启停由列表「启用/停用」按钮控制），仅用于提交默认值/回填现值 */
const DEFAULT_STATUS: Api.Common.EnableStatus = 1;

/** 表单模型：日期/身份证按字符串编辑，提交时再转后端要求的毫秒时间戳 / Number */
interface UserFormModel {
  account: string;
  name: string;
  password: string;
  /** 空值必须给 null 才能触发 NSelect placeholder；空字符串会被当成有效值导致下拉框留白 */
  siteId: string | null;
  /** 表单不编辑状态：新增默认启用，编辑回填现值；启停由列表「启用/停用」按钮控制 */
  status: Api.Common.EnableStatus;
  roleIds: string[];
  groupIds: string[];
  fullName: string;
  sex: Api.SystemManage.UserSex;
  /** 'YYYY-MM-DD'，提交时转毫秒时间戳 */
  birthday: string;
  /** 字符串输入避免编辑期精度损失，提交时转 Number */
  idCard: string;
  address: string;
  phone: string;
  email: string;
  wx: string;
  contact: string;
  job: string;
  /** 'YYYY-MM-DD'，提交时转毫秒时间戳 */
  entryDate: string;
  qrCodeUrl: string;
  /** 附件原始文件名（后端 User.file 语义），fileUrl 存地址 */
  file: string;
  fileUrl: string;
  note: string;
}

function createEmptyModel(): UserFormModel {
  return {
    account: '',
    name: '',
    password: '',
    siteId: null,
    status: DEFAULT_STATUS,
    roleIds: [],
    groupIds: [],
    fullName: '',
    sex: 0,
    birthday: '',
    idCard: '',
    address: '',
    phone: '',
    email: '',
    wx: '',
    contact: '',
    job: '',
    entryDate: '',
    qrCodeUrl: '',
    file: '',
    fileUrl: '',
    note: ''
  };
}

const model = reactive<UserFormModel>(createEmptyModel());

/** 组别选项：未选站点时展示全部；已选站点时仅展示该站点的组别（并保留已选中项以便回显） */
const groupOptions = computed<CommonType.Option<string>[]>(() => {
  const selected = new Set(model.groupIds);

  return allGroups.value
    .filter(group => !model.siteId || group.siteId === model.siteId || selected.has(group._id))
    .map(group => ({ label: group.name, value: group._id }));
});

/** 回填标志：编辑/详情回填时跳过站点联动清理，避免误删历史数据中不属于当前站点的组别 */
let restoring = false;

/** 站点 → 组别联动：切换站点后，清掉不属于新站点的已选组别（sync 立即执行，配合 restoring 区分回填） */
watch(
  () => model.siteId,
  () => {
    if (restoring || !model.siteId) return;

    const validIds = new Set(allGroups.value.filter(group => group.siteId === model.siteId).map(group => group._id));

    model.groupIds = model.groupIds.filter(id => validIds.has(id));
  },
  { flush: 'sync' }
);

/** 基本信息卡片字段：账号 / 名称 / 密码 / 站点 / 角色 / 组别（组别随站点联动过滤） */
const basicItems = computed<FormItemConfig[]>(() => [
  {
    key: 'account',
    label: $t('page.manage.user.userName'),
    type: 'input',
    required: true,
    span: 8,
    placeholder: $t('page.manage.user.form.userNamePlaceholder')
  },
  {
    key: 'name',
    label: $t('page.manage.user.nickName'),
    type: 'input',
    required: true,
    span: 8,
    placeholder: $t('page.manage.user.form.nickNamePlaceholder')
  },
  {
    key: 'roleIds',
    label: $t('page.manage.user.roleName'),
    type: 'select',
    multiple: true,
    span: 8,
    options: roleOptions.value,
    placeholder: $t('page.manage.user.form.roleNamePlaceholder')
  },
  {
    key: 'password',
    label: $t('page.manage.user.password'),
    type: 'password',
    // 仅新增必填；编辑留空表示不修改密码（修改自己密码后端会强制重新登录）
    required: isCreate.value,
    span: 8,
    placeholder: isCreate.value
      ? $t('page.manage.user.form.passwordPlaceholder')
      : $t('page.manage.user.form.passwordEditPlaceholder')
  },
  {
    key: 'siteId',
    label: $t('page.manage.user.siteName'),
    type: 'select',
    required: true,
    span: 8,
    options: siteOptions.value,
    placeholder: $t('page.manage.user.form.siteNamePlaceholder')
  },
  {
    key: 'groupIds',
    label: $t('page.manage.user.groupName'),
    type: 'select',
    multiple: true,
    span: 8,
    options: groupOptions.value,
    placeholder: $t('page.manage.user.form.groupNamePlaceholder')
  }
]);

/** 个人档案卡片字段：真实姓名 / 性别 / 生日 / 身份证 / 电话 / 邮箱 / 微信 / 其它联系方式 / 职位 / 入职 / 地址 / 附件 / 二维码 / 备注 */
const profileItems = computed<FormItemConfig[]>(() => [
  {
    key: 'fullName',
    label: $t('page.manage.user.realName'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.realNamePlaceholder')
  },
  {
    key: 'sex',
    label: $t('page.manage.user.gender'),
    type: 'select',
    span: 8,
    options: sexOptions.value,
    placeholder: $t('page.manage.user.form.genderPlaceholder')
  },
  {
    key: 'birthday',
    label: $t('page.manage.user.birthday'),
    type: 'date',
    span: 8,
    placeholder: $t('page.manage.user.form.birthdayPlaceholder')
  },
  {
    key: 'idCard',
    label: $t('page.manage.user.idCard'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.idCardPlaceholder')
  },
  {
    key: 'phone',
    label: $t('page.manage.user.contactPhone'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.contactPhonePlaceholder')
  },
  {
    key: 'email',
    label: $t('page.manage.user.email'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.emailPlaceholder')
  },
  {
    key: 'wx',
    label: $t('page.manage.user.wechat'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.wechatPlaceholder')
  },
  {
    key: 'contact',
    label: $t('page.manage.user.otherContact'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.otherContactPlaceholder')
  },
  {
    key: 'job',
    label: $t('page.manage.user.position'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.positionPlaceholder')
  },
  {
    key: 'entryDate',
    label: $t('page.manage.user.hireDate'),
    type: 'date',
    span: 8,
    placeholder: $t('page.manage.user.form.hireDatePlaceholder')
  },
  {
    key: 'address',
    label: $t('page.manage.user.homeAddress'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.homeAddressPlaceholder')
  },
  {
    key: 'file',
    label: $t('page.manage.user.attachment'),
    type: 'custom',
    span: 8
  },
  {
    key: 'note',
    label: $t('page.manage.user.remark'),
    type: 'input',
    span: 8,
    placeholder: $t('page.manage.user.form.remarkPlaceholder')
  },
  {
    key: 'qrCodeUrl',
    label: $t('page.manage.user.wechatQrcode'),
    type: 'image',
    span: 8
  }
]);

/** 编辑 / 详情先 /user/get 取全量数据再回填（日期转 'YYYY-MM-DD'、身份证转字符串展示） */
async function fillFormByRow() {
  if (!props.row) return;

  const { data, error } = await fetchGetUser(props.row._id);
  if (error || !data) return;

  Object.assign(model, createEmptyModel());

  restoring = true;
  try {
    model.account = data.account ?? '';
    model.name = data.name ?? '';
    model.siteId = data.siteId ?? null;
    model.status = data.status;
    model.roleIds = data.roleIds ?? [];
    model.groupIds = data.groupIds ?? [];
    model.fullName = data.fullName ?? '';
    model.sex = data.sex ?? 0;
    model.birthday = data.birthday ? dayjs(data.birthday).format('YYYY-MM-DD') : '';
    // 后端为 Number，长号码已有精度损失，仅尽力还原展示
    model.idCard = data.idCard === undefined || data.idCard === null ? '' : String(data.idCard);
    model.address = data.address ?? '';
    model.phone = data.phone ?? '';
    model.email = data.email ?? '';
    model.wx = data.wx ?? '';
    model.contact = data.contact ?? '';
    model.job = data.job ?? '';
    model.entryDate = data.entryDate ? dayjs(data.entryDate).format('YYYY-MM-DD') : '';
    model.qrCodeUrl = data.qrCodeUrl ?? '';
    model.file = data.file ?? '';
    model.fileUrl = data.fileUrl ?? '';
    model.note = data.note ?? '';
  } finally {
    restoring = false;
  }
}

function resetForm() {
  Object.assign(model, createEmptyModel());
}

/** 组装提交参数：日期转毫秒时间戳、身份证转 Number（长号码有精度损失，待后端改 String） */
function buildSubmitParams() {
  return {
    account: model.account,
    name: model.name,
    // 校验已通过，siteId 此时必为 string；用非空断言避免 API 类型把 null 当成 string 报错
    siteId: model.siteId!,
    status: model.status,
    roleIds: model.roleIds,
    groupIds: model.groupIds,
    fullName: model.fullName,
    sex: model.sex,
    birthday: model.birthday ? dayjs(model.birthday).valueOf() : undefined,
    idCard: model.idCard ? Number(model.idCard) : undefined,
    address: model.address,
    phone: model.phone,
    email: model.email,
    wx: model.wx,
    contact: model.contact,
    job: model.job,
    entryDate: model.entryDate ? dayjs(model.entryDate).valueOf() : undefined,
    qrCodeUrl: model.qrCodeUrl,
    file: model.file,
    fileUrl: model.fileUrl,
    note: model.note
  };
}

/** 附件上传成功：file 存原始文件名、fileUrl 存地址（与后端 User 字段语义一致） */
function handleFileUploaded(raw: unknown) {
  const result = raw as Api.Upload.Result;

  model.file = result.name;
  model.fileUrl = result.url;
}

async function handleSubmit() {
  const [basicValid, profileValid] = await Promise.all([
    basicFormRef.value?.validate(),
    profileFormRef.value?.validate()
  ]);

  if (!basicValid || !profileValid) {
    return;
  }

  submitting.value = true;

  try {
    const { error } = isCreate.value
      ? await fetchCreateUser({
          ...buildSubmitParams(),
          // 与登录同格式：MD5(MD5(明文) + 明文)
          password: md5(md5(model.password) + model.password)
        })
      : await fetchUpdateUser({
          _id: props.row!._id,
          ...buildSubmitParams(),
          // 编辑时密码留空表示不修改；填写则按登录同格式加密后提交
          ...(model.password ? { password: md5(md5(model.password) + model.password) } : {})
        });

    // 真实接口错误已由 request 拦截器统一提示，这里只负责不再继续走成功流程
    if (error) return;

    if (isCreate.value) {
      window.$message?.success($t('common.addSuccess'));
    } else {
      window.$message?.success($t('common.updateSuccess'));
    }

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

    // 每次打开刷新下拉选项，保证新增的角色 / 站点 / 组别可即时选中
    loadOptions();

    if (isCreate.value) {
      resetForm();
    } else {
      fillFormByRow();
    }
  }
);
</script>

<template>
  <UserDrawer
    v-model:show="drawerVisible"
    :title="title"
    :loading="submitting"
    :footer="!isDetail"
    width="40%"
    @submit="handleSubmit"
  >
    <NCard :title="$t('page.manage.user.basicInfo')" size="small" class="mb-12px">
      <NFormWrap
        ref="basicFormRef"
        :model="model"
        :items="basicItems"
        :grid-x-gap="16"
        :mode="isDetail ? 'view' : 'edit'"
      />
    </NCard>

    <NCard :title="$t('page.manage.user.profileInfo')" size="small">
      <NFormWrap
        ref="profileFormRef"
        :model="model"
        :items="profileItems"
        :grid-x-gap="16"
        :mode="isDetail ? 'view' : 'edit'"
      >
        <!-- 附件：输入框 + 上传图标控件（真实上传 /upload，目录 1-用户），file 存原始名、fileUrl 存地址 -->
        <template #file>
          <InputUpload
            :value="model.file"
            :dest="1"
            :disabled="isDetail"
            @success="handleFileUploaded"
            @remove="
              model.file = '';
              model.fileUrl = '';
            "
          />
        </template>
      </NFormWrap>
    </NCard>
  </UserDrawer>
</template>

<style scoped></style>
