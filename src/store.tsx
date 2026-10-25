import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import { createSeed } from './data/seed'
import type { AppData, Customer, Invoice, Job, JobStatus } from './types'

const STORAGE_KEY = 'fieldbook:data:v1'

type Action =
  | { type: 'moveJob'; id: string; status: JobStatus }
  | { type: 'assignJob'; id: string; technicianId: string | null }
  | { type: 'addJob'; job: Omit<Job, 'id' | 'number'> }
  | { type: 'addCustomer'; customer: Omit<Customer, 'id' | 'createdAt'> }
  | { type: 'markPaid'; id: string }
  | { type: 'reset' }

const today = () => new Date().toISOString().slice(0, 10)
const addDays = (date: string, days: number) =>
  new Date(new Date(date).getTime() + days * 86400000).toISOString().slice(0, 10)

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'moveJob': {
      const job = state.jobs.find((j) => j.id === action.id)
      if (!job || job.status === action.status) return state
      const jobs = state.jobs.map((j) => (j.id === action.id ? { ...j, status: action.status } : j))
      // Finishing a job raises an invoice for it automatically (once).
      const hasInvoice = state.invoices.some((i) => i.jobId === job.id)
      if (action.status !== 'done' || hasInvoice) return { ...state, jobs }
      const issued = today()
      const invoice: Invoice = {
        id: `inv${Date.now()}`,
        number: Math.max(5000, ...state.invoices.map((i) => i.number)) + 1,
        jobId: job.id,
        customerId: job.customerId,
        amount: job.estimate,
        issuedAt: issued,
        dueAt: addDays(issued, 14),
        paidAt: null,
        status: 'sent',
      }
      return { ...state, jobs, invoices: [...state.invoices, invoice] }
    }
    case 'assignJob':
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === action.id ? { ...j, technicianId: action.technicianId } : j)),
      }
    case 'addJob': {
      const number = Math.max(1000, ...state.jobs.map((j) => j.number)) + 1
      return { ...state, jobs: [...state.jobs, { ...action.job, id: `j${Date.now()}`, number }] }
    }
    case 'addCustomer':
      return {
        ...state,
        customers: [...state.customers, { ...action.customer, id: `c${Date.now()}`, createdAt: today() }],
      }
    case 'markPaid':
      return {
        ...state,
        invoices: state.invoices.map((i) => (i.id === action.id ? { ...i, status: 'paid', paidAt: today() } : i)),
      }
    case 'reset':
      return createSeed()
  }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppData
  } catch {
    // storage blocked or corrupt; fall back to fresh demo data
  }
  return createSeed()
}

const StoreContext = createContext<{ data: AppData; dispatch: (a: Action) => void } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore: the demo still works for this session
    }
  }, [data])

  return <StoreContext.Provider value={{ data, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

export function isOverdue(inv: Invoice) {
  return inv.status !== 'paid' && inv.dueAt < today()
}

export const money = (n: number) =>
  n.toLocaleString('en-NZ', { style: 'currency', currency: 'NZD', maximumFractionDigits: 0 })

export const shortDate = (d: string) =>
  new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })
