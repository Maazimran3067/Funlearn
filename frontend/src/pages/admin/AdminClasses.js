import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllClasses, getClassDetail, getStudentDetail } from '../../services/api';
import AdminNavbar from '../../components/AdminNavbar';
import { normaliseAge, AGE_LABEL } from '../../utils/ageGroup';

const GAME_EMOJI = { alphabet:'🔤',colors:'🎨',shapes:'🔵',animals:'🐾',counting:'⭐',words:'📝',math:'➕',spelling:'✏️',memory:'🃏' };

export default function AdminClasses() {
  const [classes,        setClasses]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [selected,       setSelected]       = useState(null);
  const [classDetail,    setClassDetail]    = useState(null);
  const [detailLoading,  setDetailLoading]  = useState(false);
  const [selectedStudent,setSelectedStudent]= useState(null);
  const [studentDetail,  setStudentDetail]  = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [search,         setSearch]         = useState('');

  useEffect(() => {
    getAllClasses()
      .then(res => setClasses(res.data.classes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelectClass = async (cls) => {
    setSelected(cls); setClassDetail(null); setSelectedStudent(null); setStudentDetail(null);
    setDetailLoading(true);
    try {
      const res = await getClassDetail(cls.class_code);
      setClassDetail(res.data);
    } catch {}
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

  const filtered = classes.filter(c =>
    c.class_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.class_code?.toLowerCase().includes(search.toLowerCase()) ||
    c.teacher_name?.toLowerCase().includes(search.toLowerCase())
  );

  const scoreColor = (s) => s>=70?'#065F46':s>=40?'#92400E':'#991B1B';
  const scoreBg    = (s) => s>=70?'#D1FAE5':s>=40?'#FEF3C7':'#FEE2E2';

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#F9F5FF,#FDF2F8,#F0FDF4)' }}>
      <AdminNavbar />
      <div style={{ maxWidth:1300, margin:'0 auto', padding:'28px 20px' }}>
        <h1 style={{ fontSize:26, fontWeight:900, color:'#1F1F2E', marginBottom:20 }}>🏫 All Classes</h1>

        <input style={{ width:'100%', padding:'13px 16px', borderRadius:14, border:'2px solid #EDE9FE', fontSize:14, outline:'none', marginBottom:20, boxSizing:'border-box', fontFamily:'Nunito,sans-serif' }}
          placeholder="🔍 Search by class name, code or teacher..." value={search}
          onChange={e => setSearch(e.target.value)} />

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#6B7280' }}>Loading classes... ⏳</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:selected?'320px 1fr':'repeat(auto-fill,minmax(280px,1fr))', gap:20, alignItems:'start' }}>

            {/* Classes grid / list */}
            <div style={selected?{ display:'flex', flexDirection:'column', gap:10 }:{ display:'contents' }}>
              {filtered.length === 0 ? (
                <div style={{ background:'#fff', borderRadius:20, padding:40, textAlign:'center', color:'#9CA3AF', gridColumn:'1/-1' }}>
                  <div style={{ fontSize:48 }}>🏫</div><p>No classes found.</p>
                </div>
              ) : (
                filtered.map((cls, i) => (
                  <motion.div key={i}
                    style={{ background:'#fff', borderRadius:20, padding:'20px', cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', border:selected?.class_code===cls.class_code?'2px solid #7C3AED':'2px solid transparent', borderLeft:`4px solid #7C3AED` }}
                    initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                    whileHover={{ scale:1.02, y:-2 }} whileTap={{ scale:0.98 }}
                    onClick={() => handleSelectClass(cls)}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div style={{ fontSize:16, fontWeight:900, color:'#1F1F2E' }}>{cls.class_name}</div>
                      <div style={{ background:'#7C3AED', color:'#fff', padding:'4px 10px', borderRadius:10, fontSize:12, fontWeight:700, fontFamily:'monospace' }}>{cls.class_code}</div>
                    </div>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:8 }}>
                      <span style={{ fontSize:13, color:'#6B7280' }}>👩‍🏫 {cls.teacher_name||'Unknown teacher'}</span>
                      <span style={{ fontSize:13, color:'#6B7280' }}>👨‍🎓 {cls.student_count||0} students</span>
                    </div>
                    <div style={{ fontSize:12, color:'#7C3AED', fontWeight:700 }}>Click to view full details →</div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Class detail */}
            {selected && (
              <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}>
                <div style={{ background:'#fff', borderRadius:20, padding:'20px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <h2 style={{ fontSize:18, fontWeight:900, color:'#1F1F2E', margin:0 }}>{selected.class_name}</h2>
                    <button style={{ background:'#F3F4F6', border:'none', padding:'6px 12px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700 }}
                      onClick={() => { setSelected(null); setClassDetail(null); setSelectedStudent(null); }}>✕ Close</button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10, marginBottom:14 }}>
                    {[
                      { label:'Class Code', value:selected.class_code, color:'#7C3AED', bg:'#EDE9FE' },
                      { label:'Teacher',    value:selected.teacher_name||'—', color:'#10B981', bg:'#D1FAE5' },
                      { label:'Students',   value:classDetail?.students?.length||0, color:'#3B82F6', bg:'#DBEAFE' },
                      { label:'Created',    value:selected.created_at?new Date(selected.created_at).toLocaleDateString('en-GB'):'-', color:'#F97316', bg:'#FFEDD5' },
                    ].map((item,i)=>(
                      <div key={i} style={{ background:item.bg, borderRadius:12, padding:'12px', textAlign:'center' }}>
                        <div style={{ fontSize:14, fontWeight:900, color:item.color }}>{item.value}</div>
                        <div style={{ fontSize:11, color:'#6B7280', marginTop:2 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {detailLoading ? (
                    <div style={{ textAlign:'center', padding:20, color:'#6B7280' }}>Loading students... ⏳</div>
                  ) : (!classDetail?.students||classDetail.students.length===0) ? (
                    <div style={{ textAlign:'center', padding:20, color:'#9CA3AF' }}>
                      <div style={{ fontSize:36 }}>👨‍🎓</div><p>No students enrolled yet.</p>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:400, overflowY:'auto' }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#374151', marginBottom:4 }}>
                        👨‍🎓 {classDetail.students.length} Students Enrolled
                      </div>
                      {classDetail.students.map((student, i) => (
                        <motion.div key={i}
                          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderRadius:12, cursor:'pointer', background:selectedStudent?.user_id===student.user_id?'#EDE9FE':'#F9FAFB', border:selectedStudent?.user_id===student.user_id?'2px solid #7C3AED':'2px solid transparent' }}
                          whileHover={{ background:'#F5F3FF' }}
                          onClick={() => handleSelectStudent(student)}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ fontSize:24 }}>🎒</div>
                            <div>
                              <div style={{ fontSize:14, fontWeight:800, color:'#1F1F2E' }}>{student.first_name} {student.last_name}</div>
                              <div style={{ fontSize:12, color:'#6B7280' }}>
                                {AGE_LABEL[normaliseAge(student.age_group)]||normaliseAge(student.age_group)} • Lv {student.current_level||1} • ⭐{student.total_stars||0}
                              </div>
                            </div>
                          </div>
                          <div style={{ background:scoreBg(student.avg_score||0), color:scoreColor(student.avg_score||0), padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>
                            {student.avg_score||0}%
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Student Detail */}
                {selectedStudent && (
                  <motion.div style={{ background:'#fff', borderRadius:20, padding:'20px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}
                    initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <div style={{ fontSize:40 }}>🎒</div>
                        <div>
                          <div style={{ fontSize:16, fontWeight:900, color:'#1F1F2E' }}>{selectedStudent.first_name} {selectedStudent.last_name}</div>
                          <div style={{ fontSize:13, color:'#6B7280' }}>{AGE_LABEL[normaliseAge(selectedStudent.age_group)]} • Level {selectedStudent.current_level||1}</div>
                        </div>
                      </div>
                      <button style={{ background:'#F3F4F6', border:'none', padding:'4px 10px', borderRadius:8, cursor:'pointer', fontSize:13 }} onClick={()=>setSelectedStudent(null)}>✕</button>
                    </div>
                    {studentLoading ? (
                      <div style={{ textAlign:'center', color:'#6B7280' }}>Loading... ⏳</div>
                    ) : studentDetail ? (
                      <>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
                          {[['Games',studentDetail.total_games||0],['Avg',`${studentDetail.overall_avg||0}%`],['Badges',studentDetail.badges?.length||0],['Stars',selectedStudent.total_stars||0]].map(([l,v])=>(
                            <div key={l} style={{ background:'#F9FAFB',borderRadius:10,padding:'10px',textAlign:'center' }}>
                              <div style={{ fontSize:15,fontWeight:900,color:'#1F1F2E' }}>{v}</div>
                              <div style={{ fontSize:11,color:'#6B7280',marginTop:2 }}>{l}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize:14, fontWeight:700, color:'#374151', marginBottom:8 }}>📊 Game Performance</div>
                        {Object.entries(studentDetail.game_averages||{}).map(([game,avg])=>(
                          <div key={game} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                            <span>{GAME_EMOJI[game]||'🎮'}</span>
                            <span style={{ fontSize:12,fontWeight:600,color:'#4B5563',width:64,textTransform:'capitalize',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{game}</span>
                            <div style={{ flex:1,height:8,background:'#F3F4F6',borderRadius:10,overflow:'hidden' }}>
                              <div style={{ height:'100%',width:`${avg}%`,background:avg>=70?'#10B981':avg>=40?'#F59E0B':'#EF4444',borderRadius:10 }}/>
                            </div>
                            <span style={{ fontSize:12,fontWeight:700,color:scoreColor(avg),width:34,textAlign:'right' }}>{avg}%</span>
                          </div>
                        ))}
                      </>
                    ) : <p style={{ color:'#9CA3AF',fontSize:13 }}>Could not load details.</p>}
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}