import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore, getGameFeedback } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import useStageProgress from '../../hooks/useStageProgress';

const STAGES = [
  { name:'Stage 1', min:1,  max:5,  timer:10, questions:5, passMark:70 },
  { name:'Stage 2', min:5,  max:10, timer:10, questions:5, passMark:70 },
  { name:'Stage 3', min:10, max:15, timer:10, questions:5, passMark:70 },
  { name:'Stage 4', min:15, max:20, timer:8,  questions:5, passMark:70 },
];

const BTN_COLORS = ['#7C3AED','#EC4899','#F59E0B','#10B981'];

function makeQuestion(min, max, usedCounts) {
  let available = [];
  for (let i = min; i <= max; i++) { if (!usedCounts.includes(i)) available.push(i); }
  const count = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : Math.floor(Math.random() * (max - min + 1)) + min;
  const wrongSet = new Set();
  let attempts = 0;
  while (wrongSet.size < 3 && attempts < 50) {
    attempts++;
    const delta = Math.floor(Math.random() * 4) + 1;
    const sign  = Math.random() > 0.5 ? 1 : -1;
    const w     = count + sign * delta;
    if (w >= 1 && w !== count) wrongSet.add(w);
  }
  [count+1,count+2,count+3].forEach(w => { if (wrongSet.size < 3 && w !== count && w >= 1) wrongSet.add(w); });
  return { count, choices:[count,...Array.from(wrongSet).slice(0,3)].sort(() => Math.random() - 0.5) };
}

function StarField({ count }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:6, maxWidth:300, margin:'8px auto' }}>
      {Array.from({ length:count }).map((_, i) => (
        <motion.span key={i} style={{ fontSize:26 }}
          initial={{ scale:0, rotate:-180 }} animate={{ scale:1, rotate:0 }}
          transition={{ delay:i * 0.05, type:'spring', bounce:0.5 }}>⭐</motion.span>
      ))}
    </div>
  );
}

