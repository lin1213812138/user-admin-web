import { request } from '../../request';

/**
 * 导出格式（导出模板）接口，全部为 wms-user 真实接口（路由前缀 /tms/api/v1/web）。
 * 均为 flat request，调用方需解包 { data, error }。
 */

/** 列表查询（/export-template/query，返回 ret:{ list, total }；列表不含 infoList/fieldList/subList 大字段） */
export function fetchGetExportTemplateList(params: Api.ExportFormat.SearchParams) {
  return request<Api.ExportFormat.List>({
    url: '/export-template/query',
    method: 'post',
    data: params
  });
}

/** 新建模板（/export-template/create；必填 name/templateType/file/fileUrl；名称全局唯一） */
export function fetchCreateExportTemplate(params: Api.ExportFormat.SaveParams) {
  return request<boolean>({
    url: '/export-template/create',
    method: 'post',
    data: params
  });
}

/** 更新模板（/export-template/update；必填 _id，未提交的字段保持原值） */
export function fetchUpdateExportTemplate(params: Api.ExportFormat.SaveParams) {
  return request<boolean>({
    url: '/export-template/update',
    method: 'post',
    data: params
  });
}

/** 删除模板（/export-template/delete；后端仅支持单条 _id） */
export function fetchDeleteExportTemplate(id: string) {
  return request<boolean>({
    url: '/export-template/delete',
    method: 'post',
    data: { _id: id }
  });
}

/**
 * 上传并解析 Excel 模板（/export-template/upload?dest=4，form-data 字段名 file）。
 * 后端保存文件后解析 xlsx 内的 @信息 / #列表 / ##子列 / $子表 / %条码 / &条码带文本 标记，
 * 返回 { file, fileUrl, fieldRow, infoList, fieldList, subFieldList, subList, barcodeList, subBarcodeList }。
 */
export function fetchUploadExportTemplate(file: File) {
  const data = new FormData();
  data.append('file', file);

  return request<Api.ExportFormat.UploadResult>({
    url: '/export-template/upload',
    method: 'post',
    params: { dest: 4 },
    data
  });
}
