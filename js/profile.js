/* ============================================================
   BUDDYBUILD — Profile Page Logic
   ============================================================ */

let profileProjects = [];
let profilePictureData = '';
const SEMESTER_OPTIONS = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'];

function getProfilePayload() {
  return {
    fullName: document.getElementById('profile-full-name').value.trim(),
    semester: document.getElementById('profile-semester-input').value,
    section: document.getElementById('profile-section-input').value.trim(),
    bio: document.getElementById('profile-bio-input').value.trim(),
    githubUrl: document.getElementById('profile-github-input').value.trim(),
    linkedinUrl: document.getElementById('profile-linkedin-input').value.trim(),
    portfolioUrl: document.getElementById('profile-portfolio-input').value.trim(),
    profilePicture: profilePictureData || null
  };
}

async function persistProfile(payload = getProfilePayload()) {
  const res = await apiFetch('/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

  const user = res.data;
  document.getElementById('ph-name').textContent = user.fullName;
  document.getElementById('ph-semester').textContent = user.semester || '';
  document.getElementById('ph-section').textContent = user.section || '';
  document.querySelectorAll('.user-name').forEach((el) => { el.textContent = user.fullName; });
  if (user.profilePicture) {
    profilePictureData = user.profilePicture;
    const avatar = document.getElementById('ph-avatar');
    avatar.style.background = `url(${user.profilePicture}) center/cover`;
    avatar.textContent = '';
  }
  return user;
}

function toggleEdit(sectionId, btn) {
  const section = document.getElementById(sectionId);
  const inputs = section.querySelectorAll('input, select, textarea');
  const isEditing = btn.classList.contains('active');

  if (isEditing) {
    persistProfile()
      .then(() => {
        inputs.forEach((input) => { input.disabled = true; });
        btn.classList.remove('active');
        btn.textContent = '✎ Edit';
        showToast('Profile updated!', 'success');
      })
      .catch((error) => {
        showToast(error.message || 'Failed to update profile', 'error');
      });
    return;
  }

  inputs.forEach((input) => { input.disabled = false; });
  btn.classList.add('active');
  btn.textContent = '✓ Save';
  section.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled])')?.focus();
}

function toggleSkillEdit() {
  const chips = document.querySelectorAll('.chip-remove');
  const section = document.getElementById('skill-add-section');
  const visible = section.style.display === 'block';
  section.style.display = visible ? 'none' : 'block';
  chips.forEach((chip) => { chip.style.display = visible ? 'none' : 'flex'; });
}

function removeSkill(id, btn) {
  apiFetch(`/users/me/skills/${id}`, { method: 'DELETE' })
    .then(() => {
      btn.closest('.skill-chip-edit')?.remove();
      showToast('Skill removed', 'info');
    })
    .catch((error) => {
      showToast(error.message || 'Failed to remove skill', 'error');
    });
}

async function addProfileSkill() {
  const input = document.getElementById('skill-add-input');
  const skillName = input.value.trim();
  if (!skillName) {
    showToast('Enter a skill name', 'error');
    return;
  }

  try {
    const res = await apiFetch('/users/me/skills', {
      method: 'POST',
      body: JSON.stringify({ skillName, proficiency: 'INTERMEDIATE' })
    });
    const newSkill = (res.data.skills || []).find((skill) => skill.skillName.toLowerCase() === skillName.toLowerCase());
    if (newSkill) insertSkillChip(newSkill.skillName, newSkill.skillId);
    input.value = '';
    showToast(`"${skillName}" added`, 'success');
  } catch (error) {
    showToast(error.message || 'Failed to add skill', 'error');
  }
}

function quickAddSkill(name) {
  document.getElementById('skill-add-input').value = name;
  addProfileSkill();
}

function insertSkillChip(name, id) {
  const grid = document.getElementById('skills-edit-grid');
  const chip = document.createElement('div');
  chip.className = 'skill-chip-edit';
  chip.innerHTML = `${name} <button class="chip-remove" style="display:none" onclick="removeSkill(${id}, this)">×</button>`;
  grid.appendChild(chip);
}

async function saveProfile() {
  try {
    await persistProfile();
    document.querySelectorAll('.edit-toggle.active').forEach((button) => {
      button.classList.remove('active');
      button.textContent = '✎ Edit';
    });
    document.querySelectorAll('#basic-fields input, #basic-fields select, #basic-fields textarea, #external-fields input').forEach((input) => {
      input.disabled = true;
    });
    showToast('All profile changes saved!', 'success');
  } catch (error) {
    showToast(error.message || 'Failed to save profile', 'error');
  }
}

function previewProfile() {
  showToast('Public profile preview will reflect saved data.', 'info');
}

