# CopilotKit en Crack (integración de lectura)

Esta integración experimental añade la ruta `/asistente` y un acceso en la esquina superior derecha de la cabecera. No sustituye ni altera la búsqueda ni el asistente ya existentes.

## Configuración

- Node.js 20 o superior; instalar dependencias con `npm ci`.
- Mantener configurados Supabase Auth (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) y `OWNER_EMAIL`.
- Configurar `GROQ_API_KEY` **solo en el servidor**. Reutiliza la misma clave que `/api/knowledge/ask`. Se usa el modelo `openai/gpt-oss-120b` a través de la API compatible de Groq.
- No es necesaria una cuenta ni una clave de CopilotKit Intelligence. No configurar `CPK_INTELLIGENCE_API_KEY`.
- Configurar `COPILOTKIT_TELEMETRY_DISABLED=true` también en Vercel para no enviar telemetría del SDK.

## Cómo funciona

- `GET /api/copilotkit/info` descubre al agente `default`.
- `POST /api/copilotkit/agent/default/run` atiende los mensajes del frontend mediante el runtime v2.
- Solo se permite acceder al runtime con una sesión Supabase válida y correo coincidente con `OWNER_EMAIL`.
- `buscar_biblioteca` llama a la RPC existente `search_knowledge_v1` a través de la sesión autenticada y de RLS (no usa `service_role`).
- Aplica un filtro adicional para excluir la categoría **Extra** y devuelve un máximo de seis fragmentos recortados.
- Únicamente hay herramientas de lectura: ninguna herramienta crea, actualiza o elimina registros.

## Limitaciones conscientes

- Sin Intelligence, el historial de CopilotKit está en memoria de proceso. No es persistente entre despliegues, reinicios ni instancias de Vercel. **No usarlo como almacenamiento de conocimientos**.
- Las llamadas a Groq están sujetas a los límites de su plan; la gratuidad depende del proveedor, no de CopilotKit.
- El asistente usa fragmentos ya indexados. No lee automáticamente el contenido completo de una web ni documentos externos.
- Esta es una integración de prueba aislada. El buscador y `/api/knowledge/ask` siguen siendo las vías existentes y funcionales.

## Comprobación

```bash
npx tsc --noEmit
npx eslint 'app/api/copilotkit/[[...slug]]/route.ts' 'app/(app)/layout.tsx' 'app/(app)/asistente/page.tsx' components/crack-copilot.tsx
npm run build
```

Inicia sesión como propietario, abre `/asistente`, pregunta por un elemento conocido de la biblioteca y verifica que la respuesta incorpora una fuente real. Comprueba que un elemento de categoría Extra no aparece aunque su título coincida.

Si se quiere sustituir el asistente actual, antes se debe resolver la persistencia de conversación y probar la calidad de recuperación respecto a `/api/knowledge/ask`.
