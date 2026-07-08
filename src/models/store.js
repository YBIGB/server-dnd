const db = require('./db');

function rowToCharacter(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    level: row.level,
    hp: row.hp,
    maxHp: row.maxHp,
    gold: row.gold,
    stats: JSON.parse(row.stats),
    inventory: JSON.parse(row.inventory),
    completedDungeons: JSON.parse(row.completedDungeons),
    isAlive: !!row.isAlive,
  };
}

// User
const insertUser = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
const findUserByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?');
const findUserByIdStmt = db.prepare('SELECT * FROM users WHERE id = ?');

function createUser(u, p) {
  const info = insertUser.run(u, p);
  return { id: Number(info.lastInsertRowid), username: u };
}
function findUserByUsername(u) { return findUserByUsernameStmt.get(u) || null; }
function findUserById(id) { return findUserByIdStmt.get(id) || null; }

// Character
const insertChar = db.prepare(`INSERT INTO characters (userId,name,level,hp,maxHp,gold,stats,inventory,completedDungeons,isAlive) VALUES (?,?,?,?,?,?,?,?,?,?)`);
const listCharsByUser = db.prepare('SELECT * FROM characters WHERE userId = ?');
const findCharById = db.prepare('SELECT * FROM characters WHERE id = ?');
const deleteChar = db.prepare('DELETE FROM characters WHERE id = ?');
const updateChar = db.prepare(`UPDATE characters SET name=?,level=?,hp=?,maxHp=?,gold=?,stats=?,inventory=?,completedDungeons=?,isAlive=? WHERE id=?`);

function createCharacter(userId, data) {
  const info = insertChar.run(userId, data.name, 1, 10, 10, 0, JSON.stringify(data.stats), '[]', '[]', 1);
  return rowToCharacter(findCharById.get(info.lastInsertRowid));
}
function findCharactersByUserId(userId) { return listCharsByUser.all(userId).map(r => rowToCharacter(r)); }
function findCharacterById(id) { return rowToCharacter(findCharById.get(id)); }
function updateCharacter(id, updates) {
  const row = findCharById.get(id);
  if (!row) return null;
  updateChar.run(
    updates.name ?? row.name, updates.level ?? row.level, updates.hp ?? row.hp,
    updates.maxHp ?? row.maxHp, updates.gold ?? row.gold,
    updates.stats ? JSON.stringify(updates.stats) : row.stats,
    updates.inventory ? JSON.stringify(updates.inventory) : row.inventory,
    updates.completedDungeons ? JSON.stringify(updates.completedDungeons) : row.completedDungeons,
    updates.isAlive !== undefined ? (updates.isAlive ? 1 : 0) : row.isAlive,
    Number(id)
  );
  return rowToCharacter(findCharById.get(id));
}
function deleteCharacter(id) { return deleteChar.run(id).changes > 0; }

module.exports = { createUser, findUserByUsername, findUserById, createCharacter, findCharactersByUserId, findCharacterById, updateCharacter, deleteCharacter };
