// ===== NEXTSTEP AI – CERTIFICATE JAVASCRIPT =====

// Get certificate data from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const certificateId = urlParams.get('id');

// Load certificate data
document.addEventListener('DOMContentLoaded', async function() {
  if (certificateId) {
    await loadCertificateData(certificateId);
  } else {
    // Use demo data if no ID provided
    loadDemoData();
  }

  setupEventListeners();
});

// Load certificate data from API
async function loadCertificateData(id) {
  try {
    const response = await fetch(`${API_URL}/certificates/${id}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        populateCertificate(data.data);
      }
    } else {
      showToast('Certificate not found', 'error');
      loadDemoData();
    }
  } catch (error) {
    console.error('Error loading certificate:', error);
    showToast('Error loading certificate', 'error');
    loadDemoData();
  }
}

// Load demo data
function loadDemoData() {
  const demoData = {
    user: { name: 'John Doe' },
    course: { title: 'Python Programming Masterclass', category: 'Programming' },
    issuedAt: new Date().toISOString(),
    certificateId: 'CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  };
  populateCertificate(demoData);
}

// Populate certificate with data
function populateCertificate(data) {
  // Student name
  const studentName = document.getElementById('studentName');
  if (studentName) {
    studentName.textContent = data.user?.name || 'Student Name';
  }

  // Course name
  const courseName = document.getElementById('courseName');
  if (courseName) {
    courseName.textContent = data.course?.title || 'Course Name';
  }

  // Course category
  const courseCategory = document.getElementById('courseCategory');
  if (courseCategory) {
    courseCategory.textContent = data.course?.category || 'General';
  }

  // Completion date
  const completionDate = document.getElementById('completionDate');
  if (completionDate) {
    const date = new Date(data.issuedAt || data.completionDate || Date.now());
    completionDate.textContent = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Certificate ID
  const certId = document.getElementById('certificateId');
  if (certId) {
    certId.textContent = data.certificateId || 'CERT-000000';
  }

  // Update page title
  document.title = `Certificate – ${data.user?.name || 'Student'} | NextStep AI`;
}

// Setup event listeners
function setupEventListeners() {
  // Download PDF button
  const downloadBtn = document.getElementById('downloadPdfBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadPDF);
  }

  // Share button
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', shareCertificate);
  }
}

// Download certificate as PDF
async function downloadPDF() {
  const certificate = document.getElementById('certificate');
  const downloadBtn = document.getElementById('downloadPdfBtn');

  const originalText = downloadBtn.innerHTML;
  downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
  downloadBtn.disabled = true;

  try {
    // Get the full scroll width/height of the certificate element
    const certW = certificate.scrollWidth;
    const certH = certificate.scrollHeight;

    // Convert px to mm at 96dpi
    const pxToMm = px => (px * 25.4) / 96;
    const mmW = pxToMm(certW);
    const mmH = pxToMm(certH);

    const opt = {
      margin:   0,
      filename: `NextStep-AI-Certificate-${Date.now()}.pdf`,
      image:    { type: 'jpeg', quality: 1.0 },
      html2canvas: {
        scale:           2,
        useCORS:         true,
        logging:         false,
        scrollX:         0,
        scrollY:         0,
        width:           certW,
        height:          certH,
        windowWidth:     document.documentElement.scrollWidth,
        windowHeight:    document.documentElement.scrollHeight
      },
      jsPDF: {
        unit:        'mm',
        format:      [mmW, mmH],
        orientation: mmW > mmH ? 'landscape' : 'portrait',
        compress:    true
      },
      pagebreak: { mode: 'avoid-all' }
    };

    await html2pdf().set(opt).from(certificate).save();
    showToast('Certificate downloaded successfully!', 'success');
  } catch (error) {
    console.error('Error generating PDF:', error);
    showToast('Error generating PDF. Please try again.', 'error');
  } finally {
    downloadBtn.innerHTML = originalText;
    downloadBtn.disabled = false;
  }
}

// Share certificate
function shareCertificate() {
  const url = window.location.href;
  const text = 'Check out my certificate from NextStep AI!';

  if (navigator.share) {
    // Use Web Share API if available
    navigator.share({
      title: 'NextStep AI Certificate',
      text: text,
      url: url
    }).then(() => {
      showToast('Certificate shared successfully!', 'success');
    }).catch((error) => {
      console.error('Error sharing:', error);
      copyToClipboard(url);
    });
  } else {
    // Fallback: copy to clipboard
    copyToClipboard(url);
  }
}

// Copy to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Certificate link copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  } else {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Certificate link copied to clipboard!', 'success');
    } catch (error) {
      showToast('Failed to copy link', 'error');
    }
    document.body.removeChild(textarea);
  }
}

// Toast notification
function showToast(msg, type='success'){
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  const icons = { 
    success:'fa-check-circle', 
    error:'fa-times-circle', 
    warning:'fa-exclamation-triangle',
    info:'fa-info-circle'
  };
  toast.innerHTML = `
    <i class="fas ${icons[type]||'fa-info-circle'}" 
       style="color:var(--${type==='success'?'success':type==='error'?'danger':type==='warning'?'warning':'info'})">
    </i>
    <span>${msg}</span>
    <span class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </span>
  `;
  container.appendChild(toast);
  setTimeout(()=>toast.remove(), 4000);
}
