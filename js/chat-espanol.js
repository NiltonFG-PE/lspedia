/* LSPedia: Chat en español visual para personas sordas (3 niveles). Sin backend, API de pago ni envío de mensajes. */
(() => {
"use strict";
const $=id=>document.getElementById(id);
const {
  normalize,escapeHTML:esc,review,nextGuided,parseAI,safeProgress,
  responseGuide,communicationFeedback,buildOptionsForTurn,highlightFocusWords,
  buildContextualReply,CONNECTOR_CHIPS,visualFormulaForTurn,questionIconForPrompt
}=window.LSPChatCore;
const {levels,scenarios}=window.LSPChatData;
const localAI=window.LSPChatLocal;
const STORAGE_KEY="lspedia_chat_espanol_v1";

const state={
  scenario:null,turn:0,mode:"guided",run:0,busy:false,pending:null,
  history:[],memory:{},accepted:0,attempts:0,hints:0,rewrites:0,
  notes:new Set(),connectorsUsed:new Set(),usedExample:false,
  progress:loadProgress(),loadingAI:false,draftInitial:"",
  samples:[],finished:false,inflightText:"",showOptions:true
};
let modalFocus=null, activation=0, replyTimer=null;

function insertAtCursor(text){
  const el=$("messageInput");
  if(!el||el.disabled)return;
  const start=el.selectionStart??el.value.length;
  const end=el.selectionEnd??el.value.length;
  const before=el.value.slice(0,start);
  const after=el.value.slice(end);
  const needsSpace=before.length>0&&!/[\s¿¡]$/.test(before)&&!text.startsWith(",");
  const chunk=(needsSpace?" ":"")+text;
  el.value=before+chunk+after;
  const pos=start+chunk.length;
  el.focus();
  el.setSelectionRange?.(pos,pos);
  autoGrow();
}

function showVisualGuideModal(){
  const html=`<div class="vg-grid">
    <section class="vg-card vg-amber">
      <h3>🔗 Conectores (unir ideas)</h3>
      <div class="vg-row"><span class="vg-tag">💡 Motivo</span><div><b>porque / ya que</b><small>Llego tarde <mark class="hl-grammar">porque</mark> hay tráfico.</small></div></div>
      <div class="vg-row"><span class="vg-tag">⚖️ Contraste</span><div><b>, pero / aunque</b><small>Quiero ir<mark class="hl-grammar">, pero</mark> trabajo.</small></div></div>
      <div class="vg-row"><span class="vg-tag">➡️ Resultado</span><div><b>por eso / entonces</b><small>Llueve; <mark class="hl-grammar">por eso</mark> llevo paraguas.</small></div></div>
      <div class="vg-row"><span class="vg-tag">🔢 Orden</span><div><b>primero → luego → finalmente</b><small><mark class="hl-grammar">Primero</mark> leo, <mark class="hl-grammar">luego</mark> escribo.</small></div></div>
    </section>
    <section class="vg-card vg-green">
      <h3>⏱️ Verbos (cuándo pasa)</h3>
      <div class="vg-row"><span class="vg-tag">⏪ Ayer</span><div><b>Pasado</b><small>fui · hice · tuve · compré · estudié</small></div></div>
      <div class="vg-row"><span class="vg-tag">▶️ Hoy</span><div><b>Presente</b><small>voy · hago · tengo · compro · estudio</small></div></div>
      <div class="vg-row"><span class="vg-tag">⏩ Mañana</span><div><b>Futuro</b><small>iré · haré · tendré · voy a + verbo</small></div></div>
    </section>
    <section class="vg-card vg-blue">
      <h3>🧩 Ser · Estar · Tener</h3>
      <div class="vg-row"><span class="vg-tag">🪪 Quién soy</span><div><b>soy</b><small>Soy Luis · Soy de Perú · Soy estudiante.</small></div></div>
      <div class="vg-row"><span class="vg-tag">📍 Dónde / Cómo</span><div><b>estoy</b><small>Estoy en casa · Estoy bien / cansado.</small></div></div>
      <div class="vg-row"><span class="vg-tag">🎂 Edad / 😋</span><div><b>tengo</b><small>Tengo 20 años · Tengo hambre / duda.</small></div></div>
    </section>
    <section class="vg-card vg-purple">
      <h3>📍 Uniones y género</h3>
      <div class="vg-row"><span class="vg-tag">🔗 Uniones</span><div><b>a + el = al · de + el = del</b><small>Voy <mark class="hl-grammar">al</mark> centro · Cerca <mark class="hl-grammar">del</mark> parque.</small></div></div>
      <div class="vg-row"><span class="vg-tag">👩 Femenino</span><div><b>la / una</b><small>la casa · la tarea · una duda</small></div></div>
      <div class="vg-row"><span class="vg-tag">👨 Masculino</span><div><b>el / un</b><small>el problema · el día · un boleto</small></div></div>
    </section>
  </div>`;
  showModal("📖","Guía visual de español",html,[{label:"Entendido, volver",action:hideModal}]);
}

function ensureEnhancedUI(){
  // Botón de Guía Visual en la pantalla de inicio (junto al botón principal)
  const welcomePane=document.querySelector(".welcome-pane");
  if(welcomePane&&!$("btnHomeVisualGuide")){
    const gBtn=document.createElement("button");
    gBtn.id="btnHomeVisualGuide";
    gBtn.type="button";
    gBtn.className="action-secondary home-guide-btn";
    gBtn.innerHTML='<span aria-hidden="true">📖</span> Guía visual: conectores y verbos';
    gBtn.addEventListener("click",showVisualGuideModal);
    const recLabel=$("recommendedLabel");
    if(recLabel)recLabel.parentNode.insertBefore(gBtn,recLabel.nextSibling);
    else welcomePane.appendChild(gBtn);
  }

  const smartTip=$("smartBar")?.querySelector(".smart-tip");
  if(smartTip&&!$("grammarFocusBadge")){
    const badge=document.createElement("span");
    badge.id="grammarFocusBadge";
    badge.className="focus-pill hidden";
    smartTip.prepend(badge);
  }
  if(smartTip&&!$("visualFormulaBox")){
    const formula=document.createElement("div");
    formula.id="visualFormulaBox";
    formula.className="visual-formula hidden";
    smartTip.appendChild(formula);
  }
  if($("smartBar")&&!$("btnToggleOptions")){
    const actionsWrap=document.createElement("div");
    actionsWrap.className="smart-actions";

    const guideBtn=document.createElement("button");
    guideBtn.id="btnVisualGuide";
    guideBtn.type="button";
    guideBtn.className="wildcard-btn guide-pill-btn";
    guideBtn.innerHTML='<span aria-hidden="true">📖</span> Guía';
    guideBtn.addEventListener("click",showVisualGuideModal);

    const toggleBtn=document.createElement("button");
    toggleBtn.id="btnToggleOptions";
    toggleBtn.type="button";
    toggleBtn.className="wildcard-btn options-toggle-btn";
    toggleBtn.setAttribute("aria-expanded","true");
    toggleBtn.innerHTML='<span aria-hidden="true">💬</span> Opciones';
    toggleBtn.addEventListener("click",()=>{
      state.showOptions=!state.showOptions;
      updateQuickOptionsVisibility();
    });

    const wildBtn=$("btnWildcard");
    wildBtn.innerHTML='<span aria-hidden="true">🧩</span> Armar';
    wildBtn.parentNode.insertBefore(actionsWrap,wildBtn);
    actionsWrap.appendChild(guideBtn);
    actionsWrap.appendChild(toggleBtn);
    actionsWrap.appendChild(wildBtn);
  }
  if(!$("quickOptionsBar")&&$("wildcardPanel")){
    const bar=document.createElement("section");
    bar.id="quickOptionsBar";
    bar.className="quick-options-bar hidden";
    bar.setAttribute("aria-label","Opciones sugeridas para responder");
    bar.innerHTML=`<div class="quick-opt-head"><span>💬 Elige cómo responder <small>(toca una opción o escribe libre)</small></span><button id="btnHideQuickOpts" class="quick-opt-hide" type="button" aria-label="Ocultar opciones">Ocultar</button></div><div id="quickOptionsList" class="quick-opt-list"></div>`;
    $("wildcardPanel").parentNode.insertBefore(bar,$("wildcardPanel"));
    $("btnHideQuickOpts").addEventListener("click",()=>{
      state.showOptions=false;
      updateQuickOptionsVisibility();
    });
  }
  if(!$("connectorChipsRow")&&$("composerWrap")){
    const row=document.createElement("div");
    row.id="connectorChipsRow";
    row.className="connector-bar";
    row.setAttribute("aria-label","Insertar conectores al escribir");
    row.innerHTML=`<span class="conn-label" aria-hidden="true">🔗 Unir:</span>` +
      (CONNECTOR_CHIPS||[]).map((c,i)=>`<button type="button" class="conn-chip" data-idx="${i}" title="${esc(c.tip)}"><span aria-hidden="true">${c.icon}</span> ${esc(c.label)}</button>`).join("");
    const composer=$("composerWrap").querySelector(".composer");
    $("composerWrap").insertBefore(row,composer);
    row.addEventListener("click",e=>{
      const btn=e.target.closest(".conn-chip");
      if(!btn)return;
      const chip=CONNECTOR_CHIPS[Number(btn.dataset.idx)];
      if(chip)insertAtCursor(chip.insert);
    });
  }
}

function updateQuickOptionsVisibility(){
  const bar=$("quickOptionsBar"), btn=$("btnToggleOptions");
  if(!bar)return;
  const writing=!!state.scenario&&!state.pending&&!state.busy&&!state.finished&&$("wildcardPanel").classList.contains("hidden");
  const hasOpts=state.mode==="guided"&&$("quickOptionsList")?.children.length>0;
  const visible=writing&&hasOpts&&state.showOptions;
  bar.classList.toggle("hidden",!visible);
  if(btn){
    btn.classList.toggle("hidden",!hasOpts);
    btn.classList.toggle("active",state.showOptions);
    btn.setAttribute("aria-expanded",String(visible));
  }
}

function renderQuickOptions(turn){
  const listEl=$("quickOptionsList");
  if(!listEl)return;
  if(!turn||state.mode==="ai"){
    listEl.innerHTML="";
    updateQuickOptionsVisibility();
    return;
  }
  const opts=buildOptionsForTurn(turn);
  const hl=turn.focus?.highlight||[];
  listEl.innerHTML=opts.map((o,i)=>`<button type="button" class="quick-opt-chip" data-idx="${i}"><span class="quick-opt-tag">${esc(o.label)}</span><span class="quick-opt-text">${highlightFocusWords(o.text,hl)}</span></button>`).join("");
  listEl.querySelectorAll(".quick-opt-chip").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const chosen=opts[Number(btn.dataset.idx)];
      if(!chosen)return;
      $("messageInput").value=chosen.text;
      state.usedExample=true;
      autoGrow();
      $("messageInput").focus();
      const len=$("messageInput").value.length;
      $("messageInput").setSelectionRange?.(len,len);
      toast("Opción lista. Puedes enviarla o cambiar palabras.");
    });
  });
  updateQuickOptionsVisibility();
}

