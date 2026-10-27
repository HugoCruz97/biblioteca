import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { mockApi } from '@/test/api'
import { buildStudent } from '@/test/builders'
import { renderWithProviders } from '@/test/render'
import { StudentsPage } from './students'

describe('StudentsPage', () => {
  it('lists and searches students', async () => {
    const api = mockApi({
      'GET /students': ({ query }) => ({
        body: query.q ? [] : [buildStudent({ name: 'Ana Lima', code: 'MAT-1', classroom: '9º A' })],
      }),
    })
    renderWithProviders(<StudentsPage />)

    const row = (await screen.findByText('Ana Lima')).closest('tr')!
    expect(within(row).getByText('MAT-1')).toBeInTheDocument()
    expect(within(row).getByText('9º A')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox'), 'zé')
    expect(await screen.findByText('Nenhum aluno encontrado para essa busca.')).toBeInTheDocument()
    await waitFor(() => expect(api.requests('GET /students').at(-1)?.query).toEqual({ q: 'zé' }))
  })

  it('opens an empty form for a new student', async () => {
    mockApi({ 'GET /students': { body: [] } })
    renderWithProviders(<StudentsPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Novo aluno' }))

    const dialog = screen.getByRole('dialog', { name: 'Novo aluno' })
    expect(within(dialog).getByLabelText('Nome')).toHaveValue('')
  })

  it('keeps a student with rents and explains why', async () => {
    mockApi({
      'GET /students': { body: [buildStudent({ id: 3, name: 'Ana Lima' })] },
      'DELETE /students/3': { status: 409, body: { error: 'Não é possível excluir o registro pois existem empréstimos dependentes' } },
    })
    renderWithProviders(<StudentsPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Ana Lima' }))
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Excluir aluno?' })).getByRole('button', { name: 'Excluir' }))

    await vi.waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Não é possível excluir o registro pois existem empréstimos dependentes'),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
