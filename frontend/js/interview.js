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
  isRecording: false,
  // AI Voice State
  aiVoice: {
    synthesis: null,
    currentUtterance: null,
    isSpeaking: false,
    isPaused: false,
    voices: [],
    selectedVoice: null,
    settings: {
      rate: 0.9,        // Speaking speed (0.1 to 10)
      pitch: 1.0,       // Voice pitch (0 to 2)
      volume: 0.8       // Volume (0 to 1)
    }
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeInterview();
});

function initializeInterview() {
  setupEventListeners();
  checkSystemRequirements();
  initializeAIVoice();
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
  
  // AI Voice controls
  document.getElementById('replayQuestionBtn')?.addEventListener('click', replayCurrentQuestion);
  document.getElementById('pauseVoiceBtn')?.addEventListener('click', toggleAIVoice);
  document.getElementById('stopVoiceBtn')?.addEventListener('click', stopAIVoice);
  
  // Results actions
  document.getElementById('viewDetailedReport')?.addEventListener('click', viewDetailedReport);
  document.getElementById('retakeInterview')?.addEventListener('click', retakeInterview);
  document.getElementById('backToDashboard')?.addEventListener('click', backToDashboard);
}

// ===== AI VOICE SYSTEM =====
function initializeAIVoice() {
  // Check if speech synthesis is supported
  if ('speechSynthesis' in window) {
    interviewState.aiVoice.synthesis = window.speechSynthesis;
    
    // Load available voices
    loadVoices();
    
    // Listen for voice changes (some browsers load voices asynchronously)
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    console.log('AI Voice system initialized');
  } else {
    console.warn('Speech synthesis not supported in this browser');
    showToast('AI Voice not supported in this browser', 'warning');
  }
}

function loadVoices() {
  const voices = speechSynthesis.getVoices();
  interviewState.aiVoice.voices = voices;
  
  // Try to find a good English voice (prefer female voices for interviews)
  const preferredVoices = [
    'Google UK English Female',
    'Microsoft Zira - English (United States)',
    'Alex',
    'Samantha',
    'Karen',
    'Moira'
  ];
  
  let selectedVoice = null;
  
  // First try to find preferred voices
  for (const preferred of preferredVoices) {
    selectedVoice = voices.find(voice => voice.name.includes(preferred));
    if (selectedVoice) break;
  }
  
  // If no preferred voice found, use first English voice
  if (!selectedVoice) {
    selectedVoice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => voice.lang.startsWith('en'));
  }
  
  // Fallback to first available voice
  if (!selectedVoice && voices.length > 0) {
    selectedVoice = voices[0];
  }
  
  interviewState.aiVoice.selectedVoice = selectedVoice;
  
  if (selectedVoice) {
    console.log('AI Voice selected:', selectedVoice.name);
  }
}

function speakText(text, options = {}) {
  return new Promise((resolve, reject) => {
    if (!interviewState.aiVoice.synthesis) {
      reject(new Error('Speech synthesis not available'));
      return;
    }
    
    // Stop any current speech
    stopAIVoice();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice settings
    if (interviewState.aiVoice.selectedVoice) {
      utterance.voice = interviewState.aiVoice.selectedVoice;
    }
    
    utterance.rate = options.rate || interviewState.aiVoice.settings.rate;
    utterance.pitch = options.pitch || interviewState.aiVoice.settings.pitch;
    utterance.volume = options.volume || interviewState.aiVoice.settings.volume;
    
    // Event handlers
    utterance.onstart = () => {
      interviewState.aiVoice.isSpeaking = true;
      interviewState.aiVoice.currentUtterance = utterance;
      updateAIVoiceUI(true);
    };
    
    utterance.onend = () => {
      interviewState.aiVoice.isSpeaking = false;
      interviewState.aiVoice.currentUtterance = null;
      updateAIVoiceUI(false);
      resolve();
    };
    
    utterance.onerror = (event) => {
      interviewState.aiVoice.isSpeaking = false;
      interviewState.aiVoice.currentUtterance = null;
      updateAIVoiceUI(false);
      reject(new Error('Speech synthesis error: ' + event.error));
    };
    
    // Start speaking
    interviewState.aiVoice.synthesis.speak(utterance);
  });
}

function stopAIVoice() {
  if (interviewState.aiVoice.synthesis) {
    interviewState.aiVoice.synthesis.cancel();
    interviewState.aiVoice.isSpeaking = false;
    interviewState.aiVoice.currentUtterance = null;
    updateAIVoiceUI(false);
  }
}

