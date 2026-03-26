import { useState, useEffect } from 'react'
import { supportAPI } from '../services/api'

const typeIcons = { feature_request: '💡', bug_report: '🐛', general: '💬', content_request: '📚' }
const typeLabels = { feature_request: 'Feature Request', bug_report: 'Bug Report', general: 'General', content_request: 'Content Request' }
const statusColors = { open: '#f59e0b', in_progress: '#3b82f6', resolved: '#10b981', closed: '#64748b' }

export default function Support() {
  const [tickets, setTickets] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [replyModal, setReplyModal] = useState(null)
  const [reply, setReply] = useState('')
  const [replyStatus, setReplyStatus] = useState('resolved')

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter) params.status = filter
      const res = await supportAPI.getAll(params)
      setTickets(res.data.tickets)
      setCounts(res.data.counts)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const handleReply = async () => {
    if (!reply.trim()) return
    await supportAPI.reply(replyModal._id, { adminReply: reply, status: replyStatus })
    setReplyModal(null); setReply(''); load()
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this ticket?')) { await supportAPI.delete(id); load() }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📩 Support Tickets</h2>
        <p>Respond to student queries and feature requests</p>
      </div>

      {/* Counts */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { key: 'open', label: 'Open', icon: '📬', color: '#f59e0b' },
          { key: 'in_progress', label: 'In Progress', icon: '🔧', color: '#3b82f6' },
          { key: 'resolved', label: 'Resolved', icon: '✅', color: '#10b981' },
          { key: 'total', label: 'Total', icon: '📊', color: '#6C63FF' },
        ].map(s => (
          <div key={s.key} className="stat-card" onClick={() => setFilter(s.key === 'total' ? '' : s.key)} style={{ cursor: 'pointer', borderBottom: (filter === s.key || (!filter && s.key === 'total')) ? `3px solid ${s.color}` : 'none' }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{counts[s.key] || 0}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tickets List */}
      {loading ? <div className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>Loading...</div> : tickets.length === 0 ? (
        <div className="empty-state"><div className="icon">📬</div><h3>No tickets</h3><p>All caught up!</p></div>
      ) : (
        tickets.map(t => (
          <div key={t._id} className="card mb-4" style={{ borderLeft: `4px solid ${statusColors[t.status]}` }}>
            <div className="flex-between mb-4">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem' }}>{typeIcons[t.type]}</span>
                <div>
                  <div style={{ fontWeight: 700 }}>{t.subject}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {t.user?.name} ({t.user?.email}) • {t.user?.branch || '-'} • {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="badge" style={{ background: `${statusColors[t.status]}22`, color: statusColors[t.status] }}>{t.status.replace('_', ' ')}</span>
                <span className="badge badge-info">{typeLabels[t.type]}</span>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6, background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>{t.message}</p>
            {t.adminReply && (
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>📨 Admin Reply</div>
                <p style={{ color: 'var(--text-primary)' }}>{t.adminReply}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={() => { setReplyModal(t); setReply(t.adminReply || '') }}>💬 Reply</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id)}>🗑</button>
            </div>
          </div>
        ))
      )}

      {/* Reply Modal */}
      {replyModal && (
        <div className="modal-overlay" onClick={() => setReplyModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>💬 Reply to: "{replyModal.subject}"</h3>
            <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Student message:</div>
              <p style={{ color: 'var(--text-secondary)' }}>{replyModal.message}</p>
            </div>
            <div className="form-group">
              <label className="form-label">Your Reply</label>
              <textarea className="form-textarea" rows={4} value={reply} onChange={e => setReply(e.target.value)} placeholder="Type reply..." />
            </div>
            <div className="form-group">
              <label className="form-label">Set Status</label>
              <select className="form-select" value={replyStatus} onChange={e => setReplyStatus(e.target.value)}>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={handleReply}>Send Reply</button>
              <button className="btn btn-ghost" onClick={() => setReplyModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
