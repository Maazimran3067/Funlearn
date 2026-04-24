import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function ParentNavbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const navItems = [
    { path: '/parent/dashboard', label: 'Dashboard', emoji: '🏠' },
    { path: '/parent/profile',   label: 'Profile',   emoji: '⚙️' },
  ];

  return (
    <div style={styles.navbar}>
      <div style={styles.logo}
        onClick={() => navigate('/parent/dashboard')}>
        <span style={{ fontSize: 28 }}>🎓</span>
        <span style={styles.logoText}>
          FunLearn <span style={{ color: '#F97316' }}>AI</span>
        </span>
        <span style={styles.roleBadge}>Parent</span>
      </div>

      <div style={styles.navLinks}>
        {navItems.map((item) => (
          <motion.div
            key={item.path}
            style={{
              ...styles.navItem,
              background: location.pathname === item.path
                ? '#FFEDD5' : 'transparent',
              color: location.pathname === item.path
                ? '#F97316' : '#4B5563',
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
          👨‍👩‍👧 {user?.first_name} {user?.last_name}
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
    boxShadow: '0 2px 12px rgba(249,115,22,0.1)',
    position: 'sticky', top: 0, zIndex: 100,
    flexWrap: 'wrap', gap: 10,
  },
  logo: {
    display: 'flex', alignItems: 'center',
    gap: 8, cursor: 'pointer',
  },
  logoText:  { fontSize: 20, fontWeight: 900, color: '#F97316' },
  roleBadge: {
    background: '#FFEDD5', color: '#9A3412',
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
    background: '#FFF7ED', color: '#9A3412',
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