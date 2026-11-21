/* Motor visual de conversación reactiva y corrección gramatical (español L2) para LSPedia.
   Diseñado para aprendices visuales (personas sordas): símbolos, fórmulas visuales y diff palabra por palabra.
   100% local en el navegador: sin backend, sin APIs externas ni envío de datos. */
(function(root){
"use strict";

const normalize = s => String(s || "")
  .toLocaleLowerCase("es")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9ñ\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const tokens = s => normalize(s).split(" ").filter(Boolean);

const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g, c => (
  {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]
));

// Conectores rápidos visuales con símbolo de significado para insertar al escribir.
const CONNECTOR_CHIPS = [
  { icon: "💡", label: "porque", insert: "porque ", tip: "Motivo o razón" },
  { icon: "⚖️", label: ", pero", insert: ", pero ", tip: "Contraste / obstáculo" },
  { icon: "🔄", label: "aunque", insert: "aunque ", tip: "A pesar de algo" },
  { icon: "➡️", label: "entonces", insert: "entonces ", tip: "Decisión o resultado" },
  { icon: "🎯", label: "por eso", insert: "por eso ", tip: "Consecuencia" },
  { icon: "➕", label: "además", insert: "además ", tip: "Sumar otra idea" },
  { icon: "🏁", label: "para que", insert: "para que ", tip: "Objetivo o finalidad" }
];

const UNAMBIGUOUS_ACCENTS = {
  tambien:"también", ademas:"además", despues:"después", asi:"así",
  aqui:"aquí", alli:"allí", ahi:"ahí", todavia:"todavía",
  telefono:"teléfono", informacion:"información", direccion:"dirección",
  miercoles:"miércoles", sabado:"sábado", autobus:"autobús", peru:"Perú",
  proximo:"próximo", proxima:"próxima", ultimo:"último", ultima:"última",
  facil:"fácil", dificil:"difícil", rapido:"rápido", rapida:"rápida",
  tramite:"trámite", tramites:"trámites", conclusion:"conclusión",
  reunion:"reunión", solucion:"solución", comunicacion:"comunicación",
  explicacion:"explicación", indicacion:"indicación", confirmacion:"confirmación",
  organizacion:"organización", ubicacion:"ubicación", presentacion:"presentación",
  perdon:"perdón", razon:"razón", decision:"decisión", atencion:"atención",
  habitacion:"habitación", estacion:"estación", opcion:"opción", funcion:"función",
  cafe:"café", mama:"mamá", alergico:"alérgico", alergica:"alérgica",
  curriculum:"currículum", modem:"módem", pagina:"página", pelicula:"película",
  subtitulos:"subtítulos", trafico:"tráfico", libreria:"librería",
  habia:"había", podria:"podría", podrias:"podrías", deberia:"debería",
  estaria:"estaría", gustaria:"gustaría", querria:"querría",
  llegare:"llegaré", ire:"iré", estare:"estaré", tendre:"tendré",
  hare:"haré", pagare:"pagaré", enviare:"enviaré", revisare:"revisaré",
  avisare:"avisaré", llamare:"llamaré", saldre:"saldré", vere:"veré",
  comprare:"compraré", llevare:"llevaré", estudiare:"estudiaré", trabajare:"trabajaré",
  volvere:"volveré", escribire:"escribiré",
  sali:"salí", entendi:"entendí", recibi:"recibí", comi:"comí", vivi:"viví",
  escribi:"escribí", decidi:"decidí", pedi:"pedí", preferi:"preferí",
  llegue:"llegué", busque:"busqué", pague:"pagué", explique:"expliqué",
  descansare:"descansaré"
};

// Verbos frecuentes (presente, pasado, futuro) para [yo, tú, él/ella/usted, nosotros, ellos/ustedes].
const VERBS = {
  ir:        { pres:["voy","vas","va","vamos","van"],                   past:["fui","fuiste","fue","fuimos","fueron"],               fut:["iré","irás","irá","iremos","irán"] },
  ser:       { pres:["soy","eres","es","somos","son"],                  past:["fui","fuiste","fue","fuimos","fueron"],               fut:["seré","serás","será","seremos","serán"] },
  estar:     { pres:["estoy","estás","está","estamos","están"],         past:["estuve","estuviste","estuvo","estuvimos","estuvieron"], fut:["estaré","estarás","estará","estaremos","estarán"] },
  tener:     { pres:["tengo","tienes","tiene","tenemos","tienen"],      past:["tuve","tuviste","tuvo","tuvimos","tuvieron"],         fut:["tendré","tendrás","tendrá","tendremos","tendrán"] },
  querer:    { pres:["quiero","quieres","quiere","queremos","quieren"], past:["quise","quisiste","quiso","quisimos","quisieron"],    fut:["querré","querrás","querrá","querremos","querrán"] },
  poder:     { pres:["puedo","puedes","puede","podemos","pueden"],      past:["pude","pudiste","pudo","pudimos","pudieron"],         fut:["podré","podrás","podrá","podremos","podrán"] },
  hacer:     { pres:["hago","haces","hace","hacemos","hacen"],          past:["hice","hiciste","hizo","hicimos","hicieron"],         fut:["haré","harás","hará","haremos","harán"] },
  decir:     { pres:["digo","dices","dice","decimos","dicen"],          past:["dije","dijiste","dijo","dijimos","dijeron"],          fut:["diré","dirás","dirá","diremos","dirán"] },
  venir:     { pres:["vengo","vienes","viene","venimos","vienen"],      past:["vine","viniste","vino","vinimos","vinieron"],         fut:["vendré","vendrás","vendrá","vendremos","vendrán"] },
  salir:     { pres:["salgo","sales","sale","salimos","salen"],         past:["salí","saliste","salió","salimos","salieron"],        fut:["saldré","saldrás","saldrá","saldremos","saldrán"] },
  llegar:    { pres:["llego","llegas","llega","llegamos","llegan"],     past:["llegué","llegaste","llegó","llegamos","llegaron"],    fut:["llegaré","llegarás","llegará","llegaremos","llegarán"] },
  comer:     { pres:["como","comes","come","comemos","comen"],          past:["comí","comiste","comió","comimos","comieron"],        fut:["comeré","comerás","comerá","comeremos","comerán"] },
  tomar:     { pres:["tomo","tomas","toma","tomamos","toman"],          past:["tomé","tomaste","tomó","tomamos","tomaron"],          fut:["tomaré","tomarás","tomará","tomaremos","tomarán"] },
  pagar:     { pres:["pago","pagas","paga","pagamos","pagan"],          past:["pagué","pagaste","pagó","pagamos","pagaron"],         fut:["pagaré","pagarás","pagará","pagaremos","pagarán"] },
  comprar:   { pres:["compro","compras","compra","compramos","compran"],past:["compré","compraste","compró","compramos","compraron"],fut:["compraré","comprarás","comprará","compraremos","comprarán"] },
  llevar:    { pres:["llevo","llevas","lleva","llevamos","llevan"],     past:["llevé","llevaste","llevó","llevamos","llevaron"],     fut:["llevaré","llevarás","llevará","llevaremos","llevarán"] },
  trabajar:  { pres:["trabajo","trabajas","trabaja","trabajamos","trabajan"], past:["trabajé","trabajaste","trabajó","trabajamos","trabajaron"], fut:["trabajaré","trabajarás","trabajará","trabajaremos","trabajarán"] },
  estudiar:  { pres:["estudio","estudias","estudia","estudiamos","estudian"], past:["estudié","estudiaste","estudió","estudiamos","estudiaron"], fut:["estudiaré","estudiarás","estudiará","estudiaremos","estudiarán"] },
  leer:      { pres:["leo","lees","lee","leemos","leen"],               past:["leí","leíste","leyó","leímos","leyeron"],             fut:["leeré","leerás","leerá","leeremos","leerán"] },
  escribir:  { pres:["escribo","escribes","escribe","escribimos","escriben"], past:["escribí","escribiste","escribió","escribimos","escribieron"], fut:["escribiré","escribirás","escribirá","escribiremos","escribirán"] },
  ver:       { pres:["veo","ves","ve","vemos","ven"],                   past:["vi","viste","vio","vimos","vieron"],                  fut:["veré","verás","verá","veremos","verán"] },
  saber:     { pres:["sé","sabes","sabe","sabemos","saben"],            past:["supe","supiste","supo","supimos","supieron"],         fut:["sabré","sabrás","sabrá","sabremos","sabrán"] },
  entender:  { pres:["entiendo","entiendes","entiende","entendemos","entienden"], past:["entendí","entendiste","entendió","entendimos","entendieron"], fut:["entenderé","entenderás","entenderá","entenderemos","entenderán"] },
  necesitar: { pres:["necesito","necesitas","necesita","necesitamos","necesitan"], past:["necesité","necesitaste","necesitó","necesitamos","necesitaron"], fut:["necesitaré","necesitarás","necesitará","necesitaremos","necesitarán"] },
  buscar:    { pres:["busco","buscas","busca","buscamos","buscan"],     past:["busqué","buscaste","buscó","buscamos","buscaron"],    fut:["buscaré","buscarás","buscará","buscaremos","buscarán"] },
  pedir:     { pres:["pido","pides","pide","pedimos","piden"],          past:["pedí","pediste","pidió","pedimos","pidieron"],        fut:["pediré","pedirás","pedirá","pediremos","pedirán"] },
  esperar:   { pres:["espero","esperas","espera","esperamos","esperan"],past:["esperé","esperaste","esperó","esperamos","esperaron"],fut:["esperaré","esperarás","esperará","esperaremos","esperarán"] },
  ayudar:    { pres:["ayudo","ayudas","ayuda","ayudamos","ayudan"],     past:["ayudé","ayudaste","ayudó","ayudamos","ayudaron"],     fut:["ayudaré","ayudarás","ayudará","ayudaremos","ayudarán"] },
  avisar:    { pres:["aviso","avisas","avisa","avisamos","avisan"],     past:["avisé","avisaste","avisó","avisamos","avisaron"],     fut:["avisaré","avisarás","avisará","avisaremos","avisarán"] },
  enviar:    { pres:["envío","envías","envía","enviamos","envían"],     past:["envié","enviaste","envió","enviamos","enviaron"],     fut:["enviaré","enviarás","enviará","enviaremos","enviarán"] },
  revisar:   { pres:["reviso","revisas","revisa","revisamos","revisan"],past:["revisé","revisaste","revisó","revisamos","revisaron"],fut:["revisaré","revisarás","revisará","revisaremos","revisarán"] },
  terminar:  { pres:["termino","terminas","termina","terminamos","terminan"], past:["terminé","terminaste","terminó","terminamos","terminaron"], fut:["terminaré","terminarás","terminará","terminaremos","terminarán"] },
  empezar:   { pres:["empiezo","empiezas","empieza","empezamos","empiezan"], past:["empecé","empezaste","empezó","empezamos","empezaron"], fut:["empezaré","empezarás","empezará","empezaremos","empezarán"] },
  preferir:  { pres:["prefiero","prefieres","prefiere","preferimos","prefieren"], past:["preferí","preferiste","prefirió","preferimos","prefirieron"], fut:["preferiré","preferirás","preferirá","preferiremos","preferirán"] },
  cambiar:   { pres:["cambio","cambias","cambia","cambiamos","cambian"],past:["cambié","cambiaste","cambió","cambiamos","cambiaron"],fut:["cambiaré","cambiarás","cambiará","cambiaremos","cambiarán"] },
  viajar:    { pres:["viajo","viajas","viaja","viajamos","viajan"],     past:["viajé","viajaste","viajó","viajamos","viajaron"],     fut:["viajaré","viajarás","viajará","viajaremos","viajarán"] },
  vivir:     { pres:["vivo","vives","vive","vivimos","viven"],          past:["viví","viviste","vivió","vivimos","vivieron"],        fut:["viviré","vivirás","vivirá","viviremos","vivirán"] },
  practicar: { pres:["practico","practicas","practica","practicamos","practican"], past:["practiqué","practicaste","practicó","practicamos","practicaron"], fut:["practicaré","practicarás","practicará","practicaremos","practicarán"] },
  aprender:  { pres:["aprendo","aprendes","aprende","aprendemos","aprenden"], past:["aprendí","aprendiste","aprendió","aprendimos","aprendieron"], fut:["aprenderé","aprenderás","aprenderá","aprenderemos","aprenderán"] },
  jugar:     { pres:["juego","juegas","juega","jugamos","juegan"],      past:["jugué","jugaste","jugó","jugamos","jugaron"],         fut:["jugaré","jugarás","jugará","jugaremos","jugarán"] },
  caminar:   { pres:["camino","caminas","camina","caminamos","caminan"],past:["caminé","caminaste","caminó","caminamos","caminaron"],fut:["caminaré","caminarás","caminará","caminaremos","caminarán"] },
  bajar:     { pres:["bajo","bajas","baja","bajamos","bajan"],          past:["bajé","bajaste","bajó","bajamos","bajaron"],          fut:["bajaré","bajarás","bajará","bajaremos","bajarán"] },
  descansar: { pres:["descanso","descansas","descansa","descansamos","descansan"], past:["descansé","descansaste","descansó","descansamos","descansaron"], fut:["descansaré","descansarás","descansará","descansaremos","descansarán"] },
  visitar:   { pres:["visito","visitas","visita","visitamos","visitan"],past:["visité","visitaste","visitó","visitamos","visitaron"],fut:["visitaré","visitarás","visitará","visitaremos","visitarán"] },
  volver:    { pres:["vuelvo","vuelves","vuelve","volvemos","vuelven"], past:["volví","volviste","volvió","volvimos","volvieron"],   fut:["volveré","volverás","volverá","volveremos","volverán"] }
};

const PRONOUN_INDEX = {
  yo: 0, tu: 1, "tú": 1, el: 2, "él": 2, ella: 2, usted: 2,
  nosotros: 3, nosotras: 3, ellos: 4, ellas: 4, ustedes: 4
};

const FEM_NOUNS = new Set([
  "casa","comida","tarea","cita","hora","tarde","noche","mañana","plaza","calle","avenida",
  "dirección","direccion","información","informacion","receta","maleta","mochila","pelota",
  "botella","leche","bolsa","pregunta","duda","respuesta","tarjeta","transferencia","oficina",
  "habitación","habitacion","reserva","señal","senal","luz","fiebre","tos","garganta",
  "conclusión","conclusion","reunión","reunion","constancia","entrevista","estación","estacion",
  "ciudad","persona","gente","mesa","puerta","ventana","semana","vida","forma","parte","idea",
  "lista","cuenta","cama","gorra","limonada","ensalada","cebolla","papa","ayuda","compra",
  "carpeta","copia","película","pelicula","librería","libreria","presentación","presentacion"
]);
const MASC_NOUNS = new Set([
  "carro","bus","autobús","autobus","pan","trabajo","paradero","centro","mercado","banco",
  "hospital","colegio","parque","grupo","informe","proyecto","problema","tema","día","dia",
  "mapa","documento","formulario","pasaje","equipaje","correo","teléfono","telefono","número","numero",
  "perro","gato","plato","pedido","pollo","arroz","tomate","horario","trámite","tramite",
  "recibo","cambio","resumen","mensaje","dato","plan","tiempo","dinero","efectivo","billete",
  "vuelto","kilo","sol","minuto","mes","año","ano","amigo","vecino","compañero","companero",
  "médico","medico","doctor","profesor","paquete","borrador","enlace","asiento","terminal",
  "partido","equipo","clima","paraguas","jarabe","medicamento","dolor","error","paso","favor",
  "cuaderno","folder","archivo","tráfico","trafico","cine"
]);

const PLURAL_MAP = {
  pan:"panes", kilo:"kilos", sol:"soles", minuto:"minutos", hora:"horas",
  dia:"días", "día":"días", noche:"noches", persona:"personas", amigo:"amigos",
  compañero:"compañeros", companero:"compañeros", cama:"camas", bolsa:"bolsas",
  botella:"botellas", parte:"partes", cosa:"cosas", dato:"datos", documento:"documentos",
  mensaje:"mensajes", vez:"veces", mes:"meses", año:"años", ano:"años", cuadra:"cuadras",
  tableta:"tabletas", flor:"flores", guante:"guantes", libro:"libros", hoja:"hojas",
  copia:"copias", entrada:"entradas", cuaderno:"cuadernos", fruta:"frutas"
};

const KNOWN_CONNECTORS = [
  "sin embargo","por eso","así que","asi que","ya que","para que","en cambio",
  "además","ademas","aunque","porque","entonces","pero","primero","luego",
  "después","despues","finalmente","mientras tanto","por si","apenas","en cuanto"
];

function matchCase(source, target){
  if(!source || !target) return target;
  if(source === source.toLocaleUpperCase("es") && source.length > 1) return target.toLocaleUpperCase("es");
  if(/^[A-ZÁÉÍÓÚÜÑ]/.test(source)) return target[0].toLocaleUpperCase("es") + target.slice(1);
  return target;
}

function detectTenseHint(normText){
  if(/\b(ayer|anoche|anteayer|semana pasada|mes pasado|lunes pasado|martes pasado|miercoles pasado|jueves pasado|viernes pasado|sabado pasado|domingo pasado)\b/.test(normText)) return "past";
  if(/\b(manana|pasado manana|proximo|proxima|mas tarde|despues|luego)\b/.test(normText)) return "fut";
  return "pres";
}

function detectConnectors(text){
  const n = normalize(text);
  const found = [];
  for(const c of KNOWN_CONNECTORS){
    const cn = normalize(c);
    const re = new RegExp(`(?:^|\\s)${cn.replace(/\s+/g,"\\s+")}(?:$|\\s)`);
    if(re.test(n)){
      const canonical = c
        .replace(/^asi que$/,"así que")
        .replace(/^ademas$/,"además")
        .replace(/^despues$/,"después");
      if(!found.includes(canonical)) found.push(canonical);
    }
  }
  return found;
}

// Diff visual palabra por palabra para que la persona vea de inmediato qué cambió (❌ -> ✅).
function computeVisualDiff(beforeText, afterText){
  const a = String(beforeText || "").trim().split(/\s+/).filter(Boolean);
  const b = String(afterText || "").trim().split(/\s+/).filter(Boolean);
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for(let i = m - 1; i >= 0; i--){
    for(let j = n - 1; j >= 0; j--){
      dp[i][j] = a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const beforeParts = [], afterParts = [];
  let i = 0, j = 0;
  while(i < m && j < n){
    if(a[i] === b[j]){
      beforeParts.push(escapeHTML(a[i]));
      afterParts.push(escapeHTML(b[j]));
      i++; j++;
    } else if(dp[i + 1][j] >= dp[i][j + 1]){
      beforeParts.push(`<del class="diff-del">${escapeHTML(a[i])}</del>`);
      i++;
    } else {
      afterParts.push(`<ins class="diff-add">${escapeHTML(b[j])}</ins>`);
      j++;
    }
  }
  while(i < m){ beforeParts.push(`<del class="diff-del">${escapeHTML(a[i++])}</del>`); }
  while(j < n){ afterParts.push(`<ins class="diff-add">${escapeHTML(b[j++])}</ins>`); }
  return { beforeHTML: beforeParts.join(" "), afterHTML: afterParts.join(" ") };
}

// Fórmula visual breve para el turno actual (fácil de leer de un vistazo).
function visualFormulaForTurn(turn = {}){
  const f = turn.focus || {};
  const badge = String(f.badge || "").toLowerCase();
  if(f.formula) return f.formula;
  if(badge.includes("porque")) return "💬 Idea  +  💡 porque  +  Motivo";
  if(badge.includes("por eso") || badge.includes("así que")) return "📌 Situación  →  🎯 por eso  +  Resultado";
  if(badge.includes("entonces")) return "📌 Dato  →  ➡️ entonces  +  Decisión";
  if(badge.includes("pero") || badge.includes("aunque") || badge.includes("sin embargo")) return "👍 Idea 1  +  ⚖️ , pero / aunque  +  Idea 2";
  if(badge.includes("primero") || badge.includes("secuencia")) return "1️⃣ Primero  →  2️⃣ Luego  →  🏁 Finalmente";
  if(badge.includes("luego") || badge.includes("después")) return "1️⃣ Paso 1  →  2️⃣ Luego / Después  +  Paso 2";
  if(badge.includes("además")) return "💬 Idea 1  +  ➕ además  +  Idea 2";
  if(badge.includes("para que")) return "🛠️ Acción  +  🏁 para que  +  Objetivo";
  if(badge.includes("pasado")) return "⏪ Ayer  →  🟢 Verbo en pasado (fui, hice, compré)";
  if(badge.includes("futuro")) return "⏩ Mañana  →  🟢 iré / voy a + verbo";
  if(badge.includes("presente")) return "▶️ Ahora  →  🟢 Verbo en presente (estoy, hago)";
  if(badge.includes("estar")) return "📍 Lugar / 😊 Estado  →  🟢 estoy";
  if(badge.includes("ser")) return "🪪 Nombre / Origen  →  🟢 soy";
  if(badge.includes("tener")) return "🎂 Edad / 😋 Sensación  →  🟢 tengo";
  if(badge.includes("preposici")) return "📍 a + el = al  ·  de + el = del  ·  en el / en la";
  if(badge.includes("concordancia")) return "👩 la / una  ·  👨 el / un  ·  🔢 2+ plural";
  if(badge.includes("pregunta")) return "❓ ¿  +  Pregunta  +  ?";
  return "🟦 Persona  +  🟢 Verbo  +  💬 Idea";
}

// Símbolo visual rápido de qué pregunta el personaje (apoyo de comprensión lectora).
function questionIconForPrompt(prompt = ""){
  const g = responseGuide({ prompt });
  const map = {
    reason: { icon: "💡", label: "Pide motivo" },
    time: { icon: "🕒", label: "Pide hora o día" },
    destination: { icon: "🧭", label: "Pide destino" },
    place: { icon: "📍", label: "Pide lugar" },
    quantity: { icon: "🔢", label: "Pide cantidad" },
    choice: { icon: "⚖️", label: "Elige una opción" },
    confirm: { icon: "✅", label: "Sí / No + detalle" },
    explain: { icon: "💬", label: "Cuenta qué pasa" },
    detail: { icon: "📝", label: "Explica un detalle" },
    request: { icon: "🙋", label: "Di qué necesitas" },
    open: { icon: "💬", label: "Responde libre" }
  };
  return map[g.kind] || map.open;
}

function review(text, turn = {}){
  const original = String(text || "").trim().slice(0, 600);
  const notes = [];
  const praises = [];
  let improved = original;

  const add = (kind, category, label, formula, explanation) => {
    if(!notes.some(n => n.kind === kind && n.label === label)){
      notes.push({ kind, category, label, formula, text: explanation });
    }
  };
  const addPraise = (label, explanation) => {
    if(!praises.some(p => p.label === label)){
      praises.push({ label, text: explanation });
    }
  };

  // 1. Espacios
  const spaced = improved
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/([,.;!?])(?=[\p{L}\p{N}])/gu, "$1 ");
  if(spaced !== improved){
    improved = spaced;
    add("spacing", "✏️ Ortografía", "Espacios", "palabra, palabra", "Usa un espacio entre palabras y pega la coma o el punto.");
  }

  const tenseHint = detectTenseHint(normalize(improved));

  // 2A. Pronombre + verbo en infinitivo
  improved = improved.replace(
    /\b(yo|t[uú]|[eé]l|ella|usted|nosotros|nosotras|ellos|ellas|ustedes)\s+([a-zñáéíóúü]{2,14})\b/gi,
    (full, pron, verb) => {
      const pKey = normalize(pron);
      const vKey = normalize(verb);
      const pIdx = PRONOUN_INDEX[pKey];
      const entry = VERBS[vKey];
      if(pIdx === undefined || !entry) return full;
      const conj = entry[tenseHint][pIdx];
      const tiempoIcon = tenseHint === "past" ? "⏪ Pasado" : tenseHint === "fut" ? "⏩ Futuro" : "▶️ Presente";
      add(
        "conjugation",
        "⏱️ Verbo",
        `Conjugar «${vKey}»`,
        `❌ ${pron.toLowerCase()} ${vKey}  →  ✅ ${pron.toLowerCase()} ${conj}`,
        `${tiempoIcon}: con «${pron.toLowerCase()}» el verbo cambia a «${conj}».`
      );
      return `${pron} ${conj}`;
    }
  );

  // 2B. Marcador de tiempo + infinitivo sin pronombre
  improved = improved.replace(
    /\b(ayer|anoche|mañana|ahora|hoy)\s+([a-zñáéíóúü]{2,14})\b/gi,
    (full, marker, verb) => {
      const vKey = normalize(verb);
      const entry = VERBS[vKey];
      if(!entry) return full;
      const mKey = normalize(marker);
      const t = (mKey === "ayer" || mKey === "anoche") ? "past" : (mKey === "manana" ? "fut" : "pres");
      const conj = entry[t][0];
      const tiempoNombre = t === "past" ? "⏪ pasado" : t === "fut" ? "⏩ futuro" : "▶️ presente";
      add(
        "conjugation",
        "⏱️ Verbo",
        `Verbo en ${t === "past" ? "pasado" : t === "fut" ? "futuro" : "presente"}`,
        `❌ ${marker.toLowerCase()} ${vKey}  →  ✅ ${marker.toLowerCase()} ${conj}`,
        `«${marker}» indica ${tiempoNombre}.`
      );
      return `${marker} ${conj}`;
    }
  );

  // 2C. Perífrasis sin "a"
  improved = improved.replace(
    /\b(voy|vas|va|vamos|van|empiezo|empezamos|aprendo|aprendemos)\s+([a-zñáéíóúü]{2,14})\b/gi,
    (full, aux, verb) => {
      const vKey = normalize(verb);
      if(!VERBS[vKey]) return full;
      add("preposition", "📍 Unión", "Falta «a»", `❌ ${aux.toLowerCase()} ${verb.toLowerCase()}  →  ✅ ${aux.toLowerCase()} a ${verb.toLowerCase()}`, "Entre dos verbos de acción usamos «a».");
      return `${aux} a ${verb}`;
    }
  );

  // 3. Concordancia sujeto-verbo errónea
  const SUBJ_VERB_FIXES = [
    [/\b(yo)\s+(eres|es|somos|son)\b/gi, (m,p)=>`${p} soy`, "❌ yo eres/es → ✅ yo soy", "Con «yo» usamos «soy»."],
    [/\b(yo)\s+(est[aá]s|est[aá]|estamos|est[aá]n)\b/gi, (m,p)=>`${p} estoy`, "❌ yo está → ✅ yo estoy", "Con «yo» usamos «estoy»."],
    [/\b(yo)\s+(tienes|tiene|tenemos|tienen)\b/gi, (m,p)=>`${p} tengo`, "❌ yo tiene → ✅ yo tengo", "Con «yo» usamos «tengo»."],
    [/\b(yo)\s+(vas|va|vamos|van)\b/gi, (m,p)=>`${p} voy`, "❌ yo va → ✅ yo voy", "Con «yo» usamos «voy»."],
    [/\b(yo)\s+(quieres|quiere|queremos|quieren)\b/gi, (m,p)=>`${p} quiero`, "❌ yo quiere → ✅ yo quiero", "Con «yo» usamos «quiero»."],
    [/\b(yo)\s+(puedes|puede|podemos|pueden)\b/gi, (m,p)=>`${p} puedo`, "❌ yo puede → ✅ yo puedo", "Con «yo» usamos «puedo»."],
    [/\b(yo)\s+(haces|hace|hacemos|hacen)\b/gi, (m,p)=>`${p} hago`, "❌ yo hace → ✅ yo hago", "Con «yo» usamos «hago»."],
    [/\b(t[uú])\s+(soy|es|somos|son)\b/gi, (m,p)=>`${p} eres`, "❌ tú soy/es → ✅ tú eres", "Con «tú» usamos «eres»."],
    [/\b(t[uú])\s+(estoy|est[aá]|estamos|est[aá]n)\b/gi, (m,p)=>`${p} estás`, "❌ tú está → ✅ tú estás", "Con «tú» usamos «estás»."],
    [/\b(t[uú])\s+(tengo|tiene|tenemos|tienen)\b/gi, (m,p)=>`${p} tienes`, "❌ tú tiene → ✅ tú tienes", "Con «tú» usamos «tienes»."],
    [/\b(t[uú])\s+(voy|va|vamos|van)\b/gi, (m,p)=>`${p} vas`, "❌ tú voy → ✅ tú vas", "Con «tú» usamos «vas»."],
    [/\b(nosotros|nosotras)\s+(soy|eres|es|son)\b/gi, (m,p)=>`${p} somos`, "✅ nosotros somos", "Con «nosotros» usamos «somos»."],
    [/\b(nosotros|nosotras)\s+(estoy|est[aá]s|est[aá]|est[aá]n)\b/gi, (m,p)=>`${p} estamos`, "✅ nosotros estamos", "Con «nosotros» usamos «estamos»."],
    [/\b(nosotros|nosotras)\s+(voy|vas|va|van)\b/gi, (m,p)=>`${p} vamos`, "✅ nosotros vamos", "Con «nosotros» usamos «vamos»."],
    [/\b(nosotros|nosotras)\s+(tengo|tienes|tiene|tienen)\b/gi, (m,p)=>`${p} tenemos`, "✅ nosotros tenemos", "Con «nosotros» usamos «tenemos»."],
    [/\b(ellos|ellas|ustedes)\s+(soy|eres|es|somos)\b/gi, (m,p)=>`${p} son`, "✅ ellos son", "Con «ellos/ustedes» usamos «son»."],
    [/\b(ellos|ellas|ustedes)\s+(estoy|est[aá]s|est[aá]|estamos)\b/gi, (m,p)=>`${p} están`, "✅ ellos están", "Con «ellos/ustedes» usamos «están»."],
    [/\b(ellos|ellas|ustedes)\s+(voy|vas|va|vamos)\b/gi, (m,p)=>`${p} van`, "✅ ellos van", "Con «ellos/ustedes» usamos «van»."],
    [/\b(ellos|ellas|ustedes)\s+(tengo|tienes|tiene|tenemos)\b/gi, (m,p)=>`${p} tienen`, "✅ ellos tienen", "Con «ellos/ustedes» usamos «tienen»."]
  ];
  for(const [re, repl, form, msg] of SUBJ_VERB_FIXES){
    if(re.test(improved)){
      improved = improved.replace(re, repl);
      add("conjugation", "⏱️ Verbo", "Persona y verbo", form, msg);
    }
  }

  // 4. Tiempo verbal vs marcador temporal
  const TIME_FIXES = [
    [/\b(ayer|anoche)\s+(yo\s+)?voy\b/gi, (m,t,p)=>`${t} ${p||""}fui`, "⏪ ayer → fui", "«Ayer» es pasado: usamos «fui»."],
    [/\b(ayer|anoche)\s+(yo\s+)?tengo\b/gi, (m,t,p)=>`${t} ${p||""}tuve`, "⏪ ayer → tuve", "«Ayer» es pasado: usamos «tuve»."],
    [/\b(ayer|anoche)\s+(yo\s+)?como\b/gi, (m,t,p)=>`${t} ${p||""}comí`, "⏪ ayer → comí", "«Ayer» es pasado: usamos «comí»."],
    [/\b(ayer|anoche)\s+(yo\s+)?hago\b/gi, (m,t,p)=>`${t} ${p||""}hice`, "⏪ ayer → hice", "«Ayer» es pasado: usamos «hice»."],
    [/\b(ayer|anoche)\s+(yo\s+)?salgo\b/gi, (m,t,p)=>`${t} ${p||""}salí`, "⏪ ayer → salí", "«Ayer» es pasado: usamos «salí»."],
    [/\b(ayer|anoche)\s+(yo\s+)?llego\b/gi, (m,t,p)=>`${t} ${p||""}llegué`, "⏪ ayer → llegué", "«Ayer» es pasado: usamos «llegué»."],
    [/\b(ayer|anoche)\s+(yo\s+)?compro\b/gi, (m,t,p)=>`${t} ${p||""}compré`, "⏪ ayer → compré", "«Ayer» es pasado: usamos «compré»."],
    [/\b(ayer|anoche)\s+(yo\s+)?estudio\b/gi, (m,t,p)=>`${t} ${p||""}estudié`, "⏪ ayer → estudié", "«Ayer» es pasado: usamos «estudié»."],
    [/\b(ayer|anoche)\s+(yo\s+)?trabajo\b/gi, (m,t,p)=>`${t} ${p||""}trabajé`, "⏪ ayer → trabajé", "«Ayer» es pasado: usamos «trabajé»."],
    [/\b(mañana)\s+(yo\s+)?fui\b/gi, (m,t,p)=>`${t} ${p||""}iré`, "⏩ mañana → iré", "«Mañana» es futuro: usamos «iré»."],
    [/\b(mañana)\s+(yo\s+)?tuve\b/gi, (m,t,p)=>`${t} ${p||""}tendré`, "⏩ mañana → tendré", "«Mañana» es futuro: usamos «tendré»."],
    [/\b(mañana)\s+(yo\s+)?hice\b/gi, (m,t,p)=>`${t} ${p||""}haré`, "⏩ mañana → haré", "«Mañana» es futuro: usamos «haré»."],
    [/\b(mañana)\s+(yo\s+)?compr[eé]\b/gi, (m,t,p)=>`${t} ${p||""}compraré`, "⏩ mañana → compraré", "«Mañana» es futuro: usamos «compraré»."],
    [/\b(mañana)\s+(yo\s+)?trabaj[eé]\b/gi, (m,t,p)=>`${t} ${p||""}trabajaré`, "⏩ mañana → trabajaré", "«Mañana» es futuro: usamos «trabajaré»."]
  ];
  for(const [re, repl, form, msg] of TIME_FIXES){
    if(re.test(improved)){
      improved = improved.replace(re, repl);
      add("tense", "⏱️ Tiempo", "Pasado / Futuro", form, msg);
    }
  }

  // 5. Ser / Estar / Tener
  const SER_ESTAR_TENER = [
    [/\b(yo|estoy|soy)\s+(hambre|sed|fr[ií]o|calor|sueño|miedo|apuro|prisa)\b/gi,
      (m,a,n)=>`${/^yo$/i.test(a)?"Yo tengo":"tengo"} ${n.toLowerCase()}`,
      "😋 Sensación → ✅ tengo",
      "Hambre, sed, frío o apuro siempre usan «tener»."],
    [/\b(yo|soy|estoy)\s+(\d{1,2})\s+a[nñ]os\b/gi,
      (m,a,num)=>`${/^yo$/i.test(a)?"Yo tengo":"tengo"} ${num} años`,
      "🎂 Edad → ✅ tengo ___ años",
      "La edad se expresa con «tener», no con «ser» ni «estar»."],
    [/\b(yo)\s+(una\s+)?duda\b/gi,
      (m,p)=>`${p} tengo una duda`,
      "❓ Duda → ✅ tengo una duda",
      "Usa el verbo «tengo» antes de «una duda»."],
    [/\b(soy)\s+(en\s+el|en\s+la|en\s+casa|en\s+mi|cerca|listo|lista|cansado|cansada|enfermo|enferma|bien|ocupado|ocupada|contento|contenta|feliz\s+de)\b/gi,
      (m,s,rest)=>`${matchCase(s,"estoy")} ${rest}`,
      "📍 Lugar / 😊 Estado → ✅ estoy",
      "Para ubicación y cómo te sientes usamos «estar», no «ser»."],
    [/\b(yo)\s+(en\s+casa|en\s+el\s+trabajo|en\s+el\s+paradero|cerca|cansado|cansada|bien|listo|lista|enfermo|enferma|ocupado|ocupada|contento|contenta)\b/gi,
      (m,p,rest)=>`${p} estoy ${rest}`,
      "📍 Lugar / 😊 Estado → ✅ estoy",
      "En español agregamos «estoy» antes del lugar o estado."]
  ];
  for(const [re, repl, form, msg] of SER_ESTAR_TENER){
    if(re.test(improved)){
      improved = improved.replace(re, repl);
      add("ser_estar", "🧩 Ser / Estar / Tener", "Verbo correcto", form, msg);
    }
  }

  // 6. Contracciones y preposiciones
  if(/\ba\s+el\b/i.test(improved)){
    improved = improved.replace(/\ba\s+el\b/gi, m => matchCase(m[0], "al"));
    add("preposition", "📍 Unión", "Contracción «al»", "❌ a el  →  ✅ al", "«a + el» siempre se une en «al» (al centro, al trabajo).");
  }
  if(/\bde\s+el\b/i.test(improved)){
    improved = improved.replace(/\bde\s+el\b/gi, m => matchCase(m[0], "del"));
    add("preposition", "📍 Unión", "Contracción «del»", "❌ de el  →  ✅ del", "«de + el» siempre se une en «del» (cerca del parque).");
  }
  const PREP_FIXES = [
    [/\b(voy|fui|ir[eé]|vamos|va)\s+(casa)\b/gi, "$1 a $2", "✅ voy a casa", "Con movimiento usamos «a»."],
    [/\b(voy|fui|ir[eé]|vamos|va)\s+(trabajo|centro|mercado|colegio|hospital|banco|paradero|terminal|parque|cine)\b/gi, "$1 al $2", "✅ voy al + lugar", "Con lugares masculinos usamos «al»."],
    [/\b(voy|fui|ir[eé]|vamos|va)\s+(plaza|universidad|oficina|farmacia|bodega|cl[ií]nica|municipalidad|librer[ií]a)\b/gi, "$1 a la $2", "✅ voy a la + lugar", "Con lugares femeninos usamos «a la»."],
    [/\b(estoy|estuve|estar[eé]|estamos|est[aá])\s+(casa)\b/gi, "$1 en $2", "✅ estoy en casa", "Para ubicación usamos «en»."],
    [/\b(estoy|estuve|estar[eé]|estamos|est[aá])\s+(trabajo|centro|paradero|bus|hospital|banco|mercado|colegio|terminal|cine)\b/gi, "$1 en el $2", "✅ estoy en el + lugar", "Para ubicación masculina usamos «en el»."],
    [/\b(estoy|estuve|estar[eé]|estamos|est[aá])\s+(plaza|oficina|universidad|farmacia|bodega|calle|librer[ií]a)\b/gi, "$1 en la $2", "✅ estoy en la + lugar", "Para ubicación femenina usamos «en la»."],
    [/\b(voy|ir[eé]|fui|vamos)\s+(bus|taxi|tren|metro|carro)\b/gi, "$1 en $2", "🚌 ✅ voy en bus", "Con transporte usamos «en»."],
    [/\bcon\s+mi\b/gi, "conmigo", "❌ con mi → ✅ conmigo", "Se escribe unido: «conmigo»."],
    [/\bcon\s+ti\b/gi, "contigo", "❌ con ti → ✅ contigo", "Se escribe unido: «contigo»."],
    [/\bpara\s+mi\b(?!\s+[a-záéíóúüñ])/gi, "para mí", "✅ para mí", "«Mí» lleva tilde cuando habla de tu persona."]
  ];
  for(const [re, repl, form, msg] of PREP_FIXES){
    if(re.test(improved)){
      improved = improved.replace(re, repl);
      add("preposition", "📍 Preposición", "Lugar y dirección", form, msg);
    }
  }

  // 7. Concordancia de género y número
  improved = improved.replace(/\b(el|un|la|una)\s+([a-zñáéíóúü]+)\b/gi, (full, art, noun) => {
    const aKey = art.toLocaleLowerCase("es");
    const nKey = noun.toLocaleLowerCase("es");
    if(nKey === "agua" && aKey === "la"){
      add("agreement", "🧩 Género", "Artículo con «agua»", "❌ la agua → ✅ el agua", "En singular usamos «el agua».");
      return `${matchCase(art, "el")} ${noun}`;
    }
    if((aKey === "el" || aKey === "un") && FEM_NOUNS.has(nKey)){
      const fixedArt = aKey === "el" ? "la" : "una";
      add("agreement", "🧩 Género", `Femenino: «${noun}»`, `👩 ❌ ${aKey} ${noun} → ✅ ${fixedArt} ${noun}`, `«${noun}» es femenino.`);
      return `${matchCase(art, fixedArt)} ${noun}`;
    }
    if((aKey === "la" || aKey === "una") && MASC_NOUNS.has(nKey)){
      const fixedArt = aKey === "la" ? "el" : "un";
      add("agreement", "🧩 Género", `Masculino: «${noun}»`, `👨 ❌ ${aKey} ${noun} → ✅ ${fixedArt} ${noun}`, `«${noun}» es masculino.`);
      return `${matchCase(art, fixedArt)} ${noun}`;
    }
    return full;
  });

  improved = improved.replace(/\bmucho\s+(personas|cosas|tareas|dudas|preguntas|horas|veces|copias|hojas|frutas)\b/gi, (m, n) => {
    add("agreement", "🧩 Plural", "Femenino plural", `❌ mucho ${n} → ✅ muchas ${n}`, `«${n}» es femenino plural.`);
    return `muchas ${n}`;
  });
  improved = improved.replace(/\bmucho\s+(amigos|minutos|dias|días|años|datos|documentos|mensajes|libros|problemas)\b/gi, (m, n) => {
    add("agreement", "🧩 Plural", "Masculino plural", `❌ mucho ${n} → ✅ muchos ${n}`, `«${n}» es masculino plural.`);
    return `muchos ${n}`;
  });

  improved = improved.replace(
    /\b(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|veinte|treinta|varios|varias|muchos|muchas|[2-9]|[1-9]\d+)\s+([a-zñáéíóúü]+)\b/gi,
    (full, qty, noun) => {
      const nKey = noun.toLocaleLowerCase("es");
      if(PLURAL_MAP[nKey]){
        add("agreement", "🔢 Plural", "Más de uno", `❌ ${qty} ${noun} → ✅ ${qty} ${PLURAL_MAP[nKey]}`, "Con 2 o más el sustantivo termina en -s / -es.");
        return `${qty} ${PLURAL_MAP[nKey]}`;
      }
      return full;
    }
  );

  // 8. Conectores
  const isQuestionText = improved.includes("?") || improved.includes("¿");
  if(!isQuestionText && /\bpor\s+que\b/i.test(improved)){
    improved = improved.replace(/\bpor\s+que\b/gi, m => matchCase(m[0], "porque"));
    add("connector", "🔗 Conector", "Motivo: «porque»", "💡 ❌ por que → ✅ porque", "Para explicar un motivo se escribe junto y sin tilde.");
  }
  if(isQuestionText && /^¿?\s*porque\b/i.test(improved)){
    improved = improved.replace(/^(¿?\s*)porque\b/i, (m, pre) => `${pre}${matchCase(m.trim().replace(/^¿/,"")[0], "por qué")}`);
    add("connector", "🔗 Conector", "Pregunta: «¿por qué?»", "❓ ✅ ¿Por qué…?", "En pregunta va separado y con tilde.");
  }
  if(/\b(pero\s+sin\s+embargo|mas\s+sin\s+embargo)\b/i.test(improved)){
    improved = improved.replace(/\b(pero\s+sin\s+embargo|mas\s+sin\s+embargo)\b/gi, "sin embargo");
    add("connector", "🔗 Conector", "Un solo conector", "❌ pero sin embargo → ✅ sin embargo", "Usa solo uno de los dos.");
  }
  if(/[\p{L}\p{N}]\s+(pero|sin embargo)\s+[\p{L}]/iu.test(improved)){
    improved = improved.replace(/([\p{L}\p{N}])\s+(pero|sin embargo)(?=\s+[\p{L}])/giu, "$1, $2");
    add("connector", "🔗 Conector", "Coma antes de «pero»", "Idea 1, pero Idea 2", "La coma separa las dos ideas.");
  }

  // 9. Tildes contextuales e inequívocas
  const CONTEXT_ACCENTS = [
    [/\bno\s+se\b/gi, "no sé", "✅ no sé", "«Sé» (de saber) lleva tilde."],
    [/\besta\s+(bien|listo|lista|cerca|lejos|aqui|aquí|correcto|correcta|claro|clara|ocupado|ocupada|lloviendo|vencido|por\s+vencer|en\s+el|en\s+la|en\s+casa)\b/gi,
      (m,w)=>`${matchCase(m[0],"está")} ${w}`, "✅ está + lugar/estado", "«Está» (del verbo estar) lleva tilde."],
    [/\bcomo\s+estas\b/gi, m => matchCase(m[0], "cómo estás"), "✅ ¿Cómo estás?", "Lleva tilde en preguntas y saludos."],
    [/\ba\s+que\s+hora\b/gi, m => matchCase(m[0], "a qué hora"), "✅ ¿A qué hora?", "«Qué» lleva tilde al preguntar."],
    [/\bcuanto\s+(cuesta|demora|dura|es|sale|tiempo)\b/gi, (m,w)=>`${matchCase(m[0],"cuánto")} ${w}`, "✅ ¿Cuánto…?", "«Cuánto» lleva tilde al preguntar."],
    [/\bdonde\s+(esta|estas|queda|es|puedo|nos)\b/gi, (m,w)=>`${matchCase(m[0],"dónde")} ${w}`, "✅ ¿Dónde…?", "«Dónde» lleva tilde al preguntar."],
    [/\bmas\s+(tarde|adelante|o\s+menos|temprano|fácil|facil|rápido|rapido|cerca|lejos|grande|pequeño|pequeno)\b/gi,
      (m,w)=>`${matchCase(m[0],"más")} ${w}`, "✅ más (cantidad)", "«Más» lleva tilde para cantidad."],
    [/\baun\s+no\b/gi, m => matchCase(m[0], "aún no"), "✅ aún no (= todavía no)", "«Aún» lleva tilde cuando significa todavía."]
  ];
  for(const [re, repl, form, msg] of CONTEXT_ACCENTS){
    if(re.test(improved)){
      improved = improved.replace(re, repl);
      add("accent", "✏️ Tilde", "Acento escrito", form, msg);
    }
  }

  improved = improved.replace(/[\p{L}]+/gu, word => {
    const key = word.toLocaleLowerCase("es");
    if(!UNAMBIGUOUS_ACCENTS[key]) return word;
    const val = UNAMBIGUOUS_ACCENTS[key];
    if(val === key) return word;
    add("accent", "✏️ Tilde", "Palabras con tilde", `❌ ${key} → ✅ ${val}`, "Mira las letras marcadas en verde arriba.");
    return matchCase(word, val);
  });

  if(/^si([,.\s!]|$)/i.test(improved) && !/^si\s+(puedes|puede|llueve|hay|me|te|nos|es|no\s+tengo|encuentro|llegas|quieres|desea|necesita|alguien|vas)/i.test(improved)){
    improved = improved.replace(/^si\b/i, m => matchCase(m, "sí"));
    add("accent", "✏️ Tilde", "Sí (afirmar)", "✅ Sí (afirmar)  ·  si (condición)", "«Sí» lleva tilde cuando respondes afirmativamente.");
  }

  // 10. Mayúscula inicial y signos de pregunta / cierre
  if(/^[a-záéíóúüñ]/.test(improved)){
    improved = improved[0].toLocaleUpperCase("es") + improved.slice(1);
    add("capital", "✏️ Signos", "Mayúscula inicial", "A… al empezar", "La primera letra de la oración va en mayúscula.");
  }
  improved = improved.replace(/([.!?]\s+)([a-záéíóúüñ])/g, (m, sep, ch) => sep + ch.toLocaleUpperCase("es"));

  const looksLikeQuestion = /^(?:¿|puedo|puede|puedes|podr[ií]a|podr[ií]as|a\s+qu[eé]\s+hora|d[oó]nde\s+est[aá]|cu[aá]nto\s+(?:cuesta|demora|dura|sale)|qu[eé]\s+d[ií]a|cu[aá]ndo\s+|cu[aá]l\s+es|me\s+(?:avisa|avisas|puede|puedes|podr[ií]a)|acepta|aceptan|tienes|tiene\s+sencillo|se\s+puede)\b/i.test(improved);
  if(improved.endsWith("?") && !improved.includes("¿") && !/[.!;]/.test(improved)){
    improved = "¿" + improved;
    add("punctuation", "❓ Pregunta", "Signos ¿ ?", "✅ ¿Pregunta?", "En español se abre con ¿ y se cierra con ?.");
  } else if(improved.startsWith("¿") && !/[?]$/.test(improved) && !/[.!;]/.test(improved)){
    improved += "?";
    add("punctuation", "❓ Pregunta", "Cerrar con ?", "✅ ¿Pregunta?", "Cierra la pregunta con ?.");
  } else if(looksLikeQuestion && !improved.includes("?") && !/[.!;]$/.test(improved)){
    improved = (improved.startsWith("¿") ? "" : "¿") + improved + "?";
    add("punctuation", "❓ Pregunta", "Signos ¿ ?", "✅ ¿Pregunta?", "Tu mensaje es una pregunta: lleva ¿ al inicio y ? al final.");
  } else if(improved && !/[.!?…]$/.test(improved) && !/[¿¡]/.test(improved)){
    improved += ".";
    add("punctuation", "✏️ Signos", "Punto final", "Oración completa.", "Cierra tu idea con un punto.");
  }

  // 11. Reconocer conectores y objetivo del turno
  const usedConnectors = detectConnectors(improved);
  const focus = turn.focus || null;
  if(focus && Array.isArray(focus.highlight) && focus.highlight.length){
    const nImp = normalize(improved);
    const matched = focus.highlight.filter(h => {
      const hn = normalize(h);
      return hn && new RegExp(`(?:^|\\s)${hn.replace(/\s+/g,"\\s+")}(?:$|\\s)`).test(nImp);
    });
    if(matched.length){
      addPraise("¡Bien usado!", `Aplicaste «${matched[0]}» en tu mensaje.`);
    }
  } else if(usedConnectors.length){
    addPraise("Buen conector", `Uniste tus ideas con «${usedConnectors[0]}».`);
  }

  // 12. Relevancia básica
  const n = normalize(original), ws = tokens(original);
  const context = tokens([turn.prompt, ...(turn.keywords || [])].join(" "));
  const related = ws.some(w => w.length > 3 && context.some(k => k.length > 3 && (w === k || w.startsWith(k))));
  const yesNo = /^(si|no|claro|todavia no|aun no|de acuerdo|no gracias)(\s|$)/.test(n);
  const closed = /^(hola |buenos dias |buenas tardes )?(ya|puede|puedes|tiene|tienes|quiere|quieres|desea|necesita|hay|es|esta|ha|acepta|podemos|lleva|cambio|cambiaron|te apuntas|viaja|mantiene)\b/.test(normalize(turn.prompt));
  const sample = (turn.alternatives || []).concat(turn.model || "").some(s => normalize(s) === n);
  const enough = !!n && ((yesNo && closed) || sample || related || ws.length >= 4);
  const unrecognized = !enough;

  if(unrecognized){
    add("clarity", "💬 Idea", "Completa tu mensaje", "", "Falta el dato que te preguntaron. Puedes agregar un detalle o tocar una opción.");
  }
  if(turn.why) add("focus", "📘 Clave", "Para practicar", "", String(turn.why));

  return {
    original,
    improved,
    changed: improved !== original,
    diff: computeVisualDiff(original, improved),
    notes,
    praises,
    usedConnectors,
    unrecognized
  };
}

function decision(text){
  const n = normalize(text);
  if(/^(no|todavia no|aun no|no puedo|no gracias|prefiero no|me encantaria pero|me gustaria pero)(\s|$)/.test(n)) return "no";
  if(/^(si|claro|de acuerdo|perfecto|dale|bueno|por supuesto)(\s|$)/.test(n)) return "yes";
  return "other";
}

function buildContextualReply(scenario, turnIndex, userText, nextTurnPrompt, done, defaultClosing){
  const baseReply = done ? defaultClosing : nextTurnPrompt;
  const currentTurn = scenario?.turns?.[turnIndex] || {};
  const n = normalize(userText);
  const tone = scenario?.tone || "amigable";

  if(currentTurn.reactions && !done){
    const r = currentTurn.reactions;
    if(r.no && decision(userText) === "no") return `${r.no} ${baseReply}`;
    if(r.yes && decision(userText) === "yes") return `${r.yes} ${baseReply}`;
    if(r.uncertain && /\b(no se|no lo se|todavia no se|aun no se|no estoy segur)\b/.test(n)) return `${r.uncertain} ${baseReply}`;
    if(r.contrast && /\b(pero|aunque|sin embargo|en cambio)\b/.test(n)) return `${r.contrast} ${baseReply}`;
    if(r.reason && /\b(porque|ya que|por eso)\b/.test(n)) return `${r.reason} ${baseReply}`;
  }
  if(done) return baseReply;

  const startsWithAck = /^(claro|perfecto|listo|entiendo|entendido|excelente|muy bien|buenazo|de acuerdo|está bien|esta bien|sí|si,|no hay problema|gracias|¡|buena|me gusta|qué bien|que bien)/i.test(baseReply.trim());
  if(startsWithAck) return baseReply;

  const isFormal = tone === "formal" || tone === "cordial";
  if(/\b(no se|no lo se|todavia no se|aun no se|no estoy segur)\b/.test(n)){
    return `${isFormal ? "No se preocupe, tómese su tiempo." : "No te preocupes, luego lo vemos con calma."} ${baseReply}`;
  }
  if(/\b(trafico|lluvia|lloviendo|demor|tarde)\b/.test(n) && !/trafico|lluv/.test(normalize(baseReply))){
    const ack = tone === "cercano" ? "Uy, qué pesado el tráfico, ven con cuidado." : (isFormal ? "Entiendo el inconveniente con el tiempo." : "Sí, a veces el tráfico complica todo.");
    return `${ack} ${baseReply}`;
  }
  if(/\b(cansad|dolor|fiebre|enferm)\b/.test(n) && !/fiebre|tos|dolor/.test(normalize(baseReply))){
    return `${isFormal ? "Comprendo, espero que pronto se sienta mejor." : "Uy, cuídate mucho entonces."} ${baseReply}`;
  }
  if(/\b(porque|ya que)\b/.test(n)){
    return `${isFormal ? "Entiendo perfectamente el motivo." : "Ah, ahora entiendo bien."} ${baseReply}`;
  }
  if(/\b(pero|aunque|sin embargo)\b/.test(n)){
    return `${isFormal ? "Comprendo su punto." : "Entiendo, podemos adaptarlo."} ${baseReply}`;
  }
  if(/\?/.test(userText) && !/\?/.test(currentTurn.model || "")){
    return `${isFormal ? "Buena consulta, lo tendré en cuenta." : "Buena pregunta."} ${baseReply}`;
  }
  if(decision(userText) === "no" && !/no\b/.test(normalize(baseReply.slice(0, 20)))){
    return `${isFormal ? "De acuerdo, comprendo." : "Entiendo, no hay problema."} ${baseReply}`;
  }
  return baseReply;
}

function responseGuide(turn = {}){
  const full = String(turn.prompt || "");
  const question = full.match(/¿([^?]+)\?/);
  const p = normalize(question ? question[1] : full);
  const spec = (kind, aim, starter, check) => ({ kind, aim, starter, check });
  if(/por que|que razon|que motivo/.test(p)) return spec("reason", "Explica el motivo con «porque».", "Porque ", "¿Expliqué el motivo?");
  if(/que hora|cuando|para que dia|cuanto tiempo|desde cuando/.test(p)) return spec("time", "Indica hora, día o tiempo.", /desde cuando/.test(p) ? "Desde " : /para que dia/.test(p) ? "Para el " : "Aproximadamente ", "¿Dije cuándo o cuánto tiempo?");
  if(/a que ciudad|a donde/.test(p)) return spec("destination", "Di a qué lugar vas (a / al).", /ciudad|viajar/.test(p) ? "Quiero viajar a " : "Voy a ", "¿Indiqué el lugar?");
  if(/donde|en que parte|cual.*direccion/.test(p)) return spec("place", "Indica el lugar (en / cerca del).", /estas|esta ahora/.test(p) ? "Estoy en " : "El lugar es ", "¿Se entiende el lugar?");
  if(/cuant[oa]s?\b/.test(p)) return spec("quantity", "Di la cantidad en plural si es 2+.", "Necesito ", "¿Usé plural si es más de uno?");
  if(/\bo\b/.test(p) && question) return spec("choice", "Elige una opción.", "Prefiero ", "¿Se entiende qué opción prefiero?");
  if(/^(ya|puede|puedes|tiene|tienes|quiere|quieres|desea|necesita|hay|es|esta|ha|acepta|podemos|lleva|cambio|cambiaron|vas a|vas|has|te apuntas|viaja|mantiene)\b/.test(p) && question) return spec("confirm", "Confirma o rechaza + un detalle.", "Sí, ", "¿Se entiende mi decisión?");
  if(/que.*pasa|problema|dificultad|que ocurrio/.test(p)) return spec("explain", "Cuenta qué ocurre y desde cuándo.", "Lo que pasa es que ", "¿Expliqué qué pasa?");
  if(/como|que parte|que informacion/.test(p)) return spec("detail", "Explica tu idea con un detalle.", "Creo que ", "¿Añadí el dato útil?");
  if(/que.*(?:llevar|necesita|necesitas|desea|quieres)|en que puedo ayudar/.test(p)) return spec("request", "Di qué necesitas (Quisiera / Necesito).", "Quisiera ", "¿Se entiende qué pido?");
  return spec("open", "Responde con tus palabras o toca una opción.", "", "¿Expresa bien mi idea?");
}

function communicationFeedback(text, turn = {}){
  const guide = responseGuide(turn), n = normalize(text);
  const uncertain = /\b(no se|no lo se|no estoy segur[oa]|aun no se|todavia no se|no recuerdo|no tengo esa informacion)\b/.test(n);
  const shortConfirm = /^(si|no|bien|claro|ok|de acuerdo|gracias|si gracias|no gracias)$/.test(n);
  let focus = guide.check, label = "Tu idea en el chat";
  if(uncertain){
    label = "Está bien decir que no sabes";
    focus = "Si quieres, añade cuándo lo confirmarás.";
  } else if(shortConfirm && ["time","place","destination","quantity","reason","choice"].includes(guide.kind)){
    label = "Falta un dato clave";
    const missing = {time:"hora o día",place:"lugar",destination:"destino",quantity:"cantidad",reason:"motivo (con «porque»)",choice:"opción"}[guide.kind];
    focus = "Te piden: " + missing + ". Intenta agregarlo.";
  } else if(shortConfirm && guide.kind === "confirm"){
    label = "Respuesta corta válida";
    focus = "Si quieres practicar más, añade «porque…» o «, pero…».";
  }
  return { label, focus, guide };
}

function buildOptionsForTurn(turn = {}){
  if(Array.isArray(turn.options) && turn.options.length) return turn.options;
  const list = [];
  if(turn.model) list.push({ label: "💬 Respuesta natural", text: turn.model });
  (turn.alternatives || []).slice(0, 2).forEach((alt, i) => {
    const c = detectConnectors(alt);
    const lbl = c.length ? `🔗 Con «${c[0]}»` : (i === 0 ? "✨ Otra forma" : "💡 Alternativa");
    list.push({ label: lbl, text: alt });
  });
  return list;
}

function highlightFocusWords(text, words = []){
  let html = escapeHTML(text);
  const list = [...new Set((words || []).filter(Boolean))].sort((a,b) => b.length - a.length);
  if(!list.length) return html;
  const pattern = list.map(w => escapeHTML(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  try{
    const re = new RegExp(`(?<![\\p{L}\\p{N}])(${pattern})(?![\\p{L}\\p{N}])`, "giu");
    html = html.replace(re, '<mark class="hl-grammar">$1</mark>');
  }catch(_){}
  return html;
}

function nextGuided(scenario, index, text, memory = {}){
  let next = index + 1, closing = "";
  const choice = decision(text), n = normalize(text);
  if(scenario.id === "bodega-pan" && index === 1 && choice === "no") next = 3;
  if(scenario.id === "reniec-dni" && index === 2 && choice === "yes") next = 4;
  if(scenario.id === "banco-dni" && ((index === 3) || (index === 5)) && choice === "no") next = index + 2;
  if(scenario.id === "bus-centro" && index === 2) memory.busStop = n.includes("adelante") ? "farther" : "plaza";
  if(scenario.id === "bus-centro" && index === 5 && memory.busStop === "farther" && choice === "no"){
    next = scenario.turns.length; closing = "De acuerdo. Terminamos aquí la práctica del viaje.";
  }
  if((scenario.id === "entrevista-trabajo" && index === 6 || scenario.id === "viaje-terminal" && index === 8) && choice === "no"){
    next = scenario.turns.length; closing = "De acuerdo. Gracias por expresar tu decisión. Terminamos esta práctica.";
  }
  return { next, closing };
}

function parseAI(raw){
  let value;
  try { value = JSON.parse(String(raw).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")); }
  catch(_){ throw new Error("La IA no devolvió una respuesta válida."); }
  if(!value || Array.isArray(value) || typeof value.reply !== "string" || !value.reply.trim() || value.reply.length > 700)
    throw new Error("Respuesta incompleta de la IA.");
  for(const k of ["suggestion","explanation"]){
    if(typeof value[k] !== "string" || value[k].length > 700) throw new Error("Revisión incompleta de la IA.");
  }
  return { reply: value.reply.trim(), suggestion: value.suggestion.trim(), explanation: value.explanation.trim() };
}

function safeProgress(raw, ids, maxLevel = 3){
  const value = raw && typeof raw === "object" ? raw : {};
  const rawLvl = Math.trunc(Number(value.lastLevel) || 1);
  let mappedLvl = rawLvl;
  if(maxLevel === 3 && rawLvl > 3){
    mappedLvl = rawLvl <= 4 ? 2 : 3;
  }
  return {
    completed: [...new Set(Array.isArray(value.completed) ? value.completed : [])].filter(id => typeof id === "string" && ids.includes(id)),
    lastLevel: Math.min(maxLevel, Math.max(1, mappedLvl))
  };
}

const api = {
  normalize, tokens, escapeHTML, review, decision, nextGuided, parseAI,
  safeProgress, responseGuide, communicationFeedback,
  detectConnectors, buildOptionsForTurn, highlightFocusWords,
  buildContextualReply, CONNECTOR_CHIPS, computeVisualDiff,
  visualFormulaForTurn, questionIconForPrompt
};
if(typeof module === "object" && module.exports) module.exports = api;
else root.LSPChatCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
