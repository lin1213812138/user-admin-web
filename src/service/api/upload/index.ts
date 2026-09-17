import { request } from '../../request';

/**
 * 通用文件上传（真实接口 /upload?dest=<1..10>；form-data 字段名 file）
 *
 * @param file 待上传文件
 * @param dest 上传目录（1-用户 2-公司 3-打印格式 4-导出格式 5-服务商 6-工单 7-运单 8-交易 9-问题件 10-临时）
 * @param onProgress 上传进度回调（0..100）
 */
export function fetchUpload(file: File, dest: Api.Upload.Dest, onProgress?: (percent: number) => void) {
  const data = new FormData();
  data.append('file', file);

  return request<Api.Upload.Result>({
    url: '/upload',
    method: 'post',
    params: { dest },
    data,
    onUploadProgress: onProgress
      ? event => {
          if (!event.total) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      : undefined
  });
}
