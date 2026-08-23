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
        // Nivel elegido a mano por el usuario en el menú (1=Básico,
        // 2=Medio, 3=Difícil). Reemplaza al ajuste automático por
        // rachas de aciertos/fallos: ahora el nivel lo controla el
        // jugador y se mantiene fijo durante la partida.
        nivelElegido: 1,
        puntaje: 0
    };

    var NIVEL_NOMBRE = { 1: 'Básico', 2: 'Medio', 3: 'Difícil' };
    var NIVEL_EMOJI = { 1: '🌱', 2: '🌿', 3: '🌳' };
    var LS_KEY_NIVEL = 'lspedia_mat_nivel';

    function obtenerNivelGuardado(){
        try {
            var v = parseInt(localStorage.getItem(LS_KEY_NIVEL), 10);
            if (v >= 1 && v <= 3) return v;
        } catch (e) { /* localStorage no disponible: usar valor por defecto */ }
        return 1;
    }

    function guardarNivel(n){
        try { localStorage.setItem(LS_KEY_NIVEL, n); } catch (e) { /* ignorar */ }
    }

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
       PIEZAS CON VALOR (1, 10 o 100) — para representar números de
       2-3 cifras en suma/resta sin tener que arrastrar cientos de
       objetos sueltos uno por uno. Cada pieza "vale" lo que indica
       su etiqueta y se arrastra como una sola unidad (igual que un
       objeto normal), pero se cuenta por su valor, no por 1.
       ============================================================ */
    function crearObjetoValor(valor, emoji){
        var el = document.createElement('div');
        el.className = 'mat-objeto';
        el.dataset.valor = valor;
        if (valor === 1){
            el.textContent = emoji;
        } else {
            el.classList.add('mat-objeto-bloque');
            el.classList.add(valor === 100 ? 'mat-objeto-bloque-100' : 'mat-objeto-bloque-10');
            // Un bloque de 10/100 se dibuja como una caja de madera con
            // la fruta/comida asomando arriba (representa un cajón
            // cerrado con esa cantidad adentro), en vez de repetir el
            // ícono suelto con una etiqueta de número encima.
            var caja = document.createElement('div');
            caja.className = 'mat-caja';
            caja.innerHTML =
                '<span class="mat-caja-frutas">' + emoji + emoji + '</span>' +
                '<svg class="mat-caja-svg" viewBox="0 0 64 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
                    '<rect x="2" y="2" width="60" height="13" rx="3"></rect>' +
                    '<rect x="2" y="16.5" width="60" height="13" rx="3"></rect>' +
                    '<rect x="2" y="31" width="60" height="13" rx="3"></rect>' +
                    '<circle class="mat-caja-remache" cx="11" cy="8.5" r="2.1"></circle>' +
                    '<circle class="mat-caja-remache" cx="53" cy="8.5" r="2.1"></circle>' +
                    '<circle class="mat-caja-remache" cx="11" cy="23" r="2.1"></circle>' +
                    '<circle class="mat-caja-remache" cx="53" cy="23" r="2.1"></circle>' +
                    '<circle class="mat-caja-remache" cx="11" cy="37.5" r="2.1"></circle>' +
                    '<circle class="mat-caja-remache" cx="53" cy="37.5" r="2.1"></circle>' +
                '</svg>';
            var lbl = document.createElement('span');
            lbl.className = 'mat-objeto-bloque-numero';
            lbl.textContent = valor;
            el.appendChild(caja);
            el.appendChild(lbl);
        }
        return el;
    }

    /* Descompone un número en piezas de 100/10/1 según sus cifras.
       Ej. 234 -> [100,100,10,10,10,1,1,1,1] */
    function desglosarValor(n){
        var piezas = [];
        var c = Math.floor(n / 100); n -= c * 100;
        var d = Math.floor(n / 10); n -= d * 10;
        var u = n;
        for (var i = 0; i < c; i++) piezas.push(100);
        for (var i = 0; i < d; i++) piezas.push(10);
        for (var i = 0; i < u; i++) piezas.push(1);
        return piezas;
    }

    /* ¿Se puede formar exactamente "objetivo" combinando piezas
       disponibles de valor 100/10/1 (respetando cuántas hay de cada
       una)? Se usa para evitar que, en la resta, el jugador deje al
       "monstruito" sin forma de completar exactamente la cuenta
       (p.ej. si ya comió todas las piezas sueltas de 1 y solo le
       quedan piezas de 10 pero necesita comer menos de 10 más). */
    function factible(conteo, objetivo){
        if (objetivo < 0) return false;
        var maxH = Math.min(conteo[100], Math.floor(objetivo / 100));
        for (var h = 0; h <= maxH; h++){
            var restoH = objetivo - h * 100;
            var maxT = Math.min(conteo[10], Math.floor(restoH / 10));
            for (var t = 0; t <= maxT; t++){
                var restoT = restoH - t * 10;
                if (restoT <= conteo[1]) return true;
            }
        }
        return false;
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

    /* ============================================================
       SONIDOS (sintetizados con Web Audio API, sin archivos externos)
       Y VIBRACIÓN — mismo patrón que QuizV2 (js/quiz.js), para que
       Matemáticas suene y vibre igual que los demás juegos.
       ============================================================ */
    var audioCtx = null;

    function obtenerAudioCtx(){
        if (!audioCtx){
            var AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
        }
        return audioCtx;
    }

    function tono(frecuencia, duracionMs, retrasoMs, tipo){
        var ctx = obtenerAudioCtx();
        if (!ctx) return;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = tipo || 'sine';
        osc.frequency.value = frecuencia;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + (retrasoMs / 1000));
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (retrasoMs / 1000) + (duracionMs / 1000));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + (retrasoMs / 1000));
        osc.stop(ctx.currentTime + (retrasoMs / 1000) + (duracionMs / 1000) + 0.05);
    }

    function reproducirSonidoCorrecto(){
        tono(587, 120, 0, 'triangle');
        tono(880, 160, 110, 'triangle');
    }

    function reproducirSonidoIncorrecto(){
        tono(220, 220, 0, 'sawtooth');
        vibrarError();
    }

    // Vibración corta al equivocarse (si el dispositivo/navegador lo
    // permite). Safari/iOS no soporta navigator.vibrate: falla en silencio.
    function vibrarError(){
        if (navigator.vibrate){
            try { navigator.vibrate(200); } catch (e) { /* no soportado o bloqueado */ }
        }
    }

    function registrarAcierto(){
        state.puntaje++;
        actualizarEstrellas();
        reaccionarMascota('bien');
        reproducirSonidoCorrecto();
        if (state.puntaje % 5 === 0){
            var c = centroDe(elEscena);
            setTimeout(function(){ lanzarConfeti(c.x, c.y); }, 250);
        }
    }

    function registrarFallo(){
        reaccionarMascota('mal');
        reproducirSonidoIncorrecto();
    }

    /* ============================================================
       GENERACIÓN DE PROBLEMAS
       ============================================================ */
    // Nivel 1 = Básico (1 cifra), Nivel 2 = Medio (2 cifras),
    // Nivel 3 = Difícil (3 cifras). En suma y resta los números en
    // sí crecen a 2-3 cifras (se representan con piezas de
    // valor 1/10/100, ver desglosarValor). En multiplicación y
    // división los factores se mantienen chicos a propósito —
    // el juego dibuja un objeto arrastrable por cada unidad del
    // resultado, así que números de 2-3 cifras completos ahí
    // significarían arrastrar cientos de piezas sueltas, poco
    // práctico para un niño — pero el resultado sí crece de forma
    // notoria entre niveles.
    var RANGOS = {
        suma: [ {min:1,max:9}, {min:10,max:40}, {min:100,max:250} ],
        resta: [ {min:4,max:9,qmin:1,qmax:4}, {min:20,max:60}, {min:100,max:300} ],
        multiplicacion: [ {kmin:2,kmax:3,jmin:1,jmax:3}, {kmin:2,kmax:4,jmin:3,jmax:6}, {kmin:3,kmax:5,jmin:5,jmax:8} ],
        division: [ {dmin:2,dmax:2,cmin:1,cmax:3}, {dmin:2,dmax:4,cmin:3,cmax:6}, {dmin:3,dmax:5,cmin:5,cmax:8} ]
    };

    /* Genera una resta de 2-3 cifras "sin préstamo": cada cifra de q
       es como máximo igual a la cifra correspondiente de total. Así,
       al desglosar total en piezas de 100/10/1, siempre existe una
       combinación exacta de esas piezas que suma q (ver factible()). */
    function generarQSinPrestamo(total){
        var c = Math.floor(total / 100) % 10, d = Math.floor(total / 10) % 10, u = total % 10;
        for (var intento = 0; intento < 20; intento++){
            var qc = randInt(0, c), qd = randInt(0, d), qu = randInt(0, u);
            var q = qc * 100 + qd * 10 + qu;
            if (q >= 1 && q < total) return q;
        }
        // Salvaguarda determinista (muy raro llegar aquí): bajar en 1
        // la cifra de menor orden disponible sigue siendo digit-wise
        // válido, porque las demás cifras quedan iguales a las de total.
        if (u > 0) return total - 1;
        if (d > 0) return total - 10;
        if (c > 0) return total - 100;
        return Math.max(1, total - 1);
    }

    function generarProblema(tipo, dificultad){
        var r = RANGOS[tipo][dificultad - 1];
        if (tipo === 'suma'){
            var a = randInt(r.min, r.max), b = randInt(r.min, r.max);
            return { tipo: tipo, a: a, b: b, resultado: a + b, emoji: '🍎' };
        }
        if (tipo === 'resta'){
            var total = randInt(r.min, r.max);
            // Un total "redondo" (decenas y unidades en 0, p.ej. 100,
            // 200) no admite ninguna resta sin préstamo real (solo 0 o
            // el total completo). Se ajustan sus cifras bajas para
            // que siempre haya una resta válida que representar.
            if (total > 9 && Math.floor(total / 10) % 10 === 0 && total % 10 === 0){
                total += randInt(1, 9);
            }
            var q = total <= 9 ? randInt(r.qmin, Math.min(r.qmax, total - 1)) : generarQSinPrestamo(total);
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
        // El tamaño de los señuelos escala según la cantidad de
        // cifras del resultado correcto (no tendría sentido ofrecer
        // "1004" como distractor de "12").
        var escala = correcto < 10 ? 3 : (correcto < 100 ? 8 : 25);
        while (valores.length < 3 && intentos < 60){
            intentos++;
            var delta = (randInt(1, escala)) * (Math.random() < 0.5 ? -1 : 1);
            var val = correcto + delta;
            if (val >= 1 && !candidatos[val]){
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
            // Accesible y "tocable": además de recibir la pieza
            // arrastrada, el propio hueco responde a un toque/clic
            // directo (modo toque) o a Enter/Espacio con teclado.
            hueco.setAttribute('role', 'button');
            hueco.setAttribute('tabindex', '0');
            hueco.setAttribute('aria-label', 'Responder ' + cant);
            var preview = document.createElement('div');
            preview.className = 'mat-estante-preview';
            // Con resultados de 2-3 cifras no tiene sentido dibujar un
            // emoji por unidad: se limita la vista previa y se apoya
            // en el número grande de abajo, que es exacto.
            var iconos = Math.min(cant, 6);
            for (var i = 0; i < iconos; i++){
                var d = document.createElement('span');
                d.className = 'mat-punto-preview';
                d.textContent = problema.emoji;
                preview.appendChild(d);
            }
            if (cant > iconos){
                var mas = document.createElement('span');
                mas.className = 'mat-punto-preview mat-punto-preview-mas';
                mas.textContent = '+';
                preview.appendChild(mas);
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

        // Lógica compartida por ambos modos de responder: soltar la
        // pieza arrastrada sobre un hueco, o tocar/clicar el hueco
        // directamente sin arrastrar nada.
        function resolverConHueco(hueco){
            if (resuelto) return true;
            if (parseInt(hueco.dataset.cantidad, 10) === problema.resultado){
                resuelto = true;
                hueco.classList.add('mat-estante-acertado');
                colocarEnDestino(elResultadoContenedor, hueco);
                elResultadoContenedor.style.transform = 'scale(0.55)';
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
                        return resolverConHueco(hueco);
                    }
                }
                return false;
            }
        });

        // MODO TOQUE: tocar/clicar un hueco directamente también
        // responde, sin necesidad de arrastrar la pieza hasta él.
        huecos.forEach(function(hueco){
            hueco.addEventListener('click', function(){ resolverConHueco(hueco); });
            hueco.addEventListener('keydown', function(ev){
                if (ev.key === 'Enter' || ev.key === ' '){
                    ev.preventDefault();
                    resolverConHueco(hueco);
                }
            });
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
        desglosarValor(problema.a).forEach(function(v){ var o = crearObjetoValor(v, problema.emoji); cestaA.appendChild(o); objetos.push(o); });
        desglosarValor(problema.b).forEach(function(v){ var o2 = crearObjetoValor(v, problema.emoji); cestaB.appendChild(o2); objetos.push(o2); });

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
                        enCentral += parseInt(el.dataset.valor, 10);
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
        var leonCara = document.createElement('span');
        leonCara.className = 'mat-leon-cara';
        leonCara.textContent = '🦁';
        var leonBoca = document.createElement('span');
        leonBoca.className = 'mat-leon-boca';
        leon.appendChild(leonCara);
        leon.appendChild(leonBoca);

        var numBandeja = envolverConNumero(bandeja, problema.total);
        var numLeon = envolverConNumero(leon, 0);

        zona.appendChild(numBandeja.wrap);
        zona.appendChild(numLeon.wrap);
        elEscena.appendChild(zona);

        var objetos = [];
        var conteo = { 100: 0, 10: 0, 1: 0 };
        desglosarValor(problema.total).forEach(function(v){
            var o = crearObjetoValor(v, problema.emoji);
            bandeja.appendChild(o);
            objetos.push(o);
            conteo[v]++;
        });

        var comidosValor = 0;
        var hoverMgr = crearManejadorHover([leon]);

        objetos.forEach(function(obj){
            activarArrastre(obj, elEscena, {
                onMover: function(ev){ hoverMgr.actualizar(ev.clientX, ev.clientY); },
                limpiarHover: function(){ hoverMgr.limpiar(); },
                onSoltar: function(ev, el){
                    var c = centroDe(el);
                    hoverMgr.limpiar();
                    if (!puntoEnRect(c.x, c.y, leon.getBoundingClientRect())) return false;
                    if (comidosValor >= problema.q) return false;
                    var v = parseInt(el.dataset.valor, 10);
                    var nuevoComido = comidosValor + v;
                    if (nuevoComido > problema.q) return false;
                    // Antes de aceptar, comprobamos que con las piezas
                    // que quedarían (sin esta) todavía se pueda llegar
                    // exacto a la cuenta pedida, para que el monstruito
                    // nunca se quede sin forma de terminar la resta.
                    var restante = { 100: conteo[100], 10: conteo[10], 1: conteo[1] };
                    restante[v] = restante[v] - 1;
                    if (!factible(restante, problema.q - nuevoComido)) return false;

                    conteo[v]--;
                    comidosValor = nuevoComido;
                    leon.classList.remove('mat-leon-masticando');
                    void leon.offsetWidth;
                    leon.classList.add('mat-leon-masticando');
                    actualizarBadge(numLeon.badge, comidosValor, comidosValor === problema.q);
                    actualizarBadge(numBandeja.badge, problema.total - comidosValor, false);
                    el.classList.add('mat-objeto-colocado');
                    el.style.transition = 'transform .2s ease, opacity .2s ease';
                    el.style.transform = 'scale(0)';
                    el.style.opacity = '0';
                    setTimeout(function(){ el.remove(); }, 200);
                    if (comidosValor === problema.q){
                        leon.classList.add('mat-leon-lleno');
                        var restantes = bandeja.querySelectorAll('.mat-objeto');
                        restantes.forEach(function(r){ r.dataset.bloqueado = '1'; });
                        quitarPista && quitarPista();
                        setTimeout(function(){ iniciarFaseResultado(problema, bandeja, encabezado.cajaPregunta); }, 300);
                    }
                    return true;
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
    function actualizarChipNivel(){
        var chip = document.getElementById('matNivelBarra');
        if (chip) chip.textContent = NIVEL_EMOJI[state.nivelElegido] + ' Nivel: ' + NIVEL_NOMBRE[state.nivelElegido];
    }

    function seleccionarNivel(n){
        state.nivelElegido = n;
        guardarNivel(n);
        var botones = document.querySelectorAll('#matApp .mat-nivel-btn');
        botones.forEach(function(b){
            b.classList.toggle('mat-nivel-btn-activo', parseInt(b.dataset.nivel, 10) === n);
        });
        actualizarChipNivel();
    }

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
        state.dificultad = state.nivelElegido;
        state.puntaje = 0;
        inicializarEstrellas();
        reaccionarMascota('normal');
        elMenu.classList.remove('mat-pantalla-activa');
        elJuego.classList.add('mat-pantalla-activa');
        actualizarChipNivel();
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
        var botonesNivel = document.querySelectorAll('#matApp .mat-nivel-btn');
        botonesNivel.forEach(function (btn) {
            btn.addEventListener('click', function () {
                seleccionarNivel(parseInt(btn.dataset.nivel, 10));
            });
        });
        var btnVolver = document.getElementById('matBtnVolver');
        if (btnVolver) btnVolver.addEventListener('click', volverAlMenu);
        seleccionarNivel(obtenerNivelGuardado());
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