/* ============================================================
   BUDDYBUILD — Dashboard Page Logic
   ============================================================ */

function acceptRequest(btn) {
  const item = btn.closest('.activity-item');
  item.style.transition = 'all 0.3s ease';
  item.style.opacity = '0';
  item.style.transform = 'translateX(20px)';
  setTimeout(() => item.remove(), 300);
  showToast('✓ Request accepted!', 'success');
  updateBadges(-1);
}

function rejectRequest(btn) {
  const item = btn.closest('.activity-item');
  item.style.transition = 'all 0.3s ease';
  item.style.opacity = '0';
  item.style.transform = 'translateX(-20px)';
  setTimeout(() => item.remove(), 300);
  showToast('Request declined', 'error');
  updateBadges(-1);
}

function updateBadges(delta) {
  const badge = document.getElementById('req-badge');
  if (badge) {
    let val = parseInt(badge.textContent) + delta;
    if (val < 0) val = 0;
    badge.textContent = val;
    if (val === 0) badge.style.display = 'none';
  }
}

async function addSkill() {
  const input = document.getElementById('new-skill-input');
  const val = input.value.trim();
  if (!val) { showToast('Enter a skill name', 'error'); return; }
  
  try {
    const data = await apiFetch('/users/me/skills', {
      method: 'POST',
      body: JSON.stringify({ skillName: val, proficiency: 'INTERMEDIATE' })
    });
    
    // Refresh skills display
    renderSkills(data.data.skills);
    input.value = '';
    showToast(`Skill "${val}" added!`, 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function renderSkills(skills) {
  const cloud = document.querySelector('.skills-cloud');
  if (!cloud) return;
  cloud.innerHTML = '';
  skills.forEach(s => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.textContent = s.skillName;
    cloud.appendChild(tag);
  });
}

// Stat card hover accent
document.querySelectorAll('.stat-card').forEach(card => {
  const accent = card.style.getPropertyValue('--accent');
  if (accent) {
    const valEl = card.querySelector('.stat-value');
    if (valEl) valEl.style.color = accent;
  }
});

// Animate stat numbers
function animateStats() {
  document.querySelectorAll('.stat-value').forEach(el => {
    const target = parseFloat(el.textContent);
    if (isNaN(target)) return;
    const isFloat = el.textContent.includes('.');
    let current = 0;
    const step = target / 30;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = isFloat ? current.toFixed(1) : Math.floor(current);
    }, 30);
  });
}

