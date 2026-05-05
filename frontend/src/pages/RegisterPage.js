import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { registerUser, sendOTP, verifyOTP } from '../services/api';

const ROLES = [
  { id:'student', emoji:'🎒', label:'Student',  desc:'Play games & learn',  color:'#6366F1', glow:'rgba(99,102,241,0.2)',  border:'rgba(99,102,241,0.4)' },
  { id:'teacher', emoji:'👩‍🏫', label:'Teacher',  desc:'Manage classes',     color:'#F59E0B', glow:'rgba(245,158,11,0.2)',  border:'rgba(245,158,11,0.4)' },
  { id:'parent',  emoji:'👨‍👩‍👧', label:'Parent',   desc:'Track your child',   color:'#10B981', glow:'rgba(16,185,129,0.2)',  border:'rgba(16,185,129,0.4)' },
  { id:'admin',   emoji:'🛡️', label:'Admin',    desc:'System admin',       color:'#EF4444', glow:'rgba(239,68,68,0.2)',   border:'rgba(239,68,68,0.4)'  },
];

const AGE = [
  { id:'3-6',  emoji:'🐣', label:'3–6',  color:'#F59E0B' },
  { id:'6-9',  emoji:'🚀', label:'6–9',  color:'#6366F1' },
  { id:'9-12', emoji:'🧠', label:'9–12', color:'#10B981' },
];

const rgbOf = (c) =>
  c === '#6366F1' ? '99,102,241' :
  c === '#10B981' ? '16,185,129' :
  c === '#F59E0B' ? '245,158,11' : '239,68,68';

// ─────────────────────────────────────────────────────────────────
// ALL COMPONENTS ARE OUTSIDE RegisterPage ON PURPOSE.
// Defining components inside a parent causes them to be treated as
// brand-new component types on every render, which remounts inputs,
// loses focus, and triggers spurious form submissions on each keystroke.
// ─────────────────────────────────────────────────────────────────

function Inp({ label, type = 'text', placeholder, value, onChange, required, color, right }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{
          display: 'block', fontSize: 11, fontWeight: 700,
          color: '#94A3B8', marginBottom: 7,
          fontFamily: 'Nunito,sans-serif', letterSpacing: '0.8px'
        }}>
          {label}
        </label>
      )}
      <div style={{
        background: focused ? 'rgba(30,41,59,0.95)' : 'rgba(15,23,42,0.7)',
        border: `1px solid ${focused ? color : '#2D3A4F'}`,
        borderRadius: 12, padding: '12px 14px',
        boxShadow: focused ? `0 0 0 3px rgba(${rgbOf(color)},0.15)` : 'none',
        transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8
      }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            outline: 'none', color: '#F1F5F9', fontSize: 14,
            fontFamily: 'Nunito,sans-serif'
          }}
        />
        {right}
      </div>
    </div>
  );
}

