//this is studentprofile.js


import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, changePassword } from '../../services/api';
import StudentNavbar from '../../components/StudentNavbar';

function normaliseAge(raw) {
  const s = String(raw || '').trim();
  if (s === '3-5' || s === '3-6') return '3-6';
  if (s === '6-8' || s === '6-9') return '6-9';
  if (s === '9-12') return '9-12';
  return s || '6-9';
}
const AGE_LABEL = {
  '3-6':  '🐣 Little Explorer (Age 3–6)',
  '6-9':  '🚀 Junior Learner (Age 6–9)',
  '9-12': '🧠 Super Scholar (Age 9–12)',
};

function DarkInp({ label, type = 'text', value, onChange, placeholder }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 11, fontWeight: 700,
        color: '#94A3B8', marginBottom: 6, fontFamily: 'Nunito,sans-serif',
        letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</label>}
      <div style={{
        background: f ? 'rgba(30,41,59,0.95)' : 'rgba(15,23,42,0.7)',
        border: `1px solid ${f ? '#6366F1' : '#2D3A4F'}`,
        borderRadius: 12, padding: '12px 14px',
        boxShadow: f ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
        transition: 'all 0.2s',
      }}>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setF(true)} onBlur={() => setF(false)}
          style={{ width: '100%', background: 'transparent', border: 'none',
            outline: 'none', color: '#F1F5F9', fontSize: 14, fontFamily: 'Nunito,sans-serif' }} />
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const { user, setUser } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [pwMode,   setPwMode]   = useState(false);
  const [msg,      setMsg]      = useState({ type: '', text: '' });
  const [form,     setForm]     = useState({ first_name: '', last_name: '' });
  const [pw,       setPw]       = useState({ old_password: '', new_password: '', confirm: '' });

  useEffect(() => {
    getProfile()
      .then(r => {
        setProfile(r.data);
        setForm({ first_name: r.data.first_name, last_name: r.data.last_name });
      })
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const handleSave = async () => {
    try {
      await updateProfile({ first_name: form.first_name, last_name: form.last_name });
      if (setUser) setUser({ ...user, first_name: form.first_name, last_name: form.last_name });
      showMsg('success', 'Profile updated successfully!');
      setEditMode(false);
    } catch { showMsg('error', 'Could not update profile. Please try again.'); }
  };

  const handlePw = async () => {
    if (pw.new_password !== pw.confirm) { showMsg('error', 'Passwords do not match!'); return; }
    if (pw.new_password.length < 8) { showMsg('error', 'New password must be at least 8 characters.'); return; }
    try {
      await changePassword({ old_password: pw.old_password, new_password: pw.new_password });
      showMsg('success', 'Password changed successfully!');
      setPwMode(false);
      setPw({ old_password: '', new_password: '', confirm: '' });
    } catch { showMsg('error', 'Wrong current password. Please try again.'); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0B1120', display: 'flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#64748B', fontSize: 16, fontFamily: 'Nunito,sans-serif' }}>
        Loading profile... ✨</div>
    </div>
  );

  const ag = normaliseAge(profile?.profile?.age_group);
  const stars = profile?.profile?.total_stars || 0;
  const level = profile?.profile?.current_level || 1;
  const xp = Math.min(100, stars % 100);

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120' }}>
      <StudentNavbar />
      <div style={{ marginLeft: 220, marginTop: 60, padding: '28px' }}>

        <div style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9',
          fontFamily: 'Nunito,sans-serif', marginBottom: 24 }}>⚙️ My Profile</div>

        <AnimatePresence>
          {msg.text && (
            <motion.div key="msg" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: msg.type === 'success' ? '#6EE7B7' : '#FCA5A5',
                borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                fontSize: 13, fontWeight: 700, fontFamily: 'Nunito,sans-serif',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              {msg.type === 'success' ? '✅' : '❌'} {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PROFILE CARD ── */}
        <div style={{ background: '#1E293B', border: '1px solid #2D3A4F',
          borderRadius: 20, padding: '28px', marginBottom: 20 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 22, flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: 18,
                background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, color: '#fff', fontWeight: 900,
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
                {profile?.first_name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#F1F5F9',
                  fontFamily: 'Nunito,sans-serif' }}>
                  {profile?.first_name} {profile?.last_name}
                </div>
                <div style={{ fontSize: 13, color: '#6366F1', fontWeight: 700,
                  fontFamily: 'Nunito,sans-serif', marginTop: 2 }}>@{profile?.username}</div>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginTop: 2 }}>
                  {profile?.email?.includes('@student.funlearn') ? 'Student Account' : profile?.email}
                </div>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => { setEditMode(!editMode); setMsg({ type: '', text: '' }); }}
              style={{ background: editMode ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)',
                color: editMode ? '#EF4444' : '#818CF8',
                border: `1px solid ${editMode ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}`,
                padding: '10px 20px', borderRadius: 12, fontSize: 13,
                fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
              {editMode ? 'Cancel' : '✏️ Edit Name'}
            </motion.button>
          </div>

          <AnimatePresence>
            {editMode && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <DarkInp label="First Name" placeholder="First name"
                    value={form.first_name}
                    onChange={e => setForm({ ...form, first_name: e.target.value })} />
                  <DarkInp label="Last Name" placeholder="Last name"
                    value={form.last_name}
                    onChange={e => setForm({ ...form, last_name: e.target.value })} />
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff',
                    border: 'none', padding: '12px 28px', borderRadius: 12, fontSize: 14,
                    fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito,sans-serif',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
                  Save Changes ✅
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* XP bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Nunito,sans-serif' }}>
                Level {level} — XP Progress
              </span>
              <span style={{ fontSize: 12, color: '#6366F1', fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
                {stars % 100} / 100
              </span>
            </div>
            <div style={{ height: 8, background: '#2D3A4F', borderRadius: 10, overflow: 'hidden' }}>
              <motion.div style={{ height: '100%', borderRadius: 10,
                background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' }}
                animate={{ width: `${xp}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 12 }}>
            {[
              { label: 'Age Group',   value: AGE_LABEL[ag] || ag, emoji: '🎂' },
              { label: 'Level',       value: `Level ${level}`,    emoji: '🎯' },
              { label: 'Total Stars', value: `⭐ ${stars}`,        emoji: '🌟' },
              { label: 'Class',       value: profile?.profile?.class_code || 'No class joined', emoji: '🏫' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(15,23,42,0.5)', borderRadius: 14,
                padding: '14px 16px', border: '1px solid #2D3A4F' }}>
                <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700,
                  marginBottom: 6, fontFamily: 'Nunito,sans-serif', letterSpacing: '0.5px' }}>
                  {item.emoji} {item.label.toUpperCase()}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#F1F5F9',
                  fontFamily: 'Nunito,sans-serif' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CHANGE PASSWORD ── */}
        <div style={{ background: '#1E293B', border: '1px solid #2D3A4F',
          borderRadius: 20, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: pwMode ? 20 : 0 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#F1F5F9',
              fontFamily: 'Nunito,sans-serif' }}>🔒 Change Password</div>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => { setPwMode(!pwMode); setMsg({ type: '', text: '' }); }}
              style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444',
                border: '1px solid rgba(239,68,68,0.3)', padding: '10px 20px',
                borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Nunito,sans-serif' }}>
              {pwMode ? 'Cancel' : '🔑 Change Password'}
            </motion.button>
          </div>
          <AnimatePresence>
            {pwMode && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                <DarkInp label="Current Password" type="password"
                  placeholder="Your current password"
                  value={pw.old_password}
                  onChange={e => setPw({ ...pw, old_password: e.target.value })} />
                <DarkInp label="New Password" type="password"
                  placeholder="At least 8 characters"
                  value={pw.new_password}
                  onChange={e => setPw({ ...pw, new_password: e.target.value })} />
                <DarkInp label="Confirm New Password" type="password"
                  placeholder="Repeat new password"
                  value={pw.confirm}
                  onChange={e => setPw({ ...pw, confirm: e.target.value })} />
                {pw.confirm && (
                  <div style={{ fontSize: 12, marginTop: -8, marginBottom: 14,
                    color: pw.new_password === pw.confirm ? '#10B981' : '#EF4444',
                    fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
                    {pw.new_password === pw.confirm ? '✅ Passwords match' : '❌ Do not match'}
                  </div>
                )}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handlePw}
                  style={{ background: 'linear-gradient(135deg,#EF4444,#F87171)', color: '#fff',
                    border: 'none', padding: '12px 28px', borderRadius: 12, fontSize: 14,
                    fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito,sans-serif',
                    boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
                  Update Password 🔒
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}