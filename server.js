const app = require('./src/app');
const config = require('./src/config');

app.listen(config.port, () => {
  console.log(`[DND Server] \u670d\u52a1\u5df2\u542f\u52a8: http://localhost:${config.port}`);
  console.log(`[DND Server] API \u57fa\u7840\u8def\u5f84: http://localhost:${config.port}/api`);
});
