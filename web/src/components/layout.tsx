import clsx from 'clsx'
import { ArrowLeftRightIcon, BookOpenIcon, LayoutDashboardIcon, LibraryIcon, UsersIcon } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'

const links = [
  { to: '/', label: 'Painel', icon: LayoutDashboardIcon, end: true },
  { to: '/emprestimos', label: 'Empréstimos', icon: ArrowLeftRightIcon },
  { to: '/livros', label: 'Livros', icon: BookOpenIcon },
  { to: '/alunos', label: 'Alunos', icon: UsersIcon },
]

export function Layout() {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur lg:h-dvh lg:border-r lg:border-b-0 dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="flex items-center gap-2 px-4 py-3 lg:px-5 lg:py-6">
          <span className="rounded-lg bg-indigo-600 p-1.5 text-white">
            <LibraryIcon className="size-4" />
          </span>
          <span className="font-semibold">Biblioteca</span>
        </div>
        <nav aria-label="Principal" className="flex gap-1 px-2 pb-2 lg:flex-col lg:px-3">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors lg:flex-none lg:flex-row lg:gap-2.5 lg:px-3 lg:text-sm',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}
