# Claude Code Relay Desktop

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-1.6-blue.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)

**English | [简体中文](./README.md)**

A cross-platform desktop client for [claude-code-relay](https://github.com/wakaka6/claude-code-relay), built with Tauri + React + TypeScript, providing a modern graphical interface.

## ✨ Features

### 🎨 Modern Interface
- **Responsive Design** - Adapts to various screen sizes
- **Dark/Light Theme** - Auto-follow system or manual toggle
- **Bilingual** - Full i18n support (English/Chinese)
- **Smooth Animations** - Elegant transitions

### 🚀 Core Features
- **One-Click Start/Stop** - Graphical relay-server process management
- **Visual Configuration** - No need to manually edit TOML files
- **Account Management** - Batch manage multiple AI accounts
- **Real-time Logs** - Colorized log output with auto-scroll
- **Usage Statistics** - Token usage visualization
- **Port Conflict Handling** - Auto-detect and kill occupying processes

### 🔧 System Integration
- **System Tray** - Minimize to tray, quick access
- **Auto-start** - Optional startup on system boot
- **Process Management** - Full control over relay-server lifecycle
- **Config Persistence** - Auto-save application settings

## 📦 Installation

### Download from Releases

Visit the [Releases](../../releases) page to download installers for your platform:

- **Windows**: `.msi` installer
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` / `.deb` / `.rpm`

### Build from Source

**Prerequisites**:
- Node.js 18+
- Rust 1.75+
- Tauri CLI

```bash
# 1. Clone repository
git clone https://github.com/your-username/claude-relay-desktop.git
cd claude-relay-desktop/tauri

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run tauri:dev

# 4. Build production version
npm run tauri:build
```

## 🚀 Quick Start

### 1. First Launch

On first launch, a config file will be created automatically:
- **Windows**: `%APPDATA%\com.claude-relay.app\config.toml`
- **macOS**: `~/Library/Application Support/com.claude-relay.app/config.toml`
- **Linux**: `~/.config/com.claude-relay.app/config.toml`

### 2. Configure Accounts

Go to **Settings** page:

1. Click **Add Account**
2. Select account type (Claude API / Claude OAuth / Gemini / OpenAI Responses)
3. Fill in account information
4. Set priority and enabled status
5. Click **Save Config**

### 3. Start Service

Click the **Start** button on the **Dashboard** page:

```
✓ Server started successfully
  Running on port: 3000
```

### 4. Use the API

Configure Claude Code CLI:

```bash
# Method 1: Environment variable
export ANTHROPIC_BASE_URL=http://127.0.0.1:3000

# Method 2: Config file
claude config set api_url http://127.0.0.1:3000
```

## 📖 Feature Guide

### Dashboard

- **Service Status** - Real-time display of running status and port
- **Quick Actions** - Start/Stop/Restart server
- **Statistics** - Account count, active accounts

### Account Management

- **Account List** - View all configured accounts
- **Batch Operations** - Enable/disable multiple accounts
- **Priority Adjustment** - Drag to sort or manually set
- **Account Types**:
  - Claude API Key
  - Claude OAuth (Claude Code CLI)
  - Gemini (Google OAuth)
  - OpenAI Responses (Codex)

### Usage Statistics

- **Token Usage** - Statistics by account for input/output tokens
- **Time Range** - 7 days / 30 days / 90 days / 365 days
- **Visual Charts** - Bar charts showing usage proportion
- **Export** - Export to CSV file
- **Database Info** - Display database path and size

### Logs

- **Real-time Logs** - Server output displayed in real-time
- **Color Highlighting** - Different colors for errors/warnings/info
- **Auto-scroll** - New logs auto-scroll to bottom
- **Clear Logs** - One-click to clear current logs

### Settings

**Server Configuration**:
- Listen address and port
- Database path
- Log level
- API Keys management

**Session Configuration**:
- Sticky Session TTL
- Renewal threshold
- Account cooldown time

**App Settings**:
- Language switch (Chinese/English)
- Theme switch (Light/Dark/System)
- Auto-start on boot

## 🔥 Advanced Features

### Auto Port Conflict Handling

When a port is occupied, the app will:

1. **Auto-detect** the occupying process (name, PID)
2. **Show confirmation** "Port 3000 is occupied by xxx, kill it?"
3. **Auto-terminate** Kill the process after user confirmation
4. **Restart** Automatically restart the server

### Token Usage Statistics

v0.2.2 new feature, fully integrated into desktop app:

- **Real-time Stats** - Auto-record each API call
- **Group by Account** - Clearly see consumption per account
- **Persistent Storage** - Data saved in SQLite database
- **Data Management** - Can clean up old data

### Config Validation

Auto-validate before saving config:

```
✓ Server config valid
✓ At least one enabled account
✓ API Keys format correct
✓ Port range valid (1-65535)
```

## 📁 Project Structure

```
tauri/
├── src/                      # React frontend source
│   ├── components/           # UI components
│   │   ├── layout/          # Layout components
│   │   └── ui/              # Base UI components
│   ├── contexts/            # React Context
│   ├── i18n/                # Internationalization
│   │   └── locales/         # Language files
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Dashboard
│   │   ├── Accounts.tsx     # Account management
│   │   ├── Settings.tsx     # Settings
│   │   ├── Logs.tsx         # Logs
│   │   └── UsageStats.tsx   # Usage statistics
│   └── services/            # API services
│
├── src-tauri/               # Tauri backend source
│   ├── src/
│   │   ├── main.rs          # Entry point
│   │   ├── commands.rs      # Tauri Commands
│   │   ├── server.rs        # Server management
│   │   ├── config.rs        # Config parsing
│   │   ├── logger.rs        # Log management
│   │   ├── stats.rs         # Statistics
│   │   ├── port_utils.rs    # Port utilities
│   │   └── tray.rs          # System tray
│   └── Cargo.toml
│
├── package.json
└── README.md
```

## 🛠️ Development Guide

### Run Development Environment

```bash
# Start dev server (hot reload)
npm run tauri:dev

# Frontend only (Vite only)
npm run dev

# Type checking
npm run type-check

# Code formatting
npm run format
```

### Build Production Version

```bash
# Build for all platforms
npm run tauri:build

# Build for current platform only
npm run tauri:build -- --target current
```

### Tech Stack

**Frontend**:
- React 18
- TypeScript 5
- Vite 5
- TailwindCSS
- shadcn/ui
- React Router
- i18next

**Backend**:
- Rust 1.75+
- Tauri 1.6
- Tokio (async runtime)
- SQLx (database)
- Serde (serialization)

## ❓ FAQ

### Q: How to change database location?

A: Modify `Database Path` in **Settings → Server Config**, supports relative and absolute paths.

### Q: What if the port is occupied?

A: The app will auto-detect and prompt to kill the occupying process. You can also change the port in settings.

### Q: How to backup configuration?

A: Config file is in the app data directory, just copy `config.toml`.

### Q: Which platforms are supported?

A: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)

### Q: How to view debug logs?

A:
- Windows: Press `Ctrl+Shift+I` to open DevTools
- macOS: Press `Cmd+Option+I`
- Linux: Press `Ctrl+Shift+I`

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork this repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the [MIT](../LICENSE) License.

## 🙏 Acknowledgments

- [claude-code-relay](https://github.com/wakaka6/claude-code-relay) - Upstream core service
- [Tauri](https://tauri.app/) - Cross-platform desktop framework
- [shadcn/ui](https://ui.shadcn.com/) - Elegant UI components

## 📮 Contact

- Issues: [GitHub Issues](../../issues)
- Discussions: [GitHub Discussions](../../discussions)

---

**⭐ If this project helps you, please give it a star!**
