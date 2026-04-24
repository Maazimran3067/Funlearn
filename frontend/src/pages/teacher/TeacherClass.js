import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getClassDetail, getStudentDetail } from '../../services/api';
import TeacherNavbar from '../../components/TeacherNavbar';

export default function TeacherClass() {
  const { class_code }              = useParams();
  const navigate                    = useNavigate();
  const [classData, setClassData]   = useState(null);
  const [selected,  setSelected]    = useState(null);
  const [detail,    setDetail]      = useState(null);
  const [loading,   setLoading]     = useState(true);
  const [filter,    setFilter]      = useState('all');

  useEffect(() => {
    if (class_code) {
      getClassDetail(class_code)
        .then(res => setClassData(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [class_code]);

  const loadStudentDetail = async (studentId) => {
    setSelected(studentId);
    setDetail(null);
    try {
      const res = await getStudentDetail(studentId);
      setDetail(res.data);
    } catch {}
  };

  const students = classData?.students || [];

  const filtered = students.filter(s => {
    if (filter === 'struggling') return s.avg_score < 40 && s.games_played > 0;
    if (filter === 'top')        return s.avg_score >= 70;
    return true;
  });

  const getScoreColor = (score) => {
    if (score >= 70) return { bg: '#D1FAE5', color: '#065F46' };
    if (score >= 40) return { bg: '#FEF3C7', color: '#92400E' };
    return           { bg: '#FEE2E2', color: '#991B1B' };
  };

  return (
    <div style={styles.page}>
      <TeacherNavbar />
      <div style={styles.content}>

        {/* Back button + header */}
        <div style={styles.header}>
          <div>
            <motion.button
              style={styles.backBtn}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/teacher/dashboard')}
            >
              ← Back to Dashboard
            </motion.button>
            <h1 style={styles.pageTitle}>
              👨‍🎓 {classData?.class_name || 'Class'}
            </h1>
            <p style={styles.pageSub}>
              Code: <strong>{classData?.class_code}</strong> •{' '}
              {classData?.school_name} •{' '}
              {students.length} students
            </p>
          </div>
          <div style={styles.filterRow}>
            {[
              { id: 'all',        label: 'All Students'    },
              { id: 'top',        label: '⭐ Top'           },
              { id: 'struggling', label: '⚠️ Need Help'    },
            ].map(f => (
              <motion.button
                key={f.id}
                style={{
                  ...styles.filterBtn,
                  background: filter === f.id ? '#10B981' : '#F3F4F6',
                  color:      filter === f.id ? '#fff'    : '#4B5563',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </motion.button>
            ))}
          </div>
        </div>

        <div style={styles.mainRow}>

          {/* Students List */}
          <div style={styles.studentsList}>
            {loading ? (
              <div style={styles.loading}>Loading... ⏳</div>
            ) : filtered.length === 0 ? (
              <div style={styles.empty}>
                <div style={{ fontSize: 48 }}>📋</div>
                <p>No students found!</p>
              </div>
            ) : (
              filtered.map((s, i) => {
                const sc = getScoreColor(s.avg_score);
                return (
                  <motion.div
                    key={i}
                    style={{
                      ...styles.studentCard,
                      border: selected === s.user_id
                        ? '2px solid #10B981'
                        : '2px solid transparent',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => loadStudentDetail(s.user_id)}
                  >
                    <div style={styles.cardTop}>
                      <div style={styles.sAvatar}>{s.avatar || '🎒'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={styles.sName}>
                          {s.first_name} {s.last_name}
                        </div>
                        <div style={styles.sInfo}>
                          Age group: {s.age_group}
                        </div>
                      </div>
                      <div style={{
                        ...styles.avgPill,
                        background: sc.bg, color: sc.color,
                      }}>
                        {s.avg_score}%
                      </div>
                    </div>
                    <div style={styles.cardStats}>
                      <span>⭐ {s.total_stars}</span>
                      <span>🎮 {s.games_played}</span>
                      <span>🏆 {s.badge_count}</span>
                      <span>Lv {s.current_level}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Student Detail Panel */}
          <div style={styles.detailPanel}>
            {!selected ? (
              <div style={styles.selectHint}>
                <div style={{ fontSize: 60 }}>👆</div>
                <p>Click a student to see their full report</p>
              </div>
            ) : !detail ? (
              <div style={styles.selectHint}>Loading... ⏳</div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div style={styles.detailHeader}>
                  <div style={{ fontSize: 52 }}>
                    {detail.profile?.avatar || '🎒'}
                  </div>
                  <div>
                    <div style={styles.detailName}>
                      {detail.profile?.first_name} {detail.profile?.last_name}
                    </div>
                    <div style={styles.detailSub}>
                      Age group: {detail.profile?.age_group} •
                      Level {detail.profile?.current_level}
                    </div>
                  </div>
                </div>

                <div style={styles.quickStats}>
                  {[
                    { label: 'Total Stars',  value: `⭐ ${detail.profile?.total_stars || 0}` },
                    { label: 'Games Played', value: `🎮 ${detail.total_games}`               },
                    { label: 'Overall Avg',  value: `📊 ${detail.overall_avg}%`              },
                    { label: 'Badges',       value: `🏆 ${detail.badges?.length || 0}`       },
                  ].map((s, i) => (
                    <div key={i} style={styles.quickStat}>
                      <div style={styles.qValue}>{s.value}</div>
                      <div style={styles.qLabel}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <div style={styles.section}>
                  <div style={styles.sectionTitle}>📊 Game Performance</div>
                  {Object.keys(detail.game_averages || {}).length === 0 ? (
                    <p style={{ color: '#9CA3AF', fontSize: 13 }}>No games played yet</p>
                  ) : (
                    Object.entries(detail.game_averages).map(([game, avg]) => {
                      const sc = getScoreColor(avg);
                      return (
                        <div key={game} style={styles.gameAvgRow}>
                          <span style={styles.gameAvgName}>
                            {game.charAt(0).toUpperCase() + game.slice(1)}
                          </span>
                          <div style={styles.gameAvgBar}>
                            <div style={{
                              ...styles.gameAvgFill,
                              width: `${avg}%`,
                              background: sc.color,
                            }} />
                          </div>
                          <span style={{ ...styles.gameAvgPct, color: sc.color }}>
                            {avg}%
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={styles.section}>
                  <div style={styles.sectionTitle}>🕐 Recent Games</div>
                  {detail.scores?.slice(0, 5).map((sc, i) => (
                    <div key={i} style={styles.recentRow}>
                      <span style={styles.recentGame}>{sc.game_id}</span>
                      <span style={{
                        color: getScoreColor(sc.percentage).color,
                        fontWeight: 700, fontSize: 14,
                      }}>
                        {sc.percentage}%
                      </span>
                      <span style={styles.recentDate}>
                        {new Date(sc.played_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>

                {detail.badges?.length > 0 && (
                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>🏆 Badges</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {detail.badges.map((b, i) => (
                        <div key={i} style={styles.badgePill}>
                          {b.badge_icon} {b.badge_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:    { minHeight: '100vh', background: '#F0FDF4' },
  content: { maxWidth: 1200, margin: '0 auto', padding: '28px 20px' },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 24,
    flexWrap: 'wrap', gap: 16,
  },
  backBtn: {
    background: '#D1FAE5', color: '#065F46',
    border: 'none', padding: '8px 16px',
    borderRadius: 10, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', marginBottom: 8,
    fontFamily: 'Nunito, sans-serif',
  },
  pageTitle: { fontSize: 24, fontWeight: 900, color: '#1F1F2E', margin: '0 0 4px' },
  pageSub:   { fontSize: 14, color: '#6B7280', margin: 0 },
  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterBtn: {
    padding: '8px 16px', borderRadius: 12, border: 'none',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'Nunito, sans-serif',
  },
  mainRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.4fr',
    gap: 20, alignItems: 'start',
  },
  studentsList: { display: 'flex', flexDirection: 'column', gap: 10 },
  loading:      { textAlign: 'center', padding: 40, color: '#6B7280' },
  empty:        { textAlign: 'center', padding: 40, color: '#9CA3AF' },
  studentCard: {
    background: '#fff', borderRadius: 16, padding: '14px 16px',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    transition: 'border 0.2s',
  },
  cardTop:  { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  sAvatar:  { fontSize: 28 },
  sName:    { fontSize: 14, fontWeight: 800, color: '#1F1F2E' },
  sInfo:    { fontSize: 12, color: '#6B7280', marginTop: 2 },
  avgPill: { padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700 },
  cardStats: { display: 'flex', gap: 14, fontSize: 12, color: '#6B7280', fontWeight: 600 },
  detailPanel: {
    background: '#fff', borderRadius: 24, padding: '24px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    minHeight: 400, position: 'sticky', top: 80,
  },
  selectHint: { textAlign: 'center', padding: '60px 20px', color: '#9CA3AF', fontSize: 15 },
  detailHeader: {
    display: 'flex', alignItems: 'center', gap: 16,
    marginBottom: 20, paddingBottom: 16,
    borderBottom: '2px solid #F3F4F6',
  },
  detailName: { fontSize: 20, fontWeight: 900, color: '#1F1F2E' },
  detailSub:  { fontSize: 13, color: '#6B7280', marginTop: 4 },
  quickStats: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10, marginBottom: 20,
  },
  quickStat: { background: '#F9FAFB', borderRadius: 12, padding: '12px 8px', textAlign: 'center' },
  qValue:    { fontSize: 14, fontWeight: 800, color: '#1F1F2E' },
  qLabel:    { fontSize: 11, color: '#6B7280', marginTop: 2 },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 800, color: '#1F1F2E', marginBottom: 10 },
  gameAvgRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  gameAvgName: { fontSize: 13, fontWeight: 600, width: 80, color: '#4B5563' },
  gameAvgBar: { flex: 1, height: 8, background: '#F3F4F6', borderRadius: 10, overflow: 'hidden' },
  gameAvgFill:  { height: '100%', borderRadius: 10, transition: 'width 0.5s' },
  gameAvgPct:   { fontSize: 13, fontWeight: 700, width: 40, textAlign: 'right' },
  recentRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '7px 0',
    borderBottom: '1px solid #F3F4F6', fontSize: 13,
  },
  recentGame: { color: '#4B5563', fontWeight: 600, textTransform: 'capitalize' },
  recentDate: { color: '#9CA3AF', fontSize: 12 },
  badgePill: {
    background: '#FEF3C7', color: '#92400E',
    padding: '4px 10px', borderRadius: 20,
    fontSize: 12, fontWeight: 700,
  },
};