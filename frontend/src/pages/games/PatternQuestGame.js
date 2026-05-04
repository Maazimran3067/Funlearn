import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore } from '../../services/api';
import useStageProgress from '../hooks/useStageProgress';
import { useAuth } from '../../context/AuthContext';

const PATTERNS = [
  { seq:['🔴','🔵','🔴','🔵','?'], answer:'🔴', options:['🔴','🔵','🟢','🟡'] },
  { seq:['🌟','🌙','🌟','🌙','?'], answer:'🌟', options:['🌟','🌙','☀️','⭐'] },
  { seq:['🐱','🐶','🐱','🐶','?'], answer:'🐱', options:['🐱','🐶','🐸','🐰'] },
  { seq:['▲','■','▲','■','?'],     answer:'▲',   options:['▲','■','●','◆'] },
  { seq:['🍎','🍊','🍎','🍊','?'], answer:'🍎', options:['🍎','🍊','🍋','🍇'] },
  { seq:['🔴','🔴','🔵','🔴','🔴','?'], answer:'🔵', options:['🔴','🔵','🟢','🟡'] },
  { seq:['1️⃣','2️⃣','3️⃣','1️⃣','2️⃣','?'], answer:'3️⃣', options:['1️⃣','2️⃣','3️⃣','4️⃣'] },
  { seq:['🌸','🌿','🌸','🌿','🌸','?'], answer:'🌿', options:['🌸','🌿','🌻','🌼'] },
  { seq:['🔺','🔻','🔺','🔻','🔺','?'], answer:'🔻', options:['🔺','🔻','🔷','🔶'] },
  { seq:['A','B','C','A','B','?'],  answer:'C',   options:['A','B','C','D'] },
];

const STAGES = [
  { stage:0, qs:[0,1,2,3,4],   label:'Stage 1' },
  { stage:1, qs:[1,2,3,4,5],   label:'Stage 2' },
  { stage:2, qs:[3,4,5,6,7],   label:'Stage 3' },
  { stage:3, qs:[4,5,6,7,8],   label:'Stage 4' },
  { stage:4, qs:[5,6,7,8,9],   label:'Stage 5' },
];

