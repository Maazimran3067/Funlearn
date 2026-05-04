import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore, getGameFeedback } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import useStageProgress from '../../hooks/useStageProgress';

const ALL_SHAPES = [
  { name:'Circle',    color:'#3B82F6', svg:<circle cx="50" cy="50" r="40"/> },
  { name:'Square',    color:'#10B981', svg:<rect x="10" y="10" width="80" height="80"/> },
  { name:'Triangle',  color:'#F59E0B', svg:<polygon points="50,10 90,90 10,90"/> },
  { name:'Star',      color:'#EC4899', svg:<polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"/> },
  { name:'Heart',     color:'#EF4444', svg:<path d="M50,80 C50,80 10,55 10,30 C10,15 25,5 50,25 C75,5 90,15 90,30 C90,55 50,80 50,80 Z"/> },
  { name:'Diamond',   color:'#8B5CF6', svg:<polygon points="50,5 95,50 50,95 5,50"/> },
  { name:'Rectangle', color:'#F97316', svg:<rect x="5" y="20" width="90" height="60"/> },
  { name:'Pentagon',  color:'#06B6D4', svg:<polygon points="50,5 95,35 77,88 23,88 5,35"/> },
];

const STAGES = [
  { name:'Stage 1', shapeNames:['Circle','Square','Triangle','Heart'],    questions:5, passMark:70 },
  { name:'Stage 2', shapeNames:['Star','Diamond','Rectangle','Pentagon'], questions:5, passMark:70 },
  { name:'Stage 3', shapeNames:['Circle','Square','Star','Diamond','Triangle','Heart'], questions:5, passMark:70 },
  { name:'Stage 4', shapeNames:['Circle','Square','Triangle','Star','Heart','Diamond','Rectangle','Pentagon'], questions:5, passMark:70 },
];

const BTN_COLORS = ['#7C3AED','#EC4899','#F59E0B','#10B981'];
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function ShapeSorter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unlockedStages, unlockStage, loaded } = useStageProgress('shapes');

  const [stageIndex,  setStageIndex]  = useState(0);
  const [playing,     setPlaying]     = useState(false);
  const [target,      setTarget]      = useState(null);
  const [choices,     setChoices]     = useState([]);
  const [usedShapes,  setUsedShapes]  = useState([]);
  const [score,       setScore]       = useState(0);
  const [round,       setRound]       = useState(0);
  const [feedback,    setFeedback]    = useState(null);
  const [stageOver,   setStageOver]   = useState(false);
  const [wrongCount,  setWrongCount]  = useState({});
  const [wrongStreak, setWrongStreak] = useState(0);
  const [showHint,    setShowHint]    = useState(false);
  const [aiFeedback,  setAiFeedback]  = useState('');
  const [loadingAI,   setLoadingAI]   = useState(false);
  const startTime    = useRef(Date.now());
  const currentStage = STAGES[stageIndex];
  const stageShapes  = ALL_SHAPES.filter(s => currentStage.shapeNames.includes(s.name));

  const pickShape = (used) => {
    const available = stageShapes.filter(s => !used.includes(s.name));
    if (available.length === 0) return stageShapes[Math.floor(Math.random() * stageShapes.length)];
    return available[Math.floor(Math.random() * available.length)];
  };

  const buildChoices = (t) => {
    const wrong = shuffle(ALL_SHAPES.filter(s => s.name !== t.name)).slice(0, 3);
    return shuffle([t, ...wrong]);
  };

  const startStage = () => {
    const t = pickShape([]);
    setUsedShapes([t.name]); setTarget(t); setChoices(buildChoices(t));
    setScore(0); setRound(0); setFeedback(null);
    setShowHint(false); setWrongCount({}); setWrongStreak(0);
    setStageOver(false); setPlaying(true);
    startTime.current = Date.now();
  };

  const handleAnswer = (shape) => {
    if (feedback) return;
    if (shape.name === target.name) {
      setFeedback('correct'); setScore(s => s + 1); setWrongStreak(0);
    } else {
      setFeedback('wrong'); setWrongStreak(s => s + 1);
      setWrongCount(prev => ({ ...prev, [target.name]: (prev[target.name] || 0) + 1 }));
      if (wrongStreak >= 1) setShowHint(true);
    }
    setTimeout(() => {
      setRound(prevRound => {
        const nextRound = prevRound + 1;
        if (nextRound >= currentStage.questions) { setStageOver(true); return nextRound; }
        const newUsed = [...usedShapes];
        const newT    = pickShape(newUsed);
        setUsedShapes([...newUsed, newT.name]);
        setTarget(newT); setChoices(buildChoices(newT));
        setFeedback(null); setShowHint(false);
        return nextRound;
      });
    }, 1200);
  };

  const handleStageComplete = async () => {
    const pct    = Math.round((score / currentStage.questions) * 100);
    const passed = pct >= currentStage.passMark;
    submitScore({ game_id:'shapes', score, max_score:currentStage.questions, time_taken:Math.floor((Date.now()-startTime.current)/1000), difficulty_level:stageIndex+1, ai_data:{wrong_shapes:wrongCount} }).catch(()=>{});
    if (passed && stageIndex + 1 < STAGES.length) unlockStage(stageIndex + 1);
    setLoadingAI(true);
    try {
      const res = await getGameFeedback({ game_id:'shapes', score, max_score:currentStage.questions, percentage:pct, age_group:user?.profile?.age_group||'3-6', ai_data:{wrong_shapes:wrongCount} });
      setAiFeedback(res.data.feedback);
    } catch { setAiFeedback(pct >= 70 ? 'Great shape knowledge! 🔵🌟' : 'Keep practising shapes! 💪'); }
    finally { setLoadingAI(false); }
  };

  useEffect(() => { if (stageOver) handleStageComplete(); }, [stageOver]);

  if (!loaded) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#EFF6FF', fontSize:18 }}>Loading... ✨</div>;

  if (!playing) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => navigate('/student/dashboard')}>← Back</motion.button>
          <div style={S.headerTitle}>🔵 Shape Sorter</div>
          <div style={{ width:80 }} />
        </div>
        <div style={S.stageArea}>
          <h2 style={S.stageTitle}>Choose Your Stage</h2>
          <p style={S.stageSub}>The shape is shown — name it! Text-only options. Score 70% to unlock next stage! ✨</p>
          <div style={S.stagesGrid}>
            {STAGES.map((s, i) => {
              const unlocked = unlockedStages.includes(i);
              return (
                <motion.div key={i} style={{ ...S.stageCard, opacity:unlocked?1:0.5, border:stageIndex===i?'3px solid #3B82F6':'3px solid transparent', background:unlocked?'#DBEAFE':'#F3F4F6' }}
                  whileHover={unlocked?{scale:1.05}:{}} whileTap={unlocked?{scale:0.95}:{}}
                  onClick={() => { if (unlocked) { setStageIndex(i); setStageOver(false); } }}>
                  <div style={{ fontSize:32 }}>{unlocked ? '🔵' : '🔒'}</div>
                  <div style={{ fontSize:15, fontWeight:800, color:unlocked?'#1E40AF':'#9CA3AF' }}>{s.name}</div>
                  <div style={{ fontSize:12, color:'#6B7280' }}>{s.shapeNames.join(', ')}</div>
                  {unlocked && <div style={{ fontSize:11, color:'#10B981', fontWeight:700, marginTop:4 }}>✅ Unlocked</div>}
                </motion.div>
              );
            })}
          </div>
          <motion.button style={{ ...S.startBtn, background:'linear-gradient(135deg,#3B82F6,#8B5CF6)' }} whileHover={{ scale:1.05 }} onClick={startStage}>
            Start {STAGES[stageIndex].name} 🚀
          </motion.button>
        </div>
      </div>
    );
  }

  if (stageOver) {
    const pct = Math.round((score / currentStage.questions) * 100);
    const passed = pct >= currentStage.passMark;
    return (
      <div style={S.page}>
        <motion.div style={S.resultCard} initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:'spring',bounce:0.4 }}>
          <div style={{ fontSize:80 }}>{passed?'🏆':'💪'}</div>
          <h1 style={S.resultTitle}>{passed?'Stage Passed! 🎉':'Try Again!'}</h1>
          <p style={S.resultScore}>{score}/{currentStage.questions} correct — {pct}%</p>
          <div style={S.resultPct}>{pct}%</div>
          <div style={S.starsRow}>{[1,2,3].map(s=><span key={s} style={{ fontSize:36,opacity:pct>=s*30?1:0.25 }}>⭐</span>)}</div>
          {passed&&stageIndex+1<STAGES.length&&<div style={S.unlockedBox}>🎉 {STAGES[stageIndex+1].name} Unlocked Forever!</div>}
          <div style={S.aiBox}>
            {loadingAI?<div style={S.aiRow}><span>🤖</span><span>AI analyzing...</span></div>
              :<><div style={S.aiRow}><span>🤖</span><strong style={{ color:'#1E40AF' }}>AI Tutor Feedback</strong></div><p style={S.aiText}>{aiFeedback}</p></>}
          </div>
          <div style={S.resultBtns}>
            <motion.button style={S.playBtn} whileHover={{ scale:1.05 }} onClick={() => { setPlaying(false); setStageOver(false); }}>{passed?'Next Stage 🚀':'Try Again 🔄'}</motion.button>
            <motion.button style={S.homeBtn} whileHover={{ scale:1.05 }} onClick={() => navigate('/student/dashboard')}>Home 🏠</motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!target) return null;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => { setPlaying(false); setStageOver(false); }}>← Stages</motion.button>
        <div style={S.headerTitle}>🔵 {currentStage.name}</div>
        <div style={S.scoreBadge}>⭐ {score}/{currentStage.questions}</div>
      </div>
      <div style={S.progressWrap}>
        <div style={S.progressTrack}><motion.div style={S.progressFill} animate={{ width:`${(round/currentStage.questions)*100}%` }} transition={{ duration:0.4 }} /></div>
        <span style={S.roundText}>Q{round+1}/{currentStage.questions}</span>
      </div>
      <div style={S.gameArea}>
        <motion.div style={S.questionBox} key={`${stageIndex}-${round}`} initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:'spring',bounce:0.4 }}>
          <p style={S.questionLabel}>What is the name of this shape?</p>
          <svg viewBox="0 0 100 100" width="140" height="140" style={{ fill:target.color, filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}>{target.svg}</svg>
        </motion.div>
        <AnimatePresence>
          {showHint && <motion.div style={S.hintBox} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>🤖 Hint: This shape is called a <strong>{target.name}</strong>!</motion.div>}
        </AnimatePresence>
        <AnimatePresence>
          {feedback && <motion.div style={{ ...S.feedbackBubble, background:feedback==='correct'?'#D1FAE5':'#FEE2E2', color:feedback==='correct'?'#065F46':'#991B1B' }} initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}>{feedback==='correct'?`✅ It's a ${target.name}!`:'❌ Try again!'}</motion.div>}
        </AnimatePresence>
        <div style={S.choicesGrid}>
          {choices.map((shape, i) => (
            <motion.button key={shape.name} style={{ ...S.nameBtn, background:feedback?(shape.name===target.name?'#D1FAE5':'#F3F4F6'):BTN_COLORS[i%BTN_COLORS.length], color:feedback?(shape.name===target.name?'#065F46':'#9CA3AF'):'#fff', opacity:feedback&&shape.name!==target.name?0.4:1 }}
              whileHover={!feedback?{scale:1.06,y:-3}:{}} whileTap={!feedback?{scale:0.94}:{}}
              onClick={() => handleAnswer(shape)} disabled={!!feedback}>
              {shape.name}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  page:        { minHeight:'100vh', background:'#EFF6FF', display:'flex', flexDirection:'column' },
  header:      { background:'#fff', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 12px rgba(59,130,246,0.08)' },
  backBtn:     { background:'#DBEAFE', color:'#3B82F6', border:'none', padding:'8px 16px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  headerTitle: { fontSize:20, fontWeight:900, color:'#1F1F2E' },
  scoreBadge:  { background:'#FEF3C7', color:'#D97706', padding:'6px 14px', borderRadius:20, fontSize:14, fontWeight:700 },
  progressWrap:{ padding:'12px 24px', background:'#fff', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', gap:12 },
  progressTrack:{ flex:1, height:10, background:'#DBEAFE', borderRadius:10, overflow:'hidden' },
  progressFill:{ height:'100%', background:'linear-gradient(90deg,#3B82F6,#8B5CF6)', borderRadius:10 },
  roundText:   { fontSize:13, fontWeight:700, color:'#3B82F6', whiteSpace:'nowrap' },
  gameArea:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'28px 20px', gap:20 },
  questionBox: { background:'#fff', borderRadius:28, padding:'28px 40px', textAlign:'center', boxShadow:'0 8px 32px rgba(59,130,246,0.12)' },
  questionLabel:{ fontSize:16, color:'#6B7280', fontWeight:700, margin:'0 0 16px' },
  hintBox:     { background:'#EFF6FF', color:'#1E40AF', borderRadius:14, padding:'10px 20px', fontSize:14, fontWeight:700, border:'2px solid #BFDBFE' },
  feedbackBubble:{ padding:'12px 28px', borderRadius:16, fontSize:16, fontWeight:800 },
  choicesGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, width:'100%', maxWidth:380 },
  nameBtn:     { padding:'22px 16px', borderRadius:16, border:'none', cursor:'pointer', fontSize:18, fontWeight:900, fontFamily:'Nunito,sans-serif', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' },
  stageArea:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px' },
  stageTitle:  { fontSize:24, fontWeight:900, color:'#1F1F2E', margin:'0 0 8px' },
  stageSub:    { fontSize:14, color:'#6B7280', marginBottom:28, textAlign:'center' },
  stagesGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:16, width:'100%', maxWidth:700, marginBottom:28 },
  stageCard:   { borderRadius:20, padding:'20px 16px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' },
  startBtn:    { color:'#fff', border:'none', padding:'16px 40px', borderRadius:18, fontSize:18, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  resultCard:  { background:'#fff', borderRadius:32, padding:'40px 36px', textAlign:'center', maxWidth:460, width:'90%', margin:'6vh auto', boxShadow:'0 20px 60px rgba(59,130,246,0.15)' },
  resultTitle: { fontSize:32, fontWeight:900, color:'#1F1F2E', margin:'12px 0 8px' },
  resultScore: { fontSize:18, color:'#6B7280', margin:'0 0 8px' },
  resultPct:   { fontSize:64, fontWeight:900, color:'#3B82F6' },
  starsRow:    { display:'flex', justifyContent:'center', gap:8, margin:'12px 0 12px' },
  unlockedBox: { background:'#D1FAE5', color:'#065F46', borderRadius:12, padding:'10px 20px', fontSize:14, fontWeight:800, marginBottom:16 },
  aiBox:       { background:'#EFF6FF', borderRadius:14, padding:'14px 16px', marginBottom:20, border:'2px solid #BFDBFE', textAlign:'left', width:'100%' },
  aiRow:       { display:'flex', alignItems:'center', gap:8, marginBottom:6, fontWeight:600 },
  aiText:      { fontSize:13, color:'#1E40AF', lineHeight:1.6, margin:0, fontWeight:600 },
  resultBtns:  { display:'flex', gap:12, justifyContent:'center' },
  playBtn:     { background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', color:'#fff', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  homeBtn:     { background:'#F3F4F6', color:'#4B5563', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
};
