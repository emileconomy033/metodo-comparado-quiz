# ¿Realmente sabemos comparar? — Método comparado, Grupo 1

Cuestionario interactivo de cuatro preguntas para las nuevas salas del Taller de Métodos y Técnicas de Investigación I (ICAP). Las salas históricas de seis preguntas conservan su estructura original.

## Qué ofrece
- Entrada por QR o enlace público; los participantes indican nombre o seudónimo y país opcional.
- Dos modalidades: encuesta libre y competencia guiada (40 segundos por pregunta).
- Salas independientes de **ensayo** y **clase oficial**.
- Panel del moderador con votos en tiempo real, porcentajes por alternativa, aciertos, desglose por pregunta y exportación CSV.
- Una respuesta por pregunta y sesión de autenticación anónima. Esto **no impide** que alguien participe de nuevo desde otro navegador/dispositivo.

## Puesta en marcha
1. Firebase: proyecto `encuesta-5cd5f`. Habilitar Authentication → Anonymous y Firestore.
2. Publicar el contenido de `firestore.rules` en Firestore → Rules. Las reglas son específicas para **seis** preguntas y las salas `practice/official`.
3. GitHub: Settings → Pages → Build and deployment → **Deploy from a branch**, rama `main`, carpeta `/(root)`, Save.
4. Abrir la URL de GitHub Pages cuando GitHub indique que la página está publicada.
5. Crear una **sesión de ensayo**, copiar el enlace o QR, ingresar desde otro navegador (o móvil) y comprobar que el panel recibe respuestas; cerrar y exportar CSV.
6. Crear otra sala `official` para la clase definitiva. No reutilizar el QR del ensayo.

**Importante:** la aplicación no ha superado todavía una prueba de extremo a extremo con dispositivos reales ni la validación de reglas en un emulador Firestore. La propiedad de la sala está ligada al identificador anónimo de Firebase del navegador que la creó; no borres los datos de ese navegador durante la actividad.

## Archivos
- `index.html`: interfaz y cuestionario de seis preguntas.
- `firebase-config.js`: configuración pública del cliente Firebase (no contiene secretos administrativos).
- `firestore.rules`: permisos de salas, participantes y votos.

## Seguridad y privacidad
Los nombres y países declarados son datos introducidos voluntariamente. Evita solicitar información sensible y utiliza nombres de prueba durante los ensayos. El panel no dispone de autenticación administrativa permanente: el moderador es la sesión anónima que creó cada sala. No publiques reglas Firestore permisivas del tipo `allow read, write: if true`.

## Panel docente y uso de resultados (versión 4)
- El moderador puede entrar en **Modo proyección**, navegar por las seis preguntas y mostrar una síntesis final.
- Durante la votación, la proyección oculta la clave y el análisis de errores. En encuesta libre se revelan al cerrar; en competencia, después de revelar cada pregunta.
- Cada distractor elegido se explica conceptualmente, no solo en relación con el ejemplo. La síntesis final utiliza las tasas de acierto y la distribución de respuestas reales. **No infiere automáticamente dominio individual**.
- Participantes: pantalla de finalización individual, posibilidad de revisar las respuestas registradas y retorno al resultado personal después del cierre. El panel grupal se visualiza en la pantalla del moderador.
- Recuperación: volver al enlace de la misma sala con el **mismo navegador, perfil y almacenamiento de Firebase** permite recuperar el rol propio. No existe recuperación segura desde otro dispositivo con autenticación anónima; no borres cookies ni datos del sitio durante la actividad.

## Actualización de reglas obligatoria
La versión 4 **requiere publicar nuevamente** el archivo `firestore.rules` en Firebase Console → Firestore Database → Rules. Esta versión restringe la lista de inscritos y la lectura de votos individuales: solo el moderador ve todas las identidades y respuestas; cada participante ve su propio registro y votos. **Subir el archivo a GitHub no despliega automáticamente las reglas a Firebase**.

## Validación
Se comprobaron estáticamente los seis ítems y la sintaxis del JavaScript. No se han ejecutado pruebas automáticas de integración contra Firestore real; se debe crear una sala de ensayo, ingresar desde otro dispositivo, completar la votación, recuperar la sesión y comprobar el CSV y la proyección. El plan gratuito de Firebase tiene cuotas; evita organizar múltiples sesiones simultáneas de gran volumen sin comprobarlas.

