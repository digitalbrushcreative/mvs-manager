/* ==========================================
   PAYMENT FORM — log a new payment
   ==========================================
   PaymentForm.open(pupilId)  → log payment for pupil
   PaymentForm.open()         → general (pick pupil)
*/

const PaymentForm = {
  open(pupilId = null) {
    const trip = Store.activeTrip();
    if (!trip) { Toast.error('Select a trip first'); return; }

    const pupils = Store.getPupils(trip.id);
    let selectedPupilId = pupilId;

    function renderBalanceInfo() {
      if (!selectedPupilId) return '';
      const bal = Store.getPupilBalance(selectedPupilId);
      return `
        <div class="inline-stats" style="margin-top: 10px;">
          <div class="inline-stat"><div class="n">${Fmt.moneyPlain(bal.total, trip.currency)}</div><div class="l">Trip cost</div></div>
          <div class="inline-stat"><div class="n" style="color: var(--success);">${Fmt.moneyPlain(bal.paid, trip.currency)}</div><div class="l">Paid so far</div></div>
          <div class="inline-stat"><div class="n" style="color: var(--crimson);">${Fmt.moneyPlain(bal.balance, trip.currency)}</div><div class="l">Outstanding</div></div>
        </div>
      `;
    }

    const body = html`
      <form id="paymentFormEl" novalidate>
        <div class="form-grid cols-1">
          <div class="form-field">
            <label class="form-label">Pupil <span class="required">*</span></label>
            <select class="form-select" name="pupilId" ${pupilId ? 'disabled' : ''} required>
              <option value="">Select pupil…</option>
              ${pupils.sort((a,b) => a.lastName.localeCompare(b.lastName)).map(p =>
                `<option value="${p.id}" ${p.id === pupilId ? 'selected' : ''}>${escapeHtml(p.firstName + ' ' + p.lastName)} · Grade ${p.grade} · #${escapeHtml(p.admissionNo)}</option>`
              ).join('')}
            </select>
            <div id="balanceInfo">${renderBalanceInfo()}</div>
          </div>
        </div>

        <div class="form-section" style="margin-top: 18px;">
          <div class="form-section-title"><span class="num">1</span>Amount</div>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">Amount <span class="required">*</span></label>
              <div class="input-group">
                <span class="prefix">${trip.currency === 'KES' ? 'KSh' : '$'}</span>
                <input name="amount" type="number" step="0.01" min="0" required>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Currency</label>
              <select class="form-select" name="currency">
                <option value="USD" ${trip.currency === 'USD' ? 'selected' : ''}>USD</option>
                <option value="KES" ${trip.currency === 'KES' ? 'selected' : ''}>KES</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-title"><span class="num">2</span>Method &amp; reference</div>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-label">Method <span class="required">*</span></label>
              <select class="form-select" name="method" required>
                <option value="bank-transfer">Bank transfer</option>
                <option value="mpesa">M-PESA</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Date received</label>
              <input class="form-input" type="date" name="paidAt" value="${new Date().toISOString().slice(0,10)}">
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Reference / transaction ID</label>
              <input class="form-input mono" name="reference" placeholder="MVS652193-I1 / TXN-123456">
            </div>
            <div class="form-field col-span-2">
              <label class="form-label">Notes</label>
              <textarea class="form-textarea" name="notes" rows="2" placeholder="Any additional context for this payment"></textarea>
            </div>
          </div>
        </div>
      </form>
    `;

    body.querySelector('[name=pupilId]').addEventListener('change', (e) => {
      selectedPupilId = e.target.value;
      body.querySelector('#balanceInfo').innerHTML = renderBalanceInfo();
    });

    const modal = Modal.open({
      title: 'Log payment',
      subtitle: `${trip.code} · ${trip.name}`,
      body, size: 'lg',
      footer: [
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: 'Log payment', type: 'primary', onClick: () => save() }
      ]
    });

    function save() {
      const form = body.id === 'paymentFormEl' ? body : body.querySelector('#paymentFormEl');
      const fd = new FormData(form);

      if (!fd.get('pupilId') && !pupilId) {
        Toast.error('Select a pupil');
        return;
      }
      const amount = parseFloat(fd.get('amount'));
      if (!amount || amount <= 0) {
        form.querySelector('[name=amount]')?.classList.add('error');
        Toast.error('Enter a valid amount');
        return;
      }

      const p = Store.createPayment({
        pupilId: pupilId || fd.get('pupilId'),
        amount,
        currency: fd.get('currency'),
        method: fd.get('method'),
        reference: fd.get('reference').trim(),
        notes: fd.get('notes').trim(),
        paidAt: new Date(fd.get('paidAt') || Date.now()).toISOString()
      });
      const pupil = Store.getPupil(p.pupilId);
      Toast.success(`${Fmt.moneyPlain(amount, fd.get('currency'))} logged for ${pupil.firstName} ${pupil.lastName}`);
      modal.close();
    }
  }
};
