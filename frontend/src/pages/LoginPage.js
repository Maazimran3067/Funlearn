import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { id:'student', emoji:'🎒', label:'Student',  desc:'Play games & learn',  color:'#6366F1', glow:'rgba(99,102,241,0.2)',  border:'rgba(99,102,241,0.5)' },
  { id:'parent',  emoji:'👨‍👩‍👧', label:'Parent',   desc:'Track your child',   color:'#10B981', glow:'rgba(16,185,129,0.2)',  border:'rgba(16,185,129,0.5)' },
  { id:'teacher', emoji:'👩‍🏫', label:'Teacher',  desc:'Manage classes',     color:'#F59E0B', glow:'rgba(245,158,11,0.2)',  border:'rgba(245,158,11,0.5)' },
  { id:'admin',   emoji:'🛡️', label:'Admin',    desc:'System admin',       color:'#EF4444', glow:'rgba(239,68,68,0.2)',   border:'rgba(239,68,68,0.5)'  },
];
const PATHS = { student:'/student/dashboard', teacher:'/teacher/dashboard', parent:'/parent/dashboard', admin:'/admin/dashboard' };

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [ri, setRi]         = useState(0);
  const [id, setId]         = useState('');
  const [pw, setPw]         = useState('');
  const [show, setShow]     = useState(false);
  const [err, setErr]       = useState('');
  const [loading, setLoad]  = useState(false);
  const [fId, setFId]       = useState(false);
  const [fPw, setFPw]       = useState(false);
  const role = ROLES[ri];
  const isS  = role.id === 'student';

  const rgbOf = (c) => c==='#6366F1'?'99,102,241':c==='#10B981'?'16,185,129':c==='#F59E0B'?'245,158,11':'239,68,68';

  const submit = async (e) => {
    e.preventDefault();
    if (!id.trim()||!pw.trim()) { setErr('Please fill in all fields.'); return; }
    setLoad(true); setErr('');
    try {
      const u = await login(isS?null:id.trim(), pw, role.id, isS?id.trim():null);
      navigate(PATHS[u.role]||'/student/dashboard');
    } catch(e) {
      setErr(e.response?.data?.error||(!e.response?'Cannot reach server.':'Wrong credentials.'));
    } finally { setLoad(false); }
  };

  const box = (f) => ({
    background:f?'rgba(30,41,59,0.95)':'rgba(15,23,42,0.7)',
    border:`1px solid ${f?role.color:'#2D3A4F'}`,
    borderRadius:12, padding:'13px 16px',
    boxShadow:f?`0 0 0 3px rgba(${rgbOf(role.color)},0.15)`:'none',
    transition:'all 0.2s', display:'flex', alignItems:'center', gap:8,
  });

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#0B1120', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, opacity:0.03,
        backgroundImage:'linear-gradient(#4F6080 1px,transparent 1px),linear-gradient(90deg,#4F6080 1px,transparent 1px)',
        backgroundSize:'48px 48px', pointerEvents:'none' }}/>
      <motion.div style={{ position:'absolute', width:700, height:700, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)',
        top:-250, left:-150, pointerEvents:'none' }}
        animate={{ scale:[1,1.1,1] }} transition={{ duration:9, repeat:Infinity }} />
      <motion.div style={{ position:'absolute', width:500, height:500, borderRadius:'50%',
        background:'radial-gradient(circle,rgba(16,185,129,0.07) 0%,transparent 70%)',
        bottom:-150, right:100, pointerEvents:'none' }}
        animate={{ scale:[1,1.2,1] }} transition={{ duration:11, repeat:Infinity, delay:3 }} />

      {/* LEFT */}
      <div style={{ width:'44%', minHeight:'100vh',
        background:'linear-gradient(160deg,#1B2B4B 0%,#0F1629 55%,#0B1120 100%)',
        borderRight:'1px solid #1E2D45', display:'flex', flexDirection:'column',
        justifyContent:'center', padding:'60px 52px', position:'relative', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:52 }}>
          <div style={{ width:46, height:46, borderRadius:12,
            background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:24, boxShadow:'0 4px 20px rgba(99,102,241,0.45)' }}>🎓</div>
          <span style={{ fontSize:24, fontWeight:900, fontFamily:'Nunito,sans-serif' }}>
            <span style={{ color:'#6366F1' }}>Fun</span>
            <span style={{ color:'#F59E0B' }}>Learn</span>
            <span style={{ color:'#F1F5F9' }}>AI</span>
          </span>
        </div>
        <h1 style={{ fontSize:32, fontWeight:900, color:'#F1F5F9',
          fontFamily:'Nunito,sans-serif', margin:'0 0 14px', lineHeight:1.25 }}>
          Pakistan's #1<br/>
          <span style={{ background:'linear-gradient(90deg,#6366F1,#A855F7)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Gamified Learning
          </span><br/>Platform
        </h1>
        <p style={{ color:'#94A3B8', fontSize:14, fontFamily:'Nunito,sans-serif', marginBottom:36, lineHeight:1.6 }}>
          AI-powered education for children aged 3–12
        </p>
        {[['🎮','9 Interactive Educational Games'],['🤖','AI-Powered Adaptive Difficulty'],
          ['📊','Real-time Progress Tracking'],['🎯','For Ages 3–12']].map(([ic,tx],i)=>(
          <motion.div key={i} initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
            transition={{ delay:i*0.1+0.2 }}
            style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:30, height:30, borderRadius:8, fontSize:14, flexShrink:0,
              background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>{ic}</div>
            <span style={{ color:'#94A3B8', fontSize:13, fontFamily:'Nunito,sans-serif' }}>{tx}</span>
          </motion.div>
        ))}
        <div style={{ display:'flex', gap:36, marginTop:44 }}>
          {[['500+','Schools'],['50K+','Students'],['1M+','Games Played']].map(([n,l],i)=>(
            <div key={i}>
              <div style={{ fontSize:24, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' }}>{n}</div>
              <div style={{ fontSize:11, color:'#64748B', fontFamily:'Nunito,sans-serif', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
        {[300,200,120].map((s,i)=>(
          <div key={i} style={{ position:'absolute', bottom:-s/2, left:-s/2,
            width:s, height:s, borderRadius:'50%',
            border:`1px solid rgba(99,102,241,${0.08-i*0.02})`, pointerEvents:'none' }}/>
        ))}
      </div>

      {/* RIGHT */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 52px' }}>
        <motion.div style={{ width:'100%', maxWidth:430 }}
          initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
          <div style={{ marginBottom:30 }}>
            <h2 style={{ fontSize:27, fontWeight:900, color:'#F1F5F9', fontFamily:'Nunito,sans-serif', margin:'0 0 6px' }}>Welcome Back! 👋</h2>
            <p style={{ color:'#94A3B8', fontSize:14, fontFamily:'Nunito,sans-serif' }}>Select your role to continue</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:26 }}>
            {ROLES.map((r,i)=>(
              <motion.div key={r.id}
                style={{ borderRadius:14, padding:'16px 14px', cursor:'pointer', position:'relative', overflow:'hidden',
                  background:ri===i?`rgba(${rgbOf(r.color)},0.12)`:'rgba(30,41,59,0.5)',
                  border:`1px solid ${ri===i?r.border:'#2D3A4F'}`, backdropFilter:'blur(8px)' }}
                whileHover={{ scale:1.03, borderColor:r.border, background:`rgba(${rgbOf(r.color)},0.12)` }}
                whileTap={{ scale:0.97 }} transition={{ duration:0.15 }}
                onClick={()=>{ setRi(i); setErr(''); setId(''); }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{r.emoji}</div>
                <div style={{ fontSize:13, fontWeight:800, fontFamily:'Nunito,sans-serif',
                  color:ri===i?r.color:'#F1F5F9', transition:'color 0.2s' }}>{r.label}</div>
                <div style={{ fontSize:11, color:'#64748B', fontFamily:'Nunito,sans-serif', marginTop:3 }}>{r.desc}</div>
                <div style={{ position:'absolute', bottom:10, right:12, fontSize:12, fontFamily:'Nunito,sans-serif',
                  color:ri===i?r.color:'#64748B', transition:'color 0.2s' }}>→</div>
                {ri===i && <motion.div layoutId="aR" style={{ position:'absolute', inset:0, borderRadius:14,
                  background:`radial-gradient(circle at 20% 50%,${r.glow},transparent)`, pointerEvents:'none' }}
                  transition={{ type:'spring', bounce:0.25, duration:0.4 }}/>}
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {err && <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
              exit={{ opacity:0, height:0 }} transition={{ duration:0.2 }}
              style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                borderRadius:10, padding:'10px 14px', marginBottom:14,
                color:'#FCA5A5', fontSize:13, fontFamily:'Nunito,sans-serif',
                display:'flex', gap:8, alignItems:'center' }}>⚠️ {err}</motion.div>}
          </AnimatePresence>

          <form onSubmit={submit}>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94A3B8',
                marginBottom:7, fontFamily:'Nunito,sans-serif', letterSpacing:'0.8px' }}>
                {isS?'🎮 USERNAME':'📧 EMAIL ADDRESS'}
              </label>
              <div style={box(fId)}>
                <input type={isS?'text':'email'} placeholder={isS?'Your username':'your@email.com'}
                  value={id} onChange={e=>{ setId(e.target.value); setErr(''); }}
                  required onFocus={()=>setFId(true)} onBlur={()=>setFId(false)}
                  style={{ flex:1, background:'transparent', border:'none', outline:'none',
                    color:'#F1F5F9', fontSize:14, fontFamily:'Nunito,sans-serif' }}/>
              </div>
            </div>
            <div style={{ marginBottom:26 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#94A3B8',
                marginBottom:7, fontFamily:'Nunito,sans-serif', letterSpacing:'0.8px' }}>
                🔒 PASSWORD
              </label>
              <div style={box(fPw)}>
                <input type={show?'text':'password'} placeholder="Enter your password"
                  value={pw} onChange={e=>{ setPw(e.target.value); setErr(''); }}
                  required onFocus={()=>setFPw(true)} onBlur={()=>setFPw(false)}
                  style={{ flex:1, background:'transparent', border:'none', outline:'none',
                    color:'#F1F5F9', fontSize:14, fontFamily:'Nunito,sans-serif' }}/>
                <button type="button" onClick={()=>setShow(!show)}
                  style={{ background:'none', border:'none', cursor:'pointer',
                    color:'#64748B', fontSize:16, padding:0, lineHeight:1 }}>
                  {show?'🙈':'👁️'}
                </button>
              </div>
            </div>
            <motion.button type="submit" disabled={loading}
              style={{ width:'100%', padding:'14px', borderRadius:12, border:'none',
                background:loading?'#1E293B':`linear-gradient(135deg,${role.color},${role.color}BB)`,
                color:loading?'#64748B':'#fff', fontSize:15, fontWeight:800,
                cursor:loading?'not-allowed':'pointer', fontFamily:'Nunito,sans-serif',
                boxShadow:loading?'none':`0 4px 20px ${role.glow}`, transition:'all 0.2s' }}
              whileHover={!loading?{ scale:1.02, y:-1 }:{}} whileTap={!loading?{ scale:0.98 }:{}}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <motion.span animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
                      style={{ display:'inline-block' }}>⏳</motion.span> Signing in...
                  </span>
                : `Sign In as ${role.label} ${role.emoji}`}
            </motion.button>
          </form>
          <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'#64748B', fontFamily:'Nunito,sans-serif' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:role.color, fontWeight:700, textDecoration:'none' }}>Register here →</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}