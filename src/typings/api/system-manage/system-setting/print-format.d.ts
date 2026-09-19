declare namespace Api {
  namespace PrintFormat {
    /** 模板类型 0-收货标签 1-发货标签 2-派送标签 3-发货发票 4-派送发票 5-提单标签 */
    type TemplateType = 0 | 1 | 2 | 3 | 4 | 5;

    /** 模板格式 0-pdf 1-excel */
    type TemplateMode = 0 | 1;

    /** 标签尺寸 0-50*30 1-100*100 2-100*150 3-100*200 4-210*297(A4) 5-自定义 */
    type SizeType = 0 | 1 | 2 | 3 | 4 | 5;

    /** 打印模板（wms-user 真实实体，字段名以后端 Schema 为准） */
    interface Template {
      /** 主键（36 位字符串 uuid） */
      _id: string;
      /** 模板名称，全局唯一 */
      name: string;
      /** 模板类型 */
      templateType: TemplateType;
      /** 模板格式 */
      templateMode: TemplateMode;
      /** 标签尺寸 */
      sizeType: SizeType;
      /** 宽度（mm）；sizeType=5 自定义时以表单值为准，其余由后端按固定尺寸回填 */
      width?: number;
      /** 高度（mm） */
      height?: number;
      /** 模板（旧 pdf 模板文件名） */
      file?: string;
      /** 模板文件地址（旧 pdf 模板） */
      fileUrl?: string;
      /** 是否默认 0-否 1-是 */
      isDefault: Api.Common.EnableStatus;
      /** 已生成标签 0-否 1-是 */
      generate?: 0 | 1;
      /** 标签设计（设计器 JSON 对象；旧数据可能是 JSON 字符串，读取侧需兼容） */
      design?: Record<string, unknown> | string | null;
      /** 备注 */
      note?: string;
      /** 创建人 id */
      creatorId?: string;
      /** 创建人名称 */
      creator?: string;
      /** 修改人 id */
      updateId?: string;
      /** 修改人名称 */
      updateBy?: string;
      /** 创建时间（毫秒时间戳） */
      createDate?: number;
      /** 更新时间（毫秒时间戳） */
      updateDate?: number;
    }

    /** 列表返回结构（wms-user 返回 ret：{ list, total }；列表项不含 design 等大字段） */
    type List = {
      list: Template[];
      total: number;
    };

    /** 列表查询参数（/print-template/query） */
    type SearchParams = {
      page: number;
      size: number;
      /** 模板名称模糊搜索 */
      keyword?: string;
      /** 其他查询条件（模板类型精确过滤） */
      where?: {
        templateType?: TemplateType;
      };
    };

    /** 新增/更新参数（templateType/templateMode/sizeType 为后端必填；sizeType=5 时必传宽高） */
    type SaveParams = {
      name: string;
      templateType: TemplateType;
      templateMode: TemplateMode;
      sizeType: SizeType;
      /** sizeType=5 自定义时必传 */
      width?: number;
      height?: number;
      isDefault: Api.Common.EnableStatus;
      note?: string;
    };

    /** 更新参数（/print-template/update 必填 _id） */
    type UpdateParams = SaveParams & { _id: string };

    /** 复制入参（/print-template/copy/create；design 由服务端从原模板复制，无需前端传） */
    type CopyParams = {
      copyId: string;
      pdfTemplate: SaveParams;
    };

    /** 保存设计入参（走 /print-template/update；design 顶层带 mm 宽高与后端 setGenerate 对齐） */
    type SaveDesignParams = {
      _id: string;
      templateType: TemplateType;
      templateMode: TemplateMode;
      sizeType: SizeType;
      design: Record<string, unknown>;
      width: number;
      height: number;
    };
  }
}
