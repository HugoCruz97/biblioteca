import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/field'
import { applyApiErrors } from '@/lib/form-errors'
import { useSaveBook } from '@/lib/queries'
import type { Book } from '@/lib/types'

const required = 'Campo obrigatório'

const bookSchema = z.object({
  code: z.string().trim().min(1, required),
  title: z.string().trim().min(1, required),
  author: z.string().trim().min(1, required),
  publisher: z.string().trim().min(1, required),
  quantity: z.number({ error: 'Informe um número' }).int('Use um número inteiro').min(0, 'Não pode ser negativo'),
  description: z.string().trim().optional(),
})

type BookValues = z.infer<typeof bookSchema>

export function BookForm({ book, onDone }: { book?: Book; onDone: () => void }) {
  const save = useSaveBook()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      code: book?.code ?? '',
      title: book?.title ?? '',
      author: book?.author ?? '',
      publisher: book?.publisher ?? '',
      quantity: book?.quantity ?? 1,
      description: book?.description ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.mutateAsync({ id: book?.id, ...values })
      toast.success(book ? 'Livro atualizado' : 'Livro cadastrado')
      onDone()
    } catch (error) {
      applyApiErrors(error, setError, ['code', 'title', 'author', 'publisher', 'quantity', 'description'])
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <Field label="Código" error={errors.code?.message}>
          {(id) => <Input id={id} error={errors.code?.message} {...register('code')} />}
        </Field>
        <Field label="Título" error={errors.title?.message}>
          {(id) => <Input id={id} error={errors.title?.message} {...register('title')} />}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Autor" error={errors.author?.message}>
          {(id) => <Input id={id} error={errors.author?.message} {...register('author')} />}
        </Field>
        <Field label="Editora" error={errors.publisher?.message}>
          {(id) => <Input id={id} error={errors.publisher?.message} {...register('publisher')} />}
        </Field>
      </div>
      <Field label="Exemplares" error={errors.quantity?.message} hint="Total de exemplares no acervo">
        {(id) => (
          <Input
            id={id}
            type="number"
            min={0}
            className="sm:max-w-32"
            error={errors.quantity?.message}
            {...register('quantity', { valueAsNumber: true })}
          />
        )}
      </Field>
      <Field label="Descrição" error={errors.description?.message}>
        {(id) => <Textarea id={id} {...register('description')} />}
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {book ? 'Salvar alterações' : 'Cadastrar livro'}
        </Button>
      </div>
    </form>
  )
}
