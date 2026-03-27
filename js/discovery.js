/* ============================================================
   BUDDYBUILD — Discovery Page Logic
   ============================================================ */

const STUDENTS = [
  { id: 1, name: 'Jay Kumar',     initials: 'JK', color: '#f59e0b', role: 'solo',   sem: 'Sem 5', section: 'B', rating: 4.3, skills: ['Python', 'ML', 'TensorFlow', 'NumPy'],   status: 'solo',   bio: 'ML enthusiast building intelligent systems.' },
  { id: 2, name: 'Maya Raj',      initials: 'MR', color: '#10b981', role: 'solo',   sem: 'Sem 4', section: 'A', rating: 4.6, skills: ['UI/UX', 'Figma', 'React', 'CSS'],        status: 'solo',   bio: 'Designer who codes. Building beautiful & functional UIs.' },
  { id: 3, name: 'Sam Ali',       initials: 'SA', color: '#8b5cf6', role: 'solo',   sem: 'Sem 6', section: 'C', rating: 3.9, skills: ['Flutter', 'Dart', 'Firebase', 'iOS'],    status: 'solo',   bio: 'Mobile-first developer focused on cross-platform apps.' },
  { id: 4, name: 'Priya Singh',   initials: 'PS', color: '#ec4899', role: 'lead',   sem: 'Sem 5', section: 'A', rating: 4.8, skills: ['React', 'Node.js', 'AWS', 'Docker'],     status: 'lead',   bio: 'Full-stack dev leading Team Zenith. Looking for ML talent.' },
  { id: 5, name: 'Kai Lim',       initials: 'KL', color: '#3b82f6', role: 'solo',   sem: 'Sem 4', section: 'D', rating: 4.1, skills: ['Java', 'Spring', 'MySQL', 'Git'],        status: 'solo',   bio: 'Backend developer with a love for clean architecture.' },
  { id: 6, name: 'Ria Anand',     initials: 'RA', color: '#06b6d4', role: 'member', sem: 'Sem 3', section: 'B', rating: 4.4, skills: ['DevOps', 'Docker', 'Kubernetes', 'CI/CD'], status: 'member', bio: 'DevOps engineer automating everything in sight.' },
  { id: 7, name: 'Arjun Mehta',   initials: 'AM', color: '#f97316', role: 'solo',   sem: 'Sem 6', section: 'A', rating: 4.0, skills: ['Python', 'Django', 'PostgreSQL'],        status: 'solo',   bio: 'Backend dev who enjoys building REST APIs and data pipelines.' },
  { id: 8, name: 'Zara Khan',     initials: 'ZK', color: '#a855f7', role: 'solo',   sem: 'Sem 5', section: 'C', rating: 4.7, skills: ['React', 'Node.js', 'MongoDB', 'GraphQL'], status: 'solo',   bio: 'MERN stack developer passionate about real-time web apps.' },
  { id: 9, name: 'Dev Patel',     initials: 'DP', color: '#14b8a6', role: 'lead',   sem: 'Sem 4', section: 'A', rating: 4.2, skills: ['Flutter', 'Firebase', 'UI/UX'],          status: 'lead',   bio: 'Building Team Pixel — need a backend dev and ML expert.' },
  { id:10, name: 'Nina Sharma',   initials: 'NS', color: '#ef4444', role: 'solo',   sem: 'Sem 3', section: 'D', rating: 3.8, skills: ['Java', 'Android', 'Kotlin'],             status: 'solo',   bio: 'Android developer who loves performance optimization.' },
];

// Track relationship state: 'none' | 'pending' | 'connected'
const relationships = {};

let currentFilter = 'all';
let currentView = 'grid';

