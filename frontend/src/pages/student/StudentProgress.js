import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getProfile, getMyScores, getMyBadges } from '../../services/api';
import StudentNavbar from '../../components/StudentNavbar';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

// ── HELPERS ────────────────────────────────────────────────────
function normaliseAge(raw) {
  const s = String(raw || '').trim();
  if (s === '3-5' || s === '3-6') return '3-6';
  if (s === '6-8' || s === '6-9') return '6-9';
  if (s === '9-12') return '9-12';
  return s || '6-9';
}

const AGE_LABEL = {
  '3-6':  '🐣 Little Explorer',
  '6-9':  '🚀 Junior Learner',
  '9-12': '🧠 Super Scholar',
};

const GAME_NAMES = {
  colors: 'Color Explorer', shapes: 'Shape Sorter', alphabet: 'Alphabet Adventure',
  numbers: 'Number Buddy', animalsounds: 'Animal Sounds', animals: 'Animal Kingdom',
  counting: 'Counting Stars', words: 'Word Builder', sentences: 'Sentence Maker',
  patterns: 'Pattern Quest', math: 'Math Challenge', spelling: 'Spell It Right',
  memory: 'Memory Flip', logicgrid: 'Logic Grid', speedeq: 'Speed Equations',
};

const GAME_EMOJIS = {
  colors:'🎨', shapes:'🔵', alphabet:'🔤', numbers:'🔢', animalsounds:'🔊',
  animals:'🐾', counting:'⭐', words:'📝', sentences:'💬', patterns:'🔷',
  math:'➕', spelling:'✏️', memory:'🃏', logicgrid:'🧩', speedeq:'⚡',
};

const scoreColor = (s) => s >= 70 ? '#10B981' : s >= 40 ? '#F59E0B' : '#EF4444';
const scoreRgb   = (s) => s >= 70 ? '16,185,129' : s >= 40 ? '245,158,11' : '239,68,68';

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1E293B', border: '1px solid #2D3A4F', borderRadius: 10, padding: '10px 14px', fontFamily: 'Nunito,sans-serif' }}>
      <p style={{ color: '#94A3B8', fontSize: 12, margin: '0 0 4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#F1F5F9', fontSize: 13, fontWeight: 700, margin: '2px 0' }}>
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  );
};

