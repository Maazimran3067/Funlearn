import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore } from '../../services/api';
import useStageProgress from '../hooks/useStageProgress';
import { useAuth } from '../../context/AuthContext';

const SENTENCES = [
  ["The","cat","is","fat"],
  ["I","like","red","apples"],
  ["She","runs","very","fast"],
  ["The","dog","can","jump"],
  ["We","play","in","school"],
  ["He","has","a","ball"],
  ["The","sun","is","bright"],
  ["Birds","fly","in","sky"],
  ["My","mom","makes","food"],
  ["Rain","falls","on","ground"],
  ["Fish","swim","in","water"],
  ["Kids","love","to","play"],
  ["The","moon","shines","brightly"],
  ["Dogs","chase","the","ball"],
  ["She","reads","a","book"],
];

const STAGES = [
  { stage:0, questions:SENTENCES.slice(0,5),  label:'Stage 1' },
  { stage:1, questions:SENTENCES.slice(2,7),  label:'Stage 2' },
  { stage:2, questions:SENTENCES.slice(5,10), label:'Stage 3' },
  { stage:3, questions:SENTENCES.slice(7,12), label:'Stage 4' },
  { stage:4, questions:SENTENCES.slice(10,15),label:'Stage 5' },
];

function shuffle(arr) { return [...arr].sort(()=>Math.random()-0.5); }

