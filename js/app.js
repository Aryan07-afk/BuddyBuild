/* ============================================================
   BUDDYBUILD — Shared App Utilities
   ============================================================ */

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

/* ── Role Management (Mock) ── */
document.addEventListener('DOMContentLoaded', () => {
  const role = localStorage.getItem('bb_user_role') || 'solo';
  const roleDisplay = {
    'solo': 'Solo Student',
    'lead': 'Team Lead',
    'member': 'Team Member'
  };

  // 1. Update text that displays the role globally
  document.querySelectorAll('.user-role').forEach(el => {
    el.textContent = roleDisplay[role];
  });
  
  const phBadge = document.querySelector('.ph-badge');
  if (phBadge) {
    phBadge.className = `ph-badge role-${role}`;
    phBadge.textContent = roleDisplay[role];
  }

  // 2. Adjust visibility of links/buttons based on user role
  const createTeamLink = document.querySelector('a[href="my-team.html#create"]');
  if (createTeamLink && role === 'member') {
    createTeamLink.style.display = 'none';
  }

  // --- MY TEAM SPECIFIC LOGIC ---
  if (window.location.pathname.includes('my-team.html')) {
    if (role === 'member') {
      // Hide administrative buttons
      const editTeamBtn = document.getElementById('btn-edit-team');
      const markCompleteBtn = document.getElementById('btn-mark-complete');
      const pendingReqCard = document.getElementById('pending-requests-card');
      const editLinksBtn = document.getElementById('btn-edit-links');
      const addLinkBtn = document.getElementById('btn-add-link');
      const addTaskBtn = document.getElementById('btn-add-task');
      
      if (editTeamBtn) editTeamBtn.style.display = 'none';
      if (markCompleteBtn) markCompleteBtn.style.display = 'none';
      if (pendingReqCard) pendingReqCard.style.display = 'none';
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
    }
  }
});
