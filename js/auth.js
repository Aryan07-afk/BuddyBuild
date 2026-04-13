/* ============================================================
   BUDDYBUILD — Auth Page Logic (Dynamic)
   ============================================================ */

const API_BASE_URL = 'http://localhost:8080/api/auth';

// ── General Utilities ──

function switchPanel(panelId) {
  document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
}

function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// ── Validation ──

function validateEmail(email) {
  const re = /^[a-z0-9._%+-]+@(?:google|yahoo|outlook|icloud|university|gmail)\.[a-z]{2,}$/i;
  return re.test(String(email).toLowerCase());
}

// ── AUTH ACTIONS ──

// 1. LOGIN
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    if (!validateEmail(email)) {
      showToast('Please enter a valid email address (e.g. @google.com, @yahoo.com)', 'error');
      return;
    }

    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.innerHTML = 'Signing in...';

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('bb_token', data.data.token);
        localStorage.setItem('bb_user', JSON.stringify(data.data));
        localStorage.setItem('bb_user_role', data.data.role.toLowerCase());
        showToast('Login successful!', 'success');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
      } else {
        showToast('Wrong credentials. Please try again or register.', 'error');
        document.getElementById('login-pass').value = '';
      }
    } catch (error) {
      showToast('Connection error. Is the backend running?', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Sign In <span class="btn-arrow">→</span>';
    }
  });
}

// 2. REGISTER
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('reg-fullname').value;
    const email = document.getElementById('reg-email').value;
    const role = document.getElementById('reg-role').value;
    const semester = document.getElementById('reg-semester').value;
    const section = document.getElementById('reg-section').value;
    const password = document.getElementById('reg-pass').value;

    if (!validateEmail(email)) {
      showToast('Invalid email provider. Please use Google, Yahoo, etc.', 'error');
      return;
    }

    const btn = document.getElementById('btn-register');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, role, semester, section, password })
      });

      const data = await response.json();
      if (response.ok) {
        document.getElementById('verify-email-display').textContent = email;
        switchPanel('verify-panel');
        showToast('Code sent to your email!', 'info');
      } else {
        showToast(data.message || 'Registration failed', 'error');
      }
    } catch (error) {
      showToast('Error connecting to server', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Create Account <span class="btn-arrow">→</span>';
    }
  });
}

// 3. VERIFY OTP
const verifyForm = document.getElementById('verify-form');
if (verifyForm) {
  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const otp = document.getElementById('reg-otp').value;

    const btn = document.getElementById('btn-verify');
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp?email=${email}&otp=${otp}`, {
        method: 'POST'
      });

      const data = await response.json();
      if (response.ok) {
        showToast('Verification successful! You can now login.', 'success');
        setTimeout(() => window.location.href = 'login.html', 1500);
      } else {
        showToast(data.message || 'Invalid OTP', 'error');
      }
    } catch (error) {
      showToast('Error verifying OTP', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Verify & Create Profile <span class="btn-arrow">→</span>';
    }
  });
}

// 4. FORGOT PASSWORD
const forgotForm = document.getElementById('forgot-form');
if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;

    const btn = document.getElementById('btn-forgot');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password?email=${email}`, {
        method: 'POST'
      });

      if (response.ok) {
        document.getElementById('sent-email-display').textContent = email;
        switchPanel('success-panel');
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to send reset link', 'error');
      }
    } catch (error) {
      showToast('Error connecting to server', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Send Reset Link <span class="btn-arrow">→</span>';
    }
  });
}

// 5. RESET PASSWORD
const resetForm = document.getElementById('reset-form');
if (resetForm) {
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getUrlParam('token');
    const password = document.getElementById('reset-pass').value;
    const confirm = document.getElementById('reset-confirm').value;

    if (password !== confirm) {
      showToast('Passwords do not match', 'error');
      return;
    }

    const btn = document.getElementById('btn-reset');
    btn.disabled = true;
    btn.textContent = 'Updating password...';

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password?token=${token}&newPassword=${password}`, {
        method: 'POST'
      });

      if (response.ok) {
        switchPanel('reset-success-panel');
      } else {
        const data = await response.json();
        showToast(data.message || 'Reset failed', 'error');
      }
    } catch (error) {
      showToast('Error resetting password', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Reset Password <span class="btn-arrow">→</span>';
    }
  });
}

// ── Visual Animations ──

document.addEventListener('mousemove', (e) => {
  const { clientX: x, clientY: y } = e;
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = (x - cx) / cx;
  const dy = (y - cy) / cy;

  const bg = document.querySelector('.auth-bg');
  if (bg) {
    const b1 = bg.querySelector('.b1');
    const b2 = bg.querySelector('.b2');
    const b3 = bg.querySelector('.b3');
    if (b1) b1.style.transform = `translate(${dx*25}px, ${dy*20}px)`;
    if (b2) b2.style.transform = `translate(${-dx*20}px, ${-dy*25}px)`;
    if (b3) b3.style.transform = `translate(${dx*15}px, ${-dy*15}px)`;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const card = document.querySelector('.auth-card');
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    setTimeout(() => {
      card.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      card.style.opacity = '1';
      card.style.transform = 'none';
    }, 100);
  }
});
