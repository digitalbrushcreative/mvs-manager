/* ==========================================
   DOCUMENT FORM — upload / verify / update document
   ==========================================
   DocumentForm.open(docId)                       → edit document
   DocumentForm.open(null, { pupilId, typeId })   → create
*/

const DocumentForm = {
  open(docId = null, prefill = {}) {
    const isEdit = docId !== null;
    const doc = isEdit ? Store.getDocument(docId) : Schema.newDocument({ tripId: Store.activeTripId(), ...prefill });
    if (!doc) { Toast.error('Document not found'); return; }

    const trip = Store.getTrip(doc.tripId) || Store.activeTrip();
    const pupil = Store.getPupil(doc.pupilId);
    const type = Store.getDocumentType(doc.typeId);
    const types = Store.getDocumentTypes();
    const pupils = Store.getPupils(trip.id).sort((a,b) => a.lastName.localeCompare(b.lastName));

    const body = html`
      <form id="docFormEl" novalidate>
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label">Pupil <span class="required">*</span></label>
            <select class="form-select" name="pupilId" ${isEdit ? 'disabled' : ''} required>
              <option value="">Select pupil…</option>
              ${pupils.map(p => `<option value="${p.id}" ${p.id === doc.pupilId ? 'selected' : ''}>${escapeHtml(p.firstName + ' ' + p.lastName)}</option>`).join('')}
            </select>
          </div>
          <div class="form-field">
            <label class="form-label">Document type <span class="required">*</span></label>
            <select class="form-select" name="typeId" required>
              <option value="">Select type…</option>
              ${types.map(t => `<option value="${t.id}" ${t.id === doc.typeId ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-section" style="margin-top: 18px;">
          <div class="form-section-title"><span class="num">1</span>File &amp; status</div>
          <div class="form-grid">
            <div class="form-field col-span-2">
              <label class="form-label">Filename</label>
              <input class="form-input mono" name="filename" value="${escapeHtml(doc.filename)}" placeholder="passport_652193.pdf">
              <div class="form-hint">In production, this would be a file upload field. For now, enter a reference name.</div>
            </div>
            <div class="form-field">
              <label class="form-label">Status <span class="required">*</span></label>
              <select class="form-select" name="status" required>
                <option value="missing" ${doc.status === 'missing' ? 'selected' : ''}>Missing</option>
                <option value="submitted" ${doc.status === 'submitted' ? 'selected' : ''}>Submitted</option>
                <option value="verified" ${doc.status === 'verified' ? 'selected' : ''}>Verified</option>
                <option value="expiring" ${doc.status === 'expiring' ? 'selected' : ''}>Expiring</option>
                <option value="expired" ${doc.status === 'expired' ? 'selected' : ''}>Expired</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Expires on</label>
              <input class="form-input" type="date" name="expiresAt" value="${doc.expiresAt ? doc.expiresAt.slice(0,10) : ''}">
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Notes</label>
              <textarea class="form-textarea" name="notes" rows="2" placeholder="Any notes about this document">${escapeHtml(doc.notes)}</textarea>
            </div>
          </div>
        </div>
      </form>
    `;

    const modal = Modal.open({
      title: isEdit ? 'Update document' : 'Add document',
      subtitle: pupil ? `${pupil.firstName} ${pupil.lastName}${type ? ' · ' + type.name : ''}` : trip?.code,
      body, size: 'lg',
      footer: [
        isEdit ? { label: 'Mark verified', type: 'dark', onClick: () => {
          Store.updateDocument(docId, { status: 'verified', verifiedAt: new Date().toISOString(), verifiedBy: 'Reginah M.' });
          Toast.success('Document verified');
          modal.close();
        }} : { spacer: true },
        { spacer: true },
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: 'Save', type: 'primary', onClick: () => save() }
      ]
    });

    function save() {
      const form = body.id === 'docFormEl' ? body : body.querySelector('#docFormEl');
      const fd = new FormData(form);
      const data = {
        pupilId: fd.get('pupilId') || doc.pupilId,
        typeId: fd.get('typeId'),
        filename: fd.get('filename').trim(),
        status: fd.get('status'),
        expiresAt: fd.get('expiresAt') ? new Date(fd.get('expiresAt')).toISOString() : null,
        notes: fd.get('notes').trim(),
      };
      if (data.status !== 'missing' && !doc.uploadedAt) data.uploadedAt = new Date().toISOString();
      if (data.status === 'verified' && !doc.verifiedAt) {
        data.verifiedAt = new Date().toISOString();
        data.verifiedBy = 'Reginah M.';
      }
      if (isEdit) {
        Store.updateDocument(docId, data);
        Toast.success('Document updated');
      } else {
        Store.createDocument(data);
        Toast.success('Document added');
      }
      modal.close();
    }
  }
};
