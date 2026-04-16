/* ==========================================
   CHARTS — small inline SVG/CSS charts
   ==========================================
   No dependencies. Each function returns a DOM element.
*/

const Charts = (function () {

  // ---------- Donut chart ----------
  // segments: [{ label, value, color }]
  // Renders a donut with a centered total + legend below.
  function donut({ segments, total, centerLabel = '', centerValue = null, size = 160 }) {
    const sum = total ?? segments.reduce((s, x) => s + (x.value || 0), 0);
    const r = size / 2 - 14;
    const circumference = 2 * Math.PI * r;
    const el = html`<div class="chart chart-donut"></div>`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.classList.add('donut-svg');

    // Background ring
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bg.setAttribute('cx', size / 2);
    bg.setAttribute('cy', size / 2);
    bg.setAttribute('r', r);
    bg.setAttribute('fill', 'none');
    bg.setAttribute('stroke', 'var(--grey-100)');
    bg.setAttribute('stroke-width', 18);
    svg.appendChild(bg);

    // Segments
    let offset = 0;
    if (sum > 0) {
      segments.forEach(seg => {
        if (!seg.value) return;
        const length = (seg.value / sum) * circumference;
        const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        arc.setAttribute('cx', size / 2);
        arc.setAttribute('cy', size / 2);
        arc.setAttribute('r', r);
        arc.setAttribute('fill', 'none');
        arc.setAttribute('stroke', seg.color);
        arc.setAttribute('stroke-width', 18);
        arc.setAttribute('stroke-dasharray', `${length} ${circumference}`);
        arc.setAttribute('stroke-dashoffset', -offset);
        arc.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);
        arc.setAttribute('stroke-linecap', 'butt');
        svg.appendChild(arc);
        offset += length;
      });
    }

    // Center text
    const center = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    center.setAttribute('x', size / 2);
    center.setAttribute('y', size / 2 + 4);
    center.setAttribute('text-anchor', 'middle');
    center.setAttribute('class', 'donut-center-value');
    center.textContent = centerValue ?? sum;
    svg.appendChild(center);

    if (centerLabel) {
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', size / 2);
      label.setAttribute('y', size / 2 + 22);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('class', 'donut-center-label');
      label.textContent = centerLabel;
      svg.appendChild(label);
    }

    el.appendChild(svg);

    // Legend
    const legend = html`<div class="chart-legend"></div>`;
    segments.forEach(seg => {
      const pct = sum > 0 ? Math.round((seg.value / sum) * 100) : 0;
      const row = html`
        <div class="legend-row">
          <span class="legend-dot" style="background:${seg.color};"></span>
          <span class="legend-label">${escapeHtml(seg.label)}</span>
          <span class="legend-value">${seg.value}<span class="legend-pct">${pct}%</span></span>
        </div>
      `;
      legend.appendChild(row);
    });
    el.appendChild(legend);
    return el;
  }

  // ---------- Progress ring ----------
  // For a single percentage (e.g. collection progress).
  function progressRing({ pct, label, sub, color = 'var(--success)', size = 160 }) {
    const r = size / 2 - 12;
    const circumference = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(1, pct));
    const el = html`<div class="chart chart-ring"></div>`;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bg.setAttribute('cx', size / 2); bg.setAttribute('cy', size / 2); bg.setAttribute('r', r);
    bg.setAttribute('fill', 'none'); bg.setAttribute('stroke', 'var(--grey-100)'); bg.setAttribute('stroke-width', 14);
    svg.appendChild(bg);

    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    arc.setAttribute('cx', size / 2); arc.setAttribute('cy', size / 2); arc.setAttribute('r', r);
    arc.setAttribute('fill', 'none'); arc.setAttribute('stroke', color); arc.setAttribute('stroke-width', 14);
    arc.setAttribute('stroke-dasharray', `${circumference * clamped} ${circumference}`);
    arc.setAttribute('stroke-linecap', 'round');
    arc.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);
    svg.appendChild(arc);

    const pctText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    pctText.setAttribute('x', size / 2); pctText.setAttribute('y', size / 2 + 6);
    pctText.setAttribute('text-anchor', 'middle');
    pctText.setAttribute('class', 'ring-center-value');
    pctText.textContent = `${Math.round(clamped * 100)}%`;
    svg.appendChild(pctText);

    el.appendChild(svg);
    if (label || sub) {
      el.appendChild(html`
        <div class="ring-meta">
          ${label ? `<div class="ring-label">${escapeHtml(label)}</div>` : ''}
          ${sub ? `<div class="ring-sub">${escapeHtml(sub)}</div>` : ''}
        </div>
      `);
    }
    return el;
  }

  // ---------- Horizontal segmented bar ----------
  // segments: [{ label, value, color }]. Renders a stacked bar + legend.
  function stackedBar({ segments, total = null, title = '', subtitle = '' }) {
    const sum = total ?? segments.reduce((s, x) => s + x.value, 0);
    const el = html`<div class="chart chart-stacked"></div>`;
    if (title) el.appendChild(html`<div class="chart-head"><div class="chart-title">${escapeHtml(title)}</div>${subtitle ? `<div class="chart-sub">${escapeHtml(subtitle)}</div>` : ''}</div>`);
    const bar = html`<div class="stacked-bar"></div>`;
    segments.forEach(seg => {
      if (!seg.value) return;
      const w = sum > 0 ? (seg.value / sum) * 100 : 0;
      const chunk = html`<div class="stacked-chunk" style="width:${w}%; background:${seg.color};" title="${escapeHtml(seg.label)}: ${seg.value}"></div>`;
      bar.appendChild(chunk);
    });
    el.appendChild(bar);
    const legend = html`<div class="chart-legend chart-legend-horizontal"></div>`;
    segments.forEach(seg => {
      legend.appendChild(html`<div class="legend-row"><span class="legend-dot" style="background:${seg.color};"></span><span class="legend-label">${escapeHtml(seg.label)}</span><span class="legend-value">${seg.value}</span></div>`);
    });
    el.appendChild(legend);
    return el;
  }

  // ---------- Trip capacity list ----------
  // trips: [{ name, segments: [{label, value, color}], capacity }]
  function capacityRows(trips) {
    const el = html`<div class="chart chart-capacity"></div>`;
    trips.forEach(t => {
      const used = t.segments.reduce((s, x) => s + x.value, 0);
      const cap = t.capacity || 1;
      const row = html`
        <div class="capacity-row">
          <div class="capacity-head">
            <span class="capacity-name">${escapeHtml(t.name)}</span>
            <span class="capacity-count">${used}<span style="color:var(--grey-400); font-weight:500;"> / ${cap}</span></span>
          </div>
          <div class="stacked-bar stacked-bar-thin"></div>
        </div>
      `;
      const bar = row.querySelector('.stacked-bar');
      t.segments.forEach(seg => {
        if (!seg.value) return;
        const w = (seg.value / cap) * 100;
        bar.appendChild(html`<div class="stacked-chunk" style="width:${w}%; background:${seg.color};" title="${escapeHtml(seg.label)}: ${seg.value}"></div>`);
      });
      // empty remainder
      const empty = cap - used;
      if (empty > 0) {
        const w = (empty / cap) * 100;
        bar.appendChild(html`<div class="stacked-chunk" style="width:${w}%; background:var(--grey-100);" title="Empty: ${empty}"></div>`);
      }
      el.appendChild(row);
    });
    return el;
  }

  // ---------- Funnel ----------
  // stages: [{ label, value, color }]
  function funnel(stages) {
    const el = html`<div class="chart chart-funnel"></div>`;
    const max = Math.max(...stages.map(s => s.value), 1);
    stages.forEach(s => {
      const w = (s.value / max) * 100;
      const row = html`
        <div class="funnel-row">
          <div class="funnel-bar" style="width:${w}%; background:${s.color};">
            <span class="funnel-label">${escapeHtml(s.label)}</span>
            <span class="funnel-value">${s.value}</span>
          </div>
        </div>
      `;
      el.appendChild(row);
    });
    return el;
  }

  return { donut, progressRing, stackedBar, capacityRows, funnel };
})();
