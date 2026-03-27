/* ============================================================
   BUDDYBUILD — Requests Page Logic
   ============================================================ */

function switchTab(name, btn) {
  // Deactivate all
  document.querySelectorAll('.req-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.req-panel').forEach(p => p.classList.remove('active'));

  btn.classList.add('active');
  document.getElementById(`tab-${name}`).classList.add('active');
}

function handleRequest(cardId, action) {
  const card = document.getElementById(cardId);
  if (!card) return;

  card.classList.add('removing');
  const name = card.querySelector('.req-name').childNodes[0].textContent.trim();

  setTimeout(() => {
    card.remove();
    checkEmptyList('incoming-list');
    updateTabCount('incoming', -1);

    if (action === 'accept') {
      showToast(`✓ Accepted ${name}'s request`, 'success');
      addToAccepted(name);
      updateTabCount('accepted', 1);
    } else {
      showToast(`Declined ${name}'s request`, 'error');
    }
  }, 300);
}

function addToAccepted(name) {
  const list = document.querySelector('#tab-accepted .req-list');
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase();
  const colors = ['#f59e0b','#10b981','#8b5cf6','#3b82f6','#ec4899'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const el = document.createElement('div');
  el.className = 'req-card accepted-card';
  el.style.opacity = '0';
  el.innerHTML = `
    <div class="req-avatar" style="background:${color}">${initials}</div>
    <div class="req-info">
      <div class="req-name">${name} <span class="req-type accepted-badge">✓ Accepted</span></div>
      <div class="req-meta">Joined your team</div>
      <div class="req-time">⏰ Just now</div>
    </div>
    <div class="req-actions">
      <a href="my-team.html" class="btn-view-profile">View Team →</a>
    </div>
  `;
  list.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity 0.3s'; el.style.opacity = '1'; }, 10);
}

function cancelRequest(btn) {
  const card = btn.closest('.req-card');
  const name = card.querySelector('.req-name').childNodes[0].textContent.trim();
  card.classList.add('removing');
  setTimeout(() => {
    card.remove();
    checkEmptyList(card.closest('.req-list'));
    updateTabCount('outgoing', -1);
    showToast(`Request to ${name} cancelled`, 'info');
  }, 300);
}

function updateTabCount(tabName, delta) {
  const tabs = document.querySelectorAll('.req-tab');
  const map = { incoming: 0, outgoing: 1, accepted: 2 };
  const tab = tabs[map[tabName]];
  if (!tab) return;
  const badge = tab.querySelector('.tab-count');
  if (!badge) return;
  let val = parseInt(badge.textContent) + delta;
  if (val < 0) val = 0;
  badge.textContent = val;
}

function checkEmptyList(listEl) {
  const list = typeof listEl === 'string' ? document.getElementById(listEl) : listEl;
  if (!list) return;
  if (list.children.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:3rem;color:var(--text-3)">
        <div style="font-size:2.5rem;margin-bottom:0.75rem">◎</div>
        <p>No requests here</p>
      </div>
    `;
  }
}
