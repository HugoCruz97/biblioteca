import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { mockApi } from '@/test/api'
import { buildStudent } from '@/test/builders'
import { renderWithProviders } from '@/test/render'
import type { Student } from '@/lib/types'
import { StudentForm } from './student-form'

function renderForm(student?: Student) {
  const onDone = vi.fn()
  renderWithProviders(<StudentForm student={student} onDone={onDone} />)
  return { onDone }
}

describe('StudentForm', () => {
  it('validates required fields before calling the API', async () => {
    const api = mockApi({})
    renderForm()

    await userEvent.type(screen.getByLabelText('Nome'), '   ')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

    expect(await screen.findAllByText('Campo obrigatório')).toHaveLength(3)
    expect(api.requests('POST /students')).toHaveLength(0)
  })

  it('creates a student', async () => {
    const api = mockApi({ 'POST /students': { status: 201, body: buildStudent() } })
    const { onDone } = renderForm()

    await userEvent.type(screen.getByLabelText('Nome'), ' Carla Souza ')
    await userEvent.type(screen.getByLabelText('Matrícula'), '2026-01')
    await userEvent.type(screen.getByLabelText('Turma'), '7º C')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

    await vi.waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(api.requests('POST /students')[0].body).toEqual({
      student: { name: 'Carla Souza', code: '2026-01', classroom: '7º C' },
    })
    expect(toast.success).toHaveBeenCalledWith('Aluno cadastrado')
  })

  it('edits an existing student', async () => {
    const student = buildStudent({ id: 4, name: 'Ana Lima', classroom: '9º A' })
    const api = mockApi({ 'PATCH /students/4': { body: student } })
    const { onDone } = renderForm(student)

    expect(screen.getByLabelText('Nome')).toHaveValue('Ana Lima')
    await userEvent.clear(screen.getByLabelText('Turma'))
    await userEvent.type(screen.getByLabelText('Turma'), '1º EM')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await vi.waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(api.requests('PATCH /students/4')[0].body).toMatchObject({ student: { classroom: '1º EM' } })
    expect(toast.success).toHaveBeenCalledWith('Aluno atualizado')
  })

  it('shows a duplicated code on the field', async () => {
    mockApi({
      'POST /students': { status: 422, body: { error: 'Matrícula já está em uso', details: { code: ['já está em uso'] } } },
    })
    const { onDone } = renderForm()

    await userEvent.type(screen.getByLabelText('Nome'), 'Carla')
    await userEvent.type(screen.getByLabelText('Matrícula'), '123')
    await userEvent.type(screen.getByLabelText('Turma'), '7º C')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar aluno' }))

    expect(await screen.findByText('já está em uso')).toBeInTheDocument()
    expect(screen.getByLabelText('Matrícula')).toHaveAttribute('aria-invalid', 'true')
    expect(onDone).not.toHaveBeenCalled()
  })

  it('cancels without saving', async () => {
    const { onDone } = renderForm()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onDone).toHaveBeenCalled()
  })
})
