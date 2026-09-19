import { request } from '../../request';

/**
 * Currency (结算货币) real API — tms-user /tms/api/v1/web/currency/*
 * Flat request: callers must destructure { data, error }.
 */

/**
 * 列表：管理页恒定传 scene:1，否则后端 `if (!scene) where.status = 1` 只会返回启用项，
 * 停用项无法在管理页查询到。current 需映射为后端 queryCommon 读取的 page。
 */
export function fetchGetCurrencyList(params: Api.DataManage.FinanceCurrencySearchParams) {
  const { current, size, keyword, status } = params;
  const where: Record<string, unknown> = {};
  if (status !== undefined && status !== null) {
    where.status = status;
  }
  return request<Api.DataManage.FinanceCurrencyList>({
    url: '/currency/query',
    method: 'post',
    data: {
      page: current,
      size,
      keyword: keyword?.trim() || undefined,
      keywordFields: ['name', 'code'],
      scene: 1,
      where
    }
  });
}

export function fetchCreateCurrency(params: Api.DataManage.FinanceCurrencySaveParams) {
  return request<null>({ url: '/currency/create', method: 'post', data: params });
}

/** 编辑：code 唯一（uniqField:'code'），须随行回传 _id + code 避免写脏字段 */
export function fetchUpdateCurrency(params: Api.DataManage.FinanceCurrencySaveParams & { _id: string }) {
  return request<null>({ url: '/currency/update', method: 'post', data: params });
}

/** 批量停用：置 status=0（无 delete 路由，操作列不提供删除） */
export function fetchDisableCurrency(ids: string[]) {
  return request<null>({ url: '/currency/disable', method: 'post', data: { ids } });
}
