import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function QuizPlay({ user }) {
  const [searchParams] = useSearchParams()
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [skipped, setSkipped] = useState({})
  const [flagged, setFlagged] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showMap, setShowMap] = useState(false)
  const [attemptId, setAttemptId] = useState(null)
  const startTimeRef = useRef(Date.now())
  const navigate = useNavigate()

  const quizType = searchParams.get('type') || 'subject'

  useEffect(() => {
    const token = localStorage.getItem('token')
    const body = { quizType }
    if (searchParams.get('difficulty')) body.difficulty = searchParams.get('difficulty')
    if (searchParams.get('subject')) body.subject = searchParams.get('subject')
    if (searchParams.get('subjectCode')) body.subjectCode = searchParams.get('subjectCode')
    if (searchParams.get('unit')) body.unit = searchParams.get('unit')

    fetch('/api/quizzes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body)
    }).then(r => r.json()).then(d => {
      if (d.questions && d.questions.length > 0) {
        setQuestions(d.questions)
        setAttemptId(d.attemptId)
        const mins = { subject: 10, unit: 25, grand: 90, mock: 180 }
        setTimeLeft((mins[quizType] || 15) * 60)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [searchParams])

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || questions.length === 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); handleSubmit(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [questions.length])

  const handleSubmit = useCallback(() => {
    if (!attemptId) return
    const token = localStorage.getItem('token')
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000)
    const answersArray = questions.map((_, i) => answers[i] !== undefined ? answers[i] : -1)

    fetch('/api/quizzes/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ attemptId, answers: answersArray, timeTaken })
    }).then(() => {
      navigate(`/quiz/result?id=${attemptId}`, { replace: true })
    }).catch(() => {
      navigate(`/quiz/result?id=${attemptId}`, { replace: true })
    })
  }, [answers, questions, attemptId, navigate])

  const handleSkip = () => {
    setSkipped(prev => ({ ...prev, [current]: true }))
    if (current < questions.length - 1) setCurrent(c => c + 1)
  }

  const handleBack = () => {
    if (current > 0) setCurrent(c => c - 1)
  }

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  if (loading) return (
    <div className="quiz-screen flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
      <div className="spinner"></div>
      <p style={{ color: 'var(--text3)', marginTop: 12 }}>Generating quiz...</p>
    </div>
  )

  if (!questions.length) return (
    <div className="quiz-screen flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>😕</div>
      <h3 style={{ color: 'var(--text)' }}>No questions available</h3>
      <p style={{ color: 'var(--text3)', marginBottom: 16 }}>Upload questions via Admin Panel first</p>
      <button className="btn btn-accent btn-sm" onClick={() => navigate('/quiz')}>← Go Back</button>
    </div>
  )

  const q = questions[current]
  const progress = ((current + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length
  const skippedCount = Object.keys(skipped).filter(k => answers[k] === undefined).length

  return (
    <div className="quiz-screen">
      {/* Header */}
      <div className="quiz-header">
        <button className="back-btn" onClick={() => { if (confirm('Leave quiz? Progress will be lost.')) navigate('/quiz') }} style={{ padding: '6px 10px', fontSize: '0.85rem' }}>✕</button>
        <div className="question-counter">
          <span style={{ fontWeight: 800 }}>{current + 1}</span>
          <span style={{ color: 'var(--text3)' }}>/{questions.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="back-btn" onClick={() => setShowMap(!showMap)} style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
            {showMap ? '✕' : '🗺️'}
          </button>
          <div className={`timer ${timeLeft < 60 ? 'danger' : timeLeft < 300 ? 'warning' : ''}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="quiz-progress"><div className="quiz-progress-fill" style={{ width: `${progress}%` }}></div></div>

      {/* Stats bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '6px 0', fontSize: '0.65rem', fontWeight: 600 }}>
        <span style={{ color: 'var(--green)' }}>✅ {answeredCount} answered</span>
        <span style={{ color: 'var(--orange)' }}>⏭ {skippedCount} skipped</span>
        <span style={{ color: 'var(--text3)' }}>📋 {questions.length - answeredCount} remaining</span>
      </div>

      {/* Question Map */}
      {showMap && (
        <div className="glass-card mb-4" style={{ padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => { setCurrent(i); setShowMap(false) }}
                style={{
                  width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: '0.7rem', fontWeight: 700, fontFamily: 'Inter',
                  background: i === current ? 'var(--accent)' : answers[i] !== undefined ? 'var(--green)' : skipped[i] ? 'var(--orange)' : flagged[i] ? '#FF4081' : 'var(--bg3)',
                  color: (i === current || answers[i] !== undefined || skipped[i]) ? 'white' : 'var(--text3)'
                }}>
                {i + 1}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'center', fontSize: '0.6rem' }}>
            <span style={{ color: 'var(--green)' }}>● Answered</span>
            <span style={{ color: 'var(--orange)' }}>● Skipped</span>
            <span style={{ color: '#FF4081' }}>● Flagged</span>
            <span style={{ color: 'var(--text3)' }}>● Pending</span>
          </div>
        </div>
      )}

      {/* Question Card */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Skipped badge */}
        {skipped[current] && answers[current] === undefined && (
          <div style={{ textAlign: 'center', padding: '4px 12px', borderRadius: 20, background: 'rgba(255,183,77,0.1)', border: '1px solid rgba(255,183,77,0.2)', color: 'var(--orange)', fontSize: '0.7rem', fontWeight: 600, alignSelf: 'center' }}>
            ⏭ Skipped — you can answer now
          </div>
        )}

        <div className="question-text">{q.questionText}</div>

        {/* Options */}
        <div className="options">
          {q.options?.map((opt, i) => (
            <button key={i} className={`option-btn ${answers[current] === i ? 'selected' : ''}`}
              onClick={() => {
                setAnswers(prev => ({ ...prev, [current]: i }))
                // Remove from skipped if answered
                if (skipped[current]) setSkipped(prev => { const n = {...prev}; delete n[current]; return n })
              }}>
              <span className="option-label">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="quiz-nav" style={{ display: 'flex', gap: 6, padding: '12px 0' }}>
        {/* Back */}
        <button className="btn btn-outline btn-sm" onClick={handleBack} disabled={current === 0}
          style={{ opacity: current === 0 ? 0.4 : 1 }}>
          ← Back
        </button>

        {/* Flag */}
        <button className="btn btn-outline btn-sm" onClick={() => setFlagged(p => ({ ...p, [current]: !p[current] }))} style={{ flex: 0, minWidth: 'auto', padding: '6px 10px' }}>
          {flagged[current] ? '🚩' : '🏳️'}
        </button>

        <div style={{ flex: 1 }}></div>

        {/* Skip */}
        {current < questions.length - 1 && (
          <button className="btn btn-outline btn-sm" onClick={handleSkip} style={{ color: 'var(--orange)', borderColor: 'rgba(255,183,77,0.3)' }}>
            Skip ⏭
          </button>
        )}

        {/* Next / Submit */}
        {current < questions.length - 1 ? (
          <button className="btn btn-accent btn-sm" onClick={() => setCurrent(c => c + 1)}>
            Next →
          </button>
        ) : (
          <button className="btn btn-green btn-sm" onClick={handleSubmit} style={{ minWidth: 100 }}>
            ✅ Submit
          </button>
        )}
      </div>
    </div>
  )
}
