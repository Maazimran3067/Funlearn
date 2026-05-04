import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore, getGameFeedback } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useStageProgress from '../../hooks/useStageProgress';

// FIXED stages: 1 move = 1 card flip (not 1 pair attempt)
// Move limits set so game is challenging but fair
const STAGES = [
  { name:'Stage 1', pairs:4,  cols:4, timeLimitSecs:90,  moveLimitMoves:16, revealMs:800,  emoji:['🐱','🐶','🐸','🐘'],                              passMark:100 },
  { name:'Stage 2', pairs:6,  cols:4, timeLimitSecs:100, moveLimitMoves:22, revealMs:700,  emoji:['🍎','🍊','🍋','🍇','🍓','🍑'],                    passMark:100 },
  { name:'Stage 3', pairs:8,  cols:4, timeLimitSecs:110, moveLimitMoves:30, revealMs:500,  emoji:['🚀','🌍','⭐','🌙','☀️','🌈','❄️','⚡'],           passMark:100 },
  { name:'Stage 4', pairs:10, cols:5, timeLimitSecs:120, moveLimitMoves:38, revealMs:400,  emoji:['➕','➖','✖️','➗','🔢','📐','📏','🔣','🎯','🎲'], passMark:100 },
];

function buildDeck(stage) {
  const emojis = stage.emoji.slice(0, stage.pairs);
  const deck   = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
  return deck.map((emoji, id) => ({ id, emoji, flipped:false, matched:false }));
}

