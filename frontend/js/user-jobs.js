// ===== USER JOBS MANAGEMENT =====

function renderAllJobs() {
  const container = document.getElementById('allJobsContainer');
  if (!container) return;

  // Fetch fresh applications first so accepted status + link are current
  const token = getAuthToken();
  fetch(`${API_URL}/jobs/my/applications`, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(r => r.ok ? r.json() : { data: [] })
    .then(appsData => {
      window.userApplications = appsData.data || [];
      return fetch(`${API_URL}/jobs`, { headers: { 'Authorization': `Bearer ${token}` } });
    })
    .then(r => r.json())
    .then(data => {
      const jobs = (data.data || []).filter(j => j.isActive);

      if (jobs.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;padding:4rem 2rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border);">
            <i class="fas fa-briefcase" style="font-size:3rem;color:var(--text-muted);margin-bottom:1rem;display:block;"></i>
            <p style="color:var(--text-muted);">No jobs available at the moment. Check back soon!</p>
          </div>`;
        return;
      }

      container.innerHTML = jobs.map(job => {
        const app = (window.userApplications || []).find(a => a.job._id === job._id);
        const hasApplied = !!app;

        const statusColor = { accepted:'var(--success)', rejected:'var(--danger)', shortlisted:'#3B82F6', reviewed:'var(--text-secondary)', pending:'#F59E0B' };
        const statusIcon  = { accepted:'fa-check-circle', rejected:'fa-times-circle', shortlisted:'fa-star', reviewed:'fa-eye', pending:'fa-clock' };

        return `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1rem;transition:all 0.25s ease;"
               onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='var(--primary)'"
               onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor='var(--border)'">

            <div style="display:flex;justify-content:space-between;align-items:start;gap:1rem;margin-bottom:1rem;">
              <div style="flex:1;min-width:0;">
                <h3 style="font-size:1.15rem;font-weight:700;color:var(--text-primary);margin:0 0 0.4rem;">${job.title}</h3>
                <div style="display:flex;flex-wrap:wrap;gap:1rem;color:var(--text-secondary);font-size:0.82rem;margin-bottom:0.75rem;">
                  <span><i class="fas fa-building" style="color:var(--primary);"></i> ${job.company?.name||'Company'}</span>
                  <span><i class="fas fa-map-marker-alt" style="color:var(--primary);"></i> ${job.location}</span>
                  <span><i class="fas fa-briefcase" style="color:var(--primary);"></i> ${job.employmentType}</span>
                  <span><i class="fas fa-laptop-house" style="color:var(--primary);"></i> ${job.workType}</span>
                  ${job.salary ? `<span><i class="fas fa-dollar-sign" style="color:var(--success);"></i> ${job.salary}</span>` : ''}
                </div>
                <p style="color:var(--text-secondary);font-size:0.875rem;line-height:1.6;margin:0 0 0.75rem;">${(job.description||'').substring(0,200)}${job.description?.length>200?'...':''}</p>
                <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
                  ${(job.skills||[]).slice(0,6).map(s=>`<span style="padding:0.2rem 0.65rem;background:rgba(108,60,225,0.08);color:var(--primary);border-radius:20px;font-size:0.75rem;font-weight:600;">${s}</span>`).join('')}
                  ${job.skills?.length>6?`<span style="padding:0.2rem 0.65rem;background:var(--bg-body);color:var(--text-muted);border-radius:20px;font-size:0.75rem;">+${job.skills.length-6} more</span>`:''}
                </div>
              </div>
              <div style="flex-shrink:0;text-align:right;">
                ${hasApplied
                  ? `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem;">
                       <span style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.4rem 0.9rem;border-radius:20px;font-size:0.8rem;font-weight:700;background:${statusColor[app.status]||'#F59E0B'}22;color:${statusColor[app.status]||'#F59E0B'};">
                         <i class="fas ${statusIcon[app.status]||'fa-clock'}"></i> ${app.status.charAt(0).toUpperCase()+app.status.slice(1)}
                       </span>
                       <span style="font-size:0.72rem;color:var(--text-muted);">Applied ${new Date(app.appliedAt).toLocaleDateString()}</span>
                       ${app.status === 'accepted' ? `<button class="btn btn-sm" style="background:linear-gradient(135deg,#10B981,#059669);color:#fff;border:none;font-size:0.78rem;padding:0.35rem 0.85rem;" onclick="document.querySelector('[data-page=applied-jobs]').click()"><i class="fas fa-link"></i> View Link</button>` : ''}
                     </div>`
                  : `<button class="btn btn-primary btn-sm" onclick="applyToJob('${job._id}',this)">
                       <i class="fas fa-paper-plane"></i> Apply Now
                     </button>`}
              </div>
            </div>
          </div>`;
      }).join('');
    })
    .catch(err => {
      console.error('renderAllJobs error:', err);
      container.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--danger);">Error loading jobs. Please refresh.</div>`;
    });
}

async function renderAppliedJobs() {
  const container = document.getElementById('appliedJobsContainer');
  if (!container) return;

  // Always show loading first
  container.innerHTML = `
    <div style="text-align:center;padding:3rem;">
      <i class="fas fa-spinner fa-spin" style="font-size:2rem;color:var(--primary);margin-bottom:1rem;display:block;"></i>
      <p style="color:var(--text-secondary);">Loading your applications...</p>
    </div>`;

  // Always fetch fresh data so the link appears immediately after admin accepts
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/jobs/my/applications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      window.userApplications = data.data || [];
    }
  } catch (err) {
    console.error('renderAppliedJobs fetch error:', err);
  }

  const applications = window.userApplications || [];

  if (applications.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:4rem 2rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border);">
        <i class="fas fa-clipboard-list" style="font-size:3rem;color:var(--text-muted);margin-bottom:1rem;display:block;"></i>
        <h3 style="color:var(--text-primary);margin-bottom:0.5rem;">No Applications Yet</h3>
        <p style="color:var(--text-muted);margin-bottom:1.5rem;">Browse available jobs and apply to get started.</p>
        <button class="btn btn-primary" onclick="document.querySelector('[data-page=all-jobs]').click()">
          <i class="fas fa-search"></i> Browse Jobs
        </button>
      </div>`;
    return;
  }

  const statusColor = { accepted:'var(--success)', rejected:'var(--danger)', shortlisted:'#3B82F6', reviewed:'var(--text-secondary)', pending:'#F59E0B' };
  const statusIcon  = { accepted:'fa-check-circle', rejected:'fa-times-circle', shortlisted:'fa-star', reviewed:'fa-eye', pending:'fa-clock' };
  const statusLabel = { accepted:'Accepted', rejected:'Rejected', shortlisted:'Shortlisted', reviewed:'Reviewed', pending:'Pending' };

  container.innerHTML = applications.map(app => {
    const job = app.job;
    const isAccepted = app.status === 'accepted';
    const isRejected = app.status === 'rejected';
    const hasLink    = isAccepted && app.applicationLink && app.applicationLink.trim() !== '';

    return `
      <div style="background:var(--bg-card);border:1px solid ${isAccepted?'rgba(16,185,129,0.4)':isRejected?'rgba(239,68,68,0.3)':'var(--border)'};border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1rem;transition:all 0.25s ease;${isAccepted?'box-shadow:0 4px 20px rgba(16,185,129,0.12);':''}">

        <!-- Job Info Row -->
        <div style="display:flex;justify-content:space-between;align-items:start;gap:1rem;margin-bottom:${isAccepted||isRejected||app.status==='shortlisted'||app.status==='pending'?'1rem':'0'};">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.4rem;">
              <div style="width:42px;height:42px;background:linear-gradient(135deg,#F97316,#EA580C);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;flex-shrink:0;">
                <i class="fas fa-briefcase"></i>
              </div>
              <div>
                <h3 style="font-size:1.05rem;font-weight:700;color:var(--text-primary);margin:0 0 0.2rem;">${job.title}</h3>
                <span style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.25rem 0.65rem;border-radius:20px;font-size:0.75rem;font-weight:700;background:${statusColor[app.status]||'#F59E0B'}22;color:${statusColor[app.status]||'#F59E0B'};">
                  <i class="fas ${statusIcon[app.status]||'fa-clock'}"></i> ${statusLabel[app.status]||app.status}
                </span>
              </div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:0.75rem;color:var(--text-secondary);font-size:0.8rem;margin-bottom:0.4rem;padding-left:0.25rem;">
              <span><i class="fas fa-building" style="color:var(--primary);"></i> ${job.company?.name||'Company'}</span>
              <span><i class="fas fa-map-marker-alt" style="color:var(--primary);"></i> ${job.location}</span>
              <span><i class="fas fa-briefcase" style="color:var(--primary);"></i> ${job.employmentType}</span>
              <span><i class="fas fa-laptop-house" style="color:var(--primary);"></i> ${job.workType}</span>
              ${job.salary ? `<span><i class="fas fa-dollar-sign" style="color:var(--success);"></i> ${job.salary}</span>` : ''}
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted);padding-left:0.25rem;">
              <i class="fas fa-calendar-alt"></i> Applied on ${new Date(app.appliedAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}
            </div>
          </div>
        </div>

        <!-- ACCEPTED WITH LINK -->
        ${hasLink ? `
          <div style="background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(5,150,105,0.06));border:2px solid rgba(16,185,129,0.5);border-radius:var(--radius-md);padding:1.25rem;margin-top:0.5rem;">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
              <div style="width:40px;height:40px;background:linear-gradient(135deg,#10B981,#059669);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                <i class="fas fa-check" style="color:#fff;font-size:1rem;"></i>
              </div>
              <div>
                <div style="font-weight:700;color:var(--success);font-size:0.95rem;">🎉 Congratulations! Your application was accepted.</div>
                <div style="font-size:0.78rem;color:var(--text-secondary);">Use the link below to proceed with the next step.</div>
              </div>
            </div>
            <a href="${app.applicationLink}" target="_blank" rel="noopener noreferrer"
               style="display:inline-flex;align-items:center;gap:0.6rem;background:linear-gradient(135deg,#10B981,#059669);color:#fff;padding:0.7rem 1.5rem;border-radius:var(--radius-md);font-weight:700;font-size:0.9rem;text-decoration:none;box-shadow:0 4px 12px rgba(16,185,129,0.3);transition:all 0.2s;"
               onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 16px rgba(16,185,129,0.4)'"
               onmouseout="this.style.transform='';this.style.boxShadow='0 4px 12px rgba(16,185,129,0.3)'">
              <i class="fas fa-external-link-alt"></i> Open Application Link
            </a>
            <div style="margin-top:0.75rem;padding:0.5rem 0.75rem;background:rgba(0,0,0,0.04);border-radius:8px;font-size:0.75rem;color:var(--text-muted);word-break:break-all;display:flex;align-items:center;gap:0.4rem;">
              <i class="fas fa-link" style="color:var(--success);flex-shrink:0;"></i>
              <span>${app.applicationLink}</span>
            </div>
          </div>` : ''}

        <!-- ACCEPTED WITHOUT LINK -->
        ${isAccepted && !hasLink ? `
          <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:var(--radius-md);padding:1rem;margin-top:0.5rem;display:flex;align-items:center;gap:0.75rem;">
            <i class="fas fa-check-circle" style="color:var(--success);font-size:1.25rem;flex-shrink:0;"></i>
            <div>
              <div style="font-weight:700;color:var(--success);font-size:0.875rem;">🎉 Your application was accepted!</div>
              <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:0.2rem;">The admin will share the next steps with you soon.</div>
            </div>
          </div>` : ''}

        <!-- REJECTED -->
        ${isRejected ? `
          <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:0.875rem 1rem;margin-top:0.5rem;display:flex;align-items:center;gap:0.75rem;">
            <i class="fas fa-times-circle" style="color:var(--danger);font-size:1.1rem;flex-shrink:0;"></i>
            <div style="font-size:0.82rem;color:var(--danger);font-weight:600;">This application was not selected. Keep applying to other opportunities!</div>
          </div>` : ''}

        <!-- SHORTLISTED -->
        ${app.status === 'shortlisted' ? `
          <div style="background:rgba(59,130,246,0.07);border:1px solid rgba(59,130,246,0.25);border-radius:var(--radius-md);padding:0.875rem 1rem;margin-top:0.5rem;display:flex;align-items:center;gap:0.75rem;">
            <i class="fas fa-star" style="color:#3B82F6;font-size:1.1rem;flex-shrink:0;"></i>
            <div style="font-size:0.82rem;color:#3B82F6;font-weight:600;">You've been shortlisted! The admin will review your profile and update you soon.</div>
          </div>` : ''}

        <!-- PENDING -->
        ${app.status === 'pending' ? `
          <div style="background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.25);border-radius:var(--radius-md);padding:0.875rem 1rem;margin-top:0.5rem;display:flex;align-items:center;gap:0.75rem;">
            <i class="fas fa-clock" style="color:#D97706;font-size:1.1rem;flex-shrink:0;"></i>
            <div style="font-size:0.82rem;color:#D97706;font-weight:600;">Your application is under review. We'll notify you when there's an update.</div>
          </div>` : ''}

        <!-- REVIEWED -->
        ${app.status === 'reviewed' ? `
          <div style="background:rgba(107,114,128,0.07);border:1px solid rgba(107,114,128,0.2);border-radius:var(--radius-md);padding:0.875rem 1rem;margin-top:0.5rem;display:flex;align-items:center;gap:0.75rem;">
            <i class="fas fa-eye" style="color:var(--text-secondary);font-size:1.1rem;flex-shrink:0;"></i>
            <div style="font-size:0.82rem;color:var(--text-secondary);font-weight:600;">Your application has been reviewed. A decision will be made soon.</div>
          </div>` : ''}
      </div>`;
  }).join('');
}

async function applyToJob(jobId, btn) {
  if (btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Applying...'; }
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: {'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}
    });
    const data = await res.json();
    if (res.ok) {
      showToast('Application submitted successfully! 🎉', 'success');
      const appsRes = await fetch(`${API_URL}/jobs/my/applications`, { headers: {'Authorization':`Bearer ${token}`} });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        window.userApplications = appsData.data || [];
        renderAllJobs();
      }
    } else {
      showToast(data.message||'Failed to apply', 'error');
      if (btn) { btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Apply Now'; }
    }
  } catch (err) {
    console.error('applyToJob error:', err);
    showToast('Error submitting application', 'error');
    if (btn) { btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Apply Now'; }
  }
}

async function loadUserApplications() {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/jobs/my/applications`, { headers: {'Authorization':`Bearer ${token}`} });
    if (res.ok) {
      const data = await res.json();
      window.userApplications = data.data || [];
    }
  } catch (err) {
    console.error('loadUserApplications error:', err);
  }
}

window.renderAllJobs = renderAllJobs;
window.renderAppliedJobs = renderAppliedJobs;
window.applyToJob = applyToJob;
window.loadUserApplications = loadUserApplications;
