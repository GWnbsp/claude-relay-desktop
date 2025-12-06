# 项目架构说明

## 架构概览

本项目采用 **双层架构** 设计：

```
┌─────────────────────────────────────────────────────┐
│              Tauri Desktop Application              │
│  ┌───────────────────────────────────────────────┐  │
│  │          Frontend (React + TypeScript)         │  │
│  │  - Dashboard, Settings, Accounts, Logs UI      │  │
│  │  - State Management (React Context)            │  │
│  │  - i18n, Theme, Routing                        │  │
│  └────────────┬──────────────────────────────┬────┘  │
│               │ Tauri Commands               │        │
│               │ Event Listeners              │        │
│  ┌────────────▼──────────────────────────────▼────┐  │
│  │       Tauri Backend (Rust)                     │  │
│  │  - Process Management                          │  │
│  │  - System Tray / App Menu                      │  │
│  │  - Config File I/O                             │  │
│  │  - Notifications                               │  │
│  └────────────┬───────────────────────────────────┘  │
│               │ Child Process (spawn)                │
└───────────────┼──────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│           cc-relay-server (Binary)                  │
│  ┌───────────────────────────────────────────────┐  │
│  │     relay-server (HTTP Server)                │  │
│  │  - Axum Web Framework                         │  │
│  │  - Account Selection & Routing                │  │
│  │  - Session Management                         │  │
│  └────────────┬──────────────────────────────────┘  │
│               │                                      │
│  ┌────────────▼──────────────────────────────────┐  │
│  │     Account Implementations                   │  │
│  │  - relay-claude (OAuth / API Key)             │  │
│  │  - relay-gemini (Google OAuth)                │  │
│  │  - relay-codex (OpenAI Responses)             │  │
│  │  - relay-openai-to-anthropic (Converter)      │  │
│  └────────────┬──────────────────────────────────┘  │
│               │                                      │
│  ┌────────────▼──────────────────────────────────┐  │
│  │     relay-core (Traits & Types)               │  │
│  │  - Account, Forwarder Traits                  │  │
│  │  - Config, Error, Models                      │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 目录结构

```
claude-code-relay/
├── src/                           # React 前端代码
│   ├── components/                # UI 组件
│   │   ├── ui/                    # shadcn/ui 基础组件
│   │   ├── layout/                # Layout, Sidebar
│   │   ├── settings/              # Settings 相关组件
│   │   └── dashboard/             # Dashboard 相关组件
│   ├── contexts/                  # React Context
│   │   ├── AppContext.tsx         # 全局应用状态
│   │   └── ThemeContext.tsx       # 主题状态
│   ├── pages/                     # 页面组件
│   │   ├── Dashboard.tsx
│   │   ├── Settings.tsx
│   │   ├── Accounts.tsx
│   │   └── Logs.tsx
│   ├── services/                  # 服务层
│   │   ├── api.ts                 # Tauri API 封装
│   │   └── config.ts              # 配置解析
│   ├── i18n/                      # 国际化
│   │   └── locales/               # 语言文件
│   └── lib/                       # 工具函数
│
├── src-tauri/                     # Tauri 后端代码
│   ├── src/
│   │   ├── main.rs                # 应用入口
│   │   ├── commands.rs            # Tauri 命令处理
│   │   ├── server.rs              # 服务器进程管理
│   │   ├── tray.rs                # 系统托盘
│   │   ├── app_menu.rs            # 应用菜单 (macOS)
│   │   ├── app_settings.rs        # 应用设置
│   │   ├── config.rs              # 配置管理
│   │   └── logger.rs              # 日志管理
│   ├── tauri.conf.json            # Tauri 配置
│   └── Cargo.toml                 # Rust 依赖
│
├── crates/                        # Relay Server 核心 (基于原项目)
│   ├── relay-core/                # 核心 Traits 和类型
│   │   ├── src/
│   │   │   ├── account.rs         # Account trait
│   │   │   ├── forwarder.rs       # Forwarder trait
│   │   │   ├── config.rs          # 配置结构
│   │   │   ├── error.rs           # 错误类型
│   │   │   └── models.rs          # 数据模型
│   │   └── Cargo.toml
│   │
│   ├── relay-claude/              # Claude 实现
│   │   ├── src/
│   │   │   ├── account.rs         # ClaudeAccount
│   │   │   ├── oauth.rs           # OAuth 刷新
│   │   │   └── forwarder.rs       # ClaudeForwarder
│   │   └── Cargo.toml
│   │
│   ├── relay-gemini/              # Gemini 实现
│   │   ├── src/
│   │   │   ├── account.rs         # GeminiAccount
│   │   │   ├── oauth.rs           # Google OAuth
│   │   │   └── forwarder.rs       # GeminiForwarder
│   │   └── Cargo.toml
│   │
│   ├── relay-codex/               # OpenAI Responses 实现
│   │   ├── src/
│   │   │   ├── account.rs         # CodexAccount
│   │   │   └── forwarder.rs       # CodexForwarder
│   │   └── Cargo.toml
│   │
│   ├── relay-openai-to-anthropic/ # OpenAI 格式转换
│   │   ├── src/
│   │   │   ├── converter.rs       # 消息格式转换
│   │   │   └── forwarder.rs       # OpenAIForwarder
│   │   └── Cargo.toml
│   │
│   └── relay-server/              # HTTP 服务器
│       ├── src/
│       │   ├── main.rs            # 服务器入口
│       │   ├── routes/            # API 路由
│       │   │   ├── claude.rs
│       │   │   ├── gemini.rs
│       │   │   ├── openai.rs
│       │   │   └── system.rs
│       │   ├── middleware/        # 中间件
│       │   │   ├── auth.rs
│       │   │   └── logging.rs
│       │   ├── state.rs           # 应用状态
│       │   └── scheduler.rs       # 账户调度器
│       └── Cargo.toml
│
├── scripts/                       # 构建脚本
│   └── build-relay-server.sh      # 构建 relay-server
│
├── Cargo.toml                     # Workspace 配置
├── package.json                   # npm 配置
├── vite.config.ts                 # Vite 配置
├── tailwind.config.js             # Tailwind 配置
└── tsconfig.json                  # TypeScript 配置
```

## 核心组件说明

### 1. Frontend (React + TypeScript)

#### 状态管理 (`src/contexts/AppContext.tsx`)

使用 React Context API 管理全局状态：

```typescript
interface AppState {
  config: Config | null           // 配置文件
  accounts: AccountWithModels[]   // 账户列表（含模型信息）
  serverStatus: ServerStatus      // 服务器状态
  logs: string[]                  // 日志
}

