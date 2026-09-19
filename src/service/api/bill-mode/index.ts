import { request } from '../../request';

// 真实接口（tms-user /tms/api/v1/web/bill-mode/*），flat 请求需调用方解包 { data, error }
// 注意：字典用的 fetchGetBillModeList（service/api/customer，只取启用项）是另一支；本文件是管理页专用的分页/CRUD。

/**
 * 结算方式列表（真实接口 /bill-mode/query）
 *
 * 与费用类型同样的两个契约要点（lib/services/bill-mode.js）：
 * 1. `scene` 必须传：`if (!scene) where.status = 1`，不传只能查到「使用中」的记录；
 * 2. 分页字段是 `page`（queryCommon 读 page），后端固定 `sort: { order: 1 }`、`keywordFields: ['name']`，
 *    响应结构 `{ list, total }`。
 */
export function fetchGetBillModePageList(params: Api.SystemManage.BillModeSearchParams) {
  const { current, size, keyword, status } = params;
  const where: Record<string, unknown> = {};
  if (status !== undefined && status !== null) where.status = status;

  return request<Api.SystemManage.BillModeList>({
    url: '/bill-mode/query',
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

/** 新增结算方式（真实接口 /bill-mode/create，后端校验 name 且 name 唯一） */
export function fetchCreateBillMode(params: Api.SystemManage.BillModeSaveParams) {
  return request<null>({
    url: '/bill-mode/create',
    method: 'post',
    data: params
  });
}

/**
 * 修改结算方式（真实接口 /bill-mode/update，需 _id）
 *
 * 注意：走 updateCommon 的 uniqField:'name' 校验，局部更新（如列表停用/启用）必须随行回传 name，
 * 否则缺失的 name 会参与唯一性判断并写入 nameUpdate 脏字段；
 * 内置项（buildIn=1）后端只 pick `note/status`，其余字段会被静默丢弃，调用方需自行收敛提交字段。
 */
export function fetchUpdateBillMode(params: Partial<Api.SystemManage.BillModeSaveParams> & { _id: string }) {
  return request<null>({
    url: '/bill-mode/update',
    method: 'post',
    data: params
  });
}

/** 批量停用（真实接口 /bill-mode/disable，body `{ ids }`；后端自身会过滤掉 buildIn=1 的行） */
export function fetchDisableBillMode(ids: string[]) {
  return request<null>({
    url: '/bill-mode/disable',
    method: 'post',
    data: { ids }
  });
}
