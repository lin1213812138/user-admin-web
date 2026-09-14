import { request } from '../request';
import {
  mockChannelQuoteCreate,
  mockChannelQuoteDelete,
  mockChannelQuoteList,
  mockChannelQuoteUpdate
} from './mock-channel-quote';

/** get channel quote list (DEV: mock; PROD: /channel-quote/:archive/list) */
export function fetchGetChannelQuoteList<T extends Api.ChannelQuote.ChannelQuoteRow>(
  archive: Api.ChannelQuote.ChannelQuoteArchiveKey,
  params: Api.ChannelQuote.ChannelQuoteSearchParams
) {
  if (import.meta.env.DEV) {
    return mockChannelQuoteList<T>(archive, params) as unknown as Promise<Api.ChannelQuote.ChannelQuoteList<T>>;
  }
  return request<Api.ChannelQuote.ChannelQuoteList<T>>({
    url: `/channel-quote/${archive}/list`,
    method: 'post',
    data: params
  }) as unknown as Promise<Api.ChannelQuote.ChannelQuoteList<T>>;
}

/** create channel quote item (DEV: mock; PROD: /channel-quote/:archive/create) */
export function fetchCreateChannelQuote<T extends Api.ChannelQuote.ChannelQuoteRow>(
  archive: Api.ChannelQuote.ChannelQuoteArchiveKey,
  params: Partial<T>
) {
  if (import.meta.env.DEV) {
    return mockChannelQuoteCreate<T>(archive, params) as unknown as Promise<T>;
  }
  return request<T>({
    url: `/channel-quote/${archive}/create`,
    method: 'post',
    data: params
  }) as unknown as Promise<T>;
}

/** update channel quote item (DEV: mock; PROD: /channel-quote/:archive/update) */
export function fetchUpdateChannelQuote<T extends Api.ChannelQuote.ChannelQuoteRow>(
  archive: Api.ChannelQuote.ChannelQuoteArchiveKey,
  params: T
) {
  if (import.meta.env.DEV) {
    return mockChannelQuoteUpdate<T>(archive, params) as unknown as Promise<T>;
  }
  return request<T>({
    url: `/channel-quote/${archive}/update`,
    method: 'post',
    data: params
  }) as unknown as Promise<T>;
}

/** delete channel quote items by ids (DEV: mock; PROD: /channel-quote/:archive/delete) */
export function fetchDeleteChannelQuote(archive: Api.ChannelQuote.ChannelQuoteArchiveKey, ids: number[]) {
  if (import.meta.env.DEV) {
    return mockChannelQuoteDelete(archive, ids) as unknown as Promise<boolean>;
  }
  return request<boolean>({
    url: `/channel-quote/${archive}/delete`,
    method: 'post',
    data: { ids }
  }) as unknown as Promise<boolean>;
}
