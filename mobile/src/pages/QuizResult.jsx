import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// Confetti canvas
function Confetti({ show }) {
  useEffect(() => {
    if (!show) return
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none'
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth; canvas.height = window.innerHeight
    const colors = ['#7C4DFF', '#00E676', '#FFB74D', '#FF5252', '#448AFF', '#FF4081', '#18FFFF', '#FFEA00']
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width, y: -20,
      vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4 + 2,
      size: Math.random() * 8 + 4, color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 10,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    }))
    let frame = 0
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.rotation += p.rotSpeed
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill() }
        ctx.restore()
      })
      frame++
      if (frame < 180) requestAnimationFrame(animate)
      else canvas.remove()
    }
    animate()
    return () => canvas.remove()
  }, [show])
  return null
}

export default function QuizResult({ user }) {
  const [searchParams] = useSearchParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('wrong')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const id = searchParams.get('id') || searchParams.get('review')
    if (!id) { navigate('/'); return }

    fetch(`/api/quizzes/attempts/${id}/review`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (d.attempt) setResult(d)
      }).catch(() => {})
      .finally(() => setLoading(false))
  }, [searchParams])

  if (loading) return <div className="page flex-center" style={{ minHeight: '100vh' }}><div className="spinner"></div></div>
  if (!result) return (
    <div className="page flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
      <div style={{ fontSize: '3rem' }}>😕</div>
      <p style={{ color: 'var(--text3)', marginTop: 12 }}>Result not found</p>
      <button className="btn btn-accent btn-sm" onClick={() => navigate('/quiz')} style={{ marginTop: 16 }}>← Back to Quiz</button>
    </div>
  )

  const { attempt, wrongAnswers, correctAnswers, allQuestions } = result
  const pct = attempt?.percentage || 0
  const scoreColor = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--orange)' : 'var(--red)'

  const displayList = tab === 'wrong' ? (wrongAnswers || []) : tab === 'correct' ? (correctAnswers || []) : (allQuestions || [])

  return (
    <div className="result-screen page">
      {/* Confetti for high scores */}
      <Confetti show={pct >= 80} />

      {/* Score Circle */}
      <div className="result-circle" style={{ background: `conic-gradient(${scoreColor} ${pct * 3.6}deg, var(--bg3) 0deg)` }}>
        <div style={{ width: 140, height: 140, borderRadius: '50%', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="result-score" style={{ color: scoreColor }}>{pct}%</div>
          <div className="result-pct">{attempt?.correctCount}/{attempt?.totalQuestions}</div>
        </div>
      </div>

      {/* Result Label */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, color: scoreColor, fontSize: '1.4rem' }}>
          {pct >= 80 ? '🌟 Excellent!' : pct >= 60 ? '💪 Good Job!' : pct >= 40 ? '📚 Keep Trying!' : '💡 Need More Practice'}
        </h2>
        <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>{attempt?.quizType} — {attempt?.subject}</p>
      </div>

      {/* Stats */}
      <div className="result-stats">
        <div className="result-stat" style={{ borderBottom: '3px solid var(--green)' }}>
          <div className="rs-val" style={{ color: 'var(--green)' }}>{attempt?.correctCount}</div>
          <div className="rs-lbl">Correct</div>
        </div>
        <div className="result-stat" style={{ borderBottom: '3px solid var(--red)' }}>
          <div className="rs-val" style={{ color: 'var(--red)' }}>{attempt?.wrongCount || 0}</div>
          <div className="rs-lbl">Wrong</div>
        </div>
        <div className="result-stat" style={{ borderBottom: '3px solid var(--accent)' }}>
          <div className="rs-val" style={{ color: 'var(--accent)' }}>{attempt?.totalQuestions}</div>
          <div className="rs-lbl">Total</div>
        </div>
      </div>

      {/* Review Tabs */}
      <div className="login-tabs" style={{ marginBottom: 16 }}>
        <button className={`login-tab ${tab === 'wrong' ? 'active' : ''}`} onClick={() => setTab('wrong')}>❌ Wrong ({wrongAnswers?.length || 0})</button>
        <button className={`login-tab ${tab === 'correct' ? 'active' : ''}`} onClick={() => setTab('correct')}>✅ Correct ({correctAnswers?.length || 0})</button>
        <button className={`login-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>📋 All</button>
      </div>

      {/* Review Cards */}
      {displayList.length === 0 ? (
        <div className="empty"><div className="e-icon">{tab === 'wrong' ? '🎉' : '📝'}</div><h3>{tab === 'wrong' ? 'No wrong answers!' : 'No items'}</h3></div>
      ) : (
        displayList.map((q, idx) => (
          <div key={idx} className="review-card">
            <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 600, marginBottom: 6 }}>Question {idx + 1}</div>
            <div className="rq-text">{q.questionText}</div>
            {q.options?.map((opt, i) => {
              let cls = 'neutral'
              if (i === q.correctAnswer) cls = 'correct-ans'
              else if (i === q.selectedAnswer && q.selectedAnswer !== q.correctAnswer) cls = 'your-wrong'
              return (
                <div key={i} className={`review-option ${cls}`}>
                  <span style={{ fontWeight: 700, marginRight: 8, minWidth: 20 }}>{String.fromCharCode(65 + i)}</span>
                  <span>{opt}</span>
                  {i === q.correctAnswer && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>✅</span>}
                  {i === q.selectedAnswer && q.selectedAnswer !== q.correctAnswer && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>❌</span>}
                </div>
              )
            })}
            {q.explanation && <div className="explanation-box">💡 {q.explanation}</div>}
          </div>
        ))
      )}

      {/* Actions */}
      <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
        <button className="btn btn-accent" onClick={() => navigate('/quiz')}>📝 New Quiz</button>
        <button className="btn btn-outline" onClick={() => navigate('/')}>🏠 Home</button>
      </div>
    </div>
  )
}
