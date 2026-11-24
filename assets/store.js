// Persistencia de Libre: "local" (solo este dispositivo) o "nube" (Firebase Auth + Firestore).
// Estructura en la nube:  users/{uid}            → estado (deudas, sobres, metas, ajustes)
//                         users/{uid}/movs/{id}  → cada movimiento (gastos, ingresos, ventas, pagos)
const FB_VER = '10.12.2';
export const LS_STATE = 'libre-v2-state';
export const LS_MOVS = 'libre-v2-movs';

export const cloudConfigured = () => !!(window.LIBRE_FIREBASE && window.LIBRE_FIREBASE.apiKey);

let fb = null;
async function loadFirebase() {
  if (fb) return fb;
  const base = `https://www.gstatic.com/firebasejs/${FB_VER}/`;
  const [appM, A, F] = await Promise.all([
    import(base + 'firebase-app.js'),
    import(base + 'firebase-auth.js'),
    import(base + 'firebase-firestore.js')
  ]);
  const app = appM.initializeApp(window.LIBRE_FIREBASE);
  const auth = A.getAuth(app);
  let db;
  try {
    db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
  } catch (e) {
    db = F.getFirestore(app);
  }
  fb = { app, auth, db, A, F };
  return fb;
}

/* ---------- Autenticación ---------- */
export async function watchAuth(cb) { const { auth, A } = await loadFirebase(); return A.onAuthStateChanged(auth, cb); }
export async function login(email, pass) { const { auth, A } = await loadFirebase(); return A.signInWithEmailAndPassword(auth, email, pass); }
export async function signup(email, pass) { const { auth, A } = await loadFirebase(); return A.createUserWithEmailAndPassword(auth, email, pass); }
export async function resetPass(email) { const { auth, A } = await loadFirebase(); return A.sendPasswordResetEmail(auth, email); }
export async function logout() { const { auth, A } = await loadFirebase(); return A.signOut(auth); }

const clean = o => JSON.parse(JSON.stringify(o)); // Firestore no acepta undefined

/* ---------- Backend local ---------- */
export function localBackend() {
  return {
    kind: 'local',
    start(onData) {
      let state = null, movs = [];
      try { state = JSON.parse(localStorage.getItem(LS_STATE)); } catch (e) {}
      try { movs = JSON.parse(localStorage.getItem(LS_MOVS)) || []; } catch (e) {}
      setTimeout(() => onData({ state, movs, pending: false }), 0);
      return () => {};
    },
    async write({ state, movs }) {
      if (state) localStorage.setItem(LS_STATE, JSON.stringify(state));
      if (movs) localStorage.setItem(LS_MOVS, JSON.stringify(movs));
    }
  };
}

export function readLocalData() {
  try {
    const state = JSON.parse(localStorage.getItem(LS_STATE));
    const movs = JSON.parse(localStorage.getItem(LS_MOVS)) || [];
    return state ? { state, movs } : null;
  } catch (e) { return null; }
}

/* ---------- Backend nube ---------- */
export async function cloudBackend(user) {
  const { db, F } = await loadFirebase();
  const sRef = F.doc(db, 'users', user.uid);
  const mCol = F.collection(db, 'users', user.uid, 'movs');
  return {
    kind: 'cloud',
    user,
    start(onData, onError) {
      let state, movs, gotS = false, gotM = false;
      const emit = pending => { if (gotS && gotM) onData({ state, movs, pending }); };
      const u1 = F.onSnapshot(sRef, { includeMetadataChanges: false }, snap => {
        state = snap.exists() ? snap.data() : null; gotS = true; emit(snap.metadata.hasPendingWrites);
      }, onError);
      const u2 = F.onSnapshot(mCol, { includeMetadataChanges: false }, snap => {
        movs = snap.docs.map(d => d.data()); gotM = true; emit(snap.metadata.hasPendingWrites);
      }, onError);
      return () => { u1(); u2(); };
    },
    async write({ state, add = [], del = [] }) {
      // Lotes de máx. 450 operaciones (límite de Firestore: 500)
      const ops = [];
      if (state) ops.push(b => b.set(sRef, clean(state)));
      add.forEach(m => ops.push(b => b.set(F.doc(mCol, m.id), clean(m))));
      del.forEach(id => ops.push(b => b.delete(F.doc(mCol, id))));
      for (let i = 0; i < ops.length; i += 450) {
        const b = F.writeBatch(db);
        ops.slice(i, i + 450).forEach(op => op(b));
        await b.commit();
      }
    }
  };
}
