# Auditoría holística · «¿Realmente sabemos comparar?» (ICAP, Grupo 1)

Fecha: 18-nov-2026 · Commit auditado: `79b5608` (`main`, idéntico al sitio publicado: comparación byte a byte sin CR = 0 diferencias) · Fase: diagnóstico. **No se modificó ni publicó nada. No se hizo ninguna escritura ni inicio de sesión en Firebase.**

## 0. Alcance real y qué se ejecutó

| Actividad | Estado |
|---|---|
| Lectura completa de `index.html` (1029 líneas), `firestore.rules`, `verify.mjs`, workflow, README, AUDITORIA_FUNCIONAL.md | **Ejecutado** |
| `node scripts/verify.mjs` (Node 26.12.1) | **Ejecutado → FALLA** (ver H-01) |
| Copia local de verify.mjs con 1 línea corregida | **Ejecutado → pasa** («OK: portada inicial…») |
| Historial de GitHub Actions (API pública) | **Ejecutado** → «Validar cuestionario» en rojo en `79b5608` (run 107) y en la serie 93–107 |
| Volcado de preguntas v3, posiciones y longitudes (vm) | **Ejecutado** |
| Emulador Firestore / Playwright / dispositivos reales | **NO ejecutado** (no hay `firebase-tools` ni Playwright; Java 1.8 es insuficiente para el emulador actual) |
| Reglas realmente desplegadas en `encuesta-5cd5f`, ajustes de Authentication, cuotas, App Check | **NO verificable** sin acceso a la consola |
| Comportamiento en navegador (parpadeo, QR, móviles, lectores de pantalla) | **NO ejecutado**; lo marcado como tal viene de lectura de código |

Clasificación: **[C]** comprobado (código/ejecución), **[R]** riesgo plausible derivado del código, **[H]** hipótesis pendiente de prueba.

## A. Diagnóstico ejecutivo (0–5)

| Dimensión | Nota | Justificación |
|---|---|---|
| Funcionalidad | 3.5 | Flujo completo implementado: sala única, lobby, 4 etapas, pantalla pública, reinicio, simulación local. Nada probado de punta a punta. |
| Seguridad | 2.5 | Reglas razonables (campos cerrados, `hasOnly`, plazo con `request.time`), pero sin App Check, creación ilimitada de participantes, sin `email_verified`, contraseña sugerida en README. |
| Sincronización | 3 | Listeners + `includeMetadataChanges` bien pensados; pero polling redundante, escrituras de etapa sin precondición, reload de pantalla pública. |
| Confiabilidad | 2 | El lobby puede quedar bloqueado sin salida desde la UI (H-02); CI rojo; sin presencia; sin pruebas de comportamiento. |
| Pedagogía | 3 | Contenido coherente y bien explicado, pero 3 de 4 ítems se resuelven por pista de redacción, P1/P2 redundantes y falta SSD/SDD. |
| UX/UI | 3 | Sobrio y claro; contradicciones puntuales (etapa 1 del móvil vacía), mensajes de error globales. |
| Accesibilidad | 2.5 | Hay `aria-live` y `prefers-reduced-motion`; errores como `status` (no `alert`), sin estilos de foco propios, temporizador y proyección sin revisar con herramientas. |
| Mantenibilidad | 2 | Un solo archivo con CSS en capas superpuestas, ~25 variables globales, código legado v1/v2 y modo encuesta mezclado con v3. |
| Preparación para clase real | 2 | Ver veredicto. |

## B. Registro de hallazgos

### Críticos

**H-01 · [C] · Verificación automática rota; CI en rojo.** `scripts/verify.mjs:16-17` ejecuta `runInNewContext(...;globalThis.out={...})` y devuelve `result.out`, pero `runInNewContext` devuelve el valor de la última expresión (el objeto), no el contexto → `TypeError: Cannot read properties of undefined (reading 'QUIZ')` en la línea 20. Introducido en `335ecbb`; las ejecuciones 93–107 de «Validar cuestionario» fallan (run 107 = HEAD). Con `return result;` el script pasa. *Consecuencia:* los últimos ~15 commits se publicaron sin ninguna verificación efectiva, y el equipo cree tener una red de seguridad que no existe. *Además:* ~90 % de las aserciones son `source.includes('texto')`; solo 5 son de comportamiento (reloj). No detectan nada del flujo real. *Solución:* corregir una línea + sustituir gradualmente por pruebas de comportamiento (sección F). *Validación:* CI verde y una prueba que falle al romper deliberadamente `remaining()`.

