const { Client } = require("pg");

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
  target_zones TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_by INTEGER REFERENCES shooters(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

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

async function migrate() {
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();
  console.log("Running migrations...");
  await client.query(SQL);
  console.log("Migrations complete.");
  await client.end();
}

migrate().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
