# CMDD JS - Electron 用户管理系统

这是一个基于 Electron + React + TypeScript + Better-SQLite3 + Drizzle ORM 的桌面应用程序，实现了完整的模型数据管理功能。

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **桌面框架**: Electron 22
- **数据库**: Better-SQLite3 + Drizzle ORM
- **样式**: CSS3
- **包管理**: pnpm

## 功能特性

### 用户管理
- ✅ 用户创建、查询、更新、删除 (CRUD)
- ✅ 用户搜索功能
- ✅ 用户状态管理 (活跃/非活跃/待审核)
- ✅ 默认用户数据自动初始化
- ✅ 实时数据验证

### 数据库特性
- ✅ SQLite 数据库本地存储
- ✅ Drizzle ORM 类型安全
- ✅ 数据库迁移管理
- ✅ WAL 模式性能优化
- ✅ 自动表创建和初始化

### 界面特性
- ✅ 现代化用户界面
- ✅ 响应式设计
- ✅ 实时状态反馈
- ✅ 表单验证
- ✅ 搜索和过滤功能

## 项目结构

```
src/
├── main/                 # 主进程
│   ├── database/        # 数据库相关
│   │   ├── schema.ts    # 数据库模式定义
│   │   ├── index.ts     # 数据库连接和操作
│   │   └── migrations/  # 数据库迁移文件
│   ├── main.ts          # 主进程入口
│   └── test-database.ts # 数据库测试
├── preload/             # 预加载脚本
│   └── proload.ts       # IPC 通信接口
└── renderer/            # 渲染进程
    └── src/
        ├── App.tsx      # 主应用组件
        └── components/  # React 组件
```

## 快速开始

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm run dev
```

### 构建应用
```bash
# 构建所有平台
pnpm run build

# 构建特定平台
pnpm run build:win    # Windows
pnpm run build:mac    # macOS
pnpm run build:linux  # Linux
```

### 数据库操作
```bash
# 生成迁移文件
pnpm run db:generate

# 推送迁移到数据库
pnpm run db:push

# 打开 Drizzle Studio
pnpm run db:studio
```

## 数据库模式

### 用户表 (users)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| username | TEXT | 用户名，唯一 |
| email | TEXT | 邮箱，唯一 |
| full_name | TEXT | 全名 |
| avatar | TEXT | 头像URL |
| status | TEXT | 状态 (active/inactive/pending) |
| created_at | INTEGER | 创建时间 |
| updated_at | INTEGER | 更新时间 |

## 默认数据

应用启动时会自动创建以下默认用户：

1. **admin** - 系统管理员
2. **demo** - 演示用户
3. **guest** - 访客用户

## API 接口

### 用户管理
- `user.create(userData)` - 创建用户
- `user.getById(id)` - 根据ID获取用户
- `user.getByEmail(email)` - 根据邮箱获取用户
- `user.getByUsername(username)` - 根据用户名获取用户
- `user.getAll()` - 获取所有用户
- `user.update(id, updates)` - 更新用户
- `user.delete(id)` - 删除用户
- `user.search(query)` - 搜索用户

## 开发说明

### 数据库操作
所有数据库操作都在 `src/main/database/index.ts` 中实现，使用 Better-SQLite3 进行底层操作，Drizzle ORM 提供类型安全。

### IPC 通信
主进程和渲染进程通过 IPC 进行通信，接口定义在 `src/preload/proload.ts` 中。

### 状态管理
使用 React Hooks 进行状态管理，包括用户列表、表单状态、加载状态等。

## 许可证

MIT License
