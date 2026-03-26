import { useState, useEffect } from 'react'
import { adminAPI } from '../services/api'

const statusColors = { pending: '#f59e0b', approved: '#10b981', blacklisted: '#ef4444' }
const statusIcons = { pending: '⏳', approved: '✅', blacklisted: '🚫' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [passModal, setPassModal] = useState(null)
  const [newPass, setNewPass] = useState('')
  const [blacklistReason, setBlacklistReason] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = { limit: 100 }
      if (tab !== 'all') params.status = tab
      if (search) params.search = search
      const res = await adminAPI.getUsers(params)
      setUsers(res.data.users)
      setCounts(res.data.counts || {})
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [tab, search])

  const handleApprove = async (id) => {
    await adminAPI.approveUser(id); loadUsers(); setModal(null)
  }
  const handleBlacklist = async (id) => {
    await adminAPI.blacklistUser(id, blacklistReason); loadUsers(); setModal(null); setBlacklistReason('')
  }
  const handleUnblock = async (id) => {
    await adminAPI.unblockUser(id); loadUsers(); setModal(null)
  }
  const handleResetPass = async (id) => {
    if (newPass.length < 6) return alert('Min 6 chars')
    await adminAPI.resetPassword(id, newPass); setPassModal(null); setNewPass('')
    alert('Password reset!')
  }
  const handleDelete = async (id) => {
    if (confirm('Delete this user permanently?')) { await adminAPI.deleteUser(id); loadUsers() }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>👥 User Management</h2>
        <p>Approve, manage, and monitor students</p>
      </div>

      {/* Status Counts */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { key: 'total', label: 'Total Users', icon: '👥', color: '#6C63FF' },
          { key: 'pending', label: 'Pending', icon: '⏳', color: '#f59e0b' },
          { key: 'approved', label: 'Approved', icon: '✅', color: '#10b981' },
          { key: 'blacklisted', label: 'Blacklisted', icon: '🚫', color: '#ef4444' },
        ].map(s => (
          <div key={s.key} className="stat-card" onClick={() => s.key !== 'total' ? setTab(s.key) : setTab('all')} style={{ cursor: 'pointer', borderBottom: tab === s.key || (s.key === 'total' && tab === 'all') ? `3px solid ${s.color}` : 'none' }}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{counts[s.key] || 0}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6" style={{ alignItems: 'center' }}>
        <input className="form-input" placeholder="🔍 Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
      </div>

      {/* Users Table */}
      {loading ? <div className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>Loading...</div> : users.length === 0 ? (
        <div className="empty-state"><div className="icon">👥</div><h3>No users found</h3></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Quizzes</th>
                <th>Avg Score</th>
                <th>Streak</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${(u.name?.charCodeAt(0) || 65) * 5}, 50%, 35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-primary">{u.branch || '-'}</span></td>
                  <td>
                    <span className="badge" style={{ background: `${statusColors[u.status]}22`, color: statusColors[u.status] }}>
                      {statusIcons[u.status]} {u.status}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'Outfit', fontWeight: 700 }}>{u.stats?.totalAttempts || 0}</td>
                  <td style={{ fontFamily: 'Outfit', fontWeight: 700, color: (u.stats?.avgScore || 0) >= 70 ? 'var(--success)' : (u.stats?.avgScore || 0) >= 40 ? 'var(--warning)' : 'var(--danger)' }}>{u.stats?.avgScore || 0}%</td>
                  <td>🔥 {u.stats?.streak || 0}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {u.status === 'pending' && <button className="btn btn-success btn-sm" onClick={() => handleApprove(u._id)}>✅ Approve</button>}
                      {u.status === 'approved' && <button className="btn btn-danger btn-sm" onClick={() => setModal({ type: 'blacklist', user: u })}>🚫 Ban</button>}
                      {u.status === 'blacklisted' && <button className="btn btn-ghost btn-sm" onClick={() => handleUnblock(u._id)}>🔓 Unblock</button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => setPassModal(u)}>🔑</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)} style={{ padding: '4px 8px' }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Blacklist Modal */}
      {modal?.type === 'blacklist' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🚫 Blacklist "{modal.user.name}"</h3>
            <div className="form-group">
              <label className="form-label">Reason for blacklisting</label>
              <textarea className="form-textarea" placeholder="Enter reason..." value={blacklistReason} onChange={e => setBlacklistReason(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-danger" onClick={() => handleBlacklist(modal.user._id)}>Confirm Blacklist</button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {passModal && (
        <div className="modal-overlay" onClick={() => setPassModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🔑 Reset Password for "{passModal.name}"</h3>
            <div className="form-group">
              <label className="form-label">New Password (min 6 chars)</label>
              <input className="form-input" type="text" placeholder="Enter new password..." value={newPass} onChange={e => setNewPass(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={() => handleResetPass(passModal._id)}>Reset Password</button>
              <button className="btn btn-ghost" onClick={() => setPassModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
