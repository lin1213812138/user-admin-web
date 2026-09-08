/** 字段生成的元素类型，取值与 hiprint 的元素 type 一致 */
export type PrintFieldType = 'text' | 'longText' | 'barcode' | 'qrcode' | 'table';

export interface PrintField {
  /** 绑定字段名，写入元素 options.field */
  key: string;
  /** 左侧面板展示名，同时作为元素 title */
  label: string;
  /** 生成的元素类型 */
  type: PrintFieldType;
  /** 设计态与预览用的示例值 */
  sample: string;
}

export interface PrintFieldGroup {
  /** 分组标识，同时作为元素 tid 前缀 */
  key: string;
  /** 分组标题 */
  label: string;
  fields: PrintField[];
}

/** 前端维护的业务字段清单（后端暂无字段字典接口） */
export const printFieldGroups: PrintFieldGroup[] = [
  {
    key: 'waybill',
    label: '运单信息',
    fields: [
      { key: 'waybillNo', label: '运单号', type: 'barcode', sample: 'WM202609070001' },
      { key: 'transferNo', label: '转单号', type: 'text', sample: 'TR202609070001' },
      { key: 'channel', label: '渠道', type: 'text', sample: '中欧专线' },
      { key: 'country', label: '目的国家', type: 'text', sample: 'Germany' },
      { key: 'weight', label: '重量(kg)', type: 'text', sample: '2.35' },
      { key: 'createAt', label: '下单时间', type: 'text', sample: '2026-09-07 10:20' }
    ]
  },
  {
    key: 'receiver',
    label: '收件人信息',
    fields: [
      { key: 'receiverName', label: '收件人', type: 'text', sample: 'Hans Muller' },
      { key: 'receiverPhone', label: '收件电话', type: 'text', sample: '+49 170 1234567' },
      { key: 'receiverCompany', label: '收件公司', type: 'text', sample: 'Muller GmbH' },
      { key: 'receiverCountry', label: '国家/地区', type: 'text', sample: 'DE' },
      { key: 'receiverState', label: '省/州', type: 'text', sample: 'Bavaria' },
      { key: 'receiverCity', label: '城市', type: 'text', sample: 'Munich' },
      { key: 'receiverAddress1', label: '地址行1', type: 'longText', sample: 'Hauptstrasse 12' },
      { key: 'receiverAddress2', label: '地址行2', type: 'longText', sample: 'Apt. 3B' },
      { key: 'receiverPostcode', label: '邮编', type: 'text', sample: '80331' }
    ]
  },
  {
    key: 'sender',
    label: '发件人信息',
    fields: [
      { key: 'senderName', label: '发件人', type: 'text', sample: '林飞' },
      { key: 'senderPhone', label: '发件电话', type: 'text', sample: '13800138000' },
      { key: 'senderCompany', label: '发件公司', type: 'text', sample: 'LINFLY Logistics' },
      { key: 'senderAddress', label: '发件地址', type: 'longText', sample: '深圳市宝安区xxx工业园A栋' }
    ]
  },
  {
    key: 'goods',
    label: '物品信息',
    fields: [
      { key: 'goodsName', label: '品名', type: 'text', sample: 'LED Lamp' },
      { key: 'goodsQty', label: '数量', type: 'text', sample: '3' },
      { key: 'goodsWeight', label: '重量', type: 'text', sample: '2.35' },
      { key: 'declareValue', label: '申报价值', type: 'text', sample: '58.00' },
      { key: 'hsCode', label: '海关编码', type: 'text', sample: '9405409000' }
    ]
  },
  {
    key: 'fee',
    label: '费用信息',
    fields: [
      { key: 'freight', label: '运费', type: 'text', sample: '128.00' },
      { key: 'totalFee', label: '合计', type: 'text', sample: '186.50' },
      { key: 'currency', label: '币种', type: 'text', sample: 'EUR' }
    ]
  },
  {
    key: 'system',
    label: '系统信息',
    fields: [
      { key: 'printTime', label: '打印时间', type: 'text', sample: '2026-09-07 15:30:00' },
      { key: 'printUser', label: '打印人', type: 'text', sample: 'admin' },
      { key: 'qrcodeUrl', label: '查询二维码', type: 'qrcode', sample: 'https://example.com/w/WM202609070001' }
    ]
  }
];

/** 由字段示例值拼出预览/设计态的示例运单数据 */
export function buildSampleData(): Record<string, string> {
  const data: Record<string, string> = {};
  printFieldGroups.forEach(group => {
    group.fields.forEach(field => {
      data[field.key] = field.sample;
    });
  });
  return data;
}
