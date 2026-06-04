/* ============================================================
   QUINIELA MUNDIALISTA 2026 — SCRIPT v3
   Web publica conectada a data/quiniela.json
   ============================================================ */

var participantes = [];
var partidos = [];
var pronosticos = [];
var partidoCaliente = null;
var datoLoco = '';
var metadata = {};
var maxPuntos = 1;

var datosRespaldo = {
  metadata: {
    ultimaActualizacion: '',
    totalParticipantes: 0,
    participantesActivos: 0,
    partidosJugados: 0,
    partidosPendientes: 0,
    totalPartidos: 0,
    fuente: 'Respaldo',
    modo: 'local'
  },
  participantes: []
};

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizarTexto(value) {
  return String(value == null ? '' : value).trim();
}

function numero(value, fallback) {
  var n = Number(value);
  return isNaN(n) ? fallback : n;
}

function estaActivo(value) {
  var v = normalizarTexto(value).toLowerCase();
  return v === 'sí' || v === 'si' || v === 'true' || v === '1';
}

function getInitial(alias) {
  var clean = normalizarTexto(alias).replace(/^(El |La |Don |Doña |Tío |Tia |Tía )/i, '');
  return (clean.charAt(0) || '?').toUpperCase();
}

function avatarUrl(nombreArchivo) {
  var avatar = normalizarTexto(nombreArchivo);
  if (!avatar) return '';
  if (avatar.indexOf('http://') === 0 || avatar.indexOf('https://') === 0 || avatar.indexOf('avatars/') === 0) return avatar;
  return 'avatars/' + avatar;
}

function normalizarParticipante(raw, index) {
  var alias = normalizarTexto(raw.Alias || raw.Nombre || ('Participante ' + (index + 1)));
  var color = normalizarTexto(raw.Color) || coloresParticipante(index);
  return {
    id: normalizarTexto(raw.ParticipanteID || raw.id || index + 1),
    nombre: normalizarTexto(raw.Nombre || alias),
    alias: alias,
    avatar: avatarUrl(raw.Avatar),
    color: color,
    activo: estaActivo(raw.Activo),
    puntos: numero(raw.Puntos, 0),
    aciertos: numero(raw.Aciertos, 0),
    partidosJugados: numero(raw.PartidosJugados, 0),
    porcentaje: numero(raw.Porcentaje, 0),
    posicion: numero(raw.Posicion, index + 1)
  };
}

function coloresParticipante(index) {
  var colores = ['#d93f3f', '#218a4d', '#2477b8', '#f08a24', '#8a4ccf', '#16a0a8', '#d6a437', '#3f6f3f'];
  return colores[index % colores.length];
}

function formatearFechaCDMX(valor) {
  if (!valor) return '';
  var fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) + ' CDMX';
}

function sortByRanking(arr) {
  return arr.slice().sort(function (a, b) {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    if (b.aciertos !== a.aciertos) return b.aciertos - a.aciertos;
    return a.alias.localeCompare(b.alias, 'es');
  });
}

function sortByPuntos(arr, desc) {
  var sorted = sortByRanking(arr);
  return desc ? sorted : sorted.reverse();
}

function crearAvatarMini(p) {
  var initial = getInitial(p.alias);
  return '<div class="avatar-mini-wrap" style="--participant-color:' + escapeHtml(p.color) + '">' +
    (p.avatar ? '<img src="' + escapeHtml(p.avatar) + '" alt="' + escapeHtml(p.alias) + '" onerror="this.remove(); this.parentElement.classList.add(\'avatar-no-img\');">' : '') +
    '<span>' + escapeHtml(initial) + '</span>' +
    '</div>';
}