interface AppActions {
  loadConfig()                    // 加载配置
  loadAccounts()                  // 加载账户列表
  startServer()                   // 启动服务器
  stopServer()                    // 停止服务器
  restartServer()                 // 重启服务器
  refreshStatus()                 // 刷新状态
}
```

#### UI 组件

- **shadcn/ui** - 基础组件（Button, Card, Dialog, etc.）
- **lucide-react** - 图标库
- **react-router-dom** - 路由管理
- **react-i18next** - 国际化
- **tailwindcss** - 样式系统

### 2. Tauri Backend (Rust)

#### 进程管理 (`src-tauri/src/server.rs`)

```rust
pub struct ServerHandle {
    child: Child,              // 子进程
    port: u16,                 // 监听端口
    log_tasks: Vec<JoinHandle> // 日志捕获任务
}

impl ServerHandle {
    pub async fn start(...) -> Result<Self, String> {
        // 1. 查找二进制文件
        // 2. 检查端口可用性
        // 3. 启动子进程
        // 4. 验证服务启动
        // 5. 捕获日志输出
    }
}

impl Drop for ServerHandle {
    fn drop(&mut self) {
        // 清理子进程和日志任务
    }
}
```

#### Tauri Commands (`src-tauri/src/commands.rs`)

暴露给前端的 API：

```rust
#[tauri::command]
async fn start_server(...) -> Result<u16, String>

