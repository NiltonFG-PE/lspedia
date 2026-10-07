/* ============================================================
   LSPedia — corrección de capas + consultas cortas del buscador
   ------------------------------------------------------------
   1) Eleva temporalmente el contexto correcto cuando el panel de
      sugerencias está abierto, para que "Lo nuevo" y otras tarjetas
      no se pinten encima.
   2) Evita ruido cuando la persona apenas ha escrito 1–2 caracteres.
      Ejemplo: "ab" debe mostrar Abismo / palabras que empiezan por ab,
      no Flexible por "Adaptable", Ecosistema por "Hábitat" o
      Felicitaciones por "Enhorabuena".
   ============================================================ */
(function(){
    'use strict';

    if(window.__LSPediaBuscadorCapasFix) return;
    window.__LSPediaBuscadorCapasFix = true;

    let filtrandoConsultaCorta = false;

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
            .map(function(x){ return x.trim(); })
            .filter(Boolean);
    }

    function formasIngles(item){
        return [
            item && item.ingles,
            item && item.word,
            item && item.english,
            item && item.traduccionIngles,
            item && item.traduccioningles
        ].map(function(v){ return String(v || '').trim(); }).filter(Boolean);
    }

    function aliasesOcultos(item){
        return Array.isArray(item && item._aliasBusqueda)
            ? item._aliasBusqueda.map(function(v){ return String(v || '').trim(); }).filter(Boolean)
            : [];
    }

    function candidatoDirecto(candidato, consulta){
        if(!candidato || !candidato.p) return false;
        const item = candidato.p;
        const tipo = String(candidato.tipo || '').toLowerCase();
        const nombre = normal(item.palabra);

        // En 1–2 letras, la señal principal es que el nombre REAL empiece
        // por lo que se escribió. Esto mantiene Abismo para "ab".
        if(nombre.startsWith(consulta)) return true;

        // Relaciones exactas sí se conservan; las parciales no.
        if(tipo === 'variante'){
            return variantes(item).some(function(v){ return normal(v) === consulta; });
        }
        if(tipo === 'ingles'){
            return formasIngles(item).some(function(v){ return normal(v) === consulta; });
        }
        if(tipo === 'relacionada'){
            return aliasesOcultos(item).some(function(v){ return normal(v) === consulta; });
        }

        // Con menos de 3 caracteres, el predictor no usa distancia de
        // edición, así que estos tipos corresponden a ayudas exactas.
        if(tipo === 'gramatica' || tipo === 'alias' || tipo === 'correccion' || tipo === 'exacta'){
            return true;
        }

        return false;
    }

    function filtrarConsultaCorta(){
        if(filtrandoConsultaCorta) return;
        const input = document.getElementById('buscar');
        const panel = document.getElementById('sugerencias');
        if(!input || !panel) return;

        const consulta = normal(input.value);
        if(!consulta || consulta.length >= 3) return;

        const candidatos = Array.isArray(panel._lspPredCandidatos)
            ? panel._lspPredCandidatos
            : null;
        if(!candidatos || !candidatos.length) return;

        const filas = Array.from(panel.querySelectorAll(':scope > .list-group-item'));
        if(!filas.length) return;

        const conservar = candidatos.map(function(c){ return candidatoDirecto(c, consulta); });
        if(conservar.every(Boolean)) return;

        filtrandoConsultaCorta = true;
        try{
            const filtrados = [];
            filas.forEach(function(fila, indice){
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
            filtrandoConsultaCorta = false;
        }
    }

    function panelVisible(panel){
        if(!panel || !panel.isConnected) return false;
        if(!panel.children.length && !String(panel.textContent || '').trim()) return false;

        const estilo = window.getComputedStyle(panel);
        if(estilo.display === 'none' || estilo.visibility === 'hidden') return false;
        if(Number(estilo.opacity) === 0) return false;

        return panel.getClientRects().length > 0;
    }

    function actualizar(){
        const sugerencias = document.getElementById('sugerencias');
        const hero = document.getElementById('filaHeroPrincipal');
        const sugerenciasVocab = document.getElementById('sugerenciasCategorias');
        const bloqueVocab = document.getElementById('bloqueBuscadorCategorias');

        if(hero){
            hero.classList.toggle('lsp-buscador-desplegado', panelVisible(sugerencias));
        }

        if(bloqueVocab){
            bloqueVocab.classList.toggle('lsp-buscador-desplegado', panelVisible(sugerenciasVocab));
        }
    }

    function observar(panel){
        if(!panel || !('MutationObserver' in window)) return;
        const observer = new MutationObserver(function(){
            requestAnimationFrame(function(){
                filtrarConsultaCorta();
                actualizar();
            });
        });
        observer.observe(panel, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden']
        });
    }

    function iniciar(){
        const sugerencias = document.getElementById('sugerencias');
        const sugerenciasVocab = document.getElementById('sugerenciasCategorias');

        observar(sugerencias);
        observar(sugerenciasVocab);

        ['buscar', 'buscarCategorias'].forEach(function(id){
            const input = document.getElementById(id);
            if(!input) return;
            input.addEventListener('input', function(){
                requestAnimationFrame(function(){
                    requestAnimationFrame(function(){
                        filtrarConsultaCorta();
                        actualizar();
                    });
                });
            }, {passive:true});
            input.addEventListener('focus', function(){ requestAnimationFrame(actualizar); }, {passive:true});
            input.addEventListener('blur', function(){ setTimeout(actualizar, 80); }, {passive:true});
        });

        document.addEventListener('click', function(){
            setTimeout(function(){
                filtrarConsultaCorta();
                actualizar();
            }, 0);
        }, {passive:true});

        document.addEventListener('lspedia:datosListos', function(){
            setTimeout(function(){
                filtrarConsultaCorta();
                actualizar();
            }, 0);
        });

        window.addEventListener('resize', actualizar, {passive:true});

        actualizar();
        setTimeout(function(){ filtrarConsultaCorta(); actualizar(); }, 250);
        setTimeout(function(){ filtrarConsultaCorta(); actualizar(); }, 900);
    }

    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', iniciar, {once:true});
    }else{
        iniciar();
    }
})();