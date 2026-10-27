import { vi } from 'vitest'

type Reply = { status?: number; body?: unknown }
type Handler = Reply | ((request: { query: Record<string, string>; body: unknown }) => Reply)

const pathOf = (url: URL) => url.pathname.replace(/^\/api\/v1/, '')
const parseBody = (init?: RequestInit) => (typeof init?.body === 'string' ? JSON.parse(init.body) : undefined)

function respond({ status = 200, body }: Reply) {
  return new Response(status === 204 || body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Stubs `fetch` with a fake API. Routes are keyed by "METHOD /path", without the /api/v1 prefix:
 *
 *   mockApi({ 'GET /books': { body: [book] }, 'DELETE /books/1': { status: 204 } })
 *
 * Requests with no matching route get a 501 so the test fails with a readable message.
 */
export function mockApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn(async (url: URL, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${pathOf(url)}`
    const handler = routes[key]
    if (!handler) return respond({ status: 501, body: { error: `No mock for ${key}` } })

    const reply =
      typeof handler === 'function' ? handler({ query: Object.fromEntries(url.searchParams), body: parseBody(init) }) : handler
    return respond(reply)
  })
  vi.stubGlobal('fetch', fetchMock)

  return {
    /** Requests already made to a route, oldest first. */
    requests(key: string) {
      return fetchMock.mock.calls
        .filter(([url, init]) => `${init?.method ?? 'GET'} ${pathOf(url)}` === key)
        .map(([url, init]) => ({ query: Object.fromEntries(url.searchParams), body: parseBody(init) }))
    },
  }
}
