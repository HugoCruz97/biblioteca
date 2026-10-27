import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi } from '@/test/api'
import { buildBook, buildRent, buildStudent } from '@/test/builders'
import { renderWithProviders } from '@/test/render'
import { MAX_DAYS, RentForm } from './rent-form'

const student = buildStudent({ id: 1, name: 'Ana Lima', classroom: '9º A' })
const book = buildBook({ id: 2, title: 'Dom Casmurro', available: 3 })

function setup(routes: Parameters<typeof mockApi>[0] = {}) {
  const api = mockApi({ 'GET /students': { body: [student] }, 'GET /books': { body: [book] }, ...routes })
  const onDone = vi.fn()
  renderWithProviders(<RentForm onDone={onDone} />)
  return { api, onDone }
}

async function choose() {
  await userEvent.selectOptions(await screen.findByLabelText('Aluno'), await screen.findByRole('option', { name: 'Ana Lima · 9º A' }))
  await userEvent.selectOptions(screen.getByLabelText('Livro'), await screen.findByRole('option', { name: 'Dom Casmurro (3 disp.)' }))
}

afterEach(() => vi.useRealTimers())

describe('RentForm', () => {
  it('offers only books with copies available', async () => {
    const { api } = setup()

    expect(await screen.findByRole('option', { name: 'Dom Casmurro (3 disp.)' })).toBeInTheDocument()
    expect(api.requests('GET /books')[0].query).toEqual({ available: 'true' })
  })

  it('says when there is no book to lend', async () => {
    setup({ 'GET /books': { body: [] } })

    expect(await screen.findByText('Nenhum livro com exemplares disponíveis.')).toBeInTheDocument()
  })

  it('requires a student and a book', async () => {
    const { api } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Registrar empréstimo' }))

    expect(await screen.findByText('Escolha um aluno')).toBeInTheDocument()
    expect(screen.getByText('Escolha um livro')).toBeInTheDocument()
    expect(api.requests('POST /rents')).toHaveLength(0)
  })

  it(`limits the loan to ${MAX_DAYS} days`, async () => {
    setup()
    await choose()

    await userEvent.clear(screen.getByLabelText('Prazo (dias)'))
    await userEvent.type(screen.getByLabelText('Prazo (dias)'), String(MAX_DAYS + 1))
    await userEvent.click(screen.getByRole('button', { name: 'Registrar empréstimo' }))

    expect(await screen.findByText(`Máximo de ${MAX_DAYS} dias`)).toBeInTheDocument()
  })

  it('previews the due date as the term changes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-12T12:00:00-03:00'))
    setup()

    expect(screen.getByText(/Devolução até 19 de out/)).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Prazo (dias)'))
    await userEvent.type(screen.getByLabelText('Prazo (dias)'), '20')
    expect(screen.getByText(/Devolução até 01 de nov/)).toBeInTheDocument()
  })

  it('lends the book', async () => {
    const rent = buildRent({ book: { id: 2, code: 'B-2', title: 'Dom Casmurro' }, student })
    const { api, onDone } = setup({ 'POST /rents': { status: 201, body: rent } })

    await choose()
    await userEvent.click(screen.getByRole('button', { name: 'Registrar empréstimo' }))

    await vi.waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(api.requests('POST /rents')[0].body).toEqual({ rent: { student_id: 1, book_id: 2, rent_time: 7 } })
    expect(toast.success).toHaveBeenCalledWith('"Dom Casmurro" emprestado para Ana Lima')
  })

  it('shows why the API refused the loan', async () => {
    const { onDone } = setup({
      'POST /rents': {
        status: 422,
        body: { error: 'Livro já está emprestado para este aluno', details: { book: ['já está emprestado para este aluno'] } },
      },
    })

    await choose()
    await userEvent.click(screen.getByRole('button', { name: 'Registrar empréstimo' }))

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Livro já está emprestado para este aluno'))
    expect(onDone).not.toHaveBeenCalled()
  })
})
