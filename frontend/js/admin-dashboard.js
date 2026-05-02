// ===== NEXTSTEP AI – ADMIN DASHBOARD COMPLETE =====

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeAdminDashboard();
});

function initializeAdminDashboard() {
  // Load initial data
  loadDashboardData();
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup interview filters
  setupInterviewFilters();
}

// ===== DATA LOADING =====
async function loadDashboardData() {
  try {
    const token = getAuthToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Load users
    const usersRes = await fetch(`${API_URL}/users`, { headers });
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      window.allUsers = usersData.data || [];
      renderUsersTable(window.allUsers);
      // Update Total Students count (filter for student role)
      const studentCount = window.allUsers.filter(u => u.role === 'student').length;
      document.getElementById('total-users').textContent = studentCount;
    }
    
    // Load courses
    const coursesRes = await fetch(`${API_URL}/courses`);
    if (coursesRes.ok) {
      const coursesData = await coursesRes.json();
      window.allCourses = coursesData.data || [];
      
      // Add enrollment counts to courses (will be calculated after enrollments are loaded)
      renderCoursesTable(window.allCourses);
      // Update Total Courses count
      document.getElementById('total-courses').textContent = window.allCourses.length;
    }
    
    // Load jobs (admin gets all, including inactive)
    const jobsRes = await fetch(`${API_URL}/jobs?all=true`, { headers });
    if (jobsRes.ok) {
      const jobsData = await jobsRes.json();
      window.allJobs = jobsData.data || [];
      renderJobsTable(window.allJobs);
    }
    
    // Load assessments
    const assessmentsRes = await fetch(`${API_URL}/assessments`, { headers });
    if (assessmentsRes.ok) {
      const assessmentsData = await assessmentsRes.json();
      window.allAssessments = assessmentsData.data || [];
      renderAssessmentsTable(window.allAssessments);
    }
    
    // Load enrollments
    const enrollmentsRes = await fetch(`${API_URL}/enrollments`, { headers });
    if (enrollmentsRes.ok) {
      const enrollmentsData = await enrollmentsRes.json();
      window.allEnrollments = enrollmentsData.data || [];
      renderEnrollmentsTable(window.allEnrollments);
      renderRecentEnrollments(window.allEnrollments);
      // Update Total Enrollments count
      document.getElementById('total-enrollments-count').textContent = window.allEnrollments.length;
      
      // Calculate and add enrollment counts to courses
      if (window.allCourses && window.allCourses.length > 0) {
        window.allCourses.forEach(course => {
          const enrollmentCount = window.allEnrollments.filter(e => {
            const courseId = e.course?._id || e.course;
            return String(courseId) === String(course._id);
          }).length;
          course.enrollmentCount = enrollmentCount;
        });
        
        // Re-render courses table with enrollment counts
        renderCoursesTable(window.allCourses);
      }
    }

    // Load certificates (issued + pending requests)
    if (typeof loadCertificateData === 'function') {
      await loadCertificateData();
    } else {
      const certsRes = await fetch(`${API_URL}/certificates`, { headers });
      if (certsRes.ok) {
        const certsData = await certsRes.json();
        window.allCertificates = certsData.data || [];
        const totalCertsEl = document.getElementById('total-certificates');
        if (totalCertsEl) totalCertsEl.textContent = window.allCertificates.length;
      }
    }

    // Load interviews
    if (typeof loadInterviewData === 'function') {
      await loadInterviewData();
    }

  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Add User button
  const addUserBtn = document.getElementById('addUserBtn');
  if (addUserBtn) {
    addUserBtn.addEventListener('click', () => openUserModal());
  }
  
  // Add Course button
  const addCourseBtn = document.getElementById('addCourseBtn');
  if (addCourseBtn) {
    addCourseBtn.addEventListener('click', () => openCourseModal());
  }
  
  // Add Job button
  const addJobBtn = document.getElementById('addJobBtn');
  if (addJobBtn) {
    addJobBtn.addEventListener('click', () => openJobModal());
  }
  
  // Add Assessment button
  const addAssessmentBtn = document.getElementById('addAssessmentBtn');
  if (addAssessmentBtn) {
    addAssessmentBtn.addEventListener('click', () => openAssessmentModal());
  }

  // Issue Certificate button
  const issueCertBtn = document.getElementById('issueCertBtn');
  if (issueCertBtn) {
    issueCertBtn.addEventListener('click', () => openIssueCertModal());
  }
  
  // Search functionality
  const searchInputs = document.querySelectorAll('.search-input');
  searchInputs.forEach(input => {
    input.addEventListener('input', (e) => handleSearch(e.target.value, e.target.dataset.type));
  });
}

