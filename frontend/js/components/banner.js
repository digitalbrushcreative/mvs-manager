/* ==========================================
   BANNER — active trip header
   ========================================== */

const Banner = {
  render() {
    const trip = Store.activeTrip();
    if (!trip) {
      return html`
        <div class="trip-banner">
          <div class="banner-grid">
            <div>
              <h1 class="banner-title">No trip selected</h1>
              <p style="color: rgba(255,255,255,0.7); margin-top: 8px;">Create a trip to get started.</p>
            </div>
            <div class="banner-actions">
              <button class="btn btn-primary" id="bannerNewTrip">Create trip</button>
            </div>
          </div>
        </div>
      `;
    }

    const stats = Store.tripStats(trip.id);
    const daysUntil = stats.daysUntil;
    const countdownStr = daysUntil > 0 ? `T-${daysUntil} days` : daysUntil === 0 ? 'Today!' : `${Math.abs(daysUntil)} days ago`;
    const trips = Store.getTrips();

    const banner = html`
      <div class="trip-banner">
        <div class="banner-grid">
          <div>
            <div class="banner-eyebrow">
              <span class="badge">${escapeHtml(trip.status)}</span>
              ${trip.tripType ? `<span class="badge badge-${trip.tripType}">${escapeHtml(trip.tripType)}</span>` : ''}
              <span>${escapeHtml(trip.code)}</span>
              <span class="sep">·</span>
              <span>${countdownStr}</span>
              <select class="trip-switcher" id="tripSwitcher">
                ${trips.map(t => `<option value="${t.id}" ${t.id === trip.id ? 'selected' : ''}>${escapeHtml(t.code)} — ${escapeHtml(t.name)}</option>`).join('')}
              </select>
            </div>
            <h1 class="banner-title">${escapeHtml(trip.name.split(' ').slice(0, -1).join(' '))} <span class="accent">${escapeHtml(trip.name.split(' ').slice(-1)[0])}</span></h1>
            <div class="banner-meta">
              <div class="banner-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span><strong>${Fmt.date(trip.startDate)}</strong> → ${Fmt.date(trip.endDate)}</span>
              </div>
              <div class="banner-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8c0 4.5-6 10-6 10S6 12.5 6 8a6 6 0 0 1 12 0Z"/><circle cx="12" cy="8" r="2"/></svg>
                <span><strong>${escapeHtml(trip.destination.split('·')[0].trim())}</strong>${trip.destination.includes('·') ? ` +${trip.destination.split('·').length - 1} stops` : ''}</span>
              </div>
              <div class="banner-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span><strong>${stats.enrolled}</strong>/${trip.seatsTotal} pupils · ${trip.chaperones} chaperones</span>
              </div>
              <div class="banner-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span><strong>${Fmt.moneyPlain(trip.costPerPupil, trip.currency)}</strong> / pupil</span>
              </div>
            </div>
          </div>
          <div class="banner-actions">
            <button class="btn btn-ghost" id="bannerEditTrip">Edit trip</button>
            <button class="btn btn-primary" id="bannerAddPupil">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Add pupil
            </button>
          </div>
        </div>
      </div>
    `;

    banner.querySelector('#tripSwitcher')?.addEventListener('change', (e) => {
      Store.setActiveTrip(e.target.value);
      Toast.info(`Switched to ${Store.activeTrip()?.code}`);
    });
    banner.querySelector('#bannerAddPupil')?.addEventListener('click', () => PupilForm.open());
    banner.querySelector('#bannerEditTrip')?.addEventListener('click', () => TripForm.open(trip.id));
    banner.querySelector('#bannerNewTrip')?.addEventListener('click', () => TripForm.open());

    return banner;
  }
};
