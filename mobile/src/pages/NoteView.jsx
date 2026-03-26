import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function NoteView() {
  const { id } = useParams()
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`/api/notes/${id}`).then(r => r.json()).then(d => setNote(d.note)).catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page flex-center" style={{ minHeight: '100vh' }}><div className="spinner"></div></div>
  if (!note) return <div className="page flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}><p style={{ color: 'var(--text3)' }}>Note not found</p></div>

  return (
    <div className="page">
      <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: 0, fontSize: '1.2rem' }}>{note.title}</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>{note.subject} {note.unit ? `• Unit ${note.unit}` : ''} • {note.views} views</p>
        </div>
      </div>

      <div className="glass-card">
        {note.type === 'pdf' && note.fileUrl ? (
          <div>
            <a href={note.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent mb-4">📄 Open PDF</a>
            <iframe src={note.fileUrl} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 'var(--rs)', background: 'white' }} title={note.title} />
          </div>
        ) : (
          <div className="md-content" dangerouslySetInnerHTML={{ __html: (note.content || note.markdownContent || '').replace(/\n/g, '<br/>') }} />
        )}
      </div>
    </div>
  )
}
