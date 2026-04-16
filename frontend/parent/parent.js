/* Parent-facing brochure + interest capture */

(function () {
  const API = 'http://localhost:3001/api';
  const root = document.getElementById('tripsRoot');

  const currencySymbol = (c) =>
    ({ USD: '$', KES: 'KSh', GBP: '£', EUR: '€' }[c] || '$');

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const daysBetween = (a, b) => {
    if (!a || !b) return null;
    return Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
  };

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- Bootstrap: return-visit or brochure ----------
  async function init() {
    const params = new URLSearchParams(location.search);
    const token = params.get('t');
    if (token) return renderReturnVisit(token);
    return renderBrochure();
  }

  // ---------- Brochure ----------
  let currentTrips = [];
  async function renderBrochure() {
    await loadAndRenderTrips();
    // Live refresh every 20s so admin changes surface automatically.
    setInterval(loadAndRenderTrips, 20000);
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-interest-trip]');
      if (btn) openInterestForm(btn.dataset.interestTrip, currentTrips.find(t => t.id === btn.dataset.interestTrip));
    });
  }

  async function loadAndRenderTrips() {
    try {
      const res = await fetch(`${API}/public/trips`);
      if (!res.ok) throw new Error('Could not load trips');
      const trips = await res.json();
      // Skip re-render if nothing changed (avoids flicker during polling).
      const sig = JSON.stringify(trips);
      if (sig === root._lastSig) return;
      root._lastSig = sig;
      currentTrips = trips;
      root.setAttribute('aria-busy', 'false');
      if (!trips.length) {
        root.innerHTML = '<div class="empty">No trips available right now. Check back soon.</div>';
        return;
      }
      root.innerHTML = trips.map(tripCard).join('');
    } catch (err) {
      root.setAttribute('aria-busy', 'false');
      if (!root._lastSig) root.innerHTML = `<div class="empty">Couldn't load trips. ${escapeHtml(err.message)}</div>`;
    }
  }

  function tripCard(t) {
    const days = daysBetween(t.startDate, t.endDate);
    const grades = (t.gradesAllowed || []).join(', ');
    const cost = `${currencySymbol(t.currency)}${Number(t.costPerPupil || 0).toLocaleString()}`;
    const acceptingInterest = !['closed', 'in-progress'].includes(t.status);
    const statusLabel = ({
      'draft': 'Planning', 'open': 'Open for registration',
      'closed': 'Registration closed', 'in-progress': 'Trip under way'
    })[t.status] || t.status;
    return `
      <article class="trip-card">
        <div class="trip-card-banner ${t.tripType === 'local' ? 'local' : ''}">
          <div style="display:flex; gap:6px; align-items:center; margin-bottom:10px;">
            <span class="trip-card-type">${escapeHtml(t.tripType || 'international')}</span>
            <span class="trip-card-type" style="background:rgba(255,255,255,0.08);">${escapeHtml(statusLabel)}</span>
          </div>
          <h2 class="trip-card-title">${escapeHtml(t.name)}</h2>
          <div class="trip-card-destination">${escapeHtml(t.destination || '')}</div>
        </div>
        <div class="trip-card-body">
          ${t.description ? `<p class="trip-card-description">${escapeHtml(t.description)}</p>` : ''}
          <div class="trip-card-meta">
            <div class="trip-card-meta-item">
              <span class="label">Dates</span>
              <span class="value">${fmtDate(t.startDate)}</span>
            </div>
            <div class="trip-card-meta-item">
              <span class="label">Returns</span>
              <span class="value">${fmtDate(t.endDate)}</span>
            </div>
            <div class="trip-card-meta-item">
              <span class="label">Duration</span>
              <span class="value">${days ? `${days} days` : '—'}</span>
            </div>
            <div class="trip-card-meta-item">
              <span class="label">Grades</span>
              <span class="value">${escapeHtml(grades)}</span>
            </div>
          </div>
          <div class="trip-card-cost">
            <div>
              <div class="amount">${cost}</div>
              <div class="per">per pupil · ${escapeHtml(t.currency || 'USD')}</div>
            </div>
          </div>
          ${acceptingInterest
            ? `<button class="trip-card-interest" data-interest-trip="${t.id}">I'm interested</button>`
            : `<button class="trip-card-interest" disabled style="background:var(--grey-300); cursor:not-allowed;">Not taking new registrations</button>`}
        </div>
      </article>
    `;
  }

  // ---------- Interest form ----------
  function openInterestForm(tripId, trip) {
    const body = document.createElement('div');
    body.innerHTML = `
      <form id="interestForm" novalidate>
        <div class="form-field">
          <label>Parent name <span class="required">*</span></label>
          <input name="parentName" required>
        </div>
        <div class="row-2">
          <div class="form-field">
            <label>Phone</label>
            <input name="parentPhone" placeholder="07XX XXX XXX">
          </div>
          <div class="form-field">
            <label>Email</label>
            <input name="parentEmail" type="email">
          </div>
        </div>
        <div class="row-2">
          <div class="form-field">
            <label>Pupil name <span class="required">*</span></label>
            <input name="pupilName" required>
          </div>
          <div class="form-field">
            <label>Grade</label>
            <input name="pupilGrade" type="number" min="1" max="12" placeholder="e.g. 7">
          </div>
        </div>
        <div class="form-field">
          <label>Anything else we should know?</label>
          <textarea name="note" rows="3" placeholder="Questions, concerns, or notes"></textarea>
        </div>
      </form>
    `;

    const modal = Modal.open({
      title: `Register interest`,
      subtitle: trip.name,
      body,
      size: 'md',
      footer: [
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: 'Submit', type: 'primary', onClick: () => submit() }
      ]
    });

    async function submit() {
      const fd = new FormData(body.querySelector('#interestForm'));
      const payload = {
        tripId,
        parentName: fd.get('parentName'),
        parentPhone: fd.get('parentPhone'),
        parentEmail: fd.get('parentEmail'),
        pupilName: fd.get('pupilName'),
        pupilGrade: fd.get('pupilGrade'),
        note: fd.get('note')
      };
      if (!payload.parentName?.trim() || !payload.pupilName?.trim()) {
        return Toast.error('Parent name and pupil name are required');
      }
      try {
        const res = await fetch(`${API}/public/interests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Submission failed');
        const { token } = await res.json();
        modal.close();
        showThanks(token);
      } catch (err) {
        Toast.error(err.message || 'Could not submit');
      }
    }
  }

  function showThanks(token) {
    const returnUrl = `${location.origin}${location.pathname}?t=${token}`;
    const body = document.createElement('div');
    body.innerHTML = `
      <div class="parent-thanks">
        <h3>Thank you — we've logged your interest</h3>
        <p>A member of our trips team will be in touch.</p>
        <p style="margin-top:20px;">Bookmark this private link to return later and add details or documents when we ask:</p>
        <div style="margin-top:12px; padding:12px; background:var(--grey-50); border:1px solid var(--grey-100); border-radius:var(--r-md); word-break:break-all; font-family:var(--mono); font-size:12px;">
          ${escapeHtml(returnUrl)}
        </div>
      </div>
    `;
    Modal.open({
      title: 'Interest received',
      body,
      size: 'md',
      footer: [
        { label: 'Copy link', type: 'light', onClick: () => { navigator.clipboard.writeText(returnUrl); Toast.success('Link copied'); } },
        { label: 'Done', type: 'primary', onClick: (m) => { m.close(); location.search = ''; } }
      ]
    });
  }

  // ---------- Return visit ----------
  async function renderReturnVisit(token) {
    root.setAttribute('aria-busy', 'false');
    try {
      const res = await fetch(`${API}/public/interests/token/${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error('We could not find that submission');
      const rec = await res.json();
      document.querySelector('.parent-hero h1').textContent = 'Your trip submission';
      document.querySelector('.parent-hero p').textContent =
        rec.trip
          ? `You expressed interest in ${rec.trip.name}. Use this page to update your details as we request them.`
          : 'Use this page to update your details as we request them.';
      root.innerHTML = submissionView(rec);
      wireSubmissionView(root, rec);
    } catch (err) {
      root.innerHTML = `<div class="empty">${escapeHtml(err.message)}</div>`;
    }
  }

  function submissionView(rec) {
    const t = rec.trip;
    return `
      <article class="trip-card" style="grid-column: 1 / -1; max-width: 720px; margin: 0 auto;">
        ${t ? `
          <div class="trip-card-banner ${t.tripType === 'local' ? 'local' : ''}">
            <span class="trip-card-type">${escapeHtml(t.tripType || 'international')} · status: ${escapeHtml(rec.status)}</span>
            <h2 class="trip-card-title">${escapeHtml(t.name)}</h2>
            <div class="trip-card-destination">${escapeHtml(t.destination || '')} · ${fmtDate(t.startDate)} → ${fmtDate(t.endDate)}</div>
          </div>
        ` : ''}
        <div class="trip-card-body">
          <form id="submissionForm">
            <h3 style="margin:4px 0 14px; font-family:var(--display); color:var(--navy-darker);">Parent &amp; pupil</h3>
            <div class="form-field">
              <label>Parent name</label>
              <input value="${escapeHtml(rec.parentName)}" disabled>
            </div>
            <div class="row-2">
              <div class="form-field"><label>Phone</label><input name="parentPhone" value="${escapeHtml(rec.parentPhone)}"></div>
              <div class="form-field"><label>Email</label><input name="parentEmail" type="email" value="${escapeHtml(rec.parentEmail)}"></div>
            </div>
            <div class="row-2">
              <div class="form-field"><label>Pupil name</label><input value="${escapeHtml(rec.pupilName)}" disabled></div>
              <div class="form-field"><label>Grade</label><input name="pupilGrade" type="number" value="${rec.pupilGrade ?? ''}"></div>
            </div>
            <div class="row-2">
              <div class="form-field"><label>Date of birth</label><input name="dob" type="date" value="${rec.dob ? String(rec.dob).slice(0,10) : ''}"></div>
              <div class="form-field"></div>
            </div>

            <h3 style="margin:18px 0 14px; font-family:var(--display); color:var(--navy-darker);">Medical &amp; dietary</h3>
            <div class="form-field"><label>Medical notes</label><textarea name="medicalNotes" rows="2">${escapeHtml(rec.medicalNotes)}</textarea></div>
            <div class="form-field"><label>Dietary notes</label><textarea name="dietaryNotes" rows="2">${escapeHtml(rec.dietaryNotes)}</textarea></div>
            <div class="form-field"><label>Additional notes</label><textarea name="additionalNotes" rows="2">${escapeHtml(rec.additionalNotes)}</textarea></div>

            ${rec.documentsRequested && rec.documentsRequested.length ? `
              <h3 style="margin:18px 0 8px; font-family:var(--display); color:var(--navy-darker);">Documents requested</h3>
              <p style="margin:0 0 10px; color:var(--grey-500); font-size:13px;">Our team has asked for the following. Tick the ones you've already sent to us by email or WhatsApp.</p>
              <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:18px;">
                ${rec.documentsRequested.map(d => {
                  const submitted = (rec.documentsSubmitted || []).includes(d);
                  return `<label style="display:flex; align-items:center; gap:10px; font-weight:500; color:var(--grey-700);">
                    <input type="checkbox" data-doc="${escapeHtml(d)}" ${submitted ? 'checked' : ''}>
                    ${escapeHtml(d)}
                  </label>`;
                }).join('')}
              </div>
            ` : ''}

            <button type="button" id="saveBtn" class="trip-card-interest">Save updates</button>
          </form>
        </div>
      </article>
    `;
  }

  function wireSubmissionView(container, rec) {
    const form = container.querySelector('#submissionForm');
    container.querySelector('#saveBtn').addEventListener('click', async () => {
      const fd = new FormData(form);
      const docs = Array.from(form.querySelectorAll('[data-doc]:checked')).map(cb => cb.dataset.doc);
      const patch = {
        parentPhone: fd.get('parentPhone') || '',
        parentEmail: fd.get('parentEmail') || '',
        pupilGrade: fd.get('pupilGrade') ? Number(fd.get('pupilGrade')) : null,
        dob: fd.get('dob') || null,
        medicalNotes: fd.get('medicalNotes') || '',
        dietaryNotes: fd.get('dietaryNotes') || '',
        additionalNotes: fd.get('additionalNotes') || '',
        documentsSubmitted: docs
      };
      try {
        const res = await fetch(`${API}/public/interests/token/${encodeURIComponent(rec.token)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
        if (!res.ok) throw new Error('Save failed');
        Toast.success('Saved');
      } catch (err) {
        Toast.error(err.message || 'Could not save');
      }
    });
  }

  init();
})();
