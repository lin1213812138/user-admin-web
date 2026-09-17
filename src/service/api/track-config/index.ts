import { request } from '../../request';

/**
 * 追踪网络接口（系统设置 → 轨迹抓取 → 追踪网络），对应 tms-user /track-config/*（模型：轨迹抓取配置）。
 * tms-user 真实接口，无 DEV mock。flat request，调用方需解包 { data, error }。
 * 查询契约：{ page, size, keyword } → { list, total }（keyword 由后端 keywordFields: ['name'] 生效）；
 * create/update 返回空对象（name 后端唯一，重复报 102701 轨迹抓取配置已存在）；delete 仅单条 _id。
 */

/** 追踪网络列表（keyword 按网络名称模糊搜索） */
export function fetchGetTrackConfigList(params: Api.SystemManage.TraceConfigSearchParams) {
  return request<Api.SystemManage.TraceConfigList>({
    url: '/track-config/query',
    method: 'post',
    data: params
  });
}

/** 新建追踪网络（name 后端唯一校验） */
export function fetchCreateTrackConfig(params: Api.SystemManage.TraceConfigCreateParams) {
  return request<boolean>({ url: '/track-config/create', method: 'post', data: params });
}

/** 更新追踪网络（必填 _id） */
export function fetchUpdateTrackConfig(params: Api.SystemManage.TraceConfigUpdateParams) {
  return request<boolean>({ url: '/track-config/update', method: 'post', data: params });
}

/** 删除追踪网络（后端仅单条 _id） */
export function fetchDeleteTrackConfig(id: string) {
  return request<boolean>({ url: '/track-config/delete', method: 'post', data: { _id: id } });
}
