import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore, getGameFeedback } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useStageProgress from '../../hooks/useStageProgress';

const STAGES = [
  { name:'Stage 1', letters:'ABCDE'.split(''),  questions:5, passMark:70 },
  { name:'Stage 2', letters:'FGHIJ'.split(''),  questions:5, passMark:70 },
  { name:'Stage 3', letters:'KLMNO'.split(''),  questions:5, passMark:70 },
  { name:'Stage 4', letters:'PQRSTU'.split(''), questions:5, passMark:70 },
  { name:'Stage 5', letters:'VWXYZ'.split(''),  questions:5, passMark:70 },
];

const PHONETICS = {
  A:['a','ay','aye','hey','ei'],         B:['b','be','bee','bea','bi'],
  C:['c','see','sea','si','ce'],         D:['d','dee','de','di'],
  E:['e','ee','eee','ih'],               F:['f','ef','eff','effe'],
  G:['g','gee','ji','ge'],              H:['h','aitch','haitch','eich'],
  I:['i','eye','ai','ay'],               J:['j','jay','jae','je'],
  K:['k','kay','kae','ke'],              L:['l','el','ell','le'],
  M:['m','em','emm','me'],               N:['n','en','enn','ne'],
  O:['o','oh','owe','ou'],               P:['p','pee','pe','pi'],
  Q:['q','cue','queue','kyu'],           R:['r','are','arr','ar'],
  S:['s','es','ess','se'],               T:['t','tee','tea','te','ti'],
  U:['u','you','ew','yoo'],              V:['v','vee','vi','ve'],
  W:['w','double-u','doubleyou','doubleu'], X:['x','ex','eks','ecks'],
  Y:['y','why','wai','ye'],              Z:['z','zee','zed','zeed','ze'],
};

function matchesLetter(heard, letter) {
  const h = heard.toLowerCase().trim();
  const l = letter.toUpperCase();
  // Direct single char
  if (h.toUpperCase() === l) return true;
  // First character only (child says just the letter sound)
  if (h.length <= 4 && h.charAt(0).toUpperCase() === l) return true;
  // Phonetics
  const ph = PHONETICS[l] || [];
  return ph.some(p => h === p || h.startsWith(p + ' ') || h === p);
}

