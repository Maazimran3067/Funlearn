// pages/Dashboard.js
// The main dashboard kids see after logging in!

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getMyBadges, getLeaderboard } from '../services/api';

// Game cards data
const GAMES = [
  {
    id: 'alphabet',
    title: 'Alphabet Adventure',
    emoji: '🔤',
    desc: 'Learn your ABCs!',
    color: '#7C3AED',
    light: '#EDE9FE',
    path: '/games/alphabet',
  },
  {
    id: 'colors',
    title: 'Color Explorer',
    emoji: '🎨',
    desc: 'Learn all the colors!',
    color: '#EC4899',
    light: '#FCE7F3',
    path: '/games/colors',
  },
  {
    id: 'counting',
    title: 'Counting Stars',
    emoji: '⭐',
    desc: 'Count 1 to 20!',
    color: '#F59E0B',
    light: '#FEF3C7',
    path: '/games/counting',
  },
];

export default function Dashboard() {
  const { user, logout }        = useAuth();
  const navigate                = useNavigate();
  const [badges, setBadges]     = useState([]);
  const [leaders, setLeaders]   = useState([]);
  const [stars, setStars]       = useState(0);

  useEffect(() => {
    // Fetch badges and leaderboard when dashboard loads
    getMyBadges()
      .then(res => setBadges(res.data.badges))
      .catch(() => {});

    getLeaderboard()
      .then(res => setLeaders(res.data.leaderboard))
      .catch(() => {});

    // Get stars from student profile
    if (user?.student_profile) {
      setStars(user.student_profile.total_stars || 0);
    }
  }, [user]);

  return (
    <div style={styles.page}>

      {/* TOP NAVBAR */}
      <div style={styles.navbar}>
        <div style={styles.navLogo}>
          <span style={{fontSize:28}}>🎓</span>
          <span style={styles.navTitle}>
            FunLearn <span style={{color:'#EC4899'}}>AI</span>
          </span>
        </div>
        <div style={styles.navRight}>
          <div style={styles.starBadge}>⭐ {stars} Stars</div>
          <motion.button
            style={styles.logoutBtn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { logout(); navigate('/login'); }}
          >
            Logout
          </motion.button>
        </div>
      </div>

      <div style={styles.content}>

        {/* WELCOME BANNER */}
        <motion.div
          style={styles.welcomeBanner}
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5 }}
        >
          <div>
            <h1 style={styles.welcomeTitle}>
              Hi {user?.first_name}! 👋
            </h1>
            <p style={styles.welcomeSub}>
              Ready for today's learning adventure? 🚀
            </p>
            {/* Stars progress bar */}
            <div style={styles.progressArea}>
              <div style={styles.progressLabel}>
                ⭐ {stars} / 50 stars to next level!
              </div>
              <div style={styles.progressBar}>
                <motion.div
                  style={styles.progressFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stars/50)*100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>
          </div>
          <div style={styles.bannerEmoji}>🌈</div>
        </motion.div>

        {/* GAMES SECTION */}
        <h2 style={styles.sectionTitle}>🎮 Choose a Game!</h2>
        <div style={styles.gamesGrid}>
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              style={{...styles.gameCard, background: game.light,
                      borderTop: `5px solid ${game.color}`}}
              initial={{ opacity:0, y:30 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(game.path)}
            >
              <div style={styles.gameEmoji}>{game.emoji}</div>
              <h3 style={{...styles.gameTitle, color: game.color}}>
                {game.title}
              </h3>
              <p style={styles.gameDesc}>{game.desc}</p>
              <motion.div
                style={{...styles.playBtn, background: game.color}}
                whileHover={{ scale: 1.05 }}
              >
                Play Now! 🎯
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* BADGES + LEADERBOARD ROW */}
        <div style={styles.bottomRow}>

          {/* MY BADGES */}
          <motion.div
            style={styles.panel}
            initial={{ opacity:0, x:-20 }}
            animate={{ opacity:1, x:0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 style={styles.panelTitle}>🏆 My Badges</h2>
            {badges.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{fontSize:40}}>🎯</div>
                <p>Play games to earn badges!</p>
              </div>
            ) : (
              <div style={styles.badgesGrid}>
                {badges.map((b, i) => (
                  <motion.div
                    key={i}
                    style={styles.badgeItem}
                    whileHover={{ scale: 1.1 }}
                    title={b.description}
                  >
                    <div style={styles.badgeIcon}>{b.badge_icon}</div>
                    <div style={styles.badgeName}>{b.badge_name}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* LEADERBOARD */}
          <motion.div
            style={styles.panel}
            initial={{ opacity:0, x:20 }}
            animate={{ opacity:1, x:0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 style={styles.panelTitle}>🌟 Top Learners</h2>
            {leaders.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{fontSize:40}}>🚀</div>
                <p>Be the first on the board!</p>
              </div>
            ) : (
              <div>
                {leaders.map((s, i) => (
                  <div key={i} style={styles.leaderRow}>
                    <span style={{
                      ...styles.leaderRank,
                      background: i===0?'#FEF3C7':i===1?'#F3F4F6':'#FFF7ED',
                      color: i===0?'#D97706':i===1?'#6B7280':'#92400E',
                    }}>
                      {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                    </span>
                    <span style={styles.leaderName}>
                      {s.first_name} {s.last_name}
                    </span>
                    <span style={styles.leaderStars}>
                      ⭐ {s.total_stars}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight:'100vh', background:'#F9F5FF' },
  navbar: {
    background:'#fff', padding:'14px 28px',
    display:'flex', alignItems:'center', justifyContent:'space-between',
    boxShadow:'0 2px 12px rgba(124,58,237,0.08)',
    position:'sticky', top:0, zIndex:100,
  },
  navLogo:  { display:'flex', alignItems:'center', gap:10 },
  navTitle: { fontSize:22, fontWeight:900, color:'#7C3AED' },
  navRight: { display:'flex', alignItems:'center', gap:12 },
  starBadge: {
    background:'#FEF3C7', color:'#D97706',
    padding:'6px 14px', borderRadius:20, fontSize:14, fontWeight:700,
  },
  logoutBtn: {
    background:'#FEE2E2', color:'#EF4444',
    border:'none', padding:'8px 16px',
    borderRadius:12, fontSize:14, fontWeight:700,
  },
  content: { maxWidth:1100, margin:'0 auto', padding:'28px 20px' },
  welcomeBanner: {
    background:'linear-gradient(135deg, #7C3AED, #EC4899)',
    borderRadius:24, padding:'28px 32px', color:'#fff',
    display:'flex', justifyContent:'space-between', alignItems:'center',
    marginBottom:32,
    boxShadow:'0 12px 32px rgba(124,58,237,0.25)',
  },
  welcomeTitle: { fontSize:28, fontWeight:900, margin:0 },
  welcomeSub:   { fontSize:15, opacity:0.9, margin:'6px 0 16px' },
  progressArea: { maxWidth:360 },
  progressLabel:{ fontSize:13, fontWeight:700, marginBottom:6, opacity:0.9 },
  progressBar: {
    height:12, background:'rgba(255,255,255,0.3)',
    borderRadius:10, overflow:'hidden',
  },
  progressFill: {
    height:'100%', background:'#FCD34D', borderRadius:10,
  },
  bannerEmoji: { fontSize:72, lineHeight:1 },
  sectionTitle: {
    fontSize:22, fontWeight:900, color:'#1F1F2E', marginBottom:16,
  },
  gamesGrid: {
    display:'grid',
    gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
    gap:20, marginBottom:32,
  },
  gameCard: {
    borderRadius:24, padding:'28px 24px', cursor:'pointer',
    boxShadow:'0 4px 16px rgba(0,0,0,0.06)',
  },
  gameEmoji: { fontSize:52, marginBottom:12 },
  gameTitle: { fontSize:20, fontWeight:900, margin:'0 0 6px' },
  gameDesc:  { fontSize:14, color:'#6B7280', margin:'0 0 16px' },
  playBtn: {
    display:'inline-block', color:'#fff',
    padding:'10px 20px', borderRadius:12,
    fontSize:14, fontWeight:800,
  },
  bottomRow: {
    display:'grid',
    gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
    gap:20,
  },
  panel: {
    background:'#fff', borderRadius:24, padding:'24px',
    boxShadow:'0 4px 16px rgba(0,0,0,0.06)',
  },
  panelTitle: { fontSize:18, fontWeight:900, color:'#1F1F2E', marginBottom:16 },
  emptyState: {
    textAlign:'center', padding:'20px 0',
    color:'#9CA3AF', fontSize:14,
  },
  badgesGrid: {
    display:'flex', flexWrap:'wrap', gap:12,
  },
  badgeItem: {
    textAlign:'center', cursor:'pointer',
  },
  badgeIcon: { fontSize:36 },
  badgeName: { fontSize:11, fontWeight:700, color:'#6B7280', marginTop:4 },
  leaderRow: {
    display:'flex', alignItems:'center', gap:12,
    padding:'10px 0',
    borderBottom:'1px solid #F3F4F6',
  },
  leaderRank: {
    width:36, height:36, borderRadius:10,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:14, fontWeight:800,
  },
  leaderName:  { flex:1, fontSize:14, fontWeight:700 },
  leaderStars: { fontSize:13, fontWeight:700, color:'#D97706' },
};