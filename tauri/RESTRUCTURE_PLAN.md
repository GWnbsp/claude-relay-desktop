# Claude Code Relay 项目重组方案

## 一、项目现状

### 原始作者项目
- **上游仓库**: https://github.com/wakaka6/claude-code-relay
- **最新版本**: v0.2.2 (2025-12-06)
- **项目类型**: Rust CLI 服务器，用于 Claude/Gemini/OpenAI API 中转

### 我们的增强
- **增强类型**: Tauri 桌面应用
- **功能**: 为原始 CLI 服务器提供图形化管理界面

---

## 二、重组目标

**核心原则**：最小化对作者原始代码的修改，将我们的增强作为独立模块

### 目标结构

```
claude-relay-desktop/
├── crates/                        # 作者的原始代码（保持不变）⭐
│   ├── relay-core/
│   ├── relay-claude/
│   ├── relay-gemini/
│   ├── relay-codex/
│   ├── relay-openai-to-anthropic/
│   └── relay-server/
│       ├── migrations/            # v0.2.0+ 数据库迁移
│       └── src/
│           ├── main.rs           # 生成 cc-relay-server 二进制
│           └── ...
│
├── tauri/                         # 我们的桌面应用（独立模块）⭐
│   ├── src/                      # React 前端
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   └── ...
│   ├── src-tauri/                # Tauri 后端
│   │   ├── src/
│   │   │   ├── main.rs          # 桌面应用入口
│   │   │   ├── server.rs        # 管理 cc-relay-server 进程
│   │   │   └── ...
│   │   └── Cargo.toml           # 独立 workspace
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
│
├── Cargo.toml                    # 作者的原始 workspace 配置
├── config.example.toml           # 作者的原始配置
├── README.md                     # 作者的原始文档
├── CHANGELOG.md                  # 作者的原始更新日志
├── Dockerfile                    # 作者的 Docker 支持
└── ...                           # 其他作者的原始文件
```

---

## 三、项目关系

### 编译关系

```
┌─────────────────────────────────────┐
│   根目录 Cargo.toml (workspace)     │
│   members:                          │
│   - crates/relay-core               │
│   - crates/relay-claude             │
│   - crates/relay-gemini             │
│   - crates/relay-codex              │
│   - crates/relay-openai-to-anthropic│
│   - crates/relay-server   ─────┐   │
└─────────────────────────────────│───┘
                                  │
                                  │ 编译生成
                                  ▼
                       ┌──────────────────────┐
                       │  cc-relay-server     │
                       │  (位于 target/       │
                       │   release/ 或 debug/)│
                       └──────────┬───────────┘
                                  │
                                  │ 被管理
                                  ▼
┌─────────────────────────────────────┐
│  tauri/src-tauri/Cargo.toml         │
│  (独立 workspace)                   │
│                                     │
│  不引用 crates/ 的 Rust 代码        │
│  仅通过 server.rs 管理              │
│  cc-relay-server 二进制进程         │
└─────────────────────────────────────┘
```

### 运行关系

```
用户启动 Tauri 应用
    │
    ├─> Tauri 前端（React）
    │   └─> 配置管理 UI
    │   └─> 日志查看 UI
    │   └─> 账户管理 UI
    │
    └─> Tauri 后端（Rust）
        └─> server.rs
            └─> 启动/管理 cc-relay-server 子进程
                └─> 提供 API 中转服务
```

---

## 四、执行的迁移操作

### 1. 恢复作者原始结构
- ✅ 恢复 `crates/` 目录（作者的原始代码）
- ✅ 恢复根目录 `Cargo.toml`（workspace 配置指向 `crates/`）
- ✅ 恢复 `.gitignore`（不忽略 `crates/`）

### 2. 创建独立的 Tauri 模块
- ✅ 创建 `tauri/` 目录
- ✅ 移动 `src/` → `tauri/src/`（React 前端）
- ✅ 移动 `src-tauri/` → `tauri/src-tauri/`（Tauri 后端）
- ✅ 移动前端相关文件到 `tauri/`：
  - `package.json`
  - `package-lock.json`
  - `index.html`
  - `vite.config.ts`
  - `tsconfig.json`
  - `tsconfig.node.json`
  - `tailwind.config.js`
  - `postcss.config.js`

### 3. 验证编译
- ✅ 作者原始代码编译成功：
  ```bash
  cargo check --manifest-path=crates/relay-server/Cargo.toml
  ```
- ✅ Tauri 应用编译成功：
  ```bash
  cd tauri && cargo check --manifest-path=src-tauri/Cargo.toml
  ```

---

## 五、上游版本更新总结

### 当前集成版本
- **版本**: v0.2.2
- **集成日期**: 2025-12-06

### v0.1.0 → v0.2.2 主要更新

#### v0.2.0 (2025-12-04)
1. **会话持久化**：粘性会话从内存迁移到 SQLite
2. **异步调度器**：`select_account()` 改为异步
3. **可配置冷却时间**：`unavailable_cooldown_seconds`
4. **Bug 修复**：Claude API 未知 content 类型问题

#### v0.2.1 (2025-12-05)
1. **Docker 支持**：多阶段构建，amd64/arm64
2. **包管理器**：AUR、Homebrew
3. **自动化**：GitHub Actions
4. **开源许可**：MIT LICENSE

