import { useState, useEffect } from 'react'
import { subjectAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function Subjects() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', branch: 'COMMON', description: '', icon: '📚', color: '#6C63FF', isCommon: false, units: [] })

  const loadSubjects = () => {
    subjectAPI.getAll().then(res => { setSubjects(res.data.subjects); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(loadSubjects, [])

  const handleSeed = async () => {
    try {
      const res = await subjectAPI.seed()
      toast.success(res.data.message)
      loadSubjects()
    } catch (err) { toast.error('Failed to seed subjects') }
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await subjectAPI.update(editing, form)
        toast.success('Subject updated!')
      } else {
        await subjectAPI.create(form)
        toast.success('Subject created!')
      }
      setShowModal(false); setEditing(null)
      setForm({ name: '', code: '', branch: 'COMMON', description: '', icon: '📚', color: '#6C63FF', isCommon: false, units: [] })
      loadSubjects()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return
    try { await subjectAPI.delete(id); toast.success('Deleted!'); loadSubjects() }
    catch { toast.error('Failed to delete') }
  }

  const openEdit = (s) => {
    setEditing(s._id)
    setForm({ name: s.name, code: s.code, branch: s.branch, description: s.description, icon: s.icon, color: s.color, isCommon: s.isCommon, units: s.units })
    setShowModal(true)
  }

  const addUnit = () => setForm({ ...form, units: [...form.units, { unitNumber: form.units.length + 1, name: '', topics: [] }] })
  const removeUnit = (i) => setForm({ ...form, units: form.units.filter((_, idx) => idx !== i) })
  const updateUnit = (i, key, value) => {
    const units = [...form.units]; units[i] = { ...units[i], [key]: value }; setForm({ ...form, units })
  }

  return (
    <div className="fade-in">
      <div className="page-header flex-between">
        <div><h2>📚 Subjects</h2><p>Manage ECET subjects and units</p></div>
        <div className="flex gap-3">
          <button className="btn btn-ghost" onClick={handleSeed}>🌱 Seed Defaults</button>
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', code: '', branch: 'COMMON', description: '', icon: '📚', color: '#6C63FF', isCommon: false, units: [] }); setShowModal(true) }}>
            ➕ Add Subject
          </button>
        </div>
      </div>

      {loading ? <div className="skeleton" style={{ height: 300 }} /> : subjects.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📚</div><h3>No subjects yet</h3><p>Click "Seed Defaults" to add all ECET subjects</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {subjects.map(s => (
            <div key={s._id} className="card" style={{ borderLeft: `4px solid ${s.color}` }}>
              <div className="flex-between mb-4">
                <div className="flex gap-3" style={{ alignItems: 'center' }}>
                  <span style={{ fontSize: '2rem' }}>{s.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{s.name}</h3>
                    <span className="badge badge-primary">{s.code}</span>
                    {s.isCommon && <span className="badge badge-success" style={{ marginLeft: 6 }}>Common</span>}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{s.description}</p>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                {s.units?.length || 0} Units • {s.totalQuestions || 0} Questions • Branch: {s.branch}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                {s.units?.map(u => (
                  <span key={u.unitNumber} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                    U{u.unitNumber}: {u.name}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? '✏️ Edit Subject' : '➕ New Subject'}</h3>
            <div className="grid grid-2">
              <div className="form-group"><label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Code</label>
                <input className="form-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
            </div>
            <div className="grid grid-2">
              <div className="form-group"><label className="form-label">Branch</label>
                <select className="form-select" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })}>
                  {['COMMON','CSE','ECE','EEE','MECH','CIVIL','CHEM','MME','BSC_MATHS'].map(b => <option key={b} value={b}>{b}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Icon (emoji)</label>
                <input className="form-input" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="form-group"><label className="form-label" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={form.isCommon} onChange={e => setForm({ ...form, isCommon: e.target.checked })} /> Common subject (all branches)</label></div>
            
            <div className="flex-between mb-4">
              <label className="form-label" style={{ margin: 0 }}>Units</label>
              <button className="btn btn-ghost btn-sm" onClick={addUnit}>➕ Add Unit</button>
            </div>
            {form.units.map((u, i) => (
              <div key={i} className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
                <span style={{ minWidth: 30, color: 'var(--text-muted)' }}>U{u.unitNumber}</span>
                <input className="form-input" placeholder="Unit name" style={{ flex: 1 }} value={u.name}
                  onChange={e => updateUnit(i, 'name', e.target.value)} />
                <button className="btn btn-danger btn-sm" onClick={() => removeUnit(i)}>✕</button>
              </div>
            ))}
            <div className="flex gap-3" style={{ marginTop: 20 }}>
              <button className="btn btn-primary" onClick={handleSave}>{editing ? '💾 Update' : '✅ Create'}</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
