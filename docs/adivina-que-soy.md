# Adivina qué soy

Juego independiente en `juegos/adivina-que-soy.html`, enlazado desde el menú Juegos.

- Fuente principal: `data/vocabulario.json`, leída al abrir. Solo palabra con imagen local válida. Filtro de categoría y deduplicación por palabra.
- Mazo adicional: `data/adivina-extras.json`. Tiene 77 tarjetas visuales locales: 25 Animales, 4 Profesiones, 7 Personajes, 9 Transportes, 13 Comidas y 19 Objetos. Reutiliza ilustraciones locales de LSPedia cuando ya existen y conserva las ilustraciones SVG originales del juego. No modifica los datos del Diccionario, Vocabulario, Quiz ni Señas IA.
- Hasta 30 tarjetas aleatorias por turno, sin repetir dentro del turno. Se cargan seis imágenes simultáneamente; las que fallan se excluyen. Si no hay imágenes disponibles, se ofrece reintento sin empezar el reloj.
- Turnos de 60, 90, 120 segundos o sin reloj. El turno termina al agotarse el mazo; siguiente jugador vuelve a barajar.
- El menú permite elegir explícitamente modo Vertical u Horizontal y recuerda la preferencia. En móviles, al comenzar intenta usar pantalla completa y bloquear la orientación elegida cuando el navegador lo permite; si no lo permite, el layout se adapta al giro manual.
- Movimiento opcional, por permiso iniciado al tocar Activar. `cos(beta) * cos(gamma)` indica la normal de la pantalla respecto a la gravedad, tanto en vertical como en horizontal. Pantalla hacia abajo: acierto; hacia arriba: pasar. Exige 90 ms de posición inicial y 90 ms de inclinación sostenida. Cada acción reinicia el detector, pero el regreso al centro durante el aviso visual rearma la siguiente tarjeta. El umbral de acción es aproximadamente 27°; no hace falta inclinar hasta casi acostar la pantalla.
- Botones y flechas de teclado siempre disponibles. Escape/espacio pausa. Al ocultar la pestaña, pausa automática. La cuenta atrás se cancela al ocultarse; se debe tocar Estoy listo de nuevo.
- Sonido sintetizado, vibración cuando está disponible, símbolos y colores para cada respuesta, y bloqueo de suspensión de pantalla cuando el navegador lo permite. Ningún resultado depende de oír sonido.
- No usa cámara, micrófono, reconocimiento de señas, videos externos ni servicios de imágenes. Las pistas las da otra persona.

## Verificación

`npm test` comprueba las reglas del buscador y del juego.
`npm run test:adivina-browser` comprueba imágenes reales, Vocabulario/Colores, móvil vertical/horizontal, aciertos/pases, pausa, fin por tiempo/mazo, sensores simulados, ausencia de sensores y recuperación de fallos de red.
`npm run test:browser` comprueba navegación y buscador existentes.

Prueba física pendiente: comprobar en Android e iOS el bloqueo Vertical/Horizontal, los permisos, la inclinación hacia ambos lados al sostenerlo horizontalmente, la vibración y la comodidad al sujetarlo en la frente. Las pruebas automatizadas simulan orientación; no sustituyen los sensores reales.

El historial reserva una entrada por turno: Atrás regresa al menú y cancela temporizadores, diálogos y cargas pendientes. Las tarjetas alternan siete fondos pastel con texto oscuro; las palabras usan tipografía ampliada y se ajustan solo cuando no caben.
