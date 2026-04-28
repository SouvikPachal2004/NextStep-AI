// ===== NEXTSTEP AI – MAIN JAVASCRIPT =====

// Page Loader
window.addEventListener('load', function(){
  setTimeout(()=>{
    document.getElementById('pageLoader').classList.add('hidden');
  }, 1800);
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('nextstep-theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

themeToggle.addEventListener('click', function(){
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('nextstep-theme', next);
  updateThemeIcon(next);
});

function updateThemeIcon(theme){
  const icon = themeToggle.querySelector('i');
  icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Navbar Scroll Effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', function(){
  if(window.scrollY > 50){
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile Menu Toggle
const navbarToggle = document.getElementById('navbarToggle');
const navbarMenu = document.getElementById('navbarMenu');
navbarToggle.addEventListener('click', function(){
  navbarMenu.classList.toggle('active');
  const icon = this.querySelector('i');
  icon.className = navbarMenu.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
});

// Close mobile menu when clicking a link
document.querySelectorAll('.navbar-link').forEach(link => {
  link.addEventListener('click', function(){
    navbarMenu.classList.remove('active');
    navbarToggle.querySelector('i').className = 'fas fa-bars';
  });
});

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e){
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if(target){
      const offsetTop = target.offsetTop - 80;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  });
});

// Active Nav Link on Scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.navbar-link');

window.addEventListener('scroll', function(){
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    const sectionHeight = section.clientHeight;
    if(window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight){
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if(link.getAttribute('href') === '#' + current){
      link.classList.add('active');
    }
  });
});

// Scroll to Top Button
const scrollTop = document.getElementById('scrollTop');
window.addEventListener('scroll', function(){
  if(window.scrollY > 300){
    scrollTop.classList.add('visible');
  } else {
    scrollTop.classList.remove('visible');
  }
});

scrollTop.addEventListener('click', function(){
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Hero Particles Animation
const heroParticles = document.getElementById('heroParticles');
if(heroParticles){
  for(let i = 0; i < 30; i++){
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
    particle.style.animationDelay = Math.random() * 5 + 's';
    heroParticles.appendChild(particle);
  }
}

// Toast Notification Helper
function showToast(msg, type='success'){
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  const icons = { success:'fa-check-circle', error:'fa-times-circle', warning:'fa-exclamation-triangle' };
  toast.innerHTML = `<i class="fas ${icons[type]||'fa-info-circle'}" style="color:var(--${type==='success'?'success':type==='error'?'danger':'warning'})"></i><span>${msg}</span><span class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></span>`;
  container.appendChild(toast);
  setTimeout(()=>toast.remove(), 4000);
}

// Intersection Observer for Animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries){
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.feature-card, .step-card, .course-card, .testimonial-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});
