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
            <div class="form-field">
              <label class="form-label">Total seats</label>
              <input class="form-input" type="number" name="seatsTotal" min="0" value="${trip.seatsTotal}">
            </div>
            <div class="form-field">
              <label class="form-label">Chaperones</label>
              <input class="form-input" type="number" name="chaperones" min="0" value="${trip.chaperones}">
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

    body.querySelector('[name=currency]').addEventListener('change', (e) => {
      const prefix = body.querySelector('#tripCurPrefix');
      prefix.textContent = e.target.value === 'KES' ? 'KSh' : e.target.value === 'GBP' ? '£' : e.target.value === 'EUR' ? '€' : '$';
    });

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
      const form = body.querySelector('#tripFormEl');
      const fd = new FormData(form);
      if (!fd.get('code').trim() || !fd.get('name').trim() || !fd.get('destination').trim() || !fd.get('startDate') || !fd.get('endDate')) {
        Toast.error('Fill required fields');
        return;
      }
      const data = {
        code: fd.get('code').trim(),
        name: fd.get('name').trim(),
        destination: fd.get('destination').trim(),
        description: fd.get('description').trim(),
        status: fd.get('status'),
        tripType: fd.get('tripType') || 'international',
        startDate: fd.get('startDate'),
        endDate: fd.get('endDate'),
        seatsTotal: parseInt(fd.get('seatsTotal')) || 0,
        chaperones: parseInt(fd.get('chaperones')) || 0,
        costPerPupil: parseFloat(fd.get('costPerPupil')) || 0,
        currency: fd.get('currency')
      };

      if (isEdit) {
        Store.updateTrip(tripId, data);
        Toast.success('Trip updated');
      } else {
        const t = Store.createTrip(data);
        Store.setActiveTrip(t.id);
        Toast.success('Trip created');
      }
      modal.close();
    }
  }
};
