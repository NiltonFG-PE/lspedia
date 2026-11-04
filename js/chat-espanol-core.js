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
// A writing aid, not an automatic assessment of language ability.
// The guide describes the task; it never rewrites the user's facts to fit an example.
function responseGuide(turn={}){
  const full=String(turn.prompt||"");
  const question=full.match(/¿([^?]+)\?/);
  const p=normalize(question?question[1]:full);
  const spec=(kind,aim,starter,check)=>({kind,aim,starter,check});
  if(/por que|que razon|que motivo/.test(p))return spec("reason","Explica el motivo de tu respuesta.","Porque ","¿Expliqué por qué?");
  if(/que hora|cuando|para que dia|cuanto tiempo|desde cuando/.test(p))return spec("time","Indica una hora, un día o un tiempo aproximado.",/desde cuando/.test(p)?"Desde ":/para que dia/.test(p)?"Para el ":"Aproximadamente ","¿Dije cuándo o cuánto tiempo? También puedo decir que aún no lo sé.");
  if(/a que ciudad|a donde/.test(p))return spec("destination","Di a qué lugar quieres ir.",/ciudad|viajar/.test(p)?"Quiero viajar a ":"Voy a ","¿Nombré el lugar al que quiero ir?");
  if(/donde|en que parte|cual.*direccion/.test(p))return spec("place","Indica un lugar o una referencia.",/estas|esta ahora/.test(p)?"Estoy en ":"El lugar es ","¿La otra persona puede saber de qué lugar hablo?");
  if(/cuant[oa]s?\b/.test(p))return spec("quantity","Indica una cantidad o explica si aún no la sabes.","Necesito ","¿Dije la cantidad y de qué se trata?");
  if(/\bo\b/.test(p)&&question)return spec("choice","Elige una opción o explica que prefieres otra.","Prefiero ","¿Se entiende qué opción quiero?");
  if(/^(ya|puede|puedes|tiene|tienes|quiere|quieres|desea|necesita|hay|es|esta|ha|acepta|podemos|lleva|cambio|cambiaron|vas a|vas|has)\b/.test(p)&&question)return spec("confirm","Acepta, rechaza o explica si todavía no lo sabes.","Sí, ","¿Se entiende mi decisión? Una respuesta corta también puede servir.");
  if(/que.*pasa|problema|dificultad|que ocurrio/.test(p))return spec("explain","Cuenta qué ocurre y añade un detalle útil.","Lo que pasa es que ","¿Expliqué qué ocurre y qué ayuda necesito?");
  if(/como|que parte|que informacion/.test(p))return spec("detail","Explica tu idea con un detalle que ayude a entenderla.","Creo que ","¿Añadí el dato que necesita la otra persona?");
  if(/que.*(?:llevar|necesita|necesitas|desea|quieres)|en que puedo ayudar/.test(p))return spec("request","Di qué necesitas y, si hace falta, cuánto o para cuándo.","Quisiera ","¿Se entiende qué estoy pidiendo?");
  return spec("open","Responde a la idea del mensaje con tus propias palabras.","", "¿Mi mensaje dice lo que quiero comunicar?");
}
function communicationFeedback(text,turn={}){
  const guide=responseGuide(turn), n=normalize(text);
  const uncertain=/\b(no se|no lo se|no estoy segur[oa]|aun no se|todavia no se|no recuerdo|no tengo esa informacion)\b/.test(n);
  const shortConfirm=/^(si|no|bien|claro|ok|de acuerdo|gracias|si gracias|no gracias)$/.test(n);
  let focus=guide.check, label="Comprueba tu idea";
  if(uncertain){label="Puedes expresar una duda";focus="Está bien decir que aún no lo sabes. Si quieres, añade cómo podrías confirmarlo.";}
  else if(shortConfirm&&["time","place","destination","quantity","reason","choice"].includes(guide.kind)){
    label="Añade el dato que te piden";
    const missing={time:"una hora, un día o un tiempo",place:"un lugar",destination:"el lugar al que quieres ir",quantity:"una cantidad",reason:"el motivo",choice:"la opción que prefieres"}[guide.kind];
    focus="Te están pidiendo "+missing+". Puedes añadirlo o explicar que todavía no lo sabes.";
  }else if(shortConfirm&&guide.kind==="confirm"){
    label="Una respuesta breve puede servir";focus="Puedes aceptar o rechazar con pocas palabras. Añade un detalle solo si ayuda a entender tu decisión.";
  }
  return {label,focus,guide};
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
const api={normalize,tokens,escapeHTML,review,decision,nextGuided,parseAI,safeProgress,responseGuide,communicationFeedback};
if(typeof module==="object"&&module.exports)module.exports=api;else root.LSPChatCore=api;
})(typeof globalThis!=="undefined"?globalThis:this);
