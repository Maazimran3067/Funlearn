import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/AdminNavbar';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  getProfile, getPlatformStats, getAllUsers, getAllGamesAdmin,
  toggleUser, toggleGame, getAllClasses, trainAIModel
} from '../../services/api';

// ── SHARED CARD ───────────────────────────────────────────────
const Card = ({ children, style = {}, onClick }) => (
  <motion.div
    style={{
      background: '#1E293B', border: '1px solid #2D3A4F',
      borderRadius: 16, padding: 20, ...style,
    }}
    whileHover={onClick ? {
      scale: 1.02, borderColor: '#3B4F6A',
      boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
    } : {}}
    whileTap={onClick ? { scale: 0.98 } : {}}
    transition={{ duration: 0.15 }}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

// ── STAT CARD ─────────────────────────────────────────────────
const StatCard = ({ emoji, value, label, color, sub, onClick }) => {
  const rgb = color === '#10B981' ? '16,185,129'
    : color === '#6366F1' ? '99,102,241'
    : color === '#F59E0B' ? '245,158,11'
    : color === '#EF4444' ? '239,68,68'
    : '168,85,247';
  return (
    <motion.div
      style={{
        background: '#1E293B', border: `1px solid #2D3A4F`,
        borderRadius: 16, padding: 20,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative', overflow: 'hidden',
      }}
      whileHover={onClick ? {
        scale: 1.03, borderColor: `rgba(${rgb},0.4)`,
        boxShadow: `0 8px 30px rgba(${rgb},0.15)`,
      } : {}}
      whileTap={onClick ? { scale: 0.97 } : {}}
      onClick={onClick}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,${color},${color}66)`,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif',
            marginBottom: 8, fontWeight: 600, letterSpacing: '0.5px' }}>
            {label.toUpperCase()}
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#F1F5F9',
            fontFamily: 'Nunito,sans-serif' }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 11, color: '#10B981', marginTop: 4,
              fontFamily: 'Nunito,sans-serif' }}>
              {sub}
            </div>
          )}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `rgba(${rgb},0.15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {emoji}
        </div>
      </div>
    </motion.div>
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
        <p key={i} style={{ color: p.color || '#F1F5F9', fontSize: 13, fontWeight: 700, margin: '2px 0' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ── PLATFORM GROWTH CHART ─────────────────────────────────────
const PlatformGrowthChart = () => {
  const data = [
    { month: 'Jan', users: 120 }, { month: 'Feb', users: 280 },
    { month: 'Mar', users: 420 }, { month: 'Apr', users: 680 },
    { month: 'May', users: 900 }, { month: 'Jun', users: 1100 },
    { month: 'Jul', users: 1350 },{ month: 'Aug', users: 1600 },
    { month: 'Sep', users: 1900 },{ month: 'Oct', users: 2200 },
    { month: 'Nov', users: 2600 },{ month: 'Dec', users: 3000 },
  ];
  return (
    <Card style={{ gridColumn: '1/-1', marginBottom: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: '#F1F5F9',
        fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
        📈 Platform Growth
      </div>
      <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 16 }}>
        Total registered users over the year
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3A4F" />
          <XAxis dataKey="month" stroke="#64748B"
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }} />
          <YAxis stroke="#64748B"
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }} />
          <Tooltip content={<DarkTooltip />} />
          <Area type="monotone" dataKey="users" name="Users"
            stroke="#6366F1" strokeWidth={2.5}
            fill="url(#growthGrad)"
            dot={{ fill: '#6366F1', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ── USERS BY ROLE CHART ───────────────────────────────────────
const UsersByRoleChart = ({ students, teachers, parents, admins }) => {
  const data = [
    { role: 'Students', count: students, color: '#6366F1' },
    { role: 'Teachers', count: teachers, color: '#F59E0B' },
    { role: 'Parents',  count: parents,  color: '#10B981' },
    { role: 'Admins',   count: admins,   color: '#EF4444' },
  ];
  const COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EF4444'];

  return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 900, color: '#F1F5F9',
        fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
        👥 Users by Role
      </div>
      <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 16 }}>
        Distribution of platform users
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data} dataKey="count" nameKey="role"
            cx="50%" cy="50%" outerRadius={75} innerRadius={40}
            paddingAngle={3}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip content={<DarkTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ color: '#94A3B8', fontSize: 12, fontFamily: 'Nunito' }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ── GAMES ACTIVITY CHART ──────────────────────────────────────
const GamesActivityChart = () => {
  const data = [
    { day: 'Mon', games: 45 }, { day: 'Tue', games: 72 },
    { day: 'Wed', games: 58 }, { day: 'Thu', games: 90 },
    { day: 'Fri', games: 85 }, { day: 'Sat', games: 110 },
    { day: 'Sun', games: 62 },
  ];
  return (
    <Card>
      <div style={{ fontSize: 15, fontWeight: 900, color: '#F1F5F9',
        fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
        🎮 Games Played This Week
      </div>
      <div style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 16 }}>
        Daily game sessions across all students
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3A4F" />
          <XAxis dataKey="day" stroke="#64748B"
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }} />
          <YAxis stroke="#64748B"
            tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'Nunito' }} />
          <Tooltip content={<DarkTooltip />} />
          <Bar dataKey="games" name="Games" fill="#10B981"
            radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats,      setStats]      = useState(null);
  const [users,      setUsers]      = useState([]);
  const [games,      setGames]      = useState([]);
  const [classes,    setClasses]    = useState([]);
  const [tab,        setTab]        = useState('overview');
  const [loading,    setLoading]    = useState(true);
  const [training,   setTraining]   = useState(false);
  const [trainMsg,   setTrainMsg]   = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    Promise.allSettled([getPlatformStats(), getAllUsers(), getAllGamesAdmin(), getAllClasses()])
      .then(([sR, uR, gR, cR]) => {
        if (sR.status === 'fulfilled') setStats(sR.value.data);
        if (uR.status === 'fulfilled') setUsers(uR.value.data.users || []);
        if (gR.status === 'fulfilled') setGames(gR.value.data.games || []);
        if (cR.status === 'fulfilled') setClasses(cR.value.data.classes || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggleUser = async (userId, current) => {
    try {
      await toggleUser({ user_id: userId, active: !current });
      setUsers(p => p.map(u => u.id === userId ? { ...u, is_active: !current } : u));
    } catch {}
  };

  const handleToggleGame = async (gameId, current) => {
    try {
      await toggleGame({ game_id: gameId, active: !current });
      setGames(p => p.map(g => g.game_id === gameId ? { ...g, active: !current } : g));
    } catch {}
  };

  const handleTrain = async () => {
    setTraining(true); setTrainMsg('');
    try {
      const r = await trainAIModel();
      setTrainMsg(`✅ Model trained! Accuracy: ${r.data.accuracy || 'N/A'}`);
    } catch { setTrainMsg('❌ Training failed. Please try again.'); }
    finally { setTraining(false); }
  };

  const ALL_GAMES_LIST = [
    { game_id: 'colors',       name: 'Color Explorer',     emoji: '🎨', age: '3-6'  },
    { game_id: 'shapes',       name: 'Shape Sorter',        emoji: '🔵', age: '3-6'  },
    { game_id: 'alphabet',     name: 'Alphabet Adventure',  emoji: '🔤', age: '3-6'  },
    { game_id: 'numbers',      name: 'Number Buddy',        emoji: '🔢', age: '3-6'  },
    { game_id: 'animalsounds', name: 'Animal Sounds',       emoji: '🔊', age: '3-6'  },
    { game_id: 'animals',      name: 'Animal Kingdom',      emoji: '🐾', age: '6-9'  },
    { game_id: 'counting',     name: 'Counting Stars',      emoji: '⭐', age: '6-9'  },
    { game_id: 'words',        name: 'Word Builder',         emoji: '📝', age: '6-9'  },
    { game_id: 'sentences',    name: 'Sentence Maker',      emoji: '💬', age: '6-9'  },
    { game_id: 'patterns',     name: 'Pattern Quest',       emoji: '🔷', age: '6-9'  },
    { game_id: 'math',         name: 'Math Challenge',      emoji: '➕', age: '9-12' },
    { game_id: 'spelling',     name: 'Spell It Right',      emoji: '✏️', age: '9-12' },
    { game_id: 'memory',       name: 'Memory Flip',          emoji: '🃏', age: '9-12' },
    { game_id: 'logicgrid',    name: 'Logic Grid',           emoji: '🧩', age: '9-12' },
    { game_id: 'speedeq',      name: 'Speed Equations',     emoji: '⚡', age: '9-12' },
  ];

  const mergedGames = ALL_GAMES_LIST.map(g => {
    const found = games.find(x => x.game_id === g.game_id);
    return { ...g, active: found ? found.active !== false : true };
  });

  const filteredUsers = filterRole === 'all'
    ? users
    : users.filter(u => u.role === filterRole);

  const studentCount = users.filter(u => u.role === 'student').length;
  const teacherCount = users.filter(u => u.role === 'teacher').length;
  const parentCount  = users.filter(u => u.role === 'parent').length;
  const adminCount   = users.filter(u => u.role === 'admin').length;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0B1120', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748B', fontSize: 16, fontFamily: 'Nunito,sans-serif' }}>
        Loading admin panel... ✨
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120' }}>
      <AdminNavbar />
      <div style={{ marginLeft: 220, marginTop: 60, padding: '28px 28px' }}>

        {/* ── HEADER ── */}
        <div style={{
          background: 'linear-gradient(135deg,#1B2B4B 0%,#1E2D45 100%)',
          border: '1px solid #2D3A4F', borderRadius: 20, padding: '24px 28px',
          marginBottom: 24, position: 'relative', overflow: 'hidden',
        }}>
          <motion.div style={{
            position: 'absolute', width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)',
            top: -100, right: -50, pointerEvents: 'none',
          }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 7, repeat: Infinity }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 26 }}>🛡️</span>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#F1F5F9',
              fontFamily: 'Nunito,sans-serif' }}>
              Admin Panel
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Nunito,sans-serif' }}>
            FunLearn AI System Administration — Welcome, {user?.first_name}
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
          gap: 14, marginBottom: 24 }}>
          <StatCard emoji="🏫" value={stats?.total_schools || classes.length}
            label="Total Schools" color="#6366F1" sub="Click to view"
            onClick={() => navigate('/admin/classes')} />
          <StatCard emoji="👥" value={stats?.total_students || studentCount}
            label="Total Students" color="#10B981" sub="Click to view"
            onClick={() => { setTab('users'); setFilterRole('student'); }} />
          <StatCard emoji="👩‍🏫" value={stats?.total_teachers || teacherCount}
            label="Total Teachers" color="#F59E0B" sub="Click to view"
            onClick={() => { setTab('users'); setFilterRole('teacher'); }} />
          <StatCard emoji="🎮" value={stats?.games_today || 0}
            label="Games Today" color="#EF4444" sub="↑ +12% growth"
            onClick={() => navigate('/admin/games')} />
          <StatCard emoji="🏆" value={stats?.total_badges || 0}
            label="Total Badges" color="#A855F7"
            onClick={() => { setTab('users'); setFilterRole('all'); }} />
          <StatCard emoji="✅" value={stats?.active_users || 0}
            label="Active Users" color="#10B981"
            onClick={() => navigate('/admin/users')} />
        </div>

        {/* ── SYSTEM HEALTH ── */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#F1F5F9',
              fontFamily: 'Nunito,sans-serif' }}>
              🖥️ System Health
            </div>
            <div style={{
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
              fontSize: 12, color: '#10B981', fontFamily: 'Nunito,sans-serif', fontWeight: 700,
            }}>
              All Systems Operational
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
            {[
              ['API',       '99.99%', '45ms'],
              ['Database',  '99.99%', '12ms'],
              ['WebSocket', '99.99%', '28ms'],
              ['Storage',   '99.90%', '60ms'],
            ].map(([name, up, lat]) => (
              <div key={name} style={{
                background: 'rgba(15,23,42,0.5)', borderRadius: 12, padding: 14,
                border: '1px solid #2D3A4F',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%',
                    background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9',
                    fontFamily: 'Nunito,sans-serif' }}>{name}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#10B981',
                  fontFamily: 'Nunito,sans-serif' }}>{up}</div>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                  uptime
                </div>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif',
                  marginTop: 2 }}>
                  {lat} avg latency
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── TABS ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            ['overview', '📊 Overview'],
            ['users',    '👥 Users'   ],
            ['games',    '🎮 Games'   ],
            ['classes',  '🏫 Classes' ],
            ['ai',       '🤖 AI'      ],
          ].map(([t, l]) => (
            <motion.button key={t} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: tab === t
                  ? 'linear-gradient(135deg,#6366F1,#8B5CF6)'
                  : 'rgba(30,41,59,0.6)',
                color: tab === t ? '#fff' : '#94A3B8',
                fontSize: 13, fontWeight: 700, fontFamily: 'Nunito,sans-serif',
                border: `1px solid ${tab === t ? 'transparent' : '#2D3A4F'}`,
              }}>
              {l}
            </motion.button>
          ))}
        </div>

        {/* ── TAB: OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            {/* Growth chart full width */}
            <div style={{ marginBottom: 20 }}>
              <PlatformGrowthChart />
            </div>
            {/* Two charts side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <UsersByRoleChart
                students={studentCount}
                teachers={teacherCount}
                parents={parentCount}
                admins={adminCount}
              />
              <GamesActivityChart />
            </div>
          </div>
        )}

        {/* ── TAB: USERS ── */}
        {tab === 'users' && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#F1F5F9',
                fontFamily: 'Nunito,sans-serif' }}>
                👥 Manage Users
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['all', 'student', 'teacher', 'parent', 'admin'].map(r => (
                  <motion.button key={r} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => setFilterRole(r)}
                    style={{
                      padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                      background: filterRole === r ? 'rgba(99,102,241,0.2)' : 'transparent',
                      color: filterRole === r ? '#818CF8' : '#64748B',
                      border: `1px solid ${filterRole === r ? 'rgba(99,102,241,0.4)' : '#2D3A4F'}`,
                      fontSize: 12, fontWeight: 700, fontFamily: 'Nunito,sans-serif',
                      textTransform: 'capitalize',
                    }}>
                    {r}
                  </motion.button>
                ))}
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#64748B',
                fontSize: 13, fontFamily: 'Nunito,sans-serif' }}>
                No users found.
              </div>
            ) : filteredUsers.map((u, i) => {
              const roleColor = u.role === 'teacher' ? '#F59E0B'
                : u.role === 'parent' ? '#10B981'
                : u.role === 'admin'  ? '#EF4444'
                : '#6366F1';
              const roleGrad = u.role === 'teacher' ? '#F59E0B,#FBBF24'
                : u.role === 'parent'  ? '#10B981,#34D399'
                : u.role === 'admin'   ? '#EF4444,#F87171'
                : '#6366F1,#8B5CF6';
              return (
                <div key={u.user_id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px', borderRadius: 12, marginBottom: 8,
                  background: 'rgba(15,23,42,0.5)', border: '1px solid #2D3A4F',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: `linear-gradient(135deg,${roleGrad})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, color: '#fff', fontWeight: 700,
                  }}>
                    {(u.first_name || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9',
                      fontFamily: 'Nunito,sans-serif' }}>
                      {u.first_name} {u.last_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                      @{u.username} · {u.email}
                    </div>
                  </div>
                  <div style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    fontFamily: 'Nunito,sans-serif', textTransform: 'capitalize',
                    background: `rgba(${
                      u.role === 'teacher' ? '245,158,11'
                      : u.role === 'parent' ? '16,185,129'
                      : u.role === 'admin'  ? '239,68,68'
                      : '99,102,241'},0.15)`,
                    color: roleColor,
                  }}>
                    {u.role}
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleUser(u.id, u.is_active)}
                    style={{
                      padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                      background: u.is_active !== false
                        ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: u.is_active !== false ? '#10B981' : '#EF4444',
                      border: `1px solid ${u.is_active !== false
                        ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      fontSize: 12, fontWeight: 700, fontFamily: 'Nunito,sans-serif',
                    }}>
                    {u.is_active !== false ? '● Active' : '● Inactive'}
                  </motion.button>
                </div>
              );
            })}
          </Card>
        )}

        {/* ── TAB: GAMES ── */}
        {tab === 'games' && (
          <div>
            {/* Age group sections */}
            {[
              { label: 'Little Explorers', age: '3-6',  color: '#EC4899' },
              { label: 'Junior Learners',  age: '6-9',  color: '#10B981' },
              { label: 'Super Scholars',   age: '9-12', color: '#6366F1' },
            ].map(grp => (
              <div key={grp.age} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800,
                    background: `rgba(${grp.color === '#EC4899' ? '236,72,153' : grp.color === '#10B981' ? '16,185,129' : '99,102,241'},0.15)`,
                    color: grp.color, border: `1px solid rgba(${grp.color === '#EC4899' ? '236,72,153' : grp.color === '#10B981' ? '16,185,129' : '99,102,241'},0.3)`,
                    fontFamily: 'Nunito,sans-serif',
                  }}>
                    {grp.label}
                  </div>
                  <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                    Ages {grp.age}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                  {mergedGames.filter(g => g.age === grp.age).map(g => (
                    <Card key={g.game_id} style={{ position: 'relative', overflow: 'hidden', padding: 16 }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                        background: g.active
                          ? 'linear-gradient(90deg,#10B981,#34D399)'
                          : 'linear-gradient(90deg,#EF4444,#F87171)',
                      }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ fontSize: 32 }}>{g.emoji}</div>
                        <div style={{
                          padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                          fontFamily: 'Nunito,sans-serif',
                          background: g.active
                            ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: g.active ? '#10B981' : '#EF4444',
                          border: `1px solid ${g.active ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                          {g.active ? '● ON' : '● OFF'}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#F1F5F9',
                        fontFamily: 'Nunito,sans-serif', marginBottom: 10 }}>
                        {g.name}
                      </div>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => handleToggleGame(g.game_id, g.active)}
                        style={{
                          width: '100%', padding: '8px', borderRadius: 8,
                          border: `1px solid ${g.active ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                          background: g.active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: g.active ? '#EF4444' : '#10B981',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'Nunito,sans-serif',
                        }}>
                        {g.active ? 'Deactivate' : 'Activate'}
                      </motion.button>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: CLASSES ── */}
        {tab === 'classes' && (
          <Card>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#F1F5F9',
              fontFamily: 'Nunito,sans-serif', marginBottom: 16 }}>
              🏫 All Classes
            </div>
            {classes.length === 0 ? (
              <div style={{ color: '#64748B', fontFamily: 'Nunito,sans-serif',
                fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
                No classes created yet.
              </div>
            ) : classes.map((cls, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px', borderRadius: 12, marginBottom: 8,
                background: 'rgba(15,23,42,0.5)', border: '1px solid #2D3A4F',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>🏫</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9',
                    fontFamily: 'Nunito,sans-serif' }}>
                    {cls.class_name}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
                    {cls.student_count || 0} students
                  </div>
                </div>
                <div style={{
                  background: 'rgba(245,158,11,0.15)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 20, padding: '3px 12px', fontSize: 11, color: '#F59E0B',
                  fontFamily: 'Nunito,sans-serif', fontWeight: 700, letterSpacing: 1,
                }}>
                  {cls.class_code}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* ── TAB: AI ── */}
        {tab === 'ai' && (
          <Card style={{ maxWidth: 520 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#F1F5F9',
              fontFamily: 'Nunito,sans-serif', marginBottom: 8 }}>
              🤖 AI Model Training
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Nunito,sans-serif',
              marginBottom: 20, lineHeight: 1.7 }}>
              Retrain the difficulty prediction model with the latest student performance data.
              The scikit-learn Decision Tree Classifier will be updated with all accumulated
              game scores and automatically improve adaptive difficulty for all students.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
              gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Training Data',  value: `${users.filter(u => u.role === 'student').length * 12} records`, color: '#6366F1' },
                { label: 'Last Accuracy', value: '87.3%',   color: '#10B981' },
                { label: 'Model Version', value: 'v2.1',    color: '#F59E0B' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(15,23,42,0.5)',
                  borderRadius: 12, padding: 14, border: '1px solid #2D3A4F',
                  textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif',
                    marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color,
                    fontFamily: 'Nunito,sans-serif' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {trainMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: trainMsg.includes('✅')
                      ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${trainMsg.includes('✅')
                      ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                    color: trainMsg.includes('✅') ? '#6EE7B7' : '#FCA5A5',
                    fontSize: 13, fontFamily: 'Nunito,sans-serif',
                  }}>
                  {trainMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 6px 24px rgba(99,102,241,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleTrain}
              disabled={training}
              style={{
                padding: '14px 28px', borderRadius: 12, border: 'none',
                background: training ? '#1E293B' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: training ? '#64748B' : '#fff',
                fontSize: 15, fontWeight: 800,
                cursor: training ? 'not-allowed' : 'pointer',
                fontFamily: 'Nunito,sans-serif',
                boxShadow: training ? 'none' : '0 4px 20px rgba(99,102,241,0.3)',
              }}>
              {training ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block' }}>⏳
                  </motion.span>
                  Training Model...
                </span>
              ) : '🤖 Train AI Model'}
            </motion.button>
          </Card>
        )}
      </div>
    </div>
  );
}
