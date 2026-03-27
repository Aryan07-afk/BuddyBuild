/* ============================================================
   BUDDYBUILD — Auth Page Logic
   ============================================================ */

function switchPanel(panel) {
  document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`${panel}-panel`).classList.add('active');
  // update nav
  document.getElementById('nav-login').classList.toggle('active', panel === 'login');
  document.getElementById('nav-register').classList.toggle('active', panel === 'register');
}

// Nav link clicks
document.getElementById('nav-login').addEventListener('click', (e) => {
  e.preventDefault();
  switchPanel('login');
});
document.getElementById('nav-register').addEventListener('click', (e) => {
  e.preventDefault();
  switchPanel('register');
});

function goToDashboard(e) {
  e.preventDefault();
  
  // Save role for dynamic dashboard testing
  const roleSelect = document.getElementById('login-role') || document.getElementById('register-role');
  if (roleSelect && roleSelect.value) {
    localStorage.setItem('bb_user_role', roleSelect.value);
  } else {
    localStorage.setItem('bb_user_role', 'solo');
  }

  // Animate the button
  const btn = e.currentTarget;
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 600);
}

// Animate blobs with mouse parallax
document.addEventListener('mousemove', (e) => {
  const { clientX: x, clientY: y } = e;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = (x - cx) / cx;
  const dy = (y - cy) / cy;

  const b1 = document.querySelector('.b1');
  const b2 = document.querySelector('.b2');
  const b3 = document.querySelector('.b3');
  if (b1) b1.style.transform = `translate(${dx*25}px, ${dy*20}px)`;
  if (b2) b2.style.transform = `translate(${-dx*20}px, ${-dy*25}px)`;
  if (b3) b3.style.transform = `translate(${dx*15}px, ${-dy*15}px)`;
});

// Entrance animations
document.addEventListener('DOMContentLoaded', () => {
  const hero = document.querySelector('.hero-section');
  const card = document.querySelector('.auth-card');
  if (hero) {
    hero.style.opacity = '0';
    hero.style.transform = 'translateY(20px)';
    setTimeout(() => {
      hero.style.transition = 'all 0.6s ease';
      hero.style.opacity = '1';
      hero.style.transform = 'none';
    }, 100);
  }
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    setTimeout(() => {
      card.style.transition = 'all 0.6s ease 0.15s';
      card.style.opacity = '1';
      card.style.transform = 'none';
    }, 100);
  }
});
