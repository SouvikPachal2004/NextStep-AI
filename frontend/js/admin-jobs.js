// ===== ADMIN JOBS MANAGEMENT =====

function renderJobsTable(jobs) {
  const tbody = document.getElementById('jobsTableBody');
  if (!tbody) return;
  if (!jobs || jobs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No jobs found. Create your first job posting!</td></tr>';
    return;
  }
  tbody.innerHTML = jobs.map(job => `
    <tr>
      <td>
        <div class="table-user">
          <div style="width:44px;height:44px;background:linear-gradient(135deg,#F97316,#EA580C);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;flex-shrink:0;">
            <i class="fas fa-briefcase"></i>
          </div>
          <div>
            <div class="table-user-name">${job.title || 'Untitled'}</div>
            <div class="table-user-id">${job.company?.name || 'Company'}</div>
          </div>
        </div>
      </td>
      <td>${job.location || 'Remote'}</td>
      <td>
        <span class="badge badge-info">${job.employmentType || 'Full-time'}</span>
        <span class="badge badge-secondary" style="margin-left:0.25rem;">${job.workType || 'Remote'}</span>
      </td>
      <td>${job.salary || 'Not disclosed'}</td>
      <td>
        <span style="font-weight:700;color:var(--primary);">${job.applications?.length || 0}</span>
        ${job.applications?.filter(a=>a.status==='pending').length > 0
          ? `<span style="margin-left:0.4rem;background:rgba(245,158,11,0.15);color:#D97706;padding:0.15rem 0.5rem;border-radius:20px;font-size:0.72rem;font-weight:700;">${job.applications.filter(a=>a.status==='pending').length} pending</span>`
          : ''}
      </td>
      <td>
        <span class="badge ${job.isActive ? 'badge-success' : 'badge-warning'}">${job.isActive ? 'Active' : 'Inactive'}</span>
        ${job.applicationLink ? '<span style="margin-left:0.4rem;color:var(--success);font-size:0.75rem;" title="Has application link"><i class="fas fa-link"></i></span>' : ''}
      </td>
      <td>
        <div class="table-actions">
          <button class="btn-icon btn-sm" onclick="viewJobApplications('${job._id}')" title="View Applications"><i class="fas fa-users"></i></button>
          <button class="btn-icon btn-sm" onclick="editJob('${job._id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn-icon btn-sm" onclick="deleteJob('${job._id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openJobModal(jobId) {
  const isEdit = !!jobId;
  const job = isEdit ? (window.allJobs||[]).find(j => j._id === jobId) : null;
  const cats = ['Programming','Data Science','Web Development','Machine Learning','AI','Other'];

  const modalHTML = `
    <div class="modal-overlay" id="jobModal" onclick="if(event.target===this)closeJobModal()">
      <div class="modal-content" style="max-width:720px;max-height:92vh;overflow-y:auto;">
        <div class="modal-header">
          <h3 class="modal-title"><i class="fas fa-briefcase" style="color:var(--accent);margin-right:0.5rem;"></i>${isEdit ? 'Edit Job' : 'Create New Job'}</h3>
          <button class="btn-icon" onclick="closeJobModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="jobForm" onsubmit="handleJobSubmit(event,'${jobId||''}')">
          <div class="modal-body">

            <div class="form-group">
              <label class="form-label">Job Title *</label>
              <input type="text" class="form-control" name="title" value="${job?.title||''}" placeholder="e.g., Senior React Developer" required>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">Company Name *</label>
                <input type="text" class="form-control" name="companyName" value="${job?.company?.name||''}" required>
              </div>
              <div class="form-group">
                <label class="form-label">Company Website</label>
                <input type="url" class="form-control" name="companyWebsite" value="${job?.company?.website||''}" placeholder="https://company.com">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Description *</label>
              <textarea class="form-control" name="description" rows="4" placeholder="Describe the role, responsibilities, and what you're looking for..." required>${job?.description||''}</textarea>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">Location *</label>
                <input type="text" class="form-control" name="location" value="${job?.location||''}" placeholder="e.g., New York, USA" required>
              </div>
              <div class="form-group">
                <label class="form-label">Category *</label>
                <select class="form-control" name="category" required>
                  <option value="">Select Category</option>
                  ${cats.map(c=>`<option value="${c}"${job?.category===c?' selected':''}>${c}</option>`).join('')}
                </select>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">Employment Type *</label>
                <select class="form-control" name="employmentType">
                  ${['Full-time','Part-time','Contract','Internship'].map(t=>`<option value="${t}"${job?.employmentType===t?' selected':''}>${t}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Work Type *</label>
                <select class="form-control" name="workType">
                  ${['Remote','Hybrid','On-site'].map(t=>`<option value="${t}"${job?.workType===t?' selected':''}>${t}</option>`).join('')}
                </select>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">Min Experience (yrs)</label>
                <input type="number" class="form-control" name="minExperience" value="${job?.experience?.min||0}" min="0">
              </div>
              <div class="form-group">
                <label class="form-label">Max Experience (yrs)</label>
                <input type="number" class="form-control" name="maxExperience" value="${job?.experience?.max||10}" min="0">
              </div>
              <div class="form-group">
                <label class="form-label">Salary Range</label>
                <input type="text" class="form-control" name="salary" value="${job?.salary||''}" placeholder="e.g., $80k–$120k">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Required Skills (comma-separated) *</label>
              <input type="text" class="form-control" name="skills" value="${job?.skills?.join(', ')||''}" placeholder="e.g., JavaScript, React, Node.js" required>
            </div>

            <!-- Application Link -->
            <div class="form-group" style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.25);border-radius:var(--radius-md);padding:1rem;">
              <label class="form-label" style="color:var(--success);font-weight:700;">
                <i class="fas fa-link"></i> Application / Interview Link
              </label>
              <input type="url" class="form-control" name="applicationLink" value="${job?.applicationLink||''}" placeholder="https://meet.google.com/xxx-xxxx-xxx  or  https://zoom.us/j/...">
              <small style="color:var(--text-muted);font-size:0.78rem;margin-top:0.4rem;display:block;">
                <i class="fas fa-info-circle"></i> This link (Google Meet, Zoom, form, etc.) will be revealed <strong>only to accepted applicants</strong> in their dashboard.
              </small>
            </div>

            <div class="form-group">
              <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.9rem;">
                <input type="checkbox" name="isActive" ${job?.isActive!==false?'checked':''}>
                <span>Active Job Posting (visible to users)</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="closeJobModal()">Cancel</button>
            <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> ${isEdit?'Update':'Create'} Job</button>
          </div>
        </form>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeJobModal() { document.getElementById('jobModal')?.remove(); }

async function handleJobSubmit(event, jobId) {
  event.preventDefault();
  const fd = new FormData(event.target);
  const data = {
    title: fd.get('title'),
    company: { name: fd.get('companyName'), website: fd.get('companyWebsite')||'' },
    description: fd.get('description'),
    location: fd.get('location'),
    category: fd.get('category'),
    employmentType: fd.get('employmentType'),
    workType: fd.get('workType'),
    experience: { min: parseInt(fd.get('minExperience'))||0, max: parseInt(fd.get('maxExperience'))||10 },
    salary: fd.get('salary'),
    skills: fd.get('skills').split(',').map(s=>s.trim()).filter(Boolean),
    applicationLink: fd.get('applicationLink')||'',
    isActive: fd.get('isActive')==='on'
  };

  const btn = event.target.querySelector('[type=submit]');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    const token = getAuthToken();
    const url = jobId ? `${API_URL}/jobs/${jobId}` : `${API_URL}/jobs`;
    const method = jobId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: {'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}, body: JSON.stringify(data) });
    const result = await res.json();
    if (res.ok) {
      showToast(`Job ${jobId?'updated':'created'} successfully!`, 'success');
      closeJobModal();
      loadDashboardData();
    } else {
      showToast(result.message||'Failed to save job', 'error');
      btn.disabled = false; btn.innerHTML = `<i class="fas fa-save"></i> ${jobId?'Update':'Create'} Job`;
    }
  } catch (err) {
    showToast('Error saving job', 'error');
    btn.disabled = false; btn.innerHTML = `<i class="fas fa-save"></i> ${jobId?'Update':'Create'} Job`;
  }
}

async function viewJobApplications(jobId) {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/jobs/${jobId}/applications`, { headers: {'Authorization':`Bearer ${token}`} });
    if (!res.ok) { showToast('Failed to load applications', 'error'); return; }
    const data = await res.json();
    const applications = data.data || [];
    const jobTitle = data.job?.title || (window.allJobs||[]).find(j=>j._id===jobId)?.title || 'Job';
    const jobLink = data.job?.applicationLink || '';

    const statusBadge = s => {
      const map = { accepted:'badge-success', rejected:'badge-danger', shortlisted:'badge-info', reviewed:'badge-secondary', pending:'badge-warning' };
      const icon = { accepted:'fa-check-circle', rejected:'fa-times-circle', shortlisted:'fa-star', reviewed:'fa-eye', pending:'fa-clock' };
      return `<span class="badge ${map[s]||'badge-warning'}"><i class="fas ${icon[s]||'fa-clock'}"></i> ${s}</span>`;
    };

    const modalHTML = `
      <div class="modal-overlay" id="applicationsModal" onclick="if(event.target===this)closeApplicationsModal()">
        <div class="modal-content" style="max-width:860px;max-height:92vh;overflow-y:auto;padding:0;">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#F97316,#EA580C);padding:1.5rem 2rem;border-radius:var(--radius-lg) var(--radius-lg) 0 0;color:#fff;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h3 style="margin:0;font-size:1.15rem;font-weight:700;"><i class="fas fa-users"></i> Applications</h3>
              <p style="margin:0.25rem 0 0;opacity:0.9;font-size:0.85rem;">${jobTitle} &bull; ${applications.length} applicant${applications.length!==1?'s':''}</p>
            </div>
            <button onclick="closeApplicationsModal()" style="background:rgba(255,255,255,0.2);border:none;color:#fff;width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;"><i class="fas fa-times"></i></button>
          </div>

          <div style="padding:1.5rem 2rem;">

            <!-- Application Link Info -->
            ${jobLink ? `
              <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:var(--radius-md);padding:0.875rem 1rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:0.75rem;">
                <i class="fas fa-link" style="color:var(--success);font-size:1.1rem;flex-shrink:0;"></i>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:0.82rem;font-weight:700;color:var(--success);margin-bottom:0.2rem;">Application Link (shown to accepted applicants only)</div>
                  <a href="${jobLink}" target="_blank" style="font-size:0.82rem;color:var(--primary);word-break:break-all;">${jobLink}</a>
                </div>
              </div>` : `
              <div style="background:rgba(249,115,22,0.07);border:1px solid rgba(249,115,22,0.25);border-radius:var(--radius-md);padding:0.75rem 1rem;margin-bottom:1.5rem;font-size:0.82rem;color:#D97706;">
                <i class="fas fa-exclamation-triangle"></i> No application link set for this job. <button onclick="closeApplicationsModal();editJob('${jobId}')" style="background:none;border:none;color:var(--primary);cursor:pointer;font-weight:700;text-decoration:underline;">Edit job to add one</button>
              </div>`}

            ${applications.length === 0 ?
              `<div style="text-align:center;padding:3rem;color:var(--text-muted);">
                <i class="fas fa-inbox" style="font-size:2.5rem;margin-bottom:1rem;display:block;"></i>
                <p>No applications yet for this job.</p>
              </div>` :
              `<div style="display:flex;flex-direction:column;gap:0.75rem;">
                ${applications.map(app => `
                  <div style="background:var(--bg-body);border:1px solid var(--border);border-radius:var(--radius-md);padding:1.25rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div style="width:42px;height:42px;background:linear-gradient(135deg,#6C3CE1,#8B5CF6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1rem;flex-shrink:0;">
                      ${(app.user?.name||'?').charAt(0).toUpperCase()}
                    </div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-weight:700;color:var(--text-primary);font-size:0.95rem;">${app.user?.name||'Unknown'}</div>
                      <div style="font-size:0.8rem;color:var(--text-secondary);">${app.user?.email||'N/A'} &bull; Applied ${new Date(app.appliedAt).toLocaleDateString()}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                      ${statusBadge(app.status)}
                      <select class="form-control" style="width:160px;font-size:0.82rem;padding:0.4rem 0.75rem;" onchange="updateApplicationStatus('${jobId}','${app._id}',this.value)">
                        <option value="">Change Status</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="accepted">✅ Accept (reveals link)</option>
                        <option value="rejected">❌ Reject</option>
                      </select>
                    </div>
                  </div>`).join('')}
              </div>`
            }
          </div>

          <div style="padding:1rem 2rem;border-top:1px solid var(--border);display:flex;justify-content:flex-end;background:var(--bg-card);border-radius:0 0 var(--radius-lg) var(--radius-lg);">
            <button class="btn btn-outline" onclick="closeApplicationsModal()">Close</button>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  } catch (err) {
    console.error('viewJobApplications error:', err);
    showToast('Error loading applications', 'error');
  }
}

function closeApplicationsModal() { document.getElementById('applicationsModal')?.remove(); }

async function updateApplicationStatus(jobId, applicationId, status) {
  if (!status) return;
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/jobs/${jobId}/applications/${applicationId}`, {
      method: 'PUT',
      headers: {'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      const statusLabels = { accepted:'✅ Accepted — link will be revealed to user', rejected:'❌ Rejected', shortlisted:'⭐ Shortlisted', reviewed:'👁 Reviewed', pending:'⏳ Pending' };
      showToast(statusLabels[status] || 'Status updated!', status==='accepted'?'success':status==='rejected'?'error':'info');
      closeApplicationsModal();
      viewJobApplications(jobId);
      loadDashboardData();
    } else {
      showToast('Failed to update status', 'error');
    }
  } catch (err) {
    showToast('Error updating application', 'error');
  }
}

function editJob(jobId) { openJobModal(jobId); }

async function deleteJob(jobId) {
  if (!confirm('Delete this job? All applications will be lost.')) return;
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/jobs/${jobId}`, { method:'DELETE', headers:{'Authorization':`Bearer ${token}`} });
    if (res.ok) { showToast('Job deleted successfully!', 'success'); loadDashboardData(); }
    else showToast('Failed to delete job', 'error');
  } catch { showToast('Error deleting job', 'error'); }
}

window.renderJobsTable = renderJobsTable;
window.openJobModal = openJobModal;
window.closeJobModal = closeJobModal;
window.handleJobSubmit = handleJobSubmit;
window.viewJobApplications = viewJobApplications;
window.closeApplicationsModal = closeApplicationsModal;
window.updateApplicationStatus = updateApplicationStatus;
window.editJob = editJob;
window.deleteJob = deleteJob;
