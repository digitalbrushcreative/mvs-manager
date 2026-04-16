/* ==========================================
   KPI — stat card
   ==========================================
   Usage:
     KPI.render({
       label: 'Enrolled pupils',
       value: 55,
       unit: '/ 80',
       accent: 'navy',    // navy | crimson | gold | success | warning
       bar: { value: 68, max: 100, color: 'navy' },
       sub: '<strong>12</strong> pending confirmation'
     })
*/

const KPI = {
  render({ label, value, unit = '', accent = 'navy', bar = null, sub = null }) {
    const accentClass = accent === 'navy' ? '' : `accent-${accent}`;
    const el = html`
      <div class="kpi ${accentClass}">
        <div class="kpi-label">${escapeHtml(label)}</div>
        <div class="kpi-value">${value}${unit ? `<span class="unit">${escapeHtml(unit)}</span>` : ''}</div>
        ${bar ? `
          <div class="kpi-bar">
            <div class="kpi-bar-fill ${bar.color || accent}" style="width: ${Math.min(100, (bar.value / bar.max) * 100)}%"></div>
          </div>
        ` : ''}
        ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
      </div>
    `;
    return el;
  },

  grid(kpis) {
    const wrap = html`<div class="kpi-grid"></div>`;
    kpis.forEach(k => wrap.appendChild(KPI.render(k)));
    return wrap;
  }
};
