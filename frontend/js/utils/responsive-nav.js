/* ==========================================
   RESPONSIVE NAV
   ==========================================
   - Injects a hamburger button + slide-in side panel on mobile so
     the top-nav module switcher is still reachable when there's no
     horizontal room.
   - Syncs a <select> mirror of the subnav items so pages with many
     tabs stay usable on narrow viewports — picking an option clicks
     the matching subnav-item, reusing existing navigation logic.
   - Safe to include on any page that has a .topnav-primary and/or
     .subnav-items block; missing elements are skipped silently.
*/

(function () {
  if (window.__responsiveNavInit) return;
  window.__responsiveNavInit = true;

  document.addEventListener('DOMContentLoaded', () => {
    initHamburger();
    initSubnavSelect();
  });

  // ---------- Hamburger + side panel ----------
  function initHamburger() {
    const primary = document.querySelector('.topnav-primary');
    const brand = document.querySelector('.topnav-brand');
    if (!primary || !brand) return;

    const ham = document.createElement('button');
    ham.type = 'button';
    ham.className = 'nav-hamburger';
    ham.setAttribute('aria-label', 'Open menu');
    ham.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    brand.after(ham);

    const panel = document.createElement('div');
    panel.className = 'side-panel';
    panel.innerHTML = `
      <div class="side-panel-backdrop" data-close-panel></div>
      <aside class="side-panel-inner" role="dialog" aria-label="Menu">
        <div class="side-panel-head">
          <span>Modules</span>
          <button class="side-panel-close" type="button" data-close-panel aria-label="Close menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <nav class="side-panel-items"></nav>
      </aside>
    `;
    document.body.appendChild(panel);

    // Clone each top-nav item into the side panel (so we can still attach original handlers)
    const list = panel.querySelector('.side-panel-items');
    Array.from(primary.children).forEach(el => {
      const clone = el.cloneNode(true);
      clone.classList.add('side-panel-item');
      // If the original was an anchor, the clone navigates naturally. If it's a
      // div with a click handler, replay the click on the original when the
      // clone is clicked so the same handler fires.
      if (el.tagName !== 'A') {
        clone.addEventListener('click', () => el.click());
      }
      list.appendChild(clone);
    });

    const open = () => { panel.classList.add('open'); document.body.classList.add('side-panel-open'); };
    const close = () => { panel.classList.remove('open'); document.body.classList.remove('side-panel-open'); };
    ham.addEventListener('click', open);
    panel.addEventListener('click', (e) => { if (e.target.closest('[data-close-panel]')) close(); });
    // Clicking any module also closes the panel shortly after.
    list.addEventListener('click', () => setTimeout(close, 60));
    // Escape to close.
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });
  }

  // ---------- Subnav → <select> on narrow ----------
  function initSubnavSelect() {
    const items = document.querySelector('.subnav-items');
    if (!items) return;
    const select = document.createElement('select');
    select.className = 'subnav-select';
    select.setAttribute('aria-label', 'Page');

    let syncing = false;
    function rebuild() {
      if (syncing) return;
      syncing = true;
      const children = Array.from(items.children).filter(c => c.dataset.page);
      select.innerHTML = children.map(c => {
        const text = c.textContent.replace(/\s+/g, ' ').trim();
        return `<option value="${c.dataset.page}" ${c.classList.contains('active') ? 'selected' : ''}>${text}</option>`;
      }).join('');
      syncing = false;
    }
    rebuild();

    select.addEventListener('change', (e) => {
      const target = items.querySelector(`[data-page="${e.target.value}"]`);
      if (target) target.click();
    });
    items.after(select);

    // Keep the dropdown's selected option in sync with the active tab.
    const obs = new MutationObserver(() => rebuild());
    obs.observe(items, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'], characterData: true });
  }
})();
