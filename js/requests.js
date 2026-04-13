/* ============================================================
   BUDDYBUILD — Requests Page Logic
   ============================================================ */

function switchTab(name, btn) {
  document.querySelectorAll('.req-tab').forEach((tab) => tab.classList.remove('active'));
  document.querySelectorAll('.req-panel').forEach((panel) => panel.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`tab-${name}`)?.classList.add('active');
}

async function handleRequest(requestId, action, name) {
  const card = document.getElementById(`req-${requestId}`);
  card?.classList.add('removing');

  try {
    await apiFetch(`/requests/${requestId}/${action}`, { method: 'PATCH' });
    showToast(`${action === 'accept' ? 'Accepted' : 'Declined'} ${name}'s request`, action === 'accept' ? 'success' : 'info');
    fetchAllRequests();
  } catch (error) {
    card?.classList.remove('removing');
    showToast(error.message || 'Action failed', 'error');
  }
}

async function cancelRequest(requestId, name) {
  try {
    await apiFetch(`/requests/${requestId}`, { method: 'DELETE' });
    showToast(`Cancelled request to ${name}`, 'info');
    fetchAllRequests();
  } catch (error) {
    showToast(error.message || 'Could not cancel request', 'error');
  }
}

function updateTabCount(index, count) {
  const tab = document.querySelectorAll('.req-tab')[index];
  if (!tab) return;
  const badge = tab.querySelector('.tab-count');
  if (badge) badge.textContent = count;
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div style="text-align:center;padding:3rem;color:var(--text-3)">
      <div style="font-size:2.5rem;margin-bottom:0.75rem">◎</div>
      <p>No requests here</p>
    </div>
  `;
}

function renderRequestsList(containerId, requests, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!requests.length) {
    renderEmptyState(container);
    return;
  }

  container.innerHTML = requests.map((request) => {
    const initialsSource = type === 'incoming' ? request.senderName : request.teamName;
    const initials = (initialsSource || 'BB').substring(0, 2).toUpperCase();
    const colors = ['#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#ec4899'];
    const color = colors[request.id % colors.length];

    let actions = '';
    if (type === 'incoming') {
      actions = `
        <button class="btn-accept" onclick="handleRequest(${request.id}, 'accept', '${request.senderName.replace(/'/g, "\\'")}')">Accept</button>
        <button class="btn-reject" onclick="handleRequest(${request.id}, 'reject', '${request.senderName.replace(/'/g, "\\'")}')">Decline</button>
      `;
    } else if (type === 'outgoing') {
      actions = `<button class="btn-reject" onclick="cancelRequest(${request.id}, '${request.teamName.replace(/'/g, "\\'")}')">Cancel</button>`;
    } else {
      actions = `<a href="my-team.html" class="btn-view-profile">View Team →</a>`;
    }

    return `
      <div class="req-card" id="req-${request.id}">
        <div class="req-avatar" style="background:${color}">${initials}</div>
        <div class="req-info">
          <div class="req-name">
            ${type === 'incoming' ? request.senderName : request.teamName}
            ${type === 'accepted' ? '<span class="req-type accepted-badge">✓ Accepted</span>' : ''}
          </div>
          <div class="req-meta">
            ${type === 'incoming' ? 'Wants to join your team' : type === 'accepted' ? 'Your request was accepted' : 'Waiting for team response'}
          </div>
          <div class="req-time">⏰ ${new Date(request.createdAt).toLocaleDateString()}</div>
        </div>
        <div class="req-actions">${actions}</div>
      </div>
    `;
  }).join('');
}

async function fetchAllRequests() {
  const teamId = localStorage.getItem('bb_team_id');
  const userId = localStorage.getItem('bb_user_id');

  try {
    const mineRes = await apiFetch('/requests/mine');
    const mine = mineRes.data || [];
    const outgoing = mine.filter((request) => String(request.senderId) === String(userId) && request.status === 'PENDING');
    const accepted = mine.filter((request) => request.status === 'ACCEPTED');

    let incoming = [];
    if (teamId) {
      try {
        const incomingRes = await apiFetch(`/requests/team/${teamId}`);
        incoming = incomingRes.data || [];
      } catch (error) {
        incoming = [];
      }
    }

    renderRequestsList('incoming-list', incoming, 'incoming');
    renderRequestsList('tab-outgoing-list', outgoing, 'outgoing');
    renderRequestsList('tab-accepted-list', accepted, 'accepted');

    updateTabCount(0, incoming.length);
    updateTabCount(1, outgoing.length);
    updateTabCount(2, accepted.length);

    const sidebarBadge = document.getElementById('req-badge');
    if (sidebarBadge) {
      sidebarBadge.textContent = incoming.length;
      sidebarBadge.style.display = incoming.length ? 'flex' : 'none';
    }
  } catch (error) {
    showToast(error.message || 'Failed to fetch requests', 'error');
  }
}

document.addEventListener('DOMContentLoaded', fetchAllRequests);
