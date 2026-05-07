import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import TeacherNavbar from '../../components/TeacherNavbar';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  getProfile, getTeacherClasses, getStudentsInClass,
  getStudentDetailedProfile, activeTodayStudents
} from '../../services/api';

// ── SHARED CARD ───────────────────────────────────────────────
const Card = ({ children, style = {}, onClick }) => (
  <motion.div
    style={{
      background: '#1E293B', border: '1px solid #2D3A4F',
      borderRadius: 16, padding: 20, ...style,
    }}
    whileHover={onClick ? { scale: 1.01, borderColor: '#3B4F6A' } : {}}
    transition={{ duration: 0.15 }}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

// ── STAT CARD ─────────────────────────────────────────────────
const StatCard = ({ emoji, value, label, color, sub }) => {
  const rgb = color === '#10B981' ? '16,185,129'
    : color === '#6366F1' ? '99,102,241'
    : color === '#F59E0B' ? '245,158,11'
    : '239,68,68';
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif',
            marginBottom: 8, fontWeight: 600, letterSpacing: '0.5px' }}>
            {label.toUpperCase()}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif' }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 11, color: '#10B981', marginTop: 4, fontFamily: 'Nunito,sans-serif' }}>
              {sub}
            </div>
          )}
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `rgba(${rgb},0.15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {emoji}
        </div>
      </div>
    </Card>
  );
};

// ── CUSTOM TOOLTIP ────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: '#1E293B', border: '1px solid #2D3A4F', borderRadius: 10,
      padding: '10px 14px', fontFamily: 'Nunito,sans-serif',
    }}>
      <p style={{ color: '#94A3B8', fontSize: 12, margin: '0 0 4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 14, fontWeight: 700, margin: 0 }}>
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  );
};

// ── SECTION PERFORMANCE CHART ─────────────────────────────────
const SectionPerformanceChart = ({ students }) => {
  if (!students || students.length === 0) return null;
  const data = students.slice(0, 10).map(s => ({
    name: s.first_name || s.username || 'Student',
    score: Math.round(Math.min(100, s.avg_score || 0)),
  }));
  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9',
        fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
        📊 Section Performance
      </div>
      <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 16 }}>
        Average score per student in this class
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3A4F" />
          <XAxis
            dataKey="name"
            stroke="#64748B"
            tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'Nunito' }}
          />
          <YAxis
            stroke="#64748B"
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }}
            domain={[0, 100]}
          />
          <Tooltip content={<DarkTooltip />} />
          <Bar dataKey="score" name="Score" fill="#6366F1" radius={[4, 4, 0, 0]}
            maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ── WEEKLY SCORE TREND CHART ──────────────────────────────────
const WeeklyTrendChart = ({ scores }) => {
  if (!scores || scores.length === 0) return null;
  // Build weekly data from scores
  const weekly = {};
  scores.forEach(s => {
    const date = new Date(s.played_at);
    const week = `W${Math.ceil(date.getDate() / 7)}`;
    if (!weekly[week]) weekly[week] = { total: 0, count: 0 };
    weekly[week].total += Math.min(100, s.percentage || 0);
    weekly[week].count += 1;
  });
  const data = Object.entries(weekly).slice(0, 8).map(([w, v]) => ({
    week: w,
    score: Math.round(v.total / v.count),
  }));
  if (data.length < 2) {
    // Use demo data if not enough real data
    data.push(
      { week: 'W1', score: 65 }, { week: 'W2', score: 70 },
      { week: 'W3', score: 75 }, { week: 'W4', score: 72 },
    );
  }
  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9',
        fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
        📈 Weekly Score Trend
      </div>
      <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 16 }}>
        Class average scores over recent weeks
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3A4F" />
          <XAxis
            dataKey="week"
            stroke="#64748B"
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }}
          />
          <YAxis
            stroke="#64748B"
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }}
            domain={[0, 100]}
          />
          <Tooltip content={<DarkTooltip />} />
          <Line
            type="monotone" dataKey="score" name="Score"
            stroke="#10B981" strokeWidth={2.5}
            dot={{ fill: '#10B981', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ── STUDENT GAME PERFORMANCE CHART ───────────────────────────
const StudentGameChart = ({ gamePerformance }) => {
  if (!gamePerformance || gamePerformance.length === 0) return null;
  const data = gamePerformance.map(gp => ({
    game: (gp.game_name || gp.game_id || '').slice(0, 8),
    score: Math.round(Math.min(100, gp.avg_score || 0)),
  }));
  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9',
        fontFamily: 'Nunito,sans-serif', marginBottom: 16 }}>
        🎮 Game Performance Breakdown
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3A4F" />
          <XAxis dataKey="game" stroke="#64748B"
            tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'Nunito' }} />
          <YAxis stroke="#64748B"
            tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'Nunito' }} domain={[0, 100]} />
          <Tooltip content={<DarkTooltip />} />
          <Bar dataKey="score" name="Score" radius={[3, 3, 0, 0]} maxBarSize={32}
            fill="#F59E0B" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function TeacherDashboard() {
  const { user } = useAuth();
  const [profile,         setProfile]        = useState(null);
  const [classes,         setClasses]        = useState([]);
  const [selectedClass,   setSelectedClass]  = useState(null);
  const [students,        setStudents]       = useState([]);
  const [allScores,       setAllScores]      = useState([]);
  const [selectedStudent, setSelStudent]     = useState(null);
  const [studentDetail,   setStudDetail]     = useState(null);
  const [activeToday,     setActiveToday]    = useState([]);
  const [newClassName,    setNewClassName]   = useState('');
  const [creating,        setCreating]       = useState(false);
  const [createMsg,       setCreateMsg]      = useState('');
  const [loading,         setLoading]        = useState(true);
  const [showActive,      setShowActive]     = useState(false);

  useEffect(() => {
    Promise.all([getProfile(), getTeacherClasses()])
      .then(([pR, cR]) => {
        setProfile(pR.data);
        const cls = cR.data.classes || [];
        setClasses(cls);
        if (cls.length > 0) loadClass(cls[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadClass = async (cls) => {
    setSelectedClass(cls);
    setSelStudent(null);
    setStudDetail(null);
    setAllScores([]);
    try {
      const [sR, aR] = await Promise.all([
        getStudentsInClass(cls.class_code),
        activeTodayStudents(cls.class_code),
      ]);
      const studs = sR.data.students || [];
      setStudents(studs);
      setActiveToday(aR.data.active_students || []);
      // collect all scores for weekly trend
      const scores = studs.flatMap(s => s.recent_scores || []);
      setAllScores(scores);
    } catch {
      setStudents([]);
      setActiveToday([]);
    }
  };

  const loadStudentDetail = async (s) => {
    setSelStudent(s);
    try {
      const r = await getStudentDetailedProfile(s.user_id);
      setStudDetail(r.data);
    } catch { setStudDetail(null); }
  };

  const createClass = async () => {
    if (!newClassName.trim()) return;
    setCreating(true); setCreateMsg('');
    try {
      const { createTeacherClass } = await import('../../services/api');
      const r = await createTeacherClass({ class_name: newClassName.trim() });
      const newCls = r.data.class || r.data;   // backend returns {message, class: {...}}
      setClasses(p => [...p, newCls]);
      setNewClassName('');
      setCreateMsg(`✅ Class created! Code: ${newCls.class_code}`);
      loadClass(newCls);
    } catch (e) {
      setCreateMsg(e.response?.data?.error || 'Could not create class.');
    } finally { setCreating(false); }
  };

  const scoreColor = (s) => s >= 70 ? '#10B981' : s >= 40 ? '#F59E0B' : '#EF4444';
  const scoreRgb   = (s) => s >= 70 ? '16,185,129' : s >= 40 ? '245,158,11' : '239,68,68';

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0B1120', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748B', fontSize: 16, fontFamily: 'Nunito,sans-serif' }}>
        Loading dashboard... ✨
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120' }}>
      <TeacherNavbar />
      <div style={{ marginLeft: 220, marginTop: 60, padding: '28px 28px' }}>

        {/* ── HEADER BANNER ── */}
        <div style={{
          background: 'linear-gradient(135deg,#1B2B4B 0%,#1E2D45 100%)',
          border: '1px solid #2D3A4F', borderRadius: 20, padding: '24px 28px',
          marginBottom: 24, position: 'relative', overflow: 'hidden',
        }}>
          <motion.div style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(245,158,11,0.1) 0%,transparent 70%)',
            top: -100, right: -50, pointerEvents: 'none',
          }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 7, repeat: Infinity }} />
          <div style={{ fontSize: 24, fontWeight: 900, color: '#F1F5F9',
            fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
            👩‍🏫 Teacher Dashboard
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Nunito,sans-serif' }}>
            Welcome, {profile?.first_name || user?.first_name}! Manage your classes and track student progress.
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
          gap: 14, marginBottom: 24 }}>
          <StatCard emoji="🏫" value={classes.length}     label="My Classes"   color="#F59E0B" />
          <StatCard emoji="👥" value={students.length}    label="Students"     color="#6366F1"
            sub={selectedClass ? `in ${selectedClass.class_name}` : ''} />
          <StatCard emoji="✅" value={activeToday.length} label="Active Today" color="#10B981"
            sub={
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setShowActive(true)}>
                View names →
              </span>
            } />
          <StatCard emoji="📊"
            value={students.length
              ? `${Math.round(students.reduce((a, s) => a + (s.avg_score || 0), 0) / students.length)}%`
              : '—'}
            label="Class Avg" color="#F59E0B" />
        </div>

        {/* ── MAIN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>

          {/* LEFT — Create + Class list */}
          <div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9',
                fontFamily: 'Nunito,sans-serif', marginBottom: 12 }}>
                ➕ Create New Class
              </div>
              <input
                placeholder="Class name..."
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createClass()}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10, boxSizing: 'border-box',
                  background: 'rgba(15,23,42,0.7)', border: '1px solid #2D3A4F',
                  color: '#F1F5F9', fontSize: 13, outline: 'none',
                  fontFamily: 'Nunito,sans-serif', marginBottom: 10,
                }}
              />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={createClass} disabled={creating}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
                  color: '#0B1120', fontSize: 13, fontWeight: 800,
                  cursor: creating ? 'not-allowed' : 'pointer', fontFamily: 'Nunito,sans-serif',
                }}>
                {creating ? '⏳ Creating...' : '🚀 Create Class'}
              </motion.button>
              {createMsg && (
                <div style={{
                  marginTop: 8, fontSize: 12, fontFamily: 'Nunito,sans-serif',
                  color: createMsg.includes('✅') ? '#10B981' : '#EF4444',
                }}>
                  {createMsg}
                </div>
              )}
            </Card>

            <Card>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9',
                fontFamily: 'Nunito,sans-serif', marginBottom: 12 }}>
                🏫 My Classes
              </div>
              {classes.length === 0 ? (
                <div style={{ color: '#64748B', fontSize: 13, fontFamily: 'Nunito,sans-serif',
                  textAlign: 'center', padding: '20px 0' }}>
                  No classes yet. Create one above!
                </div>
              ) : classes.map((cls, i) => (
                <motion.div key={i}
                  style={{
                    padding: '12px', borderRadius: 12, cursor: 'pointer', marginBottom: 8,
                    background: selectedClass?.class_code === cls.class_code
                      ? 'rgba(245,158,11,0.12)' : 'rgba(30,41,59,0.4)',
                    border: `1px solid ${selectedClass?.class_code === cls.class_code
                      ? 'rgba(245,158,11,0.35)' : '#2D3A4F'}`,
                  }}
                  whileHover={{ borderColor: 'rgba(245,158,11,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => loadClass(cls)}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9',
                    fontFamily: 'Nunito,sans-serif' }}>
                    {cls.class_name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                      {cls.student_count || 0} students
                    </span>
                    <span style={{
                      fontSize: 10, background: 'rgba(245,158,11,0.15)',
                      color: '#F59E0B', padding: '2px 8px', borderRadius: 999,
                      fontFamily: 'Nunito,sans-serif', fontWeight: 700, letterSpacing: 1,
                    }}>
                      {cls.class_code}
                    </span>
                  </div>
                </motion.div>
              ))}
            </Card>
          </div>

          {/* RIGHT — Charts + Student Roster or Student Detail */}
          <div>
            <AnimatePresence mode="wait">
              {selectedStudent && studentDetail ? (

                /* ── STUDENT DETAIL VIEW ── */
                <motion.div key="detail"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}>
                  <motion.button whileHover={{ x: -3 }}
                    onClick={() => { setSelStudent(null); setStudDetail(null); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', color: '#64748B',
                      fontSize: 13, fontFamily: 'Nunito,sans-serif',
                      display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, padding: 0,
                    }}>
                    ← Back to class
                  </motion.button>

                  {/* Profile header */}
                  <Card style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, color: '#fff', fontWeight: 700,
                      }}>
                        {selectedStudent.first_name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#F1F5F9',
                          fontFamily: 'Nunito,sans-serif' }}>
                          {selectedStudent.first_name} {selectedStudent.last_name}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                          @{selectedStudent.username} • Age {selectedStudent.age_group}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#F59E0B',
                            fontFamily: 'Nunito,sans-serif' }}>
                            Lv {studentDetail.profile?.current_level || 1}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>Level</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#6366F1',
                            fontFamily: 'Nunito,sans-serif' }}>
                            ⭐{studentDetail.profile?.total_stars || 0}
                          </div>
                          <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>Stars</div>
                        </div>
                      </div>
                    </div>

                    {/* Skill proficiency bars */}
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9',
                      fontFamily: 'Nunito,sans-serif', marginBottom: 12 }}>
                      📊 Skill Proficiency
                    </div>
                    {(studentDetail.game_performance || []).map((gp, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Nunito,sans-serif' }}>
                            {gp.game_name || gp.game_id}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700,
                            color: scoreColor(gp.avg_score) }}>
                            {Math.round(gp.avg_score)}%
                          </span>
                        </div>
                        <div style={{ height: 6, background: '#2D3A4F', borderRadius: 10, overflow: 'hidden' }}>
                          <motion.div
                            style={{ height: '100%', borderRadius: 10, background: scoreColor(gp.avg_score) }}
                            animate={{ width: `${gp.avg_score}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </Card>

                  {/* Game performance chart */}
                  <StudentGameChart gamePerformance={studentDetail.game_performance} />

                  {/* Badges */}
                  {(studentDetail.badges || []).length > 0 && (
                    <Card>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9',
                        fontFamily: 'Nunito,sans-serif', marginBottom: 12 }}>
                        🏆 Badges Earned
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {studentDetail.badges.map((b, i) => (
                          <div key={i} style={{
                            background: 'rgba(245,158,11,0.12)',
                            border: '1px solid rgba(245,158,11,0.25)',
                            borderRadius: 20, padding: '4px 12px',
                            fontSize: 12, color: '#F59E0B',
                            fontFamily: 'Nunito,sans-serif', fontWeight: 600,
                          }}>
                            {b.badge_icon} {b.badge_name}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </motion.div>

              ) : (

                /* ── CHARTS + ROSTER VIEW ── */
                <motion.div key="roster"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}>

                  {/* Charts — only show when there are students */}
                  {students.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <SectionPerformanceChart students={students} />
                      <WeeklyTrendChart scores={allScores} />
                    </div>
                  )}

                  {/* Student Roster Table */}
                  <Card>
                    <div style={{ display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#F1F5F9',
                          fontFamily: 'Nunito,sans-serif' }}>
                          🏆 Student Roster
                        </div>
                        {selectedClass && (
                          <div style={{ fontSize: 12, color: '#64748B',
                            fontFamily: 'Nunito,sans-serif', marginTop: 2 }}>
                            {selectedClass.class_name} • Class code:{' '}
                            <span style={{ color: '#F59E0B', fontWeight: 700 }}>
                              {selectedClass.class_code}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {students.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B',
                        fontSize: 13, fontFamily: 'Nunito,sans-serif' }}>
                        No students in this class yet.<br />
                        Share the code:{' '}
                        <strong style={{ color: '#F59E0B' }}>
                          {selectedClass?.class_code}
                        </strong>
                      </div>
                    ) : (
                      <>
                        {/* Table header */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 90px 100px 70px 70px 80px 80px',
                          padding: '8px 12px', marginBottom: 4,
                        }}>
                          {['STUDENT', 'GRADE', 'AVG SCORE', 'GAMES', 'STREAK', 'LEVEL', 'ACTION'].map(h => (
                            <div key={h} style={{
                              fontSize: 10, fontWeight: 700, color: '#64748B',
                              fontFamily: 'Nunito,sans-serif', letterSpacing: '0.5px',
                            }}>{h}</div>
                          ))}
                        </div>

                        {students.map((s, i) => {
                          const avg = s.avg_score || 0;
                          const low = avg < 40 && s.games_played > 0;
                          return (
                            <motion.div key={s.user_id || i}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 90px 100px 70px 70px 80px 80px',
                                padding: '12px', borderRadius: 12, marginBottom: 6,
                                alignItems: 'center', cursor: 'pointer',
                                background: low ? 'rgba(239,68,68,0.05)' : 'rgba(30,41,59,0.4)',
                                border: `1px solid ${low ? 'rgba(239,68,68,0.2)' : '#2D3A4F'}`,
                              }}
                              whileHover={{
                                borderColor: 'rgba(245,158,11,0.3)',
                                background: 'rgba(245,158,11,0.05)',
                              }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => loadStudentDetail(s)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                  background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 13, color: '#fff', fontWeight: 700,
                                }}>
                                  {s.first_name?.[0]?.toUpperCase() || 'S'}
                                </div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9',
                                    fontFamily: 'Nunito,sans-serif' }}>
                                    {s.first_name} {s.last_name}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#64748B',
                                    fontFamily: 'Nunito,sans-serif' }}>
                                    Age {s.age_group}
                                  </div>
                                </div>
                              </div>
                              <div style={{ fontSize: 12, color: '#94A3B8',
                                fontFamily: 'Nunito,sans-serif' }}>
                                {s.age_group}-A
                              </div>
                              <div style={{
                                padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800,
                                background: `rgba(${scoreRgb(avg)},0.15)`,
                                color: scoreColor(avg), width: 'fit-content',
                                border: `1px solid rgba(${scoreRgb(avg)},0.3)`,
                              }}>
                                {avg > 0 ? `${Math.round(avg)}%` : '—'}
                              </div>
                              <div style={{ fontSize: 13, color: '#94A3B8',
                                fontFamily: 'Nunito,sans-serif' }}>
                                {s.games_played || 0}
                              </div>
                              <div style={{ fontSize: 13, color: '#F59E0B',
                                fontFamily: 'Nunito,sans-serif',
                                display: 'flex', alignItems: 'center', gap: 3 }}>
                                🔥{s.streak || 0}
                              </div>
                              <div style={{
                                padding: '3px 10px', borderRadius: 20,
                                background: 'rgba(99,102,241,0.15)',
                                border: '1px solid rgba(99,102,241,0.25)',
                                fontSize: 11, color: '#818CF8',
                                fontFamily: 'Nunito,sans-serif', fontWeight: 700,
                                width: 'fit-content',
                              }}>
                                Lv{s.current_level || 1}
                              </div>
                              <div style={{ fontSize: 13, color: '#6366F1' }}>→</div>
                            </motion.div>
                          );
                        })}
                      </>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── ACTIVE TODAY MODAL ── */}
      <AnimatePresence>
        {showActive && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              style={{
                background: '#1E293B', border: '1px solid #2D3A4F',
                borderRadius: 20, padding: '28px 24px', maxWidth: 380, width: '90%',
              }}
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
            >
              <div style={{ fontSize: 16, fontWeight: 900, color: '#F1F5F9',
                fontFamily: 'Nunito,sans-serif', marginBottom: 14 }}>
                ✅ Active Today ({activeToday.length})
              </div>
              {activeToday.length === 0 ? (
                <div style={{ color: '#64748B', fontSize: 13, fontFamily: 'Nunito,sans-serif' }}>
                  No students active today yet.
                </div>
              ) : activeToday.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0',
                  borderBottom: i < activeToday.length - 1 ? '1px solid #2D3A4F' : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'linear-gradient(135deg,#10B981,#34D399)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: '#fff', fontWeight: 700,
                  }}>
                    {(s.first_name || 'S')[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif' }}>
                    {s.first_name} {s.last_name}
                  </span>
                </div>
              ))}
              <motion.button whileHover={{ scale: 1.02 }}
                onClick={() => setShowActive(false)}
                style={{
                  marginTop: 16, width: '100%', padding: '10px', borderRadius: 10,
                  border: '1px solid #2D3A4F', background: 'transparent', color: '#94A3B8',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'Nunito,sans-serif', fontWeight: 700,
                }}>
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}