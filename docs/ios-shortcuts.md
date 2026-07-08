# Atajo iOS - Enviar a Drop

Dominio: `https://crackdecracks.vercel.app`  
Endpoint: `https://crackdecracks.vercel.app/api/drop`  
Metodo: `POST`  
Auth: `Authorization: Bearer TU_TOKEN`

> Si compartes este archivo o lo subes a un repo publico, revoca y regenera el token en Perfil.

## Objetivo

El atajo envia texto temporal a Drop. Drop vive 48h por defecto y no escribe en `items`.

## Atajo: Enviar texto a Drop

1. Abre Atajos y crea un atajo nuevo.
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
10. En el bloque verdadero, anade **Mostrar confirmacion** con: `Drop enviado`.
11. En el bloque falso, anade **Mostrar resultado** con la respuesta completa.

## Ejemplo de body

```json
{
  "content": "Texto temporal enviado desde iOS"
}
```

## Importante

No uses `GET` ni query params. El token va siempre en la cabecera `Authorization` y el contenido va en el body JSON.

## Respuesta esperada

```json
{
  "ok": true,
  "drop": {
    "id": "...",
    "content": "...",
    "file_url": null,
    "content_type": "text",
    "user_id": "...",
    "created_at": "...",
    "expires_at": "..."
  }
}
```

## Errores frecuentes

| Mensaje | Que hacer |
| --- | --- |
| `Token requerido` | Falta la cabecera `Authorization: Bearer TU_TOKEN`. |
| `Token invalido` | Regenera token en Perfil y actualiza el atajo. |
| `content o file_url requerido` | El body JSON no incluye `content`. |
| `503` | Falta `SUPABASE_SERVICE_ROLE_KEY` en Vercel. |

## Requisitos en servidor

- Migracion de `drops` aplicada.
- Variable `SUPABASE_SERVICE_ROLE_KEY` configurada.
- Token generado en Perfil.

---

## Atajo: Compartir foto o archivo a Drop (Share Sheet)

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
9. En el bloque verdadero: **Mostrar confirmacion** → `Drop enviado`.
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

### Notas

- El selector nativo de archivo del sistema tambien funciona directamente desde la web
  en Safari/Chrome en iPhone — no hace falta el Shortcut para fotos nuevas.
- El Shortcut de archivo es especialmente util para compartir desde Fotos, Archivos,
  Voice Memos u otras apps directamente a Drop sin abrir el navegador.
- Los archivos siguen expirando a las 48 h junto con el registro en base de datos;
  el job pg_cron elimina la fila pero el archivo en Storage puede requerir limpieza
  manual o una funcion Edge/webhook separada si el espacio es critico.
