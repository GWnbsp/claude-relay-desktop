# Claude Code Relay Desktop

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-1.6-blue.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)

**[English](./README_EN.md) | 简体中文**

Claude Code Relay 的跨平台桌面客户端，基于 Tauri + React + TypeScript 构建，为 [claude-code-relay](https://github.com/wakaka6/claude-code-relay) 提供现代化的图形界面。

## ✨ 特性

### 🎨 现代化界面
- **响应式设计** - 适配各种屏幕尺寸
- **深色/浅色主题** - 自动跟随系统或手动切换
- **中英文双语** - 完整的国际化支持
- **优雅的动画** - 流畅的过渡效果

### 🚀 核心功能
- **一键启动/停止** - 图形化管理 relay-server 进程
- **可视化配置** - 无需手动编辑 TOML 文件
- **账户管理** - 批量管理多个 AI 账户
- **实时日志** - 彩色日志输出，支持自动滚动
- **使用统计** - Token 使用量可视化分析
- **端口冲突处理** - 自动检测并关闭占用进程

### 🔧 系统集成
- **系统托盘** - 最小化到托盘，快速访问
- **开机自启** - 可选的开机自动启动
- **进程管理** - 完全控制 relay-server 生命周期
- **配置持久化** - 自动保存应用设置

## 📦 安装

### 从 Release 下载

访问 [Releases](../../releases) 页面下载对应平台的安装包：

- **Windows**: `.msi` 安装包
- **macOS**: `.dmg` 镜像文件
- **Linux**: `.AppImage` / `.deb` / `.rpm`

### 从源码构建

**前置要求**:
- Node.js 18+
- Rust 1.75+
- Tauri CLI

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/claude-relay-desktop.git
cd claude-relay-desktop/tauri

# 2. 安装依赖
npm install

# 3. 开发模式运行
npm run tauri:dev

# 4. 构建生产版本
npm run tauri:build
```

## 🚀 快速开始

### 1. 首次启动

启动应用后，会自动创建配置文件：
- **Windows**: `%APPDATA%\com.claude-relay.app\config.toml`
- **macOS**: `~/Library/Application Support/com.claude-relay.app/config.toml`
- **Linux**: `~/.config/com.claude-relay.app/config.toml`

### 2. 配置账户

进入 **设置** 页面：

1. 点击 **添加账户**
2. 选择账户类型（Claude API / Claude OAuth / Gemini / OpenAI Responses）
3. 填写账户信息
4. 设置优先级和启用状态
5. 点击 **保存配置**

### 3. 启动服务

在 **仪表盘** 页面点击 **启动** 按钮：

```
✓ 服务启动成功
  运行在端口: 3000
```

### 4. 使用 API

配置 Claude Code CLI：

```bash
# 方式 1: 环境变量
export ANTHROPIC_BASE_URL=http://127.0.0.1:3000

# 方式 2: 配置文件
claude config set api_url http://127.0.0.1:3000
```

## 📖 功能说明

### 仪表盘

- **服务状态** - 实时显示运行状态和端口
- **快速操作** - 启动/停止/重启服务器
- **统计信息** - 账户数量、活跃账户

### 账户管理

- **账户列表** - 查看所有配置的账户
- **批量操作** - 启用/禁用多个账户
- **优先级调整** - 拖拽排序或手动设置
- **账户类型**:
  - Claude API Key
  - Claude OAuth (Claude Code CLI)
  - Gemini (Google OAuth)
  - OpenAI Responses (Codex)

### 使用统计

- **Token 使用量** - 按账户统计输入/输出 tokens
- **时间范围** - 7天/30天/90天/365天
- **可视化图表** - 条形图展示使用占比
- **导出功能** - 导出为 CSV 文件
- **数据库信息** - 显示数据库路径和大小

### 日志查看

- **实时日志** - 服务器输出实时显示
- **彩色高亮** - 错误/警告/信息不同颜色
- **自动滚动** - 新日志自动滚动到底部
- **清空日志** - 一键清空当前日志

### 设置

**服务器配置**:
- 监听地址和端口
- 数据库路径
- 日志级别
- API Keys 管理

**会话配置**:
- Sticky Session TTL
- 续期阈值
- 账户冷却时间

**应用设置**:
- 语言切换（中文/English）
- 主题切换（浅色/深色/跟随系统）
- 开机自启

## 🔥 高级功能

### 端口冲突自动处理

当端口被占用时，应用会：

1. **自动检测** 占用进程（进程名、PID）
2. **弹出确认** "端口 3000 被 xxx 占用，是否关闭？"
3. **自动终止** 用户确认后终止占用进程
4. **重新启动** 自动重启服务器

### Token 使用统计

v0.2.2 新增功能，完全集成到桌面应用：

- **实时统计** - 每次 API 调用自动记录
- **按账户分组** - 清楚看到每个账户的消耗
- **持久化存储** - 数据保存在 SQLite 数据库
- **数据管理** - 可清理旧数据

### 配置验证

保存配置前自动验证：

```
✓ 服务器配置有效
✓ 至少有一个启用的账户
✓ API Keys 格式正确
✓ 端口范围合法（1-65535）
```

## 📁 项目结构

```
tauri/
├── src/                      # React 前端源码
│   ├── components/           # UI 组件
│   │   ├── layout/          # 布局组件
│   │   └── ui/              # 基础 UI 组件
│   ├── contexts/            # React Context
│   ├── i18n/                # 国际化
│   │   └── locales/         # 语言文件
│   ├── pages/               # 页面组件
│   │   ├── Dashboard.tsx    # 仪表盘
│   │   ├── Accounts.tsx     # 账户管理
│   │   ├── Settings.tsx     # 设置
│   │   ├── Logs.tsx         # 日志
│   │   └── UsageStats.tsx   # 使用统计
│   └── services/            # API 服务
│
├── src-tauri/               # Tauri 后端源码
│   ├── src/
│   │   ├── main.rs          # 入口
│   │   ├── commands.rs      # Tauri Commands
│   │   ├── server.rs        # 服务器管理
│   │   ├── config.rs        # 配置解析
│   │   ├── logger.rs        # 日志管理
│   │   ├── stats.rs         # 统计功能
│   │   ├── port_utils.rs    # 端口工具
│   │   └── tray.rs          # 系统托盘
│   └── Cargo.toml
│
├── package.json
└── README.md
```

## 🛠️ 开发指南

### 运行开发环境

```bash
# 启动开发服务器（热重载）
npm run tauri:dev

# 前端开发（仅 Vite）
npm run dev

# 类型检查
npm run type-check

# 代码格式化
npm run format
```

### 构建生产版本

```bash
# 构建所有平台
npm run tauri:build

# 仅构建当前平台
npm run tauri:build -- --target current
```

### 技术栈

**前端**:
- React 18
- TypeScript 5
- Vite 5
- TailwindCSS
- shadcn/ui
- React Router
- i18next

**后端**:
- Rust 1.75+
- Tauri 1.6
- Tokio (异步运行时)
- SQLx (数据库)
- Serde (序列化)

## ❓ 常见问题

### Q: 如何更改数据库位置？

A: 在 **设置 → 服务器配置** 中修改 `数据库路径`，支持相对路径和绝对路径。

### Q: 端口被占用怎么办？

A: 应用会自动检测并提示关闭占用进程。也可以在设置中更改端口号。

### Q: 如何备份配置？

A: 配置文件位于应用数据目录，直接复制 `config.toml` 即可。

### Q: 支持哪些平台？

A: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)

### Q: 如何查看调试日志？

A:
- Windows: 按 `Ctrl+Shift+I` 打开开发者工具
- macOS: 按 `Cmd+Option+I`
- Linux: 按 `Ctrl+Shift+I`

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

本项目采用 [MIT](../LICENSE) 协议开源。

## 🙏 致谢

- [claude-code-relay](https://github.com/wakaka6/claude-code-relay) - 上游核心服务
- [Tauri](https://tauri.app/) - 跨平台桌面框架
- [shadcn/ui](https://ui.shadcn.com/) - 优雅的 UI 组件

## 📮 联系方式

- Issue: [GitHub Issues](../../issues)
- 讨论: [GitHub Discussions](../../discussions)

---

**⭐ 如果这个项目对您有帮助，请给个 Star！**
