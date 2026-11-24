// Libre · matá la deuda como en un juego, emprendé y desbloqueá tus viajes.
import * as Store from './store.js?v=2.5.0';

/* =========================================================================
   Utilidades
   ========================================================================= */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const fmt = n => { n = Math.round(n || 0); const s = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return (n < 0 ? '-' : '') + s; };
const gs = n => 'Gs ' + fmt(n);
const gsK = n => {
  n = Math.round(n || 0); const a = Math.abs(n), s = n < 0 ? '-' : '';
  if (a >= 1e6) return s + (Math.round(a / 1e5) / 10).toString().replace('.', ',') + 'M';
  if (a >= 1e4) return s + Math.round(a / 1e3) + 'k';
  return s + fmt(a);
};
const parseN = s => parseInt(String(s ?? '').replace(/[^\d]/g, ''), 10) || 0;
const pad = n => String(n).padStart(2, '0');
const dStr = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => dStr(new Date());
const ym = s => String(s || '').slice(0, 7);
const ymLabel = k => { if (!k) return '—'; const [y, m] = k.split('-'); return MESES_L[+m - 1] + ' ' + y; };
const dLabel = s => { if (!s) return '—'; const [y, m, d] = s.split('-'); return (+d) + ' ' + MESES[+m - 1] + (y !== String(new Date().getFullYear()) ? ' ' + y : ''); };
const addMonth = (k, n) => { let [y, m] = k.split('-').map(Number); m += n; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1; return y + '-' + pad(m); };
const monthsDiff = (a, b) => { const [y1, m1] = a.split('-').map(Number), [y2, m2] = b.split('-').map(Number); return (y2 - y1) * 12 + (m2 - m1); };
const lastDay = k => new Date(+k.slice(0, 4), +k.slice(5, 7), 0).getDate();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sum = (arr, f = x => x) => arr.reduce((a, x) => a + (+f(x) || 0), 0);
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const haptic = (p = 8) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };
const stable = o => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v))
  ? Object.keys(v).sort().reduce((r, kk) => { r[kk] = v[kk]; return r; }, {}) : v);
const byDateDesc = (a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0);

/* =========================================================================
   Íconos: set propio de líneas al estilo SF Symbols
   (los SF Symbols de Apple no se pueden usar en la web por licencia)
   ========================================================================= */
const dot = (x, y, r = 1.25) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`;
const gearPath = (() => {
  const pts = []; const R1 = 9.6, R2 = 7.4;
  for (let i = 0; i < 8; i++) {
    const t = i * Math.PI / 4;
    [[-0.27, R2], [-0.15, R1], [0.15, R1], [0.27, R2]].forEach(([da, r]) => pts.push([12 + r * Math.sin(t + da), 12 - r * Math.cos(t + da)]));
  }
  return 'M' + pts.map(p => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L') + 'Z';
})();
const P = {
  house: '<path d="M4 10.2 12 3.8l8 6.4v9.3a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/>' + dot(4.5, 6) + dot(4.5, 12) + dot(4.5, 18),
  flame: '<path d="M12 21.5c3.9 0 6.8-2.7 6.8-6.6 0-3.8-2.6-6.1-4.2-9.1-.5 2.1-1.6 3.4-2.9 3.9.1-2.5-.7-5.3-2.8-6.9.1 3.1-2.1 5.4-3.7 7.8-.9 1.4-2 2.9-2 4.6 0 3.7 2.9 6.3 6.8 6.3z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7M3 12.5h18"/>',
  map: '<path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5zM9 4.5v13M15 6.5v13"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  xmark: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  cart: '<path d="M2.5 4h2.4l2.3 10.4a1.5 1.5 0 0 0 1.5 1.1h8.6a1.5 1.5 0 0 0 1.4-1.1L20.6 8H5.9"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
  fork: '<path d="M7 3v18M4.5 3v5.2a2.5 2.5 0 0 0 5 0V3M17 21V3c-2.2 1-3.7 3.6-3.7 7.3V13H17"/>',
  car: '<path d="M5 15.5v-4l2-5A2 2 0 0 1 8.9 5h6.2a2 2 0 0 1 1.9 1.5l2 5v4M3.5 15.5h17v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V18h-9v.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zM5 11.5h14"/>',
  tennis: '<circle cx="12" cy="12" r="9"/><path d="M5.7 5.6c3.2 3.4 3.2 9.4 0 12.8M18.3 5.6c-3.2 3.4-3.2 9.4 0 12.8"/>',
  heart: '<path d="M12 20.3s-7.8-4.7-7.8-10.4A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.8 2.9c0 5.7-7.8 10.4-7.8 10.4z"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  ellipsis: '<circle cx="12" cy="12" r="9"/>' + dot(8, 12) + dot(12, 12) + dot(16, 12),
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  creditcard: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>',
  banknote: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/>' + dot(6, 9.5, 1) + dot(18, 14.5, 1),
  bank: '<path d="M3 9.5 12 4l9 5.5M4.5 19.5h15M3 21.5h18M6 11v6M10 11v6M14 11v6M18 11v6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5M12 8S10.6 3.6 8.2 4.5 9 8 12 8zM12 8s1.4-4.4 3.8-3.5S15 8 12 8z"/>',
  sparkles: '<path d="M11 3.5 12.8 8.7 18 10.5 12.8 12.3 11 17.5 9.2 12.3 4 10.5 9.2 8.7z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  bag: '<path d="M5 8h14l-1 12.4a1 1 0 0 1-1 .9H7a1 1 0 0 1-1-.9z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.4 3 8.2 7 9.5 4-1.3 7-5.1 7-9.5V6z"/>',
  airplane: '<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>',
  mountain: '<path d="M2.5 20 9 8.5l4 6.5 2.5-3.5 6 8.5z"/><path d="m7.4 11.3 1.6 1.7 1.6-1.7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  building: '<path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h7A1.5 1.5 0 0 1 14 5.5V21M14 10h4.5a1.5 1.5 0 0 1 1.5 1.5V21M2.5 21h19M7.5 8h3M7.5 12h3M7.5 16h3"/>',
  bolt: '<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>' + dot(12, 12, 1.4),
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.7 2.7L16 9.5"/>',
  arrows: '<path d="M4 8h15M15.5 4.5 19 8l-3.5 3.5M20 16H5M8.5 12.5 5 16l3.5 3.5"/>',
  arrowDown: '<path d="M12 4v15M6 13l6 6 6-6"/>',
  arrowUp: '<path d="M12 20V5M6 11l6-6 6 6"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19c3-4 6-6.5 9-8"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a2.5 2.5 0 0 0 3 4M16 6h3a2.5 2.5 0 0 1-3 4M12 13v4M9.5 17h5v3.5h-5zM8 20.5h8"/>',
  crown: '<path d="M4 18 3 7.5l5 4 4-6.5 4 6.5 5-4L20 18zM4 21h16"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  chart: '<path d="M3.5 20.5h17M6.5 17v-5M11 17V7M15.5 17v-8M20 17V4"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
  gear: `<path d="${gearPath}"/><circle cx="12" cy="12" r="3"/>`,
  cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.6 1.6 3.6 3.6 0 0 1-.4 7.4z"/>',
  bubble: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/><path d="M8 8h8M8 11.5h5"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zM4 20a2 2 0 0 0 2 2h13v-4"/>',
  download: '<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4.5 15v4.5A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5V15"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  envelope: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
  tag: '<path d="M3.5 12.5v-8a1 1 0 0 1 1-1h8l8.5 8.5-9 9z"/>' + dot(8, 8, 1.4),
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 2.5 2.5V21M8 12l1.5-4.5L13 8l2 3 3 1M9.5 7.5 6.5 9 5.5 12"/>',
  coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7M9 14v3c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.6-2.4-2.9-5.5-3"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16.5" height="12" rx="2.5"/><circle cx="16" cy="14" r="1.3"/>',
  faceid: '<path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16M9 9v1.5M15 9v1.5M12 9v4h-1M9 15.5c1.8 1.4 4.2 1.4 6 0"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.6 15.8a5 5 0 0 1 6.8 0"/>' + dot(12, 19, 1.4),
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'
};
const sym = (k, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[k] || P.tag}</svg>`;
const CHEV = '<svg class="chev" viewBox="0 0 9 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 1.5 7 7l-5.5 5.5"/></svg>';
const COLORS = ['red', 'orange', 'yellow', 'green', 'mint', 'teal', 'cyan', 'blue', 'indigo', 'purple', 'pink', 'brown'];
const SYM_CHOICES = ['tag', 'cart', 'fork', 'car', 'heart', 'phone', 'house', 'gift', 'book', 'airplane', 'tennis', 'bag', 'person', 'calendar', 'sparkles', 'box'];

/* =========================================================================
   Modelo de datos
   ========================================================================= */
const BUDGET_META = {
  alquiler: { color: 'blue', tipo: 'nec', sym: 'house' }, servicios: { color: 'yellow', tipo: 'nec', sym: 'bolt' }, cuotas: { color: 'red', tipo: 'deuda', sym: 'link' }, super: { color: 'green', tipo: 'nec', sym: 'cart' },
  afuera: { color: 'orange', tipo: 'deseo', sym: 'fork' }, combustible: { color: 'purple', tipo: 'nec', sym: 'car' }, padel: { color: 'mint', tipo: 'deseo', sym: 'tennis' },
  personal: { color: 'pink', tipo: 'nec', sym: 'heart' }, digital: { color: 'cyan', tipo: 'deseo', sym: 'phone' }, otros: { color: 'gray', tipo: 'nec', sym: 'ellipsis' }
};
const GOAL_META = { colchon: { sym: 'shield', color: 'teal' }, emprender: { sym: 'briefcase', color: 'indigo' }, rio: { sym: 'sun', color: 'green' }, bariloche: { sym: 'mountain', color: 'blue' }, bsas: { sym: 'building', color: 'cyan' } };
function SERVICIOS() { return { id: 'servicios', name: 'Servicios (luz, agua, internet, celular)', amt: 0, fijo: true, why: 'ANDE, agua, internet y plan de celular. Se pagan el día de cobro, junto con el alquiler: cortar la luz o el celular sale más caro.' }; }
const DEFAULT_BUDGET = () => [
  { id: 'alquiler', name: 'Vivienda / alquiler', amt: 0, fijo: true, why: 'Tu techo. Se paga primero, el día que cobrás. Zona sana: menos del 30% del ingreso.' },
  SERVICIOS(),
  { id: 'cuotas', name: 'Cuotas de préstamos', amt: 0, fijo: true, auto: true, why: 'Cada préstamo que derrotás libera su cuota, y esa cuota NO se gasta: pasa a atacar al siguiente (bola de nieve). Por eso el monto total para deudas se mantiene fijo aunque las cuotas bajen.' },
  { id: 'super', name: 'Supermercado', amt: 0, why: 'Una compra grande por semana con lista evita el goteo diario de compras chicas. Comida de casa = la palanca más fuerte del plan.' },
  { id: 'afuera', name: 'Comida afuera y delivery', amt: 0, why: 'Suele ser la mayor fuga. No es prohibir: es elegir 1–2 salidas buenas por semana.' },
  { id: 'combustible', name: 'Combustible y transporte', amt: 0, why: 'Las apps de transporte salen del mismo sobre. Agrupá trámites para hacer menos viajes.' },
  { id: 'padel', name: 'Deporte y ocio', amt: 0, why: 'Salud y vida social: no se elimina, se le pone techo mientras dure el modo batalla.' },
  { id: 'personal', name: 'Salud y cuidado personal', amt: 0, why: 'Farmacia y cuidado personal. Tratamientos grandes: planificalos como gasto puntual, nunca financiados con la tarjeta.' },
  { id: 'digital', name: 'Suscripciones y online', amt: 0, why: 'Las compras al exterior pagan IVA a servicios digitales y cargo internacional. Regla: si no te genera ingreso o ahorro, esperá a ser libre.' },
  { id: 'otros', name: 'Imprevistos y otros', amt: 0, why: 'Margen para que lo inesperado no rompa el plan. Lo que sobre a fin de mes va al cofre.' }
];
const DEFAULT_GOALS = () => [
  { id: 'colchon', name: 'Colchón de emergencia', target: 1500000, saved: 0, kind: 'base', why: 'Tu escudo. Sin colchón, el primer imprevisto vuelve a la tarjeta y borra meses de progreso. Guardalo en una cuenta aparte, no en la tarjeta.' },
  { id: 'emprender', name: 'Caja del negocio', target: 2000000, saved: 0, kind: 'base', why: 'Capital de trabajo: con esto comprás mercadería, herramientas y publicidad. Cuando vendés, el costo vuelve acá para comprar el siguiente producto. El negocio se financia con sus ventas, nunca con la tarjeta.' },
  { id: 'rio', name: 'Río de Janeiro', target: 9000000, saved: 0, kind: 'viaje' },
  { id: 'bariloche', name: 'Bariloche', target: 10000000, saved: 0, kind: 'viaje' },
  { id: 'bsas', name: 'Buenos Aires', target: 6000000, saved: 0, kind: 'viaje' }
];
const DEFAULT_SETTINGS = () => ({ base: 0, extra: 0, ataqueMensual: 0, pctVenta: 50, metaFacturacion: 5000000, ivaAuto: true, lump: 0, lumpMes: '', lumpRecibido: false, lumpTarget: '', diaCobro: 0, viajesAntes: false });
function blankState() {
  return {
    v: 2, created: today(), profile: { nombre: '', contexto: '' }, settings: DEFAULT_SETTINGS(),
    baseCuotas: 0, cards: [], loans: [], budget: DEFAULT_BUDGET(), funds: { cofre: 0, iva: 0 }, goals: DEFAULT_GOALS(),
    tasks: {}, ach: {}, xp: 0, checkins: [], initialTotal: 0,
    payables: [], // deudas con proveedores (compras a crédito): { id, prov, desc, amt, iva, date, venc, venta, pagos: [{ id, d, amt, venta | mov }] }
    hist: [],     // foto diaria de la deuda: { d, m (préstamos + tarjetas), p (proveedores pendientes) }
    accounts: []  // dónde está la plata: { id, name, kind: banco|efectivo|billetera, color, ini, iniTs, iniD, conc }
  };
}
function normalize(raw) {
  const s = Object.assign(blankState(), raw || {});
  s.settings = Object.assign(DEFAULT_SETTINGS(), s.settings || {});
  s.profile = Object.assign({ nombre: '', contexto: '' }, s.profile || {});
  s.funds = Object.assign({ cofre: 0, iva: 0 }, s.funds || {});
  s.cards = s.cards || []; s.loans = s.loans || [];
  if (!s.budget || !s.budget.length) s.budget = DEFAULT_BUDGET();
  if (!s.budget.some(b => b.id === 'servicios')) { const i = s.budget.findIndex(b => b.id === 'alquiler'); s.budget.splice(i + 1, 0, SERVICIOS()); }
  s.fijos = s.fijos || []; // gastos fijos: { id, name, amt, dia, prio (1–3), amb, cat, cuenta, iva, sym, color }
  s.budget.forEach(b => { const d = BUDGET_META[b.id] || {}; b.color = b.color || d.color || 'gray'; b.tipo = b.tipo || d.tipo || 'nec'; b.sym = b.sym || d.sym || 'tag'; });
  s.goals = s.goals || [];
  DEFAULT_GOALS().forEach(g => { if (!s.goals.find(x => x.id === g.id)) s.goals.push(g); });
  s.goals.forEach(g => { const d = GOAL_META[g.id] || {}; g.sym = g.sym || d.sym || 'star'; g.color = g.color || d.color || 'blue'; });
  s.loans.forEach((l, i) => { l.color = l.color || ['red', 'orange', 'purple', 'pink', 'indigo', 'teal'][i % 6]; });
  s.tasks = s.tasks || {}; s.ach = s.ach || {}; s.checkins = s.checkins || []; s.xp = s.xp || 0;
  s.payables = (s.payables || []).map(p => Object.assign({ pagos: [] }, p));
  s.hist = s.hist || [];
  s.accounts = s.accounts || [];
  return s;
}
// Copias de la versión 1 (archivo libre-de-deudas.html)
function fromV1(d) {
  const s = blankState();
  Object.assign(s.settings, {
    base: d.settings.base || 0, extra: d.settings.extra || 0, ataqueMensual: d.settings.ataqueMensual || 0,
    pctVenta: d.settings.pctVenta ?? 50, lump: d.settings.lump || 0, lumpMes: d.settings.lumpMes || '', lumpRecibido: !!d.settings.lumpRecibido
  });
  if (d.settings.metaFacturacion) s.settings.metaFacturacion = d.settings.metaFacturacion;
  if (d.profile) s.profile = Object.assign(s.profile, d.profile);
  s.created = d.created || s.created;
  s.baseCuotas = d.baseCuotas || sum(d.loans || [], l => l.cuota);
  s.cards = d.card ? [Object.assign({ id: 'tc1', name: d.card.name || 'Tarjeta de crédito' }, d.card)] : [];
  s.loans = d.loans || [];
  s.budget = (d.budget || DEFAULT_BUDGET()).map(b => Object.assign({}, b));
  s.funds.cofre = d.cofre || 0;
  const col = s.goals.find(g => g.id === 'colchon'), emp = s.goals.find(g => g.id === 'emprender');
  col.saved = d.colchon || 0; if (d.settings.colchonMeta) col.target = d.settings.colchonMeta;
  emp.saved = d.emprender || 0;
  Object.assign(s, { tasks: d.tasks || {}, ach: d.ach || {}, xp: d.xp || 0, checkins: d.checkins || [] });
  const movs = (d.log || []).map(e => {
    const m = Object.assign({}, e);
    if (m.t === 'gasto') { m.ambito = 'personal'; if (m.medio === 'tc') m.card = 'tc1'; }
    if (m.t === 'pagotc') m.card = 'tc1';
    if (m.t === 'ingreso') { m.split = {}; if (e.toCofre) m.split.cofre = e.toCofre; if (e.toColchon) m.split.colchon = e.toColchon; if (e.toEmp) m.split.emprender = e.toEmp; }
    if (m.t === 'venta') { m.iva = 'ex'; m.ivaAmt = 0; m.ivaRes = 0; m.neto = e.ganancia ?? e.amt; m.ganancia = e.ganancia ?? e.amt; m.toEmp = e.toEmp || 0; m.toCofre = e.toCofre || 0; }
    return m;
  });
  const st = normalize(s);
  st.initialTotal = d.initialTotal || totalDebt(st);
  return { state: st, movs };
}
function importAny(o) {
  if (o && o.app === 'libre' && o.state) return { state: normalize(o.state), movs: o.movs || [] };
  if (o && o.loans && o.budget && o.settings) return fromV1(o);
  throw new Error('formato');
}

/* =========================================================================
   Estado en memoria y persistencia
   ========================================================================= */
let S = null, M = [], BK = null, STOP = null, USER = null;
let LAST = '', firstData = true, pendingRender = false, APP_ON = false;
let TAB = 'hoy', MK = ym(today()), MF = 'todos';

const movSig = ms => ms.length + ':' + ms.reduce((a, m) => Math.max(a, m.ts || 0), 0);
function setSync(s) { const d = $('#syncDot'); if (d) d.className = 'sync ' + s; }
function commit({ add = [], del = [] } = {}) {
  snapDebt();
  add.forEach(m => { M = M.filter(x => x.id !== m.id); M.push(m); });
  if (del.length) M = M.filter(m => !del.includes(m.id));
  LAST = stable(S) + '|' + movSig(M);
  if (!BK) return;
  const kind = BK.kind;
  setSync(kind === 'local' ? 'local' : 'saving');
  Promise.resolve(BK.write({ state: S, add, del, movs: M }))
    .then(() => setSync(kind === 'local' ? 'local' : 'ok'))
    .catch(e => { console.error(e); setSync('error'); toast('No se pudo guardar: ' + (e.code || e.message)); });
}
function replaceAll(state, movs) {
  const ids = new Set(movs.map(m => m.id));
  const del = M.map(m => m.id).filter(id => !ids.has(id));
  S = normalize(state); M = [];
  commit({ add: movs, del });
}
function onData({ state, movs, pending }) {
  // Eco de nuestras propias escrituras. Al abrir sin internet con cambios sin subir, la primera
  // lectura viene "pendiente": hay que mostrarla igual o la app queda en la pantalla de carga.
  if (pending && !firstData) return;
  if (!state) { if (firstData) { firstData = false; showOnboarding(); } return; }
  const sig = stable(state) + '|' + movSig(movs || []);
  if (!firstData && sig === LAST) return;
  firstData = false; LAST = sig;
  S = normalize(state); M = movs || [];
  if (!APP_ON) showApp(); else safeRender();
}

/* =========================================================================
   Cálculos
   ========================================================================= */
const loan = id => S.loans.find(l => l.id === id);
const card = id => S.cards.find(c => c.id === id);
const goal = id => S.goals.find(g => g.id === id);
const loanSaldo = l => sum(l.cuotas.filter(c => !c.paid), c => c.a);
const loanTotal = l => sum(l.cuotas, c => c.o);
const cardDebt = (s = S) => sum(s.cards, c => Math.max(0, c.saldo));
const totalDebt = (s = S) => sum(s.loans, loanSaldo) + cardDebt(s);
const activeLoans = () => S.loans.filter(l => loanSaldo(l) > 0);
const nextCuota = l => l.cuotas.find(c => !c.paid);
const lastDate = l => { const u = l.cuotas.filter(c => !c.paid); return u.length ? u[u.length - 1].d : null; };
const taeN = l => parseFloat(String(l.tae || '').replace(',', '.')) || 0;
const debtBudget = () => S.baseCuotas + S.settings.ataqueMensual;
const budAmt = b => b.id === 'cuotas' ? S.baseCuotas : b.amt;
const isFree = () => (S.loans.length > 0 || S.cards.length > 0) && activeLoans().length === 0 && cardDebt() <= 0;
const travelOpen = () => isFree() || S.settings.viajesAntes;
const pctFree = () => S.initialTotal > 0 ? clamp((1 - totalDebt() / S.initialTotal) * 100, 0, 100) : 0;
const ivaOf = (amt, iva) => iva === '10' ? Math.round(amt / 11) : iva === '5' ? Math.round(amt / 21) : 0;

// Entidades (a quién le debés) y proveedores
const entOf = x => String(x.entidad || '').trim();
const debtName = l => entOf(l) ? entOf(l) + ' · ' + l.name : l.name;
const BANKS = ['Banco Itaú', 'Banco Continental', 'Cooperativa Universitaria', 'Sudameris Bank', 'Banco Familiar', 'ueno bank', 'Banco GNB', 'Banco Basa', 'Banco Atlas', 'Interfisa Banco', 'Bancop', 'Banco Nacional de Fomento', 'Banco Río', 'Zeta Banco', 'Tu Financiera', 'Financiera FIC'];
const uniq = a => [...new Set(a.filter(Boolean))];
const entOptions = () => uniq(S.loans.concat(S.cards).map(entOf).concat((S.accounts || []).map(a => a.name), BANKS));
const dlist = (id, items) => `<datalist id="${id}">${items.map(x => `<option value="${esc(x)}"></option>`).join('')}</datalist>`;
const payable = id => S.payables.find(p => p.id === id);
const payPaid = p => sum(p.pagos, x => x.amt);
const payPend = p => Math.max(0, p.amt - payPaid(p));
const provDebt = (s = S) => sum(s.payables || [], payPend);
const knownProvs = () => uniq(S.payables.map(p => p.prov));
const pendPayables = () => S.payables.filter(p => payPend(p) > 0);

// Cuentas (bancos, efectivo): el saldo sale del saldo inicial + los movimientos registrados después de cargarlo
const acct = id => S.accounts.find(a => a.id === id);
const acctName = id => id ? ((acct(id) || {}).name || 'cuenta eliminada') : '';
const acctIcon = a => a.kind === 'efectivo' ? 'banknote' : a.kind === 'billetera' ? 'wallet' : 'bank';
// Cada movimiento → [[cuenta, +entra / −sale, momento]]
function acctFlows(m) {
  const ts = m.ts || 0, out = [];
  switch (m.t) {
    case 'ingreso': if (m.cuenta) out.push([m.cuenta, m.amt, ts]); break;
    case 'venta':
      if (m.cobrada !== false) {
        const t2 = m.cobTs || ts;
        if (m.cuenta) out.push([m.cuenta, m.amt, t2]);
        const cp = m.cuentaProv || m.cuenta;
        if (m.provPaid && m.payable && cp) out.push([cp, -(m.payAmt || m.costo || 0), t2]);
      }
      break;
    case 'gasto': if (m.medio !== 'tc' && m.cuenta) out.push([m.cuenta, -m.amt, ts]); break;
    case 'cuota': case 'ataque': case 'precancel': case 'pagotc': case 'pagoiva': case 'pagoprov':
      if (m.cuenta) out.push([m.cuenta, -m.amt, ts]); break;
    case 'transf': out.push([m.from, -m.amt, ts], [m.to, m.amt, ts]); break;
    case 'ajuste': out.push([m.cuenta, (m.dir || 1) * m.amt, ts]); break;
  }
  return out;
}
const acctBal = a => (a.ini || 0) + sum(M, m => sum(acctFlows(m).filter(f => f[0] === a.id && f[2] > (a.iniTs || 0)), f => f[1]));
const acctDefault = () => { const l = lsGet('libre-acct'); return acct(l) ? l : (S.accounts[0] || {}).id || ''; };
// Selector de cuenta para las hojas de pago (input oculto + chips)
function acctPicker(id, label = 'Pagado desde', cur = acctDefault()) {
  if (!S.accounts.length) return '';
  return `<div class="gh">${label}</div><input type="hidden" id="${id}" value="${esc(cur)}"><div class="chips">${S.accounts.map(a =>
    `<button class="chip ${a.id === cur ? 'on' : ''}" data-act="pick" data-target="${id}" data-v="${a.id}" style="--c:var(--${a.color})"><span class="chip-ic">${sym(acctIcon(a))}</span>${esc(a.name)}</button>`).join('')}<button class="chip ${cur ? '' : 'on'}" data-act="pick" data-target="${id}" data-v="" style="--c:var(--gray)"><span class="chip-ic">${sym('minus')}</span>Ninguna</button></div>`;
}
const pickedAcct = id => { const e = $('#' + id), v = e ? e.value : ''; if (v) lsSet('libre-acct', v); return v; };
// Movimientos de una cuenta registrados antes de cargar su saldo (ya incluidos en ese saldo)
const acctBefore = a => { const out = []; M.forEach(m => acctFlows(m).forEach(f => { if (f[0] === a.id && f[2] <= (a.iniTs || 0)) out.push({ m, d: f[1] }); })); return out; };
const acctAll = id => { const out = []; M.forEach(m => acctFlows(m).forEach(f => { if (f[0] === id) out.push({ m, d: f[1] }); })); return out; };

// Plata de un préstamo: lo que te quedó guardado y en qué se fue usando (movimientos con origen = id del préstamo)
const loanUses = l => M.filter(m => m.origen === l.id).sort(byDateDesc);
const fondoUsado = l => sum(loanUses(l), m => m.amt);
const fondoQueda = l => l.guardado ? Math.max(0, l.guardado.amt - fondoUsado(l)) : 0;
const fondoLoans = () => S.loans.filter(l => l.guardado && l.guardado.amt > 0);
// Selector "¿Con qué plata?" (propia o del préstamo); solo aparece si hay plata de préstamo guardada
function origPicker(id, cur = '') {
  const ls = fondoLoans().filter(l => fondoQueda(l) > 0 || l.id === cur); if (!ls.length) return '';
  return `<div class="gh">¿Con qué plata?</div><input type="hidden" id="${id}" value="${esc(cur)}"><div class="chips">
    <button class="chip ${cur ? '' : 'on'}" data-act="pick" data-target="${id}" data-v="" style="--c:var(--green)"><span class="chip-ic">${sym('wallet')}</span>Propia</button>
    ${ls.map(l => `<button class="chip ${l.id === cur ? 'on' : ''}" data-act="pick" data-target="${id}" data-v="${l.id}" style="--c:var(--${l.color})"><span class="chip-ic">${sym('bank')}</span>Préstamo ${esc(entOf(l) || l.name)} · queda ${gsK(fondoQueda(l))}</button>`).join('')}</div>`;
}
const pickedOrig = id => { const e = $('#' + id); return e ? e.value : ''; };

// Gastos fijos (alquiler, contadora, ANDE…): un pago por mes, con prioridad
const fijo = id => S.fijos.find(f => f.id === id);
const dueDate = (k, dia) => k + '-' + pad(Math.min(dia || 1, lastDay(k)));
// Ciclo de cobro: del día de cobro de un mes al día anterior del siguiente (ej.: 25 nov → 24 dic).
// Lo que pagás con el sueldo del 25 cubre lo que vence hasta el próximo cobro.
const dcDay = () => S.settings.diaCobro || 25;
const cycleOf = d => { const k = ym(d); return +d.slice(8) >= Math.min(dcDay(), lastDay(k)) ? k : addMonth(k, -1); };
const cycleStart = k => dueDate(k, dcDay());
const dueInCycle = (k, dia) => (dia || 1) >= dcDay() ? dueDate(k, dia) : dueDate(addMonth(k, 1), dia);
const planCycle = () => cycleOf(dStr(new Date(Date.now() + 5 * 864e5))); // 5 días antes del cobro ya se planifica el ciclo nuevo
const fijoCycle = f => { let k = planCycle(); if (f.desde && dueInCycle(k, f.dia) < f.desde) k = addMonth(k, 1); return k; };
const fijoPaid = (f, k = fijoCycle(f)) => M.find(m => m.t === 'gasto' && m.fijo === f.id && (m.ciclo || cycleOf(m.date)) === k);
const PRIO_L = { 1: 'Primero', 2: 'Importante', 3: 'Puede esperar' };
const fijosSorted = () => S.fijos.slice().sort((a, b) => (a.prio || 2) - (b.prio || 2) || (a.dia || 0) - (b.dia || 0));
// El sobre de un fijo personal (alquiler, servicios) toma como monto la suma de sus gastos fijos
function syncFijoSobres() {
  S.budget.forEach(b => {
    if (!b.fijo || b.id === 'cuotas') return;
    const fs = S.fijos.filter(f => f.amb !== 'negocio' && f.cat === b.id);
    if (fs.length) b.amt = sum(fs, f => f.amt);
  });
}
// Día de cobro: el cobro de este ciclo y el siguiente
function payWindow() { const k = planCycle(); return { dc: dcDay(), pay: cycleStart(k), next: cycleStart(addMonth(k, 1)), mk: k }; }
// Ventas que todavía no te pagaron (cuentas por cobrar)
const receivables = () => M.filter(m => m.t === 'venta' && m.cobrada === false).sort(byDateDesc);

// Foto diaria de la deuda para el gráfico "Cómo baja tu deuda"
function snapDebt() {
  if (!S) return;
  const t = today(), m = totalDebt(), p = provDebt(), h = S.hist;
  if (!h.length && S.initialTotal > 0 && S.created && S.created < t) h.push({ d: S.created, m: S.initialTotal, p: 0 });
  const last = h[h.length - 1];
  if (last && last.d === t) { last.m = m; last.p = p; }
  else if (!last || last.m !== m || last.p !== p) h.push({ d: t, m, p });
  if (h.length > 900) S.hist = h.slice(-900);
}
// Valor de la deuda en una fecha (la última foto hasta ese día)
function debtAt(d) { let v = null; for (const x of S.hist) { if (x.d <= d) v = x.m; else break; } return v; }

function attackOrder() {
  const act = activeLoans();
  const allTae = act.length > 0 && act.every(l => taeN(l) > 0);
  const list = act.slice().sort((a, b) => allTae ? taeN(b) - taeN(a) : (b.cuota / loanSaldo(b)) - (a.cuota / loanSaldo(a)));
  return { list, mode: allTae ? 'tae' : 'flujo' };
}
/* Hoja de ruta: simulación mes a mes desde tu situación REAL (lo que ya aplicaste).
   Monto fijo para deudas cada mes; primero la tarjeta (tasa alta), después los préstamos en orden de ataque.
   Lo que libera cada préstamo pasa al siguiente (bola de nieve). */
