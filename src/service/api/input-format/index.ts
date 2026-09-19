import { request } from '../../request';

/**
 * 查询录单格式列表（真实接口 /order-template/query，返回 ret:{ list, total }）
 *
 * 真实接口走 flat request，调用方需解包 `{ data, error }`。
 * 管理端必须传 `scene`：不传时后端会强制 `status=1` 并按角色可见格式（user.orderTemplateIds）过滤。
 * 排序由后端固定为 `{ order: 1 }`；列表不返回 fieldList（模型 omitFields），编辑回显需再调详情接口。
 */
export function fetchGetInputFormatList(params: Api.InputFormat.SearchParams) {
  return request<Api.InputFormat.List>({
    url: '/order-template/query',
    method: 'post',
    data: params
  });
}

/** 查询录单格式详情（真实接口 /order-template/get，含 fieldList） */
export function fetchGetInputFormatDetail(_id: string) {
  return request<Api.InputFormat.OrderTemplate>({
    url: '/order-template/get',
    method: 'post',
    data: { _id }
  });
}

/** 新建录单格式（真实接口 /order-template/create，后端 name 必填 + 重名校验，创建人自动补充） */
export function fetchCreateInputFormat(params: Api.InputFormat.SaveParams) {
  return request<boolean>({
    url: '/order-template/create',
    method: 'post',
    data: params
  });
}

/** 更新录单格式（真实接口 /order-template/update，后端修改人自动补充，isDefault=1 会清掉其它默认） */
export function fetchUpdateInputFormat(params: Api.InputFormat.SaveParams & { _id: string }) {
  return request<boolean>({
    url: '/order-template/update',
    method: 'post',
    data: params
  });
}

/**
 * 列表快捷操作（停用/启用、设为默认）
 *
 * 与 fetchUpdateInputFormat 同一个后端接口，但只提交 `_id + name + 目标字段`（部分更新）。
 * `name` 必须随行回传：后端以 name 为唯一键做重名校验，缺省会误判为「已存在」，详见 PatchParams 注释。
 */
export function fetchPatchInputFormat(params: Api.InputFormat.PatchParams) {
  return request<boolean>({
    url: '/order-template/update',
    method: 'post',
    data: params
  });
}

/** 删除录单格式（真实接口 /order-template/delete，仅支持单条 _id） */
export function fetchDeleteInputFormat(_id: string) {
  return request<boolean>({
    url: '/order-template/delete',
    method: 'post',
    data: { _id }
  });
}
