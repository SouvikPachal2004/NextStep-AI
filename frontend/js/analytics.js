// ===== NEXTSTEP AI – REAL-TIME ANALYTICS =====

class RealTimeAnalytics {
  constructor(options = {}) {
    this.refreshInterval = options.refreshInterval || 5000; // 5 seconds default
    this.endpoint = options.endpoint || '/api/analytics/platform';
    this.onUpdate = options.onUpdate || null;
    this.intervalId = null;
    this.isRunning = false;
  }

  // Start real-time updates
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.fetchData(); // Initial fetch
    
    this.intervalId = setInterval(() => {
      this.fetchData();
    }, this.refreshInterval);
    
    console.log('Real-time analytics started');
  }

  // Stop real-time updates
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Real-time analytics stopped');
  }

  // Fetch analytics data
  async fetchData() {
    try {
      const response = await fetch(`${API_URL}${this.endpoint}`);
      const result = await response.json();
      
      if (result.success && this.onUpdate) {
        this.onUpdate(result.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }

  // Update refresh interval
  setRefreshInterval(interval) {
    this.refreshInterval = interval;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

// Update KPI values with animation
function updateKPI(elementId, newValue, growth) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const valueEl = element.querySelector('.hdc-kpi-value');
  const trendEl = element.querySelector('.hdc-kpi-trend');
  
  if (valueEl) {
    // Animate value change
    animateValue(valueEl, newValue);
  }
  
  if (trendEl && growth !== undefined) {
    const isPositive = growth >= 0;
    trendEl.className = `hdc-kpi-trend ${isPositive ? 'up' : 'down'}`;
    trendEl.innerHTML = `<i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i> ${Math.abs(growth)}%`;
  }
}

// Animate number changes
function animateValue(element, newValue) {
  const currentText = element.textContent;
  const currentNum = parseFloat(currentText.replace(/[^0-9.]/g, ''));
  
  // Format new value
  let formattedValue = newValue;
  if (newValue >= 1000) {
    formattedValue = (newValue / 1000).toFixed(1) + 'K';
  }
  if (newValue >= 1000000) {
    formattedValue = (newValue / 1000000).toFixed(1) + 'M';
  }
  
  // If value changed, add pulse animation
  if (currentText !== formattedValue.toString()) {
    element.style.animation = 'none';
    setTimeout(() => {
      element.style.animation = 'pulse 0.5s ease';
      element.textContent = formattedValue;
    }, 10);
  }
}

// Update course enrollment bars
function updateCourseBar(rank, courseName, enrollments, percentage) {
  const courseRow = document.querySelector(`.hdc-course-row:nth-child(${rank})`);
  if (!courseRow) return;

  const nameEl = courseRow.querySelector('.hdc-course-name');
  const barEl = courseRow.querySelector('.hdc-course-bar');
  const pctEl = courseRow.querySelector('.hdc-course-pct');
  
  if (nameEl) nameEl.textContent = courseName;
  if (barEl) {
    barEl.style.width = percentage + '%';
  }
  if (pctEl) {
    animateValue(pctEl, enrollments);
  }
}

// Update circular progress metrics
function updateCircularMetric(metricName, value) {
  const metricMap = {
    'placementRate': 1,
    'satisfactionRate': 2,
    'avgScore': 3
  };
  
  const index = metricMap[metricName];
  if (!index) return;
  
  const statEl = document.querySelector(`.hdc-footer-stat:nth-child(${index * 2 - 1})`);
  if (!statEl) return;
  
  const circleEl = statEl.querySelector('.hdc-footer-circle');
  const spanEl = circleEl?.querySelector('span');
  const svgCircle = circleEl?.querySelector('circle:last-child');
  
  if (spanEl) {
    animateValue(spanEl, value);
    spanEl.textContent = value + '%';
  }
  
  if (svgCircle) {
    svgCircle.setAttribute('stroke-dasharray', `${value} ${100 - value}`);
  }
}

// Format large numbers
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Add live indicator pulse
function addLiveIndicator() {
  const liveIndicator = document.querySelector('.hdc-live-dot');
  if (liveIndicator) {
    liveIndicator.style.animation = 'pulse 2s infinite';
  }
}

// Initialize real-time analytics for homepage
function initHomepageAnalytics() {
  const analytics = new RealTimeAnalytics({
    refreshInterval: 5000, // Update every 5 seconds
    endpoint: '/analytics/platform',
    onUpdate: (data) => {
      // Update KPIs
      if (data.kpis) {
        updateKPI('kpi-users', data.kpis.activeUsers.value, data.kpis.activeUsers.growth);
        updateKPI('kpi-courses', data.kpis.courses.value, data.kpis.courses.growth);
        updateKPI('kpi-certificates', data.kpis.certificates.value, data.kpis.certificates.growth);
        updateKPI('kpi-jobs', data.kpis.jobPartners.value, data.kpis.jobPartners.growth);
      }
      
      // Update top courses
      if (data.topCourses && data.topCourses.length > 0) {
        data.topCourses.slice(0, 3).forEach((course, index) => {
          updateCourseBar(
            index + 1,
            course.name,
            course.enrollments,
            course.percentage
          );
        });
      }
      
      // Update metrics
      if (data.metrics) {
        updateCircularMetric('placementRate', data.metrics.placementRate);
        updateCircularMetric('satisfactionRate', data.metrics.satisfactionRate);
        updateCircularMetric('avgScore', data.metrics.avgScore);
      }
      
      // Update timestamp
      const timestampEl = document.getElementById('analytics-timestamp');
      if (timestampEl && data.timestamp) {
        const time = new Date(data.timestamp).toLocaleTimeString();
        timestampEl.textContent = `Last updated: ${time}`;
      }
      
      // Pulse live indicator
      addLiveIndicator();
    }
  });
  
  // Start analytics
  analytics.start();
  
  // Stop when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      analytics.stop();
    } else {
      analytics.start();
    }
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    analytics.stop();
  });
  
  return analytics;
}

