import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import pg from "pg";
export async function createStore({
  databaseUrl = process.env.DATABASE_URL,
  filename = process.env.SQLITE_PATH || "data/stockwise.db",
} = {}) {
  let db, query;
  const schema = process.env.DATABASE_SCHEMA || "stockwise";
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema)) throw new Error("Invalid DATABASE_SCHEMA.");
  if (databaseUrl) {
    const connection = new URL(databaseUrl);
    // Require certificate and hostname verification for hosted TLS connections.
    if (connection.searchParams.get("sslmode") === "require") {
      connection.searchParams.set("sslmode", "verify-full");
    }
    db = new pg.Pool({
      connectionString: connection.toString(),
      max: 2,
      options: `-c search_path=${schema}`,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });
    await db.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    db.on("error", (error) =>
      console.error("Database pool error:", error.message),
    );
    query = async (sql, args = []) => {
      let i = 0;
      return (
        await db.query(
          sql.replace(/\?/g, () => "$" + ++i),
          args,
        )
      ).rows;
    };
  } else {
    if (filename !== ":memory:")
      mkdirSync(dirname(filename), { recursive: true });
    db = new DatabaseSync(filename);
    query = async (sql, args = []) => db.prepare(sql).all(...args);
  }
  await query(
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL)",
  );
  await query(
    "CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at BIGINT NOT NULL)",
  );
  await query("CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, sku TEXT NOT NULL, category TEXT NOT NULL, quantity INTEGER NOT NULL, threshold INTEGER NOT NULL, price REAL NOT NULL, expiry TEXT NOT NULL, supplier TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(user_id, sku))");
  return {
    query,
    ping: () => query("SELECT 1 AS ready"),
    byEmail: async (email) =>
      (await query("SELECT * FROM users WHERE email = ?", [email]))[0],
    byId: async (id) =>
      (await query("SELECT * FROM users WHERE id = ?", [id]))[0],
    async create(user) {
      await query(
        "INSERT INTO users (id,name,email,password_hash,created_at) VALUES (?,?,?,?,?)",
        [user.id, user.name, user.email, user.password_hash, user.created_at],
      );
      return user;
    },
    async addSession(id, userId, exp) {
      await query("DELETE FROM sessions WHERE expires_at < ?", [
        Math.floor(Date.now() / 1000),
      ]);
      await query(
        "INSERT INTO sessions (id,user_id,expires_at) VALUES (?,?,?)",
        [id, userId, exp],
      );
    },
    session: async (id) =>
      (await query("SELECT * FROM sessions WHERE id = ?", [id]))[0],
    removeSession: (id) => query("DELETE FROM sessions WHERE id = ?", [id]),
    close: () => (databaseUrl ? db.end() : db.close()),
  };
}