## Configuración del moderador y tiempos (versión 5)
- Cada pregunta de la modalidad **Competencia** admite un tiempo propio de **10 a 180 segundos** (valor predeterminado 40). El moderador lo configura antes de crear la sala. Los temporizadores se aplican también en las reglas de Firestore. Las salas antiguas, sin el campo `questionTimes`, mantienen 40 segundos.
- **Acceso del moderador**: se usa **Firebase Authentication → Email/Password** mediante una aplicación Firebase secundaria. El participante sigue utilizando la autenticación anónima normal, sin contraseña ni correo.
- **Configuración obligatoria, una sola vez**: en Firebase Console → Authentication → Sign-in method, activar **Email/Password** (sin habilitar Email link); en la pestaña **Users**, pulsar **Add user**, introducir el correo de moderador configurado en el código (`emil.economia@gmail.com`) y elegir una contraseña. La pantalla de moderador solicita solo esa contraseña, no el correo. Si se prefiere otra dirección de cuenta, actualizar `MODERATOR_EMAIL` en `index.html` y la condición de email en `firestore.rules` de forma idéntica.
- La contraseña propuesta `123Moderador` es funcional si se registra en Firebase, pero es predecible. Se recomienda establecer una contraseña única y más fuerte. **Nunca escribir la contraseña en el código del repositorio**. La identidad se verifica en el servidor de Firebase; la interfaz sola no concede permisos.
- **Es imprescindible publicar nuevamente `firestore.rules`** desde Firebase Console. A partir de estas reglas, solo la cuenta autenticada por correo/contraseña permitida puede **crear salas nuevas**. Las salas preexistentes de moderadores anónimos conservan el permiso de administración para el mismo UID original.
- El moderador recupera su rol en el mismo navegador siempre que mantenga iniciada su sesión Firebase; se mantiene el acceso a salas antiguas creadas con la identidad anónima previa. Si cambia de navegador, deberá entrar como moderador con la contraseña y conservar el enlace de la sala.
- **No compartir la contraseña con participantes.** El QR solo abre la pantalla pública para ingresar al cuestionario.

## Ajuste de respuestas y diagnóstico de inscripción (noviembre 2026)
- Mientras la encuesta permanezca abierta, cada participante puede cambiar su selección tantas veces como necesite. En competencia, los cambios están permitidos **solo en la pregunta vigente y mientras quede tiempo**; el último voto confirmado por Firestore reemplaza al anterior. No hay tres intentos: no se penaliza tocar una opción por accidente.
- Si falla el ingreso, el aviso indica la etapa (consulta de sala, consulta del registro o inscripción), para identificar el permiso involucrado sin abrir indiscriminadamente Firestore.
- **Publicar las reglas actualizadas en Firebase Console es obligatorio** para permitir la actualización de votos. El archivo en GitHub es solo la versión de referencia.
- Se retiró el aviso informativo largo del pie de página a solicitud del moderador. Los controles de privacidad (reglas de Firebase, ausencia de listados individuales para participantes) siguen activos.

## Identidad visual y retroalimentación por pregunta
- Encabezado académico con logo del ICAP, adaptable a móvil. La imagen se carga desde una URL externa de recursos de identidad institucional; si esa fuente dejara de funcionar, debe sustituirse por un archivo local.
- En competencia, al pulsar **Revelar respuesta**, cada participante recibe retroalimentación individual: **acierto** con confeti verde y destello breve; **respuesta incorrecta** con un mensaje ámbar discreto y explicación conceptual; **sin respuesta** con mensaje neutral. Siempre se presenta la opción correcta.
- El contador **Aciertos: X/6** muestra solo las preguntas que ya se hayan revelado. Antes del cierre de encuesta libre no se muestra puntuación.
- La celebración respeta `prefers-reduced-motion` y no se repite por cada actualización de Firestore durante la misma sesión/pregunta.
- La proyección del moderador mantiene los resultados agregados y las explicaciones, sin efectos personales.
- No se modifican preguntas, claves ni reglas de Firestore en esta actualización.

## Versión 6 — secuencia de revelación y auditoría de sesgos

**Solo las salas nuevas** usan `quizVersion: 2`. Las salas históricas sin este campo siguen utilizando exactamente la clave y el orden previos para no reinterpretar votos almacenados.

