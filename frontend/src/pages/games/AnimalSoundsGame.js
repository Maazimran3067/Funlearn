// this is animalsoundgame.js

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { submitScore, getGameFeedback } from '../../services/api';
import useStageProgress from '../../hooks/useStageProgress';

// Age 3-6: Show animal sound, tap or say which animal makes that sound
const ANIMALS = [
  { name:'Cat',      emoji:'🐱', sound:'Meow',    phonetics:['cat','meow','mew','miau'] },
  { name:'Dog',      emoji:'🐶', sound:'Woof',    phonetics:['dog','woof','bark','ruff','wof'] },
  { name:'Cow',      emoji:'🐮', sound:'Moo',     phonetics:['cow','moo','mu','mooo'] },
  { name:'Duck',     emoji:'🦆', sound:'Quack',   phonetics:['duck','quack','kwak'] },
  { name:'Lion',     emoji:'🦁', sound:'Roar',    phonetics:['lion','roar','raa','rawr'] },
  { name:'Frog',     emoji:'🐸', sound:'Ribbit',  phonetics:['frog','ribbit','ribbet','ribit'] },
  { name:'Bee',      emoji:'🐝', sound:'Buzz',    phonetics:['bee','buzz','buz','bzzz'] },
  { name:'Elephant', emoji:'🐘', sound:'Trumpet', phonetics:['elephant','trumpet','toot','elefant'] },
];

const STAGES = [
  { stage:0, pool:[0,1,2,3],          label:'Stage 1', passMark:70 },
  { stage:1, pool:[0,1,2,3,4],        label:'Stage 2', passMark:70 },
  { stage:2, pool:[0,1,2,3,4,5],      label:'Stage 3', passMark:70 },
  { stage:3, pool:[2,3,4,5,6,7],      label:'Stage 4', passMark:70 },
  { stage:4, pool:[0,1,2,3,4,5,6,7],  label:'Stage 5', passMark:70 },
];

function makeQ(stageIdx) {
  const pool    = STAGES[stageIdx].pool;
  const correct = ANIMALS[pool[Math.floor(Math.random() * pool.length)]];
  const others  = ANIMALS
    .filter(a => a.name !== correct.name)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  return { correct, options: [correct, ...others].sort(() => Math.random() - 0.5) };
}

