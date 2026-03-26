import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// ECET 2027 exam date (approximate)
const ECET_DATE = new Date('2027-05-15T10:00:00')

function ExamCountdown() {
  const [diff, setDiff] = useState({})
  useEffect(() => {
    const update = () => {
      const ms = ECET_DATE - Date.now()
      if (ms <= 0) return setDiff({ d: 0, h: 0, m: 0, s: 0 })
      setDiff({
        d: Math.floor(ms / 86400000),
        h: Math.floor((ms % 86400000) / 3600000),
        m: Math.floor((ms % 3600000) / 60000),
        s: Math.floor((ms % 60000) / 1000)
      })
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,64,129,0.12) 0%, rgba(124,77,255,0.1) 50%, rgba(68,138,255,0.08) 100%)',
      border: '1px solid rgba(255,64,129,0.15)', borderRadius: 16, padding: '14px 16px', marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 12
    }}>
      <div style={{ fontSize: '1.8rem' }}>⏰</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--pink)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ECET Exam Countdown</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {[
            { v: diff.d, l: 'days' }, { v: diff.h, l: 'hrs' }, { v: diff.m, l: 'min' }, { v: diff.s, l: 'sec' }
          ].map((t, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.2rem', color: 'var(--text)', lineHeight: 1 }}>{String(t.v || 0).padStart(2, '0')}</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--text3)', fontWeight: 600 }}>{t.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textAlign: 'right' }}>May 2027<br /><span style={{ color: 'var(--pink)' }}>Stay focused!</span></div>
    </div>
  )
}

function StudyHeatmap({ data }) {
  const today = new Date()
  const days = Array.from({ length: 90 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (89 - i))
    const key = d.toISOString().slice(0, 10)
    const found = data?.find(h => h._id === key)
    return { date: key, day: d.getDate(), count: found?.count || 0, weekday: d.getDay() }
  })

  const getColor = (count) => {
    if (count === 0) return 'rgba(255,255,255,0.04)'
    if (count <= 1) return 'rgba(124,77,255,0.25)'
    if (count <= 3) return 'rgba(124,77,255,0.45)'
    if (count <= 5) return 'rgba(124,77,255,0.65)'
    return 'rgba(124,77,255,0.9)'
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="flex-between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)' }}>📅 Study Activity (90 days)</span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{data?.length || 0} active days</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {days.map((d, i) => (
          <div key={i} title={`${d.date}: ${d.count} quizzes`}
            style={{ width: 10, height: 10, borderRadius: 2, background: getColor(d.count), transition: 'all 0.2s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--text3)' }}>Less</span>
        {[0, 1, 3, 5, 7].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: 2, background: getColor(c) }} />)}
        <span style={{ fontSize: '0.6rem', color: 'var(--text3)' }}>More</span>
      </div>
    </div>
  )
}

function ProgressRing({ pct, color, size = 52, label }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg3)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <div style={{ marginTop: -size + 2, fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.7rem', color, lineHeight: `${size}px`, textAlign: 'center' }}>{pct}%</div>
      {label && <div style={{ fontSize: '0.55rem', color: 'var(--text3)', marginTop: 2, fontWeight: 600 }}>{label}</div>}
    </div>
  )
}

