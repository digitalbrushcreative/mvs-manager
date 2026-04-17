/* Clubs dashboard — overview of all clubs */

const ClubsDashboardPage = (function () {
  function render(root) {
    const clubs = Store.getClubs();
    const members = Store.getClubMembers();
    const pupils = Store.getPupils();
    const trips = Store.getTrips();

    root.appendChild(html`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div>
          <h1 style="font-family:var(--display); font-weight:700; font-size:22px; color:var(--navy-deep); letter-spacing:-0.01em;">Club Manager</h1>
          <p style="color:var(--grey-500); font-size:13px; margin-top:4px;">${clubs.length} club${clubs.length === 1 ? '' : 's'} · ${members.length} active membership${members.length === 1 ? '' : 's'}</p>
        </div>
        <button class="btn btn-primary" id="dashNewClub">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New club
        </button>
      </div>
    `);
    root.querySelector('#dashNewClub').addEventListener('click', () => ClubForm.open());

    // KPIs
    const activeClubs = clubs.filter(c => c.status === 'active').length;
    const uniqueMembers = new Set(members.map(m => m.pupilId)).size;
    const avgMembership = clubs.length ? (members.length / clubs.length).toFixed(1) : 0;
    const linkedTrips = trips.filter(t => (t.clubIds || []).length > 0).length;
    const pupilsInAtLeastOneClub = uniqueMembers;
    const pupilsInNone = Math.max(0, pupils.length - pupilsInAtLeastOneClub);

    root.appendChild(KPI.grid([
      { label: 'Active clubs', value: activeClubs, unit: `/ ${clubs.length}`, sub: 'Currently running' },
      { label: 'Total memberships', value: members.length, accent: 'navy', sub: `avg <strong>${avgMembership}</strong> per club` },
      { label: 'Pupils in a club', value: pupilsInAtLeastOneClub, accent: 'success', sub: `<strong>${pupilsInNone}</strong> not in any club` },
      { label: 'Linked trips', value: linkedTrips, accent: 'gold', sub: 'Trips tagged with a club' },
    ]));

    // Charts: membership distribution + pupils by club count
    const insights = html`<div class="insights-section"></div>`;
    insights.appendChild(html`
      <div class="insights-head">
        <h2 class="insights-title">Membership overview</h2>
        <div class="insights-sub">Distribution across all clubs</div>
      </div>
    `);
    const grid = html`<div class="insights-grid"></div>`;
    insights.appendChild(grid);

    // Club membership — compact tile grid
    const sizeBody = html`<div class="mini-tile-grid"></div>`;
    clubs.forEach(c => {
      const mem = members.filter(m => m.clubId === c.id);
      const pct = pupils.length ? Math.round((mem.length / pupils.length) * 100) : 0;
      const captains = mem.filter(m => m.role === 'captain').length;
      const tile = html`
        <div class="mini-tile">
          <div class="mini-tile-head">
            <div class="mini-tile-dot" style="background:${c.colour};"></div>
            <span class="mini-tile-name">${c.emoji} ${escapeHtml(c.name)}</span>
            <span class="mini-tile-count">${mem.length}</span>
          </div>
          <div class="mini-tile-bar"><div style="width:${pct}%; background:${c.colour};"></div></div>
          <div class="mini-tile-sub">${pct}% of pupils${captains ? ` · ${captains} capt.` : ''}</div>
        </div>
      `;
      sizeBody.appendChild(tile);
    });
    grid.appendChild(chartCard('Membership per club', `${members.length} total memberships across ${clubs.length} clubs`, sizeBody, 'wide'));

    // Pupil engagement donut
    const countByPupil = {};
    members.forEach(m => { countByPupil[m.pupilId] = (countByPupil[m.pupilId] || 0) + 1; });
    const noClub = pupils.length - Object.keys(countByPupil).length;
    const oneClub = Object.values(countByPupil).filter(n => n === 1).length;
    const twoClubs = Object.values(countByPupil).filter(n => n === 2).length;
    const threePlus = Object.values(countByPupil).filter(n => n >= 3).length;
    const engagementCard = chartCard(
      'Pupil engagement',
      `${pupils.length} pupils school-wide`,
      Charts.donut({
        segments: [
          { label: 'In no club',     value: noClub,     color: 'var(--grey-300)' },
          { label: 'In 1 club',      value: oneClub,    color: 'var(--info)' },
          { label: 'In 2 clubs',     value: twoClubs,   color: 'var(--success)' },
          { label: 'In 3+ clubs',    value: threePlus,  color: 'var(--gold)' }
        ],
        centerLabel: 'pupils',
        centerValue: pupils.length
      })
    );
    grid.appendChild(engagementCard);

    // Meeting schedule — week calendar
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap = {};
    weekDays.forEach(d => dayMap[d] = []);
    clubs.forEach(c => { if (dayMap[c.meetingDay]) dayMap[c.meetingDay].push(c); });
    // Sort each day's clubs by meeting time
    Object.values(dayMap).forEach(cs => cs.sort((a, b) => (a.meetingTime || '').localeCompare(b.meetingTime || '')));
    const calBody = html`
      <div class="week-calendar">
        ${weekDays.map(day => `
          <div class="week-cell">
            <div class="week-cell-head">${day.slice(0, 3).toUpperCase()}</div>
            <div class="week-cell-body">
              ${dayMap[day].length
                ? dayMap[day].map(c => `
                  <div class="week-event" style="border-left-color:${c.colour};" title="${escapeHtml(c.name)} — ${escapeHtml(c.venue || '')}">
                    <div class="week-event-time">${escapeHtml(c.meetingTime || '')}</div>
                    <div class="week-event-name">${c.emoji} ${escapeHtml(c.name)}</div>
                  </div>
                `).join('')
                : '<div class="week-empty">—</div>'}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    grid.appendChild(chartCard('Meeting schedule', 'Week at a glance', calBody, 'wide'));

    root.appendChild(insights);

    // Quick club list
    const listCard = html`
      <div class="card" style="margin-top:20px;">
        <div class="card-head">
          <div class="card-title">All clubs <span class="tag">${clubs.length}</span></div>
          <button class="btn btn-light btn-sm" id="viewAllClubs">View all →</button>
        </div>
        <div id="clubListGrid" style="padding:20px;"></div>
      </div>
    `;
    root.appendChild(listCard);
    listCard.querySelector('#viewAllClubs').addEventListener('click', () => ClubsRouter.go('clubs'));

    const gridEl = listCard.querySelector('#clubListGrid');
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = 'repeat(auto-fill, minmax(260px, 1fr))';
    gridEl.style.gap = '14px';
    clubs.forEach(c => {
      const mem = members.filter(m => m.clubId === c.id).length;
      const linked = Store.getTripsForClub(c.id).length;
      const card = html`
        <div class="club-mini-card" data-club-id="${c.id}" style="padding:16px; background:var(--white); border:1px solid var(--grey-100); border-radius:var(--r-lg); cursor:pointer; transition:all var(--t-fast);">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <div style="width:42px; height:42px; background:${c.colour}; color:var(--white); border-radius:var(--r-md); display:grid; place-items:center; font-size:22px;">${c.emoji}</div>
            <div>
              <div style="font-family:var(--display); font-weight:700; font-size:15px; color:var(--navy-darker);">${escapeHtml(c.name)}</div>
              <div style="font-size:11px; color:var(--grey-500); text-transform:uppercase; letter-spacing:0.06em;">${escapeHtml(c.meetingDay)} · ${escapeHtml(c.meetingTime)}</div>
            </div>
          </div>
          <div style="font-size:12px; color:var(--grey-500); margin-bottom:10px; line-height:1.4;">${escapeHtml(c.leadStaff)}</div>
          <div style="display:flex; gap:12px; font-size:12px;">
            <div><strong style="color:var(--navy-darker);">${mem}</strong> <span style="color:var(--grey-500);">member${mem === 1 ? '' : 's'}</span></div>
            <div><strong style="color:var(--navy-darker);">${linked}</strong> <span style="color:var(--grey-500);">trip${linked === 1 ? '' : 's'}</span></div>
          </div>
        </div>
      `;
      card.addEventListener('mouseenter', () => { card.style.borderColor = 'var(--navy-soft)'; card.style.transform = 'translateY(-2px)'; card.style.boxShadow = 'var(--shadow-md)'; });
      card.addEventListener('mouseleave', () => { card.style.borderColor = 'var(--grey-100)'; card.style.transform = ''; card.style.boxShadow = ''; });
      card.addEventListener('click', () => ClubsRouter.go('detail', c.id));
      gridEl.appendChild(card);
    });
  }

  function chartCard(title, subtitle, chartNode, mod = '') {
    const card = html`
      <div class="insight-card ${mod}">
        <div class="insight-head">
          <div class="insight-title">${escapeHtml(title)}</div>
          ${subtitle ? `<div class="insight-sub">${escapeHtml(subtitle)}</div>` : ''}
        </div>
        <div class="insight-body"></div>
      </div>
    `;
    card.querySelector('.insight-body').appendChild(chartNode);
    return card;
  }

  return { render };
})();
