# Cordero F — Gestión de Misiones

App de tareas personales, offline y con identidad táctica. Es una **Progressive Web App (PWA)**: HTML, CSS y JavaScript puro, sin ninguna dependencia de red, lo que garantiza que funcione al 100% sin conexión desde el primer uso, instalable en Android, iOS, Windows, macOS y Linux.

## Vista previa en vivo
Activa GitHub Pages en este repositorio (Settings → Pages → Source: rama `main`, carpeta `/root`) y la app quedará disponible en:

`https://dgcordero.github.io/cordero/`

## Qué incluye
- `index.html` — estructura de la app
- `style.css` — identidad visual táctica (oliva, negro campaña, acentos crítico/táctico/rutina)
- `app.js` — toda la lógica (sin librerías externas, sin llamadas de red)
- `manifest.json` — hace la app instalable como app nativa
- `sw.js` — service worker que cachea todo para uso 100% offline
- `icons/` — iconos de la app

## Cómo instalarla
### En Android (Chrome)
Menú (⋮) → "Instalar aplicación" / "Añadir a pantalla de inicio".

### En iPhone (Safari)
Botón compartir (□↑) → "Añadir a pantalla de inicio".

### En escritorio (Chrome/Edge)
Icono de instalación en la barra de direcciones, o el botón "⬇ Instalar" dentro de la app.

## Seguridad y privacidad
- Cero llamadas a APIs externas: revisa `app.js` y `sw.js`, no hay ninguna URL de red.
- Todos los datos (tus tareas) se guardan únicamente en el almacenamiento local de tu propio dispositivo (`localStorage`), nunca salen de él.
- Sin cuentas, sin login, sin analítica, sin cookies de terceros.

## Uso
- **+ Nueva misión**: crea una tarea con título, notas, categoría, plazo y prioridad (Crítica / Táctica / Rutina).
- **→**: avanza el estado (Pendiente → En curso → Cumplida → Pendiente).
- **✕**: elimina la tarea.
- Filtros por estado o prioridad en la parte superior de la lista.
