import { createContext, useContext, useState, type ReactNode } from 'react'

// Front-end only demo auth. A real deployment would put this behind a backend
// (Supabase/Firebase Auth); kept simple here so the demo works with no server.
const SESSION_KEY = 'fieldbook:session'
export const DEMO_USER = { email: 'demo@fieldbook.app', password: 'demo1234', name: 'Jess Morgan' }

const AuthContext = createContext<{
  user: string | null
  login: (email: string, password: string) => boolean
  logout: () => void
} | null>(null)

function readSession() {
  try {
    return sessionStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(readSession)

  const login = (email: string, password: string) => {
    if (email.trim().toLowerCase() !== DEMO_USER.email || password !== DEMO_USER.password) return false
    try {
      sessionStorage.setItem(SESSION_KEY, DEMO_USER.name)
    } catch {
      // private mode: stay logged in for this tab only
    }
    setUser(DEMO_USER.name)
    return true
  }

  const logout = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      // nothing to clear
    }
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
