<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import Drawer from '@/components/common/drawer.vue';
import InputUpload from '@/components/Upload/input-upload.vue';
import { Table } from '@/components/Table';
import type { VxeColumnRenderColumn } from '@/components/Table';
import { exportRowsToXlsx, type ExportField } from '@/components/Export';
import { fetchBatchCreateRemote, fetchParseRemoteFile } from '@/service/api/remote';
import RemoteRowOperateDrawer from './RemoteRowOperateDrawer.vue';

defineOptions({ name: 'RemoteImportDrawer' });

type BasicRemote = Api.DataManage.BasicRemote;
type BasicRemoteGroup = Api.DataManage.BasicRemoteGroup;

const emit = defineEmits<{
  submitted: [];
}>();

/**
 * Excel 模板表头：必须与后端 `remoteService.uploadField` 的 key 逐字一致
 * （`国家代码*` / `城市` / `起始邮编` / `结束邮编`），否则 /file/parse 会抛 UPLOAD_FIELD_ERROR。
 * 后端只认这四个中文字面量，故模板与导出不随界面语言切换。
 */
const EXCEL_FIELDS: ExportField[] = [
  { key: 'country', title: '国家代码*' },
  { key: 'city', title: '城市' },
  { key: 'zipStart', title: '起始邮编' },
  { key: 'zipEnd', title: '结束邮编' }
];

const drawerVisible = ref(false);
const submitting = ref(false);
const exporting = ref(false);
/** 当前操作的偏远类别 */
const currentGroup = ref<BasicRemoteGroup | null>(null);
/** 本次解析结果（确认导入前不落库） */
const parsedList = ref<BasicRemote[]>([]);

const pagination = reactive({ current: 1, size: 50, total: 0 });
const pageRows = computed(() =>
  parsedList.value.slice((pagination.current - 1) * pagination.size, pagination.current * pagination.size)
);

const columns = computed<VxeColumnRenderColumn[]>(() => [
  {
    key: 'parseMsg',
    title: $t('page.dataManage.basic.remote.checkResult'),
    visible: true,
    width: 120,
    align: 'center',
    sortable: false
  },
  {
    key: 'country',
    title: $t('page.dataManage.basic.remote.countryCode'),
    visible: true,
    minWidth: 140,
    sortable: false
  },
  { key: 'city', title: $t('page.dataManage.basic.remote.city'), visible: true, minWidth: 160, sortable: false },
  {
    key: 'zipStart',
    title: $t('page.dataManage.basic.remote.zipStart'),
    visible: true,
    minWidth: 140,
    sortable: false
  },
  { key: 'zipEnd', title: $t('page.dataManage.basic.remote.zipEnd'), visible: true, minWidth: 140, sortable: false }
]);

/**
 * 校验结果是否通过：后端 `/file/parse` 已用 `remoteService.checkList` 校验（比 `/remote/check` 更严），
 * 并把不通过的行直接丢弃、对合法行统一写 `parseMsg = '通过'`；空值按通过处理（与后端口径一致）。
 * 因此本列不会额外发请求，单纯呈现解析阶段的校验结论。
 */
function isPassed(item: BasicRemote) {
  return !item.parseMsg || item.parseMsg === '通过';
}

/** 校验结果标签文案：通过 → i18n「通过」；未通过 → 后端返回的原因原文（后端为中文硬编码，不翻译） */
function parseMsgText(row: BasicRemote) {
  return isPassed(row) ? $t('page.dataManage.basic.remote.checkPassed') : String(row.parseMsg);
}

function open(row: BasicRemoteGroup) {
  currentGroup.value = row;
  parsedList.value = [];
  pagination.current = 1;
  pagination.size = 50;
  pagination.total = 0;
  drawerVisible.value = true;
}

/** 下载导入模板（仅表头的空 xlsx） */
async function handleDownloadTemplate() {
  await exportRowsToXlsx([], EXCEL_FIELDS, $t('page.dataManage.basic.remote.templateName'));
}

/** 导出当前列表数据（本次解析结果，字段同模板） */
async function handleExportList() {
  if (!parsedList.value.length) {
    window.$message?.warning($t('common.noData'));
    return;
  }

  exporting.value = true;
  try {
    await exportRowsToXlsx(parsedList.value as unknown[], EXCEL_FIELDS, $t('page.dataManage.basic.remote.exportName'));
    window.$message?.success($t('common.exportSuccess'));
  } catch (error) {
    console.error('export failed', error);
    window.$message?.error($t('common.exportFailed'));
  } finally {
    exporting.value = false;
  }
}

/**
 * `InputUpload` 的自定义上传：`/file/parse?fileType=1` 只回传解析行、**不落文件也不返回地址**，
 * 故只回 `{ raw }`（`InputUpload` 的 UploadFn 已支持 url 缺省）。
 */
async function uploadAndParse(file: File) {
  const { data, error } = await fetchParseRemoteFile(file);
  if (error || !data) return null;

  return { raw: data };
}

/** 解析成功：写入预览表格（确认导入前不落库） */
function handleParsed(raw: unknown) {
  const list = (raw as { list?: BasicRemote[] } | undefined)?.list ?? [];

  parsedList.value = list;
  pagination.current = 1;
  pagination.total = list.length;

  if (!list.length) window.$message?.warning($t('common.noData'));
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
}

