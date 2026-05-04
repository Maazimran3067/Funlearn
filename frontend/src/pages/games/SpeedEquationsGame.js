import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore } from '../../services/api';
import useStageProgress from '../hooks/useStageProgress';
import { useAuth } from '../../../context/AuthContext';

/**
 * Generates a random equation based on the current stage difficulty.
 * @param {number} stage - The current game stage (0-4).
 */
function makeEq(stage) {
  const ops = ['+', '-', '×', '÷'];
  // Stage 0-1 only use + and -, later stages use all operators
  const op = stage < 2 ? ops[Math.floor(Math.random() * 2)] : ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;

  if (op === '+') {
    a = Math.floor(Math.random() * (8 + stage * 4)) + 1;
    b = Math.floor(Math.random() * (8 + stage * 4)) + 1;
    answer = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * (10 + stage * 4)) + 5;
    b = Math.floor(Math.random() * a) + 1;
    answer = a - b;
  } else if (op === '×') {
    a = Math.floor(Math.random() * (4 + stage * 2)) + 1;
    b = Math.floor(Math.random() * (4 + stage * 2)) + 1;
    answer = a * b;
  } else {
    // Division: ensure integer results
    b = Math.floor(Math.random() * 8) + 1;
    answer = Math.floor(Math.random() * 8) + 1;
    a = b * answer;
  }

  // Generate unique wrong options
  const wrongs = new Set();
  while (wrongs.size < 3) {
    const w = answer + (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
    if (w !== answer && w >= 0) wrongs.add(w);
  }

  const options = [answer, ...wrongs].sort(() => Math.random() - 0.5);
  return { eq: `${a} ${op} ${b} = ?`, answer, options };
}

const STAGES = [
  { stage: 0, time: 20, label: 'Stage 1 — Basic', pass: 70 },
  { stage: 1, time: 18, label: 'Stage 2 — Adding Speed', pass: 70 },
  { stage: 2, time: 15, label: 'Stage 3 — Mixed Ops', pass: 70 },
  { stage: 3, time: 12, label: 'Stage 4 — Fast Math', pass: 70 },
  { stage: 4, time: 10, label: 'Stage 5 — Speed Master', pass: 70 },
];

