import clsx from 'clsx'
import { SearchIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ApiError } from '@/lib/api'

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900', className)}>
      {children}
    </div>
  )
}

const badgeTones = {
  gray: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400',
  red: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300',
}

export function Badge({ tone = 'gray', children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-transparent ring-inset', badgeTones[tone])}>
      {children}
    </span>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-3 pl-9 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900"
      />
    </div>
  )
}

/** Loading, error and empty states for a query-backed list. */
export function QueryState({
  isPending,
  error,
  isEmpty,
  empty,
  children,
}: {
  isPending: boolean
  error: Error | null
  isEmpty: boolean
  empty: ReactNode
  children: ReactNode
}) {
  if (isPending) {
    return (
      <div className="space-y-3 p-6" aria-busy="true" aria-label="Carregando">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    )
  }
  if (error) {
    return (
      <p role="alert" className="p-10 text-center text-sm text-red-600 dark:text-red-400">
        {error instanceof ApiError ? error.message : 'Não foi possível carregar os dados.'}
      </p>
    )
  }
  if (isEmpty) return <div className="p-10 text-center text-sm text-zinc-500">{empty}</div>
  return <>{children}</>
}

export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs tracking-wide text-zinc-500 uppercase dark:border-zinc-800">
          <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-medium">{head}</tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 [&_td]:px-4 [&_td]:py-3">{children}</tbody>
      </table>
    </div>
  )
}