function crearAvatarRace(p) {
  var initial = getInitial(p.alias);
  var img = p.avatar ? '<img src="' + escapeHtml(p.avatar) + '" alt="' + escapeHtml(p.alias) + '" onerror="this.remove(); this.parentElement.classList.add(\'avatar-no-img\');">' : '';
  return '<button class="avatar-race" type="button" aria-label="Ver avatar de ' + escapeHtml(p.alias) + '" style="--participant-color:' + escapeHtml(p.color) + '">' +
    img +
    '<span class="avatar-fallback">🏇</span>' +
    '<span class="avatar-tooltip">' +
      '<strong>' + escapeHtml(p.alias) + '</strong>' +
      '<small>' + p.puntos + ' pts · ' + p.aciertos + ' aciertos</small>' +
    '</span>' +
  '</button>';
}

var banderasPaises = {
  'México': '🇲🇽', 'Sudáfrica': '🇿🇦', 'Francia': '🇫🇷', 'Marruecos': '🇲🇦',
  'Argentina': '🇦🇷', 'Arabia Saudita': '🇸🇦', 'España': '🇪🇸', 'Alemania': '🇩🇪',
  'Estados Unidos': '🇺🇸', 'EE.UU.': '🇺🇸', 'USA': '🇺🇸', 'Canadá': '🇨🇦',
  'Brasil': '🇧🇷', 'Italia': '🇮🇹', 'Inglaterra': '🏴', 'Portugal': '🇵🇹'
};

function obtenerBandera(pais) {
  return banderasPaises[pais] || '🏳️';
}

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

function renderLuces() {
  var container = document.getElementById('luces');
  if (!container) return;
  var colores = ['#f2c766', '#ffffff', '#58c7f3', '#35b96f', '#f28c28'];
  var html = '';
  for (var i = 0; i < 28; i++) {
    var color = colores[i % colores.length];
    var delay = (Math.random() * 2.8).toFixed(1);
    html += '<span class="luz" style="--light-color:' + color + '; animation-delay:' + delay + 's;"></span>';
  }
  container.innerHTML = html;
}

function renderStatsRapidos() {
  var container = document.getElementById('stats-rapidos');
  if (!container) return;

  var activos = participantes.length;
  var jugados = numero(metadata.partidosJugados, 0);
  var pendientes = numero(metadata.partidosPendientes, 0);
  var ultimaAct = formatearFechaCDMX(metadata.ultimaActualizacion) || 'Sin actualizar';

  container.innerHTML = [
    { icon: '👥', value: activos, label: 'Participantes' },
    { icon: '⚽', value: jugados, label: 'Jugados' },
    { icon: '📅', value: pendientes, label: 'Pendientes' },
    { icon: '⏱️', value: ultimaAct, label: 'Actualización', small: true }
  ].map(function (item) {
    return '<div class="stat-item">' +
      '<span class="stat-icon">' + item.icon + '</span>' +
      '<strong class="' + (item.small ? 'stat-value stat-value-sm' : 'stat-value') + '">' + escapeHtml(item.value) + '</strong>' +
      '<span class="stat-label">' + item.label + '</span>' +
    '</div>';
  }).join('');
}

function renderPista() {
  var container = document.getElementById('pista');
  if (!container) return;
  var ranking = sortByRanking(participantes);
  maxPuntos = Math.max(1, ...ranking.map(function (p) { return p.puntos; }));

  if (ranking.length === 0) {
    container.innerHTML = '<div class="empty-state">Todavía no hay participantes activos.</div>';
    return;
  }

  var lanes = ranking.map(function (p, index) {
    var progreso = maxPuntos <= 0 ? 0 : Math.round((p.puntos / maxPuntos) * 100);
    var safeProgress = Math.max(0, Math.min(88, progreso));
    var lider = index === 0 ? ' carril-lider' : '';
    return '<div class="carril' + lider + '" style="--lane-color:' + escapeHtml(p.color) + ';">' +
      '<div class="carril-sidebar">' +
        '<span class="carril-pos-badge">' + (index + 1) + '</span>' +
        '<div class="carril-info">' +
          '<strong class="carril-alias">' + escapeHtml(p.alias) + '</strong>' +
          '<span class="carril-puntos">' + p.puntos + ' pts</span>' +
        '</div>' +
      '</div>' +
      '<div class="carril-track">' +
        '<span class="carril-watermark">' + p.puntos + '</span>' +
        '<div class="caballo" style="left: calc(' + safeProgress + '% - 24px);">' + crearAvatarRace(p) + '</div>' +
        '<div class="carril-score"><strong>' + p.puntos + ' pts</strong><span>✓ ' + p.aciertos + ' aciertos</span></div>' +
      '</div>' +
    '</div>';
  }).join('');

  container.innerHTML = '<div class="pista-marcadores"><span>🚦 Salida</span><span>Meta 🏁</span></div><div class="pista-carriles">' + lanes + '</div>';
  initAvatarInteractions();
}

