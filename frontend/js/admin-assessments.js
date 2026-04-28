// ===== ADMIN ASSESSMENTS MANAGEMENT =====

function renderAssessmentsTable(assessments) {
  const tbody = document.getElementById('assessmentsTableBody');
  if (!tbody) return;
  if (!assessments || assessments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No assessments found. Create your first assessment!</td></tr>';
    return;
  }
  tbody.innerHTML = assessments.map(a => `
    <tr>
      <td>
        <div class="table-user">
          <div style="width:44px;height:44px;background:linear-gradient(135deg,#8B5CF6,#6C3CE1);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;flex-shrink:0;">
            <i class="fas fa-brain"></i>
          </div>
          <div>
            <div class="table-user-name">${a.title || 'Untitled'}</div>
            <div class="table-user-id">${a.category || 'General'}</div>
          </div>
        </div>
      </td>
      <td><span class="badge ${a.difficulty === 'Easy' ? 'badge-success' : a.difficulty === 'Hard' ? 'badge-danger' : 'badge-info'}">${a.difficulty || 'Medium'}</span></td>
      <td>${a.duration || 30} min</td>
      <td>
        <span style="font-weight:700;color:${(a.questions?.length||0) >= 1 ? 'var(--success)' : 'var(--warning)'};">${a.questions?.length || 0} Qs</span>
        <button class="btn-icon btn-sm" onclick="openQuestionsModal('${a._id}')" title="Manage Questions" style="margin-left:0.5rem;">
          <i class="fas fa-list-ul"></i>
        </button>
      </td>
      <td>${a.attempts?.length || 0}</td>
      <td><span class="badge ${a.isPublished ? 'badge-success' : 'badge-warning'}">${a.isPublished ? 'Published' : 'Draft'}</span></td>
      <td>
        <div class="table-actions">
          <button class="btn-icon btn-sm" onclick="openQuestionsModal('${a._id}')" title="Manage Questions"><i class="fas fa-question-circle"></i></button>
          <button class="btn-icon btn-sm" onclick="editAssessment('${a._id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn-icon btn-sm" onclick="deleteAssessment('${a._id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAssessmentModal(assessmentId) {
  const isEdit = !!assessmentId;
  const a = isEdit ? (window.allAssessments || []).find(x => x._id === assessmentId) : null;
  const cats = ['JavaScript','Python','React','Node.js','Data Science','Machine Learning','Web Development','General'];

  const modalHTML = `
    <div class="modal-overlay" id="assessmentModal" onclick="if(event.target===this)closeAssessmentModal()">
      <div class="modal-content" style="max-width:680px;max-height:92vh;overflow-y:auto;">
        <div class="modal-header">
          <h3 class="modal-title"><i class="fas fa-brain" style="color:var(--primary);margin-right:0.5rem;"></i>${isEdit ? 'Edit Assessment' : 'Create New Assessment'}</h3>
          <button class="btn-icon" onclick="closeAssessmentModal()"><i class="fas fa-times"></i></button>
        </div>
        <form id="assessmentForm" onsubmit="handleAssessmentSubmit(event,'${assessmentId||''}')">
          <div class="modal-body">

            <!-- Basic Info -->
            <div class="form-group">
              <label class="form-label">Assessment Title *</label>
              <input type="text" class="form-control" name="title" value="${a?.title||''}" placeholder="e.g., JavaScript Fundamentals Quiz" required>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-control" name="description" rows="2" placeholder="Describe what this assessment covers...">${a?.description||''}</textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">Category *</label>
                <select class="form-control" name="category" required>
                  <option value="">Select Category</option>
                  ${cats.map(c=>`<option value="${c}"${a?.category===c?' selected':''}>${c}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Difficulty *</label>
                <select class="form-control" name="difficulty">
                  <option value="Easy"${a?.difficulty==='Easy'?' selected':''}>Easy</option>
                  <option value="Medium"${(!a||a?.difficulty==='Medium')?' selected':''}>Medium</option>
                  <option value="Hard"${a?.difficulty==='Hard'?' selected':''}>Hard</option>
                </select>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
              <div class="form-group">
                <label class="form-label">Duration (minutes) *</label>
                <input type="number" class="form-control" name="duration" value="${a?.duration||30}" min="5" max="180" required>
              </div>
              <div class="form-group">
                <label class="form-label">Passing Score</label>
                <input type="number" class="form-control" value="80" readonly style="background:rgba(108,60,225,0.08);font-weight:700;color:var(--primary);">
                <small style="color:var(--text-muted);font-size:0.75rem;">Fixed at 80%</small>
              </div>
            </div>

            <!-- PDF Upload Section — right inside the creation form -->
            <div style="background:linear-gradient(135deg,rgba(108,60,225,0.07),rgba(139,92,246,0.07));border:2px dashed #8B5CF6;border-radius:var(--radius-lg);padding:1.25rem;margin-top:0.5rem;">
              <h4 style="font-size:0.95rem;font-weight:700;color:var(--primary);margin:0 0 0.5rem;">
                <i class="fas fa-file-pdf" style="color:#EF4444;"></i> Upload Questions from PDF
                <span style="font-weight:400;color:var(--text-muted);font-size:0.8rem;margin-left:0.5rem;">(optional — you can also add manually after)</span>
              </h4>

              <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.25);border-radius:var(--radius-md);padding:0.65rem 0.875rem;margin-bottom:0.875rem;font-size:0.77rem;color:#D97706;line-height:1.65;">
                <strong>PDF format required:</strong>
                &nbsp; Q1. Question text? &nbsp; A) Option1 &nbsp; B) Option2 &nbsp; C) Option3 &nbsp; D) Option4 &nbsp; Answer: A
              </div>

              <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;">
                <input type="file" id="assessmentPdfInput" accept=".pdf" class="form-control" style="flex:1;min-width:180px;">
                <span style="font-size:0.8rem;color:var(--text-muted);flex-shrink:0;">Max 15 MB</span>
              </div>
              <div id="assessmentPdfStatus" style="margin-top:0.4rem;font-size:0.8rem;"></div>
            </div>

          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" onclick="closeAssessmentModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="assessmentSubmitBtn">
              <i class="fas fa-save"></i> ${isEdit?'Update':'Create'} Assessment
            </button>
          </div>
        </form>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeAssessmentModal() { document.getElementById('assessmentModal')?.remove(); }

async function handleAssessmentSubmit(event, assessmentId) {
  event.preventDefault();
  const fd = new FormData(event.target);
  const data = {
    title: fd.get('title'),
    description: fd.get('description') || fd.get('title'),
    category: fd.get('category'),
    difficulty: fd.get('difficulty'),
    duration: parseInt(fd.get('duration')),
    passingScore: 80
  };

  const btn = document.getElementById('assessmentSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    const token = getAuthToken();
    const url = assessmentId ? `${API_URL}/assessments/${assessmentId}` : `${API_URL}/assessments`;
    const method = assessmentId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (!res.ok) {
      showToast(result.message || 'Failed to save assessment', 'error');
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-save"></i> ${assessmentId?'Update':'Create'} Assessment`;
      return;
    }

    const newId = result.data?._id || assessmentId;

    // If a PDF was selected, upload it now
    const pdfInput = document.getElementById('assessmentPdfInput');
    const pdfFile  = pdfInput?.files?.[0];
    const statusEl = document.getElementById('assessmentPdfStatus');

    if (pdfFile && newId) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading PDF...';
      if (statusEl) statusEl.innerHTML = '<span style="color:var(--primary);"><i class="fas fa-spinner fa-spin"></i> Parsing PDF questions...</span>';

      const formData = new FormData();
      formData.append('pdfFile', pdfFile);

      const pdfRes = await fetch(`${API_URL}/assessments/${newId}/upload-questions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const pdfResult = await pdfRes.json();

      if (pdfRes.ok) {
        showToast(`Assessment created! ${pdfResult.message}`, 'success');
      } else {
        showToast(`Assessment created, but PDF failed: ${pdfResult.message}`, 'warning');
      }
    } else {
      showToast(`Assessment ${assessmentId?'updated':'created'} successfully!`, 'success');
    }

    closeAssessmentModal();
    await loadDashboardData();

    // Open Question Manager so admin can verify / add more questions
    if (newId) setTimeout(() => openQuestionsModal(newId), 400);

  } catch (err) {
    console.error('Assessment save error:', err);
    showToast('Error saving assessment', 'error');
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-save"></i> ${assessmentId?'Update':'Create'} Assessment`;
  }
}

function editAssessment(id) { openAssessmentModal(id); }

async function deleteAssessment(id) {
  if (!confirm('Delete this assessment? All attempts will be lost.')) return;
  try {
    const res = await fetch(`${API_URL}/assessments/${id}`, { method:'DELETE', headers:{'Authorization':`Bearer ${getAuthToken()}`} });
    if (res.ok) { showToast('Assessment deleted', 'success'); loadDashboardData(); }
    else showToast('Failed to delete', 'error');
  } catch { showToast('Error deleting assessment', 'error'); }
}

// ===== QUESTIONS MODAL =====
async function openQuestionsModal(assessmentId) {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/assessments/${assessmentId}`, { headers: {'Authorization':`Bearer ${token}`} });
    const data = await res.json();
    const assessment = data.data;

    const modalHTML = `
      <div class="modal-overlay" id="questionsModal" onclick="if(event.target===this)closeQuestionsModal()">
        <div class="modal-content" style="max-width:860px;max-height:92vh;overflow-y:auto;padding:0;">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,#6C3CE1,#8B5CF6);padding:1.5rem 2rem;border-radius:var(--radius-lg) var(--radius-lg) 0 0;color:#fff;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h3 style="margin:0;font-size:1.2rem;font-weight:700;"><i class="fas fa-question-circle"></i> Question Manager</h3>
              <p style="margin:0.25rem 0 0;opacity:0.85;font-size:0.85rem;">${assessment.title} &bull; ${assessment.category} &bull; ${assessment.difficulty}</p>
            </div>
            <button class="btn-icon" onclick="closeQuestionsModal()" style="color:#fff;background:rgba(255,255,255,0.2);border-radius:8px;width:36px;height:36px;"><i class="fas fa-times"></i></button>
          </div>

          <div style="padding:1.5rem 2rem;">

            <!-- PDF Upload -->
            <div style="background:linear-gradient(135deg,rgba(108,60,225,0.07),rgba(139,92,246,0.07));border:2px dashed #8B5CF6;border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1.5rem;">
              <h4 style="font-size:1rem;font-weight:700;color:var(--primary);margin:0 0 0.5rem;"><i class="fas fa-file-pdf" style="color:#EF4444;"></i> Upload Questions from PDF</h4>
              <p style="font-size:0.82rem;color:var(--text-secondary);margin:0 0 0.75rem;">Upload a PDF and the system will automatically extract MCQ questions. Existing questions will be replaced.</p>

              <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.3);border-radius:var(--radius-md);padding:0.75rem 1rem;margin-bottom:1rem;font-size:0.78rem;color:#D97706;line-height:1.7;">
                <strong>Required PDF format:</strong><br>
                Q1. What is JavaScript?<br>
                A) A programming language&nbsp;&nbsp;B) A coffee brand&nbsp;&nbsp;C) A database&nbsp;&nbsp;D) An OS<br>
                Answer: A<br><br>
                Q2. Which method adds to an array?<br>
                A) pop()&nbsp;&nbsp;B) push()&nbsp;&nbsp;C) shift()&nbsp;&nbsp;D) splice()<br>
                Answer: B
              </div>

              <form id="pdfUploadForm" onsubmit="handlePDFUpload(event,'${assessmentId}')">
                <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;">
                  <input type="file" id="pdfFileInput" name="pdfFile" accept=".pdf" class="form-control" style="flex:1;min-width:200px;" required>
                  <button type="submit" class="btn btn-primary" style="white-space:nowrap;flex-shrink:0;">
                    <i class="fas fa-upload"></i> Upload &amp; Parse PDF
                  </button>
                </div>
                <div id="pdfUploadStatus" style="margin-top:0.5rem;font-size:0.82rem;"></div>
              </form>
            </div>

            <!-- Manual Add -->
            <div style="background:var(--bg-body);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:1.5rem;">
              <h4 style="font-size:1rem;font-weight:700;color:var(--text-primary);margin:0 0 1rem;"><i class="fas fa-plus-circle" style="color:var(--success);"></i> Add Question Manually</h4>
              <form id="addQuestionForm" onsubmit="handleAddQuestion(event,'${assessmentId}')">
                <div class="form-group">
                  <label class="form-label">Question *</label>
                  <textarea class="form-control" name="question" rows="2" placeholder="Enter your question here..." required></textarea>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                  <div class="form-group">
                    <label class="form-label">Type</label>
                    <select class="form-control" name="type" onchange="toggleQuestionOptions(this)">
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True / False</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Points</label>
                    <input type="number" class="form-control" name="points" value="1" min="1" max="10">
                  </div>
                </div>
                <div id="optionsSection">
                  <div class="form-group">
                    <label class="form-label">Options (one per line) *</label>
                    <textarea class="form-control" name="options" rows="4" placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"></textarea>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Correct Answer * <small style="color:var(--text-muted)">(must exactly match one option)</small></label>
                  <input type="text" class="form-control" name="correctAnswer" placeholder="Paste the exact correct option text" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Explanation <small style="color:var(--text-muted)">(optional)</small></label>
                  <input type="text" class="form-control" name="explanation" placeholder="Why is this the correct answer?">
                </div>
                <button type="submit" class="btn btn-success btn-sm"><i class="fas fa-plus"></i> Add Question</button>
              </form>
            </div>

            <!-- Questions List -->
            <div id="questionsList">${renderQuestionsList(assessment.questions, assessmentId)}</div>
          </div>

          <!-- Footer -->
          <div style="padding:1rem 2rem;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--bg-card);border-radius:0 0 var(--radius-lg) var(--radius-lg);">
            <div id="questionsFooterInfo" style="font-size:0.875rem;color:var(--text-secondary);">
              ${buildFooterInfo(assessment.questions)}
            </div>
            <button class="btn btn-primary" onclick="closeQuestionsModal()"><i class="fas fa-check"></i> Done</button>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  } catch (err) {
    console.error('openQuestionsModal error:', err);
    showToast('Error loading questions', 'error');
  }
}

