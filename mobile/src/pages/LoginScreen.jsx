import { useState } from 'react'

export default function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [branch, setBranch] = useState('')
  const [college, setCollege] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      const API = '/api/auth'
      const body = tab === 'login'
        ? { email, password }
        : { name, email, password, branch, college }
      const res = await fetch(`${API}/${tab === 'login' ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      if (data.message && data.user?.status === 'pending') {
        setSuccess(data.message)
      }
      onLogin(data.user, data.token)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="login-screen">
      <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎯</div>
      <div className="login-logo">ECET Crack</div>
      <div className="login-tagline">Crack Your Dream College Seat</div>

      <div className="login-card">
        <div className="login-tabs">
          <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); setSuccess('') }}>Login</button>
          <button className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); setSuccess('') }}>Register</button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <input className="input" type="text" placeholder="Your Full Name" value={name} onChange={e => setName(e.target.value)} required />
          )}
          <input className="input" type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          
          {tab === 'register' && (
            <>
              <select className="input select" value={branch} onChange={e => setBranch(e.target.value)} style={{ marginBottom: 12 }}>
                <option value="">Select Branch</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">Mechanical</option>
                <option value="CIVIL">Civil</option>
              </select>
              <input className="input" type="text" placeholder="College Name (optional)" value={college} onChange={e => setCollege(e.target.value)} />
            </>
          )}

          {error && <div style={{ color: 'var(--red)', fontSize: '0.8rem', margin: '10px 0', padding: '8px 12px', background: 'rgba(255,82,82,0.1)', borderRadius: 8 }}>❌ {error}</div>}
          {success && <div style={{ color: 'var(--green)', fontSize: '0.8rem', margin: '10px 0', padding: '8px 12px', background: 'rgba(0,230,118,0.1)', borderRadius: 8 }}>✅ {success}</div>}

          <button className="btn btn-accent" type="submit" disabled={loading}>
            {loading ? '⏳ Please wait...' : tab === 'login' ? '🔓 Login' : '🚀 Create Account'}
          </button>
        </form>

        <div className="login-features">
          <div>✅ Subject-wise Quizzes</div>
          <div>✅ Unit Tests (20 Marks) & Grand Tests (100 Marks)</div>
          <div>✅ Full ECET Mock Tests</div>
          <div>✅ Detailed Explanations & Notes</div>
        </div>
      </div>
    </div>
  )
}
