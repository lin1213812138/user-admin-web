import type { SelectOption } from 'naive-ui';

/** 计量单位：value 与 tms-user product 的 unitConst 映射一致 */
export const unitOptions: SelectOption[] = [
  { label: '件 (PCS)', value: 'PCS' },
  { label: '套 (SET)', value: 'SET' },
  { label: '米 (MTR)', value: 'MTR' },
  { label: '千克 (KG)', value: 'KG' },
  { label: '卷 (ROLL)', value: 'ROLL' },
  { label: '箱/盒 (BOX)', value: 'BOX' },
  { label: '双/对 (PRS)', value: 'PRS' },
  { label: '打 (DOZ)', value: 'DOZ' },
  { label: '包 (PKGS)', value: 'PKGS' },
  { label: '个 (EA)', value: 'EA' },
  { label: '平方米 (M2)', value: 'M2' },
  { label: '立方米 (M3)', value: 'M3' },
  { label: '厘米 (CM)', value: 'CM' },
  { label: '立方厘米 (CM3)', value: 'CM3' }
];

/** 结算币种：前端固定常用列表 */
export const currencyOptions: SelectOption[] = [
  { label: '美元 (USD)', value: 'USD' },
  { label: '人民币 (CNY)', value: 'CNY' },
  { label: '欧元 (EUR)', value: 'EUR' },
  { label: '英镑 (GBP)', value: 'GBP' },
  { label: '日元 (JPY)', value: 'JPY' },
  { label: '澳元 (AUD)', value: 'AUD' },
  { label: '加元 (CAD)', value: 'CAD' },
  { label: '港币 (HKD)', value: 'HKD' },
  { label: '新加坡元 (SGD)', value: 'SGD' }
];
