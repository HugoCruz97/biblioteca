import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockApi } from '@/test/api'
import { buildBook, buildRent } from '@/test/builders'
import { renderWithProviders } from '@/test/render'
import { DashboardPage } from './dashboard'

const stat = (label: string) => screen.getByText(label).parentElement!.nextElementSibling

describe('DashboardPage', () => {
  it('sums copies and counts loans', async () => {
    mockApi({
      'GET /books': { body: [buildBook({ quantity: 3, available: 1 }), buildBook({ quantity: 2, available: 2 })] },
      'GET /rents': ({ query }) => ({
        body:
          query.status === 'late'
            ? [buildRent({ status: 'late', days_late: 4, book: { id: 9, code: 'LIT-9', title: 'Vidas Secas' } })]
            : [buildRent(), buildRent()],
      }),
    })
    renderWithProviders(<DashboardPage />)

    expect(await screen.findByText('Vidas Secas')).toBeInTheDocument()
    expect(stat('Exemplares no acervo')).toHaveTextContent('5')
    expect(stat('Disponíveis')).toHaveTextContent('3')
    expect(stat('Em andamento')).toHaveTextContent('2')
    expect(stat('Atrasados')).toHaveTextContent('1')
    expect(screen.getByRole('link', { name: 'Ver todos' })).toHaveAttribute('href', '/emprestimos?status=late')
  })

  it('says when nothing is late', async () => {
    mockApi({ 'GET /books': { body: [] }, 'GET /rents': { body: [] } })
    renderWithProviders(<DashboardPage />)

    expect(await screen.findByText('Nenhum atraso. Todos os empréstimos estão em dia.')).toBeInTheDocument()
  })
})
