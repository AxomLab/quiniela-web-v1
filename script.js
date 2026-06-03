/* ============================================================
   QUINIELA MUNDIALISTA 2026 — SCRIPT v2
   Datos de ejemplo · Tema claro/oscuro · Avatares grandes
   ============================================================ */

/* ===========================================
   DATOS DE EJEMPLO
   =========================================== */

var participantes = [];
var partidoCaliente = null;
var datoLoco = "";
var metadata = {
  ultimaActualizacion: "",
  totalParticipantes: 0,
  partidosJugados: 0,
  partidosPendientes: 0
};

// Datos de respaldo internos para cuando la web se abre como archivo local (file://)
var datosRespaldo = {
  "metadata": {
    "ultimaActualizacion": "01 Jun 2026, 11:00",
    "totalParticipantes": 12,
    "partidosJugados": 18,
    "partidosPendientes": 46
  },
  "partidoCaliente": {
    "equipoA": "México",
    "equipoB": "Sudáfrica",
    "fecha": "15 junio",
    "hora": "18:00 hrs",
    "votos": {
      "equipoA": 18,
      "empate": 4,
      "equipoB": 2
    },
    "banderaA": "🇲🇽",
    "banderaB": "🇿🇦"
  },
  "datoLoco": "La oficina lo tiene claro: la mayoría va con México. 🌮⚽",
  "participantes": [
    { "Posicion": 1,  "Alias": "El Profe",   "Avatar": "elprofe.png",    "Puntos": 42, "Aciertos": 14, "PartidosJugados": 18, "Porcentaje": 77.8, "Activo": "Sí", "Color": "#ff2d78" },
    { "Posicion": 2,  "Alias": "La Bruja",   "Avatar": "la-bruja.png",   "Puntos": 39, "Aciertos": 13, "PartidosJugados": 18, "Porcentaje": 72.2, "Activo": "Sí", "Color": "#00d4ff" },
    { "Posicion": 3,  "Alias": "Tío Memo",   "Avatar": "tio-memo.png",   "Puntos": 36, "Aciertos": 12, "PartidosJugados": 18, "Porcentaje": 66.7, "Activo": "Sí", "Color": "#ffc107" },
    { "Posicion": 4,  "Alias": "Doña Lety",  "Avatar": "dona-lety.png",  "Puntos": 33, "Aciertos": 11, "PartidosJugados": 18, "Porcentaje": 61.1, "Activo": "Sí", "Color": "#00e676" },
    { "Posicion": 5,  "Alias": "El Charly",  "Avatar": "el-charly.png",  "Puntos": 30, "Aciertos": 10, "PartidosJugados": 18, "Porcentaje": 55.6, "Activo": "Sí", "Color": "#ff9100" },
    { "Posicion": 6,  "Alias": "Lupita",     "Avatar": "lupita.png",     "Puntos": 27, "Aciertos": 9,  "PartidosJugados": 18, "Porcentaje": 50.0, "Activo": "Sí", "Color": "#b44dff" },
    { "Posicion": 7,  "Alias": "El Inge",    "Avatar": "el-inge.png",    "Puntos": 24, "Aciertos": 8,  "PartidosJugados": 18, "Porcentaje": 44.4, "Activo": "Sí", "Color": "#ff6b6b" },
    { "Posicion": 8,  "Alias": "Panchito",   "Avatar": "panchito.png",   "Puntos": 21, "Aciertos": 7,  "PartidosJugados": 18, "Porcentaje": 38.9, "Activo": "Sí", "Color": "#4ecdc4" },
    { "Posicion": 9,  "Alias": "La Güera",   "Avatar": "la-guera.png",   "Puntos": 15, "Aciertos": 5,  "PartidosJugados": 18, "Porcentaje": 27.8, "Activo": "Sí", "Color": "#45b7d1" },
    { "Posicion": 10, "Alias": "Don Rafa",   "Avatar": "don-rafa.png",   "Puntos": 12, "Aciertos": 4,  "PartidosJugados": 18, "Porcentaje": 22.2, "Activo": "Sí", "Color": "#f7dc6f" },
    { "Posicion": 11, "Alias": "Toño",       "Avatar": "tono.png",       "Puntos": 9,  "Aciertos": 3,  "PartidosJugados": 18, "Porcentaje": 16.7, "Activo": "Sí", "Color": "#bb8fce" },
    { "Posicion": 12, "Alias": "El Nuevo",   "Avatar": "el-nuevo.png",   "Puntos": 6,  "Aciertos": 2,  "PartidosJugados": 18, "Porcentaje": 11.1, "Activo": "Sí", "Color": "#82e0aa" }
  ]
};

