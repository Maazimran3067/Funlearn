import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { submitScore } from '../../services/api';
import useStageProgress from '../hooks/useStageProgress';

const STAGES = [
  { stage:0, label:'Stage 1', count:[1,3],  pass:70 },
  { stage:1, label:'Stage 2', count:[4,6],  pass:70 },
  { stage:2, label:'Stage 3', count:[7,10], pass:70 },
  { stage:3, label:'Stage 4', count:[5,12], pass:70 },
  { stage:4, label:'Stage 5', count:[8,15], pass:70 },
];

const EMOJIS = ['🍎','🌟','🐣','🎈','🍭','🦋','🌸','🍊','🐥','💎','🎀','🍇'];

function makeQuestion(stage) {
  const [min, max] = STAGES[stage].count;
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const wrong1 = count === 1 ? 2 : count - 1;
  const wrong2 = count === max ? count - 2 : count + 1;
  const wrong3 = count >= 3 ? count - 2 : count + 2;
  const opts = [count, wrong1, wrong2, wrong3]
    .filter((v,i,a) => v > 0 && a.indexOf(v) === i)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  if (!opts.includes(count)) opts[0] = count;
  return { count, emoji: EMOJIS[Math.floor(Math.random()*EMOJIS.length)], options: opts.sort(()=>Math.random()-0.5) };
}

