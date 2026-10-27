import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { mockApi } from '@/test/api'
import { buildRent } from '@/test/builders'
import { renderWithProviders } from '@/test/render'
import { RentsTable } from './rents-table'

const active = buildRent({ id: 1, book: { id: 1, code: 'LIT-1', title: 'Dom Casmurro' }, due_on: '2026-10-19' })
const returned = buildRent({
  id: 2,
  book: { id: 2, code: 'LIT-2', title: 'Vidas Secas' },
  status: 'returned',
  returned_at: '2026-10-15T10:00:00-03:00',
})

const row = (title: string) => screen.getByText(title).closest('tr')!

describe('RentsTable', () => {
  it('shows the due date of open loans and the return date of closed ones', () => {
    renderWithProviders(<RentsTable rents={[active, returned]} />)

    expect(within(row('Dom Casmurro')).getByText(/^até 19 de out/)).toBeInTheDocument()
    expect(within(row('Vidas Secas')).getByText(/^15 de out/)).toBeInTheDocument()
  })

  it('only offers to return books that are still out', () => {
    renderWithProviders(<RentsTable rents={[active, returned]} />)

    expect(within(row('Dom Casmurro')).getByRole('button', { name: 'Devolver' })).toBeInTheDocument()
    expect(within(row('Vidas Secas')).queryByRole('button', { name: 'Devolver' })).not.toBeInTheDocument()
  })

  it('registers a return', async () => {
    const api = mockApi({ 'PATCH /rents/1/return': { body: { ...active, status: 'returned' } } })
    renderWithProviders(<RentsTable rents={[active]} />)

    await userEvent.click(screen.getByRole('button', { name: 'Devolver' }))

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Devolução de "Dom Casmurro" registrada'))
    expect(api.requests('PATCH /rents/1/return')).toHaveLength(1)
  })

  it('shows the API error when the return fails', async () => {
    mockApi({ 'PATCH /rents/1/return': { status: 422, body: { error: 'Este empréstimo já foi devolvido' } } })
    renderWithProviders(<RentsTable rents={[active]} />)

    await userEvent.click(screen.getByRole('button', { name: 'Devolver' }))

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Este empréstimo já foi devolvido'))
  })
})