**H-02 · [C] · El lobby puede bloquearse sin salida desde la interfaz.** `index.html:420,775` exige `people.length>0 && todos ready`. No existe excepción ni expulsión. Un inscrito abandonado (cerró la pestaña, red caída, nombre de prueba) deja «Iniciar competencia» deshabilitado. Salidas: `resetOfficial` solo se muestra en `live/done` (`:416,973`), «Cerrar» está deshabilitado en `lobby` (`:420`) y las reglas solo permiten borrar participantes con `status=='done'` (`firestore.rules:88`). *Repro:* sala en lobby → un teléfono se inscribe y no pulsa «Estoy listo» → el moderador no puede iniciar ni limpiar. *Solución:* (a) botón «Iniciar con los listos» solo para propietario/expositor, con confirmación explícita («3 inscritos no confirmados quedarán fuera»); (b) permitir al propietario reiniciar/expulsar en lobby (ajustar regla de delete a `done` **o** `lobby`); (c) marcar `excluded:true` en vez de borrar. *Pruebas:* emulador (delete en lobby solo owner) + E2E con un participante fantasma.

**H-03 · [C por reglas; no explotado] · Participantes ilimitados y sin barrera.** `firestore.rules:76-80`: cualquier usuario anónimo con el código (visible en el QR proyectado) puede crear su `participants/{uid}`, también durante `live` (solo bloquea `done`). Con un script y la `apiKey` pública se crean N identidades anónimas: (i) inflan «pendientes» y bloquean el inicio (H-02), (ii) emiten N votos (un voto por uid, no por persona). *Solución:* Firebase App Check (reCAPTCHA Enterprise/v3) con *enforcement* en Firestore y Auth anónima; PIN de sala corto que cambie al reiniciar y se exija en la regla (campo `joinKey` en `participants` comparado con un documento solo legible por el participante tras validar); límite práctico: cerrar el ingreso con un botón «Cerrar inscripciones» (campo `joinOpen`) al iniciar. Cerrar inscripciones al empezar elimina también el ingreso tardío. *Pruebas:* emulador (create rechazado con `joinOpen=false`), script de abuso en entorno de prueba.

**H-04 · [C] · Contraseña sugerida en documentación pública.** README (sección «versión 5») nombra `123Moderador` como «contraseña propuesta» y aparece en 2 commits del historial público. `verify.mjs:34` solo exige que no esté en `index.html`. *Consecuencia:* si la cuenta del propietario usa esa u otra contraseña derivada, la cuenta administrativa (control total vía `moderator()`) está comprometida. *Acción inmediata:* cambiar la contraseña en Firebase Auth hoy, activar verificación en dos pasos del correo, eliminar la cadena del README (el historial permanece; asumir la contraseña como pública).

### Altos

**H-05 · [R] · Sin presencia real.** No hay `onDisconnect`, Realtime Database ni heartbeat (búsqueda: 0 coincidencias). «Inscrito» y «Listo» son registros persistentes; no indican conexión. El panel (`renderAttendance`, `:391-407`) muestra «Sincronización en tiempo real activa» para el listener, no para los teléfonos. *Solución recomendada:* heartbeat `lastSeen` cada 20–30 s solo durante `lobby` en el documento del participante (regla restringida a ese campo) **o** RTDB `.info/connected` + `onDisconnect`. Para el volumen (decenas) el heartbeat en Firestore es más simple y no añade servicio. Mostrar tres estados: inscrito/listo/visto hace <60 s. Nunca bloquear el inicio por presencia, solo informar.

