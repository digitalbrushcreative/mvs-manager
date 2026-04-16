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

    const card = document.createElement('article');
    card.className = 'pupil-card';
    card.innerHTML = `
      <div class="pupil-card-head">
        <div>
          <h3>${escapeHtml(p.firstName)} ${escapeHtml(p.lastName)}</h3>
          <div class="trip">Grade ${p.grade} · ${escapeHtml(trip?.name || 'Unassigned')}</div>
        </div>
        <span class="status-pill status-${p.paymentStatus}">${escapeHtml(p.paymentStatus)}</span>
      </div>

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
        ${docs.length ? `<ul class="doc-list">${docs.map(d => {
          const type = docTypes.find(dt => dt.id === d.typeId);
          return `
            <li class="doc-item ${d.status}">
              <div class="doc-icon">${type?.abbr || '?'}</div>
              <div class="doc-name">${escapeHtml(type?.name || 'Document')}</div>
              <div class="doc-status">${d.status}</div>
            </li>
          `;
        }).join('')}</ul>` : '<div style="color:var(--grey-400); font-size:13px; margin-top:6px;">No document requirements yet.</div>'}
        ${docs.some(d => d.status === 'missing') ? '<p style="font-size:13px; color:var(--grey-500); margin-top:12px;">Missing documents should be sent to the trips coordinator by the deadline. Upload support coming soon.</p>' : ''}
      </div>
    `;
    return card;
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
