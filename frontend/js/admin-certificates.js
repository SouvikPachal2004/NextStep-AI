// ===== ADMIN CERTIFICATES MANAGEMENT =====

// ── Load all certificate data (requests + issued) ──
async function loadCertificateData() {
  try {
    const token = getAuthToken();
    const headers = { 'Authorization': `Bearer ${token}` };

    const [certsRes, reqsRes] = await Promise.all([
      fetch(`${API_URL}/certificates`, { headers }),
      fetch(`${API_URL}/certificates/requests`, { headers })
    ]);

    if (certsRes.ok) {
      const d = await certsRes.json();
      window.allCertificates = d.data || [];
    }
    if (reqsRes.ok) {
      const d = await reqsRes.json();
      window.allCertRequests = d.data || [];
    }

    renderCertificatesPage();

    // Update stat card
    const el = document.getElementById('total-certificates');
    if (el) el.textContent = (window.allCertificates || []).length;
  } catch (err) {
    console.error('Load cert data error:', err);
  }
}

// ── Render the full certificates page (requests + issued) ──
function renderCertificatesPage() {
  renderCertRequestsSection(window.allCertRequests || []);
  renderCertificatesTable(window.allCertificates || []);
}

// ── Render pending requests section ──
function renderCertRequestsSection(requests) {
  const container = document.getElementById('certRequestsContainer');
  if (!container) return;

  const pending = requests.filter(r => r.status === 'pending');

  container.innerHTML = `
    <div class="section-card" style="margin-bottom:1.5rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h3 class="section-title" style="margin:0;">
          <i class="fas fa-inbox" style="color:#c9a227;margin-right:0.5rem;"></i>
          Pending Certificate Requests
          ${pending.length > 0 ? `<span style="background:#c9a227;color:#1a0533;border-radius:20px;padding:0.1rem 0.6rem;font-size:0.75rem;margin-left:0.5rem;font-weight:700;">${pending.length}</span>` : ''}
        </h3>
      </div>
      ${pending.length === 0
        ? `<p style="color:var(--text-muted);text-align:center;padding:1.5rem 0;">No pending requests</p>`
        : `<div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${pending.map(req => `
                  <tr>
                    <td>
                      <div class="table-user">
                        <div style="width:36px;height:36px;background:linear-gradient(135deg,#6C3CE1,#8B5CF6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;flex-shrink:0;">
                          ${(req.user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div class="table-user-name">${req.user?.name || 'Unknown'}</div>
                          <div class="table-user-id">${req.user?.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="font-weight:600;color:var(--text-primary);">${req.course?.title || 'Unknown'}</div>
                      <div style="font-size:0.8rem;color:var(--text-muted);">${req.course?.category || ''}</div>
                    </td>
                    <td>${new Date(req.requestedAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}</td>
                    <td>
                      <div class="table-actions">
                        <button class="btn btn-sm btn-success" onclick="approveCertRequest('${req._id}')" style="background:var(--success);color:#fff;border:none;padding:0.4rem 0.9rem;border-radius:6px;cursor:pointer;font-weight:600;">
                          <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm" onclick="rejectCertRequest('${req._id}')" style="background:var(--danger);color:#fff;border:none;padding:0.4rem 0.9rem;border-radius:6px;cursor:pointer;font-weight:600;margin-left:0.5rem;">
                          <i class="fas fa-times"></i> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`
      }
    </div>
  `;
}

// ── Render issued certificates table ──
function renderCertificatesTable(certificates) {
  const tbody = document.getElementById('certificatesTableBody');
  if (!tbody) return;

  if (!certificates || certificates.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-muted)">No certificates issued yet</td></tr>';
    return;
  }

  tbody.innerHTML = certificates.map(cert => `
    <tr>
      <td>
        <div class="table-user">
          <div style="width:40px;height:40px;background:linear-gradient(135deg,#6C3CE1,#8B5CF6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1rem;flex-shrink:0;">
            ${(cert.user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="table-user-name">${cert.user?.name || 'Unknown'}</div>
            <div class="table-user-id">${cert.user?.email || ''}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-weight:600;color:var(--text-primary);">${cert.course?.title || 'Unknown Course'}</div>
        <div style="font-size:0.8rem;color:var(--text-muted);">${cert.course?.category || ''}</div>
      </td>
      <td>
        <code style="background:var(--bg-body);padding:0.25rem 0.6rem;border-radius:6px;font-size:0.8rem;color:var(--primary);">
          ${cert.certificateId || '—'}
        </code>
      </td>
      <td>${new Date(cert.issuedAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}</td>
      <td>
        <div class="table-actions">
          <button class="btn-icon btn-sm" onclick="viewCertificateAdmin('${cert._id}')" title="View Certificate">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon btn-sm" onclick="deleteCertificate('${cert._id}')" title="Revoke">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Approve request ──
async function approveCertRequest(requestId) {
  if (!confirm('Approve this certificate request? A certificate will be issued and the student will be notified.')) return;

  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/certificates/requests/${requestId}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Certificate issued and student notified! 🎓', 'success');
      loadCertificateData();
      loadDashboardData(); // refresh stats
    } else {
      showToast(data.message || 'Failed to approve', 'error');
    }
  } catch (err) {
    showToast('Error approving request', 'error');
  }
}

// ── Reject request ──
async function rejectCertRequest(requestId) {
  const note = prompt('Optional: Enter a reason for rejection (shown to student):') || '';

  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/certificates/requests/${requestId}/reject`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Request rejected and student notified', 'success');
      loadCertificateData();
    } else {
      showToast(data.message || 'Failed to reject', 'error');
    }
  } catch (err) {
    showToast('Error rejecting request', 'error');
  }
}

// ── Open Issue Certificate Modal (manual) ──
function openIssueCertModal() {
  const students = (window.allUsers || []).filter(u => u.role !== 'admin');
  const courses  = window.allCourses || [];

  const modalHTML = `
    <div class="modal-overlay" id="issueCertModal" onclick="if(event.target===this) closeIssueCertModal()">
      <div class="modal-content" style="max-width:520px;">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-certificate" style="color:#c9a227;margin-right:0.5rem;"></i>
            Issue Certificate Manually
          </h3>
          <button class="btn-icon" onclick="closeIssueCertModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="issueCertForm" onsubmit="handleIssueCert(event)">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Student *</label>
              <select class="form-control" name="userId" required>
                <option value="">Select Student</option>
                ${students.map(u => `<option value="${u._id}">${u.name} (${u.email})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Course *</label>
              <select class="form-control" name="courseId" required>
                <option value="">Select Course</option>
                ${courses.map(c => `<option value="${c._id}">${c.title}</option>`).join('')}
              </select>
            </div>
            <div style="background:rgba(201,162,39,0.08);border:1px solid rgba(201,162,39,0.3);border-radius:var(--radius-md);padding:1rem;margin-top:0.5rem;">
              <p style="font-size:0.85rem;color:var(--text-secondary);margin:0;">
                <i class="fas fa-info-circle" style="color:#c9a227;"></i>
                A unique certificate ID will be generated and the student will receive a notification.
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="closeIssueCertModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background:linear-gradient(135deg,#c9a227,#f0d060);border-color:transparent;color:#1a0533;font-weight:700;">
              <i class="fas fa-certificate"></i> Issue Certificate
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeIssueCertModal() {
  document.getElementById('issueCertModal')?.remove();
}

async function handleIssueCert(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = { userId: formData.get('userId'), courseId: formData.get('courseId') };

  const btn = event.target.querySelector('[type=submit]');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Issuing...';

  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/certificates`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      showToast('Certificate issued and student notified!', 'success');
      closeIssueCertModal();
      loadCertificateData();
      loadDashboardData();
    } else {
      showToast(result.message || 'Failed to issue certificate', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-certificate"></i> Issue Certificate';
    }
  } catch (err) {
    showToast('Error issuing certificate', 'error');
    btn.disabled = false;
  }
}

function viewCertificateAdmin(certId) {
  window.open(`certificate-view.html?id=${certId}`, '_blank');
}

async function deleteCertificate(certId) {
  if (!confirm('Revoke this certificate? The student will lose access to it.')) return;
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/certificates/${certId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('Certificate revoked', 'success');
      loadCertificateData();
      loadDashboardData();
    } else {
      showToast('Failed to revoke certificate', 'error');
    }
  } catch (err) {
    showToast('Error revoking certificate', 'error');
  }
}

// Exports
window.renderCertificatesTable   = renderCertificatesTable;
window.renderCertificatesPage    = renderCertificatesPage;
window.loadCertificateData       = loadCertificateData;
window.openIssueCertModal        = openIssueCertModal;
window.closeIssueCertModal       = closeIssueCertModal;
window.handleIssueCert           = handleIssueCert;
window.viewCertificateAdmin      = viewCertificateAdmin;
window.deleteCertificate         = deleteCertificate;
window.approveCertRequest        = approveCertRequest;
window.rejectCertRequest         = rejectCertRequest;
