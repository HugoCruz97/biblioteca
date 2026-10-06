import clsx from 'clsx'
import { useId, type ComponentProps, type ReactNode } from 'react'

const control =
  'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:bg-zinc-900'

function controlClass(error?: string, className?: string) {
  return clsx(control, error ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700', className)
}

type FieldProps = { label: string; error?: string; hint?: ReactNode; children: (id: string) => ReactNode }

export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-zinc-500">{hint}</p>
      )}
    </div>
  )
}

export function Input({ error, className, ...props }: ComponentProps<'input'> & { error?: string }) {
  return <input aria-invalid={!!error} className={controlClass(error, className)} {...props} />
}

export function Textarea({ error, className, ...props }: ComponentProps<'textarea'> & { error?: string }) {
  return <textarea aria-invalid={!!error} rows={3} className={controlClass(error, className)} {...props} />
}

export function Select({ error, className, ...props }: ComponentProps<'select'> & { error?: string }) {
  return <select aria-invalid={!!error} className={controlClass(error, className)} {...props} />
}