export default function AnimalSoundsGame() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { unlockedStages, unlockStage, loaded } = useStageProgress('animalsounds');

  const [screen,    setScreen]   = useState('stages');
  const [stageIdx,  setStageIdx] = useState(0);
  const [question,  setQuestion] = useState(null);
  const [qNum,      setQNum]     = useState(0);
  const [feedback,  setFeedback] = useState(null);
  const [listening, setListening]= useState(false);
  const [aiFeedback,setAiFeed]   = useState('');
  const [loadingAI, setLoadAI]   = useState(false);
  const [heardText, setHeardText]= useState('');

  const scoreRef   = useRef(0);
  const questionRef= useRef(null); 
  const startTime  = useRef(Date.now());
  const TOTAL = 5;

  useEffect(() => { questionRef.current = question; }, [question]);

  const startStage = (idx) => {
    setStageIdx(idx);
    scoreRef.current = 0;
    setQNum(0); setFeedback(null);
    setAiFeed(''); setListening(false); setHeardText('');
    const q = makeQ(idx);
    setQuestion(q);
    startTime.current = Date.now();
    setScreen('game');
  };

  const speak = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Voice recognition requires Chrome browser.'); return; }
    if (feedback) return;

    const r = new SR();
    r.maxAlternatives = 5;
    r.lang = 'en-US';

    r.onstart  = () => { setListening(true); setHeardText(''); };
    r.onend    = () => setListening(false);
    r.onerror  = () => setListening(false);

    r.onresult = (e) => {
      const heard = e.results[0][0].transcript.toLowerCase().trim();
      setHeardText(heard);
      const currentQ = questionRef.current;
      if (!currentQ) return;

      const matched = currentQ.options.find(opt =>
        opt.phonetics.some(ph => heard.includes(ph)) || heard.includes(opt.name.toLowerCase())
      );
      handlePick(matched || null);
    };
    r.start();
  };

  const handlePick = async (option) => {
    if (feedback) return;
    const currentQ = questionRef.current;
    if (!currentQ) return;

    const correct = option?.name === currentQ.correct.name;
    if (correct) scoreRef.current += 1;
    setFeedback({ correct, chosen: option?.name });

    setTimeout(async () => {
      const nextQNum = qNum + 1;
      if (nextQNum >= TOTAL) {
        handleComplete();
      } else {
        setQNum(nextQNum);
        setQuestion(makeQ(stageIdx));
        setFeedback(null);
        setHeardText('');
      }
    }, 1500);
  };

  const handleComplete = async () => {
    setScreen('result');
    const pct = Math.round((scoreRef.current / TOTAL) * 100);
    const passed = pct >= STAGES[stageIdx].passMark;

    submitScore({
      game_id: 'animalsounds', score: scoreRef.current, max_score: TOTAL,
      percentage: pct, difficulty_level: stageIdx + 1,
      time_taken: Math.floor((Date.now() - startTime.current) / 1000),
    }).catch(() => {});

    if (passed) unlockStage(stageIdx + 1);

    setLoadAI(true);
    try {
      const res = await getGameFeedback({
        game_id: 'animalsounds', score: scoreRef.current, max_score: TOTAL,
        percentage: pct, age_group: user?.profile?.age_group || '3-6',
      });
      setAiFeed(res.data?.feedback);
    } catch {
      setAiFeed(passed ? 'Great job! You know your animals! 🌟' : 'Keep practicing! 💪');
    } finally { setLoadAI(false); }
  };

  if (!loaded) return <div style={S.loadScreen}>Loading... ✨</div>;

  if (screen === 'stages') return (
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => navigate('/student/dashboard')}>← Back</motion.button>
        <div style={S.headerTitle}>🔊 Animal Sounds</div>
        <div style={{ width:80 }} />
      </div>
      <div style={S.stageArea}>
        <h2 style={S.stageTitle}>Choose Your Stage</h2>
        <p style={S.stageSub}>Listen to the sound and find the animal! 🎤</p>
        <div style={S.stagesGrid}>
          {STAGES.map((s, i) => {
            const unlocked = unlockedStages.includes(i);
            return (
              <motion.div key={i}
                style={{ ...S.stageCard, opacity:unlocked?1:0.5,
                  border: stageIdx===i ? '2px solid #8B5CF6' : '1px solid #2D3A4F',
                  background: unlocked ? 'rgba(139,92,246,0.1)' : '#1E293B' }}
                whileHover={unlocked ? { scale:1.05, borderColor:'rgba(139,92,246,0.5)' } : {}}
                whileTap={unlocked ? { scale:0.95 } : {}}
                onClick={() => { if (unlocked) setStageIdx(i); }}>
                <div style={{ fontSize:32 }}>{unlocked ? '🔊' : '🔒'}</div>
                <div style={{ fontSize:15, fontWeight:800, color: unlocked?'#8B5CF6':'#4B5563', fontFamily:'Nunito,sans-serif' }}>{s.label}</div>
                {unlocked && <div style={{ fontSize:11, color:'#10B981', fontWeight:700 }}>✅ Open</div>}
              </motion.div>
            );
          })}
        </div>
        <motion.button style={{ ...S.startBtn, background:'linear-gradient(135deg,#8B5CF6,#EC4899)' }}
          whileHover={{ scale:1.05 }} onClick={() => startStage(stageIdx)}>
          Start Game 🚀
        </motion.button>
      </div>
    </div>
  );

  if (screen === 'result') {
    const pct = Math.round((scoreRef.current / TOTAL) * 100);
    const passed = pct >= STAGES[stageIdx].passMark;
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
    return (
      <div style={S.page}>
        <motion.div style={S.resultCard} initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}>
          <div style={{ fontSize:80 }}>{passed ? '🏆' : '💪'}</div>
          <h1 style={S.resultTitle}>{passed ? 'Well Done! 🎉' : 'Keep Trying!'}</h1>
          <div style={S.resultPct}>{pct}%</div>
          <p style={S.resultScore}>{scoreRef.current} / {TOTAL} Correct</p>
          <div style={S.starsRow}>{[1,2,3].map(n=><span key={n} style={{ fontSize:32, opacity:pct>=n*30?1:0.25 }}>⭐</span>)}</div>
          {passed && stageIdx+1 < STAGES.length && <div style={S.unlockedBox}>🎉 {STAGES[stageIdx+1].label} Unlocked!</div>}
          <div style={S.aiBox}>
            {loadingAI ? <div style={{ color:'#94A3B8', fontFamily:'Nunito,sans-serif' }}>🤖 AI analyzing...</div> : <p style={S.aiText}>{aiFeedback}</p>}
          </div>
          <div style={S.resultBtns}>
            <motion.button style={S.playBtn} whileHover={{ scale:1.04 }} onClick={() => setScreen('stages')}>Stages 🚀</motion.button>
            <motion.button style={S.homeBtn} whileHover={{ scale:1.04 }} onClick={() => navigate('/student/dashboard')}>Home 🏠</motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} onClick={() => setScreen('stages')}>← Stages</motion.button>
        <div style={S.headerTitle}>🔊 {STAGES[stageIdx].label}</div>
        <div style={S.scoreBadge}>⭐ {scoreRef.current}/{TOTAL}</div>
      </div>

      <div style={S.progressWrap}>
        <div style={S.progressTrack}>
          <motion.div style={S.progressFill} animate={{ width:`${((qNum + 1) / TOTAL) * 100}%` }} />
        </div>
      </div>

      <div style={S.gameArea}>
        <motion.div style={S.questionBox} key={qNum} initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }}>
          <p style={S.questionLabel}>Which animal says...</p>
          <div style={S.soundText}>"{question?.correct.sound}!"</div>
          <div style={{ fontSize:60 }}>❓</div>
        </motion.div>

        <div style={S.optionsGrid}>
          {question?.options.map((opt, i) => (
            <motion.button key={i}
              style={{
                ...S.optionBtn,
                background: feedback ? (opt.name === question.correct.name ? 'rgba(16,185,129,0.2)' : (feedback.chosen === opt.name ? 'rgba(239,68,68,0.15)' : '#1E293B')) : '#1E293B',
                borderColor: feedback ? (opt.name === question.correct.name ? '#10B981' : (feedback.chosen === opt.name ? '#EF4444' : '#2D3A4F')) : '#2D3A4F',
                color: feedback && opt.name === question.correct.name ? '#6EE7B7' : '#F1F5F9'
              }}
              whileHover={!feedback ? { scale:1.02, borderColor:'rgba(139,92,246,0.5)', background:'rgba(139,92,246,0.1)' } : {}}
              onClick={() => handlePick(opt)}>
              <div style={{ fontSize:40 }}>{opt.emoji}</div>
              <div style={{ fontWeight:700, fontFamily:'Nunito,sans-serif' }}>{opt.name}</div>
            </motion.button>
          ))}
        </div>

        <motion.button style={{ ...S.voiceBtn, background: listening ? '#EF4444' : '#8B5CF6' }}
          onClick={speak} disabled={!!feedback}>
          {listening ? '🔴 Listening...' : '🎤 Say Animal Name'}
        </motion.button>
        {heardText && <div style={S.heardTxt}>Heard: "{heardText}"</div>}
      </div>
    </div>
  );
}