**H-06 · [R] · Lecturas excesivas por polling duplicado.** `subscribe()` (`:674`) hace cada 12 s `participants.get({source:'server'})` (`:380`) **además** del listener en vivo, en *cada* ventana de anfitrión; la pantalla pública y el segundo expositor son también clientes anfitrión (leen participantes y votos con nombres). Estimación: 60 participantes × 5 lecturas/min × 3 ventanas = 900 lecturas/min ≈ 81 000 en 90 min, por encima de la cuota diaria gratuita de 50 000 (Spark) — [H] porque no conozco el plan ni el uso. *Solución:* eliminar el polling (usar solo el listener y mostrar `metadata.fromCache/hasPendingWrites`); la pantalla pública debería leer solo un documento agregado (`rooms/{id}/public/state` con contadores) en lugar de nombres y votos.

**H-07 · [R] · Transiciones de etapa sin precondición.** `reveal` calcula `stage+1` con el estado local (`:792`) y `next` calcula `idx+1` (`:783`); las reglas (`:57-69`) solo validan rangos: el segundo expositor puede saltar `idx` de 0 a 3, poner `revealStage:3` en la etapa 0 o dejar `reveal` y `revealStage` incoherentes; una ventana desactualizada puede *retroceder* la etapa (p. ej. pulsar «Revelar» con `stage=0` local cuando el servidor ya está en 2 reescribe 1 y vuelve a ocultar la clave). Los participantes sí están bien protegidos (no pueden avanzar). *Solución:* transacción de cliente con comprobación del estado esperado + regla que exija transición exacta: `idx` igual o +1; `revealStage` solo +1 con `idx` constante; al cambiar `idx` exigir `revealStage==0 && reveal==false && openedAt==request.time`; `reveal == (revealStage>=2)`; `openedAt` solo `request.time`. *Pruebas:* emulador (≥10 casos de salto/retroceso) + E2E de dos expositores pulsando a la vez.

**H-08 · [R] · Pantalla pública tras recargar durante una pregunta.** `openAudienceWindow` añade `intro=1` a la URL (`:907`) y `publicIntroUntilWelcome` solo se apaga cuando se observa `publicView!=='questions'` (`:835`). Al pulsar F5 en la ventana pública con la sala en `live` y `publicView:'questions'`, reaparece la portada QR hasta que un expositor use «Mostrar portada» y luego «Mostrar pregunta» (sin indicación en pantalla). La intención (no revelar nada al abrir) es correcta, pero el efecto sorpresa en directo es real. *Solución:* quitar `intro` de la URL con `history.replaceState` tras la primera carga, o guardarlo en `sessionStorage`; mostrar en el panel privado «Pública: portada / preguntas» como indicador permanente.

**H-09 · [R] · Reinicio seguro pero no a prueba de fallos ni visible para otros.** Puntos fuertes: doble confirmación (`prompt`+`confirm`), borrado por lotes de 180 con lectura al servidor, verificación posterior y «Sala lista» condicionada a listeners cargados (`:412-413`). Debilidades: (1) solo se ofrece en `live/done`; (2) 3 fases no atómicas, sin marcador `resetting` en Firestore: otras ventanas, el segundo expositor y los celulares no saben que hay limpieza; (3) durante el estado `done` intermedio la ventana pública muestra «Resultados finales» del ensayo (`publicView` sigue en `questions` hasta el último update); (4) bloqueo `cleanupInProgress` solo local; (5) [H] cada borrado evalúa `get()` en reglas (`owner()`+`parent()`); verificar el límite de accesos por lote (20) en el emulador con 180 documentos. Lo positivo: una segunda ventana tardía fallará con `permission-denied` en cuanto la sala pase a `lobby` (regla de delete), lo que evita borrar participantes nuevos. *Solución:* campo `maintenance:true` (solo propietario) que bloquea altas/votos en reglas y pone la pública en «Preparando la sala»; `publicView:'welcome'` antes de cualquier borrado; reintento idempotente.

