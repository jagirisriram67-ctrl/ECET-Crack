import { useState, useEffect } from 'react'
import { notificationAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', type: 'general', targetBranch: 'ALL', icon: '🔔' })

  const load = () => {
    notificationAPI.getAll().then(res => { setNotifications(res.data.notifications); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  const handleSend = async () => {
    if (!form.title || !form.body) return toast.error('Title and body are required')
    try { await notificationAPI.create(form); toast.success('Notification sent! 🔔'); setShowModal(false); setForm({ title: '', body: '', type: 'general', targetBranch: 'ALL', icon: '🔔' }); load() }
    catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return
    try { await notificationAPI.delete(id); toast.success('Deleted!'); load() }
    catch { toast.error('Failed') }
  }

  const typeIcons = { quiz: '📝', note: '📚', general: '📢', update: '🆕', achievement: '🏆' }

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div><h2>🔔 Notifications</h2><p>Send announcements to students</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>📤 Send Notification</button>
      </div>

      {loading ? <div className="skeleton" style={{ height: 300 }} /> : notifications.length === 0 ? (
        <div className="empty-state"><div className="icon">🔔</div><h3>No notifications yet</h3><p>Send your first notification to students</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifications.map(n => (
            <div key={n._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: '2rem' }}>{typeIcons[n.type] || '🔔'}</span>
              <div style={{ flex: 1 }}>
                <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 700 }}>{n.title}</h4>
                  <span className="badge badge-primary">{n.type}</span>
                  <span className="badge badge-info">{n.targetBranch}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{n.body}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n._id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>📤 Send Notification</h3>
            <div className="form-group"><label className="form-label">Title</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="New Mock Test Available!" /></div>
            <div className="form-group"><label className="form-label">Message Body</label>
              <textarea className="form-textarea" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="New ECET Mock Test 2026 is now available. Practice and crack the exam!" /></div>
            <div className="grid grid-2">
              <div className="form-group"><label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="general">📢 General</option>
                  <option value="quiz">📝 New Quiz</option>
                  <option value="note">📚 New Notes</option>
                  <option value="update">🆕 App Update</option>
                  <option value="achievement">🏆 Achievement</option>
                </select></div>
              <div className="form-group"><label className="form-label">Target Branch</label>
                <select className="form-select" value={form.targetBranch} onChange={e => setForm({ ...form, targetBranch: e.target.value })}>
                  <option value="ALL">All Branches</option>
                  {['CSE','ECE','EEE','MECH','CIVIL'].map(b => <option key={b} value={b}>{b}</option>)}
                </select></div>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-primary" onClick={handleSend}>🚀 Send to Students</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
