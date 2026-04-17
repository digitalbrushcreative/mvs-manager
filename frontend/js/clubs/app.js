/* Clubs app bootstrap */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await Storage.bootstrap();
  } catch (err) {
    console.error('[Clubs bootstrap] API unreachable', err);
    Toast.error('Could not reach API');
    return;
  }

  // Seed on first visit (same seed used by Trip Manager)
  Seed.seedIfNeeded();

  // Session guard — admin only for now
  const session = JSON.parse(localStorage.getItem('mvs-session') || 'null');
  if (!session?.token || session.user?.role !== 'admin') {
    location.replace('login.html');
    return;
  }

  const user = session.user;
  const avatar = $('#userAvatar');
  const nameEl = $('#userName');
  if (avatar) avatar.textContent = (user.name || user.email).split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  if (nameEl) nameEl.textContent = user.name || user.email;
  $('#userChip')?.addEventListener('click', async () => {
    try {
      await fetch((window.MVS_API_BASE || 'http://localhost:3001') + '/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.token }
      });
    } catch {}
    localStorage.removeItem('mvs-session');
    location.replace('login.html');
  });

  ClubsRouter.init();
  ClubsRouter.go('dashboard');
});
