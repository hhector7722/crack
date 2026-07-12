# Crack

PWA asistente personal de bolsillo. Captura notas, imágenes y audios con transcripción y clasificación IA.

## Stack

- Next.js 16 (App Router)
- TypeScript + Tailwind CSS
- Supabase (Postgres, Auth, Storage, RLS)
- OpenAI (Whisper + GPT-4o-mini) con fallback silencioso a Gemini
- Vercel

## Setup local

### 1. Clonar e instalar

```bash
npm install
npm run generate:icons
cp .env.example .env.local
```

### 2. Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. SQL Editor → ejecutar [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) y [`supabase/migrations/002_share_tokens.sql`](supabase/migrations/002_share_tokens.sql)
3. Storage → verificar bucket `crack-files` (privado)
4. Authentication → Email provider activado
5. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (dev) o tu dominio Vercel (prod)
   - Redirect URLs:
     - `http://localhost:3000/auth/confirm`
     - `http://localhost:3000/auth/callback`
     - `https://tu-dominio.vercel.app/auth/confirm`
     - `https://tu-dominio.vercel.app/auth/callback`
6. Authentication → Email Templates → **Magic Link** — sustituir el contenido por:

```html
<h2>Crack — Iniciar sesión</h2>
<p>Tu código: <strong>{{ .Token }}</strong></p>
<p>O pulsa este enlace:</p>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Entrar en Crack</a></p>
```

El código de 6 dígitos funciona en cualquier navegador. El enlace usa `token_hash` (sin PKCE).

### 3. Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
# Opcional: GEMINI_MODEL=gemini-2.5-flash
OWNER_EMAIL=tu@email.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Solo el email en `OWNER_EMAIL` puede iniciar sesión (magic link).

### 4. Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Deploy en Vercel

1. Importar repositorio
2. **Environment Variables** (Settings → Environment Variables) — marcar Production, Preview y Development:

| Variable | Ejemplo |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abcdefgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` (anon public) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` (service_role) |
| `OPENAI_API_KEY` | `sk-...` |
| `GEMINI_API_KEY` | `AI...` (fallback automático si OpenAI sin créditos) |
| `OWNER_EMAIL` | `tu@email.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://crack.vercel.app` |

3. **Redeploy** tras añadir variables (obligatorio — `NEXT_PUBLIC_*` se embeben en build)
4. Verificar: `https://TU-DOMINIO/api/health` debe devolver `"supabase": "ok"`

### Supabase → Authentication → URL Configuration

- **Site URL:** `https://TU-DOMINIO.vercel.app`
- **Redirect URLs:**
  - `https://TU-DOMINIO.vercel.app/auth/confirm`
  - `https://TU-DOMINIO.vercel.app/auth/callback`
  - `http://localhost:3000/auth/confirm`
  - `http://localhost:3000/auth/callback`

## Límite de emails (rate limit)

El plan gratuito de Supabase limita magic links (~3–4 emails/hora). Si ves *email rate limit exceeded*:

1. Espera 30–60 minutos
2. No pulses el botón varias veces seguidas (hay cooldown de 60s en la app)
3. Opcional: configura **SMTP propio** en Supabase → Authentication → SMTP Settings (Resend, SendGrid, etc.)

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `email rate limit exceeded` | Demasiados intentos | Esperar o SMTP propio |
| `fetch failed` (producción) | Env vars mal en Vercel o proyecto pausado | Revisar `/api/health`, redeploy |
| `PKCE code verifier not found` | Enlace abierto en otro browser | Usar código de 6 dígitos en login |
| `ENOTFOUND xxx.supabase.co` | URL Supabase incorrecta | Copiar URL real del dashboard |

## Instalar en iPhone

1. Abrir la app en Safari
2. Compartir → **Añadir a pantalla de inicio**
3. La app se abre en modo standalone

## Compartir enlaces desde otras apps

### iPhone (Atajos — gratis)

1. Ejecuta la migración `002_share_tokens.sql` y configura `SUPABASE_SERVICE_ROLE_KEY` en Vercel
2. En Crack → **Perfil** → **Generar token**
3. Crea los atajos siguiendo [`docs/ios-shortcuts.md`](docs/ios-shortcuts.md):
   - **Guardar enlace en Crack** → enlaces permanentes (`/api/share-link`)
   - **Enviar a Drop** → chat temporal 48 h (`/api/drop`)

Tras configurarlos, ambos aparecen en el menú Compartir de Safari, YouTube, etc.

### Android (PWA instalada)

Con la PWA instalada, Crack puede aparecer directamente en Compartir (manifest `share_target` → `/share`).

## Estructura

| Ruta | Descripción |
|------|-------------|
| `/` | Feed cronológico (pinneados arriba) |
| `/notes` | Solo notas de texto |
| `/media` | Imágenes |
| `/audio` | Audios con transcripción |
| `/api/transcribe` | Whisper (es) |
| `/api/classify` | GPT-4o-mini clasificación JSON |

## Captura

Pulsa **+** en el TabBar:

- **Grabar voz** → transcribe → clasifica → guardar
- **Nota de texto** → autoguardado al cerrar
- **Imagen** → cámara/galería → Storage

Swipe izquierda en una card para eliminar (con confirmación).
