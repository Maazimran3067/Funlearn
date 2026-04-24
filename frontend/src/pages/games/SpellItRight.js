import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore, getGameFeedback } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useStageProgress from '../../hooks/useStageProgress';

const STAGES = [
  {
    name:'Stage 1',
    words:['bridge','planet','flower','castle','garden','mirror','window','simple','valley','butter','finger','silent','temple','travel','tunnel','rocket','purple','rabbit','market','silver'],
    questions:5, passMark:70, showSeconds:2, answerTimer:20, mode:'fill_blanks',
  },
  {
    name:'Stage 2',
    words:['abandon','account','achieve','airline','airport','already','ancient','arrange','balance','bedroom','bicycle','biology','cabinet','captain','certain','chapter','chicken','century','charity','citizen'],
    questions:5, passMark:70, showSeconds:2, answerTimer:20, mode:'fill_blanks',
  },
  {
    name:'Stage 3',
    words:['beautiful','education','adventure','knowledge','different','important','necessary','chocolate','celebrate','community','condition','confident','continue','daughter','discover','document','elephant','excellent','exercise','favorite'],
    questions:5, passMark:70, showSeconds:2, answerTimer:25, mode:'type_from_memory',
  },
  {
    name:'Stage 4',
    words:['accomplish','achievement','approximately','atmosphere','bibliography','catastrophe','circumstances','concentration','congratulations','consciousness','consequences','contemporary','contradictory','cooperation','correspondence','determination','disappointment','encyclopedia','environment','exaggeration'],
    questions:5, passMark:70, showSeconds:1, answerTimer:30, mode:'type_from_memory',
  },
  {
    name:'Stage 5',
    words:['accommodations','acknowledgement','administratively','characteristically','comprehensively','congratulations','correspondingly','differentiation','entrepreneurship','extraordinarily','familiarization','generalization','hypothetically','identification','implementation','infrastructure','internationalize','misinterpretation','multiplication','nationalization'],
    questions:5, passMark:70, showSeconds:1, answerTimer:30, mode:'type_from_memory',
  },
];

const BTN_COLORS = ['#7C3AED','#EC4899','#F59E0B','#10B981','#EF4444','#3B82F6'];

function buildFillBlanks(word) {
  const letters   = word.toUpperCase().split('');
  const numBlanks = Math.max(2, Math.floor(letters.length * 0.45));
  const blankIdxs = [];
  let attempts    = 0;
  while (blankIdxs.length < numBlanks && attempts < 100) {
    attempts++;
    const idx = Math.floor(Math.random() * letters.length);
    if (!blankIdxs.includes(idx)) blankIdxs.push(idx);
  }
  blankIdxs.sort((a, b) => a - b);
  const masked         = letters.map((l, i) => blankIdxs.includes(i) ? '_' : l);
  const correctLetters = blankIdxs.map(i => letters[i]);
  const decoys         = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    .filter(l => !correctLetters.includes(l))
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  const options = [...new Set([...correctLetters, ...decoys])]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(10, correctLetters.length + 4));
  return { masked, blankIdxs, correctLetters, options };
}

