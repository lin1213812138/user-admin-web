declare namespace Api {
  namespace InputFormat {
    /** 字段所属域（对齐后端 fieldType 数字语义：0-运单 1-收件人 2-发件人 3-物品 4-子件） */
    type FieldType = 0 | 1 | 2 | 3 | 4;

    /**
     * 录单格式字段项（fieldList 单项）
     *
     * 「是否显示」没有独立字段：**项存在于 fieldList 即表示显示**；
     * 索引签名兜底，客户端依赖的未知属性（keyMap/options/disabled/renderName 等）原样透传不丢。
     */
    interface Field {
      /** 字段展示文案 */
      label: string;
      /** 字段 key（域内唯一） */
      key: string;
      /** 字段所属域 */
      fieldType: FieldType;
      /** 是否必填 0-否 1-是 */
      required: Api.Common.EnableStatus;
      /** 控件类型（input 类字段无 type） */
      type?: string;
      /** 下拉数据源取值字段映射 */
      keyMap?: { label: string; value: string };
      /** 固定选项 */
      options?: Array<{ label: string; value: string | number }>;
      /** 客户端固定字段（本地编辑器不允许取消显示） */
      disabled?: boolean;
      /** 客户端渲染组件名 */
      renderName?: string;
      /** 格式化枚举 key */
      formatKey?: string;
      width?: number;
      precision?: number;
      [key: string]: unknown;
    }

    /** 录单格式（后端 OrderTemplate 文档） */
    interface OrderTemplate {
      _id: string;
      /** 格式名称 */
      name: string;
      /** 关联收货渠道 */
      channelIds: string[];
      /** 是否内置 0-否 1-是 */
      buildIn: Api.Common.EnableStatus;
      /** 客户可用 0-否 1-是 */
      customerEnable: Api.Common.EnableStatus;
      /** 排序 */
      order: number;
      /** 是否默认 0-否 1-是 */
      isDefault: Api.Common.EnableStatus;
      /** 状态 0-停用 1-启用 */
      status: Api.Common.EnableStatus;
      /** 备注 */
      note?: string;
      /** 字段列表（query 不返回，get 返回） */
      fieldList?: Field[];
      creatorId?: string;
      creator?: string;
      updateId?: string;
      updateBy?: string;
      /** 毫秒时间戳 */
      createDate?: number;
      updateDate?: number;
    }

    /**
     * 列表快捷操作入参（部分更新：停用/启用、设为默认）
     *
     * `name` 必须回传：后端 updateCommon 以 name 为唯一键，body.name 与库中值不相等时会触发
     * checkUniqField，而 `$in([undefined])` 长度为 1 时退化为 undefined 条件（mongoose 视作空查询，
     * findOne({}) 命中任意文档）会误报「已存在」。
     */
    interface PatchParams {
      _id: string;
      name: string;
      status?: Api.Common.EnableStatus;
      isDefault?: Api.Common.EnableStatus;
    }

    /** 列表返回结构（wms-user ret:{ list, total }） */
    interface List {
      list: OrderTemplate[];
      total: number;
    }

    /** 列表查询参数（/order-template/query） */
    interface SearchParams {
      /** 管理端标记：不传后端会强制 status=1 并按角色可见格式过滤 */
      scene: 1;
      page: number;
      size: number;
      /** 其他过滤条件 */
      where?: Record<string, unknown>;
    }

    /** 新增/编辑入参（create/update 共用；update 额外带 _id） */
    interface SaveParams {
      name: string;
      status: Api.Common.EnableStatus;
      customerEnable: Api.Common.EnableStatus;
      isDefault: Api.Common.EnableStatus;
      order: number;
      note: string;
      /** 关联收货渠道（本期无编辑入口，原样透传） */
      channelIds: string[];
      /** 字段映射（显示=项存在，必填=required 1） */
      fieldList: Field[];
    }
  }
}
