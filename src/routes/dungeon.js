const { Router } = require('express');
const store = require('../models/store');
const authMiddleware = require('../middleware/auth');
const { AppError, success } = require('../utils/response');
const { check } = require('../utils/dice');

const router = Router();
router.use(authMiddleware);

router.post('/action', (req, res, next) => {
  try {
    const { actionId, characterId, dungeonState = {} } = req.body;

    if (!actionId) throw new AppError(4001, '缺少 actionId');
    if (!characterId) throw new AppError(1001, '缺少 characterId');

    const char = store.findCharacterById(characterId);
    if (!char) throw new AppError(3001, '角色不存在');
    if (char.userId !== req.user.userId) throw new AppError(1003, '无权操作此角色');
    if (!char.isAlive) throw new AppError(4001, '角色已死亡，无法执行副本行动');

    const state = {
      hasKey: false, hasClue: false, shopRobbed: false, shopTradeDone: false,
      graveDug: false, graveInsightDone: false, bossDefeated: false,
      ...dungeonState,
    };

    const handlers = {
      shop_trade: handleShopTrade,
      shop_steal: handleShopSteal,
      grave_dig: handleGraveDig,
      grave_insight: handleGraveInsight,
      boss_fight: handleBossFight,
      boss_persuade: handleBossPersuade,
      exit_leave: handleExitLeave,
    };

    const handler = handlers[actionId];
    if (!handler) throw new AppError(4001, '无效的 actionId');

    let result = handler(char, state);

    // 持久化角色变更
    if (result.updatedCharacter) {
      const fields = ['hp', 'gold', 'inventory', 'isAlive', 'completedDungeons'];
      const updates = {};
      for (const key of fields) {
        if (result.updatedCharacter[key] !== undefined) updates[key] = result.updatedCharacter[key];
      }
      if (Object.keys(updates).length > 0) store.updateCharacter(char.id, updates);
    }

    res.json(success(result));
  } catch (err) { next(err); }
});

// ── 商店交易：50 金币购买铁铲 ──
function handleShopTrade(char, state) {
  if (state.shopTradeDone) {
    throw new AppError(4001, '你今天已经光顾过商店了。');
  }
  const cost = 50;
  if (char.gold < cost) {
    throw new AppError(4001, `金币不足！购买铁铲需要 ${cost} 金币（当前 ${char.gold} 金币）。`);
  }
  const newGold = char.gold - cost;
  const newInv = [...char.inventory];
  const existing = newInv.find(i => i.name === '铁铲');
  if (existing) existing.qty += 1;
  else newInv.push({ name: '铁铲', qty: 1 });

  return {
    success: true,
    message: `你花 ${cost} 金币购买了一把铁铲！`,
    updatedCharacter: { gold: newGold, inventory: newInv },
    dungeonUpdates: { ...state, shopTradeDone: true },
  };
}

// ── 商店盗窃：敏捷 DC=13 ──
function handleShopSteal(char, state) {
  if (state.shopRobbed) return { success: false, message: '你已经尝试过盗窃了。' };
  const roll = check(char.stats.dexterity, 13);
  const result = { success: roll.success, roll, message: '', dungeonUpdates: { ...state, shopRobbed: true } };
  if (roll.success) {
    result.message = '你成功偷到了一把钥匙！';
    result.dungeonUpdates = { ...state, shopRobbed: true, hasKey: true };
    result.updatedCharacter = { gold: char.gold + 30 };
  } else {
    result.message = '你被发现了！老板瞪了你一眼，你赶紧离开。';
  }
  return result;
}

// ── 墓地挖掘：需要铁铲 ──
function handleGraveDig(char, state) {
  if (state.graveDug) return { success: false, message: '你已经挖过墓地了。' };
  const idx = char.inventory.findIndex(i => i.name === '铁铲' && i.qty > 0);
  if (idx === -1) return { success: false, message: '你需要一把铁铲来挖掘墓地，可以去商店购买。', dungeonUpdates: { ...state } };
  const newInv = [...char.inventory];
  newInv[idx] = { ...newInv[idx] };
  newInv[idx].qty -= 1;
  if (newInv[idx].qty <= 0) newInv.splice(idx, 1);
  return {
    success: true, message: '你挖开了墓地，找到了一把钥匙！',
    updatedCharacter: { inventory: newInv },
    dungeonUpdates: { ...state, hasKey: true, graveDug: true },
  };
}

// ── 墓地灵感：感知 DC=12 ──
function handleGraveInsight(char, state) {
  if (state.graveInsightDone) return { success: false, message: '你已经在这里思考过了。' };
  const roll = check(char.stats.wisdom, 12);
  const result = { success: roll.success, roll, message: '', dungeonUpdates: { ...state, graveInsightDone: true } };
  if (roll.success) {
    result.message = '你从墓地的铭文中获得了一条重要线索！';
    result.dungeonUpdates = { ...state, graveInsightDone: true, hasClue: true };
  } else {
    result.message = '你没能参透墓地的奥秘。';
  }
  return result;
}

// ── 头目战斗：力量 DC=13 ──
function handleBossFight(char, state) {
  if (state.bossDefeated) return { success: false, message: '头目已经被击败了。' };
  const roll = check(char.stats.strength, 13);
  const result = { success: roll.success, roll, message: '你不是头目的对手，攻击没有奏效。', dungeonUpdates: { ...state } };
  if (roll.success) {
    const newInv = [...char.inventory];
    const existing = newInv.find(i => i.name === '纪念章');
    if (existing) existing.qty += 1;
    else newInv.push({ name: '纪念章', qty: 1 });
    result.message = '你击败了头目，获得了一枚纪念章！';
    result.updatedCharacter = { inventory: newInv };
    result.dungeonUpdates = { ...state, bossDefeated: true };
  }
  return result;
}

// ── 头目说服：需要线索 ──
function handleBossPersuade(char, state) {
  if (!state.hasClue) {
    return { success: false, message: '你没有任何筹码可以说服头目，需要先去墓地寻找线索。', dungeonUpdates: { ...state } };
  }
  return { success: true, message: '你出示线索成功说服了头目，他交出了钥匙！', dungeonUpdates: { ...state, hasClue: false, hasKey: true } };
}

// ── 离开副本：需要钥匙 ──
function handleExitLeave(char, state) {
  if (!state.hasKey) {
    return { success: false, message: '没有钥匙无法离开副本，你需要继续探索。', dungeonUpdates: { ...state } };
  }
  const dungeonName = '古老墓地';
  const completed = [...(char.completedDungeons || [])];
  if (!completed.includes(dungeonName)) completed.push(dungeonName);
  return {
    success: true, message: '你使用钥匙打开了出口大门，成功离开了副本！',
    updatedCharacter: { completedDungeons: completed },
    dungeonUpdates: { ...state },
  };
}

module.exports = router;