import { request } from '../../request';

/**
 * 业务资料(business) + 财务资料(finance) 档案的独立接口
 * （费用类型 → service/api/fee-type、结算方式 → service/api/bill-mode 均已改走真实接口）。
 *
 * - 后端 api-v1-web 已存在路由的 7 个（currency / sales-terms / export-reason / customs-type /
 *   problem-category / goods-category / clearance-method(=customs-clear)）走真实 request，调用方需解包
 *   { data, error }（与 basic/bl/ship/no-rule 一致）；list 均显式 current→page 映射且 status 拼 where。
 * - 后端暂未实现的 2 个（account / declared-goods）暂走本地 mock 兜底，返回结构与真实接口一致
 *   （{ list, total } + _id），将来后端补好路由后只需把对应函数体从 mock 改为 request 即可，零成本切换。
 *
 * 通用分页契约：{ current, size, keyword, status } → { list, total }；
 * create 收 body（update 必带 _id）；delete 收 { ids: string[] }（_id 数组）。
 * 注意：后端 queryCommon 读 `page`（无 current→page 转换），真实接口的 list 函数需显式把 current 映射为 page。
 */

export interface ArchiveApiGroup {
  list: (
    params: Api.DataManage.ArchiveSearchParams
  ) => Promise<{ data: Api.DataManage.ArchiveList<Api.DataManage.MasterDataRow> | null; error: unknown }>;
  create: (params: Partial<Api.DataManage.MasterDataRow>) => Promise<{ data: unknown; error: unknown }>;
  update: (params: Api.DataManage.MasterDataRow) => Promise<{ data: unknown; error: unknown }>;
  remove: (ids: string[]) => Promise<{ data: unknown; error: unknown }>;
}

// ---------------------------------------------------------------------------
// 真实接口（后端 api-v1-web 已存在路由）
// ---------------------------------------------------------------------------