// ── STAT CARD ──────────────────────────────────────────────────
function StatCard({ emoji, value, label, color }) {
  const rgb = color === '#6366F1' ? '99,102,241'
    : color === '#10B981' ? '16,185,129'
    : color === '#F59E0B' ? '245,158,11'
    : '239,68,68';
  return (
    <div style={{
      background: '#1E293B', border: `1px solid #2D3A4F`,
      borderRadius: 16, padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 8, fontWeight: 600, letterSpacing: '0.5px' }}>
            {label.toUpperCase()}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif' }}>
            {value}
          </div>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `rgba(${rgb},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
          {emoji}
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────
export default function StudentProgress() {
  const { user } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [scores,   setScores]   = useState([]);
  const [badges,   setBadges]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    Promise.all([getProfile(), getMyScores(), getMyBadges()])
      .then(([pR, sR, bR]) => {
        setProfile(pR.data);
        setScores(sR.data.scores || []);
        setBadges(bR.data.badges || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748B', fontSize: 16, fontFamily: 'Nunito,sans-serif' }}>
        Loading your progress... ✨
      </div>
    </div>
  );

  const ageGroup   = normaliseAge(profile?.profile?.age_group);
  const totalStars = profile?.profile?.total_stars || 0;
  const level      = profile?.profile?.current_level || 1;
  const xpProgress = Math.min(100, totalStars % 100);

  // ── COMPUTED DATA ──────────────────────────────────────────
  const gameMap = {};
  scores.forEach(s => {
    if (!gameMap[s.game_id]) gameMap[s.game_id] = { total: 0, count: 0 };
    gameMap[s.game_id].total += Math.min(100, s.percentage || 0);
    gameMap[s.game_id].count += 1;
  });
  const gamePerf = Object.entries(gameMap).map(([id, v]) => ({
    game: (GAME_NAMES[id] || id).slice(0, 10),
    gameId: id,
    avg: Math.round(v.total / v.count),
  })).sort((a, b) => b.avg - a.avg);

  const recentSessions = [...scores]
    .sort((a, b) => new Date(b.played_at) - new Date(a.played_at))
    .slice(0, 10)
    .reverse()
    .map((s, i) => ({
      session: `S${i + 1}`,
      score: Math.min(100, Math.round(s.percentage || 0)),
      game: GAME_NAMES[s.game_id] || s.game_id,
    }));

  const radarData = gamePerf.slice(0, 6).map(g => ({
    skill: (GAME_NAMES[g.gameId] || g.gameId).slice(0, 8),
    value: g.avg,
  }));

  const weekMap = {};
  scores.forEach(s => {
    const d = new Date(s.played_at);
    const weekNum = `W${Math.ceil(d.getDate() / 7)}`;
    if (!weekMap[weekNum]) weekMap[weekNum] = { total: 0, count: 0 };
    weekMap[weekNum].total += Math.min(100, s.percentage || 0);
    weekMap[weekNum].count += 1;
  });
  const weeklyData = Object.entries(weekMap).slice(0, 8).map(([w, v]) => ({
    week: w,
    score: Math.round(v.total / v.count),
  }));
  if (weeklyData.length < 2) {
    weeklyData.push({ week: 'W1', score: 65 }, { week: 'W2', score: 72 });
  }

  const avgScore = scores.length
    ? Math.round(scores.reduce((a, s) => a + Math.min(100, s.percentage || 0), 0) / scores.length)
    : 0;

  const tabs = ['overview', 'games', 'badges', 'history'];

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120' }}>
      <StudentNavbar />
      <div style={{ marginLeft: 220, marginTop: 60, padding: '28px' }}>

        {/* ── HEADER ── */}
        <div style={{
          background: 'linear-gradient(135deg,#1B2B4B 0%,#1E2D45 100%)',
          border: '1px solid #2D3A4F', borderRadius: 20,
          padding: '24px 28px', marginBottom: 24,
          position: 'relative', overflow: 'hidden'
        }}>
          <motion.div style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)',
            top: -100, right: -50, pointerEvents: 'none'
          }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
                📈 My Progress
              </div>
              <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Nunito,sans-serif' }}>
                {user?.first_name}'s learning journey — {AGE_LABEL[ageGroup]}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B', fontFamily: 'Nunito,sans-serif' }}>
                  Lv {level}
                </div>
                <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>Level</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#6366F1', fontFamily: 'Nunito,sans-serif' }}>
                  ⭐ {totalStars}
                </div>
                <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>Total XP</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#10B981', fontFamily: 'Nunito,sans-serif' }}>
                  🏆 {badges.length}
                </div>
                <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>Badges</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Nunito,sans-serif' }}>XP to next level</span>
              <span style={{ fontSize: 12, color: '#6366F1', fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
                {totalStars % 100} / 100
              </span>
            </div>
            <div style={{ height: 8, background: '#2D3A4F', borderRadius: 10, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: 'linear-gradient(90deg,#6366F1,#8B5CF6)', borderRadius: 10 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {tabs.map(t => (
            <motion.button key={t} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: activeTab === t ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(30,41,59,0.6)',
                color: activeTab === t ? '#fff' : '#94A3B8',
                fontSize: 13, fontWeight: 700, fontFamily: 'Nunito,sans-serif',
                border: `1px solid ${activeTab === t ? 'transparent' : '#2D3A4F'}`,
                textTransform: 'capitalize'
              }}>
              {t === 'overview' ? '📊 Overview'
                : t === 'games' ? '🎮 Games'
                : t === 'badges' ? '🏆 Badges'
                : '🕐 History'}
            </motion.button>
          ))}
        </div>

        {/* ── TAB: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 20 }}>
              <StatCard emoji="🎮" value={scores.length} label="Games Played" color="#6366F1" />
              <StatCard emoji="📊" value={avgScore ? `${avgScore}%` : '—'} label="Avg Score" color="#10B981" />
              <StatCard emoji="⭐" value={totalStars} label="Total XP" color="#F59E0B" />
              <StatCard emoji="🏆" value={badges.length} label="Badges" color="#6366F1" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={{ background: '#1E293B', border: '1px solid #2D3A4F', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
                  📈 Score Trend
                </div>
                <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 14 }}>
                  Your recent game sessions
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={recentSessions} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3A4F" />
                    <XAxis dataKey="session" stroke="#64748B" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }} domain={[0, 100]} />
                    <Tooltip content={<DarkTooltip />} />
                    <Line type="monotone" dataKey="score" name="Score" stroke="#6366F1" strokeWidth={2.5}
                      dot={{ fill: '#6366F1', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: '#1E293B', border: '1px solid #2D3A4F', borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
                  📅 Weekly Average
                </div>
                <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 14 }}>
                  Average score per week
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3A4F" />
                    <XAxis dataKey="week" stroke="#64748B" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }} domain={[0, 100]} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="score" name="Score" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {radarData.length > 2 && (
              <div style={{ background: '#1E293B', border: '1px solid #2D3A4F', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
                  🧠 Skill Radar
                </div>
                <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 14 }}>
                  Your strength across different subjects
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#2D3A4F" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Nunito' }} />
                    <Radar name="Score" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip content={<DarkTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: GAMES ── */}
        {activeTab === 'games' && (
          <div>
            {gamePerf.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B', fontFamily: 'Nunito,sans-serif', fontSize: 16 }}>
                No games played yet. Go play some games! 🎮
              </div>
            ) : (
              <>
                <div style={{ background: '#1E293B', border: '1px solid #2D3A4F', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif', marginBottom: 14 }}>
                    🎮 Game Performance Comparison
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={gamePerf} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D3A4F" />
                      <XAxis dataKey="game" stroke="#64748B" tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'Nunito' }} />
                      <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'Nunito' }} domain={[0, 100]} />
                      <Tooltip content={<DarkTooltip />} />
                      <Bar dataKey="avg" name="Avg Score" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
                  {gamePerf.map((g, i) => (
                    <motion.div key={g.gameId}
                      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      style={{ background: '#1E293B', border: '1px solid #2D3A4F', borderRadius: 16, padding: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ fontSize: 28 }}>{GAME_EMOJIS[g.gameId] || '🎮'}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif' }}>
                            {GAME_NAMES[g.gameId] || g.gameId}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                            {gameMap[g.gameId]?.count || 0} sessions
                          </div>
                        </div>
                        <div style={{
                          marginLeft: 'auto', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 800,
                          background: `rgba(${scoreRgb(g.avg)},0.15)`,
                          color: scoreColor(g.avg),
                          border: `1px solid rgba(${scoreRgb(g.avg)},0.3)`
                        }}>
                          {g.avg}%
                        </div>
                      </div>
                      <div style={{ height: 6, background: '#2D3A4F', borderRadius: 10, overflow: 'hidden' }}>
                        <motion.div
                          style={{ height: '100%', borderRadius: 10, background: scoreColor(g.avg) }}
                          animate={{ width: `${g.avg}%` }}
                          transition={{ duration: 0.8, delay: i * 0.06 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TAB: BADGES ── */}
        {activeTab === 'badges' && (
          <div>
            {badges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B', fontFamily: 'Nunito,sans-serif', fontSize: 16 }}>
                No badges yet. Keep playing to earn badges! 🏆
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
                {badges.map((b, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.04, borderColor: 'rgba(245,158,11,0.4)', boxShadow: '0 8px 28px rgba(245,158,11,0.15)' }}
                    style={{ background: '#1E293B', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 42, marginBottom: 10 }}>{b.badge_icon || '🏆'}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B', fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
                      {b.badge_name}
                    </div>
                    {b.description && (
                      <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Nunito,sans-serif', marginBottom: 8 }}>
                        {b.description}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                      🗓 {new Date(b.awarded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: HISTORY ── */}
        {activeTab === 'history' && (
          <div style={{ background: '#1E293B', border: '1px solid #2D3A4F', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif', marginBottom: 16 }}>
              🕐 Full Game History
            </div>
            {scores.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                No game history yet.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px 100px', padding: '8px 12px', marginBottom: 4 }}>
                  {['GAME', 'DATE', 'SCORE', 'STARS', 'LEVEL'].map(h => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#64748B', fontFamily: 'Nunito,sans-serif', letterSpacing: '0.5px' }}>
                      {h}
                    </div>
                  ))}
                </div>
                {[...scores]
                  .sort((a, b) => new Date(b.played_at) - new Date(a.played_at))
                  .map((s, i) => {
                    const pct = Math.min(100, Math.round(s.percentage || 0));
                    return (
                      <div key={i} style={{
                        display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px 100px',
                        padding: '10px 12px', borderRadius: 10, marginBottom: 6, alignItems: 'center',
                        background: 'rgba(15,23,42,0.4)', border: '1px solid #2D3A4F'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{GAME_EMOJIS[s.game_id] || '🎮'}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif' }}>
                            {GAME_NAMES[s.game_id] || s.game_id}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                          {new Date(s.played_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                        <div style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800,
                          background: `rgba(${scoreRgb(pct)},0.15)`,
                          color: scoreColor(pct),
                          border: `1px solid rgba(${scoreRgb(pct)},0.3)`,
                          width: 'fit-content'
                        }}>
                          {pct}%
                        </div>
                        <div style={{ fontSize: 14 }}>{'⭐'.repeat(s.stars || 0)}</div>
                        <div style={{
                          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: 'rgba(99,102,241,0.12)', color: '#818CF8', fontFamily: 'Nunito,sans-serif',
                          width: 'fit-content'
                        }}>
                          Lv{s.difficulty_level || 1}
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}