export default function CountingStars() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unlockedStages, unlockStage, loaded } = useStageProgress('counting');

  const [stageIndex,  setStageIndex]  = useState(0);
  const [playing,     setPlaying]     = useState(false);
  const [question,    setQuestion]    = useState(null);
  const [usedCounts,  setUsedCounts]  = useState([]);
  const [score,       setScore]       = useState(0);
  const [round,       setRound]       = useState(0);
  const [feedback,    setFeedback]    = useState(null);
  const [stageOver,   setStageOver]   = useState(false);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [showHint,    setShowHint]    = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(10);
  const [aiFeedback,  setAiFeedback]  = useState('');
  const [loadingAI,   setLoadingAI]   = useState(false);

  const timerRef   = useRef(null);
  const fbRef      = useRef(null);
  const qRef       = useRef(null);
  const startTime  = useRef(Date.now());
  const currentStage = STAGES[stageIndex];

  fbRef.current = feedback;

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const startTimer = (secs) => {
    clearTimer(); setTimeLeft(secs);
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearTimer(); if (!fbRef.current) processAnswer(null, true); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  const startStage = () => {
    const q = makeQuestion(currentStage.min, currentStage.max, []);
    setQuestion(q); qRef.current = q;
    setUsedCounts([q.count]);
    setScore(0); setRound(0); setFeedback(null); fbRef.current = null;
    setShowHint(false); setWrongStreak(0); setStageOver(false);
    setPlaying(true); startTime.current = Date.now();
    startTimer(currentStage.timer);
  };

  useEffect(() => { return () => clearTimer(); }, []);

  const processAnswer = (chosen, timedOut = false) => {
    if (fbRef.current) return;
    clearTimer();
    const correct = !timedOut && chosen === qRef.current?.count;
    if (correct) { setFeedback('correct'); setScore(s => s + 1); setWrongStreak(0); }
    else {
      setFeedback(timedOut ? 'timeout' : 'wrong'); setWrongStreak(s => s + 1);
      if (wrongStreak >= 1) setShowHint(true);
    }
    setTimeout(() => {
      setRound(prevRound => {
        const nextRound = prevRound + 1;
        if (nextRound >= currentStage.questions) { setStageOver(true); return nextRound; }
        setUsedCounts(prevUsed => {
          const q = makeQuestion(currentStage.min, currentStage.max, prevUsed);
          setQuestion(q); qRef.current = q;
          setFeedback(null); fbRef.current = null;
          setShowHint(false);
          startTimer(currentStage.timer);
          return [...prevUsed, q.count];
        });
        return nextRound;
      });
    }, 1300);
  };

  const handleStageComplete = async () => {
    const pct    = Math.round((score / currentStage.questions) * 100);
    const passed = pct >= currentStage.passMark;
    submitScore({ game_id:'counting', score, max_score:currentStage.questions, time_taken:Math.floor((Date.now()-startTime.current)/1000), difficulty_level:stageIndex+1, ai_data:{final_difficulty:stageIndex+1} }).catch(()=>{});
    if (passed && stageIndex + 1 < STAGES.length) unlockStage(stageIndex + 1);
    setLoadingAI(true);
    try {
      const res = await getGameFeedback({ game_id:'counting', score, max_score:currentStage.questions, percentage:pct, age_group:user?.profile?.age_group||'6-9', ai_data:{final_difficulty:stageIndex+1} });
      setAiFeedback(res.data.feedback);
    } catch { setAiFeedback(pct >= 70 ? 'Great counting! Stage passed! ⭐🌟' : 'Keep practising counting! 💪'); }
    finally { setLoadingAI(false); }
  };

  useEffect(() => { if (stageOver) handleStageComplete(); }, [stageOver]);

  if (!loaded) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FEFCE8', fontSize:18 }}>Loading... ✨</div>;

  if (!playing) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => navigate('/student/dashboard')}>← Back</motion.button>
          <div style={S.headerTitle}>⭐ Counting Stars</div>
          <div style={{ width:80 }} />
        </div>
        <div style={S.stageArea}>
          <h2 style={S.stageTitle}>Choose Your Stage</h2>
          <p style={S.stageSub}>Count the stars and answer before the 10-second timer runs out! Score 70% to unlock next stage! ✨</p>
          <div style={S.stagesGrid}>
            {STAGES.map((s, i) => {
              const unlocked = unlockedStages.includes(i);
              return (
                <motion.div key={i} style={{ ...S.stageCard, opacity:unlocked?1:0.5, border:stageIndex===i?'3px solid #F59E0B':'3px solid transparent', background:unlocked?'#FEF3C7':'#F3F4F6' }}
                  whileHover={unlocked?{scale:1.05}:{}} whileTap={unlocked?{scale:0.95}:{}}
                  onClick={() => { if (unlocked) { setStageIndex(i); setStageOver(false); } }}>
                  <div style={{ fontSize:32 }}>{unlocked ? '⭐' : '🔒'}</div>
                  <div style={{ fontSize:15, fontWeight:800, color:unlocked?'#92400E':'#9CA3AF' }}>{s.name}</div>
                  <div style={{ fontSize:12, color:'#6B7280' }}>Count {s.min}–{s.max}</div>
                  <div style={{ fontSize:11, color:'#EF4444', fontWeight:700 }}>⏱️ {s.timer}s timer</div>
                  {unlocked && <div style={{ fontSize:11, color:'#10B981', fontWeight:700, marginTop:4 }}>✅ Unlocked</div>}
                </motion.div>
              );
            })}
          </div>
          <motion.button style={{ ...S.startBtn, background:'linear-gradient(135deg,#F59E0B,#EF4444)' }} whileHover={{ scale:1.05 }} onClick={startStage}>
            Start {STAGES[stageIndex].name} 🚀
          </motion.button>
        </div>
      </div>
    );
  }

  if (stageOver) {
    const pct    = Math.round((score / currentStage.questions) * 100);
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

  if (!question) return null;
  const timerPct = (timeLeft / currentStage.timer) * 100;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => { clearTimer(); setPlaying(false); setStageOver(false); }}>← Stages</motion.button>
        <div style={S.headerTitle}>⭐ {currentStage.name}</div>
        <div style={S.scoreBadge}>⭐ {score}/{currentStage.questions}</div>
      </div>
      <div style={S.progressWrap}>
        <div style={S.progressTrack}><motion.div style={S.progressFill} animate={{ width:`${(round/currentStage.questions)*100}%` }} transition={{ duration:0.4 }} /></div>
        <span style={S.roundText}>Q{round+1}/{currentStage.questions}</span>
      </div>
      <div style={S.gameArea}>
        <motion.div style={S.questionBox} key={round} initial={{ scale:0.9,opacity:0 }} animate={{ scale:1,opacity:1 }}>
          <p style={S.questionLabel}>How many stars do you see?</p>
          {/* Timer */}
          <div style={{ display:'flex', alignItems:'center', gap:8, margin:'8px 0' }}>
            <div style={{ flex:1, height:8, background:'#F3F4F6', borderRadius:10, overflow:'hidden' }}>
              <motion.div style={{ height:'100%', borderRadius:10, background:timerPct>50?'#10B981':timerPct>25?'#F59E0B':'#EF4444' }} animate={{ width:`${timerPct}%` }} transition={{ duration:0.8 }} />
            </div>
            <span style={{ fontSize:14, fontWeight:800, color:timeLeft<=3?'#EF4444':'#10B981', minWidth:28 }}>{timeLeft}s</span>
          </div>
          <StarField count={question.count} />
        </motion.div>
        <AnimatePresence>
          {showHint && <motion.div style={S.hintBox} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>🤖 Hint: There are <strong>{question.count}</strong> stars!</motion.div>}
        </AnimatePresence>
        <AnimatePresence>
          {feedback && <motion.div style={{ ...S.feedbackBubble, background:feedback==='correct'?'#D1FAE5':'#FEE2E2', color:feedback==='correct'?'#065F46':'#991B1B' }} initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}>{feedback==='correct'?'✅ Correct!':feedback==='timeout'?`⏰ Time up! It was ${question.count}`:`❌ It was ${question.count}!`}</motion.div>}
        </AnimatePresence>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, width:'100%', maxWidth:340 }}>
          {question.choices.map((num, i) => (
            <motion.button key={`${round}-${num}-${i}`}
              style={{ height:80, borderRadius:20, border:'none', fontSize:36, fontWeight:900, cursor:'pointer', fontFamily:'Nunito,sans-serif', background:feedback?(num===question.count?'#D1FAE5':'#F3F4F6'):BTN_COLORS[i%BTN_COLORS.length], color:feedback?(num===question.count?'#065F46':'#9CA3AF'):'#fff', opacity:feedback&&num!==question.count?0.4:1, boxShadow:feedback?'none':'0 4px 16px rgba(0,0,0,0.15)' }}
              whileHover={!feedback?{scale:1.1,y:-4}:{}} whileTap={!feedback?{scale:0.94}:{}}
              onClick={() => !feedback && processAnswer(num)} disabled={!!feedback}>
              {num}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  page:        { minHeight:'100vh', background:'#FEFCE8', display:'flex', flexDirection:'column' },
  header:      { background:'#fff', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 12px rgba(245,158,11,0.1)' },
  backBtn:     { background:'#FEF3C7', color:'#D97706', border:'none', padding:'8px 16px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  headerTitle: { fontSize:20, fontWeight:900, color:'#1F1F2E' },
  scoreBadge:  { background:'#FEF3C7', color:'#D97706', padding:'6px 14px', borderRadius:20, fontSize:14, fontWeight:700 },
  progressWrap:{ padding:'10px 24px', background:'#fff', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', gap:10 },
  progressTrack:{ flex:1, height:10, background:'#FEF3C7', borderRadius:10, overflow:'hidden' },
  progressFill:{ height:'100%', background:'linear-gradient(90deg,#F59E0B,#EF4444)', borderRadius:10 },
  roundText:   { fontSize:13, fontWeight:700, color:'#D97706', whiteSpace:'nowrap' },
  gameArea:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', gap:18 },
  questionBox: { background:'#fff', borderRadius:28, padding:'24px 32px', textAlign:'center', boxShadow:'0 8px 32px rgba(245,158,11,0.12)', width:'100%', maxWidth:400 },
  questionLabel:{ fontSize:16, color:'#6B7280', fontWeight:700, margin:'0 0 8px' },
  hintBox:     { background:'#FEF3C7', color:'#92400E', borderRadius:14, padding:'10px 20px', fontSize:14, fontWeight:700, border:'2px solid #FCD34D' },
  feedbackBubble:{ padding:'12px 28px', borderRadius:16, fontSize:16, fontWeight:800 },
  stageArea:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px' },
  stageTitle:  { fontSize:24, fontWeight:900, color:'#1F1F2E', margin:'0 0 8px' },
  stageSub:    { fontSize:14, color:'#6B7280', marginBottom:28, textAlign:'center' },
  stagesGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:16, width:'100%', maxWidth:700, marginBottom:28 },
  stageCard:   { borderRadius:20, padding:'20px 16px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' },
  startBtn:    { color:'#fff', border:'none', padding:'16px 40px', borderRadius:18, fontSize:18, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  resultCard:  { background:'#fff', borderRadius:32, padding:'40px 36px', textAlign:'center', maxWidth:460, width:'90%', margin:'6vh auto', boxShadow:'0 20px 60px rgba(245,158,11,0.15)' },
  resultTitle: { fontSize:32, fontWeight:900, color:'#1F1F2E', margin:'12px 0 8px' },
  resultScore: { fontSize:18, color:'#6B7280', margin:'0 0 8px' },
  resultPct:   { fontSize:64, fontWeight:900, color:'#F59E0B' },
  starsRow:    { display:'flex', justifyContent:'center', gap:8, margin:'12px 0 16px' },
  unlockedBox: { background:'#D1FAE5', color:'#065F46', borderRadius:12, padding:'10px 20px', fontSize:14, fontWeight:800, marginBottom:16 },
  aiBox:       { background:'#EFF6FF', borderRadius:14, padding:'14px 16px', marginBottom:20, border:'2px solid #BFDBFE', textAlign:'left', width:'100%' },
  aiRow:       { display:'flex', alignItems:'center', gap:8, marginBottom:6, fontWeight:600 },
  aiText:      { fontSize:13, color:'#1E40AF', lineHeight:1.6, margin:0, fontWeight:600 },
  resultBtns:  { display:'flex', gap:12, justifyContent:'center' },
  playBtn:     { background:'linear-gradient(135deg,#F59E0B,#EF4444)', color:'#fff', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  homeBtn:     { background:'#F3F4F6', color:'#4B5563', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
};
