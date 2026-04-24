import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile, changePassword } from '../../services/api';
import StudentNavbar from '../../components/StudentNavbar';

// Normalise age group display
function normaliseAgeGroup(raw) {
  if (!raw) return '6-9';
  const s = String(raw).trim();
  if (s === '3-5' || s === '3-6') return '3-6';
  if (s === '6-8' || s === '6-9') return '6-9';
  if (s === '9-12')               return '9-12';
  return raw;
}

const AGE_LABEL = {
  '3-6':  '🐣 Little Explorer (Age 3–6)',
  '6-9':  '🚀 Junior Learner (Age 6–9)',
  '9-12': '🧠 Super Scholar (Age 9–12)',
};

export default function StudentProfile() {
  const { user, setUser } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [pwMode,   setPwMode]   = useState(false);
  const [msg,      setMsg]      = useState({ type:'', text:'' });
  const [form,     setForm]     = useState({ first_name:'', last_name:'' });
  const [pw,       setPw]       = useState({ old_password:'', new_password:'', confirm:'' });

  useEffect(() => {
    getProfile()
      .then(res => {
        setProfile(res.data);
        setForm({ first_name:res.data.first_name, last_name:res.data.last_name });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      await updateProfile({ first_name:form.first_name, last_name:form.last_name });
      setUser({ ...user, first_name:form.first_name, last_name:form.last_name });
      setMsg({ type:'success', text:'Profile updated!' });
      setEditMode(false);
    } catch { setMsg({ type:'error', text:'Could not update profile.' }); }
  };

  const handlePw = async () => {
    if (pw.new_password !== pw.confirm) { setMsg({ type:'error', text:'Passwords do not match!' }); return; }
    try {
      await changePassword({ old_password:pw.old_password, new_password:pw.new_password });
      setMsg({ type:'success', text:'Password changed successfully!' });
      setPwMode(false); setPw({ old_password:'', new_password:'', confirm:'' });
    } catch { setMsg({ type:'error', text:'Wrong current password!' }); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#F9F5FF,#FDF2F8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
      Loading... ✨
    </div>
  );

  const ageGroup = normaliseAgeGroup(profile?.profile?.age_group);

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#F9F5FF,#FDF2F8,#F0FDF4)' }}>
      <StudentNavbar />
      <div style={{ maxWidth:720, margin:'0 auto', padding:'32px 20px' }}>
        <h1 style={{ fontSize:26, fontWeight:900, color:'#1F1F2E', marginBottom:24 }}>⚙️ My Profile</h1>

        {msg.text && (
          <motion.div style={{ background:msg.type==='success'?'#D1FAE5':'#FEE2E2', color:msg.type==='success'?'#065F46':'#DC2626', borderRadius:12, padding:'12px 16px', marginBottom:16, fontSize:14, fontWeight:700 }}
            initial={{ opacity:0 }} animate={{ opacity:1 }}>
            {msg.type==='success'?'✅':'❌'} {msg.text}
          </motion.div>
        )}

        {/* Profile Card */}
        <motion.div style={{ background:'#fff', borderRadius:24, padding:'28px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', marginBottom:16 }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#7C3AED,#EC4899)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>🎒</div>
              <div>
                <div style={{ fontSize:22, fontWeight:900, color:'#1F1F2E' }}>{profile?.first_name} {profile?.last_name}</div>
                <div style={{ fontSize:14, color:'#6B7280' }}>{profile?.email}</div>
                <div style={{ fontSize:13, color:'#7C3AED', fontWeight:700, marginTop:4 }}>@{profile?.username}</div>
              </div>
            </div>
            <motion.button style={{ background:'#EDE9FE', color:'#7C3AED', border:'none', padding:'10px 18px', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer' }}
              whileHover={{ scale:1.05 }} onClick={() => setEditMode(!editMode)}>
              {editMode ? 'Cancel' : '✏️ Edit Name'}
            </motion.button>
          </div>

          {editMode && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ marginBottom:8 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                {[['First Name','first_name'],['Last Name','last_name']].map(([label,key])=>(
                  <div key={key}>
                    <label style={{ display:'block', fontSize:13, fontWeight:700, color:'#4B5563', marginBottom:5 }}>{label}</label>
                    <input style={{ width:'100%', padding:'11px 14px', borderRadius:12, border:'2px solid #EDE9FE', fontSize:14, outline:'none', boxSizing:'border-box' }}
                      value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} />
                  </div>
                ))}
              </div>
              <motion.button style={{ background:'linear-gradient(135deg,#7C3AED,#EC4899)', color:'#fff', border:'none', padding:'12px 24px', borderRadius:12, fontSize:15, fontWeight:800, cursor:'pointer' }}
                whileHover={{ scale:1.03 }} onClick={handleSave}>
                Save Changes ✅
              </motion.button>
            </motion.div>
          )}

          {/* Info Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginTop:8 }}>
            {[
              { label:'Age Group',    value: AGE_LABEL[ageGroup] || ageGroup,         emoji:'🎂' },
              { label:'Level',        value:`Level ${profile?.profile?.current_level||1}`, emoji:'🎯' },
              { label:'Total Stars',  value:`⭐ ${profile?.profile?.total_stars||0}`,  emoji:'🌟' },
              { label:'Class Code',   value: profile?.profile?.class_code || 'No class joined', emoji:'🏫' },
            ].map((item,i)=>(
              <div key={i} style={{ background:'#F9FAFB', borderRadius:14, padding:'14px 16px' }}>
                <div style={{ fontSize:11, color:'#9CA3AF', fontWeight:600, marginBottom:4 }}>{item.emoji} {item.label}</div>
                <div style={{ fontSize:14, fontWeight:800, color:'#1F1F2E' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div style={{ background:'#fff', borderRadius:24, padding:'24px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:pwMode?16:0 }}>
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
  );
}