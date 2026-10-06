import { AlertTriangleIcon, ArrowLeftRightIcon, BookOpenIcon, CheckCircle2Icon, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Card, PageHeader, QueryState } from '@/components/ui/misc'
import { RentsTable } from '@/features/rents/rents-table'
import { useBooks, useRents } from '@/lib/queries'

function Stat({ label, value, icon: Icon, tone }: { label: string; value?: number; icon: LucideIcon; tone: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{label}</p>
        <span className={`rounded-lg p-2 ${tone}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value ?? '—'}</p>
    </Card>
  )
}

export function DashboardPage() {
  const books = useBooks()
  const active = useRents({ status: 'active' })
  const late = useRents({ status: 'late' })

  const copies = books.data?.reduce((sum, b) => sum + b.quantity, 0)
  const available = books.data?.reduce((sum, b) => sum + b.available, 0)

  return (
    <>
      <PageHeader title="Painel" description="Visão geral da biblioteca hoje." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Exemplares no acervo" value={copies} icon={BookOpenIcon} tone="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" />
        <Stat label="Disponíveis" value={available} icon={CheckCircle2Icon} tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" />
        <Stat label="Em andamento" value={active.data?.length} icon={ArrowLeftRightIcon} tone="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" />
        <Stat label="Atrasados" value={late.data?.length} icon={AlertTriangleIcon} tone="bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" />
      </div>

      <Card className="mt-8">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="font-semibold">Devoluções atrasadas</h2>
          <Link to="/emprestimos?status=late" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
            Ver todos
          </Link>
        </div>
        <QueryState
          isPending={late.isPending}
          error={late.error}
          isEmpty={late.data?.length === 0}
          empty="Nenhum atraso. Todos os empréstimos estão em dia."
        >
          <RentsTable rents={late.data ?? []} />
        </QueryState>
      </Card>
    </>
  )
}
