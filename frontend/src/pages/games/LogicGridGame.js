import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitScore } from '../../services/api';
import useStageProgress from '../hooks/useStageProgress';
import { useAuth } from '../../context/AuthContext';

const PUZZLES = [
  {
    clue: "Ali has a red bag. Sara has a blue bag. What colour bag does Ali have?",
    answer: "Red",
    options: ["Red","Blue","Green","Yellow"],
  },
  {
    clue: "There are 3 animals: cat, dog, fish. The cat does NOT live in water. The fish lives in water. What lives in water?",
    answer: "Fish",
    options: ["Cat","Dog","Fish","Bird"],
  },
  {
    clue: "Zara is taller than Ahmed. Ahmed is taller than Bilal. Who is the shortest?",
    answer: "Bilal",
    options: ["Zara","Ahmed","Bilal","Same height"],
  },
  {
    clue: "I am thinking of a number. It is greater than 5 and less than 8. What is it?",
    answer: "6 or 7",
    options: ["5","6 or 7","8","9"],
  },
  {
    clue: "All birds have wings. Penguin is a bird. Does a penguin have wings?",
    answer: "Yes",
    options: ["Yes","No","Sometimes","Maybe"],
  },
  {
    clue: "Monday comes before Tuesday. Tuesday comes before Wednesday. What comes first?",
    answer: "Monday",
    options: ["Monday","Tuesday","Wednesday","Friday"],
  },
  {
    clue: "A box has apples and oranges. There are more apples than oranges. Are there fewer oranges than apples?",
    answer: "Yes",
    options: ["Yes","No","Equal","Cannot tell"],
  },
  {
    clue: "Hamza runs faster than Omar. Omar runs faster than Fatima. Who is the fastest?",
    answer: "Hamza",
    options: ["Hamza","Omar","Fatima","Same speed"],
  },
  {
    clue: "If all cats are animals, and Mochi is a cat, is Mochi an animal?",
    answer: "Yes",
    options: ["Yes","No","Sometimes","Only outdoors"],
  },
  {
    clue: "A train leaves at 9:00 AM and arrives at 11:00 AM. How long is the journey?",
    answer: "2 hours",
    options: ["1 hour","2 hours","3 hours","30 minutes"],
  },
];

const STAGES = [
  { stage: 0, qs: [0, 1, 2, 3, 4], label: 'Stage 1', pass: 70 },
  { stage: 1, qs: [2, 3, 4, 5, 6], label: 'Stage 2', pass: 70 },
  { stage: 2, qs: [4, 5, 6, 7, 8], label: 'Stage 3', pass: 70 },
  { stage: 3, qs: [5, 6, 7, 8, 9], label: 'Stage 4', pass: 70 },
  { stage: 4, qs: [0, 3, 5, 7, 9], label: 'Stage 5', pass: 70 },
];

