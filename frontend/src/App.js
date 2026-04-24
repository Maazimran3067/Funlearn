import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';


import ColorExplorer  from './pages/games/ColorExplorer';
import ShapeSorter    from './pages/games/ShapeSorter';
import AnimalSounds   from './pages/games/AnimalSounds';
import CountingStars  from './pages/games/CountingStars';
import WordBuilder    from './pages/games/WordBuilder';
import MathChallenge  from './pages/games/MathChallenge';
import SpellItRight   from './pages/games/SpellItRight';
import MemoryFlip     from './pages/games/MemoryFlip';

// Auth
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile   from './pages/student/StudentProfile';
import StudentBadges    from './pages/student/StudentBadges';
import StudentScores    from './pages/student/StudentScores';

// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClass     from './pages/teacher/TeacherClass';
import TeacherProfile   from './pages/teacher/TeacherProfile';

// Parent
import ParentDashboard from './pages/parent/ParentDashboard';
import ParentProfile   from './pages/parent/ParentProfile';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers     from './pages/admin/AdminUsers';
import AdminGames     from './pages/admin/AdminGames';
import AdminProfile   from './pages/admin/AdminProfile';
import AdminClasses from './pages/admin/AdminClasses';

// Games
import AlphabetGame from './pages/games/AlphabetGame';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center',
        alignItems: 'center', height: '100vh',
        fontSize: '22px', color: '#7C3AED',
        fontFamily: 'Nunito, sans-serif',
        background: '#F9F5FF',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>🎓</div>
          <div>Loading FunLearn AI...</div>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/${user.role}/dashboard`} />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/student/profile" element={
            <ProtectedRoute allowedRole="student">
              <StudentProfile />
            </ProtectedRoute>
          }/>
          <Route path="/student/badges" element={
            <ProtectedRoute allowedRole="student">
              <StudentBadges />
            </ProtectedRoute>
          }/>
          <Route path="/student/scores" element={
            <ProtectedRoute allowedRole="student">
              <StudentScores />
            </ProtectedRoute>
          }/>

          {/* Teacher */}
          <Route path="/teacher/dashboard" element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/teacher/class/:class_code" element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherClass />
            </ProtectedRoute>
          }/>
          <Route path="/teacher/profile" element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherProfile />
            </ProtectedRoute>
          }/>

          {/* Parent */}
          <Route path="/parent/dashboard" element={
            <ProtectedRoute allowedRole="parent">
              <ParentDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/parent/profile" element={
            <ProtectedRoute allowedRole="parent">
              <ParentProfile />
            </ProtectedRoute>
          }/>

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }/>
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRole="admin">
              <AdminUsers />
            </ProtectedRoute>
          }/>
          <Route path="/admin/games" element={
            <ProtectedRoute allowedRole="admin">
              <AdminGames />
            </ProtectedRoute>
          }/>
          <Route path="/admin/classes" element={
            <ProtectedRoute allowedRole="admin">
            <AdminClasses />
            </ProtectedRoute>
          }/>
          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRole="admin">
              <AdminProfile />
            </ProtectedRoute>
          }/>
          <Route path="/games/colors"   element={<ProtectedRoute allowedRole="student"><ColorExplorer /></ProtectedRoute>}/>
<Route path="/games/shapes"   element={<ProtectedRoute allowedRole="student"><ShapeSorter /></ProtectedRoute>}/>
<Route path="/games/animals"  element={<ProtectedRoute allowedRole="student"><AnimalSounds /></ProtectedRoute>}/>
<Route path="/games/counting" element={<ProtectedRoute allowedRole="student"><CountingStars /></ProtectedRoute>}/>
<Route path="/games/words"    element={<ProtectedRoute allowedRole="student"><WordBuilder /></ProtectedRoute>}/>
<Route path="/games/math"     element={<ProtectedRoute allowedRole="student"><MathChallenge /></ProtectedRoute>}/>
<Route path="/games/spelling" element={<ProtectedRoute allowedRole="student"><SpellItRight /></ProtectedRoute>}/>
<Route path="/games/memory"   element={<ProtectedRoute allowedRole="student"><MemoryFlip /></ProtectedRoute>}/>

          {/* Games */}
          <Route path="/games/alphabet" element={
            <ProtectedRoute allowedRole="student">
              <AlphabetGame />
            </ProtectedRoute>
          }/>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;