**H-10 · [R] · Directorio de sala sin protección ante duplicados.** Reglas (`:38-45`) permiten al propietario reapuntar `roomDirectory/current` a cualquier otra sala suya, y `rooms create` no limita cuántas salas crea. El flujo cliente es correcto (directorio manda, `:593-602`) pero la creación no es transaccional: dos dispositivos que lean «no existe» crean dos salas; gana el último `set` y los inscritos en la primera quedan huérfanos (el listener `:676-684` los avisa). *Solución:* ID determinista (p. ej. `rooms/{id}` generado una vez y exigir en regla `!exists(roomDirectory/current)` para *create*, y `roomId` inmutable en *update*), o transacción de lectura-escritura.

**H-11 · [C] · Etapa 1 del teléfono contradictoria.** `:457-462`: título «Distribución de respuestas», texto «Observa cómo votó el grupo» pero `revealChart` queda vacío (las reglas impiden leer votos ajenos). El participante ve una promesa sin contenido. *Solución:* publicar un agregado (`rooms/{id}/stats/{qid}` escrito por el moderador al pasar a etapa 1) legible por participantes, o cambiar el texto («Mira la pantalla compartida»).

### Medios

**H-12 [R] Identidad.** `moderator()` y `coPresenter()` comparan `token.email` sin `email_verified`; si el registro por contraseña está abierto en Authentication y el segundo expositor aún no tiene cuenta, otra persona podría registrarse primero con ese correo. Los correos del propietario y del segundo expositor (`gramirezfunes@gmail.com`) están en el HTML y el correo del propietario en las reglas, públicos en GitHub (dato personal de un tercero). *Solución:* desactivar el auto-registro, exigir `email_verified==true`, mover el correo del propietario a un documento (`config/owner`) o custom claim, no prellenar el campo de correo.

**H-13 [C] Clave en el cliente.** `correct` de las 4 preguntas está en el JS que descarga cada participante (`:96-101`). Cualquiera la lee antes de la revelación. Aceptable en evaluación formativa sin nota; si se usa ranking/competencia real, mover la clave a un documento solo legible tras la etapa 2.

**H-14 [R] Fuera de línea.** `await voteRef(i).set(...)` (`:750`) y la actualización de `ready` (`:441`) no tienen tiempo límite; sin red quedan «Enviando…» con botones deshabilitados (`:426`) hasta que vuelva la conexión, y el servidor puede rechazar después del plazo. No hay persistencia habilitada (correcto) pero tampoco *timeout* ni reintento explícito. *Solución:* `Promise.race` con 8–10 s y mensaje «No confirmado; reintenta», y estado visual «guardado/no guardado».

**H-15 [C] Versión y QR.** El enlace/QR incluye `v=RELEASE_ID` (`:171,198`): cada despliegue cambia el contenido del QR, aunque el requisito es un QR permanente; el QR ya impreso sigue funcionando pero el que se proyecta deja de coincidir. GitHub Pages sirve `Cache-Control: max-age=600`: un teléfono puede ejecutar HTML hasta 10 min desactualizado. No hay comprobación cliente-servidor de versión ni de reglas. `AUDITORIA_FUNCIONAL.md` cita `qa1`, el código `portada-sincronizada1`. *Solución:* QR sin `v`; `roomDirectory/current` con `minApp`/`rulesRev`; el cliente compara con su `RELEASE_ID` y muestra «Actualiza la página» si difiere.

**H-16 [C] Recursos externos sin integridad.** `qrcodejs` desde cdnjs sin SRI; logotipo del ICAP hotlinkeado desde seeklogo.com (puede desaparecer o cambiar; además es un tercero que recibe la IP de todos los asistentes); SDK Firebase `compat` 10.14.1 fijado (bien). *Solución:* alojar logo y QR localmente (con permiso de uso del logotipo), añadir `integrity`.

**H-17 [R] Reloj y plazo.** `clockOffsetMs` se deduce del encabezado `Date` de un HEAD a GitHub (`:330`), resolución de 1 s y sesgo de CDN; la interfaz bloquea en `rem<=1`. El servidor decide con `request.time`; es correcto, pero un voto en el último segundo se rechaza aunque el teléfono lo permita, y el teléfono no muestra el instante real de cierre. *Solución:* estimar el desfase con una escritura de `serverTimestamp` o `.info/serverTimeOffset`-equivalente; dar un margen de gracia de 1–2 s en la regla (`+ duration('2s')`) si se desea tolerancia.

