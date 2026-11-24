# Libre · Matá la deuda

Una app web (instalable en el celular) que convierte salir de deudas en un juego:

- **Batalla**: cada préstamo es un jefe con barra de vida. Pagás cuotas, atacás con el *cofre* y precancelás con golpes críticos. Orden de ataque automático (avalancha por TAE, o por flujo liberado si faltan tasas).
- **Tarjeta de crédito**: saldo, extracto, mínimo y vencimiento. Cada compra con tarjeta le devuelve vida al jefe 💳.
- **Movimientos**: gastos (personales o del negocio), ingresos, ventas, IVA, pagos. Resumen mensual de ingresos, egresos y neto.
- **Negocio**: facturación vs. meta, escalera de niveles, caja del negocio e **IVA** (débito, crédito, a pagar y un sobre que lo separa solo de cada venta).
- **Plan**: mapa del juego (Deuda → Negocio → Viajes), reparto del sueldo paso a paso, sobres, metas (colchón, caja del negocio, viajes bloqueados hasta ser libre), misiones y un prompt de revisión mensual para Claude.
- **Anillos, XP, niveles, rachas y 20 logros.**
- Diseño inspirado en iOS, con modo claro y oscuro automáticos.

Los datos **no están en el código**: viven en tu cuenta (Firebase) o, sin cuenta, solo en tu navegador.

---

## 1. Usarla

Abrí la URL de GitHub Pages del repo. En el iPhone: Safari → Compartir → **Agregar a inicio** y queda como una app.

## 2. Activar la nube con usuario y contraseña (5 minutos, gratis)

1. Entrá a <https://console.firebase.google.com> → **Agregar proyecto** → nombre `libre` (podés desactivar Google Analytics).
2. Menú **Compilación → Authentication → Comenzar → Correo electrónico/contraseña → Habilitar → Guardar**.
3. Menú **Compilación → Firestore Database → Crear base de datos** → ubicación `southamerica-east1 (São Paulo)` → **modo de producción**.
4. En Firestore → pestaña **Reglas** → borrá todo, pegá el contenido de [`firestore.rules`](firestore.rules) → **Publicar**.
   Con esas reglas, cada usuario solo puede leer y escribir sus propios datos.
5. ⚙️ **Configuración del proyecto → Tus apps → Web (`</>`)** → apodo `libre` → **Registrar app**. Copiá el objeto `firebaseConfig`.
6. Pegalo en [`config.js`](config.js) así y subí el cambio:
   ```js
   window.LIBRE_FIREBASE = { apiKey: "...", authDomain: "...", projectId: "...", storageBucket: "...", messagingSenderId: "...", appId: "..." };
   ```
   (Se puede editar directo en GitHub: abrí `config.js` → ✏️ → **Commit changes**.) Estos valores no son secretos: la protección la dan las reglas del paso 4.
7. En **Authentication → Configuración → Dominios autorizados**, agregá tu dominio de GitHub Pages (`<usuario>.github.io`).
8. Abrí la app → **Crear cuenta** con tu email y una contraseña de 10+ caracteres.
9. (Recomendado) Para que nadie más pueda registrarse: **Authentication → Configuración → Acciones del usuario** → desmarcá **Habilitar creación (registro)**.

## 3. Cargar tus datos

Al entrar por primera vez la app ofrece:

- **Importar archivo de datos** (`.json`): acepta copias de esta versión y de la versión anterior (`libre-de-deudas.html`).
- **Subir los datos de este dispositivo** si usaste la app sin cuenta.
- **Empezar de cero**: cargás ingresos en *Plan → Ajustes* y deudas en *Batalla → +*.

Copias de seguridad: *Plan → Cuenta y datos → Descargar copia*. Guardalas en un lugar privado: **nunca las subas a este repo** (es público).

## Estructura

```
index.html            shell de la app
config.js             configuración de Firebase (vacía por defecto)
assets/app.js         lógica del juego, pantallas y cálculos
assets/store.js       persistencia: local (navegador) o nube (Auth + Firestore)
assets/styles.css     sistema de diseño (iOS HIG, claro/oscuro)
firestore.rules       reglas de seguridad para Firestore
```

Sin dependencias ni build: HTML, CSS y JavaScript. Firebase se carga desde el CDN oficial de Google solo si `config.js` tiene datos.

> No es asesoramiento financiero ni impositivo. Para IVA, IRE o IRP consultá con un contador.
