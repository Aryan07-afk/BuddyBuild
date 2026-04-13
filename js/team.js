let currentTeam = null;
let teamLinks = [];
let teamTasks = [];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-add-task')?.addEventListener('click', openAddTaskPrompt);
  document.getElementById('btn-edit-links')?.addEventListener('click', openAddLinkPrompt);
  document.getElementById('btn-add-link')?.addEventListener('click', openAddLinkPrompt);

  if (window.location.hash === '#create') {
    openCreateTeam();
  }

  fetchTeamData();
});

async function fetchTeamData() {
  const teamId = localStorage.getItem('bb_team_id');
  if (!teamId) {
    setTeamState(false);
    return;
  }

  try {
    const res = await apiFetch(`/teams/${teamId}`);
    currentTeam = res.data;
    setTeamState(true);
    renderTeamDashboard(currentTeam);
    await Promise.all([fetchPendingRequests(teamId), fetchLinks(teamId), fetchTasks(teamId)]);
  } catch (error) {
    console.error('Failed to fetch team:', error);
    setTeamState(false);
  }
}

async function fetchPendingRequests(teamId) {
  const myId = localStorage.getItem('bb_user_id');
  const card = document.getElementById('pending-requests-card');
  if (!currentTeam || String(currentTeam.leaderId) !== String(myId)) {
    if (card) card.style.display = 'none';
    return;
  }

  try {
    const res = await apiFetch(`/requests/team/${teamId}`);
    renderPendingRequests(res.data || []);
  } catch (error) {
    console.error('Failed to fetch requests:', error);
  }
}

async function fetchLinks(teamId) {
  try {
    const res = await apiFetch(`/teams/${teamId}/links`);
    teamLinks = res.data || [];
    renderLinks();
  } catch (error) {
    console.error('Failed to fetch links:', error);
  }
}

async function fetchTasks(teamId) {
  try {
    const res = await apiFetch(`/teams/${teamId}/tasks`);
    teamTasks = res.data || [];
    renderTasks();
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
  }
}

function setTeamState(inTeam) {
  document.getElementById('no-team-state').style.display = inTeam ? 'none' : 'flex';
  document.getElementById('team-dashboard').style.display = inTeam ? 'block' : 'none';
  const topCreateButton = document.getElementById('top-create-team-btn');
  if (topCreateButton) topCreateButton.style.display = inTeam ? 'none' : '';
}