/* ===========================================
   UTILIDADES
   =========================================== */

function getInitial(alias) {
  var clean = alias.replace(/^(El |La |Don |Doña |Tío )/, '');
  return clean.charAt(0).toUpperCase();
}

/**
 * Avatar pequeño (para tablas, listas, top/bottom).
 * data-avatar guarda la ruta para conectar imágenes reales después.
 */
function crearAvatar(p, mini) {
  var initial = getInitial(p.alias);
  var cls = mini ? 'avatar avatar-mini' : 'avatar';
  return '<div class="' + cls + '" style="background:' + p.color + ';" data-avatar="' + p.avatar + '">' + initial + '</div>';
}

/**
 * Avatar GRANDE para la pista de carrera.
 * Intenta cargar la imagen real; si falla, muestra el fallback con inicial.
 * Listo para recibir PNGs/WEBPs sin fondo desde /avatars/.
 */
function crearAvatarRace(p) {
  var initial = getInitial(p.alias);
  return '<div class="avatar-race">' +
    '<img src="' + p.avatar + '" alt="' + p.alias + '" onerror="this.style.display=\'none\';">' +
    '<div class="avatar-fallback" style="background:' + p.color + ';">' + initial + '</div>' +
    '</div>';
}

function sortByPuntos(arr, desc) {
  return arr.slice().sort(function (a, b) {
    return desc ? b.puntos - a.puntos : a.puntos - b.puntos;
  });
}

var banderasPaises = {
  "México": "🇲🇽",
  "Sudáfrica": "🇿🇦",
  "Francia": "🇫🇷",
  "Marruecos": "🇲🇦",
  "Argentina": "🇦🇷",
  "Arabia Saudita": "🇸🇦",
  "España": "🇪🇸",
  "Alemania": "🇩🇪",
  "Estados Unidos": "🇺🇸",
  "EE.UU.": "🇺🇸",
  "USA": "🇺🇸",
  "Canadá": "🇨🇦",
  "Brasil": "🇧🇷",
  "Italia": "🇮🇹",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Portugal": "🇵🇹"
};

function obtenerBandera(pais) {
  return banderasPaises[pais] || "🏳️";
}

function calcularPartidoCaliente(data) {
  if (!Array.isArray(data.partidos) || data.partidos.length === 0) {
    return {
      equipoA: "México",
      equipoB: "Sudáfrica",
      fecha: "15 junio",
      hora: "18:00 hrs",
      votos: { equipoA: 0, empate: 0, equipoB: 0 },
      banderaA: "🇲🇽",
      banderaB: "🇿🇦"
    };
  }

  // Buscar el primer partido que sea "Pendiente" o no tenga resultado
  var partidoCand = data.partidos.find(function (p) {
    return p.Estado === "Pendiente" || !p.ResultadoReal;
  });

  if (!partidoCand) {
    partidoCand = data.partidos[0];
  }

  var votosA = 0;
  var empate = 0;
  var votosB = 0;

  if (Array.isArray(data.pronosticos)) {
    data.pronosticos.forEach(function (pr) {
      if (pr.PartidoID === partidoCand.PartidoID) {
        if (pr.Pronostico === "L") votosA++;
        else if (pr.Pronostico === "E") empate++;
        else if (pr.Pronostico === "V") votosB++;
      }
    });
  }

  return {
    equipoA: partidoCand.Local,
    equipoB: partidoCand.Visitante,
    fecha: partidoCand.Fecha,
    hora: partidoCand.Hora,
    votos: {
      equipoA: votosA,
      empate: empate,
      equipoB: votosB
    },
    banderaA: obtenerBandera(partidoCand.Local),
    banderaB: obtenerBandera(partidoCand.Visitante)
  };
}

