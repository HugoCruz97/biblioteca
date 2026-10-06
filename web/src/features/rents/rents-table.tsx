import { UndoIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/misc'
import { toastError } from '@/lib/form-errors'
import { formatDate } from '@/lib/format'
import { useReturnBook } from '@/lib/queries'
import type { Rent } from '@/lib/types'
import { RentStatusBadge } from './rent-status'

export function RentsTable({ rents }: { rents: Rent[] }) {
  const giveBack = useReturnBook()

  const handleReturn = async (rent: Rent) => {
    try {
      await giveBack.mutateAsync(rent.id)
      toast.success(`Devolução de "${rent.book.title}" registrada`)
    } catch (error) {
      toastError(error)
    }
  }

  return (
    <Table
      head={
        <>
          <th>Livro</th>
          <th>Aluno</th>
          <th className="hidden md:table-cell">Emprestado em</th>
          <th className="hidden sm:table-cell">Devolução</th>
          <th>Situação</th>
          <th className="sr-only">Ações</th>
        </>
      }
    >
      {rents.map((rent) => (
        <tr key={rent.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
          <td>
            <p className="font-medium">{rent.book.title}</p>
            <p className="font-mono text-xs text-zinc-500">{rent.book.code}</p>
          </td>
          <td>
            <p>{rent.student.name}</p>
            <p className="text-xs text-zinc-500">{rent.student.classroom}</p>
          </td>
          <td className="hidden text-zinc-600 md:table-cell dark:text-zinc-400">{formatDate(rent.created_at)}</td>
          <td className="hidden text-zinc-600 sm:table-cell dark:text-zinc-400">
            {rent.returned_at ? formatDate(rent.returned_at) : `até ${formatDate(rent.due_on)}`}
          </td>
          <td>
            <RentStatusBadge rent={rent} />
          </td>
          <td className="text-right">
            {rent.status !== 'returned' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleReturn(rent)}
                disabled={giveBack.isPending && giveBack.variables === rent.id}
              >
                <UndoIcon className="size-3.5" /> Devolver
              </Button>
            )}
          </td>
        </tr>
      ))}
    </Table>
  )
}
