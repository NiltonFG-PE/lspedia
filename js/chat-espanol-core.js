/* Revisión local limitada: no altera nombres, cifras, negaciones ni tiempos verbales. */
(function(root){
"use strict";
const normalize = s => String(s || "").toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ\s]/g," ").replace(/\s+/g," ").trim();
const tokens = s => normalize(s).split(" ").filter(Boolean);
const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const accents = {tambien:"también",telefono:"teléfono",numero:"número",direccion:"dirección",informacion:"información",miercoles:"miércoles",sabado:"sábado",medico:"médico",pagina:"página",autobus:"autobús",despues:"después",peru:"Perú"};
// Ambiguous forms (medico, numero, pagina...) stay untouched: they may be verbs.
const unambiguous = new Set(["tambien","telefono","informacion","miercoles","sabado","autobus","despues","peru"]);
function review(text, turn = {}) {
  const original=String(text || "").trim().slice(0,600), notes=[];
  let improved=original.replace(/\s+/g," ").replace(/\s+([,.;!?])/g,"$1");
  const add=(kind,label,explanation)=>{if(!notes.some(n=>n.kind===kind))notes.push({kind,label,text:explanation});};
  if(improved!==original) add("spacing","Espacios","Separa las palabras con un espacio y une la coma o el punto a la palabra anterior.");
  improved=improved.replace(/[\p{L}]+/gu,word=>{
    const key=word.toLocaleLowerCase("es");
    if(!unambiguous.has(key))return word;
    add("accent","Tildes","Algunas palabras llevan tilde. Compara tu texto con la sugerencia.");
    const value=accents[key];
    return word===word.toLocaleUpperCase("es")?value.toLocaleUpperCase("es"):/^[A-ZÁÉÍÓÚÜÑ]/.test(word)?value[0].toLocaleUpperCase("es")+value.slice(1):value;
  });
  if(/^si[.!]?$/i.test(improved)){
    improved=improved.replace(/^si/i,"Sí");
    add("accent","Sí / si","“Sí” lleva tilde cuando expresa una afirmación. “Si” introduce una condición.");
  }
  if(/^[a-záéíóúüñ]/.test(improved)){
    improved=improved[0].toLocaleUpperCase("es")+improved.slice(1);
    add("capital","Mayúscula inicial","Al empezar una oración, escribe la primera letra en mayúscula.");
  }
  // Only pair explicit signs on a single clause; never infer a question from the model answer.
  if(improved.endsWith("?")&&!improved.includes("¿")&&!/[.!;]/.test(improved)){
    improved="¿"+improved;
    add("punctuation","Pregunta","Las preguntas directas llevan signos de apertura (¿) y cierre (?).");
  } else if(improved.startsWith("¿")&&!/[?]$/.test(improved)&&!/[.!;]/.test(improved)){
    improved+="?";add("punctuation","Pregunta","Cierra la pregunta con el signo ?.");
  } else if(improved&&!/[.!?…]$/.test(improved)&&!/[¿¡]/.test(improved)){
    improved+=".";add("punctuation","Punto final","Puedes cerrar una idea completa con un punto.");
  }
  const n=normalize(original), ws=tokens(original);
  const context=tokens([turn.prompt,...(turn.keywords || [])].join(" "));
  const related=ws.some(w=>w.length>3&&context.some(k=>k.length>3&&(w===k||w.startsWith(k))));
  const yesNo=/^(si|no|claro|todavia no|aun no|de acuerdo|no gracias)(\s|$)/.test(n);
  const closed= /^(hola |buenos dias )?(ya|puede|puedes|tiene|tienes|quiere|quieres|desea|necesita|hay|es|esta|ha|acepta|podemos|lleva|cambio|cambiaron)\b/.test(normalize(turn.prompt));
  const sample=(turn.alternatives||[]).concat(turn.model||"").some(s=>normalize(s)===n);
  const enough=!!n&&((yesNo&&closed)||sample||related||ws.length>=4);
  // 'unrecognized' is uncertainty, never a grade for Spanish proficiency.
  const unrecognized=!enough;
  if(unrecognized)add("clarity","Compara con la pregunta","Esta revisión básica no puede confirmar si tu respuesta encaja. Revisa qué te preguntaron, añade un dato si hace falta o continúa si tu mensaje expresa tu idea.");
  if(turn.why)add("focus","Para practicar",String(turn.why));
  return {original,improved,changed:improved!==original,notes,unrecognized};
}
function decision(text){
  const n=normalize(text);
  if(/^(no|todavia no|aun no)(\s|$)/.test(n))return "no";
  if(/^(si|claro|de acuerdo)(\s|$)/.test(n))return "yes";
  return "other";
}
function nextGuided(scenario,index,text,memory={}){
  let next=index+1, closing="";
  const choice=decision(text), n=normalize(text);
  if(scenario.id==="bodega-pan"&&index===1&&choice==="no")next=3;
  if(scenario.id==="reniec-dni"&&index===2&&choice==="yes")next=4;
  if(scenario.id==="banco-dni"&&((index===3)||(index===5))&&choice==="no")next=index+2;
  if(scenario.id==="bus-centro"&&index===2)memory.busStop=n.includes("adelante")?"farther":"plaza";
  if(scenario.id==="bus-centro"&&index===5&&memory.busStop==="farther"&&choice==="no"){
    next=scenario.turns.length;closing="De acuerdo. Terminamos aquí la práctica del viaje.";
  }
  if((scenario.id==="entrevista-trabajo"&&index===6||scenario.id==="viaje-terminal"&&index===8)&&choice==="no"){
    next=scenario.turns.length;closing="De acuerdo. Gracias por expresar tu decisión. Terminamos esta práctica.";
  }
  return {next,closing};
}
function parseAI(raw){
  let value;
  try {value=JSON.parse(String(raw).trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,""));}catch(_){throw new Error("La IA no devolvió una respuesta válida.");}
  if(!value||Array.isArray(value)||typeof value.reply!=="string"||!value.reply.trim()||value.reply.length>700)throw new Error("Respuesta incompleta de la IA.");
  for(const k of ["suggestion","explanation"]){if(typeof value[k]!=="string"||value[k].length>700)throw new Error("Revisión incompleta de la IA.");}
  return {reply:value.reply.trim(),suggestion:value.suggestion.trim(),explanation:value.explanation.trim()};
}
function safeProgress(raw,ids){
  const value=raw&&typeof raw==="object"?raw:{};
  return {completed:[...new Set(Array.isArray(value.completed)?value.completed:[])].filter(id=>typeof id==="string"&&ids.includes(id)),lastLevel:Math.min(5,Math.max(1,Math.trunc(Number(value.lastLevel)||1)))};
}
const api={normalize,tokens,escapeHTML,review,decision,nextGuided,parseAI,safeProgress};
if(typeof module==="object"&&module.exports)module.exports=api;else root.LSPChatCore=api;
})(typeof globalThis!=="undefined"?globalThis:this);
