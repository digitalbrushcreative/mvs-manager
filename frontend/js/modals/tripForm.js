/* ==========================================
   TRIP FORM — create / edit trip
   ========================================== */

const TripForm = {
  open(tripId = null) {
    const isEdit = tripId !== null;
    const trip = isEdit ? Store.getTrip(tripId) : Schema.newTrip();

    const body = html`
      <form id="tripFormEl" novalidate>
        <div class="form-section">
          <div class="form-section-title"><span class="num">1</span>Basics</div>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">Trip code <span class="required">*</span></label>
              <input class="form-input mono" name="code" value="${escapeHtml(trip.code)}" placeholder="MVS-MYS-26" required>
            </div>
            <div class="form-field">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${['draft', 'open', 'closed', 'in-progress', 'complete', 'cancelled'].map(s =>
                  `<option value="${s}" ${trip.status === s ? 'selected' : ''}>${Fmt.capitalize(s)}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Trip type <span class="required">*</span></label>
              <select class="form-select" name="tripType" required>
                ${Schema.TripType.map(t =>
                  `<option value="${t}" ${(trip.tripType || 'international') === t ? 'selected' : ''}>${Fmt.capitalize(t)}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Trip name <span class="required">*</span></label>
              <input class="form-input" name="name" value="${escapeHtml(trip.name)}" required>
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Destination <span class="required">*</span></label>
              <input class="form-input" name="destination" value="${escapeHtml(trip.destination)}" placeholder="Kuala Lumpur · Langkawi · Penang" required>
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" name="description" rows="2">${escapeHtml(trip.description)}</textarea>
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Linked clubs <span style="color:var(--grey-400); font-weight:400;">— tag this trip with one or more school clubs</span></label>
              <div id="clubPicker" class="chip-group" style="padding:8px; border:1px solid var(--grey-200); border-radius:var(--r-md); min-height:42px;"></div>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title"><span class="num">2</span>Schedule &amp; capacity</div>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">Start date <span class="required">*</span></label>
              <input class="form-input" type="date" name="startDate" value="${trip.startDate ? trip.startDate.slice(0,10) : ''}" required>
            </div>
            <div class="form-field">
              <label class="form-label">End date <span class="required">*</span></label>
              <input class="form-input" type="date" name="endDate" value="${trip.endDate ? trip.endDate.slice(0,10) : ''}" required>
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Total seats <span class="required">*</span></label>
              <input class="form-input" type="number" name="seatsTotal" min="0" value="${trip.seatsTotal}">
              <div class="form-hint" id="seatsHint" style="font-size:12px; color:var(--grey-500); margin-top:4px;"></div>
            </div>
            <div class="form-field">
              <label class="form-label">Chaperones</label>
              <input class="form-input" type="number" name="chaperones" min="0" value="${trip.chaperones}">
            </div>
            <div class="form-field">
              <label class="form-label">Parents joining</label>
              <input class="form-input" type="number" name="parentsJoining" min="0" value="${trip.parentsJoining || 0}">
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title"><span class="num">3</span>Pricing</div>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">Cost per pupil</label>
              <div class="input-group">
                <span class="prefix" id="tripCurPrefix">${trip.currency === 'KES' ? 'KSh' : '$'}</span>
                <input name="costPerPupil" type="number" step="0.01" min="0" value="${trip.costPerPupil || ''}">
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Currency</label>
              <select class="form-select" name="currency">
                <option value="USD" ${trip.currency === 'USD' ? 'selected' : ''}>USD</option>
                <option value="KES" ${trip.currency === 'KES' ? 'selected' : ''}>KES</option>
                <option value="GBP" ${trip.currency === 'GBP' ? 'selected' : ''}>GBP</option>
                <option value="EUR" ${trip.currency === 'EUR' ? 'selected' : ''}>EUR</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    `;

    // Club picker — chip-style multi-select
    const selectedClubIds = new Set(trip.clubIds || []);
    const clubPicker = body.querySelector('#clubPicker');
    if (clubPicker) {
      const allClubs = typeof Store.getClubs === 'function' ? Store.getClubs() : [];
      if (!allClubs.length) {
        clubPicker.innerHTML = '<span style="font-size:12px; color:var(--grey-400); padding:6px;">No clubs defined yet — create some in Club Manager.</span>';
      } else {
        allClubs.forEach(c => {
          const on = selectedClubIds.has(c.id);
          const chip = html`<button type="button" class="chip-filter ${on ? 'active' : ''}" data-club="${c.id}">${c.emoji} ${escapeHtml(c.name)}</button>`;
          chip.addEventListener('click', () => {
            if (selectedClubIds.has(c.id)) { selectedClubIds.delete(c.id); chip.classList.remove('active'); }
            else { selectedClubIds.add(c.id); chip.classList.add('active'); }
          });
          clubPicker.appendChild(chip);
        });
      }
    }

    body.querySelector('[name=currency]').addEventListener('change', (e) => {
      const prefix = body.querySelector('#tripCurPrefix');
      prefix.textContent = e.target.value === 'KES' ? 'KSh' : e.target.value === 'GBP' ? '£' : e.target.value === 'EUR' ? '€' : '$';
    });

    // Live seats breakdown: pupils enrolled + chaperones + parents vs total seats
    const seatsHint = body.querySelector('#seatsHint');
    const seatsTotalInput = body.querySelector('[name=seatsTotal]');
    const chapInput = body.querySelector('[name=chaperones]');
    const parentsInput = body.querySelector('[name=parentsJoining]');
    function updateSeatsHint() {
      const total = parseInt(seatsTotalInput.value, 10) || 0;
      const chap = parseInt(chapInput.value, 10) || 0;
      const par = parseInt(parentsInput.value, 10) || 0;
      const enrolled = isEdit ? Store.getPupils(tripId).length : 0;
      const used = enrolled + chap + par;
      const left = total - used;
      seatsHint.textContent = `${enrolled} pupil${enrolled === 1 ? '' : 's'} + ${chap} chaperone${chap === 1 ? '' : 's'} + ${par} parent${par === 1 ? '' : 's'} = ${used} of ${total} seats · ${left >= 0 ? left + ' left' : Math.abs(left) + ' over capacity'}`;
      seatsHint.style.color = left < 0 ? 'var(--crimson)' : left <= 2 ? 'var(--warning)' : 'var(--grey-500)';
    }
    [seatsTotalInput, chapInput, parentsInput].forEach(el => el.addEventListener('input', updateSeatsHint));
    updateSeatsHint();

    const modal = Modal.open({
      title: isEdit ? 'Edit trip' : 'New trip',
      subtitle: trip.code,
      body, size: 'lg',
      footer: [
        isEdit ? { label: 'Delete trip', type: 'light', onClick: () => {
          Confirm.open({
            title: 'Delete entire trip?',
            message: `This will permanently delete "${trip.name}" and all its pupils, payments, documents, bookings, and activities. This cannot be undone.`,
            confirmLabel: 'Delete trip',
            onConfirm: () => {
              Store.deleteTrip(tripId);
              const remaining = Store.getTrips();
              if (remaining.length) Store.setActiveTrip(remaining[0].id);
              Toast.success('Trip deleted');
              modal.close();
            }
          });
        }} : { spacer: true },
        { spacer: true },
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: isEdit ? 'Save changes' : 'Create trip', type: 'primary', onClick: () => save() }
      ]
    });

    function save() {
      // `body` is the <form> element itself (html` ` returns the first
      // element child of the template). querySelector on the form only
      // searches descendants, so we use `body` directly.
      const form = body.id === 'tripFormEl' ? body : body.querySelector('#tripFormEl');
      const fd = new FormData(form);
      const val = (k) => (fd.get(k) ?? '').toString();

      if (!val('code').trim() || !val('name').trim() || !val('destination').trim() || !val('startDate') || !val('endDate')) {
        Toast.error('Fill required fields');
        return;
      }

      const seatsTotal = parseInt(val('seatsTotal'), 10) || 0;
      const chaperones = parseInt(val('chaperones'), 10) || 0;
      const parentsJoining = parseInt(val('parentsJoining'), 10) || 0;
      const enrolled = isEdit ? Store.getPupils(tripId).length : 0;
      const used = enrolled + chaperones + parentsJoining;
      if (seatsTotal > 0 && used > seatsTotal) {
        Toast.error(`Over capacity: ${used} seats needed but only ${seatsTotal} total. Increase total seats or reduce chaperones/parents.`);
        return;
      }

      const data = {
        code: val('code').trim(),
        name: val('name').trim(),
        destination: val('destination').trim(),
        description: val('description').trim(),
        status: val('status') || 'draft',
        tripType: val('tripType') || 'international',
        startDate: val('startDate'),
        endDate: val('endDate'),
        seatsTotal: parseInt(val('seatsTotal'), 10) || 0,
        chaperones: parseInt(val('chaperones'), 10) || 0,
        parentsJoining: parseInt(val('parentsJoining'), 10) || 0,
        costPerPupil: parseFloat(val('costPerPupil')) || 0,
        currency: val('currency') || 'USD',
        clubIds: Array.from(selectedClubIds)
      };

      try {
        if (isEdit) {
          Store.updateTrip(tripId, data);
          Toast.success('Trip updated');
        } else {
          const t = Store.createTrip(data);
          Store.setActiveTrip(t.id);
          Toast.success('Trip created');
        }
      } catch (err) {
        console.error('[TripForm] save failed', err);
        Toast.error('Save failed: ' + (err.message || err));
        return;
      }
      modal.close();
    }
  }
};
