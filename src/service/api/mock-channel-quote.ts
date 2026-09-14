type RowFactory = (i: number) => Api.ChannelQuote.ChannelQuoteRow;

const factories: Record<Api.ChannelQuote.ChannelQuoteArchiveKey, RowFactory> = {
  receive: i => ({
    id: i,
    code: `RCV${String(i).padStart(4, '0')}`,
    name: `收货渠道${i}`,
    status: i % 5 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-01 09:00:00`
  }),
  ship: i => ({
    id: i,
    code: `SHP${String(i).padStart(4, '0')}`,
    name: `发货渠道${i}`,
    status: i % 4 === 0 ? 0 : 1,
    remark: '',
    createTime: `2026-0${(i % 9) + 1}-02 10:00:00`
  })
};

const keys = Object.keys(factories) as Api.ChannelQuote.ChannelQuoteArchiveKey[];

const datasets: Record<Api.ChannelQuote.ChannelQuoteArchiveKey, Api.ChannelQuote.ChannelQuoteRow[]> =
  Object.fromEntries(keys.map(key => [key, Array.from({ length: 18 }, (_, k) => factories[key](k + 1))])) as Record<
    Api.ChannelQuote.ChannelQuoteArchiveKey,
    Api.ChannelQuote.ChannelQuoteRow[]
  >;

const idSeq: Record<Api.ChannelQuote.ChannelQuoteArchiveKey, number> = Object.fromEntries(
  keys.map(key => [key, 19])
) as Record<Api.ChannelQuote.ChannelQuoteArchiveKey, number>;

/** Simulated network latency so table loading / button loading states stay visible in DEV */
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const LIST_DELAY_MS = 400;
const MUTATE_DELAY_MS = 200;

export async function mockChannelQuoteList<T extends Api.ChannelQuote.ChannelQuoteRow>(
  archive: Api.ChannelQuote.ChannelQuoteArchiveKey,
  params: Api.ChannelQuote.ChannelQuoteSearchParams
): Promise<Api.ChannelQuote.ChannelQuoteList<T>> {
  await delay(LIST_DELAY_MS);
  let rows = datasets[archive] as T[];
  const { keyword, status, current, size } = params;
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    rows = rows.filter(r => {
      const rec = r as unknown as Record<string, unknown>;
      return `${rec.name ?? ''} ${rec.code ?? ''}`.toLowerCase().includes(kw);
    });
  }
  if (status) {
    rows = rows.filter(r => r.status === status);
  }
  const total = rows.length;
  const start = (current - 1) * size;
  return { records: rows.slice(start, start + size), total };
}

export async function mockChannelQuoteCreate<T extends Api.ChannelQuote.ChannelQuoteRow>(
  archive: Api.ChannelQuote.ChannelQuoteArchiveKey,
  params: Partial<T>
): Promise<T> {
  await delay(MUTATE_DELAY_MS);
  const id = idSeq[archive]++;
  const row = { ...(params as object), id } as T;
  datasets[archive].push(row as unknown as Api.ChannelQuote.ChannelQuoteRow);
  return row;
}

export async function mockChannelQuoteUpdate<T extends Api.ChannelQuote.ChannelQuoteRow>(
  archive: Api.ChannelQuote.ChannelQuoteArchiveKey,
  params: T
): Promise<T> {
  await delay(MUTATE_DELAY_MS);
  const list = datasets[archive];
  const idx = list.findIndex(r => r.id === params.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...(params as object) } as Api.ChannelQuote.ChannelQuoteRow;
  }
  return list[idx] as unknown as T;
}

export async function mockChannelQuoteDelete(
  archive: Api.ChannelQuote.ChannelQuoteArchiveKey,
  ids: number[]
): Promise<boolean> {
  await delay(MUTATE_DELAY_MS);
  const set = new Set(ids);
  datasets[archive] = datasets[archive].filter(r => !set.has(r.id));
  return true;
}
