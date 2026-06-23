# Atajo iOS — Guardar enlaces e imágenes en Crack

Dominio: `https://crackdecracks.vercel.app`  
Token: `ArJec1N0IytJlhviMNWjyWmuxkeHqcPDIobgdOcBhlg`

> Si compartes este archivo o lo subes a un repo público, **revoca y regenera** el token en Perfil.

---

## Uso diario

### Enlaces
1. En Safari, YouTube, etc. → **Compartir** → **Copiar enlace**
2. Ejecutar el atajo **Guardar en Crack**
3. Abrir Crack → el enlace aparece en Notas

### Imágenes desde la web
1. Safari, Chrome, etc. → mantén pulsada una imagen → **Compartir imagen** → **Copiar enlace**
2. Ejecutar el atajo **Guardar imagen en Crack** (versión con `imageUrl`)
3. La imagen aparece en la sección Multimedia

### Fotos desde el carrete
1. Abre Fotos → selecciona una foto → Compartir → **Guardar foto en Crack** (atajo POST)
2. O desde el atajo: toca el botón → selecciona una foto manualmente

---

## Atajo 1: Guardar enlaces (GET)

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

## Atajo 2: Guardar imágenes desde la web (GET con imageUrl)

Copia el atajo anterior y modifícalo para enviar también la URL de la imagen al servidor.

### Cambios respecto al Atajo 1

#### En el paso 4, usa este Texto en su lugar:

```
https://crackdecracks.vercel.app/api/share-link?token=ArJec1N0IytJlhviMNWjyWmuxkeHqcPDIobgdOcBhlg&imageUrl=
```

La URL de la imagen irá después de `&imageUrl=` (codificada).

#### Flujo completo del atajo:
1. **Obtener portapapeles** (debes copiar antes el enlace de la imagen)
2. **Obtener direcciones URL de** la entrada → Portapapeles
3. **Codificar con URL** la URL obtenida
4. **Texto** con la URL base: `...&imageUrl=`
5. **Combinar texto**: Texto fijo + URL codificada
6. **Obtener contenido de URL** con la combinación

Resultado:
```
https://crackdecracks.vercel.app/api/share-link?token=...&imageUrl=https%3A%2F%2Fejemplo.com%2Ffoto.jpg
```

El servidor descarga la imagen, la clasifica con IA y la guarda en Multimedia.

---

## Atajo 3: Guardar fotos desde el carrete (POST)

Para enviar una foto directamente desde el carrete (sin URL pública):

### Paso a paso

#### 1. Seleccionar foto

Busca **Seleccionar fotos** o **Obtener la última foto**.

- **Seleccionar fotos**: permite escoger una foto manualmente
- **Obtener la última foto**: usa la más reciente automáticamente

#### 2. Obtener contenido de la imagen (opcional pero recomendado)

Busca **Obtener contenido de** y selecciona como entrada la foto del paso 1.
Esto convierte la imagen en datos binarios para enviar.

#### 3. Obtener contenido de URL — configurar POST

Busca **Obtener contenido de URL** y configura:

- **URL**: `https://crackdecracks.vercel.app/api/share-link`
- **Método**: `POST`
- **Cabeceras**: añade una cabecera:
  - Clave: `Authorization`
  - Valor: `Bearer ArJec1N0IytJlhviMNWjyWmuxkeHqcPDIobgdOcBhlg`
- **Cuerpo (solicitud)**: `Archivo` → selecciona la imagen (o los datos del paso 2)
- **Tipo de contenido**: `Automático`

> En la app Atajos, para poner el cuerpo como archivo: toca «Cuerpo» → cambiar a «Archivo» → seleccionar la variable de la foto.

#### 4. Mostrar resultado (opcional)

Añade **Mostrar alerta** o **Mostrar resultado del atajo** con el contenido obtenido.
Deberías ver `{"ok":true,"id":"..."}` si todo funciona.

---

## Atajo combinado: texto o imagen según entrada (avanzado)

Puedes hacer un solo atajo que detecte si has copiado un enlace normal o una imagen:

1. **Obtener portapapeles**
2. **Si** el portapapeles contiene una URL que termina en `.jpg`, `.png`, `.gif`, `.webp`, etc.
   - → Usar flujo de `imageUrl` (Atajo 2)
3. **Si no** (enlace normal o texto)
   - → Usar flujo de enlace normal (Atajo 1)

Para esto necesitas usar **Si** → **Condición** en la app Atajos.

---

## Cómo queda la URL al ejecutar (enlaces)

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
