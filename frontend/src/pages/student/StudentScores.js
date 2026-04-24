// StudentScores.js — Full score history page

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getMyScores } from '../../services/api';
import StudentNavbar from '../../components/StudentNavbar';

export default function StudentScores() {
  const [scores,  setScores]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyScores()
      .then(res => setScores(res.data.scores || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Calculate overall stats
  const totalGames   = scores.length;
  const avgScore     = totalGames > 0
    ? Math.round(scores.reduce((a, b) => a + b.percentage, 0) / totalGames)
    : 0;
  const totalStars   = scores.reduce((a, b) => a + (b.stars_earned || 0), 0);
  const bestScore    = totalGames > 0
    ? Math.max(...scores.map(s => s.percentage))
    : 0;

  const getStars = (earned) => {
    return [1, 2, 3].map(s => (
      <span key={s} style={{ opacity: s <= earned ? 1 : 0.25 }}>⭐</span>
    ));
  };

  const getScoreColor = (pct) => {
    if (pct >= 80) return '#10B981';
    if (pct >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div style={styles.page}>
      <StudentNavbar />
      <div style={styles.content}>
        <h1 style={styles.pageTitle}>📊 My Score History</h1>

        {/* Stats row */}
        <div style={styles.statsRow}>
          {[
            { emoji: '🎮', value: totalGames, label: 'Games Played' },
            { emoji: '📈', value: `${avgScore}%`, label: 'Average Score' },
            { emoji: '⭐', value: totalStars,  label: 'Stars Earned'  },
            { emoji: '🏆', value: `${bestScore}%`, label: 'Best Score'  },
          ].map((s, i) => (
            <motion.div
              key={i}
              style={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div style={{ fontSize: 28 }}>{s.emoji}</div>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Scores table */}
        {loading ? (
          <div style={styles.loading}>Loading scores... ⏳</div>
        ) : scores.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 60 }}>🎮</div>
            <p>No games played yet! Go play a game!</p>
          </div>
        ) : (
          <div style={styles.scoresList}>
            {[...scores].reverse().map((score, i) => (
              <motion.div
                key={i}
                style={styles.scoreRow}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div style={styles.gameInfo}>
                  <div style={styles.gameName}>
                    {score.game_id === 'alphabet' ? '🔤'
                      : score.game_id === 'counting' ? '⭐'
                      : score.game_id === 'colors'   ? '🎨'
                      : score.game_id === 'math'     ? '➕'
                      : score.game_id === 'memory'   ? '🃏'
                      : '🎮'}{' '}
                    {score.game_id.charAt(0).toUpperCase()
                      + score.game_id.slice(1)}
                  </div>
                  <div style={styles.gameDate}>
                    {new Date(score.played_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </div>
                </div>

                <div style={styles.scoreInfo}>
                  <div style={{
                    ...styles.scorePercent,
                    color: getScoreColor(score.percentage),
                  }}>
                    {score.percentage}%
                  </div>
                  <div style={styles.scoreDetail}>
                    {score.score}/{score.max_score} correct
                  </div>
                </div>

                <div style={styles.starsCol}>
                  {getStars(score.stars_earned || 0)}
                </div>

                <div style={{
                  ...styles.diffBadge,
                  background: score.difficulty_level <= 2
                    ? '#D1FAE5' : score.difficulty_level <= 3
                    ? '#FEF3C7' : '#FEE2E2',
                  color: score.difficulty_level <= 2
                    ? '#065F46' : score.difficulty_level <= 3
                    ? '#92400E' : '#991B1B',
                }}>
                  Lv {score.difficulty_level}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page:    { minHeight: '100vh', background: '#F9F5FF' },
  content: { maxWidth: 900, margin: '0 auto', padding: '28px 20px' },
  pageTitle: {
    fontSize: 26, fontWeight: 900,
    color: '#1F1F2E', marginBottom: 24,
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14, marginBottom: 28,
  },
  statCard: {
    background: '#fff', borderRadius: 20,
    padding: '20px 16px', textAlign: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  statValue: { fontSize: 22, fontWeight: 900, color: '#1F1F2E', marginTop: 6 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  loading:   { textAlign: 'center', padding: 40, fontSize: 16, color: '#6B7280' },
  empty: {
    textAlign: 'center', padding: '60px 20px',
    color: '#9CA3AF', fontSize: 16,
  },
  scoresList: { display: 'flex', flexDirection: 'column', gap: 10 },
  scoreRow: {
    background: '#fff', borderRadius: 16,
    padding: '16px 20px',
    display: 'flex', alignItems: 'center', gap: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  gameInfo:    { flex: 1 },
  gameName:    { fontSize: 15, fontWeight: 800, color: '#1F1F2E' },
  gameDate:    { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  scoreInfo:   { textAlign: 'right' },
  scorePercent:{ fontSize: 20, fontWeight: 900 },
  scoreDetail: { fontSize: 12, color: '#6B7280' },
  starsCol:    { fontSize: 18, minWidth: 70, textAlign: 'center' },
  diffBadge: {
    padding: '4px 10px', borderRadius: 10,
    fontSize: 12, fontWeight: 700,
  },
};