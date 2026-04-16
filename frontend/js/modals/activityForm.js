/* ==========================================
   ACTIVITY FORM — day-by-day itinerary item
   ==========================================
   ActivityForm.open()
   ActivityForm.open(activityId)
   ActivityForm.open(null, { day: 3 })
*/

const ActivityForm = {
  open(activityId = null, prefill = {}) {
    const isEdit = activityId !== null;
    const act = isEdit ? Store.getActivity(activityId) : Schema.newActivity({ tripId: Store.activeTripId(), ...prefill });
    const trip = Store.activeTrip();
    if (!trip) { Toast.error('Select a trip first'); return; }

    const body = html`
      <form id="actFormEl" novalidate>
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label">Day <span class="required">*</span></label>
            <input class="form-input mono" type="number" name="day" min="1" value="${act.day}" required>
          </div>
          <div class="form-field">
            <label class="form-label">Type</label>
            <select class="form-select" name="type">
              <option value="included" ${act.type === 'included' ? 'selected' : ''}>Included</option>
              <option value="ticketed" ${act.type === 'ticketed' ? 'selected' : ''}>Ticketed</option>
              <option value="optional" ${act.type === 'optional' ? 'selected' : ''}>Optional</option>
            </select>
          </div>
          <div class="form-field col-span-2">
            <label class="form-label">Title <span class="required">*</span></label>
            <input class="form-input" name="title" value="${escapeHtml(act.title)}" required>
          </div>
          <div class="form-field col-span-2">
            <label class="form-label">Description</label>
            <textarea class="form-textarea" name="description" rows="2">${escapeHtml(act.description)}</textarea>
          </div>
          <div class="form-field">
            <label class="form-label">Start time</label>
            <input class="form-input mono" name="startTime" value="${escapeHtml(act.startTime)}" placeholder="09:00">
          </div>
          <div class="form-field">
            <label class="form-label">Duration</label>
            <input class="form-input" name="duration" value="${escapeHtml(act.duration)}" placeholder="2h 30m">
          </div>
          <div class="form-field">
            <label class="form-label">Cost per pupil</label>
            <div class="input-group">
              <span class="prefix">${trip.currency === 'KES' ? 'KSh' : '$'}</span>
              <input name="perPupilCost" type="number" step="0.01" min="0" value="${act.perPupilCost || ''}">
            </div>
          </div>
          <div class="form-field">
            <label class="form-label">Capacity</label>
            <input class="form-input" type="number" name="capacity" value="${act.capacity || ''}" placeholder="Max pupils">
          </div>
          <div class="form-field col-span-2">
            <label class="form-label">Supplier</label>
            <input class="form-input" name="supplier" value="${escapeHtml(act.supplier)}">
          </div>
        </div>
      </form>
    `;

    const modal = Modal.open({
      title: isEdit ? 'Edit activity' : 'New activity',
      subtitle: `${trip.code} · Day ${act.day}`,
      body, size: 'lg',
      footer: [
        isEdit ? { label: 'Delete', type: 'light', onClick: () => {
          Confirm.open({
            title: 'Delete activity?',
            message: `Remove "${act.title}" from the itinerary?`,
            confirmLabel: 'Delete',
            onConfirm: () => { Store.deleteActivity(activityId); Toast.success('Activity deleted'); modal.close(); }
          });
        }} : { spacer: true },
        { spacer: true },
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: 'Save', type: 'primary', onClick: () => save() }
      ]
    });

    function save() {
      const form = body.querySelector('#actFormEl');
      const fd = new FormData(form);
      if (!fd.get('title').trim()) { Toast.error('Title is required'); return; }

      const data = {
        day: parseInt(fd.get('day')) || 1,
        type: fd.get('type'),
        title: fd.get('title').trim(),
        description: fd.get('description').trim(),
        startTime: fd.get('startTime').trim(),
        duration: fd.get('duration').trim(),
        perPupilCost: parseFloat(fd.get('perPupilCost')) || 0,
        capacity: parseInt(fd.get('capacity')) || null,
        supplier: fd.get('supplier').trim(),
        currency: trip.currency
      };

      if (isEdit) {
        Store.updateActivity(activityId, data);
        Toast.success('Activity updated');
      } else {
        Store.createActivity(data);
        Toast.success(`Activity added to Day ${data.day}`);
      }
      modal.close();
    }
  }
};
