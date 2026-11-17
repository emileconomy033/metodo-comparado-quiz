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
