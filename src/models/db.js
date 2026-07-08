const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config');

const dbPath = path.resolve(__dirname, '../../', config.dbPath || 'data/dnd.db');
const dir = path.dirname(dbPath);
if (!require('fs').existsSync(dir)) {
  require('fs').mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT NOT NULL UNIQUE,
    password  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS characters (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    userId            INTEGER NOT NULL,
    name              TEXT NOT NULL,
    level             INTEGER DEFAULT 1,
    hp                INTEGER DEFAULT 10,
    maxHp             INTEGER DEFAULT 10,
    gold              INTEGER DEFAULT 0,
    stats             TEXT NOT NULL DEFAULT '{}',
    inventory         TEXT NOT NULL DEFAULT '[]',
    completedDungeons TEXT NOT NULL DEFAULT '[]',
    isAlive           INTEGER DEFAULT 1,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

module.exports = db;
