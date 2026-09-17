/** 追踪网络单个对接字段配置：field 为写入后端 TrackConfig 的字段，label 为对接系统的参数名 */
export interface TrackTypeFieldConfig {
  field: 'account' | 'password' | 'key' | 'accountNo';
  label: string;
}

/** 追踪网络系统类型配置（字段映射来源：tms-user lib/ext-api/api/ 各系统适配器） */
export interface TrackTypeConfig {
  label: string;
  value: string;
  fields: TrackTypeFieldConfig[];
}

export const TRACK_TYPE_CONFIGS: TrackTypeConfig[] = [
  // { label: 'UPS', value: 'ups', fields: [] },
  // { label: 'FedEx', value: 'fedex', fields: [] },
  // { label: '快递助手', value: 'kdzs', fields: [{ field: 'account', label: '账号' }, { field: 'password', label: '密码' }] },
  {
    label: '速递管家',
    value: 'sd',
    fields: [
      { field: 'account', label: 'appToken' },
      { field: 'key', label: 'appKey' }
    ]
  },
  {
    label: '华磊',
    value: 'hl',
    fields: [
      { field: 'account', label: '账号' },
      { field: 'password', label: '密码' }
    ]
  },
  {
    label: 'K5',
    value: 'k5',
    fields: [
      { field: 'account', label: 'Clientid' },
      { field: 'key', label: 'Token' }
    ]
  },
  {
    label: '跨境v5',
    value: 'kjv5',
    fields: [
      { field: 'account', label: 'appKey' },
      { field: 'key', label: 'appSecret' }
    ]
  },
  { label: '钮门', value: 'nm', fields: [] },
  {
    label: '睿云',
    value: 'ry',
    fields: [
      { field: 'account', label: 'plantId' },
      { field: 'key', label: 'plantKey' },
      { field: 'accountNo', label: 'bankerId' }
    ]
  },
  {
    label: '易抵达',
    value: 'ydd',
    fields: [
      { field: 'account', label: '账号' },
      { field: 'password', label: '密码' }
    ]
  },
  { label: '新智慧', value: 'xzh', fields: [{ field: 'key', label: 'token' }] },
  {
    label: 'T6',
    value: 't6',
    fields: [
      { field: 'account', label: '客户编码' },
      { field: 'key', label: 'API授权码' }
    ]
  },
  {
    label: '顺仓',
    value: 'sckj',
    fields: [
      { field: 'account', label: '客户编码' },
      { field: 'key', label: 'API授权码' }
    ]
  },
  { label: '中国邮政', value: 'zgyz', fields: [] },
  { label: '17track', value: 'track17', fields: [{ field: 'key', label: '17token' }] },
  {
    label: '17FEIA',
    value: 'feia17',
    fields: [
      { field: 'account', label: 'apiName' },
      { field: 'key', label: 'apiToken' }
    ]
  },
  { label: '秦远', value: 'qy', fields: [] }
];

/** 系统类型下拉选项（由 TRACK_TYPE_CONFIGS 派生） */
export const TRACK_TYPE_OPTIONS: { label: string; value: string }[] = TRACK_TYPE_CONFIGS.map(({ label, value }) => ({
  label,
  value
}));

/** 按 trackType 码取显示名（未匹配回退 --） */
export function trackTypeLabel(value?: string) {
  return TRACK_TYPE_OPTIONS.find(item => item.value === value)?.label ?? '--';
}

/** 按 trackType 码取对接字段配置（未匹配返回空数组） */
export function trackTypeFields(value?: string) {
  return TRACK_TYPE_CONFIGS.find(item => item.value === value)?.fields ?? [];
}
