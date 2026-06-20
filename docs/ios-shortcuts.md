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

1. Abre **Atajos** → **+** → **Atajo**
2. **Añadir acción** → **Recibir** → **Compartir**
   - Tipos: **URLs**, **Texto**, **Páginas web de Safari**
3. **Añadir acción** → **Obtener contenido de URL**
   - URL: `https://TU-DOMINIO.vercel.app/api/share-link`
   - Método: **POST**
   - Cabeceras:
     - `Authorization` → `Bearer TU_TOKEN_AQUI`
     - `Content-Type` → `application/json`
   - Cuerpo de solicitud: **JSON**
   - JSON:
     ```json
     {
       "url": "[Entrada del atajo]"
     }
     ```
     (Selecciona la variable **Entrada del atajo** / **Shortcut Input** en lugar del texto literal)
4. (Opcional) **Mostrar notificación** → "Guardado en Crack"
5. Toca el nombre del atajo arriba → **Ajustes del atajo**
6. Activa **Mostrar en hoja de compartir**
7. Nombre sugerido: **Guardar en Crack**

## 5. Probar

1. Abre un vídeo en YouTube o un enlace en Safari
2. **Compartir** → **Guardar en Crack**
3. Abre Crack → **Notas** → debe aparecer la nota con el enlace

## Android (automático)

Si instalas la PWA en Android, **Crack** también puede aparecer en Compartir gracias a `share_target` en el manifest (abre `/share` con la sesión iniciada).

## Seguridad

- El token es personal. No lo compartas.
- **Regenerar token** invalida el anterior.
- **Revocar** elimina el acceso del Atajo hasta que generes uno nuevo.

## Solución de problemas

| Error | Causa |
|-------|--------|
| `Token inválido` | Token mal copiado o revocado |
| `503` / service role | Falta `SUPABASE_SERVICE_ROLE_KEY` en Vercel |
| `No se encontró URL` | El Atajo no pasa la URL en el JSON |
| Atajo no aparece en Compartir | Falta activar "Mostrar en hoja de compartir" |
