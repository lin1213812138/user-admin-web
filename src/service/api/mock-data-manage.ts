import type { MasterDataRow } from '@/components/MasterData/types';

type RowFactory = (i: number) => MasterDataRow;

const factories: Record<Api.DataManage.DataManageArchiveKey, RowFactory> = {
  customer: i => ({
    id: i,
    code: `C${String(i).padStart(4, '0')}`,
    name: `客户${i}`,
    contact: `联系人${i}`,
    phone: `138${String(10000000 + i).padStart(8, '0')}`,
    address: `上海市浦东新区世纪大道 ${i} 号`,
    status: i % 5 === 0 ? '2' : '1',
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-01 09:00:00`
  }),
  supplier: i => ({
    id: i,
    code: `S${String(i).padStart(4, '0')}`,
    name: `供应商${i}`,
    contact: `对接人${i}`,
    phone: `139${String(10000000 + i).padStart(8, '0')}`,
    level: i % 3 === 0 ? 'A' : 'B',
    status: i % 4 === 0 ? '2' : '1',
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-02 10:00:00`
  }),
  goods: i => ({
    id: i,
    code: `G${String(i).padStart(4, '0')}`,
    name: `商品${i}`,
    spec: `规格${i}`,
    unit: i % 2 === 0 ? '件' : '箱',
    categoryName: `分类${i % 5}`,
    status: i % 6 === 0 ? '2' : '1',
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-03 11:00:00`
  }),
  category: i => ({
    id: i,
    code: `CAT${String(i).padStart(3, '0')}`,
    name: `商品分类${i}`,
    sort: i,
    status: '1',
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-04 12:00:00`
  }),
  account: i => ({
    id: i,
    code: `ACC${String(i).padStart(3, '0')}`,
    name: `结算账户${i}`,
    accountType: i % 2 === 0 ? '银行' : '现金',
    bank: i % 2 === 0 ? `招商银行 ${i}` : '',
    balance: i * 1000,
    status: i % 4 === 0 ? '2' : '1',
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-05 13:00:00`
  }),
  currency: i => ({
    id: i,
    code: `CUR${String(i).padStart(3, '0')}`,
    name: `币种${i}`,
    rate: 1 + i * 0.1,
    symbol: i % 2 === 0 ? '¥' : '$',
    status: '1',
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-06 14:00:00`
  }),
  tax: i => ({
    id: i,
    name: `税率方案${i}`,
    rate: 0.13,
    taxType: i % 2 === 0 ? '增值税' : '附加税',
    status: '1',
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-07 15:00:00`
  }),
  settlement: i => ({
    id: i,
    name: `结算方式${i}`,
    period: i % 2 === 0 ? '月结' : '现结',
    status: '1',
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-08 16:00:00`
  }),
  warehouse: i => ({
    id: i,
    code: `W${String(i).padStart(3, '0')}`,
    name: `仓库${i}`,
    address: `仓储区 ${i} 栋`,
    manager: `仓管${i}`,
    status: i % 5 === 0 ? '2' : '1',
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-09 17:00:00`
  }),
  location: i => ({
    id: i,
    code: `L${String(i).padStart(4, '0')}`,
    name: `库位${i}`,
    warehouseName: `仓库${i % 3}`,
    capacity: i * 100,
    status: i % 4 === 0 ? '2' : '1',
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-10 18:00:00`
  }),
  carrier: i => ({
    id: i,
    code: `CAR${String(i).padStart(3, '0')}`,
    name: `承运商${i}`,
    contact: `调度${i}`,
    phone: `137${String(10000000 + i).padStart(8, '0')}`,
    status: i % 5 === 0 ? '2' : '1',
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-11 19:00:00`
  }),
  store: i => ({
    id: i,
    code: `ST${String(i).padStart(3, '0')}`,
    name: `门店${i}`,
    address: `商圈 ${i} 号`,
    owner: `店长${i}`,
    status: i % 4 === 0 ? '2' : '1',
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-12 20:00:00`
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
