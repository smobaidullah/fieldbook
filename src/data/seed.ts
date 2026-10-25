import type { AppData, Customer, Invoice, Job, JobStatus, Priority, Service, Technician } from '../types'

// Small seeded RNG so the demo data is the same on every fresh load.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

const FIRST = ['Aroha', 'Liam', 'Mere', 'Noah', 'Priya', 'Jack', 'Sione', 'Emma', 'Tama', 'Olivia', 'Raj', 'Chloe', 'Hemi', 'Grace', 'Ben', 'Anika', 'Mateo', 'Ruby', 'Wiremu', 'Isla', 'Kenji', 'Zoe', 'Ari', 'Hannah']
const LAST = ['Walker', 'Ngata', 'Patel', 'Thompson', 'Fa\'amausili', 'Brown', 'Kumar', 'Wilson', 'Tane', 'Chen', 'Smith', 'Harris', 'Parata', 'Lee', 'Taylor', 'Singh']
const SUBURBS = ['Ponsonby', 'Mt Eden', 'Grey Lynn', 'Remuera', 'Takapuna', 'Onehunga', 'Henderson', 'Howick', 'Albany', 'Epsom']

const TASKS: Record<Service, string[]> = {
  Plumbing: ['Leaking kitchen tap', 'Hot water cylinder replacement', 'Blocked drain', 'Toilet cistern repair', 'Shower mixer install'],
  Electrical: ['Switchboard upgrade', 'Install LED downlights', 'Faulty power point', 'EV charger install', 'Smoke alarm wiring'],
  HVAC: ['Heat pump service', 'Heat pump install', 'Ducted system check', 'Bathroom extractor fan'],
  Carpentry: ['Deck repair', 'Hang internal doors', 'Fence replacement', 'Kitchen cabinet fix'],
  Painting: ['Interior repaint, 2 rooms', 'Exterior weatherboard touch-up', 'Ceiling repaint', 'Fence stain'],
}

const PRICE: Record<Service, [number, number]> = {
  Plumbing: [180, 2400],
  Electrical: [150, 3200],
  HVAC: [220, 4800],
  Carpentry: [300, 3800],
  Painting: [450, 5200],
}

export const TECHNICIANS: Technician[] = [
  { id: 't1', name: 'Dan Ruawai', skill: 'Plumbing', color: '#2563eb' },
  { id: 't2', name: 'Sarah Kim', skill: 'Electrical', color: '#d97706' },
  { id: 't3', name: 'Tomasi Vea', skill: 'HVAC', color: '#059669' },
  { id: 't4', name: 'Mike O\'Neill', skill: 'Carpentry', color: '#9333ea' },
  { id: 't5', name: 'Leah Grant', skill: 'Painting', color: '#db2777' },
]

const DAY = 86400000
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

export function createSeed(now = Date.now()): AppData {
  const r = rng(42)
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)]
  const today = new Date(iso(now)).getTime()

  const customers: Customer[] = Array.from({ length: 24 }, (_, i) => {
    const first = FIRST[i]
    const last = pick(LAST)
    return {
      id: `c${i + 1}`,
      name: `${first} ${last}`,
      phone: `021 ${100 + Math.floor(r() * 899)} ${1000 + Math.floor(r() * 8999)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      suburb: pick(SUBURBS),
      createdAt: iso(today - Math.floor(r() * 200 + 20) * DAY),
    }
  })

  const services = Object.keys(TASKS) as Service[]
  const jobs: Job[] = []
  const invoices: Invoice[] = []

  // ~6 months of history plus a couple of weeks of upcoming work
  for (let i = 0; i < 90; i++) {
    const service = pick(services)
    const offset = i < 72 ? -Math.floor(r() * 180) - 1 : Math.floor(r() * 21) - 3
    const date = today + offset * DAY
    let status: JobStatus
    if (offset < -3) status = 'done'
    else if (offset < 0) status = r() < 0.5 ? 'in_progress' : 'done'
    else if (offset === 0) status = 'in_progress'
    else status = r() < 0.7 ? 'scheduled' : 'new'

    const [lo, hi] = PRICE[service]
    const estimate = Math.round((lo + r() * (hi - lo)) / 10) * 10
    const tech = TECHNICIANS.find((t) => t.skill === service)!
    const priority: Priority = r() < 0.15 ? 'urgent' : r() < 0.3 ? 'low' : 'normal'
    const customer = pick(customers)

    const job: Job = {
      id: `j${i + 1}`,
      number: 1001 + i,
      title: pick(TASKS[service]),
      customerId: customer.id,
      technicianId: status === 'new' ? null : tech.id,
      service,
      status,
      priority,
      scheduledFor: iso(date),
      estimate,
    }
    jobs.push(job)

    if (status === 'done') {
      const issued = date + DAY
      const due = issued + 14 * DAY
      const age = today - issued
      // older invoices are almost all paid; recent ones are a mix
      const paid = age > 30 * DAY ? r() < 0.94 : r() < 0.5
      const paidAt = paid ? Math.min(issued + Math.floor(r() * 20) * DAY, today) : null
      invoices.push({
        id: `inv${invoices.length + 1}`,
        number: 5001 + invoices.length,
        jobId: job.id,
        customerId: customer.id,
        amount: Math.round(estimate * (0.9 + r() * 0.25)),
        issuedAt: iso(issued),
        dueAt: iso(due),
        paidAt: paidAt ? iso(paidAt) : null,
        status: paid ? 'paid' : 'sent',
      })
    }
  }

  jobs.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
  jobs.forEach((j, i) => (j.number = 1001 + i))
  invoices.sort((a, b) => a.issuedAt.localeCompare(b.issuedAt))
  invoices.forEach((inv, i) => (inv.number = 5001 + i))
  return { technicians: TECHNICIANS, customers, jobs, invoices }
}