function simulate() {
  const loans = S.loans.map(l => ({ id: l.id, name: debtName(l), cs: l.cuotas.filter(c => !c.paid).map(c => ({ d: c.d, a: c.a })) }));
  let cd = cardDebt();
  const left = () => sum(loans, l => sum(l.cs, c => c.a)) + cd;
  const k0 = ym(today()), months = [];
  if (left() <= 0) return { fin: k0, months };
  const order = attackOrder().list.map(l => l.id);
  let k = k0;
  for (let i = 0; i < 72; i++) {
    // Mes actual: el sueldo ya está comprometido; cuenta lo que hay en el cofre. Meses siguientes: el monto fijo del plan.
    let budget = i === 0 ? sum(loans, l => sum(l.cs.filter(c => ym(c.d) <= k), c => c.a)) + Math.max(0, S.funds.cofre) : debtBudget();
    let lump = 0, lumpTo = null;
    const kills = [], killIds = []; let cuotas = 0;
    const kill = l => { kills.push(l.name); killIds.push(l.id); };
    if (!S.settings.lumpRecibido && S.settings.lumpMes === k && S.settings.lump) {
      lump = S.settings.lump;
      // Aguinaldo con destino fijo: primero precancela ese préstamo (desde la última cuota); lo que sobra sigue el plan
      const lt = S.settings.lumpTarget && loans.find(x => x.id === S.settings.lumpTarget);
      let rem = lump;
      if (lt && lt.cs.length) {
        lumpTo = lt.name;
        while (rem > 0 && lt.cs.length) { const c = lt.cs[lt.cs.length - 1]; if (c.a <= rem) { rem -= c.a; lt.cs.pop(); if (!lt.cs.length) kill(lt); } else { c.a -= rem; rem = 0; } }
      }
      budget += rem;
    }
    loans.forEach(l => { while (l.cs.length && ym(l.cs[0].d) <= k) { budget -= l.cs[0].a; cuotas += l.cs[0].a; l.cs.shift(); if (!l.cs.length) kill(l); } });
    let extra = Math.max(0, budget), tarjeta = 0, ataque = 0, target = null;
    if (cd > 0 && extra > 0) { tarjeta = Math.min(cd, extra); cd -= tarjeta; extra -= tarjeta; }
    for (const id of order) {
      const l = loans.find(x => x.id === id);
      while (extra > 0 && l.cs.length) {
        if (!target) target = l.name;
        const c = l.cs[l.cs.length - 1];
        if (c.a <= extra) { extra -= c.a; ataque += c.a; l.cs.pop(); if (!l.cs.length) kill(l); } else { c.a -= extra; ataque += extra; extra = 0; }
      }
    }
    months.push({ k, cuotas, tarjeta, cardDone: tarjeta > 0 && cd <= 0, ataque, target, lump, lumpTo, kills, killIds, left: left() });
    if (left() <= 0) return { fin: k, months };
    k = addMonth(k, 1);
  }
  return { fin: k, months, never: true };
}
// Sin plan: solo pagar las cuotas según el cronograma del banco
function noPlanEnd() { const e = S.loans.reduce((m, l) => { const d = lastDate(l); return d && d > m ? d : m; }, ''); return e ? ym(e) : ym(today()); }
let SIM = null;
const sim = () => SIM || (SIM = simulate());
const projection = () => sim().fin;
// Mes en que cae cada préstamo / la tarjeta según la hoja de ruta
const loanFreeMonth = id => { const m = sim().months.find(x => x.killIds.includes(id)); return m ? m.k : null; };
const cardFreeMonth = () => { if (cardDebt() <= 0) return null; const m = sim().months.find(x => x.cardDone); return m ? m.k : null; };
const inMonth = (k, types) => M.filter(m => ym(m.date) === k && (!types || types.includes(m.t)));
function monthSpent(cat, k = ym(today())) {
  if (cat === 'cuotas') return sum(inMonth(k, ['cuota']), m => m.amt);
  return sum(M.filter(m => m.t === 'gasto' && m.ambito !== 'negocio' && m.cat === cat && ym(m.date) === k), m => m.amt);
}
const factMonth = k => sum(inMonth(k, ['venta']), m => m.amt);
const ganancia = m => m.ganancia ?? m.neto ?? m.amt;
function bestMonthFact() { const by = {}; M.filter(m => m.t === 'venta').forEach(m => { const k = ym(m.date); by[k] = (by[k] || 0) + m.amt; }); return Math.max(0, ...Object.values(by)); }
function monthSummary(k) {
  const ms = M.filter(m => ym(m.date) === k), f = t => ms.filter(t);
  const ingresos = sum(f(m => m.t === 'ingreso' || (m.t === 'venta' && m.cobrada !== false)), m => m.amt);
  const gPers = sum(f(m => m.t === 'gasto' && m.ambito !== 'negocio'), m => m.amt);
  // Negocio: gastos + costo pagado al proveedor con la venta + pagos directos a proveedores (los "con la venta" ya están en el costo)
  const gNeg = sum(f(m => m.t === 'gasto' && m.ambito === 'negocio'), m => m.amt)
    + sum(f(m => m.t === 'venta' && m.cobrada !== false && (m.costoA || 'proveedor') === 'proveedor'), m => m.costo || 0)
    + sum(f(m => m.t === 'pagoprov' && m.src !== 'venta'), m => m.amt);
  const deudas = sum(f(m => ['cuota', 'ataque', 'precancel'].includes(m.t)), m => m.amt);
  const iva = sum(f(m => m.t === 'pagoiva'), m => m.amt);
  const tc = sum(f(m => m.t === 'gasto' && m.medio === 'tc'), m => m.amt);
  const pagotc = sum(f(m => m.t === 'pagotc'), m => m.amt);
  const egresos = gPers + gNeg + deudas + iva;
  return { ingresos, gPers, gNeg, deudas, iva, tc, pagotc, egresos, neto: ingresos - egresos };
}
function ivaMonth(k) {
  const ms = M.filter(m => ym(m.date) === k);
  return {
    deb: sum(ms.filter(m => m.t === 'venta'), m => m.ivaAmt),
    cred: sum(ms.filter(m => m.t === 'gasto' && m.ambito === 'negocio'), m => m.ivaAmt) + sum(ms.filter(m => m.t === 'venta'), m => m.ivaCosto),
    pers: sum(ms.filter(m => m.t === 'gasto' && m.ambito !== 'negocio'), m => m.ivaAmt),
    pagado: sum(ms.filter(m => m.t === 'pagoiva'), m => m.amt)
  };
}
function ivaDue(per) { const v = ivaMonth(per); return Math.max(0, v.deb - v.cred - sum(M.filter(m => m.t === 'pagoiva' && m.periodo === per), m => m.amt)); }
function varLeft() {
  const k = ym(today());
  const left = sum(S.budget.filter(b => !b.fijo), b => Math.max(0, b.amt - monthSpent(b.id, k)));
  const d = new Date(); const daysLeft = lastDay(k) - d.getDate() + 1;
  return { left, perDay: left / daysLeft, daysLeft };
}
function streak() {
  const set = new Set(S.checkins); const d = new Date(); let n = 0;
  if (!set.has(dStr(d))) d.setDate(d.getDate() - 1);
  while (set.has(dStr(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
// Lo que vos aplicaste a deudas en el mes vs. lo que pide el plan
function appliedMonth(k = ym(today())) {
  const due = sum(S.loans, l => sum(l.cuotas.filter(c => ym(c.d) === k), c => c.o));
  const lump = S.settings.lumpMes === k ? S.settings.lump : 0;
  return { done: sum(inMonth(k, ['cuota', 'ataque', 'precancel', 'pagotc']), m => m.amt), target: due + S.settings.ataqueMensual + lump };
}
function rings(k = ym(today())) {
  const ap = appliedMonth(k), fact = factMonth(k), meta = S.settings.metaFacturacion;
  const days = k === ym(today()) ? new Date().getDate() : lastDay(k);
  const reg = S.checkins.filter(c => ym(c) === k).length;
  return [
    { name: 'Ataque a la deuda', color: '#fa114f', p: ap.target ? ap.done / ap.target : 0, a: gsK(ap.done), b: gsK(ap.target) },
    { name: 'Facturación', color: '#a6ff00', p: meta ? fact / meta : 0, a: gsK(fact), b: gsK(meta) },
    { name: 'Hábito', color: '#00e5ff', p: days ? reg / days : 0, a: reg, b: days + ' días' }
  ];
}
function travelPlan() {
  const capM = debtBudget() * 0.3; let k = isFree() ? ym(today()) : projection();
  return S.goals.filter(g => g.kind === 'viaje').map(g => {
    const falta = Math.max(0, g.target - g.saved); const n = capM > 0 ? Math.ceil(falta / capM) : null;
    const done = n != null ? addMonth(k, n) : null; if (done) k = done; return { g, n, done };
  });
}

/* =========================================================================
   Gamificación
   ========================================================================= */
const RANKS = [[0, 'Endeudado valiente', 'shield'], [10, 'Aprendiz de finanzas', 'book'], [25, 'Estratega', 'target'], [50, 'Guerrero sin cuotas', 'flame'], [75, 'Casi libre', 'star'], [100, 'Libre', 'crown']];
const rank = () => { const p = isFree() ? 100 : pctFree(); let r = RANKS[0]; RANKS.forEach(x => { if (p >= x[0]) r = x; }); return r; };
const level = () => 1 + Math.floor(S.xp / 250);
const ACH = [
  ['primer', 'walk', 'Primer paso', 'Registraste tu primer movimiento'],
  ['racha3', 'flame', 'Racha 3', '3 días seguidos registrando'],
  ['racha7', 'flame', 'Racha 7', 'Una semana sin fallar'],
  ['racha30', 'flame', 'Racha 30', 'Un mes entero de disciplina'],
  ['cero', 'leaf', 'Día cero', 'Un día sin gastar nada'],
  ['tc', 'creditcard', 'Tarjeta domada', 'Pagaste el total del extracto'],
  ['jefe', 'trophy', 'Jefe caído', 'Derrotaste tu primer préstamo'],
  ['critico', 'bolt', 'Golpe crítico', 'Precancelaste un préstamo'],
  ['venta', 'bag', 'Primera venta', 'Registraste tu primera venta'],
  ['meta', 'chart', 'Meta cumplida', 'Llegaste a tu meta de facturación del mes'],
  ['iva', 'receipt', 'IVA al día', 'Pagaste el IVA desde su sobre'],
  ['anillos', 'target', 'Anillos cerrados', 'Cerraste los 3 anillos en un mes'],
  ['colchon', 'shield', 'Colchón listo', 'Tu fondo de emergencia está completo'],
  ['sobre', 'envelope', 'Sobre intacto', 'Terminaste un mes dentro del presupuesto variable'],
  ['asesor', 'map', 'Plan en marcha', 'Completaste la Fase 0'],
  ['p25', 'star', '25% libre', 'Eliminaste un cuarto de la deuda'],
  ['p50', 'star', '50% libre', 'La mitad ya no existe'],
  ['p75', 'star', '75% libre', 'Ya se ve la salida'],
  ['p100', 'crown', 'Libre', 'Cero deudas: se desbloquean los viajes'],
  ['viajero', 'airplane', 'Viajero', 'Completaste una meta de viaje']
];
const ACH_COLOR = { primer: 'blue', racha3: 'orange', racha7: 'orange', racha30: 'red', cero: 'teal', tc: 'indigo', jefe: 'yellow', critico: 'yellow', venta: 'green', meta: 'green', iva: 'gray', anillos: 'pink', colchon: 'teal', sobre: 'blue', asesor: 'purple', p25: 'brown', p50: 'gray', p75: 'yellow', p100: 'yellow', viajero: 'cyan' };
function addXP(n) { const before = level(); S.xp = Math.max(0, S.xp + n); if (level() > before) { toast('Subiste a nivel ' + level()); confetti(); } }
function unlock(id) {
  if (S.ach[id]) return;
  S.ach[id] = today(); const a = ACH.find(x => x[0] === id);
  toast('Logro desbloqueado: ' + a[2] + ' · +100 XP'); addXP(100); confetti(); haptic(30);
}
function checkAch() {
  if (!S) return;
  SIM = null;
  if (M.length) unlock('primer');
  const st = streak(); if (st >= 3) unlock('racha3'); if (st >= 7) unlock('racha7'); if (st >= 30) unlock('racha30');
  if (M.some(m => m.t === 'venta')) unlock('venta');
  if (M.some(m => m.t === 'pagoiva')) unlock('iva');
  if (S.settings.metaFacturacion && factMonth(ym(today())) >= S.settings.metaFacturacion) unlock('meta');
  if (S.loans.some(l => loanSaldo(l) <= 0)) unlock('jefe');
  const col = goal('colchon'); if (col.target && col.saved >= col.target) unlock('colchon');
  if (S.initialTotal > 0) { const p = pctFree(); if (p >= 25) unlock('p25'); if (p >= 50) unlock('p50'); if (p >= 75) unlock('p75'); }
  if (isFree()) unlock('p100');
  if (['t1', 't2', 't3'].every(t => S.tasks[t])) unlock('asesor');
  if (debtBudget() > 0 && rings().every(r => r.p >= 1)) unlock('anillos');
  if (S.goals.some(g => g.kind === 'viaje' && g.target && g.saved >= g.target)) unlock('viajero');
  const prev = addMonth(ym(today()), -1);
  const vars = S.budget.filter(b => !b.fijo && b.amt > 0);
  if (vars.length && M.some(m => m.t === 'gasto' && ym(m.date) === prev) && !vars.some(b => monthSpent(b.id, prev) > b.amt)) unlock('sobre');
}
function checkin() { const t = today(); if (!S.checkins.includes(t)) S.checkins.push(t); if (S.checkins.length > 500) S.checkins = S.checkins.slice(-500); }

/* =========================================================================
   Efectos de cada movimiento (aplicar / revertir)
   ========================================================================= */
function addTo(k, v) { if (!v) return; if (k === 'cofre' || k === 'iva') S.funds[k] += v; else { const g = goal(k); if (g) g.saved += v; } }
// Reparto de una venta cobrada: ganancia → cofre y caja, costo recuperado → caja, IVA → sobre
function ventaFunds(m, sign) { addTo('cofre', sign * (m.toCofre || 0)); addTo('emprender', sign * ((m.toEmp || 0) + (m.costoRet || 0))); addTo('iva', sign * (m.ivaRes || 0)); }
// Match venta ↔ deuda con el proveedor: la venta queda vinculada y, si ya le pagaste, cancela la deuda
function linkPay(m) {
  const p = m.payable && payable(m.payable); if (!p) return;
  p.venta = m.id;
  if (m.provPaid && !p.pagos.some(x => x.venta === m.id)) p.pagos.push({ id: m.id, d: m.date, amt: m.payAmt || m.costo, venta: m.id });
}
function unlinkPay(m) {
  const p = m.payable && payable(m.payable); if (!p) return;
  if (m.payNew) { S.payables = S.payables.filter(x => x.id !== p.id); return; }
  p.pagos = p.pagos.filter(x => x.venta !== m.id);
  if (p.venta === m.id) p.venta = null;
}
function applyMov(m) {
  switch (m.t) {
    case 'gasto':
      if (m.medio === 'tc') { const c = card(m.card); if (c) c.saldo += m.amt; }
      if (m.ambito === 'negocio' && m.medio === 'caja') addTo('emprender', -m.amt);
      break;
    case 'ingreso': Object.entries(m.split || {}).forEach(([k, v]) => addTo(k, v)); if (m.tipo === 'aguinaldo') S.settings.lumpRecibido = true; break;
    case 'venta': if (m.cobrada !== false) ventaFunds(m, 1); linkPay(m); break;
    case 'aporte': addTo(m.goal, m.amt); break;
    case 'retiro': addTo(m.goal, -m.amt); break;
    case 'mover': addTo(m.from, -m.amt); addTo(m.to, m.amt); break;
    case 'pagoiva': addTo('iva', -m.fromRes); break;
    case 'pagoprov': {
      const p = payable(m.payable);
      if (p && !p.pagos.some(x => x.id === m.id)) p.pagos.push({ id: m.id, d: m.date, amt: m.amt, mov: m.id });
      if (m.src === 'caja') addTo('emprender', -m.amt);
      break;
    }
  }
  SIM = null;
}
function revertMov(m) {
  switch (m.t) {
    case 'gasto':
      if (m.medio === 'tc') { const c = card(m.card); if (c) c.saldo -= m.amt; }
      if (m.ambito === 'negocio' && m.medio === 'caja') addTo('emprender', m.amt);
      break;
    case 'ingreso': Object.entries(m.split || {}).forEach(([k, v]) => addTo(k, -v)); if (m.tipo === 'aguinaldo') S.settings.lumpRecibido = false; break;
    case 'venta': if (m.cobrada !== false) ventaFunds(m, -1); unlinkPay(m); break;
    case 'pagoprov': {
      const p = payable(m.payable); if (p) p.pagos = p.pagos.filter(x => x.id !== m.id);
      if (m.src === 'caja') addTo('emprender', m.amt);
      break;
    }
    case 'aporte': addTo(m.goal, -m.amt); break;
    case 'retiro': addTo(m.goal, m.amt); break;
    case 'mover': addTo(m.from, m.amt); addTo(m.to, -m.amt); break;
    case 'pagoiva': addTo('iva', m.fromRes); break;
    case 'cuota': { const l = loan(m.loan); const c = l && l.cuotas.find(x => x.n === m.n); if (c) { c.paid = false; c.pd = null; } break; }
    case 'ataque': case 'precancel': {
      const l = loan(m.loan);
      if (l && m.undo) m.undo.forEach(u => { l.cuotas[u.i] = Object.assign({}, u.c); });
      if (l && m.t === 'precancel') delete l.precancel;
      S.funds.cofre += m.fromCofre || 0;
      if (!m.undo) toast('Movimiento de la versión anterior: el cronograma no se pudo revertir.');
      break;
    }
    case 'pagotc': { const c = card(m.card); if (c) { if (m.prevSaldo != null) c.saldo = m.prevSaldo; else c.saldo += m.amt; if (m.prevExtracto != null) c.extracto = m.prevExtracto; } break; }
  }
  SIM = null;
}

/* =========================================================================
   UI: helpers
   ========================================================================= */
let toastQ = Promise.resolve();
function toast(msg) {
  toastQ = toastQ.then(() => new Promise(res => {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => { t.remove(); res(); }, 2300);
  }));
}
function confetti() {
  const cols = ['#ff375f', '#ff9f0a', '#ffd60a', '#30d158', '#0a84ff', '#bf5af2'];
  for (let i = 0; i < 44; i++) {
    const c = document.createElement('i'); c.className = 'conf';
    c.style.left = Math.random() * 100 + 'vw'; c.style.background = cols[i % cols.length];
    c.style.animationDuration = (1.4 + Math.random() * 1.6) + 's'; c.style.animationDelay = (Math.random() * .3) + 's';
    document.body.appendChild(c); setTimeout(() => c.remove(), 3500);
  }
}
function openSheet(html) { const sh = $('#sheet'); sh.innerHTML = '<div class="grab"></div>' + html; sh.scrollTop = 0; $('#sheetBg').classList.add('on'); document.body.classList.add('sheet-open'); }
function closeSheet() {
  RETURN_TO = null;
  const bg = $('#sheetBg'); if (!bg.classList.contains('on')) return;
  bg.classList.remove('on'); document.body.classList.remove('sheet-open');
  setTimeout(() => { if (!bg.classList.contains('on')) $('#sheet').innerHTML = ''; }, 380);
  if (pendingRender) render();
}
const sheetOpen = () => $('#sheetBg').classList.contains('on');
function armed(el) {
  if (el.dataset.armed) return true;
  el.dataset.armed = '1'; const html = el.innerHTML; el.textContent = 'Tocá de nuevo para confirmar';
  setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.innerHTML = html; } }, 3500);
  return false;
}
const head = (title, right = '', left = '<button class="link" data-act="close">Cerrar</button>') =>
  `<div class="sh-head">${left}<h3>${title}</h3>${right || '<span></span>'}</div>`;
const lt = (title, sub = '', right = '') => `<div class="lt"><div>${sub ? `<div class="sub">${sub}</div>` : ''}<h1>${title}</h1></div>${right}</div>`;
const sh = (title, right = '') => `<div class="sh"><h2>${title}</h2>${right}</div>`;
const bar = (pct, cls = '', color = '') => `<div class="bar ${cls}"${color ? ` style="--c:${color}"` : ''}><i style="width:${clamp(pct || 0, 0, 100).toFixed(1)}%"></i></div>`;
const icoBox = (k, color, cls = '') => `<span class="ico ${cls}" style="--c:var(--${color || 'gray'})">${sym(k)}</span>`;
const vu = (n, unit = 'Gs') => `${n}<span class="u">${unit}</span>`;
const big = (n, cls = '') => `<div class="bignum num ${cls}">${n}</div>`;
const field = (label, input) => `<label class="cell fieldc"><span>${label}</span>${input}</label>`;
const money = (id, val = '', ph = '0') => `<input id="${id}" data-money inputmode="numeric" placeholder="${ph}" value="${val ? fmt(val) : ''}" autocomplete="off">`;
const segBtns = (act, k, opts, cur) => opts.map(([v, l]) => `<button class="${v === cur ? 'on' : ''}" data-act="${act}" data-k="${k}" data-v="${v}">${l}</button>`).join('');
const tile = ({ k, icon, color, value, unit = 'Gs', foot = '', act = '', id = '', vcolor = '' }) =>
  `<${act ? 'button' : 'div'} class="tile"${act ? ` data-act="${act}" data-id="${id}"` : ''}><div class="k" style="color:var(--${color})">${sym(icon)}<span>${k}</span></div>
   <div class="n"${vcolor ? ` style="color:${vcolor}"` : ''}>${vu(value, unit)}</div>${foot ? `<div class="f">${foot}</div>` : ''}</${act ? 'button' : 'div'}>`;
const cellLink = (act, icon, color, t, s = '', extra = '') => `<button class="cell" data-act="${act}"${extra}>${icoBox(icon, color)}<div class="tx"><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ''}</div>${CHEV}</button>`;
const colorPicker = (id, cur) => `<input type="hidden" id="${id}" value="${cur}"><div class="swatches">${COLORS.map(c => `<button class="sw-dot ${c === cur ? 'on' : ''}" data-act="pick" data-target="${id}" data-v="${c}" style="--c:var(--${c})" aria-label="${c}"></button>`).join('')}</div>`;
const symPicker = (id, cur, color) => `<input type="hidden" id="${id}" value="${cur}"><div class="symgrid">${SYM_CHOICES.map(s => `<button class="symbtn ${s === cur ? 'on' : ''}" data-act="pick" data-target="${id}" data-v="${s}" style="--c:var(--${color})">${sym(s)}</button>`).join('')}</div>`;
function ringsSvg(rs) {
  return `<svg viewBox="0 0 128 128" aria-hidden="true">${rs.map((r, i) => {
    const rad = [57, 43, 29][i], C = 2 * Math.PI * rad, p = clamp(r.p, 0, 1);
    return `<circle cx="64" cy="64" r="${rad}" fill="none" stroke="${r.color}" stroke-opacity=".2" stroke-width="12"/>` +
      `<circle class="ringarc" cx="64" cy="64" r="${rad}" fill="none" stroke="${r.color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(C * p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 64 64)"/>`;
  }).join('')}</svg>`;
}

/* =========================================================================
   Render y navegación
   ========================================================================= */
