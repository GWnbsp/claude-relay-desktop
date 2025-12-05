# 跨平台兼容性说明

本应用已针对 Windows、macOS 和 Linux 进行了全面的跨平台适配。

## ✅ 已完成的跨平台适配

### 1. 系统托盘 (System Tray)

#### macOS
- **行为**: 左键点击切换窗口显示/隐藏
- **菜单**: 使用应用菜单栏（顶部左侧），不使用托盘右键菜单
- **图标**: 使用 `icon.icns`，支持深色/浅色模式自适应

#### Windows
- **行为**: 左键点击切换窗口显示/隐藏，右键显示上下文菜单
- **菜单**: 完整的右键上下文菜单，包含服务器控制和设置
- **图标**: 使用 `icon.ico`，支持多尺寸

#### Linux
- **行为**: 与 Windows 相同
- **菜单**: 与 Windows 相同
- **图标**: 使用 `icon.png`

### 2. 应用菜单 (Application Menu)

#### macOS
- **App 菜单**: 关于、设置 (⌘,)、隐藏、退出等
- **服务器菜单**: 状态显示、启动/停止/重启控制
- **窗口菜单**: 日志、最小化、缩放
- **帮助菜单**: GitHub 链接

#### Windows/Linux
- **不使用应用菜单栏**（这些平台不支持全局菜单栏）
- 所有功能通过托盘菜单和窗口内 UI 访问

### 3. 自动启动 (Auto-start)

#### macOS
- 使用 **LaunchAgent** 机制
- 配置文件位于 `~/Library/LaunchAgents/`
- 通过 `tauri-plugin-autostart` 自动管理

#### Windows
- 使用 **注册表** 机制
- 注册表路径: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
- 通过 `tauri-plugin-autostart` 自动管理

#### Linux
- 使用 **.desktop 文件** 机制
- 配置文件位于 `~/.config/autostart/`
- 通过 `tauri-plugin-autostart` 自动管理

### 4. 通知 (Notifications)

#### macOS
- 使用 **Notification Center**
- 需要用户授权通知权限
- 支持标题、正文和图标

#### Windows
- 使用 **Windows Toast Notifications**
- Windows 10+ 自动支持
- 支持标题、正文和操作按钮

#### Linux
- 使用 **libnotify / D-Bus**
- 需要系统支持通知守护进程（如 `notify-osd`、`dunst` 等）
- 支持标题、正文和图标

### 5. 窗口行为

#### 所有平台
- **关闭窗口行为**: 可配置（退出 / 最小化到托盘）
- **最小化到托盘**: 支持所有平台
- **窗口尺寸**: 1200x800，最小 800x600

### 6. 文件路径

#### macOS
- **应用数据**: `~/Library/Application Support/com.claude-relay.app/`
- **日志文件**: `~/Library/Application Support/com.claude-relay.app/logs/app.log`
- **配置文件**: `~/Library/Application Support/com.claude-relay.app/config.toml`

#### Windows
- **应用数据**: `%APPDATA%\com.claude-relay.app\`
- **日志文件**: `%APPDATA%\com.claude-relay.app\logs\app.log`
- **配置文件**: `%APPDATA%\com.claude-relay.app\config.toml`

#### Linux
- **应用数据**: `~/.config/claude-relay/` 或 `~/.local/share/com.claude-relay.app/`
- **日志文件**: `~/.local/share/com.claude-relay.app/logs/app.log`
- **配置文件**: `~/.config/claude-relay/config.toml`

### 7. 二进制文件解析

#### Windows
- 查找 `cc-relay-server.exe`
- 支持以下路径（按优先级）:
  1. 环境变量 `CC_RELAY_BIN_PATH`
  2. 相对于可执行文件的 `../target/release/cc-relay-server.exe`
  3. 相对于可执行文件的 `../target/debug/cc-relay-server.exe`
  4. 当前工作目录 `./target/release/cc-relay-server.exe`
  5. Tauri 资源目录（打包后）
  6. 系统 PATH

#### macOS/Linux
- 查找 `cc-relay-server`（无扩展名）
- 使用与 Windows 相同的查找逻辑

### 8. 端口冲突检测

#### 所有平台
- **启动前检查**: 使用 `TcpListener::bind()` 检测端口可用性
- **启动后验证**: 等待端口开始监听（最多 10 秒）
- **错误提示**: 清晰的错误消息，指导用户解决冲突

## 🔍 测试建议

### Windows 测试清单
- [ ] 系统托盘图标显示正常
- [ ] 右键托盘菜单功能完整
- [ ] 左键点击切换窗口
- [ ] 开机自启动功能
- [ ] 通知显示正常
- [ ] 最小化到托盘
- [ ] 服务器启动/停止/重启
- [ ] 端口冲突检测

### Linux 测试清单
- [ ] 系统托盘图标显示正常（部分桌面环境可能不支持）
- [ ] 右键托盘菜单功能完整
- [ ] 左键点击切换窗口
- [ ] 开机自启动功能
- [ ] 通知显示正常（需要通知守护进程）
- [ ] 最小化到托盘
- [ ] 服务器启动/停止/重启
- [ ] 端口冲突检测

### macOS 测试清单
- [ ] 系统托盘图标显示正常
- [ ] 应用菜单栏功能完整
- [ ] 左键点击切换窗口
- [ ] 开机自启动功能
- [ ] 通知显示正常（需要授权）
- [ ] 最小化到托盘
- [ ] 服务器启动/停止/重启
- [ ] 端口冲突检测
- [ ] Cmd+Q 正确退出并清理进程

## ⚠️ 已知限制

### Linux
1. **托盘图标支持**: 某些桌面环境（如 GNOME）默认不显示系统托盘图标，需要安装扩展
2. **通知支持**: 需要系统安装并运行通知守护进程
3. **自动启动**: 某些发行版可能需要手动配置

### Windows
1. **首次运行**: Windows Defender 可能会扫描应用，导致首次启动较慢
2. **防火墙**: 首次启动服务器时可能弹出防火墙授权对话框

### macOS
1. **通知权限**: 首次使用通知功能时需要授权
2. **Gatekeeper**: 首次运行时可能需要在"系统设置 > 隐私与安全"中允许

## 🛠️ 开发环境要求

### Windows
- Windows 10 或更高版本
- Visual Studio Build Tools 或 Visual Studio
- Rust 工具链

### macOS
- macOS 10.15 或更高版本
- Xcode Command Line Tools
- Rust 工具链

### Linux
- Ubuntu 20.04+ / Fedora 36+ / Arch Linux
- 系统依赖: `webkit2gtk`, `libayatana-appindicator3-1`
- Rust 工具链

## 📦 打包说明

使用以下命令为不同平台打包：

```bash
# Windows
npm run tauri build

# macOS
npm run tauri build

# Linux (生成 .deb 和 .AppImage)
npm run tauri build
```

打包产物位于 `src-tauri/target/release/bundle/` 目录。
