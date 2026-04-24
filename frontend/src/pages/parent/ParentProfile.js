import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ParentNavbar from '../../components/ParentNavbar';
import api from '../../services/api';

export default function ParentProfile() {
  const { user, setUser }         = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName,  setLastName]  = useState(user?.last_name  || '');
  const [oldPass,   setOldPass]   = useState('');
  const [newPass,   setNewPass]   = useState('');
  const [msg,       setMsg]       = useState('');
  const [msgType,   setMsgType]   = useState('success');
  const [loading,   setLoading]   = useState(false);

  const showMsg = (text, type = 'success') => {
    setMsg(text); setMsgType(type);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch('/users/update-profile/', {
        first_name: firstName,
        last_name:  lastName,
      });
      setUser({ ...user, first_name: firstName, last_name: lastName });
      showMsg('Profile updated! ✅');
    } catch {
      showMsg('Could not update.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async () => {
    if (newPass.length < 6) {
      showMsg('Password must be at least 6 characters!', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/users/change-password/', {
        old_password: oldPass,
        new_password: newPass,
      });
      setOldPass(''); setNewPass('');
      showMsg('Password changed! 🔒');
    } catch {
      showMsg('Wrong current password!', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <ParentNavbar />
      <div style={styles.content}>
        <h1 style={styles.pageTitle}>⚙️ Parent Profile</h1>

        {msg && (
          <div style={{
            ...styles.msg,
            background: msgType === 'error' ? '#FEE2E2' : '#D1FAE5',
            color:      msgType === 'error' ? '#DC2626' : '#065F46',
          }}>
            {msg}
          </div>
        )}

        <div style={styles.grid}>

          <motion.div style={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}>
            <h2 style={styles.cardTitle}>✏️ Edit My Info</h2>
            <div style={styles.field}>
              <label style={styles.label}>First Name</label>
              <input style={styles.input} value={firstName}
                onChange={e => setFirstName(e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Last Name</label>
              <input style={styles.input} value={lastName}
                onChange={e => setLastName(e.target.value)} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input style={{ ...styles.input, background: '#F3F4F6' }}
                value={user?.email || ''} disabled />
            </div>
            <motion.button style={styles.saveBtn}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleSave} disabled={loading}>
              Save Changes ✅
            </motion.button>
          </motion.div>

          <motion.div style={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}>
            <h2 style={styles.cardTitle}>🔒 Change Password</h2>
            <div style={styles.field}>
              <label style={styles.label}>Current Password</label>
              <input style={styles.input} type="password"
                value={oldPass}
                onChange={e => setOldPass(e.target.value)}
                placeholder="Current password" />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>New Password</label>
              <input style={styles.input} type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Min 6 characters" />
            </div>
            <motion.button
              style={{ ...styles.saveBtn, background: '#EF4444' }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handlePassword} disabled={loading}>
              Change Password 🔒
            </motion.button>
          </motion.div>

          <motion.div style={styles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}>
            <h2 style={styles.cardTitle}>ℹ️ Account Info</h2>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Username</span>
              <span style={styles.infoBadge}>{user?.username}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Role</span>
              <span style={styles.infoBadge}>👨‍👩‍👧 Parent</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Member Since</span>
              <span style={styles.infoBadge}>
                {new Date(user?.date_joined)
                  .toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
              </span>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  page:      { minHeight: '100vh', background: '#FFF7ED' },
  content:   { maxWidth: 900, margin: '0 auto', padding: '28px 20px' },
  pageTitle: { fontSize: 26, fontWeight: 900, color: '#1F1F2E', marginBottom: 20 },
  msg: {
    borderRadius: 12, padding: '12px 16px',
    fontSize: 14, fontWeight: 700, marginBottom: 20,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
  },
  card: {
    background: '#fff', borderRadius: 24, padding: '24px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  cardTitle: { fontSize: 16, fontWeight: 900, color: '#1F1F2E', marginBottom: 16 },
  field:     { marginBottom: 14 },
  label: {
    display: 'block', fontSize: 13,
    fontWeight: 700, color: '#4B5563', marginBottom: 5,
  },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '2px solid #FFEDD5', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Nunito, sans-serif',
  },
  saveBtn: {
    width: '100%', padding: '13px', borderRadius: 14, border: 'none',
    background: '#F97316', color: '#fff', fontSize: 15,
    fontWeight: 800, cursor: 'pointer', marginTop: 8,
    fontFamily: 'Nunito, sans-serif',
  },
  infoRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '10px 0',
    borderBottom: '1px solid #F3F4F6',
  },
  infoLabel: { fontSize: 14, color: '#6B7280', fontWeight: 600 },
  infoBadge: {
    background: '#FFEDD5', color: '#9A3412',
    padding: '4px 12px', borderRadius: 20,
    fontSize: 13, fontWeight: 700,
  },
};