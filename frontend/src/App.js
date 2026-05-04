import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';


// Dashboards
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ParentDashboard  from './pages/parent/ParentDashboard';
import AdminDashboard   from './pages/admin/AdminDashboard';

// Age 3-6 Games
import ColorsGame        from './pages/games/ColorExplorer';
import ShapesGame        from './pages/games/ShapeSorter';
import AlphabetGame      from './pages/games/AlphabetGame';
import NumberBuddyGame   from './pages/games/NumberBuddyGame';
import AnimalSoundsGame  from './pages/games/AnimalSoundsGame';

// Age 6-9 Games
import AnimalsGame       from './pages/games/AnimalSounds';
import CountingGame      from './pages/games/CountingStars';
import WordsGame         from './pages/games/WordBuilder';
import SentenceMakerGame from './pages/games/SentenceMakerGame';
import PatternQuestGame  from './pages/games/PatternQuestGame';

// Age 9-12 Games
import MathGame          from './pages/games/MathChallenge';
import SpellingGame      from './pages/games/SpellItRight';
import MemoryGame        from './pages/games/MemoryFlip';
import LogicGridGame     from './pages/games/LogicGridGame';
import SpeedEquationsGame from './pages/games/SpeedEquationsGame';

// ── ROUTE GUARDS ──────────────────────────────────────────────────
function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div style={{ fontSize: 40 }}>🎓</div>
      <p>Loading FunLearn AI...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-screen">
      <div style={{ fontSize: 40 }}>🎓</div>
      <p>Loading...</p>
    </div>
  );
  if (user) {
    const paths = {
      student: '/student/dashboard',
      teacher: '/teacher/dashboard',
      parent:  '/parent/dashboard',
      admin:   '/admin/dashboard',
    };
    return <Navigate to={paths[user.role] || '/student/dashboard'} replace />;
  }
  return children;
}

// ── APP ───────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* Public */}
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />

          {/* Student */}
          <Route path="/student/dashboard" element={
            <PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />

          {/* Teacher */}
          <Route path="/teacher/dashboard" element={
            <PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>} />

          {/* Parent */}
          <Route path="/parent/dashboard" element={
            <PrivateRoute role="parent"><ParentDashboard /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />

          {/* ── Age 3-6 Games ── */}
          <Route path="/games/colors"   element={<PrivateRoute><ColorsGame /></PrivateRoute>} />
          <Route path="/games/shapes"   element={<PrivateRoute><ShapesGame /></PrivateRoute>} />
          <Route path="/games/alphabet" element={<PrivateRoute><AlphabetGame /></PrivateRoute>} />
          <Route path="/games/numbers"  element={<PrivateRoute><NumberBuddyGame /></PrivateRoute>} />
          <Route path="/games/animalsounds" element={<PrivateRoute><AnimalSoundsGame /></PrivateRoute>} />

          {/* ── Age 6-9 Games ── */}
          <Route path="/games/animals"   element={<PrivateRoute><AnimalsGame /></PrivateRoute>} />
          <Route path="/games/counting"  element={<PrivateRoute><CountingGame /></PrivateRoute>} />
          <Route path="/games/words"     element={<PrivateRoute><WordsGame /></PrivateRoute>} />
          <Route path="/games/sentences" element={<PrivateRoute><SentenceMakerGame /></PrivateRoute>} />
          <Route path="/games/patterns"  element={<PrivateRoute><PatternQuestGame /></PrivateRoute>} />

          {/* ── Age 9-12 Games ── */}
          <Route path="/games/math"      element={<PrivateRoute><MathGame /></PrivateRoute>} />
          <Route path="/games/spelling"  element={<PrivateRoute><SpellingGame /></PrivateRoute>} />
          <Route path="/games/memory"    element={<PrivateRoute><MemoryGame /></PrivateRoute>} />
          <Route path="/games/logicgrid" element={<PrivateRoute><LogicGridGame /></PrivateRoute>} />
          <Route path="/games/speedeq"   element={<PrivateRoute><SpeedEquationsGame /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}