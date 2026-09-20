import { request } from '../../request';

/**
 * 发货渠道接口（tms-user，/channel-out/*）。flat request，调用方需解包 { data, error }。
 * 收货渠道表单的「绑定发货渠道」下拉使用本列表（channelType=0 发货渠道）。
 */

/** 发货渠道下拉选项（仅取 _id / name / code 的最小形状） */
export interface ChannelOutOption {
  _id: string;
  name: string;
  code?: string;
}

/** 发货渠道完整行（/channel-out/query；scene=1 时后端 fillName 回填名称类字段，承运网络同步弹窗用） */
export interface ChannelOutRow extends Api.DataManageShip.CarrierSyncChannel {
  code?: string;
}

/**
 * 发货渠道列表（/channel-out/query；按 channelType 过滤：0-发货渠道 1-派送渠道，不传默认 0）。
 * scene 非空时触发后端 fillName 回填名称（weightRuleName / remoteGroup 等）。
 */
export function fetchGetChannelOutList(params: {
  page: number;
  size: number;
  keyword?: string;
  channelType?: number;
  scene?: number;
  /** 按承运网络过滤（承运网络附加费同步抽屉用；不传时 where 与原来完全一致） */
  carrierId?: string;
}) {
  return request<{ list: ChannelOutRow[]; total: number }>({
    url: '/channel-out/query',
    method: 'post',
    data: {
      page: params.page,
      size: params.size,
      keyword: params.keyword,
      scene: params.scene,
      where: {
        channelType: params.channelType ?? 0,
        ...(params.carrierId ? { carrierId: params.carrierId } : {})
      }
    }
  });
}
