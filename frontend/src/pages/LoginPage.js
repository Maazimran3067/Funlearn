import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  {
    id: 'student',
    emoji: '🎒',
    label: 'Student',
    sublabel: 'Ready to learn!',
    color: '#7C3AED',
    grad: 'linear-gradient(135deg, #7C3AED, #A855F7)',
    light: '#EDE9FE',
    glow: 'rgba(124,58,237,0.4)',
    loginWith: 'username',
    placeholder: 'Your username',
    inputLabel: '🎮 Username',
    bg: 'linear-gradient(160deg, #F5F3FF 0%, #EDE9FE 50%, #DDD6FE 100%)',
    floats: ['⭐','🎮','📚','🏆','🎯','✏️','🌟','🎪'],
  },
  {
    id: 'teacher',
    emoji: '👩‍🏫',
    label: 'Teacher',
    sublabel: 'Inspire & guide',
    color: '#059669',
    grad: 'linear-gradient(135deg, #059669, #10B981)',
    light: '#D1FAE5',
    glow: 'rgba(5,150,105,0.4)',
    loginWith: 'email',
    placeholder: 'your@email.com',
    inputLabel: '📧 Email Address',
    bg: 'linear-gradient(160deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)',
    floats: ['📖','🍎','✏️','📐','🎓','📝','🌿','💡'],
  },
  {
    id: 'parent',
    emoji: '👨‍👩‍👧',
    label: 'Parent',
    sublabel: 'Track progress',
    color: '#EA580C',
    grad: 'linear-gradient(135deg, #EA580C, #F97316)',
    light: '#FFEDD5',
    glow: 'rgba(234,88,12,0.4)',
    loginWith: 'email',
    placeholder: 'your@email.com',
    inputLabel: '📧 Email Address',
    bg: 'linear-gradient(160deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)',
    floats: ['💝','🏠','👶','🌈','💫','🎀','🌸','💕'],
  },
  {
    id: 'admin',
    emoji: '🔧',
    label: 'Admin',
    sublabel: 'Full control',
    color: '#DC2626',
    grad: 'linear-gradient(135deg, #DC2626, #EF4444)',
    light: '#FEE2E2',
    glow: 'rgba(220,38,38,0.4)',
    loginWith: 'email',
    placeholder: 'admin@email.com',
    inputLabel: '📧 Email Address',
    bg: 'linear-gradient(160deg, #FFF1F2 0%, #FEE2E2 50%, #FECACA 100%)',
    floats: ['⚙️','🔒','🛡️','📊','🔑','💼','🖥️','📡'],
  },
];

const ROLE_PATHS = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  parent:  '/parent/dashboard',
  admin:   '/admin/dashboard',
};