function buildFooterInfo(questions) {
  const count = questions?.length || 0;
  const pts = (questions||[]).reduce((s,q)=>s+q.points,0);
  const statusHtml = count === 0
    ? `<span style="color:var(--danger);"><i class="fas fa-exclamation-circle"></i> No questions yet</span>`
    : `<span style="color:var(--success);"><i class="fas fa-check-circle"></i> ${count} question${count!==1?'s':''} ready</span>`;
  return `<i class="fas fa-info-circle" style="color:var(--primary);"></i> <strong>${count}</strong> question${count!==1?'s':''} &bull; <strong>${pts}</strong> total pts &nbsp;${statusHtml}`;
}

function renderQuestionsList(questions, assessmentId) {
  if (!questions || questions.length === 0) {
    return `<div style="text-align:center;padding:2rem;color:var(--text-muted);border:1px dashed var(--border);border-radius:var(--radius-md);">
      <i class="fas fa-inbox" style="font-size:2rem;margin-bottom:0.5rem;display:block;"></i>
      <p style="margin:0;">No questions yet. Upload a PDF or add manually above.</p>
    </div>`;
  }
  return `
    <h4 style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:1rem;">
      <i class="fas fa-list-ul" style="color:var(--primary);"></i> Questions (${questions.length})
    </h4>
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      ${questions.map((q,i) => `
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);padding:1rem 1.25rem;">
          <div style="display:flex;justify-content:space-between;align-items:start;gap:0.75rem;">
            <div style="display:flex;align-items:start;gap:0.75rem;flex:1;min-width:0;">
              <span style="background:var(--primary);color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;flex-shrink:0;margin-top:2px;">${i+1}</span>
              <span style="font-weight:600;color:var(--text-primary);font-size:0.9rem;line-height:1.4;">${q.question}</span>
            </div>
            <button onclick="deleteQuestion('${assessmentId}','${q._id}')" style="background:none;border:none;cursor:pointer;color:var(--danger);padding:4px;flex-shrink:0;" title="Delete"><i class="fas fa-trash-alt"></i></button>
          </div>
          ${q.options && q.options.length > 0 ? `
            <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.75rem;padding-left:2rem;">
              ${q.options.map(opt=>`
                <span style="padding:0.2rem 0.65rem;border-radius:20px;font-size:0.78rem;
                  background:${opt===q.correctAnswer?'rgba(16,185,129,0.15)':'var(--bg-body)'};
                  border:1px solid ${opt===q.correctAnswer?'var(--success)':'var(--border)'};
                  color:${opt===q.correctAnswer?'var(--success)':'var(--text-secondary)'};
                  font-weight:${opt===q.correctAnswer?'700':'400'};">
                  ${opt===q.correctAnswer?'✓ ':''}${opt}
                </span>`).join('')}
            </div>` : ''}
          ${q.explanation ? `<div style="font-size:0.78rem;color:var(--text-muted);font-style:italic;margin-top:0.5rem;padding-left:2rem;"><i class="fas fa-lightbulb" style="color:#c9a227;"></i> ${q.explanation}</div>` : ''}
        </div>`).join('')}
    </div>`;
}