function updateAvatar(input) {
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    profilePictureData = event.target.result;
    const avatar = document.getElementById('ph-avatar');
    avatar.style.background = `url(${profilePictureData}) center/cover`;
    avatar.textContent = '';
    try {
      await persistProfile();
      showToast('Avatar updated!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to update avatar', 'error');
    }
  };
  reader.readAsDataURL(file);
}

function openAddProject() {
  document.getElementById('add-proj-modal').classList.add('open');
}

function closeAddProject(event) {
  if (event.target === event.currentTarget) {
    event.currentTarget.classList.remove('open');
  }
}

async function addProject() {
  const payload = {
    projectName: document.getElementById('proj-title-input').value.trim(),
    role: document.getElementById('proj-role-input').value.trim(),
    semester: document.getElementById('proj-sem-input').value,
    teamSize: parseInt(document.getElementById('proj-team-input').value || '0', 10) || null
  };

  if (!payload.projectName || !payload.role) {
    showToast('Fill in project title and role', 'error');
    return;
  }

  try {
    await apiFetch('/users/me/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    document.getElementById('proj-title-input').value = '';
    document.getElementById('proj-role-input').value = '';
    document.getElementById('proj-team-input').value = '';
    document.getElementById('add-proj-modal').classList.remove('open');
    await fetchProjects();
    showToast(`Project "${payload.projectName}" added!`, 'success');
  } catch (error) {
    showToast(error.message || 'Failed to add project', 'error');
  }
}

async function deleteProject(projectId) {
  try {
    await apiFetch(`/users/me/projects/${projectId}`, { method: 'DELETE' });
    await fetchProjects();
    showToast('Project removed', 'info');
  } catch (error) {
    showToast(error.message || 'Failed to delete project', 'error');
  }
}

async function fetchProjects() {
  try {
    const res = await apiFetch('/users/me/projects');
    profileProjects = res.data || [];
    renderProjects();
  } catch (error) {
    console.error('Failed to fetch projects:', error);
  }
}

function renderProjects() {
  const projectList = document.getElementById('project-list');
  if (!projectList) return;

  if (!profileProjects.length) {
    projectList.innerHTML = '<div style="color:var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem; font-style: italic;">No projects added yet.</div>';
    return;
  }

  projectList.innerHTML = profileProjects.map((project) => `
    <div class="project-item">
      <div class="proj-icon">📦</div>
      <div class="proj-body">
        <div class="proj-title">${project.projectName}</div>
        <div class="proj-meta">Role: ${project.role} · Team: ${project.teamSize || '?'} · ${project.semester || '--'}</div>
      </div>
      <button class="btn-del-proj" onclick="deleteProject(${project.id})">✕</button>
    </div>
  `).join('');
}

async function loadProfile() {
  try {
    const res = await apiFetch('/users/me');
    const user = res.data;
    profilePictureData = user.profilePicture || '';

    document.getElementById('ph-name').textContent = user.fullName;
    document.getElementById('ph-semester').textContent = user.semester || '';
    document.getElementById('ph-section').textContent = user.section || '';
    document.querySelector('.rating-val').textContent = `${(user.averageRating || 0).toFixed(1)} avg rating`;
    document.querySelector('.ph-rating .stars').textContent = '★'.repeat(Math.round(user.averageRating || 0)) + '☆'.repeat(5 - Math.round(user.averageRating || 0));

    const avatar = document.getElementById('ph-avatar');
    if (user.profilePicture) {
      avatar.style.background = `url(${user.profilePicture}) center/cover`;
      avatar.textContent = '';
    } else {
      avatar.style.background = '';
      avatar.textContent = user.fullName.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2);
    }

    document.getElementById('profile-full-name').value = user.fullName || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-phone').value = '';
    document.getElementById('profile-whatsapp').value = '';
    document.getElementById('profile-semester-input').innerHTML = SEMESTER_OPTIONS.map((semester) => `
      <option value="${semester}" ${semester === user.semester ? 'selected' : ''}>${semester}</option>
    `).join('');
    document.getElementById('profile-section-input').value = user.section || '';
    document.getElementById('profile-bio-input').value = user.bio || '';
    document.getElementById('profile-github-input').value = user.githubUrl || '';
    document.getElementById('profile-linkedin-input').value = user.linkedinUrl || '';
    document.getElementById('profile-portfolio-input').value = user.portfolioUrl || '';

    const skillGrid = document.getElementById('skills-edit-grid');
    skillGrid.innerHTML = '';
    (user.skills || []).forEach((skill) => insertSkillChip(skill.skillName, skill.skillId));
  } catch (error) {
    console.error('Failed to load profile:', error);
    showToast('Failed to load profile', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('skill-add-section').style.display = 'none';
  await Promise.all([loadProfile(), fetchProjects()]);
});
