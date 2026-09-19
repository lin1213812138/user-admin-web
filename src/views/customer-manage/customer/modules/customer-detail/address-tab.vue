<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import {
  fetchCreateShipTo,
  fetchCreateShipper,
  fetchDeleteShipTo,
  fetchDeleteShipper,
  fetchGetShipToList,
  fetchGetShipperList,
  fetchUpdateShipTo,
  fetchUpdateShipper
} from '@/service/api/ship-address';
import { Table, useVxeTable } from '@/components/Table';
import type { VxeColumnConfig } from '@/components/Table';
import ShipToOperateDrawer from '@/views/data-manage/business/modules/address/ship-to/ShipToOperateDrawer.vue';
import ShipperOperateDrawer from '@/views/data-manage/business/modules/address/shipper/ShipperOperateDrawer.vue';

defineOptions({ name: 'AddressTab' });

interface Props {
  /** ship-to-收件地址 / shipper-发件地址（两者接口同构，仅前缀不同） */
  type: 'ship-to' | 'shipper';
  customerId: string;
  /** 客户名称（新增地址弹窗只读展示用） */
  customerName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  customerName: ''
});

const isShipTo = computed(() => props.type === 'ship-to');

const searchParams = reactive<{ keyword: string }>({ keyword: '' });

/** 收/发件地址接口同构，按 type 切换实现 */
const apiByType = {
  'ship-to': {
    query: fetchGetShipToList,
    create: fetchCreateShipTo,
    update: fetchUpdateShipTo,
    remove: fetchDeleteShipTo
  },
  shipper: {
    query: fetchGetShipperList,
    create: fetchCreateShipper,
    update: fetchUpdateShipper,
    remove: fetchDeleteShipper
  }
};

const addressApi = apiByType[props.type];

const { data, loading, columns, pagination, getData, resetColumns, persistColumns, columnConfigs } = useVxeTable<
  Api.SystemManage.CustomerAddressList,
  Api.SystemManage.CustomerAddress
>({
  api: async ({ current, size }) => {
    const { data: res, error } = await addressApi.query({
      page: current,
      size,
      keyword: searchParams.keyword?.trim() || undefined,
      // keyword 必须显式传 keywordFields 才生效（同 ship-to 老坑）
      keywordFields: ['name', 'phone', 'zip'],
      where: { customerId: props.customerId }
    });

    if (error || !res) return { list: [], total: 0 };

    return res;
  },
  transform: r => ({ records: r.list, total: r.total }),
  columns: () =>
    [
      { key: 'tag', title: $t('page.manage.customer.detail.addressTag'), visible: true, width: 90, sortable: false },
      {
        key: 'country',
        title: $t('page.manage.customer.detail.destination'),
        visible: true,
        width: 90,
        sortable: false
      },
      {
        key: 'name',
        title: isShipTo.value ? $t('page.manage.customer.detail.stName') : $t('page.manage.customer.detail.spName'),
        visible: true,
        width: 90,
        sortable: false
      },
      {
        key: 'company',
        title: isShipTo.value
          ? $t('page.manage.customer.detail.stCompany')
          : $t('page.manage.customer.detail.spCompany'),
        visible: true,
        width: 110,
        sortable: false
      },
      {
        key: 'phone',
        title: isShipTo.value ? $t('page.manage.customer.detail.stPhone') : $t('page.manage.customer.detail.spPhone'),
        visible: true,
        width: 110,
        sortable: false
      },
      {
        key: 'email',
        title: isShipTo.value ? $t('page.manage.customer.detail.stEmail') : $t('page.manage.customer.detail.spEmail'),
        visible: true,
        width: 140,
        sortable: false
      },
      {
        key: 'address',
        title: isShipTo.value
          ? $t('page.manage.customer.detail.stAddress')
          : $t('page.manage.customer.detail.spAddress'),
        visible: true,
        minWidth: 180,
        sortable: false
      },
      {
        key: 'city',
        title: isShipTo.value ? $t('page.manage.customer.detail.stCity') : $t('page.manage.customer.detail.spCity'),
        visible: true,
        width: 90,
        sortable: false
      },
      {
        key: 'state',
        title: isShipTo.value ? $t('page.manage.customer.detail.stState') : $t('page.manage.customer.detail.spState'),
        visible: true,
        width: 90,
        sortable: false
      },
      {
        key: 'mobile',
        title: isShipTo.value ? $t('page.manage.customer.detail.stMobile') : $t('page.manage.customer.detail.spMobile'),
        visible: true,
        width: 100,
        sortable: false
      },
      {
        key: 'zip',
        title: isShipTo.value ? $t('page.manage.customer.detail.stZip') : $t('page.manage.customer.detail.spZip'),
        visible: true,
        width: 90,
        sortable: false
      },
      {
        key: 'taxNo',
        title: isShipTo.value ? $t('page.manage.customer.detail.stTaxNo') : $t('page.manage.customer.detail.spTaxNo'),
        visible: true,
        width: 100,
        sortable: false
      }
    ] as VxeColumnConfig[],
  cacheKey: `customer-detail-${props.type}`
});

