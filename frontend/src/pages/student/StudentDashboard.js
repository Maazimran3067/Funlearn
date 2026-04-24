import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getProfile, getMyScores, getMyBadges, joinClass, checkClassCode, getGames } from '../../services/api';
import StudentNavbar from '../../components/StudentNavbar';
import { normaliseAge, AGE_LABEL } from '../../utils/ageGroup';

const GAMES_BY_AGE = {
  '3-6':  ['colors', 'shapes', 'alphabet'],
  '6-9':  ['animals', 'counting', 'words'],
  '9-12': ['math', 'spelling', 'memory'],
};

const GAME_INFO = {
  alphabet:{ name:'Alphabet Adventure', emoji:'🔤', path:'/games/alphabet', color:'#7C3AED', light:'#EDE9FE', desc:'Say the alphabet letters aloud!' },
  colors:  { name:'Color Explorer',     emoji:'🎨', path:'/games/colors',   color:'#EC4899', light:'#FCE7F3', desc:'Learn colors with fun visuals!' },
  shapes:  { name:'Shape Sorter',       emoji:'🔵', path:'/games/shapes',   color:'#3B82F6', light:'#DBEAFE', desc:'Name the shapes correctly!' },
  animals: { name:'Animal Kingdom',     emoji:'🐾', path:'/games/animals',  color:'#10B981', light:'#D1FAE5', desc:'Identify animals from sounds & images!' },
  counting:{ name:'Counting Stars',     emoji:'⭐', path:'/games/counting', color:'#F59E0B', light:'#FEF3C7', desc:'Count stars before time runs out!' },
  words:   { name:'Word Builder',       emoji:'📝', path:'/games/words',    color:'#F97316', light:'#FFEDD5', desc:'Build words from scrambled letters!' },
  math:    { name:'Math Challenge',     emoji:'➕', path:'/games/math',     color:'#EF4444', light:'#FEE2E2', desc:'Solve maths problems against the clock!' },
  spelling:{ name:'Spell It Right',     emoji:'✏️', path:'/games/spelling', color:'#8B5CF6', light:'#EDE9FE', desc:'Spell difficult words from memory!' },
  memory:  { name:'Memory Flip',        emoji:'🃏', path:'/games/memory',   color:'#06B6D4', light:'#CFFAFE', desc:'Match all card pairs in time!' },
};

const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 750];

