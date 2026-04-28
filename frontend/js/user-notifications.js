// ===== USER NOTIFICATIONS + CERTIFICATE REQUESTS =====

// ── Poll interval (ms) ──
const NOTIF_POLL_MS = 30000; // 30 seconds
let _notifPollTimer = null;

// ── Bootstrap ──
document.addEventListener('DOMContentLoaded', () => {
  loadNotifications();
  _notifPollTimer = setInterval(loadNotifications, NOTIF_POLL_MS);
  setupNotifDropdown();
});

// ── Load notifications from API ──
async function loadNotifications() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    window.userNotifications = data.data || [];
    updateNotifBadge(data.unreadCount || 0);
    renderNotifDropdown(window.userNotifications);
  } catch (err) {
    console.error('Load notifications error:', err);
  }
}

// ── Badge ──
function updateNotifBadge(count) {
  const badge = document.querySelector('#notifBtn .notification-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// ── Dropdown setup ──
function setupNotifDropdown() {
  const btn = document.getElementById('notifBtn');
  if (!btn) return;

  // Append to body so it's never clipped by topbar overflow
  if (!document.getElementById('notifDropdown')) {
    const dropdown = document.createElement('div');
    dropdown.id = 'notifDropdown';
    dropdown.style.cssText = `
      display:none;
      position:fixed;
      width:400px;
      max-height:520px;
      overflow-y:auto;
      background:var(--bg-card);
      border:1px solid var(--border);
      border-radius:var(--radius-lg);
      box-shadow:0 8px 40px rgba(0,0,0,0.18);
      z-index:99999;
    `;
    document.body.appendChild(dropdown);
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const dd = document.getElementById('notifDropdown');
    const isOpen = dd.style.display === 'block';
    if (isOpen) {
      dd.style.display = 'none';
    } else {
      const rect = btn.getBoundingClientRect();
      dd.style.top   = (rect.bottom + 8) + 'px';
      dd.style.right = (window.innerWidth - rect.right) + 'px';
      dd.style.left  = 'auto';
      dd.style.display = 'block';
      loadNotifications();
    }
  });

  document.addEventListener('click', (e) => {
    const dd = document.getElementById('notifDropdown');
    if (dd && !dd.contains(e.target) && !document.getElementById('notifBtn')?.contains(e.target)) {
      dd.style.display = 'none';
    }
  });
}

// ── Render dropdown ──
function renderNotifDropdown(notifications) {
  const dd = document.getElementById('notifDropdown');
  if (!dd) return;

  const unread = notifications.filter(n => !n.isRead).length;

  const typeConfig = (type) => {
    const map = {
      enrollment_approved:  { icon: 'fa-check-circle',   color: '#10B981',  bg: 'rgba(16,185,129,0.12)'  },
      enrollment_rejected:  { icon: 'fa-times-circle',   color: '#EF4444',  bg: 'rgba(239,68,68,0.12)'   },
      certificate_approved: { icon: 'fa-certificate',    color: '#c9a227',  bg: 'rgba(201,162,39,0.15)'  },
      certificate_rejected: { icon: 'fa-times-circle',   color: '#EF4444',  bg: 'rgba(239,68,68,0.12)'   },
      job_accepted:         { icon: 'fa-check-circle',   color: '#10B981',  bg: 'rgba(16,185,129,0.12)'  },
      job_rejected:         { icon: 'fa-times-circle',   color: '#EF4444',  bg: 'rgba(239,68,68,0.12)'   },
      job_shortlisted:      { icon: 'fa-star',           color: '#3B82F6',  bg: 'rgba(59,130,246,0.12)'  },
      job_reviewed:         { icon: 'fa-eye',            color: '#6B7280',  bg: 'rgba(107,114,128,0.12)' },
      general:              { icon: 'fa-bell',           color: '#6C3CE1',  bg: 'rgba(108,60,225,0.12)'  },
    };
    return map[type] || { icon: 'fa-bell', color: '#6C3CE1', bg: 'rgba(108,60,225,0.12)' };
  };

  dd.innerHTML = `
    <!-- Header -->
    <div style="padding:1rem 1.25rem 0.875rem;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--bg-card);z-index:1;border-radius:var(--radius-lg) var(--radius-lg) 0 0;">
      <div style="display:flex;align-items:center;gap:0.6rem;">
        <i class="fas fa-bell" style="color:var(--primary);font-size:1rem;"></i>
        <span style="font-weight:700;color:var(--text-primary);font-size:1rem;">Notifications</span>
        ${unread > 0 ? `<span style="background:var(--primary);color:#fff;border-radius:20px;padding:0.15rem 0.55rem;font-size:0.7rem;font-weight:700;">${unread}</span>` : ''}
      </div>
      ${unread > 0 ? `<button onclick="markAllRead()" style="background:none;border:none;color:var(--primary);font-size:0.8rem;cursor:pointer;font-weight:600;padding:0.25rem 0.5rem;border-radius:6px;transition:background 0.2s;" onmouseover="this.style.background='rgba(108,60,225,0.08)'" onmouseout="this.style.background='none'">Mark all read</button>` : ''}
    </div>

    <!-- Items -->
    ${notifications.length === 0
      ? `<div style="padding:3rem 1.5rem;text-align:center;color:var(--text-muted);">
           <div style="width:64px;height:64px;background:rgba(108,60,225,0.08);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
             <i class="fas fa-bell-slash" style="font-size:1.5rem;color:var(--text-muted);"></i>
           </div>
           <p style="font-weight:600;color:var(--text-secondary);margin:0 0 0.25rem;">All caught up!</p>
           <p style="font-size:0.8rem;margin:0;">No notifications yet</p>
         </div>`
      : notifications.map(n => {
          const t = typeConfig(n.type);
          return `
            <div onclick="handleNotifClick('${n._id}', '${n.type}', ${JSON.stringify(n.data || {}).replace(/"/g, '&quot;')})"
                 style="padding:0.875rem 1.25rem;border-bottom:1px solid var(--border);cursor:pointer;
                        background:${n.isRead ? 'transparent' : 'rgba(108,60,225,0.035)'};
                        transition:background 0.15s;"
                 onmouseover="this.style.background='rgba(108,60,225,0.07)'"
                 onmouseout="this.style.background='${n.isRead ? 'transparent' : 'rgba(108,60,225,0.035)'}'">
              <div style="display:flex;gap:0.875rem;align-items:start;">
                <div style="width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.05rem;background:${t.bg};">
                  <i class="fas ${t.icon}" style="color:${t.color};"></i>
                </div>
                <div style="flex:1;min-width:0;">
                  <div style="font-weight:${n.isRead ? '500' : '700'};color:var(--text-primary);font-size:0.875rem;margin-bottom:0.25rem;line-height:1.3;">${n.title}</div>
                  <div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5;margin-bottom:0.3rem;">${n.message}</div>
                  <div style="font-size:0.72rem;color:var(--text-muted);display:flex;align-items:center;gap:0.3rem;">
                    <i class="fas fa-clock" style="font-size:0.65rem;"></i>
                    ${timeAgo(n.createdAt)}
                  </div>
                </div>
                ${!n.isRead ? `<div style="width:9px;height:9px;background:var(--primary);border-radius:50%;flex-shrink:0;margin-top:5px;box-shadow:0 0 0 2px rgba(108,60,225,0.2);"></div>` : ''}
              </div>
            </div>`;
        }).join('')
    }

    <!-- Footer -->
    <div style="padding:0.75rem 1.25rem;text-align:center;border-top:1px solid var(--border);background:var(--bg-body);border-radius:0 0 var(--radius-lg) var(--radius-lg);">
      <span style="font-size:0.78rem;color:var(--text-muted);">${notifications.length} notification${notifications.length !== 1 ? 's' : ''} total</span>
    </div>
  `;
}