function renderTopBottom() {
  var top = sortByPuntos(participantes, true).slice(0, 5);
  var bottom = sortByPuntos(participantes, false).slice(0, 5);
  var topEl = document.getElementById('top5');
  var bottomEl = document.getElementById('bottom5');

  if (topEl) {
    topEl.innerHTML = top.map(function (p, index) {
      var medallas = ['🥇', '🥈', '🥉', '⭐', '🔥'];
      return renderTbItem(p, medallas[index] || '⭐', 'Top ' + (index + 1));
    }).join('') || '<div class="empty-state">Sin participantes.</div>';
  }

  if (bottomEl) {
    bottomEl.innerHTML = bottom.map(function (p) {
      return renderTbItem(p, '😅', 'Ánimo');
    }).join('') || '<div class="empty-state">Sin participantes.</div>';
  }
}

function renderTbItem(p, icon, badge) {
  return '<div class="tb-item">' +
    '<span class="tb-medal">' + icon + '</span>' +
    crearAvatarMini(p) +
    '<div class="tb-info"><strong class="tb-alias">' + escapeHtml(p.alias) + '</strong><span class="tb-pts">' + p.puntos + ' pts · ' + p.aciertos + ' aciertos</span></div>' +
    '<span class="tb-badge">' + escapeHtml(badge) + '</span>' +
  '</div>';
}

function calcularPartidoCaliente(data) {
  var listaPartidos = Array.isArray(data.partidos) ? data.partidos : [];
  if (listaPartidos.length === 0) return null;

  var partido = listaPartidos.find(function (p) {
    var estado = normalizarTexto(p.Estado).toLowerCase();
    return estado !== 'jugado' && estado !== 'finalizado';
  }) || listaPartidos[0];

  var votosA = 0;
  var empate = 0;
  var votosB = 0;
  var partidoId = normalizarTexto(partido.PartidoID);

  if (Array.isArray(data.pronosticos)) {
    data.pronosticos.forEach(function (pr) {
      if (normalizarTexto(pr.PartidoID) === partidoId) {
        var pronostico = normalizarTexto(pr.Pronostico).toUpperCase();
        if (pronostico === 'L') votosA++;
        else if (pronostico === 'E') empate++;
        else if (pronostico === 'V') votosB++;
      }
    });
  }

  return {
    equipoA: normalizarTexto(partido.Local || 'Local'),
    equipoB: normalizarTexto(partido.Visitante || 'Visitante'),
    fecha: normalizarTexto(partido.Fecha || ''),
    hora: normalizarTexto(partido.Hora || ''),
    banderaA: obtenerBandera(partido.Local),
    banderaB: obtenerBandera(partido.Visitante),
    votos: { equipoA: votosA, empate: empate, equipoB: votosB }
  };
}

function calcularDatoLoco(pCaliente) {
  if (!pCaliente) return 'Todavía no hay partidos cargados para generar datos curiosos.';
  var total = pCaliente.votos.equipoA + pCaliente.votos.empate + pCaliente.votos.equipoB;
  if (total === 0) return 'Todavía nadie ha pronosticado el próximo partido. La quiniela está en modo misterio. 🕵️‍♂️';

  var opciones = [
    { nombre: pCaliente.equipoA, votos: pCaliente.votos.equipoA },
    { nombre: 'Empate', votos: pCaliente.votos.empate },
    { nombre: pCaliente.equipoB, votos: pCaliente.votos.equipoB }
  ].sort(function (a, b) { return b.votos - a.votos; });

  var ganador = opciones[0];
  var pct = Math.round((ganador.votos / total) * 100);

  if (pct >= 70) return 'La oficina trae cargada la brújula: ' + pct + '% va con ' + ganador.nombre + '. ⚽';
  if (pct >= 50) return 'Hay favorito claro: ' + ganador.nombre + ' concentra ' + pct + '% de los pronósticos. 🔥';
  return 'Partido dividido: nadie domina claramente los pronósticos. Aquí puede cambiar la tabla. 👀';
}

