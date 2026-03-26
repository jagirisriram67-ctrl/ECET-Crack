import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function PreviousPapers() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const params = yearFilter ? `?year=${yearFilter}` : ''
    fetch(`/api/papers${params}`).then(r => r.json())
      .then(d => setPapers(d.papers || []))
      .catch(() => {}).finally(() => setLoading(false))
  }, [yearFilter])

  const years = [...new Set(papers.map(p => p.year))].sort((a, b) => b - a)

  return (
    <div className="page">
      <div className="flex gap-2 mb-4" style={{ alignItems: 'center' }}>
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>📜 Previous Year Papers</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>{papers.length} papers available</p>
        </div>
      </div>

      {/* Year filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button className={`chip ${!yearFilter ? 'active' : ''}`} onClick={() => setYearFilter('')}>All Years</button>
        {years.map(y => (
          <button key={y} className={`chip ${yearFilter === String(y) ? 'active' : ''}`} onClick={() => setYearFilter(String(y))}>{y}</button>
        ))}
      </div>

      {loading ? <div className="loading"><div className="spinner"></div></div> : papers.length === 0 ? (
        <div className="empty">
          <div className="e-icon">📜</div>
          <h3>No papers yet</h3>
          <p>Admin will upload past ECET papers soon!</p>
        </div>
      ) : (
        papers.map(p => (
          <div key={p._id} className="glass-card mb-4" onClick={() => p.fileUrl && window.open(p.fileUrl, '_blank')}>
            <div className="flex gap-3" style={{ alignItems: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(124,77,255,0.15) 0%, rgba(68,138,255,0.1) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0
              }}>📄</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>{p.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>
                  {p.year} • {p.subject} • {p.downloads} downloads
                </div>
                {p.description && <div style={{ fontSize: '0.7rem', color: 'var(--text2)', marginTop: 4 }}>{p.description}</div>}
              </div>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>📥</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
