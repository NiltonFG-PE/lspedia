/* LSPedia: práctica gratuita. No hay backend, API de pago ni envío de mensajes. */
(() => {
"use strict";
const $=id=>document.getElementById(id);
const {normalize,escapeHTML:esc,review,nextGuided,parseAI,safeProgress,responseGuide,communicationFeedback}=window.LSPChatCore;
const {levels,scenarios}=window.LSPChatData;
const localAI=window.LSPChatLocal;
const STORAGE_KEY="lspedia_chat_espanol_v1";
const state={scenario:null,turn:0,mode:"guided",run:0,busy:false,pending:null,history:[],memory:{},accepted:0,attempts:0,hints:0,rewrites:0,notes:new Set(),usedExample:false,progress:loadProgress(),loadingAI:false,draftInitial:"",samples:[],finished:false,inflightText:""};
let modalFocus=null, activation=0, replyTimer=null;
function stopTyping(){clearTimeout(replyTimer);replyTimer=null;show("typingIndicator",false);}
function focusComposer(){const target=window.matchMedia?.("(pointer: coarse)").matches?$("messages"):$("messageInput");target.focus({preventScroll:true});}
function loadProgress(){
  try{return safeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}"),scenarios.map(s=>s.id));}
  catch(_){return safeProgress(null,scenarios.map(s=>s.id));}
}
function saveProgress(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.progress));}catch(_){toast("Tu navegador no guardó el progreso. Puedes seguir practicando.");}}
function show(id,visible){$(id).classList.toggle("hidden",!visible);}
function toast(text){$("toast").textContent=text;$("toast").classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>$("toast").classList.remove("show"),3500);}
function scrollBottom(){requestAnimationFrame(()=>$("messages").scrollTo({top:$("messages").scrollHeight,behavior:window.matchMedia?.("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"}));}
function autoGrow(){const el=$("messageInput");el.style.height="auto";el.style.height=Math.min(el.scrollHeight,118)+"px";$("charCount").textContent=el.value.length+"/600";}
function inputEnabled(enabled){$("messageInput").disabled=!enabled;$("btnSend").disabled=!enabled;$("btnWildcard").disabled=!enabled;}
function chooseMode(value){document.querySelectorAll('input[name="practiceMode"]').forEach(el=>{el.checked=el.value===value;});}
function selectedMode(){return document.querySelector('input[name="practiceMode"]:checked')?.value==="ai"&&localAI.isReady()?"ai":"guided";}
function recommendedScenario(){
  const list=scenarios.filter(s=>s.level===state.progress.lastLevel);
  return list.find(s=>!state.progress.completed.includes(s.id))||list[0];
}
function renderHome(){
  $("levelGrid").innerHTML=levels.map(l=>`<button class="level-card ${l.id===state.progress.lastLevel?"active":""}" data-level="${l.id}" aria-pressed="${l.id===state.progress.lastLevel}" type="button"><span class="level-icon" aria-hidden="true">${esc(l.icon)}</span><span class="level-no">Nivel ${l.id}</span><span class="sr-only">${esc(l.name)}. ${esc(l.desc)}</span></button>`).join("");
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
  $("levelBadge").textContent=query?"Todos los niveles":"Nivel "+level+" · "+levels.find(l=>l.id===level).name;
  $("scenarioCount").textContent=list.length?list.length+" chats":"No encontramos esa situación. Prueba con familia, compras, trabajo o salud.";
  $("scenarioGrid").innerHTML=list.map(s=>`<button class="scenario-card" type="button" data-id="${s.id}"><span class="sc-avatar" aria-hidden="true">${s.avatar}</span><span class="sc-main"><strong>${esc(s.name)}</strong><span>${esc(s.situation)}</span><span class="sc-meta">${esc(s.duration)}${query?' · Nivel '+s.level:''}</span></span>${state.progress.completed.includes(s.id)?'<span class="sc-done" aria-label="Práctica completada">✓</span>':'<span class="sc-arrow" aria-hidden="true">›</span>'}</button>`).join("");
  $("scenarioGrid").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>startScenario(b.dataset.id)));
}
function currentTurn(){
  if(!state.scenario)return null;
  if(state.mode==="ai")return {prompt:state.history.filter(h=>h.role==="assistant").at(-1)?.content||"",model:"",alternatives:[],why:"Expresa tu idea con tus propias palabras. Puedes aceptar, rechazar o pedir una aclaración."};
  let turn=state.scenario.turns[state.turn];
  if(state.scenario.id==="bus-centro"&&state.turn===5&&state.memory.busStop==="farther")turn={...turn,prompt:"Ya pasamos la plaza. ¿Quieres que te avise cuando estemos cerca de tu paradero?"};
  return turn;
}
function startScenario(id){
  const scenario=scenarios.find(s=>s.id===id);if(!scenario)return;
  hideModal();stopTyping();state.run++;
  Object.assign(state,{scenario,turn:0,mode:selectedMode(),pending:null,busy:false,history:[],memory:{},accepted:0,attempts:0,hints:0,rewrites:0,notes:new Set(),usedExample:false,draftInitial:"",samples:[],finished:false,inflightText:""});
  show("screenHome",false);show("screenChat",true);show("reviewActions",false);show("busyStatus",false);closeHelp();
  document.body.classList.add("chat-open");
  $("contactAvatar").textContent=scenario.avatar;$("contactName").textContent=scenario.name;
  $("lessonSituation").textContent=scenario.situation;
  $("messages").innerHTML='<div class="day-chip">💬 Práctica · nadie recibe tus mensajes</div>';
  $("messageInput").value="";autoGrow();
  
  addMessage("them",scenario.turns[0].prompt);
  state.history=[{role:"assistant",content:scenario.turns[0].prompt}];
  inputEnabled(true);updateHud();focusComposer();
}
function addMessage(side,text){
  const row=document.createElement("div");row.className="msg-row "+side;
  const label=side==="me"?"Tú":"Personaje simulado";
  const time=new Date().toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"});
  row.innerHTML=`<div class="msg-bubble"><span class="sr-only">${label}: </span>${esc(text)}<span class="msg-meta"><span>${esc(time)}</span>${side==="me"?'<span class="msg-check" aria-hidden="true">✓✓</span><span class="sr-only">Mensaje de práctica</span>':""}</span></div>`;
  $("messages").appendChild(row);scrollBottom();return row;
}
function addNotice(text){const el=document.createElement("p");el.className="chat-notice";el.textContent=text;$("messages").appendChild(el);scrollBottom();}
function updateHud(){
  const total=state.mode==="ai"?8:state.scenario?.turns.length||1;
  $("contactStatus").textContent=state.mode==="ai"?"IA local · simulación experimental":"Chat de práctica · personaje simulado";
  $("turnCounter").textContent=Math.min(state.mode==="ai"?state.accepted+1:state.turn+1,total)+" / "+total;
  $("lessonProgress").style.width=Math.min(100,(state.mode==="ai"?state.accepted:state.turn)/total*100)+"%";
  $("lessonScore").textContent="✍️ "+state.accepted+" respuestas practicadas";
  const turn=currentTurn();
  $("smartTipText").textContent=turn?responseGuide(turn).aim:"Práctica completada.";
  $("composerNote").textContent="Escribe a tu manera. Luego revisamos juntos.";
  const reviewing=!!state.pending||state.finished;
  ["stepRead","stepWrite","stepReview"].forEach((id,i)=>{
    const active=reviewing?i===2:i===1;
    $(id).classList.toggle("active",active);$(id).classList.toggle("done",reviewing?i<2:i===0);
    if(active)$(id).setAttribute("aria-current","step");else $(id).removeAttribute("aria-current");
  });
  show("composerWrap",!state.pending&&!state.finished&&!state.busy);
  show("smartBar",!state.pending&&!state.finished&&!state.busy);
}
function addReview(result,turn,ai){
  const el=document.createElement("section");el.className="ai-note";el.setAttribute("aria-label","Ayuda para mejorar tu respuesta");
  const communication=communicationFeedback(result.original,turn);
  const proposal=ai?.suggestion||result.improved;
  const different=proposal!==result.original&&!!proposal;
  const mechanics=result.notes.filter(n=>!["focus","clarity"].includes(n.kind));
  const explanation=ai?ai.explanation:(mechanics[0]?.text||"");
  el.innerHTML=`<div class="ai-note-head"><strong>💡 Una ayuda</strong><span>${ai?"IA local · Experimental":"Ayuda paso a paso"}</span></div>
    <div class="response-focus"><b>${esc(communication.label)}</b><p>${esc(communication.focus)}</p></div>
    ${different?`<div class="coach-compare"><div class="coach-line coach-improved"><small>PUEDES ESCRIBIR ASÍ</small><span>${esc(proposal)}</span></div></div>`:""}
    ${different?'<button class="text-button edit-proposal" type="button">✍️ Usar y editar</button>':""}
    <details class="review-details"><summary>¿Por qué?</summary>${explanation?`<p>${esc(explanation)}</p>`:""}<p>${esc(turn.why||state.scenario.goal)}</p><p>La revisión es una ayuda, no una calificación. Comprueba que tu respuesta conserve tu idea.</p></details>`;
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
      addNotice("La IA local no pudo responder. Revisaremos este mensaje de forma básica y luego retomaremos el guion de la práctica.");
    }
  }
  if(run!==state.run||!state.scenario)return;
  stopTyping();show("busyStatus",false);state.busy=false;
  state.pending={text,result,ai,proposal:ai?.suggestion||result.improved,usedExample:state.usedExample};state.usedExample=false;
  addReview(result,turn,ai);show("reviewActions",true);updateHud();$("btnRewrite").focus();
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
  let done=false,reply="";
  if(state.mode==="ai"&&pending.ai){
    state.history.push({role:"user",content:pending.text},{role:"assistant",content:pending.ai.reply});
    reply=pending.ai.reply;state.turn++;done=state.accepted>=8;
  }else{
    const flow=nextGuided(state.scenario,state.turn,pending.text,state.memory);state.turn=flow.next;
    done=state.turn>=state.scenario.turns.length;
    reply=done?(flow.closing||state.scenario.closing):currentTurn().prompt;
  }
  const run=state.run;
  state.busy=true;inputEnabled(false);updateHud();
  const deliver=()=>{
    if(run!==state.run||!state.scenario)return;
    stopTyping();state.busy=false;addMessage("them",reply);updateHud();
    if(done)finishScenario();else{inputEnabled(true);focusComposer();}
  };
  // La animación es breve y se cancela al salir o cambiar de práctica.
  if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches){deliver();return;}
  $("typingLabel").textContent=state.scenario.name+" está escribiendo…";
  show("typingIndicator",true);scrollBottom();replyTimer=setTimeout(deliver,650);
}
function openHelp(){
  const turn=currentTurn();if(!turn||state.busy||state.pending||state.finished)return;
  state.hints++;
  const guide=responseGuide(turn);
  const starters=guide.kind==="confirm"?["Sí, ","No, ","Todavía no "]:[guide.starter||"Quisiera "];
  $("wildcardOptions").innerHTML=`<p class="help-prompt">${esc(turn.prompt)}</p><div class="help-aim"><strong>👀 Te preguntan</strong><p>${esc(guide.aim)}</p></div><div><strong>✍️ Empieza así</strong><p>Toca una frase y complétala.</p><div class="starter-actions">${starters.map(t=>`<button class="action-secondary use-starter" type="button">${esc(t)}…</button>`).join("")}<button class="text-button show-examples" type="button" aria-expanded="false">Ver ejemplos</button></div></div><div id="helpExamples" class="help-examples hidden"></div>`;
  $("wildcardOptions").querySelectorAll(".use-starter").forEach((b,i)=>b.addEventListener("click",()=>fillExample(starters[i])));
  const examplesButton=$("wildcardOptions").querySelector(".show-examples");
  examplesButton.addEventListener("click",()=>{
    let examples=state.mode==="guided"?[turn.model,...(turn.alternatives||[])].slice(0,3):["Quisiera que me expliques un poco más.","No, gracias. Prefiero otra opción."];
    if(guide.kind==="confirm"&&!examples.some(t=>/^no\b/i.test(t)))examples=[examples[0],/quieres|quiere|desea|acepta/.test(normalize(turn.prompt))?"No, gracias.":"No.","Todavía no lo sé."];
    $("helpExamples").innerHTML='<p>Elige un ejemplo. Puedes cambiarlo.</p>'+examples.map(t=>`<button class="wildcard-option" type="button">${esc(t)}</button>`).join("");
    $("helpExamples").querySelectorAll("button").forEach((b,i)=>b.addEventListener("click",()=>fillExample(examples[i])));
    show("helpExamples",true);examplesButton.setAttribute("aria-expanded","true");$("helpExamples").querySelector("button")?.focus();
  });
  show("wildcardPanel",true);show("composerWrap",false);show("smartBar",false);$("btnWildcard").setAttribute("aria-expanded","true");$("btnCloseWildcard").focus();
}
function fillExample(text){
  if(!$("messageInput").value.trim()){$("messageInput").value=text;state.usedExample=true;closeHelp();autoGrow();$("messageInput").focus();return;}
  showModal("✎","Ya tienes un mensaje escrito",`<p>¿Quieres conservarlo o cambiarlo por este ejemplo para editarlo?</p><p class="draft-example">${esc(text)}</p>`,[
    {label:"Conservar mi mensaje",action:hideModal},
    {label:"Usar el ejemplo",secondary:true,action:()=>{$("messageInput").value=text;state.usedExample=true;hideModal();closeHelp();autoGrow();$("messageInput").focus();}}
  ]);
}
function closeHelp(){
  show("wildcardPanel",false);$("btnWildcard").setAttribute("aria-expanded","false");
  const writing=!!state.scenario&&!state.pending&&!state.busy&&!state.finished;
  show("composerWrap",writing);show("smartBar",writing);
}
function finishScenario(){
  state.finished=true;updateHud();inputEnabled(false);$("lessonProgress").style.width="100%";
  if(!state.progress.completed.includes(state.scenario.id))state.progress.completed.push(state.scenario.id);
  saveProgress();
  const topics=[...state.notes];
  const sample=state.samples.at(-1);
  const learningSample=sample?`<div class="summary-example"><b>Una respuesta que volviste a escribir</b><div class="coach-line"><small>ANTES</small><span>${esc(sample.before)}</span></div><div class="coach-line coach-improved"><small>DESPUÉS</small><span>${esc(sample.after)}</span></div><p>Compara: ¿tu segunda versión expresa mejor lo que querías decir?</p></div>`:"";
  showModal("✓","Práctica completada",`<p>Practicaste <strong>${esc(state.scenario.situation)}</strong>.</p><div class="result-grid"><div class="result-box"><strong>${state.accepted}</strong><span>respuestas practicadas</span></div><div class="result-box"><strong>${state.rewrites}</strong><span>reintentos</span></div><div class="result-box"><strong>${state.hints}</strong><span>ayudas consultadas</span></div></div><p><b>Objetivo:</b> ${esc(state.scenario.goal)}</p><p><b>Para repasar:</b> ${esc(topics.length?topics.join(", ")+".":"Lee tus mensajes y comprueba si expresan lo que querías comunicar.")}</p>${learningSample}<p>Para tu próxima conversación: responde a la pregunta, añade un dato útil y lee tu mensaje antes de enviarlo.</p>`,[
    {label:"Elegir otra situación",action:backHome},{label:"Repetir esta práctica",secondary:true,action:()=>startScenario(state.scenario.id)}
  ]);
}
function backHome(){
  stopTyping();state.run++;state.scenario=null;state.pending=null;state.history=[];state.memory={};state.notes.clear();state.busy=false;state.samples=[];state.draftInitial="";state.finished=false;state.inflightText="";
  if(!$("busyStatus").classList.contains("hidden"))disableLocalAI();
  else localAI.reset();
  hideModal();closeHelp();show("reviewActions",false);show("busyStatus",false);show("screenChat",false);show("screenHome",true);
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
  showModal("💬","Así se practica",'<ol class="help-steps"><li><span aria-hidden="true">👀</span><div><b>1. Mira el mensaje</b><small>Elige un chat: mamá, un amigo, una tienda…</small></div></li><li><span aria-hidden="true">✍️</span><div><b>2. Escribe y envía</b><small>Una frase corta está bien. Puedes tocar 💡 Pista.</small></div></li><li><span aria-hidden="true">✅</span><div><b>3. Revisa a tu ritmo</b><small>Toca Editar para cambiar tu mensaje o Continuar.</small></div></li></ol><p>Es una práctica. Nadie recibe tus mensajes. No necesitas escuchar audio.</p><details><summary>Más información</summary><p>La LSP tiene su propia gramática. Aquí practicamos español escrito. Los niveles organizan situaciones; no califican tu capacidad. La guía y la IA opcional pueden equivocarse.</p><p>Usa datos inventados. Solo guardamos prácticas completadas y el último nivel. Los mensajes se borran al salir. La IA opcional necesita una descarga y procesa mensajes en tu equipo.</p></details>',[{label:"Entendido",action:hideModal}]);
}
function showScenarioInfo(){
  if(!state.scenario)return;
  showModal(state.scenario.avatar,"Tu práctica",`<p><b>Objetivo:</b> ${esc(state.scenario.goal)}</p><p><b>Modo:</b> ${state.mode==="ai"?"IA local experimental":"Guion y revisión básica"}.</p><p>Es una simulación de escritura. No estás enviando mensajes a una persona ni realizando trámites reales.</p>`,[{label:"Seguir practicando",action:hideModal},{label:"Salir al listado",secondary:true,action:backHome}]);
}
async function activateLocalAI(){
  if(state.loadingAI||localAI.isReady())return;
  const run=++activation;state.loadingAI=true;$("btnActivateAI").disabled=true;show("btnStopAI",true);
  $("aiStatus").textContent="Comprobando si tu navegador permite IA local…";
  try{
    await localAI.activate(text=>{if(run===activation)$("aiStatus").textContent=text;});
    if(run!==activation)return;
    $("modeAI").disabled=false;chooseMode("ai");$("aiStatus").textContent="IA local lista. Elige una situación para practicar. Puede equivocarse: revisa sus propuestas.";
    $("btnActivateAI").textContent="IA local activada";renderHome();
  }catch(error){
    if(run!==activation)return;
    $("aiStatus").textContent=error.message+" La práctica guiada sigue disponible.";$("btnActivateAI").disabled=false;show("btnStopAI",false);chooseMode("guided");
  }finally{if(run===activation)state.loadingAI=false;}
}
function disableLocalAI(){
  activation++;localAI.stop();state.loadingAI=false;$("modeAI").disabled=true;chooseMode("guided");
  $("btnActivateAI").disabled=false;$("btnActivateAI").textContent="Descargar y activar IA local";show("btnStopAI",false);
  $("aiStatus").textContent="IA local desactivada. La práctica guiada está disponible. El navegador puede conservar los archivos ya descargados en su caché.";renderHome();
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
$("btnBackLspedia").addEventListener("click",()=>{localAI.stop();location.href="../?vista=herramientas";});
$("btnHelp").addEventListener("click",showHelpModal);
$("btnChatBack").addEventListener("click",()=>{
  if(state.accepted||state.pending||$("messageInput").value.trim())showModal("↩","Volver a las situaciones","<p>Al salir se borran los mensajes de esta práctica. Las situaciones ya completadas se conservan.</p>",[{label:"Seguir practicando",action:hideModal},{label:"Volver a situaciones",secondary:true,action:backHome}]);
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
$("btnResetProgress").addEventListener("click",()=>showModal("↺","Borrar mi progreso",'<p>Se borrarán las prácticas marcadas como completadas en este navegador. Podrás volver a hacerlas cuando quieras.</p>',[{label:"Conservar progreso",action:hideModal},{label:"Borrar progreso",secondary:true,action:()=>{state.progress=safeProgress(null,scenarios.map(s=>s.id));saveProgress();hideModal();renderHome();toast("Progreso borrado.");}}]));
window.addEventListener("pageshow",()=>{if(!localAI.isReady()){$("modeAI").disabled=true;chooseMode("guided");if(state.scenario&&state.mode==="ai"){state.mode="guided";updateHud();}}});
renderHome();
})();