#[tauri::command]
async fn stop_server(...) -> Result<(), String>

#[tauri::command]
async fn restart_server(...) -> Result<u16, String>

#[tauri::command]
async fn get_server_status(...) -> Result<ServerStatus, String>

#[tauri::command]
async fn read_config(...) -> Result<String, String>

#[tauri::command]
async fn write_config(...) -> Result<(), String>

#[tauri::command]
async fn get_account_models(...) -> Result<Vec<AccountWithModels>, String>
```

#### 系统集成

- **系统托盘** (`tray.rs`) - 跨平台托盘图标和菜单
- **应用菜单** (`app_menu.rs`) - macOS 应用菜单栏
- **通知** (`commands.rs`) - 系统通知
- **自动启动** (`tauri-plugin-autostart`) - 开机自启动

### 3. Relay Server (Rust)

#### 核心 Trait (`crates/relay-core/src/`)

```rust
#[async_trait]
pub trait Account: Send + Sync {
    async fn ensure_valid_token(&mut self) -> Result<String, Error>;
    fn is_enabled(&self) -> bool;
    fn priority(&self) -> i32;
}

#[async_trait]
pub trait Forwarder: Send + Sync {
    async fn forward(
        &self,
        account: &dyn Account,
        request: Request<Body>,
    ) -> Result<Response<Body>, Error>;
}
```

#### 账户实现

每种账户类型都实现了 `Account` 和 `Forwarder` traits：

- **ClaudeAccount** - 支持 OAuth 和 API Key 两种认证方式
- **GeminiAccount** - 使用 Google OAuth
- **CodexAccount** - 使用 OpenAI API Key
- **OpenAIForwarder** - 将 OpenAI 格式转换为 Claude 格式

#### HTTP 服务器 (`crates/relay-server/src/`)

使用 Axum 框架，提供：

- **路由** - Claude, Gemini, OpenAI 兼容端点
- **中间件** - 认证、日志、CORS
- **调度器** - 基于优先级的账户选择
- **会话管理** - 粘性会话（Session Stickiness）

## 数据流

### 1. 启动服务器流程

```
用户点击"启动服务"
  → Frontend: startServer()
  → Tauri Command: start_server()
  → ServerHandle::start()
    → 查找 cc-relay-server 二进制
    → 检查端口可用性
    → spawn 子进程
    → 等待端口开始监听
    → 捕获 stdout/stderr
  → 更新托盘菜单状态
  → 发送系统通知
  → 返回端口号给前端
  → Frontend: 更新 serverStatus
```

### 2. 配置保存流程

```
用户保存配置
  → Frontend: handleSave()
  → buildConfig() 构建 Config 对象
  → ConfigManager.stringify() 转换为 TOML
  → Tauri Command: write_config()
    → 检查服务器是否运行
    → 写入配置文件
    → 如果服务器在运行:
      → stop_server()
      → start_server() (使用新配置)
  → Frontend: loadConfig() + loadAccounts()
```

### 3. API 请求转发流程

```
客户端 (Claude Code CLI)
  → HTTP Request: POST /api/v1/messages
  → relay-server 接收请求
  → 认证中间件验证 API Key
  → 会话管理器查找 Session
    → 如果存在: 使用绑定的账户
    → 如果不存在: 调度器选择最优账户
  → ClaudeAccount::ensure_valid_token()
    → 如果是 OAuth: 检查并刷新 token
    → 如果是 API Key: 直接返回
  → ClaudeForwarder::forward()
    → 构建上游请求
    → 转发到 api.anthropic.com
    → 流式返回响应
  → 更新会话 TTL
  → 返回给客户端
