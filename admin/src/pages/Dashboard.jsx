import { useState, useEffect } from 'react'
import { dashboardAPI } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend } from 'recharts'

const COLORS = ['#7C4DFF', '#448AFF', '#00E676', '#FFB74D', '#FF5252', '#18FFFF', '#FF4081', '#B388FF']
const dayNames = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const scoreLabels = { 0: '0-20%', 20: '20-40%', 40: '40-60%', 60: '60-80%', 80: '80-100%' }

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.getAdmin()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center" style={{ padding: 60, color: 'var(--text-muted)' }}>Loading dashboard...</div>
  if (!data) return <div className="text-center" style={{ padding: 60 }}>Failed to load dashboard</div>

  const { stats, charts, recentAttempts, topPerformers } = data

  // Format chart data
  const weeklyData = (charts?.weeklyActivity || []).map(d => ({ name: dayNames[d._id] || d._id, quizzes: d.count, avgScore: Math.round(d.avgScore || 0) }))
  const dailyData = (charts?.dailyActivity || []).map(d => ({ date: d._id?.slice(5), attempts: d.attempts, avg: Math.round(d.avgScore || 0) }))
  const subjectData = (charts?.subjectDistribution || []).map(d => ({ name: d._id, value: d.count }))
  const quizTypeData = (charts?.quizTypeDistribution || []).map(d => ({ name: d._id, value: d.count, avg: Math.round(d.avgScore || 0) }))
  const scoreData = (charts?.scoreDistribution || []).filter(d => d._id !== 'Other').map(d => ({ range: scoreLabels[d._id] || `${d._id}%`, count: d.count }))
  const branchData = (charts?.branchDistribution || []).map(d => ({ name: d._id, value: d.count }))
  const perfData = (charts?.subjectPerformance || []).map(d => ({ subject: d._id?.slice(0, 8), avg: Math.round(d.avgScore || 0), attempts: d.attempts }))

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📊 Admin Dashboard</h2>
        <p>Real-time analytics & insights</p>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {[
          { label: 'Students', value: stats?.totalUsers || 0, icon: '👥', color: '#7C4DFF' },
          { label: 'Pending', value: stats?.pendingUsers || 0, icon: '⏳', color: '#FFB74D' },
          { label: 'Questions', value: stats?.totalQuestions || 0, icon: '❓', color: '#448AFF' },
          { label: 'Quizzes', value: stats?.totalAttempts || 0, icon: '📝', color: '#00E676' },
          { label: 'Flashcards', value: stats?.totalFlashcards || 0, icon: '🃏', color: '#FF4081' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Activity Trend + Score Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h3 className="card-title">📈 Daily Activity (30 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="gAttempts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C4DFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis dataKey="date" stroke="#7070a0" fontSize={11} />
              <YAxis stroke="#7070a0" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1a1a3a', border: '1px solid #2a2a4a', borderRadius: 8, color: '#f0f0ff' }} />
              <Area type="monotone" dataKey="attempts" stroke="#7C4DFF" fill="url(#gAttempts)" strokeWidth={2} name="Quizzes" />
              <Area type="monotone" dataKey="avg" stroke="#00E676" fill="url(#gAvg)" strokeWidth={2} name="Avg Score %" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="card-title">📊 Score Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis dataKey="range" stroke="#7070a0" fontSize={10} />
              <YAxis stroke="#7070a0" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1a1a3a', border: '1px solid #2a2a4a', borderRadius: 8, color: '#f0f0ff' }} />
              <Bar dataKey="count" fill="#7C4DFF" radius={[6, 6, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2: Subject Pie + Branch Pie + Weekly */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h3 className="card-title">📚 Questions by Subject</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={subjectData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                {subjectData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a3a', border: '1px solid #2a2a4a', borderRadius: 8, color: '#f0f0ff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="card-title">🏫 Students by Branch</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={branchData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                {branchData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a3a', border: '1px solid #2a2a4a', borderRadius: 8, color: '#f0f0ff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="card-title">📅 Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis dataKey="name" stroke="#7070a0" fontSize={11} />
              <YAxis stroke="#7070a0" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1a1a3a', border: '1px solid #2a2a4a', borderRadius: 8, color: '#f0f0ff' }} />
              <Bar dataKey="quizzes" fill="#448AFF" radius={[6, 6, 0, 0]} name="Quizzes" />
              <Bar dataKey="avgScore" fill="#FFB74D" radius={[6, 6, 0, 0]} name="Avg Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3: Subject Performance + Quiz Types */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <h3 className="card-title">🎯 Subject Performance (Avg Scores)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={perfData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis type="number" domain={[0, 100]} stroke="#7070a0" fontSize={11} />
              <YAxis dataKey="subject" type="category" stroke="#7070a0" fontSize={11} width={70} />
              <Tooltip contentStyle={{ background: '#1a1a3a', border: '1px solid #2a2a4a', borderRadius: 8, color: '#f0f0ff' }} />
              <Bar dataKey="avg" fill="#00E676" radius={[0, 6, 6, 0]} name="Avg Score %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="card-title">📝 Quiz Type Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={quizTypeData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                {quizTypeData.map((_, i) => <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a3a', border: '1px solid #2a2a4a', borderRadius: 8, color: '#f0f0ff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 className="card-title">🏆 Top Performers</h3>
          {topPerformers?.length > 0 ? topPerformers.map((u, i) => (
            <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '1.2rem' }}>{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.branch} • {u.stats?.totalAttempts} quizzes • 🔥 {u.stats?.streak}</div>
              </div>
              <span style={{ fontFamily: 'Outfit', fontWeight: 800, color: '#00E676' }}>{u.stats?.avgScore}%</span>
            </div>
          )) : <p style={{ color: 'var(--text-muted)' }}>No data yet</p>}
        </div>
        <div className="card">
          <h3 className="card-title">⏱ Recent Activity</h3>
          {recentAttempts?.length > 0 ? recentAttempts.slice(0, 5).map(a => (
            <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.user?.name || 'Student'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.quizType} — {a.subject} • {new Date(a.createdAt).toLocaleString()}</div>
              </div>
              <span style={{ fontFamily: 'Outfit', fontWeight: 700, color: a.percentage >= 70 ? '#00E676' : a.percentage >= 40 ? '#FFB74D' : '#FF5252' }}>{a.percentage}%</span>
            </div>
          )) : <p style={{ color: 'var(--text-muted)' }}>No data yet</p>}
        </div>
      </div>
    </div>
  )
}
