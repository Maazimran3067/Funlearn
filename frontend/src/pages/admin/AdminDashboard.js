import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPlatformStats, trainAIModel } from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

const GAME_NAMES = { alphabet:'Alphabet Adventure',colors:'Color Explorer',shapes:'Shape Sorter',animals:'Animal Kingdom',counting:'Counting Stars',words:'Word Builder',math:'Math Challenge',spelling:'Spell It Right',memory:'Memory Flip' };
const GAME_EMOJI = { alphabet:'🔤',colors:'🎨',shapes:'🔵',animals:'🐾',counting:'⭐',words:'📝',math:'➕',spelling:'✏️',memory:'🃏' };

export default function AdminDashboard() {
  const { user }                = useAuth();
  const navigate                = useNavigate();
  const [stats,     setStats]   = useState(null);
  const [loading,   setLoading] = useState(true);
  const [trainMsg,  setTrainMsg]= useState('');
  const [training,  setTraining]= useState(false);
  const [modal,     setModal]   = useState(null); // 'games_today' | 'badges' | 'active'

  useEffect(() => {
    getPlatformStats()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleTrainAI = async () => {
    setTraining(true); setTrainMsg('🤖 Training AI model on student data...');
    try {
      const res = await trainAIModel();
      const acc = res.data?.accuracy || res.data?.message || 'Complete';
      setTrainMsg(`✅ AI model trained! Accuracy: ${acc}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || '';
      setTrainMsg(msg.includes('data') ? '⚠️ Need more student data first. Encourage students to play games!' : '❌ Training failed. Check Django server logs.');
    } finally { setTraining(false); }
  };

  const statCards = stats ? [
    { label:'Total Students', value:stats.total_students,  emoji:'🎒', color:'#7C3AED', light:'#EDE9FE', onClick:()=>navigate('/admin/users',{state:{filter:'students'}}) },
    { label:'Total Teachers', value:stats.total_teachers,  emoji:'👩‍🏫', color:'#10B981', light:'#D1FAE5', onClick:()=>navigate('/admin/users',{state:{filter:'teachers'}}) },
    { label:'Total Parents',  value:stats.total_parents,   emoji:'👨‍👩‍👧', color:'#F97316', light:'#FFEDD5', onClick:()=>navigate('/admin/users',{state:{filter:'parents'}}) },
    { label:'Total Admins',   value:stats.total_admins||0, emoji:'🔧', color:'#EF4444', light:'#FEE2E2', onClick:()=>navigate('/admin/users',{state:{filter:'admins'}}) },
    { label:'Games Today',    value:stats.games_today||0,  emoji:'🎮', color:'#EC4899', light:'#FCE7F3', onClick:()=>setModal('games_today') },
    { label:'Total Badges',   value:stats.total_badges||0, emoji:'🏆', color:'#F59E0B', light:'#FEF3C7', onClick:()=>setModal('badges') },
    { label:'Total Classes',  value:stats.total_classes||0,emoji:'🏫', color:'#3B82F6', light:'#DBEAFE', onClick:()=>navigate('/admin/classes') },
    { label:'Active Users',   value:stats.active_users||0, emoji:'✅', color:'#06B6D4', light:'#CFFAFE', onClick:()=>setModal('active') },
  ] : [];

  const filterBtns = [
    { key:'all',      label:'All',      emoji:'👥' },
    { key:'students', label:'Students', emoji:'🎒' },
    { key:'teachers', label:'Teachers', emoji:'👩‍🏫' },
    { key:'parents',  label:'Parents',  emoji:'👨‍👩‍👧' },
    { key:'admins',   label:'Admins',   emoji:'🔧' },
  ];

  // Aggregate today's games by game_id
  const todayByGame = {};
  (stats?.today_scores||[]).forEach(s => {
    if (!todayByGame[s.game_id]) todayByGame[s.game_id] = { count:0, scores:[] };
    todayByGame[s.game_id].count++;
    todayByGame[s.game_id].scores.push(s.percentage);
  });

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#F9F5FF,#FDF2F8,#F0FDF4)' }}>
      <AdminNavbar />
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 20px' }}>

        {/* Header */}
        <motion.div style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)', borderRadius:24, padding:'28px 32px', color:'#fff', marginBottom:28, boxShadow:'0 12px 40px rgba(124,58,237,0.3)' }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontSize:28, fontWeight:900, margin:0 }}>🔧 Admin Dashboard</h1>
              <p style={{ fontSize:14, opacity:0.9, margin:'6px 0 0' }}>Welcome, {user?.first_name}! Full platform control. Click any card for details.</p>
            </div>
            <div style={{ fontSize:60 }}>🎓</div>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign:'center', padding:60, fontSize:18, color:'#6B7280' }}>Loading stats... ⏳</div>
        ) : (
          <>
            {/* Stats Grid — all clickable */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:28 }}>
              {statCards.map((card, i) => (
                <motion.div key={i}
                  style={{ background:'#fff', borderRadius:20, padding:'20px 16px', textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', cursor:'pointer', borderBottom:`4px solid ${card.color}` }}
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                  whileHover={{ scale:1.04, y:-4, boxShadow:`0 12px 32px ${card.color}30` }}
                  whileTap={{ scale:0.97 }}
                  onClick={card.onClick}>
                  <div style={{ fontSize:32, marginBottom:8 }}>{card.emoji}</div>
                  <div style={{ fontSize:32, fontWeight:900, color:card.color }}>{card.value}</div>
                  <div style={{ fontSize:13, color:'#6B7280', fontWeight:600, marginTop:4 }}>{card.label}</div>
                  <div style={{ fontSize:11, color:card.color, marginTop:4, fontWeight:700 }}>Click to view →</div>
                </motion.div>
              ))}
            </div>

            {/* Quick filter row */}
            <motion.div style={{ background:'#fff', borderRadius:20, padding:'14px 20px', marginBottom:24, boxShadow:'0 4px 16px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:8, overflowX:'auto', flexWrap:'nowrap' }}
              initial={{ opacity:0 }} animate={{ opacity:1 }}>
              <span style={{ fontSize:14, fontWeight:700, color:'#374151', whiteSpace:'nowrap' }}>Quick Filter:</span>
              {filterBtns.map(btn => (
                <motion.button key={btn.key}
                  style={{ padding:'8px 14px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:'Nunito,sans-serif', fontWeight:700, fontSize:13, whiteSpace:'nowrap', background:'#F3F4F6', color:'#4B5563' }}
                  whileHover={{ scale:1.05, background:'linear-gradient(135deg,#7C3AED,#EC4899)', color:'#fff' }}
                  whileTap={{ scale:0.95 }}
                  onClick={() => navigate('/admin/users', { state: { filter: btn.key } })}>
                  {btn.emoji} {btn.label}
                </motion.button>
              ))}
            </motion.div>

            {/* Action Cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
              {[
                { emoji:'👥', title:'Manage Users',    desc:'Activate/deactivate students, teachers, parents & admins',      color:'#7C3AED', action:()=>navigate('/admin/users') },
                { emoji:'🏫', title:'Manage Classes',  desc:'View classes, deactivate them, see enrolled students',           color:'#10B981', action:()=>navigate('/admin/classes') },
                { emoji:'🎮', title:'Manage Games',    desc:'Toggle games on or off — affects all student portals instantly',  color:'#F97316', action:()=>navigate('/admin/games') },
                { emoji:'🤖', title:'Train AI Model',  desc:'Retrain difficulty prediction AI with latest student data',       color:'#EC4899', action:handleTrainAI, isAI:true },
              ].map((action, i) => (
                <motion.div key={i}
                  style={{ background:'#fff', borderRadius:20, padding:'24px 20px', cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', borderLeft:`4px solid ${action.color}`, opacity:action.isAI&&training?0.7:1 }}
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35+i*0.07 }}
                  whileHover={{ scale:1.03, y:-4, boxShadow:`0 12px 32px ${action.color}30` }}
                  whileTap={{ scale:0.97 }}
                  onClick={action.action}>
                  <div style={{ fontSize:36, marginBottom:12 }}>{action.isAI&&training?'⏳':action.emoji}</div>
                  <div style={{ fontSize:16, fontWeight:900, color:action.color, marginBottom:6 }}>{action.title}</div>
                  <div style={{ fontSize:13, color:'#6B7280' }}>{action.desc}</div>
                  <div style={{ fontSize:12, color:action.color, marginTop:8, fontWeight:700 }}>
                    {action.isAI ? (training?'Training... please wait':'Click to train →') : 'Click to manage →'}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Train AI result message */}
            {trainMsg && (
              <motion.div style={{ background:trainMsg.startsWith('✅')?'#D1FAE5':trainMsg.startsWith('🤖')?'#EFF6FF':trainMsg.startsWith('⚠️')?'#FEF3C7':'#FEE2E2', color:trainMsg.startsWith('✅')?'#065F46':trainMsg.startsWith('🤖')?'#1E40AF':trainMsg.startsWith('⚠️')?'#92400E':'#991B1B', borderRadius:16, padding:'16px 20px', marginTop:16, fontSize:14, fontWeight:700, border:'2px solid currentColor' }}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                {trainMsg}
                {trainMsg.startsWith('✅') && (
                  <div style={{ fontSize:12, marginTop:8, opacity:0.8, fontWeight:400 }}>
                    The AI model now uses the latest student performance data to predict difficulty levels and provide better feedback.
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Modal — Games Today */}
      <AnimatePresence>
        {modal === 'games_today' && (
          <motion.div style={S.modalOverlay} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setModal(null)}>
            <motion.div style={S.modalCard} initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.8,opacity:0 }} onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h2 style={{ fontSize:20, fontWeight:900, color:'#1F1F2E', margin:0 }}>🎮 Games Played Today</h2>
                <button style={S.closeBtn} onClick={() => setModal(null)}>✕</button>
              </div>
              {Object.keys(todayByGame).length === 0 ? (
                <div style={{ textAlign:'center', padding:32, color:'#9CA3AF' }}>
                  <div style={{ fontSize:48 }}>🎮</div><p>No games played today yet.</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {Object.entries(todayByGame).map(([gameId, data]) => {
                    const avg = Math.round(data.scores.reduce((a,b)=>a+b,0)/data.scores.length);
                    const sc  = avg>=70?'#065F46':avg>=40?'#92400E':'#991B1B';
                    const bg  = avg>=70?'#D1FAE5':avg>=40?'#FEF3C7':'#FEE2E2';
                    return (
                      <div key={gameId} style={{ display:'flex', alignItems:'center', gap:12, background:'#F9FAFB', borderRadius:14, padding:'12px 16px' }}>
                        <div style={{ fontSize:28 }}>{GAME_EMOJI[gameId]||'🎮'}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:15, fontWeight:800, color:'#1F1F2E' }}>{GAME_NAMES[gameId]||gameId}</div>
                          <div style={{ fontSize:12, color:'#6B7280' }}>{data.count} session{data.count!==1?'s':''} played</div>
                        </div>
                        <div style={{ background:bg, color:sc, padding:'4px 12px', borderRadius:20, fontSize:13, fontWeight:700 }}>{avg}% avg</div>
                      </div>
                    );
                  })}
                  <div style={{ background:'#EDE9FE', borderRadius:12, padding:'10px 14px', fontSize:13, color:'#5B21B6', fontWeight:600, textAlign:'center' }}>
                    Total: {stats?.games_today||0} game sessions today across {Object.keys(todayByGame).length} different games
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal — Total Badges */}
      <AnimatePresence>
        {modal === 'badges' && (
          <motion.div style={S.modalOverlay} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setModal(null)}>
            <motion.div style={S.modalCard} initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.8,opacity:0 }} onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h2 style={{ fontSize:20, fontWeight:900, color:'#1F1F2E', margin:0 }}>🏆 Total Badges</h2>
                <button style={S.closeBtn} onClick={() => setModal(null)}>✕</button>
              </div>
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:80 }}>🏆</div>
                <div style={{ fontSize:48, fontWeight:900, color:'#F59E0B', margin:'8px 0' }}>{stats?.total_badges||0}</div>
                <div style={{ fontSize:15, color:'#6B7280' }}>Total badges awarded to all students</div>
                <div style={{ marginTop:20, background:'#FEF3C7', borderRadius:14, padding:'14px', fontSize:14, color:'#92400E' }}>
                  Badges are awarded automatically when students achieve milestones — like their first game completion, high scores, and streaks. Go to a specific student's profile to see their individual badges.
                </div>
                <motion.button style={{ marginTop:16, background:'linear-gradient(135deg,#F59E0B,#F97316)', color:'#fff', border:'none', padding:'12px 24px', borderRadius:14, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}
                  whileHover={{ scale:1.05 }} onClick={() => { setModal(null); navigate('/admin/users'); }}>
                  View Students →
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal — Active Users */}
      <AnimatePresence>
        {modal === 'active' && (
          <motion.div style={S.modalOverlay} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setModal(null)}>
            <motion.div style={S.modalCard} initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.8,opacity:0 }} onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h2 style={{ fontSize:20, fontWeight:900, color:'#1F1F2E', margin:0 }}>✅ Active Users</h2>
                <button style={S.closeBtn} onClick={() => setModal(null)}>✕</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:16 }}>
                {[
                  { label:'Active Students', value:stats?.total_students||0, color:'#7C3AED', bg:'#EDE9FE' },
                  { label:'Active Teachers', value:stats?.total_teachers||0, color:'#10B981', bg:'#D1FAE5' },
                  { label:'Active Parents',  value:stats?.total_parents||0,  color:'#F97316', bg:'#FFEDD5' },
                  { label:'Active Admins',   value:stats?.total_admins||0,   color:'#EF4444', bg:'#FEE2E2' },
                ].map((item,i)=>(
                  <div key={i} style={{ background:item.bg, borderRadius:14, padding:'16px', textAlign:'center' }}>
                    <div style={{ fontSize:22, fontWeight:900, color:item.color }}>{item.value}</div>
                    <div style={{ fontSize:12, color:'#6B7280', marginTop:4 }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'#D1FAE5', borderRadius:12, padding:'12px 16px', fontSize:13, color:'#065F46', fontWeight:600, textAlign:'center' }}>
                ✅ Total {stats?.active_users||0} active accounts — deactivated users cannot log in
              </div>
              <motion.button style={{ marginTop:14, width:'100%', background:'linear-gradient(135deg,#7C3AED,#EC4899)', color:'#fff', border:'none', padding:'12px', borderRadius:14, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}
                whileHover={{ scale:1.03 }} onClick={() => { setModal(null); navigate('/admin/users'); }}>
                Manage All Users →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const S = {
  modalOverlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 },
  modalCard:   { background:'#fff', borderRadius:24, padding:'28px', width:'100%', maxWidth:520, boxShadow:'0 24px 60px rgba(0,0,0,0.2)', maxHeight:'85vh', overflowY:'auto' },
  closeBtn:    { background:'#F3F4F6', border:'none', padding:'6px 12px', borderRadius:10, cursor:'pointer', fontSize:14, fontWeight:700 },
};