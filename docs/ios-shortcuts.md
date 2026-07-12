# Atajos iOS — Crack

Dominio: `https://crackdecracks.vercel.app`  
Auth (ambos atajos): `Authorization: Bearer TU_TOKEN`

Genera el token en Crack → **Perfil** → **Generar token**.

> Si compartes este archivo o lo subes a un repo publico, revoca y regenera el token en Perfil.

## Resumen

| Atajo | Endpoint | Destino | Duracion |
| --- | --- | --- | --- |
| Guardar enlace en Crack | `POST /api/share-link` | Pestaña Enlaces (permanente) | Siempre |
| Enviar a Drop | `POST /api/drop` | Chat de Drop | 48 h |
| Archivo a Drop (opcional) | `POST /api/drop` (formulario) | Chat de Drop | 48 h |

Un solo token sirve para todos. No uses `GET` ni pongas el token en la URL.

---

## Atajo 1: Guardar enlace en Crack

Guarda el enlace compartido en la app de forma permanente (con preview OG).

1. Abre Atajos y crea un atajo nuevo (nombre sugerido: **Guardar enlace en Crack**).
2. Activa **Mostrar en la hoja para compartir**.
3. Configura la entrada para recibir **Texto** y **URLs**.
4. Anade **Obtener texto de entrada**.
5. Anade **Diccionario** con esta clave:

| Clave | Tipo | Valor |
| --- | --- | --- |
| `url` | Texto | variable del paso 4 |

6. Anade **Obtener contenido de URL**.
7. Configura:

| Campo | Valor |
| --- | --- |
| URL | `https://crackdecracks.vercel.app/api/share-link` |
| Metodo | `POST` |
| Cabecera `Authorization` | `Bearer TU_TOKEN` |
| Cabecera `Content-Type` | `application/json` |
| Cuerpo de solicitud | `JSON` |
| JSON | diccionario del paso 5 |

8. Anade **Obtener diccionario de entrada** usando la respuesta del paso 6.
9. Anade **Si** `ok` es `true`.
10. En el bloque verdadero, anade **Mostrar notificacion** con: `Enlace guardado`.
11. En el bloque falso, anade **Mostrar resultado** con la respuesta completa.

### Opcional: abrir Crack tras guardar

Despues del paso 8:

1. **Obtener valor** del diccionario → clave `id`.
2. **URL** → `https://crackdecracks.vercel.app/?id=` + valor.
3. **Abrir URL**.

### Ejemplo de body

```json
{
  "url": "https://ejemplo.com/articulo"
}
```

### Respuesta esperada

```json
{
  "ok": true,
  "id": "uuid-del-item"
}
```

---

## Atajo 2: Enviar texto a Drop

Envia texto o enlaces al chat temporal de Drop. No se guarda en Enlaces.

1. Abre Atajos y crea un atajo nuevo (nombre sugerido: **Enviar a Drop**).
2. Activa **Mostrar en la hoja para compartir**.
3. Configura la entrada para recibir **Texto** y **URLs**.
4. Anade **Obtener texto de entrada**.
5. Anade **Diccionario** con esta clave:

| Clave | Tipo | Valor |
| --- | --- | --- |
| `content` | Texto | variable del paso 4 |

6. Anade **Obtener contenido de URL**.
7. Configura:

| Campo | Valor |
| --- | --- |
| URL | `https://crackdecracks.vercel.app/api/drop` |
| Metodo | `POST` |
| Cabecera `Authorization` | `Bearer TU_TOKEN` |
| Cabecera `Content-Type` | `application/json` |
| Cuerpo de solicitud | `JSON` |
| JSON | diccionario del paso 5 |

8. Anade **Obtener diccionario de entrada** usando la respuesta del paso 6.
9. Anade **Si** `ok` es `true`.
10. En el bloque verdadero, anade **Mostrar notificacion** con: `Drop enviado`.
11. En el bloque falso, anade **Mostrar resultado** con la respuesta completa.

### Ejemplo de body

```json
{
  "content": "Texto temporal enviado desde iOS"
}
```

### Respuesta esperada

```json
{
  "ok": true,
  "drop": {
    "id": "...",
    "content": "...",
    "user_id": "...",
    "created_at": "...",
    "expires_at": "...",
    "attachments": []
  }
}
```

---

## Atajo 3: Compartir foto o archivo a Drop (opcional)

Permite enviar una imagen, audio, video o cualquier archivo desde la hoja de compartir
de iOS directamente a Drop. El servidor detecta el tipo MIME y almacena en Supabase Storage.

### Configuracion

1. Abre Atajos y crea un atajo nuevo.
2. Activa **Mostrar en la hoja para compartir**.
3. Configura la entrada para recibir **Imagen**, **Archivos**, **Audio** y **Video**
   (activa todos los tipos que quieras soportar).
4. Anade **Obtener contenido de adjunto como archivo** (esto convierte el item
   compartido a un archivo binario).
5. Anade **Obtener contenido de URL** y configura:

| Campo | Valor |
| --- | --- |
| URL | `https://crackdecracks.vercel.app/api/drop` |
| Metodo | `POST` |
| Cabecera `Authorization` | `Bearer TU_TOKEN` |
| Cuerpo de solicitud | `Formulario` |

6. En el cuerpo tipo Formulario, anade un campo:

| Nombre | Tipo | Valor |
| --- | --- | --- |
| `file` | Archivo | variable del paso 4 |

   > No pongas `Content-Type` manualmente; iOS lo establece como `multipart/form-data`
   > con el boundary correcto cuando el cuerpo es de tipo Formulario.

7. Anade **Obtener diccionario de entrada** usando la respuesta del paso 5.
8. Anade **Si** `ok` es `true`.
9. En el bloque verdadero: **Mostrar notificacion** → `Drop enviado`.
10. En el bloque falso: **Mostrar resultado** con la respuesta completa.

### Opcional: agregar texto al archivo

Si quieres enviar un caption junto al archivo, anade otro campo al formulario del paso 6:

| Nombre | Tipo | Valor |
| --- | --- | --- |
| `content` | Texto | "Mi descripcion" (o variable) |

### Tipos de contenido soportados

| Extension / MIME | content_type guardado |
| --- | --- |
| `image/jpeg`, `image/png`, `image/webp`… | `image` |
| `audio/mpeg`, `audio/mp4`, `audio/wav`… | `audio` |
| `video/mp4`, `video/quicktime`… | `video` |
| Cualquier otro MIME | `file` |

---

## Errores frecuentes

| Mensaje | Que hacer |
| --- | --- |
| `Token requerido` | Falta la cabecera `Authorization: Bearer TU_TOKEN`. |
| `Token invalido` | Regenera token en Perfil y actualiza todos los atajos. |
| `No se encontro ninguna URL valida` | El atajo 1 no recibio URL; usa Obtener texto de entrada. |
| `content o un archivo requerido` | El atajo 2 no incluye `content` en el JSON. |
| `503` | Falta `SUPABASE_SERVICE_ROLE_KEY` en Vercel. |

## Requisitos en servidor

- Migraciones `002_share_tokens.sql` y `drops` aplicadas.
- Variable `SUPABASE_SERVICE_ROLE_KEY` configurada.
- Token generado en Perfil.
