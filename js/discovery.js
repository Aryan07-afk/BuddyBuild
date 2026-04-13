/* ============================================================
   BUDDYBUILD — Discovery Page Logic
   ============================================================ */

let DISCOVERY_MODE = 'teams';
let DISCOVERY_DATA = [];
let currentFilter = 'all';
let currentView = 'grid';

function getSearchableFields(item) {
  if (DISCOVERY_MODE === 'teams') {
    return [item.name, item.description, item.techStack].filter(Boolean);
  }
  return [item.name, item.section, ...(item.skills || [])].filter(Boolean);
}

async function loadDiscoveryData() {
  try {
    const meRes = await apiFetch('/users/me');
    const me = meRes.data;
    DISCOVERY_MODE = me.teamId ? 'students' : 'teams';

    const subtitle = document.querySelector('.page-sub');
    if (subtitle) {
      subtitle.textContent = DISCOVERY_MODE === 'teams'
        ? 'Browse open teams and send a join request'
        : 'Browse available students currently not in a team';
    }

    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
      statusFilter.parentElement.style.display = DISCOVERY_MODE === 'teams' ? 'none' : '';
    }

    if (DISCOVERY_MODE === 'teams') {
      const res = await apiFetch('/discovery/teams');
      DISCOVERY_DATA = (res.data || []).map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description || 'No description provided.',
        techStack: team.techStack || 'General Project',
        currentMembers: team.currentMembers,
        maxMembers: team.maxMembers,
        leaderName: team.leaderName,
        skills: (team.techStack || '')
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
        status: team.open ? 'Open' : 'Closed',
        color: '#3b82f6'
      }));
    } else {
      const res = await apiFetch('/discovery/students');
      DISCOVERY_DATA = (res.data || []).map((student) => ({
        id: student.id,
        name: student.fullName,
        initials: student.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
        role: normalizeRole(student.role),
        semester: student.semester || '?',
        section: student.section || '?',
        rating: student.averageRating || 0,
        skills: (student.skills || []).map((skill) => skill.skillName),
        bio: student.bio || 'No bio provided.',
        color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
      }));
    }

    renderCards(DISCOVERY_DATA);
  } catch (error) {
    showToast(error.message || 'Failed to load discovery data', 'error');
  }
}

