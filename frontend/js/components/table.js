/* ==========================================
   TABLE — data table with sort, select, paginate
   ==========================================
   Usage:
     const t = Table.create({
       columns: [
         { key: 'name', label: 'Name', sortable: true, render: (row) => `<span>${row.name}</span>` },
         ...
       ],
       rows: [...],
       selectable: true,
       pageSize: 20,
       onRowClick: (row) => {...},
       onSelectionChange: (selectedIds) => {...},
       rowKey: 'id', // defaults to 'id'
       emptyState: { icon: '...', title: '...', description: '...', cta: '...' }
     });
     container.appendChild(t.el);
*/

const Table = {
  create({ columns, rows, selectable = false, pageSize = 20, onRowClick = null,
           onSelectionChange = null, rowKey = 'id', emptyState = null }) {

    let sortKey = null;
    let sortDir = 'asc';
    let currentPage = 1;
    const selected = new Set();

    const wrap = html`<div class="table-wrap"></div>`;
    const pagerWrap = html`<div class="card-foot hidden"></div>`;

    function sortRows(data) {
      if (!sortKey) return data;
      const col = columns.find(c => c.key === sortKey);
      if (!col) return data;
      const sortFn = col.sortFn || ((a, b) => {
        const va = a[sortKey];
        const vb = b[sortKey];
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'number' && typeof vb === 'number') return va - vb;
        return String(va).localeCompare(String(vb));
      });
      const sorted = [...data].sort(sortFn);
      return sortDir === 'desc' ? sorted.reverse() : sorted;
    }

    function render() {
      clearNode(wrap);

      if (!rows || rows.length === 0) {
        const empty = emptyState || { icon: '', title: 'No items', description: 'Nothing to show yet.' };
        wrap.appendChild(html`
          <div class="empty-state">
            <div class="icon">${empty.icon || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>'}</div>
            <h3>${escapeHtml(empty.title)}</h3>
            <p>${escapeHtml(empty.description || '')}</p>
            ${empty.cta ? `<button class="btn btn-primary" data-empty-cta>${escapeHtml(empty.cta)}</button>` : ''}
          </div>
        `);
        if (empty.onCta) {
          const btn = wrap.querySelector('[data-empty-cta]');
          if (btn) btn.addEventListener('click', empty.onCta);
        }
        pagerWrap.classList.add('hidden');
        return;
      }

      const sortedRows = sortRows(rows);
      const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      const start = (currentPage - 1) * pageSize;
      const pageRows = sortedRows.slice(start, start + pageSize);

      const table = document.createElement('table');
      table.className = 'data-table';

      // Header
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      if (selectable) {
        const allSelected = pageRows.every(r => selected.has(r[rowKey]));
        const th = document.createElement('th');
        th.style.width = '40px';
        th.innerHTML = `<div class="table-checkbox ${allSelected && pageRows.length ? 'checked' : ''}" data-select-all></div>`;
        tr.appendChild(th);
      }
      columns.forEach(col => {
        const th = document.createElement('th');
        if (col.width) th.style.width = col.width;
        if (col.align) th.style.textAlign = col.align;
        if (col.sortable) th.classList.add('sortable');
        if (sortKey === col.key) th.classList.add('sorted');
        th.dataset.key = col.key;
        th.innerHTML = `${escapeHtml(col.label)}${col.sortable ? `<span class="sort-ind">${sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '▲▼'}</span>` : ''}`;
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      table.appendChild(thead);

      // Body
      const tbody = document.createElement('tbody');
      pageRows.forEach(row => {
        const rowId = row[rowKey];
        const trBody = document.createElement('tr');
        if (selected.has(rowId)) trBody.classList.add('selected');
        trBody.dataset.rowId = rowId;

        if (selectable) {
          const td = document.createElement('td');
          td.innerHTML = `<div class="table-checkbox ${selected.has(rowId) ? 'checked' : ''}" data-select-row></div>`;
          trBody.appendChild(td);
        }
        columns.forEach(col => {
          const td = document.createElement('td');
          if (col.align) td.style.textAlign = col.align;
          td.innerHTML = col.render ? col.render(row) : escapeHtml(row[col.key] ?? '');
          trBody.appendChild(td);
        });
        tbody.appendChild(trBody);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);

      // Sort handlers
      thead.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
          const key = th.dataset.key;
          if (sortKey === key) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
          } else {
            sortKey = key;
            sortDir = 'asc';
          }
          render();
        });
      });

      // Selection handlers
      if (selectable) {
        wrap.querySelector('[data-select-all]').addEventListener('click', (e) => {
          e.stopPropagation();
          const allSelected = pageRows.every(r => selected.has(r[rowKey]));
          if (allSelected) pageRows.forEach(r => selected.delete(r[rowKey]));
          else pageRows.forEach(r => selected.add(r[rowKey]));
          onSelectionChange && onSelectionChange(Array.from(selected));
          render();
        });
        wrap.querySelectorAll('[data-select-row]').forEach(cb => {
          cb.addEventListener('click', (e) => {
            e.stopPropagation();
            const rowId = cb.closest('tr').dataset.rowId;
            if (selected.has(rowId)) selected.delete(rowId);
            else selected.add(rowId);
            onSelectionChange && onSelectionChange(Array.from(selected));
            render();
          });
        });
      }

      // Row click
      if (onRowClick) {
        wrap.querySelectorAll('tbody tr').forEach(tr => {
          tr.addEventListener('click', (e) => {
            if (e.target.closest('[data-select-row], .row-action')) return;
            const rowId = tr.dataset.rowId;
            const row = rows.find(r => r[rowKey] === rowId);
            if (row) onRowClick(row);
          });
        });
      }

      // Pager
      clearNode(pagerWrap);
      pagerWrap.classList.remove('hidden');
      const info = html`<div>Showing <strong>${start + 1}–${Math.min(start + pageSize, sortedRows.length)}</strong> of <strong>${sortedRows.length}</strong></div>`;
      pagerWrap.appendChild(info);

      if (totalPages > 1) {
        const pager = html`<div class="pager"></div>`;
        const prev = html`<button ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
        prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; render(); } });
        pager.appendChild(prev);

        const pageBtns = [];
        if (totalPages <= 7) {
          for (let i = 1; i <= totalPages; i++) pageBtns.push(i);
        } else {
          pageBtns.push(1);
          if (currentPage > 3) pageBtns.push('…');
          for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pageBtns.push(i);
          if (currentPage < totalPages - 2) pageBtns.push('…');
          pageBtns.push(totalPages);
        }
        pageBtns.forEach(p => {
          if (p === '…') {
            pager.appendChild(html`<button disabled>…</button>`);
          } else {
            const b = html`<button class="${currentPage === p ? 'active' : ''}">${p}</button>`;
            b.addEventListener('click', () => { currentPage = p; render(); });
            pager.appendChild(b);
          }
        });

        const next = html`<button ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
        next.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; render(); } });
        pager.appendChild(next);

        pagerWrap.appendChild(pager);
      }
    }

    render();

    return {
      el: wrap,
      footer: pagerWrap,
      update(newRows) { rows = newRows; render(); },
      getSelection() { return Array.from(selected); },
      clearSelection() { selected.clear(); render(); onSelectionChange && onSelectionChange([]); },
      setPage(p) { currentPage = p; render(); }
    };
  }
};
