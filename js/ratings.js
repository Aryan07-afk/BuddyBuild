/* ============================================================
   BUDDYBUILD — Ratings Page Logic
   ============================================================ */

// Store ratings per person
const ratingData = {};

/* ── Star Rating interaction ── */
function setRating(starEl) {
  const container = starEl.closest('.star-rating');
  const val       = parseInt(starEl.dataset.val);
  const field     = container.dataset.field;
  const target    = container.dataset.target;

  if (!ratingData[target]) ratingData[target] = {};
  ratingData[target][field] = val;

  // Update star display
  container.querySelectorAll('.star').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.val) <= val);
  });
}

// Hover preview
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.star-rating').forEach(container => {
    const stars = container.querySelectorAll('.star');
    stars.forEach(star => {
      star.addEventListener('mouseover', () => {
        const hoverVal = parseInt(star.dataset.val);
        stars.forEach(s => {
          s.style.color = parseInt(s.dataset.val) <= hoverVal ? 'var(--accent)' : 'var(--surface-3)';
          s.style.filter = parseInt(s.dataset.val) <= hoverVal
            ? 'drop-shadow(0 0 4px var(--accent-glow))'
            : 'none';
        });
      });
      star.addEventListener('mouseleave', () => {
        const target = container.dataset.target;
        const field  = container.dataset.field;
        const saved  = ratingData[target]?.[field] || 0;
        stars.forEach(s => {
          const active = parseInt(s.dataset.val) <= saved;
          s.style.color = active ? 'var(--accent)' : 'var(--surface-3)';
          s.style.filter = active ? 'drop-shadow(0 0 4px var(--accent-glow))' : 'none';
        });
      });
    });
  });
});

/* ── Submit Rating ── */
function submitRating(personId, personName) {
  const data = ratingData[personId] || {};
  const fields = ['teamwork', 'punctuality', 'technicality', 'communication'];
  const missing = fields.filter(f => !data[f]);

  if (missing.length > 0) {
    showToast(`Please rate all categories (${missing.join(', ')} missing)`, 'error');
    return;
  }

  // Calculate average
  const avg = (fields.reduce((sum, f) => sum + data[f], 0) / fields.length).toFixed(1);

  // Update status badge
  const statusEl = document.getElementById(`rtc-status-${personId}`);
  if (statusEl) {
    statusEl.innerHTML = `<span class="rated-badge">✓ Rated ${avg}/5</span>`;
  }

  // Style the card as rated
  const card = document.getElementById(`rate-${personId}`);
  if (card) {
    card.classList.add('rated');
    card.querySelector('.rtc-body').style.opacity = '0.5';
    card.querySelector('.rtc-body').style.pointerEvents = 'none';
    card.querySelector('.btn-submit-rating').disabled = true;
    card.querySelector('.btn-submit-rating').textContent = '✓ Rating Submitted';
  }

  showToast(`✓ Rating submitted for ${personName} (${avg}/5)`, 'success');
  updateOverallRating();
}

/* ── Update Overall rating display ── */
function updateOverallRating() {
  const allRatings = Object.values(ratingData);
  if (allRatings.length === 0) return;
  // Keep existing — in real app would recalculate from server data
}

/* ── Animate bars on load ── */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelectorAll('.rob-fill').forEach(bar => {
      const target = bar.style.width;
      bar.style.width = '0';
      setTimeout(() => { bar.style.width = target; }, 100);
    });
  }, 200);
});