#### v0.2.2 (2025-12-06)
1. **Token 统计**：持久化使用量统计
2. **数据库迁移**：sqlx migrate 管理
3. **单元测试**：db 模块测试覆盖
4. **配置修复**：`api_keys` 位置问题

---

## 六、构建流程

### 开发环境

#### 1. 构建作者的 relay-server
```bash
# 在项目根目录
cargo build --release

# 生成 target/release/cc-relay-server(.exe)
```

#### 2. 启动 Tauri 开发环境
```bash
cd tauri
npm install
npm run dev

# Tauri 会自动：
# 1. 启动 Vite 开发服务器（前端）
# 2. 编译并运行 Tauri 后端
# 3. 后端会查找并启动 cc-relay-server
```

#### 3. 独立运行 relay-server（可选）
```bash
# 在项目根目录
./target/release/cc-relay-server --config config.toml
```

### 生产构建

#### 1. 构建 relay-server
```bash
cargo build --release
```

#### 2. 构建 Tauri 应用
```bash
cd tauri
npm run tauri build

# 生成安装包：
# - Windows: .msi / .exe
# - macOS: .dmg / .app
# - Linux: .deb / .AppImage
```

---

## 七、文件引用关系

### Tauri 如何找到 cc-relay-server

`tauri/src-tauri/src/server.rs` 中的 `resolve_binary()` 函数按以下顺序查找：

1. **环境变量** `CC_RELAY_BIN_PATH`
2. **相对路径**（开发模式）：
   - 从 `tauri/src-tauri/target/debug` 向上查找
   - 最终找到根目录的 `target/release/cc-relay-server`
3. **当前工作目录** `./target/release/cc-relay-server`
4. **Tauri 资源目录**（打包后）
5. **系统 PATH**

### 配置文件位置

- **开发环境**：根目录 `config.toml`
- **生产环境**：
  - Windows: `%APPDATA%/claude-relay/config.toml`
  - macOS: `~/Library/Application Support/claude-relay/config.toml`
  - Linux: `~/.config/claude-relay/config.toml`

---

## 八、需要的适配工作

由于我们保持了作者的原始代码不变，**无需额外适配**。但需要注意：

### 1. 配置文件格式（v0.2.2）
```toml
# api_keys 必须在 [server] 之前
api_keys = ["your-relay-key"]

[server]
host = "127.0.0.1"
port = 3000
database_path = "data/relay.db"

[session]
sticky_ttl_seconds = 3600
renewal_threshold_seconds = 300
unavailable_cooldown_seconds = 3600  # v0.2.0 新增
```

### 2. 数据库迁移（v0.2.0+）
- 迁移文件位于 `crates/relay-server/migrations/`
- 首次启动自动执行
- 包含：
  - `0001_initial_schema.sql`
  - `0002_add_client_key_hash.sql`

---

## 九、同步上游更新策略

### 定期检查
每月检查上游更新：
```bash
# 查看上游 CHANGELOG
curl https://raw.githubusercontent.com/wakaka6/claude-code-relay/main/CHANGELOG.md

# 或访问 GitHub Releases
# https://github.com/wakaka6/claude-code-relay/releases
```

### 更新流程
1. **备份当前 `crates/`**
2. **下载新版本代码**：
   ```bash
   git clone --depth 1 --branch vX.Y.Z https://github.com/wakaka6/claude-code-relay.git temp
   cp -r temp/crates/* crates/
   rm -rf temp
   ```
3. **验证编译**：
   ```bash
   cargo build --release
   ```
4. **测试 Tauri 集成**：
   ```bash
   cd tauri && npm run dev
   ```
5. **更新文档**（如有必要）

---

## 十、优势总结

### ✅ 保持独立性
- 作者的原始代码完全独立，便于同步更新
- 我们的 Tauri 增强作为独立模块，不影响原始功能

### ✅ 最小化修改
- 根目录保持作者的原始结构
- 只添加 `tauri/` 目录，不修改其他文件

### ✅ 灵活使用
- 可以独立使用作者的 CLI 工具
- 也可以使用我们的 Tauri 桌面应用
- 两者互不干扰

### ✅ 易于维护
- 上游更新只需替换 `crates/` 目录
- Tauri 应用独立演进
- 清晰的边界和职责划分

---

## 十一、相关文档

- **项目架构**: `ARCHITECTURE.md`
- **上游 CHANGELOG**: `CHANGELOG.md`
- **开发文档**: `DEVELOPMENT.md`
- **上游项目**: https://github.com/wakaka6/claude-code-relay

---

## 十二、下一步工作

### 立即
- ✅ 验证作者原始代码编译
- ✅ 验证 Tauri 应用编译
- ⏳ 完整功能测试

### 短期
- [ ] 完善 Tauri 应用文档
- [ ] 添加构建脚本
- [ ] 设置 CI/CD

### 长期
- [ ] 定期同步上游更新
- [ ] 增强桌面应用功能
- [ ] 发布桌面应用版本

---

## 总结

✅ **迁移完成**！项目现在采用双模块结构：

1. **`crates/`** - 作者的原始 relay-server（v0.2.2）
2. **`tauri/`** - 我们的桌面应用增强

这种结构最大程度保持了作者原始代码的完整性，同时为我们的增强功能提供了独立空间。两个模块通过编译产物（`cc-relay-server` 二进制）进行集成，互不干扰。
