
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore, getGameFeedback } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useStageProgress from '../../hooks/useStageProgress';

const STAGES = [
  {
    name: 'Stage 1', passMark: 70, questions: 5,
    animals: [
      { name:'Tiger',   emoji:'🐯', fact:'Has stripes',   choices:['Tiger','Lion','Leopard','Cheetah'] },
      { name:'Penguin', emoji:'🐧', fact:'Cannot fly',    choices:['Penguin','Eagle','Parrot','Owl'] },
      { name:'Giraffe', emoji:'🦒', fact:'Has long neck', choices:['Giraffe','Camel','Horse','Zebra'] },
      { name:'Monkey',  emoji:'🐒', fact:'Loves bananas', choices:['Monkey','Gorilla','Bear','Fox'] },
      { name:'Shark',   emoji:'🦈', fact:'Lives in sea',  choices:['Shark','Dolphin','Whale','Fish'] },
    ]
  },
  {
    name: 'Stage 2', passMark: 70, questions: 5,
    animals: [
      { name:'Crocodile', emoji:'🐊', fact:'Has sharp teeth',  choices:['Crocodile','Lizard','Snake','Turtle'] },
      { name:'Flamingo',  emoji:'🦩', fact:'Stands on one leg',choices:['Flamingo','Parrot','Pelican','Stork'] },
      { name:'Panda',     emoji:'🐼', fact:'Eats bamboo',      choices:['Panda','Koala','Bear','Raccoon'] },
      { name:'Kangaroo',  emoji:'🦘', fact:'Carries babies',   choices:['Kangaroo','Rabbit','Wallaby','Deer'] },
      { name:'Octopus',   emoji:'🐙', fact:'Has eight arms',   choices:['Octopus','Squid','Jellyfish','Crab'] },
    ]
  },
  {
    name: 'Stage 3', passMark: 70, questions: 5,
    animals: [
      { name:'Peacock',    emoji:'🦚', fact:'Has beautiful tail',   choices:['Peacock','Parrot','Turkey','Pheasant'] },
      { name:'Rhinoceros', emoji:'🦏', fact:'Has a horn on nose',   choices:['Rhinoceros','Hippo','Elephant','Buffalo'] },
      { name:'Chameleon',  emoji:'🦎', fact:'Changes colour',       choices:['Chameleon','Gecko','Lizard','Iguana'] },
      { name:'Platypus',   emoji:'🦦', fact:'Lays eggs but mammal', choices:['Platypus','Otter','Beaver','Wombat'] },
      { name:'Narwhal',    emoji:'🦄', fact:'Has a long tusk',      choices:['Narwhal','Dolphin','Whale','Walrus'] },
    ]
  },
  {
    name: 'Stage 4', passMark: 70, questions: 5,
    animals: [
      { name:'Axolotl',   emoji:'🦎', fact:'Can regrow its limbs',  choices:['Axolotl','Salamander','Newt','Gecko'] },
      { name:'Meerkat',   emoji:'🐾', fact:'Lives in the desert',   choices:['Meerkat','Mongoose','Prairie dog','Ferret'] },
      { name:'Mandrill',  emoji:'🐒', fact:'Has colourful face',    choices:['Mandrill','Baboon','Macaque','Gorilla'] },
      { name:'Pangolin',  emoji:'🐾', fact:'Covered in scales',     choices:['Pangolin','Armadillo','Hedgehog','Porcupine'] },
      { name:'Capybara',  emoji:'🐾', fact:'World\'s largest rodent',choices:['Capybara','Beaver','Otter','Nutria'] },
    ]
  },
];

