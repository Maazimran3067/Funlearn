import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore, getGameFeedback } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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

  if (!loaded) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0B1120', fontSize:18, color:'#94A3B8', fontFamily:'Nunito,sans-serif' }}>Loading... ✨</div>;

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
                <motion.div key={i} style={{ ...S.stageCard, opacity:unlocked?1:0.5, border:stageIndex===i?'2px solid #F59E0B':'1px solid #2D3A4F', background:unlocked?'rgba(245,158,11,0.1)':'#1E293B' }}
                  whileHover={unlocked?{scale:1.05}:{}} whileTap={unlocked?{scale:0.95}:{}}
                  onClick={() => { if (unlocked) { setStageIndex(i); setStageOver(false); } }}>
                  <div style={{ fontSize:32 }}>{unlocked ? '⭐' : '🔒'}</div>
                  <div style={{ fontSize:15, fontWeight:800, color:unlocked?'#F59E0B':'#4B5563', fontFamily:'Nunito,sans-serif' }}>{s.name}</div>
                  <div style={{ fontSize:12, color:'#64748B', fontFamily:'Nunito,sans-serif' }}>Count {s.min}–{s.max}</div>
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
            <div style={{ flex:1, height:8, background:'#2D3A4F', borderRadius:10, overflow:'hidden' }}>
              <motion.div style={{ height:'100%', borderRadius:10, background:timerPct>50?'#10B981':timerPct>25?'#F59E0B':'#EF4444' }} animate={{ width:`${timerPct}%` }} transition={{ duration:0.8 }} />
            </div>
            <span style={{ fontSize:14, fontWeight:800, color:timeLeft<=3?'#EF4444':'#10B981', minWidth:28, fontFamily:'Nunito,sans-serif' }}>{timeLeft}s</span>
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
  page:        { minHeight:'100vh', background:'#0B1120', display:'flex', flexDirection:'column' },
  header:      { background:'#1E293B', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #2D3A4F' },
  backBtn:     { background:'rgba(245,158,11,0.12)', color:'#F59E0B', border:'1px solid rgba(245,158,11,0.3)', padding:'8px 16px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  headerTitle: { fontSize:20, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' },
  scoreBadge:  { background:'rgba(245,158,11,0.15)', color:'#F59E0B', padding:'6px 14px', borderRadius:20, fontSize:14, fontWeight:700, border:'1px solid rgba(245,158,11,0.3)' },
  progressWrap:{ padding:'10px 24px', background:'#1E293B', borderBottom:'1px solid #2D3A4F', display:'flex', alignItems:'center', gap:10 },
  progressTrack:{ flex:1, height:10, background:'#2D3A4F', borderRadius:10, overflow:'hidden' },
  progressFill:{ height:'100%', background:'linear-gradient(90deg,#F59E0B,#EF4444)', borderRadius:10 },
  roundText:   { fontSize:13, fontWeight:700, color:'#F59E0B', whiteSpace:'nowrap', fontFamily:'Nunito,sans-serif' },
  gameArea:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', gap:18 },
  questionBox: { background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:28, padding:'24px 32px', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.3)', width:'100%', maxWidth:400 },
  questionLabel:{ fontSize:16, color:'#94A3B8', fontWeight:700, margin:'0 0 8px', fontFamily:'Nunito,sans-serif' },
  hintBox:     { background:'rgba(245,158,11,0.1)', color:'#F59E0B', borderRadius:14, padding:'10px 20px', fontSize:14, fontWeight:700, border:'1px solid rgba(245,158,11,0.3)', fontFamily:'Nunito,sans-serif' },
  feedbackBubble:{ padding:'12px 28px', borderRadius:16, fontSize:16, fontWeight:800, fontFamily:'Nunito,sans-serif' },
  stageArea:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px' },
  stageTitle:  { fontSize:24, fontWeight:900, color:'#F1F5F9', margin:'0 0 8px', fontFamily:'Nunito,sans-serif' },
  stageSub:    { fontSize:14, color:'#64748B', marginBottom:28, textAlign:'center', fontFamily:'Nunito,sans-serif' },
  stagesGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:16, width:'100%', maxWidth:700, marginBottom:28 },
  stageCard:   { borderRadius:20, padding:'20px 16px', textAlign:'center', cursor:'pointer', transition:'all 0.2s' },
  startBtn:    { color:'#fff', border:'none', padding:'16px 40px', borderRadius:18, fontSize:18, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  resultCard:  { background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:32, padding:'40px 36px', textAlign:'center', maxWidth:460, width:'90%', margin:'6vh auto', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' },
  resultTitle: { fontSize:32, fontWeight:900, color:'#F1F5F9', margin:'12px 0 8px', fontFamily:'Nunito,sans-serif' },
  resultScore: { fontSize:18, color:'#94A3B8', margin:'0 0 8px', fontFamily:'Nunito,sans-serif' },
  resultPct:   { fontSize:64, fontWeight:900, color:'#F59E0B', fontFamily:'Nunito,sans-serif' },
  starsRow:    { display:'flex', justifyContent:'center', gap:8, margin:'12px 0 16px' },
  unlockedBox: { background:'rgba(16,185,129,0.15)', color:'#6EE7B7', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'10px 20px', fontSize:14, fontWeight:800, marginBottom:16, fontFamily:'Nunito,sans-serif' },
  aiBox:       { background:'rgba(99,102,241,0.08)', borderRadius:14, padding:'14px 16px', marginBottom:20, border:'1px solid rgba(99,102,241,0.2)', textAlign:'left', width:'100%' },
  aiRow:       { display:'flex', alignItems:'center', gap:8, marginBottom:6, fontWeight:600, color:'#94A3B8', fontFamily:'Nunito,sans-serif' },
  aiText:      { fontSize:13, color:'#94A3B8', lineHeight:1.6, margin:0, fontWeight:600, fontFamily:'Nunito,sans-serif' },
  resultBtns:  { display:'flex', gap:12, justifyContent:'center' },
  playBtn:     { background:'linear-gradient(135deg,#F59E0B,#EF4444)', color:'#fff', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif', boxShadow:'0 4px 15px rgba(245,158,11,0.4)' },
  homeBtn:     { background:'rgba(30,41,59,0.8)', color:'#94A3B8', border:'1px solid #2D3A4F', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
};
