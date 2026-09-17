/* LSPedia — laboratorio del nuevo videojuego educativo.
   Prototipo aislado: no se integra al menú público.
   Para retos visuales usa únicamente data/vocabulario.json; nunca Diccionario. */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const ui = {
    intro: $('introJuego'), partida: $('partidaJuego'), resumen: $('resumenJuego'),
    modo: $('modoJuego'), nivel: $('nivelJuego'), iniciar: $('btnIniciarJuego'), repetir: $('btnRepetirJuego'),
    paso: $('hudPaso'), puntos: $('hudPuntos'), racha: $('hudRacha'), vidas: $('hudVidas'),
    ciudad: $('ciudadJuego'), ruta: $('rutaJuego'), linea: $('lineaRutaJuego'), jugador: $('jugadorJuego'),
    titulo: $('tituloReto'), instruccion: $('instruccionReto'), tipo: $('tipoReto'),
    pregunta: $('preguntaJuego'), opciones: $('opcionesJuego'), feedback: $('feedbackJuego'),
    resumenPuntos: $('resumenPuntos'), resumenTexto: $('resumenTexto')
  };

  const TOTAL = 10;
  const STORAGE_RECORD = 'lspedia_lab_juego_record_v2';
  const STORAGE_PROGRESS = 'lspedia_lab_juego_progreso_v2';
  let vocabulario = [];
  let estado = null;
  let bloqueado = false;
  let retoAnterior = '';

  const GRAMATICA = {
    facil: [
      ['Elige la oración correcta.', ['La niña come una manzana.', 'La niña comen una manzana.', 'La niña comer una manzana.', 'Niña la come manzana.'], 0, 'Concordancia', '“La niña” es singular, por eso corresponde “come”.'],
      ['Completa: “Los niños ___ en el parque.”', ['juega', 'juegan', 'jugando es', 'jugar'], 1, 'Verbo', '“Los niños” es plural, por eso corresponde “juegan”.'],
      ['Elige el plural correcto de “flor”.', ['flors', 'flor', 'flores', 'flore'], 2, 'Plural', 'El plural de “flor” es “flores”.'],
      ['Completa: “___ casa es grande.”', ['La', 'Los', 'Unas', 'El'], 0, 'Artículo', '“Casa” es femenino singular: “la casa”.'],
      ['Orden correcto.', ['Yo agua tomo.', 'Agua yo tomo.', 'Yo tomo agua.', 'Tomo yo el agua.'], 2, 'Orden de oración', 'En español, una forma clara es sujeto + verbo + complemento: “Yo tomo agua”.']
    ],
    medio: [
      ['Completa: “Ayer nosotros ___ al mercado.”', ['vamos', 'fuimos', 'iremos', 'ir'], 1, 'Tiempo verbal', '“Ayer” indica pasado; “fuimos” expresa una acción pasada.'],
      ['¿Cuál oración expresa una causa?', ['Llegué temprano.', 'No fui porque estaba enfermo.', 'Mañana estudiaré.', 'Ese libro es azul.'], 1, 'Conector', '“Porque” introduce la causa de no haber ido.'],
      ['Elige la concordancia correcta.', ['Esas personas está felices.', 'Esas personas están felices.', 'Esas persona están feliz.', 'Esas personas estar felices.'], 1, 'Concordancia', '“Personas” es plural: “esas personas están felices”.'],
      ['Completa: “Quiero estudiar, ___ estoy cansado.”', ['pero', 'porque de', 'y que', 'cuando de'], 0, 'Conector', '“Pero” contrasta dos ideas: querer estudiar y estar cansado.'],
      ['¿Cuál está en futuro?', ['Ella cocinó.', 'Ella cocina.', 'Ella cocinará.', 'Ella cocinaba.'], 2, 'Tiempo verbal', '“Cocinará” expresa una acción futura.']
    ],
    dificil: [
      ['Elige la oración más clara.', ['Aunque llovía, continuamos caminando.', 'Aunque llovía continuamos porque caminando.', 'Llovía aunque nosotros continuamos de caminar.', 'Continuamos aunque caminar llovía.'], 0, 'Estructura', '“Aunque llovía” introduce una dificultad y la segunda parte indica que la acción continuó.'],
      ['Completa: “Si hubiera sabido, te ___ antes.”', ['avisaría', 'avisé', 'habría avisado', 'aviso'], 2, 'Condicional', 'La estructura “si hubiera...” se combina aquí con “habría avisado”.'],
      ['¿Cuál usa correctamente “sin embargo”?', ['Estudié; sin embargo, no aprobé.', 'Estudié sin embargo porque aprobé.', 'Sin embargo estudié de aprobar.', 'Estudié para sin embargo aprobar.'], 0, 'Conector', '“Sin embargo” marca contraste entre estudiar y no aprobar.'],
      ['Elige la opción con pronombre correcto.', ['A María le entregué el libro.', 'A María lo entregué el libro.', 'María se entregué libro.', 'A María la entregué el libro.'], 0, 'Pronombres', '“Le” funciona como complemento indirecto: se entrega el libro a María.'],
      ['Completa: “El informe ___ ayer ya fue revisado.”', ['que envié', 'que enviar', 'enviado yo que', 'que envío mañana'], 0, 'Oración subordinada', '“Que envié ayer” describe cuál informe ya fue revisado.']
    ]
  };

  function normalizarNivel(valor) {
    const n = String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    if (n === 'facil') return 'facil';
    if (n === 'medio') return 'medio';
    if (n === 'dificil') return 'dificil';
    return '';
  }

  function barajar(lista) {
    const a = lista.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function imagenReal(v) {
    const s = String(v || '').split(',')[0].trim();
    if (!s || !/\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(s)) return '';
    try {
      const u = new URL(s, location.href);
      if (!['http:', 'https:'].includes(u.protocol)) return '';
      return u.href;
    } catch (_e) { return ''; }
  }

  async function fetchJsonResiliente(url, intentos = 2) {
    let ultimoError = null;
    for (let intento = 0; intento < intentos; intento += 1) {
      const controlador = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const temporizador = controlador ? setTimeout(() => controlador.abort(), 6000) : 0;
      try {
        const r = await fetch(url, {
          cache: 'no-store',
          signal: controlador ? controlador.signal : undefined
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await r.json();
      } catch (error) {
        ultimoError = error;
        if (intento + 1 < intentos) await new Promise(resolve => setTimeout(resolve, 350 * (intento + 1)));
      } finally {
        if (temporizador) clearTimeout(temporizador);
      }
    }
    throw ultimoError || new Error('No se pudo cargar el recurso.');
  }

  async function cargarVocabulario() {
    try {
      const data = await fetchJsonResiliente('data/vocabulario.json?_lab=' + Date.now(), 2);
      vocabulario = (Array.isArray(data) ? data : [])
        .filter(x => x && String(x.palabra || '').trim() && imagenReal(x.imagen))
        .map(x => ({
          palabra: String(x.palabra).trim(),
          imagen: imagenReal(x.imagen),
          nivel: normalizarNivel(x.nivel)
        }));
    } catch (e) {
      console.warn('[Misión LSPedia] Vocabulario visual no disponible:', e);
      vocabulario = [];
    }
  }

  function elegirSinRepetir(lista, clave) {
    if (!lista.length) return null;
    const candidatas = barajar(lista);
    const distinta = candidatas.find(item => clave(item) !== retoAnterior);
    return distinta || candidatas[0];
  }

  function retoGramatica(nivel) {
    const banco = GRAMATICA[nivel] || GRAMATICA.facil;
    const item = elegirSinRepetir(banco, x => x[0]) || banco[0];
    retoAnterior = item[0];
    const correcta = item[1][item[2]];
    const opciones = barajar(item[1]);
    return {
      tipo: 'ESPAÑOL', titulo: item[3], instruccion: item[0],
      pregunta: '', opciones, correcta: opciones.indexOf(correcta), visual: null,
      explicacion: item[4] || ''
    };
  }

  function retoVocabulario(nivel) {
    const porNivel = vocabulario.filter(x => !x.nivel || x.nivel === nivel);
    const banco = porNivel.length >= 4 ? porNivel : vocabulario;
    if (banco.length < 4) return null;
    const objetivos = barajar(banco).filter(x => x.palabra !== retoAnterior);
    const objetivo = objetivos[0] || banco[0];
    const distractores = barajar(banco.filter(x => x.palabra !== objetivo.palabra)).slice(0, 3);
    const elegidas = [objetivo, ...distractores];
    if (elegidas.length < 4) return null;
    retoAnterior = objetivo.palabra;
    const opciones = barajar(elegidas.map(x => x.palabra));
    return {
      tipo: 'ESPAÑOL', titulo: 'Vocabulario visual', instruccion: '¿Qué palabra corresponde a esta imagen?',
      pregunta: '', opciones, correcta: opciones.indexOf(objetivo.palabra), visual: objetivo.imagen,
      explicacion: `La imagen corresponde a “${objetivo.palabra}”.`
    };
  }

  function retoMatematicas(nivel) {
    let a, b, op, respuesta, opciones;
    if (nivel === 'facil') {
      a = 2 + Math.floor(Math.random() * 18); b = 1 + Math.floor(Math.random() * 12); op = Math.random() < .55 ? '+' : '−';
      if (op === '−' && b > a) [a, b] = [b, a];
      respuesta = op === '+' ? a + b : a - b;
    } else if (nivel === 'medio') {
      if (Math.random() < .55) { a = 2 + Math.floor(Math.random() * 10); b = 2 + Math.floor(Math.random() * 10); op = '×'; respuesta = a * b; }
      else { b = 2 + Math.floor(Math.random() * 9); respuesta = 2 + Math.floor(Math.random() * 10); a = b * respuesta; op = '÷'; }
    } else {
      const tipo = Math.floor(Math.random() * 3);
      if (tipo === 0) { a = 12 + Math.floor(Math.random() * 38); b = 3 + Math.floor(Math.random() * 12); op = '×'; respuesta = a * b; }
      else if (tipo === 1) { b = 3 + Math.floor(Math.random() * 12); respuesta = 5 + Math.floor(Math.random() * 18); a = b * respuesta; op = '÷'; }
      else { a = 80 + Math.floor(Math.random() * 120); b = 20 + Math.floor(Math.random() * 70); op = '−'; respuesta = a - b; }
    }
    const clave = `${a}${op}${b}`;
    if (clave === retoAnterior) return retoMatematicas(nivel);
    retoAnterior = clave;
    const candidatos = new Set([respuesta]);
    let intento = 0;
    while (candidatos.size < 4 && intento++ < 30) {
      const delta = (1 + Math.floor(Math.random() * Math.max(3, Math.ceil(Math.abs(respuesta) * .18)))) * (Math.random() < .5 ? -1 : 1);
      candidatos.add(Math.max(0, respuesta + delta));
    }
    opciones = barajar([...candidatos]).slice(0, 4).map(String);
    return {
      tipo:'MATEMÁTICAS', titulo:'Activa la estación', instruccion:'Resuelve la operación.',
      pregunta:`${a} ${op} ${b} = ?`, opciones, correcta:opciones.indexOf(String(respuesta)), visual:null,
      explicacion:`${a} ${op} ${b} = ${respuesta}.`
    };
  }

  function crearReto() {
    if (estado.modo === 'matematicas') return retoMatematicas(estado.nivel);
    if (estado.modo === 'espanol') {
      const visual = Math.random() < .4 ? retoVocabulario(estado.nivel) : null;
      return visual || retoGramatica(estado.nivel);
    }
    if (estado.paso % 2 === 1) return retoMatematicas(estado.nivel);
    const visual = Math.random() < .35 ? retoVocabulario(estado.nivel) : null;
    return visual || retoGramatica(estado.nivel);
  }

  function construirMundo() {
    ui.ciudad.textContent = '';
    for (let i = 0; i < 11; i++) {
      const b = document.createElement('div'); b.className = 'building';
      b.style.height = `${55 + ((i * 37) % 90)}px`; ui.ciudad.appendChild(b);
    }
    ui.ruta.querySelectorAll('.node').forEach(n => n.remove());
    for (let i = 0; i < TOTAL; i++) {
      const n = document.createElement('span'); n.className = 'node'; n.dataset.i = String(i); ui.ruta.appendChild(n);
    }
  }

  function actualizarMundo() {
    const progreso = Math.max(0, Math.min(100, (estado.paso / (TOTAL - 1)) * 100));
    ui.linea.style.setProperty('--progress', `${progreso}%`);
    ui.jugador.style.left = `calc(${5 + (estado.paso / (TOTAL - 1)) * 90}% - 21px)`;
    ui.ruta.querySelectorAll('.node').forEach((n, i) => {
      n.classList.toggle('done', i < estado.paso);
      n.classList.toggle('current', i === Math.min(estado.paso, TOTAL - 1));
    });
  }

  function actualizarHud() {
    ui.paso.textContent = `${Math.min(estado.paso + 1, TOTAL)}/${TOTAL}`;
    ui.puntos.textContent = String(estado.puntos);
    ui.racha.textContent = `${estado.racha} 🔥`;
    ui.vidas.textContent = '❤️'.repeat(Math.max(0, estado.vidas)) + '🖤'.repeat(Math.max(0, 3 - estado.vidas));
    actualizarMundo();
  }

  function mostrarReto() {
    bloqueado = false;
    ui.feedback.textContent = ''; ui.feedback.className = 'feedback';
    estado.reto = crearReto(); const r = estado.reto;
    ui.titulo.textContent = r.titulo; ui.instruccion.textContent = r.instruccion; ui.tipo.textContent = r.tipo;
    ui.pregunta.textContent = '';
    if (r.visual) {
      const img = document.createElement('img'); img.src = r.visual; img.alt = 'Imagen para identificar'; img.loading = 'eager';
      img.style.cssText = 'max-width:100%;max-height:170px;object-fit:contain;border-radius:12px'; ui.pregunta.appendChild(img);
    } else ui.pregunta.textContent = r.pregunta || 'Elige la mejor respuesta';
    ui.opciones.textContent = '';
    r.opciones.forEach((txt, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'option'; b.textContent = txt;
      b.addEventListener('click', () => responder(i, b)); ui.opciones.appendChild(b);
    });
    actualizarHud();
    const primera = ui.opciones.querySelector('button');
    if (primera) requestAnimationFrame(() => primera.focus({ preventScroll: true }));
  }

  function puntosBase() {
    if (!estado) return 100;
    return estado.nivel === 'dificil' ? 140 : (estado.nivel === 'medio' ? 120 : 100);
  }

  function responder(indice, boton) {
    if (bloqueado) return; bloqueado = true;
    const correcta = indice === estado.reto.correcta;
    [...ui.opciones.children].forEach((b, i) => {
      b.disabled = true;
      if (i === estado.reto.correcta) b.classList.add('correct');
    });
    if (correcta) {
      estado.racha += 1; estado.aciertos += 1; estado.puntos += puntosBase() + Math.min(estado.racha, 5) * 20;
      const prefijo = estado.racha >= 3 ? `¡Correcto! Racha ×${estado.racha}. ` : '¡Correcto! ';
      ui.feedback.textContent = prefijo + (estado.reto.explicacion || 'Estación activada.'); ui.feedback.className = 'feedback ok';
      ui.jugador.classList.add('jump');
    } else {
      boton.classList.add('wrong'); estado.racha = 0; estado.vidas = Math.max(0, estado.vidas - 1);
      ui.feedback.textContent = 'Respuesta correcta: ' + estado.reto.opciones[estado.reto.correcta] + '. ' + (estado.reto.explicacion || 'Observa la respuesta y continúa.');
      ui.feedback.className = 'feedback bad';
    }
    actualizarHud();
    setTimeout(() => {
      ui.jugador.classList.remove('jump'); estado.paso += 1;
      if (estado.paso >= TOTAL || estado.vidas <= 0) terminar(); else mostrarReto();
    }, 1350);
  }

  function leerProgreso() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_PROGRESS) || '{}');
      return data && typeof data === 'object' ? data : {};
    } catch (_e) { return {}; }
  }

  function guardarProgresoPartida(precision) {
    const progreso = leerProgreso();
    const clave = `${estado.modo}:${estado.nivel}`;
    const previo = progreso[clave] || { partidas: 0, mejorPuntaje: 0, mejorPrecision: 0, aciertos: 0, retos: 0 };
    progreso[clave] = {
      partidas: Number(previo.partidas || 0) + 1,
      mejorPuntaje: Math.max(Number(previo.mejorPuntaje || 0), estado.puntos),
      mejorPrecision: Math.max(Number(previo.mejorPrecision || 0), precision),
      aciertos: Number(previo.aciertos || 0) + estado.aciertos,
      retos: Number(previo.retos || 0) + Math.max(1, estado.paso),
      ultimaPartida: new Date().toISOString()
    };
    try { localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(progreso)); } catch (_e) {}
    return progreso[clave];
  }

  function iniciar() {
    retoAnterior = '';
    estado = {modo:ui.modo.value,nivel:ui.nivel.value,paso:0,puntos:0,racha:0,vidas:3,aciertos:0,reto:null};
    construirMundo(); ui.intro.classList.add('hidden'); ui.resumen.classList.add('hidden'); ui.partida.classList.remove('hidden'); mostrarReto();
  }

  function terminar() {
    ui.partida.classList.add('hidden'); ui.resumen.classList.remove('hidden'); ui.resumenPuntos.textContent = String(estado.puntos);
    const precision = Math.round((estado.aciertos / Math.max(1, estado.paso)) * 100);
    let record = 0; try { record = Number(localStorage.getItem(STORAGE_RECORD) || 0); } catch (_e) {}
    if (estado.puntos > record) { record = estado.puntos; try { localStorage.setItem(STORAGE_RECORD, String(record)); } catch (_e) {} }
    const progreso = guardarProgresoPartida(precision);
    ui.resumenTexto.textContent = `Aciertos: ${estado.aciertos} · Precisión: ${precision}% · Récord general: ${record} · Partidas en ${estado.nivel}: ${progreso.partidas} · Mejor precisión: ${progreso.mejorPrecision}%`;
    if (ui.repetir) requestAnimationFrame(() => ui.repetir.focus({ preventScroll: true }));
  }

  if (ui.feedback) {
    ui.feedback.setAttribute('role', 'status');
    ui.feedback.setAttribute('aria-live', 'polite');
  }
  if (ui.opciones) {
    ui.opciones.addEventListener('keydown', event => {
      const botones = [...ui.opciones.querySelectorAll('button:not(:disabled)')];
      const actual = botones.indexOf(document.activeElement);
      if (!botones.length || actual < 0) return;
      let siguiente = -1;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') siguiente = (actual + 1) % botones.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') siguiente = (actual - 1 + botones.length) % botones.length;
      if (siguiente >= 0) {
        event.preventDefault();
        botones[siguiente].focus();
      }
    });
  }

  ui.iniciar.addEventListener('click', iniciar);
  ui.repetir.addEventListener('click', () => { ui.resumen.classList.add('hidden'); ui.intro.classList.remove('hidden'); });
  cargarVocabulario();
})();
