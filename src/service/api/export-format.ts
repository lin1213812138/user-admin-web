import { request } from '../request';

/** 内存 mock 库（DEV 持久化增删） */
let mockSeq = 300;
const mockDb: Api.ExportFormat.Template[] = [
  {
    id: 1,
    categoryId: 1,
    name: 'BOL',
    scope: '内部系统',
    fileName: 'BOL_template.xlsx',
    remark: '--',
    lastEditor: '牛迈',
    editTime: '2026-05-06 15:09:34'
  },
  {
    id: 2,
    categoryId: 1,
    name: '业务清单(标准)',
    scope: '全部',
    fileName: 'biz_list_template.xlsx',
    remark: '默认业务清单',
    lastEditor: 'admin',
    editTime: '2026-08-01 10:20'
  },
  {
    id: 3,
    categoryId: 4,
    name: '应收账单(按费用)',
    scope: '客户',
    fileName: 'ar_fee_template.xlsx',
    remark: '',
    lastEditor: 'admin',
    editTime: '2026-08-12 14:05'
  },
  {
    id: 4,
    categoryId: 8,
    name: 'AWB 总单清单',
    scope: '内部系统',
    fileName: 'awb_master_template.xlsx',
    remark: '汇总总单',
    lastEditor: 'admin',
    editTime: '2026-08-15 11:00'
  },
  {
    id: 5,
    categoryId: 9,
    name: '单票运单模板',
    scope: '全部',
    fileName: 'waybill_import_template.xlsx',
    remark: '导入用',
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

/** 获取导出模板列表（按分类过滤 + 分页） */
export function fetchGetExportTemplateList(params: { categoryId: number; current: number; size: number }) {
  if (import.meta.env.DEV) {
    return mockList(params) as unknown as Promise<Api.ExportFormat.List>;
  }
  return request<Api.ExportFormat.List>({ url: '/export/template/list', method: 'post', data: params });
}

/** 新建模板 */
export function fetchCreateExportTemplate(params: Api.ExportFormat.CreateParams) {
  if (import.meta.env.DEV) {
    const id = ++mockSeq;
    const row: Api.ExportFormat.Template = { ...params, id, lastEditor: 'admin', editTime: now() };
    mockDb.push(row);
    return Promise.resolve(row) as unknown as Promise<Api.ExportFormat.Template>;
  }
  return request<Api.ExportFormat.Template>({ url: '/export/template/create', method: 'post', data: params });
}

/** 批量删除模板 */
export function fetchDeleteExportTemplate(ids: number[]) {
  if (import.meta.env.DEV) {
    for (const id of ids) {
      const idx = mockDb.findIndex(t => t.id === id);
      if (idx >= 0) mockDb.splice(idx, 1);
    }
    return Promise.resolve(true) as unknown as Promise<boolean>;
  }
  return request<boolean>({ url: '/export/template/delete', method: 'post', data: { ids } });
}
