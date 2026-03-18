# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install        # Install dependencies
bun run dev        # Dev server at localhost:5173
bun run build      # Production build → /dist
bun run preview    # Preview production build
```

## Architecture

**SPA:** Vite + React 18, TailwindCSS 3, React Router v6 (data router API), Marked.js.

**Routing** uses `createBrowserRouter` + `RouterProvider` (not `BrowserRouter`). Routes are defined in `src/App.jsx`. The shared shell (Navbar + Footer) lives in `src/components/Layout.jsx` and uses `<Outlet />`.

**i18n** is a custom React Context (no library). `src/i18n/translations.js` holds all UI strings under `en` and `id` keys. `src/contexts/LanguageContext.jsx` exposes `useLang()` which returns `{ lang, setLang, t }`. The `t("dot.path")` helper resolves nested keys. Language is persisted to `localStorage` under `"kanazawa-lang"`, defaulting to `"en"`. All static content (news, events) is written in English only — i18n applies to UI chrome only.

**Content** is Markdown files in `src/content/{news,events}/`. Each section has an `index.json` listing items with `slug`, `title`, `date`, `author`, `excerpt` (events also support an optional `image` field). The slug must match the `.md` filename. Files are bundled at build time via `import.meta.glob` — no runtime fetches. Each `.md` file uses YAML frontmatter (`---` fenced) with the same fields. `src/utils/markdown.js` provides `loadMarkdown(type, slug)`, `loadContentList(type)`, `parseFrontmatter()`, `formatDate(dateString, lang)`, and `slugify()`.

**Prayer times** are fetched live from the Aladhan API in `src/components/PrayerTimes.jsx` using Kanazawa coordinates (lat `36.5549`, lon `136.6956`).

**Styling** uses Tailwind with a custom `primary` green palette (defined in `tailwind.config.js`). Shared utility classes `.card`, `.btn-primary`, `.section-title`, and `.markdown-content` (with full heading/list/blockquote styles) are defined as `@layer components` in `src/index.css`.

**Shared config** — mosque contact details, coordinates, and WhatsApp links are centralised in `src/config/contact.js` (`CONTACT`). Import from there rather than hardcoding values.

**SEO** — `src/hooks/useSEO.js` exports `useSEO(title, description)` (sets `document.title` and meta description) and `stripHtml(html)` (produces a plain-text excerpt ≤160 chars). Call `useSEO` at the top of every page component.

**Registration system** — `/register/:eventId` is a form page backed by a Netlify serverless function at `netlify/functions/register.mjs`. Event configs (title, sessions, SEO) live in `src/config/registrationEvents.js` — add a new entry there to enable registration for a new event. The function uses `@libsql/client`: locally it reads `APP_ENV=dev` and writes to `./local.db` (SQLite); in production it connects to Turso via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` env vars. Duplicate detection is done by normalising names (lowercase, strip diacritics, collapse spaces).

**Database migrations** — schema changes live in `scripts/migrate-db.mjs` as an ordered `MIGRATIONS` array. Applied versions are tracked in a `schema_migrations` table so each migration only runs once. `bun run migrate` runs the script; `bun run build` calls it automatically. The script is a no-op unless `RUN_MIGRATIONS=true` is set in the environment — set this in Netlify env vars before a deploy that needs schema changes, then unset it afterwards. To add a new migration, append to the `MIGRATIONS` array with a unique `version` string; never edit or reorder existing entries.

## Git Workflow

- Active development branch is `dev` — always commit and push to `dev`
- `main` is protected; changes must go through a PR from `dev` (or a feature branch) before merging
- Never push directly to `main`

## Deployment

Netlify — configured in `netlify.toml` with `bun run build`, `BUN_VERSION = "latest"`, and a `/*` → `/index.html` SPA redirect rule.

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->
