/* Club detail — members, linked trips, actions */

const ClubDetailPage = (function () {
  function render(root, clubId) {
    const club = Store.getClub(clubId);
    if (!club) {
      root.appendChild(html`<div class="card"><div class="empty-state"><h3>Club not found</h3><p><button class="btn btn-light" onclick="ClubsRouter.go('clubs')">Back to clubs</button></p></div></div>`);
      return;
    }

    const members = Store.getMembersOfClub(club.id);
    const pupils = Store.getPupils();
    const linkedTrips = Store.getTripsForClub(club.id);

    // Header banner
    const banner = html`
      <div class="club-header" style="background:linear-gradient(135deg, ${club.colour}, ${club.colour}dd);">
        <div class="club-header-inner">
          <button class="back-link" id="backBtn">← All clubs</button>
          <div style="display:flex; gap:16px; align-items:center; margin-top:6px;">
            <div style="width:64px; height:64px; background:rgba(255,255,255,0.15); border-radius:var(--r-md); display:grid; place-items:center; font-size:36px;">${club.emoji}</div>
            <div style="flex:1;">
              <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.1em; opacity:0.8;">${escapeHtml(club.status)} · ${escapeHtml(club.meetingDay)} ${escapeHtml(club.meetingTime)} · ${escapeHtml(club.venue || 'No venue set')}</div>
              <h1 style="font-family:var(--display); font-weight:700; font-size:28px; margin:4px 0 2px;">${escapeHtml(club.name)}</h1>
              <div style="font-size:13px; opacity:0.85;">Led by ${escapeHtml(club.leadStaff || 'no lead assigned')}</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button class="btn btn-ghost" id="editClubBtn" style="background:rgba(255,255,255,0.12); border-color:rgba(255,255,255,0.2); color:var(--white);">Edit club</button>
              <button class="btn btn-primary" id="addMemberBtn">+ Add member</button>
            </div>
          </div>
          ${club.description ? `<p style="margin:14px 0 0; opacity:0.9; max-width:800px; font-size:13px; line-height:1.5;">${escapeHtml(club.description)}</p>` : ''}
        </div>
      </div>
    `;
    root.appendChild(banner);
    banner.querySelector('#backBtn').addEventListener('click', () => ClubsRouter.go('clubs'));
    banner.querySelector('#editClubBtn').addEventListener('click', () => ClubForm.open(club.id));
    banner.querySelector('#addMemberBtn').addEventListener('click', () => openAddMembers(club));

    // KPIs
    root.appendChild(KPI.grid([
      { label: 'Members', value: members.length, accent: 'navy' },
      { label: 'Captains', value: members.filter(m => m.role === 'captain').length, sub: 'Leadership roles' },
      { label: 'Committee', value: members.filter(m => m.role === 'committee').length, sub: 'Committee members' },
      { label: 'Linked trips', value: linkedTrips.length, accent: 'gold', sub: 'Current + upcoming' }
    ]));

    // Linked trips card
    const tripsCard = html`
      <div class="card" style="margin-top:20px;">
        <div class="card-head">
          <div class="card-title">Linked trips <span class="tag">${linkedTrips.length}</span></div>
          <a class="btn btn-light btn-sm" href="index.html">Open Trip Manager ↗</a>
        </div>
        <div id="linkedTripsBody" style="padding:16px;"></div>
      </div>
    `;
    root.appendChild(tripsCard);
    const tripsBody = tripsCard.querySelector('#linkedTripsBody');
    if (!linkedTrips.length) {
      tripsBody.appendChild(html`<div style="padding:24px; text-align:center; color:var(--grey-500); font-size:13px;">No trips tagged with this club yet. In Trip Manager, use the Clubs field on the trip form.</div>`);
    } else {
      const grid = html`<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px;"></div>`;
      linkedTrips.forEach(t => {
        const stats = Store.tripStats(t.id) || {};
        const row = html`
          <div class="trip-list-row" data-trip-id="${t.id}" style="grid-template-columns: 6px 1fr; cursor:pointer;">
            <div class="stripe ${t.status === 'open' ? 'crimson' : t.status === 'draft' ? 'grey' : ''}"></div>
            <div style="padding:12px 14px;">
              <div style="font-family:var(--display); font-weight:700; font-size:14px; color:var(--navy-darker);">${escapeHtml(t.name)}</div>
              <div style="font-size:11px; color:var(--grey-500); text-transform:uppercase; letter-spacing:0.06em; margin-top:2px;">${escapeHtml(t.code)} · ${escapeHtml(t.status)}</div>
              <div style="margin-top:10px; font-size:12px; color:var(--grey-500);">${stats.enrolled || 0}/${t.seatsTotal || 0} pupils · ${Fmt.date(t.startDate)}</div>
            </div>
          </div>
        `;
        row.addEventListener('click', () => {
          Store.setActiveTrip(t.id);
          location.href = 'index.html';
        });
        grid.appendChild(row);
      });
      tripsBody.appendChild(grid);
    }

    // Members card
    const membersCard = html`
      <div class="card" style="margin-top:20px;">
        <div class="card-head"><div class="card-title">Members <span class="tag">${members.length}</span></div></div>
        <div id="tableMount"></div>
        <div id="tableFooter"></div>
      </div>
    `;
    root.appendChild(membersCard);

    const rows = members.map(m => {
      const p = pupils.find(x => x.id === m.pupilId);
      return {
        id: m.id,
        pupilId: m.pupilId,
        pupilName: p ? `${p.firstName} ${p.lastName}` : '(deleted pupil)',
        grade: p?.grade ?? '—',
        gender: p?.gender || '',
        role: m.role,
        joinedAt: m.joinedAt
      };
    });

    const tbl = Table.create({
      columns: [
        {
          key: 'pupilName', label: 'Member', sortable: true,
          render: (r) => `<div class="student-cell"><div class="stu-avatar ${String(r.gender).toLowerCase()}">${Fmt.initials(r.pupilName)}</div><div><div class="stu-name">${escapeHtml(r.pupilName)}</div><div class="stu-meta">Grade ${r.grade}</div></div></div>`
        },
        {
          key: 'role', label: 'Role', width: '160px',
          render: (r) => `<select data-role-for="${r.id}" class="form-select" style="padding:4px 8px; font-size:12px; width:auto;">
            ${Schema.ClubMemberRole.map(x => `<option value="${x}" ${r.role === x ? 'selected' : ''}>${Fmt.capitalize(x)}</option>`).join('')}
          </select>`
        },
        { key: 'joinedAt', label: 'Joined', width: '140px', render: (r) => Fmt.date(r.joinedAt) },
        {
          key: 'actions', label: '', width: '80px', align: 'right',
          render: (r) => `<div class="row-action"><button data-remove="${r.id}">Remove</button></div>`
        }
      ],
      rows,
      pageSize: 15,
      emptyState: { title: 'No members yet', description: 'Click "Add member" above to enrol pupils.' }
    });
    membersCard.querySelector('#tableMount').appendChild(tbl.el);
    membersCard.querySelector('#tableFooter').appendChild(tbl.footer);

    membersCard.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (!btn) return;
      e.stopPropagation();
      const id = btn.dataset.remove;
      Confirm.open({
        title: 'Remove member?', message: 'Remove this pupil from the club? They can be re-added later.',
        confirmLabel: 'Remove',
        onConfirm: () => { Store.removeClubMember(id); Toast.success('Removed'); }
      });
    });
    membersCard.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-role-for]');
      if (!sel) return;
      Store.updateClubMember(sel.dataset.roleFor, { role: sel.value });
      Toast.success('Role updated');
    });
  }

  // ---- Add members modal ----
  function openAddMembers(club) {
    const memberSet = new Set(Store.getMembersOfClub(club.id).map(m => m.pupilId));
    const pupils = Store.getPupils();
    const chosen = new Set();

    const body = document.createElement('div');
    body.innerHTML = `
      <div>
        <input type="search" id="memberSearch" class="form-input" placeholder="Search by name, grade, guardian…" style="margin-bottom:10px; width:100%;">
        <div id="pickerList" style="max-height:320px; overflow-y:auto; border:1px solid var(--grey-100); border-radius:var(--r-md);"></div>
        <div style="margin-top:10px; font-size:12px; color:var(--grey-500);"><span id="chosenCount">0</span> selected to add · ${memberSet.size} already in club</div>
      </div>
    `;

    const listEl = body.querySelector('#pickerList');
    const searchEl = body.querySelector('#memberSearch');
    const countEl = body.querySelector('#chosenCount');

    function draw(filter = '') {
      clearNode(listEl);
      const q = filter.toLowerCase();
      const items = pupils
        .filter(p => !memberSet.has(p.id))
        .filter(p => !q || (`${p.firstName} ${p.lastName} ${p.grade} ${p.guardianName || ''}`).toLowerCase().includes(q));
      if (!items.length) {
        listEl.appendChild(html`<div style="padding:16px; text-align:center; color:var(--grey-400); font-size:13px;">No matches${memberSet.size === pupils.length ? ' — all pupils already in the club' : ''}</div>`);
        return;
      }
      items.forEach(p => {
        const row = html`
          <label style="display:flex; gap:10px; padding:8px 12px; border-bottom:1px solid var(--grey-50); cursor:pointer;">
            <input type="checkbox" data-pupil-id="${p.id}" ${chosen.has(p.id) ? 'checked' : ''}>
            <div style="flex:1;">
              <div style="font-size:13px; font-weight:500;">${escapeHtml(p.firstName)} ${escapeHtml(p.lastName)}</div>
              <div style="font-size:11px; color:var(--grey-500);">Grade ${p.grade} · ${escapeHtml(p.guardianName || '')}</div>
            </div>
          </label>
        `;
        row.querySelector('input').addEventListener('change', (e) => {
          if (e.target.checked) chosen.add(p.id); else chosen.delete(p.id);
          countEl.textContent = chosen.size;
        });
        listEl.appendChild(row);
      });
    }
    searchEl.addEventListener('input', (e) => draw(e.target.value));
    draw();

    const modal = Modal.open({
      title: `Add members — ${club.name}`,
      body, size: 'md',
      footer: [
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: 'Add', type: 'primary', onClick: () => {
          if (!chosen.size) return Toast.info('Pick at least one pupil');
          chosen.forEach(pupilId => Store.addClubMember({ clubId: club.id, pupilId, role: 'member' }));
          Toast.success(`${chosen.size} member${chosen.size === 1 ? '' : 's'} added`);
          modal.close();
        }}
      ]
    });
  }

  return { render };
})();
