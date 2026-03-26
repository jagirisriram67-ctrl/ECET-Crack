import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setNotifications(d.notifications || [])).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const typeIcons = { update: '🔔', exam: '📝', important: '⚡', general: '💬' }

  const timeAgo = (date) => {
    const secs = Math.floor((Date.now() - new Date(date)) / 1000)
    if (secs < 60) return 'Just now'
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
    return `${Math.floor(secs / 86400)}d ago`
  }

  return (
    <div className="page">
      <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>🔔 Notifications</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>Stay updated with the latest</p>
        </div>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div></div> : notifications.length === 0 ? (
        <div className="empty"><div className="e-icon">🔔</div><h3>No notifications</h3><p>You're all caught up!</p></div>
      ) : (
        notifications.map(n => (
          <div key={n._id} className="notif-item">
            <div className="notif-icon">{typeIcons[n.type] || '🔔'}</div>
            <div className="notif-body">
              <h4>{n.title}</h4>
              <p>{n.message}</p>
              <div className="notif-time">{timeAgo(n.createdAt)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
