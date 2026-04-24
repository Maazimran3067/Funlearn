import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function TeacherNavbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const navItems = [
    { path: '/teacher/dashboard', label: 'Dashboard', emoji: '🏠' },
    { path: '/teacher/profile',   label: 'Profile',   emoji: '⚙️' },
  ];

  return (
    <div style={styles.navbar}>
      <div style={styles.logo} onClick={() => navigate('/teacher/dashboard')}>
        <span style={{ fontSize: 28 }}>🎓</span>
        <span style={styles.logoText}>
          FunLearn <span style={{ color: '#10B981' }}>AI</span>
        </span>
        <span style={styles.roleBadge}>Teacher</span>
      </div>

      <div style={styles.navLinks}>
        {navItems.map((item) => (
          <motion.div
            key={item.path}
            style={{
              ...styles.navItem,
              background: location.pathname === item.path
                ? '#D1FAE5' : 'transparent',
              color: location.pathname === item.path
                ? '#10B981' : '#4B5563',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(item.path)}
          >
            {item.emoji} {item.label}
          </motion.div>
        ))}
      </div>

      <div style={styles.navRight}>
        <div style={styles.nameBadge}>
          👩‍🏫 {user?.first_name} {user?.last_name}
        </div>
        <motion.button
          style={styles.logoutBtn}
          whileHover={{ scale: 1.05 }}
          onClick={() => { logout(); navigate('/login'); }}
        >
          Logout
        </motion.button>
      </div>
    </div>
  );
}

const styles = {
  navbar: {
    background: '#fff', padding: '12px 28px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 12px rgba(16,185,129,0.1)',
    position: 'sticky', top: 0, zIndex: 100,
    flexWrap: 'wrap', gap: 10,
  },
  logo: {
    display: 'flex', alignItems: 'center',
    gap: 8, cursor: 'pointer',
  },
  logoText: { fontSize: 20, fontWeight: 900, color: '#10B981' },
  roleBadge: {
    background: '#D1FAE5', color: '#065F46',
    fontSize: 11, padding: '3px 10px',
    borderRadius: 20, fontWeight: 700,
  },
  navLinks: { display: 'flex', alignItems: 'center', gap: 4 },
  navItem: {
    padding: '8px 14px', borderRadius: 12,
    fontSize: 14, fontWeight: 700,
    cursor: 'pointer', transition: 'all 0.2s',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: 8 },
  nameBadge: {
    background: '#F0FDF4', color: '#065F46',
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