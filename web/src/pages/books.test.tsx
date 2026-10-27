import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { mockApi } from '@/test/api'
import { buildBook } from '@/test/builders'
import { renderWithProviders } from '@/test/render'
import type { Book } from '@/lib/types'
import { BooksPage } from './books'

describe('BooksPage', () => {
  it('lists books with their availability', async () => {
    mockApi({ 'GET /books': { body: [buildBook({ title: 'Dom Casmurro', quantity: 2, available: 1 })] } })
    renderWithProviders(<BooksPage />)

    expect(await screen.findByText('Dom Casmurro')).toBeInTheDocument()
    expect(screen.getByText('1 de 2')).toBeInTheDocument()
  })

  it('shows an empty state', async () => {
    mockApi({ 'GET /books': { body: [] } })
    renderWithProviders(<BooksPage />)

    expect(await screen.findByText('Nenhum livro cadastrado ainda.')).toBeInTheDocument()
  })

  it('shows the API error when the list fails to load', async () => {
    mockApi({ 'GET /books': { status: 500, body: { error: 'Erro no servidor' } } })
    renderWithProviders(<BooksPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Erro no servidor')
  })

  it('searches once the user stops typing and filters available books', async () => {
    const api = mockApi({ 'GET /books': { body: [] } })
    renderWithProviders(<BooksPage />)
    const lastQuery = () => api.requests('GET /books').at(-1)?.query

    await userEvent.type(screen.getByRole('searchbox'), 'dom')
    await waitFor(() => expect(lastQuery()).toEqual({ q: 'dom' }))
    expect(api.requests('GET /books').map((r) => r.query.q)).not.toContain('d')
    expect(await screen.findByText('Nenhum livro encontrado para essa busca.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Só disponíveis' }))
    await waitFor(() => expect(lastQuery()).toEqual({ q: 'dom', available: 'true' }))
  })

  it('opens the form with the book to edit', async () => {
    mockApi({ 'GET /books': { body: [buildBook({ title: 'Dom Casmurro' })] } })
    renderWithProviders(<BooksPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Editar Dom Casmurro' }))

    const dialog = screen.getByRole('dialog', { name: 'Editar livro' })
    expect(within(dialog).getByLabelText('Título')).toHaveValue('Dom Casmurro')
  })

  it('deletes a book after confirmation', async () => {
    let books: Book[] = [buildBook({ id: 1, title: 'Dom Casmurro' })]
    mockApi({
      'GET /books': () => ({ body: books }),
      'DELETE /books/1': () => {
        books = []
        return { status: 204 }
      },
    })
    renderWithProviders(<BooksPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Dom Casmurro' }))
    const dialog = screen.getByRole('dialog', { name: 'Excluir livro?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByText('Nenhum livro cadastrado ainda.')).toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledWith('Livro excluído')
  })

  it('keeps a book with rents and explains why', async () => {
    mockApi({
      'GET /books': { body: [buildBook({ id: 1, title: 'Dom Casmurro' })] },
      'DELETE /books/1': { status: 409, body: { error: 'Não é possível excluir o registro pois existem empréstimos dependentes' } },
    })
    renderWithProviders(<BooksPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Dom Casmurro' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Não é possível excluir o registro pois existem empréstimos dependentes'),
    )
    expect(screen.getByText('Dom Casmurro')).toBeInTheDocument()
  })
})
