// ===== USER ASSESSMENTS =====

function renderUserAssessments(assessments) {
  const container = document.getElementById('assessmentsContainer');
  if (!container) return;

  const userId = getUserData()?._id || getUserData()?.id;
  const allAttempts = (assessments || []).flatMap(a =>
    (a.attempts||[]).filter(att => String(att.user)===String(userId))
  );
  const passedAttempts = allAttempts.filter(a => a.passed);
  const avgScore = allAttempts.length > 0
    ? Math.round(allAttempts.reduce((s,a) => s + (a.percentage||0), 0) / allAttempts.length)
    : 0;
  const bestScore = allAttempts.length > 0
    ? Math.max(...allAttempts.map(a => a.percentage||0))
    : 0;

  if (!assessments || assessments.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:4rem 2rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border);">
        <div style="width:80px;height:80px;background:linear-gradient(135deg,rgba(108,60,225,0.1),rgba(139,92,246,0.1));border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:2rem;color:var(--primary);">
          <i class="fas fa-brain"></i>
        </div>
        <h3 style="color:var(--text-primary);margin-bottom:0.5rem;">No Assessments Yet</h3>
        <p style="color:var(--text-muted);">Assessments will appear here once the admin publishes them.</p>
      </div>`;
    return;
  }

  // ── Performance Summary + Chart ──
  const perfHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-xl);padding:1.5rem;margin-bottom:1.5rem;box-shadow:var(--shadow-card);">
      <h3 style="font-size:1.05rem;font-weight:700;color:var(--text-primary);margin:0 0 1.25rem;display:flex;align-items:center;gap:0.5rem;">
        <i class="fas fa-chart-bar" style="color:var(--primary);"></i> Performance Overview
      </h3>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem;">
        <div style="background:var(--primary-soft);border-radius:var(--radius-lg);padding:1rem;text-align:center;">
          <div style="font-size:1.75rem;font-weight:800;color:var(--primary);">${assessments.length}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);font-weight:600;margin-top:2px;">Available</div>
        </div>
        <div style="background:var(--secondary-soft);border-radius:var(--radius-lg);padding:1rem;text-align:center;">
          <div style="font-size:1.75rem;font-weight:800;color:var(--secondary);">${allAttempts.length}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);font-weight:600;margin-top:2px;">Attempts</div>
        </div>
        <div style="background:var(--success-light);border-radius:var(--radius-lg);padding:1rem;text-align:center;">
          <div style="font-size:1.75rem;font-weight:800;color:var(--success);">${passedAttempts.length}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);font-weight:600;margin-top:2px;">Passed</div>
        </div>
        <div style="background:rgba(249,115,22,0.1);border-radius:var(--radius-lg);padding:1rem;text-align:center;">
          <div style="font-size:1.75rem;font-weight:800;color:#F97316;">${avgScore}%</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);font-weight:600;margin-top:2px;">Avg Score</div>
        </div>
      </div>
      ${allAttempts.length > 0 ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
          <!-- Score per assessment bar chart -->
          <div>
            <div style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.75rem;">Score by Assessment</div>
            <div style="height:160px;position:relative;">
              <canvas id="assessmentScoreChart"></canvas>
            </div>
          </div>
          <!-- Pass/Fail donut -->
          <div>
            <div style="font-size:0.82rem;font-weight:600;color:var(--text-secondary);margin-bottom:0.75rem;">Pass / Fail Rate</div>
            <div style="display:flex;align-items:center;gap:1.5rem;">
              <div style="position:relative;width:120px;height:120px;flex-shrink:0;">
                <canvas id="assessmentPassChart"></canvas>
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;">
                  <div style="font-size:1.2rem;font-weight:800;color:var(--success);">${allAttempts.length > 0 ? Math.round((passedAttempts.length/allAttempts.length)*100) : 0}%</div>
                  <div style="font-size:0.65rem;color:var(--text-muted);">PASS</div>
                </div>
              </div>
              <div style="flex:1;display:flex;flex-direction:column;gap:0.75rem;">
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.3rem;">
                    <span style="color:var(--text-secondary);">Best Score</span>
                    <span style="font-weight:700;color:var(--success);">${bestScore}%</span>
                  </div>
                  <div style="height:6px;background:var(--border);border-radius:var(--radius-full);overflow:hidden;">
                    <div style="height:100%;width:${bestScore}%;background:linear-gradient(90deg,#10B981,#059669);border-radius:var(--radius-full);"></div>
                  </div>
                </div>
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.3rem;">
                    <span style="color:var(--text-secondary);">Avg Score</span>
                    <span style="font-weight:700;color:var(--primary);">${avgScore}%</span>
                  </div>
                  <div style="height:6px;background:var(--border);border-radius:var(--radius-full);overflow:hidden;">
                    <div style="height:100%;width:${avgScore}%;background:linear-gradient(90deg,#6C3CE1,#8B5CF6);border-radius:var(--radius-full);"></div>
                  </div>
                </div>
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.3rem;">
                    <span style="color:var(--text-secondary);">Pass Mark</span>
                    <span style="font-weight:700;color:var(--warning);">80%</span>
                  </div>
                  <div style="height:6px;background:var(--border);border-radius:var(--radius-full);overflow:hidden;">
                    <div style="height:100%;width:80%;background:linear-gradient(90deg,#F59E0B,#D97706);border-radius:var(--radius-full);"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ` : `
        <div style="text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.875rem;">
          <i class="fas fa-play-circle" style="font-size:1.5rem;margin-bottom:0.5rem;display:block;opacity:0.4;"></i>
          Take your first assessment to see performance charts
        </div>
      `}
    </div>`;

  // ── Assessment Cards ──
  const cardsHTML = assessments.map(a => {
    const userAttempts = (a.attempts||[]).filter(att => String(att.user)===String(userId));
    const best = userAttempts.sort((x,y)=>y.percentage-x.percentage)[0];
    const qCount = a.questions?.length || 0;
    const canStart = qCount > 0;

    const diffColor = a.difficulty==='Easy' ? 'var(--success)' : a.difficulty==='Hard' ? 'var(--danger)' : '#3B82F6';
    const diffBg   = a.difficulty==='Easy' ? 'rgba(16,185,129,0.1)' : a.difficulty==='Hard' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)';

    return `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1rem;transition:all 0.25s ease;cursor:default;"
           onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='var(--primary)'"
           onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor='var(--border)'">

        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem;gap:1rem;">
          <div style="display:flex;align-items:center;gap:1rem;flex:1;min-width:0;">
            <div style="width:54px;height:54px;background:linear-gradient(135deg,#6C3CE1,#8B5CF6);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:#fff;flex-shrink:0;box-shadow:0 4px 12px rgba(108,60,225,0.3);">
              <i class="fas fa-brain"></i>
            </div>
            <div style="min-width:0;">
              <h4 style="font-size:1.05rem;font-weight:700;color:var(--text-primary);margin:0 0 0.25rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.title}</h4>
              <p style="font-size:0.82rem;color:var(--text-secondary);margin:0;">${a.description || 'Test your knowledge'}</p>
            </div>
          </div>
          <span style="padding:0.3rem 0.75rem;border-radius:20px;font-size:0.75rem;font-weight:700;background:${diffBg};color:${diffColor};flex-shrink:0;">${a.difficulty||'Medium'}</span>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:1.25rem;margin-bottom:1rem;font-size:0.82rem;color:var(--text-secondary);">
          <span style="display:flex;align-items:center;gap:0.4rem;"><i class="fas fa-clock" style="color:var(--primary);"></i> ${a.duration||30} min</span>
          <span style="display:flex;align-items:center;gap:0.4rem;"><i class="fas fa-question-circle" style="color:var(--primary);"></i> ${qCount} question${qCount!==1?'s':''}</span>
          <span style="display:flex;align-items:center;gap:0.4rem;"><i class="fas fa-tag" style="color:var(--primary);"></i> ${a.category||'General'}</span>
          <span style="display:flex;align-items:center;gap:0.4rem;"><i class="fas fa-trophy" style="color:#c9a227;"></i> Pass: 80%</span>
        </div>

        ${best ? `
          <div style="background:${best.passed?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)'};border:1px solid ${best.passed?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'};border-radius:var(--radius-md);padding:0.65rem 1rem;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:700;font-size:0.875rem;color:${best.passed?'var(--success)':'var(--danger)'};">
              <i class="fas ${best.passed?'fa-check-circle':'fa-times-circle'}"></i>
              Best score: ${best.percentage}% &bull; ${userAttempts.length} attempt${userAttempts.length!==1?'s':''}
            </span>
            <span style="padding:0.2rem 0.6rem;border-radius:20px;font-size:0.72rem;font-weight:700;background:${best.passed?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)'};color:${best.passed?'var(--success)':'var(--danger)'};">${best.passed?'Passed':'Failed'}</span>
          </div>` : ''}

        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
          ${canStart
            ? `<button class="btn btn-primary btn-sm" onclick="startAssessment('${a._id}')">
                <i class="fas fa-play"></i> ${best?'Retake':'Start'} Assessment
               </button>`
            : `<button class="btn btn-outline btn-sm" disabled style="opacity:0.5;cursor:not-allowed;">
                <i class="fas fa-lock"></i> Not Available
               </button>`}
          ${best ? `<button class="btn btn-outline btn-sm" onclick="viewAssessmentResults('${a._id}')"><i class="fas fa-chart-bar"></i> View Results</button>` : ''}
        </div>
      </div>`;
  }).join('');

  container.innerHTML = perfHTML + cardsHTML;

  // Init charts after DOM render
  if (allAttempts.length > 0) {
    setTimeout(() => {
      // Score per assessment bar chart
      const scoreCtx = document.getElementById('assessmentScoreChart');
      if (scoreCtx && typeof Chart !== 'undefined') {
        const chartData = assessments.map(a => {
          const attempts = (a.attempts||[]).filter(att => String(att.user)===String(userId));
          const best = attempts.sort((x,y)=>y.percentage-x.percentage)[0];
          return { label: a.title.length > 12 ? a.title.substring(0,12)+'…' : a.title, score: best ? best.percentage : 0, passed: best ? best.passed : false };
        }).filter(d => d.score > 0);

        new Chart(scoreCtx, {
          type: 'bar',
          data: {
            labels: chartData.map(d => d.label),
            datasets: [{
              label: 'Best Score',
              data: chartData.map(d => d.score),
              backgroundColor: chartData.map(d => d.passed ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.7)'),
              borderRadius: 6,
              borderSkipped: false
            }, {
              label: 'Pass Mark',
              data: chartData.map(() => 80),
              type: 'line',
              borderColor: '#F59E0B',
              borderWidth: 2,
              borderDash: [4,4],
              pointRadius: 0,
              fill: false
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}%` } } },
            scales: {
              y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' }, grid: { color: 'rgba(0,0,0,0.04)' } },
              x: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
          }
        });
      }

      // Pass/Fail donut
      const passCtx = document.getElementById('assessmentPassChart');
      if (passCtx && typeof Chart !== 'undefined') {
        const failed = allAttempts.length - passedAttempts.length;
        new Chart(passCtx, {
          type: 'doughnut',
          data: {
            labels: ['Passed', 'Failed'],
            datasets: [{
              data: [passedAttempts.length || 0.001, failed || 0.001],
              backgroundColor: ['#10B981', '#EF4444'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '68%',
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw === 0.001 ? 0 : ctx.raw}` } } }
          }
        });
      }
    }, 100);
  }
}
    const userAttempts = (a.attempts||[]).filter(att => String(att.user)===String(userId));
    const best = userAttempts.sort((x,y)=>y.percentage-x.percentage)[0];
    const qCount = a.questions?.length || 0;
    const canStart = qCount > 0;

    const diffColor = a.difficulty==='Easy' ? 'var(--success)' : a.difficulty==='Hard' ? 'var(--danger)' : '#3B82F6';
    const diffBg   = a.difficulty==='Easy' ? 'rgba(16,185,129,0.1)' : a.difficulty==='Hard' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)';

    return `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1rem;transition:all 0.25s ease;cursor:default;"
           onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='var(--primary)'"
           onmouseout="this.style.transform='';this.style.boxShadow='';this.style.borderColor='var(--border)'">

        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem;gap:1rem;">
          <div style="display:flex;align-items:center;gap:1rem;flex:1;min-width:0;">
            <div style="width:54px;height:54px;background:linear-gradient(135deg,#6C3CE1,#8B5CF6);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:#fff;flex-shrink:0;box-shadow:0 4px 12px rgba(108,60,225,0.3);">
              <i class="fas fa-brain"></i>
            </div>
            <div style="min-width:0;">
              <h4 style="font-size:1.05rem;font-weight:700;color:var(--text-primary);margin:0 0 0.25rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.title}</h4>
              <p style="font-size:0.82rem;color:var(--text-secondary);margin:0;">${a.description || 'Test your knowledge'}</p>
            </div>
          </div>
          <span style="padding:0.3rem 0.75rem;border-radius:20px;font-size:0.75rem;font-weight:700;background:${diffBg};color:${diffColor};flex-shrink:0;">${a.difficulty||'Medium'}</span>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:1.25rem;margin-bottom:1rem;font-size:0.82rem;color:var(--text-secondary);">
          <span style="display:flex;align-items:center;gap:0.4rem;"><i class="fas fa-clock" style="color:var(--primary);"></i> ${a.duration||30} min</span>
          <span style="display:flex;align-items:center;gap:0.4rem;"><i class="fas fa-question-circle" style="color:var(--primary);"></i> ${qCount} question${qCount!==1?'s':''}</span>
          <span style="display:flex;align-items:center;gap:0.4rem;"><i class="fas fa-tag" style="color:var(--primary);"></i> ${a.category||'General'}</span>
          <span style="display:flex;align-items:center;gap:0.4rem;"><i class="fas fa-trophy" style="color:#c9a227;"></i> Pass: 80%</span>
        </div>

        ${best ? `
          <div style="background:${best.passed?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.08)'};border:1px solid ${best.passed?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'};border-radius:var(--radius-md);padding:0.65rem 1rem;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:700;font-size:0.875rem;color:${best.passed?'var(--success)':'var(--danger)'};">
              <i class="fas ${best.passed?'fa-check-circle':'fa-times-circle'}"></i>
              Best score: ${best.percentage}% &bull; ${userAttempts.length} attempt${userAttempts.length!==1?'s':''}
            </span>
            <span style="padding:0.2rem 0.6rem;border-radius:20px;font-size:0.72rem;font-weight:700;background:${best.passed?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)'};color:${best.passed?'var(--success)':'var(--danger)'};">${best.passed?'Passed':'Failed'}</span>
          </div>` : ''}

        <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
          ${canStart
            ? `<button class="btn btn-primary btn-sm" onclick="startAssessment('${a._id}')">
                <i class="fas fa-play"></i> ${best?'Retake':'Start'} Assessment
               </button>`
            : `<button class="btn btn-outline btn-sm" disabled style="opacity:0.5;cursor:not-allowed;">
                <i class="fas fa-lock"></i> Not Available
               </button>`}
          ${best ? `<button class="btn btn-outline btn-sm" onclick="viewAssessmentResults('${a._id}')"><i class="fas fa-chart-bar"></i> View Results</button>` : ''}
        </div>
      </div>`;
  }).join('');
}

async function startAssessment(assessmentId) {
  try {
    showToast('Loading assessment...', 'info');
    const res = await fetch(`${API_URL}/assessments/${assessmentId}`, { headers: {'Authorization':`Bearer ${getAuthToken()}`} });
    if (!res.ok) { showToast('Failed to load assessment', 'error'); return; }
    const data = await res.json();
    const assessment = data.data;
    if (!assessment.questions || assessment.questions.length === 0) { showToast('This assessment has no questions yet', 'warning'); return; }
    openQuizModal(assessment);
  } catch (err) {
    console.error('startAssessment error:', err);
    showToast('Error loading assessment', 'error');
  }
}

// ===== QUIZ MODAL =====
function openQuizModal(assessment) {
  window._quizState = {
    assessment,
    currentQuestion: 0,
    answers: {},
    startTime: Date.now(),
    timerInterval: null
  };

  const total = assessment.questions.length;
  const totalSeconds = (assessment.duration || 30) * 60;

  const dotsHTML = assessment.questions.map((_,i) =>
    `<button onclick="quizGoTo(${i})" id="qdot-${i}" style="width:32px;height:32px;border-radius:50%;border:2px solid var(--border);background:var(--bg-body);cursor:pointer;font-size:0.72rem;font-weight:700;transition:all 0.2s;color:var(--text-secondary);">${i+1}</button>`
  ).join('');

  const html = `
    <div id="quizModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;">
      <div style="background:var(--bg-card);border-radius:var(--radius-xl);width:100%;max-width:780px;max-height:96vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.4);">

        <!-- Quiz Header -->
        <div style="background:linear-gradient(135deg,#6C3CE1,#8B5CF6);padding:1.25rem 1.75rem;color:#fff;flex-shrink:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
            <div>
              <h3 style="margin:0;font-size:1.1rem;font-weight:700;">${assessment.title}</h3>
              <p style="margin:0.2rem 0 0;font-size:0.78rem;opacity:0.85;">${assessment.category} &bull; ${assessment.difficulty} &bull; Pass: 80%</p>
            </div>
            <div style="display:flex;align-items:center;gap:0.75rem;">
              <div id="quizTimerBox" style="background:rgba(255,255,255,0.2);padding:0.4rem 1rem;border-radius:20px;font-weight:700;font-size:1rem;display:flex;align-items:center;gap:0.4rem;">
                <i class="fas fa-clock"></i> <span id="timerDisplay">--:--</span>
              </div>
              <button onclick="confirmQuitQuiz()" style="background:rgba(255,255,255,0.2);border:none;color:#fff;width:34px;height:34px;border-radius:8px;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;"><i class="fas fa-times"></i></button>
            </div>
          </div>
          <!-- Progress bar -->
          <div style="background:rgba(255,255,255,0.25);border-radius:10px;height:6px;">
            <div id="quizProgressBar" style="background:#fff;height:6px;border-radius:10px;transition:width 0.4s ease;width:0%;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:0.4rem;font-size:0.75rem;opacity:0.9;">
            <span id="questionCounter">Question 1 of ${total}</span>
            <span id="answeredCount">0 / ${total} answered</span>
          </div>
        </div>

        <!-- Question Body -->
        <div id="quizBody" style="flex:1;overflow-y:auto;padding:2rem 2rem 1rem;"></div>

        <!-- Navigation Footer -->
        <div style="padding:1rem 2rem 1.5rem;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);flex-shrink:0;background:var(--bg-card);">
          <button id="prevBtn" class="btn btn-outline" onclick="quizNavigate(-1)" disabled style="min-width:110px;">
            <i class="fas fa-arrow-left"></i> Previous
          </button>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;justify-content:center;max-width:400px;" id="questionDots">
            ${dotsHTML}
          </div>
          <button id="nextBtn" class="btn btn-primary" onclick="quizNavigate(1)" style="min-width:110px;">
            Next <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', html);

  let remaining = totalSeconds;
  updateTimerDisplay(remaining);
  window._quizState.timerInterval = setInterval(() => {
    remaining--;
    updateTimerDisplay(remaining);
    if (remaining <= 60 && remaining > 0) {
      document.getElementById('quizTimerBox').style.background = 'rgba(239,68,68,0.7)';
    }
    if (remaining <= 0) {
      clearInterval(window._quizState.timerInterval);
      showToast('Time is up! Submitting...', 'warning');
      submitQuiz();
    }
  }, 1000);

  renderQuestion(0);
}

function updateTimerDisplay(seconds) {
  const m = Math.floor(seconds/60).toString().padStart(2,'0');
  const s = (seconds%60).toString().padStart(2,'0');
  const el = document.getElementById('timerDisplay');
  if (el) el.textContent = `${m}:${s}`;
}

function renderQuestion(index) {
  const state = window._quizState;
  const q = state.assessment.questions[index];
  const total = state.assessment.questions.length;
  const savedAnswer = state.answers[q._id];
  state.currentQuestion = index;

  const answered = Object.keys(state.answers).length;
  const pct = Math.round((answered/total)*100);

  const pb = document.getElementById('quizProgressBar');
  if (pb) pb.style.width = pct + '%';
  const qc = document.getElementById('questionCounter');
  if (qc) qc.textContent = `Question ${index+1} of ${total}`;
  const ac = document.getElementById('answeredCount');
  if (ac) ac.textContent = `${answered} / ${total} answered`;

  // Update dots
  for (let i=0; i<total; i++) {
    const dot = document.getElementById(`qdot-${i}`);
    if (!dot) continue;
    const qi = state.assessment.questions[i];
    if (i===index) {
      dot.style.background='var(--primary)'; dot.style.color='#fff'; dot.style.borderColor='var(--primary)';
    } else if (state.answers[qi._id]) {
      dot.style.background='rgba(16,185,129,0.15)'; dot.style.color='var(--success)'; dot.style.borderColor='var(--success)';
    } else {
      dot.style.background='var(--bg-body)'; dot.style.color='var(--text-secondary)'; dot.style.borderColor='var(--border)';
    }
  }

  const prevBtn = document.getElementById('prevBtn');
  if (prevBtn) prevBtn.disabled = index===0;

  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    if (index===total-1) {
      nextBtn.innerHTML='<i class="fas fa-check-circle"></i> Submit';
      nextBtn.onclick=()=>confirmSubmitQuiz();
      nextBtn.style.background='linear-gradient(135deg,#10B981,#059669)';
      nextBtn.style.borderColor='transparent';
    } else {
      nextBtn.innerHTML='Next <i class="fas fa-arrow-right"></i>';
      nextBtn.onclick=()=>quizNavigate(1);
      nextBtn.style.background='';
      nextBtn.style.borderColor='';
    }
  }

  const options = (q.options && q.options.length>0) ? q.options : ['True','False'];
  const letters = ['A','B','C','D','E'];

  const body = document.getElementById('quizBody');
  if (!body) return;

  body.innerHTML = `
    <div>
      <div style="display:flex;align-items:start;gap:1rem;margin-bottom:1.75rem;">
        <span style="background:linear-gradient(135deg,#6C3CE1,#8B5CF6);color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;flex-shrink:0;box-shadow:0 4px 12px rgba(108,60,225,0.3);">${index+1}</span>
        <p style="font-size:1.05rem;font-weight:600;color:var(--text-primary);margin:0;line-height:1.6;">${q.question}</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${options.map((opt,oi) => {
          const letter = letters[oi] || String(oi+1);
          const isSelected = savedAnswer===opt;
          return `
            <label onclick="selectAnswer('${q._id}','${opt.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')"
              style="display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;border:2px solid ${isSelected?'var(--primary)':'var(--border)'};border-radius:var(--radius-md);cursor:pointer;transition:all 0.2s;background:${isSelected?'rgba(108,60,225,0.07)':'var(--bg-body)'};user-select:none;"
              onmouseover="if(!${isSelected})this.style.borderColor='rgba(108,60,225,0.4)'"
              onmouseout="if(!${isSelected})this.style.borderColor='var(--border)'">
              <span style="width:32px;height:32px;border-radius:50%;border:2px solid ${isSelected?'var(--primary)':'var(--border)'};display:flex;align-items:center;justify-content:center;font-size:0.82rem;font-weight:700;color:${isSelected?'#fff':'var(--text-muted)'};background:${isSelected?'var(--primary)':'transparent'};flex-shrink:0;transition:all 0.2s;">${letter}</span>
              <span style="font-size:0.95rem;color:var(--text-primary);flex:1;">${opt}</span>
              ${isSelected?'<i class="fas fa-check-circle" style="color:var(--primary);font-size:1.1rem;"></i>':''}
            </label>`;
        }).join('')}
      </div>
    </div>`;
}

function selectAnswer(questionId, answer) {
  window._quizState.answers[questionId] = answer;
  renderQuestion(window._quizState.currentQuestion);
}

function quizNavigate(dir) {
  const state = window._quizState;
  const next = state.currentQuestion + dir;
  if (next>=0 && next<state.assessment.questions.length) renderQuestion(next);
}

function quizGoTo(i) { renderQuestion(i); }

function confirmSubmitQuiz() {
  const state = window._quizState;
  const unanswered = state.assessment.questions.length - Object.keys(state.answers).length;
  if (unanswered>0 && !confirm(`You have ${unanswered} unanswered question${unanswered>1?'s':''}. Submit anyway?`)) return;
  submitQuiz();
}

function confirmQuitQuiz() {
  if (confirm('Quit the assessment? Your progress will be lost.')) {
    clearInterval(window._quizState?.timerInterval);
    document.getElementById('quizModal')?.remove();
  }
}

// ===== SUBMIT & RESULTS =====
async function submitQuiz() {
  const state = window._quizState;
  clearInterval(state.timerInterval);
  const timeTaken = Math.round((Date.now()-state.startTime)/1000);
  const answers = Object.entries(state.answers).map(([questionId,answer])=>({questionId,answer}));

  const body = document.getElementById('quizBody');
  if (body) body.innerHTML = `
    <div style="text-align:center;padding:4rem 2rem;">
      <div style="width:80px;height:80px;background:linear-gradient(135deg,rgba(108,60,225,0.1),rgba(139,92,246,0.1));border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:2rem;color:var(--primary);">
        <i class="fas fa-spinner fa-spin"></i>
      </div>
      <p style="color:var(--text-secondary);font-size:1rem;">Grading your answers...</p>
    </div>`;

  try {
    const res = await fetch(`${API_URL}/assessments/${state.assessment._id}/attempt`, {
      method: 'POST',
      headers: {'Authorization':`Bearer ${getAuthToken()}`,'Content-Type':'application/json'},
      body: JSON.stringify({answers, timeTaken})
    });
    const data = await res.json();
    if (res.ok) showQuizResults(data.data, state.assessment);
    else { showToast(data.message||'Failed to submit','error'); document.getElementById('quizModal')?.remove(); }
  } catch (err) {
    console.error('submitQuiz error:', err);
    showToast('Error submitting quiz','error');
    document.getElementById('quizModal')?.remove();
  }
}

function generateRecommendations(gradedAnswers, assessment) {
  const wrong = gradedAnswers.filter(ga=>!ga.isCorrect);
  if (wrong.length===0) return ['<li><strong>Perfect score!</strong> You have mastered all topics in this assessment.</li>'];
  const recs = [];
  const category = assessment.category||'General';
  const wrongCount = wrong.length;
  const total = gradedAnswers.length;
  const pct = Math.round(((total-wrongCount)/total)*100);

  if (pct<50) recs.push(`<li><strong>Foundational Review Needed:</strong> You scored ${pct}% on ${category}. Start with the basics before retaking.</li>`);
  else if (pct<80) recs.push(`<li><strong>Almost There:</strong> You scored ${pct}% — just ${80-pct}% away from passing. Focus on the ${wrongCount} questions you missed.</li>`);

  if (wrongCount>=8) recs.push(`<li><strong>Deep Study Required:</strong> You missed ${wrongCount}/${total} questions. Dedicate 2-3 hours reviewing ${category} fundamentals.</li>`);
  else if (wrongCount>=4) recs.push(`<li><strong>Targeted Practice:</strong> You missed ${wrongCount} questions. Review the specific topics covered in those questions.</li>`);
  else recs.push(`<li><strong>Minor Gaps:</strong> Only ${wrongCount} question${wrongCount>1?'s':''} wrong. A quick review should get you to 80%+.</li>`);

  const tips = {
    'JavaScript':['Review closures, promises, and async/await','Practice array methods: map, filter, reduce','Study ES6+ features: destructuring, spread, arrow functions'],
    'Python':['Review data structures: lists, dicts, sets','Study OOP: classes, inheritance, decorators','Practice built-in functions and list comprehensions'],
    'React':['Review hooks: useState, useEffect, useContext','Study component lifecycle and re-rendering','Practice state management patterns'],
    'Node.js':['Review the event loop and async patterns','Study Express.js middleware and routing','Practice REST API design and error handling'],
    'Data Science':['Review statistical concepts: mean, median, variance','Study data preprocessing and feature engineering','Practice with pandas and numpy'],
    'Machine Learning':['Review supervised vs unsupervised learning','Study evaluation metrics: accuracy, precision, recall','Practice with scikit-learn pipelines'],
    'Web Development':['Review HTML semantics and accessibility','Study CSS flexbox, grid, and responsive design','Practice JavaScript DOM manipulation'],
    'General':['Review the course material thoroughly','Take notes on key concepts','Practice with additional exercises']
  };
  const catTips = tips[category]||tips['General'];
  catTips.slice(0, Math.min(3, wrongCount)).forEach(t=>recs.push(`<li>${t}</li>`));
  recs.push(`<li><strong>Retake Strategy:</strong> Review all ${wrongCount} incorrect answers below, understand why each correct answer is right, then retake.</li>`);
  return recs;
}

function showQuizResults(result, assessment) {
  const modal = document.getElementById('quizModal');
  if (!modal) return;

  const passed = result.passed;
  const correct = (result.gradedAnswers||[]).filter(ga=>ga.isCorrect).length;
  const wrong = (result.gradedAnswers||[]).filter(ga=>!ga.isCorrect).length;
  const mins = Math.floor((result.timeTaken||0)/60);
  const secs = (result.timeTaken||0)%60;
  const recs = generateRecommendations(result.gradedAnswers||[], assessment);

  modal.innerHTML = `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;">
      <div style="background:var(--bg-card);border-radius:var(--radius-xl);width:100%;max-width:720px;max-height:96vh;overflow-y:auto;box-shadow:0 24px 80px rgba(0,0,0,0.4);">

        <!-- Result Header -->
        <div style="background:linear-gradient(135deg,${passed?'#10B981,#059669':'#EF4444,#DC2626'});padding:2rem;text-align:center;color:#fff;border-radius:var(--radius-xl) var(--radius-xl) 0 0;">
          <div style="font-size:3.5rem;margin-bottom:0.75rem;">${passed?'🎉':'📚'}</div>
          <h2 style="font-size:1.6rem;font-weight:800;margin:0 0 0.4rem;">${passed?'Congratulations! You Passed!':'Keep Practicing!'}</h2>
          <p style="opacity:0.9;font-size:0.9rem;margin:0;">${passed?'You scored 80%+ and passed the assessment!':'You need 80% to pass. Review the recommendations below.'}</p>
        </div>

        <div style="padding:1.5rem 2rem;">

          <!-- Score Grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
            <div style="background:var(--bg-body);border-radius:var(--radius-lg);padding:1.5rem;text-align:center;border:2px solid ${passed?'var(--success)':'var(--danger)'};">
              <div style="font-size:3rem;font-weight:800;color:${passed?'var(--success)':'var(--danger)'};">${result.percentage}%</div>
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.25rem;">Your Score</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">Pass mark: 80%</div>
            </div>
            <div style="background:var(--bg-body);border-radius:var(--radius-lg);padding:1rem;">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;height:100%;">
                <div style="text-align:center;padding:0.75rem;background:rgba(16,185,129,0.1);border-radius:10px;display:flex;flex-direction:column;justify-content:center;">
                  <div style="font-size:1.6rem;font-weight:700;color:var(--success);">${correct}</div>
                  <div style="font-size:0.72rem;color:var(--text-muted);">Correct</div>
                </div>
                <div style="text-align:center;padding:0.75rem;background:rgba(239,68,68,0.1);border-radius:10px;display:flex;flex-direction:column;justify-content:center;">
                  <div style="font-size:1.6rem;font-weight:700;color:var(--danger);">${wrong}</div>
                  <div style="font-size:0.72rem;color:var(--text-muted);">Wrong</div>
                </div>
                <div style="text-align:center;padding:0.75rem;background:rgba(108,60,225,0.1);border-radius:10px;display:flex;flex-direction:column;justify-content:center;">
                  <div style="font-size:1.6rem;font-weight:700;color:var(--primary);">${assessment.questions.length}</div>
                  <div style="font-size:0.72rem;color:var(--text-muted);">Total</div>
                </div>
                <div style="text-align:center;padding:0.75rem;background:rgba(6,182,212,0.1);border-radius:10px;display:flex;flex-direction:column;justify-content:center;">
                  <div style="font-size:1rem;font-weight:700;color:var(--secondary);">${mins}m ${secs}s</div>
                  <div style="font-size:0.72rem;color:var(--text-muted);">Time</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recommendations -->
          ${!passed ? `
            <div style="background:rgba(249,115,22,0.07);border:1px solid rgba(249,115,22,0.3);border-radius:var(--radius-lg);padding:1.25rem;margin-bottom:1.5rem;">
              <h4 style="font-size:0.95rem;font-weight:700;color:#F97316;margin:0 0 0.75rem;"><i class="fas fa-lightbulb"></i> Improvement Recommendations</h4>
              <ul style="margin:0;padding-left:1.25rem;color:var(--text-secondary);font-size:0.875rem;line-height:1.9;">${recs.join('')}</ul>
            </div>` : ''}

          <!-- Question Review -->
          <div style="background:var(--bg-body);border-radius:var(--radius-lg);padding:1.25rem;margin-bottom:1.5rem;">
            <h4 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin:0 0 1rem;"><i class="fas fa-list-check" style="color:var(--primary);"></i> Question Review (${correct}/${assessment.questions.length} correct)</h4>
            <div style="display:flex;flex-direction:column;gap:0.65rem;max-height:340px;overflow-y:auto;">
              ${(result.gradedAnswers||[]).map((ga,i) => {
                const q = assessment.questions[i];
                if (!q) return '';
                return `
                  <div style="padding:0.875rem;border-radius:var(--radius-md);border:1px solid ${ga.isCorrect?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'};background:${ga.isCorrect?'rgba(16,185,129,0.04)':'rgba(239,68,68,0.04)'};">
                    <div style="display:flex;align-items:start;gap:0.75rem;">
                      <div style="width:22px;height:22px;border-radius:50%;background:${ga.isCorrect?'var(--success)':'var(--danger)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
                        <i class="fas ${ga.isCorrect?'fa-check':'fa-times'}" style="color:#fff;font-size:0.65rem;"></i>
                      </div>
                      <div style="flex:1;min-width:0;">
                        <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);margin-bottom:0.35rem;">Q${i+1}. ${q.question}</div>
                        <div style="font-size:0.8rem;color:var(--text-secondary);">Your answer: <strong style="color:${ga.isCorrect?'var(--success)':'var(--danger)'};">${ga.answer||'Not answered'}</strong></div>
                        ${!ga.isCorrect?`<div style="font-size:0.8rem;color:var(--success);margin-top:0.2rem;">Correct: <strong>${ga.correctAnswer||'N/A'}</strong></div>`:''}
                        ${q.explanation?`<div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.3rem;font-style:italic;"><i class="fas fa-lightbulb" style="color:#c9a227;"></i> ${q.explanation}</div>`:''}
                      </div>
                    </div>
                  </div>`;
              }).join('')}
            </div>
          </div>

          <!-- Actions -->
          <div style="display:flex;gap:1rem;justify-content:center;">
            <button class="btn btn-outline" onclick="closeQuizModal()"><i class="fas fa-times"></i> Close</button>
            <button class="btn btn-primary" onclick="closeQuizModal();startAssessment('${assessment._id}')"><i class="fas fa-redo"></i> Retake Assessment</button>
          </div>
        </div>
      </div>
    </div>`;

  // Refresh assessment list in background
  fetch(`${API_URL}/assessments`, {headers:{'Authorization':`Bearer ${getAuthToken()}`}})
    .then(r=>r.json()).then(d=>{window.userAssessments=d.data||[];renderUserAssessments(window.userAssessments);}).catch(()=>{});
}

function closeQuizModal() { document.getElementById('quizModal')?.remove(); }

async function viewAssessmentResults(assessmentId) {
  try {
    const res = await fetch(`${API_URL}/assessments/${assessmentId}/results`, {headers:{'Authorization':`Bearer ${getAuthToken()}`}});
    const data = await res.json();
    const attempts = data.data||[];
    if (attempts.length===0) { showToast('No results found','info'); return; }
    const assessment = (window.userAssessments||[]).find(a=>a._id===assessmentId);

    const html = `
      <div class="modal-overlay" id="resultsModal" onclick="if(event.target===this)this.remove()">
        <div class="modal-content" style="max-width:540px;max-height:85vh;overflow-y:auto;">
          <div class="modal-header">
            <h3 class="modal-title"><i class="fas fa-chart-bar" style="color:var(--primary);margin-right:0.5rem;"></i>My Results — ${assessment?.title||'Assessment'}</h3>
            <button class="btn-icon" onclick="document.getElementById('resultsModal').remove()"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            ${attempts.map((att,i)=>`
              <div style="background:var(--bg-body);border-radius:var(--radius-md);padding:1.25rem;margin-bottom:1rem;border-left:4px solid ${att.passed?'var(--success)':'var(--danger)'};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                  <span style="font-weight:700;color:var(--text-primary);">Attempt #${attempts.length-i}</span>
                  <span class="badge ${att.passed?'badge-success':'badge-danger'}">${att.passed?'Passed':'Failed'}</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:1.25rem;font-size:0.875rem;color:var(--text-secondary);">
                  <span><i class="fas fa-percent" style="color:var(--primary);"></i> ${att.percentage}%</span>
                  <span><i class="fas fa-check" style="color:var(--success);"></i> ${(att.answers||[]).filter(a=>a.isCorrect).length} correct</span>
                  <span><i class="fas fa-times" style="color:var(--danger);"></i> ${(att.answers||[]).filter(a=>!a.isCorrect).length} wrong</span>
                  <span><i class="fas fa-clock" style="color:var(--secondary);"></i> ${Math.floor((att.timeTaken||0)/60)}m ${(att.timeTaken||0)%60}s</span>
                </div>
              </div>`).join('')}
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="document.getElementById('resultsModal').remove()">Close</button>
            <button class="btn btn-primary" onclick="document.getElementById('resultsModal').remove();startAssessment('${assessmentId}')"><i class="fas fa-redo"></i> Retake</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  } catch (err) {
    console.error('viewAssessmentResults error:', err);
    showToast('Error loading results','error');
  }
}

// ===== EXPORTS =====
window.renderUserAssessments = renderUserAssessments;
window.startAssessment = startAssessment;
window.selectAnswer = selectAnswer;
window.quizNavigate = quizNavigate;
window.quizGoTo = quizGoTo;
window.confirmSubmitQuiz = confirmSubmitQuiz;
window.confirmQuitQuiz = confirmQuitQuiz;
window.submitQuiz = submitQuiz;
window.closeQuizModal = closeQuizModal;
window.viewAssessmentResults = viewAssessmentResults;
