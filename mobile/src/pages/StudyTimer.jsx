import { useState, useEffect, useRef, useCallback } from 'react'

const MODES = [
  { name: 'Focus', minutes: 25, color: '#7C4DFF', icon: '🧠' },
  { name: 'Short Break', minutes: 5, color: '#00E676', icon: '☕' },
  { name: 'Long Break', minutes: 15, color: '#448AFF', icon: '🌴' },
]

export default function StudyTimer() {
  const [modeIdx, setModeIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(MODES[0].minutes * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef(null)

  const mode = MODES[modeIdx]
  const total = mode.minutes * 60
  const pct = ((total - timeLeft) / total) * 100
  const r = 90, circ = 2 * Math.PI * r

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            // Play notification sound
            try { new Audio('data:audio/wav;base64,UklGRl9vT19teleR2...').play() } catch {}
            if (modeIdx === 0) setSessions(s => s + 1)
            // Auto switch mode
            setModeIdx(i => (i + 1) % 3)
            return MODES[(modeIdx + 1) % 3].minutes * 60
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, modeIdx])

  const toggleTimer = () => setRunning(r => !r)
  const resetTimer = () => { setRunning(false); setTimeLeft(mode.minutes * 60) }
  const switchMode = (idx) => { setModeIdx(idx); setRunning(false); setTimeLeft(MODES[idx].minutes * 60) }

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="page" style={{ textAlign: 'center', paddingTop: 20 }}>
      <h1 className="page-title">⏱️ Study Timer</h1>
      <p className="page-sub">Pomodoro technique — Stay focused!</p>

      {/* Mode Selector */}
      <div className="login-tabs" style={{ marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
        {MODES.map((m, i) => (
          <button key={i} className={`login-tab ${modeIdx === i ? 'active' : ''}`} onClick={() => switchMode(i)}>
            {m.icon} {m.name}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto 24px' }}>
        <svg width={220} height={220} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={110} cy={110} r={r} fill="none" stroke="var(--bg3)" strokeWidth={8} />
          <circle cx={110} cy={110} r={r} fill="none" stroke={mode.color} strokeWidth={8}
            strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: mode.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{mode.icon} {mode.name}</div>
          <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.8rem', color: 'var(--text)', lineHeight: 1.2 }}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
        <button className={`btn ${running ? 'btn-red' : 'btn-accent'}`} onClick={toggleTimer} style={{ minWidth: 120, fontSize: '1rem' }}>
          {running ? '⏸ Pause' : '▶️ Start'}
        </button>
        <button className="btn btn-outline" onClick={resetTimer}>🔄 Reset</button>
      </div>

      {/* Sessions Today */}
      <div className="glass-card" style={{ maxWidth: 320, margin: '0 auto' }}>
        <div className="flex-between">
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 600 }}>Sessions Today</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '2rem', color: 'var(--accent)' }}>{sessions}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 600 }}>Focus Time</div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: 'var(--green)' }}>{sessions * 25} min</div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="glass-card" style={{ maxWidth: 320, margin: '16px auto 0', textAlign: 'left' }}>
        <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--text)', fontSize: '0.85rem', marginBottom: 8 }}>💡 Pomodoro Tips</h4>
        <ul style={{ color: 'var(--text2)', fontSize: '0.75rem', lineHeight: 1.8, paddingLeft: 16, margin: 0 }}>
          <li>Focus for 25 minutes, then take a 5-min break</li>
          <li>After 4 sessions, take a 15-minute long break</li>
          <li>Turn off distractions during focus time</li>
          <li>Use breaks to stretch and hydrate 💧</li>
        </ul>
      </div>
    </div>
  )
}