export default function PatternQuestGame() {
  const navigate = useNavigate();
  const { unlockedStages, unlockStage } = useStageProgress('patterns');
  const [screen,   setScreen]   = useState('stages');
  const [stageIdx, setStageIdx] = useState(0);
  const [qIdx,     setQIdx]     = useState(0);
  const [feedback, setFeedback] = useState(null);
  const scoreRef = useRef(0);
  const [score,    setScore]    = useState(0);
  const TOTAL = 5;

  const startStage = (idx) => {
    setStageIdx(idx); scoreRef.current=0; setScore(0);
    setQIdx(0); setFeedback(null); setScreen('game');
  };

  const curQ = PATTERNS[STAGES[stageIdx]?.qs[qIdx] || 0];

  const handlePick = async (option) => {
    if (feedback) return;
    const correct = option === curQ.answer;
    if (correct) { scoreRef.current+=1; setScore(scoreRef.current); }
    setFeedback({ correct, chosen:option });
    setTimeout(async () => {
      setFeedback(null);
      if (qIdx+1>=TOTAL) {
        const pct = Math.round((scoreRef.current/TOTAL)*100);
        const stars = pct>=90?3:pct>=70?2:1;
        await submitScore({ game_id:'patterns', score:scoreRef.current,
          max_score:TOTAL, percentage:pct, stars, difficulty_level:stageIdx+1 }).catch(()=>{});
        if (pct>=70) await unlockStage(stageIdx+1);
        setScreen('result');
      } else {
        setQIdx(q=>q+1);
      }
    }, 900);
  };

  const pct = Math.round((score/TOTAL)*100);

  if (screen==='stages') return (
    <div style={{ minHeight:'100vh', background:'#0B1120', padding:'28px', marginLeft:220, marginTop:60 }}>
      <button onClick={()=>navigate('/student/dashboard')}
        style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer',
          fontSize:13, fontFamily:'Nunito,sans-serif', marginBottom:20 }}>← Back</button>
      <div style={{ fontSize:22, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif', marginBottom:6 }}>
        🔷 Pattern Quest</div>
      <div style={{ fontSize:13, color:'#94A3B8', fontFamily:'Nunito,sans-serif', marginBottom:24 }}>
        Find the missing piece in the pattern!</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12 }}>
        {STAGES.map((s,i)=>{
          const unlocked = unlockedStages.includes(i);
          return (
            <motion.div key={i}
              style={{ background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:16,
                padding:20, textAlign:'center', cursor:unlocked?'pointer':'not-allowed', opacity:unlocked?1:0.5 }}
              whileHover={unlocked?{ scale:1.04, borderColor:'rgba(236,72,153,0.4)' }:{}}
              whileTap={unlocked?{ scale:0.96 }:{}}
              onClick={()=>unlocked&&startStage(i)}>
              <div style={{ fontSize:30, marginBottom:8 }}>{unlocked?'🔷':'🔒'}</div>
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
      <motion.div initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={{ background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:24,
          padding:'40px', textAlign:'center', maxWidth:360 }}>
        <div style={{ fontSize:52, marginBottom:12 }}>{pct>=70?'🎉':'💪'}</div>
        <div style={{ fontSize:22, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' }}>
          {pct>=70?'Pattern Master!':'Try Again!'}</div>
        <div style={{ fontSize:40, fontWeight:900, color:'#EC4899', fontFamily:'Nunito,sans-serif', margin:'12px 0' }}>
          {pct}%</div>
        <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:20 }}>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            onClick={()=>startStage(stageIdx)}
            style={{ padding:'10px 22px', borderRadius:12, border:'none',
              background:'linear-gradient(135deg,#EC4899,#F472B6)', color:'#fff',
              fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}>
            Retry</motion.button>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            onClick={()=>setScreen('stages')}
            style={{ padding:'10px 22px', borderRadius:12, border:'1px solid #2D3A4F',
              background:'transparent', color:'#94A3B8', fontSize:14,
              fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}>
            Stages</motion.button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#0B1120', display:'flex',
      alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:500 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
          <span style={{ fontSize:13, color:'#94A3B8', fontFamily:'Nunito,sans-serif' }}>{qIdx+1}/{TOTAL}</span>
          <span style={{ fontSize:13, color:'#EC4899', fontWeight:700, fontFamily:'Nunito,sans-serif' }}>
            ⭐ {score}</span>
        </div>
        <div style={{ height:5, background:'#2D3A4F', borderRadius:10, marginBottom:24, overflow:'hidden' }}>
          <motion.div style={{ height:'100%', background:'linear-gradient(90deg,#EC4899,#F472B6)', borderRadius:10 }}
            animate={{ width:`${(qIdx/TOTAL)*100}%` }}/>
        </div>

        <div style={{ background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:20,
          padding:28, textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:13, color:'#94A3B8', fontFamily:'Nunito,sans-serif', marginBottom:16 }}>
            What comes next in the pattern?
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
            {curQ.seq.map((item,i)=>(
              <motion.div key={i}
                style={{ width:56, height:56, borderRadius:12, fontSize:28,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: item==='?' ? 'rgba(236,72,153,0.15)'
                    : 'rgba(30,41,59,0.6)',
                  border: item==='?' ? '2px dashed rgba(236,72,153,0.5)'
                    : '1px solid #2D3A4F' }}
                initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
                transition={{ delay:i*0.08 }}>
                {item==='?' ? <span style={{ fontSize:24, color:'#EC4899' }}>?</span> : item}
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {curQ.options.map((opt,i)=>{
            const isCorrect = opt === curQ.answer;
            const wasChosen = feedback?.chosen === opt;
            return (
              <motion.button key={i}
                style={{ padding:'18px', borderRadius:14, fontSize:32, cursor:'pointer',
                  fontFamily:'Nunito,sans-serif',
                  background: feedback
                    ? isCorrect ? 'rgba(16,185,129,0.2)'
                    : wasChosen ? 'rgba(239,68,68,0.15)' : 'rgba(30,41,59,0.5)'
                    : 'rgba(30,41,59,0.6)',
                  border: feedback
                    ? isCorrect ? '1px solid rgba(16,185,129,0.5)'
                    : wasChosen ? '1px solid rgba(239,68,68,0.4)' : '1px solid #2D3A4F'
                    : '1px solid #2D3A4F' }}
                whileHover={!feedback?{ scale:1.05, borderColor:'rgba(236,72,153,0.4)',
                  background:'rgba(236,72,153,0.1)' }:{}}
                whileTap={!feedback?{ scale:0.95 }:{}}
                onClick={()=>!feedback&&handlePick(opt)}>
                {opt}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ textAlign:'center', marginTop:14, fontSize:17, fontWeight:800,
                color:feedback.correct?'#10B981':'#EF4444', fontFamily:'Nunito,sans-serif' }}>
              {feedback.correct ? '✅ Correct!' : `❌ Answer was: ${curQ.answer}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
