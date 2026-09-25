(() => {
"use strict";

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "lspedia_chat_espanol_v1";
const levels = [
  {id:1, icon:"👋", name:"Mensajes cortos", desc:"Saludar, avisar y responder con frases sencillas."},
  {id:2, icon:"🛒", name:"Vida diaria", desc:"Compras, transporte, vecinos y situaciones cotidianas."},
  {id:3, icon:"🧭", name:"Pedir y explicar", desc:"Preguntar, pedir ayuda y explicar lo que necesitas."},
  {id:4, icon:"🎓", name:"Estudio y trabajo", desc:"Mensajes más formales, coordinaciones y explicaciones."},
  {id:5, icon:"💬", name:"Conversación completa", desc:"Conversaciones largas con detalles, causas y acuerdos."}
];

const scenarios = [
  {
    id:"casa-mama", level:1, avatar:"👩", name:"Mamá", situation:"Avisar que ya vas a casa", place:"Familia", duration:"3–4 min",
    goal:"Practica respuestas breves, claras y amables.", closing:"Perfecto. Te espero. Cuídate al venir. ❤️",
    turns:[
      {prompt:"Hola. ¿Ya saliste?", model:"Sí, mamá. Ya salí y estoy en camino.", alternatives:["Sí, ya salí. Estoy yendo a casa.","Sí, mamá. Ya voy para la casa."], keywords:["sal","camino","voy"], why:"Para avisar dónde estás, usa una idea completa: qué haces + hacia dónde vas."},
      {prompt:"¿En qué parte estás ahora?", model:"Estoy cerca del paradero principal.", alternatives:["Estoy en el paradero principal.","Estoy cerca del paradero, esperando el bus."], keywords:["paradero","cerca","bus"], why:"Con “estar” puedes indicar tu ubicación: Estoy + lugar."},
      {prompt:"¿Ya pasó el bus?", model:"Todavía no. Estoy esperando el bus.", alternatives:["Aún no pasa. Sigo esperando.","No todavía. Estoy esperando."], keywords:["esper","todavia","aun","bus"], why:"“Todavía no” y “aún no” sirven para decir que algo no ha sucedido."},
      {prompt:"Está bien. ¿Quieres que guarde tu comida?", model:"Sí, por favor. Guárdame un poco.", alternatives:["Sí, por favor. Voy a comer cuando llegue.","Sí, gracias. Guárdame mi comida."], keywords:["si","favor","guard","gracias"], why:"En una petición, “por favor” hace el mensaje más amable."},
      {prompt:"¿Más o menos a qué hora llegas?", model:"Creo que llegaré en unos veinte minutos.", alternatives:["Llegaré aproximadamente en veinte minutos.","En unos veinte minutos estaré en casa."], keywords:["minuto","lleg","veinte"], why:"Para una hora aproximada puedes usar “creo que”, “aproximadamente” o “en unos…”."},
      {prompt:"Listo. Avísame cuando estés cerca.", model:"De acuerdo, te aviso cuando esté cerca.", alternatives:["Sí, te aviso cuando llegue cerca.","Está bien. Te escribo cuando esté por llegar."], keywords:["aviso","cerca","lleg"], why:"“Cuando esté” usa subjuntivo porque habla de una situación futura."}
    ]
  },
  {
    id:"amigo-plaza", level:1, avatar:"🧑", name:"Diego", situation:"Coordinar para encontrarse", place:"Amigos", duration:"3–4 min",
    goal:"Practica hora, lugar y confirmaciones.", closing:"Buenazo. Entonces nos vemos ahí. 👋",
    turns:[
      {prompt:"Hola, ¿puedes salir esta tarde?", model:"Sí, puedo salir esta tarde.", alternatives:["Sí, estoy libre esta tarde.","Sí, hoy en la tarde puedo."], keywords:["si","tarde","puedo"], why:"Una respuesta clara confirma primero y luego agrega el momento."},
      {prompt:"¿Nos encontramos a las cinco?", model:"Sí, a las cinco está bien.", alternatives:["Sí, nos vemos a las cinco.","De acuerdo, a las cinco puedo."], keywords:["cinco","bien","vemos"], why:"Para confirmar una hora, repítela. Así evitas confusiones."},
      {prompt:"¿Dónde prefieres encontrarnos?", model:"Podemos encontrarnos en la entrada de la plaza.", alternatives:["En la entrada de la plaza está bien.","Prefiero la entrada principal de la plaza."], keywords:["entrada","plaza"], why:"Usa “en” para indicar el lugar donde se encontrarán."},
      {prompt:"Yo voy a llegar caminando. ¿Tú cómo vas?", model:"Yo iré en bus.", alternatives:["Voy a ir en bus.","Iré en bus hasta el centro."], keywords:["bus","ire","voy"], why:"“Iré” expresa una acción futura de manera breve."},
      {prompt:"Si llego antes, te escribo.", model:"Perfecto. Yo también te aviso cuando llegue.", alternatives:["Está bien. Te aviso cuando esté cerca.","Perfecto, nos escribimos cuando lleguemos."], keywords:["aviso","lleg","perfecto"], why:"“Cuando llegue” es natural al hablar de una acción futura."},
      {prompt:"¿Llevo algo para tomar?", model:"Sí, si puedes lleva una botella de agua.", alternatives:["Sí, por favor. Lleva agua.","Una botella de agua estaría bien, gracias."], keywords:["agua","botella","gracias","favor"], why:"Una petición amable puede incluir “si puedes” o “por favor”."}
    ]
  },
  {
    id:"bodega-pan", level:1, avatar:"👩", name:"Rosa", situation:"Comprar en una bodega", place:"Compras", duration:"3–4 min",
    goal:"Practica saludos, cantidades y cortesía.", closing:"Gracias. Que tenga una buena tarde. 🙂",
    turns:[
      {prompt:"Buenas tardes. ¿Qué va a llevar?", model:"Buenas tardes. Quisiera dos panes y una botella de agua, por favor.", alternatives:["Buenas tardes. Deme dos panes y una botella de agua, por favor.","Quiero dos panes y una botella de agua, por favor."], keywords:["pan","agua","favor"], why:"“Quisiera” es una forma amable de pedir algo en una tienda."},
      {prompt:"Claro. ¿Algo más?", model:"Sí, también quisiera una leche.", alternatives:["Sí, también una leche, por favor.","Sí. Agrégueme una leche, por favor."], keywords:["leche","tambien"], why:"“También” ayuda a añadir otro producto a la compra."},
      {prompt:"¿La leche grande o pequeña?", model:"La pequeña, por favor.", alternatives:["Una pequeña, por favor.","Quiero la leche pequeña."], keywords:["peque"], why:"Cuando la pregunta ya da el contexto, puedes responder de forma breve pero completa."},
      {prompt:"Son ocho soles con cincuenta.", model:"Está bien. Voy a pagar en efectivo.", alternatives:["De acuerdo. Pago en efectivo.","Está bien, le pago en efectivo."], keywords:["efectivo","pago"], why:"“Voy a pagar en…” indica claramente la forma de pago."},
      {prompt:"¿Tiene sencillo?", model:"Sí, tengo diez soles.", alternatives:["Sí, tengo un billete de diez soles.","Sí, aquí tengo diez soles."], keywords:["diez","soles","billete"], why:"En Perú, “sencillo” suele referirse a dinero para dar vuelto."},
      {prompt:"Aquí tiene su vuelto y su compra.", model:"Muchas gracias.", alternatives:["Gracias. Que tenga buena tarde.","Muchas gracias por atenderme."], keywords:["gracias"], why:"Cerrar una compra con un agradecimiento es natural y cortés."}
    ]
  },
  {
    id:"bus-centro", level:2, avatar:"🚌", name:"Cobrador", situation:"Viajar en bus al centro", place:"Transporte", duration:"4–5 min",
    goal:"Practica preguntas de ruta, pasaje y paradero.", closing:"Ya. Yo te aviso cuando lleguemos al paradero. 👍",
    turns:[
      {prompt:"Sube nomás. ¿A dónde vas?", model:"Voy al centro. ¿Este bus pasa por la plaza?", alternatives:["Voy al centro. ¿Pasa por la plaza principal?","Quiero ir al centro. ¿Este bus me deja cerca de la plaza?"], keywords:["centro","plaza","pasa"], why:"En una pregunta escribe los signos ¿ ? y explica primero tu destino."},
      {prompt:"Sí, pasa por la plaza. El pasaje es dos soles.", model:"Está bien. Aquí tiene dos soles.", alternatives:["De acuerdo, aquí tiene.","Perfecto. Le pago dos soles."], keywords:["dos","soles","aqui","pago"], why:"Una respuesta breve funciona porque el contexto ya está claro."},
      {prompt:"¿Vas a bajar en la plaza o más adelante?", model:"Voy a bajar en la plaza, por favor.", alternatives:["En la plaza, por favor.","Bajo en la plaza principal."], keywords:["plaza","bajar"], why:"“Voy a bajar en…” indica el lugar exacto donde deseas descender."},
      {prompt:"Hay bastante tráfico hoy.", model:"Sí, parece que vamos a demorar un poco.", alternatives:["Sí, hay bastante tráfico.","Sí, probablemente lleguemos un poco tarde."], keywords:["trafico","demor","tarde"], why:"“Parece que” sirve para expresar una observación sin asegurarla totalmente."},
      {prompt:"¿Tienes apuro?", model:"Un poco. Tengo una cita a las cuatro.", alternatives:["Sí, un poco. Debo llegar antes de las cuatro.","Tengo una cita a las cuatro, pero todavía tengo tiempo."], keywords:["cita","cuatro","tiempo","apuro"], why:"Explica la razón con una segunda oración corta."},
      {prompt:"Estamos a unas tres cuadras de la plaza.", model:"Gracias. ¿Me avisa cuando lleguemos, por favor?", alternatives:["Gracias. Avíseme cuando lleguemos, por favor.","¿Puede avisarme al llegar a la plaza?"], keywords:["avisa","avise","lleg","favor"], why:"Con una persona desconocida es natural usar “¿me avisa…?” o “¿puede avisarme…?”."},
      {prompt:"Sí, no te preocupes.", model:"Muchas gracias.", alternatives:["Gracias por avisarme.","Perfecto, gracias."], keywords:["gracias"], why:"Un agradecimiento cierra la interacción de forma amable."}
    ]
  },
  {
    id:"mercado-compras", level:2, avatar:"👩‍🌾", name:"Lucía", situation:"Comprar en el mercado", place:"Mercado", duration:"4–5 min",
    goal:"Practica precios, cantidades y decisiones.", closing:"Listo, joven. Aquí está su compra. ¡Que le vaya bien!",
    turns:[
      {prompt:"Buenos días. ¿Qué está buscando?", model:"Buenos días. Quiero comprar papa y tomate.", alternatives:["Buenos días. Busco papa y tomate.","Quisiera comprar papa y tomate."], keywords:["papa","tomate"], why:"Puedes usar “quiero”, “busco” o “quisiera”; las tres formas son naturales según el tono."},
      {prompt:"La papa está a cuatro soles el kilo. ¿Cuánto desea?", model:"Deme dos kilos, por favor.", alternatives:["Quisiera dos kilos, por favor.","Voy a llevar dos kilos."], keywords:["dos","kilo"], why:"Para pedir una cantidad, usa número + unidad: dos kilos."},
      {prompt:"¿Y de tomate cuánto le pongo?", model:"Póngame un kilo de tomate.", alternatives:["Un kilo de tomate, por favor.","También voy a llevar un kilo de tomate."], keywords:["kilo","tomate"], why:"“Póngame…” es una forma común y cortés de comprar en un mercado."},
      {prompt:"¿Algo más? Tengo cebolla fresca.", model:"No, gracias. Con eso está bien.", alternatives:["No, muchas gracias. Eso es todo.","Por ahora no, gracias."], keywords:["no","gracias","todo","bien"], why:"Para rechazar amablemente una oferta, agrega “gracias”."},
      {prompt:"Todo sale doce soles.", model:"¿Puedo pagar con tarjeta?", alternatives:["¿Acepta tarjeta?","¿Se puede pagar con tarjeta?"], keywords:["tarjeta","pagar"], why:"En una pregunta directa recuerda usar ¿ al inicio y ? al final."},
      {prompt:"Solo efectivo o transferencia.", model:"Entonces pagaré por transferencia.", alternatives:["Está bien. Haré una transferencia.","De acuerdo, pago por transferencia."], keywords:["transferencia","pago"], why:"“Entonces” conecta la información recibida con tu decisión."},
      {prompt:"Ya llegó el pago. ¿Desea bolsa?", model:"Sí, una bolsa, por favor.", alternatives:["Sí, por favor.","Sí, necesito una bolsa."], keywords:["bolsa","favor"], why:"Una respuesta breve es suficiente cuando la pregunta es concreta."}
    ]
  },
  {
    id:"vecina-paquete", level:2, avatar:"👩‍🦱", name:"Ana", situation:"Coordinar con una vecina", place:"Vecindario", duration:"4–5 min",
    goal:"Practica avisos, favores y agradecimientos.", closing:"No hay problema. Cuando llegues, me escribes. 😊",
    turns:[
      {prompt:"Hola. Dejaron un paquete para ti en mi casa.", model:"Hola, Ana. Muchas gracias por recibirlo.", alternatives:["Gracias, Ana, por guardar mi paquete.","Hola. Gracias por recibir el paquete."], keywords:["gracias","paquete","recib"], why:"Agradece primero cuando alguien te hace un favor."},
      {prompt:"¿Estás cerca?", model:"Todavía no. Estoy en el trabajo.", alternatives:["Aún no. Sigo en el trabajo.","No, todavía estoy trabajando."], keywords:["trabajo","todavia","aun"], why:"“Todavía” o “aún” indican que una situación continúa."},
      {prompt:"¿A qué hora llegas?", model:"Creo que llegaré cerca de las siete.", alternatives:["Llegaré aproximadamente a las siete.","Estaré por la casa a eso de las siete."], keywords:["siete","lleg"], why:"“Cerca de”, “aproximadamente” y “a eso de” sirven para horas aproximadas."},
      {prompt:"A esa hora estaré en casa.", model:"Perfecto. Paso a recogerlo cuando llegue.", alternatives:["Perfecto. Cuando llegue, paso por tu casa.","Está bien. Lo recojo al llegar."], keywords:["reco","lleg","paso"], why:"Evita repetir demasiado: “lo” puede reemplazar “el paquete” cuando ya está claro."},
      {prompt:"Si quieres, también puedo dejarlo con tu mamá.", model:"Gracias, pero prefiero recogerlo yo.", alternatives:["Gracias. Mejor paso yo a recogerlo.","Te agradezco, pero yo lo recojo."], keywords:["gracias","prefiero","reco"], why:"“Gracias, pero…” permite rechazar una opción con cortesía."},
      {prompt:"Está bien. Te lo guardo.", model:"Muchas gracias por la ayuda.", alternatives:["Gracias, Ana. Me ayudas mucho.","Te agradezco mucho."], keywords:["gracias","ayuda","agrade"], why:"Cerrar con un agradecimiento mantiene un tono amable."}
    ]
  },
  {
    id:"salud-cita", level:3, avatar:"👩‍⚕️", name:"Dra. Vega", situation:"Explicar un malestar", place:"Salud", duration:"5–6 min",
    goal:"Practica describir síntomas y responder preguntas.", closing:"Muy bien. Sigue las indicaciones y vuelve si no mejoras. Que te recuperes pronto.",
    turns:[
      {prompt:"Buenos días. Cuénteme, ¿qué le pasa?", model:"Buenos días. Me duele la garganta desde ayer.", alternatives:["Tengo dolor de garganta desde ayer.","Desde ayer me duele bastante la garganta."], keywords:["garganta","ayer","duele","dolor"], why:"Para explicar un síntoma incluye qué te duele y desde cuándo."},
      {prompt:"¿Ha tenido fiebre?", model:"Sí, anoche tuve un poco de fiebre.", alternatives:["Sí, tuve fiebre anoche.","Anoche tuve fiebre, pero hoy estoy mejor."], keywords:["fiebre","anoche","si"], why:"Usa pasado (“tuve”) para un síntoma que ocurrió anoche."},
      {prompt:"¿Tiene tos?", model:"Sí, tengo tos, sobre todo por la noche.", alternatives:["Tengo un poco de tos en la noche.","Sí, la tos empeora por la noche."], keywords:["tos","noche"], why:"“Sobre todo” ayuda a destacar el momento en que el síntoma es más fuerte."},
      {prompt:"¿Está tomando algún medicamento?", model:"No, todavía no he tomado ningún medicamento.", alternatives:["No, aún no he tomado nada.","No estoy tomando medicamentos."], keywords:["no","medic","tom"], why:"“Todavía no he tomado…” expresa que hasta este momento no lo has hecho."},
      {prompt:"¿Es alérgico a algún medicamento?", model:"No que yo sepa.", alternatives:["No, no tengo alergias conocidas.","Hasta donde sé, no soy alérgico a medicamentos."], keywords:["no","alerg"], why:"“No que yo sepa” es una forma natural cuando no conoces ninguna alergia."},
      {prompt:"Voy a revisarlo. Necesito que abra la boca.", model:"De acuerdo.", alternatives:["Está bien, doctora.","Claro."], keywords:["acuerdo","bien","claro"], why:"Cuando recibes una indicación sencilla, una confirmación breve es suficiente."},
      {prompt:"Parece una infección leve. Le voy a indicar tratamiento.", model:"Entiendo. ¿Cada cuántas horas debo tomarlo?", alternatives:["De acuerdo. ¿Con qué frecuencia debo tomar el medicamento?","¿Cuántas veces al día debo tomarlo?"], keywords:["horas","tom","veces","frecuencia"], why:"Pedir la frecuencia evita errores al seguir un tratamiento."},
      {prompt:"Cada ocho horas, después de comer.", model:"Muchas gracias, doctora. Seguiré las indicaciones.", alternatives:["Gracias. Voy a seguir el tratamiento como me indicó.","Muchas gracias por la explicación."], keywords:["gracias","indic","tratamiento"], why:"Repetir que seguirás las indicaciones confirma que entendiste."}
    ]
  },
  {
    id:"banco-dni", level:3, avatar:"👨‍💼", name:"Asesor", situation:"Hacer una consulta en el banco", place:"Trámite", duration:"5–6 min",
    goal:"Practica explicar una necesidad y pedir información.", closing:"Eso sería todo. Guarde su constancia, por favor. Que tenga buen día.",
    turns:[
      {prompt:"Buenos días. ¿En qué puedo ayudarlo?", model:"Buenos días. Quiero actualizar mis datos personales.", alternatives:["Buenos días. Necesito actualizar mis datos.","Quisiera hacer una actualización de mis datos personales."], keywords:["actualiz","datos"], why:"En un trámite explica tu objetivo desde el primer mensaje."},
      {prompt:"Claro. ¿Tiene su DNI?", model:"Sí, aquí está mi DNI.", alternatives:["Sí, lo tengo aquí.","Claro, aquí tiene mi DNI."], keywords:["dni","aqui"], why:"Con documentos, “aquí está” o “aquí tiene” son formas naturales."},
      {prompt:"Gracias. ¿Cambió su dirección o su número de teléfono?", model:"Cambió mi dirección y también mi número de teléfono.", alternatives:["Sí, cambiaron mi dirección y mi teléfono.","Necesito actualizar la dirección y el número de celular."], keywords:["direccion","telefono","numero"], why:"“También” permite añadir un segundo dato sin separar demasiado la idea."},
      {prompt:"¿Cuál es su nueva dirección?", model:"Mi nueva dirección es avenida Los Pinos 245.", alternatives:["Ahora vivo en la avenida Los Pinos 245.","La dirección nueva es avenida Los Pinos 245."], keywords:["avenida","pinos","245"], why:"En una dirección conviene responder de forma directa y completa."},
      {prompt:"¿Y cuál es su número actual?", model:"Mi número actual es 987 654 321.", alternatives:["El nuevo número es 987 654 321.","Ahora uso el número 987 654 321."], keywords:["987","numero"], why:"“Actual” ayuda a diferenciar el número nuevo del anterior."},
      {prompt:"Perfecto. Voy a registrar los cambios.", model:"Gracias. ¿Necesito firmar algún documento?", alternatives:["Muchas gracias. ¿Tengo que firmar algo?","¿Debo firmar algún documento?"], keywords:["firm","documento"], why:"“Necesito”, “tengo que” y “debo” pueden expresar obligación."},
      {prompt:"Sí, esta constancia.", model:"De acuerdo. ¿Dónde debo firmar?", alternatives:["Está bien. ¿En qué parte firmo?","Claro. Indíqueme dónde debo firmar."], keywords:["donde","firm"], why:"“¿Dónde…?” lleva tilde porque es una pregunta."},
      {prompt:"Aquí, en la parte inferior.", model:"Listo. Muchas gracias por la atención.", alternatives:["Ya firmé. Gracias por la ayuda.","Listo, gracias por atenderme."], keywords:["listo","gracias","atencion"], why:"Al terminar un trámite, confirma que terminaste y agradece."}
    ]
  },
  {
    id:"colegio-profesora", level:4, avatar:"👩‍🏫", name:"Profesora Elena", situation:"Coordinar una tarea", place:"Colegio", duration:"5–6 min",
    goal:"Practica preguntas, explicaciones y mensajes respetuosos.", closing:"Perfecto. Gracias por avisar y organizarte con tiempo. Nos vemos mañana.",
    turns:[
      {prompt:"Hola. ¿Ya revisaste las indicaciones del trabajo?", model:"Sí, profesora. Ya las revisé, pero tengo una duda.", alternatives:["Sí, ya leí las indicaciones. Quisiera hacerle una pregunta.","Sí, profesora, pero hay una parte que no entiendo."], keywords:["si","duda","pregunta","entiendo"], why:"En un mensaje respetuoso puedes confirmar y luego explicar tu dificultad."},
      {prompt:"Claro. ¿Qué parte no entiendes?", model:"No entiendo si el trabajo debe hacerse individualmente o en grupo.", alternatives:["Quisiera saber si el trabajo es individual o grupal.","Tengo duda sobre si debemos trabajar solos o en grupo."], keywords:["individual","grupo","solos"], why:"Usa “si” sin tilde cuando introduce dos posibilidades: si es individual o en grupo."},
      {prompt:"Se hace en grupos de tres personas.", model:"Entendido. ¿Podemos elegir a nuestros compañeros?", alternatives:["De acuerdo. ¿Nosotros formamos los grupos?","Gracias. ¿Podemos escoger con quién trabajar?"], keywords:["podemos","compan","grupo","eleg"], why:"Una pregunta clara incluye exactamente la información que necesitas confirmar."},
      {prompt:"Sí, ustedes forman sus grupos.", model:"Perfecto. Ya tengo dos compañeros con quienes trabajar.", alternatives:["Perfecto, ya completamos un grupo de tres.","Muy bien. Ya somos tres personas en mi grupo."], keywords:["dos","tres","grupo","compan"], why:"“Con quienes” conecta a las personas con la acción de trabajar."},
      {prompt:"¿Ya decidieron el tema?", model:"Sí. Vamos a trabajar sobre el cuidado del agua.", alternatives:["Sí, elegimos el tema del cuidado del agua.","Nuestro tema será el cuidado del agua."], keywords:["agua","tema","cuidado"], why:"Para un plan futuro puedes usar “vamos a trabajar” o “nuestro tema será…”."},
      {prompt:"Bien. Recuerden incluir una conclusión.", model:"De acuerdo. Incluiremos una conclusión al final.", alternatives:["Sí, profesora. La pondremos al final.","Entendido. Vamos a agregar una conclusión."], keywords:["conclusion","final","agregar"], why:"Reformular la indicación demuestra que la entendiste."},
      {prompt:"¿Cuándo piensan reunirse?", model:"Nos reuniremos mañana después de clases.", alternatives:["Mañana después de clases nos reuniremos.","Hemos quedado en reunirnos mañana al salir."], keywords:["manana","clases","reun"], why:"Para planes futuros, “nos reuniremos” comunica un acuerdo ya definido."},
      {prompt:"Muy bien. Si tienen otra duda, me escriben.", model:"Muchas gracias, profesora. Le escribiremos si necesitamos ayuda.", alternatives:["Gracias, profesora. Le avisaremos si surge otra duda.","Muchas gracias por la orientación."], keywords:["gracias","ayuda","duda","escrib"], why:"Un cierre formal puede agradecer y confirmar qué harán si necesitan apoyo."}
    ]
  },
  {
    id:"trabajo-informe", level:4, avatar:"👨‍💻", name:"Carlos", situation:"Coordinar un informe de trabajo", place:"Trabajo", duration:"5–6 min",
    goal:"Practica mensajes profesionales y acuerdos claros.", closing:"Excelente. Quedamos así entonces. Gracias por mantenerme informado.",
    turns:[
      {prompt:"Hola. ¿Cómo vas con el informe de ventas?", model:"Hola, Carlos. Ya avancé bastante, pero todavía me falta revisar los últimos datos.", alternatives:["Hola. El informe está avanzado, aunque aún debo revisar algunos datos.","Voy bien. Solo me falta revisar la información final."], keywords:["informe","revis","datos","falta"], why:"En trabajo es útil informar avance + lo que todavía falta."},
      {prompt:"¿Crees que estará listo hoy?", model:"Sí, creo que podré terminarlo antes de las cinco.", alternatives:["Sí. Espero terminarlo antes de las cinco.","Creo que sí; lo tendré listo esta tarde."], keywords:["cinco","termin","listo","tarde"], why:"“Creo que podré…” comunica una estimación sin prometer algo imposible."},
      {prompt:"Necesito enviarlo a gerencia a las cinco y media.", model:"Entiendo. Voy a priorizar la revisión para enviártelo a tiempo.", alternatives:["De acuerdo. Lo revisaré primero para entregarlo a tiempo.","Entiendo la urgencia. Te lo enviaré antes de esa hora."], keywords:["tiempo","revis","enviar","urgencia"], why:"En un contexto profesional, confirma que entendiste la prioridad."},
      {prompt:"¿Te falta información de algún área?", model:"Sí, me falta el dato de gastos de logística.", alternatives:["Solo falta la información de gastos de logística.","Necesito el dato final del área de logística."], keywords:["logistica","gastos","dato"], why:"Identifica exactamente qué información falta para que la otra persona pueda ayudarte."},
      {prompt:"Yo puedo pedirlo ahora.", model:"Gracias. Si me lo envías pronto, podré cerrar el informe.", alternatives:["Perfecto, gracias. Con ese dato termino el informe.","Muchas gracias. Apenas llegue ese dato, termino la revisión."], keywords:["gracias","dato","informe","termin"], why:"“Si + presente, futuro” sirve para explicar una condición real: si llega, podré terminar."},
      {prompt:"Ya lo solicité. Me dijeron que lo mandan en diez minutos.", model:"Perfecto. Mientras tanto revisaré las demás cifras.", alternatives:["Gracias. Voy a avanzar con la revisión mientras llega.","Perfecto, seguiré revisando el resto."], keywords:["revis","mientras","resto","cifras"], why:"“Mientras tanto” conecta dos acciones que ocurren durante el mismo periodo."},
      {prompt:"¿Quieres que revise el documento antes de enviarlo?", model:"Sí, por favor. Me ayudaría que revises las conclusiones.", alternatives:["Sí, gracias. ¿Puedes revisar especialmente las conclusiones?","Por favor, revisa las conclusiones cuando te lo envíe."], keywords:["conclus","revis","favor"], why:"Una petición profesional funciona mejor si especifica qué parte revisar."},
      {prompt:"Claro. Envíamelo apenas termines.", model:"De acuerdo. Te lo enviaré apenas esté listo.", alternatives:["Perfecto. Te escribo y te lo envío cuando termine.","Está bien. Apenas lo finalice, te lo mando."], keywords:["envio","listo","term","apenas"], why:"“Apenas esté listo” expresa que una acción ocurrirá inmediatamente después de otra."}
    ]
  },
  {
    id:"municipalidad-tramite", level:5, avatar:"🏛️", name:"Orientadora", situation:"Realizar un trámite municipal", place:"Trámites", duration:"7–8 min",
    goal:"Practica una conversación formal larga con preguntas y aclaraciones.", closing:"Muy bien. Con eso su solicitud queda presentada. Revise su correo para recibir la respuesta.",
    turns:[
      {prompt:"Buenos días. ¿Qué trámite desea realizar?", model:"Buenos días. Quiero solicitar una constancia de domicilio.", alternatives:["Buenos días. Necesito tramitar una constancia de domicilio.","Quisiera solicitar una constancia de domicilio."], keywords:["constancia","domicilio","solic"], why:"Empieza indicando claramente el nombre del trámite que necesitas."},
      {prompt:"¿Es la primera vez que realiza esta solicitud?", model:"Sí, es la primera vez.", alternatives:["Sí, nunca he hecho este trámite antes.","Sí. Es mi primera solicitud."], keywords:["primera","si"], why:"Una respuesta directa basta cuando la pregunta es de confirmación."},
      {prompt:"Necesita su DNI y un recibo de servicio donde figure su dirección.", model:"Tengo mi DNI y un recibo de luz. ¿Ese recibo sirve?", alternatives:["Traje mi DNI y un recibo de luz. ¿Es suficiente?","Tengo ambos documentos. El recibo es de luz, ¿está bien?"], keywords:["dni","recibo","luz","sirve"], why:"Cuando no estás seguro, menciona lo que tienes y pregunta si es válido."},
      {prompt:"Sí, el recibo de luz sirve si es reciente.", model:"Perfecto. El recibo es del mes pasado.", alternatives:["Sí, es reciente; corresponde al mes pasado.","Está bien. Este recibo es del mes anterior."], keywords:["mes","pasado","reciente"], why:"Aporta el dato que confirma que cumples el requisito."},
      {prompt:"Muy bien. También debe llenar este formulario.", model:"De acuerdo. ¿Debo completar todos los campos?", alternatives:["Está bien. ¿Tengo que llenar todo el formulario?","De acuerdo. ¿Hay algún campo que pueda dejar vacío?"], keywords:["campos","formulario","complet","llen"], why:"Pregunta antes de dejar información incompleta en un documento."},
      {prompt:"Complete sus datos y la dirección. El espacio de observaciones es opcional.", model:"Entendido. Entonces dejaré vacías las observaciones si no tengo nada que agregar.", alternatives:["De acuerdo. Si no tengo observaciones, no escribiré nada allí.","Perfecto. Completaré solo los campos obligatorios."], keywords:["observ","vaci","oblig"], why:"Repetir la instrucción con tus palabras confirma que la entendiste."},
      {prompt:"Correcto. ¿La constancia la necesita para hoy?", model:"No necesariamente, pero quisiera saber cuánto demora el trámite.", alternatives:["No es urgente. ¿Cuánto tiempo demora?","Puedo esperar. ¿En cuántos días entregan la constancia?"], keywords:["demora","dias","tiempo","cuanto"], why:"“¿Cuánto demora…?” es una pregunta natural para conocer el plazo."},
      {prompt:"Normalmente demora tres días hábiles.", model:"Está bien. ¿Me avisarán cuando esté lista?", alternatives:["De acuerdo. ¿Recibiré algún aviso cuando termine?","Perfecto. ¿Cómo sabré que ya puedo recogerla?"], keywords:["avis","lista","recib"], why:"Pregunta también cómo recibirás la confirmación, no solo el plazo."},
      {prompt:"Sí, enviaremos un mensaje al correo que registre.", model:"Entonces voy a escribir mi correo con cuidado para que esté correcto.", alternatives:["Perfecto. Verificaré bien mi correo antes de entregar el formulario.","De acuerdo. Me aseguraré de registrar correctamente mi correo."], keywords:["correo","correct","verific","cuidado"], why:"Explica la acción que tomarás para evitar un error en tus datos."},
      {prompt:"Revise todo y luego entrégueme los documentos.", model:"Ya revisé los datos. Aquí tiene el formulario, mi DNI y el recibo.", alternatives:["Listo. Aquí están todos los documentos.","Ya verifiqué la información. Le entrego el formulario y los documentos."], keywords:["formulario","dni","recibo","document"], why:"Al entregar documentos, enuméralos para confirmar que no falta ninguno."}
    ]
  },
  {
    id:"amigos-salida", level:5, avatar:"👥", name:"Grupo de amigos", situation:"Organizar una salida por chat", place:"Amigos", duration:"7–8 min",
    goal:"Practica una conversación natural con propuestas, razones y acuerdos.", closing:"¡Listo! Entonces sábado a las cuatro en la plaza. Nos vemos. 🙌",
    turns:[
      {prompt:"Diego: ¿Qué hacemos este fin de semana?", model:"Podríamos salir el sábado por la tarde.", alternatives:["¿Qué tal si salimos el sábado en la tarde?","Propongo que nos reunamos el sábado."], keywords:["sabado","tarde","salir","reun"], why:"“Podríamos…” permite hacer una propuesta sin imponerla."},
      {prompt:"María: El sábado me parece bien. ¿A dónde vamos?", model:"Podemos ir al centro y luego tomar algo.", alternatives:["Podríamos encontrarnos en el centro y después ir a una cafetería.","Vamos al centro y vemos dónde tomar algo."], keywords:["centro","tomar","cafeter"], why:"Usa “luego” o “después” para ordenar dos actividades."},
      {prompt:"Diego: ¿A qué hora les queda bien?", model:"A mí me queda bien a las cuatro de la tarde.", alternatives:["Yo puedo a las cuatro.","Las cuatro de la tarde me parece una buena hora."], keywords:["cuatro","tarde"], why:"“Me queda bien” es una expresión natural para aceptar una hora."},
      {prompt:"María: Yo salgo de trabajar a las tres y media.", model:"Entonces a las cuatro está bien para que llegues con tiempo.", alternatives:["Perfecto. Nos vemos a las cuatro para que puedas llegar tranquila.","Entonces mantenemos las cuatro; así tienes tiempo de llegar."], keywords:["cuatro","tiempo","entonces"], why:"“Para que” explica la finalidad o razón de una decisión."},
      {prompt:"Diego: ¿Nos encontramos en la plaza?", model:"Sí, en la entrada principal de la plaza.", alternatives:["Sí. Mejor en la entrada principal.","De acuerdo, nos encontramos en la entrada de la plaza."], keywords:["entrada","plaza"], why:"Especificar el punto exacto evita confusiones."},
      {prompt:"María: Puede que llueva. ¿Llevamos paraguas?", model:"Sí, sería mejor llevar paraguas por si llueve.", alternatives:["Sí, llevemos paraguas por si acaso.","Buena idea. Es mejor llevar paraguas."], keywords:["paraguas","llue","mejor"], why:"“Por si…” se usa para prepararse ante una posibilidad."},
      {prompt:"Diego: También podemos ir a un lugar cerrado si empieza a llover.", model:"Sí, podemos decidirlo cuando estemos allá.", alternatives:["De acuerdo. Si llueve, buscamos un lugar cerrado.","Sí, vemos qué hacemos según el clima."], keywords:["llueve","cerrado","decid","clima"], why:"Una condición con “si” permite planear una alternativa."},
      {prompt:"María: ¿Alguien más va a ir?", model:"Voy a preguntarle a José si quiere acompañarnos.", alternatives:["Le escribiré a José para invitarlo.","Puedo preguntarle a José si también quiere ir."], keywords:["jose","pregunt","invitar","acompan"], why:"“Si quiere acompañarnos” expresa una invitación indirecta."},
      {prompt:"Diego: Avísanos qué te responde.", model:"Claro. Apenas me responda, les aviso por el grupo.", alternatives:["Sí. Les escribo cuando José responda.","De acuerdo, les aviso en cuanto tenga su respuesta."], keywords:["aviso","grupo","respon"], why:"“Apenas” o “en cuanto” indican que harás algo inmediatamente después."},
      {prompt:"María: Entonces ya tenemos hora y lugar.", model:"Sí. Sábado a las cuatro, en la entrada principal de la plaza.", alternatives:["Correcto: nos vemos el sábado a las cuatro en la plaza.","Sí, queda confirmado para el sábado a las cuatro."], keywords:["sabado","cuatro","plaza","confirm"], why:"Al final de una coordinación, resume día, hora y lugar."}
    ]
  },
  {
    id:"farmacia-receta", level:3, avatar:"💊", name:"Farmacéutica", situation:"Comprar con una receta", place:"Salud", duration:"5–6 min",
    goal:"Practica explicar lo que necesitas, confirmar información y preguntar con cortesía.", closing:"Muy bien. Aquí tiene todo y su comprobante. Que se mejore pronto.",
    turns:[
      {prompt:"Buenas tardes. ¿En qué puedo ayudarlo?", model:"Buenas tardes. Quiero comprar los medicamentos de esta receta.", alternatives:["Buenas tardes. Tengo esta receta y necesito los medicamentos indicados.","Quisiera comprar lo que aparece en esta receta."], keywords:["receta","medic"], why:"Menciona desde el inicio que tienes una receta y cuál es tu objetivo."},
      {prompt:"Claro. ¿La receta es para usted?", model:"Sí, es para mí.", alternatives:["Sí, la receta es mía.","Sí, estos medicamentos son para mí."], keywords:["si","mi"], why:"Una pregunta de confirmación puede responderse de forma breve y directa."},
      {prompt:"Uno de los medicamentos tiene dos presentaciones. ¿Le indicaron tabletas o jarabe?", model:"Me indicaron tabletas.", alternatives:["En la receta dice tabletas.","Debo llevar la presentación en tabletas."], keywords:["tabletas"], why:"Cuando hay opciones, menciona exactamente la presentación indicada."},
      {prompt:"Perfecto. ¿Necesita que le explique cómo leer la indicación de la caja?", model:"Sí, por favor. Quiero asegurarme de entenderla bien.", alternatives:["Sí, agradecería que me la explique.","Sí, por favor. Quiero revisar la indicación."], keywords:["si","favor","explic","indic"], why:"Si algo no está claro, pedir una explicación es mejor que asumir."},
      {prompt:"Aquí dice que debe seguir lo indicado por su profesional de salud y revisar el horario de la receta.", model:"Entiendo. Voy a seguir exactamente lo que indica la receta.", alternatives:["De acuerdo. Seguiré las indicaciones de la receta.","Entendido. Revisaré bien el horario antes de tomarlo."], keywords:["indic","receta","horario"], why:"Repetir la instrucción con tus palabras ayuda a confirmar que la comprendiste."},
      {prompt:"¿Desea todos los productos de la receta?", model:"Sí, quisiera llevar todos, por favor.", alternatives:["Sí, voy a llevar todo lo indicado.","Sí, deme todos los productos de la receta, por favor."], keywords:["todos","receta","favor"], why:"“Quisiera” y “por favor” mantienen un tono amable al comprar."},
      {prompt:"El total es treinta y seis soles. ¿Cómo va a pagar?", model:"Voy a pagar con tarjeta.", alternatives:["Con tarjeta, por favor.","Pagaré con tarjeta."], keywords:["tarjeta","pagar"], why:"Para indicar el medio de pago puedes usar “voy a pagar con…”."},
      {prompt:"Listo. ¿Necesita una bolsa?", model:"Sí, por favor. Muchas gracias.", alternatives:["Sí, una bolsa, por favor.","Sí. Gracias por la atención."], keywords:["bolsa","gracias","favor"], why:"Puedes responder la pregunta y agradecer en el mismo mensaje."}
    ]
  },
  {
    id:"entrevista-trabajo", level:4, avatar:"👩‍💼", name:"Sra. Ramírez", situation:"Coordinar una entrevista de trabajo", place:"Trabajo", duration:"5–6 min",
    goal:"Practica mensajes formales, disponibilidad y confirmaciones.", closing:"Perfecto. Queda confirmada su entrevista. Lo esperamos el martes. Éxitos.",
    turns:[
      {prompt:"Buenos días. Le escribo por su postulación. ¿Tiene unos minutos?", model:"Buenos días. Sí, claro. Muchas gracias por comunicarse conmigo.", alternatives:["Buenos días. Sí, tengo disponibilidad. Gracias por contactarme.","Buenos días. Claro, puedo conversar ahora."], keywords:["buenos","si","gracias","dispon"], why:"En un contexto laboral, saluda y confirma tu disponibilidad con un tono cordial."},
      {prompt:"Queremos invitarlo a una entrevista presencial.", model:"Muchas gracias por la invitación. ¿Qué día sería la entrevista?", alternatives:["Gracias. ¿Para qué fecha está programada?","Con gusto. ¿Podría indicarme el día de la entrevista?"], keywords:["gracias","dia","fecha","entrevista"], why:"Después de aceptar, pregunta por el dato que necesitas para organizarte."},
      {prompt:"Podría ser el martes a las diez de la mañana.", model:"El martes a las diez me queda bien.", alternatives:["Sí, tengo disponibilidad el martes a las diez.","De acuerdo, puedo asistir a esa hora."], keywords:["martes","diez","bien","asist"], why:"Repite el día y la hora al confirmar una cita importante."},
      {prompt:"La oficina queda en la avenida Central 450.", model:"Entendido. ¿Debo preguntar por alguna persona al llegar?", alternatives:["Gracias. ¿Con quién debo anunciarme al llegar?","De acuerdo. ¿A quién debo indicar que vengo a ver?"], keywords:["quien","persona","lleg"], why:"Pregunta por la persona de contacto para evitar confusiones al llegar."},
      {prompt:"Pregunte por mí, la señora Ramírez.", model:"Perfecto, señora Ramírez. Lo tendré en cuenta.", alternatives:["De acuerdo. Preguntaré por usted al llegar.","Perfecto, gracias por indicármelo."], keywords:["ramirez","perfecto","gracias"], why:"Confirmar el nombre demuestra que registraste correctamente la información."},
      {prompt:"Traiga su DNI y una copia de su currículum.", model:"De acuerdo. Llevaré mi DNI y una copia de mi currículum.", alternatives:["Entendido. Prepararé ambos documentos.","Está bien. Llevaré los documentos indicados."], keywords:["dni","curriculum","document"], why:"Repetir los documentos permite verificar que no olvidarás ninguno."},
      {prompt:"¿Tiene alguna consulta sobre la entrevista?", model:"Sí. ¿Aproximadamente cuánto tiempo durará?", alternatives:["Quisiera saber cuánto dura aproximadamente la entrevista.","Sí. ¿Podría indicarme la duración aproximada?"], keywords:["cuanto","tiempo","dur"], why:"“Aproximadamente” es útil cuando sabes que la duración puede variar."},
      {prompt:"Entre treinta y cuarenta minutos.", model:"Entendido. Muchas gracias por la información. Nos vemos el martes.", alternatives:["Perfecto, gracias. Estaré allí el martes a las diez.","Muchas gracias. Queda confirmado para el martes."], keywords:["gracias","martes","confirm"], why:"Cierra resumiendo el acuerdo principal y agradeciendo."}
    ]
  },
  {
    id:"viaje-terminal", level:5, avatar:"🧳", name:"Agente de terminal", situation:"Comprar un pasaje interprovincial", place:"Viaje", duration:"7–8 min",
    goal:"Practica una conversación larga con horarios, alternativas, equipaje y confirmación final.", closing:"Su compra quedó registrada. Llegue al terminal con anticipación y tenga su DNI a la mano. Buen viaje.",
    turns:[
      {prompt:"Buenos días. ¿A qué ciudad desea viajar?", model:"Buenos días. Quiero viajar a Arequipa.", alternatives:["Buenos días. Necesito un pasaje para Arequipa.","Quisiera viajar a Arequipa."], keywords:["arequipa","viaj","pasaje"], why:"Empieza indicando claramente tu destino."},
      {prompt:"¿Para qué día necesita el pasaje?", model:"Para este viernes, por favor.", alternatives:["Quisiera viajar este viernes.","Necesito el pasaje para el viernes."], keywords:["viernes"], why:"En una compra de pasaje, el día es uno de los datos esenciales."},
      {prompt:"Tenemos salidas a las ocho de la mañana y a las nueve de la noche.", model:"Prefiero la salida de las nueve de la noche.", alternatives:["Quisiera viajar a las nueve de la noche.","Me conviene más el bus de las nueve de la noche."], keywords:["nueve","noche"], why:"“Prefiero” permite elegir claramente entre dos alternativas."},
      {prompt:"Está bien. ¿Viaja solo?", model:"Sí, voy a viajar solo.", alternatives:["Sí, el pasaje es solo para mí.","Sí, viajo solo."], keywords:["solo","si"], why:"Una confirmación breve es suficiente cuando la pregunta es concreta."},
      {prompt:"¿Desea asiento en la parte delantera o en la parte posterior?", model:"Si es posible, quisiera un asiento en la parte delantera.", alternatives:["Prefiero un asiento adelante, por favor.","Quisiera sentarme en la parte delantera."], keywords:["delantera","adelante","asiento"], why:"“Si es posible” comunica una preferencia sin exigirla."},
      {prompt:"Hay un asiento disponible adelante. ¿Lleva equipaje para bodega?", model:"Sí, llevo una maleta mediana.", alternatives:["Sí, tengo una maleta para guardar en bodega.","Llevo una maleta mediana como equipaje."], keywords:["maleta","equipaje","bodega"], why:"Indica el tipo o tamaño de equipaje para recibir la información correcta."},
      {prompt:"La maleta está incluida. El equipaje de mano puede ir con usted.", model:"Perfecto. También llevo una mochila pequeña.", alternatives:["Entiendo. Mi equipaje de mano será una mochila.","Perfecto, entonces llevaré mi mochila conmigo."], keywords:["mochila","mano","perfecto"], why:"Agregar el dato de tu mochila confirma cómo organizarás el equipaje."},
      {prompt:"Necesito su nombre completo y DNI para emitir el pasaje.", model:"Claro. Mi nombre es Luis Pérez y mi DNI es 12345678.", alternatives:["De acuerdo. Soy Luis Pérez, DNI 12345678.","Claro, le doy mis datos: Luis Pérez, DNI 12345678."], keywords:["luis","perez","dni","12345678"], why:"En un trámite de viaje, entrega los datos solicitados de forma ordenada."},
      {prompt:"Gracias. El total es ciento veinte soles. ¿Desea pagar ahora?", model:"Sí, voy a pagar ahora con tarjeta.", alternatives:["Sí, pagaré con tarjeta.","Sí, por favor. Haré el pago ahora."], keywords:["si","pagar","tarjeta","ahora"], why:"Confirma tanto el momento del pago como el medio que usarás."},
      {prompt:"Pago aprobado. El embarque empieza treinta minutos antes de la salida.", model:"Entendido. Entonces debo estar en el terminal antes de las ocho y media.", alternatives:["De acuerdo. Llegaré al terminal con suficiente anticipación.","Entiendo. Estaré allí por lo menos treinta minutos antes."], keywords:["terminal","antes","ocho","treinta"], why:"Calcular y repetir la hora de llegada demuestra que entendiste la indicación."}
    ]
  }
];

const state = {
  level:1, scenario:null, turn:0, score:0, possible:0, wildcardUsed:0,
  startedAt:0, sending:false, runToken:0, progress:loadProgress()
};

function loadProgress(){
  try{
    const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
    return {
      completed:Array.isArray(v.completed)?v.completed:[],
      best:v.best&&typeof v.best==="object"?v.best:{},
      lastLevel:Number(v.lastLevel)||1
    };
  }catch(_){return {completed:[],best:{},lastLevel:1}}
}
function saveProgress(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state.progress))}catch(_){}
}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function normalize(s){
  return String(s||"").trim().toLocaleLowerCase("es-PE")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[¿?¡!.,;:()"']/g," ").replace(/\s+/g," ").trim();
}
function levenshtein(a,b){
  a=normalize(a); b=normalize(b);
  if(!a.length)return b.length;if(!b.length)return a.length;
  const prev=Array.from({length:b.length+1},(_,i)=>i),cur=new Array(b.length+1);
  for(let i=1;i<=a.length;i++){
    cur[0]=i;
    for(let j=1;j<=b.length;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
    for(let j=0;j<=b.length;j++)prev[j]=cur[j];
  }
  return prev[b.length];
}
function similarity(a,b){
  const aa=normalize(a),bb=normalize(b),m=Math.max(aa.length,bb.length);
  return m?1-levenshtein(aa,bb)/m:1;
}
function words(s){return normalize(s).split(" ").filter(Boolean)}
function currentTurn(){return state.scenario?.turns[state.turn]||null}
function nowTime(){
  const d=new Date(); return d.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit",hour12:false});
}
function stripAccents(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function escapeHTML(s){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function sentenceCase(s){
  s=String(s||"").trim().replace(/\s+/g," ").replace(/\s+([,.!?;:])/g,"$1");
  return s?s.charAt(0).toLocaleUpperCase("es-PE")+s.slice(1):s;
}
function accentsFromModel(user,model){
  const map=new Map();
  (String(model).match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g)||[]).forEach(w=>{
    const key=stripAccents(w).toLocaleLowerCase("es-PE");
    if(w!==stripAccents(w)) map.set(key,w.toLocaleLowerCase("es-PE"));
  });
  return String(user).replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g,w=>{
    const key=stripAccents(w).toLocaleLowerCase("es-PE");
    if(!map.has(key))return w;
    const repl=map.get(key);
    return /^[A-ZÁÉÍÓÚÜÑ]/.test(w)?repl.charAt(0).toLocaleUpperCase("es-PE")+repl.slice(1):repl;
  });
}
function mechanicalCorrection(user,model){
  let s=sentenceCase(accentsFromModel(user,model));
  if(!s)return s;
  const modelTrim=String(model).trim();
  const isQuestion=modelTrim.startsWith("¿")||modelTrim.endsWith("?");
  const isExclamation=modelTrim.startsWith("¡")||modelTrim.endsWith("!");
  if(isQuestion){
    if(!s.startsWith("¿"))s="¿"+s.replace(/^\?/,"");
    if(!s.endsWith("?"))s=s.replace(/[.!]+$/,"")+"?";
  }else if(isExclamation){
    if(!s.startsWith("¡"))s="¡"+s.replace(/^!/,"");
    if(!s.endsWith("!"))s=s.replace(/[.?]+$/,"")+"!";
  }else if(!/[.!?]$/.test(s)){
    s+=".";
  }
  return s;
}
function evaluate(user,turn,usedWildcard=false){
  const variants=[turn.model,...(turn.alternatives||[])];
  let sim=0;
  variants.forEach(v=>sim=Math.max(sim,similarity(user,v)));
  const n=normalize(user);
  const keys=(turn.keywords||[]).map(normalize);
  const matches=keys.filter(k=>k&&n.includes(k)).length;
  const keyRatio=keys.length?matches/Math.min(keys.length,3):0;
  let grade="improve";
  if(sim>=.88)grade="excellent";
  else if(sim>=.61||keyRatio>=.67)grade="good";
  const corrected=mechanicalCorrection(user,turn.model);
  const mechanicalChanged=normalize(corrected)===normalize(user) && corrected.trim()!==String(user).trim();
  const points=usedWildcard?1:(grade==="excellent"?2:grade==="good"?2:1);
  return {grade,sim,keyRatio,corrected,mechanicalChanged,points};
}
function shuffle(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}

function renderHome(){
  state.level=clamp(state.progress.lastLevel||1,1,5);
  $("levelGrid").innerHTML=levels.map(l=>`
    <button class="level-card ${l.id===state.level?"active":""}" data-level="${l.id}" type="button">
      <span class="level-no">Nivel ${l.id}</span><span class="level-icon">${l.icon}</span>
      <strong>${l.name}</strong><small>${l.desc}</small>
    </button>`).join("");
  $("levelGrid").querySelectorAll(".level-card").forEach(b=>b.addEventListener("click",()=>{
    state.level=Number(b.dataset.level);state.progress.lastLevel=state.level;saveProgress();
    renderHome();
    setTimeout(()=>$("scenarioSection").scrollIntoView({behavior:"smooth",block:"start"}),50);
  }));
  renderScenarios();
  $("homeProgress").textContent=`${state.progress.completed.length} completadas`;
}
function renderScenarios(){
  const level=levels.find(l=>l.id===state.level);
  $("scenarioTitle").textContent=level.name;
  $("levelBadge").textContent="Nivel "+state.level;
  const list=scenarios.filter(s=>s.level===state.level);
  $("scenarioGrid").innerHTML=list.map(s=>{
    const done=state.progress.completed.includes(s.id);
    const best=state.progress.best[s.id];
    return `<button class="scenario-card" type="button" data-id="${s.id}">
      <span class="sc-avatar">${s.avatar}</span>
      <span class="sc-main"><strong>${escapeHTML(s.name)}</strong><span>${escapeHTML(s.situation)}</span>
        <span class="sc-meta"><i>${escapeHTML(s.place)}</i><i>${escapeHTML(s.duration)}</i>${done?`<i class="sc-done">✓ ${best||0}%</i>`:""}</span>
      </span>
    </button>`;
  }).join("");
  $("scenarioGrid").querySelectorAll(".scenario-card").forEach(b=>b.addEventListener("click",()=>startScenario(b.dataset.id)));
}

function startScenario(id){
  const sc=scenarios.find(s=>s.id===id); if(!sc)return;
  state.runToken++;
  const token=state.runToken;
  state.scenario=sc;state.turn=0;state.score=0;state.possible=0;state.wildcardUsed=0;state.startedAt=Date.now();state.sending=false;
  $("screenHome").classList.add("hidden");$("screenChat").classList.remove("hidden");
  $("contactAvatar").textContent=sc.avatar;$("contactName").textContent=sc.name;
  $("contactStatus").textContent="Tutor inteligente · práctica simulada";
  $("lessonSituation").textContent=sc.place+" · "+sc.situation;
  $("messages").innerHTML='<div class="day-chip">Hoy · práctica de escritura</div>';
  closeWildcard();updateChatHud();setInputEnabled(false);
  showTypingThen(()=>{addMessage("them",sc.turns[0].prompt);setInputEnabled(true);$("messageInput").focus();},520,token);
}
function addMessage(side,text){
  const row=document.createElement("div");row.className="msg-row "+side;
  row.innerHTML=`<div class="msg-bubble">${escapeHTML(text)}<span class="msg-time">${nowTime()}${side==="me"?'<span class="msg-check">✓✓</span>':""}</span></div>`;
  $("messages").appendChild(row);scrollBottom();
}
function addCorrection(result,turn,usedWildcard){
  const note=document.createElement("div");
  note.className="ai-note "+(result.grade==="improve"?"improve":"good");
  let title="",modelLine="",why="";
  if(usedWildcard){
    title="🃏 Respuesta con comodín";
    modelLine=`Buena forma: “${turn.model}”`;
    why=turn.why;
  }else if(result.grade==="excellent"){
    title="✨ Muy bien escrito";
    if(result.corrected.trim()!==$("messageInput").dataset.lastSent?.trim())modelLine=`Con puntuación: “${result.corrected}”`;
    else modelLine="Tu mensaje es claro y natural.";
    why=turn.why;
  }else if(result.grade==="good"){
    title="✨ Tu idea se entiende bien";
    modelLine=`Una forma natural: “${turn.model}”`;
    why=turn.why;
  }else{
    title="✍️ Puedes expresarlo más claro";
    modelLine=`Prueba así: “${turn.model}”`;
    why=turn.why;
  }
  note.innerHTML=`<div class="ai-note-head">${title}</div><div class="ai-note-model">${escapeHTML(modelLine)}</div><div class="ai-note-why">${escapeHTML(why)}</div>`;
  $("messages").appendChild(note);scrollBottom();
}
function showTypingThen(fn,delay=650,token=state.runToken){
  const row=document.createElement("div");row.className="msg-row them";row.dataset.typing="1";
  row.innerHTML='<div class="typing-msg"><i></i><i></i><i></i></div>';
  $("messages").appendChild(row);scrollBottom();
  setTimeout(()=>{
    row.remove();
    if(token!==state.runToken)return;
    fn&&fn();
  },delay);
}
function scrollBottom(){requestAnimationFrame(()=>$("messages").scrollTo({top:$("messages").scrollHeight,behavior:"smooth"}))}
function updateChatHud(){
  const total=state.scenario?.turns.length||1;
  $("turnCounter").textContent=`${Math.min(state.turn+1,total)}/${total}`;
  $("lessonProgress").style.width=`${state.turn/total*100}%`;
  $("lessonScore").textContent=`✍️ ${state.score}`;
  const t=currentTurn();
  $("smartTipText").textContent=t?(t.why||"Escribe como tú responderías."):"Conversación completada.";
}
function autoGrow(){
  const el=$("messageInput");el.style.height="auto";el.style.height=Math.min(el.scrollHeight,118)+"px";
}
function setInputEnabled(enabled){
  $("messageInput").disabled=!enabled;$("btnSend").disabled=!enabled;state.sending=!enabled;
}
function sendMessage(text,usedWildcard=false){
  const turn=currentTurn();
  const token=state.runToken;
  text=String(text||"").trim();
  if(!turn||!text||state.sending)return;
  closeWildcard();
  $("messageInput").dataset.lastSent=text;
  addMessage("me",text);
  $("messageInput").value="";autoGrow();setInputEnabled(false);
  const result=evaluate(text,turn,usedWildcard);
  state.score+=result.points;state.possible+=2;if(usedWildcard)state.wildcardUsed++;
  setTimeout(()=>{if(token===state.runToken)addCorrection(result,turn,usedWildcard)},220);
  state.turn++;updateChatHud();
  setTimeout(()=>{
    if(token!==state.runToken||!state.scenario)return;
    if(state.turn>=state.scenario.turns.length){
      showTypingThen(()=>{
        addMessage("them",state.scenario.closing);
        $("lessonProgress").style.width="100%";
        setTimeout(()=>{if(token===state.runToken)finishScenario()},850);
      },500,token);
    }else{
      showTypingThen(()=>{addMessage("them",currentTurn().prompt);setInputEnabled(true);updateChatHud();$("messageInput").focus()},620,token);
    }
  },760);
}
function openWildcard(){
  const turn=currentTurn();if(!turn||state.sending)return;
  const opts=shuffle([turn.model,...(turn.alternatives||[])]).slice(0,3);
  $("wildcardOptions").innerHTML=opts.map(o=>`<button class="wildcard-option" type="button">${escapeHTML(o)}</button>`).join("");
  $("wildcardOptions").querySelectorAll("button").forEach((b,i)=>b.addEventListener("click",()=>sendMessage(opts[i],true)));
  $("wildcardPanel").classList.remove("hidden");
}
function closeWildcard(){$("wildcardPanel").classList.add("hidden")}
function finishScenario(){
  setInputEnabled(false);
  const percent=Math.round(state.score/Math.max(1,state.possible)*100);
  if(!state.progress.completed.includes(state.scenario.id))state.progress.completed.push(state.scenario.id);
  state.progress.best[state.scenario.id]=Math.max(Number(state.progress.best[state.scenario.id])||0,percent);
  saveProgress();
  const mins=Math.max(1,Math.round((Date.now()-state.startedAt)/60000));
  showModal("🏆","Conversación completada",`
    <div class="result-score">${percent}%</div>
    <p>Terminaste una conversación completa de <strong>${escapeHTML(state.scenario.situation)}</strong>.</p>
    <div class="result-grid">
      <div class="result-box"><strong>${state.scenario.turns.length}</strong><span>mensajes tuyos</span></div>
      <div class="result-box"><strong>${state.wildcardUsed}</strong><span>comodines</span></div>
      <div class="result-box"><strong>${mins} min</strong><span>práctica</span></div>
    </div>
    <p><strong>Objetivo:</strong> ${escapeHTML(state.scenario.goal)}</p>
  `,[
    {label:"Otra conversación",cls:"modal-primary",action:()=>backHome(true)},
    {label:"Repetir",cls:"modal-secondary",action:()=>startScenario(state.scenario.id)}
  ]);
}
function backHome(close=true){
  state.runToken++;
  if(close)hideModal();
  closeWildcard();state.scenario=null;
  $("screenChat").classList.add("hidden");$("screenHome").classList.remove("hidden");
  setInputEnabled(true);renderHome();
}
function showHelp(){
  showModal("💬","Cómo se juega",`
    <p><strong>Chat en Español</strong> es una práctica visual de conversación para aprender a escribir mejor en español del Perú.</p>
    <p>La persona del chat es una <strong>simulación educativa</strong>. Puedes escribir con tus propias palabras: no necesitas copiar una frase exacta.</p>
    <p>Después de enviar, el tutor revisa claridad, palabras importantes, acentos y puntuación. Si tu idea es válida, la reconoce; si puede mejorar, te muestra una forma más natural.</p>
    <p>🃏 <strong>Comodín:</strong> abre tres respuestas posibles cuando no sabes qué escribir. Todas están redactadas para que puedas aprender de ellas.</p>
    <p>La información importante siempre aparece por escrito y no necesitas escuchar audio para jugar.</p>
  `,[{label:"Entendido",cls:"modal-primary",action:hideModal}]);
}
function showScenarioInfo(){
  if(!state.scenario)return;
  showModal(state.scenario.avatar,state.scenario.name,`
    <p><strong>Situación:</strong> ${escapeHTML(state.scenario.situation)}</p>
    <p><strong>Nivel:</strong> ${state.scenario.level} · ${escapeHTML(levels.find(l=>l.id===state.scenario.level).name)}</p>
    <p><strong>Objetivo:</strong> ${escapeHTML(state.scenario.goal)}</p>
    <p><strong>Duración aproximada:</strong> ${escapeHTML(state.scenario.duration)}</p>
    <p>Esta es una simulación educativa; no estás enviando mensajes a una persona real.</p>
  `,[
    {label:"Seguir conversando",cls:"modal-primary",action:hideModal},
    {label:"Salir de la conversación",cls:"modal-secondary",action:()=>backHome(true)}
  ]);
}
function showModal(icon,title,html,actions=[]){
  $("modalIcon").textContent=icon;$("modalTitle").textContent=title;$("modalBody").innerHTML=html;
  $("modalActions").innerHTML="";
  actions.forEach(a=>{const b=document.createElement("button");b.type="button";b.textContent=a.label;b.className=a.cls||"modal-primary";b.addEventListener("click",a.action);$("modalActions").appendChild(b)});
  $("modal").classList.remove("hidden");
}
function hideModal(){$("modal").classList.add("hidden")}
function toast(msg){
  $("toast").textContent=msg;$("toast").classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(()=>$("toast").classList.remove("show"),1700);
}
function backToLspedia(){
  const fallback="../?vista=herramientas-jugar";
  try{
    if(document.referrer&&new URL(document.referrer).origin===location.origin&&history.length>1)history.back();
    else location.href=fallback;
  }catch(_){location.href=fallback}
}

$("btnBackLspedia").addEventListener("click",backToLspedia);
$("btnHelp").addEventListener("click",showHelp);
$("btnChatBack").addEventListener("click",()=>backHome(false));
$("btnChatMenu").addEventListener("click",showScenarioInfo);
$("btnWildcard").addEventListener("click",openWildcard);
$("btnCloseWildcard").addEventListener("click",closeWildcard);
$("btnSend").addEventListener("click",()=>sendMessage($("messageInput").value,false));
$("messageInput").addEventListener("input",autoGrow);
$("messageInput").addEventListener("keydown",e=>{
  if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage($("messageInput").value,false)}
});
$("modalClose").addEventListener("click",hideModal);
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))hideModal()});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&state.scenario)setTimeout(scrollBottom,80)});
window.addEventListener("pageshow",()=>{if(state.scenario)setTimeout(scrollBottom,80)});

renderHome();
})();