function handlePageChange({ current, size }: { current: number; size: number }) {
  pagination.current = current;
  pagination.size = size;
  getData();
}

function handleSearch() {
  pagination.current = 1;
  getData();
}

function handleReset() {
  searchParams.keyword = '';
  handleSearch();
}

const configVisible = ref(false);
const shipToOperateRef = ref<InstanceType<typeof ShipToOperateDrawer>>();
const shipperOperateRef = ref<InstanceType<typeof ShipperOperateDrawer>>();

function openCreate() {
  if (isShipTo.value) {
    shipToOperateRef.value?.open();
  } else {
    shipperOperateRef.value?.open();
  }
}

function openEdit(row: Api.SystemManage.CustomerAddress) {
  if (isShipTo.value) {
    shipToOperateRef.value?.open(row);
  } else {
    shipperOperateRef.value?.open(row);
  }
}

async function handleDelete(row: Api.SystemManage.CustomerAddress) {
  const { error } = await addressApi.remove([row._id]);
  if (error) return;

  window.$message?.success($t('common.deleteSuccess'));
  getData();
}
</script>

<template>
  <div class="h-full">
    <Table
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination"
      :show-seq="true"
      :show-checkbox="true"
      :show-action="true"
      :action-width="110"
      @search="handleSearch"
      @reset="handleReset"
      @refresh="getData"
      @page-change="handlePageChange"
    >
      <template #operation-left>
        <LButton type="primary" ghost @click="openCreate">
          <template #icon>
            <icon-ic-round-plus class="text-icon" />
          </template>
          {{ $t('common.add') }}
        </LButton>
      </template>

      <template #operation-right>
        <NSpace justify="end" wrap>
          <NInput
            v-model:value="searchParams.keyword"
            class="w-260px!"
            :placeholder="$t('page.manage.customer.detail.addressSearchPlaceholder')"
            @keyup.enter="handleSearch"
          />
        </NSpace>
      </template>

      <template #action="{ row }">
        <LButton type="primary" text @click="openEdit(row)">{{ $t('common.edit') }}</LButton>
        <LButton type="error" text popconfirm @positive-click="handleDelete(row)">{{ $t('common.delete') }}</LButton>
      </template>
    </Table>

    <TableColumnConfig
      v-model:visible="configVisible"
      v-model:columns="columnConfigs"
      @confirm="persistColumns"
      @reset="resetColumns"
    />

    <ShipToOperateDrawer
      ref="shipToOperateRef"
      :customer-id="customerId"
      :customer-name="customerName"
      @submitted="getData"
    />
    <ShipperOperateDrawer
      ref="shipperOperateRef"
      :customer-id="customerId"
      :customer-name="customerName"
      @submitted="getData"
    />
  </div>
</template>

<style scoped></style>
