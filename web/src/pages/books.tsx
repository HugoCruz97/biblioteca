import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { BookForm } from '@/features/books/book-form'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import { Badge, Card, PageHeader, QueryState, SearchInput, Table } from '@/components/ui/misc'
import { toastError } from '@/lib/form-errors'
import { useBooks, useDeleteBook } from '@/lib/queries'
import type { Book } from '@/lib/types'
import { useDebounced } from '@/lib/use-debounced'

export function BooksPage() {
  const [search, setSearch] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const q = useDebounced(search)
  const books = useBooks({ q, available: onlyAvailable || undefined })

  const [editing, setEditing] = useState<Book | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Book | null>(null)
  const remove = useDeleteBook()

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success('Livro excluído')
    } catch (error) {
      toastError(error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Livros"
        description="Acervo da biblioteca e exemplares disponíveis."
        action={
          <Button onClick={() => setEditing('new')}>
            <PlusIcon className="size-4" /> Novo livro
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por título, autor ou código" />
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="size-4 accent-indigo-600"
            />
            Só disponíveis
          </label>
        </div>

        <QueryState
          isPending={books.isPending}
          error={books.error}
          isEmpty={books.data?.length === 0}
          empty={search ? 'Nenhum livro encontrado para essa busca.' : 'Nenhum livro cadastrado ainda.'}
        >
          <Table
            head={
              <>
                <th>Código</th>
                <th>Título</th>
                <th className="hidden md:table-cell">Autor</th>
                <th className="hidden lg:table-cell">Editora</th>
                <th>Disponíveis</th>
                <th className="sr-only">Ações</th>
              </>
            }
          >
            {books.data?.map((book) => (
              <tr key={book.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="font-mono text-xs text-zinc-500">{book.code}</td>
                <td>
                  <p className="font-medium">{book.title}</p>
                  <p className="text-xs text-zinc-500 md:hidden">{book.author}</p>
                </td>
                <td className="hidden text-zinc-600 md:table-cell dark:text-zinc-400">{book.author}</td>
                <td className="hidden text-zinc-600 lg:table-cell dark:text-zinc-400">{book.publisher}</td>
                <td>
                  <Badge tone={book.available > 0 ? 'green' : 'amber'}>
                    {book.available} de {book.quantity}
                  </Badge>
                </td>
                <td className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(book)} aria-label={`Editar ${book.title}`}>
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(book)} aria-label={`Excluir ${book.title}`}>
                    <Trash2Icon className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </QueryState>
      </Card>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Novo livro' : 'Editar livro'}
      >
        {editing !== null && (
          <BookForm book={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
        )}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        pending={remove.isPending}
        title="Excluir livro?"
        description={`"${deleting?.title}" será removido do acervo. Livros com empréstimos registrados não podem ser excluídos.`}
        confirmLabel="Excluir"
      />
    </>
  )
}
