import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getProfile, getMyScores, getMyBadges, joinClass, checkClassCode, getGames } from '../../services/api';
import StudentNavbar from '../../components/StudentNavbar';
import { normaliseAge, AGE_LABEL } from '../../utils/ageGroup';

const GAMES_BY_AGE = {
  '3-6':  ['colors', 'shapes', 'alphabet', 'numbers', 'animalsounds'],
  '6-9':  ['animals', 'counting', 'words', 'sentences', 'patterns'],
  '9-12': ['math', 'spelling', 'memory', 'logicgrid', 'speedeq'],
};

const GAME_INFO = {
  alphabet:     { name:'Alphabet Adventure', emoji:'🔤', path:'/games/alphabet',     color:'#8B5CF6' },
  colors:       { name:'Color Explorer',     emoji:'🎨', path:'/games/colors',       color:'#EC4899' },
  shapes:       { name:'Shape Sorter',       emoji:'🔵', path:'/games/shapes',       color:'#3B82F6' },
  numbers:      { name:'Number Buddy',       emoji:'🔢', path:'/games/numbers',      color:'#F97316' },
  animalsounds: { name:'Animal Sounds',      emoji:'🔊', path:'/games/animalsounds', color:'#8B5CF6' },
  animals:      { name:'Animal Kingdom',     emoji:'🐾', path:'/games/animals',      color:'#10B981' },
  counting:     { name:'Counting Stars',     emoji:'⭐', path:'/games/counting',     color:'#F59E0B' },
  words:        { name:'Word Builder',       emoji:'📝', path:'/games/words',        color:'#F97316' },
  sentences:    { name:'Sentence Maker',     emoji:'💬', path:'/games/sentences',    color:'#0EA5E9' },
  patterns:     { name:'Pattern Quest',      emoji:'🔷', path:'/games/patterns',     color:'#EC4899' },
  math:         { name:'Math Challenge',     emoji:'➕', path:'/games/math',         color:'#EF4444' },
  spelling:     { name:'Spell It Right',     emoji:'✏️', path:'/games/spelling',     color:'#A855F7' },
  memory:       { name:'Memory Flip',        emoji:'🃏', path:'/games/memory',       color:'#06B6D4' },
  logicgrid:    { name:'Logic Grid',         emoji:'🧩', path:'/games/logicgrid',    color:'#6366F1' },
  speedeq:      { name:'Speed Equations',    emoji:'⚡', path:'/games/speedeq',      color:'#F59E0B' },
};

// Reusable Dark Card
const Card = ({ children, style={}, onClick }) => (
  <motion.div
    style={{ background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:16,
      padding:20, ...style }}
    whileHover={onClick?{ scale:1.02, borderColor:'#3B4F6A' }:{}}
    onClick={onClick}>
    {children}
  </motion.div>
);

