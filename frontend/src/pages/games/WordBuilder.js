import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore, getGameFeedback } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useStageProgress from '../../hooks/useStageProgress';

// Stage-based timers: more time for longer/harder words
const STAGES = [
  { name:'Stage 1', words:['CAT','DOG','SUN','HAT','BIG','RUN','FUN','BUS','CUP','ANT','BAT','LOG','MAN','PIG','HEN','FOX','OWL','BEE','NET','BOX'],                                                                                                                                             questions:5, passMark:70, answerTimer:30 },
  { name:'Stage 2', words:['BOOK','FROG','PLAY','STAR','FISH','CAKE','JUMP','TREE','BLUE','RAIN','BIRD','MILK','FARM','LAMP','ROAD','SHIP','KING','GOLD','NEST','HAND'],                                                                                                                          questions:5, passMark:70, answerTimer:25 },
  { name:'Stage 3', words:['HOUSE','PLANT','SMILE','CLOUD','BREAD','DRINK','LIGHT','CHAIR','FLOOR','TIGER','BRUSH','CLOCK','CRANE','DREAM','FLAME','GRACE','HEART','JUICE','LEMON','PRIDE'],                                                                                                     questions:5, passMark:70, answerTimer:35 },
  { name:'Stage 4', words:['SCHOOL','FRIEND','ORANGE','PLANET','BRIDGE','FLOWER','BUTTER','SIMPLE','CASTLE','GARDEN','MIRROR','PILLOW','ROCKET','SILVER','SPRING','SUNSET','TENNIS','VALLEY','WINDOW','YELLOW'],                                                                                 questions:5, passMark:70, answerTimer:40 },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

export default function WordBuilder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unlockedStages, unlockStage, loaded } = useStageProgress('words');

  const [stageIndex,   setStageIndex]   = useState(0);
  const [playing,      setPlaying]      = useState(false);
  const [word,         setWord]         = useState('');
  const [tiles,        setTiles]        = useState([]);
  const [placed,       setPlaced]       = useState([]);
  const [usedWords,    setUsedWords]    = useState([]);
  const [score,        setScore]        = useState(0);
  const [round,        setRound]        = useState(0);
  const [feedback,     setFeedback]     = useState(null);
  const [stageOver,    setStageOver]    = useState(false);
  const [wrongWords,   setWrongWords]   = useState({});
  const [wrongStreak,  setWrongStreak]  = useState(0);
  const [showHint,     setShowHint]     = useState(false);
  const [phase,        setPhase]        = useState('preview');
  const [countdown,    setCountdown]    = useState(2);
  const [answerTime,   setAnswerTime]   = useState(30);
  const [aiFeedback,   setAiFeedback]   = useState('');
  const [loadingAI,    setLoadingAI]    = useState(false);

  const timerRef   = useRef(null);
  const fbRef      = useRef(null);
  const startTime  = useRef(Date.now());
  const currentStage = STAGES[stageIndex];

  fbRef.current = feedback;

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const startAnswerTimer = (secs) => {
    clearTimer(); setAnswerTime(secs);
    timerRef.current = setInterval(() => {
      setAnswerTime(p => {
        if (p <= 1) { clearTimer(); if (!fbRef.current) handleCheck(true); return 0; }
        return p - 1;
      });
    }, 1000);
  };

  useEffect(() => { return () => clearTimer(); }, []);

  const pickWord = (used) => {
    const available = currentStage.words.filter(w => !used.includes(w));
    if (available.length === 0) return currentStage.words[Math.floor(Math.random()*currentStage.words.length)];
    return available[Math.floor(Math.random()*available.length)];
  };

  const buildTiles = (w) => {
    const correctTiles = w.split('').map((l, i) => ({ id:`c-${i}`, letter:l }));
    const alphabet     = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const decoys       = [];
    for (let i = 0; i < 4; i++) decoys.push({ id:`d-${i}`, letter:alphabet[Math.floor(Math.random()*alphabet.length)] });
    return shuffle([...correctTiles, ...decoys]);
  };

  const loadWord = (w) => {
    clearTimer();
    setWord(w); setTiles(buildTiles(w)); setPlaced([]);
    setFeedback(null); fbRef.current = null;
    setShowHint(false); setPhase('preview'); setCountdown(2);
  };

  const startStage = () => {
    const w = pickWord([]);
    setUsedWords([w]); loadWord(w);
    setScore(0); setRound(0); setWrongWords({}); setWrongStreak(0);
    setStageOver(false); setPlaying(true);
    startTime.current = Date.now();
  };

  // Preview countdown then hide word and start answer timer
  useEffect(() => {
    if (phase !== 'preview' || !playing) return;
    if (countdown <= 0) {
      setPhase('playing');
      startAnswerTimer(currentStage.answerTimer);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, phase, playing]);

  const handlePickTile = (tile) => {
    if (feedback || phase !== 'playing' || placed.length >= word.length) return;
    setTiles(prev => prev.filter(t => t.id !== tile.id));
    setPlaced(prev => [...prev, tile]);
  };

  const handleRemovePlaced = (tile) => {
    if (feedback || phase !== 'playing') return;
    setPlaced(prev => prev.filter(t => t.id !== tile.id));
    setTiles(prev => shuffle([...prev, tile]));
  };

  const handleCheck = (timedOut = false) => {
    if (fbRef.current) return;
    clearTimer();
    if (!timedOut) {
      if (placed.length !== word.length) return;
    }
    const answer  = placed.map(t => t.letter).join('');
    const correct = !timedOut && answer === word;

    if (correct) { setFeedback('correct'); setScore(s => s + 1); setWrongStreak(0); }
    else {
      setFeedback(timedOut ? 'timeout' : 'wrong');
      setWrongStreak(s => s + 1);
      if (wrongStreak >= 1) setShowHint(true);
      if (!timedOut) setWrongWords(prev => ({ ...prev, [word]: (prev[word]||0)+1 }));
    }

    setTimeout(() => {
      setRound(prevRound => {
        const nextRound = prevRound + 1;
        if (nextRound >= currentStage.questions) { setStageOver(true); return nextRound; }
        setUsedWords(prevUsed => {
          const newW = pickWord(prevUsed);
          loadWord(newW);
          return [...prevUsed, newW];
        });
        return nextRound;
      });
    }, 1600);
  };

  const handleClear = () => {
    if (feedback || phase !== 'playing') return;
    setTiles(prev => shuffle([...prev, ...placed])); setPlaced([]);
  };

  const handleStageComplete = async () => {
    const pct    = Math.round((score/currentStage.questions)*100);
    const passed = pct >= currentStage.passMark;
    submitScore({ game_id:'words', score, max_score:currentStage.questions, time_taken:Math.floor((Date.now()-startTime.current)/1000), difficulty_level:stageIndex+1, ai_data:{wrong_words:wrongWords} }).catch(()=>{});
    if (passed && stageIndex+1 < STAGES.length) unlockStage(stageIndex+1);
    setLoadingAI(true);
    try {
      const res = await getGameFeedback({ game_id:'words', score, max_score:currentStage.questions, percentage:pct, age_group:user?.profile?.age_group||'6-9', ai_data:{wrong_words:wrongWords} });
      setAiFeedback(res.data.feedback);
    } catch { setAiFeedback(pct>=70?'Word Master! Stage passed! 📝🌟':'Keep building words! 💪'); }
    finally { setLoadingAI(false); }
  };

  useEffect(() => { if (stageOver) handleStageComplete(); }, [stageOver]);

  if (!loaded) return <div style={S.loadScreen}>Loading... ✨</div>;

  if (!playing) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => navigate('/student/dashboard')}>← Back</motion.button>
          <div style={S.headerTitle}>📝 Word Builder</div>
          <div style={{ width:80 }} />
        </div>
        <div style={S.stageArea}>
          <h2 style={S.stageTitle}>Choose Your Stage</h2>
          <p style={S.stageSub}>Word shown 2 seconds then hidden! Pick letter tiles to build the word before time runs out! Your progress is saved! ✨</p>
          <div style={S.stagesGrid}>
            {STAGES.map((s, i) => {
              const unlocked = unlockedStages.includes(i);
              return (
                <motion.div key={i} style={{ ...S.stageCard, opacity:unlocked?1:0.5, border:stageIndex===i?'2px solid #F97316':'1px solid #2D3A4F', background:unlocked?'rgba(249,115,22,0.1)':'#1E293B' }}
                  whileHover={unlocked?{scale:1.05}:{}} whileTap={unlocked?{scale:0.95}:{}}
                  onClick={() => { if (unlocked) { setStageIndex(i); setStageOver(false); } }}>
                  <div style={{ fontSize:32 }}>{unlocked?'📝':'🔒'}</div>
                  <div style={{ fontSize:15, fontWeight:800, color:unlocked?'#F97316':'#4B5563', fontFamily:'Nunito,sans-serif' }}>{s.name}</div>
                  <div style={{ fontSize:11, color:'#EF4444', fontWeight:700 }}>⏱️ {s.answerTimer}s to answer</div>
                  <div style={{ fontSize:11, color:'#64748B', fontFamily:'Nunito,sans-serif' }}>e.g. {s.words.slice(0,3).join(', ')}</div>
                  {unlocked&&<div style={{ fontSize:11, color:'#10B981', fontWeight:700, marginTop:4 }}>✅ Unlocked</div>}
                </motion.div>
              );
            })}
          </div>
          <motion.button style={{ ...S.startBtn, background:'linear-gradient(135deg,#F97316,#7C3AED)' }} whileHover={{ scale:1.05 }} onClick={startStage}>
            Start {STAGES[stageIndex].name} 🚀
          </motion.button>
        </div>
      </div>
    );
  }

  if (stageOver) {
    const pct    = Math.round((score/currentStage.questions)*100);
    const passed = pct >= currentStage.passMark;
    return (
      <div style={S.page}>
        <motion.div style={S.resultCard} initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:'spring',bounce:0.4 }}>
          <div style={{ fontSize:80 }}>{passed?'🏆':'💪'}</div>
          <h1 style={S.resultTitle}>{passed?'Stage Passed! 🎉':'Try Again!'}</h1>
          <p style={S.resultScore}>{score}/{currentStage.questions} correct — {pct}%</p>
          <div style={S.resultPct}>{pct}%</div>
          <div style={S.starsRow}>{[1,2,3].map(n=><span key={n} style={{ fontSize:36,opacity:pct>=n*30?1:0.25 }}>⭐</span>)}</div>
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

  const timerPct  = (answerTime / currentStage.answerTimer) * 100;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => { clearTimer(); setPlaying(false); setStageOver(false); }}>← Stages</motion.button>
        <div style={S.headerTitle}>📝 {currentStage.name}</div>
        <div style={S.scoreBadge}>⭐ {score}/{currentStage.questions}</div>
      </div>
      <div style={S.progressWrap}>
        <div style={S.progressTrack}><motion.div style={S.progressFill} animate={{ width:`${(round/currentStage.questions)*100}%` }} transition={{ duration:0.4 }} /></div>
        <span style={S.roundText}>Q{round+1}/{currentStage.questions}</span>
      </div>
      <div style={S.gameArea}>
        <AnimatePresence>
          {phase === 'preview' && (
            <motion.div style={S.wordFlash} initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.8,opacity:0 }}>
              <div style={{ fontSize:13, color:'#64748B', fontWeight:700, marginBottom:12, fontFamily:'Nunito,sans-serif' }}>Memorise this word!</div>
              <div style={{ fontSize:56, fontWeight:900, color:'#F97316', letterSpacing:8, fontFamily:'Nunito,sans-serif' }}>{word}</div>
              <div style={{ marginTop:14 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'#F97316', color:'#fff', fontSize:24, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>{countdown}</div>
                <div style={{ fontSize:12, color:'#9CA3AF', marginTop:6 }}>seconds remaining</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'playing' && (
          <>
            {/* Answer timer bar */}
            {!feedback && (
              <div style={{ width:'100%', maxWidth:440 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <div style={{ flex:1, height:10, background:'#2D3A4F', borderRadius:10, overflow:'hidden' }}>
                    <motion.div style={{ height:'100%', borderRadius:10, background:timerPct>50?'#10B981':timerPct>25?'#F59E0B':'#EF4444' }}
                      animate={{ width:`${timerPct}%` }} transition={{ duration:0.8 }} />
                  </div>
                  <span style={{ fontSize:14, fontWeight:900, color:answerTime<=5?'#EF4444':'#94A3B8', minWidth:30, fontFamily:'Nunito,sans-serif' }}>{answerTime}s</span>
                </div>
              </div>
            )}

            <div style={{ fontSize:14, color:'#64748B', fontWeight:600, fontFamily:'Nunito,sans-serif' }}>Build the word using the letter tiles!</div>

            {showHint && (
              <motion.div style={S.hintBox} initial={{ opacity:0 }} animate={{ opacity:1 }}>
                🤖 Hint: The word is <strong>{word}</strong> ({word.length} letters)
              </motion.div>
            )}

            {/* Answer slots */}
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
              {Array.from({ length:word.length }).map((_, i) => (
                <motion.div key={i}
                  style={{ width:52, height:60, borderRadius:12, border:'2.5px dashed', borderColor:placed[i]?'#F97316':'#2D3A4F', background:placed[i]?'rgba(249,115,22,0.12)':'#1E293B', display:'flex', alignItems:'center', justifyContent:'center', cursor:placed[i]?'pointer':'default' }}
                  whileHover={placed[i]?{scale:1.05}:{}} onClick={() => placed[i]&&handleRemovePlaced(placed[i])}>
                  {placed[i]&&<motion.span initial={{ scale:0 }} animate={{ scale:1 }} style={{ fontSize:24, fontWeight:900, color:'#F97316' }}>{placed[i].letter}</motion.span>}
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {feedback && (
                <motion.div style={{ ...S.feedbackBubble, background:feedback==='correct'?'#D1FAE5':feedback==='timeout'?'#FEF3C7':'#FEE2E2', color:feedback==='correct'?'#065F46':feedback==='timeout'?'#92400E':'#991B1B' }}
                  initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}>
                  {feedback==='correct'?`✅ Correct! "${word}"!`:feedback==='timeout'?`⏰ Time up! Word was "${word}"!`:`❌ The word was "${word}"`}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Letter tiles */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', maxWidth:420 }}>
              {tiles.map(tile => (
                <motion.button key={tile.id}
                  style={{ width:52, height:60, borderRadius:12, background:'#7C3AED', color:'#fff', border:'none', fontSize:22, fontWeight:900, cursor:'pointer', boxShadow:'0 4px 12px rgba(124,58,237,0.3)', fontFamily:'Nunito,sans-serif' }}
                  whileHover={{ scale:1.1, y:-4 }} whileTap={{ scale:0.9 }}
                  onClick={() => handlePickTile(tile)} disabled={!!feedback}>
                  {tile.letter}
                </motion.button>
              ))}
            </div>

            <div style={{ display:'flex', gap:12 }}>
              <motion.button style={{ ...S.checkBtn, opacity:placed.length===word.length&&!feedback?1:0.4 }}
                whileHover={placed.length===word.length?{scale:1.05}:{}} onClick={() => handleCheck(false)} disabled={placed.length!==word.length||!!feedback}>
                Check Word ✅
              </motion.button>
              <motion.button style={S.clearBtn} whileHover={{ scale:1.05 }} onClick={handleClear} disabled={!!feedback}>Clear 🔄</motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const S = {
  loadScreen:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0B1120', fontSize:18, color:'#94A3B8', fontFamily:'Nunito,sans-serif' },
  page:        { minHeight:'100vh', background:'#0B1120', display:'flex', flexDirection:'column' },
  header:      { background:'#1E293B', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #2D3A4F' },
  backBtn:     { background:'rgba(249,115,22,0.12)', color:'#F97316', border:'1px solid rgba(249,115,22,0.3)', padding:'8px 16px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  headerTitle: { fontSize:20, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' },
  scoreBadge:  { background:'rgba(245,158,11,0.15)', color:'#F59E0B', padding:'6px 14px', borderRadius:20, fontSize:14, fontWeight:700, border:'1px solid rgba(245,158,11,0.3)' },
  progressWrap:{ padding:'10px 24px', background:'#1E293B', borderBottom:'1px solid #2D3A4F', display:'flex', alignItems:'center', gap:10 },
  progressTrack:{ flex:1, height:10, background:'#2D3A4F', borderRadius:10, overflow:'hidden' },
  progressFill:{ height:'100%', background:'linear-gradient(90deg,#F97316,#EC4899)', borderRadius:10 },
  roundText:   { fontSize:13, fontWeight:700, color:'#F97316', whiteSpace:'nowrap', fontFamily:'Nunito,sans-serif' },
  gameArea:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', gap:14 },
  wordFlash:   { background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:24, padding:'32px 48px', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' },
  hintBox:     { background:'rgba(249,115,22,0.1)', color:'#F97316', borderRadius:14, padding:'10px 20px', fontSize:14, fontWeight:700, border:'1px solid rgba(249,115,22,0.3)', fontFamily:'Nunito,sans-serif' },
  feedbackBubble:{ padding:'12px 24px', borderRadius:16, fontSize:15, fontWeight:800, fontFamily:'Nunito,sans-serif' },
  checkBtn:    { background:'#7C3AED', color:'#fff', border:'none', padding:'13px 24px', borderRadius:14, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  clearBtn:    { background:'rgba(30,41,59,0.8)', color:'#94A3B8', border:'1px solid #2D3A4F', padding:'13px 20px', borderRadius:14, fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  stageArea:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px' },
  stageTitle:  { fontSize:24, fontWeight:900, color:'#F1F5F9', margin:'0 0 8px', fontFamily:'Nunito,sans-serif' },
  stageSub:    { fontSize:14, color:'#64748B', marginBottom:28, textAlign:'center', maxWidth:460, fontFamily:'Nunito,sans-serif' },
  stagesGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:16, width:'100%', maxWidth:700, marginBottom:28 },
  stageCard:   { borderRadius:20, padding:'20px 16px', textAlign:'center', cursor:'pointer', transition:'all 0.2s' },
  startBtn:    { color:'#fff', border:'none', padding:'16px 40px', borderRadius:18, fontSize:18, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  resultCard:  { background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:32, padding:'40px 36px', textAlign:'center', maxWidth:460, width:'90%', margin:'6vh auto', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' },
  resultTitle: { fontSize:32, fontWeight:900, color:'#F1F5F9', margin:'12px 0 8px', fontFamily:'Nunito,sans-serif' },
  resultScore: { fontSize:18, color:'#94A3B8', margin:'0 0 8px', fontFamily:'Nunito,sans-serif' },
  resultPct:   { fontSize:64, fontWeight:900, color:'#F97316', fontFamily:'Nunito,sans-serif' },
  starsRow:    { display:'flex', justifyContent:'center', gap:8, margin:'12px 0 16px' },
  unlockedBox: { background:'rgba(16,185,129,0.15)', color:'#6EE7B7', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'10px 20px', fontSize:14, fontWeight:800, marginBottom:16, fontFamily:'Nunito,sans-serif' },
  aiBox:       { background:'rgba(99,102,241,0.08)', borderRadius:14, padding:'14px 16px', marginBottom:20, border:'1px solid rgba(99,102,241,0.2)', textAlign:'left', width:'100%' },
  aiRow:       { display:'flex', alignItems:'center', gap:8, marginBottom:6, fontWeight:600, color:'#94A3B8', fontFamily:'Nunito,sans-serif' },
  aiText:      { fontSize:13, color:'#94A3B8', lineHeight:1.6, margin:0, fontWeight:600, fontFamily:'Nunito,sans-serif' },
  resultBtns:  { display:'flex', gap:12, justifyContent:'center' },
  playBtn:     { background:'linear-gradient(135deg,#F97316,#7C3AED)', color:'#fff', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif', boxShadow:'0 4px 15px rgba(249,115,22,0.4)' },
  homeBtn:     { background:'rgba(30,41,59,0.8)', color:'#94A3B8', border:'1px solid #2D3A4F', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
};
