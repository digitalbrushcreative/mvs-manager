/* ==========================================
   PUPIL FORM — add or edit a pupil
   ==========================================
   PupilForm.open()               → add
   PupilForm.open(pupilId)        → edit
*/

const PupilForm = {
  open(pupilId = null) {
    const isEdit = pupilId !== null;
    const pupil = isEdit ? Store.getPupil(pupilId) : Schema.newPupil({ tripId: Store.activeTripId() });
    const trip = Store.activeTrip();
    if (!trip) { Toast.error('Select a trip first'); return; }

    const body = html`
      <form id="pupilFormEl" novalidate>
        <div class="form-section">
          <div class="form-section-title"><span class="num">1</span>Pupil details</div>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">Admission No <span class="required">*</span></label>
              <input class="form-input mono" name="admissionNo" value="${escapeHtml(pupil.admissionNo)}" placeholder="652193" required>
            </div>
            <div class="form-field">
              <label class="form-label">Grade <span class="required">*</span></label>
              <select class="form-select" name="grade">
                ${[4,5,6,7,8,9].map(g => `<option value="${g}" ${pupil.grade == g ? 'selected' : ''}>Grade ${g}</option>`).join('')}
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">First name <span class="required">*</span></label>
              <input class="form-input" name="firstName" value="${escapeHtml(pupil.firstName)}" required>
            </div>
            <div class="form-field">
              <label class="form-label">Last name <span class="required">*</span></label>
              <input class="form-input" name="lastName" value="${escapeHtml(pupil.lastName)}" required>
            </div>
            <div class="form-field">
              <label class="form-label">Gender</label>
              <div class="radio-group">
                <label class="radio-opt ${pupil.gender === 'M' ? 'active' : ''}"><input type="radio" name="gender" value="M" ${pupil.gender === 'M' ? 'checked' : ''}>Male</label>
                <label class="radio-opt ${pupil.gender === 'F' ? 'active' : ''}"><input type="radio" name="gender" value="F" ${pupil.gender === 'F' ? 'checked' : ''}>Female</label>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Date of birth</label>
              <input class="form-input" type="date" name="dob" value="${pupil.dob ? pupil.dob.slice(0,10) : ''}">
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title"><span class="num">2</span>Guardian contact</div>
          <div class="form-grid">
            <div class="form-field col-span-2">
              <label class="form-label">Guardian name <span class="required">*</span></label>
              <input class="form-input" name="guardianName" value="${escapeHtml(pupil.guardianName)}" required>
            </div>
            <div class="form-field">
              <label class="form-label">Phone <span class="required">*</span></label>
              <input class="form-input mono" name="guardianPhone" value="${escapeHtml(pupil.guardianPhone)}" placeholder="0722 123 456" required>
            </div>
            <div class="form-field">
              <label class="form-label">Email</label>
              <input class="form-input" type="email" name="guardianEmail" value="${escapeHtml(pupil.guardianEmail)}" placeholder="parent@example.com">
            </div>
            <div class="form-field">
              <label class="form-label">Relationship</label>
              <select class="form-select" name="guardianRelationship">
                ${['parent', 'guardian', 'grandparent', 'aunt/uncle', 'sibling', 'other'].map(r => `<option value="${r}" ${pupil.guardianRelationship === r ? 'selected' : ''}>${Fmt.capitalize(r)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title"><span class="num">3</span>Additional information</div>
          <div class="form-grid cols-1">
            <div class="form-field">
              <label class="form-label">Medical notes</label>
              <textarea class="form-textarea" name="medicalNotes" rows="2" placeholder="Allergies, conditions, medications…">${escapeHtml(pupil.medicalNotes)}</textarea>
            </div>
            <div class="form-field">
              <label class="form-label">Dietary notes</label>
              <textarea class="form-textarea" name="dietaryNotes" rows="2" placeholder="Dietary requirements, restrictions…">${escapeHtml(pupil.dietaryNotes)}</textarea>
            </div>
            <div class="form-field">
              <label class="form-label">Coordinator note <span class="hint">Internal</span></label>
              <textarea class="form-textarea" name="note" rows="2" placeholder="Any notes for the trip coordinator…">${escapeHtml(pupil.note)}</textarea>
            </div>
            <div class="form-field">
              <label class="form-label" style="display: flex; gap: 8px; align-items: center;">
                <input type="checkbox" name="flagged" ${pupil.flagged ? 'checked' : ''} style="width: auto;">
                Flag this pupil for follow-up
              </label>
            </div>
          </div>
        </div>
      </form>
    `;

    // Radio group click behavior
    body.querySelectorAll('.radio-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        opt.parentElement.querySelectorAll('.radio-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        opt.querySelector('input').checked = true;
      });
    });

    const modal = Modal.open({
      title: isEdit ? 'Edit pupil' : 'Add pupil',
      subtitle: `${trip.code} · ${trip.name}`,
      body, size: 'lg',
      footer: [
        isEdit ? { label: 'Delete', type: 'light', onClick: () => {
          Confirm.open({
            title: 'Delete pupil?',
            message: `Remove ${pupil.firstName} ${pupil.lastName} from this trip? All related payments and documents will also be removed. This cannot be undone.`,
            confirmLabel: 'Delete',
            onConfirm: () => {
              Store.deletePupil(pupilId);
              Toast.success('Pupil deleted');
              modal.close();
            }
          });
        }} : { spacer: true },
        { spacer: true },
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: isEdit ? 'Save changes' : 'Add pupil', type: 'primary', onClick: () => save() }
      ]
    });

    function save() {
      const form = body.querySelector('#pupilFormEl');
      const fd = new FormData(form);

      // Validation
      const required = ['admissionNo', 'firstName', 'lastName', 'guardianName', 'guardianPhone'];
      const missing = required.filter(k => !fd.get(k)?.toString().trim());
      if (missing.length) {
        missing.forEach(k => form.querySelector(`[name=${k}]`)?.classList.add('error'));
        Toast.error('Please fill all required fields');
        return;
      }

      const data = {
        admissionNo: fd.get('admissionNo').trim(),
        firstName: fd.get('firstName').trim(),
        lastName: fd.get('lastName').trim(),
        grade: Number(fd.get('grade')),
        gender: fd.get('gender'),
        dob: fd.get('dob') || null,
        guardianName: fd.get('guardianName').trim(),
        guardianPhone: fd.get('guardianPhone').trim(),
        guardianEmail: fd.get('guardianEmail').trim(),
        guardianRelationship: fd.get('guardianRelationship'),
        medicalNotes: fd.get('medicalNotes').trim(),
        dietaryNotes: fd.get('dietaryNotes').trim(),
        note: fd.get('note').trim(),
        flagged: fd.get('flagged') === 'on'
      };

      if (isEdit) {
        Store.updatePupil(pupilId, data);
        Toast.success(`${data.firstName} ${data.lastName} updated`);
      } else {
        const p = Store.createPupil(data);
        Toast.success(`${p.firstName} ${p.lastName} added to trip`);
      }
      modal.close();
    }
  }
};
