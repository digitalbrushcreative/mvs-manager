/* ==========================================
   DOCUMENTS PAGE — compliance matrix + types
   ========================================== */

const DocumentsPage = (function() {
  const state = { view: 'matrix', typeFilter: 'all', statusFilter: 'all' };

  function render(root) {
    const trip = Store.activeTrip();
    if (!trip) { root.appendChild(Banner.render()); return; }
    root.appendChild(Banner.render());

    const docs = Store.getDocuments(trip.id);
    const types = Store.getDocumentTypes();

    // Summary stats
    root.appendChild(html`<div class="doc-summary-grid">
      ${types.map(t => {
        const byType = docs.filter(d => d.typeId === t.id);
        const verified = byType.filter(d => d.status === 'verified').length;
        const submitted = byType.filter(d => d.status === 'submitted').length;
        const missing = byType.filter(d => d.status === 'missing').length;
        const tone = missing > 0 ? 'danger' : submitted > 0 ? 'warning' : 'success';
        return `
          <div class="doc-stat ${tone}">
            <div class="head"><span>${escapeHtml(t.name)}</span><span class="tag" style="margin-left: auto; font-family: var(--mono); font-size: 10px; background: var(--grey-50); padding: 2px 6px; border-radius: 3px;">${escapeHtml(t.abbr)}</span></div>
            <div class="num">${verified}<span class="total">/${byType.length}</span></div>
            <div class="foot">${missing} missing · ${submitted} submitted</div>
          </div>
        `;
      }).join('')}
    </div>`);

    const card = html`
      <div class="card">
        <div class="card-head">
          <div class="card-title">Document compliance <span class="tag" id="docResultCount">0 docs</span></div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div id="docView"></div>
            <button class="btn btn-light btn-sm" id="manageTypesBtn">Manage types</button>
            <button class="btn btn-dark" id="addDocBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Add document
            </button>
          </div>
        </div>
        <div id="docFilters" style="padding: 14px 20px; border-bottom: 1px solid var(--grey-100); display: flex; flex-wrap: wrap; gap: 18px;"></div>
        <div id="docContent"></div>
      </div>
    `;
    root.appendChild(card);

    card.querySelector('#addDocBtn').addEventListener('click', () => DocumentForm.open());
    card.querySelector('#manageTypesBtn').addEventListener('click', () => openTypeManager());

    card.querySelector('#docView').appendChild(Chips.create({
      options: [{ value: 'matrix', label: 'Matrix' }, { value: 'list', label: 'List' }],
      active: state.view,
      onChange: (v) => { state.view = v; renderContent(); }
    }));

    const filters = card.querySelector('#docFilters');
    const typeFilterWrap = html`<div style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--grey-500); letter-spacing: 0.06em;">Type</span></div>`;
    typeFilterWrap.appendChild(Chips.create({
      options: [{ value: 'all', label: 'All' }, ...types.map(t => ({ value: t.id, label: t.abbr }))],
      active: state.typeFilter,
      onChange: (v) => { state.typeFilter = v; renderContent(); }
    }));
    filters.appendChild(typeFilterWrap);

    const statusFilterWrap = html`<div style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--grey-500); letter-spacing: 0.06em;">Status</span></div>`;
    statusFilterWrap.appendChild(Chips.create({
      options: [
        { value: 'all', label: 'All' },
        { value: 'verified', label: 'Verified' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'missing', label: 'Missing' },
        { value: 'expiring', label: 'Expiring' }
      ],
      active: state.statusFilter,
      onChange: (v) => { state.statusFilter = v; renderContent(); }
    }));
    filters.appendChild(statusFilterWrap);

    const content = card.querySelector('#docContent');

    function renderContent() {
      clearNode(content);
      if (state.view === 'matrix') renderMatrix();
      else renderList();
    }

    function renderMatrix() {
      const pupils = Store.getPupils(trip.id).sort((a,b) => a.lastName.localeCompare(b.lastName));
      card.querySelector('#docResultCount').textContent = `${pupils.length * types.length} cells`;

      const table = document.createElement('table');
      table.className = 'data-table';
      const thead = `<thead><tr><th style="width: 280px;">Pupil</th>${types.map(t => `<th style="text-align: center; width: 90px;">${escapeHtml(t.abbr)}</th>`).join('')}</tr></thead>`;
      table.innerHTML = thead;
      const tbody = document.createElement('tbody');
      pupils.forEach(p => {
        const row = document.createElement('tr');
        row.dataset.rowId = p.id;
        let cells = `<td><div class="student-cell"><div class="stu-avatar ${p.gender.toLowerCase()}">${Fmt.initials(p.firstName + ' ' + p.lastName)}</div><div><div class="stu-name">${escapeHtml(p.firstName)} ${escapeHtml(p.lastName)}</div><div class="stu-meta">Grade ${p.grade}</div></div></div></td>`;
        types.forEach(t => {
          const doc = docs.find(d => d.pupilId === p.id && d.typeId === t.id);
          const status = doc?.status || 'missing';
          const cls = status === 'verified' ? 'done' : (status === 'submitted' || status === 'expiring') ? 'warning' : 'missing';
          cells += `<td style="text-align: center;"><div class="doc-pill ${cls}" data-doc-click="${t.id}" data-pupil-id="${p.id}" style="display: inline-grid; width: 26px; height: 26px; cursor: pointer;" title="${escapeHtml(t.name)}: ${status}">${escapeHtml(t.abbr)}</div></td>`;
        });
        row.innerHTML = cells;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      const wrap = html`<div class="table-wrap"></div>`;
      wrap.appendChild(table);
      content.appendChild(wrap);

      wrap.querySelectorAll('[data-doc-click]').forEach(el => {
        el.addEventListener('click', () => {
          const typeId = el.dataset.docClick;
          const pupilId = el.dataset.pupilId;
          const doc = docs.find(d => d.pupilId === pupilId && d.typeId === typeId);
          if (doc) DocumentForm.open(doc.id);
          else DocumentForm.open(null, { pupilId, typeId });
        });
      });
    }

    function renderList() {
      let filtered = docs;
      if (state.typeFilter !== 'all') filtered = filtered.filter(d => d.typeId === state.typeFilter);
      if (state.statusFilter !== 'all') filtered = filtered.filter(d => d.status === state.statusFilter);
      card.querySelector('#docResultCount').textContent = `${filtered.length} docs`;

      const columns = [
        { key: 'pupil', label: 'Pupil', render: (d) => {
          const p = Store.getPupil(d.pupilId);
          if (!p) return '<span class="muted">Deleted</span>';
          return `<div class="student-cell"><div class="stu-avatar ${p.gender.toLowerCase()}">${Fmt.initials(p.firstName+' '+p.lastName)}</div><div><div class="stu-name">${escapeHtml(p.firstName)} ${escapeHtml(p.lastName)}</div><div class="stu-meta">Grade ${p.grade}</div></div></div>`;
        }},
        { key: 'type', label: 'Document', render: (d) => {
          const t = Store.getDocumentType(d.typeId);
          return t ? escapeHtml(t.name) : '<span class="muted">Unknown</span>';
        }},
        { key: 'status', label: 'Status', width: '130px', render: (d) => `<span class="doc-status-pill ${d.status}">${Fmt.capitalize(d.status)}</span>` },
        { key: 'filename', label: 'File', render: (d) => d.filename ? `<span class="mono" style="font-size: 11.5px;">${escapeHtml(d.filename)}</span>` : '<span class="muted">—</span>' },
        { key: 'expiresAt', label: 'Expires', width: '130px', render: (d) => d.expiresAt ? `<span class="mono" style="font-size: 11.5px;">${Fmt.date(d.expiresAt, {style:'mono'})}</span>` : '<span class="muted">—</span>' },
        { key: 'actions', label: '', align: 'right', width: '110px', render: (d) => `<div class="row-action">${d.status !== 'verified' ? '<button data-row-action="verify">Verify</button>' : ''}<button data-row-action="edit">Edit</button></div>` }
      ];
      const t = Table.create({ columns, rows: filtered, pageSize: 20, onRowClick: (d) => DocumentForm.open(d.id) });
      content.appendChild(t.el);
      content.appendChild(t.footer);
      content.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-row-action]');
        if (!btn) return;
        e.stopPropagation();
        const id = btn.closest('tr')?.dataset.rowId;
        if (!id) return;
        if (btn.dataset.rowAction === 'edit') DocumentForm.open(id);
        else if (btn.dataset.rowAction === 'verify') {
          Store.updateDocument(id, { status: 'verified', verifiedAt: new Date().toISOString(), verifiedBy: 'Reginah M.' });
          Toast.success('Document verified');
        }
      });
    }

    renderContent();
  }

  function openTypeManager() {
    const types = Store.getDocumentTypes();
    const body = html`
      <div>
        <div id="typeList" style="display: grid; gap: 8px; margin-bottom: 16px;"></div>
        <button class="btn btn-light btn-block" id="addTypeBtn">+ Add document type</button>
      </div>
    `;
    const list = body.querySelector('#typeList');
    types.forEach(t => list.appendChild(renderTypeRow(t)));

    function renderTypeRow(t) {
      const row = html`
        <div style="padding: 12px 14px; border: 1px solid var(--grey-100); border-radius: 6px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 28px; height: 28px; background: var(--navy-deep); color: var(--white); border-radius: 4px; display: grid; place-items: center; font-family: var(--display); font-size: 11px; font-weight: 700;">${escapeHtml(t.abbr)}</div>
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: 600;">${escapeHtml(t.name)}</div>
            <div style="font-size: 11px; color: var(--grey-500);">${t.required ? 'Required' : 'Optional'}${t.requiresExpiry ? ' · has expiry' : ''}</div>
          </div>
          <button class="btn btn-light btn-sm" data-type-edit="${t.id}">Edit</button>
        </div>
      `;
      row.querySelector('[data-type-edit]').addEventListener('click', () => openTypeEditor(t));
      return row;
    }

    function openTypeEditor(existing = null) {
      const isEdit = existing !== null;
      const t = existing || Schema.newDocumentType();
      const formBody = html`
        <div class="form-grid">
          <div class="form-field col-span-2"><label class="form-label">Name <span class="required">*</span></label><input class="form-input" name="name" value="${escapeHtml(t.name)}"></div>
          <div class="form-field"><label class="form-label">Abbreviation</label><input class="form-input mono" name="abbr" value="${escapeHtml(t.abbr)}" maxlength="3" placeholder="P"></div>
          <div class="form-field"><label class="form-label">Required?</label><select class="form-select" name="required"><option value="true" ${t.required ? 'selected' : ''}>Required</option><option value="false" ${!t.required ? 'selected' : ''}>Optional</option></select></div>
          <div class="form-field"><label class="form-label">Has expiry?</label><select class="form-select" name="requiresExpiry"><option value="false" ${!t.requiresExpiry ? 'selected' : ''}>No</option><option value="true" ${t.requiresExpiry ? 'selected' : ''}>Yes</option></select></div>
          <div class="form-field col-span-2"><label class="form-label">Description</label><textarea class="form-textarea" name="description" rows="2">${escapeHtml(t.description)}</textarea></div>
        </div>
      `;
      Modal.open({
        title: isEdit ? 'Edit document type' : 'New document type',
        body: formBody, size: 'lg',
        footer: [
          { label: 'Cancel', type: 'light', onClick: (m) => m.close() },
          { label: 'Save', type: 'primary', onClick: (m) => {
            const data = {
              name: formBody.querySelector('[name=name]').value.trim(),
              abbr: formBody.querySelector('[name=abbr]').value.trim(),
              required: formBody.querySelector('[name=required]').value === 'true',
              requiresExpiry: formBody.querySelector('[name=requiresExpiry]').value === 'true',
              description: formBody.querySelector('[name=description]').value.trim()
            };
            if (!data.name) { Toast.error('Name is required'); return; }
            if (isEdit) { Store.updateDocumentType(t.id, data); Toast.success('Type updated'); }
            else { Store.createDocumentType(data); Toast.success('Type created'); }
            m.close();
            typeModal.close();
            openTypeManager();
          }}
        ]
      });
    }

    const typeModal = Modal.open({
      title: 'Document types',
      subtitle: 'Manage required documents for all pupils',
      body, size: 'lg',
      footer: [{ label: 'Done', type: 'primary', onClick: (m) => m.close() }]
    });

    body.querySelector('#addTypeBtn').addEventListener('click', () => openTypeEditor());
  }

  return { render };
})();