export default function StudentDashboard() {
  const { user }                       = useAuth();
  const navigate                       = useNavigate();
  const [profile,     setProfile]      = useState(null);
  const [scores,      setScores]       = useState([]);
  const [badges,      setBadges]       = useState([]);
  const [activeGames, setActiveGames]  = useState([]);
  const [loading,     setLoading]      = useState(true);
  const [classModal,  setClassModal]   = useState(false);
  const [classCode,   setClassCode]    = useState('');
  const [codeStatus,  setCodeStatus]   = useState({ valid:null, message:'' });
  const [joining,     setJoining]      = useState(false);
  const [joinMsg,     setJoinMsg]      = useState('');

  useEffect(() => {
    Promise.all([getProfile(), getMyScores(), getMyBadges(), getGames()])
      .then(([pRes, sRes, bRes, gRes]) => {
        setProfile(pRes.data);
        setScores(sRes.data.scores || []);
        setBadges(bRes.data.badges || []);
        const ids = (gRes.data.games || []).filter(g => g.active !== false).map(g => g.game_id);
        setActiveGames(ids.length > 0 ? ids : Object.keys(GAME_INFO));
      })
      .catch(() => setActiveGames(Object.keys(GAME_INFO)))
      .finally(() => setLoading(false));
  }, []);

  const rawAge   = profile?.profile?.age_group || user?.profile?.age_group || '6-9';
  const ageGroup = normaliseAge(rawAge);
  const myGameIds = (GAMES_BY_AGE[ageGroup] || GAMES_BY_AGE['6-9']).filter(id => activeGames.includes(id));

  const totalStars = profile?.profile?.total_stars || 0;
  const level      = profile?.profile?.current_level || 1;
  const nextLevel  = LEVEL_THRESHOLDS[Math.min(level, LEVEL_THRESHOLDS.length - 1)] || 100;
  const prevLevel  = LEVEL_THRESHOLDS[Math.min(level - 1, LEVEL_THRESHOLDS.length - 1)] || 0;
  const progress   = Math.min(100, ((totalStars - prevLevel) / Math.max(1, nextLevel - prevLevel)) * 100);

  const checkCode = async (code) => {
    if (code.length < 5) { setCodeStatus({ valid:null, message:'' }); return; }
    try {
      const res = await checkClassCode(code.toUpperCase());
      setCodeStatus({ valid:res.data.valid, message:res.data.message });
    } catch { setCodeStatus({ valid:false, message:'Could not verify code.' }); }
  };

  const handleJoin = async () => {
    if (!classCode.trim()) return;
    setJoining(true);
    try {
      await joinClass({ class_code: classCode.toUpperCase() });
      setJoinMsg('Successfully joined class! 🎉');
      setClassModal(false);
      const res = await getProfile();
      setProfile(res.data);
    } catch (err) {
      setJoinMsg(err.response?.data?.error || 'Could not join class.');
    } finally { setJoining(false); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#F9F5FF,#FDF2F8,#F0FDF4)', fontSize:18, color:'#6B7280' }}>
      Loading your adventure... ✨
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#F9F5FF,#FDF2F8,#F0FDF4)' }}>
      <StudentNavbar />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px 20px' }}>

        {/* Welcome Banner */}
        <motion.div style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899,#F97316)', borderRadius:24, padding:'28px 32px', color:'#fff', marginBottom:24, boxShadow:'0 12px 40px rgba(124,58,237,0.3)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:900, margin:0 }}>Hi, {profile?.first_name || user?.first_name}! 👋</h1>
            <div style={{ fontSize:15, fontWeight:800, margin:'6px 0 2px', opacity:0.95 }}>{AGE_LABEL[ageGroup]}</div>
            <div style={{ fontSize:13, opacity:0.85 }}>Level {level}</div>
            <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1, maxWidth:200, height:8, background:'rgba(255,255,255,0.3)', borderRadius:10, overflow:'hidden' }}>
                <motion.div style={{ height:'100%', background:'#fff', borderRadius:10 }} animate={{ width:`${progress}%` }} transition={{ duration:0.8 }} />
              </div>
              <span style={{ fontSize:12, opacity:0.9 }}>⭐ {totalStars} stars</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {profile?.profile?.class_code ? (
              <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:12, padding:'8px 16px', fontSize:13, fontWeight:700 }}>🏫 Class: {profile.profile.class_code}</div>
            ) : (
              <motion.button style={{ background:'rgba(255,255,255,0.25)', color:'#fff', border:'2px solid rgba(255,255,255,0.5)', padding:'10px 18px', borderRadius:14, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}
                whileHover={{ scale:1.05 }} onClick={() => setClassModal(true)}>+ Join a Class</motion.button>
            )}
          </div>
        </motion.div>

        {joinMsg && (
          <motion.div style={{ background:'#D1FAE5', color:'#065F46', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:14, fontWeight:700 }}
            initial={{ opacity:0 }} animate={{ opacity:1 }}>✅ {joinMsg}</motion.div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:14, marginBottom:28 }}>
          {[
            { emoji:'⭐', value:totalStars,    label:'Total Stars',   color:'#F59E0B', light:'#FEF3C7' },
            { emoji:'🎯', value:`Lv ${level}`, label:'Current Level', color:'#7C3AED', light:'#EDE9FE' },
            { emoji:'🎮', value:scores.length, label:'Games Played',  color:'#3B82F6', light:'#DBEAFE' },
            { emoji:'🏆', value:badges.length, label:'Badges Earned', color:'#10B981', light:'#D1FAE5' },
          ].map((s, i) => (
            <motion.div key={i} style={{ background:s.light, borderRadius:20, padding:'16px 12px', textAlign:'center' }}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
              whileHover={{ scale:1.04 }}>
              <div style={{ fontSize:26 }}>{s.emoji}</div>
              <div style={{ fontSize:22, fontWeight:900, color:s.color, marginTop:4 }}>{s.value}</div>
              <div style={{ fontSize:12, color:'#6B7280', marginTop:2, fontWeight:600 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <h2 style={{ fontSize:22, fontWeight:900, color:'#1F1F2E', marginBottom:4 }}>🎮 Your Games</h2>
        <p style={{ fontSize:14, color:'#6B7280', marginBottom:16 }}>Games for <strong>{AGE_LABEL[ageGroup]}</strong></p>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginBottom:32 }}>
          {myGameIds.map((gameId, i) => {
            const info     = GAME_INFO[gameId];
            if (!info) return null;
            const myScores = scores.filter(s => s.game_id === gameId);
            const avg      = myScores.length ? Math.round(myScores.reduce((a, b) => a + b.percentage, 0) / myScores.length) : null;
            const safeAvg  = avg !== null ? Math.min(100, avg) : null;
            return (
              <motion.div key={gameId}
                style={{ background:'#fff', borderRadius:24, padding:'24px', cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', borderBottom:`4px solid ${info.color}` }}
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.1 }}
                whileHover={{ scale:1.03, y:-6, boxShadow:`0 16px 40px ${info.color}30` }}
                whileTap={{ scale:0.97 }}
                onClick={() => navigate(info.path)}>
                <div style={{ fontSize:52, marginBottom:12 }}>{info.emoji}</div>
                <div style={{ fontSize:18, fontWeight:900, color:info.color, marginBottom:6 }}>{info.name}</div>
                <div style={{ fontSize:13, color:'#6B7280', marginBottom:12 }}>{info.desc}</div>
                {safeAvg !== null ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, height:6, background:'#F3F4F6', borderRadius:10, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${safeAvg}%`, background:info.color, borderRadius:10 }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700, color:info.color }}>{safeAvg}% avg</span>
                  </div>
                ) : (
                  <div style={{ fontSize:12, color:'#9CA3AF', fontWeight:600 }}>Not played yet — tap to start!</div>
                )}
              </motion.div>
            );
          })}
        </div>

        {scores.length > 0 && (
          <motion.div style={{ background:'#fff', borderRadius:24, padding:'24px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
            <h2 style={{ fontSize:18, fontWeight:900, color:'#1F1F2E', marginBottom:14 }}>🕐 Recent Activity</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {scores.slice(0, 6).map((sc, i) => {
                const info  = GAME_INFO[sc.game_id];
                const pct   = Math.min(100, sc.percentage);
                const color = pct>=70?'#10B981':pct>=40?'#F59E0B':'#EF4444';
                const bg    = pct>=70?'#D1FAE5':pct>=40?'#FEF3C7':'#FEE2E2';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
                    <div style={{ fontSize:24 }}>{info?.emoji||'🎮'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#1F1F2E' }}>{info?.name||sc.game_id}</div>
                      <div style={{ fontSize:12, color:'#9CA3AF' }}>{new Date(sc.played_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                    </div>
                    <div style={{ background:bg, color, padding:'4px 12px', borderRadius:20, fontSize:13, fontWeight:800 }}>{pct}%</div>
                    <div style={{ fontSize:16 }}>{'⭐'.repeat(sc.stars||0)}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {classModal && (
          <motion.div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:20 }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div style={{ background:'#fff', borderRadius:28, padding:'36px 32px', width:'100%', maxWidth:440, boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}
              initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.8, opacity:0 }}>
              <h2 style={{ fontSize:22, fontWeight:900, color:'#1F1F2E', marginBottom:8 }}>🏫 Join a Class</h2>
              <p style={{ fontSize:14, color:'#6B7280', marginBottom:20 }}>Ask your teacher for the class code!</p>
              <input style={{ width:'100%', padding:'14px 16px', borderRadius:14, border:`2px solid ${codeStatus.valid===true?'#10B981':codeStatus.valid===false?'#EF4444':'#EDE9FE'}`, fontSize:16, outline:'none', textTransform:'uppercase', fontFamily:'Nunito,sans-serif', boxSizing:'border-box', letterSpacing:3, fontWeight:700 }}
                placeholder="e.g. HASSAN-X7K2" value={classCode}
                onChange={e => { setClassCode(e.target.value); checkCode(e.target.value); }} />
              {codeStatus.message && <div style={{ fontSize:13, marginTop:6, fontWeight:600, color:codeStatus.valid?'#10B981':'#EF4444' }}>{codeStatus.message}</div>}
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <motion.button style={{ flex:1, padding:'14px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#7C3AED,#EC4899)', color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif', opacity:codeStatus.valid?1:0.5 }}
                  whileHover={codeStatus.valid?{scale:1.03}:{}} onClick={handleJoin} disabled={!codeStatus.valid||joining}>
                  {joining?'Joining...':'Join Class! 🚀'}
                </motion.button>
                <motion.button style={{ padding:'14px 20px', borderRadius:14, border:'none', background:'#F3F4F6', color:'#4B5563', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}
                  whileHover={{ scale:1.03 }} onClick={() => setClassModal(false)}>Cancel</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}