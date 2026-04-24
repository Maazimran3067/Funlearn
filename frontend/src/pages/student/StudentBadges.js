// StudentBadges.js — Full badge collection page

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getMyBadges } from '../../services/api';
import StudentNavbar from '../../components/StudentNavbar';

const ALL_POSSIBLE_BADGES = [
  { badge_id: 'first_game',   badge_icon: '🎮', badge_name: 'First Game!',    description: 'Played your first game'       },
  { badge_id: 'ten_games',    badge_icon: '🚀', badge_name: 'Game Explorer',  description: 'Played 10 games'              },
  { badge_id: 'high_scorer',  badge_icon: '⭐', badge_name: 'Star Player',    description: 'Scored above 80%'             },
  { badge_id: 'perfect_score',badge_icon: '💯', badge_name: 'Perfect!',       description: 'Got 100% in a game'           },
  { badge_id: 'five_stars',   badge_icon: '🌟', badge_name: 'Star Collector', description: 'Collected 5 stars'            },
];

export default function StudentBadges() {
  const [badges,  setBadges]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyBadges()
      .then(res => setBadges(res.data.badges || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const earnedIds = badges.map(b => b.badge_id);

  return (
    <div style={styles.page}>
      <StudentNavbar />
      <div style={styles.content}>
        <h1 style={styles.pageTitle}>🏆 My Badge Collection</h1>
        <p style={styles.subtitle}>
          You have earned <strong>{badges.length}</strong> out of{' '}
          <strong>{ALL_POSSIBLE_BADGES.length}</strong> badges!
        </p>

        <div style={styles.grid}>
          {ALL_POSSIBLE_BADGES.map((b, i) => {
            const earned = earnedIds.includes(b.badge_id);
            const earned_data = badges.find(
              eb => eb.badge_id === b.badge_id
            );
            return (
              <motion.div
                key={b.badge_id}
                style={{
                  ...styles.badgeCard,
                  opacity:    earned ? 1 : 0.4,
                  background: earned ? '#FEF3C7' : '#F3F4F6',
                  border:     earned
                    ? '3px solid #F59E0B'
                    : '3px solid #E5E7EB',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: earned ? 1 : 0.4, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={earned ? { scale: 1.05 } : {}}
              >
                <div style={styles.badgeEmoji}>{b.badge_icon}</div>
                <div style={styles.badgeName}>{b.badge_name}</div>
                <div style={styles.badgeDesc}>{b.description}</div>
                {earned ? (
                  <div style={styles.earnedTag}>
                    ✅ Earned!{' '}
                    {earned_data?.earned_at
                      ? new Date(earned_data.earned_at)
                          .toLocaleDateString()
                      : ''}
                  </div>
                ) : (
                  <div style={styles.lockedTag}>🔒 Not yet earned</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:      { minHeight: '100vh', background: '#F9F5FF' },
  content:   { maxWidth: 900, margin: '0 auto', padding: '28px 20px' },
  pageTitle: { fontSize: 26, fontWeight: 900, color: '#1F1F2E', marginBottom: 8 },
  subtitle:  { fontSize: 15, color: '#6B7280', marginBottom: 28 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 16,
  },
  badgeCard: {
    borderRadius: 20, padding: '24px 16px',
    textAlign: 'center',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  badgeEmoji: { fontSize: 48, marginBottom: 10 },
  badgeName:  { fontSize: 14, fontWeight: 900, color: '#1F1F2E', marginBottom: 6 },
  badgeDesc:  { fontSize: 12, color: '#6B7280', marginBottom: 10 },
  earnedTag: {
    background: '#D1FAE5', color: '#065F46',
    borderRadius: 10, padding: '4px 10px',
    fontSize: 12, fontWeight: 700,
  },
  lockedTag: {
    background: '#F3F4F6', color: '#9CA3AF',
    borderRadius: 10, padding: '4px 10px',
    fontSize: 12, fontWeight: 700,
  },
};