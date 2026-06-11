/* ============================================================
   QUINIELA MUNDIALISTA 2026 — SCRIPT ESTABLE v8.5
   Mantiene contrato JSON:
   metadata, partidos, participantes, pronosticos, validaciones

   Cambios v8.6:
   - Refuerza carga de avatares con cache-buster por carga de página.
   - Elimina lazy loading en avatares de carrera para reducir fallos iniciales.
   - Reintenta cargar avatares antes de mostrar fallback genérico.
   - Mantiene lógica estable de resultados, ranking y visual responsive.
   ============================================================ */

const RUNTIME_VERSION = Date.now();
const DATA_URL = 'data/quiniela.json?v=' + RUNTIME_VERSION;

function avatarUrl(filename, retry = 0) {
  const cleanName = String(filename || '').trim();
  if (!cleanName) return '';
  const safeName = encodeURI(cleanName);
  const suffix = retry > 0 ? `&retry=${retry}` : '';
  return `avatars/${safeName}?v=${RUNTIME_VERSION}${suffix}`;
}

function avatarLoaded(img) {
  const holder = img.closest('.race-avatar, .mini-avatar');
  if (!holder) return;

  holder.classList.add('has-image');
  holder.classList.remove('waiting-image', 'no-image', 'is-retrying');
}

function avatarFailed(img) {
  const holder = img.closest('.race-avatar, .mini-avatar');
  if (!holder) return;

  const maxRetries = 3;
  const retry = Number(img.dataset.retry || 0);

  if (retry < maxRetries && img.dataset.avatarName) {
    const nextRetry = retry + 1;
    img.dataset.retry = String(nextRetry);
    holder.classList.add('is-retrying');

    window.setTimeout(() => {
      img.src = avatarUrl(img.dataset.avatarName, nextRetry);
    }, 250 * nextRetry);

    return;
  }

  holder.classList.remove('waiting-image', 'has-image', 'is-retrying');
  holder.classList.add('no-image');
}

function preloadAvatars(rows) {
  const uniqueAvatars = [...new Set(
    rows
      .map(p => String(p.avatar || '').trim())
      .filter(Boolean)
  )];

  uniqueAvatars.forEach((filename) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = avatarUrl(filename);
  });
}

let appData = null;
let participantes = [];
let partidos = [];
let pronosticos = [];

const $ = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await cargarDatos();
});

function initTheme() {
  const saved = localStorage.getItem('quiniela-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeButton(saved);

  const btn = $('theme-toggle');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('quiniela-theme', next);
    updateThemeButton(next);
  });
}

function updateThemeButton(theme) {
  const btn = $('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

async function cargarDatos() {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo cargar data/quiniela.json');

    appData = await res.json();
    participantes = normalizarParticipantes(appData.participantes || []);
    partidos = appData.partidos || [];
    pronosticos = appData.pronosticos || [];

    preloadAvatars(participantes);
    renderAll();
  } catch (err) {
    console.error(err);
    renderError();
  }
}

function normalizarParticipantes(rows) {
  return rows
    .filter((p) => {
      const activo = String(p.Activo || '').trim().toLowerCase();
      return activo === 'sí' || activo === 'si';
    })
    .map((p, index) => {
      const aciertos = numero(p.Aciertos);
      const jugados = numero(p.PartidosJugados);

      return {
        id: p.ParticipanteID ?? p.participanteID ?? index + 1,
        nombre: String(p.Nombre || '').trim(),
        alias: String(p.Alias || p.Nombre || `Participante ${index + 1}`).trim(),
        avatar: String(p.Avatar || '').trim(),
        color: String(p.Color || '').trim() || colorPorIndice(index),
        puntos: numero(p.Puntos),
        aciertos,
        jugados,
        porcentaje: calcularPorcentaje(aciertos, jugados),
        posicion: numero(p.Posicion) || index + 1,
        raw: p
      };
    })
    .sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.aciertos !== a.aciertos) return b.aciertos - a.aciertos;
      return a.alias.localeCompare(b.alias, 'es');
    })
    .map((p, index) => ({ ...p, posicionVisual: index + 1 }));
}

