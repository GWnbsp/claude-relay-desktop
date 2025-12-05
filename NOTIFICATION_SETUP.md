# macOS 通知权限设置指南

## 问题说明

在 **开发模式** 下运行 Tauri 应用时，macOS 可能不会自动弹出通知权限请求对话框。这是因为：

1. 开发版本的应用没有代码签名
2. macOS 对未签名应用的通知权限有特殊限制
3. 系统可能静默拒绝通知请求

## 解决方案

### 方案 1: 手动启用通知权限（开发模式）

1. 打开 **系统设置** (System Settings)
2. 点击 **通知** (Notifications)
3. 找到 **Claude Code Relay** 或 **终端** (Terminal)
   - 在开发模式下，通知可能关联到终端应用
4. 启用 **允许通知** (Allow Notifications)
5. 重启应用并测试通知功能

### 方案 2: 使用打包版本（推荐）

打包后的应用会有正确的代码签名和 bundle ID，可以正常请求通知权限。

#### 构建打包版本

```bash
# 构建 macOS 应用
npm run tauri build

# 应用位置
# src-tauri/target/release/bundle/macos/Claude Code Relay.app
```

#### 首次运行打包版本

1. 双击打开 `Claude Code Relay.app`
2. 如果出现安全警告，前往 **系统设置 > 隐私与安全** 点击"仍要打开"
3. 首次触发通知时，系统会弹出权限请求对话框
4. 点击 **允许** 即可

### 方案 3: 使用 `osascript` 命令测试（验证）

在终端运行以下命令来测试通知是否工作：

```bash
osascript -e 'display notification "Test notification from Claude Code Relay" with title "Server Started"'
```

如果这个命令能显示通知，说明系统通知功能正常，问题在于应用权限。

## 验证通知权限状态

### 检查系统通知中心设置

```bash
# 查看通知中心数据库
sqlite3 ~/Library/Application\ Support/NotificationCenter/db2/db <<EOF
SELECT * FROM app_info WHERE bundleid LIKE '%claude%';
EOF
```

### 查看应用的 Bundle ID

在应用运行时：

```bash
# 查找应用进程
ps aux | grep -i "claude.*relay" | grep -v grep

# 使用 lsappinfo 查看 bundle ID（如果应用正在运行）
lsappinfo info -only bundleid "Claude Code Relay"
```

## 开发模式的通知限制

在开发模式下，Tauri 应用可能使用以下 bundle ID 之一：

- `com.tauri.dev` (默认开发 ID)
- `com.claude-relay.app` (配置的 ID，但可能未生效)
- 或者直接关联到终端应用

**因此建议**：
- 开发时通过日志验证功能
- 测试通知时使用打包版本
- 或手动在系统设置中为"终端"启用通知

## 发布版本的通知

打包后的应用 (`.app` 或 `.dmg`) 会：
1. ✅ 使用正确的 bundle ID: `com.claude-relay.app`
2. ✅ 有代码签名（如果配置了签名证书）
3. ✅ 首次触发通知时自动弹出权限请求
4. ✅ 在系统设置中以"Claude Code Relay"显示

## 当前应用的通知功能

应用会在以下情况发送通知：

1. **服务器启动成功**
   ```
   标题: Server Started
   内容: Claude Code Relay server is now running on port {port}
   ```

2. **服务器启动失败**
   ```
   标题: Server Start Failed
   内容: {错误详情}
   ```

3. **服务器停止**
   ```
   标题: Server Stopped
   内容: Claude Code Relay server has been stopped
   ```

4. **服务器重启**
   ```
   标题: Server Restarting
   内容: Claude Code Relay server is restarting...
   ```

## 故障排除

### 通知完全不显示

1. 检查系统设置中"勿扰模式"是否开启
2. 检查"通知"设置中是否启用了应用通知
3. 重启通知中心守护进程：
   ```bash
   killall NotificationCenter
   ```

### 通知权限请求从未弹出

这是正常的！在开发模式下：
- 使用方案 1 手动启用权限
- 或使用方案 2 构建打包版本测试

### 打包版本也无法弹出权限请求

可能是系统已经记住了之前的决定。重置通知权限：

```bash
# 重置所有通知中心权限（谨慎使用！）
tccutil reset NotificationCenter

# 然后重启应用，再次触发通知
```

## 推荐的开发流程

1. **日常开发**: 使用开发模式，通过日志验证通知功能
2. **测试通知**: 定期构建打包版本测试完整的通知流程
3. **发布前**: 使用打包版本进行完整的用户体验测试

---

**注意**: 以上步骤适用于 macOS 13 (Ventura) 及更高版本。不同版本的 macOS 界面可能略有不同。
