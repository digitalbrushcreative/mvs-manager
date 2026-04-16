/* ==========================================
   CHIPS — filter chip component
   ==========================================
   Usage:
     const group = Chips.create({
       options: [{ value: 'all', label: 'All', count: 55 }, ...],
       active: 'all',
       onChange: (value) => {...}
     });
     container.appendChild(group);
*/

const Chips = {
  create({ options, active = null, onChange = () => {}, multi = false }) {
    const wrap = html`<div class="card-filters"></div>`;
    let current = multi ? new Set(active || []) : active;

    function render() {
      clearNode(wrap);
      options.forEach(opt => {
        const isActive = multi ? current.has(opt.value) : current === opt.value;
        const chip = html`
          <div class="chip ${isActive ? 'active' : ''}" data-value="${escapeHtml(opt.value)}">
            ${escapeHtml(opt.label)}${opt.count != null ? `<span class="cnum">${opt.count}</span>` : ''}
          </div>
        `;
        chip.addEventListener('click', () => {
          if (multi) {
            if (current.has(opt.value)) current.delete(opt.value);
            else current.add(opt.value);
            onChange(Array.from(current));
          } else {
            current = opt.value;
            onChange(current);
          }
          render();
        });
        wrap.appendChild(chip);
      });
    }

    render();

    wrap.updateOptions = (newOptions, newActive) => {
      options = newOptions;
      if (newActive !== undefined) current = multi ? new Set(newActive || []) : newActive;
      render();
    };

    return wrap;
  }
};
