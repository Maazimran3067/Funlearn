import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { registerUser, sendOTP, verifyOTP } from '../services/api';

const ROLES = [
  { id:'student', emoji:'🎒', label:'Student',  desc:'I want to learn and play!',    color:'#7C3AED', light:'#EDE9FE' },
  { id:'teacher', emoji:'👩‍🏫', label:'Teacher',  desc:'I teach a class',              color:'#10B981', light:'#D1FAE5' },
  { id:'parent',  emoji:'👨‍👩‍👧', label:'Parent',   desc:"I track my child's progress", color:'#F97316', light:'#FFEDD5' },
  { id:'admin',   emoji:'🔧', label:'Admin',    desc:'I manage the platform',        color:'#EF4444', light:'#FEE2E2' },
];

const AGE_GROUPS = [
  { id:'3-6',  emoji:'🐣', label:'Age 3–6',  color:'#F97316', light:'#FFEDD5' },
  { id:'6-9',  emoji:'🚀', label:'Age 6–9',  color:'#7C3AED', light:'#EDE9FE' },
  { id:'9-12', emoji:'🧠', label:'Age 9–12', color:'#10B981', light:'#D1FAE5' },
];

// Shows password strength bar
function PasswordStrength({ password }) {
  if (!password) return null;
  const hasLength  = password.length >= 8;
  const hasNumber  = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_=+]/.test(password);
  const score      = [hasLength, hasNumber, hasSpecial].filter(Boolean).length;
  const color      = score === 3 ? '#10B981' : score === 2 ? '#F59E0B' : '#EF4444';
  const label      = score === 3 ? '✅ Strong' : score === 2 ? '⚠️ Medium' : '❌ Weak';
  return (
    <div style={{ marginTop:6 }}>
      <div style={{ display:'flex', gap:4, marginBottom:3 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ flex:1, height:4, borderRadius:4, background: i <= score ? color : '#E5E7EB' }} />
        ))}
      </div>
      <div style={{ fontSize:12, color, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:11, color:'#9CA3AF' }}>
        {!hasLength  && '• At least 8 characters  '}
        {!hasNumber  && '• At least one number  '}
        {!hasSpecial && '• At least one special character (!@#$...)'}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();

  // Steps:
  // 1 = pick role
  // 2 = enter email (teacher/parent/admin only)
  // 3 = enter OTP code (teacher/parent/admin only)
  // 4 = fill full form (all roles)
  const [step,    setStep]    = useState(1);
  const [role,    setRole]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode,  setOtpCode]  = useState('');

  const [form, setForm] = useState({
    username:         '',
    password:         '',
    confirm_password: '',
    first_name:       '',
    last_name:        '',
    age_group:        '',
    class_code:       '',
    school_name:      '',
    child_username:   '',
    admin_secret_key: '',
  });

  const currentRole = ROLES.find(r => r.id === role);
  const needsOTP    = ['teacher', 'parent', 'admin'].includes(role);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setError('');
  };

  // ── SEND OTP ─────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!otpEmail.trim()) { setError('Please enter your email.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await sendOTP({ email: otpEmail.trim().toLowerCase(), role });
      setSuccess(`Code sent to ${otpEmail}. Check your inbox and spam folder.`);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  // ── VERIFY OTP ───────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) { setError('Please enter the full 6-digit code.'); return; }
    setLoading(true); setError('');
    try {
      await verifyOTP({ email: otpEmail.trim().toLowerCase(), role, otp_code: otpCode.trim() });
      setStep(4);
      setSuccess('');
    } catch (err) {
      setError(err.response?.data?.error || 'Wrong code. Please try again.');
    } finally { setLoading(false); }
  };

  // ── SUBMIT REGISTRATION ──────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.'); setLoading(false); return;
    }

    const data = { role, ...form };
    if (needsOTP) {
      data.email    = otpEmail.trim().toLowerCase();
      data.otp_code = otpCode.trim();
    }

    try {
      const res = await registerUser(data);
      if (role === 'teacher' && res.data.class_code) {
        setSuccess(`Account created! Your class code is: ${res.data.class_code} — Write this down! 📝`);
      } else {
        setSuccess('Account created! Redirecting to login...');
      }
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const firstMsg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
        setError(String(firstMsg) || 'Something went wrong.');
      } else {
        setError('Cannot reach server. Make sure backend is running.');
      }
    } finally { setLoading(false); }
  };

  // ── STEP 1: Choose Role ───────────────────────────────────────
  if (step === 1) {
    return (
      <div style={S.page}>
        <motion.div style={S.card} initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:52 }}>🎓</div>
            <h1 style={{ fontSize:22, fontWeight:900, color:'#7C3AED', margin:'8px 0 4px', fontFamily:'Nunito,sans-serif' }}>Join FunLearn AI</h1>
            <p style={{ fontSize:14, color:'#6B7280' }}>Who are you? Pick your role!</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
            {ROLES.map(r => (
              <motion.div key={r.id}
                style={{ ...S.roleCard, border: role===r.id?`3px solid ${r.color}`:'3px solid transparent', background: role===r.id?r.light:'#F9FAFB' }}
                whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                onClick={() => { setRole(r.id); setError(''); }}>
                <div style={{ fontSize:34 }}>{r.emoji}</div>
                <div style={{ fontSize:14, fontWeight:800, color: role===r.id?r.color:'#1F1F2E', marginTop:6 }}>{r.label}</div>
                <div style={{ fontSize:11, color:'#6B7280', marginTop:3, textAlign:'center' }}>{r.desc}</div>
              </motion.div>
            ))}
          </div>

          {error && <div style={S.errorBox}>❌ {error}</div>}

          <motion.button style={{ ...S.btn, opacity: role?1:0.4 }}
            whileHover={role?{scale:1.03}:{}}
            onClick={() => {
              if (!role) { setError('Please select a role first.'); return; }
              setStep(role === 'student' ? 4 : 2);
            }}>
            Next →
          </motion.button>
          <p style={S.switchText}>Already have an account? <Link to="/login" style={S.link}>Log in 🚀</Link></p>
        </motion.div>
      </div>
    );
  }

  // ── STEP 2: Enter Email ───────────────────────────────────────
  if (step === 2) {
    return (
      <div style={S.page}>
        <motion.div style={S.card} initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }}>
          <button style={S.backBtn} onClick={() => { setStep(1); setError(''); }}>← Back</button>
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{ fontSize:40 }}>{currentRole?.emoji}</div>
            <h2 style={{ fontSize:18, fontWeight:900, color:currentRole?.color, margin:'6px 0 4px', fontFamily:'Nunito,sans-serif' }}>
              {currentRole?.label} Registration
            </h2>
            <p style={{ fontSize:13, color:'#6B7280' }}>Step 1 of 3 — Verify your email first</p>
          </div>

          {error   && <div style={S.errorBox}>❌ {error}</div>}
          {success && <div style={S.successBox}>✅ {success}</div>}

          <label style={S.label}>📧 Your Email Address *</label>
          <input style={S.input} type="email" placeholder="your@email.com" value={otpEmail}
            onChange={e => { setOtpEmail(e.target.value); setError(''); }} />

          <motion.button
            style={{ ...S.btn, background:`linear-gradient(135deg,${currentRole?.color},#EC4899)`, marginTop:14 }}
            whileHover={{ scale:1.03 }} onClick={handleSendOTP} disabled={loading}>
            {loading ? '⏳ Sending...' : '📧 Send Verification Code'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── STEP 3: Enter OTP ─────────────────────────────────────────
  if (step === 3) {
    return (
      <div style={S.page}>
        <motion.div style={S.card} initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }}>
          <button style={S.backBtn} onClick={() => { setStep(2); setError(''); setOtpCode(''); }}>← Back</button>
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{ fontSize:40 }}>📬</div>
            <h2 style={{ fontSize:18, fontWeight:900, color:currentRole?.color, margin:'6px 0 4px', fontFamily:'Nunito,sans-serif' }}>
              Check Your Email
            </h2>
            <p style={{ fontSize:13, color:'#6B7280' }}>Step 2 of 3 — Enter the 6-digit code</p>
          </div>

          <div style={{ background:'#D1FAE5', borderRadius:12, padding:'12px', fontSize:13, color:'#065F46', fontWeight:600, marginBottom:16 }}>
            ✅ Code sent to <strong>{otpEmail}</strong>
          </div>

          {success && <div style={S.successBox}>✅ {success}</div>}
          {error   && <div style={S.errorBox}>❌ {error}</div>}

          <label style={S.label}>🔢 6-Digit Code *</label>
          <input
            style={{ ...S.input, fontSize:26, textAlign:'center', letterSpacing:10, fontWeight:900 }}
            type="text" maxLength={6} placeholder="000000"
            value={otpCode}
            onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setError(''); }} />

          <motion.button
            style={{ ...S.btn, background:`linear-gradient(135deg,${currentRole?.color},#EC4899)`, marginTop:14, opacity: otpCode.length===6?1:0.5 }}
            whileHover={{ scale:1.03 }} onClick={handleVerifyOTP}
            disabled={loading || otpCode.length !== 6}>
            {loading ? '⏳ Verifying...' : '✅ Verify Code'}
          </motion.button>

          <motion.button
            style={{ ...S.btn, background:'#F3F4F6', color:'#4B5563', marginTop:10 }}
            whileHover={{ scale:1.03 }}
            onClick={() => { setStep(2); setOtpCode(''); setError(''); setSuccess(''); }}>
            Resend Code
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── STEP 4: Full Form ─────────────────────────────────────────
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }}>
        <button style={S.backBtn} onClick={() => { setStep(needsOTP?3:1); setError(''); }}>← Back</button>

        <div style={{ textAlign:'center', marginBottom:16 }}>
          <span style={{ fontSize:30 }}>{currentRole?.emoji}</span>
          <div style={{ fontSize:15, fontWeight:900, color:currentRole?.color, marginTop:4, fontFamily:'Nunito,sans-serif' }}>
            {currentRole?.label} — Complete Registration
          </div>
          {needsOTP && <div style={{ fontSize:12, color:'#10B981', fontWeight:600, marginTop:4 }}>✅ Email verified: {otpEmail}</div>}
          <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>
            {needsOTP ? 'Step 3 of 3' : 'Step 2 of 2'} — Fill your details
          </div>
        </div>

        {success && <div style={S.successBox}>✅ {success}</div>}
        {error   && <div style={S.errorBox}>❌ {error}</div>}

        <form onSubmit={handleSubmit}>

          {/* First + Last Name */}
          <div style={{ display:'flex', gap:10, marginBottom:10 }}>
            <div style={{ flex:1 }}>
              <label style={S.label}>First Name *</label>
              <input style={S.input} placeholder="Ali"  value={form.first_name} onChange={set('first_name')} required />
            </div>
            <div style={{ flex:1 }}>
              <label style={S.label}>Last Name *</label>
              <input style={S.input} placeholder="Khan" value={form.last_name}  onChange={set('last_name')}  required />
            </div>
          </div>

          {/* Username */}
          <div style={{ marginBottom:10 }}>
            <label style={S.label}>
              🎮 Username * {role==='student' && '— you will use this to log in'}
            </label>
            <input style={S.input} placeholder="letters, numbers, underscore only"
              value={form.username} onChange={set('username')} required />
          </div>

          {/* Verified email — shown read only for non-students */}
          {needsOTP && (
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>📧 Email</label>
              <input style={{ ...S.input, background:'#F0FDF4', color:'#065F46', fontWeight:700 }}
                value={otpEmail} readOnly />
              <div style={{ fontSize:11, color:'#10B981', marginTop:2 }}>✅ Verified</div>
            </div>
          )}

          {/* Password */}
          <div style={{ marginBottom:10 }}>
            <label style={S.label}>🔒 Password *</label>
            <input style={S.input} type="password" placeholder="Min 8 chars + number + special character"
              value={form.password} onChange={set('password')} required />
            <PasswordStrength password={form.password} />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom:10 }}>
            <label style={S.label}>🔒 Confirm Password *</label>
            <input
              style={{ ...S.input, borderColor: form.confirm_password ? (form.password===form.confirm_password?'#10B981':'#EF4444') : '#EDE9FE' }}
              type="password" placeholder="Repeat your password"
              value={form.confirm_password} onChange={set('confirm_password')} required />
            {form.confirm_password && form.password !== form.confirm_password &&
              <div style={{ fontSize:12, color:'#EF4444', marginTop:3 }}>❌ Passwords do not match</div>}
            {form.confirm_password && form.password === form.confirm_password &&
              <div style={{ fontSize:12, color:'#10B981', marginTop:3 }}>✅ Passwords match</div>}
          </div>

          {/* Student specific */}
          {role === 'student' && (
            <>
              <div style={{ marginBottom:10 }}>
                <label style={S.label}>🎂 Age Group *</label>
                <div style={{ display:'flex', gap:8 }}>
                  {AGE_GROUPS.map(ag => (
                    <motion.div key={ag.id}
                      style={{ flex:1, borderRadius:12, padding:'10px 4px', textAlign:'center', cursor:'pointer',
                        border:     form.age_group===ag.id?`3px solid ${ag.color}`:'3px solid #E5E7EB',
                        background: form.age_group===ag.id?ag.light:'#fff' }}
                      whileHover={{ scale:1.04 }}
                      onClick={() => setForm(f => ({ ...f, age_group: ag.id }))}>
                      <div style={{ fontSize:20 }}>{ag.emoji}</div>
                      <div style={{ fontSize:12, fontWeight:800, color: form.age_group===ag.id?ag.color:'#1F1F2E' }}>{ag.id}</div>
                    </motion.div>
                  ))}
                </div>
                {!form.age_group && <div style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>Please select an age group</div>}
              </div>
              <div style={{ marginBottom:10 }}>
                <label style={S.label}>🏫 Class Code (optional)</label>
                <input style={S.input} placeholder="Ask your teacher for the class code"
                  value={form.class_code} onChange={set('class_code')} />
              </div>
            </>
          )}

          {/* Teacher specific */}
          {role === 'teacher' && (
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>🏛️ School Name *</label>
              <input style={S.input} placeholder="e.g. City School Lahore"
                value={form.school_name} onChange={set('school_name')} required />
            </div>
          )}

          {/* Parent specific */}
          {role === 'parent' && (
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>👧 Child's Username *</label>
              <input style={S.input} placeholder="Your child's exact username"
                value={form.child_username} onChange={set('child_username')} required />
              <div style={{ fontSize:11, color:'#6B7280', marginTop:3 }}>
                Your child must have registered as a student first.
              </div>
            </div>
          )}

          {/* Admin specific */}
          {role === 'admin' && (
            <div style={{ marginBottom:10 }}>
              <label style={S.label}>🔑 Admin Secret Key *</label>
              <input style={S.input} type="password" placeholder="Contact admin for this key"
                value={form.admin_secret_key} onChange={set('admin_secret_key')} required />
            </div>
          )}

          <motion.button type="submit"
            style={{ ...S.btn, background:`linear-gradient(135deg,${currentRole?.color},#EC4899)`, marginTop:14, opacity:loading?0.7:1 }}
            whileHover={!loading?{scale:1.03}:{}}
            disabled={loading || (role==='student' && !form.age_group)}>
            {loading ? '✨ Creating account...' : `Create ${currentRole?.label} Account 🎉`}
          </motion.button>
        </form>

        <p style={S.switchText}>Already have an account? <Link to="/login" style={S.link}>Log in 🚀</Link></p>
      </motion.div>
    </div>
  );
}

