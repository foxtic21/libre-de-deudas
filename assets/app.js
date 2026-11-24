// Libre · matá la deuda como en un juego, emprendé y desbloqueá tus viajes.
import * as Store from './store.js?v=2.0.1';

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

const ic = d => `<svg class="i" viewBox="0 0 24 24">${d}</svg>`;
const I = {
  plus: ic('<path d="M12 5v14M5 12h14"/>'),
  gear: ic('<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>'),
  left: ic('<path d="m15 5-7 7 7 7"/>'),
  right: ic('<path d="m9 5 7 7-7 7"/>'),
  chev: '<svg class="chev" viewBox="0 0 9 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 1.5 7 7l-5.5 5.5"/></svg>'
};

/* =========================================================================
   Modelo de datos
   ========================================================================= */
const BUDGET_META = {
  alquiler: { color: 'blue', tipo: 'nec' }, cuotas: { color: 'red', tipo: 'deuda' }, super: { color: 'green', tipo: 'nec' },
  afuera: { color: 'orange', tipo: 'deseo' }, combustible: { color: 'purple', tipo: 'nec' }, padel: { color: 'mint', tipo: 'deseo' },
  personal: { color: 'pink', tipo: 'nec' }, digital: { color: 'cyan', tipo: 'deseo' }, otros: { color: 'gray', tipo: 'nec' }
};
const DEFAULT_BUDGET = () => [
  { id: 'alquiler', name: 'Vivienda / alquiler', icon: '🏠', amt: 0, fijo: true, why: 'Tu techo. Se paga primero, el día que cobrás. Zona sana: menos del 30% del ingreso.' },
  { id: 'cuotas', name: 'Cuotas de préstamos', icon: '⛓️', amt: 0, fijo: true, auto: true, why: 'Cada préstamo que derrotás libera su cuota, y esa cuota NO se gasta: pasa a atacar al siguiente (bola de nieve). Por eso el monto total para deudas se mantiene fijo aunque las cuotas bajen.' },
  { id: 'super', name: 'Supermercado', icon: '🛒', amt: 0, why: 'Una compra grande por semana con lista evita el goteo diario de compras chicas. Comida de casa = la palanca más fuerte del plan.' },
  { id: 'afuera', name: 'Comida afuera y delivery', icon: '🍔', amt: 0, why: 'Suele ser la mayor fuga. No es prohibir: es elegir 1–2 salidas buenas por semana.' },
  { id: 'combustible', name: 'Combustible y transporte', icon: '⛽', amt: 0, why: 'Las apps de transporte salen del mismo sobre. Agrupá trámites para hacer menos viajes.' },
  { id: 'padel', name: 'Deporte y ocio', icon: '🎾', amt: 0, why: 'Salud y vida social: no se elimina, se le pone techo mientras dure el modo batalla.' },
  { id: 'personal', name: 'Salud y cuidado personal', icon: '💆', amt: 0, why: 'Farmacia y cuidado personal. Tratamientos grandes: planificalos como gasto puntual, nunca financiados con la tarjeta.' },
  { id: 'digital', name: 'Suscripciones y online', icon: '📱', amt: 0, why: 'Las compras al exterior pagan IVA a servicios digitales y cargo internacional. Regla: si no te genera ingreso o ahorro, esperá a ser libre.' },
  { id: 'otros', name: 'Imprevistos y otros', icon: '🎲', amt: 0, why: 'Margen para que lo inesperado no rompa el plan. Lo que sobre a fin de mes va al cofre.' }
];
const DEFAULT_GOALS = () => [
  { id: 'colchon', name: 'Colchón de emergencia', icon: '🛟', color: 'teal', target: 1500000, saved: 0, kind: 'base', why: 'Tu escudo. Sin colchón, el primer imprevisto vuelve a la tarjeta y borra meses de progreso. Guardalo en una cuenta aparte, no en la tarjeta.' },
  { id: 'emprender', name: 'Caja del negocio', icon: '🚀', color: 'indigo', target: 2000000, saved: 0, kind: 'base', why: 'Capital para herramientas, dominio, hosting, demos y publicidad. Tope duro: el negocio se financia con sus ventas, nunca con la tarjeta. Las reinversiones de cada venta también caen acá.' },
  { id: 'rio', name: 'Río de Janeiro', icon: '🇧🇷', color: 'green', target: 9000000, saved: 0, kind: 'viaje' },
  { id: 'bariloche', name: 'Bariloche', icon: '🏔️', color: 'blue', target: 10000000, saved: 0, kind: 'viaje' },
  { id: 'bsas', name: 'Buenos Aires', icon: '🇦🇷', color: 'cyan', target: 6000000, saved: 0, kind: 'viaje' }
];
const DEFAULT_SETTINGS = () => ({ base: 0, extra: 0, ataqueMensual: 0, pctVenta: 50, metaFacturacion: 5000000, ivaAuto: true, lump: 0, lumpMes: '', lumpRecibido: false, viajesAntes: false });
function blankState() {
  return {
    v: 2, created: today(), profile: { nombre: '', contexto: '' }, settings: DEFAULT_SETTINGS(),
    baseCuotas: 0, cards: [], loans: [], budget: DEFAULT_BUDGET(), funds: { cofre: 0, iva: 0 }, goals: DEFAULT_GOALS(),
    tasks: {}, ach: {}, xp: 0, checkins: [], initialTotal: 0
  };
}
function normalize(raw) {
  const s = Object.assign(blankState(), raw || {});
  s.settings = Object.assign(DEFAULT_SETTINGS(), s.settings || {});
  s.profile = Object.assign({ nombre: '', contexto: '' }, s.profile || {});
  s.funds = Object.assign({ cofre: 0, iva: 0 }, s.funds || {});
  s.cards = s.cards || []; s.loans = s.loans || [];
  if (!s.budget || !s.budget.length) s.budget = DEFAULT_BUDGET();
  s.budget.forEach(b => { const d = BUDGET_META[b.id] || {}; b.color = b.color || d.color || 'gray'; b.tipo = b.tipo || d.tipo || 'nec'; });
  s.goals = s.goals || [];
  DEFAULT_GOALS().forEach(g => { if (!s.goals.find(x => x.id === g.id)) s.goals.push(g); });
  s.tasks = s.tasks || {}; s.ach = s.ach || {}; s.checkins = s.checkins || []; s.xp = s.xp || 0;
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
    if (m.t === 'venta') { m.iva = 'ex'; m.ivaAmt = 0; m.ivaRes = 0; m.neto = e.ganancia ?? e.amt; m.toEmp = e.toEmp || 0; m.toCofre = e.toCofre || 0; }
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
  add.forEach(m => { M = M.filter(x => x.id !== m.id); M.push(m); });
  if (del.length) M = M.filter(m => !del.includes(m.id));
  LAST = stable(S) + '|' + movSig(M);
  if (!BK) return;
  const kind = BK.kind;
  setSync(kind === 'local' ? 'local' : 'saving');
  Promise.resolve(BK.write({ state: S, add, del, movs: M }))
    .then(() => setSync(kind === 'local' ? 'local' : 'ok'))
    .catch(e => { console.error(e); setSync('error'); toast('⚠️ No se pudo guardar: ' + (e.code || e.message)); });
}
function replaceAll(state, movs) {
  const ids = new Set(movs.map(m => m.id));
  const del = M.map(m => m.id).filter(id => !ids.has(id));
  S = normalize(state); M = [];
  commit({ add: movs, del });
}
function onData({ state, movs, pending }) {
  if (pending) return; // eco de nuestras propias escrituras
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

function attackOrder() {
  const act = activeLoans();
  const allTae = act.length > 0 && act.every(l => taeN(l) > 0);
  const list = act.slice().sort((a, b) => allTae ? taeN(b) - taeN(a) : (b.cuota / loanSaldo(b)) - (a.cuota / loanSaldo(a)));
  return { list, mode: allTae ? 'tae' : 'flujo' };
}
// Proyección: monto fijo mensual para deudas; lo que libera cada préstamo pasa al siguiente (bola de nieve).
function projection(withPlan = true) {
  const loans = S.loans.map(l => ({ id: l.id, cs: l.cuotas.filter(c => !c.paid).map(c => ({ d: c.d, a: c.a })) }));
  if (!loans.some(l => l.cs.length)) return ym(today());
  const end = loans.reduce((m, l) => (l.cs.length && l.cs[l.cs.length - 1].d > m ? l.cs[l.cs.length - 1].d : m), '');
  if (!withPlan) return ym(end);
  const order = attackOrder().list.map(l => l.id);
  let k = ym(today());
  for (let i = 0; i < 72; i++) {
    let budget = i === 0 ? sum(loans, l => sum(l.cs.filter(c => ym(c.d) <= k), c => c.a)) + Math.max(0, S.funds.cofre) : debtBudget();
    if (!S.settings.lumpRecibido && S.settings.lumpMes === k) budget += S.settings.lump;
    loans.forEach(l => { while (l.cs.length && ym(l.cs[0].d) <= k) { budget -= l.cs[0].a; l.cs.shift(); } });
    let extra = Math.max(0, budget);
    for (const id of order) {
      const l = loans.find(x => x.id === id);
      while (extra > 0 && l.cs.length) { const c = l.cs[l.cs.length - 1]; if (c.a <= extra) { extra -= c.a; l.cs.pop(); } else { c.a -= extra; extra = 0; } }
    }
    if (loans.every(l => !l.cs.length)) return k;
    k = addMonth(k, 1);
  }
  return ym(end);
}
const inMonth = (k, types) => M.filter(m => ym(m.date) === k && (!types || types.includes(m.t)));
function monthSpent(cat, k = ym(today())) {
  if (cat === 'cuotas') return sum(inMonth(k, ['cuota']), m => m.amt);
  return sum(M.filter(m => m.t === 'gasto' && m.ambito !== 'negocio' && m.cat === cat && ym(m.date) === k), m => m.amt);
}
const factMonth = k => sum(inMonth(k, ['venta']), m => m.amt);
function bestMonthFact() { const by = {}; M.filter(m => m.t === 'venta').forEach(m => { const k = ym(m.date); by[k] = (by[k] || 0) + m.amt; }); return Math.max(0, ...Object.values(by)); }
function monthSummary(k) {
  const ms = M.filter(m => ym(m.date) === k);
  const f = t => ms.filter(t);
  const ingresos = sum(f(m => m.t === 'ingreso' || m.t === 'venta'), m => m.amt);
  const gPers = sum(f(m => m.t === 'gasto' && m.ambito !== 'negocio'), m => m.amt);
  const gNeg = sum(f(m => m.t === 'gasto' && m.ambito === 'negocio'), m => m.amt);
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
    cred: sum(ms.filter(m => m.t === 'gasto' && m.ambito === 'negocio'), m => m.ivaAmt),
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
function rings(k = ym(today())) {
  const due = sum(S.loans, l => sum(l.cuotas.filter(c => ym(c.d) === k), c => c.o));
  const target = due + S.settings.ataqueMensual;
  const done = sum(inMonth(k, ['cuota', 'ataque', 'precancel']), m => m.amt);
  const fact = factMonth(k), meta = S.settings.metaFacturacion;
  const days = k === ym(today()) ? new Date().getDate() : lastDay(k);
  const reg = S.checkins.filter(c => ym(c) === k).length;
  return [
    { name: 'Ataque a la deuda', color: '#fa114f', p: target ? done / target : 0, a: gsK(done), b: gsK(target) },
    { name: 'Facturación', color: '#a6ff00', p: meta ? fact / meta : 0, a: gsK(fact), b: gsK(meta) },
    { name: 'Hábito', color: '#00e5ff', p: days ? reg / days : 0, a: reg, b: days + ' días' }
  ];
}
function travelPlan() {
  const capM = debtBudget() * 0.3; let k = isFree() ? ym(today()) : projection(true);
  return S.goals.filter(g => g.kind === 'viaje').map(g => {
    const falta = Math.max(0, g.target - g.saved); const n = capM > 0 ? Math.ceil(falta / capM) : null;
    const done = n != null ? addMonth(k, n) : null; if (done) k = done; return { g, n, done };
  });
}

/* =========================================================================
   Gamificación
   ========================================================================= */
const RANKS = [[0, 'Endeudado valiente', '🛡️'], [10, 'Aprendiz de finanzas', '📘'], [25, 'Estratega', '♟️'], [50, 'Guerrero sin cuotas', '⚔️'], [75, 'Casi libre', '🦅'], [100, 'LIBRE', '👑']];
const rank = () => { const p = isFree() ? 100 : pctFree(); let r = RANKS[0]; RANKS.forEach(x => { if (p >= x[0]) r = x; }); return r; };
const level = () => 1 + Math.floor(S.xp / 250);
const ACH = [
  ['primer', '👣', 'Primer paso', 'Registraste tu primer movimiento'],
  ['racha3', '🔥', 'Racha 3', '3 días seguidos registrando'],
  ['racha7', '🔥', 'Racha 7', 'Una semana sin fallar'],
  ['racha30', '🌋', 'Racha 30', 'Un mes entero de disciplina'],
  ['cero', '🧘', 'Día cero', 'Un día sin gastar nada'],
  ['tc', '💳', 'Tarjeta domada', 'Pagaste el total del extracto'],
  ['jefe', '🏆', 'Jefe caído', 'Derrotaste tu primer préstamo'],
  ['critico', '⚡', 'Golpe crítico', 'Precancelaste un préstamo'],
  ['venta', '💰', 'Primera venta', 'Registraste tu primera venta'],
  ['meta', '📈', 'Meta cumplida', 'Llegaste a tu meta de facturación del mes'],
  ['iva', '🧾', 'IVA al día', 'Pagaste el IVA desde su sobre'],
  ['anillos', '⭕', 'Anillos cerrados', 'Cerraste los 3 anillos en un mes'],
  ['colchon', '🛟', 'Colchón listo', 'Tu fondo de emergencia está completo'],
  ['sobre', '🎯', 'Sobre intacto', 'Terminaste un mes dentro del presupuesto variable'],
  ['asesor', '🧠', 'Plan en marcha', 'Completaste la Fase 0'],
  ['p25', '🥉', '25% libre', 'Eliminaste un cuarto de la deuda'],
  ['p50', '🥈', '50% libre', 'La mitad ya no existe'],
  ['p75', '🥇', '75% libre', 'Ya se ve la salida'],
  ['p100', '👑', 'LIBRE', 'Cero deudas: se desbloquean los viajes'],
  ['viajero', '✈️', 'Viajero', 'Completaste una meta de viaje']
];
function addXP(n) { const before = level(); S.xp = Math.max(0, S.xp + n); if (level() > before) { toast('⬆️ ¡Subiste a nivel ' + level() + '!'); confetti(); } }
function unlock(id) {
  if (S.ach[id]) return;
  S.ach[id] = today(); const a = ACH.find(x => x[0] === id);
  toast(a[1] + ' Logro: ' + a[2] + ' (+100 XP)'); addXP(100); confetti(); haptic(30);
}
function checkAch() {
  if (!S) return;
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
function applyMov(m) {
  switch (m.t) {
    case 'gasto':
      if (m.medio === 'tc') { const c = card(m.card); if (c) c.saldo += m.amt; }
      if (m.ambito === 'negocio' && m.medio === 'caja') addTo('emprender', -m.amt);
      break;
    case 'ingreso': Object.entries(m.split || {}).forEach(([k, v]) => addTo(k, v)); if (m.tipo === 'aguinaldo') S.settings.lumpRecibido = true; break;
    case 'venta': addTo('cofre', m.toCofre); addTo('emprender', m.toEmp); addTo('iva', m.ivaRes); break;
    case 'aporte': addTo(m.goal, m.amt); break;
    case 'retiro': addTo(m.goal, -m.amt); break;
    case 'mover': addTo(m.from, -m.amt); addTo(m.to, m.amt); break;
    case 'pagoiva': addTo('iva', -m.fromRes); break;
  }
}
function revertMov(m) {
  switch (m.t) {
    case 'gasto':
      if (m.medio === 'tc') { const c = card(m.card); if (c) c.saldo -= m.amt; }
      if (m.ambito === 'negocio' && m.medio === 'caja') addTo('emprender', m.amt);
      break;
    case 'ingreso': Object.entries(m.split || {}).forEach(([k, v]) => addTo(k, -v)); if (m.tipo === 'aguinaldo') S.settings.lumpRecibido = false; break;
    case 'venta': addTo('cofre', -m.toCofre); addTo('emprender', -m.toEmp); addTo('iva', -(m.ivaRes || 0)); break;
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
      if (!m.undo) toast('Este movimiento es de la versión anterior: el cronograma no se pudo revertir.');
      break;
    }
    case 'pagotc': { const c = card(m.card); if (c) { if (m.prevSaldo != null) c.saldo = m.prevSaldo; else c.saldo += m.amt; if (m.prevExtracto != null) c.extracto = m.prevExtracto; } break; }
  }
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
  const bg = $('#sheetBg'); if (!bg.classList.contains('on')) return;
  bg.classList.remove('on'); document.body.classList.remove('sheet-open'); setTimeout(() => { if (!bg.classList.contains('on')) $('#sheet').innerHTML = ''; }, 380);
  if (pendingRender) render();
}
const sheetOpen = () => $('#sheetBg').classList.contains('on');
function armed(el) {
  if (el.dataset.armed) return true;
  el.dataset.armed = '1'; const txt = el.textContent; el.textContent = 'Tocá de nuevo para confirmar';
  setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.textContent = txt; } }, 3500);
  return false;
}
const head = (title, right = '', left = '<button class="link" data-act="close">Cerrar</button>') =>
  `<div class="sh-head">${left}<h3>${title}</h3>${right || '<span></span>'}</div>`;
