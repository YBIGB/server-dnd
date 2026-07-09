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

  CREATE TABLE IF NOT EXISTS items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL,
    subtype     TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    price       INTEGER NOT NULL DEFAULT 0,
    sellPrice   INTEGER NOT NULL DEFAULT 0,
    rarity      TEXT NOT NULL DEFAULT 'common',
    stats       TEXT NOT NULL DEFAULT '{}',
    stackable   INTEGER NOT NULL DEFAULT 1,
    maxStack    INTEGER NOT NULL DEFAULT 99,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS npcs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT '',
    level       INTEGER NOT NULL DEFAULT 1,
    hp          INTEGER NOT NULL DEFAULT 20,
    maxHp       INTEGER NOT NULL DEFAULT 20,
    gold        INTEGER NOT NULL DEFAULT 0,
    stats       TEXT NOT NULL DEFAULT '{}',
    inventory   TEXT NOT NULL DEFAULT '[]',
    equipment   TEXT NOT NULL DEFAULT '{}',
    description TEXT NOT NULL DEFAULT '',
    dialogue    TEXT NOT NULL DEFAULT '',
    isHostile   INTEGER NOT NULL DEFAULT 0,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ?????????????????
const itemCount = db.prepare('SELECT COUNT(*) AS cnt FROM items').get();
if (itemCount.cnt === 0) {
  const stmt = db.prepare('INSERT INTO items (name,type,subtype,description,price,sellPrice,rarity,stats,stackable,maxStack) VALUES (?,?,?,?,?,?,?,?,?,?)');
  const items = [
    ['??',     'weapon',   'sword',    '?????????',        100, 50,  'common', JSON.stringify({ damage: 5 }), 0, 1],
    ['??',     'armor',    'body',     '?????????',        150, 75,  'common', JSON.stringify({ defense: 5 }), 0, 1],
    ['????', 'potion',   'healing',  '?? 20 ????',           30,  15,  'common', JSON.stringify({ heal: 20 }),  1, 99],
    ['??',     'tool',     'shovel',   '???????????',     50,  25,  'common', JSON.stringify({ damage: 2 }), 0, 1],
    ['???',   'key_item', 'medal',    '???????',              0,   0,   'uncommon', JSON.stringify({}), 1, 99],
    ['?????','key_item','key',      '????????',            0,   0,   'common', JSON.stringify({}), 1, 99],
  ];
  const insertMany = db.transaction((rows) => {
    for (const r of rows) stmt.run(...r);
  });
  insertMany(items);
}

// ?????NPC
const npcCount = db.prepare('SELECT COUNT(*) AS cnt FROM npcs').get();
if (npcCount.cnt === 0) {
  const stmt = db.prepare('INSERT INTO npcs (name,role,level,hp,maxHp,gold,stats,inventory,equipment,description,dialogue,isHostile) VALUES (@name,@role,@level,@hp,@maxHp,@gold,@stats,@inventory,@equipment,@description,@dialogue,@isHostile)');
  const npcs = [
    {
      name: '?????', role: 'blacksmith', level: 5, hp: 30, maxHp: 30, gold: 500,
      stats: JSON.stringify({ strength: 14, dexterity: 8, constitution: 12, intelligence: 10, wisdom: 10, charisma: 8 }),
      inventory: JSON.stringify([{ itemId: 1, qty: 3 }, { itemId: 2, qty: 2 }]),
      equipment: JSON.stringify({ weapon: 1, armor: 2, accessory: null }),
      description: '??????????????',
      dialogue: '??????????????????',
      isHostile: 0,
    },
    {
      name: '???????', role: 'shopkeeper', level: 3, hp: 25, maxHp: 25, gold: 300,
      stats: JSON.stringify({ strength: 6, dexterity: 10, constitution: 8, intelligence: 12, wisdom: 14, charisma: 16 }),
      inventory: JSON.stringify([{ itemId: 3, qty: 5 }, { itemId: 4, qty: 2 }]),
      equipment: JSON.stringify({ weapon: null, armor: null, accessory: null }),
      description: '????????????',
      dialogue: '??????????????????????????',
      isHostile: 0,
    },
  ];
  const insertMany = db.transaction((rows) => {
    for (const r of rows) stmt.run(r);
  });
  insertMany(npcs);
}

module.exports = db;