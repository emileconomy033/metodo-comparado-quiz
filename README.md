# ¿Realmente sabemos comparar? — Método comparado, Grupo 1

Encuesta interactiva de seis preguntas para el Taller de Métodos y Técnicas de Investigación I (ICAP).

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
