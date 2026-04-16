/* ==========================================
   ITINERARY PAGE — day-by-day view
   ========================================== */

const ItineraryPage = (function() {
  function render(root) {
    const trip = Store.activeTrip();
    if (!trip) { root.appendChild(Banner.render()); return; }
    root.appendChild(Banner.render());

    const activities = Store.getActivities(trip.id).sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime));
    const byDay = {};
    activities.forEach(a => { if (!byDay[a.day]) byDay[a.day] = []; byDay[a.day].push(a); });

    const card = html`
      <div class="card">
        <div class="card-head">
          <div class="card-title">Day-by-day itinerary</div>
          <button class="btn btn-dark" id="addActItin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add activity
          </button>
        </div>
        <div style="padding: 24px;" id="itinBody"></div>
      </div>
    `;
    root.appendChild(card);
    card.querySelector('#addActItin').addEventListener('click', () => ActivityForm.open());

    const body = card.querySelector('#itinBody');

    if (!activities.length) {
      body.appendChild(html`<div class="empty-state"><h3>No itinerary yet</h3><p>Add your first activity to start building the trip itinerary.</p></div>`);
      return;
    }

    const startDate = new Date(trip.startDate);
    Object.keys(byDay).sort((a,b) => Number(a) - Number(b)).forEach(day => {
      const dayNum = parseInt(day);
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + dayNum - 1);
      const section = html`
        <div class="itinerary-day">
          <div class="itin-day-head">
            <div class="num">${dayNum}</div>
            <div class="date">${dayDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
          </div>
          <div style="border-left: 2px solid var(--grey-100); padding-left: 20px; padding-bottom: 8px;"></div>
        </div>
      `;
      const col = section.querySelector('div:last-child');
      byDay[day].forEach(a => {
        const item = html`
          <div style="padding: 14px; background: var(--white); border: 1px solid var(--grey-100); border-radius: 6px; margin-bottom: 10px; cursor: pointer; transition: all var(--t-fast);" data-act-id="${a.id}">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              <span class="mono" style="font-size: 11px; color: var(--grey-500); font-weight: 600;">${escapeHtml(a.startTime || '—')}</span>
              <span style="font-weight: 600; font-size: 14px; color: var(--navy-deep);">${escapeHtml(a.title)}</span>
              <span class="tag ${a.type}" style="padding: 2px 6px; font-size: 10px; border-radius: 3px; margin-left: auto;">${a.type}</span>
            </div>
            ${a.description ? `<div style="font-size: 12px; color: var(--grey-500); line-height: 1.5; margin-bottom: 6px;">${escapeHtml(a.description)}</div>` : ''}
            <div style="font-size: 11px; color: var(--grey-400); font-family: var(--mono); display: flex; gap: 10px;">
              ${a.duration ? `<span>${escapeHtml(a.duration)}</span>` : ''}
              ${a.supplier ? `<span>· ${escapeHtml(a.supplier)}</span>` : ''}
              ${a.perPupilCost ? `<span>· ${Fmt.moneyPlain(a.perPupilCost, a.currency)}/pupil</span>` : ''}
            </div>
          </div>
        `;
        item.addEventListener('click', () => ActivityForm.open(a.id));
        item.addEventListener('mouseenter', () => { item.style.borderColor = 'var(--navy-deep)'; item.style.transform = 'translateX(2px)'; });
        item.addEventListener('mouseleave', () => { item.style.borderColor = 'var(--grey-100)'; item.style.transform = ''; });
        col.appendChild(item);
      });
      body.appendChild(section);
    });
  }

  return { render };
})();