// Initialize real-time analytics for admin dashboard
function initDashboardAnalytics() {
  const analytics = new RealTimeAnalytics({
    refreshInterval: 10000, // Update every 10 seconds
    endpoint: '/analytics/dashboard',
    onUpdate: (data) => {
      // Update overview stats
      if (data.overview) {
        updateDashboardStat('total-users', data.overview.totalUsers);
        updateDashboardStat('total-courses', data.overview.totalCourses);
        updateDashboardStat('total-enrollments-count', data.overview.totalEnrollments);
        updateDashboardStat('total-certificates', data.overview.totalCertificates);
        
        // Update growth indicators
        const newUsersEl = document.getElementById('new-users-month');
        if (newUsersEl && data.overview.newUsersThisMonth !== undefined) {
          newUsersEl.textContent = `+${data.overview.newUsersThisMonth} this month`;
        }
        
        const newEnrollmentsEl = document.getElementById('new-enrollments-week');
        if (newEnrollmentsEl && data.overview.newEnrollmentsThisWeek !== undefined) {
          newEnrollmentsEl.textContent = `+${data.overview.newEnrollmentsThisWeek} this week`;
        }
        
        // Update active jobs
        const activeJobsEl = document.getElementById('active-jobs');
        if (activeJobsEl && data.overview.activeJobs !== undefined) {
          activeJobsEl.textContent = `${data.overview.activeJobs} active`;
        }
      }
      
      // Update charts if data available
      if (data.trends && data.trends.enrollments) {
        updateEnrollmentChart(data.trends.enrollments);
      }
      
      // Also refresh the dynamic admin charts
      if (typeof fetchAndUpdateAdminCharts === 'function') {
        fetchAndUpdateAdminCharts();
      }
      
      // Update recent activities
      if (data.recent) {
        if (data.recent.users) {
          updateRecentUsers(data.recent.users);
        }
        if (data.recent.enrollments) {
          updateRecentEnrollments(data.recent.enrollments);
        }
      }
      
      console.log('Dashboard analytics updated:', data.timestamp);
    }
  });
  
  analytics.start();
  
  // Stop when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      analytics.stop();
    } else {
      analytics.start();
    }
  });
  
  return analytics;
}

// Update dashboard stat
function updateDashboardStat(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    animateValue(element, value);
  }
}