const StatCard = ({ emoji, value, label, color, delta }) => (
  <Card>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <div style={{ fontSize:11, color:'#64748B', fontFamily:'Nunito,sans-serif',
          marginBottom:6, fontWeight:700, letterSpacing:'0.5px' }}>{label.toUpperCase()}</div>
        <div style={{ fontSize:26, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' }}>{value}</div>
        {delta && <div style={{ fontSize:10, color:'#10B981', marginTop:4, fontFamily:'Nunito,sans-serif', fontWeight:600 }}>
          ↑ {delta}</div>}
      </div>
      <div style={{ width:42, height:42, borderRadius:12, background:`rgba(${
        color==='#6366F1'?'99,102,241':color==='#10B981'?'16,185,129':
        color==='#F59E0B'?'245,158,11':'99,102,241'},0.12)`,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{emoji}</div>
    </div>
  </Card>
);

export default function StudentDashboard() {
  const { user }                     = useAuth();
  const navigate                     = useNavigate();
  const [profile, setProfile]        = useState(null);
  const [scores,  setScores]         = useState([]);
  const [badges,  setBadges]         = useState([]);
  const [activeGames, setActiveGames]= useState([]);
  const [loading, setLoading]        = useState(true);
  const [classModal, setClassModal]  = useState(false);
  const [classCode,  setClassCode]   = useState('');
  const [codeStatus, setCodeStatus]  = useState({ valid:null, message:'' });
  const [joining,    setJoining]     = useState(false);
  const [joinMsg,    setJoinMsg]     = useState('');

  useEffect(()=>{
    Promise.all([getProfile(), getMyScores(), getMyBadges(), getGames()])
      .then(([pR,sR,bR,gR])=>{
        setProfile(pR.data);
        setScores(sR.data.scores||[]);
        setBadges(bR.data.badges||[]);
        const ids=(gR.data.games||[]).filter(g=>g.active!==false).map(g=>g.game_id);
        setActiveGames(ids.length>0?ids:Object.keys(GAME_INFO));
      }).catch(()=>setActiveGames(Object.keys(GAME_INFO)))
      .finally(()=>setLoading(false));
  },[]);

  const rawAge   = profile?.profile?.age_group||user?.profile?.age_group||'6-9';
  const ageGroup = normaliseAge(rawAge);
  const myGameIds= (GAMES_BY_AGE[ageGroup]||GAMES_BY_AGE['6-9']).filter(id=>activeGames.includes(id));
  const totalStars= profile?.profile?.total_stars||0;
  const level     = profile?.profile?.current_level||1;
  const progress  = Math.min(100,((totalStars%100)));

  const checkCode = async(code)=>{
    if(code.length<5){setCodeStatus({valid:null,message:''});return;}
    try{const r=await checkClassCode(code.toUpperCase());setCodeStatus({valid:r.data.valid,message:r.data.message});}
    catch{setCodeStatus({valid:false,message:'Could not verify.'});}
  };

  const handleJoin=async()=>{
    if(!classCode.trim())return;setJoining(true);
    try{await joinClass({class_code:classCode.toUpperCase()});setJoinMsg('Joined Class! 🎉');setClassModal(false);
      const r=await getProfile();setProfile(r.data);}
    catch(e){setJoinMsg(e.response?.data?.error||'Could not join.');}
    finally{setJoining(false);}
  };

  const scoreColor=(s)=>s>=70?'#10B981':s>=40?'#F59E0B':'#EF4444';

  if(loading) return(
    <div style={{ minHeight:'100vh', background:'#0B1120', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
        style={{ width:40, height:40, border:'4px solid #1E2D45', borderTopColor:'#6366F1', borderRadius:'50%' }} />
    </div>
  );

  return(
    <div style={{ minHeight:'100vh', background:'#0B1120', color:'#F1F5F9' }}>
      <StudentNavbar/>
      
      <div style={{ marginLeft:220, marginTop:60, padding:'32px' }}>

        {/* Hero Section */}
        <div style={{ background:'linear-gradient(135deg,#1E293B 0%,#0F172A 100%)',
          border:'1px solid #2D3A4F', borderRadius:24, padding:'32px',
          marginBottom:32, display:'flex', justifyContent:'space-between', alignItems:'center',
          flexWrap:'wrap', gap:24, position:'relative', overflow:'hidden' }}>
          
          <motion.div style={{ position:'absolute', width:400, height:400, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 70%)',
            top:-200, right:-100, pointerEvents:'none' }}
            animate={{ scale:[1,1.15,1] }} transition={{ duration:8, repeat:Infinity }}/>
          
          <div style={{ zIndex:1 }}>
            <div style={{ fontSize:28, fontWeight:900, fontFamily:'Nunito,sans-serif', marginBottom:6 }}>
              Hi, {profile?.first_name||user?.first_name}! Ready to play? 🚀
            </div>
            <div style={{ fontSize:14, color:'#94A3B8', fontFamily:'Nunito,sans-serif', marginBottom:20 }}>
              {AGE_LABEL[ageGroup]} • <span style={{ color:'#F59E0B', fontWeight:800 }}>Level {level} Explorer</span>
            </div>
            
            {/* Level Progress */}
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:240, height:10, background:'#1E2D45', borderRadius:20, overflow:'hidden', border:'1px solid #2D3A4F' }}>
                <motion.div style={{ height:'100%', background:'linear-gradient(90deg,#6366F1,#A855F7)',
                  borderRadius:20 }} initial={{ width:0 }} animate={{ width:`${progress}%` }} transition={{ duration:1 }}/>
              </div>
              <span style={{ fontSize:13, fontWeight:800, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' }}>
                ⭐ {totalStars} XP
              </span>
            </div>
          </div>

          <div style={{ display:'flex', gap:16, zIndex:1 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64, height:64, borderRadius:18, background:'rgba(245,158,11,0.1)',
                border:'1px solid rgba(245,158,11,0.2)', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:28, marginBottom:8 }}>🏆</div>
              <div style={{ fontSize:11, fontWeight:700, color:'#64748B' }}>{badges.length} Badges</div>
            </div>
            {!profile?.profile?.class_code && (
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                onClick={()=>setClassModal(true)}
                style={{ alignSelf:'center', padding:'12px 24px', borderRadius:14,
                  background:'linear-gradient(135deg,#6366F1,#4F46E5)', border:'none',
                  color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer',
                  boxShadow:'0 4px 15px rgba(99,102,241,0.3)', fontFamily:'Nunito,sans-serif' }}>
                + Join Class
              </motion.button>
            )}
          </div>
        </div>

        {joinMsg && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
            style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)',
            borderRadius:12, padding:'12px 20px', marginBottom:24, color:'#6EE7B7',
            fontSize:14, fontWeight:600 }}>✅ {joinMsg}</motion.div>
        )}

        {/* Stats Grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',
          gap:20, marginBottom:32 }}>
          <StatCard emoji="🎮" value={scores.length} label="Games Played" color="#6366F1" delta="3 new"/>
          <StatCard emoji="⭐" value={totalStars}    label="Total XP"     color="#F59E0B" delta="120 today"/>
          <StatCard emoji="🎯" value={scores.length?`${Math.round(scores.reduce((a,b)=>a+Math.min(100,b.percentage),0)/scores.length)}%`:'—'} label="Avg Accuracy" color="#10B981" />
          <StatCard emoji="🏅" value={badges.length} label="Badges Won"   color="#6366F1"/>
        </div>

        {/* Games Section */}
        <div style={{ marginBottom:40 }}>
          <div style={{ marginBottom:20 }}>
            <h2 style={{ fontSize:20, fontWeight:900, fontFamily:'Nunito,sans-serif' }}>🎮 Pick a Challenge</h2>
            <p style={{ fontSize:13, color:'#64748B', marginTop:4 }}>Specially selected for your age group</p>
          </div>
          
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
            {myGameIds.map((gameId, i) => {
              const info = GAME_INFO[gameId];
              if (!info) return null;
              const myS = scores.filter(s => s.game_id === gameId);
              const avg = myS.length ? Math.round(Math.min(100, myS.reduce((a,b) => a+b.percentage, 0)/myS.length)) : null;
              
              return (
                <motion.div key={gameId}
                  style={{ background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:20,
                    padding:24, cursor:'pointer', position:'relative', overflow:'hidden' }}
                  initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.1 }}
                  whileHover={{ y:-5, borderColor:info.color, boxShadow:`0 10px 30px rgba(0,0,0,0.3)` }}
                  onClick={() => navigate(info.path)}>
                  <div style={{ fontSize:44, marginBottom:16 }}>{info.emoji}</div>
                  <div style={{ fontSize:17, fontWeight:900, fontFamily:'Nunito,sans-serif', marginBottom:8 }}>{info.name}</div>
                  
                  {avg !== null ? (
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                        <span style={{ color:'#94A3B8', fontWeight:600 }}>Best Score</span>
                        <span style={{ color:info.color, fontWeight:800 }}>{avg}%</span>
                      </div>
                      <div style={{ height:6, background:'#0F172A', borderRadius:10, overflow:'hidden' }}>
                        <motion.div style={{ height:'100%', width:`${avg}%`, background:info.color }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize:12, color:'#64748B', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                      <span>New Adventure</span> <span style={{ color:info.color }}>▶</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Table-style Card */}
        {scores.length > 0 && (
          <Card style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #2D3A4F', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontSize:16, fontWeight:900, fontFamily:'Nunito,sans-serif' }}>🕐 Recent Adventures</h3>
              <span style={{ fontSize:12, color:'#6366F1', fontWeight:800, cursor:'pointer' }}>View All</span>
            </div>
            <div style={{ padding:'8px 24px 24px' }}>
              {scores.slice(0, 5).map((sc, i) => {
                const info = GAME_INFO[sc.game_id];
                const pct = Math.min(100, sc.percentage);
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 0',
                    borderBottom: i < 4 ? '1px solid #2D3A4F' : 'none' }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:'rgba(30,41,59,0.8)',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                      {info?.emoji || '🎮'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:700 }}>{info?.name || sc.game_id}</div>
                      <div style={{ fontSize:11, color:'#64748B' }}>
                        {new Date(sc.played_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:14, fontWeight:800, color:scoreColor(pct) }}>{pct}%</div>
                        <div style={{ fontSize:12 }}>{'⭐'.repeat(sc.stars || 0)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Class Join Modal */}
      <AnimatePresence>
        {classModal && (
          <motion.div style={{ position:'fixed', inset:0, background:'rgba(2,6,23,0.85)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, backdropFilter:'blur(4px)' }}
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <motion.div style={{ background:'#1E293B', border:'1px solid #2D3A4F',
              borderRadius:24, padding:'32px', width:'100%', maxWidth:420, boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)' }}
              initial={{ scale:0.9, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }}
              exit={{ scale:0.9, opacity:0, y:20 }}>
              
              <div style={{ textAlign:'center', marginBottom:24 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🏫</div>
                <h3 style={{ fontSize:20, fontWeight:900, marginBottom:8 }}>Join Your Class</h3>
                <p style={{ fontSize:14, color:'#94A3B8' }}>Enter the unique code from your teacher</p>
              </div>

              <input style={{ width:'100%', padding:'16px', borderRadius:16, boxSizing:'border-box',
                background:'#0F172A', border:`2px solid ${codeStatus.valid===true?'#10B981':codeStatus.valid===false?'#EF4444':'#2D3A4F'}`,
                color:'#fff', fontSize:18, textAlign:'center', outline:'none',
                fontFamily:'Nunito,sans-serif', textTransform:'uppercase', letterSpacing:4, fontWeight:800, marginBottom:8 }}
                placeholder="XXXX-XXXX" value={classCode}
                onChange={e => { setClassCode(e.target.value); checkCode(e.target.value); }}/>
              
              {codeStatus.message && (
                <div style={{ fontSize:12, textAlign:'center', marginBottom:20, fontWeight:600,
                  color:codeStatus.valid ? '#10B981' : '#EF4444' }}>{codeStatus.message}</div>
              )}

              <div style={{ display:'flex', gap:12, marginTop:24 }}>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={handleJoin} disabled={!codeStatus.valid || joining}
                  style={{ flex:2, padding:'14px', borderRadius:16, border:'none',
                    background:codeStatus.valid ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#2D3A4F',
                    color:codeStatus.valid ? '#fff' : '#64748B', fontSize:15, fontWeight:800,
                    cursor:codeStatus.valid ? 'pointer' : 'not-allowed', boxShadow:codeStatus.valid ? '0 4px 15px rgba(99,102,241,0.3)' : 'none' }}>
                  {joining ? 'Connecting...' : 'Join Now 🚀'}
                </motion.button>
                <button onClick={() => setClassModal(false)}
                  style={{ flex:1, background:'transparent', border:'1px solid #2D3A4F',
                    color:'#94A3B8', borderRadius:16, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}