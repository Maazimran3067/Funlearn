import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getTeacherClasses, createClass, getClassDetail, getStudentDetail, getActiveToday } from '../../services/api';
import TeacherNavbar from '../../components/TeacherNavbar';
import { normaliseAge, AGE_LABEL } from '../../utils/ageGroup';

const GAME_EMOJI = { alphabet:'🔤',colors:'🎨',shapes:'🔵',animals:'🐾',counting:'⭐',words:'📝',math:'➕',spelling:'✏️',memory:'🃏' };

export default function TeacherDashboard() {
  const { user }                              = useAuth();
  const [classes,       setClasses]           = useState([]);
  const [loading,       setLoading]           = useState(true);
  const [selectedClass, setSelectedClass]     = useState(null);
  const [classDetail,   setClassDetail]       = useState(null);
  const [detailLoading, setDetailLoading]     = useState(false);
  const [selectedStudent,setSelectedStudent]  = useState(null);
  const [studentDetail,  setStudentDetail]    = useState(null);
  const [studentLoading, setStudentLoading]   = useState(false);
  const [creating,      setCreating]          = useState(false);
  const [newClassName,  setNewClassName]      = useState('');
  const [createMsg,     setCreateMsg]         = useState('');
  const [activeToday,   setActiveToday]       = useState({});
  const [activeTodayStudents, setActiveTodayStudents] = useState({});
  const [showActiveList, setShowActiveList]   = useState(false);
  // FIXED: hover tracked by id not index
  const [hoveredStudent, setHoveredStudent]  = useState(null);

  useEffect(() => {
    getTeacherClasses()
      .then(res => {
        const cls = res.data.classes || [];
        setClasses(cls);
        cls.forEach(c => {
          getActiveToday(c.class_code)
            .then(r => {
              setActiveToday(prev => ({ ...prev, [c.class_code]: r.data.active_today }));
              // Store which students are active
              if (r.data.active_student_ids) {
                setActiveTodayStudents(prev => ({ ...prev, [c.class_code]: r.data.active_student_ids }));
              }
            })
            .catch(() => {});
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelectClass = async (cls) => {
    setSelectedClass(cls); setSelectedStudent(null); setStudentDetail(null);
    setDetailLoading(true); setShowActiveList(false);
    try {
      const res = await getClassDetail(cls.class_code);
      setClassDetail(res.data);
      // Refresh active today count
      const r = await getActiveToday(cls.class_code);
      setActiveToday(prev => ({ ...prev, [cls.class_code]: r.data.active_today }));
      if (r.data.active_student_ids) {
        setActiveTodayStudents(prev => ({ ...prev, [cls.class_code]: r.data.active_student_ids }));
      }
    } catch { setClassDetail(null); }
    finally { setDetailLoading(false); }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student); setStudentDetail(null); setStudentLoading(true);
    try {
      const res = await getStudentDetail(student.user_id);
      setStudentDetail(res.data);
    } catch {}
    finally { setStudentLoading(false); }
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    setCreating(true);
    try {
      const res = await createClass({ class_name: newClassName });
      const newCls = res.data.class;
      setClasses(prev => [...prev, newCls]);
      setCreateMsg(`✅ Class created! Code: ${newCls.class_code}`);
      setNewClassName('');
      setTimeout(() => setCreateMsg(''), 8000);
    } catch { setCreateMsg('❌ Could not create class.'); }
    finally { setCreating(false); }
  };

  const scoreColor = (s) => s>=70?'#065F46':s>=40?'#92400E':'#991B1B';
  const scoreBg    = (s) => s>=70?'#D1FAE5':s>=40?'#FEF3C7':'#FEE2E2';

  const activeIds = selectedClass ? (activeTodayStudents[selectedClass.class_code] || []) : [];

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#F0FDF4,#ECFDF5,#DBEAFE)' }}>
      <TeacherNavbar />
      <div style={{ maxWidth:1300, margin:'0 auto', padding:'28px 20px' }}>

        {/* Welcome */}
        <motion.div style={{ background:'linear-gradient(135deg,#10B981,#3B82F6)', borderRadius:24, padding:'24px 32px', color:'#fff', marginBottom:24, boxShadow:'0 8px 32px rgba(16,185,129,0.25)' }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontSize:26, fontWeight:900, margin:0 }}>Welcome, {user?.first_name}! 👩‍🏫</h1>
              <p style={{ fontSize:14, opacity:0.9, margin:'4px 0 0' }}>
                {classes.length} class{classes.length!==1?'es':''} — Click a class to view students and progress.
              </p>
            </div>
            <div style={{ fontSize:48 }}>🏫</div>
          </div>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:selectedClass?'300px 1fr':'1fr', gap:20, alignItems:'start' }}>

          {/* LEFT — Classes */}
          <div>
            <motion.div style={{ background:'#fff', borderRadius:20, padding:'20px', marginBottom:14, boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}
              initial={{ opacity:0 }} animate={{ opacity:1 }}>
              <h3 style={{ fontSize:16, fontWeight:900, color:'#1F1F2E', marginBottom:10 }}>➕ Create New Class</h3>
              <input style={{ width:'100%', padding:'11px 14px', borderRadius:12, border:'2px solid #D1FAE5', fontSize:14, outline:'none', boxSizing:'border-box', fontFamily:'Nunito,sans-serif', marginBottom:10 }}
                placeholder="Class name e.g. Morning Batch" value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                onKeyDown={e => e.key==='Enter' && handleCreateClass()} />
              <motion.button style={{ width:'100%', background:'linear-gradient(135deg,#10B981,#3B82F6)', color:'#fff', border:'none', padding:'12px', borderRadius:12, fontSize:14, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif', opacity:newClassName.trim()?1:0.5 }}
                whileHover={newClassName.trim()?{scale:1.03}:{}} onClick={handleCreateClass} disabled={creating||!newClassName.trim()}>
                {creating?'Creating...':'Create Class 🚀'}
              </motion.button>
              {createMsg&&<div style={{ marginTop:8, fontSize:13, fontWeight:700, color:createMsg.startsWith('✅')?'#065F46':'#991B1B' }}>{createMsg}</div>}
            </motion.div>

            {loading ? (
              <div style={{ textAlign:'center', padding:40, color:'#6B7280' }}>Loading... ⏳</div>
            ) : classes.length===0 ? (
              <div style={{ background:'#fff', borderRadius:20, padding:'28px', textAlign:'center', color:'#9CA3AF' }}>
                <div style={{ fontSize:48 }}>🏫</div><p>No classes yet. Create one above!</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {classes.map((cls, i) => (
                  <motion.div key={i}
                    style={{ background:'#fff', borderRadius:16, padding:'16px 18px', cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.05)', border:selectedClass?.class_code===cls.class_code?'2px solid #10B981':'2px solid transparent' }}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                    whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    onClick={() => handleSelectClass(cls)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <div style={{ fontSize:15, fontWeight:900, color:'#1F1F2E' }}>{cls.class_name}</div>
                      <div style={{ background:'#10B981', color:'#fff', padding:'4px 10px', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:'monospace' }}>{cls.class_code}</div>
                    </div>
                    <div style={{ display:'flex', gap:12 }}>
                      <span style={{ fontSize:12, color:'#6B7280' }}>👨‍🎓 {cls.student_count||0} students</span>
                      <span style={{ fontSize:12, color:'#10B981', fontWeight:600 }}>🟢 {activeToday[cls.class_code]||0} active today</span>
                    </div>
                    <div style={{ marginTop:4, fontSize:11, color:'#10B981', fontWeight:700 }}>Click to view →</div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Class detail */}
          {selectedClass && (
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}>
              {detailLoading ? (
                <div style={{ background:'#fff', borderRadius:20, padding:40, textAlign:'center', color:'#6B7280' }}>Loading students... ⏳</div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:selectedStudent?'1fr 1.1fr':'1fr', gap:16 }}>

                  {/* Students list */}
                  <div>
                    <div style={{ background:'#fff', borderRadius:20, padding:'20px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                        <h2 style={{ fontSize:17, fontWeight:900, color:'#1F1F2E', margin:0 }}>{selectedClass.class_name}</h2>
                        <button style={{ background:'#F3F4F6', border:'none', padding:'6px 12px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700 }}
                          onClick={() => { setSelectedClass(null); setSelectedStudent(null); }}>✕</button>
                      </div>
                      <div style={{ background:'#D1FAE5', borderRadius:12, padding:'10px 16px', marginBottom:14, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'#065F46' }}>🔑 <strong style={{ fontFamily:'monospace' }}>{selectedClass.class_code}</strong></span>
                        <span style={{ fontSize:13, fontWeight:700, color:'#065F46' }}>👨‍🎓 {classDetail?.students?.length||0} students</span>
                        {/* FIXED: clickable active today count */}
                        <span
                          style={{ fontSize:13, fontWeight:700, color:'#10B981', cursor:'pointer', textDecoration:'underline', textDecorationStyle:'dashed' }}
                          onClick={() => setShowActiveList(s => !s)}>
                          🟢 {activeToday[selectedClass.class_code]||0} active today {showActiveList?'▲':'▼'}
                        </span>
                      </div>

                      {/* Active today students list */}
                      <AnimatePresence>
                        {showActiveList && (
                          <motion.div style={{ background:'#F0FDF4', borderRadius:12, padding:'12px', marginBottom:12, border:'1px solid #A7F3D0' }}
                            initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:'#065F46', marginBottom:8 }}>🟢 Students active today:</div>
                            {activeIds.length===0 ? (
                              <div style={{ fontSize:13, color:'#6B7280' }}>No students have played today yet.</div>
                            ) : (
                              classDetail?.students?.filter(s => activeIds.includes(s.user_id)).map((s, i) => (
                                <div key={i} style={{ fontSize:13, color:'#065F46', fontWeight:600, padding:'3px 0' }}>
                                  ✅ {s.first_name} {s.last_name}
                                </div>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {(!classDetail?.students||classDetail.students.length===0) ? (
                        <div style={{ textAlign:'center', padding:'24px', color:'#9CA3AF' }}>
                          <div style={{ fontSize:40 }}>👨‍🎓</div>
                          <p>No students yet. Share code <strong>{selectedClass.class_code}</strong>!</p>
                        </div>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:500, overflowY:'auto' }}>
                          {classDetail.students.map((student) => {
                            const avg      = student.avg_score || 0;
                            const isActive = activeIds.includes(student.user_id);
                            // FIXED: hover by user_id, not index
                            const isHovered = hoveredStudent === student.user_id;
                            const isSelected = selectedStudent?.user_id === student.user_id;
                            return (
                              <div key={student.user_id}
                                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:12, cursor:'pointer',
                                  background:isSelected?'#D1FAE5':isHovered?'#F0FDF4':'#F9FAFB',
                                  border:isSelected?'2px solid #10B981':'2px solid transparent',
                                  transition:'background 0.15s' }}
                                onMouseEnter={() => setHoveredStudent(student.user_id)}
                                onMouseLeave={() => setHoveredStudent(null)}
                                onClick={() => handleSelectStudent(student)}>
                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                  <div style={{ fontSize:26 }}>🎒</div>
                                  <div>
                                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                      <div style={{ fontSize:14, fontWeight:800, color:'#1F1F2E' }}>{student.first_name} {student.last_name}</div>
                                      {isActive&&<span style={{ fontSize:10, background:'#D1FAE5', color:'#065F46', padding:'2px 6px', borderRadius:10, fontWeight:700 }}>Active Today</span>}
                                    </div>
                                    {/* FIXED: normalised age group */}
                                    <div style={{ fontSize:12, color:'#6B7280' }}>Age {normaliseAge(student.age_group)} • Lv {student.current_level||1} • ⭐{student.total_stars||0}</div>
                                  </div>
                                </div>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <div style={{ background:scoreBg(avg), color:scoreColor(avg), padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>{avg}%</div>
                                  {avg<40&&<span title="Needs attention">⚠️</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Student detail */}
                  {selectedStudent && (
                    <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}>
                      <div style={{ background:'#fff', borderRadius:20, padding:'20px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', position:'sticky', top:80, maxHeight:'85vh', overflowY:'auto' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <div style={{ fontSize:44 }}>🎒</div>
                            <div>
                              <div style={{ fontSize:17, fontWeight:900, color:'#1F1F2E' }}>{selectedStudent.first_name} {selectedStudent.last_name}</div>
                              {/* FIXED: normalised age group */}
                              <div style={{ fontSize:13, color:'#6B7280' }}>{AGE_LABEL[normaliseAge(selectedStudent.age_group)]} • Level {selectedStudent.current_level||1}</div>
                              <div style={{ fontSize:13, color:'#F59E0B', fontWeight:700 }}>⭐ {selectedStudent.total_stars||0} stars</div>
                            </div>
                          </div>
                          <button style={{ background:'#F3F4F6', border:'none', padding:'4px 10px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700 }}
                            onClick={() => setSelectedStudent(null)}>✕</button>
                        </div>

                        {studentLoading ? (
                          <div style={{ textAlign:'center', padding:20, color:'#6B7280' }}>Loading details... ⏳</div>
                        ) : studentDetail ? (
                          <>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                              {[
                                ['Games',  studentDetail.total_games||0],
                                ['Avg',    `${studentDetail.overall_avg||0}%`],
                                ['Badges', studentDetail.badges?.length||0],
                                ['Stars',  selectedStudent.total_stars||0],
                              ].map(([label,val])=>(
                                <div key={label} style={{ background:'#F0FDF4', borderRadius:10, padding:'10px', textAlign:'center' }}>
                                  <div style={{ fontSize:15, fontWeight:900, color:'#065F46' }}>{val}</div>
                                  <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{label}</div>
                                </div>
                              ))}
                            </div>

                            {studentDetail.badges?.length>0&&(
                              <div style={{ marginBottom:14 }}>
                                <div style={{ fontSize:14, fontWeight:700, color:'#374151', marginBottom:8 }}>🏆 Badges Earned</div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                                  {studentDetail.badges.map((b,i)=>(
                                    <div key={i} style={{ textAlign:'center' }} title={b.description||b.badge_name}>
                                      <div style={{ fontSize:28 }}>{b.badge_icon||'🏅'}</div>
                                      <div style={{ fontSize:10, color:'#6B7280', maxWidth:52, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.badge_name}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div style={{ fontSize:14, fontWeight:700, color:'#374151', marginBottom:8 }}>📊 Game Performance</div>
                            {Object.keys(studentDetail.game_averages||{}).length===0 ? (
                              <p style={{ color:'#9CA3AF', fontSize:13 }}>No games played yet.</p>
                            ) : (
                              Object.entries(studentDetail.game_averages).map(([game,avg])=>(
                                <div key={game} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
                                  <span style={{ fontSize:14 }}>{GAME_EMOJI[game]||'🎮'}</span>
                                  <span style={{ fontSize:12, fontWeight:600, color:'#4B5563', width:68, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', textTransform:'capitalize' }}>{game}</span>
                                  <div style={{ flex:1, height:8, background:'#F3F4F6', borderRadius:10, overflow:'hidden' }}>
                                    <motion.div style={{ height:'100%', background:avg>=70?'#10B981':avg>=40?'#F59E0B':'#EF4444', borderRadius:10 }}
                                      initial={{ width:0 }} animate={{ width:`${avg}%` }} transition={{ duration:0.6 }} />
                                  </div>
                                  <span style={{ fontSize:12, fontWeight:700, color:scoreColor(avg), width:34, textAlign:'right' }}>{avg}%</span>
                                </div>
                              ))
                            )}

                            {studentDetail.recent_scores?.length>0&&(
                              <div style={{ marginTop:14 }}>
                                <div style={{ fontSize:14, fontWeight:700, color:'#374151', marginBottom:8 }}>🕐 Recent Games</div>
                                {studentDetail.recent_scores.slice(0,5).map((sc,i)=>(
                                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid #F3F4F6' }}>
                                    <span style={{ fontSize:16 }}>{GAME_EMOJI[sc.game_id]||'🎮'}</span>
                                    <div style={{ flex:1 }}>
                                      <div style={{ fontSize:13, fontWeight:700, color:'#1F1F2E', textTransform:'capitalize' }}>{sc.game_id}</div>
                                      <div style={{ fontSize:11, color:'#9CA3AF' }}>{new Date(sc.played_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>
                                    </div>
                                    <div style={{ background:scoreBg(sc.percentage), color:scoreColor(sc.percentage), padding:'2px 8px', borderRadius:12, fontSize:12, fontWeight:700 }}>{sc.percentage}%</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {(studentDetail.overall_avg||0)<40&&(
                              <div style={{ background:'#FEE2E2', borderRadius:12, padding:'10px 14px', marginTop:14, fontSize:13, fontWeight:700, color:'#991B1B' }}>
                                ⚠️ This student is struggling! Average below 40%. Consider extra support.
                              </div>
                            )}
                          </>
                        ) : (
                          <p style={{ color:'#9CA3AF', fontSize:13 }}>Could not load student details.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}