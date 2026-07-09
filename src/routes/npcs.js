const { Router } = require('express');
const store = require('../models/store');
const { success } = require('../utils/response');

const router = Router();

// 5.1 获取 NPC 列表
router.get('/', (req, res, next) => {
  try {
    const { role } = req.query;
    const npcs = store.findAllNpcs(role || null);
    res.json(success({ npcs }));
  } catch (err) { next(err); }
});

// 5.2 获取单个 NPC
router.get('/:id', (req, res, next) => {
  try {
    const npc = store.findNpcById(Number(req.params.id));
    if (!npc) return res.status(404).json({ code: 1001, data: null, message: 'NPC 不存在' });
    res.json(success({ npc }));
  } catch (err) { next(err); }
});

module.exports = router;