import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', emoji: '🏠' },
    { path: '/admin/users',     label: 'All Users',  emoji: '👥' },
    { path: '/admin/classes',   label: 'Classes',    emoji: '🏫' },
    { path: '/admin/games',     label: 'Games',      emoji: '🎮' },
    { path: '/admin/profile',   label: 'Profile',    emoji: '⚙️' },
  ];

  return (
    <div style={styles.navbar}>
      <div style={styles.logo}
        onClick={() => navigate('/admin/dashboard')}>
        <span style={{ fontSize: 28 }}>🎓</span>
        <span style={styles.logoText}>
          FunLearn <span style={{ color: '#EF4444' }}>AI</span>
        </span>
        <span style={styles.roleBadge}>Admin</span>
      </div>

      <div style={styles.navLinks}>
        {navItems.map((item) => (
          <motion.div
            key={item.path}
            style={{
              ...styles.navItem,
              background: location.pathname === item.path
                ? '#FEE2E2' : 'transparent',
              color: location.pathname === item.path
                ? '#EF4444' : '#4B5563',
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
          🔧 {user?.first_name} {user?.last_name}
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
    boxShadow: '0 2px 12px rgba(239,68,68,0.1)',
    position: 'sticky', top: 0, zIndex: 100,
    flexWrap: 'wrap', gap: 10,
  },
  logo: {
    display: 'flex', alignItems: 'center',
    gap: 8, cursor: 'pointer',
  },
  logoText:  { fontSize: 20, fontWeight: 900, color: '#EF4444' },
  roleBadge: {
    background: '#FEE2E2', color: '#991B1B',
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
    background: '#FEF2F2', color: '#991B1B',
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