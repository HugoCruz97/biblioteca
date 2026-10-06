import clsx from 'clsx'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Card, PageHeader, QueryState } from '@/components/ui/misc'
import { RentForm } from '@/features/rents/rent-form'
import { RentsTable } from '@/features/rents/rents-table'
import { useRents } from '@/lib/queries'
import type { RentStatus } from '@/lib/types'

const tabs: { value: RentStatus | 'all'; label: string; empty: string }[] = [
  { value: 'active', label: 'Em andamento', empty: 'Nenhum empréstimo em andamento.' },
  { value: 'late', label: 'Atrasados', empty: 'Nenhum empréstimo atrasado.' },
  { value: 'returned', label: 'Devolvidos', empty: 'Nenhuma devolução registrada.' },
  { value: 'all', label: 'Todos', empty: 'Nenhum empréstimo registrado.' },
]

export function RentsPage() {
  // The selected tab lives in the URL so it survives reloads and can be linked to (e.g. from the dashboard)
  const [searchParams, setSearchParams] = useSearchParams()
  const current = tabs.find((t) => t.value === searchParams.get('status')) ?? tabs[0]
  const rents = useRents({ status: current.value === 'all' ? undefined : current.value })
  const [lending, setLending] = useState(false)

  return (
    <>
      <PageHeader
        title="Empréstimos"
        description="Empréstimos em andamento, atrasos e devoluções."
        action={
          <Button onClick={() => setLending(true)}>
            <PlusIcon className="size-4" /> Novo empréstimo
          </Button>
        }
      />

      <Card>
        <div role="tablist" aria-label="Situação" className="flex gap-1 overflow-x-auto border-b border-zinc-200 p-2 dark:border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={tab === current}
              onClick={() => setSearchParams(tab.value === 'active' ? {} : { status: tab.value })}
              className={clsx(
                'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                tab === current
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <QueryState isPending={rents.isPending} error={rents.error} isEmpty={rents.data?.length === 0} empty={current.empty}>
          <RentsTable rents={rents.data ?? []} />
        </QueryState>
      </Card>

      <Dialog open={lending} onClose={() => setLending(false)} title="Novo empréstimo">
        {lending && <RentForm onDone={() => setLending(false)} />}
      </Dialog>
    </>
  )
}