// Dynamic Greeting & Data Loading
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const userData = await apiFetch('/users/me');
    const user = userData.data;
    let teamData = null;
    let pendingCount = 0;

    if (user.teamId) {
      try {
        const teamRes = await apiFetch(`/teams/${user.teamId}`);
        teamData = teamRes.data;
      } catch (error) {
        teamData = null;
      }
    }

    try {
      if (normalizeRole(user.role) === 'leader' && user.teamId) {
        const pendingRes = await apiFetch(`/requests/team/${user.teamId}`);
        pendingCount = (pendingRes.data || []).length;
      } else {
        const mineRes = await apiFetch('/requests/mine');
        pendingCount = (mineRes.data || []).filter((request) => request.status === 'PENDING').length;
      }
    } catch (error) {
      pendingCount = 0;
    }

    // 1. Update Greeting
    const greetingEl = document.getElementById('dynamic-greeting');
    if (greetingEl) {
      const hour = new Date().getHours();
      let timeGreeting = 'Good evening';
      if (hour < 12) timeGreeting = 'Good morning';
      else if (hour < 18) timeGreeting = 'Good afternoon';
      greetingEl.textContent = `${timeGreeting}, ${user.fullName.split(' ')[0]} 👋`;
    }

    // 2. Render Skills
    renderSkills(user.skills);
    
    // 3. Status Banner
    const roleKey = normalizeRole(user.role);
    const bannerContainer = document.getElementById('dynamic-status-banner');
    if (bannerContainer) {
      if (!user.teamId) {
        bannerContainer.innerHTML = `
          <div class="status-banner solo">
            <div class="status-icon">🎯</div>
            <div class="status-text">
              <strong>You're currently Solo</strong>
              <span>Start by discovering teammates or creating a team!</span>
            </div>
            <a href="discovery.html" class="btn-sm">Find Teammates →</a>
          </div>
        `;
      } else if (roleKey === 'leader' || roleKey === 'lead') {
        bannerContainer.innerHTML = `
          <div class="status-banner in-team">
            <div class="status-icon">👑</div>
            <div class="status-text">
              <strong>You're a Team Lead</strong>
              <span>Review join requests and manage your project team.</span>
            </div>
            <a href="requests.html" class="btn-sm">View Requests →</a>
          </div>
        `;
      } else {
        bannerContainer.innerHTML = `
          <div class="status-banner in-team">
            <div class="status-icon">🤝</div>
            <div class="status-text">
              <strong>You're in a Team</strong>
              <span>Check out your team's recent activity and tasks.</span>
            </div>
            <a href="my-team.html" class="btn-sm">Go to My Team →</a>
          </div>
        `;
      }
    }

    // 4. Overwrite static overview stats using backend data
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 4) {
      statValues[0].textContent = teamData ? String(teamData.currentMembers) : '0';
      statValues[1].textContent = String(pendingCount);
      statValues[2].textContent = user.skills ? user.skills.length.toString() : '0';
      statValues[3].textContent = user.averageRating ? user.averageRating.toFixed(1) : '0.0';
    }

    // Rewrite dummy peer rating metrics
    const ratingScores = document.querySelectorAll('.rating-score');
    if (ratingScores.length >= 4) {
      const avg = user.averageRating || 0;
      ratingScores.forEach(el => el.textContent = avg.toFixed(1));
    }

    // 4. Animate stats
    animateStats();

    // 5. Dynamic Insights Panel
    const insightsContainer = document.getElementById('dynamic-insights-panel');
    if (insightsContainer) {
      if (!user.teamId) {
        insightsContainer.innerHTML = `
          <div class="card-head">
            <h3>Recommended Teams</h3>
            <a href="discovery.html" class="see-all">Discover more →</a>
          </div>
          <div class="insights-body" style="padding: 1rem;">
            <p style="color: var(--text-2); font-size: 0.85rem; margin-bottom: 1rem;">Based on your skills: ${(user.skills || []).slice(0,2).map(s => s.skillName).join(', ') || 'General'}</p>
            <div style="text-align:center; padding: 1rem; color:var(--text-3); font-size:0.9rem;">
              Visit the <a href="discovery.html" style="color:var(--accent)">Discovery</a> page to browse open teams and send a join request.
            </div>
          </div>
        `;
      } else if (roleKey === 'leader' || roleKey === 'lead') {
        insightsContainer.innerHTML = `
          <div class="card-head">
            <h3>Team Management</h3>
            <a href="my-team.html" class="see-all">Manage →</a>
          </div>
          <div class="insights-body" style="padding: 1rem;">
             <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                <span style="font-size:0.9rem;">Project Status</span>
                <span class="th-badge ${teamData && teamData.open ? 'open' : 'closed'}" style="font-size:0.7rem; padding:2px 8px;">${teamData ? teamData.status : 'ACTIVE'}</span>
             </div>
             <div style="font-size:0.85rem;color:var(--text-2);margin-bottom:1rem;">Pending requests: ${pendingCount}</div>
             <a href="requests.html" class="btn-primary" style="width:100%; display:inline-block; text-align:center; text-decoration:none; padding:10px; border-radius:10px; font-size:0.9rem;">Check Join Requests</a>
          </div>
        `;
      } else {
        insightsContainer.innerHTML = `
          <div class="card-head">
            <h3>Team Noticeboard</h3>
            <a href="my-team.html" class="see-all">Team Portal →</a>
          </div>
          <div class="insights-body" style="padding: 1rem;">
            <div style="background:var(--surface-3); padding:0.8rem; border-radius:12px; margin-bottom:1rem; display:flex; gap:0.5rem; align-items:flex-start;">
              <span>📢</span>
              <span style="font-size:0.85rem; color:var(--text-1)">Coordinate with your leader for task assignments.</span>
            </div>
            <p style="color: var(--text-2); font-size: 0.85rem; font-weight:600;">Upcoming Deadline</p>
            <p style="font-size:0.9rem; color:var(--accent)">Final Submission in 12 days</p>
          </div>
        `;
      }
    }

  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    showToast('Failed to load dashboard', 'error');
  }
});