function renderTeamDashboard(team) {
  const myId = localStorage.getItem('bb_user_id');
  const isLeader = String(team.leaderId) === String(myId);

  document.getElementById('team-name').textContent = team.name;
  document.getElementById('pd-title').textContent = team.techStack || 'Project';
  document.getElementById('team-desc').textContent = team.description || 'No description provided.';
  document.getElementById('pd-status').textContent = team.status;
  document.getElementById('pd-sem').textContent = '--';
  document.getElementById('pd-team-size').textContent = `${team.currentMembers} / ${team.maxMembers}`;

  const statusBadge = document.getElementById('team-status-badge');
  statusBadge.textContent = team.open ? 'Open' : 'Closed';
  statusBadge.className = `th-badge ${team.open ? 'open' : 'closed'}`;

  document.getElementById('member-count').textContent = `${team.currentMembers}/${team.maxMembers} Members`;

  const grid = document.getElementById('members-grid');
  grid.innerHTML = team.members.map((member) => {
    const colors = ['#f59e0b', '#10b981', '#8b5cf6', '#3b82f6'];
    const color = colors[member.id % colors.length];
    const initials = member.fullName.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2);
    const isMe = String(member.id) === String(myId);
    const isLeaderMember = String(member.id) === String(team.leaderId);

    return `
      <div class="member-card" id="member-${member.id}">
        <div class="mc-avatar" style="background:${color}">${initials}</div>
        <div class="mc-body">
          <div class="mc-name">${member.fullName} ${isMe ? '(You)' : ''}</div>
          <div class="mc-meta">${isLeaderMember ? 'Team Leader' : 'Team Member'}</div>
        </div>
        <div class="mc-actions">
          ${isLeader && !isLeaderMember ? `<button class="btn-kick" onclick="removeMember(${member.id}, '${member.fullName.replace(/'/g, "\\'")}')">Kick</button>` : ''}
          <button class="btn-rate" onclick="window.location='ratings.html'">Rate</button>
        </div>
      </div>
    `;
  }).join('');

  if (isLeader && team.currentMembers < team.maxMembers) {
    const inviteSlot = document.createElement('div');
    inviteSlot.className = 'member-card invite-slot';
    inviteSlot.style.border = '2px dashed var(--surface-3)';
    inviteSlot.style.justifyContent = 'center';
    inviteSlot.style.cursor = 'pointer';
    inviteSlot.onclick = () => { window.location.href = 'discovery.html'; };
    inviteSlot.innerHTML = `<div style="color:var(--text-3)">Browse Discovery</div>`;
    grid.appendChild(inviteSlot);
  }

  document.getElementById('btn-edit-team').style.display = isLeader ? '' : 'none';
  document.getElementById('btn-mark-complete').style.display = isLeader ? '' : 'none';
}

function renderPendingRequests(requests) {
  const list = document.getElementById('pending-requests-list');
  const card = document.getElementById('pending-requests-card');
  if (!requests.length) {
    card.style.display = 'none';
    list.innerHTML = '';
    return;
  }

  card.style.display = 'block';
  list.innerHTML = requests.map((request) => `
    <div class="pending-item" id="req-${request.id}">
      <div class="pi-info">
        <div class="pi-name">${request.senderName}</div>
        <div class="pi-meta">Wants to join · ${new Date(request.createdAt).toLocaleDateString()}</div>
      </div>
      <div class="pi-actions">
        <button class="btn-accept" onclick="acceptPending(${request.id}, '${request.senderName.replace(/'/g, "\\'")}')">Accept</button>
        <button class="btn-reject" onclick="rejectPending(${request.id})">Reject</button>
      </div>
    </div>
  `).join('');
}

function renderLinks() {
  const container = document.getElementById('workspace-links');
  if (!container) return;
  const isLeader = String(currentTeam?.leaderId) === String(localStorage.getItem('bb_user_id'));

  container.innerHTML = teamLinks.map((link) => `
    <div style="padding:1rem;border:1px solid var(--border);border-radius:12px;background:var(--surface-2);display:flex;flex-direction:column;gap:0.5rem;min-height:70px;">
      <strong>${link.label}</strong>
      <a href="${link.url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent);font-size:0.85rem;word-break:break-all;">${link.url}</a>
      <span style="font-size:0.75rem;color:var(--text-3);">${link.type || 'Link'}</span>
      ${isLeader ? `<button class="btn-kick" onclick="deleteLink(${link.id})">Delete</button>` : ''}
    </div>
  `).join('');

  if (isLeader) {
    container.insertAdjacentHTML('beforeend', `
      <button id="btn-add-link" onclick="openAddLinkPrompt()" style="display:flex; align-items:center; gap:0.5rem; padding:1rem; border:1px dashed var(--border); border-radius:12px; background:transparent; cursor:pointer; color:var(--text-muted); justify-content:center; transition:0.2s; min-height:70px;">
        <span style="font-size:1rem;">+ Add Link</span>
      </button>
    `);
  } else if (!teamLinks.length) {
    container.innerHTML = '<div style="color:var(--text-3);padding:0.5rem 0;">No workspace links yet.</div>';
  }
}

function renderTasks() {
  const board = document.getElementById('kanban-board');
  if (!board) return;
  const columns = [
    { key: 'TODO', label: 'To Do' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'DONE', label: 'Done' }
  ];
  const isLeader = String(currentTeam?.leaderId) === String(localStorage.getItem('bb_user_id'));

  board.innerHTML = columns.map((column) => `
    <div style="min-width:240px;background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:1rem;">
      <h4 style="margin-bottom:0.75rem;">${column.label}</h4>
      <div style="display:flex;flex-direction:column;gap:0.75rem;">
        ${teamTasks.filter((task) => task.status === column.key).map((task) => `
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:0.85rem;">
            <strong style="display:block;margin-bottom:0.35rem;">${task.title}</strong>
            <div style="font-size:0.82rem;color:var(--text-2);margin-bottom:0.35rem;">${task.description || 'No description provided.'}</div>
            <div style="font-size:0.75rem;color:var(--text-3);margin-bottom:0.5rem;">${task.assigneeName || 'Unassigned'}</div>
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
              <button class="btn-rate" onclick="advanceTask(${task.id}, '${column.key}')">Move</button>
              ${isLeader ? `<button class="btn-kick" onclick="deleteTask(${task.id})">Delete</button>` : ''}
            </div>
          </div>
        `).join('') || '<div style="color:var(--text-3);font-size:0.82rem;">No tasks</div>'}
      </div>
    </div>
  `).join('');
}

function openCreateTeam(editMode = false) {
  const modal = document.getElementById('create-team-modal');
  modal.dataset.mode = editMode ? 'edit' : 'create';
  modal.classList.add('open');
}

function closeCreateTeamDirect() {
  document.getElementById('create-team-modal').classList.remove('open');
}

function closeCreateTeam(event) {
  if (event.target === event.currentTarget) event.currentTarget.classList.remove('open');
}

async function createTeam() {
  const modal = document.getElementById('create-team-modal');
  const mode = modal.dataset.mode || 'create';
  const payload = {
    name: document.getElementById('ct-name').value.trim(),
    description: document.getElementById('ct-desc').value.trim(),
    techStack: document.getElementById('ct-project').value.trim(),
    maxMembers: parseInt(document.getElementById('ct-size').value || '4', 10)
  };

  if (!payload.name) {
    showToast('Enter a team name', 'error');
    return;
  }

  try {
    let res;
    if (mode === 'edit' && currentTeam) {
      res = await apiFetch(`/teams/${currentTeam.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...payload,
          open: document.getElementById('ct-status').value === 'open'
        })
      });
      showToast('Team updated!', 'success');
    } else {
      res = await apiFetch('/teams', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      localStorage.setItem('bb_team_id', res.data.id);
      localStorage.setItem('bb_user_role', 'leader');
      showToast(`Team "${payload.name}" created!`, 'success');
    }

    closeCreateTeamDirect();
    fetchTeamData();
  } catch (error) {
    showToast(error.message || 'Failed to save team', 'error');
  }
}

