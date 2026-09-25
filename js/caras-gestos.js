/* LSPedia · Caras y gestos — juego visual, sin dependencia de audio. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const base = new URL('../', location.href);

  let bank = [], deck = 'Todas', level = 'Fácil', seconds = 60;
  let vibration = true, orientationMode = loadOrientation();
  let state = 'home', round = [], answers = [], position = 0;
  let remaining = 0, deadline = 0, ticker = 0, transition = 0, countdownTimer = 0;
  let streak = 0, bestStreak = 0, loadGeneration = 0, prepareGeneration = 0;
  let hiddenAt = 0, suspendedState = '';
  let wakeLock = null;
  const imageCache = new Map();
  const colors = {
    Emociones:['#fff0d8','#fce1eb','#eee5ff','#e0f2ea'],
    Acciones:['#e3f2e8','#e2edff','#fff0dd','#f0e7ff'],
    Situaciones:['#e7efff','#f9e6dc','#e6f3ef','#f2e9ff']
  };

  history.replaceState({...history.state, carasGestos:'menu'}, '', location.href);

  function loadOrientation() {
    try {
      const saved = localStorage.getItem('caras-gestos-orientation');
      if (saved === 'portrait' || saved === 'landscape') return saved;
    } catch {}
    return innerWidth > innerHeight ? 'landscape' : 'portrait';
  }

  function show(name) {
    ['home','ready','play','results'].forEach(id => $(id).hidden = id !== name);
    document.body.classList.toggle('playing', name === 'play');
    if (name !== 'play') scrollTo(0,0);
  }

  function notice(text='') {
    $('notice').textContent = text;
    $('notice').hidden = !text;
  }

  function vibrate(pattern) {
    if (!vibration || !navigator.vibrate) return;
    try { navigator.vibrate(pattern); } catch {}
  }

  async function keepAwake() {
    if (wakeLock || !navigator.wakeLock || document.hidden) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!['countdown','playing','feedback','paused','suspended'].includes(state)) {
        await lock.release(); return;
      }
      wakeLock = lock;
      lock.addEventListener('release',()=>{ if (wakeLock === lock) wakeLock = null; });
    } catch {}
  }

  function releaseWake() {
    if (!wakeLock) return;
    wakeLock.release().catch(()=>{});
    wakeLock = null;
  }

  async function readBank() {
    const generation = ++loadGeneration;
    $('start').disabled = true;
    $('start').textContent = 'Cargando tarjetas…';
    notice('');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(()=>controller.abort(),9000);
      const response = await fetch(new URL('data/caras-gestos.json',base), {signal:controller.signal,cache:'no-store'});
      clearTimeout(timeout);
      if (!response.ok) throw new Error('data');
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error('format');
      if (generation !== loadGeneration) return;
      bank = rows.filter(validCard);
      updateMenu();
    } catch {
      if (generation !== loadGeneration) return;
      bank = [];
      updateMenu();
      notice('No se pudieron cargar las tarjetas. Revisa tu conexión y vuelve a entrar al juego.');
    }
  }

  function validCard(card) {
    return card && card.id && card.palabra && card.categoria && card.imagen && card.pista;
  }

  function matchesLevel(card) {
    if (level === 'Todos') return true;
    if (level === 'Fácil') return card.nivel === 'Fácil';
    if (level === 'Medio') return card.nivel === 'Fácil' || card.nivel === 'Medio';
    return true; // Difícil desbloquea todo el banco.
  }

  function selectedCards() {
    return bank.filter(card => (deck === 'Todas' || card.categoria === deck) && matchesLevel(card));
  }

  function updateMenu() {
    document.querySelectorAll('[data-deck]').forEach(button => {
      const active = button.dataset.deck === deck;
      button.classList.toggle('selected',active);
      button.setAttribute('aria-pressed',String(active));
      const count = bank.filter(card => button.dataset.deck === 'Todas' || card.categoria === button.dataset.deck).length;
      const label = button.querySelector('[data-count]');
      if (label) label.textContent = count + ' tarjetas';
      button.disabled = count === 0;
    });
    const count = selectedCards().length;
    $('total-count').textContent = count + (count === 1 ? ' tarjeta' : ' tarjetas');
    $('start').disabled = count === 0;
    $('start').textContent = count ? '▶ Vamos a jugar' : 'Sin tarjetas disponibles';
    updateOrientationUI();
  }

  function updateOrientationUI() {
    document.body.dataset.orientationMode = orientationMode;
    document.querySelectorAll('[data-orientation]').forEach(button => {
      const active = button.dataset.orientation === orientationMode;
      button.classList.toggle('selected',active);
      button.setAttribute('aria-pressed',String(active));
    });
    $('orientation-status').textContent =
      (orientationMode === 'landscape' ? 'Horizontal' : 'Vertical') +
      ' · al comenzar intentaremos ajustar la pantalla.';
  }

  function setOrientation(mode) {
    if (!['portrait','landscape'].includes(mode)) return;
    orientationMode = mode;
    try { localStorage.setItem('caras-gestos-orientation',mode); } catch {}
    updateOrientationUI();
  }

  async function applyOrientation() {
    const coarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : true;
    if (!coarse) return;
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>{});
      }
      if (screen.orientation?.lock) await screen.orientation.lock(orientationMode).catch(()=>{});
    } catch {}
    setTimeout(()=>requestAnimationFrame(fitCard),100);
  }

  function unlockOrientation() {
    try { screen.orientation?.unlock?.(); } catch {}
  }

  function shuffle(items) {
    const result = items.slice();
    for (let i=result.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
  }

  function preload(card) {
    let url;
    try { url = new URL(card.imagen,base); } catch { return Promise.resolve(false); }
    if (url.origin !== location.origin || !/\.(webp|png|jpe?g|gif|svg|avif)$/i.test(url.pathname)) return Promise.resolve(false);
    card.url = url.href;
    if (imageCache.has(card.url)) return imageCache.get(card.url);
    const promise = new Promise(resolve => {
      const img = new Image();
      let done = false;
      const timer = setTimeout(()=>finish(false),7000);
      function finish(ok) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        img.onload = img.onerror = null;
        if (!ok) imageCache.delete(card.url);
        resolve(ok);
      }
      img.onload = ()=>finish(img.naturalWidth>0);
      img.onerror = ()=>finish(false);
      img.src = card.url;
    });
    imageCache.set(card.url,promise);
    return promise;
  }

  async function prepare() {
    if (state === 'loading') return;
    const generation = ++prepareGeneration;
    if (history.state?.carasGestos !== 'turn') history.pushState({carasGestos:'turn'},'',location.href);
    state = 'loading';
    $('start').disabled = true;
    $('again').disabled = true;
    notice('');
    const candidates = shuffle(selectedCards()).slice(0,25);
    let cursor = 0, loaded = 0;
    const usable = [];
    await Promise.all(Array.from({length:Math.min(6,candidates.length)},async()=>{
      while (cursor < candidates.length && generation === prepareGeneration) {
        const index = cursor++, card = candidates[index];
        if (await preload(card)) usable.push({index,card});
        if (generation !== prepareGeneration) return;
        loaded++;
        $('start').textContent = `Preparando imágenes · ${loaded}/${candidates.length}`;
      }
    }));
    if (generation !== prepareGeneration) return;
    round = usable.sort((a,b)=>a.index-b.index).map(x=>x.card);
    $('again').disabled = false;
    updateMenu();
    if (!round.length) {
      state='home';show('home');
      notice('No se pudieron preparar las imágenes. Intenta nuevamente.');
      return;
    }
    $('ready-info').textContent = `${round.length} tarjetas preparadas · ${orientationMode==='landscape'?'modo horizontal':'modo vertical'}`;
    state='ready';show('ready');$('begin').focus({preventScroll:true});
  }

  function clearTimers() {
    clearInterval(ticker); clearTimeout(transition); clearInterval(countdownTimer);
    ticker = transition = countdownTimer = 0;
  }

  async function begin() {
    if (state !== 'ready') return;
    await applyOrientation();
    answers=[];position=0;streak=0;bestStreak=0;remaining=seconds*1000;
    updateStreak();
    state='countdown';show('play');$('gesture-card').style.visibility='hidden';$('countdown').hidden=false;
    $('score').textContent='0';$('time').textContent=seconds||'∞';
    $('time-bar').firstElementChild.style.width='100%';$('time-bar').setAttribute('aria-valuenow','100');
    let count=3;$('count').textContent=count;vibrate(45);keepAwake();
    countdownTimer=setInterval(()=>{
      count--;
      if(count>0){$('count').textContent=count;vibrate(45);return;}
      clearInterval(countdownTimer);countdownTimer=0;
      $('countdown').hidden=true;state='playing';deadline=performance.now()+remaining;
      vibrate([70,45,100]);showCard();ticker=setInterval(tick,100);tick();
    },850);
  }

  function colorFor(card,index) {
    const list=colors[card.categoria]||['#eee9fb'];
    return list[index%list.length];
  }

  const toolMap={
    cara:['😊','CARA'],
    manos:['🙌','MANOS'],
    cuerpo:['🧍','CUERPO']
  };

  function toolChips(expression) {
    const parts = String(expression||'').split('-').filter(Boolean);
    return parts.map(key => {
      const item=toolMap[key]||['✦',key.toUpperCase()];
      return `<span class="tool-chip"><i>${item[0]}</i>${item[1]}</span>`;
    }).join('');
  }

  function showCard() {
    if (position >= round.length) { finish('¡Representaron todas las tarjetas preparadas!'); return; }
    const card=round[position];
    $('gesture-card').style.setProperty('--card-bg',colorFor(card,position));
    $('card-category').textContent=card.categoria.toUpperCase();
    $('card-level').textContent=card.nivel.toUpperCase();
    $('card-image').src=card.url;
    $('card-image').alt=card.palabra;
    $('card-word').textContent=card.palabra;
    $('card-hint').textContent=card.pista;
    $('expression-tools').innerHTML=toolChips(card.expresion);
    $('gesture-card').style.visibility='visible';
    $('play-tip').textContent='Tu equipo mira tus gestos, no la pantalla.';
    requestAnimationFrame(fitCard);
  }

  function fitCard() {
    if (!['playing','feedback','paused','suspended'].includes(state)) return;
    const title=$('card-word');
    title.style.fontSize='';
    let size=parseFloat(getComputedStyle(title).fontSize);
    const maxHeight=Math.max(50,$('gesture-card').clientHeight*.36);
    while(size>28 && (title.scrollHeight>maxHeight || title.scrollWidth>title.clientWidth+2)) {
      size-=2;title.style.fontSize=size+'px';
    }
  }

  function tick() {
    if (!['playing','feedback'].includes(state)) return;
    if (seconds) {
      remaining=Math.max(0,deadline-performance.now());
      const pct=remaining/(seconds*1000)*100;
      $('time').textContent=Math.ceil(remaining/1000);
      $('time-bar').firstElementChild.style.width=pct+'%';
      $('time-bar').setAttribute('aria-valuenow',String(Math.round(pct)));
      document.body.classList.toggle('time-low',remaining<=10000);
      if (remaining<=0) finish('Se acabó el tiempo');
    } else {
      $('time').textContent='∞';$('time-bar').setAttribute('aria-valuenow','100');
    }
  }

  function updateStreak() {
    if (streak >= 2) {
      $('streak').hidden=false;$('streak').querySelector('b').textContent=streak;
    } else $('streak').hidden=true;
  }

  function answer(kind) {
    if (state !== 'playing') return;
    if (seconds && performance.now()>=deadline) { finish('Se acabó el tiempo'); return; }
    state='feedback';
    const card=round[position];
    const correct=kind==='correct';
    answers.push({...card,correct});
    position++;
    if (correct) {streak++;bestStreak=Math.max(bestStreak,streak);}
    else streak=0;
    $('score').textContent=String(answers.filter(a=>a.correct).length);
    updateStreak();
    vibrate(correct?[60,35,80]:[120]);
    $('feedback').classList.toggle('passed',!correct);
    $('feedback').querySelector('strong').textContent=correct?'✓':'↷';
    $('feedback').querySelector('span').textContent=correct?'¡Lo adivinaron!':'Pasamos';
    $('feedback').querySelector('small').textContent=correct?(streak>=2?`🔥 Racha de ${streak}`:'Siguiente gesto…'):'Nueva tarjeta…';
    $('feedback').hidden=false;
    transition=setTimeout(()=>{
      $('feedback').hidden=true;
      if(state!=='feedback')return;
      state='playing';showCard();
    },560);
  }

  function pause() {
    if (state==='countdown') {
      clearTimers();$('countdown').hidden=true;state='ready';show('ready');releaseWake();return;
    }
    if (!['playing','feedback'].includes(state)) return;
    if (seconds) remaining=Math.max(0,deadline-performance.now());
    clearTimers();state='paused';$('feedback').hidden=true;releaseWake();
    $('pause-dialog').showModal();
  }

  function resume() {
    if (state!=='paused') return;
    $('pause-dialog').close();state='playing';deadline=performance.now()+remaining;
    showCard();keepAwake();ticker=setInterval(tick,100);tick();
  }

  function suspendForVisibility() {
    if (!['playing','feedback','countdown'].includes(state)) return;
    hiddenAt=performance.now();suspendedState=state;
    if (seconds && ['playing','feedback'].includes(state)) remaining=Math.max(0,deadline-performance.now());
    clearTimers();state='suspended';releaseWake();
  }

  function resumeFromVisibility() {
    if (state!=='suspended') return;
    const was=suspendedState;suspendedState='';
    if (was==='countdown') {
      state='ready';$('countdown').hidden=true;show('ready');return;
    }
    state='playing';$('feedback').hidden=true;deadline=performance.now()+remaining;
    show('play');showCard();keepAwake();ticker=setInterval(tick,100);tick();
    $('play-tip').textContent='Continuamos · el reloj se detuvo mientras la app no estaba visible.';
    hiddenAt=0;
  }

  function finish(reason='Turno terminado') {
    clearTimers();state='results';releaseWake();unlockOrientation();
    $('feedback').hidden=true;$('countdown').hidden=true;
    if($('pause-dialog').open)$('pause-dialog').close();
    document.body.classList.remove('time-low');
    const correct=answers.filter(a=>a.correct).length;
    $('final-correct').textContent=String(correct);
    $('final-pass').textContent=String(answers.length-correct);
    $('final-best-streak').textContent=String(bestStreak);
    $('end-reason').textContent=reason;
    $('result-title').textContent=correct>=8?'¡Gran actuación!':correct>=4?'¡Muy buen turno!':'¡Sigan practicando!';
    $('review').replaceChildren(...answers.map(a=>{
      const row=document.createElement('div');row.className='review-item '+(a.correct?'good':'pass');
      const img=document.createElement('img');img.src=a.url;img.alt='';
      const word=document.createElement('b');word.textContent=a.palabra;
      const icon=document.createElement('span');icon.textContent=a.correct?'✓':'↷';
      row.append(img,word,icon);return row;
    }));
    vibrate([80,50,80,50,150]);show('results');$('again').focus({preventScroll:true});
  }

  function showMenu() {
    ++prepareGeneration;clearTimers();releaseWake();unlockOrientation();
    state='home';$('feedback').hidden=true;$('countdown').hidden=true;
    if($('pause-dialog').open)$('pause-dialog').close();
    if($('help-dialog').open)$('help-dialog').close();
    if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
    document.body.classList.remove('time-low');
    $('again').disabled=false;show('home');updateMenu();
  }

  function menu() {
    showMenu();
    if(history.state?.carasGestos==='turn')history.back();
  }

  $('decks').addEventListener('click',e=>{
    const button=e.target.closest('[data-deck]');
    if(!button||button.disabled)return;
    deck=button.dataset.deck;updateMenu();
  });
  $('levels').addEventListener('click',e=>{
    const button=e.target.closest('[data-level]');if(!button)return;
    level=button.dataset.level;
    document.querySelectorAll('[data-level]').forEach(b=>{const active=b===button;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
    updateMenu();
  });
  $('durations').addEventListener('click',e=>{
    const button=e.target.closest('[data-seconds]');if(!button)return;
    seconds=Number(button.dataset.seconds);
    document.querySelectorAll('[data-seconds]').forEach(b=>{const active=b===button;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
  });
  $('orientations').addEventListener('click',e=>{
    const button=e.target.closest('[data-orientation]');if(button)setOrientation(button.dataset.orientation);
  });

  if(!navigator.vibrate){vibration=false;$('vibration').disabled=true;$('vibration').setAttribute('aria-pressed','false');$('vibration').textContent='No disponible';}
  $('vibration').onclick=()=>{
    vibration=!vibration;$('vibration').setAttribute('aria-pressed',String(vibration));
    $('vibration').textContent=vibration?'✓ Activa':'Desactivada';if(vibration)vibrate(60);
  };

  $('start').onclick=prepare;$('again').onclick=prepare;$('begin').onclick=begin;
  $('cancel-ready').onclick=menu;$('correct').onclick=()=>answer('correct');$('pass').onclick=()=>answer('pass');
  $('pause').onclick=pause;$('resume').onclick=resume;$('finish').onclick=()=>finish();$('menu').onclick=menu;
  $('help').onclick=()=>$('help-dialog').showModal();
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());

  $('fullscreen').onclick=async()=>{
    try {
      if(document.fullscreenElement){unlockOrientation();await document.exitFullscreen();}
      else if(document.documentElement.requestFullscreen){
        await document.documentElement.requestFullscreen({navigationUI:'hide'});
        if(screen.orientation?.lock)await screen.orientation.lock(orientationMode).catch(()=>{});
      }
    } catch {}
    requestAnimationFrame(fitCard);
  };

  document.addEventListener('keydown',e=>{
    if(state==='playing'&&!e.repeat){
      if(e.key==='ArrowRight'||e.key==='Enter'){e.preventDefault();answer('correct');}
      if(e.key==='ArrowLeft'){e.preventDefault();answer('pass');}
      if(e.key==='Escape'||e.key===' '){e.preventDefault();pause();}
    }
  });

  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendForVisibility();else resumeFromVisibility();});
  window.addEventListener('pagehide',()=>{suspendForVisibility();releaseWake();});
  window.addEventListener('resize',()=>requestAnimationFrame(fitCard));
  window.addEventListener('orientationchange',()=>setTimeout(()=>requestAnimationFrame(fitCard),120));
  screen.orientation?.addEventListener?.('change',()=>setTimeout(()=>requestAnimationFrame(fitCard),80));

  window.addEventListener('popstate',()=>{
    if(history.state?.carasGestos==='turn')history.replaceState({carasGestos:'menu'},'',location.href);
    showMenu();
  });

  document.querySelector('.topbar .back').addEventListener('click',e=>{
    if(state!=='home'){e.preventDefault();menu();}
  });

  $('card-image').addEventListener('error',()=>{
    if(state==='playing'){
      $('play-tip').textContent='Esta imagen no pudo mostrarse · puedes pasar a la siguiente tarjeta.';
    }
  });

  updateOrientationUI();
  readBank();
})();
