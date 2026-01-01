# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages, layouts, and route handlers.
- `src/components`: Reusable UI components (React, TypeScript).
- `src/lib`: Shared utilities (API helpers, formatting, storage).
- `src/hooks`: Custom React hooks (name with `use*`).
- `src/stores`: Zustand state stores.
- `src/content`: Static copy, prompts, or markdown content used by the UI.
- `public`: Static assets served at the site root (images, icons).
- `supabase`: Supabase config and migrations, if applicable.

## Architecture Overview
- Next.js App Router app using Zustand for client state and TanStack Query for server state.
- Core flow: upload images → `/api/upload` → generate via `/api/generate` → store outputs in Supabase Storage.
- Credits and billing handled via Polar; auth uses Supabase Google OAuth.

## Build, Test, and Development Commands
- `pnpm dev`: Run the Next.js dev server at `http://localhost:3000`.
- `pnpm build`: Produce the production build.
- `pnpm start`: Serve the production build locally.
- `pnpm lint`: Run Biome checks for linting/format drift.
- `pnpm format`: Auto-format code with Biome.

## Coding Style & Naming Conventions
- Use TypeScript for all new code in `src/`.
- Follow Biome defaults for formatting; run `pnpm format` before committing.
- Prefer functional React components and hooks over classes.
- Component files use PascalCase (e.g., `HeroCard.tsx`).
- Hooks use `use` prefix (e.g., `useUploadStatus.ts`).
- Keep new assets in `public/` or `src/icons/` with descriptive names.

## Testing Guidelines
- No automated test suite is configured yet.
- Validate changes with `pnpm lint` and manual UI checks.
- If you add tests later, colocate them near the feature (e.g., `src/components/HeroCard.test.tsx`).

## Commit & Pull Request Guidelines
- Commit messages follow short imperative sentences (e.g., “Fix upload flow”).
- Keep commits scoped to a single change when possible.
- PRs should include a clear summary, testing notes, and screenshots for UI changes.
- Link relevant issues or product tickets when available.

## Configuration & Secrets
- Copy `.env.example` to `.env.local` and fill values before running locally.
- Required keys include Supabase URLs/keys, `GOOGLE_GENERATIVE_AI_API_KEY`, and `BLOB_READ_WRITE_TOKEN`.
- Never commit secrets; use environment variables only.
