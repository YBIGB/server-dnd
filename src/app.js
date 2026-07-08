const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');
const dungeonRoutes = require('./routes/dungeon');

const app = express();

// 中间件
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// UTF-8 编码：契约要求 charset=utf-8
app.use((req, res, next) => {
  res.charset = 'utf-8';
  next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/dungeon', dungeonRoutes);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ code: 0, data: { status: 'ok' }, message: 'ok' });
});

// 错误处理（必须在路由之后）
app.use(errorHandler);

module.exports = app;
