import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    "http://127.0.0.1:5000/api",
});

// =====================================================
// JWT INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================================
// AUTH
// =====================================================

export const register = (data) =>
  api.post("/auth/register", data);

export const login = (data) =>
  api.post("/auth/login", data);

export const getMe = () =>
  api.get("/auth/me");

export const getMyProfile = () =>
  api.get("/profile/me");

export const getUsers = (params = {}) =>
  api.get("/users", { params });

export const getUserDetails = (id) =>
  api.get(`/users/${id}`);

export const updateUser = (id, data) =>
  api.patch(`/users/${id}`, data);

export const updateUserRole = (id, role) =>
  api.patch(`/users/${id}/role`, { role });

export const updateUserStatus = (id, status) =>
  api.patch(`/users/${id}/status`, { status });

export const deleteUser = (id) =>
  api.delete(`/users/${id}`);

export const getAuditLogs = () =>
  api.get("/users/audit-logs");

export const getHistory = (params = {}) =>
  api.get("/history", { params });

// =====================================================
// LEARN
// =====================================================

export const getModules = (category) =>
  api.get("/learn", {
    params: category ? { category } : {},
  });

export const getModuleById = (id) =>
  api.get(`/learn/${id}`);

export const completeModule = (id) =>
  api.post(`/learn/${id}/complete`);

export const getMyProgress = () =>
  api.get("/progress");

// =====================================================
// ASSESSMENTS
// =====================================================

export const getAssessments = () =>
  api.get("/assessments");

export const getAssessmentById = (id) =>
  api.get(`/assessments/${id}`);

export const submitAssessment = (id, body) =>
  api.post(`/assessments/${id}/submit`, body);

// =====================================================
// RISK / ML
// =====================================================

export const calculateRisk = (resultId) =>
  api.post(`/risk/calculate/${resultId}`);

export const getMyLatestRisk = () =>
  api.get("/risk/me");

export const getMyRiskHistory = () =>
  api.get("/risk/me/history");

// =====================================================
// PHISHING SIMULATOR
// =====================================================

export const getScenarios = () =>
  api.get("/phishing");

export const checkScenario = (scenarioId, answer) =>
  api.post("/phishing/check", {
    scenarioId,
    answer,
  });

// =====================================================
// AI ASSISTANT
// =====================================================

export const askAssistant = (message) =>
  api.post("/chatbot", {
    message,
  });

// =====================================================
// GAMIFICATION / PROFILE
// =====================================================

export const getLeaderboard = () =>
  api.get("/profile/leaderboard");

// =====================================================
// SECURITY TOOLKIT
// =====================================================

export const checkUrl = (url) =>
  api.post("/toolkit/url-check", {
    url,
  });

export const checkEmail = (payload) =>
  api.post("/toolkit/email-check", payload);

// =====================================================
// DAILY CHALLENGE
// =====================================================

export const getTodayChallenge = () =>
  api.get("/daily-challenge/today");

export const submitTodayChallenge = (selectedIndex) =>
  api.post("/daily-challenge/today/submit", {
    selectedIndex,
  });

export default api;
