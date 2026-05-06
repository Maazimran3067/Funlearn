//this is colourexplorer.js


import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore, getGameFeedback } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useStageProgress from '../../hooks/useStageProgress';

const STAGES = [
  { name:'Stage 1', colors:[{name:'Red',hex:'#EF4444'},{name:'Blue',hex:'#3B82F6'},{name:'Green',hex:'#22C55E'},{name:'Yellow',hex:'#EAB308'}], questions:5, passMark:70 },
  { name:'Stage 2', colors:[{name:'Orange',hex:'#F97316'},{name:'Purple',hex:'#A855F7'},{name:'Pink',hex:'#EC4899'},{name:'Brown',hex:'#92400E'}], questions:5, passMark:70 },
  { name:'Stage 3', colors:[{name:'White',hex:'#E5E7EB'},{name:'Black',hex:'#1F2937'},{name:'Grey',hex:'#6B7280'},{name:'Cyan',hex:'#06B6D4'}], questions:5, passMark:70 },
  { name:'Stage 4', colors:[{name:'Red',hex:'#EF4444'},{name:'Blue',hex:'#3B82F6'},{name:'Green',hex:'#22C55E'},{name:'Yellow',hex:'#EAB308'},{name:'Orange',hex:'#F97316'},{name:'Purple',hex:'#A855F7'}], questions:5, passMark:70 },
];

const COLOR_PHONETICS = {
  'Red':    ['red','redd','red color'],
  'Blue':   ['blue','blew','bloo'],
  'Green':  ['green','gren','grean'],
  'Yellow': ['yellow','yello','yelo'],
  'Orange': ['orange','oranje','orang'],
  'Purple': ['purple','perple','purpel'],
  'Pink':   ['pink','pnk','peng'],
  'Brown':  ['brown','bron','braun'],
  'White':  ['white','wight','wit'],
  'Black':  ['black','blak'],
  'Grey':   ['grey','gray','grea'],
  'Cyan':   ['cyan','sian','sayan'],
};

function matchesColor(heard, colorName) {
  const h  = heard.toLowerCase().trim();
  const cn = colorName.toLowerCase();
  if (h.includes(cn)) return true;
  if (h === cn) return true;
  const ph = COLOR_PHONETICS[colorName] || [cn];
  return ph.some(p => h === p || h.includes(p));
}

