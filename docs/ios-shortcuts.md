# Atajo iOS — Guardar enlaces en Crack

Dominio: `https://crackdecracks.vercel.app`  
Token: `ArJec1N0IytJlhviMNWjyWmuxkeHqcPDIobgdOcBhlg`

> Si compartes este archivo o lo subes a un repo público, **revoca y regenera** el token en Perfil.

---

## Uso diario

1. En Safari, YouTube, etc. → **Compartir** → **Copiar enlace**
2. Ejecutar el atajo **Guardar en Crack**
3. Abrir Crack → el enlace aparece en Notas

---

## Crear el atajo (método GET)

No uses POST ni JSON. Son 6 acciones en la app **Atajos**.

### Paso a paso

#### 1. Obtener portapapeles

Busca **Obtener portapapeles** y añádela.

---

#### 2. Obtener direcciones URL de

Busca **Obtener direcciones URL de la entrada** (o «Obtener direcciones URL de»).

- Toca el hueco de entrada → **Seleccionar variable** → **Portapapeles**

---

#### 3. Codificar con URL

Busca **Codificar con URL**.

- Entrada: **Direcciones URL** (variable del paso 2)

---

#### 4. Texto

Busca **Texto** y pega **exactamente** esta línea (ya incluye tu token):

```
https://crackdecracks.vercel.app/api/share-link?token=ArJec1N0IytJlhviMNWjyWmuxkeHqcPDIobgdOcBhlg&url=
```

No añadas espacios ni saltos de línea al final.

---

#### 5. Combinar texto

Busca **Combinar texto** (o «Unir texto»).

- Primer bloque: **Texto** (paso 4)
- Segundo bloque: **Texto codificado** (paso 3)

Orden: primero el Texto fijo, luego el enlace codificado.

---

#### 6. Obtener contenido de URL

Busca **Obtener contenido de URL**.

- Toca el **hueco vacío** junto a «Obtener contenido de» (no el campo de abajo suelto)
- **Seleccionar variable** → **Texto combinado** (paso 5)
- Método: **GET** (viene por defecto; no cambies a POST)

Si ves el error *«No se ha especificado ninguna URL»*, es porque este hueco sigue vacío. Debe mostrar la variable **Texto combinado**, no una URL escrita aparte.

---

#### 7. Icono en pantalla de inicio (opcional)

Toca **ⓘ** arriba a la derecha → **Añadir a pantalla de inicio** → nombre: **Guardar en Crack**.

---

## Cómo queda la URL al ejecutar

```
https://crackdecracks.vercel.app/api/share-link?token=ArJec1N0IytJlhviMNWjyWmuxkeHqcPDIobgdOcBhlg&url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3D...
```

Crack recibe la petición GET, valida el token y guarda el enlace.

---

## Probar sin copiar enlace

Abre Safari, copia manualmente `https://youtube.com/watch?v=dQw4w9WgXcQ`, ejecuta el atajo. Deberías ver `{"ok":true,"id":"..."}` o similar en la respuesta.

---

## Errores frecuentes

| Mensaje | Qué hacer |
|---------|-----------|
| No se ha especificado ninguna URL | Paso 6: el hueco principal debe ser la variable **Texto combinado** |
| Token inválido | Regenera token en Perfil y actualiza el paso 4 |
| No se encontró ninguna URL válida | Copia un enlace real antes de ejecutar el atajo |
| 503 | Falta `SUPABASE_SERVICE_ROLE_KEY` en Vercel |
| 404 / HTML en vez de JSON | Despliega la última versión en Vercel (endpoint GET aún no publicado) |

---

## Android

PWA instalada → Compartir → **Crack** (usa `/share`, no necesita atajo).

---

## Requisitos en servidor

- Migración `supabase/migrations/002_share_tokens.sql` aplicada
- Variable `SUPABASE_SERVICE_ROLE_KEY` en Vercel
- Token generado en Perfil (el de arriba debe coincidir con el activo en tu cuenta)
