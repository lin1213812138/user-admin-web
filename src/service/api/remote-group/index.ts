import { request } from '../../request';

/**
 * 偏远类别接口（tms-user，/remote-group/*）。flat request，调用方需解包 { data, error }。
 * - `fetchGetRemoteGroupList`：下拉与「偏远数据」页主表共用（收货渠道表单、发货渠道同步抽屉亦在用）
 * - create / delete：后端为通用档案实现（create 走 uniqField='name'，重名返回 101401）
 */

export interface RemoteGroupOption {
  _id: string;
  name: string;
  code?: string;
}

export interface RemoteGroupQueryParams {
  page: number;
  size: number;
  keyword?: string;
  /** 附加过滤（如 `{ _id: [id1, id2] }`：后端 formatWhere 会把数组转成 $in） */
  where?: Record<string, unknown>;
}

/** 偏远类别列表（/remote-group/query） */
export function fetchGetRemoteGroupList(params: RemoteGroupQueryParams) {
  return request<{ list: Api.DataManage.BasicRemoteGroup[]; total: number }>({
    url: '/remote-group/query',
    method: 'post',
    data: { page: params.page, size: params.size, keyword: params.keyword, where: params.where ?? {} }
  });
}

/** 新增偏远类别（/remote-group/create），仅名称（重名返回 101401） */
export function fetchCreateRemoteGroup(params: { name: string }) {
  return request<unknown>({
    url: '/remote-group/create',
    method: 'post',
    data: { name: params.name }
  });
}

/** 删除偏远类别（/remote-group/delete，批量） */
export function fetchDeleteRemoteGroup(ids: string[]) {
  return request<unknown>({
    url: '/remote-group/delete',
    method: 'post',
    data: { ids }
  });
}
