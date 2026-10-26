# PDF consultables en Crack

## Flujo de lectura

- Nuevo PDF subido desde el selector de archivos: al guardar el elemento se llama automáticamente a `/api/pdf/index`, que descarga el objeto privado desde Supabase con el **token de la sesión**, extrae texto de cada página con PDF.js y lo guarda en `pdf_pages`.
- PDF importado desde Compartir/Drop: usa la misma indexación después de guardar el archivo como elemento.
- Biblioteca histórica: abre Buscar (sin escribir nada), pulsa **Leer PDFs**. Se procesan los archivos propios pendientes; si alguna página es escaneada, Crack la renderiza localmente y ejecuta **Tesseract.js** en el navegador, en español e inglés. La primera carga de los modelos OCR requiere conexión a Internet, pero no utiliza una API de pago ni envía las imágenes a un proveedor OCR.
- Si se interrumpe, pulsa **Leer PDFs** de nuevo: se conservan las páginas guardadas y no se repite OCR completado.
- Límite actual por archivo: 60 MB y 150 páginas. PDFs cifrados o dañados se notifican como errores.

## Preguntas y referencias

El asistente ejecuta `search_pdf_pages_v1` junto a la recuperación habitual de notas. Incluye el texto real de las páginas relevantes dentro del contexto de Groq, identifica cada fragmento por documento y página, y responde con referencias «[N] (PDF, pág. X)». Las fuentes son pulsables y abren un enlace privado firmado al PDF en esa página. En preguntas de resumen extenso, se seleccionan páginas representativas; el asistente no debe afirmar que ha leído todo el archivo si solo ha usado una muestra.

## Privacidad y coste

- Supabase Storage sigue **privado**. `pdf_pages` tiene RLS por `auth.uid()`, referencia al elemento propietario y excluye en todas las operaciones la categoría Extra. La función de búsqueda es SECURITY INVOKER y solo ejecutable por authenticated.
- `/api/pdf/index` verifica la sesión, la pertenencia del PDF, la ruta de Storage y el tipo real de bytes PDF; nunca utiliza `service_role`. El OCR de imágenes queda en el dispositivo. Se envían a Groq **únicamente las páginas textuales recuperadas para la pregunta**, del mismo modo que las notas, con la clave gratuita de Groq ya configurada.
- Al borrar el elemento `items`, se eliminan sus páginas mediante FK ON DELETE CASCADE.
- Sin servicios de OCR de pago ni cambios en cuotas o facturación; OCR puede tardar o no reconocer perfectamente tablas manuscritas/escaneos malos.

## Verificación

```bash
node --experimental-strip-types --test lib/pdf-extract.test.mjs lib/knowledge-retrieval.test.mjs
npx tsc --noEmit
npx eslint lib/pdf-extract.ts lib/pdf-index-client.ts app/api/pdf/index/route.ts app/api/pdf/pages/route.ts
npx next build --webpack
```

## Limitaciones conocidas

Los PDFs anteriores no se leen en segundo plano mientras no haya una sesión de usuario navegando: hay que pulsar **Leer PDFs** una vez. El texto de páginas escaneadas depende de la calidad de OCR local y del dispositivo; mantener Crack abierto durante la primera indexación. El sistema conserva número de página y documentos originales sin modificarlos. Los nombres, títulos o enlaces por sí solos no sustituyen a páginas extraídas.

## Visor completo y archivos compartidos desde iPhone

- Los archivos PDF nunca se transforman en imágenes de portada al subirlos desde Archivos o al enviarlos a Drops: se guarda el PDF binario original en Supabase Storage.
- En el detalle del archivo, el visor de PDF usa PDF.js en vez del `iframe` nativo de iOS. Enseña **Página N de M**, flechas anterior/siguiente, botones **Abrir original** y **Descargar** y acceso a **Leer todas las páginas** para indexación.
- Si un atajo iOS indica un nombre `.pdf` pero entrega bytes de un JPEG de portada, Crack lo rechaza con instrucciones de compartir el PDF original desde Archivos; si los bytes son PDF pero el MIME es incorrecto, se corrigen automáticamente y se guardan como PDF.
- Para confirmar que el archivo es íntegro, abre el detalle y comprueba el total de páginas. El contador proviene del documento real en Storage, no del índice de texto; un documento puede mostrar todas sus páginas aunque siga pendiente la lectura OCR para el asistente.
