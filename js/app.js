/* ============================================================
   BUDDYBUILD — Shared App Utilities
   ============================================================ */

const API_BASE = 'http://localhost:8080/api';
const PUBLIC_PATHS = ['login.html', 'register.html', 'index.html', 'forgot-password.html', 'reset-password.html'];
const ROLE_LABELS = {
  student: 'Student',
  leader: 'Team Lead',
  admin: 'Admin'
};

function normalizeRole(role) {
  return (role || 'student').toString().toLowerCase();
}

/**
 * Shared API Fetch wrapper with Auth headers
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('bb_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.clear();
    window.location.href = 'login.html';
    return;
  }
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
}

function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

function bindLogoutLinks() {
  document.querySelectorAll('a.logout').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      logout();
    });
  });
}

/* ── Toast Notification ── */
function showToast(message, type = 'info', duration = 3000) {
  let toast = document.getElementById('bb-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bb-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type}`;
  // Force reflow
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ── Sidebar toggle (mobile) ── */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('active');
}
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}

/* ── Modal helpers ── */
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}
function closeModalById(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}
function closeModal(event) {
  if (event.target === event.currentTarget) {
    event.currentTarget.classList.remove('open');
  }
}

/* ── Password toggle ── */
function togglePass(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
}

/* ── Close on ESC ── */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    closeSidebar();
  }
});

/* ── Shared session bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
  bindLogoutLinks();

  // 1. Fetch current user data and update sidebar globally
  const token = localStorage.getItem('bb_token');
  if (token && !PUBLIC_PATHS.some(p => window.location.pathname.endsWith(p))) {
    apiFetch('/users/me').then(res => {
      const user = res.data;
      const rKey = normalizeRole(user.role);
      
      // Store essential info for other JS files
      localStorage.setItem('bb_user_id', user.id);
      localStorage.setItem('bb_user_role', rKey);
      if (user.teamId) {
        localStorage.setItem('bb_team_id', user.teamId);
      } else {
        localStorage.removeItem('bb_team_id');
      }

      document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = user.fullName;
      });
      document.querySelectorAll('.user-role').forEach(el => {
        el.textContent = ROLE_LABELS[rKey] || rKey;
      });

      // Populate avatars with initials or saved profile picture
      const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      document.querySelectorAll('.user-avatar, #global-avatar-sidebar, #global-avatar-header, #global-avatar').forEach(el => {
        if (user.profilePicture) {
          el.style.background = `url(${user.profilePicture}) center/cover`;
          el.textContent = '';
        } else {
          el.style.background = '';
          el.textContent = initials;
        }
      });
      
      const phBadge = document.querySelector('.ph-badge');
      if (phBadge) {
        phBadge.className = `ph-badge role-${rKey}`;
        phBadge.textContent = ROLE_LABELS[rKey] || rKey;
      }

      // Populate request badge if exists
      const sidebarBadge = document.querySelector('.nav-badge');
      if (sidebarBadge && window.location.pathname.includes('requests')) {
        // This will be handled in requests.js, but let's hide it if not on requests page
      }
    }).catch(err => {
      console.error("Global auth fetch failed:", err);
      // If we are on an auth-required page, redirect to login
      if (!PUBLIC_PATHS.some(p => window.location.pathname.endsWith(p))) {
        localStorage.clear();
        window.location.href = 'login.html';
      }
    });
  }

  // 2. Adjust visibility of links/buttons based on user role
  const role = normalizeRole(localStorage.getItem('bb_user_role'));
  const createTeamLink = document.querySelector('a[href="my-team.html#create"]');
  if (createTeamLink && role === 'leader') {
    createTeamLink.style.display = 'none';
  }

  // --- MY TEAM SPECIFIC LOGIC ---
  if (window.location.pathname.includes('my-team.html')) {
    if (role !== 'leader') {
      // Hide administrative buttons
      const editTeamBtn = document.getElementById('btn-edit-team');
      const markCompleteBtn = document.getElementById('btn-mark-complete');
      const pendingReqCard = document.getElementById('pending-requests-card');
      const editLinksBtn = document.getElementById('btn-edit-links');
      const addLinkBtn = document.getElementById('btn-add-link');
      const addTaskBtn = document.getElementById('btn-add-task');
      
      if (editTeamBtn) editTeamBtn.style.display = 'none';
      if (markCompleteBtn) markCompleteBtn.style.display = 'none';
      if (editLinksBtn) editLinksBtn.style.display = 'none';
      if (addLinkBtn) addLinkBtn.style.display = 'none';
      if (addTaskBtn) addTaskBtn.style.display = 'none';

      // Hide all 'kick' buttons on individual members
      document.querySelectorAll('.btn-kick').forEach(btn => {
        btn.style.display = 'none';
      });
      // Hide the '+ Invite Member' button
      const inviteBtn = document.querySelector('.section-card .btn-outline[onclick="window.location=\'discovery.html\'"]');
      if (inviteBtn) inviteBtn.style.display = 'none';
      if (pendingReqCard) pendingReqCard.style.display = 'none';
    }
  }
});
