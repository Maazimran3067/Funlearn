import axios from 'axios';

const BASE_URL = 'https://funlearn-o3b9.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      error.response = {
        data: {
          error: 'Request timed out. The server may be waking up — please wait 30 seconds and try again.'
        }
      };
    } else if (!error.response) {
      error.response = {
        data: { error: 'Cannot reach server. Check your internet connection and try again.' }
      };
    }
    return Promise.reject(error);
  }
);

// ── AUTH ───────────────────────────────────────────────────────
export const registerUser   = (data) => api.post('/api/users/register/', data);
export const loginUser      = (data) => api.post('/api/users/login/', data);
export const getProfile     = ()     => api.get('/api/users/profile/');
export const updateProfile  = (data) => api.patch('/api/users/update-profile/', data);
export const changePassword = (data) => api.post('/api/users/change-password/', data);
export const sendOTP = (data) => api.post('/api/users/send-otp/', data, { timeout: 90000 });
export const verifyOTP      = (data) => api.post('/api/users/verify-otp/', data, { timeout: 60000 });

// ── CLASSROOM ──────────────────────────────────────────────────
export const checkClassCode    = (code) => api.get(`/api/users/check-class-code/?code=${code}`);
export const joinClass         = (data) => api.post('/api/users/join-class/', data);
export const createClass       = (data) => api.post('/api/users/create-class/', data);
export const getTeacherClasses = ()     => api.get('/api/users/my-classes/');
export const getClassDetail    = (code) => api.get(`/api/users/class-detail/${code}/`);
export const getStudentDetail  = (sid)  => api.get(`/api/users/student-detail/?student_id=${sid}`);
export const getMyChildren     = ()     => api.get('/api/users/my-children/');

// ── GAMEPLAY ───────────────────────────────────────────────────
export const getGames          = ()             => api.get('/api/games/');
export const submitScore       = (data)         => api.post('/api/games/submit-score/', data);
export const getMyScores       = ()             => api.get('/api/games/my-scores/');
export const getStageProgress  = (gameId)       => api.get(`/api/games/stage-progress/?game_id=${gameId}`);
export const saveStageProgress = (gameId, stgs) => api.post('/api/games/save-stage/', { game_id: gameId, unlocked_stages: stgs });
export const getMyBadges       = ()             => api.get('/api/gamification/my-badges/');
export const getLeaderboard    = ()             => api.get('/api/gamification/leaderboard/');

// ── AI ─────────────────────────────────────────────────────────
export const getGameFeedback   = (data)   => api.post('/api/ai/game-feedback/', data);
export const getAIDifficulty   = (gameId) => api.get(`/api/ai/difficulty/?game_id=${gameId}`);
export const trainAIModel      = ()       => api.post('/api/ai/train-model/', {});
export const getProgressReport = (sid)    => api.get(`/api/ai/progress-report/?student_id=${sid}`);

// ── ADMIN ──────────────────────────────────────────────────────
export const getAllUsers       = ()     => api.get('/api/users/all-users/');
export const getAllClasses     = ()     => api.get('/api/users/all-classes/');
export const toggleUser       = (data) => api.post('/api/users/toggle-user/', data);
export const toggleClass      = (data) => api.post('/api/users/toggle-class/', data);
export const getPlatformStats = ()     => api.get('/api/users/platform-stats/');
export const getAllGamesAdmin  = ()     => api.get('/api/games/all/');
export const toggleGame       = (data) => api.post('/api/games/toggle/', data);
export const getActiveToday   = (code) => api.get(`/api/games/active-today/?class_code=${code}`);

// ── PARENT ─────────────────────────────────────────────────────
export const getChildProgress    = (username) => api.get(`/api/users/child-progress/?username=${username}`);
export const getAIProgressReport = (username) => api.get(`/api/ai/progress-report/?username=${username}`);
export const addChild            = (data)     => api.post('/api/users/add-child/', data);

// ── TEACHER ────────────────────────────────────────────────────
export const getStudentsInClass        = (code) => api.get(`/api/users/class-detail/${code}/`);
export const getStudentDetailedProfile = (sid)  => api.get(`/api/users/student-detail/?student_id=${sid}`);
export const activeTodayStudents       = (code) => api.get(`/api/games/active-today/?class_code=${code}`);
export const createTeacherClass        = (data) => api.post('/api/users/create-class/', data);

export default api;