// ── FLOATING ELEMENT ───────────────────────────────────────────
function FloatEl({ emoji, delay, duration, x, y, size }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        fontSize: size,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 0,
        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))',
      }}
      animate={{
        y: [0, -18, 0, 12, 0],
        x: [0, 6, 0, -6, 0],
        rotate: [0, 8, 0, -8, 0],
        opacity: [0.4, 0.8, 0.5, 0.9, 0.4],
        scale: [1, 1.1, 1, 0.95, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {emoji}
    </motion.div>
  );
}

// ── SPARKLE ───────────────────────────────────────────────────
function Sparkle({ x, y, delay, color }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
        pointerEvents: 'none',
        zIndex: 0,
      }}
      animate={{
        scale: [0, 1.5, 0],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 3 + 1,
        ease: 'easeInOut',
      }}
    />
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────
export default function LoginPage() {
  const { login }                   = useAuth();
  const navigate                    = useNavigate();
  const [roleIdx,    setRoleIdx]    = useState(0);
  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [flipping,   setFlipping]   = useState(false);
  const [prevIdx,    setPrevIdx]    = useState(0);

  const role = ROLES[roleIdx];

  // Generate stable float positions once
  const [floatPositions] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      x: 5 + (i * 8.2) % 90,
      y: 5 + (i * 13.7) % 88,
      delay: i * 0.4,
      duration: 4 + (i % 4),
      size: i % 3 === 0 ? '28px' : i % 3 === 1 ? '22px' : '18px',
    }))
  );

  const [sparkles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: i * 0.3,
    }))
  );

  const switchRole = (newIdx) => {
    if (newIdx === roleIdx || flipping) return;
    setFlipping(true);
    setPrevIdx(roleIdx);
    setTimeout(() => {
      setRoleIdx(newIdx);
      setIdentifier('');
      setError('');
    }, 220);
    setTimeout(() => setFlipping(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const userData = await login(
        role.loginWith === 'email' ? identifier.trim() : null,
        password,
        role.id,
        role.loginWith === 'username' ? identifier.trim() : null
      );
      navigate(ROLE_PATHS[userData.role] || '/student/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error;
      if (msg) setError(msg);
      else if (err.response?.status === 403) setError('Your account has been deactivated. Contact admin.');
      else if (!err.response) setError('Cannot reach server. Make sure backend is running.');
      else setError('Wrong credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: role.bg,
        transition: 'background 0.7s ease',
      }}
    >
      {/* ── ANIMATED BACKGROUND BLOBS ── */}
      <motion.div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          style={{
            position: 'absolute',
            width: 500, height: 500,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${role.glow} 0%, transparent 70%)`,
            top: -100, left: -100,
          }}
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          key={`blob1-${role.id}`}
        />
        <motion.div
          style={{
            position: 'absolute',
            width: 400, height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${role.glow} 0%, transparent 70%)`,
            bottom: -80, right: -80,
          }}
          animate={{ scale: [1, 1.2, 1], x: [0, -25, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          key={`blob2-${role.id}`}
        />
        <motion.div
          style={{
            position: 'absolute',
            width: 250, height: 250,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${role.glow} 0%, transparent 70%)`,
            top: '40%', right: '15%',
          }}
          animate={{ scale: [1, 1.3, 1], y: [0, -30, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          key={`blob3-${role.id}`}
        />
      </motion.div>

      {/* ── FLOATING EMOJIS ── */}
      {floatPositions.map((fp, i) => (
        <FloatEl
          key={`${role.id}-float-${i}`}
          emoji={role.floats[i % role.floats.length]}
          delay={fp.delay}
          duration={fp.duration}
          x={fp.x}
          y={fp.y}
          size={fp.size}
        />
      ))}

      {/* ── SPARKLES ── */}
      {sparkles.map((s, i) => (
        <Sparkle key={`spark-${i}`} x={s.x} y={s.y} delay={s.delay} color={role.color} />
      ))}

      {/* ── MAIN CARD ── */}
      <motion.div
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 460 }}
        animate={{ rotateY: flipping ? 90 : 0, scale: flipping ? 0.9 : 1 }}
        transition={{ duration: 0.22, ease: 'easeIn' }}
      >
        <motion.div
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(20px)',
            borderRadius: 32,
            padding: '36px 32px 32px',
            boxShadow: `0 8px 40px ${role.glow}, 0 2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)`,
            border: `2px solid rgba(255,255,255,0.8)`,
            transition: 'box-shadow 0.5s ease',
          }}
          layout
        >
          {/* ── LOGO / BRAND ── */}
          <motion.div
            style={{ textAlign: 'center', marginBottom: 24 }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              style={{ fontSize: 56, lineHeight: 1, marginBottom: 8 }}
              animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              🎓
            </motion.div>
            <motion.h1
              style={{
                fontSize: 28, fontWeight: 900, margin: '4px 0 2px',
                fontFamily: 'Nunito, sans-serif',
                background: role.grad,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              key={role.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              FunLearn AI
            </motion.h1>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
              Sign in to continue your journey ✨
            </p>
          </motion.div>

          {/* ── ROLE SELECTOR ── */}
          <div
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
              gap: 8, marginBottom: 20,
              padding: 6, background: 'rgba(0,0,0,0.04)',
              borderRadius: 18,
            }}
          >
            {ROLES.map((r, i) => (
              <motion.button
                key={r.id}
                type="button"
                style={{
                  padding: '10px 4px', borderRadius: 14,
                  border: roleIdx === i ? `2px solid ${r.color}` : '2px solid transparent',
                  background: roleIdx === i ? r.light : 'transparent',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 3,
                  fontFamily: 'Nunito, sans-serif',
                  transition: 'background 0.2s, border 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => switchRole(i)}
              >
                {roleIdx === i && (
                  <motion.div
                    layoutId="roleActive"
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 12,
                      background: r.light, zIndex: 0,
                    }}
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                  />
                )}
                <span style={{ fontSize: 20, position: 'relative', zIndex: 1 }}>{r.emoji}</span>
                <span style={{
                  fontSize: 10, fontWeight: 800, position: 'relative', zIndex: 1,
                  color: roleIdx === i ? r.color : '#9CA3AF',
                  transition: 'color 0.2s',
                }}>
                  {r.label}
                </span>
              </motion.button>
            ))}
          </div>

          {/* ── ROLE BADGE ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={role.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: role.light,
                borderRadius: 14, padding: '10px 14px',
                marginBottom: 18,
                border: `1.5px solid ${role.color}30`,
              }}
              initial={{ opacity: 0, x: -16, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <span style={{ fontSize: 26 }}>{role.emoji}</span>
              <div>
                <div style={{
                  fontSize: 14, fontWeight: 800, color: role.color,
                  fontFamily: 'Nunito, sans-serif',
                }}>
                  {role.label} Login
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'Nunito, sans-serif' }}>
                  {role.sublabel}
                </div>
              </div>
              <motion.div
                style={{
                  marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                  background: role.color,
                }}
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
          </AnimatePresence>

          {/* ── ERROR ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                style={{
                  background: '#FEF2F2', color: '#DC2626', borderRadius: 12,
                  padding: '10px 14px', marginBottom: 14,
                  fontSize: 13, fontWeight: 600, fontFamily: 'Nunito, sans-serif',
                  border: '1.5px solid #FECACA',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FORM ── */}
          <form onSubmit={handleSubmit}>
            {/* Identifier input */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`input-${role.id}`}
                style={{ marginBottom: 14 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 800,
                  color: '#4B5563', marginBottom: 6,
                  fontFamily: 'Nunito, sans-serif', letterSpacing: '0.3px',
                }}>
                  {role.inputLabel}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={role.loginWith === 'email' ? 'email' : 'text'}
                    placeholder={role.placeholder}
                    value={identifier}
                    onChange={e => { setIdentifier(e.target.value); setError(''); }}
                    required
                    style={{
                      width: '100%', padding: '13px 16px',
                      borderRadius: 14, fontSize: 14,
                      border: `2px solid ${identifier ? role.color + '60' : '#E5E7EB'}`,
                      outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'Nunito, sans-serif',
                      background: identifier ? role.light + '60' : '#FAFAFA',
                      transition: 'border 0.2s, background 0.2s',
                      color: '#1F2937',
                    }}
                    onFocus={e => { e.target.style.border = `2px solid ${role.color}`; e.target.style.boxShadow = `0 0 0 4px ${role.glow}30`; }}
                    onBlur={e => { e.target.style.border = `2px solid ${identifier ? role.color + '60' : '#E5E7EB'}`; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Password input */}
            <div style={{ marginBottom: 22 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 800,
                color: '#4B5563', marginBottom: 6,
                fontFamily: 'Nunito, sans-serif', letterSpacing: '0.3px',
              }}>
                🔒 Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  required
                  style={{
                    width: '100%', padding: '13px 46px 13px 16px',
                    borderRadius: 14, fontSize: 14,
                    border: `2px solid ${password ? role.color + '60' : '#E5E7EB'}`,
                    outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'Nunito, sans-serif',
                    background: password ? role.light + '60' : '#FAFAFA',
                    transition: 'border 0.2s, background 0.2s',
                    color: '#1F2937',
                  }}
                  onFocus={e => { e.target.style.border = `2px solid ${role.color}`; e.target.style.boxShadow = `0 0 0 4px ${role.glow}30`; }}
                  onBlur={e => { e.target.style.border = `2px solid ${password ? role.color + '60' : '#E5E7EB'}`; e.target.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 16, padding: 0, color: '#9CA3AF',
                  }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              style={{
                width: '100%', padding: '15px',
                borderRadius: 16, border: 'none',
                background: loading
                  ? '#E5E7EB'
                  : role.grad,
                color: loading ? '#9CA3AF' : '#fff',
                fontSize: 15, fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Nunito, sans-serif',
                letterSpacing: '0.3px',
                boxShadow: loading ? 'none' : `0 6px 20px ${role.glow}`,
                position: 'relative',
                overflow: 'hidden',
              }}
              whileHover={!loading ? { scale: 1.02, y: -2, boxShadow: `0 10px 30px ${role.glow}` } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              disabled={loading}
            >
              {/* Shimmer effect on hover */}
              {!loading && (
                <motion.div
                  style={{
                    position: 'absolute', top: 0, left: '-100%',
                    width: '60%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                    transform: 'skewX(-15deg)',
                  }}
                  animate={{ left: ['−100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                />
              )}
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block' }}
                  >
                    ⏳
                  </motion.span>
                  Signing in...
                </span>
              ) : (
                <span>Sign In as {role.label} {role.emoji}</span>
              )}
            </motion.button>
          </form>

          {/* ── FOOTER ── */}
          <p style={{
            textAlign: 'center', marginTop: 18, marginBottom: 0,
            fontSize: 13, color: '#9CA3AF', fontFamily: 'Nunito, sans-serif',
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: role.color, fontWeight: 800, textDecoration: 'none',
              fontFamily: 'Nunito, sans-serif',
            }}>
              Register here 🚀
            </Link>
          </p>
        </motion.div>
      </motion.div>

      {/* ── BOTTOM WAVE DECORATION ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 80, pointerEvents: 'none', zIndex: 1,
        background: `linear-gradient(to top, ${role.color}15, transparent)`,
        transition: 'background 0.7s ease',
      }} />
    </div>
  );
}