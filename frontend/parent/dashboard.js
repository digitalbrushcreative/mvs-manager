/* Parent dashboard — logged-in parent view. */

(async function () {
  const API = 'http://localhost:3001/api';

  // ---------- Session guard ----------
  const session = JSON.parse(localStorage.getItem('mvs-session') || 'null');
  if (!session?.token || session.user?.role !== 'parent') {
    location.replace('../login.html');
    return;
  }

  // ---------- Hydrate Storage cache from API ----------
  try {
    await Storage.bootstrap();
  } catch (err) {
    Toast.error('Could not load data: ' + err.message);
    return;
  }

  const user = session.user;
  document.getElementById('userName').textContent = user.name || 'Parent';
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('avatar').textContent = (user.name || user.email).slice(0, 2).toUpperCase();

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await fetch(API + '/auth/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.token }
      });
    } catch {}
    localStorage.removeItem('mvs-session');
    location.replace('../login.html');
  });

  renderPupils(user);
  renderInterests(user);

  // Live refresh every 20s so admin changes (payments, docs, status) surface automatically.
  setInterval(async () => {
    try {
      await Storage.bootstrap();
      renderPupils(user);
      renderInterests(user);
    } catch (err) {
      console.warn('[dashboard] refresh failed', err);
    }
  }, 20000);

  // ---------- Pupil cards ----------
  function renderPupils(user) {
    const root = document.getElementById('pupilsRoot');
    const allPupils = Storage.get('mvs-trips:pupils', []);
    const mine = allPupils.filter(p => (user.linkedPupilIds || []).includes(p.id));
    if (!mine.length) {
      root.innerHTML = '<div class="empty">No children on record. Check back after expressing interest in a trip.</div>';
      return;
    }
    root.innerHTML = '';
    mine.forEach(p => root.appendChild(pupilCard(p)));
  }

  function pupilCard(p) {
    const trips = Storage.get('mvs-trips:trips', []);
    const trip = trips.find(t => t.id === p.tripId);
    const payments = Storage.get('mvs-trips:payments', []).filter(pay => pay.pupilId === p.id);
    const docs = Storage.get('mvs-trips:documents', []).filter(d => d.pupilId === p.id);
    const docTypes = Storage.get('mvs-trips:document-types', []);

    const total = (trip?.costPerPupil || 0);
    const paid = payments.reduce((s, x) => s + Number(x.amount || 0), 0);
    const balance = Math.max(0, total - paid);
    const pct = total ? Math.min(100, (paid / total) * 100) : 0;
    const curr = trip?.currency === 'KES' ? 'KSh' : trip?.currency === 'GBP' ? '£' : trip?.currency === 'EUR' ? '€' : '$';

    const missingCount = docs.filter(d => d.status === 'missing').length;
    const profileBits = [];
    if (!p.dob) profileBits.push('date of birth');
    if (!p.medicalNotes) profileBits.push('medical info');
    if (!p.dietaryNotes) profileBits.push('dietary info');

    // Clubs the pupil belongs to
    const clubs = Storage.get('mvs-trips:clubs', []);
    const memberships = Storage.get('mvs-trips:club-members', []).filter(m => m.pupilId === p.id);
    const pupilClubs = memberships.map(m => ({ ...m, club: clubs.find(c => c.id === m.clubId) })).filter(x => x.club);

    const card = document.createElement('article');
    card.className = 'pupil-card';
    card.innerHTML = `
      <div class="pupil-card-head">
        <div>
          <h3>${escapeHtml(p.firstName)} ${escapeHtml(p.lastName)}</h3>
          <div class="trip">Grade ${p.grade} · ${escapeHtml(trip?.name || 'Unassigned')}</div>
          ${p.confirmedByGuardian ? `<div style="margin-top:6px; font-size:12px; color:var(--success); font-weight:600;">✓ Attendance confirmed ${p.confirmedAt ? '· ' + new Date(p.confirmedAt).toLocaleDateString() : ''}</div>` : ''}
        </div>
        <span class="status-pill status-${p.paymentStatus}">${escapeHtml(p.paymentStatus)}</span>
      </div>

      ${(!p.confirmedByGuardian || missingCount || profileBits.length) ? `
        <div style="background:var(--warning-soft); border:1px solid #f3e2b8; border-radius:var(--r-md); padding:12px 14px; margin-bottom:14px; font-size:13px;">
          <strong style="color:var(--warning); display:block; margin-bottom:4px;">Action needed</strong>
          <ul style="margin:4px 0 0; padding-left:18px; color:var(--grey-700);">
            ${!p.confirmedByGuardian ? '<li>Confirm your child\'s attendance</li>' : ''}
            ${profileBits.length ? `<li>Provide ${profileBits.join(', ')}</li>` : ''}
            ${missingCount ? `<li>Submit ${missingCount} missing document${missingCount === 1 ? '' : 's'}</li>` : ''}
          </ul>
        </div>
      ` : ''}

      <div>
        <div style="display:flex; justify-content:space-between; font-size:13px; color:var(--grey-700);">
          <span>Paid <strong>${curr}${paid.toLocaleString()}</strong></span>
          <span>of ${curr}${total.toLocaleString()}</span>
        </div>
        <div class="payment-bar"><div class="payment-bar-fill" style="width:${pct}%;"></div></div>
        <div class="payment-meta">
          <span>${payments.length} payment${payments.length === 1 ? '' : 's'} recorded</span>
          <span>${balance > 0 ? 'Balance ' + curr + balance.toLocaleString() : 'Fully paid'}</span>
        </div>
      </div>

      <div style="margin-top:18px;">
        <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:var(--grey-500); font-weight:600;">Documents</div>
        ${p.confirmedByGuardian
          ? (docs.length ? `<ul class="doc-list">${docs.map(d => {
              const type = docTypes.find(dt => dt.id === d.typeId);
              return `
                <li class="doc-item ${d.status}">
                  <div class="doc-icon">${type?.abbr || '?'}</div>
                  <div class="doc-name">${escapeHtml(type?.name || 'Document')}</div>
                  <div class="doc-status">${d.status}</div>
                </li>
              `;
            }).join('')}</ul>` : '<div style="color:var(--grey-400); font-size:13px; margin-top:6px;">No document requirements yet.</div>')
          : `<div style="margin-top:6px; padding:10px 12px; background:var(--grey-50); border:1px dashed var(--grey-200); border-radius:var(--r-md); font-size:13px; color:var(--grey-500);">🔒 Confirm ${escapeHtml(p.firstName)}'s attendance to see and upload documents.</div>`
        }
      </div>

      ${pupilClubs.length ? `
        <div style="margin-top:16px;">
          <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:var(--grey-500); font-weight:600; margin-bottom:6px;">Clubs</div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            ${pupilClubs.map(({ club, role }) => `
              <span style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px; background:${club.colour}; color:var(--white); border-radius:999px; font-size:12px; font-weight:600;">
                ${club.emoji} ${escapeHtml(club.name)}${role !== 'member' ? ' · ' + role : ''}
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div style="margin-top:18px; display:flex; gap:10px;">
        <button class="trip-card-interest" style="flex:1;" data-manage>Manage details</button>
      </div>
    `;
    card.querySelector('[data-manage]').addEventListener('click', () => openManageModal(p, trip));
    return card;
  }

  // ---------- Manage modal ----------
  function openManageModal(pupil, trip) {
    const docs = Storage.get('mvs-trips:documents', []).filter(d => d.pupilId === pupil.id);
    const docTypes = Storage.get('mvs-trips:document-types', []);
    const body = document.createElement('div');
    body.innerHTML = `
      <form id="manageForm" style="display:flex; flex-direction:column; gap:16px;">
        <div style="padding:14px 16px; background:${pupil.confirmedByGuardian ? 'var(--success-soft)' : 'var(--grey-50)'}; border-radius:var(--r-md);">
          <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:600; color:${pupil.confirmedByGuardian ? 'var(--success)' : 'var(--grey-900)'};">
            <input type="checkbox" name="confirmed" ${pupil.confirmedByGuardian ? 'checked' : ''} style="width:18px; height:18px;">
            I confirm ${escapeHtml(pupil.firstName)} will attend this trip
          </label>
          <div style="font-size:12px; color:var(--grey-500); margin-top:4px; padding-left:28px;">Tick this to let the trips team know attendance is confirmed.</div>
        </div>

        <div>
          <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--grey-500); font-weight:700; margin-bottom:10px;">Personal details</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div class="form-field">
              <label style="display:block; font-size:12px; color:var(--grey-500); font-weight:600; margin-bottom:4px;">Date of birth</label>
              <input name="dob" type="date" value="${pupil.dob ? String(pupil.dob).slice(0, 10) : ''}" style="width:100%; padding:8px 10px; border:1px solid var(--grey-200); border-radius:var(--r-md); box-sizing:border-box;">
            </div>
            <div class="form-field">
              <label style="display:block; font-size:12px; color:var(--grey-500); font-weight:600; margin-bottom:4px;">Guardian phone</label>
              <input name="guardianPhone" value="${escapeHtml(pupil.guardianPhone || '')}" style="width:100%; padding:8px 10px; border:1px solid var(--grey-200); border-radius:var(--r-md); box-sizing:border-box;">
            </div>
            <div class="form-field" style="grid-column: span 2;">
              <label style="display:block; font-size:12px; color:var(--grey-500); font-weight:600; margin-bottom:4px;">Guardian email</label>
              <input name="guardianEmail" type="email" value="${escapeHtml(pupil.guardianEmail || '')}" style="width:100%; padding:8px 10px; border:1px solid var(--grey-200); border-radius:var(--r-md); box-sizing:border-box;">
            </div>
          </div>
        </div>

        <div>
          <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--grey-500); font-weight:700; margin-bottom:10px;">Health &amp; dietary</div>
          <div class="form-field" style="margin-bottom:10px;">
            <label style="display:block; font-size:12px; color:var(--grey-500); font-weight:600; margin-bottom:4px;">Medical notes <span style="color:var(--grey-400); font-weight:400;">— allergies, conditions, medication</span></label>
            <textarea name="medicalNotes" rows="2" style="width:100%; padding:8px 10px; border:1px solid var(--grey-200); border-radius:var(--r-md); box-sizing:border-box; font-family:var(--sans);">${escapeHtml(pupil.medicalNotes || '')}</textarea>
          </div>
          <div class="form-field" style="margin-bottom:10px;">
            <label style="display:block; font-size:12px; color:var(--grey-500); font-weight:600; margin-bottom:4px;">Dietary requirements</label>
            <textarea name="dietaryNotes" rows="2" style="width:100%; padding:8px 10px; border:1px solid var(--grey-200); border-radius:var(--r-md); box-sizing:border-box; font-family:var(--sans);">${escapeHtml(pupil.dietaryNotes || '')}</textarea>
          </div>
          <div class="form-field">
            <label style="display:block; font-size:12px; color:var(--grey-500); font-weight:600; margin-bottom:4px;">Anything else we should know?</label>
            <textarea name="note" rows="2" style="width:100%; padding:8px 10px; border:1px solid var(--grey-200); border-radius:var(--r-md); box-sizing:border-box; font-family:var(--sans);">${escapeHtml(pupil.note || '')}</textarea>
          </div>
        </div>

        <div>
          <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--grey-500); font-weight:700; margin-bottom:10px;">Documents</div>
          <div style="font-size:12px; color:var(--grey-500); margin-bottom:10px;">Tick each document you've already sent to the trips office (email or WhatsApp). Real file upload is coming soon.</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${docs.map(d => {
              const type = docTypes.find(dt => dt.id === d.typeId);
              const label = type?.name || 'Document';
              const sent = d.status !== 'missing';
              const verified = d.status === 'verified';
              return `
                <label style="display:flex; align-items:center; gap:12px; padding:10px 12px; background:${verified ? 'var(--success-soft)' : sent ? 'var(--info-soft)' : 'var(--grey-50)'}; border-radius:var(--r-md); cursor:${verified ? 'not-allowed' : 'pointer'}; ${verified ? 'opacity:0.7;' : ''}">
                  <input type="checkbox" data-doc-id="${d.id}" ${sent ? 'checked' : ''} ${verified ? 'disabled' : ''} style="width:16px; height:16px;">
                  <div style="flex:1;">
                    <div style="font-weight:600; font-size:13px; color:var(--grey-900);">${escapeHtml(label)}</div>
                    <div style="font-size:11px; color:var(--grey-500);">${verified ? '✓ Verified by school' : sent ? 'Marked as sent' : 'Not submitted'}</div>
                  </div>
                </label>
              `;
            }).join('')}
          </div>
        </div>
      </form>
    `;

    const modal = Modal.open({
      title: `Manage details — ${pupil.firstName} ${pupil.lastName}`,
      subtitle: trip?.name,
      body, size: 'lg',
      footer: [
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: 'Save changes', type: 'primary', onClick: () => save() }
      ]
    });

    function save() {
      try {
        const form = body.querySelector('#manageForm');
        const fd = new FormData(form);
        const wasConfirmed = !!pupil.confirmedByGuardian;
        const nowConfirmed = !!fd.get('confirmed');

        // Update pupil
        const pupils = Storage.get('mvs-trips:pupils', []);
        const idx = pupils.findIndex(x => x.id === pupil.id);
        if (idx !== -1) {
          pupils[idx] = {
            ...pupils[idx],
            dob: fd.get('dob') || null,
            guardianPhone: (fd.get('guardianPhone') || '').toString().trim(),
            guardianEmail: (fd.get('guardianEmail') || '').toString().trim(),
            medicalNotes: (fd.get('medicalNotes') || '').toString().trim(),
            dietaryNotes: (fd.get('dietaryNotes') || '').toString().trim(),
            note: (fd.get('note') || '').toString().trim(),
            confirmedByGuardian: nowConfirmed,
            confirmedAt: nowConfirmed && !wasConfirmed ? new Date().toISOString() : pupils[idx].confirmedAt || null
          };
          Storage.set('mvs-trips:pupils', pupils);
        }

        // Update documents — each ticked missing/pending doc becomes 'submitted'
        const allDocs = Storage.get('mvs-trips:documents', []);
        form.querySelectorAll('[data-doc-id]').forEach(cb => {
          if (cb.disabled) return;
          const doc = allDocs.find(d => d.id === cb.dataset.docId);
          if (!doc) return;
          if (cb.checked && doc.status === 'missing') {
            doc.status = 'submitted';
            doc.filename = doc.filename || `parent-upload-${doc.id}.pdf`;
            doc.uploadedAt = new Date().toISOString();
          } else if (!cb.checked && doc.status === 'submitted') {
            doc.status = 'missing';
            doc.filename = '';
            doc.uploadedAt = null;
          }
        });
        Storage.set('mvs-trips:documents', allDocs);

        Toast.success(nowConfirmed && !wasConfirmed ? 'Attendance confirmed — thank you' : 'Details saved');
        modal.close();
        renderPupils(user);
      } catch (err) {
        console.error('[Manage] save failed', err);
        Toast.error('Save failed: ' + (err.message || err));
      }
    }
  }

  // ---------- Interest rows ----------
  function renderInterests(user) {
    const root = document.getElementById('interestsRoot');
    const all = Storage.get('mvs-trips:interests', []);
    const tokens = new Set(user.linkedInterestTokens || []);
    const mine = all.filter(i =>
      tokens.has(i.token) ||
      (i.parentEmail || '').toLowerCase() === user.email.toLowerCase()
    );
    if (!mine.length) {
      root.innerHTML = '<div class="empty">You haven\'t expressed interest in any trips yet. <a href="./">Browse trips →</a></div>';
      return;
    }
    const trips = Storage.get('mvs-trips:trips', []);
    root.innerHTML = mine.map(i => {
      const trip = trips.find(t => t.id === i.tripId);
      const seatMsg = seatStatus(i, trip);
      return `
        <div class="interest-row">
          <div>
            <div class="ttl">${escapeHtml(trip?.name || 'Unknown trip')} <span style="color:var(--grey-400); font-weight:400;">· for ${escapeHtml(i.pupilName)}</span></div>
            <div class="sub">Submitted ${new Date(i.submittedAt).toLocaleDateString()} · ${seatMsg}</div>
          </div>
          <span class="badge badge-${badgeClass(i.status)}">${statusLabel(i.status)}</span>
        </div>
      `;
    }).join('');
  }

  function seatStatus(interest, trip) {
    if (interest.status === 'converted') return `Seat confirmed ✓`;
    if (interest.status === 'declined') return `Not proceeding`;
    if (!trip) return 'Awaiting review';
    const pupils = Storage.get('mvs-trips:pupils', []).filter(p => p.tripId === trip.id).length;
    const used = pupils + (trip.chaperones || 0) + (trip.parentsJoining || 0);
    const left = Math.max(0, (trip.seatsTotal || 0) - used);
    if (left === 0) return `Waitlist — trip full (${used}/${trip.seatsTotal})`;
    return `Reviewing · ${left} seat${left === 1 ? '' : 's'} currently available`;
  }

  function statusLabel(status) {
    return ({
      'new': 'New',
      'contacted': 'Contacted',
      'awaiting-details': 'Awaiting details',
      'submitted': 'Details submitted',
      'converted': 'Seat confirmed',
      'declined': 'Declined'
    })[status] || status;
  }
  function badgeClass(status) {
    return ({
      'new': 'new',
      'contacted': 'contacted',
      'awaiting-details': 'awaiting',
      'submitted': 'submitted',
      'converted': 'converted',
      'declined': 'declined'
    })[status] || 'new';
  }
})();
