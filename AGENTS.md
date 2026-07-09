# DND 跑团 — 后端项目

> Node.js + Express + SQLite 后端服务。

---

## 前后端协作约定

本项目与前端仓库 **`E:/360/game-try`** 跨项目协作。

**代码边界：** 前后端互为独立项目，双方 AI 均不得直接通读对方源码。需要同步状态时，前端会修改自己 `docs/` 目录下的文档，一切任务交接以文档为准。

| 前端文档 | 作用 |
|----------|------|
| `E:/360/game-try/docs/API-CONTRACT.md` | **接口规范** — 后端实现的唯一依据 |
| `E:/360/game-try/docs/BACKEND-DEV-GUIDE.md` | **任务跟踪** — 前端发布任务、标注状态的地方 |

**工作流：**
1. 前端在 `BACKEND-DEV-GUIDE.md` 中发布任务（标记 `📝`）
2. 后端只读 `docs/` 下的文档来实现，**不浏览前端 `src/` 源码**
3. 后端完成后告知前端去更新对应的状态标识

---


## Git 提交规范
- 所有 commit message **必须使用中文**

## 快速启动

```bash
npm start       # 生产启动
npm run dev     # 热重载开发
```

服务默认监听 `http://localhost:3000`，API 基础路径 `/api`。

---

## 技术栈

| 技术 | 用途 |
|------|------|
| Node.js | 运行时 |
| Express | Web 框架 |
| better-sqlite3 | 数据库（同步 SQLite3 驱动） |
| jsonwebtoken | JWT 鉴权 |
| bcryptjs | 密码哈希 |

---

## 项目结构

```
src/
├── app.js              # Express 应用配置与路由注册
├── config.js           # 配置读取（端口、JWT密钥、DB路径）
├── middleware/
│   ├── auth.js         # JWT 鉴权中间件
│   └── errorHandler.js # 全局错误处理
├── models/
│   ├── db.js           # SQLite 数据库初始化与建表
│   └── store.js        # 数据操作层（增删查改）
├── routes/
│   ├── auth.js         # 认证模块：注册 / 登录
│   ├── characters.js   # 角色管理：CRUD + 属性校验
│   └── dungeon.js      # 副本互动：7 种行动逻辑
└── utils/
    ├── dice.js         # D20 掷骰与属性检定
    └── response.js     # 统一响应格式 { code, data, message }
```

---

## 接口约定

### 通用响应格式

```typescript
// 成功
{ code: 0, data: T, message: "ok" }

// 错误
{ code: number, data: null, message: string }
```

### 鉴权

需要登录的接口在请求头携带：

```
Authorization: Bearer <token>
```

### 错误码

| code | 含义 |
|------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 未登录 / Token 过期 |
| 1003 | 无权限 |
| 2001 | 账号已存在 |
| 2002 | 账号或密码错误 |
| 3001 | 角色不存在 |
| 3002 | 属性分配无效 |
| 4001 | 副本行动无效 |

---

## 数据库

- 文件位置: `data/dnd.db`（首次启动自动创建）
- WAL 模式，外键约束开启
- 数据在服务重启后持久保留
- 删除 `data/` 目录可重置

---

## 开发注意事项

- 所有掷骰判定 **必须在后端执行**，前端仅展示结果
- 角色属性分配规则：每项 3~10，总和必须为 34
- 副本行动状态由后端 `dungeonUpdates` 返回，前端同步
- 编码为 UTF-8


## ????

?????????????????????
1. ?????????git status????????lint/????
2. ???? `AGENTS.md`??????????????????????
3. ?????????


## 工作收尾

当我说「工作阶段性告一段落」时，你应执行：

1. 检查项目当前状态（git status、未提交的改动、lint/测试等）
2. 如需更新 AGENTS.md（补充新的约定、规则或项目状态变化），则更新
3. 将更新后的 AGENTS.md 立即提交
4. 推送所有改动
