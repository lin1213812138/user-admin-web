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