/** 币种 /currency */
export function fetchGetCurrencyList(params: Api.DataManage.ArchiveSearchParams) {
  return request<Api.DataManage.ArchiveList<Api.DataManage.FinanceCurrency>>({
    url: '/currency/query',
    method: 'post',
    data: params
  }) as Promise<{
    data: Api.DataManage.ArchiveList<Api.DataManage.MasterDataRow> | null;
    error: unknown;
  }>;
}
export function fetchCreateCurrency(params: Partial<Api.DataManage.FinanceCurrency>) {
  return request<unknown>({ url: '/currency/create', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchUpdateCurrency(params: Partial<Api.DataManage.FinanceCurrency>) {
  return request<unknown>({ url: '/currency/update', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchDeleteCurrency(ids: string[]) {
  return request<unknown>({ url: '/currency/delete', method: 'post', data: { ids } }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}

/** 销售条款 /sales-terms（后端 keywordFields 固定 ['name']，status 需放进 where） */
export function fetchGetSalesTermsList(params: Api.DataManage.ArchiveSearchParams) {
  return request<Api.DataManage.ArchiveList<Api.DataManage.BusinessSalesTerms>>({
    url: '/sales-terms/query',
    method: 'post',
    data: {
      page: params.current,
      size: params.size,
      keyword: params.keyword,
      where: params.status != null ? { status: params.status } : undefined
    }
  }) as Promise<{
    data: Api.DataManage.ArchiveList<Api.DataManage.MasterDataRow> | null;
    error: unknown;
  }>;
}
export function fetchCreateSalesTerms(params: Partial<Api.DataManage.BusinessSalesTerms>) {
  return request<unknown>({ url: '/sales-terms/create', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchUpdateSalesTerms(params: Partial<Api.DataManage.BusinessSalesTerms>) {
  return request<unknown>({ url: '/sales-terms/update', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchDeleteSalesTerms(ids: string[]) {
  return request<unknown>({ url: '/sales-terms/delete', method: 'post', data: { ids } }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}

/** 出口原因 /export-reason（后端 keywordFields 固定 ['name']，status 需放进 where） */
export function fetchGetExportReasonList(params: Api.DataManage.ArchiveSearchParams) {
  return request<Api.DataManage.ArchiveList<Api.DataManage.BusinessExportReason>>({
    url: '/export-reason/query',
    method: 'post',
    data: {
      page: params.current,
      size: params.size,
      keyword: params.keyword,
      where: params.status != null ? { status: params.status } : undefined
    }
  }) as Promise<{
    data: Api.DataManage.ArchiveList<Api.DataManage.MasterDataRow> | null;
    error: unknown;
  }>;
}
export function fetchCreateExportReason(params: Partial<Api.DataManage.BusinessExportReason>) {
  return request<unknown>({ url: '/export-reason/create', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchUpdateExportReason(params: Partial<Api.DataManage.BusinessExportReason>) {
  return request<unknown>({ url: '/export-reason/update', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchDeleteExportReason(ids: string[]) {
  return request<unknown>({ url: '/export-reason/delete', method: 'post', data: { ids } }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}

/** 报关类型 /customs-type（后端 keywordFields 固定 ['name']，status 需放进 where） */
export function fetchGetCustomsTypeList(params: Api.DataManage.ArchiveSearchParams) {
  return request<Api.DataManage.ArchiveList<Api.DataManage.BusinessCustomsType>>({
    url: '/customs-type/query',
    method: 'post',
    data: {
      page: params.current,
      size: params.size,
      keyword: params.keyword,
      where: params.status != null ? { status: params.status } : undefined
    }
  }) as Promise<{
    data: Api.DataManage.ArchiveList<Api.DataManage.MasterDataRow> | null;
    error: unknown;
  }>;
}
export function fetchCreateCustomsType(params: Partial<Api.DataManage.BusinessCustomsType>) {
  return request<unknown>({ url: '/customs-type/create', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchUpdateCustomsType(params: Partial<Api.DataManage.BusinessCustomsType>) {
  return request<unknown>({ url: '/customs-type/update', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchDeleteCustomsType(ids: string[]) {
  return request<unknown>({ url: '/customs-type/delete', method: 'post', data: { ids } }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}

/** 问题类别 /problem-group（后端 keywordFields 固定 ['name']，status 需放进 where） */
export function fetchGetProblemGroupList(params: Api.DataManage.ArchiveSearchParams) {
  return request<Api.DataManage.ArchiveList<Api.DataManage.BusinessProblemCategory>>({
    url: '/problem-group/query',
    method: 'post',
    data: {
      page: params.current,
      size: params.size,
      keyword: params.keyword,
      where: params.status != null ? { status: params.status } : undefined
    }
  }) as Promise<{
    data: Api.DataManage.ArchiveList<Api.DataManage.BusinessProblemCategory> | null;
    error: unknown;
  }>;
}
export function fetchCreateProblemGroup(params: Partial<Api.DataManage.BusinessProblemCategory>) {
  return request<unknown>({ url: '/problem-group/create', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchUpdateProblemGroup(params: Partial<Api.DataManage.BusinessProblemCategory>) {
  return request<unknown>({ url: '/problem-group/update', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchDeleteProblemGroup(ids: string[]) {
  return request<unknown>({ url: '/problem-group/delete', method: 'post', data: { ids } }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}

/** 物品类别 /product-group（后端 keywordFields 固定 ['name']，status 需放进 where；isDefault 由后端自动清他项） */
export function fetchGetProductGroupList(params: Api.DataManage.ArchiveSearchParams) {
  return request<Api.DataManage.ArchiveList<Api.DataManage.BusinessGoodsCategory>>({
    url: '/product-group/query',
    method: 'post',
    data: {
      page: params.current,
      size: params.size,
      keyword: params.keyword,
      where: params.status != null ? { status: params.status } : undefined
    }
  }) as Promise<{
    data: Api.DataManage.ArchiveList<Api.DataManage.BusinessGoodsCategory> | null;
    error: unknown;
  }>;
}
export function fetchCreateProductGroup(params: Partial<Api.DataManage.BusinessGoodsCategory>) {
  return request<unknown>({ url: '/product-group/create', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchUpdateProductGroup(params: Partial<Api.DataManage.BusinessGoodsCategory>) {
  return request<unknown>({ url: '/product-group/update', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchDeleteProductGroup(ids: string[]) {
  return request<unknown>({ url: '/product-group/delete', method: 'post', data: { ids } }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}

/** 清关方式 /customs-clear（后端 keywordFields 固定 ['name']，status 需放进 where） */
export function fetchGetCustomsClearList(params: Api.DataManage.ArchiveSearchParams) {
  return request<Api.DataManage.ArchiveList<Api.DataManage.BusinessClearanceMethod>>({
    url: '/customs-clear/query',
    method: 'post',
    data: {
      page: params.current,
      size: params.size,
      keyword: params.keyword,
      where: params.status != null ? { status: params.status } : undefined
    }
  }) as Promise<{
    data: Api.DataManage.ArchiveList<Api.DataManage.BusinessClearanceMethod> | null;
    error: unknown;
  }>;
}
export function fetchCreateCustomsClear(params: Partial<Api.DataManage.BusinessClearanceMethod>) {
  return request<unknown>({ url: '/customs-clear/create', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchUpdateCustomsClear(params: Partial<Api.DataManage.BusinessClearanceMethod>) {
  return request<unknown>({ url: '/customs-clear/update', method: 'post', data: params }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}
export function fetchDeleteCustomsClear(ids: string[]) {
  return request<unknown>({ url: '/customs-clear/delete', method: 'post', data: { ids } }) as Promise<{
    data: unknown;
    error: unknown;
  }>;
}

// ---------------------------------------------------------------------------
// 本地 mock 兜底（后端暂未实现路由的 5 个档案）
// ---------------------------------------------------------------------------

type RowFactory = (i: number) => Api.DataManage.MasterDataRow;

const factories: Partial<Record<Api.DataManage.DataManageArchiveKey, RowFactory>> = {
  account: i =>
    ({
      _id: `ACC${i}`,
      code: `ACC${String(i).padStart(3, '0')}`,
      name: `结算账户${i}`,
      accountType: i % 2 === 0 ? '银行' : '现金',
      bank: i % 2 === 0 ? `招商银行 ${i}` : '',
      balance: i * 1000,
      status: i % 4 === 0 ? 0 : 1,
      remark: '',
      createTime: `2026-0${(i % 9) + 1}-05 13:00:00`
    }) as unknown as Api.DataManage.MasterDataRow,
  declaredGoods: i =>
    ({
      _id: `DG${i}`,
      code: `DG${String(i).padStart(4, '0')}`,
      name: `申报物品${i}`,
      status: i % 5 === 0 ? 0 : 1,
      remark: '',
      createTime: `2026-0${(i % 9) + 1}-11 19:00:00`
    }) as unknown as Api.DataManage.MasterDataRow
};

const mockKeys = Object.keys(factories) as Api.DataManage.DataManageArchiveKey[];

const datasets: Partial<Record<Api.DataManage.DataManageArchiveKey, Api.DataManage.MasterDataRow[]>> =
  Object.fromEntries(
    mockKeys.map(key => [key, Array.from({ length: 18 }, (_, k) => factories[key]!(k + 1))])
  ) as Partial<Record<Api.DataManage.DataManageArchiveKey, Api.DataManage.MasterDataRow[]>>;

const idSeq: Record<string, number> = {};
mockKeys.forEach(key => {
  idSeq[key] = 19;
});

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const LIST_DELAY_MS = 400;
const MUTATE_DELAY_MS = 200;

async function mockList(archive: Api.DataManage.DataManageArchiveKey, params: Api.DataManage.ArchiveSearchParams) {
  await delay(LIST_DELAY_MS);
  let rows = datasets[archive] ?? [];
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
  return { data: { list: rows.slice(start, start + size), total }, error: null };
}
async function mockCreate(archive: Api.DataManage.DataManageArchiveKey, params: Partial<Api.DataManage.MasterDataRow>) {
  await delay(MUTATE_DELAY_MS);
  const id = `${archive}-${idSeq[archive]++}`;
  const row = { ...(params as object), _id: id } as Api.DataManage.MasterDataRow;
  (datasets[archive] ??= []).push(row);
  return { data: row, error: null };
}
async function mockUpdate(archive: Api.DataManage.DataManageArchiveKey, params: Api.DataManage.MasterDataRow) {
  await delay(MUTATE_DELAY_MS);
  const list = datasets[archive] ?? [];
  const idx = list.findIndex(r => r._id === params._id);
  if (idx >= 0) list[idx] = { ...list[idx], ...(params as object) } as Api.DataManage.MasterDataRow;
  return { data: list[idx], error: null };
}
async function mockDelete(archive: Api.DataManage.DataManageArchiveKey, ids: string[]) {
  await delay(MUTATE_DELAY_MS);
  const set = new Set(ids);
  datasets[archive] = (datasets[archive] ?? []).filter(r => !set.has(r._id));
  return { data: true, error: null };
}

// ---------------------------------------------------------------------------
// archive → fetch 函数组映射表（供共享 MasterDataArchive 组件按 archive 分流）
// ---------------------------------------------------------------------------

export const archiveApiMap: Partial<Record<Api.DataManage.DataManageArchiveKey, ArchiveApiGroup>> = {
  // business
  salesTerms: {
    list: fetchGetSalesTermsList,
    create: fetchCreateSalesTerms,
    update: fetchUpdateSalesTerms,
    remove: fetchDeleteSalesTerms
  },
  customsType: {
    list: fetchGetCustomsTypeList,
    create: fetchCreateCustomsType,
    update: fetchUpdateCustomsType,
    remove: fetchDeleteCustomsType
  },
  exportReason: {
    list: fetchGetExportReasonList,
    create: fetchCreateExportReason,
    update: fetchUpdateExportReason,
    remove: fetchDeleteExportReason
  },
  problemCategory: {
    list: fetchGetProblemGroupList,
    create: fetchCreateProblemGroup,
    update: fetchUpdateProblemGroup,
    remove: fetchDeleteProblemGroup
  },
  goodsCategory: {
    list: fetchGetProductGroupList,
    create: fetchCreateProductGroup,
    update: fetchUpdateProductGroup,
    remove: fetchDeleteProductGroup
  },
  clearanceMethod: {
    list: fetchGetCustomsClearList,
    create: fetchCreateCustomsClear,
    update: fetchUpdateCustomsClear,
    remove: fetchDeleteCustomsClear
  },
  declaredGoods: {
    list: (p: Api.DataManage.ArchiveSearchParams) => mockList('declaredGoods', p),
    create: (p: Partial<Api.DataManage.MasterDataRow>) => mockCreate('declaredGoods', p),
    update: (p: Api.DataManage.MasterDataRow) => mockUpdate('declaredGoods', p),
    remove: (ids: string[]) => mockDelete('declaredGoods', ids)
  },
  // finance
  currency: {
    list: fetchGetCurrencyList,
    create: fetchCreateCurrency,
    update: fetchUpdateCurrency,
    remove: fetchDeleteCurrency
  },
  account: {
    list: (p: Api.DataManage.ArchiveSearchParams) => mockList('account', p),
    create: (p: Partial<Api.DataManage.MasterDataRow>) => mockCreate('account', p),
    update: (p: Api.DataManage.MasterDataRow) => mockUpdate('account', p),
    remove: (ids: string[]) => mockDelete('account', ids)
  }
};
