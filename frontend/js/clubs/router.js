/* Clubs app router */

const ClubsRouter = (function () {
  const pages = {
    dashboard: { label: 'Dashboard', render: (root) => ClubsDashboardPage.render(root), action: { label: 'New club', fn: () => ClubForm.open() } },
    clubs:     { label: 'Clubs',     render: (root) => ClubsListPage.render(root),      action: { label: 'New club', fn: () => ClubForm.open() } },
    members:   { label: 'Members',   render: (root) => ClubsMembersPage.render(root),   action: null },
    trips:     { label: 'Linked trips', render: (root) => ClubsTripsPage.render(root),  action: null },
    detail:    { label: 'Club',      render: (root, id) => ClubDetailPage.render(root, id), action: { label: 'Edit club', fn: (id) => ClubForm.open(id) } }
  };

  let currentPage = 'dashboard';
  let currentArg = null;
  let rendering = false;

  function go(page, arg) {
    if (!pages[page]) page = 'dashboard';
    currentPage = page;
    currentArg = arg ?? null;

    $$('.subnav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));

    const actionBtn = $('#subnavAction');
    if (actionBtn) {
      const a = pages[page].action;
      if (a) {
        actionBtn.style.display = '';
        actionBtn.querySelector('span').textContent = a.label;
        actionBtn.onclick = () => a.fn(currentArg);
      } else {
        actionBtn.style.display = 'none';
      }
    }

    rendering = true;
    const root = $('#pageRoot');
    clearNode(root);
    try {
      pages[page].render(root, currentArg);
    } catch (err) {
      console.error('[ClubsRouter] render error', err);
      root.appendChild(html`<div class="card"><div class="empty-state"><h3>Something went wrong</h3><p>${escapeHtml(err.message)}</p></div></div>`);
    }
    rendering = false;
    updateBadges();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function updateBadges() {
    const clubs = Store.getClubs();
    const el = $('#clubsCount');
    if (el) el.textContent = clubs.length;
  }

  function init() {
    on(document, 'click', '.subnav-item[data-page]', function () { go(this.dataset.page); });
    Store.subscribe('*', (collection) => {
      if (rendering) return;
      const relevant = ['clubs', 'clubMembers', 'pupils', 'trips'];
      if (relevant.includes(collection)) go(currentPage, currentArg);
      else updateBadges();
    });
  }

  return { init, go, current: () => currentPage };
})();