**H-18 [R] Rendimiento de renderizado.** Cada evento de cualquier listener (hasta 6 por anfitrión × N votos) llama a `render()` que reconstruye panel, pestañas, resumen, gráficos y la pantalla pública (`replaceChildren`). Con 60 votos en 40 s habrá cientos de reconstrucciones; el QR está protegido por nodo cacheado, pero el gráfico de etapa 1–2 se redibuja y pierde `transition`. *Solución:* *debounce* de 250 ms con `requestAnimationFrame` y actualización parcial de contadores.

**H-19 [C] Documentación contradictoria.** README: «salas independientes de ensayo y clase oficial», «seis preguntas», «no reutilizar el QR del ensayo», «40 s», «el moderador es la sesión anónima», contraseña `123Moderador`; AUDITORIA_FUNCIONAL.md describe encuesta libre. Son 9 versiones apiladas. *Propuesta:* `README.md` (vigente, 1 página), `docs/OPERACION.md` (guion de clase), `docs/SEGURIDAD.md`, `CHANGELOG.md` (todo el historial), `docs/LEGADO.md`.

### Bajos

- **H-20 [C]** Texto: `chart()` escribe «Es la opción correcta porque La comparabilidad…» (`:287`, sin `normalizeExplanation`, inicial mayúscula).
- **H-21 [C]** `TRANSFER[4]` y `[5]` son código muerto en v3; `interpret()` (`:299`) nunca se usa; CSS apilado en 3 capas que se sobrescriben.
- **H-22 [C]** El panel privado no muestra la clave antes de revelarla (`:424`): el expositor no puede consultarla en privado.
- **H-23 [C]** `#alert` usa `role="status"` incluso para errores (`:78`); los errores de voto sí usan `role="alert"`. Sin estilos `:focus-visible` propios; el QR no tiene `role="img"`.
- **H-24 [C]** Errores de ingreso mezclados en una única alerta global; `online/offline` pisan mensajes de error previos (`:908-909`).
- **H-25 [R]** Dos participantes con el mismo nombre no se distinguen; borrar datos del navegador genera un uid nuevo y un segundo registro del mismo asistente.

## Problemas históricos (sección 17)

| # | Problema | Estado según evidencia |
|---|---|---|
| 1 | `Missing or insufficient permissions` al votar | Código y reglas coherentes en lectura; **sin prueba real**. Causa más probable histórica: reglas desplegadas distintas del repo (no verificable). |
| 2 | Error de validación tras entrar | Alerta limpiada en `:662,446`; **solo estático**. |
| 3 | Participantes que no aparecían | Listener + polling; el panel puede mostrar caché (`fromCache` → «Verificando»). **Sin prueba**. |
| 4 | Inscritos ≠ conectados | **No resuelto** (H-05). |
| 5 | Avance sin autorización | Reglas no lo permiten a participantes (`:57-69` exige owner/coPresenter). **Corregido en reglas**; falta prueba de emulador. |
| 6 | Salas antiguas en modo encuesta | Migración manual de lobby→competencia (`:617`) y bloqueo en el teléfono (`:449`); salas v1/v2 siguen existiendo en reglas. **Parcial.** |
| 7 | «Estoy listo» en estados incompatibles | Regla exige `lobby`; UI oculta el botón fuera de `lobby`. **Corregido, sin prueba real.** |
| 8 | Registros de ensayo como participantes actuales | Dependen del reinicio (H-09); no hay marca de época. **Parcial.** |
| 9 | Reglas publicadas desconocidas | **Sin resolver**; no hay detección (H-15). |
| 10 | Pública omitía portada | Mitigado con `publicView` + `intro=1`; efecto secundario H-08. |
| 11 | Exposición del panel privado | La pública exige sesión de expositor; **pero** el cliente público carga nombres y todos los votos en memoria (H-06). |
| 12 | Estados contradictorios | Ver matriz E; casos no cubiertos listados. |
| 13 | Diferencias de versión por dispositivo | **Sin resolver** (H-15). |