export default function LogicGridGame() {
  const navigate = useNavigate();
  const { unlockedStages, unlockStage } = useStageProgress('logicgrid');
  const [screen, setScreen] = useState('stages');
  const [stageIdx, setStageIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const TOTAL = 5;

  const startStage = (idx) => {
    setStageIdx(idx);
    scoreRef.current = 0;
    setScore(0);
    setQIdx(0);
    setFeedback(null);
    setScreen('game');
  };

  const curQ = PUZZLES[STAGES[stageIdx]?.qs[qIdx] || 0];

  const handlePick = async (option) => {
    if (feedback) return;
    const correct = option === curQ.answer;
    if (correct) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
    setFeedback({ correct, chosen: option });
    setTimeout(async () => {
      setFeedback(null);
      if (qIdx + 1 >= TOTAL) {
        const pct = Math.round((scoreRef.current / TOTAL) * 100);
        const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
        await submitScore({
          game_id: 'logicgrid',
          score: scoreRef.current,
          max_score: TOTAL,
          percentage: pct,
          stars,
          difficulty_level: stageIdx + 1,
        }).catch(() => {});
        if (pct >= 70) await unlockStage(stageIdx + 1);
        setScreen('result');
      } else {
        setQIdx((q) => q + 1);
      }
    }, 1000);
  };

  const pct = Math.round((score / TOTAL) * 100);

  if (screen === 'stages')
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0B1120',
          padding: '28px',
          marginLeft: 220,
          marginTop: 60,
        }}
      >
        <button
          onClick={() => navigate('/student/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'Nunito,sans-serif',
            marginBottom: 20,
          }}
        >
          ← Back
        </button>
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#F1F5F9',
            fontFamily: 'Nunito,sans-serif',
            marginBottom: 6,
          }}
        >
          🧩 Logic Grid
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#94A3B8',
            fontFamily: 'Nunito,sans-serif',
            marginBottom: 24,
          }}
        >
          Read the clue carefully and use logic to find the answer!
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
            gap: 12,
          }}
        >
          {STAGES.map((s, i) => {
            const unlocked = unlockedStages.includes(i);
            return (
              <motion.div
                key={i}
                style={{
                  background: '#1E293B',
                  border: '1px solid #2D3A4F',
                  borderRadius: 16,
                  padding: 20,
                  textAlign: 'center',
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                  opacity: unlocked ? 1 : 0.5,
                }}
                whileHover={
                  unlocked
                    ? {
                        scale: 1.04,
                        borderColor: 'rgba(99,102,241,0.4)',
                        boxShadow: '0 8px 28px rgba(99,102,241,0.15)',
                      }
                    : {}
                }
                whileTap={unlocked ? { scale: 0.96 } : {}}
                onClick={() => unlocked && startStage(i)}
              >
                <div style={{ fontSize: 30, marginBottom: 8 }}>
                  {unlocked ? '🧩' : '🔒'}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#F1F5F9',
                    fontFamily: 'Nunito,sans-serif',
                  }}
                >
                  {s.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );

  if (screen === 'result')
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0B1120',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: '#1E293B',
            border: '1px solid #2D3A4F',
            borderRadius: 24,
            padding: '40px',
            textAlign: 'center',
            maxWidth: 380,
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 12 }}>
            {pct >= 70 ? '🎉' : '💪'}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#F1F5F9',
              fontFamily: 'Nunito,sans-serif',
            }}
          >
            {pct >= 70 ? 'Logic Master!' : 'Keep Thinking!'}
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: '#6366F1',
              fontFamily: 'Nunito,sans-serif',
              margin: '12px 0',
            }}
          >
            {pct}%
          </div>
          <div
            style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => startStage(stageIdx)}
              style={{
                padding: '10px 22px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'Nunito,sans-serif',
              }}
            >
              Retry
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setScreen('stages')}
              style={{
                padding: '10px 22px',
                borderRadius: 12,
                border: '1px solid #2D3A4F',
                background: 'transparent',
                color: '#94A3B8',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Nunito,sans-serif',
              }}
            >
              Stages
            </motion.button>
          </div>
        </motion.div>
      </div>
    );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0B1120',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 540 }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}
        >
          <span
            style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Nunito,sans-serif' }}
          >
            {qIdx + 1}/{TOTAL}
          </span>
          <span
            style={{
              fontSize: 13,
              color: '#6366F1',
              fontWeight: 700,
              fontFamily: 'Nunito,sans-serif',
            }}
          >
            🧩 {score} correct
          </span>
        </div>
        <div
          style={{
            height: 5,
            background: '#2D3A4F',
            borderRadius: 10,
            marginBottom: 24,
            overflow: 'hidden',
          }}
        >
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg,#6366F1,#8B5CF6)',
              borderRadius: 10,
            }}
            animate={{ width: `${(qIdx / TOTAL) * 100}%` }}
          />
        </div>

        <motion.div
          key={qIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            background: '#1E293B',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 20,
            padding: 28,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#6366F1',
              letterSpacing: '0.8px',
              fontFamily: 'Nunito,sans-serif',
              marginBottom: 12,
            }}
          >
            🧩 READ THE CLUE
          </div>
          <div
            style={{
              fontSize: 16,
              color: '#F1F5F9',
              fontFamily: 'Nunito,sans-serif',
              lineHeight: 1.7,
              fontWeight: 600,
            }}
          >
            {curQ.clue}
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {curQ.options.map((opt, i) => {
            const isCorrect = opt === curQ.answer;
            const wasChosen = feedback?.chosen === opt;
            return (
              <motion.button
                key={i}
                style={{
                  padding: '16px 12px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  fontFamily: 'Nunito,sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  background: feedback
                    ? isCorrect
                      ? 'rgba(16,185,129,0.2)'
                      : wasChosen
                      ? 'rgba(239,68,68,0.15)'
                      : 'rgba(30,41,59,0.4)'
                    : 'rgba(30,41,59,0.6)',
                  color: feedback
                    ? isCorrect
                      ? '#10B981'
                      : wasChosen
                      ? '#EF4444'
                      : '#64748B'
                    : '#F1F5F9',
                  border: feedback
                    ? isCorrect
                      ? '1px solid rgba(16,185,129,0.5)'
                      : wasChosen
                      ? '1px solid rgba(239,68,68,0.4)'
                      : '1px solid #2D3A4F'
                    : '1px solid #2D3A4F',
                }}
                whileHover={
                  !feedback
                    ? {
                        scale: 1.03,
                        borderColor: 'rgba(99,102,241,0.4)',
                        background: 'rgba(99,102,241,0.1)',
                        color: '#818CF8',
                      }
                    : {}
                }
                whileTap={!feedback ? { scale: 0.97 } : {}}
                onClick={() => !feedback && handlePick(opt)}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: 'center',
                marginTop: 14,
                fontSize: 16,
                fontWeight: 800,
                color: feedback.correct ? '#10B981' : '#EF4444',
                fontFamily: 'Nunito,sans-serif',
              }}
            >
              {feedback.correct ? '✅ Correct thinking!' : `❌ Answer: ${curQ.answer}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
