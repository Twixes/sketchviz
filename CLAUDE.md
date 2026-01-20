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
- **Storage**: Supabase Storage (private buckets with RLS)
- **AI**: Google Gemini and Black Forest Labs FLUX via AI SDK
  - Pro models (Google Gemini): `google/gemini-3-pro-image-preview` (2K/4MP, 14 credits), `google/gemini-3-pro-image-preview/4k` (4K/16MP, 24 credits)
  - Lite models (BFL FLUX): `bfl/flux-2-klein-9b` (1K/1MP, 3 credits), `bfl/flux-2-klein-9b/1.5k` (1.5K/2MP, 5 credits) - max dimension 2048
  - Titling: `gemini-flash-lite-latest`
- **Payments**: Polar SDK (credit system, subscriptions)
- **Analytics**: PostHog (event tracking, AI tracing, error tracking)
- **Code Quality**: Biome (linting + formatting with Next.js/React domains), Lefthook (pre-commit hooks)
- **Content**: react-markdown (Markdown rendering)

### Core Flow
1. User uploads SketchUp render → uploaded to Supabase Storage (`input-images` bucket) via `/api/upload`
2. User optionally uploads up to 3 reference images for materials/textures/style (stored in `input-images` bucket)
3. User adjusts parameters:
   - Lighting (outdoor: sunny/overcast/night, indoor: all_on/all_off, or custom text)
   - Quality/model selection (Pro 4K/2K via Gemini, Lite 4K/2K via FLUX)
   - Aspect ratio (required if using reference images with a Google model)
   - Optional edit description for specific requests
4. User clicks generate → `/api/generate` validates request and checks credits via Polar
5. `/api/generate` fetches images from Supabase Storage, sends to AI model with constructed prompt (base + lighting + edit description + reference images)
6. AI returns photorealistic image → stored in Supabase Storage (`output-images` bucket)
7. Credits deducted via Polar (see model credit costs above)
8. Thread + generation records created in Supabase with user params stored as JSONB (authenticated users only)
9. Thread title auto-generated in background via Gemini Flash
10. User can view thread history at `/threads` and individual generations at `/threads/[thread_id]`

### Key Architectural Patterns

**Client State (Zustand)**
- Stores in `src/stores/` manage client-side UI state
- Uses persist middleware selectively for user preferences
- Single source of truth for workflow state

**Server State (TanStack Query)**
- Mutation hooks in `src/hooks/` handle API calls (uploads, generation)
- Query hooks fetch server data (credits, user info)
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
- See `supabase/migrations/` for schema definitions

**Payments & Credits (Polar SDK)**
- `lib/polar.ts`: Polar client configuration
- Credit costs defined in `lib/credits.ts`
- Billing API routes in `/api/billing/` for checkout and portal
- Credits checked and deducted in `/api/generate` before AI generation

**Analytics (PostHog)**
- `lib/posthog/server.ts`: Server-side PostHog client with AI tracing
- `src/instrumentation-client.ts`: Client-side PostHog initialization
- AI calls wrapped with `withTracing()` for observability
- Event tracking for generation steps and error capture

**AI Integration**
- `lib/ai.ts`: Core AI functions for image generation and titling
- Supports Google Gemini (Pro) and Black Forest Labs FLUX (Lite) models
- Prompt engineering: base prompt + conditional parameters + reference images
- BFL models require explicit width/height calculated from aspect ratio (`lib/aspect-ratio.ts`)
- Set `SKIP_AI=1` in `.env.local` to skip AI calls (returns "deep fried" input image for testing)

**Validation**
- Zod schemas in `lib/schemas.ts` validate API inputs
- Type safety flows from schemas to React components via TypeScript inference

### File Structure Conventions
- `src/app/`: Next.js App Router pages and API routes
  - Page-specific components are co-located with their routes
  - API routes in `/api/` subdirectories
- `src/components/`: Shared React components (**flat structure, no sub-folders**)
- `src/hooks/`: Custom React hooks (TanStack Query mutations/queries, auth callbacks)
- `src/stores/`: Zustand stores for client-side state
- `src/lib/`: Shared utilities and integrations
  - `supabase/`: Supabase client setup (client/server patterns)
  - `components/ui/`: Reusable UI primitives (Radix UI based)
  - `posthog/`: Analytics integration
- `src/types/`: TypeScript type definitions
- `src/icons/`: SVG icons (imported as React components)

### UI Components

