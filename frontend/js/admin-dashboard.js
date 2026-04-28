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
