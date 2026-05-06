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
                  border: stageIdx===i ? '3px solid #8B5CF6' : '3px solid transparent',
                  background: unlocked ? '#EDE9FE' : '#F3F4F6' }}
                whileTap={unlocked ? { scale:0.95 } : {}}
                onClick={() => { if (unlocked) setStageIdx(i); }}>
                <div style={{ fontSize:32 }}>{unlocked ? '🔊' : '🔒'}</div>
                <div style={{ fontSize:15, fontWeight:800, color: unlocked?'#7C3AED':'#9CA3AF' }}>{s.label}</div>
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
    return (
      <div style={S.page}>
        <motion.div style={S.resultCard} initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}>
          <div style={{ fontSize:80 }}>{passed ? '🏆' : '💪'}</div>
          <h1 style={S.resultTitle}>{passed ? 'Well Done! 🎉' : 'Keep Trying!'}</h1>
          <div style={S.resultPct}>{pct}%</div>
          <p style={S.resultScore}>{scoreRef.current} / {TOTAL} Correct</p>
          <div style={S.aiBox}>
            {loadingAI ? <div>🤖 AI analyzing...</div> : <p style={S.aiText}>{aiFeedback}</p>}
          </div>
          <div style={S.resultBtns}>
            <motion.button style={S.playBtn} onClick={() => setScreen('stages')}>Stages 🚀</motion.button>
            <motion.button style={S.homeBtn} onClick={() => navigate('/student/dashboard')}>Home 🏠</motion.button>
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
                background: feedback ? (opt.name === question.correct.name ? '#D1FAE5' : (feedback.chosen === opt.name ? '#FEE2E2' : '#fff')) : '#fff',
                borderColor: feedback ? (opt.name === question.correct.name ? '#10B981' : (feedback.chosen === opt.name ? '#EF4444' : '#E5E7EB')) : '#E5E7EB'
              }}
              whileHover={!feedback ? { scale:1.02 } : {}}
              onClick={() => handlePick(opt)}>
              <div style={{ fontSize:40 }}>{opt.emoji}</div>
              <div style={{ fontWeight:700 }}>{opt.name}</div>
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
  loadScreen: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FDF4FF' },
  page:        { minHeight:'100vh', background:'#FDF4FF', display:'flex', flexDirection:'column' },
  header:      { background:'#fff', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
  backBtn:     { background:'#EDE9FE', color:'#7C3AED', border:'none', padding:'8px 16px', borderRadius:12, fontWeight:700, cursor:'pointer' },
  headerTitle: { fontSize:20, fontWeight:900, color:'#1F1F2E' },
  scoreBadge:  { background:'#FEF3C7', color:'#D97706', padding:'6px 14px', borderRadius:20, fontWeight:700 },
  progressWrap:{ padding:'10px 24px', background:'#fff' },
  progressTrack:{ height:8, background:'#EDE9FE', borderRadius:10, overflow:'hidden' },
  progressFill:{ height:'100%', background:'#8B5CF6' },
  gameArea:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'20px', gap:15, justifyContent:'center' },
  questionBox: { background:'#fff', borderRadius:24, padding:'25px', textAlign:'center', boxShadow:'0 8px 30px rgba(0,0,0,0.05)', width:'100%', maxWidth:380 },
  questionLabel:{ fontSize:14, color:'#6B7280', fontWeight:700 },
  soundText:   { fontSize:40, fontWeight:900, color:'#7C3AED', margin:'10px 0' },
  optionsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, width:'100%', maxWidth:380 },
  optionBtn:   { padding:'15px', borderRadius:18, border:'2px solid #E5E7EB', cursor:'pointer', fontFamily:'inherit' },
  voiceBtn:    { width:'100%', maxWidth:380, padding:'15px', borderRadius:15, border:'none', color:'#fff', fontWeight:800, cursor:'pointer' },
  heardTxt:    { fontSize:13, color:'#6B7280' },
  stageArea:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'30px 20px' },
  stageTitle:  { fontSize:24, fontWeight:900 },
  stageSub:    { color:'#6B7280', marginBottom:30 },
  stagesGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:15, width:'100%', maxWidth:500, marginBottom:30 },
  stageCard:   { borderRadius:20, padding:'20px', textAlign:'center', cursor:'pointer', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' },
  startBtn:    { color:'#fff', padding:'15px 40px', borderRadius:15, fontSize:18, fontWeight:800, border:'none' },
  resultCard:  { background:'#fff', borderRadius:30, padding:'40px', textAlign:'center', maxWidth:400, margin:'auto', boxShadow:'0 20px 50px rgba(0,0,0,0.1)' },
  resultTitle: { fontSize:28, fontWeight:900 },
  resultPct:   { fontSize:60, fontWeight:900, color:'#8B5CF6' },
  aiBox:       { background:'#F8FAFC', padding:'15px', borderRadius:15, margin:'20px 0', textAlign:'left' },
  aiText:      { fontSize:13, color:'#475569', lineHeight:1.5 },
  resultBtns:  { display:'flex', gap:10, justifyContent:'center' },
  playBtn:     { background:'#8B5CF6', color:'#fff', padding:'12px 20px', borderRadius:12, border:'none', fontWeight:700 },
  homeBtn:     { background:'#F1F5F9', color:'#475569', padding:'12px 20px', borderRadius:12, border:'none', fontWeight:700 },
};