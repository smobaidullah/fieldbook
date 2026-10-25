import { useMemo, useState, type FormEvent } from 'react'
import { Plus, Search, X, ArrowUpDown } from 'lucide-react'
import { money, shortDate, useStore } from '../store'
import { InvoiceBadge, STATUS_LABEL } from '../components/ui'
import type { Customer } from '../types'

type SortKey = 'name' | 'suburb' | 'jobs' | 'spent' | 'last'

export default function Customers() {
  const { data } = useStore()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'spent', dir: -1 })
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.customers
      .map((c) => {
        const jobs = data.jobs.filter((j) => j.customerId === c.id)
        const spent = data.invoices.filter((i) => i.customerId === c.id && i.status === 'paid').reduce((s, i) => s + i.amount, 0)
        const last = jobs.map((j) => j.scheduledFor).sort().at(-1) ?? ''
        return { c, jobs: jobs.length, spent, last }
      })
      .filter(({ c }) => !q || `${c.name} ${c.email} ${c.phone} ${c.suburb}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const v = (r: typeof a) =>
          sort.key === 'name' ? r.c.name : sort.key === 'suburb' ? r.c.suburb : sort.key === 'last' ? r.last : r[sort.key]
        const x = v(a)
        const y = v(b)
        return (x < y ? -1 : x > y ? 1 : 0) * sort.dir
      })
  }, [data, query, sort])

  const header = (key: SortKey, label: string, align?: 'right') => (
    <th
      className="sortable"
      style={{ textAlign: align }}
      onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === 'name' || key === 'suburb' ? 1 : -1 }))}
    >
      {label} {sort.key === key ? (sort.dir === 1 ? '↑' : '↓') : <ArrowUpDown size={11} style={{ opacity: 0.4 }} />}
    </th>
  )

  const open = data.customers.find((c) => c.id === openId)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Customers</h1>
          <p>{data.customers.length} customers · click a row for job and invoice history</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={16} /> Add customer</button>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Search size={15} />
            <input className="input" placeholder="Search name, email, phone, suburb" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <span className="muted" style={{ fontSize: 13 }}>{rows.length} shown</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {header('name', 'Name')}
                <th>Contact</th>
                {header('suburb', 'Suburb')}
                {header('jobs', 'Jobs', 'right')}
                {header('spent', 'Total paid', 'right')}
                {header('last', 'Last job')}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, jobs, spent, last }) => (
                <tr key={c.id} className="clickable" onClick={() => setOpenId(c.id)}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td className="muted">{c.phone}<br /><span style={{ fontSize: 12.5 }}>{c.email}</span></td>
                  <td>{c.suburb}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{jobs}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{money(spent)}</td>
                  <td className="num muted">{last ? shortDate(last) : 'No jobs yet'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 30 }}>No customers match “{query}”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && <CustomerDrawer customer={open} onClose={() => setOpenId(null)} />}
      {adding && <AddCustomerModal onClose={() => setAdding(false)} />}
    </>
  )
}

function CustomerDrawer({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { data } = useStore()
  const jobs = data.jobs.filter((j) => j.customerId === customer.id).sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor))
  const invoices = data.invoices.filter((i) => i.customerId === customer.id)
  const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const owing = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)

  return (
    <div className="overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h1>{customer.name}</h1>
          <button className="btn btn-sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <p className="muted" style={{ margin: '6px 0 0' }}>
          {customer.suburb} · {customer.phone} · {customer.email}<br />
          Customer since {new Date(customer.createdAt).toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })}
        </p>

        <div className="stat-row">
          <div className="stat"><span className="muted">Jobs</span><b>{jobs.length}</b></div>
          <div className="stat"><span className="muted">Paid</span><b className="num">{money(paid)}</b></div>
          <div className="stat"><span className="muted">Owing</span><b className="num">{money(owing)}</b></div>
        </div>

        <h2>Job history</h2>
        <ul className="list" style={{ marginTop: 6 }}>
          {jobs.map((j) => {
            const inv = invoices.find((i) => i.jobId === j.id)
            return (
              <li key={j.id}>
                <div>
                  <div style={{ fontWeight: 600 }}>{j.title}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>#{j.number} · {shortDate(j.scheduledFor)} · {STATUS_LABEL[j.status]}</div>
                </div>
                {inv ? <InvoiceBadge invoice={inv} /> : <span className="num muted">{money(j.estimate)}</span>}
              </li>
            )
          })}
          {jobs.length === 0 && <li className="muted">No jobs yet.</li>}
        </ul>
      </div>
    </div>
  )
}

function AddCustomerModal({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore()
  const [form, setForm] = useState({ name: '', phone: '', email: '', suburb: '' })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'addCustomer', customer: form })
    onClose()
  }

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <label>
      {label}
      <input className="input" type={type} required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </label>
  )

  return (
    <div className="overlay center" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add customer</h2>
        <form className="form" onSubmit={submit}>
          {field('name', 'Full name')}
          <div className="form-row">
            {field('phone', 'Phone', 'tel')}
            {field('suburb', 'Suburb')}
          </div>
          {field('email', 'Email', 'email')}
          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary">Save customer</button>
          </div>
        </form>
      </div>
    </div>
  )
}