### Auditoría de opciones
- Antes, las claves estaban en **B,C,B,B,C,D**: ninguna respuesta A; y la correcta destacaba por longitud en cinco de seis preguntas.
- Ahora las claves de nuevas sesiones están distribuidas **A,C,D,B,A,D** (A=2, B=1, C=1, D=2), manteniendo una única opción defendible por pregunta.
- Se abreviaron y equilibraron las alternativas. Los tests verifican seis preguntas, cuatro opciones y diferencias de longitud no mayores de 24 caracteres dentro de una misma pregunta.
- Es una auditoría **editorial y estructural**, no una validación psicométrica. Las preguntas deben seguir revisándose presencialmente para detectar pistas semánticas, negaciones extremas y ambigüedades.

### Tres etapas del moderador en modo competencia
1. **Mostrar distribución**: se cierran los votos y se presentan cantidades y porcentajes sin revelar qué respuesta es correcta.
2. **Revelar respuesta**: clave, celebración individual y contador de aciertos.
3. **Explicar el concepto**: explicación pedagógica antes de permitir avanzar.

El gráfico no muestra la proporción de aciertos antes de revelar la solución. Las reglas de Firestore bloquean modificaciones desde la primera etapa.

### Práctica, informes y recuperación
- **Ensayar con datos ficticios** desde «Nueva sesión», sin crear sala ni guardar respuestas en Firebase. No puede exportarse CSV de simulación. La pantalla marca expresamente el ensayo.
- **Informe PDF** abre un documento en una pestaña aparte; usar «Imprimir → Guardar como PDF». Incluye resultados de cada pregunta, distribución y lecciones; no genera un PDF en servidor.
- Firestore es el registro persistente de votos reales; el moderador también puede exportar CSV. No se implementa copia automática de datos identificativos en el dispositivo.
- El temporizador estima la diferencia horaria mediante una respuesta HTTP del sitio; **la validación decisiva del plazo es la regla de Firestore con `request.time`**. Si el sitio no ofrece fecha de respuesta, se usa el reloj local como aproximación.

### Despliegue obligatorio
**Volver a publicar el archivo `firestore.rules` en Firebase Console.** Las nuevas salas tienen los campos `quizVersion` y `revealStage`. El repositorio y GitHub Pages no aplican automáticamente los cambios en permisos.

### Prueba pendiente
Realizar un ensayo completo con computadora y al menos dos celulares (preferiblemente varias conexiones), incluir votos corregidos, límite de tiempo, los tres momentos, salida y recuperación del moderador, proyección e informe PDF. Las comprobaciones sintácticas no sustituyen una prueba integral con Firebase real.

### Minicomprobación de transferencia
En nuevas salas de competencia, después de **Explicar el concepto**, cada participante recibe una pregunta opcional sobre otro caso con tres opciones y retroalimentación. Las seis minicomprobaciones se resuelven **solo en el navegador**; no forman parte de la puntuación `X/6` ni alteran las preguntas de la clase.

### Informe visual
El informe imprimible incluye barras horizontales por opción, porcentajes y una breve interpretación de cada pregunta. El usuario puede elegir «Guardar como PDF» en el cuadro de impresión del navegador. No se envían los datos a un servicio externo de PDF.

## Corrección de navegación (18 noviembre 2026)
- En competencia versión 2, el botón **Siguiente pregunta** se habilita en cuanto el moderador termina la segunda etapa (**Revelar respuesta**). **Ampliar explicación** es ahora una etapa opcional, no un requisito para avanzar.
- En la última pregunta, se indica que debe elegirse **Cerrar y mostrar resultados**; el botón «Siguiente pregunta» deja de mostrarse para evitar confusiones.
- En el panel del moderador están disponibles **Volver al inicio** y **Crear otra dinámica**, incluso al completar una actividad.
- Después del cierre se presenta una sección de acciones rápidas: **Nuevo ensayo**, **Nueva sesión oficial** y **Volver al inicio**.
- Volver al inicio cancela las suscripciones en tiempo real de la pantalla, limpia el código de sala de la URL y deja intactos los votos persistidos en Firebase. Si la sesión aún está abierta, solicita confirmación porque salir del panel **no cierra la sala**.
- Se conserva la posibilidad de volver a abrir una sesión anterior desde la lista local del navegador, siempre que la identidad de Firebase siga siendo válida.
- Esta corrección no modifica las reglas de Firestore ni el contenido de las preguntas.

## Versión 7 — cuatro preguntas, dos expositores y una sala oficial reutilizable

