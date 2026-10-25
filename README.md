# Fieldbook

An operations dashboard for trade and home-service businesses (plumbing, electrical, HVAC and so on): incoming jobs, scheduling, technician workload, customers and invoicing in one place.

**Live demo:** https://fieldbook-demo.netlify.app (login: `demo@fieldbook.app` / `demo1234`, or press "Fill in")

## What it does

- **Dashboard**: revenue collected this month vs last, outstanding and overdue totals, a 6-month revenue chart, revenue by service, the next 7 days of bookings and each technician's open workload.
- **Jobs board**: a drag-and-drop kanban (New, Scheduled, In progress, Completed) with search and a technician filter. Moving an unassigned job forward assigns the matching tradesperson, and completing a job raises its invoice automatically.
- **Customers**: sortable, searchable table, a side panel with each customer's job and payment history, and an add-customer form.
- **Invoices**: unpaid/overdue/paid tabs, one-click "mark paid", overdue highlighting and CSV export of whatever is filtered.
- Light and dark mode, and a layout that works down to phone width.

## Tech

React 19 + TypeScript, Vite, React Router, Recharts, @hello-pangea/dnd for drag and drop, lucide icons. State lives in a single reducer (`src/store.tsx`) so every change goes through one place; it's saved to localStorage, and "Reset demo data" restores the seeded set.

The demo runs entirely in the browser so it can be hosted for free with no backend. Swapping the reducer's persistence for Supabase or Firebase, and the demo login for real auth, is the natural next step for production use.

## Run locally

```bash
npm install
npm run dev
```