export default function AlphabetGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unlockedStages, unlockStage, loaded } = useStageProgress('alphabet');

  const [stageIndex,    setStageIndex]    = useState(0);
  const [playing,       setPlaying]       = useState(false);
  const [targetLetter,  setTarget]        = useState('');
  const [usedLetters,   setUsedLetters]   = useState([]);
  const [score,         setScore]         = useState(0);
  const [round,         setRound]         = useState(0);
  const [feedback,      setFeedback]      = useState(null);
  const [stageOver,     setStageOver]     = useState(false);
  const [wrongLetters,  setWrongLetters]  = useState({});
  const [stageFailures, setStageFailures] = useState(0);
  const [showHint,      setShowHint]      = useState(false);
  const [aiFeedback,    setAiFeedback]    = useState('');
  const [loadingAI,     setLoadingAI]     = useState(false);
  const [micState,      setMicState]      = useState('idle');
  const [heardText,     setHeardText]     = useState('');
  const [voiceOK,       setVoiceOK]       = useState(false);

  const recRef      = useRef(null);
  const answerDone  = useRef(false);
  const targetRef   = useRef('');
  const scoreRef    = useRef(0);
  const roundRef    = useRef(0);
  const startTime   = useRef(Date.now());
  const currentStage = STAGES[stageIndex];

  useEffect(() => { targetRef.current = targetLetter; }, [targetLetter]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceOK(false); return; }
    setVoiceOK(true);

    const r = new SR();
    r.lang            = 'en-US';
    r.continuous      = false;
    r.interimResults  = false;
    r.maxAlternatives = 10;

    r.onresult = (e) => {
      if (answerDone.current) return;
      const results = e.results[0];
      const heard   = [];
      for (let i = 0; i < results.length; i++) heard.push(results[i].transcript);
      setHeardText(heard[0]);
      setMicState('done');
      // Check all alternatives — first match wins
      const matched = heard.some(h => matchesLetter(h, targetRef.current));
      processAnswer(matched);
    };

    r.onerror = (e) => {
      setMicState('idle');
      if (e.error !== 'aborted') setHeardText('Could not hear — tap mic and try again!');
    };

    r.onend = () => { if (micState === 'listening') setMicState('idle'); };
    recRef.current = r;
    return () => { try { r.abort(); } catch {} };
  }, []);

  const startMic = () => {
    if (answerDone.current || feedback) return;
    answerDone.current = false;
    setHeardText(''); setMicState('listening');
    try { recRef.current?.start(); } catch {
      try { recRef.current?.abort(); } catch {}
      setTimeout(() => { try { recRef.current?.start(); } catch {} }, 200);
    }
  };

  const stopMic = () => {
    try { recRef.current?.stop(); } catch {}
    setMicState('idle');
  };

  const processAnswer = (correct) => {
    if (answerDone.current) return;
    answerDone.current = true;
    try { recRef.current?.stop(); } catch {}
    setMicState('done');

    if (correct) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
      setWrongLetters(prev => ({ ...prev, [targetRef.current]: (prev[targetRef.current]||0)+1 }));
      setStageFailures(prev => {
        const newF = prev + 1;
        if (newF >= 2) setShowHint(true);
        return newF;
      });
    }

    setTimeout(() => {
      roundRef.current += 1;
      setRound(roundRef.current);

      if (roundRef.current >= currentStage.questions) {
        setStageOver(true); return;
      }

      setUsedLetters(prevUsed => {
        const available = currentStage.letters.filter(l => !prevUsed.includes(l));
        const letter    = available.length > 0 ? available[Math.floor(Math.random()*available.length)] : currentStage.letters[Math.floor(Math.random()*currentStage.letters.length)];
        setTarget(letter);
        return [...prevUsed, letter];
      });

      setFeedback(null);
      setHeardText(''); setMicState('idle');
      answerDone.current = false;
    }, 1500);
  };

  const startStage = () => {
    const letter = currentStage.letters[Math.floor(Math.random()*currentStage.letters.length)];
    setTarget(letter); setUsedLetters([letter]);
    scoreRef.current = 0; roundRef.current = 0;
    setScore(0); setRound(0); setFeedback(null);
    setShowHint(false); setStageFailures(0);
    setWrongLetters({}); setHeardText('');
    setStageOver(false); setPlaying(true); setMicState('idle');
    answerDone.current = false;
    startTime.current  = Date.now();
  };

  const handleStageComplete = async () => {
    const pct    = Math.min(100, Math.round((scoreRef.current/currentStage.questions)*100));
    const passed = pct >= currentStage.passMark;
    submitScore({ game_id:'alphabet', score:scoreRef.current, max_score:currentStage.questions, time_taken:Math.floor((Date.now()-startTime.current)/1000), difficulty_level:stageIndex+1, ai_data:{wrong_letters:wrongLetters} }).catch(()=>{});
    if (passed && stageIndex+1 < STAGES.length) unlockStage(stageIndex+1);
    setLoadingAI(true);
    try {
      const res = await getGameFeedback({ game_id:'alphabet', score:scoreRef.current, max_score:currentStage.questions, percentage:pct, age_group:user?.profile?.age_group||'3-6', ai_data:{wrong_letters:wrongLetters} });
      setAiFeedback(res.data.feedback);
    } catch { setAiFeedback(pct>=70?`Stage passed! 🌟`:`Keep practising! 💪`); }
    finally { setLoadingAI(false); }
  };

  useEffect(() => { if (stageOver) handleStageComplete(); }, [stageOver]);

  if (!loaded) return <div style={S.loadScreen}>Loading... ✨</div>;

  if (!playing) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => navigate('/student/dashboard')}>← Back</motion.button>
          <div style={S.headerTitle}>🔤 Alphabet Adventure</div>
          <div style={{ width:80 }} />
        </div>
        <div style={S.stageArea}>
          <h2 style={S.stageTitle}>Choose Your Stage</h2>
          <p style={S.stageSub}>Tap mic, say the letter, tap to stop! Score 70% to unlock next stage! ✨</p>
          <div style={S.stagesGrid}>
            {STAGES.map((s, i) => {
              const unlocked = unlockedStages.includes(i);
              return (
                <motion.div key={i} style={{ ...S.stageCard, opacity:unlocked?1:0.5, border:stageIndex===i?'3px solid #7C3AED':'3px solid transparent', background:unlocked?'#EDE9FE':'#F3F4F6' }}
                  whileHover={unlocked?{scale:1.05}:{}} whileTap={unlocked?{scale:0.95}:{}}
                  onClick={() => { if (unlocked) { setStageIndex(i); setStageOver(false); } }}>
                  <div style={{ fontSize:28 }}>{unlocked?'🔤':'🔒'}</div>
                  <div style={{ fontSize:15, fontWeight:800, color:unlocked?'#7C3AED':'#9CA3AF' }}>{s.name}</div>
                  <div style={{ fontSize:14, letterSpacing:3, color:'#6B7280', marginTop:4 }}>{s.letters.join(' ')}</div>
                  {unlocked&&<div style={{ fontSize:11, color:'#10B981', fontWeight:700, marginTop:4 }}>✅ Unlocked</div>}
                </motion.div>
              );
            })}
          </div>
          <motion.button style={S.startBtn} whileHover={{ scale:1.05 }} onClick={startStage}>
            Start {STAGES[stageIndex].name} 🚀
          </motion.button>
        </div>
      </div>
    );
  }

  if (stageOver) {
    const pct    = Math.min(100, Math.round((scoreRef.current/currentStage.questions)*100));
    const passed = pct >= currentStage.passMark;
    return (
      <div style={S.page}>
        <motion.div style={S.resultCard} initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:'spring',bounce:0.4 }}>
          <div style={{ fontSize:80 }}>{passed?'🏆':'💪'}</div>
          <h1 style={S.resultTitle}>{passed?'Stage Passed! 🎉':'Try Again!'}</h1>
          <p style={S.resultScore}>{scoreRef.current}/{currentStage.questions} correct — {pct}%</p>
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

  const micColor = micState==='listening'?'#EF4444':'#7C3AED';

  return (
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => { stopMic(); setPlaying(false); setStageOver(false); }}>← Stages</motion.button>
        <div style={S.headerTitle}>🔤 {currentStage.name}</div>
        <div style={S.scoreBadge}>⭐ {scoreRef.current}/{currentStage.questions}</div>
      </div>
      <div style={S.progressWrap}>
        <div style={S.progressTrack}><motion.div style={S.progressFill} animate={{ width:`${(roundRef.current/currentStage.questions)*100}%` }} transition={{ duration:0.4 }} /></div>
        <span style={S.roundText}>Q{roundRef.current+1}/{currentStage.questions}</span>
      </div>
      <div style={S.gameArea}>
        <motion.div style={S.questionBox} key={`${stageIndex}-${roundRef.current}`} initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:'spring',bounce:0.4 }}>
          <p style={S.questionLabel}>What letter is this? Say it aloud!</p>
          <div style={{ fontSize:130, fontWeight:900, color:'#7C3AED', lineHeight:1 }}>{targetLetter}</div>
        </motion.div>

        <AnimatePresence>
          {showHint && (
            <motion.div style={{ background:'#FEF3C7', color:'#92400E', borderRadius:14, padding:'12px 24px', fontSize:15, fontWeight:700, border:'2px solid #FCD34D', textAlign:'center', maxWidth:360 }}
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              🤖 AI Hint: Say the letter <strong style={{ fontSize:28 }}>{targetLetter}</strong> — like in "<strong>{targetLetter.toLowerCase()}at</strong>"!
            </motion.div>
          )}
        </AnimatePresence>

        {voiceOK ? (
          <div style={{ textAlign:'center', width:'100%', maxWidth:380 }}>
            {!feedback && (
              <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:14, flexWrap:'wrap' }}>
                <div style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:micState==='idle'?'#EDE9FE':'#F3F4F6', color:micState==='idle'?'#7C3AED':'#9CA3AF' }}>1️⃣ Tap mic</div>
                <div style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:micState==='listening'?'#FEE2E2':'#F3F4F6', color:micState==='listening'?'#EF4444':'#9CA3AF' }}>2️⃣ Say letter</div>
                <div style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:micState==='listening'?'#FEF3C7':'#F3F4F6', color:micState==='listening'?'#D97706':'#9CA3AF' }}>3️⃣ Tap stop</div>
              </div>
            )}
            <motion.button
              style={{ width:90, height:90, borderRadius:'50%', border:'none', background:micColor, fontSize:38, cursor:'pointer', color:'#fff', boxShadow:micState==='listening'?'0 0 0 20px rgba(239,68,68,0.15)':'0 8px 24px rgba(124,58,237,0.35)' }}
              animate={micState==='listening'?{ scale:[1,1.1,1] }:{ scale:1 }}
              transition={micState==='listening'?{ repeat:Infinity, duration:0.8 }:{}}
              whileTap={{ scale:0.9 }}
              onClick={micState==='listening'?stopMic:startMic}
              disabled={!!feedback||micState==='done'}>
              {micState==='idle'?'🎤':micState==='listening'?'⏹️':'✓'}
            </motion.button>
            <div style={{ fontSize:14, color:'#6B7280', marginTop:10, fontWeight:600, minHeight:20 }}>
              {micState==='idle'&&(heardText||'Tap the mic to start')}
              {micState==='listening'&&'🔴 Listening... say the letter now!'}
              {micState==='done'&&heardText&&`I heard: "${heardText}"`}
            </div>
          </div>
        ) : (
          <div style={{ background:'#FEE2E2', borderRadius:14, padding:'14px 20px', fontSize:14, color:'#991B1B', fontWeight:600, textAlign:'center', maxWidth:380 }}>
            ⚠️ Voice requires <strong>Chrome</strong> browser!
          </div>
        )}

        <AnimatePresence>
          {feedback && (
            <motion.div style={{ borderRadius:20, padding:'20px 32px', textAlign:'center', maxWidth:380, background:feedback==='correct'?'#D1FAE5':'#FEE2E2', color:feedback==='correct'?'#065F46':'#991B1B' }}
              initial={{ scale:0,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0,opacity:0 }}>
              <div style={{ fontSize:48 }}>{feedback==='correct'?'✅':'❌'}</div>
              <div style={{ fontSize:18, fontWeight:800, marginTop:6 }}>
                {feedback==='correct'?`Correct! "${targetLetter}"! 🎉`:`The letter is "${targetLetter}" — Moving on!`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const S = {
  loadScreen:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F9F5FF', fontSize:18 },
  page:        { minHeight:'100vh', background:'#F9F5FF', display:'flex', flexDirection:'column' },
  header:      { background:'#fff', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 12px rgba(124,58,237,0.08)' },
  backBtn:     { background:'#EDE9FE', color:'#7C3AED', border:'none', padding:'8px 16px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  headerTitle: { fontSize:20, fontWeight:900, color:'#1F1F2E' },
  scoreBadge:  { background:'#FEF3C7', color:'#D97706', padding:'6px 14px', borderRadius:20, fontSize:14, fontWeight:700 },
  progressWrap:{ padding:'12px 24px', background:'#fff', borderBottom:'1px solid #F3F4F6', display:'flex', alignItems:'center', gap:12 },
  progressTrack:{ flex:1, height:10, background:'#EDE9FE', borderRadius:10, overflow:'hidden' },
  progressFill:{ height:'100%', background:'linear-gradient(90deg,#7C3AED,#EC4899)', borderRadius:10 },
  roundText:   { fontSize:13, fontWeight:700, color:'#7C3AED', whiteSpace:'nowrap' },
  gameArea:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', gap:20 },
  questionBox: { background:'#fff', borderRadius:28, padding:'36px 60px', textAlign:'center', boxShadow:'0 8px 32px rgba(124,58,237,0.12)' },
  questionLabel:{ fontSize:16, color:'#6B7280', fontWeight:700, margin:'0 0 12px' },
  stageArea:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px' },
  stageTitle:  { fontSize:24, fontWeight:900, color:'#1F1F2E', margin:'0 0 8px' },
  stageSub:    { fontSize:14, color:'#6B7280', marginBottom:28, textAlign:'center', maxWidth:460 },
  stagesGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:16, width:'100%', maxWidth:700, marginBottom:28 },
  stageCard:   { borderRadius:20, padding:'20px 16px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' },
  startBtn:    { background:'linear-gradient(135deg,#7C3AED,#EC4899)', color:'#fff', border:'none', padding:'16px 40px', borderRadius:18, fontSize:18, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  resultCard:  { background:'#fff', borderRadius:32, padding:'40px 36px', textAlign:'center', maxWidth:460, width:'90%', margin:'6vh auto', boxShadow:'0 20px 60px rgba(124,58,237,0.15)' },
  resultTitle: { fontSize:32, fontWeight:900, color:'#1F1F2E', margin:'12px 0 8px' },
  resultScore: { fontSize:18, color:'#6B7280', margin:'0 0 8px' },
  resultPct:   { fontSize:64, fontWeight:900, color:'#7C3AED' },
  starsRow:    { display:'flex', justifyContent:'center', gap:8, margin:'12px 0 12px' },
  unlockedBox: { background:'#D1FAE5', color:'#065F46', borderRadius:12, padding:'10px 20px', fontSize:14, fontWeight:800, marginBottom:16 },
  aiBox:       { background:'#EFF6FF', borderRadius:14, padding:'14px 16px', marginBottom:20, border:'2px solid #BFDBFE', textAlign:'left', width:'100%' },
  aiRow:       { display:'flex', alignItems:'center', gap:8, marginBottom:6, fontWeight:600 },
  aiText:      { fontSize:13, color:'#1E40AF', lineHeight:1.6, margin:0, fontWeight:600 },
  resultBtns:  { display:'flex', gap:12, justifyContent:'center' },
  playBtn:     { background:'linear-gradient(135deg,#7C3AED,#EC4899)', color:'#fff', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  homeBtn:     { background:'#F3F4F6', color:'#4B5563', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
};