const lt = (title, sub = '', right = '') => `<div class="lt"><div>${sub ? `<div class="sub">${sub}</div>` : ''}<h1>${title}</h1></div>${right}</div>`;
const sh = (title, right = '') => `<div class="sh"><h2>${title}</h2>${right}</div>`;
const bar = (pct, cls = '', color = '') => `<div class="bar ${cls}"${color ? ` style="--c:${color}"` : ''}><i style="width:${clamp(pct || 0, 0, 100).toFixed(1)}%"></i></div>`;
const icoBox = (emoji, color, cls = '') => `<span class="ico ${cls}" style="--c:var(--${color || 'gray'})">${emoji}</span>`;
const big = (n, cls = '') => `<div class="num ${cls}" style="font-size:32px;font-weight:800;letter-spacing:-.02em;margin-top:8px">${n}</div>`;
const field = (label, input) => `<label class="cell fieldc"><span>${label}</span>${input}</label>`;
const money = (id, val = '', ph = '0') => `<input id="${id}" data-money inputmode="numeric" placeholder="${ph}" value="${val ? fmt(val) : ''}" autocomplete="off">`;
const segBtns = (act, k, opts, cur) => opts.map(([v, l]) => `<button class="${v === cur ? 'on' : ''}" data-act="${act}" data-k="${k}" data-v="${v}">${l}</button>`).join('');
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
  const before = stable(S); checkAch(); if (stable(S) !== before) commit();
  render(true);
}

/* =========================================================================
   Pantalla: Hoy
   ========================================================================= */
