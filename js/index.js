

const starsContainer = document.getElementById("stars");
const shootingStarsContainer = document.getElementById("shooting-stars");
const fireworksContainer = document.getElementById("fireworks-container");

let fireworkColorIndex = 0;
const fireworkColors = [
  "white",
  "blue",
  "yellow",
  "red",
  "green",
  "pink",
  "purple",
  "orange",
];

// Crear estrellas fijas
function createStars() {
  const numStars = 200;
  for (let i = 0; i < numStars; i++) {
    const star = document.createElement("div");
    star.classList.add("star");

    const size = Math.random() * 2 + 1;
    const xPos = Math.random() * 100;
    const yPos = Math.random() * 100;
    const delay = Math.random() * 1;

    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${xPos}%`;
    star.style.top = `${yPos}%`;
    star.style.animationDelay = `${delay}s`;

    starsContainer.appendChild(star);
  }
}

// Crear estrellas fugaces
function createShootingStar() {
  const shootingStar = document.createElement("div");
  shootingStar.classList.add("shooting-star");

  const startX = Math.random() * window.innerWidth;
  const startY = Math.random() * (window.innerHeight / 2);

  shootingStar.style.left = `${startX}px`;
  shootingStar.style.top = `${startY}px`;

  shootingStarsContainer.appendChild(shootingStar);

  shootingStar.style.animation = `shooting 1s ease-out forwards`;

  setTimeout(() => {
    shootingStar.remove();
  }, 1000);
}

// Crear fuegos artificiales con colores secuenciales
function createFirework() {
  const numParticles = 30;
  const fireworkCenterX = Math.random() * window.innerWidth; // Coordenada X aleatoria
  const fireworkCenterY = Math.random() * window.innerHeight * 0.5; // Coordenada Y aleatoria (parte superior de la pantalla)

  // Seleccionar el color del fuego artificial de forma secuencial
  const fireworkColor = fireworkColors[fireworkColorIndex];
  fireworkColorIndex = (fireworkColorIndex + 1) % fireworkColors.length;

  for (let i = 0; i < numParticles; i++) {
    const firework = document.createElement("div");
    firework.classList.add("firework");

    const angle = (Math.PI * 2 * i) / numParticles;
    const radius = Math.random() * 100 + 50;
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;

    firework.style.setProperty("--x", `${offsetX}px`);
    firework.style.setProperty("--y", `${offsetY}px`);
    firework.style.left = `${fireworkCenterX}px`;
    firework.style.top = `${fireworkCenterY}px`;
    firework.style.backgroundColor = fireworkColor;

    fireworksContainer.appendChild(firework);

    setTimeout(() => firework.remove(), 1000);
  }
}

// Iniciar animaciones
createStars();
setInterval(() => createShootingStar(), 2000 + Math.random() * 3000);
setInterval(() => createFirework(), 2000 + Math.random() * 3000);
/* 
// —————————————————————————————
// 1) Configuración Firebase (v8)
// —————————————————————————————
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

let nombreUsuario = null;

// —————————————————————————————
// 2) Registro de usuario
// —————————————————————————————
$('#registerBtn').on('click', () => {
  const name = $('#nombreUsuario').val().trim();
  if (!name) {
    alert('Por favor, ingresa tu nombre.');
    return;
  }
  nombreUsuario = name;
  sessionStorage.setItem('nombreUsuario', name);

  // Crea el nodo en Firebase si aún no existe
  db.ref(`usuarios/${name}`).once('value', snap => {
    if (!snap.exists()) {
      db.ref(`usuarios/${name}`).set({ lat: 0, lng: 0, Gustados: {} });
    }
  });

  // Cambiamos de vista
  $('#registerDiv').hide();
  $('#userListDiv').show();

  // Carga la lista de usuarios
  obtenerUsuariosDisponibles(name);
});

// —————————————————————————————
// 3) Función para obtener y mostrar usuarios
// —————————————————————————————
function obtenerUsuariosDisponibles(nombreActual) {
  db.ref('usuarios').on('value', snapshot => {
    const todos = snapshot.val() || {};
    $('#ubicaciones').empty();

    Object.keys(todos).forEach(usuario => {
      if (usuario !== nombreActual) {
        $('#ubicaciones').append(`
          <label>
            <input
              type="radio"
              name="usuarioSeleccionado"
              value="${usuario}"
            /> ${usuario}
          </label>
        `);
      }
    });
  });
}

// —————————————————————————————
// 4) Cuando selecciones a alguien, lo guardamos como “Gustado”
// —————————————————————————————
$('#ubicaciones').on('change', 'input[name="usuarioSeleccionado"]', function() {
  const sel = $(this).val();
  db.ref(`usuarios/${nombreUsuario}/Gustados/${sel}`)
    .set({ lat: 0, lng: 0 })
    .then(() => {
      alert(`Has marcado a ${sel} como “gustado”.`);
    });
});
 */