# SketchViz

Turn SketchUp/Revit renders into photorealistic images using Google Gemini. Upload a rough render, adjust lighting parameters, and get a polished visualization in seconds.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (auth + storage + RLS), Google Gemini 3 Pro/2.5 Flash, Polar.sh (credits), PostHog (analytics), TailwindCSS 4.

## Setup

```bash
pnpm install
cp .env.example .env.local
```

### Required environment variables

1. **Supabase** (auth + storage):
   - Create a project at [supabase.com](https://supabase.com/dashboard)
   - Get credentials from Project Settings → API
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   ```

2. **Google Gemini** (AI generation):
   - Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   ```
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key
   ```

3. **Polar.sh** (credit billing):
   - Get access token from [polar.sh](https://polar.sh/)
   ```
   POLAR_ACCESS_TOKEN=your_access_token
   ```

4. **PostHog** (analytics):
   - Get credentials from [posthog.com](https://posthog.com/)
   ```
   NEXT_PUBLIC_POSTHOG_API_KEY=your_api_key
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```

### Optional: Google OAuth
- Enable Google provider in Supabase Authentication → Providers
- Set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` in `.env.local`

### Run
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