function stopTyping(){clearTimeout(replyTimer);replyTimer=null;show("typingIndicator",false);}
function focusComposer(){const target=window.matchMedia?.("(pointer: coarse)").matches?$("messages"):$("messageInput");target.focus({preventScroll:true});}
function loadProgress(){
  try{return safeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"),scenarios.map(s=>s.id),levels.length);}
  catch(_){return safeProgress(null,scenarios.map(s=>s.id),levels.length);}
}
function saveProgress(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.progress));}catch(_){toast("Tu navegador no guardó el progreso. Puedes seguir practicando.");}}
function show(id,visible){$(id)?.classList.toggle("hidden",!visible);}
function toast(text){$("toast").textContent=text;$("toast").classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>$("toast").classList.remove("show"),3500);}
function scrollBottom(){requestAnimationFrame(()=>$("messages").scrollTo({top:$("messages").scrollHeight,behavior:window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}));}
function autoGrow(){const el=$("messageInput");el.style.height="auto";el.style.height=Math.min(el.scrollHeight,118)+"px";$("charCount").textContent=el.value.length+"/600";}
function inputEnabled(enabled){$("messageInput").disabled=!enabled;$("btnSend").disabled=!enabled;$("btnWildcard").disabled=!enabled;if($("btnToggleOptions"))$("btnToggleOptions").disabled=!enabled;}
function chooseMode(value){document.querySelectorAll('input[name="practiceMode"]').forEach(el=>{el.checked=el.value===value;});}
function selectedMode(){return document.querySelector('input[name="practiceMode"]:checked')?.value==="ai"&&localAI.isReady()?"ai":"guided";}
function recommendedScenario(){
  const list=scenarios.filter(s=>s.level===state.progress.lastLevel);
  return list.find(s=>!state.progress.completed.includes(s.id))||list[0]||scenarios[0];
}
function renderHome(){
  $("levelGrid").innerHTML=levels.map(l=>{
    const doneInLvl=scenarios.filter(s=>s.level===l.id&&state.progress.completed.includes(s.id)).length;
    const totalInLvl=scenarios.filter(s=>s.level===l.id).length;
    return `<button class="level-card level-card-3 ${l.id===state.progress.lastLevel?"active":""}" data-level="${l.id}" aria-pressed="${l.id===state.progress.lastLevel}" type="button"><span class="level-icon" aria-hidden="true">${esc(l.icon)}</span><span class="level-no">Nivel ${l.id}</span><strong class="level-title">${esc(l.name)}</strong><span class="level-sub">${doneInLvl}/${totalInLvl}</span><span class="sr-only">${esc(l.desc)}</span></button>`;
  }).join("");
  $("levelGrid").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
    state.progress.lastLevel=Number(b.dataset.level);$("scenarioSearch").value="";saveProgress();renderHome();
    $("levelGrid").querySelector(`[data-level="${state.progress.lastLevel}"]`)?.focus();
  }));
  $("homeProgress").textContent=state.progress.completed.length+" / "+scenarios.length+" ✓";
  const recommended=recommendedScenario();
  $("recommendedLabel").textContent="Con "+recommended.name+" · "+recommended.situation;
  renderScenarios();
}
function renderScenarios(){
  const query=normalize($("scenarioSearch").value),level=state.progress.lastLevel;
  const list=scenarios.filter(s=>query?normalize(s.situation+" "+s.place+" "+s.name+" "+s.goal).includes(query):s.level===level);
  $("scenarioTitle").textContent=query?"Resultados de búsqueda":"Elige un chat";
  const lvObj=levels.find(l=>l.id===level)||levels[0];
  $("levelBadge").textContent=query?"Todos los niveles":"Nivel "+level+" · "+lvObj.name;
  $("scenarioCount").textContent=list.length?list.length+" chats":"No encontramos esa situación. Prueba con conectores, verbos, familia, compras o salud.";
  $("scenarioGrid").innerHTML=list.map(s=>`<button class="scenario-card" type="button" data-id="${s.id}"><span class="sc-avatar" aria-hidden="true">${s.avatar}</span><span class="sc-main"><strong>${esc(s.name)}</strong><span>${esc(s.situation)}</span><span class="sc-meta">${esc(s.duration)}${s.id.startsWith("taller-")?' · ⭐ Visual':''}${query?' · Nivel '+s.level:''}</span></span>${state.progress.completed.includes(s.id)?'<span class="sc-done" aria-label="Práctica completada">✓</span>':'<span class="sc-arrow" aria-hidden="true">›</span>'}</button>`).join("");
  $("scenarioGrid").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>startScenario(b.dataset.id)));
}
function currentTurn(){
  if(!state.scenario)return null;
  if(state.mode==="ai")return {prompt:state.history.filter(h=>h.role==="assistant").at(-1)?.content||"",model:"",alternatives:[],why:"Expresa tu idea con tus propias palabras."};
  let turn=state.scenario.turns[state.turn];
  if(state.scenario.id==="bus-centro"&&state.turn===5&&state.memory.busStop==="farther")turn={...turn,prompt:"Ya pasamos la plaza. ¿Quieres que te avise cuando estemos cerca de tu paradero?"};
  return turn;
}
function startScenario(id){
  const scenario=scenarios.find(s=>s.id===id);if(!scenario)return;
  ensureEnhancedUI();
  hideModal();stopTyping();state.run++;
  Object.assign(state,{scenario,turn:0,mode:selectedMode(),pending:null,busy:false,history:[],memory:{},accepted:0,attempts:0,hints:0,rewrites:0,notes:new Set(),connectorsUsed:new Set(),usedExample:false,draftInitial:"",samples:[],finished:false,inflightText:""});
  show("screenHome",false);show("screenChat",true);show("reviewActions",false);show("busyStatus",false);closeHelp();
  document.body.classList.add("chat-open");
  $("contactAvatar").textContent=scenario.avatar;$("contactName").textContent=scenario.name;
  $("lessonSituation").textContent=scenario.situation;
  $("messages").innerHTML='<div class="day-chip">💬 Chat visual · escribe libre o toca una opción</div>';
  $("messageInput").value="";autoGrow();
  addMessage("them",scenario.turns[0].prompt,{showCue:true});
  state.history=[{role:"assistant",content:scenario.turns[0].prompt}];
  inputEnabled(true);updateHud();focusComposer();
}
function addMessage(side,text,opts={}){
  const row=document.createElement("div");row.className="msg-row "+side;
  const label=side==="me"?"Tú":"Personaje simulado";
  const time=new Date().toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"});
  let cueHtml="";
  if(side==="them"&&opts.showCue){
    const cue=questionIconForPrompt(text);
    cueHtml=`<div class="msg-cue" aria-label="Tipo de pregunta"><span aria-hidden="true">${cue.icon}</span> ${esc(cue.label)}</div>`;
  }
  row.innerHTML=`<div class="msg-bubble"><span class="sr-only">${label}: </span>${esc(text)}${cueHtml}<span class="msg-meta"><span>${esc(time)}</span>${side==="me"?'<span class="msg-check" aria-hidden="true">✓✓</span><span class="sr-only">Mensaje de práctica</span>':""}</span></div>`;
  $("messages").appendChild(row);scrollBottom();return row;
}
function addNotice(text){const el=document.createElement("p");el.className="chat-notice";el.textContent=text;$("messages").appendChild(el);scrollBottom();}
function updateHud(){
  const total=state.mode==="ai"?8:state.scenario?.turns.length||1;
  $("contactStatus").textContent=state.mode==="ai"?"IA local · simulación experimental":"En línea · chat de práctica";
  $("turnCounter").textContent=Math.min(state.mode==="ai"?state.accepted+1:state.turn+1,total)+" / "+total;
  $("lessonProgress").style.width=Math.min(100,(state.mode==="ai"?state.accepted:state.turn)/total*100)+"%";
  $("lessonScore").textContent="✍️ "+state.accepted+" respuestas practicadas";
  const turn=currentTurn();
  const focusBadge=$("grammarFocusBadge");
  const formulaBox=$("visualFormulaBox");
  if(focusBadge){
    if(turn?.focus?.badge&&state.mode==="guided"){
      focusBadge.textContent=turn.focus.badge;
      focusBadge.classList.remove("hidden");
    }else{
      focusBadge.classList.add("hidden");
    }
  }
  if(formulaBox){
    if(turn&&state.mode==="guided"){
      formulaBox.textContent=visualFormulaForTurn(turn);
      formulaBox.classList.remove("hidden");
    }else{
      formulaBox.classList.add("hidden");
    }
  }
  $("smartTipText").textContent=turn?(turn.focus?.rule||responseGuide(turn).aim):"Práctica completada.";
  $("composerNote").textContent="Toca 🔗 conectores o 💬 opciones, o escribe tu propia frase.";
  const reviewing=!!state.pending||state.finished;
  ["stepRead","stepWrite","stepReview"].forEach((id,i)=>{
    const active=reviewing?i===2:i===1;
    $(id).classList.toggle("active",active);$(id).classList.toggle("done",reviewing?i<2:i===0);
    if(active)$(id).setAttribute("aria-current","step");else $(id).removeAttribute("aria-current");
  });
  const canWrite=!state.pending&&!state.finished&&!state.busy;
  show("composerWrap",canWrite);
  show("smartBar",canWrite);
  if(canWrite&&turn)renderQuickOptions(turn);
  else updateQuickOptionsVisibility();
}
function addReview(result,turn,ai){
  const el=document.createElement("section");el.className="ai-note";el.setAttribute("aria-label","Corrección visual de tu mensaje");
  const communication=communicationFeedback(result.original,turn);
  const proposal=ai?.suggestion||result.improved;
  const different=proposal!==result.original&&!!proposal;
  const mechanics=result.notes.filter(n=>!["focus","clarity"].includes(n.kind));
  const clarityNote=result.notes.find(n=>n.kind==="clarity");

  const praisesHTML=(result.praises||[]).map(p=>`<div class="praise-pill">✅ <strong>${esc(p.label)}</strong> ${esc(p.text)}</div>`).join("");
  const allGoodHTML=(!different&&!clarityNote&&!ai)?`<div class="praise-pill">✅ <strong>¡Muy bien escrito!</strong> Tu oración es clara y natural.</div>`:"";

  // Diff visual palabra por palabra
  let compareHTML="";
  if(different){
    const diffObj=ai?{beforeHTML:esc(result.original),afterHTML:esc(proposal)}:(result.diff||{beforeHTML:esc(result.original),afterHTML:esc(proposal)});
    compareHTML=`<div class="coach-compare">
      <div class="coach-line coach-before"><small>❌ TU MENSAJE</small><span>${diffObj.beforeHTML}</span></div>
      <div class="coach-line coach-improved"><small>✅ FORMA CORREGIDA</small><span>${diffObj.afterHTML}</span></div>
    </div>
    <button class="text-button edit-proposal" type="button">✍️ Usar corrección y editar</button>`;
  }

  const mechanicsHTML=mechanics.length
    ? `<ul class="grammar-list">${mechanics.map(n=>`<li class="grammar-item"><span class="grammar-badge">${esc(n.category||"✏️ Ajuste")}</span><div class="grammar-body">${n.formula?`<div class="grammar-formula">${esc(n.formula)}</div>`:""}<div class="grammar-desc"><b>${esc(n.label)}:</b> ${esc(n.text)}</div></div></li>`).join("")}</ul>`
    : "";
  const aiExplHTML=ai?.explanation?`<p class="grammar-explanation">${esc(ai.explanation)}</p>`:"";
  const clarityHTML=clarityNote?`<div class="response-focus"><b>👀 ${esc(communication.label)}</b><p>${esc(communication.focus)}</p></div>`:"";

  el.innerHTML=`<div class="ai-note-head"><strong>💡 Revisión visual</strong><span>${ai?"IA local":"Español L2"}</span></div>
    ${praisesHTML}${allGoodHTML}${compareHTML}${mechanicsHTML}${aiExplHTML}${clarityHTML}
    <details class="review-details"><summary>📖 Ver fórmula de este turno</summary><div class="visual-formula inline-formula">${esc(visualFormulaForTurn(turn))}</div><p>${esc(turn.focus?.rule||turn.why||state.scenario.goal)}</p></details>`;
  if(different)el.querySelector(".edit-proposal")?.addEventListener("click",()=>{if(state.pending?.result===result)rewrite(true);});
  $("messages").appendChild(el);scrollBottom();
}
async function sendMessage(){
  const turn=currentTurn(),text=$("messageInput").value.trim().slice(0,600);
  if(!turn||!text||state.busy||state.pending||state.finished)return;
  if(!/[\p{L}\p{N}]/u.test(text)){toast("Escribe alguna palabra para practicar tu mensaje.");return;}
  const run=state.run;state.busy=true;state.inflightText=text;state.attempts++;closeHelp();inputEnabled(false);updateHud();
  addMessage("me",text);$("messageInput").value="";autoGrow();
  const result=review(text,turn);let ai=null;
  if(state.mode==="ai"){
    show("busyStatus",true);$("typingLabel").textContent="Revisando tu mensaje…";show("typingIndicator",true);
    try{ai=parseAI(await localAI.reply(state.scenario,[...state.history,{role:"user",content:text}]));}
    catch(_){
      if(run!==state.run)return;
      disableLocalAI();state.mode="guided";state.turn=Math.min(state.turn,state.scenario.turns.length-1);
      addNotice("La IA local no pudo responder. Revisaremos este mensaje de forma local y retomaremos la práctica.");
    }
  }
  if(run!==state.run||!state.scenario)return;
  stopTyping();show("busyStatus",false);state.busy=false;
  state.pending={text,result,ai,proposal:ai?.suggestion||result.improved,usedExample:state.usedExample};state.usedExample=false;
  addReview(result,turn,ai);show("reviewActions",true);updateHud();$("btnContinue").focus();
}
function rewrite(useProposal=false){
  if(!state.pending)return;
  $("messages").querySelectorAll(".edit-proposal").forEach(b=>{b.disabled=true;});
  if(!state.draftInitial)state.draftInitial=state.pending.text;
  const text=useProposal===true?state.pending.proposal:state.pending.text;
  state.usedExample=state.pending.usedExample;state.pending=null;state.rewrites++;
  show("reviewActions",false);$("messageInput").value=text;autoGrow();inputEnabled(true);updateHud();$("messageInput").focus();
}
function continueConversation(){
  const pending=state.pending;if(!pending||!state.scenario||state.busy)return;
  $("messages").querySelectorAll(".edit-proposal").forEach(b=>{b.disabled=true;});
  state.pending=null;show("reviewActions",false);state.accepted++;
  if(state.draftInitial&&state.draftInitial!==pending.text){state.samples.push({before:state.draftInitial,after:pending.text});state.samples=state.samples.slice(-3);}
  state.draftInitial="";
  pending.result.notes.filter(n=>n.kind!=="focus"&&n.kind!=="clarity").forEach(n=>state.notes.add(n.label));
  (pending.result.usedConnectors||[]).forEach(c=>state.connectorsUsed.add(c));
  let done=false,reply="";
  if(state.mode==="ai"&&pending.ai){
    state.history.push({role:"user",content:pending.text},{role:"assistant",content:pending.ai.reply});
    reply=pending.ai.reply;state.turn++;done=state.accepted>=8;
  }else{
    const prevIndex=state.turn;
    const flow=nextGuided(state.scenario,prevIndex,pending.text,state.memory);
    state.turn=flow.next;
    done=state.turn>=state.scenario.turns.length;
    const nextPrompt=done?"":currentTurn().prompt;
    reply=buildContextualReply(state.scenario,prevIndex,pending.text,nextPrompt,done,flow.closing||state.scenario.closing);
  }
  const run=state.run;
  state.busy=true;inputEnabled(false);updateHud();
  const deliver=()=>{
    if(run!==state.run||!state.scenario)return;
    stopTyping();state.busy=false;addMessage("them",reply,{showCue:!done});updateHud();
    if(done)finishScenario();else{inputEnabled(true);focusComposer();}
  };
  if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches){deliver();return;}
  $("typingLabel").textContent=state.scenario.name+" está escribiendo…";
  show("typingIndicator",true);scrollBottom();replyTimer=setTimeout(deliver,620);
}
const PALABRA_ICONO={agua:"💧",casa:"🏠",bus:"🚌",pan:"🍞",hora:"🕒",dni:"🪪",tarjeta:"💳",pagar:"💵",pagare:"💵",pago:"💵",soles:"💵",dinero:"💵",hola:"👋",gracias:"🙏",favor:"🙏",perfecto:"👍",bien:"👍",claro:"✅",correo:"✉️",cita:"📅",fecha:"📅",dia:"📅",dias:"📅",viernes:"📅",sabado:"📅",martes:"📅",manana:"🌅",tarde:"🌇",noche:"🌙",trabajo:"💼",comida:"🍽️",leche:"🥛",tomate:"🍅",medicamentos:"💊",luz:"💡",telefono:"📱",profesora:"👩‍🏫",grupo:"👥",receta:"📋",viajar:"🧳",terminal:"🚏",reserva:"🗓️",mensaje:"💬",documentos:"📄",documento:"📄",informacion:"ℹ️",ayuda:"🙋",plaza:"📍",centro:"📍",llegar:"📍",llegare:"📍",llegue:"📍",estare:"📌",botella:"🍼",tiempo:"⏳",minutos:"⏳",compras:"🛒",comprar:"🛒",entrada:"🎟️",recibo:"🧾",confirmacion:"✅",listo:"✅",ayer:"⏪",ahora:"▶️",despues:"⏩",antes:"⏪",porque:"💡",pero:"⚖️",aunque:"🔄",entonces:"➡️",ademas:"➕",primero:"1️⃣",luego:"2️⃣",finalmente:"🏁"};
function wordBankFor(turn){
  if(!turn?.model)return [];
  const words=turn.model.split(/\s+/).filter(Boolean);
  const seen=new Set(words.map(normalize));
  const extra=[];
  for(const alt of (turn.alternatives||[]).slice(0,2))for(const w of alt.split(/\s+/).filter(Boolean)){
    const n=normalize(w);if(n&&!seen.has(n)&&extra.length<4){seen.add(n);extra.push(w);}
  }
  return [...words,...extra].slice(0,18);
}
function buildWordBank(turn){
  try{return buildWordBankUnsafe(turn);}catch(_){return null;}
}
function buildWordBankUnsafe(turn){
  const words=wordBankFor(turn);if(words.length<2)return null;
  const box=document.createElement("div");box.className="word-bank";
  box.innerHTML=`<strong>🧩 Arma tu mensaje tocando palabras</strong><p>No hace falta escribir: toca en orden.</p>
    <div class="wb-built" aria-live="polite"><span class="wb-empty">Tu mensaje aparece aquí</span></div>
    <div class="wb-actions"><button class="text-button wb-undo" type="button" disabled>↩ Quitar última</button><button class="action-primary wb-use" type="button" disabled>Usar mi mensaje</button></div>
    <div class="wb-chips" role="group" aria-label="Palabras para armar tu mensaje"></div>`;
  const chips=box.querySelector(".wb-chips"),built=box.querySelector(".wb-built"),undo=box.querySelector(".wb-undo"),use=box.querySelector(".wb-use");
  const picked=[];
  words.forEach((w,i)=>{
    const icon=PALABRA_ICONO[normalize(w).split(" ")[0]]||"";
    const b=document.createElement("button");b.type="button";b.className="wb-chip"+(icon?" has-icon":"");b.dataset.i=i;
    b.innerHTML=(icon?`<span class="wb-icon" aria-hidden="true">${icon}</span>`:"")+`<span class="wb-word">${esc(w.replace(/^[¿¡]+/,""))}</span>`;
    chips.appendChild(b);
  });
  function text(){return picked.map(i=>words[i]).join(" ").replace(/\s+/g," ").trim();}
  function refresh(){
    built.innerHTML="";
    if(!picked.length){built.innerHTML='<span class="wb-empty">Tu mensaje aparece aquí</span>';}
    picked.forEach((i,pos)=>{
      const pill=document.createElement("button");pill.type="button";pill.className="wb-pill";pill.textContent=words[i].replace(/^[¿¡]+/,"");
      pill.setAttribute("aria-label","Quitar "+words[i]);
      pill.addEventListener("click",()=>{picked.splice(pos,1);refresh();});
      built.appendChild(pill);
    });
    chips.querySelectorAll(".wb-chip").forEach(c=>{const used=picked.includes(Number(c.dataset.i));c.disabled=used;c.classList.toggle("used",used);});
    undo.disabled=!picked.length;use.disabled=!picked.length;
  }
  chips.addEventListener("click",e=>{
    const c=e.target.closest(".wb-chip");if(!c||c.disabled)return;
    picked.push(Number(c.dataset.i));refresh();
  });
  undo.addEventListener("click",()=>{picked.pop();refresh();});
  use.addEventListener("click",()=>{if(picked.length)fillExample(text());});
  return box;
}
function openHelp(){
  const turn=currentTurn();if(!turn||state.busy||state.pending||state.finished)return;
  state.hints++;
  const guide=responseGuide(turn);
  const starters=guide.kind==="confirm"?["Sí, porque ","No, pero ","Todavía no "]:[guide.starter||"Quisiera "];
  const formulaHtml=`<div class="visual-formula inline-formula">${esc(visualFormulaForTurn(turn))}</div>`;
  $("wildcardOptions").innerHTML=`<p class="help-prompt">${esc(turn.prompt)}</p>${formulaHtml}<div><strong>✍️ Empieza así</strong><div class="starter-actions">${starters.map(t=>`<button class="action-secondary use-starter" type="button">${esc(t)}…</button>`).join("")}<button class="text-button show-examples" type="button" aria-expanded="false">Ver ejemplos</button></div></div><div id="helpExamples" class="help-examples hidden"></div>`;
  if(state.mode==="guided"){const bank=buildWordBank(turn);if(bank)$("wildcardOptions").insertBefore(bank,$("helpExamples"));}
  $("wildcardOptions").querySelectorAll(".use-starter").forEach((b,i)=>b.addEventListener("click",()=>fillExample(starters[i])));
  const examplesButton=$("wildcardOptions").querySelector(".show-examples");
  examplesButton.addEventListener("click",()=>{
    let examples=state.mode==="guided"?[turn.model,...(turn.alternatives||[])].slice(0,3):["Quisiera que me expliques un poco más.","No, gracias, pero prefiero otra opción."];
    if(guide.kind==="confirm"&&!examples.some(t=>/^no\b/i.test(t)))examples=[examples[0],/quieres|quiere|desea|acepta/.test(normalize(turn.prompt))?"No, gracias.":"No.","Todavía no lo sé."];
    const hl=turn.focus?.highlight||[];
    $("helpExamples").innerHTML='<p>Toca un ejemplo para usarlo o cambiarlo:</p>'+examples.map(t=>`<button class="wildcard-option" type="button">${highlightFocusWords(t,hl)}</button>`).join("");
    $("helpExamples").querySelectorAll("button").forEach((b,i)=>b.addEventListener("click",()=>fillExample(examples[i])));
    show("helpExamples",true);examplesButton.setAttribute("aria-expanded","true");$("helpExamples").querySelector("button")?.focus();
  });
  show("wildcardPanel",true);show("composerWrap",false);show("smartBar",false);show("quickOptionsBar",false);
  $("btnWildcard").setAttribute("aria-expanded","true");$("btnCloseWildcard").focus();
}
function fillExample(text){
  if(!$("messageInput").value.trim()){$("messageInput").value=text;state.usedExample=true;closeHelp();autoGrow();$("messageInput").focus();return;}
  showModal("✎","Ya tienes un mensaje escrito",`<p>¿Quieres conservarlo o cambiarlo por este ejemplo?</p><p class="draft-example">${esc(text)}</p>`,[
    {label:"Conservar mi mensaje",action:hideModal},
    {label:"Usar el ejemplo",secondary:true,action:()=>{$("messageInput").value=text;state.usedExample=true;hideModal();closeHelp();autoGrow();$("messageInput").focus();}}
  ]);
}
function closeHelp(){
  show("wildcardPanel",false);$("btnWildcard").setAttribute("aria-expanded","false");
  const writing=!!state.scenario&&!state.pending&&!state.busy&&!state.finished;
  show("composerWrap",writing);show("smartBar",writing);
  updateQuickOptionsVisibility();
}
function finishScenario(){
  state.finished=true;updateHud();inputEnabled(false);$("lessonProgress").style.width="100%";
  if(!state.progress.completed.includes(state.scenario.id))state.progress.completed.push(state.scenario.id);
  saveProgress();
  const topics=[...state.notes];
  const conns=[...state.connectorsUsed];
  const sample=state.samples.at(-1);
  const connsHtml=conns.length?`<p><b>🔗 Conectores que usaste:</b> ${conns.map(c=>`<span class="hl-grammar">${esc(c)}</span>`).join(" ")}</p>`:"";
  const learningSample=sample?`<div class="summary-example"><b>✨ Tu mejora en este chat</b><div class="coach-line coach-before"><small>❌ ANTES</small><span>${esc(sample.before)}</span></div><div class="coach-line coach-improved"><small>✅ DESPUÉS</small><span>${esc(sample.after)}</span></div></div>`:"";
  showModal("🎉","¡Chat completado!",`<p>Practicaste <strong>${esc(state.scenario.situation)}</strong>.</p><div class="result-grid"><div class="result-box"><strong>${state.accepted}</strong><span>💬 respuestas</span></div><div class="result-box"><strong>${conns.length}</strong><span>🔗 conectores</span></div><div class="result-box"><strong>${state.rewrites}</strong><span>✨ mejoras</span></div></div>${connsHtml}<p><b>Para repasar:</b> ${esc(topics.length?topics.join(", ")+".":"¡Excelente! Tus oraciones estuvieron muy claras.")}</p>${learningSample}`,[
    {label:"Elegir otra conversación",action:backHome},{label:"Repetir este chat",secondary:true,action:()=>startScenario(state.scenario.id)}
  ]);
}
function backHome(){
  stopTyping();state.run++;state.scenario=null;state.pending=null;state.history=[];state.memory={};state.notes.clear();state.connectorsUsed.clear();state.busy=false;state.samples=[];state.draftInitial="";state.finished=false;state.inflightText="";
  if(!$("busyStatus").classList.contains("hidden"))disableLocalAI();
  else localAI.reset();
  hideModal();closeHelp();show("reviewActions",false);show("busyStatus",false);show("quickOptionsBar",false);show("screenChat",false);show("screenHome",true);
  document.body.classList.remove("chat-open");$("messages").innerHTML="";$("messageInput").value="";autoGrow();inputEnabled(true);renderHome();$("scenarioTitle").setAttribute("tabindex","-1");$("scenarioTitle").focus({preventScroll:true});
}
function showModal(icon,title,html,actions=[]){
  modalFocus=document.activeElement;
  $("modalIcon").textContent=icon;$("modalTitle").textContent=title;$("modalBody").innerHTML=html;$("modalActions").innerHTML="";
  actions.forEach(action=>{const b=document.createElement("button");b.type="button";b.className=action.secondary?"modal-secondary":"modal-primary";b.textContent=action.label;b.addEventListener("click",action.action);$("modalActions").appendChild(b);});
  show("modal",true);$("screenHome").inert=true;$("screenChat").inert=true;$("modalClose").focus();
}
function hideModal(){
  const wasOpen=!$("modal").classList.contains("hidden");show("modal",false);$("screenHome").inert=false;$("screenChat").inert=false;
  if(wasOpen&&modalFocus?.isConnected&&!modalFocus.disabled)modalFocus.focus();
}
function showHelpModal(){
  showModal("💬","Cómo funciona",'<ol class="help-steps"><li><span aria-hidden="true">👀</span><div><b>1. Mira el símbolo y la fórmula</b><small>Cada mensaje te muestra qué te preguntan (🕒 hora, 📍 lugar, 💡 motivo).</small></div></li><li><span aria-hidden="true">✍️</span><div><b>2. Elige opción, conecta o escribe tú</b><small>Usa 💬 Opciones, 🧩 Armar palabras o 🔗 conectores rápidos.</small></div></li><li><span aria-hidden="true">✅</span><div><b>3. Mira qué cambió en colores</b><small>Rojo = ajustar · Verde = forma correcta. Sin audio, a tu ritmo.</small></div></li></ol>',[
    {label:"📖 Ver guía visual",secondary:true,action:showVisualGuideModal},
    {label:"Entendido",action:hideModal}
  ]);
}
function showScenarioInfo(){
  if(!state.scenario)return;
  showModal(state.scenario.avatar,"Tu conversación",`<p><b>Objetivo:</b> ${esc(state.scenario.goal)}</p><p>Es una simulación visual para practicar español escrito. Nadie recibe tus mensajes.</p>`,[
    {label:"📖 Guía visual",secondary:true,action:showVisualGuideModal},
    {label:"Seguir conversando",action:hideModal},
    {label:"Salir al listado",secondary:true,action:backHome}
  ]);
}
async function activateLocalAI(){
  if(state.loadingAI||localAI.isReady())return;
  const run=++activation;state.loadingAI=true;$("btnActivateAI").disabled=true;show("btnStopAI",true);
  $("aiStatus").textContent="Comprobando si tu navegador permite IA local…";
  try{
    await localAI.activate(text=>{if(run===activation)$("aiStatus").textContent=text;});
    if(run!==activation)return;
    $("modeAI").disabled=false;chooseMode("ai");$("aiStatus").textContent="IA local lista. Elige una situación para practicar.";
    $("btnActivateAI").textContent="IA local activada";renderHome();
  }catch(error){
    if(run!==activation)return;
    $("aiStatus").textContent=error.message+" La práctica guiada sigue disponible.";$("btnActivateAI").disabled=false;show("btnStopAI",false);chooseMode("guided");
  }finally{if(run===activation)state.loadingAI=false;}
}
function disableLocalAI(){
  activation++;localAI.stop();state.loadingAI=false;$("modeAI").disabled=true;chooseMode("guided");
  $("btnActivateAI").disabled=false;$("btnActivateAI").textContent="Descargar y activar IA local";show("btnStopAI",false);
  $("aiStatus").textContent="IA local desactivada. La práctica guiada está disponible.";renderHome();
}
function cancelResponse(){
  if(!state.busy)return;
  const text=state.inflightText;
  stopTyping();state.run++;state.busy=false;disableLocalAI();state.mode="guided";
  show("busyStatus",false);addNotice("Respuesta cancelada. Seguimos con práctica guiada. Pregunta: "+currentTurn().prompt);
  $("messageInput").value=text;autoGrow();inputEnabled(true);updateHud();$("messageInput").focus();
}
$("btnStartRecommended").addEventListener("click",()=>startScenario(recommendedScenario().id));
function syncViewport(){
  if(!window.visualViewport)return;
  document.documentElement.style.setProperty("--chat-height",window.visualViewport.height+"px");
  document.documentElement.style.setProperty("--chat-top",window.visualViewport.offsetTop+"px");
}
window.visualViewport?.addEventListener("resize",syncViewport);
window.visualViewport?.addEventListener("scroll",syncViewport);
syncViewport();
document.querySelectorAll('input[name="practiceMode"]').forEach(el=>el.addEventListener("change",renderHome));
$("btnActivateAI").addEventListener("click",activateLocalAI);
$("btnStopAI").addEventListener("click",disableLocalAI);
$("btnCancelResponse").addEventListener("click",cancelResponse);
$("scenarioSearch").addEventListener("input",renderScenarios);
$("btnBackLspedia").addEventListener("click",()=>{localAI.stop();if(window.LSPediaVolver)LSPediaVolver("../?vista=herramientas");else location.href="../?vista=herramientas";});
$("btnHelp").addEventListener("click",showHelpModal);
$("btnChatBack").addEventListener("click",()=>{
  if(state.accepted||state.pending||$("messageInput").value.trim())showModal("↩","Volver a las situaciones","<p>Al salir se borran los mensajes de esta práctica. Las situaciones ya completadas se conservan.</p>",[{label:"Seguir conversando",action:hideModal},{label:"Volver a situaciones",secondary:true,action:backHome}]);
  else backHome();
});
$("btnChatMenu").addEventListener("click",showScenarioInfo);
$("btnWildcard").setAttribute("aria-controls","wildcardPanel");
$("btnWildcard").addEventListener("click",openHelp);
$("btnCloseWildcard").addEventListener("click",()=>{closeHelp();$("messageInput").focus();});
$("btnSend").addEventListener("click",sendMessage);
$("btnRewrite").addEventListener("click",rewrite);
$("btnContinue").addEventListener("click",continueConversation);
$("messageInput").addEventListener("input",autoGrow);
$("messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendMessage();}});
$("modalClose").addEventListener("click",hideModal);
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))hideModal();});
document.addEventListener("keydown",e=>{
  if(!$("modal").classList.contains("hidden")){
    if(e.key==="Escape"){e.preventDefault();hideModal();}
    if(e.key==="Tab"){
      const controls=Array.from($("modal").querySelectorAll('button:not(:disabled),a[href],input,textarea,[tabindex="0"]'));
      const first=controls[0],last=controls.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
  }else if(e.key==="Escape"&&!$("wildcardPanel").classList.contains("hidden")){closeHelp();$("messageInput").focus();}
});
$("btnResetProgress").addEventListener("click",()=>showModal("↺","Borrar mi progreso",'<p>Se borrarán las prácticas marcadas como completadas en este navegador.</p>',[{label:"Conservar progreso",action:hideModal},{label:"Borrar progreso",secondary:true,action:()=>{state.progress=safeProgress(null,scenarios.map(s=>s.id),levels.length);saveProgress();hideModal();renderHome();toast("Progreso borrado.");}}]));
window.addEventListener("pageshow",()=>{if(!localAI.isReady()){$("modeAI").disabled=true;chooseMode("guided");if(state.scenario&&state.mode==="ai"){state.mode="guided";updateHud();}}});
ensureEnhancedUI();
renderHome();
})();
