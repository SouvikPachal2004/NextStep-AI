// ===== ADMIN NOTIFICATIONS =====
// Dedicated file — loaded after all other scripts

(function () {
  'use strict';

  const POLL_MS = 30000;
  let _pollTimer = null;
  let _initialized = false;

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    if (_initialized) return;
    _initialized = true;

    createDropdown();
    attachBellClick();
    loadNotifications();
    _pollTimer = setInterval(loadNotifications, POLL_MS);
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready (script loaded late)
    init();
  }

  // ── Create dropdown (appended to body, never clipped) ─────────────────────
  function createDropdown() {
    if (document.getElementById('adminNotifDropdown')) return;

    const dd = document.createElement('div');
    dd.id = 'adminNotifDropdown';
    dd.style.cssText = [
      'display:none',
      'position:fixed',
      'width:400px',
      'max-height:520px',
      'overflow-y:auto',
      'background:var(--bg-card)',
      'border:1px solid var(--border)',
      'border-radius:var(--radius-lg)',
      'box-shadow:0 8px 40px rgba(0,0,0,0.18)',
      'z-index:99999',
    ].join(';');
    document.body.appendChild(dd);

    // Close on outside click
    document.addEventListener('click', function (e) {
      const btn = document.getElementById('notifBtn');
      const dd  = document.getElementById('adminNotifDropdown');
      if (!dd) return;
      if (btn && btn.contains(e.target)) return; // handled by bell click
      dd.style.display = 'none';
    });
  }

  // ── Attach click to bell button ───────────────────────────────────────────
  function attachBellClick() {
    const btn = document.getElementById('notifBtn');
    if (!btn) return;

    // Remove any old listeners by cloning
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);

    fresh.addEventListener('click', function (e) {
      e.stopPropagation();
      const dd = document.getElementById('adminNotifDropdown');
      if (!dd) return;

      if (dd.style.display === 'block') {
        dd.style.display = 'none';
        return;
      }

      // Position below the bell
      const rect = fresh.getBoundingClientRect();
      dd.style.top   = (rect.bottom + 8) + 'px';
      dd.style.right = (window.innerWidth - rect.right) + 'px';
      dd.style.left  = 'auto';
      dd.style.display = 'block';

      loadNotifications();
    });
  }

  // ── Load from API ─────────────────────────────────────────────────────────
  async function loadNotifications() {
    try {
      const token = (typeof getAuthToken === 'function') ? getAuthToken() : localStorage.getItem('nextstep-token');
      if (!token) return;

      const res = await fetch(API_URL + '/notifications', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (!res.ok) return;

      const data = await res.json();
      window.adminNotifications = data.data || [];
      updateBadge(data.unreadCount || 0);
      render(window.adminNotifications);
    } catch (err) {
      console.error('Admin notifications error:', err);
    }
  }

  // ── Badge ─────────────────────────────────────────────────────────────────
  function updateBadge(count) {
    const badge = document.querySelector('#notifBtn .notification-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function render(notifications) {
    const dd = document.getElementById('adminNotifDropdown');
    if (!dd) return;

    const unread = notifications.filter(function (n) { return !n.isRead; }).length;

    const typeConfig = {
      // Admin receives
      new_enrollment:       { icon: 'fa-user-graduate', color: '#6C3CE1',  bg: 'rgba(108,60,225,0.12)'  },
      course_completed:     { icon: 'fa-flag-checkered',color: '#10B981',  bg: 'rgba(16,185,129,0.12)'  },
      certificate_request:  { icon: 'fa-certificate',   color: '#c9a227',  bg: 'rgba(201,162,39,0.15)'  },
      job_application:      { icon: 'fa-briefcase',     color: '#F97316',  bg: 'rgba(249,115,22,0.12)'  },
      assessment_completed: { icon: 'fa-brain',         color: '#8B5CF6',  bg: 'rgba(139,92,246,0.12)'  },
      // User receives
      enrollment_approved:  { icon: 'fa-check-circle',  color: '#10B981',  bg: 'rgba(16,185,129,0.12)'  },
      enrollment_rejected:  { icon: 'fa-times-circle',  color: '#EF4444',  bg: 'rgba(239,68,68,0.12)'   },
      certificate_approved: { icon: 'fa-certificate',   color: '#c9a227',  bg: 'rgba(201,162,39,0.15)'  },
      certificate_rejected: { icon: 'fa-times-circle',  color: '#EF4444',  bg: 'rgba(239,68,68,0.12)'   },
      job_accepted:         { icon: 'fa-check-circle',  color: '#10B981',  bg: 'rgba(16,185,129,0.12)'  },
      job_rejected:         { icon: 'fa-times-circle',  color: '#EF4444',  bg: 'rgba(239,68,68,0.12)'   },
      job_shortlisted:      { icon: 'fa-star',          color: '#3B82F6',  bg: 'rgba(59,130,246,0.12)'  },
      job_reviewed:         { icon: 'fa-eye',           color: '#6B7280',  bg: 'rgba(107,114,128,0.12)' },
      general:              { icon: 'fa-bell',          color: '#6C3CE1',  bg: 'rgba(108,60,225,0.12)'  },
    };
    const defaultType = { icon: 'fa-bell', color: '#6C3CE1', bg: 'rgba(108,60,225,0.12)' };

    // ── Header ──
    let html = '<div style="padding:1rem 1.25rem 0.875rem;border-bottom:1px solid var(--border);'
      + 'display:flex;justify-content:space-between;align-items:center;'
      + 'position:sticky;top:0;background:var(--bg-card);z-index:1;'
      + 'border-radius:var(--radius-lg) var(--radius-lg) 0 0;">'
      + '<div style="display:flex;align-items:center;gap:0.6rem;">'
      + '<i class="fas fa-bell" style="color:#6C3CE1;font-size:1rem;"></i>'
      + '<span style="font-weight:700;color:var(--text-primary);font-size:1rem;">Notifications</span>';

    if (unread > 0) {
      html += '<span style="background:#6C3CE1;color:#fff;border-radius:20px;'
        + 'padding:0.15rem 0.55rem;font-size:0.7rem;font-weight:700;">' + unread + '</span>';
    }

    html += '</div>';

    if (unread > 0) {
      html += '<button onclick="adminMarkAllRead()" style="background:none;border:none;color:#6C3CE1;'
        + 'font-size:0.8rem;cursor:pointer;font-weight:600;padding:0.25rem 0.5rem;border-radius:6px;">'
        + 'Mark all read</button>';
    }

    html += '</div>';

    // ── Empty state ──
    if (notifications.length === 0) {
      html += '<div style="padding:3rem 1.5rem;text-align:center;color:var(--text-muted);">'
        + '<div style="width:64px;height:64px;background:rgba(108,60,225,0.08);border-radius:50%;'
        + 'display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">'
        + '<i class="fas fa-bell-slash" style="font-size:1.5rem;color:var(--text-muted);"></i></div>'
        + '<p style="font-weight:600;color:var(--text-secondary);margin:0 0 0.25rem;">All caught up!</p>'
        + '<p style="font-size:0.8rem;margin:0;">No notifications yet</p>'
        + '</div>';
    } else {
      // ── Items ──
      notifications.forEach(function (n) {
        const t = typeConfig[n.type] || defaultType;
        const bg = n.isRead ? 'transparent' : 'rgba(108,60,225,0.035)';
        const fw = n.isRead ? '500' : '700';

        html += '<div onclick="adminNotifClick(\'' + n._id + '\',\'' + n.type + '\')"'
          + ' style="padding:0.875rem 1.25rem;border-bottom:1px solid var(--border);cursor:pointer;'
          + 'background:' + bg + ';transition:background 0.15s;"'
          + ' onmouseover="this.style.background=\'rgba(108,60,225,0.07)\'"'
          + ' onmouseout="this.style.background=\'' + bg + '\'">'
          + '<div style="display:flex;gap:0.875rem;align-items:start;">'

          // Icon circle
          + '<div style="width:40px;height:40px;border-radius:50%;flex-shrink:0;'
          + 'display:flex;align-items:center;justify-content:center;font-size:1.05rem;background:' + t.bg + ';">'
          + '<i class="fas ' + t.icon + '" style="color:' + t.color + ';"></i>'
          + '</div>'

          // Text
          + '<div style="flex:1;min-width:0;">'
          + '<div style="font-weight:' + fw + ';color:var(--text-primary);font-size:0.875rem;margin-bottom:0.25rem;line-height:1.3;">'
          + escapeHtml(n.title) + '</div>'
          + '<div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5;margin-bottom:0.3rem;">'
          + escapeHtml(n.message) + '</div>'
          + '<div style="font-size:0.72rem;color:var(--text-muted);display:flex;align-items:center;gap:0.3rem;">'
          + '<i class="fas fa-clock" style="font-size:0.65rem;"></i>'
          + timeAgo(n.createdAt) + '</div>'
          + '</div>'

          // Unread dot
          + (!n.isRead
            ? '<div style="width:9px;height:9px;background:#6C3CE1;border-radius:50%;'
              + 'flex-shrink:0;margin-top:5px;box-shadow:0 0 0 2px rgba(108,60,225,0.2);"></div>'
            : '')

          + '</div></div>';
      });
    }

    // ── Footer ──
    html += '<div style="padding:0.75rem 1.25rem;text-align:center;border-top:1px solid var(--border);'
      + 'background:var(--bg-body);border-radius:0 0 var(--radius-lg) var(--radius-lg);">'
      + '<span style="font-size:0.78rem;color:var(--text-muted);">'
      + notifications.length + ' notification' + (notifications.length !== 1 ? 's' : '') + ' total'
      + '</span></div>';

    dd.innerHTML = html;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function timeAgo(dateStr) {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return 'Just now';
    if (mins  < 60) return mins  + 'm ago';
    if (hours < 24) return hours + 'h ago';
    if (days  < 7)  return days  + 'd ago';
    return new Date(dateStr).toLocaleDateString();
  }

  // ── Public API (called from inline onclick) ───────────────────────────────
  window.adminNotifClick = async function (notifId, type) {
    // Mark as read
    try {
      const token = (typeof getAuthToken === 'function') ? getAuthToken() : localStorage.getItem('nextstep-token');
      await fetch(API_URL + '/notifications/' + notifId + '/read', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token }
      });
    } catch (e) {}

    // Close dropdown
    const dd = document.getElementById('adminNotifDropdown');
    if (dd) dd.style.display = 'none';

    // Navigate to relevant section
    const navMap = {
      enrollment_approved:  'enrollments',
      enrollment_rejected:  'enrollments',
      new_enrollment:       'enrollments',
      course_completed:     'enrollments',
      certificate_approved: 'certificates',
      certificate_rejected: 'certificates',
      certificate_request:  'certificates',
      job_application:      'jobs',
      job_accepted:         'jobs',
      job_rejected:         'jobs',
      job_shortlisted:      'jobs',
      job_reviewed:         'jobs',
      assessment_completed: 'assessments',
    };
    const page = navMap[type];
    if (page) {
      const link = document.querySelector('[data-page="' + page + '"]');
      if (link) link.click();
    }

    loadNotifications();
  };

  window.adminMarkAllRead = async function () {
    try {
      const token = (typeof getAuthToken === 'function') ? getAuthToken() : localStorage.getItem('nextstep-token');
      await fetch(API_URL + '/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      loadNotifications();
    } catch (e) {}
  };

  // Expose reload for external use
  window.loadAdminNotifications = loadNotifications;

})();
