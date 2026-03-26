export default function PendingApproval({ user, onLogout, onRefresh }) {
  return (
    <div className="pending-screen">
      <div className="pending-icon">⏳</div>
      <div className="pending-title">Awaiting Admin Approval</div>
      <div className="pending-desc">
        Your account <strong style={{ color: 'var(--text)' }}>{user?.email}</strong> has been registered successfully.
        Please wait for the admin to approve your account before you can access quizzes and study materials.
      </div>

      <div className="glass-card" style={{ maxWidth: 340, width: '100%', textAlign: 'left', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,183,77,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏳</div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>Status: Pending</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Registered on {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</div>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>
          💡 While you wait, you can contact the admin to speed up the process.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
        <button className="btn btn-accent" onClick={() => onRefresh?.()}>🔄 Check Status</button>
        <button className="btn btn-outline" onClick={() => window.location.href = '/contact'}>📩 Contact Admin</button>
        <button className="btn btn-red" onClick={onLogout}>🚪 Logout</button>
      </div>
    </div>
  )
}
