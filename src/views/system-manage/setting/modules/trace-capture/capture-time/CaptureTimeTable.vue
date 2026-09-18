<script setup lang="ts">
/**
 * 抓取时间（轨迹抓取配置第 4 个子 tab）：
 * - 主表格为只读的抓取执行记录，数据源为 POST /op-log/query（固定 where.opType=4「追踪」类型日志）
 * - 列：操作日志(name) / 操作系统(client) / 操作类型(opType) / 操作人(creator) / 操作时间(createDate)
 * - 工具栏左侧「抓取时间设置」按钮打开配置弹窗（每日自动抓取时间点）
 */
import { ref } from 'vue';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { Table, TableColumnConfig, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import { NButton, NTag } from 'naive-ui';
import { fetchGetOpLogList } from '@/service/api/op-log';
import CaptureTimeModal from './CaptureTimeModal.vue';

/** 操作端选项（0-TMS 1-PC 2-PDA 3-OMS，文案与系统日志页一致） */
const clientOptions = [
  { label: 'TMS', value: 0 },
  { label: 'PC', value: 1 },
  { label: 'PDA', value: 2 },
  { label: 'OMS', value: 3 }
];

/** 操作类型文案（0-登录 1-修改 2-删除 3-退出 4-追踪，本 tab 固定查 4，其余做兜底显示） */
const opTypeTextMap: Record<number, string> = {
  0: $t('page.manage.opLog.opTypeOption.login'),
  1: $t('page.manage.opLog.opTypeOption.update'),
  2: $t('page.manage.opLog.opTypeOption.del'),
  3: $t('page.manage.opLog.opTypeOption.logout'),
  4: $t('page.manage.opLog.opTypeOption.trace')
};

/** 操作类型标签色（前四位与系统日志页一致，4-追踪取 warning） */
const opTypeTagMap = ['primary', 'info', 'error', 'default', 'warning'] as const;

const { data, loading, columnConfigs, columns, pagination, getData, persistColumns, resetColumns } = useVxeTable<
  Api.SystemManage.OpLogList,
  Api.SystemManage.OpLog
>({
  // 真实接口 /op-log/query 走 flat request，解包 { data, error }（错误提示由 request 拦截器统一弹出）
  api: async ({ current, size }) => {
    const { data: res, error } = await fetchGetOpLogList({
      page: current,
      size,
      where: { opType: 4 }
    });
    if (error || !res) return { list: [], total: 0 };
    return res;
  },
  // 返回 ret:{ list, total }，映射为表格需要的 records/total
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      {
        key: 'desc',
        title: $t('page.manage.setting.traceCapture.captureTime.col.log'),
        visible: true,
        minWidth: 260,
        sortable: false
      },
      {
        key: 'client',
        title: $t('page.manage.setting.traceCapture.captureTime.col.system'),
        visible: true,
        width: 130,
        sortable: false,
        align: 'center'
      },
      {
        key: 'opType',
        title: $t('page.manage.setting.traceCapture.captureTime.col.opType'),
        visible: true,
        width: 130,
        sortable: false,
        align: 'center'
      },
      {
        key: 'creator',
        title: $t('page.manage.setting.traceCapture.captureTime.col.operator'),
        visible: true,
        width: 110,
        sortable: false
      },
      {
        key: 'createDate',
        title: $t('page.manage.setting.traceCapture.captureTime.col.opTime'),
        visible: true,
        width: 170,
        sortable: false
      }
    ] as VxeColumnConfig[],
  // 默认列 key 由 mock 字段改为 OpLog 字段，cacheKey 升级避免旧列配置缓存错乱
  cacheKey: 'trace-capture-time-v2'
});

const configVisible = ref(false);
const modalVisible = ref(false);

/** 操作端文案 */
function clientText(value?: Api.SystemManage.OpLogClient) {
  return value === undefined ? '--' : (clientOptions[value]?.label ?? '--');
}

/** 操作类型文案 */
function opTypeText(value?: Api.SystemManage.OpLogOpType) {
  return value === undefined ? '--' : (opTypeTextMap[value] ?? '--');
}

/** 操作类型标签色 */
function opTypeTagType(value?: Api.SystemManage.OpLogOpType) {
  return value === undefined ? 'default' : (opTypeTagMap[value] ?? 'default');
}

/** 操作时间（毫秒时间戳）格式化 */
function formatOpTime(value?: number) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '--';
}

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="min-h-0 flex-1">
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        @refresh="getData"
        @page-change="handlePageChange"
      >
        <template #operation-left>
          <NButton size="small" type="primary" ghost @click="modalVisible = true">
            <template #icon><icon-mdi-clock-outline class="text-icon" /></template>
            {{ $t('page.manage.setting.traceCapture.captureTime.entry') }}
          </NButton>
        </template>
        <template #operation-right>
          <NSpace justify="end" wrap>
            <NButton size="small" @click="getData">
              <template #icon>
                <icon-mdi-refresh class="text-icon" />
              </template>
            </NButton>
          </NSpace>
        </template>
        <template #client="{ row }">
          <NTag size="small">{{ clientText(row.client) }}</NTag>
        </template>
        <template #opType="{ row }">
          <NTag size="small" :type="opTypeTagType(row.opType)">
            {{ opTypeText(row.opType) }}
          </NTag>
        </template>
        <template #createDate="{ row }">{{ formatOpTime(row.createDate) }}</template>
      </Table>
    </div>
    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />
    <CaptureTimeModal v-model:show="modalVisible" />
  </div>
</template>
