/* ==========================================
   BOOKING FORM — flight / hotel / activity / transfer / insurance
   ==========================================
   BookingForm.open()         → new
   BookingForm.open(bookingId) → edit
*/

const BookingForm = {
  open(bookingId = null) {
    const isEdit = bookingId !== null;
    const booking = isEdit ? Store.getBooking(bookingId) : Schema.newBooking({ tripId: Store.activeTripId() });
    const trip = Store.activeTrip();
    if (!trip) { Toast.error('Select a trip first'); return; }

    const body = html`
      <form id="bookingFormEl" novalidate>
        <div class="form-section">
          <div class="form-section-title"><span class="num">1</span>Type &amp; status</div>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">Type <span class="required">*</span></label>
              <select class="form-select" name="type" required>
                ${['flight', 'hotel', 'activity', 'transfer', 'insurance'].map(t =>
                  `<option value="${t}" ${booking.type === t ? 'selected' : ''}>${Fmt.capitalize(t)}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Status <span class="required">*</span></label>
              <select class="form-select" name="status" required>
                ${['quoted', 'pending', 'confirmed', 'cancelled'].map(s =>
                  `<option value="${s}" ${booking.status === s ? 'selected' : ''}>${Fmt.capitalize(s)}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Title <span class="required">*</span></label>
              <input class="form-input" name="title" value="${escapeHtml(booking.title)}" placeholder="e.g. NBO → KUL via DXB" required>
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" name="description" rows="2" placeholder="Details about this booking">${escapeHtml(booking.description)}</textarea>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title"><span class="num">2</span>Supplier</div>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">Supplier name</label>
              <input class="form-input" name="supplier" value="${escapeHtml(booking.supplier)}" placeholder="e.g. Kenya Airways">
            </div>
            <div class="form-field">
              <label class="form-label">Reference / booking ID</label>
              <input class="form-input mono" name="reference" value="${escapeHtml(booking.reference)}" placeholder="e.g. KQ0886-2026">
            </div>
            <div class="form-field">
              <label class="form-label">Contact name</label>
              <input class="form-input" name="contactName" value="${escapeHtml(booking.contactName)}">
            </div>
            <div class="form-field">
              <label class="form-label">Contact phone</label>
              <input class="form-input mono" name="contactPhone" value="${escapeHtml(booking.contactPhone)}">
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Contact email</label>
              <input class="form-input" type="email" name="contactEmail" value="${escapeHtml(booking.contactEmail)}">
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title"><span class="num">3</span>Schedule &amp; pricing</div>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">Date</label>
              <input class="form-input" type="date" name="date" value="${booking.date ? booking.date.slice(0,10) : ''}">
            </div>
            <div class="form-field">
              <label class="form-label">Time</label>
              <input class="form-input mono" name="time" value="${escapeHtml(booking.time)}" placeholder="HH:MM">
            </div>
            <div class="form-field">
              <label class="form-label">Pax (pupils + chaperones)</label>
              <input class="form-input" type="number" name="pax" min="0" value="${booking.pax || ''}">
            </div>
            <div class="form-field">
              <label class="form-label">Unit price</label>
              <div class="input-group">
                <span class="prefix">${trip.currency === 'KES' ? 'KSh' : '$'}</span>
                <input name="unitPrice" type="number" step="0.01" min="0" value="${booking.unitPrice || ''}">
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Total cost</label>
              <div class="input-group">
                <span class="prefix">${trip.currency === 'KES' ? 'KSh' : '$'}</span>
                <input name="totalCost" type="number" step="0.01" min="0" value="${booking.totalCost || ''}">
              </div>
              <div class="form-hint">Auto-calculated if left blank</div>
            </div>
            <div class="form-field">
              <label class="form-label">Paid so far</label>
              <div class="input-group">
                <span class="prefix">${trip.currency === 'KES' ? 'KSh' : '$'}</span>
                <input name="paidAmount" type="number" step="0.01" min="0" value="${booking.paidAmount || ''}">
              </div>
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Notes</label>
              <textarea class="form-textarea" name="notes" rows="2">${escapeHtml(booking.notes)}</textarea>
            </div>
          </div>
        </div>
      </form>
    `;

    // Auto-calc total cost
    const unitInput = body.querySelector('[name=unitPrice]');
    const paxInput = body.querySelector('[name=pax]');
    const totalInput = body.querySelector('[name=totalCost]');
    const autoTotal = () => {
      const u = parseFloat(unitInput.value) || 0;
      const p = parseInt(paxInput.value) || 0;
      if (u && p && !totalInput.dataset.manual) totalInput.value = (u * p).toFixed(2);
    };
    unitInput.addEventListener('input', autoTotal);
    paxInput.addEventListener('input', autoTotal);
    totalInput.addEventListener('input', () => { totalInput.dataset.manual = '1'; });

    const modal = Modal.open({
      title: isEdit ? 'Edit booking' : 'New booking',
      subtitle: `${trip.code} · ${trip.name}`,
      body, size: 'lg',
      footer: [
        isEdit ? { label: 'Delete', type: 'light', onClick: () => {
          Confirm.open({
            title: 'Delete booking?',
            message: 'This will remove the booking. This cannot be undone.',
            confirmLabel: 'Delete',
            onConfirm: () => { Store.deleteBooking(bookingId); Toast.success('Booking deleted'); modal.close(); }
          });
        }} : { spacer: true },
        { spacer: true },
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: isEdit ? 'Save changes' : 'Create booking', type: 'primary', onClick: () => save() }
      ]
    });

    function save() {
      const form = body.id === 'bookingFormEl' ? body : body.querySelector('#bookingFormEl');
      const fd = new FormData(form);
      if (!fd.get('title').trim()) { Toast.error('Title is required'); return; }

      const data = {
        type: fd.get('type'),
        status: fd.get('status'),
        supplier: fd.get('supplier').trim(),
        reference: fd.get('reference').trim(),
        title: fd.get('title').trim(),
        description: fd.get('description').trim(),
        date: fd.get('date') || null,
        time: fd.get('time').trim(),
        pax: parseInt(fd.get('pax')) || 0,
        unitPrice: parseFloat(fd.get('unitPrice')) || 0,
        totalCost: parseFloat(fd.get('totalCost')) || 0,
        paidAmount: parseFloat(fd.get('paidAmount')) || 0,
        contactName: fd.get('contactName').trim(),
        contactPhone: fd.get('contactPhone').trim(),
        contactEmail: fd.get('contactEmail').trim(),
        notes: fd.get('notes').trim(),
        currency: trip.currency
      };

      if (isEdit) {
        Store.updateBooking(bookingId, data);
        Toast.success('Booking updated');
      } else {
        Store.createBooking(data);
        Toast.success(`${Fmt.capitalize(data.type)} booking created`);
      }
      modal.close();
    }
  }
};