const editDrawerRef = ref<InstanceType<typeof RemoteRowOperateDrawer> | null>(null);

/** 打开行编辑抽屉（需带上下标，保存后按位替换） */
function openEdit(row: BasicRemote) {
  const index = parsedList.value.indexOf(row);
  if (index < 0) return;

  editDrawerRef.value?.open(row, index);
}

/** 编辑保存后（已过 /remote/check 重新校验）按位替换预览行 */
function handleRowUpdated({ index, row }: { index: number; row: BasicRemote }) {
  if (index < 0 || index >= parsedList.value.length) return;

  parsedList.value.splice(index, 1, row);
}

/** 移除预览行：仅影响本次导入（真正落库在「确定导入」），并同步分页 */
function handleRemoveRow(row: BasicRemote) {
  const index = parsedList.value.indexOf(row);
  if (index < 0) return;

  parsedList.value.splice(index, 1);
  pagination.total = parsedList.value.length;

  // 删除后当前页可能超界，回退到最后一页
  const maxPage = Math.max(1, Math.ceil(parsedList.value.length / pagination.size));
  if (pagination.current > maxPage) pagination.current = maxPage;
}

/** 确定导入：覆盖该类别下已存在的全部偏远数据（后端 batch/create 先删后插） */
async function handleSubmit() {
  const group = currentGroup.value;

  if (!group || !parsedList.value.length) {
    window.$message?.warning($t('common.noData'));
    return;
  }

  // 只提交校验通过的行（解析结果里带 parseMsg 的行不通过，不能被写库）
  const validList = parsedList.value.filter(isPassed);
  if (!validList.length) {
    window.$message?.warning($t('page.dataManage.basic.remote.noValidTip'));
    return;
  }

  const skipped = parsedList.value.length - validList.length;
  const tips = [$t('page.dataManage.basic.remote.importOverwriteTip', { count: group.remoteCount ?? 0 })];
  if (skipped) tips.push($t('page.dataManage.basic.remote.skipInvalidTip', { count: skipped }));

  window.$dialog?.warning({
    title: $t('common.tip'),
    content: tips.join(' '),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      submitting.value = true;
      try {
        const { error } = await fetchBatchCreateRemote(group._id, validList);
        if (error) return;

        drawerVisible.value = false;
        emit('submitted');
        window.$message?.success($t('page.dataManage.basic.remote.importSuccess'));
      } finally {
        submitting.value = false;
      }
    }
  });
}

defineExpose({ open });
</script>

<template>
  <Drawer
    v-model:show="drawerVisible"
    :title="$t('page.dataManage.basic.remote.importTitle')"
    width="70%"
    :loading="submitting"
    :confirm-text="$t('page.dataManage.basic.remote.confirmImport')"
    @submit="handleSubmit"
  >
    <div class="h-full w-full flex flex-col gap-12px">
      <div class="flex flex-wrap items-center gap-12px">
        <LButton @click="handleDownloadTemplate">
          <template #icon><icon-mdi-download class="text-icon" /></template>
          {{ $t('page.dataManage.basic.remote.importTemplate') }}
        </LButton>
        <InputUpload
          trigger="button"
          accept=".xlsx,.xls"
          :button-text="$t('page.dataManage.basic.remote.chooseFile')"
          :upload="uploadAndParse"
          @success="handleParsed"
        />
        <LButton :loading="exporting" @click="handleExportList">
          {{ $t('page.dataManage.basic.remote.exportListData') }}
        </LButton>
      </div>

      <!--
        高度自适应：naive 抽屉内容层（.n-scrollbar-content）是 auto 高度，
        直接写 h-full / flex-1 吃不到确定高度，故按仓库既有先例（CarrierFeeExtSyncDrawer）用视口高度计算：
        100vh - 抽屉头/脚与 body 内边距（160px，同先例） - 本页工具栏 34px - 栅格间距 12px；
        分页条由 Table 内部贴在该容器底部，窗口高度变化时同步自适应
      -->
      <div class="h-[calc(100vh_-_206px)]">
        <Table
          :columns="columns"
          :data="pageRows"
          :pagination="pagination"
          :show-seq="true"
          show-action
          :action-width="120"
          @page-change="handlePageChange"
        >
          <template #parseMsg="{ row }">
            <NTag :type="isPassed(row as BasicRemote) ? 'success' : 'error'" size="small" :bordered="false">
              {{ parseMsgText(row as BasicRemote) }}
            </NTag>
          </template>
          <template #action="{ row }">
            <LButton type="primary" text @click="openEdit(row as BasicRemote)">
              {{ $t('common.edit') }}
            </LButton>
            <LButton type="error" text popconfirm @positive-click="handleRemoveRow(row as BasicRemote)">
              {{ $t('page.dataManage.basic.remote.remove') }}
            </LButton>
          </template>
        </Table>
      </div>
    </div>
  </Drawer>

  <!-- 行编辑抽屉（与导入抽屉同级，避免嵌进抽屉内容区） -->
  <RemoteRowOperateDrawer ref="editDrawerRef" @updated="handleRowUpdated" />
</template>
