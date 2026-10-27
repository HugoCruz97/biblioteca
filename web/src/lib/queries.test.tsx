import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '@/test/api'
import { buildBook, buildRent, buildStudent } from '@/test/builders'
import { createTestQueryClient } from '@/test/render'
import { keys, useLendBook, useReturnBook, useSaveBook, useSaveStudent } from './queries'

function setup<T>(hook: () => T) {
  const client = createTestQueryClient()
  for (const key of Object.values(keys)) client.setQueryData([...key, {}], [])
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return { client, result: renderHook(hook, { wrapper }).result }
}

const invalidated = (client: QueryClient) =>
  Object.entries(keys)
    .filter(([, key]) => client.getQueryState([...key, {}])?.isInvalidated)
    .map(([name]) => name)

describe('mutations', () => {
  it('creates a book with POST and updates one with PATCH', async () => {
    const api = mockApi({ 'POST /books': { status: 201, body: buildBook() }, 'PATCH /books/7': { body: buildBook() } })
    const { result } = setup(useSaveBook)
    const input = { code: 'X1', title: 'O Cortiço', author: 'Aluísio Azevedo', publisher: 'Garnier', quantity: 1 }

    await result.current.mutateAsync(input)
    await result.current.mutateAsync({ id: 7, ...input })

    expect(api.requests('POST /books')[0].body).toEqual({ book: input })
    expect(api.requests('PATCH /books/7')[0].body).toEqual({ book: input })
  })

  it('refreshes rents and books after lending or returning, since availability changes', async () => {
    mockApi({ 'POST /rents': { status: 201, body: buildRent() } })
    const { client, result } = setup(useLendBook)

    await result.current.mutateAsync({ book_id: 1, student_id: 2, rent_time: 7 })

    expect(invalidated(client)).toEqual(['books', 'rents'])
  })

  it('refreshes rents after a return', async () => {
    mockApi({ 'PATCH /rents/5/return': { body: buildRent({ status: 'returned' }) } })
    const { client, result } = setup(useReturnBook)

    await result.current.mutateAsync(5)

    expect(invalidated(client)).toEqual(['books', 'rents'])
  })

  it('refreshes rents after saving a student, since they show the student name', async () => {
    mockApi({ 'PATCH /students/3': { body: buildStudent() } })
    const { client, result } = setup(useSaveStudent)

    await result.current.mutateAsync({ id: 3, name: 'Ana', code: '1', classroom: '9º A' })

    expect(invalidated(client)).toEqual(['students', 'rents'])
  })
})
