# Laboratorio de señas — 2026-10-12

Dos modos: buscar una palabra y acumular conceptos reconocidos en texto editable con voz. Los accesos públicos siguen como «Próximamente». No es un traductor de frases de LSP.

## Primeras pruebas

1. Abre `lab-senas-ia.html`. Elige inicialmente cinco conceptos revisados con personas sordas usuarias de LSP. Graba al menos cinco muestras por concepto, con buena luz y cabeza, hombros y manos visibles.
2. Las muestras se guardan en ese navegador. Exporta el JSON para conservarlas o trasladarlas a otro dispositivo; no se sincronizan automáticamente.
3. En «Buscar una palabra», activa la cámara y pulsa «Buscar seña». Ante dudas se muestran sugerencias que no se aceptan como una palabra reconocida.
4. En «Señas a texto y voz», activa la cámara y pulsa «Iniciar reconocimiento». Haz señas aisladas y baja las manos fuera del cuadro entre palabras. Una seña mantenida produce como máximo un resultado antes de esa pausa. Corrige el texto y pulsa «Leer texto»; la lectura automática empieza desactivada.
5. Prueba señas que no estén en las referencias y participantes cuyas muestras no estén en el banco. La evaluación interna entre muestras no mide generalización a personas nuevas. Sus rechazos cuentan como errores.
6. El banco compartido existente es `data/senas-ia-dataset.json`, todavía vacío. Solo incorporar muestras revisadas y obtenidas con consentimiento. Entonces todos los visitantes del laboratorio las recibirán al abrirlo. Las muestras son puntos numéricos; no se publican videos.

## Alcance técnico

DTW compara manos, posición corporal y expresión cuando están disponibles. Se requieren dos conceptos, tres referencias del candidato, dos ejemplos próximos y separación del segundo candidato. Los límites de distancia son heurísticos, no probabilidades ni precisión validada con LSP real. Pueden rechazar señas válidas o aceptar una incorrecta; comprobar resultados antes de habilitar el buscador público.

El modo de texto termina un segmento tras manos fuera del cuadro por 450 ms o una ventana de 2,4 segundos. Requiere 12 fotogramas válidos y remuestrea a 24. Una pérdida de iluminación/encuadre descarta el segmento. La latencia también depende del dispositivo; no se interpreta gramática ni contexto. Cambiar de modo o detener la cámara pausa el reconocimiento; ocultar la pestaña detiene la cámara.

Los modelos se cargan al activar la cámara. El reconocimiento se realiza en el dispositivo. La voz usa únicamente una voz española que el navegador identifique como local; si no hay una, sigue disponible el texto. No requiere un servicio de pago; la primera carga de modelos necesita conexión.

## Verificación

`node --test tests/senas-ia.test.cjs`: pruebas sin dependencias sobre aceptación, rechazo de desconocidos, ambigüedad, referencias insuficientes, DTW y segmentación/repetición. Se incluyen en `npm test`. No validan cámara real ni precisión con participantes.
