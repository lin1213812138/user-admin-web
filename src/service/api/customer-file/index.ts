import { request } from '../../request';

// 真实接口（tms-user /api/v1/web/file/*），flat 请求需调用方解包 { data, error }
// 上传统一走公共 Upload 组件（/upload/file?refId= 入附件库），不再单独封装 /upload/files

/** get customer file list（真实接口 /file/query，走 queryAllCommon 仅返回 { list }；refId 关联客户 _id） */
export function fetchGetCustomerFileList(refId: string, keyword?: string) {
  return request<Api.SystemManage.CustomerFileList>({
    url: '/file/query',
    method: 'post',
    // keyword 必须显式传 keywordFields 才生效（匹配文件名称）
    data: { where: { refId }, keyword: keyword?.trim() || undefined, keywordFields: ['name'] }
  });
}

/** delete customer file（真实接口 /file/delete，单 _id） */
export function fetchDeleteCustomerFile(id: string) {
  return request<null>({
    url: '/file/delete',
    method: 'post',
    data: { _id: id }
  });
}
