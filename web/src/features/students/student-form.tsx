import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { applyApiErrors } from '@/lib/form-errors'
import { useSaveStudent } from '@/lib/queries'
import type { Student } from '@/lib/types'

const required = 'Campo obrigatório'

const studentSchema = z.object({
  name: z.string().trim().min(1, required),
  code: z.string().trim().min(1, required),
  classroom: z.string().trim().min(1, required),
})

type StudentValues = z.infer<typeof studentSchema>

export function StudentForm({ student, onDone }: { student?: Student; onDone: () => void }) {
  const save = useSaveStudent()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StudentValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: { name: student?.name ?? '', code: student?.code ?? '', classroom: student?.classroom ?? '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ id: student?.id, ...values })
      toast.success(student ? 'Aluno atualizado' : 'Aluno cadastrado')
      onDone()
    } catch (error) {
      applyApiErrors(error, setError, ['name', 'code', 'classroom'])
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field label="Nome" error={errors.name?.message}>
        {(id) => <Input id={id} error={errors.name?.message} {...register('name')} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Matrícula" error={errors.code?.message}>
          {(id) => <Input id={id} error={errors.code?.message} {...register('code')} />}
        </Field>
        <Field label="Turma" error={errors.classroom?.message}>
          {(id) => <Input id={id} placeholder="Ex.: 9º A" error={errors.classroom?.message} {...register('classroom')} />}
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {student ? 'Salvar alterações' : 'Cadastrar aluno'}
        </Button>
      </div>
    </form>
  )
}
