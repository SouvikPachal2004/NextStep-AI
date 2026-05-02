// ===== NEXTSTEP AI – DASHBOARD JAVASCRIPT =====

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('nextstep-theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

themeToggle.addEventListener('click', function(){
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('nextstep-theme', next);
  updateThemeIcon(next);
});

function updateThemeIcon(theme){
  const icon = themeToggle.querySelector('i');
  icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Sidebar Toggle
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
sidebarToggle.addEventListener('click', function(){
  sidebar.classList.toggle('collapsed');
});

// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
mobileMenuToggle.addEventListener('click', function(){
  sidebar.classList.toggle('active');
});

// Page Navigation
const sidebarLinks = document.querySelectorAll('.sidebar-link[data-page]');
const pageContents = document.querySelectorAll('.page-content');
const topbarTitle = document.getElementById('topbarTitle');

const pageTitles = {
  'overview': 'Dashboard Overview',
  'users': 'User Management',
  'courses': 'Course Management',
  'enrollments': 'Enrollment Management',
  'jobs': 'Job Posts Management',
  'assessments': 'Assessment Management',
  'interviews': 'Interview Management',
  'certificates': 'Certificate Management',
  'analytics': 'Analytics & Reports',
  'settings': 'System Settings'
};

sidebarLinks.forEach(link => {
  link.addEventListener('click', function(e){
    e.preventDefault();
    const page = this.getAttribute('data-page');
    
    sidebarLinks.forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    
    pageContents.forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(page + '-page');
    if(targetPage) {
      targetPage.classList.add('active');
      
      // Trigger page-specific rendering
      if (typeof window.renderProgressTracking === 'function' && page === 'progress') {
        window.renderProgressTracking();
      }
      if (typeof window.renderProfileSettings === 'function' && page === 'profile') {
        window.renderProfileSettings();
      }
      if (typeof window.renderEnrollmentsTable === 'function' && page === 'enrollments') {
        window.renderEnrollmentsTable(window.allEnrollments || []);
      }
      if (typeof window.loadAnalyticsData === 'function' && page === 'analytics') {
        window.loadAnalyticsData();
      }
      if (typeof window.loadInterviewData === 'function' && page === 'interviews') {
        window.loadInterviewData();
      }
    } else {
      showToast('Page under construction', 'warning');
    }
    
    // Update topbar title
    if(topbarTitle && pageTitles[page]) {
      topbarTitle.textContent = pageTitles[page];
    }
    
    if(window.innerWidth < 768) sidebar.classList.remove('active');
  });
});

// Toast Notification
function showToast(msg, type='success'){
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  const icons = { success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-triangle' };
  toast.innerHTML = `<i class="fas ${icons[type]||'fa-info-circle'}" style="color:var(--${type==='success'?'success':type==='error'?'danger':'warning'})"></i><span>${msg}</span><span class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></span>`;
  container.appendChild(toast);
  setTimeout(()=>toast.remove(), 4000);
}

// ===== DYNAMIC CHARTS =====
let enrollmentChartInstance = null;
let analysisChartInstance = null;

function initAdminCharts() {
  if (typeof Chart === 'undefined') return;

  // Enrollment Trend Chart — starts empty, filled by real data
  const enrollmentCtx = document.getElementById('enrollmentChart');
  if (enrollmentCtx && !enrollmentChartInstance) {
    enrollmentChartInstance = new Chart(enrollmentCtx, {
      type: 'line',
      data: {
        labels: getLast6Months(),
        datasets: [
          {
            label: 'New Students',
            data: [0, 0, 0, 0, 0, 0],
            borderColor: '#6C3CE1',
            backgroundColor: 'rgba(108,60,225,0.1)',
            tension: 0.4, fill: true, borderWidth: 2
          },
          {
            label: 'Enrollments',
            data: [0, 0, 0, 0, 0, 0],
            borderColor: '#06B6D4',
            backgroundColor: 'rgba(6,182,212,0.1)',
            tension: 0.4, fill: true, borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top' } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Weekly Activity Bar Chart — starts empty, filled by real data
  const analysisCtx = document.getElementById('analysisChart');
  if (analysisCtx && !analysisChartInstance) {
    analysisChartInstance = new Chart(analysisCtx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Enrolled',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(16,185,129,0.8)',
            borderRadius: 8
          },
          {
            label: 'Completed',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(6,182,212,0.8)',
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top' } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Fetch real data and update charts
  fetchAndUpdateAdminCharts();
}

// Get last 6 month labels
function getLast6Months() {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(months[d.getMonth()]);
  }
  return result;
}

// Fetch real enrollment data and update charts
async function fetchAndUpdateAdminCharts() {
  try {
    const token = getAuthToken();
    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch enrollments for trend data
    const [enrollmentsRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/enrollments`, { headers }),
      fetch(`${API_URL}/users`, { headers })
    ]);

    if (enrollmentsRes.ok) {
      const enrollData = await enrollmentsRes.json();
      const enrollments = enrollData.data || [];

      // Build monthly enrollment counts (last 6 months)
      const monthlyCounts = buildMonthlyCounts(enrollments, 6);
      if (enrollmentChartInstance) {
        enrollmentChartInstance.data.datasets[1].data = monthlyCounts;
        enrollmentChartInstance.update();
      }

      // Build weekly activity (last 7 days)
      const weeklyEnrolled = buildWeeklyActivity(enrollments, 'createdAt');
      const weeklyCompleted = buildWeeklyActivity(
        enrollments.filter(e => e.progress >= 100), 'updatedAt'
      );
      if (analysisChartInstance) {
        analysisChartInstance.data.datasets[0].data = weeklyEnrolled;
        analysisChartInstance.data.datasets[1].data = weeklyCompleted;
        analysisChartInstance.update();
      }
    }

    if (usersRes.ok) {
      const userData = await usersRes.json();
      const users = userData.data || [];
      const monthlyUsers = buildMonthlyCounts(users, 6);
      if (enrollmentChartInstance) {
        enrollmentChartInstance.data.datasets[0].data = monthlyUsers;
        enrollmentChartInstance.update();
      }
    }
  } catch (err) {
    console.error('Chart data fetch error:', err);
  }
}

// Count items per month for last N months
function buildMonthlyCounts(items, months) {
  const counts = new Array(months).fill(0);
  const now = new Date();
  items.forEach(item => {
    const date = new Date(item.createdAt);
    const monthsAgo = (now.getFullYear() - date.getFullYear()) * 12
      + (now.getMonth() - date.getMonth());
    if (monthsAgo >= 0 && monthsAgo < months) {
      counts[months - 1 - monthsAgo]++;
    }
  });
  return counts;
}

// Count items per day for last 7 days
function buildWeeklyActivity(items, dateField = 'createdAt') {
  const counts = new Array(7).fill(0);
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  items.forEach(item => {
    const date = new Date(item[dateField] || item.createdAt);
    const daysAgo = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (daysAgo >= 0 && daysAgo < 7) {
      counts[6 - daysAgo]++;
    }
  });
  return counts;
}

// Initialize charts when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  initAdminCharts();
  // Refresh chart data every 30 seconds
  setInterval(fetchAndUpdateAdminCharts, 30000);
});

// Search functionality
const searchInput = document.querySelector('.topbar-search input');
if(searchInput) {
  searchInput.addEventListener('input', function(e){
    const query = e.target.value.toLowerCase();
    if(query.length > 2) {
      console.log('Searching for:', query);
      // Add search logic here
    }
  });
}
