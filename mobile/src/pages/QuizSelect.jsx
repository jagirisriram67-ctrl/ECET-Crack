import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function QuizSelect({ user }) {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const [quizType, setQuizType] = useState(searchParams.get('type') || '')
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [difficulty, setDifficulty] = useState('mixture')
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(d.subjects || []))
  }, [])

  useEffect(() => {
    if (searchParams.get('type')) { setQuizType(searchParams.get('type')); setStep(2) }
  }, [searchParams])

  const filteredSubjects = quizType === 'mock' ? subjects : subjects.filter(s => s.isCommon || s.branch === user?.branch)

  // Accept direct params to avoid React state timing issues
  const startQuiz = (overrideSub, overrideUnit) => {
    const sub = overrideSub || selectedSubject
    const unit = overrideUnit || selectedUnit
    const params = new URLSearchParams()
    params.set('type', quizType)
    if (quizType === 'mock') params.set('difficulty', difficulty)
    if (sub) { params.set('subject', sub.name); params.set('subjectCode', sub.code) }
    if (unit) params.set('unit', unit.unitNumber)
    navigate(`/quiz/play?${params}`)
  }

  return (
    <div className="page">
      <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
        {step > 1 && <button className="back-btn" onClick={() => setStep(s => s - 1)}>←</button>}
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>📝 Start Quiz</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>Step {step} of {quizType === 'mock' ? 2 : quizType === 'subject' ? 2 : 3}</p>
        </div>
      </div>

      {step === 1 && (
        <>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Choose Quiz Type</h3>
          <div className="quiz-grid">
            {[
              { type: 'subject', title: 'Subject Quiz', desc: '10 random questions', icon: '📘', bg: 'linear-gradient(135deg, rgba(124,77,255,0.12) 0%, rgba(68,138,255,0.08) 100%)' },
              { type: 'unit', title: 'Unit Test', desc: '20 marks per unit', icon: '📋', bg: 'linear-gradient(135deg, rgba(0,230,118,0.12) 0%, rgba(0,200,83,0.06) 100%)' },
              { type: 'grand', title: 'Grand Test', desc: '100 marks full subject', icon: '🏆', bg: 'linear-gradient(135deg, rgba(255,183,77,0.12) 0%, rgba(255,152,0,0.06) 100%)' },
              { type: 'mock', title: 'Mock ECET', desc: 'Full exam simulation', icon: '🎯', bg: 'linear-gradient(135deg, rgba(255,64,129,0.12) 0%, rgba(255,23,68,0.06) 100%)' },
            ].map(q => (
              <div key={q.type} className="quiz-type-card" style={{ background: q.bg, borderColor: quizType === q.type ? 'var(--accent)' : 'var(--border)' }} onClick={() => { setQuizType(q.type); setStep(2) }}>
                <div className="qt-icon">{q.icon}</div>
                <div className="qt-title">{q.title}</div>
                <div className="qt-desc">{q.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
            {quizType === 'mock' ? 'Ready for Mock ECET?' : 'Choose Subject'}
          </h3>
          {quizType === 'mock' ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎯</div>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Full ECET Mock Test</h3>
              <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: 20 }}>200 questions • 3 hours • All subjects</p>
              
              <div style={{ marginBottom: 20, textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text2)', marginBottom: 6, display: 'block' }}>Difficulty Level</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['mixture', 'easy', 'medium', 'hard'].map(level => (
                    <button key={level} 
                      onClick={() => setDifficulty(level)}
                      style={{ 
                        padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                        background: difficulty === level ? 'var(--accent)' : 'var(--bg3)', 
                        color: difficulty === level ? 'white' : 'var(--text)' 
                      }}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-accent" onClick={() => startQuiz()}>🚀 Start Mock Test</button>
            </div>
          ) : (
            filteredSubjects.length === 0 ? (
              <div className="empty">
                <div className="e-icon">📚</div>
                <h3>No subjects found</h3>
                <p>Ask admin to add subjects first</p>
              </div>
            ) : filteredSubjects.map(s => (
              <div key={s._id} className="glass-card mb-4" style={{ cursor: 'pointer', borderColor: selectedSubject?._id === s._id ? 'var(--accent)' : 'var(--border)' }}
                onClick={() => {
                  setSelectedSubject(s)
                  if (quizType === 'subject') {
                    // Pass subject directly — don't rely on state
                    startQuiz(s)
                  } else {
                    setStep(3)
                  }
                }}>
                <div className="flex gap-3" style={{ alignItems: 'center' }}>
                  <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>{s.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{s.units?.length} units • {s.totalQuestions || 0} questions</div>
                  </div>
                  <span className="badge" style={{ background: 'rgba(124,77,255,0.15)', color: 'var(--accent)' }}>{s.code}</span>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {step === 3 && selectedSubject && (
        <>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
            {quizType === 'grand' ? 'Grand Test Ready' : 'Choose Unit'}
          </h3>
          {quizType === 'grand' ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>{selectedSubject.icon}</div>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{selectedSubject.name} Grand Test</h3>
              <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: 20 }}>100 marks • All units</p>
              <button className="btn btn-accent" onClick={() => startQuiz()}>🚀 Start Grand Test</button>
            </div>
          ) : (
            selectedSubject.units?.length === 0 ? (
              <div className="empty">
                <div className="e-icon">📋</div>
                <h3>No units found</h3>
                <p>This subject has no units yet</p>
              </div>
            ) : selectedSubject.units?.map(u => (
              <div key={u.unitNumber} className="glass-card mb-4" style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedUnit(u)
                  // Pass both subject and unit directly
                  startQuiz(selectedSubject, u)
                }}>
                <div className="flex-between">
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Unit {u.unitNumber}: {u.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 2 }}>{u.questionCount || 0} questions • 20 marks</div>
                  </div>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>→</span>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
