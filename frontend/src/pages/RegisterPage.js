import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { registerUser } from '../services/api';
import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api';

const ROLES = [
  { id:'student', emoji:'🎒', label:'Student',  desc:'I want to learn and play!',      color:'#7C3AED', light:'#EDE9FE' },
  { id:'teacher', emoji:'👩‍🏫', label:'Teacher',  desc:'I teach a class',                color:'#10B981', light:'#D1FAE5' },
  { id:'parent',  emoji:'👨‍👩‍👧', label:'Parent',   desc:"I track my child's progress",   color:'#F97316', light:'#FFEDD5' },
  { id:'admin',   emoji:'🔧', label:'Admin',    desc:'I manage the platform',          color:'#EF4444', light:'#FEE2E2' },
];

const AGE_GROUPS = [
  { id:'3-6',  emoji:'🐣', label:'Little Explorer (3–6)',  color:'#F97316', light:'#FFEDD5' },
  { id:'6-9',  emoji:'🚀', label:'Junior Learner (6–9)',   color:'#7C3AED', light:'#EDE9FE' },
  { id:'9-12', emoji:'🧠', label:'Super Scholar (9–12)',   color:'#10B981', light:'#D1FAE5' },
];

export default function RegisterPage() {
  const [step,    setStep]    = useState(1);
  const [role,    setRole]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const navigate              = useNavigate();

  const [form, setForm] = useState({
    email:'', username:'', password:'', first_name:'', last_name:'',
    age_group:'', class_code:'', school_name:'', child_username:'',
  });

  const [classCodeStatus, setClassCodeStatus] = useState({ valid:null, message:'' });

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const checkClassCode = async (code) => {
    if (code.length < 5) { setClassCodeStatus({ valid:null, message:'' }); return; }
    try {
      const res = await axios.get(`${BASE_URL}/users/check-class-code/?code=${code}`);
      setClassCodeStatus({ valid:res.data.valid, message:res.data.message, class_name:res.data.class_name||'' });
    } catch { setClassCodeStatus({ valid:false, message:'Could not check code.' }); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const data = { email:form.email, username:form.username, password:form.password, first_name:form.first_name, last_name:form.last_name, role };
    if (role === 'student') { data.age_group = form.age_group; data.class_code = form.class_code; }
    else if (role === 'teacher') { data.school_name = form.school_name; }
    else if (role === 'parent')  { data.child_username = form.child_username; }

    try {
      const res = await registerUser(data);
      if (role === 'teacher' && res.data.class_code) {
        setSuccess(`Account created! Your class code is: ${res.data.class_code} — Write it down! 📝`);
        setTimeout(() => navigate('/login'), 5000);
      } else {
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      const errors   = err.response?.data;
      if (errors) {
        const firstKey = Object.keys(errors)[0];
        const firstMsg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
        setError(firstMsg || 'Something went wrong!');
      } else {
        setError('Server not responding. Make sure Django is running!');
      }
    } finally { setLoading(false); }
  };

  const currentRole = ROLES.find(r => r.id === role);

  // ── STEP 1 — ROLE SELECTION ──────────────────────────────────────
  if (step === 1) {
    return (
      <div style={S.page}>
        <motion.div style={S.card} initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:52 }}>🌟</div>
            <h1 style={{ fontSize:26, fontWeight:900, color:'#7C3AED', margin:0 }}>Join FunLearn AI</h1>
            <p style={{ fontSize:14, color:'#6B7280', marginTop:4 }}>Who are you? Pick your role!</p>
          </div>
          <div style={S.roleGrid}>
            {ROLES.map(r => (
              <motion.div key={r.id}
                style={{ ...S.roleCard, border:role===r.id?`3px solid ${r.color}`:'3px solid transparent', background:role===r.id?r.light:'#F9FAFB' }}
                whileHover={{ scale:1.04, y:-4 }} whileTap={{ scale:0.97 }}
                onClick={() => setRole(r.id)}>
                <div style={{ fontSize:40 }}>{r.emoji}</div>
                <div style={{ fontSize:14, fontWeight:800, color:role===r.id?r.color:'#1F1F2E', marginTop:8 }}>{r.label}</div>
                <div style={{ fontSize:11, color:'#6B7280', marginTop:4, textAlign:'center' }}>{r.desc}</div>
              </motion.div>
            ))}
          </div>
          <motion.button style={{ ...S.btn, opacity:role?1:0.4 }}
            whileHover={role?{scale:1.03}:{}} whileTap={role?{scale:0.97}:{}}
            onClick={() => role && setStep(2)}>
            Next →
          </motion.button>
          <p style={S.switchText}>Already have an account? <Link to="/login" style={S.link}>Log in! 🚀</Link></p>
        </motion.div>
      </div>
    );
  }

  // ── STEP 2 — FORM ────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <motion.div style={S.card} initial={{ opacity:0, x:40 }} animate={{ opacity:1, x:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <button style={S.backBtn} onClick={() => { setStep(1); setError(''); }}>← Back</button>
          <div style={{ textAlign:'center' }}>
            <span style={{ fontSize:30 }}>{currentRole?.emoji}</span>
            <div style={{ fontSize:15, fontWeight:800, color:currentRole?.color }}>{currentRole?.label} Registration</div>
          </div>
          <div style={{ width:60 }} />
        </div>

        {success && (
          <motion.div style={S.successBox} initial={{ opacity:0 }} animate={{ opacity:1 }}>
            ✅ {success}
          </motion.div>
        )}
        {error && (
          <motion.div style={S.errorBox} initial={{ opacity:0 }} animate={{ opacity:1 }}>
            ❌ {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display:'flex', gap:12, marginBottom:12 }}>
            <div style={{ flex:1 }}>
              <label style={S.label}>First Name *</label>
              <input style={S.input} name="first_name" placeholder="Ali" value={form.first_name} onChange={handleChange} required />
            </div>
            <div style={{ flex:1 }}>
              <label style={S.label}>Last Name *</label>
              <input style={S.input} name="last_name" placeholder="Khan" value={form.last_name} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={S.label}>📧 Email *</label>
            <input style={S.input} name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={S.label}>🎮 Username *</label>
            <input style={S.input} name="username" placeholder="coolname123" value={form.username} onChange={handleChange} required />
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={S.label}>🔒 Password * (min 6 characters)</label>
            <input style={S.input} name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required />
          </div>

          {/* Student specific */}
          {role === 'student' && (
            <AnimatePresence>
              <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                <div style={{ marginBottom:14 }}>
                  <label style={S.label}>🎂 Your Age Group *</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {AGE_GROUPS.map(ag => (
                      <motion.div key={ag.id}
                        style={{ ...S.ageCard, flex:1, minWidth:120, border:form.age_group===ag.id?`3px solid ${ag.color}`:'3px solid #E5E7EB', background:form.age_group===ag.id?ag.light:'#fff' }}
                        whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                        onClick={() => setForm({ ...form, age_group:ag.id })}>
                        <div style={{ fontSize:24 }}>{ag.emoji}</div>
                        <div style={{ fontSize:13, fontWeight:800, color:form.age_group===ag.id?ag.color:'#1F1F2E', marginTop:4 }}>{ag.id}</div>
                        <div style={{ fontSize:10, color:'#6B7280', textAlign:'center' }}>{ag.label}</div>
                      </motion.div>
                    ))}
                  </div>
                  {!form.age_group && <div style={{ fontSize:11, color:'#EF4444', marginTop:4 }}>Please select an age group</div>}
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={S.label}>🏫 Class Code <span style={{ fontSize:11, color:'#9CA3AF', fontWeight:400 }}>(optional)</span></label>
                  <input style={{ ...S.input, borderColor:classCodeStatus.valid===true?'#10B981':classCodeStatus.valid===false?'#EF4444':'#EDE9FE', textTransform:'uppercase' }}
                    name="class_code" placeholder="e.g. HASSAN-X7K2" value={form.class_code}
                    onChange={e => { handleChange(e); checkClassCode(e.target.value); }} />
                  {classCodeStatus.message && (
                    <div style={{ fontSize:12, marginTop:4, fontWeight:600, color:classCodeStatus.valid?'#10B981':'#EF4444' }}>
                      {classCodeStatus.message}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Teacher specific */}
          {role === 'teacher' && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
              <div style={{ marginBottom:12 }}>
                <label style={S.label}>🏛️ School Name *</label>
                <input style={S.input} name="school_name" placeholder="e.g. City School" value={form.school_name} onChange={handleChange} required />
              </div>
              <div style={{ background:'#EFF6FF', color:'#1D4ED8', borderRadius:12, padding:'10px 14px', fontSize:13, fontWeight:600, marginBottom:8 }}>
                💡 After registering you will get a unique class code to share with students!
              </div>
            </motion.div>
          )}

          {/* Parent specific */}
          {role === 'parent' && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
              <div style={{ marginBottom:12 }}>
                <label style={S.label}>👧 Child's Username *</label>
                <input style={S.input} name="child_username" placeholder="Your child's exact username" value={form.child_username} onChange={handleChange} required />
                <div style={{ fontSize:12, color:'#6B7280', marginTop:4 }}>Your child must have registered first with a student account.</div>
              </div>
            </motion.div>
          )}

          {/* Admin specific — no secret code */}
          {role === 'admin' && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
              <div style={{ background:'#FEF2F2', borderRadius:12, padding:'12px 16px', marginBottom:12, fontSize:13, color:'#991B1B', fontWeight:600 }}>
                🔧 Admin account — full platform control after registration.
              </div>
            </motion.div>
          )}

          <motion.button
            type="submit"
            style={{ ...S.btn, background:`linear-gradient(135deg, ${currentRole?.color}, #EC4899)`, marginTop:8 }}
            whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            disabled={loading || (role==='student' && !form.age_group)}>
            {loading ? '✨ Creating account...' : `Create ${currentRole?.label} Account! 🎉`}
          </motion.button>
        </form>
        <p style={S.switchText}>Already have an account? <Link to="/login" style={S.link}>Log in! 🚀</Link></p>
      </motion.div>
    </div>
  );
}

