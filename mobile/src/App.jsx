import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import LoginScreen from './pages/LoginScreen'
import PendingApproval from './pages/PendingApproval'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import QuizSelect from './pages/QuizSelect'
import QuizPlay from './pages/QuizPlay'
import QuizResult from './pages/QuizResult'
import NotesPage from './pages/NotesPage'
import NoteView from './pages/NoteView'
import LearnPage from './pages/LearnPage'
import PreviousPapers from './pages/PreviousPapers'
import StudyTimer from './pages/StudyTimer'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import NotificationsPage from './pages/NotificationsPage'
import ContactAdmin from './pages/ContactAdmin'

// Toast context
const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/quiz', label: 'Quiz', icon: '📝' },
  { path: '/learn', label: 'Learn', icon: '🎓' },
  { path: '/notes', label: 'Notes', icon: '📚' },
  { path: '/profile', label: 'Profile', icon: '👤' },
]

function BottomNav() {
  const location = useLocation()
  const isQuizActive = location.pathname.startsWith('/quiz/play')
  if (isQuizActive) return null

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <Link key={item.path} to={item.path}
          className={`nav-btn ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}>
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

// Blocked User Screen with reason + support
function BlockedScreen({ user, onLogout }) {
  const [showContact, setShowContact] = useState(false)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const sendMessage = async () => {
    if (!message.trim()) return
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: 'general', subject: 'Account Suspension Appeal', message })
      })
      setSent(true)
    } catch { /* ignore */ }
  }

  return (
    <div className="pending-screen">
      <div className="pending-icon" style={{ animation: 'none' }}>🚫</div>
      <div className="pending-title" style={{ color: 'var(--red)' }}>Account Suspended</div>
      <div className="pending-desc">
        Your account has been suspended by the admin. You no longer have access to quizzes, notes, or study materials.
      </div>

      {user?.blacklistReason && (
        <div className="glass-card" style={{ maxWidth: 360, width: '100%', textAlign: 'left', marginBottom: 20 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            ⚠️ Reason for Suspension
          </div>
          <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.6 }}>{user.blacklistReason}</p>
        </div>
      )}

      {!showContact ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
          <button className="btn btn-accent" onClick={() => setShowContact(true)}>📩 Appeal / Contact Admin</button>
          <button className="btn btn-red" onClick={onLogout}>🚪 Logout</button>
        </div>
      ) : sent ? (
        <div className="glass-card" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
          <h3 style={{ color: 'var(--green)', marginBottom: 6, fontFamily: 'Outfit' }}>Appeal Sent!</h3>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Admin will review your appeal. Check back later.</p>
          <button className="btn btn-red" onClick={onLogout} style={{ marginTop: 16 }}>🚪 Logout</button>
        </div>
      ) : (
        <div className="glass-card" style={{ maxWidth: 360, width: '100%', textAlign: 'left' }}>
          <h3 style={{ color: 'var(--text)', fontFamily: 'Outfit', marginBottom: 12 }}>📩 Send Appeal</h3>
          <textarea className="input textarea" rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="Explain why your account should be reinstated..." />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn btn-accent btn-sm" onClick={sendMessage} style={{ flex: 1 }}>📤 Send</button>
            <button className="btn btn-outline btn-sm" onClick={() => setShowContact(false)} style={{ flex: 0 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

function DeletedScreen({ onLogout }) {
  return (
    <div className="pending-screen">
      <div className="pending-icon" style={{ animation: 'none' }}>😔</div>
      <div className="pending-title" style={{ color: 'var(--red)' }}>Account Removed</div>
      <div className="pending-desc">
        Your account has been deleted by the admin. If you believe this was a mistake, please create a new account and contact the admin.
      </div>
      <button className="btn btn-accent" onClick={onLogout} style={{ maxWidth: 340, width: '100%' }}>🔄 Return to Login</button>
    </div>
  )
}

function AppContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        setUser(parsed)
        fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => {
            if (r.status === 401) { setDeleted(true); return null }
            return r.json()
          })
          .then(d => {
            if (d?.user) { setUser(d.user); localStorage.setItem('user', JSON.stringify(d.user)) }
          })
          .catch(() => {})
      } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setDeleted(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setDeleted(false)
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.status === 401) { setDeleted(true); return }
      const data = await res.json()
      if (data.user) { setUser(data.user); localStorage.setItem('user', JSON.stringify(data.user)) }
    } catch { /* ignore */ }
  }

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
        <div style={{ color: 'var(--text3)' }}>Loading...</div>
      </div>
    </div>
  )

  if (deleted) return <DeletedScreen onLogout={handleLogout} />
  if (!user) return <LoginScreen onLogin={handleLogin} />
  if (user.status === 'blacklisted') return <BlockedScreen user={user} onLogout={handleLogout} />

  if (user.status === 'pending') {
    return (
      <Routes>
        <Route path="/contact" element={<ContactAdmin />} />
        <Route path="*" element={<PendingApproval user={user} onLogout={handleLogout} onRefresh={refreshUser} />} />
      </Routes>
    )
  }

  if (!user.branch) return <Onboarding user={user} onComplete={(branch, college) => {
    const updated = { ...user, branch, college }
    setUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
  }} />

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/quiz" element={<QuizSelect user={user} />} />
        <Route path="/quiz/play" element={<QuizPlay user={user} />} />
        <Route path="/quiz/result" element={<QuizResult user={user} />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/notes" element={<NotesPage user={user} />} />
        <Route path="/notes/:id" element={<NoteView />} />
        <Route path="/papers" element={<PreviousPapers />} />
        <Route path="/timer" element={<StudyTimer />} />
        <Route path="/leaderboard" element={<Leaderboard user={user} />} />
        <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/contact" element={<ContactAdmin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  )
}
