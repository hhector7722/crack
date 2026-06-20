# Compartir enlaces a Crack desde iPhone (Atajos)

Gratis, sin App Store.

## 1. Migración Supabase

En el SQL Editor de Supabase ejecuta:

`supabase/migrations/002_share_tokens.sql`

## 2. Variable en Vercel

| Variable | Valor |
|----------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → `service_role` |
| `NEXT_PUBLIC_SITE_URL` | `https://tu-dominio.vercel.app` |

Redespliega la app.

## 3. Token en Crack

Perfil → **Generar token** → copia token y URL de `/api/share-link`.

---

## Método A — Portapapeles (recomendado si falla la hoja Compartir)

No necesitas «Recibir» ni «Mostrar en hoja de compartir». Funciona siempre.

### Uso diario

1. En YouTube/Safari/Instagram → **Compartir** → **Copiar enlace**
2. Ejecuta el atajo **Guardar en Crack** (icono en pantalla de inicio o widget)
3. Listo → abre Crack → Notas

### Crear el atajo (3 acciones)

1. **Atajos** → **+** → nombre: **Guardar en Crack**
2. **Añadir acción** → busca **Portapapeles** → **Obtener contenido del portapapeles**
3. **Añadir acción** → busca **URL** → **Obtener URL de** → elige **Contenido del portapapeles** (variable del paso anterior)
4. **Añadir acción** → **Obtener contenido de URL**:
   - URL: `https://TU-DOMINIO.vercel.app/api/share-link`
   - Método: **POST**
   - Cabeceras:
     - `Authorization` → `Bearer TU_TOKEN`
     - `Content-Type` → `application/json`
   - Cuerpo: **JSON** → `{ "url": "[URL del paso 2]" }`  
     (toca `url` y selecciona la variable **URL**, no escribas texto fijo)
5. (Opcional) **Mostrar notificación** → «Guardado en Crack»
6. Toca **ⓘ** abajo → **Añadir a pantalla de inicio** (para lanzarlo con un toque)

---

## Método B — Directo desde Compartir (hoja de compartir)

Solo si tu iPhone deja activar el interruptor.

### Activar entrada compartida

1. Editor del atajo → barra inferior → icono **ⓘ** (tercero: deshacer, rehacer, **ⓘ**, compartir, play)  
   **No** uses el menú del nombre «Nuevo atajo» arriba.
2. En **Detalles** → activa **Mostrar en hoja de compartir**
3. **Hecho** → arriba aparece franja gris: *Recibir Cualquier entrada…*
4. Toca **Cualquier** → marca **URLs** y **Safari** → **OK**

Si el interruptor **no se queda en verde** o no puedes marcar URLs → usa **Método A**.

### Acciones (igual que A pero con Entrada del atajo)

1. **Obtener URL de Entrada del atajo**
2. **Obtener contenido de URL** (POST, mismo JSON y token)

### Activar en Compartir

Compartir → abajo **Editar acciones** → **+** junto a tu atajo.

---

## Probar

- **Método A:** Copiar enlace → pulsar atajo en inicio → Notas en Crack  
- **Método B:** Compartir → Guardar en Crack → Notas en Crack

## Android

PWA instalada → Crack puede salir en Compartir (`share_target` → `/share`).

## Problemas

| Problema | Solución |
|----------|----------|
| No aparece «Recibir» al buscar | Normal. Usa **Método A** |
| ⓘ no activa hoja compartir | Usa **Método A** |
| No deja marcar URLs | Usa **Método A** |
| Token inválido | Regenerar token en Perfil |
| 503 | Falta `SUPABASE_SERVICE_ROLE_KEY` en Vercel |