We should always use standard frontend components from `src/lib/components/ui/` when possible. In particular, raw `<button>` elements should never be used. Instead, `Button` should be adapted to the use case.

### Design Philosophy: MDM Neon Aesthetic

The visual identity is inspired by **Marszałkowska Dzielnica Mieszkaniowa (MDM)** – Warsaw's iconic socialist realist district known for its stylish neon signage from the 1950s-60s. This influence creates a warm, retro-futuristic aesthetic that celebrates the real world through structured, geometric forms.

**Core Principles:**
- **Structured, not random**: Geometric patterns (grids, defined lines) over blurry blotches
- **Mature and sophisticated**: No childish shapes – use diamonds, arrows, spirals, crescents, zigzags
- **Warm neon glow**: Soft colors with multi-layer drop-shadow effects simulating neon tubes
- **Social realist influence**: Shapes that feel intentional, architectural, and purposeful

**Color Palette** (`globals.css`):
- `--neon-pink`: #ff6b9d (warm rose)
- `--neon-coral`: #ff8a65 (warm orange)
- `--neon-turquoise`: #4dd0e1 (cool accent)
- `--neon-violet`: #b388ff (soft purple)
- `--neon-amber`: #ffab40 (warm gold)
- Each color has a `-glow` variant for layered effects

**Neon Shapes** (`src/icons/neon/`):
- `arrow.svg` – Directional, purposeful (MDM signage style)
- `diamond.svg` – Geometric rhombus (classic neon motif)
- `zigzag.svg` – Energy/progress waveform
- `spiral.svg` – Elegant flourish
- `crescent.svg` – Curved arc (cafe/bar neon style)

**Background System** (`.neon-shell` in `globals.css`):
- Small dot grid (22px) for subtle texture
- Large geometric grid (280px) with neon-tinted lines
- Corner accent gradients – linear and defined, not blurry radial blobs

**Animation Philosophy** (`src/lib/neon-animations.ts`):
- Smooth only – no flicker effects
- `NEON_BREATHING`: Gentle opacity pulse (3s cycle)
- `NEON_DRIFT`: Slow positional float (20s cycle)
- Components use `use-prefers-reduced-motion` hook to respect user preferences

**Component Usage:**
```tsx
<NeonShape
  shape="diamond"
  color="pink"
  size="lg"
  animation="breathing"
  className="absolute -left-10 -top-8"
/>
```

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
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase anonymous/public key
- `GOOGLE_GENERATIVE_AI_API_KEY`: Google AI Studio API key for Gemini (Pro models)
- `BFL_API_KEY`: Black Forest Labs API key for FLUX (Lite models)
- `POLAR_ACCESS_TOKEN`: Polar API access token for credit/billing management
- `NEXT_PUBLIC_POSTHOG_API_KEY`: PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST`: PostHog instance host URL

**Optional:**
- `SKIP_AI=1`: Skip AI calls during development (returns "deep fried" input image)

## Working with Supabase
- Local Supabase CLI is configured (at `supabase/config.toml`)
- Migrations are manually written SQL files in `supabase/migrations/`
- Apply migrations via Supabase dashboard or CLI: `supabase db push`
- RLS policies are defined in migration files alongside table schemas

## File Naming Conventions
- **Components**: `PascalCase.tsx`
- **Hooks**: `kebab-case.ts` with `use-` prefix
- **Stores**: `kebab-case.ts` with `-store` suffix
- **Utilities**: `kebab-case.ts`
- **Pages**: Next.js conventions (`page.tsx`, `layout.tsx`, `not-found.tsx`)
- **API routes**: `route.ts` in feature directories

## Component Organization Principles
- **Flat structure**: All shared components in `src/components/` with **no sub-folders**
- **Co-location**: Page-specific components live in their route directory
- **UI primitives**: Reusable UI components in `src/lib/components/ui/`
- **Single responsibility**: Each component focuses on one clear purpose
- **Composition**: Complex UIs built by composing simpler components

## Code Quality
- Biome handles both linting and formatting (no ESLint/Prettier)
- Pre-commit hook runs `biome check --write` on staged files via Lefthook with auto-staging of fixes
- Configuration: `biome.json` (includes Next.js and React recommended rules via domains), `lefthook.yaml`
- VCS integration enabled for Git with `.gitignore` support
- Auto-organize imports enabled via assist actions
- Custom rules: `noUnknownAtRules` disabled for Tailwind CSS compatibility
