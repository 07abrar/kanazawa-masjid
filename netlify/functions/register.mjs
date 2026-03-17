import { createClient } from "@libsql/client";

function getClient() {
  if (process.env.APP_ENV === "dev") {
    return createClient({ url: "file:./local.db" });
  }
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

function normalizeName(name) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

async function ensureTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id TEXT NOT NULL DEFAULT '',
      name TEXT NOT NULL,
      name_normalized TEXT NOT NULL DEFAULT '',
      session INTEGER NOT NULL,
      attendees INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )
  `);
  // Migrate existing tables that lack newer columns
  for (const col of [
    "ALTER TABLE registrations ADD COLUMN event_id TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE registrations ADD COLUMN name_normalized TEXT NOT NULL DEFAULT ''",
  ]) {
    try { await client.execute(col) } catch { /* already exists */ }
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req, context) {
  const client = getClient();

  try {
    await ensureTable(client);
  } catch {
    return json({ error: "Database error" }, 500);
  }

  if (req.method === "GET") {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("event") || "";
    try {
      const result = await client.execute({
        sql: "SELECT session, SUM(attendees) as total FROM registrations WHERE event_id = ? GROUP BY session",
        args: [eventId],
      });
      const sessions = {};
      for (const row of result.rows) {
        sessions[row.session] = Number(row.total);
      }
      return json({ sessions });
    } catch {
      return json({ error: "Database error" }, 500);
    }
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const { name, session, attendees, event: eventId } = body;

    if (!eventId || typeof eventId !== "string" || eventId.trim().length === 0) {
      return json({ error: "Event is required" }, 400);
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return json({ error: "Name is required" }, 400);
    }
    if (![1, 2, 3].includes(Number(session))) {
      return json({ error: "Invalid session" }, 400);
    }
    const attendeesNum = Number(attendees);
    if (!Number.isInteger(attendeesNum) || attendeesNum < 1 || attendeesNum > 10) {
      return json({ error: "Attendees must be between 1 and 10" }, 400);
    }

    const nameNormalized = normalizeName(name);

    try {
      const existing = await client.execute({
        sql: "SELECT id FROM registrations WHERE event_id = ? AND name_normalized = ? LIMIT 1",
        args: [eventId.trim(), nameNormalized],
      });
      if (existing.rows.length > 0) {
        return json({ error: "duplicate_name" }, 409);
      }
    } catch {
      return json({ error: "Database error" }, 500);
    }

    try {
      await client.execute({
        sql: "INSERT INTO registrations (event_id, name, name_normalized, session, attendees, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        args: [eventId.trim(), name.trim(), nameNormalized, Number(session), attendeesNum, new Date().toISOString()],
      });
      return json({ success: true });
    } catch {
      return json({ error: "Failed to save registration" }, 500);
    }
  }

  return json({ error: "Method not allowed" }, 405);
}
