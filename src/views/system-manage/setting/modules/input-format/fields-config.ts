import type { FormItemType } from '@/components/Form/form-config';

/** 字段所属域（对齐后端模型：order-运单 shipTo-收件人 shipper-发件人 item-子单号 product-物品信息） */
export type OrderFieldType = 'order' | 'shipTo' | 'shipper' | 'item' | 'product';

/** 单个录单字段配置 */
export interface OrderFieldConfig {
  /** 字段所属域 */
  fieldType: OrderFieldType;
  /** 控件类型（沿用 Form 组件 FormItemType） */
  type: FormItemType;
  /** 字段 key（域内短名，跨域可重名，唯一性由 fieldType + key 组合保证） */
  key: string;
  /** 展示文案 */
  label: string;
  /** 默认是否必填 */
  required: boolean;
  /** 默认是否显示 */
  show: boolean;
  /** 自定义渲染组件标识（缺省按 type 渲染标准控件） */
  component?: string;
}

/** 分组标题（字段映射按域聚合时使用；键顺序即分组顺序） */
export const fieldGroupTitles: Record<OrderFieldType, string> = {
  order: '运单信息',
  shipTo: '收件人信息',
  shipper: '发件人信息',
  item: '子单号信息',
  product: '物品信息'
};

/** 录单字段清单（按域分区，组内顺序即展示顺序） */
export const fieldsConfig: OrderFieldConfig[] = [
  // 运单字段
  {
    fieldType: 'order',
    type: 'select',
    key: 'customerId',
    label: '客户',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'select',
    key: 'channelId',
    label: '收货渠道',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'select',
    key: 'countryId',
    label: '目的地',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'select',
    key: 'packType',
    component: 'packTypeSelect',
    label: '类型',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'no',
    label: '内单号',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'channelNo',
    label: '转单号',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'trackNo',
    label: '派送号',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'customerNo',
    label: '客户单号',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'customsNo',
    label: '报关号',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'refNo',
    label: '参考号',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'number',
    key: 'num',
    label: '件数',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'number',
    key: 'weight',
    label: '实重',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'number',
    key: 'volume',
    label: '方数',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'number',
    key: 'priceWeight',
    label: '计费重',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'number',
    key: 'feeTotal',
    label: '总费用',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'select',
    key: 'billModeId',
    label: '结算方式',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'number',
    key: 'feeCodTotal',
    label: '代收货款',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'startPlace',
    label: '出发地',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'switch',
    key: 'insure',
    label: '是否投保',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'switch',
    key: 'powder',
    label: '是否粉末',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'switch',
    key: 'liquid',
    label: '是否液体',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'switch',
    key: 'elect',
    label: '是否带电',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'switch',
    key: 'magnet',
    label: '是否带磁',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'fbaId',
    label: 'FBA参考号',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'poaNumber',
    label: 'POA number',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'shopId',
    label: '店铺ID',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'buyerId',
    label: '买家ID',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'tradeId',
    label: '交易ID',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'platform',
    label: '电商平台',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'appointNo',
    label: '预约号',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'deliveryTime',
    label: '送达时段',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'shipMode',
    label: '派送方式',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'select',
    key: 'productGroupIds',
    label: '物品类别',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'select',
    key: 'customTypeId',
    label: '报关类型',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'select',
    key: 'customsClearId',
    label: '清关方式',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'select',
    key: 'exportReasonId',
    label: '出口原因',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'select',
    key: 'salesTermsId',
    label: '销售条款',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'number',
    key: 'productInsureFee',
    label: '报关保险费',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'number',
    key: 'productShiFee',
    label: '报关运费',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'select',
    key: 'taxPayType',
    label: '关税付款人',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'select',
    key: 'shipPayType',
    label: '运费付款人',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'eori',
    label: 'EORI/企业号',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'vatCompany',
    label: 'VAT公司名称',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'vat',
    label: 'VAT/税号',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'vatAddress',
    label: 'VAT公司地址',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'tag',
    label: '标签',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'textarea',
    key: 'outNote',
    label: '运单备注',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'note',
    label: '备注1',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'note2',
    label: '备注2',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'note3',
    label: '备注3',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'note4',
    label: '备注4',
    required: false,
    show: false
  },
  {
    fieldType: 'order',
    type: 'input',
    key: 'note5',
    label: '备注5',
    required: false,
    show: false
  },
  // 收件人字段
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'fbaCode',
    label: 'FBA仓库代码',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'name',
    label: '姓名',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'phone',
    label: '电话',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'company',
    label: '公司',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'zip',
    label: '邮编',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'city',
    label: '城市',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'state',
    label: '省州',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'address',
    label: '地址',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'address2',
    label: '地址2',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'address3',
    label: '地址3',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'select',
    key: 'country',
    label: '国家',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'mobile',
    label: '手机',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'email',
    label: '邮箱',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'input',
    key: 'taxNo',
    label: '税号',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'image',
    key: 'imgUrl1',
    label: '证照1',
    required: false,
    show: false
  },
  {
    fieldType: 'shipTo',
    type: 'image',
    key: 'imgUrl2',
    label: '证照2',
    required: false,
    show: false
  },
  // 发件人字段
  {
    fieldType: 'shipper',
    type: 'input',
    key: 'name',
    label: '姓名',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'input',
    key: 'phone',
    label: '电话',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'input',
    key: 'mobile',
    label: '手机',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'input',
    key: 'company',
    label: '公司',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'input',
    key: 'zip',
    label: '邮编',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'input',
    key: 'city',
    label: '城市',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'input',
    key: 'state',
    label: '省州',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'select',
    key: 'country',
    label: '国家',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'input',
    key: 'address',
    label: '地址',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'input',
    key: 'address2',
    label: '地址2',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'input',
    key: 'address3',
    label: '地址3',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'input',
    key: 'email',
    label: '邮箱',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'input',
    key: 'taxNo',
    label: '税号',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'image',
    key: 'imgUrl1',
    label: '证照1',
    required: false,
    show: false
  },
  {
    fieldType: 'shipper',
    type: 'image',
    key: 'imgUrl2',
    label: '证照2',
    required: false,
    show: false
  },
  // 子单号字段
  {
    fieldType: 'item',
    type: 'number',
    key: 'weight',
    label: '单件实重',
    required: false,
    show: false
  },
  {
    fieldType: 'item',
    type: 'number',
    key: 'length',
    label: '长(CM)',
    required: false,
    show: false
  },
  {
    fieldType: 'item',
    type: 'number',
    key: 'width',
    label: '宽(CM)',
    required: false,
    show: false
  },
  {
    fieldType: 'item',
    type: 'number',
    key: 'height',
    label: '高(CM)',
    required: false,
    show: false
  },
  {
    fieldType: 'item',
    type: 'number',
    key: 'totalLen',
    label: '单件三边和',
    required: false,
    show: false
  },
  {
    fieldType: 'item',
    type: 'number',
    key: 'wrapLen',
    label: '单件围长',
    required: false,
    show: false
  },
  {
    fieldType: 'item',
    type: 'number',
    key: 'volumeWeight',
    label: '单件材重',
    required: false,
    show: false
  },
  {
    fieldType: 'item',
    type: 'number',
    key: 'priceWeight',
    label: '计费重',
    required: false,
    show: false
  },
  {
    fieldType: 'item',
    type: 'input',
    key: 'no',
    label: '子内单号',
    required: false,
    show: false
  },
  {
    fieldType: 'item',
    type: 'input',
    key: 'channelNo',
    label: '子转单号',
    required: false,
    show: false
  },
  {
    fieldType: 'item',
    type: 'input',
    key: 'trackNo',
    label: '子派送号',
    required: false,
    show: false
  },
  {
    fieldType: 'item',
    type: 'input',
    key: 'customerNo',
    label: '客户子单号',
    required: false,
    show: false
  },
  {
    fieldType: 'item',
    type: 'input',
    key: 'note',
    label: '物品备注',
    required: false,
    show: false
  },
  // 物品信息字段
  {
    fieldType: 'product',
    type: 'input',
    key: 'nameCn',
    label: '中文名称',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'input',
    key: 'nameEn',
    label: '英文名称',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'input',
    key: 'hsCode',
    label: 'HS编码',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'number',
    key: 'price',
    label: '单价',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'number',
    key: 'num',
    label: '数量',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'number',
    key: 'totalPrice',
    label: '小计金额',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'select',
    key: 'currency',
    label: '币种',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'number',
    key: 'weight',
    label: '重量',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'select',
    key: 'unit',
    label: '单位',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'input',
    key: 'producer',
    label: '产地',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'input',
    key: 'brand',
    label: '品牌',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'input',
    key: 'material',
    label: '材质',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'input',
    key: 'use',
    label: '用途',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'input',
    key: 'model',
    label: '型号',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'input',
    key: 'standard',
    label: '规格',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'number',
    key: 'feeCustom',
    label: '关税',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'number',
    key: 'taxRate',
    label: '税率',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'input',
    key: 'sku',
    label: 'SKU',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'input',
    key: 'sellUrl',
    label: '销售链接',
    required: false,
    show: false
  },
  {
    fieldType: 'product',
    type: 'image',
    key: 'imgUrl',
    label: '产品图片',
    required: false,
    show: false
  }
];