export default function SpeedEquationsGame() {
  const navigate = useNavigate();
  const { unlockedStages, unlockStage } = useStageProgress('speedeq');
  const [screen, setScreen] = useState('stages');
  const [stageIdx, setStageIdx] = useState(0);
  const [eq, setEq] = useState(null);
  const [qNum, setQNum] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const timerRef = useRef(null);
  const TOTAL = 5;

  const nextQuestion = useCallback((idx) => {
    setEq(makeEq(idx));
    setFeedback(null);
    setTimeLeft(STAGES[idx].time);
  }, []);

  const endStage = useCallback(async (finalScore, idx) => {
    clearInterval(timerRef.current);
    const pct = Math.round((finalScore / TOTAL) * 100);
    const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
    
    await submitScore({
      game_id: 'speedeq',
      score: finalScore,
      max_score: TOTAL,
      percentage: pct,
      stars,
      difficulty_level: idx + 1
    }).catch(() => {});

    if (pct >= 70) await unlockStage(idx + 1);
    
    setScore(finalScore);
    setScreen('result');
  }, [unlockStage]);

  // Timer Logic
  useEffect(() => {
    if (screen !== 'game' || feedback) return;

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setFeedback({ correct: false, timedOut: true });
          
          setTimeout(() => {
            const nextQ = qNum + 1;
            if (nextQ >= TOTAL) {
              endStage(scoreRef.current, stageIdx);
            } else {
              setQNum(nextQ);
              nextQuestion(stageIdx);
            }
          }, 900);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [screen, qNum, feedback, stageIdx, endStage, nextQuestion]);

  const startStage = (idx) => {
    setStageIdx(idx);
    scoreRef.current = 0;
    setScore(0);
    setQNum(0);
    setFeedback(null);
    setEq(makeEq(idx));
    setTimeLeft(STAGES[idx].time);
    setScreen('game');
  };

  const handlePick = (option) => {
    if (feedback) return;
    clearInterval(timerRef.current);
    
    const correct = option === eq.answer;
    if (correct) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
    
    setFeedback({ correct, chosen: option });

    setTimeout(() => {
      const nextQ = qNum + 1;
      if (nextQ >= TOTAL) {
        endStage(scoreRef.current, stageIdx);
      } else {
        setQNum(nextQ);
        nextQuestion(stageIdx);
      }
    }, 800);
  };

  const pct = Math.round((score / TOTAL) * 100);
  const timerPct = (timeLeft / STAGES[stageIdx]?.time) * 100;

  // View: Stage Selection
  if (screen === 'stages') return (
    <div style={{ minHeight: '100vh', background: '#0B1120', padding: '28px', marginLeft: 220, marginTop: 60 }}>
      <button onClick={() => navigate('/student/dashboard')}
        style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer',
          fontSize: 13, fontFamily: 'Nunito,sans-serif', marginBottom: 20 }}>← Back</button>
      
      <div style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif', marginBottom: 6 }}>
        ⚡ Speed Equations</div>
      <div style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Nunito,sans-serif', marginBottom: 24 }}>
        Solve equations before the timer runs out!</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
        {STAGES.map((s, i) => {
          const unlocked = unlockedStages.includes(i);
          return (
            <motion.div key={i}
              style={{ background: '#1E293B', border: '1px solid #2D3A4F', borderRadius: 16,
                padding: 20, textAlign: 'center', cursor: unlocked ? 'pointer' : 'not-allowed', opacity: unlocked ? 1 : 0.5 }}
              whileHover={unlocked ? { scale: 1.04, borderColor: 'rgba(245,158,11,0.4)',
                boxShadow: '0 8px 28px rgba(245,158,11,0.15)' } : {}}
              whileTap={unlocked ? { scale: 0.96 } : {}}
              onClick={() => unlocked && startStage(i)}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>{unlocked ? '⚡' : '🔒'}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif' }}>
                {s.label}</div>
              <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginTop: 4 }}>
                ⏱ {s.time}s per question</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // View: Results
  if (screen === 'result') return (
    <div style={{ minHeight: '100vh', background: '#0B1120', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#1E293B', border: '1px solid #2D3A4F', borderRadius: 24,
          padding: '40px', textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>{pct >= 70 ? '⚡' : '💪'}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif' }}>
          {pct >= 70 ? 'Lightning Fast!' : 'Keep Practicing!'}</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: '#F59E0B', fontFamily: 'Nunito,sans-serif', margin: '12px 0' }}>
          {pct}%</div>
        <div style={{ fontSize: 14, color: '#94A3B8', fontFamily: 'Nunito,sans-serif', marginBottom: 20 }}>
          {score} / {TOTAL} correct
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => startStage(stageIdx)}
            style={{ padding: '10px 22px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#F59E0B,#FBBF24)', color: '#0B1120',
              fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
            Retry</motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setScreen('stages')}
            style={{ padding: '10px 22px', borderRadius: 12, border: '1px solid #2D3A4F',
              background: 'transparent', color: '#94A3B8', fontSize: 14,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
            Stages</motion.button>
        </div>
      </motion.div>
    </div>
  );

  // View: Main Gameplay
  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        
        {/* Progress Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Nunito,sans-serif' }}>{qNum + 1}/{TOTAL}</span>
          <span style={{ fontSize: 13, color: '#F59E0B', fontWeight: 800, fontFamily: 'Nunito,sans-serif',
            display: 'flex', alignItems: 'center', gap: 5 }}>
            ⏱ {timeLeft}s
          </span>
        </div>

        {/* Dynamic Timer Bar */}
        <div style={{ height: 8, background: '#2D3A4F', borderRadius: 10, marginBottom: 24, overflow: 'hidden' }}>
          <motion.div style={{ height: '100%', borderRadius: 10,
            background: timerPct > 50 ? 'linear-gradient(90deg,#10B981,#34D399)'
              : timerPct > 25 ? 'linear-gradient(90deg,#F59E0B,#FBBF24)'
              : 'linear-gradient(90deg,#EF4444,#F87171)' }}
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 0.3 }} />
        </div>

        {/* Equation Display */}
        <motion.div key={qNum} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ background: '#1E293B', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 20, padding: '36px 28px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: '0.8px',
            fontFamily: 'Nunito,sans-serif', marginBottom: 12 }}>⚡ SOLVE IT</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: '#F1F5F9',
            fontFamily: 'Nunito,sans-serif', letterSpacing: 2 }}>
            {eq?.eq}
          </div>
        </motion.div>

        {/* Answer Options Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {eq?.options.map((opt, i) => {
            const isCorrect = opt === eq.answer;
            const wasChosen = feedback?.chosen === opt;
            return (
              <motion.button key={i}
                style={{ padding: '18px', borderRadius: 14, cursor: 'pointer',
                  fontSize: 22, fontWeight: 900, fontFamily: 'Nunito,sans-serif',
                  background: feedback
                    ? isCorrect ? 'rgba(16,185,129,0.2)'
                    : wasChosen ? 'rgba(239,68,68,0.15)' : 'rgba(30,41,59,0.4)'
                    : 'rgba(30,41,59,0.6)',
                  color: feedback
                    ? isCorrect ? '#10B981' : wasChosen ? '#EF4444' : '#64748B'
                    : '#F1F5F9',
                  border: feedback
                    ? isCorrect ? '1px solid rgba(16,185,129,0.5)'
                    : wasChosen ? '1px solid rgba(239,68,68,0.4)' : '1px solid #2D3A4F'
                    : '1px solid #2D3A4F' }}
                whileHover={!feedback ? { scale: 1.05, borderColor: 'rgba(245,158,11,0.5)',
                  background: 'rgba(245,158,11,0.1)', color: '#F59E0B' } : {}}
                whileTap={!feedback ? { scale: 0.95 } : {}}
                onClick={() => !feedback && handlePick(opt)}>
                {opt}
              </motion.button>
            );
          })}
        </div>

        {/* Feedback Messages */}
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ textAlign: 'center', marginTop: 14, fontSize: 17, fontWeight: 800,
                fontFamily: 'Nunito,sans-serif',
                color: feedback.correct ? '#10B981' : feedback.timedOut ? '#F59E0B' : '#EF4444' }}>
              {feedback.correct ? '✅ Correct!' : feedback.timedOut ? '⏱ Time up!' : `❌ Answer: ${eq?.answer}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
