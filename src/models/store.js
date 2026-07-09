const db = require('./db');

// ?? ????????? itemId ? itemName ??
const itemNameCache = new Map();
function getItemName(itemId) {
  if (!itemNameCache.has(itemId)) {
    const row = db.prepare('SELECT name FROM items WHERE id = ?').get(itemId);
    itemNameCache.set(itemId, row ? row.name : '????');
  }
  return itemNameCache.get(itemId);
}

function resolveInventory(inv) {
  return inv.map(i => ({
    itemId: i.itemId,
    itemName: getItemName(i.itemId),
    qty: i.qty,
  }));
}

// ?? Character ??
function rowToCharacter(row) {
  if (!row) return null;
  const rawInv = JSON.parse(row.inventory);
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    level: row.level,
    hp: row.hp,
    maxHp: row.maxHp,
    gold: row.gold,
    stats: JSON.parse(row.stats),
    inventory: resolveInventory(rawInv),
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
  const gold = Math.floor(Math.random() * 51) + 50;
  const info = insertChar.run(userId, data.name, 1, 20, 20, gold, JSON.stringify(data.stats), '[]', '[]', 1);
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

// ?? Items ??
const listItems = db.prepare('SELECT * FROM items');
const listItemsByType = db.prepare('SELECT * FROM items WHERE type = ?');
const listItemsByTypeSubtype = db.prepare('SELECT * FROM items WHERE type = ? AND subtype = ?');
const findItemByIdStmt = db.prepare('SELECT * FROM items WHERE id = ?');

function findAllItems(type, subtype) {
  let rows;
  if (type && subtype) rows = listItemsByTypeSubtype.all(type, subtype);
  else if (type) rows = listItemsByType.all(type);
  else rows = listItems.all();
  return rows.map(rowToItem);
}

function findItemByIdFn(id) {
  const row = findItemByIdStmt.get(id);
  return row ? rowToItem(row) : null;
}

function rowToItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    subtype: row.subtype,
    description: row.description,
    price: row.price,
    sellPrice: row.sellPrice,
    rarity: row.rarity,
    stats: JSON.parse(row.stats),
    stackable: !!row.stackable,
    maxStack: row.maxStack,
  };
}

// ?? NPCs ??
const listNpcs = db.prepare('SELECT * FROM npcs');
const listNpcsByRole = db.prepare('SELECT * FROM npcs WHERE role = ?');
const findNpcByIdStmt = db.prepare('SELECT * FROM npcs WHERE id = ?');

function findAllNpcs(role) {
  const rows = role ? listNpcsByRole.all(role) : listNpcs.all();
  return rows.map(r => rowToNpc(r));
}
function findNpcByIdFn(id) {
  const row = findNpcByIdStmt.get(id);
  return row ? rowToNpc(row) : null;
}

function rowToNpc(row) {
  if (!row) return null;
  const rawInv = JSON.parse(row.inventory);
  const rawEquip = JSON.parse(row.equipment);
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    level: row.level,
    hp: row.hp,
    maxHp: row.maxHp,
    gold: row.gold,
    stats: JSON.parse(row.stats),
    inventory: resolveInventory(rawInv),
    equipment: {
      weapon: rawEquip.weapon ? findItemByIdFn(rawEquip.weapon) : null,
      armor: rawEquip.armor ? findItemByIdFn(rawEquip.armor) : null,
      accessory: rawEquip.accessory ? findItemByIdFn(rawEquip.accessory) : null,
    },
    description: row.description,
    dialogue: row.dialogue,
    isHostile: !!row.isHostile,
  };
}

module.exports = {
  createUser, findUserByUsername, findUserById,
  createCharacter, findCharactersByUserId, findCharacterById, updateCharacter, deleteCharacter,
  findAllItems, findItemById: findItemByIdFn,
  findAllNpcs, findNpcById: findNpcByIdFn,
};