## C. Matriz de permisos (según `firestore.rules`; no probada en emulador)

Leyenda: R=get, L=list, C=create, U=update, D=delete. Prop = propietario (`owner` == uid **o** `moderator()` en directorio); 2.º = segundo expositor (`coPresenter`); Part = anónimo con documento de participante; Anón = anónimo sin registro.

| Documento | Prop | 2.º expositor | Part | Anón |
|---|---|---|---|---|
| `roomDirectory/current` | R, C/U (hacia una sala suya v3), sin L ni D | R | R | R |
| `rooms/{id}` | R, C (v2/v3), U (todos los campos de estado), sin D | R, U solo adelante y `publicView`, nunca a `lobby`, no `done→`algo | R | R |
| `participants/{pid}` | R, L, D (solo `done`) | R, L | R propio; C propio (≠`done`); U propio solo `ready/readyAt` una vez en `lobby` | R propio, C propio |
| `answers/{q}/votes/{pid}` | R, L, D (solo `done`) | R, L | R propio, C/U propio dentro de plazo y etapa 0 | — |
| `access/presenter` | R, C/U/D | R (si su correo coincide) | — | — |

Observaciones: cualquier usuario firmado lee cualquier `rooms/{id}` conociendo el código (expone `owner` uid, sin datos personales); no hay límite de documentos por usuario; el 2.º expositor no puede borrar ni modificar permisos (correcto); `openedAt` y `questionTimes` no se validan contra `request.time` en actualizaciones.

## D. Matriz de estados (resumen; combinaciones críticas)

| Combinación | Válida | Observación / prueba |
|---|---|---|
| sala `lobby` · publicView `welcome` · participante inscrito sin listo | Sí | Bloquea inicio (H-02) |
| `lobby` · publicView `questions` | **Inválida** | La regla lo impide (`:62`), el cliente la trata como portada; probar reset desde estado `done` con `questions` |
| `live` · etapa 0 · público `welcome` | Sí | Pública sin pregunta; participantes ya votando; probar que votos no se pierdan |
| `live` · etapa 1 · participante | Sí | Móvil sin gráfico (H-11) |
| `live` · `revealStage 3` en idx 0 por 2.º expositor | **Permitida por reglas, no prevista** | H-07 |
| `done` · borrado parcial | Prevista | Reintentable; público muestra resultados de ensayo (H-09) |
| `done` → `lobby` por 2.º expositor | Inválida y bloqueada | Probar |
| Participante registrado con sala en `lobby` tras reinicio | Prevista | El listener lo devuelve a inicio (`:709-712`); si `fromCache` lo ignora (`:707`) — probar en red lenta |
| Teléfono con HTML antiguo + reglas nuevas | **No prevista** | Sin detección (H-15) |
| Moderador sin conexión con ventana pública abierta | **No prevista** | La pública seguirá mostrando datos de caché sin aviso (el estado «Sin conexión» solo aparece al fallar la carga inicial); [R] |
| Sala `survey` v3 (migración) | Legado | Bloquea teléfonos con «Ensayo anterior en proceso» |

## E. Auditoría pedagógica de las cuatro preguntas

| Pregunta | Fortalezas | Debilidades |
|---|---|---|
| **P1** ¿Cuándo son comparables dos casos? (A, 62 car.) | Concepto fundacional claro; distractores corresponden a errores reales (identidad, país, valores). | Enunciado de 34 caracteres sin contexto; la correcta es la más larga y la única con calificativos («relevante», «significado equivalente»); se solapa casi por completo con P2. |
| **P2** Gasto público/PIB (B, 74 car.) | Buen caso aplicado; distractores plausibles (nombre común, contexto). | Los tres incorrectos usan lenguaje absoluto («impiden», «garantiza», «deben»); la correcta es la única con «pueden… si…»: se acierta por estilo. Evalúa la misma idea que P1. |
| **P3** Alargamiento conceptual (C, 68 car.) | Mejor ítem conceptual; aplica Sartori (escalera de abstracción). | «Necesariamente» en el enunciado y la pareja No/Sí condiciona; el término «alargamiento» exige haber leído a Sartori (dificultad real, aceptable). El nivel de dificultad salta de P2 a P3. |
| **P4** Hospitales 20/40 min (D, 57 car.) | Caso muy didáctico (equivalencia de indicadores). | El enunciado pregunta «¿Qué conclusión está justificada?» y la correcta empieza por «No, porque…»: incoherencia gramatical heredada de la reordenación; es la opción más corta (pista inversa). |

