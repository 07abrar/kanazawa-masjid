import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createClient } from '@libsql/client'
import { parse as parseUrl } from 'url'

function normalizeName(name) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function devApiPlugin(env) {
  let client

  function getClient() {
    if (!client) {
      client = env.APP_ENV === 'dev'
        ? createClient({ url: 'file:./local.db' })
        : createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN })
    }
    return client
  }

  async function ensureTable(db) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL,
        name_normalized TEXT NOT NULL DEFAULT '',
        session INTEGER NOT NULL,
        attendees INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      )
    `)
    for (const col of [
      "ALTER TABLE registrations ADD COLUMN event_id TEXT NOT NULL DEFAULT ''",
      "ALTER TABLE registrations ADD COLUMN name_normalized TEXT NOT NULL DEFAULT ''",
    ]) {
      try { await db.execute(col) } catch { /* already exists */ }
    }
  }

  function send(res, data, status = 200) {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  }

  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/register', async (req, res) => {
        const db = getClient()
        try { await ensureTable(db) } catch {
          return send(res, { error: 'Database error' }, 500)
        }

        if (req.method === 'GET') {
          const { query } = parseUrl(req.url, true)
          const eventId = query.event || ''
          try {
            const result = await db.execute({
              sql: 'SELECT session, SUM(attendees) as total FROM registrations WHERE event_id = ? GROUP BY session',
              args: [eventId],
            })
            const sessions = {}
            for (const row of result.rows) sessions[row.session] = Number(row.total)
            return send(res, { sessions })
          } catch {
            return send(res, { error: 'Database error' }, 500)
          }
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', async () => {
            let parsed
            try { parsed = JSON.parse(body) } catch {
              return send(res, { error: 'Invalid JSON' }, 400)
            }

            const { name, session, attendees, event: eventId } = parsed

            if (!eventId || typeof eventId !== 'string' || eventId.trim().length === 0)
              return send(res, { error: 'Event is required' }, 400)
            if (!name || typeof name !== 'string' || name.trim().length === 0)
              return send(res, { error: 'Name is required' }, 400)
            if (![1, 2, 3].includes(Number(session)))
              return send(res, { error: 'Invalid session' }, 400)
            const attendeesNum = Number(attendees)
            if (!Number.isInteger(attendeesNum) || attendeesNum < 1 || attendeesNum > 10)
              return send(res, { error: 'Attendees must be between 1 and 10' }, 400)

            const nameNormalized = normalizeName(name)

            try {
              const existing = await db.execute({
                sql: 'SELECT id FROM registrations WHERE event_id = ? AND name_normalized = ? LIMIT 1',
                args: [eventId.trim(), nameNormalized],
              })
              if (existing.rows.length > 0) return send(res, { error: 'duplicate_name' }, 409)
            } catch {
              return send(res, { error: 'Database error' }, 500)
            }

            try {
              await db.execute({
                sql: 'INSERT INTO registrations (event_id, name, name_normalized, session, attendees, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                args: [eventId.trim(), name.trim(), nameNormalized, Number(session), attendeesNum, new Date().toISOString()],
              })
              return send(res, { success: true })
            } catch {
              return send(res, { error: 'Failed to save registration' }, 500)
            }
          })
          return
        }

        send(res, { error: 'Method not allowed' }, 405)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), devApiPlugin(env)],
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
    },
  }
})