export default function MemoryFlip() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unlockedStages, unlockStage, loaded } = useStageProgress('memory');

  const [stageIndex,  setStageIndex]  = useState(0);
  const [playing,     setPlaying]     = useState(false);
  const [cards,       setCards]       = useState([]);
  const [firstCard,   setFirstCard]   = useState(null);
  const [moves,       setMoves]       = useState(0);
  const [matches,     setMatches]     = useState(0);
  const [locked,      setLocked]      = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(90);
  const [phase,       setPhase]       = useState('preview');
  const [wonByMatch,  setWonByMatch]  = useState(false);
  const [stageOver,   setStageOver]   = useState(false);
  const [aiFeedback,  setAiFeedback]  = useState('');
  const [loadingAI,   setLoadingAI]   = useState(false);

  const timerRef   = useRef(null);
  const movesRef   = useRef(0);   // ref to avoid stale closure in move limit check
  const matchesRef = useRef(0);
  const startTime  = useRef(Date.now());
  const currentStage = STAGES[stageIndex];
  const totalPairs   = currentStage.pairs;

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const startTimer = (secs) => {
    clearTimer(); setTimeLeft(secs);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearTimer(); setPhase('over'); setStageOver(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const startStage = () => {
    const deck = buildDeck(currentStage);
    setCards(deck.map(c => ({ ...c, flipped:true })));
    setFirstCard(null);
    movesRef.current = 0; matchesRef.current = 0;
    setMoves(0); setMatches(0);
    setLocked(true); setPhase('preview'); setWonByMatch(false); setStageOver(false);
    setPlaying(true); startTime.current = Date.now();
    setTimeout(() => {
      setCards(deck.map(c => ({ ...c, flipped:false })));
      setLocked(false); setPhase('playing');
      startTimer(currentStage.timeLimitSecs);
    }, currentStage.revealMs);
  };

  useEffect(() => { return () => clearTimer(); }, []);

  const handleCardClick = (card) => {
    if (locked || phase !== 'playing') return;
    if (card.flipped || card.matched) return;
    if (firstCard && card.id === firstCard.id) return;

    // FIXED: every single card flip = 1 move
    movesRef.current += 1;
    setMoves(movesRef.current);

    // Check move limit immediately on every flip
    if (movesRef.current >= currentStage.moveLimitMoves) {
      // Flip this card to show it, then end after brief delay
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, flipped:true } : c));
      clearTimer();
      setTimeout(() => { setPhase('over'); setStageOver(true); }, 800);
      return;
    }

    setCards(prev => prev.map(c => c.id === card.id ? { ...c, flipped:true } : c));

    if (!firstCard) {
      setFirstCard(card);
    } else {
      setLocked(true);
      const second = card;

      if (firstCard.emoji === second.emoji) {
        // Match
        setTimeout(() => {
          setCards(prev => prev.map(c => c.emoji === firstCard.emoji ? { ...c, matched:true } : c));
          matchesRef.current += 1;
          setMatches(matchesRef.current);
          setFirstCard(null);
          setLocked(false);
          if (matchesRef.current === totalPairs) {
            clearTimer(); setWonByMatch(true); setPhase('over'); setStageOver(true);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            (c.id === firstCard.id || c.id === second.id) && !c.matched
              ? { ...c, flipped:false } : c
          ));
          setFirstCard(null);
          setLocked(false);
        }, 900);
      }
    }
  };

  const handleStageComplete = async () => {
    const pct    = wonByMatch ? 100 : Math.round((matchesRef.current / totalPairs) * 100);
    const passed = wonByMatch;
    submitScore({ game_id:'memory', score:matchesRef.current, max_score:totalPairs, time_taken:Math.floor((Date.now()-startTime.current)/1000), difficulty_level:stageIndex+1, ai_data:{moves_taken:movesRef.current,pairs_matched:matchesRef.current} }).catch(()=>{});
    if (passed && stageIndex+1 < STAGES.length) unlockStage(stageIndex+1);
    setLoadingAI(true);
    try {
      const res = await getGameFeedback({ game_id:'memory', score:matchesRef.current, max_score:totalPairs, percentage:pct, age_group:user?.profile?.age_group||'9-12', ai_data:{moves_taken:movesRef.current} });
      setAiFeedback(res.data.feedback);
    } catch { setAiFeedback(passed?'Amazing memory! Stage cleared! 🃏🌟':'Good try! Keep practising! 💪'); }
    finally { setLoadingAI(false); }
  };

  useEffect(() => { if (stageOver) handleStageComplete(); }, [stageOver]);

  const movesLeft = currentStage.moveLimitMoves - moves;
  const timeMin   = Math.floor(timeLeft/60);
  const timeSec   = timeLeft%60;

  if (!loaded) return <div style={S.loadScreen}>Loading... ✨</div>;

  if (!playing) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => navigate('/student/dashboard')}>← Back</motion.button>
          <div style={S.headerTitle}>🃏 Memory Flip</div>
          <div style={{ width:80 }} />
        </div>
        <div style={S.stageArea}>
          <h2 style={S.stageTitle}>Choose Your Stage</h2>
          <p style={S.stageSub}>Cards shown briefly then hidden! Each card flip = 1 move. Match all pairs to pass! ✨</p>
          <div style={S.stagesGrid}>
            {STAGES.map((s, i) => {
              const unlocked = unlockedStages.includes(i);
              return (
                <motion.div key={i} style={{ ...S.stageCard, opacity:unlocked?1:0.5, border:stageIndex===i?'3px solid #7C3AED':'3px solid transparent', background:unlocked?'#EDE9FE':'#F3F4F6' }}
                  whileHover={unlocked?{scale:1.05}:{}} whileTap={unlocked?{scale:0.95}:{}}
                  onClick={() => { if (unlocked) { setStageIndex(i); setStageOver(false); } }}>
                  <div style={{ fontSize:28 }}>{unlocked?'🃏':'🔒'}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:unlocked?'#5B21B6':'#9CA3AF' }}>{s.name}</div>
                  <div style={{ fontSize:11, color:'#6B7280' }}>{s.pairs} pairs • {s.moveLimitMoves} flips max</div>
                  <div style={{ fontSize:11, color:'#EF4444', fontWeight:700 }}>⏱️ {s.timeLimitSecs}s</div>
                  {unlocked&&<div style={{ fontSize:11, color:'#10B981', fontWeight:700, marginTop:4 }}>✅ Unlocked</div>}
                </motion.div>
              );
            })}
          </div>
          <motion.button style={{ ...S.startBtn, background:'linear-gradient(135deg,#7C3AED,#06B6D4)' }} whileHover={{ scale:1.05 }} onClick={startStage}>
            Start {STAGES[stageIndex].name} 🚀
          </motion.button>
        </div>
      </div>
    );
  }

  if (phase === 'over' || stageOver) {
    const pct    = wonByMatch ? 100 : Math.round((matchesRef.current/totalPairs)*100);
    const passed = wonByMatch;
    return (
      <div style={S.page}>
        <motion.div style={S.resultCard} initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:'spring',bounce:0.4 }}>
          <div style={{ fontSize:80 }}>{passed?'🏆':timeLeft===0?'⏰':'💪'}</div>
          <h1 style={S.resultTitle}>{passed?'All Pairs Matched! 🎉':timeLeft===0?'Time Up!':'Flips Used Up!'}</h1>
          <p style={S.resultScore}>{matchesRef.current}/{totalPairs} pairs matched in {movesRef.current} flips</p>
          <div style={S.resultPct}>{pct}%</div>
          <div style={S.starsRow}>{[1,2,3].map(n=><span key={n} style={{ fontSize:36,opacity:pct>=n*34?1:0.25 }}>⭐</span>)}</div>
          {passed&&stageIndex+1<STAGES.length&&<div style={S.unlockedBox}>🎉 {STAGES[stageIndex+1].name} Unlocked Forever!</div>}
          <div style={S.aiBox}>
            {loadingAI?<div style={S.aiRow}><span>🤖</span><span>AI analyzing...</span></div>
              :<><div style={S.aiRow}><span>🤖</span><strong style={{ color:'#1E40AF' }}>AI Tutor Feedback</strong></div><p style={S.aiText}>{aiFeedback}</p></>}
          </div>
          <div style={S.resultBtns}>
            <motion.button style={S.playBtn} whileHover={{ scale:1.05 }} onClick={() => { setPlaying(false); setStageOver(false); setPhase('preview'); }}>{passed?'Next Stage 🚀':'Try Again 🔄'}</motion.button>
            <motion.button style={S.homeBtn} whileHover={{ scale:1.05 }} onClick={() => navigate('/student/dashboard')}>Home 🏠</motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => { clearTimer(); setPlaying(false); setStageOver(false); setPhase('preview'); }}>← Stages</motion.button>
        <div style={S.headerTitle}>🃏 {currentStage.name}</div>
        <div style={S.scoreBadge}>🎯 {matchesRef.current}/{totalPairs}</div>
      </div>
      <div style={S.progressWrap}>
        <div style={{ padding:'4px 12px', borderRadius:20, fontSize:13, fontWeight:700, background:movesLeft<=5?'#FEE2E2':movesLeft<=12?'#FEF3C7':'#EDE9FE', color:movesLeft<=5?'#991B1B':movesLeft<=12?'#92400E':'#5B21B6' }}>
          🃏 {movesLeft} flips left
        </div>
        <div style={{ padding:'4px 12px', borderRadius:20, fontSize:13, fontWeight:700, background:timeLeft>30?'#D1FAE5':timeLeft>10?'#FEF3C7':'#FEE2E2', color:timeLeft>30?'#065F46':timeLeft>10?'#92400E':'#991B1B' }}>
          ⏱️ {timeMin}:{timeSec.toString().padStart(2,'0')}
        </div>
        <div style={{ fontSize:13, color:'#6B7280', fontWeight:600, marginLeft:'auto' }}>{matchesRef.current}/{totalPairs} pairs</div>
      </div>
      {phase === 'preview' && (
        <div style={{ background:'#FEF3C7', padding:'10px', textAlign:'center', fontSize:15, fontWeight:700, color:'#92400E' }}>
          👀 Memorise the cards! Hiding soon...
        </div>
      )}
      <div style={S.gameArea}>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${currentStage.cols},1fr)`, gap:10, width:'100%', maxWidth:520 }}>
          {cards.map(card => (
            <motion.div key={card.id}
              style={{ ...S.card, background:card.matched?'#D1FAE5':(card.flipped||phase==='preview')?'#7C3AED':'#EDE9FE', cursor:card.matched||card.flipped||locked||phase!=='playing'?'default':'pointer', boxShadow:card.flipped&&!card.matched?'0 4px 16px rgba(124,58,237,0.4)':'none' }}
              whileHover={!card.flipped&&!card.matched&&!locked&&phase==='playing'?{scale:1.06}:{}}
              whileTap={!card.flipped&&!card.matched&&!locked&&phase==='playing'?{scale:0.94}:{}}
              onClick={() => handleCardClick(card)}>
              {(card.flipped||card.matched||phase==='preview') ? (
                <motion.span style={{ fontSize:currentStage.pairs<=6?32:currentStage.pairs<=8?26:22 }} initial={{ rotateY:90 }} animate={{ rotateY:0 }} transition={{ duration:0.18 }}>
                  {card.emoji}
                </motion.span>
              ) : (
                <span style={{ fontSize:20, color:'#A78BFA' }}>?</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  loadScreen:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F3FF', fontSize:18 },
  page:        { minHeight:'100vh', background:'#F5F3FF', display:'flex', flexDirection:'column' },
  header:      { background:'#fff', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 12px rgba(124,58,237,0.08)' },
  backBtn:     { background:'#EDE9FE', color:'#7C3AED', border:'none', padding:'8px 16px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  headerTitle: { fontSize:20, fontWeight:900, color:'#1F1F2E' },
  scoreBadge:  { background:'#EDE9FE', color:'#7C3AED', padding:'6px 14px', borderRadius:20, fontSize:14, fontWeight:700 },
  progressWrap:{ padding:'10px 24px', background:'#fff', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' },
  gameArea:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'16px', gap:16 },
  card:        { aspectRatio:'1', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s', minHeight:56 },
  stageArea:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px' },
  stageTitle:  { fontSize:24, fontWeight:900, color:'#1F1F2E', margin:'0 0 8px' },
  stageSub:    { fontSize:14, color:'#6B7280', marginBottom:28, textAlign:'center', maxWidth:480 },
  stagesGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:16, width:'100%', maxWidth:800, marginBottom:28 },
  stageCard:   { borderRadius:20, padding:'20px 16px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' },
  startBtn:    { color:'#fff', border:'none', padding:'16px 40px', borderRadius:18, fontSize:18, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  resultCard:  { background:'#fff', borderRadius:32, padding:'40px 36px', textAlign:'center', maxWidth:460, width:'90%', margin:'6vh auto', boxShadow:'0 20px 60px rgba(124,58,237,0.15)' },
  resultTitle: { fontSize:30, fontWeight:900, color:'#1F1F2E', margin:'12px 0 8px' },
  resultScore: { fontSize:16, color:'#6B7280', margin:'0 0 8px' },
  resultPct:   { fontSize:64, fontWeight:900, color:'#7C3AED' },
  starsRow:    { display:'flex', justifyContent:'center', gap:8, margin:'12px 0 16px' },
  unlockedBox: { background:'#D1FAE5', color:'#065F46', borderRadius:12, padding:'10px 20px', fontSize:14, fontWeight:800, marginBottom:16 },
  aiBox:       { background:'#EFF6FF', borderRadius:14, padding:'14px 16px', marginBottom:20, border:'2px solid #BFDBFE', textAlign:'left', width:'100%' },
  aiRow:       { display:'flex', alignItems:'center', gap:8, marginBottom:6, fontWeight:600 },
  aiText:      { fontSize:13, color:'#1E40AF', lineHeight:1.6, margin:0, fontWeight:600 },
  resultBtns:  { display:'flex', gap:12, justifyContent:'center' },
  playBtn:     { background:'linear-gradient(135deg,#7C3AED,#06B6D4)', color:'#fff', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  homeBtn:     { background:'#F3F4F6', color:'#4B5563', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
};
