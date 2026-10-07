/* ============================================================
   LSPedia — filtro de consultas cortas del Diccionario
   ------------------------------------------------------------
   Evita ruido cuando la persona apenas ha escrito 1–2 caracteres.
   Ejemplo: "ab" debe priorizar Abismo / palabras que empiezan por ab,
   y no mostrar Flexible por "Adaptable", Ecosistema por "Hábitat" o
   Felicitaciones por "Enhorabuena".

   A partir de 3 caracteres se conserva íntegro el predictor inteligente.
   ============================================================ */
(function(){
    'use strict';

    if(window.__LSPediaConsultasCortasFix) return;
    window.__LSPediaConsultasCortasFix = true;

    const INPUT_ID = 'buscar';
    const PANEL_ID = 'sugerencias';
    let aplicando = false;

    function normal(valor){
        return String(valor == null ? '' : valor)
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g,'')
            .toLocaleLowerCase('es-PE')
            .replace(/[^a-z0-9\s]/g,' ')
            .replace(/\s+/g,' ')
            .trim();
    }

    function variantes(item){
        return String((item && item.variantes) || '')
            .split(',')
            .map(x => x.trim())
            .filter(Boolean);
    }

    function formasIngles(item){
        return [
            item && item.ingles,
            item && item.word,
            item && item.english,
            item && item.traduccionIngles,
            item && item.traduccioningles
        ].map(v => String(v || '').trim()).filter(Boolean);
    }

    function aliasesOcultos(item){
        return Array.isArray(item && item._aliasBusqueda)
            ? item._aliasBusqueda.map(v => String(v || '').trim()).filter(Boolean)
            : [];
    }

    function candidatoDirecto(candidato, consulta){
        if(!candidato || !candidato.p) return false;
        const item = candidato.p;
        const tipo = String(candidato.tipo || '').toLowerCase();
        const nombre = normal(item.palabra);

        // La señal principal durante las primeras letras: el nombre real
        // empieza por lo que la persona está escribiendo.
        if(nombre.startsWith(consulta)) return true;

        // Conservamos relaciones EXACTAS, nunca parciales, para no romper
        // abreviaciones o formas útiles de dos letras que existan de verdad.
        if(tipo === 'variante'){
            return variantes(item).some(v => normal(v) === consulta);
        }
        if(tipo === 'ingles'){
            return formasIngles(item).some(v => normal(v) === consulta);
        }
        if(tipo === 'relacionada'){
            return aliasesOcultos(item).some(v => normal(v) === consulta);
        }

        // Estos tipos solo se producen por una coincidencia exacta del mapa
        // de ayuda cuando la consulta es tan corta (la distancia de edición
        // está desactivada por debajo de 3 caracteres).
        if(tipo === 'gramatica' || tipo === 'alias' || tipo === 'correccion' || tipo === 'exacta'){
            return true;
        }

        return false;
    }

    function filtrar(){
        if(aplicando) return;
        const input = document.getElementById(INPUT_ID);
        const panel = document.getElementById(PANEL_ID);
        if(!input || !panel) return;

        const consulta = normal(input.value);
        if(!consulta || consulta.length >= 3) return;

        const candidatos = Array.isArray(panel._lspPredCandidatos)
            ? panel._lspPredCandidatos
            : null;
        if(!candidatos || !candidatos.length) return;

        const filas = Array.from(panel.querySelectorAll(':scope > .list-group-item'));
        if(!filas.length) return;

        const conservar = candidatos.map(c => candidatoDirecto(c, consulta));
        if(conservar.every(Boolean)) return;

        aplicando = true;
        try{
            const filtrados = [];
            filas.forEach((fila, indice) => {
                if(conservar[indice]){
                    if(candidatos[indice]) filtrados.push(candidatos[indice]);
                }else{
                    fila.remove();
                }
            });

            panel._lspPredCandidatos = filtrados;

            if(!filtrados.length){
                panel.innerHTML = '';
                panel.style.display = 'none';
                panel.removeAttribute('role');
                panel.removeAttribute('aria-label');
            }
        } finally {
            aplicando = false;
        }
    }

    function iniciar(){
        const input = document.getElementById(INPUT_ID);
        const panel = document.getElementById(PANEL_ID);
        if(!input || !panel) return;

        if('MutationObserver' in window){
            const observer = new MutationObserver(function(){
                if(aplicando) return;
                requestAnimationFrame(filtrar);
            });
            observer.observe(panel,{childList:true,subtree:false});
        }

        input.addEventListener('input',function(){
            requestAnimationFrame(function(){ requestAnimationFrame(filtrar); });
        },{passive:true});

        document.addEventListener('lspedia:datosListos',function(){
            setTimeout(filtrar,0);
        });
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded',iniciar,{once:true});
    }else{
        iniciar();
    }
})();