const S = {
  page:       { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#F9F5FF,#FDF2F8,#F0FDF4)', padding:20 },
  card:       { background:'#fff', borderRadius:28, padding:'32px 28px', width:'100%', maxWidth:500, boxShadow:'0 20px 60px rgba(124,58,237,0.12)' },
  roleCard:   { borderRadius:16, padding:'14px 8px', display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer', transition:'all 0.2s' },
  backBtn:    { background:'#F3F4F6', border:'none', padding:'7px 14px', borderRadius:10, fontSize:13, fontWeight:700, color:'#4B5563', cursor:'pointer', marginBottom:14, fontFamily:'Nunito,sans-serif' },
  successBox: { background:'#D1FAE5', color:'#065F46', borderRadius:12, padding:'11px 14px', fontSize:13, fontWeight:700, marginBottom:14 },
  errorBox:   { background:'#FEE2E2', color:'#DC2626', borderRadius:12, padding:'11px 14px', fontSize:13, fontWeight:600, marginBottom:14 },
  label:      { display:'block', fontSize:13, fontWeight:700, color:'#4B5563', marginBottom:5 },
  input:      { width:'100%', padding:'12px 14px', borderRadius:12, border:'2px solid #EDE9FE', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'Nunito,sans-serif' },
  btn:        { width:'100%', padding:'14px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#7C3AED,#EC4899)', color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  switchText: { textAlign:'center', marginTop:16, fontSize:14, color:'#6B7280' },
  link:       { color:'#7C3AED', fontWeight:700, textDecoration:'none' },
};