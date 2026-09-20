import { request } from '../../request';

/**
 * 收货渠道接口（tms-user，/channel/*）。
 * 均为 flat request，调用方需解包 { data, error }。
 * 契约要点：create 仅校验 name（code 为空时后端按序号自动生成）；update 走 uniqField:['name','code']，
 * 必须随行回传 name + code；delete 仅支持单条 _id。
 */

/** 获取收货渠道列表（/channel/query；scene=1 触发后端 fillName 回填名称，并按当前用户站点过滤 siteIds） */
export function fetchGetChannelList(params: Api.ChannelQuote.ReceiveChannelSearchParams) {
  return request<Api.ChannelQuote.ReceiveChannelList>({
    url: '/channel/query',
    method: 'post',
    data: { ...params, scene: 1 }
  });
}

/** 获取单条收货渠道详情（/channel/get；同样会 fillName 回填名称） */
export function fetchGetChannel(_id: string) {
  return request<Api.ChannelQuote.ReceiveChannel>({
    url: '/channel/get',
    method: 'post',
    data: { _id }
  });
}

/** 新建收货渠道（/channel/create；name 必填且全局唯一） */
export function fetchCreateChannel(params: Api.ChannelQuote.ReceiveChannelSaveParams) {
  return request<boolean>({
    url: '/channel/create',
    method: 'post',
    data: params
  });
}

/** 更新收货渠道（/channel/update；必填 _id，且必须随行回传 name + code） */
export function fetchUpdateChannel(params: Api.ChannelQuote.ReceiveChannelSaveParams) {
  return request<boolean>({
    url: '/channel/update',
    method: 'post',
    data: params
  });
}

/** 删除收货渠道（/channel/delete；后端仅支持单条 _id，批量需前端逐条调用） */
export function fetchDeleteChannel(_id: string) {
  return request<boolean>({
    url: '/channel/delete',
    method: 'post',
    data: { _id }
  });
}