Valoración global: contenido válido y bien explicado, pero (i) en P1–P3 el patrón «opción matizada = correcta» es detectable por quien conozca el truco; (ii) las cuatro claves están a-b-c-d en orden (`correct:[0,1,2,3]` en `verify.mjs:24`), predecible para participantes que comparen posiciones; (iii) no hay ítem de **sistemas más similares/más diferentes**, eje de la comparación (preguntas 5 y 6 del instrumento anterior, ahora fuera; sus `TRANSFER` quedaron huérfanos); (iv) con ≤30 respondientes cualquier porcentaje tiene un margen de error muy amplio: el panel muestra «n de N» (bien) pero no «respondieron X de Y inscritos». Recomendación: reescribir P1/P2 para que midan cosas distintas, igualar la forma gramatical de las alternativas, usar al menos una opción matizada incorrecta, aleatorizar el orden por pregunta (A–D no siempre «a, b, c, d») y comprobar psicometría con la primera clase (dificultad y discriminación por ítem) antes de modificar claves. **No cambié ninguna pregunta.**

Interpretación de resultados: correctamente ordena distractores de mayor a menor frecuencia, usa `fmtPercent` con coma decimal, no inventa errores si todos aciertan, y no atribuye dominio individual. Deficiencias: no distingue visualmente «inscritos / respondieron» (P1: 24 inscritos, 18 respuestas se resume solo en «18 respuestas»), y la pantalla pública no muestra tiempo ni «n respuestas recibidas» durante la etapa 0 (conviene mostrar ambos, sin porcentajes).

## F. Plan de pruebas reproducible (antes de la clase)

**Ya ejecutado en esta auditoría:** verify.mjs (falla), versión corregida (pasa), volcado de preguntas, comparación sitio/repositorio.

**Corrección mínima de CI (1 línea):** en `scripts/verify.mjs:17` usar `return result;`.

1. **Reglas con emulador** (`@firebase/rules-unit-testing` + Firebase Emulator Suite, Java ≥ 21): propietario, 2.º expositor, participante, anónimo, sin autenticar. Casos permitidos y prohibidos para cada fila de la matriz C; saltos de `idx`/`revealStage`; voto tras el plazo; voto en `reveal`; `ready` repetido; creación con campos extra; borrado en `lobby`/`live`/`done`; 180 borrados por lote; `publicView:'questions'` en `lobby`.
2. **Unitarias (Node/Vitest sobre funciones extraídas):** `fmtPercent`, `remaining/timingReady` con reloj simulado, `stageNow`, `scoreReleased`, `activateQuizVersion(3)` (4 preguntas, claves), `normalizeExplanation`, transiciones permitidas.
3. **E2E Playwright** (1 contexto propietario, 1 expositor, 1 pública, 5–10 participantes): inscripción simultánea; doble pulsación; recarga en votación; voto tardío; red cortada (`context.setOffline`); reinicio con participantes conectados; recarga de la pública en `live`; apertura de la pública con P1 activa; dos expositores pulsando a la vez; QR antiguo.
4. **Ensayo manual con 3 teléfonos reales** siguiendo `AUDITORIA_FUNCIONAL.md §4` + un fantasma inscrito (H-02) + reinicio y comprobación de que el QR no cambia.
5. **Lista previa a clase (15 min antes):** CI verde; reglas publicadas = repo (`rules diff`); sala en «Sala lista y disponible»; versión visible en pie; ventana pública en portada con QR; contraseña rotada.