function renderPartidoCaliente() {
  var container = document.getElementById('partido-caliente');
  if (!container) return;
  if (!partidoCaliente) {
    container.innerHTML = '<div class="empty-state">No hay partido caliente disponible.</div>';
    return;
  }

  var total = partidoCaliente.votos.equipoA + partidoCaliente.votos.empate + partidoCaliente.votos.equipoB;
  function pct(v) { return total ? Math.round((v / total) * 100) : 0; }

  container.innerHTML = '<div class="match-card">' +
    '<div class="match-date">' + escapeHtml(partidoCaliente.fecha) + (partidoCaliente.hora ? ' · ' + escapeHtml(partidoCaliente.hora) : '') + '</div>' +
    '<div class="match-teams">' +
      '<div class="match-team"><span class="match-flag">' + partidoCaliente.banderaA + '</span><strong>' + escapeHtml(partidoCaliente.equipoA) + '</strong></div>' +
      '<span class="match-vs">VS</span>' +
      '<div class="match-team"><span class="match-flag">' + partidoCaliente.banderaB + '</span><strong>' + escapeHtml(partidoCaliente.equipoB) + '</strong></div>' +
    '</div>' +
    renderVoteRow(partidoCaliente.equipoA, pct(partidoCaliente.votos.equipoA), partidoCaliente.votos.equipoA, 'vote-fill-a') +
    renderVoteRow('Empate', pct(partidoCaliente.votos.empate), partidoCaliente.votos.empate, 'vote-fill-e') +
    renderVoteRow(partidoCaliente.equipoB, pct(partidoCaliente.votos.equipoB), partidoCaliente.votos.equipoB, 'vote-fill-b') +
  '</div>';
}

function renderVoteRow(label, pctValue, count, fillClass) {
  return '<div class="vote-row">' +
    '<span class="vote-team">' + escapeHtml(label) + '</span>' +
    '<div class="vote-bar-wrapper"><div class="vote-bar-fill ' + fillClass + '" style="width:' + pctValue + '%"></div></div>' +
    '<strong class="vote-count">' + count + '</strong>' +
  '</div>';
}

function renderDatoLoco() {
  var container = document.getElementById('dato-loco');
  if (!container) return;
  container.innerHTML = '<div class="dato-content"><div class="dato-icon">🎙️</div><p class="dato-text">' + escapeHtml(datoLoco) + '</p></div>';
}

function renderRanking() {
  var ranking = sortByRanking(participantes);
  var desktop = document.getElementById('ranking-desktop');
  var mobile = document.getElementById('ranking-mobile');

  if (desktop) {
    desktop.innerHTML = '<table class="ranking-tabla"><thead><tr>' +
      '<th>#</th><th></th><th>Participante</th><th>Puntos</th><th>Aciertos</th><th>Jugados</th><th>%</th>' +
      '</tr></thead><tbody>' + ranking.map(function (p, index) {
        return '<tr><td><span class="pos-badge" style="background:' + escapeHtml(p.color) + '">' + (index + 1) + '</span></td>' +
          '<td>' + crearAvatarMini(p) + '</td>' +
          '<td class="td-alias">' + escapeHtml(p.alias) + '</td>' +
          '<td class="td-pts">' + p.puntos + '</td>' +
          '<td>' + p.aciertos + '</td>' +
          '<td>' + p.partidosJugados + '</td>' +
          '<td><div class="pct-bar-container"><div class="pct-bar" style="width:' + Math.max(4, Math.min(100, p.porcentaje)) + '%;background:' + escapeHtml(p.color) + '"></div><span>' + p.porcentaje + '%</span></div></td></tr>';
      }).join('') + '</tbody></table>';
  }

  if (mobile) {
    mobile.innerHTML = ranking.map(function (p, index) {
      return '<div class="rm-card">' +
        '<div class="rm-header"><span class="pos-badge" style="background:' + escapeHtml(p.color) + '">' + (index + 1) + '</span>' + crearAvatarMini(p) + '<strong class="rm-alias">' + escapeHtml(p.alias) + '</strong><span class="rm-pts">' + p.puntos + ' pts</span></div>' +
        '<div class="rm-stats"><span><strong>' + p.aciertos + '</strong>Aciertos</span><span><strong>' + p.partidosJugados + '</strong>Jugados</span><span><strong>' + p.porcentaje + '%</strong>Efectividad</span></div>' +
      '</div>';
    }).join('');
  }
}