function renderCards(data) {
  const container = document.getElementById('cards-container');
  const empty = document.getElementById('empty-state');
  document.getElementById('results-count').textContent = `Showing ${data.length} student${data.length !== 1 ? 's' : ''}`;

  if (data.length === 0) {
    container.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  container.innerHTML = data.map((s, idx) => {
    const rel = relationships[s.id] || 'none';
    const actionBtn = getActionBtn(s, rel);
    const stars = '★'.repeat(Math.round(s.rating)) + '☆'.repeat(5 - Math.round(s.rating));
    const roleBadge = {
      solo:   '<span class="sc-solo-badge solo">Solo</span>',
      lead:   '<span class="sc-solo-badge lead">Lead</span>',
      member: '<span class="sc-solo-badge member">Member</span>',
    }[s.role] || '';

    return `
      <div class="smart-card" style="animation-delay:${idx * 0.05}s" onclick="openProfileModal(${s.id})">
        <div class="sc-avatar-wrap">
          <div class="sc-avatar" style="background:${s.color}">${s.initials}</div>
          ${roleBadge}
        </div>
        <div class="sc-body">
          <div class="sc-name">${s.name}</div>
          <div class="sc-meta">
            <span>${s.sem}</span><span>·</span><span>Section ${s.section}</span>
          </div>
          <div class="sc-rating">
            <span class="stars">${stars}</span>
            <span>${s.rating.toFixed(1)}</span>
          </div>
          <div class="sc-skills">
            ${s.skills.slice(0,3).map(sk => `<span class="skill-tag sm">${sk}</span>`).join('')}
            ${s.skills.length > 3 ? `<span class="skill-tag sm">+${s.skills.length - 3}</span>` : ''}
          </div>
        </div>
        <div class="sc-footer">
          <button class="btn-view-card" onclick="event.stopPropagation(); openProfileModal(${s.id})">View profile →</button>
          <div class="sc-action" onclick="event.stopPropagation()">
            ${actionBtn}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Entrance animation
  container.querySelectorAll('.smart-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(12px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'none';
    }, i * 50);
  });
}

function getActionBtn(s, rel) {
  if (rel === 'pending') return `<button class="btn-pending-tag" disabled>⏳ Pending</button>`;
  if (rel === 'connected') return `<button class="btn-pending-tag" disabled>✓ Connected</button>`;
  if (s.role === 'lead') {
    return `<button class="btn-join" onclick="sendRequest(${s.id}, 'join')">Join Team</button>`;
  }
  return `<button class="btn-invite" onclick="sendRequest(${s.id}, 'invite')">Invite</button>`;
}

function sendRequest(id, type) {
  relationships[id] = 'pending';
  const name = STUDENTS.find(s => s.id === id)?.name;
  showToast(type === 'join' ? `Join request sent to ${name}'s team!` : `Invitation sent to ${name}!`, 'success');
  filterStudents(); // re-render
  // Close modal if open
  closeProfileModal();
}

function filterStudents() {
  const query = document.getElementById('search-input').value.toLowerCase();
  const semFilter = document.getElementById('sem-filter').value;
  const statusFilter = document.getElementById('status-filter').value;

  let results = STUDENTS.filter(s => {
    const matchQuery = !query ||
      s.name.toLowerCase().includes(query) ||
      s.skills.some(sk => sk.toLowerCase().includes(query)) ||
      s.section.toLowerCase().includes(query);

    const matchSkill = currentFilter === 'all' || s.skills.includes(currentFilter);
    const matchSem = !semFilter || s.sem === semFilter;
    const matchStatus = !statusFilter || s.status === statusFilter || (statusFilter === 'solo' && s.role === 'solo');

    return matchQuery && matchSkill && matchSem && matchStatus;
  });

  renderCards(results);
}

function filterBySkill(btn) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.skill;
  filterStudents();
}

function clearSearch() {
  document.getElementById('search-input').value = '';
  document.getElementById('sem-filter').value = '';
  document.getElementById('status-filter').value = '';
  currentFilter = 'all';
  document.querySelectorAll('.chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  filterStudents();
}

function setView(mode, btn) {
  currentView = mode;
  document.querySelectorAll('.vt').forEach(v => v.classList.remove('active'));
  btn.classList.add('active');
  const container = document.getElementById('cards-container');
  container.classList.toggle('list-mode', mode === 'list');
}

/* ── Profile Modal ── */
function openProfileModal(id) {
  const s = STUDENTS.find(s => s.id === id);
  if (!s) return;
  const rel = relationships[id] || 'none';
  const stars = '★'.repeat(Math.round(s.rating)) + '☆'.repeat(5 - Math.round(s.rating));

  const actionBtn = rel === 'pending'
    ? `<button class="btn-pending-tag" style="flex:1;padding:0.7rem;justify-content:center;display:flex" disabled>⏳ Request Sent</button>`
    : s.role === 'lead'
      ? `<button class="btn-join" style="flex:1;padding:0.7rem" onclick="sendRequest(${id},'join')">Join Team</button>`
      : `<button class="btn-invite" style="flex:1;padding:0.7rem" onclick="sendRequest(${id},'invite')">Send Invite</button>`;

  document.getElementById('modal-content').innerHTML = `
    <div class="pm-header">
      <div class="pm-avatar" style="background:${s.color}">${s.initials}</div>
      <div class="pm-info">
        <div class="pm-name">${s.name}</div>
        <div class="pm-meta">${s.sem} · Section ${s.section} · ${s.role.charAt(0).toUpperCase()+s.role.slice(1)}</div>
        <div class="pm-rating">${stars} ${s.rating.toFixed(1)}</div>
      </div>
    </div>
    <div class="pm-section">
      <div class="pm-section-title">About</div>
      <p style="font-size:0.88rem;color:var(--text-2);line-height:1.6">${s.bio}</p>
    </div>
    <div class="pm-section">
      <div class="pm-section-title">Skills</div>
      <div class="pm-skills">${s.skills.map(sk => `<span class="skill-tag">${sk}</span>`).join('')}</div>
    </div>
    <div class="pm-actions" style="margin-top:1.5rem;display:flex;gap:0.75rem">
      ${actionBtn}
    </div>
  `;
  document.getElementById('profile-modal').classList.add('open');
}

function closeProfileModal() {
  document.getElementById('profile-modal').classList.remove('open');
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  renderCards(STUDENTS);
});
