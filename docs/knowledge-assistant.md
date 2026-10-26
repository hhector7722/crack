# Memoria inteligente gratuita de Crack

La barra **Buscar cualquier cosa…** permite encontrar elementos de la Biblioteca y hacer preguntas con **Preguntar a mi biblioteca**. No incorpora hábitos, objetivos ni revisiones.

## Proveedores y cuotas

- **Groq** (`openai/gpt-oss-120b`) redacta respuestas con las fuentes recuperadas; en Groq Free no se cargan costes al agotar la cuota: la petición devuelve 429.
- **Cloudflare Workers AI** (`@cf/baai/bge-m3`) genera vectores semánticos multilingües de 1.024 dimensiones usando la asignación gratuita diaria.
- **Supabase** almacena las notas, URLs, transcripciones y vectores; la función de búsqueda es `SECURITY INVOKER`, con RLS por usuario.
- **Cloudflare es opcional**: el asistente analiza títulos, textos, etiquetas y descripciones directamente en Supabase, y utiliza el mismo Groq gratuito para una segunda selección semántica del catálogo si las palabras no coinciden. No es necesario crear embeddings para empezar. La búsqueda de enlaces normal sigue siendo textual sin Cloudflare.
- Si Groq no está configurado, la búsqueda normal sigue funcionando pero las respuestas de IA avisan de que falta la clave.

## Activación

1. Obtén una API key gratuita en https://console.groq.com/keys. **No necesitas Cloudflare para el asistente**. Solo si deseas indexación vectorial opcional, crea un token de Cloudflare Workers AI con permisos mínimos.
2. Configura en **Vercel → Crack → Settings → Environment Variables**, para producción:
   - `GROQ_API_KEY`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
3. Vuelve a desplegar la aplicación para activar las variables.
4. Escribe una pregunta y pulsa **Preguntar a mi biblioteca**. La respuesta incluye fuentes pulsables y permite **preguntas de seguimiento** sin cerrar el buscador.
5. Si Cloudflare está habilitado, verás también **Indexar** al abrir el buscador sin texto, para añadir vectores opcionales. Si no está habilitado, ese botón se oculta.

**Aviso:** los fragmentos de biblioteca necesarios para responder viajan desde el servidor a Groq; en casos difíciles también viajan los títulos y resúmenes del catálogo para seleccionar fuentes. Los textos solo se envían a Cloudflare si se configura expresamente la indexación. Los elementos **Extra se excluyen siempre**, aun cuando esa categoría esté desbloqueada temporalmente.

## Límites y alcance real

- Los enlaces guardados contienen metadatos y/o una URL, pero este asistente **no navega ni extrae automáticamente la página del enlace**. Tampoco transcribe ni aplica OCR a los documentos que aún no tengan contenido textual.
- Las respuestas solo pueden basarse en título, descripción, notas y transcripciones ya almacenadas. La interfaz enlaza a los elementos originales.
- Las funciones antiguas de clasificación/transcripción en `lib/ai.ts` siguen usando los proveedores previos; este cambio sustituye **únicamente la búsqueda semántica y la respuesta del asistente**, no esos servicios.
- Los límites gratuitos dependen de cada proveedor. Las claves permanecen exclusivamente del lado servidor.