function calcularDatoLoco(pCaliente, data) {
  if (!pCaliente) return "¡Que comience el torneo! ⚽";
  
  var total = pCaliente.votos.equipoA + pCaliente.votos.empate + pCaliente.votos.equipoB;
  if (total === 0) {
    return "¡Nadie ha pronosticado el partido caliente todavía! Sé el primero. 📝";
  }

  var pctA = (pCaliente.votos.equipoA / total) * 100;
  var pctB = (pCaliente.votos.equipoB / total) * 100;
  var pctE = (pCaliente.votos.empate / total) * 100;

  if (pctA >= 50) {
    return "La oficina lo tiene claro: la mayoría va con " + pCaliente.equipoA + ". 🌮⚽";
  } else if (pctB >= 50) {
    return "La oficina lo tiene claro: la mayoría va con " + pCaliente.equipoB + ". ✈️⚽";
  } else if (pctE >= 40) {
    return "¡Hay olor a empate! La oficina cree que " + pCaliente.equipoA + " y " + pCaliente.equipoB + " no se sacarán ventajas. 🤝";
  } else {
    return "¡Pronóstico reservado! Las opiniones en la oficina están muy divididas entre " + pCaliente.equipoA + " y " + pCaliente.equipoB + ". 🔥";
  }
}

/* ===========================================
   MODO CLARO / OSCURO
   =========================================== */

function initTheme() {
  var saved = localStorage.getItem('quiniela-theme');
  var theme = saved || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  updateToggleIcon(theme);
}

function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme') || 'dark';
  var next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('quiniela-theme', next);
  updateToggleIcon(next);
}

function updateToggleIcon(theme) {
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  btn.title = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
}

/* ===========================================
   RENDER: LUCES DE FERIA
   =========================================== */

function renderLuces() {
  var container = document.getElementById('luces');
  var colores = ['#ff2d78', '#ffc107', '#00d4ff', '#00e676', '#ff9100', '#b44dff', '#ff6b6b', '#4ecdc4'];
  var cantidad = 35;
  var html = '';
  for (var i = 0; i < cantidad; i++) {
    var color = colores[i % colores.length];
    var delay = (Math.random() * 3).toFixed(1);
    html += '<span class="luz" style="background:' + color + '; box-shadow: 0 0 6px ' + color + ', 0 0 14px ' + color + '; animation-delay:' + delay + 's;"></span>';
  }
  container.innerHTML = html;
}

/* ===========================================
   RENDER: STATS RÁPIDOS
   =========================================== */

function renderStatsRapidos() {
  var activos = participantes.filter(function (p) { return p.activo; }).length;
  var jugados = metadata.partidosJugados || 0;
  var pendientes = metadata.partidosPendientes || 0;
  var ultimaAct = metadata.ultimaActualizacion || '';

  var items = [
    { icon: '👥', value: activos,     label: 'Participantes' },
    { icon: '⚽', value: jugados,     label: 'Jugados' },
    { icon: '📅', value: pendientes,  label: 'Pendientes' },
    { icon: '🕐', value: ultimaAct,   label: 'Última actualización', small: true }
  ];

  document.getElementById('stats-rapidos').innerHTML = items.map(function (s) {
    var valClass = s.small ? 'stat-value stat-value-sm' : 'stat-value';
    return '<div class="stat-item">' +
      '<span class="stat-icon">' + s.icon + '</span>' +
      '<span class="' + valClass + '">' + s.value + '</span>' +
      '<span class="stat-label">' + s.label + '</span>' +
      '</div>';
  }).join('');
}

