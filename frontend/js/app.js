/* ==========================================
   APP BOOTSTRAP
   ==========================================
   Entry point. Seeds data on first visit,
   wires global UI, and boots the router.
*/

document.addEventListener('DOMContentLoaded', async () => {
  // Hydrate the in-memory cache from the API before anything reads data.
  try {
    await Storage.bootstrap();
  } catch (err) {
    console.error('[bootstrap] API unreachable:', err);
    Toast.error('Could not reach API at ' + (window.MVS_API_BASE || 'http://localhost:3001'));
    return;
  }

  // Seed data on first visit (writes go through Storage → API)
  Seed.seedIfNeeded();

  // Admin session guard — runs after seed so demo accounts exist on first visit.
  const session = JSON.parse(localStorage.getItem('mvs-session') || 'null');
  if (!session?.token || session.user?.role !== 'admin') {
    location.replace('login.html');
    return;
  }
  // Show the logged-in user and wire logout.
  const user = session.user;
  const avatar = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');
  if (avatar) avatar.textContent = (user.name || user.email).split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  if (nameEl) nameEl.textContent = user.name || user.email;
  const userChip = document.getElementById('userChip');
  if (userChip) userChip.addEventListener('click', async () => {
    try {
      await fetch((window.MVS_API_BASE || 'http://localhost:3001') + '/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.token }
      });
    } catch {}
    localStorage.removeItem('mvs-session');
    location.replace('login.html');
  });

  // Initialize router & show default page
  Router.init();
  Router.go('roster');

  // Global search — debounced, jumps to roster with the query applied
  const globalSearch = $('#globalSearch');
  if (globalSearch) {
    const debounced = debounce((e) => {
      const query = e.target.value.trim();
      if (!query) return;
      // Switch to roster and apply search (we do this by navigating and then
      // setting the search field on the roster page).
      if (Router.current() !== 'roster') Router.go('roster');
      const rosterSearch = $('#rosterSearch');
      if (rosterSearch) {
        rosterSearch.value = query;
        rosterSearch.dispatchEvent(new Event('input', { bubbles: true }));
        rosterSearch.focus();
      }
    }, 250);
    globalSearch.addEventListener('input', debounced);
    globalSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { globalSearch.value = ''; globalSearch.blur(); }
    });
  }

  // Export data shortcut (dev convenience) — Cmd/Ctrl + Shift + E
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      const data = Storage.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mvs-trips-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Toast.success('Backup downloaded');
    }
    // Cmd/Ctrl + Shift + R: reset all data (dangerous)
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      Confirm.open({
        title: 'Reset all data?',
        message: 'This will delete everything and restore the seed dataset. This cannot be undone.',
        confirmLabel: 'Reset',
        onConfirm: async () => {
          await Storage.clear();
          Seed.seedIfNeeded(true);
          Toast.success('Data reset');
          Router.go('roster');
        }
      });
    }
  });

  // Welcome toast
  setTimeout(() => {
    const trip = Store.activeTrip();
    if (trip) {
      const stats = Store.tripStats(trip.id);
      Toast.info(`Welcome back — ${stats.enrolled} pupils enrolled in ${trip.code}`);
    }
  }, 400);
});
