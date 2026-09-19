import { request } from '../../request';

/**
 * 业务资料(business) + 财务资料(finance) 档案的独立接口
 * （费用类型 → service/api/fee-type、结算方式 → service/api/bill-mode 均已改走真实接口）。
 *
 * - 后端 api-v1-web 已存在路由的 7 个（currency / sales-terms / export-reason / customs-type /
 *   problem-category / goods-category / clearance-method(=customs-clear)）走真实 request，调用方需解包
 *   { data, error }（与 basic/bl/ship/no-rule 一致）；list 均显式 current→page 映射且 status 拼 where。
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
  }
};
