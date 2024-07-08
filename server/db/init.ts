import Database from "better-sqlite3";

const db = Database("db/game.db");
db.pragma("journal_mode = WAL");
db.prepare(
  `CREATE TABLE IF NOT EXISTS 
  game (
  pin TEXT,  
  roomId TEXT,
  active INTEGER,
  created_at DATETIME DEFAULT (datetime('now','utc')))`
).run();

export default db;
