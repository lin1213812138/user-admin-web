import { request } from '../../request';

/**
 * 路由码类别接口（tms-user，/route-group/query）。flat request，调用方需解包 { data, error }。
 * 收货渠道表单的「关联路由码」下拉使用本列表。
 */

export interface RouteGroupOption {
  _id: string;
  name: string;
  code?: string;
}

/** 路由码类别列表（/route-group/query） */
export function fetchGetRouteGroupList(params: { page: number; size: number; keyword?: string }) {
  return request<{ list: RouteGroupOption[]; total: number }>({
    url: '/route-group/query',
    method: 'post',
    data: { page: params.page, size: params.size, keyword: params.keyword, where: {} }
  });
}
