import { request } from '../../request';

/**
 * 打印格式（打印模板）接口，全部为 wms-user 真实接口（路由前缀 /tms/api/v1/web）。
 * 均为 flat request，调用方需解包 { data, error }。
 */

/** 获取打印模板列表（/print-template/query，返回 ret:{ list, total }，列表项不含 design 等大字段） */
export function fetchGetPrintTemplateList(params: Api.PrintFormat.SearchParams) {
  return request<Api.PrintFormat.List>({
    url: '/print-template/query',
    method: 'post',
    data: params
  });
}

/** 获取模板详情（/print-template/get，含 design 等完整字段） */
export function fetchGetPrintTemplateDetail(id: string) {
  return request<Api.PrintFormat.Template>({
    url: '/print-template/get',
    method: 'post',
    data: { _id: id }
  });
}

/** 新建模板（/print-template/create；名称全局唯一，isDefault=1 时同类型互斥） */
export function fetchCreatePrintTemplate(params: Api.PrintFormat.SaveParams) {
  return request<Api.PrintFormat.Template>({
    url: '/print-template/create',
    method: 'post',
    data: params
  });
}

/** 更新模板（/print-template/update；templateType/templateMode/sizeType 为后端必填） */
export function fetchUpdatePrintTemplate(params: Api.PrintFormat.UpdateParams) {
  return request<Api.PrintFormat.Template>({
    url: '/print-template/update',
    method: 'post',
    data: params
  });
}

/** 复制模板（/print-template/copy/create；design 由服务端从原模板复制） */
export function fetchCopyPrintTemplate(params: Api.PrintFormat.CopyParams) {
  return request<Api.PrintFormat.Template>({
    url: '/print-template/copy/create',
    method: 'post',
    data: params
  });
}

/** 删除模板（/print-template/delete；后端仅支持单条 _id） */
export function fetchDeletePrintTemplate(id: string) {
  return request<boolean>({
    url: '/print-template/delete',
    method: 'post',
    data: { _id: id }
  });
}

/**
 * 保存设计器产物（即 /print-template/update：design + 顶层 mm 宽高）。
 * 后端 setGenerate 在 design 非空时会用 design.width/height 覆盖宽高，故 design 顶层需带实际 mm 尺寸。
 */
export function fetchSavePrintTemplateDesign(params: Api.PrintFormat.SaveDesignParams) {
  return request<boolean>({
    url: '/print-template/update',
    method: 'post',
    data: params
  });
}
