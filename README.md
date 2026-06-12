# Crack

PWA asistente personal de bolsillo. Captura notas, imágenes y audios con transcripción y clasificación IA.

## Stack

- Next.js 16 (App Router)
- TypeScript + Tailwind CSS
- Supabase (Postgres, Auth, Storage, RLS)
- OpenAI (Whisper + GPT-4o-mini)
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
2. SQL Editor → ejecutar [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql)
3. Storage → verificar bucket `crack-files` (privado)
4. Authentication → Email provider activado
5. Authentication → URL Configuration:
   - Site URL: `http://localhost:3000` (dev) o tu dominio Vercel (prod)
   - Redirect URLs: `http://localhost:3000/auth/callback`, `https://tu-dominio.vercel.app/auth/callback`

### 3. Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
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
2. Añadir las mismas variables de entorno (cambiar `NEXT_PUBLIC_SITE_URL` al dominio Vercel)
3. Deploy

## Instalar en iPhone

1. Abrir la app en Safari
2. Compartir → **Añadir a pantalla de inicio**
3. La app se abre en modo standalone

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
