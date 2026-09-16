import type { MasterDataRow } from '@/components/MasterData/types';

type RowFactory = (i: number) => MasterDataRow;

const factories: Record<Api.DataManage.DataManageArchiveKey, RowFactory> = {
  countryRegion: i => ({
    id: i,
    code: `CR${String(i).padStart(4, '0')}`,
    name: `国家地区${i}`,
    phoneCode: `+${String(1 + i)}`,
    status: i % 5 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-01 09:00:00`
  }),
  postalRoute: i => ({
    id: i,
    code: `PR${String(i).padStart(4, '0')}`,
    name: `路由码${i}`,
    country: `国家${i % 5}`,
    status: i % 4 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-02 10:00:00`
  }),
  fbaWarehouse: i => ({
    id: i,
    code: `FBA${String(i).padStart(4, '0')}`,
    name: `FBA仓库${i}`,
    country: `国家${i % 5}`,
    address: `仓储区 ${i} 栋`,
    status: i % 5 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-03 11:00:00`
  }),
  customerLevel: i => ({
    id: i,
    code: `CL${String(i).padStart(4, '0')}`,
    name: `客户等级${i}`,
    discount: Number((1 - i * 0.01).toFixed(2)),
    status: i % 4 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-04 12:00:00`
  }),
  customerSource: i => ({
    id: i,
    code: `CS${String(i).padStart(4, '0')}`,
    name: `客户来源${i}`,
    status: 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-05 13:00:00`
  }),
  account: i => ({
    id: i,
    code: `ACC${String(i).padStart(3, '0')}`,
    name: `结算账户${i}`,
    accountType: i % 2 === 0 ? '银行' : '现金',
    bank: i % 2 === 0 ? `招商银行 ${i}` : '',
    balance: i * 1000,
    status: i % 4 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-05 13:00:00`
  }),
  currency: i => ({
    id: i,
    code: `CUR${String(i).padStart(3, '0')}`,
    name: `币种${i}`,
    rate: 1 + i * 0.1,
    symbol: i % 2 === 0 ? '¥' : '$',
    status: 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-06 14:00:00`
  }),
  'expense-type': i => ({
    id: i,
    code: `ET${String(i).padStart(3, '0')}`,
    name: `费用类型${i}`,
    status: 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-07 15:00:00`
  }),
  settlement: i => ({
    id: i,
    name: `结算方式${i}`,
    period: i % 2 === 0 ? '月结' : '现结',
    status: 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-08 16:00:00`
  }),
  waybill: i => ({
    id: i,
    code: `WB${String(i).padStart(4, '0')}`,
    name: `单号资料${i}`,
    status: i % 5 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-09 17:00:00`
  }),
  address: i => ({
    id: i,
    code: `ADDR${String(i).padStart(4, '0')}`,
    name: `地址簿${i}`,
    status: i % 4 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-10 18:00:00`
  }),
  declaredGoods: i => ({
    id: i,
    code: `DG${String(i).padStart(4, '0')}`,
    name: `申报物品${i}`,
    status: i % 5 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-11 19:00:00`
  }),
  problemCategory: i => ({
    id: i,
    code: `PC${String(i).padStart(4, '0')}`,
    name: `问题类别${i}`,
    status: i % 4 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-12 20:00:00`
  }),
  goodsCategory: i => ({
    id: i,
    code: `GC${String(i).padStart(4, '0')}`,
    name: `物品类别${i}`,
    status: i % 5 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-13 21:00:00`
  }),
  customsType: i => ({
    id: i,
    code: `CT${String(i).padStart(4, '0')}`,
    name: `报关类型${i}`,
    status: i % 4 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-14 22:00:00`
  }),
  exportReason: i => ({
    id: i,
    code: `ER${String(i).padStart(4, '0')}`,
    name: `出口原因${i}`,
    status: i % 5 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-15 23:00:00`
  }),
  clearanceMethod: i => ({
    id: i,
    code: `CM${String(i).padStart(4, '0')}`,
    name: `清关方式${i}`,
    status: i % 4 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-16 10:00:00`
  }),
  salesTerms: i => ({
    id: i,
    code: `ST${String(i).padStart(4, '0')}`,
    name: `销售条款${i}`,
    status: i % 5 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-17 11:00:00`
  })
};

const keys = Object.keys(factories) as Api.DataManage.DataManageArchiveKey[];

const datasets: Record<Api.DataManage.DataManageArchiveKey, MasterDataRow[]> = Object.fromEntries(
  keys.map(key => [key, Array.from({ length: 18 }, (_, k) => factories[key](k + 1))])
) as Record<Api.DataManage.DataManageArchiveKey, MasterDataRow[]>;

const idSeq: Record<Api.DataManage.DataManageArchiveKey, number> = Object.fromEntries(
  keys.map(key => [key, 19])
) as Record<Api.DataManage.DataManageArchiveKey, number>;

/** Simulated network latency so table loading / button loading states stay visible in DEV */
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const LIST_DELAY_MS = 400;
const MUTATE_DELAY_MS = 200;

export async function mockArchiveList<T extends MasterDataRow>(
  archive: Api.DataManage.DataManageArchiveKey,
  params: Api.DataManage.ArchiveSearchParams
): Promise<Api.DataManage.ArchiveList<T>> {
  await delay(LIST_DELAY_MS);
  let rows = datasets[archive] as T[];
  const { keyword, status, current, size } = params;
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    rows = rows.filter(r => {
      const rec = r as unknown as Record<string, unknown>;
      return `${rec.name ?? ''} ${rec.code ?? ''}`.toLowerCase().includes(kw);
    });
  }
  if (status) {
    rows = rows.filter(r => r.status === status);
  }
  const total = rows.length;
  const start = (current - 1) * size;
  return { records: rows.slice(start, start + size), total };
}

export async function mockArchiveCreate<T extends MasterDataRow>(
  archive: Api.DataManage.DataManageArchiveKey,
  params: Partial<T>
): Promise<T> {
  await delay(MUTATE_DELAY_MS);
  const id = idSeq[archive]++;
  const row = { ...(params as object), id } as T;
  datasets[archive].push(row as unknown as MasterDataRow);
  return row;
}

export async function mockArchiveUpdate<T extends MasterDataRow>(
  archive: Api.DataManage.DataManageArchiveKey,
  params: T
): Promise<T> {
  await delay(MUTATE_DELAY_MS);
  const list = datasets[archive];
  const idx = list.findIndex(r => r.id === params.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...(params as object) } as MasterDataRow;
  }
  return list[idx] as unknown as T;
}

export async function mockArchiveDelete(archive: Api.DataManage.DataManageArchiveKey, ids: number[]): Promise<boolean> {
  await delay(MUTATE_DELAY_MS);
  const set = new Set(ids);
  datasets[archive] = datasets[archive].filter(r => !set.has(r.id));
  return true;
}
