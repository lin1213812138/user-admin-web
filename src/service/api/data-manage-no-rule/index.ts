import { request } from '../../request';

/**
 * 单号资料新增三类（子单号规则 / 运单号码池 / 长单号截短），均为 tms-user 真实接口（无 DEV mock）。
 * flat request，调用方需解包 { data, error }。通用分页契约：{ page, size, keyword, where } → { list, total }。
 */

export interface NoRuleQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
  where?: Record<string, unknown>;
}
export interface NoRuleQueryResult<T> {
  list: T[];
  total: number;
}

/** 子单号规则 item-no-rule */
export interface ItemNoRule {
  _id: string;
  name: string;
  prefixType: number;
  middleType?: number;
  suffixType: number;
  suffixPadType: number;
  note?: string;
  status?: 0 | 1;
  createDate?: number;
}
/** 运单号码池 no-pool */
export interface NoPool {
  _id: string;
  no: string;
  refId: string;
  refType: number;
  status?: 0 | 1;
  createDate?: number;
  note?: string;
}
/** 长单号截短 long-no-rule */
export interface LongNoRule {
  _id: string;
  name: string;
  oriLen: number;
  start: number;
  len: number;
  rule?: string;
  note?: string;
  status?: 0 | 1;
  createDate?: number;
}

export function fetchGetItemNoRuleList(params: NoRuleQueryParams) {
  return request<NoRuleQueryResult<ItemNoRule>>({ url: '/item-no-rule/query', method: 'post', data: params });
}
export function fetchCreateItemNoRule(params: Partial<ItemNoRule>) {
  return request<boolean>({ url: '/item-no-rule/create', method: 'post', data: params });
}
export function fetchUpdateItemNoRule(params: Partial<ItemNoRule>) {
  return request<boolean>({ url: '/item-no-rule/update', method: 'post', data: params });
}
export function fetchDeleteItemNoRule(id: string) {
  return request<boolean>({ url: '/item-no-rule/delete', method: 'post', data: { _id: id } });
}

export function fetchGetNoPoolList(params: NoRuleQueryParams) {
  return request<NoRuleQueryResult<NoPool>>({ url: '/no-pool/query', method: 'post', data: params });
}
export function fetchCreateNoPool(params: Partial<NoPool>) {
  return request<boolean>({ url: '/no-pool/create', method: 'post', data: params });
}
export function fetchUpdateNoPool(params: Partial<NoPool>) {
  return request<boolean>({ url: '/no-pool/update', method: 'post', data: params });
}
export function fetchDeleteNoPool(id: string) {
  return request<boolean>({ url: '/no-pool/delete', method: 'post', data: { _id: id } });
}

export function fetchGetLongNoRuleList(params: NoRuleQueryParams) {
  return request<NoRuleQueryResult<LongNoRule>>({ url: '/long-no-rule/query', method: 'post', data: params });
}
export function fetchCreateLongNoRule(params: Partial<LongNoRule>) {
  return request<boolean>({ url: '/long-no-rule/create', method: 'post', data: params });
}
export function fetchUpdateLongNoRule(params: Partial<LongNoRule>) {
  return request<boolean>({ url: '/long-no-rule/update', method: 'post', data: params });
}
export function fetchDeleteLongNoRule(id: string) {
  return request<boolean>({ url: '/long-no-rule/delete', method: 'post', data: { _id: id } });
}
