# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run production build locally
pnpm start

# Lint code with Biome
pnpm lint

# Format code with Biome
pnpm format
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript
- **UI**: React 19, TailwindCSS 4, Motion (Framer Motion)
- **State Management**: Zustand (client state), TanStack Query (server state)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Storage**: Vercel Blob
- **AI**: Google Gemini via AI SDK (gemini-3-pro-image-preview for generation, gemini-flash-lite-latest for titles)
- **Code Quality**: Biome (linting + formatting), Lefthook (pre-commit hooks)

### Core Flow
1. User uploads SketchUp render → uploaded to Vercel Blob via `/api/upload`
2. User adjusts lighting params (outdoor/indoor) and clicks generate
3. `/api/generate` fetches blob, sends to Gemini with prompt
4. Gemini returns photorealistic image → stored in Vercel Blob
5. Thread + generation records created in Supabase (authenticated users only)
6. Thread title auto-generated in background via Gemini Flash

### Key Architectural Patterns

**Client State (Zustand)**
- `upload-store.ts` manages upload/generation UI state (input/output images, loading states, light params)
- Single source of truth for the main workflow state

**Server State (TanStack Query)**
- `use-upload-mutation.ts`: handles file upload to Vercel Blob
- `use-generate-mutation.ts`: triggers AI generation via `/api/generate`
- Mutations update Zustand store on success/error

**Authentication**
- Supabase Auth with Google OAuth
- Server-side auth via `createClient()` from `lib/supabase/server.ts`
- Client-side auth via `createClient()` from `lib/supabase/client.ts`
- Both use `@supabase/ssr` for proper cookie handling in Next.js App Router

**Database Schema**
- `threads` table: user-owned conversation threads with auto-generated titles
- `generations` table: individual image generations linked to threads
- UUIDv7 for chronological ordering
- RLS policies ensure users only access their own data
- See `supabase/migrations/20251222231950_add_threads_and_generations.sql`

**AI Integration**
- `lib/ai.ts` exports two functions:
  - `generateVisualizationImage()`: main photorealistic transformation
  - `titleVisualizationImage()`: generates descriptive title from input image
- Prompt engineering: base prompt + conditional light parameters + optional edit description
- Set `SKIP_AI=1` in `.env.local` to use test data instead of calling Gemini

**Validation**
- Zod schemas in `lib/schemas.ts` validate API inputs
- Type safety flows from schemas to React components via TypeScript inference

### File Structure Conventions
- `src/app/`: Next.js App Router pages and API routes
- `src/components/`: React components (no sub-folders)
- `src/hooks/`: Custom React hooks (mostly TanStack Query mutations)
- `src/stores/`: Zustand stores
- `src/lib/`: Shared utilities and integrations
- `src/lib/supabase/`: Supabase client setup (client/server/proxy patterns)

### SVG Handling
- SVG files are imported as React components via `@svgr/webpack`
- Configured in `next.config.ts` for Turbopack
- Example: `import GoogleIcon from "@/icons/google.svg"` → use as `<GoogleIcon />`

## Environment Variables
See `.env.example` for required variables. Key ones:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase project
- `GOOGLE_GENERATIVE_AI_API_KEY`: Google AI Studio API key
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token
- `SKIP_AI=1`: Optional flag to skip AI calls during development

## Working with Supabase
- Local Supabase CLI not configured (no `supabase/config.toml`)
- Migrations are manually written SQL files in `supabase/migrations/`
- Apply migrations via Supabase dashboard or CLI: `supabase db push`
- RLS policies are defined in migration files alongside table schemas

## Code Quality
- Biome handles both linting and formatting (no ESLint/Prettier)
- Pre-commit hook runs `biome check --write` on staged files via Lefthook
- Configuration: `biome.json`, `lefthook.yaml`