function pauseAIVoice() {
  if (interviewState.aiVoice.synthesis && interviewState.aiVoice.isSpeaking) {
    interviewState.aiVoice.synthesis.pause();
    interviewState.aiVoice.isPaused = true;
    updateAIVoiceUI(false);
  }
}

function resumeAIVoice() {
  if (interviewState.aiVoice.synthesis && interviewState.aiVoice.isPaused) {
    interviewState.aiVoice.synthesis.resume();
    interviewState.aiVoice.isPaused = false;
    updateAIVoiceUI(true);
  }
}

function updateAIVoiceUI(isSpeaking) {
  // Update AI status text
  const aiStatus = document.getElementById('aiStatus');
  if (aiStatus) {
    if (isSpeaking) {
      aiStatus.textContent = '🎤 AI is asking...';
      aiStatus.style.color = 'var(--primary)';
    } else if (interviewState.isRecording) {
      aiStatus.textContent = '🎧 Listening to your answer...';
      aiStatus.style.color = 'var(--success)';
    } else {
      aiStatus.textContent = '💭 Waiting for your response...';
      aiStatus.style.color = 'var(--text-muted)';
    }
  }
  
  // Update voice controls
  const voiceControls = document.querySelectorAll('.ai-voice-control');
  voiceControls.forEach(control => {
    if (isSpeaking) {
      control.classList.add('speaking');
    } else {
      control.classList.remove('speaking');
    }
  });
  
  // Add speaking animation to AI avatar if exists
  const aiAvatar = document.querySelector('.ai-avatar');
  if (aiAvatar) {
    if (isSpeaking) {
      aiAvatar.classList.add('speaking');
    } else {
      aiAvatar.classList.remove('speaking');
    }
  }
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
  
  // Check AI Voice Support
  if ('speechSynthesis' in window) {
    updateCheckItem('checkVoice', 'success', 'AI Voice Support');
  } else {
    updateCheckItem('checkVoice', 'warning', 'AI Voice Not Supported');
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
  
  // Voice is optional - interview can work without it
  const voiceOk = document.getElementById('checkVoice')?.classList.contains('success') || 
                  document.getElementById('checkVoice')?.classList.contains('warning');
  
  btn.disabled = !(cameraOk && micOk && resumeOk);
  
  // Show voice status in button if voice is not available
  if (!document.getElementById('checkVoice')?.classList.contains('success')) {
    const originalText = btn.innerHTML;
    if (!originalText.includes('(Text Only)')) {
      btn.innerHTML = originalText.replace('Start Interview', 'Start Interview (Text Only)');
    }
  }
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
    if (preview) {
      preview.srcObject = null;
      preview.style.display = 'none';
    }
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.classList.remove('hidden');
    }
    
    document.querySelectorAll('#toggleCamera, #toggleCameraInterview').forEach(btn => {
      btn.classList.remove('active');
      btn.querySelector('i').className = 'fas fa-video-slash';
    });
    
    console.log('Camera disabled');
  } else {
    // Turn on camera
    try {
      // Request camera permissions first
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, min: 15 }
        }
      };
      
      console.log('Requesting camera access with constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      interviewState.cameraStream = stream;
      interviewState.cameraEnabled = true;
      
      console.log('Camera stream obtained:', stream);
      console.log('Video tracks:', stream.getVideoTracks());
      
      const preview = document.getElementById('cameraPreview') || document.getElementById('userVideo');
      const overlay = document.getElementById('cameraOverlay');
      
      if (preview) {
        // Clear any existing source
        preview.srcObject = null;
        
        // Set new stream
        preview.srcObject = stream;
        preview.style.display = 'block';
        
        // Ensure video plays and handle loading
        preview.onloadedmetadata = () => {
          console.log('Video metadata loaded, attempting to play');
          preview.play().then(() => {
            console.log('Video playing successfully');
          }).catch(e => {
            console.error('Video play error:', e);
            showToast('Error starting video playback', 'error');
          });
        };
        
        // Handle video errors
        preview.onerror = (e) => {
          console.error('Video element error:', e);
          showToast('Video display error', 'error');
        };
        
        // Force load if metadata doesn't trigger
        setTimeout(() => {
          if (preview.readyState === 0) {
            console.log('Forcing video load');
            preview.load();
          }
        }, 1000);
      }
      
      if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.add('hidden');
      }
      
      document.querySelectorAll('#toggleCamera, #toggleCameraInterview').forEach(btn => {
        btn.classList.add('active');
        btn.querySelector('i').className = 'fas fa-video';
      });
      
      console.log('Camera enabled successfully');
      showToast('Camera enabled', 'success');
      
    } catch (error) {
      console.error('Camera error:', error);
      
      let errorMessage = 'Camera access denied. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access in your browser settings and refresh the page.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application. Please close other apps and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not support the required settings. Trying with basic settings...';
        
        // Retry with basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
          interviewState.cameraStream = basicStream;
          interviewState.cameraEnabled = true;
          
          const preview = document.getElementById('cameraPreview') || document.getElementById('userVideo');
          if (preview) {
            preview.srcObject = basicStream;
            preview.style.display = 'block';
            preview.play().catch(e => console.error('Basic video play error:', e));
          }
          
          showToast('Camera enabled with basic settings', 'success');
          return;
        } catch (basicError) {
          console.error('Basic camera access also failed:', basicError);
          errorMessage = 'Camera access failed completely. Please check your camera and browser permissions.';
        }
      } else {
        errorMessage += 'Unknown camera error. Please try refreshing the page.';
      }
      
      showToast(errorMessage, 'error');
      
      // Update check status
      updateCheckItem('checkCamera', 'error', 'Camera Access - Failed');
      checkStartButtonState();
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
  // Enhanced technical questions based on common resume skills
  return [
    {
      id: 1,
      text: "Tell me about yourself and walk me through your technical background and experience.",
      category: "Introduction",
      type: "behavioral",
      expectedDuration: 120
    },
    {
      id: 2,
      text: "What programming languages are you most proficient in? Can you explain a recent project where you used Java?",
      category: "Java Programming",
      type: "technical",
      expectedDuration: 150
    },
    {
      id: 3,
      text: "Explain the difference between ArrayList and LinkedList in Java. When would you choose one over the other?",
      category: "Java Collections",
      type: "technical",
      expectedDuration: 180
    },
    {
      id: 4,
      text: "Describe your experience with databases. Can you explain the difference between INNER JOIN and LEFT JOIN in MySQL?",
      category: "MySQL/Database",
      type: "technical",
      expectedDuration: 180
    },
    {
      id: 5,
      text: "Tell me about a challenging technical problem you solved in one of your projects. What was your approach and what technologies did you use?",
      category: "Problem Solving",
      type: "behavioral",
      expectedDuration: 200
    },
    {
      id: 6,
      text: "How do you ensure code quality in your projects? What testing strategies and tools do you use?",
      category: "Code Quality",
      type: "technical",
      expectedDuration: 150
    },
    {
      id: 7,
      text: "Explain the concept of object-oriented programming. Can you give me an example of inheritance or polymorphism from your experience?",
      category: "Programming Concepts",
      type: "technical",
      expectedDuration: 150
    },
    {
      id: 8,
      text: "Describe your experience working in a team environment. How do you handle code reviews and version control with Git?",
      category: "Teamwork",
      type: "behavioral",
      expectedDuration: 120
    },
    {
      id: 9,
      text: "What is your approach to learning new technologies? Can you tell me about a recent technology or framework you learned?",
      category: "Learning & Growth",
      type: "behavioral",
      expectedDuration: 120
    },
    {
      id: 10,
      text: "Where do you see yourself in your technical career in the next 3-5 years? What technologies do you want to master?",
      category: "Career Goals",
      type: "behavioral",
      expectedDuration: 120
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
  
  // AI Introduction
  await speakIntroduction();
  
  // Show first question
  await showQuestion(0);
  
  showToast('Interview started! Good luck!', 'success');
}

async function speakIntroduction() {
  try {
    const introText = "Hello! I'm your AI interviewer for today. I'll be asking you a series of questions to assess your skills and experience. Please take your time to answer each question thoughtfully. Let's begin!";
    
    updateAIVoiceUI(true);
    await speakText(introText, {
      rate: 0.9,
      pitch: 1.2,
      volume: 0.9
    });
    
    // Small pause before first question
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error('Error speaking introduction:', error);
  }
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
async function showQuestion(index) {
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
  
  // AI speaks the question
  await speakQuestion(question);
}

async function speakQuestion(question) {
  try {
    // Create a more natural question prompt
    const questionIntro = getQuestionIntro(interviewState.currentQuestionIndex, interviewState.questions.length);
    const fullPrompt = `${questionIntro} ${question.text}`;
    
    // Show that AI is speaking
    updateAIVoiceUI(true);
    
    // Speak the question
    await speakText(fullPrompt, {
      rate: 0.85,  // Slightly slower for clarity
      pitch: 1.1   // Slightly higher pitch for friendliness
    });
    
    // After speaking, show ready state
    updateAIVoiceUI(false);
    
    // Show toast to indicate user can start answering
    showToast('You can now start answering', 'info');
    
  } catch (error) {
    console.error('Error speaking question:', error);
    showToast('AI voice unavailable, please read the question', 'warning');
  }
}

function getQuestionIntro(currentIndex, totalQuestions) {
  const intros = [
    // First question
    currentIndex === 0 ? "Let's begin with our first question." : null,
    
    // Middle questions
    currentIndex > 0 && currentIndex < totalQuestions - 1 ? [
      "Great! Now for the next question.",
      "Excellent. Let's continue.",
      "Thank you. Here's your next question.",
      "Perfect. Moving on to the next one.",
      "Good. Let me ask you this."
    ][Math.floor(Math.random() * 5)] : null,
    
    // Last question
    currentIndex === totalQuestions - 1 ? "Finally, here's our last question." : null
  ].filter(Boolean)[0];
  
  return intros || "Here's your question.";
}

// AI Voice Control Functions
async function replayCurrentQuestion() {
  if (interviewState.currentQuestionIndex < interviewState.questions.length) {
    const question = interviewState.questions[interviewState.currentQuestionIndex];
    showToast('Replaying question...', 'info');
    await speakQuestion(question);
  }
}

function toggleAIVoice() {
  const pauseBtn = document.getElementById('pauseVoiceBtn');
  
  if (interviewState.aiVoice.isSpeaking && !interviewState.aiVoice.isPaused) {
    // Pause the voice
    pauseAIVoice();
    if (pauseBtn) {
      pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
      pauseBtn.title = 'Resume AI Voice';
    }
  } else if (interviewState.aiVoice.isPaused) {
    // Resume the voice
    resumeAIVoice();
    if (pauseBtn) {
      pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
      pauseBtn.title = 'Pause AI Voice';
    }
  }
}

function toggleAnswering() {
  const answerBtn = document.getElementById('answerBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (!interviewState.isRecording) {
    // Start answering
    interviewState.isRecording = true;
    interviewState.answerStartTime = Date.now();
    
    // Stop any AI voice first
    stopAIVoice();
    
    if (answerBtn) {
      answerBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Answering';
      answerBtn.classList.remove('btn-primary');
      answerBtn.classList.add('btn-danger');
    }
    
    // Show recording indicator
    document.getElementById('recordingIndicator')?.classList.add('recording');
    document.getElementById('aiStatus').textContent = '🎧 Listening to your answer...';
    
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
    
    // AI acknowledgment
    speakAcknowledgment();
    
    showToast('Answer recorded', 'success');
  }
}

async function speakAcknowledgment() {
  try {
    const acknowledgments = [
      "Thank you for your response.",
      "Got it, thank you.",
      "Thank you for sharing that.",
      "I appreciate your answer.",
      "Thank you for your detailed response."
    ];
    
    const randomAck = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
    
    // Brief pause before acknowledgment
    setTimeout(async () => {
      await speakText(randomAck, {
        rate: 1.0,
        pitch: 1.1,
        volume: 0.7
      });
    }, 500);
    
  } catch (error) {
    console.error('Error speaking acknowledgment:', error);
  }
}

function skipQuestion() {
  if (interviewState.isRecording) {
    toggleAnswering();
  }
  
  // Stop any AI voice
  stopAIVoice();
  
  interviewState.answers.push({
    questionId: interviewState.questions[interviewState.currentQuestionIndex].id,
    question: interviewState.questions[interviewState.currentQuestionIndex].text,
    skipped: true,
    timestamp: new Date().toISOString()
  });
  
  // AI response to skip
  speakSkipResponse();
  
  nextQuestion();
}

async function speakSkipResponse() {
  try {
    const skipResponses = [
      "No problem, let's move on to the next question.",
      "That's okay, let's continue.",
      "Alright, moving to the next question.",
      "No worries, let's proceed."
    ];
    
    const randomResponse = skipResponses[Math.floor(Math.random() * skipResponses.length)];
    
    setTimeout(async () => {
      await speakText(randomResponse, {
        rate: 1.0,
        pitch: 1.0,
        volume: 0.7
      });
    }, 300);
    
  } catch (error) {
    console.error('Error speaking skip response:', error);
  }
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
  stopAIVoice(); // Stop any ongoing AI speech
  showToast('Interview paused', 'warning');
  // In production, implement pause functionality
}

async function endInterview() {
  stopTimer();
  stopAIVoice(); // Stop any ongoing AI speech
  
  // Stop camera and mic
  if (interviewState.cameraStream) {
    interviewState.cameraStream.getTracks().forEach(track => track.stop());
  }
  if (interviewState.micStream) {
    interviewState.micStream.getTracks().forEach(track => track.stop());
  }
  
  // AI closing message
  await speakClosingMessage();
  
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

async function speakClosingMessage() {
  try {
    const closingText = "Thank you for completing the interview! I'm now analyzing your responses and will provide you with detailed feedback shortly.";
    
    updateAIVoiceUI(true);
    await speakText(closingText, {
      rate: 0.9,
      pitch: 1.1
    });
    
  } catch (error) {
    console.error('Error speaking closing message:', error);
  }
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
  // Update main score
  document.getElementById('finalScore').textContent = results.overallScore;
  
  // Update individual scores
  document.getElementById('communicationScore').textContent = results.communicationScore;
  document.getElementById('technicalScore').textContent = results.technicalScore;
  document.getElementById('professionalismScore').textContent = results.professionalismScore;
  document.getElementById('responseTime').textContent = `${results.avgResponseTime}s`;
  
  // Update statistics
  const totalQuestions = interviewState.questions.length;
  document.getElementById('totalQuestions').textContent = totalQuestions;
  document.getElementById('answeredQuestions').textContent = results.answeredQuestions;
  document.getElementById('skippedQuestions').textContent = results.skippedQuestions;
  document.getElementById('completionRate').textContent = `${results.completionRate}%`;
  
  // Update score circle animation
  const circumference = 2 * Math.PI * 85; // radius = 85
  const offset = circumference - (results.overallScore / 100) * circumference;
  const scoreCircle = document.getElementById('scoreCircle');
  if (scoreCircle) {
    scoreCircle.setAttribute('stroke-dashoffset', offset);
    
    // Update circle color based on score
    if (results.overallScore >= 80) {
      scoreCircle.setAttribute('stroke', 'var(--success)');
    } else if (results.overallScore >= 60) {
      scoreCircle.setAttribute('stroke', 'var(--primary)');
    } else {
      scoreCircle.setAttribute('stroke', 'var(--danger)');
    }
  }
  
  // Update score bars with animation
  setTimeout(() => {
    const communicationBar = document.querySelector('.metric-card.communication .score-fill');
    const technicalBar = document.querySelector('.metric-card.technical .score-fill');
    const professionalismBar = document.querySelector('.metric-card.professionalism .score-fill');
    
    if (communicationBar) communicationBar.style.width = `${results.communicationScore}%`;
    if (technicalBar) technicalBar.style.width = `${results.technicalScore}%`;
    if (professionalismBar) professionalismBar.style.width = `${results.professionalismScore}%`;
  }, 500);
  
  // Update status based on performance
  const qualifyingMark = results.qualifyingMark || 60;
  const passed = results.passed !== undefined ? results.passed : results.overallScore >= qualifyingMark;
  
  // Update status badge
  const statusBadge = document.getElementById('resultsStatusBadge');
  const scoreStatus = document.getElementById('scoreStatus');
  
  if (statusBadge) {
    if (passed) {
      statusBadge.innerHTML = '<i class="fas fa-check-circle"></i><span>Interview Passed</span>';
      statusBadge.style.background = 'var(--success-light)';
      statusBadge.style.color = 'var(--success)';
      statusBadge.style.borderColor = 'var(--success)';
    } else {
      statusBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Below Qualifying Mark</span>';
      statusBadge.style.background = 'var(--warning-light)';
      statusBadge.style.color = 'var(--warning)';
      statusBadge.style.borderColor = 'var(--warning)';
    }
  }
  
  // Update score status section
  if (scoreStatus) {
    const statusIcon = scoreStatus.querySelector('.status-icon i');
    const statusTitle = scoreStatus.querySelector('.status-text h3');
    const statusDesc = scoreStatus.querySelector('.status-text p');
    
    if (results.overallScore >= 90) {
      statusIcon.className = 'fas fa-trophy';
      statusTitle.textContent = 'Outstanding Performance';
      statusDesc.textContent = 'Exceptional skills demonstrated across all areas';
      scoreStatus.style.background = 'var(--success-light)';
      scoreStatus.style.borderLeftColor = 'var(--success)';
    } else if (results.overallScore >= 80) {
      statusIcon.className = 'fas fa-medal';
      statusTitle.textContent = 'Excellent Performance';
      statusDesc.textContent = 'Strong skills demonstrated across all areas';
      scoreStatus.style.background = 'var(--success-light)';
      scoreStatus.style.borderLeftColor = 'var(--success)';
    } else if (results.overallScore >= 70) {
      statusIcon.className = 'fas fa-thumbs-up';
      statusTitle.textContent = 'Good Performance';
      statusDesc.textContent = 'Solid foundation with room for improvement';
      scoreStatus.style.background = 'var(--primary-soft)';
      scoreStatus.style.borderLeftColor = 'var(--primary)';
    } else if (results.overallScore >= 60) {
      statusIcon.className = 'fas fa-check';
      statusTitle.textContent = 'Satisfactory Performance';
      statusDesc.textContent = 'Meets basic requirements, focus on key areas';
      scoreStatus.style.background = 'var(--warning-light)';
      scoreStatus.style.borderLeftColor = 'var(--warning)';
    } else {
      statusIcon.className = 'fas fa-exclamation-circle';
      statusTitle.textContent = 'Needs Improvement';
      statusDesc.textContent = 'Additional practice recommended before next attempt';
      scoreStatus.style.background = 'var(--danger-light)';
      scoreStatus.style.borderLeftColor = 'var(--danger)';
    }
  }
  
  // Update timing indicator
  const timingIndicator = document.querySelector('.timing-indicator');
  if (timingIndicator) {
    const avgTime = results.avgResponseTime;
    if (avgTime >= 30 && avgTime <= 120) {
      timingIndicator.innerHTML = '<i class="fas fa-check-circle"></i><span>Optimal</span>';
      timingIndicator.style.color = 'var(--success)';
    } else if (avgTime < 30) {
      timingIndicator.innerHTML = '<i class="fas fa-clock"></i><span>Too Fast</span>';
      timingIndicator.style.color = 'var(--warning)';
    } else {
      timingIndicator.innerHTML = '<i class="fas fa-hourglass-half"></i><span>Too Slow</span>';
      timingIndicator.style.color = 'var(--warning)';
    }
  }
  
  // Update feedback sections
  if (results.feedback) {
    // Strengths
    const strengthsEl = document.getElementById('strengthsFeedback');
    if (strengthsEl && results.feedback.strengths) {
      strengthsEl.innerHTML = '<ul>' + 
        results.feedback.strengths.map(strength => `<li>${strength}</li>`).join('') + 
        '</ul>';
    }
    
    // Improvements
    const improvementsEl = document.getElementById('improvementsFeedback');
    if (improvementsEl && results.feedback.improvements) {
      improvementsEl.innerHTML = '<ul>' + 
        results.feedback.improvements.map(improvement => `<li>${improvement}</li>`).join('') + 
        '</ul>';
    }
    
    // Recommendations
    const recommendationsEl = document.getElementById('recommendationsFeedback');
    if (recommendationsEl && results.feedback.recommendations) {
      recommendationsEl.innerHTML = '<ul>' + 
        results.feedback.recommendations.map(rec => `<li>${rec}</li>`).join('') + 
        '</ul>';
    }
  }
  
  // Add pass/fail indicator to main score
  const scoreEl = document.getElementById('finalScore');
  if (scoreEl) {
    // Remove old indicator if exists
    const oldIndicator = document.getElementById('passFailIndicator');
    if (oldIndicator) oldIndicator.remove();
    
    const indicator = document.createElement('div');
    indicator.id = 'passFailIndicator';
    indicator.style.cssText = `
      position: absolute;
      top: -10px;
      right: -10px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: bold;
      background: ${passed ? 'var(--success)' : 'var(--danger)'};
      color: white;
      border: 3px solid var(--bg-card);
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    indicator.innerHTML = passed ? '✓' : '✗';
    indicator.title = passed ? `Passed (≥${qualifyingMark}%)` : `Failed (<${qualifyingMark}%)`;
    
    scoreEl.parentElement.style.position = 'relative';
    scoreEl.parentElement.appendChild(indicator);
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
