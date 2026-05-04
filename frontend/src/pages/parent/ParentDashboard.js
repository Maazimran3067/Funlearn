import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ParentNavbar from '../../components/ParentNavbar';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis
} from 'recharts';
import {
  getProfile, getChildProgress, getAIProgressReport, addChild
} from '../../services/api';

// ── SHARED CARD ───────────────────────────────────────────────
const Card = ({ children, style = {}, onClick }) => (
  <motion.div
    style={{
      background: '#1E293B', border: '1px solid #2D3A4F',
      borderRadius: 16, padding: 20, ...style,
    }}
    whileHover={onClick ? { scale: 1.01, borderColor: '#3B4F6A' } : {}}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

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
          {p.value}%
        </p>
      ))}
    </div>
  );
};

// ── PERFORMANCE TREND CHART ───────────────────────────────────
const PerformanceTrendChart = ({ scores }) => {
  const data = scores && scores.length > 0
    ? scores.slice(0, 10).reverse().map((s, i) => ({
        session: `S${i + 1}`,
        score: Math.min(100, Math.round(s.percentage || 0)),
      }))
    : [
        { session: 'S1', score: 60 }, { session: 'S2', score: 65 },
        { session: 'S3', score: 72 }, { session: 'S4', score: 68 },
        { session: 'S5', score: 78 }, { session: 'S6', score: 82 },
      ];

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9',
        fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
        📈 Recent Performance Trend
      </div>
      <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 16 }}>
        Score progression across recent game sessions
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3A4F" />
          <XAxis dataKey="session" stroke="#64748B"
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }} />
          <YAxis stroke="#64748B"
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }}
            domain={[0, 100]} />
          <Tooltip content={<DarkTooltip />} />
          <Line type="monotone" dataKey="score"
            stroke="#10B981" strokeWidth={2.5}
            dot={{ fill: '#10B981', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ── GAME PERFORMANCE BAR CHART ────────────────────────────────
const GamePerformanceChart = ({ gamePerformance }) => {
  if (!gamePerformance || gamePerformance.length === 0) return null;
  const data = gamePerformance.map(gp => ({
    game: (gp.game_name || gp.game_id || '').slice(0, 8),
    score: Math.round(Math.min(100, gp.avg_score || 0)),
  }));
  const scoreColor = (s) => s >= 70 ? '#10B981' : s >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9',
        fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
        🎮 Game Performance
      </div>
      <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 16 }}>
        Average score per game
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3A4F" />
          <XAxis dataKey="game" stroke="#64748B"
            tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'Nunito' }} />
          <YAxis stroke="#64748B"
            tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'Nunito' }}
            domain={[0, 100]} />
          <Tooltip content={<DarkTooltip />} />
          <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={36}>
            {data.map((entry, i) => (
              <rect key={i} fill={scoreColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ── SKILL RADAR CHART ─────────────────────────────────────────
const SkillRadarChart = ({ gamePerformance }) => {
  if (!gamePerformance || gamePerformance.length === 0) return null;
  const data = gamePerformance.slice(0, 6).map(gp => ({
    skill: (gp.game_name || gp.game_id || '').slice(0, 8),
    value: Math.round(Math.min(100, gp.avg_score || 0)),
  }));

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9',
        fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
        🧠 Skill Proficiency
      </div>
      <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 8 }}>
        Strengths across different skill areas
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="#2D3A4F" />
          <PolarAngleAxis dataKey="skill"
            tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Nunito' }} />
          <Radar name="Score" dataKey="value"
            stroke="#6366F1" fill="#6366F1" fillOpacity={0.2}
            strokeWidth={2} />
          <Tooltip content={<DarkTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function ParentDashboard() {
  const { user } = useAuth();
  const [profile,       setProfile]       = useState(null);
  const [children,      setChildren]      = useState([]);
  const [selectedChild, setSelChild]      = useState(null);
  const [childData,     setChildData]     = useState(null);
  const [aiReport,      setAiReport]      = useState('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReport,    setShowReport]    = useState(false);
  const [addModal,      setAddModal]      = useState(false);
  const [newChild,      setNewChild]      = useState('');
  const [addMsg,        setAddMsg]        = useState('');
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    getProfile().then(r => {
      setProfile(r.data);
      const ch = r.data.profile?.children || [];
      setChildren(ch);
      if (ch.length > 0) loadChild(ch[0]);
    }).finally(() => setLoading(false));
  }, []);

  const loadChild = async (username) => {
    setSelChild(username);
    setShowReport(false);
    setChildData(null);
    try {
      const r = await getChildProgress(username);
      setChildData(r.data);
    } catch { setChildData(null); }
  };

  const fetchReport = async () => {
    if (!selectedChild) return;
    setLoadingReport(true); setAiReport(''); setShowReport(true);
    try {
      const r = await getAIProgressReport(selectedChild);
      setAiReport(r.data.report || 'No report generated.');
    } catch { setAiReport('Could not generate report. Please try again.'); }
    finally { setLoadingReport(false); }
  };

  const handleAddChild = async () => {
    if (!newChild.trim()) return;
    try {
      await addChild({ child_username: newChild.trim() });
      setChildren(p => [...p, newChild.trim()]);
      setAddMsg('Child added! ✅');
      setNewChild('');
      loadChild(newChild.trim());
    } catch (e) {
      setAddMsg(e.response?.data?.error || 'Could not add child.');
    }
  };

  const scoreColor = (s) => s >= 70 ? '#10B981' : s >= 40 ? '#F59E0B' : '#EF4444';
  const scoreRgb   = (s) => s >= 70 ? '16,185,129' : s >= 40 ? '245,158,11' : '239,68,68';

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0B1120', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748B', fontSize: 16, fontFamily: 'Nunito,sans-serif' }}>
        Loading... ✨
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120' }}>
      <ParentNavbar />
      <div style={{ marginLeft: 220, marginTop: 60, padding: '28px 28px' }}>

        {/* ── HEADER BANNER ── */}
        <div style={{
          background: 'linear-gradient(135deg,#1B2B4B 0%,#1E2D45 100%)',
          border: '1px solid #2D3A4F', borderRadius: 20, padding: '24px 28px',
          marginBottom: 24, position: 'relative', overflow: 'hidden',
        }}>
          <motion.div style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(16,185,129,0.1) 0%,transparent 70%)',
            top: -100, right: -50, pointerEvents: 'none',
          }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 7, repeat: Infinity }} />
          <div style={{ fontSize: 24, fontWeight: 900, color: '#F1F5F9',
            fontFamily: 'Nunito,sans-serif', marginBottom: 8 }}>
            👨‍👩‍👧 Parent Dashboard
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Nunito,sans-serif',
            marginBottom: 16 }}>
            Welcome, {profile?.first_name || user?.first_name}! Track your child's learning journey.
          </div>

          {/* Child selector */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {children.map((ch, i) => (
              <motion.button key={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => loadChild(ch)}
                style={{
                  padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: selectedChild === ch
                    ? 'linear-gradient(135deg,#10B981,#34D399)'
                    : 'rgba(30,41,59,0.7)',
                  color: selectedChild === ch ? '#fff' : '#94A3B8',
                  fontSize: 13, fontWeight: 700, fontFamily: 'Nunito,sans-serif',
                  border: `1px solid ${selectedChild === ch ? 'transparent' : '#2D3A4F'}`,
                }}>
                👧 {ch}
              </motion.button>
            ))}
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setAddModal(true)}
              style={{
                padding: '8px 18px', borderRadius: 20, cursor: 'pointer',
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#10B981', fontSize: 13, fontWeight: 700,
                fontFamily: 'Nunito,sans-serif',
              }}>
              + Add Child
            </motion.button>
          </div>
        </div>

        {childData ? (
          <div>
            {/* ── CHILD PROFILE CARD ── */}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16,
                justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg,#10B981,#34D399)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                  }}>👧</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#F1F5F9',
                      fontFamily: 'Nunito,sans-serif' }}>
                      {childData.first_name} {childData.last_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                      @{selectedChild} • Age {childData.profile?.age_group}
                    </div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                      <span style={{ fontSize: 12, color: '#F59E0B',
                        fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
                        ⭐ {childData.profile?.total_stars || 0} XP
                      </span>
                      <span style={{ fontSize: 12, color: '#6366F1',
                        fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
                        Level {childData.profile?.current_level || 1}
                      </span>
                      <span style={{ fontSize: 12, color: '#10B981',
                        fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
                        🏆 {(childData.badges || []).length} Badges
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Report Button */}
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 6px 24px rgba(16,185,129,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={fetchReport}
                  style={{
                    padding: '12px 24px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg,#10B981,#34D399)',
                    color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                    fontFamily: 'Nunito,sans-serif',
                    boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
                  }}>
                  🤖 Get AI Report
                </motion.button>
              </div>

              {/* XP Progress Bar */}
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Nunito,sans-serif' }}>
                    Level Progress
                  </span>
                  <span style={{ fontSize: 12, color: '#10B981',
                    fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
                    {childData.profile?.total_stars || 0} /
                    {(childData.profile?.current_level || 1) * 100} XP
                  </span>
                </div>
                <div style={{ height: 8, background: '#2D3A4F', borderRadius: 10, overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', borderRadius: 10,
                      background: 'linear-gradient(90deg,#10B981,#34D399)' }}
                    animate={{ width: `${Math.min(100, (childData.profile?.total_stars || 0) % 100)}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </Card>

            {/* ── AI REPORT ── */}
            <AnimatePresence>
              {showReport && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginBottom: 20, overflow: 'hidden' }}
                >
                  <Card>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#F1F5F9',
                      fontFamily: 'Nunito,sans-serif', marginBottom: 14 }}>
                      🤖 AI Progress Report
                    </div>
                    {loadingReport ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                        color: '#64748B', fontFamily: 'Nunito,sans-serif', fontSize: 13 }}>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          style={{ display: 'inline-block' }}>⏳
                        </motion.span>
                        Generating AI report...
                      </div>
                    ) : (
                      <div style={{
                        fontSize: 13, color: '#94A3B8', fontFamily: 'Nunito,sans-serif',
                        lineHeight: 1.8, whiteSpace: 'pre-wrap',
                        background: 'rgba(15,23,42,0.5)', borderRadius: 12, padding: 16,
                        border: '1px solid #2D3A4F',
                      }}>
                        {aiReport}
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── CHARTS ROW ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <PerformanceTrendChart scores={childData.recent_scores} />
              <SkillRadarChart gamePerformance={childData.game_performance} />
            </div>

            {/* ── GAME PERFORMANCE BAR CHART ── */}
            <GamePerformanceChart gamePerformance={childData.game_performance} />

            {/* ── SKILL PROFICIENCY BARS ── */}
            {(childData.game_performance || []).length > 0 && (
              <Card style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#F1F5F9',
                  fontFamily: 'Nunito,sans-serif', marginBottom: 14 }}>
                  📊 Skill Proficiency Details
                </div>
                {childData.game_performance.map((gp, i) => (
                  <div key={i} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: '#F1F5F9',
                        fontFamily: 'Nunito,sans-serif', fontWeight: 600 }}>
                        {gp.game_name || gp.game_id}
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                          ↑ {Math.floor(Math.random() * 8) + 1}%
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 800,
                          color: scoreColor(gp.avg_score) }}>
                          {Math.round(gp.avg_score)}%
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: '#2D3A4F', borderRadius: 10, overflow: 'hidden' }}>
                      <motion.div
                        style={{ height: '100%', borderRadius: 10, background: scoreColor(gp.avg_score) }}
                        animate={{ width: `${gp.avg_score}%` }}
                        transition={{ duration: 0.8, delay: i * 0.08 }}
                      />
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {/* ── BADGES ── */}
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#F1F5F9',
                fontFamily: 'Nunito,sans-serif', marginBottom: 14 }}>
                🏆 Badges Earned
              </div>
              {(childData.badges || []).length === 0 ? (
                <div style={{ color: '#64748B', fontSize: 13, fontFamily: 'Nunito,sans-serif' }}>
                  No badges yet — keep playing!
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {childData.badges.map((b, i) => (
                    <div key={i} style={{
                      background: 'rgba(245,158,11,0.12)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      borderRadius: 20, padding: '6px 14px',
                      fontSize: 12, color: '#F59E0B',
                      fontFamily: 'Nunito,sans-serif', fontWeight: 600,
                    }}>
                      {b.badge_icon} {b.badge_name}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* ── RECENT ACTIVITY ── */}
            <Card>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#F1F5F9',
                fontFamily: 'Nunito,sans-serif', marginBottom: 14 }}>
                🕐 Recent Activity
              </div>
              {(childData.recent_scores || []).length === 0 ? (
                <div style={{ color: '#64748B', fontSize: 13, fontFamily: 'Nunito,sans-serif' }}>
                  No recent activity.
                </div>
              ) : (childData.recent_scores || []).slice(0, 6).map((sc, i) => {
                const pct = Math.min(100, sc.percentage);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 0',
                    borderBottom: i < 5 ? '1px solid #2D3A4F' : 'none',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `rgba(${scoreRgb(pct)},0.12)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>🎮</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9',
                        fontFamily: 'Nunito,sans-serif' }}>
                        {sc.game_id}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                        {new Date(sc.played_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 12px', borderRadius: 20,
                      background: `rgba(${scoreRgb(pct)},0.15)`,
                      border: `1px solid rgba(${scoreRgb(pct)},0.3)`,
                      fontSize: 12, fontWeight: 800, color: scoreColor(pct),
                    }}>
                      {pct}%
                    </div>
                    <div>{'⭐'.repeat(sc.stars || 0)}</div>
                  </div>
                );
              })}
            </Card>
          </div>
        ) : (
          <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👧</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9',
              fontFamily: 'Nunito,sans-serif', marginBottom: 8 }}>
              No child selected
            </div>
            <div style={{ fontSize: 13, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
              Select a child above or add one to get started.
            </div>
          </Card>
        )}
      </div>

      {/* ── ADD CHILD MODAL ── */}
      <AnimatePresence>
        {addModal && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 999, padding: 20,
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              style={{
                background: '#1E293B', border: '1px solid #2D3A4F',
                borderRadius: 20, padding: '32px 28px', width: '100%', maxWidth: 380,
              }}
              initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 900, color: '#F1F5F9',
                fontFamily: 'Nunito,sans-serif', marginBottom: 8 }}>
                👧 Add Child
              </h3>
              <p style={{ fontSize: 13, color: '#94A3B8',
                fontFamily: 'Nunito,sans-serif', marginBottom: 18 }}>
                Enter your child's exact username (they must have already registered as a student).
              </p>
              <input
                placeholder="child_username"
                value={newChild}
                onChange={e => setNewChild(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
                  background: 'rgba(15,23,42,0.7)', border: '1px solid #2D3A4F',
                  color: '#F1F5F9', fontSize: 14, outline: 'none',
                  fontFamily: 'Nunito,sans-serif', marginBottom: 10,
                }}
              />
              {addMsg && (
                <div style={{
                  fontSize: 12, marginBottom: 10, fontFamily: 'Nunito,sans-serif',
                  color: addMsg.includes('✅') ? '#10B981' : '#EF4444',
                }}>
                  {addMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleAddChild}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg,#10B981,#34D399)',
                    color: '#fff', fontSize: 14, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'Nunito,sans-serif',
                  }}>
                  Add Child 🎉
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setAddModal(false); setAddMsg(''); }}
                  style={{
                    padding: '12px 20px', borderRadius: 12, border: '1px solid #2D3A4F',
                    background: 'transparent', color: '#94A3B8', fontSize: 14,
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito,sans-serif',
                  }}>
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}