/* All-members page — flat list across all clubs */

const ClubsMembersPage = (function () {
  let clubFilter = 'all';

  function render(root) {
    const clubs = Store.getClubs();
    const members = Store.getClubMembers();
    const pupils = Store.getPupils();

    root.appendChild(html`
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div>
          <h1 style="font-family:var(--display); font-weight:700; font-size:22px; color:var(--navy-deep); letter-spacing:-0.01em;">Members</h1>
          <p style="color:var(--grey-500); font-size:13px; margin-top:4px;">${members.length} membership${members.length === 1 ? '' : 's'} across ${clubs.length} club${clubs.length === 1 ? '' : 's'}</p>
        </div>
      </div>
    `);

    const card = html`
      <div class="card">
        <div class="card-head">
          <div class="card-title">All memberships</div>
          <div id="clubFilterChips" style="display:flex; gap:8px;"></div>
        </div>
        <div id="tableMount"></div>
        <div id="tableFooter"></div>
      </div>
    `;
    root.appendChild(card);

    const chipOptions = [
      { value: 'all', label: `All (${members.length})` },
      ...clubs.map(c => ({ value: c.id, label: `${c.emoji} ${c.name}`, count: members.filter(m => m.clubId === c.id).length }))
    ];
    card.querySelector('#clubFilterChips').appendChild(Chips.create({
      options: chipOptions.map(o => ({ value: o.value, label: o.label, count: o.count ?? undefined })),
      active: clubFilter,
      onChange: (v) => { clubFilter = v; drawTable(); }
    }));

    const mount = card.querySelector('#tableMount');
    const footer = card.querySelector('#tableFooter');
    let tbl;

    function resolveRows() {
      const filtered = clubFilter === 'all' ? members : members.filter(m => m.clubId === clubFilter);
      return filtered.map(m => {
        const p = pupils.find(x => x.id === m.pupilId);
        const c = clubs.find(x => x.id === m.clubId);
        return {
          id: m.id,
          pupilName: p ? `${p.firstName} ${p.lastName}` : '(deleted pupil)',
          grade: p?.grade ?? '—',
          gender: p?.gender || '',
          clubId: m.clubId,
          clubName: c ? c.name : '(deleted club)',
          clubEmoji: c?.emoji || '',
          clubColour: c?.colour || '#394050',
          role: m.role,
          joinedAt: m.joinedAt
        };
      });
    }

    function drawTable() {
      if (tbl) { tbl.update(resolveRows()); return; }
      tbl = Table.create({
        columns: [
          {
            key: 'pupilName', label: 'Pupil', sortable: true,
            render: (r) => `<div class="student-cell"><div class="stu-avatar ${String(r.gender).toLowerCase()}">${Fmt.initials(r.pupilName)}</div><div><div class="stu-name">${escapeHtml(r.pupilName)}</div><div class="stu-meta">Grade ${r.grade}</div></div></div>`
          },
          {
            key: 'clubName', label: 'Club', sortable: true,
            render: (r) => `<span style="display:inline-flex; align-items:center; gap:6px; padding:2px 10px; background:${r.clubColour}; color:var(--white); border-radius:999px; font-size:12px; font-weight:600;">${r.clubEmoji} ${escapeHtml(r.clubName)}</span>`
          },
          { key: 'role', label: 'Role', width: '130px', render: (r) => `<span class="grade-pill">${Fmt.capitalize(r.role)}</span>` },
          { key: 'joinedAt', label: 'Joined', sortable: true, width: '140px', render: (r) => Fmt.date(r.joinedAt) }
        ],
        rows: resolveRows(),
        pageSize: 20,
        emptyState: { title: 'No memberships yet', description: 'Add members from a club\'s detail page.' }
      });
      mount.appendChild(tbl.el);
      footer.appendChild(tbl.footer);
    }
    drawTable();
  }
  return { render };
})();
