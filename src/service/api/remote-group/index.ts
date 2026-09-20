import { request } from '../../request';

/**
 * 偏远类别接口（tms-user，/remote-group/query）。flat request，调用方需解包 { data, error }。
 * 收货渠道表单的「关联偏远」下拉使用本列表。
 */

export interface RemoteGroupOption {
  _id: string;
  name: string;
  code?: string;
}

/** 偏远类别列表（/remote-group/query） */
export function fetchGetRemoteGroupList(params: { page: number; size: number; keyword?: string }) {
  return request<{ list: RemoteGroupOption[]; total: number }>({
    url: '/remote-group/query',
    method: 'post',
    data: { page: params.page, size: params.size, keyword: params.keyword, where: {} }
  });
}