function renderResumen() {
  var container = document.getElementById('resumen');
  if (!container) return;
  var lider = sortByRanking(participantes)[0];
  var promedio = participantes.length ? Math.round(participantes.reduce(function (acc, p) { return acc + p.puntos; }, 0) / participantes.length) : 0;
  var mejorPct = participantes.length ? Math.max.apply(null, participantes.map(function (p) { return p.porcentaje; })) : 0;

  var cards = [
    { icon: '👑', value: lider ? lider.alias : '—', label: 'Líder actual' },
    { icon: '📈', value: promedio + ' pts', label: 'Promedio' },
    { icon: '🎯', value: mejorPct + '%', label: 'Mejor efectividad' },
    { icon: '👥', value: participantes.length, label: 'Activos' },
    { icon: '✅', value: numero(metadata.partidosJugados, 0), label: 'Partidos jugados' },
    { icon: '⏳', value: numero(metadata.partidosPendientes, 0), label: 'Pendientes' }
  ];

  container.innerHTML = cards.map(function (card) {
    return '<div class="resumen-card"><span class="resumen-icon">' + card.icon + '</span><strong class="resumen-value">' + escapeHtml(card.value) + '</strong><span class="resumen-label">' + card.label + '</span></div>';
  }).join('');
}

function initAvatarInteractions() {
  document.querySelectorAll('.avatar-race').forEach(function (avatar) {
    avatar.addEventListener('click', function (event) {
      event.stopPropagation();
      document.querySelectorAll('.avatar-race.active-tooltip').forEach(function (item) {
        if (item !== avatar) item.classList.remove('active-tooltip');
      });
      avatar.classList.toggle('active-tooltip');
    });
  });
}

document.addEventListener('click', function () {
  document.querySelectorAll('.avatar-race.active-tooltip').forEach(function (item) {
    item.classList.remove('active-tooltip');
  });
});

function prepararDatos(data) {
  metadata = data.metadata || {};
  partidos = Array.isArray(data.partidos) ? data.partidos : [];
  pronosticos = Array.isArray(data.pronosticos) ? data.pronosticos : [];
  participantes = (Array.isArray(data.participantes) ? data.participantes : [])
    .map(normalizarParticipante)
    .filter(function (p) { return p.activo; });
  partidoCaliente = calcularPartidoCaliente(data);
  datoLoco = calcularDatoLoco(partidoCaliente);
}

function renderAll() {
  renderLuces();
  renderStatsRapidos();
  renderPista();
  renderTopBottom();
  renderPartidoCaliente();
  renderDatoLoco();
  renderRanking();
  renderResumen();
}

function cargarDatos() {
  fetch('data/quiniela.json?v=' + Date.now(), { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('No se pudo cargar quiniela.json');
      return response.json();
    })
    .then(function (data) {
      prepararDatos(data);
      renderAll();
    })
    .catch(function () {
      prepararDatos(datosRespaldo);
      renderAll();
    });
}

document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  var toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.addEventListener('click', toggleTheme);
  cargarDatos();
});
