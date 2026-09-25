/* Adivina qué soy — isolated from Quiz and the Dictionary. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), C = window.AdivinaCore;
  const base = new URL('../', location.href), gate = C.tiltGate();
  let bank = [], deck = 'todos', seconds = 60, sound = true, vibration = true;
  let state = 'home', round = [], answers = [], position = 0, remaining = 0, deadline = 0;
  let ticker, transition, countdownTimer, motionTimer, loadGeneration = 0, prepareGeneration = 0;
  let audio, wakeLock, motionEnabled = false, latestSensor = 0;
  let orientationMode = (() => {
    try {
      const saved = localStorage.getItem('adivina-orientation');
      if (saved === 'landscape' || saved === 'portrait') return saved;
    } catch {}
    return innerWidth > innerHeight ? 'landscape' : 'portrait';
  })();
  const imageCache = new Map();
  const cardColors = ['#e1d6fa','#ccebe1','#ffe1bc','#cfe5ff','#f9d8e7','#f4edb9','#d6e9c4'];
  let colorOffset = 0;
  history.replaceState({...history.state, adivinaScreen:'menu'}, '', location.href);
  function enterTurnHistory() {
    if (history.state?.adivinaScreen !== 'turn') history.pushState({adivinaScreen:'turn'}, '', location.href);
  }
  window.addEventListener('popstate', () => {
    // Forward must not restore an expired timer or a discarded loading task.
    if (history.state?.adivinaScreen === 'turn') history.replaceState({adivinaScreen:'menu'}, '', location.href);
    showMenu();
  });
  function show(name) {
    ['home','ready','play','results'].forEach(id => $(id).hidden = id !== name);
    document.body.classList.toggle('playing', name === 'play');
    if (name !== 'play') window.scrollTo(0, 0);
  }
  function notice(message) { $('notice').textContent = message; $('notice').hidden = !message; }
  function selected() {return C.select(bank, deck, $('category').value);}
  function updateDecks() {
    document.querySelectorAll('[data-deck]').forEach(button => {
      const active = button.dataset.deck === deck;
      button.classList.toggle('selected', active); button.setAttribute('aria-pressed', active);
      const count = C.select(bank, button.dataset.deck).length;
      button.querySelector('small').textContent = `${count} tarjetas`;
      button.disabled = count === 0;
    });
    $('category-wrap').hidden = deck !== 'vocabulario';
    $('total').textContent = `${selected().length} tarjetas`;
    $('start').disabled = !selected().length;
    $('start').textContent = selected().length ? '▶ Vamos a jugar' : 'Sin tarjetas disponibles';
  }
  async function read(path) {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(new URL(path, base), {signal: controller.signal, cache:'no-cache'});
      if (!response.ok) throw new Error('data unavailable');
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error('invalid data');
      return rows;
    } finally {clearTimeout(timeout);}
  }
  function preload(card) {
    let url;
    try {url = new URL(card.image, base);} catch {return Promise.resolve(false);}
    // Only approved local assets, never image URLs supplied by another origin.
    if (url.origin !== location.origin || !/\.(webp|png|jpe?g|gif|svg|avif)$/i.test(url.pathname)) return Promise.resolve(false);
    card.url = url.href;
    if (imageCache.has(card.url)) return imageCache.get(card.url);
    const promise = new Promise(resolve => {
      const img = new Image(); let settled = false;
      const finish = ok => {if (settled) return; settled = true; clearTimeout(timeout); img.onload = img.onerror = null; if (!ok) imageCache.delete(card.url); resolve(ok);};
      const timeout = setTimeout(() => finish(false), 8000);
      img.onload = () => finish(img.naturalWidth > 0); img.onerror = () => finish(false); img.src = card.url;
    });
    imageCache.set(card.url, promise); return promise;
  }
  async function loadBank() {
    const generation = ++loadGeneration;
    $('start').disabled = true; $('start').textContent = 'Cargando tarjetas…'; $('reload').hidden = true; notice('');
    const result = await Promise.allSettled([read('data/vocabulario.json'), read('data/adivina-extras.json')]);
    if (generation !== loadGeneration) return;
    bank = result.flatMap((r,i) => r.status === 'fulfilled' ? C.cards(r.value, i ? 'extra' : 'vocabulario') : []);
    $('category').replaceChildren(new Option('Todas las categorías', ''));
    [...new Set(bank.filter(c => c.source === 'vocabulario').map(c => c.category))].sort((a,b) => a.localeCompare(b,'es')).forEach(c => $('category').add(new Option(c,c)));
    if (result.some(r => r.status === 'rejected')) {
      notice(result[0].status === 'rejected' ? 'No se pudo cargar Vocabulario. Puedes jugar con las tarjetas extra disponibles o volver a intentar.' : 'No se pudieron cargar las tarjetas extra. Vocabulario sigue disponible.');
      $('reload').hidden = false;
    }
    updateDecks();
  }
  function initAudio() {
    if (!sound) return;
    try {const Audio = window.AudioContext || window.webkitAudioContext; if (Audio) {audio ||= new Audio(); audio.resume().catch(() => {});}} catch {}
  }
  function cue(kind) {
    if (vibration && navigator.vibrate) {try {navigator.vibrate(kind === 'correct' ? [80,60,80] : kind === 'pass' ? [180] : kind === 'start' ? [50,50,50] : [100,80,100,80,200]);} catch {}}
    if (!sound || !audio || audio.state !== 'running') return;
    try {
      const now = audio.currentTime, oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(kind === 'correct' ? 660 : kind === 'pass' ? 300 : 440, now);
      oscillator.frequency.exponentialRampToValueAtTime(kind === 'correct' ? 990 : 180, now + .22);
      gain.gain.setValueAtTime(.001,now); gain.gain.exponentialRampToValueAtTime(.10,now+.02); gain.gain.exponentialRampToValueAtTime(.001,now+.3);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now+.32);
      oscillator.onended = () => {oscillator.disconnect();gain.disconnect();};
    } catch {}
  }
  async function keepAwake() {
    if (wakeLock || !navigator.wakeLock || document.hidden) return;
    try {const lock = await navigator.wakeLock.request('screen'); if (!['playing','feedback','countdown'].includes(state)) {await lock.release();return;} wakeLock = lock; lock.addEventListener('release', () => {if(wakeLock === lock) wakeLock = null;});} catch {}
  }
  function releaseWake() {if(wakeLock) {wakeLock.release().catch(() => {});wakeLock = null;}}
  function onOrientation(event) {
    const z = C.screenZ(event.beta,event.gamma);
    if (z === null) return;
    latestSensor = performance.now();
    if (!motionEnabled) return;
    if (['playing','feedback','countdown'].includes(state) && !$('help-dialog').open) {
      // Track the return to center even while the response overlay is visible.
      const action = gate.update(z, latestSensor, state === 'playing');
      if (action) answer(action);
    } else gate.reset();
    if (['home','ready'].includes(state)) {
      const hint = Math.abs(z) < .34 ? '✓ Posición inicial: pantalla hacia tu compañero' : z < -.45 ? '↓ ✓ Acierto: pantalla hacia el suelo' : z > .45 ? '↑ ↷ Pasar: pantalla hacia el techo' : '↕ Vuelve a la posición inicial';
      $('sensor-status').textContent = hint; $('ready-sensor').textContent = hint;
    }
  }
  function disableMotion(message) {
    motionEnabled = false; window.removeEventListener('deviceorientation',onOrientation); clearTimeout(motionTimer); gate.reset();
    $('motion').setAttribute('aria-pressed','false'); $('motion').textContent = 'Activar';
    $('sensor-status').textContent = message || 'Opcional · también puedes usar botones';
  }
  async function enableMotion() {
    if (motionEnabled) {disableMotion(); return;}
    $('motion').disabled = true;
    try {
      if (!window.isSecureContext || !window.DeviceOrientationEvent) throw new Error('unsupported');
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') throw new Error('denied');
      }
      motionEnabled = true; latestSensor = 0; gate.reset();
      window.addEventListener('deviceorientation', onOrientation);
      $('motion').setAttribute('aria-pressed','true'); $('motion').textContent = '✓ Activo'; $('sensor-status').textContent = 'Mueve el celular para probar ↓ ↑';
      motionTimer = setTimeout(() => {if (!latestSensor) disableMotion('No llegan datos del sensor. Juega con los botones.');},4000);
    } catch {disableMotion('Movimiento no disponible o sin permiso. Usa los botones.');}
    finally {$('motion').disabled = false;}
  }
  function updateOrientationUI() {
    document.body.dataset.orientationMode = orientationMode;
    document.querySelectorAll('[data-orientation]').forEach(button => {
      const active = button.dataset.orientation === orientationMode;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const label = orientationMode === 'landscape' ? 'Horizontal' : 'Vertical';
    $('orientation-status').textContent = label + ' · al iniciar intentaremos ajustar la pantalla automáticamente.';
  }
  function setOrientationMode(mode) {
    if (mode !== 'portrait' && mode !== 'landscape') return;
    orientationMode = mode;
    try { localStorage.setItem('adivina-orientation', mode); } catch {}
    updateOrientationUI();
  }
  async function requestPreferredOrientation() {
    updateOrientationUI();
    const coarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : true;
    if (!coarse) return;
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(() => {});
      }
      if (screen.orientation?.lock) {
        await screen.orientation.lock(orientationMode).catch(() => {});
      }
    } catch {}
    gate.reset();
    setTimeout(() => requestAnimationFrame(fitWord), 120);
  }
  function unlockOrientation() {
    try { screen.orientation?.unlock?.(); } catch {}
  }
  async function prepare() {
    if (state === 'loading') return;
    // On browsers requiring a gesture (notably iOS), ask when the player starts.
    if (!motionEnabled) await enableMotion();
    const generation = ++prepareGeneration;
    enterTurnHistory();
    state = 'loading'; initAudio(); notice(''); $('start').disabled = true; $('again').disabled = true;
    const candidates = C.shuffle(selected()).slice(0, 30); let cursor = 0, loaded = 0; const usable = [];
    // Bound concurrent image loads; no round starts with a missing picture.
    await Promise.all(Array.from({length:Math.min(6,candidates.length)}, async () => {
      while(cursor < candidates.length && generation === prepareGeneration) {
        const index = cursor++, card = candidates[index];
        if (await preload(card)) usable.push({index,card});
        if (generation !== prepareGeneration) return;
        loaded++; $('start').textContent = `Preparando imágenes · ${loaded}/${candidates.length}`;
      }
    }));
    if (generation !== prepareGeneration) return;
    round = usable.sort((a,b) => a.index-b.index).map(x => x.card);
    $('again').disabled = false; updateDecks();
    if (!round.length) {state='home'; show('home'); notice('No pudimos cargar las imágenes. Revisa tu conexión e inténtalo otra vez.');$('reload').hidden=false;return;}
    $('ready-sensor').textContent = motionEnabled ? 'Prueba: pantalla hacia el suelo ↓ · hacia el techo ↑' : 'Tu compañero puede tocar ✓ Acierto o ↷ Pasar.';
    $('ready-sensor').textContent += ` ${round.length} tarjetas en este turno.`;
    if(round.length < candidates.length) $('ready-sensor').textContent += ` Se usarán ${round.length} tarjetas con imagen disponible.`;
    state = 'ready'; show('ready'); $('begin').focus({preventScroll:true});
  }
  function clearRoundTimers() {clearInterval(ticker);clearTimeout(transition);clearInterval(countdownTimer);}
  async function begin() {
    if(state !== 'ready') return;
    await requestPreferredOrientation();
    initAudio(); answers=[];position=0;colorOffset=Math.floor(Math.random()*cardColors.length);remaining=seconds*1000;gate.reset();
    state='countdown';show('play');$('card').style.visibility='hidden';$('countdown').hidden=false;
    $('score').textContent='✓ 0';$('time').textContent=seconds || '∞';$('time-bar').firstElementChild.style.width='100%';
    let count=3; $('count').textContent=count; keepAwake();
    countdownTimer = setInterval(() => {
      count--; if(count>0){$('count').textContent=count;return;}
      clearInterval(countdownTimer);$('countdown').hidden=true;state='playing';deadline=performance.now()+remaining;
      showCard();cue('start');ticker=setInterval(tick,100);tick();
    },1000);
  }
  function fitWord() {
    if (!['playing','feedback','paused'].includes(state)) return;
    const word=$('card-word'), card=$('card');
    word.style.fontSize='';
    const horizontal = innerWidth > innerHeight && innerHeight <= 600;
    const budget = horizontal ? card.clientHeight - 48 : Math.max(70,card.clientHeight*.42);
    let size=parseFloat(getComputedStyle(word).fontSize);
    while(size>28 && (word.scrollHeight>budget || word.scrollWidth>word.clientWidth+1)) {
      size-=2; word.style.fontSize=`${size}px`;
    }
  }
  window.addEventListener('resize', () => requestAnimationFrame(fitWord));
  function showCard() {
    if(position >= round.length){finish('¡Completaron todas las tarjetas!');return;}
    $('card').style.setProperty('--card-color',cardColors[(colorOffset+position)%cardColors.length]);
    const card=round[position];$('card-category').textContent=card.category;$('card-word').textContent=card.word;
    $('card-image').src=card.url;$('card-image').alt=card.word;$('card').style.visibility='visible';
    requestAnimationFrame(fitWord);
    $('motion-hint').textContent=motionEnabled ? '↓ Acierto · ↑ Pasar · vuelve al centro entre tarjetas' : 'Tu compañero toca un botón · ↓ Acierto · ↑ Pasar';
  }
  function tick() {
    if(!['playing','feedback'].includes(state)) return;
    if(seconds){remaining=Math.max(0,deadline-performance.now());$('time').textContent=Math.ceil(remaining/1000);const pct=remaining/(seconds*1000)*100;$('time-bar').firstElementChild.style.width=`${pct}%`;$('time-bar').setAttribute('aria-valuenow',Math.round(pct));document.body.classList.toggle('time-low',remaining<=10000);if(remaining<=0){finish('Se acabó el tiempo');return;}}
    else {$('time').textContent='∞';$('time-bar').setAttribute('aria-valuenow','100');}
    if(motionEnabled && performance.now()-latestSensor>4500) $('motion-hint').textContent='Sin datos de movimiento · usa los botones ↓ ↑';
  }
  function answer(kind) {
    if(state !== 'playing') return;
    if(seconds && performance.now()>=deadline){finish('Se acabó el tiempo');return;}
    state='feedback'; gate.reset();
    answers.push({...round[position],correct:kind==='correct'});position++;
    $('score').textContent=`✓ ${answers.filter(a=>a.correct).length}`;cue(kind);
    $('feedback').classList.toggle('passed',kind==='pass');$('feedback').querySelector('strong').textContent=kind==='correct'?'✓':'↷';$('feedback').querySelector('span').textContent=kind==='correct'?'¡Acertaste!':'Pasamos';$('feedback').querySelector('small').textContent=motionEnabled?'Vuelve a la posición inicial':'Siguiente tarjeta…';$('feedback').hidden=false;
    transition=setTimeout(() => {$('feedback').hidden=true;if(state!=='feedback')return;state='playing';showCard();},650);
  }
  function pause() {
    if(state==='countdown'){clearRoundTimers();$('countdown').hidden=true;state='ready';show('ready');releaseWake();return;}
    if(!['playing','feedback'].includes(state))return;
    if(seconds)remaining=Math.max(0,deadline-performance.now());
    $('pause-dialog').querySelector('p').textContent='El tiempo está detenido.';
    clearRoundTimers();state='paused';$('feedback').hidden=true;$('card').style.visibility='hidden';gate.reset();releaseWake();$('pause-dialog').showModal();
  }
  function resume() {
    if(state!=='paused')return;
    $('pause-dialog').close();initAudio();state='playing';deadline=performance.now()+remaining;gate.reset();showCard();
    if(state==='playing'){keepAwake();ticker=setInterval(tick,100);tick();}
  }
  function finish(reason='Turno terminado') {
    clearRoundTimers();state='results';releaseWake();gate.reset();$('feedback').hidden=true;$('countdown').hidden=true;
    if($('pause-dialog').open)$('pause-dialog').close();document.body.classList.remove('time-low');cue('end');
    const correct=answers.filter(a=>a.correct).length;$('final-correct').textContent=correct;$('final-pass').textContent=answers.length-correct;$('end-reason').textContent=reason;
    $('review').replaceChildren(...answers.map(a => {const row=document.createElement('div');row.className='review-item';row.dataset.correct=a.correct;const img=document.createElement('img');img.src=a.url;img.alt='';const word=document.createElement('span');word.textContent=a.word;const badge=document.createElement('span');badge.textContent=a.correct?'✓':'↷';badge.setAttribute('aria-label',a.correct?'Acierto':'Pasada');row.append(img,word,badge);return row;}));
    show('results');$('again').focus({preventScroll:true});
  }
  function showMenu() {
    ++prepareGeneration;
    clearRoundTimers();releaseWake();state='home';gate.reset();unlockOrientation();
    if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    $('feedback').hidden=true;$('countdown').hidden=true;
    for (const id of ['pause-dialog','help-dialog']) if ($(id).open) $(id).close();
    $('again').disabled=false;
    show('home');document.body.classList.remove('time-low');updateDecks();
  }
  function menu() {
    showMenu();
    if(history.state?.adivinaScreen==='turn') history.back();
  }
  document.querySelector('.topbar .back').addEventListener('click',e=>{if(state!=='home'){e.preventDefault();menu();}});
  $('decks').addEventListener('click',e=>{const button=e.target.closest('[data-deck]');if(!button || button.disabled)return;deck=button.dataset.deck;updateDecks();});
  $('category').addEventListener('change',updateDecks);
  $('orientations').addEventListener('click',e=>{
    const button=e.target.closest('[data-orientation]');
    if(!button)return;
    setOrientationMode(button.dataset.orientation);
  });
  $('durations').addEventListener('click',e=>{const button=e.target.closest('[data-seconds]');if(!button)return;seconds=Number(button.dataset.seconds);document.querySelectorAll('[data-seconds]').forEach(b=>{b.setAttribute('aria-pressed',b===button);b.classList.toggle('selected',b===button);});});
  $('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',sound);if(sound){initAudio();cue('correct');}};
  if(!navigator.vibrate){vibration=false;$('vibration').setAttribute('aria-pressed','false');$('vibration').disabled=true;$('vibration').title='Este navegador no ofrece vibración';}
  $('vibration').onclick=()=>{vibration=!vibration;$('vibration').setAttribute('aria-pressed',vibration);if(vibration && navigator.vibrate)navigator.vibrate(80);};
  $('motion').onclick=enableMotion;$('start').onclick=prepare;$('again').onclick=prepare;$('reload').onclick=loadBank;
  $('begin').onclick=begin;$('cancel-ready').onclick=menu;$('cancel-count').onclick=()=>{pause();};
  $('correct').onclick=()=>answer('correct');$('pass').onclick=()=>answer('pass');$('pause').onclick=pause;$('resume').onclick=resume;
  $('finish').onclick=()=>finish();$('menu').onclick=menu;
  $('help').onclick=()=>{$('help-dialog').showModal();};
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
  $('pause-dialog').addEventListener('cancel',e=>{e.preventDefault();menu();});
  $('fullscreen').onclick=async()=>{
    try {
      if(document.fullscreenElement) {
        unlockOrientation();
        await document.exitFullscreen();
      } else if(document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({navigationUI:'hide'});
        if(screen.orientation?.lock) await screen.orientation.lock(orientationMode).catch(()=>{});
      } else {
        $('motion-hint').textContent=orientationMode==='landscape'?'Gira el celular horizontalmente.':'Mantén el celular en vertical.';
      }
    } catch {
      $('motion-hint').textContent=orientationMode==='landscape'?'Puedes jugar girando el celular horizontalmente.':'Puedes jugar en vertical sin pantalla completa.';
    }
    gate.reset();requestAnimationFrame(fitWord);
  };
  if(!document.documentElement.requestFullscreen){$('fullscreen').hidden=true;}
  document.addEventListener('keydown',e=>{if(state==='playing' && !e.repeat){if(e.key==='ArrowDown'){e.preventDefault();answer('correct');}if(e.key==='ArrowUp'){e.preventDefault();answer('pass');}if(e.key==='Escape'||e.key===' '){e.preventDefault();pause();}}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('pagehide',()=>{pause();releaseWake();});
  window.addEventListener('orientationchange',()=>{
    gate.reset();
    setTimeout(()=>{requestAnimationFrame(fitWord);},140);
  });
  screen.orientation?.addEventListener?.('change',()=>{
    gate.reset();
    setTimeout(()=>requestAnimationFrame(fitWord),80);
  });
  $('card-image').addEventListener('error',()=>{if(state==='playing'){pause();$('pause-dialog').querySelector('p').textContent='No se pudo mostrar esta imagen. Termina el turno y vuelve a cargar las tarjetas.';}});
  updateOrientationUI();
  // Motion is the default; browsers requiring permission must wait for a tap.
  if (typeof window.DeviceOrientationEvent?.requestPermission !== 'function') enableMotion();
  else $('sensor-status').textContent = 'Movimiento predeterminado · se solicitará permiso al jugar';
  loadBank();
})();