function toggleQuestionOptions(select) {
  const sec = document.getElementById('optionsSection');
  const ca = document.querySelector('#addQuestionForm [name=correctAnswer]');
  if (select.value === 'true-false') {
    sec.innerHTML = '';
    if (ca) ca.placeholder = 'Enter: True or False';
  } else {
    sec.innerHTML = `<div class="form-group"><label class="form-label">Options (one per line) *</label><textarea class="form-control" name="options" rows="4" placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"></textarea></div>`;
    if (ca) ca.placeholder = 'Paste the exact correct option text';
  }
}

function closeQuestionsModal() { document.getElementById('questionsModal')?.remove(); }

function refreshQuestionsUI(questions, assessmentId) {
  const list = document.getElementById('questionsList');
  if (list) list.innerHTML = renderQuestionsList(questions, assessmentId);
  const footer = document.getElementById('questionsFooterInfo');
  if (footer) footer.innerHTML = buildFooterInfo(questions);
  loadDashboardData();
}

// ===== PDF UPLOAD =====
async function handlePDFUpload(event, assessmentId) {
  event.preventDefault();
  const fileInput = document.getElementById('pdfFileInput');
  const statusEl = document.getElementById('pdfUploadStatus');
  const file = fileInput?.files[0];

  if (!file) { showToast('Please select a PDF file', 'error'); return; }
  if (file.type !== 'application/pdf') { showToast('Only PDF files are allowed', 'error'); return; }

  const btn = event.target.querySelector('[type=submit]');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading & Parsing...';
  if (statusEl) statusEl.innerHTML = '<span style="color:var(--primary);"><i class="fas fa-spinner fa-spin"></i> Processing PDF, please wait...</span>';

  try {
    const formData = new FormData();
    formData.append('pdfFile', file);

    const res = await fetch(`${API_URL}/assessments/${assessmentId}/upload-questions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAuthToken()}` },
      body: formData
    });

    const result = await res.json();

    if (res.ok) {
      showToast(result.message || 'Questions imported!', 'success');
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--success);"><i class="fas fa-check-circle"></i> ${result.message}</span>`;
      if (fileInput) fileInput.value = '';
      refreshQuestionsUI(result.data.questions, assessmentId);
    } else {
      showToast(result.message || 'Failed to import questions', 'error');
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);"><i class="fas fa-times-circle"></i> ${result.message}</span>`;
    }
  } catch (err) {
    console.error('PDF upload error:', err);
    showToast('Network error uploading PDF', 'error');
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);"><i class="fas fa-times-circle"></i> Network error: ${err.message}</span>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

