# 主题切换和国际化功能设计文档

**日期**: 2025-12-05
**状态**: 已验证
**作者**: Claude & User

## 概述

为 Claude Code Relay 桌面应用添加主题切换（浅色/深色）和多语言支持（中英文），提升用户体验和现代化程度。

## 设计决策

### 用户需求
- ✅ 主题切换：浅色 / 深色 / 跟随系统
- ✅ 语言切换：中文 / 英文
- ✅ 现代化配色：科技蓝风格（类似 VS Code、GitHub）
- ✅ 跨平台支持：Windows / macOS / Linux
- ✅ 设置持久化：localStorage
- ✅ 默认行为：跟随系统主题和语言
- ✅ UI 位置：侧边栏底部（版本信息上方）

### 技术栈选择

**国际化方案**：
- **react-i18next + i18next** - 业界标准，功能完整
- 支持命名空间、插值、复数、格式化
- TypeScript 类型支持
- 体积约 40KB gzipped

**主题管理方案**：
- **自定义 useTheme hook + CSS 变量**
- 利用现有 Tailwind `darkMode: ['class']` 配置
- 原生 `window.matchMedia` API 检测系统主题
- 零额外依赖

## 架构设计

### 项目结构

```
src/
├── contexts/
│   ├── ThemeContext.tsx         # 主题上下文
│   └── AppContext.tsx           # 现有应用上下文
├── i18n/
│   ├── config.ts                # i18next 配置
│   ├── locales/
│   │   ├── zh-CN.json          # 中文翻译
│   │   └── en-US.json          # 英文翻译
│   └── types.ts                 # 类型定义
├── components/
│   ├── layout/
│   │   └── Layout.tsx          # 修改：添加切换器
│   └── ui/
│       ├── theme-toggle.tsx    # 新增：主题切换按钮
│       └── language-toggle.tsx # 新增：语言切换按钮
└── hooks/
    └── useSystemPreferences.ts  # 新增：检测系统偏好
```

### 依赖安装

```bash
npm install i18next react-i18next
npm install -D @types/i18next
```

## 主题系统设计

### ThemeContext API

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'      // 用户选择
  resolvedTheme: 'light' | 'dark'         // 实际应用的主题
  setTheme: (theme: Theme) => void
}
```

### 持久化策略

- **Storage Key**: `app-theme`
- **Default Value**: `'system'`
- **Storage Location**: localStorage

### 系统主题检测

```typescript
// 检测当前系统主题
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

// 监听系统主题变化
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', (e) => {
  if (theme === 'system') {
    applyTheme(e.matches ? 'dark' : 'light')
  }
})
```

### 主题应用方式

使用 Tailwind 的 `class` 策略：
- **Light mode**: 移除 `<html>` 的 `dark` class
- **Dark mode**: 添加 `<html>` 的 `dark` class

### 科技蓝配色方案

更新 `src/index.css` 的 CSS 变量：

**浅色模式**：
```css
:root {
  --primary: 217 91% 60%;           /* #3b82f6 - 蓝色 500 */
  --primary-foreground: 0 0% 100%;  /* 白色文字 */
  --background: 0 0% 100%;          /* 纯白背景 */
  --foreground: 222 47% 11%;        /* 深灰文字 */
  --card: 0 0% 100%;
  --border: 214 32% 91%;            /* 浅灰边框 */
  --muted: 210 40% 96%;             /* 浅灰背景 */
  /* ... */
}
```

**深色模式**：
```css
.dark {
  --primary: 213 94% 68%;           /* #60a5fa - 蓝色 400（更亮）*/
  --primary-foreground: 222 47% 11%; /* 深色文字 */
  --background: 222 47% 11%;        /* #1e293b - 深色背景 */
  --foreground: 210 40% 98%;        /* 浅色文字 */
  --card: 217 33% 17%;              /* #1e293b - 卡片背景 */
  --border: 217 33% 17%;            /* 深色边框 */
  --muted: 217 33% 17%;             /* 深色次要背景 */
  /* ... */
}
```

### 避免闪烁（FOUC）

在 `index.html` 的 `<head>` 中添加阻塞脚本：

```html
<script>
  (function() {
    const theme = localStorage.getItem('app-theme') || 'system';
    const isDark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  })();
</script>
```

## 国际化系统设计

### i18next 配置

```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';

const defaultLanguage = (() => {
  const saved = localStorage.getItem('app-language');
  if (saved) return saved;

  const systemLang = navigator.language;
  return systemLang.startsWith('zh') ? 'zh-CN' : 'en-US';
})();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS }
    },
    lng: defaultLanguage,
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

### 翻译文件结构

采用扁平化结构，按功能模块组织：

**zh-CN.json**：
```json
{
  "common": {
    "appName": "Claude Code Relay",
    "version": "版本"
  },
  "nav": {
    "dashboard": "仪表盘",
    "accounts": "账户管理",
    "settings": "设置",
    "logs": "日志"
  },
  "theme": {
    "light": "浅色",
    "dark": "深色",
    "system": "跟随系统",
    "toggle": "切换主题"
  },
  "language": {
    "chinese": "中文",
    "english": "English",
    "toggle": "切换语言"
  }
}
```

**en-US.json**：
```json
{
  "common": {
    "appName": "Claude Code Relay",
    "version": "Version"
  },
  "nav": {
    "dashboard": "Dashboard",
    "accounts": "Accounts",
    "settings": "Settings",
    "logs": "Logs"
  },
  "theme": {
    "light": "Light",
    "dark": "Dark",
    "system": "System",
    "toggle": "Toggle Theme"
  },
  "language": {
    "chinese": "中文",
    "english": "English",
    "toggle": "Toggle Language"
  }
}
```

