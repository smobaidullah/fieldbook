import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import { DEMO_USER, useAuth } from '../auth'

export default function Login() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!login(email, password)) setError('That email and password combination is not right.')
  }

  return (
    <div className="login-wrap">
      <div className="card card-pad login">
        <div className="brand" style={{ padding: '0 0 6px' }}>
          <span className="brand-mark"><Wrench size={16} /></span> Fieldbook
        </div>
        <p className="muted" style={{ marginTop: 0 }}>Jobs, crews and invoices for trade businesses.</p>

        <div className="demo-hint">
          Demo login: <b>{DEMO_USER.email}</b> / <b>{DEMO_USER.password}</b>
          <button
            type="button"
            className="btn btn-sm"
            style={{ marginLeft: 8 }}
            onClick={() => {
              setEmail(DEMO_USER.email)
              setPassword(DEMO_USER.password)
            }}
          >
            Fill in
          </button>
        </div>

        <form className="form" onSubmit={submit}>
          <label>
            Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary" style={{ justifyContent: 'center' }}>Sign in</button>
        </form>
      </div>
    </div>
  )
}
