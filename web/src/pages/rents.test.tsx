import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { mockApi } from '@/test/api'
import { buildRent } from '@/test/builders'
import { renderWithProviders } from '@/test/render'
import { RentsPage } from './rents'

function setup(route = '/emprestimos') {
  const api = mockApi({
    'GET /rents': ({ query }) => ({ body: query.status === 'late' ? [buildRent({ status: 'late', days_late: 2 })] : [] }),
    'GET /students': { body: [] },
    'GET /books': { body: [] },
  })
  renderWithProviders(<RentsPage />, { route })
  return { lastQuery: () => api.requests('GET /rents').at(-1)?.query }
}

describe('RentsPage', () => {
  it('starts on the loans in progress', async () => {
    const { lastQuery } = setup()

    expect(screen.getByRole('tab', { name: 'Em andamento' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('Nenhum empréstimo em andamento.')).toBeInTheDocument()
    expect(lastQuery()).toEqual({ status: 'active' })
  })

  it('opens the tab named in the URL', async () => {
    const { lastQuery } = setup('/emprestimos?status=late')

    expect(screen.getByRole('tab', { name: 'Atrasados' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('Atrasado · 2 dias')).toBeInTheDocument()
    expect(lastQuery()).toEqual({ status: 'late' })
  })

  it('switches tabs', async () => {
    const { lastQuery } = setup()

    await userEvent.click(screen.getByRole('tab', { name: 'Todos' }))
    await waitFor(() => expect(lastQuery()).toEqual({}))
    expect(screen.getByRole('tab', { name: 'Todos' })).toHaveAttribute('aria-selected', 'true')

    await userEvent.click(screen.getByRole('tab', { name: 'Devolvidos' }))
    await waitFor(() => expect(lastQuery()).toEqual({ status: 'returned' }))
    expect(await screen.findByText('Nenhuma devolução registrada.')).toBeInTheDocument()
  })

  it('opens the loan form', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: 'Novo empréstimo' }))

    expect(screen.getByRole('dialog', { name: 'Novo empréstimo' })).toBeInTheDocument()
  })
})
