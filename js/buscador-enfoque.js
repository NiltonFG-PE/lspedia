/* Reutiliza los paneles y el motor de coincidencias, incluso en el overlay móvil. */
(function () {
    'use strict';
    function iniciar() {
        [['buscar', 'sugerencias', 'btnBuscar'],
         ['buscarCategorias', 'sugerenciasCategorias', 'btnBuscarCategorias']].forEach(function (ids) {
            const input = document.getElementById(ids[0]);
            const panel = document.getElementById(ids[1]);
            const buscar = document.getElementById(ids[2]);
            if (!input || !panel || !buscar) return;
            let mostrandoInicio = false;
            function cerrar() {
                if (!mostrandoInicio) return;
                panel.replaceChildren();
                panel.style.display = 'none';
                panel.classList.remove('lsp-panel-inicio');
                mostrandoInicio = false;
            }
            function sugerir() {
                if (document.activeElement !== input || input.value.trim()) return;
                if (mostrandoInicio) return;
                const palabras = input.id === 'buscar'
                    ? Array.from(document.querySelectorAll('#bloqueEjemplos .ejemplo-chip'))
                        .filter(function (chip) { return chip.style.display !== 'none'; })
                        .map(function (chip) { return chip.dataset.palabra || chip.textContent.trim(); })
                    : typeof window.obtenerDatosVocabulario === 'function'
                        ? window.obtenerDatosVocabulario().map(function (p) { return p.palabra; }) : [];
                const disponibles = Array.from(new Set(palabras.filter(Boolean)));
                if (input.id === 'buscarCategorias') {
                    for (let i = disponibles.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [disponibles[i], disponibles[j]] = [disponibles[j], disponibles[i]];
                    }
                }
                const lista = disponibles.slice(0, 5);
                if (!lista.length) return;
                const bloque = document.createElement('div');
                bloque.className = 'lsp-sugerencias-inicio';
                const label = document.createElement('p');
                label.className = 'lsp-sugerencias-inicio-label';
                label.textContent = 'Puedes empezar con…';
                const opciones = document.createElement('div');
                opciones.className = 'lsp-sugerencias-inicio-lista';
                lista.forEach(function (palabra) {
                    const boton = document.createElement('button');
                    boton.type = 'button';
                    boton.className = 'lsp-sugerencia-inicio';
                    boton.textContent = palabra;
                    boton.addEventListener('click', function () {
                        cerrar();
                        input.value = palabra;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        buscar.click();
                    });
                    opciones.appendChild(boton);
                });
                bloque.append(label, opciones);
                panel.replaceChildren(bloque);
                panel.classList.add('lsp-panel-inicio');
                panel.style.display = 'block';
                mostrandoInicio = true;
            }
            input.addEventListener('focus', function () { setTimeout(sugerir, 0); });
            input.addEventListener('input', function () {
                cerrar();
                if (!input.value.trim()) setTimeout(sugerir, 0);
            }, true);
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') cerrar();
            });
            document.addEventListener('focusin', function (e) {
                if (e.target !== input && !panel.contains(e.target)) cerrar();
            });
            document.addEventListener('click', function (e) {
                if (e.target !== input && !panel.contains(e.target)) cerrar();
            });
            ['lspedia:datosListos', 'lspedia:datosConsultablesListos', 'lspedia:vocabularioPublicoListo']
                .forEach(function (evento) { document.addEventListener(evento, sugerir); });
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
}());