function openEditTeam() {
  if (!currentTeam) return;
  document.getElementById('ct-name').value = currentTeam.name || '';
  document.getElementById('ct-project').value = currentTeam.techStack || '';
  document.getElementById('ct-desc').value = currentTeam.description || '';
  document.getElementById('ct-size').value = currentTeam.maxMembers || 4;
  document.getElementById('ct-status').value = currentTeam.open ? 'open' : 'closed';
  openCreateTeam(true);
}

function removeMember(memberId, memberName) {
  document.getElementById('confirm-title').textContent = `Remove ${memberName}?`;
  document.getElementById('confirm-msg').textContent = `Are you sure you want to remove ${memberName} from the team?`;
  document.getElementById('confirm-action-btn').textContent = 'Remove';
  document.getElementById('confirm-action-btn').onclick = () => confirmRemove(memberId, memberName);
  document.getElementById('confirm-modal').classList.add('open');
}

async function confirmRemove(memberId, name) {
  try {
    await apiFetch(`/teams/${localStorage.getItem('bb_team_id')}/members/${memberId}`, { method: 'DELETE' });
    showToast(`${name} removed from team`, 'info');
    closeConfirmDirect();
    fetchTeamData();
  } catch (error) {
    showToast(error.message || 'Failed to remove member', 'error');
  }
}

function closeConfirmDirect() {
  document.getElementById('confirm-modal').classList.remove('open');
}