const S = {
  page:       { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#F9F5FF,#FDF2F8,#F0FDF4)', padding:'20px' },
  card:       { background:'#fff', borderRadius:32, padding:'36px 32px', width:'100%', maxWidth:500, boxShadow:'0 20px 60px rgba(124,58,237,0.12)' },
  roleGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 },
  roleCard:   { borderRadius:16, padding:'16px 12px', display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer', transition:'all 0.2s' },
  ageCard:    { borderRadius:14, padding:'12px 8px', display:'flex', flexDirection:'column', alignItems:'center', cursor:'pointer', transition:'all 0.2s' },
  backBtn:    { background:'#F3F4F6', border:'none', padding:'8px 14px', borderRadius:10, fontSize:13, fontWeight:700, color:'#4B5563', cursor:'pointer' },
  successBox: { background:'#D1FAE5', color:'#065F46', borderRadius:12, padding:'12px 16px', fontSize:14, fontWeight:700, marginBottom:16, textAlign:'center' },
  errorBox:   { background:'#FEE2E2', color:'#DC2626', borderRadius:12, padding:'10px 16px', fontSize:14, marginBottom:16, fontWeight:600 },
  label:      { display:'block', fontSize:13, fontWeight:700, color:'#4B5563', marginBottom:5 },
  input:      { width:'100%', padding:'13px 16px', borderRadius:14, border:'2.5px solid #EDE9FE', fontSize:14, outline:'none', background:'#FAFAFA', boxSizing:'border-box', fontFamily:'Nunito,sans-serif' },
  btn:        { width:'100%', padding:'15px', borderRadius:16, border:'none', background:'linear-gradient(135deg,#7C3AED,#EC4899)', color:'#fff', fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif' },
  switchText: { textAlign:'center', marginTop:18, fontSize:14, color:'#6B7280' },
  link:       { color:'#7C3AED', fontWeight:700, textDecoration:'none' },
};