/* ==========================================
   ROUTER — pagesubnav navigation
   ==========================================
   Simple in-memory router. Dispatches page render
   and updates the subnav UI state.
*/

const Router = (function() {
  const pages = {
    dashboard: { render: (root) => DashboardPage.render(root), label: 'Dashboard', action: { label: 'New trip', icon: '+', fn: () => TripForm.open() } },
    roster: { render: (root) => RosterPage.render(root), label: 'Roster', action: { label: 'Add pupil', icon: '+', fn: () => PupilForm.open() } },
    itinerary: { render: (root) => ItineraryPage.render(root), label: 'Itinerary', action: { label: 'Add activity', icon: '+', fn: () => ActivityForm.open() } },
    payments: { render: (root) => PaymentsPage.render(root), label: 'Payments', action: { label: 'Log payment', icon: '+', fn: () => PaymentForm.open() } },
    documents: { render: (root) => DocumentsPage.render(root), label: 'Documents', action: { label: 'Add document', icon: '+', fn: () => DocumentForm.open() } },
    bookings: { render: (root) => BookingsPage.render(root), label: 'Bookings', action: { label: 'New booking', icon: '+', fn: () => BookingForm.open() } },
    activities: { render: (root) => ActivitiesPage.render(root), label: 'Activities', action: { label: 'Add activity', icon: '+', fn: () => ActivityForm.open() } },
    communications: { render: (root) => CommunicationsPage.render(root), label: 'Messages', action: { label: 'Compose', icon: '+', fn: () => CommunicationsPage._compose?.() || Router._composeCallback?.() } },
    interest: { render: (root) => InterestPage.render(root), label: 'Interest', action: null },
    reports: { render: (root) => ReportsPage.render(root), label: 'Reports', action: null }
  };

  let currentPage = 'roster';
  let rendering = false;

  function go(pageName) {
    if (!pages[pageName]) {
      console.warn(`[Router] Unknown page: ${pageName}`);
      pageName = 'roster';
    }
    currentPage = pageName;

    // Update subnav active state
    $$('.subnav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageName);
    });

    // Update subnav action button
    updateActionButton();

    // Render page (guarded against re-entrancy)
    rendering = true;
    const root = $('#pageRoot');
    clearNode(root);
    try {
      pages[pageName].render(root);
    } catch (err) {
      console.error('[Router] render error', err);
      root.appendChild(html`<div class="card"><div class="empty-state"><h3>Something went wrong</h3><p>${escapeHtml(err.message)}</p></div></div>`);
    }
    rendering = false;

    // Update badges
    updateBadges();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function updateActionButton() {
    const btn = $('#subnavAction');
    if (!btn) return;
    const page = pages[currentPage];
    if (!page.action) {
      btn.style.display = 'none';
      return;
    }
    btn.style.display = '';
    const labelSpan = btn.querySelector('span');
    if (labelSpan) labelSpan.textContent = page.action.label;
    btn.onclick = page.action.fn;
  }

  function updateBadges() {
    const trip = Store.activeTrip();
    if (!trip) return;
    const stats = Store.tripStats(trip.id);
    const rosterCount = $('#rosterCount');
    if (rosterCount && stats) rosterCount.textContent = stats.enrolled;
    const interestCount = $('#interestCount');
    if (interestCount) {
      const active = Store.getInterests(trip.id).filter(i =>
        ['new', 'contacted', 'awaiting-details', 'submitted'].includes(i.status)
      ).length;
      interestCount.textContent = active;
    }
  }

  function init() {
    // Wire subnav clicks
    on(document, 'click', '.subnav-item[data-page]', function() {
      go(this.dataset.page);
    });

    // Re-render on data changes if it's the current page's domain
    const relevantCollections = {
      dashboard: ['trips', 'pupils', 'payments', 'documents', 'bookings', 'activeTrip'],
      roster: ['pupils', 'payments', 'documents', 'activeTrip', 'trips'],
      itinerary: ['activities', 'trips', 'activeTrip'],
      payments: ['payments', 'pupils', 'trips', 'activeTrip'],
      documents: ['documents', 'documentTypes', 'pupils', 'activeTrip'],
      bookings: ['bookings', 'activeTrip', 'trips'],
      activities: ['activities', 'activeTrip', 'trips'],
      communications: ['communications', 'pupils', 'activeTrip'],
      interest: ['interests', 'activeTrip', 'trips', 'pupils'],
      reports: ['activeTrip', 'trips']
    };

    Store.subscribe('*', (collection) => {
      if (rendering) return; // don't re-enter
      const relevant = relevantCollections[currentPage];
      if (relevant && relevant.includes(collection)) {
        // Re-render current page
        go(currentPage);
      } else {
        // At minimum, update badges
        updateBadges();
      }
    });
  }

  function current() { return currentPage; }

  return { init, go, current, updateBadges };
})();
