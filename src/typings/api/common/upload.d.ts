declare namespace Api {
  namespace Upload {
    /**
     * 上传目录（/upload?dest=<n>）
     *
     * 1-用户 2-公司 3-打印格式 4-导出格式 5-服务商 6-工单 7-运单 8-交易 9-问题件 10-临时
     */
    type Dest = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

    /** 单文件上传返回（/upload） */
    interface Result {
      /** 原始文件名 */
      name: string;
      /** 字节数 */
      size: number;
      /** 静态资源地址 */
      url: string;
    }
  }
}
