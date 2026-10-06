import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BookForm } from './book-form'

function renderForm() {
  const onDone = vi.fn()
  render(
    <QueryClientProvider client={new QueryClient()}>
      <BookForm onDone={onDone} />
    </QueryClientProvider>,
  )
  return { onDone }
}

afterEach(() => vi.unstubAllGlobals())

describe('BookForm', () => {
  it('validates required fields before calling the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar livro' }))

    expect(await screen.findAllByText('Campo obrigatório')).toHaveLength(4)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows API validation errors on the matching field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'Código já está em uso', details: { code: ['já está em uso'] } }), {
          status: 422,
        }),
      ),
    )
    const { onDone } = renderForm()

    await userEvent.type(screen.getByLabelText('Código'), 'LIT-001')
    await userEvent.type(screen.getByLabelText('Título'), 'Dom Casmurro')
    await userEvent.type(screen.getByLabelText('Autor'), 'Machado de Assis')
    await userEvent.type(screen.getByLabelText('Editora'), 'Garnier')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar livro' }))

    expect(await screen.findByText('já está em uso')).toBeInTheDocument()
    expect(screen.getByLabelText('Código')).toHaveAttribute('aria-invalid', 'true')
    expect(onDone).not.toHaveBeenCalled()
  })
})