function vHoy() {
  const tot = totalDebt(), p = pctFree(), r = rank(), st = streak(), lv = level();
  const proj = projection(true), base = projection(false), gain = monthsDiff(proj, base);
  const vl = varLeft(), tgt = attackOrder().list[0], rs = rings(), d = new Date();
  const hasDebt = S.loans.length || S.cards.length;
  const nAch = Object.keys(S.ach).length;
  return `
  ${lt('Hoy', DIAS_L[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES_L[d.getMonth()], `<button class="avatar" data-act="tab" data-tab="plan" aria-label="Plan">${r[2]}</button>`)}
  ${setupCard()}
  <div class="rankrow"><div><div class="rk">${r[1]}</div><small>Nivel ${lv} · ${fmt(S.xp)} XP · faltan ${250 - S.xp % 250} para el nivel ${lv + 1}</small></div>
    <span class="pill" style="--c:var(--orange);font-size:14px;padding:6px 12px">🔥 ${st} ${st === 1 ? 'día' : 'días'}</span></div>
  ${bar((S.xp % 250) / 2.5, 'xp')}
  <div class="rings">${ringsSvg(rs)}<div class="leg">${rs.map(x => `<div><div class="t">${x.name}</div><div class="v" style="color:${x.color}">${x.a}<small> / ${x.b}</small></div></div>`).join('')}</div></div>
  ${hasDebt ? `<div class="hp">
    <div class="k">Vida total de la deuda</div>
    <div class="n">${gs(tot)}</div>
    ${bar(100 - p, 'hpbar lg')}
    <div class="meta"><span><b>${p.toFixed(1)}%</b> eliminado</span><span>inicio ${gsK(S.initialTotal)}</span></div>
    <hr>
    <div class="g2"><div><div class="k">Libre de deudas</div><div class="m">${isFree() ? '¡Ya!' : ymLabel(proj)}</div></div><div><div class="k">Sin el plan</div><div class="m" style="opacity:.6">${ymLabel(base)}</div></div></div>
    ${gain > 0 ? `<div class="gain">⏩ El plan te libera ${gain} ${gain === 1 ? 'mes' : 'meses'} antes</div>` : ''}
  </div>` : ''}
  <div class="g2 mt">
    <div class="tile"><div class="k">Hoy podés gastar</div><div class="n" style="color:${vl.perDay < 30000 ? 'var(--red)' : 'var(--green)'}">${gs(vl.perDay)}</div><div class="f">${gsK(vl.left)} en ${vl.daysLeft} días</div></div>
    <div class="tile"><div class="k">💎 Cofre de ataque</div><div class="n" style="color:var(--orange)">${gs(S.funds.cofre)}</div><div class="f">Colchón ${gsK(goal('colchon').saved)} · Negocio ${gsK(goal('emprender').saved)}</div></div>
  </div>
  <div class="qa">
    <button data-act="add" data-t="gasto" style="--c:var(--red)"><span>➖</span>Gasto</button>
    <button data-act="add" data-t="ingreso" style="--c:var(--green)"><span>➕</span>Ingreso</button>
    <button data-act="add" data-t="venta" style="--c:var(--indigo)"><span>💰</span>Venta</button>
    <button data-act="cero" style="--c:var(--teal)"><span>🧘</span>No gasté</button>
  </div>
  ${tgt ? sh('🎯 Jefe actual', '<button class="link" data-act="tab" data-tab="batalla">Ver todos</button>') + bossCard(tgt, true)
    : (S.loans.length ? `<div class="card mt2 center"><div style="font-size:48px">👑</div><h3>¡No quedan préstamos!</h3><small>Los viajes están desbloqueados en Plan.</small></div>` : '')}
  ${hasDebt ? sh('Próximos vencimientos') + `<div class="group ic">${upcoming() || '<div class="cell"><small>Nada pendiente.</small></div>'}</div>` : ''}
  ${sh('Logros', `<small>${nAch}/${ACH.length}</small>`)}
  <div class="card"><div class="medals">${ACH.map(a => `<button class="medal ${S.ach[a[0]] ? 'on' : ''}" data-act="achInfo" data-id="${a[0]}"><b>${a[1]}</b>${esc(a[2])}</button>`).join('')}</div></div>`;
}
function setupCard() {
  const needInc = !S.settings.base, needDebt = !S.loans.length && !S.cards.length;
  if (!needInc && !needDebt) return '';
  return `<div class="card" style="margin-bottom:18px"><h3 style="font-size:20px">👋 Armá tu partida</h3><p class="s2" style="font-size:15px;margin-top:4px">Dos minutos y el juego arranca.</p>
    <div class="group ic mt" style="box-shadow:none;background:var(--fill)">
      <button class="cell" data-act="settings">${icoBox('💵', 'green')}<div class="tx"><div class="t">${needInc ? '' : '✓ '}Cargá tus ingresos</div></div>${I.chev}</button>
      <button class="cell" data-act="addDebt">${icoBox('🐉', 'red')}<div class="tx"><div class="t">${needDebt ? '' : '✓ '}Agregá tus deudas</div></div>${I.chev}</button>
      <button class="cell" data-act="account">${icoBox('📥', 'blue')}<div class="tx"><div class="t">O importá tus datos (.json)</div></div>${I.chev}</button>
    </div></div>`;
}
function upcoming() {
  const t = today(), ups = [];
  S.loans.forEach(l => { const c = nextCuota(l); if (c) ups.push({ d: c.d, t: l.name, s: 'Cuota ' + c.n, a: c.a, e: l.emoji, act: 'payCuota', id: l.id }); });
  S.cards.forEach(c => { if (c.extracto > 0 && c.vence) ups.push({ d: c.vence, t: c.name, s: 'Pagá el TOTAL', a: c.extracto, e: '💳', act: 'payCard', id: c.id }); });
  ups.sort((a, b) => a.d.localeCompare(b.d));
  return ups.slice(0, 5).map(u => {
    const dd = daysBetween(t, u.d), col = dd < 0 ? 'red' : dd <= 5 ? 'orange' : 'gray';
    const txt = dd < 0 ? 'vencida' : dd === 0 ? 'hoy' : dd === 1 ? 'mañana' : 'en ' + dd + ' días';
    return `<button class="cell" data-act="${u.act}" data-id="${u.id}">${icoBox(esc(u.e), col)}<div class="tx"><div class="t">${esc(u.t)}</div><div class="s">${u.s} · ${dLabel(u.d)}</div></div>
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
  deudas: m => ['cuota', 'ataque', 'precancel', 'pagotc', 'pagoiva'].includes(m.t)
};
const MEDIO_L = { debito: '🏦 Débito', efectivo: '💵 Efectivo', tc: '💳 Tarjeta', caja: '🚀 Caja del negocio' };
const FUND_L = { cofre: '💎 Cofre de ataque', iva: '🧾 Sobre IVA' };
const fundName = k => FUND_L[k] || (goal(k) ? goal(k).icon + ' ' + goal(k).name : k);
function movMeta(m) {
  const ln = id => (loan(id) || {}).name || 'préstamo';
  switch (m.t) {
    case 'gasto': {
      if (m.ambito === 'negocio') return { icon: '💼', color: 'indigo', title: 'Gasto del negocio', sign: -1 };
      const b = S.budget.find(x => x.id === m.cat); return { icon: b ? b.icon : '🧾', color: b ? b.color : 'gray', title: b ? b.name : 'Gasto', sign: -1 };
    }
    case 'ingreso': return { icon: { sueldo: '🏛️', extra: '⏱️', aguinaldo: '🎁' }[m.tipo] || '✨', color: 'green', title: { sueldo: 'Sueldo', extra: 'Horas extra', aguinaldo: 'Aguinaldo' }[m.tipo] || 'Ingreso', sign: 1 };
    case 'venta': return { icon: '💰', color: 'indigo', title: 'Venta' + (m.cliente ? ' · ' + m.cliente : ''), sign: 1 };
    case 'cuota': return { icon: '✅', color: 'red', title: 'Cuota ' + m.n + ' · ' + ln(m.loan), sign: -1 };
    case 'ataque': return { icon: '⚔️', color: 'orange', title: 'Ataque a ' + ln(m.loan), sign: -1 };
    case 'precancel': return { icon: '⚡', color: 'yellow', title: 'Precancelación · ' + ln(m.loan), sign: -1 };
    case 'pagotc': return { icon: '💳', color: 'blue', title: 'Pago de ' + ((card(m.card) || {}).name || 'tarjeta'), sign: -1 };
    case 'pagoiva': return { icon: '🧾', color: 'gray', title: 'Pago de IVA' + (m.periodo ? ' · ' + ymLabel(m.periodo) : ''), sign: -1 };
    case 'mover': return { icon: '↔️', color: 'gray', title: fundName(m.from) + ' → ' + fundName(m.to), sign: 0 };
    case 'aporte': return { icon: (goal(m.goal) || {}).icon || '🎯', color: (goal(m.goal) || {}).color || 'gray', title: 'Aporte a ' + ((goal(m.goal) || {}).name || 'meta'), sign: 0 };
    case 'retiro': return { icon: (goal(m.goal) || {}).icon || '🎯', color: 'gray', title: 'Retiro de ' + ((goal(m.goal) || {}).name || 'meta'), sign: 0 };
    case 'cero': return { icon: '🧘', color: 'teal', title: 'Día sin gastos', sign: 0 };
  }
  return { icon: '•', color: 'gray', title: 'Movimiento', sign: 0 };
}
function movRow(m) {
  const mm = movMeta(m);
  const tags = [];
  if (m.medio === 'tc') tags.push('<span class="pill" style="--c:var(--red)">TC</span>');
  if (m.ivaAmt) tags.push(`<span class="pill">IVA ${m.iva}%</span>`);
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
  return `${lt('Movimientos', '', `<button class="icbtn" data-act="add" aria-label="Agregar">${I.plus}</button>`)}
  <div class="monthnav"><button class="icbtn" data-act="mk" data-d="-1" aria-label="Mes anterior">${I.left}</button><b>${ymLabel(k)}</b><button class="icbtn" data-act="mk" data-d="1" aria-label="Mes siguiente" ${k >= ym(today()) ? 'disabled style="opacity:.3"' : ''}>${I.right}</button></div>
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
      <span style="--c:var(--indigo)">Negocio <b>${gsK(sm.gNeg)}</b></span>
      <span style="--c:var(--red)">Deudas <b>${gsK(sm.deudas)}</b></span>
      <span style="--c:var(--gray)">IVA pagado <b>${gsK(sm.iva)}</b></span>
    </div>
    ${sm.tc || sm.pagotc ? `<p class="gf" style="margin:10px 0 0">💳 Compras con tarjeta: <b>${gs(sm.tc)}</b> (ya cuentan como gasto). Pagos de tarjeta: ${gs(sm.pagotc)}.</p>` : ''}
  </div>
  <div class="seg mt2">${segBtns('mf', 'mf', [['todos', 'Todos'], ['gastos', 'Gastos'], ['ingresos', 'Ingresos'], ['deudas', 'Deudas']], MF)}</div>
  ${Object.keys(days).length ? Object.entries(days).map(([d, ms]) => `<div class="gh">${cap(dayL(d))}</div><div class="group ic">${ms.map(movRow).join('')}</div>`).join('')
    : `<div class="card mt2 center"><div style="font-size:40px">🧾</div><p class="s2 mt">Nada registrado${MF !== 'todos' ? ' con este filtro' : ''} en ${ymLabel(k)}.</p><button class="btn p mt" data-act="add">Registrar ahora</button></div>`}`;
}

/* =========================================================================
   Pantalla: Batalla (deudas y tarjetas)
   ========================================================================= */
function bossCard(l, isTarget) {
  const s = loanSaldo(l), tot = loanTotal(l), dead = s <= 0, nc = nextCuota(l), rest = l.cuotas.filter(c => !c.paid).length;
  const pos = attackOrder().list.findIndex(x => x.id === l.id);
  return `<div class="card boss ${dead ? 'dead' : ''} ${isTarget ? 'target' : ''}">
    ${isTarget ? '<span class="pill tag" style="--c:var(--orange)">🎯 OBJETIVO</span>' : dead ? '<span class="pill tag" style="--c:var(--green)">DERROTADO</span>' : `<span class="pill tag">#${pos + 1}</span>`}
    <div class="head"><div class="em">${dead ? '💀' : esc(l.emoji)}</div><div class="grow"><h3>${esc(l.name)}</h3>
      <small>${dead ? (l.precancel ? 'Precancelado · ahorro ' + gs(l.precancel.ahorro) : 'Pagado completo') : rest + (rest === 1 ? ' cuota' : ' cuotas') + ' · termina ' + dLabel(lastDate(l)) + (taeN(l) ? ' · TAE ' + esc(l.tae) + '%' : '')}</small></div></div>
    <div class="row between mt"><span class="hpn">${gs(s)}</span><small>de ${gsK(tot)}</small></div>
    <div class="mt">${bar(tot ? s / tot * 100 : 0, 'hpbar lg')}</div>
    <div class="btns mt">${dead ? `<button class="btn sm plain" data-act="loanDetail" data-id="${l.id}">Ver detalle</button>` : `
      <button class="btn sm p" style="--c:var(--green)" data-act="payCuota" data-id="${l.id}">Pagar cuota ${nc.n}</button>
      <button class="btn sm" style="--c:var(--orange)" data-act="attack" data-id="${l.id}">⚔️ Atacar</button>
      <button class="btn sm plain" style="flex:0 0 auto" data-act="loanDetail" data-id="${l.id}" aria-label="Detalle">•••</button>`}</div>
  </div>`;
}
function cardBoss(c) {
  const used = c.linea ? c.saldo / c.linea * 100 : 0;
  return `<div class="card boss ${c.saldo > 0 ? '' : 'dead'}">
    ${c.saldo > 0 ? '' : '<span class="pill tag" style="--c:var(--green)">DOMADA</span>'}
    <div class="head"><div class="em" style="background:linear-gradient(135deg,#1c1c1e,#5e5ce6)">💳</div><div class="grow"><h3>${esc(c.name)}</h3><small>TAN ${esc(c.tan || '—')}% · usás ${used.toFixed(0)}% de la línea</small></div></div>
    <div class="row between mt"><span class="hpn">${gs(c.saldo)}</span><small>línea ${gsK(c.linea)}</small></div>
    <div class="mt">${bar(used, 'lg', used > 30 ? 'var(--orange)' : 'var(--blue)')}</div>
    ${c.extracto > 0 ? `<div class="note mt">Extracto <b>${gs(c.extracto)}</b>${c.vence ? ' · vence <b>' + dLabel(c.vence) + '</b>' : ''}. Pagar solo el mínimo (${gs(c.minimo)}) genera intereses sobre el resto: <b>pagá siempre el total</b>.</div>` : ''}
    <div class="btns mt"><button class="btn sm p" data-act="payCard" data-id="${c.id}">Pagar tarjeta</button><button class="btn sm plain" data-act="editCard" data-id="${c.id}">Actualizar</button></div>
  </div>`;
}
function vBatalla() {
  const ord = attackOrder(), k = ym(today()), dead = S.loans.filter(l => loanSaldo(l) <= 0);
  const why = ord.mode === 'tae'
    ? 'Orden por <b>tasa (TAE) de mayor a menor</b>: método avalancha, el que menos intereses te cobra en total.'
    : 'Faltan TAE, así que el orden es por <b>flujo liberado</b>: primero el que te devuelve más cuota mensual por cada guaraní que pagás. Cargá las TAE (botón •••) y el orden se recalcula solo.';
  const months = Array.from({ length: 12 }, (_, i) => addMonth(k, i));
  const vals = months.map(m => sum(S.loans, l => sum(l.cuotas.filter(c => !c.paid && ym(c.d) === m), c => c.a)));
  const mx = Math.max(1, ...vals);
  return `${lt('Batalla', `${ord.list.length} ${ord.list.length === 1 ? 'jefe vivo' : 'jefes vivos'}`, `<button class="icbtn" data-act="addDebt" aria-label="Agregar deuda">${I.plus}</button>`)}
  <div class="g2">
    <div class="tile"><div class="k">Deuda total</div><div class="n">${gsK(totalDebt())}</div><div class="f">${pctFree().toFixed(1)}% eliminado</div></div>
    <div class="tile"><div class="k">Para deudas / mes</div><div class="n">${gsK(debtBudget())}</div><div class="f">cuotas ${gsK(S.baseCuotas)} + ataque ${gsK(S.settings.ataqueMensual)}</div></div>
  </div>
  ${S.cards.length ? sh('Tarjetas') + S.cards.map(cardBoss).join('') : ''}
  ${ord.list.length ? sh('Orden de ataque') + `<p class="gf" style="margin:-2px 2px 12px">${why}</p>` + ord.list.map((l, i) => bossCard(l, i === 0)).join('') : ''}
  ${!S.loans.length && !S.cards.length ? `<div class="card center"><div style="font-size:48px">🐉</div><h3 class="mt">Cargá tus deudas</h3><p class="s2 mt" style="font-size:15px">Cada préstamo es un jefe con barra de vida. Cada pago le quita vida.</p><button class="btn p mt2" data-act="addDebt">Agregar deuda</button></div>` : ''}
  ${vals.some(v => v) ? sh('Cuotas de los próximos 12 meses') + `<div class="card"><div class="chart">${months.map((m, i) => `<div><i style="height:${(vals[i] / mx * 82).toFixed(1)}%"></i><small>${MESES[+m.slice(5) - 1]}</small></div>`).join('')}</div>
    <p class="gf" style="margin:10px 0 0">Sin contar ataques. Cada barra que baja es una cuota que se libera: esa plata va al siguiente jefe, no a gastos.</p></div>` : ''}
  ${dead.length ? sh('Derrotados 🏆') + dead.map(l => bossCard(l, false)).join('') : ''}`;
}

/* =========================================================================
   Pantalla: Negocio
   ========================================================================= */
const LADDER = [[1e6, 'Freelancer'], [2.5e6, 'Emprendedor'], [5e6, 'Negocio'], [10e6, 'Empresa'], [20e6, 'Imperio']];
function vNegocio() {
  const k = ym(today()), st = S.settings, mes = MESES_L[+k.slice(5) - 1];
  const ventas = inMonth(k, ['venta']);
  const fact = sum(ventas, m => m.amt), cofre = sum(ventas, m => m.toCofre);
  const meta = st.metaFacturacion || 1, pc = fact / meta * 100;
  const iva = ivaMonth(k), best = Math.max(bestMonthFact(), fact), caja = goal('emprender');
  const last = M.filter(m => m.t === 'venta' || (m.t === 'gasto' && m.ambito === 'negocio')).sort(byDateDesc).slice(0, 8);
  return `${lt('Negocio', 'Emprender full', `<button class="icbtn" data-act="add" data-t="venta" aria-label="Nueva venta">${I.plus}</button>`)}
  <div class="card">
    <div class="row between"><small style="font-weight:600">Facturación de ${mes}</small>${pc >= 100 ? '<span class="pill" style="--c:var(--green)">🎉 Meta cumplida</span>' : ''}</div>
    <div class="num" style="font-size:34px;font-weight:800;letter-spacing:-.02em">${gs(fact)}</div>
    <div class="mt">${bar(pc, 'lg', 'var(--green)')}</div>
    <div class="row between" style="margin-top:6px"><small>${pc.toFixed(0)}% de la meta</small><small>meta ${gs(meta)}</small></div>
    <div class="g3 mt2">
      <div class="kv"><div class="k">Ventas</div><div class="n">${ventas.length}</div></div>
      <div class="kv"><div class="k">Ticket prom.</div><div class="n">${gsK(ventas.length ? fact / ventas.length : 0)}</div></div>
      <div class="kv"><div class="k">💎 Al cofre</div><div class="n" style="color:var(--orange)">${gsK(cofre)}</div></div>
    </div>
    <div class="ladder">${LADDER.map(([v, n]) => `<div class="${best >= v ? 'on' : ''}"><i></i>${n}<br><span class="s2">${gsK(v)}</span></div>`).join('')}</div>
    <p class="gf" style="margin:10px 0 0">Escalera de facturación mensual. Tu mejor mes: <b>${gs(best)}</b>.</p>
  </div>
  <div class="g2 mt">
    <button class="tile" data-act="goal" data-id="emprender" style="text-align:left;border:0;font:inherit;color:inherit;cursor:pointer"><div class="k">🚀 Caja del negocio</div><div class="n" style="color:${caja.saved < 0 ? 'var(--red)' : 'var(--indigo)'}">${gsK(caja.saved)}</div><div class="f">meta inicial ${gsK(caja.target)}</div></button>
    <div class="tile"><div class="k">🧾 Sobre IVA</div><div class="n">${gsK(S.funds.iva)}</div><div class="f">no es tuyo: es del fisco</div></div>
  </div>
  ${sh('IVA de ' + mes)}
  <div class="group">
    <div class="cell"><div class="tx"><div class="t">IVA débito</div><div class="s">De tus ventas</div></div><div class="v num">${gs(iva.deb)}</div></div>
    <div class="cell"><div class="tx"><div class="t">IVA crédito</div><div class="s">Compras del negocio con factura</div></div><div class="v num">− ${gs(iva.cred)}</div></div>
    <div class="cell"><div class="tx"><div class="t" style="font-weight:600">A pagar (estimado)</div><div class="s">Se declara el mes que viene</div></div><div class="v num" style="font-weight:700">${gs(Math.max(0, iva.deb - iva.cred))}</div></div>
    ${iva.deb < iva.cred ? `<div class="cell"><div class="tx"><div class="t">Saldo a favor</div><div class="s">Se arrastra al mes siguiente</div></div><div class="v num pos">${gs(iva.cred - iva.deb)}</div></div>` : ''}
    <div class="cell"><div class="tx"><div class="t">IVA pagado como consumidor</div><div class="s">Tus gastos personales con IVA</div></div><div class="v num dim">${gs(iva.pers)}</div></div>
  </div>
  <div class="btns mt"><button class="btn sm" data-act="payIva">Registrar pago de IVA</button><button class="btn sm" style="--c:var(--orange)" data-act="moveFund" data-from="iva" data-to="cofre">Sobrante → cofre</button></div>
  <p class="gf">Paraguay: IVA 10% (tasa general) o 5% (canasta básica y algunos rubros), incluido en el precio: IVA 10% = total ÷ 11 · IVA 5% = total ÷ 21. Se declara cada mes según la terminación de tu RUC. Confirmá tu régimen (IVA, IRE, IRP) con un contador.</p>
  ${sh('Últimos movimientos del negocio')}
  ${last.length ? `<div class="group ic">${last.map(movRow).join('')}</div>` : `<div class="card center"><p class="s2">Todavía no hay ventas. La primera desbloquea un logro 💰</p><button class="btn p mt" data-act="add" data-t="venta">Registrar venta</button></div>`}
  ${sh('Plan comercial')}
  <div class="group steps">${[
    ['Una oferta, un precio', 'Empaquetá un servicio concreto con precio cerrado (ej: bot de WhatsApp para pymes, automatización de reportes, sistema a medida).'],
    ['Demo antes que propuesta', 'Mostrá algo funcionando en 48 h. Vende más que cualquier PDF.'],
    ['10 contactos por semana', 'WhatsApp, LinkedIn, ex compañeros y referidos. Registrá cada venta acá.'],
    ['50% por adelantado', 'Y 50% contra entrega. Nunca financies a tu cliente.'],
    ['Factura desde el día 1', 'Con IVA separado: la app lo manda solo al sobre IVA.'],
    ['Ingreso recurrente', 'Mantenimiento mensual > proyectos sueltos. Así la facturación deja de ser una montaña rusa.'],
    ['El negocio paga lo suyo', 'Herramientas y publicidad salen de la caja del negocio, nunca de la tarjeta personal.']
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
  ['Registrar todo, todos los días.', 'Lo que se mide se controla. 10 segundos por gasto. La racha 🔥 es el hábito.']
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
      ['t9', 'Cada venta: el IVA a su sobre y el % elegido de la ganancia al cofre.'],
      ['t10', 'Cuando cae un jefe, su cuota NO se gasta: se suma al ataque del siguiente.'],
      ['t11', 'Revisión: domingo 10 min acá · fin de mes, el prompt de revisión con Claude.']]],
    ['Fase 3 · Libre', [
      ['t12', `Mantener los ${gs(debtBudget())}/mes, ahora hacia: colchón de 6 meses, viajes, inversión y negocio.`]]]
  ];
}
function worlds() {
  const p = pctFree(), free = isFree(), proj = projection(true), k = ym(today());
  const fact = factMonth(k), meta = S.settings.metaFacturacion || 1;
  const trips = S.goals.filter(g => g.kind === 'viaje'), tS = sum(trips, g => g.saved), tT = sum(trips, g => g.target);
  return `
  <div class="world" style="--c:var(--red)"><div class="dot">🐉</div><div class="tx"><h3>Mundo 1 · Matar la deuda</h3><small>${free ? '¡Completado! 👑' : 'Libre en ' + ymLabel(proj) + ' (estimado)'}</small><div class="mt">${bar(free ? 100 : p, '', 'var(--red)')}</div><small>${(free ? 100 : p).toFixed(1)}% eliminado</small></div></div>
  <div class="world" style="--c:var(--green)"><div class="dot">🚀</div><div class="tx"><h3>Mundo 2 · Emprender full</h3><small>Facturar ${gsK(meta)}/mes de forma constante</small><div class="mt">${bar(fact / meta * 100, '', 'var(--green)')}</div><small>Este mes: ${gsK(fact)} de ${gsK(meta)}</small></div></div>
  <div class="world ${travelOpen() ? '' : 'locked'}" style="--c:var(--cyan)"><div class="dot">✈️</div><div class="tx"><h3>Mundo 3 · Viajes ${travelOpen() ? '' : '🔒'}</h3><small>${trips.map(g => g.icon + ' ' + esc(g.name)).join(' · ')}</small><div class="mt">${bar(tT ? tS / tT * 100 : 0, '', 'var(--cyan)')}</div><small>${travelOpen() ? gsK(tS) + ' de ' + gsK(tT) + ' ahorrados' : 'Se desbloquea al ser libre · ' + ymLabel(proj)}</small></div></div>`;
}
function distCard() {
  const st = S.settings, ing = st.base + st.extra;
  if (!ing) return `<div class="card"><p class="why">Cargá tu sueldo y tus horas extra en <button class="link" data-act="settings">Ajustes del plan</button> para ver cómo repartir tu plata.</p></div>`;
  const items = S.budget.map(b => ({ n: b.name, c: `var(--${b.color})`, v: budAmt(b), tipo: b.tipo })).concat([{ n: 'Ataque al cofre', c: 'var(--yellow)', v: st.ataqueMensual, tipo: 'deuda' }]);
  const libre = ing - sum(items, x => x.v);
  if (libre > 0) items.push({ n: 'Sin asignar', c: 'var(--gray)', v: libre, tipo: 'libre' });
  const P = v => v / ing * 100, by = t => sum(items.filter(x => x.tipo === t), x => x.v);
  const shown = items.filter(x => x.v > 0);
  return `<div class="card">
    <small style="font-weight:600">Ingreso mensual del plan</small>
    <div class="num" style="font-size:30px;font-weight:800;letter-spacing:-.02em">${gs(ing)}</div>
    <small>Sueldo base ${gsK(st.base)} + horas extra ${gsK(st.extra)}</small>
    <div class="stack mt">${shown.map(x => `<i style="width:${P(x.v)}%;background:${x.c}" title="${esc(x.n)}"></i>`).join('')}</div>
    <div class="legend">${shown.map(x => `<span style="--c:${x.c}">${esc(x.n)} <b>${P(x.v).toFixed(0)}%</b></span>`).join('')}</div>
    <div class="g3 mt2">
      <div class="kv"><div class="k">Necesidades</div><div class="n">${P(by('nec')).toFixed(0)}%</div></div>
      <div class="kv"><div class="k">Gustos</div><div class="n">${P(by('deseo')).toFixed(0)}%</div></div>
      <div class="kv"><div class="k">Deuda</div><div class="n" style="color:var(--red)">${P(by('deuda')).toFixed(0)}%</div></div>
    </div>
    <p class="gf" style="margin:10px 0 0">La regla clásica es 50/30/20 (necesidades / gustos / ahorro). En modo batalla se invierte: la mayor parte va a matar la deuda. Al ser libre pasás a 50/20/30, con viajes, colchón e inversión.</p>
    ${libre < 0 ? `<div class="note mt" style="color:var(--red)"><b style="color:var(--red)">⚠️ Asignaste ${gs(-libre)} más de lo que ganás.</b> Bajá algún sobre o el ataque mensual.</div>` : ''}
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
      : ['⚠️ El sueldo base no alcanza', `Fijos + sobres superan el base por ${gs(-libreBase)}. Recortá sobres para no depender de las horas extra.`],
    ['Horas extra = munición', `${gs(st.ataqueMensual)}/mes al 💎 cofre${tgt ? ' → atacá a <b>' + esc(tgt.name) + '</b>' : ''}. Si un mes no hay extras, tu vida no se cae: solo atacás más lento.`],
    ['Cada venta', `El IVA va a su sobre (no es tuyo). De lo que queda, ${st.pctVenta}% al cofre y el resto a la caja del negocio.`],
    ['Cuando cae un jefe', 'Su cuota NO se gasta: se suma al ataque del siguiente. El monto mensual para deudas queda fijo hasta ser libre.'],
    ['Cuando seas libre', `Los ${gs(debtBudget())}/mes que hoy van a deudas se reparten: 40% colchón de 6 meses e inversión · 30% viajes · 30% negocio.`]
  ].map(([t, p]) => `<div class="step"><span class="nb"></span><div><b>${t}</b><p>${p}</p></div></div>`).join('');
}
function sobreRow(b) {
  const k = ym(today()), amt = budAmt(b), sp = monthSpent(b.id, k), pc = amt ? sp / amt * 100 : 0;
  const col = b.fijo ? 'var(--gray)' : pc > 100 ? 'var(--red)' : pc > 80 ? 'var(--orange)' : `var(--${b.color})`;
  return `<button class="cell" data-act="budget" data-id="${b.id}">${icoBox(esc(b.icon), b.color)}<div class="tx">
    <div class="row between"><span class="t">${esc(b.name)}</span><span class="num" style="font-size:15px;flex:none">${gsK(sp)} <span class="s2">/ ${gsK(amt)}</span></span></div>
    <div style="margin-top:7px">${bar(pc, '', col)}</div></div>${I.chev}</button>`;
}
function goalRow(g) {
  const pc = g.target ? g.saved / g.target * 100 : 0, locked = g.kind === 'viaje' && !travelOpen();
  return `<button class="cell" data-act="goal" data-id="${g.id}">${icoBox(esc(g.icon), g.color)}<div class="tx">
    <div class="row between"><span class="t">${esc(g.name)}${locked ? ' 🔒' : ''}</span><span class="num" style="font-size:15px;flex:none">${gsK(g.saved)} <span class="s2">/ ${gsK(g.target)}</span></span></div>
    <div style="margin-top:7px">${bar(pc, '', `var(--${g.color})`)}</div></div>${I.chev}</button>`;
}
function vPlan() {
  const F = fases(), total = sum(F, f => f[1].length), done = F.reduce((a, f) => a + f[1].filter(t => S.tasks[t[0]]).length, 0);
  const cloud = BK && BK.kind === 'cloud';
  return `${lt('Plan', 'Tu estrategia', `<button class="icbtn" data-act="settings" aria-label="Ajustes">${I.gear}</button>`)}
  ${sh('Mapa del juego')}
  <div class="card">${worlds()}</div>
  ${sh('Tu plata, paso a paso')}
  ${distCard()}
  <div class="group steps mt">${stepsHtml()}</div>
  ${sh('Sobres del mes', '<button class="link" data-act="newBudget">Agregar</button>')}
  <div class="group ic">${S.budget.map(sobreRow).join('')}</div>
  ${sh('Metas')}
  <div class="group ic">${S.goals.map(goalRow).join('')}</div>
  <p class="gf">Los viajes se desbloquean al vencer la deuda: ahí todo lo que hoy va a deudas se redirige. Los montos son estimados: ajustalos cuando coticés.</p>
  ${sh('Misiones', `<small>${done}/${total}</small>`)}
  ${F.map(f => `<div class="gh">${f[0]}</div><div class="group">${f[1].map(t => `<label class="task ${S.tasks[t[0]] ? 'done' : ''}"><input type="checkbox" ${S.tasks[t[0]] ? 'checked' : ''} data-change="task" data-id="${t[0]}"><span>${t[1]}</span></label>`).join('')}</div>`).join('')}
  ${sh('Más')}
  <div class="group ic">
    <button class="cell" data-act="rules">${icoBox('📜', 'yellow')}<div class="tx"><div class="t">Las 7 reglas del juego</div></div>${I.chev}</button>
    <button class="cell" data-act="prompt">${icoBox('🤖', 'purple')}<div class="tx"><div class="t">Revisión mensual con Claude</div><div class="s">Prompt con tus datos actualizados</div></div>${I.chev}</button>
    <button class="cell" data-act="settings">${icoBox('⚙️', 'gray')}<div class="tx"><div class="t">Ingresos y ajustes del plan</div></div>${I.chev}</button>
    <button class="cell" data-act="account">${icoBox('☁️', 'blue')}<div class="tx"><div class="t">Cuenta y datos</div><div class="s"><span class="sync ${cloud ? 'ok' : 'local'}" id="syncDot"></span>${cloud ? esc(USER && USER.email) : 'Solo en este dispositivo'}</div></div>${I.chev}</button>
  </div>
  <p class="gf center" style="margin-top:26px">Libre · v2</p>`;
}

/* =========================================================================
   Hoja: registrar movimiento
   ========================================================================= */
let REG = { t: 'gasto', amb: 'personal', cat: 'super', medio: 'debito', card: '', iva: 'none', ivaV: '10', tipo: 'extra', touched: false, pct: null, d: {} };
function openAdd(t) {
  if (t) REG.t = t;
  REG.touched = false; REG.pct = null; REG.d = { date: today() };
  if (!S.cards.find(c => c.id === REG.card)) REG.card = S.cards[0] ? S.cards[0].id : '';
  if (!S.budget.find(b => b.id === REG.cat && b.id !== 'cuotas')) REG.cat = (S.budget.find(b => b.id !== 'cuotas') || {}).id;
  openSheet(addHtml()); mountAdd();
}
function saveDraft() {
  const v = id => { const e = $('#' + id); return e ? e.value : undefined; };
  const d = { amt: v('fAmt'), date: v('fDate'), note: v('fNote'), cli: v('fCli') };
  $$('#sheet [data-split]').forEach(i => { d[i.id] = i.value; });
  const p = $('#fPct'); if (p) REG.pct = +p.value;
  REG.d = d;
}
function rerenderAdd() { saveDraft(); const sc = $('#sheet').scrollTop; $('#sheet').innerHTML = '<div class="grab"></div>' + addHtml(); $('#sheet').scrollTop = sc; mountAdd(false); }
function addHtml() {
  const t = REG.t, d = REG.d;
  let body = '';
  if (t === 'gasto') {
    const neg = REG.amb === 'negocio';
    const cats = S.budget.filter(b => b.id !== 'cuotas');
    body = `
    <div class="seg mt">${segBtns('reg', 'amb', [['personal', '🙋 Personal'], ['negocio', '💼 Negocio']], REG.amb)}</div>
    ${neg ? '' : `<div class="gh">Sobre</div><div class="chips">${cats.map(c => `<button class="chip ${REG.cat === c.id ? 'on' : ''}" data-act="reg" data-k="cat" data-v="${c.id}">${esc(c.icon)} ${esc(c.name)}</button>`).join('')}</div>`}
    <div class="gh">Pagado con</div>
    <div class="seg">${segBtns('reg', 'medio', neg ? [['caja', '🚀 Caja'], ['tc', '💳 Tarjeta'], ['debito', '🏦 Personal']] : [['debito', '🏦 Débito'], ['efectivo', '💵 Efectivo'], ['tc', '💳 Tarjeta']], REG.medio)}</div>
    ${REG.medio === 'tc' ? (S.cards.length > 1 ? `<div class="chips mt">${S.cards.map(c => `<button class="chip ${REG.card === c.id ? 'on' : ''}" data-act="reg" data-k="card" data-v="${c.id}">💳 ${esc(c.name)}</button>`).join('')}</div>` : '')
      + `<p class="gf">${S.cards.length ? '⚠️ Con tarjeta, el jefe 💳 recupera vida. Solo si vas a pagar el total del extracto.' : 'No tenés tarjetas cargadas: agregala en Batalla.'}</p>` : ''}
    <div class="gh">IVA incluido</div>
    <div class="seg">${segBtns('reg', 'iva', [['none', 'Sin dato'], ['10', '10%'], ['5', '5%'], ['ex', 'Exento']], REG.iva)}</div>
    <p class="gf">${neg ? 'Con factura a tu RUC, este IVA es <b>crédito fiscal</b>: se descuenta del IVA de tus ventas.' : 'Informativo: cuánto IVA pagás como consumidor.'}</p>`;
  } else if (t === 'ingreso') {
    const why = {
      sueldo: 'El sueldo base cubre la vida y las cuotas: vive en tus sobres. No hace falta repartirlo.',
      extra: 'Regla del plan: las horas extra son munición. Van al 💎 cofre de ataque (y un poco al colchón si no está completo).',
      aguinaldo: 'El golpe del año: completá colchón y caja del negocio; todo el resto al cofre para precancelar.',
      otro: 'Ingreso extraordinario: idealmente, la mayor parte al cofre.'
    }[REG.tipo];
    const rows = [['cofre', '💎 Al cofre'], ['colchon', '🛟 Al colchón'], ['emprender', '🚀 A la caja del negocio']]
      .concat(travelOpen() ? S.goals.filter(g => g.kind === 'viaje').map(g => [g.id, g.icon + ' ' + g.name]) : []);
    body = `
    <div class="gh">Tipo</div>
    <div class="chips">${[['sueldo', '🏛️ Sueldo'], ['extra', '⏱️ Horas extra'], ['aguinaldo', '🎁 Aguinaldo'], ['otro', '✨ Otro']].map(([v, l]) => `<button class="chip ${REG.tipo === v ? 'on' : ''}" data-act="reg" data-k="tipo" data-v="${v}">${l}</button>`).join('')}</div>
    <p class="note mt">${why}</p>
    <div class="gh">Repartir</div>
    <div class="group">${rows.map(([k, l]) => field(l, `<input id="sp_${k}" data-money data-split inputmode="numeric" placeholder="0" value="${esc(d['sp_' + k] || '')}">`)).join('')}</div>
    <p class="gf" id="splitInfo">Lo que no repartas queda para vivir.</p>`;
  } else {
    const pct = REG.pct ?? S.settings.pctVenta;
    body = `
    <div class="group mt">${field('Cliente', `<input id="fCli" placeholder="Ej: bot WhatsApp ferretería" value="${esc(d.cli || '')}">`)}</div>
    <div class="gh">IVA incluido en el precio</div>
    <div class="seg">${segBtns('reg', 'ivaV', [['10', '10%'], ['5', '5%'], ['ex', 'Exento']], REG.ivaV)}</div>
    <div class="gh">De la ganancia, al cofre de deuda: <b id="pctL">${pct}%</b></div>
    <div class="card" style="padding:12px 16px"><input id="fPct" type="range" min="0" max="100" step="5" value="${pct}" aria-label="Porcentaje al cofre"></div>
    <div class="group mt" id="ventaPrev"></div>`;
  }
  return `${head('Nuevo movimiento', '<button class="link b" data-act="saveAdd">Guardar</button>', '<button class="link" data-act="close">Cancelar</button>')}
  <div class="seg">${segBtns('reg', 't', [['gasto', 'Gasto'], ['ingreso', 'Ingreso'], ['venta', 'Venta']], t)}</div>
  <div class="amount"><div class="cur">GUARANÍES</div><input id="fAmt" data-money inputmode="numeric" placeholder="0" autocomplete="off" value="${esc(d.amt || '')}" aria-label="Monto"></div>
  ${body}
  <div class="group mt2">
    ${field('Fecha', `<input id="fDate" type="date" value="${esc(d.date || today())}">`)}
    ${field('Nota', `<input id="fNote" placeholder="Opcional" value="${esc(d.note || '')}">`)}
  </div>
  <button class="btn p w mt2" data-act="saveAdd">Guardar ${t === 'gasto' ? 'gasto' : t === 'ingreso' ? 'ingreso' : 'venta'}</button>`;
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
function ventaCalc(amt, iva, pct) {
  const ivaAmt = ivaOf(amt, iva), neto = amt - ivaAmt, cofre = Math.round(neto * pct / 100);
  return { iva: ivaAmt, neto, cofre, emp: neto - cofre };
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
    const v = ventaCalc(amt, REG.ivaV, p), box = $('#ventaPrev');
    if (box) box.innerHTML = [
      ['Cobrado', gs(amt)], ['🧾 IVA → sobre IVA (no es tuyo)', gs(v.iva)], ['Neto para vos', gs(v.neto)],
      ['💎 Al cofre de ataque', `<b style="color:var(--orange)">${gs(v.cofre)}</b>`], ['🚀 A la caja del negocio', gs(v.emp)]
    ].map(([a, b]) => `<div class="cell"><div class="tx s2" style="font-size:15px">${a}</div><div class="v num">${b}</div></div>`).join('');
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
    applyMov(m); addXP(5);
    if (m.ambito === 'personal') {
      const b = S.budget.find(x => x.id === m.cat), spent = monthSpent(m.cat, ym(date)) + amt;
      msg = b && b.amt ? (spent > b.amt ? `⚠️ Te pasaste del sobre ${b.name} por ${gs(spent - b.amt)}` : `✔️ Quedan ${gs(b.amt - spent)} en ${b.name}`) : '✔️ Gasto guardado';
    } else msg = '✔️ Gasto del negocio guardado';
  } else if (REG.t === 'ingreso') {
    m.tipo = REG.tipo; const split = {}; let tot = 0;
    $$('#sheet [data-split]').forEach(i => { const v = parseN(i.value); if (v) { split[i.id.slice(3)] = v; tot += v; } });
    if (tot > amt) { toast('El reparto supera el monto'); return; }
    m.split = split; applyMov(m); addXP(10 + Math.floor((split.cofre || 0) / 100000));
    msg = '✔️ Ingreso guardado' + (split.cofre ? ' · 💎 +' + gsK(split.cofre) + ' al cofre' : '');
  } else {
    const p = +$('#fPct').value, v = ventaCalc(amt, REG.ivaV, p);
    Object.assign(m, { cliente: $('#fCli').value.trim(), iva: REG.ivaV, ivaAmt: v.iva, ivaRes: S.settings.ivaAuto ? v.iva : 0, neto: v.neto, toCofre: v.cofre, toEmp: v.emp, pct: p });
    S.settings.pctVenta = p; applyMov(m); addXP(30); confetti();
    msg = '💰 ¡Venta! 💎 +' + gsK(v.cofre) + ' al cofre';
  }
  M.push(m); checkin(); toast(msg); haptic(12); checkAch();
  commit({ add: [m] }); closeSheet(); render();
}
function diaCero() {
  const t = today();
  if (M.some(e => e.date === t && e.t === 'gasto')) return toast('Hoy ya registraste gastos 😉');
  if (M.some(e => e.date === t && e.t === 'cero')) return toast('Ya marcaste hoy 🧘');
  const m = { id: uid(), ts: Date.now(), date: t, amt: 0, t: 'cero' };
  M.push(m); checkin(); addXP(15); unlock('cero'); checkAch(); commit({ add: [m] }); render();
}
function movDetail(id) {
  const m = M.find(x => x.id === id); if (!m) return;
  const mm = movMeta(m), rows = [['Fecha', dLabel(m.date)]];
  if (m.t === 'gasto') { rows.push(['Tipo', m.ambito === 'negocio' ? '💼 Negocio' : '🙋 Personal'], ['Pagado con', MEDIO_L[m.medio] || '—']); if (m.ivaAmt) rows.push(['IVA ' + m.iva + '%', gs(m.ivaAmt)]); }
  if (m.t === 'ingreso') Object.entries(m.split || {}).forEach(([k, v]) => rows.push([fundName(k), gs(v)]));
  if (m.t === 'venta') rows.push(['IVA ' + (m.iva === 'ex' ? 'exento' : m.iva + '%'), gs(m.ivaAmt)], ['Neto', gs(m.neto)], ['💎 Al cofre', gs(m.toCofre)], ['🚀 A la caja', gs(m.toEmp)]);
  if (m.t === 'precancel' && m.ahorro) rows.push(['Ahorro en intereses', gs(m.ahorro)]);
  if (m.note) rows.push(['Nota', esc(m.note)]);
  openSheet(`${head('Detalle')}
    <div class="center" style="padding:6px 0 18px"><span class="ico lg" style="--c:var(--${mm.color});margin:0 auto">${mm.icon}</span>
      <div class="mt" style="font-size:17px;font-weight:600">${esc(mm.title)}</div>
      ${m.t === 'cero' ? '' : big((mm.sign < 0 ? '−' : mm.sign > 0 ? '+' : '') + gs(m.amt), mm.sign > 0 ? 'pos' : '')}</div>
    <div class="group">${rows.map(r => `<div class="cell"><div class="tx s2">${r[0]}</div><div class="v">${r[1]}</div></div>`).join('')}</div>
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
function payCuotaSheet(id) {
  const l = loan(id), c = nextCuota(l); if (!c) return;
  openSheet(`${head('Pagar cuota')}
    <div class="center" style="padding:4px 0 14px"><div style="font-size:44px">${esc(l.emoji)}</div><div style="font-weight:600;margin-top:6px">${esc(l.name)}</div><small>Cuota ${c.n} · vence ${dLabel(c.d)}</small></div>
    <div class="group">${field('Monto pagado', money('sAmt', c.a))}</div>
    <button class="btn p w mt2" style="--c:var(--green)" data-act="doPayCuota" data-id="${l.id}">Confirmar pago</button>`);
}
function doPayCuota(id) {
  const l = loan(id), c = nextCuota(l); if (!c) return;
  const amt = parseN($('#sAmt').value) || c.a;
  c.paid = true; c.pd = today();
  const m = { id: uid(), ts: Date.now(), date: today(), amt, t: 'cuota', loan: l.id, n: c.n, note: l.name + ' · cuota ' + c.n };
  M.push(m); addXP(20); checkin(); haptic(15);
  if (loanSaldo(l) <= 0) { toast('🏆 ¡' + l.name + ' derrotado!'); confetti(); } else toast('⚔️ −' + gs(amt) + ' de vida a ' + l.name);
  checkAch(); commit({ add: [m] }); closeSheet(); render();
}
function attackSheet(id) {
  const l = loan(id), s = loanSaldo(l);
  openSheet(`${head('⚔️ Atacar')}
    <div class="center" style="padding:4px 0 14px"><div style="font-size:44px">${esc(l.emoji)}</div><div style="font-weight:600;margin-top:6px">${esc(l.name)}</div><small>Vida: ${gs(s)}</small></div>
    <p class="note">Usalo cuando el banco te acepte un <b>pago anticipado</b> (adelanto de cuotas o amortización extraordinaria). Se descuenta desde la <b>última cuota</b> hacia atrás: así terminás antes.</p>
    <div class="group mt"><div class="cell"><div class="tx">💎 En el cofre</div><div class="v num" style="color:var(--orange)">${gs(S.funds.cofre)}</div></div>
      ${field('Monto del ataque', money('sAmt', Math.max(0, Math.min(S.funds.cofre, s))))}</div>
    <button class="btn p w mt2" style="--c:var(--orange)" data-act="doAttack" data-id="${l.id}">⚔️ Atacar</button>`);
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
  const fromCofre = Math.max(0, Math.min(S.funds.cofre, amt)); S.funds.cofre -= fromCofre;
  const m = { id: uid(), ts: Date.now(), date: today(), amt, t: 'ataque', loan: l.id, note: l.name, undo: diffUndo(before, l), fromCofre };
  M.push(m); addXP(20 + Math.floor(amt / 100000)); checkin(); haptic(25); confetti();
  toast(loanSaldo(l) <= 0 ? '🏆 ¡' + l.name + ' derrotado!' : '💥 ¡Golpe de ' + gs(amt) + '!');
  checkAch(); commit({ add: [m] }); closeSheet(); render();
}
function precancelSheet(id) {
  const l = loan(id), s = loanSaldo(l);
  openSheet(`${head('⚡ Precancelar')}
    <div class="center" style="padding:4px 0 14px"><div style="font-size:44px">${esc(l.emoji)}</div><div style="font-weight:600;margin-top:6px">${esc(l.name)}</div><small>Suma de cuotas: ${gs(s)}</small></div>
    <p class="note">Pedí al banco el <b>saldo de precancelación</b>: suele ser menor que la suma de cuotas porque descuentan los intereses futuros. Ese descuento es tu premio.</p>
    <div class="group mt">${field('Monto real pagado', money('sAmt', '', fmt(s)))}</div>
    <button class="btn p w mt2" style="--c:var(--yellow);color:#000" data-act="doPrecancel" data-id="${l.id}">⚡ Precancelar</button>`);
}
function doPrecancel(id) {
  const l = loan(id), s = loanSaldo(l), paid = parseN($('#sAmt').value);
  if (!paid) return toast('Ingresá el monto pagado');
  const before = snapshot(l);
  l.cuotas.forEach(c => { if (!c.paid) { c.paid = true; c.pd = today(); c.pc = true; } });
  const ahorro = Math.max(0, s - paid);
  l.precancel = { fecha: today(), pagado: paid, ahorro };
  const fromCofre = Math.max(0, Math.min(S.funds.cofre, paid)); S.funds.cofre -= fromCofre;
  const m = { id: uid(), ts: Date.now(), date: today(), amt: paid, t: 'precancel', loan: l.id, note: l.name, ahorro, undo: diffUndo(before, l), fromCofre };
  M.push(m); addXP(100); checkin(); haptic(40); confetti(); setTimeout(confetti, 600);
  toast('⚡ ¡GOLPE CRÍTICO! Te ahorraste ' + gs(ahorro)); unlock('critico');
  checkAch(); commit({ add: [m] }); closeSheet(); render();
}
function loanDetail(id) {
  const l = loan(id), s = loanSaldo(l), dead = s <= 0;
  openSheet(`${head(esc(l.name), `<button class="link" data-act="editLoan" data-id="${l.id}">Editar</button>`)}
    <div class="center" style="padding:4px 0 14px"><div style="font-size:48px">${dead ? '💀' : esc(l.emoji)}</div>${big(gs(s))}<small>${dead ? 'Derrotado' : 'vida restante'}</small></div>
    <div class="group">
      <div class="cell"><div class="tx s2">Cuota</div><div class="v num">${gs(l.cuota)}</div></div>
      <div class="cell"><div class="tx s2">Cuotas que faltan</div><div class="v">${l.cuotas.filter(c => !c.paid).length} de ${l.cuotas.length}</div></div>
      <div class="cell"><div class="tx s2">Termina</div><div class="v">${dLabel(lastDate(l))}</div></div>
      <div class="cell"><div class="tx s2">TAE</div><div class="v">${l.tae ? esc(l.tae) + '%' : '<span class="s2">sin dato</span>'}</div></div>
    </div>
    ${dead ? '' : `<div class="btns mt"><button class="btn" style="--c:var(--orange)" data-act="attack" data-id="${l.id}">⚔️ Atacar</button><button class="btn" style="--c:var(--yellow)" data-act="precancel" data-id="${l.id}">⚡ Precancelar</button></div>`}
    <div class="gh">Cronograma · tocá una cuota para corregirla</div>
    <div class="group">${l.cuotas.map(c => `<button class="cell" ${c.paid ? 'disabled' : `data-act="editCuota" data-id="${l.id}" data-n="${c.n}"`}><div class="tx"><div class="t" style="${c.paid ? 'color:var(--label2);text-decoration:line-through' : ''}">Cuota ${c.n}</div><div class="s">${dLabel(c.d)}${c.paid ? (c.pc ? ' · precancelada' : c.adel ? ' · adelantada' : ' · pagada') : ''}</div></div>
      <div class="v num" style="${c.paid ? 'color:var(--label2)' : ''}">${gs(c.paid ? c.o : c.a)}${!c.paid && c.a !== c.o ? `<small>era ${gsK(c.o)}</small>` : ''}</div></button>`).join('')}</div>
    <button class="btn w mt2" style="--c:var(--red)" data-act="delLoan" data-id="${l.id}">Eliminar deuda</button>
    <p class="gf center">Solo si la cargaste por error. Para pagarla usá Pagar, Atacar o Precancelar.</p>`);
}
const EMOJIS = ['🐉', '👹', '🦂', '🧌', '🐍', '🦖', '👾', '🐙', '🦈', '🕷️'];
function loanForm(id) {
  const l = id ? loan(id) : null, em = l ? l.emoji : EMOJIS[S.loans.length % EMOJIS.length];
  openSheet(`${head(l ? 'Editar deuda' : 'Nuevo préstamo', `<button class="link b" data-act="saveLoan" data-id="${id || ''}">Guardar</button>`, '<button class="link" data-act="close">Cancelar</button>')}
    <div class="group">
      ${field('Nombre', `<input id="lName" placeholder="Ej: Préstamo banco" value="${esc(l ? l.name : '')}">`)}
      ${field('TAE %', `<input id="lTae" inputmode="decimal" placeholder="Opcional" value="${esc(l ? l.tae : '')}">`)}
      ${l ? '' : `${field('Cuota mensual', money('lCuota'))}
      ${field('Cuotas que faltan', '<input id="lN" inputmode="numeric" placeholder="Ej: 12">')}
      ${field('Nº próxima cuota', '<input id="lStart" inputmode="numeric" value="1">')}
      ${field('Vence la próxima', `<input id="lDate" type="date" value="${today()}">`)}`}
    </div>
    <div class="gh">Avatar del jefe</div>
    <input type="hidden" id="lEmoji" value="${esc(em)}">
    <div class="chips">${EMOJIS.map(e => `<button class="chip ${e === em ? 'on' : ''}" data-act="pick" data-target="lEmoji" data-v="${e}" style="font-size:22px;padding:6px 11px">${e}</button>`).join('')}</div>
    <p class="gf">${l ? 'Para corregir montos o fechas, tocá cada cuota en el cronograma.' : 'La TAE la pedís al banco: con ella, el orden de ataque usa el método avalancha (el más barato).'}</p>`);
}
function genSchedule(first, n, startN, amt) {
  const [y, m, d] = first.split('-').map(Number), out = [];
  for (let i = 0; i < n; i++) { const k = addMonth(y + '-' + pad(m), i); out.push({ n: startN + i, d: k + '-' + pad(Math.min(d, lastDay(k))), a: amt, o: amt, paid: false, pd: null }); }
  return out;
}
function saveLoan(id) {
  const name = $('#lName').value.trim(); if (!name) return toast('Poné un nombre');
  const tae = $('#lTae').value.trim(), emoji = $('#lEmoji').value;
  if (id) Object.assign(loan(id), { name, tae, emoji });
  else {
    const amt = parseN($('#lCuota').value), n = parseN($('#lN').value), start = parseN($('#lStart').value) || 1, date = $('#lDate').value;
    if (!amt || !n || !date) return toast('Completá cuota, cantidad y fecha');
    const l = { id: uid(), name, tae, emoji, cuota: amt, cuotas: genSchedule(date, Math.min(n, 120), start, amt) };
    S.loans.push(l); S.initialTotal += loanSaldo(l); S.baseCuotas += amt; addXP(10);
  }
  commit(); closeSheet(); render(); toast(id ? 'Deuda actualizada · orden recalculado' : '🐉 Nuevo jefe: ' + name);
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
      <button class="cell" data-act="newLoan">${icoBox('🐉', 'red', 'lg')}<div class="tx"><div class="t">Préstamo</div><div class="s">Con cuotas fijas: consumo, personal, auto…</div></div>${I.chev}</button>
      <button class="cell" data-act="newCard">${icoBox('💳', 'indigo', 'lg')}<div class="tx"><div class="t">Tarjeta de crédito</div><div class="s">Saldo, extracto y vencimiento</div></div>${I.chev}</button>
    </div>`);
}
function cardForm(id) {
  const c = id ? card(id) : null;
  openSheet(`${head(c ? 'Actualizar tarjeta' : 'Nueva tarjeta', `<button class="link b" data-act="saveCard" data-id="${id || ''}">Guardar</button>`, '<button class="link" data-act="close">Cancelar</button>')}
    <p class="gf" style="margin:0 4px 10px">Copiá los datos de la app del banco.</p>
    <div class="group">
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
    ${c ? `<button class="btn w mt2" style="--c:var(--red)" data-act="delCard" data-id="${c.id}">Eliminar tarjeta</button>` : ''}`);
}
function saveCard(id) {
  const v = { name: $('#cN').value.trim() || 'Tarjeta', saldo: parseN($('#cS').value), linea: parseN($('#cL').value), tan: $('#cT').value.trim(), extracto: parseN($('#cE').value), minimo: parseN($('#cM').value), vence: $('#cV').value };
  if (id) Object.assign(card(id), v);
  else { S.cards.push(Object.assign({ id: uid() }, v)); S.initialTotal += v.saldo; addXP(10); }
  commit(); closeSheet(); render(); toast(id ? 'Tarjeta actualizada' : '💳 Tarjeta agregada');
}
function delCard(id) { const c = card(id); S.initialTotal = Math.max(0, S.initialTotal - Math.max(0, c.saldo)); S.cards = S.cards.filter(x => x.id !== id); commit(); closeSheet(); render(); }
function payCardSheet(id) {
  const c = card(id);
  openSheet(`${head('💳 Pagar tarjeta')}
    <div class="g2"><div class="tile"><div class="k">Extracto (total)</div><div class="n" style="font-size:19px">${gs(c.extracto)}</div></div><div class="tile"><div class="k">Mínimo</div><div class="n neg" style="font-size:19px">${gs(c.minimo)}</div></div></div>
    <div class="group mt">${field('Monto pagado', money('sAmt', c.extracto || c.saldo))}</div>
    <button class="btn p w mt2" data-act="doPayCard" data-id="${c.id}">Confirmar pago</button>`);
}
function doPayCard(id) {
  const c = card(id), amt = parseN($('#sAmt').value); if (!amt) return toast('Ingresá un monto');
  const m = { id: uid(), ts: Date.now(), date: today(), amt, t: 'pagotc', card: c.id, note: c.name, prevSaldo: c.saldo, prevExtracto: c.extracto };
  c.saldo = Math.max(0, c.saldo - amt);
  const full = amt >= c.extracto; M.push(m); addXP(full ? 40 : 10); checkin();
  if (full) { c.extracto = 0; unlock('tc'); toast('💳 ¡Extracto pagado completo!'); } else toast('Pagaste menos que el total: habrá intereses sobre ' + gs(c.extracto - amt));
  checkAch(); commit({ add: [m] }); closeSheet(); render();
}

/* =========================================================================
   Hojas: sobres, metas, IVA, fondos
   ========================================================================= */
function budgetSheet(id) {
  const b = id ? S.budget.find(x => x.id === id) : null, k = ym(today());
  const avg = b ? sum([1, 2, 3], i => monthSpent(b.id, addMonth(k, -i))) / 3 : 0;
  const custom = !b || b.id.startsWith('c_');
  openSheet(`${head(b ? esc(b.name) : 'Nuevo sobre', b && b.auto ? '' : `<button class="link b" data-act="saveBudget" data-id="${id || ''}">Guardar</button>`)}
    ${b ? `<div class="center" style="padding:4px 0 14px"><span class="ico lg" style="--c:var(--${b.color});margin:0 auto">${esc(b.icon)}</span>${big(gs(monthSpent(b.id, k)))}<small>gastado en ${MESES_L[+k.slice(5) - 1]} de ${gs(budAmt(b))}</small></div>` : ''}
    ${b && b.why ? `<div class="card"><div class="why">${esc(b.why)}</div></div>` : ''}
    ${b && b.auto ? '<p class="gf mt">Este monto sale de tus préstamos y se ajusta en Ingresos y ajustes del plan.</p>' : `
    <div class="group mt">
      ${custom ? field('Nombre', `<input id="bN" placeholder="Ej: Mascotas" value="${esc(b ? b.name : '')}">`) + field('Emoji', `<input id="bI" maxlength="4" placeholder="🐶" value="${esc(b ? b.icon : '')}">`) : ''}
      ${field('Monto mensual', money('bAmt', b ? b.amt : ''))}
    </div>
    ${b ? `<p class="gf">Promedio de los últimos 3 meses: <b>${gs(avg)}</b>.</p>` : ''}
    ${custom ? `<div class="gh">Tipo</div><input type="hidden" id="bT" value="${b ? b.tipo : 'nec'}"><div class="seg">${segBtns('pick', '', [['nec', 'Necesidad'], ['deseo', 'Gusto']], b ? b.tipo : 'nec').replace(/data-k=""/g, 'data-target="bT"')}</div>` : ''}
    ${b && custom ? `<button class="btn w mt2" style="--c:var(--red)" data-act="delBudget" data-id="${b.id}">Eliminar sobre</button>` : ''}`}`);
}
function saveBudget(id) {
  const amt = parseN($('#bAmt').value);
  if (id) { const b = S.budget.find(x => x.id === id); b.amt = amt; if ($('#bN')) { b.name = $('#bN').value.trim() || b.name; b.icon = $('#bI').value.trim() || b.icon; b.tipo = $('#bT').value; } }
  else {
    const name = $('#bN').value.trim(); if (!name) return toast('Poné un nombre');
    const cols = ['brown', 'teal', 'indigo', 'yellow', 'pink', 'mint'];
    S.budget.push({ id: 'c_' + uid(), name, icon: $('#bI').value.trim() || '📦', amt, tipo: $('#bT').value, color: cols[S.budget.length % cols.length], why: '' });
  }
  commit(); closeSheet(); render(); toast('Sobre guardado');
}
function delBudget(id) { S.budget = S.budget.filter(b => b.id !== id); commit(); closeSheet(); render(); }
function goalSheet(id) {
  const g = goal(id), locked = g.kind === 'viaje' && !travelOpen(), pc = g.target ? g.saved / g.target * 100 : 0;
  let info = '';
  if (g.kind === 'viaje') {
    const tp = travelPlan().find(x => x.g.id === id);
    info = `<div class="note mt">${locked ? `🔒 <b>Se desbloquea cuando seas LIBRE</b> (estimado ${ymLabel(projection(true))}). ` : ''}Con el 30% de lo que hoy va a deudas (${gs(debtBudget() * 0.3)}/mes), esta meta se completa en ~<b>${tp && tp.n != null ? tp.n + (tp.n === 1 ? ' mes' : ' meses') : '—'}</b>${tp && tp.done ? ' → ' + ymLabel(tp.done) : ''}. El monto es un estimado (pasajes + 4–5 noches + gastos): cotizá y ajustalo.</div>`;
  }
  openSheet(`${head(esc(g.name))}
    <div class="center" style="padding:4px 0 12px"><span class="ico lg" style="--c:var(--${g.color});margin:0 auto">${esc(g.icon)}</span>${big(gs(g.saved))}<small>de ${gs(g.target)} · ${pc.toFixed(0)}%</small></div>
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
  toast(dir === 'in' ? '✔️ +' + gs(amt) + ' a ' + goal(id).name : 'Retiraste ' + gs(amt));
}
function saveGoalTarget(id) { const v = parseN($('#gTarget').value); if (!v) return; goal(id).target = v; commit(); closeSheet(); render(); toast('Meta actualizada'); }
function ivaSheet() {
  const k = ym(today()), prev = addMonth(k, -1), dp = ivaDue(prev), dc = ivaDue(k), per = dp > 0 ? prev : k;
  openSheet(`${head('Pago de IVA', '<button class="link b" data-act="doPayIva">Guardar</button>')}
    <div class="group">
      <div class="cell"><div class="tx">🧾 En el sobre IVA</div><div class="v num">${gs(S.funds.iva)}</div></div>
      <div class="cell"><div class="tx">Pendiente ${ymLabel(prev)}</div><div class="v num">${gs(dp)}</div></div>
      <div class="cell"><div class="tx">Acumulado ${ymLabel(k)}</div><div class="v num">${gs(dc)}</div></div>
    </div>
    <div class="gh">Período que pagás</div>
    <input type="hidden" id="ivP" value="${per}">
    <div class="seg">${[[prev, cap(MESES_L[+prev.slice(5) - 1])], [k, cap(MESES_L[+k.slice(5) - 1])]].map(([v, l]) => `<button class="${v === per ? 'on' : ''}" data-act="pick" data-target="ivP" data-v="${v}">${l}</button>`).join('')}</div>
    <div class="group mt">${field('Monto pagado', money('ivA', per === prev ? dp : dc))}</div>
    <p class="gf">Sale del sobre IVA. Si el sobre no alcanza, la diferencia sale de tu bolsillo.</p>`);
}
function doPayIva() {
  const amt = parseN($('#ivA').value); if (!amt) return toast('Ingresá un monto');
  const m = { id: uid(), ts: Date.now(), date: today(), amt, t: 'pagoiva', periodo: $('#ivP').value, fromRes: Math.max(0, Math.min(S.funds.iva, amt)) };
  applyMov(m); M.push(m); addXP(25); checkin(); checkAch(); commit({ add: [m] }); closeSheet(); render(); toast('🧾 IVA registrado');
}
function fundOpts() {
  return [['cofre', '💎 Cofre'], ['iva', '🧾 Sobre IVA']].concat(S.goals.filter(g => g.kind !== 'viaje' || travelOpen()).map(g => [g.id, g.icon + ' ' + g.name]));
}
function moveSheet(from = 'cofre', to = 'colchon') {
  const k = ym(today()), sug = from === 'iva' ? Math.max(0, S.funds.iva - ivaDue(addMonth(k, -1)) - ivaDue(k)) : 0;
  const sel = (id, cur) => `<select id="${id}">${fundOpts().map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  openSheet(`${head('Mover entre fondos', '<button class="link b" data-act="doMove">Mover</button>')}
    <div class="group">${field('Desde', sel('mvF', from))}${field('Hacia', sel('mvT', to))}${field('Monto', money('mvA', sug))}</div>
    ${from === 'iva' ? `<p class="gf">Sugerido: lo que sobra en el sobre IVA después de cubrir lo pendiente (${gs(ivaDue(addMonth(k, -1)) + ivaDue(k))}). El IVA crédito de tus compras se convierte en munición.</p>` : ''}`);
}
function doMove() {
  const from = $('#mvF').value, to = $('#mvT').value, amt = parseN($('#mvA').value);
  if (!amt || from === to) return toast('Elegí fondos distintos y un monto');
  const m = { id: uid(), ts: Date.now(), date: today(), amt, t: 'mover', from, to };
  applyMov(m); M.push(m); checkin(); checkAch(); commit({ add: [m] }); closeSheet(); render(); toast('↔️ Movido ' + gs(amt));
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
    <div class="gh">Golpe anual (aguinaldo)</div>
    <div class="group">${field('Monto para atacar', money('stLump', st.lump))}${field('Mes', `<input id="stLumpMes" type="month" value="${esc(st.lumpMes)}">`)}
      <label class="cell"><div class="tx">Ya lo recibí</div>${sw('stLumpOk', st.lumpRecibido)}</label></div>
    <div class="gh">Negocio</div>
    <div class="group">${field('Meta de facturación', money('stMeta', st.metaFacturacion))}${field('% de venta al cofre', `<input id="stPct" inputmode="numeric" value="${st.pctVenta}">`)}
      <label class="cell"><div class="tx">Reservar IVA de cada venta</div>${sw('stIva', st.ivaAuto)}</label></div>
    <div class="gh">Metas</div>
    <div class="group"><label class="cell"><div class="tx"><div class="t">Ahorrar viajes antes de ser libre</div><div class="s">No recomendado: le quita munición a la deuda</div></div>${sw('stViajes', st.viajesAntes)}</label></div>
    <div class="gh">Perfil (para el prompt de Claude)</div>
    <div class="group">${field('Nombre', `<input id="stName" placeholder="Opcional" value="${esc(S.profile.nombre)}">`)}
      <div class="cell"><textarea id="stCtx" placeholder="Contexto: profesión, situación laboral, objetivos…">${esc(S.profile.contexto)}</textarea></div></div>
    <div class="gh">Apariencia</div>
    <div class="seg">${segBtns('theme', 'theme', [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']], theme)}</div>`);
}
function saveSettings() {
  const st = S.settings, n = id => parseN($('#' + id).value);
  st.base = n('stBase'); st.extra = n('stExtra'); S.baseCuotas = n('stCuotas'); st.ataqueMensual = n('stAtq');
  st.lump = n('stLump'); st.lumpMes = $('#stLumpMes').value; st.lumpRecibido = $('#stLumpOk').checked;
  st.metaFacturacion = n('stMeta'); st.pctVenta = clamp(n('stPct'), 0, 100); st.ivaAuto = $('#stIva').checked; st.viajesAntes = $('#stViajes').checked;
  S.profile.nombre = $('#stName').value.trim(); S.profile.contexto = $('#stCtx').value.trim();
  commit(); closeSheet(); render(); toast('Plan recalculado: libre en ' + ymLabel(projection(true)));
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
      <div class="cell">${icoBox(cloud ? '☁️' : '📱', cloud ? 'blue' : 'gray')}<div class="tx"><div class="t">${cloud ? esc(USER.email) : 'Solo este dispositivo'}</div><div class="s"><span class="sync ${cloud ? 'ok' : 'local'}" id="syncDot"></span>${cloud ? 'Sincronizado en la nube' : 'Sin cuenta: los datos viven en este navegador'}</div></div></div>
    </div>
    ${cloud ? `<div class="group mt">
      <button class="cell" data-act="resetPass"><div class="tx" style="color:var(--blue)">Cambiar contraseña</div></button>
      <button class="cell" data-act="logout"><div class="tx" style="color:var(--red)">Cerrar sesión</div></button></div>`
    : `<div class="group mt"><button class="cell" data-act="goCloud"><div class="tx" style="color:var(--blue)">${Store.cloudConfigured() ? 'Iniciar sesión o crear cuenta' : 'Configurar la nube (ver README)'}</div></button></div>
       <p class="gf">Con una cuenta, tus datos quedan en la nube y los ves desde el celular y la compu.</p>`}
    <div class="gh">Copias de seguridad</div>
    <div class="group">
      <button class="cell" data-act="export"><div class="tx" style="color:var(--blue)">Descargar copia (.json)</div></button>
      <label class="cell"><div class="tx" style="color:var(--blue)">Importar copia (.json)</div><input type="file" accept=".json,application/json" class="hide" data-change="importFile"></label>
      ${local ? '<button class="cell" data-act="uploadLocal"><div class="tx" style="color:var(--blue)">Subir datos de este dispositivo a la nube</div></button>' : ''}
    </div>
    <p class="gf">Importar reemplaza todo lo actual. Acepta copias de esta versión y de la anterior (libre-de-deudas.html).</p>
    <div class="group mt2"><button class="cell" data-act="resetAll"><div class="tx" style="color:var(--red)">Borrar todo y empezar de cero</div></button></div>`);
}
function rulesSheet() {
  openSheet(`${head('Las 7 reglas del juego')}<div class="group steps">${REGLAS.map(([t, p]) => `<div class="step"><span class="nb"></span><div><b>${t}</b><p>${p}</p></div></div>`).join('')}</div>`);
}
function promptText() {
  const st = S.settings, k = ym(today()), sm = monthSummary(k), iva = ivaMonth(k), ventas = inMonth(k, ['venta']);
  const cats = S.budget.map(b => `- ${b.name}: presupuesto ${fmt(budAmt(b))} | gastado este mes ${fmt(monthSpent(b.id, k))}`).join('\n');
  const loans = S.loans.map(l => `- ${l.name}: saldo ${fmt(loanSaldo(l))} | cuota ${fmt(l.cuota)} | cuotas restantes ${l.cuotas.filter(c => !c.paid).length} | termina ${lastDate(l) || 'pagado'} | TAE ${l.tae || 'sin dato'}`).join('\n') || '- (sin préstamos)';
  const cards = S.cards.map(c => `- ${c.name}: saldo ${fmt(c.saldo)} | línea ${fmt(c.linea)} | extracto ${fmt(c.extracto)} vence ${c.vence || '—'} | TAN ${c.tan || '—'}%`).join('\n') || '- (sin tarjetas)';
  const goals = S.goals.map(g => `- ${g.name}: ${fmt(g.saved)} de ${fmt(g.target)}`).join('\n');
  return `Actuá como mi asesor financiero personal: prudente, orientado a riesgo, directo y sin relleno. No inventes tasas ni datos: si falta algo, pedímelo.

CONTEXTO
- Vivo en Paraguay (Gs).${S.profile.contexto ? ' ' + S.profile.contexto.replace(/\.$/, '') + '.' : ''} Ingreso neto: sueldo base ${fmt(st.base)} + horas extra ~${fmt(st.extra)} (variable).
- Estrategia: vivir con el sueldo base; horas extra, ventas y sobrantes van a un "cofre de ataque" que paga por adelantado UNA deuda a la vez (mayor TAE; sin TAE, la que más cuota libera por guaraní). Cuota que termina se suma al ataque del siguiente (bola de nieve). Tarjeta: siempre pago total.
- Monto mensual fijo para deudas: ${fmt(debtBudget())}.
- Prioridades: 1) matar la deuda, 2) emprender y facturar (meta ${fmt(st.metaFacturacion)}/mes), 3) después, viajes (${S.goals.filter(g => g.kind === 'viaje').map(g => g.name).join(', ')}).

