import { useMemo, useState, type FormEvent } from 'react'
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd'
import { Plus, Search } from 'lucide-react'
import { money, shortDate, useStore } from '../store'
import { Avatar, STATUS_LABEL } from '../components/ui'
import type { Job, JobStatus, Priority, Service } from '../types'

const COLUMNS: JobStatus[] = ['new', 'scheduled', 'in_progress', 'done']
const DONE_LIMIT = 12
const SERVICES: Service[] = ['Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Painting']

export default function Jobs() {
  const { data, dispatch } = useStore()
  const [query, setQuery] = useState('')
  const [tech, setTech] = useState('all')
  const [creating, setCreating] = useState(false)

  const customerName = (id: string) => data.customers.find((c) => c.id === id)?.name ?? 'Unknown'

  const columns = useMemo(() => {
    const q = query.trim().toLowerCase()
    const visible = data.jobs.filter((j) => {
      if (tech === 'unassigned' ? j.technicianId !== null : tech !== 'all' && j.technicianId !== tech) return false
      if (!q) return true
      const name = data.customers.find((c) => c.id === j.customerId)?.name ?? ''
      return `${j.number} ${j.title} ${name} ${j.service}`.toLowerCase().includes(q)
    })
    const grouped = Object.fromEntries(COLUMNS.map((c) => [c, [] as Job[]])) as Record<JobStatus, Job[]>
    for (const j of visible) grouped[j.status].push(j)
    // finished work: newest first, and only the recent ones so the column stays usable
    grouped.done = grouped.done.sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor)).slice(0, DONE_LIMIT)
    return grouped
  },[data.jobs, data.customers, query, tech])

  const onDragEnd = ({ draggableId, destination }: DropResult) => {
    if (!destination) return
    const status = destination.droppableId as JobStatus
    const job = data.jobs.find((j) => j.id === draggableId)
    if (!job) return
    // scheduling a job needs someone to do it: default to the matching tradesperson
    if (status !== 'new' && !job.technicianId) {
      const match = data.technicians.find((t) => t.skill === job.service)
      if (match) dispatch({ type: 'assignJob', id: job.id, technicianId: match.id })
    }
    dispatch({ type: 'moveJob', id: draggableId, status })
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Jobs board</h1>
          <p>Drag a card to change its status. Completing a job raises its invoice automatically.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> New job
        </button>
      </div>

      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="search">
          <Search size={15} />
          <input className="input" placeholder="Search job #, customer, task" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="select" style={{ width: 200 }} value={tech} onChange={(e) => setTech(e.target.value)}>
          <option value="all">All technicians</option>
          <option value="unassigned">Unassigned</option>
          {data.technicians.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board">
          {COLUMNS.map((status) => (
            <Droppable droppableId={status} key={status}>
              {(provided, snapshot) => (
                <div className={`column${snapshot.isDraggingOver ? ' over' : ''}`}>
                  <div className="column-head">
                    <span>{STATUS_LABEL[status]}</span>
                    <span className="badge badge-muted">{columns[status].length}</span>
                  </div>
                  <div className="column-body" ref={provided.innerRef} {...provided.droppableProps}>
                    {columns[status].map((job, index) => (
                      <Draggable draggableId={job.id} index={index} key={job.id}>
                        {(drag, dragSnap) => (
                          <div
                            ref={drag.innerRef}
                            {...drag.draggableProps}
                            {...drag.dragHandleProps}
                            className={`job-card${dragSnap.isDragging ? ' dragging' : ''}`}
                          >
                            <div className="job-card-top">
                              <span>#{job.number} · {job.service}</span>
                              {job.priority === 'urgent' && <span className="badge badge-danger">Urgent</span>}
                            </div>
                            <div className="job-card-title">{job.title}</div>
                            <div className="job-card-foot">
                              <span className="muted">{customerName(job.customerId)}</span>
                              <span className="row" style={{ gap: 8 }}>
                                <span className="num muted">{shortDate(job.scheduledFor)}</span>
                                <Avatar tech={data.technicians.find((t) => t.id === job.technicianId)} />
                              </span>
                            </div>
                            <div className="num" style={{ fontSize: 12.5, marginTop: 6 }}>{money(job.estimate)}</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {status === 'done' && <p className="muted" style={{ fontSize: 12, margin: '4px 2px 0' }}>Showing the {DONE_LIMIT} most recent.</p>}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {creating && <NewJobModal onClose={() => setCreating(false)} />}
    </>
  )
}

function NewJobModal({ onClose }: { onClose: () => void }) {
  const { data, dispatch } = useStore()
  const [form, setForm] = useState({
    title: '',
    customerId: data.customers[0]?.id ?? '',
    service: 'Plumbing' as Service,
    priority: 'normal' as Priority,
    scheduledFor: new Date().toISOString().slice(0, 10),
    estimate: 250,
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'addJob', job: { ...form, status: 'new', technicianId: null } })
    onClose()
  }

  return (
    <div className="overlay center" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New job</h2>
        <form className="form" onSubmit={submit}>
          <label>
            What needs doing?
            <input className="input" required autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Replace hot water cylinder" />
          </label>
          <label>
            Customer
            <select className="select" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              {[...data.customers].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                <option key={c.id} value={c.id}>{c.name}, {c.suburb}</option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              Service
              <select className="select" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value as Service })}>
                {SERVICES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>
              Priority
              <select className="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Preferred date
              <input className="input" type="date" required value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} />
            </label>
            <label>
              Estimate (NZD)
              <input className="input" type="number" min={0} step={10} required value={form.estimate} onChange={(e) => setForm({ ...form, estimate: Number(e.target.value) })} />
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary">Add to board</button>
          </div>
        </form>
      </div>
    </div>
  )
}
