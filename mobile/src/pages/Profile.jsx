import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Profile({ user, onLogout }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/quizzes/history', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setHistory(d.attempts || [])).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = user?.stats || {}
  const subjectScores = stats.subjectScores ? (typeof stats.subjectScores === 'object' ? Object.entries(stats.subjectScores) : []) : []

  return (
    <div className="page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text)' }}>{user?.name}</h2>
        <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>{user?.email}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
          <span className="badge" style={{ background: 'rgba(124,77,255,0.15)', color: 'var(--accent)' }}>{user?.branch}</span>
          <span className="badge" style={{ background: 'rgba(0,230,118,0.15)', color: 'var(--green)' }}>{user?.status}</span>
        </div>
        {user?.college && <p style={{ color: 'var(--text3)', fontSize: '0.75rem', marginTop: 6 }}>🎓 {user.college}</p>}
      </div>

      {/* Quick Stats */}
      <div className="stats-row">
        <div className="mini-stat">
          <div className="val" style={{ color: 'var(--accent)' }}>{stats.totalAttempts || 0}</div>
          <div className="lbl">Quizzes</div>
        </div>
        <div className="mini-stat">
          <div className="val" style={{ color: stats.avgScore >= 70 ? 'var(--green)' : 'var(--orange)' }}>{stats.avgScore || 0}%</div>
          <div className="lbl">Avg Score</div>
        </div>
        <div className="mini-stat">
          <div className="val" style={{ color: 'var(--orange)' }}>🔥 {stats.streak || 0}</div>
          <div className="lbl">Streak</div>
        </div>
      </div>

      {/* Subject Performance */}
      {subjectScores.length > 0 && (
        <>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Subject Performance</h3>
          {subjectScores.map(([sub, data]) => (
            <div key={sub} className="glass-card mb-4">
              <div className="flex-between">
                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>{sub}</span>
                <span style={{ fontFamily: 'Outfit', fontWeight: 800, color: data.avgScore >= 70 ? 'var(--green)' : data.avgScore >= 40 ? 'var(--orange)' : 'var(--red)' }}>{data.avgScore}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${data.avgScore}%`, background: data.avgScore >= 70 ? 'var(--green)' : data.avgScore >= 40 ? 'var(--orange)' : 'var(--red)', borderRadius: 2, transition: 'width 0.5s' }}></div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 4 }}>{data.attempts} attempts • {data.totalCorrect}/{data.totalQuestions} correct</div>
            </div>
          ))}
        </>
      )}

      {/* Recent Quiz History */}
      <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Quiz History</h3>
      {loading ? <div className="loading"><div className="spinner"></div></div> : history.length === 0 ? (
        <div className="empty"><div className="e-icon">📝</div><h3>No quizzes yet</h3><p>Start a quiz to see your history!</p></div>
      ) : (
        history.slice(0, 10).map(a => (
          <div key={a._id} className="history-item" onClick={() => navigate(`/quiz/result?review=${a._id}`)}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{a.quizType} — {a.subject}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{new Date(a.createdAt).toLocaleDateString()} • {a.correctCount}/{a.totalQuestions}</div>
            </div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', color: a.percentage >= 70 ? 'var(--green)' : a.percentage >= 40 ? 'var(--orange)' : 'var(--red)' }}>
              {a.percentage}%
            </div>
          </div>
        ))
      )}

      {/* Actions */}
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link to="/contact" className="btn btn-outline">📩 Contact Admin</Link>
        <button className="btn btn-red" onClick={onLogout}>🚪 Logout</button>
      </div>
    </div>
  )
}