```

## 跨平台处理

### 条件编译

使用 Rust 的条件编译特性实现平台特定逻辑：

```rust
// macOS: 使用 LaunchAgent
#[cfg(target_os = "macos")]
let autostart_config = tauri_plugin_autostart::MacosLauncher::LaunchAgent;

// Windows/Linux: 使用默认配置
#[cfg(not(target_os = "macos"))]
let autostart_config = None;
```

### 平台差异

| 特性         | macOS                      | Windows                | Linux                 |
| ------------ | -------------------------- | ---------------------- | --------------------- |
| 托盘菜单     | 左键切换窗口，无右键菜单   | 左键切换，右键显示菜单 | 同 Windows            |
| 应用菜单     | 顶部菜单栏                 | 无                     | 无                    |
| 自动启动     | LaunchAgent                | 注册表                 | .desktop 文件         |
| 通知         | Notification Center        | Toast Notifications    | libnotify / D-Bus     |
| 配置文件路径 | ~/Library/Application Support | %APPDATA%         | ~/.config 或 ~/.local/share |

## 相较于原项目的修改

### `crates/` 修改

1. **日志输出优化**
   - 添加了结构化日志标记
   - 优化了错误信息格式

2. **错误处理增强**
   - 更详细的错误消息
   - 更好的错误传播

3. **Tauri 集成支持**
   - 确保进程可以被正确启动和停止
   - 输出可以被父进程捕获

### 新增组件

- **Tauri Frontend** - 完整的 React UI
- **Tauri Backend** - 进程管理和系统集成
- **系统托盘** - 跨平台托盘支持
- **应用菜单** - macOS 应用菜单
- **日志管理** - 内存中保留最近 1000 条日志
- **应用设置** - 独立于服务器配置的应用级设置

## 构建系统

### 开发模式

```bash
npm run tauri:dev
```

执行流程：
1. `scripts/build-relay-server.sh` 构建 `target/debug/cc-relay-server`
2. Vite 启动前端开发服务器 (http://localhost:5173)
3. Tauri 启动桌面应用，加载前端
4. 前端支持 HMR (Hot Module Replacement)

### 生产构建

```bash
npm run build:server:release  # 构建 release 版本的 relay-server
npm run tauri:build           # 打包桌面应用
```

打包产物：
- macOS: `.app`, `.dmg`
- Windows: `.exe`, `.msi`
- Linux: `.AppImage`, `.deb`

## 技术栈总结

### Frontend
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: TailwindCSS + shadcn/ui
- **路由**: React Router v6
- **国际化**: react-i18next
- **状态管理**: React Context API

### Backend (Tauri)
- **框架**: Tauri v1.6
- **语言**: Rust
- **插件**: tauri-plugin-autostart

### Server (Relay)
- **Web 框架**: Axum
- **异步运行时**: Tokio
- **HTTP 客户端**: reqwest
- **序列化**: serde + toml
- **数据库**: SQLite (rusqlite)

## 安全考虑

1. **API Key 存储** - 配置文件使用操作系统的应用数据目录，具有适当的文件权限
2. **进程隔离** - relay-server 作为独立子进程运行
3. **输入验证** - 前端和后端都进行输入验证
4. **CORS** - relay-server 配置了适当的 CORS 策略
5. **认证** - 支持 API Key 认证，防止未授权访问

## 性能优化

1. **粘性会话** - 减少账户切换，保持上下文连续性
2. **Token 缓存** - OAuth token 缓存在内存中，减少刷新次数
3. **流式响应** - 使用 SSE 流式传输，降低延迟
4. **日志循环缓冲** - 内存中只保留最近 1000 条日志
5. **异步 I/O** - 全异步实现，高并发性能

## 未来扩展

可能的扩展方向：

1. **更多平台支持** - Deepseek, Moonshot 等
2. **高级调度策略** - 负载均衡、故障转移
3. **统计和监控** - 请求统计、成本分析
4. **插件系统** - 支持自定义账户类型
5. **云同步** - 配置文件云端备份
6. **多语言支持** - 添加更多语言选项
