import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/field'
import { applyApiErrors } from '@/lib/form-errors'
import { formatDate } from '@/lib/format'
import { useBooks, useLendBook, useStudents } from '@/lib/queries'

export const MAX_DAYS = 30

const rentSchema = z.object({
  student_id: z.number({ error: 'Escolha um aluno' }).int().positive('Escolha um aluno'),
  book_id: z.number({ error: 'Escolha um livro' }).int().positive('Escolha um livro'),
  rent_time: z
    .number({ error: 'Informe o prazo' })
    .int('Use um número inteiro')
    .min(1, 'Mínimo de 1 dia')
    .max(MAX_DAYS, `Máximo de ${MAX_DAYS} dias`),
})

type RentValues = z.infer<typeof rentSchema>

function dueDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return formatDate(date.toISOString())
}

export function RentForm({ onDone }: { onDone: () => void }) {
  const students = useStudents()
  const books = useBooks({ available: true })
  const lend = useLendBook()

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RentValues>({
    resolver: zodResolver(rentSchema),
    defaultValues: { rent_time: 7 },
  })

  const days = useWatch({ control, name: 'rent_time' })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const rent = await lend.mutateAsync(values)
      toast.success(`"${rent.book.title}" emprestado para ${rent.student.name}`)
      onDone()
    } catch (error) {
      applyApiErrors(error, setError, ['rent_time'])
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field label="Aluno" error={errors.student_id?.message}>
        {(id) => (
          <Select id={id} error={errors.student_id?.message} defaultValue="" {...register('student_id', { valueAsNumber: true })}>
            <option value="" disabled>
              {students.isPending ? 'Carregando…' : 'Selecione o aluno'}
            </option>
            {students.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.classroom}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        label="Livro"
        error={errors.book_id?.message}
        hint={books.data?.length === 0 ? 'Nenhum livro com exemplares disponíveis.' : 'Só aparecem livros com exemplares disponíveis.'}
      >
        {(id) => (
          <Select id={id} error={errors.book_id?.message} defaultValue="" {...register('book_id', { valueAsNumber: true })}>
            <option value="" disabled>
              {books.isPending ? 'Carregando…' : 'Selecione o livro'}
            </option>
            {books.data?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title} ({b.available} disp.)
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        label="Prazo (dias)"
        error={errors.rent_time?.message}
        hint={Number.isInteger(days) && days > 0 && days <= MAX_DAYS ? `Devolução até ${dueDate(days)}` : undefined}
      >
        {(id) => (
          <Input
            id={id}
            type="number"
            min={1}
            max={MAX_DAYS}
            className="sm:max-w-32"
            error={errors.rent_time?.message}
            {...register('rent_time', { valueAsNumber: true })}
          />
        )}
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Registrar empréstimo
        </Button>
      </div>
    </form>
  )
}
