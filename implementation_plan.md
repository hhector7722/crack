# Plan de Implementación: Pull-to-Refresh y Carga en Segundo Plano

## Objetivo
Mejorar la experiencia de usuario (UX) al añadir contenido desde la extensión de compartir, evitando que el usuario tenga que forzar el cierre de la app. Además, añadir el gesto de deslizar hacia abajo para actualizar (Pull-to-Refresh) con efecto rebote tipo iPhone en todas las vistas.

## Cambios Propuestos

### 1. Manejo de enlaces entrantes (Deep Linking)
- Se creará un componente invisible `UrlObserver` que usará `useSearchParams` para detectar cuando la app se abre con el parámetro `?id=...`.
- Al detectar este parámetro:
  - Eliminará el parámetro de la URL para dejarla limpia.
  - Activará un estado global de "Sincronización entrante".
  - Disparará una actualización de fondo (`bumpRefresh()`) en todas las vistas.

### 2. Sincronización en Segundo Plano y Mini Spinners
- Actualmente, al refrescar una vista (Notas, Galería, Dashboard), la lista se vacía y sale un spinner grande.
- Se modificará el comportamiento para que:
  - Si ya hay datos cargados, no se vacíe la pantalla.
  - En su lugar, se mostrará un **bloque temporal (Skeleton / Mini Spinner)** al principio de la lista. Este bloque simulará el "espacio reservado" para el nuevo ítem mientras se descargan los datos nuevos de la base de datos.
  - Una vez obtenidos, el bloque desaparecerá dando paso al ítem real.
- Esto se aplicará a `note-list.tsx`, `gallery-feed.tsx`, `audio-feed.tsx` y `dashboard-page.tsx`.

### 3. Componente `PullToRefresh` (Efecto iPhone)
- Se construirá un nuevo componente `components/pull-to-refresh.tsx` puro en React sin librerías pesadas.
- Interceptará los eventos táctiles (`touchstart`, `touchmove`, `touchend`).
- Cuando el usuario esté en la parte superior (`scrollTop === 0`) y deslice hacia abajo:
  - Creará un efecto de rebote arrastrando el contenedor.
  - Revelará un pequeño spinner de carga en la parte superior.
  - Al soltar, si se ha superado el umbral, mantendrá el spinner visible y disparará la carga. Al terminar, el contenedor volverá a su posición original con una animación suave (`transition-transform`).

## Verificación
- Se simulará la apertura de la app con un enlace `?id=123`.
- Se probará el gesto táctil de arrastrar en pantallas móviles usando herramientas de desarrollador o dispositivo real para asegurar el comportamiento nativo tipo iPhone.
