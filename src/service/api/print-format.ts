import { request } from '../request';

/** 内存 mock 库（DEV 持久化增删改） */
let mockSeq = 200;
const mockDb: Api.PrintFormat.Template[] = [
  {
    id: 1,
    categoryId: 1,
    name: '标准内单标签',
    labelSize: '100×150mm',
    isDefault: 1,
    generatedCount: 1280,
    remark: '默认内单',
    lastEditor: 'admin',
    editTime: '2026-08-01 10:20'
  },
  {
    id: 2,
    categoryId: 1,
    name: '热敏内单',
    labelSize: '80×60mm',
    isDefault: 0,
    generatedCount: 320,
    remark: '',
    lastEditor: 'admin',
    editTime: '2026-08-12 14:05'
  },
  {
    id: 3,
    categoryId: 2,
    name: '标准转单标签',
    labelSize: '100×150mm',
    isDefault: 1,
    generatedCount: 640,
    remark: '转单专用',
    lastEditor: 'admin',
    editTime: '2026-08-03 09:30'
  },
  {
    id: 4,
    categoryId: 3,
    name: '商业发票',
    labelSize: 'A4',
    isDefault: 1,
    generatedCount: 88,
    remark: '形式发票',
    lastEditor: 'admin',
    editTime: '2026-07-20 16:40'
  },
  {
    id: 5,
    categoryId: 4,
    name: '总单主标',
    labelSize: '100×100mm',
    isDefault: 1,
    generatedCount: 1500,
    remark: '汇总总单',
    lastEditor: 'admin',
    editTime: '2026-08-15 11:00'
  },
  {
    id: 6,
    categoryId: 4,
    name: '总单副标',
    labelSize: '100×100mm',
    isDefault: 0,
    generatedCount: 210,
    remark: '',
    lastEditor: 'admin',
    editTime: '2026-08-18 13:25'
  }
];

function now(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function mockList(params: { categoryId: number; current: number; size: number }) {
  const list = mockDb.filter(t => t.categoryId === params.categoryId);
  const start = (params.current - 1) * params.size;
  return Promise.resolve({ records: list.slice(start, start + params.size), total: list.length });
}

/** 获取打印模板列表（按分类过滤 + 分页） */
export function fetchGetPrintTemplateList(params: { categoryId: number; current: number; size: number }) {
  if (import.meta.env.DEV) {
    return mockList(params) as unknown as Promise<Api.PrintFormat.List>;
  }
  return request<Api.PrintFormat.List>({ url: '/print/template/list', method: 'post', data: params });
}

/** 新建模板 */
export function fetchCreatePrintTemplate(params: Api.PrintFormat.CreateParams) {
  if (import.meta.env.DEV) {
    const id = ++mockSeq;
    const row: Api.PrintFormat.Template = { ...params, id, generatedCount: 0, lastEditor: 'admin', editTime: now() };
    mockDb.push(row);
    return Promise.resolve(row) as unknown as Promise<Api.PrintFormat.Template>;
  }
  return request<Api.PrintFormat.Template>({ url: '/print/template/create', method: 'post', data: params });
}

/** 批量删除模板 */
export function fetchDeletePrintTemplate(ids: number[]) {
  if (import.meta.env.DEV) {
    for (const id of ids) {
      const idx = mockDb.findIndex(t => t.id === id);
      if (idx >= 0) mockDb.splice(idx, 1);
    }
    return Promise.resolve(true) as unknown as Promise<boolean>;
  }
  return request<boolean>({ url: '/print/template/delete', method: 'post', data: { ids } });
}

/** 复制为模板（调用方已去掉 id） */
export function fetchCopyPrintTemplate(params: Api.PrintFormat.CreateParams) {
  if (import.meta.env.DEV) {
    const id = ++mockSeq;
    const row: Api.PrintFormat.Template = { ...params, id, generatedCount: 0, lastEditor: 'admin', editTime: now() };
    mockDb.push(row);
    return Promise.resolve(row) as unknown as Promise<Api.PrintFormat.Template>;
  }
  return request<Api.PrintFormat.Template>({ url: '/print/template/copy', method: 'post', data: params });
}

/** 设为默认（同分类互斥） */
export function fetchSetDefaultPrintTemplate(params: { id: number; categoryId: number }) {
  if (import.meta.env.DEV) {
    mockDb.forEach(t => {
      if (t.categoryId === params.categoryId) t.isDefault = t.id === params.id ? 1 : 0;
    });
    return Promise.resolve(true) as unknown as Promise<boolean>;
  }
  return request<boolean>({ url: '/print/template/setDefault', method: 'post', data: params });
}