### 使用方式

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('nav.dashboard')}</h1>
      <button onClick={() => i18n.changeLanguage('en-US')}>
        {t('language.toggle')}
      </button>
    </div>
  );
}
```

### 持久化策略

- **Storage Key**: `app-language`
- **Default Value**: 自动检测（`zh` 开头 → `zh-CN`，否则 → `en-US`）
- **Storage Location**: localStorage

## UI 组件设计

### 侧边栏布局

```
┌─────────────────────────┐
│  Claude Code Relay      │  ← Logo
├─────────────────────────┤
│  📊 仪表盘              │
│  👥 账户管理            │  ← Navigation
│  ⚙️  设置               │
│  📄 日志                │
├─────────────────────────┤
│  [🌞/🌙] [中/En]       │  ← 新增：切换器
│  版本 0.1.0            │  ← Footer
└─────────────────────────┘
```

### 主题切换组件 (theme-toggle.tsx)

**功能**：
- 图标按钮：太阳 ☀️（浅色）/ 月亮 🌙（深色）/ 自动（系统）
- 使用 Radix UI DropdownMenu 展示三个选项
- 当前选中项显示对勾 ✓
- 平滑的图标过渡动画

**交互流程**：
1. 点击按钮打开下拉菜单
2. 显示三个选项：浅色 / 深色 / 跟随系统
3. 选择后立即应用并保存到 localStorage

**实现要点**：
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      {resolvedTheme === 'light' ? <Sun /> : <Moon />}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => setTheme('light')}>
      {theme === 'light' && <Check />} 浅色
    </DropdownMenuItem>
    {/* ... */}
  </DropdownMenuContent>
</DropdownMenu>
```

### 语言切换组件 (language-toggle.tsx)

**功能**：
- 文本按钮：显示当前语言代码（"中" / "En"）
- 使用 DropdownMenu 展示两个选项（易于扩展）
- 当前选中项显示对勒 ✓

**交互流程**：
1. 点击按钮打开下拉菜单
2. 显示两个选项：中文 / English
3. 选择后立即切换，整个应用更新文本

**实现要点**：
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      {i18n.language === 'zh-CN' ? '中' : 'En'}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => changeLanguage('zh-CN')}>
      {i18n.language === 'zh-CN' && <Check />} 中文
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => changeLanguage('en-US')}>
      {i18n.language === 'en-US' && <Check />} English
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 样式风格

- 使用 shadcn/ui 的 Button 组件
- 小尺寸（`size="sm"`），紧凑布局
- `variant="ghost"` 保持简洁
- 与侧边栏整体风格一致

## Context 初始化顺序

```tsx
// src/main.tsx
<React.StrictMode>
  <ThemeProvider>
    <AppProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProvider>
  </ThemeProvider>
</React.StrictMode>
```

**注意**：
- i18next 通过 `config.ts` 导入即可自动初始化，不需要额外 Provider
- ThemeProvider 在最外层，确保主题最先应用
- AppProvider 包裹应用业务逻辑

## 翻译覆盖范围

需要翻译的内容：
- ✅ 导航菜单项
- ✅ 页面标题和描述
- ✅ 按钮和表单标签
- ✅ Toast 通知消息
- ✅ 错误和成功提示
- ✅ 对话框文本
- ❌ 日志内容（保持原始格式）
- ❌ API 响应数据（后端控制）

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| localStorage 不可用 | 回退到内存状态，应用关闭后丢失偏好 |
| 系统主题检测失败 | 默认浅色模式 |
| 系统语言无法识别 | 默认英文 |
| 翻译键缺失 | 显示键名，i18next 会在控制台警告 |

## 实现检查清单

### 阶段 1：基础设施
- [ ] 安装依赖：i18next, react-i18next
- [ ] 创建 ThemeContext 和 ThemeProvider
- [ ] 创建 i18n 配置文件
- [ ] 创建翻译文件（zh-CN.json, en-US.json）
- [ ] 在 index.html 添加防闪烁脚本

### 阶段 2：UI 组件
- [ ] 创建 ThemeToggle 组件
- [ ] 创建 LanguageToggle 组件
- [ ] 更新 Layout.tsx 添加切换器

### 阶段 3：配色更新
- [ ] 更新 index.css 的浅色模式配色（科技蓝）
- [ ] 更新 index.css 的深色模式配色（科技蓝）

### 阶段 4：翻译覆盖
- [ ] 翻译导航菜单
- [ ] 翻译 Dashboard 页面
- [ ] 翻译 Accounts 页面
- [ ] 翻译 Settings 页面
- [ ] 翻译 Logs 页面
- [ ] 翻译所有 Toast 消息

### 阶段 5：测试
- [ ] 测试主题切换（浅色/深色/系统）
- [ ] 测试语言切换（中文/英文）
- [ ] 测试系统主题跟随
- [ ] 测试系统语言检测
- [ ] 测试持久化（刷新后保持设置）
- [ ] 测试无闪烁加载
- [ ] 在 Windows/Mac/Linux 上测试

## 总结

这个设计提供了：
1. **专业的国际化方案** - react-i18next 提供完整的 i18n 能力
2. **灵活的主题系统** - 支持浅色/深色/跟随系统
3. **现代化配色** - 科技蓝风格，高对比度，可读性强
4. **优秀的用户体验** - 无闪烁、自动检测、持久化
5. **跨平台支持** - Windows/Mac/Linux 完全兼容
6. **可扩展性** - 易于添加新语言和主题

实现完成后，用户将获得一个现代化、专业的桌面应用体验。