export default function SpellItRight() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unlockedStages, unlockStage, loaded } = useStageProgress('spelling');

  const [stageIndex,   setStageIndex]   = useState(0);
  const [playing,      setPlaying]      = useState(false);
  const [word,         setWord]         = useState('');
  const [typed,         setTyped]        = useState('');
  const [showWord,     setShowWord]     = useState(true);
  const [countdown,    setCountdown]    = useState(2);
  const [answerTime,   setAnswerTime]   = useState(20); 
  const [usedWords,    setUsedWords]    = useState([]);
  const [score,        setScore]        = useState(0);
  const [round,        setRound]        = useState(0);
  const [feedback,     setFeedback]     = useState(null);
  const [stageOver,    setStageOver]    = useState(false);
  const [wrongWords,   setWrongWords]   = useState({});
  const [wrongStreak,  setWrongStreak]  = useState(0);
  const [showHint,     setShowHint]     = useState(false);
  const [fillData,     setFillData]     = useState(null);
  const [userFill,     setUserFill]     = useState([]);
  const [aiFeedback,   setAiFeedback]   = useState('');
  const [loadingAI,    setLoadingAI]    = useState(false);

  const inputRef      = useRef(null);
  const answerTimerRef = useRef(null);
  const fbRef          = useRef(null);
  const startTime     = useRef(Date.now());
  const currentStage  = STAGES[stageIndex];

  fbRef.current = feedback;

  const clearAnswerTimer = () => {
    if (answerTimerRef.current) { clearInterval(answerTimerRef.current); answerTimerRef.current = null; }
  };

  const startAnswerTimer = (secs) => {
    clearAnswerTimer();
    setAnswerTime(secs);
    answerTimerRef.current = setInterval(() => {
      setAnswerTime(p => {
        if (p <= 1) {
          clearAnswerTimer();
          if (!fbRef.current) processResult(false, true); 
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };

  useEffect(() => { return () => clearAnswerTimer(); }, []);

  const pickWord = (used) => {
    const available = currentStage.words.filter(w => !used.includes(w));
    if (available.length === 0) return currentStage.words[Math.floor(Math.random() * currentStage.words.length)];
    return available[Math.floor(Math.random() * available.length)];
  };

  const loadWord = (w) => {
    clearAnswerTimer();
    setWord(w); setTyped(''); setFeedback(null); fbRef.current = null;
    setShowHint(false); setShowWord(true); setCountdown(currentStage.showSeconds);
    setUserFill([]);
    if (currentStage.mode === 'fill_blanks') setFillData(buildFillBlanks(w));
    else setFillData(null);
  };

  const startStage = () => {
    const w = pickWord([]);
    setUsedWords([w]); loadWord(w);
    setScore(0); setRound(0); setWrongWords({}); setWrongStreak(0);
    setStageOver(false); setPlaying(true);
    startTime.current = Date.now();
  };

  useEffect(() => {
    if (!showWord || !playing) return;
    if (countdown <= 0) {
      setShowWord(false);
      startAnswerTimer(currentStage.answerTimer);
      if (currentStage.mode === 'type_from_memory') setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, showWord, playing]);

  const processResult = (correct, timedOut = false) => {
    if (fbRef.current) return;
    clearAnswerTimer();
    if (correct) {
      setFeedback('correct'); setScore(s => s + 1); setWrongStreak(0);
    } else {
      setFeedback(timedOut ? 'timeout' : 'wrong'); setWrongStreak(s => s + 1);
      if (wrongStreak >= 1) setShowHint(true);
      if (!timedOut) setWrongWords(prev => ({ ...prev, [word]: (prev[word] || 0) + 1 }));
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

  const checkTyped = (answer) => {
    if (feedback) return;
    processResult(answer.toLowerCase().trim() === word.toLowerCase());
  };

  const checkFill = () => {
    if (feedback || !fillData) return;
    processResult(userFill.join('') === fillData.correctLetters.join(''));
  };

  const handlePickLetter = (letter) => {
    if (feedback || !fillData || userFill.length >= fillData.blankIdxs.length) return;
    setUserFill(prev => [...prev, letter]);
  };

  const handleClearFill = () => setUserFill([]);

  const handleStageComplete = async () => {
    const pct    = Math.round((score / currentStage.questions) * 100);
    const passed = pct >= currentStage.passMark;
    submitScore({ game_id:'spelling', score, max_score:currentStage.questions, time_taken:Math.floor((Date.now()-startTime.current)/1000), difficulty_level:stageIndex+1, ai_data:{wrong_words:wrongWords} }).catch(()=>{});
    if (passed && stageIndex + 1 < STAGES.length) unlockStage(stageIndex + 1);
    setLoadingAI(true);
    try {
      const res = await getGameFeedback({ game_id:'spelling', score, max_score:currentStage.questions, percentage:pct, age_group:user?.profile?.age_group||'9-12', ai_data:{wrong_words:wrongWords} });
      setAiFeedback(res.data.feedback);
    } catch { setAiFeedback(pct >= 70 ? 'Spelling champion! Stage passed! ✏️🌟' : 'Keep practising! 💪'); }
    finally { setLoadingAI(false); }
  };

  useEffect(() => { if (stageOver) handleStageComplete(); }, [stageOver]);

  const answerTimePct = (answerTime / currentStage.answerTimer) * 100;

  if (!loaded) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F5F3FF', fontSize:18 }}>Loading... ✨</div>;

  if (!playing) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => navigate('/student/dashboard')}>← Back</motion.button>
          <div style={S.headerTitle}>✏️ Spell It Right</div>
          <div style={{ width:80 }} />
        </div>
        <div style={S.stageArea}>
          <h2 style={S.stageTitle}>Choose Your Stage</h2>
          <p style={S.stageSub}>Word shown briefly — then you must answer before the timer runs out!{'\n'}Stages 1 & 2: Fill the blanks. Stages 3–5: Type from memory. Progress saved! ✨</p>
          <div style={S.stagesGrid}>
            {STAGES.map((s, i) => {
              const unlocked = unlockedStages.includes(i);
              return (
                <motion.div key={i}
                  style={{ ...S.stageCard, opacity:unlocked?1:0.5, border:stageIndex===i?'3px solid #8B5CF6':'3px solid transparent', background:unlocked?'#EDE9FE':'#F3F4F6' }}
                  whileHover={unlocked?{scale:1.05}:{}} whileTap={unlocked?{scale:0.95}:{}}
                  onClick={() => { if (unlocked) { setStageIndex(i); setStageOver(false); } }}>
                  <div style={{ fontSize:28 }}>{unlocked ? '✏️' : '🔒'}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:unlocked?'#5B21B6':'#9CA3AF' }}>{s.name}</div>
                  <div style={{ fontSize:11, color:'#9CA3AF', marginTop:2 }}>{s.mode === 'fill_blanks' ? '🧩 Fill blanks' : '🧠 Type memory'}</div>
                  <div style={{ fontSize:11, color:'#EF4444', fontWeight:700, marginTop:2 }}>⏱️ {s.answerTimer}s to answer</div>
                  {unlocked && <div style={{ fontSize:11, color:'#10B981', fontWeight:700, marginTop:4 }}>✅ Unlocked</div>}
                </motion.div>
              );
            })}
          </div>
          <motion.button style={{ ...S.startBtn, background:'linear-gradient(135deg,#8B5CF6,#EC4899)' }}
            whileHover={{ scale:1.05 }} onClick={startStage}>
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
              :<> <div style={S.aiRow}><span>🤖</span><strong style={{ color:'#1E40AF' }}>AI Tutor Feedback</strong></div><p style={S.aiText}>{aiFeedback}</p></>}
          </div>
          <div style={S.resultBtns}>
            <motion.button style={S.playBtn} whileHover={{ scale:1.05 }} onClick={() => { setPlaying(false); setStageOver(false); }}>{passed?'Next Stage 🚀':'Try Again 🔄'}</motion.button>
            <motion.button style={S.homeBtn} whileHover={{ scale:1.05 }} onClick={() => navigate('/student/dashboard')}>Home 🏠</motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => { clearAnswerTimer(); setPlaying(false); setStageOver(false); }}>← Stages</motion.button>
        <div style={S.headerTitle}>✏️ {currentStage.name}</div>
        <div style={S.scoreBadge}>⭐ {score}/{currentStage.questions}</div>
      </div>
      <div style={S.progressWrap}>
        <div style={S.progressTrack}><motion.div style={S.progressFill} animate={{ width:`${(round/currentStage.questions)*100}%` }} transition={{ duration:0.4 }} /></div>
        <span style={S.roundText}>Q{round+1}/{currentStage.questions}</span>
      </div>
      <div style={S.gameArea}>

        <AnimatePresence>
          {showWord && (
            <motion.div style={S.wordFlash} initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.8,opacity:0 }}>
              <div style={{ fontSize:13, color:'#6B7280', fontWeight:700, marginBottom:12 }}>
                {currentStage.mode === 'fill_blanks' ? 'Remember this word — then fill the blanks!' : 'Memorise this word — type it from memory!'}
              </div>
              <div style={{ fontSize:48, fontWeight:900, color:'#8B5CF6', letterSpacing:4, textTransform:'uppercase' }}>{word}</div>
              <div style={{ marginTop:14 }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:'#7C3AED', color:'#fff', fontSize:24, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>{countdown}</div>
                <div style={{ fontSize:12, color:'#9CA3AF', marginTop:6 }}>Memorise now!</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showWord && !feedback && (
          <div style={{ width:'100%', maxWidth:480 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ flex:1, height:10, background:'#F3F4F6', borderRadius:10, overflow:'hidden' }}>
                <motion.div style={{ height:'100%', borderRadius:10, background:answerTimePct>50?'#10B981':answerTimePct>25?'#F59E0B':'#EF4444' }}
                  animate={{ width:`${answerTimePct}%` }} transition={{ duration:0.8 }} />
              </div>
              <span style={{ fontSize:14, fontWeight:900, color:answerTime<=5?'#EF4444':'#374151', minWidth:30 }}>{answerTime}s</span>
            </div>
          </div>
        )}

        {!showWord && currentStage.mode === 'fill_blanks' && fillData && (
          <motion.div style={S.spellBox} initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <p style={{ fontSize:15, color:'#6B7280', fontWeight:700, margin:'0 0 4px' }}>Fill in the missing letters!</p>
            <p style={{ fontSize:12, color:'#A78BFA', margin:'0 0 14px' }}>{fillData.blankIdxs.length} blank{fillData.blankIdxs.length>1?'s':''} to fill</p>
            {showHint && (
              <div style={S.hintBox}>🤖 Hint: The word is <strong style={{ textTransform:'uppercase', letterSpacing:3 }}>{word}</strong></div>
            )}
            <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap', margin:'14px 0' }}>
              {fillData.masked.map((char, i) => {
                const blankPos = fillData.blankIdxs.indexOf(i);
                const filled   = blankPos >= 0 ? userFill[blankPos] : null;
                return (
                  <div key={i} style={{ width:38, height:46, borderRadius:10, background:char==='_'?(filled?'#EDE9FE':'#F3F4F6'):'#fff', border:char==='_'?`2px solid ${filled?'#7C3AED':'#CBD5E1'}`:'2px solid transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900, color:char==='_'?'#7C3AED':'#1F1F2E' }}>
                    {char === '_' ? (filled || '?') : char.toUpperCase()}
                  </div>
                );
              })}
            </div>
            <AnimatePresence>
              {feedback && (
                <motion.div style={{ ...S.feedbackBubble, background:feedback==='correct'?'#D1FAE5':feedback==='timeout'?'#FEF3C7':'#FEE2E2', color:feedback==='correct'?'#065F46':feedback==='timeout'?'#92400E':'#991B1B' }}
                  initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}>
                  {feedback==='correct' ? `✅ Correct! "${word.toUpperCase()}"!` : feedback==='timeout' ? `⏰ Time up! Word: "${word.toUpperCase()}"` : `❌ Word was "${word.toUpperCase()}"`}
                </motion.div>
              )}
            </AnimatePresence>
            {!feedback && (
              <>
                <p style={{ fontSize:13, color:'#6B7280', margin:'4px 0 10px' }}>Tap letters to fill the blanks:</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', maxWidth:400, marginBottom:14 }}>
                  {fillData.options.map((letter, i) => (
                    <motion.button key={i}
                      style={{ width:46, height:50, borderRadius:12, background:BTN_COLORS[i%BTN_COLORS.length], color:'#fff', border:'none', fontSize:18, fontWeight:900, cursor:'pointer', fontFamily:'Nunito,sans-serif', boxShadow:'0 3px 8px rgba(0,0,0,0.15)' }}
                      whileHover={{ scale:1.1, y:-3 }} whileTap={{ scale:0.9 }}
                      onClick={() => handlePickLetter(letter)}>
                      {letter}
                    </motion.button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <motion.button style={{ ...S.checkBtn, opacity:userFill.length===fillData.blankIdxs.length?1:0.4 }}
                    whileHover={userFill.length===fillData.blankIdxs.length?{scale:1.05}:{}}
                    onClick={checkFill} disabled={userFill.length!==fillData.blankIdxs.length}>
                    Check ✅
                  </motion.button>
                  <motion.button style={S.clearBtn} whileHover={{ scale:1.05 }} onClick={handleClearFill}>Clear 🔄</motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {!showWord && currentStage.mode === 'type_from_memory' && (
          <motion.div style={S.spellBox} initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <p style={{ fontSize:16, color:'#6B7280', fontWeight:700, margin:'0 0 4px' }}>Type the word you just saw!</p>
            <p style={{ fontSize:13, color:'#A78BFA', fontWeight:700, marginBottom:16 }}>{word.length} letters</p>
            {showHint && (
              <div style={S.hintBox}>
                🤖 Hint: First letter <strong style={{ fontSize:20 }}>{word[0].toUpperCase()}</strong>, last letter <strong style={{ fontSize:20 }}>{word[word.length-1].toUpperCase()}</strong>
              </div>
            )}
            <AnimatePresence>
              {feedback && (
                <motion.div style={{ ...S.feedbackBubble, background:feedback==='correct'?'#D1FAE5':feedback==='timeout'?'#FEF3C7':'#FEE2E2', color:feedback==='correct'?'#065F46':feedback==='timeout'?'#92400E':'#991B1B' }}
                  initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}>
                  {feedback==='correct' ? `✅ Correct! "${word}"!` : feedback==='timeout' ? `⏰ Time up! Word: "${word}"` : `❌ Correct spelling: "${word}"`}
                </motion.div>
              )}
            </AnimatePresence>
            {!feedback && (
              <div style={{ display:'flex', gap:10, width:'100%' }}>
                <input ref={inputRef}
                  style={{ flex:1, padding:'14px 16px', borderRadius:14, border:'2.5px solid #EDE9FE', fontSize:16, outline:'none', fontFamily:'Nunito,sans-serif', boxSizing:'border-box' }}
                  placeholder={`${word.length}-letter word...`}
                  value={typed} onChange={e => setTyped(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && typed.trim() && checkTyped(typed)}
                  autoFocus />
                <motion.button
                  style={{ background:'#8B5CF6', color:'#fff', border:'none', padding:'14px 20px', borderRadius:14, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif', opacity:typed.trim()?1:0.5 }}
                  whileHover={typed.trim()?{scale:1.05}:{}} whileTap={{ scale:0.95 }}
                  onClick={() => typed.trim() && checkTyped(typed)} disabled={!typed.trim()}>
                  Check ✅
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

const S = {
  page:         { minHeight:'100vh', background:'#F5F3FF', display:'flex', flexDirection:'column' },
  header:       { background:'#fff', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 12px rgba(139,92,246,0.08)' },
  backBtn:      { background:'#EDE9FE', color:'#8B5CF6', border:'none', padding:'8px 16px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  headerTitle: { fontSize:20, fontWeight:900, color:'#1F1F2E' },
  scoreBadge:  { background:'#FEF3C7', color:'#D97706', padding:'6px 14px', borderRadius:20, fontSize:14, fontWeight:700 },
  progressWrap:{ padding:'10px 24px', background:'#fff', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', gap:10 },
  progressTrack:{ flex:1, height:10, background:'#EDE9FE', borderRadius:10, overflow:'hidden' },
  progressFill:{ height:'100%', background:'linear-gradient(90deg,#8B5CF6,#EC4899)', borderRadius:10 },
  roundText:    { fontSize:13, fontWeight:700, color:'#8B5CF6', whiteSpace:'nowrap' },
  gameArea:     { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', gap:14 },
  wordFlash:    { background:'#fff', borderRadius:28, padding:'28px 40px', textAlign:'center', boxShadow:'0 8px 32px rgba(139,92,246,0.15)', maxWidth:440, width:'100%' },
  spellBox:     { background:'#fff', borderRadius:28, padding:'24px 28px', textAlign:'center', boxShadow:'0 8px 32px rgba(139,92,246,0.1)', width:'100%', maxWidth:480 },
  hintBox:      { background:'#EDE9FE', color:'#5B21B6', borderRadius:12, padding:'10px 16px', fontSize:14, fontWeight:700, border:'2px solid #C4B5FD', marginBottom:12, textAlign:'center' },
  feedbackBubble:{ padding:'12px 24px', borderRadius:16, fontSize:15, fontWeight:800, marginBottom:12 },
  checkBtn:     { background:'#8B5CF6', color:'#fff', border:'none', padding:'13px 20px', borderRadius:14, fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  clearBtn:     { background:'#F3F4F6', color:'#4B5563', border:'none', padding:'13px 16px', borderRadius:14, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  stageArea:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px' },
  stageTitle:   { fontSize:24, fontWeight:900, color:'#1F1F2E', margin:'0 0 8px' },
  stageSub:     { fontSize:14, color:'#6B7280', marginBottom:28, textAlign:'center', maxWidth:460, whiteSpace:'pre-line' },
  stagesGrid:   { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:16, width:'100%', maxWidth:800, marginBottom:28 },
  stageCard:    { borderRadius:20, padding:'20px 16px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' },
  startBtn:     { color:'#fff', border:'none', padding:'16px 40px', borderRadius:18, fontSize:18, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  resultCard:   { background:'#fff', borderRadius:32, padding:'40px 36px', textAlign:'center', maxWidth:460, width:'90%', margin:'6vh auto', boxShadow:'0 20px 60px rgba(139,92,246,0.15)' },
  resultTitle: { fontSize:32, fontWeight:900, color:'#1F1F2E', margin:'12px 0 8px' },
  resultScore: { fontSize:18, color:'#6B7280', margin:'0 0 8px' },
  resultPct:    { fontSize:64, fontWeight:900, color:'#8B5CF6' },
  starsRow:     { display:'flex', justifyContent:'center', gap:8, margin:'12px 0 16px' },
  unlockedBox: { background:'#D1FAE5', color:'#065F46', borderRadius:12, padding:'10px 20px', fontSize:14, fontWeight:800, marginBottom:16 },
  aiBox:        { background:'#EFF6FF', borderRadius:14, padding:'14px 16px', marginBottom:20, border:'2px solid #BFDBFE', textAlign:'left', width:'100%' },
  aiRow:        { display:'flex', alignItems:'center', gap:8, marginBottom:6, fontWeight:600 },
  aiText:       { fontSize:13, color:'#1E40AF', lineHeight:1.6, margin:0, fontWeight:600 },
  resultBtns:   { display:'flex', gap:12, justifyContent:'center' },
  playBtn:      { background:'linear-gradient(135deg,#8B5CF6,#EC4899)', color:'#fff', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  homeBtn:      { background:'#F3F4F6', color:'#4B5563', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
};