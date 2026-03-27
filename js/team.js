/* ============================================================
   BUDDYBUILD — Team Page Logic
   ============================================================ */

// State: toggle between no-team and team-dashboard for demo
let hasTeam = false;

document.addEventListener('DOMContentLoaded', () => {
  // Check hash to see if came from "Create Team" shortcut
  if (window.location.hash === '#create') {
    openCreateTeam();
  }
  // Default: show no-team state for fresh load
  setTeamState(hasTeam);
});

function setTeamState(inTeam) {
  hasTeam = inTeam;
  document.getElementById('no-team-state').style.display  = inTeam ? 'none'  : 'flex';
  document.getElementById('team-dashboard').style.display = inTeam ? 'block' : 'none';
}

/* ── Create Team Modal ── */
function openCreateTeam() {
  document.getElementById('create-team-modal').classList.add('open');
}
function closeCreateTeamDirect() {
  document.getElementById('create-team-modal').classList.remove('open');
}
function closeCreateTeam(event) {
  if (event.target === event.currentTarget) event.currentTarget.classList.remove('open');
}

function createTeam() {
  const name    = document.getElementById('ct-name').value.trim();
  const project = document.getElementById('ct-project').value.trim();
  const desc    = document.getElementById('ct-desc').value.trim();
  const status  = document.getElementById('ct-status').value;

  if (!name) { showToast('Enter a team name', 'error'); return; }
  if (!project) { showToast('Enter a project title', 'error'); return; }

  // Update team display
  document.getElementById('team-name').textContent = name;
  document.getElementById('pd-title').textContent  = project;
  if (desc) document.getElementById('team-desc').textContent = desc;

  const statusBadge = document.getElementById('team-status-badge');
  statusBadge.textContent = status === 'open' ? 'Open' : 'Closed';
  statusBadge.className = `th-badge ${status}`;

  closeCreateTeamDirect();
  setTeamState(true);
  showToast(`Team "${name}" created!`, 'success');
}

/* ── Remove Member ── */
let pendingRemoveId = null;

function removeMember(memberId, memberName) {
  pendingRemoveId = memberId;
  document.getElementById('confirm-title').textContent = `Remove ${memberName}?`;
  document.getElementById('confirm-msg').textContent =
    `Are you sure you want to remove ${memberName} from the team?`;
  document.getElementById('confirm-action-btn').onclick = () => confirmRemove(memberId, memberName);
  document.getElementById('confirm-modal').classList.add('open');
}

function confirmRemove(id, name) {
  const card = document.getElementById(id);
  if (card) {
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.95)';
    setTimeout(() => card.remove(), 300);
  }
  closeConfirmDirect();
  showToast(`${name} removed from team`, 'info');
  // Update member count
  const grid = document.getElementById('members-grid');
  const count = grid ? grid.querySelectorAll('.member-card').length - 1 : 0;
  document.getElementById('member-count').textContent = `${Math.max(count, 1)} Members`;
}

function closeConfirmDirect() {
  document.getElementById('confirm-modal').classList.remove('open');
}
function closeConfirm(event) {
  if (event.target === event.currentTarget) event.currentTarget.classList.remove('open');
}

/* ── Accept/Reject Pending ── */
function acceptPending(itemId, name) {
  const item = document.getElementById(itemId);
  if (!item) return;
  item.style.transition = 'all 0.3s';
  item.style.opacity = '0';
  setTimeout(() => {
    item.remove();
    // Add to members grid
    const grid = document.getElementById('members-grid');
    const colors = ['#f59e0b','#10b981','#8b5cf6','#3b82f6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const initials = name.split(' ').map(w => w[0]).join('');
    const newCard = document.createElement('div');
    newCard.className = 'member-card';
    newCard.style.opacity = '0';
    newCard.innerHTML = `
      <div class="mc-avatar" style="background:${color}">${initials}</div>
      <div class="mc-body">
        <div class="mc-name">${name}</div>
        <div class="mc-meta">New Member</div>
      </div>
      <div class="mc-actions">
        <button class="btn-rate" onclick="window.location='ratings.html'">Rate</button>
      </div>
    `;
    grid.appendChild(newCard);
    setTimeout(() => { newCard.style.transition = 'opacity 0.3s'; newCard.style.opacity = '1'; }, 10);
    showToast(`✓ ${name} added to team!`, 'success');
  }, 300);
}

function rejectPending(itemId) {
  const item = document.getElementById(itemId);
  if (!item) return;
  item.style.transition = 'all 0.3s';
  item.style.opacity = '0';
  setTimeout(() => { item.remove(); showToast('Request declined', 'error'); }, 300);
}

/* ── Edit Team ── */
function openEditTeam() {
  // Prefill create modal with existing values
  document.getElementById('ct-name').value = document.getElementById('team-name').textContent;
  document.getElementById('ct-project').value = document.getElementById('pd-title').textContent;
  document.getElementById('ct-desc').value = document.getElementById('team-desc').textContent;
  openCreateTeam();
}

/* ── Complete Project ── */
function confirmCompleteProject() {
  document.getElementById('confirm-title').textContent = 'Mark Project Complete?';
  document.getElementById('confirm-msg').textContent =
    'This will archive the project and prompt you to rate your teammates.';
  document.getElementById('confirm-action-btn').textContent = 'Complete Project';
  document.getElementById('confirm-action-btn').onclick = completeProject;
  document.getElementById('confirm-modal').classList.add('open');
}

function completeProject() {
  closeConfirmDirect();
  showToast('Project marked complete! Rate your teammates.', 'success');
  setTimeout(() => window.location.href = 'ratings.html', 1500);
}
