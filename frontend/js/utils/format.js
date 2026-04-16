/* ==========================================
   FORMATTING
   ========================================== */

const Fmt = {
  money(amount, opts = {}) {
    const { currency = 'USD', plain = false } = opts;
    const symbol = currency === 'KES' ? 'KSh' : '$';
    const n = Number(amount || 0);
    const str = n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (plain) return `${symbol}${str}`;
    return `<span class="cur">${symbol}</span>${str}`;
  },

  moneyPlain(amount, currency = 'USD') {
    const symbol = currency === 'KES' ? 'KSh' : '$';
    return `${symbol}${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  },

  percent(num, denom) {
    if (!denom) return '0%';
    return `${Math.round((num / denom) * 100)}%`;
  },

  date(d, opts = {}) {
    const { style = 'short' } = opts;
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    if (style === 'short') {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (style === 'mono') {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yy = String(date.getFullYear()).slice(2);
      return `${dd}.${mm}.${yy}`;
    }
    if (style === 'long') {
      return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (style === 'relative') {
      return Fmt.relativeDate(d);
    }
    return date.toLocaleDateString('en-GB');
  },

  relativeDate(d) {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days > 1 && days < 7) return `In ${days} days`;
    if (days < -1 && days > -7) return `${Math.abs(days)} days ago`;
    return Fmt.date(d, { style: 'short' });
  },

  daysUntil(d) {
    if (!d) return 0;
    const date = new Date(d);
    const now = new Date();
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  },

  initials(name) {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  },

  phoneNumber(ph) {
    if (!ph) return '—';
    return ph.trim();
  },

  uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  },

  capitalize(s) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
};
