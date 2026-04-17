/* Club form — create / edit club */

const ClubForm = {
  open(clubId = null) {
    const isEdit = clubId !== null;
    const club = isEdit ? Store.getClub(clubId) : Schema.newClub();

    const body = html`
      <div class="compose-wrap">
        <form id="clubFormEl" novalidate>
          <div class="form-grid">
            <div class="form-field col-span-2">
              <label class="form-label">Name <span class="required">*</span></label>
              <input class="form-input" name="name" value="${escapeHtml(club.name)}" placeholder="Debate Club" required>
            </div>
            <div class="form-field">
              <label class="form-label">Emoji</label>
              <input class="form-input" name="emoji" value="${escapeHtml(club.emoji || '🎯')}" maxlength="4">
            </div>
            <div class="form-field">
              <label class="form-label">Colour</label>
              <input class="form-input" name="colour" type="color" value="${escapeHtml(club.colour || '#2c3f6b')}" style="height:38px; padding:4px;">
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Lead staff</label>
              <input class="form-input" name="leadStaff" value="${escapeHtml(club.leadStaff)}" placeholder="Ms. J. Smith">
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" name="description" rows="2">${escapeHtml(club.description)}</textarea>
            </div>
            <div class="form-field">
              <label class="form-label">Meeting day</label>
              <select class="form-select" name="meetingDay">
                ${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d =>
                  `<option value="${d}" ${club.meetingDay === d ? 'selected' : ''}>${d}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Meeting time</label>
              <input class="form-input" type="time" name="meetingTime" value="${escapeHtml(club.meetingTime || '16:00')}">
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Venue</label>
              <input class="form-input" name="venue" value="${escapeHtml(club.venue)}" placeholder="Room 204">
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Status</label>
              <select class="form-select" name="status">
                ${Schema.ClubStatus.map(s => `<option value="${s}" ${club.status === s ? 'selected' : ''}>${Fmt.capitalize(s)}</option>`).join('')}
              </select>
            </div>
          </div>
        </form>
      </div>
    `;

    const modal = Modal.open({
      title: isEdit ? 'Edit club' : 'New club',
      subtitle: club.name || '—',
      body, size: 'lg',
      footer: [
        isEdit ? { label: 'Delete', type: 'light', onClick: () => {
          Confirm.open({
            title: 'Delete this club?',
            message: `"${club.name}" will be removed, along with all its memberships. Linked trips will remain but will lose this tag.`,
            confirmLabel: 'Delete',
            onConfirm: () => { Store.deleteClub(clubId); Toast.success('Club deleted'); modal.close(); if (typeof ClubsRouter !== 'undefined') ClubsRouter.go('clubs'); }
          });
        }} : { spacer: true },
        { spacer: true },
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: isEdit ? 'Save changes' : 'Create club', type: 'primary', onClick: () => save() }
      ]
    });

    function save() {
      try {
        const form = body.querySelector('#clubFormEl');
        const fd = new FormData(form);
        const val = (k) => (fd.get(k) ?? '').toString();
        if (!val('name').trim()) return Toast.error('Name is required');
        const data = {
          name: val('name').trim(),
          emoji: val('emoji').trim() || '🎯',
          colour: val('colour') || '#2c3f6b',
          leadStaff: val('leadStaff').trim(),
          description: val('description').trim(),
          meetingDay: val('meetingDay'),
          meetingTime: val('meetingTime'),
          venue: val('venue').trim(),
          status: val('status') || 'active'
        };
        if (isEdit) { Store.updateClub(clubId, data); Toast.success('Club updated'); }
        else { Store.createClub(data); Toast.success('Club created'); }
        modal.close();
      } catch (err) {
        console.error('[ClubForm] save failed', err);
        Toast.error('Save failed: ' + (err.message || err));
      }
    }
  }
};
