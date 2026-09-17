import { request } from '../../request';

/**
 * 抓取时间接口。仅提供单文档配置（/track-schedule/*），
 * 「抓取执行记录」表格已改走真实接口 /op-log/query（where.opType=4 追踪），见 service/api/op-log。
 */

/** get track schedule（每日自动抓取时间点配置，单文档或 null） */
export function fetchGetCaptureTimeConfig() {
  return request<Api.SystemManage.CaptureTimeConfig | null>({
    url: '/track-schedule/get',
    method: 'post',
    data: {}
  });
}

/** save track schedule（单文档 upsert，creator/updateBy 由后端自动注入） */
export function fetchSaveCaptureTimeConfig(params: Api.SystemManage.CaptureTimeConfigSaveParams) {
  return request<Record<string, never>>({ url: '/track-schedule/save', method: 'post', data: params });
}
