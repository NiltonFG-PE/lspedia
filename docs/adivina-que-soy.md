# Adivina qué soy

Juego independiente en `juegos/adivina-que-soy.html`, enlazado desde el menú Juegos.

- Fuente principal: `data/vocabulario.json`, leída al abrir. Solo palabra con imagen local válida. Filtro de categoría y deduplicación por palabra.
- Mazo adicional solicitado: `data/adivina-extras.json`. 14 ilustraciones SVG originales de animales, profesiones y personajes. No modifica los datos del Diccionario, Vocabulario, Quiz ni Señas IA.
- Hasta 30 tarjetas aleatorias por turno, sin repetir dentro del turno. Se cargan seis imágenes simultáneamente; las que fallan se excluyen. Si no hay imágenes disponibles, se ofrece reintento sin empezar el reloj.
- Turnos de 60, 90, 120 segundos o sin reloj. El turno termina al agotarse el mazo; siguiente jugador vuelve a barajar.
- Movimiento opcional, por permiso iniciado al tocar Activar. `cos(beta) * cos(gamma)` indica la normal de la pantalla respecto a la gravedad, tanto en vertical como en horizontal. Pantalla hacia abajo: acierto; hacia arriba: pasar. Exige 300 ms de posición vertical y 180 ms de inclinación sostenida. Cada acción reinicia el detector.
- Botones y flechas de teclado siempre disponibles. Escape/espacio pausa. Al ocultar la pestaña, pausa automática. La cuenta atrás se cancela al ocultarse; se debe tocar Estoy listo de nuevo.
- Sonido sintetizado, vibración cuando está disponible, símbolos y colores para cada respuesta, y bloqueo de suspensión de pantalla cuando el navegador lo permite. Ningún resultado depende de oír sonido.
- No usa cámara, micrófono, reconocimiento de señas, videos externos ni servicios de imágenes. Las pistas las da otra persona.

## Verificación

`npm test` comprueba las reglas del buscador y del juego.
`npm run test:adivina-browser` comprueba imágenes reales, Vocabulario/Colores, móvil vertical/horizontal, aciertos/pases, pausa, fin por tiempo/mazo, sensores simulados, ausencia de sensores y recuperación de fallos de red.
`npm run test:browser` comprueba navegación y buscador existentes.

Prueba física pendiente: comprobar en Android e iOS los permisos, la inclinación hacia ambos lados al sostenerlo horizontalmente, la vibración y la comodidad al sujetarlo en la frente. Las pruebas automatizadas simulan orientación; no sustituyen los sensores reales.
