// ===== NEXTSTEP AI – IMPROVED INTERVIEW SYSTEM =====

let interviewState = {
  currentScreen: 'setup',
  cameraStream: null,
  micStream: null,
  cameraEnabled: false,
  micEnabled: false,
  resumeUploaded: false,
  resumeFile: null,
  resumeAnalysis: null,
  settings: {
    duration: 30,
    difficulty: 'medium',
    type: 'hr'
  },
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  startTime: null,
  timerInterval: null,
  answerStartTime: null,
  isRecording: false
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeInterview();
});

function initializeInterview() {
  setupEventListeners();
  checkSystemRequirements();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Exit button
  document.getElementById('exitBtn')?.addEventListener('click', exitInterview);
  
  // Camera toggle
  document.getElementById('toggleCamera')?.addEventListener('click', toggleCamera);
  document.getElementById('toggleCameraInterview')?.addEventListener('click', toggleCamera);
  
  // Mic toggle
  document.getElementById('toggleMic')?.addEventListener('click', toggleMic);
  document.getElementById('toggleMicInterview')?.addEventListener('click', toggleMic);
  
  // Resume upload
  document.getElementById('uploadResumeBtn')?.addEventListener('click', () => {
    document.getElementById('resumeInput').click();
  });
  
  document.getElementById('resumeInput')?.addEventListener('change', handleResumeUpload);
  
  // Settings
  document.getElementById('interviewDuration')?.addEventListener('change', (e) => {
    interviewState.settings.duration = parseInt(e.target.value);
  });
  
  document.getElementById('interviewDifficulty')?.addEventListener('change', (e) => {
    interviewState.settings.difficulty = e.target.value;
  });
  
  document.getElementById('interviewType')?.addEventListener('change', (e) => {
    interviewState.settings.type = e.target.value;
  });
  
  // Start interview
  document.getElementById('startInterviewBtn')?.addEventListener('click', startInterview);
  
  // Interview controls
  document.getElementById('pauseBtn')?.addEventListener('click', pauseInterview);
  document.getElementById('endBtn')?.addEventListener('click', endInterview);
  document.getElementById('skipBtn')?.addEventListener('click', skipQuestion);
  document.getElementById('answerBtn')?.addEventListener('click', toggleAnswering);
  document.getElementById('nextBtn')?.addEventListener('click', nextQuestion);
  
  // Results actions
  document.getElementById('viewDetailedReport')?.addEventListener('click', viewDetailedReport);
  document.getElementById('retakeInterview')?.addEventListener('click', retakeInterview);
  document.getElementById('backToDashboard')?.addEventListener('click', backToDashboard);
}

// ===== SYSTEM CHECK =====
async function checkSystemRequirements() {
  // Check camera
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    updateCheckItem('checkCamera', 'success', 'Camera Access');
  } catch (error) {
    updateCheckItem('checkCamera', 'error', 'Camera Access - Denied');
  }
  
  // Check microphone
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    updateCheckItem('checkMic', 'success', 'Microphone Access');
  } catch (error) {
    updateCheckItem('checkMic', 'error', 'Microphone Access - Denied');
  }
  
  // Resume check (will update when uploaded)
  updateCheckItem('checkResume', 'error', 'Resume Not Uploaded');
  
  checkStartButtonState();
}

function updateCheckItem(id, status, text) {
  const item = document.getElementById(id);
  if (!item) return;
  
  item.className = `check-item ${status}`;
  const icon = status === 'success' ? 'fa-check-circle' : 
               status === 'error' ? 'fa-times-circle' : 'fa-circle-notch fa-spin';
  item.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
}

function checkStartButtonState() {
  const btn = document.getElementById('startInterviewBtn');
  if (!btn) return;
  
  const cameraOk = document.getElementById('checkCamera')?.classList.contains('success');
  const micOk = document.getElementById('checkMic')?.classList.contains('success');
  const resumeOk = interviewState.resumeUploaded;
  
  btn.disabled = !(cameraOk && micOk && resumeOk);
}

