import type { Invoice, JobStatus, Technician } from '../types'
import { isOverdue } from '../store'

export function Avatar({ tech }: { tech: Technician | undefined }) {
  if (!tech) return <span className="avatar empty" title="Unassigned">?</span>
  const initials = tech.name.split(' ').map((p) => p[0]).join('')
  return (
    <span className="avatar" style={{ background: tech.color }} title={tech.name}>
      {initials}
    </span>
  )
}

export const STATUS_LABEL: Record<JobStatus, string> = {
  new: 'New request',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  done: 'Completed',
}

export function InvoiceBadge({ invoice }: { invoice: Invoice }) {
  if (invoice.status === 'paid') return <span className="badge badge-ok">Paid</span>
  if (isOverdue(invoice)) return <span className="badge badge-danger">Overdue</span>
  return <span className="badge badge-warn">Awaiting payment</span>
}
