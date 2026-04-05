const postgres = require("postgres");

const SQL = `
CREATE TABLE IF NOT EXISTS shooters (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  name TEXT NOT NULL,
  rifle TEXT,
  pistol TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS shooter_lockouts (
  id SERIAL PRIMARY KEY,
  target_shooter_id INTEGER NOT NULL REFERENCES shooters(id),
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drills (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  time_standard TEXT NOT NULL,
  distance TEXT NOT NULL DEFAULT '7',
  target_zones TEXT[] NOT NULL DEFAULT '{}'::text[],
  weapons TEXT[] NOT NULL DEFAULT '{pistol}'::text[],
  created_by INTEGER REFERENCES shooters(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE drills ADD COLUMN IF NOT EXISTS distance TEXT NOT NULL DEFAULT '7';
UPDATE drills SET distance = '7' WHERE distance IS NULL;
ALTER TABLE drills ADD COLUMN IF NOT EXISTS weapons TEXT[] NOT NULL DEFAULT '{pistol}'::text[];

CREATE TABLE IF NOT EXISTS training_sessions (
  id SERIAL PRIMARY KEY,
  created_by INTEGER NOT NULL REFERENCES shooters(id),
  drill_order TEXT NOT NULL DEFAULT 'manual',
  started_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS session_shooters (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES training_sessions(id),
  shooter_id INTEGER NOT NULL REFERENCES shooters(id),
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session_drills (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES training_sessions(id),
  drill_id INTEGER NOT NULL REFERENCES drills(id),
  position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session_entries (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES training_sessions(id),
  shooter_id INTEGER NOT NULL REFERENCES shooters(id),
  drill_id INTEGER NOT NULL REFERENCES drills(id),
  time_entered TEXT NOT NULL,
  pass BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function migrate(retries = 5) {
  for (let i = 0; i < retries; i++) {
    let sql;
    try {
      sql = postgres(process.env.DATABASE_URL, {
        connect_timeout: 10,
        idle_timeout: 5,
      });
      console.log(`Migration attempt ${i + 1}...`);
      await sql.unsafe(SQL);
      console.log("Migrations complete.");
      await sql.end();
      return;
    } catch (e) {
      console.error(`Attempt ${i + 1} failed: ${e.message}`);
      if (sql) await sql.end().catch(() => {});
      if (i < retries - 1) {
        console.log("Retrying in 3s...");
        await sleep(3000);
      }
    }
  }
  console.error("All migration attempts failed, starting app anyway.");
}

migrate().then(() => {
  // Migration done or exhausted retries — either way, don't block app start
}).catch(() => {});