// ===== CAMERA & MIC =====
async function toggleCamera() {
  if (interviewState.cameraEnabled) {
    // Turn off camera
    if (interviewState.cameraStream) {
      interviewState.cameraStream.getTracks().forEach(track => track.stop());
      interviewState.cameraStream = null;
    }
    interviewState.cameraEnabled = false;
    
    const preview = document.getElementById('cameraPreview') || document.getElementById('userVideo');
    const overlay = document.getElementById('cameraOverlay');
    if (preview) preview.srcObject = null;
    if (overlay) overlay.classList.remove('hidden');
    
    document.querySelectorAll('#toggleCamera, #toggleCameraInterview').forEach(btn => {
      btn.classList.remove('active');
      btn.querySelector('i').className = 'fas fa-video-slash';
    });
  } else {
    // Turn on camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      interviewState.cameraStream = stream;
      interviewState.cameraEnabled = true;
      
      const preview = document.getElementById('cameraPreview') || document.getElementById('userVideo');
      const overlay = document.getElementById('cameraOverlay');
      if (preview) preview.srcObject = stream;
      if (overlay) overlay.classList.add('hidden');
      
      document.querySelectorAll('#toggleCamera, #toggleCameraInterview').forEach(btn => {
        btn.classList.add('active');
        btn.querySelector('i').className = 'fas fa-video';
      });
    } catch (error) {
      showToast('Camera access denied', 'error');
    }
  }
}

async function toggleMic() {
  if (interviewState.micEnabled) {
    // Turn off mic
    if (interviewState.micStream) {
      interviewState.micStream.getTracks().forEach(track => track.stop());
      interviewState.micStream = null;
    }
    interviewState.micEnabled = false;
    
    document.querySelectorAll('#toggleMic, #toggleMicInterview').forEach(btn => {
      btn.classList.add('muted');
      btn.querySelector('i').className = 'fas fa-microphone-slash';
    });
  } else {
    // Turn on mic
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      interviewState.micStream = stream;
      interviewState.micEnabled = true;
      
      document.querySelectorAll('#toggleMic, #toggleMicInterview').forEach(btn => {
        btn.classList.remove('muted');
        btn.querySelector('i').className = 'fas fa-microphone';
      });
    } catch (error) {
      showToast('Microphone access denied', 'error');
    }
  }
}

// ===== RESUME UPLOAD =====
async function handleResumeUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  const allowedTypes = ['application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    showToast('Please upload a PDF or Word document', 'error');
    return;
  }
  
  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showToast('File size must be less than 5MB', 'error');
    return;
  }
  
  interviewState.resumeFile = file;
  
  // Show file info
  const fileInfo = document.getElementById('resumeFileInfo');
  const fileName = document.getElementById('resumeFileName');
  if (fileInfo && fileName) {
    fileName.textContent = file.name;
    fileInfo.style.display = 'flex';
  }
  
  // Analyze resume
  showToast('Analyzing resume...', 'info');
  await analyzeResume(file);
}