// ===== USERS MANAGEMENT =====
function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">No users found</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>
        <div class="table-user">
          <div class="avatar avatar-sm" style="background:linear-gradient(135deg,#6C3CE1,#8B5CF6)">
            ${user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="table-user-name">${user.name}</div>
            <div class="table-user-id">${user.email}</div>
          </div>
        </div>
      </td>
      <td><span class="badge ${user.role === 'admin' ? 'badge-primary' : 'badge-info'}">${user.role}</span></td>
      <td>${new Date(user.createdAt).toLocaleDateString()}</td>
      <td>${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
      <td><span class="badge ${user.isActive ? 'badge-success' : 'badge-danger'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-icon btn-sm" onclick="viewUser('${user._id}')" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon btn-sm" onclick="editUser('${user._id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon btn-sm" onclick="deleteUser('${user._id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openUserModal(userId = null) {
  const isEdit = !!userId;
  const user = isEdit ? window.allUsers.find(u => u._id === userId) : null;
  
  const modalHTML = `
    <div class="modal-overlay" id="userModal" onclick="if(event.target===this) closeUserModal()">
      <div class="modal-content" style="max-width:500px;">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Edit User' : 'Add New User'}</h3>
          <button class="btn-icon" onclick="closeUserModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="userForm" onsubmit="handleUserSubmit(event, '${userId || ''}')">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" class="form-control" name="name" value="${user?.name || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" class="form-control" name="email" value="${user?.email || ''}" required>
            </div>
            ${!isEdit ? `
            <div class="form-group">
              <label class="form-label">Password *</label>
              <input type="password" class="form-control" name="password" required minlength="6">
            </div>
            ` : ''}
            <div class="form-group">
              <label class="form-label">Role *</label>
              <select class="form-control" name="role" required>
                <option value="user" ${user?.role === 'user' ? 'selected' : ''}>Student</option>
                <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="closeUserModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Create'} User
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeUserModal() {
  document.getElementById('userModal')?.remove();
}

async function handleUserSubmit(event, userId) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role')
  };
  if (!userId) data.password = formData.get('password');
  
  try {
    const token = getAuthToken();
    const url = userId ? `${API_URL}/users/${userId}` : `${API_URL}/auth/register`;
    const method = userId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      showToast(`User ${userId ? 'updated' : 'created'} successfully!`, 'success');
      closeUserModal();
      loadDashboardData();
    } else {
      const error = await response.json();
      showToast(error.message || 'Failed to save user', 'error');
    }
  } catch (error) {
    showToast('Error saving user', 'error');
  }
}

function viewUser(userId) {
  const user = window.allUsers.find(u => u._id === userId);
  if (user) {
    showToast(`${user.name} | ${user.email} | ${user.role}`, 'info');
  }
}

function editUser(userId) {
  openUserModal(userId);
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      showToast('User deleted successfully', 'success');
      loadDashboardData();
    } else {
      showToast('Failed to delete user', 'error');
    }
  } catch (error) {
    showToast('Error deleting user', 'error');
  }
}

// ===== COURSES MANAGEMENT =====
function renderCoursesTable(courses) {
  const tbody = document.getElementById('coursesTableBody');
  if (!tbody) return;
  
  if (courses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">No courses found</td></tr>';
    return;
  }
  
  tbody.innerHTML = courses.map(course => `
    <tr>
      <td>
        <div class="table-user">
          <div class="course-thumb-mini" style="background:linear-gradient(135deg,#06B6D4,#0891B2);width:48px;height:48px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem;">
            <i class="fas fa-book"></i>
          </div>
          <div>
            <div class="table-user-name">${course.title || 'Untitled Course'}</div>
            <div class="table-user-id">${course.category || 'General'}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-info">${course.level || 'Beginner'}</span></td>
      <td>${course.duration?.hours || course.duration || 0} hours</td>
      <td>${course.enrollmentCount || 0}</td>
      <td><span class="badge ${course.isPublished ? 'badge-success' : 'badge-warning'}">${course.isPublished ? 'Published' : 'Draft'}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-icon btn-sm" onclick="viewCourse('${course._id}')" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon btn-sm" onclick="editCourse('${course._id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon btn-sm" onclick="deleteCourse('${course._id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openCourseModal(courseId = null) {
  const isEdit = !!courseId;
  const course = isEdit ? window.allCourses.find(c => c._id === courseId) : null;
  
  const modalHTML = `
    <div class="modal-overlay" id="courseModal" onclick="if(event.target===this) closeCourseModal()">
      <div class="modal-content" style="max-width:600px;">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Edit Course' : 'Add New Course'}</h3>
          <button class="btn-icon" onclick="closeCourseModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="courseForm" onsubmit="handleCourseSubmit(event, '${courseId || ''}')">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Course Title *</label>
              <input type="text" class="form-control" name="title" value="${course?.title || ''}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-control" name="description" rows="3">${course?.description || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Category *</label>
              <select class="form-control" name="category" required>
                <option value="">Select Category</option>
                <option value="Programming" ${course?.category === 'Programming' ? 'selected' : ''}>Programming</option>
                <option value="Data Science" ${course?.category === 'Data Science' ? 'selected' : ''}>Data Science</option>
                <option value="Web Development" ${course?.category === 'Web Development' ? 'selected' : ''}>Web Development</option>
                <option value="Machine Learning" ${course?.category === 'Machine Learning' ? 'selected' : ''}>Machine Learning</option>
                <option value="AI" ${course?.category === 'AI' ? 'selected' : ''}>AI</option>
                <option value="Other" ${course?.category === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Level *</label>
              <select class="form-control" name="level" required>
                <option value="Beginner" ${course?.level === 'Beginner' ? 'selected' : ''}>Beginner</option>
                <option value="Intermediate" ${course?.level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                <option value="Advanced" ${course?.level === 'Advanced' ? 'selected' : ''}>Advanced</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Duration (hours) *</label>
              <input type="number" class="form-control" name="duration" value="${course?.duration?.hours || ''}" required min="1">
            </div>
            <div class="form-group">
              <label class="form-label">Price ($)</label>
              <input type="number" class="form-control" name="price" value="${course?.price || 0}" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
                <input type="checkbox" name="isPublished" ${course?.isPublished ? 'checked' : ''}>
                <span>Publish Course</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="closeCourseModal()">Cancel</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Create'} Course
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeCourseModal() {
  document.getElementById('courseModal')?.remove();
}

async function handleCourseSubmit(event, courseId) {
  event.preventDefault();
  
  const token = getAuthToken();
  if (!token) {
    alert('You are not logged in! Please login first.');
    return;
  }
  
  const user = getUserData();
  if (!user || user.role !== 'admin') {
    alert('You must be an admin to create courses! Current role: ' + (user?.role || 'none'));
    return;
  }
  
  const formData = new FormData(event.target);
  const durationHours = parseInt(formData.get('duration'));
  
  const data = {
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    level: formData.get('level'),
    duration: {
      hours: durationHours || 0,
      minutes: 0
    },
    isFree: parseFloat(formData.get('price')) === 0,
    isPublished: formData.get('isPublished') === 'on'
  };
  
  console.log('Submitting course data:');
  console.log('- Duration input value:', formData.get('duration'));
  console.log('- Parsed duration hours:', durationHours);
  console.log('- Full data object:', data);
  console.log('- Auth token:', token ? 'Present' : 'Missing');
  console.log('- User role:', user?.role);
  
  try {
    const url = courseId ? `${API_URL}/courses/${courseId}` : `${API_URL}/courses`;
    const method = courseId ? 'PUT' : 'POST';
    
    console.log('Request URL:', url);
    console.log('Request method:', method);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    console.log('Response status:', response.status);
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    if (response.ok) {
      showToast(`Course ${courseId ? 'updated' : 'created'} successfully!`, 'success');
      closeCourseModal();
      loadDashboardData();
    } else {
      console.error('Server error response:', responseData);
      showToast(responseData.message || 'Failed to save course', 'error');
    }
  } catch (error) {
    console.error('Course save error:', error);
    showToast('Error saving course: ' + error.message, 'error');
  }
}

function viewCourse(courseId) {
  const course = window.allCourses.find(c => c._id === courseId);
  if (course) {
    const hours = course.duration?.hours || course.duration || 0;
    showToast(`Course: ${course.title} | ${course.level} | ${hours}h`, 'info');
  }
}

function editCourse(courseId) {
  openCourseModal(courseId);
}

async function deleteCourse(courseId) {
  if (!confirm('Are you sure you want to delete this course?')) return;
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/courses/${courseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      showToast('Course deleted successfully', 'success');
      loadDashboardData();
    } else {
      showToast('Failed to delete course', 'error');
    }
  } catch (error) {
    showToast('Error deleting course', 'error');
  }
}

// ===== JOBS MANAGEMENT =====
// All job functions (openJobModal, closeJobModal, handleJobSubmit, editJob, deleteJob,
// renderJobsTable, viewJobApplications, updateApplicationStatus) are defined in admin-jobs.js
// which loads after this file. Do NOT redefine them here.

// ===== ASSESSMENTS MANAGEMENT =====
// Moved to admin-assessments.js — functions: renderAssessmentsTable, openAssessmentModal,
// closeAssessmentModal, handleAssessmentSubmit, editAssessment, deleteAssessment,
// openQuestionsModal, closeQuestionsModal, handleAddQuestion, deleteQuestion

// ===== SEARCH FUNCTIONALITY =====
function handleSearch(query, type) {
  query = query.toLowerCase();
  
  switch(type) {
    case 'users':
      const filteredUsers = window.allUsers.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
      );
      renderUsersTable(filteredUsers);
      break;
      
    case 'courses':
      const filteredCourses = window.allCourses.filter(c => 
        (c.title || '').toLowerCase().includes(query) || 
        (c.category || '').toLowerCase().includes(query)
      );
      renderCoursesTable(filteredCourses);
      break;
      
    case 'jobs':
      const filteredJobs = window.allJobs.filter(j => 
        (j.title || '').toLowerCase().includes(query) || 
        (j.company || '').toLowerCase().includes(query)
      );
      renderJobsTable(filteredJobs);
      break;
      
    case 'assessments':
      const filteredAssessments = window.allAssessments.filter(a => 
        (a.title || '').toLowerCase().includes(query) || 
        (a.category || '').toLowerCase().includes(query)
      );
      renderAssessmentsTable(filteredAssessments);
      break;

    case 'certificates':
      const filteredCerts = (window.allCertificates || []).filter(c =>
        (c.user?.name || '').toLowerCase().includes(query) ||
        (c.course?.title || '').toLowerCase().includes(query) ||
        (c.certificateId || '').toLowerCase().includes(query)
      );
      renderCertificatesTable(filteredCerts);
      break;

    case 'interviews':
      const filteredInterviews = (window.allInterviews || []).filter(i =>
        (i.user?.name || '').toLowerCase().includes(query) ||
        (i.user?.email || '').toLowerCase().includes(query)
      );
      renderInterviewsTable(filteredInterviews);
      break;
  }
}

// ===== CHARTS INITIALIZATION =====
function initializeCharts() {
  // Charts are already initialized in dashboard.js
  // This is a placeholder for additional admin-specific charts
}

// Make functions globally available
window.viewUser = viewUser;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.viewCourse = viewCourse;
window.editCourse = editCourse;
window.deleteCourse = deleteCourse;
window.closeCourseModal = closeCourseModal;
window.handleCourseSubmit = handleCourseSubmit;
window.closeUserModal = closeUserModal;
window.handleUserSubmit = handleUserSubmit;
window.closeAssessmentModal = closeAssessmentModal;
window.handleAssessmentSubmit = handleAssessmentSubmit;


// ===== ENROLLMENT MANAGEMENT =====
function renderEnrollmentsTable(enrollments) {
  const container = document.getElementById('enrollmentsContainer');
  if (!container) return;
  
  const pendingEnrollments = enrollments.filter(e => e.status === 'pending');
  const activeEnrollments = enrollments.filter(e => e.status === 'active');
  
  container.innerHTML = `
    <div class="section-card" style="margin-bottom:2rem;">
      <h3 class="section-title">Pending Enrollment Requests (${pendingEnrollments.length})</h3>
      ${pendingEnrollments.length === 0 ? 
        '<p style="color:var(--text-secondary);padding:2rem;text-align:center;">No pending requests</p>' :
        `<div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Requested Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${pendingEnrollments.map(enrollment => `
                <tr>
                  <td>${enrollment.user?.name || 'Unknown'}</td>
                  <td>${enrollment.course?.title || 'Unknown'}</td>
                  <td>${new Date(enrollment.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button class="btn btn-success btn-sm" onclick="approveEnrollment('${enrollment._id}')">
                      <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="rejectEnrollment('${enrollment._id}')">
                      <i class="fas fa-times"></i> Reject
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`
      }
    </div>
    
    <div class="section-card">
      <h3 class="section-title">Active Enrollments (${activeEnrollments.length})</h3>
      ${activeEnrollments.length === 0 ?
        '<p style="color:var(--text-secondary);padding:2rem;text-align:center;">No active enrollments</p>' :
        `<div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Started</th>
              </tr>
            </thead>
            <tbody>
              ${activeEnrollments.map(enrollment => `
                <tr>
                  <td>${enrollment.user?.name || 'Unknown'}</td>
                  <td>${enrollment.course?.title || 'Unknown'}</td>
                  <td>
                    <div class="progress" style="width:100px;">
                      <div class="progress-bar" style="width:${enrollment.progress || 0}%"></div>
                    </div>
                    <span style="font-size:0.875rem;color:var(--text-secondary);">${enrollment.progress || 0}%</span>
                  </td>
                  <td><span class="badge badge-success">${enrollment.status}</span></td>
                  <td>${new Date(enrollment.startedAt).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`
      }
    </div>
  `;
}

async function approveEnrollment(enrollmentId) {
  if (!confirm('Approve this enrollment request?')) return;
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/enrollments/${enrollmentId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      showToast('Enrollment approved successfully!', 'success');
      // Reload enrollments
      const enrollmentsRes = await fetch(`${API_URL}/enrollments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (enrollmentsRes.ok) {
        const data = await enrollmentsRes.json();
        window.allEnrollments = data.data || [];
        renderEnrollmentsTable(window.allEnrollments);
      }
    } else {
      const error = await response.json();
      showToast(error.message || 'Failed to approve enrollment', 'error');
    }
  } catch (error) {
    console.error('Error approving enrollment:', error);
    showToast('Error approving enrollment', 'error');
  }
}

async function rejectEnrollment(enrollmentId) {
  if (!confirm('Reject this enrollment request?')) return;
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/enrollments/${enrollmentId}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      showToast('Enrollment rejected', 'success');
      // Reload enrollments
      const enrollmentsRes = await fetch(`${API_URL}/enrollments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (enrollmentsRes.ok) {
        const data = await enrollmentsRes.json();
        window.allEnrollments = data.data || [];
        renderEnrollmentsTable(window.allEnrollments);
      }
    } else {
      const error = await response.json();
      showToast(error.message || 'Failed to reject enrollment', 'error');
    }
  } catch (error) {
    console.error('Error rejecting enrollment:', error);
    showToast('Error rejecting enrollment', 'error');
  }
}

// ===== ADMIN NOTIFICATIONS =====
// Moved to admin-notifications.js — do not add notification code here.

window.approveEnrollment = approveEnrollment;
window.rejectEnrollment = rejectEnrollment;
window.renderEnrollmentsTable = renderEnrollmentsTable;

// ===== RECENT ENROLLMENTS (real data on overview page) =====
function renderRecentEnrollments(enrollments) {
  const tbody = document.getElementById('recent-enrollments-table');
  if (!tbody) return;

  // Show the 5 most recent enrollments
  const recent = [...enrollments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">
      <i class="fas fa-inbox" style="font-size:1.5rem;margin-bottom:0.5rem;display:block;"></i>No enrollments yet
    </td></tr>`;
    return;
  }

  const avatarColors = [
    'linear-gradient(135deg,#6C3CE1,#8B5CF6)',
    'linear-gradient(135deg,#06B6D4,#0891B2)',
    'linear-gradient(135deg,#10B981,#059669)',
    'linear-gradient(135deg,#F97316,#EA580C)',
    'linear-gradient(135deg,#EC4899,#DB2777)',
  ];

  const statusBadge = (status) => {
    const map = {
      active:    'badge-success',
      pending:   'badge-warning',
      completed: 'badge-info',
      rejected:  'badge-danger',
    };
    return `<span class="badge ${map[status] || 'badge-secondary'}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
  };

  tbody.innerHTML = recent.map((e, i) => {
    const user   = e.user   || {};
    const course = e.course || {};
    const name   = user.name  || 'Unknown Student';
    const letter = name.charAt(0).toUpperCase();
    const color  = avatarColors[i % avatarColors.length];
    const progress = e.progress || 0;
    const date = e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    return `
      <tr>
        <td>
          <div class="table-user">
            <div class="avatar avatar-sm" style="background:${color}">${letter}</div>
            <div>
              <div class="table-user-name">${name}</div>
              <div class="table-user-id">${user.email || ''}</div>
            </div>
          </div>
        </td>
        <td>${course.title || '—'}</td>
        <td>${date}</td>
        <td>
          <div class="progress-cell">
            <div class="progress-bar-mini">
              <div class="progress-fill-mini" style="width:${progress}%;background:var(--gradient-primary)"></div>
            </div>
            <span class="progress-text">${progress}%</span>
          </div>
        </td>
        <td>${statusBadge(e.status || 'pending')}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon btn-sm" title="View Student" onclick="viewUser('${user._id || ''}')"><i class="fas fa-eye"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

window.renderRecentEnrollments = renderRecentEnrollments;


// ===== ANALYTICS PAGE =====
async function loadAnalyticsData() {
  try {
    const token = getAuthToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Fetch all data
    const [usersRes, coursesRes, enrollmentsRes, jobsRes] = await Promise.all([
      fetch(`${API_URL}/users`, { headers }),
      fetch(`${API_URL}/courses`),
      fetch(`${API_URL}/enrollments`, { headers }),
      fetch(`${API_URL}/jobs?all=true`, { headers })
    ]);
    
    let totalUsers = 0;
    let totalCourses = 0;
    let totalEnrollments = 0;
    let totalJobs = 0;
    let users = [];
    let courses = [];
    let enrollments = [];
    
    if (usersRes.ok) {
      const data = await usersRes.json();
      users = data.data || [];
      totalUsers = users.filter(u => u.role === 'student').length;
    }
    
    if (coursesRes.ok) {
      const data = await coursesRes.json();
      courses = data.data || [];
      totalCourses = courses.length;
    }
    
    if (enrollmentsRes.ok) {
      const data = await enrollmentsRes.json();
      enrollments = data.data || [];
      totalEnrollments = enrollments.length;
    }
    
    if (jobsRes.ok) {
      const data = await jobsRes.json();
      const jobs = data.data || [];
      totalJobs = jobs.filter(j => j.isActive).length;
    }
    
    // Update stat cards
    document.getElementById('analytics-total-users').textContent = totalUsers;
    document.getElementById('analytics-total-courses').textContent = totalCourses;
    document.getElementById('analytics-total-enrollments').textContent = totalEnrollments;
    document.getElementById('analytics-total-jobs').textContent = totalJobs;
    
    // Prepare growth chart data
    renderGrowthChart(users, courses, enrollments);
    
  } catch (error) {
    console.error('Error loading analytics data:', error);
    showToast('Failed to load analytics data', 'error');
  }
}

// Render growth chart
function renderGrowthChart(users, courses, enrollments) {
  const ctx = document.getElementById('growthChart');
  if (!ctx || typeof Chart === 'undefined') return;
  
  // Get last 6 months
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      date: d
    });
  }
  
  // Count users per month
  const userCounts = months.map(month => {
    return users.filter(u => {
      const userDate = new Date(u.createdAt);
      return userDate.getFullYear() === month.date.getFullYear() &&
             userDate.getMonth() === month.date.getMonth();
    }).length;
  });
  
  // Count courses per month
  const courseCounts = months.map(month => {
    return courses.filter(c => {
      const courseDate = new Date(c.createdAt);
      return courseDate.getFullYear() === month.date.getFullYear() &&
             courseDate.getMonth() === month.date.getMonth();
    }).length;
  });
  
  // Count enrollments per month
  const enrollmentCounts = months.map(month => {
    return enrollments.filter(e => {
      const enrollDate = new Date(e.createdAt);
      return enrollDate.getFullYear() === month.date.getFullYear() &&
             enrollDate.getMonth() === month.date.getMonth();
    }).length;
  });
  
  // Destroy existing chart if any
  const existingChart = Chart.getChart('growthChart');
  if (existingChart) {
    existingChart.destroy();
  }
  
  // Create new chart
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        {
          label: 'New Users',
          data: userCounts,
          borderColor: '#6C3CE1',
          backgroundColor: 'rgba(108,60,225,0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2
        },
        {
          label: 'New Courses',
          data: courseCounts,
          borderColor: '#06B6D4',
          backgroundColor: 'rgba(6,182,212,0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2
        },
        {
          label: 'New Enrollments',
          data: enrollmentCounts,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16,185,129,0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0,0,0,0.05)'
          },
          ticks: {
            stepSize: 1
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}

// Export function
window.loadAnalyticsData = loadAnalyticsData;

// ===== INTERVIEW MANAGEMENT =====
async function loadInterviewData() {
  try {
    const token = getAuthToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Load interview statistics
    const statsRes = await fetch(`${API_URL}/interview/stats`, { headers });
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      const stats = statsData.data || {};
      
      // Update stat cards
      document.getElementById('total-interviews').textContent = stats.total || 0;
      document.getElementById('passed-interviews').textContent = stats.passed || 0;
      document.getElementById('failed-interviews').textContent = stats.failed || 0;
      document.getElementById('avg-interview-score').textContent = `${stats.avgScore || 0}%`;
      document.getElementById('pass-rate').textContent = `${stats.passRate || 0}%`;
      document.getElementById('qualifying-mark-display').textContent = `${stats.qualifyingMark || 60}% required`;
    }
    
    // Load all interviews
    const interviewsRes = await fetch(`${API_URL}/interview/all`, { headers });
    if (interviewsRes.ok) {
      const interviewsData = await interviewsRes.json();
      window.allInterviews = interviewsData.data || [];
      renderInterviewsTable(window.allInterviews);
    }
    
  } catch (error) {
    console.error('Error loading interview data:', error);
    showToast('Failed to load interview data', 'error');
  }
}

function renderInterviewsTable(interviews) {
  const tbody = document.getElementById('interviewsTableBody');
  if (!tbody) return;
  
  if (interviews.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No interviews found</td></tr>';
    return;
  }
  
  tbody.innerHTML = interviews.map(interview => {
    const user = interview.user || {};
    const score = interview.scores?.overall || 0;
    const passed = interview.passed;
    const qualifyingMark = interview.qualifyingMark || 60;
    const date = new Date(interview.createdAt).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    const duration = Math.floor(interview.duration / 60);
    const answered = interview.answeredQuestions || 0;
    const total = interview.totalQuestions || 0;
    const skipped = interview.skippedQuestions || 0;
    
    const statusBadge = passed 
      ? `<span class="badge badge-success"><i class="fas fa-check"></i> Passed (${score}%)</span>`
      : `<span class="badge badge-danger"><i class="fas fa-exclamation-triangle"></i> Below Mark (${score}%)</span>`;
    
    const warningIcon = !passed 
      ? `<i class="fas fa-exclamation-triangle" style="color:var(--warning);margin-left:0.5rem;" title="Student scored below qualifying mark - consider reaching out"></i>`
      : '';
    
    return `
      <tr ${!passed ? 'style="background:rgba(239,68,68,0.05);"' : ''}>
        <td>
          <div class="table-user">
            <div class="avatar avatar-sm" style="background:linear-gradient(135deg,#6C3CE1,#8B5CF6)">
              ${(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div class="table-user-name">${user.name || 'Unknown Student'}${warningIcon}</div>
              <div class="table-user-id">${user.email || ''}</div>
            </div>
          </div>
        </td>
        <td>${date}</td>
        <td>${duration} min</td>
        <td>
          <div style="font-size:0.875rem;">
            <div style="color:var(--text-primary);font-weight:600;">${answered}/${total} answered</div>
            ${skipped > 0 ? `<div style="color:var(--warning);font-size:0.8rem;">${skipped} skipped</div>` : ''}
          </div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <div style="position:relative;width:40px;height:40px;">
              <svg width="40" height="40" style="transform:rotate(-90deg);">
                <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border)" stroke-width="3"/>
                <circle cx="20" cy="20" r="16" fill="none" stroke="${passed ? '#10B981' : '#EF4444'}" stroke-width="3" 
                        stroke-dasharray="${2 * Math.PI * 16}" 
                        stroke-dashoffset="${2 * Math.PI * 16 * (1 - score / 100)}"/>
              </svg>
              <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:0.7rem;font-weight:700;color:${passed ? '#10B981' : '#EF4444'};">
                ${score}%
              </div>
            </div>
            <div style="font-size:0.8rem;color:var(--text-secondary);">
              <div>C: ${interview.scores?.communication || 0}%</div>
              <div>T: ${interview.scores?.technical || 0}%</div>
              <div>P: ${interview.scores?.professionalism || 0}%</div>
            </div>
          </div>
        </td>
        <td>${statusBadge}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon btn-sm" onclick="viewInterviewResult('${interview._id}')" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
            ${!passed ? `
              <button class="btn-icon btn-sm" onclick="contactStudent('${user._id}', '${user.name}', '${user.email}', ${score})" title="Send Warning" style="color:var(--warning);">
                <i class="fas fa-exclamation-triangle"></i>
              </button>
            ` : ''}
            <button class="btn-icon btn-sm" onclick="deleteInterview('${interview._id}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function viewInterviewResult(interviewId) {
  const interview = window.allInterviews?.find(i => i._id === interviewId);
  if (!interview) {
    showToast('Interview not found', 'error');
    return;
  }
  
  const user = interview.user || {};
  const score = interview.scores?.overall || 0;
  const passed = interview.passed;
  const date = new Date(interview.createdAt).toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
  
  const modalHTML = `
    <div class="modal-overlay" id="interviewModal" onclick="if(event.target===this) closeInterviewModal()">
      <div class="modal-content" style="max-width:700px;">
        <div class="modal-header">
          <h3 class="modal-title">Interview Results - ${user.name || 'Unknown Student'}</h3>
          <button class="btn-icon" onclick="closeInterviewModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <!-- Student Info -->
          <div style="background:var(--bg-body);padding:1.5rem;border-radius:var(--radius-lg);margin-bottom:1.5rem;">
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">
              <div class="avatar avatar-lg" style="background:linear-gradient(135deg,#6C3CE1,#8B5CF6)">
                ${(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 style="margin:0;color:var(--text-primary);">${user.name || 'Unknown Student'}</h4>
                <p style="margin:0;color:var(--text-secondary);">${user.email || ''}</p>
                <p style="margin:0;font-size:0.875rem;color:var(--text-muted);">Completed on ${date}</p>
              </div>
            </div>
          </div>
          
          <!-- Scores -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem;">
            <div style="text-align:center;padding:1rem;background:var(--primary-soft);border-radius:var(--radius-lg);">
              <div style="font-size:1.5rem;font-weight:800;color:var(--primary);">${score}%</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);">Overall</div>
            </div>
            <div style="text-align:center;padding:1rem;background:var(--secondary-soft);border-radius:var(--radius-lg);">
              <div style="font-size:1.5rem;font-weight:800;color:var(--secondary);">${interview.scores?.communication || 0}%</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);">Communication</div>
            </div>
            <div style="text-align:center;padding:1rem;background:var(--success-light);border-radius:var(--radius-lg);">
              <div style="font-size:1.5rem;font-weight:800;color:var(--success);">${interview.scores?.technical || 0}%</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);">Technical</div>
            </div>
            <div style="text-align:center;padding:1rem;background:rgba(249,115,22,0.1);border-radius:var(--radius-lg);">
              <div style="font-size:1.5rem;font-weight:800;color:#F97316;">${interview.scores?.professionalism || 0}%</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);">Professional</div>
            </div>
          </div>
          
          <!-- Performance Stats -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;">
            <div style="padding:1rem;border:1px solid var(--border);border-radius:var(--radius-lg);">
              <div style="font-size:1.2rem;font-weight:700;color:var(--text-primary);">${interview.answeredQuestions || 0}/${interview.totalQuestions || 0}</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);">Questions Answered</div>
            </div>
            <div style="padding:1rem;border:1px solid var(--border);border-radius:var(--radius-lg);">
              <div style="font-size:1.2rem;font-weight:700;color:var(--text-primary);">${interview.avgResponseTime || 0}s</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);">Avg Response Time</div>
            </div>
            <div style="padding:1rem;border:1px solid var(--border);border-radius:var(--radius-lg);">
              <div style="font-size:1.2rem;font-weight:700;color:var(--text-primary);">${interview.completionRate || 0}%</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);">Completion Rate</div>
            </div>
          </div>
          
          <!-- Status Badge -->
          <div style="text-align:center;margin-bottom:1.5rem;">
            <span style="padding:0.75rem 2rem;border-radius:var(--radius-full);font-size:1rem;font-weight:700;background:${passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'};color:${passed ? '#10B981' : '#EF4444'};border:2px solid ${passed ? '#10B981' : '#EF4444'};">
              ${passed ? `✅ Passed - Above Qualifying Mark (${interview.qualifyingMark || 60}%)` : `⚠️ Below Qualifying Mark (${interview.qualifyingMark || 60}%)`}
            </span>
          </div>
          
          <!-- AI Feedback -->
          ${interview.feedback ? `
            <div style="background:var(--bg-body);padding:1.5rem;border-radius:var(--radius-lg);margin-bottom:1.5rem;">
              <h5 style="margin:0 0 1rem;color:var(--text-primary);"><i class="fas fa-robot" style="color:var(--primary);margin-right:0.5rem;"></i>AI Feedback</h5>
              
              ${interview.feedback.strengths?.length > 0 ? `
                <div style="margin-bottom:1rem;">
                  <h6 style="color:var(--success);margin:0 0 0.5rem;"><i class="fas fa-check-circle"></i> Strengths:</h6>
                  <ul style="margin:0;padding-left:1.5rem;color:var(--text-secondary);">
                    ${interview.feedback.strengths.map(s => `<li>${s}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${interview.feedback.improvements?.length > 0 ? `
                <div style="margin-bottom:1rem;">
                  <h6 style="color:var(--warning);margin:0 0 0.5rem;"><i class="fas fa-exclamation-triangle"></i> Areas for Improvement:</h6>
                  <ul style="margin:0;padding-left:1.5rem;color:var(--text-secondary);">
                    ${interview.feedback.improvements.map(i => `<li>${i}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${interview.feedback.recommendations?.length > 0 ? `
                <div>
                  <h6 style="color:var(--primary);margin:0 0 0.5rem;"><i class="fas fa-lightbulb"></i> Recommendations:</h6>
                  <ul style="margin:0;padding-left:1.5rem;color:var(--text-secondary);">
                    ${interview.feedback.recommendations.map(r => `<li>${r}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          <!-- Admin Remarks Section -->
          <div style="background:var(--bg-body);padding:1.5rem;border-radius:var(--radius-lg);">
            <h5 style="margin:0 0 1rem;color:var(--text-primary);"><i class="fas fa-comment-alt" style="color:var(--secondary);margin-right:0.5rem;"></i>Admin Remarks</h5>
            
            <div style="margin-bottom:1rem;">
              <label class="form-label" style="font-weight:600;color:var(--text-primary);">Add/Update Feedback for Student:</label>
              <textarea class="form-control" id="adminRemarksInput" rows="4" placeholder="Enter your feedback and remarks for this student's interview performance..."
                style="width:100%;resize:vertical;margin-top:0.5rem;">${interview.adminRemarks || ''}</textarea>
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.5rem;">
                <i class="fas fa-info-circle"></i> This feedback will be visible to the student in their interview history.
              </div>
            </div>
            
            <div style="display:flex;gap:0.75rem;">
              <button class="btn btn-primary btn-sm" onclick="saveAdminRemarks('${interview._id}')">
                <i class="fas fa-save"></i> Save Remarks
              </button>
              ${interview.adminRemarks ? `
                <button class="btn btn-outline btn-sm" onclick="clearAdminRemarks('${interview._id}')">
                  <i class="fas fa-eraser"></i> Clear
                </button>
              ` : ''}
            </div>
            
            ${interview.adminRemarks ? `
              <div style="margin-top:1rem;padding:1rem;background:var(--primary-soft);border-radius:var(--radius-md);border-left:4px solid var(--primary);">
                <h6 style="margin:0 0 0.5rem;color:var(--primary);"><i class="fas fa-comment"></i> Current Remarks:</h6>
                <p style="margin:0;color:var(--text-secondary);line-height:1.5;">${interview.adminRemarks}</p>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="modal-footer">
          ${!passed ? `
            <button class="btn btn-warning" onclick="contactStudent('${user._id}', '${user.name}', '${user.email}', ${score})">
              <i class="fas fa-exclamation-triangle"></i> Send Warning
            </button>
          ` : ''}
          <button class="btn btn-outline" onclick="closeInterviewModal()">Close</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeInterviewModal() {
  document.getElementById('interviewModal')?.remove();
}

function contactStudent(userId, userName, userEmail, score) {
  const modalHTML = `
    <div class="modal-overlay" id="contactModal" onclick="if(event.target===this) closeContactModal()">
      <div class="modal-content" style="max-width:500px;">
        <div class="modal-header">
          <h3 class="modal-title">Send Warning to ${userName}</h3>
          <button class="btn-icon" onclick="closeContactModal()"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div style="background:rgba(239,68,68,0.1);padding:1rem;border-radius:var(--radius-lg);margin-bottom:1.5rem;border-left:4px solid #EF4444;">
            <p style="margin:0;color:var(--text-primary);"><strong>Student scored ${score}% - Below qualifying mark</strong></p>
            <p style="margin:0.5rem 0 0;font-size:0.875rem;color:var(--text-secondary);">Send a direct warning notification to their dashboard.</p>
          </div>
          
          <div style="margin-bottom:1.5rem;">
            <label class="form-label">Warning Message:</label>
            <textarea class="form-control" id="warningMessage" rows="4" placeholder="Enter your warning message..."
              style="width:100%;resize:vertical;">Your recent interview score of ${score}% is below our qualifying mark. We recommend additional preparation and practice. Please review the feedback provided and consider retaking the interview after improving your skills.</textarea>
          </div>
          
          <div style="background:var(--bg-body);padding:1rem;border-radius:var(--radius-lg);">
            <h5 style="margin:0 0 0.5rem;"><i class="fas fa-info-circle" style="color:var(--primary);"></i> This will:</h5>
            <ul style="margin:0;padding-left:1.5rem;font-size:0.875rem;color:var(--text-secondary);">
              <li>Send a notification directly to the student's dashboard</li>
              <li>Appear in their notification bell with warning icon</li>
              <li>Include the interview score and feedback</li>
              <li>Provide guidance for improvement</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="closeContactModal()">Cancel</button>
          <button class="btn btn-warning" onclick="sendWarningNotification('${userId}', '${userName}', ${score})">
            <i class="fas fa-exclamation-triangle"></i> Send Warning
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function sendWarningNotification(userId, userName, score) {
  const messageEl = document.getElementById('warningMessage');
  const message = messageEl ? messageEl.value.trim() : '';
  
  if (!message) {
    showToast('Please enter a warning message', 'error');
    return;
  }
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId,
        type: 'interview_warning',
        title: `⚠️ Interview Performance Warning - Score: ${score}%`,
        message: message,
        data: {
          score: score,
          qualifyingMark: 60,
          adminSent: true,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    if (response.ok) {
      showToast(`Warning sent to ${userName}'s dashboard successfully!`, 'success');
      closeContactModal();
      
      // Optionally reload interview data to update UI
      loadInterviewData();
    } else {
      const error = await response.json();
      showToast(error.message || 'Failed to send warning', 'error');
    }
  } catch (error) {
    console.error('Error sending warning:', error);
    showToast('Error sending warning notification', 'error');
  }
}

function closeContactModal() {
  document.getElementById('contactModal')?.remove();
}

async function saveAdminRemarks(interviewId) {
  const remarksInput = document.getElementById('adminRemarksInput');
  const remarks = remarksInput ? remarksInput.value.trim() : '';
  
  if (!remarks) {
    showToast('Please enter some remarks before saving', 'warning');
    return;
  }
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/interview/${interviewId}/remarks`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ remarks })
    });
    
    if (response.ok) {
      const data = await response.json();
      showToast('Admin remarks saved successfully! Student will be notified.', 'success');
      
      // Update the interview in memory
      const interview = window.allInterviews?.find(i => i._id === interviewId);
      if (interview) {
        interview.adminRemarks = remarks;
      }
      
      // Close and reopen modal to show updated remarks
      closeInterviewModal();
      setTimeout(() => viewInterviewResult(interviewId), 300);
      
      // Reload interview data to update the table
      loadInterviewData();
    } else {
      const error = await response.json();
      showToast(error.message || 'Failed to save remarks', 'error');
    }
  } catch (error) {
    console.error('Error saving admin remarks:', error);
    showToast('Error saving admin remarks', 'error');
  }
}

async function clearAdminRemarks(interviewId) {
  if (!confirm('Are you sure you want to clear the admin remarks? This action cannot be undone.')) {
    return;
  }
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/interview/${interviewId}/remarks`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ remarks: '' })
    });
    
    if (response.ok) {
      showToast('Admin remarks cleared successfully', 'success');
      
      // Update the interview in memory
      const interview = window.allInterviews?.find(i => i._id === interviewId);
      if (interview) {
        interview.adminRemarks = '';
      }
      
      // Close and reopen modal to show updated state
      closeInterviewModal();
      setTimeout(() => viewInterviewResult(interviewId), 300);
      
      // Reload interview data to update the table
      loadInterviewData();
    } else {
      const error = await response.json();
      showToast(error.message || 'Failed to clear remarks', 'error');
    }
  } catch (error) {
    console.error('Error clearing admin remarks:', error);
    showToast('Error clearing admin remarks', 'error');
  }
}

async function deleteInterview(interviewId) {
  if (!confirm('Are you sure you want to delete this interview record?')) return;
  
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}/interview/${interviewId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      showToast('Interview deleted successfully', 'success');
      loadInterviewData(); // Reload data
    } else {
      showToast('Failed to delete interview', 'error');
    }
  } catch (error) {
    showToast('Error deleting interview', 'error');
  }
}

