import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { authAPI } from './services/api'
import Dashboard from './pages/Dashboard'
import Questions from './pages/Questions'
import Subjects from './pages/Subjects'
import Notes from './pages/Notes'
import Users from './pages/Users'
import Notifications from './pages/Notifications'
import Support from './pages/Support'
import Flashcards from './pages/Flashcards'
import Papers from './pages/Papers'
import Login from './pages/Login'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/subjects', label: 'Subjects', icon: '📚' },
  { path: '/questions', label: 'Questions', icon: '❓' },
  { path: '/notes', label: 'Notes', icon: '📝' },
  { path: '/flashcards', label: 'Flashcards', icon: '🃏' },
  { path: '/papers', label: 'Past Papers', icon: '📜' },
  { path: '/users', label: 'Students', icon: '👥' },
  { path: '/support', label: 'Support', icon: '📩' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
]

function Sidebar({ user, onLogout }) {
  const location = useLocation()
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>🎯 ECET Crack</h1>
        <p>Admin Control Panel</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <Link key={item.path} to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ fontSize: '0.85rem', marginBottom: 8 }}>
          <strong>{user?.name || 'Admin'}</strong>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{user?.email}</div>
        </div>
        <button className="btn btn-danger btn-sm" onClick={onLogout} style={{ width: '100%' }}>
          🚪 Logout
        </button>
      </div>
    </aside>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      authAPI.getMe()
        .then(res => { setUser(res.data.user); setLoading(false) })
        .catch(() => { localStorage.removeItem('admin_token'); setLoading(false) })
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('admin_token', token)
    setUser(userData)
    navigate('/')
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setUser(null)
    navigate('/login')
  }

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎯</div>
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    </div>
  )

  if (!user) return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )

  return (
    <div className="layout">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/papers" element={<Papers />} />
          <Route path="/users" element={<Users />} />
          <Route path="/support" element={<Support />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
