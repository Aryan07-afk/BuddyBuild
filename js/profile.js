/* ============================================================
   BUDDYBUILD — Profile Page Logic
   ============================================================ */

function toggleEdit(sectionId, btn) {
  const section = document.getElementById(sectionId);
  const inputs = section.querySelectorAll('input, select, textarea');
  const isEditing = btn.classList.contains('active');

  if (isEditing) {
    // Save
    inputs.forEach(i => i.disabled = true);
    btn.classList.remove('active');
    btn.textContent = '✎ Edit';
    showToast('Profile updated!', 'success');
    // Update display name
    const nameInput = section.querySelector('input[type="text"]');
    if (nameInput) {
      document.getElementById('ph-name').textContent = nameInput.value;
    }
  } else {
    // Enable editing
    inputs.forEach(i => i.disabled = false);
    btn.classList.add('active');
    btn.textContent = '✓ Save';
    section.querySelector('input:not([disabled])') && section.querySelector('input:not([disabled])').focus();
  }
}

function toggleSkillEdit() {
  const chips = document.querySelectorAll('.chip-remove');
  const section = document.getElementById('skill-add-section');
  const isHidden = section.style.display === 'none' || section.style.display === '';
  section.style.display = isHidden ? 'block' : 'none';
  chips.forEach(c => c.style.display = isHidden ? 'flex' : 'none');
}

function removeSkill(btn) {
  const chip = btn.closest('.skill-chip-edit');
  chip.style.transition = 'all 0.2s ease';
  chip.style.transform = 'scale(0)';
  chip.style.opacity = '0';
  setTimeout(() => chip.remove(), 200);
  showToast('Skill removed', 'info');
}

function addProfileSkill() {
  const input = document.getElementById('skill-add-input');
  const val = input.value.trim();
  if (!val) { showToast('Enter a skill name', 'error'); return; }
  _insertSkillChip(val);
  input.value = '';
  showToast(`"${val}" added`, 'success');
}

function quickAddSkill(name) {
  _insertSkillChip(name);
  showToast(`"${name}" added`, 'success');
}

function _insertSkillChip(name) {
  const grid = document.getElementById('skills-edit-grid');
  const chip = document.createElement('div');
  chip.className = 'skill-chip-edit';
  chip.innerHTML = `${name} <button class="chip-remove" onclick="removeSkill(this)">×</button>`;
  chip.style.transform = 'scale(0)';
  grid.appendChild(chip);
  setTimeout(() => {
    chip.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
    chip.style.transform = 'scale(1)';
  }, 10);
}

function saveProfile() {
  showToast('✓ All changes saved!', 'success');
}

function previewProfile() {
  showToast('Preview: this is what teammates see', 'info');
}

function updateAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const avatar = document.getElementById('ph-avatar');
    avatar.style.background = `url(${e.target.result}) center/cover`;
    avatar.textContent = '';
    showToast('Avatar updated!', 'success');
  };
  reader.readAsDataURL(file);
}

/* ── Project Modal ── */
function openAddProject() {
  document.getElementById('add-proj-modal').classList.add('open');
}
function closeAddProject(event) {
  if (event.target === event.currentTarget) {
    event.currentTarget.classList.remove('open');
  }
}

function addProject() {
  const title = document.getElementById('proj-title-input').value.trim();
  const role  = document.getElementById('proj-role-input').value.trim();
  const sem   = document.getElementById('proj-sem-input').value;
  const size  = document.getElementById('proj-team-input').value;

  if (!title || !role) { showToast('Fill in project title and role', 'error'); return; }

  const icons = ['📦','🚀','💡','🔧','🎯','📱','🌐','🤖'];
  const icon  = icons[Math.floor(Math.random() * icons.length)];

  const list = document.getElementById('project-list');
  const item = document.createElement('div');
  item.className = 'project-item';
  item.style.opacity = '0';
  item.innerHTML = `
    <div class="proj-icon">${icon}</div>
    <div class="proj-body">
      <div class="proj-title">${title}</div>
      <div class="proj-meta">Role: ${role} · Team: ${size || '?'} · ${sem}</div>
    </div>
    <button class="btn-del-proj" onclick="deleteProject(this)">✕</button>
  `;
  list.appendChild(item);
  setTimeout(() => { item.style.transition = 'opacity 0.3s'; item.style.opacity = '1'; }, 10);

  // Clear & close
  document.getElementById('proj-title-input').value = '';
  document.getElementById('proj-role-input').value = '';
  document.getElementById('proj-team-input').value = '';
  document.getElementById('add-proj-modal').classList.remove('open');
  showToast(`Project "${title}" added!`, 'success');
}

function deleteProject(btn) {
  const item = btn.closest('.project-item');
  item.style.transition = 'all 0.25s ease';
  item.style.opacity = '0';
  item.style.transform = 'scale(0.95)';
  setTimeout(() => item.remove(), 250);
  showToast('Project removed', 'info');
}

// Init: hide chip-remove buttons and skill add section
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.chip-remove').forEach(c => c.style.display = 'none');
  document.getElementById('skill-add-section').style.display = 'none';
});