function calcularPorcentaje(aciertos, jugados) {
  if (!jugados || jugados <= 0) return 0;
  return Math.round((aciertos / jugados) * 100);
}

function numero(value) {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(String(value).replace('%', '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function colorPorIndice(i) {
  const colors = ['#d43d3d', '#1f8f4d', '#2477c7', '#e88918', '#8b44c6', '#c79b2f'];
  return colors[i % colors.length];
}

function renderAll() {
  renderStats();
  renderCarrera();
  renderTopBottom();
  renderPartidoCaliente();
  renderDatoLoco();
  renderRanking();
  renderResumen();
  initAvatarInteractions();
}

function renderError() {
  document.body.innerHTML = `
    <main class="error-screen">
      <h1>No se pudo cargar la quiniela</h1>
      <p>Revisa que <strong>data/quiniela.json</strong> exista y sea válido.</p>
    </main>
  `;
}

function formatearFechaCDMX(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
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

function renderStats() {
  const metadata = appData.metadata || {};
  const el = $('stats-rapidos');
  if (!el) return;

  const actualizacion = formatearFechaCDMX(metadata.ultimaActualizacion);

  const stats = [
    { icon: '👥', value: metadata.participantesActivos ?? participantes.length, label: 'Participantes' },
    { icon: '⚽', value: metadata.partidosJugados ?? contarPartidosJugados(), label: 'Jugados' },
    { icon: '📅', value: metadata.partidosPendientes ?? Math.max(0, partidos.length - contarPartidosJugados()), label: 'Pendientes' },
    { icon: '⏱️', value: actualizacion || 'Sin fecha', label: 'Actualización', small: true }
  ];

  el.innerHTML = stats.map(s => `
    <div class="stat-card">
      <span class="stat-icon">${s.icon}</span>
      <strong class="${s.small ? 'stat-small' : ''}">${escapeHtml(s.value)}</strong>
      <span>${escapeHtml(s.label)}</span>
    </div>
  `).join('');
}

function contarPartidosJugados() {
  return partidos.filter(p => {
    const estado = String(p.Estado || '').trim().toLowerCase();
    return estado === 'jugado' || estado === 'finalizado';
  }).length;
}

function renderCarrera() {
  const el = $('pista');
  if (!el) return;

  if (!participantes.length) {
    el.innerHTML = `<div class="empty-state">No hay participantes activos.</div>`;
    return;
  }

  const maxPuntos = Math.max(...participantes.map(p => p.puntos), 1);

  el.innerHTML = `
    <div class="race-labels">
      <span>Salida</span>
      <span>Meta</span>
    </div>
    <div class="race-lanes">
      ${participantes.map((p) => renderCarril(p, maxPuntos)).join('')}
    </div>
  `;
}

function renderCarril(p, maxPuntos) {
  const progreso = Math.max(0, Math.min(100, (p.puntos / maxPuntos) * 100));
  const avatarHtml = renderRaceAvatar(p);
  const runnerClass = progreso <= 8 ? 'runner--start' : progreso >= 92 ? 'runner--end' : '';

  return `
    <div class="race-lane ${p.posicionVisual === 1 ? 'race-leader' : ''}" style="--participant-color:${escapeAttr(p.color)}">
      <aside class="lane-info">
        <span class="rank-badge">${p.posicionVisual}</span>
        <div>
          <strong title="${escapeAttr(p.alias)}">${escapeHtml(p.alias)}</strong>
          <span>${p.puntos} pts</span>
        </div>
      </aside>

      <div class="lane-track">
        <span class="lane-watermark">${p.puntos}</span>
        <div class="runner ${runnerClass}" style="--progress:${progreso}">
          ${avatarHtml}
        </div>
        <div class="score-chip">
          <strong>${p.puntos} pts</strong>
          <span>Pos. ${p.posicionVisual}</span>
        </div>
      </div>
    </div>
  `;
}

function renderRaceAvatar(p) {
  const hasAvatar = Boolean(p.avatar);
  const img = hasAvatar
    ? `<img src="${escapeAttr(avatarUrl(p.avatar))}" data-avatar-name="${escapeAttr(p.avatar)}" data-retry="0" alt="${escapeAttr(p.alias)}" decoding="async" fetchpriority="high"
         onload="avatarLoaded(this)"
         onerror="avatarFailed(this)" />`
    : '';

  return `
    <button class="race-avatar ${hasAvatar ? 'waiting-image' : 'no-image'}" type="button" aria-label="Ver ${escapeAttr(p.alias)}">
      ${img}
      <span class="avatar-fallback" aria-hidden="true">🏇</span>
      <span class="avatar-popover">
        <strong>${escapeHtml(p.alias)}</strong>
        <small>${p.puntos} pts · Pos. ${p.posicionVisual}</small>
      </span>
    </button>
  `;
}

function renderTopBottom() {
  const top = participantes.slice(0, 5);
  const bottom = [...participantes].reverse().slice(0, 5);

  const topEl = $('top5');
  const bottomEl = $('bottom5');

  const topIcons = ['🏆', '⚡', '🎯', '🔥', '⭐'];
  const topBadges = ['Modo campeón', 'Viene fino', 'Acecha la cima', 'No perdona', 'En la pelea'];

  const bottomIcons = ['😅', '🛟', '🙏', '🧃', '🐢'];
  const bottomBadges = ['Modo convivencia', 'Aún respira', 'Fe intacta', 'Hay torneo', 'Calentando'];

  if (topEl) {
    topEl.innerHTML = top.length
      ? top.map((p, i) => renderMiniItem(p, topIcons[i] || '🏅', topBadges[i] || 'Enrachado')).join('')
      : `<div class="empty-state">Sin datos.</div>`;
  }

  if (bottomEl) {
    bottomEl.innerHTML = bottom.length
      ? bottom.map((p, i) => renderMiniItem(p, bottomIcons[i] || '😅', bottomBadges[i] || 'Ánimo')).join('')
      : `<div class="empty-state">Sin datos.</div>`;
  }
}

function renderMiniItem(p, icon, badge) {
  return `
    <div class="mini-item">
      <span class="mini-icon">${icon}</span>
      ${renderMiniAvatar(p)}
      <div class="mini-info">
        <strong>${escapeHtml(p.alias)}</strong>
        <span>${p.puntos} pts · ${p.porcentaje}% efectividad</span>
      </div>
      <span class="mini-badge">${escapeHtml(badge)}</span>
    </div>
  `;
}

function renderMiniAvatar(p) {
  const hasAvatar = Boolean(p.avatar);
  const img = hasAvatar
    ? `<img src="${escapeAttr(avatarUrl(p.avatar))}" data-avatar-name="${escapeAttr(p.avatar)}" data-retry="0" alt="${escapeAttr(p.alias)}" decoding="async" fetchpriority="low"
         onload="avatarLoaded(this)"
         onerror="avatarFailed(this)" />`
    : '';

  return `
    <span class="mini-avatar ${hasAvatar ? 'waiting-image' : 'no-image'}" style="--participant-color:${escapeAttr(p.color)}">
      ${img}
      <span>${escapeHtml(iniciales(p.alias))}</span>
    </span>
  `;
}

function renderPartidoCaliente() {
  const el = $('partido-caliente');
  if (!el) return;

  const partido = partidos.find(p => {
    const estado = String(p.Estado || '').trim().toLowerCase();
    return estado !== 'jugado' && estado !== 'finalizado';
  }) || partidos[0];

  if (!partido) {
    el.innerHTML = `<div class="empty-state">Sin partidos registrados.</div>`;
    return;
  }

  const partidoId = String(partido.PartidoID || '');
  const participantesActivosIds = new Set(participantes.map(p => String(p.id)));
  const votos = pronosticos.filter(pr => {
    const mismoPartido = String(pr.PartidoID || '') === partidoId;
    const participanteActivo = participantesActivosIds.has(String(pr.ParticipanteID || ''));
    const pronostico = String(pr.Pronostico || '').trim();
    return mismoPartido && participanteActivo && Boolean(pronostico);
  });

  const local = String(partido.Local || 'Local');
  const visitante = String(partido.Visitante || 'Visitante');

  const conteo = { local: 0, empate: 0, visitante: 0 };

  votos.forEach(v => {
    const pr = String(v.Pronostico || '').trim().toLowerCase();

    if (pr === 'l' || pr === 'local' || pr.includes(local.toLowerCase())) {
      conteo.local++;
    } else if (pr === 'e' || pr === 'x' || pr === 'empate' || pr.includes('empate')) {
      conteo.empate++;
    } else if (pr === 'v' || pr === 'visitante' || pr.includes(visitante.toLowerCase())) {
      conteo.visitante++;
    }
  });

  const total = Math.max(votos.length, 1);

  const opciones = [
    { nombre: local, votos: conteo.local },
    { nombre: 'Empate', votos: conteo.empate },
    { nombre: visitante, votos: conteo.visitante }
  ];

  const favorito = [...opciones].sort((a, b) => b.votos - a.votos)[0];

  let frase = 'Todavía no hay pronósticos cargados para este partido. El misterio sigue vivo. 🕵️';

  if (votos.length > 0 && favorito.votos > 0) {
    frase = `Ya hay ${votos.length} pronóstico${votos.length === 1 ? '' : 's'} cargado${votos.length === 1 ? '' : 's'}. La mayoría se está inclinando por ${escapeHtml(favorito.nombre)}. Veremos si fue sabiduría futbolera o exceso de confianza. 😅`;
  }

  el.innerHTML = `
    <div class="match-card">
      <div class="match-date">${escapeHtml(partido.Fecha || '')} ${escapeHtml(partido.Hora || '')}</div>

      <div class="match-teams">
        <div><strong>${escapeHtml(local)}</strong></div>
        <span>vs</span>
        <div><strong>${escapeHtml(visitante)}</strong></div>
      </div>

      <p class="match-hype">${frase}</p>

      ${renderVoteBar(local, conteo.local, total)}
      ${renderVoteBar('Empate', conteo.empate, total)}
      ${renderVoteBar(visitante, conteo.visitante, total)}
    </div>
  `;
}

function renderVoteBar(label, count, total) {
  const pct = Math.round((count / total) * 100);
  return `
    <div class="vote-row">
      <span>${escapeHtml(label)}</span>
      <div class="vote-track"><div style="width:${pct}%"></div></div>
      <strong>${count}</strong>
    </div>
  `;
}

function renderDatoLoco() {
  const el = $('dato-loco');
  if (!el) return;

  const jugados = contarPartidosJugados();
  const activos = participantes.length;
  const lider = participantes[0];
  const cola = participantes[participantes.length - 1];
  const totalPuntos = participantes.reduce((sum, p) => sum + p.puntos, 0);
  const mejorPorcentaje = participantes.length ? Math.max(...participantes.map(p => p.porcentaje)) : 0;
  const perfectos = participantes.filter(p => jugados > 0 && p.jugados > 0 && p.aciertos === p.jugados);
  const sinPuntos = participantes.filter(p => p.jugados > 0 && p.puntos === 0);

  const frases = [];

  if (jugados === 0) {
    frases.push('Todavía no rueda el balón y ya todos creen que saben de fútbol. Esto apenas empieza. ⚽');
    frases.push('La quiniela está limpia, los sueños intactos y las futuras burlas en preparación. 😌');
  }

  if (lider && jugados > 0) {
    frases.push(`${escapeHtml(lider.alias)} va liderando la quiniela. De momento, habla con autoridad mundialista. 🏆`);
  }

  if (lider && cola && lider.puntos > cola.puntos) {
    const ventaja = lider.puntos - cola.puntos;
    frases.push(`${escapeHtml(lider.alias)} le saca ${ventaja} pts al último lugar. La presión ya empezó. 😬`);
  }

  if (perfectos.length === 1) {
    frases.push(`${escapeHtml(perfectos[0].alias)} lleva paso perfecto: ${perfectos[0].puntos} pts en ${perfectos[0].jugados} partidos. Alguien revise si trae bola de cristal. 🔮`);
  }

  if (perfectos.length > 1) {
    frases.push(`${perfectos.length} participantes llevan paso perfecto. Esto se está poniendo sospechosamente serio. 👀`);
  }

  if (sinPuntos.length === 1) {
    frases.push(`${escapeHtml(sinPuntos[0].alias)} sigue buscando sus primeros puntos. Hay fe, hay esperanza y todavía hay Mundial. 😅`);
  }

  if (sinPuntos.length > 1) {
    frases.push(`${sinPuntos.length} participantes siguen sin sumar. Vinieron por la convivencia, y eso también cuenta. 🎉`);
  }

  if (jugados > 0 && totalPuntos > 0) {
    frases.push(`Entre todos ya suman ${totalPuntos} puntos. El comité de expertos empieza a tomar forma. 📊`);
  }

  if (jugados > 0 && mejorPorcentaje >= 80) {
    frases.push(`El mejor porcentaje actual es ${mejorPorcentaje}%. Hay nivel, o por lo menos mucha suerte bien administrada. 🎯`);
  }

  if (jugados > 0 && activos > 0) {
    frases.push(`${activos} participantes activos siguen en la pelea. Nadie está eliminado de las burlas ni de la gloria. 🌎`);
  }

  if (!frases.length) {
    frases.push('La quiniela está en modo misterio. Pronto habrá datos para presumir o para esconderse. 🕵️');
  }

  const indice = new Date().getMinutes() % frases.length;
  const texto = frases[indice];

  el.innerHTML = `
    <div class="fun-fact">
      <div>🎙️</div>
      <p>${texto}</p>
    </div>
  `;
}

function renderRanking() {
  renderRankingDesktop();
  renderRankingMobile();
}

function renderRankingDesktop() {
  const el = $('ranking-desktop');
  if (!el) return;

  el.innerHTML = `
    <table class="ranking-table">
      <thead>
        <tr>
          <th>Pos</th>
          <th>Participante</th>
          <th>Puntos</th>
          <th>Jugados</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        ${participantes.map(p => `
          <tr>
            <td><span class="table-rank">${p.posicionVisual}</span></td>
            <td class="participant-cell">${renderMiniAvatar(p)} <strong>${escapeHtml(p.alias)}</strong></td>
            <td>${p.puntos}</td>
            <td>${p.jugados}</td>
            <td>${p.porcentaje}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderRankingMobile() {
  const el = $('ranking-mobile');
  if (!el) return;

  el.innerHTML = participantes.map(p => `
    <div class="mobile-card">
      <div>${renderMiniAvatar(p)} <strong>${escapeHtml(p.alias)}</strong></div>
      <span>${p.puntos} pts · ${p.jugados} jugados · ${p.porcentaje}%</span>
    </div>
  `).join('');
}

function renderResumen() {
  const el = $('resumen');
  if (!el) return;

  const metadata = appData.metadata || {};
  const lider = participantes[0];

  const cards = [
    { icon: '🏆', value: lider ? lider.alias : '-', label: 'Líder actual' },
    { icon: '⚽', value: metadata.partidosJugados ?? contarPartidosJugados(), label: 'Partidos jugados' },
    { icon: '🎯', value: participantes.length ? Math.max(...participantes.map(p => p.puntos)) : 0, label: 'Mejor puntaje' },
    { icon: '👥', value: metadata.participantesActivos ?? participantes.length, label: 'Activos' },
    { icon: '✅', value: participantes.reduce((sum, p) => sum + p.puntos, 0), label: 'Puntos totales' },
    { icon: '⏳', value: metadata.partidosPendientes ?? Math.max(0, partidos.length - contarPartidosJugados()), label: 'Pendientes' }
  ];

  el.innerHTML = cards.map(c => `
    <div class="summary-card">
      <span>${c.icon}</span>
      <strong>${escapeHtml(c.value)}</strong>
      <small>${escapeHtml(c.label)}</small>
    </div>
  `).join('');
}

function initAvatarInteractions() {
  document.addEventListener('click', (e) => {
    const avatar = e.target.closest('.race-avatar');
    document.querySelectorAll('.race-avatar.is-open').forEach(a => {
      if (a !== avatar) a.classList.remove('is-open');
    });
    if (avatar) avatar.classList.toggle('is-open');
  });
}

function iniciales(text) {
  return String(text || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
