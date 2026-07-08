const { error } = require('../utils/response');

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, _next) {
  // 明确抛出的 AppError
  if (err.code && err.statusCode) {
    return res.status(err.statusCode).json(error(err.code, err.message));
  }

  // 参数解析错误（如 JSON 解析失败）
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(error(1001, '请求体格式错误，需要 JSON'));
  }

  // 未知错误
  console.error('[Error]', err);
  return res.status(500).json(error(9999, '服务器内部错误'));
}

module.exports = errorHandler;
