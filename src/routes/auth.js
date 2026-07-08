const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const store = require('../models/store');
const { AppError, success } = require('../utils/response');

const router = Router();

// 1.1 用户注册
router.post('/register', (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 参数校验
    if (!username || typeof username !== 'string' || username.length < 1 || username.length > 20) {
      throw new AppError(1001, '用户名须为 1~20 个字符');
    }
    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 32) {
      throw new AppError(1001, '密码须为 6~32 个字符');
    }

    // 检查用户名是否已存在
    if (store.findUserByUsername(username)) {
      throw new AppError(2001, '账号已存在');
    }

    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 创建用户
    const user = store.createUser(username, hashedPassword);

    // 签发 Token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json(success({ token, username: user.username }));
  } catch (err) {
    next(err);
  }
});

// 1.2 用户登录
router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError(1001, '用户名和密码不能为空');
    }

    const user = store.findUserByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new AppError(2002, '账号或密码错误');
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json(success({ token, username: user.username }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
