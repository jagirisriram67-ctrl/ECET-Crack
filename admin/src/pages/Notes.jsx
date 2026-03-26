import { useState, useEffect, useRef } from 'react'
import { noteAPI, subjectAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Notes() {
  const [notes, setNotes] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState('pdf')
  const [form, setForm] = useState({ title: '', subject: '', subjectCode: '', unit: 0, unitName: '', type: 'pdf', content: '', description: '', color: '#6C63FF', icon: '📄' })
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  useEffect(() => { subjectAPI.getAll().then(res => setSubjects(res.data.subjects)) }, [])

  const loadNotes = () => {
    noteAPI.getAll().then(res => { setNotes(res.data.notes); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(loadNotes, [])

  const handleSave = async () => {
    if (!form.title || !form.subjectCode) return toast.error('Title and subject required')
    try {
      const fd = new FormData()
      Object.keys(form).forEach(k => fd.append(k, form[k]))
      if (file) fd.append('file', file)
      await noteAPI.create(fd)
      toast.success('Note uploaded!')
      setShowModal(false); setFile(null)
      setForm({ title: '', subject: '', subjectCode: '', unit: 0, unitName: '', type: 'pdf', content: '', description: '', color: '#6C63FF', icon: '📄' })
      loadNotes()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return
    try { await noteAPI.delete(id); toast.success('Deleted!'); loadNotes() }
    catch { toast.error('Failed') }
  }

  const setSubjectFromCode = (code) => {
    const s = subjects.find(s => s.code === code)
    if (s) setForm({ ...form, subjectCode: code, subject: s.name })
  }

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div><h2>📝 Study Notes</h2><p>Upload and manage study materials for students</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Upload Note</button>
      </div>

      {loading ? <div className="skeleton" style={{ height: 300 }} /> : notes.length === 0 ? (
        <div className="empty-state"><div className="icon">📝</div><h3>No notes yet</h3><p>Upload PDFs or create Markdown notes</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {notes.map(n => (
            <div key={n._id} className="card">
              <div className="flex gap-3 mb-4" style={{ alignItems: 'center' }}>
                <span style={{ fontSize: '2.5rem' }}>{n.type === 'pdf' ? '📕' : '📗'}</span>
                <div>
                  <h4 style={{ fontWeight: 700 }}>{n.title}</h4>
                  <div className="flex gap-2">
                    <span className="badge badge-primary">{n.subjectCode || n.subject}</span>
                    {n.unit > 0 && <span className="badge badge-info">Unit {n.unit}</span>}
                    <span className="badge badge-success">{n.type.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              {n.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{n.description}</p>}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                👁️ {n.views} views • 📥 {n.downloads} downloads • {new Date(n.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                {n.fileUrl && <a href={n.fileUrl} target="_blank" className="btn btn-ghost btn-sm" rel="noreferrer">📥 Download</a>}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n._id)}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>➕ Upload Study Note</h3>
            <div className="tabs mb-4">
              <button className={`tab ${tab === 'pdf' ? 'active' : ''}`} onClick={() => { setTab('pdf'); setForm({ ...form, type: 'pdf' }) }}>📕 PDF Upload</button>
              <button className={`tab ${tab === 'markdown' ? 'active' : ''}`} onClick={() => { setTab('markdown'); setForm({ ...form, type: 'markdown' }) }}>📗 Markdown Note</button>
            </div>
            <div className="form-group"><label className="form-label">Title</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Matrices Complete Notes" /></div>
            <div className="grid grid-2">
              <div className="form-group"><label className="form-label">Subject</label>
                <select className="form-select" value={form.subjectCode} onChange={e => setSubjectFromCode(e.target.value)}>
                  <option value="">Select...</option>
                  {subjects.map(s => <option key={s.code} value={s.code}>{s.icon} {s.name}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Unit</label>
                <input type="number" className="form-input" min={0} max={8} value={form.unit} onChange={e => setForm({ ...form, unit: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" /></div>
            
            {tab === 'pdf' ? (
              <div className="upload-area mb-4" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
                <div className="upload-icon">{file ? '✅' : '📁'}</div>
                <p><strong>{file ? file.name : 'Click to select PDF file'}</strong></p>
                {file && <p style={{ fontSize: '0.8rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
              </div>
            ) : (
              <div className="form-group"><label className="form-label">Markdown Content</label>
                <textarea className="form-textarea" rows={10} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="# Chapter Title&#10;&#10;## Key Concepts&#10;&#10;- Point 1&#10;- Point 2&#10;&#10;**Important**: Remember this formula..."
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} /></div>
            )}

            <div className="flex gap-3">
              <button className="btn btn-primary" onClick={handleSave}>🚀 Upload Note</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
