# Memoria inteligente gratuita de Crack

La barra **Buscar cualquier cosa…** permite encontrar elementos de la Biblioteca y hacer preguntas con **Preguntar a mi biblioteca**. No incorpora hábitos, objetivos ni revisiones.

## Proveedores y cuotas

- **Groq** (`openai/gpt-oss-120b`) redacta respuestas con las fuentes recuperadas; en Groq Free no se cargan costes al agotar la cuota: la petición devuelve 429.
- **Cloudflare Workers AI** (`@cf/baai/bge-m3`) genera vectores semánticos multilingües de 1.024 dimensiones usando la asignación gratuita diaria.
- **Supabase** almacena las notas, URLs, transcripciones y vectores; la función de búsqueda es `SECURITY INVOKER`, con RLS por usuario.
- Si Cloudflare no está configurado, el buscador y el asistente pueden recuperar coincidencias textuales. Si Groq no está configurado, el buscador funciona pero la interfaz avisa de que faltan las credenciales.

## Activación

1. Obtén la API key gratuita en https://console.groq.com/keys y crea un token de Cloudflare Workers AI desde https://dash.cloudflare.com/ (con permisos mínimos de inferencia AI para tu cuenta).
2. Configura en **Vercel → Crack → Settings → Environment Variables**, para producción:
   - `GROQ_API_KEY`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
3. Vuelve a desplegar la aplicación para activar las variables.
4. En Crack, abre **Buscar cualquier cosa…** sin escribir nada y pulsa **Indexar**. Procesa la biblioteca en tandas, de forma autenticada y sin incluir contenido marcado Extra.
5. Escribe una pregunta y pulsa **Preguntar a mi biblioteca**. La respuesta incluye una lista pulsable de las fuentes recuperadas.

**Aviso:** los fragmentos recuperados de la biblioteca viajan desde el servidor a Groq para redactar la respuesta; los textos indexables se envían a Cloudflare para generar vectores. Los elementos Extra se excluyen de ambos flujos.

## Límites y alcance real

- Los enlaces guardados contienen metadatos y/o una URL, pero este asistente **no navega ni extrae automáticamente la página del enlace**. Tampoco transcribe ni aplica OCR a los documentos que aún no tengan contenido textual.
- Las respuestas solo pueden basarse en título, descripción, notas y transcripciones ya almacenadas. La interfaz enlaza a los elementos originales.
- Las funciones antiguas de clasificación/transcripción en `lib/ai.ts` siguen usando los proveedores previos; este cambio sustituye **únicamente la búsqueda semántica y la respuesta del asistente**, no esos servicios.
- Los límites gratuitos dependen de cada proveedor. Las claves permanecen exclusivamente del lado servidor.