function closeConfirm(event) {
  if (event.target === event.currentTarget) event.currentTarget.classList.remove('open');
}

async function acceptPending(requestId, name) {
  try {
    await apiFetch(`/requests/${requestId}/accept`, { method: 'PATCH' });
    showToast(`${name} added to team!`, 'success');
    fetchTeamData();
  } catch (error) {
    showToast(error.message || 'Failed to accept request', 'error');
  }
}

async function rejectPending(requestId) {
  try {
    await apiFetch(`/requests/${requestId}/reject`, { method: 'PATCH' });
    showToast('Request declined', 'info');
    fetchTeamData();
  } catch (error) {
    showToast(error.message || 'Failed to reject request', 'error');
  }
}

function confirmCompleteProject() {
  document.getElementById('confirm-title').textContent = 'Mark Project Complete?';
  document.getElementById('confirm-msg').textContent = 'This will archive the project and prompt you to rate your teammates.';
  document.getElementById('confirm-action-btn').textContent = 'Complete Project';
  document.getElementById('confirm-action-btn').onclick = completeProject;
  document.getElementById('confirm-modal').classList.add('open');
}

async function completeProject() {
  try {
    await apiFetch(`/teams/${localStorage.getItem('bb_team_id')}/complete`, { method: 'PATCH' });
    closeConfirmDirect();
    showToast('Project marked complete! Rate your teammates.', 'success');
    setTimeout(() => { window.location.href = 'ratings.html'; }, 1200);
  } catch (error) {
    showToast(error.message || 'Failed to complete project', 'error');
  }
}

function openAddLinkPrompt() {
  if (!currentTeam) return;
  const label = window.prompt('Link label:', '');
  if (!label) return;
  const url = window.prompt('Link URL:', 'https://');
  if (!url) return;
  const type = window.prompt('Link type (Docs, Repo, Board, etc):', 'General');

  apiFetch(`/teams/${currentTeam.id}/links`, {
    method: 'POST',
    body: JSON.stringify({ label, url, type })
  }).then(() => {
    showToast('Workspace link added', 'success');
    fetchLinks(currentTeam.id);
  }).catch((error) => {
    showToast(error.message || 'Failed to add link', 'error');
  });
}

async function deleteLink(linkId) {
  try {
    await apiFetch(`/teams/${currentTeam.id}/links/${linkId}`, { method: 'DELETE' });
    showToast('Link deleted', 'info');
    fetchLinks(currentTeam.id);
  } catch (error) {
    showToast(error.message || 'Failed to delete link', 'error');
  }
}

function openAddTaskPrompt() {
  if (!currentTeam) return;
  const title = window.prompt('Task title:', '');
  if (!title) return;
  const description = window.prompt('Task description:', '') || '';

  apiFetch(`/teams/${currentTeam.id}/tasks`, {
    method: 'POST',
    body: JSON.stringify({ title, description, status: 'TODO' })
  }).then(() => {
    showToast('Task added', 'success');
    fetchTasks(currentTeam.id);
  }).catch((error) => {
    showToast(error.message || 'Failed to add task', 'error');
  });
}

async function advanceTask(taskId, currentStatus) {
  const order = ['TODO', 'IN_PROGRESS', 'DONE'];
  const nextStatus = order[Math.min(order.indexOf(currentStatus) + 1, order.length - 1)];

  try {
    await apiFetch(`/teams/${currentTeam.id}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus })
    });
    showToast(`Task moved to ${nextStatus.replace('_', ' ')}`, 'success');
    fetchTasks(currentTeam.id);
  } catch (error) {
    showToast(error.message || 'Failed to update task', 'error');
  }
}

async function deleteTask(taskId) {
  try {
    await apiFetch(`/teams/${currentTeam.id}/tasks/${taskId}`, { method: 'DELETE' });
    showToast('Task deleted', 'info');
    fetchTasks(currentTeam.id);
  } catch (error) {
    showToast(error.message || 'Failed to delete task', 'error');
  }
}
