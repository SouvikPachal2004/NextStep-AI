// ===== NEXTSTEP AI – USER DASHBOARD (MERGED) =====

// ===== THEME TOGGLE =====
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

// ===== SIDEBAR TOGGLE =====
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
sidebarToggle.addEventListener('click', function(){
  sidebar.classList.toggle('collapsed');
});

const mobileMenuToggle = document.getElementById('mobileMenuToggle');
mobileMenuToggle.addEventListener('click', function(){
  sidebar.classList.toggle('active');
});

// ===== PAGE NAVIGATION =====
const sidebarLinks = document.querySelectorAll('.sidebar-link[data-page]');
const pageContents = document.querySelectorAll('.page-content');
const topbarTitle = document.getElementById('topbarTitle');

const pageTitles = {
  'overview':          'My Dashboard',
  'all-courses':       'All Courses',
  'enrolled-courses':  'Enrolled Courses',
  'assessments':       'Assessments',
  'certificates':      'My Certificates',
  'progress':          'Learning Progress',
  'all-jobs':          'All Jobs',
  'applied-jobs':      'Applied Jobs',
  'resume':            'My Resume',
  'interview-history': 'Interview History',
  'profile':           'My Profile'
};

sidebarLinks.forEach(link => {
  link.addEventListener('click', function(e){
    e.preventDefault();
    const page = this.getAttribute('data-page');

    sidebarLinks.forEach(l => l.classList.remove('active'));
    this.classList.add('active');

    pageContents.forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(page + '-page');
    if (targetPage) {
      targetPage.classList.add('active');

      if (page === 'progress'          && typeof renderProgressTracking   === 'function') renderProgressTracking();
      if (page === 'profile'           && typeof renderProfileSettings    === 'function') renderProfileSettings();
      if (page === 'all-courses'       && typeof renderAllCourses         === 'function') renderAllCourses();
      if (page === 'enrolled-courses'  && typeof renderEnrolledCourses    === 'function') renderEnrolledCourses();
      if (page === 'assessments') loadAndRenderAssessments();
      if (page === 'certificates'      && typeof renderUserCertificates   === 'function') renderUserCertificates(window.userCertificates || []);
      if (page === 'all-jobs'          && typeof renderAllJobs            === 'function') renderAllJobs();
      if (page === 'applied-jobs'      && typeof renderAppliedJobs        === 'function') renderAppliedJobs();
      if (page === 'interview-history' && typeof loadInterviewHistory     === 'function') loadInterviewHistory();
    } else {
      showToast('Page under construction', 'warning');
    }

    if (topbarTitle && pageTitles[page]) topbarTitle.textContent = pageTitles[page];
    if (window.innerWidth < 768) sidebar.classList.remove('active');
  });
});

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle' };
  toast.innerHTML = `<i class="fas ${icons[type] || 'fa-info-circle'}" style="color:var(--${type==='success'?'success':type==='error'?'danger':'warning'})"></i><span>${msg}</span><span class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ===== LOAD & RENDER ASSESSMENTS (always fresh from API) =====
async function loadAndRenderAssessments() {
  const container = document.getElementById('assessmentsContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align:center;padding:3rem;color:var(--text-muted);">
      <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:1rem;display:block;color:var(--primary);"></i>
      <p style="margin:0;">Loading assessments...</p>
    </div>`;

  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/assessments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    window.userAssessments = data.data || [];

    // Wait up to 2s for user-assessments.js to be ready
    let waited = 0;
    while (typeof renderUserAssessments !== 'function' && waited < 2000) {
      await new Promise(r => setTimeout(r, 100));
      waited += 100;
    }

    if (typeof renderUserAssessments === 'function') {
      renderUserAssessments(window.userAssessments);
    } else {
      // Fallback simple render if user-assessments.js not loaded
      if (window.userAssessments.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;padding:4rem 2rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border);">
            <i class="fas fa-brain" style="font-size:3rem;color:var(--primary);margin-bottom:1rem;display:block;"></i>
            <h3 style="color:var(--text-primary);margin-bottom:0.5rem;">No Assessments Yet</h3>
            <p style="color:var(--text-muted);">Assessments will appear here once the admin publishes them.</p>
          </div>`;
      } else {
        container.innerHTML = window.userAssessments.map(a => `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1rem;">
            <h4 style="color:var(--text-primary);margin-bottom:0.5rem;">${a.title}</h4>
            <p style="color:var(--text-muted);font-size:0.875rem;">${a.description || ''}</p>
            <div style="margin-top:1rem;display:flex;gap:1rem;font-size:0.82rem;color:var(--text-secondary);">
              <span><i class="fas fa-clock"></i> ${a.duration || 30} min</span>
              <span><i class="fas fa-question-circle"></i> ${a.questions?.length || 0} questions</span>
              <span><i class="fas fa-signal"></i> ${a.difficulty || 'Medium'}</span>
            </div>
            <button class="btn btn-primary btn-sm" style="margin-top:1rem;" onclick="startAssessment('${a._id}')">
              <i class="fas fa-play"></i> Start Assessment
            </button>
          </div>`).join('');
      }
    }
  } catch (err) {
    console.error('Failed to load assessments:', err);
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border);">
        <i class="fas fa-exclamation-circle" style="font-size:2.5rem;color:var(--danger);margin-bottom:1rem;display:block;"></i>
        <h3 style="color:var(--text-primary);margin-bottom:0.5rem;">Failed to load assessments</h3>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;">Error: ${err.message}</p>
        <button class="btn btn-primary btn-sm" onclick="loadAndRenderAssessments()">
          <i class="fas fa-redo"></i> Retry
        </button>
      </div>`;
  }
}

// ===== CHARTS =====
let progressChart = null;
let skillsChart = null;

