
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
                  border: stageIndex===i ? '3px solid #10B981' : '3px solid transparent',
                  background: unlocked ? '#D1FAE5' : '#F3F4F6' }}
                whileHover={unlocked?{scale:1.05}:{}} whileTap={unlocked?{scale:0.95}:{}}
                onClick={() => { if (unlocked) setStageIndex(i); }}>
                <div style={{ fontSize:32 }}>{unlocked ? '🐾' : '🔒'}</div>
                <div style={{ fontSize:15, fontWeight:800, color:unlocked?'#065F46':'#9CA3AF' }}>{s.name}</div>
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
            {loadingAI ? <div>🤖 AI Analyzing...</div> : <p style={S.aiText}>{aiFeedback}</p>}
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
              background: feedback ? (choice === currentQ.name ? '#D1FAE5' : (feedback === 'wrong' && choice === currentQ.name ? '#FEE2E2' : '#fff')) : '#fff',
              borderColor: feedback ? (choice === currentQ.name ? '#10B981' : '#E5E7EB') : '#E5E7EB'
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
  loadScreen:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F0FDF4' },
  page:        { minHeight:'100vh', background:'#F0FDF4', display:'flex', flexDirection:'column' },
  header:      { background:'#fff', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
  backBtn:     { background:'#D1FAE5', color:'#10B981', border:'none', padding:'8px 16px', borderRadius:12, fontWeight:700, cursor:'pointer' },
  headerTitle: { fontSize:20, fontWeight:900, color:'#1F1F2E' },
  scoreBadge:  { background:'#FEF3C7', color:'#D97706', padding:'6px 14px', borderRadius:20, fontWeight:700 },
  progressWrap:{ padding:'12px 24px', background:'#fff', display:'flex', alignItems:'center', gap:12 },
  progressTrack:{ flex:1, height:10, background:'#D1FAE5', borderRadius:10, overflow:'hidden' },
  progressFill:{ height:'100%', background:'#10B981' },
  roundText:   { fontSize:13, fontWeight:700, color:'#10B981' },
  gameArea:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'20px', gap:15 },
  questionBox: { background:'#fff', borderRadius:24, padding:'20px', textAlign:'center', boxShadow:'0 8px 25px rgba(0,0,0,0.05)', width:'100%', maxWidth:400 },
  questionLabel:{ fontSize:14, color:'#6B7280', fontWeight:700, margin:0 },
  hintBadge:   { background:'#D1FAE5', color:'#065F46', borderRadius:10, padding:'5px 12px', fontSize:13, fontWeight:700, display:'inline-block' },
  choicesGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%', maxWidth:400 },
  choiceBtn:   { padding:'15px', borderRadius:15, border:'2px solid #E5E7EB', fontWeight:700, cursor:'pointer', fontFamily:'inherit' },
  voiceArea:   { textAlign:'center', width:'100%' },
  micBtn:      { width:'100%', maxWidth:400, padding:'12px', borderRadius:12, border:'none', color:'#fff', fontWeight:800, cursor:'pointer' },
  heardTxt:    { fontSize:13, color:'#6B7280', marginTop:8 },
  feedbackPop: { position:'fixed', bottom:40, padding:'15px 30px', borderRadius:50, fontWeight:800, boxShadow:'0 10px 30px rgba(0,0,0,0.1)' },
  stageArea:   { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'30px 20px' },
  stageTitle:  { fontSize:24, fontWeight:900, marginBottom:5 },
  stageSub:    { color:'#6B7280', marginBottom:30 },
  stagesGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:15, width:'100%', maxWidth:600, marginBottom:30 },
  stageCard:   { borderRadius:20, padding:'20px', textAlign:'center', cursor:'pointer', boxShadow:'0 4px 10px rgba(0,0,0,0.05)' },
  startBtn:    { color:'#fff', padding:'15px 40px', borderRadius:15, fontSize:18, fontWeight:800, border:'none', cursor:'pointer' },
  resultCard:  { background:'#fff', borderRadius:30, padding:'40px', textAlign:'center', maxWidth:400, margin:'auto', boxShadow:'0 20px 50px rgba(0,0,0,0.1)' },
  resultTitle: { fontSize:28, fontWeight:900 },
  resultPct:   { fontSize:60, fontWeight:900, color:'#10B981' },
  aiBox:       { background:'#F8FAFC', padding:'15px', borderRadius:15, margin:'20px 0', textAlign:'left' },
  aiText:      { fontSize:13, color:'#475569', margin:0, lineHeight:1.5 },
  resultBtns:  { display:'flex', gap:10, justifyContent:'center' },
  playBtn:     { background:'#10B981', color:'#fff', padding:'12px 20px', borderRadius:12, border:'none', fontWeight:700, cursor:'pointer' },
  homeBtn:     { background:'#F1F5F9', color:'#475569', padding:'12px 20px', borderRadius:12, border:'none', fontWeight:700, cursor:'pointer' },
};