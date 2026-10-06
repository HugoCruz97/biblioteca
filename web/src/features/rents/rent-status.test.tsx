import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RentStatusBadge } from './rent-status'

describe('RentStatusBadge', () => {
  it('shows active loans as in progress', () => {
    render(<RentStatusBadge rent={{ status: 'active', days_late: 0, delay_time: 0 }} />)
    expect(screen.getByText('Em andamento')).toBeInTheDocument()
  })

  it('shows how many days a loan is late', () => {
    render(<RentStatusBadge rent={{ status: 'late', days_late: 1, delay_time: 0 }} />)
    expect(screen.getByText('Atrasado · 1 dia')).toBeInTheDocument()
  })

  it('mentions the delay of a late return', () => {
    render(<RentStatusBadge rent={{ status: 'returned', days_late: 3, delay_time: 3 }} />)
    expect(screen.getByText('Devolvido com 3 dias de atraso')).toBeInTheDocument()
  })

  it('shows on-time returns as returned', () => {
    render(<RentStatusBadge rent={{ status: 'returned', days_late: 0, delay_time: 0 }} />)
    expect(screen.getByText('Devolvido')).toBeInTheDocument()
  })
})