// ── Handle notification click ──
async function handleNotifClick(notifId, type, data) {
  // Mark as read
  try {
    await fetch(`${API_URL}/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
  } catch (e) {}

  // Navigate based on type
  if (type === 'certificate_approved' && data.certificateId) {
    document.getElementById('notifDropdown').style.display = 'none';
    const certLink = document.querySelector('[data-page="certificates"]');
    if (certLink) certLink.click();
    setTimeout(() => {
      fetch(`${API_URL}/certificates`, {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      }).then(r => r.json()).then(d => {
        window.userCertificates = d.data || [];
        if (typeof renderUserCertificates === 'function') renderUserCertificates(window.userCertificates);
      });
    }, 300);
  } else if (type === 'enrollment_approved' || type === 'enrollment_rejected') {
    document.getElementById('notifDropdown').style.display = 'none';
    const link = document.querySelector('[data-page="enrolled-courses"]');
    if (link) link.click();
  } else if (type === 'job_accepted' || type === 'job_rejected' || type === 'job_shortlisted' || type === 'job_reviewed') {
    document.getElementById('notifDropdown').style.display = 'none';
    const link = document.querySelector('[data-page="applied-jobs"]');
    if (link) link.click();
  } else if (type === 'general') {
    document.getElementById('notifDropdown').style.display = 'none';
    const link = document.querySelector('[data-page="assessments"]');
    if (link) link.click();
  }

  loadNotifications();
}

// ── Mark all read ──
async function markAllRead() {
  try {
    await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` }
    });
    loadNotifications();
  } catch (e) {}
}