Pendiente (no ejecutado): todos los puntos 1–5, rendimiento con 30–60 clientes, accesibilidad con lector de pantalla y medición de contraste.

## G. Plan de correcciones priorizado

| Prioridad | Acción | Esfuerzo | Riesgo de regresión | Depende de |
|---|---|---|---|---|
| **P0** | Rotar contraseña del propietario, activar 2FA, retirar `123Moderador` del README (H-04) | 15 min | Nulo | — |
| **P0** | Arreglar `verify.mjs` línea 17 y revisar CI (H-01) | 15 min | Bajo | — |
| **P0** | Salida del bloqueo del lobby: «Iniciar con los listos» (confirmación explícita, solo expositores) + permitir reinicio/limpieza en lobby (H-02) | 0.5–1 d | Medio (reglas + UI) | emulador |
| **P0** | Cerrar inscripciones al iniciar (`joinOpen`) y activar App Check (H-03) | 0.5–1 d | Medio | App Check en consola |
| **P0** | Verificar en consola: reglas desplegadas = repo, registro por contraseña desactivado, cuotas | 30 min | Nulo | acceso del propietario |
| **P1** | Reglas de transición exactas + transacciones en avance/revelación (H-07) | 1 d | Medio | emulador |
| **P1** | Eliminar polling de 12 s; agregado público para la pantalla pública (H-06) | 0.5–1 d | Medio | — |
| **P1** | Presencia mediante heartbeat solo informativa (H-05) | 0.5 d | Bajo | — |
| **P1** | Marcador `maintenance` y orden seguro del reinicio (H-09) | 0.5 d | Medio | reglas |
| **P1** | Aviso de versión/reglas y QR sin `v` (H-15); timeouts en voto/listo (H-14) | 0.5 d | Bajo | — |
| **P1** | `intro` persistente en la pública (H-08); `role="alert"` en errores | 2 h | Bajo | — |
| **P1** | Batería de pruebas 1–3 de la sección F | 2–3 d | Nulo | emulador, Playwright |
| **P2** | Etapa 1 del móvil (H-11); temporizador y «n respuestas» en pantalla pública; «respondieron X de Y» | 0.5 d | Bajo | agregado |
| **P2** | Revisión de P1/P2/P4, SSD/SDD, orden aleatorio de alternativas (con datos de la primera clase) | 1 d de diseño | Medio (cambia contenido) | decisión académica |
| **P2** | Documentación: README vigente + CHANGELOG + legado (H-19); alojar logo y QR localmente (H-16) | 0.5 d | Nulo | — |
| **P3** | Extraer JS/CSS a módulos de forma gradual (primero funciones puras con pruebas, luego listeners), retirar v1/v2 y modo encuesta | 3–5 d | Alto sin pruebas, bajo con ellas | P1 pruebas |
| **P3** | Clave y estadísticas a documentos con lectura condicionada (H-13) | 1 d | Medio | — |

## H. Veredicto

**NO APTO para una clase real hoy; APTO tras correcciones específicas** (P0 completos + ensayo con teléfonos reales).

Evidencia: (1) la única red de seguridad automática está rota y lleva ≥15 commits en rojo (H-01); (2) existe una ruta comprobada por código en la que el lobby no puede iniciarse ni limpiarse desde la interfaz (H-02), agravada por que cualquiera con el QR puede crear inscritos sin límite (H-03); (3) una contraseña sugerida está en un repositorio público (H-04); (4) nada del flujo con Firebase real, varios teléfonos, ventana pública y reglas desplegadas ha sido verificado en esta auditoría. Lo que sí está sólido: separación de roles en reglas, plazos validados con `request.time`, estructura de la sala única con directorio central, borrado verificado contra el servidor y simulación local sin escrituras remotas (la ruta `launchSimulation` no invoca `rref().update/set`, comprobado por lectura).

## No pude verificar
Reglas realmente publicadas, configuración de Authentication (registro abierto, 2FA), cuotas/plan, App Check, comportamiento en Chrome/móviles, tiempo real con carga, límite de accesos de reglas en lotes de 180, accesibilidad medida, contraste calculado.
