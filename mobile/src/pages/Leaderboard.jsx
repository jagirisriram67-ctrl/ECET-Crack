import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Leaderboard({ user }) {
  const [leaders, setLeaders] = useState([])
  const [branch, setBranch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const params = branch ? `?branch=${branch}` : ''
    const token = localStorage.getItem('token')
    fetch(`/api/dashboard/leaderboard${params}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setLeaders(d.leaderboard || [])).catch(() => {})
      .finally(() => setLoading(false))
  }, [branch])

  const rankColors = ['', 'gold', 'silver', 'bronze']
  const bgColors = ['', 'hsl(45, 80%, 30%)', 'hsl(0, 0%, 55%)', 'hsl(28, 60%, 35%)']

  return (
    <div className="page">
      <h1 className="page-title">🏆 Leaderboard</h1>
      <p className="page-sub">Compete with fellow ECET aspirants</p>

      {/* Branch Filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        {['', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(b => (
          <button key={b} className={`btn btn-sm ${branch === b ? 'btn-accent' : 'btn-outline'}`} onClick={() => setBranch(b)} style={{ flexShrink: 0 }}>
            {b || 'All'}
          </button>
        ))}
      </div>

      {loading ? <div className="loading"><div className="spinner"></div></div> : leaders.length === 0 ? (
        <div className="empty"><div className="e-icon">🏆</div><h3>No rankings yet</h3><p>Take a quiz to appear on the leaderboard!</p></div>
      ) : (
        leaders.map((l, i) => (
          <div key={l._id} className="lb-item" style={{ borderLeft: i < 3 ? `3px solid ${bgColors[i + 1]}` : 'none', background: l._id === user?._id ? 'rgba(124,77,255,0.08)' : 'var(--surface)' }}>
            <div className={`lb-rank ${rankColors[i + 1] || ''}`} style={i >= 3 ? { background: 'var(--bg3)', color: 'var(--text3)' } : {}}>
              {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
            </div>
            <div className="lb-avatar" style={{ background: `hsl(${(l.name?.charCodeAt(0) || 65) * 5}, 45%, 40%)` }}>
              {l.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                {l.name} {l._id === user?._id ? '(You)' : ''}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{l.branch} • {l.stats?.totalAttempts || 0} quizzes</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>{l.stats?.avgScore || 0}%</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>🔥 {l.stats?.streak || 0}</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
