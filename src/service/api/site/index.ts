import { request } from '../../request';

/** get site list（真实接口 /site/query，返回 ret:{ list, total }，flat 请求需调用方解包 { data, error }） */
export function fetchGetSiteList(params: Api.SystemManage.SiteSearchParams) {
  return request<Api.SystemManage.SiteList>({
    url: '/site/query',
    method: 'post',
    data: params
  });
}

/** get site detail by id（真实接口 /site/get） */
export function fetchGetSite(id: string) {
  return request<Api.SystemManage.Site>({
    url: '/site/get',
    method: 'post',
    data: { _id: id }
  });
}

/** create site（真实接口 /site/create） */
export function fetchCreateSite(params: Api.SystemManage.SiteCreateParams) {
  return request<Api.SystemManage.Site>({
    url: '/site/create',
    method: 'post',
    data: params
  });
}

/** update site（真实接口 /site/update） */
export function fetchUpdateSite(params: Api.SystemManage.SiteUpdateParams) {
  return request<Api.SystemManage.Site>({
    url: '/site/update',
    method: 'post',
    data: params
  });
}

/** delete site by ids（真实接口 /site/delete，_id 字符串数组） */
export function fetchDeleteSite(ids: string[]) {
  return request<boolean>({
    url: '/site/delete',
    method: 'post',
    data: { ids }
  });
}

/** get site relation users（真实接口 /user/query，where.siteId 精确过滤，flat 请求需调用方解包 { data, error }） */
export function fetchGetSiteUserList(params: { page: number; size: number; siteId: string }) {
  return request<Api.SystemManage.UserList>({
    url: '/user/query',
    method: 'post',
    data: { page: params.page, size: params.size, where: { siteId: params.siteId } }
  });
}

/** get site relation customers（真实接口 /customer/query，tms-user queryCommon 分页，where.siteId 精确过滤） */
export function fetchGetSiteCustomerList(params: { page: number; size: number; siteId: string }) {
  return request<Api.SystemManage.SiteCustomerList>({
    url: '/customer/query',
    method: 'post',
    data: { page: params.page, size: params.size, where: { siteId: params.siteId } }
  });
}
