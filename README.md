# SketchViz

SketchViz turns SketchUp renders into photorealistic visualizations with a single upload. It uses AI to refine lighting, materials, and spatial depth so design teams can move from rough concept to polished visual without a long render pipeline.

## Product philosophy
- Instant visual clarity: make every concept look presentation-ready in minutes, not days.
- Design-first output: preserve the designer's intent while adding believable light and texture.
- Frictionless workflow: no accounts, no setup, no waiting on tooling.
- Trust the input: the original render is the blueprint; the AI enhances rather than replaces.
- Delight in the reveal: the transition from draft to photoreal should feel magical, not mechanical.
- UI style: Vercel-clean structure with Linear polish, Memphis-inspired accents, warm airy palette, and bold animations.

## Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com) project
- A [Google Cloud](https://console.cloud.google.com/) project with Gemini API access

### Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com/dashboard)
   - Go to Project Settings > API
   - Copy the `URL` and `anon/public` key to your `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_project_url
     NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
     ```

3. Enable Google OAuth in Supabase:
   - Go to Authentication > Providers in your Supabase dashboard
   - Enable Google provider
   - Add your Google OAuth credentials (from [Google Cloud Console](https://console.cloud.google.com/apis/credentials))
   - Add `https://<your-project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI in Google Cloud Console
   - For local development, also add `http://localhost:54321/auth/v1/callback`

4. Configure other environment variables:
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - `BLOB_READ_WRITE_TOKEN`: Get from [Vercel Blob Storage](https://vercel.com/dashboard/stores)

## Running locally
```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.