export default function Home({ user }) {
  const [dashboard, setDashboard] = useState(null)
  const [heatmap, setHeatmap] = useState([])
  const [badges, setBadges] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const headers = { 'Authorization': `Bearer ${token}` }

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/user', { headers }).then(r => r.json()),
      fetch('/api/bookmarks/heatmap', { headers }).then(r => r.json()),
      fetch('/api/bookmarks/achievements', { headers }).then(r => r.json()),
    ]).then(([d, h, b]) => {
      setDashboard(d); setHeatmap(h.heatmap || []); setBadges(b)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const stats = user?.stats || {}
  const subjectScores = stats.subjectScores ? Object.entries(typeof stats.subjectScores === 'object' ? stats.subjectScores : {}) : []
  const subColors = ['#7C4DFF', '#448AFF', '#00E676', '#FFB74D', '#FF5252', '#18FFFF', '#FF4081', '#B388FF']

  return (
    <div className="page">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="flex-between">
          <div>
            <div className="welcome-name">Hi, {user?.name?.split(' ')[0]}! 👋</div>
            <div className="welcome-sub">{user?.branch} • Ready to crack ECET?</div>
            <div className="welcome-streak">🔥 {stats.streak || 0} day streak</div>
          </div>
          <Link to="/notifications" style={{ fontSize: '1.5rem', textDecoration: 'none' }}>🔔</Link>
        </div>
      </div>

      {/* Exam Countdown */}
      <ExamCountdown />

      {/* Quick Stats */}
      <div className="stats-row">
        <div className="mini-stat">
          <div className="val" style={{ color: 'var(--accent)' }}>{stats.totalAttempts || 0}</div>
          <div className="lbl">Quizzes</div>
        </div>
        <div className="mini-stat">
          <div className="val" style={{ color: stats.avgScore >= 70 ? 'var(--green)' : stats.avgScore >= 40 ? 'var(--orange)' : 'var(--red)' }}>{stats.avgScore || 0}%</div>
          <div className="lbl">Accuracy</div>
        </div>
        <div className="mini-stat">
          <div className="val" style={{ color: 'var(--cyan)' }}>{stats.totalCorrect || 0}</div>
          <div className="lbl">Correct</div>
        </div>
      </div>

      {/* Subject Progress Rings */}
      {subjectScores.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 10 }}>📊 Subject Progress</h3>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
            {subjectScores.map(([sub, data], i) => (
              <ProgressRing key={sub} pct={data.avgScore || 0} color={subColors[i % subColors.length]} label={sub.slice(0, 6)} />
            ))}
          </div>
        </div>
      )}

      {/* Study Heatmap */}
      <StudyHeatmap data={heatmap} />

      {/* Achievement Badges */}
      {badges && (
        <div style={{ marginBottom: 20 }}>
          <div className="flex-between" style={{ marginBottom: 10 }}>
            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>🏅 Achievements</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>{badges.unlockedCount}/{badges.totalCount}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {badges.badges?.map(b => (
              <div key={b.id} style={{
                minWidth: 72, textAlign: 'center', padding: '10px 6px', borderRadius: 12,
                background: b.unlocked ? 'rgba(124,77,255,0.08)' : 'var(--bg3)',
                border: `1px solid ${b.unlocked ? 'rgba(124,77,255,0.2)' : 'var(--border)'}`,
                opacity: b.unlocked ? 1 : 0.4, flexShrink: 0
              }}>
                <div style={{ fontSize: '1.5rem' }}>{b.icon}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: b.unlocked ? 'var(--text)' : 'var(--text3)', marginTop: 4 }}>{b.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Types */}
      <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 10 }}>🚀 Start Practicing</h3>
      <div className="quiz-grid">
        {[
          { type: 'subject', title: 'Subject Quiz', desc: '10 questions', icon: '📘', bg: 'linear-gradient(135deg, rgba(124,77,255,0.12) 0%, rgba(68,138,255,0.08) 100%)' },
          { type: 'unit', title: 'Unit Test', desc: '20 marks', icon: '📋', bg: 'linear-gradient(135deg, rgba(0,230,118,0.12) 0%, rgba(0,200,83,0.06) 100%)' },
          { type: 'grand', title: 'Grand Test', desc: '100 marks', icon: '🏆', bg: 'linear-gradient(135deg, rgba(255,183,77,0.12) 0%, rgba(255,152,0,0.06) 100%)' },
          { type: 'mock', title: 'Mock ECET', desc: 'Full simulation', icon: '🎯', bg: 'linear-gradient(135deg, rgba(255,64,129,0.12) 0%, rgba(255,23,68,0.06) 100%)' },
        ].map(q => (
          <div key={q.type} className="quiz-type-card" style={{ background: q.bg }} onClick={() => navigate(`/quiz?type=${q.type}`)}>
            <div className="qt-icon">{q.icon}</div>
            <div className="qt-title">{q.title}</div>
            <div className="qt-desc">{q.desc}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
        <Link to="/learn" className="glass-card" style={{ textAlign: 'center', padding: '12px 8px', textDecoration: 'none' }}>
          <div style={{ fontSize: '1.3rem' }}>🃏</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>Flashcards</div>
        </Link>
        <Link to="/papers" className="glass-card" style={{ textAlign: 'center', padding: '12px 8px', textDecoration: 'none' }}>
          <div style={{ fontSize: '1.3rem' }}>📜</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>Past Papers</div>
        </Link>
        <Link to="/timer" className="glass-card" style={{ textAlign: 'center', padding: '12px 8px', textDecoration: 'none' }}>
          <div style={{ fontSize: '1.3rem' }}>⏱️</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>Study Timer</div>
        </Link>
      </div>

      {/* Recent Activity */}
      {dashboard?.recentAttempts?.length > 0 && (
        <>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 10 }}>📖 Recent Activity</h3>
          {dashboard.recentAttempts.slice(0, 3).map(a => (
            <div key={a._id} className="history-item" onClick={() => navigate(`/quiz/result?review=${a._id}`)}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>{a.quizType} — {a.subject}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{new Date(a.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, color: a.percentage >= 70 ? 'var(--green)' : a.percentage >= 40 ? 'var(--orange)' : 'var(--red)' }}>
                {a.percentage}%
              </div>
            </div>
          ))}
        </>
      )}

      {/* Contact */}
      <Link to="/contact" className="btn btn-outline" style={{ marginTop: 16 }}>📩 Contact Admin</Link>
    </div>
  )
}
