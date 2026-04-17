/* ==========================================
   COMMUNICATIONS PAGE — message log + compose
   ========================================== */

const CommunicationsPage = (function() {
  function render(root) {
    const trip = Store.activeTrip();
    if (!trip) { root.appendChild(Banner.render()); return; }
    root.appendChild(Banner.render());

    const comms = Store.getCommunications(trip.id).sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt));

    const card = html`
      <div class="card">
        <div class="card-head">
          <div class="card-title">Messages <span class="tag">${comms.length} sent</span></div>
          <button class="btn btn-dark" id="composeBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            Compose
          </button>
        </div>
        <div id="commsList"></div>
      </div>
    `;
    root.appendChild(card);
    card.querySelector('#composeBtn').addEventListener('click', () => {
      try {
        openCompose();
      } catch (err) {
        console.error('[Compose] failed to open', err);
        Toast.error('Compose failed: ' + (err.message || err));
      }
    });

    const list = card.querySelector('#commsList');
    if (!comms.length) {
      list.appendChild(html`<div class="empty-state"><h3>No messages yet</h3><p>Compose your first message to parents.</p></div>`);
    } else {
      comms.forEach(c => {
        const letters = { email: 'E', sms: 'S', whatsapp: 'W', letter: 'L' };
        const item = html`
          <div class="comm-item" data-msg-id="${c.id}">
            <div class="comm-avatar ${c.type}">${letters[c.type] || 'M'}</div>
            <div style="min-width: 0;">
              <div class="comm-title">${escapeHtml(c.subject || '(no subject)')}</div>
              <div class="comm-sub" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(c.body || '')}</div>
            </div>
            <div class="comm-meta">
              <div>${Fmt.relativeDate(c.sentAt)}</div>
              <div style="margin-top: 2px;">${c.recipientCount} recipient${c.recipientCount !== 1 ? 's' : ''}</div>
            </div>
          </div>
        `;
        item.addEventListener('click', () => openLogDetail(c));
        list.appendChild(item);
      });
    }
  }

  function openLogDetail(c) {
    const recipients = resolveRecipientNames(c);
    Modal.open({
      title: c.subject || '(no subject)',
      subtitle: `${Fmt.date(c.sentAt)} · ${c.type} · ${c.recipientCount} recipient${c.recipientCount === 1 ? '' : 's'}`,
      body: html`
        <div>
          ${c.audienceLabel ? `<div style="margin-bottom:12px; padding:8px 12px; background:var(--grey-50); border-radius:var(--r-md); font-size:13px; color:var(--grey-700);"><strong>Audience:</strong> ${escapeHtml(c.audienceLabel)}</div>` : ''}
          <p style="white-space: pre-wrap; line-height: 1.6; color: var(--grey-900); margin:0 0 16px;">${escapeHtml(c.body)}</p>
          ${recipients.length ? `
            <details style="margin-top:8px;">
              <summary style="cursor:pointer; font-size:13px; color:var(--navy); font-weight:600;">Show ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}</summary>
              <ul style="margin:8px 0 0; padding-left:20px; font-size:13px; color:var(--grey-700); max-height:240px; overflow:auto;">
                ${recipients.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
              </ul>
            </details>
          ` : ''}
        </div>
      `,
      footer: [{ label: 'Close', type: 'primary', onClick: (m) => m.close() }]
    });
  }

  function resolveRecipientNames(comm) {
    const ids = comm.recipientIds || [];
    const pupils = Store.getPupils();
    const interests = Store.getInterests();
    const names = [];
    ids.forEach(id => {
      const p = pupils.find(x => x.id === id);
      if (p) { names.push(`${p.firstName} ${p.lastName} — ${p.guardianName || '(no guardian)'}`); return; }
      const i = interests.find(x => x.id === id);
      if (i) { names.push(`${i.parentName} (interest for ${i.pupilName})`); return; }
      names.push(id);
    });
    return names;
  }

  // ==========================================
  //  Compose
  // ==========================================
  function openCompose() {
    const trip = Store.activeTrip();

    // ---- State ----
    const state = {
      channel: 'email',
      source: 'pupils',  // 'pupils' | 'interests' | 'specific'
      pupilFilters: new Set(['all']),       // all | paid | deposit | pending | overdue | flagged | missing-docs
      gradeFilter: 'all',
      interestFilters: new Set(['active']), // active | new | contacted | awaiting-details | submitted | converted | declined
      specificIds: new Set()
    };

    const body = html`<div class="compose-wrap"><form id="composeFormEl" novalidate></form></div>`;
    const formEl = body.querySelector('#composeFormEl');

    // ---- Channel ----
    formEl.appendChild(section('Channel', html`
      <div class="radio-group" id="channelGroup">
        ${['email','sms','whatsapp','letter'].map(t =>
          `<label class="radio-opt ${t === 'email' ? 'active' : ''}"><input type="radio" name="type" value="${t}" ${t === 'email' ? 'checked' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</label>`
        ).join('')}
      </div>
    `));

    // ---- Audience ----
    const audienceWrap = html`<div></div>`;
    formEl.appendChild(section('Audience', audienceWrap));

    // Source selector
    audienceWrap.appendChild(html`
      <div class="audience-tabs" id="sourceTabs">
        <button type="button" class="tab active" data-src="pupils">Enrolled pupils</button>
        <button type="button" class="tab" data-src="interests">Interested parents</button>
        <button type="button" class="tab" data-src="specific">Specific people</button>
      </div>
    `);

    const filterArea = html`<div class="audience-filters"></div>`;
    audienceWrap.appendChild(filterArea);

    const countPreview = html`
      <div class="audience-preview">
        <div class="preview-count"><strong id="recipCount">0</strong> <span>recipients</span></div>
        <div class="preview-names" id="recipNames">—</div>
      </div>
    `;
    audienceWrap.appendChild(countPreview);

    // ---- Message ----
    formEl.appendChild(section('Message', html`
      <div class="form-grid">
        <div class="form-field col-span-2">
          <label class="form-label">Subject</label>
          <input class="form-input" name="subject" placeholder="e.g. Payment reminder — final instalment">
        </div>
        <div class="form-field col-span-2">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
            <label class="form-label" style="margin:0;">Body</label>
            <div class="var-pills" id="varPills" style="display:flex; gap:4px; flex-wrap:wrap;">
              ${['{pupilName}','{parentName}','{tripName}','{tripCode}','{balance}','{dueDate}']
                .map(v => `<button type="button" class="var-pill" data-var="${v}">${v}</button>`).join('')}
            </div>
          </div>
          <textarea class="form-textarea" name="body" rows="8" placeholder="Hi {parentName}, a quick note about the {tripName} trip for {pupilName}…"></textarea>
          <div style="font-size:11px; color:var(--grey-500); margin-top:4px;">Variables are replaced per-recipient when rendered.</div>
        </div>
      </div>
    `));

    // ==========================================
    //  Wire interactions
    // ==========================================

    // Channel radio
    body.querySelectorAll('.radio-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        opt.parentElement.querySelectorAll('.radio-opt').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        opt.querySelector('input').checked = true;
        state.channel = opt.querySelector('input').value;
        recomputePreview();
      });
    });

    // Source tabs
    body.querySelectorAll('#sourceTabs .tab').forEach(tab => {
      tab.addEventListener('click', () => {
        body.querySelectorAll('#sourceTabs .tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.source = tab.dataset.src;
        renderFilters();
        recomputePreview();
      });
    });

    // Variable pills — insert at textarea cursor
    body.querySelectorAll('.var-pill').forEach(p => {
      p.addEventListener('click', () => {
        const ta = body.querySelector('textarea[name=body]');
        const s = ta.selectionStart, e = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + p.dataset.var + ta.value.slice(e);
        ta.focus();
        ta.selectionStart = ta.selectionEnd = s + p.dataset.var.length;
      });
    });

    renderFilters();
    recomputePreview();

    // ==========================================
    //  Helpers
    // ==========================================

    function section(title, content) {
      const s = html`
        <div class="compose-section">
          <div class="compose-section-title">${escapeHtml(title)}</div>
          <div class="compose-section-body"></div>
        </div>
      `;
      s.querySelector('.compose-section-body').appendChild(content instanceof HTMLElement ? content : html`<div>${content}</div>`);
      return s;
    }

    function renderFilters() {
      clearNode(filterArea);
      if (state.source === 'pupils') renderPupilFilters();
      else if (state.source === 'interests') renderInterestFilters();
      else renderSpecificPicker();
    }

    function renderPupilFilters() {
      const pupils = Store.getPupils(trip.id);
      const grades = [...new Set(pupils.map(p => p.grade))].sort();
      filterArea.appendChild(html`
        <div>
          <div class="chip-group">
            ${filterChip('all', `All enrolled (${pupils.length})`, state.pupilFilters.has('all'))}
            ${filterChip('paid', `Paid in full`, state.pupilFilters.has('paid'))}
            ${filterChip('deposit', `On deposit`, state.pupilFilters.has('deposit'))}
            ${filterChip('pending', `Pending`, state.pupilFilters.has('pending'))}
            ${filterChip('overdue', `Overdue`, state.pupilFilters.has('overdue'))}
            ${filterChip('flagged', `Flagged`, state.pupilFilters.has('flagged'))}
            ${filterChip('missing-docs', `Missing docs`, state.pupilFilters.has('missing-docs'))}
          </div>
          <div style="display:flex; align-items:center; gap:8px; margin-top:10px;">
            <label style="font-size:12px; text-transform:uppercase; letter-spacing:0.06em; color:var(--grey-500); font-weight:600;">Grade:</label>
            <select class="form-select" id="gradeSelect" style="width:auto; padding:6px 10px;">
              <option value="all" ${state.gradeFilter === 'all' ? 'selected' : ''}>All grades</option>
              ${grades.map(g => `<option value="${g}" ${state.gradeFilter == g ? 'selected' : ''}>Grade ${g}</option>`).join('')}
            </select>
          </div>
        </div>
      `);
      filterArea.querySelectorAll('[data-chip]').forEach(c => {
        c.addEventListener('click', () => togglePupilChip(c.dataset.chip));
      });
      filterArea.querySelector('#gradeSelect').addEventListener('change', (e) => {
        state.gradeFilter = e.target.value;
        recomputePreview();
      });
    }

    function togglePupilChip(value) {
      if (value === 'all') {
        state.pupilFilters = new Set(['all']);
      } else {
        state.pupilFilters.delete('all');
        if (state.pupilFilters.has(value)) state.pupilFilters.delete(value);
        else state.pupilFilters.add(value);
        if (!state.pupilFilters.size) state.pupilFilters.add('all');
      }
      renderFilters();
      recomputePreview();
    }

    function renderInterestFilters() {
      const interests = Store.getInterests(trip.id);
      const byStatus = {
        active: interests.filter(i => ['new','contacted','awaiting-details','submitted'].includes(i.status)).length,
        new: interests.filter(i => i.status === 'new').length,
        contacted: interests.filter(i => i.status === 'contacted').length,
        'awaiting-details': interests.filter(i => i.status === 'awaiting-details').length,
        submitted: interests.filter(i => i.status === 'submitted').length,
        converted: interests.filter(i => i.status === 'converted').length,
        declined: interests.filter(i => i.status === 'declined').length
      };
      filterArea.appendChild(html`
        <div class="chip-group">
          ${filterChip('active', `Active (${byStatus.active})`, state.interestFilters.has('active'))}
          ${filterChip('new', `New (${byStatus.new})`, state.interestFilters.has('new'))}
          ${filterChip('contacted', `Contacted (${byStatus.contacted})`, state.interestFilters.has('contacted'))}
          ${filterChip('awaiting-details', `Awaiting details (${byStatus['awaiting-details']})`, state.interestFilters.has('awaiting-details'))}
          ${filterChip('submitted', `Details submitted (${byStatus.submitted})`, state.interestFilters.has('submitted'))}
          ${filterChip('converted', `Seat confirmed (${byStatus.converted})`, state.interestFilters.has('converted'))}
          ${filterChip('declined', `Declined (${byStatus.declined})`, state.interestFilters.has('declined'))}
        </div>
      `);
      filterArea.querySelectorAll('[data-chip]').forEach(c => {
        c.addEventListener('click', () => {
          const v = c.dataset.chip;
          if (v === 'active') {
            state.interestFilters = new Set(['active']);
          } else {
            state.interestFilters.delete('active');
            if (state.interestFilters.has(v)) state.interestFilters.delete(v);
            else state.interestFilters.add(v);
            if (!state.interestFilters.size) state.interestFilters.add('active');
          }
          renderFilters();
          recomputePreview();
        });
      });
    }

    function renderSpecificPicker() {
      const pupils = Store.getPupils(trip.id);
      const interests = Store.getInterests(trip.id);
      filterArea.appendChild(html`
        <div>
          <input type="search" class="form-input" id="pickerSearch" placeholder="Search by name, grade, email…" style="margin-bottom:10px;">
          <div class="picker-list" id="pickerList" style="max-height:220px; overflow-y:auto; border:1px solid var(--grey-100); border-radius:var(--r-md);"></div>
          <div style="font-size:12px; color:var(--grey-500); margin-top:6px;">${pupils.length} pupils · ${interests.length} interest${interests.length === 1 ? '' : 's'}</div>
        </div>
      `);
      const listEl = filterArea.querySelector('#pickerList');
      const searchEl = filterArea.querySelector('#pickerSearch');

      function drawList(filter = '') {
        clearNode(listEl);
        const q = filter.toLowerCase();
        const items = [
          ...pupils.map(p => ({
            id: p.id,
            label: `${p.firstName} ${p.lastName}`,
            sub: `Grade ${p.grade} · ${p.guardianName || ''} · ${p.guardianEmail || p.guardianPhone || ''}`,
            kind: 'pupil'
          })),
          ...interests.map(i => ({
            id: i.id,
            label: `${i.parentName} (interest)`,
            sub: `For ${i.pupilName} · ${i.parentEmail || i.parentPhone || ''}`,
            kind: 'interest'
          }))
        ].filter(it => !q || (it.label + ' ' + it.sub).toLowerCase().includes(q));

        if (!items.length) {
          listEl.appendChild(html`<div style="padding:16px; text-align:center; color:var(--grey-400); font-size:13px;">No matches</div>`);
          return;
        }
        items.forEach(it => {
          const checked = state.specificIds.has(it.id);
          const row = html`
            <label class="picker-row" style="display:flex; gap:10px; align-items:flex-start; padding:8px 12px; border-bottom:1px solid var(--grey-50); cursor:pointer;">
              <input type="checkbox" ${checked ? 'checked' : ''}>
              <div style="flex:1; min-width:0;">
                <div style="font-size:13px; font-weight:500; color:var(--grey-900);">${escapeHtml(it.label)}</div>
                <div style="font-size:11px; color:var(--grey-500); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(it.sub)}</div>
              </div>
              <span class="tag" style="font-size:10px; padding:2px 6px; text-transform:uppercase; letter-spacing:0.06em;">${it.kind}</span>
            </label>
          `;
          row.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) state.specificIds.add(it.id);
            else state.specificIds.delete(it.id);
            recomputePreview();
          });
          listEl.appendChild(row);
        });
      }
      searchEl.addEventListener('input', (e) => drawList(e.target.value));
      drawList();
    }

    function filterChip(value, label, selected) {
      return `<button type="button" class="chip-filter ${selected ? 'active' : ''}" data-chip="${value}">${escapeHtml(label)}</button>`;
    }

    // ==========================================
    //  Recipient resolution
    // ==========================================

    function resolveRecipients() {
      const pupils = Store.getPupils(trip.id);
      const interests = Store.getInterests(trip.id);

      if (state.source === 'pupils') {
        let list = pupils;
        if (state.gradeFilter !== 'all') list = list.filter(p => String(p.grade) === String(state.gradeFilter));
        if (!state.pupilFilters.has('all')) {
          const docsByPupil = {};
          Store.getDocuments(trip.id).forEach(d => {
            if (!docsByPupil[d.pupilId]) docsByPupil[d.pupilId] = [];
            docsByPupil[d.pupilId].push(d);
          });
          list = list.filter(p => {
            for (const f of state.pupilFilters) {
              if (['paid','deposit','pending','overdue'].includes(f) && p.paymentStatus === f) return true;
              if (f === 'flagged' && p.flagged) return true;
              if (f === 'missing-docs' && (docsByPupil[p.id] || []).some(d => d.status === 'missing')) return true;
            }
            return false;
          });
        }
        return list.map(p => ({
          id: p.id, kind: 'pupil',
          label: `${p.firstName} ${p.lastName}`,
          contact: state.channel === 'email' ? (p.guardianEmail || '') : (p.guardianPhone || ''),
          vars: {
            pupilName: `${p.firstName} ${p.lastName}`,
            parentName: p.guardianName || 'Parent',
            tripName: trip.name,
            tripCode: trip.code,
            balance: formatMoney(Store.getPupilBalance(p.id).balance, trip.currency),
            dueDate: trip.startDate
          }
        }));
      }

      if (state.source === 'interests') {
        const activeSet = new Set(['new','contacted','awaiting-details','submitted']);
        const list = interests.filter(i => {
          for (const f of state.interestFilters) {
            if (f === 'active' && activeSet.has(i.status)) return true;
            if (f === i.status) return true;
          }
          return false;
        });
        return list.map(i => ({
          id: i.id, kind: 'interest',
          label: `${i.parentName} (for ${i.pupilName})`,
          contact: state.channel === 'email' ? (i.parentEmail || '') : (i.parentPhone || ''),
          vars: {
            pupilName: i.pupilName,
            parentName: i.parentName,
            tripName: trip.name,
            tripCode: trip.code,
            balance: '—',
            dueDate: trip.startDate
          }
        }));
      }

      // specific
      const result = [];
      state.specificIds.forEach(id => {
        const p = pupils.find(x => x.id === id);
        if (p) {
          result.push({
            id: p.id, kind: 'pupil',
            label: `${p.firstName} ${p.lastName}`,
            contact: state.channel === 'email' ? (p.guardianEmail || '') : (p.guardianPhone || ''),
            vars: {
              pupilName: `${p.firstName} ${p.lastName}`,
              parentName: p.guardianName || 'Parent',
              tripName: trip.name, tripCode: trip.code,
              balance: formatMoney(Store.getPupilBalance(p.id).balance, trip.currency),
              dueDate: trip.startDate
            }
          });
          return;
        }
        const i = interests.find(x => x.id === id);
        if (i) {
          result.push({
            id: i.id, kind: 'interest',
            label: `${i.parentName} (interest)`,
            contact: state.channel === 'email' ? (i.parentEmail || '') : (i.parentPhone || ''),
            vars: {
              pupilName: i.pupilName, parentName: i.parentName,
              tripName: trip.name, tripCode: trip.code,
              balance: '—', dueDate: trip.startDate
            }
          });
        }
      });
      return result;
    }

    function recomputePreview() {
      const list = resolveRecipients();
      body.querySelector('#recipCount').textContent = list.length;
      const namesEl = body.querySelector('#recipNames');
      if (!list.length) {
        namesEl.textContent = 'No recipients match — adjust your filters.';
        return;
      }
      const shown = list.slice(0, 4).map(r => r.label).join(', ');
      const rest = list.length > 4 ? ` + ${list.length - 4} more` : '';
      namesEl.textContent = shown + rest;
    }

    function formatMoney(amount, currency) {
      const sym = currency === 'KES' ? 'KSh' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
      return `${sym}${Math.round(amount).toLocaleString()}`;
    }

    function buildAudienceLabel() {
      if (state.source === 'pupils') {
        const filters = [...state.pupilFilters].join(', ');
        const grade = state.gradeFilter !== 'all' ? ` · Grade ${state.gradeFilter}` : '';
        return `Enrolled pupils: ${filters}${grade}`;
      }
      if (state.source === 'interests') {
        return `Interested parents: ${[...state.interestFilters].join(', ')}`;
      }
      return `Specific people (${state.specificIds.size})`;
    }

    // ==========================================
    //  Modal footer + send
    // ==========================================

    const modal = Modal.open({
      title: 'Compose message', subtitle: trip.code,
      body, size: 'lg',
      footer: [
        { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
        { label: 'Send', type: 'primary', onClick: () => send() }
      ]
    });

    function send() {
      try {
        const form = body.id === 'composeFormEl' ? body : body.querySelector('#composeFormEl');
        if (!form) { Toast.error('Form not found'); return; }
        const fd = new FormData(form);
        const subject = (fd.get('subject') || '').toString().trim();
        const template = (fd.get('body') || '').toString().trim();
        if (!template) return Toast.error('Please write a message');

        const list = resolveRecipients();
        if (!list.length) return Toast.error('No recipients match the selected filters');

        const renderVars = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
        const exampleBody = renderVars(template, list[0].vars);

        Store.createCommunication({
          type: state.channel,
          subject,
          body: exampleBody,
          template,
          audienceLabel: buildAudienceLabel(),
          recipientIds: list.map(r => r.id),
          recipientCount: list.length
        });
        Toast.success(`Logged message to ${list.length} recipient${list.length === 1 ? '' : 's'}`);
        modal.close();
      } catch (err) {
        console.error('[Compose] send failed', err);
        Toast.error('Send failed: ' + (err.message || err));
      }
    }
  }

  return { render };
})();
