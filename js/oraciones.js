/* ============================================================
   LSPedia - Construye la oración V6 integrada
   300 actividades de español cotidiano (Perú) · 50 por nivel
   ============================================================ */
const OracionesV2 = (function(){
  "use strict";

  let contenedor=null;
  let shadow=null;
  let juego=null;
  let observer=null;

  const ESTILOS="\n:root{\n  --bg:#f4f8ff; --card:#fff; --text:#18324a; --muted:#6b7f92;\n  --azul:#2563eb; --rojo:#e5484d; --verde:#16a34a; --morado:#7c3aed; --naranja:#f59e0b;\n}\n*{box-sizing:border-box}\n:host{display:block;margin:0;background:linear-gradient(180deg,#eef6ff,#f8fbff 45%,#fff);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:var(--text)}\nbutton,input{font:inherit}\n.app{max-width:760px;margin:0 auto;padding:12px 12px 40px;min-height:100vh}\n.top{display:flex;align-items:center;gap:10px;margin-bottom:10px}\n.logo{width:46px;height:46px;border-radius:16px;background:#0f3b63;color:#fff;display:grid;place-items:center;font-weight:1000;box-shadow:0 6px 18px #0f3b6322}\n.logo-oraciones{position:relative;overflow:hidden;background:#dff4ff;color:#0f3b63;border:1px solid #c8e8f8}\n.logo-oraciones .frase-tarjeta{position:absolute;left:8px;width:26px;height:13px;border:2px solid #155e9b;border-radius:5px;background:#fff;box-shadow:0 2px 5px #0f172a12}\n.logo-oraciones .frase-tarjeta::after{content:'';position:absolute;left:5px;right:5px;top:4px;height:2px;border-radius:9px;background:#5aa9df;box-shadow:0 4px 0 #9acced}\n.logo-oraciones .frase-tarjeta-1{top:8px;transform:rotate(-4deg)}\n.logo-oraciones .frase-tarjeta-2{top:23px;left:11px;transform:rotate(2deg);background:#fff7cf;border-color:#d99b13}\n.logo-oraciones .frase-lapiz{position:absolute;right:1px;bottom:0;font-size:20px;transform:rotate(-12deg);filter:drop-shadow(0 2px 2px #0f172a18)}\n.top h1{font-size:1.28rem;margin:0;font-weight:950}\n.top p{margin:2px 0 0;color:var(--muted);font-size:.82rem}\n.card{background:var(--card);border-radius:22px;padding:15px;margin:11px 0;box-shadow:0 10px 30px #0f172a12;border:1px solid #e7eef7}\n.hidden{display:none!important}\n.section-title{font-weight:950;margin-bottom:9px}\n.modes{display:grid;grid-template-columns:1fr 1fr;gap:9px}\n.mode{border:2px solid #dbe5ef;background:white;border-radius:16px;padding:12px;font-weight:900;color:var(--text)}\n.mode.active{border-color:var(--azul);background:#eff6ff;color:#174ea6}\n.mode span{display:block;font-size:1.4rem;margin-bottom:2px}\n.levels{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}\n.level{border:2px solid #dbe5ef;background:#fff;border-radius:16px;padding:11px 8px;text-align:left}\n.level[data-level='1']{--nivel-acento:#2fa77b;background:#eefaf4;border-color:#c6ead9}\n.level[data-level='2']{--nivel-acento:#5b9ee8;background:#eef6ff;border-color:#c8def8}\n.level[data-level='3']{--nivel-acento:#dc9562;background:#fff4ec;border-color:#f1d3bd}\n.level[data-level='4']{--nivel-acento:#9b78dc;background:#f6f0ff;border-color:#ddcff6}\n.level[data-level='5']{--nivel-acento:#d3a52b;background:#fff9e7;border-color:#efdfa4}\n.level[data-level='6']{--nivel-acento:#d77c9a;background:#fff0f5;border-color:#f1c8d6}\n.level.active{border-color:var(--nivel-acento,#0f9f6e);box-shadow:0 0 0 3px #0f172a0c}\n.level strong{display:block;font-size:.94rem}\n.level small{color:var(--muted)}\n.tip{margin:9px 0 0;color:var(--muted);font-size:.82rem;line-height:1.35}\n.start{width:100%;border:0;border-radius:17px;padding:14px;background:#0f3b63;color:white;font-weight:950;font-size:1.05rem}\n.game-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}\n.back{border:0;background:#eaf3ff;color:#174ea6;border-radius:13px;padding:9px 12px;font-weight:950}\n.game-title{font-weight:950;flex:1}\n.pill{border-radius:999px;padding:6px 9px;background:#eef6ff;color:#174ea6;font-size:.75rem;font-weight:900}\n.progress,.timer{height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden;margin-bottom:7px}\n.progress>div,.timer>div{height:100%;width:0;background:var(--azul);transition:width .25s}\n.timer>div{width:100%;background:#22c55e;transition:width 1s linear}\n.game-card{padding:14px}\n.score{display:flex;justify-content:space-between;color:#526a80;font-size:.84rem;font-weight:850}\n.scene{position:relative;min-height:190px;border:2px solid #dbe5ef;border-radius:20px;background:#fbfdff;margin-top:10px;padding:14px;overflow:hidden}\n.scene-main{display:flex;justify-content:center;align-items:center;gap:12px;font-size:3.2rem;min-height:100px}\n.scene-note{text-align:center;font-weight:900;color:#526a80;font-size:.84rem}\n.role-row{display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:8px}\n.role{border-radius:999px;padding:5px 9px;font-size:.76rem;font-weight:900;color:white}\n.role.who{background:var(--azul)} .role.action{background:var(--rojo)} .role.what{background:var(--verde)}\n.role.time{background:var(--morado)} .role.connector{background:var(--naranja)}\n.builder{margin-top:12px}\n.slots{display:flex;justify-content:center;gap:7px;flex-wrap:wrap;min-height:66px}\n.slot{min-width:92px;min-height:54px;border-radius:15px;border:3px dashed #cbd5e1;background:#f8fafc;display:flex;align-items:center;justify-content:center;padding:6px;font-weight:900;text-align:center;position:relative}\n.slot::before{content:attr(data-icon);position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:#fff;border:2px solid #e2e8f0;border-radius:99px;padding:1px 7px;font-size:.78rem}\n.slot.who{border-color:#93c5fd;background:#eff6ff}.slot.action{border-color:#fda4af;background:#fff1f2}.slot.what{border-color:#86efac;background:#f0fdf4}.slot.time{border-color:#c4b5fd;background:#f5f3ff}.slot.connector{border-color:#fcd34d;background:#fffbeb}\n.bank{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:15px;min-height:58px}\n.word{border:0;border-radius:14px;padding:11px 13px;background:white;box-shadow:0 4px 12px #0f172a18;border:2px solid #dbe5ef;font-weight:900;touch-action:none;user-select:none;cursor:grab}\n.word.selected{outline:4px solid #bfdbfe;transform:scale(1.04)}\n.word.who{color:#1d4ed8;border-color:#93c5fd}.word.action{color:#be123c;border-color:#fda4af}.word.what{color:#15803d;border-color:#86efac}.word.time{color:#6d28d9;border-color:#c4b5fd}.word.connector{color:#b45309;border-color:#fcd34d}\n.word.dragging{position:fixed!important;z-index:9999;pointer-events:none;box-shadow:0 12px 32px #0f172a35;transform:scale(1.08)}\n.help{margin-top:11px;padding:10px 12px;border-radius:15px;background:#eff6ff;color:#174ea6;font-size:.86rem;font-weight:850;text-align:center}\n.tutorial-badge{position:absolute;top:9px;left:50%;transform:translateX(-50%);z-index:10;background:#e0f2fe;color:#075985;border-radius:999px;padding:7px 11px;font-weight:950;font-size:.8rem}\n.hand{position:fixed;z-index:10001;font-size:2.4rem;pointer-events:none;transition:transform .9s cubic-bezier(.2,.8,.25,1),left .9s cubic-bezier(.2,.8,.25,1),top .9s cubic-bezier(.2,.8,.25,1)}\n.ghost{position:fixed;z-index:10000;pointer-events:none;transition:left .9s cubic-bezier(.2,.8,.25,1),top .9s cubic-bezier(.2,.8,.25,1);opacity:.96}\n.now{margin-top:8px;text-align:center;color:#166534;font-weight:950;animation:pop .35s}\n@keyframes pop{0%{transform:scale(.7);opacity:.2}75%{transform:scale(1.12)}100%{transform:scale(1);opacity:1}}\n.feedback{margin-top:10px;border-radius:15px;padding:10px;text-align:center;font-weight:900}\n.feedback.ok{background:#dcfce7;color:#166534}.feedback.bad{background:#fee2e2;color:#991b1b}.feedback.info{background:#eff6ff;color:#174ea6}\n.answers{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}\n.answer{border:2px solid #dbe5ef;background:#fff;border-radius:15px;padding:13px 6px;font-weight:950}\n.answer.correct{background:#dcfce7;border-color:#16a34a}.answer.wrong{background:#fee2e2;border-color:#dc2626}\n.write-wrap{margin-top:12px}\n.write-line{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap;font-size:1.12rem;font-weight:900}\n.write-input{min-width:130px;max-width:210px;border:3px solid #93c5fd;border-radius:14px;padding:10px 12px;text-align:center;font-weight:950;outline:none}\n.check{margin-top:10px;width:100%;border:0;border-radius:14px;padding:12px;background:var(--azul);color:#fff;font-weight:950}\n.next{margin-top:12px;width:100%;border:0;border-radius:14px;padding:12px;background:#0f3b63;color:white;font-weight:950}\n.flash-red,.flash-ok,.countdown,.confetti{position:fixed;inset:0;pointer-events:none}\n.flash-red{z-index:9997;background:#dc262677;animation:fade .5s forwards}\n.flash-ok{z-index:9997;background:radial-gradient(circle,#fff 0,#fff7c7ee 30%,#fde68a77 62%,transparent 100%);animation:fade 1s forwards}\n@keyframes fade{0%{opacity:0}20%{opacity:1}100%{opacity:0}}\n.countdown{z-index:9996;display:grid;place-items:center;background:#0f172a22}\n.countdown>div{width:155px;height:155px;border-radius:50%;background:#0f172add;color:white;border:6px solid white;display:grid;place-items:center;font-size:5.8rem;font-weight:1000;animation:count .8s both}\n.countdown>div.urgent{background:#dc2626e8}\n@keyframes count{0%{transform:scale(.55);opacity:0}25%{transform:scale(1.12);opacity:1}80%{transform:scale(1);opacity:1}100%{transform:scale(.82);opacity:.12}}\n.confetti{z-index:9998;overflow:hidden}\n.confetti i{position:absolute;top:-30px;width:10px;height:22px;border-radius:3px;animation:fall 2s linear forwards}\n@keyframes fall{to{transform:translateY(112vh) rotate(720deg)}}\n.overlay-react{position:fixed;inset:0;z-index:10002;display:grid;place-items:center;pointer-events:none}\n.overlay-react>div{font-size:4rem;background:#ffffffee;border-radius:28px;padding:18px 25px;box-shadow:0 16px 50px #0f172a33;animation:pop .45s}\n.legend{margin-top:10px;display:flex;justify-content:center;gap:5px;flex-wrap:wrap}\n.legend span{font-size:.72rem;border-radius:99px;padding:4px 7px;color:#fff;font-weight:850}\n@media(max-width:390px){\n .app{padding-left:8px;padding-right:8px}\n .scene-main{font-size:2.7rem}.slot{min-width:84px}.word{padding:10px 11px}.top h1{font-size:1.15rem}\n}\n\n/* ===== V2: verbo de origen + conversaciones reales + niveles avanzados ===== */\n.verb-origin{\n  margin-top:12px;border:2px solid #bfdbfe;background:#eff6ff;border-radius:18px;\n  padding:12px;text-align:center\n}\n.verb-origin .label{font-size:.72rem;color:#64748b;font-weight:900;letter-spacing:.04em}\n.verb-origin .inf{font-size:1.45rem;font-weight:1000;color:#1d4ed8;margin:2px 0 7px}\n.verb-origin .arrowline{font-size:1.2rem;font-weight:950;color:#334155}\n.verb-origin .forms{display:flex;justify-content:center;gap:7px;flex-wrap:wrap;margin-top:8px}\n.verb-origin .form{\n  background:#fff;border:2px solid #dbe5ef;border-radius:999px;padding:6px 10px;\n  font-size:.82rem;font-weight:900\n}\n.verb-origin .form.past{color:#7c3aed;border-color:#c4b5fd}\n.verb-origin .form.present{color:#166534;border-color:#86efac}\n.verb-origin .form.future{color:#b45309;border-color:#fcd34d}\n.context-card{\n  margin-top:12px;border:2px solid #dbe5ef;background:#fff;border-radius:18px;padding:12px\n}\n.context-head{display:flex;align-items:center;gap:9px;margin-bottom:8px}\n.context-icon{font-size:2rem}\n.context-name{font-weight:1000}\n.chat{display:flex;flex-direction:column;gap:8px}\n.bubble{\n  max-width:86%;padding:9px 11px;border-radius:16px;font-weight:850;line-height:1.35\n}\n.bubble.a{align-self:flex-start;background:#eef6ff;border-bottom-left-radius:5px}\n.bubble.b{align-self:flex-end;background:#ecfdf5;border-bottom-right-radius:5px}\n.choice-list{display:grid;gap:8px;margin-top:12px}\n.choice-big{\n  border:2px solid #dbe5ef;background:#fff;border-radius:16px;padding:12px;\n  text-align:left;font-weight:900;color:#18324a\n}\n.choice-big.correct{background:#dcfce7;border-color:#16a34a}\n.choice-big.wrong{background:#fee2e2;border-color:#dc2626}\n.complex-map{\n  display:flex;justify-content:center;align-items:center;gap:6px;flex-wrap:wrap;margin-top:12px\n}\n.complex-map span{\n  border-radius:999px;padding:6px 9px;font-size:.76rem;font-weight:950;color:white\n}\n.complex-map .who{background:#2563eb}\n.complex-map .time{background:#7c3aed}\n.complex-map .action{background:#e5484d}\n.complex-map .what{background:#16a34a}\n.complex-map .connector{background:#f59e0b}\n.levels{grid-template-columns:repeat(2,1fr)}\n@media(min-width:620px){.levels{grid-template-columns:repeat(3,1fr)}}\n\n\n.content-summary{\n  margin-top:10px;display:flex;gap:7px;flex-wrap:wrap;justify-content:center\n}\n.content-summary span{\n  background:#f1f5f9;border:2px solid #dbe5ef;border-radius:999px;\n  padding:6px 9px;font-size:.75rem;font-weight:900;color:#526a80\n}\n.context-strip{\n  display:flex;gap:6px;overflow-x:auto;padding:2px 0 5px;margin-top:8px\n}\n.context-strip span{\n  white-space:nowrap;background:#fff;border:2px solid #dbe5ef;border-radius:999px;\n  padding:5px 8px;font-size:.72rem;font-weight:850;color:#526a80\n}\n\n";
  const MARCADO="<div class=\"app\">\n  <div class=\"top\">\n    <div class=\"logo logo-oraciones\" aria-hidden=\"true\"><span class=\"frase-tarjeta frase-tarjeta-1\"></span><span class=\"frase-tarjeta frase-tarjeta-2\"></span><span class=\"frase-lapiz\">✏️</span></div>\n    <div><h1>Construye la oración</h1><p>Leer · escribir · ordenar ideas</p></div>\n  </div>\n\n  <section id=\"menu\">\n    <div class=\"card\">\n      <div class=\"section-title\">Cómo funciona</div>\n      <p class=\"tip\" style=\"margin-top:0\">👀 Primero verás una guía visual corta. Después haces la actividad tú. Al empezar, corre el tiempo.</p>\n      <div class=\"content-summary\">\n        <span>🎲 preguntas diferentes</span>\n        <span>🧠 300 actividades</span>\n        <span>🇵🇪 español de uso diario</span>\n      </div>\n      <div class=\"context-strip\">\n        <span>🏠 Familia</span><span>🏫 Colegio</span><span>💼 Trabajo</span><span>🚌 Transporte</span>\n        <span>🛒 Compras</span><span>🏥 Salud</span><span>📱 Tecnología</span><span>🤝 Trámites</span>\n      </div>\n    </div>\n\n    <div class=\"card\">\n      <div class=\"section-title\">Nivel</div>\n      <div class=\"levels\">\n        <button class=\"level active\" data-level=\"1\"><strong>1 · Ordenar</strong><small>👤 + ⚡ + 🎯</small></button>\n        <button class=\"level\" data-level=\"2\"><strong>2 · Conjugar</strong><small>verbo → ayer / hoy / mañana</small></button>\n        <button class=\"level\" data-level=\"3\"><strong>3 · Conectar</strong><small>idea + 🔗 + idea</small></button>\n        <button class=\"level\" data-level=\"4\"><strong>4 · Escribir</strong><small>✍️ palabra faltante</small></button>\n        <button class=\"level\" data-level=\"5\"><strong>5 · Conversar</strong><small>👥 💬 📱 amigos y redes</small></button>\n        <button class=\"level\" data-level=\"6\"><strong>6 · Oraciones completas</strong><small>más palabras y más ideas</small></button>\n      </div>\n      <p id=\"levelTip\" class=\"tip\">Empieza con quién hace qué.</p>\n    </div>\n\n    <button id=\"start\" class=\"start\">Empezar</button>\n  </section>\n\n  <section id=\"game\" class=\"hidden\">\n    <div class=\"game-head\">\n      <button id=\"back\" class=\"back\">←</button>\n      <div id=\"gameTitle\" class=\"game-title\"></div>\n      <div id=\"modePill\" class=\"pill\"></div>\n    </div>\n    <div class=\"progress\"><div id=\"progress\"></div></div>\n    <div id=\"timerWrap\" class=\"timer hidden\"><div id=\"timer\"></div></div>\n\n    <div class=\"card game-card\">\n      <div class=\"score\"><span id=\"score\">⭐ 0</span><span id=\"round\">1 / 5</span></div>\n      <div id=\"scene\" class=\"scene\"></div>\n      <div id=\"activity\"></div>\n      <div id=\"feedback\"></div>\n      <button id=\"next\" class=\"next hidden\">Siguiente →</button>\n    </div>\n  </section>\n</div>";

  function urlBaseOraciones(pantalla="", nivel=""){
    const url=new URL(window.location.href);
    url.search="";
    url.searchParams.set("vista","herramientas-jugar");
    url.searchParams.set("juego","oraciones");
    if(pantalla) url.searchParams.set("pantalla",pantalla);
    if(nivel) url.searchParams.set("nivel",String(nivel));
    return url.pathname+"?"+url.searchParams.toString();
  }

  function registrarMenu(){
    const url=urlBaseOraciones();
    const actual=window.location.pathname+window.location.search;
    if(actual!==url) history.pushState({tipo:"juego-oraciones",vista:"herramientas-jugar",juego:"oraciones"},"",url);
  }

  function registrarPartida(nivel){
    const url=urlBaseOraciones("partida",nivel);
    const actual=window.location.pathname+window.location.search;
    if(actual!==url) history.pushState({tipo:"juego-oraciones",vista:"herramientas-jugar",juego:"oraciones",pantalla:"partida",nivel},"",url);
  }

  function volverInterno(){
    if(juego) juego.detener();
    const p=new URLSearchParams(window.location.search);
    if(p.get("vista")==="herramientas-jugar" && p.get("juego")==="oraciones" && p.get("pantalla")==="partida" && history.length>1){
      history.back();
      return;
    }
    if(juego) juego.mostrarMenu();
  }

  function crearLogica(){
    const $ = id => shadow.getElementById(id);
    const ROLE = {
      who:{label:"QUIÉN", icon:"👤", cls:"who"},
      action:{label:"ACCIÓN", icon:"⚡", cls:"action"},
      what:{label:"QUÉ / DÓNDE", icon:"🎯", cls:"what"},
      time:{label:"CUÁNDO", icon:"🕒", cls:"time"},
      connector:{label:"UNE", icon:"🔗", cls:"connector"}
    };
    
    const DATA = {"1":[{"id":"ord01","scene":"👧 🍎","note":"Casa","cards":[{"t":"La niña","r":"who"},{"t":"come","r":"action"},{"t":"una manzana","r":"what"}],"roles":["who","action","what"],"answer":["La niña","come","una manzana"]},{"id":"ord02","scene":"👦 ⚽","note":"Parque","cards":[{"t":"El niño","r":"who"},{"t":"juega","r":"action"},{"t":"fútbol","r":"what"}],"roles":["who","action","what"],"answer":["El niño","juega","fútbol"]},{"id":"ord03","scene":"👩 📖","note":"Casa","cards":[{"t":"La mujer","r":"who"},{"t":"lee","r":"action"},{"t":"un libro","r":"what"}],"roles":["who","action","what"],"answer":["La mujer","lee","un libro"]},{"id":"ord04","scene":"👨 🚌","note":"Transporte","cards":[{"t":"El hombre","r":"who"},{"t":"toma","r":"action"},{"t":"el bus","r":"what"}],"roles":["who","action","what"],"answer":["El hombre","toma","el bus"]},{"id":"ord05","scene":"👵 ☕","note":"Familia","cards":[{"t":"La abuela","r":"who"},{"t":"bebe","r":"action"},{"t":"café","r":"what"}],"roles":["who","action","what"],"answer":["La abuela","bebe","café"]},{"id":"ord06","scene":"👨‍🏫 ✍️","note":"Colegio","cards":[{"t":"El profesor","r":"who"},{"t":"escribe","r":"action"},{"t":"en la pizarra","r":"what"}],"roles":["who","action","what"],"answer":["El profesor","escribe","en la pizarra"]},{"id":"ord07","scene":"👩‍🎓 📚","note":"Colegio","cards":[{"t":"La estudiante","r":"who"},{"t":"estudia","r":"action"},{"t":"para el examen","r":"what"}],"roles":["who","action","what"],"answer":["La estudiante","estudia","para el examen"]},{"id":"ord08","scene":"👨‍💼 💻","note":"Trabajo","cards":[{"t":"El trabajador","r":"who"},{"t":"usa","r":"action"},{"t":"la computadora","r":"what"}],"roles":["who","action","what"],"answer":["El trabajador","usa","la computadora"]},{"id":"ord09","scene":"👩‍🍳 🍲","note":"Casa","cards":[{"t":"Mi mamá","r":"who"},{"t":"cocina","r":"action"},{"t":"la cena","r":"what"}],"roles":["who","action","what"],"answer":["Mi mamá","cocina","la cena"]},{"id":"ord10","scene":"👨 🧹","note":"Casa","cards":[{"t":"Mi papá","r":"who"},{"t":"limpia","r":"action"},{"t":"la sala","r":"what"}],"roles":["who","action","what"],"answer":["Mi papá","limpia","la sala"]},{"id":"ord11","scene":"👧 📱","note":"Tecnología","cards":[{"t":"Mi hermana","r":"who"},{"t":"envía","r":"action"},{"t":"un mensaje","r":"what"}],"roles":["who","action","what"],"answer":["Mi hermana","envía","un mensaje"]},{"id":"ord12","scene":"👦 🥖","note":"Compras","cards":[{"t":"Mi hermano","r":"who"},{"t":"compra","r":"action"},{"t":"pan","r":"what"}],"roles":["who","action","what"],"answer":["Mi hermano","compra","pan"]},{"id":"ord13","scene":"👩‍⚕️ 🩺","note":"Salud","cards":[{"t":"La doctora","r":"who"},{"t":"atiende","r":"action"},{"t":"al paciente","r":"what"}],"roles":["who","action","what"],"answer":["La doctora","atiende","al paciente"]},{"id":"ord14","scene":"🧍 🚪","note":"Trabajo","cards":[{"t":"El jefe","r":"who"},{"t":"abre","r":"action"},{"t":"la oficina","r":"what"}],"roles":["who","action","what"],"answer":["El jefe","abre","la oficina"]},{"id":"ord15","scene":"👩 🛒","note":"Mercado","cards":[{"t":"La señora","r":"who"},{"t":"paga","r":"action"},{"t":"la compra","r":"what"}],"roles":["who","action","what"],"answer":["La señora","paga","la compra"]},{"id":"ord16","scene":"👨‍🎓 📝","note":"Colegio","cards":[{"t":"El alumno","r":"who"},{"t":"responde","r":"action"},{"t":"la pregunta","r":"what"}],"roles":["who","action","what"],"answer":["El alumno","responde","la pregunta"]},{"id":"ord17","scene":"👩‍🏫 📢","note":"Colegio","cards":[{"t":"La profesora","r":"who"},{"t":"explica","r":"action"},{"t":"la lección","r":"what"}],"roles":["who","action","what"],"answer":["La profesora","explica","la lección"]},{"id":"ord18","scene":"👨‍🔧 🔧","note":"Trabajo","cards":[{"t":"El técnico","r":"who"},{"t":"repara","r":"action"},{"t":"la máquina","r":"what"}],"roles":["who","action","what"],"answer":["El técnico","repara","la máquina"]},{"id":"ord19","scene":"👩‍💼 📧","note":"Trabajo","cards":[{"t":"La secretaria","r":"who"},{"t":"envía","r":"action"},{"t":"un correo","r":"what"}],"roles":["who","action","what"],"answer":["La secretaria","envía","un correo"]},{"id":"ord20","scene":"👨‍⚕️ 💊","note":"Salud","cards":[{"t":"El médico","r":"who"},{"t":"receta","r":"action"},{"t":"una medicina","r":"what"}],"roles":["who","action","what"],"answer":["El médico","receta","una medicina"]},{"id":"ord21","scene":"👩 🏦","note":"Banco","cards":[{"t":"La señora","r":"who"},{"t":"retira","r":"action"},{"t":"dinero","r":"what"}],"roles":["who","action","what"],"answer":["La señora","retira","dinero"]},{"id":"ord22","scene":"👨 🧾","note":"Servicios","cards":[{"t":"El vecino","r":"who"},{"t":"paga","r":"action"},{"t":"el recibo de luz","r":"what"}],"roles":["who","action","what"],"answer":["El vecino","paga","el recibo de luz"]},{"id":"ord23","scene":"👩‍🦰 🚌","note":"Transporte","cards":[{"t":"La joven","r":"who"},{"t":"espera","r":"action"},{"t":"el bus","r":"what"}],"roles":["who","action","what"],"answer":["La joven","espera","el bus"]},{"id":"ord24","scene":"👴 🥕","note":"Mercado","cards":[{"t":"El abuelo","r":"who"},{"t":"compra","r":"action"},{"t":"verduras","r":"what"}],"roles":["who","action","what"],"answer":["El abuelo","compra","verduras"]},{"id":"ord25","scene":"👩 📞","note":"Familia","cards":[{"t":"Mi tía","r":"who"},{"t":"llama","r":"action"},{"t":"a mi mamá","r":"what"}],"roles":["who","action","what"],"answer":["Mi tía","llama","a mi mamá"]},{"id":"ord26","scene":"👦 🧼","note":"Casa","cards":[{"t":"El niño","r":"who"},{"t":"lava","r":"action"},{"t":"sus manos","r":"what"}],"roles":["who","action","what"],"answer":["El niño","lava","sus manos"]},{"id":"ord27","scene":"👧 🎒","note":"Colegio","cards":[{"t":"La niña","r":"who"},{"t":"guarda","r":"action"},{"t":"sus cuadernos","r":"what"}],"roles":["who","action","what"],"answer":["La niña","guarda","sus cuadernos"]},{"id":"ord28","scene":"👨‍🍳 🍛","note":"Trabajo","cards":[{"t":"El cocinero","r":"who"},{"t":"prepara","r":"action"},{"t":"el almuerzo","r":"what"}],"roles":["who","action","what"],"answer":["El cocinero","prepara","el almuerzo"]},{"id":"ord29","scene":"👩‍💻 📄","note":"Trabajo","cards":[{"t":"La trabajadora","r":"who"},{"t":"revisa","r":"action"},{"t":"el documento","r":"what"}],"roles":["who","action","what"],"answer":["La trabajadora","revisa","el documento"]},{"id":"ord30","scene":"🧍‍♂️ 🪪","note":"Trámite","cards":[{"t":"El ciudadano","r":"who"},{"t":"muestra","r":"action"},{"t":"su DNI","r":"what"}],"roles":["who","action","what"],"answer":["El ciudadano","muestra","su DNI"]}],"2":[{"id":"conj01","scene":"🕒 AYER · 👦 ⚽","note":"Pasado","infinitive":"JUGAR","forms":{"past":"jugó","present":"juega","future":"jugará"},"sentence":["Ayer","el niño","___","fútbol"],"choices":["juega","jugó","jugará"],"correct":"jugó"},{"id":"conj02","scene":"☀️ HOY · 👩 📖","note":"Presente","infinitive":"LEER","forms":{"past":"leyó","present":"lee","future":"leerá"},"sentence":["Hoy","la mujer","___","un libro"],"choices":["leyó","lee","leerá"],"correct":"lee"},{"id":"conj03","scene":"🌅 MAÑANA · 👧 🏫","note":"Futuro","infinitive":"IR","forms":{"past":"fue","present":"va","future":"irá"},"sentence":["Mañana","la niña","___","al colegio"],"choices":["fue","va","irá"],"correct":"irá"},{"id":"conj04","scene":"🕒 AYER · 👨 🍚","note":"Pasado","infinitive":"COMER","forms":{"past":"comió","present":"come","future":"comerá"},"sentence":["Ayer","el hombre","___","arroz"],"choices":["come","comió","comerá"],"correct":"comió"},{"id":"conj05","scene":"☀️ HOY · 👵 💧","note":"Presente","infinitive":"BEBER","forms":{"past":"bebió","present":"bebe","future":"beberá"},"sentence":["Hoy","la abuela","___","agua"],"choices":["bebió","bebe","beberá"],"correct":"bebe"},{"id":"conj06","scene":"🕒 AYER · 👩‍🎓 📚","note":"Pasado","infinitive":"ESTUDIAR","forms":{"past":"estudió","present":"estudia","future":"estudiará"},"sentence":["Ayer","la estudiante","___","matemáticas"],"choices":["estudia","estudió","estudiará"],"correct":"estudió"},{"id":"conj07","scene":"☀️ HOY · 👨‍💼 💻","note":"Presente","infinitive":"TRABAJAR","forms":{"past":"trabajó","present":"trabaja","future":"trabajará"},"sentence":["Hoy","mi papá","___","desde casa"],"choices":["trabajó","trabaja","trabajará"],"correct":"trabaja"},{"id":"conj08","scene":"🌅 MAÑANA · 👩 🛒","note":"Futuro","infinitive":"COMPRAR","forms":{"past":"compró","present":"compra","future":"comprará"},"sentence":["Mañana","mi mamá","___","verduras"],"choices":["compró","compra","comprará"],"correct":"comprará"},{"id":"conj09","scene":"🕒 AYER · 🚌","note":"Pasado","infinitive":"LLEGAR","forms":{"past":"llegó","present":"llega","future":"llegará"},"sentence":["Ayer","el bus","___","tarde"],"choices":["llega","llegó","llegará"],"correct":"llegó"},{"id":"conj10","scene":"☀️ HOY · 📱","note":"Presente","infinitive":"LLAMAR","forms":{"past":"llamó","present":"llama","future":"llamará"},"sentence":["Hoy","mi hermana","___","a la abuela"],"choices":["llamó","llama","llamará"],"correct":"llama"},{"id":"conj11","scene":"🌅 MAÑANA · 📄","note":"Futuro","infinitive":"ENTREGAR","forms":{"past":"entregó","present":"entrega","future":"entregará"},"sentence":["Mañana","el alumno","___","la tarea"],"choices":["entregó","entrega","entregará"],"correct":"entregará"},{"id":"conj12","scene":"🕒 AYER · 💳","note":"Pasado","infinitive":"PAGAR","forms":{"past":"pagó","present":"paga","future":"pagará"},"sentence":["Ayer","mi mamá","___","el recibo"],"choices":["paga","pagó","pagará"],"correct":"pagó"},{"id":"conj13","scene":"☀️ HOY · 🧹","note":"Presente","infinitive":"LIMPIAR","forms":{"past":"limpió","present":"limpia","future":"limpiará"},"sentence":["Hoy","mi hermano","___","su cuarto"],"choices":["limpió","limpia","limpiará"],"correct":"limpia"},{"id":"conj14","scene":"🌅 MAÑANA · 🏥","note":"Futuro","infinitive":"VISITAR","forms":{"past":"visitó","present":"visita","future":"visitará"},"sentence":["Mañana","ella","___","al médico"],"choices":["visitó","visita","visitará"],"correct":"visitará"},{"id":"conj15","scene":"🕒 AYER · ✉️","note":"Pasado","infinitive":"ENVIAR","forms":{"past":"envió","present":"envía","future":"enviará"},"sentence":["Ayer","el jefe","___","un correo"],"choices":["envía","envió","enviará"],"correct":"envió"},{"id":"conj16","scene":"🕒 AYER · 👩 💬","note":"Pasado","infinitive":"HABLAR","forms":{"past":"habló","present":"habla","future":"hablará"},"sentence":["Ayer","mi mamá","___","con la profesora"],"choices":["habló","habla","hablará"],"correct":"habló"},{"id":"conj17","scene":"☀️ HOY · 👨‍🍳 🍲","note":"Presente","infinitive":"COCINAR","forms":{"past":"cocinó","present":"cocina","future":"cocinará"},"sentence":["Hoy","mi papá","___","el almuerzo"],"choices":["cocinó","cocina","cocinará"],"correct":"cocina"},{"id":"conj18","scene":"🌅 MAÑANA · 🚌","note":"Futuro","infinitive":"VIAJAR","forms":{"past":"viajó","present":"viaja","future":"viajará"},"sentence":["Mañana","mi hermano","___","a Huancayo"],"choices":["viajó","viaja","viajará"],"correct":"viajará"},{"id":"conj19","scene":"🕒 AYER · 🏪","note":"Pasado","infinitive":"ABRIR","forms":{"past":"abrió","present":"abre","future":"abrirá"},"sentence":["Ayer","la tienda","___","temprano"],"choices":["abrió","abre","abrirá"],"correct":"abrió"},{"id":"conj20","scene":"☀️ HOY · 🏪","note":"Presente","infinitive":"CERRAR","forms":{"past":"cerró","present":"cierra","future":"cerrará"},"sentence":["Hoy","la bodega","___","a las nueve"],"choices":["cerró","cierra","cerrará"],"correct":"cierra"},{"id":"conj21","scene":"🌅 MAÑANA · 👧 🏫","note":"Futuro","infinitive":"RECOGER","forms":{"past":"recogió","present":"recoge","future":"recogerá"},"sentence":["Mañana","mi papá","___","a mi hermana del colegio"],"choices":["recogió","recoge","recogerá"],"correct":"recogerá"},{"id":"conj22","scene":"🕒 AYER · 🧍 ❓","note":"Pasado","infinitive":"PREGUNTAR","forms":{"past":"preguntó","present":"pregunta","future":"preguntará"},"sentence":["Ayer","el alumno","___","una duda"],"choices":["preguntó","pregunta","preguntará"],"correct":"preguntó"},{"id":"conj23","scene":"☀️ HOY · 👩‍🏫","note":"Presente","infinitive":"RESPONDER","forms":{"past":"respondió","present":"responde","future":"responderá"},"sentence":["Hoy","la profesora","___","las preguntas"],"choices":["respondió","responde","responderá"],"correct":"responde"},{"id":"conj24","scene":"🌅 MAÑANA · 📄","note":"Futuro","infinitive":"BUSCAR","forms":{"past":"buscó","present":"busca","future":"buscará"},"sentence":["Mañana","el trabajador","___","el documento"],"choices":["buscó","busca","buscará"],"correct":"buscará"},{"id":"conj25","scene":"🕒 AYER · 🚌","note":"Pasado","infinitive":"ESPERAR","forms":{"past":"esperó","present":"espera","future":"esperará"},"sentence":["Ayer","ella","___","el bus veinte minutos"],"choices":["esperó","espera","esperará"],"correct":"esperó"},{"id":"conj26","scene":"☀️ HOY · 🤝","note":"Presente","infinitive":"AYUDAR","forms":{"past":"ayudó","present":"ayuda","future":"ayudará"},"sentence":["Hoy","mi hermano","___","a mi mamá"],"choices":["ayudó","ayuda","ayudará"],"correct":"ayuda"},{"id":"conj27","scene":"🕒 AYER · 👵","note":"Pasado","infinitive":"VISITAR","forms":{"past":"visitó","present":"visita","future":"visitará"},"sentence":["Ayer","nosotros","___","a la abuela"],"choices":["visitó","visita","visitará"],"correct":"visitó"},{"id":"conj28","scene":"☀️ HOY · 🧼","note":"Presente","infinitive":"LAVAR","forms":{"past":"lavó","present":"lava","future":"lavará"},"sentence":["Hoy","mi papá","___","los platos"],"choices":["lavó","lava","lavará"],"correct":"lava"},{"id":"conj29","scene":"🌅 MAÑANA · 💼","note":"Futuro","infinitive":"COBRAR","forms":{"past":"cobró","present":"cobra","future":"cobrará"},"sentence":["Mañana","el trabajador","___","su sueldo"],"choices":["cobró","cobra","cobrará"],"correct":"cobrará"},{"id":"conj30","scene":"🌅 MAÑANA · 🚪","note":"Futuro","infinitive":"SALIR","forms":{"past":"salió","present":"sale","future":"saldrá"},"sentence":["Mañana","ella","___","temprano de casa"],"choices":["salió","sale","saldrá"],"correct":"saldrá"}],"3":[{"id":"link01","scene":"👧 📚 ➕ ✍️","note":"Dos acciones","left":"La niña estudia","right":"hace su tarea","choices":["y","pero","porque"],"correct":"y"},{"id":"link02","scene":"👦 😴 ⚠️ 🏫","note":"Contraste","left":"El niño tiene sueño","right":"va al colegio","choices":["y","pero","porque"],"correct":"pero"},{"id":"link03","scene":"👩 💧 💭 😓","note":"Causa","left":"La mujer bebe agua","right":"tiene sed","choices":["y","pero","porque"],"correct":"porque"},{"id":"link04","scene":"👨 ☔ 💭 🌧️","note":"Causa","left":"El hombre usa paraguas","right":"llueve","choices":["y","pero","porque"],"correct":"porque"},{"id":"link05","scene":"👵 🍞 ➕ ☕","note":"Dos cosas","left":"La abuela come pan","right":"bebe café","choices":["y","pero","porque"],"correct":"y"},{"id":"link06","scene":"👩‍🎓 🤒 ⚠️ 📚","note":"Contraste","left":"La estudiante está enferma","right":"estudia para el examen","choices":["pero","porque","entonces"],"correct":"pero"},{"id":"link07","scene":"🚌 🚫 ➡️ 🚶","note":"Consecuencia","left":"No pasa el bus","right":"voy caminando","choices":["entonces","aunque","porque"],"correct":"entonces"},{"id":"link08","scene":"🌧️ 🏠","note":"Causa","left":"Me quedo en casa","right":"está lloviendo fuerte","choices":["porque","pero","y"],"correct":"porque"},{"id":"link09","scene":"💼 ✅ ➕ 📧","note":"Secuencia","left":"Terminé el informe","right":"lo envié por correo","choices":["y","aunque","porque"],"correct":"y"},{"id":"link10","scene":"🍲 😋 ⚠️ 🌶️","note":"Contraste","left":"La comida está rica","right":"está muy picante","choices":["pero","porque","entonces"],"correct":"pero"},{"id":"link11","scene":"📱 🔋0 ➡️ 🔌","note":"Consecuencia","left":"Mi celular no tiene batería","right":"voy a cargarlo","choices":["por eso","aunque","y"],"correct":"por eso"},{"id":"link12","scene":"⏰ 🚌","note":"Condición","left":"Salgo temprano","right":"quiero llegar a tiempo","choices":["porque","pero","aunque"],"correct":"porque"},{"id":"link13","scene":"🏫 🔔 ➡️ 🚪","note":"Tiempo","left":"Los alumnos salen","right":"suena el timbre","choices":["cuando","pero","porque"],"correct":"cuando"},{"id":"link14","scene":"💰 ❌ 🛒","note":"Condición","left":"No compro eso","right":"está muy caro","choices":["porque","y","aunque"],"correct":"porque"},{"id":"link15","scene":"👨‍👩‍👧 🍽️","note":"Adición","left":"Mi mamá cocina","right":"mi papá pone la mesa","choices":["y","porque","pero"],"correct":"y"},{"id":"link16","scene":"🏠 🧹 ➕ 🍽️","note":"Adición","left":"Limpio la casa","right":"preparo la cena","choices":["y","pero","porque"],"correct":"y"},{"id":"link17","scene":"🚌 ⏰ ⚠️","note":"Contraste","left":"Salí temprano","right":"el bus demoró","choices":["pero","porque","cuando"],"correct":"pero"},{"id":"link18","scene":"🤒 🏥","note":"Causa","left":"Voy al centro de salud","right":"me siento mal","choices":["porque","y","pero"],"correct":"porque"},{"id":"link19","scene":"💰 ❌ ➡️","note":"Consecuencia","left":"No tengo suficiente dinero","right":"no compraré la mochila","choices":["por eso","aunque","y"],"correct":"por eso"},{"id":"link20","scene":"🌧️ ☔","note":"Tiempo","left":"Uso el paraguas","right":"empieza a llover","choices":["cuando","porque","pero"],"correct":"cuando"},{"id":"link21","scene":"📚 😓 ⚠️","note":"Contraste","left":"El examen es difícil","right":"voy a intentarlo","choices":["pero","porque","entonces"],"correct":"pero"},{"id":"link22","scene":"📱 🔔 ➡️","note":"Tiempo","left":"Reviso el mensaje","right":"suena mi celular","choices":["cuando","aunque","porque"],"correct":"cuando"},{"id":"link23","scene":"👩‍💼 📄 💭","note":"Causa","left":"La jefa revisa el informe","right":"necesita enviarlo hoy","choices":["porque","pero","y"],"correct":"porque"},{"id":"link24","scene":"🏪 🚪 ➡️","note":"Consecuencia","left":"La bodega está cerrada","right":"iré a otra tienda","choices":["entonces","porque","aunque"],"correct":"entonces"},{"id":"link25","scene":"🏫 🔔 ➕ 🚌","note":"Secuencia","left":"Terminan las clases","right":"tomo el bus a casa","choices":["y","pero","porque"],"correct":"y"},{"id":"link26","scene":"👨‍👩‍👧 🤝","note":"Adición","left":"Mi hermano cocina","right":"yo lavo los platos","choices":["y","porque","pero"],"correct":"y"},{"id":"link27","scene":"💼 😴 ⚠️","note":"Contraste","left":"Estoy cansado","right":"debo terminar el trabajo","choices":["pero","porque","por eso"],"correct":"pero"},{"id":"link28","scene":"🚌 🚧 ➡️","note":"Consecuencia","left":"Hay mucho tráfico","right":"llegaremos tarde","choices":["por eso","aunque","y"],"correct":"por eso"},{"id":"link29","scene":"🧾 💡","note":"Causa","left":"Pago el recibo de luz","right":"vence hoy","choices":["porque","pero","cuando"],"correct":"porque"},{"id":"link30","scene":"🍽️ 👨‍👩‍👧","note":"Tiempo","left":"Todos se sientan a la mesa","right":"la comida está lista","choices":["cuando","porque","pero"],"correct":"cuando"}],"4":[{"id":"write01","scene":"👦 💧","note":"Acción","parts":["El niño","___","agua"],"correct":"bebe","hint":"b _ b e"},{"id":"write02","scene":"👧 🍎","note":"Acción","parts":["La niña","___","una manzana"],"correct":"come","hint":"c _ m e"},{"id":"write03","scene":"👩 📖","note":"Acción","parts":["La mujer","___","un libro"],"correct":"lee","hint":"l _ e"},{"id":"write04","scene":"👨 🚌","note":"Acción","parts":["El hombre","___","el bus"],"correct":"toma","hint":"t _ m a"},{"id":"write05","scene":"👵 ☕","note":"Acción","parts":["La abuela","___","café"],"correct":"bebe","hint":"b _ b e"},{"id":"write06","scene":"🏫 📚","note":"Lugar","parts":["Yo estudio","___","el colegio"],"correct":"en","hint":"e _"},{"id":"write07","scene":"💼 ⏰","note":"Finalidad","parts":["Salgo temprano","___","llegar a tiempo"],"correct":"para","hint":"p _ r a"},{"id":"write08","scene":"🌧️ ☔","note":"Causa","parts":["Uso paraguas","___","está lloviendo"],"correct":"porque","hint":"p _ r q u e"},{"id":"write09","scene":"👩‍🎓 ✍️","note":"Artículo","parts":["La alumna hace","___","tarea"],"correct":"la","hint":"l _"},{"id":"write10","scene":"🛒 🥛","note":"Cantidad","parts":["Quiero comprar","___","leche"],"correct":"una","hint":"u _ a"},{"id":"write11","scene":"📱 👩","note":"Preposición","parts":["Voy a llamar","___","mi mamá"],"correct":"a","hint":"a"},{"id":"write12","scene":"🏠 👨‍👩‍👧","note":"Posesivo","parts":["Esta es","___","familia"],"correct":"mi","hint":"m _"},{"id":"write13","scene":"🚌 💰","note":"Sustantivo","parts":["¿Cuánto cuesta el","___","?"],"correct":"pasaje","hint":"p _ s a j e"},{"id":"write14","scene":"🏥 📅","note":"Sustantivo","parts":["Tengo una","___","con el médico"],"correct":"cita","hint":"c _ t a"},{"id":"write15","scene":"💼 📄","note":"Sustantivo","parts":["Debo terminar el","___","hoy"],"correct":"informe","hint":"i _ f o r m e"},{"id":"write16","scene":"🏫 👨‍🏫","note":"Preposición","parts":["El profesor está","___","el salón"],"correct":"en","hint":"e _"},{"id":"write17","scene":"🏠 👵","note":"Posesivo","parts":["Voy a visitar a","___","abuela"],"correct":"mi","hint":"m _"},{"id":"write18","scene":"🚌 🧍","note":"Verbo","parts":["Yo","___","el bus en la avenida"],"correct":"espero","hint":"e _ p e r o"},{"id":"write19","scene":"🛒 💰","note":"Pregunta","parts":["¿","___","cuesta esta camisa?"],"correct":"cuánto","hint":"c u _ n t o"},{"id":"write20","scene":"🏥 🤒","note":"Verbo","parts":["Me","___","la cabeza"],"correct":"duele","hint":"d _ e l e"},{"id":"write21","scene":"📱 🔌","note":"Verbo","parts":["Necesito","___","mi celular"],"correct":"cargar","hint":"c _ r g a r"},{"id":"write22","scene":"💼 📄","note":"Verbo","parts":["Voy a","___","el informe"],"correct":"terminar","hint":"t _ r m i n a r"},{"id":"write23","scene":"🏫 📝","note":"Sustantivo","parts":["Mañana tengo un","___"],"correct":"examen","hint":"e _ a m e n"},{"id":"write24","scene":"🏪 🥛","note":"Cortesía","parts":["Deme una leche,","___"],"correct":"por favor","hint":"p _ r  f _ v o r"},{"id":"write25","scene":"🚌 💵","note":"Sustantivo","parts":["Voy a pagar el","___"],"correct":"pasaje","hint":"p _ s a j e"},{"id":"write26","scene":"🏦 🪪","note":"Documento","parts":["Necesito mostrar mi","___"],"correct":"DNI","hint":"D _ I"},{"id":"write27","scene":"💡 🧾","note":"Sustantivo","parts":["Hoy vence el","___","de luz"],"correct":"recibo","hint":"r _ c i b o"},{"id":"write28","scene":"👨‍👩‍👧 🍽️","note":"Conector","parts":["Mi mamá cocina","___","mi papá pone la mesa"],"correct":"y","hint":"y"},{"id":"write29","scene":"🌧️ ☔","note":"Conector","parts":["Llevo paraguas","___","está lloviendo"],"correct":"porque","hint":"p _ r q u e"},{"id":"write30","scene":"💼 ⏰","note":"Tiempo","parts":["La reunión empieza","___","las nueve"],"correct":"a","hint":"a"}],"5":[{"id":"chat01","context":"Familia","icon":"🏠","scene":"👩‍👦 🍽️","note":"En casa","chat":[["a","Mamá: La comida está lista."],["b","Tú: ___"]],"choices":["Ya voy, mamá.","Mañana fui al colegio.","El cuaderno es grande."],"correct":"Ya voy, mamá."},{"id":"chat02","context":"Colegio","icon":"🏫","scene":"👩‍🏫 📚","note":"En clase","chat":[["a","Profesora: ¿Terminaste la tarea?"],["b","Tú: ___"]],"choices":["Sí, ya terminé la tarea.","Mi hermano trabaja mañana.","Quiero comprar pan."],"correct":"Sí, ya terminé la tarea."},{"id":"chat03","context":"Trabajo","icon":"💼","scene":"👨‍💼 🕘","note":"En el trabajo","chat":[["a","Compañero: La reunión empieza a las nueve."],["b","Tú: ___"]],"choices":["Gracias, llegaré a tiempo.","Ayer estoy cansado.","La mesa come rápido."],"correct":"Gracias, llegaré a tiempo."},{"id":"chat04","context":"Transporte","icon":"🚌","scene":"🧍 🚌","note":"En la calle","chat":[["a","Persona: ¿Este bus va al centro?"],["b","Tú: ___"]],"choices":["Sí, este bus va al centro.","La profesora bebe tarea.","Mañana ayer llegué."],"correct":"Sí, este bus va al centro."},{"id":"chat05","context":"Tienda","icon":"🛒","scene":"🧑‍💼 🛒","note":"Comprando","chat":[["a","Vendedor: ¿Qué desea comprar?"],["b","Tú: ___"]],"choices":["Quiero comprar una botella de agua.","Estoy escuela porque mesa.","Ayer comeré mañana."],"correct":"Quiero comprar una botella de agua."},{"id":"chat06","context":"Bodega","icon":"🏪","scene":"🧍 🥖","note":"Compra diaria","chat":[["a","Vendedor: Buenas tardes, ¿qué va a llevar?"],["b","Tú: ___"]],"choices":["Un pan y una botella de agua, por favor.","Mi jefe estudia la ventana.","Ayer mañana trabajo."],"correct":"Un pan y una botella de agua, por favor."},{"id":"chat07","context":"Mercado","icon":"🥕","scene":"👩 🥔","note":"Preguntar precio","chat":[["a","Tú: ¿Cuánto cuesta el kilo de papa?"],["b","Vendedora: Cuesta cuatro soles."],["a","Tú: ___"]],"choices":["Deme un kilo, por favor.","El colegio está cansado.","Mañana fui ayer."],"correct":"Deme un kilo, por favor."},{"id":"chat08","context":"Salud","icon":"🏥","scene":"🧑‍⚕️ 🤒","note":"En consulta","chat":[["a","Doctora: ¿Qué le duele?"],["b","Tú: ___"]],"choices":["Me duele la garganta.","Mi celular va al colegio.","El recibo está leyendo."],"correct":"Me duele la garganta."},{"id":"chat09","context":"Farmacia","icon":"💊","scene":"🧍 💊","note":"Comprar medicina","chat":[["a","Farmacéutico: ¿Tiene receta?"],["b","Tú: ___"]],"choices":["Sí, aquí está la receta.","La reunión come pan.","Ayer mañana llamaré."],"correct":"Sí, aquí está la receta."},{"id":"chat10","context":"Colegio","icon":"🏫","scene":"👨‍👩‍👧 👩‍🏫","note":"Hablar con profesora","chat":[["a","Profesora: Su hijo faltó ayer."],["b","Tú: ___"]],"choices":["Sí, estuvo enfermo.","Quiero pagar el pasaje.","La puerta trabaja."],"correct":"Sí, estuvo enfermo."},{"id":"chat11","context":"Trabajo","icon":"💼","scene":"📄 👨‍💼","note":"Pedir tiempo","chat":[["a","Jefe: Necesito el informe hoy."],["b","Tú: ___"]],"choices":["De acuerdo, lo terminaré esta tarde.","Mi mamá toma la oficina.","El bus escribe rápido."],"correct":"De acuerdo, lo terminaré esta tarde."},{"id":"chat12","context":"Trabajo","icon":"💼","scene":"📞 👩‍💼","note":"Avisar tardanza","chat":[["a","Compañera: ¿Ya vienes a la oficina?"],["b","Tú: ___"]],"choices":["Sí, estoy en camino. Llegaré en veinte minutos.","El mercado estudia.","Ayer mañana vine."],"correct":"Sí, estoy en camino. Llegaré en veinte minutos."},{"id":"chat13","context":"Transporte","icon":"🚌","scene":"💰 🚌","note":"Pagar pasaje","chat":[["a","Cobrador: Pasaje, por favor."],["b","Tú: ___"]],"choices":["Aquí tiene.","La tarea cuesta tarde.","Mi hermano es mañana."],"correct":"Aquí tiene."},{"id":"chat14","context":"Direcciones","icon":"🗺️","scene":"🧍 ❓","note":"Preguntar ubicación","chat":[["a","Tú: Disculpe, ¿dónde queda la farmacia?"],["b","Persona: A dos cuadras, a la derecha."],["a","Tú: ___"]],"choices":["Muchas gracias.","Quiero una tarea.","Ayer beberé."],"correct":"Muchas gracias."},{"id":"chat15","context":"Banco","icon":"🏦","scene":"🧍 🪪","note":"Atención","chat":[["a","Trabajador: Necesito su DNI, por favor."],["b","Tú: ___"]],"choices":["Claro, aquí está mi DNI.","La profesora cocina el bus.","Mañana fui ayer."],"correct":"Claro, aquí está mi DNI."},{"id":"chat16","context":"Servicios","icon":"🧾","scene":"💡 🧾","note":"Pagar recibo","chat":[["a","Tú: Quiero pagar este recibo."],["b","Trabajador: ¿Va a pagar en efectivo o con tarjeta?"],["a","Tú: ___"]],"choices":["Con tarjeta, por favor.","La ventana estudia.","Ayer mañana comeré."],"correct":"Con tarjeta, por favor."},{"id":"chat17","context":"Tecnología","icon":"📱","scene":"📱 🔋","note":"Pedir ayuda","chat":[["a","Tú: Mi celular se quedó sin batería."],["b","Amigo: Tengo un cargador."],["a","Tú: ___"]],"choices":["¿Me lo prestas, por favor?","El trabajo bebe.","Mañana ayer."],"correct":"¿Me lo prestas, por favor?"},{"id":"chat18","context":"Familia","icon":"🏠","scene":"👨‍👩‍👧 📅","note":"Coordinar","chat":[["a","Hermana: ¿A qué hora vamos a visitar a la abuela?"],["b","Tú: ___"]],"choices":["Podemos ir a las cuatro de la tarde.","El colegio paga pan.","Ayer mañana llamo."],"correct":"Podemos ir a las cuatro de la tarde."},{"id":"chat19","context":"Familia","icon":"🏠","scene":"👩‍👦 📱","note":"Avisar","chat":[["a","Mamá: ¿Dónde estás?"],["b","Tú: ___"]],"choices":["Estoy en el bus. Ya voy a casa.","La tarea está comiendo.","Mañana ayer fui."],"correct":"Estoy en el bus. Ya voy a casa."},{"id":"chat20","context":"Colegio","icon":"🏫","scene":"👩‍🏫 ✏️","note":"Pedir permiso","chat":[["a","Tú: Profesora, olvidé mi lapicero."],["b","Profesora: ¿Qué necesitas?"],["a","Tú: ___"]],"choices":["¿Puedo pedir uno prestado?","Quiero pagar el recibo.","Mi hermano cocina el bus."],"correct":"¿Puedo pedir uno prestado?"},{"id":"chat21","context":"Colegio","icon":"🏫","scene":"🧑‍🎓 ❓","note":"Pedir explicación","chat":[["a","Profesora: ¿Entendiste la actividad?"],["b","Tú: ___"]],"choices":["No del todo. ¿Puede explicarlo otra vez?","La bodega está enferma.","Ayer mañana escribiré."],"correct":"No del todo. ¿Puede explicarlo otra vez?"},{"id":"chat22","context":"Trabajo","icon":"💼","scene":"📄 ⏰","note":"Pedir plazo","chat":[["a","Jefe: ¿Puedes entregar el informe hoy?"],["b","Tú: ___"]],"choices":["Necesito un poco más de tiempo. ¿Puedo entregarlo mañana?","Mi mamá va al cuaderno.","La silla trabaja rápido."],"correct":"Necesito un poco más de tiempo. ¿Puedo entregarlo mañana?"},{"id":"chat23","context":"Trabajo","icon":"💼","scene":"🤝 👩‍💼","note":"Coordinar","chat":[["a","Compañera: ¿Revisamos el documento juntos?"],["b","Tú: ___"]],"choices":["Sí, revisémoslo después del almuerzo.","El pasaje bebe café.","Mañana fui ayer."],"correct":"Sí, revisémoslo después del almuerzo."},{"id":"chat24","context":"Mercado","icon":"🥕","scene":"🥔 💰","note":"Negociar cantidad","chat":[["a","Vendedora: El kilo de papa cuesta cuatro soles."],["b","Tú: ___"]],"choices":["Deme dos kilos, por favor.","La profesora toma la ventana.","Ayer mañana."],"correct":"Deme dos kilos, por favor."},{"id":"chat25","context":"Bodega","icon":"🏪","scene":"🥛 💵","note":"Comprar","chat":[["a","Tú: ¿Tiene leche evaporada?"],["b","Vendedor: Sí, cuesta cinco soles."],["a","Tú: ___"]],"choices":["Deme una, por favor.","El informe está triste.","Mañana beberé ayer."],"correct":"Deme una, por favor."},{"id":"chat26","context":"Salud","icon":"🏥","scene":"📅 🧑‍⚕️","note":"Sacar cita","chat":[["a","Recepcionista: ¿Para qué especialidad necesita cita?"],["b","Tú: ___"]],"choices":["Necesito una cita con medicina general.","Quiero tomar el bus al colegio.","La mesa escribe."],"correct":"Necesito una cita con medicina general."},{"id":"chat27","context":"Transporte","icon":"🚌","scene":"🧍‍♂️ 🗺️","note":"Bajar del bus","chat":[["a","Tú: Disculpe, ¿me avisa cuando lleguemos a la avenida Arequipa?"],["b","Cobrador: Sí, yo le aviso."],["a","Tú: ___"]],"choices":["Muchas gracias.","Quiero comprar un examen.","Mi trabajo bebe."],"correct":"Muchas gracias."},{"id":"chat28","context":"Municipalidad","icon":"🏛️","scene":"🪪 📄","note":"Trámite","chat":[["a","Trabajadora: ¿Qué trámite desea realizar?"],["b","Tú: ___"]],"choices":["Quiero presentar esta solicitud.","El bus está estudiando.","Ayer mañana trabajo."],"correct":"Quiero presentar esta solicitud."},{"id":"chat29","context":"Banco","icon":"🏦","scene":"💳 🔐","note":"Problema con tarjeta","chat":[["a","Trabajador: ¿Cuál es el problema con su tarjeta?"],["b","Tú: ___"]],"choices":["Mi tarjeta no funciona y necesito revisarla.","La profesora cocina recibos.","Mañana ayer."],"correct":"Mi tarjeta no funciona y necesito revisarla."},{"id":"chat30","context":"Tecnología","icon":"📱","scene":"📶 ❌","note":"Internet","chat":[["a","Tú: No tengo internet en casa."],["b","Soporte: ¿Ya reinició el módem?"],["a","Tú: ___"]],"choices":["Sí, lo reinicié, pero todavía no funciona.","La tarea viaja en bus.","Ayer mañana pagaré."],"correct":"Sí, lo reinicié, pero todavía no funciona."}],"6":[{"id":"adv01","scene":"🏫 📚 ⏰","note":"Colegio","cards":[{"t":"Mañana","r":"time"},{"t":"yo","r":"who"},{"t":"entregaré","r":"action"},{"t":"la tarea","r":"what"},{"t":"en el colegio","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Mañana","yo","entregaré","la tarea","en el colegio"]},{"id":"adv02","scene":"🏠 🍽️ 👨‍👩‍👧","note":"Familia","cards":[{"t":"Esta noche","r":"time"},{"t":"mi familia","r":"who"},{"t":"cenará","r":"action"},{"t":"junta","r":"what"},{"t":"en casa","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Esta noche","mi familia","cenará","junta","en casa"]},{"id":"adv03","scene":"💼 📞 ⏰","note":"Trabajo","cards":[{"t":"Hoy","r":"time"},{"t":"mi jefe","r":"who"},{"t":"me llamó","r":"action"},{"t":"porque","r":"connector"},{"t":"necesita un informe","r":"what"}],"roles":["time","who","action","connector","what"],"answer":["Hoy","mi jefe","me llamó","porque","necesita un informe"]},{"id":"adv04","scene":"🏫 😴 📖","note":"Colegio","cards":[{"t":"Estoy cansado","r":"who"},{"t":"pero","r":"connector"},{"t":"voy a estudiar","r":"action"},{"t":"para el examen","r":"what"}],"roles":["who","connector","action","what"],"answer":["Estoy cansado","pero","voy a estudiar","para el examen"]},{"id":"adv05","scene":"🏠 🌧️ 🚌","note":"Vida diaria","cards":[{"t":"Como está lloviendo","r":"time"},{"t":"voy a esperar","r":"action"},{"t":"el bus","r":"what"},{"t":"dentro de la casa","r":"what"}],"roles":["time","action","what","what"],"answer":["Como está lloviendo","voy a esperar","el bus","dentro de la casa"]},{"id":"adv06","scene":"💼 🕘 🚌","note":"Trabajo","cards":[{"t":"Hoy","r":"time"},{"t":"salí temprano","r":"action"},{"t":"porque","r":"connector"},{"t":"tenía una reunión","r":"what"},{"t":"a las nueve","r":"what"}],"roles":["time","action","connector","what","what"],"answer":["Hoy","salí temprano","porque","tenía una reunión","a las nueve"]},{"id":"adv07","scene":"🏫 📄 ✅","note":"Colegio","cards":[{"t":"Después de clases","r":"time"},{"t":"la estudiante","r":"who"},{"t":"terminó","r":"action"},{"t":"su tarea","r":"what"},{"t":"en la biblioteca","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Después de clases","la estudiante","terminó","su tarea","en la biblioteca"]},{"id":"adv08","scene":"🏠 👵 📞","note":"Familia","cards":[{"t":"Anoche","r":"time"},{"t":"mi mamá","r":"who"},{"t":"llamó","r":"action"},{"t":"a mi abuela","r":"what"},{"t":"para saber cómo estaba","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Anoche","mi mamá","llamó","a mi abuela","para saber cómo estaba"]},{"id":"adv09","scene":"🛒 💰 ⚠️","note":"Compras","cards":[{"t":"Quería comprar la camisa","r":"who"},{"t":"pero","r":"connector"},{"t":"no la compré","r":"action"},{"t":"porque","r":"connector"},{"t":"estaba muy cara","r":"what"}],"roles":["who","connector","action","connector","what"],"answer":["Quería comprar la camisa","pero","no la compré","porque","estaba muy cara"]},{"id":"adv10","scene":"🏥 📅 🕒","note":"Salud","cards":[{"t":"Mañana","r":"time"},{"t":"tengo","r":"action"},{"t":"una cita médica","r":"what"},{"t":"a las tres de la tarde","r":"what"}],"roles":["time","action","what","what"],"answer":["Mañana","tengo","una cita médica","a las tres de la tarde"]},{"id":"adv11","scene":"📱 🔋 🔌","note":"Tecnología","cards":[{"t":"Mi celular","r":"who"},{"t":"se apagó","r":"action"},{"t":"porque","r":"connector"},{"t":"no tenía batería","r":"what"}],"roles":["who","action","connector","what"],"answer":["Mi celular","se apagó","porque","no tenía batería"]},{"id":"adv12","scene":"🚌 ⏰ 🏫","note":"Transporte","cards":[{"t":"El bus llegó tarde","r":"who"},{"t":"por eso","r":"connector"},{"t":"entré","r":"action"},{"t":"después de la hora","r":"what"},{"t":"al colegio","r":"what"}],"roles":["who","connector","action","what","what"],"answer":["El bus llegó tarde","por eso","entré","después de la hora","al colegio"]},{"id":"adv13","scene":"💼 📧 📄","note":"Trabajo","cards":[{"t":"Cuando terminé el informe","r":"time"},{"t":"lo envié","r":"action"},{"t":"por correo","r":"what"},{"t":"a mi jefe","r":"what"}],"roles":["time","action","what","what"],"answer":["Cuando terminé el informe","lo envié","por correo","a mi jefe"]},{"id":"adv14","scene":"🏠 🍲 🤝","note":"Familia","cards":[{"t":"Mi hermano","r":"who"},{"t":"lavó los platos","r":"action"},{"t":"mientras","r":"connector"},{"t":"yo limpiaba la mesa","r":"what"}],"roles":["who","action","connector","what"],"answer":["Mi hermano","lavó los platos","mientras","yo limpiaba la mesa"]},{"id":"adv15","scene":"🏪 🥛 🥖","note":"Compra diaria","cards":[{"t":"Antes de regresar a casa","r":"time"},{"t":"pasé","r":"action"},{"t":"por la bodega","r":"what"},{"t":"para comprar pan y leche","r":"what"}],"roles":["time","action","what","what"],"answer":["Antes de regresar a casa","pasé","por la bodega","para comprar pan y leche"]},{"id":"adv16","scene":"🏫 📝 ⏰","note":"Colegio","cards":[{"t":"Antes de empezar el examen","r":"time"},{"t":"la profesora","r":"who"},{"t":"explicó","r":"action"},{"t":"las instrucciones","r":"what"},{"t":"a todo el salón","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Antes de empezar el examen","la profesora","explicó","las instrucciones","a todo el salón"]},{"id":"adv17","scene":"💼 🚌 ⏰","note":"Trabajo","cards":[{"t":"Como había mucho tráfico","r":"time"},{"t":"llegué","r":"action"},{"t":"diez minutos tarde","r":"what"},{"t":"a la oficina","r":"what"}],"roles":["time","action","what","what"],"answer":["Como había mucho tráfico","llegué","diez minutos tarde","a la oficina"]},{"id":"adv18","scene":"🏠 👵 💊","note":"Familia","cards":[{"t":"Después del almuerzo","r":"time"},{"t":"mi abuela","r":"who"},{"t":"tomó","r":"action"},{"t":"su medicina","r":"what"},{"t":"con un vaso de agua","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Después del almuerzo","mi abuela","tomó","su medicina","con un vaso de agua"]},{"id":"adv19","scene":"🛒 💰 🤔","note":"Compras","cards":[{"t":"Aunque la mochila me gustó","r":"time"},{"t":"no la compré","r":"action"},{"t":"porque","r":"connector"},{"t":"costaba demasiado","r":"what"}],"roles":["time","action","connector","what"],"answer":["Aunque la mochila me gustó","no la compré","porque","costaba demasiado"]},{"id":"adv20","scene":"🏥 📅 📱","note":"Salud","cards":[{"t":"Esta mañana","r":"time"},{"t":"llamé","r":"action"},{"t":"al centro de salud","r":"what"},{"t":"para cambiar mi cita","r":"what"}],"roles":["time","action","what","what"],"answer":["Esta mañana","llamé","al centro de salud","para cambiar mi cita"]},{"id":"adv21","scene":"📱 💬 👩","note":"Familia","cards":[{"t":"Cuando llegué al trabajo","r":"time"},{"t":"envié","r":"action"},{"t":"un mensaje","r":"what"},{"t":"a mi mamá","r":"what"},{"t":"para avisarle","r":"what"}],"roles":["time","action","what","what","what"],"answer":["Cuando llegué al trabajo","envié","un mensaje","a mi mamá","para avisarle"]},{"id":"adv22","scene":"🏦 🪪 📄","note":"Banco","cards":[{"t":"Para hacer el trámite","r":"time"},{"t":"debo presentar","r":"action"},{"t":"mi DNI","r":"what"},{"t":"y","r":"connector"},{"t":"una copia del recibo","r":"what"}],"roles":["time","action","what","connector","what"],"answer":["Para hacer el trámite","debo presentar","mi DNI","y","una copia del recibo"]},{"id":"adv23","scene":"🏫 🚌 🌧️","note":"Colegio","cards":[{"t":"Como estaba lloviendo","r":"time"},{"t":"mi papá","r":"who"},{"t":"me recogió","r":"action"},{"t":"del colegio","r":"what"},{"t":"en taxi","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Como estaba lloviendo","mi papá","me recogió","del colegio","en taxi"]},{"id":"adv24","scene":"💼 📄 🤝","note":"Trabajo","cards":[{"t":"Después de revisar el informe","r":"time"},{"t":"mi jefa","r":"who"},{"t":"me pidió","r":"action"},{"t":"que corrigiera dos partes","r":"what"}],"roles":["time","who","action","what"],"answer":["Después de revisar el informe","mi jefa","me pidió","que corrigiera dos partes"]},{"id":"adv25","scene":"🏪 🥖 🥛","note":"Vida diaria","cards":[{"t":"Antes de volver a casa","r":"time"},{"t":"compré","r":"action"},{"t":"pan y leche","r":"what"},{"t":"en la bodega de la esquina","r":"what"}],"roles":["time","action","what","what"],"answer":["Antes de volver a casa","compré","pan y leche","en la bodega de la esquina"]},{"id":"adv26","scene":"🚌 💵 🚏","note":"Transporte","cards":[{"t":"Cuando subí al bus","r":"time"},{"t":"pagué","r":"action"},{"t":"el pasaje","r":"what"},{"t":"y","r":"connector"},{"t":"busqué un asiento","r":"what"}],"roles":["time","action","what","connector","what"],"answer":["Cuando subí al bus","pagué","el pasaje","y","busqué un asiento"]},{"id":"adv27","scene":"👨‍👩‍👧 🍽️ 💬","note":"Familia","cards":[{"t":"Mientras cenábamos","r":"time"},{"t":"mi hermano","r":"who"},{"t":"contó","r":"action"},{"t":"lo que pasó","r":"what"},{"t":"en su trabajo","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Mientras cenábamos","mi hermano","contó","lo que pasó","en su trabajo"]},{"id":"adv28","scene":"🏛️ 📄 ⏳","note":"Trámite","cards":[{"t":"Como faltaba un documento","r":"time"},{"t":"no pude terminar","r":"action"},{"t":"el trámite","r":"what"},{"t":"ese mismo día","r":"what"}],"roles":["time","action","what","what"],"answer":["Como faltaba un documento","no pude terminar","el trámite","ese mismo día"]},{"id":"adv29","scene":"📱 🔋 ⚠️","note":"Tecnología","cards":[{"t":"Mi celular tenía poca batería","r":"who"},{"t":"así que","r":"connector"},{"t":"lo puse a cargar","r":"action"},{"t":"antes de salir","r":"what"}],"roles":["who","connector","action","what"],"answer":["Mi celular tenía poca batería","así que","lo puse a cargar","antes de salir"]},{"id":"adv30","scene":"💼 🕕 🚪","note":"Trabajo","cards":[{"t":"Cuando terminé todas mis tareas","r":"time"},{"t":"guardé","r":"action"},{"t":"mis cosas","r":"what"},{"t":"y","r":"connector"},{"t":"salí de la oficina","r":"what"}],"roles":["time","action","what","connector","what"],"answer":["Cuando terminé todas mis tareas","guardé","mis cosas","y","salí de la oficina"]}]};
    const DATA_EXTRA_ORACIONES = {"1":[{"id":"ord31","scene":"👩‍🎓 📖","note":"Biblioteca","cards":[{"t":"La estudiante","r":"who"},{"t":"abre","r":"action"},{"t":"su libro","r":"what"}],"roles":["who","action","what"],"answer":["La estudiante","abre","su libro"]},{"id":"ord32","scene":"👦 📱","note":"Amigos","cards":[{"t":"Mi amigo","r":"who"},{"t":"envía","r":"action"},{"t":"un mensaje","r":"what"}],"roles":["who","action","what"],"answer":["Mi amigo","envía","un mensaje"]},{"id":"ord33","scene":"👩 🧺","note":"Casa","cards":[{"t":"Mi mamá","r":"who"},{"t":"lava","r":"action"},{"t":"la ropa","r":"what"}],"roles":["who","action","what"],"answer":["Mi mamá","lava","la ropa"]},{"id":"ord34","scene":"👨 💊","note":"Salud","cards":[{"t":"Mi papá","r":"who"},{"t":"compra","r":"action"},{"t":"la medicina","r":"what"}],"roles":["who","action","what"],"answer":["Mi papá","compra","la medicina"]},{"id":"ord35","scene":"🧑 🧹","note":"Barrio","cards":[{"t":"El vecino","r":"who"},{"t":"barre","r":"action"},{"t":"la vereda","r":"what"}],"roles":["who","action","what"],"answer":["El vecino","barre","la vereda"]},{"id":"ord36","scene":"👩‍💼 🖨️","note":"Trabajo","cards":[{"t":"La trabajadora","r":"who"},{"t":"imprime","r":"action"},{"t":"el documento","r":"what"}],"roles":["who","action","what"],"answer":["La trabajadora","imprime","el documento"]},{"id":"ord37","scene":"🧑‍🎓 🙋","note":"Colegio","cards":[{"t":"El alumno","r":"who"},{"t":"hace","r":"action"},{"t":"una pregunta","r":"what"}],"roles":["who","action","what"],"answer":["El alumno","hace","una pregunta"]},{"id":"ord38","scene":"👩 📱🔌","note":"Tecnología","cards":[{"t":"La joven","r":"who"},{"t":"carga","r":"action"},{"t":"su celular","r":"what"}],"roles":["who","action","what"],"answer":["La joven","carga","su celular"]},{"id":"ord39","scene":"👴 📺","note":"Casa","cards":[{"t":"El abuelo","r":"who"},{"t":"mira","r":"action"},{"t":"las noticias","r":"what"}],"roles":["who","action","what"],"answer":["El abuelo","mira","las noticias"]},{"id":"ord40","scene":"👥 🔗","note":"Redes","cards":[{"t":"Mis amigos","r":"who"},{"t":"comparten","r":"action"},{"t":"un enlace","r":"what"}],"roles":["who","action","what"],"answer":["Mis amigos","comparten","un enlace"]},{"id":"ord41","scene":"🧑‍💼 💵","note":"Compras","cards":[{"t":"El cajero","r":"who"},{"t":"entrega","r":"action"},{"t":"el vuelto","r":"what"}],"roles":["who","action","what"],"answer":["El cajero","entrega","el vuelto"]},{"id":"ord42","scene":"🧍 🚌","note":"Transporte","cards":[{"t":"El pasajero","r":"who"},{"t":"baja","r":"action"},{"t":"del bus","r":"what"}],"roles":["who","action","what"],"answer":["El pasajero","baja","del bus"]},{"id":"ord43","scene":"👩‍⚕️ 🌡️","note":"Salud","cards":[{"t":"La enfermera","r":"who"},{"t":"mide","r":"action"},{"t":"la temperatura","r":"what"}],"roles":["who","action","what"],"answer":["La enfermera","mide","la temperatura"]},{"id":"ord44","scene":"👨‍🍳 🍲","note":"Trabajo","cards":[{"t":"El cocinero","r":"who"},{"t":"sirve","r":"action"},{"t":"la sopa","r":"what"}],"roles":["who","action","what"],"answer":["El cocinero","sirve","la sopa"]},{"id":"ord45","scene":"👧 🚪","note":"Casa","cards":[{"t":"La niña","r":"who"},{"t":"cierra","r":"action"},{"t":"la puerta","r":"what"}],"roles":["who","action","what"],"answer":["La niña","cierra","la puerta"]},{"id":"ord46","scene":"🧑 📩","note":"Tecnología","cards":[{"t":"La persona","r":"who"},{"t":"lee","r":"action"},{"t":"el mensaje","r":"what"}],"roles":["who","action","what"],"answer":["La persona","lee","el mensaje"]},{"id":"ord47","scene":"👩‍🏫 📚","note":"Colegio","cards":[{"t":"La profesora","r":"who"},{"t":"envía","r":"action"},{"t":"la tarea","r":"what"}],"roles":["who","action","what"],"answer":["La profesora","envía","la tarea"]},{"id":"ord48","scene":"👨‍👩‍👧 🌳","note":"Familia","cards":[{"t":"La familia","r":"who"},{"t":"visita","r":"action"},{"t":"el parque","r":"what"}],"roles":["who","action","what"],"answer":["La familia","visita","el parque"]},{"id":"ord49","scene":"🧍‍♀️ 🎫","note":"Trámite","cards":[{"t":"La usuaria","r":"who"},{"t":"espera","r":"action"},{"t":"su turno","r":"what"}],"roles":["who","action","what"],"answer":["La usuaria","espera","su turno"]},{"id":"ord50","scene":"🧍‍♂️ 📝","note":"Trámite","cards":[{"t":"El ciudadano","r":"who"},{"t":"firma","r":"action"},{"t":"el formulario","r":"what"}],"roles":["who","action","what"],"answer":["El ciudadano","firma","el formulario"]}],"2":[{"id":"conj31","scene":"🕒 AYER · ✍️","note":"Pasado","infinitive":"ESCRIBIR","forms":{"past":"escribió","present":"escribe","future":"escribirá"},"sentence":["Ayer","mi amiga","___","un mensaje"],"choices":["escribió","escribe","escribirá"],"correct":"escribió"},{"id":"conj32","scene":"☀️ HOY · 💬","note":"Presente","infinitive":"CONVERSAR","forms":{"past":"conversó","present":"conversa","future":"conversará"},"sentence":["Hoy","mi hermano","___","con sus amigos"],"choices":["conversó","conversa","conversará"],"correct":"conversa"},{"id":"conj33","scene":"🌅 MAÑANA · 💬","note":"Futuro","infinitive":"RESPONDER","forms":{"past":"respondió","present":"responde","future":"responderá"},"sentence":["Mañana","ella","___","los mensajes"],"choices":["respondió","responde","responderá"],"correct":"responderá"},{"id":"conj34","scene":"🕒 AYER · 📩","note":"Pasado","infinitive":"RECIBIR","forms":{"past":"recibió","present":"recibe","future":"recibirá"},"sentence":["Ayer","mi mamá","___","un correo"],"choices":["recibió","recibe","recibirá"],"correct":"recibió"},{"id":"conj35","scene":"☀️ HOY · 🍲","note":"Presente","infinitive":"PREPARAR","forms":{"past":"preparó","present":"prepara","future":"preparará"},"sentence":["Hoy","mi papá","___","la cena"],"choices":["preparó","prepara","preparará"],"correct":"prepara"},{"id":"conj36","scene":"🌅 MAÑANA · 🚪","note":"Futuro","infinitive":"SALIR","forms":{"past":"salió","present":"sale","future":"saldrá"},"sentence":["Mañana","mi amiga","___","temprano"],"choices":["salió","sale","saldrá"],"correct":"saldrá"},{"id":"conj37","scene":"🕒 AYER · 🏠","note":"Pasado","infinitive":"VOLVER","forms":{"past":"volvió","present":"vuelve","future":"volverá"},"sentence":["Ayer","mi hermano","___","a casa"],"choices":["volvió","vuelve","volverá"],"correct":"volvió"},{"id":"conj38","scene":"☀️ HOY · 💻","note":"Presente","infinitive":"USAR","forms":{"past":"usó","present":"usa","future":"usará"},"sentence":["Hoy","la estudiante","___","la computadora"],"choices":["usó","usa","usará"],"correct":"usa"},{"id":"conj39","scene":"🌅 MAÑANA · 📄","note":"Futuro","infinitive":"REVISAR","forms":{"past":"revisó","present":"revisa","future":"revisará"},"sentence":["Mañana","mi jefa","___","el informe"],"choices":["revisó","revisa","revisará"],"correct":"revisará"},{"id":"conj40","scene":"🕒 AYER · 🔗","note":"Pasado","infinitive":"COMPARTIR","forms":{"past":"compartió","present":"comparte","future":"compartirá"},"sentence":["Ayer","mi amigo","___","un enlace"],"choices":["compartió","comparte","compartirá"],"correct":"compartió"},{"id":"conj41","scene":"☀️ HOY · 📱","note":"Presente","infinitive":"ENVIAR","forms":{"past":"envió","present":"envía","future":"enviará"},"sentence":["Hoy","la profesora","___","un aviso"],"choices":["envió","envía","enviará"],"correct":"envía"},{"id":"conj42","scene":"🌅 MAÑANA · 📞","note":"Futuro","infinitive":"LLAMAR","forms":{"past":"llamó","present":"llama","future":"llamará"},"sentence":["Mañana","mi tía","___","a mi mamá"],"choices":["llamó","llama","llamará"],"correct":"llamará"},{"id":"conj43","scene":"🕒 AYER · 🏫","note":"Pasado","infinitive":"ASISTIR","forms":{"past":"asistió","present":"asiste","future":"asistirá"},"sentence":["Ayer","el alumno","___","a clases"],"choices":["asistió","asiste","asistirá"],"correct":"asistió"},{"id":"conj44","scene":"☀️ HOY · 📝","note":"Presente","infinitive":"FIRMAR","forms":{"past":"firmó","present":"firma","future":"firmará"},"sentence":["Hoy","el ciudadano","___","el formulario"],"choices":["firmó","firma","firmará"],"correct":"firma"},{"id":"conj45","scene":"🌅 MAÑANA · 🍛","note":"Futuro","infinitive":"COCINAR","forms":{"past":"cocinó","present":"cocina","future":"cocinará"},"sentence":["Mañana","mi hermana","___","el almuerzo"],"choices":["cocinó","cocina","cocinará"],"correct":"cocinará"},{"id":"conj46","scene":"🕒 AYER · 🧹","note":"Pasado","infinitive":"ORDENAR","forms":{"past":"ordenó","present":"ordena","future":"ordenará"},"sentence":["Ayer","mi papá","___","la sala"],"choices":["ordenó","ordena","ordenará"],"correct":"ordenó"},{"id":"conj47","scene":"☀️ HOY · 😴","note":"Presente","infinitive":"DESCANSAR","forms":{"past":"descansó","present":"descansa","future":"descansará"},"sentence":["Hoy","mi abuelo","___","en casa"],"choices":["descansó","descansa","descansará"],"correct":"descansa"},{"id":"conj48","scene":"🌅 MAÑANA · 🖨️","note":"Futuro","infinitive":"IMPRIMIR","forms":{"past":"imprimió","present":"imprime","future":"imprimirá"},"sentence":["Mañana","la trabajadora","___","el documento"],"choices":["imprimió","imprime","imprimirá"],"correct":"imprimirá"},{"id":"conj49","scene":"🕒 AYER · 🎒","note":"Pasado","infinitive":"RECOGER","forms":{"past":"recogió","present":"recoge","future":"recogerá"},"sentence":["Ayer","mi mamá","___","a mi hermano"],"choices":["recogió","recoge","recogerá"],"correct":"recogió"},{"id":"conj50","scene":"☀️ HOY · 📚","note":"Presente","infinitive":"APRENDER","forms":{"past":"aprendió","present":"aprende","future":"aprenderá"},"sentence":["Hoy","la niña","___","palabras nuevas"],"choices":["aprendió","aprende","aprenderá"],"correct":"aprende"}],"3":[{"id":"link31","scene":"📱 💬 ✅","note":"Secuencia","left":"Vi el mensaje","right":"respondí de inmediato","choices":["y","pero","porque"],"correct":"y"},{"id":"link32","scene":"👥 🌳 ⚠️ 📚","note":"Contraste","left":"Quiero salir con mis amigos","right":"debo terminar la tarea","choices":["pero","porque","entonces"],"correct":"pero"},{"id":"link33","scene":"🤒 🚫 💼","note":"Causa","left":"No fui a la reunión","right":"estaba enfermo","choices":["porque","y","aunque"],"correct":"porque"},{"id":"link34","scene":"📶 ❌ 📱","note":"Consecuencia","left":"Se acabó el internet","right":"usaré mis datos móviles","choices":["por eso","pero","porque"],"correct":"por eso"},{"id":"link35","scene":"📸 💬","note":"Tiempo","left":"Mi amiga publica una foto","right":"le dejo un comentario","choices":["cuando","aunque","porque"],"correct":"cuando"},{"id":"link36","scene":"😴 📚","note":"Concesión","left":"Estoy cansado","right":"seguiré practicando","choices":["aunque","porque","entonces"],"correct":"aunque"},{"id":"link37","scene":"👨‍🍳 🍽️","note":"Simultáneo","left":"Mi hermano cocina","right":"yo pongo la mesa","choices":["mientras","porque","pero"],"correct":"mientras"},{"id":"link38","scene":"🚌 ⏰","note":"Consecuencia","left":"El bus tardó mucho","right":"llegué tarde","choices":["por eso","aunque","y"],"correct":"por eso"},{"id":"link39","scene":"💳 ❌ 🛒","note":"Causa","left":"No pude pagar","right":"mi tarjeta no funcionó","choices":["porque","pero","cuando"],"correct":"porque"},{"id":"link40","scene":"🏫 🔔 🚪","note":"Tiempo","left":"Suena el timbre","right":"los estudiantes salen del salón","choices":["cuando","porque","aunque"],"correct":"cuando"},{"id":"link41","scene":"📱 🔋 ⚠️","note":"Contraste","left":"Mi celular tiene poca batería","right":"todavía puedo enviar el mensaje","choices":["pero","porque","entonces"],"correct":"pero"},{"id":"link42","scene":"👩‍🏫 📄 ➕","note":"Adición","left":"La profesora explicó la tarea","right":"envió un ejemplo al grupo","choices":["y","aunque","porque"],"correct":"y"},{"id":"link43","scene":"🌧️ ☔","note":"Causa","left":"Llevo paraguas","right":"el cielo está muy oscuro","choices":["porque","pero","entonces"],"correct":"porque"},{"id":"link44","scene":"🛒 💰 ⚠️","note":"Contraste","left":"La mochila me gusta","right":"cuesta demasiado","choices":["pero","porque","cuando"],"correct":"pero"},{"id":"link45","scene":"🏥 📅 ➡️","note":"Consecuencia","left":"Cambió mi horario","right":"pediré otra cita","choices":["por eso","y","aunque"],"correct":"por eso"},{"id":"link46","scene":"💬 👥","note":"Tiempo","left":"Mis amigos escriben en el grupo","right":"reviso los mensajes","choices":["cuando","pero","porque"],"correct":"cuando"},{"id":"link47","scene":"📄 ✅ ➕ 📧","note":"Secuencia","left":"Terminé el formulario","right":"lo envié por correo","choices":["y","pero","porque"],"correct":"y"},{"id":"link48","scene":"🏠 🧹 👨‍👩‍👧","note":"Simultáneo","left":"Yo limpio la sala","right":"mi hermana ordena el cuarto","choices":["mientras","porque","pero"],"correct":"mientras"},{"id":"link49","scene":"🚌 🚫 🚶","note":"Consecuencia","left":"No encontré transporte","right":"me fui caminando","choices":["entonces","aunque","porque"],"correct":"entonces"},{"id":"link50","scene":"📱 🔔 😴","note":"Concesión","left":"Era tarde","right":"respondí el mensaje importante","choices":["aunque","porque","y"],"correct":"aunque"}],"4":[{"id":"write31","scene":"📱 💬","note":"Verbo","parts":["Mi amiga me","___","un mensaje"],"correct":"envió","hint":"e _ v i ó"},{"id":"write32","scene":"💬 📩","note":"Artículo","parts":["Respondo","___","mensaje"],"correct":"el","hint":"e _"},{"id":"write33","scene":"🏫 🚶","note":"Preposición","parts":["Voy","___","colegio"],"correct":"al","hint":"a _"},{"id":"write34","scene":"📸 🌐","note":"Sustantivo","parts":["Ella publicó una","___"],"correct":"foto","hint":"f _ t o"},{"id":"write35","scene":"📝 🤝","note":"Verbo","parts":["Necesito","___","el formulario"],"correct":"firmar","hint":"f _ r m a r"},{"id":"write36","scene":"🚌 🕗","note":"Preposición","parts":["El bus llega","___","las ocho"],"correct":"a","hint":"a"},{"id":"write37","scene":"🥖 🥛","note":"Conector","parts":["Compré pan","___","leche"],"correct":"y","hint":"y"},{"id":"write38","scene":"🌧️ 🏠","note":"Conector","parts":["No salgo","___","llueve"],"correct":"porque","hint":"p _ r q u e"},{"id":"write39","scene":"📚 🏠","note":"Verbo","parts":["Mi hermano","___","en casa"],"correct":"estudia","hint":"e _ t u d i a"},{"id":"write40","scene":"🏥 📅","note":"Artículo","parts":["Tengo","___","cita mañana"],"correct":"una","hint":"u _ a"},{"id":"write41","scene":"💻 📄","note":"Verbo","parts":["Voy a","___","el archivo"],"correct":"abrir","hint":"a _ r i r"},{"id":"write42","scene":"👥 💬","note":"Sustantivo","parts":["Escribimos en el","___","del grupo"],"correct":"chat","hint":"c _ a t"},{"id":"write43","scene":"📱 🔋","note":"Sustantivo","parts":["Mi celular tiene poca","___"],"correct":"batería","hint":"b _ t e r í a"},{"id":"write44","scene":"🛒 💵","note":"Verbo","parts":["Quiero","___","con tarjeta"],"correct":"pagar","hint":"p _ g a r"},{"id":"write45","scene":"🚌 🚏","note":"Sustantivo","parts":["Espero en el","___"],"correct":"paradero","hint":"p _ r a d e r o"},{"id":"write46","scene":"🏫 ✍️","note":"Verbo","parts":["La alumna","___","la respuesta"],"correct":"escribe","hint":"e _ c r i b e"},{"id":"write47","scene":"📩 👩","note":"Preposición","parts":["Envié el archivo","___","mi amiga"],"correct":"a","hint":"a"},{"id":"write48","scene":"👨‍👩‍👧 🍽️","note":"Adverbio","parts":["Hoy cenamos","___"],"correct":"juntos","hint":"j _ n t o s"},{"id":"write49","scene":"🏦 🪪","note":"Posesivo","parts":["Presento","___","DNI"],"correct":"mi","hint":"m _"},{"id":"write50","scene":"🌐 🔗","note":"Sustantivo","parts":["Comparte el","___","del video"],"correct":"enlace","hint":"e _ l a c e"}],"5":[{"id":"chat31","context":"Amigos","icon":"👥","scene":"👥 🌳","note":"Plan con amigos","chat":[["a","Amigo: ¿Vienes al parque esta tarde?"],["b","Tú: ___"]],"choices":["Sí, llego a las cinco.","La mesa escribe rápido.","Ayer mañana fui."],"correct":"Sí, llego a las cinco."},{"id":"chat32","context":"Grupo de amigos","icon":"💬","scene":"👥 💬","note":"Coordinar por chat","chat":[["a","Amiga: ¿A qué hora nos encontramos?"],["b","Tú: ___"]],"choices":["A las seis, frente a la entrada.","El cuaderno toma el bus.","Mañana ayer."],"correct":"A las seis, frente a la entrada."},{"id":"chat33","context":"Amigos","icon":"📸","scene":"👭 📸","note":"Comentar una foto","chat":[["a","Amiga: Te envié una foto, ¿te gusta?"],["b","Tú: ___"]],"choices":["Sí, está muy bonita.","Quiero pagar una tarea.","La ventana estudia."],"correct":"Sí, está muy bonita."},{"id":"chat34","context":"Red social","icon":"🌐","scene":"📱 💬","note":"Responder comentario","chat":[["a","Amigo: Vi tu publicación. ¡Qué buena noticia!"],["b","Tú: ___"]],"choices":["¡Gracias por comentar!","El bus cocina temprano.","Ayer mañana leeré."],"correct":"¡Gracias por comentar!"},{"id":"chat35","context":"Mensaje directo","icon":"📩","scene":"📱 🔗","note":"Pedir enlace","chat":[["a","Amiga: Tengo el enlace del evento."],["b","Tú: ___"]],"choices":["¿Me lo puedes enviar, por favor?","La mochila bebe agua.","Mañana fui ayer."],"correct":"¿Me lo puedes enviar, por favor?"},{"id":"chat36","context":"Grupo de clase","icon":"🏫","scene":"📚 💬","note":"Pedir tarea","chat":[["a","Compañero: ¿Alguien necesita la tarea de hoy?"],["b","Tú: ___"]],"choices":["Sí, ¿puedes enviármela?","El recibo come pan.","Ayer mañana."],"correct":"Sí, ¿puedes enviármela?"},{"id":"chat37","context":"Amigos","icon":"🏠","scene":"👥 🚪","note":"Avisar llegada","chat":[["a","Amigo: Ya llegué a tu casa."],["b","Tú: ___"]],"choices":["Ya salgo a abrirte.","La profesora paga el bus.","Mañana ayer fui."],"correct":"Ya salgo a abrirte."},{"id":"chat38","context":"Red social","icon":"🏷️","scene":"📱 🏷️","note":"Etiqueta en publicación","chat":[["a","Amiga: Te etiqueté en una publicación."],["b","Tú: ___"]],"choices":["Gracias, ahora la reviso.","La farmacia estudia.","Ayer mañana comeré."],"correct":"Gracias, ahora la reviso."},{"id":"chat39","context":"Grupo de amigos","icon":"📅","scene":"👥 📅","note":"Confirmar salida","chat":[["a","Amigo: ¿Confirmas que vienes el sábado?"],["b","Tú: ___"]],"choices":["Sí, ahí estaré.","El celular cocina arroz.","Mañana ayer."],"correct":"Sí, ahí estaré."},{"id":"chat40","context":"Amigos","icon":"💬","scene":"👥 😕","note":"Cambiar plan","chat":[["a","Amiga: Hoy no podré salir."],["b","Tú: ___"]],"choices":["No hay problema, coordinamos otro día.","El colegio bebe café.","Ayer mañana fui."],"correct":"No hay problema, coordinamos otro día."},{"id":"chat41","context":"Juego en línea","icon":"🎮","scene":"👥 🎮","note":"Invitación","chat":[["a","Amigo: ¿Quieres jugar en línea esta noche?"],["b","Tú: ___"]],"choices":["Sí, después de cenar puedo.","La oficina toma leche.","Ayer mañana."],"correct":"Sí, después de cenar puedo."},{"id":"chat42","context":"Amigos","icon":"😂","scene":"📱 😂","note":"Responder meme","chat":[["a","Amiga: Te mandé un meme."],["b","Tú: ___"]],"choices":["Jajaja, está buenísimo.","El informe duerme temprano.","Mañana ayer."],"correct":"Jajaja, está buenísimo."},{"id":"chat43","context":"Grupo de estudio","icon":"📚","scene":"👥 🕖","note":"Recordar reunión","chat":[["a","Compañera: Recuerden la reunión mañana a las siete."],["b","Tú: ___"]],"choices":["Gracias, ya lo anoté.","La puerta compra pan.","Ayer mañana fui."],"correct":"Gracias, ya lo anoté."},{"id":"chat44","context":"Chat familiar","icon":"🏠","scene":"🥖 💬","note":"Organizar compra","chat":[["a","Mamá: ¿Quién puede comprar pan?"],["b","Tú: ___"]],"choices":["Yo puedo comprarlo al regresar.","El examen toma el bus.","Mañana ayer."],"correct":"Yo puedo comprarlo al regresar."},{"id":"chat45","context":"Chat de trabajo","icon":"💼","scene":"📄 💬","note":"Confirmar archivo","chat":[["a","Compañera: ¿Recibiste el archivo que te envié?"],["b","Tú: ___"]],"choices":["Sí, ya lo recibí. Gracias.","La silla estudia rápido.","Ayer mañana."],"correct":"Sí, ya lo recibí. Gracias."},{"id":"chat46","context":"Amigos","icon":"📍","scene":"👥 📍","note":"Ubicación","chat":[["a","Amigo: Estoy cerca. ¿Dónde estás?"],["b","Tú: ___"]],"choices":["Estoy junto a la entrada principal.","La tarea viaja mañana.","Ayer comeré."],"correct":"Estoy junto a la entrada principal."},{"id":"chat47","context":"Red social","icon":"🔒","scene":"📸 🤝","note":"Pedir permiso","chat":[["a","Amiga: ¿Puedo compartir tu foto?"],["b","Tú: ___"]],"choices":["Sí, puedes compartirla.","El bus escribe una medicina.","Mañana ayer."],"correct":"Sí, puedes compartirla."},{"id":"chat48","context":"Amigos","icon":"📝","scene":"👥 📝","note":"Hablar del examen","chat":[["a","Amigo: ¿Cómo te fue en el examen?"],["b","Tú: ___"]],"choices":["Me fue bien, aunque estaba nervioso.","La tienda toma la tarea.","Ayer mañana."],"correct":"Me fue bien, aunque estaba nervioso."},{"id":"chat49","context":"Grupo de amigos","icon":"🗺️","scene":"👥 🗺️","note":"Punto de encuentro","chat":[["a","Amiga: ¿Dónde nos encontramos?"],["b","Tú: ___"]],"choices":["En la puerta del centro comercial.","La computadora come sopa.","Mañana fui ayer."],"correct":"En la puerta del centro comercial."},{"id":"chat50","context":"Mensaje social","icon":"🤝","scene":"📱 ❤️","note":"Agradecer","chat":[["a","Amigo: Gracias por ayudarme con la tarea."],["b","Tú: ___"]],"choices":["De nada, para eso estamos.","El paradero cocina arroz.","Ayer mañana."],"correct":"De nada, para eso estamos."}],"6":[{"id":"adv31","scene":"👥 📱 📅","note":"Amigos","cards":[{"t":"Esta tarde","r":"time"},{"t":"mis amigos","r":"who"},{"t":"organizarán","r":"action"},{"t":"una salida","r":"what"},{"t":"por el chat","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Esta tarde","mis amigos","organizarán","una salida","por el chat"]},{"id":"adv32","scene":"📱 📸 💬","note":"Redes","cards":[{"t":"Después de publicar la foto","r":"time"},{"t":"mi amiga","r":"who"},{"t":"respondió","r":"action"},{"t":"los comentarios","r":"what"},{"t":"de sus amigos","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Después de publicar la foto","mi amiga","respondió","los comentarios","de sus amigos"]},{"id":"adv33","scene":"🏫 📚 💬","note":"Colegio","cards":[{"t":"Cuando terminó la clase","r":"time"},{"t":"la profesora","r":"who"},{"t":"envió","r":"action"},{"t":"la tarea","r":"what"},{"t":"al grupo del salón","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Cuando terminó la clase","la profesora","envió","la tarea","al grupo del salón"]},{"id":"adv34","scene":"💼 📧 ✅","note":"Trabajo","cards":[{"t":"Antes de salir de la oficina","r":"time"},{"t":"yo","r":"who"},{"t":"revisé","r":"action"},{"t":"mi correo","r":"what"},{"t":"y respondí lo urgente","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Antes de salir de la oficina","yo","revisé","mi correo","y respondí lo urgente"]},{"id":"adv35","scene":"🏠 🍽️ 💬","note":"Familia","cards":[{"t":"Mientras cenábamos","r":"time"},{"t":"mi familia","r":"who"},{"t":"conversó","r":"action"},{"t":"sobre el viaje","r":"what"},{"t":"del próximo mes","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Mientras cenábamos","mi familia","conversó","sobre el viaje","del próximo mes"]},{"id":"adv36","scene":"🚌 📱 ⏰","note":"Transporte","cards":[{"t":"Como el bus estaba demorando","r":"time"},{"t":"envié","r":"action"},{"t":"un mensaje","r":"what"},{"t":"para avisar","r":"what"},{"t":"que llegaría tarde","r":"what"}],"roles":["time","action","what","what","what"],"answer":["Como el bus estaba demorando","envié","un mensaje","para avisar","que llegaría tarde"]},{"id":"adv37","scene":"🛒 💳 ✅","note":"Compras","cards":[{"t":"Después de comparar los precios","r":"time"},{"t":"mi mamá","r":"who"},{"t":"pagó","r":"action"},{"t":"la compra","r":"what"},{"t":"con su tarjeta","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Después de comparar los precios","mi mamá","pagó","la compra","con su tarjeta"]},{"id":"adv38","scene":"🏥 📅 📩","note":"Salud","cards":[{"t":"Cuando confirmaron mi cita","r":"time"},{"t":"recibí","r":"action"},{"t":"un mensaje","r":"what"},{"t":"con la hora","r":"what"},{"t":"y la dirección","r":"what"}],"roles":["time","action","what","what","what"],"answer":["Cuando confirmaron mi cita","recibí","un mensaje","con la hora","y la dirección"]},{"id":"adv39","scene":"🏦 🪪 📄","note":"Trámite","cards":[{"t":"Antes de acercarme a la ventanilla","r":"time"},{"t":"preparé","r":"action"},{"t":"mi DNI","r":"what"},{"t":"y","r":"connector"},{"t":"todos los documentos","r":"what"}],"roles":["time","action","what","connector","what"],"answer":["Antes de acercarme a la ventanilla","preparé","mi DNI","y","todos los documentos"]},{"id":"adv40","scene":"📱 🔋 🔌","note":"Tecnología","cards":[{"t":"Como mi celular tenía poca batería","r":"time"},{"t":"lo puse","r":"action"},{"t":"a cargar","r":"what"},{"t":"antes de salir","r":"what"}],"roles":["time","action","what","what"],"answer":["Como mi celular tenía poca batería","lo puse","a cargar","antes de salir"]},{"id":"adv41","scene":"👥 🌳 ☀️","note":"Amigos","cards":[{"t":"El domingo por la mañana","r":"time"},{"t":"mis amigos y yo","r":"who"},{"t":"nos reuniremos","r":"action"},{"t":"en el parque","r":"what"},{"t":"para conversar","r":"what"}],"roles":["time","who","action","what","what"],"answer":["El domingo por la mañana","mis amigos y yo","nos reuniremos","en el parque","para conversar"]},{"id":"adv42","scene":"📩 🔗 👩","note":"Redes","cards":[{"t":"Cuando recibí el enlace","r":"time"},{"t":"yo","r":"who"},{"t":"lo compartí","r":"action"},{"t":"con mi amiga","r":"what"},{"t":"por mensaje","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Cuando recibí el enlace","yo","lo compartí","con mi amiga","por mensaje"]},{"id":"adv43","scene":"🏫 📝 😓","note":"Colegio","cards":[{"t":"Aunque el ejercicio era difícil","r":"time"},{"t":"la estudiante","r":"who"},{"t":"lo terminó","r":"action"},{"t":"con ayuda","r":"what"},{"t":"de su compañera","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Aunque el ejercicio era difícil","la estudiante","lo terminó","con ayuda","de su compañera"]},{"id":"adv44","scene":"💼 📄 🤝","note":"Trabajo","cards":[{"t":"Después de la reunión","r":"time"},{"t":"mi compañero","r":"who"},{"t":"me envió","r":"action"},{"t":"el documento corregido","r":"what"},{"t":"por correo","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Después de la reunión","mi compañero","me envió","el documento corregido","por correo"]},{"id":"adv45","scene":"🏠 🧹 ➕","note":"Casa","cards":[{"t":"Esta mañana","r":"time"},{"t":"mi hermano","r":"who"},{"t":"ordenó","r":"action"},{"t":"su cuarto","r":"what"},{"t":"y limpió la mesa","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Esta mañana","mi hermano","ordenó","su cuarto","y limpió la mesa"]},{"id":"adv46","scene":"🚌 🚧 ⚠️","note":"Transporte","cards":[{"t":"Aunque había mucho tráfico","r":"time"},{"t":"el conductor","r":"who"},{"t":"llegó","r":"action"},{"t":"a tiempo","r":"what"},{"t":"al paradero final","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Aunque había mucho tráfico","el conductor","llegó","a tiempo","al paradero final"]},{"id":"adv47","scene":"🌐 💬 🤝","note":"Redes","cards":[{"t":"Antes de compartir la publicación","r":"time"},{"t":"mi amiga","r":"who"},{"t":"me pidió","r":"action"},{"t":"permiso","r":"what"},{"t":"por mensaje","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Antes de compartir la publicación","mi amiga","me pidió","permiso","por mensaje"]},{"id":"adv48","scene":"👥 🎮 🌙","note":"Amigos","cards":[{"t":"Después de terminar la tarea","r":"time"},{"t":"mis amigos","r":"who"},{"t":"jugaron","r":"action"},{"t":"en línea","r":"what"},{"t":"durante una hora","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Después de terminar la tarea","mis amigos","jugaron","en línea","durante una hora"]},{"id":"adv49","scene":"🏥 💊 🕒","note":"Salud","cards":[{"t":"Después de almorzar","r":"time"},{"t":"mi abuelo","r":"who"},{"t":"tomó","r":"action"},{"t":"su medicina","r":"what"},{"t":"a la hora indicada","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Después de almorzar","mi abuelo","tomó","su medicina","a la hora indicada"]},{"id":"adv50","scene":"🏛️ 📄 ✅","note":"Trámite","cards":[{"t":"Cuando entregué todos los documentos","r":"time"},{"t":"la trabajadora","r":"who"},{"t":"registró","r":"action"},{"t":"mi solicitud","r":"what"},{"t":"sin problemas","r":"what"}],"roles":["time","who","action","what","what"],"answer":["Cuando entregué todos los documentos","la trabajadora","registró","mi solicitud","sin problemas"]}]};
    Object.keys(DATA_EXTRA_ORACIONES).forEach(nivel => {
      DATA[nivel].push(...DATA_EXTRA_ORACIONES[nivel]);
      if (DATA[nivel].length !== 50) {
        console.warn(`Oraciones: el nivel ${nivel} tiene ${DATA[nivel].length} actividades; se esperaban 50.`);
      }
    });

    let state={mode:"jugar",level:1,index:0,score:0,selected:null,timerId:null,time:0,locked:false,tutorial:false,session:[]};
    let current=null;
    
    function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
    
    const USED_KEY="lspedia_oraciones_v4_usadas_";
    
    function getUsed(level){
      try{
        const v=JSON.parse(localStorage.getItem(USED_KEY+level)||"[]");
        return Array.isArray(v)?v:[];
      }catch(e){return []}
    }
    function saveUsed(level,ids){
      try{localStorage.setItem(USED_KEY+level,JSON.stringify(ids))}catch(e){}
    }
    function prepareSession(){
      const bank=DATA[state.level]||[];
      let used=getUsed(state.level).filter(id=>bank.some(q=>q.id===id));
      let available=bank.filter(q=>!used.includes(q.id));
    
      // Cuando ya casi se vio todo el banco, comienza un nuevo ciclo.
      // Así no se repiten las mismas cinco preguntas cada vez que se entra.
      if(available.length<5){
        used=[];
        available=bank.slice();
      }
    
      state.session=shuffle(available).slice(0,Math.min(5,available.length));
      const maxRemember=Math.max(0,bank.length-5);
      const nextUsed=used.concat(state.session.map(q=>q.id)).slice(-maxRemember);
      saveUsed(state.level,nextUsed);
    }
    
    function renderMenu(){
      shadow.querySelectorAll(".level").forEach(b=>b.classList.toggle("active",+b.dataset.level===state.level));
      const tips={
        1:"50 situaciones: casa, colegio, trabajo, salud, compras, trámites y transporte.",
        2:"50 verbos: mira de dónde nace la conjugación y cómo cambia con el tiempo.",
        3:"50 situaciones para aprender conectores como y, pero, porque, entonces, por eso y cuando.",
        4:"50 ejercicios de escritura: verbos, artículos, preposiciones y palabras útiles.",
        5:"50 conversaciones reales: amigos, chats y redes sociales, familia, colegio, trabajo, salud, compras, transporte y trámites.",
        6:"50 oraciones más completas con tiempo, conectores, causas y detalles."
      };
      $("levelTip").textContent=tips[state.level];
    }
    shadow.querySelectorAll(".level").forEach(b=>b.onclick=()=>{state.level=+b.dataset.level;renderMenu()});
    
    $("start").onclick=()=>{
      state.index=0; state.score=0;
      prepareSession();
      registrarPartida(state.level);
      $("menu").classList.add("hidden"); $("game").classList.remove("hidden");
      $("gameTitle").textContent="Oraciones · Nivel "+state.level+" · nuevas";
      $("modePill").textContent="Jugar";
      loadRound();
    };
    $("back").onclick=()=>volverInterno();
    $("next").onclick=()=>{state.index++; if(state.index>=5){finish();} else loadRound()};
    
    function loadRound(){
      stopTimer(); state.locked=false; state.selected=null; state.tutorial=false;
      $("feedback").innerHTML=""; $("feedback").className="";
      $("next").classList.add("hidden");
      $("activity").innerHTML="";
      $("progress").style.width=(state.index/5*100)+"%";
      $("score").textContent="⭐ "+state.score;
      $("round").textContent=(state.index+1)+" / 5";
      current=state.session[state.index] || DATA[state.level][0];
      renderScene();
      if(state.level===1) renderOrder();
      if(state.level===2) renderConjugation();
      if(state.level===3) renderConnector();
      if(state.level===4) renderWriting();
      if(state.level===5) renderConversation();
      if(state.level===6) renderOrder();
    }
    
    function renderScene(){
      $("scene").innerHTML=`<div class="scene-main">${current.scene}</div>
        ${current.note?`<div class="scene-note">${current.note}</div>`:""}
        <div class="legend"><span style="background:#2563eb">👤</span><span style="background:#e5484d">⚡</span><span style="background:#16a34a">🎯</span><span style="background:#7c3aed">🕒</span><span style="background:#f59e0b">🔗</span></div>`;
    }
    
    function makeWord(c){
      const b=document.createElement("button");
      b.className="word "+c.r;b.textContent=c.t;b.dataset.text=c.t;b.dataset.role=c.r;
      b.onclick=()=>selectWord(b);
      enableDrag(b);
      return b;
    }
    function selectWord(b){
      if(state.locked||state.tutorial)return;
      shadow.querySelectorAll(".word").forEach(x=>x.classList.remove("selected"));
      if(state.selected===b){state.selected=null;return}
      state.selected=b;b.classList.add("selected");
    }
    function slotClick(slot){
      if(!state.selected||state.locked||state.tutorial)return;
      placeWord(state.selected,slot);
    }
    function placeWord(word,slot){
      if(slot.firstElementChild && slot.firstElementChild.classList.contains("word")){
        $("activity").querySelector(".bank").appendChild(slot.firstElementChild);
      }
      slot.appendChild(word); word.classList.remove("selected");state.selected=null;
      setTimeout(checkOrderIfFull,120);
    }
    function enableDrag(el){
      el.addEventListener("pointerdown",e=>{
        if(state.locked||state.tutorial)return;
        const start={x:e.clientX,y:e.clientY}; let moved=false, clone=null;
        const rect=el.getBoundingClientRect();
        function move(ev){
          if(Math.hypot(ev.clientX-start.x,ev.clientY-start.y)<7&&!moved)return;
          if(!moved){
            moved=true; clone=el.cloneNode(true); clone.classList.add("dragging");
            clone.style.width=rect.width+"px";clone.style.left=(ev.clientX-rect.width/2)+"px";clone.style.top=(ev.clientY-rect.height/2)+"px";shadow.appendChild(clone);
          }else{clone.style.left=(ev.clientX-rect.width/2)+"px";clone.style.top=(ev.clientY-rect.height/2)+"px"}
        }
        function up(ev){
          window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);
          if(clone)clone.remove();
          if(!moved)return;
          const slots=[...shadow.querySelectorAll(".slot")];
          const target=slots.find(s=>{const r=s.getBoundingClientRect();return ev.clientX>=r.left&&ev.clientX<=r.right&&ev.clientY>=r.top&&ev.clientY<=r.bottom});
          if(target)placeWord(el,target);
        }
        window.addEventListener("pointermove",move);window.addEventListener("pointerup",up,{once:true});
      });
    }
    
    function renderOrder(){
      const a=$("activity");
      const extra=state.level===6
        ? '<div class="complex-map"><span class="time">CUÁNDO</span><span class="who">QUIÉN</span><span class="action">ACCIÓN</span><span class="connector">UNE</span><span class="what">DETALLE</span></div>'
        : '';
      a.innerHTML=extra+'<div class="builder"><div class="slots"></div><div class="bank"></div><div class="help">'+(state.level===6?'Forma una oración más completa. Mira colores y orden.':'Toca/arrastra las palabras a su lugar.')+'</div></div>';
      const slots=a.querySelector(".slots"),bank=a.querySelector(".bank");
      current.roles.forEach(r=>{
        const s=document.createElement("div");s.className="slot "+ROLE[r].cls;s.dataset.icon=ROLE[r].icon;s.dataset.role=r;s.onclick=()=>slotClick(s);slots.appendChild(s);
      });
      shuffle(current.cards).forEach(c=>bank.appendChild(makeWord(c)));
      setTimeout(()=>tutorialOrder(slots.children[0],bank.querySelector(`[data-text="${CSS.escape(current.answer[0])}"]`)),450);
    }
    function checkOrderIfFull(){
      if((state.level!==1&&state.level!==6)||state.locked)return;
      const slots=[...shadow.querySelectorAll(".slot")];
      if(!slots.every(s=>s.querySelector(".word")))return;
      const built=slots.map(s=>s.querySelector(".word").dataset.text);
      if(built.join("|")===current.answer.join("|")) success("¡Muy bien!");
      else error("Mira los colores y el orden.");
    }
    
    async function tutorialOrder(slot,word){
      if(!slot||!word)return;
      state.tutorial=true;
      const badge=document.createElement("div");badge.className="tutorial-badge";badge.textContent="👀 Mira primero";$("scene").appendChild(badge);
      await animateHand(word,slot);
      badge.remove();state.tutorial=false;
      const n=document.createElement("div");n.className="now";n.textContent="✋ Ahora tú";$("activity").appendChild(n);setTimeout(()=>n.remove(),1700);
      startTimer();
    }
    
    function animateHand(from,to){
     return new Promise(resolve=>{
       const fr=from.getBoundingClientRect(),tr=to.getBoundingClientRect();
       const ghost=from.cloneNode(true);ghost.classList.add("ghost");ghost.style.width=fr.width+"px";ghost.style.left=fr.left+"px";ghost.style.top=fr.top+"px";
       const hand=document.createElement("div");hand.className="hand";hand.textContent="👆";hand.style.left=(fr.left+fr.width*.55)+"px";hand.style.top=(fr.top+fr.height*.6)+"px";
       shadow.append(ghost,hand);
       requestAnimationFrame(()=>{ghost.style.left=(tr.left+tr.width/2-fr.width/2)+"px";ghost.style.top=(tr.top+tr.height/2-fr.height/2)+"px";hand.style.left=(tr.left+tr.width*.55)+"px";hand.style.top=(tr.top+tr.height*.58)+"px"});
       setTimeout(()=>{ghost.remove();hand.remove();resolve()},1150);
     });
    }
    
    function renderConjugation(){
     const a=$("activity");
     const f=current.forms||{};
     a.innerHTML=`
       <div class="verb-origin">
         <div class="label">VERBO DE ORIGEN</div>
         <div class="inf">${current.infinitive||""}</div>
         <div class="arrowline">↓ cambia según el tiempo ↓</div>
         <div class="forms">
           <span class="form past">AYER · ${f.past||""}</span>
           <span class="form present">HOY · ${f.present||""}</span>
           <span class="form future">MAÑANA · ${f.future||""}</span>
         </div>
       </div>
       <div class="builder">
         <div class="write-line">${current.sentence.map(x=>x==="___"?'<span class="slot action" data-icon="⚡" style="min-width:90px">?</span>':`<span>${x}</span>`).join(" ")}</div>
         <div class="answers"></div>
         <div class="help">Mira el verbo original y el tiempo. Luego elige la forma correcta.</div>
       </div>`;
     const ans=a.querySelector(".answers");
     shuffle(current.choices).forEach(v=>{
       const b=document.createElement("button");
       b.className="answer"; b.textContent=v;
       b.onclick=()=>{
         if(state.locked)return;
         if(v===current.correct){
           b.classList.add("correct");
           a.querySelector(".slot").textContent=v;
           success("Verbo correcto para "+current.note.toLowerCase());
         }else{
           b.classList.add("wrong");
           error("Mira el verbo "+(current.infinitive||"")+" y el tiempo: "+current.note);
         }
       };
       ans.appendChild(b);
     });
     setTimeout(()=>tutorialChoices(ans),450);
    }
    function tutorialChoices(container){
      const choices=[...container.querySelectorAll("button")];
      if(!choices.length)return;
      state.tutorial=true;
      const badge=document.createElement("div");
      badge.className="tutorial-badge";
      badge.textContent="👀 Mira dónde responder";
      $("scene").appendChild(badge);
    
      const first=choices[0].getBoundingClientRect();
      const last=choices[choices.length-1].getBoundingClientRect();
      const h=document.createElement("div");
      h.className="hand";
      h.textContent="👆";
      h.style.left=(first.left+first.width/2)+"px";
      h.style.top=(first.top+first.height+5)+"px";
      shadow.appendChild(h);
    
      choices.forEach(b=>b.style.boxShadow="0 0 0 4px #dbeafe");
      requestAnimationFrame(()=>{
        h.style.left=(last.left+last.width/2)+"px";
      });
    
      setTimeout(()=>{
        h.remove(); badge.remove();
        choices.forEach(b=>b.style.boxShadow="");
        state.tutorial=false;
        const n=document.createElement("div");
        n.className="now";
        n.textContent="✋ Ahora tú";
        $("activity").appendChild(n);
        setTimeout(()=>n.remove(),1300);
        startTimer();
      },1150);
    }
    
    function renderConnector(){
     const a=$("activity");
     a.innerHTML=`<div class="builder"><div class="write-line"><span>${current.left}</span><span class="slot connector" data-icon="🔗" style="min-width:90px">?</span><span>${current.right}</span></div><div class="answers"></div><div class="help">¿Qué palabra une mejor las dos ideas?</div></div>`;
     const ans=a.querySelector(".answers");
     shuffle(current.choices).forEach(v=>{
       const b=document.createElement("button");b.className="answer";b.textContent=v;b.onclick=()=>{if(state.locked||state.tutorial)return;if(v===current.correct){b.classList.add("correct");a.querySelector(".slot").textContent=v;success("Las ideas quedaron unidas")}else{b.classList.add("wrong");error(v==="porque"?"¿La segunda idea explica la causa?":"Mira la relación entre las dos imágenes.")}};ans.appendChild(b);
     });
     setTimeout(()=>tutorialChoices(ans),450);
    }
    
    
    function renderConversation(){
     const a=$("activity");
     const bubbles=(current.chat||[]).map(([side,msg])=>`<div class="bubble ${side}">${msg}</div>`).join("");
     a.innerHTML=`
       <div class="context-card">
         <div class="context-head"><span class="context-icon">${current.icon||"💬"}</span><div><div class="context-name">${current.context||"Conversación"}</div><small>${current.note||""}</small></div></div>
         <div class="chat">${bubbles}</div>
       </div>
       <div class="choice-list"></div>
       <div class="help">Elige una respuesta natural para esta situación.</div>`;
     const list=a.querySelector(".choice-list");
     shuffle(current.choices).forEach(v=>{
       const b=document.createElement("button");
       b.className="choice-big"; b.textContent=v;
       b.onclick=()=>{
         if(state.locked)return;
         if(v===current.correct){
           b.classList.add("correct");
           success("Respuesta adecuada para "+current.context.toLowerCase());
         }else{
           b.classList.add("wrong");
           error("Esa respuesta no encaja bien en esta conversación.");
         }
       };
       list.appendChild(b);
     });
     setTimeout(()=>tutorialChoices(list),450);
    }
    
    function renderWriting(){
     const a=$("activity");
     a.innerHTML=`<div class="write-wrap"><div class="write-line">${current.parts.map(x=>x==="___"?'<input id="writeInput" class="write-input" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="✍️">':`<span>${x}</span>`).join(" ")}</div><div class="help">Pista: ${current.hint}</div></div>`;

     const input=$("writeInput");
     const actividadId=current.id;
     const AUTO_COMPROBAR_MS=1400;
     const AUTO_SIGUIENTE_MS=1200;
     let autoCheckId=null;
     let resuelto=false;
     let componiendo=false;

     const normalizarRespuesta=(valor)=>String(valor||"").trim().replace(/\s+/g," ").toLocaleLowerCase("es-PE");

     const avanzarAutomaticamente=()=>{
       setTimeout(()=>{
         const gameEl=$("game");
         if(!current||current.id!==actividadId||!gameEl||gameEl.classList.contains("hidden"))return;
         state.index++;
         if(state.index>=5)finish();
         else loadRound();
       },AUTO_SIGUIENTE_MS);
     };

     const evaluar=()=>{
       if(resuelto||state.locked||state.tutorial)return;
       const valor=normalizarRespuesta(input.value);
       if(!valor)return;
       resuelto=true;
       clearTimeout(autoCheckId);
       input.disabled=true;
       stopTimer();

       if(valor===normalizarRespuesta(current.correct)){
         success("¡Lo escribiste bien!");
       }else{
         state.locked=true;
         error("Respuesta: "+current.correct);
       }

       $("next").classList.add("hidden");
       avanzarAutomaticamente();
     };

     const programarEvaluacion=()=>{
       clearTimeout(autoCheckId);
       if(resuelto||state.locked||state.tutorial)return;
       if(!normalizarRespuesta(input.value))return;
       autoCheckId=setTimeout(evaluar,AUTO_COMPROBAR_MS);
     };

     input.addEventListener("input",()=>{if(!componiendo)programarEvaluacion()});
     input.addEventListener("compositionstart",()=>{componiendo=true;clearTimeout(autoCheckId)});
     input.addEventListener("compositionend",()=>{componiendo=false;programarEvaluacion()});
     input.addEventListener("keydown",e=>{
       if(e.key==="Enter"){
         e.preventDefault();
         clearTimeout(autoCheckId);
         evaluar();
       }
     });

     setTimeout(()=>{
       state.tutorial=true;
       const r=input.getBoundingClientRect();
       const h=document.createElement("div");
       h.className="hand";
       h.textContent="👆";
       h.style.left=(r.left+r.width/2)+"px";
       h.style.top=(r.top+r.height+5)+"px";
       shadow.appendChild(h);
       setTimeout(()=>{
         h.remove();
         state.tutorial=false;
         input.focus();
         startTimer();
       },1000)
     },450);
    }

    let audioCtxJuego=null;
    function obtenerAudioCtxJuego(){
     if(!audioCtxJuego){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioCtxJuego=new AC()}
     if(audioCtxJuego&&audioCtxJuego.state==="suspended")try{audioCtxJuego.resume()}catch(e){}
     return audioCtxJuego;
    }
    function tonoJuego(freq,dur,delay,tipo,vol){
     const ctx=obtenerAudioCtxJuego();if(!ctx)return;
     const o=ctx.createOscillator(),g=ctx.createGain(),ini=ctx.currentTime+(delay||0)/1000;
     o.type=tipo||"sine";o.frequency.value=freq;g.gain.setValueAtTime(vol||.14,ini);g.gain.exponentialRampToValueAtTime(.001,ini+dur/1000);
     o.connect(g);g.connect(ctx.destination);o.start(ini);o.stop(ini+dur/1000+.05);
    }
    function sonidoCorrectoJuego(){tonoJuego(523,105,0,"triangle",.14);tonoJuego(659,110,90,"triangle",.14);tonoJuego(880,170,180,"triangle",.16)}
    function sonidoIncorrectoJuego(){tonoJuego(235,115,0,"sawtooth",.10);tonoJuego(175,190,105,"sawtooth",.11)}

    function success(msg){
     if(state.locked)return;state.locked=true;stopTimer();state.score++;$("score").textContent="⭐ "+state.score;$("feedback").className="feedback ok";$("feedback").textContent=msg;
     sonidoCorrectoJuego();flashOk();confetti();react("🥳👏🏻");$("next").classList.remove("hidden");
    }
    function error(msg){
     $("feedback").className="feedback bad";$("feedback").textContent=msg;sonidoIncorrectoJuego();flashRed();react("😢👎🏻",700);if(navigator.vibrate)try{navigator.vibrate([160,70,160])}catch(e){}
    }
    function flashRed(){const x=document.createElement("div");x.className="flash-red";shadow.appendChild(x);setTimeout(()=>x.remove(),500)}
    function flashOk(){const x=document.createElement("div");x.className="flash-ok";shadow.appendChild(x);setTimeout(()=>x.remove(),950)}
    function confetti(){
     const c=document.createElement("div");c.className="confetti";const colors=["#ef4444","#f59e0b","#eab308","#22c55e","#06b6d4","#3b82f6","#8b5cf6","#ec4899"];
     for(let i=0;i<34;i++){const p=document.createElement("i");p.style.left=Math.random()*100+"vw";p.style.background=colors[i%colors.length];p.style.animationDuration=(1.5+Math.random()*1.3)+"s";p.style.animationDelay=Math.random()*.2+"s";c.appendChild(p)}shadow.appendChild(c);setTimeout(()=>c.remove(),2700)
    }
    function react(emoji,d=1200){const o=document.createElement("div");o.className="overlay-react";o.innerHTML=`<div>${emoji}</div>`;shadow.appendChild(o);setTimeout(()=>o.remove(),d)}
    
    function startTimer(){
     if(state.timerId)return;
     $("timerWrap").classList.remove("hidden");
     state.time=state.level<=2?24:state.level<=4?30:36;
     $("timer").style.width="100%";$("timer").style.background="#22c55e";
     const max=state.time;state.timerId=setInterval(()=>{
       state.time--;$("timer").style.width=(state.time/max*100)+"%";if(state.time<=6)$("timer").style.background="#f97316";if(state.time<=3)$("timer").style.background="#dc2626";
       if(state.time<=5&&state.time>=1)countdown(state.time);
       if(state.time<=0){stopTimer();error("Tiempo.");state.locked=true;$("next").classList.remove("hidden")}
     },1000);
    }
    function countdown(n){let o=$("countdown");if(!o){o=document.createElement("div");o.id="countdown";o.className="countdown";shadow.appendChild(o)}o.innerHTML=`<div class="${n<=3?"urgent":""}">${n}</div>`}
    function stopTimer(){if(state.timerId){clearInterval(state.timerId);state.timerId=null}const o=$("countdown");if(o)o.remove()}
    
    function finish(){
     stopTimer();$("progress").style.width="100%";$("scene").innerHTML=`<div class="scene-main">🏆</div><div class="scene-note">Terminaste</div>`;
     $("activity").innerHTML=`<div class="feedback ok">⭐ ${state.score} / 5</div>`;$("feedback").innerHTML="";$("next").classList.add("hidden");
     flashOk();confetti();setTimeout(()=>volverInterno(),2300);
    }
    
    
    renderMenu();
    return {
      mostrarMenu(){
        stopTimer();
        state.tutorial=false;
        $("game").classList.add("hidden");
        $("menu").classList.remove("hidden");
        renderMenu();
      },
      iniciarPartidaDesdeHistorial(nivel){
        stopTimer();
        state.level=Math.min(6,Math.max(1,Number(nivel)||1));
        state.index=0;
        state.score=0;
        prepareSession();
        $("menu").classList.add("hidden");
        $("game").classList.remove("hidden");
        $("gameTitle").textContent="Oraciones · Nivel "+state.level+" · nuevas";
        $("modePill").textContent="Jugar";
        loadRound();
      },
      detener(){ stopTimer(); state.tutorial=false; }
    };
  }

  function asegurarContenedor(){
    if(contenedor && shadow) return true;
    const seccion=document.getElementById("seccionQuiz");
    if(!seccion) return false;
    contenedor=document.getElementById("oracionesApp");
    if(!contenedor){
      contenedor=document.createElement("div");
      contenedor.id="oracionesApp";
      contenedor.className="d-none";
      seccion.appendChild(contenedor);
    }
    if(!contenedor.shadowRoot){
      shadow=contenedor.attachShadow({mode:"open"});
      shadow.innerHTML="<style>"+ESTILOS+"</style>"+MARCADO;
      juego=crearLogica();
    } else {
      shadow=contenedor.shadowRoot;
    }

    try{
      if(Array.isArray(PANTALLAS_SECCION_JUEGOS) && !PANTALLAS_SECCION_JUEGOS.includes("oracionesApp")) PANTALLAS_SECCION_JUEGOS.push("oracionesApp");
    }catch(_){}

    if(!observer){
      observer=new MutationObserver(()=>{
        const seccionOculta=seccion.classList.contains("d-none");
        const appOculta=contenedor.classList.contains("d-none");
        if((seccionOculta||appOculta) && juego) juego.detener();
      });
      observer.observe(contenedor,{attributes:true,attributeFilter:["class"]});
      observer.observe(seccion,{attributes:true,attributeFilter:["class"]});
    }
    return true;
  }

  function mostrarSoloOraciones(){
    if(!asegurarContenedor()) return;
    try{
      if(typeof mostrarPantallaJuegos==="function"){
        mostrarPantallaJuegos("oracionesApp");
        return;
      }
    }catch(_){}
    ["quizMenuJuegos","quizCargando","quizIntro","quizActivo","quizMemoria","quizResultados","alfabCompletar","alfabUnir","alfabResultados","matApp"].forEach(id=>{
      const el=document.getElementById(id); if(el) el.classList.add("d-none");
    });
    contenedor.classList.remove("d-none");
  }

  function iniciar(opciones={}){
    if(!asegurarContenedor()) return;
    mostrarSoloOraciones();
    if(!opciones.sinHistorial) registrarMenu();
    juego.mostrarMenu();
  }

  function salir(){
    if(juego) juego.detener();
    if(contenedor) contenedor.classList.add("d-none");
  }

  function restaurarDesdeUrl(){
    const p=new URLSearchParams(window.location.search);
    if(p.get("vista")!=="herramientas-jugar" || p.get("juego")!=="oraciones") return false;
    if(!asegurarContenedor()) return false;
    mostrarSoloOraciones();
    if(p.get("pantalla")==="partida") juego.iniciarPartidaDesdeHistorial(p.get("nivel")||1);
    else juego.mostrarMenu();
    return true;
  }

  function asegurarBoton(){
    let btn=document.getElementById("btnMenuJuegoOraciones");

    // La tarjeta Oraciones vive de forma permanente en index.html.
    // Este respaldo solo la crea si alguien abre una copia vieja del HTML.
    if(!btn){
      const fila=document.querySelector("#quizMenuJuegos .row");
      if(!fila) return;
      const col=document.createElement("div");
      col.className="col-6 col-md-3 menu-juego-col";
      col.innerHTML=`<button type="button" class="quiz-selector-btn menu-juego-btn w-100 h-100" id="btnMenuJuegoOraciones" aria-label="Juego Construye la oración"><span class="icono">💬</span><span class="fw-bold">Oraciones</span></button>`;
      fila.appendChild(col);
      btn=col.querySelector("#btnMenuJuegoOraciones");
    }

    if(btn && btn.dataset.oracionesListo!=="1"){
      btn.dataset.oracionesListo="1";
      btn.addEventListener("click",()=>iniciar());
    }
  }

  function alCargar(){
    asegurarBoton();
    asegurarContenedor();
    setTimeout(restaurarDesdeUrl,20);
    setTimeout(restaurarDesdeUrl,950);
  }

  window.addEventListener("popstate",()=>setTimeout(restaurarDesdeUrl,20));
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",alCargar);
  else alCargar();

  return {iniciar,salir,restaurarDesdeUrl};
})();

window.OracionesV2=OracionesV2;