// ── Time ago helper ──
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Certificate Request ──
async function requestCertificate(courseId, courseName, btn) {
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting...'; }

  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/certificates/request`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId })
    });

    const data = await res.json();

    if (res.ok) {
      showToast(data.message || 'Certificate request submitted!', 'success');
      // Reload enrolled courses to update button state
      const r = await fetch(`${API_URL}/enrollments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (r.ok) {
        const d = await r.json();
        window.userEnrollments = d.data || [];
        if (typeof renderEnrolledCourses === 'function') renderEnrolledCourses();
      }
      // Reload cert requests
      await loadCertRequests();
    } else {
      showToast(data.message || 'Failed to submit request', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-award"></i> Request Certificate'; }
    }
  } catch (err) {
    console.error('Request cert error:', err);
    showToast('Error submitting request', 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-award"></i> Request Certificate'; }
  }
}

// ── Load user's cert requests (to show pending status) ──
async function loadCertRequests() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/certificates/requests`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      window.userCertRequests = data.data || [];
    }
  } catch (e) {}
}

// ── Mark course as complete (sets progress to 100%) ──
async function markCourseComplete(enrollmentId, courseId, courseName, btn) {
  if (!confirm(`Mark "${courseName}" as complete? This will set your progress to 100%.`)) return;

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...'; }

  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/enrollments/${enrollmentId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: 100, status: 'completed' })
    });

    if (res.ok) {
      showToast('Course marked as complete! You can now request your certificate.', 'success');
      // Reload enrollments
      const r = await fetch(`${API_URL}/enrollments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (r.ok) {
        const d = await r.json();
        window.userEnrollments = d.data || [];
        if (typeof renderEnrolledCourses === 'function') renderEnrolledCourses();
      }
    } else {
      const d = await res.json();
      showToast(d.message || 'Failed to update progress', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle"></i> Mark Complete'; }
    }
  } catch (err) {
    showToast('Error updating course', 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle"></i> Mark Complete'; }
  }
}

// Exports
window.loadNotifications    = loadNotifications;
window.markAllRead          = markAllRead;
window.handleNotifClick     = handleNotifClick;
window.requestCertificate   = requestCertificate;
window.loadCertRequests     = loadCertRequests;
window.markCourseComplete   = markCourseComplete;
