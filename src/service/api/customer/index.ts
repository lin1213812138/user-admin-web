import { request } from '../../request';
import { mockCreateCustomer, mockCustomerList, mockDeleteCustomer, mockUpdateCustomer } from '../mock';

/** get customer list */
export function fetchGetCustomerList(params: Api.SystemManage.CustomerSearchParams) {
  if (import.meta.env.DEV) {
    return mockCustomerList(params) as unknown as Promise<Api.SystemManage.CustomerList>;
  }

  return request<Api.SystemManage.CustomerList>({
    url: '/system/customer/list',
    method: 'post',
    data: params
  });
}

/** create customer */
export function fetchCreateCustomer(params: Api.SystemManage.CustomerCreateParams) {
  if (import.meta.env.DEV) {
    return mockCreateCustomer(params) as unknown as Promise<Api.SystemManage.Customer>;
  }

  return request<Api.SystemManage.Customer>({
    url: '/system/customer/create',
    method: 'post',
    data: params
  });
}

/** update customer */
export function fetchUpdateCustomer(params: Api.SystemManage.CustomerUpdateParams) {
  if (import.meta.env.DEV) {
    return mockUpdateCustomer(params) as unknown as Promise<Api.SystemManage.Customer>;
  }

  return request<Api.SystemManage.Customer>({
    url: '/system/customer/update',
    method: 'post',
    data: params
  });
}

/** delete customer by ids */
export function fetchDeleteCustomer(ids: number[]) {
  if (import.meta.env.DEV) {
    return mockDeleteCustomer(ids) as unknown as Promise<boolean>;
  }

  return request<boolean>({
    url: '/system/customer/delete',
    method: 'post',
    data: { ids }
  });
}
