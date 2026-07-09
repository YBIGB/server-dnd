const { Router } = require('express');
const store = require('../models/store');
const { success } = require('../utils/response');

const router = Router();

// 4.1 获取物品列表
router.get('/', (req, res, next) => {
  try {
    const { type, subtype } = req.query;
    const items = store.findAllItems(type || null, subtype || null);
    res.json(success({ items }));
  } catch (err) { next(err); }
});

// 4.2 获取单个物品
router.get('/:id', (req, res, next) => {
  try {
    const item = store.findItemById(Number(req.params.id));
    if (!item) return res.status(404).json({ code: 1001, data: null, message: '物品不存在' });
    res.json(success({ item }));
  } catch (err) { next(err); }
});

module.exports = router;