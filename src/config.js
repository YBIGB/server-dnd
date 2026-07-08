require('dotenv').config();
module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  dbPath: process.env.DB_PATH || 'data/dnd.db',
};
