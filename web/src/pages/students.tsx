import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmDialog, Dialog } from '@/components/ui/dialog'
import { Card, PageHeader, QueryState, SearchInput, Table } from '@/components/ui/misc'
import { StudentForm } from '@/features/students/student-form'
import { toastError } from '@/lib/form-errors'
import { useDeleteStudent, useStudents } from '@/lib/queries'
import type { Student } from '@/lib/types'
import { useDebounced } from '@/lib/use-debounced'

export function StudentsPage() {
  const [search, setSearch] = useState('')
  const q = useDebounced(search)
  const students = useStudents({ q })

  const [editing, setEditing] = useState<Student | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Student | null>(null)
  const remove = useDeleteStudent()

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync(deleting.id)
      toast.success('Aluno excluído')
    } catch (error) {
      toastError(error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Alunos"
        description="Alunos cadastrados para empréstimo."
        action={
          <Button onClick={() => setEditing('new')}>
            <PlusIcon className="size-4" /> Novo aluno
          </Button>
        }
      />

      <Card>
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, matrícula ou turma" />
        </div>

        <QueryState
          isPending={students.isPending}
          error={students.error}
          isEmpty={students.data?.length === 0}
          empty={search ? 'Nenhum aluno encontrado para essa busca.' : 'Nenhum aluno cadastrado ainda.'}
        >
          <Table
            head={
              <>
                <th>Matrícula</th>
                <th>Nome</th>
                <th>Turma</th>
                <th className="sr-only">Ações</th>
              </>
            }
          >
            {students.data?.map((student) => (
              <tr key={student.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="font-mono text-xs text-zinc-500">{student.code}</td>
                <td className="font-medium">{student.name}</td>
                <td className="text-zinc-600 dark:text-zinc-400">{student.classroom}</td>
                <td className="text-right whitespace-nowrap">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(student)} aria-label={`Editar ${student.name}`}>
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(student)} aria-label={`Excluir ${student.name}`}>
                    <Trash2Icon className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </QueryState>
      </Card>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Novo aluno' : 'Editar aluno'}>
        {editing !== null && (
          <StudentForm student={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
        )}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        pending={remove.isPending}
        title="Excluir aluno?"
        description={`O cadastro de ${deleting?.name} será removido. Alunos com empréstimos registrados não podem ser excluídos.`}
        confirmLabel="Excluir"
      />
    </>
  )
}
