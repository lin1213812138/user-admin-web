/** local mock data for system manage module (used in dev when backend api is absent) */

// ---------- 操作轨迹 ----------
const operationTraceItems: Api.SystemManage.OperationTraceItem[] = [
  { id: 1, node: '揽收', timeFormat: 'YYYY-MM-DD HH:mm', location: '深圳', description: '包裹揽收入库', published: 1 },
  {
    id: 2,
    node: '分拣',
    timeFormat: 'YYYY-MM-DD HH:mm',
    location: '广州',
    description: '按目的地进行分拣',
    published: 1
  },
  { id: 3, node: '出库', timeFormat: 'YYYY-MM-DD', location: '上海', description: '装车出库', published: 0 }
];

export function mockGetOperationTraceList(
  params: Api.SystemManage.OperationTraceSearchParams
): Api.SystemManage.OperationTraceList {
  const { current = 1, size = 20 } = params;
  const start = (current - 1) * size;
  return {
    records: operationTraceItems.slice(start, start + size),
    current,
    size,
    total: operationTraceItems.length
  };
}

export function mockCreateOperationTrace(
  params: Api.SystemManage.OperationTraceCreateParams
): Api.SystemManage.OperationTraceItem {
  const id = operationTraceItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const item: Api.SystemManage.OperationTraceItem = { id, ...params };
  operationTraceItems.unshift(item);
  return item;
}

export function mockUpdateOperationTrace(
  params: Api.SystemManage.OperationTraceUpdateParams
): Api.SystemManage.OperationTraceItem {
  const index = operationTraceItems.findIndex(item => item.id === params.id);
  const updated: Api.SystemManage.OperationTraceItem = { ...operationTraceItems[index], ...params };
  operationTraceItems.splice(index, 1, updated);
  return updated;
}
