import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getMyChildren, getProgressReport } from '../../services/api';
import api from '../../services/api';
import ParentNavbar from '../../components/ParentNavbar';
import { normaliseAge, AGE_LABEL } from '../../utils/ageGroup';

const GAME_INFO = {
  alphabet:{ name:'Alphabet Adventure',emoji:'🔤',color:'#7C3AED' },
  colors:  { name:'Color Explorer',    emoji:'🎨',color:'#EC4899' },
  shapes:  { name:'Shape Sorter',      emoji:'🔵',color:'#3B82F6' },
  animals: { name:'Animal Kingdom',    emoji:'🐾',color:'#10B981' },
  counting:{ name:'Counting Stars',    emoji:'⭐',color:'#F59E0B' },
  words:   { name:'Word Builder',      emoji:'📝',color:'#F97316' },
  math:    { name:'Math Challenge',    emoji:'➕',color:'#EF4444' },
  spelling:{ name:'Spell It Right',    emoji:'✏️',color:'#8B5CF6' },
  memory:  { name:'Memory Flip',       emoji:'🃏',color:'#06B6D4' },
};

export default function ParentDashboard() {
  const { user }                             = useAuth();
  const [children,     setChildren]          = useState([]);
  const [loading,      setLoading]           = useState(true);
  const [selectedChild,setSelectedChild]     = useState(null);
  const [aiReport,     setAiReport]          = useState('');
  const [reportLoading,setReportLoading]     = useState(false);
  const [view,         setView]              = useState('overview');

  // Add child modal state
  const [showAddChild,  setShowAddChild]   = useState(false);
  const [childUsername, setChildUsername]  = useState('');
  const [addLoading,    setAddLoading]     = useState(false);
  const [addError,      setAddError]       = useState('');
  const [addSuccess,    setAddSuccess]     = useState('');

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = () => {
    setLoading(true);
    getMyChildren()
      .then(res => {
        const kids = res.data.children || [];
        setChildren(kids);
        if (kids.length > 0) { setSelectedChild(kids[0]); loadReport(kids[0]); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadReport = (child) => {
    if (!child?.profile?.user_id) return;
    setReportLoading(true); setAiReport('');
    getProgressReport(child.profile.user_id)
      .then(r => setAiReport(r.data.report || ''))
      .catch(() => setAiReport('Not enough game data yet. Encourage your child to play more games!'))
      .finally(() => setReportLoading(false));
  };

  const selectChild = (child) => { setSelectedChild(child); setView('overview'); loadReport(child); };

  // ── ADD CHILD HANDLER ──────────────────────────────────────────────────────
  const handleAddChild = async () => {
    setAddError(''); setAddSuccess('');
    const username = childUsername.trim();
    if (!username) { setAddError('Please enter a username.'); return; }

    // Check if already added
    const alreadyAdded = children.some(c => c.profile?.username === username);
    if (alreadyAdded) { setAddError('This child is already linked to your account!'); return; }

    setAddLoading(true);
    try {
      await api.post('/users/add-child/', { child_username: username });
      setAddSuccess(`✅ ${username} added successfully!`);
      setChildUsername('');
      // Refresh children list
      const res  = await getMyChildren();
      const kids = res.data.children || [];
      setChildren(kids);
      // Auto-select the newly added child
      const newChild = kids.find(c => c.profile?.username === username);
      if (newChild) { setSelectedChild(newChild); loadReport(newChild); }
      setTimeout(() => { setShowAddChild(false); setAddSuccess(''); }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not add child. Make sure the username is correct.';
      setAddError(msg);
    } finally {
      setAddLoading(false);
    }
  };

  const scoreColor = (s) => s>=70?'#065F46':s>=40?'#92400E':'#991B1B';
  const scoreBg    = (s) => s>=70?'#D1FAE5':s>=40?'#FEF3C7':'#FEE2E2';

  const child   = selectedChild;
  const profile = child?.profile || {};
  const scores  = child?.scores  || [];
  const badges  = child?.badges  || [];

  const gameAvgs = {};
  scores.forEach(s => {
    if (!gameAvgs[s.game_id]) gameAvgs[s.game_id] = [];
    gameAvgs[s.game_id].push(Math.min(100, s.percentage));
  });
  const gameAverages = Object.fromEntries(
    Object.entries(gameAvgs).map(([g, percs]) => [g, Math.round(percs.reduce((a,b)=>a+b,0)/percs.length)])
  );
  const bestGame   = Object.entries(gameAverages).sort((a,b)=>b[1]-a[1])[0];
  const weakGame   = Object.entries(gameAverages).sort((a,b)=>a[1]-b[1])[0];
  const overallAvg = scores.length ? Math.min(100, Math.round(scores.reduce((a,b)=>a+Math.min(100,b.percentage),0)/scores.length)) : 0;

  const ageGroup = normaliseAge(profile?.age_group);

  if (loading) return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#FFF7ED,#FEF3C7)',fontSize:18,color:'#6B7280' }}>
      Loading... ✨
    </div>
  );

  return (
    <div style={{ minHeight:'100vh',background:'linear-gradient(135deg,#FFF7ED,#FEF3C7,#FFEDD5)' }}>
      <ParentNavbar />
      <div style={{ maxWidth:1100,margin:'0 auto',padding:'28px 20px' }}>

        {/* Welcome */}
        <motion.div style={{ background:'linear-gradient(135deg,#F97316,#EC4899)',borderRadius:24,padding:'24px 32px',color:'#fff',marginBottom:24,boxShadow:'0 8px 32px rgba(249,115,22,0.3)' }}
          initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12 }}>
            <div>
              <h1 style={{ fontSize:26,fontWeight:900,margin:0 }}>Welcome, {user?.first_name}! 👋</h1>
              <p style={{ fontSize:14,opacity:0.9,margin:'4px 0 0' }}>
                {children.length===0?'No children linked yet.':`Tracking ${children.length} child${children.length>1?'ren':''}`}
              </p>
            </div>
            {/* ── ADD CHILD BUTTON ── */}
            <motion.button
              style={{ background:'rgba(255,255,255,0.25)',border:'2px solid rgba(255,255,255,0.6)',borderRadius:14,padding:'10px 20px',color:'#fff',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'Nunito,sans-serif' }}
              whileHover={{ scale:1.05,background:'rgba(255,255,255,0.35)' }}
              whileTap={{ scale:0.95 }}
              onClick={() => { setShowAddChild(true); setAddError(''); setAddSuccess(''); setChildUsername(''); }}>
              ➕ Add Child
            </motion.button>
          </div>
        </motion.div>

        {/* ── ADD CHILD MODAL ───────────────────────────────────────────── */}
        <AnimatePresence>
          {showAddChild && (
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}
              onClick={(e) => { if(e.target===e.currentTarget) setShowAddChild(false); }}>
              <motion.div
                initial={{ scale:0.85,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.85,opacity:0 }}
                style={{ background:'#fff',borderRadius:28,padding:'36px 32px',width:'100%',maxWidth:420,boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>

                <div style={{ textAlign:'center',marginBottom:24 }}>
                  <div style={{ fontSize:52 }}>👶</div>
                  <h2 style={{ fontSize:22,fontWeight:900,color:'#1F1F2E',margin:'8px 0 4px' }}>Add Another Child</h2>
                  <p style={{ fontSize:14,color:'#6B7280',margin:0 }}>Enter your child's exact username they used to register</p>
                </div>

                {addSuccess && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                    style={{ background:'#D1FAE5',color:'#065F46',borderRadius:12,padding:'12px 16px',fontSize:14,fontWeight:700,marginBottom:16,textAlign:'center' }}>
                    {addSuccess}
                  </motion.div>
                )}
                {addError && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                    style={{ background:'#FEE2E2',color:'#DC2626',borderRadius:12,padding:'12px 16px',fontSize:14,fontWeight:600,marginBottom:16 }}>
                    ❌ {addError}
                  </motion.div>
                )}

                <div style={{ marginBottom:20 }}>
                  <label style={{ display:'block',fontSize:13,fontWeight:700,color:'#4B5563',marginBottom:6 }}>
                    🎒 Child's Username
                  </label>
                  <input
                    style={{ width:'100%',padding:'13px 16px',borderRadius:14,border:'2.5px solid #FFEDD5',fontSize:14,outline:'none',boxSizing:'border-box',fontFamily:'Nunito,sans-serif' }}
                    placeholder="e.g. ali_student123"
                    value={childUsername}
                    onChange={e => { setChildUsername(e.target.value); setAddError(''); }}
                    onKeyDown={e => e.key==='Enter' && handleAddChild()}
                  />
                  <div style={{ fontSize:12,color:'#9CA3AF',marginTop:5 }}>
                    Your child must have a registered student account first.
                  </div>
                </div>

                <div style={{ display:'flex',gap:12 }}>
                  <motion.button
                    style={{ flex:1,padding:'13px',borderRadius:14,border:'2px solid #E5E7EB',background:'#F9FAFB',color:'#6B7280',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Nunito,sans-serif' }}
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    onClick={() => setShowAddChild(false)}>
                    Cancel
                  </motion.button>
                  <motion.button
                    style={{ flex:2,padding:'13px',borderRadius:14,border:'none',background:addLoading?'#FED7AA':'linear-gradient(135deg,#F97316,#EC4899)',color:'#fff',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'Nunito,sans-serif' }}
                    whileHover={!addLoading?{ scale:1.02 }:{}}
                    whileTap={!addLoading?{ scale:0.98 }:{}}
                    onClick={handleAddChild}
                    disabled={addLoading}>
                    {addLoading ? '⏳ Adding...' : '➕ Add Child'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {children.length === 0 ? (
          <div style={{ background:'#fff',borderRadius:24,padding:'60px 40px',textAlign:'center',boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:64 }}>👶</div>
            <h2 style={{ color:'#1F1F2E',marginBottom:8 }}>No children linked!</h2>
            <p style={{ color:'#6B7280',fontSize:15 }}>Your child must register with a student account first, then click <strong>"Add Child"</strong> above using their username.</p>
          </div>
        ) : (
          <>
            {/* Child selector tabs */}
            <div style={{ display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center' }}>
              {children.map((c,i)=>(
                <motion.button key={i}
                  style={{ padding:'10px 20px',borderRadius:14,border:'none',cursor:'pointer',fontFamily:'Nunito,sans-serif',fontSize:14,fontWeight:700,
                    background:selectedChild?.profile?.user_id===c.profile?.user_id?'linear-gradient(135deg,#F97316,#EC4899)':'#fff',
                    color:selectedChild?.profile?.user_id===c.profile?.user_id?'#fff':'#4B5563',
                    boxShadow:selectedChild?.profile?.user_id===c.profile?.user_id?'0 4px 16px rgba(249,115,22,0.3)':'0 2px 8px rgba(0,0,0,0.06)' }}
                  whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                  onClick={() => selectChild(c)}>
                  🎒 {c.profile?.first_name || c.profile?.username}
                </motion.button>
              ))}
            </div>

            {child && (
              <>
                {/* Clickable Child Banner */}
                <motion.div
                  style={{ background:'#fff',borderRadius:24,padding:'24px',marginBottom:20,boxShadow:'0 4px 16px rgba(0,0,0,0.06)',cursor:'pointer',border:'2px solid transparent' }}
                  whileHover={{ border:'2px solid #F97316',scale:1.01 }}
                  onClick={() => setView(view==='detail'?'overview':'detail')}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:16 }}>
                      <div style={{ fontSize:60 }}>🎒</div>
                      <div>
                        <div style={{ fontSize:22,fontWeight:900,color:'#1F1F2E' }}>{profile.first_name} {profile.last_name}</div>
                        <div style={{ fontSize:14,color:'#6B7280',marginTop:2 }}>{AGE_LABEL[ageGroup]} • Level {profile.current_level||1} • ⭐{profile.total_stars||0} stars</div>
                        <div style={{ fontSize:13,color:'#F97316',fontWeight:700,marginTop:4 }}>
                          {view==='detail'?'👆 Click to hide details':'👆 Click for full progress report'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
                      {bestGame&&<div style={{ background:'#D1FAE5',borderRadius:12,padding:'8px 14px',fontSize:13,color:'#065F46',fontWeight:700 }}>💪 Best: {GAME_INFO[bestGame[0]]?.name||bestGame[0]} ({bestGame[1]}%)</div>}
                      {weakGame&&weakGame[1]<70&&<div style={{ background:'#FEE2E2',borderRadius:12,padding:'8px 14px',fontSize:13,color:'#991B1B',fontWeight:700 }}>📚 Focus: {GAME_INFO[weakGame[0]]?.name||weakGame[0]} ({weakGame[1]}%)</div>}
                    </div>
                  </div>
                </motion.div>

                {/* Detail View */}
                <AnimatePresence>
                  {view==='detail'&&(
                    <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }} exit={{ opacity:0,height:0 }}>

                      {/* AI Report */}
                      <div style={{ background:'#fff',borderRadius:20,padding:'20px 24px',marginBottom:16,border:'2px solid #DBEAFE',boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12 }}>
                          <span style={{ fontSize:28 }}>🤖</span>
                          <div>
                            <div style={{ fontSize:15,fontWeight:900,color:'#1E40AF' }}>AI Progress Report</div>
                            <div style={{ fontSize:12,color:'#6B7280' }}>Generated by AI Learning Analytics</div>
                          </div>
                        </div>
                        {reportLoading?<div style={{ fontSize:13,color:'#6B7280' }}>Generating AI report... ⏳</div>
                          :<p style={{ fontSize:14,color:'#374151',lineHeight:1.7,margin:0,whiteSpace:'pre-line' }}>{aiReport}</p>}
                      </div>

                      {/* Stats */}
                      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:12,marginBottom:16 }}>
                        {[
                          { emoji:'⭐',value:profile.total_stars||0,    label:'Total Stars',  bg:'#FEF3C7',color:'#92400E' },
                          { emoji:'🎯',value:`Lv ${profile.current_level||1}`, label:'Level', bg:'#EDE9FE',color:'#5B21B6' },
                          { emoji:'🎮',value:scores.length,             label:'Games Played', bg:'#DBEAFE',color:'#1E40AF' },
                          { emoji:'🏆',value:badges.length,             label:'Badges',       bg:'#D1FAE5',color:'#065F46' },
                          { emoji:'📊',value:`${overallAvg}%`,          label:'Average',      bg:'#FFEDD5',color:'#9A3412' },
                        ].map((s,i)=>(
                          <div key={i} style={{ background:s.bg,borderRadius:16,padding:'14px 10px',textAlign:'center' }}>
                            <div style={{ fontSize:22 }}>{s.emoji}</div>
                            <div style={{ fontSize:18,fontWeight:900,color:s.color,marginTop:4 }}>{s.value}</div>
                            <div style={{ fontSize:11,color:'#6B7280',marginTop:2,fontWeight:600 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Game Performance + Recent Activity */}
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
                        <div style={{ background:'#fff',borderRadius:20,padding:'20px',boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
                          <h3 style={{ fontSize:16,fontWeight:900,color:'#1F1F2E',marginBottom:14 }}>📊 Game Performance</h3>
                          {Object.keys(gameAverages).length===0?<p style={{ color:'#9CA3AF',fontSize:13 }}>No games played yet!</p>:
                            Object.entries(gameAverages).map(([game,avg])=>{
                              const info=GAME_INFO[game];
                              return(
                                <div key={game} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                                  <span style={{ fontSize:16 }}>{info?.emoji||'🎮'}</span>
                                  <span style={{ fontSize:12,fontWeight:600,color:'#4B5563',width:76,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{info?.name||game}</span>
                                  <div style={{ flex:1,height:8,background:'#F3F4F6',borderRadius:10,overflow:'hidden' }}>
                                    <motion.div style={{ height:'100%',background:scoreColor(avg),borderRadius:10 }} initial={{ width:0 }} animate={{ width:`${avg}%` }} transition={{ duration:0.8 }} />
                                  </div>
                                  <span style={{ fontSize:12,fontWeight:700,color:scoreColor(avg),width:36,textAlign:'right' }}>{avg}%</span>
                                </div>
                              );
                            })
                          }
                        </div>

                        <div style={{ background:'#fff',borderRadius:20,padding:'20px',boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
                          <h3 style={{ fontSize:16,fontWeight:900,color:'#1F1F2E',marginBottom:14 }}>🕐 Recent Activity</h3>
                          {scores.length===0?<p style={{ color:'#9CA3AF',fontSize:13 }}>No games played yet!</p>:
                            scores.slice(0,8).map((sc,i)=>{
                              const info=GAME_INFO[sc.game_id];
                              const pct=Math.min(100,sc.percentage);
                              return(
                                <div key={i} style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 0',borderBottom:'1px solid #F3F4F6' }}>
                                  <span style={{ fontSize:18 }}>{info?.emoji||'🎮'}</span>
                                  <div style={{ flex:1 }}>
                                    <div style={{ fontSize:13,fontWeight:700,color:'#1F1F2E' }}>{info?.name||sc.game_id}</div>
                                    <div style={{ fontSize:11,color:'#9CA3AF' }}>{new Date(sc.played_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                                  </div>
                                  <div style={{ background:scoreBg(pct),color:scoreColor(pct),padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700 }}>{pct}%</div>
                                </div>
                              );
                            })
                          }
                        </div>
                      </div>

                      {/* Badges */}
                      <div style={{ background:'#fff',borderRadius:20,padding:'20px',boxShadow:'0 4px 16px rgba(0,0,0,0.06)',marginBottom:16 }}>
                        <h3 style={{ fontSize:16,fontWeight:900,color:'#1F1F2E',marginBottom:14 }}>🏆 Badges Earned</h3>
                        {badges.length===0?<p style={{ color:'#9CA3AF',fontSize:13 }}>No badges yet! Encourage your child to play more games!</p>:
                          <div style={{ display:'flex',flexWrap:'wrap',gap:12 }}>
                            {badges.map((b,i)=>(
                              <motion.div key={i} style={{ textAlign:'center' }} whileHover={{ scale:1.1 }} title={b.description}>
                                <div style={{ fontSize:36 }}>{b.badge_icon||'🏅'}</div>
                                <div style={{ fontSize:11,fontWeight:700,color:'#4B5563',marginTop:4 }}>{b.badge_name}</div>
                              </motion.div>
                            ))}
                          </div>
                        }
                      </div>

                      {/* Recommendation */}
                      {weakGame&&weakGame[1]<60&&(
                        <div style={{ background:'#FEF3C7',borderRadius:16,padding:'16px 20px',border:'2px solid #FCD34D' }}>
                          <div style={{ fontSize:15,fontWeight:800,color:'#92400E',marginBottom:6 }}>📚 Parent Recommendation</div>
                          <p style={{ fontSize:14,color:'#78350F',margin:0,lineHeight:1.6 }}>
                            {profile.first_name} needs more practice with <strong>{GAME_INFO[weakGame[0]]?.name||weakGame[0]}</strong> (currently {weakGame[1]}%). Try 10 minutes daily and celebrate every improvement!
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Overview stats */}
                {view==='overview'&&(
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12 }}>
                    {[
                      { emoji:'⭐',value:profile.total_stars||0,    label:'Total Stars',  bg:'#FEF3C7',color:'#92400E' },
                      { emoji:'🎮',value:scores.length,             label:'Games Played', bg:'#DBEAFE',color:'#1E40AF' },
                      { emoji:'🏆',value:badges.length,             label:'Badges',       bg:'#D1FAE5',color:'#065F46' },
                      { emoji:'📊',value:`${overallAvg}%`,          label:'Average Score',bg:'#FFEDD5',color:'#9A3412' },
                    ].map((s,i)=>(
                      <motion.div key={i} style={{ background:s.bg,borderRadius:16,padding:'16px 12px',textAlign:'center' }}
                        initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.07 }}>
                        <div style={{ fontSize:26 }}>{s.emoji}</div>
                        <div style={{ fontSize:22,fontWeight:900,color:s.color,marginTop:4 }}>{s.value}</div>
                        <div style={{ fontSize:12,color:'#6B7280',marginTop:2,fontWeight:600 }}>{s.label}</div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}