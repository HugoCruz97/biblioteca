import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'
import { ApiError } from './api'

/**
 * Puts API validation errors (422) on the matching form fields and shows anything
 * that doesn't belong to a field as a toast.
 */
export function applyApiErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: Path<T>[]) {
  if (!(error instanceof ApiError)) {
    toast.error('Algo deu errado. Tente novamente.')
    return
  }

  const leftovers: string[] = []
  for (const [field, messages] of Object.entries(error.details)) {
    if ((fields as string[]).includes(field)) {
      setError(field as Path<T>, { message: messages.join(', ') })
    } else {
      leftovers.push(...messages)
    }
  }

  if (leftovers.length > 0 || Object.keys(error.details).length === 0) toast.error(error.message)
}

export function toastError(error: unknown) {
  toast.error(error instanceof ApiError ? error.message : 'Algo deu errado. Tente novamente.')
}
