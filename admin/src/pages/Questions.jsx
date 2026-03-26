import { useState, useEffect, useRef } from 'react'
import { questionAPI, subjectAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Questions() {
  const [questions, setQuestions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState({ subjectCode: '', unit: '', difficulty: '' })
  const [tab, setTab] = useState('list')
  const [showModal, setShowModal] = useState(false)
  const [jsonData, setJsonData] = useState('')
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ subject: '', subjectCode: '', unit: 1, unitName: '', questionText: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', difficulty: 'medium' })
  const fileRef = useRef()

  useEffect(() => { subjectAPI.getAll().then(res => setSubjects(res.data.subjects)) }, [])

  const loadQuestions = () => {
    setLoading(true)
    const params = { page, limit: 20, ...filter }
    Object.keys(params).forEach(k => { if (!params[k]) delete params[k] })
    questionAPI.getAll(params).then(res => {
      setQuestions(res.data.questions); setTotal(res.data.total); setLoading(false)
    }).catch(() => setLoading(false))
  }
  useEffect(loadQuestions, [page, filter])

  const handleSingleAdd = async () => {
    if (!form.questionText || !form.subjectCode || form.options.some(o => !o)) return toast.error('Fill all fields')
    try {
      await questionAPI.create(form)
      toast.success('Question added!'); setShowModal(false); loadQuestions()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const handleJsonUpload = async () => {
    try {
      const data = JSON.parse(jsonData)
      if (!data.subject || !data.subjectCode || !data.unit || !data.questions?.length) {
        return toast.error('JSON must have: subject, subjectCode, unit, questions[]')
      }
      setUploading(true)
      const res = await questionAPI.bulkUpload(data)
      toast.success(res.data.message)
      setJsonData(''); setTab('list'); loadQuestions()
    } catch (err) {
      if (err instanceof SyntaxError) toast.error('Invalid JSON format')
      else toast.error(err.response?.data?.error || 'Upload failed')
    } finally { setUploading(false) }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setJsonData(ev.target.result)
    reader.readAsText(file)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return
    try { await questionAPI.delete(id); toast.success('Deleted!'); loadQuestions() }
    catch { toast.error('Failed') }
  }

  const setSubjectFromCode = (code) => {
    const s = subjects.find(s => s.code === code)
    if (s) setForm({ ...form, subjectCode: code, subject: s.name })
  }

  const sampleJson = JSON.stringify({
    subject: "Mathematics", subjectCode: "MATH", unit: 1, unitName: "Matrices & Determinants",
    questions: [
      { text: "If A is a 3×3 matrix with |A| = 5, then |adj(A)| = ?", options: ["5", "25", "125", "1/5"], correct: 1, explanation: "|adj(A)| = |A|^(n-1) = 5² = 25", difficulty: "medium" },
      { text: "Rank of a null matrix is?", options: ["0", "1", "∞", "Not defined"], correct: 0, explanation: "Rank of a null matrix is always 0", difficulty: "easy" }
    ]
  }, null, 2)

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div><h2>❓ Questions</h2><p>{total} total questions in database</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Question</button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>📋 Question Bank</button>
        <button className={`tab ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')}>📤 JSON Upload</button>
      </div>

      {tab === 'upload' && (
        <div className="card fade-in">
          <h3 style={{ marginBottom: 16 }}>📤 Bulk Upload Questions via JSON</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.85rem' }}>
            Upload questions in bulk using JSON format. Each file should contain questions for one subject and unit.
          </p>
          <div className="upload-area mb-4" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileSelect} />
            <div className="upload-icon">📁</div>
            <p><strong>Click to select JSON file</strong></p>
            <p style={{ fontSize: '0.8rem' }}>or paste JSON below</p>
          </div>
          <div className="form-group">
            <label className="form-label">JSON Data</label>
            <textarea className="form-textarea" rows={12} value={jsonData} onChange={e => setJsonData(e.target.value)}
              placeholder="Paste your JSON here..." style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
          </div>
          <div className="flex gap-3 mb-6">
            <button className="btn btn-primary" onClick={handleJsonUpload} disabled={uploading || !jsonData}>
              {uploading ? '⏳ Uploading...' : '🚀 Upload Questions'}
            </button>
            <button className="btn btn-ghost" onClick={() => setJsonData(sampleJson)}>📋 Show Sample</button>
          </div>

          <div className="card" style={{ background: 'var(--bg-secondary)' }}>
            <h4 style={{ marginBottom: 8 }}>📖 JSON Format Reference</h4>
            <pre style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'auto', maxHeight: 300 }}>
{sampleJson}
            </pre>
          </div>
        </div>
      )}

      {tab === 'list' && (
        <>
          <div className="card mb-6">
            <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
              <select className="form-select" style={{ width: 200 }} value={filter.subjectCode} onChange={e => setFilter({ ...filter, subjectCode: e.target.value })}>
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.code} value={s.code}>{s.icon} {s.name}</option>)}
              </select>
              <select className="form-select" style={{ width: 150 }} value={filter.unit} onChange={e => setFilter({ ...filter, unit: e.target.value })}>
                <option value="">All Units</option>
                {[1,2,3,4,5,6,7,8].map(u => <option key={u} value={u}>Unit {u}</option>)}
              </select>
              <select className="form-select" style={{ width: 150 }} value={filter.difficulty} onChange={e => setFilter({ ...filter, difficulty: e.target.value })}>
                <option value="">All Difficulty</option>
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {loading ? <div className="skeleton" style={{ height: 400 }} /> : questions.length === 0 ? (
            <div className="empty-state"><div className="icon">❓</div><h3>No questions found</h3><p>Upload questions using JSON or add manually</p></div>
          ) : (
            <div>
              {questions.map((q, i) => (
                <div key={q._id} className="card mb-4" style={{ borderLeft: `3px solid ${q.difficulty === 'hard' ? '#ef4444' : q.difficulty === 'easy' ? '#10b981' : '#6C63FF'}` }}>
                  <div className="flex-between mb-4">
                    <div className="flex gap-2">
                      <span className="badge badge-primary">{q.subjectCode}</span>
                      <span className="badge badge-info">Unit {q.unit}</span>
                      <span className={`badge badge-${q.difficulty === 'hard' ? 'danger' : q.difficulty === 'easy' ? 'success' : 'warning'}`}>{q.difficulty}</span>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q._id)}>🗑️</button>
                  </div>
                  <p style={{ fontWeight: 600, marginBottom: 12 }}>{q.questionText}</p>
                  <div className="grid grid-2" style={{ gap: 8, marginBottom: 12 }}>
                    {q.options.map((opt, j) => (
                      <div key={j} style={{ padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem',
                        background: j === q.correctAnswer ? 'rgba(16,185,129,0.15)' : 'var(--bg-secondary)',
                        border: j === q.correctAnswer ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)' }}>
                        <span style={{ marginRight: 8, fontWeight: 600 }}>{String.fromCharCode(65 + j)}.</span>{opt}
                        {j === q.correctAnswer && <span style={{ marginLeft: 8 }}>✅</span>}
                      </div>
                    ))}
                  </div>
                  {q.explanation && <div style={{ padding: 12, borderRadius: 8, background: 'rgba(108,99,255,0.08)', fontSize: '0.85rem' }}>
                    <strong>💡 Explanation:</strong> {q.explanation}
                  </div>}
                </div>
              ))}
              <div className="flex-center gap-3" style={{ marginTop: 24 }}>
                <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
                <span style={{ color: 'var(--text-muted)' }}>Page {page}</span>
                <button className="btn btn-ghost btn-sm" disabled={questions.length < 20} onClick={() => setPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>➕ Add Question</h3>
            <div className="grid grid-2">
              <div className="form-group"><label className="form-label">Subject</label>
                <select className="form-select" value={form.subjectCode} onChange={e => setSubjectFromCode(e.target.value)}>
                  <option value="">Select...</option>
                  {subjects.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Unit</label>
                <input type="number" className="form-input" min={1} max={8} value={form.unit} onChange={e => setForm({ ...form, unit: parseInt(e.target.value) })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Question Text</label>
              <textarea className="form-textarea" value={form.questionText} onChange={e => setForm({ ...form, questionText: e.target.value })} /></div>
            {form.options.map((opt, i) => (
              <div className="form-group" key={i}><label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Option {String.fromCharCode(65 + i)} {i === form.correctAnswer && <span className="badge badge-success">Correct</span>}
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', padding: '2px 8px' }} onClick={() => setForm({ ...form, correctAnswer: i })}>Set Correct</button>
              </label>
                <input className="form-input" value={opt} onChange={e => { const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts }) }} /></div>
            ))}
            <div className="form-group"><label className="form-label">Explanation</label>
              <textarea className="form-textarea" value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Difficulty</label>
              <select className="form-select" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
              </select></div>
            <div className="flex gap-3">
              <button className="btn btn-primary" onClick={handleSingleAdd}>✅ Add Question</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