/* ===========================================
   RENDER: BANDERINES
   =========================================== */

function renderBanderines(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var colores = ['#ff2d78', '#ffc107', '#00d4ff', '#00e676', '#ff9100', '#b44dff', '#ff6b6b', '#4ecdc4'];
  var cantidad = 24;
  var html = '<div class="cuerda"></div><div class="banderines-fila">';
  for (var i = 0; i < cantidad; i++) {
    html += '<span class="banderin" style="border-top-color:' + colores[i % colores.length] + ';"></span>';
  }
  html += '</div>';
  el.innerHTML = html;
}

/* ===========================================
   RENDER: CARRERA DE LA FERIA (v4 — avatar real + stats)
   =========================================== */

function renderCarrera() {
  var pista = document.getElementById('pista');
  var maxPuntos = Math.max.apply(null, participantes.map(function (p) { return p.puntos; }));
  var sorted = participantes.slice().sort(function (a, b) { return a.posicion - b.posicion; });

  var html = '';

  // Header bar: SALIDA / META
  html += '<div class="pista-marcadores">';
  html += '<span class="marcador-salida">🚦 SALIDA</span>';
  html += '<span class="marcador-meta">META 🏁</span>';
  html += '</div>';

  html += '<div class="pista-carriles">';

  sorted.forEach(function (p, index) {
    var avance  = (p.puntos / maxPuntos) * 76;
    var esLider = (index === 0);
    var claseCarril = 'carril' + (esLider ? ' carril-lider' : '');

    html += '<div class="' + claseCarril + '">';

    // SIDEBAR: posicion + alias + puntos
    html += '<div class="carril-sidebar">';
    html += '<div class="carril-pos-badge" style="background:' + p.color + ';">' + p.posicion + '</div>';
    html += '<div class="carril-alias">' + p.alias + '</div>';
    html += '<div class="carril-puntos">' + p.puntos + ' pts</div>';
    html += '</div>';

    // TRACK: zona de carrera
    html += '<div class="carril-track">';

    // Número grande decorativo (watermark de fondo)
    html += '<div class="carril-watermark" style="color:' + p.color + ';">' + p.puntos + '</div>';

    // Chip de stats fijo en extremo derecho del carril
    html += '<div class="carril-score">';
    html += '<span class="carril-score-pts">' + p.puntos + ' pts</span>';
    html += '<span class="carril-score-label">✔ ' + p.aciertos + ' aciertos</span>';
    html += '</div>';

    // Avatar que avanza
    html += '<div class="caballo" data-avance="' + avance.toFixed(1) + '" style="left:0%;">';

    /*
     * AVATAR REAL vs PLACEHOLDER
     * img.onload  → oculta el .avatar-fallback (imagen cargo OK)
     * img.onerror → oculta la <img> (imagen no encontrada → queda fallback)
     * La img tiene position:absolute z-index:2 sobre el fallback z-index:1
     */
    var hasAvatar = p.avatar && p.avatar !== 'avatars/' && p.avatar !== 'avatars/null' && p.avatar !== 'avatars/undefined';
    html += '<div class="avatar-race">';
    if (hasAvatar) {
      html += '<img'
            + ' src="' + p.avatar + '"'
            + ' alt="' + p.alias + '"'
            + ' onload="this.nextElementSibling.style.display=\'none\';"'
            + ' onerror="this.style.display=\'none\';"'
            + '>';
    }
    html += '<div class="avatar-fallback">🐎</div>';
    
    // Tarjeta flotante para móvil (alias, puntos, aciertos)
    html += '<div class="avatar-tooltip">';
    html += '  <div class="tooltip-alias">' + p.alias + '</div>';
    html += '  <div class="tooltip-stats">';
    html += '    <span><strong>Pts:</strong> ' + p.puntos + '</span>';
    html += '    <span><strong>Aciertos:</strong> ' + p.aciertos + '</span>';
    html += '  </div>';
    html += '</div>';
    
    html += '</div>';

    html += '</div>'; // .caballo
    html += '</div>'; // .carril-track
    html += '</div>'; // .carril
  });

  html += '</div>'; // .pista-carriles
  pista.innerHTML = html;
}

