// One-off operational tool: creates the first ADMIN account, or promotes an
// existing account to ADMIN if the email is already registered. There is no
// admin-creation path in the running app on purpose — self-registration
// always creates a TEACHER account (auth.service.ts) — so this is the only
// way to get an admin account into the system.
//
// Deliberately NOT wired into the Docker boot CMD (unlike migrations, which
// are safe to re-run every boot) — creating/promoting an admin is a manual,
// one-time step a human should trigger deliberately, not something that
// happens automatically on every deploy.
//
// Usage:
//   node scripts/seed-admin.js <email> [password]
//
// - If <email> already exists: promotes that account's role to ADMIN in
//   place. <password> is ignored (the account keeps its existing password).
// - If <email> doesn't exist: creates a fresh account with role ADMIN.
//   <password> is required in this case.
//
// Reads DB connection details from the same env vars configuration.ts uses
// (DATABASE_HOST/PORT/NAME/USER/PASSWORD/SSL_CA) — run it with those set in
// the shell, exactly like migration:run:prod.
const { randomUUID } = require('node:crypto');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  if (!email) {
    console.error('Usage: node scripts/seed-admin.js <email> [password]');
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '3306', 10),
    database: process.env.DATABASE_NAME ?? 'teacher_dtr',
    user: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? '',
    ssl: process.env.DATABASE_SSL_CA
      ? { ca: process.env.DATABASE_SSL_CA }
      : undefined,
  });

  try {
    const [rows] = await conn.query(
      'SELECT id, role FROM users WHERE email = ?',
      [email],
    );

    if (rows.length > 0) {
      const existing = rows[0];
      if (existing.role === 'ADMIN') {
        console.log(`${email} is already an ADMIN. Nothing to do.`);
        return;
      }
      await conn.query('UPDATE users SET role = ? WHERE id = ?', [
        'ADMIN',
        existing.id,
      ]);
      console.log(`Promoted existing account ${email} to ADMIN.`);
      return;
    }

    if (!password) {
      console.error(
        `No account found for ${email} — a password is required to create a new one.`,
      );
      console.error('Usage: node scripts/seed-admin.js <email> <password>');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = randomUUID();
    await conn.query(
      'INSERT INTO users (id, email, password_hash, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, NOW(6), NOW(6))',
      [id, email, passwordHash, 'ADMIN'],
    );
    console.log(`Created new ADMIN account for ${email}.`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Failed to seed admin account:', err.message);
  process.exit(1);
});
