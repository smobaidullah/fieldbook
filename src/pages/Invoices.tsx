import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { isOverdue, money, shortDate, useStore } from '../store'
import { InvoiceBadge } from '../components/ui'

type Filter = 'all' | 'unpaid' | 'overdue' | 'paid'

export default function Invoices() {
  const { data, dispatch } = useStore()
  const [filter, setFilter] = useState<Filter>('unpaid')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.invoices
      .map((inv) => ({
        inv,
        customer: data.customers.find((c) => c.id === inv.customerId),
        job: data.jobs.find((j) => j.id === inv.jobId),
      }))
      .filter(({ inv }) =>
        filter === 'all' ? true
          : filter === 'paid' ? inv.status === 'paid'
          : filter === 'overdue' ? isOverdue(inv)
          : inv.status !== 'paid')
      .filter(({ inv, customer, job }) => !q || `${inv.number} ${customer?.name} ${job?.title}`.toLowerCase().includes(q))
      .sort((a, b) => b.inv.issuedAt.localeCompare(a.inv.issuedAt))
  }, [data, filter, query])

  const total = rows.reduce((s, r) => s + r.inv.amount, 0)

  const exportCsv = () => {
    const lines = [
      ['Invoice', 'Customer', 'Job', 'Issued', 'Due', 'Amount', 'Status'],
      ...rows.map(({ inv, customer, job }) => [
        inv.number, customer?.name ?? '', job?.title ?? '', inv.issuedAt, inv.dueAt, inv.amount,
        inv.status === 'paid' ? 'Paid' : isOverdue(inv) ? 'Overdue' : 'Awaiting payment',
      ]),
    ]
    const csv = lines.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${filter}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabs: [Filter, string][] = [['unpaid', 'Unpaid'], ['overdue', 'Overdue'], ['paid', 'Paid'], ['all', 'All']]

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Invoices</h1>
          <p>Invoices are raised automatically when a job is moved to Completed.</p>
        </div>
        <button className="btn" onClick={exportCsv}><Download size={16} /> Export CSV</button>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="tabs">
            {tabs.map(([key, label]) => (
              <button key={key} className={`tab${filter === key ? ' active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
            ))}
          </div>
          <div className="search">
            <Search size={15} />
            <input className="input" placeholder="Search invoice #, customer, job" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <span className="muted num" style={{ marginLeft: 'auto', fontSize: 13 }}>
            {rows.length} invoices · {money(total)}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th><th>Customer</th><th>Job</th><th>Issued</th><th>Due</th>
                <th style={{ textAlign: 'right' }}>Amount</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ inv, customer, job }) => (
                <tr key={inv.id}>
                  <td className="num" style={{ fontWeight: 600 }}>INV-{inv.number}</td>
                  <td>{customer?.name}</td>
                  <td className="muted">{job?.title}</td>
                  <td className="num">{shortDate(inv.issuedAt)}</td>
                  <td className="num" style={{ color: isOverdue(inv) ? 'var(--danger)' : undefined }}>{shortDate(inv.dueAt)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{money(inv.amount)}</td>
                  <td><InvoiceBadge invoice={inv} /></td>
                  <td style={{ textAlign: 'right' }}>
                    {inv.status !== 'paid' ? (
                      <button className="btn btn-sm" onClick={() => dispatch({ type: 'markPaid', id: inv.id })}>Mark paid</button>
                    ) : (
                      <span className="muted" style={{ fontSize: 12.5 }}>{inv.paidAt && shortDate(inv.paidAt)}</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="muted" style={{ textAlign: 'center', padding: 30 }}>Nothing here. Nice.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
