import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore, getGameFeedback } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useStageProgress from '../../hooks/useStageProgress';

const WORD_PROBLEMS = [
  {q:'Ali has 8 apples and gets 5 more. Total?',              a:13, c:[13,12,14,11]},
  {q:'Sara had 15 sweets and gave away 6. How many left?',    a:9,  c:[9,8,10,7]},
  {q:'3 baskets with 7 oranges each. Total oranges?',         a:21, c:[21,18,24,20]},
  {q:'4 groups of 6 students each. Total students?',          a:24, c:[24,20,22,28]},
  {q:'Tom saved 9 coins Monday and 8 Tuesday. Total?',        a:17, c:[17,16,18,15]},
  {q:'20 birds on a tree, 7 fly away. How many remain?',      a:13, c:[13,12,14,11]},
  {q:'5 rows of 6 chocolates in a box. Total chocolates?',    a:30, c:[30,25,35,28]},
  {q:'Zara reads 4 pages a day. Total in 8 days?',            a:32, c:[32,28,36,30]},
  {q:'12 eggs in a box, 5 used. How many left?',              a:7,  c:[7,6,8,5]},
  {q:'6 classes of 8 students. Total students?',              a:48, c:[48,40,56,44]},
  {q:'A shop has 25 items. 11 are sold. Remaining?',          a:14, c:[14,13,15,12]},
  {q:'4 friends share 32 candies equally. Each gets?',        a:8,  c:[8,7,9,6]},
  {q:'A train has 9 coaches with 7 seats each. Total seats?', a:63, c:[63,56,72,60]},
  {q:'Maria has £20. She spends £7. How much left?',          a:13, c:[13,12,14,11]},
  {q:'6 boxes with 9 pencils each. Total pencils?',           a:54, c:[54,45,63,48]},
];

const STAGES = [
  { name:'S1 Easy +',    ops:['+'],      min:1,  max:10,  timer:10, qs:5, passMark:70, type:'normal' },
  { name:'S2 Hard +/−',  ops:['+','-'], min:10, max:30,  timer:10, qs:5, passMark:70, type:'normal' },
  { name:'S3 × and ÷',   ops:['×','÷'], min:2,  max:12,  timer:20, qs:5, passMark:70, type:'normal' },
  { name:'S4 Word Probs A', ops:[],     min:0,  max:0,   timer:40, qs:5, passMark:70, type:'word' },
  { name:'S5 Word Probs B', ops:[],     min:0,  max:0,   timer:40, qs:5, passMark:70, type:'word' },
];

const BTN_COLORS = ['#7C3AED','#EC4899','#F59E0B','#10B981'];

function genNormal(ops, min, max, usedKeys) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;
    if (op==='+') { a=Math.floor(Math.random()*(max-min+1))+min; b=Math.floor(Math.random()*(max-min+1))+min; answer=a+b; }
    else if (op==='-') { b=Math.floor(Math.random()*(max-min))+min; a=b+Math.floor(Math.random()*10)+1; answer=a-b; }
    else if (op==='×') { a=Math.floor(Math.random()*max)+2; b=Math.floor(Math.random()*max)+2; answer=a*b; }
    else { b=Math.floor(Math.random()*max)+2; answer=Math.floor(Math.random()*max)+2; a=b*answer; }
    const key = `${a}${op}${b}`;
    if (usedKeys.includes(key)) continue;
    const ws = new Set();
    [answer+1,answer-1,answer+2,answer+3,answer-2].forEach(w=>{if(w>=0&&w!==answer)ws.add(w);});
    const choices=[answer,...Array.from(ws).slice(0,3)].sort(()=>Math.random()-0.5);
    return { a, b, op, answer, choices, isWord:false, key };
  }
  return { a:5, b:3, op:ops[0], answer:8, choices:[8,7,9,6], isWord:false, key:'fb' };
}

