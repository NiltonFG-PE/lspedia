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
  const STORAGE_RECORD = 'lspedia_lab_juego_record_v1';
  let vocabulario = [];
  let estado = null;
  let bloqueado = false;

  const GRAMATICA = {
    facil: [
      ['Elige la oración correcta.', ['La niña come una manzana.', 'La niña comen una manzana.', 'La niña comer una manzana.', 'Niña la come manzana.'], 0, 'Concordancia'],
      ['Completa: “Los niños ___ en el parque.”', ['juega', 'juegan', 'jugando es', 'jugar'], 1, 'Verbo'],
      ['Elige el plural correcto de “flor”.', ['flors', 'flor', 'flores', 'flore'], 2, 'Plural'],
      ['Completa: “___ casa es grande.”', ['La', 'Los', 'Unas', 'El'], 0, 'Artículo'],
      ['Orden correcto.', ['Yo agua tomo.', 'Agua yo tomo.', 'Yo tomo agua.', 'Tomo yo el agua.'], 2, 'Orden de oración']
    ],
    medio: [
      ['Completa: “Ayer nosotros ___ al mercado.”', ['vamos', 'fuimos', 'iremos', 'ir'], 1, 'Tiempo verbal'],
      ['¿Cuál oración expresa una causa?', ['Llegué temprano.', 'No fui porque estaba enfermo.', 'Mañana estudiaré.', 'Ese libro es azul.'], 1, 'Conector'],
      ['Elige la concordancia correcta.', ['Esas personas está felices.', 'Esas personas están felices.', 'Esas persona están feliz.', 'Esas personas estar felices.'], 1, 'Concordancia'],
      ['Completa: “Quiero estudiar, ___ estoy cansado.”', ['pero', 'porque de', 'y que', 'cuando de'], 0, 'Conector'],
      ['¿Cuál está en futuro?', ['Ella cocinó.', 'Ella cocina.', 'Ella cocinará.', 'Ella cocinaba.'], 2, 'Tiempo verbal']
    ],
    dificil: [
      ['Elige la oración más clara.', ['Aunque llovía, continuamos caminando.', 'Aunque llovía continuamos porque caminando.', 'Llovía aunque nosotros continuamos de caminar.', 'Continuamos aunque caminar llovía.'], 0, 'Estructura'],
      ['Completa: “Si hubiera sabido, te ___ antes.”', ['avisaría', 'avisé', 'habría avisado', 'aviso'], 2, 'Condicional'],
      ['¿Cuál usa correctamente “sin embargo”?', ['Estudié; sin embargo, no aprobé.', 'Estudié sin embargo porque aprobé.', 'Sin embargo estudié de aprobar.', 'Estudié para sin embargo aprobar.'], 0, 'Conector'],
      ['Elige la opción con pronombre correcto.', ['A María le entregué el libro.', 'A María lo entregué el libro.', 'María se entregué libro.', 'A María la entregué el libro.'], 0, 'Pronombres'],
      ['Completa: “El informe ___ ayer ya fue revisado.”', ['que envié', 'que enviar', 'enviado yo que', 'que envío mañana'], 0, 'Oración subordinada']
    ]
  };

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

  async function cargarVocabulario() {
    try {
      const r = await fetch('data/vocabulario.json?_lab=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      vocabulario = (Array.isArray(data) ? data : [])
        .filter(x => x && String(x.palabra || '').trim() && imagenReal(x.imagen))
        .map(x => ({ palabra: String(x.palabra).trim(), imagen: imagenReal(x.imagen) }));
    } catch (e) {
      console.warn('[Misión LSPedia] Vocabulario visual no disponible:', e);
      vocabulario = [];
    }
  }

  function retoGramatica(nivel) {
    const banco = GRAMATICA[nivel] || GRAMATICA.facil;
    const item = banco[Math.floor(Math.random() * banco.length)];
    const correcta = item[1][item[2]];
    const opciones = barajar(item[1]);
    return {
      tipo: 'ESPAÑOL', titulo: item[3], instruccion: item[0],
      pregunta: '', opciones, correcta: opciones.indexOf(correcta), visual: null
    };
  }

  function retoVocabulario() {
    if (vocabulario.length < 4) return null;
    const elegidas = barajar(vocabulario).slice(0, 4);
    const objetivo = elegidas[0];
    const opciones = barajar(elegidas.map(x => x.palabra));
    return {
      tipo: 'ESPAÑOL', titulo: 'Vocabulario visual', instruccion: '¿Qué palabra corresponde a esta imagen?',
      pregunta: '', opciones, correcta: opciones.indexOf(objetivo.palabra), visual: objetivo.imagen
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
    const candidatos = new Set([respuesta]);
    let intento = 0;
    while (candidatos.size < 4 && intento++ < 30) {
      const delta = (1 + Math.floor(Math.random() * Math.max(3, Math.ceil(Math.abs(respuesta) * .18)))) * (Math.random() < .5 ? -1 : 1);
      candidatos.add(Math.max(0, respuesta + delta));
    }
    opciones = barajar([...candidatos]).slice(0, 4).map(String);
    return {tipo:'MATEMÁTICAS',titulo:'Activa la estación',instruccion:'Resuelve la operación.',pregunta:`${a} ${op} ${b} = ?`,opciones,correcta:opciones.indexOf(String(respuesta)),visual:null};
  }

  function crearReto() {
    if (estado.modo === 'matematicas') return retoMatematicas(estado.nivel);
    if (estado.modo === 'espanol') {
      const visual = Math.random() < .35 ? retoVocabulario() : null;
      return visual || retoGramatica(estado.nivel);
    }
    if (estado.paso % 2 === 1) return retoMatematicas(estado.nivel);
    const visual = Math.random() < .3 ? retoVocabulario() : null;
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
  }

  function responder(indice, boton) {
    if (bloqueado) return; bloqueado = true;
    const correcta = indice === estado.reto.correcta;
    [...ui.opciones.children].forEach((b, i) => {
      b.disabled = true;
      if (i === estado.reto.correcta) b.classList.add('correct');
    });
    if (correcta) {
      estado.racha += 1; estado.aciertos += 1; estado.puntos += 100 + Math.min(estado.racha, 5) * 20;
      ui.feedback.textContent = estado.racha >= 3 ? `¡Correcto! Racha ×${estado.racha}` : '¡Correcto! Estación activada.'; ui.feedback.className = 'feedback ok';
      ui.jugador.classList.add('jump');
    } else {
      boton.classList.add('wrong'); estado.racha = 0; estado.vidas = Math.max(0, estado.vidas - 1);
      ui.feedback.textContent = 'No era esa. Mira la respuesta correcta y continúa.'; ui.feedback.className = 'feedback bad';
    }
    actualizarHud();
    setTimeout(() => {
      ui.jugador.classList.remove('jump'); estado.paso += 1;
      if (estado.paso >= TOTAL || estado.vidas <= 0) terminar(); else mostrarReto();
    }, 900);
  }

  function iniciar() {
    estado = {modo:ui.modo.value,nivel:ui.nivel.value,paso:0,puntos:0,racha:0,vidas:3,aciertos:0,reto:null};
    construirMundo(); ui.intro.classList.add('hidden'); ui.resumen.classList.add('hidden'); ui.partida.classList.remove('hidden'); mostrarReto();
  }

  function terminar() {
    ui.partida.classList.add('hidden'); ui.resumen.classList.remove('hidden'); ui.resumenPuntos.textContent = String(estado.puntos);
    const precision = Math.round((estado.aciertos / Math.max(1, estado.paso)) * 100);
    let record = 0; try { record = Number(localStorage.getItem(STORAGE_RECORD) || 0); } catch (_e) {}
    if (estado.puntos > record) { record = estado.puntos; try { localStorage.setItem(STORAGE_RECORD, String(record)); } catch (_e) {} }
    ui.resumenTexto.textContent = `Aciertos: ${estado.aciertos} · Precisión: ${precision}% · Récord local: ${record}`;
  }

  ui.iniciar.addEventListener('click', iniciar);
  ui.repetir.addEventListener('click', () => { ui.resumen.classList.add('hidden'); ui.intro.classList.remove('hidden'); });
  cargarVocabulario();
})();
