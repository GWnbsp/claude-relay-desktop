# Claude Code Relay - Desktop Edition

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个基于 [claude-code-relay](https://github.com/wakaka6/claude-code-relay) 的跨平台桌面应用，为 AI API 中转服务提供图形化管理界面。

## 项目简介

本项目是 [wakaka6/claude-code-relay](https://github.com/wakaka6/claude-code-relay) 的桌面版本，集成了 Tauri 框架，提供：

- 🖥️ **跨平台桌面应用** - 支持 macOS、Windows 和 Linux
- 🎨 **现代化 UI** - 基于 React + TailwindCSS 的美观界面
- 🔧 **可视化配置** - 无需手动编辑配置文件
- 📊 **实时监控** - Dashboard 显示服务器状态和账户信息
- 🌐 **国际化支持** - 中文/英文双语界面
- 🎭 **主题切换** - 支持亮色/暗色模式
- 🚀 **开机自启** - 可选的系统启动项集成
- 🔔 **系统通知** - 服务器状态变化通知
- 📋 **系统托盘** - 最小化到托盘，后台运行

## 核心功能

### 多平台 AI API 支持

- **Claude OAuth** - 支持 Claude Code CLI 的 OAuth 认证
- **Claude API Key** - 支持标准 Anthropic API Key
- **Gemini** - 支持 Google OAuth 认证
- **OpenAI Responses** - 支持 OpenAI Responses API (Codex CLI)

### 智能中转特性

- **智能账户调度** - 基于优先级的多账户自动切换
- **粘性会话** - 同一会话绑定同一账户，确保上下文连续性
- **自动 Token 刷新** - OAuth Token 自动续期
- **代理支持** - 每个账户支持独立的 SOCKS5/HTTP 代理配置
- **流式响应** - 完整的 SSE 流式传输支持
- **错误故障转移** - 智能错误检测与账户自动切换

## 快速开始

### 下载安装包

前往 [Releases](../../releases) 页面下载对应平台的安装包：

- **macOS**: `.dmg` 或 `.app`
- **Windows**: `.exe` 或 `.msi`
- **Linux**: `.AppImage` 或 `.deb`

### 初次配置

1. 启动应用
2. 前往 **设置 → 服务器配置** 添加账户
3. 配置 API Keys（可选，用于访问控制）
4. 点击 **保存配置**
5. 前往 **Dashboard** 点击 **启动服务**

### 使用中转服务

配置客户端指向本地中转服务：

```bash
# Claude Code CLI
export ANTHROPIC_BASE_URL=http://localhost:3000
export ANTHROPIC_API_KEY=your-relay-api-key

# OpenAI 兼容客户端
export OPENAI_BASE_URL=http://localhost:3000/openai/v1
export OPENAI_API_KEY=your-relay-api-key
```

详细配置说明请参考 [客户端配置文档](#客户端配置)。

## 项目架构

本项目由两部分组成：

### 1. **Relay Server** (`crates/`)

基于 [claude-code-relay](https://github.com/wakaka6/claude-code-relay) 的 Rust 中转服务核心，包含：

- `relay-core/` - 核心类型与 Trait 定义
- `relay-claude/` - Claude 账户与转发实现
- `relay-gemini/` - Gemini 账户与转发实现
- `relay-codex/` - OpenAI Responses (Codex) 账户与转发实现
- `relay-openai-to-anthropic/` - OpenAI 格式转换器
- `relay-server/` - HTTP 服务器与路由

**相较于原项目的修改**：
- 添加了与 Tauri 的集成支持
- 优化了日志输出格式
- 增强了错误处理机制

### 2. **Desktop Frontend** (`src/`, `src-tauri/`)

基于 Tauri 的桌面应用界面：

- **前端** (`src/`) - React + TypeScript + TailwindCSS
  - 可视化配置管理
  - 实时状态监控
  - 日志查看
  - 国际化支持

- **后端** (`src-tauri/`) - Rust + Tauri
  - 服务器进程管理
  - 系统托盘集成
  - 应用菜单（macOS）
  - 配置文件管理
  - 系统通知

详细架构说明请参考 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 开发指南

### 前置要求

- **Node.js** 18+
- **Rust** 1.70+
- **系统依赖**：
  - macOS: Xcode Command Line Tools
  - Windows: Visual Studio Build Tools
  - Linux: webkit2gtk, libayatana-appindicator3-1

### 开发环境设置

```bash
# 1. 克隆仓库
git clone https://github.com/YOUR_USERNAME/claude-code-relay.git
cd claude-code-relay

# 2. 安装依赖
npm install

# 3. 构建 relay-server（首次运行）
npm run build:server

# 4. 启动开发服务器
npm run tauri:dev
```

### 可用脚本

- `npm run dev` - 启动前端开发服务器
- `npm run build` - 构建前端生产版本
- `npm run tauri:dev` - 启动 Tauri 开发模式
- `npm run tauri:build` - 打包生产版本
- `npm run build:server` - 构建 relay-server (debug)
- `npm run build:server:release` - 构建 relay-server (release)

详细开发指南请参考 [DEVELOPMENT.md](./DEVELOPMENT.md)。

## 客户端配置

### Claude Code CLI

```bash
export ANTHROPIC_BASE_URL=http://localhost:3000
export ANTHROPIC_API_KEY=your-relay-api-key
claude
```

### Gemini CLI

```bash
export GEMINI_API_BASE=http://localhost:3000/gemini
export GEMINI_API_KEY=your-relay-api-key
gemini
```

### OpenAI Codex CLI

```bash
export OPENAI_BASE_URL=http://localhost:3000/openai/v1
export OPENAI_API_KEY=your-relay-api-key
codex
```

### Cherry Studio / Cursor

在设置中配置：
- **API 地址**: `http://localhost:3000`
- **API Key**: `your-relay-api-key`

更多客户端配置示例请查看原项目文档。

## API 端点

### Claude API
```
POST /api/v1/messages          # Claude Messages API
POST /claude/v1/messages       # 别名路由
GET  /api/v1/models            # 模型列表
```

### Gemini API
```
POST /gemini/v1/models/:model:generateContent
POST /gemini/v1/models/:model:streamGenerateContent
GET  /gemini/v1/models
```

### OpenAI 兼容
```
POST /openai/v1/chat/completions   # OpenAI 格式转 Claude
GET  /openai/v1/models
```

### 系统端点
```
GET /health    # 健康检查
GET /metrics   # 系统指标
```

## 跨平台支持

本应用已针对 Windows、macOS 和 Linux 进行了全面的跨平台适配。

详细的平台兼容性说明请参考：
- [PLATFORM_COMPATIBILITY.md](./PLATFORM_COMPATIBILITY.md) - 跨平台特性说明
- [NOTIFICATION_SETUP.md](./NOTIFICATION_SETUP.md) - macOS 通知设置指南

## 配置文件位置

应用配置文件默认位于：

- **macOS**: `~/Library/Application Support/com.claude-relay.app/config.toml`
- **Windows**: `%APPDATA%\com.claude-relay.app\config.toml`
- **Linux**: `~/.config/claude-relay/config.toml`

日志文件位于应用数据目录的 `logs/` 子目录。

## 致谢

- [wakaka6/claude-code-relay](https://github.com/wakaka6/claude-code-relay) - 原始 Relay Server 实现
- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库

## License

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 贡献

欢迎提交 Issue 和 Pull Request！

如果你在使用过程中遇到问题，请：
1. 查看 [常见问题](./docs/FAQ.md)（如果有）
2. 搜索现有 [Issues](../../issues)
3. 创建新的 Issue 并提供详细信息

## 相关链接

- [原项目仓库](https://github.com/wakaka6/claude-code-relay)
- [Tauri 文档](https://tauri.app/)
- [Claude API 文档](https://docs.anthropic.com/)
