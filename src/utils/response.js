class AppError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

function success(data, message = 'ok') {
  return { code: 0, data, message };
}

function error(code, message) {
  return { code, data: null, message };
}

module.exports = { AppError, success, error };
