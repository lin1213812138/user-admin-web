import { request } from '../../request';

/**
 * 单号规则接口（tms-user，路由前缀 /tms/api/v1/web）。
 * 均为 flat request，调用方需解包 { data, error }。
 */

/** 获取单号规则列表（/no-rule/query，返回 ret:{ list, total }；keyword 后端未开放） */
export function fetchGetNoRuleList(params: Api.NoRule.SearchParams) {
  return request<Api.NoRule.List>({
    url: '/no-rule/query',
    method: 'post',
    data: params
  });
}

/** 获取单条规则详情（/no-rule/get） */
export function fetchGetNoRule(_id: string) {
  return request<Api.NoRule.Item>({
    url: '/no-rule/get',
    method: 'post',
    data: { _id }
  });
}

/** 新建规则（/no-rule/create；name 必填唯一，prefix/suffix 后端自动转大写） */
export function fetchCreateNoRule(params: Api.NoRule.SaveParams) {
  return request<Api.NoRule.Item>({
    url: '/no-rule/create',
    method: 'post',
    data: params
  });
}

/** 更新规则（/no-rule/update；buildIn=1 时后端忽略 name，改 current 会同步取号当前值） */
export function fetchUpdateNoRule(params: Api.NoRule.UpdateParams) {
  return request<Api.NoRule.Item>({
    url: '/no-rule/update',
    method: 'post',
    data: params
  });
}

/** 删除规则（/no-rule/delete；后端仅支持单条 _id，sysType 有值的记录会报错不可删） */
export function fetchDeleteNoRule(_id: string) {
  return request<boolean>({
    url: '/no-rule/delete',
    method: 'post',
    data: { _id }
  });
}
