/* loveAlarm.js  —  lógica única para Alex y Vane  */

/* -------------------------------------------------
 * 1)  Firebase
 * ------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyDRySH20RBkB_oEDqOuJyNpKqmVtv-sEfY",
  authDomain: "lovealarm-ca997.firebaseapp.com",
  databaseURL: "https://lovealarm-ca997-default-rtdb.firebaseio.com",
  projectId: "lovealarm-ca997",
  storageBucket: "lovealarm-ca997.appspot.com",
  messagingSenderId: "781543481797",
  appId: "1:781543481797:web:5003ba49cb1ebf6bac",
  measurementId: "G-W7S775858C",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* -------------------------------------------------
 * 2)  Estado global
 * ------------------------------------------------- */
let nombreUsuario       = null;  // quien se registra
let latActual           = null,
    lngActual           = null;  // posición propia
let seleccionPrevia     = null;  // para recordar radio marcado
const ES_ALEX           = !!document.getElementById('usersDiv');

/* -------------------------------------------------
 * 2.5)  Beep (Web Audio API)
 * ------------------------------------------------- */
function beep(duration=100, freq=440, vol=0.1) {
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  const o   = ctx.createOscillator();
  const g   = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.frequency.value = freq;
  g.gain.value       = vol;
  o.start();
  setTimeout(()=>{ o.stop(); ctx.close(); }, duration);
}

/* -------------------------------------------------
 * 3)  Al listo el DOM
 * ------------------------------------------------- */
$(document).ready(() => {
  $('#registerBtn').on('click', registrarUsuario);

  if (ES_ALEX) {
    $('#ubicaciones').on(
      'change',
      'input[name="usuarioSeleccionado"]',
      marcarGustado
    );
  }
});

/* -------------------------------------------------
 * 4)  Registro de usuario
 * ------------------------------------------------- */
function registrarUsuario() {
  const name = $('#nombreUsuario').val().trim();
  if (!name) {
    alert('Ingresa tu nombre');
    return;
  }

  nombreUsuario = name;
  sessionStorage.setItem('nombreUsuario', name);

  // Crear su nodo si no existe
  const ref = db.ref(`usuarios/${nombreUsuario}`);
  ref.once('value', snap => {
    if (!snap.exists()) {
      snap.ref.set({ lat: null, lng: null, Gustados: {} });
    }
  });

  $('#registerDiv').hide();
  if (ES_ALEX) {
    $('#usersDiv').show();
    cargarUsuariosDisponibles();
  } else {
    $('#trackerDiv').show();
    $('#divShow').show();
    escucharLikesParaMi();
  }

  iniciarGeolocalizacion();
}

/* -------------------------------------------------
 * 5)  Geolocalización contínua
 * ------------------------------------------------- */
function iniciarGeolocalizacion() {
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta geolocalización');
    return;
  }
  navigator.geolocation.watchPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;

      // Guarda sólo coords
      db.ref(`usuarios/${nombreUsuario}`).update({ lat, lng });

      latActual = lat;
      lngActual = lng;

      if (!ES_ALEX) revisarProximidad();
    },
    err => console.error('geo‑err', err),
    { enableHighAccuracy: true, maximumAge: 0 }
  );
}

/* -------------------------------------------------
 * 6‑A)  Lado Alex  – cargar lista y marcar like
 * ------------------------------------------------- */
function cargarUsuariosDisponibles() {
  db.ref('usuarios').on('value', snapshot => {
    const todos = snapshot.val() || {};

    // 1) guardar selección actual
    seleccionPrevia = $('input[name="usuarioSeleccionado"]:checked').val();

    // 2) repoblar lista
    $('#ubicaciones').empty();
    Object.keys(todos).forEach(u => {
      if (u === nombreUsuario) return;
      $('#ubicaciones').append(`
        <label>
          <input
            type="radio"
            name="usuarioSeleccionado"
            value="${u}"
          > ${u}
        </label>
      `);
    });

    // 3) reaplicar selección
    if (seleccionPrevia) {
      $(`input[name="usuarioSeleccionado"][value="${seleccionPrevia}"]`)
        .prop('checked', true);
    }
  });
}

/* -------------------------------------------------
 * 6‑A)  Lado Alex  – guardar “gustado” en su propio nodo
 * ------------------------------------------------- */
function marcarGustado() {
  const liked = $(this).val();

  db.ref(`usuarios/${nombreUsuario}/Gustados/${liked}`)
    .set(true)
    .then(() => console.log(`Like guardado → ${nombreUsuario}/Gustados/${liked}`))
    .catch(err => console.error('like‑err', err));
}

/* -------------------------------------------------
 * 6‑B)  Lado Vane – escuchar quién la ha marcado
 * ------------------------------------------------- */
function escucharLikesParaMi() {
  db.ref('usuarios').on('value', () => revisarProximidad());
}

/* -------------------------------------------------
 * 7)  Revisar distancia de cada “gustador”
 * ------------------------------------------------- */
function revisarProximidad() {
  if (latActual === null) return;

  db.ref('usuarios').once('value').then(snap => {
    const todos = snap.val() || {};
    let dentroDe5m = 0;

    Object.keys(todos).forEach(u => {
      if (u === nombreUsuario) return;
      const nodo = todos[u];

      if (nodo.Gustados && nodo.Gustados[nombreUsuario]) {
        if (nodo.lat != null && nodo.lng != null) {
          const d = haversine(latActual, lngActual, nodo.lat, nodo.lng);
          console.log(`Dist. ${u}→${nombreUsuario}: ${d.toFixed(1)} m`);
          if (d <= 1) dentroDe5m++;
        }
      }
    });

    actualizarCírculo(dentroDe5m);
  });
}

/* -------------------------------------------------
 * 8)  UI: actualiza círculo
 * ------------------------------------------------- */
function actualizarCírculo(n) {
  const $c = $('#cantidadPersonas');
  if (!$c.length) return;

  $c.text(n);
  if (n > 0 && !$c.find('.orbit1').length) {
    $c.append('<div class="orbit orbit1"></div><div class="orbit orbit2"></div>');
  }
  if (n === 0) {
    $c.find('.orbit').remove();
  }

  window.updatePersonCount && updatePersonCount(n);
  const svg = document.getElementById('orbitSvg');
  if (svg) svg.style.display = n > 0 ? 'block' : 'none';
}

/* -------------------------------------------------
 * 9)  Distancia Haversine (m)
 * ------------------------------------------------- */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3,
        φ1 = lat1 * Math.PI/180,
        φ2 = lat2 * Math.PI/180,
        dφ = (lat2 - lat1) * Math.PI/180,
        dλ = (lon2 - lon1) * Math.PI/180;
  const a = Math.sin(dφ/2)**2 +
            Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
