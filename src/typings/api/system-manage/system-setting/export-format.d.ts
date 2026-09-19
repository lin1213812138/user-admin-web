declare namespace Api {
  namespace ExportFormat {
    /** 模板类别：0-系统列表 1-发货清单 2-应收账单 3-应付账单 4-提单装箱单 5-提单发票 6-提单文件 7-清关资料 8-运单详情 */
    type TemplateType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

    /** 单元格字段（上传解析产物：infoList 项 / subList[].fieldList 项） */
    interface CellField {
      /** 行 */
      row: number;
      /** 列 */
      column: number;
      /** 字段 */
      fields: string[];
      /** 内容（可含字段占位符） */
      content: string;
      /** 格式化方法（fm1 / fm2） */
      formats?: (string | undefined)[];
    }

    /** 列表字段（上传解析产物：fieldList / subFieldList 项） */
    interface ListField {
      /** 列 */
      column: number;
      /** 列名（存在子列表时由后端补全） */
      columnName?: string;
      /** 字段 */
      fields: string[];
      /** 内容 */
      content: string;
    }

    /** 子列表（上传解析产物：subList 项，$ 标记） */
    interface SubList {
      /** 子列表字段 */
      field: string;
      fieldList: CellField[];
    }

    /** 条码（上传解析产物：barcodeList 项，% / & 标记） */
    interface Barcode {
      /** 位置，如 A1 */
      pos: string;
      /** 字段 */
      field: string;
      /** 前缀（rationalizedCodabar 用） */
      prefix?: string;
      /** 后缀 */
      suffix?: string;
      /** 条码类型 */
      barcodeType?: string;
      /** 是否显示文本 0-不显示 1-显示 */
      text?: number;
    }

    /** 子列表条码（上传解析产物：subBarcodeList 项，列表字段上的 % / & 标记） */
    interface SubBarcode {
      /** 开始行 */
      startRow?: number;
      /** 列名 */
      colName?: string;
      /** 字段 */
      field: string;
      /** 是否显示文本 0-不显示 1-显示 */
      text?: number;
    }

    /** 上传解析出的字段清单（ExportTemplate 的解析类字段集合） */
    interface ParsedFields {
      /** 列表字段行 */
      fieldRow?: number;
      /** 信息字段列表 */
      infoList?: CellField[];
      /** 列表字段 */
      fieldList?: ListField[];
      /** 子列表字段 */
      subFieldList?: ListField[];
      /** 子列表 */
      subList?: SubList[];
      /** 条码字段 */
      barcodeList?: Barcode[];
      /** 子列表条码 */
      subBarcodeList?: SubBarcode[];
    }

    /** 导出模板记录（对齐后端 ExportTemplate） */
    interface Template extends ParsedFields {
      _id: string;
      /** 模板名称（全局唯一） */
      name: string;
      /** 模板类别 */
      templateType: number;
      /** 模板文件名 */
      file: string;
      /** 模板文件地址 */
      fileUrl: string;
      /** 表头起始单元格 */
      thPos?: string;
      /** 数据起始单元格 */
      tdPos?: string;
      /** 备注 */
      note?: string;
      creatorId?: string;
      /** 创建人名称 */
      creator?: string;
      updateId?: string;
      /** 修改人名称 */
      updateBy?: string;
      /** 创建时间（毫秒） */
      createDate?: number;
      /** 更新时间（毫秒） */
      updateDate?: number;
    }

    /** 列表查询入参（/export-template/query；keyword 按名称模糊，后端 keywordFields: ['name']） */
    interface SearchParams {
      page?: number;
      size?: number;
      keyword?: string;
      where?: {
        templateType?: number;
      };
    }

    /** 列表返回结构（后端 ret:{ list, total }，list 不含 infoList/fieldList/subList） */
    interface List {
      list: Template[];
      total: number;
    }

    /** 上传解析返回（/export-template/upload?dest=4） */
    interface UploadResult extends ParsedFields {
      /** 模板文件名（上传时的原始名） */
      file: string;
      /** 模板文件地址（静态 http 地址） */
      fileUrl: string;
    }

    /** 新建 / 更新入参（create 必填 name/templateType/file/fileUrl；update 需带 _id，未提交字段保持原值） */
    interface SaveParams extends ParsedFields {
      _id?: string;
      name: string;
      templateType: number;
      file: string;
      fileUrl: string;
      thPos?: string;
      tdPos?: string;
      note?: string;
    }
  }
}
