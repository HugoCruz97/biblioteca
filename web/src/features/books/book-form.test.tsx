import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { mockApi } from '@/test/api'
import { buildBook } from '@/test/builders'
import { renderWithProviders } from '@/test/render'
import type { Book } from '@/lib/types'
import { BookForm } from './book-form'

function renderForm(book?: Book) {
  const onDone = vi.fn()
  renderWithProviders(<BookForm book={book} onDone={onDone} />)
  return { onDone }
}

async function fillRequired() {
  await userEvent.type(screen.getByLabelText('Código'), 'LIT-001')
  await userEvent.type(screen.getByLabelText('Título'), 'Dom Casmurro')
  await userEvent.type(screen.getByLabelText('Autor'), 'Machado de Assis')
  await userEvent.type(screen.getByLabelText('Editora'), 'Garnier')
}

describe('BookForm', () => {
  it('validates required fields before calling the API', async () => {
    const api = mockApi({})
    renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar livro' }))

    expect(await screen.findAllByText('Campo obrigatório')).toHaveLength(4)
    expect(api.requests('POST /books')).toHaveLength(0)
  })

  it('validates the number of copies', async () => {
    renderForm()
    const quantity = screen.getByLabelText('Exemplares')

    await userEvent.clear(quantity)
    await userEvent.type(quantity, '-1')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar livro' }))
    expect(await screen.findByText('Não pode ser negativo')).toBeInTheDocument()

    await userEvent.clear(quantity)
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar livro' }))
    expect(await screen.findByText('Informe um número')).toBeInTheDocument()
  })

  it('creates a book', async () => {
    const api = mockApi({ 'POST /books': { status: 201, body: buildBook() } })
    const { onDone } = renderForm()

    await fillRequired()
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar livro' }))

    await vi.waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(api.requests('POST /books')[0].body).toEqual({
      book: { code: 'LIT-001', title: 'Dom Casmurro', author: 'Machado de Assis', publisher: 'Garnier', quantity: 1, description: '' },
    })
    expect(toast.success).toHaveBeenCalledWith('Livro cadastrado')
  })

  it('edits an existing book', async () => {
    const book = buildBook({ id: 9, title: 'Dom Casmurro', quantity: 2 })
    const api = mockApi({ 'PATCH /books/9': { body: book } })
    const { onDone } = renderForm(book)

    expect(screen.getByLabelText('Título')).toHaveValue('Dom Casmurro')
    await userEvent.clear(screen.getByLabelText('Exemplares'))
    await userEvent.type(screen.getByLabelText('Exemplares'), '5')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await vi.waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(api.requests('PATCH /books/9')[0].body).toMatchObject({ book: { quantity: 5 } })
  })

  it('shows API validation errors on the matching field', async () => {
    mockApi({
      'POST /books': { status: 422, body: { error: 'Código já está em uso', details: { code: ['já está em uso'] } } },
    })
    const { onDone } = renderForm()

    await fillRequired()
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar livro' }))

    expect(await screen.findByText('já está em uso')).toBeInTheDocument()
    expect(screen.getByLabelText('Código')).toHaveAttribute('aria-invalid', 'true')
    expect(onDone).not.toHaveBeenCalled()
  })
})