// Filter interviews
function filterInterviews() {
  const filter = document.getElementById('interviewFilter')?.value || 'all';
  const searchQuery = document.querySelector('.search-input[data-type="interviews"]')?.value.toLowerCase() || '';
  
  let filtered = window.allInterviews || [];
  
  // Apply filter
  switch (filter) {
    case 'passed':
      filtered = filtered.filter(i => i.passed);
      break;
    case 'failed':
      filtered = filtered.filter(i => !i.passed);
      break;
    case 'recent':
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(i => new Date(i.createdAt) > weekAgo);
      break;
  }
  
  // Apply search
  if (searchQuery) {
    filtered = filtered.filter(i => 
      (i.user?.name || '').toLowerCase().includes(searchQuery) ||
      (i.user?.email || '').toLowerCase().includes(searchQuery)
    );
  }
  
  renderInterviewsTable(filtered);
}

// Setup interview filter listeners
function setupInterviewFilters() {
  document.getElementById('interviewFilter')?.addEventListener('change', filterInterviews);
  document.querySelector('.search-input[data-type="interviews"]')?.addEventListener('input', filterInterviews);
}

// Export functions
window.loadInterviewData = loadInterviewData;
window.viewInterviewResult = viewInterviewResult;
window.closeInterviewModal = closeInterviewModal;
window.contactStudent = contactStudent;
window.sendWarningNotification = sendWarningNotification;
window.closeContactModal = closeContactModal;
window.deleteInterview = deleteInterview;
window.filterInterviews = filterInterviews;
