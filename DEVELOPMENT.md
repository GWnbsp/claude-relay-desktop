# Claude Code Relay Desktop - 开发指南

## 开发环境设置

### 前置要求
- Node.js 18+
- Rust 1.70+
- npm 或 yarn

### 快速开始

1. **安装依赖**
```bash
npm install
```

2. **构建 relay-server 二进制**（首次运行或 relay-server 代码更新后）
```bash
npm run build:server
```

3. **启动开发服务器**
```bash
npm run tauri:dev
```

### 可用脚本

- `npm run dev` - 启动 Vite 前端开发服务器
- `npm run build` - 构建前端生产版本
- `npm run tauri:dev` - 启动 Tauri 开发模式（会自动构建 relay-server）
- `npm run tauri:build` - 打包生产版本
- `npm run build:server` - 构建 relay-server（debug 模式）
- `npm run build:server:release` - 构建 relay-server（release 模式）

## 架构说明

### 二进制查找顺序

应用启动时会按以下顺序查找 `cc-relay-server` 二进制：

1. 环境变量 `CC_RELAY_BIN_PATH` 指定的路径（开发者自定义）
2. `target/release/cc-relay-server`（生产构建）
3. `target/debug/cc-relay-server`（开发构建）
4. 系统 PATH 中的 `cc-relay-server`

### 开发模式

开发模式下，`npm run tauri:dev` 会：
1. 自动执行 `bash scripts/build-relay-server.sh`
2. 构建 `target/debug/cc-relay-server` 二进制
3. 启动 Tauri 开发服务器
4. 前端通过 Vite HMR 实现热更新

### 生产打包

生产打包时需要手动构建 relay-server：

```bash
# 1. 构建 relay-server (release 模式)
npm run build:server:release

# 2. 打包 Tauri 应用
npm run tauri:build
```

打包产物位于：
- macOS: `src-tauri/target/release/bundle/dmg/`
- Windows: `src-tauri/target/release/bundle/msi/`
- Linux: `src-tauri/target/release/bundle/appimage/`

## 故障排除

### 问题：找不到 cc-relay-server

**解决方案：**
```bash
# 确保已构建 relay-server
npm run build:server

# 或设置环境变量
export CC_RELAY_BIN_PATH=/path/to/cc-relay-server
```

### 问题：前端编译失败

**解决方案：**
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 问题：Rust 编译错误

**解决方案：**
```bash
# 清理 Rust 构建缓存
cargo clean

# 重新构建
npm run build:server
```

## 配置文件

应用首次启动时会在以下位置创建默认配置：

- macOS: `~/Library/Application Support/com.claude-relay.app/config.toml`
- Windows: `%APPDATA%\com.claude-relay.app\config.toml`
- Linux: `~/.config/claude-relay/config.toml`

也可以在应用内通过"设置"页面选择自定义配置文件位置。

## 贡献

请参考主仓库的 CONTRIBUTING.md 文件。
