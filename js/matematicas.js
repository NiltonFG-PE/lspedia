/* ============================================================
   LSPedia - MATEMÁTICAS VISUALES (dentro de Jugar)
   ------------------------------------------------------------
   Minijuego de suma/resta/multiplicación/división para niños que
   aún no saben leer. Adaptado del prototipo independiente
   matematicas-visuales.html al mismo patrón de módulo que usan
   QuizV2 (js/quiz.js) y AlfabetizacionV2: namespace propio,
   iniciar()/salir() como puntos de entrada llamados desde
   script.js, y enlazarEventos() que registra los listeners una
   sola vez aunque el usuario entre y salga del juego varias veces.
   ============================================================ */

const MatematicasV2 = (function () {
    "use strict";

    /* ============================================================
       ESTADO GLOBAL
       ============================================================ */
    var state = {
        operacion: null,
        dificultad: 1,
        puntaje: 0,
        aciertosSeguidos: 0,
        fallosSeguidos: 0
    };

    var movimientoReducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var elMenu = document.getElementById('matMenu');
    var elJuego = document.getElementById('matJuego');
    var elEscena = document.getElementById('matEscena');
    var elEstrellas = document.getElementById('matEstrellas');
    var elMascotaMini = document.getElementById('matMascotaMini');
    var elOverlayConfeti = document.getElementById('matOverlayConfeti');

    /* ============================================================
       UTILIDADES GENERALES
       ============================================================ */
    function randInt(min, max){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function barajar(arr){
        for (var i = arr.length - 1; i > 0; i--){
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
    }

    function centroDe(el){
        var r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    function puntoEnRect(x, y, rect){
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    function crearObjeto(emoji){
        var el = document.createElement('div');
        el.className = 'mat-objeto';
        el.textContent = emoji;
        return el;
    }

    /* ============================================================
       NÚMEROS VISIBLES — insignia con dígito sobre un contenedor,
       y encabezado grande con la "cuenta" de la operación.
       ============================================================ */
    function envolverConNumero(elemento, numeroInicial){
        var wrap = document.createElement('div');
        wrap.className = 'mat-contenedor-numerado';
        var badge = document.createElement('div');
        badge.className = 'mat-badge-numero';
        badge.textContent = numeroInicial;
        wrap.appendChild(badge);
        wrap.appendChild(elemento);
        return { wrap: wrap, badge: badge };
    }

    function actualizarBadge(badge, numero, completo){
        badge.textContent = numero;
        badge.classList.remove('mat-badge-cambio');
        void badge.offsetWidth;
        badge.classList.add('mat-badge-cambio');
        badge.classList.toggle('mat-badge-completo', !!completo);
    }

    function crearEncabezadoCuenta(partes){
        var enc = document.createElement('div');
        enc.className = 'mat-encabezado-cuenta';
        var cajaPregunta = null;
        partes.forEach(function(parte){
            if (parte === '?' || typeof parte === 'number'){
                var n = document.createElement('div');
                n.className = 'mat-encabezado-numero';
                n.textContent = parte;
                enc.appendChild(n);
                if (parte === '?') cajaPregunta = n;
            } else {
                var s = document.createElement('div');
                s.className = 'mat-encabezado-simbolo';
                s.textContent = parte;
                enc.appendChild(s);
            }
        });
        enc.cajaPregunta = cajaPregunta;
        return enc;
    }

    function reaccionarMascota(tipo){
        if (!elMascotaMini) return;
        elMascotaMini.textContent = tipo === 'bien' ? '🤩' : (tipo === 'mal' ? '😅' : '🙂');
        elMascotaMini.style.transform = 'scale(1.25)';
        setTimeout(function(){
            elMascotaMini.style.transform = 'scale(1)';
            if (tipo !== 'normal'){
                setTimeout(function(){ elMascotaMini.textContent = '🙂'; }, 900);
            }
        }, 260);
    }

    /* ============================================================
       ARRASTRAR Y SOLTAR (Pointer Events — funciona con mouse y táctil)
       ============================================================ */
    function activarArrastre(el, sceneEl, callbacks){
        el.style.touchAction = 'none';
        el.addEventListener('pointerdown', onDown);

        function onDown(e){
            if (el.dataset.bloqueado === '1') return;
            e.preventDefault();

            var rectEl = el.getBoundingClientRect();
            var rectScene = sceneEl.getBoundingClientRect();
            var startLeft = rectEl.left - rectScene.left;
            var startTop = rectEl.top - rectScene.top;
            var w = rectEl.width, h = rectEl.height;
            var origParent = el.parentElement;
            var origNext = el.nextSibling;

            sceneEl.appendChild(el);
            el.style.position = 'absolute';
            el.style.left = startLeft + 'px';
            el.style.top = startTop + 'px';
            el.style.width = w + 'px';
            el.style.height = h + 'px';
            el.style.margin = '0';
            el.classList.add('mat-arrastrando');

            try { el.setPointerCapture(e.pointerId); } catch(err){}

            var lastX = e.clientX, lastY = e.clientY;

            function onMove(ev){
                var dx = ev.clientX - lastX, dy = ev.clientY - lastY;
                lastX = ev.clientX; lastY = ev.clientY;
                el.style.left = (parseFloat(el.style.left) + dx) + 'px';
                el.style.top = (parseFloat(el.style.top) + dy) + 'px';
                if (callbacks.onMover) callbacks.onMover(ev, el);
            }

            function onUp(ev){
                try { el.releasePointerCapture(ev.pointerId); } catch(err){}
                el.removeEventListener('pointermove', onMove);
                el.removeEventListener('pointerup', onUp);
                el.removeEventListener('pointercancel', onUp);
                el.classList.remove('mat-arrastrando');

                var manejado = callbacks.onSoltar ? callbacks.onSoltar(ev, el) : false;

                if (!manejado){
                    el.style.transition = 'left .25s ease, top .25s ease';
                    el.style.left = startLeft + 'px';
                    el.style.top = startTop + 'px';
                    setTimeout(function(){
                        el.style.transition = '';
                        if (origParent){
                            if (origNext) origParent.insertBefore(el, origNext);
                            else origParent.appendChild(el);
                        }
                        el.style.position = '';
                        el.style.left = '';
                        el.style.top = '';
                        el.style.width = '';
                        el.style.height = '';
                        el.style.margin = '';
                    }, 260);
                }
                if (callbacks.limpiarHover) callbacks.limpiarHover();
            }

            el.addEventListener('pointermove', onMove);
            el.addEventListener('pointerup', onUp);
            el.addEventListener('pointercancel', onUp);
        }
    }

    function colocarEnDestino(el, destino){
        el.style.position = '';
        el.style.left = '';
        el.style.top = '';
        el.style.width = '';
        el.style.height = '';
        el.style.margin = '';
        destino.appendChild(el);
        el.classList.add('mat-objeto-colocado');
    }

    /* Resalta el/los contenedor(es) bajo el punto mientras se arrastra */
    function crearManejadorHover(contenedores){
        var actual = null;
        return {
            actualizar: function(x, y){
                var encontrado = null;
                for (var i = 0; i < contenedores.length; i++){
                    var c = contenedores[i];
                    if (puntoEnRect(x, y, c.getBoundingClientRect())){ encontrado = c; break; }
                }
                if (actual && actual !== encontrado) actual.classList.remove('mat-recipiente-hover');
                if (encontrado) encontrado.classList.add('mat-recipiente-hover');
                actual = encontrado;
            },
            limpiar: function(){
                if (actual) actual.classList.remove('mat-recipiente-hover');
                actual = null;
            }
        };
    }

    /* ============================================================
       PISTA VISUAL (manita animada + brillo, sin texto)
       ============================================================ */
    function activarPistaVisual(sceneEl, origenEl, destinoEl){
        var mano = document.createElement('div');
        mano.className = 'mat-pista-mano';
        mano.textContent = '👆';
        mano.setAttribute('aria-hidden', 'true');
        sceneEl.appendChild(mano);

        function posicionar(){
            var rectScene = sceneEl.getBoundingClientRect();
            var rectOrigen = origenEl.getBoundingClientRect();
            mano.style.left = (rectOrigen.left - rectScene.left + rectOrigen.width/2 - 16) + 'px';
            mano.style.top = (rectOrigen.top - rectScene.top - 30) + 'px';
        }
        posicionar();
        destinoEl.classList.add('mat-pista-brillo');

        var quitada = false;
        function quitar(){
            if (quitada) return;
            quitada = true;
            if (mano.parentNode) mano.parentNode.removeChild(mano);
            destinoEl.classList.remove('mat-pista-brillo');
            sceneEl.removeEventListener('pointerdown', quitar, true);
        }
        sceneEl.addEventListener('pointerdown', quitar, true);
        return quitar;
    }

    /* ============================================================
       CONFETI
       ============================================================ */
    function lanzarConfeti(x, y){
        var simbolos = ['🎉','⭐','✨','🎊','💫'];
        var cantidad = movimientoReducido ? 8 : 22;
        for (var i = 0; i < cantidad; i++){
            var p = document.createElement('span');
            p.className = 'mat-confeti-part';
            p.textContent = simbolos[Math.floor(Math.random() * simbolos.length)];
            var ang = Math.random() * Math.PI * 2;
            var dist = 60 + Math.random() * 140;
            var dx = Math.cos(ang) * dist;
            var dy = Math.sin(ang) * dist - 40;
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            p.style.setProperty('--dx', dx + 'px');
            p.style.setProperty('--dy', dy + 'px');
            p.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
            elOverlayConfeti.appendChild(p);
            (function(el){ setTimeout(function(){ el.remove(); }, 1600); })(p);
        }
    }

    /* ============================================================
       PUNTAJE / ESTRELLAS / DIFICULTAD
       ============================================================ */
    function inicializarEstrellas(){
        elEstrellas.innerHTML = '';
        for (var i = 0; i < 5; i++){
            var s = document.createElement('span');
            s.className = 'mat-estrella';
            s.textContent = '✩';
            elEstrellas.appendChild(s);
        }
    }

    function actualizarEstrellas(){
        var llenas = state.puntaje % 5;
        var nodos = elEstrellas.querySelectorAll('.mat-estrella');
        for (var i = 0; i < nodos.length; i++){
            var debeLlenar = i < llenas;
            var yaLlena = nodos[i].textContent === '⭐';
            nodos[i].textContent = debeLlenar ? '⭐' : '✩';
            if (debeLlenar && !yaLlena) {
                nodos[i].classList.remove('mat-estrella-nueva');
                void nodos[i].offsetWidth;
                nodos[i].classList.add('mat-estrella-nueva');
            }
        }
    }

    function registrarAcierto(){
        state.puntaje++;
        state.aciertosSeguidos++;
        state.fallosSeguidos = 0;
        if (state.aciertosSeguidos % 3 === 0 && state.dificultad < 3) state.dificultad++;
        actualizarEstrellas();
        reaccionarMascota('bien');
        if (state.puntaje % 5 === 0){
            var c = centroDe(elEscena);
            setTimeout(function(){ lanzarConfeti(c.x, c.y); }, 250);
        }
    }

    function registrarFallo(){
        state.aciertosSeguidos = 0;
        state.fallosSeguidos++;
        if (state.fallosSeguidos >= 3 && state.dificultad > 1){
            state.dificultad--;
            state.fallosSeguidos = 0;
        }
        reaccionarMascota('mal');
    }

    /* ============================================================
       GENERACIÓN DE PROBLEMAS
       ============================================================ */
    var RANGOS = {
        suma: [ {min:1,max:3}, {min:2,max:5}, {min:3,max:7} ],
        resta: [ {min:3,max:5,qmin:1,qmax:2}, {min:5,max:8,qmin:2,qmax:4}, {min:8,max:12,qmin:3,qmax:6} ],
        multiplicacion: [ {kmin:2,kmax:2,jmin:1,jmax:2}, {kmin:2,kmax:3,jmin:2,jmax:3}, {kmin:3,kmax:4,jmin:2,jmax:4} ],
        division: [ {dmin:2,dmax:2,cmin:1,cmax:2}, {dmin:2,dmax:3,cmin:2,cmax:3}, {dmin:3,dmax:4,cmin:2,cmax:4} ]
    };

    function generarProblema(tipo, dificultad){
        var r = RANGOS[tipo][dificultad - 1];
        if (tipo === 'suma'){
            var a = randInt(r.min, r.max), b = randInt(r.min, r.max);
            return { tipo: tipo, a: a, b: b, resultado: a + b, emoji: '🍎' };
        }
        if (tipo === 'resta'){
            var total = randInt(r.min, r.max);
            var q = randInt(r.qmin, Math.min(r.qmax, total - 1));
            return { tipo: tipo, total: total, q: q, resultado: total - q, emoji: '🍖' };
        }
        if (tipo === 'multiplicacion'){
            var k = randInt(r.kmin, r.kmax), j = randInt(r.jmin, r.jmax);
            return { tipo: tipo, k: k, j: j, resultado: k * j, emoji: '📦' };
        }
        if (tipo === 'division'){
            var d = randInt(r.dmin, r.dmax), c = randInt(r.cmin, r.cmax);
            return { tipo: tipo, d: d, c: c, total: d * c, resultado: c, emoji: '🐟' };
        }
    }

    function generarOpcionesRespuesta(correcto){
        var candidatos = {};
        candidatos[correcto] = true;
        var valores = [correcto];
        var intentos = 0;
        while (valores.length < 3 && intentos < 50){
            intentos++;
            var delta = (randInt(1,3)) * (Math.random() < 0.5 ? -1 : 1);
            var val = correcto + delta;
            if (val >= 1 && val <= 20 && !candidatos[val]){
                candidatos[val] = true;
                valores.push(val);
            }
        }
        return barajar(valores);
    }

    /* ============================================================
       FASE FINAL: comparar cantidades en los "estantes"
       ============================================================ */
    function iniciarFaseResultado(problema, elResultadoContenedor, elCajaPregunta){
        var cont = document.createElement('div');
        cont.className = 'mat-fase-resultado';
        var fila = document.createElement('div');
        fila.className = 'mat-estante-fila';

        var opciones = generarOpcionesRespuesta(problema.resultado);
        opciones.forEach(function(cant){
            var hueco = document.createElement('div');
            hueco.className = 'mat-estante-hueco';
            hueco.dataset.cantidad = cant;
            var preview = document.createElement('div');
            preview.className = 'mat-estante-preview';
            for (var i = 0; i < cant; i++){
                var d = document.createElement('span');
                d.className = 'mat-punto-preview';
                d.textContent = problema.emoji;
                preview.appendChild(d);
            }
            var numero = document.createElement('div');
            numero.className = 'mat-estante-numero';
            numero.textContent = cant;
            hueco.appendChild(preview);
            hueco.appendChild(numero);
            fila.appendChild(hueco);
        });

        cont.appendChild(fila);
        elEscena.appendChild(cont);

        var huecos = Array.prototype.slice.call(fila.querySelectorAll('.mat-estante-hueco'));
        var hoverMgr = crearManejadorHover(huecos);
        var resuelto = false;

        activarArrastre(elResultadoContenedor, elEscena, {
            onMover: function(ev){
                hoverMgr.actualizar(ev.clientX, ev.clientY);
            },
            limpiarHover: function(){ hoverMgr.limpiar(); },
            onSoltar: function(ev, el){
                if (resuelto) return true;
                var c = centroDe(el);
                for (var i = 0; i < huecos.length; i++){
                    var hueco = huecos[i];
                    if (puntoEnRect(c.x, c.y, hueco.getBoundingClientRect())){
                        hoverMgr.limpiar();
                        if (parseInt(hueco.dataset.cantidad, 10) === problema.resultado){
                            resuelto = true;
                            hueco.classList.add('mat-estante-acertado');
                            colocarEnDestino(el, hueco);
                            el.style.transform = 'scale(0.55)';
                            var centro = centroDe(hueco);
                            lanzarConfeti(centro.x, centro.y);
                            registrarAcierto();
                            if (elCajaPregunta){
                                elCajaPregunta.textContent = problema.resultado;
                                elCajaPregunta.classList.add('mat-encabezado-completo');
                            }
                            setTimeout(function(){ generarNuevoProblema(); }, 1300);
                            return true;
                        } else {
                            hueco.classList.remove('mat-estante-error');
                            void hueco.offsetWidth;
                            hueco.classList.add('mat-estante-error');
                            registrarFallo();
                            return false;
                        }
                    }
                }
                return false;
            }
        });
    }

    /* ============================================================
       ESCENA: SUMA — "La cesta mágica"
       ============================================================ */
    function armarEscenaSuma(problema){
        var encabezado = crearEncabezadoCuenta([problema.a, '+', problema.b, '=', '?']);
        elEscena.appendChild(encabezado);

        var zona = document.createElement('div');
        zona.className = 'mat-zona';

        var cestaA = document.createElement('div');
        cestaA.className = 'mat-recipiente mat-cesta';
        var cestaB = document.createElement('div');
        cestaB.className = 'mat-recipiente mat-cesta';
        var cestaCentral = document.createElement('div');
        cestaCentral.className = 'mat-recipiente mat-cesta-central';

        var numA = envolverConNumero(cestaA, problema.a);
        var numB = envolverConNumero(cestaB, problema.b);
        var numCentral = envolverConNumero(cestaCentral, 0);

        zona.appendChild(numA.wrap);
        zona.appendChild(numB.wrap);
        zona.appendChild(numCentral.wrap);
        elEscena.appendChild(zona);

        var objetos = [];
        for (var i = 0; i < problema.a; i++){ var o = crearObjeto(problema.emoji); cestaA.appendChild(o); objetos.push(o); }
        for (var j = 0; j < problema.b; j++){ var o2 = crearObjeto(problema.emoji); cestaB.appendChild(o2); objetos.push(o2); }

        var destinos = [cestaCentral];
        var hoverMgr = crearManejadorHover(destinos);
        var enCentral = 0;

        objetos.forEach(function(obj){
            activarArrastre(obj, elEscena, {
                onMover: function(ev){ hoverMgr.actualizar(ev.clientX, ev.clientY); },
                limpiarHover: function(){ hoverMgr.limpiar(); },
                onSoltar: function(ev, el){
                    var c = centroDe(el);
                    hoverMgr.limpiar();
                    if (puntoEnRect(c.x, c.y, cestaCentral.getBoundingClientRect())){
                        colocarEnDestino(el, cestaCentral);
                        el.dataset.bloqueado = '1';
                        enCentral++;
                        actualizarBadge(numCentral.badge, enCentral, enCentral === problema.resultado);
                        if (cestaA.children.length === 0 && cestaB.children.length === 0){
                            quitarPista && quitarPista();
                            setTimeout(function(){ iniciarFaseResultado(problema, cestaCentral, encabezado.cajaPregunta); }, 250);
                        }
                        return true;
                    }
                    return false;
                }
            });
        });

        var quitarPista = activarPistaVisual(elEscena, objetos[0], cestaCentral);
    }

    /* ============================================================
       ESCENA: RESTA — "El monstruito goloso"
       ============================================================ */
    function armarEscenaResta(problema){
        var encabezado = crearEncabezadoCuenta([problema.total, '-', problema.q, '=', '?']);
        elEscena.appendChild(encabezado);

        var zona = document.createElement('div');
        zona.className = 'mat-zona';

        var bandeja = document.createElement('div');
        bandeja.className = 'mat-recipiente mat-bandeja';
        var leon = document.createElement('div');
        leon.className = 'mat-recipiente mat-leon';
        leon.textContent = '🦁';

        var numBandeja = envolverConNumero(bandeja, problema.total);
        var numLeon = envolverConNumero(leon, 0);

        zona.appendChild(numBandeja.wrap);
        zona.appendChild(numLeon.wrap);
        elEscena.appendChild(zona);

        var objetos = [];
        for (var i = 0; i < problema.total; i++){ var o = crearObjeto(problema.emoji); bandeja.appendChild(o); objetos.push(o); }

        var comidos = 0;
        var enBandeja = problema.total;
        var hoverMgr = crearManejadorHover([leon]);

        objetos.forEach(function(obj){
            activarArrastre(obj, elEscena, {
                onMover: function(ev){ hoverMgr.actualizar(ev.clientX, ev.clientY); },
                limpiarHover: function(){ hoverMgr.limpiar(); },
                onSoltar: function(ev, el){
                    var c = centroDe(el);
                    hoverMgr.limpiar();
                    if (comidos >= problema.q) return false;
                    if (puntoEnRect(c.x, c.y, leon.getBoundingClientRect())){
                        comidos++;
                        enBandeja--;
                        leon.classList.remove('mat-leon-masticando');
                        void leon.offsetWidth;
                        leon.classList.add('mat-leon-masticando');
                        actualizarBadge(numLeon.badge, comidos, comidos === problema.q);
                        actualizarBadge(numBandeja.badge, enBandeja, false);
                        el.classList.add('mat-objeto-colocado');
                        el.style.transition = 'transform .2s ease, opacity .2s ease';
                        el.style.transform = 'scale(0)';
                        el.style.opacity = '0';
                        setTimeout(function(){ el.remove(); }, 200);
                        if (comidos === problema.q){
                            leon.classList.add('mat-leon-lleno');
                            var restantes = bandeja.querySelectorAll('.mat-objeto');
                            restantes.forEach(function(r){ r.dataset.bloqueado = '1'; });
                            quitarPista && quitarPista();
                            setTimeout(function(){ iniciarFaseResultado(problema, bandeja, encabezado.cajaPregunta); }, 300);
                        }
                        return true;
                    }
                    return false;
                }
            });
        });

        var quitarPista = activarPistaVisual(elEscena, objetos[0], leon);
    }

    /* ============================================================
       ESCENA: MULTIPLICACIÓN — "Trenes con cajas"
       ============================================================ */
    function armarEscenaMultiplicacion(problema){
        var encabezado = crearEncabezadoCuenta([problema.k, '×', problema.j, '=', '?']);
        elEscena.appendChild(encabezado);

        var zona = document.createElement('div');
        zona.className = 'mat-zona';
        zona.style.flexDirection = 'column';
        zona.style.gap = '22px';

        var pila = document.createElement('div');
        pila.className = 'mat-recipiente mat-pila';
        var numPila = envolverConNumero(pila, problema.k * problema.j);

        var motor = document.createElement('div');
        motor.className = 'mat-tren-motor';
        motor.textContent = '🚂';
        var numMotor = envolverConNumero(motor, problema.k);

        var vagones = [];
        var filaVagonesConNumero = document.createElement('div');
        filaVagonesConNumero.className = 'mat-tren-fila';
        filaVagonesConNumero.appendChild(numMotor.wrap);
        for (var v = 0; v < problema.k; v++){
            var vagon = document.createElement('div');
            vagon.className = 'mat-recipiente mat-vagon';
            var slots = document.createElement('div');
            slots.className = 'mat-vagon-slots';
            for (var s = 0; s < problema.j; s++){
                var ghost = document.createElement('div');
                ghost.className = 'mat-vagon-slot-vacio';
                slots.appendChild(ghost);
            }
            vagon.appendChild(slots);
            var numVagon = envolverConNumero(vagon, 0);
            filaVagonesConNumero.appendChild(numVagon.wrap);
            vagones.push({ el: vagon, slots: slots, tiene: 0, badge: numVagon.badge });
        }

        zona.appendChild(numPila.wrap);
        zona.appendChild(filaVagonesConNumero);
        elEscena.appendChild(zona);

        var objetos = [];
        var totalNecesario = problema.k * problema.j;
        for (var i = 0; i < totalNecesario; i++){ var o = crearObjeto(problema.emoji); pila.appendChild(o); objetos.push(o); }

        var colocados = 0;
        var contenedoresHover = vagones.map(function(vg){ return vg.el; });
        var hoverMgr = crearManejadorHover(contenedoresHover);

        objetos.forEach(function(obj){
            activarArrastre(obj, elEscena, {
                onMover: function(ev){ hoverMgr.actualizar(ev.clientX, ev.clientY); },
                limpiarHover: function(){ hoverMgr.limpiar(); },
                onSoltar: function(ev, el){
                    var c = centroDe(el);
                    hoverMgr.limpiar();
                    for (var i = 0; i < vagones.length; i++){
                        var vg = vagones[i];
                        if (puntoEnRect(c.x, c.y, vg.el.getBoundingClientRect())){
                            if (vg.tiene >= problema.j) return false;
                            var ghost = vg.slots.querySelector('.mat-vagon-slot-vacio');
                            if (ghost) ghost.remove();
                            colocarEnDestino(el, vg.slots);
                            el.dataset.bloqueado = '1';
                            vg.tiene++;
                            colocados++;
                            actualizarBadge(vg.badge, vg.tiene, vg.tiene >= problema.j);
                            actualizarBadge(numPila.badge, totalNecesario - colocados, false);
                            if (vg.tiene >= problema.j) vg.el.classList.add('mat-vagon-lleno');
                            if (colocados === totalNecesario){
                                quitarPista && quitarPista();
                                setTimeout(function(){ iniciarFaseResultado(problema, filaVagonesConNumero, encabezado.cajaPregunta); }, 300);
                            }
                            return true;
                        }
                    }
                    return false;
                }
            });
        });

        var quitarPista = activarPistaVisual(elEscena, objetos[0], vagones[0].el);
    }

    /* ============================================================
       ESCENA: DIVISIÓN — "Reparto justo entre pingüinos"
       ============================================================ */
    function armarEscenaDivision(problema){
        var encabezado = crearEncabezadoCuenta([problema.total, '÷', problema.d, '=', '?']);
        elEscena.appendChild(encabezado);

        var zona = document.createElement('div');
        zona.className = 'mat-zona';
        zona.style.flexDirection = 'column';
        zona.style.gap = '22px';

        var pila = document.createElement('div');
        pila.className = 'mat-recipiente mat-pila';
        var numPila = envolverConNumero(pila, problema.total);

        var filaPinguinos = document.createElement('div');
        filaPinguinos.className = 'mat-pinguinos-fila';

        var pinguinos = [];
        for (var p = 0; p < problema.d; p++){
            var unidad = document.createElement('div');
            unidad.className = 'mat-pinguino-unidad';
            var cara = document.createElement('div');
            cara.className = 'mat-pinguino-cara';
            cara.textContent = '🐧';
            var plato = document.createElement('div');
            plato.className = 'mat-recipiente mat-pinguino-plato';
            var numPlato = envolverConNumero(plato, 0);
            unidad.appendChild(cara);
            unidad.appendChild(numPlato.wrap);
            filaPinguinos.appendChild(unidad);
            pinguinos.push({ unidad: unidad, plato: plato, tiene: 0, badge: numPlato.badge });
        }

        zona.appendChild(numPila.wrap);
        zona.appendChild(filaPinguinos);
        elEscena.appendChild(zona);

        var objetos = [];
        for (var i = 0; i < problema.total; i++){ var o = crearObjeto(problema.emoji); pila.appendChild(o); objetos.push(o); }

        var colocados = 0;
        var contenedoresHover = pinguinos.map(function(pg){ return pg.plato; });
        var hoverMgr = crearManejadorHover(contenedoresHover);

        function marcarNudge(){
            var minTiene = Math.min.apply(null, pinguinos.map(function(pg){ return pg.tiene; }));
            pinguinos.forEach(function(pg){
                pg.unidad.classList.toggle('mat-pinguino-nudge', pg.tiene === minTiene && pg.tiene < problema.c);
            });
        }
        marcarNudge();

        objetos.forEach(function(obj){
            activarArrastre(obj, elEscena, {
                onMover: function(ev){ hoverMgr.actualizar(ev.clientX, ev.clientY); },
                limpiarHover: function(){ hoverMgr.limpiar(); },
                onSoltar: function(ev, el){
                    var c = centroDe(el);
                    hoverMgr.limpiar();
                    var minTiene = Math.min.apply(null, pinguinos.map(function(pg){ return pg.tiene; }));
                    for (var i = 0; i < pinguinos.length; i++){
                        var pg = pinguinos[i];
                        if (puntoEnRect(c.x, c.y, pg.plato.getBoundingClientRect())){
                            if (pg.tiene >= problema.c) return false;
                            if (pg.tiene > minTiene) return false;
                            colocarEnDestino(el, pg.plato);
                            el.dataset.bloqueado = '1';
                            pg.tiene++;
                            colocados++;
                            actualizarBadge(pg.badge, pg.tiene, pg.tiene >= problema.c);
                            actualizarBadge(numPila.badge, problema.total - colocados, false);
                            if (pg.tiene >= problema.c) pg.unidad.classList.add('mat-pinguino-lleno');
                            marcarNudge();
                            if (colocados === problema.total){
                                pinguinos.forEach(function(pg2){ pg2.unidad.classList.remove('mat-pinguino-nudge'); });
                                pinguinos[0].unidad.classList.add('mat-pinguino-elegido');
                                quitarPista && quitarPista();
                                setTimeout(function(){ iniciarFaseResultado(problema, pinguinos[0].plato, encabezado.cajaPregunta); }, 300);
                            }
                            return true;
                        }
                    }
                    return false;
                }
            });
        });

        var quitarPista = activarPistaVisual(elEscena, objetos[0], pinguinos[0].plato);
    }

    /* ============================================================
       CONTROL DE FLUJO DEL JUEGO
       ============================================================ */
    function construirEscena(tipo, problema){
        if (tipo === 'suma') armarEscenaSuma(problema);
        else if (tipo === 'resta') armarEscenaResta(problema);
        else if (tipo === 'multiplicacion') armarEscenaMultiplicacion(problema);
        else if (tipo === 'division') armarEscenaDivision(problema);
    }

    function generarNuevoProblema(){
        elEscena.innerHTML = '';
        var problema = generarProblema(state.operacion, state.dificultad);
        construirEscena(state.operacion, problema);
    }

    function iniciarJuego(operacion){
        state.operacion = operacion;
        state.dificultad = 1;
        state.puntaje = 0;
        state.aciertosSeguidos = 0;
        state.fallosSeguidos = 0;
        inicializarEstrellas();
        reaccionarMascota('normal');
        elMenu.classList.remove('mat-pantalla-activa');
        elJuego.classList.add('mat-pantalla-activa');
        generarNuevoProblema();
    }

    function volverAlMenu(){
        elEscena.innerHTML = '';
        elJuego.classList.remove('mat-pantalla-activa');
        elMenu.classList.add('mat-pantalla-activa');
    }


    // ---------------------------------------------------------
    // EVENTOS (registrados una sola vez, ver enlazarEventos)
    // ---------------------------------------------------------
    var _listenersListos = false;

    function enlazarEventos() {
        if (_listenersListos) return;
        var botonesOp = document.querySelectorAll('#matApp .mat-tarjeta-op');
        botonesOp.forEach(function (btn) {
            btn.addEventListener('click', function () {
                iniciarJuego(btn.dataset.op);
            });
        });
        var btnVolver = document.getElementById('matBtnVolver');
        if (btnVolver) btnVolver.addEventListener('click', volverAlMenu);
        _listenersListos = true;
    }

    // ---------------------------------------------------------
    // PUNTO DE ENTRADA PÚBLICO
    // Se llama desde script.js cada vez que el usuario abre el
    // juego "Matemáticas" dentro de la sección Jugar.
    // ---------------------------------------------------------
    function iniciar() {
        enlazarEventos();
        volverAlMenu();
    }

    // Se llama al salir del juego (volver al menú de Jugar o salir
    // de la sección por completo), para dejar la pantalla del menú
    // de operaciones lista para la próxima vez.
    function salir() {
        elEscena.innerHTML = '';
        volverAlMenu();
    }

    return { iniciar: iniciar, salir: salir };
})();

// Se expone explícitamente en window (igual que QuizV2): una
// declaración "const" de nivel superior no se agrega sola a window.
window.MatematicasV2 = MatematicasV2;
