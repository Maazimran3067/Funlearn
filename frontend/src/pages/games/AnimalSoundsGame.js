import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { submitScore } from '../../services/api';
import useStageProgress from '../hooks/useStageProgress';

const ANIMALS = [
  { name:'Cat',     emoji:'🐱', sound:'Meow',  phonetics:['cat','meow','mew'] },
  { name:'Dog',     emoji:'🐶', sound:'Woof',  phonetics:['dog','woof','bark','ruff'] },
  { name:'Cow',     emoji:'🐮', sound:'Moo',   phonetics:['cow','moo','mu'] },
  { name:'Duck',    emoji:'🦆', sound:'Quack', phonetics:['duck','quack','kwak'] },
  { name:'Lion',    emoji:'🦁', sound:'Roar',  phonetics:['lion','roar','raa'] },
  { name:'Frog',    emoji:'🐸', sound:'Ribbit',phonetics:['frog','ribbit','ribbet'] },
  { name:'Bee',     emoji:'🐝', sound:'Buzz',  phonetics:['bee','buzz','buz'] },
  { name:'Elephant',emoji:'🐘', sound:'Trumpet',phonetics:['elephant','trumpet','toot'] },
];

const STAGES = [
  { stage:0, pool:[0,1,2,3],      label:'Stage 1' },
  { stage:1, pool:[0,1,2,3,4],    label:'Stage 2' },
  { stage:2, pool:[0,1,2,3,4,5],  label:'Stage 3' },
  { stage:3, pool:[2,3,4,5,6,7],  label:'Stage 4' },
  { stage:4, pool:[0,1,2,3,4,5,6,7], label:'Stage 5' },
];

function makeQ(stageIdx) {
  const pool = STAGES[stageIdx].pool;
  const correct = ANIMALS[pool[Math.floor(Math.random()*pool.length)]];
  const others = ANIMALS.filter(a => a.name !== correct.name)
    .sort(()=>Math.random()-0.5).slice(0,3);
  return { correct, options:[correct,...others].sort(()=>Math.random()-0.5) };
}

