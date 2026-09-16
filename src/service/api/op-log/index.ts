import { request } from '../../request';

/** get op-log list（真实接口 /op-log/query，返回 ret:{ list, total }，flat 请求需调用方解包 { data, error }；无 mock） */
export function fetchGetOpLogList(params: Api.SystemManage.OpLogSearchParams) {
  return request<Api.SystemManage.OpLogList>({
    url: '/op-log/query',
    method: 'post',
    data: params
  });
}
