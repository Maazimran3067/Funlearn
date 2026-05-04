import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { label:'Dashboard',   icon:'📊', path:'/admin/dashboard' },
  { label:'Admin Panel', icon:'🛡️', path:'/admin/users' },
  { label:'Schools',     icon:'🏫', path:'/admin/classes' },
  { label:'Games',       icon:'🎮', path:'/admin/games' },
];

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const COLOR = '#6366F1';

  return (
    <>
      {/* Sidebar */}
      <div style={{ width:220, minHeight:'100vh', background:'#0F172A',
        borderRight:'1px solid #1E2D45', display:'flex', flexDirection:'column',
        position:'fixed', left:0, top:0, zIndex:100 }}>
        
        {/* Logo */}
        <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid #1E2D45' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10,
              background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🎓</div>
            <span style={{ fontSize:17, fontWeight:900, fontFamily:'Nunito,sans-serif' }}>
              <span style={{ color:'#6366F1' }}>Fun</span>
              <span style={{ color:'#F59E0B' }}>Learn</span>
              <span style={{ color:'#F1F5F9' }}>AI</span>
            </span>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex:1, padding:'16px 12px' }}>
          {NAV.map(n => {
            const active = location.pathname.startsWith(n.path.split('/').slice(0,3).join('/')) && n.path !== '/admin/dashboard' || location.pathname === n.path;
            return (
              <motion.div key={n.path}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                  borderRadius:10, marginBottom:4, cursor:'pointer',
                  background:active?'rgba(99,102,241,0.15)':'transparent',
                  border:`1px solid ${active?'rgba(99,102,241,0.3)':'transparent'}` }}
                whileHover={{ background:'rgba(99,102,241,0.08)' }}
                whileTap={{ scale:0.97 }}
                onClick={() => navigate(n.path)}>
                <span style={{ fontSize:16 }}>{n.icon}</span>
                <span style={{ fontSize:13, fontWeight:active?700:500,
                  color:active?'#818CF8':'#94A3B8', fontFamily:'Nunito,sans-serif' }}>{n.label}</span>
                {active && <motion.div layoutId="adminActive"
                  style={{ marginLeft:'auto', width:4, height:4, borderRadius:'50%', background:COLOR }}/>}
              </motion.div>
            );
          })}
        </div>

        {/* User / Logout */}
        <div style={{ padding:'16px 12px', borderTop:'1px solid #1E2D45' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:10,
              background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, color:'#fff', fontWeight:700 }}>
              {user?.first_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' }}>
                {user?.first_name} {user?.last_name}</div>
              <div style={{ fontSize:10, color:'#64748B', fontFamily:'Nunito,sans-serif', textTransform:'capitalize' }}>
                {user?.role || 'Admin'}
              </div>
            </div>
          </div>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }} onClick={logout}
            style={{ width:'100%', padding:'8px', borderRadius:8, border:'1px solid #2D3A4F',
              background:'transparent', color:'#64748B', fontSize:12, cursor:'pointer',
              fontFamily:'Nunito,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            ↩ Logout
          </motion.button>
        </div>
      </div>

      {/* Top bar */}
      <div style={{ marginLeft:220, position:'fixed', top:0, left:0, right:0, zIndex:90,
        background:'rgba(11,17,32,0.95)', borderBottom:'1px solid #1E2D45',
        backdropFilter:'blur(10px)', padding:'0 24px',
        display:'flex', alignItems:'center', height:60, gap:16 }}>
        
        <div style={{ flex:1, maxWidth:360, background:'rgba(30,41,59,0.6)',
          border:'1px solid #2D3A4F', borderRadius:10,
          display:'flex', alignItems:'center', gap:8, padding:'8px 14px' }}>
          <span style={{ color:'#64748B', fontSize:14 }}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search users, schools, logs..."
            style={{ background:'transparent', border:'none', outline:'none',
              color:'#F1F5F9', fontSize:13, fontFamily:'Nunito,sans-serif', flex:1 }}/>
        </div>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
          <button style={{ background:'rgba(30,41,59,0.6)', border:'1px solid #2D3A4F',
            borderRadius:8, width:36, height:36, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>⚙️</button>
          <button style={{ background:'rgba(30,41,59,0.6)', border:'1px solid #2D3A4F',
            borderRadius:8, width:36, height:36, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🔔</button>
          
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:34, height:34, borderRadius:10,
              background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, color:'#fff', fontWeight:700 }}>
              {user?.first_name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#F1F5F9', fontFamily:'Nunito,sans-serif' }}>
                {user?.first_name} {user?.last_name}</div>
              <div style={{ fontSize:10, color:'#64748B', fontFamily:'Nunito,sans-serif', textTransform:'capitalize' }}>
                {user?.role || 'System Admin'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}