function PwStr({ pw }) {
  if (!pw) return null;
  const s = [pw.length >= 8, /[0-9]/.test(pw), /[!@#$%^&*]/.test(pw)].filter(Boolean).length;
  const c = s === 3 ? '#10B981' : s === 2 ? '#F59E0B' : '#EF4444';
  const l = s === 3 ? 'Strong' : s === 2 ? 'Medium' : 'Weak';
  return (
    <div style={{ marginTop: 6, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 3,
            background: i <= s ? c : '#2D3A4F', transition: 'background 0.3s'
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: c, fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>
        {l}
      </span>
    </div>
  );
}

function Wrap({ children, role }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#0B1120',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(#4F6080 1px,transparent 1px),linear-gradient(90deg,#4F6080 1px,transparent 1px)',
        backgroundSize: '48px 48px', pointerEvents: 'none'
      }} />
      <motion.div
        key={role.id}
        style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle,rgba(${rgbOf(role.color)},0.1) 0%,transparent 70%)`,
          top: -200, right: -100, pointerEvents: 'none'
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 9, repeat: Infinity }}
      />
      <motion.div
        style={{
          width: '100%', maxWidth: 480,
          background: 'rgba(15,23,42,0.95)',
          border: '1px solid #1E2D45', borderRadius: 20, padding: '32px 28px',
          backdropFilter: 'blur(20px)',
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(${rgbOf(role.color)},0.08)`
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
            }}>🎓</div>
            <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Nunito,sans-serif' }}>
              <span style={{ color: '#6366F1' }}>Fun</span>
              <span style={{ color: '#F59E0B' }}>Learn</span>
              <span style={{ color: '#F1F5F9' }}>AI</span>
            </span>
          </div>
          <Link to="/login" style={{
            fontSize: 12, color: '#64748B',
            fontFamily: 'Nunito,sans-serif', textDecoration: 'none'
          }}>
            Sign in →
          </Link>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function Alerts({ err, ok }) {
  return (
    <AnimatePresence>
      {err && (
        <motion.div
          key="err"
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 12,
            color: '#FCA5A5', fontSize: 13, fontFamily: 'Nunito,sans-serif',
            display: 'flex', gap: 8, alignItems: 'center'
          }}>
          ⚠️ {err}
        </motion.div>
      )}
      {ok && (
        <motion.div
          key="ok"
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 12,
            color: '#6EE7B7', fontSize: 13, fontFamily: 'Nunito,sans-serif',
            display: 'flex', gap: 8, alignItems: 'center'
          }}>
          ✅ {ok}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Btn({ label, onClick, disabled, load, role }) {
  return (
    <motion.button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={disabled || load}
      style={{
        width: '100%', padding: '13px', borderRadius: 12, border: 'none', marginTop: 8,
        background: (disabled || load) ? '#1E293B' : `linear-gradient(135deg,${role.color},${role.color}BB)`,
        color: (disabled || load) ? '#64748B' : '#fff',
        fontSize: 14, fontWeight: 800,
        cursor: (disabled || load) ? 'not-allowed' : 'pointer',
        fontFamily: 'Nunito,sans-serif',
        boxShadow: (disabled || load) ? 'none' : `0 4px 20px ${role.glow}`,
        transition: 'all 0.2s'
      }}
      whileHover={!disabled && !load ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !load ? { scale: 0.98 } : {}}
    >
      {load ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <motion.span animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block' }}>⏳</motion.span>
          Please wait...
        </span>
      ) : label}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step,  setStep]  = useState(1);
  const [ri,    setRi]    = useState(0);
  const [load,  setLoad]  = useState(false);
  const [err,   setErr]   = useState('');
  const [ok,    setOk]    = useState('');
  const [email, setEmail] = useState('');
  const [otp,   setOtp]   = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [form,  setForm]  = useState({
    username: '', password: '', confirm_password: '',
    first_name: '', last_name: '', age_group: '',
    class_code: '', school_name: '', child_username: '', admin_secret_key: ''
  });

  const role    = ROLES[ri];
  const needOTP = ['teacher', 'parent', 'admin'].includes(role.id);
  const setF    = (key) => (e) => { setForm(prev => ({ ...prev, [key]: e.target.value })); setErr(''); };

  const switchRole = (i) => {
    setRi(i); setStep(1); setErr(''); setOk(''); setEmail(''); setOtp('');
  };

  const sendCode = async () => {
    if (!email.trim()) { setErr('Enter your email.'); return; }
    setLoad(true); setErr(''); setOk('');
    try {
      await sendOTP({ email: email.trim().toLowerCase(), role: role.id });
      setOk(`Code sent to ${email}! Check inbox & spam.`);
      setStep(3);
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not send OTP. Try again.');
    } finally { setLoad(false); }
  };

  const verifyCode = async () => {
    if (otp.length !== 6) { setErr('Enter the full 6-digit code.'); return; }
    setLoad(true); setErr('');
    try {
      await verifyOTP({ email: email.trim().toLowerCase(), role: role.id, otp_code: otp });
      setStep(4); setOk(''); setErr('');
    } catch (e) {
      setErr(e.response?.data?.error || 'Wrong code. Try again.');
    } finally { setLoad(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      setErr('Passwords do not match.'); return;
    }
    setLoad(true); setErr('');
    const data = { role: role.id, ...form };
    if (needOTP) { data.email = email.trim().toLowerCase(); data.otp_code = otp; }
    try {
      const res = await registerUser(data);
      if (role.id === 'teacher' && res.data.class_code)
        setOk(`Account created! Class code: ${res.data.class_code} — save it! 📝`);
      else
        setOk('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (e) {
      const errs = e.response?.data;
      if (errs && typeof errs === 'object') {
        const k = Object.keys(errs)[0];
        setErr(String(Array.isArray(errs[k]) ? errs[k][0] : errs[k]) || 'Something went wrong.');
      } else { setErr('Server not responding. Check your connection.'); }
    } finally { setLoad(false); }
  };

  // ── STEP 1: CHOOSE ROLE ──────────────────────────────────────
  if (step === 1) return (
    <Wrap role={role}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9', fontFamily: 'Nunito,sans-serif', margin: '0 0 6px' }}>
        Create Account
      </h2>
      <p style={{ color: '#94A3B8', fontSize: 13, fontFamily: 'Nunito,sans-serif', marginBottom: 22 }}>
        Select your role to get started
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {ROLES.map((r, i) => (
          <motion.div key={r.id}
            style={{
              borderRadius: 14, padding: '16px 12px', cursor: 'pointer',
              position: 'relative', overflow: 'hidden',
              background: ri === i ? `rgba(${rgbOf(r.color)},0.12)` : 'rgba(30,41,59,0.5)',
              border: `1px solid ${ri === i ? r.border : '#2D3A4F'}`
            }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.15 }}
            onClick={() => switchRole(i)}
          >
            <div style={{ fontSize: 30, marginBottom: 6 }}>{r.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: 'Nunito,sans-serif', color: ri === i ? r.color : '#F1F5F9' }}>
              {r.label}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginTop: 2 }}>
              {r.desc}
            </div>
          </motion.div>
        ))}
      </div>
      <Alerts err={err} ok={ok} />
      <Btn
        label={`Continue as ${role.label} ${role.emoji}`}
        onClick={() => { setStep(role.id === 'student' ? 4 : 2); setErr(''); }}
        load={load}
        role={role}
      />
    </Wrap>
  );

  // ── STEP 2: ENTER EMAIL ──────────────────────────────────────
  if (step === 2) return (
    <Wrap role={role}>
      <motion.button onClick={() => setStep(1)} whileHover={{ x: -2 }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, fontFamily: 'Nunito,sans-serif', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 18, padding: 0 }}>
        ← Back
      </motion.button>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22,
        background: `rgba(${rgbOf(role.color)},0.08)`,
        border: `1px solid rgba(${rgbOf(role.color)},0.2)`,
        borderRadius: 12, padding: '12px 14px'
      }}>
        <span style={{ fontSize: 24 }}>{role.emoji}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: role.color, fontFamily: 'Nunito,sans-serif' }}>
            {role.label} Registration
          </div>
          <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
            Step 1 of 3 — Verify your email
          </div>
        </div>
      </div>
      <Alerts err={err} ok={ok} />
      <Inp label="📧 YOUR EMAIL ADDRESS" type="email" placeholder="your@email.com"
        value={email} onChange={e => { setEmail(e.target.value); setErr(''); }}
        required color={role.color} />
      <p style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginBottom: 4 }}>
        We'll send a 6-digit verification code to this email.
      </p>
      <Btn label="📧 Send Verification Code" onClick={sendCode} load={load} role={role} />
    </Wrap>
  );

  // ── STEP 3: ENTER OTP ────────────────────────────────────────
  if (step === 3) return (
    <Wrap role={role}>
      <motion.button onClick={() => { setStep(2); setOtp(''); setOk(''); setErr(''); }} whileHover={{ x: -2 }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, fontFamily: 'Nunito,sans-serif', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 18, padding: 0 }}>
        ← Back
      </motion.button>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <motion.div style={{ fontSize: 48 }} animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          📬
        </motion.div>
        <div style={{ fontSize: 18, fontWeight: 900, color: role.color, fontFamily: 'Nunito,sans-serif', marginTop: 8 }}>
          Check Your Email!
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Nunito,sans-serif', marginTop: 4 }}>
          Code sent to <strong style={{ color: '#F1F5F9' }}>{email}</strong>
        </div>
      </div>
      <Alerts err={err} ok={ok} />
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 8, fontFamily: 'Nunito,sans-serif', letterSpacing: '0.8px' }}>
          🔢 ENTER 6-DIGIT CODE
        </label>
        <input
          type="text"
          maxLength={6}
          placeholder="0  0  0  0  0  0"
          value={otp}
          onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setErr(''); }}
          style={{
            width: '100%', padding: '16px', borderRadius: 12, fontSize: 26,
            fontWeight: 900, textAlign: 'center', letterSpacing: 10, boxSizing: 'border-box',
            background: 'rgba(15,23,42,0.7)', color: '#F1F5F9', fontFamily: 'Nunito,sans-serif',
            border: `1px solid ${otp.length === 6 ? role.color : '#2D3A4F'}`,
            boxShadow: otp.length === 6 ? `0 0 0 3px rgba(${rgbOf(role.color)},0.15)` : 'none',
            outline: 'none', transition: 'all 0.2s'
          }}
        />
      </div>
      <Btn label="✅ Verify Code" onClick={verifyCode} disabled={otp.length !== 6} load={load} role={role} />
      <motion.button type="button" whileHover={{ scale: 1.01 }}
        onClick={() => { setStep(2); setOtp(''); setOk(''); setErr(''); }}
        style={{
          width: '100%', padding: '12px', borderRadius: 12, marginTop: 10,
          border: `1px solid rgba(${rgbOf(role.color)},0.3)`,
          background: 'transparent', color: role.color, fontSize: 13,
          fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito,sans-serif'
        }}>
        Resend Code 🔄
      </motion.button>
    </Wrap>
  );

  // ── STEP 4: FULL FORM ────────────────────────────────────────
  return (
    <Wrap role={role}>
      <motion.button onClick={() => { setStep(needOTP ? 3 : 1); setErr(''); }} whileHover={{ x: -2 }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 12, fontFamily: 'Nunito,sans-serif', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, padding: 0 }}>
        ← Back
      </motion.button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
        {(needOTP ? [1, 2, 3] : [1, 2]).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: role.color }} />
        ))}
        <span style={{ fontSize: 11, color: role.color, fontWeight: 700, fontFamily: 'Nunito,sans-serif', whiteSpace: 'nowrap' }}>
          {needOTP ? 'Step 3 of 3' : 'Step 2 of 2'}
        </span>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18,
        background: `rgba(${rgbOf(role.color)},0.08)`,
        border: `1px solid rgba(${rgbOf(role.color)},0.2)`,
        borderRadius: 12, padding: '10px 14px'
      }}>
        <span style={{ fontSize: 22 }}>{role.emoji}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: role.color, fontFamily: 'Nunito,sans-serif' }}>
            {role.label} — Complete Registration
          </div>
          {needOTP && (
            <div style={{ fontSize: 11, color: '#10B981', fontFamily: 'Nunito,sans-serif' }}>
              ✅ Email verified: {email}
            </div>
          )}
        </div>
      </div>

      <Alerts err={err} ok={ok} />

      <form onSubmit={submit}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Inp label="FIRST NAME *" placeholder="Ali"
              value={form.first_name} onChange={setF('first_name')}
              required color={role.color} />
          </div>
          <div style={{ flex: 1 }}>
            <Inp label="LAST NAME *" placeholder="Khan"
              value={form.last_name} onChange={setF('last_name')}
              required color={role.color} />
          </div>
        </div>

        <Inp
          label={`🎮 USERNAME *${role.id === 'student' ? ' (used to log in)' : ''}`}
          placeholder="letters, numbers, underscore"
          value={form.username} onChange={setF('username')}
          required color={role.color}
        />

        {needOTP && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 7, fontFamily: 'Nunito,sans-serif', letterSpacing: '0.8px' }}>
              📧 EMAIL
            </label>
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, padding: '12px 14px', color: '#6EE7B7', fontSize: 14, fontFamily: 'Nunito,sans-serif', fontWeight: 600 }}>
              ✅ {email}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 6 }}>
          <Inp label="🔒 PASSWORD *" type={showPw ? 'text' : 'password'}
            placeholder="8+ chars, number & special char"
            value={form.password} onChange={setF('password')}
            required color={role.color}
            right={
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 15, padding: 0, lineHeight: 1 }}>
                {showPw ? '🙈' : '👁️'}
              </button>
            }
          />
          <PwStr pw={form.password} />
        </div>

        <div style={{ marginBottom: 4 }}>
          <Inp label="🔒 CONFIRM PASSWORD *" type={showConf ? 'text' : 'password'}
            placeholder="Repeat your password"
            value={form.confirm_password} onChange={setF('confirm_password')}
            required color={role.color}
            right={
              <button type="button" onClick={() => setShowConf(!showConf)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 15, padding: 0, lineHeight: 1 }}>
                {showConf ? '🙈' : '👁️'}
              </button>
            }
          />
          {form.confirm_password && (
            <div style={{ fontSize: 11, marginBottom: 10, marginTop: -6, fontFamily: 'Nunito,sans-serif', fontWeight: 700, color: form.password === form.confirm_password ? '#10B981' : '#EF4444' }}>
              {form.password === form.confirm_password ? '✅ Passwords match' : '❌ Do not match'}
            </div>
          )}
        </div>

        {role.id === 'student' && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 8, fontFamily: 'Nunito,sans-serif', letterSpacing: '0.8px' }}>
                🎂 AGE GROUP *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {AGE.map(a => (
                  <motion.div key={a.id}
                    style={{
                      flex: 1, borderRadius: 12, padding: '10px 6px', textAlign: 'center', cursor: 'pointer',
                      background: form.age_group === a.id ? `rgba(${rgbOf(a.color)},0.15)` : 'rgba(30,41,59,0.5)',
                      border: `1px solid ${form.age_group === a.id ? a.color : '#2D3A4F'}`,
                      transition: 'all 0.15s'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setForm(prev => ({ ...prev, age_group: a.id }))}
                  >
                    <div style={{ fontSize: 20 }}>{a.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, marginTop: 4, fontFamily: 'Nunito,sans-serif', color: form.age_group === a.id ? a.color : '#94A3B8' }}>
                      {a.label}
                    </div>
                  </motion.div>
                ))}
              </div>
              {!form.age_group && (
                <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4, fontFamily: 'Nunito,sans-serif' }}>
                  Please select an age group
                </div>
              )}
            </div>
            <Inp label="🏫 CLASS CODE (optional)" placeholder="Ask your teacher"
              value={form.class_code} onChange={setF('class_code')} color={role.color} />
          </>
        )}

        {role.id === 'teacher' && (
          <Inp label="🏛️ SCHOOL NAME *" placeholder="e.g. City School Lahore"
            value={form.school_name} onChange={setF('school_name')}
            required color={role.color} />
        )}

        {role.id === 'parent' && (
          <>
            <Inp label="👧 CHILD'S USERNAME *" placeholder="Your child's exact username"
              value={form.child_username} onChange={setF('child_username')}
              required color={role.color} />
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'Nunito,sans-serif', marginTop: -10, marginBottom: 14 }}>
              Child must have registered as a student first.
            </div>
          </>
        )}

        {role.id === 'admin' && (
          <>
            <Inp label="🔑 ADMIN SECRET KEY *" type="password"
              placeholder="Contact system administrator"
              value={form.admin_secret_key} onChange={setF('admin_secret_key')}
              required color={role.color} />
            <div style={{ fontSize: 11, color: '#EF4444', fontFamily: 'Nunito,sans-serif', marginTop: -10, marginBottom: 14 }}>
              Only authorised administrators have this key.
            </div>
          </>
        )}

        <Btn
          label={`Create ${role.label} Account 🎉`}
          disabled={role.id === 'student' && !form.age_group}
          load={load}
          role={role}
        />
      </form>

      <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#64748B', fontFamily: 'Nunito,sans-serif' }}>
        Have an account?{' '}
        <Link to="/login" style={{ color: role.color, fontWeight: 700, textDecoration: 'none' }}>
          Sign in →
        </Link>
      </p>
    </Wrap>
  );
}