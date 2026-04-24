import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, changePassword, getTeacherClasses } from '../../services/api';
import TeacherNavbar from '../../components/TeacherNavbar';

export default function TeacherProfile() {
  const { user, setUser } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [classes,  setClasses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [pwMode,   setPwMode]   = useState(false);
  const [msg,      setMsg]      = useState({ type:'', text:'' });

  const [form, setForm] = useState({ first_name:'', last_name:'', school_name:'' });
  const [pw,   setPw]   = useState({ old_password:'', new_password:'', confirm:'' });

  useEffect(() => {
    Promise.all([getProfile(), getTeacherClasses()])
      .then(([pRes, cRes]) => {
        const p = pRes.data;
        setProfile(p);
        setForm({ first_name: p.first_name, last_name: p.last_name, school_name: p.profile?.school_name || '' });
        setClasses(cRes.data.classes || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      const res = await updateProfile({ first_name: form.first_name, last_name: form.last_name });
      setUser({ ...user, first_name: form.first_name, last_name: form.last_name });
      setMsg({ type:'success', text:'Profile updated!' });
      setEditMode(false);
    } catch { setMsg({ type:'error', text:'Could not update profile.' }); }
  };

  const handlePw = async () => {
    if (pw.new_password !== pw.confirm) { setMsg({ type:'error', text:'Passwords do not match!' }); return; }
    try {
      await changePassword({ old_password: pw.old_password, new_password: pw.new_password });
      setMsg({ type:'success', text:'Password changed!' });
      setPwMode(false); setPw({ old_password:'', new_password:'', confirm:'' });
    } catch { setMsg({ type:'error', text:'Wrong current password!' }); }
  };

  if (loading) return <div style={{ minHeight:'100vh', background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>Loading... ⏳</div>;

  return (
    <div style={{ minHeight:'100vh', background:'#F0FDF4' }}>
      <TeacherNavbar />
      <div style={{ maxWidth:800, margin:'0 auto', padding:'32px 20px' }}>
        <h1 style={{ fontSize:26, fontWeight:900, color:'#1F1F2E', marginBottom:24 }}>⚙️ Teacher Profile</h1>

        {msg.text && (
          <motion.div style={{ background:msg.type==='success'?'#D1FAE5':'#FEE2E2', color:msg.type==='success'?'#065F46':'#991B1B', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:14, fontWeight:700 }}
            initial={{ opacity:0 }} animate={{ opacity:1 }}>
            {msg.type==='success'?'✅':'❌'} {msg.text}
          </motion.div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          {/* Profile Card */}
          <motion.div style={{ background:'#fff', borderRadius:24, padding:'24px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', gridColumn:'1/-1' }}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#10B981,#3B82F6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>👩‍🏫</div>
                <div>
                  <div style={{ fontSize:22, fontWeight:900, color:'#1F1F2E' }}>{profile?.first_name} {profile?.last_name}</div>
                  <div style={{ fontSize:14, color:'#6B7280' }}>{profile?.email}</div>
                  <div style={{ fontSize:13, color:'#10B981', fontWeight:700 }}>🏛️ {profile?.profile?.school_name || 'No school set'}</div>
                </div>
              </div>
              <motion.button style={{ background:'#D1FAE5', color:'#065F46', border:'none', padding:'10px 18px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}
                whileHover={{ scale:1.05 }} onClick={() => setEditMode(!editMode)}>
                {editMode ? 'Cancel' : '✏️ Edit'}
              </motion.button>
            </div>

            {editMode && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                  {[['First Name', 'first_name'], ['Last Name', 'last_name']].map(([label, key]) => (
                    <div key={key}>
                      <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#4B5563', marginBottom:5 }}>{label}</label>
                      <input style={{ width:'100%', padding:'11px 14px', borderRadius:12, border:'2px solid #D1FAE5', fontSize:14, outline:'none', boxSizing:'border-box' }}
                        value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <motion.button style={{ background:'linear-gradient(135deg,#10B981,#3B82F6)', color:'#fff', border:'none', padding:'12px 24px', borderRadius:12, fontSize:15, fontWeight:800, cursor:'pointer' }}
                  whileHover={{ scale:1.03 }} onClick={handleSave}>
                  Save Changes ✅
                </motion.button>
              </motion.div>
            )}
          </motion.div>

          {/* Classes Card — shows ALL classes with codes */}
          <motion.div style={{ background:'#fff', borderRadius:24, padding:'24px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', gridColumn:'1/-1' }}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
            <h2 style={{ fontSize:18, fontWeight:900, color:'#1F1F2E', marginBottom:16 }}>🏫 My Classes</h2>
            {classes.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px', color:'#9CA3AF' }}>
                <div style={{ fontSize:40 }}>🏫</div>
                <p>No classes created yet. Go to Dashboard to create a class!</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {classes.map((cls, i) => (
                  <motion.div key={i} style={{ background:'#F0FDF4', borderRadius:16, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}
                    whileHover={{ scale:1.01 }}>
                    <div>
                      <div style={{ fontSize:16, fontWeight:800, color:'#065F46' }}>{cls.class_name}</div>
                      <div style={{ fontSize:13, color:'#6B7280', marginTop:2 }}>{cls.student_count || 0} students enrolled</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <div style={{ background:'#D1FAE5', borderRadius:10, padding:'4px 12px', fontSize:13, color:'#065F46', fontWeight:600 }}>
                        📅 {new Date(cls.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                      </div>
                      <div style={{ background:'#10B981', borderRadius:10, padding:'6px 16px', fontSize:14, color:'#fff', fontWeight:900, fontFamily:'monospace', letterSpacing:2, cursor:'pointer' }}
                        onClick={() => { navigator.clipboard?.writeText(cls.class_code); }}>
                        🔑 {cls.class_code}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Change Password */}
          <motion.div style={{ background:'#fff', borderRadius:24, padding:'24px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', gridColumn:'1/-1' }}
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: pwMode ? 16 : 0 }}>
              <h2 style={{ fontSize:18, fontWeight:900, color:'#1F1F2E', margin:0 }}>🔒 Change Password</h2>
              <motion.button style={{ background:'#FEE2E2', color:'#EF4444', border:'none', padding:'10px 18px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}
                whileHover={{ scale:1.05 }} onClick={() => setPwMode(!pwMode)}>
                {pwMode ? 'Cancel' : '🔑 Change'}
              </motion.button>
            </div>
            {pwMode && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
                {[['Current Password','old_password'],['New Password','new_password'],['Confirm New Password','confirm']].map(([label,key])=>(
                  <div key={key} style={{ marginBottom:12 }}>
                    <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#4B5563', marginBottom:5 }}>{label}</label>
                    <input type="password"
                      style={{ width:'100%', padding:'11px 14px', borderRadius:12, border:'2px solid #FEE2E2', fontSize:14, outline:'none', boxSizing:'border-box' }}
                      value={pw[key]} onChange={e=>setPw({...pw,[key]:e.target.value})} />
                  </div>
                ))}
                <motion.button style={{ background:'linear-gradient(135deg,#EF4444,#F97316)', color:'#fff', border:'none', padding:'12px 24px', borderRadius:12, fontSize:15, fontWeight:800, cursor:'pointer' }}
                  whileHover={{ scale:1.03 }} onClick={handlePw}>
                  Update Password 🔒
                </motion.button>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}