function animarCarrera() {
  setTimeout(function () {
    var caballos = document.querySelectorAll('.caballo');
    for (var i = 0; i < caballos.length; i++) {
      (function (el, delay) {
        setTimeout(function () {
          el.style.left = el.getAttribute('data-avance') + '%';
        }, delay);
      })(caballos[i], i * 120);
    }
  }, 400);
}

/* ===========================================
   RENDER: TOP 5 / BOTTOM 5
   =========================================== */

function renderTopBottom() {
  var sorted = sortByPuntos(participantes, true);
  var top5 = sorted.slice(0, 5);
  var bottom5 = sorted.slice(-5).reverse();

  var medallas = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  var bottomIcons = ['😅', '😂', '🤷', '🫠', '💀'];

  document.getElementById('top5').innerHTML = top5.map(function (p, i) {
    return '<div class="tb-item">' +
      '<span class="tb-medal">' + medallas[i] + '</span>' +
      crearAvatar(p, true) +
      '<div class="tb-info">' +
        '<span class="tb-alias">' + p.alias + '</span>' +
        '<span class="tb-pts">' + p.puntos + ' pts · ' + p.aciertos + ' aciertos</span>' +
      '</div>' +
      '<span class="tb-badge" style="background:' + p.color + '18; color:' + p.color + '; border:1px solid ' + p.color + '40;">' + p.porcentaje + '%</span>' +
      '</div>';
  }).join('');

  document.getElementById('bottom5').innerHTML = bottom5.map(function (p, i) {
    return '<div class="tb-item">' +
      '<span class="tb-medal">' + bottomIcons[i] + '</span>' +
      crearAvatar(p, true) +
      '<div class="tb-info">' +
        '<span class="tb-alias">' + p.alias + '</span>' +
        '<span class="tb-pts">' + p.puntos + ' pts · ' + p.aciertos + ' aciertos</span>' +
      '</div>' +
      '<span class="tb-badge tb-badge-low">' + p.porcentaje + '%</span>' +
      '</div>';
  }).join('');
}

/* ===========================================
   RENDER: PARTIDO CALIENTE / DATO LOCO
   =========================================== */

function renderPartidoCaliente() {
  var p = partidoCaliente;
  var total = p.votos.equipoA + p.votos.empate + p.votos.equipoB;
  var pctA = ((p.votos.equipoA / total) * 100).toFixed(0);
  var pctE = ((p.votos.empate / total) * 100).toFixed(0);
  var pctB = ((p.votos.equipoB / total) * 100).toFixed(0);

  document.getElementById('partido-caliente').innerHTML =
    '<div class="match-card">' +
      '<div class="match-date">' + p.fecha + ' · ' + p.hora + '</div>' +
      '<div class="match-teams">' +
        '<div class="match-team"><span class="match-flag">' + p.banderaA + '</span><span class="match-name">' + p.equipoA + '</span></div>' +
        '<div class="match-vs">VS</div>' +
        '<div class="match-team"><span class="match-flag">' + p.banderaB + '</span><span class="match-name">' + p.equipoB + '</span></div>' +
      '</div>' +
      '<div class="match-votes">' +
        '<div class="vote-header">Pronósticos de la oficina:</div>' +
        '<div class="vote-row">' +
          '<span class="vote-team">' + p.banderaA + ' ' + p.equipoA + '</span>' +
          '<div class="vote-bar-wrapper"><div class="vote-bar-fill vote-fill-a" style="width:' + pctA + '%;"></div></div>' +
          '<span class="vote-count">' + p.votos.equipoA + '</span>' +
        '</div>' +
        '<div class="vote-row">' +
          '<span class="vote-team">🤝 Empate</span>' +
          '<div class="vote-bar-wrapper"><div class="vote-bar-fill vote-fill-e" style="width:' + pctE + '%;"></div></div>' +
          '<span class="vote-count">' + p.votos.empate + '</span>' +
        '</div>' +
        '<div class="vote-row">' +
          '<span class="vote-team">' + p.banderaB + ' ' + p.equipoB + '</span>' +
          '<div class="vote-bar-wrapper"><div class="vote-bar-fill vote-fill-b" style="width:' + pctB + '%;"></div></div>' +
          '<span class="vote-count">' + p.votos.equipoB + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.getElementById('dato-loco').innerHTML =
    '<div class="dato-content">' +
      '<div class="dato-icon">💡</div>' +
      '<p class="dato-text">"' + datoLoco + '"</p>' +
    '</div>';
}

