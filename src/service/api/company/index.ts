import { request } from '../../request';

/** get company info（真实接口 /company/get，无参，返回整份 Company 文档） */
export function fetchGetCompany() {
  return request<Api.Company.Info>({
    url: '/company/get',
    method: 'post',
    data: {}
  });
}

/** save company info（真实接口 /company/save；后端必填 name/sysName/address/web/logoUrl） */
export function fetchSaveCompany(params: Api.Company.SaveParams) {
  return request<boolean>({
    url: '/company/save',
    method: 'post',
    data: params
  });
}
