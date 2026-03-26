import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const typeOptions = [
  { value: 'feature_request', label: '💡 Feature Request' },
  { value: 'bug_report', label: '🐛 Bug Report' },
  { value: 'content_request', label: '📚 Content Request' },
  { value: 'general', label: '💬 General Question' },
]
const statusColors = { open: '#f59e0b', in_progress: '#3b82f6', resolved: '#10b981', closed: '#7070a0' }
const statusLabels = { open: '📬 Open', in_progress: '🔧 In Progress', resolved: '✅ Resolved', closed: '📁 Closed' }

export default function ContactAdmin() {
  const [tab, setTab] = useState('new')
  const [tickets, setTickets] = useState([])
  const [type, setType] = useState('general')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }

  useEffect(() => {
    fetch('/api/support', { headers }).then(r => r.json()).then(d => setTickets(d.tickets || []))
  }, [success])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/support', { method: 'POST', headers, body: JSON.stringify({ type, subject, message }) })
      const data = await res.json()
      if (res.ok) { setSuccess(data.message); setSubject(''); setMessage(''); setTab('history') }
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  return (
    <div className="page">
      <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>📩 Contact Admin</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>Request features, report issues, or ask questions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="login-tabs" style={{ marginBottom: 20 }}>
        <button className={`login-tab ${tab === 'new' ? 'active' : ''}`} onClick={() => setTab('new')}>📝 New Ticket</button>
        <button className={`login-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>📜 My Tickets ({tickets.length})</button>
      </div>

      {tab === 'new' ? (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Type</label>
            <select className="input select" value={type} onChange={e => setType(e.target.value)}>
              {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Subject</label>
            <input className="input" placeholder="Brief title for your request..." value={subject} onChange={e => setSubject(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Message</label>
            <textarea className="input textarea" placeholder="Describe your request in detail..." value={message} onChange={e => setMessage(e.target.value)} required rows={5} />
          </div>
          {success && <div style={{ color: 'var(--green)', fontSize: '0.8rem', margin: '10px 0', padding: '10px 12px', background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: 8 }}>✅ {success}</div>}
          <button className="btn btn-accent" type="submit" disabled={loading}>
            {loading ? '⏳ Sending...' : '📤 Submit Ticket'}
          </button>
        </form>
      ) : (
        tickets.length === 0 ? (
          <div className="empty"><div className="e-icon">📬</div><h3>No tickets yet</h3><p>Submit your first support ticket!</p></div>
        ) : (
          tickets.map(t => (
            <div key={t._id} className="ticket-card">
              <div className="flex-between mb-4">
                <h4>{t.subject}</h4>
                <span className="badge" style={{ background: `${statusColors[t.status]}22`, color: statusColors[t.status] }}>
                  {statusLabels[t.status]}
                </span>
              </div>
              <p>{t.message}</p>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 6 }}>{new Date(t.createdAt).toLocaleString()}</div>
              {t.adminReply && (
                <div className="ticket-reply">
                  <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 700, marginBottom: 4 }}>📨 Admin Reply:</div>
                  <p style={{ fontSize: '0.85rem' }}>{t.adminReply}</p>
                </div>
              )}
            </div>
          ))
        )
      )}
    </div>
  )
}
