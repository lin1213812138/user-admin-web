declare namespace Api {
  namespace PrintFormat {
    /** 打印模板记录 */
    interface Template {
      id: number;
      categoryId: number;
      name: string;
      labelSize: string;
      isDefault: Api.Common.EnableStatus;
      generatedCount: number;
      remark: string;
      lastEditor: string;
      editTime: string;
      /** 自研标签模板 JSON 字符串（LabelTemplate 序列化），未设计时为空串 */
      designJson: string;
      /** 纸张尺寸，取值与 labelSize 一致，如 100×150mm */
      paperSize: string;
    }

    /** 列表返回结构（对齐 useVxeTable transform） */
    interface List {
      records: Template[];
      total: number;
    }

    /** 新建/复制入参（复制时由调用方去掉 id） */
    type CreateParams = Omit<Template, 'id' | 'generatedCount' | 'lastEditor' | 'editTime'>;
  }
}