// Initialize real-time analytics for user dashboard
function initUserAnalytics(userId) {
  const analytics = new RealTimeAnalytics({
    refreshInterval: 15000, // Update every 15 seconds
    endpoint: `/analytics/user/${userId}`,
    onUpdate: (data) => {
      // Update user stats
      if (data.enrollments) {
        updateUserStat('enrolled-courses', data.enrollments.total);
        updateUserStat('completed-courses', data.enrollments.completed);
        
        // Update in-progress label
        const inProgressLabel = document.getElementById('inprogress-courses-label');
        if (inProgressLabel && data.enrollments.inProgress !== undefined) {
          inProgressLabel.textContent = `${data.enrollments.inProgress} in progress`;
        }
      }
      
      if (data.certificates !== undefined) {
        updateUserStat('user-certificates', data.certificates);
      }
      
      if (data.assessments) {
        updateUserStat('avg-score', data.assessments.avgScore + '%');
        
        // Update total assessments if element exists
        const totalAssessments = document.getElementById('total-assessments');
        if (totalAssessments && data.assessments.total !== undefined) {
          totalAssessments.textContent = data.assessments.total;
        }
      }
      
      if (data.learningStreak) {
        const streakEl = document.getElementById('streakValue');
        if (streakEl) {
          const days = data.learningStreak.current || 0;
          streakEl.textContent = `${days} ${days === 1 ? 'Day' : 'Days'}`;
        }
        
        // Update longest streak if element exists
        const longestStreakEl = document.getElementById('longestStreak');
        if (longestStreakEl && data.learningStreak.longest !== undefined) {
          longestStreakEl.textContent = `${data.learningStreak.longest} days best`;
        }
      }
      
      console.log('User analytics updated:', data.timestamp);
    }
  });
  
  analytics.start();
  
  // Stop when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      analytics.stop();
    } else {
      analytics.start();
    }
  });
  
  return analytics;
}

// Update user stat
function updateUserStat(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

// Update enrollment chart with real-time data
function updateEnrollmentChart(trendsData) {
  // Try the admin chart instance first (set by dashboard.js)
  let chart = null;
  const chartEl = document.getElementById('enrollmentChart');
  if (!chartEl || typeof Chart === 'undefined') return;

  // Get existing chart instance
  chart = Chart.getChart('enrollmentChart');
  if (!chart) return;

  if (trendsData && trendsData.length > 0) {
    const labels = trendsData.map(d => {
      // Format date label nicely
      const date = new Date(d._id);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = trendsData.map(d => d.count);

    // Update the enrollments dataset (index 1)
    if (chart.data.datasets[1]) {
      chart.data.labels = labels;
      chart.data.datasets[1].data = data;
      chart.update('none');
    }
  }
}

// Update recent users table
function updateRecentUsers(users) {
  const tableBody = document.querySelector('#recent-users-table tbody');
  if (!tableBody || !users || users.length === 0) return;
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  users.slice(0, 5).forEach(user => {
    const row = document.createElement('tr');
    const initial = (user.name || 'U').charAt(0).toUpperCase();
    const roleClass = user.role === 'admin' ? 'badge-primary' : 'badge-info';
    const roleText = user.role === 'admin' ? 'Admin' : 'Student';
    const date = new Date(user.createdAt).toLocaleDateString();
    
    row.innerHTML = `
      <td>
        <div class="table-user">
          <div class="avatar avatar-sm" style="background:linear-gradient(135deg,#6C3CE1,#8B5CF6)">${initial}</div>
          <div>
            <div class="table-user-name">${user.name}</div>
            <div class="table-user-id">${user.email}</div>
          </div>
        </div>
      </td>
      <td><span class="badge ${roleClass}">${roleText}</span></td>
      <td>${date}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon btn-sm" title="View"><i class="fas fa-eye"></i></button>
          <button class="btn-icon btn-sm" title="Edit"><i class="fas fa-edit"></i></button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Update recent enrollments table
function updateRecentEnrollments(enrollments) {
  const tableBody = document.querySelector('#recent-enrollments-table tbody');
  if (!tableBody || !enrollments || enrollments.length === 0) return;
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  enrollments.slice(0, 5).forEach(enrollment => {
    const row = document.createElement('tr');
    const userName = enrollment.user?.name || 'Unknown User';
    const courseName = enrollment.course?.title || 'Unknown Course';
    const initial = userName.charAt(0).toUpperCase();
    const date = new Date(enrollment.createdAt).toLocaleDateString();
    const progress = enrollment.progress || 0;
    const statusClass = enrollment.status === 'completed' ? 'badge-success' : 
                       enrollment.status === 'in-progress' ? 'badge-info' : 'badge-warning';
    const statusText = enrollment.status || 'enrolled';
    
    row.innerHTML = `
      <td>
        <div class="table-user">
          <div class="avatar avatar-sm" style="background:linear-gradient(135deg,#06B6D4,#0891B2)">${initial}</div>
          <div>
            <div class="table-user-name">${userName}</div>
          </div>
        </div>
      </td>
      <td>${courseName}</td>
      <td>${date}</td>
      <td>
        <div class="progress-cell">
          <div class="progress-bar-mini">
            <div class="progress-fill-mini" style="width:${progress}%;background:var(--gradient-primary)"></div>
          </div>
          <span class="progress-text">${progress}%</span>
        </div>
      </td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-icon btn-sm" title="View"><i class="fas fa-eye"></i></button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RealTimeAnalytics,
    initHomepageAnalytics,
    initDashboardAnalytics,
    initUserAnalytics
  };
}
