# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install        # Install dependencies
bun run dev        # Dev server at localhost:5173
bun run build      # Production build → /dist
bun run preview    # Preview production build
bun run migrate    # Run DB migrations manually (requires APP_ENV=dev or Turso env vars)
```

**Local dev env** — copy `.env.example` to `.env` and set `APP_ENV=dev`. This makes the registration API write to `./local.db` (SQLite) instead of Turso. Production needs `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

## Architecture

**SPA:** Vite + React 18, TailwindCSS 3, React Router v6 (data router API), Marked.js.

**Routing** uses `createBrowserRouter` + `RouterProvider` (not `BrowserRouter`). Routes are defined in `src/App.jsx`. The shared shell (Navbar + Footer) lives in `src/components/Layout.jsx` and uses `<Outlet />`.

**i18n** is a custom React Context (no library). `src/i18n/translations.js` holds all UI strings under three keys: `en`, `id`, and `ja`. `src/contexts/LanguageContext.jsx` exposes `useLang()` which returns `{ lang, setLang, t }`. The `t("dot.path")` helper resolves nested keys; missing keys fall back to `en`, then to the raw key string. Language is persisted to `localStorage` under `"kanazawa-lang"`, defaulting to `"en"`.

**Content** lives in `src/content/{news,events}/` with language subfolders for `id` and `jp`:
```
src/content/news/
  index.json        ← English (default)
  id/index.json     ← Indonesian overrides
  jp/index.json     ← Japanese overrides
  <slug>.md
  id/<slug>.md
  jp/<slug>.md
```
Each `index.json` lists items with `slug`, `title`, `date`, `author`, `excerpt` (events also support `image`). The slug must match the `.md` filename. Files are bundled at build time via `import.meta.glob` — no runtime fetches. Each `.md` file uses YAML frontmatter (`---` fenced). `src/utils/markdown.js` provides `loadMarkdown(type, slug, lang)`, `loadContentList(type, lang)` (both look in the language subfolder first, falling back to the English root), `parseFrontmatter()`, `formatDate(dateString, lang)`, and `slugify()`.

**Prayer times** are fetched live from the Aladhan API in `src/components/PrayerTimes.jsx` using Kanazawa coordinates (lat `36.5549`, lon `136.6956`, method `2` = ISNA).

**Styling** uses Tailwind with a custom `primary` green palette (defined in `tailwind.config.js`). Shared utility classes `.card`, `.btn-primary`, `.section-title`, and `.markdown-content` (with full heading/list/blockquote styles) are defined as `@layer components` in `src/index.css`.

**Shared config** — `src/config/contact.js` exports `CONTACT` with: `name`, `address`, `lat`/`lon`, `phone`/`phoneTel`, `whatsapp`, `imam` (`{ name, phone, whatsapp }`), `mapsEmbedUrl`, and `mapsDirectionsUrl` (computed getter). Import from there rather than hardcoding values.

**SEO** — `src/hooks/useSEO.js` exports `useSEO(title, description)` and `stripHtml(html)` (plain-text excerpt ≤160 chars). The hook sets `document.title` to `"<title> — Kanazawa Masjid"` (null title → just `"Kanazawa Masjid"`). Call `useSEO` at the top of every page component.

**WhatsApp captcha** — `src/components/WhatsAppLink.jsx` exports `WhatsAppLink` (default) and `CaptchaModal` (named). Any `<WhatsAppLink>` shows a math captcha before opening the WhatsApp URL. `src/components/MarkdownContent.jsx` renders Markdown HTML with the `.markdown-content` class and intercepts clicks on `wa.me`/`whatsapp.com` links inside content to show the same modal. Use `MarkdownContent` (not raw `dangerouslySetInnerHTML`) for all Markdown rendering.

**Registration system** — `/register/:eventId` is a form page (`src/pages/Registration.jsx`) with an inline math captcha, an attendees field (1–10), and session selection. It is backed by `netlify/functions/register.mjs`. Event configs (title, sessions, SEO) live in `src/config/registrationEvents.js`. The function uses `@libsql/client`: locally (`APP_ENV=dev`) it writes to `./local.db`; in production it uses Turso (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`). Duplicate detection normalises names (lowercase, strip diacritics, collapse spaces). The function maintains an in-memory session count cache (6h TTL); an `EVENT_FREEZE_AT` map hard-codes a UTC timestamp per event after which session counts are permanently frozen. The `registrations` table schema: `id`, `event_id`, `name`, `name_normalized`, `session`, `attendees`, `created_at`.

**Database migrations** — schema changes live in `scripts/migrate-db.mjs` as an ordered `MIGRATIONS` array. Applied versions are tracked in a `schema_migrations` table so each migration only runs once. `bun run migrate` runs the script; `bun run build` calls it automatically. The script is a no-op unless `RUN_MIGRATIONS=true` is set in the environment — set this in Netlify env vars before a deploy that needs schema changes, then unset it afterwards. To add a new migration, append to the `MIGRATIONS` array with a unique `version` string; never edit or reorder existing entries.

**Dev API proxy** — `vite.config.js` includes a custom `dev-api` Vite plugin that intercepts `/api/register` GET and POST requests during `bun run dev`, running the same logic as the Netlify function against the local SQLite DB. No separate server needed.

**Home page hardcoded content** — the regular activity schedule (`SCHEDULE` array) and the Eid registration banner (linking to `/register/eid-fitr-1447`) are both hardcoded in `src/pages/Home.jsx`. The banner text is in `translations.js` under `eidBanner`; the schedule is not localized.

## Git Workflow

- Active development branch is `dev` — always commit and push to `dev`
- `main` is protected; changes must go through a PR from `dev` (or a feature branch) before merging
- Never push directly to `main`

## Deployment

Netlify — configured in `netlify.toml` with the following:

- `bun run build` as the build command, publishing `dist/`
- `BUN_INSTALL_CACHE_DIR` set to cache Bun packages across builds
- `/api/*` → `/.netlify/functions/:splat` and `/*` → `/index.html` redirect rules
- **Production builds** only trigger when files under `src/`, `netlify/`, `public/`, `package.json`, `bun.lockb`, or `netlify.toml` change — doc-only commits are skipped
- **Branch deploys** (e.g. `dev`) and **deploy previews** (PRs) are disabled to save build credits

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