export default function ColorExplorer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unlockedStages, unlockStage, loaded } = useStageProgress('colors');

  const [stageIndex,    setStageIndex]    = useState(0);
  const [playing,       setPlaying]       = useState(false);
  const [target,        setTarget]        = useState(null);
  const [usedColors,    setUsedColors]    = useState([]);
  const [score,         setScore]         = useState(0);
  const [round,         setRound]         = useState(0);
  const [feedback,      setFeedback]      = useState(null);
  const [stageOver,     setStageOver]     = useState(false);
  const [wrongCount,    setWrongCount]    = useState({});
  const [stageFailures, setStageFailures] = useState(0);
  const [showHint,      setShowHint]      = useState(false);
  const [micState,      setMicState]      = useState('idle');
  const [heardText,     setHeardText]     = useState('');
  const [voiceOK,       setVoiceOK]       = useState(false);
  const [aiFeedback,    setAiFeedback]    = useState('');
  const [loadingAI,     setLoadingAI]     = useState(false);

  const recRef     = useRef(null);
  const answerDone = useRef(false);
  const targetRef  = useRef(null);
  const scoreRef   = useRef(0);
  const roundRef   = useRef(0);
  const startTime  = useRef(Date.now());
  const currentStage = STAGES[stageIndex];

  useEffect(() => { targetRef.current = target; }, [target]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceOK(false); return; }
    setVoiceOK(true);
    const r = new SR();
    r.lang = 'en-US'; r.continuous = false; r.interimResults = false; r.maxAlternatives = 10;
    r.onresult = (e) => {
      if (answerDone.current) return;
      const results = e.results[0];
      const heard = [];
      for (let i = 0; i < results.length; i++) heard.push(results[i].transcript);
      setHeardText(heard[0]);
      setMicState('done');
      const colorName = targetRef.current?.name || '';
      const matched = heard.some(h => matchesColor(h, colorName));
      processResult(matched);
    };
    r.onerror = (e) => { setMicState('idle'); if (e.error !== 'aborted') setHeardText('Could not hear — tap mic and try again!'); };
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

  const stopMic = () => { try { recRef.current?.stop(); } catch {} setMicState('idle'); };

  const processResult = (correct) => {
    if (answerDone.current) return;
    answerDone.current = true;
    try { recRef.current?.stop(); } catch {}
    setMicState('done');
    if (correct) { scoreRef.current += 1; setScore(scoreRef.current); setFeedback('correct'); }
    else {
      setFeedback('wrong');
      setWrongCount(prev => ({ ...prev, [targetRef.current?.name]: (prev[targetRef.current?.name]||0)+1 }));
      setStageFailures(prev => { const nf = prev+1; if (nf >= 2) setShowHint(true); return nf; });
    }
    setTimeout(() => {
      roundRef.current += 1; setRound(roundRef.current);
      if (roundRef.current >= currentStage.questions) { setStageOver(true); return; }
      setUsedColors(prevUsed => {
        const available = currentStage.colors.filter(c => !prevUsed.includes(c.name));
        const pool = available.length > 0 ? available : currentStage.colors;
        const newT = pool[Math.floor(Math.random() * pool.length)];
        setTarget(newT);
        return [...prevUsed, newT.name];
      });
      setFeedback(null); setHeardText(''); setMicState('idle'); answerDone.current = false;
    }, 1500);
  };

  const pickColor = (used) => {
    const available = currentStage.colors.filter(c => !used.includes(c.name));
    if (available.length === 0) return currentStage.colors[Math.floor(Math.random()*currentStage.colors.length)];
    return available[Math.floor(Math.random()*available.length)];
  };

  const startStage = () => {
    const t = pickColor([]);
    setTarget(t); setUsedColors([t.name]);
    scoreRef.current = 0; roundRef.current = 0;
    setScore(0); setRound(0); setFeedback(null);
    setShowHint(false); setStageFailures(0);
    setWrongCount({}); setHeardText('');
    setStageOver(false); setPlaying(true); setMicState('idle');
    answerDone.current = false; startTime.current = Date.now();
  };

  const handleStageComplete = async () => {
    const pct = Math.min(100, Math.round((scoreRef.current/currentStage.questions)*100));
    const passed = pct >= currentStage.passMark;
    submitScore({ game_id:'colors', score:scoreRef.current, max_score:currentStage.questions, time_taken:Math.floor((Date.now()-startTime.current)/1000), difficulty_level:stageIndex+1, ai_data:{wrong_colors:wrongCount} }).catch(()=>{});
    if (passed && stageIndex+1 < STAGES.length) unlockStage(stageIndex+1);
    setLoadingAI(true);
    try {
      const res = await getGameFeedback({ game_id:'colors', score:scoreRef.current, max_score:currentStage.questions, percentage:pct, age_group:user?.profile?.age_group||'3-6', ai_data:{wrong_colors:wrongCount} });
      setAiFeedback(res.data.feedback);
    } catch { setAiFeedback(pct>=70?'Great color work! 🎨🌟':'Keep practising! 💪'); }
    finally { setLoadingAI(false); }
  };

  useEffect(() => { if (stageOver) handleStageComplete(); }, [stageOver]);

  if (!loaded) return <div style={S.loadScreen}>Loading... ✨</div>;

  if (!playing) return (
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => navigate('/student/dashboard')}>← Back</motion.button>
        <div style={S.headerTitle}>🎨 Color Explorer</div>
        <div style={{ width:80 }} />
      </div>
      <div style={S.stageArea}>
        <h2 style={S.stageTitle}>Choose Your Stage</h2>
        <p style={S.stageSub}>See the color — say its name! Voice only! Score 70% to unlock! ✨</p>
        <div style={S.stagesGrid}>
          {STAGES.map((s, i) => {
            const unlocked = unlockedStages.includes(i);
            return (
              <motion.div key={i} style={{ ...S.stageCard, opacity:unlocked?1:0.5, border:stageIndex===i?'2px solid #EC4899':'1px solid #2D3A4F', background:unlocked?'rgba(236,72,153,0.1)':'#1E293B' }}
                whileHover={unlocked?{scale:1.05,borderColor:'rgba(236,72,153,0.5)'}:{}} whileTap={unlocked?{scale:0.95}:{}}
                onClick={() => { if (unlocked) { setStageIndex(i); setStageOver(false); } }}>
                <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:8 }}>
                  {s.colors.slice(0,4).map(c => <div key={c.name} style={{ width:22, height:22, borderRadius:'50%', background:c.hex, border:'2px solid rgba(255,255,255,0.1)' }} />)}
                </div>
                <div style={{ fontSize:15, fontWeight:800, color:unlocked?'#EC4899':'#4B5563', fontFamily:'Nunito,sans-serif' }}>{s.name}</div>
                <div style={{ fontSize:11, color:'#64748B', marginTop:2, fontFamily:'Nunito,sans-serif' }}>{s.colors.map(c=>c.name).join(', ')}</div>
                {unlocked && <div style={{ fontSize:11, color:'#10B981', fontWeight:700, marginTop:4 }}>✅ Unlocked</div>}
              </motion.div>
            );
          })}
        </div>
        <motion.button style={{ ...S.startBtn, background:'linear-gradient(135deg,#EC4899,#F97316)' }} whileHover={{ scale:1.05 }} onClick={startStage}>
          Start {STAGES[stageIndex].name} 🚀
        </motion.button>
      </div>
    </div>
  );

  if (stageOver) {
    const pct = Math.min(100, Math.round((scoreRef.current/currentStage.questions)*100));
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

  if (!target) return null;
  const micColor = micState==='listening'?'#EF4444':'#EC4899';

  return (
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => { stopMic(); setPlaying(false); setStageOver(false); }}>← Stages</motion.button>
        <div style={S.headerTitle}>🎨 {currentStage.name}</div>
        <div style={S.scoreBadge}>⭐ {scoreRef.current}/{currentStage.questions}</div>
      </div>

      {/* FIXED: progress fills to 100% on Q5 */}
      <div style={S.progressWrap}>
        <div style={S.progressTrack}>
          <motion.div style={S.progressFill}
            animate={{ width:`${((roundRef.current + 1) / currentStage.questions) * 100}%` }}
            transition={{ duration:0.4 }} />
        </div>
        <span style={S.roundText}>Q{roundRef.current+1}/{currentStage.questions}</span>
      </div>

      <div style={S.gameArea}>
        <motion.div style={S.questionBox} key={`${stageIndex}-${roundRef.current}`} initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ type:'spring',bounce:0.4 }}>
          <p style={S.questionLabel}>What color is this? Say its name!</p>
          <motion.div style={{ width:180, height:180, borderRadius:28, background:target.hex, margin:'16px auto', boxShadow:`0 12px 40px ${target.hex}60`, border:'4px solid rgba(255,255,255,0.8)' }}
            animate={{ scale:[1,1.03,1] }} transition={{ duration:2, repeat:Infinity }} />
        </motion.div>

        <AnimatePresence>
          {showHint && (
            <motion.div style={{ background:'#FEF3C7', color:'#92400E', borderRadius:14, padding:'12px 20px', fontSize:14, fontWeight:700, border:'2px solid #FCD34D', textAlign:'center', maxWidth:340 }}
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              🤖 AI Hint: This color starts with <strong style={{ fontSize:20 }}>"{target.name[0].toUpperCase()}"</strong>
            </motion.div>
          )}
        </AnimatePresence>

        {voiceOK ? (
          <div style={{ textAlign:'center', width:'100%', maxWidth:380 }}>
            {!feedback && (
              <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:14, flexWrap:'wrap' }}>
                <div style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:micState==='idle'?'#FCE7F3':'#F3F4F6', color:micState==='idle'?'#EC4899':'#9CA3AF' }}>1️⃣ Tap mic</div>
                <div style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:micState==='listening'?'#FEE2E2':'#F3F4F6', color:micState==='listening'?'#EF4444':'#9CA3AF' }}>2️⃣ Say color</div>
                <div style={{ padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:micState==='listening'?'#FEF3C7':'#F3F4F6', color:micState==='listening'?'#D97706':'#9CA3AF' }}>3️⃣ Tap stop</div>
              </div>
            )}
            <motion.button
              style={{ width:90, height:90, borderRadius:'50%', border:'none', background:micColor, fontSize:38, cursor:'pointer', color:'#fff', boxShadow:micState==='listening'?'0 0 0 20px rgba(239,68,68,0.15)':'0 8px 24px rgba(236,72,153,0.35)' }}
              animate={micState==='listening'?{ scale:[1,1.1,1] }:{ scale:1 }}
              transition={micState==='listening'?{ repeat:Infinity, duration:0.8 }:{}}
              whileTap={{ scale:0.9 }}
              onClick={micState==='listening'?stopMic:startMic}
              disabled={!!feedback||micState==='done'}>
              {micState==='idle'?'🎤':micState==='listening'?'⏹️':'✓'}
            </motion.button>
            <div style={{ fontSize:14, color:'#6B7280', marginTop:10, fontWeight:600, minHeight:20 }}>
              {micState==='idle'&&(heardText||'Tap the mic and say the color!')}
              {micState==='listening'&&'🔴 Listening... say the color name!'}
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
                {feedback==='correct'?`Correct! That's ${target.name}! 🎉`:`It's "${target.name}" — Moving on!`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const S = {
  loadScreen:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0B1120', fontSize:18, color:'#94A3B8', fontFamily:'Nunito,sans-serif' },
  page:        { minHeight:'100vh', background:'#0B1120', display:'flex', flexDirection:'column' },
  header:      { background:'#1E293B', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #2D3A4F' },
  backBtn:     { background:'rgba(236,72,153,0.12)', color:'#EC4899', border:'1px solid rgba(236,72,153,0.3)', padding:'8px 16px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  headerTitle: { fontSize:20, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' },
  scoreBadge:  { background:'rgba(245,158,11,0.15)', color:'#F59E0B', padding:'6px 14px', borderRadius:20, fontSize:14, fontWeight:700, border:'1px solid rgba(245,158,11,0.3)' },
  progressWrap:{ padding:'12px 24px', background:'#1E293B', borderBottom:'1px solid #2D3A4F', display:'flex', alignItems:'center', gap:12 },
  progressTrack:{ flex:1, height:8, background:'#2D3A4F', borderRadius:10, overflow:'hidden' },
  progressFill:{ height:'100%', background:'linear-gradient(90deg,#EC4899,#F97316)', borderRadius:10 },
  roundText:   { fontSize:13, fontWeight:700, color:'#EC4899', whiteSpace:'nowrap', fontFamily:'Nunito,sans-serif' },
  gameArea:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 20px', gap:20 },
  questionBox: { background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:28, padding:'24px 32px', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' },
  questionLabel:{ fontSize:16, color:'#94A3B8', fontWeight:700, margin:'0 0 8px', fontFamily:'Nunito,sans-serif' },
  stageArea:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px' },
  stageTitle:  { fontSize:24, fontWeight:900, color:'#F1F5F9', margin:'0 0 8px', fontFamily:'Nunito,sans-serif' },
  stageSub:    { fontSize:14, color:'#64748B', marginBottom:28, textAlign:'center', maxWidth:460, fontFamily:'Nunito,sans-serif' },
  stagesGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:16, width:'100%', maxWidth:700, marginBottom:28 },
  stageCard:   { borderRadius:20, padding:'20px 16px', textAlign:'center', cursor:'pointer', transition:'all 0.2s' },
  startBtn:    { color:'#fff', border:'none', padding:'16px 40px', borderRadius:18, fontSize:18, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  resultCard:  { background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:32, padding:'40px 36px', textAlign:'center', maxWidth:460, width:'90%', margin:'6vh auto', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' },
  resultTitle: { fontSize:32, fontWeight:900, color:'#F1F5F9', margin:'12px 0 8px', fontFamily:'Nunito,sans-serif' },
  resultScore: { fontSize:18, color:'#94A3B8', margin:'0 0 8px', fontFamily:'Nunito,sans-serif' },
  resultPct:   { fontSize:64, fontWeight:900, color:'#EC4899', fontFamily:'Nunito,sans-serif' },
  starsRow:    { display:'flex', justifyContent:'center', gap:8, margin:'12px 0 12px' },
  unlockedBox: { background:'rgba(16,185,129,0.15)', color:'#6EE7B7', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'10px 20px', fontSize:14, fontWeight:800, marginBottom:16, fontFamily:'Nunito,sans-serif' },
  aiBox:       { background:'rgba(99,102,241,0.08)', borderRadius:14, padding:'14px 16px', marginBottom:20, border:'1px solid rgba(99,102,241,0.2)', textAlign:'left', width:'100%' },
  aiRow:       { display:'flex', alignItems:'center', gap:8, marginBottom:6, fontWeight:600, color:'#94A3B8', fontFamily:'Nunito,sans-serif' },
  aiText:      { fontSize:13, color:'#94A3B8', lineHeight:1.6, margin:0, fontWeight:600, fontFamily:'Nunito,sans-serif' },
  resultBtns:  { display:'flex', gap:12, justifyContent:'center' },
  playBtn:     { background:'linear-gradient(135deg,#EC4899,#F97316)', color:'#fff', border:'none', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif', boxShadow:'0 4px 15px rgba(236,72,153,0.35)' },
  homeBtn:     { background:'rgba(30,41,59,0.8)', color:'#94A3B8', border:'1px solid #2D3A4F', padding:'14px 24px', borderRadius:16, fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
};