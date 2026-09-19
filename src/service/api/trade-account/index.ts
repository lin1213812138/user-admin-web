import { request } from '../../request';

// 真实接口（tms-user /tms/api/v1/web/trade-account/*），flat 请求需调用方解包 { data, error }

/**
 * 银行账户列表（真实接口 /trade-account/query）
 *
 * 后端契约要点（lib/api-v1-web/trade-account + common/services/common.js）：
 * 1. `scene` 必须传：`if (!scene) where.status = 1`，不传只能查到「使用中」记录，管理页看不到停用项；
 * 2. 分页字段是 `page`（queryCommon 读 page，不认识 current），此处显式映射；响应结构 `{ list, total }`；
 * 3. keyword 后端 keywordFields 固定 ['alias','name']，无需前端传。
 */
export function fetchGetTradeAccountList(params: Api.DataManage.FinanceTradeAccountSearchParams) {
  const { current, size, keyword, status } = params;
  const where: Record<string, unknown> = {};
  if (status !== undefined && status !== null) where.status = status;

  return request<Api.DataManage.FinanceTradeAccountList>({
    url: '/trade-account/query',
    method: 'post',
    data: {
      page: current,
      size,
      keyword: keyword?.trim() || undefined,
      scene: 1,
      where
    }
  });
}

/** 银行账户详情（真实接口 /trade-account/get） */
export function fetchGetTradeAccount(params: { _id: string }) {
  return request<Api.DataManage.FinanceTradeAccount>({
    url: '/trade-account/get',
    method: 'post',
    data: params
  });
}

/**
 * 新增银行账户（真实接口 /trade-account/create，后端校验 alias 必填且唯一、bank 必填）
 */
export function fetchCreateTradeAccount(params: Api.DataManage.FinanceTradeAccountSaveParams) {
  return request<null>({
    url: '/trade-account/create',
    method: 'post',
    data: params
  });
}

/**
 * 修改银行账户（真实接口 /trade-account/update，需 _id）
 *
 * 注意：走 updateCommon 的 uniqField:'alias' 校验，局部更新（如列表停用/启用）必须随行回传
 * alias，否则缺失的 alias 会参与唯一性判断并写入 aliasUpdate 脏字段；
 * 内置项（buildIn=1）后端无白名单拦截，前端仅限制停用、编辑放开。
 */
export function fetchUpdateTradeAccount(
  params: Partial<Api.DataManage.FinanceTradeAccountSaveParams> & { _id: string }
) {
  return request<null>({
    url: '/trade-account/update',
    method: 'post',
    data: params
  });
}

/** 批量停用（真实接口 /trade-account/disable，body `{ ids }`，后端统一置 status=0；内置项不可停用，调用方需先过滤） */
export function fetchDisableTradeAccount(ids: string[]) {
  return request<null>({
    url: '/trade-account/disable',
    method: 'post',
    data: { ids }
  });
}
