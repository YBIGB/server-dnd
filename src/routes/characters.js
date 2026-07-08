const { Router } = require('express');
const store = require('../models/store');
const authMiddleware = require('../middleware/auth');
const { AppError, success } = require('../utils/response');

const router = Router();

// 所有角色接口需要登录
router.use(authMiddleware);

// 2.1 获取角色列表
router.get('/', (req, res, next) => {
  try {
    const list = store.findCharactersByUserId(req.user.userId);
    res.json(success({ characters: list }));
  } catch (err) {
    next(err);
  }
});

// 2.2 创建角色
router.post('/', (req, res, next) => {
  try {
    const { name, stats } = req.body;

    // 基础参数校验
    if (!name || typeof name !== 'string' || name.length < 1 || name.length > 20) {
      throw new AppError(1001, '角色名须为 1~20 个字符');
    }
    if (!stats || typeof stats !== 'object') {
      throw new AppError(1001, '属性不能为空');
    }

    const statFields = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

    // 校验每个属性
    for (const field of statFields) {
      const val = stats[field];
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 3 || val > 10) {
        throw new AppError(3002, '每项属性须为 3~10 的整数');
      }
    }

    // 校验总和：5*6 + 4 = 34
    const sum = statFields.reduce((acc, f) => acc + stats[f], 0);
    if (sum !== 34) {
      throw new AppError(3002, '属性总和必须为 34（六项初始 5，可分配 4 点）');
    }

    const character = store.createCharacter(req.user.userId, { name, stats });
    res.status(201).json(success({ character }));
  } catch (err) {
    next(err);
  }
});

// 2.3 更新角色
router.put('/:id', (req, res, next) => {
  try {
    const char = store.findCharacterById(req.params.id);
    if (!char) {
      throw new AppError(3001, '角色不存在');
    }
    if (char.userId !== req.user.userId) {
      throw new AppError(1003, '无权操作此角色');
    }

    const allowedFields = ['name', 'hp', 'gold', 'isAlive', 'inventory', 'completedDungeons'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = store.updateCharacter(char.id, updates);
    res.json(success({ character: updated }));
  } catch (err) {
    next(err);
  }
});

// 2.4 遣散角色（删除）
router.delete('/:id', (req, res, next) => {
  try {
    const char = store.findCharacterById(req.params.id);
    if (!char) {
      throw new AppError(3001, '角色不存在');
    }
    if (char.userId !== req.user.userId) {
      throw new AppError(1003, '无权操作此角色');
    }

    store.deleteCharacter(char.id);
    res.json(success({ deleted: true }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
