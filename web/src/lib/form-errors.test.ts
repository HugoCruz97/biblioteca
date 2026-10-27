import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import { applyApiErrors, toastError } from './form-errors'

type Values = { code: string; title: string }

describe('applyApiErrors', () => {
  it('puts field errors on the matching fields only', () => {
    const setError = vi.fn()
    const error = new ApiError(422, 'Código já está em uso', { code: ['já está em uso', 'é muito curto'] })

    applyApiErrors<Values>(error, setError, ['code', 'title'])

    expect(setError).toHaveBeenCalledExactlyOnceWith('code', { message: 'já está em uso, é muito curto' })
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows errors that have no field as a toast', () => {
    const setError = vi.fn()
    const error = new ApiError(422, 'Livro não tem exemplares disponíveis', { book: ['não tem exemplares disponíveis'] })

    applyApiErrors<Values>(error, setError, ['code', 'title'])

    expect(setError).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Livro não tem exemplares disponíveis')
  })

  it('shows errors without details as a toast', () => {
    applyApiErrors<Values>(new ApiError(0, 'Não foi possível conectar à API.'), vi.fn(), ['code'])

    expect(toast.error).toHaveBeenCalledWith('Não foi possível conectar à API.')
  })

  it('shows a generic message for unexpected errors', () => {
    applyApiErrors<Values>(new TypeError('boom'), vi.fn(), ['code'])

    expect(toast.error).toHaveBeenCalledWith('Algo deu errado. Tente novamente.')
  })
})

describe('toastError', () => {
  it('uses the API message when there is one', () => {
    toastError(new ApiError(409, 'Não é possível excluir'))
    toastError(new Error('internal detail'))

    expect(vi.mocked(toast.error).mock.calls).toEqual([['Não é possível excluir'], ['Algo deu errado. Tente novamente.']])
  })
})