// ===== MANUAL ADD QUESTION =====
async function handleAddQuestion(event, assessmentId) {
  event.preventDefault();
  const fd = new FormData(event.target);
  const type = fd.get('type');

  let options = [];
  if (type === 'multiple-choice') {
    const raw = fd.get('options') || '';
    options = raw.split('\n').map(o=>o.trim()).filter(Boolean);
    if (options.length < 2) { showToast('Please provide at least 2 options', 'error'); return; }
  } else {
    options = ['True','False'];
  }

  const correctAnswer = (fd.get('correctAnswer')||'').trim();
  if (type !== 'true-false' && !options.includes(correctAnswer)) {
    showToast('Correct answer must exactly match one of the options', 'error');
    return;
  }

  const data = { question: fd.get('question'), type, options, correctAnswer, points: parseInt(fd.get('points'))||1, explanation: fd.get('explanation')||'' };
  const btn = event.target.querySelector('[type=submit]');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

  try {
    const res = await fetch(`${API_URL}/assessments/${assessmentId}/questions`, {
      method: 'POST',
      headers: {'Authorization':`Bearer ${getAuthToken()}`,'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (res.ok) {
      showToast('Question added!', 'success');
      event.target.reset();
      refreshQuestionsUI(result.data.questions, assessmentId);
    } else {
      showToast(result.message || 'Failed to add question', 'error');
    }
  } catch (err) {
    showToast('Error adding question', 'error');
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i> Add Question';
  }
}

async function deleteQuestion(assessmentId, questionId) {
  if (!confirm('Delete this question?')) return;
  try {
    const res = await fetch(`${API_URL}/assessments/${assessmentId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: {'Authorization':`Bearer ${getAuthToken()}`}
    });
    const result = await res.json();
    if (res.ok) {
      showToast('Question deleted', 'success');
      refreshQuestionsUI(result.data.questions, assessmentId);
    } else {
      showToast('Failed to delete question', 'error');
    }
  } catch { showToast('Error deleting question', 'error'); }
}

// ===== EXPORTS =====
window.renderAssessmentsTable = renderAssessmentsTable;
window.openAssessmentModal = openAssessmentModal;
window.closeAssessmentModal = closeAssessmentModal;
window.handleAssessmentSubmit = handleAssessmentSubmit;
window.editAssessment = editAssessment;
window.deleteAssessment = deleteAssessment;
window.openQuestionsModal = openQuestionsModal;
window.closeQuestionsModal = closeQuestionsModal;
window.handleAddQuestion = handleAddQuestion;
window.deleteQuestion = deleteQuestion;
window.toggleQuestionOptions = toggleQuestionOptions;
window.handlePDFUpload = handlePDFUpload;
