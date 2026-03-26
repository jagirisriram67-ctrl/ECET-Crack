import { useState, useEffect } from 'react'
import { paperAPI } from '../services/api'

export default function Papers() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('list')
  const [form, setForm] = useState({ title: '', year: '', subject: 'General', description: '', type: 'pdf' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    paperAPI.getAll().then(r => setPapers(r.data.papers || []))
      .catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!form.title || !form.year) return alert('Title and year required')
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (file) fd.append('file', file)
      await paperAPI.create(fd)
      setForm({ title: '', year: '', subject: 'General', description: '', type: 'pdf' })
      setFile(null); load(); setTab('list')
      alert('Paper uploaded!')
    } catch (err) { alert(err.response?.data?.error || err.message) }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this paper?')) { await paperAPI.delete(id); load() }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📜 Previous Year Papers</h2>
        <p>Upload ECET past year question papers — {papers.length} total</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button className={`btn ${tab === 'list' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab('list')}>📋 All Papers</button>
        <button className={`btn ${tab === 'upload' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab('upload')}>📤 Upload Paper</button>
      </div>

      {tab === 'list' && (
        loading ? <div className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>Loading...</div> :
        papers.length === 0 ? (
          <div className="empty-state"><div className="icon">📜</div><h3>No papers yet</h3><p>Upload your first paper!</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Title</th><th>Year</th><th>Subject</th><th>Downloads</th><th>Actions</th></tr></thead>
            <tbody>
              {papers.map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 600 }}>{p.title}</td>
                  <td><span className="badge badge-primary">{p.year}</span></td>
                  <td>{p.subject}</td>
                  <td>{p.downloads}</td>
                  <td>
                    {p.fileUrl && <a href={p.fileUrl} target="_blank" className="btn btn-ghost btn-sm" style={{ marginRight: 4 }}>📥</a>}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === 'upload' && (
        <form onSubmit={handleUpload} className="card" style={{ maxWidth: 500 }}>
          <h3 style={{ marginBottom: 16 }}>📤 Upload Paper</h3>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="ECET 2024 Question Paper" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Year *</label>
              <input className="form-input" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="2024" required />
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="form-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="General" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." rows={2} />
          </div>
          <div className="form-group">
            <label className="form-label">PDF File</label>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? '⏳ Uploading...' : '📤 Upload Paper'}</button>
        </form>
      )}
    </div>
  )
}
