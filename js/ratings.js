const localRatingData = {};

function setRating(starEl) {
  const container = starEl.closest('.star-rating');
  const value = parseInt(starEl.dataset.val, 10);
  const target = container.dataset.target;
  localRatingData[target] = value;

  container.querySelectorAll('.star').forEach((star) => {
    star.classList.toggle('active', parseInt(star.dataset.val, 10) <= value);
  });
}

async function fetchMyRatingsData() {
  const userId = localStorage.getItem('bb_user_id');
  if (!userId) return;

  try {
    const [avgRes, listRes] = await Promise.all([
      apiFetch(`/ratings/user/${userId}/average`),
      apiFetch(`/ratings/user/${userId}`)
    ]);

    const avg = avgRes.data || 0;
    const reviews = listRes.data || [];

    document.querySelector('.rob-num').textContent = avg.toFixed(1);
    document.querySelector('.rob-stars').textContent = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
    document.querySelector('.rob-sub').textContent = reviews.length ? `Based on ${reviews.length} reviews` : 'No reviews yet';
    document.querySelectorAll('.rob-fill').forEach((fill) => { fill.style.width = `${(avg / 5) * 100}%`; });
    document.querySelectorAll('.rob-val').forEach((value) => { value.textContent = avg.toFixed(1); });

    const list = document.getElementById('received-ratings-list');
    list.innerHTML = reviews.length ? reviews.map((review) => `
      <div class="received-card">
        <div class="rc-header">
          <div class="rc-stars">${'★'.repeat(review.score)}${'☆'.repeat(5 - review.score)}</div>
          <div class="rc-date">${new Date(review.createdAt).toLocaleDateString()}</div>
        </div>
        <div class="rc-comment">${review.comment || 'No comment provided.'}</div>
        <div class="rc-meta">Project: ${review.teamName || 'Team Project'}</div>
      </div>
    `).join('') : '<div style="color:var(--text-3); padding:2rem; text-align:center;">No ratings received yet.</div>';
  } catch (error) {
    console.error('Failed to fetch ratings:', error);
  }
}

async function fetchTeammatesToRate() {
  const teamId = localStorage.getItem('bb_team_id');
  const myId = localStorage.getItem('bb_user_id');
  const list = document.getElementById('teammates-to-rate-list');
  const projectRef = document.getElementById('current-project-ref');

  if (!teamId || !list) {
    if (list) list.innerHTML = '<div style="color:var(--text-3); padding:2rem; text-align:center;">You are not in a team. Join one to rate teammates!</div>';
    return;
  }

  try {
    const res = await apiFetch(`/teams/${teamId}`);
    const team = res.data;
    projectRef.textContent = team.name;

    const teammates = team.members.filter((member) => String(member.id) !== String(myId));
    if (!teammates.length) {
      list.innerHTML = '<div style="color:var(--text-3); padding:2rem; text-align:center;">No other teammates to rate yet.</div>';
      return;
    }

    list.innerHTML = teammates.map((member) => {
      const colors = ['#f59e0b', '#10b981', '#8b5cf6', '#3b82f6'];
      const color = colors[member.id % colors.length];
      const initials = member.fullName.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2);

      return `
        <div class="rate-card" id="rate-${member.id}">
          <div class="rtc-head">
            <div class="rtc-user">
              <div class="rtc-avatar" style="background:${color}">${initials}</div>
              <div class="rtc-name">${member.fullName}</div>
            </div>
            <div class="rtc-status" id="rtc-status-${member.id}">Pending Review</div>
          </div>
          <div class="rtc-body">
            <div class="rtc-row">
              <span class="rtc-label">Overall Score</span>
              <div class="star-rating" data-target="${member.id}">
                <span class="star" data-val="1" onclick="setRating(this)">★</span>
                <span class="star" data-val="2" onclick="setRating(this)">★</span>
                <span class="star" data-val="3" onclick="setRating(this)">★</span>
                <span class="star" data-val="4" onclick="setRating(this)">★</span>
                <span class="star" data-val="5" onclick="setRating(this)">★</span>
              </div>
            </div>
            <div class="rtc-comment-wrap">
              <textarea placeholder="Share short feedback for ${member.fullName.split(' ')[0]}..." id="comment-${member.id}"></textarea>
            </div>
          </div>
          <div class="rtc-footer">
            <button class="btn-submit-rating" onclick="submitTeammateRating(${member.id}, '${member.fullName.replace(/'/g, "\\'")}')">Submit Review</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Failed to load teammates:', error);
  }
}

async function submitTeammateRating(personId, personName) {
  const teamId = localStorage.getItem('bb_team_id');
  const score = localRatingData[personId];
  if (!score) {
    showToast('Please select a rating before submitting', 'error');
    return;
  }

  const comment = document.getElementById(`comment-${personId}`).value.trim();
  try {
    await apiFetch('/ratings', {
      method: 'POST',
      body: JSON.stringify({
        rateeId: personId,
        teamId,
        score,
        comment
      })
    });

    const statusEl = document.getElementById(`rtc-status-${personId}`);
    if (statusEl) statusEl.innerHTML = `<span class="rated-badge">✓ Rated ${score}/5</span>`;

    const card = document.getElementById(`rate-${personId}`);
    if (card) {
      card.classList.add('rated');
      card.querySelector('.rtc-body').style.opacity = '0.5';
      card.querySelector('.rtc-body').style.pointerEvents = 'none';
      const submitBtn = card.querySelector('.btn-submit-rating');
      submitBtn.disabled = true;
      submitBtn.textContent = '✓ Rating Submitted';
    }

    showToast(`Rating submitted for ${personName}`, 'success');
  } catch (error) {
    showToast(error.message || 'Failed to submit rating', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchMyRatingsData();
  fetchTeammatesToRate();
});
