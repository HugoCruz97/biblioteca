import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './api'

function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('api', () => {
  it('sends query params, skipping empty values', async () => {
    const fetchMock = mockFetch(200, [])
    await api.get('/books', { q: 'dom', available: true, extra: '' })

    const url = fetchMock.mock.calls[0][0] as URL
    expect(url.pathname).toBe('/api/v1/books')
    expect(Object.fromEntries(url.searchParams)).toEqual({ q: 'dom', available: 'true' })
  })

  it('sends JSON bodies', async () => {
    const fetchMock = mockFetch(201, { id: 1 })
    await expect(api.post('/books', { book: { title: 'x' } })).resolves.toEqual({ id: 1 })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"book":{"title":"x"}}')
  })

  it('returns undefined for 204', async () => {
    mockFetch(204)
    await expect(api.delete('/books/1')).resolves.toBeUndefined()
  })

  it('turns error responses into ApiError with field details', async () => {
    mockFetch(422, { error: 'Código já está em uso', details: { code: ['já está em uso'] } })

    const error = await api.post('/books', {}).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 422, message: 'Código já está em uso', details: { code: ['já está em uso'] } })
  })

  it('reports network failures as ApiError with status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(api.get('/books')).rejects.toMatchObject({ status: 0 })
  })
})
