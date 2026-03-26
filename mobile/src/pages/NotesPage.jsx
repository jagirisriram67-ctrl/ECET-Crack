import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function NotesPage({ user }) {
  const [notes, setNotes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(d.subjects || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = filter ? `?subject=${encodeURIComponent(filter)}` : ''
    fetch(`/api/notes${params}`).then(r => r.json()).then(d => setNotes(d.notes || [])).catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="page">
      <h1 className="page-title">📚 Study Notes</h1>
      <p className="page-sub">Learn from curated study materials</p>

      {/* Subject Filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
        <button className={`btn btn-sm ${!filter ? 'btn-accent' : 'btn-outline'}`} onClick={() => setFilter('')} style={{ flexShrink: 0 }}>All</button>
        {subjects.map(s => (
          <button key={s._id} className={`btn btn-sm ${filter === s.name ? 'btn-accent' : 'btn-outline'}`} onClick={() => setFilter(s.name)} style={{ flexShrink: 0 }}>
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {/* Notes */}
      {loading ? <div className="loading"><div className="spinner"></div></div> : notes.length === 0 ? (
        <div className="empty"><div className="e-icon">📚</div><h3>No notes yet</h3><p>Admin will upload study materials soon!</p></div>
      ) : (
        notes.map(n => (
          <Link to={`/notes/${n._id}`} key={n._id} className="note-card">
            <div className="note-icon" style={{ background: n.type === 'pdf' ? 'rgba(255,82,82,0.12)' : 'rgba(124,77,255,0.12)' }}>
              {n.type === 'pdf' ? '📄' : '📝'}
            </div>
            <div className="note-info">
              <h4>{n.title}</h4>
              <p>{n.subject} {n.unit ? `• Unit ${n.unit}` : ''} • {n.views || 0} views</p>
            </div>
          </Link>
        ))
      )}
    </div>
  )
}
