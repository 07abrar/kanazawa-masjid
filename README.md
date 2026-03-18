# Kanazawa Umar bin Al-Khattab Mosque

Website for the Kanazawa Umar bin Al-Khattab Mosque — a lightweight, fast SPA built with Vite + React, deployed on Netlify.

## Tech Stack

- **Vite** + **React 18** — build tool & UI
- **React Router DOM v6** — client-side routing
- **TailwindCSS 3** — styling
- **Marked.js** — Markdown rendering
- **Aladhan API** — live prayer times (Kanazawa coordinates)
- **@libsql/client** — SQLite (local dev) / Turso (production) for prayer registrations

## Features

- Bilingual UI (English / Indonesian) with language toggle
- Live prayer times from Aladhan API
- Markdown-based content system (news & events)
- Google Maps directions link
- Prayer registration system for Eid and other events

## Getting Started

```bash
# Install dependencies
bun install

# Start dev server
bun run dev
# → http://localhost:5173

# Production build
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
kanazawa-masjid/
├── netlify/
│   └── functions/
│       └── register.mjs    # Registration API (Netlify Function)
├── src/
│   ├── components/         # Navbar, Footer, PrayerTimes, etc.
│   ├── config/
│   │   ├── contact.js      # Mosque contact details & WhatsApp links
│   │   └── registrationEvents.js  # Eid registration event configs
│   ├── contexts/           # LanguageContext (EN/ID i18n)
│   ├── i18n/               # translations.js
│   ├── pages/              # Home, News, Events, Contact, Registration
│   ├── content/
│   │   ├── news/           # News articles (.md) + index.json
│   │   └── events/         # Event articles (.md) + index.json
│   └── utils/              # markdown.js helpers
├── index.html
├── vite.config.js          # Also serves /api/register locally in dev
├── tailwind.config.js
└── netlify.toml
```

## Adding News or Events

1. Create `src/content/news/your-article.md` with frontmatter:

   ```markdown
   ---
   title: Your Article Title
   date: 2026-03-15
   author: Author Name
   excerpt: Short summary shown on the list.
   ---

   Article content in Markdown...
   ```

2. Add an entry to `src/content/news/index.json`:

   ```json
   {
     "slug": "your-article",
     "title": "Your Article Title",
     "date": "2026-03-15",
     "author": "Author Name",
     "excerpt": "Short summary shown on the news list."
   }
   ```

3. Push to Git — Netlify auto-deploys.

## Routes

| Path | Page |
|------|------|
| `/` | Home (hero, Eid banner, latest news, prayer times) |
| `/news` | News list |
| `/news/:slug` | News article |
| `/events` | Events list |
| `/events/:slug` | Event detail |
| `/contact` | Contact & map |
| `/register/:eventId` | Prayer registration form |

---

## Prayer Registration System

### How it works

| Concern | Detail |
|---|---|
| Route | `/register/:eventId` → `src/pages/Registration.jsx` |
| API (dev) | Vite dev plugin in `vite.config.js` handles `/api/register` locally |
| API (prod) | Netlify Function at `netlify/functions/register.mjs` |
| Database (dev) | Local SQLite file `local.db` (created automatically on first request) |
| Database (prod) | Turso remote LibSQL (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`) |

The `registrations` table stores an `event_id` column so each event's data is fully isolated. A duplicate-name check is scoped per event — the same name can register for Eid Al-Fitr and Eid Al-Adha separately. Names are normalised before the check (lowercase, trim, collapse spaces, strip diacritics).

### Environment variables

Copy `.env.example` to `.env` and fill in:

```env
APP_ENV=dev                  # "dev" → local SQLite, anything else → Turso
TURSO_DATABASE_URL=          # libsql://... (required in prod)
TURSO_AUTH_TOKEN=            # JWT token (required in prod)
RUN_MIGRATIONS=false         # set to "true" only when a deploy needs schema changes
```

On Netlify, set `APP_ENV=prod` plus the Turso credentials in the **Site settings → Environment variables** dashboard.

### Database migrations

Schema changes are handled by `scripts/migrate-db.mjs` — a versioned migration runner that tracks applied versions in a `schema_migrations` table, so each migration only ever runs once.

`bun run migrate` runs the script directly. `bun run build` calls it automatically, but it is a **no-op** unless `RUN_MIGRATIONS=true`.

**Workflow for schema changes:**

1. Add a new entry to the `MIGRATIONS` array in `scripts/migrate-db.mjs` with a unique `version` string
2. Set `RUN_MIGRATIONS=true` in Netlify env vars
3. Deploy — the migration runs once during the build
4. Set `RUN_MIGRATIONS=false` (or unset it) so subsequent deploys skip it

To run a migration locally against the local SQLite file:

```bash
APP_ENV=dev RUN_MIGRATIONS=true bun run migrate
```

### Adding a new Eid registration event

Only **one file** needs to change — `src/config/registrationEvents.js`:

```js
"eid-adha-1447": {
  eventId: "eid-adha-1447",
  title: "Eid Al-Adha 1447H Prayer Registration",
  subtitle: "Please register your attendance for Eid Al-Adha 1447H prayer.",
  seoDesc: "Register for Eid Al-Adha 1447H prayer at Kanazawa Umar bin Al-Khattab Mosque.",
  sessions: [
    { value: "1", time: "7:00 AM" },
    { value: "2", time: "8:00 AM" },
  ],
},
```

Then link to `/register/eid-adha-1447` from the relevant news or event post. No code changes needed anywhere else.

---

## Deployment

Netlify — configured in `netlify.toml`:
- Build command: `bun run build` (runs `bun run migrate` first, no-op unless `RUN_MIGRATIONS=true`)
- Publish directory: `dist`
- SPA redirect: `/* → /index.html`
- Functions directory: `netlify/functions`
- API routes: `/api/*` → `/.netlify/functions/:splat`
- Bun package cache enabled via `BUN_INSTALL_CACHE_DIR`
- **Branch deploys** and **deploy previews** are disabled to save build credits
- **Production builds** are skipped when only non-code files change (docs, config)

Connect the GitHub repo to Netlify and it will auto-deploy on every push to `main`.

## Git Workflow

- Active development branch is `dev` — always commit and push to `dev`
- `main` is protected; merge via PR from `dev`
- Never push directly to `main`

## Location

Tsu-120 Wakamatsumachi, Kanazawa, Ishikawa 920-1165, Japan
