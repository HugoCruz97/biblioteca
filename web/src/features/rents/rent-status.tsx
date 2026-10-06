import { Badge } from '@/components/ui/misc'
import { plural } from '@/lib/format'
import type { Rent } from '@/lib/types'

export function RentStatusBadge({ rent }: { rent: Pick<Rent, 'status' | 'days_late' | 'delay_time'> }) {
  if (rent.status === 'late') return <Badge tone="red">Atrasado · {plural(rent.days_late, 'dia')}</Badge>
  if (rent.status === 'active') return <Badge tone="indigo">Em andamento</Badge>
  if (rent.delay_time > 0) return <Badge tone="amber">Devolvido com {plural(rent.delay_time, 'dia')} de atraso</Badge>
  return <Badge tone="green">Devolvido</Badge>
}