const S = {
  loadScreen: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0B1120', color:'#94A3B8', fontFamily:'Nunito,sans-serif' },
  page:        { minHeight:'100vh', background:'#0B1120', display:'flex', flexDirection:'column' },
  header:      { background:'#1E293B', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #2D3A4F' },
  backBtn:     { background:'rgba(139,92,246,0.12)', color:'#8B5CF6', border:'1px solid rgba(139,92,246,0.3)', padding:'8px 16px', borderRadius:12, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  headerTitle: { fontSize:20, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' },
  scoreBadge:  { background:'rgba(245,158,11,0.15)', color:'#F59E0B', padding:'6px 14px', borderRadius:20, fontWeight:700, border:'1px solid rgba(245,158,11,0.3)', fontFamily:'Nunito,sans-serif' },
  progressWrap:{ padding:'10px 24px', background:'#1E293B', borderBottom:'1px solid #2D3A4F' },
  progressTrack:{ height:8, background:'#2D3A4F', borderRadius:10, overflow:'hidden' },
  progressFill:{ height:'100%', background:'linear-gradient(90deg,#8B5CF6,#EC4899)' },
  gameArea:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'20px', gap:15, justifyContent:'center' },
  questionBox: { background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:24, padding:'25px', textAlign:'center', boxShadow:'0 8px 30px rgba(0,0,0,0.3)', width:'100%', maxWidth:380 },
  questionLabel:{ fontSize:14, color:'#94A3B8', fontWeight:700, fontFamily:'Nunito,sans-serif' },
  soundText:   { fontSize:40, fontWeight:900, color:'#8B5CF6', margin:'10px 0', fontFamily:'Nunito,sans-serif' },
  optionsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, width:'100%', maxWidth:380 },
  optionBtn:   { padding:'15px', borderRadius:18, border:'1px solid #2D3A4F', cursor:'pointer', fontFamily:'inherit', background:'#1E293B', color:'#F1F5F9' },
  voiceBtn:    { width:'100%', maxWidth:380, padding:'15px', borderRadius:15, border:'none', color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  heardTxt:    { fontSize:13, color:'#64748B', fontFamily:'Nunito,sans-serif' },
  stageArea:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'30px 20px' },
  stageTitle:  { fontSize:24, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' },
  stageSub:    { color:'#64748B', marginBottom:30, fontFamily:'Nunito,sans-serif' },
  stagesGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:15, width:'100%', maxWidth:500, marginBottom:30 },
  stageCard:   { borderRadius:20, padding:'20px', textAlign:'center', cursor:'pointer' },
  startBtn:    { color:'#fff', padding:'15px 40px', borderRadius:15, fontSize:18, fontWeight:800, border:'none', fontFamily:'Nunito,sans-serif' },
  resultCard:  { background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:30, padding:'40px', textAlign:'center', maxWidth:400, margin:'auto', boxShadow:'0 20px 50px rgba(0,0,0,0.5)' },
  resultTitle: { fontSize:28, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' },
  resultPct:   { fontSize:60, fontWeight:900, color:'#8B5CF6', fontFamily:'Nunito,sans-serif' },
  resultScore: { fontSize:16, color:'#94A3B8', fontFamily:'Nunito,sans-serif' },
  starsRow:    { display:'flex', justifyContent:'center', gap:8, margin:'12px 0' },
  unlockedBox: { background:'rgba(16,185,129,0.15)', color:'#6EE7B7', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'10px 20px', fontSize:14, fontWeight:800, marginBottom:16, fontFamily:'Nunito,sans-serif' },
  aiBox:       { background:'rgba(99,102,241,0.08)', padding:'15px', borderRadius:15, margin:'20px 0', textAlign:'left', border:'1px solid rgba(99,102,241,0.2)' },
  aiText:      { fontSize:13, color:'#94A3B8', lineHeight:1.5, fontFamily:'Nunito,sans-serif' },
  resultBtns:  { display:'flex', gap:10, justifyContent:'center' },
  playBtn:     { background:'linear-gradient(135deg,#8B5CF6,#EC4899)', color:'#fff', padding:'12px 20px', borderRadius:12, border:'none', fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif', boxShadow:'0 4px 15px rgba(139,92,246,0.4)' },
  homeBtn:     { background:'rgba(30,41,59,0.8)', color:'#94A3B8', padding:'12px 20px', borderRadius:12, border:'1px solid #2D3A4F', fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
};