export type JobStatus = 'new' | 'scheduled' | 'in_progress' | 'done'
export type Service = 'Plumbing' | 'Electrical' | 'HVAC' | 'Carpentry' | 'Painting'
export type Priority = 'low' | 'normal' | 'urgent'

export interface Technician {
  id: string
  name: string
  skill: Service
  color: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  suburb: string
  createdAt: string // ISO date
}

export interface Job {
  id: string
  number: number
  title: string
  customerId: string
  technicianId: string | null
  service: Service
  status: JobStatus
  priority: Priority
  scheduledFor: string // ISO date
  estimate: number
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid'

export interface Invoice {
  id: string
  number: number
  jobId: string
  customerId: string
  amount: number
  issuedAt: string
  dueAt: string
  paidAt: string | null
  status: InvoiceStatus
}

export interface AppData {
  technicians: Technician[]
  customers: Customer[]
  jobs: Job[]
  invoices: Invoice[]
}
