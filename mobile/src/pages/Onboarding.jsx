import { useState } from 'react'

export default function Onboarding({ user, onComplete }) {
  const [branch, setBranch] = useState('')
  const [college, setCollege] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!branch) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ branch, college })
      })
      onComplete(branch, college)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const branches = [
    { code: 'CSE', name: 'Computer Science', icon: '💻' },
    { code: 'ECE', name: 'Electronics & Comm', icon: '📡' },
    { code: 'EEE', name: 'Electrical', icon: '⚡' },
    { code: 'MECH', name: 'Mechanical', icon: '⚙️' },
    { code: 'CIVIL', name: 'Civil', icon: '🏗️' },
  ]

  return (
    <div className="login-screen">
      <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎓</div>
      <div className="login-logo" style={{ fontSize: '1.8rem' }}>Welcome, {user?.name?.split(' ')[0]}!</div>
      <div className="login-tagline">Select your branch to continue</div>

      <div className="login-card" style={{ textAlign: 'left' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 8 }}>Your Branch</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {branches.map(b => (
            <div key={b.code} className="glass-card" style={{ cursor: 'pointer', padding: '12px 16px', borderColor: branch === b.code ? 'var(--accent)' : 'var(--border)', background: branch === b.code ? 'rgba(124,77,255,0.08)' : 'var(--surface)' }} onClick={() => setBranch(b.code)}>
              <div className="flex gap-3" style={{ alignItems: 'center' }}>
                <span style={{ fontSize: '1.3rem' }}>{b.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{b.code}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{b.name}</div>
                </div>
                {branch === b.code && <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>✓</span>}
              </div>
            </div>
          ))}
        </div>

        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>College (optional)</label>
        <input className="input" placeholder="Your college name" value={college} onChange={e => setCollege(e.target.value)} />

        <button className="btn btn-accent" style={{ marginTop: 16 }} onClick={handleSubmit} disabled={!branch || loading}>
          {loading ? '⏳ Saving...' : '🚀 Start Preparing!'}
        </button>
      </div>
    </div>
  )
}
