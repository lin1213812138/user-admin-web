import { request } from '../../request';

// 真实接口（tms-user /tms/api/v1/web/fee-type/*），flat 请求需调用方解包 { data, error }

/**
 * 费用类型列表（真实接口 /fee-type/query）
 *
 * 两个后端契约要点（lib/services/fee-type.js + common/services/common.js）：
 * 1. `scene` 必须传：`if (!scene) where.status = 1`，不传只能查到「使用中」的记录，管理页看不到停用项；
 * 2. 分页字段是 `page`（queryCommon 读 page，不认识 current），此处显式映射；响应结构 `{ list, total }`。
 */
export function fetchGetFeeTypeList(params: Api.DataManage.FinanceExpenseTypeSearchParams) {
  const { current, size, keyword, status, scope } = params;
  const where: Record<string, unknown> = {};
  if (status !== undefined && status !== null) where.status = status;
  if (scope !== undefined && scope !== null) where.scope = scope;

  return request<Api.DataManage.FinanceExpenseTypeList>({
    url: '/fee-type/query',
    method: 'post',
    data: {
      page: current,
      size,
      keyword: keyword?.trim() || undefined,
      keywordFields: ['name'],
      scene: 1,
      where
    }
  });
}

/** 新增费用类型（真实接口 /fee-type/create，后端校验 name 且 name 唯一） */
export function fetchCreateFeeType(params: Api.DataManage.FinanceExpenseTypeSaveParams) {
  return request<null>({
    url: '/fee-type/create',
    method: 'post',
    data: params
  });
}

/**
 * 修改费用类型（真实接口 /fee-type/update，需 _id）
 *
 * 注意：走 updateCommon 的 uniqField:'name' 校验，局部更新（如列表停用/启用）必须随行回传
 * name，否则缺失的 name 会参与唯一性判断并写入 nameUpdate 脏字段；
 * 内置项（buildIn=1）后端只 pick `scope/order/note`，其余字段会被静默丢弃，调用方需只提交这三个。
 */
export function fetchUpdateFeeType(params: Partial<Api.DataManage.FinanceExpenseTypeSaveParams> & { _id: string }) {
  return request<null>({
    url: '/fee-type/update',
    method: 'post',
    data: params
  });
}

/** 批量停用（真实接口 /fee-type/disable，body `{ ids }`，后端统一置 status=0；内置项不可停用，调用方需先过滤） */
export function fetchDisableFeeType(ids: string[]) {
  return request<null>({
    url: '/fee-type/disable',
    method: 'post',
    data: { ids }
  });
}
