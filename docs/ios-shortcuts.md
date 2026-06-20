# Compartir enlaces a Crack desde iPhone (Atajos)

Gratis, sin App Store. Crack aparece en el menú **Compartir** de otras apps tras instalar un Atajo.

## 1. Migración Supabase

En el SQL Editor de Supabase ejecuta:

`supabase/migrations/002_share_tokens.sql`

## 2. Variable en Vercel

Añade en **Vercel → Settings → Environment Variables**:

| Variable | Valor |
|----------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` (secreto) |
| `NEXT_PUBLIC_SITE_URL` | `https://tu-dominio.vercel.app` (opcional, recomendado) |

Redespliega la app.

## 3. Generar token en Crack

1. Abre Crack → **Perfil**
2. Pulsa **Generar token**
3. **Copia el token** (solo se muestra una vez)
4. Copia también la **URL de la API** (`/api/share-link`)

## 4. Crear el Atajo en iPhone

> **Importante:** No busques una acción llamada «Recibir» en la lista de acciones.
> Esa parte **aparece sola** cuando activas «Mostrar en hoja de compartir».

### Paso A — Activar la hoja de compartir (primero)

1. Abre **Atajos** → botón **+** (nuevo atajo).
2. Toca el **ⓘ** abajo a la derecha (o el nombre del atajo arriba → **Detalles**).
3. Activa **Mostrar en hoja de compartir**.
4. Vuelve al editor: arriba del atajo verás una franja gris tipo:
   - *«Recibir **Cualquier** entrada de la hoja de compartir»*  
   - o en inglés: *«Receive **Any** input from Share Sheet»*
5. Toca **Cualquier** / **Any** → deja marcado solo:
   - **URLs**
   - **Páginas web de Safari** (o categoría **Web**)
6. En *«Si no hay entrada»* deja **Continuar**.

Si no ves esa franja gris, **Mostrar en hoja de compartir** no está activado.

### Paso B — Acciones del atajo

7. **Añadir acción** → busca **«URL»** → elige **«Obtener URL de Entrada del atajo»**  
   (en inglés: *Get URLs from Shortcut Input*).  
   Si compartes desde Safari/YouTube, esto extrae el enlace.
8. **Añadir acción** → **«Obtener contenido de URL»** / *Get Contents of URL*:
   - **URL:** `https://TU-DOMINIO.vercel.app/api/share-link`
   - **Método:** POST
   - **Cabeceras:**
     - `Authorization` → `Bearer TU_TOKEN_AQUI`
     - `Content-Type` → `application/json`
   - **Cuerpo de solicitud:** JSON
   - **Cuerpo JSON:** toca el campo `url` y elige la variable **URL** del paso anterior (no escribas texto fijo).
9. (Opcional) **Mostrar notificación** → «Guardado en Crack»
10. Nombra el atajo: **Guardar en Crack**

### Si no encuentras una acción

| Qué buscas | Prueba a buscar en Atajos |
|------------|---------------------------|
| Entrada compartida | Activa **Mostrar en hoja de compartir** (no es acción suelta) |
| Extraer enlace | `URL`, `Obtener URL`, `Get URLs` |
| Llamada API | `Obtener contenido de URL`, `Get Contents of URL` |
| Variable del enlace | `Entrada del atajo`, `Shortcut Input` |

## 5. Probar

1. Abre un vídeo en YouTube o un enlace en Safari.
2. **Compartir** → desplázate → **Guardar en Crack**.
3. Abre Crack → **Notas** → debe aparecer la nota con el enlace.

Si el atajo no sale en Compartir: desplázate hasta el final de la hoja y toca **Más** / **Editar acciones** → activa tu atajo.

## Android (automático)

Si instalas la PWA en Android, **Crack** también puede aparecer en Compartir gracias a `share_target` en el manifest (abre `/share` con la sesión iniciada).

## Seguridad

- El token es personal. No lo compartas.
- **Regenerar token** invalida el anterior.
- **Revocar** elimina el acceso del Atajo hasta que generes uno nuevo.

## Solución de problemas

| Problema | Solución |
|----------|----------|
| No aparece «Recibir» al buscar acciones | Normal. Activa **Mostrar en hoja de compartir** en ⓘ |
| No aparece la franja gris arriba | **Mostrar en hoja de compartir** desactivado |
| Atajo no sale en Compartir | Compartir → **Más** → activar el atajo |
| `Token inválido` | Token mal copiado o revocado |
| `503` / service role | Falta `SUPABASE_SERVICE_ROLE_KEY` en Vercel |
| `No se encontró URL` | Falta paso «Obtener URL de Entrada del atajo» |
