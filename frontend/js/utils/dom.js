/* ==========================================
   DOM UTILITIES
   ========================================== */

const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

/**
 * Create an HTML element from a template string.
 * Returns the first root node.
 */
function html(strings, ...values) {
  // If called as a regular function with one string arg
  if (typeof strings === 'string') {
    const template = document.createElement('template');
    template.innerHTML = strings.trim();
    return template.content.firstElementChild;
  }
  // Tagged template literal
  const str = strings.reduce((acc, part, i) => {
    const v = values[i];
    return acc + part + (v === undefined ? '' : v);
  }, '');
  const template = document.createElement('template');
  template.innerHTML = str.trim();
  return template.content.firstElementChild;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clearNode(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

function on(target, event, selector, handler) {
  // Allow `on(el, 'click', handler)` shorthand
  if (typeof selector === 'function') {
    target.addEventListener(event, selector);
    return;
  }
  target.addEventListener(event, (e) => {
    const match = e.target.closest(selector);
    if (match && target.contains(match)) handler.call(match, e);
  });
}

function debounce(fn, ms = 200) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}