export default function AnimalSounds() {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { unlockedStages, unlockStage, loaded } = useStageProgress('animals');

  const [stageIndex, setStageIndex] = useState(0);
  const [playing,    setPlaying]    = useState(false);
  const [qIdx,       setQIdx]       = useState(0);
  const [feedback,   setFeedback]   = useState(null);
  const [stageOver,  setStageOver]  = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [loadingAI,  setLoadingAI]  = useState(false);
  const [micState,   setMicState]   = useState('idle');
  const [heardText,  setHeardText]  = useState('');
  const [voiceOK,    setVoiceOK]    = useState(false);

  const recRef      = useRef(null);
  const answerDone  = useRef(false);
  const scoreRef    = useRef(0);
  const startTime   = useRef(Date.now());
  const qIdxRef     = useRef(0);

  const currentStage = STAGES[stageIndex];
  const currentQ     = currentStage.animals[qIdx % currentStage.animals.length];

  useEffect(() => { qIdxRef.current = qIdx; }, [qIdx]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceOK(false); return; }
    setVoiceOK(true);
    const r = new SR();
    r.lang = 'en-US'; r.continuous = false; r.interimResults = false; r.maxAlternatives = 5;

    r.onresult = (e) => {
      if (answerDone.current) return;
      const results = e.results[0];
      const heard = [];
      for (let i = 0; i < results.length; i++) heard.push(results[i].transcript.toLowerCase().trim());
      
      const animalName = STAGES[stageIndex].animals[qIdxRef.current].name.toLowerCase();
      setHeardText(heard[0]);
      setMicState('done');
      
      const matched = heard.some(h => h.includes(animalName));
      processResult(matched);
    };

    r.onerror = (e) => { setMicState('idle'); if (e.error !== 'aborted') setHeardText('Try again!'); };
    r.onend   = () => { if (micState === 'listening') setMicState('idle'); };
    recRef.current = r;
    return () => { try { r.abort(); } catch {} };
  }, [stageIndex]);

  const startMic = () => {
    if (answerDone.current || feedback) return;
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

    if (correct) { scoreRef.current += 1; setFeedback('correct'); }
    else setFeedback('wrong');

    setTimeout(() => {
      if (qIdxRef.current + 1 >= currentStage.questions) {
        setStageOver(true);
      } else {
        setQIdx(q => q + 1);
        setFeedback(null);
        setHeardText('');
        setMicState('idle');
        answerDone.current = false;
      }
    }, 1500);
  };

  const tapAnswer = (choice) => {
    if (feedback || answerDone.current) return;
    processResult(choice === currentQ.name);
  };

  const startStage = () => {
    scoreRef.current = 0; 
    answerDone.current = false;
    qIdxRef.current = 0;
    setQIdx(0); 
    setFeedback(null); 
    setHeardText(''); 
    setMicState('idle');
    setStageOver(false); 
    setPlaying(true); 
    startTime.current = Date.now();
  };

  const handleStageComplete = async () => {
    const pct = Math.min(100, Math.round((scoreRef.current / currentStage.questions) * 100));
    const passed = pct >= currentStage.passMark;
    
    submitScore({ 
      game_id:'animals', 
      score:scoreRef.current, 
      max_score:currentStage.questions,
      time_taken:Math.floor((Date.now()-startTime.current)/1000),
      difficulty_level:stageIndex+1, 
      percentage:pct 
    }).catch(()=>{});

    if (passed && stageIndex + 1 < STAGES.length) unlockStage(stageIndex + 1);
    
    setLoadingAI(true);
    try {
      const res = await getGameFeedback({ 
        game_id:'animals', 
        score:scoreRef.current,
        max_score:currentStage.questions, 
        percentage:pct,
        age_group: user?.profile?.age_group || '6-9' 
      });
      setAiFeedback(res.data?.feedback);
    } catch {
      setAiFeedback(passed ? 'Amazing! You know your animals! 🐾🌟' : 'Keep studying the animals! 💪');
    } finally { setLoadingAI(false); }
  };

  useEffect(() => { if (stageOver) handleStageComplete(); }, [stageOver]);

  if (!loaded) return <div style={S.loadScreen}>Loading... ✨</div>;

  if (!playing) return (
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} whileHover={{ scale:1.05 }} onClick={() => navigate('/student/dashboard')}>← Back</motion.button>
        <div style={S.headerTitle}>🐾 Animal Kingdom</div>
        <div style={{ width:80 }} />
      </div>
      <div style={S.stageArea}>
        <h2 style={S.stageTitle}>Choose Your Stage</h2>
        <p style={S.stageSub}>See the animal — say or tap its name! Score 70% to unlock next! 🎤</p>
        <div style={S.stagesGrid}>
          {STAGES.map((s, i) => {
            const unlocked = unlockedStages.includes(i);
            return (
              <motion.div key={i}
                style={{ ...S.stageCard, opacity:unlocked?1:0.5,
                  border: stageIndex===i ? '2px solid #10B981' : '1px solid #2D3A4F',
                  background: unlocked ? 'rgba(16,185,129,0.1)' : '#1E293B' }}
                whileHover={unlocked?{scale:1.05}:{}} whileTap={unlocked?{scale:0.95}:{}}
                onClick={() => { if (unlocked) setStageIndex(i); }}>
                <div style={{ fontSize:32 }}>{unlocked ? '🐾' : '🔒'}</div>
                <div style={{ fontSize:15, fontWeight:800, color:unlocked?'#10B981':'#4B5563', fontFamily:'Nunito,sans-serif' }}>{s.name}</div>
                <div style={{ fontSize:20, marginTop:4 }}>{s.animals.slice(0,4).map(a=>a.emoji).join(' ')}</div>
                {unlocked && <div style={{ fontSize:11, color:'#10B981', fontWeight:700, marginTop:4 }}>✅ Unlocked</div>}
              </motion.div>
            );
          })}
        </div>
        <motion.button style={{ ...S.startBtn, background:'linear-gradient(135deg,#10B981,#3B82F6)' }}
          whileHover={{ scale:1.05 }} onClick={startStage}>
          Start {STAGES[stageIndex].name} 🚀
        </motion.button>
      </div>
    </div>
  );

  if (stageOver) {
    const pct = Math.min(100, Math.round((scoreRef.current / currentStage.questions) * 100));
    const passed = pct >= currentStage.passMark;
    return (
      <div style={S.page}>
        <motion.div style={S.resultCard} initial={{ scale:0.5, opacity:0 }} animate={{ scale:1, opacity:1 }}>
          <div style={{ fontSize:80 }}>{passed ? '🏆' : '💪'}</div>
          <h1 style={S.resultTitle}>{passed ? 'Stage Passed! 🎉' : 'Try Again!'}</h1>
          <p style={S.resultScore}>{scoreRef.current}/{currentStage.questions} correct</p>
          <div style={S.resultPct}>{pct}%</div>
          <div style={S.starsRow}>{[1,2,3].map(n=><span key={n} style={{ fontSize:36, opacity:pct>=n*30?1:0.25 }}>⭐</span>)}</div>
          {passed && stageIndex+1 < STAGES.length && (
            <div style={S.unlockedBox}>🎉 {STAGES[stageIndex+1].name} Unlocked!</div>
          )}
          <div style={S.aiBox}>
            {loadingAI ? <div style={S.aiRow}><span>🤖</span><span>AI Analyzing...</span></div> : <><div style={S.aiRow}><span>🤖</span><strong style={{color:'#8B5CF6'}}>AI Tutor Feedback</strong></div><p style={S.aiText}>{aiFeedback}</p></>}
          </div>
          <div style={S.resultBtns}>
            <motion.button style={S.playBtn} onClick={() => { setPlaying(false); setStageOver(false); }}>
              {passed ? 'Next Stage 🚀' : 'Try Again 🔄'}
            </motion.button>
            <motion.button style={S.homeBtn} onClick={() => navigate('/student/dashboard')}>Home 🏠</motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} onClick={() => { stopMic(); setPlaying(false); }}>← Stages</motion.button>
        <div style={S.headerTitle}>🐾 {currentStage.name}</div>
        <div style={S.scoreBadge}>⭐ {scoreRef.current}/{currentStage.questions}</div>
      </div>

      <div style={S.progressWrap}>
        <div style={S.progressTrack}>
          <motion.div style={S.progressFill} animate={{ width:`${((qIdx+1)/currentStage.questions)*100}%` }} />
        </div>
        <span style={S.roundText}>Q{qIdx+1}/{currentStage.questions}</span>
      </div>

      <div style={S.gameArea}>
        <motion.div style={S.questionBox} key={qIdx} initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }}>
          <p style={S.questionLabel}>Identify this animal:</p>
          <div style={{ fontSize:100, margin:'10px 0' }}>{currentQ.emoji}</div>
          <div style={S.hintBadge}>💡 {currentQ.fact}</div>
        </motion.div>

        <div style={S.choicesGrid}>
          {currentQ.choices.map((choice, i) => (
            <motion.button key={i} style={{
              ...S.choiceBtn,
              background: feedback ? (choice === currentQ.name ? '#D1FAE5' : '#1E293B') : '#1E293B',
              borderColor: feedback ? (choice === currentQ.name ? '#10B981' : '#2D3A4F') : '#2D3A4F',
              color: feedback ? (choice === currentQ.name ? '#065F46' : '#64748B') : '#F1F5F9'
            }}
            whileHover={!feedback ? { scale:1.02 } : {}}
            onClick={() => tapAnswer(choice)}>
              {choice}
            </motion.button>
          ))}
        </div>

        {voiceOK ? (
          <div style={S.voiceArea}>
            <motion.button style={{ ...S.micBtn, background: micState==='listening'?'#EF4444':'#10B981' }}
              animate={micState==='listening'?{ scale:[1,1.05,1] }:{}}
              transition={{ repeat:Infinity, duration:0.8 }}
              onClick={micState==='listening' ? stopMic : startMic}
              disabled={!!feedback}>
              {micState==='idle' ? '🎤 Say Name' : micState==='listening' ? '⏹️ Stop' : '✓'}
            </motion.button>
            {heardText && <div style={S.heardTxt}>I heard: "{heardText}"</div>}
          </div>
        ) : (
          <div style={S.noVoice}>⚠️ Use Chrome for Voice</div>
        )}

        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }} style={{
              ...S.feedbackPop,
              background: feedback==='correct' ? '#D1FAE5' : '#FEE2E2',
              color: feedback==='correct' ? '#065F46' : '#991B1B'
            }}>
              {feedback==='correct' ? '✅ Correct! It\'s a ' + currentQ.name : '❌ It\'s a ' + currentQ.name}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const S = {
  loadScreen:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0B1120', color:'#94A3B8', fontFamily:'Nunito,sans-serif' },
  page:        { minHeight:'100vh', background:'#0B1120', display:'flex', flexDirection:'column' },
  header:      { background:'#1E293B', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #2D3A4F' },
  backBtn:     { background:'rgba(16,185,129,0.12)', color:'#10B981', border:'1px solid rgba(16,185,129,0.3)', padding:'8px 16px', borderRadius:12, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  headerTitle: { fontSize:20, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' },
  scoreBadge:  { background:'rgba(245,158,11,0.15)', color:'#F59E0B', padding:'6px 14px', borderRadius:20, fontWeight:700, border:'1px solid rgba(245,158,11,0.3)' },
  progressWrap:{ padding:'12px 24px', background:'#1E293B', borderBottom:'1px solid #2D3A4F', display:'flex', alignItems:'center', gap:12 },
  progressTrack:{ flex:1, height:10, background:'#2D3A4F', borderRadius:10, overflow:'hidden' },
  progressFill:{ height:'100%', background:'linear-gradient(90deg,#10B981,#06B6D4)' },
  roundText:   { fontSize:13, fontWeight:700, color:'#10B981', fontFamily:'Nunito,sans-serif' },
  gameArea:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'20px', gap:15 },
  questionBox: { background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:24, padding:'20px', textAlign:'center', boxShadow:'0 8px 32px rgba(0,0,0,0.3)', width:'100%', maxWidth:400 },
  questionLabel:{ fontSize:14, color:'#94A3B8', fontWeight:700, margin:0, fontFamily:'Nunito,sans-serif' },
  hintBadge:   { background:'rgba(16,185,129,0.1)', color:'#10B981', borderRadius:10, padding:'5px 12px', fontSize:13, fontWeight:700, display:'inline-block', border:'1px solid rgba(16,185,129,0.3)' },
  choicesGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:400 },
  choiceBtn:   { padding:'15px', borderRadius:15, border:'1px solid #2D3A4F', fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif', background:'#1E293B', color:'#F1F5F9' },
  voiceArea:   { textAlign:'center', width:'100%' },
  micBtn:      { width:'100%', maxWidth:400, padding:'12px', borderRadius:12, border:'none', color:'#fff', fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  heardTxt:    { fontSize:13, color:'#64748B', marginTop:8, fontFamily:'Nunito,sans-serif' },
  feedbackPop: { position:'fixed', bottom:40, padding:'15px 30px', borderRadius:50, fontWeight:800, boxShadow:'0 10px 30px rgba(0,0,0,0.4)', fontFamily:'Nunito,sans-serif' },
  stageArea:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'30px 20px' },
  stageTitle:  { fontSize:24, fontWeight:900, marginBottom:5, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' },
  stageSub:    { color:'#64748B', marginBottom:30, fontFamily:'Nunito,sans-serif' },
  stagesGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:15, width:'100%', maxWidth:600, marginBottom:30 },
  stageCard:   { borderRadius:20, padding:'20px', textAlign:'center', cursor:'pointer' },
  startBtn:    { color:'#fff', padding:'15px 40px', borderRadius:15, fontSize:18, fontWeight:800, border:'none', cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  resultCard:  { background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:32, padding:'40px 36px', textAlign:'center', maxWidth:460, width:'90%', margin:'6vh auto', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' },
  resultTitle: { fontSize:30, fontWeight:900, color:'#F1F5F9', margin:'12px 0 8px', fontFamily:'Nunito,sans-serif' },
  resultScore: { fontSize:16, color:'#94A3B8', margin:'0 0 8px', fontFamily:'Nunito,sans-serif' },
  resultPct:   { fontSize:64, fontWeight:900, color:'#10B981', fontFamily:'Nunito,sans-serif' },
  starsRow:    { display:'flex', justifyContent:'center', gap:8, margin:'12px 0 16px' },
  unlockedBox: { background:'rgba(16,185,129,0.15)', color:'#6EE7B7', border:'1px solid rgba(16,185,129,0.3)', borderRadius:12, padding:'10px 20px', fontSize:14, fontWeight:800, marginBottom:16, fontFamily:'Nunito,sans-serif' },
  aiBox:       { background:'rgba(99,102,241,0.08)', borderRadius:14, padding:'14px 16px', marginBottom:20, border:'1px solid rgba(99,102,241,0.2)', textAlign:'left', width:'100%' },
  aiRow:       { display:'flex', alignItems:'center', gap:8, marginBottom:6, fontWeight:600, color:'#94A3B8', fontFamily:'Nunito,sans-serif' },
  aiText:      { fontSize:13, color:'#94A3B8', lineHeight:1.5, margin:0, fontFamily:'Nunito,sans-serif' },
  resultBtns:  { display:'flex', gap:10, justifyContent:'center' },
  playBtn:     { background:'linear-gradient(135deg,#10B981,#3B82F6)', color:'#fff', padding:'14px 24px', borderRadius:16, border:'none', fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif', fontSize:16, boxShadow:'0 4px 15px rgba(16,185,129,0.4)' },
  homeBtn:     { background:'rgba(30,41,59,0.8)', color:'#94A3B8', padding:'14px 24px', borderRadius:16, border:'1px solid #2D3A4F', fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif', fontSize:16 },
};