export default function AnimalSoundsGame() {
  const navigate = useNavigate();
  const { unlockedStages, unlockStage } = useStageProgress('animalsounds');
  const [screen,   setScreen]   = useState('stages');
  const [stageIdx, setStageIdx] = useState(0);
  const [question, setQuestion] = useState(null);
  const [qNum,     setQNum]     = useState(0);
  const [feedback, setFeedback] = useState(null);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const TOTAL = 5;

  // Voice
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);

  const startStage = (idx) => {
    setStageIdx(idx); scoreRef.current=0;
    setScore(0); setQNum(0); setFeedback(null);
    setQuestion(makeQ(idx)); setScreen('game');
  };

  const speak = () => {
    if (!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)) {
      alert('Voice recognition requires Chrome browser.'); return;
    }
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    const r = new SR();
    r.maxAlternatives = 10; r.lang = 'en-US';
    recogRef.current = r;
    r.onstart  = () => setListening(true);
    r.onend    = () => setListening(false);
    r.onerror  = () => setListening(false);
    r.onresult = (e) => {
      const alts = Array.from(e.results[0]).map(a => a.transcript.toLowerCase().trim());
      const matched = question.options.find(opt =>
        alts.some(a => opt.phonetics.some(ph => a.includes(ph)))
      );
      handlePick(matched || null, true);
    };
    r.start();
  };

  const handlePick = async (option, fromVoice=false) => {
    if (feedback) return;
    const correct = option?.name === question.correct.name;
    if (correct) { scoreRef.current+=1; setScore(scoreRef.current); }
    setFeedback({ correct, chosen: option?.name });
    setTimeout(async () => {
      setFeedback(null);
      if (qNum+1 >= TOTAL) {
        const pct = Math.round((scoreRef.current/TOTAL)*100);
        const stars = pct>=90?3:pct>=70?2:1;
        await submitScore({ game_id:'animalsounds', score:scoreRef.current,
          max_score:TOTAL, percentage:pct, stars, difficulty_level:stageIdx+1 }).catch(()=>{});
        if (pct >= 70) await unlockStage(stageIdx+1);
        setScreen('result');
      } else {
        setQNum(q=>q+1);
        setQuestion(makeQ(stageIdx));
      }
    }, 1000);
  };

  const pct = Math.round((score/TOTAL)*100);

  if (screen==='stages') return (
    <div style={{ minHeight:'100vh', background:'#0B1120', padding:'28px', marginLeft:220, marginTop:60 }}>
      <button onClick={()=>navigate('/student/dashboard')}
        style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer',
          fontSize:13, fontFamily:'Nunito,sans-serif', marginBottom:20 }}>
        ← Back to Dashboard
      </button>
      <div style={{ fontSize:22, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif', marginBottom:6 }}>
        🔊 Animal Sounds
      </div>
      <div style={{ fontSize:13, color:'#94A3B8', fontFamily:'Nunito,sans-serif', marginBottom:24 }}>
        Hear the sound and say or tap the animal!
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
        {STAGES.map((s,i)=>{
          const unlocked = unlockedStages.includes(i);
          return (
            <motion.div key={i}
              style={{ background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:16,
                padding:20, textAlign:'center', cursor:unlocked?'pointer':'not-allowed', opacity:unlocked?1:0.5 }}
              whileHover={unlocked?{ scale:1.04, borderColor:'rgba(139,92,246,0.4)',
                boxShadow:'0 8px 28px rgba(139,92,246,0.15)' }:{}}
              whileTap={unlocked?{ scale:0.96 }:{}}
              onClick={()=>unlocked&&startStage(i)}>
              <div style={{ fontSize:30, marginBottom:8 }}>{unlocked?'🔊':'🔒'}</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' }}>{s.label}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  if (screen==='result') return (
    <div style={{ minHeight:'100vh', background:'#0B1120', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={{ background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:24,
          padding:'40px 36px', textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:52, marginBottom:12 }}>{pct>=70?'🎉':'💪'}</div>
        <div style={{ fontSize:22, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif', marginBottom:8 }}>
          {pct>=70?'Well done!':'Keep going!'}
        </div>
        <div style={{ fontSize:40, fontWeight:900, color:'#8B5CF6', fontFamily:'Nunito,sans-serif', margin:'12px 0' }}>
          {pct}%
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:20 }}>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            onClick={()=>startStage(stageIdx)}
            style={{ padding:'10px 22px', borderRadius:12, border:'none',
              background:'linear-gradient(135deg,#8B5CF6,#A78BFA)', color:'#fff',
              fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}>
            Retry
          </motion.button>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            onClick={()=>setScreen('stages')}
            style={{ padding:'10px 22px', borderRadius:12, border:'1px solid #2D3A4F',
              background:'transparent', color:'#94A3B8', fontSize:14,
              fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}>
            Stages
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#0B1120', display:'flex',
      alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:500 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
          <span style={{ fontSize:13, color:'#94A3B8', fontFamily:'Nunito,sans-serif' }}>
            {qNum+1}/{TOTAL}</span>
          <span style={{ fontSize:13, color:'#8B5CF6', fontWeight:700, fontFamily:'Nunito,sans-serif' }}>
            ⭐ {score} correct</span>
        </div>
        <div style={{ height:5, background:'#2D3A4F', borderRadius:10, marginBottom:24, overflow:'hidden' }}>
          <motion.div style={{ height:'100%', background:'linear-gradient(90deg,#8B5CF6,#A78BFA)', borderRadius:10 }}
            animate={{ width:`${(qNum/TOTAL)*100}%` }}/>
        </div>

        {/* Animal to guess */}
        <div style={{ background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:20,
          padding:'28px', textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:13, color:'#94A3B8', fontFamily:'Nunito,sans-serif', marginBottom:12 }}>
            This animal says: <strong style={{ color:'#8B5CF6' }}>{question?.correct.sound}!</strong>
          </div>
          <motion.div style={{ fontSize:80 }}
            animate={{ scale:[1,1.05,1] }} transition={{ duration:1.5, repeat:Infinity }}>
            ❓
          </motion.div>
          <div style={{ fontSize:13, color:'#64748B', fontFamily:'Nunito,sans-serif', marginTop:8 }}>
            Which animal is it?
          </div>
        </div>

        {/* Tap options */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          {question?.options.map((opt,i)=>{
            const isCorrect = opt.name === question.correct.name;
            const wasChosen = feedback?.chosen === opt.name;
            return (
              <motion.button key={i}
                style={{ padding:'16px 10px', borderRadius:14, border:'1px solid #2D3A4F',
                  background: feedback
                    ? isCorrect ? 'rgba(16,185,129,0.2)'
                    : wasChosen ? 'rgba(239,68,68,0.15)' : 'rgba(30,41,59,0.5)'
                    : 'rgba(30,41,59,0.6)',
                  cursor:'pointer', textAlign:'center',
                  border: feedback
                    ? isCorrect ? '1px solid rgba(16,185,129,0.5)'
                    : wasChosen ? '1px solid rgba(239,68,68,0.4)' : '1px solid #2D3A4F'
                    : '1px solid #2D3A4F' }}
                whileHover={!feedback?{ scale:1.04, borderColor:'rgba(139,92,246,0.4)',
                  background:'rgba(139,92,246,0.1)' }:{}}
                whileTap={!feedback?{ scale:0.96 }:{}}
                onClick={()=>!feedback&&handlePick(opt)}>
                <div style={{ fontSize:36 }}>{opt.emoji}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#F1F5F9',
                  fontFamily:'Nunito,sans-serif', marginTop:6 }}>{opt.name}</div>
              </motion.button>
            );
          })}
        </div>

        {/* Voice button */}
        <motion.button
          style={{ width:'100%', padding:'13px', borderRadius:12, border:'none',
            background: listening ? 'linear-gradient(135deg,#EF4444,#F87171)'
              : 'linear-gradient(135deg,#8B5CF6,#A78BFA)',
            color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer',
            fontFamily:'Nunito,sans-serif',
            boxShadow: listening ? '0 4px 20px rgba(239,68,68,0.4)' : '0 4px 20px rgba(139,92,246,0.35)' }}
          whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
          onClick={speak}>
          {listening ? '🔴 Listening... (say the animal name)' : '🎤 Say the Animal Name'}
        </motion.button>

        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ textAlign:'center', marginTop:14, fontSize:17, fontWeight:800,
                color:feedback.correct?'#10B981':'#EF4444', fontFamily:'Nunito,sans-serif' }}>
              {feedback.correct ? '✅ Correct!' : `❌ It was ${question?.correct.name} ${question?.correct.emoji}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