const TITLES = { hoy: 'Hoy', movs: 'Movimientos', batalla: 'Batalla', negocio: 'Negocio', plan: 'Plan' };
const VIEWS = { hoy: () => vHoy(), movs: () => vMovs(), batalla: () => vBatalla(), negocio: () => vNegocio(), plan: () => vPlan() };
function render(resetScroll = false) {
  if (!S || !APP_ON) return;
  SIM = null;
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === TAB));
  $('#app').innerHTML = VIEWS[TAB]();
  $('#topbar').textContent = TITLES[TAB];
  if (resetScroll) window.scrollTo(0, 0);
  pendingRender = false;
  if (BK) setSync(BK.kind === 'local' ? 'local' : 'ok');
}
function safeRender() {
  const a = document.activeElement;
  if (sheetOpen() || (a && a.closest && a.closest('#app') && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) { pendingRender = true; return; }
  render();
}
function go(tab) { if (!VIEWS[tab]) return; closeSheet(); TAB = tab; lsSet('libre-tab', tab); render(true); }
function showApp() {
  APP_ON = true; document.body.classList.remove('auth'); $('#dock').classList.remove('hide');
  TAB = VIEWS[lsGet('libre-tab')] ? lsGet('libre-tab') : 'hoy';
  const before = stable(S); checkAch(); snapDebt(); if (stable(S) !== before) commit();
  render(true);
}

/* =========================================================================
   Pantalla: Hoy
   ========================================================================= */
function initials() { return (S.profile.nombre || '').trim().split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase(); }
function vHoy() {
  const tot = totalDebt(), p = pctFree(), r = rank(), st = streak(), lv = level();
  const fin = projection(), sinPlan = noPlanEnd(), gain = monthsDiff(fin, sinPlan);
  const vl = varLeft(), tgt = attackOrder().list[0], rs = rings(), d = new Date(), ini = initials();
  const hasDebt = S.loans.length || S.cards.length;
  return `
  ${lt('Hoy', DIAS_L[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES_L[d.getMonth()], `<button class="avatar" data-act="tab" data-tab="plan" aria-label="Plan y cuenta">${ini ? esc(ini) : sym('person')}</button>`)}
  ${setupCard()}
  ${cobroCard()}
  <div class="rankrow"><div class="row"><span class="rkic">${sym(r[2])}</span><div><div class="rk">${r[1]}</div><small>Nivel ${lv} · ${fmt(S.xp)} XP · faltan ${250 - S.xp % 250} para el ${lv + 1}</small></div></div>
    <span class="pill lg" style="--c:var(--orange)">${sym('flame')}${st}</span></div>
  ${bar((S.xp % 250) / 2.5, 'xp')}
  <div class="rings">${ringsSvg(rs)}<div class="leg">${rs.map(x => `<div><div class="t">${x.name}</div><div class="v" style="color:${x.color}">${x.a}<small> / ${x.b}</small></div></div>`).join('')}</div></div>
  ${hasDebt ? `<button class="hp" data-act="tab" data-tab="batalla">
    <div class="k">Vida total de la deuda</div>
    <div class="n">${vu(fmt(tot))}</div>
    ${bar(100 - p, 'hpbar lg')}
    <div class="meta"><span><b>${p.toFixed(1)}%</b> eliminado</span><span>inicio ${gsK(S.initialTotal)}</span></div>
    <hr>
    <div class="g2"><div><div class="k">Libre de deudas</div><div class="m">${isFree() ? '¡Ya!' : ymLabel(fin)}</div></div><div><div class="k">Sin el plan</div><div class="m" style="opacity:.6">${ymLabel(sinPlan)}</div></div></div>
    ${gain > 0 ? `<div class="gain">El plan te libera ${gain} ${gain === 1 ? 'mes' : 'meses'} antes · ver hoja de ruta</div>` : ''}
  </button>` : ''}
  <div class="g2 mt">
    ${tile({ k: 'Hoy podés gastar', icon: 'calendar', color: 'blue', value: fmt(vl.perDay), vcolor: vl.perDay < 30000 ? 'var(--red)' : '', foot: gsK(vl.left) + ' en ' + vl.daysLeft + ' días' })}
    ${tile({ k: 'Cofre de ataque', icon: 'coins', color: 'orange', value: fmt(S.funds.cofre), foot: 'Colchón ' + gsK(goal('colchon').saved) + ' · Caja ' + gsK(goal('emprender').saved) })}
  </div>
  <div class="qa">
    <button data-act="add" data-t="gasto" style="--c:var(--red)"><span>${sym('minus')}</span>Gasto</button>
    <button data-act="add" data-t="ingreso" style="--c:var(--green)"><span>${sym('arrowDown')}</span>Ingreso</button>
    <button data-act="add" data-t="venta" style="--c:var(--indigo)"><span>${sym('bag')}</span>Venta</button>
    <button data-act="cero" style="--c:var(--teal)"><span>${sym('leaf')}</span>No gasté</button>
  </div>
  ${acctSection()}
  ${tgt ? sh('Jefe actual', '<button class="link" data-act="tab" data-tab="batalla">Ver todos</button>') + bossCard(tgt, true)
    : (S.loans.length ? `<div class="card mt2 center"><span class="ico xl" style="--c:var(--yellow);margin:0 auto">${sym('crown')}</span><h3 class="mt">No quedan préstamos</h3><small>Los viajes están desbloqueados en Plan.</small></div>` : '')}
  ${hasDebt ? sh('Próximos vencimientos') + `<div class="group ic">${upcoming() || '<div class="cell"><small>Nada pendiente.</small></div>'}</div>` : ''}
  ${sh('Logros', `<small>${Object.keys(S.ach).length}/${ACH.length}</small>`)}
  <div class="card"><div class="medals">${ACH.map(a => `<button class="medal ${S.ach[a[0]] ? 'on' : ''}" data-act="achInfo" data-id="${a[0]}" style="--c:var(--${ACH_COLOR[a[0]]})"><b>${sym(a[1])}</b>${esc(a[2])}</button>`).join('')}</div></div>`;
}
function cobroCard() {
  if (!S.settings.base && !S.fijos.length) return '';
  const { w, items } = cobroItems(), dd = daysBetween(today(), w.pay), tot = sum(items, x => x.a);
  const when = dd < 0 ? 'Cobraste el ' + dLabel(w.pay) : dd === 0 ? 'Cobrás hoy' : dd === 1 ? 'Cobrás mañana' : 'Cobrás el ' + dLabel(w.pay);
  return `<button class="card cobrocard" data-act="cobro">${icoBox('calendar', 'green', 'lg')}<div class="grow">
    <div class="k-head" style="color:var(--green)">${when}${S.settings.diaCobro ? '' : ' (día 25)'}</div>
    <div class="t">${items.length ? items.length + (items.length === 1 ? ' pago' : ' pagos') + ' antes del ' + dLabel(w.next) + ' · ' + gsK(tot) : 'Todo pagado hasta el próximo cobro'}</div>
    <small>${S.fijos.length ? 'Ver el plan de pagos en orden' : 'Cargá tus gastos fijos en Plan para completar el plan'}</small></div>${CHEV}</button>`;
}
function setupCard() {
  const needInc = !S.settings.base, needDebt = !S.loans.length && !S.cards.length;
  if (!needInc && !needDebt) return '';
  return `<div class="card" style="margin-bottom:18px"><h3 style="font-size:20px">Armá tu partida</h3><p class="s2" style="font-size:15px;margin-top:4px">Dos minutos y el juego arranca.</p>
    <div class="group ic mt" style="box-shadow:none;background:var(--fill)">
      ${cellLink('settings', 'banknote', 'green', (needInc ? '' : '✓ ') + 'Cargá tus ingresos')}
      ${cellLink('addDebt', 'flame', 'red', (needDebt ? '' : '✓ ') + 'Agregá tus deudas')}
      ${cellLink('account', 'download', 'blue', 'O importá tus datos (.json)')}
    </div></div>`;
}
function upcoming() {
  const t = today(), ups = [];
  S.loans.forEach(l => { const c = nextCuota(l); if (c) ups.push({ d: c.d, t: l.name, s: (entOf(l) ? esc(entOf(l)) + ' · ' : '') + 'Cuota ' + c.n, a: c.a, icon: 'bank', color: l.color, act: 'payCuota', id: l.id }); });
  S.cards.forEach(c => { if (c.extracto > 0 && c.vence) ups.push({ d: c.vence, t: c.name, s: (entOf(c) ? esc(entOf(c)) + ' · ' : '') + 'Pagá el total', a: c.extracto, icon: 'creditcard', color: 'indigo', act: 'payCard', id: c.id }); });
  pendPayables().forEach(p => { if (p.venc) ups.push({ d: p.venc, t: p.prov, s: 'Proveedor · ' + esc(p.desc || 'compra'), a: payPend(p), icon: 'box', color: 'indigo', act: 'payable', id: p.id }); });
  S.fijos.forEach(f => { const k = fijoCycle(f), kk = fijoPaid(f, k) ? addMonth(k, 1) : k; ups.push({ d: dueInCycle(kk, f.dia), t: f.name, s: 'Gasto fijo · ' + (PRIO_L[f.prio || 2] || ''), a: f.amt, icon: f.sym || 'pin', color: f.color || 'blue', act: 'fijo', id: f.id }); });
  ups.sort((a, b) => a.d.localeCompare(b.d));
  return ups.slice(0, 6).map(u => {
    const dd = daysBetween(t, u.d), col = dd < 0 ? 'red' : dd <= 5 ? 'orange' : 'gray';
    const txt = dd < 0 ? 'vencida' : dd === 0 ? 'hoy' : dd === 1 ? 'mañana' : 'en ' + dd + ' días';
    return `<button class="cell" data-act="${u.act}" data-id="${u.id}">${icoBox(u.icon, u.color)}<div class="tx"><div class="t">${esc(u.t)}</div><div class="s">${u.s} · ${dLabel(u.d)}</div></div>
      <div class="v"><span class="num">${gsK(u.a)}</span><small><span class="pill" style="--c:var(--${col})">${txt}</span></small></div></button>`;
  }).join('');
}

/* =========================================================================
   Pantalla: Movimientos
   ========================================================================= */
const MF_FILTERS = {
  todos: () => true,
  gastos: m => m.t === 'gasto',
  ingresos: m => m.t === 'ingreso' || m.t === 'venta',
  deudas: m => ['cuota', 'ataque', 'precancel', 'pagotc', 'pagoiva', 'pagoprov'].includes(m.t)
};
const MEDIO_L = { debito: 'Débito', efectivo: 'Efectivo', tc: 'Tarjeta', caja: 'Caja del negocio' };
const FUND_L = { cofre: 'Cofre de ataque', iva: 'Sobre IVA' };
const fundName = k => FUND_L[k] || (goal(k) ? goal(k).name : k);
function movMeta(m) {
  const ln = id => (loan(id) || {}).name || 'préstamo';
  const lc = id => (loan(id) || {}).color || 'red';
  switch (m.t) {
    case 'gasto': {
      if (m.fijo && fijo(m.fijo)) { const f = fijo(m.fijo); return { icon: f.sym || 'pin', color: f.color || 'blue', title: f.name, sign: -1 }; }
      if (m.ambito === 'negocio') return { icon: 'briefcase', color: 'indigo', title: 'Gasto del negocio', sign: -1 };
      const b = S.budget.find(x => x.id === m.cat); return { icon: b ? b.sym : 'tag', color: b ? b.color : 'gray', title: b ? b.name : 'Gasto', sign: -1 };
    }
    case 'ingreso': return { icon: { sueldo: 'bank', extra: 'clock', aguinaldo: 'gift' }[m.tipo] || 'sparkles', color: 'green', title: { sueldo: 'Sueldo', extra: 'Horas extra', aguinaldo: 'Aguinaldo' }[m.tipo] || 'Ingreso', sign: 1 };
    case 'venta': return { icon: 'bag', color: 'indigo', title: 'Venta' + (m.cliente ? ' · ' + m.cliente : ''), sign: 1 };
    case 'cuota': return { icon: 'check', color: lc(m.loan), title: 'Cuota ' + m.n + ' · ' + ln(m.loan), sign: -1 };
    case 'ataque': return { icon: 'flame', color: 'orange', title: 'Ataque a ' + ln(m.loan), sign: -1 };
    case 'precancel': return { icon: 'bolt', color: 'yellow', title: 'Precancelación · ' + ln(m.loan), sign: -1 };
    case 'pagotc': return { icon: 'creditcard', color: 'indigo', title: 'Pago de ' + ((card(m.card) || {}).name || 'tarjeta'), sign: -1 };
    case 'pagoiva': return { icon: 'receipt', color: 'gray', title: 'Pago de IVA' + (m.periodo ? ' · ' + ymLabel(m.periodo) : ''), sign: -1 };
    case 'pagoprov': return { icon: 'box', color: 'indigo', title: 'Pago a ' + (m.prov || 'proveedor'), sign: -1 };
    case 'transf': return { icon: 'arrows', color: 'blue', title: acctName(m.from) + ' → ' + acctName(m.to), sign: 0 };
    case 'ajuste': return { icon: 'check', color: 'gray', title: 'Ajuste · ' + acctName(m.cuenta), sign: m.dir || 1 };
    case 'mover': return { icon: 'arrows', color: 'gray', title: fundName(m.from) + ' → ' + fundName(m.to), sign: 0 };
    case 'aporte': { const g = goal(m.goal) || {}; return { icon: g.sym || 'star', color: g.color || 'gray', title: 'Aporte a ' + (g.name || 'meta'), sign: 0 }; }
    case 'retiro': { const g = goal(m.goal) || {}; return { icon: 'arrowUp', color: 'gray', title: 'Retiro de ' + (g.name || 'meta'), sign: 0 }; }
    case 'cero': return { icon: 'leaf', color: 'teal', title: 'Día sin gastos', sign: 0 };
  }
  return { icon: 'tag', color: 'gray', title: 'Movimiento', sign: 0 };
}
function movRow(m) {
  const mm = movMeta(m), tags = [];
  if (m.medio === 'tc') tags.push('<span class="pill" style="--c:var(--red)">TC</span>');
  if (m.ivaAmt) tags.push(`<span class="pill">IVA ${m.iva}%</span>`);
  if (m.t === 'venta' && m.costo) tags.push(`<span class="pill" style="--c:var(--green)">ganancia ${gsK(m.ganancia)}</span>`);
  if (m.t === 'venta' && m.prov) tags.push(`<span class="pill" style="--c:var(--indigo)">${esc(m.prov)}</span>`);
  if (m.t === 'venta' && m.cobrada === false) tags.push(`<span class="pill" style="--c:var(--orange)">por cobrar</span>`);
  if (m.origen && loan(m.origen)) tags.push(`<span class="pill" style="--c:var(--${loan(m.origen).color})">plata del préstamo</span>`);
  if (m.cuenta && m.t !== 'ajuste' && acctFlows(m).length) tags.push(`<span class="pill" style="--c:var(--${(acct(m.cuenta) || {}).color || 'gray'})">${esc(acctName(m.cuenta))}</span>`);
  const showNote = m.note && !['cuota', 'ataque', 'precancel', 'pagotc'].includes(m.t);
  const sub = showNote ? esc(m.note) : m.t === 'gasto' ? (MEDIO_L[m.medio] || '') : '';
  const amt = m.t === 'cero' ? '' : (mm.sign < 0 ? '−' : mm.sign > 0 ? '+' : '') + fmt(m.amt);
  return `<button class="cell" data-act="movDetail" data-id="${m.id}">${icoBox(mm.icon, mm.color)}<div class="tx"><div class="t">${esc(mm.title)}</div>
    <div class="s">${tags.join(' ')} ${sub}</div></div><div class="v num ${mm.sign > 0 ? 'pos' : ''}">${amt}</div></button>`;
}
function vMovs() {
  const k = MK, sm = monthSummary(k);
  const list = M.filter(m => ym(m.date) === k).filter(MF_FILTERS[MF]).sort(byDateDesc);
  const days = {}; list.forEach(m => { (days[m.date] = days[m.date] || []).push(m); });
  const t = today(), y = dStr(new Date(Date.now() - 864e5));
  const dayL = d => d === t ? 'Hoy' : d === y ? 'Ayer' : DIAS_L[new Date(d + 'T12:00').getDay()] + ' ' + dLabel(d);
  const mx = Math.max(sm.ingresos, sm.egresos, 1);
  return `${lt('Movimientos', '', `<button class="icbtn" data-act="add" aria-label="Agregar">${sym('plus')}</button>`)}
  <div class="monthnav"><button class="icbtn" data-act="mk" data-d="-1" aria-label="Mes anterior">${sym('left')}</button><b>${ymLabel(k)}</b><button class="icbtn" data-act="mk" data-d="1" aria-label="Mes siguiente" ${k >= ym(today()) ? 'disabled style="opacity:.3"' : ''}>${sym('right')}</button></div>
  <div class="card">
    <div class="g3">
      <div class="kv"><div class="k">Ingresos</div><div class="n pos">${gsK(sm.ingresos)}</div></div>
      <div class="kv"><div class="k">Egresos</div><div class="n neg">${gsK(sm.egresos)}</div></div>
      <div class="kv"><div class="k">Neto</div><div class="n ${sm.neto < 0 ? 'neg' : ''}">${gsK(sm.neto)}</div></div>
    </div>
    <div class="mt">${bar(sm.ingresos / mx * 100, '', 'var(--green)')}</div>
    <div style="margin-top:6px">${bar(sm.egresos / mx * 100, '', 'var(--red)')}</div>
    <div class="legend">
      <span style="--c:var(--orange)">Gastos personales <b>${gsK(sm.gPers)}</b></span>
      <span style="--c:var(--indigo)">Negocio y compras <b>${gsK(sm.gNeg)}</b></span>
      <span style="--c:var(--red)">Deudas <b>${gsK(sm.deudas)}</b></span>
      <span style="--c:var(--gray)">IVA pagado <b>${gsK(sm.iva)}</b></span>
    </div>
    ${sm.tc || sm.pagotc ? `<p class="gf" style="margin:10px 0 0">Compras con tarjeta: <b>${gs(sm.tc)}</b> (ya cuentan como gasto). Pagos de tarjeta: ${gs(sm.pagotc)}.</p>` : ''}
  </div>
  <div class="seg mt2">${segBtns('mf', 'mf', [['todos', 'Todos'], ['gastos', 'Gastos'], ['ingresos', 'Ingresos'], ['deudas', 'Deudas']], MF)}</div>
  ${Object.keys(days).length ? Object.entries(days).map(([d, ms]) => `<div class="gh">${cap(dayL(d))}</div><div class="group ic">${ms.map(movRow).join('')}</div>`).join('')
    : `<div class="card mt2 center"><span class="ico xl" style="--c:var(--gray);margin:0 auto">${sym('list')}</span><p class="s2 mt">Nada registrado${MF !== 'todos' ? ' con este filtro' : ''} en ${ymLabel(k)}.</p><button class="btn p mt" data-act="add">Registrar ahora</button></div>`}`;
}

/* =========================================================================
   Pantalla: Batalla (deudas, tarjetas y hoja de ruta)
   ========================================================================= */
// Entidad arriba del nombre (estilo "eyebrow" de iOS); si falta, un botón para cargarla
const entTag = (x, act, dead = false) => entOf(x) ? `<div class="eyebrow">${esc(entOf(x))}</div>`
  : dead ? '' : `<button class="eyebrow add" data-act="${act}" data-id="${x.id}">${sym('plus')}A quién le debés</button>`;
function bossCard(l, isTarget) {
  const s = loanSaldo(l), tot = loanTotal(l), dead = s <= 0, nc = nextCuota(l), rest = l.cuotas.filter(c => !c.paid).length;
  const pos = attackOrder().list.findIndex(x => x.id === l.id);
  return `<div class="card boss ${dead ? 'dead' : ''} ${isTarget ? 'target' : ''}">
    ${isTarget ? `<span class="pill tag" style="--c:var(--orange)">${sym('target')}Objetivo</span>` : dead ? `<span class="pill tag" style="--c:var(--green)">${sym('trophy')}Derrotado</span>` : `<span class="pill tag">#${pos + 1}</span>`}
    <div class="head"><span class="ico lg" style="--c:var(--${dead ? 'gray' : l.color})">${sym(dead ? 'check' : 'bank')}</span><div class="grow">${entTag(l, 'editLoan', dead)}<h3>${esc(l.name)}</h3>
      <small>${dead ? (l.precancel ? 'Precancelado · ahorro ' + gs(l.precancel.ahorro) : 'Pagado completo') : rest + (rest === 1 ? ' cuota' : ' cuotas') + ' · termina ' + dLabel(lastDate(l)) + (taeN(l) ? ' · TAE ' + esc(l.tae) + '%' : '')}</small></div></div>
    <div class="row between mt"><span class="hpn">${vu(fmt(s))}</span><small>de ${gsK(tot)}</small></div>
    <div class="mt">${bar(tot ? s / tot * 100 : 0, 'hpbar lg')}</div>
    <div class="btns mt">${dead ? `<button class="btn sm plain" data-act="loanDetail" data-id="${l.id}">Ver detalle</button>` : `
      <button class="btn sm p" style="--c:var(--green)" data-act="payCuota" data-id="${l.id}">Pagar cuota ${nc.n}</button>
      <button class="btn sm" style="--c:var(--orange)" data-act="attack" data-id="${l.id}">${sym('flame')}Atacar</button>
      <button class="btn sm plain icon-only" data-act="loanDetail" data-id="${l.id}" aria-label="Detalle">${sym('ellipsis')}</button>`}</div>
  </div>`;
}
function cardBoss(c) {
  const used = c.linea ? c.saldo / c.linea * 100 : 0;
  return `<div class="card boss ${c.saldo > 0 ? '' : 'dead'}">
    ${c.saldo > 0 ? '' : `<span class="pill tag" style="--c:var(--green)">${sym('check')}Domada</span>`}
    <div class="head"><span class="ico lg card-art">${sym('creditcard')}</span><div class="grow">${entTag(c, 'editCard')}<h3>${esc(c.name)}</h3><small>TAN ${esc(c.tan || '—')}% · usás ${used.toFixed(0)}% de la línea</small></div></div>
    <div class="row between mt"><span class="hpn">${vu(fmt(c.saldo))}</span><small>línea ${gsK(c.linea)}</small></div>
    <div class="mt">${bar(used, 'lg', used > 30 ? 'var(--orange)' : 'var(--blue)')}</div>
    ${c.extracto > 0 ? `<div class="note mt">Extracto <b>${gs(c.extracto)}</b>${c.vence ? ' · vence <b>' + dLabel(c.vence) + '</b>' : ''}. Pagar solo el mínimo (${gs(c.minimo)}) genera intereses sobre el resto: <b>pagá siempre el total</b>.</div>` : ''}
    <div class="btns mt"><button class="btn sm p" data-act="payCard" data-id="${c.id}">Pagar tarjeta</button><button class="btn sm plain" data-act="editCard" data-id="${c.id}">Actualizar</button></div>
  </div>`;
}
function roadmap() {
  const r = sim(), k0 = ym(today()), ap = appliedMonth(k0);
  if (!r.months.length) return '';
  const rows = r.months.slice(0, 24).map((m, i) => {
    const [y, mo] = m.k.split('-');
    let icon = 'calendar', color = 'gray', title = 'Cuotas del mes';
    if (m.kills.length) { icon = 'trophy'; color = 'green'; title = 'Cae ' + m.kills.join(' y '); }
    else if (m.cardDone) { icon = 'creditcard'; color = 'indigo'; title = 'Tarjeta saldada'; }
    else if (m.ataque > 0 && m.target) { icon = 'flame'; color = 'orange'; title = 'Ataque a ' + m.target; }
    const parts = [];
    if (m.cuotas) parts.push('cuotas ' + gsK(m.cuotas));
    if (m.tarjeta) parts.push('tarjeta ' + gsK(m.tarjeta));
    if (m.ataque) parts.push('ataque ' + gsK(m.ataque));
    if (m.lump) parts.push(m.lumpTo ? 'aguinaldo ' + gsK(m.lump) + ' → precancela ' + m.lumpTo : 'incluye aguinaldo ' + gsK(m.lump));
    const cur = i === 0 && m.k === k0;
    return `<div class="cell road ${cur ? 'cur' : ''} ${m.left <= 0 ? 'free' : ''}">
      <div class="calb"><small>${y}</small><b>${cap(MESES[+mo - 1])}</b></div>
      <div class="tx"><div class="t row" style="gap:6px"><span style="color:var(--${color});display:inline-flex">${sym(icon)}</span><span class="grow" style="overflow:hidden;text-overflow:ellipsis">${esc(title)}</span></div>
        <div class="s">${parts.join(' · ') || 'sin pagos'}</div>
        ${cur ? `<div class="applied"><div class="row between"><small>Aplicado por vos este mes</small><small class="num"><b>${gsK(ap.done)}</b> de ${gsK(ap.target)}</small></div>${bar(ap.target ? ap.done / ap.target * 100 : 0, '', 'var(--green)')}</div>` : ''}</div>
      <div class="v"><span class="num">${m.left <= 0 ? '<b class="pos">LIBRE</b>' : gsK(m.left)}</span><small>${m.left <= 0 ? '' : 'queda'}</small></div></div>`;
  }).join('');
  return sh('Hoja de ruta', `<small>libre en ${ymLabel(r.fin)}</small>`) +
    `<p class="gf" style="margin:-2px 2px 10px">Se recalcula con cada pago, ataque o venta que registrás. Incluye la tarjeta (${gs(cardDebt())}) como primer objetivo porque tiene la tasa más alta. Supone ${gs(debtBudget())}/mes para deudas${S.settings.lump && !S.settings.lumpRecibido ? ' y el aguinaldo de ' + ymLabel(S.settings.lumpMes) : ''}.</p>
    <div class="group roadmap">${rows}</div>`;
}
/* ---------- Gráfico: cómo baja tu deuda (real + proyección) ---------- */
let DCH = null; // puntos del gráfico para el tooltip
const niceStep = raw => { const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1)))), f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
const dayN = s => Date.parse(s + 'T12:00:00') / 864e5;
function debtChart() {
  const t = today(), now = totalDebt(), r = sim();
  const real = S.hist.filter(h => h.d < t).map(h => ({ d: h.d, v: h.m })).concat([{ d: t, v: now }]);
  const proj = [{ d: t, v: now }].concat(r.months.slice(0, 36).map(m => ({ d: m.k + '-' + pad(lastDay(m.k)), v: Math.max(0, m.left), k: m.k })));
  const W = Math.round(Math.max(280, Math.min(720, document.documentElement.clientWidth || 360) - 64)), H = 184, L = 46, R = 16, T = 14, B = 26;
  const x0 = dayN(real[0].d), x1 = Math.max(dayN(proj[proj.length - 1].d), x0 + 30);
  const vmax = Math.max(1, ...real.map(p => p.v), ...proj.map(p => p.v));
  const step = niceStep(vmax / 2.5), ymax = vmax * 1.08;
  const X = d => +(L + (dayN(d) - x0) / (x1 - x0) * (W - L - R)).toFixed(1);
  const Y = v => +(T + (1 - v / ymax) * (H - T - B)).toFixed(1);
  let grid = '';
  for (let v = 0; v <= ymax; v += step) grid += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${v ? gsK(v) : '0'}</text>`;
  // Etiquetas de meses (sin pisarse)
  let xl = '', lastX = -99, k = ym(real[0].d);
  const kEnd = ym(proj[proj.length - 1].d);
  while (k <= kEnd) {
    const x = X(k + '-01');
    if (x >= L && x - lastX >= 42 && x <= W - R - 10) { xl += `<text x="${x}" y="${H - 7}" text-anchor="middle">${MESES[+k.slice(5) - 1]}${k.endsWith('-01') || lastX < 0 ? ' ' + k.slice(2, 4) : ''}</text>`; lastX = x; }
    k = addMonth(k, 1);
  }
  let pr = `M${X(real[0].d)},${Y(real[0].v)}`;
  for (let i = 1; i < real.length; i++) pr += `H${X(real[i].d)}V${Y(real[i].v)}`;
  const area = pr + `V${Y(0)}H${X(real[0].d)}Z`;
  const pp = proj.length > 1 ? 'M' + proj.map(p => X(p.d) + ',' + Y(p.v)).join('L') : '';
  const end = proj[proj.length - 1], free = proj.length > 1 && end.v <= 0;
  DCH = {
    W, H, i: -1,
    pts: real.map((p, i) => ({ x: X(p.d), y: Y(p.v), v: p.v, lab: p.d === t ? 'Hoy' : dLabel(p.d), kind: 'real', i }))
      .concat(proj.slice(1).map(p => ({ x: X(p.d), y: Y(p.v), v: p.v, lab: 'Fin de ' + MESES_L[+p.k.slice(5) - 1] + ' ' + p.k.slice(0, 4), kind: 'proj' })))
  };
  DCH.today = real.length - 1;
  const label = `Deuda total: ${gs(now)} hoy. ${free ? 'Llega a cero en ' + ymLabel(end.k) + ' según la hoja de ruta.' : ''} Usá las flechas para recorrer el gráfico.`;
  return `<div class="dchart">
    <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" tabindex="0" role="img" aria-label="${esc(label)}">
      <g class="grid">${grid}</g>${xl}
      <path class="wash" d="${area}"/>
      ${pp ? `<path class="proj" d="${pp}"/>` : ''}
      <path class="real" d="${pr}"/>
      ${free ? `<text x="${X(end.d)}" y="${Y(0) - 8}" text-anchor="end" class="lbl">Libre · ${MESES[+end.k.slice(5) - 1]} ${end.k.slice(2, 4)}</text>` : ''}
      <line class="xh" id="dcX" x1="0" x2="0" y1="${T}" y2="${H - B}"/>
      <circle class="dot" cx="${X(t)}" cy="${Y(now)}" r="4.5"/>
      <circle class="dot hov" id="dcP" cx="0" cy="0" r="4.5"/>
    </svg>
    <div class="tip" id="dcT" aria-hidden="true"></div>
  </div>`;
}
function dchartShow(i) {
  if (!DCH || !DCH.pts[i]) return;
  const p = DCH.pts[i], svg = $('.dchart svg'), tip = $('#dcT'); if (!svg || !tip) return;
  DCH.i = i;
  const xh = $('#dcX'), dp = $('#dcP');
  xh.setAttribute('x1', p.x); xh.setAttribute('x2', p.x); xh.classList.add('on');
  dp.setAttribute('cx', p.x); dp.setAttribute('cy', p.y); dp.classList.add('on');
  const b = document.createElement('b'); b.textContent = gs(p.v);
  const s = document.createElement('span'); const key = document.createElement('i'); key.className = 'lk' + (p.kind === 'proj' ? ' d' : '');
  s.append(key, document.createTextNode(p.lab + (p.kind === 'proj' ? ' · proyección' : ' · real')));
  tip.replaceChildren(b, s);
  const w = svg.getBoundingClientRect().width, sc = w / DCH.W;
  tip.style.left = clamp(p.x * sc, 80, w - 80) + 'px';
  tip.style.top = (p.y < DCH.H * 0.45 ? (DCH.H - 26) * sc - 50 : 0) + 'px';
  tip.classList.add('on');
}
function dchartHide() {
  if (!DCH) return; DCH.i = -1;
  ['#dcX', '#dcP', '#dcT'].forEach(s => { const e = $(s); if (e) e.classList.remove('on'); });
}
function dchartPointer(e) {
  const c = e.target.closest && e.target.closest('.dchart');
  if (!c || !DCH) { if (DCH && DCH.i >= 0) dchartHide(); return; }
  const rc = c.querySelector('svg').getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * DCH.W;
  let bi = 0; DCH.pts.forEach((p, i) => { if (Math.abs(p.x - x) < Math.abs(DCH.pts[bi].x - x)) bi = i; });
  if (bi !== DCH.i) dchartShow(bi);
}
function debtCard() {
  const tot = totalDebt(), ini = S.initialTotal, baj = ini - tot, k0 = ym(today());
  const prevEnd = dStr(new Date(+k0.slice(0, 4), +k0.slice(5, 7) - 1, 0));
  const first = S.hist.find(h => ym(h.d) === k0);
  const startM = debtAt(prevEnd) ?? (first ? first.m : tot), mes = startM - tot;
  const sg = v => v > 0 ? '−' + gsK(v) : v < 0 ? '+' + gsK(-v) : '0';
  return `<div class="card">
    <div class="g3">
      <div class="kv"><div class="k">Al empezar</div><div class="n">${gsK(ini)}</div></div>
      <div class="kv"><div class="k">Bajaste</div><div class="n ${baj > 0 ? 'pos' : ''}">${sg(baj)}</div></div>
      <div class="kv"><div class="k">Este mes</div><div class="n ${mes > 0 ? 'pos' : mes < 0 ? 'neg' : ''}">${sg(mes)}</div></div>
    </div>
    ${debtChart()}
    <div class="lkeys"><span><i></i>Real</span><span><i class="d"></i>Hoja de ruta</span></div>
    <p class="gf" style="margin:8px 0 0">La app guarda una foto de tu deuda cada día que la usás: la línea llena se va dibujando sola a medida que pagás. Préstamos + tarjeta; los proveedores van aparte.</p>
  </div>`;
}

/* ---------- Deudas por entidad (a quién le debés) ---------- */
function entityRows() {
  const g = new Map(), grp = n => { if (!g.has(n)) g.set(n, { name: n, loans: [], cards: [] }); return g.get(n); };
  S.loans.forEach(l => grp(entOf(l)).loans.push(l));
  S.cards.forEach(c => grp(entOf(c)).cards.push(c));
  return [...g.values()].map(e => {
    const lv = e.loans.filter(l => loanSaldo(l) > 0), cv = e.cards.filter(c => c.saldo > 0);
    const orig = sum(e.loans, loanTotal), saldoL = sum(e.loans, loanSaldo);
    const fms = lv.map(l => loanFreeMonth(l.id)).concat(cv.length ? [cardFreeMonth()] : []);
    return Object.assign(e, {
      saldo: saldoL + sum(e.cards, c => Math.max(0, c.saldo)), pct: orig ? (1 - saldoL / orig) * 100 : null,
      free: fms.length && fms.every(Boolean) ? fms.sort()[fms.length - 1] : null, alive: lv.length + cv.length,
      color: (e.loans[0] || {}).color || 'indigo'
    });
  }).sort((a, b) => (b.saldo > 0) - (a.saldo > 0) || (a.free || '9999').localeCompare(b.free || '9999') || b.saldo - a.saldo);
}
const mShort = k => k ? MESES[+k.slice(5) - 1] + ' ' + k.slice(0, 4) : '—';
function entRow(e) {
  const dead = e.saldo <= 0, parts = [];
  if (e.loans.length) parts.push(e.loans.length + (e.loans.length === 1 ? ' préstamo' : ' préstamos'));
  if (e.cards.length) parts.push(e.cards.length === 1 ? '1 tarjeta' : e.cards.length + ' tarjetas');
  const sub = dead ? 'Ya no le debés nada' : (e.pct != null ? e.pct.toFixed(0) + '% pagado · ' : '') + parts.join(' + ') + (e.free ? ' · cae en ' + mShort(e.free) : '');
  const icon = dead ? 'check' : e.loans.length ? 'bank' : 'creditcard', color = dead ? 'green' : !e.name ? 'gray' : e.loans.length ? e.color : 'indigo';
  return `<button class="cell" data-act="entSheet" data-ent="${esc(e.name)}">${icoBox(icon, color)}<div class="tx">
    <div class="row between"><span class="t">${e.name ? esc(e.name) : '<span class="s2">Sin entidad</span>'}</span><span class="num" style="font-size:15px;flex:none">${dead ? `<span class="pill" style="--c:var(--green)">Libre</span>` : gsK(e.saldo)}</span></div>
    <div class="s">${sub}</div>
    ${!dead && e.pct != null ? `<div style="margin-top:7px">${bar(e.pct, '', 'var(--green)')}</div>` : ''}</div>${CHEV}</button>`;
}
function provGroups() {
  const g = new Map();
  S.payables.forEach(p => { if (!g.has(p.prov)) g.set(p.prov, []); g.get(p.prov).push(p); });
  return [...g.entries()].map(([prov, ps]) => ({ prov, ps, pend: sum(ps, payPend), n: ps.filter(p => payPend(p) > 0).length }))
    .sort((a, b) => b.pend - a.pend);
}
function provGroupRow(g) {
  const sub = g.pend > 0 ? g.n + (g.n === 1 ? ' compra a pagar' : ' compras a pagar') + ' · se paga con tus ventas' : 'Al día · ' + g.ps.length + (g.ps.length === 1 ? ' compra pagada' : ' compras pagadas');
  return `<button class="cell" data-act="provSheet" data-prov="${esc(g.prov)}">${icoBox(g.pend > 0 ? 'box' : 'check', g.pend > 0 ? 'indigo' : 'green')}<div class="tx"><div class="t">${esc(g.prov)}</div><div class="s">${sub}</div></div>
    <div class="v">${g.pend > 0 ? `<span class="num">${gsK(g.pend)}</span><small>a pagar</small>` : `<span class="pill" style="--c:var(--green)">${sym('check')}Al día</span>`}</div>${CHEV}</button>`;
}
function entSection() {
  if (!S.loans.length && !S.cards.length && !S.payables.length) return '';
  const rows = entityRows(), pg = provGroups();
  return sh('Por entidad', S.loans.length || S.cards.length ? '<button class="link" data-act="entFill">Editar</button>' : '') +
    (rows.length ? `<p class="gf" style="margin:-2px 2px 10px">A quién le debés, en el orden en que te las vas sacando de encima.</p><div class="group ic">${rows.map(entRow).join('')}</div>` : '') +
    (pg.length ? `<div class="gh">Proveedores · no es deuda mala</div><div class="group ic">${pg.map(provGroupRow).join('')}</div>
      <p class="gf">Compras a crédito que se cancelan con la venta (match). No suman a la deuda total ni mueven tu fecha de libertad.</p>` : '');
}

function vBatalla() {
  const ord = attackOrder(), k = ym(today()), dead = S.loans.filter(l => loanSaldo(l) <= 0);
  const sinEnt = S.loans.filter(l => loanSaldo(l) > 0 && !entOf(l)).length + S.cards.filter(c => !entOf(c)).length;
  const why = ord.mode === 'tae'
    ? 'Orden por <b>tasa (TAE) de mayor a menor</b>: método avalancha, el que menos intereses te cobra en total.'
    : 'Faltan TAE, así que el orden es por <b>flujo liberado</b>: primero el que te devuelve más cuota mensual por cada guaraní que pagás. Cargá las TAE en el detalle de cada préstamo y el orden se recalcula solo.';
  const months = Array.from({ length: 12 }, (_, i) => addMonth(k, i));
  const vals = months.map(m => sum(S.loans, l => sum(l.cuotas.filter(c => !c.paid && ym(c.d) === m), c => c.a)));
  const mx = Math.max(1, ...vals);
  const hasDebt = S.loans.length || S.cards.length;
  return `${lt('Batalla', `${ord.list.length} ${ord.list.length === 1 ? 'jefe vivo' : 'jefes vivos'}`, `<button class="icbtn" data-act="addDebt" aria-label="Agregar deuda">${sym('plus')}</button>`)}
  ${sinEnt ? `<div class="group ic" style="margin-bottom:12px">${cellLink('entFill', 'bank', 'blue', '¿A quién le debés?', `Poné la entidad de ${sinEnt === 1 ? '1 deuda' : sinEnt + ' deudas'} para ir sacándolas de a una`)}</div>` : ''}
  <div class="g2">
    ${tile({ k: 'Deuda total', icon: 'flame', color: 'red', value: gsK(totalDebt()), foot: pctFree().toFixed(1) + '% eliminado' + (provDebt() ? ' · + ' + gsK(provDebt()) + ' prov.' : '') })}
    ${tile({ k: 'Libre en', icon: 'calendar', color: 'green', value: cap(MESES_L[+projection().slice(5) - 1]), unit: projection().slice(0, 4), foot: 'sin plan: ' + ymLabel(noPlanEnd()) })}
  </div>
  ${hasDebt ? sh('Cómo baja tu deuda') + debtCard() : ''}
  ${entSection()}
  ${roadmap()}
  ${S.cards.length ? sh('Tarjetas') + S.cards.map(cardBoss).join('') : ''}
  ${ord.list.length ? sh('Orden de ataque') + `<p class="gf" style="margin:-2px 2px 12px">${why}</p>` + ord.list.map((l, i) => bossCard(l, i === 0)).join('') : ''}
  ${!S.loans.length && !S.cards.length ? `<div class="card center"><span class="ico xl" style="--c:var(--red);margin:0 auto">${sym('flame')}</span><h3 class="mt">Cargá tus deudas</h3><p class="s2 mt" style="font-size:15px">Cada préstamo es un jefe con barra de vida. Cada pago le quita vida.</p><button class="btn p mt2" data-act="addDebt">Agregar deuda</button></div>` : ''}
  ${vals.some(v => v) ? sh('Cuotas de los próximos 12 meses') + `<div class="card"><div class="chart">${months.map((m, i) => `<div><i style="height:${(vals[i] / mx * 82).toFixed(1)}%"></i><small>${MESES[+m.slice(5) - 1]}</small></div>`).join('')}</div>
    <p class="gf" style="margin:10px 0 0">Sin contar ataques. Cada barra que baja es una cuota que se libera: esa plata va al siguiente jefe, no a gastos.</p></div>` : ''}
  ${dead.length ? sh('Derrotados') + dead.map(l => bossCard(l, false)).join('') : ''}`;
}

/* =========================================================================
   Pantalla: Negocio
   ========================================================================= */
const LADDER = [[1e6, 'Freelancer'], [2.5e6, 'Emprendedor'], [5e6, 'Negocio'], [10e6, 'Empresa'], [20e6, 'Imperio']];
function payRow(p) {
  const pend = payPend(p), paid = pend <= 0, v = p.venta && M.find(m => m.id === p.venta);
  const sub = [esc(p.desc || 'Compra'), dLabel(p.date)];
  if (paid) sub.push(p.pagos.some(x => x.venta) ? 'match con la venta' : 'pagado');
  else if (v) sub.push('vinculada a una venta');
  else if (p.venc) sub.push('vence ' + dLabel(p.venc));
  return `<button class="cell" data-act="payable" data-id="${p.id}">${icoBox(paid ? 'check' : 'box', paid ? 'green' : 'indigo')}<div class="tx"><div class="t">${esc(p.prov)}</div><div class="s">${sub.join(' · ')}</div></div>
    <div class="v">${paid ? `<span class="pill" style="--c:var(--green)">${sym('check')}Pagado</span>` : `<span class="num">${gsK(pend)}</span><small>a pagar</small>`}</div>${CHEV}</button>`;
}
function provSection() {
  const pend = pendPayables().sort((a, b) => (a.venc || a.date || '').localeCompare(b.venc || b.date || ''));
  const paid = S.payables.filter(p => payPend(p) <= 0).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
  const list = pend.concat(paid);
  return sh('Proveedores', '<button class="link" data-act="newPayable">Compra a crédito</button>') + (list.length
    ? `<div class="group ic">${list.map(payRow).join('')}</div>
      <p class="gf">${pend.length ? `Le debés <b>${gs(provDebt())}</b> a proveedores. ` : 'Estás al día con tus proveedores. '}Cuando cobrás una venta con el costo "Al proveedor", elegí la deuda y se cancela sola (match).</p>`
    : `<div class="card"><p class="why">¿Un proveedor te dio mercadería a crédito? Cargala como <b>compra a crédito</b>. Cuando cobrás la venta, la elegís y la deuda se cancela sola.</p><button class="btn sm mt" data-act="newPayable">Agregar compra a crédito</button></div>`);
}
function vNegocio() {
  const k = ym(today()), st = S.settings, mes = MESES_L[+k.slice(5) - 1];
  const ventas = inMonth(k, ['venta']);
  const fact = sum(ventas, m => m.amt), gan = sum(ventas, ganancia), cofre = sum(ventas.filter(m => m.cobrada !== false), m => m.toCofre);
  const meta = st.metaFacturacion || 1, pc = fact / meta * 100;
  const iva = ivaMonth(k), best = Math.max(bestMonthFact(), fact), caja = goal('emprender');
  const last = M.filter(m => m.t === 'venta' || m.t === 'pagoprov' || (m.t === 'gasto' && m.ambito === 'negocio')).sort(byDateDesc).slice(0, 8);
  return `${lt('Negocio', 'Emprender full', `<button class="icbtn" data-act="add" data-t="venta" aria-label="Nueva venta">${sym('plus')}</button>`)}
  <div class="card">
    <div class="row between"><div class="k-head" style="color:var(--green)">${sym('chart')}Facturación de ${mes}</div>${pc >= 100 ? '<span class="pill" style="--c:var(--green)">Meta cumplida</span>' : ''}</div>
    <div class="bignum num">${vu(fmt(fact))}</div>
    <div class="mt">${bar(pc, 'lg', 'var(--green)')}</div>
    <div class="row between" style="margin-top:6px"><small>${pc.toFixed(0)}% de la meta</small><small>meta ${gs(meta)}</small></div>
    <div class="g3 mt2">
      <div class="kv"><div class="k">Ventas</div><div class="n">${ventas.length}</div></div>
      <div class="kv"><div class="k">Ganancia real</div><div class="n pos">${gsK(gan)}</div></div>
      <div class="kv"><div class="k">Al cofre</div><div class="n" style="color:var(--orange)">${gsK(cofre)}</div></div>
    </div>
    ${fact ? `<p class="gf" style="margin:8px 0 0">Margen después de costo e IVA: <b>${(gan / fact * 100).toFixed(0)}%</b>.</p>` : ''}
    <div class="ladder">${LADDER.map(([v, n]) => `<div class="${best >= v ? 'on' : ''}"><i></i>${n}<br><span class="s2">${gsK(v)}</span></div>`).join('')}</div>
    <p class="gf" style="margin:10px 0 0">Escalera de facturación mensual. Tu mejor mes: <b>${gs(best)}</b>.</p>
  </div>
  <div class="g2 mt">
    ${tile({ k: 'Caja del negocio', icon: 'briefcase', color: 'indigo', value: fmt(caja.saved), vcolor: caja.saved < 0 ? 'var(--red)' : '', foot: 'capital para comprar', act: 'goal', id: 'emprender' })}
    ${tile({ k: 'Sobre IVA', icon: 'receipt', color: 'gray', value: fmt(S.funds.iva), foot: 'no es tuyo: es del fisco' })}
  </div>
  ${cobrosSection()}
  ${provSection()}
  ${sh('IVA de ' + mes)}
  <div class="group">
    <div class="cell"><div class="tx"><div class="t">IVA débito</div><div class="s">De tus ventas</div></div><div class="v num">${gs(iva.deb)}</div></div>
    <div class="cell"><div class="tx"><div class="t">IVA crédito</div><div class="s">De tus compras con factura</div></div><div class="v num">− ${gs(iva.cred)}</div></div>
    <div class="cell"><div class="tx"><div class="t" style="font-weight:600">A pagar (estimado)</div><div class="s">Se declara el mes que viene</div></div><div class="v num" style="font-weight:700">${gs(Math.max(0, iva.deb - iva.cred))}</div></div>
    ${iva.deb < iva.cred ? `<div class="cell"><div class="tx"><div class="t">Saldo a favor</div><div class="s">Se arrastra al mes siguiente</div></div><div class="v num pos">${gs(iva.cred - iva.deb)}</div></div>` : ''}
    <div class="cell"><div class="tx"><div class="t">IVA pagado como consumidor</div><div class="s">Tus gastos personales con IVA</div></div><div class="v num dim">${gs(iva.pers)}</div></div>
  </div>
  <div class="btns mt"><button class="btn sm" data-act="payIva">Registrar pago de IVA</button><button class="btn sm" style="--c:var(--orange)" data-act="moveFund" data-from="iva" data-to="cofre">Sobrante al cofre</button></div>
  <p class="gf">Paraguay: IVA 10% (tasa general) o 5% (canasta básica y algunos rubros), incluido en el precio: IVA 10% = total ÷ 11 · IVA 5% = total ÷ 21. Pagás la diferencia entre el IVA de tus ventas y el de tus compras con factura a tu RUC. Se declara cada mes según la terminación del RUC. Confirmá tu régimen (IVA, IRE, IRP) con un contador.</p>
  ${sh('Últimos movimientos del negocio')}
  ${last.length ? `<div class="group ic">${last.map(movRow).join('')}</div>` : `<div class="card center"><p class="s2">Todavía no hay ventas. La primera desbloquea un logro.</p><button class="btn p mt" data-act="add" data-t="venta">Registrar venta</button></div>`}
  ${sh('Plan comercial')}
  <div class="group steps">${[
    ['Una oferta, un precio', 'Empaquetá un producto o servicio concreto con precio cerrado.'],
    ['Solo se reparte la ganancia', 'De cada venta primero sale el costo (pago al proveedor o reposición de la caja) y el IVA neto. Lo que queda es ganancia: eso se reparte entre cofre y caja.'],
    ['10 contactos por semana', 'WhatsApp, LinkedIn, ex compañeros y referidos. Registrá cada venta acá.'],
    ['50% por adelantado', 'Y 50% contra entrega. Nunca financies a tu cliente.'],
    ['Factura siempre', 'Con factura de compra a tu RUC, el IVA que pagaste se descuenta del IVA de tu venta.'],
    ['Ingreso recurrente', 'Clientes que vuelven y servicios mensuales le ganan a las ventas sueltas.'],
    ['El negocio paga lo suyo', 'Mercadería, herramientas y publicidad salen de la caja del negocio, nunca de la tarjeta personal.']
  ].map(([t, p]) => `<div class="step"><span class="nb"></span><div><b>${t}</b><p>${p}</p></div></div>`).join('')}</div>`;
}

/* =========================================================================
   Pantalla: Plan
   ========================================================================= */
const REGLAS = [
  ['Viví con el base, atacá con lo extra.', 'Si tu vida depende de las horas extra, un mes flojo te hace volver a la tarjeta.'],
  ['La tarjeta es débito con otro nombre.', 'Solo pasás lo que ya tenés en la cuenta y pagás el total. Financiar el saldo te cobra intereses por nada.'],
  ['Atacá un jefe a la vez.', 'Concentrar el pago extra en uno lo elimina antes y libera su cuota completa. Repartir “un poco a cada uno” no libera nada.'],
  ['Primero la tasa más alta.', 'Método avalancha: matemáticamente el más barato. Sin TAE, el que libera más flujo.'],
  ['Cada guaraní liberado tiene destino.', 'Cuota que termina, sobre que sobra, venta que entra → cofre. Nada queda “suelto”.'],
  ['Colchón antes que velocidad.', 'Sin colchón, el primer imprevisto vuelve a la tarjeta y borrás meses de progreso.'],
  ['Registrar todo, todos los días.', 'Lo que se mide se controla. 10 segundos por gasto. La racha es el hábito.']
];
function fases() {
  const tc = S.cards.find(c => c.extracto > 0) || S.cards[0], tgt = attackOrder().list[0];
  return [
    ['Fase 0 · Frenar la sangría', [
      ['t1', tc ? `Pagar el <b>TOTAL</b> del extracto de ${esc(tc.name)} (${gs(tc.extracto)})${tc.vence ? ' antes del ' + dLabel(tc.vence) : ''}. El débito automático suele cubrir solo el mínimo.` : 'Si usás tarjeta: pagá siempre el TOTAL del extracto.'],
      ['t2', 'Pedir a cada banco: <b>TAE, saldo de precancelación y si cobran penalidad</b>. Cargá las TAE en Batalla.'],
      ['t3', 'Cero deudas nuevas: nada de adelantos en cuenta, compras en cuotas ni préstamos nuevos.'],
      ['t4', '(Opcional) Pedir que bajen la línea de la tarjeta: menos tentación.']]],
    ['Fase 1 · El golpe (aguinaldo o ingreso grande)', [
      ['t5', `Separar el <b>colchón</b> (${gs(goal('colchon').target)}) en una cuenta aparte.`],
      ['t6', `Separar la <b>caja del negocio</b> (${gs(goal('emprender').target)}). Tope duro: no se agrega más.`],
      ['t7', tgt ? `Con el resto${S.settings.lump ? ' (~' + gsK(S.settings.lump) + ')' : ''}, <b>precancelar</b> a ${esc(tgt.name)} → libera ${gs(tgt.cuota)}/mes.` : 'Con el resto, precancelar al jefe objetivo.']]],
    ['Fase 2 · Bola de nieve', [
      ['t8', 'Vivir con el sueldo base. Cada cobro de horas extra → cofre → ataque.'],
      ['t9', 'Cada venta: el costo vuelve a la caja, el IVA a su sobre y el % elegido de la ganancia al cofre.'],
      ['t10', 'Cuando cae un jefe, su cuota NO se gasta: se suma al ataque del siguiente.'],
      ['t11', 'Revisión: domingo 10 min acá · fin de mes, el prompt de revisión con Claude.']]],
    ['Fase 3 · Libre', [
      ['t12', `Mantener los ${gs(debtBudget())}/mes, ahora hacia: colchón de 6 meses, viajes, inversión y negocio.`]]]
  ];
}
function worlds() {
  const p = pctFree(), free = isFree(), fin = projection(), k = ym(today());
  const fact = factMonth(k), meta = S.settings.metaFacturacion || 1;
  const trips = S.goals.filter(g => g.kind === 'viaje'), tS = sum(trips, g => g.saved), tT = sum(trips, g => g.target);
  const w = (color, icon, title, subt, pct, foot, locked = false) => `<div class="world ${locked ? 'locked' : ''}"><span class="ico lg" style="--c:var(--${locked ? 'gray' : color})">${sym(locked ? 'lock' : icon)}</span><div class="tx"><h3>${title}</h3><small>${subt}</small><div class="mt">${bar(pct, '', `var(--${color})`)}</div><small>${foot}</small></div></div>`;
  return w('red', 'flame', 'Mundo 1 · Matar la deuda', free ? 'Completado' : 'Libre en ' + ymLabel(fin) + ' (estimado)', free ? 100 : p, (free ? 100 : p).toFixed(1) + '% eliminado')
    + w('green', 'briefcase', 'Mundo 2 · Emprender full', 'Facturar ' + gsK(meta) + '/mes de forma constante', fact / meta * 100, 'Este mes: ' + gsK(fact) + ' de ' + gsK(meta))
    + w('cyan', 'airplane', 'Mundo 3 · Viajes', trips.map(g => esc(g.name)).join(' · '), tT ? tS / tT * 100 : 0, travelOpen() ? gsK(tS) + ' de ' + gsK(tT) + ' ahorrados' : 'Se desbloquea al ser libre · ' + ymLabel(fin), !travelOpen());
}
function distCard() {
  const st = S.settings, ing = st.base + st.extra;
  if (!ing) return `<div class="card"><p class="why">Cargá tu sueldo y tus horas extra en <button class="link" data-act="settings">Ajustes del plan</button> para ver cómo repartir tu plata.</p></div>`;
  const items = S.budget.map(b => ({ n: b.name, c: `var(--${b.color})`, v: budAmt(b), tipo: b.tipo })).concat([{ n: 'Ataque al cofre', c: 'var(--yellow)', v: st.ataqueMensual, tipo: 'deuda' }]);
  const libre = ing - sum(items, x => x.v);
  if (libre > 0) items.push({ n: 'Sin asignar', c: 'var(--gray)', v: libre, tipo: 'libre' });
  const P2 = v => v / ing * 100, by = t => sum(items.filter(x => x.tipo === t), x => x.v);
  const shown = items.filter(x => x.v > 0);
  return `<div class="card">
    <div class="k-head" style="color:var(--green)">${sym('banknote')}Ingreso mensual del plan</div>
    <div class="bignum num">${vu(fmt(ing))}</div>
    <small>Sueldo base ${gsK(st.base)} + horas extra ${gsK(st.extra)}</small>
    <div class="stack mt">${shown.map(x => `<i style="width:${P2(x.v)}%;background:${x.c}" title="${esc(x.n)}"></i>`).join('')}</div>
    <div class="legend">${shown.map(x => `<span style="--c:${x.c}">${esc(x.n)} <b>${P2(x.v).toFixed(0)}%</b></span>`).join('')}</div>
    <div class="g3 mt2">
      <div class="kv"><div class="k">Necesidades</div><div class="n">${P2(by('nec')).toFixed(0)}%</div></div>
      <div class="kv"><div class="k">Gustos</div><div class="n">${P2(by('deseo')).toFixed(0)}%</div></div>
      <div class="kv"><div class="k">Deuda</div><div class="n" style="color:var(--red)">${P2(by('deuda')).toFixed(0)}%</div></div>
    </div>
    <p class="gf" style="margin:10px 0 0">La regla clásica es 50/30/20 (necesidades / gustos / ahorro). En modo batalla se invierte: la mayor parte va a matar la deuda. Al ser libre pasás a 50/20/30, con viajes, colchón e inversión.</p>
    ${libre < 0 ? `<div class="note mt"><b style="color:var(--red)">Asignaste ${gs(-libre)} más de lo que ganás.</b> Bajá algún sobre o el ataque mensual.</div>` : ''}
  </div>`;
}
function stepsHtml() {
  const st = S.settings, fijos = sum(S.budget.filter(b => b.fijo && b.id !== 'cuotas'), b => b.amt);
  const vars = sum(S.budget.filter(b => !b.fijo), b => b.amt), libreBase = st.base - fijos - S.baseCuotas - vars;
  const tgt = attackOrder().list[0];
  return [
    ['Día de cobro: lo fijo primero', `Vivienda ${gs(fijos)} + cuotas ${gs(S.baseCuotas)} = <b>${gs(fijos + S.baseCuotas)}</b>${st.base ? ' (' + ((fijos + S.baseCuotas) / st.base * 100).toFixed(0) + '% del sueldo base)' : ''}. Se paga el mismo día, antes de gastar nada.`],
    ['Cargá los sobres', `${gs(vars)} para vivir el mes. “Hoy podés gastar” te dice cuánto te toca por día.`],
    libreBase >= 0 ? ['Lo que sobra del base → cofre', `Te quedan ${gs(libreBase)} del sueldo base: van al cofre o al colchón, no al aire.`]
      : ['El sueldo base no alcanza', `Fijos + sobres superan el base por ${gs(-libreBase)}. Recortá sobres para no depender de las horas extra.`],
    ['Horas extra = munición', `${gs(st.ataqueMensual)}/mes al cofre${tgt ? ' → atacá a <b>' + esc(tgt.name) + '</b>' : ''}. Si un mes no hay extras, tu vida no se cae: solo atacás más lento.`],
    ['Cada venta', `Primero pagás al proveedor (el costo), el IVA (venta menos compra) va a su sobre y de la ganancia, ${st.pctVenta}% al cofre.`],
    ['Cuando cae un jefe', 'Su cuota NO se gasta: se suma al ataque del siguiente. El monto mensual para deudas queda fijo hasta ser libre.'],
    ['Cuando seas libre', `Los ${gs(debtBudget())}/mes que hoy van a deudas se reparten: 40% colchón de 6 meses e inversión · 30% viajes · 30% negocio.`]
  ].map(([t, p]) => `<div class="step"><span class="nb"></span><div><b>${t}</b><p>${p}</p></div></div>`).join('');
}
function sobreRow(b) {
  const k = ym(today()), amt = budAmt(b), sp = monthSpent(b.id, k), pc = amt ? sp / amt * 100 : 0;
  const col = b.fijo ? 'var(--gray)' : pc > 100 ? 'var(--red)' : pc > 80 ? 'var(--orange)' : `var(--${b.color})`;
  return `<button class="cell" data-act="budget" data-id="${b.id}">${icoBox(b.sym, b.color)}<div class="tx">
    <div class="row between"><span class="t">${esc(b.name)}</span><span class="num" style="font-size:15px;flex:none">${gsK(sp)} <span class="s2">/ ${gsK(amt)}</span></span></div>
    <div style="margin-top:7px">${bar(pc, '', col)}</div></div>${CHEV}</button>`;
}
function goalRow(g) {
  const pc = g.target ? g.saved / g.target * 100 : 0, locked = g.kind === 'viaje' && !travelOpen();
  return `<button class="cell" data-act="goal" data-id="${g.id}">${icoBox(locked ? 'lock' : g.sym, locked ? 'gray' : g.color)}<div class="tx">
    <div class="row between"><span class="t">${esc(g.name)}</span><span class="num" style="font-size:15px;flex:none">${gsK(g.saved)} <span class="s2">/ ${gsK(g.target)}</span></span></div>
    <div style="margin-top:7px">${bar(pc, '', `var(--${g.color})`)}</div></div>${CHEV}</button>`;
}
function vPlan() {
  const F = fases(), total = sum(F, f => f[1].length), done = F.reduce((a, f) => a + f[1].filter(t => S.tasks[t[0]]).length, 0);
  const cloud = BK && BK.kind === 'cloud';
  return `${lt('Plan', 'Tu estrategia', `<button class="icbtn" data-act="settings" aria-label="Ajustes">${sym('gear')}</button>`)}
  ${sh('Mapa del juego')}
  <div class="card">${worlds()}</div>
  ${sh('Tu plata, paso a paso')}
  ${distCard()}
  <div class="group steps mt">${stepsHtml()}</div>
  ${fijosSection()}
  ${sh('Sobres del mes', '<button class="link" data-act="newBudget">Agregar</button>')}
  <div class="group ic">${S.budget.map(sobreRow).join('')}</div>
  ${sh('Metas')}
  <div class="group ic">${S.goals.map(goalRow).join('')}</div>
  <p class="gf">Los viajes se desbloquean al vencer la deuda: ahí todo lo que hoy va a deudas se redirige. Los montos son estimados: ajustalos cuando coticés.</p>
  ${sh('Misiones', `<small>${done}/${total}</small>`)}
  ${F.map(f => `<div class="gh">${f[0]}</div><div class="group">${f[1].map(t => `<label class="task ${S.tasks[t[0]] ? 'done' : ''}"><input type="checkbox" ${S.tasks[t[0]] ? 'checked' : ''} data-change="task" data-id="${t[0]}"><span>${t[1]}</span></label>`).join('')}</div>`).join('')}
  ${sh('Más')}
  <div class="group ic">
    ${cellLink('rules', 'book', 'yellow', 'Las 7 reglas del juego')}
    ${cellLink('prompt', 'bubble', 'purple', 'Revisión mensual con Claude', 'Prompt con tus datos actualizados')}
    ${cellLink('settings', 'gear', 'gray', 'Ingresos y ajustes del plan')}
    <button class="cell" data-act="account">${icoBox('cloud', 'blue')}<div class="tx"><div class="t">Cuenta y datos</div><div class="s"><span class="sync ${cloud ? 'ok' : 'local'}" id="syncDot"></span>${cloud ? esc(USER && USER.email) : 'Solo en este dispositivo'}</div></div>${CHEV}</button>
  </div>
  <p class="gf center" style="margin-top:26px">Libre · v2.5.0</p>`;
}

/* =========================================================================
   Hoja: registrar movimiento
   ========================================================================= */
let REG = { t: 'gasto', amb: 'personal', cat: 'super', medio: 'debito', card: '', iva: 'none', ivaV: '10', ivaC: '10', costoA: 'proveedor', pay: 'new', provPaid: 'si', cob: 'si', cuenta: '', cuentaProv: '', tipo: 'extra', touched: false, pct: null, d: {} };
function openAdd(t, o = {}) {
  if (t) REG.t = t;
  REG.touched = false; REG.pct = null; REG.d = { date: today() }; REG.pay = 'new'; REG.provPaid = 'si';
  REG.cob = 'si'; REG.cuenta = acctDefault(); REG.cuentaProv = ''; REG.origen = '';
  if (!S.cards.find(c => c.id === REG.card)) REG.card = S.cards[0] ? S.cards[0].id : '';
  if (!S.budget.find(b => b.id === REG.cat && b.id !== 'cuotas')) REG.cat = (S.budget.find(b => b.id !== 'cuotas') || {}).id;
  const p = o.pay && payable(o.pay);
  if (p) { REG.t = 'venta'; REG.costoA = 'proveedor'; REG.pay = p.id; REG.ivaC = p.iva || 'none'; REG.d.costo = fmt(payPend(p)); }
  openSheet(addHtml()); mountAdd();
}
function saveDraft() {
  const v = id => { const e = $('#' + id); return e ? e.value : undefined; };
  const d = { amt: v('fAmt'), date: v('fDate'), note: v('fNote'), cli: v('fCli'), costo: v('fCosto'), prov: v('fProv') };
  $$('#sheet [data-split]').forEach(i => { d[i.id] = i.value; });
  const p = $('#fPct'); if (p) REG.pct = +p.value;
  REG.d = d;
}
function rerenderAdd() { saveDraft(); const sc = $('#sheet').scrollTop; $('#sheet').innerHTML = '<div class="grab"></div>' + addHtml(); $('#sheet').scrollTop = sc; mountAdd(false); }
const regChip = (k, v, label, icon, color, on) => `<button class="chip ${on ? 'on' : ''}" data-act="reg" data-k="${k}" data-v="${v}" style="--c:var(--${color})"><span class="chip-ic">${sym(icon)}</span>${esc(label)}</button>`;
// Chips de cuenta dentro del formulario de registro
const regAcct = (k, label, cur) => S.accounts.length ? `<div class="gh">${label}</div><div class="chips">${S.accounts.map(a => regChip(k, a.id, a.name, acctIcon(a), a.color, cur === a.id)).join('')}${regChip(k, '', 'Ninguna', 'minus', 'gray', !cur)}</div>` : '';
const regOrig = () => { const ls = fondoLoans().filter(l => fondoQueda(l) > 0); if (!ls.length) return '';
  return `<div class="gh">¿Con qué plata?</div><div class="chips">${regChip('origen', '', 'Propia', 'wallet', 'green', !REG.origen)}${ls.map(l => regChip('origen', l.id, 'Préstamo ' + (entOf(l) || l.name) + ' · queda ' + gsK(fondoQueda(l)), 'bank', l.color, REG.origen === l.id)).join('')}</div>`; };
function addHtml() {
  const t = REG.t, d = REG.d;
  let body = '';
  if (t === 'gasto') {
    const neg = REG.amb === 'negocio';
    const cats = S.budget.filter(b => b.id !== 'cuotas');
    body = `
    <div class="seg mt">${segBtns('reg', 'amb', [['personal', 'Personal'], ['negocio', 'Negocio']], REG.amb)}</div>
    ${neg ? '' : `<div class="gh">Sobre</div><div class="chips">${cats.map(c => regChip('cat', c.id, c.name, c.sym, c.color, REG.cat === c.id)).join('')}</div>`}
    <div class="gh">Pagado con</div>
    <div class="seg">${segBtns('reg', 'medio', neg ? [['caja', 'Caja negocio'], ['tc', 'Tarjeta'], ['debito', 'Personal']] : [['debito', 'Débito'], ['efectivo', 'Efectivo'], ['tc', 'Tarjeta']], REG.medio)}</div>
    ${REG.medio === 'tc' ? (S.cards.length > 1 ? `<div class="chips mt">${S.cards.map(c => regChip('card', c.id, c.name, 'creditcard', 'indigo', REG.card === c.id)).join('')}</div>` : '')
      + `<p class="gf">${S.cards.length ? 'Con tarjeta, el jefe Tarjeta recupera vida. Solo si vas a pagar el total del extracto.' : 'No tenés tarjetas cargadas: agregala en Batalla.'}</p>` : regAcct('cuenta', 'Sale de la cuenta', REG.cuenta) + regOrig()}
    <div class="gh">IVA incluido</div>
    <div class="seg">${segBtns('reg', 'iva', [['none', 'Sin dato'], ['10', '10%'], ['5', '5%'], ['ex', 'Exento']], REG.iva)}</div>
    <p class="gf">${neg ? 'Con factura a tu RUC, este IVA es <b>crédito fiscal</b>: se descuenta del IVA de tus ventas.' : 'Informativo: cuánto IVA pagás como consumidor.'}</p>`;
  } else if (t === 'ingreso') {
    const why = {
      sueldo: 'El sueldo base cubre la vida y las cuotas: vive en tus sobres. No hace falta repartirlo.',
      extra: 'Regla del plan: las horas extra son munición. Van al cofre de ataque (y un poco al colchón si no está completo).',
      aguinaldo: 'El golpe del año: completá colchón y caja del negocio; todo el resto al cofre para precancelar.',
      otro: 'Ingreso extraordinario: idealmente, la mayor parte al cofre.'
    }[REG.tipo];
    const rows = [['cofre', 'Al cofre'], ['colchon', 'Al colchón'], ['emprender', 'A la caja del negocio']]
      .concat(travelOpen() ? S.goals.filter(g => g.kind === 'viaje').map(g => [g.id, g.name]) : []);
    body = `
    <div class="gh">Tipo</div>
    <div class="chips">${[['sueldo', 'Sueldo', 'bank'], ['extra', 'Horas extra', 'clock'], ['aguinaldo', 'Aguinaldo', 'gift'], ['otro', 'Otro', 'sparkles']].map(([v, l, ic]) => regChip('tipo', v, l, ic, 'green', REG.tipo === v)).join('')}</div>
    <p class="note mt">${why}</p>
    ${regAcct('cuenta', 'Entró en', REG.cuenta)}
    <div class="gh">Repartir</div>
    <div class="group">${rows.map(([k, l]) => field(l, `<input id="sp_${k}" data-money data-split inputmode="numeric" placeholder="0" value="${esc(d['sp_' + k] || '')}">`)).join('')}</div>
    <p class="gf" id="splitInfo">Lo que no repartas queda para vivir.</p>`;
  } else {
    const pct = REG.pct ?? S.settings.pctVenta;
    body = `
    <div class="group mt">${field('Cliente', `<input id="fCli" placeholder="Opcional" value="${esc(d.cli || '')}">`)}</div>
    <div class="gh">¿Ya te pagaron?</div>
    <div class="seg">${segBtns('reg', 'cob', [['si', 'Sí, cobrado'], ['no', 'Todavía me deben']], REG.cob)}</div>
    ${REG.cob === 'si' ? regAcct('cuenta', 'Cobrado en', REG.cuenta) : '<p class="gf">Queda en <b>Te deben</b>. El reparto al cofre, la caja y el IVA se hace cuando marcás que te pagaron.</p>'}
    <div class="gh">IVA de la venta</div>
    <div class="seg">${segBtns('reg', 'ivaV', [['10', '10%'], ['5', '5%'], ['ex', 'Exento']], REG.ivaV)}</div>
    <div class="gh">Lo que te costó (la compra)</div>
    <div class="group">${field('Costo del producto', `<input id="fCosto" data-money inputmode="numeric" placeholder="0" value="${esc(d.costo || '')}">`)}</div>
    <div class="gh">IVA de la compra</div>
    <div class="seg">${segBtns('reg', 'ivaC', [['10', '10%'], ['5', '5%'], ['ex', 'Exento'], ['none', 'Sin factura']], REG.ivaC)}</div>
    <div class="gh">¿A dónde va el costo?</div>
    <div class="seg">${segBtns('reg', 'costoA', [['proveedor', 'Al proveedor'], ['caja', 'A la caja'], ['bolsillo', 'A mí']], REG.costoA)}</div>
    <p class="gf">${{
      proveedor: '<b>Pago al proveedor:</b> te dio la mercadería a crédito y le pagás con la plata de esta venta. El costo sale y no vuelve a ningún fondo.',
      caja: '<b>Vuelve a la caja:</b> la compra salió de la caja del negocio; el costo vuelve ahí para comprar el próximo producto.',
      bolsillo: '<b>Vuelve a mí:</b> la compraste con tu plata personal y la recuperás.'
    }[REG.costoA] || ''}</p>
    ${REG.costoA === 'proveedor' ? provBlock() : ''}
    <div class="gh">De la ganancia, al cofre de deuda: <b id="pctL">${pct}%</b></div>
    <div class="card" style="padding:12px 16px"><input id="fPct" type="range" min="0" max="100" step="5" value="${pct}" aria-label="Porcentaje al cofre"></div>
    <div class="group mt" id="ventaPrev"></div>`;
  }
  return `${head('Nuevo movimiento', '<button class="link b" data-act="saveAdd">Guardar</button>', '<button class="link" data-act="close">Cancelar</button>')}
  <div class="seg">${segBtns('reg', 't', [['gasto', 'Gasto'], ['ingreso', 'Ingreso'], ['venta', 'Venta']], t)}</div>
  <div class="amount"><div class="cur">${t === 'venta' ? 'COBRADO (GS)' : 'GUARANÍES'}</div><input id="fAmt" data-money inputmode="numeric" placeholder="0" autocomplete="off" value="${esc(d.amt || '')}" aria-label="Monto"></div>
  ${body}
  <div class="group mt2">
    ${field('Fecha', `<input id="fDate" type="date" value="${esc(d.date || today())}">`)}
    ${field('Nota', `<input id="fNote" placeholder="Opcional" value="${esc(d.note || '')}">`)}
  </div>
  <button class="btn p w mt2" data-act="saveAdd">Guardar ${t === 'gasto' ? 'gasto' : t === 'ingreso' ? 'ingreso' : 'venta'}</button>`;
}
// Venta: a qué proveedor le pagás el costo (match con su deuda)
function provBlock() {
  const pend = pendPayables(), d = REG.d, sel = REG.pay !== 'new' ? payable(REG.pay) : null;
  return `<div class="gh">Proveedor</div>
    ${pend.length ? `<div class="chips">${pend.map(p => regChip('pay', p.id, p.prov + ' · ' + gsK(payPend(p)), 'box', 'indigo', REG.pay === p.id)).join('')}${regChip('pay', 'new', 'Otro', 'plus', 'gray', !sel)}</div>` : ''}
    ${sel ? `<p class="gf">${esc(sel.desc || 'Compra')} del ${dLabel(sel.date)} · le debés ${gs(payPend(sel))}. Con esta venta se hace el match.</p>`
      : `<div class="group${pend.length ? ' mt' : ''}">${field('Proveedor', `<input id="fProv" list="dlProv" placeholder="Ej: Distribuidora S.A" autocomplete="off" value="${esc(d.prov || '')}">`)}</div>${dlist('dlProv', knownProvs())}`}
    ${REG.cob === 'no' ? '<p class="gf">Cuando te paguen, le pagás al proveedor y se hace el match.</p>' : `
    <div class="seg mt">${segBtns('reg', 'provPaid', [['si', 'Ya le pagué'], ['no', 'Le pago después']], REG.provPaid)}</div>
    <p class="gf">${REG.provPaid === 'si' ? 'La deuda con el proveedor queda cancelada con esta venta.' : 'La deuda queda pendiente y vinculada a esta venta. Cuando le pagues, marcala en Negocio → Proveedores.'}</p>
    ${REG.provPaid === 'si' && S.accounts.length > 1 ? regAcct('cuentaProv', 'Le pagaste desde', REG.cuentaProv || REG.cuenta) : ''}`}`;
}
function mountAdd(focus = true) {
  addLive();
  if (focus && window.matchMedia('(pointer:fine)').matches) setTimeout(() => { const a = $('#fAmt'); if (a) a.focus(); }, 120);
}
function suggestSplit(amt, tipo) {
  const out = { cofre: 0, colchon: 0, emprender: 0 };
  if (!amt || tipo === 'sueldo') return out;
  const col = goal('colchon'), emp = goal('emprender');
  const fc = Math.max(0, col.target - col.saved), fe = Math.max(0, emp.target - emp.saved);
  if (tipo === 'aguinaldo') { out.colchon = Math.min(amt, fc); out.emprender = Math.min(amt - out.colchon, fe); out.cofre = amt - out.colchon - out.emprender; }
  else { out.colchon = Math.min(fc, Math.round(amt * 0.3)); out.cofre = amt - out.colchon; }
  return out;
}
// Venta con costo: IVA a pagar = IVA de la venta − IVA de la compra; ganancia = cobrado − costo − IVA a pagar
function ventaCalc(amt, iva, pct, costo = 0, ivaC = 'none') {
  const ivaV = ivaOf(amt, iva), ivaK = ivaOf(costo, ivaC);
  const ivaPagar = Math.max(0, ivaV - ivaK);
  const gan = amt - costo - ivaPagar;
  const cofre = gan > 0 ? Math.round(gan * pct / 100) : 0;
  return { ivaV, ivaK, ivaPagar, gan, cofre, emp: gan - cofre, neto: amt - ivaV };
}
function addLive(e) {
  const amt = parseN(($('#fAmt') || {}).value);
  if (REG.t === 'ingreso') {
    if (e && e.target && e.target.dataset && e.target.dataset.split !== undefined) REG.touched = true;
    if (!REG.touched) { const s = suggestSplit(amt, REG.tipo); $$('#sheet [data-split]').forEach(i => { const k = i.id.slice(3); i.value = s[k] ? fmt(s[k]) : ''; }); }
    const tot = sum($$('#sheet [data-split]'), i => parseN(i.value)), info = $('#splitInfo');
    if (info) info.innerHTML = !amt ? 'Lo que no repartas queda para vivir.' : tot > amt ? `<span class="neg">El reparto supera el monto por ${gs(tot - amt)}</span>` : `Queda para vivir: <b>${gs(amt - tot)}</b>`;
  }
  if (REG.t === 'venta') {
    const p = +($('#fPct') || {}).value || 0; const l = $('#pctL'); if (l) l.textContent = p + '%';
    const costo = parseN(($('#fCosto') || {}).value);
    const v = ventaCalc(amt, REG.ivaV, p, costo, REG.ivaC), box = $('#ventaPrev');
    const row = (a, b, cls = '') => `<div class="cell ${cls}"><div class="tx s2" style="font-size:15px">${a}</div><div class="v num">${b}</div></div>`;
    if (box) box.innerHTML = [
      row('Cobrado', gs(amt)),
      costo ? row('Costo del producto', '− ' + gs(costo)) : '',
      row('IVA de la venta (débito)', gs(v.ivaV)),
      costo && v.ivaK ? row('IVA de la compra (crédito)', '− ' + gs(v.ivaK)) : '',
      row('IVA a pagar → sobre IVA', `<b>${gs(v.ivaPagar)}</b>`),
      row('Ganancia real' + (amt ? ` (${(v.gan / amt * 100).toFixed(0)}%)` : ''), `<b class="${v.gan < 0 ? 'neg' : 'pos'}">${gs(v.gan)}</b>`),
      row(`Al cofre de ataque (${p}%)`, `<b style="color:var(--orange)">${gs(v.cofre)}</b>`),
      row('A la caja del negocio', gs(v.emp)),
      costo ? row({ proveedor: 'Costo → pagado al proveedor', caja: 'Costo recuperado → caja', bolsillo: 'Costo recuperado → vos' }[REG.costoA], gs(costo)) : ''
    ].join('');
  }
}
function saveAdd() {
  const amt = parseN($('#fAmt').value);
  if (!amt) { toast('Ingresá un monto'); $('#fAmt').focus(); return; }
  const date = $('#fDate').value || today(), note = $('#fNote').value.trim();
  const m = { id: uid(), ts: Date.now(), date, amt, note, t: REG.t };
  let msg = '';
  if (REG.t === 'gasto') {
    m.ambito = REG.amb; m.medio = REG.medio; m.cat = REG.amb === 'negocio' ? 'negocio' : REG.cat;
    if (m.medio === 'tc') { if (!S.cards.length) { toast('Primero agregá tu tarjeta en Batalla'); return; } m.card = REG.card || S.cards[0].id; }
    m.iva = REG.iva; m.ivaAmt = ivaOf(amt, REG.iva);
    if (m.medio !== 'tc' && REG.cuenta && acct(REG.cuenta)) { m.cuenta = REG.cuenta; lsSet('libre-acct', REG.cuenta); }
    if (m.medio !== 'tc' && REG.origen && loan(REG.origen)) m.origen = REG.origen;
    applyMov(m); addXP(5);
    if (m.ambito === 'personal') {
      const b = S.budget.find(x => x.id === m.cat), spent = monthSpent(m.cat, ym(date)) + amt;
      msg = b && b.amt ? (spent > b.amt ? `Te pasaste del sobre ${b.name} por ${gs(spent - b.amt)}` : `Quedan ${gs(b.amt - spent)} en ${b.name}`) : 'Gasto guardado';
    } else msg = 'Gasto del negocio guardado';
  } else if (REG.t === 'ingreso') {
    m.tipo = REG.tipo; const split = {}; let tot = 0;
    $$('#sheet [data-split]').forEach(i => { const v = parseN(i.value); if (v) { split[i.id.slice(3)] = v; tot += v; } });
    if (tot > amt) { toast('El reparto supera el monto'); return; }
    if (REG.cuenta && acct(REG.cuenta)) { m.cuenta = REG.cuenta; lsSet('libre-acct', REG.cuenta); }
    m.split = split; applyMov(m); addXP(10 + Math.floor((split.cofre || 0) / 100000));
    msg = 'Ingreso guardado' + (split.cofre ? ' · +' + gsK(split.cofre) + ' al cofre' : '');
  } else {
    const p = +$('#fPct').value, costo = parseN($('#fCosto').value), v = ventaCalc(amt, REG.ivaV, p, costo, REG.ivaC);
    Object.assign(m, {
      cliente: $('#fCli').value.trim(), iva: REG.ivaV, ivaAmt: v.ivaV, costo, ivaC: costo ? REG.ivaC : 'none', ivaCosto: costo ? v.ivaK : 0,
      costoA: REG.costoA, costoRet: REG.costoA === 'caja' ? costo : 0, ivaRes: S.settings.ivaAuto ? v.ivaPagar : 0,
      neto: v.neto, ganancia: v.gan, toCofre: v.cofre, toEmp: v.emp, pct: p
    });
    // Match con la deuda del proveedor (una existente o una nueva con el nombre que escribiste)
    if (REG.costoA === 'proveedor' && costo) {
      let pv = REG.pay !== 'new' ? payable(REG.pay) : null, isNew = false;
      if (!pv) {
        const name = (($('#fProv') || {}).value || '').trim();
        if (name) { pv = { id: uid(), prov: name, desc: note || m.cliente || 'Compra', amt: costo, iva: m.ivaC, date, venc: '', venta: null, pagos: [] }; S.payables.push(pv); isNew = true; }
      }
      if (pv) Object.assign(m, { payable: pv.id, prov: pv.prov, payNew: isNew, provPaid: REG.cob === 'si' && REG.provPaid === 'si', payAmt: isNew ? costo : Math.min(costo, payPend(pv)) });
    }
    // Cobro: en qué cuenta entró la plata (o queda en "Te deben")
    m.cobrada = REG.cob === 'si';
    if (m.cobrada) {
      m.cobD = date; m.cobTs = m.ts;
      if (REG.cuenta && acct(REG.cuenta)) { m.cuenta = REG.cuenta; lsSet('libre-acct', REG.cuenta); }
      if (m.provPaid && REG.cuentaProv && REG.cuentaProv !== REG.cuenta && acct(REG.cuentaProv)) m.cuentaProv = REG.cuentaProv;
    }
    S.settings.pctVenta = p; applyMov(m); addXP(30); confetti();
    msg = m.cobrada
      ? '¡Venta! Ganancia ' + gsK(v.gan) + ' · +' + gsK(v.cofre) + ' al cofre' + (m.payable ? (m.provPaid ? ' · ' + m.prov + ' pagado' : ' · ' + m.prov + ' pendiente') : '')
      : 'Venta registrada · te deben ' + gs(amt);
  }
  M.push(m); checkin(); toast(msg); haptic(12); checkAch();
  commit({ add: [m] }); closeSheet(); render();
}
function diaCero() {
  const t = today();
  if (M.some(e => e.date === t && e.t === 'gasto')) return toast('Hoy ya registraste gastos');
  if (M.some(e => e.date === t && e.t === 'cero')) return toast('Ya marcaste hoy');
  const m = { id: uid(), ts: Date.now(), date: t, amt: 0, t: 'cero' };
  M.push(m); checkin(); addXP(15); unlock('cero'); checkAch(); commit({ add: [m] }); render();
}
function movDetail(id) {
  const m = M.find(x => x.id === id); if (!m) return;
  const mm = movMeta(m), rows = [['Fecha', dLabel(m.date)]];
  if (m.t === 'gasto') { rows.push(['Tipo', m.ambito === 'negocio' ? 'Negocio' : 'Personal'], ['Pagado con', MEDIO_L[m.medio] || '—']); if (m.ivaAmt) rows.push(['IVA ' + m.iva + '%', gs(m.ivaAmt)]); }
  if (m.t === 'ingreso') Object.entries(m.split || {}).forEach(([k, v]) => rows.push([fundName(k), gs(v)]));
  if (m.t === 'venta') {
    if (m.costo) rows.push(['Costo del producto', '− ' + gs(m.costo)]);
    rows.push(['IVA venta ' + (m.iva === 'ex' ? 'exento' : m.iva + '%'), gs(m.ivaAmt)]);
    if (m.ivaCosto) rows.push(['IVA compra (crédito)', '− ' + gs(m.ivaCosto)]);
    rows.push(['IVA a pagar', gs((m.ivaAmt || 0) - (m.ivaCosto || 0))], ['Ganancia real', gs(ganancia(m))], ['Al cofre', gs(m.toCofre)], ['A la caja', gs(m.toEmp)]);
    if (m.costo) rows.push({ proveedor: [m.provPaid === false ? 'A pagar al proveedor' : 'Pagado al proveedor', gs(m.costo)], caja: ['Costo recuperado', gs(m.costo) + ' → caja'] }[m.costoA] || ['Costo recuperado', gs(m.costo) + ' → vos']);
    const pv = m.payable && payable(m.payable);
    if (pv) rows.push(['Proveedor', `<button class="link" data-act="payable" data-id="${pv.id}">${esc(pv.prov)} · ${payPend(pv) > 0 ? 'pendiente' : 'pagado'}</button>`]);
  }
  if (m.t === 'pagoprov') rows.push(['Sale de', { venta: 'Una venta (ya separado)', caja: 'Caja del negocio', personal: 'Tu bolsillo' }[m.src] || '—']);
  // Dónde entró o de dónde salió la plata (tocá para cambiar la cuenta)
  const acctBtn = (f, label, val) => rows.push([label, `<button class="link" data-act="movAcct" data-id="${m.id}" data-f="${f}">${val ? esc(acctName(val)) : 'Elegir cuenta'}</button>`]);
  if (m.t === 'venta') {
    if (m.cobrada === false) rows.push(['Cobro', '<span style="color:var(--orange);font-weight:600">Pendiente · te deben</span>']);
    else {
      rows.push(['Cobro', 'Cobrado el ' + dLabel(m.cobD || m.date)]);
      if (S.accounts.length) { acctBtn('cuenta', 'Cobrado en', m.cuenta); if (m.provPaid && m.payable) acctBtn('cuentaProv', 'Pago al proveedor desde', m.cuentaProv || m.cuenta); }
    }
  } else if (S.accounts.length && (['ingreso', 'cuota', 'ataque', 'precancel', 'pagotc', 'pagoiva', 'pagoprov'].includes(m.t) || (m.t === 'gasto' && m.medio !== 'tc')))
    acctBtn('cuenta', m.t === 'ingreso' ? 'Entró en' : 'Pagado desde', m.cuenta);
  // Con qué plata se pagó (propia o la que te quedó de un préstamo)
  if ((['cuota', 'ataque', 'precancel', 'pagotc', 'pagoiva', 'pagoprov'].includes(m.t) || (m.t === 'gasto' && m.medio !== 'tc')) && (m.origen || fondoLoans().length)) {
    const ol = m.origen && loan(m.origen);
    rows.push(['Con plata de', `<button class="link" data-act="movOrig" data-id="${m.id}">${ol ? 'Préstamo ' + esc(entOf(ol) || ol.name) : 'Propia'}</button>`]);
  }
  if (m.t === 'transf') rows.push(['Desde', esc(acctName(m.from))], ['Hacia', esc(acctName(m.to))]);
  if (m.t === 'ajuste') rows.push(['Cuenta', esc(acctName(m.cuenta))]);
  if (m.t === 'precancel' && m.ahorro) rows.push(['Ahorro en intereses', gs(m.ahorro)]);
  if (m.note) rows.push(['Nota', esc(m.note)]);
  openSheet(`${head('Detalle')}
    <div class="center" style="padding:6px 0 18px"><span class="ico xl" style="--c:var(--${mm.color});margin:0 auto">${sym(mm.icon)}</span>
      <div class="mt" style="font-size:17px;font-weight:600">${esc(mm.title)}</div>
      ${m.t === 'cero' ? '' : big((mm.sign < 0 ? '−' : mm.sign > 0 ? '+' : '') + fmt(m.amt) + '<span class="u">Gs</span>', mm.sign > 0 ? 'pos' : '')}</div>
    <div class="group">${rows.map(r => `<div class="cell"><div class="tx s2">${r[0]}</div><div class="v">${r[1]}</div></div>`).join('')}</div>
    ${m.t === 'venta' && m.costo && (m.costoA || 'proveedor') === 'proveedor' && !(m.payable && payable(m.payable))
      ? `<button class="btn p w mt2" style="--c:var(--indigo)" data-act="assignProv" data-id="${m.id}">${sym('box')}Asignar proveedor y hacer el match</button>` : ''}
    ${m.t === 'venta' && m.cobrada === false ? `<button class="btn p w mt2" style="--c:var(--green)" data-act="cobrar" data-id="${m.id}">${sym('check')}Ya me pagaron</button>` : ''}
    ${m.t === 'venta' && m.cobrada !== false ? `<button class="btn w mt2" style="--c:var(--orange)" data-act="undoCobro" data-id="${m.id}">Marcar como no cobrada</button>` : ''}
    <button class="btn w mt2" style="--c:var(--red)" data-act="delMov" data-id="${m.id}">Eliminar movimiento</button>
    <p class="gf center">Se revierte su efecto en cofre, metas, tarjeta y cronograma.</p>`);
}
function delMov(id) {
  const m = M.find(x => x.id === id); if (!m) return;
  revertMov(m); M = M.filter(x => x.id !== id);
  commit({ del: [id] }); closeSheet(); toast('Movimiento eliminado'); render();
}

/* =========================================================================
   Hojas: préstamos y tarjetas
   ========================================================================= */
const bossHead = (l, sub) => `<div class="center" style="padding:4px 0 14px"><span class="ico xl" style="--c:var(--${l.color});margin:0 auto">${sym('bank')}</span><div style="font-weight:600;margin-top:10px">${esc(l.name)}</div><small>${entOf(l) ? esc(entOf(l)) + ' · ' : ''}${sub}</small></div>`;
function payCuotaSheet(id) {
  const l = loan(id), c = nextCuota(l); if (!c) return;
  openSheet(`${head('Pagar cuota')}${bossHead(l, 'Cuota ' + c.n + ' · vence ' + dLabel(c.d))}
    <div class="group">${field('Monto pagado', money('sAmt', c.a))}</div>
    ${acctPicker('sCta')}${origPicker('sOrig')}
    <button class="btn p w mt2" style="--c:var(--green)" data-act="doPayCuota" data-id="${l.id}">Confirmar pago</button>`);
}
function doPayCuota(id) {
  const l = loan(id), c = nextCuota(l); if (!c) return;
  const amt = parseN($('#sAmt').value) || c.a;
  c.paid = true; c.pd = today(); SIM = null;
  const m = { id: uid(), ts: Date.now(), date: today(), amt, t: 'cuota', loan: l.id, n: c.n, note: l.name + ' · cuota ' + c.n, cuenta: pickedAcct('sCta'), origen: pickedOrig('sOrig') };
  M.push(m); addXP(20); checkin(); haptic(15);
  if (loanSaldo(l) <= 0) { toast(l.name + ' derrotado'); confetti(); } else toast('−' + gs(amt) + ' de vida a ' + l.name);
  checkAch(); commit({ add: [m] }); closeSheet(); render();
}
function attackSheet(id) {
  const l = loan(id), s = loanSaldo(l);
  openSheet(`${head('Atacar')}${bossHead(l, 'Vida: ' + gs(s))}
    <p class="note">Usalo cuando el banco te acepte un <b>pago anticipado</b> (adelanto de cuotas o amortización extraordinaria). Se descuenta desde la <b>última cuota</b> hacia atrás: así terminás antes.</p>
    <div class="group mt"><div class="cell">${icoBox('coins', 'orange')}<div class="tx">En el cofre</div><div class="v num" style="color:var(--orange)">${gs(S.funds.cofre)}</div></div>
      ${field('Monto del ataque', money('sAmt', Math.max(0, Math.min(S.funds.cofre, s))))}</div>
    ${acctPicker('sCta')}${origPicker('sOrig')}
    <button class="btn p w mt2" style="--c:var(--orange)" data-act="doAttack" data-id="${l.id}">Atacar</button>`);
}
const snapshot = l => l.cuotas.map(c => Object.assign({}, c));
const diffUndo = (before, l) => before.map((c, i) => ({ i, c })).filter(({ i, c }) => stable(c) !== stable(l.cuotas[i]));
function doAttack(id) {
  const l = loan(id), s = loanSaldo(l), amt = Math.min(parseN($('#sAmt').value), s);
  if (!amt) return toast('Ingresá un monto');
  const before = snapshot(l); let rem = amt;
  for (let i = l.cuotas.length - 1; i >= 0 && rem > 0; i--) {
    const c = l.cuotas[i]; if (c.paid) continue;
    if (c.a <= rem) { rem -= c.a; c.a = 0; c.paid = true; c.pd = today(); c.adel = true; } else { c.a -= rem; rem = 0; }
  }
  const fromCofre = Math.max(0, Math.min(S.funds.cofre, amt)); S.funds.cofre -= fromCofre; SIM = null;
  const m = { id: uid(), ts: Date.now(), date: today(), amt, t: 'ataque', loan: l.id, note: l.name, undo: diffUndo(before, l), fromCofre, cuenta: pickedAcct('sCta'), origen: pickedOrig('sOrig') };
  M.push(m); addXP(20 + Math.floor(amt / 100000)); checkin(); haptic(25); confetti();
  toast(loanSaldo(l) <= 0 ? l.name + ' derrotado' : 'Golpe de ' + gs(amt));
  checkAch(); commit({ add: [m] }); closeSheet(); render();
}
function precancelSheet(id) {
  const l = loan(id), s = loanSaldo(l);
  openSheet(`${head('Precancelar')}${bossHead(l, 'Suma de cuotas: ' + gs(s))}
    <p class="note">Pedí al banco el <b>saldo de precancelación</b>: suele ser menor que la suma de cuotas porque descuentan los intereses futuros. Ese descuento es tu premio.</p>
    <div class="group mt">${field('Monto real pagado', money('sAmt', '', fmt(s)))}</div>
    ${acctPicker('sCta')}${origPicker('sOrig')}
    <button class="btn p w mt2" style="--c:var(--orange)" data-act="doPrecancel" data-id="${l.id}">Precancelar</button>`);
}
function doPrecancel(id) {
  const l = loan(id), s = loanSaldo(l), paid = parseN($('#sAmt').value);
  if (!paid) return toast('Ingresá el monto pagado');
  const before = snapshot(l);
  l.cuotas.forEach(c => { if (!c.paid) { c.paid = true; c.pd = today(); c.pc = true; } });
  const ahorro = Math.max(0, s - paid);
  l.precancel = { fecha: today(), pagado: paid, ahorro };
  const fromCofre = Math.max(0, Math.min(S.funds.cofre, paid)); S.funds.cofre -= fromCofre; SIM = null;
  const m = { id: uid(), ts: Date.now(), date: today(), amt: paid, t: 'precancel', loan: l.id, note: l.name, ahorro, undo: diffUndo(before, l), fromCofre, cuenta: pickedAcct('sCta'), origen: pickedOrig('sOrig') };
  M.push(m); addXP(100); checkin(); haptic(40); confetti(); setTimeout(confetti, 600);
  toast('Golpe crítico: te ahorraste ' + gs(ahorro)); unlock('critico');
  checkAch(); commit({ add: [m] }); closeSheet(); render();
}
function loanDetail(id) {
  const l = loan(id), s = loanSaldo(l), dead = s <= 0;
  openSheet(`${head(esc(l.name), `<button class="link" data-act="editLoan" data-id="${l.id}">Editar</button>`)}
    <div class="center" style="padding:4px 0 14px"><span class="ico xl" style="--c:var(--${dead ? 'gray' : l.color});margin:0 auto">${sym(dead ? 'check' : 'bank')}</span>${big(fmt(s) + '<span class="u">Gs</span>')}<small>${dead ? 'Derrotado' : 'vida restante'}</small></div>
    <div class="group">
      <button class="cell" data-act="editLoan" data-id="${l.id}"><div class="tx s2">Entidad</div><div class="v">${entOf(l) ? esc(entOf(l)) : '<span style="color:var(--blue)">Agregar</span>'}</div>${CHEV}</button>
      <div class="cell"><div class="tx s2">Cuota</div><div class="v num">${gs(l.cuota)}</div></div>
      ${dead ? '' : `<div class="cell"><div class="tx s2">Cae según la hoja de ruta</div><div class="v">${ymLabel(loanFreeMonth(l.id))}</div></div>`}
      <div class="cell"><div class="tx s2">Cuotas que faltan</div><div class="v">${l.cuotas.filter(c => !c.paid).length} de ${l.cuotas.length}</div></div>
      <div class="cell"><div class="tx s2">Termina</div><div class="v">${dLabel(lastDate(l))}</div></div>
      <div class="cell"><div class="tx s2">TAE</div><div class="v">${l.tae ? esc(l.tae) + '%' : '<span class="s2">sin dato</span>'}</div></div>
    </div>
    ${dead ? '' : `<div class="btns mt"><button class="btn" style="--c:var(--orange)" data-act="attack" data-id="${l.id}">${sym('flame')}Atacar</button><button class="btn" style="--c:var(--yellow)" data-act="precancel" data-id="${l.id}">${sym('bolt')}Precancelar</button></div>`}
    ${fondoCard(l)}
    <div class="gh">Cronograma · tocá una cuota para corregirla</div>
    <div class="group">${l.cuotas.map(c => `<button class="cell" ${c.paid ? 'disabled' : `data-act="editCuota" data-id="${l.id}" data-n="${c.n}"`}><div class="tx"><div class="t" style="${c.paid ? 'color:var(--label2);text-decoration:line-through' : ''}">Cuota ${c.n}</div><div class="s">${dLabel(c.d)}${c.paid ? (c.pc ? ' · precancelada' : c.adel ? ' · adelantada' : ' · pagada') : ''}</div></div>
      <div class="v num" style="${c.paid ? 'color:var(--label2)' : ''}">${gs(c.paid ? c.o : c.a)}${!c.paid && c.a !== c.o ? `<small>era ${gsK(c.o)}</small>` : ''}</div></button>`).join('')}</div>
    <button class="btn w mt2" style="--c:var(--red)" data-act="delLoan" data-id="${l.id}">Eliminar deuda</button>
    <p class="gf center">Solo si la cargaste por error. Para pagarla usá Pagar, Atacar o Precancelar.</p>`);
}
// Plata que te quedó de este préstamo: dónde está y en qué la usaste
function fondoCard(l) {
  const g = l.guardado;
  if (!g || !g.amt) return `<div class="gh">Plata de este préstamo</div><div class="group ic">${cellLink('fondo', 'wallet', 'green', '¿Te quedó plata guardada de este préstamo?', 'Marcala y seguí en qué la usás', ` data-id="${l.id}"`)}</div>`;
  const used = fondoUsado(l), queda = fondoQueda(l), uses = loanUses(l);
  return `<div class="gh">Plata de este préstamo</div>
    <div class="card">
      <div class="g3">
        <div class="kv"><div class="k">Guardaste</div><div class="n">${gsK(g.amt)}</div></div>
        <div class="kv"><div class="k">Usaste</div><div class="n">${gsK(used)}</div></div>
        <div class="kv"><div class="k">Queda</div><div class="n pos">${gsK(queda)}</div></div>
      </div>
      <div class="mt">${bar(g.amt ? used / g.amt * 100 : 0, '', `var(--${l.color})`)}</div>
      <p class="gf" style="margin:8px 0 0">${g.cuenta ? 'Está en <b>' + esc(acctName(g.cuenta)) + '</b>' : 'Sin cuenta asignada'}${g.d ? ' · desde el ' + dLabel(g.d) : ''}. Cuando pagues algo con esta plata, elegí <b>“Préstamo”</b> en “¿Con qué plata?”.</p>
      <button class="btn sm plain mt" data-act="fondo" data-id="${l.id}">Editar</button>
    </div>
    ${uses.length ? `<div class="gh">En qué la usaste</div><div class="group ic">${uses.map(movRow).join('')}</div>` : ''}`;
}
function fondoSheet(id) {
  const l = loan(id), g = l.guardado || {};
  openSheet(`${head('Plata del préstamo', `<button class="link b" data-act="saveFondo" data-id="${id}">Guardar</button>`, `<button class="link" data-act="loanDetail" data-id="${id}">Atrás</button>`)}
    <p class="gf" style="margin:0 4px 12px">${esc(debtName(l))}. Poné cuánto te quedó guardado de lo que te prestaron. Cada pago que hagas con esa plata se descuenta y queda registrado en qué la usaste.</p>
    <div class="group">${field('Monto guardado', money('fgA', g.amt || ''))}${field('Desde', `<input id="fgD" type="date" value="${esc(g.d || today())}">`)}</div>
    ${acctPicker('fgC', 'Está en la cuenta', g.cuenta || acctDefault())}
    ${g.amt ? `<button class="btn w mt2" style="--c:var(--red)" data-act="delFondo" data-id="${id}">Quitar</button>` : ''}
    <button class="btn p w mt2" data-act="saveFondo" data-id="${id}">Guardar</button>`);
}
function saveFondo(id) {
  const l = loan(id), amt = parseN($('#fgA').value); if (!amt) return toast('Ingresá el monto');
  l.guardado = { amt, d: $('#fgD').value || today(), cuenta: pickedAcct('fgC') };
  commit(); render(); loanDetail(id); toast('Plata del préstamo registrada');
}
function delFondo(id) { const l = loan(id); delete l.guardado; commit(); render(); loanDetail(id); toast('Quitado'); }
function movOrigSheet(id) {
  const m = M.find(x => x.id === id); if (!m) return;
  const ls = fondoLoans();
  openSheet(`${head('¿Con qué plata?', `<button class="link b" data-act="saveMovOrig" data-id="${id}">Guardar</button>`, `<button class="link" data-act="movDetail" data-id="${id}">Atrás</button>`)}
    <p class="gf" style="margin:0 4px 4px">${esc(movMeta(m).title)} · ${gs(m.amt)}</p>
    <input type="hidden" id="moO" value="${esc(m.origen || '')}">
    <div class="chips mt"><button class="chip ${m.origen ? '' : 'on'}" data-act="pick" data-target="moO" data-v="" style="--c:var(--green)"><span class="chip-ic">${sym('wallet')}</span>Propia</button>
      ${ls.map(l => `<button class="chip ${m.origen === l.id ? 'on' : ''}" data-act="pick" data-target="moO" data-v="${l.id}" style="--c:var(--${l.color})"><span class="chip-ic">${sym('bank')}</span>Préstamo ${esc(entOf(l) || l.name)} · queda ${gsK(fondoQueda(l) + (m.origen === l.id ? m.amt : 0))}</button>`).join('')}</div>
    <button class="btn p w mt2" data-act="saveMovOrig" data-id="${id}">Guardar</button>`);
}
function saveMovOrig(id) {
  const m = M.find(x => x.id === id); if (!m) return;
  const v = pickedOrig('moO'); if (v) m.origen = v; else delete m.origen;
  commit({ add: [m] }); render(); movDetail(id); toast(v ? 'Pagado con plata del préstamo' : 'Pagado con plata propia');
}
function loanForm(id) {
  const l = id ? loan(id) : null, color = l ? l.color : ['red', 'orange', 'purple', 'pink', 'indigo', 'teal'][S.loans.length % 6];
  openSheet(`${head(l ? 'Editar deuda' : 'Nuevo préstamo', `<button class="link b" data-act="saveLoan" data-id="${id || ''}">Guardar</button>`, '<button class="link" data-act="close">Cancelar</button>')}
    <div class="group">
      ${field('Entidad', `<input id="lEnt" list="dlEnt" placeholder="Banco o financiera" autocomplete="off" value="${esc(l ? entOf(l) : '')}">`)}
      ${field('Nombre', `<input id="lName" placeholder="Ej: Préstamo de consumo" value="${esc(l ? l.name : '')}">`)}
      ${field('TAE %', `<input id="lTae" inputmode="decimal" placeholder="Opcional" value="${esc(l ? l.tae : '')}">`)}
      ${l ? '' : `${field('Cuota mensual', money('lCuota'))}
      ${field('Cuotas que faltan', '<input id="lN" inputmode="numeric" placeholder="Ej: 12">')}
      ${field('Nº próxima cuota', '<input id="lStart" inputmode="numeric" value="1">')}
      ${field('Vence la próxima', `<input id="lDate" type="date" value="${today()}">`)}`}
    </div>
    ${dlist('dlEnt', entOptions())}
    <div class="gh">Color</div>
    <div class="card" style="padding:14px">${colorPicker('lColor', color)}</div>
    <p class="gf">${l ? 'Para corregir montos o fechas, tocá cada cuota en el cronograma.' : 'La TAE la pedís al banco: con ella, el orden de ataque usa el método avalancha (el más barato).'}</p>`);
}
function genSchedule(first, n, startN, amt) {
  const [y, m, d] = first.split('-').map(Number), out = [];
  for (let i = 0; i < n; i++) { const k = addMonth(y + '-' + pad(m), i); out.push({ n: startN + i, d: k + '-' + pad(Math.min(d, lastDay(k))), a: amt, o: amt, paid: false, pd: null }); }
  return out;
}
function saveLoan(id) {
  const name = $('#lName').value.trim(); if (!name) return toast('Poné un nombre');
  const tae = $('#lTae').value.trim(), color = $('#lColor').value, entidad = $('#lEnt').value.trim();
  if (id) Object.assign(loan(id), { name, tae, color, entidad });
  else {
    const amt = parseN($('#lCuota').value), n = parseN($('#lN').value), start = parseN($('#lStart').value) || 1, date = $('#lDate').value;
    if (!amt || !n || !date) return toast('Completá cuota, cantidad y fecha');
    const l = { id: uid(), name, entidad, tae, color, cuota: amt, cuotas: genSchedule(date, Math.min(n, 120), start, amt) };
    S.loans.push(l); S.initialTotal += loanSaldo(l); S.baseCuotas += amt; addXP(10);
  }
  commit(); closeSheet(); render(); toast(id ? 'Deuda actualizada' : 'Nuevo jefe: ' + name);
}
function delLoan(id) {
  const l = loan(id), s = loanSaldo(l);
  if (s > 0) { S.initialTotal = Math.max(0, S.initialTotal - s); S.baseCuotas = Math.max(0, S.baseCuotas - l.cuota); }
  S.loans = S.loans.filter(x => x.id !== id); commit(); closeSheet(); render(); toast('Deuda eliminada');
}
function cuotaSheet(id, n) {
  const l = loan(id), c = l.cuotas.find(x => x.n === n);
  openSheet(`${head('Cuota ' + n, `<button class="link b" data-act="saveCuota" data-id="${id}" data-n="${n}">Guardar</button>`, `<button class="link" data-act="loanDetail" data-id="${id}">Atrás</button>`)}
    <div class="group">${field('Monto', money('cA', c.a))}${field('Vence', `<input id="cD" type="date" value="${c.d}">`)}</div>
    <p class="gf">Copiá el monto exacto del cronograma del banco.</p>`);
}
function saveCuota(id, n) {
  const l = loan(id), c = l.cuotas.find(x => x.n === n), a = parseN($('#cA').value), d = $('#cD').value;
  if (!a || !d) return toast('Completá monto y fecha');
  const before = loanSaldo(l);
  if (c.a === c.o) c.o = a;
  c.a = a; c.d = d; l.cuotas.sort((x, y) => x.d.localeCompare(y.d) || x.n - y.n);
  S.initialTotal = Math.max(0, S.initialTotal + loanSaldo(l) - before);
  commit(); loanDetail(id); render(); toast('Cuota actualizada');
}
function addDebtChooser() {
  openSheet(`${head('Agregar deuda')}
    <div class="group ic">
      ${cellLink('newLoan', 'bank', 'red', 'Préstamo', 'Con cuotas fijas: consumo, personal, auto…')}
      ${cellLink('newCard', 'creditcard', 'indigo', 'Tarjeta de crédito', 'Saldo, extracto y vencimiento')}
    </div>`);
}
function cardForm(id) {
  const c = id ? card(id) : null;
  openSheet(`${head(c ? 'Actualizar tarjeta' : 'Nueva tarjeta', `<button class="link b" data-act="saveCard" data-id="${id || ''}">Guardar</button>`, '<button class="link" data-act="close">Cancelar</button>')}
    <p class="gf" style="margin:0 4px 10px">Copiá los datos de la app del banco.</p>
    <div class="group">
      ${field('Banco emisor', `<input id="cEnt" list="dlEnt" placeholder="Ej: Banco…" autocomplete="off" value="${esc(c ? entOf(c) : '')}">`)}
      ${field('Nombre', `<input id="cN" placeholder="Ej: Mastercard" value="${esc(c ? c.name : '')}">`)}
      ${field('Deuda total actual', money('cS', c ? c.saldo : ''))}
      ${field('Línea de crédito', money('cL', c ? c.linea : ''))}
      ${field('TAN %', `<input id="cT" inputmode="decimal" placeholder="Ej: 17,85" value="${esc(c ? c.tan : '')}">`)}
    </div>
    <div class="gh">Último extracto</div>
    <div class="group">
      ${field('Total a pagar', money('cE', c ? c.extracto : ''))}
      ${field('Pago mínimo', money('cM', c ? c.minimo : ''))}
      ${field('Vencimiento', `<input id="cV" type="date" value="${esc(c ? c.vence : '')}">`)}
    </div>
    ${dlist('dlEnt', entOptions())}
    ${c ? `<button class="btn w mt2" style="--c:var(--red)" data-act="delCard" data-id="${c.id}">Eliminar tarjeta</button>` : ''}`);
}
function saveCard(id) {
  const v = { name: $('#cN').value.trim() || 'Tarjeta', entidad: $('#cEnt').value.trim(), saldo: parseN($('#cS').value), linea: parseN($('#cL').value), tan: $('#cT').value.trim(), extracto: parseN($('#cE').value), minimo: parseN($('#cM').value), vence: $('#cV').value };
  if (id) Object.assign(card(id), v);
  else { S.cards.push(Object.assign({ id: uid() }, v)); S.initialTotal += v.saldo; addXP(10); }
  commit(); closeSheet(); render(); toast(id ? 'Tarjeta actualizada' : 'Tarjeta agregada');
}
function delCard(id) { const c = card(id); S.initialTotal = Math.max(0, S.initialTotal - Math.max(0, c.saldo)); S.cards = S.cards.filter(x => x.id !== id); commit(); closeSheet(); render(); }
function payCardSheet(id) {
  const c = card(id);
  openSheet(`${head('Pagar tarjeta')}
    <div class="g2">${tile({ k: 'Extracto (total)', icon: 'creditcard', color: 'indigo', value: fmt(c.extracto) })}${tile({ k: 'Mínimo', icon: 'minus', color: 'red', value: fmt(c.minimo) })}</div>
    <div class="group mt">${field('Monto pagado', money('sAmt', c.extracto || c.saldo))}</div>
    ${acctPicker('sCta')}${origPicker('sOrig')}
    <button class="btn p w mt2" data-act="doPayCard" data-id="${c.id}">Confirmar pago</button>`);
}
function doPayCard(id) {
  const c = card(id), amt = parseN($('#sAmt').value); if (!amt) return toast('Ingresá un monto');
  const m = { id: uid(), ts: Date.now(), date: today(), amt, t: 'pagotc', card: c.id, note: c.name, prevSaldo: c.saldo, prevExtracto: c.extracto, cuenta: pickedAcct('sCta'), origen: pickedOrig('sOrig') };
  c.saldo = Math.max(0, c.saldo - amt); SIM = null;
  const full = amt >= c.extracto; M.push(m); addXP(full ? 40 : 10); checkin();
  if (full) { c.extracto = 0; unlock('tc'); toast('Extracto pagado completo'); } else toast('Pagaste menos que el total: habrá intereses sobre ' + gs(c.extracto - amt));
  checkAch(); commit({ add: [m] }); closeSheet(); render();
}

/* =========================================================================
   Gastos fijos y plan del día de cobro
   ========================================================================= */
const FIJO_SUG = [
  { name: 'Alquiler', cat: 'alquiler', prio: 1, sym: 'house', color: 'blue' },
  { name: 'Contadora', amb: 'negocio', prio: 1, sym: 'receipt', color: 'indigo', iva: '10' },
  { name: 'ANDE (luz)', cat: 'servicios', prio: 1, sym: 'bolt', color: 'yellow' },
  { name: 'Internet', cat: 'servicios', prio: 2, sym: 'wifi', color: 'cyan' },
  { name: 'Plan de celular', cat: 'servicios', prio: 2, sym: 'phone', color: 'teal' },
  { name: 'Agua', cat: 'servicios', prio: 2, sym: 'leaf', color: 'mint' },
  { name: 'Combustible', cat: 'combustible', prio: 2, sym: 'car', color: 'purple' }
];
function fijoRow(f) {
  const k = fijoCycle(f), paid = fijoPaid(f, k), due = dueInCycle(k, f.dia), dd = daysBetween(today(), due);
  const when = paid ? 'Pagado el ' + dLabel(paid.date) : dd < 0 ? 'Vencido hace ' + (-dd) + (dd === -1 ? ' día' : ' días') : dd === 0 ? 'Vence hoy' : 'Vence el ' + dLabel(due) + (dd <= 5 ? ' · en ' + dd + (dd === 1 ? ' día' : ' días') : '');
  return `<button class="cell" data-act="fijo" data-id="${f.id}">${icoBox(paid ? 'check' : f.sym || 'pin', paid ? 'green' : f.color || 'blue')}<div class="tx"><div class="t">${esc(f.name)}</div>
    <div class="s">${PRIO_L[f.prio || 2]} · ${when}</div></div>
    <div class="v">${paid ? `<span class="pill" style="--c:var(--green)">${sym('check')}Pagado</span>` : `<span class="num">${gsK(f.amt)}</span><small style="color:var(--${dd < 0 ? 'red' : dd <= 5 ? 'orange' : 'label2'})">a pagar</small>`}</div>${CHEV}</button>`;
}
function fijosSection() {
  const w = payWindow(), fs = fijosSorted(), paid = fs.filter(f => fijoPaid(f)), tot = sum(fs, f => f.amt), pp = sum(paid, f => fijoPaid(f).amt);
  return sh('Gastos fijos', '<button class="link" data-act="newFijo">Agregar</button>') +
    (fs.length ? `<div class="card" style="padding:14px 16px">
        <div class="row between"><b>${paid.length} de ${fs.length} pagados</b><span class="num s2">${gsK(pp)} de ${gsK(tot)}</span></div>
        <div class="mt">${bar(tot ? pp / tot * 100 : 0, '', 'var(--green)')}</div>
        <small style="display:block;margin-top:6px">Ciclo del cobro del ${dLabel(w.pay)} al ${dLabel(dStr(new Date(new Date(w.next + 'T12:00') - 864e5)))}</small></div>
      <div class="group ic mt">${fs.map(fijoRow).join('')}</div>
      <p class="gf">Se pagan primero, el día que cobrás: alquiler, contadora y ANDE adelante de todo.</p>`
    : `<div class="group ic">${cellLink('newFijo', 'pin', 'blue', 'Cargá tus gastos fijos', 'Alquiler, contadora, ANDE, internet, celular…')}</div>`);
}
function fijoForm(id, sugI) {
  const f = id ? fijo(id) : Object.assign({ name: '', amt: 0, dia: 5, prio: 1, amb: 'personal', cat: 'servicios', sym: 'pin', color: 'blue', iva: '10' }, sugI != null ? FIJO_SUG[sugI] : {});
  const amb = f.amb || 'personal', cats = S.budget.filter(b => b.id !== 'cuotas');
  openSheet(`${head(id ? 'Editar gasto fijo' : 'Nuevo gasto fijo', `<button class="link b" data-act="saveFijo" data-id="${id || ''}">Guardar</button>`, '<button class="link" data-act="close">Cancelar</button>')}
    ${id ? '' : `<div class="chips" style="margin-bottom:14px">${FIJO_SUG.map((s, i) => `<button class="chip ${sugI === i ? 'on' : ''}" data-act="fijoSug" data-i="${i}" style="--c:var(--${s.color})"><span class="chip-ic">${sym(s.sym)}</span>${esc(s.name)}</button>`).join('')}</div>`}
    <div class="group">
      ${field('Nombre', `<input id="fjN" placeholder="Ej: Alquiler" value="${esc(f.name)}">`)}
      ${field('Monto mensual', money('fjA', f.amt || ''))}
      ${field('Vence el día', `<input id="fjD" inputmode="numeric" placeholder="1–31" value="${f.dia || ''}">`)}
    </div>
    <div class="gh">Prioridad</div><input type="hidden" id="fjP" value="${f.prio || 1}">
    <div class="seg">${[[1, '1 · Primero'], [2, '2 · Importante'], [3, '3 · Puede esperar']].map(([v, l]) => `<button class="${+(f.prio || 1) === v ? 'on' : ''}" data-act="pick" data-target="fjP" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="gh">Tipo</div><input type="hidden" id="fjM" value="${amb}">
    <div class="seg">${[['personal', 'Personal'], ['negocio', 'Del negocio (con factura)']].map(([v, l]) => `<button class="${amb === v ? 'on' : ''}" data-act="pick" data-target="fjM" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="group mt">${field('Sobre (si es personal)', `<select id="fjC">${cats.map(b => `<option value="${b.id}" ${b.id === f.cat ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select>`)}</div>
    ${acctPicker('fjCta', 'Se paga desde', f.cuenta || acctDefault())}
    <input type="hidden" id="fjS" value="${esc(f.sym || 'pin')}"><input type="hidden" id="fjK" value="${esc(f.color || 'blue')}"><input type="hidden" id="fjI" value="${esc(f.iva || '10')}">
    <p class="gf">Los del negocio (como la contadora) con factura a tu RUC suman IVA crédito.</p>
    ${id ? `<button class="btn w mt2" style="--c:var(--red)" data-act="delFijo" data-id="${id}">Eliminar gasto fijo</button>` : ''}`);
}
function saveFijo(id) {
  const name = $('#fjN').value.trim(), amt = parseN($('#fjA').value), dia = clamp(parseN($('#fjD').value) || 1, 1, 31);
  if (!name || !amt) return toast('Completá nombre y monto');
  const v = { name, amt, dia, prio: +$('#fjP').value || 2, amb: $('#fjM').value, cat: $('#fjC').value, cuenta: pickedAcct('fjCta'), sym: $('#fjS').value, color: $('#fjK').value, iva: $('#fjI').value };
  if (id) Object.assign(fijo(id), v); else { S.fijos.push(Object.assign({ id: uid(), desde: today() }, v)); addXP(5); }
  syncFijoSobres(); commit(); closeSheet(); render(); toast(id ? 'Gasto fijo actualizado' : name + ' agregado a tus gastos fijos');
}
function delFijo(id) { S.fijos = S.fijos.filter(f => f.id !== id); syncFijoSobres(); commit(); closeSheet(); render(); toast('Gasto fijo eliminado'); }
function fijoSheet(id) {
  const f = fijo(id); if (!f) return;
  const k = fijoCycle(f), paid = fijoPaid(f, k), due = dueInCycle(k, f.dia), hist = M.filter(m => m.t === 'gasto' && m.fijo === id).sort(byDateDesc).slice(0, 6);
  openSheet(`${head(esc(f.name), `<button class="link" data-act="editFijo" data-id="${id}">Editar</button>`)}
    <div class="center" style="padding:4px 0 14px">${icoBox(paid ? 'check' : f.sym || 'pin', paid ? 'green' : f.color || 'blue', 'xl')}${big(fmt(f.amt) + '<span class="u">Gs</span>')}<small>${PRIO_L[f.prio || 2]} · vence el ${f.dia} de cada mes${f.amb === 'negocio' ? ' · del negocio' : ''}</small></div>
    ${paid ? `<div class="note">Ya está pagado el que vence el ${dLabel(due)}: <b>${gs(paid.amt)}</b> el ${dLabel(paid.date)}${paid.cuenta ? ' desde ' + esc(acctName(paid.cuenta)) : ''}.</div>`
      : `<button class="btn p w" style="--c:var(--green)" data-act="fijoPay" data-id="${id}">${sym('check')}Pagar el que vence el ${dLabel(due)}</button>`}
    ${hist.length ? `<div class="gh">Últimos pagos</div><div class="group ic">${hist.map(movRow).join('')}</div>` : ''}`);
}
function fijoPaySheet(id) {
  const f = fijo(id); if (!f) return;
  openSheet(`${head('Pagar ' + esc(f.name), `<button class="link b" data-act="doFijoPay" data-id="${id}">Guardar</button>`, `<button class="link" data-act="fijo" data-id="${id}">Atrás</button>`)}
    <div class="group">${field('Monto pagado', money('fpA', f.amt))}${field('Fecha', `<input id="fpD" type="date" value="${today()}">`)}</div>
    ${acctPicker('fpCta', 'Pagado desde', f.cuenta && acct(f.cuenta) ? f.cuenta : acctDefault())}${origPicker('fpOrig')}
    <button class="btn p w mt2" style="--c:var(--green)" data-act="doFijoPay" data-id="${id}">Confirmar pago</button>`);
}
function doFijoPay(id) {
  const f = fijo(id), amt = parseN($('#fpA').value); if (!amt) return toast('Ingresá el monto');
  const neg = f.amb === 'negocio', iva = neg ? f.iva || '10' : 'none';
  const m = { id: uid(), ts: Date.now(), date: $('#fpD').value || today(), amt, t: 'gasto', ambito: neg ? 'negocio' : 'personal', medio: 'debito', cat: neg ? 'negocio' : f.cat,
    iva, ivaAmt: ivaOf(amt, iva), cuenta: pickedAcct('fpCta'), origen: pickedOrig('fpOrig'), fijo: id, ciclo: fijoCycle(f), note: f.name };
  applyMov(m); M.push(m); addXP(10); checkin(); haptic(12); checkAch(); commit({ add: [m] }); closeSheet(); render();
  toast(f.name + ' pagado · ' + gs(amt));
}
// Plan del día de cobro: qué pagar y en qué orden con lo que cobrás
function cobroItems() {
  const w = payWindow(), items = [];
  S.fijos.forEach(f => {
    const k = fijoCycle(f), due = dueInCycle(k, f.dia);
    if (!fijoPaid(f, k) && due < w.next) items.push({ prio: f.prio || 2, d: due, t: f.name, s: 'Gasto fijo · vence el ' + dLabel(due), a: f.amt, act: 'fijoPay', id: f.id, icon: f.sym || 'pin', color: f.color || 'blue' });
  });
  S.loans.forEach(l => l.cuotas.forEach(c => {
    if (c.paid || c.d >= w.next) return;
    const agui = S.settings.lumpTarget === l.id && !S.settings.lumpRecibido && S.settings.lumpMes && ym(c.d) >= S.settings.lumpMes;
    if (!agui) items.push({ prio: 1, d: c.d, t: l.name, s: (entOf(l) ? esc(entOf(l)) + ' · ' : '') + 'Cuota ' + c.n + ' · vence ' + dLabel(c.d), a: c.a, act: 'payCuota', id: l.id, icon: 'bank', color: l.color });
  }));
  S.cards.forEach(c => { if (c.extracto > 0 && c.vence && c.vence < w.next) items.push({ prio: 1, d: c.vence, t: c.name, s: (entOf(c) ? esc(entOf(c)) + ' · ' : '') + 'Total del extracto · vence ' + dLabel(c.vence), a: c.extracto, act: 'payCard', id: c.id, icon: 'creditcard', color: 'indigo', card: true }); });
  pendPayables().forEach(p => { if (p.venc && p.venc < w.next && !p.venta) items.push({ prio: 2, d: p.venc, t: p.prov, s: 'Proveedor · vence ' + dLabel(p.venc), a: payPend(p), act: 'payable', id: p.id, icon: 'box', color: 'indigo' }); });
  items.sort((a, b) => a.prio - b.prio || a.d.localeCompare(b.d));
  // Para vivir: los sobres variables del mes (los que no están cubiertos por un gasto fijo)
  const covered = new Set(S.fijos.filter(f => f.amb !== 'negocio').map(f => f.cat));
  const vivir = S.budget.filter(b => !b.fijo && !covered.has(b.id) && b.amt > 0);
  return { w, items, vivir };
}
function cobroList(ingreso, useCofre) {
  const { items, vivir } = cobroItems();
  let left = ingreso + (useCofre ? Math.max(0, S.funds.cofre) : 0);
  const row = (x, n) => { left -= x.a; return `<div class="cell cobro">${icoBox(x.icon, x.color)}<div class="tx"><div class="t"><span class="nb2">${n}</span>${esc(x.t)}</div><div class="s">${x.s}</div>
      <div class="s ${left < 0 ? 'neg' : ''}">queda ${left < 0 ? '−' : ''}${gs(Math.abs(left))}</div></div>
    <div class="v"><span class="num">${gsK(x.a)}</span><button class="btn sm" style="--c:var(--green);margin-top:4px;padding:5px 10px" data-act="cobroPay" data-k="${x.act}" data-id="${x.id}">Pagar</button></div></div>`; };
  const tiers = [[1, 'Primero: no se negocia'], [2, 'Después'], [3, 'Si alcanza']];
  let n = 0, html = '';
  tiers.forEach(([p, l]) => { const xs = items.filter(x => x.prio === p); if (xs.length) html += `<div class="gh">${l}</div><div class="group ic">${xs.map(x => row(x, ++n)).join('')}</div>`; });
  const viv = sum(vivir, b => b.amt);
  if (viv) { left -= viv; html += `<div class="gh">Para vivir el mes</div><div class="group ic"><div class="cell cobro">${icoBox('cart', 'green')}<div class="tx"><div class="t"><span class="nb2">${++n}</span>Sobres del mes</div><div class="s">${vivir.map(b => esc(b.name.split(' ')[0]) + ' ' + gsK(b.amt)).join(' · ')}</div><div class="s ${left < 0 ? 'neg' : ''}">queda ${left < 0 ? '−' : ''}${gs(Math.abs(left))}</div></div><div class="v num">${gsK(viv)}</div></div></div>`; }
  html += left >= 0
    ? `<div class="note mt"><b>Te sobran ${gs(left)}</b>: van al cofre para atacar a ${esc((attackOrder().list[0] || {}).name || 'la deuda')}. No los dejes sueltos en la cuenta.</div>`
    : `<div class="note mt" style="background:color-mix(in srgb,var(--red) 12%,transparent)"><b style="color:var(--red)">Faltan ${gs(-left)}.</b> ${useCofre ? 'Recortá sobres variables (comida afuera, pádel) o esperá las horas extra.' : 'Activá “Usar el cofre” o esperá las horas extra; si no, recortá sobres variables.'}</div>`;
  return html;
}
function cobroSheet() {
  RETURN_TO = 'cobro';
  const { w } = cobroItems(), st = S.settings, inc = lsGet('libre-cobro-amt');
  const lt = st.lumpTarget && loan(st.lumpTarget);
  openSheet(`${head('Plan del día de cobro')}
    <p class="gf" style="margin:0 4px 12px">${w.pay < today() ? 'Cobraste' : 'Cobrás'} el <b>${dLabel(w.pay)}</b>. Esto es lo que tenés que pagar antes del próximo cobro (${dLabel(w.next)}), en orden.</p>
    <div class="group">${field('Lo que cobrás', money('cpA', inc ? +inc : st.base))}
      <label class="cell"><div class="tx"><div class="t">Usar el cofre</div><div class="s">${gs(S.funds.cofre)} de tus ventas</div></div><input type="checkbox" class="sw" id="cpC" data-change="cobroLive"></label></div>
    <div id="cpList">${cobroList(inc ? +inc : st.base, false)}</div>
    ${lt ? `<div class="note mt">${sym('gift')} <b>Aguinaldo${st.lumpMes ? ' (' + ymLabel(st.lumpMes) + ')' : ''}:</b> precancelás <b>${esc(debtName(lt))}</b> (${gs(loanSaldo(lt))} en cuotas; pedí el saldo de precancelación, suele ser menor). Sus cuotas desde ${ymLabel(st.lumpMes)} las cubre el aguinaldo.</div>` : ''}
    <p class="gf">Tocá <b>Pagar</b> en cada línea a medida que pagás: queda registrado con la cuenta y se tacha del plan.</p>`);
}
function cobroLive() {
  const v = parseN(($('#cpA') || {}).value), box = $('#cpList'); if (!box) return;
  lsSet('libre-cobro-amt', String(v)); box.innerHTML = cobroList(v, !!($('#cpC') || {}).checked);
}
let RETURN_TO = null;

/* =========================================================================
   Hojas: entidades (a quién le debés)
   ========================================================================= */
function entFillSheet() {
  const items = S.loans.filter(l => loanSaldo(l) > 0).map(l => ({ k: 'l:' + l.id, name: l.name, sub: gsK(loanSaldo(l)) + ' · ' + l.cuotas.filter(c => !c.paid).length + ' cuotas', ent: entOf(l) }))
    .concat(S.cards.map(c => ({ k: 'c:' + c.id, name: c.name, sub: 'Tarjeta · ' + gsK(c.saldo), ent: entOf(c) })));
  openSheet(`${head('¿A quién le debés?', '<button class="link b" data-act="saveEntFill">Guardar</button>', '<button class="link" data-act="close">Cancelar</button>')}
    <p class="gf" style="margin:0 4px 12px">Escribí el banco, financiera o persona de cada deuda. Si dos deudas son de la misma entidad, escribila igual y se agrupan.</p>
    <div class="group">${items.map(x => `<label class="cell fieldc entf"><span><span class="t">${esc(x.name)}</span><small>${x.sub}</small></span><input data-ent-id="${x.k}" list="dlEnt" placeholder="Entidad" autocomplete="off" value="${esc(x.ent)}"></label>`).join('')}</div>
    ${dlist('dlEnt', entOptions())}
    <button class="btn p w mt2" data-act="saveEntFill">Guardar</button>`);
}
function saveEntFill() {
  $$('#sheet [data-ent-id]').forEach(i => { const [k, id] = i.dataset.entId.split(':'); const o = k === 'l' ? loan(id) : card(id); if (o) o.entidad = i.value.trim(); });
  commit(); closeSheet(); render(); toast('Entidades guardadas');
}
function entSheet(name) {
  const e = entityRows().find(x => x.name === name); if (!e) return;
  if (!name) return entFillSheet();
  const cf = cardFreeMonth();
  openSheet(`${head(esc(name))}
    <div class="center" style="padding:4px 0 14px">${icoBox(e.saldo > 0 ? (e.loans.length ? 'bank' : 'creditcard') : 'check', e.saldo > 0 ? (e.loans.length ? e.color : 'indigo') : 'green', 'xl')}${big(fmt(e.saldo) + '<span class="u">Gs</span>')}<small>${e.saldo > 0 ? 'le debés' + (e.free ? ' · te liberás en ' + ymLabel(e.free) : '') : 'Ya no le debés nada'}</small></div>
    ${e.pct != null ? bar(e.pct, 'lg', 'var(--green)') + `<p class="gf center">${e.pct.toFixed(0)}% pagado de sus préstamos</p>` : ''}
    <div class="gh">Deudas</div>
    <div class="group ic">${e.loans.map(l => { const s = loanSaldo(l); return `<button class="cell" data-act="loanDetail" data-id="${l.id}">${icoBox(s > 0 ? 'bank' : 'check', s > 0 ? l.color : 'gray')}<div class="tx"><div class="t">${esc(l.name)}</div><div class="s">${s > 0 ? l.cuotas.filter(c => !c.paid).length + ' cuotas · cae en ' + ymLabel(loanFreeMonth(l.id)) : 'Pagado'}</div></div><div class="v num">${gsK(s)}</div>${CHEV}</button>`; }).join('')}
      ${e.cards.map(c => `<button class="cell" data-act="editCard" data-id="${c.id}">${icoBox('creditcard', 'indigo')}<div class="tx"><div class="t">${esc(c.name)}</div><div class="s">Tarjeta${c.saldo > 0 && cf ? ' · saldada en ' + ymLabel(cf) : ''}</div></div><div class="v num">${gsK(c.saldo)}</div>${CHEV}</button>`).join('')}</div>
    <div class="gh">Nombre de la entidad</div>
    <div class="group">${field('Nombre', `<input id="entName" list="dlEnt" autocomplete="off" value="${esc(name)}">`)}</div>${dlist('dlEnt', entOptions())}
    <button class="btn w mt" data-act="renameEnt" data-ent="${esc(name)}">Renombrar en todas sus deudas</button>`);
}
function renameEnt(old) {
  const nu = $('#entName').value.trim(); if (!nu || nu === old) return closeSheet();
  S.loans.concat(S.cards).forEach(x => { if (entOf(x) === old) x.entidad = nu; });
  commit(); closeSheet(); render(); toast('Entidad renombrada');
}

/* =========================================================================
   Hojas: proveedores (compras a crédito) y el match con las ventas
   ========================================================================= */
const ventaName = m => 'Venta' + (m.cliente ? ' · ' + m.cliente : '') + ' (' + gsK(m.amt) + ')';
function provSheet(prov) {
  const ps = S.payables.filter(p => p.prov === prov).sort((a, b) => payPend(b) - payPend(a) || (b.date || '').localeCompare(a.date || ''));
  if (!ps.length) return;
  const pend = sum(ps, payPend);
  openSheet(`${head(esc(prov))}
    <div class="center" style="padding:4px 0 14px">${icoBox(pend > 0 ? 'box' : 'check', pend > 0 ? 'indigo' : 'green', 'xl')}${big(fmt(pend) + '<span class="u">Gs</span>')}<small>${pend > 0 ? 'a pagar' : 'Al día: todas sus compras están pagadas'}</small></div>
    <div class="group ic">${ps.map(payRow).join('')}</div>
    <button class="btn w mt2" data-act="newPayable" data-prov="${esc(prov)}">${sym('plus')}Nueva compra a crédito</button>`);
}
function payableSheet(id) {
  const p = payable(id); if (!p) return closeSheet();
  const pend = payPend(p), v = p.venta && M.find(m => m.id === p.venta);
  const rows = [['Qué compraste', esc(p.desc || '—')], ['Fecha de compra', dLabel(p.date)], ['Monto', gs(p.amt)]];
  if (ivaOf(p.amt, p.iva)) rows.push(['IVA ' + p.iva + '% (crédito fiscal)', gs(ivaOf(p.amt, p.iva))]);
  if (p.venc) rows.push(['Vence', dLabel(p.venc)]);
  if (v) rows.push(['Venta vinculada', `<button class="link" data-act="movDetail" data-id="${v.id}">${esc(ventaName(v))}</button>`]);
  const SRC = { venta: 'con la plata de una venta', caja: 'desde la caja del negocio', personal: 'de tu bolsillo' };
  const pagos = p.pagos.map(x => {
    const vm = x.venta && M.find(m => m.id === x.venta), pm = x.mov && M.find(m => m.id === x.mov);
    return `<div class="cell">${icoBox(x.venta ? 'link' : 'check', 'green')}<div class="tx"><div class="t">${x.venta ? 'Match con ' + esc(vm ? ventaName(vm) : 'la venta') : 'Pago ' + (SRC[(pm || {}).src] || '')}</div><div class="s">${dLabel(x.d)} · <span class="num">${gs(x.amt)}</span></div></div>
      <button class="link" style="flex:none;font-size:15px" data-act="undoPago" data-id="${p.id}" data-pid="${x.id}">Deshacer</button></div>`;
  }).join('');
  openSheet(`${head(esc(p.prov), `<button class="link" data-act="editPayable" data-id="${p.id}">Editar</button>`)}
    <div class="center" style="padding:4px 0 14px">${icoBox(pend > 0 ? 'box' : 'check', pend > 0 ? 'indigo' : 'green', 'xl')}${big(fmt(pend) + '<span class="u">Gs</span>')}<small>${pend > 0 ? 'a pagar al proveedor' : 'Pagado · deuda cancelada'}</small></div>
    <div class="group">${rows.map(r => `<div class="cell"><div class="tx s2">${r[0]}</div><div class="v">${r[1]}</div></div>`).join('')}</div>
    ${p.pagos.length ? `<div class="gh">Pagos y match</div><div class="group ic">${pagos}</div>` : ''}
    ${pend > 0 ? `<div class="btns mt2">${v ? '' : `<button class="btn" style="--c:var(--indigo)" data-act="sellPayable" data-id="${p.id}">${sym('bag')}Cobrar con una venta</button>`}<button class="btn p" style="--c:var(--green)" data-act="payProv" data-id="${p.id}">${v ? 'Ya le pagué' : 'Registrar pago'}</button></div>
      <p class="gf">${v ? 'La plata para pagarle salió de la venta vinculada.' : '<b>Cobrar con una venta:</b> registrás la venta y la deuda se cancela con ella (match).'}</p>` : ''}
    ${p.pagos.length ? '' : `<button class="btn w mt2" style="--c:var(--red)" data-act="delPayable" data-id="${p.id}">Eliminar compra</button>`}`);
}
function payableForm(id, prov = '') {
  const p = id ? payable(id) : null, iva = p ? p.iva || 'none' : '10';
  openSheet(`${head(p ? 'Editar compra' : 'Compra a crédito', `<button class="link b" data-act="savePayable" data-id="${id || ''}">Guardar</button>`, '<button class="link" data-act="close">Cancelar</button>')}
    <p class="gf" style="margin:0 4px 10px">Mercadería que un proveedor te dio para pagar después. Se cancela con la venta (match) o con un pago.</p>
    <div class="group">
      ${field('Proveedor', `<input id="pfP" list="dlProv" placeholder="Ej: Distribuidora S.A" autocomplete="off" value="${esc(p ? p.prov : prov)}">`)}
      ${field('Qué compraste', `<input id="pfD" placeholder="Ej: Switch" value="${esc(p ? p.desc : '')}">`)}
      ${field('Monto', money('pfA', p ? p.amt : ''))}
      ${field('Fecha', `<input id="pfF" type="date" value="${esc(p ? p.date : today())}">`)}
      ${field('Vence (opcional)', `<input id="pfV" type="date" value="${esc(p ? p.venc || '' : '')}">`)}
    </div>${dlist('dlProv', knownProvs())}
    <div class="gh">IVA de la compra</div><input type="hidden" id="pfI" value="${iva}">
    <div class="seg">${[['10', '10%'], ['5', '5%'], ['ex', 'Exento'], ['none', 'Sin factura']].map(([v, l]) => `<button class="${v === iva ? 'on' : ''}" data-act="pick" data-target="pfI" data-v="${v}">${l}</button>`).join('')}</div>
    <p class="gf">El IVA de la compra se descuenta del IVA de la venta cuando hacés el match.</p>`);
}
function savePayable(id) {
  const v = { prov: $('#pfP').value.trim(), desc: $('#pfD').value.trim(), amt: parseN($('#pfA').value), date: $('#pfF').value || today(), venc: $('#pfV').value, iva: $('#pfI').value };
  if (!v.prov || !v.amt) return toast('Completá proveedor y monto');
  if (id) Object.assign(payable(id), v); else { S.payables.push(Object.assign({ id: uid(), venta: null, pagos: [] }, v)); addXP(5); }
  commit(); render(); if (id) payableSheet(id); else closeSheet();
  toast(id ? 'Compra actualizada' : 'Deuda con ' + v.prov + ' registrada');
}
function delPayable(id) {
  const p = payable(id); if (!p) return;
  if (p.pagos.length) return toast('Primero deshacé los pagos');
  const linked = M.filter(m => m.payable === id);
  linked.forEach(m => { ['payable', 'prov', 'provPaid', 'payNew', 'payAmt'].forEach(k => delete m[k]); });
  S.payables = S.payables.filter(x => x.id !== id);
  commit({ add: linked }); closeSheet(); render(); toast('Compra eliminada');
}
function payProvSheet(id) {
  const p = payable(id), src = p.venta ? 'venta' : 'caja';
  openSheet(`${head('Pagar a ' + esc(p.prov), `<button class="link b" data-act="doPayProv" data-id="${id}">Guardar</button>`, `<button class="link" data-act="payable" data-id="${id}">Atrás</button>`)}
    <div class="group">${field('Monto pagado', money('ppA', payPend(p)))}${field('Fecha', `<input id="ppD" type="date" value="${today()}">`)}</div>
    <div class="gh">¿De dónde sale la plata?</div>
    <input type="hidden" id="ppS" value="${src}">
    <div class="seg">${[['venta', 'De una venta'], ['caja', 'Caja del negocio'], ['personal', 'Mi bolsillo']].map(([v, l]) => `<button class="${v === src ? 'on' : ''}" data-act="pick" data-target="ppS" data-v="${v}">${l}</button>`).join('')}</div>
    <p class="gf"><b>De una venta:</b> la plata ya la separaste al cobrar (no toca ningún fondo). <b>Caja del negocio:</b> se descuenta de la caja. <b>Mi bolsillo:</b> sale de tu plata personal.</p>
    ${acctPicker('ppCta', 'Le pagaste desde la cuenta')}${origPicker('ppOrig')}`);
}
function doPayProv(id) {
  const p = payable(id), amt = Math.min(parseN($('#ppA').value), payPend(p)); if (!amt) return toast('Ingresá un monto');
  const m = { id: uid(), ts: Date.now(), date: $('#ppD').value || today(), amt, t: 'pagoprov', payable: p.id, prov: p.prov, src: $('#ppS').value, note: p.desc || '', cuenta: pickedAcct('ppCta'), origen: pickedOrig('ppOrig') };
  applyMov(m); M.push(m); addXP(15); checkin(); haptic(12); checkAch(); commit({ add: [m] });
  toast(payPend(p) <= 0 ? 'Deuda con ' + p.prov + ' cancelada' : 'Pago registrado · quedan ' + gs(payPend(p)));
  payableSheet(id); render();
}
function undoPago(pid, xid) {
  const p = payable(pid), x = p && p.pagos.find(y => y.id === xid); if (!x) return;
  if (x.mov) {
    const m = M.find(y => y.id === x.mov);
    if (m) { revertMov(m); M = M.filter(y => y.id !== m.id); commit({ del: [m.id] }); } else { p.pagos = p.pagos.filter(y => y !== x); commit(); }
  } else {
    const m = M.find(y => y.id === x.venta);
    p.pagos = p.pagos.filter(y => y !== x);
    if (m) { m.provPaid = false; commit({ add: [m] }); } else commit();
  }
  toast('Listo: la deuda con ' + p.prov + ' vuelve a estar pendiente');
  if (payable(pid)) payableSheet(pid); else closeSheet();
  render();
}
// Ventas cargadas antes de esta función: asignarles el proveedor y hacer el match
function assignProvSheet(id) {
  const m = M.find(x => x.id === id); if (!m) return;
  const pend = pendPayables();
  openSheet(`${head('Proveedor de la venta', `<button class="link b" data-act="doAssignProv" data-id="${id}">Guardar</button>`, `<button class="link" data-act="movDetail" data-id="${id}">Atrás</button>`)}
    <p class="gf" style="margin:0 4px 12px">${esc(ventaName(m))} · costo ${gs(m.costo)}. Queda registrado como deuda con el proveedor y se hace el match con esta venta.</p>
    <input type="hidden" id="apPay" value="new">
    ${pend.length ? `<div class="gh">Elegí una deuda pendiente…</div><div class="chips">${pend.map(p => `<button class="chip" data-act="pick" data-target="apPay" data-v="${p.id}" style="--c:var(--indigo)"><span class="chip-ic">${sym('box')}</span>${esc(p.prov)} · ${gsK(payPend(p))}</button>`).join('')}<button class="chip on" data-act="pick" data-target="apPay" data-v="new" style="--c:var(--gray)"><span class="chip-ic">${sym('plus')}</span>Nueva</button></div>
      <div class="gh">…o una nueva</div>` : ''}
    <div class="group">${field('Proveedor', `<input id="apProv" list="dlProv" placeholder="Ej: Distribuidora S.A" autocomplete="off">`)}${field('Qué compraste', `<input id="apD" placeholder="Ej: Switch" value="${esc(m.note || m.cliente || '')}">`)}</div>${dlist('dlProv', knownProvs())}
    <div class="gh">¿Ya le pagaste?</div><input type="hidden" id="apPaid" value="si">
    <div class="seg">${[['si', 'Sí, ya le pagué'], ['no', 'Le pago después']].map(([v, l]) => `<button class="${v === 'si' ? 'on' : ''}" data-act="pick" data-target="apPaid" data-v="${v}">${l}</button>`).join('')}</div>
    <button class="btn p w mt2" style="--c:var(--indigo)" data-act="doAssignProv" data-id="${id}">Hacer el match</button>`);
}
function doAssignProv(id) {
  const m = M.find(x => x.id === id); if (!m) return;
  const sel = $('#apPay').value; let p = sel !== 'new' ? payable(sel) : null, isNew = false;
  if (!p) {
    const name = $('#apProv').value.trim(); if (!name) return toast('Escribí el nombre del proveedor');
    p = { id: uid(), prov: name, desc: $('#apD').value.trim() || 'Compra', amt: m.costo, iva: m.ivaC || 'none', date: m.date, venc: '', venta: null, pagos: [] };
    S.payables.push(p); isNew = true;
  }
  Object.assign(m, { payable: p.id, prov: p.prov, payNew: isNew, provPaid: $('#apPaid').value === 'si', payAmt: isNew ? m.costo : Math.min(m.costo, payPend(p)) });
  linkPay(m); addXP(10); checkin(); commit({ add: [m] });
  toast(m.provPaid ? 'Match hecho: deuda con ' + p.prov + ' cancelada' : 'Deuda con ' + p.prov + ' pendiente, vinculada a la venta');
  payableSheet(p.id); render();
}

/* =========================================================================
   Hojas: cuentas (dónde está la plata), conciliación y cobros
   ========================================================================= */
function acctRow(a) {
  const unset = a.ini == null;
  return `<button class="cell" data-act="acct" data-id="${a.id}">${icoBox(acctIcon(a), a.color)}<div class="tx"><div class="t">${esc(a.name)}</div>
    <div class="s">${unset ? 'Tocá para cargar el saldo' : a.conc === today() ? 'Conciliado hoy' : a.conc ? 'Conciliado el ' + dLabel(a.conc) : 'Sin conciliar'}</div></div>
    <div class="v">${unset ? '<span class="pill" style="--c:var(--blue)">Cargar saldo</span>' : `<span class="num">${fmt(acctBal(a))}</span>`}</div>${CHEV}</button>`;
}
function acctSection() {
  const r = receivables(), pd = provDebt(), owed = sum(r, m => m.amt);
  if (!S.accounts.length) return sh('Tus cuentas') + `<div class="group ic">${cellLink('newAcct', 'bank', 'blue', 'Agregá tus cuentas', 'Bancos y efectivo: dónde está tu plata')}</div>`;
  const set = S.accounts.filter(a => a.ini != null), tot = sum(set, acctBal);
  return sh('Tus cuentas', '<button class="link" data-act="newAcct">Agregar</button>') +
    `<div class="group ic">${S.accounts.map(acctRow).join('')}
      <div class="cell"><div class="tx"><div class="t" style="font-weight:600">Total en cuentas</div>${set.length < S.accounts.length ? `<div class="s">Falta cargar el saldo de ${S.accounts.length - set.length}</div>` : ''}</div><div class="v num" style="font-weight:700">${gs(tot)}</div></div></div>
    ${owed || pd ? `<div class="g2 mt">
      ${tile({ k: 'Te deben', icon: 'clock', color: 'orange', value: fmt(owed), foot: r.length ? r.length + (r.length === 1 ? ' venta por cobrar' : ' ventas por cobrar') : 'nada pendiente', act: 'tab', id: '' }).replace('data-act="tab" data-id=""', 'data-act="tab" data-tab="negocio"')}
      ${tile({ k: 'Debés a proveedores', icon: 'box', color: 'indigo', value: fmt(pd), foot: pd ? 'se paga con tus ventas' : 'al día', act: 'tab', id: '' }).replace('data-act="tab" data-id=""', 'data-act="tab" data-tab="negocio"')}
    </div>` : ''}
    <p class="gf">Las cuentas dicen <b>dónde está</b> tu plata. El cofre, la caja y el sobre IVA dicen <b>para qué es</b>.</p>`;
}
function acctSheet(id) {
  const a = acct(id); if (!a) return closeSheet();
  if (a.ini == null) return concSheet(id);
  // Una línea por cada entrada o salida (una venta puede tener el cobro y el pago al proveedor)
  const rows = [];
  M.forEach(m => acctFlows(m).forEach(f => { if (f[0] === id) rows.push({ m, d: f[1], ts: f[2], dt: m.t === 'venta' ? m.cobD || m.date : m.date }); }));
  rows.sort((p, q) => q.dt.localeCompare(p.dt) || q.ts - p.ts || p.d - q.d);
  const after = rows.filter(r => r.ts > (a.iniTs || 0)), before = rows.filter(r => r.ts <= (a.iniTs || 0));
  const row = r => {
    const mm = movMeta(r.m), provOut = r.m.t === 'venta' && r.d < 0;
    const title = provOut ? 'Pago a ' + (r.m.prov || 'proveedor') : r.m.t === 'venta' ? 'Cobro' + (r.m.cliente ? ' · ' + r.m.cliente : ' de venta') : mm.title;
    const sub = provOut ? 'match con la venta' + (r.m.cliente ? ' a ' + esc(r.m.cliente) : '') : r.m.t === 'venta' ? 'venta del ' + dLabel(r.m.date) : esc(r.m.note || '');
    return `<button class="cell" data-act="movDetail" data-id="${r.m.id}">${icoBox(provOut ? 'box' : mm.icon, provOut ? 'indigo' : mm.color)}<div class="tx"><div class="t">${esc(title)}</div><div class="s">${dLabel(r.dt)}${sub ? ' · ' + sub : ''}</div></div>
      <div class="v num ${r.d > 0 ? 'pos' : ''}">${r.d > 0 ? '+' : '−'}${fmt(Math.abs(r.d))}</div></button>`;
  };
  const explained = a.iniTs === 0, lf = S.loans.filter(l => l.guardado && l.guardado.cuenta === id && fondoQueda(l) > 0);
  openSheet(`${head(esc(a.name), `<button class="link" data-act="editAcct" data-id="${id}">Editar</button>`)}
    <div class="center" style="padding:4px 0 14px">${icoBox(acctIcon(a), a.color, 'xl')}${big(fmt(acctBal(a)) + '<span class="u">Gs</span>')}<small>${a.conc ? 'conciliado con el banco el ' + dLabel(a.conc) : 'saldo según la app'}</small></div>
    <div class="btns"><button class="btn p" data-act="conc" data-id="${id}">${sym('check')}Conciliar</button><button class="btn" data-act="transf" data-id="${id}">${sym('arrows')}Transferir</button></div>
    ${acctBreakdown(a)}
    ${lf.length ? `<p class="gf">De este saldo, ${lf.map(l => '<b>' + gs(fondoQueda(l)) + '</b> es plata que queda del préstamo ' + esc(debtName(l))).join(' y ')}.</p>` : ''}
    <div class="gh">Entradas y salidas</div>
    <div class="group ic">${after.map(row).join('')}
      <div class="cell">${icoBox('calendar', 'gray')}<div class="tx"><div class="t">${explained ? 'Lo que ya tenías' : 'Saldo inicial'}</div><div class="s">${explained ? 'antes de estos movimientos' : 'Cargado el ' + dLabel(a.iniD)}</div></div><div class="v num">${fmt(a.ini)}</div></div></div>
    ${before.length ? `<div class="gh">Antes del saldo inicial (ya incluidos)</div><div class="group ic">${before.map(row).join('')}</div>
      <button class="btn w mt" style="--c:var(--indigo)" data-act="explainAcct" data-id="${id}">${sym('link')}Hacer el match: que expliquen el saldo</button>
      <p class="gf">El saldo no cambia: la app calcula cuánto tenías antes y suma estos movimientos, así ves de dónde salió cada guaraní.</p>` : ''}
    <p class="gf">Cada movimiento dice de dónde salió o a dónde entró la plata. <b>Conciliar</b> compara la app con el saldo real que te muestra el banco.</p>`);
}
// "De dónde salió esta plata": el saldo de la cuenta desarmado por tipo de movimiento
function acctBreakdown(a) {
  const cats = {}, add = (k, v) => { cats[k] = (cats[k] || 0) + v; };
  M.forEach(m => acctFlows(m).forEach(f => {
    if (f[0] !== a.id || f[2] <= (a.iniTs || 0)) return;
    const d = f[1];
    if (m.t === 'venta') add(d > 0 ? 'Cobros de ventas' : 'Pagos a proveedores', d);
    else if (m.t === 'pagoprov') add('Pagos a proveedores', d);
    else if (m.t === 'ingreso') add('Ingresos', d);
    else if (m.t === 'gasto') add('Gastos', d);
    else if (['cuota', 'ataque', 'precancel'].includes(m.t)) add('Cuotas y ataques', d);
    else if (m.t === 'pagotc') add('Pagos de tarjeta', d);
    else if (m.t === 'pagoiva') add('IVA', d);
    else if (m.t === 'transf') add(d > 0 ? 'Transferencias recibidas' : 'Transferencias enviadas', d);
    else add('Ajustes', d);
  }));
  const keys = Object.keys(cats); if (!keys.length) return '';
  const r = (t, v, cls = '') => `<div class="cell"><div class="tx ${cls}">${t}</div><div class="v num ${v > 0 && cls !== 'tot' ? 'pos' : ''}">${cls === 'tot' ? fmt(v) : (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v))}</div></div>`;
  return `<div class="gh">De dónde salió esta plata</div><div class="group">
    ${r(a.iniTs === 0 ? 'Lo que ya tenías' : 'Saldo inicial', a.ini || 0, 'tot')}
    ${keys.map(k => r(k, cats[k])).join('')}
    <div class="cell"><div class="tx" style="font-weight:600">Saldo</div><div class="v num" style="font-weight:700">${fmt(acctBal(a))}</div></div></div>`;
}
// Match: los movimientos que ya estaban incluidos en el saldo pasan a explicarlo (el saldo no cambia)
function explainAcct(id) {
  const a = acct(id), before = acctBefore(a); if (!before.length) return;
  const base = (a.ini || 0) - sum(before, x => x.d);
  a.iniTs = 0;
  if (base >= 0) a.ini = base;
  else {
    a.ini = 0;
    const m = { id: uid(), ts: Date.now(), date: today(), amt: -base, dir: -1, t: 'ajuste', cuenta: id, note: 'Salidas sin registrar' };
    M.push(m); commit({ add: [m] }); render(); acctSheet(id);
    return toast('Match hecho · faltan registrar ' + gs(-base) + ' de salidas');
  }
  commit(); render(); acctSheet(id); toast('Match hecho: ' + gs(base) + ' ya tenías antes de estos movimientos');
}
function concSheet(id) {
  const a = acct(id), first = a.ini == null, prev = first ? acctAll(id) : [], net = sum(prev, x => x.d);
  openSheet(`${head(first ? 'Saldo de ' + esc(a.name) : 'Conciliar ' + esc(a.name), `<button class="link b" data-act="doConc" data-id="${id}">Guardar</button>`, first ? '<button class="link" data-act="close">Cerrar</button>' : `<button class="link" data-act="acct" data-id="${id}">Atrás</button>`)}
    ${first ? '<p class="gf" style="margin:0 4px 12px">Copiá el saldo disponible que te muestra hoy la app del banco.</p>'
      : `<div class="group"><div class="cell"><div class="tx">Saldo en la app</div><div class="v num">${gs(acctBal(a))}</div></div></div>`}
    <div class="group mt">${field(first ? 'Saldo actual' : 'Saldo real en el banco', money('cnA', '', '0'))}</div>
    ${first && prev.length ? `<div class="gh">Ya registrados en esta cuenta</div>
      <div class="group">${prev.map(x => `<div class="cell"><div class="tx s2">${esc(x.m.t === 'venta' ? (x.d > 0 ? 'Cobro ' + (x.m.cliente || 'de venta') : 'Pago a ' + (x.m.prov || 'proveedor')) : movMeta(x.m).title)}</div><div class="v num ${x.d > 0 ? 'pos' : ''}">${x.d > 0 ? '+' : '−'}${fmt(Math.abs(x.d))}</div></div>`).join('')}</div>
      <input type="hidden" id="cnM" value="match">
      <div class="seg mt">${[['match', 'Que expliquen el saldo'], ['cero', 'Empezar de cero hoy']].map(([v, l]) => `<button class="${v === 'match' ? 'on' : ''}" data-act="pick" data-target="cnM" data-v="${v}">${l}</button>`).join('')}</div>
      <p class="gf" id="cnInfo" data-net="${net}">Con el match, la app calcula cuánto tenías antes de estos movimientos y te muestra de dónde salió el saldo.</p>` : ''}
    <p class="gf">${first ? 'Si está en cero, dejalo vacío.' : 'Si no coincide, fijate primero si te falta registrar algún gasto, cobro o transferencia. Si igual hay diferencia, se registra un ajuste y la app queda igual al banco.'}</p>
    <button class="btn p w mt2" data-act="doConc" data-id="${id}">${first ? 'Guardar saldo' : 'Conciliar'}</button>`);
}
// Vista previa del match al escribir el saldo
function concLive() {
  const info = $('#cnInfo'), inp = $('#cnA'); if (!info || !inp) return;
  const v = parseN(inp.value), net = +info.dataset.net || 0, base = v - net;
  info.innerHTML = !inp.value ? 'Con el match, la app calcula cuánto tenías antes de estos movimientos y te muestra de dónde salió el saldo.'
    : base >= 0 ? `Antes de estos movimientos tenías <b>${gs(base)}</b>. ${gs(base)} ${net >= 0 ? '+' : '−'} ${gs(Math.abs(net))} = ${gs(v)}.`
    : `<span class="neg">El banco tiene ${gs(-base)} menos de lo que explican estos movimientos</span>: puede faltar registrar un gasto o una transferencia. Se anota como “salidas sin registrar”.`;
}
function doConc(id) {
  const a = acct(id), v = parseN($('#cnA').value);
  if (a.ini == null) {
    const prev = acctAll(id), net = sum(prev, x => x.d), mode = ($('#cnM') || {}).value || 'cero';
    if (prev.length && mode === 'match') {
      const base = v - net;
      Object.assign(a, { ini: Math.max(0, base), iniTs: 0, iniD: today(), conc: today() });
      if (base < 0) { const m = { id: uid(), ts: Date.now(), date: today(), amt: -base, dir: -1, t: 'ajuste', cuenta: id, note: 'Salidas sin registrar' }; M.push(m); commit({ add: [m] }); }
      else commit();
      render(); acctSheet(id); return toast('Saldo de ' + a.name + ' cargado con el match');
    }
    Object.assign(a, { ini: v, iniTs: Date.now(), iniD: today(), conc: today() });
    commit(); render(); acctSheet(id); return toast('Saldo de ' + a.name + ' cargado');
  }
  const diff = v - acctBal(a); a.conc = today();
  if (!diff) { commit(); render(); acctSheet(id); haptic(15); return toast(a.name + ': coincide con el banco'); }
  const m = { id: uid(), ts: Date.now(), date: today(), amt: Math.abs(diff), dir: diff > 0 ? 1 : -1, t: 'ajuste', cuenta: id, note: 'Conciliación con el banco' };
  M.push(m); commit({ add: [m] }); render(); acctSheet(id);
  toast('Ajuste de ' + (diff > 0 ? '+' : '−') + gs(Math.abs(diff)) + ' en ' + a.name);
}
function acctForm(id) {
  const a = id ? acct(id) : null, kind = a ? a.kind || 'banco' : 'banco';
  const color = a ? a.color : ['green', 'orange', 'blue', 'teal', 'purple', 'pink'][S.accounts.length % 6];
  openSheet(`${head(a ? 'Editar cuenta' : 'Nueva cuenta', `<button class="link b" data-act="saveAcct" data-id="${id || ''}">Guardar</button>`, '<button class="link" data-act="close">Cancelar</button>')}
    <div class="group">${field('Nombre', `<input id="acN" list="dlBank" placeholder="Ej: Banco…" autocomplete="off" value="${esc(a ? a.name : '')}">`)}
      ${a ? '' : field('Saldo actual', money('acS', '', 'Opcional'))}</div>${dlist('dlBank', BANKS)}
    <div class="gh">Tipo</div><input type="hidden" id="acK" value="${kind}">
    <div class="seg">${[['banco', 'Banco o cooperativa'], ['efectivo', 'Efectivo'], ['billetera', 'Billetera']].map(([v, l]) => `<button class="${v === kind ? 'on' : ''}" data-act="pick" data-target="acK" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="gh">Color</div><div class="card" style="padding:14px">${colorPicker('acC', color)}</div>
    ${a ? `<button class="btn w mt2" style="--c:var(--red)" data-act="delAcct" data-id="${a.id}">Eliminar cuenta</button>` : '<p class="gf">El saldo lo copiás de la app del banco. Si lo dejás vacío, lo cargás después.</p>'}`);
}
function saveAcct(id) {
  const name = $('#acN').value.trim(); if (!name) return toast('Poné un nombre');
  const v = { name, kind: $('#acK').value, color: $('#acC').value };
  if (id) Object.assign(acct(id), v);
  else {
    const raw = $('#acS').value.trim(), a = Object.assign({ id: uid(), ini: null, iniTs: 0, iniD: '', conc: '' }, v);
    if (raw) Object.assign(a, { ini: parseN(raw), iniTs: Date.now(), iniD: today(), conc: today() });
    S.accounts.push(a); addXP(5);
  }
  commit(); closeSheet(); render(); toast(id ? 'Cuenta actualizada' : 'Cuenta ' + name + ' agregada');
}
function delAcct(id) {
  if (M.some(m => acctFlows(m).some(f => f[0] === id))) return toast('Tiene movimientos: cambiales la cuenta antes de borrarla');
  S.accounts = S.accounts.filter(a => a.id !== id); commit(); closeSheet(); render(); toast('Cuenta eliminada');
}
function transfSheet(from) {
  const others = S.accounts.filter(a => a.id !== from); if (!others.length) return toast('Agregá otra cuenta para transferir');
  openSheet(`${head('Transferir', `<button class="link b" data-act="doTransf" data-id="${from}">Guardar</button>`, `<button class="link" data-act="acct" data-id="${from}">Atrás</button>`)}
    <div class="group"><div class="cell"><div class="tx s2">Desde</div><div class="v">${esc(acct(from).name)}</div></div>${field('Monto', money('tfA'))}${field('Fecha', `<input id="tfD" type="date" value="${today()}">`)}</div>
    <div class="gh">Hacia</div><input type="hidden" id="tfT" value="${others[0].id}">
    <div class="chips">${others.map((a, i) => `<button class="chip ${i ? '' : 'on'}" data-act="pick" data-target="tfT" data-v="${a.id}" style="--c:var(--${a.color})"><span class="chip-ic">${sym(acctIcon(a))}</span>${esc(a.name)}</button>`).join('')}</div>
    <button class="btn p w mt2" data-act="doTransf" data-id="${from}">Transferir</button>`);
}
function doTransf(from) {
  const amt = parseN($('#tfA').value), to = $('#tfT').value; if (!amt || !to) return toast('Ingresá el monto');
  const m = { id: uid(), ts: Date.now(), date: $('#tfD').value || today(), amt, t: 'transf', from, to };
  M.push(m); checkin(); commit({ add: [m] }); render(); acctSheet(from); toast('Transferiste ' + gs(amt) + ' a ' + acctName(to));
}
// Cambiar la cuenta de un movimiento ya cargado
function movAcctSheet(id, f = 'cuenta') {
  const m = M.find(x => x.id === id); if (!m) return;
  const label = f === 'cuentaProv' ? 'Le pagaste al proveedor desde' : m.t === 'venta' ? 'Cobrado en' : m.t === 'ingreso' ? 'Entró en' : 'Pagado desde';
  openSheet(`${head('Cuenta', `<button class="link b" data-act="saveMovAcct" data-id="${id}" data-f="${f}">Guardar</button>`, `<button class="link" data-act="movDetail" data-id="${id}">Atrás</button>`)}
    <p class="gf" style="margin:0 4px 4px">${esc(movMeta(m).title)} · ${gs(f === 'cuentaProv' ? m.payAmt || m.costo : m.amt)}</p>
    ${acctPicker('maC', label, f === 'cuentaProv' ? m.cuentaProv || m.cuenta || '' : m[f] || '')}
    <button class="btn p w mt2" data-act="saveMovAcct" data-id="${id}" data-f="${f}">Guardar</button>`);
}
function saveMovAcct(id, f) {
  const m = M.find(x => x.id === id); if (!m) return;
  const v = pickedAcct('maC');
  if (f === 'cuentaProv' && v === m.cuenta) delete m.cuentaProv; else m[f] = v;
  commit({ add: [m] }); render(); movDetail(id); toast(v ? 'Cuenta: ' + acctName(v) : 'Sin cuenta');
}
// Ventas: "ya me pagaron"
function cobrarSheet(id) {
  const m = M.find(x => x.id === id); if (!m) return;
  const p = m.payable && payable(m.payable), owesProv = p && payPend(p) > 0;
  openSheet(`${head('Ya me pagaron', `<button class="link b" data-act="doCobrar" data-id="${id}">Guardar</button>`, `<button class="link" data-act="movDetail" data-id="${id}">Atrás</button>`)}
    <div class="center" style="padding:4px 0 14px">${icoBox('bag', 'green', 'xl')}<div style="font-weight:600;margin-top:10px">${esc(m.cliente || 'Venta')}</div>${big(fmt(m.amt) + '<span class="u">Gs</span>')}<small>vendido el ${dLabel(m.date)}</small></div>
    <div class="group">${field('Fecha de cobro', `<input id="cbD" type="date" value="${today()}">`)}</div>
    ${acctPicker('cbCta', 'Cobrado en')}
    ${owesProv ? `<div class="gh">¿Le pagás a ${esc(p.prov)} con esta plata?</div><input type="hidden" id="cbProv" value="si">
      <div class="seg">${[['si', 'Sí, ya le pagué'], ['no', 'Después']].map(([v, l]) => `<button class="${v === 'si' ? 'on' : ''}" data-act="pick" data-target="cbProv" data-v="${v}">${l}</button>`).join('')}</div>
      <p class="gf">Se cancela la deuda de ${gs(Math.min(m.costo || 0, payPend(p)))} con ${esc(p.prov)} (match), pagada desde la misma cuenta.</p>` : ''}
    <div class="note mt">Al cobrar se reparte: ${gs(m.toCofre)} al cofre, ${gs((m.toEmp || 0) + (m.costoRet || 0))} a la caja${m.ivaRes ? ' y ' + gs(m.ivaRes) + ' al sobre IVA' : ''}.</div>
    <button class="btn p w mt2" style="--c:var(--green)" data-act="doCobrar" data-id="${id}">Marcar cobrada</button>`);
}
function doCobrar(id) {
  const m = M.find(x => x.id === id); if (!m || m.cobrada !== false) return;
  const cta = pickedAcct('cbCta'), d = ($('#cbD') || {}).value || today();
  Object.assign(m, { cobrada: true, cobD: d, cobTs: Date.now() });
  if (cta) m.cuenta = cta; else delete m.cuenta;
  ventaFunds(m, 1);
  const p = m.payable && payable(m.payable);
  if (p && $('#cbProv') && $('#cbProv').value === 'si' && payPend(p) > 0) { m.provPaid = true; m.payAmt = Math.min(m.costo || 0, payPend(p)); linkPay(m); }
  SIM = null; addXP(20); checkin(); haptic(15); confetti(); checkAch(); commit({ add: [m] }); render(); movDetail(id);
  toast('Cobrado' + (cta ? ' en ' + acctName(cta) : '') + ' · +' + gsK(m.toCofre) + ' al cofre');
}
function undoCobro(id) {
  const m = M.find(x => x.id === id); if (!m || m.cobrada === false) return;
  ventaFunds(m, -1);
  const p = m.payable && payable(m.payable);
  if (p && m.provPaid) { p.pagos = p.pagos.filter(x => x.venta !== m.id); m.provPaid = false; }
  m.cobrada = false; ['cobD', 'cobTs', 'cuenta', 'cuentaProv'].forEach(k => delete m[k]);
  SIM = null; commit({ add: [m] }); render(); movDetail(id); toast('La venta volvió a "Te deben"');
}
function cobrosSection() {
  const r = receivables(); if (!r.length) return '';
  return sh('Te deben', `<small>${gs(sum(r, m => m.amt))}</small>`) +
    `<div class="group ic">${r.map(m => { const dd = daysBetween(m.date, today());
      return `<button class="cell" data-act="cobrar" data-id="${m.id}">${icoBox('clock', dd > 30 ? 'red' : 'orange')}<div class="tx"><div class="t">${esc(m.cliente || 'Venta')}</div><div class="s">Vendido el ${dLabel(m.date)}${dd > 0 ? ' · hace ' + dd + (dd === 1 ? ' día' : ' días') : ' · hoy'}</div></div>
        <div class="v"><span class="num">${gsK(m.amt)}</span><small>cobrar</small></div>${CHEV}</button>`; }).join('')}</div>
    <p class="gf">Tocá una venta cuando te paguen: elegís en qué cuenta entró y se reparte la ganancia.</p>`;
}

/* =========================================================================
   Hojas: sobres, metas, IVA, fondos
   ========================================================================= */
function budgetSheet(id) {
  const b = id ? S.budget.find(x => x.id === id) : null, k = ym(today());
  const avg = b ? sum([1, 2, 3], i => monthSpent(b.id, addMonth(k, -i))) / 3 : 0;
  const custom = !b || b.id.startsWith('c_');
  const color = b ? b.color : 'blue';
  openSheet(`${head(b ? esc(b.name) : 'Nuevo sobre', b && b.auto ? '' : `<button class="link b" data-act="saveBudget" data-id="${id || ''}">Guardar</button>`)}
    ${b ? `<div class="center" style="padding:4px 0 14px">${icoBox(b.sym, b.color, 'xl')}${big(fmt(monthSpent(b.id, k)) + '<span class="u">Gs</span>')}<small>gastado en ${MESES_L[+k.slice(5) - 1]} de ${gs(budAmt(b))}</small></div>` : ''}
    ${b && b.why ? `<div class="card"><div class="why">${esc(b.why)}</div></div>` : ''}
    ${b && b.auto ? '<p class="gf mt">Este monto sale de tus préstamos y se ajusta en Ingresos y ajustes del plan.</p>' : `
    <div class="group mt">
      ${custom ? field('Nombre', `<input id="bN" placeholder="Ej: Mascotas" value="${esc(b ? b.name : '')}">`) : ''}
      ${field('Monto mensual', money('bAmt', b ? b.amt : ''))}
    </div>
    ${b ? `<p class="gf">Promedio de los últimos 3 meses: <b>${gs(avg)}</b>.</p>` : ''}
    ${custom ? `<div class="gh">Tipo</div><input type="hidden" id="bT" value="${b ? b.tipo : 'nec'}"><div class="seg">${[['nec', 'Necesidad'], ['deseo', 'Gusto']].map(([v, l]) => `<button class="${(b ? b.tipo : 'nec') === v ? 'on' : ''}" data-act="pick" data-target="bT" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="gh">Ícono</div><div class="card" style="padding:14px">${symPicker('bS', b ? b.sym : 'tag', color)}</div>
      <div class="gh">Color</div><div class="card" style="padding:14px">${colorPicker('bC', color)}</div>` : ''}
    ${b && custom ? `<button class="btn w mt2" style="--c:var(--red)" data-act="delBudget" data-id="${b.id}">Eliminar sobre</button>` : ''}`}`);
}
function saveBudget(id) {
  const amt = parseN($('#bAmt').value);
  if (id) {
    const b = S.budget.find(x => x.id === id); b.amt = amt;
    if ($('#bN')) Object.assign(b, { name: $('#bN').value.trim() || b.name, tipo: $('#bT').value, sym: $('#bS').value, color: $('#bC').value });
  } else {
    const name = $('#bN').value.trim(); if (!name) return toast('Poné un nombre');
    S.budget.push({ id: 'c_' + uid(), name, amt, tipo: $('#bT').value, sym: $('#bS').value, color: $('#bC').value, why: '' });
  }
  commit(); closeSheet(); render(); toast('Sobre guardado');
}
function delBudget(id) { S.budget = S.budget.filter(b => b.id !== id); commit(); closeSheet(); render(); }
function goalSheet(id) {
  const g = goal(id), locked = g.kind === 'viaje' && !travelOpen(), pc = g.target ? g.saved / g.target * 100 : 0;
  let info = '';
  if (g.kind === 'viaje') {
    const tp = travelPlan().find(x => x.g.id === id);
    info = `<div class="note mt">${locked ? `<b>Se desbloquea cuando seas libre</b> (estimado ${ymLabel(projection())}). ` : ''}Con el 30% de lo que hoy va a deudas (${gs(debtBudget() * 0.3)}/mes), esta meta se completa en ~<b>${tp && tp.n != null ? tp.n + (tp.n === 1 ? ' mes' : ' meses') : '—'}</b>${tp && tp.done ? ' → ' + ymLabel(tp.done) : ''}. El monto es un estimado (pasajes + 4–5 noches + gastos): cotizá y ajustalo.</div>`;
  }
  openSheet(`${head(esc(g.name))}
    <div class="center" style="padding:4px 0 12px">${icoBox(locked ? 'lock' : g.sym, locked ? 'gray' : g.color, 'xl')}${big(fmt(g.saved) + '<span class="u">Gs</span>')}<small>de ${gs(g.target)} · ${pc.toFixed(0)}%</small></div>
    ${bar(pc, 'lg', `var(--${g.color})`)}
    ${g.why ? `<div class="card mt"><div class="why">${esc(g.why)}</div></div>` : ''}
    ${info}
    ${locked ? '' : `<div class="group mt2">${field('Monto', money('gAmt'))}</div>
    <div class="btns mt"><button class="btn p" data-act="goalMove" data-id="${id}" data-dir="in">Aportar</button><button class="btn" data-act="goalMove" data-id="${id}" data-dir="out">Retirar</button></div>`}
    <div class="gh">Objetivo</div>
    <div class="group">${field('Meta', money('gTarget', g.target))}</div>
    <button class="btn w mt" data-act="saveGoal" data-id="${id}">Guardar meta</button>`);
}
function goalMove(id, dir) {
  const amt = parseN($('#gAmt').value); if (!amt) return toast('Ingresá un monto');
  const m = { id: uid(), ts: Date.now(), date: today(), amt, t: dir === 'in' ? 'aporte' : 'retiro', goal: id };
  applyMov(m); M.push(m); if (dir === 'in') addXP(5); checkin(); checkAch(); commit({ add: [m] }); closeSheet(); render();
  toast(dir === 'in' ? '+' + gs(amt) + ' a ' + goal(id).name : 'Retiraste ' + gs(amt));
}
function saveGoalTarget(id) { const v = parseN($('#gTarget').value); if (!v) return; goal(id).target = v; commit(); closeSheet(); render(); toast('Meta actualizada'); }
function ivaSheet() {
  const k = ym(today()), prev = addMonth(k, -1), dp = ivaDue(prev), dc = ivaDue(k), per = dp > 0 ? prev : k;
  openSheet(`${head('Pago de IVA', '<button class="link b" data-act="doPayIva">Guardar</button>')}
    <div class="group">
      <div class="cell">${icoBox('receipt', 'gray')}<div class="tx">En el sobre IVA</div><div class="v num">${gs(S.funds.iva)}</div></div>
      <div class="cell"><div class="tx">Pendiente ${ymLabel(prev)}</div><div class="v num">${gs(dp)}</div></div>
      <div class="cell"><div class="tx">Acumulado ${ymLabel(k)}</div><div class="v num">${gs(dc)}</div></div>
    </div>
    <div class="gh">Período que pagás</div>
    <input type="hidden" id="ivP" value="${per}">
    <div class="seg">${[[prev, cap(MESES_L[+prev.slice(5) - 1])], [k, cap(MESES_L[+k.slice(5) - 1])]].map(([v, l]) => `<button class="${v === per ? 'on' : ''}" data-act="pick" data-target="ivP" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="group mt">${field('Monto pagado', money('ivA', per === prev ? dp : dc))}</div>
    ${acctPicker('ivCta')}${origPicker('ivOrig')}
    <p class="gf">Sale del sobre IVA. Si el sobre no alcanza, la diferencia sale de tu bolsillo.</p>`);
}
function doPayIva() {
  const amt = parseN($('#ivA').value); if (!amt) return toast('Ingresá un monto');
  const m = { id: uid(), ts: Date.now(), date: today(), amt, t: 'pagoiva', periodo: $('#ivP').value, fromRes: Math.max(0, Math.min(S.funds.iva, amt)), cuenta: pickedAcct('ivCta'), origen: pickedOrig('ivOrig') };
  applyMov(m); M.push(m); addXP(25); checkin(); checkAch(); commit({ add: [m] }); closeSheet(); render(); toast('IVA registrado');
}
function fundOpts() {
  return [['cofre', 'Cofre de ataque'], ['iva', 'Sobre IVA']].concat(S.goals.filter(g => g.kind !== 'viaje' || travelOpen()).map(g => [g.id, g.name]));
}
function moveSheet(from = 'cofre', to = 'colchon') {
  const k = ym(today()), sug = from === 'iva' ? Math.max(0, S.funds.iva - ivaDue(addMonth(k, -1)) - ivaDue(k)) : 0;
  const sel = (id, cur) => `<select id="${id}">${fundOpts().map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  openSheet(`${head('Mover entre fondos', '<button class="link b" data-act="doMove">Mover</button>')}
    <div class="group">${field('Desde', sel('mvF', from))}${field('Hacia', sel('mvT', to))}${field('Monto', money('mvA', sug))}</div>
    ${from === 'iva' ? `<p class="gf">Sugerido: lo que sobra en el sobre IVA después de cubrir lo pendiente (${gs(ivaDue(addMonth(k, -1)) + ivaDue(k))}).</p>` : ''}`);
}
function doMove() {
  const from = $('#mvF').value, to = $('#mvT').value, amt = parseN($('#mvA').value);
  if (!amt || from === to) return toast('Elegí fondos distintos y un monto');
  const m = { id: uid(), ts: Date.now(), date: today(), amt, t: 'mover', from, to };
  applyMov(m); M.push(m); checkin(); checkAch(); commit({ add: [m] }); closeSheet(); render(); toast('Movido ' + gs(amt));
}

/* =========================================================================
   Hojas: ajustes, cuenta, reglas, prompt
   ========================================================================= */
function settingsSheet() {
  const st = S.settings, theme = lsGet('libre-theme') || 'auto';
  const sw = (id, on) => `<input type="checkbox" class="sw" id="${id}" ${on ? 'checked' : ''}>`;
  openSheet(`${head('Ajustes del plan', '<button class="link b" data-act="saveSettings">Listo</button>', '<button class="link" data-act="close">Cancelar</button>')}
    <div class="gh">Ingresos mensuales netos</div>
    <div class="group">${field('Sueldo base', money('stBase', st.base))}${field('Horas extra (prom.)', money('stExtra', st.extra))}</div>
    <div class="gh">Deudas</div>
    <div class="group">${field('Cuotas fijas del plan', money('stCuotas', S.baseCuotas))}${field('Ataque extra / mes', money('stAtq', st.ataqueMensual))}</div>
    <p class="gf">Monto fijo para deudas = cuotas + ataque. Cuando cae un préstamo, su cuota se suma al ataque (no se baja este número).</p>
    <div class="gh">Cobro del sueldo</div>
    <div class="group">${field('Día de cobro', `<input id="stDia" inputmode="numeric" placeholder="25" value="${st.diaCobro || ''}">`)}</div>
    <p class="gf">El plan del día de cobro ordena lo que tenés que pagar hasta el cobro siguiente.</p>
    <div class="gh">Golpe anual (aguinaldo)</div>
    <div class="group">${field('Monto para atacar', money('stLump', st.lump))}${field('Mes', `<input id="stLumpMes" type="month" value="${esc(st.lumpMes)}">`)}
      ${field('Va a', `<select id="stLumpT"><option value="">El plan decide</option>${activeLoans().map(l => `<option value="${l.id}" ${st.lumpTarget === l.id ? 'selected' : ''}>Precancelar ${esc(debtName(l))}</option>`).join('')}</select>`)}
      <label class="cell"><div class="tx">Ya lo recibí</div>${sw('stLumpOk', st.lumpRecibido)}</label></div>
    <div class="gh">Negocio</div>
    <div class="group">${field('Meta de facturación', money('stMeta', st.metaFacturacion))}${field('% de ganancia al cofre', `<input id="stPct" inputmode="numeric" value="${st.pctVenta}">`)}
      <label class="cell"><div class="tx">Reservar IVA de cada venta</div>${sw('stIva', st.ivaAuto)}</label></div>
    <div class="gh">Metas</div>
    <div class="group"><label class="cell"><div class="tx"><div class="t">Ahorrar viajes antes de ser libre</div><div class="s">No recomendado: le quita munición a la deuda</div></div>${sw('stViajes', st.viajesAntes)}</label></div>
    <div class="gh">Perfil</div>
    <div class="group">${field('Nombre', `<input id="stName" placeholder="Para tu avatar" value="${esc(S.profile.nombre)}">`)}
      <div class="cell"><textarea id="stCtx" placeholder="Contexto para el prompt de Claude: profesión, situación laboral, objetivos…">${esc(S.profile.contexto)}</textarea></div></div>
    <div class="gh">Apariencia</div>
    <div class="seg">${segBtns('theme', 'theme', [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']], theme)}</div>`);
}
function saveSettings() {
  const st = S.settings, n = id => parseN($('#' + id).value);
  st.base = n('stBase'); st.extra = n('stExtra'); S.baseCuotas = n('stCuotas'); st.ataqueMensual = n('stAtq');
  st.lump = n('stLump'); st.lumpMes = $('#stLumpMes').value; st.lumpRecibido = $('#stLumpOk').checked;
  st.lumpTarget = $('#stLumpT').value; st.diaCobro = clamp(n('stDia'), 0, 31);
  st.metaFacturacion = n('stMeta'); st.pctVenta = clamp(n('stPct'), 0, 100); st.ivaAuto = $('#stIva').checked; st.viajesAntes = $('#stViajes').checked;
  S.profile.nombre = $('#stName').value.trim(); S.profile.contexto = $('#stCtx').value.trim();
  SIM = null; commit(); closeSheet(); render(); toast('Plan recalculado: libre en ' + ymLabel(projection()));
}
function setTheme(v) {
  lsSet('libre-theme', v);
  if (v === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = v;
  $$('#sheet [data-act=theme]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
}
function accountSheet() {
  const cloud = BK && BK.kind === 'cloud', local = cloud ? Store.readLocalData() : null;
  openSheet(`${head('Cuenta y datos')}
    <div class="group ic">
      <div class="cell">${icoBox(cloud ? 'cloud' : 'phone', cloud ? 'blue' : 'gray')}<div class="tx"><div class="t">${cloud ? esc(USER.email) : 'Solo este dispositivo'}</div><div class="s"><span class="sync ${cloud ? 'ok' : 'local'}" id="syncDot"></span>${cloud ? 'Sincronizado en la nube' : 'Sin cuenta: los datos viven en este navegador'}</div></div></div>
    </div>
    ${cloud ? `<div class="group mt">
      <button class="cell" data-act="resetPass"><div class="tx" style="color:var(--blue)">Cambiar contraseña</div></button>
      <button class="cell" data-act="logout"><div class="tx" style="color:var(--red)">Cerrar sesión</div></button></div>`
    : `<div class="group mt"><button class="cell" data-act="goCloud"><div class="tx" style="color:var(--blue)">${Store.cloudConfigured() ? 'Iniciar sesión o crear cuenta' : 'Configurar la nube (ver README)'}</div></button></div>
       <p class="gf">Con una cuenta, tus datos quedan en la nube y los ves desde el celular y la compu.</p>`}
    <div class="gh">Seguridad en este dispositivo</div>
    <div class="group" id="lockGroup"><div class="cell"><div class="tx s2">Buscando Face ID o huella…</div></div></div>
    <p class="gf">Con el bloqueo activo, la app pide Face ID o huella al abrirse y al volver después de un minuto. Funciona también sin internet.</p>
    <div class="gh">Copias de seguridad</div>
    <div class="group">
      <button class="cell" data-act="export"><div class="tx" style="color:var(--blue)">Descargar copia (.json)</div></button>
      <label class="cell"><div class="tx" style="color:var(--blue)">Importar copia (.json)</div><input type="file" accept=".json,application/json" class="hide" data-change="importFile"></label>
      ${local ? '<button class="cell" data-act="uploadLocal"><div class="tx" style="color:var(--blue)">Subir datos de este dispositivo a la nube</div></button>' : ''}
    </div>
    <p class="gf">Importar reemplaza todo lo actual. Acepta copias de esta versión y de la anterior (libre-de-deudas.html).</p>
    <div class="group mt2"><button class="cell" data-act="resetAll"><div class="tx" style="color:var(--red)">Borrar todo y empezar de cero</div></button></div>`);
  lockAvailable().then(ok => {
    const g = $('#lockGroup'); if (!g) return;
    g.innerHTML = ok
      ? `<label class="cell">${icoBox('faceid', 'green')}<div class="tx"><div class="t">Bloqueo con Face ID / huella</div><div class="s">Solo en este dispositivo</div></div><input type="checkbox" class="sw" data-change="lockToggle" ${lsGet(LOCK_KEY) ? 'checked' : ''}></label>`
      : `<div class="cell">${icoBox('faceid', 'gray')}<div class="tx"><div class="t">Face ID / huella no disponible</div><div class="s">Abrí la app en Safari del iPhone (o agregala a inicio) para activarlo</div></div></div>`;
  });
}
function rulesSheet() {
  openSheet(`${head('Las 7 reglas del juego')}<div class="group steps">${REGLAS.map(([t, p]) => `<div class="step"><span class="nb"></span><div><b>${t}</b><p>${p}</p></div></div>`).join('')}</div>`);
}
function promptText() {
  const st = S.settings, k = ym(today()), sm = monthSummary(k), iva = ivaMonth(k), ventas = inMonth(k, ['venta']);
  const cats = S.budget.map(b => `- ${b.name}: presupuesto ${fmt(budAmt(b))} | gastado este mes ${fmt(monthSpent(b.id, k))}`).join('\n');
  const loans = S.loans.map(l => `- ${debtName(l)}: saldo ${fmt(loanSaldo(l))} | cuota ${fmt(l.cuota)} | cuotas restantes ${l.cuotas.filter(c => !c.paid).length} | termina ${lastDate(l) || 'pagado'} | TAE ${l.tae || 'sin dato'}`).join('\n') || '- (sin préstamos)';
  const provs = provGroups().filter(g => g.pend > 0).map(g => `- ${g.prov}: ${fmt(g.pend)} a pagar (${g.ps.filter(p => payPend(p) > 0).map(p => p.desc || 'compra').join(', ')})`).join('\n') || '- (al día)';
  const cards = S.cards.map(c => `- ${entOf(c) ? entOf(c) + ' · ' : ''}${c.name}: saldo ${fmt(c.saldo)} | línea ${fmt(c.linea)} | extracto ${fmt(c.extracto)} vence ${c.vence || '—'} | TAN ${c.tan || '—'}%`).join('\n') || '- (sin tarjetas)';
  const goals = S.goals.map(g => `- ${g.name}: ${fmt(g.saved)} de ${fmt(g.target)}`).join('\n');
  return `Actuá como mi asesor financiero personal: prudente, orientado a riesgo, directo y sin relleno. No inventes tasas ni datos: si falta algo, pedímelo.

CONTEXTO
- Vivo en Paraguay (Gs).${S.profile.contexto ? ' ' + S.profile.contexto.replace(/\.$/, '') + '.' : ''} Ingreso neto: sueldo base ${fmt(st.base)} + horas extra ~${fmt(st.extra)} (variable).
- Estrategia: vivir con el sueldo base; horas extra, ganancia de ventas y sobrantes van a un "cofre de ataque" que paga por adelantado UNA deuda a la vez (primero la tarjeta, después el préstamo de mayor TAE; sin TAE, el que más cuota libera por guaraní). Cuota que termina se suma al ataque del siguiente (bola de nieve). Tarjeta: siempre pago total.
- Monto mensual fijo para deudas: ${fmt(debtBudget())}.
- Negocio de compraventa: el proveedor me da la mercadería a crédito y le pago cuando cobro. En cada venta resto el costo y el IVA neto (débito de la venta − crédito de la compra); de la ganancia, ${st.pctVenta}% va al cofre.
- Prioridades: 1) matar la deuda, 2) emprender y facturar (meta ${fmt(st.metaFacturacion)}/mes), 3) después, viajes (${S.goals.filter(g => g.kind === 'viaje').map(g => g.name).join(', ')}).

DATOS AL ${today()}
Deuda total: ${fmt(totalDebt())} (inicio ${fmt(S.initialTotal)}, ${pctFree().toFixed(1)}% eliminado)
Tarjetas:
${cards}
Préstamos:
${loans}
Proveedores (compras a crédito, se pagan con las ventas; no es deuda con interés):
${provs}
Cuentas (dónde está la plata): ${S.accounts.map(a => a.name + ' ' + (a.ini == null ? 'sin saldo cargado' : fmt(acctBal(a)))).join(' | ') || 'sin cuentas cargadas'}
Ventas por cobrar (te deben): ${fmt(sum(receivables(), m => m.amt))}
Cofre: ${fmt(S.funds.cofre)} | Sobre IVA: ${fmt(S.funds.iva)}
Metas:
${goals}
Sobres del mes (${ymLabel(k)}):
${cats}
Mes: ingresos ${fmt(sm.ingresos)} | egresos ${fmt(sm.egresos)} | compras con tarjeta ${fmt(sm.tc)}
Negocio: ${ventas.length} ventas por ${fmt(sum(ventas, m => m.amt))} | costo ${fmt(sum(ventas, m => m.costo || 0))} | ganancia real ${fmt(sum(ventas, ganancia))} | IVA débito ${fmt(iva.deb)} | IVA crédito ${fmt(iva.cred)}
Proyección libre de deudas (incluye tarjeta): ${ymLabel(projection())} (solo pagando cuotas: ${ymLabel(noPlanEnd())})

QUÉ NECESITO
1. Diagnóstico del mes en 3 líneas: qué hice bien, dónde me desvié (sobres excedidos y por cuánto).
2. Cuánto puedo atacar este mes, a qué deuda y por qué. Si conviene precancelar, decilo con números.
3. Fecha de libertad recalculada y qué la adelantaría 1 mes.
4. Negocio: margen real, una acción concreta para facturar más el mes que viene y cómo manejar el IVA.
5. Riesgos o alertas (liquidez, dependencia de horas extra, uso de tarjeta).
Formato: diagnóstico, solución, riesgos, siguiente paso. Tablas si ayudan.`;
}
function promptSheet() {
  openSheet(`${head('Revisión con Claude')}
    <p class="gf" style="margin:0 4px 12px">Copiá esto y pegáselo a Claude a fin de mes. Ya incluye tus datos actualizados.</p>
    <button class="btn p w" data-act="copyPrompt">Copiar prompt con mis datos</button>
    <div class="pre mt">${esc(promptText())}</div>`);
}
function copyPrompt() {
  const txt = promptText();
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('Prompt copiado'); } catch (e) { toast('No se pudo copiar'); } ta.remove(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast('Prompt copiado'), fallback); else fallback();
}
function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'libre', v: 2, exported: new Date().toISOString(), state: S, movs: M }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'libre-copia-' + today() + '.json';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function readFile(inp, cb) {
  const f = inp.files && inp.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { try { cb(importAny(JSON.parse(r.result))); } catch (e) { console.error(e); toast('Archivo inválido'); } inp.value = ''; };
  r.readAsText(f);
}

/* =========================================================================
   Acceso, bienvenida y arranque
   ========================================================================= */
const AUTH_MSG = {
  'auth/invalid-credential': 'Email o contraseña incorrectos.', 'auth/wrong-password': 'Email o contraseña incorrectos.', 'auth/user-not-found': 'Email o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ese email ya tiene cuenta: iniciá sesión.', 'auth/weak-password': 'La contraseña es muy débil.',
  'auth/invalid-email': 'El email no es válido.', 'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos.',
  'auth/network-request-failed': 'Sin conexión. Revisá tu internet.', 'auth/operation-not-allowed': 'Activá Email/Contraseña en Firebase (README paso 2).',
  'auth/admin-restricted-operation': 'El registro de cuentas nuevas está desactivado.'
};
/* ---------- Bloqueo con Face ID / huella (WebAuthn del dispositivo) ----------
   La llave queda en el chip seguro del celular; la app solo guarda su id en este navegador. */
const LOCK_KEY = 'libre-lock';
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const rnd = n => crypto.getRandomValues(new Uint8Array(n));
async function lockAvailable() {
  try { return !!(window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch (e) { return false; }
}
async function enableLock() {
  const cred = await navigator.credentials.create({ publicKey: {
    challenge: rnd(32), rp: { name: 'Libre', id: location.hostname }, user: { id: rnd(16), name: 'Libre', displayName: 'Libre' },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
    timeout: 60000, attestation: 'none' } });
  lsSet(LOCK_KEY, b64(cred.rawId));
}
let LOCKED = false, HIDDEN_AT = 0;
function showLock() {
  if (!lsGet(LOCK_KEY) || LOCKED) return;
  LOCKED = true;
  let el = $('#lock'); if (!el) { el = document.createElement('div'); el.id = 'lock'; document.body.appendChild(el); }
  el.innerHTML = `<div class="lock-in"><img class="appicon" src="assets/icon.svg" alt=""><h1>Libre</h1><p class="tag">Bloqueada para que nadie vea tus finanzas</p>
    <button class="btn p w" data-act="unlock">${sym('faceid')}Desbloquear</button>
    <div class="err" id="lockErr"></div>
    <button class="link mt2" style="font-size:15px" data-act="lockLogout">Entrar con mi contraseña</button></div>`;
  el.classList.add('on'); document.body.classList.add('locked');
  setTimeout(tryUnlock, 350);
}
function hideLock() { LOCKED = false; const el = $('#lock'); if (el) el.classList.remove('on'); document.body.classList.remove('locked'); }
let UNLOCKING = false;
async function tryUnlock() {
  const id = lsGet(LOCK_KEY); if (!id) return hideLock();
  if (UNLOCKING) return; UNLOCKING = true;
  try {
    await navigator.credentials.get({ publicKey: { challenge: rnd(32), allowCredentials: [{ type: 'public-key', id: unb64(id), transports: ['internal'] }], userVerification: 'required', timeout: 60000 } });
    hideLock(); haptic(10);
  } catch (e) {
    const er = $('#lockErr'); if (er) er.textContent = e.name === 'NotAllowedError' ? 'Tocá “Desbloquear” para usar Face ID o tu huella.' : 'No se pudo: ' + (e.message || e.name);
  }
  UNLOCKING = false;
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) HIDDEN_AT = Date.now();
  else if (HIDDEN_AT && Date.now() - HIDDEN_AT > 60000 && APP_ON) showLock();
});

/* ---------- Sin internet: la app sigue funcionando y sube los cambios al volver ---------- */
function netBadge() {
  let el = $('#net'); if (!el) { el = document.createElement('div'); el.id = 'net'; document.body.appendChild(el); }
  const off = !navigator.onLine;
  el.innerHTML = `${sym('wifi')}Sin internet · tus cambios se guardan y se suben al volver`;
  el.classList.toggle('on', off);
}
window.addEventListener('online', () => { netBadge(); if (APP_ON) toast('Volvió internet: sincronizando'); });
window.addEventListener('offline', () => netBadge());

function showSplash() { $('#app').innerHTML = '<div class="splash"><div class="spin"></div></div>'; }
function authShell(inner) {
  hideLock(); // sin sesión no hay datos que proteger
  APP_ON = false; document.body.classList.add('auth'); $('#dock').classList.add('hide'); closeSheet();
  $('#app').innerHTML = `<div class="auth-wrap"><img class="appicon" src="assets/icon.svg" alt="">${inner}</div>`;
}
function showLogin(msg = '') {
  const cloud = Store.cloudConfigured();
  authShell(`<h1>Libre</h1><p class="tag">Matá la deuda. Construí tu negocio.<br>Desbloqueá tus viajes.</p>
    ${cloud ? `<form id="loginForm" onsubmit="return false">
      <div class="group">
        ${field('Email', '<input id="lEmail" type="email" autocomplete="username" placeholder="tu@email.com" inputmode="email" autocapitalize="off">')}
        ${field('Contraseña', '<input id="lPass" type="password" autocomplete="current-password" placeholder="Requerida">')}
      </div>
      <button class="btn p w mt2" data-act="login">Iniciar sesión</button>
      <div class="center mt"><button class="link" style="font-size:15px" data-act="forgot">¿Olvidaste tu contraseña?</button></div></form>`
    : `<div class="note"><b>La nube todavía no está configurada.</b> Seguí el paso 2 del README (Firebase, 5 minutos). Mientras tanto podés usar la app en este dispositivo.</div>`}
    <div class="err" id="lErr">${esc(msg)}</div>
    <div class="center" style="margin-top:14px"><button class="link" style="font-size:15px" data-act="useLocal">Usar sin cuenta en este dispositivo</button></div>`);
}
async function doAuth(kind) {
  const email = $('#lEmail').value.trim(), pass = $('#lPass').value, err = $('#lErr');
  err.style.color = '';
  if (!email) { err.textContent = 'Escribí tu email.'; return; }
  if (kind !== 'forgot' && !pass) { err.textContent = 'Escribí tu contraseña.'; return; }
  err.textContent = '';
  $$('.auth-wrap .btn').forEach(b => { b.disabled = true; });
  try {
    if (kind === 'login') await Store.login(email, pass);
    else { await Store.resetPass(email); err.style.color = 'var(--green)'; err.textContent = 'Te enviamos un email para restablecer la contraseña.'; }
    lsDel('libre-mode');
  } catch (e) { err.textContent = AUTH_MSG[e.code] || ('No se pudo: ' + (e.code || e.message)); }
  $$('.auth-wrap .btn').forEach(b => { b.disabled = false; });
}
const LEGACY_KEY = 'foxtic-libre-v1';
function showOnboarding() {
  const cloud = BK && BK.kind === 'cloud', local = cloud ? Store.readLocalData() : null;
  let legacy = null; try { legacy = JSON.parse(lsGet(LEGACY_KEY)); } catch (e) {}
  authShell(`<h1>Bienvenido</h1>
    <p class="tag">${cloud ? 'Tu cuenta está lista. Tus datos viajan cifrados y solo tu usuario puede leerlos.' : 'Tus datos se guardan solo en este dispositivo.'}</p>
    <div class="group ic">
      ${local ? cellLink('obLocal', 'phone', 'green', 'Subir los datos de este dispositivo', 'Lo que cargaste sin cuenta') : ''}
      ${legacy ? cellLink('obLegacy', 'book', 'orange', 'Traer datos de la versión anterior', 'Encontrados en este navegador') : ''}
      <label class="cell">${icoBox('download', 'blue')}<div class="tx"><div class="t">Importar archivo de datos</div><div class="s">Por ejemplo mis-datos-iniciales.json</div></div>${CHEV}<input type="file" accept=".json,application/json" class="hide" data-change="obImport"></label>
      ${cellLink('obBlank', 'sparkles', 'purple', 'Empezar de cero', 'Cargás ingresos y deudas a mano')}
    </div>
    ${cloud ? '<div class="center mt2"><button class="link" style="font-size:15px" data-act="logout">Cerrar sesión</button></div>' : ''}`);
}
function stopData() { if (STOP) STOP(); STOP = null; BK = null; S = null; M = []; firstData = true; LAST = ''; USER = null; }
function startLocal() { stopData(); showSplash(); BK = Store.localBackend(); STOP = BK.start(onData); }
async function startCloud(user) {
  stopData(); USER = user; showSplash();
  try {
    BK = await Store.cloudBackend(user);
    STOP = BK.start(onData, err => { console.error(err); setSync('error'); toast('Error de la nube: ' + (err.code || err.message)); });
  } catch (e) { console.error(e); showLogin('No se pudo conectar con la nube.'); }
}
async function boot() {
  netBadge();
  showLock();
  if (lsGet('libre-mode') === 'local') return startLocal();
  if (!Store.cloudConfigured()) return showLogin();
  showSplash();
  try { await Store.watchAuth(user => { if (user) startCloud(user); else { stopData(); showLogin(); } }); }
  catch (e) { console.error(e); showLogin('No se pudo cargar la nube. Revisá tu internet o usá el modo local.'); }
}

/* =========================================================================
   Eventos
   ========================================================================= */
const ACT = {
  tab: d => go(d.tab), close: () => closeSheet(), add: d => openAdd(d.t),
  reg: d => {
    const { k, v } = d;
    if (k === 'cat') { REG.cat = v; $$('#sheet .chip[data-k=cat]').forEach(c => c.classList.toggle('on', c.dataset.v === v)); return; }
    if (k === 'amb') { REG.amb = v; REG.medio = v === 'negocio' ? 'caja' : 'debito'; REG.iva = v === 'negocio' ? '10' : 'none'; }
    else if (k === 'pay') { REG.pay = v; const p = payable(v); if (p) { const ci = $('#fCosto'); if (ci) ci.value = fmt(payPend(p)); REG.ivaC = p.iva || 'none'; } }
    else REG[k] = v;
    if (k === 'tipo' || k === 't') REG.touched = false;
    rerenderAdd();
  },
  pick: (d, el) => {
    $$('[data-act=pick]', el.parentElement).forEach(c => c.classList.toggle('on', c === el)); $('#' + d.target).value = d.v;
    if (d.target === 'ivP' && $('#ivA')) $('#ivA').value = fmt(ivaDue(d.v));
    if (d.target === 'bC') $$('#sheet .symbtn').forEach(b => b.style.setProperty('--c', `var(--${d.v})`));
  },
  saveAdd: () => saveAdd(), cero: () => diaCero(),
  movDetail: d => movDetail(d.id), delMov: (d, el) => armed(el) && delMov(d.id),
  mk: d => { const n = addMonth(MK, +d.d); if (n > ym(today())) return; MK = n; render(); },
  mf: d => { MF = d.v; render(); },
  payCuota: d => payCuotaSheet(d.id), doPayCuota: d => doPayCuota(d.id),
  attack: d => attackSheet(d.id), doAttack: d => doAttack(d.id),
  precancel: d => precancelSheet(d.id), doPrecancel: d => doPrecancel(d.id),
  loanDetail: d => loanDetail(d.id), editLoan: d => loanForm(d.id), saveLoan: d => saveLoan(d.id), delLoan: (d, el) => armed(el) && delLoan(d.id),
  editCuota: d => cuotaSheet(d.id, +d.n), saveCuota: d => saveCuota(d.id, +d.n),
  addDebt: () => addDebtChooser(), newLoan: () => loanForm(), newCard: () => cardForm(),
  payCard: d => payCardSheet(d.id), doPayCard: d => doPayCard(d.id),
  editCard: d => cardForm(d.id), saveCard: d => saveCard(d.id), delCard: (d, el) => armed(el) && delCard(d.id),
  budget: d => budgetSheet(d.id), newBudget: () => budgetSheet(), saveBudget: d => saveBudget(d.id), delBudget: (d, el) => armed(el) && delBudget(d.id),
  goal: d => goalSheet(d.id), goalMove: d => goalMove(d.id, d.dir), saveGoal: d => saveGoalTarget(d.id),
  payIva: () => ivaSheet(), doPayIva: () => doPayIva(),
  entFill: () => entFillSheet(), saveEntFill: () => saveEntFill(), entSheet: d => entSheet(d.ent || ''), renameEnt: d => renameEnt(d.ent),
  provSheet: d => provSheet(d.prov), payable: d => payableSheet(d.id),
  newPayable: d => payableForm(null, d.prov || ''), editPayable: d => payableForm(d.id), savePayable: d => savePayable(d.id),
  delPayable: (d, el) => armed(el) && delPayable(d.id),
  payProv: d => payProvSheet(d.id), doPayProv: d => doPayProv(d.id),
  undoPago: (d, el) => armed(el) && undoPago(d.id, d.pid),
  sellPayable: d => openAdd('venta', { pay: d.id }),
  assignProv: d => assignProvSheet(d.id), doAssignProv: d => doAssignProv(d.id),
  acct: d => acctSheet(d.id), newAcct: () => acctForm(), editAcct: d => acctForm(d.id), saveAcct: d => saveAcct(d.id),
  delAcct: (d, el) => armed(el) && delAcct(d.id), conc: d => concSheet(d.id), doConc: d => doConc(d.id),
  transf: d => transfSheet(d.id), doTransf: d => doTransf(d.id),
  movAcct: d => movAcctSheet(d.id, d.f), saveMovAcct: d => saveMovAcct(d.id, d.f),
  cobrar: d => cobrarSheet(d.id), doCobrar: d => doCobrar(d.id), undoCobro: (d, el) => armed(el) && undoCobro(d.id),
  explainAcct: (d, el) => armed(el) && explainAcct(d.id),
  fondo: d => fondoSheet(d.id), saveFondo: d => saveFondo(d.id), delFondo: (d, el) => armed(el) && delFondo(d.id),
  movOrig: d => movOrigSheet(d.id), saveMovOrig: d => saveMovOrig(d.id),
  fijo: d => fijoSheet(d.id), newFijo: () => fijoForm(), editFijo: d => fijoForm(d.id), fijoSug: d => fijoForm(null, +d.i),
  saveFijo: d => saveFijo(d.id), delFijo: (d, el) => armed(el) && delFijo(d.id),
  fijoPay: d => fijoPaySheet(d.id), doFijoPay: d => doFijoPay(d.id),
  cobro: () => cobroSheet(),
  cobroPay: d => { const f = { fijoPay: fijoPaySheet, payCuota: payCuotaSheet, payCard: payCardSheet, payable: payableSheet }[d.k]; if (f) { f(d.id); RETURN_TO = 'cobro'; } },
  unlock: () => tryUnlock(), lockLogout: async () => { hideLock(); if (BK && BK.kind === 'cloud') await Store.logout(); },
  moveFund: d => moveSheet(d.from, d.to), doMove: () => doMove(),
  settings: () => settingsSheet(), saveSettings: () => saveSettings(), theme: d => setTheme(d.v),
  account: () => accountSheet(), rules: () => rulesSheet(), prompt: () => promptSheet(), copyPrompt: () => copyPrompt(),
  export: () => exportData(),
  uploadLocal: (d, el) => { if (!armed(el)) return; const l = Store.readLocalData(); if (l) { replaceAll(l.state, l.movs); closeSheet(); render(); toast('Datos subidos a la nube'); } },
  resetAll: (d, el) => { if (!armed(el)) return; replaceAll(blankState(), []); closeSheet(); render(true); toast('Todo borrado'); },
  achInfo: d => { const a = ACH.find(x => x[0] === d.id); toast(a[2] + ': ' + a[3] + (S.ach[a[0]] ? ' · logrado el ' + dLabel(S.ach[a[0]]) : ' · bloqueado')); },
  login: () => doAuth('login'), forgot: () => doAuth('forgot'),
  useLocal: () => { lsSet('libre-mode', 'local'); startLocal(); },
  goCloud: () => { lsDel('libre-mode'); location.reload(); },
  logout: async () => { closeSheet(); if (BK && BK.kind === 'cloud') { await Store.logout(); } },
  resetPass: async () => { try { await Store.resetPass(USER.email); toast('Te enviamos un email para cambiar la contraseña'); } catch (e) { toast('No se pudo enviar el email'); } },
  obBlank: () => { replaceAll(blankState(), []); showApp(); },
  obLocal: () => { const l = Store.readLocalData(); if (l) { replaceAll(l.state, l.movs); showApp(); toast('Datos subidos'); } },
  obLegacy: () => { try { const r = fromV1(JSON.parse(lsGet(LEGACY_KEY))); replaceAll(r.state, r.movs); showApp(); toast('Datos de la versión anterior importados'); } catch (e) { toast('No se pudieron leer los datos anteriores'); } }
};
const CHG = {
  cobroLive: () => cobroLive(),
  lockToggle: async el => {
    if (el.checked) { try { await enableLock(); toast('Listo: la app pide Face ID / huella al abrirse'); } catch (e) { el.checked = false; toast('No se pudo activar: ' + (e.name === 'NotAllowedError' ? 'cancelado' : e.message || e.name)); } }
    else { lsDel(LOCK_KEY); toast('Bloqueo desactivado en este dispositivo'); }
  },
  task: el => { S.tasks[el.dataset.id] = el.checked; addXP(el.checked ? 25 : -25); checkAch(); commit(); render(); },
  importFile: el => readFile(el, r => { replaceAll(r.state, r.movs); closeSheet(); render(true); toast('Copia importada'); }),
  obImport: el => readFile(el, r => { replaceAll(r.state, r.movs); showApp(); toast('Datos importados · ¡a jugar!'); confetti(); })
};
document.addEventListener('click', e => {
  const tb = e.target.closest('#tabbar [data-tab]'); if (tb) { go(tb.dataset.tab); haptic(); return; }
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act], ret = RETURN_TO; if (!fn) return;
  fn(el.dataset, el, e);
  // Después de pagar algo desde el plan de cobro, volver al plan
  if (ret === 'cobro' && ['doFijoPay', 'doPayCuota', 'doPayCard', 'doPayProv'].includes(el.dataset.act)) setTimeout(() => { if (!sheetOpen()) cobroSheet(); }, 450);
});
document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el && CHG[el.dataset.change]) CHG[el.dataset.change](el, e); });
document.addEventListener('input', e => {
  const t = e.target;
  if (t.matches && t.matches('input[data-money]')) { const n = parseN(t.value); t.value = n ? fmt(n) : ''; }
  if (t.closest && t.closest('#sheet') && $('#fAmt')) addLive(e);
  if (t.id === 'cnA') concLive();
  if (t.id === 'cpA') cobroLive();
});
// Gráfico de la deuda: cruz + tooltip con mouse, dedo o teclado
document.addEventListener('pointermove', dchartPointer, { passive: true });
document.addEventListener('pointerdown', dchartPointer, { passive: true });
document.addEventListener('focusin', e => { if (e.target.closest && e.target.closest('.dchart') && DCH) dchartShow(DCH.today); });
document.addEventListener('focusout', e => { if (e.target.closest && e.target.closest('.dchart')) dchartHide(); });
let RSZ = 0, RW = window.innerWidth;
window.addEventListener('resize', () => {
  clearTimeout(RSZ);
  RSZ = setTimeout(() => { if (window.innerWidth === RW) return; RW = window.innerWidth; if (APP_ON && TAB === 'batalla' && !sheetOpen()) render(); }, 250);
});
document.addEventListener('keydown', e => {
  if (DCH && e.target.closest && e.target.closest('.dchart') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault(); dchartShow(clamp((DCH.i < 0 ? DCH.today : DCH.i) + (e.key === 'ArrowRight' ? 1 : -1), 0, DCH.pts.length - 1)); return;
  }
  if (e.key === 'Escape') closeSheet();
  if (e.key === 'Enter' && e.target.closest && e.target.closest('#loginForm')) { e.preventDefault(); doAuth('login'); }
});
$('#sheetBg').addEventListener('click', e => { if (e.target.id === 'sheetBg') closeSheet(); });
$('#fab').addEventListener('click', () => { haptic(); openAdd(); });
window.addEventListener('scroll', () => { $('#topbar').classList.toggle('on', APP_ON && window.scrollY > 52); }, { passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden && APP_ON && !sheetOpen()) render(); });

boot();
