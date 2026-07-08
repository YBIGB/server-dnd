const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('../utils/response');

/**
 * JWT 鉴权中间件
 * 从 Authorization header 提取 token 并验证
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(1002, '未登录，请先登录', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // { userId, username }
    next();
  } catch (err) {
    throw new AppError(1002, 'Token 已过期或无效，请重新登录', 401);
  }
}

module.exports = authMiddleware;