/* ===========================================
   RENDER: RANKING GENERAL
   =========================================== */

function renderRanking() {
  var sorted = participantes.slice().sort(function (a, b) { return a.posicion - b.posicion; });

  // --- Desktop: Tabla ---
  var thead =
    '<thead><tr>' +
      '<th>#</th><th></th><th>Alias</th><th>Pts</th><th>Aciertos</th><th>PJ</th><th>%</th>' +
    '</tr></thead>';

  var tbody = '<tbody>' + sorted.map(function (p) {
    return '<tr>' +
      '<td class="td-pos"><span class="pos-badge" style="background:' + p.color + ';">' + p.posicion + '</span></td>' +
      '<td class="td-avatar">' + crearAvatar(p, true) + '</td>' +
      '<td class="td-alias">' + p.alias + '</td>' +
      '<td class="td-pts"><strong>' + p.puntos + '</strong></td>' +
      '<td>' + p.aciertos + '</td>' +
      '<td>' + p.partidosJugados + '</td>' +
      '<td>' +
        '<div class="pct-bar-container">' +
          '<div class="pct-bar" style="width:' + p.porcentaje + '%; background:' + p.color + ';"></div>' +
          '<span class="pct-text">' + p.porcentaje + '%</span>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('') + '</tbody>';

  document.getElementById('ranking-desktop').innerHTML =
    '<table class="ranking-tabla">' + thead + tbody + '</table>';

  // --- Mobile: Tarjetas ---
  document.getElementById('ranking-mobile').innerHTML = sorted.map(function (p) {
    return '<div class="rm-card">' +
      '<div class="rm-header">' +
        '<span class="pos-badge" style="background:' + p.color + ';">' + p.posicion + '</span>' +
        crearAvatar(p, true) +
        '<span class="rm-alias">' + p.alias + '</span>' +
        '<span class="rm-pts">' + p.puntos + ' pts</span>' +
      '</div>' +
      '<div class="rm-stats">' +
        '<div class="rm-stat"><span class="rm-stat-label">Aciertos</span><span class="rm-stat-value">' + p.aciertos + '</span></div>' +
        '<div class="rm-stat"><span class="rm-stat-label">PJ</span><span class="rm-stat-value">' + p.partidosJugados + '</span></div>' +
        '<div class="rm-stat"><span class="rm-stat-label">Porcentaje</span><span class="rm-stat-value">' + p.porcentaje + '%</span></div>' +
      '</div>' +
    '</div>';
  }).join('');
}

/* ===========================================
   RENDER: RESUMEN GENERAL
   =========================================== */

function renderResumen() {
  var activos = participantes.filter(function (p) { return p.activo; }).length;
  var mejorPct = participantes.length > 0 ? Math.max.apply(null, participantes.map(function (p) { return p.porcentaje || 0; })) : 0;
  var sumPts = participantes.reduce(function (a, p) { return a + (p.puntos || 0); }, 0);
  var promedio = participantes.length > 0 ? (sumPts / participantes.length).toFixed(1) : '0';
  var totalPronosticos = participantes.reduce(function (a, p) { return a + (p.partidosJugados || 0); }, 0);
  var jugados = metadata.partidosJugados || 0;
  var pendientes = metadata.partidosPendientes || 0;

  var stats = [
    { icon: '👥', value: activos,           label: 'Participantes activos', color: '#00d4ff' },
    { icon: '⚽', value: jugados,           label: 'Partidos jugados',      color: '#00e676' },
    { icon: '📅', value: pendientes,        label: 'Partidos pendientes',   color: '#ffc107' },
    { icon: '📝', value: totalPronosticos,  label: 'Pronósticos registrados', color: '#ff9100' },
    { icon: '🏆', value: mejorPct + '%',    label: 'Mejor porcentaje',      color: '#ff2d78' },
    { icon: '📊', value: promedio,          label: 'Promedio general pts',  color: '#b44dff' }
  ];

  document.getElementById('resumen').innerHTML = stats.map(function (s) {
    return '<div class="resumen-card">' +
      '<span class="resumen-icon">' + s.icon + '</span>' +
      '<span class="resumen-value" style="color:' + s.color + ';">' + s.value + '</span>' +
      '<span class="resumen-label">' + s.label + '</span>' +
      '</div>';
  }).join('');
}

/* ===========================================
   CARGA DE DATOS (fetch JSON con fallback)
   =========================================== */

function mostrarError(err) {
  console.error("Error al cargar la quiniela:", err);
  var pista = document.getElementById('pista');
  if (pista) {
    pista.innerHTML = 
      '<div style="text-align:center; padding:3rem 1.5rem; background:rgba(255, 71, 87, 0.1); border: 1px solid rgba(255, 71, 87, 0.25); border-radius:14px; color:#ff4757; font-weight:700; font-size:1.1rem; max-width:600px; margin: 2rem auto;">' +
        '⚠️ No se pudieron cargar los datos de la quiniela. Intenta actualizar la página.' +
      '</div>';
  }
}

function mostrarIndicadorActualizacion() {
  var sub = document.querySelector('.header-subtitle');
  if (sub && metadata.ultimaActualizacion) {
    var updateText = ' · 🕐 Datos actualizados: ' + metadata.ultimaActualizacion;
    var existing = sub.querySelector('.update-indicator');
    if (!existing) {
      var span = document.createElement('span');
      span.className = 'update-indicator';
      span.style.opacity = '0.75';
      span.style.fontSize = '0.9em';
      span.style.display = 'block';
      span.style.marginTop = '0.4rem';
      span.textContent = updateText;
      sub.appendChild(span);
    } else {
      existing.textContent = updateText;
    }
  }
}

function mostrarAvisoRespaldo() {
  var sub = document.querySelector('.header-subtitle');
  if (sub) {
    var existing = sub.querySelector('.modo-prueba-indicator');
    if (!existing) {
      var span = document.createElement('span');
      span.className = 'modo-prueba-indicator';
      span.style.color = 'var(--gold)';
      span.style.opacity = '0.9';
      span.style.fontSize = '0.85em';
      span.style.display = 'inline-block';
      span.style.marginTop = '0.4rem';
      span.style.padding = '0.25rem 0.75rem';
      span.style.background = 'rgba(255, 193, 7, 0.08)';
      span.style.border = '1px solid rgba(255, 193, 7, 0.25)';
      span.style.borderRadius = '20px';
      span.style.fontWeight = '600';
      span.textContent = '✨ Modo prueba local: usando datos de ejemplo';
      sub.appendChild(span);
    }
  }
}

function procesarDatosJSON(data) {
  // 1. Procesar metadatos
  if (data.metadata) {
    metadata = data.metadata;
  }

  // 2. Procesar y filtrar participantes (Activo === "Sí" o true)
  if (Array.isArray(data.participantes)) {
    var rawParticipantes = data.participantes.filter(function (p) {
      var activoVal = p.Activo || p.activo;
      return activoVal === "Sí" || activoVal === true;
    });

    participantes = rawParticipantes.map(function (p) {
      return {
        posicion: p.Posicion !== undefined ? p.Posicion : (p.posicion !== undefined ? p.posicion : 0),
        alias: p.Alias || p.alias || "Sin nombre",
        avatar: p.Avatar ? (p.Avatar.indexOf('avatars/') === 0 ? p.Avatar : 'avatars/' + p.Avatar) : '',
        puntos: p.Puntos !== undefined ? p.Puntos : (p.puntos !== undefined ? p.puntos : 0),
        aciertos: p.Aciertos !== undefined ? p.Aciertos : (p.aciertos !== undefined ? p.aciertos : 0),
        partidosJugados: p.PartidosJugados !== undefined ? p.PartidosJugados : (p.partidosJugados !== undefined ? p.partidosJugados : 0),
        porcentaje: p.Porcentaje !== undefined ? p.Porcentaje : (p.porcentaje !== undefined ? p.porcentaje : 0),
        activo: true,
        color: p.Color || p.color || '#cccccc'
      };
    });
  }

  // 3. Procesar partidoCaliente y datoLoco (usar cálculo dinámico si no vienen en la raíz)
  if (data.partidoCaliente) {
    partidoCaliente = data.partidoCaliente;
  } else {
    partidoCaliente = calcularPartidoCaliente(data);
  }
  
  if (data.datoLoco) {
    datoLoco = data.datoLoco;
  } else {
    datoLoco = calcularDatoLoco(partidoCaliente, data);
  }

  // 4. Render de secciones dependientes de datos
  renderStatsRapidos();
  renderCarrera();
  renderTopBottom();
  renderPartidoCaliente();
  renderRanking();
  renderResumen();

  // Iniciar animación
  animarCarrera();
}

function cargarDatos() {
  fetch('data/quiniela.json?v=' + Date.now(), { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) {
        throw new Error("HTTP error " + res.status);
      }
      return res.json();
    })
    .then(function (data) {
      // Caso 1: Carga exitosa desde archivo JSON remoto/local
      procesarDatosJSON(data);
      mostrarIndicadorActualizacion();
    })
    .catch(function (err) {
      // Caso 2: Bloqueo de CORS (file://) o error de red -> Fallback a datos internos de respaldo
      console.warn("No se pudo cargar el JSON de datos remoto (bloqueo CORS file:// o error de red). Usando datos de respaldo internos:", err);
      try {
        procesarDatosJSON(datosRespaldo);
        mostrarAvisoRespaldo();
      } catch (backupErr) {
        // En el caso extremadamente improbable de que falle la carga en memoria, mostrar error visual
        mostrarError(backupErr);
      }
    });
}

/* ===========================================
   INICIALIZACIÓN
   =========================================== */

document.addEventListener('DOMContentLoaded', function () {
  // Tema: restaurar preferencia guardada
  initTheme();

  // Botón de tema
  var toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }

  // Render de elementos estáticos inmediatos
  renderLuces();
  renderBanderines('banderines-carrera');

  // Carga asíncrona de datos de la quiniela
  cargarDatos();

  // Controlador de eventos click para tooltip en móvil / desktop
  document.addEventListener('click', function (e) {
    var avatar = e.target.closest('.avatar-race');
    if (avatar) {
      var wasActive = avatar.classList.contains('active-tooltip');
      
      // Cerrar otros tooltips activos
      var activeTooltips = document.querySelectorAll('.avatar-race.active-tooltip');
      for (var i = 0; i < activeTooltips.length; i++) {
        activeTooltips[i].classList.remove('active-tooltip');
      }
      
      if (!wasActive) {
        avatar.classList.add('active-tooltip');
      }
      e.stopPropagation();
    } else {
      // Cerrar todos al hacer clic fuera
      var activeTooltips = document.querySelectorAll('.avatar-race.active-tooltip');
      for (var i = 0; i < activeTooltips.length; i++) {
        activeTooltips[i].classList.remove('active-tooltip');
      }
    }
  });
});
