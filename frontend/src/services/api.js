import axios from 'axios';

const BASE_URL = 'https://funlearn-o3b9.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const registerUser   = (data) => api.post('/users/register/', data);
export const loginUser      = (data) => api.post('/users/login/', data);
export const getProfile     = ()     => api.get('/users/profile/');
export const updateProfile  = (data) => api.patch('/users/update-profile/', data);
export const changePassword = (data) => api.post('/users/change-password/', data);

// ── CLASSES ───────────────────────────────────────────────────────────────────
export const checkClassCode    = (code) => api.get(`/users/check-class-code/?code=${code}`);
export const joinClass         = (data) => api.post('/users/join-class/', data);
export const createClass       = (data) => api.post('/users/create-class/', data);
export const getTeacherClasses = ()     => api.get('/users/my-classes/');
export const getClassDetail    = (code) => api.get(`/users/class-detail/${code}/`);
export const getStudentDetail  = (sid)  => api.get(`/users/student-detail/?student_id=${sid}`);

// ── PARENT ────────────────────────────────────────────────────────────────────
export const getMyChildren = () => api.get('/users/my-children/');
export const addChild = (data) => api.post('/users/add-child/', data);

// ── GAMES ─────────────────────────────────────────────────────────────────────
export const getGames    = ()     => api.get('/games/');
export const submitScore = (data) => api.post('/games/submit-score/', data);
export const getMyScores = ()     => api.get('/games/my-scores/');

// ── STAGE PROGRESS ────────────────────────────────────────────────────────────
export const getStageProgress  = (gameId)         => api.get(`/games/stage-progress/?game_id=${gameId}`);
export const saveStageProgress = (gameId, stages) => api.post('/games/save-stage/', { game_id: gameId, unlocked_stages: stages });

// ── GAMIFICATION ──────────────────────────────────────────────────────────────
export const getMyBadges    = () => api.get('/gamification/my-badges/');
export const getLeaderboard = () => api.get('/gamification/leaderboard/');

// ── AI ────────────────────────────────────────────────────────────────────────
export const getGameFeedback   = (data)   => api.post('/ai/game-feedback/', data);
export const getAIDifficulty   = (gameId) => api.get(`/ai/difficulty/?game_id=${gameId}`);
export const trainAIModel      = ()       => api.post('/ai/train-model/', {});
export const getProgressReport = (sid)    => api.get(`/ai/progress-report/?student_id=${sid}`);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
export const getAllUsers      = ()     => api.get('/users/all-users/');
export const getAllClasses     = ()     => api.get('/users/all-classes/');
export const toggleUser       = (data) => api.post('/users/toggle-user/', data);
export const toggleClass      = (data) => api.post('/users/toggle-class/', data);
export const getPlatformStats = ()     => api.get('/users/platform-stats/');
export const getAllGamesAdmin  = ()     => api.get('/games/all/');
export const toggleGame       = (data) => api.post('/games/toggle/', data);
export const getActiveToday   = (code) => api.get(`/games/active-today/?class_code=${code}`);

export default api;
