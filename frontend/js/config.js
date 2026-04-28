// API Configuration
// Auto-detect: use deployed backend in production, localhost in development
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : 'https://nextstep-ai-backend.onrender.com/api';

// API endpoints
const API_ENDPOINTS = {
  // Auth
  register: `${API_URL}/auth/register`,
  login: `${API_URL}/auth/login`,
  logout: `${API_URL}/auth/logout`,
  me: `${API_URL}/auth/me`,
  updatePassword: `${API_URL}/auth/updatepassword`,
  
  // Users
  users: `${API_URL}/users`,
  
  // Courses
  courses: `${API_URL}/courses`,
  
  // Enrollments
  enrollments: `${API_URL}/enrollments`,
  
  // Assessments
  assessments: `${API_URL}/assessments`,
  
  // Jobs
  jobs: `${API_URL}/jobs`,
  
  // Resume
  resume: `${API_URL}/resume`,
  
  // Certificates
  certificates: `${API_URL}/certificates`,
  
  // Analytics
  analytics: `${API_URL}/analytics`
};

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('nextstep-token');
}

// Helper function to set auth token
function setAuthToken(token) {
  localStorage.setItem('nextstep-token', token);
}

// Helper function to remove auth token
function removeAuthToken() {
  localStorage.removeItem('nextstep-token');
  localStorage.removeItem('nextstep-user');
}

// Helper function to get user data
function getUserData() {
  const userData = localStorage.getItem('nextstep-user');
  return userData ? JSON.parse(userData) : null;
}

// Helper function to set user data
function setUserData(user) {
  localStorage.setItem('nextstep-user', JSON.stringify(user));
}

// Helper function to make authenticated API calls
async function apiCall(endpoint, options = {}) {
  const token = getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  try {
    const response = await fetch(endpoint, mergedOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

// Check if user is authenticated
function isAuthenticated() {
  return !!getAuthToken();
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

// Redirect to dashboard if already authenticated
function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    const user = getUserData();
    if (user && user.role === 'admin') {
      window.location.href = '/pages/admin-dashboard.html';
    } else {
      window.location.href = '/pages/user-dashboard.html';
    }
    return true;
  }
  return false;
}
