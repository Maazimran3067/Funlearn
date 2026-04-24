// StudentNavbar.js
// Shared navbar for all student pages

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function StudentNavbar() {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const location            = useLocation();
  const [menuOpen, setMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/student/dashboard', label: 'Home',    emoji: '🏠' },
    { path: '/student/badges',    label: 'Badges',  emoji: '🏆' },
    { path: '/student/scores',    label: 'Scores',  emoji: '📊' },
    { path: '/student/profile',   label: 'Profile', emoji: '⚙️' },
  ];

  return (
    <div style={styles.navbar}>
      {/* Logo */}
      <div
        style={styles.logo}
        onClick={() => navigate('/student/dashboard')}
      >
        <span style={{ fontSize: 28 }}>🎓</span>
        <span style={styles.logoText}>
          FunLearn <span style={{ color: '#EC4899' }}>AI</span>
        </span>
      </div>

      {/* Nav links — desktop */}
      <div style={styles.navLinks}>
        {navItems.map((item) => (
          <motion.div
            key={item.path}
            style={{
              ...styles.navItem,
              background: location.pathname === item.path
                ? '#EDE9FE' : 'transparent',
              color: location.pathname === item.path
                ? '#7C3AED' : '#4B5563',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(item.path)}
          >
            {item.emoji} {item.label}
          </motion.div>
        ))}
      </div>

      {/* Right side — stars + logout */}
      <div style={styles.navRight}>
        <div style={styles.starsBadge}>
          ⭐ {user?.profile?.total_stars || 0} Stars
        </div>
        <div style={styles.levelBadge}>
          🎯 Level {user?.profile?.current_level || 1}
        </div>
        <motion.button
          style={styles.logoutBtn}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
        >
          Logout
        </motion.button>
      </div>
    </div>
  );
}

const styles = {
  navbar: {
    background: '#fff',
    padding: '12px 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 12px rgba(124,58,237,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    flexWrap: 'wrap',
    gap: 10,
  },
  logo: {
    display: 'flex', alignItems: 'center',
    gap: 8, cursor: 'pointer',
  },
  logoText: {
    fontSize: 20, fontWeight: 900, color: '#7C3AED',
  },
  navLinks: {
    display: 'flex', alignItems: 'center', gap: 4,
  },
  navItem: {
    padding: '8px 14px', borderRadius: 12,
    fontSize: 14, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.2s',
  },
  navRight: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  starsBadge: {
    background: '#FEF3C7', color: '#D97706',
    padding: '6px 12px', borderRadius: 20,
    fontSize: 13, fontWeight: 700,
  },
  levelBadge: {
    background: '#EDE9FE', color: '#7C3AED',
    padding: '6px 12px', borderRadius: 20,
    fontSize: 13, fontWeight: 700,
  },
  logoutBtn: {
    background: '#FEE2E2', color: '#EF4444',
    border: 'none', padding: '8px 14px',
    borderRadius: 12, fontSize: 13,
    fontWeight: 700, cursor: 'pointer',
  },
};