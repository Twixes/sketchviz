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

# Lint and check code with Biome (read-only)
pnpm lint

# Format code with Biome
pnpm format
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React 19, TailwindCSS 4, Motion (Framer Motion), Radix UI (Select, Tooltip, Popover, Icons, but feel free to add more)
- **State Management**: Zustand (client state), TanStack Query (server state)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Storage**: Vercel Blob
- **AI**: Google Gemini via AI SDK
  - Models: `gemini-3-pro-image-preview` (generation 2K, 14 credits), `gemini-3-pro-image-preview/4k` (generation 4K, 24 credits), `gemini-2.5-flash-image-preview` (generation, 4 credits), `gemini-flash-lite-latest` (titles)
- **Payments**: Polar SDK (credit system, subscriptions)
- **Analytics**: PostHog (event tracking, AI tracing, error tracking)
- **Code Quality**: Biome (linting + formatting with Next.js/React domains), Lefthook (pre-commit hooks)
- **Content**: react-markdown (Markdown rendering)

### Core Flow
1. User uploads SketchUp render → uploaded to Vercel Blob via `/api/upload`
2. User optionally uploads up to 3 reference images for materials/textures/style
3. User adjusts parameters:
   - Lighting (outdoor: sunny/overcast/night, indoor: all_on/all_off, or custom text)
   - AI model selection (gemini-3-pro or gemini-2.5-flash)
   - Aspect ratio (if using reference images, required due to Gemini limitations)
   - Optional edit description for specific requests
4. User clicks generate → `/api/generate` validates request and checks credits via Polar
5. `/api/generate` fetches blobs, sends to Gemini with constructed prompt (base + lighting + edit description + reference images)
6. Gemini returns photorealistic image → stored in Vercel Blob
7. Credits deducted via Polar (14 for gemini-3-pro, 4 for gemini-2.5-flash)
8. Thread + generation records created in Supabase with user params stored as JSONB (authenticated users only)
9. Thread title auto-generated in background via Gemini Flash
10. User can view thread history at `/threads` and individual generations at `/threads/[thread_id]`

### Key Architectural Patterns

**Client State (Zustand)**
- `upload-store.ts` manages upload/generation UI state
  - Image sources (inputSrc, outputSrc, blobUrl)
  - Reference images (array with up to 3 images, with add/remove/update methods)
  - UI parameters (outdoorLight, indoorLight, editDescription, model, aspectRatio)
  - Loading states (isUploading, isGenerating, isBusyForUser)
- Uses persist middleware to save only `model` selection to localStorage
- Single source of truth for the main workflow state

**Server State (TanStack Query)**
- `use-upload-mutation.ts`: handles main image upload to Vercel Blob
- `use-reference-upload-mutation.ts`: handles reference image uploads to Vercel Blob
- `use-generate-mutation.ts`: triggers AI generation via `/api/generate`
- `use-credits-query.ts`: fetches user's available credits from `/api/credits`
- Mutations update Zustand store on success/error
- Auth navigation hooks: `use-sign-in-callback.ts`, `use-sign-out-callback.ts`

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

**Payments & Credits (Polar SDK)**
- `lib/polar.ts`: Polar client configuration for credit meter and subscriptions
- Credit costs defined in `lib/credits.ts`: 14 credits for gemini-3-pro (2K), 24 credits for gemini-3-pro/4k (4K), 4 credits for gemini-2.5-flash
- `/api/billing/checkout`: Polar checkout route for purchasing credits
- `/api/billing/portal`: Polar customer portal for managing subscriptions
- `/api/credits`: Fetches user's available credits from Polar
- Credits checked and deducted in `/api/generate` before AI generation

**Analytics (PostHog)**
- `lib/posthog/server.ts`: Server-side PostHog client with AI tracing wrapper
- `instrumentation-client.ts`: Client-side PostHog initialization
- AI calls wrapped with `withTracing()` for observability
- Event tracking for generation steps and error capture
- User identification via `posthogDistinctId`

**AI Integration**
- `lib/ai.ts` exports two functions:
  - `generateVisualizationImage()`: main photorealistic transformation with multi-model support
    - Accepts: image buffer, lighting params, edit description, model selection, reference images (up to 3), aspect ratio
    - Returns: generated image as base64 + Uint8Array
  - `titleVisualizationImage()`: generates descriptive title from input image using gemini-flash-lite-latest
- Prompt engineering: base prompt + conditional light parameters + reference image instructions + optional edit description
- Model selection: supports `google/gemini-3-pro-image-preview` and `google/gemini-2.5-flash-image-preview`
- Reference images added to content array before main image
- Aspect ratio passed via Google provider options when specified
- Set `SKIP_AI=1` in `.env.local` to use test data instead of calling Gemini

**Validation**
- Zod schemas in `lib/schemas.ts` validate API inputs
- Schemas include: `modelSchema`, `aspectRatioSchema`, `outdoorLightSchema`, `indoorLightSchema`, `generateRequestSchema`
- Custom validation via `superRefine`: aspect ratio required when reference images provided (Gemini limitation)
- Type safety flows from schemas to React components via TypeScript inference
- `UserParams` type derived from schema (excludes ephemeral blobUrl) for database storage

