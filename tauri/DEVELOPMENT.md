# 开发指南

本文档提供 Claude Code Relay Desktop 的开发环境设置和开发流程说明。

## 前置要求

### 必需软件

- **Node.js** 18.0 或更高版本
- **Rust** 1.70 或更高版本
- **npm** 或 **yarn** 包管理器

### 系统依赖

#### macOS
```bash
# 安装 Xcode Command Line Tools
xcode-select --install
```

#### Windows
- 安装 [Visual Studio](https://visualstudio.microsoft.com/) 或 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- 确保勾选 "Desktop development with C++" 工作负载

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

#### Linux (Fedora)
```bash
sudo dnf install \
  webkit2gtk4.0-devel \
  openssl-devel \
  curl \
  wget \
  file \
  gtk3-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel
```

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/GWnbsp/claude-relay-desktop.git
cd claude-relay-desktop
```

### 2. 安装依赖

```bash
npm install
```

这会安装所有前端依赖。

### 3. 构建 Relay Server

首次运行或 `crates/` 下代码更新后，需要构建 relay-server：

```bash
# Debug 模式（开发用，编译快）
npm run build:server

# 或 Release 模式（生产用，性能更好）
npm run build:server:release
```

### 4. 启动开发服务器

```bash
npm run tauri:dev
```

这会：
1. 自动构建 relay-server (如果尚未构建)
2. 启动 Vite 前端开发服务器 (http://localhost:5173)
3. 启动 Tauri 桌面应用
4. 启用前端热更新 (HMR)

## 可用脚本

### 前端开发

```bash
# 启动前端开发服务器（不启动 Tauri）
npm run dev

# 构建前端生产版本
npm run build

# 预览前端生产构建
npm run preview
```

### Tauri 开发

```bash
# 启动 Tauri 开发模式（推荐）
npm run tauri:dev

# 打包生产版本
npm run tauri:build

# 仅构建，不打包
npm run tauri:build -- --debug
```

### Relay Server 构建

```bash
# 构建 debug 版本（开发用）
npm run build:server

# 构建 release 版本（生产用）
npm run build:server:release

# 直接使用 cargo（在项目根目录）
cargo build --release
cargo build --bin cc-relay-server
```

### 代码检查和格式化

```bash
# TypeScript 类型检查
npm run type-check

# ESLint 检查
npm run lint

# Rust 代码检查
cargo clippy

# Rust 代码格式化
cargo fmt

# Rust 测试
cargo test
```

## 开发工作流

### 典型开发流程

1. **启动开发服务器**
   ```bash
   npm run tauri:dev
   ```

2. **修改代码**
   - 前端代码 (`src/`) - 自动热更新
   - Tauri 后端 (`src-tauri/src/`) - 需要重启 Tauri
   - Relay Server (`crates/`) - 需要重新构建并重启

3. **测试**
   - 在开发模式下测试功能
   - 使用浏览器开发者工具调试前端
   - 使用 Rust 日志调试后端

4. **提交代码**
   ```bash
   git add .
   git commit -m "描述你的更改"
   ```

### 前端开发

#### 目录结构

```
src/
├── components/     # UI 组件
├── contexts/       # React Context
├── pages/          # 页面组件
├── services/       # API 服务
├── i18n/           # 国际化
└── lib/            # 工具函数
```

#### 添加新页面

1. 在 `src/pages/` 创建新组件
2. 在 `src/App.tsx` 添加路由
3. 在 `src/components/layout/Sidebar.tsx` 添加导航链接

#### 添加新组件

1. 在 `src/components/` 创建组件文件
2. 使用 TypeScript 和 shadcn/ui 组件
3. 遵循现有代码风格

#### 国际化

添加新的翻译键：

1. 编辑 `src/i18n/locales/zh.json`
2. 编辑 `src/i18n/locales/en.json`
3. 使用 `useTranslation()` hook:
   ```typescript
   const { t } = useTranslation()
   return <div>{t('your.key')}</div>
   ```

### Tauri 后端开发

#### 目录结构

```
src-tauri/src/
├── main.rs         # 应用入口
├── commands.rs     # Tauri 命令
├── server.rs       # 服务器管理
├── tray.rs         # 系统托盘
├── app_menu.rs     # 应用菜单
└── logger.rs       # 日志管理
```

#### 添加新的 Tauri Command

1. 在 `src-tauri/src/commands.rs` 添加函数:
   ```rust
   #[tauri::command]
   pub async fn your_command(
       state: State<'_, AppState>,
   ) -> Result<YourType, String> {
       // 实现逻辑
       Ok(result)
   }
   ```

2. 在 `src-tauri/src/main.rs` 注册命令:
   ```rust
   .invoke_handler(tauri::generate_handler![
       // ... existing commands
       commands::your_command,
   ])
   ```

3. 在前端调用:
   ```typescript
   import { invoke } from '@tauri-apps/api/tauri'

   const result = await invoke('your_command', { /* params */ })
   ```

### Relay Server 开发

#### 目录结构

```
crates/
├── relay-core/                   # 核心 Traits
├── relay-claude/                 # Claude 实现
├── relay-gemini/                 # Gemini 实现
├── relay-codex/                  # Codex 实现
├── relay-openai-to-anthropic/    # OpenAI 转换
└── relay-server/                 # HTTP 服务器
```

#### 修改 Relay Server 代码

1. 编辑 `crates/` 下的代码
2. 重新构建:
   ```bash
   npm run build:server:release
   ```
3. 重启应用以加载新的二进制

#### 添加新的账户类型

1. 在 `crates/relay-core/src/config.rs` 添加账户类型
2. 创建新的 crate (例如 `relay-newplatform/`)
3. 实现 `Account` 和 `Forwarder` traits
4. 在 `relay-server` 中集成新账户类型

## 二进制查找顺序

应用启动时会按以下顺序查找 `cc-relay-server` 二进制：

1. **环境变量** `CC_RELAY_BIN_PATH` 指定的路径（开发者自定义）
2. **相对于可执行文件** - 向上遍历目录查找 `target/release/cc-relay-server`
3. **相对于可执行文件** - 向上遍历目录查找 `target/debug/cc-relay-server`
4. **当前工作目录** - `./target/release/cc-relay-server`
5. **当前工作目录** - `./target/debug/cc-relay-server`
6. **系统 PATH** - `cc-relay-server`

### 设置自定义二进制路径

开发时，可以设置环境变量指定二进制位置：

```bash
export CC_RELAY_BIN_PATH=/path/to/cc-relay-server
npm run tauri:dev
```

## 配置文件

### 开发模式配置

开发模式下，应用会在以下位置查找配置文件：

1. 应用数据目录 (优先)
   - macOS: `~/Library/Application Support/com.claude-relay.app/config.toml`
   - Windows: `%APPDATA%\com.claude-relay.app\config.toml`
   - Linux: `~/.config/claude-relay/config.toml`

2. 当前目录 (备选)
   - `./config.toml`

### 使用示例配置

```bash
# 复制示例配置
cp config.example.toml config.toml

# 编辑配置文件
vim config.toml
```

## 调试

### 前端调试

1. **Chrome DevTools**: 在 Tauri 窗口中右键 → Inspect Element
2. **Console Logs**: 使用 `console.log()` 输出调试信息
3. **React DevTools**: 安装浏览器扩展进行组件调试

### Tauri 后端调试

1. **日志输出**: 使用 `eprintln!()` 或 `log_manager.log()`
2. **查看日志**: 在应用的 Logs 页面查看
3. **Rust 调试器**: 使用 VSCode 的 Rust Analyzer + CodeLLDB

配置 `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Development Debug",
      "cargo": {
        "args": [
          "build",
          "--manifest-path=./src-tauri/Cargo.toml",
          "--no-default-features"
        ]
      },
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

### Relay Server 调试

1. **直接运行 binary**:
   ```bash
   cargo build --release
   ./target/release/cc-relay-server --config config.toml
   ```

2. **查看日志**: 设置 `RUST_LOG` 环境变量
   ```bash
   RUST_LOG=debug ./target/release/cc-relay-server --config config.toml
   ```

3. **使用 rust-lldb**:
   ```bash
   rust-lldb ./target/debug/cc-relay-server
   ```

## 打包发布

### 准备发布

1. **更新版本号**
   - `package.json` - 前端版本
   - `src-tauri/Cargo.toml` - Tauri 版本
   - `src-tauri/tauri.conf.json` - 应用版本

2. **构建 Relay Server (Release 模式)**
   ```bash
   npm run build:server:release
   ```

3. **测试功能**
   - 启动服务器
   - 测试所有账户类型
   - 测试跨平台功能

### 打包应用

```bash
# 打包当前平台
npm run tauri:build

# 打包产物位置：
# macOS: src-tauri/target/release/bundle/macos/
# Windows: src-tauri/target/release/bundle/msi/
# Linux: src-tauri/target/release/bundle/appimage/
```

### 跨平台打包

- **macOS**: 只能在 macOS 上打包
- **Windows**: 只能在 Windows 上打包
- **Linux**: 只能在 Linux 上打包

建议使用 CI/CD (如 GitHub Actions) 进行跨平台自动构建。

## 故障排除

### 问题：找不到 cc-relay-server

**症状**: 启动服务器时提示 "Failed to find cc-relay-server binary"

**解决方案**:
```bash
# 确保已构建 relay-server
npm run build:server

# 或设置环境变量
export CC_RELAY_BIN_PATH=/path/to/cc-relay-server
npm run tauri:dev
```

### 问题：端口已被占用

**症状**: 启动失败，提示 "Port 3000 is already in use"

**解决方案**:
```bash
# macOS/Linux: 查找占用端口的进程
lsof -i :3000
kill -9 <PID>

# Windows: 查找并终止进程
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 问题：前端编译失败

**症状**: `npm run dev` 或 `npm run tauri:dev` 失败

**解决方案**:
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 清理 Vite 缓存
rm -rf node_modules/.vite
```

### 问题：Rust 编译错误

**症状**: Cargo 编译失败

**解决方案**:
```bash
# 清理 Rust 构建缓存
cargo clean

# 更新 Rust
rustup update

# 重新构建
cargo build --release
```

### 问题：Tauri 开发模式白屏

**症状**: Tauri 窗口打开但显示白屏

**解决方案**:
1. 检查 Vite 开发服务器是否正常运行 (http://localhost:5173)
2. 检查控制台是否有错误
3. 尝试清理缓存：
   ```bash
   rm -rf node_modules/.vite
   npm run tauri:dev
   ```

### 问题：macOS 通知不显示

**症状**: 启动服务器后没有收到通知

**解决方案**: 参考 [NOTIFICATION_SETUP.md](./NOTIFICATION_SETUP.md)

## 开发工具推荐

### 编辑器

- **VSCode** (推荐)
  - 扩展: Rust Analyzer, ESLint, Prettier, Tailwind CSS IntelliSense
- **JetBrains IDE**
  - WebStorm (前端) + RustRover/CLion (后端)

### 调试工具

- **Chrome DevTools** - 前端调试
- **Rust Analyzer** - Rust 代码分析
- **CodeLLDB** - Rust 调试器
- **React DevTools** - React 组件调试

### 实用工具

- **Postman** / **curl** - API 测试
- **DB Browser for SQLite** - 数据库查看
- **Process Explorer** (Windows) / **Activity Monitor** (macOS) - 进程监控

## 贡献指南

### 提交代码

1. Fork 项目
2. 创建特性分支: `git checkout -b feature/your-feature`
3. 提交更改: `git commit -m 'Add some feature'`
4. 推送分支: `git push origin feature/your-feature`
5. 提交 Pull Request

### 代码规范

- **TypeScript**: 使用 ESLint + Prettier
- **Rust**: 使用 `cargo fmt` 和 `cargo clippy`
- **提交信息**: 使用清晰的描述性信息

### 测试

提交 PR 前，请确保：
- [ ] 代码通过 lint 检查
- [ ] 功能在开发模式下正常工作
- [ ] 功能在打包版本中正常工作
- [ ] 跨平台功能已测试（如适用）

## 相关资源

- [Tauri 文档](https://tauri.app/v1/guides/)
- [React 文档](https://react.dev/)
- [Rust 文档](https://doc.rust-lang.org/)
- [Axum 文档](https://docs.rs/axum/)
- [原项目仓库](https://github.com/wakaka6/claude-code-relay)

## 获取帮助

如果遇到问题：

1. 查看 [常见问题](#故障排除)
2. 搜索现有 [Issues](../../issues)
3. 创建新的 Issue 并提供：
   - 问题描述
   - 复现步骤
   - 错误日志
   - 系统环境信息