DATOS AL ${today()}
Deuda total: ${fmt(totalDebt())} (inicio ${fmt(S.initialTotal)}, ${pctFree().toFixed(1)}% eliminado)
Tarjetas:
${cards}
Préstamos:
${loans}
Cofre: ${fmt(S.funds.cofre)} | Sobre IVA: ${fmt(S.funds.iva)}
Metas:
${goals}
Sobres del mes (${ymLabel(k)}):
${cats}
Mes: ingresos ${fmt(sm.ingresos)} | egresos ${fmt(sm.egresos)} | compras con tarjeta ${fmt(sm.tc)}
Negocio: ${ventas.length} ventas por ${fmt(sum(ventas, m => m.amt))} | IVA débito ${fmt(iva.deb)} | IVA crédito ${fmt(iva.cred)}
Proyección libre de deudas: ${ymLabel(projection(true))} (sin plan: ${ymLabel(projection(false))})

QUÉ NECESITO
1. Diagnóstico del mes en 3 líneas: qué hice bien, dónde me desvié (sobres excedidos y por cuánto).
2. Cuánto puedo atacar este mes, a qué deuda y por qué. Si conviene precancelar, decilo con números.
3. Fecha de libertad recalculada y qué la adelantaría 1 mes.
4. Negocio: una acción concreta para facturar más el mes que viene y cómo manejar el IVA.
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
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('📋 Prompt copiado'); } catch (e) { toast('No se pudo copiar'); } ta.remove(); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast('📋 Prompt copiado'), fallback); else fallback();
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
function showSplash() { $('#app').innerHTML = '<div class="splash"><div class="spin"></div></div>'; }
function authShell(inner) {
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
      <button class="btn w mt" data-act="signup">Crear cuenta</button>
      <div class="center mt"><button class="link" style="font-size:15px" data-act="forgot">¿Olvidaste tu contraseña?</button></div></form>`
    : `<div class="note"><b>☁️ La nube todavía no está configurada.</b> Para entrar con usuario y contraseña desde cualquier dispositivo, seguí el paso 2 del README (Firebase, 5 minutos). Mientras tanto podés usar la app en este dispositivo.</div>`}
    <div class="err" id="lErr">${esc(msg)}</div>
    <div class="center" style="margin-top:14px"><button class="link" style="font-size:15px" data-act="useLocal">Usar sin cuenta en este dispositivo</button></div>`);
}
async function doAuth(kind) {
  const email = $('#lEmail').value.trim(), pass = $('#lPass').value, err = $('#lErr');
  err.style.color = '';
  if (!email) { err.textContent = 'Escribí tu email.'; return; }
  if (kind !== 'forgot' && !pass) { err.textContent = 'Escribí tu contraseña.'; return; }
  if (kind === 'signup' && pass.length < 8) { err.textContent = 'Usá una contraseña de al menos 8 caracteres.'; return; }
  err.textContent = '';
  $$('.auth-wrap .btn').forEach(b => { b.disabled = true; });
  try {
    if (kind === 'login') await Store.login(email, pass);
    else if (kind === 'signup') await Store.signup(email, pass);
    else { await Store.resetPass(email); err.style.color = 'var(--green)'; err.textContent = 'Te enviamos un email para restablecer la contraseña.'; }
    lsDel('libre-mode');
  } catch (e) { err.textContent = AUTH_MSG[e.code] || ('No se pudo: ' + (e.code || e.message)); }
  $$('.auth-wrap .btn').forEach(b => { b.disabled = false; });
}
const LEGACY_KEY = 'foxtic-libre-v1';
function showOnboarding() {
  const cloud = BK && BK.kind === 'cloud', local = cloud ? Store.readLocalData() : null;
  let legacy = null; try { legacy = JSON.parse(lsGet(LEGACY_KEY)); } catch (e) {}
  authShell(`<h1>¡Bienvenido!</h1>
    <p class="tag">${cloud ? 'Tu cuenta está lista. Tus datos viajan cifrados y solo tu usuario puede leerlos.' : 'Tus datos se guardan solo en este dispositivo.'}</p>
    <div class="group ic">
      ${local ? `<button class="cell" data-act="obLocal">${icoBox('📲', 'green')}<div class="tx"><div class="t">Subir los datos de este dispositivo</div><div class="s">Lo que cargaste sin cuenta</div></div>${I.chev}</button>` : ''}
      ${legacy ? `<button class="cell" data-act="obLegacy">${icoBox('🗂️', 'orange')}<div class="tx"><div class="t">Traer datos de la versión anterior</div><div class="s">Encontrados en este navegador</div></div>${I.chev}</button>` : ''}
      <label class="cell">${icoBox('📥', 'blue')}<div class="tx"><div class="t">Importar archivo de datos</div><div class="s">Por ejemplo mis-datos-iniciales.json</div></div>${I.chev}<input type="file" accept=".json,application/json" class="hide" data-change="obImport"></label>
      <button class="cell" data-act="obBlank">${icoBox('✨', 'purple')}<div class="tx"><div class="t">Empezar de cero</div><div class="s">Cargás ingresos y deudas a mano</div></div>${I.chev}</button>
    </div>
    ${cloud ? '<div class="center mt2"><button class="link" style="font-size:15px" data-act="logout">Cerrar sesión</button></div>' : ''}`);
}
function stopData() { if (STOP) STOP(); STOP = null; BK = null; S = null; M = []; firstData = true; LAST = ''; USER = null; }
function startLocal() { stopData(); showSplash(); BK = Store.localBackend(); STOP = BK.start(onData); }
async function startCloud(user) {
  stopData(); USER = user; showSplash();
  try {
    BK = await Store.cloudBackend(user);
    STOP = BK.start(onData, err => { console.error(err); setSync('error'); toast('⚠️ Error de la nube: ' + (err.code || err.message)); });
  } catch (e) { console.error(e); showLogin('No se pudo conectar con la nube.'); }
}
async function boot() {
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
    else REG[k] = v;
    if (k === 'tipo' || k === 't') REG.touched = false;
    rerenderAdd();
  },
  pick: (d, el) => {
    $$('[data-act=pick]', el.parentElement).forEach(c => c.classList.toggle('on', c === el)); $('#' + d.target).value = d.v;
    if (d.target === 'ivP' && $('#ivA')) $('#ivA').value = fmt(ivaDue(d.v));
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
  moveFund: d => moveSheet(d.from, d.to), doMove: () => doMove(),
  settings: () => settingsSheet(), saveSettings: () => saveSettings(), theme: d => setTheme(d.v),
  account: () => accountSheet(), rules: () => rulesSheet(), prompt: () => promptSheet(), copyPrompt: () => copyPrompt(),
  export: () => exportData(),
  uploadLocal: (d, el) => { if (!armed(el)) return; const l = Store.readLocalData(); if (l) { replaceAll(l.state, l.movs); closeSheet(); render(); toast('☁️ Datos subidos a la nube'); } },
  resetAll: (d, el) => { if (!armed(el)) return; replaceAll(blankState(), []); closeSheet(); render(true); toast('Todo borrado'); },
  achInfo: d => { const a = ACH.find(x => x[0] === d.id); toast(a[1] + ' ' + a[2] + ': ' + a[3] + (S.ach[a[0]] ? ' · ✓ ' + dLabel(S.ach[a[0]]) : ' · 🔒')); },
  login: () => doAuth('login'), signup: () => doAuth('signup'), forgot: () => doAuth('forgot'),
  useLocal: () => { lsSet('libre-mode', 'local'); startLocal(); },
  goCloud: () => { lsDel('libre-mode'); location.reload(); },
  logout: async () => { closeSheet(); if (BK && BK.kind === 'cloud') { await Store.logout(); } },
  resetPass: async () => { try { await Store.resetPass(USER.email); toast('📧 Te enviamos un email para cambiar la contraseña'); } catch (e) { toast('No se pudo enviar el email'); } },
  obBlank: () => { replaceAll(blankState(), []); showApp(); },
  obLocal: () => { const l = Store.readLocalData(); if (l) { replaceAll(l.state, l.movs); showApp(); toast('☁️ Datos subidos'); } },
  obLegacy: () => { try { const r = fromV1(JSON.parse(lsGet(LEGACY_KEY))); replaceAll(r.state, r.movs); showApp(); toast('✔️ Datos de la versión anterior importados'); } catch (e) { toast('No se pudieron leer los datos anteriores'); } }
};
const CHG = {
  task: el => { S.tasks[el.dataset.id] = el.checked; addXP(el.checked ? 25 : -25); checkAch(); commit(); render(); },
  importFile: el => readFile(el, r => { replaceAll(r.state, r.movs); closeSheet(); render(true); toast('✔️ Copia importada'); }),
  obImport: el => readFile(el, r => { replaceAll(r.state, r.movs); showApp(); toast('✔️ Datos importados · ¡a jugar!'); confetti(); })
};
document.addEventListener('click', e => {
  const tb = e.target.closest('#tabbar [data-tab]'); if (tb) { go(tb.dataset.tab); haptic(); return; }
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act]; if (fn) fn(el.dataset, el, e);
});
document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el && CHG[el.dataset.change]) CHG[el.dataset.change](el, e); });
document.addEventListener('input', e => {
  const t = e.target;
  if (t.matches && t.matches('input[data-money]')) { const n = parseN(t.value); t.value = n ? fmt(n) : ''; }
  if (t.closest && t.closest('#sheet') && $('#fAmt')) addLive(e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSheet();
  if (e.key === 'Enter' && e.target.closest && e.target.closest('#loginForm')) { e.preventDefault(); doAuth('login'); }
});
$('#sheetBg').addEventListener('click', e => { if (e.target.id === 'sheetBg') closeSheet(); });
$('#fab').addEventListener('click', () => { haptic(); openAdd(); });
window.addEventListener('scroll', () => { $('#topbar').classList.toggle('on', APP_ON && window.scrollY > 52); }, { passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden && APP_ON && !sheetOpen()) render(); });

boot();
