declare namespace Api {
  namespace ExportFormat {
    /** 导出模板记录 */
    interface Template {
      id: number;
      categoryId: number;
      name: string;
      /** 使用范围 */
      scope: string;
      /** 上传的模板文件名（DEV 仅记录名，真实上传待后端） */
      fileName: string;
      remark: string;
      lastEditor: string;
      editTime: string;
    }

    /** 列表返回结构（对齐 useVxeTable transform） */
    interface List {
      records: Template[];
      total: number;
    }

    /** 新建/编辑入参（调用方去掉 id / lastEditor / editTime） */
    type CreateParams = Omit<Template, 'id' | 'lastEditor' | 'editTime'>;
  }
}