async function analyzeResume(file) {
  try {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('difficulty', interviewState.settings.difficulty);
    formData.append('type', interviewState.settings.type);
    
    const response = await fetch(`${API_URL}/interview/analyze-resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze resume');
    }
    
    const data = await response.json();
    
    if (data.success) {
      interviewState.resumeAnalysis = data.data;
      interviewState.questions = data.data.questions || [];
      interviewState.resumeUploaded = true;
      
      updateCheckItem('checkResume', 'success', 'Resume Uploaded & Analyzed');
      checkStartButtonState();
      
      showToast(`Resume analyzed! ${interviewState.questions.length} questions generated`, 'success');
    } else {
      throw new Error(data.message || 'Analysis failed');
    }
  } catch (error) {
    console.error('Resume analysis error:', error);
    showToast('Error analyzing resume. Using default questions.', 'warning');
    
    // Use default questions as fallback
    interviewState.questions = generateDefaultQuestions();
    interviewState.resumeUploaded = true;
    updateCheckItem('checkResume', 'success', 'Resume Uploaded');
    checkStartButtonState();
  }
}

function generateDefaultQuestions() {
  // Fallback questions if API fails
  return [
    {
      id: 1,
      text: "Tell me about yourself and your background.",
      category: "Introduction",
      type: "behavioral",
      expectedDuration: 120
    },
    {
      id: 2,
      text: "What motivated you to apply for this position?",
      category: "Motivation",
      type: "behavioral",
      expectedDuration: 90
    },
    {
      id: 3,
      text: "Describe a challenging project you worked on.",
      category: "Experience",
      type: "behavioral",
      expectedDuration: 180
    },
    {
      id: 4,
      text: "What are your greatest strengths?",
      category: "Self Assessment",
      type: "behavioral",
      expectedDuration: 120
    },
    {
      id: 5,
      text: "Where do you see yourself in 5 years?",
      category: "Career Goals",
      type: "behavioral",
      expectedDuration: 90
    }
  ];
}

// ===== START INTERVIEW =====
async function startInterview() {
  if (!interviewState.cameraEnabled) {
    await toggleCamera();
  }
  if (!interviewState.micEnabled) {
    await toggleMic();
  }
  
  // Switch to interview screen
  switchScreen('interview');
  
  // Start timer
  interviewState.startTime = Date.now();
  startTimer();
  
  // Show first question
  showQuestion(0);
  
  showToast('Interview started! Good luck!', 'success');
}

function switchScreen(screenName) {
  document.querySelectorAll('.interview-screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  const targetScreen = document.getElementById(`${screenName}Screen`);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }
  
  interviewState.currentScreen = screenName;
}

// ===== TIMER =====
function startTimer() {
  const timerEl = document.getElementById('interviewTimer');
  const timeRemainingEl = document.getElementById('timeRemaining');
  
  interviewState.timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - interviewState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    if (timerEl) {
      timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    // Calculate remaining time
    const totalSeconds = interviewState.settings.duration * 60;
    const remaining = totalSeconds - elapsed;
    
    if (remaining <= 0) {
      endInterview();
      return;
    }
    
    const remMinutes = Math.floor(remaining / 60);
    const remSeconds = remaining % 60;
    
    if (timeRemainingEl) {
      timeRemainingEl.textContent = `${remMinutes}:${String(remSeconds).padStart(2, '0')} remaining`;
    }
  }, 1000);
}

function stopTimer() {
  if (interviewState.timerInterval) {
    clearInterval(interviewState.timerInterval);
    interviewState.timerInterval = null;
  }
}

// ===== QUESTIONS =====
function showQuestion(index) {
  if (index >= interviewState.questions.length) {
    endInterview();
    return;
  }
  
  interviewState.currentQuestionIndex = index;
  const question = interviewState.questions[index];
  
  // Update UI
  document.getElementById('questionNumber').textContent = `Question ${index + 1} of ${interviewState.questions.length}`;
  document.getElementById('questionText').textContent = question.text;
  document.getElementById('questionCategory').innerHTML = `<i class="fas fa-tag"></i> ${question.category}`;
  
  // Update progress
  const progress = ((index + 1) / interviewState.questions.length) * 100;
  document.getElementById('interviewProgress').style.width = `${progress}%`;
  document.getElementById('progressText').textContent = `${index + 1} of ${interviewState.questions.length} questions`;
  
  // Reset answer button
  const answerBtn = document.getElementById('answerBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (answerBtn) {
    answerBtn.style.display = 'flex';
    answerBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Answering';
  }
  if (nextBtn) {
    nextBtn.style.display = 'none';
  }
  
  interviewState.isRecording = false;
  interviewState.answerStartTime = null;
}

function toggleAnswering() {
  const answerBtn = document.getElementById('answerBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (!interviewState.isRecording) {
    // Start answering
    interviewState.isRecording = true;
    interviewState.answerStartTime = Date.now();
    
    if (answerBtn) {
      answerBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Answering';
      answerBtn.classList.remove('btn-primary');
      answerBtn.classList.add('btn-danger');
    }
    
    // Show recording indicator
    document.getElementById('recordingIndicator')?.classList.add('recording');
    document.getElementById('aiStatus').textContent = 'Recording your answer...';
    
    showToast('Recording started', 'info');
  } else {
    // Stop answering
    interviewState.isRecording = false;
    const answerDuration = Math.floor((Date.now() - interviewState.answerStartTime) / 1000);
    
    // Save answer
    interviewState.answers.push({
      questionId: interviewState.questions[interviewState.currentQuestionIndex].id,
      question: interviewState.questions[interviewState.currentQuestionIndex].text,
      duration: answerDuration,
      timestamp: new Date().toISOString()
    });
    
    if (answerBtn) {
      answerBtn.style.display = 'none';
    }
    if (nextBtn) {
      nextBtn.style.display = 'flex';
    }
    
    // Hide recording indicator
    document.getElementById('recordingIndicator')?.classList.remove('recording');
    document.getElementById('aiStatus').textContent = 'Listening...';
    
    showToast('Answer recorded', 'success');
  }
}

function skipQuestion() {
  if (interviewState.isRecording) {
    toggleAnswering();
  }
  
  interviewState.answers.push({
    questionId: interviewState.questions[interviewState.currentQuestionIndex].id,
    question: interviewState.questions[interviewState.currentQuestionIndex].text,
    skipped: true,
    timestamp: new Date().toISOString()
  });
  
  nextQuestion();
}

function nextQuestion() {
  const nextIndex = interviewState.currentQuestionIndex + 1;
  if (nextIndex < interviewState.questions.length) {
    showQuestion(nextIndex);
  } else {
    endInterview();
  }
}

// ===== END INTERVIEW =====
function pauseInterview() {
  stopTimer();
  showToast('Interview paused', 'warning');
  // In production, implement pause functionality
}

async function endInterview() {
  stopTimer();
  
  // Stop camera and mic
  if (interviewState.cameraStream) {
    interviewState.cameraStream.getTracks().forEach(track => track.stop());
  }
  if (interviewState.micStream) {
    interviewState.micStream.getTracks().forEach(track => track.stop());
  }
  
  // Calculate results
  showToast('Analyzing your performance...', 'info');
  
  try {
    const results = await submitInterview();
    displayResults(results);
  } catch (error) {
    console.error('Error submitting interview:', error);
    // Show default results
    displayResults(calculateLocalResults());
  }
  
  switchScreen('results');
}

async function submitInterview() {
  const totalDuration = Math.floor((Date.now() - interviewState.startTime) / 1000);
  
  const response = await fetch(`${API_URL}/interview/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      answers: interviewState.answers,
      duration: totalDuration,
      settings: interviewState.settings,
      totalQuestions: interviewState.questions.length,
      resumeAnalysis: interviewState.resumeAnalysis
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit interview');
  }
  
  const data = await response.json();
  return data.data;
}

function calculateLocalResults() {
  // Calculate results based on ACTUAL answers only - no random inflation
  const totalQuestions = interviewState.questions.length || 1;
  const answeredQuestions = interviewState.answers.filter(a => !a.skipped).length;
  const skippedQuestions = interviewState.answers.filter(a => a.skipped).length;
  
  // If nothing answered, score is 0
  if (answeredQuestions === 0) {
    return {
      overallScore: 0,
      communicationScore: 0,
      technicalScore: 0,
      professionalismScore: 0,
      avgResponseTime: 0,
      completionRate: 0,
      answeredQuestions: 0,
      skippedQuestions,
      passed: false,
      qualifyingMark: 60,
      feedback: {
        strengths: ['You attempted the interview'],
        improvements: ['Try to answer all questions', 'Provide detailed responses', 'Practice before your next session'],
        recommendations: ['Review common interview questions', 'Use the STAR method for behavioral questions', 'Record yourself to improve confidence']
      }
    };
  }
  
  // Base score purely from completion rate (0–100)
  const completionRate = answeredQuestions / totalQuestions;
  const baseScore = Math.round(completionRate * 100);
  
  // Average response time
  const answeredWithDuration = interviewState.answers.filter(a => !a.skipped && a.duration > 0);
  const avgResponseTime = answeredWithDuration.length > 0
    ? Math.round(answeredWithDuration.reduce((sum, a) => sum + a.duration, 0) / answeredWithDuration.length)
    : 0;
  
  // Quality bonus for thorough answers (no random)
  const goodAnswers = answeredWithDuration.filter(a => a.duration >= 30).length;
  const qualityBonus = answeredWithDuration.length > 0
    ? Math.round((goodAnswers / answeredWithDuration.length) * 10)
    : 0;
  
  // Sub-scores (no random inflation)
  const communicationScore  = Math.min(100, Math.max(0, baseScore + qualityBonus));
  const technicalScore      = Math.min(100, Math.max(0, baseScore));
  const professionalismScore = Math.min(100, Math.max(0, baseScore + Math.round(qualityBonus / 2)));
  
  // Weighted overall
  const overallScore = Math.round(
    (communicationScore * 0.3) +
    (technicalScore * 0.4) +
    (professionalismScore * 0.3)
  );

  const QUALIFYING_MARK = 60;
  const passed = overallScore >= QUALIFYING_MARK;
  
  return {
    overallScore,
    communicationScore,
    technicalScore,
    professionalismScore,
    avgResponseTime,
    completionRate: Math.round(completionRate * 100),
    answeredQuestions,
    skippedQuestions,
    passed,
    qualifyingMark: QUALIFYING_MARK,
    feedback: {
      strengths: generateStrengths(overallScore, completionRate),
      improvements: generateImprovements(skippedQuestions, avgResponseTime),
      recommendations: generateRecommendations(technicalScore)
    }
  };
}

function generateStrengths(score, completionRate) {
  const strengths = [];
  
  if (completionRate >= 0.8) {
    strengths.push("Excellent completion rate - you answered most questions");
  }
  if (score >= 80) {
    strengths.push("Strong overall performance across all categories");
  }
  if (score >= 70) {
    strengths.push("Good communication and presentation skills");
  }
  
  return strengths.length > 0 ? strengths : ["You completed the interview"];
}

function generateImprovements(skipped, avgTime) {
  const improvements = [];
  
  if (skipped > 2) {
    improvements.push("Try to answer all questions instead of skipping");
  }
  if (avgTime < 30) {
    improvements.push("Provide more detailed answers - take your time");
  }
  if (avgTime > 180) {
    improvements.push("Work on being more concise in your responses");
  }
  
  return improvements.length > 0 ? improvements : ["Keep practicing to improve"];
}

function generateRecommendations(techScore) {
  const recommendations = [];
  
  if (techScore < 70) {
    recommendations.push("Review technical concepts related to your field");
  }
  recommendations.push("Practice behavioral questions using the STAR method");
  recommendations.push("Record yourself to improve delivery and confidence");
  
  return recommendations;
}

// ===== DISPLAY RESULTS =====
function displayResults(results) {
  // Update scores
  document.getElementById('finalScore').textContent = results.overallScore;
  document.getElementById('communicationScore').textContent = results.communicationScore;
  document.getElementById('technicalScore').textContent = results.technicalScore;
  document.getElementById('professionalismScore').textContent = results.professionalismScore;
  document.getElementById('responseTime').textContent = `${results.avgResponseTime}s`;
  
  // Update score circle
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (results.overallScore / 100) * circumference;
  document.getElementById('scoreCircle')?.setAttribute('stroke-dashoffset', offset);

  // Show pass/fail badge
  const scoreEl = document.getElementById('finalScore');
  if (scoreEl) {
    const qualifyingMark = results.qualifyingMark || 60;
    const passed = results.passed !== undefined ? results.passed : results.overallScore >= qualifyingMark;
    const badge = document.createElement('div');
    badge.style.cssText = `
      margin-top: 8px;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      display: inline-block;
      background: ${passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'};
      color: ${passed ? '#10b981' : '#ef4444'};
      border: 1px solid ${passed ? '#10b981' : '#ef4444'};
    `;
    badge.textContent = passed ? `✅ Passed (≥${qualifyingMark}%)` : `❌ Below Qualifying Mark (${qualifyingMark}%)`;
    // Remove old badge if exists
    const oldBadge = document.getElementById('passBadge');
    if (oldBadge) oldBadge.remove();
    badge.id = 'passBadge';
    scoreEl.parentElement.appendChild(badge);
  }
  
  // Update feedback
  const feedbackEl = document.getElementById('aiFeedback');
  if (feedbackEl && results.feedback) {
    feedbackEl.innerHTML = `
      <p><strong>Strengths:</strong> ${results.feedback.strengths.join('. ')}.</p>
      <p><strong>Areas for Improvement:</strong> ${results.feedback.improvements.join('. ')}.</p>
      <p><strong>Recommendations:</strong> ${results.feedback.recommendations.join('. ')}.</p>
    `;
  }
}

// ===== RESULTS ACTIONS =====
function viewDetailedReport() {
  showToast('Detailed report - Coming soon!', 'info');
}

function retakeInterview() {
  // Reset state
  interviewState = {
    currentScreen: 'setup',
    cameraStream: null,
    micStream: null,
    cameraEnabled: false,
    micEnabled: false,
    resumeUploaded: false,
    resumeFile: null,
    resumeAnalysis: null,
    settings: {
      duration: 30,
      difficulty: 'medium',
      type: 'hr'
    },
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    startTime: null,
    timerInterval: null,
    answerStartTime: null,
    isRecording: false
  };
  
  // Reset UI
  document.getElementById('resumeFileInfo').style.display = 'none';
  document.getElementById('resumeInput').value = '';
  
  switchScreen('setup');
  checkSystemRequirements();
}

function backToDashboard() {
  window.location.href = 'user-dashboard.html';
}

function exitInterview() {
  if (confirm('Are you sure you want to exit the interview?')) {
    backToDashboard();
  }
}

// Toast helper
function showToast(msg, type='success'){
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  const icons = { success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-triangle', info:'fa-info-circle' };
  toast.innerHTML = `<i class="fas ${icons[type]||'fa-info-circle'}" style="color:var(--${type==='success'?'success':type==='error'?'danger':type==='warning'?'warning':'info'})"></i><span>${msg}</span><span class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></span>`;
  container.appendChild(toast);
  setTimeout(()=>toast.remove(), 4000);
}
