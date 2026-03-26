import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LearnPage() {
  const [flashcards, setFlashcards] = useState([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState({})
  const [saved, setSaved] = useState({})
  const [flipped, setFlipped] = useState({})
  const [hearts, setHearts] = useState({})
  const [currentIdx, setCurrentIdx] = useState(0)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  const token = localStorage.getItem('token')
  const headers = { 'Authorization': `Bearer ${token}` }

  useEffect(() => {
    // Load daily + all cards
    Promise.all([
      fetch('/api/flashcards/daily', { headers }).then(r => r.json()),
      fetch('/api/flashcards?limit=200', { headers }).then(r => r.json()),
    ]).then(([daily, all]) => {
      // Combine unique
      const map = new Map()
      ;(daily.flashcards || []).forEach(f => map.set(f._id, f))
      ;(all.flashcards || []).forEach(f => { if (!map.has(f._id)) map.set(f._id, f) })
      setFlashcards(Array.from(map.values()))
    }).catch(() => {}).finally(() => setLoading(false))

    // Load saved bookmarks
    fetch('/api/bookmarks', { headers }).then(r => r.json())
      .then(d => {
        const savedMap = {}
        ;(d.bookmarks || []).forEach(b => { savedMap[b._id || b] = true })
        setSaved(savedMap)
      }).catch(() => {})
  }, [])

  // Detect current card via scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const scrollTop = container.scrollTop
    const cardHeight = container.clientHeight
    const idx = Math.round(scrollTop / cardHeight)
    setCurrentIdx(idx)
  }, [])

  // Double-tap to like
  const lastTapRef = useRef({})
  const handleTap = (cardId, idx) => {
    const now = Date.now()
    const lastTap = lastTapRef.current[cardId] || 0

    if (now - lastTap < 300) {
      // Double tap — like with heart animation
      setLiked(prev => ({ ...prev, [cardId]: !prev[cardId] }))
      setHearts(prev => ({ ...prev, [cardId]: true }))
      setTimeout(() => setHearts(prev => ({ ...prev, [cardId]: false })), 800)
    } else {
      // Single tap — flip
      setFlipped(prev => ({ ...prev, [cardId]: !prev[cardId] }))
    }
    lastTapRef.current[cardId] = now
  }

  const toggleSave = (cardId) => {
    setSaved(prev => ({ ...prev, [cardId]: !prev[cardId] }))
    // Optional: persist to backend
    fetch(`/api/bookmarks/${cardId}`, { method: 'POST', headers }).catch(() => {})
  }

  if (loading) return (
    <div className="page flex-center" style={{ height: '100vh' }}>
      <div className="spinner"></div>
    </div>
  )

  if (flashcards.length === 0) return (
    <div className="page flex-center" style={{ height: '100vh', flexDirection: 'column' }}>
      <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎓</div>
      <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No flashcards yet</h3>
      <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>Admin will upload daily topics soon!</p>
      <button className="btn btn-accent btn-sm" onClick={() => navigate('/')} style={{ marginTop: 16 }}>← Home</button>
    </div>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: 'linear-gradient(180deg, rgba(10,10,26,0.95) 0%, transparent 100%)'
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer' }}>←</button>
        <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>🎓 Learn</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 600 }}>{currentIdx + 1}/{flashcards.length}</div>
      </div>

      {/* Reels Container */}
      <div ref={containerRef} onScroll={handleScroll}
        style={{
          flex: 1, overflowY: 'scroll', scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
        }}>
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {flashcards.map((card, idx) => {
          // Vibrant array of dark & light unique gradients
          const REEL_COLORS = [
            'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
            'linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)',
            'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)',
            'linear-gradient(135deg, #0cebeb 0%, #20e3b2 50%, #29ffc6 100%)',
            'linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)',
            'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
            'linear-gradient(135deg, #1e1366 0%, #2a0845 100%)',
            'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            'linear-gradient(135deg, #C04848 0%, #480048 100%)',
            'linear-gradient(135deg, #5f2c82 0%, #49a09d 100%)',
            'linear-gradient(135deg, #23074d 0%, #cc5333 100%)',
            'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)'
          ];
          const bgTexture = REEL_COLORS[idx % REEL_COLORS.length];

          return (
            <div key={card._id}
              onClick={() => handleTap(card._id, idx)}
              style={{
                height: '100vh', width: '100%',
                scrollSnapAlign: 'start', scrollSnapStop: 'always',
                position: 'relative', overflow: 'hidden',
                cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none',
                perspective: 1500
              }}>
              
              {/* Flipper container */}
              <div style={{
                width: '100%', height: '100%',
                transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
                transformStyle: 'preserve-3d',
                transform: flipped[card._id] ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}>

                {/* FRONT OF CARD (Question) */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  background: bgTexture,
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center', padding: 24, paddingBottom: 160
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.4, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                    {card.frontText}
                  </div>
                  {card.frontImage && (
                    <img src={card.frontImage} alt="" style={{ maxHeight: 200, width: '100%', objectFit: 'contain', marginTop: 20, borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }} />
                  )}
                  <div style={{ position: 'absolute', top: '50%', transform: 'translateY(120px)', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 500 }}>
                    tap to flip • double tap ❤️
                  </div>
                </div>

                {/* BACK OF CARD (Answer) */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  background: '#111', 
                  border: '6px solid transparent',
                  borderImage: `${bgTexture} 1`,
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center', padding: 24, paddingBottom: 160,
                  transform: 'rotateY(180deg)'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#00E676', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
                    ✅ Answer
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.5 }}>
                    {card.backText}
                  </div>
                  {card.backImage && (
                    <img src={card.backImage} alt="" style={{ maxHeight: 180, width: '100%', objectFit: 'contain', marginTop: 20, borderRadius: 12 }} />
                  )}
                  {card.explanation && (
                    <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.08)', borderRadius: 12, borderLeft: '4px solid #7C4DFF', width: '100%' }}>
                      <div style={{ fontSize: '0.7rem', color: '#b3b3b3', fontWeight: 700, marginBottom: 6 }}>💡 EXPLANATION</div>
                      <div style={{ fontSize: '0.9rem', color: '#eee', lineHeight: 1.5 }}>{card.explanation}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* OVERLAYS (Outside the flipper so they don't flip) */}
              
              {/* Double-tap heart animation */}
              {hearts[card._id] && (
                <div style={{
                  position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 30,
                  animation: 'heartPop 0.8s ease-out forwards',
                  fontSize: '6rem', pointerEvents: 'none', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
                }}>❤️</div>
              )}

              {/* Side Actions (Like, Save, Day, Difficulty) */}
              <div style={{
                position: 'absolute', right: 16, bottom: 90,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, zIndex: 20
              }}>
                {/* Like */}
                <button onClick={(e) => { e.stopPropagation(); setLiked(p => ({ ...p, [card._id]: !p[card._id] })) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', transition: 'transform 0.2s', transform: liked[card._id] ? 'scale(1.2)' : 'scale(1)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                    {liked[card._id] ? '❤️' : '🤍'}
                  </div>
                </button>

                {/* Save/Bookmark */}
                <button onClick={(e) => { e.stopPropagation(); toggleSave(card._id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.6rem', transition: 'transform 0.2s', transform: saved[card._id] ? 'scale(1.2)' : 'scale(1)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                    {saved[card._id] ? '🔖' : '🏷️'}
                  </div>
                </button>

                {/* Difficulty indicator */}
                <div style={{ textAlign: 'center', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                  <div style={{ fontSize: '1.5rem' }}>
                    {card.difficulty === 'hard' ? '🔴' : card.difficulty === 'medium' ? '🟡' : '🟢'}
                  </div>
                </div>

                {/* Day */}
                <div style={{ textAlign: 'center', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                  <div style={{ fontSize: '1.3rem', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', padding: '8px 10px', color: '#fff', fontWeight: 800 }}>
                    d{card.day}
                  </div>
                </div>
              </div>

              {/* Bottom info (Only Topic, no front text) */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
                padding: '40px 16px 20px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
                pointerEvents: 'none'
              }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', fontFamily: 'Outfit', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                  {card.subject} • {card.topic}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Heart pop animation */}
      <style>{`
        @keyframes heartPop {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
