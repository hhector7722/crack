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
