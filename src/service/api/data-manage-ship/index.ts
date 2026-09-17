import { request } from '../../request';

/**
 * 发货资料接口（服务商 / 渠道类别 / 计泡规则 / 承运网络），全部为 tms-user 真实接口（无 DEV mock）。
 * 均为 flat request，调用方需解包 { data, error }。
 * 通用分页契约：{ page, size, keyword, where } → { list, total }；create/update 返回空对象；delete 仅单条 _id。
 */

// ---- 服务商 /provider ----

/** 服务商列表（keyword 只搜名称；where.providerType 0-发货 1-派送 2-提单，where.status 0-暂停 1-正常） */
export function fetchGetProviderList(params: Api.DataManageShip.ShipQueryParams) {
  return request<Api.DataManageShip.ShipQueryResult<Api.DataManageShip.Provider>>({
    url: '/provider/query',
    method: 'post',
    data: params
  });
}

/** 新建服务商（name/code 后端唯一校验） */
export function fetchCreateProvider(params: Partial<Api.DataManageShip.Provider>) {
  return request<boolean>({ url: '/provider/create', method: 'post', data: params });
}

/** 更新服务商（必填 _id） */
export function fetchUpdateProvider(params: Partial<Api.DataManageShip.Provider>) {
  return request<boolean>({ url: '/provider/update', method: 'post', data: params });
}

/** 删除服务商（后端连带删除其 API 配置与发货渠道） */
export function fetchDeleteProvider(id: string) {
  return request<boolean>({ url: '/provider/delete', method: 'post', data: { _id: id } });
}

// ---- 渠道类别 /channel-group ----

export function fetchGetChannelGroupList(params: Api.DataManageShip.ShipQueryParams) {
  return request<Api.DataManageShip.ShipQueryResult<Api.DataManageShip.ChannelGroup>>({
    url: '/channel-group/query',
    method: 'post',
    data: params
  });
}

export function fetchCreateChannelGroup(params: Partial<Api.DataManageShip.ChannelGroup>) {
  return request<boolean>({ url: '/channel-group/create', method: 'post', data: params });
}

export function fetchUpdateChannelGroup(params: Partial<Api.DataManageShip.ChannelGroup>) {
  return request<boolean>({ url: '/channel-group/update', method: 'post', data: params });
}

export function fetchDeleteChannelGroup(id: string) {
  return request<boolean>({ url: '/channel-group/delete', method: 'post', data: { _id: id } });
}

// ---- 计泡规则 /weight-rule ----

export function fetchGetWeightRuleList(params: Api.DataManageShip.ShipQueryParams) {
  return request<Api.DataManageShip.ShipQueryResult<Api.DataManageShip.WeightRule>>({
    url: '/weight-rule/query',
    method: 'post',
    data: params
  });
}

export function fetchCreateWeightRule(params: Partial<Api.DataManageShip.WeightRule>) {
  return request<boolean>({ url: '/weight-rule/create', method: 'post', data: params });
}

export function fetchUpdateWeightRule(params: Partial<Api.DataManageShip.WeightRule>) {
  return request<boolean>({ url: '/weight-rule/update', method: 'post', data: params });
}

export function fetchDeleteWeightRule(id: string) {
  return request<boolean>({ url: '/weight-rule/delete', method: 'post', data: { _id: id } });
}

// ---- 承运网络 /carrier ----

export function fetchGetCarrierList(params: Api.DataManageShip.ShipQueryParams) {
  return request<Api.DataManageShip.ShipQueryResult<Api.DataManageShip.Carrier>>({
    url: '/carrier/query',
    method: 'post',
    data: params
  });
}

export function fetchCreateCarrier(params: Partial<Api.DataManageShip.Carrier>) {
  return request<boolean>({ url: '/carrier/create', method: 'post', data: params });
}

export function fetchUpdateCarrier(params: Partial<Api.DataManageShip.Carrier>) {
  return request<boolean>({ url: '/carrier/update', method: 'post', data: params });
}

export function fetchDeleteCarrier(id: string) {
  return request<boolean>({ url: '/carrier/delete', method: 'post', data: { _id: id } });
}