### Cuestionario vigente
- Las salas **nuevas** usan `quizVersion: 3` y solo contienen las preguntas **1–4**. Las preguntas 5 y 6 se excluyeron del cuestionario vigente. Se mantienen en el código únicamente para interpretar **salas históricas** de versiones 1 y 2.
- La clave del cuestionario vigente se distribuye **A, B, C, D**, sin repetición de posición. Las alternativas también se revisaron por longitud; esta inspección no sustituye una validación pedagógica real.
- En competencia, solo se configuran cuatro tiempos; el marcador individual será `Aciertos: X/4`.

### Dos vistas de resultados
- **Guion privado del expositor**: alternativas incorrectas ordenadas de la más votada a la menos votada, con recuentos, porcentaje, explicación breve por error, respuesta correcta justificada y una orientación para trasladar el concepto.
- **Previsualizar vista del público**: reduce el texto a gráficos, porcentaje de aciertos, respuesta correcta y conclusión metodológica. La pantalla pública no debe mostrar nombres individuales.
- **Abrir pantalla pública aparte** abre otra pestaña/ventana en modo proyección; el expositor puede mantener su guion privado en la ventana original y colocar la vista pública en una segunda pantalla. La ventana pública sigue la pregunta activa del moderador.
- Si todos contestan correctamente, el guion se centra en el principio que justifica la respuesta y su aplicación a otro ejemplo.

### Segundo expositor con Firebase Authentication
1. En **Firebase → Authentication → Users**, el administrador crea la cuenta del segundo expositor con su **propio correo y contraseña**; conserva activo Email/Password.
2. El **propietario** abre la sala y escribe ese correo en «Segundo expositor autorizado → Autorizar expositor». La invitación se guarda bajo `rooms/{codigo}/access/presenter`.
3. Comparte el **código de sala** con el colega (no la contraseña). El colega entra a «Soy moderador: crear sesión», usa su propio correo y contraseña y elige «Abrir panel de exposición».
4. Ambos pueden ver el panel, navegar y revelar la exposición. **Solo el propietario puede borrar registros o gestionar la invitación**. El propietario puede revocar el acceso.
5. El sistema no envía correos de invitación automáticamente. Si tu colega aún no tiene cuenta creada, no podrá autenticarse. Eviten manipular simultáneamente el mismo control de avance.

### Única sala oficial para pruebas y clase definitiva
1. Crear **Clase oficial (reutilizable)**, ahora predeterminada. Compartir el QR solo con participantes de prueba.
2. Ejecutar la actividad real de prueba, y después **Cerrar y mostrar resultados**.
3. En el panel final, el **propietario** selecciona «Borrar datos de prueba y reutilizar esta sala oficial».
4. Confirmar escribiendo `BORRAR` y aceptando la confirmación. Se eliminan **todos los participantes y votos de esa sala**, de forma irreversible; se conserva su identificador, QR, contenido, tiempos e invitación del segundo expositor.
5. La sala vuelve a **En espera** y el mismo QR sirve para la clase definitiva. Los participantes deben registrarse nuevamente.
6. **Ojo:** esta limpieza no borra otras salas históricas ni elimina datos ya descargados por CSV o PDF. Si necesitas conservar resultados, expórtalos **antes** del borrado. No borres durante la votación; la limpieza solo está disponible cuando la sala está finalizada.

### Configuración indispensable
Subir `firestore.rules` a GitHub **no publica esas reglas** en Firebase. Antes de probar esta versión, copiar el archivo completo en **Firebase Console → Firestore Database → Rules → Publish**. Las nuevas reglas admiten salas de cuatro preguntas, invitación autenticada al segundo expositor y eliminación de votos/participantes cerrados solo por el propietario.

### Estado de pruebas
La sintaxis del JavaScript y las pruebas estáticas del repositorio comprueban versiones del currículo, claves, estructura del panel y restricciones previstas. **No se ha validado el borrado, la invitación ni la seguridad con un emulador de Firestore o varios dispositivos reales.** Hacer una prueba final con ambos expositores y al menos dos celulares antes de usarlo en clase.

### Correo del segundo expositor preconfigurado
En nuevas salas **oficiales**, la aplicación intenta autorizar automáticamente `gramirezfunes@gmail.com` como segundo expositor. No se publica ni se crea ninguna contraseña: la cuenta debe crearse por separado en Firebase Authentication → Users con Email/Password. Si la invitación falla, el creador verá una advertencia y podrá reintentar con «Autorizar expositor». Las salas ya existentes no reciben esta autorización automáticamente; el propietario debe agregar ese correo desde su panel.
