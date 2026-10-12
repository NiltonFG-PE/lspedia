const DIMENSION_VECTOR_LEGACY=127, DIMENSION_VECTOR_POSE=161, DIMENSION_VECTOR_MULTIMODAL=186;
function distanciaVector(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) ||
      a.length < DIMENSION_VECTOR_LEGACY || b.length < DIMENSION_VECTOR_LEGACY) return 99;

  const rms = (inicio, fin) => {
    let suma = 0;
    let n = 0;
    for (let i = inicio; i < fin; i++) {
      const d = Number(a[i]) - Number(b[i]);
      suma += d * d;
      n += 1;
    }
    return n ? Math.sqrt(suma / n) : 99;
  };

  const manos = rms(0, DIMENSION_VECTOR_LEGACY);
  if (a.length >= DIMENSION_VECTOR_MULTIMODAL && b.length >= DIMENSION_VECTOR_MULTIMODAL) {
    const pose = rms(DIMENSION_VECTOR_LEGACY, DIMENSION_VECTOR_POSE);
    const rostro = rms(DIMENSION_VECTOR_POSE, DIMENSION_VECTOR_MULTIMODAL);
    return manos * 0.64 + pose * 0.21 + rostro * 0.15;
  }
  if (a.length >= DIMENSION_VECTOR_POSE && b.length >= DIMENSION_VECTOR_POSE) {
    const pose = rms(DIMENSION_VECTOR_LEGACY, DIMENSION_VECTOR_POSE);
    return manos * 0.78 + pose * 0.22;
  }
  return manos;
}

export function distanciaSecuencia(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || !a.length || !b.length) return 99;
  const n = a.length, m = b.length;
  let anterior = new Array(m + 1).fill(Infinity);
  anterior[0] = 0;
  for (let i = 1; i <= n; i++) {
    const actual = new Array(m + 1).fill(Infinity);
    for (let j = 1; j <= m; j++) {
      const coste = distanciaVector(a[i - 1], b[j - 1]);
      actual[j] = coste + Math.min(actual[j - 1], anterior[j], anterior[j - 1]);
    }
    anterior = actual;
  }
  return anterior[m] / (n + m);
}

// Experimental reference matching; distances are not probabilities.
export function decidirCoincidencia(secuencia, banco, distancia) {
  const grupos = new Map();
  for (const muestra of banco) {
    if (!muestra?.etiqueta || !Array.isArray(muestra.frames)) continue;
    const d = distancia(secuencia, muestra.frames);
    if (!Number.isFinite(d)) continue;
    const grupo = grupos.get(muestra.etiqueta) || [];
    grupo.push({ muestra, d }); grupos.set(muestra.etiqueta, grupo);
  }
  const candidatos = [...grupos].map(([etiqueta, valores]) => {
    valores.sort((a,b)=>a.d-b.d);
    return { etiqueta, distancia:valores[Math.min(1,valores.length-1)].d, valores };
  }).sort((a,b)=>a.distancia-b.distancia);
  const rechazo = motivo => ({aceptada:false,motivo,candidatos});
  const primero=candidatos[0];
  if(!primero) return rechazo('Sin muestras compatibles.');
  if(primero.valores.length<3 || candidatos.length<2) return rechazo('Necesitamos dos conceptos y tres muestras del concepto candidato.');
  const refs=primero.valores.slice(0,5), pares=[];
  for(let i=0;i<refs.length;i++) for(let j=i+1;j<refs.length;j++) {
    const d=distancia(refs[i].muestra.frames,refs[j].muestra.frames);
    if(Number.isFinite(d)) pares.push(d);
  }
  pares.sort((a,b)=>a-b);
  const umbral=Math.min(.12,Math.max(.025,(pares[Math.floor(pares.length/2)]??0)*2));
  if(primero.distancia>umbral) return rechazo('La seña no se parece lo suficiente a las muestras.');
  if(candidatos[1].distancia-primero.distancia<Math.max(.015,primero.distancia*.35)) return rechazo('Hay conceptos demasiado parecidos; repite la seña.');
  return {aceptada:true,etiqueta:primero.etiqueta,candidatos,umbral};
}
export class SegmentadorSenas {
  constructor(){this.reiniciar();}
  reiniciar(){this.frames=[];this.inicio=0;this.ultimaMano=0;this.esperandoPausa=false;}
  actualizar(vector,tiempo){
    if(!vector){
      if(tiempo-this.ultimaMano<450) return null;
      const frames=this.frames; this.reiniciar();
      return frames.length>=12?this.remuestrear(frames):null;
    }
    this.ultimaMano=tiempo;
    if(this.esperandoPausa) return null;
    if(!this.frames.length) this.inicio=tiempo;
    this.frames.push(vector);if(this.frames.length>56)this.frames.shift();
    if(tiempo-this.inicio>=2400 && this.frames.length>=12){
      const salida=this.remuestrear(this.frames);this.frames=[];this.esperandoPausa=true;return salida;
    }
    return null;
  }
  remuestrear(frames){return Array.from({length:24},(_,i)=>frames[Math.round(i*(frames.length-1)/23)]);}
}
