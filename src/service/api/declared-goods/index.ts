import { request } from '../../request';

/**
 * 申报物品接口：/product（申报物品库）与 /product-country（清关目的地）。
 * 全部为 tms-user 真实接口（无 DEV mock），flat request 需解包 { data, error }。
 * 通用分页契约：{ page, size, keyword, keywordFields, where } → { list, total }。
 * 注意：/product/delete 传 ids 数组；/product-country/delete 传单个 _id。
 */

// ---- 申报物品库 /product ----

export function fetchGetProductList(params: Api.DeclaredGoods.QueryParams) {
  return request<Api.DeclaredGoods.QueryResult<Api.DeclaredGoods.Product>>({
    url: '/product/query',
    method: 'post',
    data: params
  });
}

export function fetchCreateProduct(params: Partial<Api.DeclaredGoods.Product>) {
  return request<boolean>({ url: '/product/create', method: 'post', data: params });
}

export function fetchUpdateProduct(params: Partial<Api.DeclaredGoods.Product>) {
  return request<boolean>({ url: '/product/update', method: 'post', data: params });
}

export function fetchDeleteProducts(ids: string[]) {
  return request<boolean>({ url: '/product/delete', method: 'post', data: { ids } });
}

// ---- 清关目的地 /product-country ----

export function fetchGetProductCountryList(params: Api.DeclaredGoods.QueryParams) {
  return request<Api.DeclaredGoods.QueryResult<Api.DeclaredGoods.ProductCountry>>({
    url: '/product-country/query',
    method: 'post',
    data: params
  });
}

export function fetchCreateProductCountry(params: Partial<Api.DeclaredGoods.ProductCountry>) {
  return request<boolean>({ url: '/product-country/create', method: 'post', data: params });
}

export function fetchUpdateProductCountry(params: Partial<Api.DeclaredGoods.ProductCountry>) {
  return request<boolean>({ url: '/product-country/update', method: 'post', data: params });
}

export function fetchDeleteProductCountry(id: string) {
  return request<boolean>({ url: '/product-country/delete', method: 'post', data: { _id: id } });
}
