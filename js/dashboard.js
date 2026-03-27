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

function addSkill() {
  const input = document.getElementById('new-skill-input');
  const val = input.value.trim();
  if (!val) { showToast('Enter a skill name', 'error'); return; }
  const cloud = document.querySelector('.skills-cloud');
  const tag = document.createElement('span');
  tag.className = 'skill-tag';
  tag.textContent = val;
  tag.style.animation = 'none';
  tag.style.transform = 'scale(0)';
  cloud.appendChild(tag);
  setTimeout(() => {
    tag.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
    tag.style.transform = 'scale(1)';
  }, 10);
  input.value = '';
  showToast(`Skill "${val}" added!`, 'success');
}

// Stat card hover accent
document.querySelectorAll('.stat-card').forEach(card => {
  const accent = card.style.getPropertyValue('--accent');
  if (accent) {
    card.querySelector('.stat-value').style.color = accent;
  }
});

// Animate stat numbers
document.addEventListener('DOMContentLoaded', () => {
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

  // Dynamic Greeting
  const greetingEl = document.getElementById('dynamic-greeting');
  if (greetingEl) {
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 18) timeGreeting = 'Good afternoon';
    greetingEl.textContent = `${timeGreeting}, Aryan 👋`;
  }

  // Dynamic Status Banner
  const role = localStorage.getItem('bb_user_role') || 'solo';
  const bannerContainer = document.getElementById('dynamic-status-banner');
  if (bannerContainer) {
    if (role === 'solo') {
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
    } else if (role === 'lead') {
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
    } else if (role === 'member') {
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

  // Dynamic Insights Panel
  const insightsContainer = document.getElementById('dynamic-insights-panel');
  if (insightsContainer) {
    if (role === 'solo') {
      insightsContainer.innerHTML = `
        <div class="card-head">
          <h3>Recommended Teams</h3>
          <a href="discovery.html" class="see-all">Discover more →</a>
        </div>
        <div class="insights-body" style="padding: 1rem;">
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1rem;">These teams match your skillset. Send them a request!</p>
          <div class="recommendation-item" style="display:flex; justify-content:space-between; align-items:center; background:var(--surface-2); padding:0.8rem; border-radius:12px; margin-bottom:0.75rem;">
            <div>
              <div style="font-weight:600;">Team Zenith</div>
              <div style="font-size:0.85rem; color:var(--text-muted);">Looking for: React, Node.js</div>
            </div>
            <button class="btn-primary sm">Join</button>
          </div>
          <div class="recommendation-item" style="display:flex; justify-content:space-between; align-items:center; background:var(--surface-2); padding:0.8rem; border-radius:12px;">
            <div>
              <div style="font-weight:600;">Campus Nav</div>
              <div style="font-size:0.85rem; color:var(--text-muted);">Looking for: React Native</div>
            </div>
            <button class="btn-primary sm">Join</button>
          </div>
        </div>
      `;
    } else if (role === 'lead') {
      insightsContainer.innerHTML = `
        <div class="card-head">
          <h3>Active Vacancies</h3>
          <a href="my-team.html" class="see-all">Manage →</a>
        </div>
        <div class="insights-body" style="padding: 1rem;">
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1rem;">Mark which roles your team is actively recruiting for.</p>
          <div class="vacancy-item" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
            <span style="font-weight:500;">Frontend Developer</span>
            <label class="switch" style="position:relative; display:inline-block; width:34px; height:20px;">
              <input type="checkbox" checked style="opacity:0; width:0; height:0;">
              <span class="slider round" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:var(--accent); border-radius:34px;"></span>
            </label>
          </div>
          <div class="vacancy-item" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
            <span style="font-weight:500;">Backend Developer</span>
            <label class="switch" style="position:relative; display:inline-block; width:34px; height:20px;">
              <input type="checkbox" style="opacity:0; width:0; height:0;">
              <span class="slider round" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:var(--surface-2); border-radius:34px; border:1px solid var(--border);"></span>
            </label>
          </div>
          <div class="vacancy-item" style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:500;">QA Engineer</span>
            <label class="switch" style="position:relative; display:inline-block; width:34px; height:20px;">
              <input type="checkbox" checked style="opacity:0; width:0; height:0;">
              <span class="slider round" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:var(--accent); border-radius:34px;"></span>
            </label>
          </div>
        </div>
      `;
    } else if (role === 'member') {
      insightsContainer.innerHTML = `
        <div class="card-head">
          <h3>Team Noticeboard</h3>
          <a href="my-team.html" class="see-all">Team Portal →</a>
        </div>
        <div class="insights-body" style="padding: 1rem;">
          <div style="background:var(--accent-light); color:var(--accent); padding:0.8rem; border-radius:12px; margin-bottom:1rem; display:flex; gap:0.5rem; align-items:flex-start;">
            <span>📢</span>
            <span style="font-size:0.9rem; font-weight:500;">Next Sync: Friday at 3:00 PM via Zoom. Please push your branch before the meeting!</span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 0.5rem; font-weight:600;">Your Assigned Tasks</p>
          <ul style="list-style:none; padding:0; margin:0; font-size:0.95rem;">
            <li style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem;"><input type="checkbox"> Finish dashboard styling</li>
            <li style="display:flex; gap:0.5rem; align-items:center;"><input type="checkbox" checked> Integrate Google Auth</li>
          </ul>
        </div>
      `;
    }
  }
});