export default function SentenceMakerGame() {
  const navigate = useNavigate();
  const { unlockedStages, unlockStage } = useStageProgress('sentences');
  const [screen,   setScreen]   = useState('stages');
  const [stageIdx, setStageIdx] = useState(0);
  const [qIdx,     setQIdx]     = useState(0);
  const [tiles,    setTiles]    = useState([]);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const TOTAL = 5;

  const startStage = (idx) => {
    setStageIdx(idx); scoreRef.current=0; setScore(0);
    setQIdx(0); setFeedback(null); setSelected([]);
    const q = STAGES[idx].questions[0];
    setTiles(shuffle(q).map((w,i)=>({ id:i, word:w })));
    setScreen('game');
  };

  const pickTile = (tile) => {
    if (feedback || selected.find(s=>s.id===tile.id)) return;
    setSelected(p=>[...p,tile]);
    setTiles(p=>p.filter(t=>t.id!==tile.id));
  };

  const removeTile = (tile) => {
    if (feedback) return;
    setSelected(p=>p.filter(s=>s.id!==tile.id));
    setTiles(p=>[...p,tile]);
  };

  const checkAnswer = async () => {
    if (selected.length < 4 || feedback) return;
    const correct = STAGES[stageIdx].questions[qIdx];
    const isCorrect = selected.map(s=>s.word).join(' ') === correct.join(' ');
    if (isCorrect) { scoreRef.current+=1; setScore(scoreRef.current); }
    setFeedback({ isCorrect, correct: correct.join(' ') });
    setTimeout(async () => {
      setFeedback(null); setSelected([]);
      if (qIdx+1>=TOTAL) {
        const pct = Math.round((scoreRef.current/TOTAL)*100);
        const stars = pct>=90?3:pct>=70?2:1;
        await submitScore({ game_id:'sentences', score:scoreRef.current,
          max_score:TOTAL, percentage:pct, stars, difficulty_level:stageIdx+1 }).catch(()=>{});
        if (pct>=70) await unlockStage(stageIdx+1);
        setScreen('result');
      } else {
        const nq = qIdx+1;
        setQIdx(nq);
        const q = STAGES[stageIdx].questions[nq % STAGES[stageIdx].questions.length];
        setTiles(shuffle(q).map((w,i)=>({ id:i, word:w })));
      }
    }, 1200);
  };

  const pct = Math.round((score/TOTAL)*100);

  if (screen==='stages') return (
    <div style={{ minHeight:'100vh', background:'#0B1120', padding:'28px', marginLeft:220, marginTop:60 }}>
      <button onClick={()=>navigate('/student/dashboard')}
        style={{ background:'none', border:'none', color:'#64748B', cursor:'pointer',
          fontSize:13, fontFamily:'Nunito,sans-serif', marginBottom:20 }}>← Back</button>
      <div style={{ fontSize:22, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif', marginBottom:6 }}>
        💬 Sentence Maker</div>
      <div style={{ fontSize:13, color:'#94A3B8', fontFamily:'Nunito,sans-serif', marginBottom:24 }}>
        Arrange the tiles to make a correct sentence!</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
        {STAGES.map((s,i)=>{
          const unlocked = unlockedStages.includes(i);
          return (
            <motion.div key={i}
              style={{ background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:16,
                padding:20, textAlign:'center', cursor:unlocked?'pointer':'not-allowed', opacity:unlocked?1:0.5 }}
              whileHover={unlocked?{ scale:1.04, borderColor:'rgba(14,165,233,0.4)' }:{}}
              whileTap={unlocked?{ scale:0.96 }:{}}
              onClick={()=>unlocked&&startStage(i)}>
              <div style={{ fontSize:30, marginBottom:8 }}>{unlocked?'💬':'🔒'}</div>
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
          {pct>=70?'Excellent!':'Try Again!'}</div>
        <div style={{ fontSize:40, fontWeight:900, color:'#0EA5E9', fontFamily:'Nunito,sans-serif', margin:'12px 0' }}>
          {pct}%</div>
        <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:20 }}>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            onClick={()=>startStage(stageIdx)}
            style={{ padding:'10px 22px', borderRadius:12, border:'none',
              background:'linear-gradient(135deg,#0EA5E9,#38BDF8)', color:'#fff',
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
      <div style={{ width:'100%', maxWidth:520 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
          <span style={{ fontSize:13, color:'#94A3B8', fontFamily:'Nunito,sans-serif' }}>{qIdx+1}/{TOTAL}</span>
          <span style={{ fontSize:13, color:'#0EA5E9', fontWeight:700, fontFamily:'Nunito,sans-serif' }}>
            ⭐ {score} correct</span>
        </div>
        <div style={{ height:5, background:'#2D3A4F', borderRadius:10, marginBottom:24, overflow:'hidden' }}>
          <motion.div style={{ height:'100%', background:'linear-gradient(90deg,#0EA5E9,#38BDF8)', borderRadius:10 }}
            animate={{ width:`${(qIdx/TOTAL)*100}%` }}/>
        </div>

        <div style={{ background:'#1E293B', border:'1px solid #2D3A4F', borderRadius:20, padding:24, marginBottom:16 }}>
          <div style={{ fontSize:13, color:'#94A3B8', fontFamily:'Nunito,sans-serif', marginBottom:12 }}>
            Build the sentence — tap tiles in the right order:
          </div>
          {/* Answer area */}
          <div style={{ minHeight:54, background:'rgba(15,23,42,0.5)', borderRadius:12,
            border:'1px dashed #2D3A4F', padding:'10px 12px',
            display:'flex', flexWrap:'wrap', gap:8, alignItems:'center', marginBottom:16 }}>
            {selected.length===0
              ? <span style={{ color:'#64748B', fontSize:13, fontFamily:'Nunito,sans-serif' }}>
                  Tap words below to place them here...</span>
              : selected.map((t,i)=>(
                <motion.button key={t.id} initial={{ scale:0.8 }} animate={{ scale:1 }}
                  style={{ padding:'8px 14px', borderRadius:8, border:'1px solid rgba(14,165,233,0.4)',
                    background:'rgba(14,165,233,0.15)', color:'#38BDF8', fontSize:14,
                    fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}
                  whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                  onClick={()=>removeTile(t)}>
                  {t.word}
                </motion.button>
              ))
            }
          </div>
          {/* Word tiles */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {tiles.map(t=>(
              <motion.button key={t.id}
                style={{ padding:'8px 14px', borderRadius:8, border:'1px solid #2D3A4F',
                  background:'rgba(30,41,59,0.7)', color:'#F1F5F9', fontSize:14,
                  fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}
                whileHover={{ scale:1.05, borderColor:'rgba(14,165,233,0.4)',
                  background:'rgba(14,165,233,0.1)', color:'#38BDF8' }}
                whileTap={{ scale:0.95 }}
                onClick={()=>pickTile(t)}>
                {t.word}
              </motion.button>
            ))}
          </div>
        </div>

        <motion.button
          style={{ width:'100%', padding:'13px', borderRadius:12, border:'none',
            background: selected.length===4
              ? 'linear-gradient(135deg,#0EA5E9,#38BDF8)' : '#1E293B',
            color: selected.length===4 ? '#fff' : '#64748B',
            fontSize:14, fontWeight:800, cursor: selected.length===4?'pointer':'not-allowed',
            fontFamily:'Nunito,sans-serif',
            boxShadow: selected.length===4 ? '0 4px 20px rgba(14,165,233,0.35)' : 'none' }}
          whileHover={selected.length===4?{ scale:1.02 }:{}}
          whileTap={selected.length===4?{ scale:0.97 }:{}}
          onClick={checkAnswer}>
          ✅ Check Sentence
        </motion.button>

        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ textAlign:'center', marginTop:14, fontSize:15, fontWeight:800,
                color:feedback.isCorrect?'#10B981':'#EF4444', fontFamily:'Nunito,sans-serif' }}>
              {feedback.isCorrect ? '✅ Correct!' : `❌ Answer: "${feedback.correct}"`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
