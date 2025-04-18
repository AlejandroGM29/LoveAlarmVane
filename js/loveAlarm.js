/* loveAlarm.js  —  lógica única para Alex y Vane  */

/* -------------------------------------------------
 * 1) Firebase
 * ------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyDRySH20RBkB_oEDqOuJyNpKqmVtv-sEfY",
  authDomain: "lovealarm-ca997.firebaseapp.com",
  databaseURL: "https://lovealarm-ca997-default-rtdb.firebaseio.com",
  projectId: "lovealarm-ca997",
  storageBucket: "lovealarm-ca997.appspot.com",
  messagingSenderId: "781543481797",
  appId: "1:781543481797:web:5003ba49c069cb1ebf6bac",
  measurementId: "G-W7S775858C",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* -------------------------------------------------
 * 2) Estado global
 * ------------------------------------------------- */
let nombreUsuario        = sessionStorage.getItem("nombreUsuario") || null;
let latActual   = null, lngActual = null;
let usuarioSeleccionado  = null;
let lastCount            = 0;
let ES_ALEX              = false;

/* -------------------------------------------------
 * 2.5) Beep (Web Audio API)
 * ------------------------------------------------- */
function beep(duration=100, freq=440, vol=0.1){
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  const o   = ctx.createOscillator();
  const g   = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.frequency.value = freq;
  g.gain.value       = vol;
  o.start();
  setTimeout(()=>{
    o.stop();
    ctx.close();
  }, duration);
}

/* -------------------------------------------------
 * 3) Al listo el DOM
 * ------------------------------------------------- */
$(document).ready(() => {
  ES_ALEX = $('#usersDiv').length > 0;

  // Si ya había usuario en sessionStorage, auto-login
  if (nombreUsuario) {
    $('#nombreUsuario').val(nombreUsuario);
    $('#registerDiv').hide();
    if (ES_ALEX) {
      $('#usersDiv').show();
      cargarUsuariosDisponibles();
    } else {
      $('#trackerDiv').show();
      escucharLikesParaMi();
    }
    iniciarGeolocalizacion();
  }

  // Registro manual
  $('#registerBtn').on('click', registrarUsuario);

  // Handler Alex: marcar gustado
  if (ES_ALEX) {
    $('#ubicaciones').on(
      'change',
      'input[name="usuarioSeleccionado"]',
      function(){
        usuarioSeleccionado = this.value;
        marcarGustado.call(this);
      }
    );
  }
});

/* -------------------------------------------------
 * 4) Registro de usuario
 * ------------------------------------------------- */
function registrarUsuario(){
  const name = $('#nombreUsuario').val().trim();
  if (!name) return alert('Ingresa tu nombre');

  nombreUsuario = name;
  sessionStorage.setItem('nombreUsuario', name);

  const ref = db.ref(`usuarios/${name}`);
  ref.once('value', snap => {
    if (!snap.exists()) {
      ref.set({ lat:null, lng:null, Gustados:{} });
    }
  });

  $('#registerDiv').hide();
  if (ES_ALEX) {
    $('#usersDiv').show();
    cargarUsuariosDisponibles();
  } else {
    $('#trackerDiv').show();
    escucharLikesParaMi();
  }
  iniciarGeolocalizacion();
}

/* -------------------------------------------------
 * 5) Geolocalización contínua
 * ------------------------------------------------- */
function iniciarGeolocalizacion(){
  if (!navigator.geolocation) {
    alert('Tu navegador no soporta geolocalización');
    return;
  }
  navigator.geolocation.watchPosition(
    pos => {
      const { latitude:lat, longitude:lng } = pos.coords;
      db.ref(`usuarios/${nombreUsuario}`).update({ lat, lng });
      latActual = lat; lngActual = lng;
      if (!ES_ALEX) revisarProximidad();
    },
    err => console.error('geo‑err', err),
    { enableHighAccuracy:true, maximumAge:0 }
  );
}

/* -------------------------------------------------
 * 6‑A) Alex – cargar lista y marcar like
 * ------------------------------------------------- */
function cargarUsuariosDisponibles(){
  db.ref('usuarios').on('value', snap => {
    const todos = snap.val() || {};
    const prev = usuarioSeleccionado;

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

    // restaurar selección
    if (prev) {
      $(`input[name="usuarioSeleccionado"][value="${prev}"]`)
        .prop('checked', true);
      usuarioSeleccionado = prev;
    }
  });
}

function marcarGustado(){
  const liked = this.value || $(this).val(); // usuario marcado
  usuarioSeleccionado = liked;

  // Guarda el like en EL NODO DE LA PERSONA GUSTADA:
  //   /usuarios/Vane/Gustados/Alex = true
  db.ref(`usuarios/${liked}/Gustados/${nombreUsuario}`)
    .set(true)
    .then(()=> console.log(`Guardado → ${liked}/Gustados/${nombreUsuario}`))
    .catch(e=> console.error('like‑err', e));
}

/* -------------------------------------------------
 * 6‑B) Vane – escuchar quién la ha marcado
 * ------------------------------------------------- */
function escucharLikesParaMi(){
  db.ref('usuarios').on('value', ()=> revisarProximidad());
}

/* -------------------------------------------------
 * 7) Revisar distancia de cada “gustador”
 * ------------------------------------------------- */
function revisarProximidad(){
  if (latActual===null) return;
  db.ref('usuarios').once('value').then(snap => {
    const todos = snap.val() || {};
    let count = 0;

    Object.keys(todos).forEach(u => {
      if (u === nombreUsuario) return;
      const nodo = todos[u];
      if (
        nodo.Gustados &&
        nodo.Gustados[nombreUsuario] &&
        nodo.lat!=null &&
        nodo.lng!=null
      ) {
        const d = haversine(latActual, lngActual, nodo.lat, nodo.lng);
        console.log(`Dist. ${u}→${nombreUsuario}: ${d.toFixed(1)} m`);
        if (d <= 10) count++;
      }
    });

    actualizarCírculo(count);
  });
}

/* -------------------------------------------------
 * 8) UI: actualizar círculo y efectos
 * ------------------------------------------------- */
function actualizarCírculo(n){
  const $c = $('#cantidadPersonas');
  if (!$c.length) return;

  $c.text(n);

  // beep solo al pasar 0→1
  if (lastCount===0 && n>0){
    beep(120, 600, 0.05);
  }
  lastCount = n;

  // cometas CSS
  if (n>0 && !$c.find('.orbit1').length){
    $c.append(
      '<div class="orbit orbit1"></div>'+
      '<div class="orbit orbit2"></div>'
    );
  }
  if (n===0){
    $c.find('.orbit').remove();
  }

  // mostrar/ocultar SVG
  const svg = document.getElementById('orbitSvg');
  if (svg) svg.style.display = n>0 ? 'block' : 'none';
}

/* -------------------------------------------------
 * 9) Distancia Haversine (m)
 * ------------------------------------------------- */
function haversine(lat1,lon1,lat2,lon2){
  const R=6371e3,
        φ1=lat1*Math.PI/180,
        φ2=lat2*Math.PI/180,
        dφ=(lat2-lat1)*Math.PI/180,
        dλ=(lon2-lon1)*Math.PI/180;
  const a = Math.sin(dφ/2)**2 +
            Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
