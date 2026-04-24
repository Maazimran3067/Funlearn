import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { id:'student', emoji:'🎒', label:'Student',  color:'#7C3AED', light:'#EDE9FE' },
  { id:'teacher', emoji:'👩‍🏫', label:'Teacher',  color:'#10B981', light:'#D1FAE5' },
  { id:'parent',  emoji:'👨‍👩‍👧', label:'Parent',   color:'#F97316', light:'#FFEDD5' },
  { id:'admin',   emoji:'🔧', label:'Admin',    color:'#EF4444', light:'#FEE2E2' },
];

const ROLE_PATHS = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  parent:  '/parent/dashboard',
  admin:   '/admin/dashboard',
};

export default function LoginPage() {
  const { login }           = useAuth();
  const navigate            = useNavigate();
  const [role,     setRole] = useState('student');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const userData = await login(email.trim(), password, role);
      navigate(ROLE_PATHS[userData.role] || '/student/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.error) {
        setError(data.error);
      } else if (err.response?.status === 403) {
        setError('Your account has been deactivated. Please contact the admin.');
      } else if (err.response?.status === 400) {
        setError('Wrong email or password. Please try again.');
      } else if (!err.response) {
        setError('Cannot reach server. Make sure Django is running on port 8000.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentRole = ROLES.find(r => r.id === role);

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg,#F9F5FF,#FDF2F8,#F0FDF4)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <motion.div style={{
        background:'#fff', borderRadius:32, padding:'40px 36px',
        width:'100%', maxWidth:460,
        boxShadow:'0 20px 60px rgba(124,58,237,0.12)',
      }}
        initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:56 }}>🎓</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#7C3AED', margin:'8px 0 4px' }}>FunLearn AI</h1>
          <p style={{ fontSize:14, color:'#6B7280', margin:0 }}>Sign in to your account</p>
        </div>

        {/* Role selector */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:24 }}>
          {ROLES.map(r => (
            <motion.button key={r.id}
              type="button"
              style={{
                padding:'10px 6px', borderRadius:14, border:'2px solid',
                borderColor:role===r.id?r.color:'#E5E7EB',
                background:role===r.id?r.light:'#F9FAFB',
                cursor:'pointer', display:'flex', flexDirection:'column',
                alignItems:'center', gap:4,
              }}
              whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
              onClick={() => { setRole(r.id); setError(''); }}>
              <span style={{ fontSize:22 }}>{r.emoji}</span>
              <span style={{ fontSize:11, fontWeight:700, color:role===r.id?r.color:'#6B7280' }}>{r.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <motion.div style={{
            background:'#FEE2E2', color:'#DC2626', borderRadius:12,
            padding:'12px 16px', marginBottom:16, fontSize:14, fontWeight:600,
          }}
            initial={{ opacity:0 }} animate={{ opacity:1 }}>
            ❌ {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#4B5563', marginBottom:6 }}>
              📧 Email Address
            </label>
            <input
              type="email"
              style={{
                width:'100%', padding:'13px 16px', borderRadius:14,
                border:`2px solid ${currentRole?.color}40`,
                fontSize:14, outline:'none', boxSizing:'border-box',
                fontFamily:'Nunito,sans-serif',
              }}
              placeholder="your@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              required
            />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#4B5563', marginBottom:6 }}>
              🔒 Password
            </label>
            <input
              type="password"
              style={{
                width:'100%', padding:'13px 16px', borderRadius:14,
                border:`2px solid ${currentRole?.color}40`,
                fontSize:14, outline:'none', boxSizing:'border-box',
                fontFamily:'Nunito,sans-serif',
              }}
              placeholder="Your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              required
            />
          </div>

          <motion.button
            type="submit"
            style={{
              width:'100%', padding:'15px', borderRadius:16, border:'none',
              background:`linear-gradient(135deg,${currentRole?.color},#EC4899)`,
              color:'#fff', fontSize:16, fontWeight:800, cursor:'pointer',
              fontFamily:'Nunito,sans-serif',
              opacity:loading?0.7:1,
            }}
            whileHover={!loading?{scale:1.02}:{}}
            whileTap={!loading?{scale:0.98}:{}}
            disabled={loading}>
            {loading ? '⏳ Signing in...' : `Sign In as ${currentRole?.label} ${currentRole?.emoji}`}
          </motion.button>
        </form>

        <p style={{ textAlign:'center', marginTop:20, fontSize:14, color:'#6B7280' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'#7C3AED', fontWeight:700, textDecoration:'none' }}>
            Register here! 🚀
          </Link>
        </p>
      </motion.div>
    </div>
  );
}