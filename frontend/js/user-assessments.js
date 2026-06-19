// ===== NEXTSTEP AI – USER ASSESSMENTS =====

// Global state for quiz
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let quizStartTime = null;

// ===== RENDER ASSESSMENTS =====
function renderUserAssessments(assessments) {
  const container = document.getElementById('assessmentsContainer');
  if (!container) return;

  if (!assessments || assessments.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:4rem 2rem;background:var(--bg-card);border-radius:var(--radius-lg);border:1px solid var(--border);">
        <i class="fas fa-brain" style="font-size:3rem;color:var(--primary);margin-bottom:1rem;display:block;"></i>
        <h3 style="color:var(--text-primary);margin-bottom:0.5rem;">No Assessments Available</h3>
        <p style="color:var(--text-muted);">Assessments will appear here once the admin publishes them.</p>
      </div>`;
    return;
  }

  // Get user ID for checking attempts
  const userData = getUserData();
  const userId = userData?._id || userData?.id;

  container.innerHTML = assessments.map(assessment => {
    const userAttempts = (assessment.attempts || []).filter(a => String(a.user) === String(userId));
    const lastAttempt = userAttempts.length > 0 ? userAttempts[userAttempts.length - 1] : null;
    const bestScore = userAttempts.length > 0 
      ? Math.max(...userAttempts.map(a => a.percentage || 0))
      : null;
    const hasPassed = userAttempts.some(a => a.passed);

    return `
      <div class="section-card" style="margin-bottom:1.5rem;">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:1.5rem;flex-wrap:wrap;">
          <div style="flex:1;min-width:300px;">
            <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
              <div style="width:48px;height:48px;background:linear-gradient(135deg,#6C3CE1,#8B5CF6);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class="fas fa-brain" style="color:white;font-size:1.3rem;"></i>
              </div>
              <div>
                <h3 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0;">${assessment.title}</h3>
                <p style="font-size:0.875rem;color:var(--text-muted);margin:0.25rem 0 0;">${assessment.description || 'Test your knowledge'}</p>
              </div>
            </div>

            <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-top:1rem;font-size:0.875rem;color:var(--text-secondary);">
              <span><i class="fas fa-clock" style="color:var(--primary);"></i> ${assessment.duration || 30} minutes</span>
              <span><i class="fas fa-question-circle" style="color:var(--secondary);"></i> ${assessment.questions?.length || 0} questions</span>
              <span><i class="fas fa-signal" style="color:var(--success);"></i> ${assessment.difficulty || 'Medium'}</span>
              <span><i class="fas fa-check-circle" style="color:var(--success);"></i> Pass: ${assessment.passingScore || 80}%</span>
            </div>

            ${userAttempts.length > 0 ? `
              <div style="margin-top:1rem;padding:1rem;background:var(--bg-body);border-radius:var(--radius-md);border:1px solid var(--border);">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
                  <div>
                    <div style="font-size:0.75rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;margin-bottom:0.25rem;">Your Progress</div>
                    <div style="display:flex;align-items:center;gap:1rem;">
                      <span style="font-size:1.5rem;font-weight:800;color:${hasPassed ? 'var(--success)' : 'var(--primary)'};">${bestScore}%</span>
                      <span class="badge ${hasPassed ? 'badge-success' : 'badge-warning'}" style="font-size:0.75rem;">
                        <i class="fas ${hasPassed ? 'fa-check-circle' : 'fa-clock'}"></i> ${hasPassed ? 'Passed' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.25rem;">Attempts: ${userAttempts.length}</div>
                    ${lastAttempt ? `<div style="font-size:0.75rem;color:var(--text-muted);">Last: ${new Date(lastAttempt.completedAt).toLocaleDateString()}</div>` : ''}
                  </div>
                </div>
              </div>
            ` : ''}
          </div>

          <div style="display:flex;flex-direction:column;gap:0.75rem;align-items:stretch;min-width:180px;">
            <button class="btn btn-primary" onclick="startAssessment('${assessment._id}')" style="width:100%;">
              <i class="fas fa-play"></i> ${userAttempts.length > 0 ? 'Retake Assessment' : 'Start Assessment'}
            </button>
            ${userAttempts.length > 0 ? `
              <button class="btn btn-outline" onclick="viewAssessmentHistory('${assessment._id}')" style="width:100%;">
                <i class="fas fa-history"></i> View History
              </button>
            ` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ===== START ASSESSMENT =====
async function startAssessment(assessmentId) {
  try {
    const res = await authFetch(`${API_URL}/assessments/${assessmentId}`);

    if (!res.ok) {
      throw new Error('Failed to load assessment');
    }

    const data = await res.json();
    const assessment = data.data;

    if (!assessment || !assessment.questions || assessment.questions.length === 0) {
      showToast('This assessment has no questions yet', 'warning');
      return;
    }

    // Initialize quiz state
    currentQuiz = assessment;
    currentQuestionIndex = 0;
    userAnswers = {};
    quizStartTime = new Date();

    // Show quiz modal
    showQuizModal();
  } catch (error) {
    console.error('Error starting assessment:', error);
    showToast('Failed to start assessment. Please try again.', 'error');
  }
}

// ===== SHOW QUIZ MODAL =====
function showQuizModal() {
  if (!currentQuiz) return;

  const modalHTML = `
    <div class="modal-overlay" id="quizModal" style="z-index:9999;">
      <div class="modal-content" style="max-width:900px;max-height:90vh;display:flex;flex-direction:column;">
        <div class="modal-header" style="flex-shrink:0;">
          <div>
            <h3 class="modal-title">
              <i class="fas fa-brain" style="color:var(--primary);"></i> ${currentQuiz.title}
            </h3>
            <p style="font-size:0.875rem;color:var(--text-muted);margin:0.5rem 0 0;">
              ${currentQuiz.questions.length} questions • ${currentQuiz.duration || 30} minutes • Pass: ${currentQuiz.passingScore || 80}%
            </p>
          </div>
          <button class="btn-icon" onclick="confirmCloseQuiz()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div style="flex:1;overflow-y:auto;padding:2rem;">
          <div id="quizQuestionContainer"></div>
        </div>

        <div class="modal-footer" style="flex-shrink:0;display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;">
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-outline" onclick="quizNavigate(-1)" id="quizPrevBtn">
              <i class="fas fa-chevron-left"></i> Previous
            </button>
            <button class="btn btn-outline" onclick="quizNavigate(1)" id="quizNextBtn">
              Next <i class="fas fa-chevron-right"></i>
            </button>
          </div>

          <div style="display:flex;align-items:center;gap:1rem;">
            <div style="font-size:0.875rem;color:var(--text-muted);">
              Question <span id="quizCurrentNum">1</span> of ${currentQuiz.questions.length}
            </div>
            <button class="btn btn-primary" onclick="confirmSubmitQuiz()" id="quizSubmitBtn">
              <i class="fas fa-check-circle"></i> Submit Assessment
            </button>
          </div>
        </div>

        <!-- Question Navigation -->
        <div style="padding:1rem 2rem;background:var(--bg-body);border-top:1px solid var(--border);flex-shrink:0;">
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem;font-weight:600;">QUICK NAVIGATION</div>
          <div id="quizNavigation" style="display:flex;flex-wrap:wrap;gap:0.5rem;"></div>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  renderQuizQuestion();
  updateQuizNavigation();
}

// ===== RENDER CURRENT QUESTION =====
function renderQuizQuestion() {
  const container = document.getElementById('quizQuestionContainer');
  if (!container || !currentQuiz) return;

  const question = currentQuiz.questions[currentQuestionIndex];
  const questionNum = currentQuestionIndex + 1;
  const userAnswer = userAnswers[currentQuestionIndex];

  container.innerHTML = `
    <div style="margin-bottom:2rem;">
      <div style="display:inline-block;padding:0.5rem 1rem;background:var(--primary-soft);color:var(--primary);border-radius:var(--radius-full);font-size:0.875rem;font-weight:700;margin-bottom:1rem;">
        Question ${questionNum} of ${currentQuiz.questions.length}
      </div>
      <h4 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);line-height:1.6;margin-bottom:1.5rem;">
        ${question.question}
      </h4>
    </div>

    <div style="display:flex;flex-direction:column;gap:1rem;">
      ${question.options.map((option, index) => {
        const isSelected = userAnswer === index;
        return `
          <div class="quiz-option ${isSelected ? 'selected' : ''}" onclick="selectAnswer(${index})" style="cursor:pointer;">
            <div style="display:flex;align-items:center;gap:1rem;">
              <div class="quiz-option-radio ${isSelected ? 'selected' : ''}">
                ${isSelected ? '<i class="fas fa-check"></i>' : ''}
              </div>
              <div style="flex:1;">
                <div style="font-weight:600;color:var(--text-primary);">${String.fromCharCode(65 + index)}. ${option}</div>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>

    <style>
      .quiz-option {
        padding: 1.25rem;
        background: var(--bg-card);
        border: 2px solid var(--border);
        border-radius: var(--radius-lg);
        transition: all 0.2s ease;
      }
      .quiz-option:hover {
        border-color: var(--primary);
        background: var(--primary-soft);
      }
      .quiz-option.selected {
        border-color: var(--primary);
        background: var(--primary-soft);
      }
      .quiz-option-radio {
        width: 24px;
        height: 24px;
        border: 2px solid var(--border);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s ease;
      }
      .quiz-option-radio.selected {
        background: var(--primary);
        border-color: var(--primary);
        color: white;
      }
    </style>`;

  // Update navigation buttons
  document.getElementById('quizPrevBtn').disabled = currentQuestionIndex === 0;
  document.getElementById('quizNextBtn').disabled = currentQuestionIndex === currentQuiz.questions.length - 1;
  document.getElementById('quizCurrentNum').textContent = questionNum;
}

// ===== SELECT ANSWER =====
function selectAnswer(optionIndex) {
  userAnswers[currentQuestionIndex] = optionIndex;
  renderQuizQuestion();
  updateQuizNavigation();
}

// ===== NAVIGATE QUESTIONS =====
function quizNavigate(direction) {
  const newIndex = currentQuestionIndex + direction;
  if (newIndex >= 0 && newIndex < currentQuiz.questions.length) {
    currentQuestionIndex = newIndex;
    renderQuizQuestion();
    updateQuizNavigation();
  }
}

// ===== GO TO SPECIFIC QUESTION =====
function quizGoTo(index) {
  if (index >= 0 && index < currentQuiz.questions.length) {
    currentQuestionIndex = index;
    renderQuizQuestion();
    updateQuizNavigation();
  }
}

// ===== UPDATE NAVIGATION =====
function updateQuizNavigation() {
  const container = document.getElementById('quizNavigation');
  if (!container || !currentQuiz) return;

  container.innerHTML = currentQuiz.questions.map((_, index) => {
    const isAnswered = userAnswers.hasOwnProperty(index);
    const isCurrent = index === currentQuestionIndex;
    return `
      <button 
        class="btn btn-sm ${isCurrent ? 'btn-primary' : isAnswered ? 'btn-success' : 'btn-outline'}" 
        onclick="quizGoTo(${index})"
        style="min-width:40px;padding:0.5rem;">
        ${index + 1}
      </button>`;
  }).join('');
}

// ===== CONFIRM CLOSE QUIZ =====
function confirmCloseQuiz() {
  const answeredCount = Object.keys(userAnswers).length;
  const totalQuestions = currentQuiz.questions.length;

  if (answeredCount > 0) {
    if (confirm(`You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to exit without submitting?`)) {
      closeQuizModal();
    }
  } else {
    closeQuizModal();
  }
}

// ===== CONFIRM SUBMIT =====
function confirmSubmitQuiz() {
  const answeredCount = Object.keys(userAnswers).length;
  const totalQuestions = currentQuiz.questions.length;

  if (answeredCount < totalQuestions) {
    if (!confirm(`You have only answered ${answeredCount} of ${totalQuestions} questions. Unanswered questions will be marked as incorrect. Do you want to submit anyway?`)) {
      return;
    }
  }

  submitQuiz();
}

// ===== SUBMIT QUIZ =====
async function submitQuiz() {
  try {
    // Disable submit button
    const submitBtn = document.getElementById('quizSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }

    // Calculate time taken
    const timeTaken = Math.floor((new Date() - quizStartTime) / 1000); // in seconds

    // Prepare answers array in the format expected by backend
    const answers = currentQuiz.questions.map((question, index) => {
      const selectedOptionIndex = userAnswers[index];
      const answer = selectedOptionIndex !== undefined ? question.options[selectedOptionIndex] : '';
      return {
        questionId: question._id,
        answer: answer
      };
    });

    console.log('Submitting assessment:', {
      assessmentId: currentQuiz._id,
      answers,
      timeTaken
    });

    // Submit to API
    const res = await authFetch(`${API_URL}/assessments/${currentQuiz._id}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ answers, timeTaken })
    });

    console.log('Response status:', res.status);

    if (!res.ok) {
      const errorData = await res.json();
      console.error('Submit error:', errorData);
      throw new Error(errorData.message || 'Failed to submit assessment');
    }

    const data = await res.json();
    console.log('Submit response:', data);
    
    // Close quiz modal
    closeQuizModal();

    // Show results
    if (data.success && data.data) {
      showQuizResults(data.data);
    } else {
      throw new Error('Invalid response format');
    }

    // Reload assessments to update UI
    if (typeof loadAndRenderAssessments === 'function') {
      await loadAndRenderAssessments();
    }

  } catch (error) {
    console.error('Error submitting quiz:', error);
    showToast('Failed to submit assessment: ' + error.message, 'error');
    
    // Re-enable submit button
    const submitBtn = document.getElementById('quizSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit Assessment';
    }
  }
}

// ===== SHOW RESULTS =====
function showQuizResults(result) {
  console.log('Showing results:', result);
  
  const passed = result.passed;
  const percentage = result.percentage || 0;
  const score = result.score || 0;
  const totalPoints = result.totalPoints || 0;
  const timeTaken = result.timeTaken || 0;
  const passingScore = result.passingScore || 80;

  // Count correct answers from gradedAnswers
  const correctAnswers = result.gradedAnswers 
    ? result.gradedAnswers.filter(a => a.isCorrect).length 
    : 0;
  const totalQuestions = result.gradedAnswers ? result.gradedAnswers.length : 0;

  const minutes = Math.floor(timeTaken / 60);
  const seconds = timeTaken % 60;

  // Store result for detailed view
  window.lastAssessmentResult = result;
  
  // Store assessment ID for retry
  const assessmentId = currentQuiz?._id || '';

  // Generate recommendations
  const recommendations = generateRecommendations(percentage, result.gradedAnswers);

  const modalHTML = `
    <div class="modal-overlay" id="resultsModal" style="z-index:10000;">
      <div class="modal-content" style="max-width:700px;max-height:90vh;overflow-y:auto;">
        <div class="modal-header" style="border:none;padding-bottom:0;">
          <button class="btn-icon" onclick="closeResultsModal()" style="margin-left:auto;">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div style="padding:2rem;text-align:center;">
          <!-- Success/Fail Icon -->
          <div style="width:120px;height:120px;margin:0 auto 1.5rem;background:${passed ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#EF4444,#DC2626)'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:3rem;color:white;box-shadow:0 8px 16px rgba(0,0,0,0.15);">
            <i class="fas ${passed ? 'fa-check-circle' : 'fa-times-circle'}"></i>
          </div>

          <!-- Title -->
          <h2 style="font-size:2rem;font-weight:800;color:var(--text-primary);margin-bottom:0.5rem;">
            ${passed ? '🎉 Congratulations!' : '📚 Keep Trying!'}
          </h2>
          <p style="font-size:1rem;color:var(--text-muted);margin-bottom:2rem;">
            ${passed ? 'You have passed the assessment!' : 'You did not pass this time, but you can try again.'}
          </p>

          <!-- Score Cards -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:2rem;">
            <div style="padding:1.5rem;background:var(--bg-body);border-radius:var(--radius-lg);border:2px solid ${passed ? 'var(--success)' : 'var(--danger)'};">
              <div style="font-size:2.5rem;font-weight:800;color:${passed ? 'var(--success)' : 'var(--danger)'};">${percentage}%</div>
              <div style="font-size:0.875rem;color:var(--text-muted);margin-top:0.25rem;font-weight:600;">Your Score</div>
            </div>
            <div style="padding:1.5rem;background:var(--bg-body);border-radius:var(--radius-lg);border:2px solid var(--primary);">
              <div style="font-size:2.5rem;font-weight:800;color:var(--primary);">${correctAnswers}/${totalQuestions}</div>
              <div style="font-size:0.875rem;color:var(--text-muted);margin-top:0.25rem;font-weight:600;">Correct</div>
            </div>
            <div style="padding:1.5rem;background:var(--bg-body);border-radius:var(--radius-lg);border:2px solid var(--border);">
              <div style="font-size:2.5rem;font-weight:800;color:var(--text-primary);">${minutes}:${seconds.toString().padStart(2,'0')}</div>
              <div style="font-size:0.875rem;color:var(--text-muted);margin-top:0.25rem;font-weight:600;">Time</div>
            </div>
          </div>

          <!-- Performance Bar -->
          <div style="margin-bottom:2rem;">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
              <span style="font-size:0.875rem;color:var(--text-muted);font-weight:600;">Performance</span>
              <span style="font-size:0.875rem;color:var(--text-muted);font-weight:600;">Pass Mark: ${passingScore}%</span>
            </div>
            <div style="height:12px;background:var(--border);border-radius:var(--radius-full);overflow:hidden;position:relative;">
              <div style="height:100%;width:${percentage}%;background:${passed ? 'linear-gradient(90deg,#10B981,#059669)' : 'linear-gradient(90deg,#EF4444,#DC2626)'};border-radius:var(--radius-full);transition:width 1s ease;"></div>
              <div style="position:absolute;left:${passingScore}%;top:0;bottom:0;width:2px;background:var(--text-primary);"></div>
            </div>
          </div>

          <!-- Recommendations Section -->
          <div style="background:linear-gradient(135deg,rgba(108,60,225,0.1),rgba(139,92,246,0.05));border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:2rem;text-align:left;border:2px solid var(--primary);">
            <h3 style="font-size:1.1rem;font-weight:700;color:var(--primary);margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;">
              <i class="fas fa-lightbulb"></i> Recommendations for You
            </h3>
            <ul style="margin:0;padding-left:1.5rem;color:var(--text-primary);line-height:1.8;font-size:0.95rem;">
              ${recommendations.map(rec => `<li style="margin-bottom:0.75rem;">${rec}</li>`).join('')}
            </ul>
          </div>

          <!-- Action Buttons -->
          <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="showDetailedResults()" style="min-width:180px;">
              <i class="fas fa-list-alt"></i> View Question Review
            </button>
            ${!passed && assessmentId ? `
              <button class="btn btn-secondary" onclick="closeResultsModal(); startAssessment('${assessmentId}')" style="min-width:180px;">
                <i class="fas fa-redo"></i> Try Again
              </button>
            ` : ''}
            <button class="btn btn-outline" onclick="closeResultsModal()" style="min-width:180px;">
              <i class="fas fa-check"></i> Done
            </button>
          </div>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ===== CLOSE MODALS =====
function closeQuizModal() {
  document.getElementById('quizModal')?.remove();
  currentQuiz = null;
  currentQuestionIndex = 0;
  userAnswers = {};
  quizStartTime = null;
}

function closeResultsModal() {
  document.getElementById('resultsModal')?.remove();
}

function closeDetailedResultsModal() {
  document.getElementById('detailedResultsModal')?.remove();
}

// ===== SHOW DETAILED RESULTS =====
function showDetailedResults() {
  const result = window.lastAssessmentResult;
  if (!result || !result.gradedAnswers) {
    showToast('No detailed results available', 'error');
    return;
  }

  const passed = result.passed;
  const percentage = result.percentage || 0;
  const passingScore = result.passingScore || 80;
  const correctCount = result.gradedAnswers.filter(a => a.isCorrect).length;
  const totalCount = result.gradedAnswers.length;
  const incorrectCount = totalCount - correctCount;
  
  // Store assessment ID for retry
  const assessmentId = currentQuiz?._id || '';

  // Generate recommendations based on performance
  const recommendations = generateRecommendations(percentage, result.gradedAnswers);

  const modalHTML = `
    <div class="modal-overlay" id="detailedResultsModal" style="z-index:10001;" onclick="if(event.target===this)closeDetailedResultsModal()">
      <div class="modal-content" style="max-width:900px;max-height:90vh;display:flex;flex-direction:column;">
        <div class="modal-header" style="flex-shrink:0;">
          <h3 class="modal-title">
            <i class="fas fa-chart-bar" style="color:var(--primary);"></i> Detailed Assessment Results
          </h3>
          <button class="btn-icon" onclick="closeDetailedResultsModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div style="flex:1;overflow-y:auto;padding:2rem;">
          
          <!-- Performance Summary -->
          <div style="background:var(--bg-body);border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:2rem;border:2px solid ${passed ? 'var(--success)' : 'var(--danger)'};">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
              <div>
                <h4 style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:0.5rem;">
                  ${currentQuiz?.title || 'Assessment'}
                </h4>
                <div style="display:flex;gap:1.5rem;font-size:0.875rem;color:var(--text-secondary);">
                  <span><i class="fas fa-check-circle" style="color:var(--success);"></i> ${correctCount} Correct</span>
                  <span><i class="fas fa-times-circle" style="color:var(--danger);"></i> ${incorrectCount} Incorrect</span>
                  <span><i class="fas fa-percentage" style="color:var(--primary);"></i> ${percentage}% Score</span>
                </div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:2.5rem;font-weight:800;color:${passed ? 'var(--success)' : 'var(--danger)'};">${percentage}%</div>
                <span class="badge ${passed ? 'badge-success' : 'badge-danger'}" style="font-size:0.875rem;">
                  ${passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          </div>

          <!-- Recommendations -->
          <div style="background:linear-gradient(135deg,rgba(108,60,225,0.1),rgba(139,92,246,0.1));border-radius:var(--radius-lg);padding:1.5rem;margin-bottom:2rem;border:1px solid var(--primary);">
            <h4 style="font-size:1rem;font-weight:700;color:var(--primary);margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;">
              <i class="fas fa-lightbulb"></i> Recommendations for Improvement
            </h4>
            <ul style="margin:0;padding-left:1.5rem;color:var(--text-primary);line-height:1.8;">
              ${recommendations.map(rec => `<li style="margin-bottom:0.5rem;">${rec}</li>`).join('')}
            </ul>
          </div>

          <!-- Question-by-Question Breakdown -->
          <h4 style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:1rem;">
            <i class="fas fa-list-ol"></i> Question-by-Question Review
          </h4>

          <div style="display:flex;flex-direction:column;gap:1.5rem;">
            ${result.gradedAnswers.map((answer, index) => {
              const question = currentQuiz?.questions[index];
              const isCorrect = answer.isCorrect;
              
              return `
                <div style="background:var(--bg-card);border-radius:var(--radius-lg);padding:1.5rem;border:2px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'};">
                  <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem;gap:1rem;">
                    <div style="flex:1;">
                      <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem;">
                        <span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;background:${isCorrect ? 'var(--success)' : 'var(--danger)'};color:white;border-radius:50%;font-weight:700;font-size:0.875rem;">
                          ${index + 1}
                        </span>
                        <span class="badge ${isCorrect ? 'badge-success' : 'badge-danger'}">
                          <i class="fas ${isCorrect ? 'fa-check' : 'fa-times'}"></i> ${isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <h5 style="font-size:1rem;font-weight:600;color:var(--text-primary);line-height:1.6;margin-bottom:1rem;">
                        ${question?.question || 'Question'}
                      </h5>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                      <div style="font-size:1.25rem;font-weight:800;color:${isCorrect ? 'var(--success)' : 'var(--danger)'};">
                        ${answer.points || 0}/${question?.points || 1}
                      </div>
                      <div style="font-size:0.75rem;color:var(--text-muted);">points</div>
                    </div>
                  </div>

                  <div style="display:flex;flex-direction:column;gap:0.75rem;">
                    ${!isCorrect ? `
                      <div style="padding:1rem;background:rgba(239,68,68,0.1);border-radius:var(--radius-md);border-left:4px solid var(--danger);">
                        <div style="font-size:0.75rem;font-weight:700;color:var(--danger);text-transform:uppercase;margin-bottom:0.25rem;">Your Answer</div>
                        <div style="color:var(--text-primary);font-weight:500;">${answer.answer || 'No answer provided'}</div>
                      </div>
                    ` : ''}
                    
                    <div style="padding:1rem;background:rgba(16,185,129,0.1);border-radius:var(--radius-md);border-left:4px solid var(--success);">
                      <div style="font-size:0.75rem;font-weight:700;color:var(--success);text-transform:uppercase;margin-bottom:0.25rem;">
                        ${isCorrect ? 'Your Answer (Correct)' : 'Correct Answer'}
                      </div>
                      <div style="color:var(--text-primary);font-weight:500;">${answer.correctAnswer || 'N/A'}</div>
                    </div>

                    ${answer.explanation ? `
                      <div style="padding:1rem;background:var(--bg-body);border-radius:var(--radius-md);border-left:4px solid var(--primary);">
                        <div style="font-size:0.75rem;font-weight:700;color:var(--primary);text-transform:uppercase;margin-bottom:0.25rem;">
                          <i class="fas fa-info-circle"></i> Explanation
                        </div>
                        <div style="color:var(--text-secondary);font-size:0.875rem;line-height:1.6;">${answer.explanation}</div>
                      </div>
                    ` : ''}
                  </div>
                </div>`;
            }).join('')}
          </div>

          <!-- Performance Insights -->
          <div style="margin-top:2rem;padding:1.5rem;background:var(--bg-body);border-radius:var(--radius-lg);border:1px solid var(--border);">
            <h4 style="font-size:1rem;font-weight:700;color:var(--text-primary);margin-bottom:1rem;">
              <i class="fas fa-chart-pie"></i> Performance Insights
            </h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;">
              <div style="text-align:center;padding:1rem;background:var(--bg-card);border-radius:var(--radius-md);">
                <div style="font-size:2rem;font-weight:800;color:var(--success);">${correctCount}</div>
                <div style="font-size:0.875rem;color:var(--text-muted);">Correct Answers</div>
              </div>
              <div style="text-align:center;padding:1rem;background:var(--bg-card);border-radius:var(--radius-md);">
                <div style="font-size:2rem;font-weight:800;color:var(--danger);">${incorrectCount}</div>
                <div style="font-size:0.875rem;color:var(--text-muted);">Incorrect Answers</div>
              </div>
              <div style="text-align:center;padding:1rem;background:var(--bg-card);border-radius:var(--radius-md);">
                <div style="font-size:2rem;font-weight:800;color:var(--primary);">${Math.round((correctCount/totalCount)*100)}%</div>
                <div style="font-size:0.875rem;color:var(--text-muted);">Accuracy Rate</div>
              </div>
            </div>
          </div>

        </div>

        <div class="modal-footer" style="flex-shrink:0;">
          <button class="btn btn-outline" onclick="closeDetailedResultsModal()">
            <i class="fas fa-times"></i> Close
          </button>
          ${!passed && assessmentId ? `
            <button class="btn btn-primary" onclick="closeDetailedResultsModal(); closeResultsModal(); startAssessment('${assessmentId}')">
              <i class="fas fa-redo"></i> Retake Assessment
            </button>
          ` : ''}
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ===== GENERATE RECOMMENDATIONS =====
function generateRecommendations(percentage, gradedAnswers) {
  const recommendations = [];
  const correctCount = gradedAnswers.filter(a => a.isCorrect).length;
  const totalCount = gradedAnswers.length;
  const incorrectCount = totalCount - correctCount;

  // Performance-based recommendations
  if (percentage >= 90) {
    recommendations.push('Excellent work! You have a strong understanding of the material.');
    recommendations.push('Consider taking more advanced assessments to challenge yourself further.');
    recommendations.push('You could help others by sharing your knowledge and study techniques.');
  } else if (percentage >= 80) {
    recommendations.push('Great job! You passed with a solid understanding of the concepts.');
    recommendations.push('Review the questions you missed to strengthen your weak areas.');
    recommendations.push('Keep practicing to maintain and improve your knowledge.');
  } else if (percentage >= 70) {
    recommendations.push('Good effort! You\'re close to passing. Focus on the areas where you struggled.');
    recommendations.push('Review the correct answers and explanations carefully.');
    recommendations.push('Consider retaking the assessment after additional study.');
  } else if (percentage >= 50) {
    recommendations.push('You need more preparation. Review the course materials thoroughly.');
    recommendations.push('Focus on understanding the fundamental concepts before retaking.');
    recommendations.push('Consider seeking help from instructors or study groups.');
  } else {
    recommendations.push('Significant improvement needed. Start with the basics and build up gradually.');
    recommendations.push('Dedicate more time to studying the course materials.');
    recommendations.push('Don\'t be discouraged - learning takes time and practice.');
  }

  // Specific recommendations based on incorrect answers
  if (incorrectCount > 0) {
    recommendations.push(`Review the ${incorrectCount} question${incorrectCount > 1 ? 's' : ''} you got wrong and understand why the correct answers are right.`);
  }

  // Time-based recommendations (if available)
  if (window.lastAssessmentResult?.timeTaken) {
    const timeTaken = window.lastAssessmentResult.timeTaken;
    const avgTimePerQuestion = timeTaken / totalCount;
    if (avgTimePerQuestion < 30) {
      recommendations.push('You completed the assessment quickly. Make sure you\'re reading each question carefully.');
    } else if (avgTimePerQuestion > 120) {
      recommendations.push('Take your time, but try to improve your speed with practice.');
    }
  }

  return recommendations;
}

// ===== VIEW ASSESSMENT HISTORY =====
async function viewAssessmentHistory(assessmentId) {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/assessments/${assessmentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error('Failed to load assessment history');
    }

    const data = await res.json();
    const assessment = data.data;
    const userData = getUserData();
    const userId = userData?._id || userData?.id;
    const userAttempts = (assessment.attempts || []).filter(a => String(a.user) === String(userId));

    if (userAttempts.length === 0) {
      showToast('No attempts found', 'info');
      return;
    }

    const modalHTML = `
      <div class="modal-overlay" id="historyModal" onclick="if(event.target===this)closeHistoryModal()">
        <div class="modal-content" style="max-width:700px;">
          <div class="modal-header">
            <h3 class="modal-title">
              <i class="fas fa-history" style="color:var(--primary);"></i> Assessment History
            </h3>
            <button class="btn-icon" onclick="closeHistoryModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div style="padding:2rem;">
            <h4 style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:1.5rem;">${assessment.title}</h4>
            
            <div style="display:flex;flex-direction:column;gap:1rem;">
              ${userAttempts.reverse().map((attempt, index) => {
                const attemptNum = userAttempts.length - index;
                const passed = attempt.passed;
                const percentage = attempt.percentage || 0;
                const date = new Date(attempt.completedAt);
                const timeTaken = attempt.timeTaken || 0;
                const minutes = Math.floor(timeTaken / 60);
                const seconds = timeTaken % 60;
                const correctAnswers = attempt.answers ? attempt.answers.filter(a => a.isCorrect).length : 0;
                const totalQuestions = attempt.answers ? attempt.answers.length : 0;

                return `
                  <div style="padding:1.25rem;background:var(--bg-body);border-radius:var(--radius-lg);border:1px solid var(--border);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;flex-wrap:wrap;gap:0.75rem;">
                      <div>
                        <span style="font-weight:700;color:var(--text-primary);">Attempt #${attemptNum}</span>
                        <span style="font-size:0.875rem;color:var(--text-muted);margin-left:0.5rem;">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
                      </div>
                      <span class="badge ${passed ? 'badge-success' : 'badge-danger'}">
                        ${passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <div style="display:flex;gap:1.5rem;font-size:0.875rem;margin-bottom:0.75rem;flex-wrap:wrap;">
                      <div>
                        <span style="color:var(--text-muted);">Score:</span>
                        <span style="font-weight:700;color:${passed ? 'var(--success)' : 'var(--danger)'};">${percentage}%</span>
                      </div>
                      <div>
                        <span style="color:var(--text-muted);">Correct:</span>
                        <span style="font-weight:700;color:var(--text-primary);">${correctAnswers}/${totalQuestions}</span>
                      </div>
                      <div>
                        <span style="color:var(--text-muted);">Time:</span>
                        <span style="font-weight:700;color:var(--text-primary);">${minutes}m ${seconds}s</span>
                      </div>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="viewAttemptDetails('${assessment._id}', ${index})" style="width:100%;">
                      <i class="fas fa-eye"></i> View Detailed Results
                    </button>
                  </div>`;
              }).join('')}
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" onclick="closeHistoryModal()">Close</button>
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  } catch (error) {
    console.error('Error loading assessment history:', error);
    showToast('Failed to load assessment history', 'error');
  }
}

function closeHistoryModal() {
  document.getElementById('historyModal')?.remove();
}

// ===== VIEW ATTEMPT DETAILS =====
async function viewAttemptDetails(assessmentId, attemptIndex) {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_URL}/assessments/${assessmentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error('Failed to load assessment');
    }

    const data = await res.json();
    const assessment = data.data;
    const userData = getUserData();
    const userId = userData?._id || userData?.id;
    const userAttempts = (assessment.attempts || []).filter(a => String(a.user) === String(userId));
    
    // Get the specific attempt (reverse the array to match display order)
    const attempt = userAttempts.reverse()[attemptIndex];
    
    if (!attempt) {
      showToast('Attempt not found', 'error');
      return;
    }

    // Set up the data for detailed view
    currentQuiz = assessment;
    window.lastAssessmentResult = {
      passed: attempt.passed,
      percentage: attempt.percentage,
      score: attempt.score,
      totalPoints: assessment.totalPoints,
      timeTaken: attempt.timeTaken,
      passingScore: assessment.passingScore,
      gradedAnswers: attempt.answers.map((ans, idx) => ({
        ...ans,
        correctAnswer: assessment.questions[idx]?.correctAnswer,
        explanation: assessment.questions[idx]?.explanation || ''
      }))
    };

    // Close history modal and show detailed results
    closeHistoryModal();
    showDetailedResults();

  } catch (error) {
    console.error('Error loading attempt details:', error);
    showToast('Failed to load attempt details', 'error');
  }
}

// ===== EXPORTS =====
window.renderUserAssessments = renderUserAssessments;
window.startAssessment = startAssessment;
window.selectAnswer = selectAnswer;
window.quizNavigate = quizNavigate;
window.quizGoTo = quizGoTo;
window.confirmCloseQuiz = confirmCloseQuiz;
window.confirmSubmitQuiz = confirmSubmitQuiz;
window.submitQuiz = submitQuiz;
window.closeQuizModal = closeQuizModal;
window.closeResultsModal = closeResultsModal;
window.closeDetailedResultsModal = closeDetailedResultsModal;
window.showDetailedResults = showDetailedResults;
window.viewAssessmentHistory = viewAssessmentHistory;
window.closeHistoryModal = closeHistoryModal;
window.viewAttemptDetails = viewAttemptDetails;
