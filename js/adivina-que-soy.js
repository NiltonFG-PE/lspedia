(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const C = window.AdivinaCore;
  const base = new URL('../', location.href);
  const gate = C.tiltGate();
  const smooth = C.smoother(.55);
  const TURN_SIZE = 30;
  const PREFS_KEY = 'adivina-prefs-v2';
  const SEEN_KEY = 'adivina-seen-v2';
  const SOURCES = [
    {file: 'data/vocabulario.json', source: 'vocabulario', label: 'Vocabulario'},
    {file: 'data/adivina-extras.json', source: 'extra', label: 'las tarjetas extra'},
    {file: 'data/adivina-palabras.json', source: 'palabras', label: 'las palabras nuevas'}
  ];
  const DECKS = [
    {id: 'todos', name: 'Todo mezclado', icon: '✨', hue: 262},
    {id: 'vocabulario', name: 'Vocabulario', icon: 'Aa', hue: 160},
    {id: 'Animales', name: 'Animales', icon: '🦁', hue: 32},
    {id: 'Acciones', name: 'Acciones', icon: '🏃', hue: 12},
    {id: 'Emociones', name: 'Emociones', icon: '😊', hue: 48},
    {id: 'Familia', name: 'Familia', icon: '👨‍👩‍👧', hue: 340},
    {id: 'Lugares', name: 'Lugares', icon: '🏖️', hue: 190},
    {id: 'Casa', name: 'Casa', icon: '🛋️', hue: 24},
    {id: 'Escuela', name: 'Escuela', icon: '🎒', hue: 220},
    {id: 'Deportes', name: 'Deportes', icon: '⚽', hue: 140},
    {id: 'Naturaleza', name: 'Naturaleza', icon: '🌳', hue: 120},
    {id: 'Comidas', name: 'Comidas', icon: '🍎', hue: 4},
    {id: 'Transportes', name: 'Transportes', icon: '🚌', hue: 205},
    {id: 'Objetos', name: 'Objetos', icon: '⌚', hue: 280},
    {id: 'Profesiones', name: 'Profesiones', icon: '👩‍⚕️', hue: 170},
    {id: 'Personajes', name: 'Personajes', icon: '🧚', hue: 300},
    {id: 'Música', name: 'Música', icon: '🎸', hue: 250}
  ];
  const PALETTE = [['#6a4df0', '#a98bff'], ['#0a7fd1', '#53c1f5'], ['#d02f6b', '#ff7fae'], ['#0d8f80', '#43cdb0'], ['#3556d8', '#7b95ff'], ['#9331b0', '#d47be8'], ['#c4325f', '#ff8f8f']];
  const LEVEL_HELP = {
    todos: 'Mezcla de palabras fáciles, medias y difíciles',
    facil: 'Palabras cotidianas y fáciles de representar',
    medio: 'Un poco más de reto para el grupo',
    dificil: 'Conceptos abstractos y poco comunes'
  };
  const TEAM_HELP = {1: 'Cada quien juega por turnos, sin marcador', 2: 'Dos equipos se turnan y suman puntos', 3: 'Tres equipos se turnan y suman puntos', 4: 'Cuatro equipos se turnan y suman puntos'};
  const TEAM_COLORS = ['#6a4df0', '#0d8f80', '#e0731f', '#d02f6b'];
  const reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : {matches: false};
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {return fallback;}
    },
    set(key, value) {
      try {localStorage.setItem(key, JSON.stringify(value));} catch {}
    }
  };
  const saved = store.get(PREFS_KEY, {});
  const prefs = {
    deck: typeof saved.deck === 'string' ? saved.deck : 'todos',
    category: typeof saved.category === 'string' ? saved.category : '',
    level: ['todos', 'facil', 'medio', 'dificil'].includes(saved.level) ? saved.level : 'todos',
    seconds: [0, 60, 90, 120].includes(saved.seconds) ? saved.seconds : 60,
    teams: [1, 2, 3, 4].includes(saved.teams) ? saved.teams : 1,
    sound: saved.sound !== false,
    vibration: saved.vibration !== false,
    motion: saved.motion !== false,
    orientation: saved.orientation === 'portrait' ? 'portrait' : 'landscape'
  };
  const persist = () => store.set(PREFS_KEY, prefs);
  let bank = [], deckList = DECKS.slice();
  let state = 'home', round = [], answers = [], position = 0, remaining = 0, deadline = 0, lastSecond = 0;
  let ticker, transition, countdownTimer, motionTimer, loadGeneration = 0, prepareGeneration = 0;
  let audio, wakeLock, motionEnabled = false, latestSensor = 0, feedbackReadyAt = 0;
  let colorOffset = 0, turnSeen = new Set(), turnSignature = '', scores = [], currentTeam = 0;
  const imageCache = new Map();

  history.replaceState({...history.state, adivinaScreen: 'menu'}, '', location.href);
  function enterTurnHistory() {
    if (history.state?.adivinaScreen !== 'turn') history.pushState({adivinaScreen: 'turn'}, '', location.href);
  }
  window.addEventListener('popstate', () => {
    if (history.state?.adivinaScreen === 'turn') history.replaceState({adivinaScreen: 'menu'}, '', location.href);
    showMenu();
  });

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function setSwitch(node, on) {
    node.setAttribute('aria-checked', String(on));
  }
  function setSegment(containerId, attribute, value) {
    $(containerId).querySelectorAll(`[data-${attribute}]`).forEach(button => {
      const active = button.dataset[attribute] === String(value);
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }
  function show(name) {
    ['home', 'ready', 'play', 'results'].forEach(id => $(id).hidden = id !== name);
    document.body.classList.toggle('playing', name === 'play');
    if (name !== 'play') {
      document.body.style.removeProperty('--c1');
      document.body.style.removeProperty('--c2');
      setThemeColor('#f6f2ec');
      window.scrollTo(0, 0);
    }
  }
  function setThemeColor(color) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
  }
  function notice(message) {
    $('notice').textContent = message;
    $('notice').hidden = !message;
  }
  function selected() {return C.select(bank, prefs.deck, prefs.category, prefs.level);}
  function signature() {return [prefs.deck, prefs.deck === 'vocabulario' ? prefs.category : '', prefs.level].join('|');}
  function teamName(index) {return `Equipo ${index + 1}`;}

  function buildDecks() {
    const known = new Set(DECKS.map(d => d.id));
    const extra = [...new Set(bank.filter(c => c.source !== 'vocabulario').map(c => c.category))].filter(name => !known.has(name));
    deckList = [...DECKS, ...extra.map(name => ({id: name, name, icon: '🎯', hue: 200}))];
    $('decks').replaceChildren(...deckList.map(deck => {
      const button = el('button', 'deck');
      button.type = 'button';
      button.dataset.deck = deck.id;
      button.style.setProperty('--hue', deck.hue);
      button.setAttribute('aria-pressed', 'false');
      const art = el('span', 'deck-art', deck.icon);
      art.setAttribute('aria-hidden', 'true');
      button.append(art, el('strong', '', deck.name), el('small', '', '…'));
      return button;
    }));
  }
  function updateDecks() {
    const buttons = [...document.querySelectorAll('[data-deck]')];
    buttons.forEach(button => {
      const count = C.select(bank, button.dataset.deck, '', prefs.level).length;
      button.querySelector('small').textContent = count ? `${count} tarjetas` : 'Sin tarjetas';
      button.disabled = count === 0;
    });
    const current = buttons.find(b => b.dataset.deck === prefs.deck);
    if (buttons.length && (!current || current.disabled)) {
      prefs.deck = 'todos';
      prefs.category = '';
    }
    buttons.forEach(button => {
      const active = button.dataset.deck === prefs.deck;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('category-wrap').hidden = prefs.deck !== 'vocabulario';
    $('category').value = prefs.category;
    if ($('category').value !== prefs.category) prefs.category = '';
    const total = selected().length;
    $('total').textContent = `${total} tarjetas`;
    $('start').disabled = !total || state === 'loading';
    $('start').textContent = total ? '▶ Vamos a jugar' : 'Sin tarjetas disponibles';
    $('level-help').textContent = LEVEL_HELP[prefs.level];
    $('teams-help').textContent = TEAM_HELP[prefs.teams];
  }

  async function read(path) {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(new URL(path, base), {signal: controller.signal, cache: 'no-cache'});
      if (!response.ok) throw new Error('data unavailable');
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error('invalid data');
      return rows;
    } finally {clearTimeout(timeout);}
  }
  function preload(card) {
    if (!card.image) return Promise.resolve(true);
    let url;
    try {url = new URL(card.image, base);} catch {return Promise.resolve(false);}
    if (url.origin !== location.origin || !/\.(webp|png|jpe?g|gif|svg|avif)$/i.test(url.pathname)) return Promise.resolve(false);
    card.url = url.href;
    if (imageCache.has(card.url)) return imageCache.get(card.url);
    const promise = new Promise(resolve => {
      const img = new Image();
      let settled = false;
      const finish = ok => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        img.onload = img.onerror = null;
        if (!ok) imageCache.delete(card.url);
        resolve(ok);
      };
      const timeout = setTimeout(() => finish(false), 8000);
      img.onload = () => finish(img.naturalWidth > 0);
      img.onerror = () => finish(false);
      img.src = card.url;
    });
    imageCache.set(card.url, promise);
    return promise;
  }
  async function loadBank() {
    const generation = ++loadGeneration;
    $('start').disabled = true;
    $('start').textContent = 'Cargando tarjetas…';
    $('reload').hidden = true;
    notice('');
    const result = await Promise.allSettled(SOURCES.map(s => read(s.file)));
    if (generation !== loadGeneration) return;
    bank = result.flatMap((r, i) => r.status === 'fulfilled' ? C.cards(r.value, SOURCES[i].source) : []);
    buildDecks();
    $('category').replaceChildren(new Option('Todas las categorías', ''));
    [...new Set(bank.filter(c => c.source === 'vocabulario').map(c => c.category))]
      .sort((a, b) => a.localeCompare(b, 'es'))
      .forEach(name => $('category').add(new Option(name, name)));
    const failed = SOURCES.filter((_, i) => result[i].status === 'rejected');
    if (failed.length) {
      notice(failed.length === SOURCES.length
        ? 'No se pudieron cargar las tarjetas. Revisa tu conexión e inténtalo otra vez.'
        : `No se pudo cargar ${failed.map(f => f.label).join(' ni ')}. Puedes jugar con el resto o volver a intentar.`);
      $('reload').hidden = false;
    }
    updateDecks();
  }

  function initAudio() {
    if (!prefs.sound) return;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (Context) {
        audio ||= new Context();
        audio.resume().catch(() => {});
      }
    } catch {}
  }
  function tone(frequency, start, length, type = 'sine', volume = .11, slideTo) {
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + length);
    gain.gain.setValueAtTime(.001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .02);
    gain.gain.exponentialRampToValueAtTime(.001, start + length);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + length + .02);
    oscillator.onended = () => {oscillator.disconnect(); gain.disconnect();};
  }
  function cue(kind) {
    if (prefs.vibration && navigator.vibrate) {
      const pattern = {correct: [70, 50, 70], pass: [160], start: [40, 40, 40], tick: [20], end: [100, 80, 100, 80, 220]}[kind];
      try {navigator.vibrate(pattern);} catch {}
    }
    if (!prefs.sound || !audio || audio.state !== 'running') return;
    try {
      const now = audio.currentTime;
      if (kind === 'correct') {tone(659, now, .14, 'triangle'); tone(988, now + .1, .26, 'triangle');}
      else if (kind === 'pass') tone(380, now, .26, 'sine', .09, 220);
      else if (kind === 'start') {tone(523, now, .12, 'triangle'); tone(784, now + .1, .2, 'triangle');}
      else if (kind === 'tick') tone(1200, now, .06, 'square', .035);
      else if (kind === 'end') {tone(784, now, .16, 'triangle'); tone(659, now + .16, .16, 'triangle'); tone(523, now + .32, .34, 'triangle');}
    } catch {}
  }
  async function keepAwake() {
    if (wakeLock || !navigator.wakeLock || document.hidden) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!['playing', 'feedback', 'countdown'].includes(state)) {await lock.release(); return;}
      wakeLock = lock;
      lock.addEventListener('release', () => {if (wakeLock === lock) wakeLock = null;});
    } catch {}
  }
  function releaseWake() {
    if (wakeLock) {wakeLock.release().catch(() => {}); wakeLock = null;}
  }

  function onOrientation(event) {
    const raw = C.screenZ(event.beta, event.gamma);
    if (raw === null) return;
    const now = performance.now();
    latestSensor = now;
    if (!motionEnabled) return;
    const z = smooth.next(raw);
    if (['playing', 'feedback', 'countdown'].includes(state) && !$('help-dialog').open) {
      const action = gate.update(z, now, state === 'playing');
      if (action) answer(action);
      else if (state === 'feedback' && gate.ready() && now >= feedbackReadyAt) advance();
    } else gate.reset();
    if (['home', 'ready'].includes(state)) {
      const hint = Math.abs(z) < .34 ? '✓ Posición inicial: pantalla hacia tu compañero' : z < -.45 ? '↓ ✓ Acierto: pantalla hacia el suelo' : z > .45 ? '↑ ↷ Pasar: pantalla hacia el techo' : '↕ Vuelve a la posición inicial';
      $('sensor-status').textContent = hint;
      $('ready-sensor').textContent = hint;
    }
  }
  function disableMotion(message) {
    motionEnabled = false;
    window.removeEventListener('deviceorientation', onOrientation);
    clearTimeout(motionTimer);
    gate.reset();
    smooth.reset();
    setSwitch($('motion'), false);
    $('sensor-status').textContent = message || 'Opcional · también puedes usar botones';
  }
  async function enableMotion() {
    if (motionEnabled) return true;
    $('motion').disabled = true;
    try {
      if (!window.isSecureContext || !window.DeviceOrientationEvent) throw new Error('unsupported');
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') throw new Error('denied');
      }
      motionEnabled = true;
      latestSensor = 0;
      gate.reset();
      smooth.reset();
      window.addEventListener('deviceorientation', onOrientation);
      setSwitch($('motion'), true);
      $('sensor-status').textContent = 'Mueve el celular para probar ↓ ↑';
      motionTimer = setTimeout(() => {if (!latestSensor) disableMotion('No llegan datos del sensor. Juega con los botones.');}, 4000);
      return true;
    } catch {
      disableMotion('Movimiento no disponible o sin permiso. Usa los botones.');
      return false;
    } finally {$('motion').disabled = false;}
  }
  async function toggleMotion() {
    if (motionEnabled) {
      prefs.motion = false;
      persist();
      disableMotion();
    } else {
      prefs.motion = true;
      persist();
      await enableMotion();
    }
  }

  function updateOrientationUI() {
    document.body.dataset.orientationMode = prefs.orientation;
    setSegment('orientations', 'orientation', prefs.orientation);
    $('orientation-status').textContent = `${prefs.orientation === 'landscape' ? 'Horizontal' : 'Vertical'} · al iniciar ajustaremos la pantalla`;
  }
  function setOrientationMode(mode) {
    if (mode !== 'portrait' && mode !== 'landscape') return;
    prefs.orientation = mode;
    persist();
    updateOrientationUI();
  }
  async function requestPreferredOrientation() {
    updateOrientationUI();
    const coarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : true;
    if (!coarse) return;
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({navigationUI: 'hide'}).catch(() => {});
      }
      if (screen.orientation?.lock) await screen.orientation.lock(prefs.orientation).catch(() => {});
    } catch {}
    gate.reset();
    setTimeout(() => requestAnimationFrame(fitWord), 120);
  }
  function unlockOrientation() {
    try {screen.orientation?.unlock?.();} catch {}
  }

  function loadSeen() {
    const all = store.get(SEEN_KEY, {});
    return new Set(Array.isArray(all[turnSignature]) ? all[turnSignature] : []);
  }
  function saveSeen() {
    const all = store.get(SEEN_KEY, {});
    delete all[turnSignature];
    all[turnSignature] = [...turnSeen];
    const keys = Object.keys(all);
    if (keys.length > 30) delete all[keys[0]];
    store.set(SEEN_KEY, all);
  }
  async function prepare() {
    if (state === 'loading') return;
    const generation = ++prepareGeneration;
    state = 'loading';
    $('start').disabled = true;
    $('again').disabled = true;
    initAudio();
    notice('');
    if (prefs.motion && !motionEnabled) await enableMotion();
    if (generation !== prepareGeneration) return;
    enterTurnHistory();
    turnSignature = signature();
    turnSeen = loadSeen();
    const pool = selected();
    const drawn = C.draw(pool, turnSeen, TURN_SIZE + 6, Math.random, TURN_SIZE);
    if (drawn.exhausted) {turnSeen = new Set(); saveSeen();}
    const candidates = drawn.cards;
    let cursor = 0, loaded = 0;
    const usable = [];
    $('start').textContent = 'Preparando tarjetas…';
    await Promise.all(Array.from({length: Math.min(6, candidates.length)}, async () => {
      while (cursor < candidates.length && generation === prepareGeneration) {
        const index = cursor++, card = candidates[index];
        if (await preload(card)) usable.push({index, card});
        if (generation !== prepareGeneration) return;
        loaded++;
        $('start').textContent = `Preparando tarjetas · ${loaded}/${candidates.length}`;
      }
    }));
    if (generation !== prepareGeneration) return;
    round = usable.sort((a, b) => a.index - b.index).map(x => x.card).slice(0, TURN_SIZE);
    $('again').disabled = false;
    state = 'home';
    updateDecks();
    if (!round.length) {
      show('home');
      notice('No pudimos cargar las tarjetas. Revisa tu conexión e inténtalo otra vez.');
      $('reload').hidden = false;
      return;
    }
    $('ready-eyebrow').textContent = prefs.teams > 1 ? `TURNO DEL ${teamName(currentTeam).toUpperCase()}` : 'ES TU TURNO';
    $('ready-sensor').textContent = (motionEnabled ? 'Prueba: pantalla hacia el suelo ↓ · hacia el techo ↑' : 'Tu compañero puede tocar ✓ Acierto o ↷ Pasar.') + ` ${round.length} tarjetas en este turno.`;
    state = 'ready';
    show('ready');
    $('begin').focus({preventScroll: true});
  }

  function clearRoundTimers() {
    clearInterval(ticker);
    clearTimeout(transition);
    clearInterval(countdownTimer);
  }
  async function begin() {
    if (state !== 'ready') return;
    await requestPreferredOrientation();
    initAudio();
    answers = [];
    position = 0;
    colorOffset = Math.floor(Math.random() * PALETTE.length);
    remaining = prefs.seconds * 1000;
    lastSecond = 0;
    gate.reset();
    smooth.reset();
    state = 'countdown';
    show('play');
    $('card').style.visibility = 'hidden';
    $('countdown').hidden = false;
    $('score').textContent = '✓ 0';
    $('team-label').textContent = prefs.teams > 1 ? teamName(currentTeam) : '';
    $('time').textContent = prefs.seconds || '∞';
    $('time-bar').firstElementChild.style.width = '100%';
    let count = 3;
    $('count').textContent = count;
    pulseCount();
    keepAwake();
    countdownTimer = setInterval(() => {
      count--;
      if (count > 0) {$('count').textContent = count; pulseCount(); cue('tick'); return;}
      clearInterval(countdownTimer);
      $('countdown').hidden = true;
      state = 'playing';
      deadline = performance.now() + remaining;
      showCard();
      cue('start');
      ticker = setInterval(tick, 100);
      tick();
    }, 1000);
  }
  function pulseCount() {
    if (reduceMotion.matches || !$('count').animate) return;
    $('count').animate([{transform: 'scale(1.5)', opacity: 0}, {transform: 'scale(1)', opacity: 1}], {duration: 380, easing: 'cubic-bezier(.2,.9,.3,1.2)'});
  }
  function fitWord() {
    if (!['playing', 'feedback', 'paused'].includes(state)) return;
    const word = $('card-word'), card = $('card');
    word.style.fontSize = '';
    const landscape = innerWidth > innerHeight && innerHeight <= 600;
    const budget = landscape ? card.clientHeight - 56 : Math.max(80, card.clientHeight * .34);
    let size = parseFloat(getComputedStyle(word).fontSize);
    while (size > 26 && (word.scrollHeight > budget || word.scrollWidth > word.clientWidth + 1)) {
      size -= 2;
      word.style.fontSize = `${size}px`;
    }
  }
  window.addEventListener('resize', () => requestAnimationFrame(fitWord));
  if (window.ResizeObserver) new ResizeObserver(() => requestAnimationFrame(fitWord)).observe($('card'));

  function showCard() {
    if (position >= round.length) {finish('¡Completaron todas las tarjetas!'); return;}
    const card = round[position];
    const [first, second] = PALETTE[(colorOffset + position) % PALETTE.length];
    document.body.style.setProperty('--c1', first);
    document.body.style.setProperty('--c2', second);
    setThemeColor(first);
    $('card-category').textContent = card.category;
    $('card-word').textContent = card.word;
    const image = $('card-image'), emoji = $('card-emoji');
    if (card.url) {
      image.hidden = false;
      emoji.hidden = true;
      image.src = card.url;
      image.alt = card.word;
    } else {
      image.hidden = true;
      image.removeAttribute('src');
      image.alt = '';
      emoji.hidden = false;
      emoji.textContent = card.emoji;
    }
    $('card').style.visibility = 'visible';
    if (!reduceMotion.matches && $('card').animate) {
      $('card').animate([{transform: 'translateY(26px) scale(.94)', opacity: 0}, {transform: 'none', opacity: 1}], {duration: 300, easing: 'cubic-bezier(.2,.85,.25,1.1)'});
    }
    requestAnimationFrame(fitWord);
    $('motion-hint').textContent = motionEnabled ? '↓ Acierto · ↑ Pasar · vuelve al centro entre tarjetas' : 'Tu compañero toca un botón · ↓ Acierto · ↑ Pasar';
  }
  function tick() {
    if (!['playing', 'feedback'].includes(state)) return;
    if (prefs.seconds) {
      remaining = Math.max(0, deadline - performance.now());
      const secondsLeft = Math.ceil(remaining / 1000);
      $('time').textContent = secondsLeft;
      const pct = remaining / (prefs.seconds * 1000) * 100;
      $('time-bar').firstElementChild.style.width = `${pct}%`;
      $('time-bar').setAttribute('aria-valuenow', Math.round(pct));
      document.body.classList.toggle('time-low', remaining <= 10000);
      if (secondsLeft <= 5 && secondsLeft > 0 && secondsLeft !== lastSecond) cue('tick');
      lastSecond = secondsLeft;
      if (remaining <= 0) {finish('Se acabó el tiempo'); return;}
    } else {
      $('time').textContent = '∞';
      $('time-bar').setAttribute('aria-valuenow', '100');
    }
    if (motionEnabled && performance.now() - latestSensor > 4500) $('motion-hint').textContent = 'Sin datos de movimiento · usa los botones ↓ ↑';
  }
  function answer(kind) {
    if (state !== 'playing') return;
    if (prefs.seconds && performance.now() >= deadline) {finish('Se acabó el tiempo'); return;}
    state = 'feedback';
    gate.reset();
    const card = round[position];
    answers.push({...card, correct: kind === 'correct'});
    turnSeen.add(card.key);
    saveSeen();
    position++;
    $('score').textContent = `✓ ${answers.filter(a => a.correct).length}`;
    cue(kind);
    const box = $('feedback');
    box.classList.toggle('passed', kind === 'pass');
    box.querySelector('strong').textContent = kind === 'correct' ? '✓' : '↷';
    box.querySelector('span').textContent = kind === 'correct' ? '¡Acertaste!' : 'Pasamos';
    const sensorAlive = motionEnabled && performance.now() - latestSensor < 1000;
    box.querySelector('small').textContent = sensorAlive ? 'Vuelve a la posición inicial' : '';
    box.hidden = false;
    feedbackReadyAt = performance.now() + 420;
    clearTimeout(transition);
    transition = setTimeout(advance, sensorAlive ? 1800 : 520);
  }
  function advance() {
    if (state !== 'feedback') return;
    clearTimeout(transition);
    $('feedback').hidden = true;
    state = 'playing';
    showCard();
  }
  function pause() {
    if (state === 'countdown') {
      clearRoundTimers();
      $('countdown').hidden = true;
      state = 'ready';
      show('ready');
      releaseWake();
      return;
    }
    if (!['playing', 'feedback'].includes(state)) return;
    if (prefs.seconds) remaining = Math.max(0, deadline - performance.now());
    $('pause-dialog').querySelector('p').textContent = 'El tiempo está detenido.';
    clearRoundTimers();
    state = 'paused';
    $('feedback').hidden = true;
    $('card').style.visibility = 'hidden';
    gate.reset();
    releaseWake();
    $('pause-dialog').showModal();
  }
  function resume() {
    if (state !== 'paused') return;
    $('pause-dialog').close();
    initAudio();
    state = 'playing';
    deadline = performance.now() + remaining;
    gate.reset();
    showCard();
    if (state === 'playing') {
      keepAwake();
      ticker = setInterval(tick, 100);
      tick();
    }
  }

  function renderStandings() {
    const box = $('standings');
    if (prefs.teams < 2) {box.hidden = true; $('reset-scores').hidden = true; return;}
    box.hidden = false;
    $('reset-scores').hidden = false;
    const names = scores.map((_, i) => teamName(i));
    const top = Math.max(1, ...scores);
    box.replaceChildren(...C.standings(scores, names).map(row => {
      const item = el('div', 'standing' + (row.leader ? ' leader' : ''));
      const dot = el('i', 'team-dot');
      dot.style.background = TEAM_COLORS[row.index];
      const bar = el('span', 'standing-bar');
      const fill = el('span', 'standing-fill');
      fill.style.width = `${Math.max(4, row.score / top * 100)}%`;
      fill.style.background = TEAM_COLORS[row.index];
      bar.append(fill);
      item.append(dot, el('b', '', row.name), bar, el('strong', '', String(row.score)));
      if (row.leader) item.append(el('em', '', '★'));
      return item;
    }));
  }
  function finish(reason = 'Turno terminado') {
    clearRoundTimers();
    state = 'results';
    releaseWake();
    gate.reset();
    $('feedback').hidden = true;
    $('countdown').hidden = true;
    if ($('pause-dialog').open) $('pause-dialog').close();
    document.body.classList.remove('time-low');
    cue('end');
    const correct = answers.filter(a => a.correct).length;
    $('final-correct').textContent = correct;
    $('final-pass').textContent = answers.length - correct;
    $('end-reason').textContent = reason;
    if (prefs.teams > 1) {
      scores[currentTeam] = (scores[currentTeam] || 0) + correct;
      $('results-title').textContent = `${teamName(currentTeam)}: ${correct} ${correct === 1 ? 'punto' : 'puntos'}`;
      currentTeam = (currentTeam + 1) % prefs.teams;
      $('again').textContent = `▶ Turno del ${teamName(currentTeam)}`;
    } else {
      $('results-title').textContent = correct ? 'Un turno para recordar' : 'La próxima sale mejor';
      $('again').textContent = '▶ Siguiente jugador';
    }
    renderStandings();
    $('review').replaceChildren(...answers.map(a => {
      const row = el('div', 'review-item');
      row.dataset.correct = a.correct;
      let visual;
      if (a.url) {
        visual = document.createElement('img');
        visual.src = a.url;
        visual.alt = '';
      } else {
        visual = el('span', 'review-emoji', a.emoji);
        visual.setAttribute('aria-hidden', 'true');
      }
      const badge = el('span', 'review-badge', a.correct ? '✓' : '↷');
      badge.setAttribute('aria-label', a.correct ? 'Acierto' : 'Pasada');
      row.append(visual, el('span', 'review-word', a.word), badge);
      return row;
    }));
    show('results');
    $('again').focus({preventScroll: true});
  }
  function resetScores() {
    scores = Array.from({length: prefs.teams}, () => 0);
    currentTeam = 0;
  }
  function showMenu() {
    ++prepareGeneration;
    clearRoundTimers();
    releaseWake();
    state = 'home';
    gate.reset();
    unlockOrientation();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    $('feedback').hidden = true;
    $('countdown').hidden = true;
    for (const id of ['pause-dialog', 'help-dialog']) if ($(id).open) $(id).close();
    $('again').disabled = false;
    show('home');
    document.body.classList.remove('time-low');
    updateDecks();
  }
  function menu() {
    showMenu();
    if (history.state?.adivinaScreen === 'turn') history.back();
  }

  document.querySelector('.topbar .back').addEventListener('click', e => {if (state !== 'home') {e.preventDefault(); menu();}});
  $('decks').addEventListener('click', e => {
    const button = e.target.closest('[data-deck]');
    if (!button || button.disabled) return;
    prefs.deck = button.dataset.deck;
    if (prefs.deck !== 'vocabulario') prefs.category = '';
    persist();
    updateDecks();
  });
  $('category').addEventListener('change', () => {prefs.category = $('category').value; persist(); updateDecks();});
  $('levels').addEventListener('click', e => {
    const button = e.target.closest('[data-level]');
    if (!button) return;
    prefs.level = button.dataset.level;
    setSegment('levels', 'level', prefs.level);
    persist();
    updateDecks();
  });
  $('durations').addEventListener('click', e => {
    const button = e.target.closest('[data-seconds]');
    if (!button) return;
    prefs.seconds = Number(button.dataset.seconds);
    setSegment('durations', 'seconds', prefs.seconds);
    persist();
  });
  $('teams').addEventListener('click', e => {
    const button = e.target.closest('[data-teams]');
    if (!button) return;
    prefs.teams = Number(button.dataset.teams);
    setSegment('teams', 'teams', prefs.teams);
    resetScores();
    persist();
    updateDecks();
  });
  $('orientations').addEventListener('click', e => {
    const button = e.target.closest('[data-orientation]');
    if (button) setOrientationMode(button.dataset.orientation);
  });
  $('sound').onclick = () => {
    prefs.sound = !prefs.sound;
    setSwitch($('sound'), prefs.sound);
    persist();
    if (prefs.sound) {initAudio(); setTimeout(() => cue('correct'), 60);}
  };
  if (!navigator.vibrate) {
    prefs.vibration = false;
    $('vibration').disabled = true;
    $('vibration').title = 'Este navegador no ofrece vibración';
  }
  $('vibration').onclick = () => {
    prefs.vibration = !prefs.vibration;
    setSwitch($('vibration'), prefs.vibration);
    persist();
    if (prefs.vibration && navigator.vibrate) navigator.vibrate(80);
  };
  $('motion').onclick = toggleMotion;
  $('start').onclick = prepare;
  $('again').onclick = prepare;
  $('reload').onclick = loadBank;
  $('begin').onclick = begin;
  $('cancel-ready').onclick = menu;
  $('cancel-count').onclick = () => pause();
  $('correct').onclick = () => answer('correct');
  $('pass').onclick = () => answer('pass');
  $('pause').onclick = pause;
  $('resume').onclick = resume;
  $('finish').onclick = () => finish();
  $('menu').onclick = menu;
  $('reset-scores').onclick = () => {resetScores(); $('again').textContent = `▶ Turno del ${teamName(0)}`; renderStandings();};
  $('help').onclick = () => $('help-dialog').showModal();
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => $(b.dataset.close).close());
  $('pause-dialog').addEventListener('cancel', e => {e.preventDefault(); menu();});
  $('fullscreen').onclick = async () => {
    try {
      if (document.fullscreenElement) {
        unlockOrientation();
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({navigationUI: 'hide'});
        if (screen.orientation?.lock) await screen.orientation.lock(prefs.orientation).catch(() => {});
      } else {
        $('motion-hint').textContent = prefs.orientation === 'landscape' ? 'Gira el celular horizontalmente.' : 'Mantén el celular en vertical.';
      }
    } catch {
      $('motion-hint').textContent = prefs.orientation === 'landscape' ? 'Puedes jugar girando el celular horizontalmente.' : 'Puedes jugar en vertical sin pantalla completa.';
    }
    gate.reset();
    requestAnimationFrame(fitWord);
  };
  if (!document.documentElement.requestFullscreen) $('fullscreen').hidden = true;
  document.addEventListener('keydown', e => {
    if (state !== 'playing' || e.repeat) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter') {e.preventDefault(); answer('correct');}
    else if (e.key === 'ArrowUp') {e.preventDefault(); answer('pass');}
    else if (e.key === 'Escape' || e.key === ' ') {e.preventDefault(); pause();}
  });
  document.addEventListener('visibilitychange', () => {if (document.hidden) pause();});
  window.addEventListener('pagehide', () => {pause(); releaseWake();});
  window.addEventListener('orientationchange', () => {
    gate.reset();
    setTimeout(() => requestAnimationFrame(fitWord), 140);
  });
  screen.orientation?.addEventListener?.('change', () => {
    gate.reset();
    setTimeout(() => requestAnimationFrame(fitWord), 80);
  });
  $('card-image').addEventListener('error', () => {
    if (state === 'playing' && !$('card-image').hidden) {
      pause();
      $('pause-dialog').querySelector('p').textContent = 'No se pudo mostrar esta imagen. Termina el turno y vuelve a cargar las tarjetas.';
    }
  });

  setSegment('levels', 'level', prefs.level);
  setSegment('durations', 'seconds', prefs.seconds);
  setSegment('teams', 'teams', prefs.teams);
  setSwitch($('sound'), prefs.sound);
  setSwitch($('vibration'), prefs.vibration);
  setSwitch($('motion'), false);
  resetScores();
  updateOrientationUI();
  if (prefs.motion) {
    if (typeof window.DeviceOrientationEvent?.requestPermission !== 'function') enableMotion();
    else $('sensor-status').textContent = 'Toca el interruptor o inicia el juego para dar permiso al movimiento';
  } else disableMotion();
  loadBank();
})();