### File Structure Conventions
- `src/app/`: Next.js App Router pages and API routes
  - Pages: `/` (home), `/pricing`, `/privacy`, `/terms`, `/auth/signin`, `/auth/success`, `/threads`, `/threads/[thread_id]`
  - API routes: `/api/upload`, `/api/generate`, `/api/credits`, `/api/billing/checkout`, `/api/billing/portal`, `/auth/callback`
  - Thread detail components: `GenerationCard.tsx`, `GenerationImage.tsx`, `GenerationParameters.tsx`, `ThreadHeader.tsx`
  - Pricing components: `PricingCard.tsx`, `PricingHeader.tsx`, `PricingContactCTA.tsx`
- `src/components/`: React components (18 files, **no sub-folders**)
  - Core: `UploadDropzone.tsx`, `ControlPanel.tsx`, `BeforeAfterComparison.tsx`, `Header.tsx`, `Hero.tsx`, `HeroFeatures.tsx`, `Examples.tsx`
  - Configuration: `LightSelector.tsx`, `AspectRatioSelector.tsx`, `ModelSelector.tsx`, `ReferenceImageUpload.tsx`
  - Utility: `SessionProvider.tsx`, `QueryProvider.tsx`, `MarkdownContent.tsx`, `Footer.tsx`, `Hint.tsx`, `FunkyBackground.tsx`, `FunkyBackgroundMini.tsx`
- `src/hooks/`: Custom React hooks (6 files)
  - Query hooks: `use-credits-query.ts`, `use-generate-mutation.ts`, `use-upload-mutation.ts`, `use-reference-upload-mutation.ts`
  - Auth hooks: `use-sign-in-callback.ts`, `use-sign-out-callback.ts`
- `src/stores/`: Zustand stores (1 file: `upload-store.ts`)
- `src/lib/`: Shared utilities and integrations
  - Core utilities: `ai.ts`, `schemas.ts`, `constants.ts`, `credits.ts`, `aspect-ratio.ts`, `animation-constants.ts`, `polar.ts`
  - `supabase/`: Supabase client setup (client/server/proxy patterns)
  - `components/ui/`: Reusable UI primitives (`Button.tsx`, `Select.tsx` - Radix UI based)
  - `posthog/`: Analytics integration (`server.ts`)
- `src/types/`: TypeScript type definitions
- `src/icons/`: SVG icons (imported as React components)
- `src/content/`: Content files (empty, reserved for future use)
- `src/test-data/`: Test data for SKIP_AI mode development

### Asset Handling
- **SVG files**: imported as React components via `@svgr/webpack`
  - Example: `import GoogleIcon from "@/icons/google.svg"` → use as `<GoogleIcon />`
- **Markdown files**: loaded as raw strings via `raw-loader`
- Both configured in `next.config.ts` for Turbopack
- Images: Next.js image optimization disabled (`unoptimized: true`)

## Environment Variables
See `.env.example` for required variables. Key ones:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous/public key
- `GOOGLE_GENERATIVE_AI_API_KEY`: Google AI Studio API key for Gemini
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token
- `POLAR_ACCESS_TOKEN`: Polar API access token for credit/billing management
- `NEXT_PUBLIC_POSTHOG_API_KEY`: PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST`: PostHog instance host URL

**Optional:**
- `SKIP_AI=1`: Skip AI calls during development (uses test data from `src/test-data/`)

## Working with Supabase
- Local Supabase CLI not configured (no `supabase/config.toml`)
- Migrations are manually written SQL files in `supabase/migrations/`
- Apply migrations via Supabase dashboard or CLI: `supabase db push`
- RLS policies are defined in migration files alongside table schemas

## File Naming Conventions
- **Components**: `PascalCase.tsx` (e.g., `ControlPanel.tsx`, `BeforeAfterComparison.tsx`)
- **Hooks**: `kebab-case.ts` with `use-` prefix (e.g., `use-upload-mutation.ts`, `use-credits-query.ts`)
- **Stores**: `kebab-case.ts` (e.g., `upload-store.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `aspect-ratio.ts`, `animation-constants.ts`)
- **Pages**: Next.js conventions (`page.tsx`, `layout.tsx`, `not-found.tsx`)
- **API routes**: `route.ts` in feature directories

## Component Organization Principles
- **Flat structure**: All shared components in `src/components/` with **no sub-folders**
- **Co-location**: Page-specific components live in their route directory (e.g., `/threads/[thread_id]/GenerationCard.tsx`)
- **UI primitives**: Reusable UI components in `src/lib/components/ui/` (e.g., `Button.tsx`, `Select.tsx`)
- **Single responsibility**: Each component focuses on one clear purpose
- **Composition**: Complex UIs built by composing simpler components (e.g., `ControlPanel` composes `LightSelector`, `ModelSelector`, `AspectRatioSelector`)

## Code Quality
- Biome handles both linting and formatting (no ESLint/Prettier)
- Pre-commit hook runs `biome check --write` on staged files via Lefthook with auto-staging of fixes
- Configuration: `biome.json` (includes Next.js and React recommended rules via domains), `lefthook.yaml`
- VCS integration enabled for Git with `.gitignore` support
- Auto-organize imports enabled via assist actions
- Custom rules: `noUnknownAtRules` disabled for Tailwind CSS compatibility
