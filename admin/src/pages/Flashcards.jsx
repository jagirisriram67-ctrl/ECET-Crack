import { useState, useEffect } from 'react'
import { flashcardAPI } from '../services/api'

export default function Flashcards() {
  const [flashcards, setFlashcards] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('list')
  const [filter, setFilter] = useState('')

  // Form state
  const [form, setForm] = useState({ topic: '', subject: '', subjectCode: '', day: '', frontText: '', backText: '', explanation: '', difficulty: 'medium', tags: '' })
  const [frontImg, setFrontImg] = useState(null)
  const [backImg, setBackImg] = useState(null)
  const [saving, setSaving] = useState(false)

  // Bulk upload state
  const [bulkJson, setBulkJson] = useState('')
  const [bulkSubject, setBulkSubject] = useState('')
  const [bulkTopic, setBulkTopic] = useState('')
  const [bulkDay, setBulkDay] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter) params.subject = filter
      const res = await flashcardAPI.getAll(params)
      setFlashcards(res.data.flashcards)
      setTotal(res.data.total)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (frontImg) fd.append('frontImage', frontImg)
      if (backImg) fd.append('backImage', backImg)
      await flashcardAPI.create(fd)
      setForm({ topic: '', subject: '', subjectCode: '', day: '', frontText: '', backText: '', explanation: '', difficulty: 'medium', tags: '' })
      setFrontImg(null); setBackImg(null)
      load(); setTab('list')
      alert('Flashcard created!')
    } catch (err) { alert(err.response?.data?.error || err.message) }
    setSaving(false)
  }

  const handleBulk = async () => {
    if (!bulkSubject || !bulkTopic || !bulkJson) return alert('Fill all fields')
    setSaving(true)
    try {
      const parsed = JSON.parse(bulkJson)
      const res = await flashcardAPI.bulkUpload({ subject: bulkSubject, subjectCode: '', topic: bulkTopic, day: bulkDay ? parseInt(bulkDay) : 0, flashcards: parsed })
      alert(res.data.message)
      setBulkJson(''); setBulkTopic(''); setBulkDay('')
      load(); setTab('list')
    } catch (err) { alert(err.message || 'Invalid JSON') }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this flashcard?')) { await flashcardAPI.delete(id); load() }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>🃏 Flashcards & Daily Topics</h2>
        <p>Create learning cards for students — {total} total</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'list', label: '📋 All Flashcards' },
          { key: 'create', label: '➕ Create Single' },
          { key: 'bulk', label: '📦 Bulk Upload' },
        ].map(t => (
          <button key={t.key} className={`btn ${tab === t.key ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* List View */}
      {tab === 'list' && (
        <>
          <div className="flex gap-2 mb-4">
            <input className="form-input" placeholder="🔍 Filter by subject..." value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 300 }} />
          </div>
          {loading ? <div className="text-center" style={{ padding: 40, color: 'var(--text-muted)' }}>Loading...</div> : flashcards.length === 0 ? (
            <div className="empty-state"><div className="icon">🃏</div><h3>No flashcards yet</h3><p>Create your first flashcard!</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {flashcards.map(f => (
                <div key={f._id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <div className="flex-between mb-4">
                    <span className="badge badge-primary">📁 {f.topic}</span>
                    <span className="badge badge-info">{f.subject}</span>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>FRONT</div>
                    <p style={{ fontWeight: 600 }}>{f.frontText}</p>
                    {f.frontImage && <img src={f.frontImage} alt="" style={{ maxHeight: 120, borderRadius: 6, marginTop: 6 }} />}
                  </div>
                  <div style={{ background: 'rgba(0,230,118,0.05)', padding: 12, borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>BACK</div>
                    <p>{f.backText}</p>
                    {f.backImage && <img src={f.backImage} alt="" style={{ maxHeight: 120, borderRadius: 6, marginTop: 6 }} />}
                  </div>
                  {f.explanation && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>💡 {f.explanation}</div>}
                  <div className="flex-between">
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Day {f.day} • {f.difficulty} • {f.views} views</span>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f._id)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Single */}
      {tab === 'create' && (
        <form onSubmit={handleCreate} className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: 16 }}>➕ Create Flashcard</h3>
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input className="form-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics" required />
          </div>
          <div className="form-group">
            <label className="form-label">Topic *</label>
            <input className="form-input" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="Matrices" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Day #</label>
              <input className="form-input" type="number" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} placeholder="1" />
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select className="form-select" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Front (Question / Topic Title) *</label>
            <textarea className="form-textarea" value={form.frontText} onChange={e => setForm({ ...form, frontText: e.target.value })} placeholder="What is the rank of a matrix?" required rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Front Image (optional)</label>
            <input type="file" accept="image/*" onChange={e => setFrontImg(e.target.files[0])} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Back (Answer / Explanation) *</label>
            <textarea className="form-textarea" value={form.backText} onChange={e => setForm({ ...form, backText: e.target.value })} placeholder="The rank of a matrix is the maximum number of linearly independent rows/columns." required rows={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Back Image (optional)</label>
            <input type="file" accept="image/*" onChange={e => setBackImg(e.target.files[0])} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Extra Explanation</label>
            <textarea className="form-textarea" value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} placeholder="Additional details..." rows={2} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? '⏳ Saving...' : '✅ Create Flashcard'}</button>
        </form>
      )}

      {/* Bulk Upload */}
      {tab === 'bulk' && (
        <div className="card" style={{ maxWidth: 700 }}>
          <h3 style={{ marginBottom: 16 }}>📦 Bulk Upload Flashcards</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input className="form-input" value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} placeholder="Mathematics" />
            </div>
            <div className="form-group">
              <label className="form-label">Topic *</label>
              <input className="form-input" value={bulkTopic} onChange={e => setBulkTopic(e.target.value)} placeholder="Matrices" />
            </div>
            <div className="form-group">
              <label className="form-label">Day #</label>
              <input className="form-input" type="number" value={bulkDay} onChange={e => setBulkDay(e.target.value)} placeholder="1" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">JSON Array of Flashcards *</label>
            <textarea className="form-textarea" value={bulkJson} onChange={e => setBulkJson(e.target.value)} rows={12} placeholder={`[
  {
    "front": "What is a matrix?",
    "back": "A 2D array of numbers arranged in rows and columns",
    "explanation": "Matrices are used in linear algebra..."
  },
  {
    "front": "What is determinant?",
    "back": "A scalar value from a square matrix",
    "explanation": "det(A) = ad - bc for 2×2 matrix"
  }
]`} />
          </div>
          <button className="btn btn-primary" onClick={handleBulk} disabled={saving}>{saving ? '⏳ Uploading...' : '📤 Upload Flashcards'}</button>
        </div>
      )}
    </div>
  )
}
