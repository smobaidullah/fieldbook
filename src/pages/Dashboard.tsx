import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { isOverdue, money, shortDate, useStore } from '../store'
import { Avatar } from '../components/ui'
import type { Service } from '../types'

const monthKey = (d: string) => d.slice(0, 7)

export default function Dashboard() {
  const { data } = useStore()

  const stats = useMemo(() => {
    const now = new Date()
    const thisMonth = now.toISOString().slice(0, 7)
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().slice(0, 7)
    const today = now.toISOString().slice(0, 10)

    const paid = data.invoices.filter((i) => i.paidAt)
    const revenueIn = (m: string) => paid.filter((i) => monthKey(i.paidAt!) === m).reduce((s, i) => s + i.amount, 0)
    const revThis = revenueIn(thisMonth)
    const revPrev = revenueIn(prev)

    const unpaid = data.invoices.filter((i) => i.status !== 'paid')
    const overdue = unpaid.filter(isOverdue)

    const doneThisMonth = data.jobs.filter((j) => j.status === 'done' && monthKey(j.scheduledFor) === thisMonth).length
    const avgJob = paid.length ? paid.reduce((s, i) => s + i.amount, 0) / paid.length : 0

    // last 6 months of collected revenue
    const months = Array.from({ length: 6 }, (_, k) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - k), 15)
      const key = d.toISOString().slice(0, 7)
      return { key, label: d.toLocaleDateString('en-NZ', { month: 'short' }), revenue: revenueIn(key) }
    })

    const byService = new Map<Service, number>()
    for (const inv of paid) {
      const job = data.jobs.find((j) => j.id === inv.jobId)
      if (job) byService.set(job.service, (byService.get(job.service) ?? 0) + inv.amount)
    }
    const services = [...byService.entries()].sort((a, b) => b[1] - a[1])

    const in7 = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)
    const upcoming = data.jobs
      .filter((j) => j.status !== 'done' && j.scheduledFor >= today && j.scheduledFor <= in7)
      .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
      .slice(0, 6)

    const workload = data.technicians.map((t) => ({
      tech: t,
      open: data.jobs.filter((j) => j.technicianId === t.id && (j.status === 'scheduled' || j.status === 'in_progress')).length,
    }))

    return {
      revThis, revPrev, unpaidTotal: unpaid.reduce((s, i) => s + i.amount, 0), overdue,
      doneThisMonth, avgJob, months, services, upcoming, workload,
      newRequests: data.jobs.filter((j) => j.status === 'new').length,
    }
  }, [data])

  const change = stats.revPrev ? ((stats.revThis - stats.revPrev) / stats.revPrev) * 100 : 0
  const maxService = stats.services[0]?.[1] ?? 1
  const maxLoad = Math.max(1, ...stats.workload.map((w) => w.open))
  const customer = (id: string) => data.customers.find((c) => c.id === id)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Good to see you, Jess</h1>
          <p>
            {stats.newRequests} new request{stats.newRequests === 1 ? '' : 's'} waiting to be scheduled
            {stats.overdue.length > 0 && <> · {stats.overdue.length} overdue invoice{stats.overdue.length === 1 ? '' : 's'}</>}
          </p>
        </div>
        <Link to="/jobs" className="btn btn-primary">Open jobs board</Link>
      </div>

      <div className="kpis">
        <div className="card card-pad">
          <div className="kpi-label">Collected this month</div>
          <div className="kpi-value num">{money(stats.revThis)}</div>
          <div className="kpi-sub">
            <span className={change >= 0 ? 'up' : 'down'}>{change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(0)}%</span> vs last month
          </div>
        </div>
        <div className="card card-pad">
          <div className="kpi-label">Outstanding</div>
          <div className="kpi-value num">{money(stats.unpaidTotal)}</div>
          <div className="kpi-sub">{stats.overdue.length} overdue · {money(stats.overdue.reduce((s, i) => s + i.amount, 0))}</div>
        </div>
        <div className="card card-pad">
          <div className="kpi-label">Jobs completed this month</div>
          <div className="kpi-value num">{stats.doneThisMonth}</div>
          <div className="kpi-sub">across {data.technicians.length} technicians</div>
        </div>
        <div className="card card-pad">
          <div className="kpi-label">Average job value</div>
          <div className="kpi-value num">{money(stats.avgJob)}</div>
          <div className="kpi-sub">from paid invoices</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="card-head">
            <h2>Revenue collected, last 6 months</h2>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={stats.months} margin={{ left: 8, right: 8, top: 4 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }} />
                <YAxis
                  tickLine={false} axisLine={false} width={52}
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  cursor={{ fill: 'var(--panel-2)' }}
                  formatter={(v) => [money(Number(v)), 'Collected']}
                  contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text)' }}
                />
                <Bar dataKey="revenue" fill="var(--accent)" radius={[5, 5, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card card-pad">
          <div className="card-head"><h2>Revenue by service</h2></div>
          <ul className="list">
            {stats.services.map(([service, total]) => (
              <li key={service} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span>{service}</span>
                  <span className="num muted">{money(total)}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(total / maxService) * 100}%`, background: 'var(--accent)' }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="card-head">
            <h2>Next 7 days</h2>
            <Link to="/jobs" className="muted" style={{ fontSize: 13 }}>View all</Link>
          </div>
          {stats.upcoming.length === 0 ? (
            <p className="muted">Nothing booked for the next week.</p>
          ) : (
            <ul className="list">
              {stats.upcoming.map((j) => (
                <li key={j.id}>
                  <div className="row" style={{ minWidth: 0 }}>
                    <Avatar tech={data.technicians.find((t) => t.id === j.technicianId)} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
                      <div className="muted" style={{ fontSize: 12.5 }}>
                        #{j.number} · {customer(j.customerId)?.name} · {customer(j.customerId)?.suburb}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="num">{shortDate(j.scheduledFor)}</div>
                    {j.priority === 'urgent' && <span className="badge badge-danger">Urgent</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card card-pad">
          <div className="card-head"><h2>Technician workload</h2></div>
          <ul className="list">
            {stats.workload.map(({ tech, open }) => (
              <li key={tech.id}>
                <div className="row" style={{ flex: 1 }}>
                  <Avatar tech={tech} />
                  <div style={{ flex: 1 }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span>{tech.name}</span>
                      <span className="muted num" style={{ fontSize: 12.5 }}>{open} open</span>
                    </div>
                    <div className="bar-track" style={{ marginTop: 5 }}>
                      <div className="bar-fill" style={{ width: `${(open / maxLoad) * 100}%`, background: tech.color }} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
