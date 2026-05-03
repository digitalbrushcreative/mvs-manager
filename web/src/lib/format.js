/**
 * Formatting and tiny helper utilities. Ported from frontend/js/utils/format.js.
 */

let uidCounter = 0;

export const Fmt = {
  uid(prefix = 'id') {
    uidCounter += 1;
    return `${prefix}_${Date.now().toString(36)}${uidCounter.toString(36)}`;
  },

  capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  },

  date(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  },

  daysUntil(value) {
    if (!value) return null;
    const target = new Date(value);
    if (Number.isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
  },

  money(amount, currency = 'USD') {
    const n = Number(amount || 0);
    try {
      return n.toLocaleString(undefined, { style: 'currency', currency, maximumFractionDigits: 0 });
    } catch {
      return `${currency} ${n.toLocaleString()}`;
    }
  },

  moneyPlain(amount, currency = 'USD') {
    const n = Number(amount || 0);
    const symbol = currency === 'KES' ? 'KSh' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
    return `${symbol}${n.toLocaleString()}`;
  },

  percent(value, decimals = 0) {
    const n = Number(value || 0);
    return `${(n * 100).toFixed(decimals)}%`;
  },

  initials(name) {
    if (!name) return '?';
    return name
      .split(/\s+/)
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  },
};
