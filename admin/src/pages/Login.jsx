import { useState } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill all fields')
    setLoading(true)
    try {
      const res = await authAPI.adminLogin({ email, password })
      toast.success('Welcome back, Admin! 🎉')
      onLogin(res.data.user, res.data.token)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <div className="badge">ADMIN ACCESS</div>
        <h1>🎯 ECET Crack</h1>
        <p className="subtitle">Administration Panel</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input type="email" className="form-input" placeholder="Admin Email" 
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <input type="password" className="form-input" placeholder="Admin Password" 
              value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? '⏳ Logging in...' : '🔓 Login to Admin Panel'}
          </button>
        </form>
        <p style={{ marginTop: 24, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Use admin email &amp; the JWT secret as password
        </p>
      </div>
    </div>
  )
}
