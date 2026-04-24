import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { getAllUsers, toggleUser, getStudentDetail } from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';

const ROLE_COLOR = { student:'#7C3AED', teacher:'#10B981', parent:'#F97316', admin:'#EF4444' };
const ROLE_BG    = { student:'#EDE9FE', teacher:'#D1FAE5', parent:'#FFEDD5', admin:'#FEE2E2' };
const ROLE_EMOJI = { student:'🎒', teacher:'👩‍🏫', parent:'👨‍👩‍👧', admin:'🔧' };

export default function AdminUsers() {
  const location              = useLocation();
  const [users,    setUsers]  = useState([]);
  const [loading,  setLoading]= useState(true);
  const [search,   setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(location.state?.filter || 'all');
  const [selected, setSelected] = useState(null);
  const [detail,   setDetail] = useState(null);

  useEffect(() => {
    getAllUsers()
      .then(res => setUsers(res.data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // If navigated with filter state, apply it
  useEffect(() => {
    if (location.state?.filter) setRoleFilter(location.state.filter);
  }, [location.state]);

  const loadDetail = async (user) => {
    setSelected(user);
    setDetail(null);
    if (user.role === 'student') {
      try {
        const res = await getStudentDetail(String(user.id));
        setDetail(res.data);
      } catch {}
    }
  };

  const handleToggle = async (userId, currentStatus) => {
    try {
      await toggleUser({ user_id: userId, active: !currentStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));
      if (selected?.id === userId) setSelected(prev => ({ ...prev, is_active: !currentStatus }));
    } catch {}
  };

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'all'
      ? true
      : roleFilter === 'admins'   ? u.role === 'admin'
      : roleFilter === 'students' ? u.role === 'student'
      : roleFilter === 'teachers' ? u.role === 'teacher'
      : roleFilter === 'parents'  ? u.role === 'parent'
      : true;
    const matchSearch = search === '' ||
      `${u.first_name} ${u.last_name} ${u.email} ${u.username}`.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const roleCounts = {
    all:      users.length,
    students: users.filter(u=>u.role==='student').length,
    teachers: users.filter(u=>u.role==='teacher').length,
    parents:  users.filter(u=>u.role==='parent').length,
    admins:   users.filter(u=>u.role==='admin').length,
  };

  const filterBtns = [
    { key:'all',      label:'All',      emoji:'👥' },
    { key:'students', label:'Students', emoji:'🎒' },
    { key:'teachers', label:'Teachers', emoji:'👩‍🏫' },
    { key:'parents',  label:'Parents',  emoji:'👨‍👩‍👧' },
    { key:'admins',   label:'Admins',   emoji:'🔧' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#F9F5FF,#FDF2F8,#F0FDF4)' }}>
      <AdminNavbar />
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 20px' }}>
        <h1 style={{ fontSize:26, fontWeight:900, color:'#1F1F2E', marginBottom:20 }}>👥 All Users</h1>

        {/* Search */}
        <input style={{ width:'100%', padding:'13px 16px', borderRadius:14, border:'2px solid #EDE9FE', fontSize:14, outline:'none', marginBottom:14, boxSizing:'border-box', fontFamily:'Nunito,sans-serif' }}
          placeholder="🔍 Search by name, email or username..."
          value={search} onChange={e => setSearch(e.target.value)} />

        {/* Role filter — ONE LINE */}
        <div style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
          {filterBtns.map(btn => (
            <motion.button key={btn.key}
              style={{ padding:'8px 16px', borderRadius:20, border:'none', cursor:'pointer', fontFamily:'Nunito,sans-serif', fontWeight:700, fontSize:13, whiteSpace:'nowrap', flexShrink:0,
                background:roleFilter===btn.key?'linear-gradient(135deg,#7C3AED,#EC4899)':'#fff',
                color:roleFilter===btn.key?'#fff':'#4B5563',
                boxShadow:roleFilter===btn.key?'0 4px 12px rgba(124,58,237,0.3)':'0 2px 8px rgba(0,0,0,0.06)' }}
              whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              onClick={() => setRoleFilter(btn.key)}>
              {btn.emoji} {btn.label} <span style={{ background:'rgba(255,255,255,0.25)', borderRadius:10, padding:'1px 7px', marginLeft:4 }}>{roleCounts[btn.key]}</span>
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#6B7280' }}>Loading users... ⏳</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:selected?'1.2fr 1fr':'1fr', gap:20, alignItems:'start' }}>

            {/* Users List */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ fontSize:13, color:'#6B7280', marginBottom:4 }}>
                Showing {filtered.length} of {users.length} users
              </div>
              {filtered.length === 0 ? (
                <div style={{ textAlign:'center', padding:40, color:'#9CA3AF', background:'#fff', borderRadius:20 }}>
                  <div style={{ fontSize:40 }}>👤</div>
                  <p>No users found</p>
                </div>
              ) : (
                filtered.map((u, i) => (
                  <motion.div key={u.id}
                    style={{ background:'#fff', borderRadius:16, padding:'16px 20px', cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.05)',
                      border: selected?.id===u.id ? `2px solid ${ROLE_COLOR[u.role]}` : '2px solid transparent',
                      opacity: u.is_active ? 1 : 0.6 }}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:u.is_active?1:0.6, y:0 }} transition={{ delay:i*0.03 }}
                    whileHover={{ scale:1.01 }}
                    onClick={() => loadDetail(u)}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
                        <div style={{ width:44, height:44, borderRadius:'50%', background:ROLE_BG[u.role], display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                          {ROLE_EMOJI[u.role]}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:15, fontWeight:800, color:'#1F1F2E', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                            {u.first_name} {u.last_name}
                          </div>
                          <div style={{ fontSize:12, color:'#6B7280', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.email}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                        <span style={{ background:ROLE_BG[u.role], color:ROLE_COLOR[u.role], padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                          {u.role}
                        </span>
                        <span style={{ background:u.is_active?'#D1FAE5':'#FEE2E2', color:u.is_active?'#065F46':'#991B1B', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                          {u.is_active?'Active':'Inactive'}
                        </span>
                        <motion.button
                          style={{ background:u.is_active?'#FEE2E2':'#D1FAE5', color:u.is_active?'#EF4444':'#10B981', border:'none', padding:'6px 12px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}
                          whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={e => { e.stopPropagation(); handleToggle(u.id, u.is_active); }}>
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Detail Panel */}
            {selected && (
              <motion.div style={{ background:'#fff', borderRadius:24, padding:'24px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', position:'sticky', top:80 }}
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:56, height:56, borderRadius:'50%', background:ROLE_BG[selected.role], display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>
                      {ROLE_EMOJI[selected.role]}
                    </div>
                    <div>
                      <div style={{ fontSize:18, fontWeight:900, color:'#1F1F2E' }}>{selected.first_name} {selected.last_name}</div>
                      <div style={{ fontSize:13, color:'#6B7280' }}>{selected.email}</div>
                      <div style={{ fontSize:12, color:ROLE_COLOR[selected.role], fontWeight:700, marginTop:2 }}>@{selected.username} · {selected.role}</div>
                    </div>
                  </div>
                  <button style={{ background:'#F3F4F6', border:'none', padding:'6px 12px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700 }}
                    onClick={() => setSelected(null)}>✕</button>
                </div>

                <div style={{ background:selected.is_active?'#D1FAE5':'#FEE2E2', borderRadius:12, padding:'10px 16px', marginBottom:16, fontSize:13, fontWeight:700, color:selected.is_active?'#065F46':'#991B1B' }}>
                  {selected.is_active ? '✅ Account Active — can log in' : '❌ Account Deactivated — cannot log in'}
                </div>

                {selected.role === 'student' && detail && (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                      {[
                        ['Age Group', detail.profile?.age_group],
                        ['Level',     `Level ${detail.profile?.current_level}`],
                        ['Stars',     `⭐ ${detail.profile?.total_stars}`],
                        ['Games',     detail.scores?.length || 0],
                      ].map(([label, val]) => (
                        <div key={label} style={{ background:'#F9FAFB', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                          <div style={{ fontSize:13, fontWeight:800, color:'#1F1F2E' }}>{val}</div>
                          <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#374151', marginBottom:8 }}>📊 Game Performance</div>
                    {Object.entries(detail.game_averages || {}).map(([game, avg]) => (
                      <div key={game} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'#4B5563', width:70, textTransform:'capitalize' }}>{game}</span>
                        <div style={{ flex:1, height:8, background:'#F3F4F6', borderRadius:10, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${avg}%`, background:avg>=70?'#10B981':avg>=40?'#F59E0B':'#EF4444', borderRadius:10 }} />
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:avg>=70?'#10B981':avg>=40?'#F59E0B':'#EF4444', width:36, textAlign:'right' }}>{avg}%</span>
                      </div>
                    ))}
                  </>
                )}

                {selected.role === 'teacher' && (
                  <div style={{ background:'#D1FAE5', borderRadius:12, padding:'12px 16px', fontSize:13, color:'#065F46', fontWeight:600 }}>
                    👩‍🏫 Teacher at {selected.profile?.school_name || 'School not set'}<br />
                    Go to Classes page to see this teacher's classes and students.
                  </div>
                )}

                {selected.role === 'parent' && (
                  <div style={{ background:'#FFEDD5', borderRadius:12, padding:'12px 16px', fontSize:13, color:'#9A3412', fontWeight:600 }}>
                    👨‍👩‍👧 Parent account<br />
                    Children: {selected.profile?.children?.join(', ') || 'No children linked'}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}