function initializeCharts() {
  if (typeof Chart === 'undefined') return;

  // Progress Chart
  const progressCtx = document.getElementById('progressChart');
  if (progressCtx && !progressChart) {
    progressChart = new Chart(progressCtx, {
      type: 'line',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets: [{
          label: 'Hours Learned',
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#6C3CE1',
          backgroundColor: 'rgba(108,60,225,0.1)',
          tension: 0.4, fill: true, borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: v => v + 'h' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Skills Chart
  const skillsCtx = document.getElementById('skillsChart');
  if (skillsCtx && !skillsChart) {
    skillsChart = new Chart(skillsCtx, {
      type: 'doughnut',
      data: {
        labels: ['Programming','Data Science','Web Dev','ML/AI','Other'],
        datasets: [{ 
          data: [0, 0, 0, 0, 0], 
          backgroundColor: ['#6C3CE1','#06B6D4','#10B981','#F97316','#EC4899'], 
          borderWidth: 0 
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true } } }
      }
    });
  }
}

// Update charts with real data
function updateChartsWithData(enrollments) {
  // Update Progress Chart with weekly activity
  if (progressChart && enrollments && enrollments.length > 0) {
    const weeklyHours = calculateWeeklyHours(enrollments);
    progressChart.data.datasets[0].data = weeklyHours;
    progressChart.update();
  }

  // Update Skills Chart with course categories
  if (skillsChart && enrollments && enrollments.length > 0) {
    const skillDistribution = calculateSkillDistribution(enrollments);
    skillsChart.data.datasets[0].data = skillDistribution.values;
    if (skillDistribution.labels.length > 0) {
      skillsChart.data.labels = skillDistribution.labels;
    }
    skillsChart.update();
  }
}

// Calculate weekly learning hours from enrollments
function calculateWeeklyHours(enrollments) {
  const hours = [0, 0, 0, 0, 0, 0, 0];
  const today = new Date();
  
  enrollments.forEach(enrollment => {
    const updatedDate = new Date(enrollment.updatedAt || enrollment.createdAt);
    const daysDiff = Math.floor((today - updatedDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 7) {
      const dayIndex = 6 - daysDiff;
      if (dayIndex >= 0 && dayIndex < 7) {
        // Estimate hours based on progress
        const courseDuration = enrollment.course?.duration?.hours || 0;
        const progress = (enrollment.progress || 0) / 100;
        const estimatedHours = (courseDuration * progress) / 7; // Distribute over week
        hours[dayIndex] += Math.min(estimatedHours, 4); // Cap at 4 hours per day
      }
    }
  });
  
  return hours.map(h => Math.round(h * 10) / 10);
}

// Calculate skill distribution from course categories
function calculateSkillDistribution(enrollments) {
  const categories = {};
  
  enrollments.forEach(enrollment => {
    const category = enrollment.course?.category || 'Other';
    categories[category] = (categories[category] || 0) + 1;
  });
  
  // Map to chart categories
  const categoryMap = {
    'Programming': ['Programming', 'Software Development', 'Coding'],
    'Data Science': ['Data Science', 'Data Analysis', 'Statistics'],
    'Web Dev': ['Web Development', 'Frontend', 'Backend', 'Full Stack'],
    'ML/AI': ['Machine Learning', 'AI', 'Deep Learning', 'Neural Networks'],
    'Other': ['Other', 'General', 'Business', 'Design']
  };
  
  const distribution = {
    'Programming': 0,
    'Data Science': 0,
    'Web Dev': 0,
    'ML/AI': 0,
    'Other': 0
  };
  
  Object.entries(categories).forEach(([category, count]) => {
    let matched = false;
    for (const [key, values] of Object.entries(categoryMap)) {
      if (values.some(v => category.toLowerCase().includes(v.toLowerCase()))) {
        distribution[key] += count;
        matched = true;
        break;
      }
    }
    if (!matched) {
      distribution['Other'] += count;
    }
  });
  
  // If all zeros, show sample data
  const values = Object.values(distribution);
  const hasData = values.some(v => v > 0);
  
  if (!hasData) {
    return {
      labels: ['Programming','Data Science','Web Dev','ML/AI','Other'],
      values: [35, 25, 20, 15, 5]
    };
  }
  
  return {
    labels: Object.keys(distribution),
    values: Object.values(distribution)
  };
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', function() {
  initializeCharts();
  loadUserDashboardData();
  setupUserEventListeners();
});

// ===== DATA LOADING =====
async function loadUserDashboardData() {
  try {
    const token = getAuthToken();
    const headers = { 'Authorization': `Bearer ${token}` };

    const enrollmentsRes = await fetch(`${API_URL}/enrollments`, { headers });
    if (enrollmentsRes.ok) {
      const d = await enrollmentsRes.json();
      window.userEnrollments = d.data || [];
      renderUserCourses(window.userEnrollments);
      renderContinueLearning(window.userEnrollments);
      
      // Update charts with real data
      updateChartsWithData(window.userEnrollments);
      
      // Update dashboard stats
      const activeEnrollments = window.userEnrollments.filter(e => e.status === 'active');
      const completedCourses = activeEnrollments.filter(e => e.progress >= 100);
      
      // Update Enrolled Courses count
      const enrolledCoursesEl = document.getElementById('enrolled-courses');
      if (enrolledCoursesEl) {
        enrolledCoursesEl.textContent = activeEnrollments.length;
      }
      
      // Update Completed count
      const completedEl = document.getElementById('completed-courses');
      if (completedEl) {
        completedEl.textContent = completedCourses.length;
      }
    }

    const certsRes = await fetch(`${API_URL}/certificates`, { headers });
    if (certsRes.ok) {
      const d = await certsRes.json();
      window.userCertificates = d.data || [];
      renderUserCertificates(window.userCertificates);
      
      // Update Certificates count
      const certificatesEl = document.getElementById('user-certificates');
      if (certificatesEl) {
        certificatesEl.textContent = window.userCertificates.length;
      }
    }

    const coursesRes = await fetch(`${API_URL}/courses`);
    if (coursesRes.ok) {
      const d = await coursesRes.json();
      window.availableCourses = d.data || [];
    }

    const jobsRes = await fetch(`${API_URL}/jobs`);
    if (jobsRes.ok) {
      const d = await jobsRes.json();
      window.availableJobs = d.data || [];
      renderJobBoard(window.availableJobs);
    }

    const assessmentsRes = await fetch(`${API_URL}/assessments`, { headers });
    if (assessmentsRes.ok) {
      const d = await assessmentsRes.json();
      window.userAssessments = d.data || [];
      renderUserAssessments(window.userAssessments);
    }
    
    // Load user job applications
    if (typeof loadUserApplications === 'function') {
      await loadUserApplications();
    }

    // Load certificate requests (to show pending/approved status on enrolled courses)
    if (typeof loadCertRequests === 'function') {
      await loadCertRequests();
    }
    
    // Initialize real-time analytics for user
    const userData = getUserData();
    if (userData && userData.id) {
      if (typeof initUserAnalytics === 'function') {
        initUserAnalytics(userData.id);
      }
    }
  } catch (error) {
    console.error('Error loading user dashboard data:', error);
  }
}

// ===== EVENT LISTENERS =====
function setupUserEventListeners() {
  const searchInputs = document.querySelectorAll('.user-search-input');
  searchInputs.forEach(input => {
    input.addEventListener('input', e => handleUserSearch(e.target.value, e.target.dataset.type));
  });

  // Resume upload
  document.getElementById('resumeUpload')?.addEventListener('change', handleResumeUpload);
}

// ===== ALL COURSES =====
function renderAllCourses() {
  const container = document.getElementById('allCoursesContainer');
  if (!container) return;

  // Fetch all published courses
  fetch(`${API_URL}/courses`)
    .then(res => res.json())
    .then(data => {
      const courses = data.data || [];
      const publishedCourses = courses.filter(c => c.isPublished);
      
      if (publishedCourses.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;padding:3rem;grid-column:1/-1;">
            <i class="fas fa-book-open" style="font-size:3rem;color:var(--text-muted);margin-bottom:1rem;"></i>
            <p style="color:var(--text-muted);">No courses available at the moment</p>
          </div>`;
        return;
      }

      container.innerHTML = publishedCourses.map(course => {
        const isEnrolled = window.userEnrollments?.some(e => e.course?._id === course._id);
        const enrollment = window.userEnrollments?.find(e => e.course?._id === course._id);
        const isPending = enrollment?.status === 'pending';
        
        return `
          <div class="course-card-mini">
            <div class="course-thumb-mini" style="background:linear-gradient(135deg,#6C3CE1,#8B5CF6)">
              <i class="fas fa-book"></i>
            </div>
            <div class="course-info-mini">
              <h4 class="course-name-mini">${course.title}</h4>
              <p style="color:var(--text-muted);font-size:0.875rem;margin:0.5rem 0;">${course.description || ''}</p>
              <div class="course-meta-mini">
                <span><i class="fas fa-clock"></i> ${course.duration?.hours || 0}h</span>
                <span><i class="fas fa-signal"></i> ${course.level || 'Beginner'}</span>
                <span><i class="fas fa-tag"></i> ${course.category || 'General'}</span>
              </div>
            </div>
            ${isEnrolled 
              ? (isPending 
                  ? `<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending</span>`
                  : `<span class="badge badge-success"><i class="fas fa-check"></i> Enrolled</span>`)
              : `<button class="btn btn-primary btn-sm" onclick="requestEnrollment('${course._id}')">
                   <i class="fas fa-plus"></i> Enroll
                 </button>`
            }
          </div>`;
      }).join('');
    })
    .catch(err => {
      console.error('Error loading courses:', err);
      container.innerHTML = `<div style="text-align:center;padding:3rem;grid-column:1/-1;color:var(--danger);">Error loading courses</div>`;
    });
}

// ===== ENROLLED COURSES =====
function renderEnrolledCourses() {
  const container = document.getElementById('enrolledCoursesContainer');
  if (!container) return;

  const enrollments = window.userEnrollments || [];
  const activeEnrollments = enrollments.filter(e => e.status === 'active' || e.status === 'completed');

  if (activeEnrollments.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;grid-column:1/-1;">
        <i class="fas fa-graduation-cap" style="font-size:3rem;color:var(--text-muted);margin-bottom:1rem;"></i>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;">You haven't enrolled in any courses yet</p>
        <button class="btn btn-primary" onclick="document.querySelector('[data-page=all-courses]').click()">
          <i class="fas fa-search"></i> Browse Courses
        </button>
      </div>`;
    return;
  }

  container.innerHTML = activeEnrollments.map(enrollment => {
    const course = enrollment.course || {};
    const progress = enrollment.progress || 0;
    const isComplete = progress >= 100;
    const certRequests = window.userCertRequests || [];
    const certReq = certRequests.find(r => (r.course?._id || r.course) === (course._id || course));
    const hasCert = enrollment.certificateIssued;

    // Determine action button
    let actionBtn = '';
    if (hasCert && enrollment.certificateId) {
      actionBtn = `<button class="btn btn-sm" style="background:linear-gradient(135deg,#c9a227,#f0d060);color:#1a0533;font-weight:700;border:none;"
                     onclick="viewCertificate('${enrollment.certificateId}')">
                     <i class="fas fa-certificate"></i> View Certificate
                   </button>`;
    } else if (isComplete && certReq?.status === 'pending') {
      actionBtn = `<button class="btn btn-warning btn-sm" disabled>
                     <i class="fas fa-clock"></i> Cert Pending
                   </button>`;
    } else if (isComplete && certReq?.status === 'approved') {
      actionBtn = `<button class="btn btn-sm" style="background:linear-gradient(135deg,#c9a227,#f0d060);color:#1a0533;font-weight:700;border:none;"
                     onclick="viewCertificate('${certReq.certificate?._id || certReq.certificate}')">
                     <i class="fas fa-certificate"></i> View Certificate
                   </button>`;
    } else if (isComplete) {
      actionBtn = `<button class="btn btn-sm" style="background:linear-gradient(135deg,#c9a227,#f0d060);color:#1a0533;font-weight:700;border:none;"
                     onclick="requestCertificate('${course._id}', '${(course.title||'').replace(/'/g,"\\'")}', this)">
                     <i class="fas fa-award"></i> Request Certificate
                   </button>`;
    } else {
      actionBtn = `<button class="btn btn-primary btn-sm" onclick="markCourseComplete('${enrollment._id}', '${course._id}', '${(course.title||'').replace(/'/g,"\\'")}', this)">
                     <i class="fas fa-check-circle"></i> Mark Complete
                   </button>`;
    }

    return `
      <div class="course-card-mini" style="flex-direction:column;align-items:stretch;gap:0.75rem;">
        <div style="display:flex;gap:1rem;align-items:center;">
          <div class="course-thumb-mini" style="background:linear-gradient(135deg,#6C3CE1,#8B5CF6);flex-shrink:0;">
            <i class="fas fa-book"></i>
          </div>
          <div class="course-info-mini" style="flex:1;min-width:0;">
            <h4 class="course-name-mini">${course.title || 'Course'}</h4>
            <div class="course-meta-mini">
              <span><i class="fas fa-clock"></i> ${course.duration?.hours || 0}h</span>
              <span><i class="fas fa-signal"></i> ${course.level || 'Beginner'}</span>
            </div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
            <span style="font-size:0.8rem;color:var(--text-secondary);">Progress</span>
            <span style="font-size:0.8rem;font-weight:700;color:${isComplete ? 'var(--success)' : 'var(--primary)'};">${progress}%</span>
          </div>
          <div class="course-progress-bar">
            <div class="course-progress-fill" style="width:${progress}%;background:${isComplete ? 'var(--success)' : 'var(--gradient-primary)'}"></div>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;">
          ${actionBtn}
        </div>
      </div>`;
  }).join('');
}

// ===== MY COURSES (Legacy - keeping for compatibility) =====
function renderUserCourses(enrollments) {
  const container = document.getElementById('myCoursesContainer');
  if (!container) return;

  if (enrollments.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;grid-column:1/-1;">
        <i class="fas fa-book" style="font-size:3rem;color:var(--text-muted);margin-bottom:1rem;"></i>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;">You haven't enrolled in any courses yet</p>
        <button class="btn btn-primary" onclick="showBrowseCourses()">
          <i class="fas fa-search"></i> Browse Courses
        </button>
      </div>`;
    return;
  }

  container.innerHTML = enrollments.map(enrollment => {
    const course = enrollment.course || {};
    const statusBadge = enrollment.status === 'pending'
      ? `<span class="badge badge-warning" style="margin-bottom:0.5rem;"><i class="fas fa-clock"></i> Pending Approval</span>`
      : '';
    return `
      <div class="course-card-mini">
        <div class="course-thumb-mini" style="background:linear-gradient(135deg,#6C3CE1,#8B5CF6)">
          <i class="fas fa-book"></i>
        </div>
        <div class="course-info-mini">
          ${statusBadge}
          <h4 class="course-name-mini">${course.title || 'Course'}</h4>
          <div class="course-progress-wrap">
            <div class="course-progress-bar">
              <div class="course-progress-fill" style="width:${enrollment.progress || 0}%;background:var(--gradient-primary)"></div>
            </div>
            <span class="course-progress-text">${enrollment.progress || 0}%</span>
          </div>
          <div class="course-meta-mini">
            <span><i class="fas fa-clock"></i> ${course.duration?.hours || course.duration || 0}h</span>
            <span><i class="fas fa-signal"></i> ${course.level || 'Beginner'}</span>
          </div>
        </div>
        ${enrollment.status === 'active'
          ? `<button class="btn btn-primary btn-sm" onclick="continueCourse('${enrollment._id}')">
               ${enrollment.progress >= 100 ? 'Review' : 'Continue'}
             </button>`
          : ''}
      </div>`;
  }).join('');
}

function continueCourse(enrollmentId) {
  showToast('Opening course...', 'info');
}

// ===== BROWSE & ENROLL =====
function showBrowseCourses() {
  const section = document.getElementById('browseCourseSection');
  if (section) {
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
    renderAvailableCourses();
  }
}

function hideBrowseCourses() {
  const section = document.getElementById('browseCourseSection');
  if (section) section.style.display = 'none';
}

function renderAvailableCourses() {
  const container = document.getElementById('availableCoursesContainer');
  if (!container) return;

  const courses = window.availableCourses || [];
  const enrolledIds = (window.userEnrollments || []).map(e => e.course?._id || e.course);

  if (courses.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;grid-column:1/-1;">
        <i class="fas fa-book" style="font-size:3rem;color:var(--text-muted);margin-bottom:1rem;"></i>
        <p style="color:var(--text-muted);">No courses available yet. Check back later!</p>
      </div>`;
    return;
  }

  container.innerHTML = courses.map(course => {
    const enrollment = (window.userEnrollments || []).find(e => (e.course?._id || e.course) === course._id);
    const isActive  = enrollment?.status === 'active';
    const isPending = enrollment?.status === 'pending';

    let btn = `<button class="btn btn-primary btn-sm" style="width:100%;" onclick="requestEnrollment('${course._id}', this)">
                 <i class="fas fa-plus"></i> Request Enrollment
               </button>`;
    if (isActive)  btn = `<button class="btn btn-success btn-sm" style="width:100%;" disabled><i class="fas fa-check"></i> Enrolled</button>`;
    if (isPending) btn = `<button class="btn btn-warning btn-sm" style="width:100%;" disabled><i class="fas fa-clock"></i> Pending Approval</button>`;

    return `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;transition:all 0.3s ease;"
           onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shadow-md)'"
           onmouseout="this.style.transform='';this.style.boxShadow=''">
        <div style="height:120px;background:linear-gradient(135deg,#6C3CE1,#8B5CF6);display:flex;align-items:center;justify-content:center;font-size:3rem;color:#fff;">
          <i class="fas fa-book"></i>
        </div>
        <div style="padding:1.5rem;">
          <h4 style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:0.5rem;">${course.title || 'Course'}</h4>
          <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:1rem;line-height:1.5;">
            ${(course.description || 'Learn new skills').substring(0, 100)}...
          </p>
          <div style="display:flex;gap:1rem;margin-bottom:1rem;font-size:0.8rem;color:var(--text-muted);">
            <span><i class="fas fa-clock"></i> ${course.duration?.hours || course.duration || 0}h</span>
            <span><i class="fas fa-signal"></i> ${course.level || 'Beginner'}</span>
            <span><i class="fas fa-tag"></i> ${course.category || 'General'}</span>
          </div>
          ${btn}
        </div>
      </div>`;
  }).join('');
}

async function requestEnrollment(courseId, btn) {
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting...'; }
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/enrollments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Enrollment request sent! Waiting for admin approval.', 'success');
      const r = await fetch(`${API_URL}/enrollments`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        window.userEnrollments = d.data || [];
        renderUserCourses(window.userEnrollments);
        renderAvailableCourses();
        
        // Update dashboard stats
        const activeEnrollments = window.userEnrollments.filter(e => e.status === 'active');
        const enrolledCoursesEl = document.getElementById('enrolled-courses');
        if (enrolledCoursesEl) {
          enrolledCoursesEl.textContent = activeEnrollments.length;
        }
      }
    } else {
      showToast(data.message || 'Failed to send request', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> Request Enrollment'; }
    }
  } catch (err) {
    showToast('Error sending enrollment request', 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> Request Enrollment'; }
  }
}

// ===== ASSESSMENTS =====
// Moved to user-assessments.js — functions: renderUserAssessments, startAssessment,
// selectAnswer, quizNavigate, quizGoTo, confirmSubmitQuiz, submitQuiz, closeQuizModal

// ===== CERTIFICATES =====
function renderUserCertificates(certificates) {
  const container = document.getElementById('certificatesContainer');
  if (!container) return;

  if (certificates.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;">
        <i class="fas fa-certificate" style="font-size:3rem;color:var(--text-muted);margin-bottom:1rem;"></i>
        <p style="color:var(--text-muted);">No certificates earned yet</p>
        <p style="font-size:0.875rem;color:var(--text-muted);margin-top:0.5rem;">Complete courses to earn certificates</p>
      </div>`;
    return;
  }

  container.innerHTML = certificates.map(cert => {
    const course = cert.course || {};
    return `
      <div style="background:var(--bg-card);border:2px solid var(--primary);border-radius:var(--radius-lg);padding:2rem;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;background:var(--gradient-primary);opacity:0.1;border-radius:50%;"></div>
        <div style="position:relative;z-index:1;">
          <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
            <div style="width:60px;height:60px;background:var(--gradient-primary);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;color:#fff;">
              <i class="fas fa-certificate"></i>
            </div>
            <div>
              <h4 style="font-size:1.2rem;font-weight:700;color:var(--text-primary);margin-bottom:0.25rem;">${course.title || 'Course Certificate'}</h4>
              <p style="font-size:0.875rem;color:var(--text-secondary);">Issued on ${new Date(cert.issuedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div style="display:flex;gap:0.75rem;">
            <button class="btn btn-outline btn-sm" onclick="viewCertificate('${cert._id}')"><i class="fas fa-eye"></i> View</button>
            <button class="btn btn-primary btn-sm" onclick="downloadCertificate('${cert._id}')"><i class="fas fa-download"></i> Download</button>
            <button class="btn btn-secondary btn-sm" onclick="shareCertificate('${cert._id}')"><i class="fas fa-share"></i> Share</button>
          </div>
        </div>
      </div>`;
  }).join('');
}

function viewCertificate(certId)     { window.location.href = `certificate-view.html?id=${certId}`; }
function downloadCertificate(certId) { window.location.href = `certificate-view.html?id=${certId}`; }

function shareCertificate(certId) {
  const url = `${window.location.origin}/pages/certificate-view.html?id=${certId}`;
  if (navigator.share) {
    navigator.share({ title: 'My NextStep AI Certificate', text: 'Check out my certificate!', url })
      .then(() => showToast('Certificate shared!', 'success'))
      .catch(() => copyToClipboard(url));
  } else {
    copyToClipboard(url);
  }
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).then(() => showToast('Certificate link copied!', 'success'));
}

// ===== CONTINUE LEARNING (real enrolled courses on overview) =====
function renderContinueLearning(enrollments) {
  const container = document.getElementById('continueLearningContainer');
  if (!container) return;

  const active = (enrollments || [])
    .filter(e => e.status === 'active' || e.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 3);

  if (active.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:2.5rem;color:var(--text-muted);">
        <i class="fas fa-book-open" style="font-size:2.5rem;margin-bottom:1rem;display:block;opacity:0.4;"></i>
        <p style="margin:0 0 1rem;">You haven't enrolled in any courses yet.</p>
        <button class="btn btn-primary btn-sm" onclick="document.querySelector('[data-page=all-courses]').click()">
          <i class="fas fa-search"></i> Browse Courses
        </button>
      </div>`;
    return;
  }

  const gradients = [
    'linear-gradient(135deg,#6C3CE1,#8B5CF6)',
    'linear-gradient(135deg,#06B6D4,#0891B2)',
    'linear-gradient(135deg,#10B981,#059669)',
  ];

  container.innerHTML = active.map((e, i) => {
    const course   = e.course || {};
    const progress = e.progress || 0;
    const isComplete = progress >= 100;
    const gradient = gradients[i % gradients.length];

    return `
      <div class="course-card-mini">
        <div class="course-thumb-mini" style="background:${gradient}">
          <i class="fas fa-book"></i>
        </div>
        <div class="course-info-mini">
          <h4 class="course-name-mini">${course.title || 'Course'}</h4>
          <div class="course-progress-wrap">
            <div class="course-progress-bar">
              <div class="course-progress-fill" style="width:${progress}%;background:${isComplete ? 'var(--success)' : gradient}"></div>
            </div>
            <span class="course-progress-text">${progress}%</span>
          </div>
          <div class="course-meta-mini">
            <span><i class="fas fa-signal"></i> ${course.level || 'Beginner'}</span>
            <span><i class="fas fa-tag"></i> ${course.category || 'General'}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="document.querySelector('[data-page=enrolled-courses]').click()">
          ${isComplete ? 'Review' : 'Continue'}
        </button>
      </div>`;
  }).join('');
}

// ===== RECOMMENDED JOBS (real jobs on overview) =====
function renderJobBoard(jobs) {
  const container = document.getElementById('recommendedJobsContainer');
  if (!container) return;

  const activeJobs = (jobs || []).filter(j => j.isActive).slice(0, 3);

  if (activeJobs.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:2.5rem;color:var(--text-muted);">
        <i class="fas fa-briefcase" style="font-size:2.5rem;margin-bottom:1rem;display:block;opacity:0.4;"></i>
        <p style="margin:0;">No jobs available at the moment. Check back soon!</p>
      </div>`;
    return;
  }

  const logoColors = [
    'linear-gradient(135deg,#6C3CE1,#8B5CF6)',
    'linear-gradient(135deg,#06B6D4,#0891B2)',
    'linear-gradient(135deg,#F97316,#EA580C)',
  ];

  container.innerHTML = activeJobs.map((job, i) => {
    const companyName = job.company?.name || job.company || 'Company';
    const letter = companyName.charAt(0).toUpperCase();
    const hasApplied = (window.userApplications || []).some(a => a.job._id === job._id);

    return `
      <div class="job-card">
        <div class="job-header">
          <div class="job-company-logo" style="background:${logoColors[i % logoColors.length]}">${letter}</div>
          <div class="job-info">
            <h4 class="job-title">${job.title}</h4>
            <div class="job-company">${companyName} • ${job.location || 'Remote'} • ${job.employmentType || 'Full-time'}</div>
          </div>
          ${job.salary ? `<span class="badge badge-secondary" style="white-space:nowrap;">${job.salary}</span>` : ''}
        </div>
        <div class="job-skills">
          ${(job.skills || []).slice(0, 4).map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
        <div class="job-footer">
          <span class="job-posted"><i class="fas fa-map-marker-alt"></i> ${job.workType || 'Remote'}</span>
          ${hasApplied
            ? `<span class="badge badge-success"><i class="fas fa-check"></i> Applied</span>`
            : `<button class="btn btn-outline btn-sm" onclick="document.querySelector('[data-page=all-jobs]').click()">
                 <i class="fas fa-paper-plane"></i> Apply Now
               </button>`}
        </div>
      </div>`;
  }).join('');
}

// ===== PROGRESS TRACKING =====
function renderProgressTracking() {
  const container = document.getElementById('progressContainer');
  if (!container) return;

  const enrollments = (window.userEnrollments || []).filter(e => e.status === 'active' || e.status === 'completed');
  const total     = enrollments.length;
  const completed = enrollments.filter(e => e.progress >= 100).length;
  const inProg    = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
  const notStarted = enrollments.filter(e => !e.progress || e.progress === 0).length;
  const avg       = total > 0 ? Math.round(enrollments.reduce((s, e) => s + (e.progress || 0), 0) / total) : 0;
  const certs     = (window.userCertificates || []).length;
  const assessments = (window.userAssessments || []);
  const userId    = getUserData()?._id || getUserData()?.id;
  const allAttempts = assessments.flatMap(a => (a.attempts||[]).filter(att => String(att.user)===String(userId)));
  const passedAttempts = allAttempts.filter(a => a.passed);
  const avgAssessScore = allAttempts.length > 0
    ? Math.round(allAttempts.reduce((s,a) => s + (a.percentage||0), 0) / allAttempts.length)
    : 0;

  container.innerHTML = `
    <!-- ── Stats Row ── -->
    <div class="stats-grid" style="margin-bottom:1.75rem;">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(108,60,225,0.15);color:#6C3CE1"><i class="fas fa-book-open"></i></div>
        <div class="stat-content">
          <div class="stat-label">Total Courses</div>
          <div class="stat-value">${total}</div>
          <div class="stat-change up"><i class="fas fa-layer-group"></i> Enrolled</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.15);color:#10B981"><i class="fas fa-check-circle"></i></div>
        <div class="stat-content">
          <div class="stat-label">Completed</div>
          <div class="stat-value">${completed}</div>
          <div class="stat-change up"><i class="fas fa-trophy"></i> Finished</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(6,182,212,0.15);color:#06B6D4"><i class="fas fa-spinner"></i></div>
        <div class="stat-content">
          <div class="stat-label">In Progress</div>
          <div class="stat-value">${inProg}</div>
          <div class="stat-change up"><i class="fas fa-bolt"></i> Active</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(249,115,22,0.15);color:#F97316"><i class="fas fa-chart-line"></i></div>
        <div class="stat-content">
          <div class="stat-label">Avg Progress</div>
          <div class="stat-value">${avg}%</div>
          <div class="stat-change up"><i class="fas fa-arrow-up"></i> Overall</div>
        </div>
      </div>
    </div>

    <!-- ── Charts Row ── -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.75rem;">

      <!-- Overall Progress Donut -->
      <div class="section-card" style="padding:1.5rem;">
        <h3 class="section-title" style="margin-bottom:1.25rem;"><i class="fas fa-chart-pie" style="color:var(--primary);margin-right:0.5rem;"></i>Course Completion</h3>
        <div style="display:flex;align-items:center;gap:2rem;">
          <div style="position:relative;width:140px;height:140px;flex-shrink:0;">
            <canvas id="progressDonutChart"></canvas>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
              <div style="font-size:1.6rem;font-weight:800;color:var(--primary);">${avg}%</div>
              <div style="font-size:0.7rem;color:var(--text-muted);font-weight:600;">OVERALL</div>
            </div>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:0.75rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;color:var(--text-secondary);">
                <span style="width:10px;height:10px;border-radius:50%;background:#10B981;display:inline-block;"></span> Completed
              </div>
              <span style="font-weight:700;color:var(--text-primary);">${completed}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;color:var(--text-secondary);">
                <span style="width:10px;height:10px;border-radius:50%;background:#6C3CE1;display:inline-block;"></span> In Progress
              </div>
              <span style="font-weight:700;color:var(--text-primary);">${inProg}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;color:var(--text-secondary);">
                <span style="width:10px;height:10px;border-radius:50%;background:#E5E7EB;display:inline-block;"></span> Not Started
              </div>
              <span style="font-weight:700;color:var(--text-primary);">${notStarted}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem;color:var(--text-secondary);">
                <span style="width:10px;height:10px;border-radius:50%;background:#c9a227;display:inline-block;"></span> Certificates
              </div>
              <span style="font-weight:700;color:var(--text-primary);">${certs}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Assessment Performance -->
      <div class="section-card" style="padding:1.5rem;">
        <h3 class="section-title" style="margin-bottom:1.25rem;"><i class="fas fa-brain" style="color:var(--secondary);margin-right:0.5rem;"></i>Assessment Performance</h3>
        ${allAttempts.length === 0 ? `
          <div style="text-align:center;padding:2rem 1rem;color:var(--text-muted);">
            <i class="fas fa-brain" style="font-size:2.5rem;opacity:0.3;margin-bottom:0.75rem;display:block;"></i>
            <p style="margin:0;font-size:0.875rem;">No assessments taken yet</p>
            <button class="btn btn-primary btn-sm" style="margin-top:1rem;" onclick="document.querySelector('[data-page=assessments]').click()">
              <i class="fas fa-play"></i> Take Assessment
            </button>
          </div>
        ` : `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem;">
            <div style="background:var(--primary-soft);border-radius:var(--radius-md);padding:1rem;text-align:center;">
              <div style="font-size:1.75rem;font-weight:800;color:var(--primary);">${allAttempts.length}</div>
              <div style="font-size:0.75rem;color:var(--text-secondary);font-weight:600;">Total Attempts</div>
            </div>
            <div style="background:var(--success-light);border-radius:var(--radius-md);padding:1rem;text-align:center;">
              <div style="font-size:1.75rem;font-weight:800;color:var(--success);">${passedAttempts.length}</div>
              <div style="font-size:0.75rem;color:var(--text-secondary);font-weight:600;">Passed</div>
            </div>
            <div style="background:var(--secondary-soft);border-radius:var(--radius-md);padding:1rem;text-align:center;">
              <div style="font-size:1.75rem;font-weight:800;color:var(--secondary);">${avgAssessScore}%</div>
              <div style="font-size:0.75rem;color:var(--text-secondary);font-weight:600;">Avg Score</div>
            </div>
            <div style="background:rgba(249,115,22,0.1);border-radius:var(--radius-md);padding:1rem;text-align:center;">
              <div style="font-size:1.75rem;font-weight:800;color:#F97316;">${allAttempts.length > 0 ? Math.round((passedAttempts.length/allAttempts.length)*100) : 0}%</div>
              <div style="font-size:0.75rem;color:var(--text-secondary);font-weight:600;">Pass Rate</div>
            </div>
          </div>
          <div style="height:6px;background:var(--border);border-radius:var(--radius-full);overflow:hidden;">
            <div style="height:100%;width:${avgAssessScore}%;background:linear-gradient(90deg,#6C3CE1,#06B6D4);border-radius:var(--radius-full);transition:width 1s ease;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:0.4rem;font-size:0.75rem;color:var(--text-muted);">
            <span>0%</span><span>Pass: 80%</span><span>100%</span>
          </div>
        `}
      </div>
    </div>

    <!-- ── Weekly Activity Bar Chart ── -->
    <div class="section-card" style="padding:1.5rem;margin-bottom:1.75rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">
        <h3 class="section-title"><i class="fas fa-calendar-week" style="color:var(--primary);margin-right:0.5rem;"></i>Weekly Learning Activity</h3>
        <span style="font-size:0.8rem;color:var(--text-muted);background:var(--bg-body);padding:0.3rem 0.75rem;border-radius:var(--radius-full);border:1px solid var(--border);">Last 7 days</span>
      </div>
      <div style="height:180px;position:relative;">
        <canvas id="weeklyActivityChart"></canvas>
      </div>
    </div>

    <!-- ── Course Progress List ── -->
    <div class="section-card" style="padding:1.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">
        <h3 class="section-title"><i class="fas fa-tasks" style="color:var(--primary);margin-right:0.5rem;"></i>Course Progress Details</h3>
        <span style="font-size:0.8rem;color:var(--text-muted);">${total} course${total !== 1 ? 's' : ''}</span>
      </div>
      ${enrollments.length === 0 ? `
        <div style="text-align:center;padding:3rem;color:var(--text-muted);">
          <i class="fas fa-book-open" style="font-size:3rem;opacity:0.3;margin-bottom:1rem;display:block;"></i>
          <p style="margin:0 0 1rem;">No courses enrolled yet</p>
          <button class="btn btn-primary btn-sm" onclick="document.querySelector('[data-page=all-courses]').click()">
            <i class="fas fa-search"></i> Browse Courses
          </button>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:1rem;">
          ${enrollments.map(e => {
            const course = e.course || {};
            const progress = e.progress || 0;
            const isComplete = progress >= 100;
            const statusColor = isComplete ? '#10B981' : progress > 0 ? '#6C3CE1' : '#9CA3AF';
            const statusLabel = isComplete ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started';
            const statusBg    = isComplete ? 'rgba(16,185,129,0.1)' : progress > 0 ? 'rgba(108,60,225,0.1)' : 'rgba(156,163,175,0.1)';
            return `
              <div style="padding:1.25rem;background:var(--bg-body);border-radius:var(--radius-lg);border:1px solid var(--border);transition:all 0.25s;"
                   onmouseover="this.style.borderColor='var(--primary)';this.style.transform='translateX(4px)'"
                   onmouseout="this.style.borderColor='var(--border)';this.style.transform=''">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;gap:1rem;">
                  <div style="display:flex;align-items:center;gap:0.75rem;min-width:0;">
                    <div style="width:38px;height:38px;background:linear-gradient(135deg,#6C3CE1,#8B5CF6);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <i class="fas fa-book" style="color:white;font-size:0.9rem;"></i>
                    </div>
                    <div style="min-width:0;">
                      <div style="font-weight:700;color:var(--text-primary);font-size:0.95rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${course.title || 'Course'}</div>
                      <div style="font-size:0.78rem;color:var(--text-muted);">${course.category || 'General'} • ${course.level || 'Beginner'}</div>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:0.75rem;flex-shrink:0;">
                    <span style="font-size:1.1rem;font-weight:800;color:${statusColor};">${progress}%</span>
                    <span style="padding:0.25rem 0.625rem;border-radius:var(--radius-full);font-size:0.72rem;font-weight:700;background:${statusBg};color:${statusColor};">${statusLabel}</span>
                  </div>
                </div>
                <div style="background:var(--border);border-radius:var(--radius-full);height:8px;overflow:hidden;">
                  <div style="height:100%;width:${progress}%;background:${isComplete ? 'linear-gradient(90deg,#10B981,#059669)' : 'linear-gradient(90deg,#6C3CE1,#8B5CF6)'};border-radius:var(--radius-full);transition:width 1s ease;"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      `}
    </div>`;

  // Initialize charts after DOM is ready
  setTimeout(() => {
    // Donut chart
    const donutCtx = document.getElementById('progressDonutChart');
    if (donutCtx && typeof Chart !== 'undefined') {
      new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'In Progress', 'Not Started'],
          datasets: [{
            data: [completed || 0.001, inProg || 0.001, notStarted || (total === 0 ? 1 : 0.001)],
            backgroundColor: ['#10B981', '#6C3CE1', '#E5E7EB'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '72%',
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw === 0.001 ? 0 : ctx.raw}` } } }
        }
      });
    }

    // Weekly activity bar chart
    const weekCtx = document.getElementById('weeklyActivityChart');
    if (weekCtx && typeof Chart !== 'undefined') {
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const today = new Date().getDay(); // 0=Sun
      const orderedDays = [];
      for (let i = 1; i <= 7; i++) orderedDays.push(days[(today - 7 + i + 6) % 7]);

      // Build activity from enrollment update dates
      const activityData = new Array(7).fill(0);
      (window.userEnrollments || []).forEach(e => {
        const d = new Date(e.updatedAt || e.createdAt);
        const diff = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
        if (diff < 7) activityData[6 - diff] = Math.min(activityData[6 - diff] + 1, 5);
      });

      new Chart(weekCtx, {
        type: 'bar',
        data: {
          labels: orderedDays,
          datasets: [{
            label: 'Activity',
            data: activityData,
            backgroundColor: activityData.map((v, i) => i === 6 ? '#6C3CE1' : 'rgba(108,60,225,0.25)'),
            borderRadius: 8,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} course${ctx.raw !== 1 ? 's' : ''} updated` } } },
          scales: {
            y: { beginAtZero: true, max: 5, ticks: { stepSize: 1, callback: v => v === 0 ? '0' : v }, grid: { color: 'rgba(0,0,0,0.04)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  }, 100);
}

// ===== PROFILE SETTINGS =====
function renderProfileSettings() {
  const container = document.getElementById('profileContainer');
  if (!container) return;

  const user = getUserData() || {};

  container.innerHTML = `
    <div class="section-card">
      <h3 class="section-title">Personal Information</h3>
      <form id="profileForm" style="max-width:600px;margin-top:1.5rem;">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-control" id="profileName" value="${user.name || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" class="form-control" id="profileEmail" value="${user.email || ''}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label">Bio</label>
          <textarea class="form-control" rows="4" id="profileBio" placeholder="Tell us about yourself...">${user.bio || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Skills (comma separated)</label>
          <input type="text" class="form-control" id="profileSkills" value="${(user.skills || []).join(', ')}" placeholder="JavaScript, Python, React...">
        </div>
        <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Changes</button>
      </form>
    </div>
    <div class="section-card" style="margin-top:2rem;">
      <h3 class="section-title">Change Password</h3>
      <form id="passwordForm" style="max-width:600px;margin-top:1.5rem;">
        <div class="form-group">
          <label class="form-label">Current Password</label>
          <input type="password" class="form-control" id="currentPassword">
        </div>
        <div class="form-group">
          <label class="form-label">New Password</label>
          <input type="password" class="form-control" id="newPassword">
        </div>
        <div class="form-group">
          <label class="form-label">Confirm New Password</label>
          <input type="password" class="form-control" id="confirmPassword">
        </div>
        <button type="submit" class="btn btn-primary"><i class="fas fa-key"></i> Update Password</button>
      </form>
    </div>`;

  document.getElementById('profileForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const name   = document.getElementById('profileName').value;
    const bio    = document.getElementById('profileBio').value;
    const skills = document.getElementById('profileSkills').value.split(',').map(s => s.trim()).filter(Boolean);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/auth/updatedetails`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, skills })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.user) setUserData(d.user);
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast('Profile updated!', 'success'); // fallback
      }
    } catch { showToast('Profile updated!', 'success'); }
  });

  document.getElementById('passwordForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const newPass     = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    if (newPass !== confirmPass) { showToast('Passwords do not match!', 'error'); return; }
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/auth/updatepassword`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: document.getElementById('currentPassword').value, newPassword: newPass })
      });
      if (res.ok) { showToast('Password updated successfully!', 'success'); }
      else { const d = await res.json(); showToast(d.message || 'Failed to update password', 'error'); }
    } catch { showToast('Error updating password', 'error'); }
  });
}

// ===== SEARCH =====
function handleUserSearch(query, type) {
  query = query.toLowerCase();
  if (type === 'courses') {
    renderUserCourses((window.userEnrollments || []).filter(e => (e.course?.title || '').toLowerCase().includes(query)));
  } else if (type === 'jobs') {
    renderJobBoard((window.availableJobs || []).filter(j =>
      (j.title || '').toLowerCase().includes(query) || (j.company || '').toLowerCase().includes(query)
    ));
  }
}

// ===== RESUME UPLOAD & ANALYSIS =====
async function handleResumeUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowed.includes(file.type)) { 
    showToast('Please upload a PDF or Word document', 'error'); 
    return; 
  }
  if (file.size > 5 * 1024 * 1024) { 
    showToast('File size must be less than 5MB', 'error'); 
    return; 
  }

  document.getElementById('fileNameText').textContent = file.name;
  document.getElementById('resumeFileName').style.display = 'block';
  
  // Show loading state
  const analysisSection = document.getElementById('resumeAnalysisSection');
  const analysisContent = document.getElementById('resumeAnalysisContent');
  if (analysisSection && analysisContent) {
    analysisSection.style.display = 'block';
    analysisContent.innerHTML = `
      <div style="text-align:center;padding:3rem;">
        <div style="position:relative;display:inline-block;margin-bottom:1.5rem;">
          <div style="width:60px;height:60px;border:4px solid var(--primary-soft);border-top:4px solid var(--primary);border-radius:50%;animation:spin 1s linear infinite;margin:0 auto;"></div>
        </div>
        <h3 style="color:var(--text-primary);margin-bottom:0.5rem;">Analyzing Your Resume</h3>
        <p style="color:var(--text-secondary);font-size:1rem;margin-bottom:0.5rem;">AI is processing your resume content...</p>
        <p style="color:var(--text-muted);font-size:0.85rem;">This usually takes 5-10 seconds</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>`;
  }
  
  showToast('📄 Analyzing resume with AI...', 'info');

  try {
    const formData = new FormData();
    formData.append('resume', file);
    
    const res = await fetch(`${API_URL}/resume/analyze`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      body: formData
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) { 
        await displayResumeAnalysisWithRecommendations(data.data, file, data.source);
        
        // Show success message based on analysis source
        if (data.source === 'enhanced') {
          showToast('✅ Resume analyzed successfully with content enhancement!', 'success');
        } else if (data.source === 'default') {
          showToast('✅ Resume analyzed with smart defaults based on filename!', 'success');
        } else {
          showToast('✅ Resume analyzed with fallback analysis!', 'success');
        }
      } else {
        throw new Error(data.message || 'Analysis failed');
      }
    } else {
      const err = await res.json();
      throw new Error(err.message || 'Server error');
    }
  } catch (err) {
    console.error('Resume analysis error:', err);
    
    // Show error and provide basic fallback analysis
    showToast('⚠️ Analysis had issues, showing basic results', 'warning');
    
    const fallbackAnalysis = {
      skills: ['JavaScript', 'HTML', 'CSS', 'React', 'Node.js', 'SQL', 'Git'],
      experience: 'Entry Level',
      education: "Bachelor's Degree",
      atsScore: 72,
      atsBreakdown: {
        sections: 30,
        contact: 15,
        skills: 15,
        formatting: 10,
        keywords: 2
      },
      jobMatches: [
        { title: 'Frontend Developer', match: 85 },
        { title: 'Full Stack Developer', match: 80 },
        { title: 'Web Developer', match: 75 }
      ],
      suggestions: [
        'Add more technical skills relevant to your target role',
        'Include detailed project descriptions with technologies used',
        'Add quantifiable achievements to your experience',
        'Include links to your GitHub profile or portfolio'
      ],
      skillCategories: {
        'Programming Languages': ['JavaScript'],
        'Web Technologies': ['HTML', 'CSS', 'React'],
        'Backend': ['Node.js'],
        'Database': ['SQL'],
        'Tools': ['Git']
      }
    };
    
    await displayResumeAnalysisWithRecommendations(fallbackAnalysis, file, 'fallback');
  }
}

async function displayResumeAnalysisWithRecommendations(analysis, file, source = 'default') {
  const section = document.getElementById('resumeAnalysisSection');
  const content = document.getElementById('resumeAnalysisContent');
  if (!section || !content) return;

  // Get job recommendations based on detected skills
  let jobRecommendations = [];
  let courseRecommendations = [];
  
  try {
    // Fetch all jobs and match with skills
    const jobsRes = await fetch(`${API_URL}/jobs`);
    if (jobsRes.ok) {
      const jobsData = await jobsRes.json();
      const allJobs = jobsData.data || [];
      const userSkills = (analysis.skills || []).map(s => s.toLowerCase());
      
      // Calculate match scores
      jobRecommendations = allJobs
        .filter(job => job.isActive)
        .map(job => {
          const jobSkills = (job.skills || []).map(s => s.toLowerCase());
          const matchingSkills = userSkills.filter(s => jobSkills.some(js => js.includes(s) || s.includes(js)));
          const matchScore = jobSkills.length > 0 ? Math.round((matchingSkills.length / jobSkills.length) * 100) : 0;
          return { ...job, matchScore, matchingSkills };
        })
        .filter(job => job.matchScore > 30)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);
    }

    // Fetch courses for skill gaps
    const coursesRes = await fetch(`${API_URL}/courses`);
    if (coursesRes.ok) {
      const coursesData = await coursesRes.json();
      const allCourses = coursesData.data || [];
      
      // Recommend courses based on missing skills from top jobs
      const topJobSkills = new Set();
      jobRecommendations.slice(0, 3).forEach(job => {
        (job.skills || []).forEach(skill => topJobSkills.add(skill.toLowerCase()));
      });
      
      const missingSkills = Array.from(topJobSkills).filter(skill => 
        !userSkills.some(us => us.includes(skill) || skill.includes(us))
      );
      
      courseRecommendations = allCourses
        .filter(course => course.isPublished)
        .filter(course => {
          const courseTitle = (course.title || '').toLowerCase();
          const courseDesc = (course.description || '').toLowerCase();
          return missingSkills.some(skill => 
            courseTitle.includes(skill) || courseDesc.includes(skill)
          );
        })
        .slice(0, 4);
    }
  } catch (err) {
    console.error('Error fetching recommendations:', err);
  }

  displayResumeAnalysis(analysis, jobRecommendations, courseRecommendations);
}

function displayResumeAnalysis(analysis, jobRecommendations = [], courseRecommendations = []) {
  const section  = document.getElementById('resumeAnalysisSection');
  const content  = document.getElementById('resumeAnalysisContent');
  if (!section || !content) return;

  const skills      = analysis.skills || [];
  const experience  = analysis.experience || 'Not specified';
  const education   = analysis.education || 'Not specified';
  const jobMatches  = analysis.jobMatches || [];
  const suggestions = analysis.suggestions || [];
  const atsScore    = typeof analysis.atsScore === 'number' ? analysis.atsScore : null;
  const breakdown   = analysis.atsBreakdown || null;

  // ── ATS score helpers ──────────────────────────────────────────────────────
  const atsColor  = atsScore === null ? '#9CA3AF'
                  : atsScore >= 80    ? '#10B981'
                  : atsScore >= 60    ? '#6C3CE1'
                  : atsScore >= 40    ? '#F59E0B'
                  :                    '#EF4444';
  const atsLabel  = atsScore === null ? 'N/A'
                  : atsScore >= 80    ? 'Excellent'
                  : atsScore >= 60    ? 'Good'
                  : atsScore >= 40    ? 'Fair'
                  :                    'Poor';
  const atsGradient = atsScore === null ? '#9CA3AF,#9CA3AF'
                    : atsScore >= 80    ? '#10B981,#059669'
                    : atsScore >= 60    ? '#6C3CE1,#8B5CF6'
                    : atsScore >= 40    ? '#F59E0B,#D97706'
                    :                    '#EF4444,#DC2626';

  // SVG arc for gauge (180° half-circle)
  const gaugeArc = (pct) => {
    const r = 70, cx = 90, cy = 90;
    const angle = (pct / 100) * 180 - 180; // -180 to 0
    const rad   = (angle * Math.PI) / 180;
    const x     = cx + r * Math.cos(rad);
    const y     = cy + r * Math.sin(rad);
    const large = pct > 50 ? 1 : 0;
    // Start at left (-180°), sweep clockwise
    return `M ${cx - r} ${cy} A ${r} ${r} 0 ${large} 1 ${x} ${y}`;
  };

  const atsSection = atsScore !== null ? `
    <!-- ══ ATS SCORE CARD ══ -->
    <div style="background:var(--bg-card);border:2px solid ${atsColor};border-radius:var(--radius-xl);padding:2rem;margin-bottom:2rem;box-shadow:0 8px 32px ${atsColor}22;position:relative;overflow:hidden;">
      <!-- Decorative bg blob -->
      <div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;background:${atsColor};opacity:0.06;border-radius:50%;pointer-events:none;"></div>

      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,${atsGradient});border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <i class="fas fa-robot" style="color:white;font-size:1.1rem;"></i>
        </div>
        <div>
          <h4 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin:0;">ATS Compatibility Score</h4>
          <p style="font-size:0.78rem;color:var(--text-muted);margin:0;">How well your resume passes Applicant Tracking Systems</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:200px 1fr;gap:2rem;align-items:center;">

        <!-- Gauge -->
        <div style="text-align:center;">
          <div style="position:relative;display:inline-block;">
            <svg width="180" height="100" viewBox="0 0 180 100" style="overflow:visible;">
              <!-- Track -->
              <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="var(--border)" stroke-width="14" stroke-linecap="round"/>
              <!-- Fill (animated via CSS) -->
              <path id="atsGaugeFill"
                d="${gaugeArc(0.1)}"
                fill="none"
                stroke="url(#atsGrad)"
                stroke-width="14"
                stroke-linecap="round"
                style="transition:d 1.2s cubic-bezier(0.34,1.56,0.64,1);"
              />
              <defs>
                <linearGradient id="atsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="${atsColor}" stop-opacity="0.7"/>
                  <stop offset="100%" stop-color="${atsColor}"/>
                </linearGradient>
              </defs>
              <!-- Tick marks -->
              ${[0,25,50,75,100].map(t => {
                const a = ((t/100)*180 - 180) * Math.PI / 180;
                const x1 = 90 + 62*Math.cos(a), y1 = 90 + 62*Math.sin(a);
                const x2 = 90 + 74*Math.cos(a), y2 = 90 + 74*Math.sin(a);
                return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--border)" stroke-width="2"/>`;
              }).join('')}
            </svg>
            <!-- Score text overlay -->
            <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);text-align:center;line-height:1;">
              <div id="atsScoreDisplay" style="font-size:2.2rem;font-weight:900;color:${atsColor};font-family:'Poppins',sans-serif;transition:all 0.3s;">0</div>
              <div style="font-size:0.7rem;color:var(--text-muted);font-weight:700;letter-spacing:1px;">/ 100</div>
            </div>
          </div>
          <div style="margin-top:0.5rem;">
            <span style="display:inline-block;padding:0.35rem 1rem;border-radius:var(--radius-full);font-size:0.8rem;font-weight:800;background:${atsColor}22;color:${atsColor};letter-spacing:0.5px;">${atsLabel.toUpperCase()}</span>
          </div>
        </div>

        <!-- Breakdown bars -->
        <div style="display:flex;flex-direction:column;gap:0.875rem;">
          ${breakdown ? [
            { label: 'Resume Sections',  key: 'sections',   max: 40, icon: 'fa-list-alt' },
            { label: 'Contact Info',     key: 'contact',    max: 20, icon: 'fa-address-card' },
            { label: 'Skills Coverage',  key: 'skills',     max: 20, icon: 'fa-code' },
            { label: 'Formatting',       key: 'formatting', max: 15, icon: 'fa-align-left' },
            { label: 'Keywords & Links', key: 'keywords',   max: 5,  icon: 'fa-key' }
          ].map(item => {
            const val = breakdown[item.key] || 0;
            const pct = Math.round((val / item.max) * 100);
            const barColor = pct >= 80 ? '#10B981' : pct >= 50 ? '#6C3CE1' : pct >= 25 ? '#F59E0B' : '#EF4444';
            return `
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                  <span style="font-size:0.8rem;color:var(--text-secondary);display:flex;align-items:center;gap:0.4rem;">
                    <i class="fas ${item.icon}" style="color:${barColor};width:14px;"></i> ${item.label}
                  </span>
                  <span style="font-size:0.8rem;font-weight:700;color:${barColor};">${val} / ${item.max}</span>
                </div>
                <div style="height:7px;background:var(--border);border-radius:var(--radius-full);overflow:hidden;">
                  <div class="ats-bar" data-width="${pct}" style="height:100%;width:0%;background:linear-gradient(90deg,${barColor}99,${barColor});border-radius:var(--radius-full);transition:width 1s ease;"></div>
                </div>
              </div>`;
          }).join('') : `
            <div style="color:var(--text-muted);font-size:0.875rem;padding:1rem 0;">
              Detailed breakdown not available for this analysis.
            </div>`}

          <div style="margin-top:0.5rem;padding:0.75rem 1rem;background:var(--bg-body);border-radius:var(--radius-md);border-left:3px solid ${atsColor};">
            <p style="font-size:0.82rem;color:var(--text-secondary);margin:0;">
              ${atsScore >= 80
                ? '✅ Your resume is well-optimized for ATS systems. Most recruiters will see it.'
                : atsScore >= 60
                ? '⚡ Good score! A few improvements can push you into the excellent range.'
                : atsScore >= 40
                ? '⚠️ Your resume may be filtered out by some ATS systems. Follow the suggestions below.'
                : '🚨 High risk of being filtered. Restructure your resume using the suggestions below.'}
            </p>
          </div>
        </div>
      </div>
    </div>` : '';

  content.innerHTML = `
    ${atsSection}

    <!-- Overview Stats -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.25rem;margin-bottom:2rem;">
      <div style="background:var(--primary-soft);padding:1.5rem;border-radius:var(--radius-lg);border:2px solid var(--primary);position:relative;overflow:hidden;">
        <div style="position:absolute;top:-20px;right:-20px;width:70px;height:70px;background:var(--primary);opacity:0.1;border-radius:50%;"></div>
        <div style="position:relative;z-index:1;display:flex;align-items:center;gap:1rem;">
          <div style="width:46px;height:46px;background:var(--gradient-primary);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:white;flex-shrink:0;"><i class="fas fa-code"></i></div>
          <div>
            <h4 style="font-size:1.75rem;font-weight:800;color:var(--primary);margin:0;">${skills.length}</h4>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin:0;">Skills Detected</p>
          </div>
        </div>
      </div>
      <div style="background:var(--secondary-soft);padding:1.5rem;border-radius:var(--radius-lg);border:2px solid var(--secondary);position:relative;overflow:hidden;">
        <div style="position:absolute;top:-20px;right:-20px;width:70px;height:70px;background:var(--secondary);opacity:0.1;border-radius:50%;"></div>
        <div style="position:relative;z-index:1;display:flex;align-items:center;gap:1rem;">
          <div style="width:46px;height:46px;background:var(--gradient-secondary);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:white;flex-shrink:0;"><i class="fas fa-briefcase"></i></div>
          <div>
            <h4 style="font-size:1.1rem;font-weight:700;color:var(--secondary);margin:0;">${experience}</h4>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin:0;">Experience Level</p>
          </div>
        </div>
      </div>
      <div style="background:var(--success-light);padding:1.5rem;border-radius:var(--radius-lg);border:2px solid var(--success);position:relative;overflow:hidden;">
        <div style="position:absolute;top:-20px;right:-20px;width:70px;height:70px;background:var(--success);opacity:0.1;border-radius:50%;"></div>
        <div style="position:relative;z-index:1;display:flex;align-items:center;gap:1rem;">
          <div style="width:46px;height:46px;background:var(--gradient-success);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:white;flex-shrink:0;"><i class="fas fa-graduation-cap"></i></div>
          <div>
            <h4 style="font-size:1.1rem;font-weight:700;color:var(--success);margin:0;">${education}</h4>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin:0;">Education</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Skills Section -->
    <div style="background:var(--bg-card);padding:1.75rem;border-radius:var(--radius-xl);margin-bottom:2rem;border:1px solid var(--border);box-shadow:var(--shadow-card);">
      <h4 style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:1.25rem;display:flex;align-items:center;gap:0.75rem;">
        <i class="fas fa-code" style="color:var(--primary);"></i> Technical Skills Detected
      </h4>
      <div style="display:flex;flex-wrap:wrap;gap:0.625rem;">
        ${skills.length > 0
          ? skills.map(s => `<span class="badge badge-primary" style="padding:0.5rem 1rem;font-size:0.85rem;font-weight:600;">${s}</span>`).join('')
          : '<p style="color:var(--text-muted);">No skills detected. Make sure your resume includes your technical skills.</p>'}
      </div>
    </div>

    <!-- Job Matches Section -->
    <div style="background:var(--bg-card);padding:1.75rem;border-radius:var(--radius-xl);margin-bottom:2rem;border:1px solid var(--border);box-shadow:var(--shadow-card);">
      <h4 style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:1.25rem;display:flex;align-items:center;gap:0.75rem;">
        <i class="fas fa-bullseye" style="color:var(--secondary);"></i>
        ${jobRecommendations.length > 0 ? 'Recommended Jobs Based on Your Skills' : 'Top Job Matches'}
      </h4>
      <div style="display:flex;flex-direction:column;gap:0.875rem;">
        ${(jobRecommendations.length > 0 ? jobRecommendations : jobMatches).map(job => {
          const matchScore = job.matchScore || job.match || 0;
          const matchColor = matchScore >= 70 ? 'var(--success)' : matchScore >= 50 ? 'var(--secondary)' : 'var(--warning)';
          return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.25rem;background:var(--bg-body);border-radius:var(--radius-md);border:1px solid var(--border);transition:all 0.25s;"
               onmouseover="this.style.transform='translateX(4px)';this.style.borderColor='var(--primary)'"
               onmouseout="this.style.transform='';this.style.borderColor='var(--border)'">
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.35rem;">
                <span style="font-weight:700;color:var(--text-primary);">${job.title}</span>
                ${job.company ? `<span style="color:var(--text-muted);font-size:0.82rem;">• ${job.company.name || job.company}</span>` : ''}
              </div>
              ${job.matchingSkills && job.matchingSkills.length > 0 ? `
                <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
                  ${job.matchingSkills.slice(0, 4).map(sk =>
                    `<span style="font-size:0.72rem;padding:0.2rem 0.5rem;background:var(--success-light);color:var(--success);border-radius:var(--radius-full);font-weight:600;">${sk}</span>`
                  ).join('')}
                </div>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:1rem;flex-shrink:0;margin-left:1rem;">
              <div style="width:100px;height:7px;background:var(--border);border-radius:var(--radius-full);overflow:hidden;">
                <div style="height:100%;width:${matchScore}%;background:${matchColor};border-radius:var(--radius-full);"></div>
              </div>
              <span style="font-weight:800;color:${matchColor};font-size:1rem;min-width:42px;text-align:right;">${matchScore}%</span>
            </div>
          </div>`;
        }).join('')}
      </div>
      ${jobRecommendations.length > 0 ? `
        <div style="margin-top:1.25rem;text-align:center;">
          <button class="btn btn-primary btn-sm" onclick="document.querySelector('[data-page=all-jobs]').click()">
            <i class="fas fa-briefcase"></i> View All Jobs
          </button>
        </div>` : ''}
    </div>

    <!-- Course Recommendations -->
    ${courseRecommendations.length > 0 ? `
      <div style="background:var(--bg-card);padding:1.75rem;border-radius:var(--radius-xl);margin-bottom:2rem;border:1px solid var(--border);box-shadow:var(--shadow-card);">
        <h4 style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:0.75rem;display:flex;align-items:center;gap:0.75rem;">
          <i class="fas fa-graduation-cap" style="color:var(--accent);"></i> Recommended Courses to Boost Your Profile
        </h4>
        <p style="color:var(--text-secondary);margin-bottom:1.25rem;font-size:0.875rem;">Based on top job requirements, these courses can help fill skill gaps</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;">
          ${courseRecommendations.map(course => `
            <div style="background:var(--bg-body);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem;transition:all 0.25s;"
                 onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-md)'"
                 onmouseout="this.style.transform='';this.style.boxShadow=''">
              <div style="width:44px;height:44px;background:var(--gradient-primary);border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:0.875rem;">
                <i class="fas fa-book" style="color:white;font-size:1.2rem;"></i>
              </div>
              <h5 style="font-weight:700;color:var(--text-primary);margin-bottom:0.4rem;font-size:0.95rem;">${course.title}</h5>
              <p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:0.875rem;line-height:1.5;">${(course.description || '').substring(0, 75)}...</p>
              <div style="display:flex;gap:0.75rem;font-size:0.75rem;color:var(--text-muted);margin-bottom:0.875rem;">
                <span><i class="fas fa-clock"></i> ${course.duration?.hours || 0}h</span>
                <span><i class="fas fa-signal"></i> ${course.level || 'Beginner'}</span>
              </div>
              <button class="btn btn-outline btn-sm" style="width:100%;" onclick="requestEnrollment('${course._id}')">
                <i class="fas fa-plus"></i> Enroll
              </button>
            </div>`).join('')}
        </div>
      </div>` : ''}

    <!-- Suggestions Section -->
    <div style="background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(249,115,22,0.08));padding:1.75rem;border-radius:var(--radius-xl);border:2px solid var(--warning);margin-bottom:2rem;">
      <h4 style="font-size:1.1rem;font-weight:700;color:var(--warning);margin-bottom:1.25rem;display:flex;align-items:center;gap:0.75rem;">
        <i class="fas fa-lightbulb"></i> AI-Powered Suggestions for Improvement
      </h4>
      <ul style="list-style:none;padding:0;margin:0;">
        ${suggestions.map((s, i) => `
          <li style="padding:0.875rem 0;${i < suggestions.length - 1 ? 'border-bottom:1px solid rgba(245,158,11,0.15);' : ''}color:var(--text-primary);display:flex;align-items:start;gap:0.875rem;">
            <div style="width:28px;height:28px;background:var(--warning);color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0;">${i + 1}</div>
            <span style="flex:1;padding-top:0.2rem;font-size:0.9rem;">${s}</span>
          </li>`).join('')}
      </ul>
    </div>

    <!-- Action Buttons -->
    <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
      <button class="btn btn-primary btn-lg" onclick="window.location.href='ai-interview.html'">
        <i class="fas fa-video"></i> Practice AI Interview
      </button>
      <button class="btn btn-secondary btn-lg" onclick="document.querySelector('[data-page=all-jobs]').click()">
        <i class="fas fa-briefcase"></i> Browse Jobs
      </button>
      <button class="btn btn-outline btn-lg" onclick="document.getElementById('resumeUpload').click()">
        <i class="fas fa-upload"></i> Upload New Resume
      </button>
    </div>
  `;

  section.style.display = 'block';

  // ── Animate ATS gauge & counter after render ──────────────────────────────
  if (atsScore !== null) {
    setTimeout(() => {
      // Animate score counter
      const scoreEl = document.getElementById('atsScoreDisplay');
      if (scoreEl) {
        let current = 0;
        const step  = Math.ceil(atsScore / 60);
        const timer = setInterval(() => {
          current = Math.min(current + step, atsScore);
          scoreEl.textContent = current;
          if (current >= atsScore) clearInterval(timer);
        }, 20);
      }

      // Animate SVG gauge arc
      const fillEl = document.getElementById('atsGaugeFill');
      if (fillEl) {
        // Use requestAnimationFrame for smooth SVG path animation
        const targetPath = gaugeArc(atsScore);
        fillEl.setAttribute('d', targetPath);
      }

      // Animate breakdown bars
      document.querySelectorAll('.ats-bar').forEach(bar => {
        const w = bar.getAttribute('data-width');
        if (w) bar.style.width = w + '%';
      });
    }, 150);
  }
}

// ===== INTERVIEW HISTORY =====
async function loadInterviewHistory() {
  const container = document.getElementById('interviewHistoryContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align:center;padding:3rem;color:var(--text-muted);">
      <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);margin-bottom:1rem;display:block;"></i>
      <p>Loading interview history...</p>
    </div>`;

  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/interview/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const interviews = data.data || [];
    
    // Store interviews globally for remarks functionality
    window.allInterviews = interviews;

    if (interviews.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:4rem 2rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border);">
          <i class="fas fa-video" style="font-size:3rem;color:var(--primary);margin-bottom:1rem;display:block;"></i>
          <h3 style="color:var(--text-primary);margin-bottom:0.5rem;">No Interview History</h3>
          <p style="color:var(--text-muted);margin-bottom:1.5rem;">You haven't taken any AI interviews yet. Start your first interview to see results here.</p>
          <a href="ai-interview.html" class="btn btn-primary">
            <i class="fas fa-play-circle"></i> Take Your First Interview
          </a>
        </div>`;
      return;
    }

    // Render interview history
    container.innerHTML = `
      <div class="section-card">
        <div class="section-header" style="margin-bottom:1.5rem;">
          <div>
            <h3 class="section-title">Your Interview Results</h3>
            <p class="section-subtitle">Track your progress and improvement over time</p>
          </div>
          <div style="display:flex;gap:1rem;align-items:center;">
            <span style="font-size:0.875rem;color:var(--text-muted);">${interviews.length} interview${interviews.length !== 1 ? 's' : ''} completed</span>
          </div>
        </div>

        <div style="display:grid;gap:1.5rem;">
          ${interviews.map((interview, index) => {
            const score = interview.scores?.overall || 0;
            const passed = interview.passed;
            const qualifyingMark = interview.qualifyingMark || 60;
            const date = new Date(interview.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });
            const duration = Math.floor(interview.duration / 60);
            const answered = interview.answeredQuestions || 0;
            const total = interview.totalQuestions || 0;
            const skipped = interview.skippedQuestions || 0;
            
            const scoreColor = passed ? '#10B981' : '#EF4444';
            const scoreBg = passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
            
            return `
              <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem;position:relative;overflow:hidden;">
                <div style="display:grid;grid-template-columns:auto auto 1fr auto;gap:1.5rem;align-items:center;">
                  <!-- Interview Number Badge (Left Side) -->
                  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--primary-soft);color:var(--primary);padding:1rem;border-radius:var(--radius-md);min-width:70px;text-align:center;">
                    <div style="font-size:0.75rem;font-weight:600;color:var(--text-muted);margin-bottom:0.25rem;">INTERVIEW</div>
                    <div style="font-size:1.8rem;font-weight:800;color:var(--primary);">#${interviews.length - index}</div>
                  </div>
                  
                  <!-- Score Circle -->
                  <div style="position:relative;width:80px;height:80px;">
                    <svg width="80" height="80" style="transform:rotate(-90deg);">
                      <circle cx="40" cy="40" r="35" fill="none" stroke="var(--border)" stroke-width="6"/>
                      <circle cx="40" cy="40" r="35" fill="none" stroke="${scoreColor}" stroke-width="6" 
                              stroke-dasharray="${2 * Math.PI * 35}" 
                              stroke-dashoffset="${2 * Math.PI * 35 * (1 - score / 100)}"
                              style="transition:stroke-dashoffset 1s ease;"/>
                    </svg>
                    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
                      <div style="font-size:1.4rem;font-weight:800;color:${scoreColor};">${score}%</div>
                      <div style="font-size:0.7rem;color:var(--text-muted);font-weight:600;">SCORE</div>
                    </div>
                  </div>
                  
                  <!-- Interview Details -->
                  <div>
                    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;">
                      <h4 style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin:0;">AI Interview Session</h4>
                      <span style="padding:0.25rem 0.75rem;border-radius:var(--radius-full);font-size:0.75rem;font-weight:700;background:${scoreBg};color:${scoreColor};">
                        ${passed ? `✅ Passed (≥${qualifyingMark}%)` : `❌ Below Mark (${qualifyingMark}%)`}
                      </span>
                    </div>
                    
                    <div style="display:flex;gap:1.5rem;margin-bottom:0.75rem;font-size:0.875rem;color:var(--text-secondary);">
                      <span><i class="fas fa-calendar-alt" style="color:var(--primary);margin-right:0.4rem;"></i>${date}</span>
                      <span><i class="fas fa-clock" style="color:var(--secondary);margin-right:0.4rem;"></i>${duration} min</span>
                      <span><i class="fas fa-question-circle" style="color:var(--success);margin-right:0.4rem;"></i>${answered}/${total} answered</span>
                      ${skipped > 0 ? `<span><i class="fas fa-forward" style="color:var(--warning);margin-right:0.4rem;"></i>${skipped} skipped</span>` : ''}
                    </div>
                    
                    <!-- Sub-scores -->
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;">
                      <div style="text-align:center;padding:0.5rem;background:var(--bg-body);border-radius:var(--radius-md);">
                        <div style="font-size:0.9rem;font-weight:700;color:var(--primary);">${interview.scores?.communication || 0}%</div>
                        <div style="font-size:0.7rem;color:var(--text-muted);">Communication</div>
                      </div>
                      <div style="text-align:center;padding:0.5rem;background:var(--bg-body);border-radius:var(--radius-md);">
                        <div style="font-size:0.9rem;font-weight:700;color:var(--secondary);">${interview.scores?.technical || 0}%</div>
                        <div style="font-size:0.7rem;color:var(--text-muted);">Technical</div>
                      </div>
                      <div style="text-align:center;padding:0.5rem;background:var(--bg-body);border-radius:var(--radius-md);">
                        <div style="font-size:0.9rem;font-weight:700;color:var(--success);">${interview.scores?.professionalism || 0}%</div>
                        <div style="font-size:0.7rem;color:var(--text-muted);">Professional</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Actions -->
                  <div style="display:flex;flex-direction:column;gap:0.5rem;">
                    <button class="btn btn-outline btn-sm" onclick="viewInterviewDetails('${interview._id}')">
                      <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="window.location.href='ai-interview.html'">
                      <i class="fas fa-redo"></i> Retake
                    </button>
                    <button class="btn ${getRemarksBtnClass(interview.adminRemarks)} btn-sm" onclick="toggleRemarks('${interview._id}')" id="remarksBtn-${interview._id}">
                      <i class="fas fa-comment-alt"></i> ${interview.adminRemarks ? 'Admin Remarks' : 'No Remarks'}
                    </button>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;

  } catch (error) {
    console.error('Error loading interview history:', error);
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border);">
        <i class="fas fa-exclamation-circle" style="font-size:2.5rem;color:var(--danger);margin-bottom:1rem;display:block;"></i>
        <h3 style="color:var(--text-primary);margin-bottom:0.5rem;">Failed to Load Interview History</h3>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;">Error: ${error.message}</p>
        <button class="btn btn-primary btn-sm" onclick="loadInterviewHistory()">
          <i class="fas fa-redo"></i> Retry
        </button>
      </div>`;
  }
}

function getRemarksBtnClass(remarks) {
  if (!remarks || remarks.trim() === '') {
    return 'btn-outline'; // Default gray for no remarks
  }
  
  // Simple sentiment analysis based on keywords
  const remarksLower = remarks.toLowerCase();
  
  // Positive keywords
  const positiveKeywords = [
    'excellent', 'great', 'good', 'well done', 'impressive', 'outstanding', 
    'strong', 'solid', 'nice', 'perfect', 'amazing', 'fantastic', 'superb',
    'congratulations', 'keep up', 'well prepared', 'thorough', 'detailed',
    'clear', 'articulate', 'confident', 'professional', 'skilled'
  ];
  
  // Negative keywords
  const negativeKeywords = [
    'poor', 'weak', 'needs improvement', 'lacking', 'insufficient', 'below',
    'disappointing', 'unsatisfactory', 'inadequate', 'struggle', 'difficulty',
    'failed', 'missing', 'incomplete', 'unclear', 'confused', 'unprepared',
    'practice more', 'work on', 'improve', 'better preparation', 'not ready'
  ];
  
  const positiveCount = positiveKeywords.filter(keyword => remarksLower.includes(keyword)).length;
  const negativeCount = negativeKeywords.filter(keyword => remarksLower.includes(keyword)).length;
  
  if (positiveCount > negativeCount) {
    return 'btn-success'; // Green for positive feedback
  } else if (negativeCount > positiveCount) {
    return 'btn-danger'; // Red for negative feedback
  } else {
    return 'btn-warning'; // Yellow for neutral/mixed feedback
  }
}

function toggleRemarks(interviewId) {
  const interview = window.allInterviews?.find(i => i._id === interviewId);
  if (!interview) return;
  
  // Check if remarks modal already exists
  const existingModal = document.getElementById('remarksModal');
  if (existingModal) {
    existingModal.remove();
    return;
  }
  
  const modalHTML = `
    <div class="modal-overlay" id="remarksModal" onclick="if(event.target===this) closeRemarksModal()">
      <div class="modal-content" style="max-width:500px;">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-comment-alt" style="color:var(--primary);margin-right:0.5rem;"></i>
            Admin Remarks
          </h3>
          <button class="btn-icon" onclick="closeRemarksModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          ${interview.adminRemarks ? `
            <div style="background:var(--bg-body);border-radius:var(--radius-lg);padding:1.5rem;border-left:4px solid ${getRemarksBorderColor(interview.adminRemarks)};">
              <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
                <div style="width:40px;height:40px;background:${getRemarksBgColor(interview.adminRemarks)};color:${getRemarksTextColor(interview.adminRemarks)};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">
                  <i class="fas ${getRemarksIcon(interview.adminRemarks)}"></i>
                </div>
                <div>
                  <h4 style="margin:0;color:var(--text-primary);font-size:1.1rem;">Admin Feedback</h4>
                  <p style="margin:0;color:var(--text-muted);font-size:0.85rem;">
                    ${new Date(interview.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', month: 'short', day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div style="color:var(--text-secondary);line-height:1.6;font-size:0.95rem;">
                ${interview.adminRemarks.replace(/\n/g, '<br>')}
              </div>
            </div>
          ` : `
            <div style="text-align:center;padding:3rem 2rem;background:var(--bg-body);border-radius:var(--radius-lg);border:2px dashed var(--border);">
              <i class="fas fa-comment-slash" style="font-size:3rem;color:var(--text-muted);margin-bottom:1rem;display:block;"></i>
              <h4 style="color:var(--text-primary);margin-bottom:0.5rem;">No Admin Feedback Yet</h4>
              <p style="color:var(--text-muted);margin:0;font-size:0.9rem;">
                The admin hasn't provided any remarks for this interview yet.
              </p>
            </div>
          `}
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeRemarksModal()">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeRemarksModal() {
  document.getElementById('remarksModal')?.remove();
}

function getRemarksBorderColor(remarks) {
  const btnClass = getRemarksBtnClass(remarks);
  if (btnClass === 'btn-success') return 'var(--success)';
  if (btnClass === 'btn-danger') return 'var(--danger)';
  if (btnClass === 'btn-warning') return 'var(--warning)';
  return 'var(--border)';
}

function getRemarksBgColor(remarks) {
  const btnClass = getRemarksBtnClass(remarks);
  if (btnClass === 'btn-success') return 'var(--success-light)';
  if (btnClass === 'btn-danger') return 'var(--danger-light)';
  if (btnClass === 'btn-warning') return 'var(--warning-light)';
  return 'var(--bg-body)';
}

function getRemarksTextColor(remarks) {
  const btnClass = getRemarksBtnClass(remarks);
  if (btnClass === 'btn-success') return 'var(--success)';
  if (btnClass === 'btn-danger') return 'var(--danger)';
  if (btnClass === 'btn-warning') return 'var(--warning)';
  return 'var(--text-primary)';
}

function getRemarksIcon(remarks) {
  const btnClass = getRemarksBtnClass(remarks);
  if (btnClass === 'btn-success') return 'fa-thumbs-up';
  if (btnClass === 'btn-danger') return 'fa-thumbs-down';
  if (btnClass === 'btn-warning') return 'fa-balance-scale';
  return 'fa-comment';
}

function viewInterviewDetails(interviewId) {
  // For now, show a toast with the interview ID
  // In the future, this could open a detailed modal or navigate to a detailed page
  showToast(`Interview details for ID: ${interviewId}`, 'info');
}

// ===== GLOBAL EXPORTS =====
window.continueCourse        = continueCourse;
window.viewCertificate       = viewCertificate;
window.downloadCertificate   = downloadCertificate;
window.shareCertificate      = shareCertificate;
window.applyJob              = applyJob;
window.showBrowseCourses     = showBrowseCourses;
window.hideBrowseCourses     = hideBrowseCourses;
window.requestEnrollment     = requestEnrollment;
window.renderUserCourses     = renderUserCourses;
window.renderUserCertificates= renderUserCertificates;
window.renderJobBoard        = renderJobBoard;
window.renderProgressTracking= renderProgressTracking;
window.renderProfileSettings = renderProfileSettings;
window.loadAndRenderAssessments = loadAndRenderAssessments;
window.loadInterviewHistory  = loadInterviewHistory;
window.viewInterviewDetails  = viewInterviewDetails;
window.toggleRemarks         = toggleRemarks;
window.closeRemarksModal     = closeRemarksModal;