export default function MathChallenge() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unlockedStages, unlockStage, loaded } = useStageProgress('math');

  const [stageIndex,  setStageIndex]  = useState(0);
  const [playing,     setPlaying]     = useState(false);
  const [question,    setQuestion]    = useState(null);
  const [usedKeys,    setUsedKeys]    = useState([]);
  const [usedWPIdx,   setUsedWPIdx]   = useState([]);
  const [score,       setScore]       = useState(0);
  const [round,       setRound]       = useState(0);
  const [feedback,    setFeedback]    = useState(null);
  const [stageOver,   setStageOver]   = useState(false);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [showHint,    setShowHint]    = useState(false);
  const [timeLeft,    setTimeLeft]    = useState(15);
  const [weakOps,     setWeakOps]     = useState({});
  const [aiFeedback,  setAiFeedback]  = useState('');
  const [loadingAI,   setLoadingAI]   = useState(false);

  const timerRef    = useRef(null);
  const fbRef       = useRef(null);
  const startTime   = useRef(Date.now());
  const currentStage = STAGES[stageIndex];
  fbRef.current = feedback;

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current=null; } };

  const startTimer = (secs) => {
    clearTimer(); setTimeLeft(secs);
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p<=1) { clearTimer(); if (!fbRef.current) processAnswer(null,true); return 0; }
        return p-1;
      });
    }, 1000);
  };

  const getWP = (used) => {
    // Split pool between S4 (first half) and S5 (second half)
    const poolStart = stageIndex === 4 ? 7 : 0;
    const poolEnd   = stageIndex === 4 ? WORD_PROBLEMS.length : 7;
    const pool      = WORD_PROBLEMS.slice(poolStart, poolEnd);
    const available = pool.map((_,i)=>i+poolStart).filter(i=>!used.includes(i));
    if (available.length===0) return {...WORD_PROBLEMS[poolStart], isWord:true, wpIdx:poolStart, choices:[...WORD_PROBLEMS[poolStart].c].sort(()=>Math.random()-0.5)};
    const idx = available[Math.floor(Math.random()*available.length)];
    return {...WORD_PROBLEMS[idx], isWord:true, wpIdx:idx, choices:[...WORD_PROBLEMS[idx].c].sort(()=>Math.random()-0.5)};
  };

  const loadQ = (stage, uk, uw) => {
    const q = stage.type==='word' ? getWP(uw) : genNormal(stage.ops,stage.min,stage.max,uk);
    setQuestion(q); setFeedback(null); fbRef.current=null; setShowHint(false);
    startTimer(stage.timer);
    return q;
  };

  const startStage = () => {
    const stage=STAGES[stageIndex];
    setScore(0); setRound(0); setFeedback(null); fbRef.current=null;
    setShowHint(false); setWrongStreak(0); setStageOver(false);
    setUsedKeys([]); setUsedWPIdx([]); setWeakOps({});
    setPlaying(true); startTime.current=Date.now();
    const q = stage.type==='word' ? getWP([]) : genNormal(stage.ops,stage.min,stage.max,[]);
    setQuestion(q);
    if (stage.type==='word') setUsedWPIdx([q.wpIdx]); else setUsedKeys([q.key]);
    startTimer(stage.timer);
  };

  useEffect(()=>{ return ()=>clearTimer(); },[]);

  const processAnswer = (chosen, timedOut=false) => {
    if (fbRef.current) return;
    clearTimer();
    const correct = !timedOut && chosen===question?.answer;
    if (correct) { setFeedback('correct'); setScore(s=>s+1); setWrongStreak(0); }
    else {
      setFeedback(timedOut?'timeout':'wrong'); setWrongStreak(s=>s+1);
      if (wrongStreak>=1) setShowHint(true);
      if (!timedOut&&!question?.isWord) setWeakOps(p=>({...p,[question.op]:(p[question.op]||0)+1}));
    }
    setTimeout(()=>{
      setRound(prev=>{
        const nextRound=prev+1;
        if (nextRound>=currentStage.qs){setStageOver(true);return nextRound;}
        if (currentStage.type==='word') {
          setUsedWPIdx(pu=>{const q=getWP(pu);setQuestion(q);fbRef.current=null;setFeedback(null);setShowHint(false);startTimer(currentStage.timer);return[...pu,q.wpIdx];});
        } else {
          setUsedKeys(pu=>{const q=genNormal(currentStage.ops,currentStage.min,currentStage.max,pu);setQuestion(q);fbRef.current=null;setFeedback(null);setShowHint(false);startTimer(currentStage.timer);return[...pu,q.key];});
        }
        return nextRound;
      });
    },1500);
  };

  const handleStageComplete = async () => {
    const pct=Math.round((score/currentStage.qs)*100);
    const passed=pct>=currentStage.passMark;
    submitScore({game_id:'math',score,max_score:currentStage.qs,time_taken:Math.floor((Date.now()-startTime.current)/1000),difficulty_level:stageIndex+1,ai_data:{weak_operations:weakOps}}).catch(()=>{});
    if (passed&&stageIndex+1<STAGES.length) unlockStage(stageIndex+1);
    setLoadingAI(true);
    try {
      const res=await getGameFeedback({game_id:'math',score,max_score:currentStage.qs,percentage:pct,age_group:user?.profile?.age_group||'9-12',ai_data:{weak_operations:weakOps}});
      setAiFeedback(res.data.feedback);
    } catch {setAiFeedback(pct>=70?'Math genius! Stage passed! ➕🌟':'Keep practising! 💪');}
    finally{setLoadingAI(false);}
  };

  useEffect(()=>{if(stageOver)handleStageComplete();},[stageOver]);

  const timePct=(timeLeft/currentStage.timer)*100;

  if (!loaded) return <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0B1120',fontSize:18,color:'#94A3B8',fontFamily:'Nunito,sans-serif' }}>Loading... ✨</div>;

  if (!playing) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <motion.button style={S.backBtn} whileHover={{scale:1.05}} onClick={()=>navigate('/student/dashboard')}>← Back</motion.button>
          <div style={S.headerTitle}>➕ Math Challenge</div>
          <div style={{width:80}}/>
        </div>
        <div style={S.stageArea}>
          <h2 style={S.stageTitle}>Choose Your Stage</h2>
          <p style={S.stageSub}>Score 70% to unlock the next stage! Stages 4 & 5 have word problems. Your progress is saved! ✨</p>
          <div style={S.stagesGrid}>
            {STAGES.map((s,i)=>{
              const unlocked=unlockedStages.includes(i);
              return(
                <motion.div key={i} style={{...S.stageCard,opacity:unlocked?1:0.5,border:stageIndex===i?'2px solid #EF4444':'1px solid #2D3A4F',background:unlocked?'rgba(239,68,68,0.1)':'#1E293B'}}
                  whileHover={unlocked?{scale:1.05,borderColor:'rgba(239,68,68,0.5)'}:{}} whileTap={unlocked?{scale:0.95}:{}}
                  onClick={()=>{if(unlocked){setStageIndex(i);setStageOver(false);}}}>
                  <div style={{fontSize:28}}>{unlocked?(i<3?'➕':'📖'):'🔒'}</div>
                  <div style={{fontSize:13,fontWeight:800,color:unlocked?'#EF4444':'#4B5563',fontFamily:'Nunito,sans-serif'}}>{s.name}</div>
                  <div style={{fontSize:11,color:'#F59E0B',fontWeight:700}}>⏱️ {s.timer}s</div>
                  {unlocked&&<div style={{fontSize:11,color:'#10B981',fontWeight:700,marginTop:4}}>✅ Unlocked</div>}
                </motion.div>
              );
            })}
          </div>
          <motion.button style={{...S.startBtn,background:'linear-gradient(135deg,#EF4444,#7C3AED)'}} whileHover={{scale:1.05}} onClick={startStage}>
            Start {STAGES[stageIndex].name} 🚀
          </motion.button>
        </div>
      </div>
    );
  }

  if (stageOver) {
    const pct=Math.round((score/currentStage.qs)*100);
    const passed=pct>=currentStage.passMark;
    return(
      <div style={S.page}>
        <motion.div style={S.resultCard} initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:'spring',bounce:0.4}}>
          <div style={{fontSize:80}}>{passed?'🏆':'💪'}</div>
          <h1 style={S.resultTitle}>{passed?'Stage Passed! 🎉':'Try Again!'}</h1>
          <p style={S.resultScore}>{score}/{currentStage.qs} correct — {pct}%</p>
          <div style={S.resultPct}>{pct}%</div>
          <div style={S.starsRow}>{[1,2,3].map(s=><span key={s} style={{fontSize:36,opacity:pct>=s*30?1:0.25}}>⭐</span>)}</div>
          {passed&&stageIndex+1<STAGES.length&&<div style={S.unlockedBox}>🎉 {STAGES[stageIndex+1].name} Unlocked Forever!</div>}
          <div style={S.aiBox}>
            {loadingAI?<div style={S.aiRow}><span>🤖</span><span>AI analyzing...</span></div>
              :<><div style={S.aiRow}><span>🤖</span><strong style={{color:'#1E40AF'}}>AI Feedback</strong></div><p style={S.aiText}>{aiFeedback}</p></>}
          </div>
          <div style={S.resultBtns}>
            <motion.button style={S.playBtn} whileHover={{scale:1.05}} onClick={()=>{setPlaying(false);setStageOver(false);}}>{passed?'Next Stage 🚀':'Try Again 🔄'}</motion.button>
            <motion.button style={S.homeBtn} whileHover={{scale:1.05}} onClick={()=>navigate('/student/dashboard')}>Home 🏠</motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!question) return null;

  return(
    <div style={S.page}>
      <div style={S.header}>
        <motion.button style={S.backBtn} whileHover={{scale:1.05}} onClick={()=>{clearTimer();setPlaying(false);setStageOver(false);}}>← Stages</motion.button>
        <div style={S.headerTitle}>➕ {currentStage.name}</div>
        <div style={S.scoreBadge}>⭐ {score}/{currentStage.qs}</div>
      </div>
      <div style={S.progressWrap}>
        <div style={S.progressTrack}><motion.div style={S.progressFill} animate={{width:`${(round/currentStage.qs)*100}%`}} transition={{duration:0.4}}/></div>
        <span style={S.roundText}>Q{round+1}/{currentStage.qs}</span>
      </div>
      <div style={S.gameArea}>
        <motion.div style={S.questionBox} key={round} initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
            <div style={{flex:1,height:10,background:'#2D3A4F',borderRadius:10,overflow:'hidden'}}>
              <motion.div style={{height:'100%',borderRadius:10,background:timePct>50?'#10B981':timePct>25?'#F59E0B':'#EF4444'}} animate={{width:`${timePct}%`}} transition={{duration:0.8}}/>
            </div>
            <span style={{fontSize:16,fontWeight:900,color:timeLeft<=5?'#EF4444':'#94A3B8',minWidth:30,fontFamily:'Nunito,sans-serif'}}>{timeLeft}s</span>
          </div>
          {question.isWord?(
            <div style={{fontSize:16,fontWeight:700,color:'#F1F5F9',lineHeight:1.7,textAlign:'center',fontFamily:'Nunito,sans-serif'}}>📖 {question.q}</div>
          ):(
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,flexWrap:'wrap'}}>
              <span style={{fontSize:48,fontWeight:900,color:'#F1F5F9',fontFamily:'Nunito,sans-serif'}}>{question.a}</span>
              <span style={{fontSize:40,fontWeight:900,color:'#EF4444'}}>{question.op}</span>
              <span style={{fontSize:48,fontWeight:900,color:'#F1F5F9',fontFamily:'Nunito,sans-serif'}}>{question.b}</span>
              <span style={{fontSize:40,fontWeight:900,color:'#EF4444'}}>=</span>
              <span style={{fontSize:48,fontWeight:900,color:'#8B5CF6',background:'rgba(139,92,246,0.15)',borderRadius:12,padding:'4px 16px',border:'1px solid rgba(139,92,246,0.3)'}}>?</span>
            </div>
          )}
          <AnimatePresence>
            {showHint&&<motion.div style={{background:'rgba(245,158,11,0.1)',color:'#F59E0B',borderRadius:12,padding:'8px 16px',fontSize:14,fontWeight:700,border:'1px solid rgba(245,158,11,0.3)',marginTop:14,fontFamily:'Nunito,sans-serif'}} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>🤖 Answer: <strong>{question.answer}</strong></motion.div>}
          </AnimatePresence>
        </motion.div>
        <AnimatePresence>
          {feedback&&<motion.div style={{...S.feedbackBubble,background:feedback==='correct'?'#D1FAE5':'#FEE2E2',color:feedback==='correct'?'#065F46':'#991B1B'}} initial={{scale:0}} animate={{scale:1}} exit={{scale:0}}>{feedback==='correct'?'✅ Correct!':feedback==='timeout'?`⏰ Time up! Answer: ${question.answer}`:`❌ Answer was ${question.answer}`}</motion.div>}
        </AnimatePresence>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,width:'100%',maxWidth:360}}>
          {question.choices.map((num,i)=>(
            <motion.button key={`${round}-${i}`} style={{height:78,borderRadius:20,border:'none',fontSize:30,fontWeight:900,cursor:'pointer',fontFamily:'Nunito,sans-serif',
              background:feedback?(num===question.answer?'#D1FAE5':'#F3F4F6'):BTN_COLORS[i%BTN_COLORS.length],
              color:feedback?(num===question.answer?'#065F46':'#9CA3AF'):'#fff',opacity:feedback&&num!==question.answer?0.5:1}}
              whileHover={!feedback?{scale:1.08,y:-4}:{}} whileTap={!feedback?{scale:0.94}:{}}
              onClick={()=>!feedback&&processAnswer(num)} disabled={!!feedback}>
              {num}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

const S = {
  page:        {minHeight:'100vh',background:'#0B1120',display:'flex',flexDirection:'column'},
  header:      {background:'#1E293B',padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid #2D3A4F'},
  backBtn:     {background:'rgba(239,68,68,0.12)',color:'#EF4444',border:'1px solid rgba(239,68,68,0.3)',padding:'8px 16px',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Nunito,sans-serif'},
  headerTitle: {fontSize:20,fontWeight:900,color:'#F1F5F9',fontFamily:'Nunito,sans-serif'},
  scoreBadge:  {background:'rgba(245,158,11,0.15)',color:'#F59E0B',padding:'6px 14px',borderRadius:20,fontSize:14,fontWeight:700,border:'1px solid rgba(245,158,11,0.3)'},
  progressWrap:{padding:'10px 24px',background:'#1E293B',borderBottom:'1px solid #2D3A4F',display:'flex',alignItems:'center',gap:10},
  progressTrack:{flex:1,height:10,background:'#2D3A4F',borderRadius:10,overflow:'hidden'},
  progressFill:{height:'100%',background:'linear-gradient(90deg,#EF4444,#7C3AED)',borderRadius:10},
  roundText:   {fontSize:13,fontWeight:700,color:'#EF4444',whiteSpace:'nowrap',fontFamily:'Nunito,sans-serif'},
  gameArea:    {flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px',gap:20},
  questionBox: {background:'#1E293B',border:'1px solid #2D3A4F',borderRadius:28,padding:'24px 28px',textAlign:'center',boxShadow:'0 8px 32px rgba(0,0,0,0.3)',width:'100%',maxWidth:440},
  feedbackBubble:{padding:'12px 28px',borderRadius:16,fontSize:16,fontWeight:800,fontFamily:'Nunito,sans-serif'},
  stageArea:   {flex:1,display:'flex',flexDirection:'column',alignItems:'center',padding:'32px 20px'},
  stageTitle:  {fontSize:24,fontWeight:900,color:'#F1F5F9',margin:'0 0 8px',fontFamily:'Nunito,sans-serif'},
  stageSub:    {fontSize:14,color:'#64748B',marginBottom:28,textAlign:'center',fontFamily:'Nunito,sans-serif'},
  stagesGrid:  {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:16,width:'100%',maxWidth:800,marginBottom:28},
  stageCard:   {borderRadius:20,padding:'20px 16px',textAlign:'center',cursor:'pointer',transition:'all 0.2s'},
  startBtn:    {color:'#fff',border:'none',padding:'16px 40px',borderRadius:18,fontSize:18,fontWeight:800,cursor:'pointer',fontFamily:'Nunito,sans-serif'},
  resultCard:  {background:'#1E293B',border:'1px solid #2D3A4F',borderRadius:32,padding:'40px 36px',textAlign:'center',maxWidth:460,width:'90%',margin:'6vh auto',boxShadow:'0 20px 60px rgba(0,0,0,0.5)'},
  resultTitle: {fontSize:32,fontWeight:900,color:'#F1F5F9',margin:'12px 0 8px',fontFamily:'Nunito,sans-serif'},
  resultScore: {fontSize:18,color:'#94A3B8',margin:'0 0 8px',fontFamily:'Nunito,sans-serif'},
  resultPct:   {fontSize:64,fontWeight:900,color:'#EF4444',fontFamily:'Nunito,sans-serif'},
  starsRow:    {display:'flex',justifyContent:'center',gap:8,margin:'12px 0 16px'},
  unlockedBox: {background:'rgba(16,185,129,0.15)',color:'#6EE7B7',border:'1px solid rgba(16,185,129,0.3)',borderRadius:12,padding:'10px 20px',fontSize:14,fontWeight:800,marginBottom:16,fontFamily:'Nunito,sans-serif'},
  aiBox:       {background:'rgba(99,102,241,0.08)',borderRadius:14,padding:'14px 16px',marginBottom:20,border:'1px solid rgba(99,102,241,0.2)',textAlign:'left',width:'100%'},
  aiRow:       {display:'flex',alignItems:'center',gap:8,marginBottom:6,fontWeight:600,color:'#94A3B8',fontFamily:'Nunito,sans-serif'},
  aiText:      {fontSize:13,color:'#94A3B8',lineHeight:1.6,margin:0,fontWeight:600,fontFamily:'Nunito,sans-serif'},
  resultBtns:  {display:'flex',gap:12,justifyContent:'center'},
  playBtn:     {background:'linear-gradient(135deg,#EF4444,#7C3AED)',color:'#fff',border:'none',padding:'14px 24px',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer',fontFamily:'Nunito,sans-serif',boxShadow:'0 4px 15px rgba(239,68,68,0.4)'},
  homeBtn:     {background:'rgba(30,41,59,0.8)',color:'#94A3B8',border:'1px solid #2D3A4F',padding:'14px 24px',borderRadius:16,fontSize:16,fontWeight:800,cursor:'pointer',fontFamily:'Nunito,sans-serif'},
};