export default function NumberBuddyGame() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const { unlockedStages, unlockStage } = useStageProgress('numbers');
  const [screen,   setScreen]   = useState('stages');
  const [stageIdx, setStageIdx] = useState(0);
  const [question, setQuestion] = useState(null);
  const [qNum,     setQNum]     = useState(0);
  const [score,    setScore]    = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [done,     setDone]     = useState(false);
  const scoreRef = useRef(0);
  const TOTAL = 5;

  const startStage = (idx) => {
    setStageIdx(idx); scoreRef.current = 0;
    setScore(0); setQNum(0); setDone(false);
    setQuestion(makeQuestion(idx)); setScreen('game');
  };

  const handleAnswer = async (chosen) => {
    if (feedback) return;
    const correct = chosen === question.count;
    if (correct) { scoreRef.current += 1; setScore(scoreRef.current); }
    setFeedback(correct ? 'correct' : 'wrong');
    setTimeout(async () => {
      setFeedback(null);
      if (qNum + 1 >= TOTAL) {
        const pct = Math.round((scoreRef.current / TOTAL) * 100);
        const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
        await submitScore({ game_id:'numbers', score:scoreRef.current, max_score:TOTAL,
          percentage:pct, stars, difficulty_level:stageIdx+1 }).catch(()=>{});
        if (pct >= STAGES[stageIdx].pass) {
          await unlockStage(stageIdx + 1);
        }
        setDone(true); setScreen('result');
      } else {
        setQNum(q => q + 1);
        setQuestion(makeQuestion(stageIdx));
      }
    }, 900);
  };

  const pct = Math.round((score / TOTAL) * 100);

  if (screen === 'stages') return (
    <div style={{ minHeight:'100vh', background:'#0B1120', padding:'28px', marginLeft:220, marginTop:60 }}>
      <button onClick={()=>navigate('/student/dashboard')}
        style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer',
          fontSize:13, fontFamily:'Nunito,sans-serif', marginBottom:20, display:'flex', alignItems:'center', gap:6 }}>
        ← Back to Dashboard
      </button>
      <div style={{ fontSize:22, fontWeight:900, color:'#F1F5F9',
        fontFamily:'Nunito,sans-serif', marginBottom:6 }}>🔢 Number Buddy</div>
      <div style={{ fontSize:13, color:'#94A3B8', fontFamily:'Nunito,sans-serif', marginBottom:24 }}>
        Count the objects and pick the right number!
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14 }}>
        {STAGES.map((s,i) => {
          const unlocked = unlockedStages.includes(i);
          return (
            <motion.div key={i}
              style={{ background:'#1E293B', border:`1px solid ${unlocked?'#2D3A4F':'#1E2D45'}`,
                borderRadius:16, padding:20, cursor:unlocked?'pointer':'not-allowed',
                opacity:unlocked?1:0.5, textAlign:'center' }}
              whileHover={unlocked?{ scale:1.04, borderColor:'rgba(249,115,22,0.4)',
                boxShadow:'0 8px 28px rgba(249,115,22,0.15)' }:{}}
              whileTap={unlocked?{ scale:0.96 }:{}}
              onClick={() => unlocked && startStage(i)}>
              <div style={{ fontSize:32, marginBottom:8 }}>{unlocked?'🔢':'🔒'}</div>
              <div style={{ fontSize:14, fontWeight:800, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' }}>
                {s.label}</div>
              <div style={{ fontSize:11, color:'#64748B', fontFamily:'Nunito,sans-serif', marginTop:4 }}>
                Count {s.count[0]}–{s.count[1]}</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  if (screen === 'result') return (
    <div style={{ minHeight:'100vh', background:'#0B1120', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={{ background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:24,
          padding:'40px 36px', textAlign:'center', maxWidth:380, width:'100%' }}>
        <div style={{ fontSize:52, marginBottom:12 }}>{pct >= 70 ? '🎉' : '💪'}</div>
        <div style={{ fontSize:22, fontWeight:900, color:'#F1F5F9',
          fontFamily:'Nunito,sans-serif', marginBottom:6 }}>
          {pct >= 70 ? 'Great job!' : 'Keep trying!'}
        </div>
        <div style={{ fontSize:36, fontWeight:900, color:'#F97316',
          fontFamily:'Nunito,sans-serif', margin:'12px 0' }}>{pct}%</div>
        <div style={{ fontSize:14, color:'#94A3B8', fontFamily:'Nunito,sans-serif', marginBottom:20 }}>
          {score} / {TOTAL} correct
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            onClick={() => startStage(stageIdx)}
            style={{ padding:'10px 24px', borderRadius:12, border:'none',
              background:'linear-gradient(135deg,#F97316,#FB923C)',
              color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer',
              fontFamily:'Nunito,sans-serif', boxShadow:'0 4px 16px rgba(249,115,22,0.35)' }}>
            Play Again
          </motion.button>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            onClick={() => setScreen('stages')}
            style={{ padding:'10px 24px', borderRadius:12, border:'1px solid #2D3A4F',
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
      <div style={{ width:'100%', maxWidth:480 }}>
        {/* Progress */}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
          <span style={{ fontSize:13, color:'#94A3B8', fontFamily:'Nunito,sans-serif' }}>
            Question {qNum+1} / {TOTAL}
          </span>
          <span style={{ fontSize:13, color:'#F97316', fontFamily:'Nunito,sans-serif', fontWeight:700 }}>
            ⭐ {score} correct
          </span>
        </div>
        <div style={{ height:5, background:'#2D3A4F', borderRadius:10, marginBottom:24, overflow:'hidden' }}>
          <motion.div style={{ height:'100%', background:'linear-gradient(90deg,#F97316,#FB923C)',
            borderRadius:10 }} animate={{ width:`${((qNum)/TOTAL)*100}%` }}/>
        </div>

        {/* Object display */}
        <motion.div key={qNum}
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:20,
            padding:28, textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:14, color:'#94A3B8', fontFamily:'Nunito,sans-serif', marginBottom:16 }}>
            How many {question?.emoji} do you see?
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:8, marginBottom:8 }}>
            {question && Array.from({ length: question.count }).map((_, i) => (
              <motion.span key={i} initial={{ scale:0 }} animate={{ scale:1 }}
                transition={{ delay:i*0.05 }} style={{ fontSize:36 }}>
                {question.emoji}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Options */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {question?.options.map((opt, i) => (
            <motion.button key={i}
              style={{ padding:'18px', borderRadius:14, border:'1px solid #2D3A4F', fontSize:28,
                fontWeight:900, cursor:'pointer', fontFamily:'Nunito,sans-serif',
                background: feedback === 'correct' && opt === question.count ? 'rgba(16,185,129,0.2)'
                  : feedback === 'wrong' && opt === question.count ? 'rgba(16,185,129,0.2)'
                  : 'rgba(30,41,59,0.6)',
                color: feedback && opt === question.count ? '#10B981' : '#F1F5F9',
                border: feedback && opt === question.count ? '1px solid rgba(16,185,129,0.5)' : '1px solid #2D3A4F' }}
              whileHover={!feedback ? { scale:1.04, borderColor:'rgba(249,115,22,0.4)',
                background:'rgba(249,115,22,0.1)', color:'#F97316' } : {}}
              whileTap={!feedback ? { scale:0.96 } : {}}
              onClick={() => handleAnswer(opt)}>
              {opt}
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              style={{ textAlign:'center', marginTop:16, fontSize:18, fontWeight:800,
                color: feedback === 'correct' ? '#10B981' : '#EF4444',
                fontFamily:'Nunito,sans-serif' }}>
              {feedback === 'correct' ? '✅ Correct!' : `❌ It was ${question?.count}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