function renderCards(data) {
  const container = document.getElementById('cards-container');
  const empty = document.getElementById('empty-state');
  if (!container || !empty) return;

  const label = DISCOVERY_MODE === 'teams' ? 'team' : 'student';
  document.getElementById('results-count').textContent = `Showing ${data.length} ${label}${data.length !== 1 ? 's' : ''}`;

  if (data.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  container.innerHTML = data.map((item, index) => DISCOVERY_MODE === 'teams'
    ? renderTeamCard(item, index)
    : renderStudentCard(item, index)).join('');
}

function renderTeamCard(team, index) {
  const chipList = team.skills.length ? team.skills : [team.techStack];
  return `
    <div class="smart-card" style="animation-delay:${index * 0.05}s" onclick="openTeamModal(${team.id})">
      <div class="sc-avatar-wrap">
        <div class="sc-avatar" style="background:${team.color}">${team.name.slice(0, 2).toUpperCase()}</div>
        <span class="sc-solo-badge lead">${team.status}</span>
      </div>
      <div class="sc-body">
        <div class="sc-name">${team.name}</div>
        <div class="sc-meta">
          <span>${team.currentMembers}/${team.maxMembers} members</span><span>·</span><span>Lead ${team.leaderName}</span>
        </div>
        <div class="sc-rating">
          <span class="stars">★ Open Team</span>
          <span>${team.techStack}</span>
        </div>
        <div class="sc-skills">
          ${chipList.slice(0, 3).map((skill) => `<span class="skill-tag sm">${skill}</span>`).join('')}
          ${chipList.length > 3 ? `<span class="skill-tag sm">+${chipList.length - 3}</span>` : ''}
        </div>
      </div>
      <div class="sc-footer">
        <button class="btn-view-card" onclick="event.stopPropagation(); openTeamModal(${team.id})">View team →</button>
        <div class="sc-action" onclick="event.stopPropagation()">
          <button class="btn-join" onclick="sendJoinRequest(${team.id}, '${team.name.replace(/'/g, "\\'")}')">Join Team</button>
        </div>
      </div>
    </div>
  `;
}

function renderStudentCard(student, index) {
  const stars = '★'.repeat(Math.round(student.rating)) + '☆'.repeat(5 - Math.round(student.rating));
  return `
    <div class="smart-card" style="animation-delay:${index * 0.05}s" onclick="openStudentModal(${student.id})">
      <div class="sc-avatar-wrap">
        <div class="sc-avatar" style="background:${student.color}">${student.initials}</div>
        <span class="sc-solo-badge solo">Available</span>
      </div>
      <div class="sc-body">
        <div class="sc-name">${student.name}</div>
        <div class="sc-meta">
          <span>Sem ${student.semester}</span><span>·</span><span>Section ${student.section}</span>
        </div>
        <div class="sc-rating">
          <span class="stars">${stars}</span>
          <span>${student.rating.toFixed(1)}</span>
        </div>
        <div class="sc-skills">
          ${student.skills.slice(0, 3).map((skill) => `<span class="skill-tag sm">${skill}</span>`).join('')}
          ${student.skills.length > 3 ? `<span class="skill-tag sm">+${student.skills.length - 3}</span>` : ''}
        </div>
      </div>
      <div class="sc-footer">
        <button class="btn-view-card" onclick="event.stopPropagation(); openStudentModal(${student.id})">View profile →</button>
        <div class="sc-action" onclick="event.stopPropagation()">
          <button class="btn-pending-tag" disabled>View Only</button>
        </div>
      </div>
    </div>
  `;
}

async function sendJoinRequest(teamId, teamName) {
  const note = window.prompt(`Optional note for ${teamName}:`, '') || '';

  try {
    await apiFetch('/requests', {
      method: 'POST',
      body: JSON.stringify({
        teamId,
        message: note
      })
    });
    showToast(`Join request sent to ${teamName}`, 'success');
    closeProfileModal();
  } catch (error) {
    showToast(error.message || 'Failed to send join request', 'error');
  }
}

function filterStudents() {
  const query = (document.getElementById('search-input')?.value || '').toLowerCase();
  const semFilter = document.getElementById('sem-filter')?.value || '';
  const statusFilter = document.getElementById('status-filter')?.value || '';

  const filtered = DISCOVERY_DATA.filter((item) => {
    const matchesQuery = !query || getSearchableFields(item).some((field) => field.toLowerCase().includes(query));
    const matchesChip = currentFilter === 'all' || (item.skills || []).includes(currentFilter);

    if (DISCOVERY_MODE === 'teams') {
      return matchesQuery && matchesChip;
    }

    const matchesSemester = !semFilter || `Sem ${item.semester}` === semFilter;
    const matchesStatus = !statusFilter || statusFilter === 'solo';
    return matchesQuery && matchesChip && matchesSemester && matchesStatus;
  });

  renderCards(filtered);
}

function filterBySkill(btn) {
  document.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.skill;
  filterStudents();
}

function clearSearch() {
  const searchInput = document.getElementById('search-input');
  const semFilter = document.getElementById('sem-filter');
  const statusFilter = document.getElementById('status-filter');

  if (searchInput) searchInput.value = '';
  if (semFilter) semFilter.value = '';
  if (statusFilter) statusFilter.value = '';

  currentFilter = 'all';
  document.querySelectorAll('.chip').forEach((chip, index) => chip.classList.toggle('active', index === 0));
  filterStudents();
}

function setView(mode, btn) {
  currentView = mode;
  document.querySelectorAll('.vt').forEach((toggle) => toggle.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('cards-container')?.classList.toggle('list-mode', mode === 'list');
}

function openTeamModal(id) {
  const team = DISCOVERY_DATA.find((item) => item.id === id);
  if (!team) return;

  const modalContent = document.getElementById('modal-content');
  if (!modalContent) return;

  modalContent.innerHTML = `
    <div class="pm-header">
      <div class="pm-avatar" style="background:${team.color}">${team.name.slice(0, 2).toUpperCase()}</div>
      <div class="pm-info">
        <div class="pm-name">${team.name}</div>
        <div class="pm-meta">${team.currentMembers}/${team.maxMembers} members · Lead ${team.leaderName}</div>
        <div class="pm-rating">Open Team · ${team.techStack}</div>
      </div>
    </div>
    <div class="pm-section">
      <div class="pm-section-title">About</div>
      <p style="font-size:0.88rem;color:var(--text-2);line-height:1.6">${team.description}</p>
    </div>
    <div class="pm-section">
      <div class="pm-section-title">Skills / Stack</div>
      <div class="pm-skills">${(team.skills.length ? team.skills : [team.techStack]).map((skill) => `<span class="skill-tag">${skill}</span>`).join('')}</div>
    </div>
    <div class="pm-actions" style="margin-top:1.5rem;display:flex;gap:0.75rem">
      <button class="btn-join" style="flex:1;padding:0.7rem" onclick="sendJoinRequest(${id}, '${team.name.replace(/'/g, "\\'")}')">Join Team</button>
    </div>
  `;
  document.getElementById('profile-modal')?.classList.add('open');
}

function openStudentModal(id) {
  const student = DISCOVERY_DATA.find((item) => item.id === id);
  if (!student) return;
  const stars = '★'.repeat(Math.round(student.rating)) + '☆'.repeat(5 - Math.round(student.rating));
  const modalContent = document.getElementById('modal-content');
  if (!modalContent) return;

  modalContent.innerHTML = `
    <div class="pm-header">
      <div class="pm-avatar" style="background:${student.color}">${student.initials}</div>
      <div class="pm-info">
        <div class="pm-name">${student.name}</div>
        <div class="pm-meta">Sem ${student.semester} · Section ${student.section}</div>
        <div class="pm-rating">${stars} ${student.rating.toFixed(1)}</div>
      </div>
    </div>
    <div class="pm-section">
      <div class="pm-section-title">About</div>
      <p style="font-size:0.88rem;color:var(--text-2);line-height:1.6">${student.bio}</p>
    </div>
    <div class="pm-section">
      <div class="pm-section-title">Skills</div>
      <div class="pm-skills">${student.skills.map((skill) => `<span class="skill-tag">${skill}</span>`).join('')}</div>
    </div>
    <div class="pm-actions" style="margin-top:1.5rem;display:flex;gap:0.75rem">
      <button class="btn-pending-tag" style="flex:1;padding:0.7rem;justify-content:center;display:flex" disabled>Invites unavailable in current backend</button>
    </div>
  `;
  document.getElementById('profile-modal')?.classList.add('open');
}

function closeProfileModal() {
  document.getElementById('profile-modal')?.classList.remove('open');
}

document.addEventListener('DOMContentLoaded', () => {
  loadDiscoveryData();
});
